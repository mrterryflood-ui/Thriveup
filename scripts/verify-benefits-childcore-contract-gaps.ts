/**
 * Focused static checks for the benefits/ChildCORE verification boundary.
 * These checks intentionally do not require a running server or database.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { getVerifierProbes } from "../server/partner-api-contract";
import { EXPECTED_ENDPOINTS } from "../server/partner-api-contract-probe";

const benefits = readFileSync(new URL("../server/benefits-routes.ts", import.meta.url), "utf8");
const childcore = readFileSync(new URL("../server/childcore-routes.ts", import.meta.url), "utf8");
const integration = readFileSync(new URL("../client/src/pages/childcore-integration.tsx", import.meta.url), "utf8");

assert.match(benefits, /app\.get\("\/api\/benefits\/screenings", requireBenefitsStaff/);
assert.match(benefits, /BENEFITS_STAFF_ROLES = new Set/);
assert.match(benefits, /Staff access required to read screening records/);
assert.match(benefits, /app\.post\("\/api\/benefits\/screenings", publicScreenerRateLimit/);

assert.match(childcore, /res\.status\(503\)\.json\(\{ error: "ChildCORE unavailable or not configured" \}\)/);
assert.match(integration, /Live inbound health probe is unavailable/);
assert.match(integration, /status="unknown"/);

assert.deepEqual(
  EXPECTED_ENDPOINTS,
  getVerifierProbes(),
  "startup probe set must be derived from the contract registry",
);
assert.ok(EXPECTED_ENDPOINTS.length > 0, "contract registry must declare at least one probe");

console.log("PASS benefits staff guard, ChildCORE outage disclosure, and probe registry coverage");