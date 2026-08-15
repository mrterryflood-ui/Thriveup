/**
 * atkinson.ts
 *
 * Pure functions implementing UNDP's Inequality-adjusted Human Development
 * Index (IHDI) via the Atkinson inequality measure with inequality-aversion
 * parameter epsilon = 1.
 *
 * No I/O, no database, no side effects. This file must remain testable in
 * isolation so acceptance test 8.1 (reproducing UNDP's published US figures)
 * can pass before any new data pipeline exists.
 *
 * Reference: UNDP HDR 2025 Technical Notes, Technical Note 2.
 * https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Technical_Notes.pdf
 */

// ---------------------------------------------------------------------------
// Goalposts
// ---------------------------------------------------------------------------

export interface Goalposts {
  scheme: 'UNDP' | 'US_specific';
  lifeExpectancy: { min: number; max: number };
  meanYearsSchooling: { max: number };
  expectedYearsSchooling: { max: number };
  income: { min: number; max: number };
}

/**
 * UNDP international goalposts. Default.
 *
 * NOTE: at sub-national US resolution nearly every geography sits in the upper
 * part of this range, which compresses variance. That is accepted deliberately:
 * comparability to the proven international floor (Iceland 5.0%) is the point
 * of the product. See spec section 2.
 */
export const UNDP_GOALPOSTS: Goalposts = {
  scheme: 'UNDP',
  lifeExpectancy: { min: 20, max: 85 },
  meanYearsSchooling: { max: 15 },
  expectedYearsSchooling: { max: 18 },
  income: { min: 100, max: 75000 },
};

// ---------------------------------------------------------------------------
// Atkinson index (epsilon = 1)
// ---------------------------------------------------------------------------

export interface AtkinsonOptions {
  /**
   * Values <= 0 make the geometric mean zero, which would force A = 1.
   * UNDP handles this by bottom-coding. Default bottom code is the minimum
   * positive value observed; pass an explicit floor to override.
   */
  bottomCode?: number;
  /** Optional frequency weights, parallel to `values`. */
  weights?: number[];
}

/**
 * Atkinson inequality measure with epsilon = 1:
 *
 *   A = 1 - (geometric_mean / arithmetic_mean)
 *
 * Returns a value in [0, 1]. 0 = perfect equality.
 */
export function atkinsonIndex(
  values: number[],
  opts: AtkinsonOptions = {},
): number {
  if (values.length === 0) {
    throw new Error('atkinsonIndex: empty distribution');
  }

  const weights = opts.weights ?? values.map(() => 1);
  if (weights.length !== values.length) {
    throw new Error('atkinsonIndex: weights length must match values length');
  }
  if (weights.some((w) => w < 0)) {
    throw new Error('atkinsonIndex: negative weight');
  }

  // Bottom-code non-positive values rather than silently returning A = 1.
  const positives = values.filter((v) => v > 0);
  if (positives.length === 0) {
    throw new Error('atkinsonIndex: no positive values in distribution');
  }
  const floor = opts.bottomCode ?? Math.min(...positives);
  const x = values.map((v) => (v > 0 ? v : floor));

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    throw new Error('atkinsonIndex: total weight is zero');
  }

  const arithmetic =
    x.reduce((acc, v, i) => acc + v * weights[i], 0) / totalWeight;

  // Compute geometric mean in log space to avoid overflow on large N.
  const logSum = x.reduce((acc, v, i) => acc + weights[i] * Math.log(v), 0);
  const geometric = Math.exp(logSum / totalWeight);

  if (arithmetic <= 0) {
    throw new Error('atkinsonIndex: non-positive arithmetic mean');
  }

  const a = 1 - geometric / arithmetic;
  // Guard against tiny negative values from floating-point noise.
  return Math.max(0, Math.min(1, a));
}

// ---------------------------------------------------------------------------
// Dimension indices
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function lifeExpectancyIndex(
  le: number,
  g: Goalposts = UNDP_GOALPOSTS,
): number {
  return clamp01((le - g.lifeExpectancy.min) /
    (g.lifeExpectancy.max - g.lifeExpectancy.min));
}

export function educationIndex(
  meanYearsSchooling: number,
  expectedYearsSchooling: number,
  g: Goalposts = UNDP_GOALPOSTS,
): number {
  const mys = clamp01(meanYearsSchooling / g.meanYearsSchooling.max);
  const eys = clamp01(expectedYearsSchooling / g.expectedYearsSchooling.max);
  return (mys + eys) / 2;
}

export function incomeIndex(
  income: number,
  g: Goalposts = UNDP_GOALPOSTS,
): number {
  const safe = Math.max(income, g.income.min);
  return clamp01(
    (Math.log(safe) - Math.log(g.income.min)) /
      (Math.log(g.income.max) - Math.log(g.income.min)),
  );
}

