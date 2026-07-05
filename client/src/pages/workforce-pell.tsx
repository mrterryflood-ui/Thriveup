import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap, DollarSign, Layers, CheckCircle2, ArrowRight,
  Wrench, Zap, Droplets, Wind, Car, Leaf, ChevronDown, ChevronUp,
  BookOpen, TrendingUp, Users, Award, ExternalLink, Info, AlertCircle,
  Calculator, ClipboardList, FileCheck, Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PELL_MAX_ANNUAL = 4310;
const FULL_YEAR_HOURS = 900;

const TCAF_PROGRAMS = [
  {
    slug: "electrical",
    name: "Electrical Trade",
    icon: Zap,
    color: "from-yellow-500 to-amber-600",
    hours: 300,
    weeks: 10,
    occupation: "Electrician / Electrical Technician",
    certifications: ["OSHA 10", "NCCER Core", "AWD D1.1 Fundamentals"],
    wioaCategory: "In-Demand Occupation",
    placementRate: 87,
    completionRate: 82,
  },
  {
    slug: "plumbing",
    name: "Plumbing Trade",
    icon: Droplets,
    color: "from-blue-500 to-cyan-600",
    hours: 280,
    weeks: 9,
    occupation: "Plumber / Pipe Fitter",
    certifications: ["OSHA 10", "NCCER Plumbing Level 1"],
    wioaCategory: "In-Demand Occupation",
    placementRate: 84,
    completionRate: 80,
  },
  {
    slug: "hvac",
    name: "HVAC Trade",
    icon: Wind,
    color: "from-teal-500 to-emerald-600",
    hours: 320,
    weeks: 11,
    occupation: "HVAC Technician",
    certifications: ["OSHA 10", "EPA 608", "HVAC Excellence Fundamentals"],
    wioaCategory: "High-Wage / In-Demand",
    placementRate: 89,
    completionRate: 85,
  },
  {
    slug: "welding",
    name: "Welding Trade",
    icon: Wrench,
    color: "from-orange-500 to-red-600",
    hours: 250,
    weeks: 9,
    occupation: "Welder / Welding Technician",
    certifications: ["OSHA 10", "AWS D1.1 Fundamentals"],
    wioaCategory: "High-Wage / In-Demand",
    placementRate: 91,
    completionRate: 83,
  },
  {
    slug: "automotive",
    name: "Automotive Technology",
    icon: Car,
    color: "from-slate-500 to-gray-700",
    hours: 270,
    weeks: 9,
    occupation: "Automotive Technician / Mechanic",
    certifications: ["OSHA 10", "ASE A1 Prep", "Automotive Fundamentals"],
    wioaCategory: "In-Demand Occupation",
    placementRate: 82,
    completionRate: 79,
  },
  {
    slug: "ag-tech",
    name: "Ag-Tech & Precision Agriculture",
    icon: Leaf,
    color: "from-green-500 to-lime-600",
    hours: 200,
    weeks: 8,
    occupation: "Agricultural Technician / Precision Ag Specialist",
    certifications: ["OSHA 10", "Ag-Tech Fundamentals"],
    wioaCategory: "In-Demand Occupation",
    placementRate: 78,
    completionRate: 81,
  },
];

const INCOME_THRESHOLDS: Record<number, number> = {
  1: 20783,
  2: 28107,
  3: 35432,
  4: 42756,
  5: 50081,
  6: 57405,
  7: 64729,
  8: 72054,
};

function estimatePellAward(householdSize: number, annualIncome: number, programHours: number): { award: number; isFullPell: boolean; note: string } {
  const threshold = INCOME_THRESHOLDS[Math.min(householdSize, 8)] ?? 72054;
  const proration = Math.min(programHours / FULL_YEAR_HOURS, 1);
  const prorated = Math.round(PELL_MAX_ANNUAL * proration);
  if (annualIncome <= threshold) {
    return { award: prorated, isFullPell: true, note: "Estimated maximum award" };
  }
  const overThreshold = annualIncome - threshold;
  const reduction = Math.min(Math.round((overThreshold / 20000) * prorated), prorated - 200);
  const partial = Math.max(prorated - reduction, 0);
  if (partial <= 0) return { award: 0, isFullPell: false, note: "Income may exceed Pell eligibility threshold" };
  return { award: partial, isFullPell: false, note: "Estimated partial award (based on income)" };
}

const placementSchema = z.object({
  employerName: z.string().min(2, "Employer name required"),
  jobTitle: z.string().min(2, "Job title required"),
  startDate: z.string().min(1, "Start date required"),
  wage: z.string().optional(),
  placementSource: z.string().optional(),
});
type PlacementForm = z.infer<typeof placementSchema>;

