import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Target, Plus, ArrowRight, CheckCircle2, AlertTriangle, Clock, TrendingUp,
  ClipboardCheck, FileText, Download, Trash2, Edit, BarChart3, Activity,
  RefreshCw, Eye, ChevronRight, MapPin, Search, Layers, Shield,
} from "lucide-react";
import { TrainingGuideButton } from "@/components/training-guide";
import type { CqiCycle, CqiGap, CqiIntervention, CqiFidelityDefinition, CqiFidelityObservation, CqiOutcome, CqiCyclePhase } from "@shared/schema";

interface CqiReport {
  cycle: CqiCycle;
  gaps: CqiGap[];
  interventions: CqiIntervention[];
  outcomes: CqiOutcome[];
  fidelityDefinitions: CqiFidelityDefinition[];
  fidelityObservations: Record<string, CqiFidelityObservation[]>;
  phaseHistory: CqiCyclePhase[];
}

const PHASES = [
  { key: "map", label: "Map", description: "Map current state" },
  { key: "analyze", label: "Analyze", description: "Analyze gaps" },
  { key: "plan", label: "Plan", description: "Plan improvements" },
  { key: "execute", label: "Execute", description: "Execute interventions" },
  { key: "reassess", label: "Reassess", description: "Gap re-assessment" },
];

const PROGRAM_AREAS = [
  "Workforce Development",
  "Education & Digital Literacy",
  "Reentry & Justice Support",
  "Family Strengthening",
  "Behavioral Health",
  "Housing & Stability",
  "Youth Development",
  "Community Engagement",
];

const DOMAINS = [
  "Service Delivery", "Program Design", "Staff Capacity", "Data & Reporting",
  "Participant Outcomes", "Community Partnerships", "Technology", "Policy Compliance",
];

const CFIR_CONSTRUCTS = [
  { category: "Intervention Characteristics", items: ["Evidence Strength & Quality", "Relative Advantage", "Adaptability", "Trialability", "Complexity", "Design Quality", "Cost"] },
  { category: "Outer Setting", items: ["Patient Needs & Resources", "Cosmopolitanism", "Peer Pressure", "External Policies & Incentives"] },
  { category: "Inner Setting", items: ["Structural Characteristics", "Networks & Communications", "Culture", "Implementation Climate", "Readiness for Implementation"] },
  { category: "Individuals", items: ["Knowledge & Beliefs", "Self-efficacy", "Individual Stage of Change", "Individual Identification with Organization"] },
  { category: "Process", items: ["Planning", "Engaging", "Executing", "Reflecting & Evaluating"] },
];

const REAIM_DIMENSIONS = [
  { key: "reach", label: "Reach", description: "Who participated and are they representative?" },
  { key: "effectiveness", label: "Effectiveness", description: "What impact did the intervention have?" },
  { key: "adoption", label: "Adoption", description: "How many settings/staff adopted it?" },
  { key: "implementation", label: "Implementation", description: "Was it delivered as intended?" },
  { key: "maintenance", label: "Maintenance", description: "Will effects be sustained over time?" },
];

function calcExpectedCount(definition: CqiFidelityDefinition): number {
  const freq = parseInt(String(definition.expectedFrequency)) || 1;
  const unit = definition.frequencyUnit || "weekly";
  const createdAt = definition.createdAt ? new Date(definition.createdAt) : new Date();
  const now = new Date();
  const daysSinceCreated = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const daysPerUnit: Record<string, number> = {
    daily: 1, day: 1,
    weekly: 7, week: 7,
    biweekly: 14,
    monthly: 30, month: 30,
    quarterly: 90, quarter: 90,
  };
  const unitDays = daysPerUnit[unit] || 7;
  const periodsCovered = daysSinceCreated / unitDays;
  return Math.max(1, Math.round(freq * periodsCovered));
}