// ---------------------------------------------------------------------------
// IHDI composition
// ---------------------------------------------------------------------------

export interface DimensionIndices {
  health: number;
  education: number;
  income: number;
}

export interface InequalityCoefficients {
  aHealth: number;
  aEducation: number;
  aIncome: number;
}

export interface IhdiResult {
  hdi: number;
  ihdi: number;
  /** Overall loss expressed as a percentage, e.g. 11.3 */
  overallLossPct: number;
  /** Coefficient of human inequality: arithmetic mean of the three A values, as a percentage. */
  coefficientOfHumanInequalityPct: number;
  adjusted: DimensionIndices;
}

const geoMean3 = (a: number, b: number, c: number) => Math.cbrt(a * b * c);

/**
 * HDI is the geometric mean of the three dimension indices.
 *
 * The geometric mean is load-bearing, not stylistic: it prevents a geography
 * from offsetting catastrophic inequality in one dimension with excellence in
 * another. Do not substitute an arithmetic mean.
 */
export function computeHdi(d: DimensionIndices): number {
  return geoMean3(d.health, d.education, d.income);
}

/**
 * Overall loss from the three Atkinson coefficients:
 *
 *   Loss = 1 - [(1-A_health)(1-A_education)(1-A_income)]^(1/3)
 *
 * Inputs are proportions (0.055), not percentages (5.5).
 * Returns a percentage (11.3), matching how UNDP publishes it.
 */
export function computeOverallLoss(
  aHealth: number,
  aEducation: number,
  aIncome: number,
): number {
  for (const [name, v] of [
    ['aHealth', aHealth],
    ['aEducation', aEducation],
    ['aIncome', aIncome],
  ] as const) {
    if (v < 0 || v > 1) {
      throw new Error(
        `computeOverallLoss: ${name}=${v} out of range [0,1]. ` +
          'Inputs are proportions (0.055), not percentages (5.5).',
      );
    }
  }
  const retained = geoMean3(1 - aHealth, 1 - aEducation, 1 - aIncome);
  return (1 - retained) * 100;
}

export function computeIhdi(
  d: DimensionIndices,
  a: InequalityCoefficients,
): IhdiResult {
  const adjusted: DimensionIndices = {
    health: d.health * (1 - a.aHealth),
    education: d.education * (1 - a.aEducation),
    income: d.income * (1 - a.aIncome),
  };

  return {
    hdi: computeHdi(d),
    ihdi: geoMean3(adjusted.health, adjusted.education, adjusted.income),
    overallLossPct: computeOverallLoss(a.aHealth, a.aEducation, a.aIncome),
    coefficientOfHumanInequalityPct:
      ((a.aHealth + a.aEducation + a.aIncome) / 3) * 100,
    adjusted,
  };
}

// ---------------------------------------------------------------------------
// Source reconciliation: USALEEP shape onto IHME level
// ---------------------------------------------------------------------------

export const USALEEP_IHME_ASSUMPTION =
  'Within-county lifespan dispersion is assumed stable between the USALEEP ' +
  '2010-2015 period and the current IHME year. COVID-19 mortality was not ' +
  'evenly distributed within counties; this assumption is plausible but ' +
  'unverified. Result is modeled, not observed.';

export interface TractLifeExpectancyInput {
  geoId: string;
  usaleepLe: number;
}

export interface RescaledTractLe {
  geoId: string;
  estimatedLe: number;
}

/**
 * Decompose rather than blend: IHME supplies the current LEVEL, USALEEP
 * supplies the within-county SHAPE.
 *
 *   estimated_tract_LE = ihmeCountyLe * (usaleep_tract_LE / usaleep_county_mean)
 *
 * Any result produced by this function is capped at trust tier
 * 'derived_with_stated_assumption' and must carry USALEEP_IHME_ASSUMPTION.
 */
export function rescaleTractLifeExpectancy(
  tracts: TractLifeExpectancyInput[],
  ihmeCountyLe: number,
): RescaledTractLe[] {
  if (tracts.length === 0) {
    throw new Error('rescaleTractLifeExpectancy: no tracts supplied');
  }
  if (!(ihmeCountyLe > 0)) {
    throw new Error('rescaleTractLifeExpectancy: ihmeCountyLe must be positive');
  }

  const usaleepCountyMean =
    tracts.reduce((acc, t) => acc + t.usaleepLe, 0) / tracts.length;

  if (!(usaleepCountyMean > 0)) {
    throw new Error(
      'rescaleTractLifeExpectancy: non-positive USALEEP county mean',
    );
  }

  return tracts.map((t) => ({
    geoId: t.geoId,
    estimatedLe: ihmeCountyLe * (t.usaleepLe / usaleepCountyMean),
  }));
}
