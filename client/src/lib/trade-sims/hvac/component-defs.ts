/**
 * Component library for the HVAC trade sim.
 *
 * 12 kinds covering the residential split-system world: zones (rooms),
 * supply/return ducts, registers, dampers, thermostats, the two big
 * equipment choices (heat pump and gas furnace) plus the blower, filter,
 * humidifier, and a refrigerant line for the outdoor unit. `placedToSolverElements()`
 * compiles a placed network into the `solveThermal` input.
 */

import type {
  HvacZone,
  HvacDuct,
  HvacEquipment,
  HvacAmbient,
} from "./thermal-solver";

export type HvacComponentKind =
  | "zone"
  | "supply_duct"
  | "return_duct"
  | "register"
  | "damper"
  | "thermostat"
  | "heat_pump"
  | "gas_furnace"
  | "blower"
  | "filter"
  | "humidifier"
  | "refrigerant_line";

export interface Terminal {
  name: string;
  dx: number;
  dy: number;
}

export interface HvacComponentDef {
  kind: HvacComponentKind;
  label: string;
  description: string;
  category: "zone" | "duct" | "register" | "control" | "equipment" | "accessory" | "refrigerant";
  unit?: string;
  spriteKey: string;
  terminals: Terminal[];
  defaultProps: Record<string, number | boolean | string>;
  size: { w: number; h: number };
  introducedDay: number;
}

/**
 * Defaults are sized for a small residential application (~80 m² zone,
 * R-20 wall composite, 3-ton heat pump). Learners adjust in the inspector.
 */
