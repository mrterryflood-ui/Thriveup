import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const schema = read("shared/schema.ts");
const chw = read("server/chw-routes.ts");
const referrals = read("server/referral-routes.ts");
const justice = read("server/justice-routes.ts");
const chainweb = read("server/chainweb-routes.ts");
const corridor = read("server/corridor-story.ts");
const corridorDocs = read("server/corridor-docs.ts");
const app = read("client/src/App.tsx");
const landing = read("client/src/pages/landing.tsx");
const contract = read("shared/impact-chain.ts");
const migration = read("migrations/20260824_chainweb_identity_integrity.sql");

assert.match(schema, /chwUserId: varchar\("chw_user_id", \{ length: 255 \}\)/);
assert.doesNotMatch(chw, /chwNumericId|parseInt\(userId/);
assert.doesNotMatch(referrals, /parseInt\(rawUserId|parseInt\(uid/);
assert.match(referrals, /chwUserId: getUserId\(req\)!/);

for (const route of ["referrals", "compliance", "juvenile-cases", "stakeholders", "neighborhoods", "trend-alerts", "cycle-breaking-sessions"]) {
  assert.match(justice, new RegExp(`app\\.get\\("/api/justice/${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}", requireAuth, requireAdmin`));
}
for (const route of ["juvenile-cases", "stakeholders", "neighborhoods", "trend-alerts", "cycle-breaking-sessions"]) {
  assert.match(justice, new RegExp(`app\\.post\\("/api/justice/${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}", requireAuth, requireAdmin`));
}

assert.match(chainweb, /cwIsAdmin/);
assert.match(chainweb, /isNull\(chainwebScenarios\.createdBy\)/);
assert.match(chainweb, /db\.transaction\(async \(tx\)/);
assert.match(chainweb, /onConflictDoUpdate/);
assert.match(chainweb, /assembleImpactChain/);
assert.match(corridor, /app\.post\("\/api\/corridor\/evidence", requireStaff/);
assert.match(corridor, /app\.delete\("\/api\/corridor\/evidence\/:id", requireStaff/);
assert.match(corridor, /app\.post\("\/api\/corridor\/refresh-race", requireStaff/);
assert.match(corridorDocs, /app\.post\("\/api\/corridor\/docs\/rebuild", requireStaff/);
assert.match(corridorDocs, /app\.post\("\/api\/corridor\/docs\/regenerate", requireStaff/);
assert.match(corridorDocs, /app\.get\("\/api\/corridor\/docs", requireStaff/);
assert.match(app, /path="\/chainweb-builder"><Redirect to="\/chainweb"/);

for (const stage of ["condition", "evidence", "intervention", "action", "implementation", "outcome", "learning"]) {
  assert.match(contract, new RegExp(`"${stage}"`));
}
assert.match(migration, /ALTER COLUMN "chw_user_id" TYPE varchar\(255\)/);
assert.match(migration, /chainweb_narratives_calculation_audience_uq/);

for (const role of ["resident", "young-person", "veteran", "student", "nonprofit", "funder", "researcher", "healthcare", "social-worker", "educator", "policymaker", "partner"]) {
  assert.match(landing, new RegExp(`"${role}"`));
}
for (const goal of ["help", "benefits", "community", "learn", "coordinate", "program", "measure", "funding", "integrate"]) {
  assert.match(landing, new RegExp(`\\["${goal}"`));
}

console.log("PASS integrated-flow foundation: identity, privacy, Chainweb contract, and guided front door");