import { useCallback, useMemo, useState } from "react";
import {
  COMPONENT_DEFS,
  COMPONENT_KINDS,
  ledIsLit,
  placedToSolverElements,
  type ComponentKind,
  type PlacedComponent,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Play, RotateCcw, Plus, Zap } from "lucide-react";

export interface CircuitCanvasProps {
  initialComponents?: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  onChange?: (state: { components: PlacedComponent[]; lastSolve: SolveOutput | null }) => void;
  compact?: boolean;
}

function genId() {
  return `c_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultNodesFor(kind: ComponentKind): Record<string, number> {
  const def = COMPONENT_DEFS[kind];
  const out: Record<string, number> = {};
  def.terminals.forEach((t, i) => {
    out[t.name] = i === 0 ? 1 : 0;
  });
  return out;
}

export function CircuitCanvas({ initialComponents, onChange, compact = false }: CircuitCanvasProps) {
  const [components, setComponents] = useState<PlacedComponent[]>(() =>
    (initialComponents ?? []).map((c) => ({
      id: genId(),
      kind: c.kind as ComponentKind,
      terminalNodes: defaultNodesFor(c.kind as ComponentKind),
      props: { ...COMPONENT_DEFS[c.kind as ComponentKind].defaultProps, ...(c.props ?? {}) },
    })),
  );
  const [result, setResult] = useState<SolveOutput | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  const emit = useCallback(
    (next: PlacedComponent[], r: SolveOutput | null) => {
      onChange?.({ components: next, lastSolve: r });
    },
    [onChange],
  );

  const addComponent = (kind: ComponentKind) => {
    const def = COMPONENT_DEFS[kind];
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
    setResult(null);
    emit(next, null);
  };

  const removeComponent = (id: string) => {
    const next = components.filter((c) => c.id !== id);
    setComponents(next);
    setResult(null);
    emit(next, null);
  };

  const updateProp = (id: string, key: string, value: number | boolean) => {
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

  const nodeCount = useMemo(() => {
    let max = 0;
    for (const c of components) {
      for (const n of Object.values(c.terminalNodes)) {
        if (n > max) max = n;
      }
    }
    return max + 1; // include ground 0
  }, [components]);

  const run = () => {
    setSolveError(null);
    const elements = components.flatMap(placedToSolverElements);
    if (elements.length === 0) {
      setSolveError("Add at least one component with a voltage source before running.");
      setResult(null);
      return;
    }
    const out = solveCircuit({ nodeCount, elements });
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

  // Group palette by category for UX.
  const palette = useMemo(() => {
    const groups: Record<string, ComponentKind[]> = {};
    COMPONENT_KINDS.forEach((k) => {
      const cat = COMPONENT_DEFS[k].category;
      (groups[cat] ||= []).push(k);
    });
    return groups;
  }, []);

  return (
    <div className="space-y-4">
      {/* Palette */}
      <Card data-testid="card-palette">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Component Palette
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
                    + {COMPONENT_DEFS[k].label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Canvas / placed components */}
      <Card data-testid="card-canvas">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" /> Circuit ({components.length} component{components.length === 1 ? "" : "s"})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={reset} data-testid="button-reset-canvas">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={run} data-testid="button-run-circuit">
              <Play className="h-4 w-4 mr-1" /> Run
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8" data-testid="text-canvas-empty">
              Empty canvas — add a battery + resistor from the palette above, wire them by giving the battery's "pos" terminal and the resistor's "a" terminal the same node number, then click Run.
            </div>
          ) : (
            <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {components.map((c) => {
                const def = COMPONENT_DEFS[c.kind];
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
                      if (typeof v === "number") {
                        return (
                          <div key={k} className="flex items-center gap-2 my-1">
                            <Label className="text-xs flex-1">
                              {k} {def.unit ? `(${def.unit})` : ""}
                            </Label>
                            <Input
                              type="number"
                              className="h-7 text-xs w-28"
                              value={Number(c.props[k] ?? v)}
                              onChange={(e) => updateProp(c.id, k, Number(e.target.value))}
                              data-testid={`input-prop-${c.id}-${k}`}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Terminals → node IDs */}
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
                              onChange={(e) => updateTerminalNode(c.id, t.name, Math.max(0, Math.floor(Number(e.target.value))))}
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

      {/* Results */}
      {solveError && (
        <Card className="border-destructive" data-testid="card-solve-error">
          <CardContent className="pt-4 text-sm text-destructive">{solveError}</CardContent>
        </Card>
      )}
      {result && (
        <Card data-testid="card-solve-result">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Solver Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="font-semibold mb-1">Node Voltages</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {result.nodeVoltages.map((v, i) => (
                  <div key={i} className="border rounded px-2 py-1" data-testid={`text-node-${i}`}>
                    <span className="text-muted-foreground">N{i}{i === 0 ? " (gnd)" : ""}: </span>
                    <span className="font-mono">{formatSI(v, "V")}</span>
                  </div>
                ))}
              </div>
            </div>
            {components.some((c) => placedToSolverElements(c).some((e) => e.kind === "resistor")) && (
              <div>
                <div className="font-semibold mb-1">Currents</div>
                <div className="space-y-1">
                  {components.map((c) => {
                    if (c.kind === "led") {
                      const an = result.nodeVoltages[c.terminalNodes.anode] ?? 0;
                      const ca = result.nodeVoltages[c.terminalNodes.cathode] ?? 0;
                      const lit = ledIsLit(an, ca, Number(c.props.forwardVoltage ?? 2));
                      const i = result.resistorCurrents[c.id] ?? 0;
                      return (
                        <div key={c.id} className="flex items-center gap-2" data-testid={`text-led-${c.id}`}>
                          <Badge variant={lit ? "default" : "outline"} className={lit ? "bg-yellow-400 text-black" : ""}>
                            {lit ? "LIT" : "off"}
                          </Badge>
                          <span className="font-mono">{COMPONENT_DEFS[c.kind].label}: {formatSI(i, "A")}</span>
                        </div>
                      );
                    }
                    if (c.kind === "resistor") {
                      const i = result.resistorCurrents[c.id] ?? 0;
                      const r = Number(c.props.resistance ?? 1000);
                      return (
                        <div key={c.id} className="font-mono text-xs" data-testid={`text-resistor-${c.id}`}>
                          Resistor {c.id.slice(0, 6)}: I = {formatSI(i, "A")}, P = {formatSI(resistorPower(i, r), "W")}
                        </div>
                      );
                    }
                    if (c.kind === "battery") {
                      const i = result.vsourceCurrents[c.id] ?? 0;
                      return (
                        <div key={c.id} className="font-mono text-xs" data-testid={`text-battery-${c.id}`}>
                          Battery {c.id.slice(0, 6)}: I = {formatSI(i, "A")}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CircuitCanvas;
