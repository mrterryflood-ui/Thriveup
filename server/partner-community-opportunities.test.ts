import { test } from "node:test";
import assert from "node:assert/strict";
import type { GrantOpportunity } from "@shared/schema";
import { presentFundingCandidate, safeFundingUrl } from "./partner-community-opportunities";
import { PARTNER_API_CONTRACT } from "./partner-api-contract";

const now = new Date("2026-09-28T12:00:00Z");
const base = {
  id: "test",
  title: "Emergency housing support",
  agency: "Example funder",
  description: "Open to organizations in North Carolina",
  eligibilityCriteria: "Nonprofit organizations may apply",
  fundingAmount: null,
  deadline: new Date("2026-10-30T12:00:00Z"),
  source: "grants.gov",
  sourceUrl: "https://www.grants.gov/search-results-detail/123",
  verificationStatus: "unverified",
  lastVerifiedAt: null,
} satisfies Partial<GrantOpportunity>;

test("community-opportunities contract requires existing ECS community scope", () => {
  const route = PARTNER_API_CONTRACT.find((entry) => entry.path === "/api/partner/v1/community-opportunities");
  assert.equal(route?.method, "GET");
  assert.deepEqual(route?.auth, { kind: "partner", scope: "community:read" });
  assert.equal(route?.probe, true);
});

test("funding candidates disclose unverified eligibility and do not leak internal grant fields", () => {
  const result = presentFundingCandidate(base, "North Carolina", now);
  assert.equal(result?.geographyEvidence, "state mentioned in listing");
  assert.equal(result?.nonprofitEligibility, "nonprofit mentioned in eligibility text");
  assert.match(result?.availability ?? "", /verify current status/);
  assert.equal(result?.verificationStatus, "unverified");
  assert.equal(Object.hasOwn(result ?? {}, "fitAnalysis"), false);
  const unknown = presentFundingCandidate({ ...base, description: "Local project", eligibilityCriteria: null }, "North Carolina", now);
  assert.equal(unknown, null);
  const broad = presentFundingCandidate({ ...base, description: "Available nationwide", eligibilityCriteria: null }, "North Carolina", now);
  assert.equal(broad?.geographyEvidence, "national scope mentioned in listing");
  assert.equal(broad?.nonprofitEligibility, "not established");
});

test("expired, unsourced, and non-HTTPS funding is never presented", () => {
  assert.equal(presentFundingCandidate({ ...base, deadline: now }, "North Carolina", now), null);
  assert.equal(presentFundingCandidate({ ...base, sourceUrl: null }, "North Carolina", now), null);
  assert.equal(presentFundingCandidate({ ...base, sourceUrl: "javascript:alert(1)" }, "North Carolina", now), null);
  assert.equal(safeFundingUrl("https://user:pass@example.com/"), null);
  assert.equal(presentFundingCandidate({ ...base, description: "Texas only" }, "North Carolina", now), null);
  assert.equal(presentFundingCandidate({ ...base, description: "Available except North Carolina" }, "North Carolina", now), null);
});