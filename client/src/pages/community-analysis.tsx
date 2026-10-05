/**
 * Community Analysis Platform
 * Prompt-driven GIS + SDOH + Chainweb + 3D visualization.
 * Organizations type a plain-language prompt and get a full
 * multi-layer community intelligence map with AI synthesis.
 */
import { useState, useEffect } from "react";
import { parseJourneyContext, placeToZip } from "@shared/journey-context";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, CircleMarker, Popup, Rectangle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EvidenceSummary } from "@/components/evidence-label";
import { AIAugmentationDisclosure } from "@/components/ai-augmentation-disclosure";
import { VisualIntelligenceShell } from "@/components/gis/VisualIntelligenceShell";
import { parseVisualIntelligenceState } from "@shared/visual-intelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Brain, Zap, AlertTriangle, TrendingUp, Users,
  Building2, Heart, Shield, ChevronRight, Loader2, Search,
  Globe, ArrowRight, BarChart3, Network, Info, Download,
  CheckCircle2, Target, DollarSign, FlaskConical, BookOpen,
  ArrowUpDown, Lightbulb, Star, XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgMarker {
  id: string;
  name: string;
  type: string;
  services: string[];
  address: string;
  lat: number;
  lng: number;
  phone: string;
  languages: string[];
  capacity: number | null;
}

interface ChainwebLink {
  cause: string;
  effect: string;
  coefficient: number;
  direction: "positive" | "negative";
  magnitude: "high" | "medium" | "low";
  citation: string;
}

