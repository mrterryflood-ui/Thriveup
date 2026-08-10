/**
 * Unit tests for the community-brief production probe logic.
 *
 * Exercises server/community-brief-probe.ts WITHOUT starting a real HTTP
 * server or sending any emails — all externals are mocked at the module level.
 *
 * Tests:
 *   1. Auth-wall (401/403) detected as failure
 *   2. 429 rate-limit detected as failure
 *   3. 5xx upstream failure detected
 *   4. Hollow 200 (missing narrative) detected as failure
 *   5. Missing generatedAt detected as stale-cache failure
 *   6. Stale generatedAt (predates probe start minus grace) detected
 *   7. Valid fresh response passes
 *   8. State machine: 1 failure does NOT trigger DOWN alert
 *   9. State machine: 2nd consecutive failure triggers DOWN alert (transition)
 *  10. State machine: 3rd consecutive failure does NOT re-trigger DOWN alert
 *  11. State machine: passing after down triggers RECOVERED alert (transition)
 *  12. State machine: subsequent passes do NOT re-trigger RECOVERED alert
 *  13. State machine: new failure sequence after recovery alerts again
 *  14. populationSize variants are all unique (cache keys never collide)
 *  15. PROBE_POPULATION_VARIANTS has at least 8 entries (enough rotation depth)
 */

import {
  evaluateProbeResponse,
  advanceProbeState,
  _resetProbeState,
  PROBE_POPULATION_VARIANTS,
} from "../server/community-brief-probe";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeValidBrief(overrides: Record<string, any> = {}): string {
  return JSON.stringify({
    narrative: "A".repeat(250),
    overallScore: 72,
    systemsScores: { economic: 70, health: 65, housing: 80 },
    demographics: { povertyRate: 12.5 },
    generatedAt: new Date().toISOString(),
    ...overrides,
  });
}

const NOW = Date.now();
const VALID_POP = 9_800;

// ── Section 1: evaluateProbeResponse ──────────────────────────────────────────

console.log("\n── evaluateProbeResponse ──");

{
  const r = evaluateProbeResponse(401, "Unauthorized", NOW, VALID_POP);
  assert(!r.ok, "401 → not ok");
  assert(r.detail.includes("401"), "401 detail contains status code");
  assert(r.detail.toLowerCase().includes("login wall"), "401 detail mentions login wall");
}

{
  const r = evaluateProbeResponse(403, "Forbidden", NOW, VALID_POP);
  assert(!r.ok, "403 → not ok");
}

{
  const r = evaluateProbeResponse(429, "Too Many Requests", NOW, VALID_POP);
  assert(!r.ok, "429 → not ok");
  assert(r.detail.includes("429"), "429 detail contains status code");
}

{
  const r = evaluateProbeResponse(500, "Internal Server Error", NOW, VALID_POP);
  assert(!r.ok, "500 → not ok");
  assert(r.detail.includes("500"), "500 detail contains status code");
}

{
  const r = evaluateProbeResponse(502, "Bad Gateway", NOW, VALID_POP);
  assert(!r.ok, "502 → not ok");
}

{
  // Hollow brief: narrative too short
  const body = makeValidBrief({ narrative: "short" });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(!r.ok, "hollow brief (short narrative) → not ok");
  assert(r.detail.includes("narrative"), "hollow detail mentions narrative");
}

{
  // Hollow brief: missing overallScore
  const body = makeValidBrief({ overallScore: undefined });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(!r.ok, "hollow brief (missing overallScore) → not ok");
}

{
  // Hollow brief: empty systemsScores
  const body = makeValidBrief({ systemsScores: {} });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(!r.ok, "hollow brief (empty systemsScores) → not ok");
}

{
  // Hollow brief: missing demographics.povertyRate
  const body = makeValidBrief({ demographics: { population: 50000 } });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(!r.ok, "hollow brief (missing povertyRate) → not ok");
}

{
  // Missing generatedAt
  const body = makeValidBrief({ generatedAt: undefined });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(!r.ok, "missing generatedAt → not ok");
  assert(r.detail.includes("generatedAt"), "detail mentions generatedAt");
}

