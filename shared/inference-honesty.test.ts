import assert from "node:assert/strict";
import test from "node:test";
import { detectOverrides, oversightGate, safeOversightGate, evaluateAnswer, aggregate, GOLDEN_SET, lookupModel, routePolicy, estimateCost, applyEvalScore, evalScoreRecord, isGateVerdict, HAZARD_UNITS, THRIVEUP_UNITS, MAX_HONESTY_OUTPUT_CHARS } from "./inference-honesty";
import { navigatorHonesty } from "../server/inference-honesty-adapter";

test("original shared mechanism remains available with explicit domain units", () => {
  assert.equal(detectOverrides("Crest 12.4 ft", [{ label: "Gauge", value: "5.9 ft" }], HAZARD_UNITS).length, 1);
  assert.equal(detectOverrides("Speed 412 kt", [{ label: "Speed", value: "299 kt" }], ["kt"]).length, 1);
  assert.equal(detectOverrides("Completion 78%", [{ label: "Completion", value: "78%" }]).length, 0);
});
test("ThriveUp money normalizes prefix/suffix, scale and comma notation", () => {
  const facts = [{ label: "Budget", value: "$2.5M" }];
  for (const text of ["Budget $2,500,000.", "Budget 2.5 million dollars.", "Budget $2500k."]) assert.equal(detectOverrides(text, facts).length, 0, text);
  for (const text of ["Budget $9.9M.", "Budget -$2.5M.", "Budget $-2.5M.", "Budget 9 million USD."]) assert.equal(detectOverrides(text, facts).length, 1, text);
  assert.equal(detectOverrides("Budget $2.50", [{ label: "Budget", value: "$2.5" }]).length, 0);
  assert.equal(detectOverrides("Budget $.5M", [{ label: "Budget", value: "$500,000" }]).length, 0);
});
test("count/FTE/percentage drift is detected; count categories are distinct", () => {
  assert.equal(detectOverrides("9,999 participants", [{ label: "Enrollment", value: "1,240 participants" }]).length, 1);
  assert.equal(detectOverrides("3 FTE", [{ label: "Staffing", value: "2 FTEs" }]).length, 1);
  assert.equal(detectOverrides("2 FTE", [{ label: "Staffing", value: "2 FTEs" }]).length, 0);
  assert.equal(detectOverrides("25 jobs", [{ label: "Families", value: "25 families" }]).length, 1);
  assert.equal(detectOverrides("-25%", [{ label: "Rate", value: "25%" }]).length, 1);
  assert.equal(detectOverrides("25 percent", [{ label: "Rate", value: "25%" }]).length, 0);
});
test("empty, missing and malformed evidence cannot claim a pass", () => {
  assert.equal(oversightGate("", []).pass, false);
  assert.equal(oversightGate("General advice", []).status, "not_evaluated");
  assert.equal(oversightGate("General advice", []).pass, false);
  assert.equal(safeOversightGate("Completion 78%", [{ label: "X", value: 78 }]).status, "unavailable");
  assert.equal(safeOversightGate("Completion 78%", [{ label: "X", value: "78%" }]).pass, true);
  assert.equal(isGateVerdict(safeOversightGate("Text", [])), true);
  assert.equal(isGateVerdict({ pass: true, reasons: [], overrides: [] }), false);
  assert.equal(isGateVerdict({ ...safeOversightGate("Text", []), pass: true }), false);
  for (const status of ["checked", "not_evaluated", "unavailable"]) {
    assert.equal(isGateVerdict({ pass: false, status, evidenceOrigin: status === "checked" ? "server-context" : "none", scope: "Test", reasons: [], overrides: [] }), false);
  }
  assert.equal(safeOversightGate("x".repeat(MAX_HONESTY_OUTPUT_CHARS + 1), []).status, "unavailable");
});
test("labels are local to each forecast sentence, never borrowed from another", () => {
  const facts = [{ label: "Rate", value: "78%" }];
  const contract = { labels: ["projected"] as ("projected")[] };
  assert.equal(oversightGate("Completion will rise next quarter.", facts, contract).pass, false);
  assert.equal(oversightGate("Projected completion is 78%. Enrollment will rise.", facts, contract).pass, false);
  assert.equal(oversightGate("Observed completion will reach 78%.", facts, contract).pass, false);
  assert.equal(oversightGate("Projected completion will reach 78%.", facts, contract).pass, true);
});
test("golden cases are source-pinned domain fixtures, not placeholder observed outcomes", () => {
  for (const c of GOLDEN_SET) {
    const answer = `${c.requireProjectedLabel ? "Projected scenario: " : ""}${c.facts.map(f => `${f.label}: ${f.value}`).join(". ")}. ${c.requiredCitations.join(" ")}`;
    assert.equal(evaluateAnswer(c, answer).total, 1, c.id);
    assert.equal(evaluateAnswer(c, "").noInvention, 0);
    assert.equal(evaluateAnswer(c, "").total, 0);
    assert.equal(evaluateAnswer(c, `Grounded answer ${c.requiredCitations.join(" ")}`).total, 0);
    assert.equal(evaluateAnswer(c, "No citation").citationRecall, 0);
  }
  assert.equal(evaluateAnswer(GOLDEN_SET[1], "Benefit will be $3,672.").labelHeld, 0);
  assert.equal(evaluateAnswer(GOLDEN_SET[0], "Maximum $999").noInvention, 0);
  assert.equal(aggregate([]), 0);
});
test("registry does not import HazardAware scores or make up live status/prices", () => {
  assert.equal(lookupModel("gpt-5.1")?.evalScore, null);
  assert.equal(lookupModel("perplexity/sonar-pro")?.evalScore, null);
  assert.equal(routePolicy(false).candidateIds[0], "deterministic");
  assert.deepEqual(routePolicy(true).candidateIds, []);
  assert.deepEqual(routePolicy(true, ["gpt-5-nano"]).candidateIds, ["gpt-5-nano"]);
  assert.equal(estimateCost("gpt-5.1", 1000, 1000).costUsd, null);
  assert.equal(estimateCost("unknown", 1000, 1000).costUsd, null);
  assert.equal(estimateCost("deterministic", 1000, 1000).costUsd, 0);
  assert.throws(() => estimateCost("gpt-5.1", -1, 3));
  assert.throws(() => applyEvalScore("gpt-5.1", 2, 3));
  applyEvalScore("gpt-5.1", .8, 3, "2026-10-03T00:00:00Z");
  assert.equal(evalScoreRecord("gpt-5.1")?.goldenSetId, "thriveup-community-benefits-2026-10-03");
});
test("Navigator uses assembled facts; absent context stays unverified", () => {
  assert.equal(navigatorHonesty("Poverty is 12%.", { povertyRate: 12, unemploymentRate: null, uninsuredRate: null }, null, false, null).pass, true);
  assert.equal(navigatorHonesty("Poverty is 99%.", { povertyRate: 12, unemploymentRate: null, uninsuredRate: null }, null, false, null).pass, false);
  assert.equal(navigatorHonesty("Advice", null, null, false, null).status, "not_evaluated");
  assert.equal(navigatorHonesty("3 grants", null, null, false, 3).evidenceOrigin, "server-context");
});
test("known limits are explicit: bare-number and subject identity are not certified", () => {
  assert.equal(detectOverrides("Enrollment changed to 9999", [{ label: "Enrollment", value: "1240" }], THRIVEUP_UNITS).length, 0);
  assert.match(oversightGate("Enrollment 9999", [{ label: "Enrollment", value: "1240" }]).scope, /Bare numbers/);
  const unrelated = oversightGate("Poverty is 5%.", [{ label: "Unemployment", value: "5%" }]);
  assert.equal(unrelated.pass, true); // Binding grounding, not this literal screen, owns identity.
  assert.match(unrelated.scope, /subject, geography, or time period/);
});
test("hyphenated and plural duration/participant forms cannot cause false drift", () => {
  assert.equal(detectOverrides("Projection over 12 months", [{ label: "12-month scenario", value: "$3672" }]).length, 0);
  assert.equal(detectOverrides("1 participant", [{ label: "People", value: "1 participants" }]).length, 0);
  assert.equal(detectOverrides("3 months", [{ label: "Duration", value: "12-month scenario" }]).length, 1);
});