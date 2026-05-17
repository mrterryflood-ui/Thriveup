/**
 * Welding evaluator — self-running test harness.
 *
 *     npx tsx client/src/lib/trade-sims/welding/heat-input-evaluator.test.ts
 *
 * Covers the 8 required scenarios from the task plan plus 3 additional edge
 * cases (negative travel speed rejection, missing-shielding-gas detection,
 * out-of-position current warning).
 */

import {
  computeHeatInput,
  predictPenetration,
  requiredFilletLegMm,
  evaluateWeldVsSpec,
  PROCESS_EFFICIENCY,
} from "./heat-input-evaluator";

let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, details = ""): void {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}  ${details}`);
  }
}

function approxEq(a: number, b: number, tol = 1e-3): boolean {
  return Math.abs(a - b) <= Math.max(tol, tol * Math.max(Math.abs(a), Math.abs(b)));
}

// 1. Heat-input formula sanity.
{
  const r = computeHeatInput({
    process: "SMAW",
    volts: 22,
    amps: 120,
    travelSpeedMmPerSec: 4,
  });
  if (!r.ok) {
    check("Test 1: heat-input ok", false, r.error);
  } else {
    // HI = 0.80 · 22 · 120 / 4 = 528
    check(
      "Test 1: heat-input formula HI = η·V·I/v = 528 J/mm",
      approxEq(r.heatInputJPerMm, 528, 1),
      `got ${r.heatInputJPerMm}`,
    );
    check("Test 1: efficiency = SMAW default 0.80", approxEq(r.efficiency, PROCESS_EFFICIENCY.SMAW));
  }
}

// 2. Arc-energy density (heat-input / travel speed inverse relationship).
{
  const slow = computeHeatInput({ process: "GMAW", volts: 20, amps: 200, travelSpeedMmPerSec: 5 });
  const fast = computeHeatInput({ process: "GMAW", volts: 20, amps: 200, travelSpeedMmPerSec: 10 });
  if (!slow.ok || !fast.ok) {
    check("Test 2: arc-energy density", false);
  } else {
    check(
      "Test 2: doubling travel speed halves heat input",
      approxEq(slow.heatInputJPerMm, fast.heatInputJPerMm * 2),
      `slow=${slow.heatInputJPerMm} fast=${fast.heatInputJPerMm}`,
    );
  }
}

// 3. Penetration classification — adequate range.
{
  const r = predictPenetration({ process: "SMAW", heatInputJPerMm: 600, baseMetalMm: 8, jointType: "butt" });
  if (!r.ok) {
    check("Test 3: penetration adequate", false, r.error);
  } else {
    check(
      "Test 3: 600 J/mm into 8 mm steel classifies as adequate",
      r.classification === "adequate",
      `got ${r.classification} (${r.penetrationMm.toFixed(2)} mm)`,
    );
  }
}

// 4. Penetration classification — burnthrough on thin material.
{
  const r = predictPenetration({ process: "FCAW", heatInputJPerMm: 2000, baseMetalMm: 2, jointType: "butt" });
  if (!r.ok) {
    check("Test 4: burnthrough flag", false, r.error);
  } else {
    check(
      "Test 4: 2000 J/mm into 2 mm steel flags burnthrough",
      r.classification === "burnthrough",
      `got ${r.classification} (${r.penetrationMm.toFixed(2)} mm)`,
    );
  }
}

// 5. Penetration classification — incomplete on thick material.
{
  const r = predictPenetration({ process: "GTAW", heatInputJPerMm: 100, baseMetalMm: 12, jointType: "butt" });
  if (!r.ok) {
    check("Test 5: incomplete penetration", false, r.error);
  } else {
    check(
      "Test 5: 100 J/mm into 12 mm steel flags incomplete",
      r.classification === "incomplete",
      `got ${r.classification} (${r.penetrationMm.toFixed(2)} mm)`,
    );
  }
}

// 6. Fillet leg minimums per AWS D1.1.
{
  const a = requiredFilletLegMm(5);
  const b = requiredFilletLegMm(10);
  const c = requiredFilletLegMm(16);
  const d = requiredFilletLegMm(25);
  check("Test 6a: 5 mm base → 3 mm fillet leg minimum", a === 3, `got ${a}`);
  check("Test 6b: 10 mm base → 5 mm fillet leg minimum", b === 5, `got ${b}`);
  check("Test 6c: 16 mm base → 6 mm fillet leg minimum", c === 6, `got ${c}`);
  check("Test 6d: 25 mm base → 8 mm fillet leg minimum", d === 8, `got ${d}`);
}

// 7. GMAW vs SMAW deposition-rate comparison — at same parameters, GMAW has
// lower efficiency so lower J/mm.
{
  const gmaw = computeHeatInput({ process: "GMAW", volts: 22, amps: 200, travelSpeedMmPerSec: 5 });
  const smaw = computeHeatInput({ process: "SMAW", volts: 22, amps: 200, travelSpeedMmPerSec: 5 });
  if (!gmaw.ok || !smaw.ok) {
    check("Test 7: GMAW vs SMAW comparison", false);
  } else {
    check(
      "Test 7: at identical V/I/v, GMAW heat input < SMAW (lower η)",
      gmaw.heatInputJPerMm < smaw.heatInputJPerMm,
      `gmaw=${gmaw.heatInputJPerMm} smaw=${smaw.heatInputJPerMw}`,
    );
  }
}

// 8. Joint pass/fail — undersized fillet on tee joint.
{
  const r = evaluateWeldVsSpec({
    process: "SMAW",
    parameters: { volts: 22, amps: 120, travelSpeedMmPerSec: 4 },
    jointType: "tee",
    baseMetalMm: 10,
    position: "1F",
    targetFilletLegMm: 4, // below AWS minimum of 5
  });
  if (!r.ok) {
    check("Test 8: undersized fillet check", false, r.error);
  } else {
    check(
      "Test 8: undersized fillet leg fails AWS check",
      r.pass === false && r.notes.some((n) => /AWS D1\.1/.test(n)),
      `pass=${r.pass} notes=${r.notes.join(" | ")}`,
    );
  }
}

// 9. Bead geometry sanity — passing case.
{
  const r = evaluateWeldVsSpec({
    process: "GMAW",
    parameters: { volts: 22, amps: 200, travelSpeedMmPerSec: 5, shieldingGasFlowLPerMin: 15 },
    jointType: "butt",
    baseMetalMm: 6,
    position: "1G",
  });
  if (!r.ok) {
    check("Test 9: clean pass case", false, r.error);
  } else {
    check(
      "Test 9: in-spec GMAW butt weld on 6 mm steel passes",
      r.pass === true && r.score > 0.7,
      `pass=${r.pass} score=${r.score} notes=${r.notes.join(" | ")}`,
    );
  }
}

// 10. Reject negative travel speed.
{
  const r = computeHeatInput({ process: "SMAW", volts: 22, amps: 120, travelSpeedMmPerSec: -1 });
  check("Test 10: rejects negative travel speed", r.ok === false);
}

// 11. Missing shielding gas on GMAW.
{
  const r = evaluateWeldVsSpec({
    process: "GMAW",
    parameters: { volts: 22, amps: 200, travelSpeedMmPerSec: 5, shieldingGasFlowLPerMin: 0 },
    jointType: "butt",
    baseMetalMm: 6,
    position: "1G",
  });
  if (!r.ok) {
    check("Test 11: missing-gas detection", false, r.error);
  } else {
    check(
      "Test 11: GMAW with 0 L/min shielding gas fails",
      r.pass === false && r.notes.some((n) => /shielding gas/i.test(n)),
      `pass=${r.pass} notes=${r.notes.join(" | ")}`,
    );
  }
}

// 12. Out-of-position warning at high current.
{
  const r = evaluateWeldVsSpec({
    process: "SMAW",
    parameters: { volts: 22, amps: 240, travelSpeedMmPerSec: 4 },
    jointType: "groove",
    baseMetalMm: 10,
    position: "5G",
  });
  if (!r.ok) {
    check("Test 12: out-of-position warning", false, r.error);
  } else {
    check(
      "Test 12: high current in 5G position triggers a position note",
      r.notes.some((n) => /out-of-position/i.test(n)),
      `notes=${r.notes.join(" | ")}`,
    );
  }
}

console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
