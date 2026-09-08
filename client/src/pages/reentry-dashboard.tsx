import { useState } from "react";
import { TrainingGuideButton } from "@/components/training-guide";
import { EvidenceSummary } from "@/components/evidence-label";
import { ConsentDisclosure } from "@/components/consent-disclosure";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { logJourneyEvent } from "@/lib/journey-log";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Shield, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, FileText, BarChart3, Target, ChevronRight, ChevronDown
} from "lucide-react";
import type { ReentryPlan, ReentryMilestone } from "@shared/schema";

interface DashboardData {
  totalPlans: number;
  activePlans: number;
  phaseDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  milestoneCompletion: { completed: number; total: number; rate: number };
  recentPlans: ReentryPlan[];
}

interface PlanDetail extends ReentryPlan {
  milestones: ReentryMilestone[];
  intake: Record<string, unknown> | null;
  thriveScore: { compositeScore?: number } | null;
}

const PHASES = [
  { key: "pre_release", label: "Pre-Release", color: "bg-blue-600" },
  { key: "transition", label: "Transition (0-90 days)", color: "bg-amber-600" },
  { key: "stabilization", label: "Stabilization (90-180 days)", color: "bg-emerald-600" },
  { key: "independence", label: "Independence (180-365 days)", color: "bg-violet-600" },
];

const RISK_COLORS: Record<string, string> = { low: "bg-emerald-600", medium: "bg-amber-600", high: "bg-red-600" };

function PhaseBadge({ phase }: { phase: string }) {
  const p = PHASES.find(ph => ph.key === phase) || PHASES[0];
  return <Badge className={`${p.color} text-white`}>{p.label}</Badge>;
}

function RiskBadge({ level }: { level: string | null }) {
  const l = level || "medium";
  return <Badge className={`${RISK_COLORS[l] || RISK_COLORS.medium} text-white`}>{l.charAt(0).toUpperCase() + l.slice(1)} Risk</Badge>;
}

