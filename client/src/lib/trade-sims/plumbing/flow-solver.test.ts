/**
 * Self-running tests for the plumbing flow solver.
 *
 * No test runner is installed in this repo, so the file is its own harness:
 * each `test()` call runs immediately, throws on failure, and exits non-zero
 * if any assertion fails. Run with:
 *
 *     npx tsx client/src/lib/trade-sims/plumbing/flow-solver.test.ts
 *
 * Test coverage (≥8, per task spec):
 *  1. Single pipe with pressure boundary at both ends.
 *  2. Two pipes in series.
 *  3. Two pipes in parallel.
 *  4. Closed 4-pipe loop.
 *  5. Head loss along a pipe (Darcy-Weisbach formula check).
 *  6. Mass conservation at a junction with demand.
 *  7. Convergence within 50 iterations on a small network.
 *  8. Rejection of an over-constrained network.
 *  9. Rejection of invalid pipe geometry.
 * 10. Closed valve removes the pipe.
 * 11. Pump adds head in the from->to direction.
 */

import { solveFlow, pipeHeadLoss, type FlowSolveInput } from "./flow-solver";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL  ${name}\n        ${msg}`);
  }
}
function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}
function approx(a: number, b: number, tol = 1e-3): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

console.log("plumbing flow-solver tests:");

// 1. Single pipe with pressure boundary
test("1. single pipe between two reservoirs flows from higher to lower head", () => {
  const input: FlowSolveInput = {
    pipes: [{ id: "p1", from: "A", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02 }],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "B", fixedHead: 30 }],
  };
  const r = solveFlow(input);
  assert(r.ok, `expected ok, got ${JSON.stringify(r)}`);
  if (!r.ok) return;
  assert(r.flows.p1 > 0, "flow should be positive (A->B)");
  // Expected: K Q|Q| = 20  =>  Q = sqrt(20/K)
  const K = (8 * 0.02 * 100) / (Math.PI * Math.PI * 9.80665 * Math.pow(0.1, 5));
  const qExp = Math.sqrt(20 / K);
  assert(approx(r.flows.p1, qExp, 1e-6), `flow ${r.flows.p1} != expected ${qExp}`);
});

// 2. Series pipes
test("2. two pipes in series carry equal flow", () => {
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "M", length: 100, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p2", from: "M", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02 },
    ],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "M" }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(approx(r.flows.p1, r.flows.p2, 1e-6), `series flows must be equal: ${r.flows.p1} vs ${r.flows.p2}`);
  assert(r.heads.M < 50 && r.heads.M > 30, `mid head ${r.heads.M} should be between boundaries`);
});

// 3. Parallel pipes
test("3. two identical parallel pipes split flow evenly", () => {
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p2", from: "A", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02 },
    ],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(approx(r.flows.p1, r.flows.p2, 1e-6), `parallel flows must be equal: ${r.flows.p1} vs ${r.flows.p2}`);
});

// 4. Closed 4-pipe loop
test("4. closed 4-pipe loop with one reservoir and one demand converges", () => {
  // A (fixed 100m) -- p1 -- B -- p2 -- C -- p3 -- D -- p4 -- A
  // Demand of 0.01 m^3/s at C.
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "B", length: 50, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p2", from: "B", to: "C", length: 50, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p3", from: "C", to: "D", length: 50, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p4", from: "D", to: "A", length: 50, diameter: 0.1, frictionFactor: 0.02 },
    ],
    junctions: [
      { id: "A", fixedHead: 100 },
      { id: "B" },
      { id: "C", demand: 0.01 },
      { id: "D" },
    ],
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  // Mass balance at C: flow in - flow out = demand 0.01
  // p2 enters C (B->C), p3 leaves C (C->D)
  const intoC = r.flows.p2 - r.flows.p3;
  assert(approx(intoC, 0.01, 1e-3), `mass balance at C: ${intoC} != 0.01`);
  // Total withdrawn from A should be 0.01 (p1 leaves A, p4 enters A).
  const outOfA = r.flows.p1 - r.flows.p4;
  assert(approx(outOfA, 0.01, 1e-3), `mass balance at A: ${outOfA} != 0.01`);
});

// 5. Head loss matches formula
test("5. head loss along a pipe equals K*Q*|Q|", () => {
  const pipe = { id: "p1", from: "A", to: "B", length: 200, diameter: 0.15, frictionFactor: 0.025 };
  const Q = 0.05;
  const hf = pipeHeadLoss(pipe, Q);
  const K = (8 * 0.025 * 200) / (Math.PI * Math.PI * 9.80665 * Math.pow(0.15, 5));
  const expected = K * Q * Q;
  assert(approx(hf, expected, 1e-9), `head loss ${hf} != ${expected}`);
});

// 6. Mass conservation at a junction
test("6. mass conservation at a junction with multiple connections", () => {
  // Two sources feeding one demand:
  // A (50m) -- p1 -- J -- p3 -- C (30m)
  // B (45m) -- p2 -- J
  // Demand 0 at J, so flow in = flow out.
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "J", length: 100, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p2", from: "B", to: "J", length: 100, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p3", from: "J", to: "C", length: 100, diameter: 0.1, frictionFactor: 0.02 },
    ],
    junctions: [
      { id: "A", fixedHead: 50 },
      { id: "B", fixedHead: 45 },
      { id: "J" },
      { id: "C", fixedHead: 30 },
    ],
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  const balance = r.flows.p1 + r.flows.p2 - r.flows.p3;
  assert(approx(balance, 0, 1e-6), `junction balance ${balance} != 0`);
});

// 7. Convergence within 50 iterations
test("7. small network converges within 50 iterations", () => {
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "B", length: 80, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p2", from: "B", to: "C", length: 80, diameter: 0.08, frictionFactor: 0.022 },
      { id: "p3", from: "B", to: "D", length: 60, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p4", from: "D", to: "C", length: 60, diameter: 0.1, frictionFactor: 0.02 },
    ],
    junctions: [
      { id: "A", fixedHead: 80 },
      { id: "B" },
      { id: "D" },
      { id: "C", fixedHead: 40 },
    ],
    maxIterations: 50,
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.iterations <= 50, `iterations ${r.iterations} > 50`);
  assert(r.residual < 1e-8, `residual ${r.residual} too large`);
});

// 8. Reject over-constrained network
test("8. rejects junction with both fixedHead and demand (over-constrained)", () => {
  const r = solveFlow({
    pipes: [{ id: "p1", from: "A", to: "B", length: 100, diameter: 0.1 }],
    junctions: [
      { id: "A", fixedHead: 50, demand: 0.01 },
      { id: "B", fixedHead: 30 },
    ],
  });
  assert(!r.ok, "expected error for over-constrained junction");
  if (r.ok) return;
  assert(/over-constrained/i.test(r.error), `error message should mention over-constrained, got: ${r.error}`);
});

// 9. Reject invalid geometry
test("9. rejects non-positive pipe length / diameter", () => {
  const r1 = solveFlow({
    pipes: [{ id: "p1", from: "A", to: "B", length: 0, diameter: 0.1 }],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "B", fixedHead: 30 }],
  });
  assert(!r1.ok, "expected error for zero length");

  const r2 = solveFlow({
    pipes: [{ id: "p1", from: "A", to: "B", length: 100, diameter: -0.1 }],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "B", fixedHead: 30 }],
  });
  assert(!r2.ok, "expected error for negative diameter");

  const r3 = solveFlow({
    pipes: [{ id: "p1", from: "A", to: "B", length: 100, diameter: 0.1 }],
    junctions: [{ id: "A" }, { id: "B" }],
  });
  assert(!r3.ok, "expected error for no fixed-head boundary");
});

// 10. Closed valve removes the pipe
test("10. closed valve removes the pipe (zero flow, network still solves if alternate path exists)", () => {
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02 },
      { id: "p2", from: "A", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02, valveClosed: true },
    ],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.flows.p2 === 0, `closed valve flow should be 0, got ${r.flows.p2}`);
  assert(r.flows.p1 > 0, "open pipe should carry all flow");
});

// 11. Pump adds head
test("11. pump can push flow from low-head to high-head boundary", () => {
  // A=20m, B=50m. Without a pump, flow runs B->A. With a 40m pump in pipe
  // A->B (boosting from A toward B), pipe net driving head = 20+40-50 = +10,
  // so flow should be A->B.
  const r = solveFlow({
    pipes: [
      {
        id: "p1",
        from: "A",
        to: "B",
        length: 100,
        diameter: 0.1,
        frictionFactor: 0.02,
        pumpHead: 40,
      },
    ],
    junctions: [{ id: "A", fixedHead: 20 }, { id: "B", fixedHead: 50 }],
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.flows.p1 > 0, `pump should drive flow A->B; got ${r.flows.p1}`);
});

// 12. Reject negative pressure boundary
test("12. rejects negative fixedHead (pressure boundary must be >= 0)", () => {
  const r = solveFlow({
    pipes: [{ id: "p1", from: "A", to: "B", length: 10, diameter: 0.05 }],
    junctions: [{ id: "A", fixedHead: 30 }, { id: "B", fixedHead: -5 }],
  });
  assert(!r.ok, "expected error for negative fixedHead");
  if (r.ok) return;
  assert(/negative pressure boundary/i.test(r.error), `error should mention negative pressure boundary, got: ${r.error}`);
});

// 13. One-way check valve blocks reverse flow
test("13. one-way check valve installed in wrong direction blocks all flow (no backflow allowed)", () => {
  // A=50m, B=30m. Without the check valve, water flows A->B.
  // Install a check valve oriented B->A (i.e., it would only allow B->A flow).
  // The natural pressure gradient drives water A->B, but the check valve
  // sits in series and blocks that direction. Result: zero flow everywhere.
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "M", length: 50, diameter: 0.1, frictionFactor: 0.02 },
      // Check valve oriented B->M (reverse of needed direction)
      { id: "cv", from: "B", to: "M", length: 0.1, diameter: 0.019, frictionFactor: 0.022, oneWay: true, valveKAdd: 5 },
    ],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "M" }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, `expected ok, got ${!r.ok ? r.error : ""}`);
  if (!r.ok) return;
  // The check valve must be forced closed (it would have to flow M->B, which it forbids).
  assert(r.closedOneWays.includes("cv"), `check valve cv should be force-closed, got ${JSON.stringify(r.closedOneWays)}`);
  assert(Math.abs(r.flows.cv) < 1e-10, `closed check valve flow must be 0, got ${r.flows.cv}`);
  // And p1 should also have zero flow because M has no outlet.
  assert(Math.abs(r.flows.p1) < 1e-6, `p1 should have ~0 flow with no outlet from M, got ${r.flows.p1}`);
});

// 14. One-way check valve allows forward flow (no false closure)
test("14. one-way check valve allows forward flow unchanged", () => {
  // A=50m, B=30m. Check valve oriented A->B (correct direction).
  // Should pass flow forward, closedOneWays must be empty.
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "M", length: 50, diameter: 0.1, frictionFactor: 0.02 },
      { id: "cv", from: "M", to: "B", length: 0.1, diameter: 0.019, frictionFactor: 0.022, oneWay: true, valveKAdd: 5 },
    ],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "M" }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, `expected ok, got ${!r.ok ? r.error : ""}`);
  if (!r.ok) return;
  assert(r.closedOneWays.length === 0, `no check valves should be closed, got ${JSON.stringify(r.closedOneWays)}`);
  assert(r.flows.cv > 0, `check valve cv should carry forward flow, got ${r.flows.cv}`);
  assert(r.flows.p1 > 0, `p1 should carry forward flow, got ${r.flows.p1}`);
});

// 15. Parallel-path check valve blocks the reverse branch only
test("15. parallel check valve closes its branch but the open parallel branch keeps flowing", () => {
  // Two parallel paths from A (high) to B (low):
  //   Path 1: A -> p1 -> B   (open pipe)
  //   Path 2: A -> cv -> B   (check valve installed in REVERSE, B->A direction)
  // Water naturally wants to flow A->B on both. The reverse check valve on
  // path 2 closes; path 1 carries all the flow.
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02 },
      { id: "cv", from: "B", to: "A", length: 0.1, diameter: 0.05, frictionFactor: 0.022, oneWay: true, valveKAdd: 5 },
    ],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, `expected ok, got ${!r.ok ? r.error : ""}`);
  if (!r.ok) return;
  assert(r.closedOneWays.includes("cv"), `reversed check valve must be force-closed`);
  assert(Math.abs(r.flows.cv) < 1e-10, `closed check valve flow must be exactly 0, got ${r.flows.cv}`);
  assert(r.flows.p1 > 0, `open parallel path must carry forward flow, got ${r.flows.p1}`);
});

// 16. Check valve oriented correctly with parallel reverse-pressure pipe
test("16. correctly-oriented check valve stays open under steady forward pressure", () => {
  // A high, M middle (free), B low. Two paths from A to M:
  //   p1: A -> M
  //   cv: A -> M (check valve correctly oriented; should stay open)
  // Then p2: M -> B as the only outlet.
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "M", length: 50, diameter: 0.08, frictionFactor: 0.02 },
      { id: "cv", from: "A", to: "M", length: 0.1, diameter: 0.05, frictionFactor: 0.022, oneWay: true, valveKAdd: 5 },
      { id: "p2", from: "M", to: "B", length: 50, diameter: 0.1, frictionFactor: 0.02 },
    ],
    junctions: [{ id: "A", fixedHead: 60 }, { id: "M" }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, `expected ok, got ${!r.ok ? r.error : ""}`);
  if (!r.ok) return;
  assert(r.closedOneWays.length === 0, `no check valves should be closed, got ${JSON.stringify(r.closedOneWays)}`);
  assert(r.flows.cv > 0, `correctly-oriented check valve must stay open, got ${r.flows.cv}`);
  // Mass balance at M: flow in from p1 + cv == flow out via p2
  const balance = r.flows.p1 + r.flows.cv - r.flows.p2;
  assert(approx(balance, 0, 1e-6), `junction M mass balance ${balance} != 0`);
});

// 17. Check valve guarantees no negative flow (the Day 6 contract)
test("17. no one-way pipe ever reports negative flow in the result (Day 6 contract)", () => {
  // Reverse-installed check valve. Must end with flow = 0 (closed), never < 0.
  const r = solveFlow({
    pipes: [
      { id: "p1", from: "A", to: "B", length: 100, diameter: 0.1, frictionFactor: 0.02 },
      { id: "cv", from: "B", to: "A", length: 0.1, diameter: 0.05, frictionFactor: 0.022, oneWay: true, valveKAdd: 5 },
    ],
    junctions: [{ id: "A", fixedHead: 50 }, { id: "B", fixedHead: 30 }],
  });
  assert(r.ok, `expected ok, got ${!r.ok ? r.error : ""}`);
  if (!r.ok) return;
  assert(r.flows.cv >= -1e-10, `Day 6 contract violated: check valve has reverse flow ${r.flows.cv}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
