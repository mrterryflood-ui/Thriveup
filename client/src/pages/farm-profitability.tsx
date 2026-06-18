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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Sprout, AlertTriangle, ExternalLink, Minus } from "lucide-react";

const COMMODITIES = ["CORN","SOYBEANS","WHEAT","SORGHUM","BARLEY","COTTON","RICE","PEANUTS","SUNFLOWERS","CATTLE","HOGS"];
const STATES = [
  { fips: "48", name: "Texas" }, { fips: "19", name: "Iowa" }, { fips: "17", name: "Illinois" },
  { fips: "31", name: "Nebraska" }, { fips: "20", name: "Kansas" }, { fips: "27", name: "Minnesota" },
  { fips: "38", name: "North Dakota" }, { fips: "46", name: "South Dakota" }, { fips: "29", name: "Missouri" },
  { fips: "05", name: "Arkansas" }, { fips: "28", name: "Mississippi" }, { fips: "01", name: "Alabama" },
  { fips: "13", name: "Georgia" }, { fips: "06", name: "California" }, { fips: "12", name: "Florida" },
  { fips: "37", name: "North Carolina" }, { fips: "39", name: "Ohio" }, { fips: "18", name: "Indiana" },
];

const calcSchema = z.object({
  commodity: z.string().min(1),
  acres: z.coerce.number().positive("Must be > 0"),
  yieldPerAcre: z.coerce.number().positive("Must be > 0"),
  pricePerUnit: z.coerce.number().positive("Must be > 0"),
  priceUnit: z.string().optional(),
  seedCostPerAc: z.coerce.number().min(0).default(0),
  fertCostPerAc: z.coerce.number().min(0).default(0),
  chemCostPerAc: z.coerce.number().min(0).default(0),
  fuelCostPerAc: z.coerce.number().min(0).default(0),
  laborCostPerAc: z.coerce.number().min(0).default(0),
  otherCostPerAc: z.coerce.number().min(0).default(0),
  stateFips: z.string().optional(),
  countyName: z.string().optional(),
  cropYear: z.coerce.number().default(2024),
  snapshotName: z.string().optional(),
});

