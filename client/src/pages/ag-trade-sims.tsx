import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Droplets, FlaskConical, Leaf, ChevronRight, AlertTriangle, ExternalLink, GraduationCap, Award } from "lucide-react";

// ─── IRRIGATION ─────────────────────────────────────────────────────────────
const irrigationSchema = z.object({
  cropType: z.enum(["CORN","WHEAT","SOYBEANS","COTTON","SORGHUM","DEFAULT"]),
  growthStage: z.enum(["planting","vegetative","flowering","grain-fill","maturity"]),
  soilType: z.enum(["sandy","loam","clay-loam","clay","silt-loam"]),
  fieldAcres: z.coerce.number().positive(),
  currentSoilMoistureInches: z.coerce.number().min(0).default(2),
  precipitationLastWeekInches: z.coerce.number().min(0).default(0),
  avgTempF: z.coerce.number().default(85),
  avgRelHumidityPct: z.coerce.number().min(0).max(100).default(55),
  windSpeedMph: z.coerce.number().min(0).default(10),
});

// ─── SOIL AMENDMENT ─────────────────────────────────────────────────────────
const soilSchema = z.object({
  targetCrop: z.enum(["CORN","SOYBEANS","WHEAT","COTTON","VEGETABLE","DEFAULT"]),
  soilPh: z.coerce.number().min(3).max(10),
  organicMatterPct: z.coerce.number().min(0).max(20),
  nitrogenLbsAc: z.coerce.number().min(0).default(80),
  phosphorusLbsAc: z.coerce.number().min(0).default(25),
  potassiumLbsAc: z.coerce.number().min(0).default(100),
  cationExchangeCapacity: z.coerce.number().min(1).default(12),
  acres: z.coerce.number().positive(),
});

// ─── COVER CROP ─────────────────────────────────────────────────────────────
const coverCropSchema = z.object({
  primaryCrop: z.enum(["CORN","SOYBEANS","WHEAT","COTTON","SORGHUM","VEGETABLE"]),
  state: z.string().min(2).max(2),
  soilPh: z.coerce.number().min(3).max(10).default(6.5),
  organicMatterPct: z.coerce.number().min(0).default(2.5),
  avgAnnualPrecipIn: z.coerce.number().min(0).default(35),
  goals: z.array(z.enum(["nitrogen-fixation","erosion-control","weed-suppression","soil-health","cash-flow","pollinator"])).min(1),
});

const RISK_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  MODERATE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  LOW: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const CC_GOALS = ["nitrogen-fixation","erosion-control","weed-suppression","soil-health","cash-flow","pollinator"];
const STATE_CODES = ["AL","AR","AZ","CA","CO","FL","GA","IA","ID","IL","IN","KS","KY","LA","MI","MN","MO","MS","MT","NC","ND","NE","NM","OH","OK","OR","PA","SC","SD","TN","TX","VA","WA","WI","WY"];

