/**
 * Component library for the Electrical trade sim.
 *
 * Each component has:
 *   - kind: stable identifier
 *   - label: human-readable name
 *   - terminals: named connection points (relative to component origin)
 *   - defaultProps: editable values shown in the inspector
 *   - simModel: how this component maps to circuit-solver elements
 *
 * For v1 (DC steady-state):
 *   - Capacitors act as OPEN circuits (no DC current)
 *   - Inductors act as SHORT circuits (zero DC resistance)
 *   - Transistors + logic gates use simplified threshold models (Phase B/C)
 */

import type { CircuitElement } from "./circuit-solver";

export type ComponentKind =
  | "battery"
  | "resistor"
  | "wire"
  | "switch"
  | "led"
  | "capacitor"
  | "inductor"
  | "npn_transistor"
  | "pnp_transistor"
  | "and_gate"
  | "or_gate"
  | "not_gate";

export interface Terminal {
  name: string;
  /** Local x offset in grid units. */
  dx: number;
  /** Local y offset in grid units. */
  dy: number;
}

export interface ComponentDef {
  kind: ComponentKind;
  label: string;
  description: string;
  category: "source" | "passive" | "active" | "digital" | "interconnect";
  unit?: string;
  terminals: Terminal[];
  defaultProps: Record<string, number | boolean | string>;
  /** Visual footprint in grid cells (width x height). */
  size: { w: number; h: number };
  /** Which day-lessons this component is introduced in. */
  introducedDay: number;
}

export const COMPONENT_DEFS: Record<ComponentKind, ComponentDef> = {
  battery: {
    kind: "battery",
    label: "Battery",
    description: "Independent DC voltage source. Provides a fixed voltage between + and − terminals.",
    category: "source",
    unit: "V",
    terminals: [
      { name: "pos", dx: 0, dy: 0 },
      { name: "neg", dx: 2, dy: 0 },
    ],
    defaultProps: { voltage: 9 },
    size: { w: 2, h: 1 },
    introducedDay: 1,
  },
  resistor: {
    kind: "resistor",
    label: "Resistor",
    description: "Passive component that limits current flow. Voltage across it follows Ohm's Law: V = I × R.",
    category: "passive",
    unit: "Ω",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 2, dy: 0 },
    ],
    defaultProps: { resistance: 1000 },
    size: { w: 2, h: 1 },
    introducedDay: 1,
  },
  wire: {
    kind: "wire",
    label: "Wire",
    description: "Ideal conductor with zero resistance. Connects components.",
    category: "interconnect",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 1, dy: 0 },
    ],
    defaultProps: {},
    size: { w: 1, h: 1 },
    introducedDay: 1,
  },
  switch: {
    kind: "switch",
    label: "Switch",
    description: "Toggles between open (no current) and closed (acts as a wire).",
    category: "interconnect",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 2, dy: 0 },
    ],
    defaultProps: { closed: false },
    size: { w: 2, h: 1 },
    introducedDay: 2,
  },
  led: {
    kind: "led",
    label: "LED",
    description: "Light-emitting diode. Conducts only when forward-biased above its threshold (~2 V). Modeled as a small resistor + diode drop.",
    category: "passive",
    unit: "V",
    terminals: [
      { name: "anode", dx: 0, dy: 0 },
      { name: "cathode", dx: 2, dy: 0 },
    ],
    defaultProps: { forwardVoltage: 2, seriesResistance: 50 },
    size: { w: 2, h: 1 },
    introducedDay: 2,
  },
  capacitor: {
    kind: "capacitor",
    label: "Capacitor",
    description: "Stores energy in an electric field. In DC steady-state, acts as an OPEN circuit (no current).",
    category: "passive",
    unit: "F",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 2, dy: 0 },
    ],
    defaultProps: { capacitance: 1e-6 },
    size: { w: 2, h: 1 },
    introducedDay: 5,
  },
  inductor: {
    kind: "inductor",
    label: "Inductor",
    description: "Stores energy in a magnetic field. In DC steady-state, acts as a SHORT circuit (zero resistance).",
    category: "passive",
    unit: "H",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 2, dy: 0 },
    ],
    defaultProps: { inductance: 1e-3 },
    size: { w: 2, h: 1 },
    introducedDay: 6,
  },
  npn_transistor: {
    kind: "npn_transistor",
    label: "NPN Transistor",
    description: "Three-terminal active device. Acts as a current-controlled switch — small base current enables larger collector→emitter current.",
    category: "active",
    terminals: [
      { name: "collector", dx: 1, dy: 0 },
      { name: "base", dx: 0, dy: 1 },
      { name: "emitter", dx: 1, dy: 2 },
    ],
    defaultProps: { beta: 100, vbe: 0.7 },
    size: { w: 2, h: 2 },
    introducedDay: 7,
  },
  pnp_transistor: {
    kind: "pnp_transistor",
    label: "PNP Transistor",
    description: "Three-terminal active device. Mirror of NPN — base current sinks, emitter→collector current flows when biased.",
    category: "active",
    terminals: [
      { name: "emitter", dx: 1, dy: 0 },
      { name: "base", dx: 0, dy: 1 },
      { name: "collector", dx: 1, dy: 2 },
    ],
    defaultProps: { beta: 100, veb: 0.7 },
    size: { w: 2, h: 2 },
    introducedDay: 8,
  },
  and_gate: {
    kind: "and_gate",
    label: "AND Gate",
    description: "Digital logic gate. Output HIGH only when BOTH inputs are HIGH.",
    category: "digital",
    terminals: [
      { name: "in_a", dx: 0, dy: 0 },
      { name: "in_b", dx: 0, dy: 2 },
      { name: "out", dx: 3, dy: 1 },
    ],
    defaultProps: { vHigh: 5, vLow: 0 },
    size: { w: 3, h: 2 },
    introducedDay: 9,
  },
  or_gate: {
    kind: "or_gate",
    label: "OR Gate",
    description: "Digital logic gate. Output HIGH when EITHER input is HIGH.",
    category: "digital",
    terminals: [
      { name: "in_a", dx: 0, dy: 0 },
      { name: "in_b", dx: 0, dy: 2 },
      { name: "out", dx: 3, dy: 1 },
    ],
    defaultProps: { vHigh: 5, vLow: 0 },
    size: { w: 3, h: 2 },
    introducedDay: 9,
  },
  not_gate: {
    kind: "not_gate",
    label: "NOT Gate (Inverter)",
    description: "Digital logic gate. Output is the inverse of the input.",
    category: "digital",
    terminals: [
      { name: "in", dx: 0, dy: 1 },
      { name: "out", dx: 3, dy: 1 },
    ],
    defaultProps: { vHigh: 5, vLow: 0 },
    size: { w: 3, h: 2 },
    introducedDay: 9,
  },
};

