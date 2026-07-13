import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Search, MapPin, Download, Mail, FileText, Presentation, TrendingUp, TrendingDown,
  Shield, Heart, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, Loader2,
  Home, Users, GraduationCap, Briefcase, Activity, SlidersHorizontal,
  ExternalLink, DollarSign, Calendar, Building2, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

interface IndicatorData {
  povertyRate: number;
  unemploymentRate: number;
  noHighSchoolDiploma: number;
  uninsuredRate: number;
  age65Plus: number;
  ageUnder17: number;
  disabilityRate: number;
  singleParentRate: number;
  limitedEnglish: number;
  minorityPct: number;
  multiUnitHousing: number;
  overcrowding: number;
  noVehicle: number;
  noBroadband: number;
  snapRecipients: number;
}

interface GoingWellItem {
  label: string;
  detail: string;
  value: number;
}

interface NeedsAttentionItem {
  label: string;
  detail: string;
  value: number;
  solution: string;
}

interface NeighborhoodProfile {
  zipCode: string;
  neighborhoodName: string;
  stateFips: string;
  stateAbbr: string;
  stateName: string;
  countyFips: string;
  countyName: string;
  tractFips: string;
  tractName: string;
  population: number;
  medianIncome: number;
  indicators: IndicatorData;
  sviScore: number;
  themes: { socioeconomic: number; household: number; minority: number; housingTransport: number };
  goingWell: GoingWellItem[];
  needsAttention: NeedsAttentionItem[];
  generatedAt: string;
}

interface GrantMatch {
  id: string;
  title: string;
  agency: string;
  fundingAmount: string;
  deadline: string;
  description: string;
  focusAreas: string[];
  sourceUrl: string;
  matchScore: number;
  grantType: string;
  source: string;
}

interface LookupResponse {
  profile: NeighborhoodProfile;
  matchedGrants: GrantMatch[];
  disclaimer: string;
  methodology: string;
}

function SviGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct > 75 ? "text-red-600" : pct > 50 ? "text-amber-600" : pct > 25 ? "text-blue-600" : "text-green-600";
  const bgColor = pct > 75 ? "bg-red-100" : pct > 50 ? "bg-amber-100" : pct > 25 ? "bg-blue-100" : "bg-green-100";
  const label = pct > 75 ? "High Vulnerability" : pct > 50 ? "Moderate-High" : pct > 25 ? "Moderate-Low" : "Low Vulnerability";

  return (
    <div className={`${bgColor} rounded-xl p-6 text-center`} data-testid="svi-gauge">
      <div className={`text-5xl font-bold ${color}`}>{score}</div>
      <div className={`text-sm font-medium mt-1 ${color}`}>{label}</div>
      <div className="text-xs text-muted-foreground mt-1">Social Vulnerability Index (0-1 scale)</div>
    </div>
  );
}

function ThemeBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  const color = pct > 75 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : pct > 25 ? "bg-blue-500" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function NeighborhoodLookupPage() {
  const [locationInput, setLocationInput] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [neighborhoodName, setNeighborhoodName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [emailAddress, setEmailAddress] = useState("");
  const { toast } = useToast();

  const [adjustments, setAdjustments] = useState<Record<string, number>>({
    povertyChange: 0,
    unemploymentChange: 0,
    graduationChange: 0,
    insuranceChange: 0,
    transportChange: 0,
    broadbandChange: 0,
  });

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const input = locationInput.trim();
      if (!input) throw new Error("Please enter a location.");
      const isZip = /^\d{5}$/.test(input);
      let url: string;
      if (isZip) {
        url = `/api/neighborhood/lookup?zip=${input}&name=${encodeURIComponent(neighborhoodName)}`;
      } else if (/^\d{5}/.test(input)) {
        const zip = input.substring(0, 5);
        const name = input.substring(5).replace(/^[\s,\-]+/, "").trim();
        url = `/api/neighborhood/lookup?zip=${zip}&name=${encodeURIComponent(name || neighborhoodName)}`;
      } else {
        url = `/api/neighborhood/lookup?location=${encodeURIComponent(input)}&name=${encodeURIComponent(neighborhoodName)}`;
      }
      const res = await fetch(url, { signal: AbortSignal.timeout(35000) });
      if (!res.ok) {
        let errMsg = "Lookup failed";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await res.json() as LookupResponse;
      setZipCode(data.profile.zipCode);
      return data;
    },
    onError: (err: Error) => {
      toast({ title: "Lookup Failed", description: err.message, variant: "destructive" });
    },
  });

  const scenarioMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/neighborhood/scenario", {
        profile: lookupMutation.data?.profile,
        adjustments,
      });
      return res.json();
    },
  });

  const handleLookup = useCallback(() => {
    const input = locationInput.trim();
    if (!input) {
      toast({ title: "Enter a Location", description: "Type a ZIP code, neighborhood, street, or city name.", variant: "destructive" });
      return;
    }
    lookupMutation.mutate();
  }, [locationInput, neighborhoodName]);

  const handleRunScenario = useCallback(() => {
    if (!lookupMutation.data?.profile) return;
    scenarioMutation.mutate();
  }, [adjustments, lookupMutation.data]);

  const handleDownloadPdf = useCallback(async () => {
    if (!lookupMutation.data?.profile) return;
    try {
      toast({ title: "Generating PDF...", description: "Creating your neighborhood report with action plan." });
      const res = await fetch("/api/neighborhood/report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: lookupMutation.data.profile,
          grants: lookupMutation.data.matchedGrants,
          scenario: scenarioMutation.data || null,
        }),
      });
      if (!res.ok) {
        let msg = "PDF generation failed";
        try { const e = await res.json(); msg = e.error || msg; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Neighborhood_Report_${zipCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF Downloaded", description: "Your neighborhood report has been saved." });
    } catch {
      toast({ title: "Download Failed", description: "Please try again.", variant: "destructive" });
    }
  }, [lookupMutation.data, scenarioMutation.data, zipCode]);

  const handleDownloadPptx = useCallback(async () => {
    if (!lookupMutation.data?.profile) return;
    try {
      toast({ title: "Generating Presentation...", description: "Creating your 15-20 slide data story." });
      const res = await fetch("/api/neighborhood/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: lookupMutation.data.profile,
          grants: lookupMutation.data.matchedGrants,
          scenario: scenarioMutation.data || null,
        }),
      });
      if (!res.ok) {
        let msg = "Presentation generation failed";
        try { const e = await res.json(); msg = e.error || msg; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Neighborhood_Presentation_${zipCode}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Presentation Downloaded", description: "Your data story presentation has been saved." });
    } catch {
      toast({ title: "Download Failed", description: "Please try again.", variant: "destructive" });
    }
  }, [lookupMutation.data, scenarioMutation.data, zipCode]);

  const handleEmailReport = useCallback(async () => {
    if (!lookupMutation.data?.profile || !emailAddress) return;
    try {
      await apiRequest("POST", "/api/neighborhood/email-report", {
        profile: lookupMutation.data.profile,
        recipientEmail: emailAddress,
      });
      toast({ title: "Report Sent", description: `Emailed to ${emailAddress}` });
    } catch {
      toast({ title: "Email unavailable", description: "Please download the PDF instead.", variant: "destructive" });
    }
  }, [lookupMutation.data, emailAddress]);

  const profile = lookupMutation.data?.profile;
  const grants = lookupMutation.data?.matchedGrants || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <MapPin className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="page-title">Neighborhood Intelligence</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tell us where — a ZIP code, a neighborhood, a street, or a city — and instantly see what's going well, what needs attention, and what solutions are available.
          </p>
        </div>

        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-[2]">
                <Label htmlFor="locationInput" className="text-sm font-medium">Location</Label>
                <Input
                  id="locationInput"
                  data-testid="input-location"
                  placeholder="ZIP code, neighborhood, street, or city (e.g., 60617, South Shore Chicago, 78702 East Austin)"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  className="text-lg mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Works with: ZIP codes, neighborhood names, street names, city/state</p>
              </div>
              <div className="flex-1">
                <Label htmlFor="nameInput" className="text-sm font-medium">Display Name (optional)</Label>
                <Input
                  id="nameInput"
                  data-testid="input-neighborhood-name"
                  placeholder="e.g., South Shore, My Community"
                  value={neighborhoodName}
                  onChange={(e) => setNeighborhoodName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  data-testid="button-lookup"
                  onClick={handleLookup}
                  disabled={lookupMutation.isPending}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {lookupMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" /> Look Up Neighborhood</>
                  )}
                </Button>
              </div>
            </div>
            {lookupMutation.isPending && (
              <div className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
                Fetching live data from the U.S. Census Bureau... This takes a few seconds.
              </div>
            )}
          </CardContent>
        </Card>

        {profile && (
          <>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Important:</strong> {lookupMutation.data?.disclaimer}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} data-testid="button-download-pdf">
                <FileText className="h-4 w-4 mr-1" /> Download Report & Action Plan (PDF)
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPptx} data-testid="button-download-pptx">
                <Presentation className="h-4 w-4 mr-1" /> Download Presentation (PPTX)
              </Button>
              <div className="flex gap-1">
                <Input
                  data-testid="input-email"
                  placeholder="Email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-48 h-9"
                />
                <Button variant="outline" size="sm" onClick={handleEmailReport} disabled={!emailAddress} data-testid="button-email-report">
                  <Mail className="h-4 w-4 mr-1" /> Send
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="strengths" data-testid="tab-strengths">Going Well</TabsTrigger>
                <TabsTrigger value="attention" data-testid="tab-attention">Needs Attention</TabsTrigger>
                <TabsTrigger value="sandbox" data-testid="tab-sandbox">Scenario Sandbox</TabsTrigger>
                <TabsTrigger value="grants" data-testid="tab-grants">Grants & Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Population</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="text-population">{profile.population.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{profile.tractName}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" /> Median Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="text-income">
                        ${profile.medianIncome > 0 ? profile.medianIncome.toLocaleString() : "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">{profile.countyName}, {profile.stateName}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Vulnerability Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SviGauge score={profile.sviScore} />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">SVI Theme Breakdown</CardTitle>
                    <CardDescription>CDC/ATSDR Social Vulnerability Index — 4 core dimensions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ThemeBar label="Socioeconomic Status" score={profile.themes.socioeconomic} />
                    <ThemeBar label="Household Composition & Disability" score={profile.themes.household} />
                    <ThemeBar label="Racial & Ethnic Minority Status" score={profile.themes.minority} />
                    <ThemeBar label="Housing Type & Transportation" score={profile.themes.housingTransport} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Indicators vs. National Averages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { label: "Poverty Rate", val: profile.indicators.povertyRate, nat: 12.4, unit: "%", flip: true },
                        { label: "Unemployment", val: profile.indicators.unemploymentRate, nat: 3.6, unit: "%", flip: true },
                        { label: "No HS Diploma", val: profile.indicators.noHighSchoolDiploma, nat: 11, unit: "%", flip: true },
                        { label: "Uninsured", val: profile.indicators.uninsuredRate, nat: 8.3, unit: "%", flip: true },
                        { label: "No Vehicle", val: profile.indicators.noVehicle, nat: 8.5, unit: "%", flip: true },
                        { label: "No Broadband", val: profile.indicators.noBroadband, nat: 13, unit: "%", flip: true },
                        { label: "Disability Rate", val: profile.indicators.disabilityRate, nat: 13, unit: "%", flip: true },
                        { label: "Single Parent HH", val: profile.indicators.singleParentRate, nat: 25, unit: "%", flip: true },
                        { label: "Limited English", val: profile.indicators.limitedEnglish, nat: 8, unit: "%", flip: true },
                        { label: "SNAP Recipients", val: profile.indicators.snapRecipients, nat: 12, unit: "%", flip: true },
                      ].map((ind, i) => {
                        const better = ind.flip ? ind.val <= ind.nat : ind.val >= ind.nat;
                        return (
                          <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${better ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                            <span className="text-sm font-medium">{ind.label}</span>
                            <div className="flex items-center gap-3">
                              <span className={`font-bold ${better ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                                {ind.val}{ind.unit}
                              </span>
                              <span className="text-xs text-muted-foreground">Nat: {ind.nat}{ind.unit}</span>
                              {better ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2 justify-center">
                  <Link href="/sdoh-explorer"><Button variant="ghost" size="sm" data-testid="link-sdoh-explorer">SDOH Explorer <ChevronRight className="h-4 w-4" /></Button></Link>
                  <Link href="/opportunity-youth"><Button variant="ghost" size="sm" data-testid="link-oy">Opportunity Youth <ChevronRight className="h-4 w-4" /></Button></Link>
                  <Link href="/benefits-screener"><Button variant="ghost" size="sm" data-testid="link-benefits">Benefits Screener <ChevronRight className="h-4 w-4" /></Button></Link>
                  <Link href="/community-map"><Button variant="ghost" size="sm" data-testid="link-map">Community Map <ChevronRight className="h-4 w-4" /></Button></Link>
                  <Link href="/grant-narrative"><Button variant="ghost" size="sm" data-testid="link-narrative">Grant Narrative <ChevronRight className="h-4 w-4" /></Button></Link>
                </div>
              </TabsContent>

              <TabsContent value="strengths" className="space-y-4">
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="bg-green-50 dark:bg-green-900/20 rounded-t-lg">
                    <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> What's Going Well in Your Neighborhood
                    </CardTitle>
                    <CardDescription>Every community has strengths. Here's what the data says about yours.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {profile.goingWell.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        The data shows areas where your community has room to grow. Even so, every neighborhood has unquantifiable strengths — community spirit, cultural richness, resilience — that no census can measure.
                      </p>
                    ) : (
                      profile.goingWell.map((item, i) => (
                        <div key={i} className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50/50 dark:bg-green-900/10" data-testid={`strength-card-${i}`}>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold text-green-700 dark:text-green-400">{item.label}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attention" className="space-y-4">
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="bg-red-50 dark:bg-red-900/20 rounded-t-lg">
                    <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Areas That Need Attention
                    </CardTitle>
                    <CardDescription>These challenges are common, understood, and solvable. Each one comes with evidence-based solutions.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {profile.needsAttention.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Great news — the Census data shows no major vulnerability indicators for this area. Your community is statistically resilient across all SVI dimensions.
                      </p>
                    ) : (
                      profile.needsAttention.map((item, i) => (
                        <div key={i} className="border border-red-200 dark:border-red-800 rounded-lg p-4" data-testid={`attention-card-${i}`}>
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-red-700 dark:text-red-400">{item.label}</h3>
                                <Badge variant="destructive">{item.value}{typeof item.value === "number" && item.value < 100 ? "%" : ""}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.detail}</p>
                              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 border border-primary/10">
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="text-xs font-semibold text-primary uppercase">Solution</span>
                                    <p className="text-sm mt-0.5">{item.solution}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sandbox" className="space-y-4">
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader className="bg-purple-50 dark:bg-purple-900/20 rounded-t-lg">
                    <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5" /> Scenario Sandbox
                    </CardTitle>
                    <CardDescription>
                      "What if crime decreased by 25%? What if graduation increased by 13%?" Adjust the sliders below to see projected outcomes using CDC/ATSDR SVI methodology.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {[
                      { key: "povertyChange", label: "Poverty Rate Change", icon: DollarSign, range: [-50, 50] },
                      { key: "unemploymentChange", label: "Unemployment Change", icon: Briefcase, range: [-50, 50] },
                      { key: "graduationChange", label: "HS Graduation Increase", icon: GraduationCap, range: [0, 50] },
                      { key: "insuranceChange", label: "Uninsured Rate Change", icon: Heart, range: [-50, 50] },
                      { key: "transportChange", label: "No Vehicle Rate Change", icon: Home, range: [-50, 50] },
                      { key: "broadbandChange", label: "No Broadband Change", icon: Activity, range: [-50, 50] },
                    ].map((slider) => {
                      const Icon = slider.icon;
                      const val = adjustments[slider.key] || 0;
                      return (
                        <div key={slider.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2"><Icon className="h-4 w-4" /> {slider.label}</Label>
                            <span className={`text-sm font-bold ${val < 0 ? "text-green-600" : val > 0 ? (slider.key === "graduationChange" ? "text-green-600" : "text-red-600") : "text-muted-foreground"}`}>
                              {val > 0 ? "+" : ""}{val}%
                            </span>
                          </div>
                          <Slider
                            data-testid={`slider-${slider.key}`}
                            min={slider.range[0]}
                            max={slider.range[1]}
                            step={1}
                            value={[val]}
                            onValueChange={([v]) => setAdjustments(prev => ({ ...prev, [slider.key]: v }))}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{slider.key === "graduationChange" ? "No change" : `${slider.range[0]}%`}</span>
                            <span>{slider.range[1]}%</span>
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      data-testid="button-run-scenario"
                      onClick={handleRunScenario}
                      disabled={scenarioMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {scenarioMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating...</>
                      ) : (
                        <><TrendingUp className="h-4 w-4 mr-2" /> Run "What If" Scenario</>
                      )}
                    </Button>

                    {scenarioMutation.data && (
                      <div className="space-y-4 mt-4">
                        <Separator />
                        <h3 className="font-semibold text-lg">Projected Outcomes</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="bg-muted/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-muted-foreground">Current SVI</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold" data-testid="text-current-svi">{profile.sviScore}</div>
                            </CardContent>
                          </Card>
                          <Card className={scenarioMutation.data.adjusted.sviScore < profile.sviScore ? "bg-green-50 dark:bg-green-900/20 border-green-300" : "bg-red-50 dark:bg-red-900/20 border-red-300"}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-muted-foreground">Projected SVI</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-3xl font-bold ${scenarioMutation.data.adjusted.sviScore < profile.sviScore ? "text-green-700" : "text-red-700"}`} data-testid="text-projected-svi">
                                {scenarioMutation.data.adjusted.sviScore}
                              </div>
                              <div className="flex items-center gap-1 text-sm mt-1">
                                {scenarioMutation.data.adjusted.sviScore < profile.sviScore ? (
                                  <><TrendingDown className="h-4 w-4 text-green-600" /> <span className="text-green-600">Improvement</span></>
                                ) : scenarioMutation.data.adjusted.sviScore > profile.sviScore ? (
                                  <><TrendingUp className="h-4 w-4 text-red-600" /> <span className="text-red-600">Increase</span></>
                                ) : (
                                  <span className="text-muted-foreground">No change</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardContent className="pt-4">
                            <pre className="text-sm whitespace-pre-wrap font-sans" data-testid="text-scenario-narrative">
                              {scenarioMutation.data.narrative}
                            </pre>
                          </CardContent>
                        </Card>
                        <p className="text-xs text-muted-foreground text-center">
                          These projections are based on CDC/ATSDR SVI methodology. Actual outcomes depend on implementation quality, community engagement, and external factors.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grants" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" /> Matched Grants & Resources
                    </CardTitle>
                    <CardDescription>
                      Based on your neighborhood's specific challenges, these {grants.length} grants and resources are matched to your community's needs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {grants.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No matched grants found. New grants are discovered daily — check back soon or visit the Grant Hub for manual search.
                      </p>
                    ) : (
                      grants.map((g, i) => (
                        <div key={g.id || i} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors" data-testid={`grant-card-${i}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <h3 className="font-semibold text-sm">{i + 1}. {g.title}</h3>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {g.agency && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {g.agency}</span>}
                                {g.fundingAmount && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {g.fundingAmount}</span>}
                                {g.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(g.deadline).toLocaleDateString()}</span>}
                              </div>
                              {g.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{g.description}</p>}
                              {g.focusAreas && g.focusAreas.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {g.focusAreas.slice(0, 4).map((area, j) => (
                                    <Badge key={j} variant="secondary" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-xs">Match: {g.matchScore}</Badge>
                              {g.sourceUrl && (
                                <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid={`link-grant-${i}`}>
                                    View <ExternalLink className="h-3 w-3 ml-1" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex justify-center pt-4">
                      <Link href="/grants">
                        <Button variant="outline" size="sm" data-testid="link-grant-hub">
                          View All Grants in Grant Hub <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {zipCode && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">Ready for deeper analysis?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        See GIS hotspots, evidence-based interventions, and cross-city adaptation science for ZIP {zipCode}.
                      </p>
                    </div>
                    <Link href={`/community-analysis?zip=${zipCode}`}>
                      <Button size="sm" className="shrink-0" data-testid="link-community-analysis">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Open Intervention Analysis
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Data Source:</strong> U.S. Census Bureau American Community Survey 5-Year Estimates (2018-2022) |
                  <strong> Methodology:</strong> CDC/ATSDR Social Vulnerability Index |
                  <strong> Research:</strong> Stillwell, C. (2026). SVI-based geographic accountability in higher education accreditation. Under review at <em>Nature</em>. |
                  <strong> Generated:</strong> {new Date(profile.generatedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