function PhaseIndicator({ currentPhase }: { currentPhase: string }) {
  const currentIdx = PHASES.findIndex(p => p.key === currentPhase);
  return (
    <div className="flex items-center gap-1" data-testid="phase-indicator">
      {PHASES.map((phase, idx) => (
        <div key={phase.key} className="flex items-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              idx < currentIdx ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              idx === currentIdx ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`}
            data-testid={`phase-step-${phase.key}`}
          >
            {idx < currentIdx ? <CheckCircle2 className="h-3 w-3" /> : null}
            {phase.label}
          </div>
          {idx < PHASES.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    completed: { label: "Completed", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    closed: { label: "Closed", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    paused: { label: "Paused", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    identified: { label: "Identified", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    planned: { label: "Planned", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  };
  const c = config[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`} data-testid={`badge-status-${status}`}>{c.label}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { className: string }> = {
    critical: { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    high: { className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    medium: { className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    low: { className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  };
  const c = config[severity] || config.medium;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${c.className}`} data-testid={`badge-severity-${severity}`}>{severity}</span>;
}

function CreateCycleDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [programArea, setProgramArea] = useState("");
  const [framework, setFramework] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetEndDate, setTargetEndDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cqi/cycles", {
        title, description, programArea, framework: framework || null,
        startDate, targetEndDate: targetEndDate || null, phase: "map", status: "active",
      });
      const cycle = await res.json();
      await apiRequest("POST", "/api/cqi/cycle-phases", { cycleId: cycle.id, phase: "map" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles"] });
      toast({ title: "Cycle created", description: "New MAP-GAP improvement cycle started." });
      setOpen(false);
      setTitle(""); setDescription(""); setProgramArea(""); setFramework(""); setTargetEndDate("");
      onCreated();
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to create cycle.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-cycle"><Plus className="h-4 w-4 mr-2" /> New Cycle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start New MAP-GAP Cycle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Q2 2026 Workforce Pipeline Improvement" data-testid="input-cycle-title" />
          </div>
          <div>
            <Label>Program Area</Label>
            <Select value={programArea} onValueChange={setProgramArea}>
              <SelectTrigger data-testid="select-program-area"><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                {PROGRAM_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the focus of this improvement cycle..." data-testid="input-cycle-description" />
          </div>
          <div>
            <Label>Implementation Framework (optional)</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger data-testid="select-framework"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="CFIR">CFIR (Consolidated Framework for Implementation Research)</SelectItem>
                <SelectItem value="RE-AIM">RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} data-testid="input-start-date" />
            </div>
            <div>
              <Label>Target End Date</Label>
              <Input type="date" value={targetEndDate} onChange={e => setTargetEndDate(e.target.value)} data-testid="input-target-end-date" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={() => createMutation.mutate()} disabled={!title || !programArea || createMutation.isPending} data-testid="button-submit-cycle">
            {createMutation.isPending ? "Creating..." : "Start Cycle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GapManager({ cycleId }: { cycleId: string }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [currentState, setCurrentState] = useState("");
  const [desiredState, setDesiredState] = useState("");
  const [rootCause, setRootCause] = useState("");

  const { data: rawGaps, isLoading } = useQuery<CqiGap[]>({ queryKey: ["/api/cqi/cycles", cycleId, "gaps"] });
  const gaps = rawGaps ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cqi/gaps", { cycleId, title, description, domain, severity, currentState, desiredState, rootCause });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "gaps"] });
      toast({ title: "Gap recorded" });
      setShowForm(false); setTitle(""); setDescription(""); setDomain(""); setSeverity("medium"); setCurrentState(""); setDesiredState(""); setRootCause("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CqiGap> }) => {
      await apiRequest("PATCH", `/api/cqi/gaps/${id}`, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "gaps"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/cqi/gaps/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "gaps"] });
      toast({ title: "Gap removed" });
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" data-testid="text-gaps-header">Identified Gaps ({gaps.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-gap"><Plus className="h-4 w-4 mr-1" /> Add Gap</Button>
      </div>
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gap Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Low participant retention at 90 days" data-testid="input-gap-title" />
              </div>
              <div>
                <Label>Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger data-testid="select-gap-domain"><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>{DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the gap in detail..." data-testid="input-gap-description" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger data-testid="select-gap-severity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current State</Label>
                <Input value={currentState} onChange={e => setCurrentState(e.target.value)} placeholder="e.g., 45% retention" data-testid="input-gap-current" />
              </div>
              <div>
                <Label>Desired State</Label>
                <Input value={desiredState} onChange={e => setDesiredState(e.target.value)} placeholder="e.g., 80% retention" data-testid="input-gap-desired" />
              </div>
            </div>
            <div>
              <Label>Root Cause (if known)</Label>
              <Textarea value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="What is causing this gap?" data-testid="input-gap-root-cause" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title || !domain || createMutation.isPending} data-testid="button-submit-gap">Save Gap</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {gaps.length === 0 && !showForm && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No gaps identified yet. Click "Add Gap" to begin mapping.</CardContent></Card>
      )}
      {gaps.map(gap => (
        <Card key={gap.id} data-testid={`card-gap-${gap.id}`}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium" data-testid={`text-gap-title-${gap.id}`}>{gap.title}</h4>
                  <SeverityBadge severity={gap.severity} />
                  <StatusBadge status={gap.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{gap.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Domain: <strong>{gap.domain}</strong></span>
                  {gap.currentState && <span>Current: <strong>{gap.currentState}</strong></span>}
                  {gap.desiredState && <span>Target: <strong>{gap.desiredState}</strong></span>}
                </div>
                {gap.rootCause && <p className="text-xs mt-2 text-muted-foreground italic">Root cause: {gap.rootCause}</p>}
              </div>
              <div className="flex gap-1 ml-2">
                {gap.status === "identified" && (
                  <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: gap.id, data: { status: "in_progress" } })} data-testid={`button-progress-gap-${gap.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                {gap.status === "in_progress" && (
                  <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: gap.id, data: { status: "resolved" } })} data-testid={`button-resolve-gap-${gap.id}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(gap.id)} data-testid={`button-delete-gap-${gap.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InterventionManager({ cycleId, framework }: { cycleId: string; framework: string | null }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsibleStaff, setResponsibleStaff] = useState("");
  const [targetMetric, setTargetMetric] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [frameworkConstruct, setFrameworkConstruct] = useState("");

  const { data: rawInterventions, isLoading } = useQuery<CqiIntervention[]>({ queryKey: ["/api/cqi/cycles", cycleId, "interventions"] });
  const interventions = rawInterventions ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cqi/interventions", {
        cycleId, title, description, responsibleStaff, targetMetric, targetValue,
        dueDate: dueDate || null, framework: framework || null, frameworkConstruct: frameworkConstruct || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "interventions"] });
      toast({ title: "Intervention added" });
      setShowForm(false); setTitle(""); setDescription(""); setResponsibleStaff(""); setTargetMetric(""); setTargetValue(""); setDueDate(""); setFrameworkConstruct("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CqiIntervention> }) => {
      await apiRequest("PATCH", `/api/cqi/interventions/${id}`, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "interventions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/cqi/interventions/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "interventions"] });
      toast({ title: "Intervention removed" });
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" data-testid="text-interventions-header">Planned Interventions ({interventions.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-intervention"><Plus className="h-4 w-4 mr-1" /> Add Intervention</Button>
      </div>
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Intervention Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Implement weekly check-in calls" data-testid="input-intervention-title" />
              </div>
              <div>
                <Label>Responsible Staff</Label>
                <Input value={responsibleStaff} onChange={e => setResponsibleStaff(e.target.value)} placeholder="e.g., Case Manager Team" data-testid="input-intervention-staff" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the intervention plan..." data-testid="input-intervention-description" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Target Metric</Label>
                <Input value={targetMetric} onChange={e => setTargetMetric(e.target.value)} placeholder="e.g., 90-day retention rate" data-testid="input-intervention-metric" />
              </div>
              <div>
                <Label>Target Value</Label>
                <Input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="e.g., 80%" data-testid="input-intervention-target" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} data-testid="input-intervention-due" />
              </div>
            </div>
            {framework && framework !== "none" && (
              <div>
                <Label>{framework} Construct</Label>
                {framework === "CFIR" ? (
                  <Select value={frameworkConstruct} onValueChange={setFrameworkConstruct}>
                    <SelectTrigger data-testid="select-cfir-construct"><SelectValue placeholder="Select CFIR construct" /></SelectTrigger>
                    <SelectContent>
                      {CFIR_CONSTRUCTS.map(cat => cat.items.map(item => (
                        <SelectItem key={item} value={item}>{cat.category}: {item}</SelectItem>
                      )))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={frameworkConstruct} onValueChange={setFrameworkConstruct}>
                    <SelectTrigger data-testid="select-reaim-dimension"><SelectValue placeholder="Select RE-AIM dimension" /></SelectTrigger>
                    <SelectContent>
                      {REAIM_DIMENSIONS.map(d => <SelectItem key={d.key} value={d.key}>{d.label} - {d.description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending} data-testid="button-submit-intervention">Save Intervention</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {interventions.length === 0 && !showForm && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No interventions planned yet.</CardContent></Card>
      )}
      {interventions.map(iv => (
        <Card key={iv.id} data-testid={`card-intervention-${iv.id}`}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium" data-testid={`text-intervention-title-${iv.id}`}>{iv.title}</h4>
                  <StatusBadge status={iv.status} />
                  {iv.frameworkConstruct && <Badge variant="outline" className="text-xs">{iv.framework}: {iv.frameworkConstruct}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{iv.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {iv.responsibleStaff && <span>Staff: <strong>{iv.responsibleStaff}</strong></span>}
                  {iv.targetMetric && <span>Metric: <strong>{iv.targetMetric}</strong></span>}
                  {iv.targetValue && <span>Target: <strong>{iv.targetValue}</strong></span>}
                  {iv.actualValue && <span>Actual: <strong>{iv.actualValue}</strong></span>}
                  {iv.dueDate && <span>Due: <strong>{iv.dueDate}</strong></span>}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                {iv.status === "planned" && (
                  <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: iv.id, data: { status: "in_progress" } })} data-testid={`button-start-intervention-${iv.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                {iv.status === "in_progress" && (
                  <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: iv.id, data: { status: "completed", completedDate: new Date().toISOString().split("T")[0] } })} data-testid={`button-complete-intervention-${iv.id}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(iv.id)} data-testid={`button-delete-intervention-${iv.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FidelityMonitor({ cycleId }: { cycleId?: string }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [description, setDescription] = useState("");
  const [expectedFrequency, setExpectedFrequency] = useState("1");
  const [frequencyUnit, setFrequencyUnit] = useState("weekly");
  const [programArea, setProgramArea] = useState("");

  const queryKey = cycleId ? ["/api/cqi/fidelity-definitions", { cycleId }] : ["/api/cqi/fidelity-definitions"];
  const { data: rawDefinitions, isLoading } = useQuery<CqiFidelityDefinition[]>({
    queryKey,
    queryFn: async () => {
      const url = cycleId ? `/api/cqi/fidelity-definitions?cycleId=${cycleId}` : "/api/cqi/fidelity-definitions";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
  const definitions = rawDefinitions ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cqi/fidelity-definitions", {
        cycleId: cycleId || null, activityName, description, expectedFrequency, frequencyUnit, programArea: programArea || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/fidelity-definitions"] });
      if (cycleId) queryClient.invalidateQueries({ queryKey: ["/api/cqi/fidelity-definitions", { cycleId }] });
      toast({ title: "Activity defined" });
      setShowForm(false); setActivityName(""); setDescription(""); setExpectedFrequency("1"); setFrequencyUnit("weekly"); setProgramArea("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/cqi/fidelity-definitions/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/fidelity-definitions"] });
      if (cycleId) queryClient.invalidateQueries({ queryKey: ["/api/cqi/fidelity-definitions", { cycleId }] });
      toast({ title: "Activity removed" });
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" data-testid="text-fidelity-header">Program Activities ({definitions.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-activity"><Plus className="h-4 w-4 mr-1" /> Define Activity</Button>
      </div>
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Activity Name</Label>
                <Input value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="e.g., Weekly check-in calls" data-testid="input-activity-name" />
              </div>
              <div>
                <Label>Program Area</Label>
                <Select value={programArea} onValueChange={setProgramArea}>
                  <SelectTrigger data-testid="select-activity-area"><SelectValue placeholder="Select area" /></SelectTrigger>
                  <SelectContent>{PROGRAM_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this activity involve?" data-testid="input-activity-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expected Frequency</Label>
                <Input value={expectedFrequency} onChange={e => setExpectedFrequency(e.target.value)} placeholder="e.g., 1" data-testid="input-activity-frequency" />
              </div>
              <div>
                <Label>Frequency Unit</Label>
                <Select value={frequencyUnit} onValueChange={setFrequencyUnit}>
                  <SelectTrigger data-testid="select-frequency-unit"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!activityName || createMutation.isPending} data-testid="button-submit-activity">Save Activity</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {definitions.length === 0 && !showForm && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No program activities defined. Define expected activities to track fidelity.</CardContent></Card>
      )}
      {definitions.map(def => (
        <FidelityActivityCard key={def.id} definition={def} onDelete={() => deleteMutation.mutate(def.id)} />
      ))}
    </div>
  );
}

function FidelityActivityCard({ definition, onDelete }: { definition: CqiFidelityDefinition; onDelete: () => void }) {
  const { toast } = useToast();
  const [showLog, setShowLog] = useState(false);
  const [notes, setNotes] = useState("");
  const [wasCompleted, setWasCompleted] = useState(true);
  const [qualityScore, setQualityScore] = useState("5");

  const { data: rawObservations } = useQuery<CqiFidelityObservation[]>({
    queryKey: ["/api/cqi/fidelity-observations", definition.id],
    queryFn: async () => {
      const res = await fetch(`/api/cqi/fidelity-observations/${definition.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const observations = rawObservations ?? [];

  const logMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cqi/fidelity-observations", {
        definitionId: definition.id, observedDate: new Date().toISOString().split("T")[0],
        wasCompleted, notes, qualityScore: parseInt(qualityScore),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/fidelity-observations", definition.id] });
      toast({ title: "Observation logged" });
      setShowLog(false); setNotes(""); setWasCompleted(true); setQualityScore("5");
    },
  });

  const completedCount = observations.filter(o => o.wasCompleted).length;
  const totalCount = observations.length;
  const avgQuality = totalCount > 0 ? Math.round(observations.reduce((sum, o) => sum + (o.qualityScore || 0), 0) / totalCount) : 0;

  const expectedCount = useMemo(() => calcExpectedCount(definition), [definition]);
  const adherenceRate = Math.min(100, Math.round((completedCount / expectedCount) * 100));

  return (
    <Card data-testid={`card-fidelity-${definition.id}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium" data-testid={`text-activity-name-${definition.id}`}>{definition.activityName}</h4>
              <Badge variant="outline" className="text-xs">{definition.expectedFrequency}x {definition.frequencyUnit}</Badge>
              {definition.programArea && <Badge variant="secondary" className="text-xs">{definition.programArea}</Badge>}
            </div>
            {definition.description && <p className="text-sm text-muted-foreground mt-1">{definition.description}</p>}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setShowLog(!showLog)} data-testid={`button-log-observation-${definition.id}`}>
              <ClipboardCheck className="h-3 w-3 mr-1" /> Log
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-activity-${definition.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className={`text-2xl font-bold ${adherenceRate >= 80 ? "text-green-600 dark:text-green-400" : adherenceRate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`} data-testid={`text-adherence-${definition.id}`}>{adherenceRate}%</div>
            <div className="text-xs text-muted-foreground">Adherence</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{completedCount}/{expectedCount}</div>
            <div className="text-xs text-muted-foreground">Done/Expected</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{totalCount}</div>
            <div className="text-xs text-muted-foreground">Observations</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{avgQuality}/10</div>
            <div className="text-xs text-muted-foreground">Avg Quality</div>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Fidelity Score</span>
              <span>{adherenceRate}%</span>
            </div>
            <Progress value={adherenceRate} className="h-2" />
          </div>
        )}

        {showLog && (
          <div className="border-t pt-3 mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Was activity completed?</Label>
                <Select value={wasCompleted ? "yes" : "no"} onValueChange={v => setWasCompleted(v === "yes")}>
                  <SelectTrigger data-testid="select-was-completed"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes - Completed</SelectItem>
                    <SelectItem value="no">No - Not completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quality Score (1-10)</Label>
                <Input type="number" min="1" max="10" value={qualityScore} onChange={e => setQualityScore(e.target.value)} data-testid="input-quality-score" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations or notes..." data-testid="input-observation-notes" />
            </div>
            <Button size="sm" onClick={() => logMutation.mutate()} disabled={logMutation.isPending} data-testid="button-submit-observation">
              {logMutation.isPending ? "Saving..." : "Save Observation"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OutcomeTracker({ cycleId }: { cycleId: string }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [metricName, setMetricName] = useState("");
  const [outcomeType, setOutcomeType] = useState("quantitative");
  const [baselineValue, setBaselineValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [actualValue, setActualValue] = useState("");
  const [notes, setNotes] = useState("");

  const { data: rawOutcomes, isLoading } = useQuery<CqiOutcome[]>({ queryKey: ["/api/cqi/cycles", cycleId, "outcomes"] });
  const outcomes = rawOutcomes ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cqi/outcomes", {
        cycleId, metricName, outcomeType, baselineValue, targetValue,
        actualValue: actualValue || null, notes,
        measurementDate: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "outcomes"] });
      toast({ title: "Outcome recorded" });
      setShowForm(false); setMetricName(""); setOutcomeType("quantitative"); setBaselineValue(""); setTargetValue(""); setActualValue(""); setNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/cqi/outcomes/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "outcomes"] });
      toast({ title: "Outcome deleted" });
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" data-testid="text-outcomes-header">Outcomes & Metrics ({outcomes.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-outcome"><Plus className="h-4 w-4 mr-1" /> Add Outcome</Button>
      </div>
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Metric Name</Label>
                <Input value={metricName} onChange={e => setMetricName(e.target.value)} placeholder="e.g., 90-day retention rate" data-testid="input-outcome-metric" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={outcomeType} onValueChange={setOutcomeType}>
                  <SelectTrigger data-testid="select-outcome-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantitative">Quantitative</SelectItem>
                    <SelectItem value="qualitative">Qualitative</SelectItem>
                    <SelectItem value="process">Process</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Baseline Value</Label>
                <Input value={baselineValue} onChange={e => setBaselineValue(e.target.value)} placeholder="e.g., 45%" data-testid="input-outcome-baseline" />
              </div>
              <div>
                <Label>Target Value</Label>
                <Input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="e.g., 80%" data-testid="input-outcome-target" />
              </div>
              <div>
                <Label>Actual Value</Label>
                <Input value={actualValue} onChange={e => setActualValue(e.target.value)} placeholder="e.g., 72%" data-testid="input-outcome-actual" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-outcome-notes" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!metricName || createMutation.isPending} data-testid="button-submit-outcome">Save Outcome</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {outcomes.length === 0 && !showForm && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No outcomes tracked yet.</CardContent></Card>
      )}
      {outcomes.map(o => (
        <Card key={o.id} data-testid={`card-outcome-${o.id}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{o.metricName}</h4>
                <Badge variant="outline" className="text-xs capitalize">{o.outcomeType}</Badge>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(o.id)} data-testid={`button-delete-outcome-${o.id}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-2 rounded bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">Baseline</div>
                <div className="font-semibold">{o.baselineValue || "—"}</div>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">Target</div>
                <div className="font-semibold">{o.targetValue || "—"}</div>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">Actual</div>
                <div className="font-semibold">{o.actualValue || "—"}</div>
              </div>
            </div>
            {o.notes && <p className="text-xs text-muted-foreground mt-2">{o.notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FrameworkReference({ framework }: { framework: string }) {
  if (framework === "CFIR") {
    return (
      <div className="space-y-4" data-testid="framework-cfir">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-lg">CFIR Framework Reference</h3>
        </div>
        <p className="text-sm text-muted-foreground">The Consolidated Framework for Implementation Research (CFIR) provides a comprehensive taxonomy of standardized constructs that influence implementation effectiveness.</p>
        {CFIR_CONSTRUCTS.map(cat => (
          <Card key={cat.category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{cat.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cat.items.map(item => <Badge key={item} variant="outline" className="text-xs">{item}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (framework === "RE-AIM") {
    return (
      <div className="space-y-4" data-testid="framework-reaim">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-lg">RE-AIM Framework Reference</h3>
        </div>
        <p className="text-sm text-muted-foreground">RE-AIM evaluates programs across five dimensions to understand real-world impact and sustainability.</p>
        {REAIM_DIMENSIONS.map(d => (
          <Card key={d.key}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{d.label}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{d.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return null;
}

function CycleDetail({ cycleId, onBack }: { cycleId: string; onBack: () => void }) {
  const { toast } = useToast();
  const { data: cycle, isLoading } = useQuery<CqiCycle>({ queryKey: ["/api/cqi/cycles", cycleId] });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CqiCycle>) => {
      await apiRequest("PATCH", `/api/cqi/cycles/${cycleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles"] });
      toast({ title: "Cycle updated" });
    },
  });

  const { data: rawPhaseHistory } = useQuery<CqiCyclePhase[]>({ queryKey: ["/api/cqi/cycles", cycleId, "phases"] });
  const phaseHistory = rawPhaseHistory ?? [];

  const phaseTransitionMutation = useMutation({
    mutationFn: async (data: { cycleId: string; phase: string; exitPreviousId?: string }) => {
      if (data.exitPreviousId) {
        await apiRequest("PATCH", `/api/cqi/cycle-phases/${data.exitPreviousId}`, { exitedAt: new Date().toISOString() });
      }
      await apiRequest("POST", "/api/cqi/cycle-phases", { cycleId: data.cycleId, phase: data.phase });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles", cycleId, "phases"] });
    },
  });

  const advancePhase = () => {
    if (!cycle) return;
    const currentIdx = PHASES.findIndex(p => p.key === cycle.phase);
    const currentPhaseRecord = phaseHistory.find(p => p.phase === cycle.phase && !p.exitedAt);
    if (currentIdx < PHASES.length - 1) {
      const nextPhase = PHASES[currentIdx + 1].key;
      updateMutation.mutate({ phase: nextPhase } as Partial<CqiCycle>);
      phaseTransitionMutation.mutate({ cycleId, phase: nextPhase, exitPreviousId: currentPhaseRecord?.id });
    } else {
      updateMutation.mutate({ status: "completed", actualEndDate: new Date().toISOString().split("T")[0] } as Partial<CqiCycle>);
      if (currentPhaseRecord) {
        phaseTransitionMutation.mutate({ cycleId, phase: "completed", exitPreviousId: currentPhaseRecord.id });
      }
    }
  };

  const exportReport = async () => {
    try {
      const report = await fetchReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cqi-report-${cycle?.title?.replace(/\s+/g, "-").toLowerCase() || cycleId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Report exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const fetchReport = async (): Promise<CqiReport> => {
    const res = await fetch(`/api/cqi/report/${cycleId}`, { credentials: "include" });
    return res.json() as Promise<CqiReport>;
  };

  const exportCSV = async () => {
    try {
      const report = await fetchReport();
      let csv = "Section,Field,Value\n";
      csv += `Cycle,Title,"${report.cycle.title}"\n`;
      csv += `Cycle,Program Area,"${report.cycle.programArea}"\n`;
      csv += `Cycle,Phase,"${report.cycle.phase}"\n`;
      csv += `Cycle,Status,"${report.cycle.status}"\n`;
      csv += `Cycle,Start Date,"${report.cycle.startDate || ""}"\n`;
      csv += `Cycle,Framework,"${report.cycle.framework || "None"}"\n`;
      csv += `Cycle,Lessons Learned,"${(report.cycle.lessonsLearned || "").replace(/"/g, '""')}"\n\n`;
      report.gaps.forEach((g: CqiGap) => {
        csv += `Gap,"${g.title}","Severity: ${g.severity}, Domain: ${g.domain}, Status: ${g.status}"\n`;
      });
      report.interventions.forEach((i: CqiIntervention) => {
        csv += `Intervention,"${i.title}","Staff: ${i.responsibleStaff || ""}, Status: ${i.status}, Target: ${i.targetValue || ""}, Actual: ${i.actualValue || ""}"\n`;
      });
      report.outcomes.forEach((o: CqiOutcome) => {
        csv += `Outcome,"${o.metricName}","Baseline: ${o.baselineValue || ""}, Target: ${o.targetValue || ""}, Actual: ${o.actualValue || ""}"\n`;
      });
      report.fidelityDefinitions.forEach((f: CqiFidelityDefinition) => {
        const obs: CqiFidelityObservation[] = report.fidelityObservations[f.id] || [];
        const completed = obs.filter((o: CqiFidelityObservation) => o.wasCompleted).length;
        const expectedForPeriod = calcExpectedCount(f);
        const adherence = Math.min(100, Math.round((completed / expectedForPeriod) * 100));
        csv += `Fidelity,"${f.activityName}","Expected: ${f.expectedFrequency}x ${f.frequencyUnit}, Completed: ${completed}/${expectedForPeriod}, Adherence: ${adherence}%"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cqi-report-${cycle?.title?.replace(/\s+/g, "-").toLowerCase() || cycleId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const exportPDF = async () => {
    try {
      const report = await fetchReport();
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      let y = margin;

      const checkPage = (needed: number) => {
        if (y + needed > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const heading = (text: string) => {
        checkPage(20);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(text, margin, y);
        y += 8;
        pdf.setDrawColor(100, 100, 200);
        pdf.line(margin, y, margin + pageWidth, y);
        y += 6;
      };

      const label = (key: string, value: string) => {
        checkPage(8);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${key}: `, margin, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(value, margin + pdf.getTextWidth(`${key}: `), y);
        y += 6;
      };

      const body = (text: string) => {
        checkPage(8);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(text, pageWidth);
        for (const line of lines) {
          checkPage(6);
          pdf.text(line, margin, y);
          y += 5;
        }
      };

      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("CQI Report", margin, y);
      y += 8;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text("MAP-GAP Continuous Quality Improvement", margin, y);
      y += 6;
      pdf.setFontSize(9);
      pdf.text(`ThriveUp Academy — Generated ${new Date().toLocaleDateString()}`, margin, y);
      y += 12;

      heading("Cycle Overview");
      label("Title", report.cycle.title);
      label("Program Area", report.cycle.programArea);
      label("Phase", PHASES.find(p => p.key === report.cycle.phase)?.label || report.cycle.phase);
      label("Status", report.cycle.status);
      label("Framework", report.cycle.framework || "None");
      label("Start Date", report.cycle.startDate || "N/A");
      label("End Date", report.cycle.actualEndDate || report.cycle.targetEndDate || "N/A");
      y += 4;

      if (report.phaseHistory && report.phaseHistory.length > 0) {
        heading("Phase Transition History");
        report.phaseHistory.forEach((ph: CqiCyclePhase) => {
          const phaseName = PHASES.find(p => p.key === ph.phase)?.label || ph.phase;
          const entered = ph.enteredAt ? new Date(ph.enteredAt).toLocaleDateString() : "N/A";
          const exited = ph.exitedAt ? new Date(ph.exitedAt).toLocaleDateString() : "Current";
          body(`${phaseName}: ${entered} → ${exited}${ph.notes ? ` (${ph.notes})` : ""}`);
        });
        y += 4;
      }

      heading("Identified Gaps");
      if (report.gaps.length === 0) {
        body("No gaps identified.");
      } else {
        report.gaps.forEach((g: CqiGap, idx: number) => {
          checkPage(20);
          body(`${idx + 1}. ${g.title} — Severity: ${g.severity}, Domain: ${g.domain}, Status: ${g.status}`);
          if (g.currentState) body(`   Current: ${g.currentState}`);
          if (g.desiredState) body(`   Desired: ${g.desiredState}`);
          if (g.rootCause) body(`   Root Cause: ${g.rootCause}`);
          y += 2;
        });
      }
      y += 4;

      heading("Interventions");
      if (report.interventions.length === 0) {
        body("No interventions planned.");
      } else {
        report.interventions.forEach((i: CqiIntervention, idx: number) => {
          checkPage(16);
          body(`${idx + 1}. ${i.title} — Staff: ${i.responsibleStaff || "Unassigned"}, Status: ${i.status}`);
          body(`   Target: ${i.targetMetric || "N/A"} = ${i.targetValue || "N/A"}, Actual: ${i.actualValue || "Pending"}`);
          y += 2;
        });
      }
      y += 4;

      heading("Fidelity Monitoring");
      if (report.fidelityDefinitions.length === 0) {
        body("No fidelity activities defined.");
      } else {
        report.fidelityDefinitions.forEach((f: CqiFidelityDefinition, idx: number) => {
          const obs: CqiFidelityObservation[] = report.fidelityObservations[f.id] || [];
          const completed = obs.filter((o: CqiFidelityObservation) => o.wasCompleted).length;
          const expectedForPeriod = calcExpectedCount(f);
          const adherence = Math.min(100, Math.round((completed / expectedForPeriod) * 100));
          checkPage(12);
          body(`${idx + 1}. ${f.activityName} — Expected: ${f.expectedFrequency}x/${f.frequencyUnit}`);
          body(`   Completed: ${completed}/${expectedForPeriod} expected, Adherence: ${adherence}%`);
          y += 2;
        });
      }
      y += 4;

      heading("Outcomes");
      if (report.outcomes.length === 0) {
        body("No outcomes recorded.");
      } else {
        report.outcomes.forEach((o: CqiOutcome, idx: number) => {
          checkPage(12);
          body(`${idx + 1}. ${o.metricName} (${o.outcomeType})`);
          body(`   Baseline: ${o.baselineValue || "N/A"} → Target: ${o.targetValue || "N/A"} → Actual: ${o.actualValue || "Pending"}`);
          if (o.notes) body(`   Notes: ${o.notes}`);
          y += 2;
        });
      }

      if (report.cycle.lessonsLearned) {
        y += 4;
        heading("Lessons Learned");
        body(report.cycle.lessonsLearned);
      }

      pdf.save(`cqi-report-${cycle?.title?.replace(/\s+/g, "-").toLowerCase() || cycleId}.pdf`);
      toast({ title: "PDF report exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (isLoading || !cycle) return <div className="p-6"><Skeleton className="h-64" /></div>;

  const currentPhaseIdx = PHASES.findIndex(p => p.key === cycle.phase);
  const isLastPhase = currentPhaseIdx === PHASES.length - 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-cycles" className="mb-2">
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Back to Cycles
          </Button>
          <h1 className="text-2xl font-bold" data-testid="text-cycle-title">{cycle.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{cycle.programArea}</span>
            <StatusBadge status={cycle.status} />
            {cycle.framework && cycle.framework !== "none" && <Badge variant="outline">{cycle.framework}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {cycle.status === "active" && (
            <Button onClick={advancePhase} data-testid="button-advance-phase">
              {isLastPhase ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Cycle</> : <><ArrowRight className="h-4 w-4 mr-2" /> Advance Phase</>}
            </Button>
          )}
          <Button variant="outline" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} data-testid="button-export-pdf">
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={exportReport} data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" /> JSON
          </Button>
        </div>
      </div>

      <PhaseIndicator currentPhase={cycle.phase} />

      {phaseHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Phase Transition History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {phaseHistory.map((ph, idx) => (
                <div key={ph.id} className="flex items-center gap-1">
                  <Badge variant={ph.exitedAt ? "secondary" : "default"} className="text-xs" data-testid={`badge-phase-history-${idx}`}>
                    {PHASES.find(p => p.key === ph.phase)?.label || ph.phase}
                    {ph.enteredAt && <span className="ml-1 opacity-70">({new Date(ph.enteredAt).toLocaleDateString()})</span>}
                  </Badge>
                  {idx < phaseHistory.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {cycle.description && <p className="text-muted-foreground">{cycle.description}</p>}

      <Tabs defaultValue="gaps">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="gaps" data-testid="tab-gaps"><Search className="h-3 w-3 mr-1" /> Gaps</TabsTrigger>
          <TabsTrigger value="interventions" data-testid="tab-interventions"><Target className="h-3 w-3 mr-1" /> Interventions</TabsTrigger>
          <TabsTrigger value="fidelity" data-testid="tab-fidelity"><ClipboardCheck className="h-3 w-3 mr-1" /> Fidelity</TabsTrigger>
          <TabsTrigger value="outcomes" data-testid="tab-outcomes"><BarChart3 className="h-3 w-3 mr-1" /> Outcomes</TabsTrigger>
          {cycle.framework && cycle.framework !== "none" && (
            <TabsTrigger value="framework" data-testid="tab-framework"><Layers className="h-3 w-3 mr-1" /> Framework</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="gaps"><GapManager cycleId={cycleId} /></TabsContent>
        <TabsContent value="interventions"><InterventionManager cycleId={cycleId} framework={cycle.framework} /></TabsContent>
        <TabsContent value="fidelity"><FidelityMonitor cycleId={cycleId} /></TabsContent>
        <TabsContent value="outcomes"><OutcomeTracker cycleId={cycleId} /></TabsContent>
        {cycle.framework && cycle.framework !== "none" && (
          <TabsContent value="framework"><FrameworkReference framework={cycle.framework} /></TabsContent>
        )}
      </Tabs>

      {cycle.status === "active" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lessons Learned</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              defaultValue={cycle.lessonsLearned || ""}
              placeholder="Document lessons learned throughout this improvement cycle..."
              onBlur={e => {
                if (e.target.value !== (cycle.lessonsLearned || "")) {
                  updateMutation.mutate({ lessonsLearned: e.target.value });
                }
              }}
              data-testid="input-lessons-learned"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrendVisualization({ cycles }: { cycles: CqiCycle[] }) {
  const phaseDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    PHASES.forEach(p => { dist[p.key] = 0; });
    cycles.filter(c => c.status === "active").forEach(c => {
      if (dist[c.phase] !== undefined) dist[c.phase]++;
    });
    return dist;
  }, [cycles]);

  const programAreaBreakdown = useMemo(() => {
    const areas: Record<string, { active: number; completed: number }> = {};
    cycles.forEach(c => {
      if (!areas[c.programArea]) areas[c.programArea] = { active: 0, completed: 0 };
      if (c.status === "active") areas[c.programArea].active++;
      else if (c.status === "completed" || c.status === "closed") areas[c.programArea].completed++;
    });
    return areas;
  }, [cycles]);

  const completionTimeline = useMemo(() => {
    return cycles
      .filter(c => c.status === "completed" && c.startDate && c.actualEndDate)
      .map(c => {
        const start = new Date(c.startDate!);
        const end = new Date(c.actualEndDate!);
        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return { title: c.title, durationDays, programArea: c.programArea, completed: c.actualEndDate };
      })
      .sort((a, b) => (a.completed || "").localeCompare(b.completed || ""));
  }, [cycles]);

  const maxPhase = Math.max(...Object.values(phaseDistribution), 1);

  return (
    <div className="space-y-4" data-testid="trend-visualization">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Phase Distribution (Active Cycles)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PHASES.map(phase => (
              <div key={phase.key} className="flex items-center gap-3">
                <span className="text-xs w-20 text-right">{phase.label}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((phaseDistribution[phase.key] / maxPhase) * 100, phaseDistribution[phase.key] > 0 ? 15 : 0)}%` }}
                  >
                    {phaseDistribution[phase.key] > 0 && (
                      <span className="text-xs font-medium text-primary-foreground">{phaseDistribution[phase.key]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Program Area Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(programAreaBreakdown).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No cycles to analyze.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(programAreaBreakdown).map(([area, counts]) => (
                <div key={area} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{area}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600 dark:text-green-400">{counts.active} active</span>
                    <span className="text-blue-600 dark:text-blue-400">{counts.completed} completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {completionTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Completion Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completionTimeline.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <span className="text-sm font-medium">{entry.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">({entry.programArea})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{entry.durationDays} days</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SystemHealthIndicators({ cycles }: { cycles: CqiCycle[] }) {
  const health = useMemo(() => {
    const total = cycles.length;
    const active = cycles.filter(c => c.status === "active").length;
    const completed = cycles.filter(c => c.status === "completed" || c.status === "closed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const withFramework = cycles.filter(c => c.framework && c.framework !== "none").length;
    const frameworkAdoption = total > 0 ? Math.round((withFramework / total) * 100) : 0;

    const withLessons = cycles.filter(c => c.lessonsLearned && c.lessonsLearned.trim().length > 0).length;
    const learningDocRate = total > 0 ? Math.round((withLessons / total) * 100) : 0;

    const programAreas = new Set(cycles.map(c => c.programArea)).size;

    const phaseCoverage = PHASES.filter(p =>
      cycles.some(c => c.phase === p.key)
    ).length;
    const phaseCoverageRate = Math.round((phaseCoverage / PHASES.length) * 100);

    const overdueCycles = cycles.filter(c =>
      c.status === "active" && c.targetEndDate && new Date(c.targetEndDate) < new Date()
    ).length;

    const avgPhaseProg = active > 0
      ? Math.round(cycles.filter(c => c.status === "active")
          .reduce((sum, c) => sum + (PHASES.findIndex(p => p.key === c.phase) + 1), 0) / active / PHASES.length * 100)
      : 0;

    return { total, active, completed, completionRate, frameworkAdoption, learningDocRate, programAreas, phaseCoverageRate, overdueCycles, avgPhaseProg };
  }, [cycles]);

  const healthScore = useMemo(() => {
    let score = 0;
    if (health.total > 0) score += 15;
    if (health.completionRate >= 30) score += 20;
    if (health.frameworkAdoption >= 50) score += 20;
    if (health.learningDocRate >= 40) score += 15;
    if (health.programAreas >= 2) score += 10;
    if (health.phaseCoverageRate >= 60) score += 10;
    if (health.overdueCycles === 0) score += 10;
    return Math.min(score, 100);
  }, [health]);

  const scoreColor = healthScore >= 75 ? "text-green-600 dark:text-green-400" :
    healthScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-4" data-testid="system-health">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> CQI System Health Score</CardTitle>
          <CardDescription>Overall health of CQI usage and organizational learning capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className={`text-5xl font-bold ${scoreColor}`} data-testid="text-health-score">{healthScore}</div>
            <div className="text-sm text-muted-foreground">out of 100</div>
          </div>
          <Progress value={healthScore} className="h-3 mb-4" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold" data-testid="text-completion-rate">{health.completionRate}%</div>
            <div className="text-xs text-muted-foreground">Cycle Completion Rate</div>
            <Progress value={health.completionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold" data-testid="text-framework-adoption">{health.frameworkAdoption}%</div>
            <div className="text-xs text-muted-foreground">Framework Adoption</div>
            <Progress value={health.frameworkAdoption} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold" data-testid="text-learning-doc-rate">{health.learningDocRate}%</div>
            <div className="text-xs text-muted-foreground">Learning Documentation</div>
            <Progress value={health.learningDocRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold" data-testid="text-program-areas">{health.programAreas}</div>
            <div className="text-xs text-muted-foreground">Program Areas Engaged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold" data-testid="text-phase-coverage">{health.phaseCoverageRate}%</div>
            <div className="text-xs text-muted-foreground">Phase Coverage</div>
            <Progress value={health.phaseCoverageRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className={`text-2xl font-bold ${health.overdueCycles > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`} data-testid="text-overdue-cycles">
              {health.overdueCycles}
            </div>
            <div className="text-xs text-muted-foreground">Overdue Cycles</div>
          </CardContent>
        </Card>
      </div>

      {health.active > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Cycle Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Average phase progression:</span>
              <div className="flex-1">
                <Progress value={health.avgPhaseProg} className="h-2" />
              </div>
              <span className="text-sm font-medium">{health.avgPhaseProg}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MapGapCqiPage() {
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "MAP-GAP CQI Engine | ThriveUp Academy";
  }, []);

  const { data: rawCycles, isLoading } = useQuery<CqiCycle[]>({ queryKey: ["/api/cqi/cycles"] });
  const cycles = rawCycles ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/cqi/cycles/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cqi/cycles"] });
      toast({ title: "Cycle deleted" });
    },
  });

  const activeCycles = cycles.filter(c => c.status === "active");
  const completedCycles = cycles.filter(c => c.status === "completed" || c.status === "closed");

  if (selectedCycleId) {
    return <CycleDetail cycleId={selectedCycleId} onBack={() => setSelectedCycleId(null)} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <RefreshCw className="h-6 w-6 text-primary" />
            MAP-GAP CQI Engine
          </h1>
          <p className="text-muted-foreground mt-1">Continuous Quality Improvement — Map, Analyze, Plan, Execute, Reassess</p>
        </div>
        <div className="flex items-center gap-2">
          <TrainingGuideButton moduleId="map-gap-cqi" />
          <CreateCycleDialog onCreated={() => {}} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-primary" data-testid="text-active-cycles">{activeCycles.length}</div>
            <div className="text-xs text-muted-foreground">Active Cycles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-green-600" data-testid="text-completed-cycles">{completedCycles.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-blue-600" data-testid="text-total-cycles">{cycles.length}</div>
            <div className="text-xs text-muted-foreground">Total Cycles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-amber-600" data-testid="text-frameworks-used">
              {new Set(cycles.filter(c => c.framework && c.framework !== "none").map(c => c.framework)).size}
            </div>
            <div className="text-xs text-muted-foreground">Frameworks Used</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard"><Activity className="h-3 w-3 mr-1" /> Dashboard</TabsTrigger>
          <TabsTrigger value="fidelity" data-testid="tab-all-fidelity"><ClipboardCheck className="h-3 w-3 mr-1" /> Fidelity Monitor</TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health"><Shield className="h-3 w-3 mr-1" /> System Health</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history"><TrendingUp className="h-3 w-3 mr-1" /> Cycle History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : activeCycles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Improvement Cycles</h3>
                <p className="text-muted-foreground mb-4">Start a new MAP-GAP cycle to begin your continuous quality improvement journey.</p>
                <CreateCycleDialog onCreated={() => {}} />
              </CardContent>
            </Card>
          ) : (
            activeCycles.map(cycle => (
              <Card key={cycle.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCycleId(cycle.id)} data-testid={`card-cycle-${cycle.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg" data-testid={`text-cycle-name-${cycle.id}`}>{cycle.title}</h3>
                        <StatusBadge status={cycle.status} />
                        {cycle.framework && cycle.framework !== "none" && <Badge variant="outline" className="text-xs">{cycle.framework}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{cycle.programArea}</p>
                      <PhaseIndicator currentPhase={cycle.phase} />
                      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                        {cycle.startDate && <span>Started: {cycle.startDate}</span>}
                        {cycle.targetEndDate && <span>Target: {cycle.targetEndDate}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setSelectedCycleId(cycle.id)} data-testid={`button-view-cycle-${cycle.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(cycle.id)} data-testid={`button-delete-cycle-${cycle.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="fidelity">
          <FidelityMonitor />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <SystemHealthIndicators cycles={cycles} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <TrendVisualization cycles={cycles} />
          {completedCycles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No completed cycles yet. Complete an active cycle to see it here.</CardContent>
            </Card>
          ) : (
            completedCycles.map(cycle => (
              <Card key={cycle.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCycleId(cycle.id)} data-testid={`card-history-${cycle.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{cycle.title}</h3>
                        <StatusBadge status={cycle.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{cycle.programArea}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        {cycle.startDate && <span>Started: {cycle.startDate}</span>}
                        {cycle.actualEndDate && <span>Completed: {cycle.actualEndDate}</span>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" data-testid={`button-view-history-${cycle.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
