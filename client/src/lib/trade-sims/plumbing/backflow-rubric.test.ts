/**
 * Self-running tests for the backflow rubric (Day 6 grading helper).
 *
 * No test runner is installed in this repo, so the file is its own harness
 * (same pattern as flow-solver.test.ts): each `test()` call runs immediately,
 * throws on failure, and exits non-zero if any assertion fails. Run with:
 *
 *     npx tsx client/src/lib/trade-sims/plumbing/backflow-rubric.test.ts
 *
 * Coverage:
 *  - must-close: pass / fail
 *  - must-not-close: pass / fail
 *  - must-have-check-valve: pass / fail (no solve required)
 *  - pending when no solve has run for flow-based modes
 *  - requireCheckValve guard (custom + default message)
 *  - backflowDebriefLine: null before a solve, closed > 0, no check valve,
 *    check valve present but never closed
 */

import { gradeBackflow, backflowDebriefLine, type BackflowRubric } from "./backflow-rubric";
import type { FlowSolveResult } from "./flow-solver";
import type { PlacedPlumbingComponent } from "./component-defs";

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

function solve(closedOneWays: string[]): FlowSolveResult {
  return { ok: true, heads: {}, flows: {}, iterations: 1, residual: 0, closedOneWays };
}

function comp(kind: PlacedPlumbingComponent["kind"], id = kind): PlacedPlumbingComponent {
  return { id, kind, terminalNodes: {}, props: {} };
}

const mustClose: BackflowRubric = {
  mode: "must-close",
  passMessage: "close-pass",
  failMessage: "close-fail",
};
const mustNotClose: BackflowRubric = {
  mode: "must-not-close",
  passMessage: "open-pass",
  failMessage: "open-fail",
};
const mustHaveValve: BackflowRubric = {
  mode: "must-have-check-valve",
  passMessage: "valve-pass",
  failMessage: "valve-fail",
};

console.log("backflow-rubric tests:");

// ── must-close ──────────────────────────────────────────────────────────────
test("must-close passes when at least one one-way closed", () => {
  const g = gradeBackflow(mustClose, solve(["cv1"]), [comp("check_valve")]);
  assert(g.status === "pass", `expected pass, got ${g.status}`);
  assert(g.message === "close-pass", `wrong message: ${g.message}`);
  assert(g.closedCount === 1, `closedCount should be 1, got ${g.closedCount}`);
  assert(g.hasCheckValve, "hasCheckValve should be true");
});

test("must-close fails when nothing closed", () => {
  const g = gradeBackflow(mustClose, solve([]), [comp("check_valve")]);
  assert(g.status === "fail", `expected fail, got ${g.status}`);
  assert(g.message === "close-fail", `wrong message: ${g.message}`);
  assert(g.closedCount === 0, `closedCount should be 0, got ${g.closedCount}`);
});

// ── must-not-close ──────────────────────────────────────────────────────────
test("must-not-close passes when no one-way closed", () => {
  const g = gradeBackflow(mustNotClose, solve([]), [comp("check_valve")]);
  assert(g.status === "pass", `expected pass, got ${g.status}`);
  assert(g.message === "open-pass", `wrong message: ${g.message}`);
});

test("must-not-close fails when a one-way closed", () => {
  const g = gradeBackflow(mustNotClose, solve(["cv1", "cv2"]), [comp("check_valve")]);
  assert(g.status === "fail", `expected fail, got ${g.status}`);
  assert(g.message === "open-fail", `wrong message: ${g.message}`);
  assert(g.closedCount === 2, `closedCount should be 2, got ${g.closedCount}`);
});

// ── must-have-check-valve ───────────────────────────────────────────────────
test("must-have-check-valve passes with a check valve, even with no solve", () => {
  const g = gradeBackflow(mustHaveValve, null, [comp("pipe"), comp("check_valve")]);
  assert(g.status === "pass", `expected pass, got ${g.status}`);
  assert(g.message === "valve-pass", `wrong message: ${g.message}`);
  assert(g.hasCheckValve, "hasCheckValve should be true");
});

