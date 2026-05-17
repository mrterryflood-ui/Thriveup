import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTO_COMPONENT_DEFS,
  AUTO_COMPONENT_KINDS,
  placedToSolverElements,
  type AdapterContext,
  type AutoComponentKind,
  type PlacedAutoComponent,
} from "@/lib/trade-sims/automotive/component-defs";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Play, RotateCcw, Plus, Car, Battery } from "lucide-react";

export interface AutoCanvasProps {
  initialComponents?: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  onChange?: (state: { components: PlacedAutoComponent[]; lastSolve: SolveOutput | null }) => void;
  compact?: boolean;
}

function genId() {
  return `a_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultNodesFor(kind: AutoComponentKind): Record<string, number> {
  const def = AUTO_COMPONENT_DEFS[kind];
  const out: Record<string, number> = {};
  def.terminals.forEach((t, i) => {
    // ground_point's single gnd terminal defaults to node 0; otherwise the
    // first terminal is node 1 and remaining terminals default to 0 (ground)
    // so a freshly-placed component is at least wired to ground.
    if (kind === "ground_point") {
      out[t.name] = 0;
    } else {
      out[t.name] = i === 0 ? 1 : 0;
    }
  });
  return out;
}

export function AutoCanvas({ initialComponents, onChange, compact = false }: AutoCanvasProps) {
  const [components, setComponents] = useState<PlacedAutoComponent[]>(() =>
    (initialComponents ?? []).map((c) => ({
      id: genId(),
      kind: c.kind as AutoComponentKind,
      terminalNodes: defaultNodesFor(c.kind as AutoComponentKind),
      props: { ...AUTO_COMPONENT_DEFS[c.kind as AutoComponentKind].defaultProps, ...(c.props ?? {}) },
    })),
  );
  // Live-solve: the solver re-runs on every component / prop / wiring change
  // so terminal voltage updates the moment a learner toggles a fuse, edits
  // internalResistance, or flips the alternator on. The explicit Run button
  // still exists to (a) signal real engagement to the lesson-completion gate
  // and (b) emit canvas state to the parent for the "hasRunSim" check.
  const visibleNodeCount = useMemo(() => {
    let max = 0;
    for (const c of components) {
      for (const n of Object.values(c.terminalNodes)) {
        if (n > max) max = n;
      }
    }
    return max + 1; // include ground 0
  }, [components]);

  const liveSolve = useMemo<{ result: SolveOutput | null; error: string | null }>(() => {
    if (components.length === 0) {
      return { result: null, error: null };
    }
    let counter = visibleNodeCount;
    const ctx: AdapterContext = { allocNode: () => counter++ };
    const elements = components.flatMap((c) => placedToSolverElements(c, ctx));
    if (elements.length === 0) {
      return {
        result: null,
        error: "Add at least one electrical-ish component (battery, alternator, starter, etc.) to see voltages.",
      };
    }
    const out = solveCircuit({ nodeCount: counter, elements });
    if (!out.ok) return { result: null, error: out.error };
    return { result: out, error: null };
  }, [components, visibleNodeCount]);

  const result = liveSolve.result;
  const solveError = liveSolve.error;

  const emit = useCallback(
    (next: PlacedAutoComponent[], r: SolveOutput | null) => {
      onChange?.({ components: next, lastSolve: r });
    },
    [onChange],
  );

  // Track whether the learner has explicitly pressed Run at least once on
  // the current circuit. That's the signal we forward to the lesson-player
  // gate; live-solve updates alone shouldn't unlock "Mark complete."
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const lastEmittedRef = useRef<SolveOutput | null>(null);

  // After an explicit Run, keep emitting fresh solve results as the learner
  // tweaks props so the parent's lastSolve always reflects what's on screen.
  useEffect(() => {
    if (!hasRunOnce) return;
    if (result === lastEmittedRef.current) return;
    lastEmittedRef.current = result;
    emit(components, result);
  }, [hasRunOnce, result, components, emit]);

  const addComponent = (kind: AutoComponentKind) => {
    const def = AUTO_COMPONENT_DEFS[kind];
    const next = [
      ...components,
      {
        id: genId(),
        kind,
        terminalNodes: defaultNodesFor(kind),
        props: { ...def.defaultProps },
      },
    ];
    setComponents(next);
  };

  const removeComponent = (id: string) => {
    const next = components.filter((c) => c.id !== id);
    setComponents(next);
  };

  const updateProp = (id: string, key: string, value: number | boolean | string) => {
    const next = components.map((c) =>
      c.id === id ? { ...c, props: { ...c.props, [key]: value } } : c,
    );
    setComponents(next);
  };

  const updateTerminalNode = (id: string, terminal: string, node: number) => {
    const next = components.map((c) =>
      c.id === id ? { ...c, terminalNodes: { ...c.terminalNodes, [terminal]: node } } : c,
    );
    setComponents(next);
  };

  const run = () => {
    setHasRunOnce(true);
    lastEmittedRef.current = result;
    emit(components, result);
  };

  const reset = () => {
    setComponents([]);
    setHasRunOnce(false);
    lastEmittedRef.current = null;
    emit([], null);
  };

  const palette = useMemo(() => {
    const groups: Record<string, AutoComponentKind[]> = {};
    AUTO_COMPONENT_KINDS.forEach((k) => {
      const cat = AUTO_COMPONENT_DEFS[k].category;
      (groups[cat] ||= []).push(k);
    });
    return groups;
  }, []);

  // Live terminal voltages: for every linear-dc source on the canvas, read
  // the node voltage at its + terminal. This is the whole point of Day 3 —
  // learners need to SEE sag, not infer it from current.
  const sourceTerminalVoltages = useMemo(() => {
    if (!result) return [];
    return components
      .filter((c) => c.kind === "car_battery" || c.kind === "alternator")
      .map((c) => {
        const posNode = c.terminalNodes.pos ?? 0;
        const negNode = c.terminalNodes.neg ?? 0;
        const vPos = result.nodeVoltages[posNode] ?? 0;
        const vNeg = result.nodeVoltages[negNode] ?? 0;
        const openCircuit = Number(c.props.voltage ?? 0);
        const terminal = vPos - vNeg;
        // Alternator that's off contributes nothing to the solver; report
        // the measured terminal voltage anyway so learners still see a live
        // readout (which will track the bus voltage the rest of the circuit
        // imposes on the alternator's wired-in terminals).
        const isOff = c.kind === "alternator" && !c.props.running;
        const sag = isOff ? 0 : openCircuit - terminal;
        const current = result.vsourceCurrents[`${c.id}_src`] ?? result.vsourceCurrents[c.id] ?? 0;
        return { comp: c, terminal, openCircuit, sag, current, isOff };
      });
  }, [result, components]);

  return (
    <div className="space-y-4">
      {/* Palette */}
      <Card data-testid="card-auto-palette">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Automotive Parts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(palette).map(([cat, kinds]) => (
            <div key={cat}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{cat}</div>
              <div className="flex flex-wrap gap-2">
                {kinds.map((k) => (
                  <Button
                    key={k}
                    variant="outline"
                    size="sm"
                    onClick={() => addComponent(k)}
                    data-testid={`button-add-auto-${k}`}
                  >
                    + {AUTO_COMPONENT_DEFS[k].label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Canvas / placed components */}
      <Card data-testid="card-auto-canvas">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" /> Vehicle Circuit ({components.length} part{components.length === 1 ? "" : "s"})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={reset} data-testid="button-reset-auto-canvas">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={run} data-testid="button-run-auto-circuit">
              <Play className="h-4 w-4 mr-1" /> Run
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8" data-testid="text-auto-canvas-empty">
              Empty canvas — add a 12 V battery, a fuse, a starter motor, and a chassis ground from the parts above. Wire them by giving connected terminals the same node number (use 0 for ground). Terminal voltage updates live as you toggle parts; press Run when you're ready to lock in the result.
            </div>
          ) : (
            <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {components.map((c) => {
                const def = AUTO_COMPONENT_DEFS[c.kind];
                // Live terminal-voltage chip on the source itself.
                const live = sourceTerminalVoltages.find((s) => s.comp.id === c.id);
                return (
                  <div
                    key={c.id}
                    className="border rounded-md p-3 bg-card"
                    data-testid={`row-auto-component-${c.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{def.label}</Badge>
                        <span className="text-xs text-muted-foreground">{c.id.slice(0, 6)}</span>
                        {def.engineRole === "concept-only" && (
                          <Badge variant="outline" className="text-[10px]">concept</Badge>
                        )}
                        {live && (
                          <Badge
                            className="bg-amber-500 hover:bg-amber-500 text-black font-mono"
                            data-testid={`badge-terminal-voltage-${c.id}`}
                          >
                            <Battery className="h-3 w-3 mr-1" />
                            V_term {formatSI(live.terminal, "V")}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeComponent(c.id)}
                        data-testid={`button-remove-auto-${c.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Sag readout, under the source */}
                    {live && (
                      <div
                        className="text-xs font-mono text-muted-foreground mb-2"
                        data-testid={`text-sag-${c.id}`}
                      >
                        {live.isOff ? (
                          <>off · measured terminal {formatSI(live.terminal, "V")} (alternator not running)</>
                        ) : (
                          <>Open-circuit {formatSI(live.openCircuit, "V")} · sag {formatSI(live.sag, "V")} · source current {formatSI(Math.abs(live.current), "A")}</>
                        )}
                      </div>
                    )}

                    {/* Editable props */}
                    {Object.entries(def.defaultProps).map(([k, v]) => {
                      if (typeof v === "boolean") {
                        return (
                          <div key={k} className="flex items-center gap-2 my-1">
                            <Label className="text-xs flex-1">{k}</Label>
                            <input
                              type="checkbox"
                              checked={Boolean(c.props[k])}
                              onChange={(e) => updateProp(c.id, k, e.target.checked)}
                              data-testid={`input-prop-auto-${c.id}-${k}`}
                            />
                          </div>
                        );
                      }
                      if (typeof v === "number") {
                        return (
                          <div key={k} className="flex items-center gap-2 my-1">
                            <Label className="text-xs flex-1">
                              {k} {def.unit ? `(${def.unit})` : ""}
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              className="h-7 text-xs w-28"
                              value={Number(c.props[k] ?? v)}
                              onChange={(e) => updateProp(c.id, k, Number(e.target.value))}
                              data-testid={`input-prop-auto-${c.id}-${k}`}
                            />
                          </div>
                        );
                      }
                      if (typeof v === "string") {
                        return (
                          <div key={k} className="flex items-center gap-2 my-1">
                            <Label className="text-xs flex-1">{k}</Label>
                            <Input
                              type="text"
                              className="h-7 text-xs w-28"
                              value={String(c.props[k] ?? v)}
                              onChange={(e) => updateProp(c.id, k, e.target.value)}
                              data-testid={`input-prop-auto-${c.id}-${k}`}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Terminals → node IDs */}
                    {def.terminals.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Wire to nodes (0 = ground):</div>
                        <div className="grid grid-cols-2 gap-1">
                          {def.terminals.map((t) => (
                            <div key={t.name} className="flex items-center gap-1">
                              <Label className="text-xs flex-1">{t.name}</Label>
                              <Input
                                type="number"
                                min={0}
                                className="h-7 text-xs w-16"
                                value={c.terminalNodes[t.name] ?? 0}
                                onChange={(e) =>
                                  updateTerminalNode(
                                    c.id,
                                    t.name,
                                    Math.max(0, Math.floor(Number(e.target.value))),
                                  )
                                }
                                data-testid={`input-node-auto-${c.id}-${t.name}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {solveError && (
        <Card className="border-destructive" data-testid="card-auto-solve-error">
          <CardContent className="pt-4 text-sm text-destructive">{solveError}</CardContent>
        </Card>
      )}
      {result && (
        <Card data-testid="card-auto-solve-result">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Solver Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {/* Terminal voltages summary — the headline of Day 3. */}
            {sourceTerminalVoltages.length > 0 && (
              <div>
                <div className="font-semibold mb-1">Terminal Voltages</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sourceTerminalVoltages.map((s) => {
                    const sagging = !s.isOff && s.sag > 0.1;
                    const cranking = !s.isOff && s.terminal < 9.6 && s.comp.kind === "car_battery";
                    return (
                      <div
                        key={s.comp.id}
                        className={`border rounded px-2 py-1 ${cranking ? "border-destructive" : sagging ? "border-amber-500" : ""}`}
                        data-testid={`text-terminal-voltage-${s.comp.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {AUTO_COMPONENT_DEFS[s.comp.kind].label} ({s.comp.id.slice(0, 6)})
                            {s.isOff && <span className="ml-1 text-[10px] uppercase">off</span>}
                          </span>
                          <span className="font-mono font-semibold">{formatSI(s.terminal, "V")}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {s.isOff
                            ? "alternator not running — terminal V tracks bus"
                            : <>open {formatSI(s.openCircuit, "V")} − sag {formatSI(s.sag, "V")}</>}
                          {cranking && <span className="text-destructive ml-1">⚠ below 9.6 V cranking floor</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold mb-1">Node Voltages</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {result.nodeVoltages.map((v, i) => (
                  <div key={i} className="border rounded px-2 py-1" data-testid={`text-auto-node-${i}`}>
                    <span className="text-muted-foreground">N{i}{i === 0 ? " (gnd)" : ""}: </span>
                    <span className="font-mono">{formatSI(v, "V")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold mb-1">Currents</div>
              <div className="space-y-1">
                {components.map((c) => {
                  if (c.kind === "starter_motor") {
                    const i = result.resistorCurrents[c.id] ?? 0;
                    const r = Number(c.props.resistance ?? 0.05);
                    return (
                      <div key={c.id} className="font-mono text-xs" data-testid={`text-auto-starter-${c.id}`}>
                        Starter {c.id.slice(0, 6)}: I = {formatSI(Math.abs(i), "A")}, P = {formatSI(resistorPower(i, r), "W")}
                      </div>
                    );
                  }
                  if (c.kind === "ignition_coil") {
                    const i = result.resistorCurrents[c.id] ?? 0;
                    return (
                      <div key={c.id} className="font-mono text-xs" data-testid={`text-auto-coil-${c.id}`}>
                        Coil {c.id.slice(0, 6)}: I_primary = {formatSI(Math.abs(i), "A")}
                      </div>
                    );
                  }
                  if (c.kind === "fuse" && !c.props.blown) {
                    const i = result.resistorCurrents[c.id] ?? 0;
                    const rated = Number(c.props.ratedAmps ?? 30);
                    const over = Math.abs(i) > rated;
                    return (
                      <div key={c.id} className="font-mono text-xs flex items-center gap-2" data-testid={`text-auto-fuse-${c.id}`}>
                        <span>Fuse {c.id.slice(0, 6)}: I = {formatSI(Math.abs(i), "A")} (rated {rated} A)</span>
                        {over && <Badge variant="destructive" className="text-[10px]">over rating</Badge>}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AutoCanvas;
