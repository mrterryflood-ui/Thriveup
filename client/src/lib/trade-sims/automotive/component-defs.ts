/**
 * Component library for the Automotive trade sim.
 *
 * Two groups:
 *   - Electrical-ish (6) — map to the existing electrical MNA solver via
 *     `placedToSolverElements()`. Used for Days 2-4 (battery/charging,
 *     starter, ignition primary) and Day 9 (wiring diagrams).
 *   - Diagnostic-ish (6) — concept-only labeled targets. The lesson player
 *     shows them as inspectable parts without running a simulator.
 *
 * The solver itself is NOT re-implemented. It's imported from
 * `../electrical/circuit-solver`.
 */

import type { CircuitElement } from "../electrical/circuit-solver";

export type AutoComponentKind =
  // electrical-ish (reuse electrical MNA solver)
  | "car_battery"
  | "starter_motor"
  | "alternator"
  | "fuse"
  | "ground_point"
  | "ignition_coil"
  // diagnostic-ish (concept-only)
  | "ecu_pcm"
  | "maf_sensor"
  | "o2_sensor"
  | "coolant_temp_sensor"
  | "spark_plug"
  | "obd2_port";

export interface AutoTerminal {
  name: string;
  dx: number;
  dy: number;
}

export interface AutoComponentDef {
  kind: AutoComponentKind;
  label: string;
  description: string;
  category: "power" | "load" | "protection" | "ground" | "ignition" | "sensor" | "control" | "diagnostic";
  /** "linear-dc" components map to solver elements. "concept-only" don't. */
  engineRole: "linear-dc" | "concept-only";
  unit?: string;
  terminals: AutoTerminal[];
  defaultProps: Record<string, number | boolean | string>;
  size: { w: number; h: number };
  introducedDay: number;
}

