/**
 * Sag rubric — grades automotive canvas circuits across six modes.
 *
 * Originally written for the Day 3 starting-circuit exclusively.
 * Expanded to support Day 4 (ignition-coil primary), Day 9 (wiring
 * diagram / headlight circuit, where `ignition_coil` at 5 Ω stands in
 * for a resistive load because the automotive palette has no generic
 * "resistor" component), and Day 2 (battery/charging system).
 *
 * Mode overview
 * ─────────────
 *   1. loop-complete      — circuit is wired and current flows.
 *   2. fuse-blown-open    — fuse blown, terminal ≈ open-circuit, no load current.
 *   3. healthy-cranking   — load current in-range, terminal voltage above its
 *                           circuit-type floor (no severe sag).
 *   4. weak-battery       — internalResistance raised, terminal drops, load
 *                           current collapses — the failing-battery signature.
 *   5. battery-only-load  — Day 2 step 3: alternator OFF, bus voltage 12.4–12.7 V.
 *   6. alternator-on-load — Day 2 step 4: alternator ON, bus voltage 13.8–14.4 V.
 *
 * Circuit-type detection
 * ──────────────────────
 * The grader inspects which load component is on the canvas and picks
 * the appropriate thresholds automatically:
 *
 *   • starter_motor present → Day 3 thresholds (150-250 A, terminal 8-10 V)
 *   • ignition_coil present, no starter → Day 4 / Day 9 thresholds.
 *     The grader computes the expected current dynamically from the actual
 *     coil primaryResistance values (parallel combination) and the battery
 *     open-circuit voltage, then checks the actual source current is within
 *     ±30% of that expected value. This catches wrong-resistance coils and
 *     open-circuit faults regardless of whether the lesson uses a 0.5 Ω
 *     primary (Day 4) or a 5 Ω headlight stand-in (Day 9).
 *
 * Fuse enforcement
 * ────────────────
 * In `loop-complete`, if any fuse component exists on the canvas the grader
 * requires it to be unblown. This matches Day 9's circuit requirement
 * (battery → fuse → load → ground) without breaking Day 4 (no fuse on
 * canvas by default).
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

  // ── Shared helpers ────────────────────────────────────────────────────────

  /** Voltage at battery+ terminal minus battery− terminal. */
  function batteryTerminalV(battery: PlacedAutoComponent): number {
    if (!lastSolve) return 0;
    const posNode = battery.terminalNodes.pos ?? 0;
    const negNode = battery.terminalNodes.neg ?? 0;
    return (lastSolve.nodeVoltages[posNode] ?? 0) - (lastSolve.nodeVoltages[negNode] ?? 0);
  }

  /**
   * Total current drawn from the battery (always positive).
   *
   * When stamped with internal resistance via AdapterContext, the vsource id
   * becomes `${battery.id}_src`. When stamped as an ideal vsource (rInt ≤ 0),
   * the id is `battery.id`. We fall back gracefully.
   *
   * MNA convention: vsource current is the current flowing from the external
   * circuit into the + terminal — negative when sourcing. Math.abs normalises.
   */
  function batterySourceCurrent(battery: PlacedAutoComponent): number {
    if (!lastSolve) return 0;
    const srcKey  = `${battery.id}_src`;
    const directKey = battery.id;
    const raw =
      lastSolve.vsourceCurrents[srcKey] ??
      lastSolve.vsourceCurrents[directKey] ??
      0;
    return Math.abs(raw);
  }

  /**
   * Expected total load current for a coil-based circuit (Day 4 or Day 9).
   *
   * Reads the `primaryResistance` from every `ignition_coil` on canvas,
   * treats them as a parallel combination, adds the battery's internal
   * resistance, and computes I = V_oc / R_total.
   *
   * Returns null when no coils are present or the parallel R is zero.
   */
  function expectedCoilCurrent(battery: PlacedAutoComponent): number | null {
    const coils = comps.filter((c) => c.kind === "ignition_coil");
    if (coils.length === 0) return null;
    const parallelConductance = coils.reduce((sum, c) => {
      const r = Number(c.props.primaryResistance ?? 0.5);
      return r > 0 ? sum + 1 / r : sum;
    }, 0);
    if (parallelConductance <= 0) return null;
    const parallelR = 1 / parallelConductance;
    const vOc = Number(battery.props.voltage ?? 12.6);
    const ri  = Number(battery.props.internalResistance ?? 0.02);
    return vOc / (ri + parallelR);
  }

  // ── Circuit-type detection ────────────────────────────────────────────────
  const hasStarter     = comps.some((c) => c.kind === "starter_motor");
  const hasCoil        = comps.some((c) => c.kind === "ignition_coil");
  const hasFuseOnCanvas  = comps.some((c) => c.kind === "fuse");
  const hasFuseUnblown   = comps.some((c) => c.kind === "fuse" && !c.props.blown);
  const hasFuseBlown     = comps.some((c) => c.kind === "fuse" &&  c.props.blown);

  // ── 1. loop-complete ──────────────────────────────────────────────────────
  if (rubric.mode === "loop-complete") {
    const battery = comps.find((c) => c.kind === "car_battery");
    const hasGround = comps.some((c) => c.kind === "ground_point");

    if (!battery || !hasGround) {
      return { status: "fail", message: rubric.failMessage };
    }

    // If ANY fuse exists on the canvas, it must be unblown to be part of a
    // functioning loop. This enforces the Day 9 fuse requirement without
    // breaking Day 4 (where no fuse is placed in the initial circuit).
    if (hasFuseOnCanvas && !hasFuseUnblown) {
      return { status: "fail", message: rubric.failMessage };
    }

    if (hasStarter) {
      // Day 3: specifically need an unblown fuse + starter motor.
      if (!hasFuseUnblown) {
        return { status: "fail", message: rubric.failMessage };
      }
      if (!lastSolve) {
        return { status: "pending", message: "Run the sim to confirm the loop is wired correctly." };
      }
      const starter = comps.find((c) => c.kind === "starter_motor")!;
      const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);
      const pass = starterCurrent > 0.1;
      return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
    }

    if (hasCoil) {
      // Day 4 or Day 9 (coil as load).
      if (!lastSolve) {
        return { status: "pending", message: "Run the sim to confirm the loop is wired correctly." };
      }
      const coil = comps.find((c) => c.kind === "ignition_coil")!;
      const coilCurrent = Math.abs(lastSolve.resistorCurrents[coil.id] ?? 0);
      const pass = coilCurrent > 0.1;
      return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
    }

    // Generic: battery source must be delivering current.
    if (!lastSolve) {
      return { status: "pending", message: "Run the sim to confirm the loop is wired correctly." };
    }
    const totalCurrent = batterySourceCurrent(battery);
    const pass = totalCurrent > 0.1;
    return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
  }

  // All remaining modes need a solve result.
  if (!lastSolve) {
    return { status: "pending", message: "Run the sim to grade this step." };
  }

  const battery = comps.find((c) => c.kind === "car_battery");
  if (!battery) {
    return { status: "fail", message: rubric.failMessage };
  }

  const terminal      = batteryTerminalV(battery);
  const sourceCurrent = batterySourceCurrent(battery);

  // ── 2. fuse-blown-open ───────────────────────────────────────────────────
  if (rubric.mode === "fuse-blown-open") {
    const openCircuit = Number(battery.props.voltage ?? 12.6);

    if (hasStarter) {
      // Day 3: require starter present (the load that should be silent).
      const starter = comps.find((c) => c.kind === "starter_motor");
      if (!starter) return { status: "fail", message: rubric.failMessage };
      const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);
      const pass =
        hasFuseBlown &&
        Math.abs(terminal - openCircuit) < 0.15 &&
        starterCurrent < 1;
      return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
    }

    // General (Day 4 / Day 9): fuse blown, terminal near open-circuit, no load current.
    const pass =
      hasFuseBlown &&
      Math.abs(terminal - openCircuit) < 0.15 &&
      sourceCurrent < 0.5;
    return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
  }

  // ── 3. healthy-cranking ───────────────────────────────────────────────────
  if (rubric.mode === "healthy-cranking") {
    if (hasStarter) {
      // Day 3: starter draws 150-250 A, terminal sags to 8-10 V.
      const starter = comps.find((c) => c.kind === "starter_motor");
      if (!starter) return { status: "fail", message: rubric.failMessage };
      const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);
      const pass =
        hasFuseUnblown &&
        starterCurrent >= 150 &&
        starterCurrent <= 250 &&
        terminal >= 8 &&
        terminal <= 10;
      return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
    }

    if (hasCoil) {
      // Day 4 (0.5 Ω primary, ~24 A) or Day 9 (5 Ω headlight, ~2.5-5 A).
      //
      // Validation: compute the expected source current from the actual coil
      // resistance values (parallel combination) and the battery's rated
      // open-circuit voltage. Accept actual current within ±30% of expected.
      // Also require terminal voltage above 11.0 V (no severe sag on a healthy
      // battery — satisfied for both Day 4 at ~12.1 V and Day 9 at ~12.5 V).
      const expected = expectedCoilCurrent(battery);
      if (expected === null) {
        return { status: "fail", message: rubric.failMessage };
      }
      const ratioOk =
        expected > 0 && Math.abs(sourceCurrent - expected) / expected <= 0.30;
      const pass = terminal > 11.0 && ratioOk;
      return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
    }

    // Generic fallback: terminal above floor, some current flowing.
    const pass = terminal > 11.0 && sourceCurrent > 0.1;
    return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
  }

  // ── 4. weak-battery ───────────────────────────────────────────────────────
  if (rubric.mode === "weak-battery") {
    if (hasStarter) {
      // Day 3: terminal < 10 V AND current collapses < 100 A.
      const starter = comps.find((c) => c.kind === "starter_motor");
      if (!starter) return { status: "fail", message: rubric.failMessage };
      const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);
      const pass = terminal < 10 && starterCurrent < 100;
      return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
    }

    if (hasCoil) {
      // Day 4: Ri raised to ~0.10 Ω, coil 0.5 Ω → I ≈ 21 A, V_term ≈ 10.5 V.
      // Pass when terminal drops below 11.5 V (below the healthy ~12.1 V floor)
      // AND coil current falls below 22 A (below the healthy ~24 A value).
      const coil = comps.find((c) => c.kind === "ignition_coil")!;
      const coilCurrent = Math.abs(lastSolve.resistorCurrents[coil.id] ?? 0);
      const pass = terminal < 11.5 && coilCurrent < 22;
      return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
    }

    // Generic: sag more than 0.5 V from open-circuit.
    const openCircuit = Number(battery.props.voltage ?? 12.6);
    const sag = openCircuit - terminal;
    const pass = sag > 0.5;
    return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
  }

  // ── 5. battery-only-load ─────────────────────────────────────────────────
  // Day 2 step 3: alternator OFF, bus voltage 12.4–12.7 V.
  if (rubric.mode === "battery-only-load") {
    const alternator = comps.find((c) => c.kind === "alternator");
    const alternatorOff = !alternator || alternator.props.running === false;
    if (!alternatorOff) {
      return { status: "fail", message: rubric.failMessage };
    }
    const pass = terminal >= 12.4 && terminal <= 12.7;
    return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
  }

  // ── 6. alternator-on-load ─────────────────────────────────────────────────
  // Day 2 step 4: alternator ON, bus voltage 13.8–14.4 V.
  if (rubric.mode === "alternator-on-load") {
    const alternator = comps.find((c) => c.kind === "alternator");
    const alternatorOn = alternator?.props.running === true;
    if (!alternatorOn) {
      return { status: "fail", message: rubric.failMessage };
    }
    const pass = terminal >= 13.8 && terminal <= 14.4;
    return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
  }

  // ── 7. slow-cranking ─────────────────────────────────────────────────────
  if (rubric.mode === "slow-cranking") {
    // Day 3 solo challenge: learner must reduce starter current to 130-170 A
    // (simulating a weak battery or corroded cable, vs the healthy 150-250 A).
    const starter = comps.find((c) => c.kind === "starter_motor");
    if (!starter) return { status: "fail", message: rubric.failMessage };
    const starterCurrent = Math.abs(lastSolve.resistorCurrents[starter.id] ?? 0);
    const pass = starterCurrent >= 130 && starterCurrent <= 170;
    return { status: pass ? "pass" : "fail", message: pass ? rubric.passMessage : rubric.failMessage };
  }

  return { status: "pending", message: "Unknown rubric mode." };
}