export default function WorkforcePellPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [householdSize, setHouseholdSize] = useState(1);
  const [annualIncome, setAnnualIncome] = useState(24000);
  const [selectedHours, setSelectedHours] = useState(300);
  const [calcResult, setCalcResult] = useState<ReturnType<typeof estimatePellAward> | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [showPlacementForm, setShowPlacementForm] = useState(false);

  const form = useForm<PlacementForm>({
    resolver: zodResolver(placementSchema),
    defaultValues: { employerName: "", jobTitle: "", startDate: "", wage: "", placementSource: "tcaf-trade-sims" },
  });

  const placementMutation = useMutation({
    mutationFn: (data: PlacementForm) => apiRequest("POST", "/api/workforce/placements", {
      ...data,
      userId: user?.id ?? "guest",
      userName: user?.username ?? "Anonymous",
      employerId: "direct",
      startDate: new Date(data.startDate).toISOString(),
    }),
    onSuccess: () => {
      toast({ title: "Placement recorded", description: "Thank you — this data helps communities prove Workforce Pell ROI." });
      form.reset();
      setShowPlacementForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/system/pulse"] });
    },
    onError: () => toast({ title: "Could not save placement", description: "Please try again.", variant: "destructive" }),
  });

  function runCalculator() {
    setCalcResult(estimatePellAward(householdSize, annualIncome, selectedHours));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-700 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-white/20 text-white border-white/30 text-xs">Launched July 1, 2026</Badge>
            <Badge className="bg-emerald-500/90 text-white border-0 text-xs">$1.5B Federal Program</Badge>
          </div>
          <h1 className="text-3xl font-bold mb-3">Workforce Pell Grant</h1>
          <p className="text-blue-100 text-lg mb-6 max-w-2xl">
            For the first time, federal Pell Grants can pay for short-term trade and career training — as short as 8 weeks.
            TCAF's programs are designed to qualify. Up to <strong className="text-white">$4,310/year</strong> for eligible learners.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Max Award", value: "$4,310/yr", icon: DollarSign },
              { label: "Min Program", value: "8 weeks", icon: GraduationCap },
              { label: "Learners/Year", value: "190,000", icon: Users },
              { label: "Eligible Fields", value: "6 trades", icon: Wrench },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <Icon className="h-5 w-5 mx-auto mb-1 text-blue-200" />
                <div className="text-xl font-bold">{value}</div>
                <div className="text-blue-200 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Who qualifies callout */}
        <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">Who qualifies — including bachelor's degree holders</p>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  Unlike traditional Pell Grants, Workforce Pell does not exclude people with bachelor's degrees.
                  If you have a four-year degree and want to add a trade skill or change careers, you may still qualify.
                  Fill out a FAFSA and complete a qualifying program at an approved institution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculator */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold">Estimate Your Award</h2>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Household Size</Label>
                  <Select value={String(householdSize)} onValueChange={(v) => setHouseholdSize(Number(v))}>
                    <SelectTrigger className="mt-1" data-testid="select-household-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "person" : "people"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Annual Household Income</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    placeholder="24000"
                    data-testid="input-annual-income"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Program Length (Clock Hours)</Label>
                  <Select value={String(selectedHours)} onValueChange={(v) => setSelectedHours(Number(v))}>
                    <SelectTrigger className="mt-1" data-testid="select-program-hours">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="150">150 hrs (8 wks, min)</SelectItem>
                      <SelectItem value="200">200 hrs (~8 wks)</SelectItem>
                      <SelectItem value="250">250 hrs (~9 wks)</SelectItem>
                      <SelectItem value="280">280 hrs (~9 wks)</SelectItem>
                      <SelectItem value="300">300 hrs (~10 wks)</SelectItem>
                      <SelectItem value="320">320 hrs (~11 wks)</SelectItem>
                      <SelectItem value="450">450 hrs (~15 wks)</SelectItem>
                      <SelectItem value="599">599 hrs (14 wks, max)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={runCalculator} className="w-full sm:w-auto" data-testid="button-calculate-pell">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate My Estimate
              </Button>
              {calcResult && (
                <div className={`mt-4 p-4 rounded-xl border-2 ${calcResult.award > 0 ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-amber-400 bg-amber-50 dark:bg-amber-950/30"}`}>
                  <div className="flex items-start gap-3">
                    {calcResult.award > 0 ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      {calcResult.award > 0 ? (
                        <>
                          <p className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
                            Estimated Award: <span className="text-2xl">${calcResult.award.toLocaleString()}</span>
                          </p>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">{calcResult.note}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                            This covers tuition, books, supplies, transportation, and any remaining funds can go toward food, housing, internet, or childcare.
                            Stack with WIOA for additional wraparound support. ↓
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-amber-800 dark:text-amber-200">{calcResult.note}</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            You may still qualify for WIOA funding, institutional scholarships, or other state programs. Talk to a navigator.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                * Estimates only. Actual awards depend on FAFSA data, state approval, and program eligibility.
                Always complete a FAFSA for the official determination.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* WIOA Stacking Guide */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold">Stack Workforce Pell + WIOA</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-5">
                These two programs are designed to work together. Pell covers tuition and supplies.
                WIOA covers the barriers that stop people from showing up — childcare, transportation, tools, and income support.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">P</div>
                    <span className="font-semibold text-sm">Workforce Pell Covers</span>
                  </div>
                  {["Tuition and program fees", "Books and school supplies", "Transportation to school", "Housing while enrolled", "Computer or internet access", "Food or childcare (remaining funds)"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">W</div>
                    <span className="font-semibold text-sm">WIOA Covers (Gaps)</span>
                  </div>
                  {["Childcare during training hours", "Daily transportation stipend", "Work clothing / safety gear", "Tools and equipment", "Income support during training", "Job placement services after"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="my-5" />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Step 1</p>
                  <p className="text-sm font-medium">Complete your FAFSA at studentaid.gov to determine Pell eligibility</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground self-center shrink-0 hidden sm:block" />
                <div className="flex-1 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide mb-1">Step 2</p>
                  <p className="text-sm font-medium">Contact your local Texas Workforce Commission office for WIOA eligibility</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground self-center shrink-0 hidden sm:block" />
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">Step 3</p>
                  <p className="text-sm font-medium">Enroll in a qualifying TCAF program and submit both funding awards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* TCAF Programs Mapped */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold">TCAF Programs — Workforce Pell Eligible</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            All TCAF Trade Sims are designed to meet Workforce Pell criteria: 8–14 weeks, 150–599 clock hours,
            in-demand occupations, 70%+ completion and placement.
          </p>
          <div className="space-y-3">
            {TCAF_PROGRAMS.map((prog) => {
              const Icon = prog.icon;
              const isExpanded = expandedProgram === prog.slug;
              const pellAward = Math.round(PELL_MAX_ANNUAL * Math.min(prog.hours / FULL_YEAR_HOURS, 1));
              return (
                <Card key={prog.slug} className="overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedProgram(isExpanded ? null : prog.slug)}
                    data-testid={`button-expand-program-${prog.slug}`}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${prog.color} flex items-center justify-center shrink-0`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{prog.name}</p>
                            <p className="text-xs text-muted-foreground">{prog.occupation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-emerald-600">~${pellAward.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">est. Pell</p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">{prog.hours} hrs / {prog.weeks} wks</Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </button>
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 bg-muted/30 space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">WIOA Category</p>
                          <p>{prog.wioaCategory}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Completion Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${prog.completionRate}%` }} />
                            </div>
                            <span className="font-bold text-emerald-600">{prog.completionRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Placement Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${prog.placementRate}%` }} />
                            </div>
                            <span className="font-bold text-blue-600">{prog.placementRate}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Credentials Offered</p>
                        <div className="flex flex-wrap gap-1.5">
                          {prog.certifications.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Link href={`/academy/trade-sims/${prog.slug}`}>
                          <Button size="sm" className="text-xs" data-testid={`button-start-sim-${prog.slug}`}>
                            <Wrench className="h-3.5 w-3.5 mr-1.5" />
                            Try the Sim — Free
                          </Button>
                        </Link>
                        <Link href={`/academy/trade-sims/${prog.slug}/certify`}>
                          <Button size="sm" variant="outline" className="text-xs" data-testid={`button-certify-${prog.slug}`}>
                            <Award className="h-3.5 w-3.5 mr-1.5" />
                            Practice Test
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Placement Tracking */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-bold">Report a Job Placement</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Workforce Pell programs require a 70%+ placement rate within 180 days. Every placement you report
            helps TCAF maintain program eligibility and demonstrates ROI to funders.
          </p>

          {!isAuthenticated ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6 text-center">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">Sign in to report your placement</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Your placement data is private and only used for aggregate program reporting.
                </p>
                <Link href="/api/login">
                  <Button data-testid="button-signin-placement">Sign In to Report</Button>
                </Link>
              </CardContent>
            </Card>
          ) : showPlacementForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record Your Placement</CardTitle>
                <CardDescription>This stays private. Aggregate data only is shared for program compliance.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => placementMutation.mutate(d))} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="employerName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employer Name</FormLabel>
                          <FormControl><Input placeholder="Company name" {...field} data-testid="input-employer-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="jobTitle" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl><Input placeholder="e.g. Electrician Apprentice" {...field} data-testid="input-job-title" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl><Input type="date" {...field} data-testid="input-start-date" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="wage" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Wage (optional)</FormLabel>
                          <FormControl><Input placeholder="e.g. $22/hr or $45,000/yr" {...field} data-testid="input-wage" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={placementMutation.isPending} data-testid="button-submit-placement">
                        {placementMutation.isPending ? "Saving..." : "Record Placement"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowPlacementForm(false)}>Cancel</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
              <CardContent className="pt-5 pb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Got a job after completing a TCAF program?</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Takes 60 seconds. Helps thousands of future learners access Workforce Pell funding.</p>
                </div>
                <Button onClick={() => setShowPlacementForm(true)} className="shrink-0" data-testid="button-report-placement">
                  Report Placement
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Funder-facing CTA */}
        <Card className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white border-0">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-200" />
                  <span className="font-semibold">For Funders & Workforce Boards</span>
                </div>
                <p className="text-blue-100 text-sm max-w-lg">
                  TCAF is positioned to be the data infrastructure partner community colleges need to qualify
                  for Workforce Pell approval — tracking completions, placements, and ROI that institutions
                  cannot produce internally. Contact us to discuss partnership.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/connect-with-us">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="button-contact-funders">
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Contact TCAF
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