export const HVAC_COMPONENT_DEFS: Record<HvacComponentKind, HvacComponentDef> = {
  zone: {
    kind: "zone",
    label: "Zone (Room)",
    description:
      "A conditioned room. Define floor area, target temperature, occupants, and the wall/roof/window envelope (R-value × area). This is the demand side of the system.",
    category: "zone",
    unit: "m³",
    spriteKey: "hvac/zone",
    terminals: [
      { name: "supply", dx: 0, dy: 0 },
      { name: "return", dx: 3, dy: 0 },
    ],
    defaultProps: {
      volume: 80,                 // m³
      targetTemp: 22,             // °C
      occupancy: 2,
      externalWallArea: 60,       // m²
      externalWallR: 4,           // m²·K/W (≈ R-23)
      internalGain: 150,          // W (lights, plug loads)
    },
    size: { w: 4, h: 3 },
    introducedDay: 1,
  },
  supply_duct: {
    kind: "supply_duct",
    label: "Supply Duct",
    description:
      "Carries conditioned air from the air handler to a register in a zone. Cross-section + length set static pressure drop; undersized ducts noise-up and starve airflow.",
    category: "duct",
    unit: "m",
    spriteKey: "hvac/supply-duct",
    terminals: [
      { name: "in", dx: 0, dy: 0 },
      { name: "out", dx: 4, dy: 0 },
    ],
    defaultProps: { crossSection: 0.05, length: 5, friction: 0.02 },
    size: { w: 4, h: 1 },
    introducedDay: 5,
  },
  return_duct: {
    kind: "return_duct",
    label: "Return Duct",
    description:
      "Pulls air from the zone back to the air handler. Returns should equal or exceed the total supply CFM, or you'll starve the blower.",
    category: "duct",
    unit: "m",
    spriteKey: "hvac/return-duct",
    terminals: [
      { name: "in", dx: 0, dy: 0 },
      { name: "out", dx: 4, dy: 0 },
    ],
    defaultProps: { crossSection: 0.08, length: 8, friction: 0.02 },
    size: { w: 4, h: 1 },
    introducedDay: 5,
  },
  register: {
    kind: "register",
    label: "Supply Register",
    description:
      "The grille where conditioned air enters the room. Throw pattern and CFM rating determine mixing and comfort.",
    category: "register",
    spriteKey: "hvac/register",
    terminals: [{ name: "supply", dx: 0, dy: 0 }],
    defaultProps: { cfmRating: 100, throwPattern: "4-way" },
    size: { w: 1, h: 1 },
    introducedDay: 5,
  },
  damper: {
    kind: "damper",
    label: "Zone Damper",
    description:
      "Motorized flap in a branch duct that opens/closes to direct airflow toward zones that are calling. The hardware behind zoning.",
    category: "control",
    spriteKey: "hvac/damper",
    terminals: [
      { name: "in", dx: 0, dy: 0 },
      { name: "out", dx: 2, dy: 0 },
    ],
    defaultProps: { open: true, openFraction: 1.0 },
    size: { w: 2, h: 1 },
    introducedDay: 9,
  },
  thermostat: {
    kind: "thermostat",
    label: "Thermostat",
    description:
      "Reads zone air temperature and calls for heat, cool, or fan. Set the setpoint and the deadband; the equipment cycles to hold it.",
    category: "control",
    spriteKey: "hvac/thermostat",
    terminals: [{ name: "sense", dx: 0, dy: 0 }],
    defaultProps: { setpoint: 22, deadband: 0.5, mode: "auto" },
    size: { w: 1, h: 1 },
    introducedDay: 9,
  },
  heat_pump: {
    kind: "heat_pump",
    label: "Heat Pump (Air-Source)",
    description:
      "Single piece of equipment that heats in winter and cools in summer using the refrigerant cycle. Capacity is rated at AHRI conditions; COP/SEER describe efficiency.",
    category: "equipment",
    unit: "W",
    spriteKey: "hvac/heat-pump",
    terminals: [
      { name: "supply", dx: 0, dy: 0 },
      { name: "return", dx: 2, dy: 0 },
      { name: "refrigerant", dx: 1, dy: 2 },
    ],
    defaultProps: {
      heatingCapacity: 10500,    // W ≈ 3 ton @ AHRI heating
      coolingCapacity: 10500,    // W ≈ 3 ton cooling
      cop: 3.5,
      seer: 15,
      blowerCFM: 1000,
    },
    size: { w: 3, h: 3 },
    introducedDay: 7,
  },
  gas_furnace: {
    kind: "gas_furnace",
    label: "Gas Furnace",
    description:
      "Combustion-heat appliance. Capacity = input × AFUE. Requires combustion-air supply and a flue that meets NFPA 54 clearances. Cooling is paired separately (AC coil on top).",
    category: "equipment",
    unit: "W",
    spriteKey: "hvac/gas-furnace",
    terminals: [
      { name: "supply", dx: 0, dy: 0 },
      { name: "return", dx: 2, dy: 0 },
      { name: "flue", dx: 1, dy: 2 },
    ],
    defaultProps: {
      heatingCapacity: 17500,    // W ≈ 60k BTU/hr input × 0.95 AFUE
      coolingCapacity: 0,
      afue: 0.95,
      blowerCFM: 1000,
    },
    size: { w: 3, h: 3 },
    introducedDay: 8,
  },
  blower: {
    kind: "blower",
    label: "Blower / Air Handler",
    description:
      "Variable-speed fan that moves return air across the heating/cooling coil and pushes it into the supply trunk. CFM rating sets the system's airflow ceiling.",
    category: "equipment",
    unit: "CFM",
    spriteKey: "hvac/blower",
    terminals: [
      { name: "in", dx: 0, dy: 0 },
      { name: "out", dx: 2, dy: 0 },
    ],
    defaultProps: { blowerCFM: 1000, staticPressureRating: 125 }, // 0.5 in.w.c. ≈ 125 Pa
    size: { w: 2, h: 2 },
    introducedDay: 5,
  },
  filter: {
    kind: "filter",
    label: "Air Filter",
    description:
      "Captures particulates. MERV rating drives indoor air quality (IAQ); higher MERV adds static pressure drop the blower must overcome.",
    category: "accessory",
    spriteKey: "hvac/filter",
    terminals: [
      { name: "in", dx: 0, dy: 0 },
      { name: "out", dx: 2, dy: 0 },
    ],
    defaultProps: { merv: 11, pressureDropPa: 50 },
    size: { w: 2, h: 1 },
    introducedDay: 10,
  },
  humidifier: {
    kind: "humidifier",
    label: "Whole-Home Humidifier",
    description:
      "Bypass or steam unit that adds moisture to the supply air in winter. Sized to target indoor humidity ratio.",
    category: "accessory",
    spriteKey: "hvac/humidifier",
    terminals: [
      { name: "supply", dx: 0, dy: 0 },
      { name: "drain", dx: 1, dy: 1 },
    ],
    defaultProps: { capacityKgHr: 0.5, targetHumidityRatio: 0.0075 },
    size: { w: 2, h: 2 },
    introducedDay: 10,
  },
  refrigerant_line: {
    kind: "refrigerant_line",
    label: "Refrigerant Line Set",
    description:
      "Insulated copper lineset (suction + liquid) connecting the outdoor condenser to the indoor coil. EPA Section 608 certification required to braze or recover.",
    category: "refrigerant",
    unit: "m",
    spriteKey: "hvac/refrigerant-line",
    terminals: [
      { name: "outdoor", dx: 0, dy: 0 },
      { name: "indoor", dx: 4, dy: 0 },
    ],
    defaultProps: { length: 8, suctionDiameter: 0.022, liquidDiameter: 0.010, refrigerant: "R-410A" },
    size: { w: 4, h: 1 },
    introducedDay: 7,
  },
};

export const HVAC_COMPONENT_KINDS: HvacComponentKind[] = Object.keys(
  HVAC_COMPONENT_DEFS,
) as HvacComponentKind[];

