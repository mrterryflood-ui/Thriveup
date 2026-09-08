/**
 * Shared community brief viewer.
 * Route: /brief/:shareId (public, no auth required)
 *
 * Fetches GET /api/conductor/community-brief/share/:shareId and renders
 * the community-impact view components with the cached data.
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Globe, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CommunityEvidencePanel } from "@/components/community-evidence-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Urgency styling (mirrors community-impact.tsx) ────────────────────────────
const URGENCY_CONFIG: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  stable:  { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-100 text-emerald-800" },
  watch:   { bg: "bg-amber-50 dark:bg-amber-950/30",   text: "text-amber-700 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-800",   badge: "bg-amber-100 text-amber-800" },
  concern: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 text-orange-800" },
  crisis:  { bg: "bg-red-50 dark:bg-red-950/30",       text: "text-red-700 dark:text-red-400",       border: "border-red-200 dark:border-red-800",       badge: "bg-red-100 text-red-800" },
};

function fmt$(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function fmtPct(n: number): string {
  return `${Number(n).toFixed(1)}%`;
}

type ThreeRealitiesDiagnostic = {
  researchReality?: { summary?: string; citations?: string[] };
  politicalReality?: { summary?: string; barriers?: string[] };
  groundTruth?: { observationCount?: number; themes?: string[]; summary?: string };
  gapDiagnosis?: { primaryGap?: string; cfirDomain?: string | null; ericStrategy?: string | null };
};

// ── Demographics table ────────────────────────────────────────────────────────
function DemographicsPanel({ demographics }: { demographics: Record<string, any> }) {
  const rows: [string, string][] = [];
  if (demographics.totalPopulation != null) rows.push(["Total Population", Number(demographics.totalPopulation).toLocaleString()]);
  if (demographics.povertyRate != null) rows.push(["Poverty Rate", fmtPct(demographics.povertyRate)]);
  if (demographics.uninsuredRate != null) rows.push(["Uninsured Rate", fmtPct(demographics.uninsuredRate)]);
  if (demographics.housingCostBurden != null) rows.push(["Housing Cost Burden", fmtPct(demographics.housingCostBurden)]);
  if (demographics.unemploymentRate != null) rows.push(["Unemployment Rate", fmtPct(demographics.unemploymentRate)]);
  if (demographics.noHighSchoolDiploma != null) rows.push(["No High School Diploma", fmtPct(demographics.noHighSchoolDiploma)]);
  if (demographics.medianIncome != null) rows.push(["Median Household Income", `$${Number(demographics.medianIncome).toLocaleString()}`]);

  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-bold mb-3">Demographics</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, val], i) => (
              <tr key={label} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                <td className="px-4 py-2 font-medium">{label}</td>
                <td className="px-4 py-2 text-right">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

// ── Systems scores ────────────────────────────────────────────────────────────
function SystemsPanel({ scores }: { scores: Record<string, any> }) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-bold mb-3">Systems Scores</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {entries.map(([key, d]: [string, any]) => {
          const cfg = URGENCY_CONFIG[d.urgency] ?? URGENCY_CONFIG.watch;
          return (
            <Card key={key} className={`p-3 border ${cfg.border} ${cfg.bg}`}>
              <div className="font-semibold text-sm">{d.label ?? key}</div>
              <div className="text-2xl font-bold mt-1">{d.grade ?? "—"} <span className="text-sm font-normal text-muted-foreground">{d.score}/100</span></div>
              <Badge className={`text-[10px] px-1.5 py-0.5 mt-1 ${cfg.badge}`}>{String(d.urgency ?? "").toUpperCase()}</Badge>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// ── Cascade cost summary ──────────────────────────────────────────────────────
function CascadePanel({ cascade }: { cascade: Record<string, any> }) {
  const metrics: [string, string][] = [];
  if (cascade.counterfactualCost != null) metrics.push(["Cost of Inaction (no investment)", fmt$(cascade.counterfactualCost)]);
  if (cascade.interventionCost != null) metrics.push(["Cost of Evidence-Based Investment", fmt$(cascade.interventionCost)]);
  if (cascade.netSavings != null) metrics.push(["Net Savings", fmt$(cascade.netSavings)]);
  if (cascade.roi != null) metrics.push(["Return on Investment", String(cascade.roi)]);
  if (metrics.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-bold mb-3">25-Year Cost Cascade</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {metrics.map(([label, val], i) => (
              <tr key={label} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                <td className="px-4 py-2 font-medium">{label}</td>
                <td className="px-4 py-2 text-right font-semibold">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BriefSharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [activeTab, setActiveTab] = useState("brief");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/api/conductor/community-brief/share", shareId],
    queryFn: async () => {
      const res = await fetch(`/api/conductor/community-brief/share/${shareId}`);
      if (!res.ok) {
        let msg = "Failed to load shared brief.";
        try { msg = (await res.json()).error ?? msg; } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    enabled: !!shareId,
    retry: false,
  });
  const threeRealitiesGeographyKey = data?.geography?.zip ?? data?.geography?.countyFips ?? data?.geography?.geographyKey ?? "";
  const { data: threeRealities, isLoading: threeRealitiesLoading } = useQuery<ThreeRealitiesDiagnostic>({
    queryKey: ["/api/three-realities", threeRealitiesGeographyKey],
    queryFn: async () => {
      const res = await fetch(`/api/three-realities/${encodeURIComponent(threeRealitiesGeographyKey)}`);
      if (!res.ok) throw new Error("Failed to load Three Realities assessment");
      return res.json();
    },
    enabled: !!threeRealitiesGeographyKey && activeTab === "three-realities",
    retry: false,
  });

  useEffect(() => {
    if (data) {
      const name = data.geography?.displayName ?? shareId;
      document.title = `${name} — Community Brief | TCAF`;
    }
  }, [data, shareId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading shared community brief…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Brief not found</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message ?? "This shared link is invalid or has expired. Links are valid for 30 days."}
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <a href="/community-impact" className="text-sm text-primary hover:underline">
            ← Generate a new community brief
          </a>
        </div>
      </div>
    );
  }

  const geo = data.geography ?? {};
  const displayName = geo.displayName ?? geo.input ?? "Community";
  const overallScore = data.overallScore ?? null;
  const overallGrade = data.overallGrade ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 text-white">
        <div className="px-6 py-5">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-semibold">Community Brief — Shared via TCAF</div>
          <h1 className="text-2xl font-black text-white">{displayName}</h1>
          {geo.state && <div className="text-slate-400 text-sm mt-0.5">{geo.state}{geo.countyName ? ` · ${geo.countyName}` : ""}{geo.zip ? ` · ZIP ${geo.zip}` : ""}</div>}
          {overallGrade && overallScore != null && (
            <div className="mt-3 flex gap-3 items-center">
              <div className="text-4xl font-black text-amber-400">{overallGrade}</div>
              <div className="text-slate-300 text-sm">{overallScore}/100 overall score</div>
            </div>
          )}
          {data.generatedAt && (
            <div className="text-xs text-slate-500 mt-2">
              Brief generated {new Date(data.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="brief">Community Brief</TabsTrigger>
          <TabsTrigger value="three-realities" data-testid="tab-brief-three-realities">Three Realities</TabsTrigger>
        </TabsList>
        <TabsContent value="brief" className="space-y-8">
      <CommunityEvidencePanel evidence={data.evidence} />

      {/* Narrative */}
      {(data.narrativeSummary ?? data.narrative) && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> Community Narrative
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {data.narrativeSummary ?? data.narrative}
          </p>
        </Card>
      )}

      {/* Demographics */}
      {data.demographics && <DemographicsPanel demographics={data.demographics} />}

      {/* Systems Scores */}
      {data.systemsScores && <SystemsPanel scores={data.systemsScores} />}

      {/* Cascade */}
      {data.cascade && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">TCAF scenario/model output — not an observed or Census-verified cost.</p>
          <CascadePanel cascade={data.cascade} />
        </div>
      )}

      {/* At-risk populations */}
      {Array.isArray(data.atRiskPopulations) && data.atRiskPopulations.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3">At-Risk Populations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.atRiskPopulations.map((p: any) => (
              <Card key={p.id} className="p-4">
                <div className="font-semibold text-sm">{p.name}</div>
                {p.estimated != null && (
                  <div className="text-2xl font-bold mt-0.5">
                    {Number(p.estimated).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{p.unit}</span>
                  </div>
                )}
                {p.primaryGap && <p className="text-xs text-muted-foreground mt-1">{p.primaryGap}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-8">
        <p>Powered by TCAF · <a href="https://thrivingcommunitiesforall.com" className="underline" target="_blank" rel="noopener noreferrer">thrivingcommunitiesforall.com</a></p>
        <p className="mt-1">This link expires 30 days from creation. See Evidence &amp; methodology for the exact geography, source, and claim type.</p>
        <p className="mt-2">
          <a href="/community-impact" className="text-primary hover:underline">Analyze your own community →</a>
        </p>
      </div>
        </TabsContent>
        <TabsContent value="three-realities" data-testid="tab-content-brief-three-realities">
          {!threeRealitiesGeographyKey ? (
            <Card className="p-5"><p className="text-sm text-muted-foreground">No geography is available for this shared brief.</p></Card>
          ) : threeRealitiesLoading ? (
            <Card className="p-5"><p className="text-sm text-muted-foreground">Loading assessment…</p></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Research Reality</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.researchReality?.summary ?? "No assessment yet"}</p>
                  {(threeRealities?.researchReality?.citations ?? []).map((citation, index) => <p key={index} className="text-xs text-muted-foreground">{citation}</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Political Reality</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.politicalReality?.summary ?? "No assessment yet"}</p>
                  {(threeRealities?.politicalReality?.barriers ?? []).map((barrier, index) => <p key={index} className="text-xs text-muted-foreground">{barrier}</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Ground Truth</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.groundTruth?.summary ?? "No assessment yet"}</p>
                  <p className="text-muted-foreground">{threeRealities?.groundTruth?.observationCount ?? 0} observations</p>
                  {(threeRealities?.groundTruth?.themes ?? []).map((theme, index) => <p key={index} className="text-xs text-muted-foreground">{theme}</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Gap Diagnosis</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.gapDiagnosis?.primaryGap ?? "Insufficient data for diagnosis"}</p>
                  <p className="text-muted-foreground">CFIR domain: {threeRealities?.gapDiagnosis?.cfirDomain ?? "Not identified"}</p>
                  <p className="text-muted-foreground">ERIC strategy: {threeRealities?.gapDiagnosis?.ericStrategy ?? "Not identified"}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
