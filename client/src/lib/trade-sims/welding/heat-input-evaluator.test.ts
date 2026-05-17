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
  isGasCompatibleWithProcess,
  inPerMinToMmPerSec,
  inchesToMm,
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

// 6. Fillet leg minimums per AWS D1.1 (default) and explicit awsCategory.
{
  const a = requiredFilletLegMm(5);
  const b = requiredFilletLegMm(10, "D1.1");
  const c = requiredFilletLegMm(16, "D1.6");
  const d = requiredFilletLegMm(25);
  const alum = requiredFilletLegMm(25, "D1.2");
  check("Test 6a: 5 mm base → 3 mm fillet leg minimum", a === 3, `got ${a}`);
  check("Test 6b: 10 mm D1.1 → 5 mm fillet leg minimum", b === 5, `got ${b}`);
  check("Test 6c: 16 mm D1.6 stainless → 6 mm fillet leg minimum", c === 6, `got ${c}`);
  check("Test 6d: 25 mm D1.1 → 8 mm fillet leg minimum", d === 8, `got ${d}`);
  check("Test 6e: 25 mm D1.2 aluminum → 10 mm fillet leg minimum", alum === 10, `got ${alum}`);
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

// 12a. Imperial-to-SI boundary helpers.
{
  const v = inPerMinToMmPerSec(10); // 10 in/min = 254 mm/min = 4.2333 mm/s
  check(
    "Test 12a: inPerMinToMmPerSec(10) ≈ 4.233 mm/s",
    typeof v === "number" && approxEq(v, (10 * 25.4) / 60, 1e-6),
    `got ${v}`,
  );
  const t = inchesToMm(0.25); // 0.25 in = 6.35 mm
  check(
    "Test 12b: inchesToMm(0.25) = 6.35 mm",
    typeof t === "number" && approxEq(t, 6.35, 1e-6),
    `got ${t}`,
  );
  const bad = inPerMinToMmPerSec(-5);
  check("Test 12c: inPerMinToMmPerSec rejects negative", typeof bad !== "number" && bad.ok === false);
}

// 12d. Evaluator accepts imperial inputs at the boundary.
{
  // 0.25" base, 12 in/min travel speed (≈ 5.08 mm/s) on a GMAW butt joint.
  const r = evaluateWeldVsSpec({
    process: "GMAW",
    parameters: {
      volts: 22,
      amps: 200,
      travelSpeedInPerMin: 12,
      shieldingGasFlowLPerMin: 15,
      shieldingGas: "Ar-CO2",
    },
    jointType: "butt",
    baseMetalInches: 0.25,
    position: "1G",
  });
  if (!r.ok) {
    check("Test 12d: imperial boundary", false, r.error);
  } else {
    check(
      "Test 12d: imperial inputs (in/min + inches) evaluate cleanly",
      r.pass === true && r.score > 0.6,
      `pass=${r.pass} score=${r.score} notes=${r.notes.join(" | ")}`,
    );
  }
}

// 13. Gas/process compatibility — direct helper.
{
  check(
    "Test 13a: SMAW + external gas → mismatch",
    typeof isGasCompatibleWithProcess("SMAW", "Ar-CO2") === "string",
  );
  check(
    "Test 13b: GTAW + CO2 → mismatch (destroys tungsten)",
    typeof isGasCompatibleWithProcess("GTAW", "CO2") === "string",
  );
  check(
    "Test 13c: GMAW + pure Ar on steel → mismatch (finger penetration)",
    typeof isGasCompatibleWithProcess("GMAW", "Ar") === "string",
  );
  check(
    "Test 13d: GMAW + Ar-CO2 → compatible (null)",
    isGasCompatibleWithProcess("GMAW", "Ar-CO2") === null,
  );
  check(
    "Test 13e: GTAW + Ar → compatible (null)",
    isGasCompatibleWithProcess("GTAW", "Ar") === null,
  );
}

// 14. evaluateWeldVsSpec rejects an incompatible gas selection.
{
  const r = evaluateWeldVsSpec({
    process: "GTAW",
    parameters: {
      volts: 15,
      amps: 100,
      travelSpeedMmPerSec: 3,
      shieldingGasFlowLPerMin: 15,
      shieldingGas: "CO2", // wrong gas for GTAW
    },
    jointType: "butt",
    baseMetalMm: 4,
    position: "1G",
  });
  if (!r.ok) {
    check("Test 14: gas-mismatch detection", false, r.error);
  } else {
    check(
      "Test 14: GTAW with CO2 shielding fails compatibility check",
      r.pass === false && r.notes.some((n) => /tungsten|inert/i.test(n)),
      `pass=${r.pass} notes=${r.notes.join(" | ")}`,
    );
  }
}

// 14b. Precedence: SI input wins when both SI and imperial are supplied.
// (Caller bug surface — we should not silently average or auto-detect.)
{
  // SI says 6 mm base; imperial says 1.0 in (=25.4 mm). For 6 mm + 200 A GMAW
  // we expect adequate penetration; for 25.4 mm we'd expect incomplete.
  const r = evaluateWeldVsSpec({
    process: "GMAW",
    parameters: {
      volts: 22,
      amps: 200,
      travelSpeedMmPerSec: 5,     // SI present
      travelSpeedInPerMin: 1,     // imperial would be ~0.42 mm/s — wildly different
      shieldingGasFlowLPerMin: 15,
      shieldingGas: "Ar-CO2",
    },
    jointType: "butt",
    baseMetalMm: 6,               // SI present
    baseMetalInches: 1.0,         // imperial would map to 25.4 mm
    position: "1G",
  });
  if (!r.ok) {
    check("Test 14b: precedence (SI > imperial)", false, r.error);
  } else {
    check(
      "Test 14b: SI fields win when both SI and imperial are provided",
      r.pass === true && !r.notes.some((n) => /insufficient|burnthrough/i.test(n)),
      `pass=${r.pass} notes=${r.notes.join(" | ")}`,
    );
  }
}

// 15. Out-of-position warning at high current.
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