/** A placed-on-canvas instance of an HVAC component. */
export interface PlacedHvacComponent {
  id: string;
  kind: HvacComponentKind;
  /** Maps terminal name -> network node id (zone id or "equipment"/"ambient"). */
  terminalNodes: Record<string, string>;
  props: Record<string, number | boolean | string>;
}

export interface HvacSolverElements {
  zones: HvacZone[];
  ducts: HvacDuct[];
  equipment: HvacEquipment;
  ambient: HvacAmbient;
}

/**
 * Compile placed components into solver input.
 *
 * Convention: every duct's `from`/`to` is the node id stored in `terminalNodes`.
 * Zone components contribute a zone with id = the zone's primary terminal node.
 * The first equipment found (heat_pump / gas_furnace / blower) provides
 * heating + cooling capacity and blower CFM. If multiple equipment items are
 * placed, heat pump and gas furnace capacities are summed (dual-fuel setup),
 * blower CFM is the max.
 *
 * `ambient` defaults to a heating-design day (-5 °C) so the lesson player can
 * render an immediate result; callers should override based on the scenario.
 */
export function placedToSolverElements(
  components: PlacedHvacComponent[],
  ambient: Partial<HvacAmbient> = {},
): HvacSolverElements {
  const zones: HvacZone[] = [];
  const ducts: HvacDuct[] = [];
  let equipment: HvacEquipment = {
    id: "default",
    heatingCapacity: 0,
    coolingCapacity: 0,
    efficiency: 1,
    blowerCFM: 0,
  };
  let foundEquipment = false;

  for (const c of components) {
    const props = c.props ?? {};
    switch (c.kind) {
      case "zone": {
        zones.push({
          id: c.terminalNodes.supply ?? c.id,
          volume: Number(props.volume ?? 80),
          targetTemp: Number(props.targetTemp ?? 22),
          occupancy: Number(props.occupancy ?? 0),
          externalWallArea: Number(props.externalWallArea ?? 60),
          externalWallR: Number(props.externalWallR ?? 4),
          internalGain: Number(props.internalGain ?? 0),
        });
        break;
      }
      case "supply_duct":
      case "return_duct": {
        ducts.push({
          id: c.id,
          fromZone: c.terminalNodes.in,
          toZone: c.terminalNodes.out,
          crossSection: Number(props.crossSection ?? (c.kind === "return_duct" ? 0.08 : 0.05)),
          length: Number(props.length ?? 5),
          friction: Number(props.friction ?? 0.02),
          kind: c.kind === "supply_duct" ? "supply" : "return",
        });
        break;
      }
      case "damper": {
        // Closed damper => model as a return-style segment with effectively
        // zero airflow.  Open damper => transparent (skip).
        if (!Boolean(props.open ?? true) || Number(props.openFraction ?? 1) <= 0) {
          ducts.push({
            id: c.id,
            fromZone: c.terminalNodes.in,
            toZone: c.terminalNodes.out,
            crossSection: 0.001,
            length: 0.2,
            friction: 100,
            kind: "supply",
          });
        }
        break;
      }
      case "heat_pump": {
        equipment = {
          id: c.id,
          heatingCapacity: equipment.heatingCapacity + Number(props.heatingCapacity ?? 10500),
          coolingCapacity: equipment.coolingCapacity + Number(props.coolingCapacity ?? 10500),
          efficiency: Number(props.cop ?? 3.5),
          blowerCFM: Math.max(equipment.blowerCFM, Number(props.blowerCFM ?? 1000)),
        };
        foundEquipment = true;
        break;
      }
      case "gas_furnace": {
        equipment = {
          id: foundEquipment ? equipment.id : c.id,
          heatingCapacity: equipment.heatingCapacity + Number(props.heatingCapacity ?? 17500),
          coolingCapacity: equipment.coolingCapacity + Number(props.coolingCapacity ?? 0),
          efficiency: Number(props.afue ?? 0.95),
          blowerCFM: Math.max(equipment.blowerCFM, Number(props.blowerCFM ?? 1000)),
        };
        foundEquipment = true;
        break;
      }
      case "blower": {
        equipment.blowerCFM = Math.max(equipment.blowerCFM, Number(props.blowerCFM ?? 1000));
        if (!foundEquipment) equipment.id = c.id;
        break;
      }
      // register/thermostat/filter/humidifier/refrigerant_line are visual/IAQ
      // affordances; they don't modify the steady-state thermal balance in v1.
      case "register":
      case "thermostat":
      case "filter":
      case "humidifier":
      case "refrigerant_line":
        break;
    }
  }

  // Sensible default ambient for an immediate solve.
  const fullAmbient: HvacAmbient = {
    temp: ambient.temp ?? -5,
    humidityRatio: ambient.humidityRatio,
    indoorHumidityRatio: ambient.indoorHumidityRatio,
  };

  return { zones, ducts, equipment, ambient: fullAmbient };
}
