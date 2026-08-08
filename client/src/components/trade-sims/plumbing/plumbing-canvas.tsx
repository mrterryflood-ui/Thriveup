import { useCallback, useMemo, useState } from "react";
import {
  PLUMBING_COMPONENT_DEFS,
  PLUMBING_COMPONENT_KINDS,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Play, RotateCcw, Plus, Droplets } from "lucide-react";
import {
  PipeSizeSelect,
  HeadInput,
  isDiameterProp,
  isHeadProp,
  propLabel,
} from "@/components/trade-sims/plumbing/plumbing-prop-inputs";

export interface PlumbingCanvasProps {
  initialComponents?: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  onChange?: (state: {
    components: PlacedPlumbingComponent[];
    lastSolve: FlowSolveResult | null;
  }) => void;
  compact?: boolean;
}

function genId() {
  return `p_${Math.random().toString(36).slice(2, 9)}`;
}

// Unit helpers — solver is SI; learners need ft/psi/gpm.
const M3S_TO_GPM = 15850.323; // 1 m^3/s ≈ 15850.32 gpm
const M_TO_PSI = 1.42233; // 1 m of water head ≈ 1.4223 psi
const M_TO_FT = 3.28084;

function fmtFlow(qm3s: number): string {
  const gpm = qm3s * M3S_TO_GPM;
  return `${qm3s.toExponential(2)} m³/s · ${gpm.toFixed(2)} gpm`;
}
function fmtHead(hm: number): string {
  return `${hm.toFixed(2)} m · ${(hm * M_TO_PSI).toFixed(1)} psi · ${(hm * M_TO_FT).toFixed(1)} ft`;
}

function defaultNodesFor(kind: PlumbingComponentKind, idx: number): Record<string, string> {
  const def = PLUMBING_COMPONENT_DEFS[kind];
  const out: Record<string, string> = {};
  def.terminals.forEach((t, i) => {
    // Give each terminal a unique starter node; learner edits to wire them.
    out[t.name] = `n${idx}_${i}`;
  });
  return out;
}

