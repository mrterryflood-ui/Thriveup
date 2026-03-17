import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Target, Clock, TrendingUp, BarChart3,
  UserPlus, CheckCircle2, AlertCircle, Calendar, Download,
  ChevronDown, ChevronUp, Edit2, Trash2, X,
} from "lucide-react";

interface CohortSummary {
  id: string;
  name: string;
  description: string | null;
  targetPopulation: string;
  targetSize: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  enrollmentCount: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  totalServiceMinutes: number;
  totalServiceHours: number;
  avgMinutesPerParticipant: number;
  outcomesCount: number;
  outcomeCategoryBreakdown: Record<string, number>;
  toolTypeBreakdown: Record<string, number>;
}

interface DashboardData {
  cohorts: CohortSummary[];
  totals: {
    totalCohorts: number;
    totalEnrollments: number;
    uniqueParticipants: number;
    totalServiceMinutes: number;
    totalServiceHours: number;
    activeCohorts: number;
  };
}

interface Enrollment {
  id: string;
  cohortId: string;
  userId: string;
  participantName: string;
  enrolledAt: string;
  status: string;
  completedAt: string | null;
  notes: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    paused: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.planning}`} data-testid={`badge-status-${status}`}>{status}</span>;
}

function CohortCard({ cohort, onExpand, expanded }: { cohort: CohortSummary; onExpand: () => void; expanded: boolean }) {
  const { toast } = useToast();
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ userId: "", participantName: "" });
  const [editStatus, setEditStatus] = useState<string | null>(null);

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/pilot/cohorts", cohort.id, "enrollments"],
    queryFn: async () => {
      const res = await fetch(`/api/pilot/cohorts/${cohort.id}/enrollments`, { credentials: "include" });
      return res.json();
    },
    enabled: expanded,
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: { userId: string; participantName: string }) => {
      const res = await apiRequest("POST", `/api/pilot/cohorts/${cohort.id}/enroll`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilot/cohorts", cohort.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pilot/dashboard"] });
      setShowEnroll(false);
      setEnrollForm({ userId: "", participantName: "" });
      toast({ title: "Participant enrolled" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      const res = await apiRequest("PATCH", `/api/pilot/cohorts/${cohort.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilot/dashboard"] });
      setEditStatus(null);
      toast({ title: "Cohort status updated" });
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ enrollmentId, status }: { enrollmentId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/pilot/enrollments/${enrollmentId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilot/cohorts", cohort.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pilot/dashboard"] });
      toast({ title: "Enrollment updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/pilot/cohorts/${cohort.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilot/dashboard"] });
      toast({ title: "Cohort deleted" });
    },
  });

  return (
    <Card className="p-5" data-testid={`card-cohort-${cohort.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg" data-testid={`text-cohort-name-${cohort.id}`}>{cohort.name}</h3>
            <StatusBadge status={cohort.status} />
          </div>
          {cohort.description && <p className="text-sm text-muted-foreground mb-2">{cohort.description}</p>}
          <p className="text-xs text-muted-foreground">{cohort.targetPopulation} · Target: {cohort.targetSize} participants</p>
          <p className="text-xs text-muted-foreground">{cohort.startDate} to {cohort.endDate}</p>
        </div>
        <div className="flex items-center gap-1">
          {editStatus === null ? (
            <Button variant="ghost" size="sm" onClick={() => setEditStatus(cohort.status)} data-testid={`button-edit-status-${cohort.id}`}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <select className="text-xs border rounded px-1 py-0.5" value={editStatus} onChange={e => setEditStatus(e.target.value)} data-testid={`select-status-${cohort.id}`}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ status: editStatus })} data-testid={`button-save-status-${cohort.id}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditStatus(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()} data-testid={`button-delete-cohort-${cohort.id}`}>
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-lg font-bold text-primary">{cohort.enrollmentCount}</p>
          <p className="text-xs text-muted-foreground">Enrolled</p>
        </div>
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-lg font-bold text-emerald-600">{cohort.completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-lg font-bold text-blue-600">{cohort.totalServiceHours}</p>
          <p className="text-xs text-muted-foreground">Service Hours</p>
        </div>
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-lg font-bold text-violet-600">{Math.round(cohort.avgMinutesPerParticipant)}</p>
          <p className="text-xs text-muted-foreground">Avg Min/Person</p>
        </div>
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-lg font-bold text-amber-600">{cohort.outcomesCount || 0}</p>
          <p className="text-xs text-muted-foreground">Outcomes</p>
        </div>
      </div>

      {cohort.toolTypeBreakdown && Object.keys(cohort.toolTypeBreakdown).length > 0 && (
        <div className="mt-3" data-testid={`tool-breakdown-${cohort.id}`}>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Dosage by Tool Type</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cohort.toolTypeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([tool, mins]) => (
                <Badge key={tool} variant="secondary" className="text-xs capitalize">
                  {tool.replace(/_/g, " ")}: {Math.round((mins / 60) * 10) / 10}h
                </Badge>
              ))}
          </div>
        </div>
      )}

      {cohort.outcomeCategoryBreakdown && Object.keys(cohort.outcomeCategoryBreakdown).length > 0 && (
        <div className="mt-3" data-testid={`outcomes-breakdown-${cohort.id}`}>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Outcomes by Category</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cohort.outcomeCategoryBreakdown).map(([category, count]) => (
              <Badge key={category} variant="outline" className="text-xs capitalize">
                {category.replace(/_/g, " ")}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExpand} data-testid={`button-expand-${cohort.id}`}>
          {expanded ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
          {expanded ? "Collapse" : "Manage Enrollments"}
        </Button>
        {expanded && (
          <Button size="sm" onClick={() => setShowEnroll(!showEnroll)} data-testid={`button-enroll-${cohort.id}`}>
            <UserPlus className="mr-1 h-3.5 w-3.5" /> Enroll Participant
          </Button>
        )}
      </div>

      {expanded && showEnroll && (
        <div className="mt-3 p-3 rounded border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="User ID" value={enrollForm.userId} onChange={e => setEnrollForm(p => ({ ...p, userId: e.target.value }))} data-testid={`input-enroll-userid-${cohort.id}`} />
            <Input placeholder="Participant Name" value={enrollForm.participantName} onChange={e => setEnrollForm(p => ({ ...p, participantName: e.target.value }))} data-testid={`input-enroll-name-${cohort.id}`} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => enrollMutation.mutate(enrollForm)} disabled={!enrollForm.userId || !enrollForm.participantName || enrollMutation.isPending} data-testid={`button-submit-enroll-${cohort.id}`}>
              {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEnroll(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {expanded && enrollments && (
        <div className="mt-3 space-y-1">
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No participants enrolled yet</p>
          ) : (
            enrollments.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded bg-muted text-sm" data-testid={`row-enrollment-${e.id}`}>
                <div>
                  <span className="font-medium">{e.participantName}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{e.userId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={e.status} />
                  {e.status === "active" && (
                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => updateEnrollmentMutation.mutate({ enrollmentId: e.id, status: "completed" })} data-testid={`button-complete-enrollment-${e.id}`}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

export default function PilotDashboardPage() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", targetPopulation: "", targetSize: "30",
    startDate: "", endDate: "", status: "planning",
  });

  const { data: dashboard, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/pilot/dashboard"] });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/pilot/cohorts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilot/dashboard"] });
      setShowCreate(false);
      setForm({ name: "", description: "", targetPopulation: "", targetSize: "30", startDate: "", endDate: "", status: "planning" });
      toast({ title: "Cohort created" });
    },
  });

  const handleExportPilot = async () => {
    try {
      const res = await fetch("/api/pilot/export/csv", { credentials: "include" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "pilot_data.csv"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Pilot data exported" });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-pilot-title">Pilot Data Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track cohorts, enrollment, and engagement dosage for grant reporting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPilot} data-testid="button-export-pilot">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-cohort">
            <Plus className="mr-2 h-4 w-4" /> New Cohort
          </Button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 text-center" data-testid="card-stat-cohorts">
            <p className="text-2xl font-bold text-primary">{dashboard.totals.totalCohorts}</p>
            <p className="text-xs text-muted-foreground">Total Cohorts</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-active">
            <p className="text-2xl font-bold text-emerald-600">{dashboard.totals.activeCohorts}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-enrollments">
            <p className="text-2xl font-bold text-blue-600">{dashboard.totals.totalEnrollments}</p>
            <p className="text-xs text-muted-foreground">Enrollments</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-participants">
            <p className="text-2xl font-bold text-violet-600">{dashboard.totals.uniqueParticipants}</p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-hours">
            <p className="text-2xl font-bold text-amber-600">{dashboard.totals.totalServiceHours}</p>
            <p className="text-xs text-muted-foreground">Service Hours</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-minutes">
            <p className="text-2xl font-bold text-rose-600">{dashboard.totals.totalServiceMinutes}</p>
            <p className="text-xs text-muted-foreground">Total Minutes</p>
          </Card>
        </div>
      )}

      {showCreate && (
        <Card className="p-6 space-y-4" data-testid="card-create-cohort">
          <h2 className="font-semibold text-lg">Create Pilot Cohort</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Cohort Name</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-cohort-name" />
            </div>
            <div>
              <label className="text-sm font-medium">Target Population</label>
              <Input value={form.targetPopulation} onChange={e => setForm(p => ({ ...p, targetPopulation: e.target.value }))} placeholder="e.g., Youth 16-24" data-testid="input-target-population" />
            </div>
            <div>
              <label className="text-sm font-medium">Target Size</label>
              <Input type="number" value={form.targetSize} onChange={e => setForm(p => ({ ...p, targetSize: e.target.value }))} data-testid="input-target-size" />
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} data-testid="input-start-date" />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} data-testid="input-end-date" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} data-testid="select-cohort-status">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the cohort" data-testid="input-cohort-description" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate({ ...form, targetSize: parseInt(form.targetSize) || 30 })} disabled={!form.name || !form.targetPopulation || !form.startDate || !form.endDate || createMutation.isPending} data-testid="button-submit-cohort">
              {createMutation.isPending ? "Creating..." : "Create Cohort"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} data-testid="button-cancel-cohort">Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Loading pilot data...</div>
      )}

      {dashboard && dashboard.cohorts.length === 0 && !showCreate && (
        <Card className="p-12 text-center" data-testid="card-empty-cohorts">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Pilot Cohorts Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first pilot cohort to start tracking participant outcomes and service hours.</p>
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-first-cohort">
            <Plus className="mr-2 h-4 w-4" /> Create First Cohort
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        {dashboard?.cohorts.map(cohort => (
          <CohortCard
            key={cohort.id}
            cohort={cohort}
            expanded={expandedCohort === cohort.id}
            onExpand={() => setExpandedCohort(expandedCohort === cohort.id ? null : cohort.id)}
          />
        ))}
      </div>
    </div>
  );
}