export default function ReentryDashboard() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({ userId: "", userName: "", phase: "pre_release", riskLevel: "medium", notes: "" });

  const { data: dashboard } = useQuery<DashboardData>({ queryKey: ["/api/reentry/dashboard"] });
  const { data: rawPlans, isLoading, error: plansError, refetch: refetchPlans } = useQuery<ReentryPlan[]>({ queryKey: ["/api/reentry/plans"] });
  const plans = rawPlans ?? [];

  const { data: planDetail } = useQuery<PlanDetail>({
    queryKey: ["/api/reentry/plans", selectedPlan],
    enabled: !!selectedPlan,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/reentry/plans", data);
      return res.json();
    },
    onSuccess: (plan: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reentry/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reentry/dashboard"] });
      setShowForm(false);
      const userName = formData.userName;
      setFormData({ userId: "", userName: "", phase: "pre_release", riskLevel: "medium", notes: "" });
      toast({ title: "Reentry plan created" });
      logJourneyEvent({
        eventType: "reentry_plan_created",
        eventDomain: "reentry",
        eventTitle: `Reentry plan created${userName ? " for " + userName : ""}`,
        eventPayload: { planId: plan?.id, phase: plan?.phase, riskLevel: plan?.riskLevel },
        sourcePage: "Reentry Dashboard",
      });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/reentry/milestones/${id}`, { status, completedDate: status === "completed" ? new Date().toISOString() : undefined });
      return res.json();
    },
    onSuccess: () => {
      if (selectedPlan) queryClient.invalidateQueries({ queryKey: ["/api/reentry/plans", selectedPlan] });
      queryClient.invalidateQueries({ queryKey: ["/api/reentry/dashboard"] });
    },
  });

  const advancePhaseMutation = useMutation({
    mutationFn: async ({ id, phase }: { id: string; phase: string }) => {
      const phaseStartField: Record<string, string> = {
        transition: "transitionStartDate",
        stabilization: "stabilizationStartDate",
        independence: "independenceStartDate",
      };
      const updates: Record<string, string> = { phase };
      if (phaseStartField[phase]) updates[phaseStartField[phase]] = new Date().toISOString();
      const res = await apiRequest("PATCH", `/api/reentry/plans/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reentry/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reentry/dashboard"] });
      if (selectedPlan) queryClient.invalidateQueries({ queryKey: ["/api/reentry/plans", selectedPlan] });
      toast({ title: "Phase advanced" });
    },
  });

  const nextPhase = (current: string) => {
    const idx = PHASES.findIndex(p => p.key === current);
    return idx < PHASES.length - 1 ? PHASES[idx + 1].key : null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-reentry-title">Reentry Case Management</h1>
          <p className="text-muted-foreground mt-1">Individualized reentry plans with phase-based milestones and progress tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrainingGuideButton moduleId="reentry-dashboard" />
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-create-plan" aria-label="Create reentry plan">
            <Plus className="mr-2 h-4 w-4" /> New Reentry Plan
          </Button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center" data-testid="card-stat-active-plans">
            <p className="text-2xl font-bold text-primary">{dashboard.activePlans}</p>
            <p className="text-sm text-muted-foreground">Active Plans</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-milestone-rate">
            <p className="text-2xl font-bold text-emerald-600">{dashboard.milestoneCompletion?.rate || 0}%</p>
            <p className="text-sm text-muted-foreground">Milestone Completion</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-high-risk">
            <p className="text-2xl font-bold text-red-600">{dashboard.riskDistribution?.high || 0}</p>
            <p className="text-sm text-muted-foreground">High Risk</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-total-plans">
            <p className="text-2xl font-bold">{dashboard.totalPlans}</p>
            <p className="text-sm text-muted-foreground">Total Plans</p>
          </Card>
        </div>
      )}

      {dashboard?.phaseDistribution && (
        <Card className="p-5" data-testid="card-phase-distribution">
          <h2 className="font-semibold mb-3">Phase Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PHASES.map(p => (
              <div key={p.key} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`w-3 h-3 rounded-full ${p.color}`} />
                <div>
                  <p className="text-lg font-bold">{dashboard.phaseDistribution[p.key] || 0}</p>
                  <p className="text-xs text-muted-foreground">{p.label.split("(")[0].trim()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="p-6 space-y-4" data-testid="card-plan-form">
          <h2 className="font-semibold text-lg">Create Reentry Plan</h2>
           <ConsentDisclosure
             compact
             purpose="Create and coordinate an individualized reentry plan."
             fields={[
               { name: "Participant identity", why: "Links the plan to the correct participant.", required: true },
               { name: "Risk level and notes", why: "Supports appropriate case planning.", sensitive: true },
               { name: "Housing status, health information, and criminal history", why: "May be included in case notes to coordinate services.", sensitive: true },
             ]}
             sharing="Authorized TCAF reentry case-management staff who coordinate this participant's services."
             withdrawal="Ask your case manager to review, correct, or withdraw information where permitted."
           />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Participant ID</label>
              <Input value={formData.userId} onChange={e => setFormData(p => ({ ...p, userId: e.target.value }))} placeholder="User ID" data-testid="input-plan-userid" aria-label="Participant ID" />
            </div>
            <div>
              <label className="text-sm font-medium">Participant Name</label>
              <Input value={formData.userName} onChange={e => setFormData(p => ({ ...p, userName: e.target.value }))} placeholder="Full name" data-testid="input-plan-name" aria-label="Participant name" />
            </div>
            <div>
              <label className="text-sm font-medium">Starting Phase</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.phase} onChange={e => setFormData(p => ({ ...p, phase: e.target.value }))} data-testid="select-plan-phase" aria-label="Starting phase">
                {PHASES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Risk Level</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.riskLevel} onChange={e => setFormData(p => ({ ...p, riskLevel: e.target.value }))} data-testid="select-plan-risk" aria-label="Risk level">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Initial notes..." data-testid="input-plan-notes" aria-label="Plan notes" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.userId || !formData.userName || createMutation.isPending} data-testid="button-submit-plan" aria-label="Create plan">
              {createMutation.isPending ? "Creating..." : "Create Plan"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-plan" aria-label="Cancel">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-lg" data-testid="text-caseload-heading">Caseload</h2>
          {plansError ? (
            <Card className="p-6 text-center" data-testid="card-plans-error">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-sm font-medium">Failed to load plans</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchPlans()} data-testid="button-retry-plans" aria-label="Retry loading plans">Retry</Button>
            </Card>
          ) : isLoading ? (
            <Card className="p-4 text-center text-muted-foreground">Loading...</Card>
          ) : plans.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground" data-testid="card-no-plans">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No reentry plans yet</p>
            </Card>
          ) : (
            plans.map(plan => (
              <Card
                key={plan.id}
                className={`p-4 cursor-pointer transition-colors ${selectedPlan === plan.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setSelectedPlan(plan.id)}
                data-testid={`card-plan-${plan.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{plan.userName || plan.userId}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-1">
                  <PhaseBadge phase={plan.phase} />
                  <RiskBadge level={plan.riskLevel} />
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedPlan && planDetail ? (
            <>
              <Card className="p-5" data-testid="card-plan-detail">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-lg">{planDetail.userName || planDetail.userId}</h2>
                    <div className="flex gap-2 mt-1">
                      <PhaseBadge phase={planDetail.phase} />
                      <RiskBadge level={planDetail.riskLevel} />
                      <Badge variant="outline">{planDetail.status}</Badge>
                    </div>
                  </div>
                  {nextPhase(planDetail.phase) && (
                    <Button
                      size="sm"
                      onClick={() => advancePhaseMutation.mutate({ id: planDetail.id, phase: nextPhase(planDetail.phase)! })}
                      disabled={advancePhaseMutation.isPending}
                      data-testid="button-advance-phase"
                      aria-label="Advance to next phase"
                    >
                      Advance Phase <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
                {planDetail.notes && <p className="text-sm text-muted-foreground">{planDetail.notes}</p>}
                {planDetail.thriveScore && (
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-1">Thrive Score</p>
                    <p className="text-2xl font-bold text-primary">{planDetail.thriveScore.compositeScore || "N/A"}</p>
                  </div>
                )}
              </Card>

              <Card className="p-5" data-testid="card-milestones">
                <h3 className="font-semibold mb-3">Milestones</h3>
                {planDetail.milestones?.length > 0 ? (
                  <div className="space-y-2">
                    {planDetail.milestones.map((m: ReentryMilestone) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <button
                          className="shrink-0"
                          onClick={() => updateMilestoneMutation.mutate({ id: m.id, status: m.status === "completed" ? "pending" : "completed" })}
                          aria-label={`Mark ${m.title} as ${m.status === "completed" ? "pending" : "completed"}`}
                          data-testid={`button-milestone-toggle-${m.id}`}
                        >
                          {m.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : m.status === "in_progress" ? (
                            <Clock className="h-5 w-5 text-amber-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${m.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                          <div className="flex gap-1 mt-0.5">
                            <Badge variant="outline" className="text-xs">{m.category}</Badge>
                            <Badge variant="outline" className="text-xs">{m.phase}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No milestones yet</p>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-select-plan">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Select a plan from the caseload to view details</p>
            </Card>
          )}
        </div>
      </div>
      <EvidenceSummary
        claims={[{
          value: dashboard?.totalPlans ?? null,
          unit: "reentry plans",
          source: "TCAF Reentry Case Management System",
          sourceId: "tcaf-reentry-cms",
          asOfDate: null,
          geographyKey: null,
          confidence: "verified",
          decisionCaption: "Use caseload and milestone data to prioritize case-management follow-up; it is restricted to authorized staff.",
        }]}
      />
    </div>
  );
}
