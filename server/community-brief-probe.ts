/**
 * Community-Brief Production Probe — active health monitoring for the live
 * public Community Impact Analyzer.
 *
 * WHY THIS EXISTS:
 * The analyzer's original outage was a login-wall regression that 401'd every
 * anonymous visitor IN PRODUCTION.  The dev-gate (verify-community-brief-e2e.ts)
 * only catches it before ship; if the production environment diverges (bad env
 * var, deploy-time auth regression, upstream rate-limit) the first notification
 * was a user complaint.  This module closes that gap.
 *
 * Every 30 minutes in production it performs a real anonymous POST against the
 * live site and fails loudly (email via Resend) on any of the silent-breakage
 * modes the original incident exposed:
 *
 *   • 401/403    → login wall regression (the original production outage)
 *   • 429-loop   → rate limiter starving even a single honest anonymous call
 *   • 5xx        → Census/AI upstream path broken
 *   • hollow 200 → AI narrative path silently failed
 *   • stale genAt → server served a cache entry instead of running the live pipe
 *
 * CACHE-MISS STRATEGY:
 * The production anonymous cache key is `${location}|${populationSize}|${timeHorizon}`.
 * The dev-only X-Cache-Skip bypass is not available in production.  Instead,
 * each probe cycle uses a different populationSize drawn from a rotating set of
 * 8 distinct values — guaranteeing a cache miss on every run.  This causes the
 * server to run a full, live Census + AI build, and we assert freshness via
 * the response's `generatedAt` timestamp.
 *
 * ALERT DEDUPLICATION:
 * Emails fire only on *transitions* — DOWN fires once when the failure threshold
 * is crossed, not on every subsequent failing cycle; RECOVERED fires once when
 * the first passing cycle follows a down period.
 *
 * Production URL resolution order:
 *   1. COMMUNITY_BRIEF_PROBE_URL env var (explicit override)
 *   2. First hostname in REPLIT_DOMAINS (the .replit.app deployment domain)
 *   3. Skipped — no URL means no probe (dev containers without REPLIT_DOMAINS)
 */

import { sendEcosystemUpdate } from "./email-service";
import { db } from "./storage";
import { probeAlertFailures } from "@shared/schema";

// ── Probe constants ──────────────────────────────────────────────────────────

const PROBE_ZIP = "78660"; // Pflugerville, TX — known-good ZCTA
const PROBE_TIME_HORIZON = 25;
const PROBE_PATH = "/api/conductor/community-brief";
const PROBE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
// Census + AI can take up to ~60 s; give generous headroom
const PROBE_TIMEOUT_MS = 90_000;
// Extra window for freshness check (network RTT + server processing)
const FRESHNESS_GRACE_MS = 120_000;
const INITIAL_DELAY_MS = 60_000; // 60 s after boot — let the server settle first

// Email only after this many consecutive failures (avoids transient noise)
const FAILURE_THRESHOLD = 2;

/**
 * Rotating populationSize values.  Each probe cycle picks a different entry
 * from this list (by cycle index mod length), ensuring a distinct cache key
 * every time — so the server runs a live Census + AI build, not a cache hit.
 * All values are plausible for the probe ZIP to avoid distorting Census math.
 */
export const PROBE_POPULATION_VARIANTS = [
  9_800, 9_850, 9_900, 9_950, 10_050, 10_100, 10_150, 10_200,
];

// ── Module state ─────────────────────────────────────────────────────────────

let probeIndex = 0;
let consecutiveFailures = 0;
let wasDown = false;
let lastProbeResult: { ok: boolean; detail: string; ts: string } | null = null;

export function getLastBriefProbeResult() {
  return lastProbeResult;
}

// ── Exported for unit-testing ─────────────────────────────────────────────────

export interface ProbeOutcome {
  ok: boolean;
  detail: string;
}

/**
 * Evaluate a raw HTTP response (status + body text) and a timestamp captured
 * *before* the request was issued.  Returns `{ ok, detail }`.
 *
 * Exported so the unit-test suite can drive it with mocked responses without
 * starting a real HTTP server.
 */
