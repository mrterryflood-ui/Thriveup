/**
 * equity-loss-engine.ts
 *
 * Orchestration layer for the equity-loss computation.
 *
 * Responsibilities:
 *   1. Apply suppression rules BEFORE computing anything
 *   2. Assign trust tier, and refuse to emit tier 1 where the method forbids it
 *   3. Compute against three comparison frames, never collapsing them
 *   4. Carry provenance, coverage flags and stated assumptions on every row
 *
 * Non-responsibility: this engine never ingests a pre-computed loss
 * percentage. It computes, so the claim-grounding engine can certify the
 * output.
 */

import {
  atkinsonIndex,
  computeIhdi,
  educationIndex,
  incomeIndex,
  lifeExpectancyIndex,
  UNDP_GOALPOSTS,
  USALEEP_IHME_ASSUMPTION,
  type Goalposts,
  type IhdiResult,
} from './atkinson';

export const ENGINE_VERSION = '0.1.0';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrustTier =
  | 'computed'
  | 'derived_with_stated_assumption'
  | 'ai_estimate';

export type ComparisonFrame =
  | 'vs_parent_county'
  | 'vs_state'
  | 'vs_national_peer_class';

export type HealthInequalityMethod =
  | 'life_table_age_at_death'
  | 'geographic_dispersion';

export type SuppressionReason =
  | 'below_population_threshold'
  | 'high_growth_unreliable_denominator'
  | 'source_coverage_gap'
  | 'incomplete_dimensions'
  | 'moe_exceeds_threshold';

export interface SuppressionConfig {
  /** USALEEP's own threshold. Below this, tract life tables were not produced. */
  minPopulation: number;
  /**
   * Decadal population growth above which mortality-based life expectancy is
   * unreliable: the denominator shifted faster than death records, and
   * in-migrants to new development skew young and healthy.
   * DEFAULT IS UNVALIDATED — see spec section 11, open decision 4.
   */
  maxDecadalGrowthPct: number;
  /** ACS margin of error as a share of the estimate. Open decision 5. */
  maxMoeRatio: number;
}

export const DEFAULT_SUPPRESSION: SuppressionConfig = {
  minPopulation: 5000,
  maxDecadalGrowthPct: 25,
  maxMoeRatio: 0.3,
};

/** States USALEEP excluded entirely. Coverage gap, not missing data. */
export const USALEEP_EXCLUDED_STATES = new Set(['ME', 'WI']);

export interface UnitInputs {
  geoId: string;
  geoLevel: 'tract' | 'place' | 'county' | 'state';
  state: string;
  countyFips?: string;
  year: number;
  raceEthnicityStratum?: string | null;

  population?: number;
  decadalGrowthPct?: number;

  /** Household income distribution (ACS B19001 midpoints + counts). */
  incomeDistribution?: { value: number; weight: number }[];
  incomeMean?: number;
  incomeMoeRatio?: number;

  /** Education: per-subunit mean/expected years of schooling. */
  educationDistribution?: { mys: number; eys: number; weight: number }[];
  educationMoeRatio?: number;

  /** Life expectancy across subunits (tracts within a county, etc.). */
  lifeExpectancyDistribution?: number[];
  lifeExpectancyMean?: number;

  healthInequalityMethod: HealthInequalityMethod;
  /** True when the LE distribution came from the USALEEP-shape/IHME-level hybrid. */
  usedUsaleepIhmeHybrid: boolean;
  healthValueBasis?: 'observed' | 'predicted' | 'mixed';
  /** Age of the oldest source feeding the health dimension. Surfaced, not hidden. */
  sourceVintageYearsStale?: number;
}

export interface EquityLossRow {
  geoId: string;
  geoLevel: string;
  frame: ComparisonFrame;
  raceEthnicityStratum: string | null;
  year: number;

  suppressed: boolean;
  suppressionReason: SuppressionReason | null;

  hdi: number | null;
  ihdi: number | null;
  overallLossPct: number | null;
  aHealth: number | null;
  aEducation: number | null;
  aIncome: number | null;

  /**
   * The benchmark this frame is being read against. This is what makes the
   * three frames actually different from one another — see the
   * FrameSet-level comment on why a prior version of this function could
   * never diverge.
   */
  referenceLossPct: number | null;
  divergenceFromReferencePct: number | null;

