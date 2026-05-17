/**
 * Welding heat-input + joint-strength evaluator.
 *
 * This is NOT a continuous-simulation engine. It's a numerical evaluator that
 * the lesson player runs against the learner's parameter choices and joint
 * geometry, returning pass/fail + diagnostic notes.
 *
 * Engineering models:
 *   - Heat input:  HI = η · V · I / v   (J/mm)
 *                  η depends on process (SMAW 0.80, GMAW 0.75, FCAW 0.85, GTAW 0.70)
 *                  V = volts, I = amps, v = travel speed (mm/s)
 *   - Penetration: approximate empirical correlation
 *                  P ≈ k · √(HI / t_base)
 *                  k is process-dependent; t_base is base-metal thickness (mm)
 *   - Fillet leg minimum: per AWS D1.1 §5.7 (Table 5.7)
 *   - Joint evaluation: composite check (parameters in range +
 *                       heat input within process bounds for thickness +
 *                       fillet leg meets AWS minimum)
 *
 * All functions return plain values or { ok, ... } / { ok: false, error } shapes.
 * NEVER throws on bad input — surfaces an error result the lesson player can show.
 */

export type WeldingProcess = "SMAW" | "GMAW" | "FCAW" | "GTAW";

export type JointType = "butt" | "lap" | "tee" | "corner" | "edge" | "groove";

export type WeldingPosition = "1F" | "2F" | "3F" | "4F" | "1G" | "2G" | "3G" | "4G" | "5G" | "6G";

/**
 * AWS code category for fillet-leg minimums.
 *   - "D1.1" → Structural Steel (carbon + low-alloy)
 *   - "D1.2" → Structural Aluminum
 *   - "D1.6" → Structural Stainless Steel
 * Defaults to D1.1 throughout the engine.
 */
export type AwsCategory = "D1.1" | "D1.2" | "D1.6";

/**
 * Shielding-gas identifiers. Process/material compatibility is validated by
 * `isGasCompatibleWithProcess()` and surfaced in `evaluateWeldVsSpec`.
 */
export type ShieldingGas =
  | "none"
  | "CO2"
  | "Ar"
  | "Ar-CO2"        // common GMAW steel mix (e.g. 75/25)
  | "Ar-O2"         // GMAW spray transfer on steel
  | "Ar-He"         // GTAW thicker aluminum
  | "He";           // rarely pure; GTAW specialty

// ---------------- Imperial-to-SI boundary helpers ----------------
//
// Lessons sometimes prompt learners in imperial (in/min travel speed, inches
// of base-metal thickness). These helpers convert to the SI units the
// evaluator works in internally. Never throw — return EvalError on bad input.

/** Convert in/min → mm/s. (1 in = 25.4 mm; 60 s per min.) */
export function inPerMinToMmPerSec(inPerMin: number): number | EvalError {
  if (!Number.isFinite(inPerMin)) return { ok: false, error: `Travel speed must be a finite number (got ${inPerMin}).` };
  if (inPerMin <= 0) return { ok: false, error: `Travel speed must be positive (got ${inPerMin} in/min).` };
  return (inPerMin * 25.4) / 60;
}

/** Convert inches → mm. */
export function inchesToMm(inches: number): number | EvalError {
  if (!Number.isFinite(inches)) return { ok: false, error: `Length must be a finite number (got ${inches}).` };
  if (inches <= 0) return { ok: false, error: `Length must be positive (got ${inches} in).` };
  return inches * 25.4;
}

/** Industry-standard process arc-efficiency factors (η). */
export const PROCESS_EFFICIENCY: Record<WeldingProcess, number> = {
  SMAW: 0.8,
  GMAW: 0.75,
  FCAW: 0.85,
  GTAW: 0.7,
};

/** Rough penetration coefficient k (mm per √(J/mm·mm)) — empirical per process. */
const PENETRATION_K: Record<WeldingProcess, number> = {
  SMAW: 0.18,
  GMAW: 0.20,
  FCAW: 0.22,
  GTAW: 0.15,
};

