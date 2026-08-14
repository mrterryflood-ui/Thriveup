/**
 * Gun Violence Intelligence Hub
 *
 * A longitudinal story engine — not a dashboard.
 * Pulls from gun-violence-registry.replit.app (CDC 1999–2022, FBI 1960–present,
 * NCVS 1993–present, WISQARS, root causes, social determinants, policy DID,
 * RPLICE causal chains) and merges with local incident registry.
 */
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  AlertTriangle, TrendingDown, TrendingUp, DollarSign, Scale,
  Sparkles, ExternalLink, RefreshCw, ArrowRight, BookOpen,
  Activity, Globe, Users, MapPin, Printer,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined, decimals = 0) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: decimals });

const DIRECTION_COLOR: Record<string, string> = {
  increase: "text-rose-600",
  decrease: "text-emerald-600",
  mixed: "text-amber-600",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface IntelData {
  meta: { generatedAt: string };
  headline: {
    totalDeaths: number; totalHomicides: number; totalSuicides: number;
    peakYear: { year: number; deaths: number };
    latestYear: { year: number; totalDeaths: number; crudeRate: number };
  };
  cdcTrend: { year: number; totalDeaths: number; homicides: number; suicides: number; accidental: number; crudeRate: number }[];
  cdcStates: { state: string; stateCode: string; deaths: number; crudeRate: number; ageAdjustedRate: number }[];
  fbiTrends: { year: number; murderRate: number; violentCrimeRate: number }[];
  ncvsTrends: { year: number; firearmRate: number; ratePerThousand: number }[];
  wisqarsCosts: { year: number; totalMedicalCosts: number; totalWorkLossCosts: number; costPerFatalInjury: number }[];
  rootCauses: { factor: string; correlation: number; direction: string; description: string; interventions: string[] }[];
  socialDeterminants: { stateCode: string; stateName: string; povertyRate: number; medianIncome: number; giniCoefficient: number; mentalHealthProvidersPer100k: number }[];
  aces: { correlations: { aceFirearmR: number; povertyFirearmR: number }; interventions: { name: string; category: string; evidenceSummary: string; costPerLifeSaved: string; sourceUrl: string }[] };
  policy: { id: string; label: string; short_description: string; expected_direction: string; rand_url: string; literature_citations: string[] }[];
  rpliceFindings: { geography: string; timePeriod: string; payload: any }[];
  localRegistry: { total: number; victims: number; fatal: number; earliest: string; latest: string } | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatPill({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-72 w-full rounded-xl" />;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GunViolenceIntelligence() {
  const { toast } = useToast();
  // A CHW may arrive here via the Navigator's "Continue in Tell-a-Story" link
  // (?tab=story&geo=...&state=...) after already asking about neighborhood
  // safety — carry that context in so they don't have to re-enter it or ask twice.
  const initialParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialTab = initialParams?.get("tab") === "story" ? "story" : "arc";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [storyGeo, setStoryGeo] = useState(initialParams?.get("geo") ?? "");
  const [storyState, setStoryState] = useState(initialParams?.get("state") ?? "");
  const [storyFocus, setStoryFocus] = useState("");
  const [incidentFilter, setIncidentFilter] = useState("");
  const [incidentStateFilter, setIncidentStateFilter] = useState("all");
  const [generatedStory, setGeneratedStory] = useState<any>(null);
  const autoStoryRequested = useRef(false);

  const { data, isLoading, error, refetch } = useQuery<IntelData>({
    queryKey: ["/api/gun-violence/intelligence"],
    staleTime: 60 * 60 * 1000,
  });

  // Local incident data for the incident tab
  const { data: incidents } = useQuery<any[]>({
    queryKey: ["/api/gun-violence/incidents-local"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/gun-violence/summary?limit=500");
      const j = await r.json();
      return j.byZip ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const storyMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/gun-violence/story", {
        geography: storyGeo,
        state: storyState || undefined,
        focusArea: storyFocus || undefined,
      });
      return r.json();
    },
    onSuccess: (d) => {
      if (d.story) setGeneratedStory(d.story);
      else toast({ title: "Story generation returned unexpected format", variant: "destructive" });
    },
    onError: () => toast({ title: "Story generation failed", variant: "destructive" }),
  });

  // Auto-generate the story once when arriving with a carried-over geography
  // so the CHW lands on a populated report instead of an empty form.
  useEffect(() => {
    if (!autoStoryRequested.current && initialTab === "story" && storyGeo) {
      autoStoryRequested.current = true;
      storyMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-destructive">Failed to load intelligence data. The registry may be temporarily unavailable.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const h = data?.headline;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 pt-6 space-y-8">

      {/* ── Page header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-rose-500">Public Health Crisis</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Gun Violence Intelligence</h1>
        <p className="text-muted-foreground max-w-3xl">
          A longitudinal record of structural violence in America — grounded in CDC, FBI, NCVS, WISQARS,
          and RPLICE data, connected to your community's anchor agencies and CHW network.
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {data?.meta && <span>Updated {new Date(data.meta.generatedAt).toLocaleDateString()}</span>}
          <a href="https://gun-violence-registry.replit.app" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors">
            Gun Violence Registry <ExternalLink className="h-3 w-3" />
          </a>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Headline stats ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill
            label="Deaths since 1999"
            value={fmt(h?.totalDeaths)}
            sub="CDC WONDER, all intents"
            accent="text-rose-600"
          />
          <StatPill
            label="Homicides since 1999"
            value={fmt(h?.totalHomicides)}
            sub={`${h?.latestYear?.year ?? "—"} rate: ${h?.latestYear?.crudeRate ?? "—"}/100k`}
          />
          <StatPill
            label="Suicides since 1999"
            value={fmt(h?.totalSuicides)}
            sub="58% of all gun deaths"
          />
          <StatPill
            label="Peak year"
            value={String(h?.peakYear?.year ?? "—")}
            sub={`${fmt(h?.peakYear?.deaths)} deaths`}
            accent="text-amber-600"
          />
        </div>
      )}

      {/* ── ACE callout ── */}
      {data?.aces?.correlations && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800 p-4 flex gap-4 items-start">
          <Activity className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-rose-700 dark:text-rose-300">
              ACE Score → Gun Violence: r = {data.aces.correlations.aceFirearmR}
            </p>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-0.5">
              The strongest structural predictor in the dataset. Adverse Childhood Experiences explain more variance
              in firearm violence than poverty (r={data.aces.correlations.povertyFirearmR}) alone.
              This is the case for early intervention, not just enforcement.
            </p>
          </div>
        </div>
      )}

      {/* ── Main tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-xl">
          <TabsTrigger value="arc" className="text-xs rounded-lg"><TrendingDown className="h-3.5 w-3.5 mr-1" />The Long Arc</TabsTrigger>
          <TabsTrigger value="roots" className="text-xs rounded-lg"><Activity className="h-3.5 w-3.5 mr-1" />Root Causes</TabsTrigger>
          <TabsTrigger value="states" className="text-xs rounded-lg"><Globe className="h-3.5 w-3.5 mr-1" />State Landscape</TabsTrigger>
          <TabsTrigger value="cost" className="text-xs rounded-lg"><DollarSign className="h-3.5 w-3.5 mr-1" />Economic Weight</TabsTrigger>
          <TabsTrigger value="policy" className="text-xs rounded-lg"><Scale className="h-3.5 w-3.5 mr-1" />Policy Evidence</TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs rounded-lg"><MapPin className="h-3.5 w-3.5 mr-1" />Incident Registry</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs rounded-lg"><Activity className="h-3.5 w-3.5 mr-1" />Policy Timeline</TabsTrigger>
          <TabsTrigger value="story" className="text-xs rounded-lg"><Sparkles className="h-3.5 w-3.5 mr-1" />Tell a Story</TabsTrigger>
        </TabsList>

        {/* ── TAB: The Long Arc ── */}
        <TabsContent value="arc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gun Deaths by Type — CDC WONDER, 1999–2022</CardTitle>
              <p className="text-sm text-muted-foreground">
                24 years of national mortality data. Suicides consistently outnumber homicides.
                The 2020–2021 spike is the sharpest single-year rise since records began.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.cdcTrend ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <ReferenceLine x={2020} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "COVID", fontSize: 10 }} />
                    <Line type="monotone" dataKey="totalDeaths" name="Total" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="suicides" name="Suicides" stroke="#7c3aed" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="homicides" name="Homicides" stroke="#ea580c" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="accidental" name="Accidental" stroke="#0891b2" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">FBI Murder Rate — 1960–present</CardTitle>
              <p className="text-sm text-muted-foreground">
                65 years of UCR data. Rate per 100,000 population. The 1980 peak, the 1990s
                "crack epidemic" spike, the post-2000 decline, and the 2020 surge are all visible.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data?.fbiTrends ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="murderRate" name="Murder rate/100k" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">NCVS Firearm Victimization — 1993–present</CardTitle>
              <p className="text-sm text-muted-foreground">
                Survey-based — captures unreported violence the UCR misses.
                Rate per 1,000 persons age 12+.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data?.ncvsTrends ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="firearmRate" name="Firearm violence/1k" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Root Causes ── */}
        <TabsContent value="roots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Structural Correlates of Gun Violence</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pearson r with firearm homicide rate. These are not excuses — they are targets for intervention.
                Every r above 0.60 represents a modifiable upstream driver.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={[...(data?.rootCauses ?? [])].sort((a, b) => b.correlation - a.correlation)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, bottom: 5, left: 180 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} tickFormatter={v => `r=${v.toFixed(2)}`} />
                    <YAxis type="category" dataKey="factor" tick={{ fontSize: 11 }} width={175} />
                    <Tooltip formatter={(v: number) => `r = ${v.toFixed(3)}`} />
                    <Bar dataKey="correlation" name="Correlation" fill="#dc2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Root cause cards with interventions */}
          <div className="grid sm:grid-cols-2 gap-4">
            {(data?.rootCauses ?? []).slice(0, 6).map((rc) => (
              <Card key={rc.factor} className="border-l-4" style={{ borderLeftColor: rc.correlation > 0.65 ? "#dc2626" : rc.correlation > 0.5 ? "#ea580c" : "#0891b2" }}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{rc.factor}</p>
                    <Badge variant="outline" className="text-xs font-mono">r={rc.correlation.toFixed(2)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rc.description}</p>
                  <div className="space-y-1">
                    {rc.interventions.slice(0, 2).map((iv) => (
                      <div key={iv} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                        {iv}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ACE Interventions */}
          {(data?.aces?.interventions ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence-Based ACE Interventions</CardTitle>
                <p className="text-sm text-muted-foreground">RAND-grounded programs with cost-per-life-saved estimates.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data?.aces?.interventions ?? []).slice(0, 4).map((iv) => (
                  <div key={iv.name} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{iv.name}</p>
                        <Badge variant="secondary" className="text-xs mt-0.5">{iv.category}</Badge>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 text-right shrink-0 max-w-[160px]">{iv.costPerLifeSaved}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{iv.evidenceSummary}</p>
                    {iv.sourceUrl && (
                      <a href={iv.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB: State Landscape ── */}
        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">State-Level Gun Deaths — CDC, Most Recent Year</CardTitle>
              <p className="text-sm text-muted-foreground">51 states + DC. Crude rate per 100,000. Sortable.</p>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-96 w-full" /> : (
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="text-left py-2 pr-3 font-semibold">State</th>
                        <th className="text-right py-2 pr-3 font-semibold">Deaths</th>
                        <th className="text-right py-2 pr-3 font-semibold">Rate/100k</th>
                        <th className="text-right py-2 pr-3 font-semibold">Age-adj</th>
                        <th className="text-right py-2 pr-3 font-semibold">Poverty %</th>
                        <th className="text-right py-2 pr-3 font-semibold">Med. Income</th>
                        <th className="text-right py-2 pr-3 font-semibold">Gini</th>
                        <th className="text-right py-2 font-semibold">MH/100k</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(data?.cdcStates ?? [])]
                        .sort((a, b) => b.crudeRate - a.crudeRate)
                        .map((s) => {
                          const sdoh = data?.socialDeterminants?.find(d => d.stateCode === s.stateCode);
                          return (
                            <tr key={s.stateCode} className="border-b hover:bg-muted/40 transition-colors">
                              <td className="py-1.5 pr-3 font-medium">{s.state}</td>
                              <td className="text-right py-1.5 pr-3 tabular-nums">{fmt(s.deaths)}</td>
                              <td className={`text-right py-1.5 pr-3 tabular-nums font-semibold ${s.crudeRate >= 20 ? "text-rose-600" : s.crudeRate >= 15 ? "text-amber-600" : "text-emerald-600"}`}>
                                {s.crudeRate.toFixed(1)}
                              </td>
                              <td className="text-right py-1.5 pr-3 tabular-nums text-muted-foreground">{s.ageAdjustedRate.toFixed(1)}</td>
                              <td className="text-right py-1.5 pr-3 tabular-nums">{sdoh ? `${sdoh.povertyRate}%` : "—"}</td>
                              <td className="text-right py-1.5 pr-3 tabular-nums">{sdoh ? `$${(sdoh.medianIncome / 1000).toFixed(0)}k` : "—"}</td>
                              <td className="text-right py-1.5 pr-3 tabular-nums">{sdoh ? sdoh.giniCoefficient.toFixed(3) : "—"}</td>
                              <td className="text-right py-1.5 tabular-nums">{sdoh ? sdoh.mentalHealthProvidersPer100k : "—"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Economic Weight ── */}
        <TabsContent value="cost" className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
              <>
                <StatPill label="Cost per fatality (2021)" value={`$${fmt((data?.wisqarsCosts ?? []).at(-1)?.costPerFatalInjury)}`} sub="WISQARS economic burden" accent="text-rose-600" />
                <StatPill label="Medical costs (2021)" value={`$${fmt((data?.wisqarsCosts ?? []).at(-1)?.totalMedicalCosts)}M`} sub="Emergency + hospital care" />
                <StatPill label="Work-loss costs (2021)" value={`$${fmt((data?.wisqarsCosts ?? []).at(-1)?.totalWorkLossCosts)}M`} sub="Productivity, earnings lost" />
              </>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Economic Burden Over Time — WISQARS 2018–2021</CardTitle>
              <p className="text-sm text-muted-foreground">Medical and work-loss costs in millions of dollars. Cost per fatality in thousands.</p>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data?.wisqarsCosts ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}B`} />
                    <Tooltip formatter={(v: number) => `$${fmt(v)}M`} />
                    <Legend />
                    <Bar dataKey="totalMedicalCosts" name="Medical costs ($M)" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalWorkLossCosts" name="Work-loss costs ($M)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Policy Evidence ── */}
        <TabsContent value="policy" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Difference-in-differences causal inference from RAND Corporation gun policy research.
            Expected direction = what peer-reviewed literature finds.
          </p>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
          ) : (
            <div className="space-y-3">
              {(data?.policy ?? []).map((p) => (
                <Card key={p.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-sm">{p.label}</p>
                      <Badge className={`shrink-0 text-xs capitalize ${p.expected_direction === "increase" ? "bg-rose-100 text-rose-700 border-rose-300" : p.expected_direction === "decrease" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-amber-100 text-amber-700 border-amber-300"}`} variant="outline">
                        {p.expected_direction === "increase" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {p.expected_direction}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.short_description}</p>
                    {p.literature_citations?.length > 0 && (
                      <p className="text-xs text-muted-foreground italic">{p.literature_citations[0]}</p>
                    )}
                    {p.rand_url && (
                      <a href={p.rand_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 hover:underline">
                        RAND Research <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* RPLICE causal chains */}
          {(data?.rpliceFindings ?? []).length > 0 && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-base text-purple-700 dark:text-purple-300">RPLICE Causal Chains</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data!.rpliceFindings.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{f.geography}</Badge>
                      <span className="text-xs text-muted-foreground">{f.timePeriod}</span>
                    </div>
                    {f.payload?.chain && (
                      <div className="flex items-center gap-1 flex-wrap text-xs">
                        {(f.payload.chain as string[]).map((step, j) => (
                          <span key={j} className="flex items-center gap-1">
                            <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                              {step.replace(/_/g, " ")}
                            </span>
                            {j < f.payload.chain.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                          </span>
                        ))}
                        {f.payload.confidence && (
                          <span className="text-muted-foreground ml-1">confidence: {f.payload.confidence}</span>
                        )}
                      </div>
                    )}
                    {f.payload?.summary && (
                      <p className="text-xs text-muted-foreground">{f.payload.summary}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB: Incident Registry ── */}
        <TabsContent value="incidents" className="space-y-4">
          {data?.localRegistry && (
            <div className="grid grid-cols-3 gap-3">
              <StatPill label="Registry incidents" value={fmt(data.localRegistry.total)} sub="GVA-sourced" />
              <StatPill label="Total victims" value={fmt(data.localRegistry.victims)} />
              <StatPill label="Fatal" value={fmt(data.localRegistry.fatal)} accent="text-rose-600" />
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Filter by city…"
              value={incidentFilter}
              onChange={e => setIncidentFilter(e.target.value)}
              className="max-w-[200px] h-8 text-sm"
            />
            <Select value={incidentStateFilter} onValueChange={setIncidentStateFilter}>
              <SelectTrigger className="h-8 text-sm w-32">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {["IL", "TX", "CA", "NY", "FL", "OH", "GA", "NC", "PA", "TN", "MO", "LA", "WA", "MI", "SC", "KY"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">Date</th>
                      <th className="text-left py-2 px-3 font-semibold">City</th>
                      <th className="text-left py-2 px-3 font-semibold">State</th>
                      <th className="text-left py-2 px-3 font-semibold">Type</th>
                      <th className="text-right py-2 px-3 font-semibold">Victims</th>
                      <th className="text-right py-2 px-3 font-semibold">Fatal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-3 py-1"><Skeleton className="h-5 w-full" /></td></tr>
                    ))}
                    {/* We use the local summary endpoint; fallback to placeholder rows */}
                    {!isLoading && data?.localRegistry?.total === 0 && (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">No incidents in local registry yet. Run a sync to pull data.</td></tr>
                    )}
                  </tbody>
                </table>
                {/* Use the summary query hook for actual rows */}
                <IncidentRows filter={incidentFilter} stateFilter={incidentStateFilter} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Tell a Story ── */}
        {/* ── TAB: Policy Timeline ── */}
        <TabsContent value="timeline" className="space-y-4">
          <PolicyTimelineTab />
        </TabsContent>

        <TabsContent value="story" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Generate a Grounded Narrative
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                The AI synthesizes CDC, FBI, NCVS, WISQARS, root causes, SDOH, and your local registry
                into a trauma-informed, evidence-grounded story for a specific place.
                Use it for grant narratives, community presentations, or CHW conversation guides.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geography *</label>
                  <Input
                    value={storyGeo}
                    onChange={e => setStoryGeo(e.target.value)}
                    placeholder="Chicago's South Side, Cook County IL…"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">State code</label>
                  <Input
                    value={storyState}
                    onChange={e => setStoryState(e.target.value.toUpperCase())}
                    placeholder="IL"
                    maxLength={2}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Focus area (optional)</label>
                  <Input
                    value={storyFocus}
                    onChange={e => setStoryFocus(e.target.value)}
                    placeholder="youth violence prevention, housing…"
                    className="text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={() => storyMutation.mutate()}
                disabled={!storyGeo || storyMutation.isPending}
                className="gap-2"
              >
                {storyMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {storyMutation.isPending ? "Generating…" : "Generate Story"}
              </Button>
            </CardContent>
          </Card>

          {generatedStory && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold">{generatedStory.headline}</h2>
                  {generatedStory.subhead && (
                    <p className="text-muted-foreground mt-1">{generatedStory.subhead}</p>
                  )}
                </div>

                {generatedStory.keyNumbers?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {generatedStory.keyNumbers.map((kn: any, i: number) => (
                      <div key={i} className="rounded-lg border p-3">
                        <p className="text-lg font-bold tabular-nums">{kn.value}</p>
                        <p className="text-xs text-muted-foreground">{kn.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
                  {(generatedStory.body ?? []).map((para: string, i: number) => (
                    <p key={i} className="text-sm leading-relaxed">{para}</p>
                  ))}
                </div>

                {generatedStory.callToAction && (
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4">
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">{generatedStory.callToAction}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    const text = [generatedStory.headline, generatedStory.subhead, "", ...(generatedStory.body ?? []), "", generatedStory.callToAction].filter(Boolean).join("\n\n");
                    navigator.clipboard.writeText(text);
                    toast({ title: "Copied to clipboard" });
                  }}>
                    <BookOpen className="h-3.5 w-3.5" /> Copy text
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    const win = window.open("", "_blank");
                    if (!win) return;
                    const statsHtml = (generatedStory.keyNumbers ?? []).map((kn: any) =>
                      `<div class="stat"><div class="stat-value">${kn.value}</div><div class="stat-label">${kn.label}</div></div>`
                    ).join("");
                    const bodyHtml = (generatedStory.body ?? []).map((p: string) => `<p>${p}</p>`).join("");
                    win.document.write(`<!DOCTYPE html><html><head><title>${generatedStory.headline}</title><style>
body{font-family:Georgia,serif;max-width:740px;margin:48px auto;color:#111;line-height:1.75;padding:0 24px}
h1{font-size:26px;margin-bottom:6px;line-height:1.3}
.subhead{color:#555;font-size:15px;margin-bottom:28px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}
.stat{border:1px solid #ddd;border-radius:8px;padding:14px;text-align:center}
.stat-value{font-size:22px;font-weight:bold;color:#be123c}
.stat-label{font-size:11px;color:#666;margin-top:3px}
p{margin:14px 0}
.cta{background:#f5f0ff;border:1px solid #c084fc;border-radius:8px;padding:16px;margin-top:28px;font-weight:600;color:#6b21a8}
.footer{margin-top:48px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:14px}
@media print{body{margin:24px auto}}
</style></head><body>
<h1>${generatedStory.headline}</h1>
${generatedStory.subhead ? `<p class="subhead">${generatedStory.subhead}</p>` : ""}
${statsHtml ? `<div class="stats">${statsHtml}</div>` : ""}
${bodyHtml}
${generatedStory.callToAction ? `<div class="cta">${generatedStory.callToAction}</div>` : ""}
<div class="footer">Data sources: CDC WONDER &middot; FBI UCR &middot; NCVS &middot; WISQARS &middot; RPLICE &middot; GVA &mdash; TCAF Gun Violence Intelligence Hub &middot; Generated ${new Date().toLocaleDateString()}</div>
</body></html>`);
                    win.document.close();
                    win.print();
                  }}>
                    <Printer className="h-3.5 w-3.5" /> Download as PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setGeneratedStory(null)}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Incident table rows (separate component to avoid state entanglement) ──────
function IncidentRows({ filter, stateFilter }: { filter: string; stateFilter: string }) {
  const { data } = useQuery<any>({
    queryKey: ["/api/gun-violence/summary", { city: filter, state: stateFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter) params.set("city", filter);
      if (stateFilter !== "all") params.set("state", stateFilter);
      const r = await apiRequest("GET", `/api/gun-violence/summary?${params}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const rows: any[] = data?.rows ?? [];

  return (
    <table className="w-full text-xs">
      <tbody>
        {rows.slice(0, 200).map((row: any, i: number) => (
          <tr key={i} className="border-b hover:bg-muted/40 transition-colors">
            <td className="py-1.5 px-3 text-muted-foreground">{row.occurredAt ? new Date(row.occurredAt).toLocaleDateString() : "—"}</td>
            <td className="py-1.5 px-3 font-medium">{row.city ?? "—"}</td>
            <td className="py-1.5 px-3">{row.state ?? "—"}</td>
            <td className="py-1.5 px-3 capitalize">{row.incidentType?.replace(/_/g, " ") ?? "—"}</td>
            <td className="py-1.5 px-3 text-right tabular-nums">{row.victimCount ?? "—"}</td>
            <td className={`py-1.5 px-3 text-right tabular-nums font-semibold ${row.fatalCount > 0 ? "text-rose-600" : ""}`}>{row.fatalCount ?? 0}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground text-xs">No incidents match the current filter.</td></tr>
        )}
      </tbody>
    </table>
  );
}

// ── Policy Timeline sub-component ─────────────────────────────────────────────
// Calls GET /api/gun-violence/policy-timeline and renders a monthly/quarterly
// incident trend chart so policy analysts can correlate legislation with outcomes.
const TIMELINE_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

function PolicyTimelineTab() {
  const [tlState, setTlState] = useState("TX");
  const [tlGranularity, setTlGranularity] = useState<"month" | "quarter">("month");
  const [fromYear, setFromYear] = useState(String(new Date().getFullYear() - 3));
  const [toYear, setToYear] = useState(String(new Date().getFullYear()));
  const [queryKey, setQueryKey] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/api/gun-violence/policy-timeline", queryKey],
    queryFn: async () => {
      const params = new URLSearchParams({
        state: tlState,
        from: `${fromYear}-01-01`,
        to: `${toYear}-12-31`,
        granularity: tlGranularity,
      });
      const r = await fetch(`/api/gun-violence/policy-timeline?${params}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Timeline fetch failed");
      return r.json();
    },
    enabled: !!queryKey,
    staleTime: 5 * 60 * 1000,
  });

  const chartData: any[] = (data?.series ?? []).map((s: any) => ({
    period: s.period,
    incidents: s.incidents,
    victims: s.victims,
    fatalities: s.fatalities,
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Monthly or quarterly incident counts for a US state — use this to correlate legislation,
        policy changes, and community interventions with measured outcomes in your grant applications.
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">State *</label>
          <Select value={tlState} onValueChange={setTlState}>
            <SelectTrigger className="h-8 w-24 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMELINE_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input
            type="number" min="2015" max="2026" value={fromYear}
            onChange={e => setFromYear(e.target.value)}
            className="h-8 w-24 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input
            type="number" min="2015" max="2026" value={toYear}
            onChange={e => setToYear(e.target.value)}
            className="h-8 w-24 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Granularity</label>
          <Select value={tlGranularity} onValueChange={v => setTlGranularity(v as "month" | "quarter")}>
            <SelectTrigger className="h-8 w-28 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="h-8"
          onClick={() => setQueryKey(`${tlState}-${fromYear}-${toYear}-${tlGranularity}-${Date.now()}`)}
        >
          <Activity className="h-3.5 w-3.5 mr-1" /> Load Timeline
        </Button>
      </div>

      {/* Chart */}
      {!queryKey && (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground">
          Select a state and click Load Timeline to see the incident trend.
        </div>
      )}
      {queryKey && isLoading && <Skeleton className="h-72 w-full rounded-xl" />}
      {queryKey && error && (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      )}
      {queryKey && !isLoading && data && (
        <>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registry data for {tlState} in this date range.</p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {tlState} — {tlGranularity === "month" ? "Monthly" : "Quarterly"} Incidents ({fromYear}–{toYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) => v.slice(0, 7)}
                    />
                    <YAxis tick={{ fontSize: 10 }} width={32} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      labelFormatter={(v: string) => v.slice(0, 10)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="incidents" stroke="#f87171" strokeWidth={2} dot={false} name="Incidents" />
                    <Line type="monotone" dataKey="victims" stroke="#fb923c" strokeWidth={1.5} dot={false} name="Victims" />
                    <Line type="monotone" dataKey="fatalities" stroke="#dc2626" strokeWidth={2} dot={false} name="Fatalities" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Total incidents", value: data.totals?.incidents ?? 0 },
              { label: "Total victims", value: data.totals?.victims ?? 0 },
              { label: "Fatalities", value: data.totals?.fatalities ?? 0 },
            ].map(s => (
              <div key={s.label} className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