interface AnalysisResult {
  zip: string;
  center: { lat: number; lng: number };
  county: string;
  census: {
    population?: number;
    medianHouseholdIncome?: number;
    povertyRate?: number;
    unemploymentRate?: number;
    noHealthInsuranceRate?: number;
    noHighSchoolDiplomaRate?: number;
    housingCostBurdenRate?: number;
    percentMinority?: number;
    limitedEnglishProficiency?: number;
  };
  svi: {
    score?: number;
    theme1Socioeconomic?: number;
    theme2Household?: number;
    theme3Minority?: number;
    theme4Housing?: number;
    urgency: string;
  };
  orgs: OrgMarker[];
  chainwebLinks: ChainwebLink[];
  quadrants: { label: string; bounds: number[][] }[];
  aiAnalysis: {
    headline: string;
    sviSummary: string;
    topPriorities: { domain: string; urgency: string; finding: string; intervention: string }[];
    chainwebInsight: string;
    gisFindings: string;
    recommendations: string[];
    fundingAngles: string[];
  };
  evidence?: {
    geography?: { resolved?: { type?: string; key?: string }; disclosure?: string };
    sources?: Array<{ publisher?: string; dataset?: string; vintage?: string; status?: string }>;
    claims?: Record<string, { status?: string; disclosure?: string }>;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SVI_COLORS: Record<string, string> = {
  crisis:  "#ef4444",
  concern: "#f97316",
  watch:   "#f59e0b",
  stable:  "#10b981",
};

const ORG_COLORS: Record<string, string> = {
  "nonprofit":        "#7c3aed",
  "government":       "#1d4ed8",
  "health":           "#e11d48",
  "education":        "#0891b2",
  "workforce":        "#16a34a",
  "housing":          "#d97706",
  "faith":            "#9333ea",
  "default":          "#6b7280",
};

function orgColor(type: string) {
  const t = type.toLowerCase();
  for (const [key, color] of Object.entries(ORG_COLORS)) {
    if (t.includes(key)) return color;
  }
  return ORG_COLORS.default;
}

function urgencyLabel(u: string) {
  return { crisis: "Crisis", concern: "Concern", watch: "Watch", stable: "Stable" }[u] ?? u;
}

function pct(v?: number) { return v != null ? `${v}%` : "—"; }
function dollar(v?: number) { return v != null ? `$${v.toLocaleString()}` : "—"; }

// ── Map auto-fit helper ───────────────────────────────────────────────────────
function MapFocus({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [map, center]);
  return null;
}

// ── Quadrant overlay ─────────────────────────────────────────────────────────
function QuadrantOverlay({ quadrants }: { quadrants: AnalysisResult["quadrants"] }) {
  const colors = ["rgba(99,102,241,0.07)", "rgba(16,185,129,0.07)", "rgba(245,158,11,0.07)", "rgba(239,68,68,0.07)"];
  return (
    <>
      {quadrants.filter((q) =>
        q != null &&
        Array.isArray(q.bounds) &&
        q.bounds.length === 2 &&
        q.bounds.every((point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          point.every((coordinate) => Number.isFinite(coordinate)),
        ),
      ).map((q, i) => (
        <Rectangle
          key={q.label}
          bounds={q.bounds as [[number, number], [number, number]]}
          pathOptions={{ color: colors[i].replace("0.07", "0.5"), weight: 1.5, fillColor: colors[i], fillOpacity: 0.07, dashArray: "6 4" }}
        >
          <Popup>{q.label} quadrant</Popup>
        </Rectangle>
      ))}
    </>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function MapLegend() {
  return (
    <div className="absolute bottom-8 left-3 z-[1000] bg-background/95 border rounded-lg p-3 text-xs space-y-1.5 shadow">
      <p className="font-semibold text-foreground">SVI Hotspot</p>
      {Object.entries(SVI_COLORS).map(([k, c]) => (
        <div key={k} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: c }} />
          <span className="text-muted-foreground capitalize">{k}</span>
        </div>
      ))}
      <div className="border-t pt-1.5 mt-1">
        <p className="font-semibold text-foreground">Orgs</p>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-violet-600" /><span className="text-muted-foreground">Nonprofit</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-700" /><span className="text-muted-foreground">Government</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-600" /><span className="text-muted-foreground">Health</span></div>
      </div>
    </div>
  );
}

// ── Domain web data builder (from SVI themes) ────────────────────────────────
// ── Prompt suggestions ────────────────────────────────────────────────────────
const PROMPT_SUGGESTIONS = [
  "Show all community service orgs in each quadrant with SDOH hotspots overlaid on CDC SVI data",
  "Map food insecurity hotspots by poverty rate and identify which quadrant needs a food bank most",
  "Where should a new mental health clinic open to maximize impact using SVI and Chainweb data?",
  "Analyze workforce gaps by ZIP quadrant and link to education/income Chainweb ripple effects",
  "Show which SDOH factors create the highest cascade of negative outcomes per Chainweb evidence",
];

// ── Main component ────────────────────────────────────────────────────────────
// ── Intervention overlay types ────────────────────────────────────────────────
interface CfirFactor { construct: string; assessment: string; implication: string; }
interface ProjectedImpact { outcome: string; size: string; unit: string; localScale: string; }
interface MatchedProgram {
  id: string; name: string; shortName: string; domains: string[];
  targetPopulation: string; deliveryModel: string;
  effectSizes: { outcome: string; size: string; unit: string; citation: string }[];
  roiPerDollar?: number; whatWorked: string[]; whatFailed: string[];
  replicationQuality: string; clearinghouseRating: string; contactUrl?: string;
  projectedImpact: ProjectedImpact[];
  cfirAdaptation: CfirFactor[];
}
interface InterventionResult {
  zip: string; targetZip?: string;
  sourceProfile: { center?: any; population?: number; povertyRate?: number; sviScore?: number; lep?: number };
  targetProfile?: { center?: any; population?: number; povertyRate?: number; sviScore?: number; lep?: number } | null;
  matchedPrograms: MatchedProgram[];
  adaptationNarrative?: any;
}

export default function CommunityAnalysisPage() {
  const [location] = useLocation();
  const [zip, setZip] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [targetZip, setTargetZip] = useState("");
  const [interventionResult, setInterventionResult] = useState<InterventionResult | null>(null);
  const [showInterventions, setShowInterventions] = useState(false);
  const [visualLayers, setVisualLayers] = useState(["svi", "sdoh", "resources"]);
  const [tileError, setTileError] = useState(false);

  const mapLayerEnabled = (layer: "all" | "svi" | "orgs" | "quadrant") => {
    if (layer === "all") return ["svi", "sdoh", "resources", "relationships"].some((id) => visualLayers.includes(id));
    if (layer === "svi") return visualLayers.includes("svi") || visualLayers.includes("sdoh");
    if (layer === "orgs") return visualLayers.includes("resources");
    return visualLayers.includes("relationships");
  };

  const toggleMapLayer = (layer: "all" | "svi" | "orgs" | "quadrant") => {
    if (layer === "all") {
      setVisualLayers((current) =>
        ["svi", "sdoh", "resources", "relationships"].every((id) => current.includes(id))
          ? []
          : ["svi", "sdoh", "resources", "relationships"],
      );
      return;
    }
    const ids = layer === "svi" ? ["svi", "sdoh"] : layer === "orgs" ? ["resources"] : ["relationships"];
    setVisualLayers((current) => {
      const enabled = ids.some((id) => current.includes(id));
      return enabled ? current.filter((id) => !ids.includes(id)) : [...current, ...ids.filter((id) => !current.includes(id))];
    });
  };

  // Pre-fill ZIP from ?zip= query param (set by neighborhood-lookup "Deep Analysis" button)
  useEffect(() => {
    const visualState = parseVisualIntelligenceState(window.location.search);
    const qZip = visualState.geography;
    if (qZip && /^\d{5}$/.test(qZip)) {
      setZip(qZip);
    } else {
      const carriedZip = placeToZip(parseJourneyContext(window.location.search).place);
      if (carriedZip) setZip(carriedZip);
    }
    if (visualState.selectedLayers.length > 0) {
      setVisualLayers(visualState.selectedLayers);
    }
  }, []);

  const analyze = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("POST", "/api/community-intelligence/analyze", {
        prompt: prompt || undefined,
        zip,
      });
      if (!resp.ok) {
        let message = "Analysis failed";
        try {
          const err = await resp.json();
          if (typeof err?.error === "string") message = err.error;
        } catch {
          // Preserve the stable fallback when a proxy returns non-JSON.
        }
        throw new Error(message);
      }
      return resp.json() as Promise<AnalysisResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setInterventionResult(null);
      setShowInterventions(false);
    },
  });

