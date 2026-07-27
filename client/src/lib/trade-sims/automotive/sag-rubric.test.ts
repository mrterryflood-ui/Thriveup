/**
 * Unit tests for gradeSag() — covers pass, fail, and pending for every
 * rubric mode: loop-complete, fuse-blown-open, healthy-cranking, weak-battery,
 * and slow-cranking.
 *
 * Self-running. No test runner needed. Execute with:
 *     npx tsx client/src/lib/trade-sims/automotive/sag-rubric.test.ts
 */

import { gradeSag } from "./sag-rubric";
import type { PlacedAutoComponent } from "./component-defs";
import type { SolveOutput } from "../electrical/circuit-solver";
import type { SagRubric } from "../../../../shared/data/trade-sims/automotive-lessons";

// ── Helpers ──────────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, details = ""): void {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}  ${details}`);
  }
}

/** Minimal SagRubric fixture — only the fields gradeSag() reads. */
function makeRubric(mode: SagRubric["mode"]): SagRubric {
  return {
    mode,
    passMessage: "Nice work!",
    failMessage: "Not quite — check your circuit.",
  } as SagRubric;
}

/** Build a minimal SolveOutput without running the real solver. */
function makeSolve(overrides: Partial<SolveOutput> = {}): SolveOutput {
  return {
    ok: true,
    nodeVoltages: [],
    vsourceCurrents: {},
    resistorCurrents: {},
    ...overrides,
  } as SolveOutput;
}

/** Standard Day-3 component set: battery (node 1 pos, node 0 neg), unblown fuse, starter. */
function makeDay3Components(opts: {
  fuseBlown?: boolean;
  includeFuse?: boolean;
  includeStarter?: boolean;
  includeGround?: boolean;
  batteryVoltage?: number;
  batteryInternalResistance?: number;
} = {}): PlacedAutoComponent[] {
  const {
    fuseBlown = false,
    includeFuse = true,
    includeStarter = true,
    includeGround = true,
    batteryVoltage = 12.6,
    batteryInternalResistance,
  } = opts;

  const battery: PlacedAutoComponent = {
    id: "BAT",
    kind: "car_battery",
    terminalNodes: { pos: 1, neg: 0 },
    props: {
      voltage: batteryVoltage,
      ...(batteryInternalResistance !== undefined
        ? { internalResistance: batteryInternalResistance }
        : {}),
    },
  };

  const ground: PlacedAutoComponent = {
    id: "GND",
    kind: "ground_point",
    terminalNodes: { gnd: 0 },
    props: {},
  };

  const fuse: PlacedAutoComponent = {
    id: "F1",
    kind: "fuse",
    terminalNodes: { a: 1, b: 2 },
    props: { ratedAmps: 200, blown: fuseBlown },
  };

  const starter: PlacedAutoComponent = {
    id: "STR",
    kind: "starter_motor",
    terminalNodes: { pos: 2, neg: 0 },
    props: { resistance: 0.05 },
  };

  const comps: PlacedAutoComponent[] = [battery];
  if (includeGround) comps.push(ground);
  if (includeFuse) comps.push(fuse);
  if (includeStarter) comps.push(starter);
  return comps;
}

// ── Mode 1: loop-complete ─────────────────────────────────────────────────────
console.log("\n── loop-complete ────────────────────────────────────────────────");

