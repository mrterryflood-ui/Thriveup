import assert from "node:assert/strict";
import test from "node:test";
import {
  detectOverrides,
  oversightGate,
  evaluateAnswer,
  aggregate,
  GOLDEN_SET,
  lookupModel,
  routePolicy,
  estimateCost,
} from "./inference-honesty.ts";

test("detector flags an invented figure and accepts a grounded one", () => {
  assert.deepEqual(
    detectOverrides("The crest is 12.4 ft.", [{ label: "Gauge", value: "5.9 ft" }]).map((o) => o.figure),
    ["12.4 ft"],
  );
  assert.equal(detectOverrides("The crest is 5.9 ft.", [{ label: "Gauge", value: "5.9 ft" }]).length, 0);
  // suffix-unit form also works for a custom unit set
  assert.equal(detectOverrides("Speed 412 kt.", [{ label: "Speed", value: "299 kt" }], ["kt"]).length, 1);
});

test("gate fails on invention, empty output, and unlabeled forecast", () => {
  const facts = [{ label: "Completion", value: "78%" }];
  assert.equal(oversightGate("Completion is 78%.", facts).pass, true);
  assert.equal(oversightGate("Completion is 99%.", facts).pass, false); // 99% not in rows (unit-bearing)
  assert.equal(oversightGate("   ", []).pass, false);
  assert.equal(
    oversightGate("Completion will rise next quarter.", facts, { labels: ["projected"] }).pass,
    false,
  );
});

test("eval scores an honest answer at no invention across all cases", () => {
  for (const c of GOLDEN_SET) {
    const honest = c.facts.map((f) => `${f.label} ${f.value} (${f.sourceName})`).join(". ");
    assert.equal(evaluateAnswer(c, honest).noInvention, 1);
  }
  const a = aggregate(GOLDEN_SET.map((c) => evaluateAnswer(c, "grounded answer")));
  assert.ok(a >= 0 && a <= 1);
});

test("registry exposes capabilities and cost without throwing", () => {
  assert.ok(lookupModel("gpt-5.1"));
  assert.equal(routePolicy(false).deterministic, true);
  assert.equal(routePolicy(true).deterministic, false);
  assert.equal(estimateCost("gpt-5.1", 1000, 1000).basis, "registry");
});
