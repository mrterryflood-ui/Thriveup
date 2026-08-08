/**
 * Backflow rubric — grades a learner's plumbing network on the
 * `closedOneWays` signal returned by the flow solver.
 *
 * The solver's active-set loop flags any one-way pipe (check valve) it had
 * to force closed because the network was trying to push flow through it
 * backwards. That single signal is enough to grade three pedagogically
 * distinct outcomes:
 *
 *   - `must-close` — the learner is supposed to set up a backflow scenario
 *     and rely on the check valve. PASS when at least one one-way closed.
 *   - `must-not-close` — the learner is supposed to design a network where
 *     pressures stay correct end-to-end. PASS when none closed.
 *   - `must-have-check-valve` — the learner is supposed to install backflow
 *     protection at all. PASS when at least one `check_valve` is present.
 *
 * Other plumbing lessons can opt in by attaching a `backflowRubric` to
 * their guided steps or solo challenge.
 */

import type { FlowSolveResult } from "./flow-solver";
import type { PlacedPlumbingComponent } from "./component-defs";

export type BackflowRubricMode =
  | "must-close"
  | "must-not-close"
  | "must-have-check-valve";

export interface BackflowRubric {
  mode: BackflowRubricMode;
  /** Shown when the rubric passes. */
  passMessage: string;
  /** Shown when the rubric has been evaluated but failed. */
  failMessage: string;
  /**
   * For the flow-based modes: also require that a check valve is present in
   * the network. Guards against a false PASS on `must-not-close` when the
   * learner simply never installed the valve the step asked for.
   */
  requireCheckValve?: boolean;
  /** Shown when `requireCheckValve` is set and no check valve is placed. */
  missingCheckValveMessage?: string;
}

export type BackflowGradeStatus = "pass" | "fail" | "pending";

export interface BackflowGrade {
  status: BackflowGradeStatus;
  message: string;
  closedCount: number;
  hasCheckValve: boolean;
}

/**
 * Evaluate a backflow rubric against the latest solve + current component
 * list. Returns `status: 'pending'` until the learner has run the sim at
 * least once (except for `must-have-check-valve`, which can be graded from
 * the component list alone — no solve required).
 */
export function gradeBackflow(
  rubric: BackflowRubric,
  lastSolve: FlowSolveResult | null,
  components: PlacedPlumbingComponent[] | null | undefined,
): BackflowGrade {
  const hasCheckValve = (components ?? []).some((c) => c.kind === "check_valve");
  const closedCount = lastSolve?.closedOneWays?.length ?? 0;

  if (rubric.mode === "must-have-check-valve") {
    return {
      status: hasCheckValve ? "pass" : "fail",
      message: hasCheckValve ? rubric.passMessage : rubric.failMessage,
      closedCount,
      hasCheckValve,
    };
  }

  // Flow-based modes may additionally require the valve to exist at all —
  // otherwise `must-not-close` would vacuously pass on a valveless network.
  if (rubric.requireCheckValve && !hasCheckValve) {
    return {
      status: "fail",
      message:
        rubric.missingCheckValveMessage ??
        "This step requires a check valve in the network. Add one, then run the sim again.",
      closedCount,
      hasCheckValve,
    };
  }

  // The flow-based rubrics need an actual solve to grade against.
  if (!lastSolve) {
    return {
      status: "pending",
      message: "Run the sim to grade this step.",
      closedCount,
      hasCheckValve,
    };
  }

  if (rubric.mode === "must-close") {
    const pass = closedCount > 0;
    return {
      status: pass ? "pass" : "fail",
      message: pass ? rubric.passMessage : rubric.failMessage,
      closedCount,
      hasCheckValve,
    };
  }

  // must-not-close
  const pass = closedCount === 0;
  return {
    status: pass ? "pass" : "fail",
    message: pass ? rubric.passMessage : rubric.failMessage,
    closedCount,
    hasCheckValve,
  };
}

/**
 * Build a debrief sentence summarizing what the solver caught, regardless of
 * whether a rubric was attached. Surfaces the same `closedOneWays` signal in
 * plain-language pedagogy.
 */
export function backflowDebriefLine(
  lastSolve: FlowSolveResult | null,
  components: PlacedPlumbingComponent[] | null | undefined,
): string | null {
  if (!lastSolve) return null;
  const closed = lastSolve.closedOneWays?.length ?? 0;
  const hasCheckValve = (components ?? []).some((c) => c.kind === "check_valve");
  if (closed > 0) {
    return `Your check valve closed during the solve — that's the code-required behavior that prevented a cross-connection contamination event.`;
  }
  if (!hasCheckValve) {
    return `Your network has no backflow protection. Any cross-connection in this layout would let contaminated water reverse into the clean supply. Add a check valve (or an air gap / RPZ for higher-hazard sources).`;
  }
  return `Your check valve was present and never had to close on this run — supply pressure stayed correct end-to-end. Good design, and the protection is still there for the day a hydrant opens or the main loses pressure.`;
}