export interface HeatInputInput {
  process: WeldingProcess;
  volts: number;
  amps: number;
  travelSpeedMmPerSec: number;
  /** Optional override for process efficiency (0 < η ≤ 1). */
  efficiencyOverride?: number;
}

export interface HeatInputResult {
  ok: true;
  heatInputJPerMm: number;
  efficiency: number;
}

export interface EvalError {
  ok: false;
  error: string;
}

/**
 * Compute weld heat input in J/mm.
 *   HI = η · V · I / v  (with v in mm/s)
 */
export function computeHeatInput(input: HeatInputInput): HeatInputResult | EvalError {
  const { process, volts, amps, travelSpeedMmPerSec, efficiencyOverride } = input;
  if (volts <= 0) return { ok: false, error: `Voltage must be positive (got ${volts}).` };
  if (amps <= 0) return { ok: false, error: `Amperage must be positive (got ${amps}).` };
  if (travelSpeedMmPerSec <= 0)
    return { ok: false, error: `Travel speed must be positive (got ${travelSpeedMmPerSec} mm/s).` };
  const eta = efficiencyOverride ?? PROCESS_EFFICIENCY[process];
  if (!eta || eta <= 0 || eta > 1)
    return { ok: false, error: `Efficiency must be in (0, 1] (got ${eta}).` };
  const heatInputJPerMm = (eta * volts * amps) / travelSpeedMmPerSec;
  return { ok: true, heatInputJPerMm, efficiency: eta };
}

export interface PenetrationInput {
  process: WeldingProcess;
  heatInputJPerMm: number;
  baseMetalMm: number;
  jointType: JointType;
}

export interface PenetrationResult {
  ok: true;
  penetrationMm: number;
  /** "burnthrough" | "incomplete" | "adequate" */
  classification: "burnthrough" | "incomplete" | "adequate";
}

/**
 * Predict approximate weld penetration depth (mm).
 * Classification heuristic:
 *   - penetration > 1.25 × baseMetal → "burnthrough"
 *   - penetration < 0.5 × baseMetal  → "incomplete"
 *   - else                            → "adequate"
 */
export function predictPenetration(input: PenetrationInput): PenetrationResult | EvalError {
  const { process, heatInputJPerMm, baseMetalMm, jointType } = input;
  if (heatInputJPerMm <= 0)
    return { ok: false, error: `Heat input must be positive (got ${heatInputJPerMm} J/mm).` };
  if (baseMetalMm <= 0)
    return { ok: false, error: `Base metal thickness must be positive (got ${baseMetalMm} mm).` };
  const k = PENETRATION_K[process];
  // Joint geometry factor — edge joints penetrate more easily; tee/lap less.
  const jointFactor: Record<JointType, number> = {
    butt: 1.0,
    lap: 0.85,
    tee: 0.9,
    corner: 0.95,
    edge: 1.1,
    groove: 1.0,
  };
  const penetrationMm = k * Math.sqrt(heatInputJPerMm / baseMetalMm) * jointFactor[jointType] * 3.0;
  let classification: PenetrationResult["classification"];
  if (penetrationMm > 1.25 * baseMetalMm) classification = "burnthrough";
  else if (penetrationMm < 0.5 * baseMetalMm) classification = "incomplete";
  else classification = "adequate";
  return { ok: true, penetrationMm, classification };
}

/**
 * Minimum fillet weld leg size as a function of the thickness of the thinner
 * part joined, per the relevant AWS structural welding code.
 *
 * AWS D1.1 (Structural Steel) — Table 5.7:
 *   T ≤ 6 mm (¼ in)        → 3 mm (⅛ in)
 *   6 mm < T ≤ 13 mm       → 5 mm (3/16 in)
 *   13 mm < T ≤ 19 mm      → 6 mm (¼ in)
 *   T > 19 mm              → 8 mm (5/16 in)
 *
 * AWS D1.2 (Aluminum) — Table 5.8 (slightly heavier minimums):
 *   T ≤ 6 mm   → 3 mm · 6–13 mm → 5 mm · 13–19 mm → 6 mm · >19 mm → 10 mm
 *
 * AWS D1.6 (Stainless Steel) — follows the D1.1 schedule.
 *
 * Defaults to D1.1 (structural steel) when no category is given so existing
 * callers and lessons continue to behave the same.
 */