export default function AgTradeSimsPage() {
  const { toast } = useToast();
  const [irrigResult, setIrrigResult] = useState<any>(null);
  const [soilResult, setSoilResult] = useState<any>(null);
  const [coverResult, setCoverResult] = useState<any>(null);
  const [credResult, setCredResult] = useState<any>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["soil-health","nitrogen-fixation"]);

  const irrigForm = useForm<z.infer<typeof irrigationSchema>>({
    resolver: zodResolver(irrigationSchema),
    defaultValues: { cropType: "CORN", growthStage: "vegetative", soilType: "loam", fieldAcres: 160, currentSoilMoistureInches: 1.5, precipitationLastWeekInches: 0.3, avgTempF: 88, avgRelHumidityPct: 52, windSpeedMph: 9 },
  });

  const soilForm = useForm<z.infer<typeof soilSchema>>({
    resolver: zodResolver(soilSchema),
    defaultValues: { targetCrop: "CORN", soilPh: 5.8, organicMatterPct: 2.1, nitrogenLbsAc: 70, phosphorusLbsAc: 18, potassiumLbsAc: 85, cationExchangeCapacity: 14, acres: 160 },
  });

  const coverForm = useForm<z.infer<typeof coverCropSchema>>({
    resolver: zodResolver(coverCropSchema),
    defaultValues: { primaryCrop: "CORN", state: "IA", soilPh: 6.2, organicMatterPct: 2.8, avgAnnualPrecipIn: 33, goals: ["soil-health","nitrogen-fixation"] },
  });

  const irrigMutation = useMutation({
    mutationFn: async (v: z.infer<typeof irrigationSchema>) => { const r = await apiRequest("POST", "/api/ag-sims/irrigation", v); return r.json(); },
    onSuccess: setIrrigResult, onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const soilMutation = useMutation({
    mutationFn: async (v: z.infer<typeof soilSchema>) => { const r = await apiRequest("POST", "/api/ag-sims/soil-amendment", v); return r.json(); },
    onSuccess: setSoilResult, onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const coverMutation = useMutation({
    mutationFn: async (v: z.infer<typeof coverCropSchema>) => { const r = await apiRequest("POST", "/api/ag-sims/cover-crop", { ...v, goals: selectedGoals }); return r.json(); },
    onSuccess: setCoverResult, onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const credMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("GET", "/api/ag-sims/credentials"); return r.json(); },
    onSuccess: setCredResult,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><FlaskConical className="w-3 h-3" /><span>Agricultural Trade Simulations — ThriveUp Academy</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Agricultural Trade Simulations</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">Physics-based irrigation (FAO-56), soil amendment, and cover crop rotation simulators. Based on NRCS practice standards and land-grant extension research.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="irrigation">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="irrigation" data-testid="tab-irrigation"><Droplets className="w-4 h-4 mr-1" />Irrigation</TabsTrigger>
            <TabsTrigger value="soil" data-testid="tab-soil"><FlaskConical className="w-4 h-4 mr-1" />Soil Amendment</TabsTrigger>
            <TabsTrigger value="covercrop" data-testid="tab-covercrop"><Leaf className="w-4 h-4 mr-1" />Cover Crops</TabsTrigger>
            <TabsTrigger value="credentials" data-testid="tab-credentials"><GraduationCap className="w-4 h-4 mr-1" />Credentials</TabsTrigger>
          </TabsList>

          {/* ─── IRRIGATION ─────── */}
          <TabsContent value="irrigation">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-600" />FAO-56 Irrigation Model</CardTitle><CardDescription>Penman-Monteith simplified water balance</CardDescription></CardHeader>
                  <CardContent>
                    <Form {...irrigForm}>
                      <form onSubmit={irrigForm.handleSubmit(v => irrigMutation.mutate(v))} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={irrigForm.control} name="cropType" render={({ field }) => (
                            <FormItem><FormLabel>Crop</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger data-testid="select-irrig-crop"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{["CORN","WHEAT","SOYBEANS","COTTON","SORGHUM","DEFAULT"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select></FormItem>
                          )} />
                          <FormField control={irrigForm.control} name="growthStage" render={({ field }) => (
                            <FormItem><FormLabel>Growth Stage</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{["planting","vegetative","flowering","grain-fill","maturity"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={irrigForm.control} name="soilType" render={({ field }) => (
                            <FormItem><FormLabel>Soil Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{["sandy","loam","clay-loam","clay","silt-loam"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select></FormItem>
                          )} />
                          <FormField control={irrigForm.control} name="fieldAcres" render={({ field }) => (
                            <FormItem><FormLabel>Field Acres</FormLabel><FormControl><Input data-testid="input-irrig-acres" type="number" {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        {[["avgTempF","Avg Temp (°F)"],["avgRelHumidityPct","Humidity (%)"],["windSpeedMph","Wind (mph)"],["precipitationLastWeekInches","Last week precip (in)"],["currentSoilMoistureInches","Current soil moisture (in)"]].map(([name, label]) => (
                          <FormField key={name} control={irrigForm.control} name={name as any} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">{label}</FormLabel><FormControl><Input type="number" step="0.1" className="text-sm" {...field} /></FormControl></FormItem>
                          )} />
                        ))}
                        <Button data-testid="button-run-irrigation" type="submit" className="w-full" disabled={irrigMutation.isPending}>
                          {irrigMutation.isPending ? "Running FAO-56 model…" : "Run Irrigation Simulation"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3 space-y-4">
                {irrigResult ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 p-4 text-center">
                        <p className="text-xs text-slate-500">ET₀ (reference)</p>
                        <p className="text-2xl font-extrabold text-blue-700">{irrigResult.eToMmPerDay} mm/day</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 p-4 text-center">
                        <p className="text-xs text-slate-500">ETc (crop, Kc={irrigResult.cropCoefficient})</p>
                        <p className="text-2xl font-extrabold text-blue-700">{irrigResult.etcMmPerDay} mm/day</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 p-4 text-center">
                        <p className="text-xs text-slate-500">Irrigation needed</p>
                        <p className="text-2xl font-extrabold text-amber-700">{irrigResult.irrigationNeededInches} in</p>
                        <p className="text-xs text-slate-400">{irrigResult.irrigationGallonsTotal?.toLocaleString()} gal total</p>
                      </div>
                      <div className={`rounded-xl border p-4 text-center ${RISK_COLORS[irrigResult.stressRisk]}`}>
                        <p className="text-xs">Stress Risk</p>
                        <p className="text-2xl font-extrabold">{irrigResult.stressRisk}</p>
                      </div>
                    </div>
                    <Card className={irrigResult.irrigationNeededInches === 0 ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"}>
                      <CardContent className="pt-4">
                        <p className="font-semibold text-sm mb-1">Recommendation</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{irrigResult.recommendation}</p>
                        {irrigResult.aiNote && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">{irrigResult.aiNote}</p>}
                        <p className="text-xs text-slate-400 mt-3">Model: {irrigResult.model}</p>
                      </CardContent>
                    </Card>
                  </>
                ) : <div className="flex items-center justify-center py-24 text-center"><div><Droplets className="w-14 h-14 mx-auto text-blue-200 mb-4" /><p className="text-slate-500">Enter parameters and run the FAO-56 irrigation simulation</p></div></div>}
              </div>
            </div>
          </TabsContent>

          {/* ─── SOIL AMENDMENT ─── */}
          <TabsContent value="soil">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FlaskConical className="w-4 h-4 text-green-600" />Soil Amendment Model</CardTitle><CardDescription>Extension soil test interpretation + NRCS Practice 590</CardDescription></CardHeader>
                  <CardContent>
                    <Form {...soilForm}>
                      <form onSubmit={soilForm.handleSubmit(v => soilMutation.mutate(v))} className="space-y-3">
                        <FormField control={soilForm.control} name="targetCrop" render={({ field }) => (
                          <FormItem><FormLabel>Target Crop</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger data-testid="select-soil-crop"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{["CORN","SOYBEANS","WHEAT","COTTON","VEGETABLE","DEFAULT"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select></FormItem>
                        )} />
                        <FormField control={soilForm.control} name="acres" render={({ field }) => (
                          <FormItem><FormLabel>Acres</FormLabel><FormControl><Input data-testid="input-soil-acres" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        {[["soilPh","Soil pH","6.8"],["organicMatterPct","Organic Matter %","2.5"],["nitrogenLbsAc","Nitrogen (lbs/ac)","80"],["phosphorusLbsAc","Phosphorus (lbs/ac)","20"],["potassiumLbsAc","Potassium (lbs/ac)","100"],["cationExchangeCapacity","CEC (meq/100g)","12"]].map(([name,label,ph]) => (
                          <FormField key={name} control={soilForm.control} name={name as any} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">{label}</FormLabel><FormControl><Input type="number" step="0.1" placeholder={ph} className="text-sm" {...field} /></FormControl></FormItem>
                          )} />
                        ))}
                        <Button data-testid="button-run-soil" type="submit" className="w-full" disabled={soilMutation.isPending}>
                          {soilMutation.isPending ? "Running soil model…" : "Run Soil Amendment Plan"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3 space-y-4">
                {soilResult ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border p-4 text-center">
                        <p className="text-xs text-slate-500">Soil pH Status</p>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-200 capitalize">{soilResult.soilHealthSummary?.phStatus}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 p-4 text-center">
                        <p className="text-xs text-slate-500">Estimated Amendment Cost</p>
                        <p className="text-xl font-bold text-amber-700">${soilResult.estimatedTotalCost?.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">total field</p>
                      </div>
                    </div>
                    {soilResult.amendments?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Amendments</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {soilResult.amendments.map((a: any, i: number) => (
                              <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                                <p className="font-semibold text-sm">{a.amendment}</p>
                                <div className="grid grid-cols-3 gap-2 mt-1 text-xs text-slate-500">
                                  <span>{a.rateLbsAc} lbs/ac</span>
                                  <span>{a.totalLbsField?.toLocaleString()} lbs total</span>
                                  <span>~${a.estimatedCostAc}/ac</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{a.source}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                      <CardContent className="pt-4 space-y-2">
                        {soilResult.recommendations?.map((r: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />{r}</div>
                        ))}
                        {soilResult.eqipEligibility && <p className="text-xs text-blue-700 dark:text-blue-400 mt-2 flex items-start gap-1"><ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />{soilResult.eqipEligibility}</p>}
                      </CardContent>
                    </Card>
                    {soilResult.aiNote && <p className="text-sm text-slate-600 dark:text-slate-400 italic">{soilResult.aiNote}</p>}
                  </>
                ) : <div className="flex items-center justify-center py-24 text-center"><div><FlaskConical className="w-14 h-14 mx-auto text-green-200 mb-4" /><p className="text-slate-500">Enter your soil test results and run the amendment model</p></div></div>}
              </div>
            </div>
          </TabsContent>

          {/* ─── COVER CROPS ─────── */}
          <TabsContent value="covercrop">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-600" />Cover Crop Selector</CardTitle><CardDescription>NRCS Practice 340 + Land Grant Extension</CardDescription></CardHeader>
                  <CardContent>
                    <Form {...coverForm}>
                      <form onSubmit={coverForm.handleSubmit(v => coverMutation.mutate(v))} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={coverForm.control} name="primaryCrop" render={({ field }) => (
                            <FormItem><FormLabel>Primary Crop</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger data-testid="select-cover-crop"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{["CORN","SOYBEANS","WHEAT","COTTON","SORGHUM","VEGETABLE"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select></FormItem>
                          )} />
                          <FormField control={coverForm.control} name="state" render={({ field }) => (
                            <FormItem><FormLabel>State (2-letter)</FormLabel><FormControl><Input data-testid="input-cover-state" maxLength={2} placeholder="IA" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        {[["soilPh","Soil pH","6.5"],["organicMatterPct","Organic Matter %","2.5"],["avgAnnualPrecipIn","Annual Precipitation (in)","35"]].map(([name,label,ph]) => (
                          <FormField key={name} control={coverForm.control} name={name as any} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">{label}</FormLabel><FormControl><Input type="number" step="0.1" placeholder={ph} className="text-sm" {...field} /></FormControl></FormItem>
                          )} />
                        ))}
                        <div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Goals (select all that apply)</p>
                          <div className="flex flex-wrap gap-2">
                            {CC_GOALS.map(g => (
                              <button key={g} type="button" data-testid={`goal-${g}`}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${selectedGoals.includes(g) ? "bg-green-600 text-white border-green-600" : "border-slate-300 dark:border-slate-600 hover:border-green-500"}`}
                                onClick={() => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}>
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Button data-testid="button-run-cover" type="submit" className="w-full" disabled={coverMutation.isPending}>
                          {coverMutation.isPending ? "Selecting cover crops…" : "Get Cover Crop Recommendations"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3 space-y-4">
                {coverResult ? (
                  <>
                    {coverResult.recommendations?.map((cc: any, i: number) => (
                      <Card key={i} className={i === 0 ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20" : ""} data-testid={`cover-rec-${i}`}>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {i === 0 && <Badge className="bg-emerald-600 text-white text-xs">Top Pick</Badge>}
                                <h4 className="font-bold text-sm">{cc.name}</h4>
                                <span className="text-xs text-slate-500 capitalize">{cc.category}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {cc.benefits?.map((b: string) => <span key={b} className="text-xs bg-white dark:bg-slate-800 border px-2 py-0.5 rounded-full">{b}</span>)}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                                <span>~${cc.seedCostPerAc}/ac seed</span>
                                <span>{cc.estimatedBiomassLbsAc?.toLocaleString()} lbs/ac</span>
                                {cc.nitrogenFixationLbsAc > 0 && <span>N-fix: {cc.nitrogenFixationLbsAc} lbs/ac</span>}
                              </div>
                              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Terminate: {cc.terminationMethod}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardContent className="pt-4 space-y-2">
                        <p className="text-sm font-semibold">Soil OM Projection (5 years)</p>
                        <p className="text-sm">{coverResult.currentOm}% → {coverResult.projectedOm5Yr?.toFixed(2)}% (+{coverResult.projectedSoilOmGain5Yr}%)</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">{coverResult.cspEligibility}</p>
                        <p className="text-xs text-green-700 dark:text-green-400">{coverResult.eqipPractice}</p>
                        {coverResult.aiNote && <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-2">{coverResult.aiNote}</p>}
                      </CardContent>
                    </Card>
                  </>
                ) : <div className="flex items-center justify-center py-24 text-center"><div><Leaf className="w-14 h-14 mx-auto text-emerald-200 mb-4" /><p className="text-slate-500">Select your primary crop, state, and goals to get cover crop recommendations</p></div></div>}
              </div>
            </div>
          </TabsContent>

          {/* ─── CREDENTIALS ─────── */}
          <TabsContent value="credentials">
            <div className="mb-4">
              <Button data-testid="button-load-creds" onClick={() => credMutation.mutate()} disabled={credMutation.isPending} variant="outline">
                {credMutation.isPending ? "Loading…" : "Load Credential Pathways"}
              </Button>
            </div>
            {credResult?.credentials ? (
              <div className="space-y-4">
                {credResult.credentials.map((c: any, i: number) => (
                  <Card key={i} data-testid={`credential-${i}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start gap-3">
                        <Award className="w-8 h-8 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm">{c.name}</h4>
                              <p className="text-xs text-slate-500">{c.org}</p>
                            </div>
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />Learn more ↗
                            </a>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{c.description}</p>
                          <p className="text-xs text-slate-400 mt-1">Relevant simulators: {c.simConnection}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Credential pathways for agricultural practitioners — CCA, NRCS CPS, pesticide license, and more</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
