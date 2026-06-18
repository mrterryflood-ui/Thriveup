import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Home, DollarSign, CheckCircle2, XCircle, ExternalLink, ChevronRight, AlertTriangle } from "lucide-react";

const US_STATES = [
  { fips: "01", abbr: "AL" }, { fips: "05", abbr: "AR" }, { fips: "04", abbr: "AZ" },
  { fips: "06", abbr: "CA" }, { fips: "08", abbr: "CO" }, { fips: "12", abbr: "FL" },
  { fips: "13", abbr: "GA" }, { fips: "19", abbr: "IA" }, { fips: "16", abbr: "ID" },
  { fips: "17", abbr: "IL" }, { fips: "18", abbr: "IN" }, { fips: "20", abbr: "KS" },
  { fips: "21", abbr: "KY" }, { fips: "22", abbr: "LA" }, { fips: "26", abbr: "MI" },
  { fips: "27", abbr: "MN" }, { fips: "29", abbr: "MO" }, { fips: "28", abbr: "MS" },
  { fips: "30", abbr: "MT" }, { fips: "37", abbr: "NC" }, { fips: "38", abbr: "ND" },
  { fips: "31", abbr: "NE" }, { fips: "35", abbr: "NM" }, { fips: "39", abbr: "OH" },
  { fips: "40", abbr: "OK" }, { fips: "41", abbr: "OR" }, { fips: "45", abbr: "SC" },
  { fips: "46", abbr: "SD" }, { fips: "47", abbr: "TN" }, { fips: "48", abbr: "TX" },
  { fips: "49", abbr: "UT" }, { fips: "51", abbr: "VA" }, { fips: "53", abbr: "WA" },
  { fips: "55", abbr: "WI" }, { fips: "56", abbr: "WY" },
];

const COUNTY_STATE_MAP: Record<string, string[]> = {
  "48": ["453","201","113","029","491"],
  "06": ["037","073","059","085","067"],
  "19": ["153","013","163","085","049"],
};

const eligSchema = z.object({
  state: z.string().min(2),
  householdSize: z.coerce.number().int().min(1).max(8),
  annualIncome: z.coerce.number().positive(),
  isElderly: z.boolean().default(false),
  isRenter: z.boolean().default(false),
  needsRepair: z.boolean().default(false),
});

const burdenSchema = z.object({
  stateFips: z.string().length(2),
  countyFips: z.string().min(3).max(3),
});

