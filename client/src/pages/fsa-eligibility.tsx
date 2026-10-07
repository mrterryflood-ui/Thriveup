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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, ExternalLink, MapPin, Building, AlertTriangle, Sprout, ChevronRight } from "lucide-react";

const checkSchema = z.object({
  farmType: z.enum(["row-crop","livestock","mixed","organic","specialty","beginning-farmer"]),
  primaryCommodity: z.string().min(1, "Required"),
  totalAcres: z.coerce.number().positive("Must be > 0"),
  countyName: z.string().optional(),
  stateFips: z.string().optional(),
  grossFarmIncomePriorYr: z.coerce.number().min(0).optional(),
  hasEqipHistory: z.boolean().default(false),
  hasCrpHistory: z.boolean().default(false),
  isBeginningFarmer: z.boolean().default(false),
  isSociallyDisadvantaged: z.boolean().default(false),
  isVeteranFarmer: z.boolean().default(false),
});

const FARM_TYPES = [
  { value: "row-crop", label: "Row Crop (corn, soybeans, wheat, cotton…)" },
  { value: "livestock", label: "Livestock / Ranching" },
  { value: "mixed", label: "Mixed — crops + livestock" },
  { value: "organic", label: "Certified or Transitioning Organic" },
  { value: "specialty", label: "Specialty Crops" },
  { value: "beginning-farmer", label: "Beginning Farmer / Rancher" },
];

const STATES = [
  { fips: "48", name: "Texas" }, { fips: "19", name: "Iowa" }, { fips: "17", name: "Illinois" },
  { fips: "31", name: "Nebraska" }, { fips: "20", name: "Kansas" }, { fips: "27", name: "Minnesota" },
  { fips: "38", name: "North Dakota" }, { fips: "46", name: "South Dakota" }, { fips: "29", name: "Missouri" },
  { fips: "05", name: "Arkansas" }, { fips: "28", name: "Mississippi" }, { fips: "13", name: "Georgia" },
  { fips: "06", name: "California" }, { fips: "12", name: "Florida" }, { fips: "37", name: "North Carolina" },
  { fips: "39", name: "Ohio" }, { fips: "18", name: "Indiana" }, { fips: "01", name: "Alabama" },
];