export function PlumbingCanvas({ initialComponents, onChange, compact = false }: PlumbingCanvasProps) {
  const [components, setComponents] = useState<PlacedPlumbingComponent[]>(() =>
    (initialComponents ?? []).map((c, i) => ({
      id: genId(),
      kind: c.kind as PlumbingComponentKind,
      terminalNodes: defaultNodesFor(c.kind as PlumbingComponentKind, i),
      props: { ...PLUMBING_COMPONENT_DEFS[c.kind as PlumbingComponentKind].defaultProps, ...(c.props ?? {}) },
    })),
  );
  const [result, setResult] = useState<FlowSolveResult | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  const emit = useCallback(
    (next: PlacedPlumbingComponent[], r: FlowSolveResult | null) => {
      onChange?.({ components: next, lastSolve: r });
    },
    [onChange],
  );

  const addComponent = (kind: PlumbingComponentKind) => {
    const def = PLUMBING_COMPONENT_DEFS[kind];
    const next: PlacedPlumbingComponent[] = [
      ...components,
      {
        id: genId(),
        kind,
        terminalNodes: defaultNodesFor(kind, components.length),
        props: { ...def.defaultProps },
      },
    ];
    setComponents(next);
    setResult(null);
    setSolveError(null);
    emit(next, null);
  };

  const removeComponent = (id: string) => {
    const next = components.filter((c) => c.id !== id);
    setComponents(next);
    setResult(null);
    setSolveError(null);
    emit(next, null);
  };

  const updateProp = (id: string, key: string, value: number | boolean) => {
    const next = components.map((c) =>
      c.id === id ? { ...c, props: { ...c.props, [key]: value } } : c,
    );
    setComponents(next);
  };

  const updateTerminalNode = (id: string, terminal: string, node: string) => {
    // Fallback to a per-component-per-terminal unique placeholder so an empty
    // input does NOT accidentally short two unrelated components onto the
    // same global "n0" node (architect-review finding, May 17 2026).
    const trimmed = node.trim() || `${id}_${terminal}`;
    const next = components.map((c) =>
      c.id === id ? { ...c, terminalNodes: { ...c.terminalNodes, [terminal]: trimmed } } : c,
    );
    setComponents(next);
  };

  const run = () => {
    setSolveError(null);
    if (components.length === 0) {
      setSolveError("Empty network. Add a Tank (sets pressure), at least one pipe, and a fixture.");
      setResult(null);
      emit(components, null);
      return;
    }
    const { pipes, junctions } = placedToSolverElements(components);
    const out: FlowSolveResult | FlowSolveError = solveFlow({ pipes, junctions });
    if (!out.ok) {
      setSolveError(out.error);
      setResult(null);
      emit(components, null);
      return;
    }
    setResult(out);
    emit(components, out);
  };

  const reset = () => {
    setComponents([]);
    setResult(null);
    setSolveError(null);
    emit([], null);
  };

  // Group palette by category.
  const palette = useMemo(() => {
    const groups: Record<string, PlumbingComponentKind[]> = {};
    PLUMBING_COMPONENT_KINDS.forEach((k) => {
      const cat = PLUMBING_COMPONENT_DEFS[k].category;
      (groups[cat] ||= []).push(k);
    });
    return groups;
  }, []);

  // Precompute head losses for the result card.
  const headLossPerPipe = useMemo(() => {
    if (!result) return {} as Record<string, number>;
    const { pipes } = placedToSolverElements(components);
    const out: Record<string, number> = {};
    for (const p of pipes) {
      const q = result.flows[p.id] ?? 0;
      out[p.id] = pipeHeadLoss(p, q);
    }
    return out;
  }, [result, components]);

  return (
    <div className="space-y-4">
      {/* Palette */}
      <Card data-testid="card-palette-plumbing">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Plumbing Palette
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
                    data-testid={`button-add-${k}`}
                  >
                    + {PLUMBING_COMPONENT_DEFS[k].label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Canvas / placed components */}
      <Card data-testid="card-canvas-plumbing">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4" /> Network ({components.length} component{components.length === 1 ? "" : "s"})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={reset} data-testid="button-reset-plumbing">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={run} data-testid="button-run-plumbing">
              <Play className="h-4 w-4 mr-1" /> Run
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8" data-testid="text-canvas-empty-plumbing">
              Empty network. Add a <strong>Tank / Reservoir</strong> (a fixed-pressure source — water main, storage
              tank, or street pressure), connect a <strong>Pipe</strong> from the tank's node to a{" "}
              <strong>Sink / Toilet / Shower</strong> fixture, then click Run. Two terminals share the same junction
              when you give them the same node label.
            </div>
          ) : (
            <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {components.map((c) => {
                const def = PLUMBING_COMPONENT_DEFS[c.kind];
                return (
                  <div
                    key={c.id}
                    className="border rounded-md p-3 bg-card"
                    data-testid={`row-component-${c.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{def.label}</Badge>
                        <span className="text-xs text-muted-foreground">{c.id.slice(0, 6)}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeComponent(c.id)}
                        data-testid={`button-remove-${c.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

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
                              data-testid={`input-prop-${c.id}-${k}`}
                            />
                          </div>
                        );
                      }
                      if (typeof v === "number" && isDiameterProp(k)) {
                        return (
                          <div key={k} className="flex items-center gap-2 my-1">
                            <Label className="text-xs flex-1">{propLabel(k)}</Label>
                            <PipeSizeSelect
                              valueM={Number(c.props[k] ?? v)}
                              onChangeM={(m) => updateProp(c.id, k, m)}
                              testIdPrefix={`input-prop-${c.id}-${k}`}
                            />
                          </div>
                        );
                      }
                      if (typeof v === "number" && isHeadProp(k)) {
                        return (
                          <div key={k} className="flex items-center gap-2 my-1">
                            <Label className="text-xs flex-1">{propLabel(k)}</Label>
                            <HeadInput
                              valueM={Number(c.props[k] ?? v)}
                              onChangeM={(m) => updateProp(c.id, k, m)}
                              defaultUnit={k === "pumpHead" ? "ft" : "psi"}
                              testIdPrefix={`input-prop-${c.id}-${k}`}
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
                              className="h-7 text-xs w-32 font-mono"
                              value={Number(c.props[k] ?? v)}
                              onChange={(e) => updateProp(c.id, k, Number(e.target.value))}
                              data-testid={`input-prop-${c.id}-${k}`}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Terminals → node IDs (strings) */}
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Wire to nodes (same label = same junction):
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {def.terminals.map((t) => (
                          <div key={t.name} className="flex items-center gap-1">
                            <Label className="text-xs flex-1">{t.name}</Label>
                            <Input
                              type="text"
                              className="h-7 text-xs w-20 font-mono"
                              value={c.terminalNodes[t.name] ?? ""}
                              onChange={(e) => updateTerminalNode(c.id, t.name, e.target.value)}
                              data-testid={`input-node-${c.id}-${t.name}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {solveError && (
        <Card className="border-destructive" data-testid="card-solve-error-plumbing">
          <CardContent className="pt-4 text-sm text-destructive">{solveError}</CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card data-testid="card-solve-result-plumbing">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Flow Result
              <Badge variant="outline" className="ml-2 text-xs font-mono">
                {result.iterations} iter · residual {result.residual.toExponential(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="font-semibold mb-1">Junction Heads (pressure)</div>
              <div className="space-y-1">
                {Object.entries(result.heads).map(([id, h]) => (
                  <div key={id} className="flex items-center gap-2 font-mono text-xs" data-testid={`text-head-${id}`}>
                    <Badge variant="outline" className="font-mono">{id}</Badge>
                    <span>{fmtHead(h)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Pipe / Element Flows</div>
              <div className="space-y-1">
                {components.map((c) => {
                  const def = PLUMBING_COMPONENT_DEFS[c.kind];
                  const q = result.flows[c.id];
                  if (q === undefined) return null;
                  const closed = result.closedOneWays?.includes(c.id) ?? false;
                  const direction = closed
                    ? "🛑 backflow blocked"
                    : Math.abs(q) < 1e-12
                      ? "no flow"
                      : q > 0
                        ? "→ forward"
                        : "← reverse";
                  const loss = headLossPerPipe[c.id];
                  return (
                    <div
                      key={c.id}
                      className="font-mono text-xs flex flex-wrap items-center gap-2"
                      data-testid={`text-flow-${c.id}`}
                    >
                      <Badge variant="secondary">{def.label}</Badge>
                      <span>{c.id.slice(0, 6)}</span>
                      <span>{fmtFlow(Math.abs(q))}</span>
                      <Badge variant={closed ? "destructive" : Math.abs(q) < 1e-12 ? "outline" : "default"}>
                        {direction}
                      </Badge>
                      {loss !== undefined && Math.abs(loss) > 1e-6 && !closed && (
                        <span className="text-muted-foreground">
                          Δh = {loss.toFixed(3)} m
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Positive flow = direction defined by the component (pipe a→b, pump in→out, check_valve in→out).
              {result.closedOneWays && result.closedOneWays.length > 0 && (
                <>
                  {" "}
                  <strong className="text-destructive">
                    {result.closedOneWays.length} check valve{result.closedOneWays.length === 1 ? "" : "s"} closed
                    to prevent backflow.
                  </strong>{" "}
                  This usually means the valve is installed in the wrong direction or the network has no forward
                  driving head — fix orientation or add pressure.
                </>
              )}
              {result.warnings && result.warnings.length > 0 && (
                <span className="block mt-1 text-amber-600" data-testid="text-solver-warnings">
                  {result.warnings.map((w, i) => (
                    <span key={i} className="block">⚠ {w}</span>
                  ))}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PlumbingCanvas;