function DeltaBadge({ value, suffix = "%" }: { value: string | null | undefined; suffix?: string }) {
  if (!value) return <span className="text-slate-400 text-xs">—</span>;
  const num = parseFloat(value);
  if (num > 0) return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">▲ {value}{suffix}</Badge>;
  if (num < 0) return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">▼ {value}{suffix}</Badge>;
  return <Badge variant="outline" className="text-xs"><Minus className="w-2 h-2 mr-0.5" />{value}{suffix}</Badge>;
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "green" | "red" | "blue" | "default" }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    red: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    default: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
  };
  const textColors: Record<string, string> = { green: "text-emerald-700 dark:text-emerald-400", red: "text-red-700 dark:text-red-400", blue: "text-blue-700 dark:text-blue-400", default: "text-slate-900 dark:text-slate-100" };
  const key = accent || "default";
  return (
    <div className={`rounded-xl border p-4 ${colors[key]}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${textColors[key]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function FarmProfitabilityPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [selectedState, setSelectedState] = useState("");

  const form = useForm<z.infer<typeof calcSchema>>({
    resolver: zodResolver(calcSchema),
    defaultValues: { commodity: "CORN", acres: 500, yieldPerAcre: 180, pricePerUnit: 4.80, cropYear: 2024, seedCostPerAc: 115, fertCostPerAc: 185, chemCostPerAc: 60, fuelCostPerAc: 35, laborCostPerAc: 25, otherCostPerAc: 80 },
  });

  const benchmarkQuery = useMutation({
    mutationFn: async (commodity: string) => {
      const r = await apiRequest("GET", `/api/farm-profitability/benchmarks?commodity=${commodity}&stateFips=${selectedState}`);
      const data = await r.json();
      setBenchmarks(data);
      // Pre-fill price if available
      if (data.nassPrice?.price) form.setValue("pricePerUnit", data.nassPrice.price);
      if (data.nassYield?.yield) form.setValue("yieldPerAcre", data.nassYield.yield);
      if (data.typicalInputCostsPerAcre) {
        const c = data.typicalInputCostsPerAcre;
        form.setValue("seedCostPerAc", c.seed);
        form.setValue("fertCostPerAc", c.fert);
        form.setValue("chemCostPerAc", c.chem);
        form.setValue("fuelCostPerAc", c.fuel);
        form.setValue("laborCostPerAc", c.labor);
        form.setValue("otherCostPerAc", c.other);
      }
      return data;
    },
  });

  const calcMutation = useMutation({
    mutationFn: async (values: z.infer<typeof calcSchema>) => {
      const r = await apiRequest("POST", "/api/farm-profitability/calculate", { ...values, stateFips: selectedState });
      return r.json();
    },
    onSuccess: (data) => { setResult(data); toast({ title: "Analysis complete" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/farm-profitability/compare", { commodities: ["CORN","SOYBEANS","WHEAT","SORGHUM"], acres: form.getValues("acres"), stateFips: selectedState });
      return r.json();
    },
  });

  const commodity = form.watch("commodity");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /><span>Farm Profitability Navigator — ThriveUp Academy</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Farm Profitability Navigator</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">Enterprise budget calculator using live USDA NASS prices + yields. Compare your farm to county and state benchmarks. All inputs editable.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="calculator">
          <TabsList className="mb-6">
            <TabsTrigger value="calculator" data-testid="tab-calculator">💰 Enterprise Budget</TabsTrigger>
            <TabsTrigger value="compare" data-testid="tab-compare">📊 Commodity Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Crop Parameters</CardTitle>
                    <CardDescription>Enter your farm data — or load USDA benchmarks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(v => calcMutation.mutate(v))} className="space-y-3">
                        <FormField control={form.control} name="commodity" render={({ field }) => (
                          <FormItem><FormLabel>Commodity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger data-testid="select-commodity"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{COMMODITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State (for NASS data)</label>
                          <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger data-testid="select-state" className="mt-1"><SelectValue placeholder="Any state" /></SelectTrigger>
                            <SelectContent>{STATES.map(s => <SelectItem key={s.fips} value={s.fips}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="w-full" data-testid="button-load-benchmarks"
                          onClick={() => benchmarkQuery.mutate(commodity)} disabled={benchmarkQuery.isPending}>
                          {benchmarkQuery.isPending ? "Loading USDA data…" : "Load USDA Benchmarks"}
                        </Button>
                        {benchmarks && <p className="text-xs text-green-600">✓ NASS data loaded — inputs pre-filled</p>}
                        <div className="grid grid-cols-2 gap-2">
                          <FormField control={form.control} name="acres" render={({ field }) => (
                            <FormItem><FormLabel>Acres</FormLabel><FormControl><Input data-testid="input-acres" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="cropYear" render={({ field }) => (
                            <FormItem><FormLabel>Crop Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField control={form.control} name="yieldPerAcre" render={({ field }) => (
                            <FormItem><FormLabel>Yield/ac</FormLabel><FormControl><Input data-testid="input-yield" type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="pricePerUnit" render={({ field }) => (
                            <FormItem><FormLabel>Price/unit</FormLabel><FormControl><Input data-testid="input-price" type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <p className="text-xs font-semibold text-slate-500 pt-1">Input Costs ($/ac)</p>
                        {[["seedCostPerAc","Seed"],["fertCostPerAc","Fertilizer"],["chemCostPerAc","Chemicals"],["fuelCostPerAc","Fuel"],["laborCostPerAc","Labor"],["otherCostPerAc","Other"]].map(([name, label]) => (
                          <FormField key={name} control={form.control} name={name as any} render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormLabel className="w-24 text-xs shrink-0">{label}</FormLabel>
                              <FormControl><Input type="number" step="0.01" className="text-sm" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        ))}
                        <Button data-testid="button-calculate" type="submit" className="w-full mt-2" disabled={calcMutation.isPending}>
                          {calcMutation.isPending ? "Calculating…" : "Calculate Profitability"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <div className="lg:col-span-3 space-y-4">
                {calcMutation.isPending && (
                  <div className="flex items-center justify-center py-24">
                    <div className="text-center"><DollarSign className="w-10 h-10 mx-auto text-green-500 mb-3 animate-pulse" /><p className="text-slate-500">Pulling USDA NASS prices…</p></div>
                  </div>
                )}
                {result && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="Gross Revenue / Acre" value={`$${result.grossRevenue?.perAcre?.toFixed(2)}`} sub={`$${result.grossRevenue?.total?.toLocaleString()} total`} accent="blue" />
                      <MetricCard label="Total Input Cost / Acre" value={`$${result.inputCosts?.perAcre?.toFixed(2)}`} sub={`$${result.inputCosts?.total?.toLocaleString()} total`} accent="default" />
                      <MetricCard label="Net Return / Acre" value={`$${result.netReturn?.perAcre?.toFixed(2)}`} sub={`$${result.netReturn?.total?.toLocaleString()} total`} accent={result.netReturn?.perAcre >= 0 ? "green" : "red"} />
                      <MetricCard label="Break-Even Price" value={result.breakEvenPrice ? `$${result.breakEvenPrice}/${result.priceUnit || "unit"}` : "—"} sub="Below this = loss" accent="default" />
                    </div>

                    {/* NASS Comparison */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" />USDA NASS Comparison ({result.nassComparison?.nassAvgPriceYear})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {result.nassComparison?.nassAvgPrice ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-600">Your price vs NASS avg</span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">${result.nassComparison.nassAvgPrice}/{result.nassComparison.nassAvgPriceUnit}</span>
                                <DeltaBadge value={result.nassComparison.priceVsNass} />
                              </div>
                            </div>
                            {result.nassComparison.nassAvgYield && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Your yield vs NASS avg</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">{result.nassComparison.nassAvgYield} {result.nassComparison.nassAvgYieldUnit}</span>
                                  <DeltaBadge value={result.nassComparison.yieldVsNass} />
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-slate-400">Source: USDA NASS QuickStats</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">NASS did not return data for this commodity/state — enter your own price and yield above.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* FSA Estimates */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">FSA Payment Estimates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500">ARC-CO Estimate</p>
                            <p className="text-xl font-bold text-amber-700">${result.fsaEstimates?.arcCoPaymentTotal?.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">${result.fsaEstimates?.arcCoPaymentPerAc}/ac</p>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500">PLC Estimate</p>
                            <p className="text-xl font-bold text-amber-700">${result.fsaEstimates?.plcPaymentTotal?.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">${result.fsaEstimates?.plcPaymentPerAc}/ac</p>
                          </div>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{result.fsaEstimates?.disclaimer}
                        </p>
                        <a href="https://www.fsa.usda.gov/programs-and-services/arcplc_program/index" target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                          <ExternalLink className="w-3 h-3" />Enroll at USDA FSA ↗
                        </a>
                      </CardContent>
                    </Card>

                    {/* AI Insights */}
                    {result.aiInsights && (
                      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><Sprout className="w-4 h-4 text-green-600" />AI Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{result.aiInsights}</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
                {!result && !calcMutation.isPending && (
                  <div className="flex items-center justify-center py-24 text-center">
                    <div><TrendingUp className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Fill in your crop parameters and click Calculate</p><p className="text-xs text-slate-400 mt-1">Or click "Load USDA Benchmarks" to auto-fill with NASS averages</p></div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Commodity Side-by-Side Comparison</CardTitle>
                <CardDescription>Live USDA NASS prices + typical input costs for CORN, SOYBEANS, WHEAT, SORGHUM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-4">
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="All states" /></SelectTrigger>
                    <SelectContent>{STATES.map(s => <SelectItem key={s.fips} value={s.fips}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button data-testid="button-compare" onClick={() => compareMutation.mutate()} disabled={compareMutation.isPending}>
                    {compareMutation.isPending ? "Fetching NASS data…" : "Compare Commodities"}
                  </Button>
                </div>
                {compareMutation.data?.comparison && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 text-slate-500">Commodity</th>
                        <th className="text-right py-2 text-slate-500">NASS Price</th>
                        <th className="text-right py-2 text-slate-500">NASS Yield</th>
                        <th className="text-right py-2 text-slate-500">Typical Cost/ac</th>
                        <th className="text-right py-2 text-slate-500">Est. Net Return/ac</th>
                      </tr></thead>
                      <tbody>{compareMutation.data.comparison.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 font-semibold">{row.commodity}</td>
                          <td className="text-right py-3">{row.nassPrice ? `$${row.nassPrice}` : "—"} <span className="text-slate-400 text-xs">{row.priceUnit}</span></td>
                          <td className="text-right py-3">{row.nassYield || "—"}</td>
                          <td className="text-right py-3">{row.typicalInputCost ? `$${row.typicalInputCost}` : "—"}</td>
                          <td className={`text-right py-3 font-bold ${(row.estimatedNetReturnPerAc ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {row.estimatedNetReturnPerAc !== null ? `$${row.estimatedNetReturnPerAc?.toFixed(0)}` : "—"}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                    <p className="text-xs text-slate-400 mt-3">Source: {compareMutation.data.source}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
