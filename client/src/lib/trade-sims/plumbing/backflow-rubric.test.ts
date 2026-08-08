/**
 * Self-running tests for the backflow rubric grader — same zero-dependency
 * harness pattern as `flow-solver.test.ts`. Run with:
 *
 *     npx tsx client/src/lib/trade-sims/plumbing/backflow-rubric.test.ts
 *
 * Focus: the failure modes flagged in code review —
 *  - `must-not-close` with `requireCheckValve` must FAIL when no check
 *    valve is placed (no vacuous pass on a valveless network).
 *  - `must-not-close` must FAIL when the valve was forced closed.
 *  - `must-have-check-valve` must FAIL when the valve is missing.
 *  - Flow-based modes stay `pending` until a solve exists.
 */

import { gradeBackflow, type BackflowRubric } from "./backflow-rubric";
import type { FlowSolveResult } from "./flow-solver";
import type { PlacedPlumbingComponent } from "./component-defs";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL  ${name}: ${(e as Error).message}`);
  }
}

function assertEq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function solve(closedOneWays: string[]): FlowSolveResult {
  return { ok: true, heads: {}, flows: {}, iterations: 1, residual: 0, closedOneWays };
}

function comp(kind: PlacedPlumbingComponent["kind"], id = kind): PlacedPlumbingComponent {
  return { id, kind, terminalNodes: {}, props: {} };
}

const mustNotCloseRequired: BackflowRubric = {
  mode: "must-not-close",
  requireCheckValve: true,
  missingCheckValveMessage: "missing valve",
  passMessage: "ok",
  failMessage: "closed",
};

test("must-not-close + requireCheckValve FAILS with no check valve, even after a clean solve", () => {
  const g = gradeBackflow(mustNotCloseRequired, solve([]), [comp("tank"), comp("pipe")]);
  assertEq(g.status, "fail", "status");
  assertEq(g.message, "missing valve", "message");
});

test("must-not-close + requireCheckValve FAILS with no check valve and no solve (not pending)", () => {
  const g = gradeBackflow(mustNotCloseRequired, null, [comp("tank")]);
  assertEq(g.status, "fail", "status");
});

test("must-not-close + requireCheckValve PASSES with valve present and zero closures", () => {
  const g = gradeBackflow(mustNotCloseRequired, solve([]), [comp("tank"), comp("check_valve")]);
  assertEq(g.status, "pass", "status");
  assertEq(g.message, "ok", "message");
});

test("must-not-close + requireCheckValve FAILS when the valve was forced closed", () => {
  const g = gradeBackflow(mustNotCloseRequired, solve(["cv-pipe"]), [comp("check_valve")]);
  assertEq(g.status, "fail", "status");
  assertEq(g.message, "closed", "message");
});

test("must-not-close + requireCheckValve is pending with valve present but no solve yet", () => {
  const g = gradeBackflow(mustNotCloseRequired, null, [comp("check_valve")]);
  assertEq(g.status, "pending", "status");
});

const mustNotClose: BackflowRubric = { mode: "must-not-close", passMessage: "p", failMessage: "f" };

test("must-not-close without requireCheckValve keeps legacy behavior (Day 6 step 1)", () => {
  assertEq(gradeBackflow(mustNotClose, solve([]), []).status, "pass", "clean solve");
  assertEq(gradeBackflow(mustNotClose, solve(["x"]), []).status, "fail", "closed valve");
  assertEq(gradeBackflow(mustNotClose, null, []).status, "pending", "no solve");
});

const mustClose: BackflowRubric = { mode: "must-close", passMessage: "p", failMessage: "f" };

test("must-close PASSES only when at least one one-way closed", () => {
  assertEq(gradeBackflow(mustClose, solve(["cv"]), [comp("check_valve")]).status, "pass", "closed");
  assertEq(gradeBackflow(mustClose, solve([]), [comp("check_valve")]).status, "fail", "open");
  assertEq(gradeBackflow(mustClose, null, []).status, "pending", "no solve");
});

const mustHave: BackflowRubric = { mode: "must-have-check-valve", passMessage: "p", failMessage: "f" };

test("must-have-check-valve grades from component list alone", () => {
  assertEq(gradeBackflow(mustHave, null, [comp("check_valve")]).status, "pass", "present");
  assertEq(gradeBackflow(mustHave, null, [comp("tank"), comp("pipe")]).status, "fail", "missing");
  assertEq(gradeBackflow(mustHave, null, null).status, "fail", "null components");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
