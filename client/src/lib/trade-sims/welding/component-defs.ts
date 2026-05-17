/**
 * Component library for the Welding trade sim.
 *
 * 12 components: consumables (4), gas (1), base material (1), joint geometry
 * (3), bead/symbol (2), position (1). Each has default props that map into the
 * heat-input + WPS evaluator via `placedToEvaluator()`.
 */

import type {
  WeldingProcess,
  JointType,
  WeldingPosition,
  WpsEvalInput,
} from "./heat-input-evaluator";

export type WeldingComponentKind =
  | "smaw_electrode"
  | "gmaw_wire_spool"
  | "fcaw_wire"
  | "tig_tungsten"
  | "shielding_gas"
  | "base_metal_plate"
  | "joint_tile"
  | "backing_strip"
  | "fillet_bead"
  | "groove_bead"
  | "weld_symbol"
  | "position_tile";

export interface WeldingTerminal {
  name: string;
  dx: number;
  dy: number;
}

export interface WeldingComponentDef {
  kind: WeldingComponentKind;
  label: string;
  description: string;
  category: "consumable" | "gas" | "material" | "geometry" | "bead" | "symbol" | "position";
  unit?: string;
  terminals: WeldingTerminal[];
  defaultProps: Record<string, number | boolean | string>;
  size: { w: number; h: number };
  introducedDay: number;
}

export const WELDING_COMPONENT_DEFS: Record<WeldingComponentKind, WeldingComponentDef> = {
  smaw_electrode: {
    kind: "smaw_electrode",
    label: "SMAW Stick Electrode",
    description: "Coated 'stick' electrode — flux coating provides shielding as it burns. Common: E7018 for structural, E6010 for root passes.",
    category: "consumable",
    unit: "in",
    terminals: [{ name: "tip", dx: 0, dy: 0 }],
    defaultProps: { diameterMm: 3.2, classification: "E7018", ampsLow: 90, ampsHigh: 165 },
    size: { w: 1, h: 2 },
    introducedDay: 4,
  },
  gmaw_wire_spool: {
    kind: "gmaw_wire_spool",
    label: "GMAW (MIG) Wire Spool",
    description: "Solid wire fed continuously. Requires external shielding gas (usually 75% Ar / 25% CO₂ for mild steel).",
    category: "consumable",
    unit: "in",
    terminals: [{ name: "feed", dx: 0, dy: 0 }],
    defaultProps: { diameterMm: 0.9, classification: "ER70S-6", wireSpeedMPerMin: 6.0 },
    size: { w: 2, h: 2 },
    introducedDay: 5,
  },
  fcaw_wire: {
    kind: "fcaw_wire",
    label: "FCAW Flux-Cored Wire",
    description: "Tubular wire with internal flux. Self-shielded (FCAW-S) or gas-shielded (FCAW-G). Higher deposition than solid wire.",
    category: "consumable",
    unit: "in",
    terminals: [{ name: "feed", dx: 0, dy: 0 }],
    defaultProps: { diameterMm: 1.2, classification: "E71T-1C", selfShielded: false },
    size: { w: 2, h: 2 },
    introducedDay: 6,
  },
  tig_tungsten: {
    kind: "tig_tungsten",
    label: "TIG Tungsten Electrode",
    description: "Non-consumable tungsten tip. Filler is added separately by hand. Slow but clean — used for thin material and stainless.",
    category: "consumable",
    terminals: [{ name: "tip", dx: 0, dy: 0 }],
    defaultProps: { diameterMm: 2.4, type: "2% lanthanated", polarity: "DCEN" },
    size: { w: 1, h: 2 },
    introducedDay: 7,
  },
  shielding_gas: {
    kind: "shielding_gas",
    label: "Shielding Gas Tank",
    description: "Pure Ar (TIG aluminum), Ar/CO₂ (GMAW steel), pure CO₂ (FCAW). Flow rate typically 12-20 L/min.",
    category: "gas",
    unit: "L/min",
    terminals: [{ name: "out", dx: 1, dy: 0 }],
    defaultProps: { mixture: "Ar75-CO225", flowLPerMin: 15 },
    size: { w: 1, h: 3 },
    introducedDay: 5,
  },
  base_metal_plate: {
    kind: "base_metal_plate",
    label: "Base Metal Plate",
    description: "The work being welded. Carbon steel A36, stainless 304/316, aluminum 6061 are the common sim defaults.",
    category: "material",
    unit: "mm",
    terminals: [
      { name: "edge_a", dx: 0, dy: 1 },
      { name: "edge_b", dx: 4, dy: 1 },
    ],
    defaultProps: { material: "A36", thicknessMm: 6, lengthMm: 200 },
    size: { w: 4, h: 2 },
    introducedDay: 3,
  },
  joint_tile: {
    kind: "joint_tile",
    label: "Joint Type",
    description: "The geometry of how two pieces meet: butt, lap, tee, corner, edge, or groove. Determines which weld type is appropriate.",
    category: "geometry",
    terminals: [],
    defaultProps: { jointType: "butt" },
    size: { w: 2, h: 1 },
    introducedDay: 8,
  },
  backing_strip: {
    kind: "backing_strip",
    label: "Backing Strip",
    description: "Strip of base metal placed behind a groove weld root to support the molten puddle. Allows full penetration without burnthrough on thin material.",
    category: "geometry",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 3, dy: 0 },
    ],
    defaultProps: { thicknessMm: 6 },
    size: { w: 3, h: 1 },
    introducedDay: 10,
  },
  fillet_bead: {
    kind: "fillet_bead",
    label: "Fillet Weld Bead",
    description: "Triangular cross-section bead joining two pieces at ~90°. Leg size is the side length of the triangle.",
    category: "bead",
    unit: "mm",
    terminals: [
      { name: "start", dx: 0, dy: 0 },
      { name: "end", dx: 4, dy: 0 },
    ],
    defaultProps: { legMm: 5, lengthMm: 100 },
    size: { w: 4, h: 1 },
    introducedDay: 9,
  },
  groove_bead: {
    kind: "groove_bead",
    label: "Groove Weld Bead",
    description: "Weld that fills a prepared groove between two pieces. Single-pass on thin, multi-pass on thicker material.",
    category: "bead",
    unit: "mm",
    terminals: [
      { name: "start", dx: 0, dy: 0 },
      { name: "end", dx: 4, dy: 0 },
    ],
    defaultProps: { grooveAngleDeg: 60, rootGapMm: 2, passes: 1 },
    size: { w: 4, h: 1 },
    introducedDay: 10,
  },
  weld_symbol: {
    kind: "weld_symbol",
    label: "Weld Symbol",
    description: "Standardized AWS A2.4 drawing symbol that tells the welder process, joint, size, length, and other-side requirements at a glance.",
    category: "symbol",
    terminals: [],
    defaultProps: { tailNote: "GMAW", size: 5, length: 100, otherSide: false },
    size: { w: 2, h: 2 },
    introducedDay: 8,
  },
  position_tile: {
    kind: "position_tile",
    label: "Weld Position",
    description: "1F/2F/3F/4F for fillet, 1G/2G/3G/4G/5G/6G for groove. Numbers increase with difficulty — overhead and pipe are hardest.",
    category: "position",
    terminals: [],
    defaultProps: { position: "1F" },
    size: { w: 1, h: 1 },
    introducedDay: 11,
  },
};

