import assert from "node:assert/strict";
import test from "node:test";
import { governmentDraft, governmentNavigatorReceiptSchema, resolveGovernmentNavigatorRequest, type GovernmentNavigatorReceipt } from "@shared/government-coordination";
import { enforceGroundedClaims } from "./ai-claim-grounding";
import { governmentNavigatorRules, governmentNavigatorInstructions } from "./government-navigator";
import { navigatorHonesty } from "./inference-honesty-adapter";

const request = { geography: "county", id: "48453", need: "health", role: "planner" } as const;
const receipt: GovernmentNavigatorReceipt = {
  request, checkedAt: "2026-10-09T17:00:00.000Z", error: null,
  nextQuestion: "Which concern should come first?",
  tools: [{ path: "/health-network", title: "Health Network", reason: "Find public resources", access: "public" }],
  evidence: {
    geography: "county", id: "48453", label: "Travis", state: "TX",
    sourceUrl: "https://data.cdc.gov/resource/swc5-untb.json", datasetId: "swc5-untb",
    release: "2025", fetchedAt: "2026-10-09T17:00:00.000Z", sourceUpdatedAt: null,
    status: "partial", rejectedRows: 0, limitations: ["Modeled adult estimates."],
    coverage: { returnedMeasureCount: 33, datasetMeasureCount: 40, geographyVerified: true,
      unavailableMeasureIds: ["EMOTIONSPT", "FOODINSECU", "LACKTRPT", "SHUTUTILITY", "LONELINESS", "HOUSINSECU", "FOODSTAMP"] },
    measures: Array.from({ length: 33 }, (_, i) => ({
      id: `TEST${i}`, label: `Fixture measure ${i}`, category: "Health",
      value: i === 0 ? null : 10, unit: "%", year: 2023, lower95: null, upper95: null,
      population: null, footnote: null, method: "modeled" as const, valueType: "Crude prevalence" as const,
    })),
  },
};

test("source receipt retains all missing codes, nulls, exact identity and real tools", () => {
  const parsed = governmentNavigatorReceiptSchema.parse(receipt);
  assert.equal(parsed.evidence?.measures[0].value, null);
  assert.equal(parsed.evidence?.coverage.unavailableMeasureIds.length, 7);
  assert.equal(parsed.tools[0].path, "/health-network");
  assert.equal(governmentNavigatorReceiptSchema.safeParse({
    ...receipt, request: { ...request, geography: "zcta" },
  }).success, false);
  assert.equal(governmentNavigatorReceiptSchema.safeParse({
    ...receipt, evidence: { ...receipt.evidence, coverage: { ...receipt.evidence!.coverage, returnedMeasureCount: 38 } },
  }).success, false);
  assert.equal(governmentNavigatorReceiptSchema.safeParse({
    ...receipt, evidence: { ...receipt.evidence, sourceUrl: "not-a-url" },
  }).success, false);
});

test("wrong returned count is stripped before delivery; exact source counts survive", () => {
  const rules = governmentNavigatorRules(receipt);
  assert.equal(enforceGroundedClaims("There are 38 health indicators.", rules).droppedAny, true);
  assert.equal(enforceGroundedClaims("There are 33 health indicators.", rules).droppedAny, false);
  assert.equal(enforceGroundedClaims("We retrieved 33 of 40 measures.", rules).droppedAny, false);
  assert.equal(enforceGroundedClaims("We retrieved 38 out of 40 indicators.", rules).droppedAny, true);
  assert.equal(enforceGroundedClaims("The catalog defines 40 measures.", rules).droppedAny, false);
  // Seven absent rows + one present-but-null estimate; neither becomes zero.
  assert.equal(enforceGroundedClaims("There are 8 unavailable measures.", rules).droppedAny, false);
  assert.equal(enforceGroundedClaims("There are 7 unavailable measures.", rules).droppedAny, true);
});

test("narrative percentages cannot masquerade as checked named source values", () => {
  const result = enforceGroundedClaims("Obesity is 35.8%. Choose an access barrier.", governmentNavigatorRules(receipt));
  assert.equal(result.droppedAny, true);
  assert.equal(result.text.includes("35.8%"), false);
  assert.equal(result.text.includes("Choose an access barrier."), true);
});

test("unavailable source never approves numeric coverage", () => {
  const missing = { ...receipt, evidence: null, error: "Source timed out" };
  assert.equal(enforceGroundedClaims("There are 33 health indicators.", governmentNavigatorRules(missing)).droppedAny, true);
  assert.match(governmentNavigatorInstructions(missing), /not retrieved/);
});

test("advisory receipt acknowledges source facts without certifying all narrative", () => {
  const result = navigatorHonesty("Choose a public tool.", null, null, false, null, receipt);
  assert.equal(result.reasons.some(reason => reason.includes("No evidence facts")), false);
  assert.match(result.scope, /general prose.*not verified/);
  assert.equal(navigatorHonesty("Choose a public tool.", null, null, false, null).status, "not_evaluated");
});

test("follow-up context retains FIPS; a fresh draft overrides it; malformed input fails closed", () => {
  assert.deepEqual(resolveGovernmentNavigatorRequest("What can we do next?", request), request);
  const changed = { ...request, need: "food" } as const;
  assert.deepEqual(resolveGovernmentNavigatorRequest(governmentDraft(changed), request), changed);
  assert.throws(() => resolveGovernmentNavigatorRequest("[Government evidence: county:00000; need:health; role:planner]", request));
  assert.throws(() => resolveGovernmentNavigatorRequest("Next", { ...request, role: "admin" }));
  assert.equal(resolveGovernmentNavigatorRequest("General question"), null);
});

test("interpretation instructions bind source, all gaps, vintage and real tool plan", () => {
  const text = governmentNavigatorInstructions(receipt);
  assert.match(text, /exactly 33 measure records out of 40/);
  assert.match(text, /FOODSTAMP/);
  assert.match(text, /observation 2023/);
  assert.match(text, /unavailable, not zero/);
  assert.match(text, /Health Network \(\/health-network/);
  assert.match(text, /No unsupported comparisons/);
  const restricted = governmentNavigatorInstructions({
    ...receipt, tools: [...receipt.tools, { path: "/chw-dashboard", title: "CHW Dashboard", reason: "Staff coordination", access: "staff" }],
  });
  assert.equal(restricted.includes("/chw-dashboard"), false);
});
