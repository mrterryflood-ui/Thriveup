/**
 * Self-running tests for the HVAC thermal-airflow solver.
 *
 * Run with:  npx tsx client/src/lib/trade-sims/hvac/thermal-solver.test.ts
 *
 * Coverage (≥8, per task spec):
 *   1. Steady-state heat balance for a single zone.
 *   2. Two-zone balance with one return duct (shared-return aggregate check).
 *   3. Sensible-only cooling load Q = m·c·ΔT.
 *   4. Sensible + latent psychrometric split.
 *   5. Design-day load (worst-case ambient).
 *   6. Basic duct-static-pressure drop.
 *   7. Oversized-system fault detection.
 *   8. Convergence on a small 4-zone home.
 *   9. Imperial unit boundary.
 *  10. Undersized equipment warning.
 *  11. Rejects invalid geometry (negative R-value, zero blower, etc).
 *  12. Rejects topology: active zone with no supply duct.
 *  13. Rejects topology: supply ducts present but no return.
 */

import { solveThermal, type ThermalSolveInput } from "./thermal-solver";

/** Default ducts used in single-zone happy-path tests. */
function singleZoneDucts(zoneId = "Z1") {
  return [
    { id: `sup-${zoneId}`, fromZone: "equipment", toZone: zoneId, crossSection: 0.05, length: 5, kind: "supply" as const },
    { id: `ret-${zoneId}`, fromZone: zoneId, toZone: "equipment", crossSection: 0.08, length: 6, kind: "return" as const },
  ];
}

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
function approx(a: number, b: number, tol = 1e-3): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

console.log("HVAC thermal-solver tests:");