export const WELDING_COMPONENT_KINDS: WeldingComponentKind[] =
  Object.keys(WELDING_COMPONENT_DEFS) as WeldingComponentKind[];

export interface PlacedWeldingComponent {
  id: string;
  kind: WeldingComponentKind;
  props: Record<string, number | boolean | string>;
}

/**
 * Translate a placed-component graph from a lesson canvas into the evaluator's
 * input shape. Returns null when the graph doesn't have enough information to
 * evaluate (e.g., no consumable or no base metal present).
 *
 * Required components on the canvas:
 *   - Exactly one consumable (smaw_electrode / gmaw_wire_spool / fcaw_wire / tig_tungsten)
 *   - Exactly one base_metal_plate
 *   - One joint_tile (defaults to "butt" if absent)
 *   - Optional shielding_gas, position_tile, fillet_bead (for leg sizing)
 *
 * Voltage/amperage/travel speed come from the consumable's parameter props
 * (which the inspector lets the learner edit during the lesson).
 */
export function placedToEvaluator(
  placed: PlacedWeldingComponent[],
  runtime: {
    volts: number;
    amps: number;
    travelSpeedMmPerSec: number;
  },
): WpsEvalInput | { error: string } {
  const consumable = placed.find(
    (c) =>
      c.kind === "smaw_electrode" ||
      c.kind === "gmaw_wire_spool" ||
      c.kind === "fcaw_wire" ||
      c.kind === "tig_tungsten",
  );
  if (!consumable) return { error: "Place a consumable (stick electrode, MIG/FCAW wire, or TIG tungsten) first." };

  const base = placed.find((c) => c.kind === "base_metal_plate");
  if (!base) return { error: "Place a base-metal plate on the canvas." };

  const process: WeldingProcess =
    consumable.kind === "smaw_electrode"
      ? "SMAW"
      : consumable.kind === "gmaw_wire_spool"
      ? "GMAW"
      : consumable.kind === "fcaw_wire"
      ? "FCAW"
      : "GTAW";

  const jointTile = placed.find((c) => c.kind === "joint_tile");
  const jointType = ((jointTile?.props.jointType as JointType) ?? "butt") as JointType;

  const gas = placed.find((c) => c.kind === "shielding_gas");
  const gasFlow = gas ? Number(gas.props.flowLPerMin ?? 0) : 0;

  const positionTile = placed.find((c) => c.kind === "position_tile");
  const position = ((positionTile?.props.position as WeldingPosition) ?? "1F") as WeldingPosition;

  const fillet = placed.find((c) => c.kind === "fillet_bead");
  const targetFilletLegMm = fillet ? Number(fillet.props.legMm ?? 0) : undefined;

  return {
    process,
    parameters: {
      volts: runtime.volts,
      amps: runtime.amps,
      travelSpeedMmPerSec: runtime.travelSpeedMmPerSec,
      shieldingGasFlowLPerMin: gasFlow > 0 ? gasFlow : undefined,
    },
    jointType,
    baseMetalMm: Number(base.props.thicknessMm ?? 6),
    position,
    targetFilletLegMm,
  };
}