export const AUTO_COMPONENT_DEFS: Record<AutoComponentKind, AutoComponentDef> = {
  car_battery: {
    kind: "car_battery",
    label: "12 V Car Battery",
    description: "Lead-acid 12.6 V nominal source for the entire low-voltage system. Cranking amps drop voltage under starter load.",
    category: "power",
    engineRole: "linear-dc",
    unit: "V",
    terminals: [
      { name: "pos", dx: 0, dy: 0 },
      { name: "neg", dx: 2, dy: 0 },
    ],
    defaultProps: { voltage: 12.6, internalResistance: 0.02 },
    size: { w: 2, h: 1 },
    introducedDay: 2,
  },
  starter_motor: {
    kind: "starter_motor",
    label: "Starter Motor",
    description: "Series-wound DC motor. Modeled as a very low resistance (~0.05 Ω) — pulls 150-300 A while cranking.",
    category: "load",
    engineRole: "linear-dc",
    unit: "Ω",
    terminals: [
      { name: "pos", dx: 0, dy: 0 },
      { name: "neg", dx: 2, dy: 0 },
    ],
    defaultProps: { resistance: 0.05 },
    size: { w: 2, h: 1 },
    introducedDay: 3,
  },
  alternator: {
    kind: "alternator",
    label: "Alternator",
    description: "Engine-driven AC generator with internal rectifier + regulator. Modeled as a 14.2 V DC source when the engine is running, off otherwise.",
    category: "power",
    engineRole: "linear-dc",
    unit: "V",
    terminals: [
      { name: "pos", dx: 0, dy: 0 },
      { name: "neg", dx: 2, dy: 0 },
    ],
    defaultProps: { voltage: 14.2, running: true },
    size: { w: 2, h: 1 },
    introducedDay: 2,
  },
  fuse: {
    kind: "fuse",
    label: "Fuse",
    description: "Overcurrent protection. Closed = near-zero resistance; blown = open circuit.",
    category: "protection",
    engineRole: "linear-dc",
    unit: "A",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 2, dy: 0 },
    ],
    defaultProps: { ratedAmps: 30, blown: false },
    size: { w: 2, h: 1 },
    introducedDay: 2,
  },
  ground_point: {
    kind: "ground_point",
    label: "Chassis Ground",
    description: "Body / chassis return path. All single-wire automotive circuits return here.",
    category: "ground",
    engineRole: "linear-dc",
    terminals: [{ name: "gnd", dx: 0, dy: 0 }],
    defaultProps: {},
    size: { w: 1, h: 1 },
    introducedDay: 2,
  },
  ignition_coil: {
    kind: "ignition_coil",
    label: "Ignition Coil (primary)",
    description: "Step-up transformer for spark generation. Primary winding modeled as a ~0.5 Ω resistor; secondary high-voltage side is concept-only.",
    category: "ignition",
    engineRole: "linear-dc",
    unit: "Ω",
    terminals: [
      { name: "pos", dx: 0, dy: 0 },
      { name: "neg", dx: 2, dy: 0 },
    ],
    defaultProps: { primaryResistance: 0.5 },
    size: { w: 2, h: 1 },
    introducedDay: 4,
  },
  ecu_pcm: {
    kind: "ecu_pcm",
    label: "ECU / PCM",
    description: "Engine / powertrain control module. Reads sensors, drives actuators, stores DTCs. Concept-only — the lesson player surfaces it as an inspection target.",
    category: "control",
    engineRole: "concept-only",
    terminals: [
      { name: "pwr", dx: 0, dy: 0 },
      { name: "gnd", dx: 0, dy: 2 },
      { name: "sensor_bus", dx: 3, dy: 1 },
    ],
    defaultProps: { firmware: "v1.0", dtcCount: 0 },
    size: { w: 3, h: 2 },
    introducedDay: 7,
  },
  maf_sensor: {
    kind: "maf_sensor",
    label: "MAF Sensor",
    description: "Mass Air Flow sensor — measures incoming air mass. Output is a frequency or voltage signal proportional to g/s.",
    category: "sensor",
    engineRole: "concept-only",
    unit: "g/s",
    terminals: [
      { name: "signal", dx: 2, dy: 0 },
      { name: "pwr", dx: 0, dy: 0 },
      { name: "gnd", dx: 0, dy: 1 },
    ],
    defaultProps: { gramsPerSec: 4.5 },
    size: { w: 2, h: 1 },
    introducedDay: 8,
  },
  o2_sensor: {
    kind: "o2_sensor",
    label: "O₂ Sensor",
    description: "Exhaust oxygen sensor. Switches around 0.45 V between rich (<) and lean (>) of stoich.",
    category: "sensor",
    engineRole: "concept-only",
    unit: "V",
    terminals: [
      { name: "signal", dx: 2, dy: 0 },
      { name: "gnd", dx: 0, dy: 1 },
    ],
    defaultProps: { voltage: 0.45 },
    size: { w: 2, h: 1 },
    introducedDay: 8,
  },
  coolant_temp_sensor: {
    kind: "coolant_temp_sensor",
    label: "Coolant Temp Sensor",
    description: "Negative-temperature-coefficient thermistor. Resistance drops as engine warms — ECU uses this for cold-start enrichment.",
    category: "sensor",
    engineRole: "concept-only",
    unit: "°C",
    terminals: [
      { name: "signal", dx: 2, dy: 0 },
      { name: "gnd", dx: 0, dy: 1 },
    ],
    defaultProps: { tempC: 90 },
    size: { w: 2, h: 1 },
    introducedDay: 8,
  },
  spark_plug: {
    kind: "spark_plug",
    label: "Spark Plug",
    description: "Final delivery of the ignition spark across a 0.7-1.1 mm gap. Secondary-side voltage (~20 kV) is concept-only.",
    category: "ignition",
    engineRole: "concept-only",
    terminals: [
      { name: "hv_in", dx: 0, dy: 0 },
      { name: "gnd", dx: 0, dy: 2 },
    ],
    defaultProps: { gapMm: 0.9 },
    size: { w: 1, h: 2 },
    introducedDay: 4,
  },
  obd2_port: {
    kind: "obd2_port",
    label: "OBD-II Port",
    description: "Standard 16-pin diagnostic connector under the dash. Concept-only — surfaces in scan-tool lessons.",
    category: "diagnostic",
    engineRole: "concept-only",
    terminals: [
      { name: "can_h", dx: 2, dy: 0 },
      { name: "can_l", dx: 2, dy: 1 },
      { name: "pwr", dx: 0, dy: 0 },
      { name: "gnd", dx: 0, dy: 1 },
    ],
    defaultProps: { protocol: "CAN-11bit" },
    size: { w: 3, h: 2 },
    introducedDay: 7,
  },
};

