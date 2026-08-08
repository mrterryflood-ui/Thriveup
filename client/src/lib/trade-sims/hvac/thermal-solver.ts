/**
 * HVAC thermal-airflow solver — steady-state heat balance.
 *
 * Computes per-zone design load (sensible + latent), required airflow,
 * per-duct pressure drop and velocity, and total system load. Compares the
 * total against equipment capacity and surfaces undersized / oversized
 * warnings.
 *
 * Heat-balance model per zone (SI internally):
 *   Q_envelope = (A_wall / R_wall) * (T_zone - T_outdoor)        [W]
 *   Q_internal = internalGain + occupancy * 75                    [W]
 *   Q_sensible = Q_envelope - Q_internal                          [W]
 *      (positive => heating needed; negative => cooling needed)
 *   Q_latent   = m_vent * h_fg * max(0, W_outdoor - W_indoor)     [W]
 *      (only in cooling mode; dehumidification cost)
 *
 * Required airflow per zone (delivered by supply duct):
 *   m_dot   = |Q_sensible| / (c_p * |ΔT_supply|)                  [kg/s]
 *   V_m3s   = m_dot / rho_air                                     [m^3/s]
 *   CFM     = V_m3s * 2118.88
 *
 * Duct pressure drop (Darcy-Weisbach in air):
 *   v       = V_m3s / A_cross                                     [m/s]
 *   D_h     = sqrt(4 A_cross / pi)                                [m]
 *   ΔP      = f * (L / D_h) * (rho_air * v^2 / 2)                 [Pa]
 *
 * Unit handling:
 *   The solver works SI internally. Inputs may be flagged `units: "imperial"`
 *   at the top level; in that case zone areas/volumes/R-values/temperatures
 *   and capacities are converted at the boundary. Outputs are SI; the lesson
 *   player is responsible for re-converting for display if the learner prefers
 *   Imperial.
 *
 * Errors:
 *   Returned as `{ ok: false, error }`. No throws on the happy path.
 *
 * Reference: ASHRAE Handbook of Fundamentals (Manual J residential load calc
 * follows the same envelope + internal gains + infiltration approach,
 * simplified here).
 */

const C_P_AIR = 1005;          // J/(kg·K)
const RHO_AIR = 1.2;           // kg/m³
const H_FG = 2.45e6;           // J/kg latent heat of vaporization of water
const M3S_PER_CFM = 4.71947e-4;
const CFM_PER_M3S = 2118.88;
// Defaults (SI)
const DEFAULT_DT_SUPPLY = 11;  // K (≈20 °F) sensible supply-to-zone delta
const DEFAULT_INDOOR_W = 0.0093; // kg/kg at 24 °C / 50 %RH
const DEFAULT_VENT_M3S_PER_PERSON = 0.0035; // 7.5 CFM/person (ASHRAE 62.2)
const DEFAULT_FRICTION = 0.02;

// ---------- Imperial → SI helpers (boundary only) ----------
const fToC = (f: number): number => (f - 32) * (5 / 9);
const ft2ToM2 = (a: number): number => a * 0.092903;
const ft3ToM3 = (v: number): number => v * 0.0283168;
const rImpToSI = (r: number): number => r / 5.678;   // hr·ft²·°F/Btu → m²·K/W
const btuhToW = (q: number): number => q * 0.293071;

// ---------- Public types ----------

export type HvacUnits = "SI" | "imperial";

export interface HvacZone {
  id: string;
  /** Air volume (m³ or ft³). Used for ventilation/ACH calcs only. */
  volume: number;
  /** Setpoint (°C or °F). */
  targetTemp: number;
  /** Number of occupants. Adds 75 W sensible each. */
  occupancy?: number;
  /** External-wall + roof + window UA surface area (m² or ft²). */
  externalWallArea: number;
  /** Composite R-value (m²·K/W or hr·ft²·°F/Btu). */
  externalWallR: number;
  /** Internal heat gain — lights, appliances, etc. (W or Btu/hr). */
  internalGain?: number;
  /** Mechanical ventilation air rate to outdoor (m³/s) — SI only. Optional. */
  ventilationM3s?: number;
}

