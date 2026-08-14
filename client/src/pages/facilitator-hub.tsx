import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import {
  Users, Calendar, ClipboardCheck, TrendingUp, Award,
  Plus, Wand2, BarChart3, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import type { FacilitatorProfile, SessionPlan, CurriculumDeliveryLog, FacilitatorCertification } from "@shared/schema";

function DashboardTab() {
  const { data: metrics, isLoading } = useQuery<{
    totalFacilitators: number;
    activeFacilitators: number;
    sessionsThisMonth: number;
    deliveredThisMonth: number;
    averageFidelityScore: number;
    totalDosageHours: number;
    upcomingSessions: number;
    dataProvenance?: { totalFacilitators: number; demoFacilitators: number; hasDemoData: boolean };
  }>({ queryKey: ["/api/facilitators/dashboard/metrics"] });

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const kpis = [
    { label: "Active Facilitators", value: metrics?.activeFacilitators || 0, icon: Users, color: "text-blue-500" },
    { label: "Sessions This Month", value: metrics?.sessionsThisMonth || 0, icon: Calendar, color: "text-green-500" },
    { label: "Avg Fidelity Score", value: metrics?.averageFidelityScore || 0, icon: TrendingUp, color: "text-purple-500" },
    { label: "Dosage Hours", value: metrics?.totalDosageHours || 0, icon: Clock, color: "text-orange-500" },
    { label: "Delivered This Month", value: metrics?.deliveredThisMonth || 0, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Upcoming Sessions", value: metrics?.upcomingSessions || 0, icon: Calendar, color: "text-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      {metrics?.dataProvenance?.hasDemoData && (
        <Badge variant="outline" className="text-xs text-amber-600" data-testid="badge-demo-data">
          Demo data — {metrics.dataProvenance.demoFacilitators} of {metrics.dataProvenance.totalFacilitators} facilitator profiles are illustrative examples, not real staff
        </Badge>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                <div>
                  <p className="text-2xl font-bold" data-testid={`text-kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}>{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SessionPlanningTab() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ sessionDate: "", duration: 60, location: "", targetAudience: "", assessmentMethod: "", notes: "", status: "draft" });
  const [genForm, setGenForm] = useState({ moduleId: "", targetAudience: "Youth ages 10-18", duration: 60 });

  const { data: plans, isLoading } = useQuery<SessionPlan[]>({ queryKey: ["/api/session-plans"] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/session-plans", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/session-plans"] }); setShowCreate(false); toast({ title: "Session plan created" }); },
  });

  const generateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/facilitators/session-plans/generate", data),
    onSuccess: async (res) => {
      const result = await res.json();
      toast({ title: "AI Session Plan Generated", description: "Review the generated plan below" });
      setForm(prev => ({
        ...prev,
        notes: `AI Generated:\n${JSON.stringify(result, null, 2)}`,
      }));
      setShowGenerate(false);
      setShowCreate(true);
    },
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">Session Plans</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-generate-plan"><Wand2 className="mr-2 h-4 w-4" />AI Generate</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>AI Session Plan Generator</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Module ID (optional)" value={genForm.moduleId} onChange={e => setGenForm(p => ({ ...p, moduleId: e.target.value }))} data-testid="input-gen-module" />
                <Input placeholder="Target Audience" value={genForm.targetAudience} onChange={e => setGenForm(p => ({ ...p, targetAudience: e.target.value }))} data-testid="input-gen-audience" />
                <Input type="number" placeholder="Duration (minutes)" value={genForm.duration} onChange={e => setGenForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))} data-testid="input-gen-duration" />
                <Button onClick={() => generateMutation.mutate(genForm)} disabled={generateMutation.isPending} data-testid="button-submit-generate">
                  {generateMutation.isPending ? "Generating..." : "Generate Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-plan"><Plus className="mr-2 h-4 w-4" />New Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Session Plan</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input type="date" value={form.sessionDate} onChange={e => setForm(p => ({ ...p, sessionDate: e.target.value }))} data-testid="input-plan-date" />
                <Input type="number" placeholder="Duration (minutes)" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))} data-testid="input-plan-duration" />
                <Input placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} data-testid="input-plan-location" />
                <Input placeholder="Target Audience" value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))} data-testid="input-plan-audience" />
                <Input placeholder="Assessment Method" value={form.assessmentMethod} onChange={e => setForm(p => ({ ...p, assessmentMethod: e.target.value }))} data-testid="input-plan-assessment" />
                <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} data-testid="input-plan-notes" />
                <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} data-testid="button-submit-plan">
                  {createMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(!plans || plans.length === 0) ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No session plans yet. Create one or use AI to generate.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold" data-testid={`text-plan-date-${plan.id}`}>{plan.sessionDate}</p>
                    <p className="text-sm text-muted-foreground">{plan.location || "No location"} | {plan.duration} min | {plan.targetAudience || "General"}</p>
                  </div>
                  <Badge variant={plan.status === "delivered" ? "default" : plan.status === "ready" ? "secondary" : "outline"} data-testid={`badge-plan-status-${plan.id}`}>
                    {plan.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryLogTab() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    actualDate: "", actualDuration: 60, actualAttendeeCount: 0,
    fidelityScore: 3, adaptationsNoted: "", challengesFaced: "",
    participantFeedback: "", followUpNeeded: false, dosageMinutes: 60,
  });

  const { data: logs, isLoading } = useQuery<CurriculumDeliveryLog[]>({ queryKey: ["/api/delivery-logs"] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/delivery-logs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilitators/dashboard/metrics"] });
      setShowCreate(false);
      toast({ title: "Delivery log recorded" });
    },
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">Curriculum Delivery Logs</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-log"><Plus className="mr-2 h-4 w-4" />Log Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Delivered Session</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input type="date" value={form.actualDate} onChange={e => setForm(p => ({ ...p, actualDate: e.target.value }))} data-testid="input-log-date" />
              <Input type="number" placeholder="Duration (minutes)" value={form.actualDuration} onChange={e => setForm(p => ({ ...p, actualDuration: parseInt(e.target.value) || 60 }))} data-testid="input-log-duration" />
              <Input type="number" placeholder="Attendee Count" value={form.actualAttendeeCount} onChange={e => setForm(p => ({ ...p, actualAttendeeCount: parseInt(e.target.value) || 0 }))} data-testid="input-log-attendees" />
              <div>
                <label className="text-sm font-medium">Fidelity Score (1-5)</label>
                <Select value={String(form.fidelityScore)} onValueChange={v => setForm(p => ({ ...p, fidelityScore: parseInt(v) }))}>
                  <SelectTrigger data-testid="select-fidelity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2 - Below Average</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="4">4 - Above Average</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" placeholder="Dosage Minutes" value={form.dosageMinutes} onChange={e => setForm(p => ({ ...p, dosageMinutes: parseInt(e.target.value) || 0 }))} data-testid="input-log-dosage" />
              <Textarea placeholder="Adaptations noted" value={form.adaptationsNoted} onChange={e => setForm(p => ({ ...p, adaptationsNoted: e.target.value }))} data-testid="input-log-adaptations" />
              <Textarea placeholder="Challenges faced" value={form.challengesFaced} onChange={e => setForm(p => ({ ...p, challengesFaced: e.target.value }))} data-testid="input-log-challenges" />
              <Textarea placeholder="Participant feedback" value={form.participantFeedback} onChange={e => setForm(p => ({ ...p, participantFeedback: e.target.value }))} data-testid="input-log-feedback" />
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} data-testid="button-submit-log">
                {createMutation.isPending ? "Saving..." : "Save Log"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!logs || logs.length === 0) ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No delivery logs recorded yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold" data-testid={`text-log-date-${log.id}`}>{log.actualDate}</p>
                    <p className="text-sm text-muted-foreground">{log.actualDuration} min | {log.actualAttendeeCount} attendees | {log.dosageMinutes} dosage min</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={log.fidelityScore >= 4 ? "default" : log.fidelityScore >= 3 ? "secondary" : "destructive"} data-testid={`badge-fidelity-${log.id}`}>
                      Fidelity: {log.fidelityScore}/5
                    </Badge>
                    {log.followUpNeeded && <Badge variant="outline"><AlertTriangle className="mr-1 h-3 w-3" />Follow-up</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FidelityMonitorTab() {
  const { data: report, isLoading } = useQuery<{
    overallFidelity: number;
    totalSessions: number;
    trends: Array<{ month: string; averageFidelity: number; sessionCount: number }>;
  }>({ queryKey: ["/api/facilitators/fidelity-report"] });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold" data-testid="text-overall-fidelity">{report?.overallFidelity || 0}</p>
            <p className="text-sm text-muted-foreground">Overall Fidelity Score (out of 5)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold" data-testid="text-total-sessions">{report?.totalSessions || 0}</p>
            <p className="text-sm text-muted-foreground">Total Sessions Logged</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Fidelity Trends</CardTitle></CardHeader>
        <CardContent>
          {(!report?.trends || report.trends.length === 0) ? (
            <p className="text-muted-foreground text-center py-4">No trend data available yet. Log delivery sessions to see trends.</p>
          ) : (
            <div className="space-y-2">
              {report.trends.map((t) => (
                <div key={t.month} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                  <span className="font-medium">{t.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{t.sessionCount} sessions</span>
                    <div className="flex items-center gap-1">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${t.averageFidelity >= 4 ? "bg-green-500" : t.averageFidelity >= 3 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${(t.averageFidelity / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold" data-testid={`text-trend-fidelity-${t.month}`}>{t.averageFidelity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CertificationsTab() {
  const { data: facilitators, isLoading } = useQuery<FacilitatorProfile[]>({ queryKey: ["/api/facilitators"] });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Facilitator Certifications</h3>
      {(!facilitators || facilitators.length === 0) ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No facilitators registered yet. Add facilitators from the Dashboard.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {facilitators.map((f) => (
            <FacilitatorCertCard key={f.id} facilitator={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function FacilitatorCertCard({ facilitator }: { facilitator: FacilitatorProfile }) {
  const { data: certs } = useQuery<FacilitatorCertification[]>({
    queryKey: ["/api/facilitator-certifications", facilitator.id],
  });

  const certList = Array.isArray(facilitator.certifications) ? facilitator.certifications as string[] : [];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold" data-testid={`text-facilitator-name-${facilitator.id}`}>{facilitator.name}</p>
            <p className="text-sm text-muted-foreground">Status: {facilitator.status}</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {certList.map((c, i) => (
              <Badge key={i} variant="secondary">{String(c)}</Badge>
            ))}
            {certs?.map((c) => (
              <Badge key={c.id} variant={c.status === "active" ? "default" : "outline"} data-testid={`badge-cert-${c.id}`}>
                <Award className="mr-1 h-3 w-3" />{c.certificationName}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FacilitatorHubPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Facilitator Hub"
        description="Manage facilitators, plan sessions, track delivery fidelity, and monitor certifications"
      />

      <Tabs defaultValue="dashboard">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard"><BarChart3 className="mr-1 h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="planning" data-testid="tab-planning"><Calendar className="mr-1 h-4 w-4" />Session Planning</TabsTrigger>
          <TabsTrigger value="delivery" data-testid="tab-delivery"><ClipboardCheck className="mr-1 h-4 w-4" />Delivery Log</TabsTrigger>
          <TabsTrigger value="fidelity" data-testid="tab-fidelity"><TrendingUp className="mr-1 h-4 w-4" />Fidelity Monitor</TabsTrigger>
          <TabsTrigger value="certifications" data-testid="tab-certifications"><Award className="mr-1 h-4 w-4" />Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="planning"><SessionPlanningTab /></TabsContent>
        <TabsContent value="delivery"><DeliveryLogTab /></TabsContent>
        <TabsContent value="fidelity"><FidelityMonitorTab /></TabsContent>
        <TabsContent value="certifications"><CertificationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