// 1. Single zone, heating-mode steady-state heat balance.
test("1. single-zone heating balance: Q = (A/R) * ΔT - internal", () => {
  // 100 m² envelope, R = 5 m²K/W, target 22 °C, ambient -5 °C → ΔT = 27 K.
  // Q_envelope = 20 W/K * 27 = 540 W. internal 100 W. Sensible = 440 W.
  const r = solveThermal({
    zones: [{
      id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 100,
      externalWallR: 5, internalGain: 100,
    }],
    ducts: [
      { id: "d1", fromZone: "equipment", toZone: "Z1", crossSection: 0.05, length: 5, kind: "supply" },
      { id: "r1", fromZone: "Z1", toZone: "equipment", crossSection: 0.08, length: 6, kind: "return" },
    ],
    equipment: { id: "hp", heatingCapacity: 5000, coolingCapacity: 5000, efficiency: 3.5, blowerCFM: 400 },
    ambient: { temp: -5 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.mode === "heating", `mode should be heating, got ${r.mode}`);
  assert(approx(r.perZone.Z1.sensibleLoad, 440, 0.01), `sensible ${r.perZone.Z1.sensibleLoad} != 440`);
  assert(r.perZone.Z1.latentLoad === 0, "no latent in heating");
});

// 2. Two zones with one return duct.
test("2. two-zone balance with shared return duct", () => {
  const r = solveThermal({
    zones: [
      { id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 80, externalWallR: 4, internalGain: 0 },
      { id: "Z2", volume: 60, targetTemp: 22, externalWallArea: 60, externalWallR: 4, internalGain: 0 },
    ],
    ducts: [
      { id: "sup1", fromZone: "equipment", toZone: "Z1", crossSection: 0.05, length: 4, kind: "supply" },
      { id: "sup2", fromZone: "equipment", toZone: "Z2", crossSection: 0.04, length: 6, kind: "supply" },
      { id: "ret",  fromZone: "Z1",        toZone: "equipment", crossSection: 0.08, length: 8, kind: "return" },
    ],
    equipment: { id: "hp", heatingCapacity: 8000, coolingCapacity: 8000, efficiency: 3.5, blowerCFM: 800 },
    ambient: { temp: 0 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  // Z1: (80/4)*22 = 440 W ; Z2: (60/4)*22 = 330 W ; total = 770 W.
  const total = r.perZone.Z1.sensibleLoad + r.perZone.Z2.sensibleLoad;
  assert(approx(total, 770, 0.01), `total sensible ${total} != 770`);
  // Shared-return aggregate: the single return duct must carry the SUM of the
  // two supply ducts' airflow (mass balance — air in == air out at steady
  // state). This guards against a regression where the return is treated as
  // if it carries only one zone's flow.
  const sup1 = r.perDuct.sup1.airflowCFM;
  const sup2 = r.perDuct.sup2.airflowCFM;
  const ret = r.perDuct.ret.airflowCFM;
  assert(sup1 > 0 && sup2 > 0, "both supply ducts should carry air");
  assert(approx(ret, sup1 + sup2, 1e-3),
    `shared-return CFM ${ret} should equal supply sum ${sup1 + sup2}`);
});

// 3. Sensible-only cooling load — verify Q = m·c·ΔT consistency.
test("3. cooling-mode sensible load and airflow obey m·c·ΔT", () => {
  // Hot day: ambient 35 °C, target 24 °C → envelope adds heat.
  // (50/3) * (24-35) = -183.3 W (negative => cooling).  Internal gain 200.
  // Q_sensible = -183.3 - 200 = -383.3 W (need to remove 383.3 W).
  const r = solveThermal({
    zones: [{
      id: "Z1", volume: 60, targetTemp: 24, externalWallArea: 50,
      externalWallR: 3, internalGain: 200,
    }],
    ducts: singleZoneDucts("Z1"),
    equipment: { id: "ac", heatingCapacity: 0, coolingCapacity: 2000, efficiency: 4, blowerCFM: 400 },
    ambient: { temp: 35 },
    supplyDT: 11,
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.mode === "cooling", "mode should be cooling");
  assert(r.perZone.Z1.sensibleLoad < 0, "cooling load is negative");
  const q = Math.abs(r.perZone.Z1.sensibleLoad);
  // Reverse-engineer airflow: CFM * 4.71947e-4 * 1.2 * 1005 * 11 = q
  const cfm = r.perZone.Z1.airflowRequiredCFM;
  const qFromAirflow = cfm * 4.71947e-4 * 1.2 * 1005 * 11;
  assert(approx(qFromAirflow, q, 1e-3), `airflow→Q ${qFromAirflow} != Q ${q}`);
});

// 4. Sensible + latent psychrometric split.
test("4. latent load appears in cooling when outdoor humidity > indoor", () => {
  const r = solveThermal({
    zones: [{
      id: "Z1", volume: 60, targetTemp: 24, occupancy: 2,
      externalWallArea: 50, externalWallR: 3, internalGain: 200,
      ventilationM3s: 0.02,
    }],
    ducts: singleZoneDucts("Z1"),
    equipment: { id: "ac", heatingCapacity: 0, coolingCapacity: 5000, efficiency: 4, blowerCFM: 400 },
    ambient: { temp: 32, humidityRatio: 0.018, indoorHumidityRatio: 0.0093 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.perZone.Z1.latentLoad > 0, `expected latent > 0, got ${r.perZone.Z1.latentLoad}`);
  // Expected latent = 0.02 m³/s * 1.2 kg/m³ * 2.45e6 J/kg * (0.018-0.0093)
  const expected = 0.02 * 1.2 * 2.45e6 * (0.018 - 0.0093);
  assert(approx(r.perZone.Z1.latentLoad, expected, 1e-3),
    `latent ${r.perZone.Z1.latentLoad} != ${expected}`);
  assert(r.totalLatent > 0, "totalLatent > 0");
});

// 5. Design-day load uses worst-case ambient.
test("5. design-day worst-case ambient produces largest load", () => {
  const base: ThermalSolveInput = {
    zones: [{ id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 100, externalWallR: 5 }],
    ducts: singleZoneDucts("Z1"),
    equipment: { id: "hp", heatingCapacity: 6000, coolingCapacity: 6000, efficiency: 3.5, blowerCFM: 500 },
    ambient: { temp: 0 },
  };
  const mild = solveThermal({ ...base, ambient: { temp: 0 } });
  const design = solveThermal({ ...base, ambient: { temp: -15 } });
  assert(mild.ok && design.ok, "expected ok");
  if (!mild.ok || !design.ok) return;
  assert(design.totalLoad > mild.totalLoad,
    `design-day load ${design.totalLoad} should exceed mild-day ${mild.totalLoad}`);
});

// 6. Duct static-pressure drop ΔP = f * (L/D_h) * (ρ v² / 2).
test("6. duct static pressure drop matches Darcy-Weisbach", () => {
  const r = solveThermal({
    zones: [{ id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 100, externalWallR: 5, internalGain: 0 }],
    ducts: [
      { id: "d1", fromZone: "equipment", toZone: "Z1", crossSection: 0.04, length: 10, friction: 0.022, kind: "supply" },
      { id: "r1", fromZone: "Z1", toZone: "equipment", crossSection: 0.08, length: 8, kind: "return" },
    ],
    equipment: { id: "hp", heatingCapacity: 6000, coolingCapacity: 6000, efficiency: 3.5, blowerCFM: 500 },
    ambient: { temp: -5 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  const cfm = r.perZone.Z1.airflowRequiredCFM;
  const v = (cfm * 4.71947e-4) / 0.04;
  const Dh = Math.sqrt((4 * 0.04) / Math.PI);
  const expectedDP = 0.022 * (10 / Dh) * ((1.2 * v * v) / 2);
  assert(approx(r.perDuct.d1.pressureDropPa, expectedDP, 1e-6),
    `ΔP ${r.perDuct.d1.pressureDropPa} != ${expectedDP}`);
  assert(approx(r.perDuct.d1.velocity, v, 1e-9), "duct velocity mismatch");
});

// 7. Oversized equipment surfaces a warning.
test("7. oversized equipment (capacity > 1.5× load) flagged", () => {
  // Modest load (~440 W) but a 5 kW heat pump → 11× oversize.
  const r = solveThermal({
    zones: [{ id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 100, externalWallR: 5, internalGain: 100 }],
    ducts: singleZoneDucts("Z1"),
    equipment: { id: "hp", heatingCapacity: 5000, coolingCapacity: 5000, efficiency: 3.5, blowerCFM: 600 },
    ambient: { temp: -5 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.warnings.some((w) => /Oversized/i.test(w)),
    `expected oversized warning, got: ${r.warnings.join(" | ")}`);
});

// 8. Small 4-zone home converges and totals correctly.
test("8. 4-zone home: per-zone loads sum to total", () => {
  const r = solveThermal({
    zones: [
      { id: "LR", volume: 80, targetTemp: 22, externalWallArea: 60, externalWallR: 5 },
      { id: "KT", volume: 40, targetTemp: 22, externalWallArea: 30, externalWallR: 5, internalGain: 300 },
      { id: "BR1", volume: 50, targetTemp: 20, externalWallArea: 40, externalWallR: 5 },
      { id: "BR2", volume: 50, targetTemp: 20, externalWallArea: 40, externalWallR: 5 },
    ],
    ducts: [
      { id: "s1", fromZone: "equipment", toZone: "LR",  crossSection: 0.05, length: 4, kind: "supply" },
      { id: "s2", fromZone: "equipment", toZone: "KT",  crossSection: 0.04, length: 5, kind: "supply" },
      { id: "s3", fromZone: "equipment", toZone: "BR1", crossSection: 0.04, length: 7, kind: "supply" },
      { id: "s4", fromZone: "equipment", toZone: "BR2", crossSection: 0.04, length: 8, kind: "supply" },
      { id: "ret", fromZone: "LR",        toZone: "equipment", crossSection: 0.12, length: 10, kind: "return" },
    ],
    equipment: { id: "hp", heatingCapacity: 6000, coolingCapacity: 6000, efficiency: 3.5, blowerCFM: 1000 },
    ambient: { temp: -5 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  // totalLoad = |Σ sensible| + Σ latent (the net the equipment must deliver in
  // the dominant mode). Individual zones may flip sign when internal gains
  // exceed envelope loss — that's the kitchen case here.
  const netSensible = Object.values(r.perZone).reduce((s, z) => s + z.sensibleLoad, 0);
  const expected = Math.abs(netSensible) + r.totalLatent;
  assert(approx(expected, r.totalLoad, 1e-6),
    `|Σ sensible|+latent ${expected} != totalLoad ${r.totalLoad}`);
  // 4 ducts have results.
  assert(Object.keys(r.perDuct).length === 5, "expected 5 duct results (4 supply + 1 return)");
});

// 9. Imperial inputs convert at the boundary.
test("9. imperial inputs produce equivalent SI result", () => {
  // 1076 ft² ≈ 100 m². R-30 ft²°F·h/Btu ≈ 5.28 m²K/W. 72°F ≈ 22.2°C. 23°F ≈ -5°C.
  const r = solveThermal({
    units: "imperial",
    zones: [{
      id: "Z1", volume: 2825, targetTemp: 72, externalWallArea: 1076,
      externalWallR: 30, internalGain: 341,
    }],
    ducts: [
      { id: "d1", fromZone: "equipment", toZone: "Z1", crossSection: 0.54, length: 16, kind: "supply" },
      { id: "r1", fromZone: "Z1", toZone: "equipment", crossSection: 0.86, length: 20, kind: "return" },
    ],
    equipment: { id: "hp", heatingCapacity: 17000, coolingCapacity: 17000, efficiency: 3.5, blowerCFM: 400 },
    ambient: { temp: 23 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  // Sensible load magnitude should be in the hundreds of W (similar to test 1).
  assert(Math.abs(r.perZone.Z1.sensibleLoad) > 100 && Math.abs(r.perZone.Z1.sensibleLoad) < 1000,
    `imperial sensible load out of range: ${r.perZone.Z1.sensibleLoad}`);
});

// 10. Undersized equipment warning.
test("10. undersized equipment flagged when load > capacity", () => {
  // Big envelope, tiny capacity.
  const r = solveThermal({
    zones: [{ id: "Z1", volume: 200, targetTemp: 22, externalWallArea: 400, externalWallR: 2, internalGain: 0 }],
    ducts: singleZoneDucts("Z1"),
    equipment: { id: "hp", heatingCapacity: 500, coolingCapacity: 500, efficiency: 3.5, blowerCFM: 200 },
    ambient: { temp: -10 },
  });
  assert(r.ok, "expected ok");
  if (!r.ok) return;
  assert(r.warnings.some((w) => /Undersized/i.test(w)),
    `expected undersized warning, got: ${r.warnings.join(" | ")}`);
});

// 11. Invalid geometry rejected.
test("11. rejects non-positive R-value, area, blower", () => {
  const base: ThermalSolveInput = {
    zones: [{ id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 100, externalWallR: 5 }],
    ducts: singleZoneDucts("Z1"),
    equipment: { id: "hp", heatingCapacity: 6000, coolingCapacity: 6000, efficiency: 3.5, blowerCFM: 500 },
    ambient: { temp: -5 },
  };
  const r1 = solveThermal({ ...base, zones: [{ ...base.zones[0], externalWallR: -1 }] });
  assert(!r1.ok, "expected error for negative R");
  const r2 = solveThermal({ ...base, zones: [{ ...base.zones[0], externalWallArea: 0 }] });
  assert(!r2.ok, "expected error for zero area");
  const r3 = solveThermal({ ...base, equipment: { ...base.equipment, blowerCFM: 0 } });
  assert(!r3.ok, "expected error for zero blower");
});

// 12. Topology — active zone has no supply duct → impossible system.
test("12. rejects active zone with no supply duct (impossible airflow)", () => {
  const r = solveThermal({
    zones: [
      { id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 100, externalWallR: 5 },
      // Z2 is "active" (has load) but no supply duct routes air to it.
      { id: "Z2", volume: 60, targetTemp: 22, externalWallArea: 60, externalWallR: 4 },
    ],
    ducts: [
      { id: "s1", fromZone: "equipment", toZone: "Z1", crossSection: 0.05, length: 5, kind: "supply" },
      { id: "r1", fromZone: "Z1", toZone: "equipment", crossSection: 0.08, length: 6, kind: "return" },
    ],
    equipment: { id: "hp", heatingCapacity: 6000, coolingCapacity: 6000, efficiency: 3.5, blowerCFM: 500 },
    ambient: { temp: -5 },
  });
  assert(!r.ok, "expected impossible-topology rejection");
  if (!r.ok) {
    assert(/Z2/.test(r.error), `error should name the unreachable zone, got: ${r.error}`);
    assert(/supply/i.test(r.error), `error should mention supply duct, got: ${r.error}`);
  }
});

// 13. Topology — system has supply ducts but no return at all.
test("13. rejects system with supply ducts but no return path", () => {
  const r = solveThermal({
    zones: [{ id: "Z1", volume: 80, targetTemp: 22, externalWallArea: 100, externalWallR: 5 }],
    ducts: [
      { id: "s1", fromZone: "equipment", toZone: "Z1", crossSection: 0.05, length: 5, kind: "supply" },
    ],
    equipment: { id: "hp", heatingCapacity: 6000, coolingCapacity: 6000, efficiency: 3.5, blowerCFM: 500 },
    ambient: { temp: -5 },
  });
  assert(!r.ok, "expected no-return rejection");
  if (!r.ok) {
    assert(/return/i.test(r.error), `error should mention return, got: ${r.error}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