export interface HvacDuct {
  id: string;
  fromZone: string;             // zone id or "equipment"
  toZone: string;               // zone id or "ambient"
  /** Cross-section area (m² or ft²). */
  crossSection: number;
  /** Length (m or ft). */
  length: number;
  /** Darcy friction factor (dimensionless). Default 0.02. */
  friction?: number;
  /** "supply" or "return" — affects airflow direction; both contribute to ΔP. */
  kind?: "supply" | "return";
}

export interface HvacEquipment {
  id: string;
  /** Positive heating capacity (W or Btu/hr). */
  heatingCapacity: number;
  /** Positive cooling capacity (W or Btu/hr). */
  coolingCapacity: number;
  /** COP for heat pump (heating side), AFUE for furnace, or SEER/3.41 for AC. */
  efficiency: number;
  /** Blower rating (CFM). Always CFM regardless of `units`. */
  blowerCFM: number;
}

export interface HvacAmbient {
  /** Outdoor dry-bulb (°C or °F). */
  temp: number;
  /** Outdoor humidity ratio (kg water / kg dry air). Optional. */
  humidityRatio?: number;
  /** Indoor target humidity ratio (kg/kg). Optional; default 0.0093. */
  indoorHumidityRatio?: number;
}

export interface ThermalSolveInput {
  units?: HvacUnits;
  zones: HvacZone[];
  ducts: HvacDuct[];
  equipment: HvacEquipment;
  ambient: HvacAmbient;
  /** Sensible supply-to-zone ΔT (K). Default 11. */
  supplyDT?: number;
}

export interface ZoneResult {
  /** Resulting steady-state temperature (°C) — equals target when capacity ≥ load. */
  temperature: number;
  /** Sensible load needed at the target temp (W). Sign: + heating, − cooling. */
  sensibleLoad: number;
  /** Latent load (W). Always ≥ 0; only meaningful in cooling. */
  latentLoad: number;
  /** Magnitude of sensible+latent (W). */
  designLoad: number;
  /** Required airflow at this zone's supply diffuser (CFM). */
  airflowRequiredCFM: number;
}

export interface DuctResult {
  /** Volumetric airflow (CFM). */
  airflowCFM: number;
  /** Air velocity (m/s). */
  velocity: number;
  /** Static pressure drop (Pa). */
  pressureDropPa: number;
}

export interface ThermalSolveResult {
  ok: true;
  perZone: Record<string, ZoneResult>;
  perDuct: Record<string, DuctResult>;
  /** Sum of |Q| across zones (W). */
  totalLoad: number;
  /** Sum of latent (W). */
  totalLatent: number;
  /** Dominant mode given the ambient. */
  mode: "heating" | "cooling";
  /** Sized equipment capacity (W) for the dominant mode. */
  equipmentCapacity: number;
  warnings: string[];
}

export interface ThermalSolveError {
  ok: false;
  error: string;
}

// ---------- Internal SI-ized shapes ----------

interface SIZone {
  id: string;
  volume: number;
  targetTemp: number;
  occupancy: number;
  externalWallArea: number;
  externalWallR: number;
  internalGain: number;
  ventilationM3s: number;
}

interface SIDuct {
  id: string;
  fromZone: string;
  toZone: string;
  crossSection: number;
  length: number;
  friction: number;
  kind: "supply" | "return";
}

interface SIEquipment {
  id: string;
  heatingCapacity: number;
  coolingCapacity: number;
  efficiency: number;
  blowerCFM: number;
}

interface SIAmbient {
  temp: number;
  humidityRatio: number;
  indoorHumidityRatio: number;
}