export default function RuralHousingPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);

  const eligForm = useForm<z.infer<typeof eligSchema>>({
    resolver: zodResolver(eligSchema),
    defaultValues: { state: "TX", householdSize: 4, annualIncome: 42000, isElderly: false, isRenter: false, needsRepair: false },
  });

  const burdenForm = useForm<z.infer<typeof burdenSchema>>({
    resolver: zodResolver(burdenSchema),
    defaultValues: { stateFips: "48", countyFips: "453" },
  });

  const { data: programs } = useQuery({
    queryKey: ["/api/rural-housing/programs"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/rural-housing/programs"); return r.json(); },
  });

  const { data: orgGrants } = useQuery({
    queryKey: ["/api/rural-housing/org-grants"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/rural-housing/org-grants"); return r.json(); },
  });

  const [burdenData, setBurdenData] = useState<any>(null);

  const eligMutation = useMutation({
    mutationFn: async (v: z.infer<typeof eligSchema>) => {
      const r = await apiRequest("POST", "/api/rural-housing/eligibility", v);
      return r.json();
    },
    onSuccess: setResult,
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const burdenMutation = useMutation({
    mutationFn: async (v: z.infer<typeof burdenSchema>) => {
      const r = await apiRequest("GET", `/api/rural-housing/cost-burden?stateFips=${v.stateFips}&countyFips=${v.countyFips}`);
      return r.json();
    },
    onSuccess: setBurdenData,
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const TYPE_COLORS: Record<string, string> = {
    homeownership: "bg-green-100 text-green-800",
    "homeownership-sweat": "bg-emerald-100 text-emerald-800",
    rental: "bg-blue-100 text-blue-800",
    "rental-subsidy": "bg-purple-100 text-purple-800",
    "rental-development": "bg-indigo-100 text-indigo-800",
    repair: "bg-amber-100 text-amber-800",
    "repair-grant": "bg-orange-100 text-orange-800",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Home className="w-3 h-3" /><span>Rural Housing Hub — ThriveUp Academy</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Rural Housing Hub</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">USDA Section 502 home loans · Repair grants · Rental assistance · Housing cost burden by county · Grants for nonprofits. No down payment options for qualifying families.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="screener">
          <TabsList className="mb-5 flex-wrap">
            <TabsTrigger value="screener" data-testid="tab-housing-screener"><Home className="w-3.5 h-3.5 mr-1" />Eligibility Screener</TabsTrigger>
            <TabsTrigger value="programs" data-testid="tab-housing-programs">All Programs</TabsTrigger>
            <TabsTrigger value="burden" data-testid="tab-housing-burden"><DollarSign className="w-3.5 h-3.5 mr-1" />Cost Burden</TabsTrigger>
            <TabsTrigger value="org-grants" data-testid="tab-org-grants">Org Grants</TabsTrigger>
          </TabsList>

          {/* Screener */}
          <TabsContent value="screener">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Household Profile</CardTitle><CardDescription>Screens for USDA Section 502, 504, 515, and more</CardDescription></CardHeader>
                  <CardContent>
                    <Form {...eligForm}>
                      <form onSubmit={eligForm.handleSubmit(v => eligMutation.mutate(v))} className="space-y-4">
                        <FormField control={eligForm.control} name="state" render={({ field }) => (
                          <FormItem><FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger data-testid="select-housing-state"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{US_STATES.map(s => <SelectItem key={s.fips} value={s.abbr}>{s.abbr}</SelectItem>)}</SelectContent>
                            </Select></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={eligForm.control} name="householdSize" render={({ field }) => (
                            <FormItem><FormLabel>Household Size</FormLabel><FormControl><Input data-testid="input-household-size" type="number" min={1} max={8} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={eligForm.control} name="annualIncome" render={({ field }) => (
                            <FormItem><FormLabel>Annual Income ($)</FormLabel><FormControl><Input data-testid="input-annual-income" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="space-y-2 pt-1">
                          {[
                            ["isElderly", "Age 62+ (affects repair grant)"],
                            ["isRenter", "Currently renting"],
                            ["needsRepair", "Home needs significant repair"],
                          ].map(([name, label]) => (
                            <FormField key={name} control={eligForm.control} name={name as any} render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl><Checkbox data-testid={`check-${name}`} checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">{label}</FormLabel>
                              </FormItem>
                            )} />
                          ))}
                        </div>
                        <Button data-testid="button-check-housing" type="submit" className="w-full" disabled={eligMutation.isPending}>
                          {eligMutation.isPending ? "Screening…" : "Check My Eligibility"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-4">
                {eligMutation.isPending && <div className="text-center py-16"><Home className="w-10 h-10 mx-auto text-green-500 mb-3 animate-pulse" /><p className="text-slate-500">Screening against USDA Rural Development programs…</p></div>}
                {result && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-xl p-4 text-center">
                        <p className="text-3xl font-extrabold text-green-700">{result.eligiblePrograms?.length || 0}</p>
                        <p className="text-xs text-slate-500">Programs you may qualify for</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 border rounded-xl p-4 text-center">
                        <p className="text-3xl font-extrabold text-slate-700">{(result.allPrograms ? Object.values(result.allPrograms).flat().length : 0) - (result.eligiblePrograms?.length || 0)}</p>
                        <p className="text-xs text-slate-500">Programs not matching profile</p>
                      </div>
                    </div>
                    {result.eligiblePrograms?.map((p: any, i: number) => (
                      <Card key={i} className="border-green-200 dark:border-green-800" data-testid={`eligible-housing-${i}`}>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                <p className="font-bold text-sm">{p.program || p.name}</p>
                              </div>
                              {p.keyFeatures && (
                                <ul className="space-y-0.5">
                                  {p.keyFeatures.slice(0, 3).map((f: string, j: number) => (
                                    <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1"><ChevronRight className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />{f}</li>
                                  ))}
                                </ul>
                              )}
                              {p.reason && <p className="text-xs text-slate-500 mt-1">{p.reason}</p>}
                            </div>
                            <a href={p.applyUrl || p.url} target="_blank" rel="noopener noreferrer"
                              className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <ExternalLink className="w-3 h-3" />Apply ↗
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {result.additionalPrograms?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Additional Programs to Explore</CardTitle></CardHeader>
                        <CardContent>
                          {result.additionalPrograms.map((p: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0 border-slate-100">
                              <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">{p.name}</a>
                                <p className="text-xs text-slate-500">{p.description}</p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    {result.disclaimer && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />{result.disclaimer}
                      </div>
                    )}
                    <a href={result.findOffice} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" />Find your USDA Rural Development state office ↗
                    </a>
                  </>
                )}
                {!result && !eligMutation.isPending && (
                  <div className="text-center py-20"><Home className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Fill in your household profile to screen for USDA Rural Development housing programs</p></div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* All Programs */}
          <TabsContent value="programs">
            {programs?.programs ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">All USDA Rural Development housing programs — homeownership, rental, and repair</p>
                {programs.programs.map((p: any, i: number) => (
                  <Card key={i} data-testid={`program-${i}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-sm">{p.name}</p>
                            <Badge className={`text-xs ${TYPE_COLORS[p.type] || "bg-slate-100 text-slate-700"}`}>{p.type}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                            <span>Income: {p.income}</span>
                            <span>Down: {p.downPayment}</span>
                          </div>
                        </div>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" />Details ↗</a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <p className="text-xs text-slate-400">All programs: USDA Rural Development · <a href={programs.findOffice} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Find your state office ↗</a></p>
              </div>
            ) : <div className="text-center py-12"><p className="text-slate-500">Loading programs…</p></div>}
          </TabsContent>

          {/* Cost Burden */}
          <TabsContent value="burden">
            <Card className="mb-4">
              <CardContent className="pt-4">
                <Form {...burdenForm}>
                  <form onSubmit={burdenForm.handleSubmit(v => burdenMutation.mutate(v))} className="flex flex-wrap gap-3 items-end">
                    <FormField control={burdenForm.control} name="stateFips" render={({ field }) => (
                      <FormItem><FormLabel>State FIPS</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="w-36"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{US_STATES.map(s => <SelectItem key={s.fips} value={s.fips}>{s.abbr} ({s.fips})</SelectItem>)}</SelectContent>
                        </Select></FormItem>
                    )} />
                    <FormField control={burdenForm.control} name="countyFips" render={({ field }) => (
                      <FormItem><FormLabel>County FIPS (3-digit)</FormLabel><FormControl><Input data-testid="input-county-fips" placeholder="453" className="w-28" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button data-testid="button-burden" type="submit" disabled={burdenMutation.isPending}>
                      {burdenMutation.isPending ? "Loading Census data…" : "Get Cost Burden"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            {burdenData && !burdenData.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border p-4 text-center">
                    <p className="text-2xl font-extrabold">{parseInt(burdenData.totalPop).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Total population</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-blue-700">${parseInt(burdenData.medianHouseholdIncome).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Median household income</p>
                  </div>
                  <div className={`rounded-xl border p-4 text-center ${parseFloat(burdenData.rentBurden?.costBurdenedPct || "0") > 40 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                    <p className="text-2xl font-extrabold text-amber-700">{burdenData.rentBurden?.costBurdenedPct}%</p>
                    <p className="text-xs text-slate-500">Renters cost-burdened (30%+ income)</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-red-700">{burdenData.rentBurden?.severelyCostBurdenedPct}%</p>
                    <p className="text-xs text-slate-500">Severely burdened (50%+)</p>
                  </div>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm font-semibold mb-2">Housing Stock — {burdenData.county}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-slate-500">Total housing units</p><p className="font-semibold">{parseInt(burdenData.housing?.total || "0").toLocaleString()}</p></div>
                      <div><p className="text-xs text-slate-500">Owner-occupied</p><p className="font-semibold">{parseInt(burdenData.housing?.ownerOccupied || "0").toLocaleString()} ({burdenData.housing?.ownerOccRate})</p></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">{burdenData.source}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {burdenData?.error && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700"><AlertTriangle className="w-4 h-4 inline mr-1" />{burdenData.error}</div>}
            {!burdenData && !burdenMutation.isPending && (
              <div className="text-center py-12"><DollarSign className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Enter a state FIPS and county FIPS code to pull Census housing cost burden data</p><p className="text-xs text-slate-400 mt-1">Example: State 48 (Texas) · County 453 (Travis)</p></div>
            )}
          </TabsContent>

          {/* Org Grants */}
          <TabsContent value="org-grants">
            {orgGrants?.grants ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-2">Housing funding for nonprofits, CDCs, and community organizations</p>
                {orgGrants.grants.map((g: any, i: number) => (
                  <Card key={i} data-testid={`org-grant-${i}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-sm">{g.name}</p>
                          {g.amount && <Badge className="text-xs bg-green-100 text-green-800 mt-0.5">{g.amount}</Badge>}
                          <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                        </div>
                        <a href={g.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-blue-600 hover:underline flex items-center gap-0.5"><ExternalLink className="w-3 h-3" />Learn more ↗</a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <div className="text-center py-12"><p className="text-slate-500">Loading housing grant opportunities…</p></div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
