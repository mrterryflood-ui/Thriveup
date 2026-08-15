/**
 * atkinson.test.ts
 *
 * Acceptance test 8.1 from the spec: reproduce UNDP's published figures from
 * UNDP's own published component inputs.
 *
 * IMPORTANT — read before reporting a green run as validation:
 * These tests validate the FORMULA ONLY. They say nothing about whether the
 * county-level health input is correct, because UNDP's national health
 * inequality figure comes from a different pipeline than either USALEEP or
 * IHME. There is no clean test for the health input. See spec section 8.2.
 *
 * Fixtures: UNDP HDR 2025 Statistical Annex Table 3 (2023 data).
 * https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf
 *
 * No test runner is installed in this repo (see flow-solver.test.ts for
 * precedent), so this file is its own harness: each `test()` call runs
 * immediately, throws on failure, and the process exits non-zero if any
 * assertion fails. Run with:
 *
 *     npx tsx server/equity-loss/atkinson.test.ts
 */

import {
  atkinsonIndex,
  computeOverallLoss,
  computeHdi,
  incomeIndex,
  lifeExpectancyIndex,
  educationIndex,
  rescaleTractLifeExpectancy,
  UNDP_GOALPOSTS,
} from './atkinson';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`FAIL: ${name}`);
    console.error(`  ${(err as Error).message}`);
  }
}

function expectCloseTo(actual: number, expected: number, precision: number, msg?: string): void {
  const tolerance = Math.pow(10, -precision) / 2;
  if (Math.abs(actual - expected) >= tolerance) {
    throw new Error(
      `${msg ?? ''} expected ${actual} to be close to ${expected} (precision ${precision})`.trim(),
    );
  }
}

function expectLessThan(actual: number, bound: number, msg?: string): void {
  if (!(actual < bound)) {
    throw new Error(`${msg ?? ''} expected ${actual} < ${bound}`.trim());
  }
}

function expectGreaterThan(actual: number, bound: number, msg?: string): void {
  if (!(actual > bound)) {
    throw new Error(`${msg ?? ''} expected ${actual} > ${bound}`.trim());
  }
}

function expectThrows(fn: () => void, pattern?: RegExp, msg?: string): void {
  try {
    fn();
  } catch (err) {
    if (pattern && !pattern.test((err as Error).message)) {
      throw new Error(
        `${msg ?? ''} threw, but message "${(err as Error).message}" did not match ${pattern}`.trim(),
      );
    }
    return;
  }
  throw new Error(`${msg ?? ''} expected function to throw`.trim());
}

/** UNDP HDR25 Table 3. Component losses are percentages as published. */
const HDR25 = [
  { country: 'United States', hdi: 0.938, ihdi: 0.832, loss: 11.3, health: 5.5, edu: 2.7, income: 23.9 },
  { country: 'Iceland', hdi: 0.972, ihdi: 0.923, loss: 5.0, health: 2.0, edu: 2.3, income: 10.7 },
  { country: 'Norway', hdi: 0.970, ihdi: 0.909, loss: 6.3, health: 2.4, edu: 1.8, income: 14.3 },
  { country: 'Denmark', hdi: 0.962, ihdi: 0.909, loss: 5.5, health: 3.1, edu: 2.3, income: 11.0 },
  { country: 'Czechia', hdi: 0.915, ihdi: 0.867, loss: 5.2, health: 3.0, edu: 1.2, income: 11.1 },
  { country: 'Slovenia', hdi: 0.931, ihdi: 0.885, loss: 4.9, health: 2.6, edu: 2.0, income: 10.0 },
  { country: 'Japan', hdi: 0.925, ihdi: 0.845, loss: 8.6, health: 2.5, edu: 5.8, income: 17.1 },
  { country: 'Canada', hdi: 0.939, ihdi: 0.867, loss: 7.7, health: 4.3, edu: 2.2, income: 16.0 },
  { country: 'OECD', hdi: 0.916, ihdi: 0.812, loss: 11.4, health: 4.8, edu: 6.4, income: 21.8 },
  { country: 'Very high HD', hdi: 0.914, ihdi: 0.821, loss: 10.2, health: 4.6, edu: 5.0, income: 20.1 },
];

// --- acceptance 8.1 — overall loss reproduces UNDP published values --------
//
// Tolerance note (found while running this suite, not in the original spec):
// a 1-decimal-precision tolerance (±0.05) is too tight. UNDP publishes each
// of the three component percentages independently rounded to one decimal,
// and the geometric mean compounds that rounding — across the 10 fixtures
// here the worst-case propagated error is ~0.087 points (Iceland). ±0.05
// fails 4 of 10 real UNDP rows even though the formula is correct; widened
// to an absolute ±0.1 to match the error the rounding itself introduces.
const OVERALL_LOSS_TOLERANCE = 0.1;
for (const row of HDR25) {
  test(`acceptance 8.1: ${row.country} loss ${row.loss}%`, () => {
    const computed = computeOverallLoss(row.health / 100, row.edu / 100, row.income / 100);
    expectLessThan(Math.abs(computed - row.loss), OVERALL_LOSS_TOLERANCE);
  });
}

