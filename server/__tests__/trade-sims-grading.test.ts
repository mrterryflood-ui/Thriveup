/**
 * Adversarial tests for server-side attempt grading (server/trade-sims-grading.ts).
 *
 * The trust boundary of the adaptive growth path: the caller submits ONLY a
 * canvas (placed components + connectivity). The server reconstructs the
 * network, re-runs the authoritative solver (MNA circuit solver / pipe-flow
 * solver), and grades the recomputed physics. These tests prove:
 *   - a genuinely correct canvas passes (server recomputation works)
 *   - forged pass-shaped data (fake voltages/currents/closedOneWays,
 *     smuggled outcome fields) cannot produce a pass
 *   - malformed/oversized state is rejected cleanly, never crashes
 *
 * Run: npx tsx --test server/__tests__/trade-sims-grading.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeAttemptServerSide, soloChallengeHasRubric } from "../trade-sims-grading";

// ---------- fixtures ----------

const sagChallenge = {
  prompt: "x",
  successCriteria: "y",
  sagRubric: {
    mode: "battery-only-load",
    passMessage: "bus healthy",
    failMessage: "bus off-range",
  },
};

const backflowChallenge = {
  prompt: "x",
  successCriteria: "y",
  backflowRubric: {
    mode: "must-have-check-valve",
    passMessage: "valve present",
    failMessage: "no valve",
  },
};

/** A REAL healthy automotive canvas: 12.6 V battery (0.02 Ω internal) with a
 * 5 Ω load across it. Physics: V_term = 12.6·5/5.02 ≈ 12.55 V → inside the
 * 12.4–12.7 V battery-only-load window. */
const healthyAutoCanvas = [
  {
    id: "bat1",
    kind: "car_battery",
    terminalNodes: { pos: 1, neg: 0 },
    props: { voltage: 12.6, internalResistance: 0.02 },
  },
  {
    id: "coil1",
    kind: "ignition_coil",
    terminalNodes: { pos: 1, neg: 0 },
    props: { primaryResistance: 5 },
  },
];

// ---------- rubric presence ----------

test("lessons without a rubric cannot record attempts at all", () => {
  const r = gradeAttemptServerSide({ prompt: "no rubric here" }, "standard", healthyAutoCanvas);
  assert.equal(r.ok, false);
  assert.equal(soloChallengeHasRubric({ prompt: "no rubric" }), false);
  assert.equal(soloChallengeHasRubric(sagChallenge), true);
  assert.equal(soloChallengeHasRubric(backflowChallenge), true);
});

// ---------- server recomputes physics: valid canvases pass ----------

test("a genuinely correct circuit passes via server-side re-simulation", () => {
  const r = gradeAttemptServerSide(sagChallenge, "standard", healthyAutoCanvas);
  assert.deepEqual(r, { ok: true, passed: true, missedConcepts: [], summary: "bus healthy" });
});

test("a physically wrong circuit fails even if the builder intended a pass", () => {
  // Battery with no load: terminal sits at open-circuit 12.6... still in
  // window? No current flows but terminal = 12.6 V which IS in 12.4-12.7.
  // Use a low battery instead — physics says the bus is out of range.
  const lowBattery = [
    { id: "bat1", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 }, props: { voltage: 11.9, internalResistance: 0.02 } },
    { id: "coil1", kind: "ignition_coil", terminalNodes: { pos: 1, neg: 0 }, props: { primaryResistance: 5 } },
  ];
  const r = gradeAttemptServerSide(sagChallenge, "standard", lowBattery);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.passed, false);
    assert.equal(r.missedConcepts.length, 1); // concept tag from server mapping
  }
});

// ---------- forged pass-shaped data cannot unlock mastery ----------

