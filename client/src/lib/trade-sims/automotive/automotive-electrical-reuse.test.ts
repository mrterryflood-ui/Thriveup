/**
 * Integration test — proves the automotive trade reuses the electrical MNA
 * solver instead of duplicating it.
 *
 * Self-running. No test runner needed. Execute with:
 *     npx tsx client/src/lib/trade-sims/automotive/automotive-electrical-reuse.test.ts
 */

import { solveCircuit, type CircuitElement } from "../electrical/circuit-solver";
import { placedToSolverElements, type PlacedAutoComponent } from "./component-defs";

let pass = 0;
let fail = 0;

function approxEq(a: number, b: number, tol = 1e-3): boolean {
  return Math.abs(a - b) <= Math.max(tol, tol * Math.max(Math.abs(a), Math.abs(b)));
}

function check(name: string, ok: boolean, details = ""): void {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}  ${details}`);
  }
}

// -----------------------------------------------------------------------------
// Test 1 — Battery + fuse + starter to ground.
// Hand calc:
//   V = 12.6, R_total = 1e-6 (fuse) + 0.05 (starter) ≈ 0.05000…
//   I = 12.6 / 0.050001 ≈ 251.99 A
//   V across starter ≈ I × 0.05 ≈ 12.5997 V
//   V at battery+ relative to ground = 12.6 V (ideal source)
// -----------------------------------------------------------------------------
{
  // Node 0 = ground, Node 1 = battery+, Node 2 = between fuse and starter.
  const battery: PlacedAutoComponent = {
    id: "BAT",
    kind: "car_battery",
    terminalNodes: { pos: 1, neg: 0 },
    props: { voltage: 12.6 },
  };
  const fuse: PlacedAutoComponent = {
    id: "F1",
    kind: "fuse",
    terminalNodes: { a: 1, b: 2 },
    props: { ratedAmps: 200, blown: false },
  };
  const starter: PlacedAutoComponent = {
    id: "STR",
    kind: "starter_motor",
    terminalNodes: { pos: 2, neg: 0 },
    props: { resistance: 0.05 },
  };

  const elements: CircuitElement[] = [
    ...placedToSolverElements(battery),
    ...placedToSolverElements(fuse),
    ...placedToSolverElements(starter),
  ];

  const result = solveCircuit({ nodeCount: 3, elements });
  if (!result.ok) {
    check("Test 1: battery + fuse + starter solves", false, result.error);
  } else {
    check("Test 1: solver returns ok", true);
    check(
      "Test 1: V at battery+ ≈ 12.6 V",
      approxEq(result.nodeVoltages[1], 12.6, 1e-3),
      `got ${result.nodeVoltages[1]}`,
    );
    const starterCurrent = Math.abs(result.resistorCurrents["STR"]);
    check(
      "Test 1: starter current ≈ 252 A",
      approxEq(starterCurrent, 12.6 / 0.050001, 0.05),
      `got ${starterCurrent}`,
    );
  }
}

// -----------------------------------------------------------------------------
// Test 2 — Same circuit but with the fuse BLOWN.
// Expected: starter current = 0, battery+ floats at 12.6 V (ideal source).
// -----------------------------------------------------------------------------
{
  const battery: PlacedAutoComponent = {
    id: "BAT",
    kind: "car_battery",
    terminalNodes: { pos: 1, neg: 0 },
    props: { voltage: 12.6 },
  };
  const fuse: PlacedAutoComponent = {
    id: "F1",
    kind: "fuse",
    terminalNodes: { a: 1, b: 2 },
    props: { ratedAmps: 200, blown: true },
  };
  const starter: PlacedAutoComponent = {
    id: "STR",
    kind: "starter_motor",
    terminalNodes: { pos: 2, neg: 0 },
    props: { resistance: 0.05 },
  };

  const elements: CircuitElement[] = [
    ...placedToSolverElements(battery),
    ...placedToSolverElements(fuse),
    ...placedToSolverElements(starter),
  ];

  const result = solveCircuit({ nodeCount: 3, elements });
  if (!result.ok) {
    check("Test 2: blown-fuse circuit solves", false, result.error);
  } else {
    check("Test 2: solver returns ok with blown fuse", true);
    const starterCurrent = Math.abs(result.resistorCurrents["STR"]);
    check(
      "Test 2: starter current = 0 with blown fuse",
      approxEq(starterCurrent, 0, 1e-6),
      `got ${starterCurrent}`,
    );
  }
}

// -----------------------------------------------------------------------------
// Test 3 — Alternator running, battery in parallel (post-start charging).
// 14.2 V alternator vs 12.6 V battery, both with negligible internal R for
// this test (use a series 0.1 Ω each so we get a finite charge current).
//
// Build:
//   Node 1 = alternator+
//   Node 2 = battery+
//   Node 3 = common bus
//   R_alt (0.1 Ω) between 1 and 3
//   R_bat (0.1 Ω) between 2 and 3
//   Alternator vsource 14.2 V between 1 and 0
//   Battery     vsource 12.6 V between 2 and 0
//   Load: 1 Ω resistor between 3 and 0
//
// Expected behavior: bus sits between 12.6 and 14.2; alternator sources
// current, battery sinks (charging) or also sources depending on load. We
// only check that the bus voltage is between 12.6 and 14.2.
// -----------------------------------------------------------------------------
{
  const elements: CircuitElement[] = [
    { id: "ALT", kind: "vsource", nodes: [1, 0], voltage: 14.2 },
    { id: "BAT", kind: "vsource", nodes: [2, 0], voltage: 12.6 },
    { id: "R_ALT", kind: "resistor", nodes: [1, 3], resistance: 0.1 },
    { id: "R_BAT", kind: "resistor", nodes: [2, 3], resistance: 0.1 },
    { id: "LOAD", kind: "resistor", nodes: [3, 0], resistance: 1.0 },
  ];

  const result = solveCircuit({ nodeCount: 4, elements });
  if (!result.ok) {
    check("Test 3: alternator + battery + load solves", false, result.error);
  } else {
    check("Test 3: solver returns ok", true);
    const busV = result.nodeVoltages[3];
    check(
      "Test 3: bus voltage between battery (12.6) and alternator (14.2)",
      busV > 12.6 && busV < 14.2,
      `got bus=${busV}`,
    );
  }
}

// -----------------------------------------------------------------------------
// Test 4 — Diagnostic-ish components contribute nothing to the solver.
// Builds a battery + ECU + MAF + O2 circuit; expects only the battery to
// be stamped, and any node referenced by the ECU/MAF/O2 to remain at 0.
// -----------------------------------------------------------------------------
{
  const battery: PlacedAutoComponent = {
    id: "BAT",
    kind: "car_battery",
    terminalNodes: { pos: 1, neg: 0 },
    props: { voltage: 12.6 },
  };
  const ecu: PlacedAutoComponent = {
    id: "ECU",
    kind: "ecu_pcm",
    terminalNodes: { pwr: 1, gnd: 0, sensor_bus: 2 },
    props: {},
  };
  const maf: PlacedAutoComponent = {
    id: "MAF",
    kind: "maf_sensor",
    terminalNodes: { signal: 2, pwr: 1, gnd: 0 },
    props: {},
  };

  const elements: CircuitElement[] = [
    ...placedToSolverElements(battery),
    ...placedToSolverElements(ecu),
    ...placedToSolverElements(maf),
  ];

  // Only the battery should have contributed. ECU + MAF return [].
  // The solver needs SOMETHING to connect node 2; add a tiny load to keep
  // it well-posed, but only check that ECU and MAF contributed nothing.
  const ecuElems = placedToSolverElements(ecu);
  const mafElems = placedToSolverElements(maf);
  check("Test 4: ECU contributes 0 solver elements", ecuElems.length === 0);
  check("Test 4: MAF contributes 0 solver elements", mafElems.length === 0);
  check(
    "Test 4: battery alone contributes 1 vsource",
    elements.filter((e) => e.kind === "vsource").length === 1,
  );
}

// -----------------------------------------------------------------------------
// Summary.
// -----------------------------------------------------------------------------
console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
