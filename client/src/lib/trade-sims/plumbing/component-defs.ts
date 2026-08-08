/**
 * Component library for the Plumbing trade sim.
 *
 * Each component has:
 *   - kind: stable identifier
 *   - label, description, category
 *   - terminals: named connection points (relative to component origin)
 *   - defaultProps: editable values shown in the inspector
 *   - introducedDay: which day-lesson first uses the component
 *
 * `placedToSolverElements()` maps a placed component into Pipe / Junction
 * inputs for the Hardy-Cross flow solver. Fixtures (sink, toilet, shower)
 * become junctions with a fixed demand. Tanks/reservoirs become junctions
 * with fixed head. Pipes/elbows/tees/reducers are plain pipes. Valves attach
 * to a pipe and either close it or add restriction K. Pumps add pumpHead
 * to a pipe.
 */

import type { Pipe, Junction } from "./flow-solver";

export type PlumbingComponentKind =
  | "pipe"
  | "tee"
  | "elbow"
  | "reducer"
  | "gate_valve"
  | "ball_valve"
  | "check_valve"
  | "pump"
  | "tank"
  | "sink_fixture"
  | "toilet_fixture"
  | "shower_fixture";

export interface Terminal {
  name: string;
  /** Local x offset in grid units. */
  dx: number;
  /** Local y offset in grid units. */
  dy: number;
}

export interface PlumbingComponentDef {
  kind: PlumbingComponentKind;
  label: string;
  description: string;
  category: "supply" | "fitting" | "valve" | "pump" | "fixture" | "source";
  unit?: string;
  spriteKey: string;
  terminals: Terminal[];
  defaultProps: Record<string, number | boolean | string>;
  size: { w: number; h: number };
  introducedDay: number;
}

/**
 * Default flow rates (m^3/s) for fixtures, sized from Uniform Plumbing Code
 * fixture-unit guidance converted to SI. These are starting points the
 * learner can adjust in the inspector.
 *
 *   sink:    0.5 gpm  ≈ 3.15e-5 m^3/s
 *   toilet:  1.6 gpf at ~0.5 gpm avg  ≈ 3.15e-5 m^3/s during flush
 *   shower:  2.0 gpm  ≈ 1.26e-4 m^3/s
 */

