import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TrainingGuideButton } from "@/components/training-guide";
import {
  BarChart3, Plus, Download, FileText, Target, Users,
  Briefcase, GraduationCap, Home, Heart, Shield, TrendingUp, CheckCircle2, Filter, Loader2,
} from "lucide-react";

interface OutcomeDashboard {
  totalOutcomes: number;
  uniqueParticipants: number;
  totalActivePlans: number;
  milestoneCompletionRate: number;
  [categoryKey: string]: unknown;
}

interface DOJReport {
  generatedAt: string;
  reportType: string;
  grantProgram: string;
  programOverview: { totalParticipantsServed: number; activePlans: number; completedPlans: number; programCompletionRate: number };
  recidivismOutcomes: { sixMonth: { tracked: number; noReoffense: number }; twelveMonth: { tracked: number; noReoffense: number }; thirtySixMonth: { tracked: number; noReoffense: number } };
  employmentOutcomes: { totalPlaced: number; retention30Day: { tracked: number; retained: number }; retention90Day: { tracked: number; retained: number } };
  educationOutcomes: { enrolled: number; credentialsEarned: number };
  housingOutcomes: { tracked: number; stable: number };
  milestoneProgress: { total: number; completed: number; completionRate: number };
}

interface CategoryData {
  total: number;
  [metric: string]: number;
}

const OUTCOME_CATEGORIES = [
  { key: "recidivism", label: "Recidivism", icon: Shield, color: "text-red-600", metrics: ["6mo_status", "12mo_status", "36mo_status"] },
  { key: "employment", label: "Employment", icon: Briefcase, color: "text-blue-600", metrics: ["job_placement", "retention", "wage_progression"] },
  { key: "education", label: "Education", icon: GraduationCap, color: "text-emerald-600", metrics: ["enrollment", "attendance", "credential_completion", "ged_diploma"] },
  { key: "housing", label: "Housing", icon: Home, color: "text-amber-600", metrics: ["stability_status"] },
  { key: "behavioral_health", label: "Behavioral Health", icon: Heart, color: "text-pink-600", metrics: ["assessment_score", "treatment_progress"] },
];

