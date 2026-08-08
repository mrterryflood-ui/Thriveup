/**
 * Concept tags for the adaptive growth path.
 *
 * Every graded rubric mode (sag rubric / backflow rubric) maps to a concept
 * tag. A failed check tags its concept; aggregates drive targeted review reps
 * before the next attempt, and the AI tutor references them in debriefs.
 *
 * Also defines the STRETCH variants: after a clean standard pass, the learner
 * is offered a genuinely harder rubric mode from the same grader family —
 * not a cosmetic repeat.
 */

export interface ConceptInfo {
  /** Learner-facing name of the concept. */
  label: string;
  /** A short, targeted review rep the learner can do on the canvas. */
  reviewRep: string;
}

export const CONCEPTS: Record<string, ConceptInfo> = {
  "circuit-continuity": {
    label: "Circuit continuity",
    reviewRep:
      "Build the smallest possible loop: battery → one load → ground. Run the sim and confirm current flows before adding anything else.",
  },
  "voltage-sag": {
    label: "Voltage sag under load",
    reviewRep:
      "Wire the starter circuit, run the sim, and read the battery terminal voltage. Then raise the load and watch the terminal drop — that drop is sag.",
  },
  "internal-resistance": {
    label: "Battery internal resistance",
    reviewRep:
      "Take a working circuit and raise the battery's internal resistance step by step. Watch terminal voltage and load current fall together.",
  },
  "overcurrent-protection": {
    label: "Fuses & overcurrent protection",
    reviewRep:
      "Add a fuse in series with the load, then lower its rating until it blows. Confirm the load current goes to zero and terminal voltage returns to open-circuit.",
  },
  "charging-system": {
    label: "Charging system behavior",
    reviewRep:
      "Toggle the alternator off and on with the same loads. Note the bus voltage in each state — battery-only vs alternator-regulated are different voltage bands.",
  },
  "ohms-law": {
    label: "Ohm's law prediction",
    reviewRep:
      "Before running the sim, write down I = V ÷ R for your circuit. Run it and compare. Adjust one resistance and predict again before solving.",
  },
  "parallel-circuits": {
    label: "Parallel circuits",
    reviewRep:
      "Wire two identical loads across the same two nodes. Confirm each branch current adds up to the battery's total draw.",
  },
  "backflow-prevention": {
    label: "Backflow prevention",
    reviewRep:
      "Place a check valve between the supply and a cross-connection, then force reverse pressure and run the solve — the valve should close.",
  },
  "pressure-integrity": {
    label: "Pressure design",
    reviewRep:
      "Design the network so supply pressure stays correct end-to-end: run the solve and confirm no check valve was forced closed.",
  },
};

export function conceptLabel(tag: string): string {
  return CONCEPTS[tag]?.label ?? tag;
}

/** Sag-rubric mode → concept tag. */
export const SAG_MODE_CONCEPT: Record<string, string> = {
  "loop-complete": "circuit-continuity",
  "fuse-blown-open": "overcurrent-protection",
  "healthy-cranking": "voltage-sag",
  "weak-battery": "internal-resistance",
  "battery-only-load": "charging-system",
  "alternator-on-load": "charging-system",
  "slow-cranking": "voltage-sag",
  "weak-battery-charging": "charging-system",
  "coil-swap-current": "ohms-law",
  "parallel-7a": "parallel-circuits",
};

/** Backflow-rubric mode → concept tag. */
export const BACKFLOW_MODE_CONCEPT: Record<string, string> = {
  "must-close": "backflow-prevention",
  "must-not-close": "pressure-integrity",
  "must-have-check-valve": "backflow-prevention",
};

// ---------------------------------------------------------------------------
// Stretch variants — a harder rubric mode from the same family, offered only
// after a clean standard pass. Each entry gives the learner-facing prompt and
// the rubric object to grade against.
// ---------------------------------------------------------------------------

export interface SagStretch {
  kind: "sag";
  prompt: string;
  rubric: {
    mode: string;
    passMessage: string;
    failMessage: string;
  };
}
export interface BackflowStretch {
  kind: "backflow";
  prompt: string;
  rubric: {
    mode: "must-close" | "must-not-close" | "must-have-check-valve";
    passMessage: string;
    failMessage: string;
    requireCheckValve?: boolean;
    missingCheckValveMessage?: string;
  };
}
export type StretchVariant = SagStretch | BackflowStretch;

