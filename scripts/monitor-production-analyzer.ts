// Production health monitor for TCAF public endpoints.
// Run: PROD_URL=https://thrivingcommunitiesforall.com npx tsx scripts/monitor-production-analyzer.ts
// Add --json flag for machine-readable output.

const BASE = process.env.PROD_URL || "https://thrivingcommunitiesforall.com";
const JSON_MODE = process.argv.includes("--json");

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
  const res = await fetch(`${BASE}/api/conductor/community-brief`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ location: "78660", populationSize: 10000, timeHorizon: 25 }),
    signal: AbortSignal.timeout(30000),
  });
  if (res.status === 401 || res.status === 403) return { ok: false, status: res.status, note: "LOGIN WALL — public analyzer is gated" };
  if (res.status >= 500) return { ok: false, status: res.status, note: `Server error ${res.status}` };
  const text = await res.text();
  const brief = JSON.parse(text);
  const narrative = brief.narrative || brief.analysis || "";
  if (narrative.length < 100) return { ok: false, status: res.status, note: `Narrative too short: ${narrative.length} chars` };
  return { ok: true, status: res.status, note: `OK — narrative ${narrative.length} chars` };
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
