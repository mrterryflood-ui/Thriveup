/**
 * VisualCircuitCanvas — SVG-based interactive schematic editor
 *
 * Replaces the form-based CircuitCanvas with:
 *   - Drag-and-drop component placement on a 24-px grid
 *   - Click-to-wire: click a terminal → click another to connect
 *   - Auto-solve via MNA (Modified Nodal Analysis) after every change
 *   - Wire color = live node voltage (gray → green → orange)
 *   - Marching-dot current animation (Falstad-style)
 *   - LED glow when conducting
 *   - Click component to inspect / edit values inline
 *   - Delete key or trash button removes selected element
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COMPONENT_DEFS,
  ledIsLit,
  placedToSolverElements,
  type ComponentKind,
} from "@/lib/trade-sims/electrical/component-defs";
import {
  formatSI,
  resistorPower,
  solveCircuit,
  type SolveOutput,
} from "@/lib/trade-sims/electrical/circuit-solver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, RotateCcw, Zap, ZapOff, Info, MoveUpRight,
} from "lucide-react";

// ─── Canvas constants ─────────────────────────────────────────────────────────
const CW = 820;      // viewBox width
const CH = 440;      // viewBox height
const GRID = 24;     // grid pitch (px in viewBox)
const TERM_R = 9;    // terminal circle radius (hit area)
const WIRE_W = 2.5;  // wire stroke width

const snap = (v: number) => Math.round(v / GRID) * GRID;
const genId = () => `vc_${Math.random().toString(36).slice(2, 8)}`;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number }

interface VisualComp {
  id: string;
  kind: ComponentKind;
  x: number;   // grid-snapped center x
  y: number;   // grid-snapped center y
  props: Record<string, number | boolean>;
}

interface VisualWire {
  id: string;
  fromComp: string;
  fromTerm: string;
  toComp: string;
  toTerm: string;
}

export interface VisualCircuitCanvasProps {
  initialComponents?: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  onChange?: (s: { lastSolve: SolveOutput | null }) => void;
  onInteract?: () => void;
  engineMode?: string;
  compact?: boolean;
}

// ─── Visual definitions ──────────────────────────────────────────────────────
// Each entry: terminal pixel offsets from component center, and a draw function
// that returns SVG children rendered inside a <g transform="translate(cx cy)">

interface VDef {
  label: string;
  category: "source" | "passive" | "active" | "digital";
  color: string;      // hex for badge / highlight
  terminals: Record<string, Vec2>;
  draw: (props: Record<string, number | boolean>, lit?: boolean) => JSX.Element;
}

const VDEF: Partial<Record<ComponentKind, VDef>> = {

  battery: {
    label: "Battery",
    category: "source",
    color: "#ef4444",
    terminals: { neg: { x: -44, y: 0 }, pos: { x: 44, y: 0 } },
    draw: (p) => (
      <g stroke="currentColor" fill="none">
        <line x1="-44" y1="0" x2="-8" y2="0" strokeWidth="2" />
        <line x1="-8" y1="-10" x2="-8" y2="10" strokeWidth="2" />   {/* short = − */}
        <line x1="8" y1="-17" x2="8" y2="17" strokeWidth="3.5" />   {/* long  = + */}
        <line x1="8" y1="0" x2="44" y2="0" strokeWidth="2" />
        <text x="-22" y="-18" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none">−</text>
        <text x="22" y="-20" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none">+</text>
        <text x="0" y="30" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none"
          style={{ fontFamily: "monospace" }}>{p.voltage ?? 9}V</text>
      </g>
    ),
  },

  resistor: {
    label: "Resistor",
    category: "passive",
    color: "#6366f1",
    terminals: { a: { x: -48, y: 0 }, b: { x: 48, y: 0 } },
    draw: (p) => {
      const r = Number(p.resistance ?? 1000);
      const lbl = r >= 1e6 ? `${(r / 1e6).toFixed(1)}MΩ`
        : r >= 1e3 ? `${(r / 1e3).toFixed(r % 1000 === 0 ? 0 : 1)}kΩ`
        : `${r}Ω`;
      return (
        <g stroke="currentColor" fill="none">
          <line x1="-48" y1="0" x2="-20" y2="0" strokeWidth="2" />
          <rect x="-20" y="-10" width="40" height="20" strokeWidth="2" rx="1" />
          <line x1="20" y1="0" x2="48" y2="0" strokeWidth="2" />
          <text x="0" y="30" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none"
            style={{ fontFamily: "monospace" }}>{lbl}</text>
        </g>
      );
    },
  },

  led: {
    label: "LED",
    category: "active",
    color: "#f59e0b",
    terminals: { anode: { x: -36, y: 0 }, cathode: { x: 36, y: 0 } },
    draw: (_p, lit) => (
      <g stroke="currentColor" fill="none">
        {lit && <circle cx="0" cy="0" r="24" fill="#fde047" opacity="0.25" stroke="none" />}
        <line x1="-36" y1="0" x2="-14" y2="0" strokeWidth="2" />
        <polygon points="-14,-13 -14,13 14,0"
          fill={lit ? "#fde047" : "currentColor"} stroke="currentColor" strokeWidth="1.5" />
        <line x1="14" y1="-13" x2="14" y2="13" strokeWidth="2" />
        <line x1="14" y1="0" x2="36" y2="0" strokeWidth="2" />
        {/* Light rays */}
        <line x1="20" y1="-4" x2="30" y2="-16" stroke={lit ? "#fbbf24" : "currentColor"} strokeWidth={lit ? 2 : 1.5} />
        <line x1="25" y1="-1" x2="35" y2="-13" stroke={lit ? "#fbbf24" : "currentColor"} strokeWidth={lit ? 2 : 1.5} />
        <text x="0" y="30" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
          {lit ? "ON ✦" : "LED"}
        </text>
      </g>
    ),
  },

  capacitor: {
    label: "Capacitor",
    category: "passive",
    color: "#06b6d4",
    terminals: { pos: { x: -36, y: 0 }, neg: { x: 36, y: 0 } },
    draw: (p) => {
      const c = Number(p.capacitance ?? 100e-6);
      const lbl = c >= 1e-3 ? `${(c * 1e3).toFixed(1)}mF`
        : c >= 1e-6 ? `${(c * 1e6).toFixed(0)}μF`
        : `${(c * 1e9).toFixed(0)}nF`;
      return (
        <g stroke="currentColor" fill="none">
          <line x1="-36" y1="0" x2="-6" y2="0" strokeWidth="2" />
          <line x1="-6" y1="-14" x2="-6" y2="14" strokeWidth="3.5" />
          <line x1="6" y1="-14" x2="6" y2="14" strokeWidth="3.5" />
          <line x1="6" y1="0" x2="36" y2="0" strokeWidth="2" />
          <text x="-14" y="-16" fontSize="9" fill="currentColor" stroke="none">+</text>
          <text x="0" y="30" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none"
            style={{ fontFamily: "monospace" }}>{lbl}</text>
        </g>
      );
    },
  },

  switch: {
    label: "Switch",
    category: "passive",
    color: "#10b981",
    terminals: { a: { x: -40, y: 0 }, b: { x: 40, y: 0 } },
    draw: (p) => {
      const closed = Boolean(p.closed);
      return (
        <g stroke="currentColor" fill="none">
          <line x1="-40" y1="0" x2="-16" y2="0" strokeWidth="2" />
          <circle cx="-16" cy="0" r="3.5" fill="currentColor" />
          <circle cx="16" cy="0" r="3.5" fill="currentColor" />
          <line x1="-16" y1="0" x2={closed ? 16 : 14} y2={closed ? 0 : -14} strokeWidth="2" />
          <line x1="16" y1="0" x2="40" y2="0" strokeWidth="2" />
          <text x="0" y="30" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">
            {closed ? "CLOSED" : "OPEN"}
          </text>
        </g>
      );
    },
  },

  inductor: {
    label: "Inductor",
    category: "passive",
    color: "#8b5cf6",
    terminals: { a: { x: -48, y: 0 }, b: { x: 48, y: 0 } },
    draw: (p) => {
      const h = Number(p.inductance ?? 0.001);
      const lbl = h >= 1 ? `${h.toFixed(1)}H`
        : h >= 1e-3 ? `${(h * 1e3).toFixed(0)}mH`
        : `${(h * 1e6).toFixed(0)}μH`;
      return (
        <g stroke="currentColor" fill="none">
          <line x1="-48" y1="0" x2="-24" y2="0" strokeWidth="2" />
          {/* 4 upward arcs */}
          <path d="M-24,0 A6,8 0 0,0 -12,0 A6,8 0 0,0 0,0 A6,8 0 0,0 12,0 A6,8 0 0,0 24,0"
            strokeWidth="2" />
          <line x1="24" y1="0" x2="48" y2="0" strokeWidth="2" />
          <text x="0" y="30" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none"
            style={{ fontFamily: "monospace" }}>{lbl}</text>
        </g>
      );
    },
  },

  npn_transistor: {
    label: "NPN",
    category: "active",
    color: "#ec4899",
    terminals: { base: { x: -28, y: 0 }, collector: { x: 22, y: -34 }, emitter: { x: 22, y: 34 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <circle cx="0" cy="0" r="24" strokeWidth="2" />
        <line x1="-28" y1="0" x2="-8" y2="0" strokeWidth="2" />
        <line x1="-8" y1="-22" x2="-8" y2="22" strokeWidth="2.5" />
        <line x1="-8" y1="-16" x2="22" y2="-34" strokeWidth="2" />
        <line x1="-8" y1="16" x2="22" y2="34" strokeWidth="2" />
        {/* Arrow on emitter (NPN: outward) */}
        <polygon points="12,24 22,34 8,32" fill="currentColor" />
        <text x="8" y="5" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">N</text>
      </g>
    ),
  },

  pnp_transistor: {
    label: "PNP",
    category: "active",
    color: "#ec4899",
    terminals: { base: { x: -28, y: 0 }, collector: { x: 22, y: -34 }, emitter: { x: 22, y: 34 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <circle cx="0" cy="0" r="24" strokeWidth="2" />
        <line x1="-28" y1="0" x2="-8" y2="0" strokeWidth="2" />
        <line x1="-8" y1="-22" x2="-8" y2="22" strokeWidth="2.5" />
        <line x1="-8" y1="-16" x2="22" y2="-34" strokeWidth="2" />
        <line x1="-8" y1="16" x2="22" y2="34" strokeWidth="2" />
        {/* Arrow on collector (PNP: inward) */}
        <polygon points="-2,-20 8,-16 0,-28" fill="currentColor" />
        <text x="8" y="5" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">P</text>
      </g>
    ),
  },

  and_gate: {
    label: "AND",
    category: "digital",
    color: "#0ea5e9",
    terminals: { in1: { x: -32, y: -14 }, in2: { x: -32, y: 14 }, out: { x: 32, y: 0 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <path d="M-20,-20 L-20,20 L2,20 A20,20 0 0,0 2,-20 Z" strokeWidth="2" />
        <line x1="-32" y1="-14" x2="-20" y2="-14" strokeWidth="2" />
        <line x1="-32" y1="14" x2="-20" y2="14" strokeWidth="2" />
        <line x1="22" y1="0" x2="32" y2="0" strokeWidth="2" />
        <text x="2" y="30" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">AND</text>
      </g>
    ),
  },

  or_gate: {
    label: "OR",
    category: "digital",
    color: "#0ea5e9",
    terminals: { in1: { x: -32, y: -14 }, in2: { x: -32, y: 14 }, out: { x: 36, y: 0 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <path d="M-20,-20 Q8,-20 22,0 Q8,20 -20,20 Q-6,0 -20,-20 Z" strokeWidth="2" />
        <line x1="-32" y1="-14" x2="-16" y2="-14" strokeWidth="2" />
        <line x1="-32" y1="14" x2="-16" y2="14" strokeWidth="2" />
        <line x1="22" y1="0" x2="36" y2="0" strokeWidth="2" />
        <text x="2" y="30" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">OR</text>
      </g>
    ),
  },

  not_gate: {
    label: "NOT",
    category: "digital",
    color: "#0ea5e9",
    terminals: { in: { x: -28, y: 0 }, out: { x: 32, y: 0 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <polygon points="-20,-16 -20,16 16,0" strokeWidth="2" />
        <circle cx="20" cy="0" r="4" strokeWidth="2" />
        <line x1="-28" y1="0" x2="-20" y2="0" strokeWidth="2" />
        <line x1="24" y1="0" x2="32" y2="0" strokeWidth="2" />
        <text x="0" y="30" fontSize="9" fill="currentColor" textAnchor="middle" stroke="none">NOT</text>
      </g>
    ),
  },

  wire: {
    label: "Wire",
    category: "passive",
    color: "#64748b",
    terminals: { a: { x: -24, y: 0 }, b: { x: 24, y: 0 } },
    draw: () => (
      <g stroke="currentColor" fill="none">
        <line x1="-24" y1="0" x2="24" y2="0" strokeWidth="2.5" />
      </g>
    ),
  },
};

// ─── Helper utilities ─────────────────────────────────────────────────────────

function getTermPos(comp: VisualComp, term: string): Vec2 {
  const def = VDEF[comp.kind];
  const off = def?.terminals[term] ?? { x: 0, y: 0 };
  return { x: comp.x + off.x, y: comp.y + off.y };
}

/** Orthogonal L-shaped SVG path between two points */
function wirePath(p1: Vec2, p2: Vec2): string {
  const mx = Math.round(((p1.x + p2.x) / 2) / GRID) * GRID;
  if (Math.abs(p1.y - p2.y) < 2) {
    // same-row: straight line
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }
  return `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`;
}

/** Union-Find node assignment from visual wires */
function computeNodeMap(comps: VisualComp[], wires: VisualWire[]): Map<string, number> {
  const parent = new Map<string, string>();

  for (const c of comps) {
    const def = VDEF[c.kind];
    if (!def) continue;
    for (const t of Object.keys(def.terminals)) {
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
  function union(a: string, b: string) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (const w of wires) {
    union(`${w.fromComp}:${w.fromTerm}`, `${w.toComp}:${w.toTerm}`);
  }

  // Root map: battery neg → node 0
  const rootNode = new Map<string, number>();
  let next = 1;

  for (const c of comps) {
    if (c.kind === "battery") {
      const root = find(`${c.id}:neg`);
      rootNode.set(root, 0);
      break;
    }
  }

  const out = new Map<string, number>();
  for (const c of comps) {
    const def = VDEF[c.kind];
    if (!def) continue;
    for (const t of Object.keys(def.terminals)) {
      const k = `${c.id}:${t}`;
      const root = find(k);
      if (!rootNode.has(root)) rootNode.set(root, next++);
      out.set(k, rootNode.get(root)!);
    }
  }
  return out;
}

function runSolve(
  comps: VisualComp[],
  wires: VisualWire[],
): { result: SolveOutput | null; error: string | null } {
  if (comps.length === 0) return { result: null, error: null };
  const nodeMap = computeNodeMap(comps, wires);

  let nodeCount = 1;
  for (const v of nodeMap.values()) if (v >= nodeCount) nodeCount = v + 1;

  const placed = comps.map(c => ({
    id: c.id,
    kind: c.kind,
    terminalNodes: Object.fromEntries(
      Object.keys(VDEF[c.kind]?.terminals ?? {}).map(t => [t, nodeMap.get(`${c.id}:${t}`) ?? 0]),
    ),
    props: c.props,
  }));

  const elements = placed.flatMap(p => {
    try { return placedToSolverElements(p as any); }
    catch { return []; }
  });

  if (elements.length === 0) return { result: null, error: null };
  const out = solveCircuit({ nodeCount, elements });
  if (!out.ok) return { result: null, error: out.error };
  return { result: out, error: null };
}

function voltageColor(v: number, maxV: number): string {
  if (!isFinite(v) || maxV < 0.01 || v < 0.005) return "#94a3b8"; // ground / gray
  const t = Math.min(1, v / maxV);
  if (t < 0.35) return "#22c55e";   // green
  if (t < 0.65) return "#eab308";   // yellow
  return "#f97316";                  // orange
}

function toSVGCoords(e: React.MouseEvent, svgEl: SVGSVGElement): Vec2 {
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
    const def = VDEF[c.kind];
    if (!def) continue;
    for (const [t, off] of Object.entries(def.terminals)) {
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
  // 2 rows
  return Array.from({ length: n }, (_, i) => ({
    x: snap(140 + (i % 3) * 210),
    y: snap(150 + Math.floor(i / 3) * 180),
  }));
}

// ─── Category palette groups ──────────────────────────────────────────────────
const PALETTE_GROUPS: { label: string; kinds: ComponentKind[] }[] = [
  { label: "Sources", kinds: ["battery"] },
  { label: "Passives", kinds: ["resistor", "capacitor", "inductor", "switch"] },
  { label: "Active", kinds: ["led", "npn_transistor", "pnp_transistor"] },
  { label: "Digital", kinds: ["and_gate", "or_gate", "not_gate"] },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function VisualCircuitCanvas({
  initialComponents,
  onChange,
  onInteract,
  engineMode,
  compact = false,
}: VisualCircuitCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const instanceId = useRef(genId()).current;

  // ── State ──────────────────────────────────────────────────────────────────
  const [comps, setComps] = useState<VisualComp[]>(() => {
    const positions = defaultPlacement((initialComponents ?? []).length);
    return (initialComponents ?? []).map((c, i) => ({
      id: genId(),
      kind: c.kind as ComponentKind,
      x: positions[i]?.x ?? snap(100 + i * 200),
      y: positions[i]?.y ?? snap(200),
      props: {
        ...(COMPONENT_DEFS[c.kind as ComponentKind]?.defaultProps ?? {}),
        ...(c.props ?? {}),
      } as Record<string, number | boolean>,
    }));
  });

  const [wires, setWires] = useState<VisualWire[]>([]);
  const [selected, setSelected] = useState<string | null>(null);  // comp id
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [wiringFrom, setWiringFrom] = useState<{ compId: string; term: string; pos: Vec2 } | null>(null);
  const [mousePos, setMousePos] = useState<Vec2>({ x: 0, y: 0 });
  const [hoverTerm, setHoverTerm] = useState<{ compId: string; term: string } | null>(null);
  const [result, setResult] = useState<SolveOutput | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [propEdit, setPropEdit] = useState<Record<string, string>>({});

  // ── Derived ────────────────────────────────────────────────────────────────
  const nodeMap = useMemo(() => computeNodeMap(comps, wires), [comps, wires]);

  const maxV = useMemo(() => {
    if (!result) return 0;
    return Math.max(0, ...result.nodeVoltages.filter(isFinite));
  }, [result]);

  const isLit = useCallback((comp: VisualComp) => {
    if (comp.kind !== "led" || !result) return false;
    const an = nodeMap.get(`${comp.id}:anode`) ?? 0;
    const ca = nodeMap.get(`${comp.id}:cathode`) ?? 0;
    return ledIsLit(
      result.nodeVoltages[an] ?? 0,
      result.nodeVoltages[ca] ?? 0,
      Number(comp.props.forwardVoltage ?? 1.8),
    );
  }, [result, nodeMap]);

  // ── Auto-solve ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      const { result: r, error: e } = runSolve(comps, wires);
      setResult(r);
      setSolveError(e);
      onChange?.({ lastSolve: r });
    }, 150);
    return () => clearTimeout(t);
  }, [comps, wires, onChange]);

  // ── Keyboard: Delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (selected) {
        setComps(c => c.filter(x => x.id !== selected));
        setWires(w => w.filter(x => x.fromComp !== selected && x.toComp !== selected));
        setSelected(null);
      }
      if (selectedWire) {
        setWires(w => w.filter(x => x.id !== selectedWire));
        setSelectedWire(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, selectedWire]);

  // ── SVG event handlers ─────────────────────────────────────────────────────
  const handleSVGMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const pos = toSVGCoords(e, svgRef.current);
    setMousePos(pos);
    if (dragging) {
      setComps(prev => prev.map(c =>
        c.id === dragging.id
          ? { ...c, x: snap(pos.x - dragging.ox), y: snap(pos.y - dragging.oy) }
          : c,
      ));
    }
  }, [dragging]);

  const handleSVGMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging) setDragging(null);
    if (wiringFrom && svgRef.current) {
      const pos = toSVGCoords(e, svgRef.current);
      const target = nearestTerminal(pos, comps, wiringFrom.compId);
      if (target) {
        const dup = wires.some(w =>
          (w.fromComp === wiringFrom.compId && w.fromTerm === wiringFrom.term &&
            w.toComp === target.compId && w.toTerm === target.term) ||
          (w.fromComp === target.compId && w.fromTerm === target.term &&
            w.toComp === wiringFrom.compId && w.toTerm === wiringFrom.term),
        );
        if (!dup) {
          setWires(prev => [...prev, {
            id: genId(),
            fromComp: wiringFrom.compId,
            fromTerm: wiringFrom.term,
            toComp: target.compId,
            toTerm: target.term,
          }]);
          onInteract?.();
        }
      }
      setWiringFrom(null);
    }
  }, [dragging, wiringFrom, comps, wires, onInteract]);

  const handleSVGClick = useCallback(() => {
    if (!wiringFrom) { setSelected(null); setSelectedWire(null); }
  }, [wiringFrom]);

  // ── Add component from palette ─────────────────────────────────────────────
  const addComponent = useCallback((kind: ComponentKind) => {
    const offset = comps.length * GRID * 2;
    const nc: VisualComp = {
      id: genId(),
      kind,
      x: snap(200 + (offset % (CW - 200))),
      y: snap(200),
      props: { ...(COMPONENT_DEFS[kind]?.defaultProps ?? {}) } as Record<string, number | boolean>,
    };
    setComps(prev => [...prev, nc]);
    setSelected(nc.id);
    onInteract?.();
  }, [comps.length, onInteract]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    const positions = defaultPlacement((initialComponents ?? []).length);
    setComps((initialComponents ?? []).map((c, i) => ({
      id: genId(),
      kind: c.kind as ComponentKind,
      x: positions[i]?.x ?? snap(100 + i * 200),
      y: positions[i]?.y ?? snap(200),
      props: {
        ...(COMPONENT_DEFS[c.kind as ComponentKind]?.defaultProps ?? {}),
        ...(c.props ?? {}),
      } as Record<string, number | boolean>,
    })));
    setWires([]);
    setSelected(null);
    setSelectedWire(null);
    setResult(null);
    setSolveError(null);
  }, [initialComponents]);

  // ── Selected component ─────────────────────────────────────────────────────
  const selectedComp = comps.find(c => c.id === selected) ?? null;

  const updateProp = useCallback((compId: string, key: string, rawVal: string) => {
    const num = parseFloat(rawVal);
    if (!isNaN(num)) {
      setComps(prev => prev.map(c =>
        c.id === compId ? { ...c, props: { ...c.props, [key]: num } } : c,
      ));
    }
    setPropEdit(prev => ({ ...prev, [`${compId}:${key}`]: rawVal }));
  }, []);

  // ── Render: result overlays ────────────────────────────────────────────────
  const renderResultOverlays = () => {
    if (!result) return null;
    return comps.map(comp => {
      const def = VDEF[comp.kind];
      if (!def) return null;
      const entries: JSX.Element[] = [];

      // Voltage label at each terminal
      for (const [tName, tOff] of Object.entries(def.terminals)) {
        const node = nodeMap.get(`${comp.id}:${tName}`) ?? 0;
        const v = result.nodeVoltages[node] ?? 0;
        if (!isFinite(v)) continue;
        const tx = comp.x + tOff.x;
        const ty = comp.y + tOff.y - 13;
        const col = voltageColor(v, maxV);
        entries.push(
          <text
            key={`${comp.id}:${tName}:v`}
            x={tx} y={ty}
            fontSize="9"
            fill={col}
            textAnchor="middle"
            style={{ fontFamily: "monospace", fontWeight: "bold", pointerEvents: "none" }}
          >
            {formatSI(v, "V")}
          </text>,
        );
      }

      // Current label on component body
      const cur = (() => {
        if (comp.kind === "battery") return result.vsourceCurrents[comp.id];
        if (comp.kind === "resistor" || comp.kind === "led" || comp.kind === "inductor") {
          return result.resistorCurrents[comp.id];
        }
        return undefined;
      })();
      if (cur !== undefined && isFinite(cur) && Math.abs(cur) > 1e-10) {
        entries.push(
          <text
            key={`${comp.id}:cur`}
            x={comp.x} y={comp.y - 28}
            fontSize="9"
            fill="#3b82f6"
            textAnchor="middle"
            style={{ fontFamily: "monospace", pointerEvents: "none" }}
          >
            {formatSI(Math.abs(cur), "A")}
          </text>,
        );
        if (comp.kind === "resistor") {
          const pwr = resistorPower(cur, Number(comp.props.resistance ?? 1000));
          entries.push(
            <text
              key={`${comp.id}:pwr`}
              x={comp.x} y={comp.y - 19}
              fontSize="8"
              fill="#64748b"
              textAnchor="middle"
              style={{ fontFamily: "monospace", pointerEvents: "none" }}
            >
              {formatSI(pwr, "W")}
            </text>,
          );
        }
      }

      return <g key={`overlay-${comp.id}`}>{entries}</g>;
    });
  };

  // ── Render: wire animations ────────────────────────────────────────────────
  const renderWireAnimations = () => {
    if (!result || maxV < 0.01) return null;
    return wires.map(w => {
      const fc = comps.find(c => c.id === w.fromComp);
      const tc = comps.find(c => c.id === w.toComp);
      if (!fc || !tc) return null;
      const p1 = getTermPos(fc, w.fromTerm);
      const p2 = getTermPos(tc, w.toTerm);
      const node = nodeMap.get(`${w.fromComp}:${w.fromTerm}`) ?? 0;
      const v = result.nodeVoltages[node] ?? 0;
      if (!isFinite(v) || v < 0.005) return null; // no dots on ground wires

      const pathId = `${instanceId}-wp-${w.id}`;
      const path = wirePath(p1, p2);
      const dur = "1.2s";

      return (
        <g key={`anim-${w.id}`} style={{ pointerEvents: "none" }}>
          <path id={pathId} d={path} fill="none" stroke="none" />
          {[0, -0.4, -0.8].map((offset, i) => (
            <circle key={i} r="4" fill="#fbbf24" opacity="0.9">
              <animateMotion
                dur={dur}
                repeatCount="indefinite"
                begin={`${offset}s`}
                keyPoints="0;1"
                keyTimes="0;1"
                calcMode="linear"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
      );
    });
  };

  // ── Status line ────────────────────────────────────────────────────────────
  const statusLine = (() => {
    if (solveError) return { text: `⚠ ${solveError}`, color: "text-red-600" };
    if (!result) {
      if (comps.length === 0) return { text: "Pick a component from the palette to begin.", color: "text-muted-foreground" };
      if (wires.length === 0) return { text: "Click a terminal (●) then click another to draw a wire.", color: "text-muted-foreground" };
      return { text: "Wire the circuit to complete it — then it will solve automatically.", color: "text-muted-foreground" };
    }
    const totalPwr = result.vsourceCurrents
      ? Object.entries(result.vsourceCurrents).reduce((sum, [id, i]) => {
        const comp = comps.find(c => c.id === id);
        if (!comp) return sum;
        const vn = nodeMap.get(`${comp.id}:pos`) ?? 0;
        const vp = result.nodeVoltages[vn] ?? 0;
        return sum + Math.abs(i * vp);
      }, 0)
      : 0;
    return {
      text: `✓ Circuit solved — ${formatSI(totalPwr, "W")} total power`,
      color: "text-green-600",
    };
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Palette */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg border">
        {PALETTE_GROUPS.map(group => (
          <div key={group.label} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground pr-1">{group.label}</span>
            {group.kinds.map(kind => {
              const def = VDEF[kind];
              if (!def) return null;
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
          data-testid="button-reset-canvas"
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
          borderColor: wiringFrom ? "#3b82f6" : selectedComp ? "#8b5cf6" : "#e2e8f0",
          cursor: wiringFrom ? "crosshair" : "default",
          background: "#fafafa",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CW} ${CH}`}
          width="100%"
          style={{ display: "block", userSelect: "none" }}
          onMouseMove={handleSVGMouseMove}
          onMouseUp={handleSVGMouseUp}
          onClick={handleSVGClick}
          onMouseLeave={() => {
            if (dragging) setDragging(null);
          }}
          data-testid="canvas-svg"
        >
          <defs>
            {/* Grid dot pattern */}
            <pattern id={`${instanceId}-grid`} x="0" y="0" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx={GRID / 2} cy={GRID / 2} r="1.2" fill="#cbd5e1" />
            </pattern>
            {/* Animation keyframe embedded in SVG */}
            <style>{`
              .march-ant { animation: marchAnt-${instanceId} 0.8s linear infinite; }
              @keyframes marchAnt-${instanceId} { to { stroke-dashoffset: -28; } }
            `}</style>
          </defs>

          {/* Grid background */}
          <rect width={CW} height={CH} fill={`url(#${instanceId}-grid)`} />
          <rect width={CW} height={CH} fill="none" stroke="#e2e8f0" strokeWidth="1" />

          {/* ── Wires layer ─────────────────────────────────────────── */}
          {wires.map(w => {
            const fc = comps.find(c => c.id === w.fromComp);
            const tc = comps.find(c => c.id === w.toComp);
            if (!fc || !tc) return null;
            const p1 = getTermPos(fc, w.fromTerm);
            const p2 = getTermPos(tc, w.toTerm);
            const node = nodeMap.get(`${w.fromComp}:${w.fromTerm}`) ?? 0;
            const v = result?.nodeVoltages[node] ?? 0;
            const wColor = voltageColor(v, maxV);
            const path = wirePath(p1, p2);
            const isSelWire = w.id === selectedWire;

            return (
              <g key={w.id}>
                {/* Hit area */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelectedWire(w.id); setSelected(null); }}
                />
                {/* Wire */}
                <path
                  d={path}
                  fill="none"
                  stroke={isSelWire ? "#8b5cf6" : wColor}
                  strokeWidth={isSelWire ? 3 : WIRE_W}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Current dots */}
                {result && v > 0.005 && (() => {
                  const pathId = `${instanceId}-wp-${w.id}`;
                  return (
                    <>
                      <path id={pathId} d={path} fill="none" stroke="none" />
                      {[0, -0.4, -0.8].map((off, i) => (
                        <circle key={i} r="3.5" fill="#fbbf24" opacity="0.85" style={{ pointerEvents: "none" }}>
                          <animateMotion
                            dur="1.2s"
                            repeatCount="indefinite"
                            begin={`${off}s`}
                            keyPoints="0;1"
                            keyTimes="0;1"
                            calcMode="linear"
                          >
                            <mpath href={`#${pathId}`} />
                          </animateMotion>
                        </circle>
                      ))}
                    </>
                  );
                })()}
              </g>
            );
          })}

          {/* ── Wire preview ────────────────────────────────────────── */}
          {wiringFrom && (
            <path
              d={wirePath(wiringFrom.pos, mousePos)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="8 5"
              opacity="0.7"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* ── Components layer ─────────────────────────────────────── */}
          {comps.map(comp => {
            const def = VDEF[comp.kind];
            if (!def) return null;
            const isSel = comp.id === selected;
            const lit = isLit(comp);

            return (
              <g
                key={comp.id}
                transform={`translate(${comp.x} ${comp.y})`}
                style={{ cursor: dragging?.id === comp.id ? "grabbing" : "grab", color: def.color }}
                onMouseDown={(e) => {
                  if (wiringFrom) return;
                  e.stopPropagation();
                  if (!svgRef.current) return;
                  const pos = toSVGCoords(e, svgRef.current);
                  setDragging({ id: comp.id, ox: pos.x - comp.x, oy: pos.y - comp.y });
                  setSelected(comp.id);
                  setSelectedWire(null);
                  onInteract?.();
                }}
              >
                {/* Selection ring */}
                {isSel && (
                  <circle
                    cx="0" cy="0" r="34"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                    opacity="0.8"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {/* Symbol */}
                {def.draw(comp.props, lit)}
                {/* Terminal circles */}
                {Object.entries(def.terminals).map(([tName, tOff]) => {
                  const isHover = hoverTerm?.compId === comp.id && hoverTerm?.term === tName;
                  const isWiring = wiringFrom !== null;
                  const node = nodeMap.get(`${comp.id}:${tName}`) ?? 0;
                  const v = result?.nodeVoltages[node] ?? 0;
                  const tColor = voltageColor(v, maxV);

                  return (
                    <circle
                      key={tName}
                      cx={tOff.x}
                      cy={tOff.y}
                      r={isHover || isWiring ? TERM_R * 1.4 : TERM_R}
                      fill={isHover ? "#3b82f6" : result ? tColor : "#cbd5e1"}
                      fillOpacity={isHover ? 0.5 : 0.3}
                      stroke={isHover ? "#2563eb" : "#3b82f6"}
                      strokeWidth={isHover ? 2 : 1.5}
                      style={{ cursor: "crosshair", transition: "r 0.1s" }}
                      onMouseEnter={() => setHoverTerm({ compId: comp.id, term: tName })}
                      onMouseLeave={() => setHoverTerm(null)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (wiringFrom) {
                          // complete wire if different component
                          if (wiringFrom.compId !== comp.id) {
                            const dup = wires.some(w =>
                              (w.fromComp === wiringFrom.compId && w.fromTerm === wiringFrom.term &&
                                w.toComp === comp.id && w.toTerm === tName) ||
                              (w.fromComp === comp.id && w.fromTerm === tName &&
                                w.toComp === wiringFrom.compId && w.toTerm === wiringFrom.term),
                            );
                            if (!dup) {
                              setWires(prev => [...prev, {
                                id: genId(),
                                fromComp: wiringFrom.compId,
                                fromTerm: wiringFrom.term,
                                toComp: comp.id,
                                toTerm: tName,
                              }]);
                              onInteract?.();
                            }
                            setWiringFrom(null);
                          }
                        } else {
                          if (!svgRef.current) return;
                          const svgPos = toSVGCoords(e, svgRef.current);
                          const absPos = { x: comp.x + tOff.x, y: comp.y + tOff.y };
                          setWiringFrom({ compId: comp.id, term: tName, pos: absPos });
                          setDragging(null);
                        }
                      }}
                      title={tName}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* ── Result overlays ──────────────────────────────────────── */}
          {renderResultOverlays()}
        </svg>

        {/* Wiring mode indicator */}
        {wiringFrom && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow">
            <MoveUpRight className="h-3 w-3" />
            Click another terminal to complete wire — or press Escape to cancel
          </div>
        )}

        {/* Selected wire actions */}
        {selectedWire && (
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-white border shadow rounded-lg px-2 py-1">
            <span className="text-xs text-muted-foreground">Wire selected</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 text-xs px-2"
              onClick={() => { setWires(w => w.filter(x => x.id !== selectedWire)); setSelectedWire(null); }}
              data-testid="button-delete-wire"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={`text-xs flex items-center gap-2 px-1 ${statusLine.color}`}>
        {result ? <Zap className="h-3 w-3 shrink-0" /> : <ZapOff className="h-3 w-3 shrink-0" />}
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
        if (!def) return null;
        const baseDef = COMPONENT_DEFS[selectedComp.kind];
        const editableProps = Object.entries(selectedComp.props).filter(([k]) => {
          const raw = baseDef?.defaultProps?.[k];
          return typeof raw === "number";
        });

        return (
          <div className="border rounded-lg p-3 bg-muted/20 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: def.color }}>{def.label}</span>
                <Badge variant="outline" className="text-[10px]">{def.category}</Badge>
                {baseDef?.description && (
                  <span className="text-muted-foreground text-xs">{baseDef.description}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-destructive hover:text-destructive"
                onClick={() => {
                  setComps(c => c.filter(x => x.id !== selected));
                  setWires(w => w.filter(x => x.fromComp !== selected && x.toComp !== selected));
                  setSelected(null);
                }}
                data-testid="button-delete-component"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {editableProps.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {editableProps.map(([key, val]) => {
                  const editKey = `${selectedComp.id}:${key}`;
                  const displayVal = propEdit[editKey] ?? String(val);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="text-xs capitalize min-w-fit">{key}</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-28 h-7 text-xs font-mono"
                        value={displayVal}
                        onChange={e => updateProp(selectedComp.id, key, e.target.value)}
                        onBlur={() => {
                          setPropEdit(prev => {
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
                {/* Toggle for switch */}
                {selectedComp.kind === "switch" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setComps(prev => prev.map(c =>
                      c.id === selectedComp.id
                        ? { ...c, props: { ...c.props, closed: !c.props.closed } }
                        : c,
                    ))}
                    data-testid="button-toggle-switch"
                  >
                    {selectedComp.props.closed ? "Open switch" : "Close switch"}
                  </Button>
                )}
              </div>
            )}
            {/* Live node readings for selected component */}
            {result && def.terminals && (
              <div className="flex flex-wrap gap-3 pt-1 border-t text-xs font-mono">
                {Object.entries(def.terminals).map(([t]) => {
                  const node = nodeMap.get(`${selectedComp.id}:${t}`) ?? 0;
                  const v = result.nodeVoltages[node];
                  if (!isFinite(v)) return null;
                  return (
                    <span key={t} className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{t}:</span>{" "}
                      {formatSI(v, "V")} (node {node})
                    </span>
                  );
                })}
                {(() => {
                  const cur = selectedComp.kind === "battery"
                    ? result.vsourceCurrents[selectedComp.id]
                    : result.resistorCurrents[selectedComp.id];
                  if (cur === undefined || !isFinite(cur)) return null;
                  return (
                    <span className="text-blue-600 font-semibold">
                      I = {formatSI(Math.abs(cur), "A")}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {/* Concept-only hint when no solver result after wiring */}
      {engineMode === "concept-only" && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            This is an exploration canvas. Place and connect components to visualize the circuit.
            DC solver results appear for batteries, resistors, and LEDs. Logic and transistor
            components are visual — sketch the circuit, then explain how it works in your reflection below.
          </span>
        </div>
      )}
    </div>
  );
}
