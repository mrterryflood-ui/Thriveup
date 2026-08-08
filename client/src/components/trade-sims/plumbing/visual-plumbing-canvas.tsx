/**
 * VisualPlumbingCanvas — SVG-based interactive pipe-network editor
 *
 * Replaces the form-based PlumbingCanvas (typed node labels) with:
 *   - Component placement on a 24-px grid with drag-to-move
 *   - Click-to-wire: click a terminal → click another to connect
 *   - Auto-solve (Hardy-Cross) after every change, 150ms debounce
 *   - Pipe-connection color = live junction head (gray → blue shades)
 *   - Click a connection to select it, then delete it
 *   - Click a component to inspect / edit values inline
 *
 * The solver still receives the exact same node-graph format: connected
 * terminals are merged into a shared string node id via union-find, then
 * compiled with the existing `placedToSolverElements()` — no solver changes.
 *
 * Touch rules (see .agents/memory/svg-canvas-touch-ux.md):
 *   1. Every component <g> has an invisible fill="transparent" body hit-rect
 *      as its FIRST child; terminals carry oversized transparent hit circles.
 *   2. touchAction:"none" on the svg + setPointerCapture(svg) on pointerdown.
 *   3. Wiring mode is NOT cancelled by the bubbled pointerup that started it;
 *      cancel only on empty-canvas click or Escape.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PLUMBING_COMPONENT_DEFS,
  placedToSolverElements,
  type PlumbingComponentKind,
  type PlacedPlumbingComponent,
} from "@/lib/trade-sims/plumbing/component-defs";
import {
  solveFlow,
  pipeHeadLoss,
  type FlowSolveResult,
  type FlowSolveError,
} from "@/lib/trade-sims/plumbing/flow-solver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, Droplets, Info, MoveUpRight } from "lucide-react";
import {
  PipeSizeSelect,
  HeadInput,
  isDiameterProp,
  isHeadProp,
  propLabel,
} from "@/components/trade-sims/plumbing/plumbing-prop-inputs";

// ─── Canvas constants ─────────────────────────────────────────────────────────
const CW = 820;
const CH = 440;
const GRID = 24;
const TERM_R = 9;
const WIRE_W = 3;

const snap = (v: number) => Math.round(v / GRID) * GRID;
const genId = () => `vp_${Math.random().toString(36).slice(2, 8)}`;

// Unit helpers — solver is SI; learners need gpm/psi.
const M3S_TO_GPM = 15850.323;
const M_TO_PSI = 1.42233;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number }

interface VisualComp {
  id: string;
  kind: PlumbingComponentKind;
  x: number;
  y: number;
  props: Record<string, number | boolean>;
}

interface VisualWire {
  id: string;
  fromComp: string;
  fromTerm: string;
  toComp: string;
  toTerm: string;
}

export interface VisualPlumbingCanvasProps {
  initialComponents?: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  onChange?: (s: { components: PlacedPlumbingComponent[]; lastSolve: FlowSolveResult | null }) => void;
  onInteract?: () => void;
  compact?: boolean;
}

// ─── Visual definitions ──────────────────────────────────────────────────────
interface VDef {
  label: string;
  color: string;
  terminals: Record<string, Vec2>;
  draw: (props: Record<string, number | boolean>, extra?: { closed?: boolean }) => JSX.Element;
}

const mono = { fontFamily: "monospace" } as const;

const VDEF: Record<PlumbingComponentKind, VDef> = {
  tank: {
    label: "Tank / Reservoir",
    color: "#0ea5e9",
    terminals: { out: { x: 0, y: 34 } },
    draw: (p) => (
      <g stroke="currentColor" fill="none">
        <rect x="-24" y="-28" width="48" height="44" rx="4" strokeWidth="2" />
        <path d="M-24,-10 Q-12,-16 0,-10 T24,-10" strokeWidth="1.5" stroke="#38bdf8" />
        <rect x="-24" y="-10" width="48" height="26" fill="#38bdf8" opacity="0.2" stroke="none" rx="2" />
        <line x1="0" y1="16" x2="0" y2="34" strokeWidth="2" />
        <text x="0" y="-34" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none" style={mono}>
          {Number(p.head ?? 40).toFixed(0)}m head
        </text>
      </g>
    ),
  },
  pipe: {
    label: "Pipe",
    color: "#64748b",
    terminals: { a: { x: -48, y: 0 }, b: { x: 48, y: 0 } },
    draw: (p) => (
      <g stroke="currentColor" fill="none">
        <line x1="-48" y1="0" x2="-40" y2="0" strokeWidth="2" />
        <rect x="-40" y="-6" width="80" height="12" strokeWidth="2" rx="2" />
        <line x1="40" y1="0" x2="48" y2="0" strokeWidth="2" />
        <text x="0" y="24" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none" style={mono}>
          {Number(p.length ?? 3).toFixed(1)}m · ⌀{(Number(p.diameter ?? 0.019) * 1000).toFixed(0)}mm
        </text>
      </g>
    ),
  },
  tee: {
    label: "Tee",
    color: "#64748b",
    terminals: { run_a: { x: -36, y: 0 }, run_b: { x: 36, y: 0 }, branch: { x: 0, y: -32 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <line x1="-36" y1="0" x2="36" y2="0" strokeWidth="6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="0" y2="-32" strokeWidth="6" strokeLinecap="round" />
        <text x="0" y="20" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">TEE</text>
      </g>
    ),
  },
  elbow: {
    label: "Elbow 90°",
    color: "#64748b",
    terminals: { a: { x: -32, y: 0 }, b: { x: 0, y: -32 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <path d="M-32,0 L-4,0 Q0,0 0,-4 L0,-32" strokeWidth="6" strokeLinecap="round" />
        <text x="6" y="16" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">90°</text>
      </g>
    ),
  },
  reducer: {
    label: "Reducer",
    color: "#64748b",
    terminals: { large: { x: -36, y: 0 }, small: { x: 36, y: 0 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <line x1="-36" y1="0" x2="-24" y2="0" strokeWidth="2" />
        <polygon points="-24,-10 -24,10 24,5 24,-5" strokeWidth="2" />
        <line x1="24" y1="0" x2="36" y2="0" strokeWidth="2" />
        <text x="0" y="24" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">REDUCER</text>
      </g>
    ),
  },
  gate_valve: {
    label: "Gate Valve",
    color: "#f59e0b",
    terminals: { a: { x: -36, y: 0 }, b: { x: 36, y: 0 } },
    draw: (p) => {
      const closed = Boolean(p.closed);
      return (
        <g stroke="currentColor" fill="none">
          <line x1="-36" y1="0" x2="-14" y2="0" strokeWidth="2" />
          <polygon points="-14,-10 -14,10 14,-10 14,10" strokeWidth="2"
            fill={closed ? "currentColor" : "none"} />
          <line x1="0" y1="0" x2="0" y2="-14" strokeWidth="2" />
          <line x1="-7" y1="-14" x2="7" y2="-14" strokeWidth="2" />
          <line x1="14" y1="0" x2="36" y2="0" strokeWidth="2" />
          <text x="0" y="24" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
            {closed ? "CLOSED" : "OPEN"}
          </text>
        </g>
      );
    },
  },
  ball_valve: {
    label: "Ball Valve",
    color: "#f59e0b",
    terminals: { a: { x: -36, y: 0 }, b: { x: 36, y: 0 } },
    draw: (p) => {
      const closed = Boolean(p.closed);
      return (
        <g stroke="currentColor" fill="none">
          <line x1="-36" y1="0" x2="-12" y2="0" strokeWidth="2" />
          <circle cx="0" cy="0" r="12" strokeWidth="2" />
          <line x1={closed ? 0 : -8} y1={closed ? -8 : 0} x2={closed ? 0 : 8} y2={closed ? 8 : 0} strokeWidth="3" />
          <line x1="12" y1="0" x2="36" y2="0" strokeWidth="2" />
          <text x="0" y="26" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
            {closed ? "CLOSED" : "OPEN"}
          </text>
        </g>
      );
    },
  },
  check_valve: {
    label: "Check Valve",
    color: "#ef4444",
    terminals: { in: { x: -36, y: 0 }, out: { x: 36, y: 0 } },
    draw: (_p, extra) => {
      const closed = Boolean(extra?.closed);
      return (
        <g stroke="currentColor" fill="none">
          <line x1="-36" y1="0" x2="-16" y2="0" strokeWidth="2" />
          <polygon points="-16,-11 -16,11 12,0" strokeWidth="2"
            fill={closed ? "#ef4444" : "none"} />
          <line x1="12" y1="-11" x2="12" y2="11" strokeWidth="2.5" />
          <line x1="12" y1="0" x2="36" y2="0" strokeWidth="2" />
          <text x="0" y="24" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
            {closed ? "🛑 CLOSED" : "in → out"}
          </text>
        </g>
      );
    },
  },
  pump: {
    label: "Pump",
    color: "#8b5cf6",
    terminals: { in: { x: -36, y: 0 }, out: { x: 36, y: 0 } },
    draw: (p) => (
      <g stroke="currentColor" fill="none">
        <line x1="-36" y1="0" x2="-16" y2="0" strokeWidth="2" />
        <circle cx="0" cy="0" r="16" strokeWidth="2" />
        <polygon points="-6,-8 -6,8 10,0" fill="currentColor" />
        <line x1="16" y1="0" x2="36" y2="0" strokeWidth="2" />
        <text x="0" y="30" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none" style={mono}>
          +{Number(p.pumpHead ?? 30).toFixed(0)}m
        </text>
      </g>
    ),
  },
  sink_fixture: {
    label: "Sink",
    color: "#10b981",
    terminals: { supply: { x: 0, y: 28 } },
    draw: (p) => (
      <g stroke="currentColor" fill="none">
        <path d="M-20,-14 L20,-14 L14,4 L-14,4 Z" strokeWidth="2" />
        <path d="M-10,-14 L-10,-24 Q-10,-28 -4,-28 L4,-28" strokeWidth="2" />
        <line x1="0" y1="4" x2="0" y2="28" strokeWidth="2" />
        <text x="0" y="-34" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
          SINK{p.active === false ? " (off)" : ""}
        </text>
      </g>
    ),
  },
  toilet_fixture: {
    label: "Toilet",
    color: "#10b981",
    terminals: { supply: { x: 0, y: 28 } },
    draw: (p) => (
      <g stroke="currentColor" fill="none">
        <rect x="-16" y="-26" width="32" height="14" rx="2" strokeWidth="2" />
        <ellipse cx="0" cy="-2" rx="14" ry="9" strokeWidth="2" />
        <line x1="0" y1="7" x2="0" y2="28" strokeWidth="2" />
        <text x="0" y="-32" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
          TOILET{p.active === false ? " (off)" : ""}
        </text>
      </g>
    ),
  },
  shower_fixture: {
    label: "Shower",
    color: "#10b981",
    terminals: { supply: { x: 0, y: 28 } },
    draw: (p) => (
      <g stroke="currentColor" fill="none">
        <path d="M-14,-24 L0,-24 L0,-14" strokeWidth="2" />
        <path d="M-10,-14 L10,-14 L6,-6 L-6,-6 Z" strokeWidth="2" />
        <line x1="-6" y1="-2" x2="-8" y2="6" strokeWidth="1.5" />
        <line x1="0" y1="-2" x2="0" y2="6" strokeWidth="1.5" />
        <line x1="6" y1="-2" x2="8" y2="6" strokeWidth="1.5" />
        <line x1="0" y1="10" x2="0" y2="28" strokeWidth="2" />
        <text x="0" y="-30" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
          SHOWER{p.active === false ? " (off)" : ""}
        </text>
      </g>
    ),
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTermPos(comp: VisualComp, term: string): Vec2 {
  const off = VDEF[comp.kind]?.terminals[term] ?? { x: 0, y: 0 };
  return { x: comp.x + off.x, y: comp.y + off.y };
}

function wirePath(p1: Vec2, p2: Vec2): string {
  const mx = Math.round(((p1.x + p2.x) / 2) / GRID) * GRID;
  if (Math.abs(p1.y - p2.y) < 2) return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  return `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`;
}

/**
 * Union-Find node assignment from visual connections. Every terminal gets a
 * string node id; connected terminals share the id of their set root. This
 * is exactly the "same label = same junction" contract the solver expects,
 * so `placedToSolverElements()` runs unchanged.
 */