export const PLUMBING_COMPONENT_DEFS: Record<PlumbingComponentKind, PlumbingComponentDef> = {
  pipe: {
    kind: "pipe",
    label: "Pipe",
    description: "Straight run of pipe. Length and diameter determine friction loss (Darcy-Weisbach).",
    category: "supply",
    unit: "m",
    spriteKey: "plumbing/pipe",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 4, dy: 0 },
    ],
    defaultProps: { length: 3.0, diameter: 0.019, frictionFactor: 0.022 }, // 3/4" copper
    size: { w: 4, h: 1 },
    introducedDay: 1,
  },
  tee: {
    kind: "tee",
    label: "Tee Fitting",
    description: "Three-way fitting. One pipe in, two pipes out (or vice versa). Branches a supply line.",
    category: "fitting",
    spriteKey: "plumbing/tee",
    terminals: [
      { name: "run_a", dx: 0, dy: 1 },
      { name: "run_b", dx: 2, dy: 1 },
      { name: "branch", dx: 1, dy: 0 },
    ],
    defaultProps: {},
    size: { w: 2, h: 2 },
    introducedDay: 4,
  },
  elbow: {
    kind: "elbow",
    label: "Elbow (90°)",
    description: "Bends pipe 90°. Adds a small head loss in real installs; modeled as zero-loss for v1.",
    category: "fitting",
    spriteKey: "plumbing/elbow",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 1, dy: 1 },
    ],
    defaultProps: {},
    size: { w: 2, h: 2 },
    introducedDay: 4,
  },
  reducer: {
    kind: "reducer",
    label: "Reducer",
    description: "Steps pipe diameter up or down. Use when supply lines split into smaller branch lines.",
    category: "fitting",
    spriteKey: "plumbing/reducer",
    terminals: [
      { name: "large", dx: 0, dy: 0 },
      { name: "small", dx: 2, dy: 0 },
    ],
    defaultProps: { largeDiameter: 0.025, smallDiameter: 0.019 },
    size: { w: 2, h: 1 },
    introducedDay: 4,
  },
  gate_valve: {
    kind: "gate_valve",
    label: "Gate Valve",
    description: "Full-open / full-close isolation valve. Used to shut down a branch for service.",
    category: "valve",
    spriteKey: "plumbing/gate-valve",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 2, dy: 0 },
    ],
    defaultProps: { closed: false },
    size: { w: 2, h: 1 },
    introducedDay: 2,
  },
  ball_valve: {
    kind: "ball_valve",
    label: "Ball Valve",
    description: "Quarter-turn isolation valve. Faster to operate than a gate valve; popular for shutoffs.",
    category: "valve",
    spriteKey: "plumbing/ball-valve",
    terminals: [
      { name: "a", dx: 0, dy: 0 },
      { name: "b", dx: 2, dy: 0 },
    ],
    defaultProps: { closed: false },
    size: { w: 2, h: 1 },
    introducedDay: 2,
  },
  check_valve: {
    kind: "check_valve",
    label: "Check Valve",
    description: "One-way valve. Prevents backflow. Required at every cross-connection between potable and non-potable.",
    category: "valve",
    spriteKey: "plumbing/check-valve",
    terminals: [
      { name: "in", dx: 0, dy: 0 },
      { name: "out", dx: 2, dy: 0 },
    ],
    defaultProps: {},
    size: { w: 2, h: 1 },
    introducedDay: 6,
  },
  pump: {
    kind: "pump",
    label: "Pump",
    description: "Adds pressure head in the inlet->outlet direction. Used for booster systems, well pumps, and circulators.",
    category: "pump",
    unit: "m",
    spriteKey: "plumbing/pump",
    terminals: [
      { name: "in", dx: 0, dy: 0 },
      { name: "out", dx: 2, dy: 0 },
    ],
    defaultProps: { pumpHead: 30 }, // ~43 psi boost
    size: { w: 2, h: 1 },
    introducedDay: 9,
  },
  tank: {
    kind: "tank",
    label: "Tank / Reservoir",
    description: "Fixed-head supply (water main, storage tank, or street pressure). Sets a pressure boundary.",
    category: "source",
    unit: "m",
    spriteKey: "plumbing/tank",
    terminals: [{ name: "out", dx: 1, dy: 1 }],
    defaultProps: { head: 40 }, // ~57 psi typical residential street pressure
    size: { w: 2, h: 2 },
    introducedDay: 1,
  },
  sink_fixture: {
    kind: "sink_fixture",
    label: "Sink Fixture",
    description: "Lavatory/kitchen sink. Withdraws ~0.5 gpm when in use.",
    category: "fixture",
    unit: "m^3/s",
    spriteKey: "plumbing/sink",
    terminals: [{ name: "supply", dx: 0, dy: 0 }],
    defaultProps: { demand: 3.15e-5, active: true },
    size: { w: 2, h: 2 },
    introducedDay: 3,
  },
  toilet_fixture: {
    kind: "toilet_fixture",
    label: "Toilet Fixture",
    description: "Toilet supply line. Models tank refill demand at ~0.5 gpm average.",
    category: "fixture",
    unit: "m^3/s",
    spriteKey: "plumbing/toilet",
    terminals: [{ name: "supply", dx: 0, dy: 0 }],
    defaultProps: { demand: 3.15e-5, active: true },
    size: { w: 2, h: 2 },
    introducedDay: 3,
  },
  shower_fixture: {
    kind: "shower_fixture",
    label: "Shower Fixture",
    description: "Showerhead. Withdraws ~2.0 gpm when in use — the heaviest residential fixture.",
    category: "fixture",
    unit: "m^3/s",
    spriteKey: "plumbing/shower",
    terminals: [{ name: "supply", dx: 0, dy: 0 }],
    defaultProps: { demand: 1.26e-4, active: true },
    size: { w: 2, h: 2 },
    introducedDay: 3,
  },
};

/* ────────────────────────────────────────────────────────────────────────────
 * Real-world unit helpers (Task: inches/feet/psi at the UI boundary).
 * The solver stays SI (meters, m of head, m^3/s). All conversion happens in
 * the property editors — these tables/constants are the single source of truth.
 * ──────────────────────────────────────────────────────────────────────────── */

export const IN_TO_M = 0.0254;
export const FT_TO_M = 1 / 3.28084; // 1 ft = 0.3048 m
export const PSI_TO_M_HEAD = 1 / 1.42233; // 1 psi ≈ 0.7031 m of water head

export type PipeSchedule = "40" | "80";

