/**
 * Contract verifier for the nationwide Community Brief geography foundation.
 *
 * This is deliberately cheap and read-only: it verifies the persisted national
 * ZCTA crosswalk and the public coverage contract without triggering AI or
 * thousands of live Census requests.
 */
const BASE = process.env.BASE_URL || "http://localhost:5000";

function pass(message: string) {
  console.log(`  ✓ ${message}`);
}

function fail(message: string): never {
  console.error(`  ✗ ${message}`);
  process.exit(1);
}

const response = await fetch(`${BASE}/api/conductor/community-brief/coverage`);
if (!response.ok) fail(`coverage endpoint returned HTTP ${response.status}`);

const body = await response.json() as {
  geography?: { analyticalUnit?: string; disclosure?: string };
  coverage?: {
    zctaCount?: number;
    statesAndDistrictCovered?: number;
    completeStateCoverage?: boolean;
  };
  source?: { publisher?: string; dataset?: string; limitations?: string[] };
  stateBreakdown?: Record<string, number>;
};

if (body.geography?.analyticalUnit !== "Census ZCTA") {
  fail("analytical unit is not explicitly Census ZCTA");
}
pass("analytical unit is explicitly Census ZCTA");

if (!body.geography?.disclosure?.includes("USPS ZIP Codes")) {
  fail("ZIP-versus-ZCTA disclosure is missing");
}
pass("ZIP-versus-ZCTA disclosure is present");

const zctaCount = body.coverage?.zctaCount ?? 0;
if (zctaCount < 30000) fail(`unexpectedly low ZCTA coverage: ${zctaCount}`);
pass(`national ZCTA crosswalk has ${zctaCount.toLocaleString()} rows`);

if ((body.coverage?.statesAndDistrictCovered ?? 0) < 51 || !body.coverage?.completeStateCoverage) {
  fail("all 50 states plus DC are not represented");
}
pass("all 50 states plus DC are represented");

const stateBreakdown = body.stateBreakdown || {};
if (Object.values(stateBreakdown).some((count) => !Number.isInteger(count) || count <= 0)) {
  fail("state breakdown contains an invalid count");
}
pass("every covered state has a positive integer ZCTA count");

if (body.source?.publisher !== "U.S. Census Bureau" || !body.source.dataset) {
  fail("primary source metadata is incomplete");
}
pass("primary source metadata is present");

if (!body.source.limitations?.some((item) => item.includes("upstream indicator"))) {
  fail("coverage-versus-indicator-availability limitation is missing");
}
pass("coverage limitations are disclosed");

console.log("All nationwide Community Brief coverage checks passed.");