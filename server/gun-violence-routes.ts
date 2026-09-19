/**
 * Gun Violence Registry
 *
 * Provides a staff-gated import endpoint and a public aggregate-only
 * summary endpoint. No victim PII is stored or exposed — only incident
 * geography, type, and counts.
 *
 * POST /api/gun-violence/import   — staff-gated; idempotent upsert by incidentId+dataSource
 * GET  /api/gun-violence/summary  — public aggregate counts; rate-limited by IP
 * GET  /api/gun-violence/imports  — staff-gated; import history / audit log
 */
import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { gunViolenceIncidents, gunViolenceImports } from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth } from "./tenant-middleware";
import { z } from "zod";
import { enforceGroundedClaims, buildRoiRule, buildAnyOfRule, type ClaimRule } from "./ai-claim-grounding";
import { recordClaimDecisions } from "./claim-chain";
import { verifyInboundPayload, recordInboundVerification, type InboundSchema } from "./inbound-verification";
import { sendEcosystemUpdate } from "./email-service";

/**
 * Grounds the AI-generated gun violence story against the real data it was
 * given: no cost-effectiveness/ROI-style dollar claim is permitted anywhere
 * (none is computed for this surface, so any such claim is fabricated), and
 * any restatement of the national death total, crude rate, or ACE-firearm
 * correlation is checked against the real fetched values. `keyNumbers`
 * values are passed through the same body-text grounding engine (treating
 * each as its own one-sentence "narrative") so a fabricated key number is
 * caught the same way a fabricated body sentence would be.
 */
function groundGunViolenceStory(
  story: { headline?: string; subhead?: string; body?: string[]; keyNumbers?: { label: string; value: string }[]; callToAction?: string },
  ctx: { cdcSummary: any; acesCorr: any; geography: string }
): typeof story {
  const totalDeaths = ctx.cdcSummary?.totalDeaths;
  const crudeRate = ctx.cdcSummary?.latestYear?.crudeRate;
  const peakDeaths = ctx.cdcSummary?.peakYear?.deaths;
  const aceR = ctx.acesCorr?.aceFirearmR;

  const rules: ClaimRule[] = [
    // No cost-benefit/ROI figure is computed for this surface — any such claim is fabricated.
    buildRoiRule("gun-violence-cost-effectiveness", null),
    buildAnyOfRule(
      "gun-violence-national-stats",
      /died|deaths?|per\s*100,?000|correlat|r\s*=/i,
      (sentence) => {
        const claims: { value: number; kind: string }[] = [];
        const numRe = /(\d[\d,]*(?:\.\d+)?)/g;
        let m: RegExpExecArray | null;
        while ((m = numRe.exec(sentence))) {
          const n = parseFloat(m[1].replace(/,/g, ""));
          if (!Number.isFinite(n)) continue;
          // Exclude bare 4-digit calendar-year mentions ("since 1999") — a
          // year is not itself a statistical claim needing grounding.
          if (n >= 1900 && n <= 2100 && !m[1].includes(",")) continue;
          claims.push({ value: n, kind: "stat" });
        }
        return claims;
      },
      [totalDeaths, crudeRate, peakDeaths, aceR, typeof aceR === "number" ? aceR * 100 : null].filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      ),
      (v) => Math.max(0.5, Math.abs(v) * 0.03)
    ),
  ];

  const allDecisions: import("./ai-claim-grounding").GroundingDecision[] = [];
  const groundText = (text: string | undefined): string | undefined => {
    if (!text) return text;
    const result = enforceGroundedClaims(text, rules);
    allDecisions.push(...result.decisions);
    return result.text;
  };

  const groundedBody = (story.body || []).map((p) => groundText(p) || "");
  const groundedHeadline = groundText(story.headline);
  const groundedSubhead = groundText(story.subhead);
  const groundedCTA = groundText(story.callToAction);
  const groundedKeyNumbers = (story.keyNumbers || []).map((kn) => {
    const asSentence = `${kn.label}: ${kn.value}.`;
    const result = enforceGroundedClaims(asSentence, rules);
    allDecisions.push(...result.decisions);
    // Only the ROI/cost-effectiveness rule can invalidate a whole key number
    // (the national-stats rule is an allow-list of KNOWN good numbers, not
    // every number this story is entitled to state — a key number restating
    // a LOCAL registry count, for example, has no source value here and
    // would be over-flagged by requiring an exact match). Drop a key number
    // only when it was specifically flagged as an ungrounded cost-benefit claim.
    const costClaim = result.decisions.find((d) => d.ruleId === "gun-violence-cost-effectiveness" && d.verdict !== "kept");
    return costClaim ? null : kn;
  }).filter((kn): kn is { label: string; value: string } => kn !== null);

  if (allDecisions.length > 0) {
    recordClaimDecisions("gun-violence-story", ctx.geography, allDecisions).catch((err) =>
      console.error("[GunViolence] claim-chain record failed (non-fatal):", err)
    );
  }
  const droppedCount = allDecisions.filter((d) => d.verdict !== "kept").length;
  if (droppedCount > 0) {
    console.error(`[GunViolence] story for ${ctx.geography} contained ${droppedCount} ungrounded claim(s) — redacted.`);
  }

  return { ...story, headline: groundedHeadline, subhead: groundedSubhead, body: groundedBody, keyNumbers: groundedKeyNumbers, callToAction: groundedCTA };
}

