/**
 * Self-running tests for the plumbing unit boundary in component-defs.ts.
 *
 * Locks the nominal-pipe-size table (Sch 40/80 inner diameters), the
 * ft/psi head conversion constants, and findNominalMatch behavior so a
 * typo in a diameter entry or conversion constant can't silently skew
 * every solver result. Run with:
 *
 *     npx tsx client/src/lib/trade-sims/plumbing/component-defs.test.ts
 */

import {
  IN_TO_M,
  FT_TO_M,
  PSI_TO_M_HEAD,
  NOMINAL_PIPE_SIZES,
  nominalToDiameterM,
  findNominalMatch,
  headToSI,
  headFromSI,
  type PipeSchedule,
} from "./component-defs";

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
function approx(a: number, b: number, tol = 1e-4): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

console.log("plumbing component-defs unit-boundary tests:");

// 1. Conversion constants
test("1. conversion constants are physically correct", () => {
  assert(IN_TO_M === 0.0254, `IN_TO_M ${IN_TO_M} != 0.0254 (exact)`);
  assert(Math.abs(FT_TO_M - 0.3048) < 1e-6, `FT_TO_M ${FT_TO_M} != 0.3048 m`);
  // 1 psi ≈ 0.70307 m of water head (2.3067 ft)
  assert(Math.abs(PSI_TO_M_HEAD - 0.70307) < 5e-4, `PSI_TO_M_HEAD ${PSI_TO_M_HEAD} != ~0.70307 m`);
});

// 2. Full nominal-size table locked (Sch 40 & 80 inner diameters, inches)
test("2. NOMINAL_PIPE_SIZES table matches standard Sch 40/80 inner diameters", () => {
  const expected: Array<{ nominalIn: number; label: string; sch40: number; sch80: number }> = [
    { nominalIn: 0.5, label: `1/2"`, sch40: 0.622, sch80: 0.546 },
    { nominalIn: 0.75, label: `3/4"`, sch40: 0.824, sch80: 0.742 },
    { nominalIn: 1.0, label: `1"`, sch40: 1.049, sch80: 0.957 },
    { nominalIn: 1.25, label: `1-1/4"`, sch40: 1.38, sch80: 1.278 },
    { nominalIn: 1.5, label: `1-1/2"`, sch40: 1.61, sch80: 1.5 },
    { nominalIn: 2.0, label: `2"`, sch40: 2.067, sch80: 1.939 },
  ];
  assert(
    NOMINAL_PIPE_SIZES.length === expected.length,
    `table has ${NOMINAL_PIPE_SIZES.length} entries, expected ${expected.length}`,
  );
  for (const exp of expected) {
    const row = NOMINAL_PIPE_SIZES.find((s) => s.nominalIn === exp.nominalIn);
    assert(row, `missing nominal size ${exp.nominalIn}"`);
    if (!row) continue;
    assert(row.label === exp.label, `label for ${exp.nominalIn}": ${row.label} != ${exp.label}`);
    assert(row.innerIn["40"] === exp.sch40, `${exp.label} Sch40 inner ${row.innerIn["40"]} != ${exp.sch40}`);
    assert(row.innerIn["80"] === exp.sch80, `${exp.label} Sch80 inner ${row.innerIn["80"]} != ${exp.sch80}`);
  }
});

// 3. SI inner-diameter mapping (the exact spec example plus spot checks)
test("3. nominalToDiameterM maps to correct SI inner diameters", () => {
  const threeQuarter = NOMINAL_PIPE_SIZES.find((s) => s.nominalIn === 0.75)!;
  const d34 = nominalToDiameterM(threeQuarter, "40");
  // 0.824 in * 0.0254 = 0.0209296 m ≈ 0.02093 m
  assert(Math.abs(d34 - 0.02093) < 5e-6, `3/4" Sch40 -> ${d34} m, expected ~0.02093 m`);

  const half = NOMINAL_PIPE_SIZES.find((s) => s.nominalIn === 0.5)!;
  assert(approx(nominalToDiameterM(half, "40"), 0.622 * 0.0254, 1e-9), `1/2" Sch40 SI mismatch`);
  assert(approx(nominalToDiameterM(half, "80"), 0.546 * 0.0254, 1e-9), `1/2" Sch80 SI mismatch`);

  const two = NOMINAL_PIPE_SIZES.find((s) => s.nominalIn === 2.0)!;
  assert(approx(nominalToDiameterM(two, "40"), 2.067 * 0.0254, 1e-9), `2" Sch40 SI mismatch`);
  assert(approx(nominalToDiameterM(two, "80"), 1.939 * 0.0254, 1e-9), `2" Sch80 SI mismatch`);
});