test("must-have-check-valve fails without a check valve", () => {
  const g = gradeBackflow(mustHaveValve, solve([]), [comp("pipe"), comp("pump")]);
  assert(g.status === "fail", `expected fail, got ${g.status}`);
  assert(g.message === "valve-fail", `wrong message: ${g.message}`);
  assert(!g.hasCheckValve, "hasCheckValve should be false");
});

test("must-have-check-valve fails with null/empty component list", () => {
  const g1 = gradeBackflow(mustHaveValve, null, null);
  assert(g1.status === "fail", `null components: expected fail, got ${g1.status}`);
  const g2 = gradeBackflow(mustHaveValve, null, []);
  assert(g2.status === "fail", `empty components: expected fail, got ${g2.status}`);
});

// ── pending (no solve yet) ──────────────────────────────────────────────────
test("must-close is pending before any solve", () => {
  const g = gradeBackflow(mustClose, null, [comp("check_valve")]);
  assert(g.status === "pending", `expected pending, got ${g.status}`);
  assert(/run the sim/i.test(g.message), `pending message should prompt to run sim, got: ${g.message}`);
});

test("must-not-close is pending before any solve", () => {
  const g = gradeBackflow(mustNotClose, null, [comp("check_valve")]);
  assert(g.status === "pending", `expected pending, got ${g.status}`);
});

// ── requireCheckValve guard ─────────────────────────────────────────────────
test("requireCheckValve fails must-not-close on a valveless network (no vacuous pass)", () => {
  const rubric: BackflowRubric = { ...mustNotClose, requireCheckValve: true };
  const g = gradeBackflow(rubric, solve([]), [comp("pipe")]);
  assert(g.status === "fail", `expected fail, got ${g.status}`);
  assert(/check valve/i.test(g.message), `default missing-valve message expected, got: ${g.message}`);
});

test("requireCheckValve uses custom missingCheckValveMessage and beats pending", () => {
  const rubric: BackflowRubric = {
    ...mustClose,
    requireCheckValve: true,
    missingCheckValveMessage: "custom-missing",
  };
  // Even with no solve yet, missing valve should fail (not pending).
  const g = gradeBackflow(rubric, null, []);
  assert(g.status === "fail", `expected fail, got ${g.status}`);
  assert(g.message === "custom-missing", `expected custom message, got: ${g.message}`);
});

test("requireCheckValve satisfied lets the flow-based grade proceed", () => {
  const rubric: BackflowRubric = { ...mustClose, requireCheckValve: true };
  const g = gradeBackflow(rubric, solve(["cv1"]), [comp("check_valve")]);
  assert(g.status === "pass", `expected pass, got ${g.status}`);
});

// ── backflowDebriefLine ─────────────────────────────────────────────────────
test("debrief is null before any solve", () => {
  assert(backflowDebriefLine(null, [comp("check_valve")]) === null, "expected null");
});

test("debrief: valve closed during solve", () => {
  const line = backflowDebriefLine(solve(["cv1"]), [comp("check_valve")]);
  assert(line !== null, "expected a line");
  assert(/check valve closed/i.test(line!), `expected 'closed' debrief, got: ${line}`);
});

test("debrief: no backflow protection present", () => {
  const line = backflowDebriefLine(solve([]), [comp("pipe"), comp("pump")]);
  assert(line !== null, "expected a line");
  assert(/no backflow protection/i.test(line!), `expected 'no protection' debrief, got: ${line}`);
});

test("debrief: valve present but never had to close", () => {
  const line = backflowDebriefLine(solve([]), [comp("check_valve")]);
  assert(line !== null, "expected a line");
  assert(/present and never had to close/i.test(line!), `expected 'present, never closed' debrief, got: ${line}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