export function requiredFilletLegMm(
  baseMetalMm: number,
  awsCategory: AwsCategory = "D1.1",
): number | EvalError {
  if (baseMetalMm <= 0) return { ok: false, error: `Base metal thickness must be positive (got ${baseMetalMm} mm).` };
  switch (awsCategory) {
    case "D1.2": {
      if (baseMetalMm <= 6) return 3;
      if (baseMetalMm <= 13) return 5;
      if (baseMetalMm <= 19) return 6;
      return 10;
    }
    case "D1.1":
    case "D1.6":
    default: {
      if (baseMetalMm <= 6) return 3;
      if (baseMetalMm <= 13) return 5;
      if (baseMetalMm <= 19) return 6;
      return 8;
    }
  }
}

/**
 * Process / shielding-gas compatibility. Returns null when the combination is
 * valid for typical mild-steel work, otherwise an explanation string the
 * lesson player can show.
 *
 * ⚠️ SCOPE: these rules encode **carbon-steel / mild-steel** defaults, which
 * is what the current 15-lesson curriculum and AWS D1.1 examples target.
 * Aluminum (D1.2) GMAW lessons will need pure-Ar to be allowed, and stainless
 * (D1.6) GTAW lessons will need Ar-H2 / Ar-N2 to be allowed. When those
 * lessons are added, extend `isGasCompatibleWithProcess` to take a material
 * argument (or thread `awsCategory` through) rather than relaxing the steel
 * defaults globally. Until then, lessons that exercise non-steel material
 * should leave `parameters.shieldingGas` undefined to skip this check.
 *
 * Industry guidance (AWS Welding Handbook, vol. 2):
 *   - SMAW: flux-coated electrode, MUST be "none" — external gas creates
 *     turbulence and contaminates the slag.
 *   - GMAW: CO2, Ar-CO2, or Ar-O2 for carbon steel. Pure Ar is for aluminum,
 *     not steel (lack of arc stability + finger penetration). He alone is
 *     not used on steel.
 *   - FCAW: self-shielded variants → "none"; gas-shielded → CO2 or Ar-CO2.
 *     Ar-only on FCAW disrupts the flux core's chemistry.
 *   - GTAW: Ar (most common) or Ar-He blends. CO2 destroys the tungsten and
 *     contaminates the weld.
 */
export function isGasCompatibleWithProcess(
  process: WeldingProcess,
  gas: ShieldingGas,
): null | string {
  const ALLOWED: Record<WeldingProcess, ShieldingGas[]> = {
    SMAW: ["none"],
    GMAW: ["CO2", "Ar-CO2", "Ar-O2"],
    FCAW: ["none", "CO2", "Ar-CO2"],
    GTAW: ["Ar", "Ar-He", "He"],
  };
  const allowed = ALLOWED[process];
  if (allowed.includes(gas)) return null;
  if (process === "SMAW" && gas !== "none") {
    return `SMAW (stick) uses flux from the electrode coating — external shielding gas (${gas}) is incompatible.`;
  }
  if (process === "GTAW" && (gas === "CO2" || gas === "Ar-CO2" || gas === "Ar-O2")) {
    return `GTAW uses an inert gas (Ar or Ar-He). ${gas} contains CO2/O2 which destroys the tungsten electrode.`;
  }
  if (process === "GMAW" && gas === "Ar") {
    return `Pure Argon on GMAW carbon steel produces a narrow finger-shaped bead and arc instability — use Ar-CO2 (e.g. 75/25) or CO2 instead.`;
  }
  if (process === "FCAW" && gas === "Ar") {
    return `Pure Argon disrupts the flux-cored chemistry — use CO2, Ar-CO2, or self-shielded ("none").`;
  }
  return `Gas "${gas}" is not a typical match for ${process}. Expected one of: ${allowed.join(", ")}.`;
}

