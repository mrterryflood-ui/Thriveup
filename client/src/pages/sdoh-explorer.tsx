import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SDOHImpactChain } from "@/components/sdoh-impact-chain";
import { DFCCrossNav, PillarFlowNav } from "@/components/dfc-cross-nav";
import { JURISDICTIONS } from "@shared/nationwide/jurisdictions";
import { COUNTIES_BY_STATE } from "@shared/nationwide/counties";
import {
  Search, Loader2, MapPin, AlertTriangle, ChevronDown,
  BarChart3, GraduationCap, HeartPulse, ShieldAlert,
  Link2, Target, BookOpen, ExternalLink, FileText, CheckCircle2,
  Globe, Zap, TrendingDown, Database, FlaskConical,
  ShieldCheck, ArrowRight, Users, Briefcase, Map, X
} from "lucide-react";

// Map FIPS state codes (e.g. "48") to USPS codes ("TX") so we can index COUNTIES_BY_STATE.
const STATE_FIPS_TO_USPS: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL",
  "13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME",
  "24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
  "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
  "60":"AS","66":"GU","69":"MP","72":"PR","78":"VI",
};
const USPS_TO_STATE_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_FIPS_TO_USPS).map(([fips, usps]) => [usps, fips])
);

const PRESETS: Array<{ label: string; state: string; counties: string; description: string }> = [
  { label: "Central Texas (St. David's 5-County)", state: "48", counties: "453,491,209,021,055", description: "Travis, Williamson, Hays, Bastrop, Caldwell — St. David's We All Benefit 2.0 target region" },
  { label: "Houston Metro", state: "48", counties: "201,157,039,071", description: "Harris, Fort Bend, Brazoria, Chambers counties" },
  { label: "Dallas-Fort Worth", state: "48", counties: "113,439,085,397", description: "Dallas, Tarrant, Collin, Rockwall counties" },
  { label: "San Antonio Metro", state: "48", counties: "029,091,259,187", description: "Bexar, Comal, Kendall, Guadalupe counties" },
  { label: "Rio Grande Valley", state: "48", counties: "215,061,427,489", description: "Hidalgo, Cameron, Starr, Willacy counties" },
  { label: "Chicago South Side", state: "17", counties: "031", description: "Cook County, IL — includes South Side Chicago" },
  { label: "Detroit Metro", state: "26", counties: "163,125,099", description: "Wayne, Oakland, Macomb counties, MI" },
  { label: "Atlanta Metro", state: "13", counties: "121,089,067,063", description: "Fulton, DeKalb, Cobb, Clayton counties, GA" },
  { label: "Mississippi Delta", state: "28", counties: "011,151,083,133", description: "Bolivar, Washington, Leflore, Sunflower counties, MS" },
  { label: "Appalachia (Eastern KY)", state: "21", counties: "195,131,025,071", description: "Pike, Leslie, Breathitt, Floyd counties, KY" },
];

function getSviColor(value: number): string {
  if (value > 0.6) return "#ef4444";
  if (value > 0.3) return "#eab308";
  return "#22c55e";
}

function getSviLabel(value: number): string {
  if (value > 0.75) return "Very High";
  if (value > 0.6) return "High";
  if (value > 0.3) return "Moderate";
  return "Low";
}