  tier: TrustTier;
  assumptionText: string | null;
  healthInequalityMethod: HealthInequalityMethod;
  healthValueBasis: 'observed' | 'predicted' | 'mixed' | null;
  goalpostScheme: Goalposts['scheme'];
  coverageFlags: string[];
  sourceVintageYearsStale: number | null;

  engineVersion: string;
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Peer classification
// ---------------------------------------------------------------------------

export interface PeerClassInputs {
  rucaPrimary: number;   // USDA ERS 2020 vintage
  densityBand: number;   // 1-5 quintile
  growthBand: number;    // banded decadal change
}

/**
 * A unit's peer group is functional, not administrative. Its parent county is
 * an accident of boundary-drawing; its peer class is what it actually is.
 *
 * ERS built RUCA precisely because county classifications are too coarse —
 * their own motivating example is "remote, rural communities in large
 * metropolitan counties," which is the Williamson County TX case.
 */
export function buildPeerClass(p: PeerClassInputs): string {
  return `ruca${p.rucaPrimary}_d${p.densityBand}_g${p.growthBand}`;
}

// ---------------------------------------------------------------------------
// Suppression — runs BEFORE computation
// ---------------------------------------------------------------------------

export function checkSuppression(
  u: UnitInputs,
  cfg: SuppressionConfig = DEFAULT_SUPPRESSION,
): SuppressionReason | null {
  if (u.population !== undefined && u.population < cfg.minPopulation) {
    return 'below_population_threshold';
  }

  if (
    u.decadalGrowthPct !== undefined &&
    u.decadalGrowthPct > cfg.maxDecadalGrowthPct
  ) {
    return 'high_growth_unreliable_denominator';
  }

  if (
    u.healthInequalityMethod === 'geographic_dispersion' &&
    USALEEP_EXCLUDED_STATES.has(u.state) &&
    (u.lifeExpectancyDistribution?.length ?? 0) === 0
  ) {
    return 'source_coverage_gap';
  }

  const hasIncome = (u.incomeDistribution?.length ?? 0) > 0;
  const hasEducation = (u.educationDistribution?.length ?? 0) > 0;
  const hasHealth = (u.lifeExpectancyDistribution?.length ?? 0) > 0;
  if (!hasIncome || !hasEducation || !hasHealth) {
    return 'incomplete_dimensions';
  }

  const moes = [u.incomeMoeRatio, u.educationMoeRatio].filter(
    (m): m is number => m !== undefined,
  );
  if (moes.some((m) => m > cfg.maxMoeRatio)) {
    return 'moe_exceeds_threshold';
  }

  return null;
}

// ---------------------------------------------------------------------------
// Trust tier assignment
// ---------------------------------------------------------------------------

export interface TierAssignment {
  tier: TrustTier;
  assumptionText: string | null;
}

/**
 * Geographic dispersion is NOT the quantity UNDP measures — UNDP computes
 * health inequality from the distribution of ages at death within a
 * population, not from geographic spread of life expectancy. The sub-national
 * adaptation is arguably more policy-relevant, but it is a different
 * statistic and must never claim tier 1.
 *
 * There is currently no path to 'computed' for the health dimension at
 * sub-county grain. Say so in the UI rather than implying otherwise.
 */
export function assignTier(u: UnitInputs): TierAssignment {
  const assumptions: string[] = [];

  if (u.usedUsaleepIhmeHybrid) {
    assumptions.push(USALEEP_IHME_ASSUMPTION);
  }

  if (u.healthInequalityMethod === 'geographic_dispersion') {
    assumptions.push(
      'Health inequality is computed from geographic dispersion of life ' +
        'expectancy across subunits, not from the within-population ' +
        'distribution of age at death used by UNDP. This is a different ' +
        'statistic and is not directly comparable to UNDP national figures.',
    );
  }

  if (assumptions.length === 0) {
    return { tier: 'computed', assumptionText: null };
  }

  return {
    tier: 'derived_with_stated_assumption',
    assumptionText: assumptions.join(' '),
  };
}

// ---------------------------------------------------------------------------
// Main computation
// ---------------------------------------------------------------------------

function suppressedRow(
  u: UnitInputs,
  frame: ComparisonFrame,
  reason: SuppressionReason,
  goalposts: Goalposts,
  coverageFlags: string[],
  referenceLossPct: number | null,
): EquityLossRow {
  const { tier, assumptionText } = assignTier(u);
  return {
    geoId: u.geoId,
    geoLevel: u.geoLevel,
    frame,
    raceEthnicityStratum: u.raceEthnicityStratum ?? null,
    year: u.year,
    suppressed: true,
    suppressionReason: reason,
    hdi: null,
    ihdi: null,
    overallLossPct: null,
    aHealth: null,
    aEducation: null,
    aIncome: null,
    referenceLossPct,
    divergenceFromReferencePct: null,
    tier,
    assumptionText,
    healthInequalityMethod: u.healthInequalityMethod,
    healthValueBasis: u.healthValueBasis ?? null,
    goalpostScheme: goalposts.scheme,
    coverageFlags,
    sourceVintageYearsStale: u.sourceVintageYearsStale ?? null,
    engineVersion: ENGINE_VERSION,
    computedAt: new Date().toISOString(),
  };
}

export function computeEquityLoss(
  u: UnitInputs,
  frame: ComparisonFrame,
  referenceLossPct: number | null,
  goalposts: Goalposts = UNDP_GOALPOSTS,
  cfg: SuppressionConfig = DEFAULT_SUPPRESSION,
): EquityLossRow {
  const coverageFlags: string[] = [];
  if (USALEEP_EXCLUDED_STATES.has(u.state)) {
    coverageFlags.push('usaleep_state_excluded');
  }
  if (u.healthValueBasis === 'predicted') {
    coverageFlags.push('usaleep_predicted_values');
  }

  // Suppress before computing. A visible gap beats a confident guess.
  const reason = checkSuppression(u, cfg);
  if (reason) {
    return suppressedRow(u, frame, reason, goalposts, coverageFlags, referenceLossPct);
  }

  // --- Atkinson coefficients per dimension -------------------------------
  const aIncome = atkinsonIndex(
    u.incomeDistribution!.map((d) => d.value),
    { weights: u.incomeDistribution!.map((d) => d.weight) },
  );

  // Education distribution is converted to per-subunit index values first,
  // because MYS and EYS are on different scales and must be combined before
  // dispersion is measured.
  const eduValues = u.educationDistribution!.map((d) =>
    educationIndex(d.mys, d.eys, goalposts),
  );
  const aEducation = atkinsonIndex(eduValues, {
    weights: u.educationDistribution!.map((d) => d.weight),
  });

  const aHealth = atkinsonIndex(u.lifeExpectancyDistribution!);

  // --- Dimension indices at the mean --------------------------------------
  const meanLe =
    u.lifeExpectancyMean ??
    u.lifeExpectancyDistribution!.reduce((a, b) => a + b, 0) /
      u.lifeExpectancyDistribution!.length;

  const meanIncome =
    u.incomeMean ??
    u.incomeDistribution!.reduce((acc, d) => acc + d.value * d.weight, 0) /
      u.incomeDistribution!.reduce((acc, d) => acc + d.weight, 0);

  const eduWeightTotal = u.educationDistribution!.reduce(
    (acc, d) => acc + d.weight,
    0,
  );
  const meanEduIndex =
    eduValues.reduce(
      (acc, v, i) => acc + v * u.educationDistribution![i].weight,
      0,
    ) / eduWeightTotal;

  const result: IhdiResult = computeIhdi(
    {
      health: lifeExpectancyIndex(meanLe, goalposts),
      education: meanEduIndex,
      income: incomeIndex(meanIncome, goalposts),
    },
    { aHealth, aEducation, aIncome },
  );

  const { tier, assumptionText } = assignTier(u);

  return {
    geoId: u.geoId,
    geoLevel: u.geoLevel,
    frame,
    raceEthnicityStratum: u.raceEthnicityStratum ?? null,
    year: u.year,
    suppressed: false,
    suppressionReason: null,
    hdi: result.hdi,
    ihdi: result.ihdi,
    overallLossPct: result.overallLossPct,
    aHealth,
    aEducation,
    aIncome,
    referenceLossPct,
    divergenceFromReferencePct:
      referenceLossPct === null ? null : result.overallLossPct - referenceLossPct,
    tier,
    assumptionText,
    healthInequalityMethod: u.healthInequalityMethod,
    healthValueBasis: u.healthValueBasis ?? null,
    goalpostScheme: goalposts.scheme,
    coverageFlags,
    sourceVintageYearsStale: u.sourceVintageYearsStale ?? null,
    engineVersion: ENGINE_VERSION,
    computedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Three-frame comparison
// ---------------------------------------------------------------------------

/**
 * Each frame needs its OWN reference value. A prior version of this function
 * called computeEquityLoss three times with identical inputs and no
 * reference at all, so the three "frames" could never numerically diverge —
 * caught during Phase 2 of the Order of Operations doctrine, before this was
 * ever wired into a route. See docs/equity-loss-phase1-2-decisions.md.
 *
 * At county grain (this deployment's shipped scope — see the same doc for
 * why tract/place are descoped), there is no geography *below* a county to
 * serve as a "parent," so `vsParentCounty` is repurposed to mean "vs.
 * national (US)" for context — the unit's own loss read against the
 * national reference row already seeded in benchmark_metrics. This is
 * documented here, not silently relabeled.
 */
export interface FrameReferences {
  /** County grain: national (US) reference loss %. Null if unavailable. */
  vsParentCounty: number | null;
  /** The unit's own state's own computed/reference loss %. */
  vsState: number | null;
  /** The precomputed peer-class benchmark average loss %. */
  vsNationalPeerClass: number | null;
}

export interface FrameSet {
  vsParentCounty: EquityLossRow;
  vsState: EquityLossRow;
  vsNationalPeerClass: EquityLossRow;
  /**
   * Divergence between local (vs. state) and categorical (vs. peer class)
   * framing IS the finding. A place can read as deprived against its own
   * state and advantaged against national peers of the same type — both can
   * be true, and they imply different policy responses. Never average the
   * frames together.
   */
  divergencePct: number | null;
  divergenceInterpretation:
    | 'local_inequity_dominant'
    | 'categorical_disadvantage_dominant'
    | 'aligned'
    | 'insufficient_data';
}

export function computeAllFrames(
  u: UnitInputs,
  references: FrameReferences,
  goalposts: Goalposts = UNDP_GOALPOSTS,
  cfg: SuppressionConfig = DEFAULT_SUPPRESSION,
): FrameSet {
  const vsParentCounty = computeEquityLoss(
    u, 'vs_parent_county', references.vsParentCounty, goalposts, cfg,
  );
  const vsState = computeEquityLoss(
    u, 'vs_state', references.vsState, goalposts, cfg,
  );
  const vsNationalPeerClass = computeEquityLoss(
    u, 'vs_national_peer_class', references.vsNationalPeerClass, goalposts, cfg,
  );

  const localDivergence = vsState.divergenceFromReferencePct;
  const categoricalDivergence = vsNationalPeerClass.divergenceFromReferencePct;

  if (localDivergence === null || categoricalDivergence === null) {
    return {
      vsParentCounty,
      vsState,
      vsNationalPeerClass,
      divergencePct: null,
      divergenceInterpretation: 'insufficient_data',
    };
  }

  const divergencePct = localDivergence - categoricalDivergence;
  let divergenceInterpretation: FrameSet['divergenceInterpretation'];
  if (Math.abs(divergencePct) < 1) {
    divergenceInterpretation = 'aligned';
  } else if (divergencePct > 0) {
    divergenceInterpretation = 'local_inequity_dominant';
  } else {
    divergenceInterpretation = 'categorical_disadvantage_dominant';
  }

  return {
    vsParentCounty,
    vsState,
    vsNationalPeerClass,
    divergencePct,
    divergenceInterpretation,
  };
}

// ---------------------------------------------------------------------------
// Reference context (display only — never blended into computed scores)
// ---------------------------------------------------------------------------

export interface ReferenceContext {
  label: string;
  lossPct: number;
  hdrEdition: string;
}

/** The floor that has been proven achievable. HDR25, 2023 data. */
export const PROVEN_FLOOR: ReferenceContext[] = [
  { label: 'Iceland (lowest globally)', lossPct: 5.0, hdrEdition: 'HDR25' },
  { label: 'Slovenia', lossPct: 4.9, hdrEdition: 'HDR25' },
  { label: 'Czechia', lossPct: 5.2, hdrEdition: 'HDR25' },
  { label: 'Nordic bloc range', lossPct: 6.3, hdrEdition: 'HDR25' },
  { label: 'OECD average', lossPct: 11.4, hdrEdition: 'HDR25' },
  { label: 'United States (national)', lossPct: 11.3, hdrEdition: 'HDR25' },
];