  const interventionMutation = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("POST", "/api/community-intelligence/interventions", {
        zip,
        targetZip: targetZip.length === 5 ? targetZip : undefined,
      });
      if (!resp.ok) {
        let message = "Intervention analysis failed";
        try {
          const err = await resp.json();
          if (typeof err?.error === "string") message = err.error;
        } catch {
          // Preserve the stable fallback when a proxy returns non-JSON.
        }
        throw new Error(message);
      }
      return resp.json() as Promise<InterventionResult>;
    },
    onSuccess: (data) => {
      setInterventionResult(data);
      setShowInterventions(true);
    },
  });

  const center: [number, number] = result
    ? [result.center.lat, result.center.lng]
    : [30.267, -97.743]; // Austin default

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero / prompt input ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-medium tracking-wide uppercase">Community Intelligence Platform</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">
            GIS + SDOH Analysis — Any U.S. ZIP
          </h1>
          <p className="text-slate-300 text-sm mb-6 max-w-2xl">
            Type what you want to understand. The platform maps community service organizations,
            overlays CDC/ATSDR SVI hotspots, draws city quadrants, and runs Chainweb ripple analysis —
            then synthesizes everything with AI.
          </p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 w-32 min-h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  placeholder="ZIP code"
                  value={zip}
                  onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  maxLength={5}
                  data-testid="input-zip"
                />
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 min-h-11"
                onClick={() => analyze.mutate()}
                disabled={zip.length !== 5 || analyze.isPending}
                data-testid="button-analyze"
              >
                {analyze.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</>
                  : <><Search className="h-4 w-4 mr-2" /> Analyze</>}
              </Button>
            </div>

            <Textarea
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm resize-none focus:border-indigo-500"
              rows={2}
              placeholder="What do you want to understand about this community? (optional — leave blank for full SDOH profile)"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              data-testid="input-prompt"
            />

            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-xs text-slate-300 bg-slate-800/60 border border-slate-700 rounded-full px-3 py-1 min-h-11 hover:border-indigo-500 hover:text-white transition-colors"
                  data-testid={`button-suggestion-${i}`}
                >
                  {s.slice(0, 60)}…
                </button>
              ))}
            </div>
          </div>

          {analyze.isError && (
            <p className="mt-3 text-sm text-red-400" data-testid="text-error">
              {(analyze.error as Error).message}
            </p>
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <VisualIntelligenceShell
        activeLens="map"
        geography={result?.zip || zip}
        geographyGrain={result ? "Census ZCTA / ZIP request" : "Select a U.S. ZIP or county"}
        observations={[
          {
            id: "community-analysis-observed",
            label: "Place conditions",
            evidenceClass: result ? "observed" : "unavailable",
            geography: result?.evidence?.geography?.resolved?.type || "Requested ZIP",
            source: result?.evidence?.sources?.map((source) => `${source.publisher || "Source"} · ${source.dataset || "dataset"}`).join("; ") || "Source metadata unavailable",
            vintage: result?.evidence?.sources?.map((source) => source.vintage).filter(Boolean).join(", ") || "Provider vintage unavailable",
            status: result?.evidence?.claims?.observed?.status === "available" ? "available" : "unavailable",
            disclosure: result?.evidence?.claims?.observed?.disclosure || "Run an analysis to load source-backed observations.",
          },
          {
            id: "community-analysis-derived",
            label: "Evidence relationships",
            evidenceClass: result ? "derived" : "unavailable",
            geography: "Same resolved geography",
            source: "Calculated SVI/SDOH layer relationships and mapped service context",
            vintage: "Derived from available response",
            status: result?.evidence?.claims?.derived?.status === "available" ? "available" : "unavailable",
            uncertainty: "Relationships support investigation; correlation is not causal proof.",
          },
          {
            id: "community-analysis-modeled",
            label: "Intervention scenarios",
            evidenceClass: "modeled",
            geography: "Scenario scope follows the selected place",
            source: "RPLICE/CFIR intervention analysis and Chainweb decision support",
            vintage: "Scenario generated on request",
            status: result && showInterventions ? "available" : "partial",
            disclosure: "Projected or modeled values must not be read as observed outcomes.",
          },
          {
            id: "community-analysis-time",
            label: "Time and refresh",
            evidenceClass: result ? "observed" : "unavailable",
            geography: "Source-defined geography",
            source: "The provider-reported vintage is preserved instead of being replaced by the current calendar year.",
            vintage: result?.evidence?.sources?.map((source) => source.vintage).filter(Boolean).join(", ") || "Not loaded",
            status: result?.evidence?.sources?.some((source) => source.status === "available") ? "available" : "unavailable",
            uncertainty: "Historical snapshots are only shown where the source supplies that vintage.",
          },
        ]}
        selectedLayers={visualLayers}
        onLayerChange={(layerId) => {
          setVisualLayers((current) =>
            current.includes(layerId)
              ? current.filter((id) => id !== layerId)
              : [...current, layerId],
          );
          if (layerId === "scenarios") {
            setShowInterventions(true);
          }
        }}
      />

      {result && (
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
          <EvidenceSummary claims={[{
            value: result.census.population ?? null, unit: "residents", source: "U.S. Census Bureau ACS 5-Year 2022",
            sourceId: "census-acs5-2022", asOfDate: "2022-12-31", geographyKey: result.zip, confidence: "estimated",
            decisionCaption: "Use Census estimates with local knowledge when assessing community needs.",
          }]} />

          {/* AI headline */}
          <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground text-sm">{result.aiAnalysis.headline}</p>
                  <p className="text-sm text-muted-foreground mt-1">{result.aiAnalysis.sviSummary}</p>
                </div>
                <Badge
                  className="ml-auto shrink-0"
                  style={{ background: SVI_COLORS[result.svi.urgency], color: "#fff" }}
                  data-testid="badge-svi-urgency"
                >
                  {urgencyLabel(result.svi.urgency)} · SVI {result.svi.score?.toFixed(3)}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <AIAugmentationDisclosure
            compact
            drewFrom={["Community Census estimates", "CDC/ATSDR social vulnerability indicators", "mapped service organizations"]}
            doesNotKnow={["individual resident circumstances", "unreported local changes"]}
            verifyWith="Local partners and current community data"
          />

          {/* Map + analysis side by side */}
          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── GIS Map ─────────────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-2">
              {/* Layer toggles */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "svi", "orgs", "quadrant"] as const).map(layer => (
                  <Button
                    key={layer}
                    size="sm"
                    variant={mapLayerEnabled(layer) ? "default" : "outline"}
                    onClick={() => toggleMapLayer(layer)}
                    data-testid={`button-layer-${layer}`}
                  >
                    {layer === "all" ? "All Layers" : layer === "svi" ? "SVI Hotspots" : layer === "orgs" ? "Orgs" : "Quadrants"}
                  </Button>
                ))}
                <Badge variant="outline" className="ml-auto self-center">
                  {result.orgs.length} orgs mapped
                </Badge>
              </div>

              {/* Map */}
              <div className="relative rounded-xl overflow-hidden border shadow-lg" style={{ height: 520 }}>
                {tileError && (
                  <div
                    className="absolute top-3 left-3 right-3 z-[1000] rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
                    role="alert"
                    data-testid="banner-community-analysis-tile-error"
                  >
                    The map layer is unavailable right now, but analysis content still works.
                  </div>
                )}
                <MapContainer
                  center={center}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                    eventHandlers={{ tileerror: () => setTileError(true) }}
                  />
                  <MapFocus center={center} />

                  {/* SVI hotspot circle */}
                  {mapLayerEnabled("svi") && result.svi.score != null && (
                    <CircleMarker
                      center={center}
                      radius={Math.max(30, (result.svi.score * 60))}
                      pathOptions={{
                        color: SVI_COLORS[result.svi.urgency],
                        fillColor: SVI_COLORS[result.svi.urgency],
                        fillOpacity: 0.18,
                        weight: 2,
                      }}
                      data-testid="marker-svi-hotspot"
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <p className="font-bold">CDC/ATSDR SVI — ZIP {result.zip}</p>
                          <p>Overall score: <strong>{result.svi.score?.toFixed(3)}</strong> ({urgencyLabel(result.svi.urgency)})</p>
                          <p>Theme 1 (Socioeconomic): {result.svi.theme1Socioeconomic?.toFixed(3)}</p>
                          <p>Theme 2 (Household/Disability): {result.svi.theme2Household?.toFixed(3)}</p>
                          <p>Theme 3 (Minority/Language): {result.svi.theme3Minority?.toFixed(3)}</p>
                          <p>Theme 4 (Housing/Transport): {result.svi.theme4Housing?.toFixed(3)}</p>
                          <p className="text-gray-500">Source: U.S. Census ACS + CDC/ATSDR methodology</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}

                  {/* Poverty hotspot overlay */}
                  {mapLayerEnabled("svi") && result.census.povertyRate != null && (
                    <CircleMarker
                      center={center}
                      radius={Math.max(15, result.census.povertyRate * 1.8)}
                      pathOptions={{
                        color: "#f97316",
                        fillColor: "#f97316",
                        fillOpacity: 0.1,
                        weight: 1.5,
                        dashArray: "6 4",
                      }}
                    >
                      <Popup>
                        <p className="text-xs font-bold">Poverty hotspot</p>
                        <p className="text-xs">Rate: {pct(result.census.povertyRate)}</p>
                        <p className="text-xs">Uninsured: {pct(result.census.noHealthInsuranceRate)}</p>
                      </Popup>
                    </CircleMarker>
                  )}

                  {/* Quadrant overlay */}
                  {mapLayerEnabled("quadrant") && (
                    <QuadrantOverlay quadrants={result.quadrants} />
                  )}

                  {/* Org markers */}
                  {mapLayerEnabled("orgs") && result.orgs.map(org => (
                    <CircleMarker
                      key={org.id}
                      center={[org.lat, org.lng]}
                      radius={7}
                      pathOptions={{
                        color: orgColor(org.type),
                        fillColor: orgColor(org.type),
                        fillOpacity: 0.85,
                        weight: 1.5,
                      }}
                      data-testid={`marker-org-${org.id}`}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 max-w-[200px]">
                          <p className="font-bold text-sm">{org.name}</p>
                          <p className="text-gray-500 capitalize">{org.type}</p>
                          {org.address && <p>{org.address}</p>}
                          {org.phone && <p>📞 {org.phone}</p>}
                          {org.services.length > 0 && (
                            <p>Services: {org.services.slice(0, 3).join(", ")}</p>
                          )}
                          {org.languages.length > 0 && (
                            <p>Languages: {org.languages.slice(0, 3).join(", ")}</p>
                          )}
                          {org.capacity && <p>Capacity: {org.capacity}</p>}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
                <MapLegend />
              </div>

              {/* GIS finding */}
              {result.aiAnalysis.gisFindings && (
                <p className="text-xs text-muted-foreground px-1 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500" />
                  {result.aiAnalysis.gisFindings}
                </p>
              )}
            </div>

            {/* ── Right panel: stats + priorities + chainweb ───────────────── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Census stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" /> Census / SDOH Data — ZIP {result.zip}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Population", result.census.population?.toLocaleString()],
                      ["Median Income", dollar(result.census.medianHouseholdIncome)],
                      ["Poverty Rate", pct(result.census.povertyRate)],
                      ["Unemployment", pct(result.census.unemploymentRate)],
                      ["Uninsured", pct(result.census.noHealthInsuranceRate)],
                      ["No HS Diploma", pct(result.census.noHighSchoolDiplomaRate)],
                      ["Housing Burden", pct(result.census.housingCostBurdenRate)],
                      ["LEP Population", pct(result.census.limitedEnglishProficiency)],
                    ].map(([label, val]) => (
                      <div key={label as string} className="rounded bg-muted/40 p-2" data-testid={`stat-${(label as string).toLowerCase().replace(/\s+/g, "-")}`}>
                        <div className="font-semibold text-foreground">{val ?? "—"}</div>
                        <div className="text-muted-foreground text-[10px]">{label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Source: U.S. Census ACS · CDC/ATSDR SVI methodology
                  </p>
                </CardContent>
              </Card>

              {/* AI priorities */}
              {result.aiAnalysis.topPriorities.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-primary" /> Top Priorities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.aiAnalysis.topPriorities.map((p, i) => (
                      <div
                        key={i}
                        className="rounded-lg border p-2.5 text-xs"
                        data-testid={`priority-${i}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: SVI_COLORS[p.urgency] || "#6b7280" }}
                          />
                          <span className="font-semibold text-foreground capitalize">{p.domain}</span>
                          <Badge
                            className="ml-auto text-[10px] py-0"
                            style={{ background: SVI_COLORS[p.urgency] || "#6b7280", color: "#fff" }}
                          >
                            {urgencyLabel(p.urgency)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{p.finding}</p>
                        {p.intervention && (
                          <p className="text-indigo-600 dark:text-indigo-400 mt-1 flex items-start gap-1">
                            <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" /> {p.intervention}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {result.aiAnalysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" /> Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {result.aiAnalysis.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" data-testid={`recommendation-${i}`}>
                        <span className="shrink-0 font-bold text-indigo-600">{i + 1}.</span>
                        <span className="text-muted-foreground">{r}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Funding angles */}
              {result.aiAnalysis.fundingAngles.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-amber-600" /> Funding Angles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {result.aiAnalysis.fundingAngles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" data-testid={`funding-${i}`}>
                        <ChevronRight className="h-3 w-3 text-amber-600 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* ── Chainweb Panel ──────────────────────────────────────────────── */}
          {result.chainwebLinks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="h-5 w-5 text-primary" /> Chainweb — Evidence-Based Ripple Effects
                </CardTitle>
                {result.aiAnalysis.chainwebInsight && (
                  <p className="text-sm text-muted-foreground mt-1">{result.aiAnalysis.chainwebInsight}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {result.chainwebLinks.map((link, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3 text-xs space-y-1.5"
                      data-testid={`chainweb-link-${i}`}
                    >
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{ borderColor: link.direction === "positive" ? "#10b981" : "#ef4444", color: link.direction === "positive" ? "#10b981" : "#ef4444" }}
                        >
                          {link.magnitude}
                        </Badge>
                        <span className={`font-medium ${link.direction === "negative" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                          {link.direction === "positive" ? "↑" : "↓"} {Math.abs(link.coefficient).toFixed(2)}x
                        </span>
                      </div>
                      <p>
                        <span className="font-semibold text-foreground">{link.cause}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-semibold text-foreground">{link.effect}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{link.citation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── RPLICE Intervention Overlay ──────────────────────────────────── */}
          {result && (
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-indigo-500" />
                    Evidence-Based Intervention Overlay
                    <Badge variant="outline" className="text-[10px] font-bold tracking-wide">RPLICE · CFIR 2.0</Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Matches this community's SDOH profile to proven programs. Optionally add a target ZIP to see how they'd adapt cross-city.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      className="pl-8 w-32 h-8 text-sm"
                      placeholder="Target ZIP"
                      value={targetZip}
                      onChange={e => setTargetZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      maxLength={5}
                      data-testid="input-target-zip"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => interventionMutation.mutate()}
                    disabled={interventionMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    data-testid="button-run-interventions"
                  >
                    {interventionMutation.isPending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Analyzing…</>
                      : <><FlaskConical className="h-3.5 w-3.5 mr-1.5" /> Run Intervention Analysis</>}
                  </Button>
                </div>
              </div>

              {interventionMutation.isPending && (
                <div className="rounded-xl border bg-muted/30 p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-500 mb-3" />
                  <p className="text-sm font-medium">Running RPLICE implementation science analysis…</p>
                  <p className="text-xs text-muted-foreground mt-1">Matching SDOH profile to evidence base · Building CFIR 2.0 adaptation analysis{targetZip.length === 5 ? ` · Cross-city comparison to ZIP ${targetZip}` : ""}</p>
                </div>
              )}

              {interventionResult && showInterventions && (
                <div className="space-y-6">

                  {/* Cross-city comparison header */}
                  {interventionResult.targetProfile && (
                    <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowUpDown className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm font-semibold">Cross-City Adaptation: ZIP {interventionResult.zip} → ZIP {interventionResult.targetZip}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          {[
                            ["Source Poverty", interventionResult.sourceProfile.povertyRate != null ? `${interventionResult.sourceProfile.povertyRate}%` : "—"],
                            ["Target Poverty", interventionResult.targetProfile.povertyRate != null ? `${interventionResult.targetProfile.povertyRate}%` : "—"],
                            ["Source SVI", interventionResult.sourceProfile.sviScore?.toFixed(3) ?? "—"],
                            ["Target SVI", interventionResult.targetProfile.sviScore?.toFixed(3) ?? "—"],
                          ].map(([label, val]) => (
                            <div key={label} className="rounded-lg bg-background border p-2 text-center">
                              <div className="font-semibold text-sm">{val}</div>
                              <div className="text-muted-foreground text-[10px] mt-0.5">{label}</div>
                            </div>
                          ))}
                        </div>
                        {interventionResult.adaptationNarrative?.summary && (
                          <div className="mt-3 p-3 rounded-lg bg-background border text-xs leading-relaxed">
                            <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">AI Adaptation Analysis (CFIR 2.0 / RE-AIM)</p>
                            <p className="text-muted-foreground">{interventionResult.adaptationNarrative.summary}</p>
                          </div>
                        )}
                        {interventionResult.adaptationNarrative?.adaptationSteps?.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-semibold text-foreground">Adaptation Steps:</p>
                            <ul className="space-y-1">
                              {interventionResult.adaptationNarrative.adaptationSteps.map((step: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <ChevronRight className="h-3 w-3 shrink-0 mt-0.5 text-indigo-400" /> {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {interventionResult.adaptationNarrative?.fidelityWarnings?.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Fidelity Warnings:</p>
                            <ul className="space-y-1">
                              {interventionResult.adaptationNarrative.fidelityWarnings.map((w: string, i: number) => (
                                <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {interventionResult.adaptationNarrative?.fundingBridge && (
                          <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-xs">
                            <p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Funding Bridge:</p>
                            <p className="text-green-700 dark:text-green-400 mt-0.5">{interventionResult.adaptationNarrative.fundingBridge}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Matched evidence programs */}
                  {interventionResult.matchedPrograms.map((prog, pi) => (
                    <Card key={prog.id} className="overflow-hidden" data-testid={`card-program-${prog.id}`}>
                      <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900/40">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-base font-bold text-foreground">{prog.name}</span>
                              <Badge variant="secondary" className="text-[10px]">{prog.shortName}</Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${prog.replicationQuality === "strong" ? "border-green-500 text-green-700 dark:text-green-400" : "border-amber-500 text-amber-700 dark:text-amber-400"}`}
                              >
                                {prog.replicationQuality === "strong" ? "★ Strong Evidence" : "◇ Moderate Evidence"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{prog.clearinghouseRating}</p>
                          </div>
                          {prog.roiPerDollar && (
                            <div className="rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-700 px-3 py-1.5 text-center shrink-0">
                              <div className="text-lg font-black text-green-700 dark:text-green-400">${prog.roiPerDollar}</div>
                              <div className="text-[10px] text-green-600 dark:text-green-500">per $1 invested</div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prog.domains.map(d => (
                            <Badge key={d} variant="outline" className="text-[10px] capitalize">{d.replace("_", " ")}</Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-5">

                        {/* Effect sizes + local projection */}
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5 text-indigo-500" /> Effect Sizes — Projected to ZIP {interventionResult.zip}
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {prog.projectedImpact.map((impact, ii) => (
                              <div key={ii} className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1" data-testid={`impact-${prog.id}-${ii}`}>
                                <div className="font-semibold text-foreground">{impact.outcome}</div>
                                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{impact.size} {impact.unit}</div>
                                <div className="text-muted-foreground">{impact.localScale}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* CFIR adaptation factors */}
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-indigo-500" /> CFIR 2.0 Implementation Adaptation Factors
                          </p>
                          <div className="space-y-2">
                            {prog.cfirAdaptation.map((factor, fi) => (
                              <div key={fi} className={`rounded-lg border p-3 text-xs space-y-1 ${factor.construct.includes("Cross-City") ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/30" : ""}`}>
                                <p className="font-semibold text-foreground text-[11px]">{factor.construct}</p>
                                <p className="text-indigo-700 dark:text-indigo-300 italic">{factor.assessment}</p>
                                <p className="text-muted-foreground leading-relaxed">{factor.implication}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* What worked / what failed */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> What Worked (Fidelity Elements)
                            </p>
                            <ul className="space-y-1">
                              {prog.whatWorked.slice(0, 4).map((w, wi) => (
                                <li key={wi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-green-500" /> {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5" /> What Failed / Fidelity Risks
                            </p>
                            <ul className="space-y-1">
                              {prog.whatFailed.slice(0, 4).map((w, wi) => (
                                <li key={wi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <XCircle className="h-3 w-3 shrink-0 mt-0.5 text-red-400" /> {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Target population + delivery */}
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-3 text-xs space-y-1">
                          <p className="font-semibold text-foreground">Target Population:</p>
                          <p className="text-muted-foreground">{prog.targetPopulation}</p>
                          <p className="font-semibold text-foreground mt-2">Delivery Model:</p>
                          <p className="text-muted-foreground">{prog.deliveryModel}</p>
                          {prog.contactUrl && (
                            <a href={prog.contactUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline mt-1">
                              <ArrowRight className="h-3 w-3" /> Program website
                            </a>
                          )}
                        </div>

                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!result && !analyze.isPending && (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Globe className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Enter a ZIP code to begin</h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            The platform will pull live Census/CDC SVI data, map every community organization
            with known coordinates, overlay quadrant analysis, run Chainweb ripple calculations,
            and synthesize everything into an AI brief — all in one call.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-10 text-left">
            {[
              { icon: MapPin, label: "GIS Map", desc: "Service org markers, SVI hotspots, and city quadrant grid on Leaflet" },
              { icon: Network, label: "Chainweb", desc: "Evidence-based ripple links — which interventions cascade across SDOH domains" },
              { icon: Brain, label: "AI Synthesis", desc: "Headline finding, top priorities, recommendations, and funding angles" },
            ].map(item => (
              <div key={item.label} className="rounded-xl border p-4 space-y-2">
                <item.icon className="h-6 w-6 text-indigo-500" />
                <p className="font-semibold text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analyze.isPending && (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <Loader2 className="h-12 w-12 mx-auto text-indigo-500 animate-spin mb-4" />
          <p className="text-foreground font-semibold">Running community intelligence analysis…</p>
          <p className="text-muted-foreground text-sm mt-1">
            Geocoding ZIP · Fetching Census ACS + CDC SVI · Mapping orgs · Running Chainweb · Synthesizing with AI
          </p>
        </div>
      )}

    </div>
  );
}
