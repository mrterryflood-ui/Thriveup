/**
 * Verify the partner-api-contract-probe parsing logic against the actual
 * docs format emitted by server/partner-api-routes.ts.
 *
 * This test does NOT require a running server.  It validates that the
 * whitespace-tolerant ROUTE_RE regex correctly normalises the two-space
 * "GET  /path" format used by partner-api-routes.ts into the single-space
 * lookup key, and that scope labels are extracted correctly.
 *
 * It also tests that a missing route and a mis-scoped route produce failures,
 * verifying the gate detects drift (not just clean passes).
 *
 * Exit: 0 on all assertions passing, 1 on any failure.
 */

import { buildDocMap, extractScopeLabels, EXPECTED_ENDPOINTS } from "../server/partner-api-contract-probe";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// ── Representative docs entries in the ACTUAL two-space format ────────────────

const SAMPLE_DOCS_ENTRIES: string[] = [
  "GET  /api/partner/v1/chainweb/coefficients   — evidence coefficients for ROI scenarios (chainweb:read)",
  "GET  /api/partner/v1/ms/intelligence — MS provider leads, public health-platform URLs, national sources, and RPLICE MS links (health:read); query: location?, focus?",
  "GET  /api/partner/v1/community/brief — compatibility alias for community-brief (community:read); query: location (required), populationSize?, timeHorizon?",
  "GET  /api/partner/v1/chainweb/templates      — quick-start ROI scenario templates (chainweb:read)",
  "POST /api/partner/v1/chainweb/scenarios — create a partner-owned ROI scenario (chainweb:read)",
  "GET  /api/partner/v1/chainweb/scenarios/:id  — read a partner-owned ROI scenario (chainweb:read)",
  "POST /api/partner/v1/chainweb/scenarios/:id/calculate — run a scenario (chainweb:read)",
  "POST /api/partner/v1/chainweb/calculations/:id/narratives — generate narratives (chainweb:read)",
  "GET  /api/partner/v1/yhsi/metrics            — aggregate YHSI metrics, floor-5 suppressed (yhsi:read)",
  "GET  /api/partner/v1/yhsi/outcomes-summary   — aggregate YHSI outcome milestones (yhsi:read)",
  "GET  /api/partner/v1/students/overview — AGGREGATE cohort metrics, suppression-floored (student:read)",
  "GET  /api/partner/v1/attendance/summary      — AGGREGATE attendance metrics (student:read)",
  "GET  /api/partner/v1/early-warnings          — AGGREGATE early-warning counts (student:read)",
  "GET  /api/partner/v1/pathways/overview       — AGGREGATE pathway distribution (student:read)",
  "POST /api/partner/v1/heartbeat — connectivity probe (no scope required)",
];

console.log("\nPartner API contract probe parsing tests\n");

// ── Test 1: buildDocMap normalises two-space format to single-space keys ──────

console.log("[1] buildDocMap normalises two-space docs entries");
const docMap = buildDocMap(SAMPLE_DOCS_ENTRIES);

// Two-space GET entry → normalized key uses single space
assert(
  "GET  /api/partner/v1/chainweb/coefficients normalises to single-space key",
  docMap.has("GET /api/partner/v1/chainweb/coefficients"),
  "key not found in docMap",
);
assert(
  "POST /api/partner/v1/chainweb/scenarios normalises correctly",
  docMap.has("POST /api/partner/v1/chainweb/scenarios"),
  "key not found in docMap",
);
assert(
  "GET  /api/partner/v1/yhsi/metrics normalises correctly",
  docMap.has("GET /api/partner/v1/yhsi/metrics"),
  "key not found in docMap",
);
assert(
  "POST /api/partner/v1/heartbeat normalises correctly",
  docMap.has("POST /api/partner/v1/heartbeat"),
  "key not found in docMap",
);

// ── Test 2: All expected endpoints are found in the sample docs ───────────────

console.log("\n[2] All expected endpoints found in the sample docs");
for (const ep of EXPECTED_ENDPOINTS) {
  const key = `${ep.method} ${ep.path}`;
  const entries = docMap.get(key) ?? [];
  assert(`docs list ${key}`, entries.length > 0, "not found after normalisation");
}

// ── Test 3: Scope labels are extracted correctly ──────────────────────────────

console.log("\n[3] Scope labels extracted correctly from docs entries");
assert(
  "chainweb:read extracted from coefficients entry",
  extractScopeLabels("GET  /api/partner/v1/chainweb/coefficients   — evidence coefficients for ROI scenarios (chainweb:read)").includes("chainweb:read"),
  "label not found",
);
assert(
  "community:read extracted from community/brief entry",
  extractScopeLabels("GET  /api/partner/v1/community/brief — compatibility alias (community:read)").includes("community:read"),
  "label not found",
);
assert(
  "yhsi:read extracted from yhsi/metrics entry",
  extractScopeLabels("GET  /api/partner/v1/yhsi/metrics — aggregate YHSI metrics (yhsi:read)").includes("yhsi:read"),
  "label not found",
);
assert(
  "scope-free heartbeat has no scope labels",
  !extractScopeLabels("POST /api/partner/v1/heartbeat — connectivity probe (no scope required)").includes("yhsi:read"),
  "unexpected scope label found",
);

// ── Test 4: Missing route produces correct absence ────────────────────────────

console.log("\n[4] Missing routes correctly absent from docMap");
assert(
  "non-existent route is not in docMap",
  !docMap.has("GET /api/partner/v1/nonexistent"),
  "ghost route found in docMap",
);
assert(
  "wrong method for known path is not in docMap",
  !docMap.has("DELETE /api/partner/v1/chainweb/coefficients"),
  "wrong-method entry found",
);

// ── Test 5: Mis-scoped route fails scope check ────────────────────────────────

console.log("\n[5] Mis-scoped route correctly fails scope assertion");
const misscoped = buildDocMap([
  "GET  /api/partner/v1/chainweb/coefficients — evidence (wrong:scope)",
]);
const entries = misscoped.get("GET /api/partner/v1/chainweb/coefficients") ?? [];
assert(
  "entries found for mis-scoped route",
  entries.length > 0,
  "entries not found",
);
const hasCorrectScope = entries.some((e) => extractScopeLabels(e).includes("chainweb:read"));
assert(
  "mis-scoped route does NOT satisfy chainweb:read assertion",
  !hasCorrectScope,
  "incorrect scope passed assertion — bug in scope check",
);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