// --- acceptance 8.1 — IHDI reproduces from HDI and loss ---------------------
for (const row of HDR25) {
  test(`acceptance 8.1: ${row.country} IHDI ${row.ihdi}`, () => {
    const retained = 1 - computeOverallLoss(row.health / 100, row.edu / 100, row.income / 100) / 100;
    const computed = row.hdi * retained;
    // 0.002 tolerance: UNDP rounds HDI, IHDI and each component independently.
    expectLessThan(Math.abs(computed - row.ihdi), 0.002);
  });
}

// --- US decomposition — the finding the engine exists to surface -----------
{
  const us = HDR25[0];

  test('US decomposition: income is the dominant driver, not education', () => {
    expectGreaterThan(us.income, us.edu * 5);
  });

  test('US decomposition: US education distribution beats the OECD average', () => {
    const oecd = HDR25.find((r) => r.country === 'OECD')!;
    expectLessThan(us.edu, oecd.edu);
  });

  test('US decomposition: US health inequality exceeds every peer democracy in the fixture set', () => {
    const peers = ['Iceland', 'Norway', 'Denmark', 'Czechia', 'Slovenia', 'Japan', 'Canada'];
    for (const name of peers) {
      const peer = HDR25.find((r) => r.country === name)!;
      expectGreaterThan(us.health, peer.health);
    }
  });
}

// --- atkinsonIndex -----------------------------------------------------
test('atkinsonIndex: returns 0 for a perfectly equal distribution', () => {
  expectCloseTo(atkinsonIndex([50, 50, 50, 50]), 0, 10);
});

test('atkinsonIndex: increases as dispersion increases', () => {
  const mild = atkinsonIndex([90, 100, 110]);
  const severe = atkinsonIndex([10, 100, 190]);
  expectGreaterThan(severe, mild);
});

test('atkinsonIndex: bottom-codes non-positive values instead of collapsing to 1', () => {
  const a = atkinsonIndex([0, 100, 200], { bottomCode: 1 });
  expectLessThan(a, 1);
  expectGreaterThan(a, 0);
});

test('atkinsonIndex: respects frequency weights', () => {
  const unweighted = atkinsonIndex([10, 100]);
  const weighted = atkinsonIndex([10, 100], { weights: [9, 1] });
  if (Math.abs(weighted - unweighted) < 1e-5) {
    throw new Error('expected weighted result to differ from unweighted result');
  }
});

test('atkinsonIndex: throws on an empty distribution rather than returning a number', () => {
  expectThrows(() => atkinsonIndex([]));
});

// --- input-unit guard --------------------------------------------------
test('input-unit guard: rejects percentages passed where proportions are expected', () => {
  // 5.5 instead of 0.055 — the most likely integration bug.
  expectThrows(() => computeOverallLoss(5.5, 2.7, 23.9), /proportions/);
});

// --- geometric mean is load-bearing -------------------------------------
test('geometric mean: a collapsed dimension cannot be offset by excellence elsewhere', () => {
  const balanced = computeHdi({ health: 0.7, education: 0.7, income: 0.7 });
  const lopsided = computeHdi({ health: 0.1, education: 1.0, income: 1.0 });
  expectLessThan(lopsided, balanced);
});

// --- dimension indices ---------------------------------------------------
test('dimension indices: life expectancy index uses UNDP goalposts', () => {
  expectCloseTo(lifeExpectancyIndex(85, UNDP_GOALPOSTS), 1, 6);
  expectCloseTo(lifeExpectancyIndex(20, UNDP_GOALPOSTS), 0, 6);
  expectCloseTo(lifeExpectancyIndex(79.0), (79 - 20) / 65, 6);
});

test('dimension indices: income index is logarithmic', () => {
  const lowStep = incomeIndex(2000) - incomeIndex(1000);
  const highStep = incomeIndex(51000) - incomeIndex(50000);
  expectGreaterThan(lowStep, highStep);
});

test('dimension indices: education index averages MYS and EYS components', () => {
  expectCloseTo(educationIndex(15, 18), 1, 6);
});

// --- USALEEP/IHME reconciliation ----------------------------------------
test('USALEEP/IHME reconciliation: preserves relative shape while resetting the level', () => {
  const tracts = [
    { geoId: 'A', usaleepLe: 70 },
    { geoId: 'B', usaleepLe: 80 },
    { geoId: 'C', usaleepLe: 90 },
  ];
  const out = rescaleTractLifeExpectancy(tracts, 82);

  // Level: rescaled mean equals the IHME county level.
  const mean = out.reduce((a, t) => a + t.estimatedLe, 0) / out.length;
  expectCloseTo(mean, 82, 6);

  // Shape: ratios between tracts are unchanged.
  expectCloseTo(out[2].estimatedLe / out[0].estimatedLe, 90 / 70, 6);
});

test('USALEEP/IHME reconciliation: throws rather than guessing when no tracts are supplied', () => {
  expectThrows(() => rescaleTractLifeExpectancy([], 82));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