export interface WpsEvalInput {
  process: WeldingProcess;
  parameters: {
    volts: number;
    amps: number;
    /** Travel speed in mm/s. If omitted, supply `travelSpeedInPerMin` instead. */
    travelSpeedMmPerSec?: number;
    /** Imperial alternative — converted to mm/s internally. */
    travelSpeedInPerMin?: number;
    shieldingGasFlowLPerMin?: number; // GMAW/FCAW/GTAW
    /** Shielding-gas identity; checked against `isGasCompatibleWithProcess`. */
    shieldingGas?: ShieldingGas;
  };
  jointType: JointType;
  /** Base-metal thickness in mm. If omitted, supply `baseMetalInches` instead. */
  baseMetalMm?: number;
  /** Imperial alternative — converted to mm internally. */
  baseMetalInches?: number;
  position: WeldingPosition;
  /** For fillet welds only — actual leg size the learner is targeting (mm). */
  targetFilletLegMm?: number;
  /** AWS code category for fillet sizing. Defaults to D1.1 structural steel. */
  awsCategory?: AwsCategory;
}

export interface WpsEvalResult {
  ok: true;
  pass: boolean;
  score: number; // 0..1
  notes: string[];
  heatInputJPerMm: number;
}

/** Process-appropriate parameter envelopes (very rough, lesson-level). */
const PARAM_ENVELOPES: Record<WeldingProcess, { volts: [number, number]; amps: [number, number] }> = {
  SMAW: { volts: [18, 32], amps: [60, 250] },
  GMAW: { volts: [16, 30], amps: [80, 350] },
  FCAW: { volts: [22, 36], amps: [100, 400] },
  GTAW: { volts: [10, 22], amps: [30, 200] },
};

const REQUIRES_GAS: Record<WeldingProcess, boolean> = {
  SMAW: false,
  GMAW: true,
  FCAW: false, // self-shielded variants don't; gas-shielded do — flagged as conditional note
  GTAW: true,
};

/**
 * Composite WPS-style evaluation. Returns pass/fail, a 0..1 score, and a list
 * of human-readable notes the lesson player can show.
 */
