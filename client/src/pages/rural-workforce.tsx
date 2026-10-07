import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, TrendingUp, Award, Users, BookOpen, ChevronRight, ExternalLink, MapPin, Star } from "lucide-react";
import { EvidenceSummary } from "@/components/evidence-label";

const US_STATES_WITH_FIPS = [
  { fips: "48", abbr: "TX" }, { fips: "19", abbr: "IA" }, { fips: "17", abbr: "IL" },
  { fips: "31", abbr: "NE" }, { fips: "20", abbr: "KS" }, { fips: "27", abbr: "MN" },
  { fips: "38", abbr: "ND" }, { fips: "46", abbr: "SD" }, { fips: "29", abbr: "MO" },
  { fips: "05", abbr: "AR" }, { fips: "28", abbr: "MS" }, { fips: "01", abbr: "AL" },
  { fips: "13", abbr: "GA" }, { fips: "06", abbr: "CA" }, { fips: "12", abbr: "FL" },
  { fips: "37", abbr: "NC" }, { fips: "39", abbr: "OH" }, { fips: "18", abbr: "IN" },
];

const CAREER_PATH_COLORS: Record<string, string> = {
  technical: "bg-blue-100 text-blue-800", conservation: "bg-green-100 text-green-800",
  management: "bg-purple-100 text-purple-800", government: "bg-indigo-100 text-indigo-800",
  health: "bg-red-100 text-red-800", finance: "bg-amber-100 text-amber-800",
  compliance: "bg-slate-100 text-slate-800", energy: "bg-yellow-100 text-yellow-800",
  animal: "bg-orange-100 text-orange-800", market: "bg-teal-100 text-teal-800",
};

const pathwaySchema = z.object({
  currentRole: z.string().min(1),
  educationLevel: z.enum(["no-hs","high-school","some-college","associate","bachelor","graduate"]),
  state: z.string().min(2),
  isNfjpEligible: z.boolean().default(false),
});

const GOAL_OPTIONS = ["technical","conservation","management","government","health","finance","animal","energy","market"];

interface PlaceStory {
  displayName: string;
  population: number | null;
  povertyRate: number | null;
  unemploymentRate: number | null;
  medianIncome: number | null;
  gapDiagnosis?: { primaryGap?: string };
}