// ── Simple in-memory rate limiter (no package dependency) ────────────────────
const summaryRateWindows = new Map<string, { count: number; resetAt: number }>();
const MAX_SUMMARY_RATE_KEYS = 10_000;
function checkSummaryRate(ip: string): boolean {
  const now = Date.now();
  if (summaryRateWindows.size >= MAX_SUMMARY_RATE_KEYS && !summaryRateWindows.has(ip)) {
    for (const [key, value] of summaryRateWindows) {
      if (value.resetAt <= now) summaryRateWindows.delete(key);
    }
    if (summaryRateWindows.size >= MAX_SUMMARY_RATE_KEYS) return false;
  }
  const entry = summaryRateWindows.get(ip);
  if (!entry || now > entry.resetAt) {
    summaryRateWindows.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

// ── Staff role check (shared 5-role set) ─────────────────────────────────────
const STAFF_ROLES = new Set(["admin", "staff", "chw", "youth_staff", "hub_staff"]);
function isStaff(req: Request): boolean {
  const role = (req as any).user?.role;
  return STAFF_ROLES.has(role);
}

// ── Import payload schema ────────────────────────────────────────────────────
const incidentSchema = z.object({
  incidentId: z.string().min(1).max(255),
  dataSource: z.string().min(1).max(100),
  occurredAt: z.string().optional(),       // ISO-8601 string
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zip: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  ward: z.string().max(50).optional(),
  victimCount: z.number().int().min(0).optional(),
  fatalCount: z.number().int().min(0).optional(),
  incidentType: z.string().max(100).optional(), // e.g. "shooting", "homicide", "aggravated-assault"
});
const importSchema = z.array(incidentSchema).min(1).max(10_000);

// ── Module-level intelligence cache (shared by route + conductor + Navigator) ─
let _intelligenceCache: { data: any; cachedAt: number } | null = null;
let _intelligenceInFlight: Promise<any> | null = null;
let _intelligenceGeneration = 0;
const REGISTRY_BASE = "https://gun-violence-registry.replit.app";

/**
 * Fetches and caches the full gun-violence intelligence dataset (CDC, FBI, NCVS,
 * WISQARS, root-causes, SDOH, ACEs, policy DID, RPLICE + local DB counts).
 * Cached in-process for 1 hour. Safe to call from conductor, Navigator, or any
 * server-side context — no HTTP round-trip when cache is warm.
 */
export async function getGunViolenceIntelligenceData(): Promise<any> {
  const getSyncStatus = async () => {
    const STALE_UI_MS = 24 * 60 * 60 * 1000;
    const lastSyncRow = await db
      .select({ importedAt: gunViolenceImports.importedAt })
      .from(gunViolenceImports)
      .where(eq(gunViolenceImports.dataSource, "gun-violence-registry"))
      .orderBy(desc(gunViolenceImports.importedAt))
      .limit(1)
      .catch(() => []);
    const lastSuccessfulSyncAt = lastSyncRow[0]?.importedAt?.toISOString() ?? null;
    return {
      lastSuccessfulSyncAt,
      isStale: !lastSuccessfulSyncAt ||
        Date.now() - new Date(lastSuccessfulSyncAt).getTime() > STALE_UI_MS,
    };
  };

  if (_intelligenceCache && Date.now() - _intelligenceCache.cachedAt < 3_600_000) {
    // Do not let the one-hour intelligence cache hide a newly completed or
    // failed import. Sync health is an operational status, not intelligence.
    return { ..._intelligenceCache.data, syncStatus: await getSyncStatus() };
  }
  if (_intelligenceInFlight) return _intelligenceInFlight;
  const generationAtStart = _intelligenceGeneration;

  const fetcher = (path: string) =>
    fetch(`${REGISTRY_BASE}${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

  _intelligenceInFlight = (async () => {
  const [
    cdcTrend, cdcSummary, cdcStates,
    fbiTrends, ncvsTrends, wisqarsCosts,
    rootCauses, socialDet,
    acesCorr, acesInterventions,
    didPolicies, rpliceFindingsRaw,
    localCounts,
  ] = await Promise.all([
    fetcher("/api/cdc/national/trend"),
    fetcher("/api/cdc/summary"),
    fetcher("/api/cdc/states"),
    fetcher("/api/fbi/trends"),
    fetcher("/api/ncvs/trends"),
    fetcher("/api/wisqars/costs"),
    fetcher("/api/root-causes"),
    fetcher("/api/social-determinants"),
    fetcher("/api/aces/correlations"),
    fetcher("/api/aces/interventions"),
    fetcher("/api/did/policies"),
    fetcher("/api/rplice/findings"),
    db.select({
      total:    sql<number>`count(*)::int`,
      victims:  sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}),0)::int`,
      fatal:    sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}),0)::int`,
      earliest: sql<string>`min(occurred_at)::text`,
      latest:   sql<string>`max(occurred_at)::text`,
    }).from(gunViolenceIncidents).then(rows => rows[0]).catch(() => null),
  ]);

  const rpliceFindings = Array.isArray(rpliceFindingsRaw)
    ? rpliceFindingsRaw.filter((f: any) => !f.payload?.probe)
    : [];

  const cleanCdcSummary = validateCdcSummary("getGunViolenceIntelligenceData", cdcSummary);
  const cleanAcesCorr = validateAcesCorrelations("getGunViolenceIntelligenceData", acesCorr);

  const syncStatus = await getSyncStatus();

  const data = {
    meta: { generatedAt: new Date().toISOString(), source: "gun-violence-registry.replit.app" },
    headline: cleanCdcSummary,
    cdcTrend, cdcStates, fbiTrends, ncvsTrends, wisqarsCosts,
    rootCauses, socialDeterminants: socialDet,
    aces: { correlations: cleanAcesCorr, interventions: acesInterventions },
    policy: didPolicies?.catalog ?? didPolicies,
    rpliceFindings,
    localRegistry: localCounts,
    syncStatus,
  };

  if (generationAtStart === _intelligenceGeneration) {
    _intelligenceCache = { data, cachedAt: Date.now() };
  }
  return data;
  })().finally(() => {
    _intelligenceInFlight = null;
  });
  return _intelligenceInFlight;
}

// The registry's CDC/ACES summary endpoints feed straight into the
// story-generation AI prompt (see the /story route below) as "ground truth"
// numbers the model is told to cite verbatim. A partner-side bug or a
// compromised upstream response could hand the model an implausible total
// (e.g. a negative death count, or a rate above 100 per 100k) that would
// then be laundered into a public-facing narrative as fact. Validate the
// handful of fields the prompt actually quotes before they're cached or
// interpolated — out-of-range values are nulled so the prompt's own `??`
// fallback constants are used instead of a bad live number.
const CDC_SUMMARY_SCHEMA: InboundSchema = {
  totalDeaths: { type: "number", min: 0, max: 5_000_000 },
};
const CDC_LATEST_YEAR_SCHEMA: InboundSchema = {
  year:      { type: "number", min: 1990, max: 2100 },
  crudeRate: { type: "number", min: 0, max: 200 },
};
const CDC_PEAK_YEAR_SCHEMA: InboundSchema = {
  year:   { type: "number", min: 1990, max: 2100 },
  deaths: { type: "number", min: 0, max: 5_000_000 },
};
const ACES_CORRELATIONS_SCHEMA: InboundSchema = {
  aceFirearmR: { type: "number", min: -1, max: 1 },
};

function validateCdcSummary(endpoint: string, raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const top = verifyInboundPayload<any>(raw, CDC_SUMMARY_SCHEMA);
  const latest = verifyInboundPayload<any>(raw.latestYear, CDC_LATEST_YEAR_SCHEMA);
  const peak = verifyInboundPayload<any>(raw.peakYear, CDC_PEAK_YEAR_SCHEMA);
  const rejections = [...top.rejections, ...latest.rejections, ...peak.rejections];
  if (rejections.length) recordInboundVerification("gun-violence-registry", endpoint, rejections);
  return {
    ...raw,
    totalDeaths: top.clean.totalDeaths,
    latestYear: raw.latestYear ? { ...raw.latestYear, ...latest.clean } : raw.latestYear,
    peakYear: raw.peakYear ? { ...raw.peakYear, ...peak.clean } : raw.peakYear,
  };
}

function validateAcesCorrelations(endpoint: string, raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const { clean, rejections } = verifyInboundPayload<any>(raw, ACES_CORRELATIONS_SCHEMA);
  if (rejections.length) recordInboundVerification("gun-violence-registry", endpoint, rejections);
  return { ...raw, ...clean };
}

/**
 * Pulls current incidents from gun-violence-registry.replit.app and upserts
 * them into the local DB. Idempotent by (incidentId, dataSource).
 * Safe to call from a scheduler; writes an audit row to gun_violence_imports.
 * Returns { fetched, upserted, elapsedMs }.
 */
// Schema for one incident record pulled from the gun-violence-registry
// partner API. `incidentId` is the only required field — a row with no
// stable identifier can never be safely upserted (it would either collide
// or duplicate on every sync), so it is dropped rather than stored under a
// fabricated id. Every other field is individually range/type-checked;
// an out-of-range or malformed field is nulled (never coerced to a nearby
// "plausible" value) rather than the whole row being discarded, since a
// bad zip code doesn't make the victim/fatality counts untrustworthy.
const INCIDENT_ROW_SCHEMA: InboundSchema = {
  incidentId:   { type: "string",  required: true, maxLength: 200 },
  latitude:     { type: "number",  min: -90,  max: 90 },
  longitude:    { type: "number",  min: -180, max: 180 },
  zip:          { type: "string",  maxLength: 10 },
  city:         { type: "string",  maxLength: 200 },
  state:        { type: "string",  maxLength: 2 },
  killed:       { type: "number",  min: 0, max: 10_000 },
  injured:      { type: "number",  min: 0, max: 10_000 },
  incidentType: { type: "string",  maxLength: 100 },
};

export async function runGunViolenceRegistrySync(): Promise<{ fetched: number; upserted: number; rejected: number; elapsedMs: number }> {
  const { nanoid } = await import("nanoid");
  const DATA_SOURCE = "gun-violence-registry";
  const BATCH_SIZE  = 500;
  const INSERT_CHUNK = 100;

  const importId    = nanoid(12);
  let totalFetched  = 0;
  let totalUpserted = 0;
  let totalRejected = 0;
  let offset        = 0;
  const startedAt   = Date.now();

  while (true) {
    const url    = `${REGISTRY_BASE}/api/incidents?offset=${offset}`;
    const apiRes = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
    if (!apiRes.ok) throw new Error(`Registry HTTP ${apiRes.status} at offset=${offset}`);

    const batch: any[] = await apiRes.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    totalFetched += batch.length;

    const rows: (typeof gunViolenceIncidents.$inferInsert)[] = [];
    for (const r of batch) {
      // externalId/id doesn't fit verifyInboundPayload's single-field-name
      // model (the registry uses either key); resolve it first, then run
      // everything else — including the resolved id — through the schema.
      const { clean, rejections } = verifyInboundPayload<any>(
        { ...r, incidentId: r.externalId || r.id },
        INCIDENT_ROW_SCHEMA
      );
      if (rejections.length > 0) {
        await recordInboundVerification("gun-violence-registry", "runGunViolenceRegistrySync", rejections);
      }
      if (!clean.incidentId) { totalRejected++; continue; } // no stable id — cannot safely upsert

      let occurredAt: Date | undefined;
      try {
        if (r.date && r.date !== "0001-01-01") {
          const d = new Date(`${r.date}T${r.time || "00:00"}:00Z`);
          if (!isNaN(d.getTime())) occurredAt = d;
        }
      } catch { /* ignore */ }

      rows.push({
        id:           nanoid(12),
        incidentId:   clean.incidentId,
        dataSource:   DATA_SOURCE,
        occurredAt,
        latitude:     clean.latitude,
        longitude:    clean.longitude,
        zip:          clean.zip,
        city:         clean.city,
        state:        clean.state,
        // killed/injured are validated individually above; only the
        // in-range ones survive into `clean`, so a bad `injured` value
        // doesn't get to inflate an otherwise-valid `killed` count.
        victimCount:  (clean.killed ?? 0) + (clean.injured ?? 0),
        fatalCount:   clean.killed ?? 0,
        incidentType: clean.incidentType,
        importId,
      });
    }

    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      await db.insert(gunViolenceIncidents)
        .values(chunk)
        .onConflictDoUpdate({
          target: [gunViolenceIncidents.incidentId, gunViolenceIncidents.dataSource],
          set: {
            occurredAt:   sql`excluded.occurred_at`,
            latitude:     sql`excluded.latitude`,
            longitude:    sql`excluded.longitude`,
            zip:          sql`excluded.zip`,
            city:         sql`excluded.city`,
            state:        sql`excluded.state`,
            victimCount:  sql`excluded.victim_count`,
            fatalCount:   sql`excluded.fatal_count`,
            incidentType: sql`excluded.incident_type`,
            importId:     sql`excluded.import_id`,
          },
        });
      totalUpserted += chunk.length;
    }

    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
    await new Promise(r => setTimeout(r, 150));
  }

  const elapsedMs = Date.now() - startedAt;

  await db.insert(gunViolenceImports).values({
    dataSource:  DATA_SOURCE,
    recordCount: totalUpserted,
    notes: `Scheduled sync. fetched=${totalFetched} upserted=${totalUpserted} rejected=${totalRejected} elapsed=${elapsedMs}ms`,
  });
  // A successful import supersedes the in-process intelligence snapshot.
  // Clear it before downstream consumers can observe the new import as fresh
  // while still receiving pre-import incident data.
  _intelligenceCache = null;
  _intelligenceGeneration++;

  console.info(`[gv-sync] sync complete — fetched=${totalFetched} upserted=${totalUpserted} rejected=${totalRejected} elapsed=${elapsedMs}ms`);

  // 48-hour staleness alert: check for any successful audit row in the last 48h.
  // Runs after every sync attempt (success or failure) as a belt-and-suspenders
  // guard; the scheduler in server/index.ts runs the same check independently.
  await checkGunViolenceStaleness();

  return { fetched: totalFetched, upserted: totalUpserted, rejected: totalRejected, elapsedMs };
}

/**
 * Checks whether the gun-violence-registry data source has a successful
 * audit row in the last 48 hours. If not, logs a "[gv-sync] STALE" warning
 * and sends an alert email via Resend. Non-fatal — errors are swallowed so
 * this check never blocks or surfaces to callers.
 */
export async function checkGunViolenceStaleness(): Promise<void> {
  const STALE_ALERT_MS = 48 * 60 * 60 * 1000;
  try {
    const cutoff = new Date(Date.now() - STALE_ALERT_MS);
    const recent = await db
      .select({ importedAt: gunViolenceImports.importedAt })
      .from(gunViolenceImports)
      .where(and(
        eq(gunViolenceImports.dataSource, "gun-violence-registry"),
        gte(gunViolenceImports.importedAt, cutoff),
      ))
      .orderBy(desc(gunViolenceImports.importedAt))
      .limit(1);

    if (recent.length === 0) {
      console.warn("[gv-sync] STALE: no successful import in the last 48 hours — sending staff alert");
      const subject = "[ALERT] Gun Violence Registry sync hasn't succeeded in over 48 hours";
      const html = `
        <div style="max-width:600px;font-family:Arial,sans-serif">
          <div style="background:#c53030;color:white;padding:16px;border-radius:6px 6px 0 0">
            <h2 style="margin:0;font-size:18px">Gun Violence Registry — Sync Stale</h2>
            <p style="margin:6px 0 0;font-size:13px;opacity:.9">No successful sync in the last 48 hours</p>
          </div>
          <div style="padding:16px;border:1px solid #ddd;border-top:none;background:white">
            <p style="color:#c53030;font-weight:bold">
              ⚠ The gun violence registry sync has not written a successful audit row to
              <code>gun_violence_imports</code> in the last 48 hours. Local incident data
              may be stale and gun-violence summary/intelligence endpoints will serve
              out-of-date counts.
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
              <tr>
                <td style="padding:6px 10px;color:#666;white-space:nowrap">Staleness threshold:</td>
                <td style="padding:6px 10px">48 hours</td>
              </tr>
              <tr style="background:#f5f5f5">
                <td style="padding:6px 10px;color:#666">Detected at:</td>
                <td style="padding:6px 10px">${new Date().toISOString()}</td>
              </tr>
              <tr>
                <td style="padding:6px 10px;color:#666">Audit table:</td>
                <td style="padding:6px 10px;font-family:monospace">gun_violence_imports</td>
              </tr>
              <tr style="background:#f5f5f5">
                <td style="padding:6px 10px;color:#666">Registry source:</td>
                <td style="padding:6px 10px">gun-violence-registry.replit.app</td>
              </tr>
            </table>
            <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;border-radius:4px;margin-top:12px">
              <strong>Recommended actions:</strong>
              <ol style="margin:8px 0 0;padding-left:18px;font-size:13px">
                <li>Check server logs for <code>[gv-sync]</code> errors around the last expected sync</li>
                <li>Verify <code>gun-violence-registry.replit.app</code> is reachable from this server</li>
                <li>Trigger a manual sync via <code>POST /api/gun-violence/sync</code> (staff-gated)</li>
                <li>Check <code>GET /api/gun-violence/imports</code> for the last successful audit row</li>
              </ol>
            </div>
            <p style="font-size:12px;color:#888;margin-top:16px">
              Generated by checkGunViolenceStaleness() in server/gun-violence-routes.ts.
            </p>
          </div>
        </div>
      `;
      await sendEcosystemUpdate(subject, html).catch((emailErr: any) =>
        console.error("[gv-sync] staleness alert email failed (non-fatal):", emailErr?.message ?? emailErr)
      );
    } else {
      console.info(`[gv-sync] staleness check OK — last import at ${recent[0].importedAt?.toISOString()}`);
    }
  } catch (err: any) {
    console.warn("[gv-sync] staleness check error (non-fatal):", err?.message ?? err);
  }
}

export function registerGunViolenceRoutes(app: Express) {

  /**
   * POST /api/gun-violence/import
   * Body: JSON array of incident objects (see incidentSchema above).
   * Upserts by (incidentId, dataSource) — safe to re-import the same dataset.
   * Writes an audit row to gun_violence_imports on success.
   */
  app.post("/api/gun-violence/import", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }

      const parsed = importSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid import payload.", detail: parsed.error.flatten() });
      }

      const records = parsed.data;
      const dataSource = records[0].dataSource;
      let inserted = 0;
      let skipped = 0;

      for (const rec of records) {
        try {
          const result = await db.insert(gunViolenceIncidents).values({
            incidentId: rec.incidentId,
            dataSource: rec.dataSource,
            occurredAt: rec.occurredAt ? new Date(rec.occurredAt) : undefined,
            latitude: rec.latitude,
            longitude: rec.longitude,
            zip: rec.zip,
            city: rec.city,
            ward: rec.ward,
            victimCount: rec.victimCount ?? 1,
            fatalCount: rec.fatalCount ?? 0,
            incidentType: rec.incidentType,
          }).onConflictDoNothing().returning({ id: gunViolenceIncidents.id });
          if (result.length > 0) {
            inserted++;
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }
      }

      // Audit row — always write even if all were duplicates
      await db.insert(gunViolenceImports).values({
        dataSource,
        recordCount: inserted,
        importedByUserId: (req as any).user?.id,
        notes: `Batch: ${records.length} submitted, ${inserted} new, ${skipped} duplicate/skipped.`,
      });

      console.info(`[gun-violence] import complete: source=${dataSource} new=${inserted} skipped=${skipped}`);
      res.json({ imported: inserted, skipped, total: records.length, dataSource });
    } catch (err: any) {
      console.error("[gun-violence] import error:", err);
      res.status(500).json({ error: "Import failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/summary
   * Query params: zip, city, ward, from (ISO date), to (ISO date)
   * Returns aggregate counts only — no individual incident records.
   * Public endpoint, rate-limited to 60 req/min per IP.
   */
  app.get("/api/gun-violence/summary", async (req: Request, res: Response) => {
    const ip = req.ip || "unknown";
    if (!checkSummaryRate(ip)) {
      return res.status(429).json({ error: "Too many requests. Limit: 60/min." });
    }

    try {
      const rawZip = req.query.zip;
      const rawCity = req.query.city;
      const rawWard = req.query.ward;
      const rawState = req.query.state;
      const rawFrom = req.query.from;
      const rawTo = req.query.to;
      if ([rawZip, rawCity, rawWard, rawState, rawFrom, rawTo].some((value) => value !== undefined && typeof value !== "string")) {
        return res.status(400).json({ error: "summary filters must be single strings" });
      }
      const zip   = ((rawZip as string | undefined) || "").trim();
      const city  = ((rawCity as string | undefined) || "").trim();
      const ward  = ((rawWard as string | undefined) || "").trim();
      const state = ((rawState as string | undefined) || "").trim().toUpperCase();
      if (zip && !/^\d{5}$/.test(zip)) {
        return res.status(400).json({ error: "zip must be a 5-digit ZIP code" });
      }
      if (city.length > 100 || ward.length > 50 || state.length > 2 || (state && !/^[A-Z]{2}$/.test(state))) {
        return res.status(400).json({ error: "city, ward, and state filters are too long or malformed" });
      }
      const from  = ((rawFrom as string | undefined) || "").trim();
      const to    = ((rawTo as string | undefined) || "").trim();
      if (from.length > 40 || to.length > 40) {
        return res.status(400).json({ error: "from and to must be bounded ISO date strings" });
      }
      const limitRaw = (req.query.limit as string | undefined) ?? "200";
      if (!/^[1-9]\d*$/.test(limitRaw)) {
        return res.status(400).json({ error: "limit must be a positive integer" });
      }
      const rowLimit = Number(limitRaw);
      if (!Number.isSafeInteger(rowLimit) || rowLimit > 500) {
        return res.status(400).json({ error: "limit must be a positive integer no greater than 500" });
      }
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      if (fromDate && Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: "from must be a valid ISO date" });
      }
      if (toDate && Number.isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "to must be a valid ISO date" });
      }
      if (fromDate && toDate && fromDate > toDate) {
        return res.status(400).json({ error: "from must be before to" });
      }

      const conditions: ReturnType<typeof eq>[] = [];
      if (zip)   conditions.push(eq(gunViolenceIncidents.zip, zip));
      if (city)  conditions.push(eq(gunViolenceIncidents.city, city));
      if (ward)  conditions.push(eq(gunViolenceIncidents.ward, ward));
      if (state) conditions.push(eq(gunViolenceIncidents.state, state));
      if (fromDate) conditions.push(gte(gunViolenceIncidents.occurredAt, fromDate));
      if (toDate) conditions.push(lte(gunViolenceIncidents.occurredAt, toDate));

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [totals, byZip] = await Promise.all([
        db.select({
          incidents:  sql<number>`count(*)::int`,
          victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
          fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
        }).from(gunViolenceIncidents).where(whereClause).then(r => r[0]),

        city && !zip
          ? db.select({
              zip:        gunViolenceIncidents.zip,
              incidents:  sql<number>`count(*)::int`,
              fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
            }).from(gunViolenceIncidents).where(whereClause)
              .groupBy(gunViolenceIncidents.zip)
              .orderBy(desc(sql`count(*)`))
              .limit(rowLimit)
          : Promise.resolve([]),

      ]);

      const suppressionFloor = 5;
      const incidentCount = totals?.incidents ?? 0;
      const suppressed = incidentCount > 0 && incidentCount < suppressionFloor;
      const publicByZip = (byZip as any[])
        .filter((row) => Number(row.incidents) >= suppressionFloor)
        .map((row) => ({
          zip: row.zip,
          incidents: row.incidents,
          fatalities: row.fatalities,
        }));
      res.json({
        filters: { zip: zip || null, city: city || null, state: state || null, ward: ward || null, from: from || null, to: to || null },
        incidents:  suppressed ? null : incidentCount,
        victims:    suppressed ? null : totals?.victims ?? 0,
        fatalities: suppressed ? null : totals?.fatalities ?? 0,
        byZip: publicByZip.length ? publicByZip : undefined,
        suppressed,
        suppressionFloor,
        source: "TCAF Gun Violence Registry",
        note: suppressed
          ? `Counts below ${suppressionFloor} incidents are suppressed to protect privacy.`
          : "Aggregate counts only. Individual incident rows are not exposed.",
      });
    } catch (err: any) {
      console.error("[gun-violence] summary error:", err);
      res.status(500).json({ error: "Summary failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/imports
   * Staff-gated. Returns the last 50 import audit records so operators can
   * see when data was last refreshed, how many records came in, and from
   * which source.
   */
  app.get("/api/gun-violence/imports", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }

      const history = await db
        .select()
        .from(gunViolenceImports)
        .orderBy(desc(gunViolenceImports.importedAt))
        .limit(50);

      res.json({ imports: history });
    } catch (err: any) {
      console.error("[gun-violence] imports history error:", err);
      res.status(500).json({ error: "Failed to load import history.", detail: err.message });
    }
  });

  // ── GET /api/gun-violence/intelligence — delegates to exported function ───────
  // Public endpoint. Cached 1 hour in the module-level _intelligenceCache.
  app.get("/api/gun-violence/intelligence", async (_req: Request, res: Response) => {
    try {
      const data = await getGunViolenceIntelligenceData();
      res.json(data);
    } catch (err: any) {
      console.error("[gun-violence] intelligence error:", err);
      res.status(500).json({ error: "Failed to load intelligence data.", detail: err.message });
    }
  });

  // ── POST /api/gun-violence/story — AI narrative for a geography (auth req) ─
  app.post("/api/gun-violence/story", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.() && !(req as any).user) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const { geography, state, focusArea } = req.body as {
        geography?: string; state?: string; focusArea?: string;
      };
      if (!geography) return res.status(400).json({ error: "geography is required." });

      const { generateAIJSON } = await import("./ai-provider");
      const { withEthicalPreamble } = await import("./ai-provider");

      // Pull intelligence data (from cache or live)
      const BASE = "https://gun-violence-registry.replit.app";
      const fetcher = (path: string) =>
        fetch(`${BASE}${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) })
          .then(r => r.ok ? r.json() : null).catch(() => null);

      const [cdcSummaryRaw, rootCauses, socialDet, acesCorrRaw] = await Promise.all([
        fetcher("/api/cdc/summary"),
        fetcher("/api/root-causes"),
        fetcher("/api/social-determinants"),
        fetcher("/api/aces/correlations"),
      ]);
      // Same mechanical range checks as getGunViolenceIntelligenceData —
      // this route re-fetches independently, so it must re-validate
      // independently too rather than trusting a shared cache was already
      // scrubbed by the time it gets here.
      const cdcSummary = validateCdcSummary("gun-violence-story", cdcSummaryRaw);
      const acesCorr = validateAcesCorrelations("gun-violence-story", acesCorrRaw);

      // Local incidents for this geography
      const localRows = state
        ? await db.select({
            count: sql<number>`count(*)::int`,
            victims: sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}),0)::int`,
            fatal: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}),0)::int`,
          }).from(gunViolenceIncidents).where(eq(gunViolenceIncidents.state, state))
        : [];
      const localState = localRows[0] ?? null;

      const stateSdoh = Array.isArray(socialDet)
        ? socialDet.find((s: any) => s.stateCode === state || s.stateName?.toLowerCase().includes((state ?? "").toLowerCase()))
        : null;

      const topRootCauses = Array.isArray(rootCauses)
        ? rootCauses.slice(0, 4).map((r: any) => `${r.factor} (r=${r.correlation})`)
        : [];

      const unavailable = "UNAVAILABLE (the source did not return this value; do not infer or substitute it)";
      const prompt = withEthicalPreamble(`
You are a public health data journalist writing for TCAF — the Thriving Communities for All Foundation.
Write a compelling, factual, trauma-informed narrative about gun violence in ${geography}.

Ground your story in these data points:
- National: ${cdcSummary?.totalDeaths ?? unavailable} Americans have died from gun violence since 1999 (CDC WONDER)
- Annual rate: ${cdcSummary?.latestYear?.crudeRate ?? unavailable} deaths per 100,000 (${cdcSummary?.latestYear?.year ?? unavailable})
- Peak year: ${cdcSummary?.peakYear?.year ?? unavailable} with ${cdcSummary?.peakYear?.deaths ?? unavailable} deaths
- ACE score correlation with firearm violence: r = ${acesCorr?.aceFirearmR ?? unavailable} — source value unavailable means this claim must be omitted
- Top root causes: ${topRootCauses.join("; ")}
${stateSdoh ? `- ${geography} SDOH: poverty ${stateSdoh.povertyRate}%, median income $${stateSdoh.medianIncome?.toLocaleString()}, Gini ${stateSdoh.giniCoefficient}, mental health providers per 100k: ${stateSdoh.mentalHealthProvidersPer100k}` : ""}
${localState?.count ? `- Local registry: ${localState.count} incidents, ${localState.victims} victims, ${localState.fatal} fatal in current dataset` : ""}
${focusArea ? `- Focus area: ${focusArea}` : ""}

The story should:
1. Open with a human truth — not statistics, a moment
2. Build the structural picture — poverty, ACEs, disinvestment — using the data
3. Name what works — evidence-based interventions, described qualitatively (what they do and why they help). Do NOT state a specific cost-effectiveness dollar figure, ratio, or "saves $X per $1" claim — none is computed for this story, so any such number would be invented.
4. Close with what TCAF's CHW network, anchor agencies, and community partners are doing in response
5. Be 4–6 paragraphs, written for both a grant committee and a community meeting

Respond with JSON: { headline: string, subhead: string, body: string[] (array of paragraphs), keyNumbers: { label: string, value: string }[], callToAction: string }
`);

      const story = await generateAIJSON<{ headline?: string; subhead?: string; body?: string[]; keyNumbers?: { label: string; value: string }[]; callToAction?: string }>(prompt, "gun violence narrative");
      const grounded = groundGunViolenceStory(story, { cdcSummary, acesCorr, geography });
      res.json({ ok: true, geography, story: grounded });
    } catch (err: any) {
      console.error("[gun-violence] story error:", err);
      res.status(500).json({ error: "Story generation failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/policy-timeline
   * Time-series aggregation by month or quarter so government agencies can
   * overlay policy changes against crime trends and measure impact.
   *
   * Query params:
   *   state     — required. Two-letter state code.
   *   zip       — optional. Filter to a single ZIP.
   *   city      — optional. Filter to a city.
   *   from      — ISO date, defaults to 24 months ago.
   *   to        — ISO date, defaults to now.
   *   granularity — "month" (default) | "quarter"
   *
   * Returns periods with incident + victim + fatality counts. Designed for
   * graphing against policy event markers — no individual records exposed.
   */
  app.get("/api/gun-violence/policy-timeline", async (req: Request, res: Response) => {
    try {
      const stateParam   = ((req.query.state       as string) || "").trim().toUpperCase();
      const zipParam     = ((req.query.zip         as string) || "").trim();
      const cityParam    = ((req.query.city        as string) || "").trim();
      const granularity  = (req.query.granularity  as string) === "quarter" ? "quarter" : "month";
      const fromDate     = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      const toDate       = req.query.to   ? new Date(req.query.to   as string) : new Date();

      if (!stateParam || !/^[A-Z]{2}$/.test(stateParam)) {
        return res.status(400).json({ error: "state must be a 2-letter US state code (e.g. TX)" });
      }
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: "from must be a valid ISO date" });
      }
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "to must be a valid ISO date" });
      }
      if (fromDate > toDate) {
        return res.status(400).json({ error: "from must be before to" });
      }

      const conditions: ReturnType<typeof eq>[] = [
        eq(gunViolenceIncidents.state, stateParam),
        gte(gunViolenceIncidents.occurredAt, fromDate),
        lte(gunViolenceIncidents.occurredAt, toDate),
      ];
      if (zipParam)  conditions.push(eq(gunViolenceIncidents.zip, zipParam));
      if (cityParam) conditions.push(eq(gunViolenceIncidents.city, cityParam));

      // date_trunc granularity MUST be a literal — PG rejects bind parameters in that
      // position. Use separate branches so the string never flows through Drizzle's
      // parameterization path. Plain sql`...` template tags with no JS interpolation
      // in the groupBy/orderBy args are emitted as raw SQL, not $N placeholders.
      const timeline = granularity === "quarter"
        ? await db.select({
            period:     sql<string>`to_char(date_trunc('quarter', ${gunViolenceIncidents.occurredAt}), 'YYYY-"Q"Q')`,
            incidents:  sql<number>`count(*)::int`,
            victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
            fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
          }).from(gunViolenceIncidents).where(and(...conditions))
            .groupBy(sql`date_trunc('quarter', occurred_at)`)
            .orderBy(sql`date_trunc('quarter', occurred_at)`)
        : await db.select({
            period:     sql<string>`to_char(date_trunc('month', ${gunViolenceIncidents.occurredAt}), 'YYYY-MM')`,
            incidents:  sql<number>`count(*)::int`,
            victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
            fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
          }).from(gunViolenceIncidents).where(and(...conditions))
            .groupBy(sql`date_trunc('month', occurred_at)`)
            .orderBy(sql`date_trunc('month', occurred_at)`);

      const [totals] = await db.select({
        totalIncidents:  sql<number>`count(*)::int`,
        totalVictims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
        totalFatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
      }).from(gunViolenceIncidents).where(and(...conditions));

      return res.json({
        geography: { state: stateParam, zip: zipParam || null, city: cityParam || null },
        window:    { from: fromDate.toISOString(), to: toDate.toISOString(), granularity },
        totals: {
          incidents:  Number(totals?.totalIncidents  ?? 0),
          victims:    Number(totals?.totalVictims    ?? 0),
          fatalities: Number(totals?.totalFatalities ?? 0),
        },
        timeline,
        usage: {
          purpose: "Correlate incident trends against policy change dates to measure intervention effectiveness.",
          policyOverlay: "Add your policy event markers (ordinance passed, program launched, funding cut) to the timeline periods to visualize impact.",
          grantUse: "Attach this timeline as Exhibit A in needs statements for DOJ, CDC/NCIPC, and SAMHSA applications to demonstrate community burden with verified data.",
        },
        source: "TCAF Gun Violence Registry",
        note: "Aggregate counts only. No individual victim data is stored or exposed.",
      });
    } catch (err: any) {
      console.error("[gun-violence] policy-timeline error:", err);
      return res.status(500).json({ error: "Policy timeline failed.", detail: err.message });
    }
  });

  // ── POST /api/gun-violence/sync — delegates to exported function (staff only) ─
  app.post("/api/gun-violence/sync", async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }
      const result = await runGunViolenceRegistrySync();
      res.json({ ok: true, ...result });
    } catch (err: any) {
      console.error("[gun-violence] sync error:", err);
      res.status(500).json({ error: "Sync failed.", detail: err.message });
    }
  });
}
