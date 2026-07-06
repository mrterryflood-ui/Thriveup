import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Trophy, Building2, Users, Award, TrendingUp, ChevronRight,
  CheckCircle2, AlertTriangle, Star, BarChart3, Plus, FileText,
  Medal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TIERS = {
  gold: { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-300 dark:border-yellow-700", icon: "🥇" },
  silver: { label: "Silver", color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-300 dark:border-gray-600", icon: "🥈" },
  bronze: { label: "Bronze", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-300 dark:border-orange-700", icon: "🥉" },
  provisional: { label: "Provisional", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-300 dark:border-blue-700", icon: "🔵" },
};

const submitSchema = z.object({
  orgName: z.string().min(2, "Organization name required"),
  programName: z.string().min(2, "Program name required"),
  programType: z.enum(["workforce", "reentry", "childcare", "health", "youth", "housing"]),
  reportingPeriod: z.string().min(4, "e.g. 2024-Q4"),
  participantsServed: z.coerce.number().min(1),
  participantsCompleted: z.coerce.number().min(0),
  enteredEmployment: z.coerce.number().min(0),
  retainedEmployment6mo: z.coerce.number().min(0),
  credentialsAttained: z.coerce.number().min(0),
  measurableSkillsGains: z.coerce.number().min(0),
  medianEarnings: z.coerce.number().optional(),
  cfirFidelityScore: z.coerce.number().min(0).max(100).optional(),
  countyFips: z.string().optional(),
  notes: z.string().optional(),
});

type SubmitForm = z.infer<typeof submitSchema>;

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

function ScorecardCard({ score }: { score: any }) {
  const tier = TIERS[score.tier as keyof typeof TIERS] ?? TIERS.provisional;
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`${tier.bg} border ${tier.border} transition-shadow hover:shadow-md`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{tier.icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate" data-testid={`scorecard-org-${score.id}`}>
                {score.orgName}
              </h3>
              <Badge variant="outline" className={`${tier.color} border-current text-xs`}>
                {tier.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{score.programName} · {score.reportingPeriod}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-2xl font-bold ${tier.color}`} data-testid={`scorecard-score-${score.id}`}>{score.overallScore}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">/ 100</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          data-testid={`btn-expand-${score.id}`}
        >
          {expanded ? "Hide breakdown" : "See breakdown"}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            <ScoreBar label="Employment rate (entered)" value={score.employmentRateScore} />
            <ScoreBar label="Retention at 6 months" value={score.retentionRateScore} />
            <ScoreBar label="Credential attainment" value={score.credentialRateScore} />
            <ScoreBar label="Program completion" value={score.completionRateScore} />
            <ScoreBar label="Measurable skills gains" value={score.skillsGainsScore} />
            <ScoreBar label="Earnings" value={score.earningsScore} />
            <ScoreBar label="CFIR implementation fidelity" value={score.cfirFidelityScore} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PartnerScorecard() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { toast } = useToast();

  const { data: scores = [], isLoading: scoresLoading } = useQuery<any[]>({
    queryKey: ["/api/scorecard"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ["/api/scorecard/summary"],
  });

  const form = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      participantsServed: 0,
      participantsCompleted: 0,
      enteredEmployment: 0,
      retainedEmployment6mo: 0,
      credentialsAttained: 0,
      measurableSkillsGains: 0,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitForm) => {
      return apiRequest("POST", "/api/scorecard/submit", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scorecard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scorecard/summary"] });
      setSubmitOpen(false);
      form.reset();
      toast({ title: "Outcomes submitted", description: "Your program has been scored and added to the dashboard." });
    },
    onError: (err: any) => {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    },
  });

  const tierCounts = summary?.tierDistribution ?? {};
  const loading = scoresLoading || summaryLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Partner Effectiveness Scorecard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                WIOA/CFIR outcome rubric · collective impact across the network
              </p>
            </div>
          </div>
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button data-testid="btn-submit-outcomes" className="gap-2">
                <Plus className="w-4 h-4" />
                Submit Outcomes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Program Outcomes</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => submitMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="orgName" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl><Input data-testid="input-org-name" placeholder="Your organization..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="programName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name</FormLabel>
                        <FormControl><Input data-testid="input-program-name" placeholder="e.g. Reentry Job Readiness" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="programType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-program-type">
                              <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="workforce">Workforce</SelectItem>
                            <SelectItem value="reentry">Reentry</SelectItem>
                            <SelectItem value="childcare">Childcare</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="youth">Youth</SelectItem>
                            <SelectItem value="housing">Housing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="reportingPeriod" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Period</FormLabel>
                        <FormControl><Input data-testid="input-period" placeholder="2024-Q4" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="countyFips" render={({ field }) => (
                      <FormItem>
                        <FormLabel>County (optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-county-fips">
                              <SelectValue placeholder="Select county..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="48453">Travis</SelectItem>
                            <SelectItem value="48491">Williamson</SelectItem>
                            <SelectItem value="48209">Hays</SelectItem>
                            <SelectItem value="48021">Bastrop</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-700">
                    WIOA Performance Indicators
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "participantsServed" as const, label: "Participants Served" },
                      { name: "participantsCompleted" as const, label: "Completed Program" },
                      { name: "enteredEmployment" as const, label: "Entered Employment" },
                      { name: "retainedEmployment6mo" as const, label: "Retained at 6 Months" },
                      { name: "credentialsAttained" as const, label: "Credentials Attained" },
                      { name: "measurableSkillsGains" as const, label: "Skills Gains Documented" },
                    ].map(({ name, label }) => (
                      <FormField key={name} control={form.control} name={name} render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl><Input data-testid={`input-${name}`} type="number" min={0} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ))}
                    <FormField control={form.control} name="medianEarnings" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Median Annual Earnings ($)</FormLabel>
                        <FormControl>
                          <Input data-testid="input-earnings" type="number" min={0} placeholder="e.g. 38000" onChange={e => field.onChange(e.target.value ? Number(e.target.value) * 100 : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="cfirFidelityScore" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CFIR Fidelity Score (0–100)</FormLabel>
                        <FormControl><Input data-testid="input-cfir-score" type="number" min={0} max={100} placeholder="e.g. 75" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl><Textarea data-testid="input-notes" placeholder="Context about this reporting period..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    data-testid="btn-submit-form"
                    className="w-full"
                  >
                    {submitMutation.isPending ? "Scoring..." : "Submit & Score"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Collective impact summary */}
        {summary && !summaryLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center">
              <CardContent className="pt-4">
                <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-served">
                  {(summary.totalParticipantsServed || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">participants served</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center">
              <CardContent className="pt-4">
                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="stat-employment-rate">
                  {summary.employmentRate || 0}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">employment rate</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center">
              <CardContent className="pt-4">
                <Award className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400" data-testid="stat-credential-rate">
                  {summary.credentialRate || 0}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">credential attainment</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center">
              <CardContent className="pt-4">
                <Building2 className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-partner-orgs">
                  {summary.partnerOrgs || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">partner organizations</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tier summary badges */}
        {Object.keys(tierCounts).some(k => tierCounts[k] > 0) && (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TIERS).map(([tier, config]) => {
              const count = tierCounts[tier] || 0;
              if (count === 0) return null;
              return (
                <Badge key={tier} variant="outline" className={`${config.color} border-current text-sm px-3 py-1`} data-testid={`tier-count-${tier}`}>
                  {config.icon} {count} {config.label}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Rubric explainer */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">How scores are calculated</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  WIOA primary indicators (employment, retention, earnings, credentials, skills gains) account for 60% of the score.
                  CFIR implementation fidelity accounts for 20%. Program completion accounts for 10%. Skills gains documentation accounts for 10%.
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium"> Gold ≥80 · Silver ≥65 · Bronze ≥45 · Provisional &lt;45.</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scorecards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-xl animate-pulse border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
        ) : scores.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <Medal className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No program outcomes submitted yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Partner organizations — click "Submit Outcomes" to score your program.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {scores.map(score => (
              <ScorecardCard key={score.id} score={score} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