export function evaluateProbeResponse(
  status: number,
  text: string,
  requestedAtMs: number,
  populationSize: number
): ProbeOutcome {
  if (status === 401 || status === 403) {
    return { ok: false, detail: `${status} — the public analyzer is behind a login wall (the original production outage pattern)` };
  }
  if (status === 429) {
    return { ok: false, detail: `429 — rate limiter is starving anonymous callers; a single honest probe cannot complete` };
  }
  if (status >= 500) {
    return { ok: false, detail: `${status} — upstream (Census/AI) path broken: ${text.slice(0, 300)}` };
  }
  if (status < 200 || status >= 300) {
    return { ok: false, detail: `unexpected HTTP ${status}: ${text.slice(0, 200)}` };
  }

  let brief: any;
  try {
    brief = JSON.parse(text);
  } catch {
    return { ok: false, detail: `200 but response is not valid JSON: ${text.slice(0, 150)}` };
  }

  // ── Structural checks ────────────────────────────────────────────────────
  const missing: string[] = [];
  if (typeof brief.narrative !== "string" || brief.narrative.trim().length < 100) {
    missing.push(`narrative (${typeof brief.narrative === "string" ? brief.narrative.trim().length + " chars" : typeof brief.narrative} — AI path broken or hollow)`);
  }
  if (typeof brief.overallScore !== "number") missing.push("overallScore");
  if (!brief.systemsScores || typeof brief.systemsScores !== "object" || Object.keys(brief.systemsScores).length === 0) {
    missing.push("systemsScores");
  }
  if (!brief.demographics || typeof brief.demographics.povertyRate !== "number") {
    missing.push("demographics.povertyRate (Census data path)");
  }
  if (missing.length > 0) {
    return { ok: false, detail: `200 but brief is hollow — missing: ${missing.join("; ")}` };
  }

  // ── Freshness assertion ──────────────────────────────────────────────────
  // The probe sends a unique populationSize each cycle so the server cannot
  // serve a cached answer — it must run a live Census + AI build.  We prove
  // that happened by asserting generatedAt >= requestedAt (minus grace window
  // for probe network RTT + server processing time).
  const rawGenAt: string | undefined = brief.generatedAt ?? brief.geography?.generatedAt;
  if (!rawGenAt) {
    return { ok: false, detail: `200 but generatedAt is missing — cannot confirm the live Census + AI pipeline ran` };
  }
  const genMs = new Date(rawGenAt).getTime();
  if (!Number.isFinite(genMs)) {
    return { ok: false, detail: `generatedAt "${rawGenAt}" is not a valid ISO timestamp — cannot verify pipeline freshness` };
  }
  const staleCutoffMs = requestedAtMs - FRESHNESS_GRACE_MS;
  if (genMs < staleCutoffMs) {
    return {
      ok: false,
      detail: `Pipeline freshness FAILED: generatedAt (${rawGenAt}) predates probe start minus grace window ` +
        `(${new Date(staleCutoffMs).toISOString()}) — the server served a stale cache entry despite the ` +
        `unique populationSize=${populationSize} probe param.`,
    };
  }

  return {
    ok: true,
    detail: `200; narrative ${brief.narrative.trim().length} chars; ${Object.keys(brief.systemsScores).length} systems; ` +
      `poverty ${brief.demographics.povertyRate}%; generatedAt=${rawGenAt}`,
  };
}

/**
 * Advance the state machine by one probe outcome and return which alert, if
 * any, should be sent.  Exported for unit-testing.
 *
 * @param ok         Whether the probe passed
 * @returns          "down" | "recovered" | null
 */
export function advanceProbeState(ok: boolean): "down" | "recovered" | null {
  if (ok) {
    const wasDownSnapshot = wasDown;
    consecutiveFailures = 0;
    wasDown = false;
    return wasDownSnapshot ? "recovered" : null;
  }
  consecutiveFailures++;
  if (consecutiveFailures >= FAILURE_THRESHOLD && !wasDown) {
    wasDown = true;
    return "down";
  }
  return null;
}

/** Reset module state — for unit-testing only. */
export function _resetProbeState(): void {
  probeIndex = 0;
  consecutiveFailures = 0;
  wasDown = false;
  lastProbeResult = null;
}

// ── URL resolution ────────────────────────────────────────────────────────────

export function resolveProbeBase(): string | null {
  if (process.env.COMMUNITY_BRIEF_PROBE_URL) {
    return process.env.COMMUNITY_BRIEF_PROBE_URL.replace(/\/$/, "");
  }
  const domains = process.env.REPLIT_DOMAINS;
  if (!domains) return null;
  const primary = domains.split(",")[0].trim();
  return primary ? `https://${primary}` : null;
}

// ── Single probe run ──────────────────────────────────────────────────────────

