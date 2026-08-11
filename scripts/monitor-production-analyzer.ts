// Production health monitor for TCAF public endpoints.
// Run: PROD_URL=https://thrivingcommunitiesforall.com npx tsx scripts/monitor-production-analyzer.ts
// Add --json flag for machine-readable output.

const BASE = process.env.PROD_URL || "https://thrivingcommunitiesforall.com";
const JSON_MODE = process.argv.includes("--json");

// Freshness window: the response must have been generated within the last 2h.
// The server's anonymous cache is 12h, so a stale cache hit would blow past this.
const FRESHNESS_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

// Rotate populationSize per run so the anonymous cache key
// (`${location}|${populationSize}|${timeHorizon}`) differs every invocation —
// forcing a live Census + AI build rather than a 12h cache hit. Mirrors the
// PROBE_POPULATION_VARIANTS strategy in server/community-brief-probe.ts.
// All values stay plausible for the probe ZIP so Census math isn't distorted.
const POPULATION_VARIANTS = [9_800, 9_850, 9_900, 9_950, 10_050, 10_100, 10_150, 10_200];
const briefPopulationSize = POPULATION_VARIANTS[Date.now() % POPULATION_VARIANTS.length];

type Check = { name: string; ok: boolean; status?: number; latencyMs: number; note: string };
const results: Check[] = [];

async function probe(name: string, fn: () => Promise<{ ok: boolean; status?: number; note: string }>): Promise<void> {
  const start = Date.now();
  try {
    const r = await fn();
    results.push({ name, ...r, latencyMs: Date.now() - start });
  } catch (e: any) {
    results.push({ name, ok: false, latencyMs: Date.now() - start, note: `ERROR: ${e.message}` });
  }
}

await probe("community-brief (anon)", async () => {
  // Capture request time BEFORE the call so we can verify the response was
  // generated during (not before) this run — a stale cache hit would carry an
  // older generatedAt.
  const requestedAtMs = Date.now();
  const res = await fetch(`${BASE}/api/conductor/community-brief`, {
    method: "POST", headers: { "content-type": "application/json" },
    // Rotating populationSize bypasses the 12h anonymous cache — forces a live build.
    body: JSON.stringify({ location: "78660", populationSize: briefPopulationSize, timeHorizon: 25 }),
    signal: AbortSignal.timeout(30000),
  });
  if (res.status === 401 || res.status === 403) return { ok: false, status: res.status, note: "LOGIN WALL — public analyzer is gated" };
  if (res.status >= 500) return { ok: false, status: res.status, note: `Server error ${res.status}` };
  const text = await res.text();
  let brief: any;
  try {
    brief = JSON.parse(text);
  } catch {
    return { ok: false, status: res.status, note: `200 but response is not valid JSON: ${text.slice(0, 150)}` };
  }

  const narrative = brief.narrative || brief.analysis || "";
  if (narrative.length < 100) return { ok: false, status: res.status, note: `Narrative too short: ${narrative.length} chars` };

  // ── Freshness assertion ──────────────────────────────────────────────────
  // generatedAt must exist and be < 2h old. Rotating populationSize should have
  // forced a live build; if generatedAt is stale, the server served a cache
  // entry and we must NOT report the endpoint as healthy.
  const rawGenAt: string | undefined = brief.generatedAt ?? brief.geography?.generatedAt;
  if (!rawGenAt) {
    return { ok: false, status: res.status, note: "generatedAt missing — cannot confirm live Census + AI pipeline ran (possible stale cache)" };
  }
  const genMs = new Date(rawGenAt).getTime();
  if (!Number.isFinite(genMs)) {
    return { ok: false, status: res.status, note: `generatedAt "${rawGenAt}" is not a valid ISO timestamp` };
  }
  const ageMs = requestedAtMs - genMs;
  if (ageMs > FRESHNESS_MAX_AGE_MS) {
    const ageHrs = (ageMs / 3_600_000).toFixed(1);
    return { ok: false, status: res.status, note: `STALE — generatedAt ${rawGenAt} is ${ageHrs}h old (>2h); cache masking a broken pipeline (pop=${briefPopulationSize})` };
  }

  // ── Census-derived field validation ──────────────────────────────────────
  // A hollow 200 (Census path silently failed) must fail the check. Poverty
  // rate must be a plausible number in [0, 100].
  const povertyRate = brief.demographics?.povertyRate;
  if (typeof povertyRate !== "number" || !Number.isFinite(povertyRate) || povertyRate < 0 || povertyRate > 100) {
    return { ok: false, status: res.status, note: `Census hollow — demographics.povertyRate is ${JSON.stringify(povertyRate)} (expected number 0-100)` };
  }

  const ageMin = (ageMs / 60_000).toFixed(1);
  return { ok: true, status: res.status, note: `OK — narrative ${narrative.length} chars; poverty ${povertyRate}%; generatedAt ${ageMin}min old (pop=${briefPopulationSize})` };
});

await probe("embed widget JS", async () => {
  const res = await fetch(`${BASE}/embed/tcaf-widget.js`, { signal: AbortSignal.timeout(10000) });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("javascript")) return { ok: false, status: res.status, note: `Wrong content-type: ${ct}` };
  return { ok: true, status: res.status, note: "OK — JS served" };
});

await probe("benefits screener (anon)", async () => {
  const res = await fetch(`${BASE}/api/benefits/screenings`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ screeningType: "wizard", householdSize: 3, annualIncome: 35000, hasChildren: true }),
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 401 || res.status === 403) return { ok: false, status: res.status, note: "LOGIN WALL" };
  return { ok: res.status < 500, status: res.status, note: res.status < 500 ? "OK" : `Error ${res.status}` };
});

await probe("neighbor-zips (anon)", async () => {
  const res = await fetch(`${BASE}/api/conductor/neighbor-zips`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ zip: "78660" }),
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 401 || res.status === 403) return { ok: false, status: res.status, note: "LOGIN WALL" };
  return { ok: res.status < 500, status: res.status, note: `HTTP ${res.status}` };
});

const allOk = results.every(r => r.ok);

if (JSON_MODE) {
  console.log(JSON.stringify({ ok: allOk, results, checkedAt: new Date().toISOString(), base: BASE }, null, 2));
} else {
  console.log(`\nProduction health — ${BASE}\n`);
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    console.log(`${icon} ${r.name.padEnd(30)} ${String(r.latencyMs).padStart(5)}ms  ${r.note}`);
  }
  console.log(`\n${allOk ? "✓ ALL CHECKS PASSED" : "✗ FAILURES DETECTED"}`);
}

if (!allOk) process.exit(1);