export interface NominalPipeSize {
  /** Display label, e.g. `3/4"` */
  label: string;
  /** Nominal size in inches (for sorting/reference). */
  nominalIn: number;
  /** Actual inner diameter (inches) per schedule — steel/PVC Sch 40 & 80. */
  innerIn: Record<PipeSchedule, number>;
}

/** Standard nominal sizes with Schedule 40 / 80 inner diameters (inches). */
export const NOMINAL_PIPE_SIZES: NominalPipeSize[] = [
  { label: `1/2"`, nominalIn: 0.5, innerIn: { "40": 0.622, "80": 0.546 } },
  { label: `3/4"`, nominalIn: 0.75, innerIn: { "40": 0.824, "80": 0.742 } },
  { label: `1"`, nominalIn: 1.0, innerIn: { "40": 1.049, "80": 0.957 } },
  { label: `1-1/4"`, nominalIn: 1.25, innerIn: { "40": 1.38, "80": 1.278 } },
  { label: `1-1/2"`, nominalIn: 1.5, innerIn: { "40": 1.61, "80": 1.5 } },
  { label: `2"`, nominalIn: 2.0, innerIn: { "40": 2.067, "80": 1.939 } },
];

/** SI inner diameter (meters) for a nominal size + schedule. */
export function nominalToDiameterM(size: NominalPipeSize, schedule: PipeSchedule): number {
  return size.innerIn[schedule] * IN_TO_M;
}

/**
 * Find the nominal size + schedule whose inner diameter matches an SI value
 * within ~5%, or null if the value is a custom diameter (e.g. legacy 0.019 m
 * seed data, which is a 3/4" copper approximation between Sch 40 and 80).
 */
export function findNominalMatch(
  diameterM: number,
): { size: NominalPipeSize; schedule: PipeSchedule } | null {
  let best: { size: NominalPipeSize; schedule: PipeSchedule; err: number } | null = null;
  for (const size of NOMINAL_PIPE_SIZES) {
    for (const schedule of ["40", "80"] as PipeSchedule[]) {
      const d = nominalToDiameterM(size, schedule);
      const err = Math.abs(d - diameterM) / d;
      if (err < 0.02 && (!best || err < best.err)) best = { size, schedule, err };
    }
  }
  return best ? { size: best.size, schedule: best.schedule } : null;
}

export type HeadUnit = "m" | "ft" | "psi";

export function headFromSI(valueM: number, unit: HeadUnit): number {
  if (unit === "ft") return valueM / FT_TO_M;
  if (unit === "psi") return valueM / PSI_TO_M_HEAD;
  return valueM;
}

export function headToSI(value: number, unit: HeadUnit): number {
  if (unit === "ft") return value * FT_TO_M;
  if (unit === "psi") return value * PSI_TO_M_HEAD;
  return value;
}

/** Props that hold a pipe inner diameter in meters (get the nominal-size dropdown). */
export const DIAMETER_PROP_KEYS = new Set(["diameter", "largeDiameter", "smallDiameter"]);
/** Props that hold a head/pressure in meters of water (get the ft/psi unit picker). */
export const HEAD_PROP_KEYS = new Set(["pumpHead", "head"]);

export const PLUMBING_COMPONENT_KINDS: PlumbingComponentKind[] = Object.keys(
  PLUMBING_COMPONENT_DEFS,
) as PlumbingComponentKind[];

/** A placed-on-canvas instance of a component. */
export interface PlacedPlumbingComponent {
  id: string;
  kind: PlumbingComponentKind;
  /** Maps terminal name -> network node id used by the solver. */
  terminalNodes: Record<string, string>;
  props: Record<string, number | boolean | string>;
}

export interface PlumbingSolverElements {
  pipes: Pipe[];
  junctions: Junction[];
}

/**
 * Compile a list of placed components into the solver's pipe/junction lists.
 *
 * The caller is responsible for wire-merging: terminals that share a wire
 * should already map to the same node id in `terminalNodes`. Junctions are
 * deduplicated by node id; later placements override earlier defaults (for
 * example, a tank's head wins over a sink's demand on the same node — caller
 * should not co-locate those, but we handle it defensively).
 */
