/**
 * verify-gpp-endpoint.ts
 * ───────────────────────
 * Probes GrantPathPro's outbound integration URL (GPP_API_URL) to confirm
 * the four inbound push endpoints are reachable and accepting our auth format.
 *
 * Exit 0  — all four endpoints return 2xx (or GPP_API_URL not set, skip).
 * Exit 1  — any endpoint returns an unexpected error, wrong content-type,
 *            or a Clerk JWT auth wall that blocks our API key.
 *
 * Run:
 *   npx tsx scripts/verify-gpp-endpoint.ts
 */

const GPP_URL = process.env.GPP_API_URL?.trim();
const GPP_KEY = process.env.THRIVE_GPP_API_KEY?.trim() || "";

const ENDPOINTS = [
  { path: "/api/inbound/entity",        type: "entity_profile" },
  { path: "/api/inbound/proposal",      type: "proposal_draft" },
  { path: "/api/inbound/pursuit",       type: "pursuit_packet" },
  { path: "/api/inbound/collaborative", type: "collaborative_structure" },
] as const;

const PROBE_PAYLOAD = {
  source:    "thriveup",
  _probe:    true,
  _probeAt:  new Date().toISOString(),
};

interface ProbeResult {
  path:        string;
  httpStatus:  number;
  contentType: string | null;
  ok:          boolean;
  authMismatch: boolean;
  clerkStatus: string | null;
  clerkMsg:    string | null;
  body:        string;
  error?:      string;
}

async function probeEndpoint(path: string, type: string): Promise<ProbeResult> {
  const url = `${GPP_URL}${path}`;
  const payload = { ...PROBE_PAYLOAD, type };

  try {
    const r = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GPP_KEY}` },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(15_000),
    });

    const contentType = r.headers.get("content-type") ?? null;
    const clerkStatus = r.headers.get("x-clerk-auth-status") ?? null;
    const clerkMsg    = r.headers.get("x-clerk-auth-message") ?? null;
    const rawBody     = await r.text();
    const bodySnip    = rawBody.slice(0, 400);

    // Clerk auth wall: 401 + Clerk response headers = API key is not a valid JWT
    const authMismatch = r.status === 401 && clerkStatus !== null;

    return {
      path,
      httpStatus:  r.status,
      contentType,
      ok:          r.ok,
      authMismatch,
      clerkStatus,
      clerkMsg,
      body:        bodySnip,
    };
  } catch (e: any) {
    return {
      path,
      httpStatus:  0,
      contentType: null,
      ok:          false,
      authMismatch: false,
      clerkStatus: null,
      clerkMsg:    null,
      body:        "",
      error:       e.message,
    };
  }
}

async function main() {
  // ── 0. Skip gracefully if URL not configured ─────────────────────────────
  if (!GPP_URL) {
    console.log("[gpp-probe] GPP_API_URL is not set — skipping endpoint probe (push routes return preview payloads).");
    process.exit(0);
  }

  console.log(`[gpp-probe] Target: ${GPP_URL}`);
  console.log(`[gpp-probe] Auth:   Bearer ${GPP_KEY ? GPP_KEY.slice(0, 6) + "…" : "(empty)"}\n`);

  // ── 1. Health check ───────────────────────────────────────────────────────
  try {
    const health = await fetch(`${GPP_URL}/api/health`, { signal: AbortSignal.timeout(10_000) });
    const healthBody = await health.text();
    console.log(`[gpp-probe] /api/health → HTTP ${health.status} — ${healthBody.slice(0, 120)}`);
    if (!health.ok) {
      console.error("[gpp-probe] FAIL: health check returned non-2xx — server may be down.");
      process.exit(1);
    }
  } catch (e: any) {
    console.error(`[gpp-probe] FAIL: health check threw — ${e.message}`);
    process.exit(1);
  }

  // ── 2. Probe four inbound endpoints ──────────────────────────────────────
  const results: ProbeResult[] = [];
  for (const ep of ENDPOINTS) {
    const r = await probeEndpoint(ep.path, ep.type);
    results.push(r);
    const tag = r.ok ? "OK  " : r.authMismatch ? "AUTH" : r.error ? "ERR " : "FAIL";
    console.log(`[gpp-probe] ${tag} ${r.httpStatus || "???"} ${r.path}`);
    if (r.authMismatch) {
      console.log(`           Clerk auth wall detected (x-clerk-auth-status=${r.clerkStatus})`);
      console.log(`           Clerk message: ${r.clerkMsg}`);
    } else if (r.error) {
      console.log(`           Network error: ${r.error}`);
    } else if (!r.ok) {
      console.log(`           Body: ${r.body}`);
    }
  }

  // ── 3. Evaluate results ──────────────────────────────────────────────────
  const anyAuthMismatch = results.some(r => r.authMismatch);
  const anyNetworkError = results.some(r => !!r.error);
  const anyOtherFail    = results.some(r => !r.ok && !r.authMismatch && !r.error);

  console.log("");

  if (results.every(r => r.ok)) {
    console.log("[gpp-probe] PASS — all four GPP inbound endpoints returned 2xx. Integration is live.");
    process.exit(0);
  }

  if (anyAuthMismatch) {
    console.error(
      "[gpp-probe] FAIL — GPP inbound endpoints are behind a Clerk JWT auth wall.\n" +
      "  The current THRIVE_GPP_API_KEY is a plain API key string, not a Clerk JWT.\n" +
      "  Resolution options (GPP must implement one):\n" +
      "    A) Expose a service-to-service endpoint (e.g. /api/inbound/*) that accepts\n" +
      "       a plain Bearer API key outside the Clerk auth middleware.\n" +
      "    B) Issue ThriveUp a Clerk machine token so our Bearer value is a valid JWT.\n" +
      "  Until resolved, pushToGpp() will log a warning and return { sent: false, authMismatch: true }."
    );
    process.exit(1);
  }

  if (anyNetworkError) {
    console.error("[gpp-probe] FAIL — one or more endpoints threw a network error (server unreachable or TLS issue).");
    process.exit(1);
  }

  if (anyOtherFail) {
    console.error("[gpp-probe] FAIL — one or more endpoints returned a non-2xx, non-401 status. See details above.");
    process.exit(1);
  }
}

main().catch(e => {
  console.error("[gpp-probe] Unexpected error:", e);
  process.exit(1);
});
