/**
 * Sag rubric — grades a learner's automotive starting-circuit on the four
 * Day 3 checks:
 *
 *   1. `loop-complete`   — circuit has battery + unblown fuse + starter +
 *                          ground, and the solver confirms the starter draws
 *                          current (i.e. the loop is actually wired up).
 *
 *   2. `fuse-blown-open` — fuse is blown so terminal voltage stays at
 *                          open-circuit and starter current = 0 A.
 *
 *   3. `healthy-cranking` — fuse un-blown, healthy battery (low Ri), starter
 *                           draws 150-250 A and terminal sags to 8-10 V.
 *
 *   4. `weak-battery`    — internalResistance raised to ~0.10 Ω so terminal
 *                          drops below 10 V and starter current collapses
 *                          below 100 A — the diagnostic signature of a
 *                          failing battery.
 *
 * Other Day 3 lessons (or future automotive lessons) can opt in by attaching
 * a `sagRubric` to their guided steps or solo challenge.
 */

import type { PlacedAutoComponent } from "./component-defs";
import type { SolveOutput } from "../electrical/circuit-solver";
import type { SagRubric } from "../../../../shared/data/trade-sims/automotive-lessons";

export type { SagRubric } from "../../../../shared/data/trade-sims/automotive-lessons";
export type { SagRubricMode } from "../../../../shared/data/trade-sims/automotive-lessons";

export type SagGradeStatus = "pass" | "fail" | "pending";

export interface SagGrade {
  status: SagGradeStatus;
  message: string;
}

/**
 * Evaluate a sag rubric against the latest solve + current component list.
 * Returns `status: 'pending'` until the learner has run the sim (except for
 * some component-presence checks that don't need a solve).
 */
export function gradeSag(
  rubric: SagRubric,
  lastSolve: SolveOutput | null,
  components: PlacedAutoComponent[] | null | undefined,
): SagGrade {
  const comps = components ?? [];

  // ── 1. loop-complete ──────────────────────────────────────────────────────
  if (rubric.mode === "loop-complete") {
    const hasBattery = comps.some((c) => c.kind === "car_battery");
    const hasFuseUnblown = comps.some((c) => c.kind === "fuse" && !c.props.blown);
    const hasStarter = comps.some((c) => c.kind === "starter_motor");
    const hasGround = comps.some((c) => c.kind === "ground_point");

    if (!hasBattery || !hasFuseUnblown || !hasStarter || !hasGround) {
      return { status: "fail", message: rubric.failMessage };
    }
    // Also require a successful solve to confirm the loop is wired, not just
    // placed. If the starter draws > 0 A, the loop is closed.
    if (!lastSolve) {
      return {
        status: "pending",
        message: "Run the sim to confirm the loop is wired correctly.",
      };
    }
    const starter = comps.find((c) => c.kind === "starter_motor");
    const starterCurrent = starter
      ? Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0)
      : 0;
    const pass = starterCurrent > 0.1;
    return {
      status: pass ? "pass" : "fail",
      message: pass ? rubric.passMessage : rubric.failMessage,
    };
  }

  // All remaining modes need a solve result to grade.
  if (!lastSolve) {
    return { status: "pending", message: "Run the sim to grade this step." };
  }

  // Helper: find battery terminal voltage (pos − neg nodes).
  function batteryTerminalV(battery: PlacedAutoComponent): number {
    const posNode = battery.terminalNodes.pos ?? 0;
    const negNode = battery.terminalNodes.neg ?? 0;
    return (lastSolve!.nodeVoltages[posNode] ?? 0) - (lastSolve!.nodeVoltages[negNode] ?? 0);
  }

  // ── 2. fuse-blown-open ───────────────────────────────────────────────────
  if (rubric.mode === "fuse-blown-open") {
    const battery = comps.find((c) => c.kind === "car_battery");
    const fuseBlown = comps.some((c) => c.kind === "fuse" && c.props.blown);
    const starter = comps.find((c) => c.kind === "starter_motor");

    if (!battery || !starter) {
      return { status: "fail", message: rubric.failMessage };
    }

    const openCircuit = Number(battery.props.voltage ?? 12.6);
    const terminal = batteryTerminalV(battery);
    const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);

    // Fuse blown → terminal ≈ open-circuit (within 0.15 V) and no starter current.
    const pass = fuseBlown && Math.abs(terminal - openCircuit) < 0.15 && starterCurrent < 1;
    return {
      status: pass ? "pass" : "fail",
      message: pass ? rubric.passMessage : rubric.failMessage,
    };
  }

  // ── 3. healthy-cranking ───────────────────────────────────────────────────
  if (rubric.mode === "healthy-cranking") {
    const battery = comps.find((c) => c.kind === "car_battery");
    const starter = comps.find((c) => c.kind === "starter_motor");
    const fuseUnblown = comps.some((c) => c.kind === "fuse" && !c.props.blown);

    if (!battery || !starter) {
      return { status: "fail", message: rubric.failMessage };
    }

    const terminal = batteryTerminalV(battery);
    const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);

    // Healthy battery cranking: 150-250 A, terminal 8-10 V.
    const pass =
      fuseUnblown &&
      starterCurrent >= 150 &&
      starterCurrent <= 250 &&
      terminal >= 8 &&
      terminal <= 10;
    return {
      status: pass ? "pass" : "fail",
      message: pass ? rubric.passMessage : rubric.failMessage,
    };
  }

  // ── 4. weak-battery ───────────────────────────────────────────────────────
  if (rubric.mode === "weak-battery") {
    const battery = comps.find((c) => c.kind === "car_battery");
    const starter = comps.find((c) => c.kind === "starter_motor");

    if (!battery || !starter) {
      return { status: "fail", message: rubric.failMessage };
    }

    const terminal = batteryTerminalV(battery);
    const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);

    // Weak battery: terminal < 10 V AND current collapses < 100 A.
    const pass = terminal < 10 && starterCurrent < 100;
    return {
      status: pass ? "pass" : "fail",
      message: pass ? rubric.passMessage : rubric.failMessage,
    };
  }

  return { status: "pending", message: "Unknown rubric mode." };
}