export const SAG_STRETCH: Record<string, SagStretch> = {
  "loop-complete": {
    kind: "sag",
    prompt: "Stretch: your loop works — now prove it's HEALTHY. Get load current into the healthy range with terminal voltage above the sag floor.",
    rubric: { mode: "healthy-cranking", passMessage: "Stretch cleared — healthy circuit confirmed.", failMessage: "Not yet — current or terminal voltage is outside the healthy band." },
  },
  "healthy-cranking": {
    kind: "sag",
    prompt: "Stretch: now break it on purpose. Simulate a WEAK battery — raise internal resistance until terminal voltage and load current collapse.",
    rubric: { mode: "weak-battery", passMessage: "Stretch cleared — you produced and recognized the weak-battery signature.", failMessage: "Not yet — terminal/current haven't collapsed into the weak-battery signature." },
  },
  "slow-cranking": {
    kind: "sag",
    prompt: "Stretch: push further — collapse the crank entirely. Show the full weak-battery signature (terminal under 10 V, current under 100 A).",
    rubric: { mode: "weak-battery", passMessage: "Stretch cleared — full weak-battery diagnosis demonstrated.", failMessage: "Not yet — you're between slow-crank and no-crank. Keep degrading the battery." },
  },
  "fuse-blown-open": {
    kind: "sag",
    prompt: "Stretch: repair it. Replace/reset the fuse and restore a healthy circuit — current in range, terminal above the sag floor.",
    rubric: { mode: "healthy-cranking", passMessage: "Stretch cleared — circuit repaired to healthy spec.", failMessage: "Not yet — the circuit isn't back to healthy numbers." },
  },
  "weak-battery": {
    kind: "sag",
    prompt: "Stretch: fix the fault. Restore a healthy battery and confirm the circuit returns to healthy current and voltage.",
    rubric: { mode: "healthy-cranking", passMessage: "Stretch cleared — fault diagnosed AND repaired.", failMessage: "Not yet — the circuit still shows a fault signature." },
  },
  "battery-only-load": {
    kind: "sag",
    prompt: "Stretch: start the engine. Turn the alternator ON and land bus voltage in the regulated 13.8–14.4 V band.",
    rubric: { mode: "alternator-on-load", passMessage: "Stretch cleared — charging bus confirmed.", failMessage: "Not yet — bus voltage isn't in the regulated band." },
  },
  "alternator-on-load": {
    kind: "sag",
    prompt: "Stretch: tired battery, running engine. Raise battery internal resistance to ≥0.08 Ω with the alternator ON and show the alternator carrying the load.",
    rubric: { mode: "weak-battery-charging", passMessage: "Stretch cleared — you showed the alternator masking a dying battery.", failMessage: "Not yet — signature doesn't show the alternator carrying a weak battery." },
  },
  "weak-battery-charging": {
    kind: "sag",
    prompt: "Stretch: engine off. Return to battery-only and confirm the resting bus band (12.4–12.7 V).",
    rubric: { mode: "battery-only-load", passMessage: "Stretch cleared — resting bus confirmed.", failMessage: "Not yet — resting voltage is out of band." },
  },
  "coil-swap-current": {
    kind: "sag",
    prompt: "Stretch: wire TWO loads in parallel and hit 7 A total (±5%) with a healthy bus voltage.",
    rubric: { mode: "parallel-7a", passMessage: "Stretch cleared — parallel design on target.", failMessage: "Not yet — total draw or bus voltage is off target." },
  },
  "parallel-7a": {
    kind: "sag",
    prompt: "Stretch: sabotage drill. Give the battery high internal resistance and confirm the weak-battery signature under your parallel load.",
    rubric: { mode: "weak-battery", passMessage: "Stretch cleared — weak battery diagnosed under parallel load.", failMessage: "Not yet — the weak-battery signature isn't there." },
  },
};

export const BACKFLOW_STRETCH: Record<string, BackflowStretch> = {
  "must-have-check-valve": {
    kind: "backflow",
    prompt: "Stretch: don't just install it — make it WORK. Set up a reverse-pressure scenario and run the solve so the check valve actually closes.",
    rubric: { mode: "must-close", passMessage: "Stretch cleared — the valve closed under real backflow conditions.", failMessage: "Not yet — the valve never had to close. Force a reverse-pressure condition." },
  },
  "must-close": {
    kind: "backflow",
    prompt: "Stretch: redesign the network so pressure stays correct end-to-end — the check valve stays installed but never has to close.",
    rubric: {
      mode: "must-not-close",
      requireCheckValve: true,
      passMessage: "Stretch cleared — protected AND correctly pressurized.",
      failMessage: "Not yet — the valve still has to slam shut, which means the pressure design is off.",
      missingCheckValveMessage: "Keep the check valve installed — the stretch is correct pressure WITH protection in place.",
    },
  },
  "must-not-close": {
    kind: "backflow",
    prompt: "Stretch: now prove the protection works. Create a backflow event and confirm the check valve closes.",
    rubric: { mode: "must-close", passMessage: "Stretch cleared — protection verified under backflow.", failMessage: "Not yet — no valve closed. Create a genuine reverse-pressure event." },
  },
};
