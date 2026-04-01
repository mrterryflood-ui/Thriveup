import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import {
  MapPin, Star, ChevronDown, ChevronUp, DollarSign, GraduationCap,
  HeartPulse, ShieldAlert, Shield, Users, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Minus,
  Globe, Zap, Target, BarChart3, Search, Link2, Loader2, FlaskConical,
  BookOpen, ExternalLink, Sparkles, Scale
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

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  "active": { variant: "default", label: "Active" },
  "reduced": { variant: "secondary", label: "Reduced" },
  "failing": { variant: "destructive", label: "Failing" },
  "completed": { variant: "outline", label: "Completed" },
};

function ChainCoverage({ initiatives, chainLinks }: { initiatives: any[]; chainLinks: any[] }) {
  const covered = new Set<string>();
  initiatives.forEach((init: any) => init.chainLinks?.forEach((l: string) => covered.add(l)));
  return (
    <div className="flex gap-1.5 flex-wrap">
      {chainLinks.map((link: any) => {
        const Icon = CHAIN_ICONS[link.id] || Shield;
        const isCovered = covered.has(link.id);
        return (
          <div key={link.id} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isCovered ? CHAIN_COLORS[link.id] : "bg-muted/50 text-muted-foreground line-through"}`}>
            <Icon className="h-3 w-3" />
            {link.label.split(" ")[0]}
            {isCovered ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          </div>
        );
      })}
    </div>
  );
}

function InitiativeCard({ initiative, chainLinks }: { initiative: any; chainLinks: any[] }) {
  const [open, setOpen] = useState(false);
  const statusInfo = STATUS_BADGE[initiative.status] || STATUS_BADGE["active"];
  return (
    <div className="border rounded-lg transition-all hover:shadow-sm" data-testid={`initiative-${initiative.name?.toLowerCase().replace(/\s+/g, '-')}`}>
      <button className="w-full text-left p-3" onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm">{initiative.name}</h4>
              <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{initiative.years} · {initiative.funder} · {initiative.amount}</p>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t pt-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Approach</p>
            <p className="text-sm">{initiative.approach}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Evidence</p>
            <p className="text-sm">{initiative.evidence}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Outcome</p>
            <p className="text-sm font-medium">{initiative.outcome}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Chain Links Addressed</p>
            <div className="flex gap-1 flex-wrap">
              {initiative.chainLinks?.map((linkId: string) => {
                const link = chainLinks.find((l: any) => l.id === linkId);
                const Icon = CHAIN_ICONS[linkId] || Shield;
                return (
                  <span key={linkId} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${CHAIN_COLORS[linkId]}`}>
                    <Icon className="h-3 w-3" /> {link?.label || linkId}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CityCard({ city, chainLinks, isCompare, onToggle }: { city: any; chainLinks: any[]; isCompare: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(city.spotlight || false);
  const coveredLinks = new Set<string>();
  city.initiatives?.forEach((init: any) => init.chainLinks?.forEach((l: string) => coveredLinks.add(l)));
  const coverageScore = chainLinks.length > 0 ? Math.round((coveredLinks.size / chainLinks.length) * 100) : 0;

  return (
    <Card className={`transition-all ${city.spotlight ? "ring-2 ring-primary shadow-lg" : ""} ${isCompare ? "ring-2 ring-blue-400" : ""}`}
      data-testid={`card-city-${city.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <MapPin className={`h-5 w-5 shrink-0 mt-0.5 ${city.spotlight ? "text-primary" : "text-muted-foreground"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{city.name}</CardTitle>
              {city.spotlight && <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Star className="h-3 w-3 mr-1" /> Spotlight</Badge>}
              <Badge variant="outline">{city.state}</Badge>
            </div>
            <CardDescription className="text-xs mt-1">{city.description}</CardDescription>
          </div>
          <Button variant={isCompare ? "default" : "outline"} size="sm" onClick={onToggle} data-testid={`button-compare-${city.id}`}>
            {isCompare ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Scale className="h-4 w-4 mr-1" />}
            {isCompare ? "Selected" : "Compare"}
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Evidence Chain Coverage</span>
            <span className="text-sm font-bold">{coveredLinks.size}/{chainLinks.length} links</span>
          </div>
          <Progress value={coverageScore} className="h-2" />
          <ChainCoverage initiatives={city.initiatives || []} chainLinks={chainLinks} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{city.initiatives?.length || 0} Initiatives Tracked</span>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="ml-auto h-7">
            {expanded ? "Collapse" : "Expand"} <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {expanded && (
          <>
            <div className="space-y-2">
              {city.initiatives?.map((init: any, i: number) => (
                <InitiativeCard key={i} initiative={init} chainLinks={chainLinks} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                </p>
                <ul className="space-y-0.5">
                  {city.strengths?.map((s: string, i: number) => (
                    <li key={i} className="text-xs">{s}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Gaps
                </p>
                <ul className="space-y-0.5">
                  {city.gaps?.map((g: string, i: number) => (
                    <li key={i} className="text-xs">{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ComparisonView({ cities, chainLinks, censusData }: { cities: any[]; chainLinks: any[]; censusData: Record<string, any> }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-city-comparison">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-2 pr-4 text-xs font-semibold text-muted-foreground">Chain Link</th>
              {cities.map(city => (
                <th key={city.id} className="text-center pb-2 px-2 text-xs font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    {city.spotlight && <Star className="h-3 w-3 text-yellow-500" />}
                    {city.name.split("(")[0].trim()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chainLinks.map((link: any) => {
              const Icon = CHAIN_ICONS[link.id] || Shield;
              return (
                <tr key={link.id} className="border-b border-muted/50">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">{link.label}</span>
                    </div>
                  </td>
                  {cities.map(city => {
                    const covered = new Set<string>();
                    city.initiatives?.forEach((init: any) => init.chainLinks?.forEach((l: string) => covered.add(l)));
                    const isCovered = covered.has(link.id);
                    const initiatives = city.initiatives?.filter((init: any) => init.chainLinks?.includes(link.id)) || [];

                    const census = censusData[city.id];
                    let metricValue = null;
                    if (census?.summary) {
                      if (link.id === "poverty") metricValue = census.summary.avgPoverty || null;
                      if (link.id === "benefit-gap") metricValue = census.summary.gapRate;
                      if (link.id === "health-insecurity") metricValue = census.summary.avgUninsured || null;
                      if (link.id === "isolation") metricValue = census.summary.avgNoBroadband || null;
                    }

                    return (
                      <td key={city.id} className="py-2 px-2 text-center">
                        <div className="space-y-1">
                          {isCovered ? (
                            <Badge variant="default" className="text-xs">{initiatives.length} prog{initiatives.length !== 1 ? "s" : ""}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-500 border-red-200">Gap</Badge>
                          )}
                          {metricValue !== null && metricValue !== undefined && (
                            <p className={`text-xs font-mono ${metricValue > (link.threshold || 20) ? "text-red-600 font-bold" : "text-green-600"}`}>
                              {Math.round(metricValue * 10) / 10}{link.unit}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            <tr className="border-t-2 font-bold">
              <td className="py-2 pr-4 text-xs">Total Coverage</td>
              {cities.map(city => {
                const covered = new Set<string>();
                city.initiatives?.forEach((init: any) => init.chainLinks?.forEach((l: string) => covered.add(l)));
                const pct = Math.round((covered.size / chainLinks.length) * 100);
                return (
                  <td key={city.id} className="py-2 px-2 text-center">
                    <span className={`text-sm ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {covered.size}/{chainLinks.length} ({pct}%)
                    </span>
                  </td>
                );
              })}
            </tr>

            <tr className="border-t">
              <td className="py-2 pr-4 text-xs">Initiatives</td>
              {cities.map(city => (
                <td key={city.id} className="py-2 px-2 text-center text-sm">{city.initiatives?.length || 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {cities.map(city => {
        const census = censusData[city.id];
        if (!census?.summary) return null;
        return (
          <Card key={city.id} className="bg-muted/30">
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-bold text-sm">{city.name}</span>
                {city.spotlight && <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 mr-1" /> Proof Case</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">Live Census Data</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                <div className="p-2 rounded bg-background">
                  <p className="text-base font-bold">{census.summary.totalPopulation?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Population</p>
                </div>
                <div className="p-2 rounded bg-background">
                  <p className="text-base font-bold">{census.summary.totalEligible?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Eligible</p>
                </div>
                <div className="p-2 rounded bg-red-50 dark:bg-red-950/20">
                  <p className="text-base font-bold text-red-600">{census.summary.totalGap?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Gap</p>
                </div>
                <div className="p-2 rounded bg-background">
                  <p className="text-base font-bold">{census.summary.gapRate}%</p>
                  <p className="text-xs text-muted-foreground">Gap Rate</p>
                </div>
                <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/20">
                  <p className="text-base font-bold text-orange-600">{census.summary.unclaimedBenefits}</p>
                  <p className="text-xs text-muted-foreground">Unclaimed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function CityComparisonPage() {
  const [activeTab, setActiveTab] = useState("spotlight");
  const [compareIds, setCompareIds] = useState<string[]>(["austin-metro"]);
  const [loadingCensus, setLoadingCensus] = useState(false);
  const [censusData, setCensusData] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["/api/benefits/city-comparison"],
  });

  const result = data as any;
  const cities = result?.cities || {};
  const chainLinks = result?.evidenceChain || [];
  const cityList = Object.values(cities) as any[];

  const toggleCompare = (cityId: string) => {
    setCompareIds(prev =>
      prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]
    );
  };

  const compareCities = useMemo(() =>
    compareIds.map(id => cities[id]).filter(Boolean),
    [compareIds, cities]
  );

  const spotlightCity = cities["austin-metro"];

  const loadCensusForComparison = async () => {
    setLoadingCensus(true);
    const newData: Record<string, any> = {};
    for (const city of compareCities) {
      try {
        const res = await fetch(`/api/benefits/sdoh-explorer/live?state=${city.stateFips}&counties=${city.counties.join(",")}`);
        if (res.ok) {
          const d = await res.json();
          const countyVals = Object.values(d.counties || {}) as any[];
          newData[city.id] = {
            ...d,
            summary: {
              ...d.summary,
              avgPoverty: countyVals.length > 0 ? Math.round(countyVals.reduce((s: number, c: any) => s + (c.avgPoverty || 0), 0) / countyVals.length * 10) / 10 : 0,
              avgUninsured: countyVals.length > 0 ? Math.round(countyVals.reduce((s: number, c: any) => s + (c.avgUninsured || 0), 0) / countyVals.length * 10) / 10 : 0,
              avgNoBroadband: countyVals.length > 0 ? Math.round(countyVals.reduce((s: number, c: any) => s + (c.avgNoBroadband || 0), 0) / countyVals.length * 10) / 10 : 0,
            },
          };
        }
      } catch {}
    }
    setCensusData(newData);
    setLoadingCensus(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50/30 dark:from-indigo-950/20 dark:via-background dark:to-blue-950/10" data-testid="city-comparison-page">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 text-sm px-3 py-1">
            <Globe className="h-3.5 w-3.5 mr-1.5" /> Nationwide Evidence Comparison
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-page-title">
            City-to-City Evidence Chain Comparison
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Compare what's been tried, what worked, and what didn't across U.S. metro areas — structured by the SDOH evidence chain.
            Austin Metro is the proof case. Every other city tells us what to replicate and what to avoid.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Built by <strong>The Collaborative Advocate Foundation (TCAF)</strong> · Dr. Terry Flood
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="spotlight" data-testid="tab-spotlight"><Star className="h-4 w-4 mr-1.5" /> St. David's Spotlight</TabsTrigger>
            <TabsTrigger value="cities" data-testid="tab-cities"><MapPin className="h-4 w-4 mr-1.5" /> All Cities</TabsTrigger>
            <TabsTrigger value="compare" data-testid="tab-compare"><Scale className="h-4 w-4 mr-1.5" /> Compare</TabsTrigger>
            <TabsTrigger value="lessons" data-testid="tab-lessons"><BookOpen className="h-4 w-4 mr-1.5" /> Lessons</TabsTrigger>
          </TabsList>

          <TabsContent value="spotlight" className="space-y-4">
            {spotlightCity && (
              <>
                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <CardTitle>St. David's We All Benefit 2.0 — Austin Metro Proof Case</CardTitle>
                        <CardDescription>$35M/3yr · 5 counties · 192,029-person enrollment gap · 60% gap rate</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-white dark:bg-background border">
                        <p className="text-xl font-bold">501</p>
                        <p className="text-xs text-muted-foreground">Census Tracts</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-background border">
                        <p className="text-xl font-bold">192K</p>
                        <p className="text-xs text-muted-foreground">People in Gap</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-background border">
                        <p className="text-xl font-bold">60%</p>
                        <p className="text-xs text-muted-foreground">Gap Rate</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-background border">
                        <p className="text-xl font-bold">198</p>
                        <p className="text-xs text-muted-foreground">High-Barrier Tracts</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-background border">
                        <p className="text-xl font-bold text-orange-600">$192M+</p>
                        <p className="text-xs text-muted-foreground">Unclaimed/Year</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm mb-2">Evidence Chain Coverage</h3>
                      <ChainCoverage initiatives={spotlightCity.initiatives} chainLinks={chainLinks} />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm mb-2">Why Austin Metro Is the Right Proof Case</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white dark:bg-background border space-y-1">
                          <p className="text-xs font-bold flex items-center gap-1"><Target className="h-3.5 w-3.5 text-primary" /> Cross-County Reality</p>
                          <p className="text-xs text-muted-foreground">Travis and Williamson are bordered by name only. Families in Pflugerville, Manor, and Round Rock cross county lines daily — but benefits don't cross with them.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-background border space-y-1">
                          <p className="text-xs font-bold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-primary" /> Data-Driven Targeting</p>
                          <p className="text-xs text-muted-foreground">501 Census tracts analyzed tract-by-tract. Not zip codes, not county averages — actual neighborhoods with barrier indexes and gap rates.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-background border space-y-1">
                          <p className="text-xs font-bold flex items-center gap-1"><Users className="h-3.5 w-3.5 text-primary" /> Mixed-Status Innovation</p>
                          <p className="text-xs text-muted-foreground">Central Texas has significant mixed-status families where citizen children qualify for benefits but parents avoid the system. CHW-based outreach addresses this.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-background border space-y-1">
                          <p className="text-xs font-bold flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Replicable Model</p>
                          <p className="text-xs text-muted-foreground">Every formula, every variable, every Census pull is documented. If it works here, any metro area can replicate it.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" /> Austin Metro Initiatives
                  </h3>
                  {spotlightCity.initiatives?.map((init: any, i: number) => (
                    <InitiativeCard key={i} initiative={init} chainLinks={chainLinks} />
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {spotlightCity.strengths?.map((s: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> {s}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Gaps to Close</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {spotlightCity.gaps?.map((g: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" /> {g}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="cities" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{cityList.length} metro areas tracked · Click "Compare" to select cities for side-by-side analysis</p>
              <Button variant="outline" size="sm" onClick={() => { setActiveTab("compare"); }} data-testid="button-go-compare">
                <Scale className="h-4 w-4 mr-1.5" /> Compare Selected ({compareIds.length})
              </Button>
            </div>
            {cityList.map((city: any) => (
              <CityCard key={city.id} city={city} chainLinks={chainLinks}
                isCompare={compareIds.includes(city.id)}
                onToggle={() => toggleCompare(city.id)} />
            ))}
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            {compareCities.length < 2 && (
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Select at least 2 cities to compare</p>
                    <p className="text-xs text-muted-foreground">Go to the "All Cities" tab and click "Compare" on the cities you want to analyze side-by-side.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("cities")}>Select Cities</Button>
                </CardContent>
              </Card>
            )}

            {compareCities.length >= 2 && (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-medium">Comparing {compareCities.length} cities:</p>
                  {compareCities.map(city => (
                    <Badge key={city.id} variant="outline" className="flex items-center gap-1">
                      {city.spotlight && <Star className="h-3 w-3 text-yellow-500" />}
                      {city.name.split("(")[0].trim()}
                      <button onClick={() => toggleCompare(city.id)} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  ))}
                  <Button onClick={loadCensusForComparison} disabled={loadingCensus} size="sm" variant="default" data-testid="button-load-census">
                    {loadingCensus ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
                    {loadingCensus ? "Pulling Census data..." : "Load Live Census Data"}
                  </Button>
                </div>

                <ComparisonView cities={compareCities} chainLinks={chainLinks} censusData={censusData} />
              </>
            )}
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Cross-City Lessons for St. David's</CardTitle>
                <CardDescription>What we can learn from other cities and apply to the 5-county Austin Metro model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    source: "Chicago (IL)", lesson: "Illinois achieves 82% SNAP participation — highest among major states",
                    implication: "Systematic enrollment works. Co-locate at every touchpoint, simplify applications, fund dedicated enrollment staff.",
                    chain: "benefit-gap", status: "replicate",
                  },
                  {
                    source: "Houston (TX)", lesson: "Houston Food Bank reaches 800K+ people but only converts 15% to enrollment",
                    implication: "Volume without conversion is waste. TCAF's CHW-driven model must measure enrollment conversion, not just contacts.",
                    chain: "benefit-gap", status: "avoid",
                  },
                  {
                    source: "Dallas (TX)", lesson: "Parkland CHAP CHW program reduced ER use by 35% in target neighborhoods",
                    implication: "Place-based CHW deployment works. TCAF should target the 198 high-barrier tracts, not spray across 501.",
                    chain: "health-insecurity", status: "replicate",
                  },
                  {
                    source: "Detroit (MI)", lesson: "Michigan Bridges program achieved 40% self-sufficiency with coaching model",
                    implication: "Benefits enrollment alone isn't enough — pair with coaching toward self-sufficiency. Build into Year 2-3 plan.",
                    chain: "poverty", status: "replicate",
                  },
                  {
                    source: "Rio Grande Valley (TX)", lesson: "CHW/Promotora model reduced A1C by 1.5 points AND increased SNAP enrollment 25%",
                    implication: "Cultural competency is the multiplier. TCAF must embed bilingual CHWs in mixed-status neighborhoods.",
                    chain: "isolation", status: "replicate",
                  },
                  {
                    source: "Mississippi Delta", lesson: "55% SNAP participation — lowest in US. No state investment in enrollment outreach",
                    implication: "Without political will and funded enrollment infrastructure, gaps persist for decades. This is what happens without intervention.",
                    chain: "benefit-gap", status: "warning",
                  },
                  {
                    source: "Atlanta (GA)", lesson: "Georgia rejected full Medicaid expansion until 2024 partial. 2-1-1 referrals have limited follow-through",
                    implication: "Referral without follow-up is not enrollment. TCAF's system must track from screening → application → enrollment → renewal.",
                    chain: "health-insecurity", status: "avoid",
                  },
                  {
                    source: "Appalachia (KY)", lesson: "Kentucky kynect ACA marketplace is national model — uninsured dropped from 20% to 6%",
                    implication: "State-level systems matter. TCAF should pursue HHSC CPP Level 1 certification to be part of Texas's official enrollment infrastructure.",
                    chain: "health-insecurity", status: "replicate",
                  },
                ].map((lesson, i) => {
                  const Icon = CHAIN_ICONS[lesson.chain] || Shield;
                  const statusColor = lesson.status === "replicate" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                    lesson.status === "avoid" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" :
                    "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800";
                  const statusBadge = lesson.status === "replicate" ? { v: "default" as const, l: "Replicate" } :
                    lesson.status === "avoid" ? { v: "destructive" as const, l: "Avoid" } :
                    { v: "secondary" as const, l: "Warning" };
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${statusColor}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${CHAIN_COLORS[lesson.chain]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-sm">{lesson.source}</span>
                            <Badge variant={statusBadge.v} className="text-xs">{statusBadge.l}</Badge>
                          </div>
                          <p className="text-sm">{lesson.lesson}</p>
                          <p className="text-sm font-medium mt-2 flex items-start gap-1.5">
                            <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span><strong>For St. David's:</strong> {lesson.implication}</span>
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
                  "You don't need to guess what works. You need to look at what's been tried in every city that faces the same chain —
                  poverty to health insecurity to crime — and replicate what broke the chain, not what just looked like it did."
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
