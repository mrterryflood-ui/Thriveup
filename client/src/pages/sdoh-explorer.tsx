import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SDOHImpactChain } from "@/components/sdoh-impact-chain";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import {
  Search, Loader2, MapPin, AlertTriangle, ChevronDown, ChevronUp,
  BarChart3, DollarSign, GraduationCap, HeartPulse, ShieldAlert,
  Link2, Target, BookOpen, ExternalLink, FileText, CheckCircle2,
  Globe, Zap, TrendingDown, Database, FlaskConical
} from "lucide-react";

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
          <div className="flex gap-2">
            <Badge variant="outline">{county.highPovertyTracts} high-poverty tracts</Badge>
            <Badge variant="outline">{county.highBarrierTracts} high-barrier tracts</Badge>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SDOHExplorerPage() {
  const [activeTab, setActiveTab] = useState("explorer");
  const [stateCode, setStateCode] = useState("48");
  const [countyCodes, setCountyCodes] = useState("453,491,209,021,055");
  const [queryParams, setQueryParams] = useState({ state: "48", counties: "453,491,209,021,055" });
  const [activePreset, setActivePreset] = useState("Central Texas (St. David's 5-County)");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/benefits/sdoh-explorer/live", queryParams.state, queryParams.counties],
    queryFn: async () => {
      const res = await fetch(`/api/benefits/sdoh-explorer/live?state=${queryParams.state}&counties=${queryParams.counties}`);
      if (!res.ok) throw new Error("Failed to fetch");
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
          <TabsList className="grid grid-cols-4 w-full max-w-xl mx-auto">
            <TabsTrigger value="explorer" data-testid="tab-explorer"><Search className="h-4 w-4 mr-1.5" /> Explorer</TabsTrigger>
            <TabsTrigger value="chain" data-testid="tab-chain"><Link2 className="h-4 w-4 mr-1.5" /> Impact Chain</TabsTrigger>
            <TabsTrigger value="methodology" data-testid="tab-methodology"><FlaskConical className="h-4 w-4 mr-1.5" /> Methodology</TabsTrigger>
            <TabsTrigger value="replicate" data-testid="tab-replicate"><BookOpen className="h-4 w-4 mr-1.5" /> Replicate</TabsTrigger>
          </TabsList>

          <TabsContent value="explorer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Select a Region</CardTitle>
                <CardDescription>Choose a preset or enter custom FIPS codes. Data is pulled live from the Census Bureau.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {PRESETS.map(preset => (
                    <Button key={preset.label} variant={activePreset === preset.label ? "default" : "outline"} size="sm"
                      onClick={() => selectPreset(preset)} data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                  <div>
                    <Label>State FIPS Code</Label>
                    <Input value={stateCode} onChange={e => setStateCode(e.target.value)}
                      placeholder="e.g., 48 (Texas)" data-testid="input-state-code" />
                    <p className="text-xs text-muted-foreground mt-1">48=TX, 17=IL, 26=MI, 13=GA, 06=CA</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>County FIPS Codes (comma-separated, 3-digit)</Label>
                    <Input value={countyCodes} onChange={e => setCountyCodes(e.target.value)}
                      placeholder="e.g., 453,491,209,021,055" data-testid="input-county-codes" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Find codes at <a href="https://www.census.gov/library/reference/code-lists/ansi.html" target="_blank" rel="noopener noreferrer" className="text-primary underline">census.gov/library/reference/code-lists</a>
                    </p>
                  </div>
                </div>

                <Button onClick={runAnalysis} disabled={isLoading} className="w-full" size="lg" data-testid="button-run-analysis">
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Pulling live Census data...</>
                  ) : (
                    <><Search className="h-5 w-5 mr-2" /> Run SDOH Analysis</>
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
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold">{result.summary?.totalPopulation?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Population</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold">{result.summary?.totalEligible?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Estimated Eligible</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center border-red-200 dark:border-red-800">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold text-red-600">{result.summary?.totalGap?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Not Enrolled</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold">{result.summary?.totalTracts}</p>
                      <p className="text-xs text-muted-foreground">Census Tracts</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center border-orange-200 dark:border-orange-800">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-2xl font-bold text-orange-600">{result.summary?.unclaimedBenefits}</p>
                      <p className="text-xs text-muted-foreground">Unclaimed Benefits</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <Card className="text-center">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-lg font-bold">{result.summary?.highPovertyTracts}</p>
                      <p className="text-xs text-muted-foreground">High Poverty</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-lg font-bold">{result.summary?.highBarrierTracts}</p>
                      <p className="text-xs text-muted-foreground">High Barrier</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-lg font-bold">{result.summary?.noBroadbandTracts}</p>
                      <p className="text-xs text-muted-foreground">No Broadband</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
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
                        <AlertTriangle className="h-5 w-5 text-red-500" /> Top 20 Highest-Barrier Census Tracts
                      </CardTitle>
                      <CardDescription>These neighborhoods face the most compounding barriers to benefits enrollment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" data-testid="table-barrier-tracts">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="pb-2 pr-3">Tract</th>
                              <th className="pb-2 pr-3 text-right">Pop</th>
                              <th className="pb-2 pr-3 text-right">Poverty</th>
                              <th className="pb-2 pr-3 text-right">Barrier</th>
                              <th className="pb-2 pr-3 text-right">Ltd English</th>
                              <th className="pb-2 pr-3 text-right">No Broadband</th>
                              <th className="pb-2 text-right">Gap</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.topBarrierTracts.slice(0, 20).map((t: any, i: number) => (
                              <tr key={i} className="border-b border-muted/50">
                                <td className="py-1.5 pr-3 text-xs font-mono">{t.tractName?.split(",")[0] || t.tractId}</td>
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
                            ))}
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
                ].map((ref, i) => (
                  <p key={i} className="text-sm flex items-start gap-2 pl-4 border-l-2 border-muted py-1">
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
                  { step: 2, title: "Select Your Geography", detail: "Choose state and county FIPS codes. For Texas: state=48. County codes: Travis=453, Williamson=491, Hays=209, Bastrop=021, Caldwell=055. Request data 'for=tract:*' to get all census tracts." },
                  { step: 3, title: "Pull the Variables", detail: "Request variables: B01003_001E (population), B19013_001E (median income), B17001_002E & B17001_001E (poverty), B16004_025E & B16004_047E & B16004_001E (limited English), B08141_002E & B08141_001E (no vehicle), B28002_013E & B28002_001E (no broadband), B22001_002E & B22001_001E (SNAP participation)." },
                  { step: 4, title: "Calculate Rates", detail: "For each tract: Poverty Rate = B17001_002E / B17001_001E × 100. Limited English = (B16004_025E + B16004_047E) / B16004_001E × 100. No Vehicle = B08141_002E / B08141_001E × 100. No Broadband = B28002_013E / B28002_001E × 100." },
                  { step: 5, title: "Compute Barrier Index", detail: "Barrier Index = (Limited English % × 0.25) + (No Vehicle % × 0.20) + (No Broadband % × 0.20) + (Poverty Rate × 0.20). This composite score identifies neighborhoods with compounding access barriers." },
                  { step: 6, title: "Estimate Eligibility & Gap", detail: "Eligible = Total Pop × (Poverty Rate / 100) × 1.3. Enrolled ≈ Eligible × SNAP Rate. Gap = Eligible - Enrolled. The gap represents people who likely qualify for benefits but are not receiving them." },
                  { step: 7, title: "Verify Our Numbers", detail: "Compare your calculations to our results. If you find discrepancies, we want to know — contact mr.terryflood@gmail.com. Science requires accountability." },
                ].map(step => (
                  <div key={step.step} className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-background border">
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

        <DFCCrossNav currentPage="sdoh-chain" />
      </div>
    </div>
  );
}