export function evaluateWeldVsSpec(input: WpsEvalInput): WpsEvalResult | EvalError {
  const { process, parameters, jointType, position, targetFilletLegMm } = input;
  const notes: string[] = [];
  let pass = true;
  let score = 1.0;

  // 0a. Resolve base-metal thickness (accept SI or imperial at the boundary).
  // Precedence: SI (`baseMetalMm`) wins when both are supplied — never silently
  // average or auto-detect. If they disagree the caller is buggy; surface the
  // raw SI value rather than guessing.
  let baseMetalMm: number;
  if (typeof input.baseMetalMm === "number") {
    if (input.baseMetalMm <= 0)
      return { ok: false, error: `Base metal thickness must be positive (got ${input.baseMetalMm} mm).` };
    baseMetalMm = input.baseMetalMm;
  } else if (typeof input.baseMetalInches === "number") {
    const conv = inchesToMm(input.baseMetalInches);
    if (typeof conv !== "number") return conv;
    baseMetalMm = conv;
  } else {
    return { ok: false, error: "Base-metal thickness required (baseMetalMm or baseMetalInches)." };
  }

  // 0b. Resolve travel speed (accept SI or imperial at the boundary).
  // Same precedence rule: SI (`travelSpeedMmPerSec`) wins when both supplied.
  let travelMmPerSec: number;
  if (typeof parameters.travelSpeedMmPerSec === "number") {
    travelMmPerSec = parameters.travelSpeedMmPerSec;
  } else if (typeof parameters.travelSpeedInPerMin === "number") {
    const conv = inPerMinToMmPerSec(parameters.travelSpeedInPerMin);
    if (typeof conv !== "number") return conv;
    travelMmPerSec = conv;
  } else {
    return { ok: false, error: "Travel speed required (travelSpeedMmPerSec or travelSpeedInPerMin)." };
  }

  // 1. Heat input.
  const hi = computeHeatInput({
    process,
    volts: parameters.volts,
    amps: parameters.amps,
    travelSpeedMmPerSec: travelMmPerSec,
  });
  if (!hi.ok) return hi;

  // 2. Parameter envelope.
  const env = PARAM_ENVELOPES[process];
  if (parameters.volts < env.volts[0] || parameters.volts > env.volts[1]) {
    notes.push(
      `Voltage ${parameters.volts} V is outside the typical ${process} range (${env.volts[0]}-${env.volts[1]} V).`,
    );
    pass = false;
    score -= 0.25;
  }
  if (parameters.amps < env.amps[0] || parameters.amps > env.amps[1]) {
    notes.push(
      `Amperage ${parameters.amps} A is outside the typical ${process} range (${env.amps[0]}-${env.amps[1]} A).`,
    );
    pass = false;
    score -= 0.25;
  }

  // 3. Shielding gas requirement (flow).
  if (REQUIRES_GAS[process]) {
    const flow = parameters.shieldingGasFlowLPerMin ?? 0;
    if (flow < 10) {
      notes.push(`${process} requires shielding gas — flow ${flow} L/min is too low (typical 12-20 L/min).`);
      pass = false;
      score -= 0.2;
    } else if (flow > 30) {
      notes.push(`Shielding gas flow ${flow} L/min is excessive — turbulence may pull in air.`);
      score -= 0.05;
    }
  }

  // 3b. Shielding-gas / process compatibility (gas identity, not just flow).
  if (parameters.shieldingGas !== undefined) {
    const mismatch = isGasCompatibleWithProcess(process, parameters.shieldingGas);
    if (mismatch) {
      notes.push(mismatch);
      pass = false;
      score -= 0.25;
    }
  }

  // 4. Penetration.
  const pen = predictPenetration({
    process,
    heatInputJPerMm: hi.heatInputJPerMm,
    baseMetalMm,
    jointType,
  });
  if (!pen.ok) return pen;
  if (pen.classification === "burnthrough") {
    notes.push(
      `Predicted penetration ${pen.penetrationMm.toFixed(1)} mm exceeds base metal — risk of burnthrough.`,
    );
    pass = false;
    score -= 0.3;
  } else if (pen.classification === "incomplete") {
    notes.push(
      `Predicted penetration ${pen.penetrationMm.toFixed(1)} mm is insufficient for ${baseMetalMm} mm base.`,
    );
    pass = false;
    score -= 0.3;
  }

  // 5. Fillet leg sizing (only for fillet-style joints — tee, lap, corner).
  const isFillet = jointType === "tee" || jointType === "lap" || jointType === "corner";
  if (isFillet && targetFilletLegMm !== undefined) {
    const cat: AwsCategory = input.awsCategory ?? "D1.1";
    const minLeg = requiredFilletLegMm(baseMetalMm, cat);
    if (typeof minLeg !== "number") return minLeg;
    if (targetFilletLegMm < minLeg) {
      notes.push(
        `Fillet leg ${targetFilletLegMm} mm is below AWS ${cat} minimum (${minLeg} mm for ${baseMetalMm} mm base).`,
      );
      pass = false;
      score -= 0.25;
    }
  }

  // 6. Position guidance (notes only — doesn't fail).
  if (position === "3G" || position === "4G" || position === "5G" || position === "6G") {
    if (parameters.amps > env.amps[1] * 0.85) {
      notes.push(
        `Out-of-position welds (${position}) typically require reduced current — try ${(env.amps[1] * 0.75).toFixed(
          0,
        )} A or below.`,
      );
      score -= 0.05;
    }
  }

  if (notes.length === 0) notes.push("Parameters look good for this joint and base metal thickness.");

  score = Math.max(0, Math.min(1, score));
  return { ok: true, pass, score, notes, heatInputJPerMm: hi.heatInputJPerMm };
}