export function placedToSolverElements(
  components: PlacedPlumbingComponent[],
): PlumbingSolverElements {
  const pipes: Pipe[] = [];
  const junctionMap = new Map<string, Junction>();

  const ensureJunction = (id: string): Junction => {
    let j = junctionMap.get(id);
    if (!j) {
      j = { id };
      junctionMap.set(id, j);
    }
    return j;
  };

  for (const c of components) {
    const props = c.props ?? {};
    switch (c.kind) {
      case "pipe": {
        pipes.push({
          id: c.id,
          from: c.terminalNodes.a,
          to: c.terminalNodes.b,
          length: Number(props.length ?? 3.0),
          diameter: Number(props.diameter ?? 0.019),
          frictionFactor: Number(props.frictionFactor ?? 0.022),
        });
        ensureJunction(c.terminalNodes.a);
        ensureJunction(c.terminalNodes.b);
        break;
      }
      case "tee": {
        // Tee = a three-way junction. Model as a single shared node by routing
        // all three terminals through `run_a`'s node — caller is responsible
        // for wiring all three terminals to the same node, but if they didn't,
        // we add zero-length connector pipes so the solver sees the topology.
        const a = c.terminalNodes.run_a;
        const b = c.terminalNodes.run_b;
        const br = c.terminalNodes.branch;
        if (a !== b) {
          pipes.push({ id: `${c.id}-ab`, from: a, to: b, length: 0.1, diameter: 0.025, frictionFactor: 0.022 });
        }
        if (a !== br) {
          pipes.push({ id: `${c.id}-abr`, from: a, to: br, length: 0.1, diameter: 0.025, frictionFactor: 0.022 });
        }
        ensureJunction(a);
        ensureJunction(b);
        ensureJunction(br);
        break;
      }
      case "elbow": {
        pipes.push({
          id: c.id,
          from: c.terminalNodes.a,
          to: c.terminalNodes.b,
          length: 0.1,
          diameter: 0.019,
          frictionFactor: 0.025,
        });
        ensureJunction(c.terminalNodes.a);
        ensureJunction(c.terminalNodes.b);
        break;
      }
      case "reducer": {
        // Use the smaller diameter for friction (worst-case head loss).
        pipes.push({
          id: c.id,
          from: c.terminalNodes.large,
          to: c.terminalNodes.small,
          length: 0.2,
          diameter: Number(props.smallDiameter ?? 0.019),
          frictionFactor: 0.025,
        });
        ensureJunction(c.terminalNodes.large);
        ensureJunction(c.terminalNodes.small);
        break;
      }
      case "gate_valve":
      case "ball_valve": {
        pipes.push({
          id: c.id,
          from: c.terminalNodes.a,
          to: c.terminalNodes.b,
          length: 0.1,
          diameter: 0.019,
          frictionFactor: 0.022,
          valveClosed: Boolean(props.closed),
        });
        ensureJunction(c.terminalNodes.a);
        ensureJunction(c.terminalNodes.b);
        break;
      }
      case "check_valve": {
        // True one-way model (Task #41): solver's active-set loop closes the
        // pipe whenever reverse flow is attempted, and reopens it when
        // forward driving head returns. A small valveKAdd represents the
        // mechanical restriction of the check-valve mechanism itself.
        pipes.push({
          id: c.id,
          from: c.terminalNodes.in,
          to: c.terminalNodes.out,
          length: 0.1,
          diameter: 0.019,
          frictionFactor: 0.022,
          valveKAdd: 5,
          oneWay: true,
        });
        ensureJunction(c.terminalNodes.in);
        ensureJunction(c.terminalNodes.out);
        break;
      }
      case "pump": {
        pipes.push({
          id: c.id,
          from: c.terminalNodes.in,
          to: c.terminalNodes.out,
          length: 0.1,
          diameter: 0.025,
          frictionFactor: 0.022,
          pumpHead: Number(props.pumpHead ?? 30),
        });
        ensureJunction(c.terminalNodes.in);
        ensureJunction(c.terminalNodes.out);
        break;
      }
      case "tank": {
        const j = ensureJunction(c.terminalNodes.out);
        j.fixedHead = Number(props.head ?? 40);
        break;
      }
      case "sink_fixture":
      case "toilet_fixture":
      case "shower_fixture": {
        const j = ensureJunction(c.terminalNodes.supply);
        const active = props.active === undefined ? true : Boolean(props.active);
        const d = Number(props.demand ?? 0);
        j.demand = (j.demand ?? 0) + (active ? d : 0);
        break;
      }
    }
  }

  return { pipes, junctions: [...junctionMap.values()] };
}