function RegionPicker({
  stateCode, countyCodes, onChange,
}: {
  stateCode: string;
  countyCodes: string;
  onChange: (stateFips: string, countyCsv: string) => void;
}) {
  const [search, setSearch] = useState("");
  const usps = STATE_FIPS_TO_USPS[stateCode] || "TX";
  const counties = COUNTIES_BY_STATE[usps] || [];
  const selectedSet = useMemo(
    () => new Set(countyCodes.split(",").map(c => c.trim()).filter(Boolean)),
    [countyCodes]
  );
  const filtered = useMemo(() => {
    if (!search.trim()) return counties;
    const s = search.toLowerCase();
    return counties.filter(c => c.name.toLowerCase().includes(s));
  }, [counties, search]);

  const setStateAndReset = (uspsCode: string) => {
    const fips = USPS_TO_STATE_FIPS[uspsCode] || stateCode;
    onChange(fips, "");
    setSearch("");
  };

  const toggleCounty = (countyFips3: string) => {
    const next = new Set(selectedSet);
    if (next.has(countyFips3)) next.delete(countyFips3);
    else next.add(countyFips3);
    onChange(stateCode, Array.from(next).join(","));
  };

  const clearAll = () => onChange(stateCode, "");

  // Resolve a name for a selected code (for the chip strip).
  const nameFor = (code: string) =>
    counties.find(c => c.countyFips === code)?.name || code;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t" data-testid="region-picker">
      <div>
        <Label htmlFor="state-picker">State</Label>
        <Select value={usps} onValueChange={setStateAndReset}>
          <SelectTrigger id="state-picker" data-testid="select-state" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {JURISDICTIONS.map(j => (
              <SelectItem key={j.code} value={j.code} data-testid={`option-state-${j.code}`}>
                {j.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {counties.length.toLocaleString()} counties available in {JURISDICTIONS.find(j => j.code === usps)?.name || usps}.
        </p>
      </div>

      <div className="md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="county-search">Counties ({selectedSet.size} selected)</Label>
          {selectedSet.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs" data-testid="button-clear-counties">
              Clear
            </Button>
          )}
        </div>

        {selectedSet.size > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 mb-2 max-h-[88px] overflow-y-auto" data-testid="selected-counties">
            {Array.from(selectedSet).map(code => (
              <Badge key={code} variant="secondary" className="gap-1 pr-1" data-testid={`chip-county-${code}`}>
                {nameFor(code)}
                <button
                  onClick={() => toggleCounty(code)}
                  className="hover:bg-muted rounded-sm p-0.5"
                  aria-label={`Remove ${nameFor(code)}`}
                  data-testid={`button-remove-county-${code}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Input
          id="county-search"
          placeholder={`Search counties in ${JURISDICTIONS.find(j => j.code === usps)?.name || usps}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-county-search"
          className="mt-1"
        />

        <div className="border rounded-md mt-2 max-h-[260px] overflow-y-auto divide-y" data-testid="list-counties">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No counties match "{search}".</div>
          ) : (
            filtered.slice(0, 200).map(c => {
              const checked = selectedSet.has(c.countyFips);
              return (
                <label
                  key={c.countyFips}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 cursor-pointer"
                  data-testid={`row-county-${c.countyFips}`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleCounty(c.countyFips)}
                    data-testid={`checkbox-county-${c.countyFips}`}
                  />
                  <span className="flex-1">{c.name}</span>
                </label>
              );
            })
          )}
          {filtered.length > 200 && (
            <div className="p-2 text-xs text-muted-foreground text-center">
              Showing first 200 of {filtered.length}. Refine your search to see more.
            </div>
          )}
        </div>
        {selectedSet.size > 10 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Tip: 10 counties is the analysis limit. Trim your selection before running.
          </p>
        )}
      </div>
    </div>
  );
}

function CountyCard({ county }: { county: any }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className={`transition-all ${open ? "ring-2 ring-primary/20 shadow-lg" : "hover:shadow-md"}`} data-testid={`card-county-${county.fips}`}>
      <button className="w-full text-left p-4" onClick={() => setOpen(!open)} data-testid={`button-county-${county.fips}`}>
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{county.name}</h3>
            <p className="text-xs text-muted-foreground">{county.tractCount} tracts · {county.totalPop?.toLocaleString()} pop</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={county.gapRate > 55 ? "destructive" : "secondary"}>{county.gapRate}% gap</Badge>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{county.eligible?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Eligible</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
              <p className="text-lg font-bold text-red-600">{county.gap?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Not Enrolled</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{county.avgPoverty}%</p>
              <p className="text-xs text-muted-foreground">Avg Poverty</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{county.avgBarrier}</p>
              <p className="text-xs text-muted-foreground">Barrier Index</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-sm font-bold">{county.avgLimitedEnglish}%</p>
              <p className="text-xs text-muted-foreground">Limited English</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-sm font-bold">{county.avgNoBroadband}%</p>
              <p className="text-xs text-muted-foreground">No Broadband</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-sm font-bold">{county.avgNoVehicle}%</p>
              <p className="text-xs text-muted-foreground">No Vehicle</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{county.highPovertyTracts} high-poverty tracts</Badge>
            <Badge variant="outline">{county.highBarrierTracts} high-barrier tracts</Badge>
          </div>
        </div>
      )}
    </Card>
  );
}

function SVIThemeBar({ label, value, themeNum }: { label: string; value: number; themeNum: number }) {
  const percentile = Math.round(value * 100);
  const color = getSviColor(value);
  return (
    <div className="space-y-1" data-testid={`svi-theme-${themeNum}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Theme {themeNum}: {label}</span>
        <span className="text-sm font-bold" style={{ color }}>{percentile}/100</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentile}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function SVITab({ stateCode, counties }: { stateCode: string; counties: string }) {
  const { data: sviData, isLoading, error } = useQuery({
    queryKey: ["/api/benefits/svi-analysis", stateCode, counties],
    queryFn: async () => {
      const res = await fetch(`/api/benefits/svi-analysis?state=${stateCode}&counties=${counties}`);
      if (!res.ok) throw new Error("Failed to fetch SVI data");
      return res.json();
    },
    enabled: !!counties,
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="svi-loading">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error || !sviData) {
    return (
      <Card className="border-red-300 bg-red-50 dark:bg-red-950/20" data-testid="svi-error">
        <CardContent className="pt-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm">Failed to fetch CDC SVI data. Try selecting a region first.</p>
        </CardContent>
      </Card>
    );
  }

  const summary = sviData.sviSummary;
  const themes = sviData.themes;
  const riskFactors = sviData.riskFactorPrevalence || {};
  const protectiveFactors = sviData.protectiveFactorPrevalence || {};
  const adjacentResources = sviData.adjacentResources || [];
  const totalTracts = summary?.totalTracts || 0;

  if (!summary) {
    return (
      <Card data-testid="svi-no-data">
        <CardContent className="pt-6 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No SVI data available for this region. Select a region in the Explorer tab first.</p>
        </CardContent>
      </Card>
    );
  }

  const avgPercentile = Math.round(summary.averageSVI * 100);
  const sviColor = getSviColor(summary.averageSVI);

  const sortedRiskFactors = Object.entries(riskFactors)
    .map(([name, count]) => ({ name, count: count as number, pct: totalTracts > 0 ? Math.round(((count as number) / totalTracts) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const sortedProtectiveFactors = Object.entries(protectiveFactors)
    .map(([name, count]) => ({ name, count: count as number, pct: totalTracts > 0 ? Math.round(((count as number) / totalTracts) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6" data-testid="svi-tab-content">
      <Card data-testid="card-svi-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> CDC Social Vulnerability Index — Summary
          </CardTitle>
          <CardDescription>
            The SVI identifies communities that may need support based on 16 census-derived social factors across 4 themes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2" data-testid="svi-score-display">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none" stroke={sviColor} strokeWidth="10"
                    strokeDasharray={`${(avgPercentile / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: sviColor }} data-testid="text-svi-percentile">{avgPercentile}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <Badge variant="outline" style={{ borderColor: sviColor, color: sviColor }} data-testid="badge-svi-level">
                {getSviLabel(summary.averageSVI)} Vulnerability
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <div className="text-center p-3 rounded-lg bg-muted/50" data-testid="stat-total-tracts">
                <p className="text-2xl font-bold">{summary.totalTracts}</p>
                <p className="text-xs text-muted-foreground">Tracts Analyzed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50" data-testid="stat-total-population">
                <p className="text-2xl font-bold">{summary.totalPopulation?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Population</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20" data-testid="stat-high-vuln-tracts">
                <p className="text-2xl font-bold text-red-600">{summary.highVulnerabilityTracts}</p>
                <p className="text-xs text-muted-foreground">High Vulnerability</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20" data-testid="stat-low-vuln-tracts">
                <p className="text-2xl font-bold text-green-600">{summary.lowVulnerabilityTracts}</p>
                <p className="text-xs text-muted-foreground">Low Vulnerability</p>
              </div>
            </div>
          </div>

          {themes && (
            <div className="space-y-3" data-testid="svi-themes">
              <h3 className="font-bold text-sm">SVI Theme Scores (Percentile Ranking)</h3>
              <SVIThemeBar label="Socioeconomic Status" value={themes.socioeconomic?.average || 0} themeNum={1} />
              <SVIThemeBar label="Household Characteristics" value={themes.household?.average || 0} themeNum={2} />
              <SVIThemeBar label="Racial & Ethnic Minority Status" value={themes.minority?.average || 0} themeNum={3} />
              <SVIThemeBar label="Housing Type & Transportation" value={themes.housingTransport?.average || 0} themeNum={4} />
            </div>
          )}
        </CardContent>
      </Card>

      {sortedRiskFactors.length > 0 && (
        <Card data-testid="card-risk-factors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Risk Factors Identified
            </CardTitle>
            <CardDescription>
              Risk factors are conditions that increase vulnerability. Each represents a compounding barrier that makes it harder for residents to access services, maintain stability, and build toward self-sufficiency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedRiskFactors.map((factor, i) => (
              <div key={factor.name} className="flex items-center gap-3" data-testid={`risk-factor-${i}`}>
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm font-medium w-48 truncate">{factor.name}</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-red-500"
                    style={{ width: `${factor.pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-red-600 w-12 text-right">{factor.pct}%</span>
                <span className="text-xs text-muted-foreground w-20 text-right">{factor.count} tracts</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sortedProtectiveFactors.length > 0 && (
        <Card data-testid="card-protective-factors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-green-500" /> Protective Factors Present
            </CardTitle>
            <CardDescription>
              Protective factors are community strengths that buffer against risk. These are the assets we can build on — and that adjacent communities can share across borders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedProtectiveFactors.map((factor, i) => (
              <div key={factor.name} className="flex items-center gap-3" data-testid={`protective-factor-${i}`}>
                <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm font-medium w-48 truncate">{factor.name}</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-green-500"
                    style={{ width: `${factor.pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-green-600 w-12 text-right">{factor.pct}%</span>
                <span className="text-xs text-muted-foreground w-20 text-right">{factor.count} tracts</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {adjacentResources.length > 0 && (
        <Card data-testid="card-adjacent-resources">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-5 w-5 text-blue-500" /> Resources Without Borders
            </CardTitle>
            <CardDescription>
              Vulnerability does not stop at county lines. Adjacent low-vulnerability communities hold resources that high-vulnerability neighborhoods can access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adjacentResources.slice(0, 10).map((pair: any, i: number) => (
              <div key={i} className="rounded-lg border p-4 space-y-3" data-testid={`adjacent-pair-${i}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-sm font-medium">Vulnerable Tract</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">{pair.vulnerableTract.location}</p>
                    <div className="pl-6 flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs" data-testid={`badge-vuln-svi-${i}`}>
                        SVI: {Math.round(pair.vulnerableTract.svi * 100)}/100
                      </Badge>
                      {pair.vulnerableTract.riskFactors?.slice(0, 3).map((rf: string, j: number) => (
                        <Badge key={j} variant="outline" className="text-xs">{rf}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center px-3 shrink-0">
                    <div className="w-8 h-0.5 bg-blue-400" />
                    <ArrowRight className="h-5 w-5 text-blue-500 my-1" />
                    <span className="text-xs text-blue-500 font-medium">Bridge</span>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">Nearby Protective Tracts</span>
                    </div>
                    {pair.nearbyProtectiveTracts.slice(0, 3).map((pt: any, k: number) => (
                      <div key={k} className="pl-6 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground truncate flex-1">{pt.location}</span>
                        <Badge variant="secondary" className="text-xs">SVI: {Math.round(pt.svi * 100)}/100</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground italic">
              Showing {Math.min(adjacentResources.length, 10)} of {adjacentResources.length} identified connections. High-vulnerability tracts (SVI &gt; 75th percentile) paired with nearby low-vulnerability tracts (SVI &lt; 25th percentile).
            </p>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-use-this-data">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-amber-500" /> Use This Data
          </CardTitle>
          <CardDescription>
            Turn vulnerability insights into action across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Opportunity Youth Outreach", href: "/opportunity-youth", icon: Users, desc: "Target outreach to high-SVI tracts" },
              { label: "Transition Planning", href: "/transition-plans", icon: GraduationCap, desc: "Align transition plans with community needs" },
              { label: "Benefits Screener", href: "/benefits-screener", icon: HeartPulse, desc: "Connect residents to eligible programs" },
              { label: "Community Map", href: "/community-map", icon: Map, desc: "See geographic visualization" },
              { label: "Grant Narrative", href: "/sdoh-chain", icon: FileText, desc: "Generate grant-ready data narratives" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="p-4 hover-elevate cursor-pointer h-full" data-testid={`link-action-${item.href.replace(/\//g, '')}`}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-md p-2 bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium flex items-center gap-1">
                          {item.label}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800" data-testid="card-svi-data-source">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Data Source:</strong> CDC/ATSDR Social Vulnerability Index (SVI). Data pulled live at {sviData.generatedAt ? new Date(sviData.generatedAt).toLocaleString() : "just now"}.
            SVI ranks every census tract on 16 social factors grouped into 4 themes. See the Methodology tab for full documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SDOHExplorerPage() {
  const [activeTab, setActiveTab] = useState("explorer");
  const [stateCode, setStateCode] = useState("48");
  const [countyCodes, setCountyCodes] = useState("453,491,209,021,055");
  const [queryParams, setQueryParams] = useState({ state: "48", counties: "453,491,209,021,055" });
  const [activePreset, setActivePreset] = useState("Central Texas (St. David's 5-County)");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/benefits/sdoh-explorer/live", queryParams.state, queryParams.counties],
    queryFn: async () => {
      const res = await fetch(`/api/benefits/sdoh-explorer/live?state=${queryParams.state}&counties=${queryParams.counties}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!queryParams.counties,
  });

  const { data: sviSummaryData } = useQuery({
    queryKey: ["/api/benefits/svi-analysis", queryParams.state, queryParams.counties],
    queryFn: async () => {
      const res = await fetch(`/api/benefits/svi-analysis?state=${queryParams.state}&counties=${queryParams.counties}`);
      if (!res.ok) throw new Error("Failed to fetch SVI");
      return res.json();
    },
    enabled: !!queryParams.counties,
  });

  const runAnalysis = () => {
    setQueryParams({ state: stateCode, counties: countyCodes });
    setActivePreset("");
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setStateCode(preset.state);
    setCountyCodes(preset.counties);
    setQueryParams({ state: preset.state, counties: preset.counties });
    setActivePreset(preset.label);
  };

  const result = data as any;
  const sviSummary = sviSummaryData as any;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50/30 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/10" data-testid="sdoh-explorer-page">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 text-sm px-3 py-1">
            <FlaskConical className="h-3.5 w-3.5 mr-1.5" /> Open Science · Replicable Methodology
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-explorer-title">
            SDOH Impact Chain Explorer
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Analyze the Social Determinants of Health impact chain for any county cluster in the United States.
            All data pulled live from the U.S. Census Bureau ACS. Every number is verifiable. Every formula is documented.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Built by <strong>The Collaborative Advocate Foundation (TCAF)</strong> · Powered by Census ACS 5-Year Estimates (2018-2022)
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
            <TabsTrigger value="explorer" data-testid="tab-explorer"><Search className="h-4 w-4 mr-1.5" /> Explorer</TabsTrigger>
            <TabsTrigger value="svi" data-testid="tab-svi"><ShieldAlert className="h-4 w-4 mr-1.5" /> Vulnerability</TabsTrigger>
            <TabsTrigger value="chain" data-testid="tab-chain"><Link2 className="h-4 w-4 mr-1.5" /> Impact Chain</TabsTrigger>
            <TabsTrigger value="methodology" data-testid="tab-methodology"><FlaskConical className="h-4 w-4 mr-1.5" /> Methodology</TabsTrigger>
            <TabsTrigger value="replicate" data-testid="tab-replicate"><BookOpen className="h-4 w-4 mr-1.5" /> Replicate</TabsTrigger>
          </TabsList>

          <TabsContent value="explorer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Pick your area</CardTitle>
                <CardDescription>Choose a state and one or more counties. We pull live data from the U.S. Census Bureau and show you who's eligible for benefits but not yet enrolled.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground tracking-wide">Quick start — common regions</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {PRESETS.map(preset => (
                      <Button key={preset.label} variant={activePreset === preset.label ? "default" : "outline"} size="sm"
                        onClick={() => selectPreset(preset)} data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <RegionPicker
                  stateCode={stateCode}
                  countyCodes={countyCodes}
                  onChange={(s, c) => { setStateCode(s); setCountyCodes(c); setActivePreset(""); }}
                />

                <Button onClick={runAnalysis} disabled={isLoading || !countyCodes} className="w-full" size="lg" data-testid="button-run-analysis">
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Pulling live Census data…</>
                  ) : (
                    <><Search className="h-5 w-5 mr-2" /> Run analysis</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-sm">Failed to fetch Census data. Check your state/county codes and try again.</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card className="text-center" data-testid="stat-total-pop">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold">{result.summary?.totalPopulation?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Population</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center" data-testid="stat-eligible">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold">{result.summary?.totalEligible?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Estimated Eligible</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center border-red-200 dark:border-red-800" data-testid="stat-not-enrolled">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold text-red-600">{result.summary?.totalGap?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Not Enrolled</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center" data-testid="stat-tracts">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold">{result.summary?.totalTracts}</p>
                      <p className="text-xs text-muted-foreground">Neighborhoods analyzed</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center border-orange-200 dark:border-orange-800" data-testid="stat-unclaimed">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold text-orange-600">{result.summary?.unclaimedBenefits}</p>
                      <p className="text-xs text-muted-foreground">Unclaimed Benefits</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={() => setActiveTab("svi")} className="text-left" data-testid="button-svi-drilldown">
                    <Card className="hover-elevate h-full">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-4">
                          <div className="shrink-0">
                            {sviSummary?.sviSummary ? (
                              <div className="relative w-16 h-16">
                                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="10" />
                                  <circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke={getSviColor(sviSummary.sviSummary.averageSVI)}
                                    strokeWidth="10"
                                    strokeDasharray={`${(sviSummary.sviSummary.averageSVI) * 314} 314`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-lg font-bold" style={{ color: getSviColor(sviSummary.sviSummary.averageSVI) }}>
                                    {Math.round(sviSummary.sviSummary.averageSVI * 100)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold">CDC SVI Score</p>
                            <p className="text-xs text-muted-foreground">
                              {sviSummary?.sviSummary
                                ? `${getSviLabel(sviSummary.sviSummary.averageSVI)} vulnerability — ${sviSummary.sviSummary.highVulnerabilityTracts} high-risk tracts`
                                : "Loading SVI data..."}
                            </p>
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              View full vulnerability analysis <ArrowRight className="h-3 w-3" />
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>

                  <button onClick={() => setActiveTab("svi")} className="text-left" data-testid="button-context-drilldown">
                    <Card className="hover-elevate h-full">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-4">
                          <div className="shrink-0">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                              <BarChart3 className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold">Context Load Index</p>
                            <p className="text-xs text-muted-foreground">
                              Weighted composite of poverty, barriers, education gaps, and social isolation across all analyzed tracts.
                            </p>
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              See risk & protective factors <ArrowRight className="h-3 w-3" />
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <Card className="text-center" data-testid="stat-high-poverty">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-lg font-bold">{result.summary?.highPovertyTracts}</p>
                      <p className="text-xs text-muted-foreground">High Poverty</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center" data-testid="stat-high-barrier">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-lg font-bold">{result.summary?.highBarrierTracts}</p>
                      <p className="text-xs text-muted-foreground">High Barrier</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center" data-testid="stat-no-broadband">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-lg font-bold">{result.summary?.noBroadbandTracts}</p>
                      <p className="text-xs text-muted-foreground">No Broadband</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center" data-testid="stat-no-vehicle">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-lg font-bold">{result.summary?.noVehicleTracts}</p>
                      <p className="text-xs text-muted-foreground">No Vehicle</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> County Breakdown
                  </h3>
                  {Object.values(result.counties || {}).map((county: any) => (
                    <CountyCard key={county.fips} county={county} />
                  ))}
                </div>

                {result.topBarrierTracts && result.topBarrierTracts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-5 w-5 text-red-500" /> Top 20 neighborhoods with the most barriers
                      </CardTitle>
                      <CardDescription>These neighborhoods face the deepest stack of barriers — poverty, language, transportation, and internet — that keep people from getting the benefits they qualify for.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" data-testid="table-barrier-tracts">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="pb-2 pr-3">Neighborhood</th>
                              <th className="pb-2 pr-3 text-right">People</th>
                              <th className="pb-2 pr-3 text-right">In poverty</th>
                              <th className="pb-2 pr-3 text-right">Barrier score</th>
                              <th className="pb-2 pr-3 text-right">Limited English</th>
                              <th className="pb-2 pr-3 text-right">No broadband</th>
                              <th className="pb-2 text-right">People not enrolled</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.topBarrierTracts.slice(0, 20).map((t: any, i: number) => {
                              // Census NAME is e.g. "Census Tract 18.07, Travis County, Texas".
                              // Show "Travis County" as the human label, with the tract # as a small subscript.
                              const parts = (t.tractName || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                              const tractLabel = parts[0]?.replace(/^Census Tract\s*/i, "") || t.tractId;
                              const countyLabel = parts[1] || "";
                              return (
                              <tr key={i} className="border-b border-muted/50">
                                <td className="py-1.5 pr-3 text-xs">
                                  <div className="font-medium">{countyLabel || `Tract ${tractLabel}`}</div>
                                  {countyLabel && <div className="text-muted-foreground">Tract {tractLabel}</div>}
                                </td>
                                <td className="py-1.5 pr-3 text-right">{t.totalPop?.toLocaleString()}</td>
                                <td className="py-1.5 pr-3 text-right">
                                  <span className={t.povertyRate > 25 ? "text-red-600 font-bold" : ""}>{Math.round(t.povertyRate)}%</span>
                                </td>
                                <td className="py-1.5 pr-3 text-right">
                                  <span className={t.barrierIndex > 25 ? "text-red-600 font-bold" : ""}>{Math.round(t.barrierIndex * 10) / 10}</span>
                                </td>
                                <td className="py-1.5 pr-3 text-right">{Math.round(t.limitedEnglishPct)}%</td>
                                <td className="py-1.5 pr-3 text-right">{Math.round(t.noBroadbandPct)}%</td>
                                <td className="py-1.5 text-right font-bold text-red-600">{t.gap?.toLocaleString()}</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      <strong>Data Source:</strong> U.S. Census Bureau American Community Survey (ACS) 5-Year Estimates (2018-2022).
                      Data pulled live at {result.generatedAt ? new Date(result.generatedAt).toLocaleString() : "just now"}.
                      See the Methodology and Replicate tabs for full documentation of variables, formulas, and limitations.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="svi" className="space-y-4">
            <SVITab stateCode={queryParams.state} counties={queryParams.counties} />
          </TabsContent>

          <TabsContent value="chain" className="space-y-4">
            <SDOHImpactChain stateCode={queryParams.state} countyCodes={queryParams.counties} />
          </TabsContent>

          <TabsContent value="methodology" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" /> Methodology</CardTitle>
                <CardDescription>Complete documentation of data sources, variables, and analytical formulas used in this analysis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm mb-2">Data Source</h3>
                  <p className="text-sm">U.S. Census Bureau American Community Survey (ACS) 5-Year Estimates (2018-2022)</p>
                  <p className="text-sm text-muted-foreground">API Endpoint: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://api.census.gov/data/2022/acs/acs5</code></p>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-2">Census Variables Used</h3>
                  <div className="space-y-1.5">
                    {[
                      ["B01003_001E", "Total Population"],
                      ["B19013_001E", "Median Household Income"],
                      ["B17001_002E / B17001_001E", "Poverty Rate (persons below poverty / poverty universe)"],
                      ["B16004_025E + B16004_047E / B16004_001E", "Limited English Proficiency Rate (ages 5+ who speak English less than 'very well')"],
                      ["B08141_002E / B08141_001E", "No Vehicle Rate (workers with no vehicle / total workers)"],
                      ["B28002_013E / B28002_001E", "No Broadband Rate (households with no internet subscription / total households)"],
                      ["B27001_005E + B27001_008E + B27001_011E / B27001_001E", "Uninsured Rate (uninsured by age groups / total)"],
                      ["B22001_002E / B22001_001E", "SNAP/Food Stamps Participation Rate"],
                    ].map(([code, desc]) => (
                      <div key={code} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5">{code}</code>
                        <p className="text-sm">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-2">Barrier Index Formula</h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border font-mono text-sm">
                    Barrier Index = (Limited English % × 0.25) + (No Vehicle % × 0.20) + (No Broadband % × 0.20) + (Poverty Rate × 0.20)
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Weights reflect evidence-based impact on benefits enrollment barriers. Limited English is weighted highest because
                    it affects every interaction with benefits systems. Range: 0-100.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-2">Eligibility Estimation</h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border font-mono text-sm">
                    Eligible Population = Total Population × (Poverty Rate / 100) × 1.3
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    The 1.3 multiplier accounts for near-poverty populations (130-200% FPL) who qualify for programs like SNAP (130% FPL),
                    Medicaid (138% FPL), and CHIP (up to 200%+ FPL). This is a conservative estimate.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-2">Enrollment Gap Estimation</h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border font-mono text-sm">
                    Enrolled = Eligible × max(SNAP Participation Rate, 0.40)<br />
                    Gap = Eligible - Enrolled
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    SNAP participation rate is used as a proxy for overall benefits uptake. The 40% floor prevents underestimation
                    in tracts where SNAP data is suppressed. Actual program-specific rates vary.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-2">Unclaimed Benefits Estimation</h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border font-mono text-sm">
                    Unclaimed = Gap × $4,800/year/person
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    $4,800 is a weighted average annual benefit value across SNAP (~$2,400), Medicaid (~$7,000), EITC (~$2,500),
                    and other programs, adjusted for eligibility overlap.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-svi-methodology">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> CDC/ATSDR Social Vulnerability Index (SVI)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  The CDC/ATSDR Social Vulnerability Index uses U.S. Census variables to identify communities that may need support during public health emergencies and ongoing resource allocation. SVI ranks every census tract on 16 social factors grouped into 4 themes.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      theme: "Theme 1: Socioeconomic Status",
                      variables: ["Below 150% Poverty", "Unemployed", "Housing Cost Burden", "No Health Insurance", "No High School Diploma"],
                    },
                    {
                      theme: "Theme 2: Household Characteristics & Disability",
                      variables: ["Aged 65 & Older", "Aged 17 & Younger", "Civilian with a Disability", "Single-Parent Households", "English Language Proficiency"],
                    },
                    {
                      theme: "Theme 3: Racial & Ethnic Minority Status",
                      variables: ["Racial/Ethnic Minority Population"],
                    },
                    {
                      theme: "Theme 4: Housing Type & Transportation",
                      variables: ["Multi-Unit Structures", "Mobile Homes", "Crowding", "No Vehicle", "Group Quarters"],
                    },
                  ].map(({ theme, variables }) => (
                    <div key={theme} className="p-3 rounded-lg bg-muted/30">
                      <h4 className="text-sm font-bold mb-1">{theme}</h4>
                      <div className="flex flex-wrap gap-1">
                        {variables.map(v => (
                          <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  SVI percentile rankings range from 0 to 1, where higher values indicate greater vulnerability. A tract in the 90th percentile (0.90) is more vulnerable than 90% of all U.S. tracts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-amber-500" /> Limitations & Caveats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "ACS 5-year estimates have margins of error, especially for small census tracts (<1,000 population)",
                  "SNAP participation is used as a proxy for overall benefits enrollment — actual rates vary by program",
                  "Eligibility at 130% FPL is a rough estimate; actual program thresholds vary (Medicaid 138%, CHIP 200%+)",
                  "Limited English proficiency data captures ages 5+ who speak English less than 'very well'",
                  "Census tract boundaries do not align with city limits, school districts, or service areas",
                  "Crime correlation is based on published research linking SDOH to crime rates, not tract-level crime data overlay",
                  "The barrier index weights are evidence-informed but not empirically validated for every context",
                  "Data is from 2018-2022 estimates and may not reflect post-pandemic changes in some areas",
                  "SVI data is sourced from CDC/ATSDR and may have a different vintage than the ACS data used for other metrics",
                ].map((lim, i) => (
                  <p key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /> {lim}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5" /> Cited Research</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Marmot, M. (2015). The Health Gap: The Challenge of an Unequal World. Bloomsbury.",
                  "Braveman, P., & Gottlieb, L. (2014). The Social Determinants of Health. Public Health Reports, 129(2), 19-31.",
                  "Urban Institute (2023). Reaching Eligible Non-Participants in SNAP.",
                  "CBPP (2023). State-Level SNAP Participation Rates.",
                  "Healthy People 2030 — Social Determinants of Health Framework (ODPHP/HHS).",
                  "SAMHSA Risk and Protective Factors Framework — Education as both risk and protective factor.",
                  "WHO Commission on Social Determinants of Health (2008). Closing the gap in a generation.",
                  "Patel, V., Burns, J. K., et al. (2018). Income inequality and depression: a systematic review. Social Psychiatry.",
                  "Stillwell, C. (2026). SVI-based geographic accountability in higher education accreditation. Under review at Nature. — Demonstrates strong inverse correlation between SVI and bachelor degree attainment across all 3,144 U.S. counties.",
                  "CDC/ATSDR (2022). Social Vulnerability Index Documentation. Centers for Disease Control and Prevention.",
                ].map((ref, i) => (
                  <p key={i} className="text-sm flex items-start gap-2 pl-4 border-l-2 border-muted py-1" data-testid={`citation-${i}`}>
                    {ref}
                  </p>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="replicate" className="space-y-4">
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> How to Replicate This Analysis</CardTitle>
                <CardDescription>
                  Every number in this tool is derived from publicly available U.S. Census data using documented formulas.
                  Here's how to verify or replicate our findings independently.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: 1, title: "Access Census Data", detail: "Go to data.census.gov or use the Census API directly at api.census.gov/data/2022/acs/acs5. No API key required for basic queries." },
                  { step: 2, title: "Pick your area", detail: "Choose your state and counties using the picker on the Explorer tab. We translate your selection into the Census Bureau's FIPS codes for you and request data for every census tract in those counties." },
                  { step: 3, title: "Pull the Variables", detail: "Request variables: B01003_001E (population), B19013_001E (median income), B17001_002E & B17001_001E (poverty), B16004_025E & B16004_047E & B16004_001E (limited English), B08141_002E & B08141_001E (no vehicle), B28002_013E & B28002_001E (no broadband), B22001_002E & B22001_001E (SNAP participation)." },
                  { step: 4, title: "Calculate Rates", detail: "For each tract: Poverty Rate = B17001_002E / B17001_001E × 100. Limited English = (B16004_025E + B16004_047E) / B16004_001E × 100. No Vehicle = B08141_002E / B08141_001E × 100. No Broadband = B28002_013E / B28002_001E × 100." },
                  { step: 5, title: "Compute Barrier Index", detail: "Barrier Index = (Limited English % × 0.25) + (No Vehicle % × 0.20) + (No Broadband % × 0.20) + (Poverty Rate × 0.20). This composite score identifies neighborhoods with compounding access barriers." },
                  { step: 6, title: "Estimate Eligibility & Gap", detail: "Eligible = Total Pop × (Poverty Rate / 100) × 1.3. Enrolled ≈ Eligible × SNAP Rate. Gap = Eligible - Enrolled. The gap represents people who likely qualify for benefits but are not receiving them." },
                  { step: 7, title: "Verify Our Numbers", detail: "Compare your calculations to our results. If you find discrepancies, we want to know — contact mr.terryflood@gmail.com. Science requires accountability." },
                ].map(step => (
                  <div key={step.step} className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-background border" data-testid={`replicate-step-${step.step}`}>
                    <Badge className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm">{step.step}</Badge>
                    <div>
                      <h4 className="font-bold text-sm">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Database className="h-5 w-5" /> API Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">You can query our live SDOH analysis API directly:</p>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border font-mono text-xs overflow-x-auto">
                  GET /api/benefits/sdoh-explorer/live?state=48&counties=453,491,209,021,055
                </div>
                <p className="text-sm text-muted-foreground">
                  Returns JSON with county summaries, barrier analysis, top barrier tracts, and full methodology documentation.
                  Change the state and county codes to analyze any region in the United States.
                </p>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border font-mono text-xs overflow-x-auto">
                  GET /api/benefits/svi-analysis?state=48&counties=453,491,209,021,055
                </div>
                <p className="text-sm text-muted-foreground">
                  Returns CDC SVI analysis with vulnerability scores, risk/protective factors, theme breakdowns, and adjacent resource connections.
                </p>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">
                    <strong>Example queries:</strong><br />
                    Central Texas: <code className="text-xs">?state=48&counties=453,491,209,021,055</code><br />
                    Houston Metro: <code className="text-xs">?state=48&counties=201,157,039,071</code><br />
                    Cook County (Chicago): <code className="text-xs">?state=17&counties=031</code><br />
                    Wayne County (Detroit): <code className="text-xs">?state=26&counties=163</code>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-sm italic text-muted-foreground">
                  "The foundation of scientific credibility is replicability. If you can't show your work and let others verify it,
                  you're asking them to take your word for it — and that's not science, that's marketing."
                </p>
                <p className="text-sm font-medium mt-2">— Dr. Terry Flood, TCAF Founder</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PillarFlowNav currentStep="community-intelligence" />
        <DFCCrossNav currentPage="sdoh-chain" />
      </div>
    </div>
  );
}