const ADMIN_COLORS: Record<string, string> = {
  "USDA FSA": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "USDA NRCS": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "USDA NIFA": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "USDA FNS": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "USDA RD": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

export default function FsaEligibilityPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);

  const form = useForm<z.infer<typeof checkSchema>>({
    resolver: zodResolver(checkSchema),
    defaultValues: { farmType: "row-crop", primaryCommodity: "Corn", totalAcres: 500, hasEqipHistory: false, hasCrpHistory: false, isBeginningFarmer: false, isSociallyDisadvantaged: false, isVeteranFarmer: false },
  });

  const checkMutation = useMutation({
    mutationFn: async (values: z.infer<typeof checkSchema>) => {
      const r = await apiRequest("POST", "/api/fsa-eligibility/check", values);
      return r.json();
    },
    onSuccess: (data) => { setResult(data); toast({ title: "Eligibility check complete" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const eligible = result?.eligible || [];
  const ineligible = result?.ineligible || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Building className="w-3 h-3" /><span>FSA / NRCS Eligibility — ThriveUp</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">FSA / NRCS Program Eligibility</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">Instant eligibility screening for 8 major USDA farm programs — ARC-CO, PLC, EQIP, CRP, CSP, ELAP, and more. 2024 Farm Bill parameters.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Farm Profile</CardTitle>
                <CardDescription>Enter your farm details for instant eligibility screening</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(v => checkMutation.mutate(v))} className="space-y-4">
                    <FormField control={form.control} name="farmType" render={({ field }) => (
                      <FormItem><FormLabel>Farm Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-farm-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{FARM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="primaryCommodity" render={({ field }) => (
                      <FormItem><FormLabel>Primary Commodity</FormLabel><FormControl><Input data-testid="input-commodity" placeholder="e.g. Corn, Cattle" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="totalAcres" render={({ field }) => (
                        <FormItem><FormLabel>Total Acres</FormLabel><FormControl><Input data-testid="input-acres" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="grossFarmIncomePriorYr" render={({ field }) => (
                        <FormItem><FormLabel>Gross Farm Income</FormLabel><FormControl><Input type="number" placeholder="prior year $" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                      <Select onValueChange={v => form.setValue("stateFips", v)}>
                        <SelectTrigger className="mt-1" data-testid="select-state"><SelectValue placeholder="Select state" /></SelectTrigger>
                        <SelectContent>{STATES.map(s => <SelectItem key={s.fips} value={s.fips}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <FormField control={form.control} name="countyName" render={({ field }) => (
                      <FormItem><FormLabel>County Name</FormLabel><FormControl><Input placeholder="e.g. Travis County" {...field} /></FormControl></FormItem>
                    )} />

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Flags</p>
                      {[
                        ["hasEqipHistory", "Prior EQIP contract"],
                        ["hasCrpHistory", "Prior CRP enrollment"],
                        ["isBeginningFarmer", "Beginning farmer/rancher (< 10 years)"],
                        ["isSociallyDisadvantaged", "Socially disadvantaged producer"],
                        ["isVeteranFarmer", "Veteran farmer/rancher"],
                      ].map(([name, label]) => (
                        <FormField key={name} control={form.control} name={name as any} render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Checkbox data-testid={`check-${name}`} checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">{label}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <Button data-testid="button-check-eligibility" type="submit" className="w-full mt-2" disabled={checkMutation.isPending}>
                      {checkMutation.isPending ? "Checking eligibility…" : "Check My Eligibility"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {checkMutation.isPending && (
              <div className="flex items-center justify-center py-24">
                <div className="text-center"><Sprout className="w-10 h-10 mx-auto text-green-500 mb-3 animate-pulse" /><p className="text-slate-500">Screening against 2024 Farm Bill programs…</p></div>
              </div>
            )}
            {result && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 p-4 text-center">
                    <div className="text-3xl font-extrabold text-emerald-700" data-testid="count-eligible">{eligible.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Programs eligible</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 p-4 text-center">
                    <div className="text-3xl font-extrabold text-blue-700">${result.totalEstimatedPayment?.toLocaleString() || "—"}</div>
                    <div className="text-xs text-slate-500 mt-1">Total est. payments</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                    <div className="text-3xl font-extrabold text-slate-700 dark:text-slate-300">{ineligible.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Programs not eligible</div>
                  </div>
                </div>

                {/* AI Narrative */}
                {result.aiNarrative && (
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sprout className="w-4 h-4 text-green-600" />What to do next</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.aiNarrative}</p></CardContent>
                  </Card>
                )}

                {/* Eligible Programs */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Eligible Programs</h3>
                  {eligible.map((p: any, i: number) => (
                    <Card key={i} className="border-emerald-200 dark:border-emerald-800" data-testid={`eligible-program-${i}`}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{p.name}</h4>
                              <Badge className={`text-xs ${ADMIN_COLORS[p.adminAgency] || ""}`}>{p.adminAgency}</Badge>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{p.description}</p>
                            <p className="text-xs text-slate-500">{p.applicationPeriod}</p>
                            {p.notes && <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{p.notes}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            {p.paymentEstimate && <p className="text-sm font-bold text-emerald-700">${p.paymentEstimate?.toLocaleString()}<span className="text-xs font-normal text-slate-400"> est.</span></p>}
                            <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                              <ExternalLink className="w-3 h-3" />Apply ↗
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Ineligible */}
                {ineligible.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-slate-500 flex items-center gap-2"><XCircle className="w-4 h-4 text-slate-400" />Programs not matching current profile ({ineligible.length})</summary>
                    <div className="mt-3 space-y-2">
                      {ineligible.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-500 py-1">
                          <XCircle className="w-3 h-3 text-slate-400 shrink-0" />{p.name}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Disclaimer + office locators */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />{result.disclaimer}
                </div>
                <div className="flex gap-3">
                  <a href={result.fsaOfficeLocator} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-blue-300 text-sm text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                    <MapPin className="w-4 h-4" />Find FSA Office ↗
                  </a>
                  <a href={result.nrcsOfficeLocator} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-300 text-sm text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20">
                    <MapPin className="w-4 h-4" />Find NRCS Office ↗
                  </a>
                </div>
              </>
            )}
            {!result && !checkMutation.isPending && (
              <div className="flex items-center justify-center py-24 text-center">
                <div><Building className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500 font-medium">Enter your farm profile to screen for USDA programs</p><p className="text-xs text-slate-400 mt-2">Screens against 8 programs — ARC-CO, PLC, EQIP, CRP, CSP, ELAP, BFRDP, and more</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
