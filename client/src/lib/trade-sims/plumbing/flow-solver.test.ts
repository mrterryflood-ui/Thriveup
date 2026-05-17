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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