{
  // Invalid (non-parseable) generatedAt
  const body = makeValidBrief({ generatedAt: "not-a-date" });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(!r.ok, "invalid generatedAt → not ok");
}

{
  // Stale generatedAt: 3 hours before probe start — well beyond the 2-minute grace window
  const staleTs = new Date(NOW - 3 * 60 * 60 * 1000).toISOString();
  const body = makeValidBrief({ generatedAt: staleTs });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(!r.ok, "stale generatedAt (3 hours old) → not ok");
  assert(r.detail.toLowerCase().includes("freshness") || r.detail.toLowerCase().includes("stale"), "stale detail mentions freshness");
}

{
  // Valid: fresh generatedAt (just now)
  const body = makeValidBrief({ generatedAt: new Date().toISOString() });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(r.ok, "valid fresh brief → ok");
  assert(r.detail.includes("200"), "pass detail includes 200");
}

{
  // generatedAt slightly before probe start but within grace window (should pass)
  const slightlyEarly = new Date(NOW - 30_000).toISOString(); // 30 s before — within 120 s grace
  const body = makeValidBrief({ generatedAt: slightlyEarly });
  const r = evaluateProbeResponse(200, body, NOW, VALID_POP);
  assert(r.ok, "generatedAt 30 s before probe start (within grace window) → ok");
}

{
  // Not valid JSON body
  const r = evaluateProbeResponse(200, "not json at all", NOW, VALID_POP);
  assert(!r.ok, "non-JSON 200 → not ok");
  assert(r.detail.includes("JSON"), "non-JSON detail mentions JSON");
}

// ── Section 2: advanceProbeState (state machine) ──────────────────────────────

console.log("\n── advanceProbeState (state machine) ──");

_resetProbeState();

{
  // 1st failure: no alert
  const alert = advanceProbeState(false);
  assert(alert === null, "1st failure → no alert");
}

{
  // 2nd consecutive failure: DOWN alert (transition)
  const alert = advanceProbeState(false);
  assert(alert === "down", "2nd consecutive failure → DOWN alert");
}

{
  // 3rd consecutive failure: already down, no repeat alert
  const alert = advanceProbeState(false);
  assert(alert === null, "3rd consecutive failure → no alert (already down)");
}

{
  // 4th consecutive failure: still no alert
  const alert = advanceProbeState(false);
  assert(alert === null, "4th consecutive failure → no alert (still down)");
}

{
  // First pass after sustained failures: RECOVERED alert (transition)
  const alert = advanceProbeState(true);
  assert(alert === "recovered", "first pass after down period → RECOVERED alert");
}

{
  // Second consecutive pass: no alert (already recovered)
  const alert = advanceProbeState(true);
  assert(alert === null, "second consecutive pass → no alert (already up)");
}

{
  // Third consecutive pass: no alert
  const alert = advanceProbeState(true);
  assert(alert === null, "third consecutive pass → no alert");
}

{
  // New incident: 1st failure after recovery — no alert
  const alert = advanceProbeState(false);
  assert(alert === null, "1st failure after recovery → no alert");
}

{
  // New incident: 2nd failure — DOWN alert fires again (new incident)
  const alert = advanceProbeState(false);
  assert(alert === "down", "2nd failure in new incident → DOWN alert fires again");
}

// ── Section 3: populationSize rotation uniqueness ────────────────────────────

console.log("\n── populationSize rotation ──");

{
  const unique = new Set(PROBE_POPULATION_VARIANTS);
  assert(unique.size === PROBE_POPULATION_VARIANTS.length, "all PROBE_POPULATION_VARIANTS are unique (no collisions)");
}

{
  assert(PROBE_POPULATION_VARIANTS.length >= 8, `at least 8 rotation values (got ${PROBE_POPULATION_VARIANTS.length})`);
}

{
  // All values should be realistic (100 to 5 million — same bounds as server clamps)
  const allValid = PROBE_POPULATION_VARIANTS.every(v => v >= 100 && v <= 5_000_000);
  assert(allValid, "all population variants are within server-accepted range [100, 5_000_000]");
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
if (failed > 0) {
  console.error(`✗ ${failed} test(s) FAILED`);
  process.exit(1);
}
console.log("✓ All community-brief probe logic tests passed.");
process.exit(0);