export const COMPONENT_KINDS: ComponentKind[] = Object.keys(COMPONENT_DEFS) as ComponentKind[];

/**
 * Compile a placed-component instance into one or more solver elements.
 * Returns null for components that have no DC-steady-state contribution
 * (e.g. open capacitor — caller treats this as a disconnection).
 */
export interface PlacedComponent {
  id: string;
  kind: ComponentKind;
  /** Mapping from terminal name to circuit node id. */
  terminalNodes: Record<string, number>;
  props: Record<string, number | boolean | string>;
}

export function placedToSolverElements(comp: PlacedComponent): CircuitElement[] {
  const { id, kind, terminalNodes, props } = comp;
  switch (kind) {
    case "battery": {
      const v = Number(props.voltage ?? 9);
      return [{ id, kind: "vsource", nodes: [terminalNodes.pos, terminalNodes.neg], voltage: v }];
    }
    case "resistor": {
      const r = Number(props.resistance ?? 1000);
      return [{ id, kind: "resistor", nodes: [terminalNodes.a, terminalNodes.b], resistance: r }];
    }
    case "wire":
      // Wires are handled by the canvas via node-merging (zero-resistance edges).
      // If we receive one here, model it as a tiny resistor.
      return [{ id, kind: "resistor", nodes: [terminalNodes.a, terminalNodes.b], resistance: 1e-6 }];
    case "switch": {
      const closed = Boolean(props.closed);
      if (!closed) return [];
      return [{ id, kind: "resistor", nodes: [terminalNodes.a, terminalNodes.b], resistance: 1e-6 }];
    }
    case "led": {
      // Simplified DC model: forward-bias voltage drop + small series resistance.
      // For accurate v1 behavior, callers should check that V_anode - V_cathode > forwardVoltage
      // after solving, and visually indicate "lit" when above threshold.
      const rs = Number(props.seriesResistance ?? 50);
      return [{ id, kind: "resistor", nodes: [terminalNodes.anode, terminalNodes.cathode], resistance: rs }];
    }
    case "capacitor":
      // Open circuit in DC steady-state → contribute nothing.
      return [];
    case "inductor":
      // Short circuit in DC steady-state → tiny resistor.
      return [{ id, kind: "resistor", nodes: [terminalNodes.a, terminalNodes.b], resistance: 1e-6 }];
    case "npn_transistor":
    case "pnp_transistor":
    case "and_gate":
    case "or_gate":
    case "not_gate":
      // Phase B/C: nonlinear/digital models. Returning [] for v1 — handled by digital
      // simulation pass outside MNA.
      return [];
  }
}

/** LED is "lit" when forward voltage drop exceeds threshold. */
export function ledIsLit(
  anodeV: number,
  cathodeV: number,
  forwardVoltage: number,
): boolean {
  return anodeV - cathodeV > forwardVoltage;
}
