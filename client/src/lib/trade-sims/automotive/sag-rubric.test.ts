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
  fuseRatedAmps?: number;
} = {}): PlacedAutoComponent[] {
  const {
    fuseBlown = false,
    includeFuse = true,
    includeStarter = true,
    includeGround = true,
    batteryVoltage = 12.6,
    batteryInternalResistance,
    fuseRatedAmps = 200,
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
    props: { ratedAmps: fuseRatedAmps, blown: fuseBlown },
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

{
  // PASS + tailored message: battery voltage lowered to 10 V → discharged-battery path.
  const comps = makeDay3Components({ batteryVoltage: 10 });
  const solve = makeSolve({
    nodeVoltages: [0, 7.5, 7.4],
    resistorCurrents: { STR: 150 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / pass (lowered voltage): message names battery voltage path",
    result.status === "pass" && result.message.includes("lowered battery voltage"),
    `got status=${result.status}, message=${result.message}`,
  );
}

{
  // PASS + tailored message: fuse rated down to 100 A → cable-resistance path.
  // The fuse must be CARRYING the starter current (series) to be credited.
  const comps = makeDay3Components({ fuseRatedAmps: 100 });
  const solve = makeSolve({
    nodeVoltages: [0, 8.0, 7.9],
    resistorCurrents: { STR: 150, F1: 150 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / pass (rated-down fuse): message names cable-resistance path",
    result.status === "pass" && result.message.includes("reduced fuse amperage"),
    `got status=${result.status}, message=${result.message}`,
  );
}

{
  // PASS + generic fallback: BOTH voltage lowered AND fuse rated down → ambiguous → generic passMessage.
  const comps = makeDay3Components({ batteryVoltage: 10, fuseRatedAmps: 100 });
  const solve = makeSolve({
    nodeVoltages: [0, 7.5, 7.4],
    resistorCurrents: { STR: 150, F1: 150 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / pass (both methods): ambiguous → generic pass message",
    result.status === "pass" && result.message === "Nice work!",
    `got status=${result.status}, message=${result.message}`,
  );
}

{
  // PASS + generic fallback: NEITHER method detected (healthy 12.6 V battery, 200 A fuse)
  // but current somehow lands in-band → generic passMessage.
  const comps = makeDay3Components();
  const solve = makeSolve({
    nodeVoltages: [0, 8.0, 7.9],
    resistorCurrents: { STR: 150, F1: 150 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / pass (neither detected): generic pass message fallback",
    result.status === "pass" && result.message === "Nice work!",
    `got status=${result.status}, message=${result.message}`,
  );
}

{
  // PASS + generic fallback (adversarial attribution): battery internal
  // resistance was raised to slow the crank, and a low-rated fuse sits on an
  // UNRELATED branch carrying almost no current. The fuse must NOT be
  // credited as the corroded cable → generic passMessage.
  const comps = makeDay3Components({ batteryInternalResistance: 0.014 });
  comps.push({
    id: "F_STRAY",
    kind: "fuse",
    terminalNodes: { a: 1, b: 5 },
    props: { ratedAmps: 50, blown: false },
  });
  const solve = makeSolve({
    nodeVoltages: [0, 8.0, 7.9],
    resistorCurrents: { STR: 150, F1: 150, F_STRAY: 0 },
    vsourceCurrents: {},
  });
  const result = gradeSag(makeRubric("slow-cranking"), solve, comps);
  check(
    "slow-cranking / pass (stray low fuse not conducting): NOT credited as cable path → generic message",
    result.status === "pass" && result.message === "Nice work!",
    `got status=${result.status}, message=${result.message}`,
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

// ── Day 2 component builder ────────────────────────────────────────────────────

/**
 * Build a minimal Day 2 canvas: battery (node 1 pos, node 0 neg), ground,
 * and an optional alternator component.
 *
 * batteryTerminalV reads nodeVoltages[pos] − nodeVoltages[neg], so we pass
 * the desired terminal reading through the solve's nodeVoltages array.
 */
function makeDay2Components(opts: {
  includeAlternator?: boolean;
  alternatorRunning?: boolean;
} = {}): PlacedAutoComponent[] {
  const { includeAlternator = true, alternatorRunning = false } = opts;

  const battery: PlacedAutoComponent = {
    id: "BAT",
    kind: "car_battery",
    terminalNodes: { pos: 1, neg: 0 },
    props: { voltage: 12.6, internalResistance: 0.02 },
  };
  const ground: PlacedAutoComponent = {
    id: "GND",
    kind: "ground_point",
    terminalNodes: { gnd: 0 },
    props: {},
  };
  const alternator: PlacedAutoComponent = {
    id: "ALT",
    kind: "alternator",
    terminalNodes: { pos: 1, neg: 0 },
    props: { running: alternatorRunning },
  };

  const comps: PlacedAutoComponent[] = [battery, ground];
  if (includeAlternator) comps.push(alternator);
  return comps;
}

// ── Mode 5: battery-only-load ─────────────────────────────────────────────────
// Day 2 step 3: alternator OFF (or absent), bus voltage 12.4–12.7 V.
console.log("\n── battery-only-load ────────────────────────────────────────────");

{
  // PENDING: no solve yet.
  const comps = makeDay2Components({ alternatorRunning: false });
  const result = gradeSag(makeRubric("battery-only-load"), null, comps);
  check(
    "battery-only-load / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: no alternator component at all, terminal 12.5 V (in 12.4–12.7).
  const comps = makeDay2Components({ includeAlternator: false });
  const solve = makeSolve({
    nodeVoltages: [0, 12.5, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / pass: no alternator, terminal 12.5 V → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // PASS: alternator present but running=false, terminal 12.5 V.
  const comps = makeDay2Components({ includeAlternator: true, alternatorRunning: false });
  const solve = makeSolve({
    nodeVoltages: [0, 12.5, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / pass: alternator off, terminal 12.5 V → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: alternator present with running=true — wrong state for this step.
  const comps = makeDay2Components({ includeAlternator: true, alternatorRunning: true });
  const solve = makeSolve({
    nodeVoltages: [0, 14.1, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / fail: alternator running=true → fail regardless of voltage",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: alternator off but terminal voltage too low (< 12.4 V).
  const comps = makeDay2Components({ alternatorRunning: false });
  const solve = makeSolve({
    nodeVoltages: [0, 12.0, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / fail: alternator off, terminal 12.0 V (below 12.4) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: alternator off but terminal voltage too high (> 12.7 V).
  const comps = makeDay2Components({ alternatorRunning: false });
  const solve = makeSolve({
    nodeVoltages: [0, 13.0, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / fail: alternator off, terminal 13.0 V (above 12.7) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // PASS: boundary — exactly 12.4 V (lower bound, inclusive).
  const comps = makeDay2Components({ alternatorRunning: false });
  const solve = makeSolve({
    nodeVoltages: [0, 12.4, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / pass: alternator off, terminal exactly 12.4 V (lower bound) → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // PASS: boundary — exactly 12.7 V (upper bound, inclusive).
  const comps = makeDay2Components({ alternatorRunning: false });
  const solve = makeSolve({
    nodeVoltages: [0, 12.7, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / pass: alternator off, terminal exactly 12.7 V (upper bound) → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: no battery on canvas (outer guard triggers before alternator check).
  const comps = makeDay2Components({ includeAlternator: false }).filter(
    (c) => c.kind !== "car_battery",
  );
  const solve = makeSolve({
    nodeVoltages: [0, 12.5, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("battery-only-load"), solve, comps);
  check(
    "battery-only-load / fail: no battery on canvas → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Mode 6: alternator-on-load ────────────────────────────────────────────────
// Day 2 step 4: alternator ON, bus voltage 13.8–14.4 V.
console.log("\n── alternator-on-load ───────────────────────────────────────────");

{
  // PENDING: no solve yet.
  const comps = makeDay2Components({ alternatorRunning: true });
  const result = gradeSag(makeRubric("alternator-on-load"), null, comps);
  check(
    "alternator-on-load / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: alternator running=true, terminal 14.1 V (in 13.8–14.4).
  const comps = makeDay2Components({ alternatorRunning: true });
  const solve = makeSolve({
    nodeVoltages: [0, 14.1, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / pass: alternator on, terminal 14.1 V → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: no alternator component on canvas.
  const comps = makeDay2Components({ includeAlternator: false });
  const solve = makeSolve({
    nodeVoltages: [0, 14.1, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / fail: no alternator component → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: alternator present but running=false — wrong state for this step.
  const comps = makeDay2Components({ includeAlternator: true, alternatorRunning: false });
  const solve = makeSolve({
    nodeVoltages: [0, 12.5, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / fail: alternator running=false → fail regardless of voltage",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: alternator on but terminal voltage too low (< 13.8 V — battery-only range).
  const comps = makeDay2Components({ alternatorRunning: true });
  const solve = makeSolve({
    nodeVoltages: [0, 12.5, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / fail: alternator on but terminal 12.5 V (below 13.8) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: alternator on but terminal voltage too high (> 14.4 V — overcharging).
  const comps = makeDay2Components({ alternatorRunning: true });
  const solve = makeSolve({
    nodeVoltages: [0, 15.0, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / fail: alternator on, terminal 15.0 V (above 14.4) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // PASS: boundary — exactly 13.8 V (lower bound, inclusive).
  const comps = makeDay2Components({ alternatorRunning: true });
  const solve = makeSolve({
    nodeVoltages: [0, 13.8, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / pass: alternator on, terminal exactly 13.8 V (lower bound) → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // PASS: boundary — exactly 14.4 V (upper bound, inclusive).
  const comps = makeDay2Components({ alternatorRunning: true });
  const solve = makeSolve({
    nodeVoltages: [0, 14.4, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / pass: alternator on, terminal exactly 14.4 V (upper bound) → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: no battery on canvas (outer guard triggers before alternator check).
  const comps = makeDay2Components({ includeAlternator: true, alternatorRunning: true }).filter(
    (c) => c.kind !== "car_battery",
  );
  const solve = makeSolve({
    nodeVoltages: [0, 14.1, 0],
    vsourceCurrents: {},
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("alternator-on-load"), solve, comps);
  check(
    "alternator-on-load / fail: no battery on canvas → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Mode 9: coil-swap-current (Day 4 solo challenge) ─────────────────────────
console.log("\n── coil-swap-current ────────────────────────────────────────────");

/** Battery + ignition coil(s) + ground fixture for Day 4 / Day 9 tests. */
function makeSoloCoilComponents(coilResistances: number[], opts: {
  batteryVoltage?: number;
  batteryInternalResistance?: number;
} = {}): PlacedAutoComponent[] {
  const { batteryVoltage = 12.6, batteryInternalResistance = 0.02 } = opts;
  const comps: PlacedAutoComponent[] = [
    {
      id: "BAT",
      kind: "car_battery",
      terminalNodes: { pos: 1, neg: 0 },
      props: { voltage: batteryVoltage, internalResistance: batteryInternalResistance },
    },
    { id: "GND", kind: "ground_point", terminalNodes: { gnd: 0 }, props: {} },
  ];
  coilResistances.forEach((r, i) => {
    comps.push({
      id: `COIL${i + 1}`,
      kind: "ignition_coil",
      terminalNodes: { pos: 1, neg: 0 },
      props: { primaryResistance: r },
    });
  });
  return comps;
}

{
  // PENDING: no solve yet.
  const comps = makeSoloCoilComponents([1.5]);
  const result = gradeSag(makeRubric("coil-swap-current"), null, comps);
  check(
    "coil-swap-current / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: 1.5 Ω coil, actual current ≈ expected 12.6/(0.02+1.5) ≈ 8.29 A.
  const comps = makeSoloCoilComponents([1.5]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.43],
    vsourceCurrents: { BAT_src: -8.29 },
    resistorCurrents: { COIL1: 8.29 },
  });
  const result = gradeSag(makeRubric("coil-swap-current"), solve, comps);
  check(
    "coil-swap-current / pass: 1.5 Ω coil at ~8.29 A → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: learner never swapped — still the 0.5 Ω coil (current matches
  // expected for 0.5 Ω, but the swap requirement fails).
  const comps = makeSoloCoilComponents([0.5]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.1],
    vsourceCurrents: { BAT_src: -24.2 },
    resistorCurrents: { COIL1: 24.2 },
  });
  const result = gradeSag(makeRubric("coil-swap-current"), solve, comps);
  check(
    "coil-swap-current / fail: still 0.5 Ω coil → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: 1.5 Ω coil placed but current way off expected (open circuit → 0 A).
  const comps = makeSoloCoilComponents([1.5]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.6],
    vsourceCurrents: { BAT_src: 0 },
    resistorCurrents: { COIL1: 0 },
  });
  const result = gradeSag(makeRubric("coil-swap-current"), solve, comps);
  check(
    "coil-swap-current / fail: 1.5 Ω coil but 0 A (not wired) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: no coil on canvas at all.
  const comps = makeSoloCoilComponents([]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.6],
    vsourceCurrents: { BAT_src: 0 },
    resistorCurrents: {},
  });
  const result = gradeSag(makeRubric("coil-swap-current"), solve, comps);
  check(
    "coil-swap-current / fail: no coil on canvas → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: current outside ±15% of expected (e.g. extra hidden load doubling draw).
  const comps = makeSoloCoilComponents([1.5]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.2],
    vsourceCurrents: { BAT_src: -16.5 },
    resistorCurrents: { COIL1: 8.29 },
  });
  const result = gradeSag(makeRubric("coil-swap-current"), solve, comps);
  check(
    "coil-swap-current / fail: source current double the predicted value → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL (adversarial): learner keeps the original 0.5 Ω coil AND adds the
  // 1.5 Ω coil. Combined parallel load draws far more than the predicted
  // single-coil 8 A — must fail even though total matches the multi-coil math.
  const comps = makeSoloCoilComponents([0.5, 1.5]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.0],
    vsourceCurrents: { BAT_src: -31.9 }, // 12.6 / (0.02 + 0.375)
    resistorCurrents: { COIL1: 24.0, COIL2: 8.0 },
  });
  const result = gradeSag(makeRubric("coil-swap-current"), solve, comps);
  check(
    "coil-swap-current / fail (adversarial): original 0.5 Ω coil retained alongside 1.5 Ω → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL (adversarial): two 1.5 Ω coils in parallel — total source current
  // matches the two-coil expectation, but the coil was not simply replaced.
  const comps = makeSoloCoilComponents([1.5, 1.5]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.27],
    vsourceCurrents: { BAT_src: -16.4 }, // 12.6 / (0.02 + 0.75)
    resistorCurrents: { COIL1: 8.2, COIL2: 8.2 },
  });
  const result = gradeSag(makeRubric("coil-swap-current"), solve, comps);
  check(
    "coil-swap-current / fail (adversarial): two 1.5 Ω coils in parallel → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Mode 10: parallel-7a (Day 9 solo challenge) ──────────────────────────────
console.log("\n── parallel-7a ──────────────────────────────────────────────────");

{
  // PENDING: no solve yet.
  const comps = makeSoloCoilComponents([3.6, 3.6]);
  const result = gradeSag(makeRubric("parallel-7a"), null, comps);
  check(
    "parallel-7a / pending: null solve → pending",
    result.status === "pending",
    `got status=${result.status}`,
  );
}

{
  // PASS: two 3.6 Ω coils in parallel → total ≈ 6.93 A, terminal ≈ 12.46 V.
  const comps = makeSoloCoilComponents([3.6, 3.6]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.46],
    vsourceCurrents: { BAT_src: -6.93 },
    resistorCurrents: { COIL1: 3.46, COIL2: 3.46 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / pass: two coils, 6.93 A total, terminal 12.46 V → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // PASS: boundary — exactly 7.35 A (upper bound of ±5%).
  const comps = makeSoloCoilComponents([3.4, 3.4]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.45],
    vsourceCurrents: { BAT_src: -7.35 },
    resistorCurrents: { COIL1: 3.67, COIL2: 3.67 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / pass: exactly 7.35 A (upper bound) → pass",
    result.status === "pass",
    `got status=${result.status}`,
  );
}

{
  // FAIL: only ONE coil doing all the work (7 A through a single 1.8 Ω coil).
  const comps = makeSoloCoilComponents([1.8]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.46],
    vsourceCurrents: { BAT_src: -6.92 },
    resistorCurrents: { COIL1: 6.92 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / fail: single coil (needs two in parallel) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: two coils on canvas but one is floating (carries no current).
  const comps = makeSoloCoilComponents([1.8, 3.6]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.46],
    vsourceCurrents: { BAT_src: -6.92 },
    resistorCurrents: { COIL1: 6.92, COIL2: 0 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / fail: second coil floating at 0 A → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: total current outside ±5% (two 5 Ω coils → only ~5 A).
  const comps = makeSoloCoilComponents([5, 5]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.5],
    vsourceCurrents: { BAT_src: -4.96 },
    resistorCurrents: { COIL1: 2.48, COIL2: 2.48 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / fail: 4.96 A total (outside 7 A ±5%) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL (adversarial): two 0.9 Ω coils wired in SERIES draw ~7 A total and
  // both conduct — but the topology isn't parallel, so it must fail.
  const comps = makeSoloCoilComponents([0.9, 0.9]);
  // Rewire COIL2 to sit in series: COIL1 spans nodes 1→2, COIL2 spans 2→0.
  comps.find((c) => c.id === "COIL1")!.terminalNodes = { pos: 1, neg: 2 };
  comps.find((c) => c.id === "COIL2")!.terminalNodes = { pos: 2, neg: 0 };
  const solve = makeSolve({
    nodeVoltages: [0, 12.46, 6.23],
    vsourceCurrents: { BAT_src: -6.92 }, // 12.6 / (0.02 + 1.8)
    resistorCurrents: { COIL1: 6.92, COIL2: 6.92 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / fail (adversarial): two coils in series at ~7 A → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL (adversarial): THREE parallel coils hitting 7 A total — the prompt
  // requires exactly two loads.
  const comps = makeSoloCoilComponents([5.4, 5.4, 5.4]);
  const solve = makeSolve({
    nodeVoltages: [0, 12.46],
    vsourceCurrents: { BAT_src: -6.92 },
    resistorCurrents: { COIL1: 2.31, COIL2: 2.31, COIL3: 2.31 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / fail (adversarial): three coils (needs exactly two) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

{
  // FAIL: current on target but terminal sagging below 12.4 V (weak battery).
  const comps = makeSoloCoilComponents([3.6, 3.6], { batteryInternalResistance: 0.10 });
  const solve = makeSolve({
    nodeVoltages: [0, 11.9],
    vsourceCurrents: { BAT_src: -7.0 },
    resistorCurrents: { COIL1: 3.5, COIL2: 3.5 },
  });
  const result = gradeSag(makeRubric("parallel-7a"), solve, comps);
  check(
    "parallel-7a / fail: 7 A but terminal 11.9 V (below 12.4 V floor) → fail",
    result.status === "fail",
    `got status=${result.status}`,
  );
}

// ── Integration: parallel-7a against the REAL adapter + solver ───────────────
console.log("\n── parallel-7a (integration: real adapter + solver) ────────────");

{
  const { placedToSolverElements } = await import("./component-defs");
  const { solveCircuit } = await import("../electrical/circuit-solver");

  /** Compile placed components with the same adapter path the canvas uses. */
  function solveReal(comps: PlacedAutoComponent[], nodeCount: number) {
    let next = nodeCount;
    const ctx = { allocNode: () => next++ };
    const elements = comps.flatMap((c) => placedToSolverElements(c, ctx));
    return solveCircuit({ elements, nodeCount: next });
  }

  {
    // PASS: correctly wired Day 9 solo — battery + two 3.58 Ω coils in
    // parallel (nodes 1↔0). Total ≈ 7.0 A, terminal ≈ 12.46 V.
    const comps = makeSoloCoilComponents([3.58, 3.58]);
    const result0 = solveReal(comps, 2);
    if (!("ok" in result0) || result0.ok !== true) {
      check("parallel-7a / integration pass: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("parallel-7a"), result0, comps);
      check(
        "parallel-7a / integration pass: real solve of two parallel 3.58 Ω coils → pass",
        grade.status === "pass",
        `got status=${grade.status} msg=${grade.message}`,
      );
    }
  }

  {
    // FAIL: same coils rewired in SERIES (0.9 Ω each → ~6.9 A total) with the
    // real solver — topology check must reject it.
    const comps = makeSoloCoilComponents([0.9, 0.9]);
    comps.find((c) => c.id === "COIL1")!.terminalNodes = { pos: 1, neg: 2 };
    comps.find((c) => c.id === "COIL2")!.terminalNodes = { pos: 2, neg: 0 };
    const result0 = solveReal(comps, 3);
    if (!("ok" in result0) || result0.ok !== true) {
      check("parallel-7a / integration fail: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("parallel-7a"), result0, comps);
      check(
        "parallel-7a / integration fail: real solve of two series coils at ~7 A → fail",
        grade.status === "fail",
        `got status=${grade.status}`,
      );
    }
  }

  {
    // PASS: legit Day 9 wiring WITH a fuse — battery+ (node 1) → unblown fuse
    // (1→2) → two 3.58 Ω coils in parallel on nodes 2/0. The fuse is a ~0 Ω
    // short, so the coils still span the battery.
    const comps = makeSoloCoilComponents([3.58, 3.58]);
    comps.forEach((c) => {
      if (c.kind === "ignition_coil") c.terminalNodes = { pos: 2, neg: 0 };
    });
    comps.push({
      id: "F1",
      kind: "fuse",
      terminalNodes: { a: 1, b: 2 },
      props: { ratedAmps: 10, blown: false },
    });
    const result0 = solveReal(comps, 3);
    if (!("ok" in result0) || result0.ok !== true) {
      check("parallel-7a / integration fused pass: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("parallel-7a"), result0, comps);
      check(
        "parallel-7a / integration pass: coils fed through an unblown fuse still span the battery → pass",
        grade.status === "pass",
        `got status=${grade.status} msg=${grade.message}`,
      );
    }
  }

  {
    // PASS: each coil fed through its OWN unblown fuse — battery+ (node 1),
    // fuse A 1→2 → coil A on 2/0, fuse B 1→3 → coil B on 3/0. Raw nodes
    // differ but the fuses are ~0 Ω, so this is electrically parallel and
    // spans the battery.
    const comps = makeSoloCoilComponents([3.58, 3.58]);
    comps.find((c) => c.id === "COIL1")!.terminalNodes = { pos: 2, neg: 0 };
    comps.find((c) => c.id === "COIL2")!.terminalNodes = { pos: 3, neg: 0 };
    comps.push(
      { id: "FA", kind: "fuse", terminalNodes: { a: 1, b: 2 }, props: { ratedAmps: 10, blown: false } },
      { id: "FB", kind: "fuse", terminalNodes: { a: 1, b: 3 }, props: { ratedAmps: 10, blown: false } },
    );
    const result0 = solveReal(comps, 4);
    if (!("ok" in result0) || result0.ok !== true) {
      check("parallel-7a / integration per-branch fuses: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("parallel-7a"), result0, comps);
      check(
        "parallel-7a / integration pass: each coil on its own unblown fuse branch → pass",
        grade.status === "pass",
        `got status=${grade.status} msg=${grade.message}`,
      );
    }
  }

  {
    // FAIL: series coils where the mid-point is fuse-connected to nothing
    // special — fuse canonicalization must NOT turn a series chain into a
    // false parallel. Battery 1/0, coil A 1→2, coil B 2→0 (~7 A), plus an
    // unblown fuse from battery+ (1) to a dead-end node 3 to exercise the
    // union-find with an irrelevant fuse present.
    const comps = makeSoloCoilComponents([0.9, 0.9]);
    comps.find((c) => c.id === "COIL1")!.terminalNodes = { pos: 1, neg: 2 };
    comps.find((c) => c.id === "COIL2")!.terminalNodes = { pos: 2, neg: 0 };
    comps.push(
      { id: "FX", kind: "fuse", terminalNodes: { a: 1, b: 3 }, props: { ratedAmps: 10, blown: false } },
    );
    const result0 = solveReal(comps, 4);
    if (!("ok" in result0) || result0.ok !== true) {
      check("parallel-7a / integration series+fuse: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("parallel-7a"), result0, comps);
      check(
        "parallel-7a / integration fail: series coils remain non-parallel despite unrelated fuse → fail",
        grade.status === "fail",
        `got status=${grade.status}`,
      );
    }
  }

  {
    // FAIL (adversarial): coils are NOT on the battery at all — they hang on a
    // running alternator's nodes (2/0) while a starter motor tuned to ~1.8 Ω
    // draws a matching ~6.9 A from the battery on nodes 1/0. Every current and
    // voltage number can look right, but the required battery-powered
    // two-coil circuit is absent.
    const comps = makeSoloCoilComponents([3.9, 3.9]);
    comps.forEach((c) => {
      if (c.kind === "ignition_coil") c.terminalNodes = { pos: 2, neg: 0 };
    });
    comps.push(
      {
        id: "ALT",
        kind: "alternator",
        terminalNodes: { pos: 2, neg: 0 },
        props: { voltage: 14.2, running: true },
      },
      {
        id: "STR",
        kind: "starter_motor",
        terminalNodes: { pos: 1, neg: 0 },
        props: { resistance: 1.8 },
      },
    );
    const result0 = solveReal(comps, 3);
    if (!("ok" in result0) || result0.ok !== true) {
      check("parallel-7a / integration adversarial: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("parallel-7a"), result0, comps);
      check(
        "parallel-7a / integration fail (adversarial): coils on alternator nodes, battery loaded elsewhere → fail",
        grade.status === "fail",
        `got status=${grade.status}`,
      );
    }
  }

  {
    // FAIL (adversarial): Day 4 variant — the 1.5 Ω coil hangs on a running
    // alternator (nodes 2/0) while a starter at ~1.5 Ω pulls ~8.3 A from the
    // battery on nodes 1/0. Coil is not across the battery → must fail.
    const comps = makeSoloCoilComponents([1.5]);
    comps.forEach((c) => {
      if (c.kind === "ignition_coil") c.terminalNodes = { pos: 2, neg: 0 };
    });
    comps.push(
      {
        id: "ALT",
        kind: "alternator",
        terminalNodes: { pos: 2, neg: 0 },
        props: { voltage: 14.2, running: true },
      },
      {
        id: "STR",
        kind: "starter_motor",
        terminalNodes: { pos: 1, neg: 0 },
        props: { resistance: 1.5 },
      },
    );
    const result0 = solveReal(comps, 3);
    if (!("ok" in result0) || result0.ok !== true) {
      check("coil-swap-current / integration adversarial: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("coil-swap-current"), result0, comps);
      check(
        "coil-swap-current / integration fail (adversarial): 1.5 Ω coil on alternator nodes, battery loaded elsewhere → fail",
        grade.status === "fail",
        `got status=${grade.status}`,
      );
    }
  }

  {
    // PASS: Day 4 solo with the real solver — single 1.5 Ω coil, ~8.29 A.
    const comps = makeSoloCoilComponents([1.5]);
    const result0 = solveReal(comps, 2);
    if (!("ok" in result0) || result0.ok !== true) {
      check("coil-swap-current / integration pass: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("coil-swap-current"), result0, comps);
      check(
        "coil-swap-current / integration pass: real solve of single 1.5 Ω coil → pass",
        grade.status === "pass",
        `got status=${grade.status} msg=${grade.message}`,
      );
    }
  }
}

// ── Integration: slow-cranking against the REAL adapter + solver ─────────────
console.log("\n── slow-cranking (integration: real adapter + solver) ──────────");

{
  const { placedToSolverElements } = await import("./component-defs");
  const { solveCircuit } = await import("../electrical/circuit-solver");

  /** Compile placed components with the same adapter path the canvas uses. */
  function solveReal(comps: PlacedAutoComponent[], nodeCount: number) {
    let next = nodeCount;
    const ctx = { allocNode: () => next++ };
    const elements = comps.flatMap((c) => placedToSolverElements(c, ctx));
    return solveCircuit({ elements, nodeCount: next });
  }

  /** Day 3 loop: battery(1/0) → fuse(1→2) → starter(2/0) → ground. */
  function day3Circuit(opts: { batteryVoltage?: number; fuseRatedAmps?: number } = {}): PlacedAutoComponent[] {
    const { batteryVoltage = 12.6, fuseRatedAmps = 200 } = opts;
    return [
      { id: "BAT", kind: "car_battery", terminalNodes: { pos: 1, neg: 0 }, props: { voltage: batteryVoltage, internalResistance: 0.02 } },
      { id: "F1", kind: "fuse", terminalNodes: { a: 1, b: 2 }, props: { ratedAmps: fuseRatedAmps, blown: false } },
      { id: "STR", kind: "starter_motor", terminalNodes: { pos: 2, neg: 0 }, props: { resistance: 0.05 } },
      { id: "GND", kind: "ground_point", terminalNodes: { gnd: 0 }, props: {} },
    ];
  }

  {
    // Baseline sanity: healthy 12.6 V battery + 200 A fuse cranks ABOVE the
    // slow band (~174 A) → slow-cranking must FAIL on the untouched circuit.
    const comps = day3Circuit();
    const result0 = solveReal(comps, 3);
    if (!("ok" in result0) || result0.ok !== true) {
      check("slow-cranking / integration baseline: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("slow-cranking"), result0, comps);
      check(
        "slow-cranking / integration baseline: healthy untouched circuit (~174 A) → fail",
        grade.status === "fail",
        `got status=${grade.status} I_STR=${Math.abs(result0.resistorCurrents["STR"] ?? 0)}`,
      );
      // The healthy circuit must still satisfy the Day 3 healthy-cranking step.
      const healthy = gradeSag(makeRubric("healthy-cranking"), result0, comps);
      check(
        "slow-cranking / integration baseline: healthy circuit still passes healthy-cranking",
        healthy.status === "pass",
        `got status=${healthy.status}`,
      );
    }
  }

  {
    // PATH A: lower battery voltage to 10 V (fuse untouched at 200 A).
    // Real solve → ~138 A → pass with the battery-voltage message.
    const comps = day3Circuit({ batteryVoltage: 10 });
    const result0 = solveReal(comps, 3);
    if (!("ok" in result0) || result0.ok !== true) {
      check("slow-cranking / integration path A: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("slow-cranking"), result0, comps);
      check(
        "slow-cranking / integration pass (real solve): 10 V battery → tailored battery-voltage message",
        grade.status === "pass" && grade.message.includes("lowered battery voltage"),
        `got status=${grade.status} msg=${grade.message} I_STR=${Math.abs(result0.resistorCurrents["STR"] ?? 0)}`,
      );
    }
  }

  {
    // PATH B: rate the fuse down to 50 A (battery healthy at 12.6 V).
    // Adapter stamps R = 0.5/50 = 0.01 Ω → real solve → ~157.5 A → pass with
    // the cable-resistance message.
    const comps = day3Circuit({ fuseRatedAmps: 50 });
    const result0 = solveReal(comps, 3);
    if (!("ok" in result0) || result0.ok !== true) {
      check("slow-cranking / integration path B: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("slow-cranking"), result0, comps);
      check(
        "slow-cranking / integration pass (real solve): 50 A fuse stand-in → tailored cable-resistance message",
        grade.status === "pass" && grade.message.includes("reduced fuse amperage"),
        `got status=${grade.status} msg=${grade.message} I_STR=${Math.abs(result0.resistorCurrents["STR"] ?? 0)}`,
      );
    }
  }

  {
    // ADVERSARIAL: slow crank achieved by lowering battery voltage, while an
    // unrelated 50 A fuse dangles on a dead-end branch carrying no current.
    // The stray fuse must NOT be credited — battery message expected? No:
    // both signals present would be ambiguous, but the stray fuse conducts
    // ~0 A so only the voltage path is causal → battery-voltage message.
    const comps = day3Circuit({ batteryVoltage: 10 });
    comps.push({
      id: "F_STRAY",
      kind: "fuse",
      terminalNodes: { a: 1, b: 3 },
      props: { ratedAmps: 50, blown: false },
    });
    const result0 = solveReal(comps, 4);
    if (!("ok" in result0) || result0.ok !== true) {
      check("slow-cranking / integration adversarial: solver produced a solve", false, JSON.stringify(result0));
    } else {
      const grade = gradeSag(makeRubric("slow-cranking"), result0, comps);
      check(
        "slow-cranking / integration adversarial (real solve): dead-end low fuse ignored, voltage path credited",
        grade.status === "pass" && grade.message.includes("lowered battery voltage"),
        `got status=${grade.status} msg=${grade.message}`,
      );
    }
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