{
  // PENDING: no solve result yet.
  const comps = makeDay3Components();
  const result = gradeSag(makeRubric("loop-complete"), null, comps);
  check(
    "loop-complete / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: solve present, starter carrying > 0.1 A.
  const comps = makeDay3Components();
  const solve = makeSolve({ resistorCurrents: { STR: 200 } });
  const result = gradeSag(makeRubric("loop-complete"), solve, comps);
  check(
    "loop-complete / pass: starter current 200 A → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: solve present but starter at exactly 0 A.
  const comps = makeDay3Components();
  const solve = makeSolve({ resistorCurrents: { STR: 0 } });
  const result = gradeSag(makeRubric("loop-complete"), solve, comps);
  check(
    "loop-complete / fail: starter current 0 A → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: battery missing → fail immediately (no solve needed).
  const comps = makeDay3Components().filter((c) => c.kind !== "car_battery");
  const result = gradeSag(makeRubric("loop-complete"), null, comps);
  check(
    "loop-complete / fail: no battery → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: ground missing → fail immediately.
  const comps = makeDay3Components({ includeGround: false });
  const result = gradeSag(makeRubric("loop-complete"), null, comps);
  check(
    "loop-complete / fail: no ground → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: fuse present but blown → fail (loop is open).
  const comps = makeDay3Components({ fuseBlown: true });
  const solve = makeSolve({ resistorCurrents: { STR: 0 } });
  const result = gradeSag(makeRubric("loop-complete"), solve, comps);
  check(
    "loop-complete / fail: fuse blown → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: Day 3 path requires fuse — no fuse on canvas → fail.
  const comps = makeDay3Components({ includeFuse: false });
  const solve = makeSolve({ resistorCurrents: { STR: 200 } });
  const result = gradeSag(makeRubric("loop-complete"), solve, comps);
  check(
    "loop-complete / fail: Day 3 with starter but no fuse → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Mode 2: fuse-blown-open ────────────────────────────────────────────────────
console.log("\n── fuse-blown-open ───────────────────────────────────────────────");

{
  // PENDING: no solve yet.
  const comps = makeDay3Components({ fuseBlown: true });
  const result = gradeSag(makeRubric("fuse-blown-open"), null, comps);
  check(
    "fuse-blown-open / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS (Day 3 path): fuse blown, terminal ≈ open-circuit (12.6 V), starter
  // current < 1 A. Node 1 = battery+, node 0 = battery−.
  const comps = makeDay3Components({ fuseBlown: true });
  const vOc = 12.6;
  const solve = makeSolve({
    nodeVoltages: [0, vOc, 0],     // node 0 = 0 V, node 1 = 12.6 V (open)
    resistorCurrents: { STR: 0 },  // no current through starter
    vsourceCurrents: { BAT_src: 0, BAT: 0 },
  });
  const result = gradeSag(makeRubric("fuse-blown-open"), solve, comps);
  check(
    "fuse-blown-open / pass: blown fuse, terminal at Voc, starter 0 A → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: fuse NOT blown → condition fails.
  const comps = makeDay3Components({ fuseBlown: false });
  const solve = makeSolve({
    nodeVoltages: [0, 12.6, 0],
    resistorCurrents: { STR: 0 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("fuse-blown-open"), solve, comps);
  check(
    "fuse-blown-open / fail: fuse not blown → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: fuse blown but starter still drawing 150 A (impossible IRL, but
  // catches the threshold correctly).
  const comps = makeDay3Components({ fuseBlown: true });
  const solve = makeSolve({
    nodeVoltages: [0, 12.6, 10],
    resistorCurrents: { STR: 150 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("fuse-blown-open"), solve, comps);
  check(
    "fuse-blown-open / fail: blown fuse but high starter current → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: fuse blown but terminal deviates more than 0.15 V from Voc.
  const comps = makeDay3Components({ fuseBlown: true });
  const solve = makeSolve({
    nodeVoltages: [0, 10.0, 0],    // terminal only 10 V when Voc = 12.6
    resistorCurrents: { STR: 0 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("fuse-blown-open"), solve, comps);
  check(
    "fuse-blown-open / fail: blown fuse but terminal far below Voc → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Mode 3: healthy-cranking ──────────────────────────────────────────────────
console.log("\n── healthy-cranking ─────────────────────────────────────────────");

{
  // PENDING: no solve yet.
  const comps = makeDay3Components();
  const result = gradeSag(makeRubric("healthy-cranking"), null, comps);
  check(
    "healthy-cranking / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: fuse unblown, starter 200 A (150–250 band), terminal 9.0 V (8–10 V).
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 9.0, 8.99],
    resistorCurrents: { STR: 200 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking / pass: 200 A starter, 9.0 V terminal → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: fuse blown → fails the hasFuseUnblown check.
  const comps = makeDay3Components({ fuseBlown: true });
  const solve = makeSolve({
    nodeVoltages: [0, 9.0, 8.99],
    resistorCurrents: { STR: 200 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking / fail: blown fuse → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: starter current too low (< 150 A).
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 9.0, 8.99],
    resistorCurrents: { STR: 80 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking / fail: starter current 80 A (below 150) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: starter current too high (> 250 A).
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 9.0, 8.99],
    resistorCurrents: { STR: 300 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking / fail: starter current 300 A (above 250) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: terminal voltage too low (< 8 V).
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 7.5, 7.4],
    resistorCurrents: { STR: 200 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking / fail: terminal 7.5 V (below 8 V floor) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: terminal voltage too high (> 10 V) — sag too little.
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 11.5, 11.4],
    resistorCurrents: { STR: 200 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking / fail: terminal 11.5 V (above 10 V ceiling) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Mode 4: weak-battery ──────────────────────────────────────────────────────
console.log("\n── weak-battery ─────────────────────────────────────────────────");

{
  // PENDING: no solve yet.
  const comps = makeDay3Components();
  const result = gradeSag(makeRubric("weak-battery"), null, comps);
  check(
    "weak-battery / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: terminal < 10 V AND starter < 100 A — the weak-battery signature.
  // Models R_int raised to 0.10 Ω: I ≈ 84 A, V_term ≈ 4.2 V.
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 4.2, 4.2],
    resistorCurrents: { STR: 84 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery / pass: terminal 4.2 V, current 84 A → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: terminal >= 10 V (battery not weak enough).
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 10.5, 10.4],
    resistorCurrents: { STR: 80 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery / fail: terminal 10.5 V (not below 10) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: terminal < 10 V but starter current >= 100 A.
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 9.8, 9.7],
    resistorCurrents: { STR: 100 },   // exactly 100 — not < 100
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery / fail: terminal 9.8 V but starter 100 A (not < 100) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // PASS (generic path): no starter, no coil → falls back to sag > 0.5 V check.
  // Battery Voc = 12.6 (default prop), terminal reads 4.2 V → sag = 8.4 V → pass.
  const comps: PlacedAutoComponent[] = [
    {
      id: "BAT",
      kind: "car_battery",
      terminalNodes: { pos: 1, neg: 0 },
      props: { voltage: 12.6 },
    },
    {
      id: "GND",
      kind: "ground_point",
      terminalNodes: { gnd: 0 },
      props: {},
    },
  ];
  const solve = makeSolve({
    nodeVoltages: [0, 4.2, 0],
    resistorCurrents: {},
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery / pass (generic): sag 8.4 V > 0.5 V threshold → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL (generic path): no starter, no coil, sag only 0.2 V (< 0.5 V) → fail.
  const comps: PlacedAutoComponent[] = [
    {
      id: "BAT",
      kind: "car_battery",
      terminalNodes: { pos: 1, neg: 0 },
      props: { voltage: 12.6 },
    },
    {
      id: "GND",
      kind: "ground_point",
      terminalNodes: { gnd: 0 },
      props: {},
    },
  ];
  const solve = makeSolve({
    nodeVoltages: [0, 12.4, 0],   // terminal 12.4 V → sag only 0.2 V
    resistorCurrents: {},
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery / fail (generic): sag 0.2 V < 0.5 V threshold → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Mode 5: slow-cranking ─────────────────────────────────────────────────────
console.log("\n── slow-cranking ─────────────────────────────────────────────────");

{
  // PENDING: no solve yet.
  const comps = makeDay3Components();
  const result = gradeSag(makeRubric("slow-cranking"), null, comps);
  check(
    "slow-cranking / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: starter current 150 A — exactly at the 130-170 A lower bound.
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 8.0, 7.9],
    resistorCurrents: { STR: 150 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / pass: starter 150 A (in 130-170 band) → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // PASS: starter current 130 A — exactly at lower band boundary.
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 7.5, 7.4],
    resistorCurrents: { STR: 130 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / pass: starter 130 A (lower boundary) → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: starter current 200 A — above the 170 A ceiling (normal healthy cranking).
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 9.0, 8.9],
    resistorCurrents: { STR: 200 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / fail: starter 200 A (above 170) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: starter current 80 A — below the 130 A floor (too weak even for slow crank).
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 4.2, 4.1],
    resistorCurrents: { STR: 80 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / fail: starter 80 A (below 130) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: no starter on canvas.
  const comps = makeDay3Components({ includeStarter: false });
  const solve = makeSolve({ resistorCurrents: {} });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / fail: no starter motor → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Coil-circuit helpers ───────────────────────────────────────────────────────

/**
 * Build a coil-based canvas (battery + ground + optional fuse + ignition_coil).
 * primaryResistance defaults to 0.5 Ω (Day 4).
 */
function makeCoilComponents(opts: {
  primaryResistance?: number;
  fuseBlown?: boolean;
  includeFuse?: boolean;
  batteryVoltage?: number;
  batteryInternalResistance?: number;
} = {}): PlacedAutoComponent[] {
  const {
    primaryResistance = 0.5,
    fuseBlown = false,
    includeFuse = false,
    batteryVoltage = 12.6,
    batteryInternalResistance,
  } = opts;

  const battery: PlacedAutoComponent = {
    id: "BAT",
    kind: "car_battery",
    terminalNodes: { pos: 1, neg: 0 },
    props: {
      voltage: batteryVoltage,
      ...(batteryInternalResistance !== undefined
        ? { internalResistance: batteryInternalResistance }
        : {}),
    },
  };
  const ground: PlacedAutoComponent = {
    id: "GND",
    kind: "ground_point",
    terminalNodes: { gnd: 0 },
    props: {},
  };
  const fuse: PlacedAutoComponent = {
    id: "F1",
    kind: "fuse",
    terminalNodes: { a: 1, b: 2 },
    props: { ratedAmps: 20, blown: fuseBlown },
  };
  const coil: PlacedAutoComponent = {
    id: "COIL",
    kind: "ignition_coil",
    terminalNodes: { pos: includeFuse ? 2 : 1, neg: 0 },
    props: { primaryResistance },
  };

  const comps: PlacedAutoComponent[] = [battery, ground, coil];
  if (includeFuse) comps.push(fuse);
  return comps;
}

/**
 * Compute the expected source current for a coil circuit (mirrors expectedCoilCurrent
 * in sag-rubric.ts) so tests stay in sync with the rubric formula.
 */
function coilExpectedCurrent(primaryResistance: number, batteryVoltage = 12.6, ri = 0.02): number {
  return batteryVoltage / (ri + primaryResistance);
}

// ── loop-complete (coil / Day 4 path) ─────────────────────────────────────────
console.log("\n── loop-complete (coil) ─────────────────────────────────────────");

{
  // PENDING: no solve.
  const comps = makeCoilComponents();
  const result = gradeSag(makeRubric("loop-complete"), null, comps);
  check(
    "loop-complete/coil / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: coil carrying > 0.1 A.
  const comps = makeCoilComponents({ primaryResistance: 0.5 });
  const solve = makeSolve({ resistorCurrents: { COIL: 24 } });
  const result = gradeSag(makeRubric("loop-complete"), solve, comps);
  check(
    "loop-complete/coil / pass: coil current 24 A → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: coil at 0 A (open circuit — coil not connected).
  const comps = makeCoilComponents({ primaryResistance: 0.5 });
  const solve = makeSolve({ resistorCurrents: { COIL: 0 } });
  const result = gradeSag(makeRubric("loop-complete"), solve, comps);
  check(
    "loop-complete/coil / fail: coil current 0 A → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // PASS (Day 9 style): 5 Ω coil, ~2.5 A.
  const comps = makeCoilComponents({ primaryResistance: 5 });
  const solve = makeSolve({ resistorCurrents: { COIL: 2.5 } });
  const result = gradeSag(makeRubric("loop-complete"), solve, comps);
  check(
    "loop-complete/coil / pass (Day 9 5Ω): coil current 2.5 A → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

// ── fuse-blown-open (generic / non-starter, non-coil path) ────────────────────
console.log("\n── fuse-blown-open (generic) ─────────────────────────────────────");

{
  // PENDING: no solve.
  const comps: PlacedAutoComponent[] = [
    { id: "BAT", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 }, props: { voltage: 12.6 } },
    { id: "F1", kind: "fuse", terminalNodes: { a: 1, b: 2 }, props: { ratedAmps: 20, blown: true } },
    { id: "GND", kind: "ground_point", terminalNodes: { gnd: 0 }, props: {} },
  ];
  const result = gradeSag(makeRubric("fuse-blown-open"), null, comps);
  check(
    "fuse-blown-open/generic / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: blown fuse, terminal ≈ Voc (12.6 V), source current < 0.5 A.
  const comps: PlacedAutoComponent[] = [
    { id: "BAT", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 }, props: { voltage: 12.6 } },
    { id: "F1", kind: "fuse", terminalNodes: { a: 1, b: 2 }, props: { ratedAmps: 20, blown: true } },
    { id: "GND", kind: "ground_point", terminalNodes: { gnd: 0 }, props: {} },
  ];
  const solve = makeSolve({
    nodeVoltages: [0, 12.6, 0],
    vsourceCurrents: { BAT_src: 0 },
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("fuse-blown-open"), solve, comps);
  check(
    "fuse-blown-open/generic / pass: blown fuse, Voc terminal, 0 A source → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: fuse not blown.
  const comps: PlacedAutoComponent[] = [
    { id: "BAT", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 }, props: { voltage: 12.6 } },
    { id: "F1", kind: "fuse", terminalNodes: { a: 1, b: 2 }, props: { ratedAmps: 20, blown: false } },
    { id: "GND", kind: "ground_point", terminalNodes: { gnd: 0 }, props: {} },
  ];
  const solve = makeSolve({
    nodeVoltages: [0, 12.6, 12.5],
    vsourceCurrents: { BAT: 0.1 },
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("fuse-blown-open"), solve, comps);
  check(
    "fuse-blown-open/generic / fail: fuse not blown → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: blown fuse but source current still 2 A (≥ 0.5 threshold).
  const comps: PlacedAutoComponent[] = [
    { id: "BAT", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 }, props: { voltage: 12.6 } },
    { id: "F1", kind: "fuse", terminalNodes: { a: 1, b: 2 }, props: { ratedAmps: 20, blown: true } },
    { id: "GND", kind: "ground_point", terminalNodes: { gnd: 0 }, props: {} },
  ];
  const solve = makeSolve({
    nodeVoltages: [0, 12.6, 0],
    vsourceCurrents: { BAT_src: 2.0 },
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("fuse-blown-open"), solve, comps);
  check(
    "fuse-blown-open/generic / fail: blown fuse but source current 2 A → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── healthy-cranking (coil / Day 4 and Day 9) ─────────────────────────────────
console.log("\n── healthy-cranking (coil) ───────────────────────────────────────");

{
  // PENDING: no solve.
  const comps = makeCoilComponents({ primaryResistance: 0.5 });
  const result = gradeSag(makeRubric("healthy-cranking"), null, comps);
  check(
    "healthy-cranking/coil / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS (Day 4, 0.5 Ω primary): expected ~24.2 A, actual 24.0 A (well within ±30%).
  // Terminal 12.1 V (> 11 V floor).
  const r = 0.5;
  const expected = coilExpectedCurrent(r); // ≈ 24.2 A
  const actualCurrent = expected * 1.00;   // 0% deviation — should pass
  const comps = makeCoilComponents({ primaryResistance: r });
  const solve = makeSolve({
    nodeVoltages: [0, 12.1, 12.0],
    vsourceCurrents: { BAT_src: actualCurrent },
    resistorCurrents: { COIL: actualCurrent },
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    `healthy-cranking/coil / pass (Day 4 0.5Ω ~${expected.toFixed(1)}A, 12.1V) → pass`,
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // PASS (Day 9, 5 Ω primary): expected ~2.5 A, actual within ±30%.
  // Terminal 12.5 V (> 11 V floor).
  const r = 5;
  const expected = coilExpectedCurrent(r); // ≈ 2.51 A
  const actualCurrent = expected * 0.95;   // 5% deviation — within ±30%
  const comps = makeCoilComponents({ primaryResistance: r });
  const solve = makeSolve({
    nodeVoltages: [0, 12.5, 12.4],
    vsourceCurrents: { BAT_src: actualCurrent },
    resistorCurrents: { COIL: actualCurrent },
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    `healthy-cranking/coil / pass (Day 9 5Ω ~${expected.toFixed(2)}A, 12.5V) → pass`,
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: terminal below 11 V floor (severe sag on coil circuit).
  const r = 0.5;
  const expected = coilExpectedCurrent(r);
  const comps = makeCoilComponents({ primaryResistance: r });
  const solve = makeSolve({
    nodeVoltages: [0, 10.5, 10.4],   // below 11.0 V floor
    vsourceCurrents: { BAT_src: expected },
    resistorCurrents: { COIL: expected },
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking/coil / fail: terminal 10.5 V (below 11 V floor) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: current out of ±30% tolerance (wrong-resistance coil installed).
  // Expected ~24.2 A but actual only 5 A (wrong coil — way outside window).
  const r = 0.5;
  const expected = coilExpectedCurrent(r);
  const wrongCurrent = expected * 0.15;   // 85% below expected
  const comps = makeCoilComponents({ primaryResistance: r });
  const solve = makeSolve({
    nodeVoltages: [0, 12.5, 12.4],
    vsourceCurrents: { BAT_src: wrongCurrent },
    resistorCurrents: { COIL: wrongCurrent },
  });
  const result = gradeSag(makeRubric("healthy-cranking"), solve, comps);
  check(
    "healthy-cranking/coil / fail: wrong-resistance coil, current 85% below expected → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── weak-battery (coil / Day 4 path) ─────────────────────────────────────────
console.log("\n── weak-battery (coil) ───────────────────────────────────────────");

{
  // PENDING: no solve.
  const comps = makeCoilComponents({ primaryResistance: 0.5 });
  const result = gradeSag(makeRubric("weak-battery"), null, comps);
  check(
    "weak-battery/coil / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: terminal 10.5 V (< 11.5) AND coil current 21 A (< 22 A).
  // Models R_int raised to 0.10 Ω: I = 12.6 / (0.10 + 0.5) ≈ 21 A.
  const comps = makeCoilComponents({ primaryResistance: 0.5 });
  const solve = makeSolve({
    nodeVoltages: [0, 10.5, 10.4],
    vsourceCurrents: { BAT_src: 21 },
    resistorCurrents: { COIL: 21 },
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery/coil / pass: terminal 10.5 V, coil 21 A → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: terminal >= 11.5 V (not weak enough).
  const comps = makeCoilComponents({ primaryResistance: 0.5 });
  const solve = makeSolve({
    nodeVoltages: [0, 12.1, 12.0],
    vsourceCurrents: { BAT_src: 21 },
    resistorCurrents: { COIL: 21 },
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery/coil / fail: terminal 12.1 V (not below 11.5) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: terminal low enough but coil current >= 22 A.
  const comps = makeCoilComponents({ primaryResistance: 0.5 });
  const solve = makeSolve({
    nodeVoltages: [0, 10.5, 10.4],
    vsourceCurrents: { BAT_src: 22 },
    resistorCurrents: { COIL: 22 },   // exactly at threshold — not < 22
  });
  const result = gradeSag(makeRubric("weak-battery"), solve, comps);
  check(
    "weak-battery/coil / fail: terminal 10.5 V but coil 22 A (not < 22) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