function OutcomeCard({ category, data }: { category: typeof OUTCOME_CATEGORIES[0]; data: CategoryData }) {
  const Icon = category.icon;
  return (
    <Card className="p-5" data-testid={`card-outcome-${category.key}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-md bg-primary/10 p-2.5">
          <Icon className={`h-5 w-5 ${category.color}`} />
        </div>
        <div>
          <h3 className="font-semibold">{category.label}</h3>
          <p className="text-sm text-muted-foreground">{data.total || 0} measurements tracked</p>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(data).filter(([k]) => k !== "total").map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-2 rounded bg-muted">
            <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
            <Badge variant="outline">{typeof value === "number" ? value : String(value)}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface CohortOption {
  id: string;
  name: string;
  status: string;
}

interface CohortDashboard {
  cohorts: CohortOption[];
}

interface CohortOutcome {
  id: string;
  userId: string;
  category: string;
  metricName: string;
  metricValue: string;
  measurementDate: string;
}

export default function OutcomeReportingPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [formData, setFormData] = useState({ userId: "", planId: "", category: "employment", metricName: "", metricValue: "", periodMonths: "", source: "" });

  const { data: dashboard, isLoading } = useQuery<OutcomeDashboard>({ queryKey: ["/api/outcomes/dashboard"] });
  const { data: dojReport } = useQuery<DOJReport>({ queryKey: ["/api/outcomes/report/doj"] });
  const { data: cohortDashboard } = useQuery<CohortDashboard>({ queryKey: ["/api/pilot/dashboard"] });
  const { data: cohortOutcomes } = useQuery<CohortOutcome[]>({
    queryKey: ["/api/outcomes/by-cohort", selectedCohort],
    queryFn: async () => {
      const res = await fetch(`/api/outcomes/by-cohort/${selectedCohort}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedCohort,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/outcomes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outcomes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outcomes/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outcomes/report/doj"] });
      setShowForm(false);
      setFormData({ userId: "", planId: "", category: "employment", metricName: "", metricValue: "", periodMonths: "", source: "" });
      toast({ title: "Outcome recorded" });
    },
  });

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/outcomes/export/csv", { credentials: "include" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "outcome_data.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-outcomes-title">Outcome Measurement & Reporting</h1>
            <TrainingGuideButton moduleId="outcome-reporting" />
          </div>
          <p className="text-muted-foreground mt-1">Track recidivism, employment, education, housing, and behavioral health outcomes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv" aria-label="Export CSV">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-record-outcome" aria-label="Record outcome">
            <Plus className="mr-2 h-4 w-4" /> Record Outcome
          </Button>
        </div>
      </div>

      {dashboard && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4" data-testid="card-stat-participants">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{dashboard.uniqueParticipants}</p>
                  <p className="text-xs text-muted-foreground">Participants Tracked</p>
                </div>
              </div>
            </Card>
            <Card className="p-4" data-testid="card-stat-outcomes">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{dashboard.totalOutcomes}</p>
                  <p className="text-xs text-muted-foreground">Total Measurements</p>
                </div>
              </div>
            </Card>
            <Card className="p-4" data-testid="card-stat-active-plans">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{dashboard.totalActivePlans}</p>
                  <p className="text-xs text-muted-foreground">Active Reentry Plans</p>
                </div>
              </div>
            </Card>
            <Card className="p-4" data-testid="card-stat-milestone-completion">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-violet-600">{dashboard.milestoneCompletionRate}%</p>
                  <p className="text-xs text-muted-foreground">Milestone Completion</p>
                </div>
              </div>
              <div className="mt-2 bg-muted rounded-full h-2">
                <div className="bg-violet-600 h-2 rounded-full transition-all" style={{ width: `${dashboard.milestoneCompletionRate}%` }} />
              </div>
            </Card>
          </div>

          <Card className="p-4 bg-primary/5 border-primary/20" data-testid="card-grant-alignment">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Grant-Aligned Metrics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-2.5 rounded bg-background border">
                <p className="text-xs text-muted-foreground mb-1">WIOA Credential Rate</p>
                <p className="font-bold text-lg text-emerald-600">{dashboard.totalOutcomes > 0 ? Math.round(((dashboard.education as CategoryData)?.credential_completion || 0) / dashboard.uniqueParticipants * 100) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">Target: 60%</p>
              </div>
              <div className="p-2.5 rounded bg-background border">
                <p className="text-xs text-muted-foreground mb-1">Job Placement Rate</p>
                <p className="font-bold text-lg text-blue-600">{dashboard.totalOutcomes > 0 ? Math.round(((dashboard.employment as CategoryData)?.job_placement || 0) / dashboard.uniqueParticipants * 100) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">Target: 50%</p>
              </div>
              <div className="p-2.5 rounded bg-background border">
                <p className="text-xs text-muted-foreground mb-1">90-Day Retention</p>
                <p className="font-bold text-lg text-amber-600">{(dashboard.employment as CategoryData)?.retention || 0}</p>
                <p className="text-[10px] text-muted-foreground">Tracked retentions</p>
              </div>
              <div className="p-2.5 rounded bg-background border">
                <p className="text-xs text-muted-foreground mb-1">Recidivism Prevention</p>
                <p className="font-bold text-lg text-red-600">{((dashboard.recidivism as CategoryData)?.total || 0)}</p>
                <p className="text-[10px] text-muted-foreground">No-reoffense records</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {showForm && (
        <Card className="p-6 space-y-4" data-testid="card-outcome-form">
          <h2 className="font-semibold text-lg">Record Outcome Measurement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Participant ID</label>
              <Input value={formData.userId} onChange={e => setFormData(p => ({ ...p, userId: e.target.value }))} data-testid="input-outcome-user" aria-label="Participant ID" />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} data-testid="select-outcome-category" aria-label="Category">
                {OUTCOME_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Metric Name</label>
              <Input value={formData.metricName} onChange={e => setFormData(p => ({ ...p, metricName: e.target.value }))} placeholder="e.g., job_placement" data-testid="input-outcome-metric" aria-label="Metric name" />
            </div>
            <div>
              <label className="text-sm font-medium">Metric Value</label>
              <Input value={formData.metricValue} onChange={e => setFormData(p => ({ ...p, metricValue: e.target.value }))} placeholder="e.g., placed, retained" data-testid="input-outcome-value" aria-label="Metric value" />
            </div>
            <div>
              <label className="text-sm font-medium">Period (Months)</label>
              <Input type="number" value={formData.periodMonths} onChange={e => setFormData(p => ({ ...p, periodMonths: e.target.value }))} placeholder="e.g., 6" data-testid="input-outcome-period" aria-label="Period in months" />
            </div>
            <div>
              <label className="text-sm font-medium">Source</label>
              <Input value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} placeholder="e.g., employer_report" data-testid="input-outcome-source" aria-label="Source" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate({ ...formData, periodMonths: formData.periodMonths ? parseInt(formData.periodMonths) : undefined })} disabled={!formData.userId || !formData.metricName || createMutation.isPending} data-testid="button-submit-outcome" aria-label="Record outcome">
              {createMutation.isPending ? "Recording..." : "Record Outcome"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} aria-label="Cancel" data-testid="button-cancel-outcome">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OUTCOME_CATEGORIES.map(cat => {
          const catData = (dashboard?.[cat.key] as CategoryData) || { total: 0 };
          return <OutcomeCard key={cat.key} category={cat} data={catData} />;
        })}
      </div>

      {dojReport && (
        <Card className="p-6" data-testid="card-doj-report">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h2 className="font-semibold text-lg">OJJDP Grant Performance Report</h2>
                <p className="text-sm text-muted-foreground">Auto-generated report aligned to DOJ reporting requirements</p>
              </div>
            </div>
            <Badge variant="outline">Generated {new Date(dojReport.generatedAt).toLocaleDateString()}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Program Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Participants Served</span>
                  <span className="font-semibold">{dojReport.programOverview?.totalParticipantsServed}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Active Plans</span>
                  <span className="font-semibold">{dojReport.programOverview?.activePlans}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-semibold">{dojReport.programOverview?.programCompletionRate}%</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Recidivism Outcomes</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">6-Month No Reoffense</span>
                  <span className="font-semibold">{dojReport.recidivismOutcomes?.sixMonth?.noReoffense || 0} / {dojReport.recidivismOutcomes?.sixMonth?.tracked || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">12-Month No Reoffense</span>
                  <span className="font-semibold">{dojReport.recidivismOutcomes?.twelveMonth?.noReoffense || 0} / {dojReport.recidivismOutcomes?.twelveMonth?.tracked || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">36-Month No Reoffense</span>
                  <span className="font-semibold">{dojReport.recidivismOutcomes?.thirtySixMonth?.noReoffense || 0} / {dojReport.recidivismOutcomes?.thirtySixMonth?.tracked || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Employment Outcomes</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Job Placements</span>
                  <span className="font-semibold">{dojReport.employmentOutcomes?.totalPlaced || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">30-Day Retention</span>
                  <span className="font-semibold">{dojReport.employmentOutcomes?.retention30Day?.retained || 0} / {dojReport.employmentOutcomes?.retention30Day?.tracked || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">90-Day Retention</span>
                  <span className="font-semibold">{dojReport.employmentOutcomes?.retention90Day?.retained || 0} / {dojReport.employmentOutcomes?.retention90Day?.tracked || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Education & Housing</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Education Enrolled</span>
                  <span className="font-semibold">{dojReport.educationOutcomes?.enrolled || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Credentials Earned</span>
                  <span className="font-semibold">{dojReport.educationOutcomes?.credentialsEarned || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Housing Stable</span>
                  <span className="font-semibold">{dojReport.housingOutcomes?.stable || 0} / {dojReport.housingOutcomes?.tracked || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Milestone Progress</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-background rounded-full h-3">
                <div className="bg-emerald-600 h-3 rounded-full transition-all" style={{ width: `${dojReport.milestoneProgress?.completionRate || 0}%` }} />
              </div>
              <span className="text-sm font-semibold">{dojReport.milestoneProgress?.completionRate || 0}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{dojReport.milestoneProgress?.completed || 0} of {dojReport.milestoneProgress?.total || 0} milestones completed</p>
          </div>
        </Card>
      )}

      {cohortDashboard && cohortDashboard.cohorts && cohortDashboard.cohorts.length > 0 && (
        <Card className="p-6" data-testid="card-cohort-outcomes">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-lg">Cohort-Scoped Outcome Comparison</h2>
              <p className="text-sm text-muted-foreground">Filter outcomes by pilot cohort for before/after analysis</p>
            </div>
          </div>
          <div className="mb-4">
            <select
              className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedCohort}
              onChange={e => setSelectedCohort(e.target.value)}
              data-testid="select-cohort-outcomes"
            >
              <option value="">Select a cohort...</option>
              {cohortDashboard.cohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
              ))}
            </select>
          </div>
          {selectedCohort && cohortOutcomes && (
            <>
              {cohortOutcomes.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No outcomes recorded for this cohort yet</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{cohortOutcomes.length} outcome measurements for this cohort</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {OUTCOME_CATEGORIES.map(cat => {
                      const catOutcomes = cohortOutcomes.filter(o => o.category === cat.key);
                      if (catOutcomes.length === 0) return null;
                      const Icon = cat.icon;
                      const metricCounts: Record<string, number> = {};
                      catOutcomes.forEach(o => {
                        metricCounts[o.metricName] = (metricCounts[o.metricName] || 0) + 1;
                      });
                      return (
                        <div key={cat.key} className="p-3 rounded border" data-testid={`card-cohort-outcome-${cat.key}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`h-4 w-4 ${cat.color}`} />
                            <span className="font-medium text-sm">{cat.label}</span>
                            <Badge variant="outline" className="ml-auto">{catOutcomes.length}</Badge>
                          </div>
                          {Object.entries(metricCounts).map(([metric, count]) => (
                            <div key={metric} className="flex justify-between text-xs p-1">
                              <span className="capitalize text-muted-foreground">{metric.replace(/_/g, " ")}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