function CountyWorkforceDetail({ countyFips }: { countyFips: string }) {
  const { data: story, isLoading, error } = useQuery<PlaceStory>({
    queryKey: ["/api/place-story", "48", countyFips],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/place-story/48/${countyFips}`);
      return response.json();
    },
  });
  const percent = (value: number | null | undefined) => value == null ? "Not available" : `${value.toFixed(1)}%`;
  const currency = (value: number | null | undefined) => value == null ? "Not available" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  if (isLoading) return <main className="container mx-auto max-w-5xl px-4 py-10">Loading county workforce context…</main>;
  if (error || !story) return <main className="container mx-auto max-w-5xl px-4 py-10">Unable to load county workforce context.</main>;

  const claims = [
    { value: story.population, unit: "people", source: "ACS 5-Year 2022", sourceId: "census-acs5-2022", asOfDate: "2022-01-01", geographyKey: `48${countyFips}`, confidence: "verified" as const, decisionCaption: "County population informs workforce service scale." },
    { value: story.povertyRate, unit: "%", source: "ACS 5-Year 2022", sourceId: "census-acs5-2022", asOfDate: "2022-01-01", geographyKey: `48${countyFips}`, confidence: "verified" as const, decisionCaption: "Poverty rate helps identify economic barriers to workforce participation." },
    { value: story.unemploymentRate, unit: "%", source: "ACS 5-Year 2022", sourceId: "census-acs5-2022", asOfDate: "2022-01-01", geographyKey: `48${countyFips}`, confidence: "verified" as const, decisionCaption: "Unemployment rate provides local labor-market context." },
  ];

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm font-medium text-green-700">Texas county deep-dive</p>
        <h1 className="text-3xl font-bold">{story.displayName}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Population", story.population?.toLocaleString() ?? "Not available"], ["Poverty rate", percent(story.povertyRate)], ["Unemployment rate", percent(story.unemploymentRate)], ["Median income", currency(story.medianIncome)]].map(([label, value]) => (
          <Card key={label}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></CardContent></Card>
        ))}
      </div>
      <EvidenceSummary claims={claims} />
      <Card>
        <CardHeader><CardTitle>Community Context</CardTitle></CardHeader>
        <CardContent><p>{story.gapDiagnosis?.primaryGap ?? "No primary gap diagnosis is currently available for this county."}</p></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Workforce Resources</CardTitle></CardHeader>
        <CardContent><a className="inline-flex items-center gap-1 text-blue-600 hover:underline" href={`https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx?location=${countyFips}`} target="_blank" rel="noreferrer">Find local workforce support through CareerOneStop <ExternalLink className="h-4 w-4" /></a></CardContent>
      </Card>
    </main>
  );
}

export default function RuralWorkforcePage() {
  const { countyFips } = useParams<{ countyFips?: string }>();
  if (countyFips) return <CountyWorkforceDetail countyFips={countyFips} />;
  const [state, setState] = useState("TX");
  const [stateFips, setStateFips] = useState("48");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [pathwayResult, setPathwayResult] = useState<any>(null);

  const pathwayForm = useForm<z.infer<typeof pathwaySchema>>({
    resolver: zodResolver(pathwaySchema),
    defaultValues: { currentRole: "farmworker", educationLevel: "high-school", state: "TX", isNfjpEligible: false },
  });

  const { data: careers } = useQuery({
    queryKey: ["/api/rural-workforce/careers"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/rural-workforce/careers"); return r.json(); },
  });

  const { data: training } = useQuery({
    queryKey: ["/api/rural-workforce/training"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/rural-workforce/training"); return r.json(); },
  });

  const { data: credentials } = useQuery({
    queryKey: ["/api/rural-workforce/credentials"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/rural-workforce/credentials"); return r.json(); },
  });

  const { data: landGrants } = useQuery({
    queryKey: ["/api/rural-workforce/land-grants", state],
    queryFn: async () => { const r = await apiRequest("GET", `/api/rural-workforce/land-grants?state=${state}`); return r.json(); },
  });

  const { data: wageData } = useQuery({
    queryKey: ["/api/rural-workforce/wages", stateFips],
    queryFn: async () => { const r = await apiRequest("GET", `/api/rural-workforce/wages?stateFips=${stateFips}`); return r.json(); },
  });

  const pathwayMutation = useMutation({
    mutationFn: async (v: z.infer<typeof pathwaySchema>) => {
      const r = await apiRequest("POST", "/api/rural-workforce/pathway", { ...v, goals: selectedGoals });
      return r.json();
    },
    onSuccess: setPathwayResult,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><GraduationCap className="w-3 h-3" /><span>Rural Education & Workforce — ThriveUp</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Rural Education & Ag Workforce Pipeline</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">Ag career paths · NFJP training coverage · USDA 1890 HBCU scholars · FFA / 4-H · Land-grant universities · Credential pathways. From farmworker to farm manager.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="text-xs text-slate-500 block mb-1">State</label>
            <Select value={state} onValueChange={v => { setState(v); const sf = US_STATES_WITH_FIPS.find(s => s.abbr === v); if (sf) setStateFips(sf.fips); pathwayForm.setValue("state", v); }}>
              <SelectTrigger className="w-36" data-testid="select-workforce-state"><SelectValue /></SelectTrigger>
              <SelectContent>{US_STATES_WITH_FIPS.map(s => <SelectItem key={s.fips} value={s.abbr}>{s.abbr}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="pathway">
          <TabsList className="mb-5 flex-wrap">
            <TabsTrigger value="pathway" data-testid="tab-pathway"><Star className="w-3.5 h-3.5 mr-1" />My Pathway</TabsTrigger>
            <TabsTrigger value="careers" data-testid="tab-careers"><TrendingUp className="w-3.5 h-3.5 mr-1" />Ag Careers</TabsTrigger>
            <TabsTrigger value="training" data-testid="tab-training"><BookOpen className="w-3.5 h-3.5 mr-1" />Training Programs</TabsTrigger>
            <TabsTrigger value="credentials" data-testid="tab-credentials"><Award className="w-3.5 h-3.5 mr-1" />Credentials</TabsTrigger>
            <TabsTrigger value="institutions" data-testid="tab-institutions"><GraduationCap className="w-3.5 h-3.5 mr-1" />Land-Grants & HBCUs</TabsTrigger>
          </TabsList>

          {/* Pathway Builder */}
          <TabsContent value="pathway">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Build My Ag Career Pathway</CardTitle><CardDescription>Personalized plan based on your current situation</CardDescription></CardHeader>
                  <CardContent>
                    <Form {...pathwayForm}>
                      <form onSubmit={pathwayForm.handleSubmit(v => pathwayMutation.mutate(v))} className="space-y-4">
                        <FormField control={pathwayForm.control} name="currentRole" render={({ field }) => (
                          <FormItem><FormLabel>Current Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger data-testid="select-current-role"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {["farmworker","seasonal worker","H-2A visa worker","beginning farmer","rancher","agricultural student","rural small business owner","ag professional seeking advancement"].map(r => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select></FormItem>
                        )} />
                        <FormField control={pathwayForm.control} name="educationLevel" render={({ field }) => (
                          <FormItem><FormLabel>Education Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {[["no-hs","No high school diploma"],["high-school","High school diploma / GED"],["some-college","Some college"],["associate","Associate degree"],["bachelor","Bachelor's degree"],["graduate","Graduate degree"]].map(([v, l]) => (
                                  <SelectItem key={v} value={v}>{l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select></FormItem>
                        )} />
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Career Goals (select any)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {GOAL_OPTIONS.map(g => (
                              <button key={g} type="button" data-testid={`goal-${g}`}
                                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${selectedGoals.includes(g) ? `${CAREER_PATH_COLORS[g]} border-transparent` : "border-slate-300 dark:border-slate-600 hover:border-green-400"}`}
                                onClick={() => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}>
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                        <FormField control={pathwayForm.control} name="isNfjpEligible" render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">I am / was a seasonal or migrant farmworker (NFJP eligible)</FormLabel>
                          </FormItem>
                        )} />
                        <Button data-testid="button-build-pathway" type="submit" className="w-full" disabled={pathwayMutation.isPending}>
                          {pathwayMutation.isPending ? "Building pathway…" : "Build My Career Pathway"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-4">
                {pathwayResult ? (
                  <>
                    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Immediate Next Steps</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {pathwayResult.pathway?.immediateSteps?.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />{s}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recommended Careers for Your Profile</p>
                      {pathwayResult.pathway?.recommendedCareers?.map((c: any, i: number) => (
                        <Card key={i} data-testid={`pathway-career-${i}`}>
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm">{c.title}</p>
                                <div className="flex gap-2 mt-0.5"><Badge className={`text-xs ${CAREER_PATH_COLORS[c.path] || ""}`}>{c.path}</Badge><span className="text-xs text-slate-500">{c.growth} growth</span></div>
                              </div>
                              <div className="text-right"><p className="font-bold text-green-700">${c.medianWage?.toLocaleString()}</p><p className="text-xs text-slate-400">median wage</p></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Credential: {c.credential} · ~{c.daysToCredential} days</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {pathwayResult.pathway?.recommendedCredentials?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Credentials</CardTitle></CardHeader>
                        <CardContent>
                          {pathwayResult.pathway.recommendedCredentials.map((c: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0 border-slate-100">
                              <Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">{c.name}</a>
                                <p className="text-xs text-slate-500">{c.org} · {c.studyTime}</p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-24 text-center"><div><GraduationCap className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Fill in your profile and build a personalized agricultural career pathway</p></div></div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Careers */}
          <TabsContent value="careers">
            <div className="space-y-3">
              {careers?.careers?.map((c: any, i: number) => (
                <Card key={i} data-testid={`career-card-${i}`}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold text-sm">{c.title}</p>
                          <Badge className={`text-xs ${CAREER_PATH_COLORS[c.path] || "bg-slate-100 text-slate-700"}`}>{c.path}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">Credential: {c.credential} · ~{c.daysToCredential} days · Job growth: {c.growth}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-green-700">${c.medianWage?.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">median/yr</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <p className="text-xs text-slate-400 text-center">Sources: BLS Occupational Outlook Handbook · USDA / {careers?.source}</p>
            </div>
          </TabsContent>

          {/* Training Programs */}
          <TabsContent value="training">
            <div className="space-y-4">
              {training?.programs?.map((p: any, i: number) => (
                <Card key={i} data-testid={`training-program-${i}`} className={i === 0 ? "border-green-300 dark:border-green-700" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {i === 0 && <Star className="w-4 h-4 text-amber-500" />}{p.name}
                    </CardTitle>
                    <CardDescription>{p.administrator}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{p.description}</p>
                    {p.eligibility && <p className="text-xs text-slate-500 mb-1"><span className="font-semibold">Eligibility:</span> {p.eligibility}</p>}
                    {(p.fundingAvailable || p.funding) && <p className="text-sm font-bold text-green-700 mb-2">💰 {p.fundingAvailable || p.funding}</p>}
                    {p.equityNote && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2 mb-2">
                        <p className="text-xs text-amber-700 dark:text-amber-400">{p.equityNote}</p>
                      </div>
                    )}
                    {p.scholarships && <p className="text-xs text-blue-700 mb-2">🎓 {p.scholarships}</p>}
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Apply / Learn more ↗</a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Credentials */}
          <TabsContent value="credentials">
            <div className="space-y-3">
              {credentials?.credentials?.map((c: any, i: number) => (
                <Card key={i} data-testid={`cred-card-${i}`}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Award className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm text-blue-600 hover:underline">{c.name}</a>
                          <p className="text-xs text-slate-500">{c.org}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Study time: {c.studyTime}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.relevance?.map((r: string) => <span key={r} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{r}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Land-Grants & HBCUs */}
          <TabsContent value="institutions">
            <div className="space-y-4">
              {landGrants?.universities?.map((u: any, i: number) => (
                <Card key={i} className={u.isHBCU ? "border-amber-200 dark:border-amber-800" : ""} data-testid={`university-${i}`}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-bold text-sm">{u.name}</p>
                          <div className="flex gap-1 mt-0.5">
                            {u.isHBCU && <Badge className="text-xs bg-amber-100 text-amber-800">1890 HBCU</Badge>}
                            {u.isHSI && <Badge className="text-xs bg-purple-100 text-purple-800">HSI</Badge>}
                          </div>
                        </div>
                      </div>
                      <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"><ExternalLink className="w-3 h-3" />Visit ↗</a>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold mb-2">USDA 1890 Scholars Program — Full Scholarships at HBCUs</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Full tuition, fees, books, room & board, summer internships, and USDA job offer upon graduation. For students at 1890 HBCU land-grant institutions pursuing ag-related degrees.</p>
                  <a href="https://www.fs.usda.gov/careers/students-and-early-careers/usda-1890" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Apply for USDA 1890 Scholars ↗</a>
                </CardContent>
              </Card>
              <div className="flex flex-wrap gap-3">
                <a href={landGrants?.extensionFinder} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" /><MapPin className="w-3.5 h-3.5" />Find my county extension office ↗</a>
                <a href="https://4-h.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />4-H Programs ↗</a>
                <a href="https://www.ffa.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />National FFA ↗</a>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