function toSI(input: ThermalSolveInput): {
  zones: SIZone[];
  ducts: SIDuct[];
  equipment: SIEquipment;
  ambient: SIAmbient;
  supplyDT: number;
} {
  const imp = input.units === "imperial";
  const zones: SIZone[] = input.zones.map((z) => ({
    id: z.id,
    volume: imp ? ft3ToM3(z.volume) : z.volume,
    targetTemp: imp ? fToC(z.targetTemp) : z.targetTemp,
    occupancy: z.occupancy ?? 0,
    externalWallArea: imp ? ft2ToM2(z.externalWallArea) : z.externalWallArea,
    externalWallR: imp ? rImpToSI(z.externalWallR) : z.externalWallR,
    internalGain: imp ? btuhToW(z.internalGain ?? 0) : (z.internalGain ?? 0),
    ventilationM3s:
      z.ventilationM3s !== undefined
        ? z.ventilationM3s
        : (z.occupancy ?? 0) * DEFAULT_VENT_M3S_PER_PERSON,
  }));
  const ducts: SIDuct[] = input.ducts.map((d) => ({
    id: d.id,
    fromZone: d.fromZone,
    toZone: d.toZone,
    crossSection: imp ? ft2ToM2(d.crossSection) : d.crossSection,
    length: imp ? d.length * 0.3048 : d.length,
    friction: d.friction ?? DEFAULT_FRICTION,
    kind: d.kind ?? "supply",
  }));
  const equipment: SIEquipment = {
    id: input.equipment.id,
    heatingCapacity: imp ? btuhToW(input.equipment.heatingCapacity) : input.equipment.heatingCapacity,
    coolingCapacity: imp ? btuhToW(input.equipment.coolingCapacity) : input.equipment.coolingCapacity,
    efficiency: input.equipment.efficiency,
    blowerCFM: input.equipment.blowerCFM,
  };
  const ambient: SIAmbient = {
    temp: imp ? fToC(input.ambient.temp) : input.ambient.temp,
    humidityRatio: input.ambient.humidityRatio ?? 0,
    indoorHumidityRatio: input.ambient.indoorHumidityRatio ?? DEFAULT_INDOOR_W,
  };
  return { zones, ducts, equipment, ambient, supplyDT: input.supplyDT ?? DEFAULT_DT_SUPPLY };
}

// ---------- Solver ----------

