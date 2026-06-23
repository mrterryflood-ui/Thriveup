import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import {
  MapPin, Star, ChevronDown, DollarSign, GraduationCap, HeartPulse,
  ShieldAlert, Shield, Users, CheckCircle2, AlertTriangle, ArrowRight,
  Globe, Target, BarChart3, Search, Loader2, BookOpen, ExternalLink,
  Sparkles, Scale, Quote,
} from "lucide-react";

const CHAIN_ICONS: Record<string, any> = {
  "poverty": DollarSign, "education": GraduationCap, "benefit-gap": Shield,
  "health-insecurity": HeartPulse, "isolation": Users, "crime": ShieldAlert,
};

const CHAIN_COLORS: Record<string, string> = {
  "poverty": "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  "education": "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  "benefit-gap": "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  "health-insecurity": "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  "isolation": "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
  "crime": "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
};

const CHAIN_GAP = "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800";

function ChainCoverage({ initiatives, chainLinks }: { initiatives: any[]; chainLinks: any[] }) {
  const covered = new Set<string>();
  initiatives.forEach((i: any) => i.chainLinks?.forEach((l: string) => covered.add(l)));
  const coverageScore = chainLinks.length > 0 ? Math.round((covered.size / chainLinks.length) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">Evidence Chain Coverage</span>
        <span>{covered.size}/{chainLinks.length} links · {coverageScore}%</span>
      </div>
      <Progress value={coverageScore} className="h-1.5" />
      <div className="flex gap-1.5 flex-wrap">
        {chainLinks.map((link: any) => {
          const Icon = CHAIN_ICONS[link.id] || Shield;
          const ok = covered.has(link.id);
          return (
            <div key={link.id} title={ok ? `${link.label}: Addressed by at least one initiative` : `${link.label}: Gap — no dedicated program yet`}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-default ${ok ? CHAIN_COLORS[link.id] : CHAIN_GAP}`}>
              <Icon className="h-3 w-3" />
              {link.label.split(" ")[0]}
              {ok ? <CheckCircle2 className="h-3 w-3" /> : <span className="text-amber-600 dark:text-amber-400 text-xs font-bold ml-0.5">Gap</span>}
            </div>
          );
        })}
      </div>
      {covered.size < chainLinks.length && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {chainLinks.length - covered.size} gap{chainLinks.length - covered.size !== 1 ? "s" : ""} = {chainLinks.length - covered.size === 1 ? "an" : ""} opportunity{chainLinks.length - covered.size !== 1 ? "ies" : ""} for TCAF to lead where others haven't gone.
        </p>
      )}
    </div>
  );
}

function InitiativeCard({ initiative, chainLinks }: { initiative: any; chainLinks: any[] }) {
  const [open, setOpen] = useState(false);
  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    reduced: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
    failing: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    completed: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  };
  const sc = statusColors[initiative.status] || statusColors.active;
  return (
    <div className="border rounded-lg" data-testid={`initiative-${(initiative.name || "").toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`}>
      <button className="w-full text-left p-3" onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{initiative.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sc}`}>{initiative.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{initiative.years} · {initiative.funder} · {initiative.amount}</p>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 mt-0.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t pt-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Approach</p>
            <p className="text-sm mt-0.5">{initiative.approach}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Evidence</p>
            <p className="text-sm mt-0.5">{initiative.evidence}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Outcome</p>
            <p className="text-sm font-medium mt-0.5">{initiative.outcome}</p>
          </div>
          {initiative.chainLinks?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {initiative.chainLinks.map((linkId: string) => {
                const link = chainLinks.find((l: any) => l.id === linkId);
                const Icon = CHAIN_ICONS[linkId] || Shield;
                return (
                  <span key={linkId} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${CHAIN_COLORS[linkId]}`}>
                    <Icon className="h-3 w-3" /> {link?.label.split(" ")[0] || linkId}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CityCard({ city, chainLinks, isCompare, onToggle }: { city: any; chainLinks: any[]; isCompare: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(city.spotlight || false);
  return (
    <Card className={`transition-all ${city.spotlight ? "ring-2 ring-yellow-400 shadow-lg" : ""} ${isCompare && !city.spotlight ? "ring-2 ring-blue-400" : ""}`}
      data-testid={`card-city-${city.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <MapPin className={`h-5 w-5 shrink-0 mt-0.5 ${city.spotlight ? "text-yellow-500" : "text-muted-foreground"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{city.name}</CardTitle>
              {city.spotlight && <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Star className="h-3 w-3 mr-1" /> Proof Case</Badge>}
              <Badge variant="outline" className="text-xs">{city.state}</Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">{city.description}</CardDescription>
          </div>
          <Button variant={isCompare ? "default" : "outline"} size="sm" onClick={onToggle} data-testid={`button-compare-${city.id}`}
            className="shrink-0">
            {isCompare ? <><CheckCircle2 className="h-4 w-4 mr-1" /> In Comparison</> : <><Scale className="h-4 w-4 mr-1" /> Add to Compare</>}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Story — the human reason this matters */}
        {city.story && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{city.story}</p>
            </div>
          </div>
        )}

        <ChainCoverage initiatives={city.initiatives || []} chainLinks={chainLinks} />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{city.initiatives?.length || 0} initiatives tracked</span>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="ml-auto h-7 text-xs">
            {expanded ? "Collapse" : "See initiatives, strengths & gaps"}
            <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {expanded && (
          <>
            <div className="space-y-2">
              {city.initiatives?.map((init: any, i: number) => (
                <InitiativeCard key={i} initiative={init} chainLinks={chainLinks} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                </p>
                <ul className="space-y-0.5">
                  {city.strengths?.map((s: string, i: number) => <li key={i} className="text-xs">{s}</li>)}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Gaps
                </p>
                <ul className="space-y-0.5">
                  {city.gaps?.map((g: string, i: number) => <li key={i} className="text-xs">{g}</li>)}
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CompareMatrix({ cities, chainLinks, censusData, loading }: { cities: any[]; chainLinks: any[]; censusData: Record<string, any>; loading: boolean }) {
  const hasCensus = Object.keys(censusData).length > 0;
  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading live Census data in the background…
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm" data-testid="table-city-comparison">
          <thead className="bg-muted/40">
            <tr className="border-b">
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-40">SDOH Chain Link</th>
              {cities.map(city => (
                <th key={city.id} className="text-center p-3 text-xs font-semibold min-w-32">
                  <div className="flex flex-col items-center gap-1">
                    {city.spotlight && <Star className="h-3 w-3 text-yellow-500" />}
                    <span>{city.name.split("(")[0].trim()}</span>
                    <Badge variant="outline" className="text-xs">{city.state}</Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chainLinks.map((link: any) => {
              const Icon = CHAIN_ICONS[link.id] || Shield;
              return (
                <tr key={link.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">{link.label}</span>
                    </div>
                  </td>
                  {cities.map(city => {
                    const covered = new Set<string>();
                    city.initiatives?.forEach((init: any) => init.chainLinks?.forEach((l: string) => covered.add(l)));
                    const isCovered = covered.has(link.id);
                    const programs = city.initiatives?.filter((init: any) => init.chainLinks?.includes(link.id)) || [];
                    const census = censusData[city.id];
                    let metric: number | null = null;
                    if (census?.summary) {
                      if (link.id === "poverty") metric = census.summary.avgPoverty;
                      if (link.id === "benefit-gap") metric = census.summary.gapRate;
                      if (link.id === "health-insecurity") metric = census.summary.avgUninsured;
                      if (link.id === "isolation") metric = census.summary.avgNoBroadband;
                    }
                    return (
                      <td key={city.id} className="p-3 text-center">
                        {isCovered ? (
                          <div className="space-y-1">
                            <Badge className="text-xs">{programs.length} prog{programs.length !== 1 ? "s" : ""}</Badge>
                            {metric !== null && (
                              <p className={`text-xs font-mono ${metric > (link.threshold || 20) ? "text-red-600 font-bold" : "text-green-600"}`}>
                                {Math.round(metric * 10) / 10}{link.unit}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">Gap</Badge>
                            {metric !== null && (
                              <p className={`text-xs font-mono ${metric > (link.threshold || 20) ? "text-red-600 font-bold" : "text-green-600"}`}>
                                {Math.round(metric * 10) / 10}{link.unit}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="border-t-2 bg-muted/20">
              <td className="p-3 text-xs font-bold">Total Coverage</td>
              {cities.map(city => {
                const covered = new Set<string>();
                city.initiatives?.forEach((init: any) => init.chainLinks?.forEach((l: string) => covered.add(l)));
                const pct = Math.round((covered.size / chainLinks.length) * 100);
                return (
                  <td key={city.id} className="p-3 text-center">
                    <span className={`font-bold text-sm ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                      {covered.size}/{chainLinks.length} ({pct}%)
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr className="border-t">
              <td className="p-3 text-xs font-medium text-muted-foreground">Initiatives tracked</td>
              {cities.map(city => (
                <td key={city.id} className="p-3 text-center text-sm font-semibold">{city.initiatives?.length || 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {!hasCensus && !loading && (
        <p className="text-xs text-muted-foreground text-center">
          Live Census enrichment (poverty rates, uninsured %) will appear above once data loads.
        </p>
      )}

      {/* City stories side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cities.map(city => city.story && (
          <Card key={city.id} className="bg-slate-50 dark:bg-slate-900/40">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold text-sm">{city.name.split("(")[0].trim()}</span>
                {city.spotlight && <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 mr-1 text-yellow-500" /> Proof Case</Badge>}
              </div>
              <div className="flex items-start gap-2">
                <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{city.story}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const LESSONS = [
  { source: "Chicago (IL)", lesson: "Illinois achieves 82% SNAP participation — highest among major states", implication: "Systematic enrollment works. Co-locate at every touchpoint, simplify applications, fund dedicated enrollment staff.", chain: "benefit-gap", status: "replicate" },
  { source: "Houston (TX)", lesson: "Houston Food Bank reaches 800K+ people but only converts 15% to enrollment", implication: "Volume without conversion is waste. TCAF's CHW-driven model must measure enrollment conversion, not just contacts.", chain: "benefit-gap", status: "avoid" },
  { source: "Chicago (READI)", lesson: "READI Chicago RCT: participants 79% less likely to be shot, 43% fewer violent crime arrests", implication: "Transitional jobs + trauma-informed CBT = the only credible model for breaking the violence chain. Upstream SDOH investment prevents the conditions that create crime.", chain: "crime", status: "replicate" },
  { source: "Dallas (TX)", lesson: "Parkland CHAP CHW program reduced ER use by 35% in target neighborhoods", implication: "Place-based CHW deployment works. TCAF should target the 198 high-barrier tracts, not spray across 501.", chain: "health-insecurity", status: "replicate" },
  { source: "Detroit (MI)", lesson: "Michigan Bridges program achieved 40% self-sufficiency with coaching model — then its funding was cut in 2023", implication: "Benefits enrollment alone isn't enough — pair with coaching. And advocate for sustained funding: programs that work get cut anyway.", chain: "poverty", status: "replicate" },
  { source: "Rio Grande Valley (TX)", lesson: "CHW/Promotora model reduced A1C by 1.5 points AND increased SNAP enrollment 25%", implication: "Cultural competency is the multiplier. TCAF must embed bilingual CHWs in mixed-status neighborhoods.", chain: "isolation", status: "replicate" },
  { source: "Mississippi Delta", lesson: "55% SNAP participation — lowest in US. No state investment in enrollment outreach", implication: "Without political will and funded enrollment infrastructure, gaps persist for decades. This is what happens without intervention.", chain: "benefit-gap", status: "warning" },
  { source: "Atlanta (GA)", lesson: "Georgia rejected full Medicaid expansion until 2024 partial. 2-1-1 referrals have limited follow-through", implication: "Referral without follow-up is not enrollment. TCAF's system must track from screening → application → enrollment → renewal.", chain: "health-insecurity", status: "avoid" },
  { source: "Appalachia (KY)", lesson: "Kentucky kynect ACA marketplace is national model — uninsured dropped from 20% to 6%", implication: "State-level systems matter. TCAF should pursue HHSC CPP Level 1 certification to be part of Texas's official enrollment infrastructure.", chain: "health-insecurity", status: "replicate" },
];

export default function CityComparisonPage() {
  const [tab, setTab] = useState("cities");
  const [compareIds, setCompareIds] = useState<string[]>(["austin-metro"]);
  const [censusData, setCensusData] = useState<Record<string, any>>({});
  const [censusLoading, setCensusLoading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["/api/benefits/city-comparison"] });
  const result = data as any;
  const cities = result?.cities || {};
  const chainLinks = result?.evidenceChain || [];
  const cityList = Object.values(cities) as any[];

  const compareCities = useMemo(() =>
    compareIds.map(id => cities[id]).filter(Boolean),
    [compareIds, cities]
  );

  const toggleCompare = (cityId: string) => {
    setCompareIds(prev => {
      if (prev.includes(cityId)) return prev.filter(id => id !== cityId);
      const next = [...prev, cityId];
      if (next.length >= 2) setTab("compare");
      return next;
    });
  };

  // Auto-load census data when compare cities change
  useEffect(() => {
    if (compareCities.length < 2) return;
    const missing = compareCities.filter(c => !censusData[c.id] && c.stateFips && c.counties?.length);
    if (missing.length === 0) return;
    setCensusLoading(true);
    Promise.all(missing.map(city =>
      fetch(`/api/benefits/sdoh-explorer/live?state=${city.stateFips}&counties=${city.counties.slice(0, 4).join(",")}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d ? { id: city.id, data: d } : null)
        .catch(() => null)
    )).then(results => {
      const newData = { ...censusData };
      results.forEach(r => {
        if (!r) return;
        const vals = Object.values(r.data.counties || {}) as any[];
        newData[r.id] = {
          ...r.data,
          summary: {
            ...r.data.summary,
            avgPoverty: vals.length ? Math.round(vals.reduce((s: number, c: any) => s + (c.avgPoverty || 0), 0) / vals.length * 10) / 10 : 0,
            avgUninsured: vals.length ? Math.round(vals.reduce((s: number, c: any) => s + (c.avgUninsured || 0), 0) / vals.length * 10) / 10 : 0,
            avgNoBroadband: vals.length ? Math.round(vals.reduce((s: number, c: any) => s + (c.avgNoBroadband || 0), 0) / vals.length * 10) / 10 : 0,
          },
        };
      });
      setCensusData(newData);
      setCensusLoading(false);
    });
  }, [JSON.stringify(compareIds)]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50/30 dark:from-indigo-950/20 dark:via-background dark:to-blue-950/10"
      data-testid="city-comparison-page">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 text-sm px-3 py-1">
            <Globe className="h-3.5 w-3.5 mr-1.5" /> Nationwide Evidence Comparison
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-page-title">
            What Every U.S. City Has Already Tried
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Austin Metro is the proof case. Every other city tells us what to replicate — and what to avoid.
            Each city card shows a real story, real programs, and where the gaps are.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Click <strong>Add to Compare</strong> on any two cities — the side-by-side view opens automatically.
          </p>
        </div>

        {/* Persistent compare bar */}
        {compareCities.length >= 2 && tab !== "compare" && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{compareCities.length} cities in comparison:</span>
              {compareCities.map(city => (
                <Badge key={city.id} variant="outline" className="flex items-center gap-1 text-xs">
                  {city.spotlight && <Star className="h-3 w-3 text-yellow-500" />}
                  {city.name.split("(")[0].trim()}
                  <button onClick={() => toggleCompare(city.id)} className="ml-1 hover:text-red-500 leading-none">×</button>
                </Badge>
              ))}
            </div>
            <Button size="sm" onClick={() => setTab("compare")} data-testid="button-view-comparison">
              <Scale className="h-4 w-4 mr-1.5" /> View Side by Side →
            </Button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="cities" data-testid="tab-cities">Cities &amp; Stories</TabsTrigger>
            <TabsTrigger value="compare" data-testid="tab-compare">
              Side by Side
              {compareCities.length >= 2 && (
                <span className="ml-1.5 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">{compareCities.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="lessons" data-testid="tab-lessons">What We've Learned</TabsTrigger>
          </TabsList>

          <TabsContent value="cities" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {cityList.length} metro areas tracked · Austin Metro is pinned as the proof case.
            </p>
            {cityList.map((city: any) => (
              <CityCard key={city.id} city={city} chainLinks={chainLinks}
                isCompare={compareIds.includes(city.id)}
                onToggle={() => toggleCompare(city.id)} />
            ))}
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            {compareCities.length < 2 ? (
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4 flex items-center gap-3 flex-wrap">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Select at least 2 cities to compare</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Go to "Cities &amp; Stories" and click "Add to Compare" on any city. The comparison loads here automatically.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setTab("cities")}>Choose Cities</Button>
                </CardContent>
              </Card>
            ) : (
              <CompareMatrix cities={compareCities} chainLinks={chainLinks} censusData={censusData} loading={censusLoading} />
            )}
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Cross-City Lessons — What Actually Works
                </CardTitle>
                <CardDescription>
                  What other U.S. metros have learned, applied to the Central Texas pilot — and transferable anywhere.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {LESSONS.map((lesson, i) => {
                  const Icon = CHAIN_ICONS[lesson.chain] || Shield;
                  const bg = lesson.status === "replicate" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : lesson.status === "avoid" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800";
                  const bv = lesson.status === "replicate" ? "default" as const : lesson.status === "avoid" ? "destructive" as const : "secondary" as const;
                  const bl = lesson.status === "replicate" ? "Replicate" : lesson.status === "avoid" ? "Avoid" : "Warning";
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${bg}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${CHAIN_COLORS[lesson.chain]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-sm">{lesson.source}</span>
                            <Badge variant={bv} className="text-xs">{bl}</Badge>
                          </div>
                          <p className="text-sm">{lesson.lesson}</p>
                          <p className="text-sm font-medium mt-2 flex items-start gap-1.5">
                            <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span><strong>For the pilot:</strong> {lesson.implication}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-sm italic text-muted-foreground">
                  "You don't need to guess what works. You need to look at what's been tried in every city that
                  faces the same chain — poverty to health insecurity to crime — and replicate what broke the
                  chain, not what just looked like it did."
                </p>
                <p className="text-sm font-medium mt-2">— Dr. Terry Flood, TCAF Founder</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DFCCrossNav currentPage="city-comparison" />
      </div>
    </div>
  );
}