// 4. Table sanity invariants (monotonic, Sch80 always thinner bore than Sch40)
test("4. table invariants: sorted ascending, Sch80 bore < Sch40 bore < nominal-based OD sanity", () => {
  for (let i = 1; i < NOMINAL_PIPE_SIZES.length; i++) {
    assert(
      NOMINAL_PIPE_SIZES[i].nominalIn > NOMINAL_PIPE_SIZES[i - 1].nominalIn,
      `table not sorted at index ${i}`,
    );
    assert(
      NOMINAL_PIPE_SIZES[i].innerIn["40"] > NOMINAL_PIPE_SIZES[i - 1].innerIn["40"],
      `Sch40 inner not increasing at index ${i}`,
    );
  }
  for (const s of NOMINAL_PIPE_SIZES) {
    assert(s.innerIn["80"] < s.innerIn["40"], `${s.label}: Sch80 bore must be smaller than Sch40`);
    assert(s.innerIn["40"] > 0 && s.innerIn["80"] > 0, `${s.label}: inner diameters must be positive`);
  }
});

// 5. headToSI / headFromSI round-trip for ft
test("5. head ft round-trip and known values", () => {
  for (const v of [1, 2.31, 10, 40, 100]) {
    const rt = headFromSI(headToSI(v, "ft"), "ft");
    assert(approx(rt, v, 1e-9), `ft round-trip ${v} -> ${rt}`);
  }
  // 10 ft = 3.048 m
  assert(approx(headToSI(10, "ft"), 3.048, 1e-6), `10 ft -> ${headToSI(10, "ft")} m != 3.048`);
  assert(approx(headFromSI(3.048, "ft"), 10, 1e-6), `3.048 m -> ${headFromSI(3.048, "ft")} ft != 10`);
});

// 6. headToSI / headFromSI round-trip for psi
test("6. head psi round-trip and known values", () => {
  for (const v of [1, 14.7, 43, 57, 80]) {
    const rt = headFromSI(headToSI(v, "psi"), "psi");
    assert(approx(rt, v, 1e-9), `psi round-trip ${v} -> ${rt}`);
  }
  // 1 psi ≈ 0.7031 m of water head
  assert(approx(headToSI(1, "psi"), 0.7031, 1e-3), `1 psi -> ${headToSI(1, "psi")} m != ~0.7031`);
  // 40 m of head ≈ 56.9 psi (typical street pressure default)
  assert(Math.abs(headFromSI(40, "psi") - 56.89) < 0.05, `40 m -> ${headFromSI(40, "psi")} psi != ~56.89`);
});

// 7. meters pass through untouched
test("7. head unit 'm' is identity in both directions", () => {
  for (const v of [0, 1.5, 40]) {
    assert(headToSI(v, "m") === v, `headToSI(${v}, m) changed the value`);
    assert(headFromSI(v, "m") === v, `headFromSI(${v}, m) changed the value`);
  }
});

// 8. findNominalMatch recognizes every standard value exactly
test("8. findNominalMatch recognizes every table entry (both schedules)", () => {
  for (const size of NOMINAL_PIPE_SIZES) {
    for (const schedule of ["40", "80"] as PipeSchedule[]) {
      const d = nominalToDiameterM(size, schedule);
      const m = findNominalMatch(d);
      assert(m, `no match for ${size.label} Sch${schedule} (${d} m)`);
      if (!m) continue;
      assert(
        m.size.nominalIn === size.nominalIn && m.schedule === schedule,
        `wrong match for ${size.label} Sch${schedule}: got ${m.size.label} Sch${m.schedule}`,
      );
    }
  }
});

// 9. findNominalMatch tolerates tiny float drift but not the legacy 0.019 m
test("9. findNominalMatch: ~0.1% drift matches, legacy 0.019 m returns null", () => {
  const d34 = nominalToDiameterM(NOMINAL_PIPE_SIZES.find((s) => s.nominalIn === 0.75)!, "40");
  const drift = findNominalMatch(d34 * 1.001);
  assert(drift && drift.size.nominalIn === 0.75 && drift.schedule === "40", "0.1% drift should still match 3/4\" Sch40");

  // Legacy seed value: 0.019 m is only ~0.8% from 3/4" Sch80 (0.018847 m),
  // so the match window must be tight enough to reject it as custom.
  assert(findNominalMatch(0.019) === null, `legacy 0.019 m must return null, got a match`);
});

// 10. findNominalMatch rejects clearly custom values
test("10. findNominalMatch returns null for out-of-range / nonsense diameters", () => {
  for (const d of [0.001, 0.1, 0.03, 0]) {
    assert(findNominalMatch(d) === null, `expected null for ${d} m`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
