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
 * AWS D1.1 §5.7 (Table 5.7) — minimum fillet weld leg size as a function of
 * the thickness of the thinner part joined.
 *
 *   T ≤ 6 mm (¼ in)        → 3 mm (⅛ in)
 *   6 mm < T ≤ 13 mm       → 5 mm (3/16 in)
 *   13 mm < T ≤ 19 mm      → 6 mm (¼ in)
 *   T > 19 mm              → 8 mm (5/16 in)
 */
export function requiredFilletLegMm(baseMetalMm: number): number | EvalError {
  if (baseMetalMm <= 0) return { ok: false, error: `Base metal thickness must be positive (got ${baseMetalMm} mm).` };
  if (baseMetalMm <= 6) return 3;
  if (baseMetalMm <= 13) return 5;
  if (baseMetalMm <= 19) return 6;
  return 8;
}

export interface WpsEvalInput {
  process: WeldingProcess;
  parameters: {
    volts: number;
    amps: number;
    travelSpeedMmPerSec: number;
    shieldingGasFlowLPerMin?: number; // GMAW/FCAW/GTAW
  };
  jointType: JointType;
  baseMetalMm: number;
  position: WeldingPosition;
  /** For fillet welds only — actual leg size the learner is targeting (mm). */
  targetFilletLegMm?: number;
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
  const { process, parameters, jointType, baseMetalMm, position, targetFilletLegMm } = input;
  const notes: string[] = [];
  let pass = true;
  let score = 1.0;

  // 1. Heat input.
  const hi = computeHeatInput({
    process,
    volts: parameters.volts,
    amps: parameters.amps,
    travelSpeedMmPerSec: parameters.travelSpeedMmPerSec,
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

  // 3. Shielding gas requirement.
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
    const minLeg = requiredFilletLegMm(baseMetalMm);
    if (typeof minLeg !== "number") return minLeg;
    if (targetFilletLegMm < minLeg) {
      notes.push(
        `Fillet leg ${targetFilletLegMm} mm is below AWS D1.1 minimum (${minLeg} mm for ${baseMetalMm} mm base).`,
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