function computeNodeMap(comps: VisualComp[], wires: VisualWire[]): Map<string, string> {
  const parent = new Map<string, string>();
  for (const c of comps) {
    for (const t of Object.keys(VDEF[c.kind]?.terminals ?? {})) {
      const k = `${c.id}:${t}`;
      parent.set(k, k);
    }
  }
  function find(k: string): string {
    if (!parent.has(k)) return k;
    let r = parent.get(k)!;
    if (r !== k) { r = find(r); parent.set(k, r); }
    return r;
  }
  for (const w of wires) {
    const ra = find(`${w.fromComp}:${w.fromTerm}`);
    const rb = find(`${w.toComp}:${w.toTerm}`);
    if (ra !== rb) parent.set(ra, rb);
  }
  const out = new Map<string, string>();
  for (const k of parent.keys()) {
    // Node id derived from the set root — stable string, safe for solver.
    out.set(k, `j_${find(k).replace(":", "_")}`);
  }
  return out;
}

function toPlaced(comps: VisualComp[], nodeMap: Map<string, string>): PlacedPlumbingComponent[] {
  return comps.map((c) => ({
    id: c.id,
    kind: c.kind,
    terminalNodes: Object.fromEntries(
      Object.keys(VDEF[c.kind]?.terminals ?? {}).map((t) => [
        t,
        nodeMap.get(`${c.id}:${t}`) ?? `j_${c.id}_${t}`,
      ]),
    ),
    props: c.props,
  }));
}