test("forged solver output and outcome fields are ignored — physics wins", () => {
  // Attacker smuggles fake pass-shaped fields everywhere they can: fake
  // nodeVoltages, passed flags, closedOneWays, concept lists. The server
  // only reads id/kind/terminalNodes/props and recomputes everything.
  const forged = [
    {
      id: "bat1",
      kind: "car_battery",
      terminalNodes: { pos: 1, neg: 0 },
      props: { voltage: 9.0, internalResistance: 0.02 }, // dead battery in reality
      passed: true,
      nodeVoltages: { 1: 12.5 },
      solve: { ok: true, nodeVoltages: [0, 12.5] },
    },
    {
      id: "coil1",
      kind: "ignition_coil",
      terminalNodes: { pos: 1, neg: 0 },
      props: { primaryResistance: 5 },
      missedConcepts: [],
      closedOneWays: ["cv1"],
    },
  ];
  const r = gradeAttemptServerSide(sagChallenge, "standard", forged as unknown);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.passed, false); // 9 V bus can never grade into 12.4-12.7
    assert.ok(!r.missedConcepts.includes("fake-concept"));
  }
});

test("plumbing: claiming backflow protection without a valve fails; a valve passes", () => {
  const noValve = [
    { id: "p1", kind: "pipe", terminalNodes: { a: "j1", b: "j2" }, props: {} },
  ];
  const fail = gradeAttemptServerSide(backflowChallenge, "standard", noValve);
  assert.equal(fail.ok, true);
  if (fail.ok) assert.equal(fail.passed, false);

  const withValve = [
    { id: "p1", kind: "pipe", terminalNodes: { a: "j1", b: "j2" }, props: {} },
    { id: "cv1", kind: "check_valve", terminalNodes: { a: "j2", b: "j3" }, props: {} },
  ];
  const pass = gradeAttemptServerSide(backflowChallenge, "standard", withValve);
  assert.equal(pass.ok, true);
  if (pass.ok) assert.equal(pass.passed, true);
});

test("plumbing stretch: server-computed flow decides — a static valve cannot fake a closure", () => {
  // The must-have-check-valve stretch requires the valve to actually close
  // under recomputed flow. A trivial disconnected canvas produces no closure,
  // so the stretch fails no matter what the client claims.
  const staticValve = [
    { id: "cv1", kind: "check_valve", terminalNodes: { a: "j1", b: "j2" }, props: { fakeClosed: true } },
    { id: "p1", kind: "pipe", terminalNodes: { a: "j2", b: "j3" }, props: {} },
  ];
  const r = gradeAttemptServerSide(backflowChallenge, "stretch", staticValve);
  // Either graded as a fail, or rejected as unsolvable — never a pass.
  if (r.ok) assert.equal(r.passed, false);
  else assert.ok(r.error.length > 0);
});

test("sag stretch tier resolves a server-registered variant and re-simulates", () => {
  const r = gradeAttemptServerSide(sagChallenge, "stretch", healthyAutoCanvas);
  // Variant is server-registered; result comes from recomputed physics.
  if (r.ok) assert.equal(typeof r.passed, "boolean");
  else assert.match(r.error, /stretch|solved/i);
});

// ---------- malformed / abusive input is rejected cleanly ----------

test("malformed canvases return clean errors, never throw", () => {
  const cases: unknown[] = [
    "not-an-array",
    [],
    [{}],
    [{ id: "a", kind: 42, terminalNodes: {} }],
    [{ id: "a", kind: "car_battery", terminalNodes: { pos: "one", neg: 0 } }],
    [{ id: "a", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 }, props: "junk" }],
    [
      { id: "dup", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 } },
      { id: "dup", kind: "ignition_coil", terminalNodes: { pos: 1, neg: 0 } },
    ],
  ];
  for (const components of cases) {
    const r = gradeAttemptServerSide(sagChallenge, "standard", components);
    assert.equal(r.ok, false);
  }
});

test("DoS-shaped canvases are bounded: huge node ids and component floods rejected", () => {
  const hugeNode = [
    { id: "bat1", kind: "car_battery", terminalNodes: { pos: 999999, neg: 0 }, props: {} },
  ];
  assert.equal(gradeAttemptServerSide(sagChallenge, "standard", hugeNode).ok, false);

  const flood = Array.from({ length: 500 }, (_, i) => ({
    id: `c${i}`,
    kind: "ignition_coil",
    terminalNodes: { pos: 1, neg: 0 },
    props: {},
  }));
  assert.equal(gradeAttemptServerSide(sagChallenge, "standard", flood).ok, false);
});
