import {
  BarChart3,
  BookOpen,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  Layers3,
  Map,
  Network,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildVisualIntelligenceHref,
  type VisualEvidenceClass,
  type VisualIntelligenceLens,
  type VisualIntelligenceObservation,
} from "@shared/visual-intelligence";

const LENSES: Array<{
  id: VisualIntelligenceLens;
  label: string;
  icon: typeof Map;
  path: string;
}> = [
  { id: "map", label: "Map", icon: Map, path: "/community-analysis" },
  { id: "data", label: "Data", icon: BarChart3, path: "/sdoh-explorer" },
  { id: "comparison", label: "Compare", icon: Network, path: "/community-compare" },
  { id: "resources", label: "Resources", icon: Layers3, path: "/community-map" },
  { id: "story", label: "Story", icon: FileText, path: "/community-impact" },
  { id: "impact", label: "Impact", icon: BookOpen, path: "/community-impact" },
];

const EVIDENCE_STYLES: Record<VisualEvidenceClass, string> = {
  observed: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  derived: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
  modeled: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  unavailable: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
};

function evidenceLabel(value: VisualEvidenceClass) {
  return value === "observed"
    ? "Observed"
    : value === "derived"
      ? "Derived"
      : value === "modeled"
        ? "Modeled"
        : "Unavailable";
}

export interface VisualIntelligenceShellProps {
  activeLens: VisualIntelligenceLens;
  geography?: string;
  geographyGrain?: string;
  title?: string;
  description?: string;
  observations: VisualIntelligenceObservation[];
  selectedLayers?: string[];
  onLayerChange?: (layerId: string) => void;
  className?: string;
}

export function VisualIntelligenceShell({
  activeLens,
  geography = "",
  geographyGrain,
  title = "Visual Intelligence",
  description = "One evidence-aware workspace for place, conditions, resources, comparison, story, and impact.",
  observations,
  selectedLayers = [],
  onLayerChange,
  className = "",
}: VisualIntelligenceShellProps) {
  const lensState = {
    geography,
    selectedLayers,
    comparisonGeographies: geography
      .split(" vs ")
      .map((value) => value.trim())
      .filter(Boolean),
  };

  return (
    <section className={`border-b bg-background ${className}`} data-testid="visual-intelligence-shell">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Evidence-aware workspace
              </span>
              {geographyGrain && (
                <Badge variant="outline" className="text-[10px]" data-testid="badge-geography-grain">
                  {geographyGrain}
                </Badge>
              )}
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{description}</p>
          </div>

          <nav aria-label="Visual intelligence views" className="flex flex-wrap gap-1.5">
            {LENSES.map(({ id, label, icon: Icon, path }) => {
              const href = buildVisualIntelligenceHref(path, {
                ...lensState,
                lens: id,
                view: id === "story" ? "story" : id === "impact" ? "impact" : undefined,
              });
              return (
                <a
                  key={id}
                  href={href}
                  aria-current={activeLens === id ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeLens === id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`link-visual-lens-${id}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </a>
              );
            })}
          </nav>
        </div>

        {onLayerChange && (
          <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="visual-layer-controls">
            <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Layers3 className="h-3.5 w-3.5" aria-hidden="true" /> Layers
            </span>
            {[
              ["svi", "SVI"],
              ["sdoh", "SDOH"],
              ["resources", "Resources"],
              ["relationships", "Relationships"],
              ["scenarios", "Scenarios"],
            ].map(([id, label]) => {
              const active = selectedLayers.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onLayerChange(id)}
                  aria-pressed={active}
                  className={`min-h-11 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`button-visual-layer-${id}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4" data-testid="visual-evidence-ledger">
          {observations.length === 0 ? (
            <Card className="border-dashed md:col-span-2 xl:col-span-4">
              <CardContent className="p-3 text-xs text-muted-foreground">
                No evidence has been loaded for this view yet.
              </CardContent>
            </Card>
          ) : observations.map((observation) => (
            <Card key={observation.id} className={`border ${EVIDENCE_STYLES[observation.evidenceClass]}`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {observation.evidenceClass === "observed" ? (
                      <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : observation.evidenceClass === "modeled" ? (
                      <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="truncate text-xs font-semibold">{observation.label}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {evidenceLabel(observation.evidenceClass)}
                  </Badge>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed">{observation.source}</p>
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] opacity-80">
                  <span>Grain: {observation.geography}</span>
                  <span>Vintage: {observation.vintage}</span>
                  <span>Status: {observation.status}</span>
                </div>
                {(observation.uncertainty || observation.disclosure) && (
                  <p className="mt-2 text-[10px] leading-relaxed opacity-80">
                    {observation.uncertainty || observation.disclosure}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}