function runSolve(placed: PlacedPlumbingComponent[]): {
  result: FlowSolveResult | null;
  error: string | null;
} {
  if (placed.length === 0) return { result: null, error: null };
  const { pipes, junctions } = placedToSolverElements(placed);
  const out: FlowSolveResult | FlowSolveError = solveFlow({ pipes, junctions });
  if (!out.ok) return { result: null, error: out.error };
  return { result: out, error: null };
}

function headColor(h: number, maxH: number): string {
  if (!isFinite(h) || maxH < 0.01 || h < 0.01) return "#94a3b8";
  const t = Math.min(1, h / maxH);
  if (t < 0.35) return "#22d3ee";
  if (t < 0.7) return "#3b82f6";
  return "#1d4ed8";
}

function toSVGCoords(e: { clientX: number; clientY: number }, svgEl: SVGSVGElement): Vec2 {
  const r = svgEl.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * CW,
    y: ((e.clientY - r.top) / r.height) * CH,
  };
}

function nearestTerminal(
  pos: Vec2,
  comps: VisualComp[],
  excludeComp?: string,
): { compId: string; term: string; pos: Vec2 } | null {
  let best: { compId: string; term: string; pos: Vec2; dist: number } | null = null;
  for (const c of comps) {
    if (c.id === excludeComp) continue;
    for (const [t, off] of Object.entries(VDEF[c.kind]?.terminals ?? {})) {
      const tp = { x: c.x + off.x, y: c.y + off.y };
      const dist = Math.hypot(pos.x - tp.x, pos.y - tp.y);
      if (dist <= TERM_R * 2.2 && (!best || dist < best.dist)) {
        best = { compId: c.id, term: t, pos: tp, dist };
      }
    }
  }
  return best ? { compId: best.compId, term: best.term, pos: best.pos } : null;
}