async function runProbe(base: string, populationSize: number): Promise<ProbeOutcome> {
  const url = `${base}${PROBE_PATH}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const requestedAtMs = Date.now();

  let status = 0;
  let text = "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // No X-Cache-Skip — dev-only header, ignored by production server anyway.
      // Cache miss is guaranteed by the rotating populationSize strategy.
      body: JSON.stringify({
        location: PROBE_ZIP,
        populationSize,
        timeHorizon: PROBE_TIME_HORIZON,
      }),
      signal: controller.signal,
    });
    status = res.status;
    text = await res.text();
  } catch (err: any) {
    clearTimeout(timer);
    const msg = err?.name === "AbortError"
      ? `request timed out after ${PROBE_TIMEOUT_MS / 1000}s`
      : (err?.message || String(err));
    return { ok: false, detail: `network error: ${msg}` };
  } finally {
    clearTimeout(timer);
  }

  return evaluateProbeResponse(status, text, requestedAtMs, populationSize);
}

// ── Alert email failure persistence ───────────────────────────────────────────

/**
 * Write a row to probe_alert_failures so the admin UI can surface email send
 * failures without requiring anyone to tail logs.  Swallows its own errors so
 * a DB write failure never crashes the probe cycle.
 */
async function recordProbeAlertFailure(
  alertType: "down" | "recovery",
  subject: string,
  err: unknown,
): Promise<void> {
  const errorMessage = (err as any)?.message
    ? String((err as any).message).slice(0, 1000)
    : String(err).slice(0, 1000);
  try {
    await db.insert(probeAlertFailures).values({ alertType, subject, errorMessage });
  } catch (dbErr: any) {
    console.error("[brief-probe] Could not persist alert failure to DB:", dbErr?.message || dbErr);
  }
}

// ── Alert emails ──────────────────────────────────────────────────────────────

async function sendDownAlert(base: string, detail: string, consecutive: number): Promise<void> {
  const subject = `[ALERT] Community Brief analyzer is DOWN in production (${consecutive} consecutive failures)`;
  const html = `
    <div style="max-width:600px;font-family:Arial,sans-serif">
      <div style="background:#dc3545;color:white;padding:16px;border-radius:6px 6px 0 0">
        <h2 style="margin:0;font-size:18px">Community Impact Analyzer — PRODUCTION DOWN</h2>
        <p style="margin:6px 0 0;font-size:13px;opacity:.9">
          ${consecutive} consecutive anonymous probe${consecutive === 1 ? "" : "s"} failed
        </p>
      </div>
      <div style="padding:16px;border:1px solid #ddd;border-top:none;background:white">
        <p style="color:#c53030;font-weight:bold">
          ⚠ Anonymous visitors on the live site cannot generate a Community Impact brief.
          This is the same failure mode as the original production outage.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
          <tr>
            <td style="padding:6px 10px;color:#666;white-space:nowrap">Endpoint probed:</td>
            <td style="padding:6px 10px;font-family:monospace">${base}${PROBE_PATH}</td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:6px 10px;color:#666">ZIP tested:</td>
            <td style="padding:6px 10px">${PROBE_ZIP} (Pflugerville, TX — known-good ZCTA)</td>
          </tr>
          <tr>
            <td style="padding:6px 10px;color:#666">Failure detail:</td>
            <td style="padding:6px 10px;color:#c53030">${detail}</td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:6px 10px;color:#666">Detected at:</td>
            <td style="padding:6px 10px">${new Date().toISOString()}</td>
          </tr>
          <tr>
            <td style="padding:6px 10px;color:#666">Probe interval:</td>
            <td style="padding:6px 10px">every 30 minutes; each cycle uses a unique populationSize to bypass the anonymous cache</td>
          </tr>
        </table>
        <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;border-radius:4px;margin-top:12px">
          <strong>Recommended actions:</strong>
          <ol style="margin:8px 0 0;padding-left:18px;font-size:13px">
            <li>Check Replit deployment logs for recent errors or restarts</li>
            <li>Verify <code>NODE_ENV</code> and auth middleware — a 401 means the login-wall regression returned</li>
            <li>Check Census / OpenRouter upstream status if you see 5xx</li>
            <li>Test manually: <code>curl -s -X POST ${base}${PROBE_PATH} -H 'content-type: application/json' -d '{"location":"${PROBE_ZIP}","populationSize":9800,"timeHorizon":${PROBE_TIME_HORIZON}}'</code></li>
          </ol>
        </div>
        <p style="font-size:12px;color:#888;margin-top:16px">
          You will receive a single "all-clear" email when the probe passes again.<br/>
          Generated by the server-side community-brief production probe (server/community-brief-probe.ts).
        </p>
      </div>
    </div>
  `;
  try {
    await sendEcosystemUpdate(subject, html);
  } catch (err: any) {
    console.error("[brief-probe] Failed to send DOWN alert email:", err?.message || err);
    await recordProbeAlertFailure("down", subject, err);
  }
}

async function sendRecoveryAlert(base: string, detail: string): Promise<void> {
  const subject = `[RESOLVED] Community Brief analyzer recovered in production`;
  const html = `
    <div style="max-width:600px;font-family:Arial,sans-serif">
      <div style="background:#276749;color:white;padding:16px;border-radius:6px 6px 0 0">
        <h2 style="margin:0;font-size:18px">Community Impact Analyzer — PRODUCTION RECOVERED</h2>
        <p style="margin:6px 0 0;font-size:13px;opacity:.9">Anonymous brief is passing again</p>
      </div>
      <div style="padding:16px;border:1px solid #ddd;border-top:none;background:white">
        <p style="color:#276749;font-weight:bold">✓ The live analyzer is healthy. Anonymous visitors can generate briefs again.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
          <tr>
            <td style="padding:6px 10px;color:#666">Endpoint:</td>
            <td style="padding:6px 10px;font-family:monospace">${base}${PROBE_PATH}</td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:6px 10px;color:#666">ZIP tested:</td>
            <td style="padding:6px 10px">${PROBE_ZIP}</td>
          </tr>
          <tr>
            <td style="padding:6px 10px;color:#666">Probe result:</td>
            <td style="padding:6px 10px;color:#276749">${detail}</td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:6px 10px;color:#666">Recovered at:</td>
            <td style="padding:6px 10px">${new Date().toISOString()}</td>
          </tr>
        </table>
        <p style="font-size:12px;color:#888;margin-top:16px">
          Generated by the server-side community-brief production probe (server/community-brief-probe.ts).
        </p>
      </div>
    </div>
  `;
  try {
    await sendEcosystemUpdate(subject, html);
  } catch (err: any) {
    console.error("[brief-probe] Failed to send RECOVERY alert email:", err?.message || err);
    await recordProbeAlertFailure("recovery", subject, err);
  }
}

// ── Probe cycle ───────────────────────────────────────────────────────────────

async function probeCycle(): Promise<void> {
  const base = resolveProbeBase();
  if (!base) {
    console.log("[brief-probe] No production URL available (COMMUNITY_BRIEF_PROBE_URL and REPLIT_DOMAINS both unset) — skipping probe.");
    return;
  }

  // Rotate populationSize to guarantee a cache miss on every cycle.
  const populationSize = PROBE_POPULATION_VARIANTS[probeIndex % PROBE_POPULATION_VARIANTS.length];
  probeIndex++;

  const ts = new Date().toISOString();
  console.log(`[brief-probe] Running probe #${probeIndex} → ${base}${PROBE_PATH} (ZIP ${PROBE_ZIP}, populationSize=${populationSize})`);

  const { ok, detail } = await runProbe(base, populationSize);
  lastProbeResult = { ok, detail, ts };

  if (ok) {
    console.log(`[brief-probe] ✓ PASS #${probeIndex} (${ts}): ${detail}`);
  } else {
    console.error(`[brief-probe] ✗ FAIL #${probeIndex} (${ts}): ${detail}`);
  }

  const alert = advanceProbeState(ok);
  if (alert === "down") {
    console.error(`[brief-probe] Threshold reached (${consecutiveFailures} consecutive failures) — sending DOWN alert email.`);
    await sendDownAlert(base, detail, consecutiveFailures);
  } else if (alert === "recovered") {
    console.log("[brief-probe] Recovery detected — sending all-clear email.");
    await sendRecoveryAlert(base, detail);
  } else if (!ok) {
    console.warn(`[brief-probe] Failure ${consecutiveFailures}/${FAILURE_THRESHOLD} — waiting for next cycle before alerting.`);
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Start the recurring production probe.  Call once from server/index.ts inside
 * the `if (process.env.NODE_ENV === "production")` block.
 */
export function startCommunityBriefProbe(): void {
  const base = resolveProbeBase();
  if (!base) {
    console.log("[brief-probe] No probe URL configured — community-brief production probe will not start.");
    return;
  }

  console.log(`[brief-probe] Starting production probe against ${base} (interval: ${PROBE_INTERVAL_MS / 60_000} min, alert threshold: ${FAILURE_THRESHOLD} consecutive failures, ${PROBE_POPULATION_VARIANTS.length} rotating populationSize values to bypass anonymous cache)`);

  // First run after a short delay so the server is fully up and the Census/AI
  // path has a chance to warm up before we declare it broken.
  setTimeout(() => {
    probeCycle().catch((err) =>
      console.error("[brief-probe] initial probe crashed:", err?.message || err)
    );
  }, INITIAL_DELAY_MS);

  setInterval(() => {
    probeCycle().catch((err) =>
      console.error("[brief-probe] interval probe crashed:", err?.message || err)
    );
  }, PROBE_INTERVAL_MS);
}