export function solveThermal(input: ThermalSolveInput): ThermalSolveResult | ThermalSolveError {
  // --- Validate ----------------------------------------------------------
  if (!input || !Array.isArray(input.zones) || input.zones.length === 0) {
    return { ok: false, error: "Network must include at least one zone." };
  }
  if (!input.equipment) {
    return { ok: false, error: "Equipment specification is required." };
  }
  const ids = new Set<string>();
  for (const z of input.zones) {
    if (ids.has(z.id)) return { ok: false, error: `Duplicate zone id: ${z.id}` };
    ids.add(z.id);
    if (z.volume <= 0) return { ok: false, error: `Zone ${z.id} has non-positive volume.` };
    if (z.externalWallArea <= 0) {
      return { ok: false, error: `Zone ${z.id} has non-positive external wall area.` };
    }
    if (z.externalWallR <= 0) {
      return { ok: false, error: `Zone ${z.id} has non-positive R-value.` };
    }
  }
  const dIds = new Set<string>();
  for (const d of input.ducts) {
    if (dIds.has(d.id)) return { ok: false, error: `Duplicate duct id: ${d.id}` };
    dIds.add(d.id);
    if (d.crossSection <= 0) return { ok: false, error: `Duct ${d.id} has non-positive cross-section.` };
    if (d.length <= 0) return { ok: false, error: `Duct ${d.id} has non-positive length.` };
  }
  if (input.equipment.heatingCapacity < 0 || input.equipment.coolingCapacity < 0) {
    return { ok: false, error: "Equipment capacities must be non-negative." };
  }
  if (input.equipment.blowerCFM <= 0) {
    return { ok: false, error: "Blower CFM must be positive on an active system." };
  }

  const { zones, ducts, equipment, ambient, supplyDT } = toSI(input);

  if (supplyDT <= 0) {
    return { ok: false, error: `Supply ΔT must be positive (got ${supplyDT} K).` };
  }

  // --- Topology feasibility: every zone must be reachable by at least one
  //     supply duct AND one return path. An "active zone" with no supply
  //     duct cannot physically receive airflow, so the system is impossible
  //     regardless of load math. Reject early.
  const zoneIds = new Set(zones.map((z) => z.id));
  const reachedBySupply = new Set<string>();
  const reachedByReturn = new Set<string>();
  for (const d of ducts) {
    if (d.kind === "supply" && zoneIds.has(d.toZone)) reachedBySupply.add(d.toZone);
    if (d.kind === "return" && zoneIds.has(d.fromZone)) reachedByReturn.add(d.fromZone);
  }
  for (const z of zones) {
    if (!reachedBySupply.has(z.id)) {
      return {
        ok: false,
        error: `Zone ${z.id} has no supply duct — airflow cannot reach it. Add a supply_duct whose toZone="${z.id}".`,
      };
    }
  }
  // Returns can be shared, so we only warn (not error) if a zone has no
  // explicit return — most residential systems use a single common return.
  // But require at least ONE return duct on the system overall.
  const anyReturn = ducts.some((d) => d.kind === "return");
  if (ducts.length > 0 && !anyReturn) {
    return {
      ok: false,
      error: "System has supply ducts but no return duct — air can't recirculate. Add a return_duct.",
    };
  }
  // Suppress lint: reachedByReturn intentionally tracked for future per-zone
  // return validation.
  void reachedByReturn;

  // --- Mode determination -----------------------------------------------
  const avgTarget = zones.reduce((s, z) => s + z.targetTemp, 0) / zones.length;
  const mode: "heating" | "cooling" = ambient.temp < avgTarget ? "heating" : "cooling";

  // --- Per-zone load ----------------------------------------------------
  const perZone: Record<string, ZoneResult> = {};
  let totalSensible = 0;
  let totalLatent = 0;

  for (const z of zones) {
    const u_a = z.externalWallArea / z.externalWallR; // W/K
    const qEnvelope = u_a * (z.targetTemp - ambient.temp); // + when zone warmer
    const qInternal = z.internalGain + z.occupancy * 75;   // sensible
    const qSensible = qEnvelope - qInternal;
    // Latent only in cooling mode and only if outdoor more humid than target.
    let qLatent = 0;
    if (mode === "cooling") {
      const dW = ambient.humidityRatio - ambient.indoorHumidityRatio;
      if (dW > 0 && z.ventilationM3s > 0) {
        const mAir = z.ventilationM3s * RHO_AIR; // kg/s dry air
        qLatent = mAir * H_FG * dW;
      }
    }
    // Required airflow sized to the sensible portion.
    const mDot = Math.abs(qSensible) / (C_P_AIR * supplyDT);
    const vM3s = mDot / RHO_AIR;
    const cfm = vM3s * CFM_PER_M3S;
    const designLoad = Math.abs(qSensible) + qLatent;

    perZone[z.id] = {
      temperature: z.targetTemp,
      sensibleLoad: qSensible,
      latentLoad: qLatent,
      designLoad,
      airflowRequiredCFM: cfm,
    };
    totalSensible += qSensible;
    totalLatent += qLatent;
  }

  // Aggregation note (v1 simplification):
  //   totalLoad = |Σ zone sensible| + Σ zone latent
  // This is the NET sensible the equipment must deliver in the dominant
  // mode, plus all latent. In a mixed-load scenario (e.g. a kitchen with
  // internal gain large enough to flip sign while the rest of the house is
  // still in heating), opposite-sign zones cancel in this aggregation —
  // so totalLoad is the system's *net* demand, not the sum of magnitudes.
  // For per-zone-isolated equipment sizing (e.g. mini-split per room), use
  // the perZone values directly; for single-system block-load sizing, this
  // net is the correct number to compare against equipment capacity.
  const totalLoad = Math.abs(totalSensible) + totalLatent;
  const equipmentCapacity = mode === "heating" ? equipment.heatingCapacity : equipment.coolingCapacity;

  // --- Per-duct flow / pressure drop ------------------------------------
  // Airflow model:
  //  - Each supply duct carries the airflow its destination zone needs.
  //  - Returns are constrained by MASS BALANCE: total return CFM must equal
  //    total supply CFM at steady state (air in == air out). With multiple
  //    returns we split that total by the relative cross-section (a decent
  //    physical proxy for capacity), so a single return naturally carries
  //    everything. This is what makes a shared return actually a "shared"
  //    return.
  const supplyDucts = ducts.filter((d) => d.kind === "supply");
  const returnDucts = ducts.filter((d) => d.kind === "return");
  const totalRequiredCFM = Object.values(perZone).reduce((s, r) => s + r.airflowRequiredCFM, 0);
  const totalReturnArea = returnDucts.reduce((s, d) => s + d.crossSection, 0);

  const perDuct: Record<string, DuctResult> = {};
  for (const d of ducts) {
    let cfm = 0;
    if (d.kind === "supply" && perZone[d.toZone]) {
      cfm = perZone[d.toZone].airflowRequiredCFM;
    } else if (d.kind === "return") {
      // Mass balance: total return = total supply. Split by cross-section.
      cfm = totalReturnArea > 0
        ? totalRequiredCFM * (d.crossSection / totalReturnArea)
        : totalRequiredCFM;
    } else {
      // Fallback split for un-typed ducts.
      cfm = totalRequiredCFM / Math.max(1, supplyDucts.length || 1);
    }
    const vM3s = cfm * M3S_PER_CFM;
    const v = vM3s / d.crossSection; // m/s
    const Dh = Math.sqrt((4 * d.crossSection) / Math.PI);
    const dp = d.friction * (d.length / Dh) * ((RHO_AIR * v * v) / 2);
    perDuct[d.id] = { airflowCFM: cfm, velocity: v, pressureDropPa: dp };
  }

  // --- Warnings ---------------------------------------------------------
  const warnings: string[] = [];

  if (equipmentCapacity > 0 && totalLoad > equipmentCapacity * 1.001) {
    warnings.push(
      `Undersized: ${mode} capacity ${(equipmentCapacity).toFixed(0)} W < total load ${(totalLoad).toFixed(0)} W. ` +
        `Increase equipment size or improve envelope.`,
    );
  }
  if (equipmentCapacity > 0 && totalLoad > 0 && equipmentCapacity > totalLoad * 1.5) {
    warnings.push(
      `Oversized: ${mode} capacity ${(equipmentCapacity).toFixed(0)} W is more than 1.5× the design load ${(totalLoad).toFixed(0)} W. ` +
        `Short-cycling and humidity-control problems likely.`,
    );
  }
  if (equipmentCapacity === 0 && totalLoad > 0) {
    warnings.push(`No ${mode} capacity defined but ${(totalLoad).toFixed(0)} W of load exists.`);
  }
  // Blower vs total required airflow.
  if (totalRequiredCFM > equipment.blowerCFM * 1.001) {
    warnings.push(
      `Blower undersized: total required ${totalRequiredCFM.toFixed(0)} CFM > blower rating ${equipment.blowerCFM} CFM.`,
    );
  }
  // Duct velocity sanity (residential supply duct typical 600–900 fpm = 3–4.5 m/s).
  // Threshold aligned with the Day 5 lesson target: keep supply velocity
  // under 4.5 m/s (~900 fpm) to avoid noise and excess friction loss.
  for (const [id, r] of Object.entries(perDuct)) {
    if (r.velocity > 4.5) {
      warnings.push(`Duct ${id} velocity ${r.velocity.toFixed(1)} m/s exceeds ~4.5 m/s (900 fpm) — expect noise and high friction loss.`);
    }
  }
  // Mixed-sign zone loads: some zones heating while others cool. The net
  // aggregation above cancels them, so flag it explicitly.
  {
    const sens = Object.values(perZone).map((z) => z.sensibleLoad);
    const hasPos = sens.some((s) => s > 1);
    const hasNeg = sens.some((s) => s < -1);
    if (hasPos && hasNeg) {
      const sumMagnitudes = Object.values(perZone).reduce((s, z) => s + Math.abs(z.sensibleLoad), 0) + totalLatent;
      warnings.push(
        `Mixed loads: some zones need heating while others need cooling. Total load shown is the NET demand ` +
          `(${totalLoad.toFixed(0)} W); the sum of per-zone magnitudes is ${sumMagnitudes.toFixed(0)} W. ` +
          `A single system cannot serve both modes at once — size per-zone equipment from the per-zone loads.`,
      );
    }
  }

  return {
    ok: true,
    perZone,
    perDuct,
    totalLoad,
    totalLatent,
    mode,
    equipmentCapacity,
    warnings,
  };
}

/** Convenience: convert SI W to Btu/hr. */
export function wToBtuh(w: number): number {
  return w / 0.293071;
}

/** Convenience: convert °C to °F. */
export function cToF(c: number): number {
  return c * 9 / 5 + 32;
}