function defaultPlacement(n: number): Vec2[] {
  if (n === 0) return [];
  if (n === 1) return [{ x: snap(400), y: snap(200) }];
  if (n === 2) return [{ x: snap(200), y: snap(200) }, { x: snap(570), y: snap(200) }];
  if (n === 3) return [
    { x: snap(170), y: snap(200) }, { x: snap(400), y: snap(200) }, { x: snap(630), y: snap(200) },
  ];
  return Array.from({ length: n }, (_, i) => ({
    x: snap(140 + (i % 3) * 210),
    y: snap(140 + Math.floor(i / 3) * 170),
  }));
}

const PALETTE_GROUPS: { label: string; kinds: PlumbingComponentKind[] }[] = [
  { label: "Source", kinds: ["tank", "pump"] },
  { label: "Supply", kinds: ["pipe", "tee", "elbow", "reducer"] },
  { label: "Valves", kinds: ["gate_valve", "ball_valve", "check_valve"] },
  { label: "Fixtures", kinds: ["sink_fixture", "toilet_fixture", "shower_fixture"] },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function VisualPlumbingCanvas({
  initialComponents,
  onChange,
  onInteract,
}: VisualPlumbingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // True while a click derived from a terminal pointerdown is in flight —
  // pointer capture retargets that click to the <svg>, which must not cancel wiring.
  const terminalTapRef = useRef(false);
  const instanceId = useRef(genId()).current;

  const makeInitial = useCallback((): VisualComp[] => {
    const positions = defaultPlacement((initialComponents ?? []).length);
    return (initialComponents ?? []).map((c, i) => ({
      id: genId(),
      kind: c.kind as PlumbingComponentKind,
      x: positions[i]?.x ?? snap(100 + i * 200),
      y: positions[i]?.y ?? snap(200),
      props: {
        ...(PLUMBING_COMPONENT_DEFS[c.kind as PlumbingComponentKind]?.defaultProps ?? {}),
        ...(c.props ?? {}),
      } as Record<string, number | boolean>,
    }));
  }, [initialComponents]);

  const [comps, setComps] = useState<VisualComp[]>(makeInitial);
  const [wires, setWires] = useState<VisualWire[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [wiringFrom, setWiringFrom] = useState<{ compId: string; term: string; pos: Vec2 } | null>(null);
  const [mousePos, setMousePos] = useState<Vec2>({ x: 0, y: 0 });
  const [hoverTerm, setHoverTerm] = useState<{ compId: string; term: string } | null>(null);
  const [result, setResult] = useState<FlowSolveResult | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [propEdit, setPropEdit] = useState<Record<string, string>>({});

  // ── Derived ────────────────────────────────────────────────────────────────
  const nodeMap = useMemo(() => computeNodeMap(comps, wires), [comps, wires]);
  const placed = useMemo(() => toPlaced(comps, nodeMap), [comps, nodeMap]);

  const maxHead = useMemo(() => {
    if (!result) return 0;
    return Math.max(0, ...Object.values(result.heads).filter(isFinite));
  }, [result]);

  // ── Auto-solve (150ms debounce, mirrors electrical canvas) ────────────────
  // onChange lives in a ref: the parent recreates the closure every render AND
  // stores our payload in parent state, so depending on onChange identity here
  // would create an infinite solve → setState → re-render → solve loop.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    const t = setTimeout(() => {
      const { result: r, error: e } = runSolve(placed);
      setResult(r);
      setSolveError(e);
      onChangeRef.current?.({ components: placed, lastSolve: r });
    }, 150);
    return () => clearTimeout(t);
  }, [placed]);

  // ── Keyboard: Delete / Escape ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setWiringFrom(null); return; }
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (selected) {
        setComps((c) => c.filter((x) => x.id !== selected));
        setWires((w) => w.filter((x) => x.fromComp !== selected && x.toComp !== selected));
        setSelected(null);
      }
      if (selectedWire) {
        setWires((w) => w.filter((x) => x.id !== selectedWire));
        setSelectedWire(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, selectedWire]);

  // ── SVG event handlers ─────────────────────────────────────────────────────
  const handleSVGMouseMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const pos = toSVGCoords(e, svgRef.current);
    setMousePos(pos);
    if (dragging) {
      setComps((prev) => prev.map((c) =>
        c.id === dragging.id
          ? { ...c, x: snap(pos.x - dragging.ox), y: snap(pos.y - dragging.oy) }
          : c,
      ));
    }
  }, [dragging]);

  const addWire = useCallback((from: { compId: string; term: string }, toComp: string, toTerm: string) => {
    setWires((prev) => {
      const dup = prev.some((w) =>
        (w.fromComp === from.compId && w.fromTerm === from.term && w.toComp === toComp && w.toTerm === toTerm) ||
        (w.fromComp === toComp && w.fromTerm === toTerm && w.toComp === from.compId && w.toTerm === from.term),
      );
      if (dup) return prev;
      return [...prev, { id: genId(), fromComp: from.compId, fromTerm: from.term, toComp, toTerm }];
    });
    onInteract?.();
  }, [onInteract]);

  const handleSVGMouseUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) setDragging(null);
    if (wiringFrom && svgRef.current) {
      const pos = toSVGCoords(e, svgRef.current);
      const target = nearestTerminal(pos, comps, wiringFrom.compId);
      if (target) {
        addWire(wiringFrom, target.compId, target.term);
        setWiringFrom(null);
      }
      // No terminal near release: STAY in wiring mode — the tap that starts
      // wiring bubbles a pointerup here; cancelling would break tap-to-wire
      // on touch. Cancel paths: Escape key or empty-canvas click below.
    }
  }, [dragging, wiringFrom, comps, addWire]);

  const handleSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // A click that originated from a terminal pointerdown retargets to the
    // <svg> when pointer capture is active — it must never cancel wiring.
    if (terminalTapRef.current) {
      terminalTapRef.current = false;
      return;
    }
    if (wiringFrom) {
      const tag = (e.target as Element).tagName?.toLowerCase();
      if (tag === "svg" || tag === "rect") setWiringFrom(null);
      return;
    }
    setSelected(null);
    setSelectedWire(null);
  }, [wiringFrom]);

  const addComponent = useCallback((kind: PlumbingComponentKind) => {
    const offset = comps.length * GRID * 2;
    const nc: VisualComp = {
      id: genId(),
      kind,
      x: snap(200 + (offset % (CW - 200))),
      y: snap(200),
      props: { ...(PLUMBING_COMPONENT_DEFS[kind]?.defaultProps ?? {}) } as Record<string, number | boolean>,
    };
    setComps((prev) => [...prev, nc]);
    setSelected(nc.id);
    onInteract?.();
  }, [comps.length, onInteract]);

  const reset = useCallback(() => {
    setComps(makeInitial());
    setWires([]);
    setSelected(null);
    setSelectedWire(null);
    setResult(null);
    setSolveError(null);
  }, [makeInitial]);

  const selectedComp = comps.find((c) => c.id === selected) ?? null;

  const updateProp = useCallback((compId: string, key: string, rawVal: string) => {
    const num = parseFloat(rawVal);
    if (!isNaN(num)) {
      setComps((prev) => prev.map((c) =>
        c.id === compId ? { ...c, props: { ...c.props, [key]: num } } : c,
      ));
    }
    setPropEdit((prev) => ({ ...prev, [`${compId}:${key}`]: rawVal }));
  }, []);

  /** Set a prop directly in SI units (used by unit-aware editors). */
  const updatePropSI = useCallback((compId: string, key: string, siVal: number) => {
    if (!Number.isFinite(siVal)) return;
    setComps((prev) => prev.map((c) =>
      c.id === compId ? { ...c, props: { ...c.props, [key]: siVal } } : c,
    ));
  }, []);

  const isClosedCheckValve = useCallback((c: VisualComp) =>
    c.kind === "check_valve" && (result?.closedOneWays?.includes(c.id) ?? false),
  [result]);

  // ── Status line ────────────────────────────────────────────────────────────
  const statusLine = (() => {
    if (comps.length === 0) {
      return { text: "Add a Tank (pressure source), a Pipe, and a fixture from the palette.", color: "text-muted-foreground" };
    }
    if (wires.length === 0) {
      return { text: "Click a terminal (●) then click another to connect components.", color: "text-muted-foreground" };
    }
    if (solveError) return { text: `⚠ ${solveError}`, color: "text-amber-600" };
    if (!result) return { text: "Keep connecting — the network solves automatically when complete.", color: "text-muted-foreground" };
    const closed = result.closedOneWays?.length ?? 0;
    return {
      text: `✓ Network solved — ${result.iterations} iterations${closed > 0 ? ` · 🛑 ${closed} check valve${closed === 1 ? "" : "s"} closed to block backflow` : ""}`,
      color: closed > 0 ? "text-amber-600" : "text-green-600",
    };
  })();

  // ── Head loss per pipe for the inspector ───────────────────────────────────
  const headLossPerPipe = useMemo(() => {
    if (!result) return {} as Record<string, number>;
    const { pipes } = placedToSolverElements(placed);
    const out: Record<string, number> = {};
    for (const p of pipes) out[p.id] = pipeHeadLoss(p, result.flows[p.id] ?? 0);
    return out;
  }, [result, placed]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Palette */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg border">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.label} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground pr-1">{group.label}</span>
            {group.kinds.map((kind) => {
              const def = VDEF[kind];
              return (
                <button
                  key={kind}
                  onClick={() => addComponent(kind)}
                  title={`Add ${def.label}`}
                  data-testid={`palette-${kind}`}
                  className="px-2 py-1 text-xs rounded border bg-background hover:bg-muted transition-colors
                    font-medium border-border hover:border-foreground/40 cursor-pointer"
                  style={{ color: def.color }}
                >
                  + {def.label}
                </button>
              );
            })}
            <span className="text-muted-foreground/40 pl-1 text-xs">|</span>
          </div>
        ))}
        <button
          onClick={reset}
          title="Reset canvas to initial state"
          data-testid="button-reset-plumbing-canvas"
          className="px-2 py-1 text-xs rounded border bg-background hover:bg-muted transition-colors
            text-muted-foreground border-border ml-auto flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Canvas */}
      <div
        className="relative rounded-xl border-2 overflow-hidden"
        style={{
          borderColor: wiringFrom ? "#0ea5e9" : selectedComp ? "#8b5cf6" : "#e2e8f0",
          cursor: wiringFrom ? "crosshair" : "default",
          background: "#fafcff",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CW} ${CH}`}
          width="100%"
          style={{ display: "block", userSelect: "none", touchAction: "none" }}
          onPointerMove={handleSVGMouseMove}
          onPointerUp={handleSVGMouseUp}
          onClick={handleSVGClick}
          onPointerLeave={() => { if (dragging) setDragging(null); }}
          data-testid="plumbing-canvas-svg"
        >
          <defs>
            <pattern id={`${instanceId}-grid`} x="0" y="0" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx={GRID / 2} cy={GRID / 2} r="1.2" fill="#cbd5e1" />
            </pattern>
          </defs>

          <rect width={CW} height={CH} fill={`url(#${instanceId}-grid)`} />
          <rect width={CW} height={CH} fill="none" stroke="#e2e8f0" strokeWidth="1" />

          {/* ── Connections layer ─────────────────────────────────────── */}
          {wires.map((w) => {
            const fc = comps.find((c) => c.id === w.fromComp);
            const tc = comps.find((c) => c.id === w.toComp);
            if (!fc || !tc) return null;
            const p1 = getTermPos(fc, w.fromTerm);
            const p2 = getTermPos(tc, w.toTerm);
            const node = nodeMap.get(`${w.fromComp}:${w.fromTerm}`);
            const h = node ? result?.heads[node] ?? 0 : 0;
            const wColor = headColor(h, maxHead);
            const path = wirePath(p1, p2);
            const isSelWire = w.id === selectedWire;

            return (
              <g key={w.id}>
                {/* Fat transparent hit area — a 3px stroke is untappable */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelectedWire(w.id); setSelected(null); }}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={isSelWire ? "#8b5cf6" : wColor}
                  strokeWidth={isSelWire ? 4 : WIRE_W}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}

          {/* ── Connection preview ────────────────────────────────────── */}
          {wiringFrom && (
            <path
              d={wirePath(wiringFrom.pos, mousePos)}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              strokeDasharray="8 5"
              opacity="0.7"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* ── Components layer ─────────────────────────────────────── */}
          {comps.map((comp) => {
            const def = VDEF[comp.kind];
            const isSel = comp.id === selected;

            return (
              <g
                key={comp.id}
                transform={`translate(${comp.x} ${comp.y})`}
                style={{ cursor: dragging?.id === comp.id ? "grabbing" : "grab", color: def.color }}
                onPointerDown={(e) => {
                  if (wiringFrom) return;
                  e.stopPropagation();
                  if (!svgRef.current) return;
                  // Capture on the svg: touch pointers get implicit capture on
                  // the touched child, which would hide pointermove/up from the
                  // svg-level handlers.
                  try { svgRef.current.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
                  const pos = toSVGCoords(e, svgRef.current);
                  setDragging({ id: comp.id, ox: pos.x - comp.x, oy: pos.y - comp.y });
                  setSelected(comp.id);
                  setSelectedWire(null);
                  onInteract?.();
                }}
              >
                {/* Invisible body hit-rect FIRST so terminals stay on top —
                    stroke-only symbols are otherwise untappable on phones. */}
                <rect x={-40} y={-36} width={80} height={76} fill="transparent" stroke="none" />
                {isSel && (
                  <circle
                    cx="0" cy="0" r="38"
                    fill="none" stroke="#8b5cf6" strokeWidth="1.5"
                    strokeDasharray="5 3" opacity="0.8"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {def.draw(comp.props, { closed: isClosedCheckValve(comp) })}
                {/* Terminals */}
                {Object.entries(def.terminals).map(([tName, tOff]) => {
                  const isHover = hoverTerm?.compId === comp.id && hoverTerm?.term === tName;
                  const isWiring = wiringFrom !== null;
                  const node = nodeMap.get(`${comp.id}:${tName}`);
                  const h = node ? result?.heads[node] ?? 0 : 0;
                  const tColor = headColor(h, maxHead);

                  return (
                    <g key={tName}>
                      <circle
                        cx={tOff.x} cy={tOff.y}
                        r={isHover || isWiring ? TERM_R * 1.4 : TERM_R}
                        fill={isHover ? "#0ea5e9" : result ? tColor : "#cbd5e1"}
                        fillOpacity={isHover ? 0.5 : 0.3}
                        stroke={isHover ? "#0284c7" : "#0ea5e9"}
                        strokeWidth={isHover ? 2 : 1.5}
                        style={{ pointerEvents: "none", transition: "r 0.1s" }}
                      />
                      {/* Oversized invisible hit target for fingertips; all
                          terminal handlers live here. */}
                      <circle
                        cx={tOff.x} cy={tOff.y} r={16}
                        fill="transparent" stroke="none"
                        style={{ cursor: "crosshair" }}
                        onMouseEnter={() => setHoverTerm({ compId: comp.id, term: tName })}
                        onMouseLeave={() => setHoverTerm(null)}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          terminalTapRef.current = true;
                          if (svgRef.current) {
                            try { svgRef.current.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
                          }
                          if (wiringFrom) {
                            if (wiringFrom.compId !== comp.id) {
                              addWire(wiringFrom, comp.id, tName);
                              setWiringFrom(null);
                            }
                          } else {
                            const absPos = { x: comp.x + tOff.x, y: comp.y + tOff.y };
                            setWiringFrom({ compId: comp.id, term: tName, pos: absPos });
                            setDragging(null);
                          }
                        }}
                        aria-label={tName}
                        data-testid={`terminal-${comp.kind}-${tName}`}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* ── Result overlays: head at terminals, flow on components ── */}
          {result && comps.map((comp) => {
            const def = VDEF[comp.kind];
            const entries: JSX.Element[] = [];
            for (const [tName, tOff] of Object.entries(def.terminals)) {
              const node = nodeMap.get(`${comp.id}:${tName}`);
              const h = node ? result.heads[node] : undefined;
              if (h === undefined || !isFinite(h)) continue;
              entries.push(
                <text
                  key={`${comp.id}:${tName}:h`}
                  x={comp.x + tOff.x} y={comp.y + tOff.y - 13}
                  fontSize="9" fill={headColor(h, maxHead)} textAnchor="middle"
                  style={{ ...mono, fontWeight: "bold", pointerEvents: "none" }}
                >
                  {(h * M_TO_PSI).toFixed(1)}psi
                </text>,
              );
            }
            const q = result.flows[comp.id];
            if (q !== undefined && isFinite(q) && Math.abs(q) > 1e-12) {
              entries.push(
                <text
                  key={`${comp.id}:q`}
                  x={comp.x} y={comp.y - (comp.kind === "tank" ? 44 : 40)}
                  fontSize="9" fill="#0369a1" textAnchor="middle"
                  style={{ ...mono, pointerEvents: "none" }}
                >
                  {(Math.abs(q) * M3S_TO_GPM).toFixed(2)} gpm
                </text>,
              );
            }
            return <g key={`overlay-${comp.id}`}>{entries}</g>;
          })}
        </svg>

        {/* Wiring mode indicator */}
        {wiringFrom && (
          <div className="absolute top-2 left-2 bg-sky-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow">
            <MoveUpRight className="h-3 w-3" />
            Click another terminal to connect — or press Escape to cancel
          </div>
        )}

        {/* Selected connection actions */}
        {selectedWire && (
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-white border shadow rounded-lg px-2 py-1">
            <span className="text-xs text-muted-foreground">Connection selected</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 text-xs px-2"
              onClick={() => { setWires((w) => w.filter((x) => x.id !== selectedWire)); setSelectedWire(null); }}
              data-testid="button-delete-connection"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={`text-xs flex items-center gap-2 px-1 ${statusLine.color}`}>
        <Droplets className="h-3 w-3 shrink-0" />
        {statusLine.text}
        {selectedComp && (
          <span className="text-muted-foreground ml-auto">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] border">Delete</kbd> to remove
          </span>
        )}
      </div>

      {/* Inspector */}
      {selectedComp && (() => {
        const def = VDEF[selectedComp.kind];
        const baseDef = PLUMBING_COMPONENT_DEFS[selectedComp.kind];
        const editableProps = Object.entries(selectedComp.props).filter(([k]) =>
          typeof baseDef?.defaultProps?.[k] === "number",
        );
        const boolProps = Object.entries(selectedComp.props).filter(([k]) =>
          typeof baseDef?.defaultProps?.[k] === "boolean",
        );

        return (
          <div className="border rounded-lg p-3 bg-muted/20 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: def.color }}>{def.label}</span>
                <Badge variant="outline" className="text-[10px]">{baseDef?.category}</Badge>
                {baseDef?.description && (
                  <span className="text-muted-foreground text-xs">{baseDef.description}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-destructive hover:text-destructive"
                onClick={() => {
                  setComps((c) => c.filter((x) => x.id !== selected));
                  setWires((w) => w.filter((x) => x.fromComp !== selected && x.toComp !== selected));
                  setSelected(null);
                }}
                data-testid="button-delete-plumbing-component"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {(editableProps.length > 0 || boolProps.length > 0) && (
              <div className="flex flex-wrap gap-4">
                {editableProps.map(([key, val]) => {
                  const editKey = `${selectedComp.id}:${key}`;
                  const displayVal = propEdit[editKey] ?? String(val);
                  if (isDiameterProp(key)) {
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="text-xs min-w-fit">{propLabel(key)}</Label>
                        <PipeSizeSelect
                          valueM={Number(val)}
                          onChangeM={(m) => updatePropSI(selectedComp.id, key, m)}
                          testIdPrefix={`input-prop-${key}`}
                        />
                      </div>
                    );
                  }
                  if (isHeadProp(key)) {
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="text-xs min-w-fit">{propLabel(key)}</Label>
                        <HeadInput
                          valueM={Number(val)}
                          onChangeM={(m) => updatePropSI(selectedComp.id, key, m)}
                          defaultUnit={key === "pumpHead" ? "ft" : "psi"}
                          testIdPrefix={`input-prop-${key}`}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="text-xs capitalize min-w-fit">
                        {key}{baseDef?.unit ? ` (${baseDef.unit})` : ""}
                      </Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-28 h-7 text-xs font-mono"
                        value={displayVal}
                        onChange={(e) => updateProp(selectedComp.id, key, e.target.value)}
                        onBlur={() => {
                          setPropEdit((prev) => {
                            const n = { ...prev };
                            delete n[editKey];
                            return n;
                          });
                        }}
                        data-testid={`input-prop-${key}`}
                      />
                    </div>
                  );
                })}
                {boolProps.map(([key, val]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setComps((prev) => prev.map((c) =>
                      c.id === selectedComp.id
                        ? { ...c, props: { ...c.props, [key]: !c.props[key] } }
                        : c,
                    ))}
                    data-testid={`button-toggle-${key}`}
                  >
                    {key === "closed"
                      ? (val ? "Open valve" : "Close valve")
                      : key === "active"
                        ? (val ? "Turn fixture off" : "Turn fixture on")
                        : `Toggle ${key}: ${String(val)}`}
                  </Button>
                ))}
              </div>
            )}
            {/* Live readings for the selected component */}
            {result && (
              <div className="flex flex-wrap gap-3 pt-1 border-t text-xs font-mono">
                {Object.keys(def.terminals).map((t) => {
                  const node = nodeMap.get(`${selectedComp.id}:${t}`);
                  const h = node ? result.heads[node] : undefined;
                  if (h === undefined || !isFinite(h)) return null;
                  return (
                    <span key={t} className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{t}:</span>{" "}
                      {h.toFixed(2)}m · {(h * M_TO_PSI).toFixed(1)}psi
                    </span>
                  );
                })}
                {(() => {
                  const q = result.flows[selectedComp.id];
                  if (q === undefined || !isFinite(q)) return null;
                  const loss = headLossPerPipe[selectedComp.id];
                  return (
                    <span className="text-sky-700 font-semibold">
                      Q = {(Math.abs(q) * M3S_TO_GPM).toFixed(2)} gpm
                      {loss !== undefined && Math.abs(loss) > 1e-6 && (
                        <span className="text-muted-foreground font-normal"> · Δh {loss.toFixed(3)}m</span>
                      )}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {/* Hint */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-500" />
        <span>
          Connect components by clicking one terminal (●), then another — the connection line means
          those two points share the same junction. The network solves automatically: connection color
          shows pressure (light = low, dark blue = high) and labels show psi and gpm.
        </span>
      </div>
    </div>
  );
}

export default VisualPlumbingCanvas;