export const AUTO_COMPONENT_KINDS: AutoComponentKind[] = Object.keys(AUTO_COMPONENT_DEFS) as AutoComponentKind[];

export interface PlacedAutoComponent {
  id: string;
  kind: AutoComponentKind;
  terminalNodes: Record<string, number>;
  props: Record<string, number | boolean | string>;
}

/**
 * Optional adapter context — lets callers compile multiple components at
 * once while reserving hidden nodes for source internal resistance. Without
 * a context, the adapter falls back to ideal-source stamping for a single
 * source, which is fine for one-source circuits but will produce a singular
 * MNA system if two sources (e.g. battery + running alternator) sit in
 * parallel. Pass an `allocNode()` plus the current `nodeCount` to get safe
 * stamping for any number of paralleled sources.
 */
export interface AdapterContext {
  /** Returns the next free node id and increments the caller's counter. */
  allocNode: () => number;
}

function stampSourceWithInternalR(
  id: string,
  posNode: number,
  negNode: number,
  voltage: number,
  rInt: number,
  ctx: AdapterContext | undefined,
): CircuitElement[] {
  if (rInt <= 0) {
    return [{ id, kind: "vsource", nodes: [posNode, negNode], voltage }];
  }
  if (!ctx) {
    // No allocator — fall back to ideal source. Safe for single-source
    // circuits; callers with multiple paralleled sources MUST pass ctx.
    return [{ id, kind: "vsource", nodes: [posNode, negNode], voltage }];
  }
  const hidden = ctx.allocNode();
  return [
    { id: `${id}_src`, kind: "vsource", nodes: [hidden, negNode], voltage },
    { id: `${id}_rint`, kind: "resistor", nodes: [posNode, hidden], resistance: rInt },
  ];
}

/**
 * Adapter — translate a placed automotive component into electrical-solver
 * elements. Diagnostic-ish components return [] (the player handles them
 * outside the solver). When an `AdapterContext` is supplied, battery and
 * running alternator are stamped as (ideal source + series internal R)
 * using a freshly-allocated hidden node so multiple sources can be wired
 * in parallel without producing a singular MNA system.
 */
export function placedToSolverElements(
  comp: PlacedAutoComponent,
  ctx?: AdapterContext,
): CircuitElement[] {
  const { id, kind, terminalNodes, props } = comp;
  switch (kind) {
    case "car_battery": {
      const v = Number(props.voltage ?? 12.6);
      const rInt = Number(props.internalResistance ?? 0.02);
      return stampSourceWithInternalR(id, terminalNodes.pos, terminalNodes.neg, v, rInt, ctx);
    }
    case "starter_motor": {
      const r = Number(props.resistance ?? 0.05);
      return [{ id, kind: "resistor", nodes: [terminalNodes.pos, terminalNodes.neg], resistance: r }];
    }
    case "alternator": {
      const running = Boolean(props.running);
      if (!running) return [];
      const v = Number(props.voltage ?? 14.2);
      // Real alternators have ~0.05-0.15 Ω source resistance — let callers
      // override via `sourceResistance` prop; default 0.1 Ω.
      const rSrc = Number(props.sourceResistance ?? 0.1);
      return stampSourceWithInternalR(id, terminalNodes.pos, terminalNodes.neg, v, rSrc, ctx);
    }
    case "fuse": {
      const blown = Boolean(props.blown);
      if (blown) return [];
      return [{ id, kind: "resistor", nodes: [terminalNodes.a, terminalNodes.b], resistance: 1e-6 }];
    }
    case "ground_point":
      // The canvas layer guarantees that any wire connected to a ground_point
      // is unified to node 0 upstream of the solver. Nothing to stamp.
      return [];
    case "ignition_coil": {
      const r = Number(props.primaryResistance ?? 0.5);
      return [{ id, kind: "resistor", nodes: [terminalNodes.pos, terminalNodes.neg], resistance: r }];
    }
    case "ecu_pcm":
    case "maf_sensor":
    case "o2_sensor":
    case "coolant_temp_sensor":
    case "spark_plug":
    case "obd2_port":
      // Concept-only components. Player renders them as inspection targets,
      // not as solver elements.
      return [];
  }
}
