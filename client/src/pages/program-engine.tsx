import { useState, useMemo } from "react";
import { TrainingGuideButton } from "@/components/training-guide";
import SectionTutorial from "@/components/section-tutorial";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Plus, Check, AlertTriangle, Clock, Target,
  Shield, Activity, Users, ChevronDown, ExternalLink,
  Microscope, BookOpen, FileText, Briefcase, TrendingUp,
  RefreshCw, GraduationCap, Zap, Eye, MessageSquare,
  BarChart3, Calendar, X, Flame,
} from "lucide-react";
import type { Program, ProgramMilestone, ProgramRisk, ProgramUpdate } from "@shared/schema";

type ProgramWithSummary = Program & {
  _summary: {
    total: number;
    completed: number;
    atRisk: number;
    overdue: number;
    activeRisks: number;
    healthScore: number;
  };
};

type ProgramDetail = Program & {
  milestones: ProgramMilestone[];
  risks: ProgramRisk[];
  updates: ProgramUpdate[];
};

type HealthData = {
  healthScore: number;
  currentPhase: string;
  milestones: {
    total: number;
    completed: number;
    inProgress: number;
    atRisk: number;
    overdue: number;
    notStarted: number;
    dueThisWeek: number;
  };
  risks: {
    total: number;
    active: number;
    high: number;
    resolved: number;
  };
  methodology: string;
  status: string;
  grants: string[] | null;
  platforms: string[] | null;
};

const GRANT_OPTIONS = [
  { id: "wioa", label: "WIOA Title I Youth" },
  { id: "foundation", label: "Foundation Grant" },
  { id: "st_davids", label: "St. David's Foundation" },
  { id: "ssg_fox", label: "SSG Fox" },
];

const PLATFORM_OPTIONS = [
  { id: "learning_academy", label: "Learning Academy" },
  { id: "sixth_grade_academy", label: "6th Grade Academy" },
  { id: "ecosystem_hub", label: "Ecosystem Hub" },
  { id: "rplice", label: "RPLICE Toolkit" },
  { id: "mce", label: "MCE Contracts" },
];

function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [targetPopulation, setTargetPopulation] = useState("");
  const [geographicFocus, setGeographicFocus] = useState("");
  const [stakeholders, setStakeholders] = useState<{ name: string; role: string; organization: string; email: string }[]>([{ name: "", role: "", organization: "", email: "" }]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phases, setPhases] = useState<{ name: string; startDate: string; endDate: string }[]>([{ name: "Phase 1", startDate: "", endDate: "" }]);
  const [successCriteria, setSuccessCriteria] = useState<string[]>([""]);
  const [selectedGrants, setSelectedGrants] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [methodology, setMethodology] = useState<string>("hybrid");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/programs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({ title: "Program launched", description: "Your program has been created." });
      onComplete();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleLaunch = () => {
    createMutation.mutate({
      title,
      description,
      objectives: objectives.filter(Boolean),
      targetPopulation,
      geographicFocus,
      stakeholders: stakeholders.filter(s => s.name),
      timeline: { startDate, endDate, phases: phases.filter(p => p.name) },
      successCriteria: successCriteria.filter(Boolean),
      methodology,
      grantIds: selectedGrants,
      platformIds: selectedPlatforms,
      status: "planning",
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return title.trim() !== "" && description.trim() !== "";
      case 2: return stakeholders.some(s => s.name.trim() !== "");
      case 3: return startDate !== "" && endDate !== "";
      case 4: return successCriteria.some(c => c.trim() !== "");
      case 5: return methodology !== "";
      case 6: return true;
      default: return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="wizard-setup">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onComplete} data-testid="button-wizard-back">
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="text-xl font-bold" data-testid="text-wizard-title">New Program Setup</h2>
          <p className="text-sm text-muted-foreground">Step {step} of 6</p>
        </div>
      </div>
      <Progress value={(step / 6) * 100} className="h-2" data-testid="progress-wizard" />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step1-title">What are you trying to accomplish?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Program Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., WIOA Youth Reentry Program" data-testid="input-program-title" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the program goals and scope..." data-testid="input-program-description" />
            </div>
            <div>
              <label className="text-sm font-medium">Objectives</label>
              {objectives.map((obj, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input value={obj} onChange={e => { const n = [...objectives]; n[i] = e.target.value; setObjectives(n); }} placeholder={`Objective ${i + 1}`} data-testid={`input-objective-${i}`} />
                  {objectives.length > 1 && <Button variant="ghost" size="icon" onClick={() => setObjectives(objectives.filter((_, j) => j !== i))} data-testid={`button-remove-objective-${i}`}><X className="h-4 w-4" /></Button>}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setObjectives([...objectives, ""])} className="mt-2" data-testid="button-add-objective"><Plus className="h-4 w-4 mr-1" /> Add Objective</Button>
            </div>
            <div>
              <label className="text-sm font-medium">Target Population</label>
              <Input value={targetPopulation} onChange={e => setTargetPopulation(e.target.value)} placeholder="e.g., Youth ages 16-24" data-testid="input-target-population" />
            </div>
            <div>
              <label className="text-sm font-medium">Geographic Focus</label>
              <Input value={geographicFocus} onChange={e => setGeographicFocus(e.target.value)} placeholder="e.g., Austin metro area" data-testid="input-geographic-focus" />
            </div>
            <WhyThisApproach
              title="Program Definition"
              explanation="Clear objectives and scope reduce project failure rates by 40%. Evidence-based program design starts with measurable goals."
              links={[
                { label: "PM Academy: Program Initiation", url: "/pm-academy" },
                { label: "Program Designer Tool", url: "/program-designer" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step2-title">Who's involved?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stakeholders.map((s, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <Input value={s.name} onChange={e => { const n = [...stakeholders]; n[i] = { ...n[i], name: e.target.value }; setStakeholders(n); }} placeholder="Name" data-testid={`input-stakeholder-name-${i}`} />
                <Input value={s.role} onChange={e => { const n = [...stakeholders]; n[i] = { ...n[i], role: e.target.value }; setStakeholders(n); }} placeholder="Role" data-testid={`input-stakeholder-role-${i}`} />
                <Input value={s.organization} onChange={e => { const n = [...stakeholders]; n[i] = { ...n[i], organization: e.target.value }; setStakeholders(n); }} placeholder="Organization" data-testid={`input-stakeholder-org-${i}`} />
                <div className="flex gap-2">
                  <Input value={s.email} onChange={e => { const n = [...stakeholders]; n[i] = { ...n[i], email: e.target.value }; setStakeholders(n); }} placeholder="Email" data-testid={`input-stakeholder-email-${i}`} />
                  {stakeholders.length > 1 && <Button variant="ghost" size="icon" onClick={() => setStakeholders(stakeholders.filter((_, j) => j !== i))} data-testid={`button-remove-stakeholder-${i}`}><X className="h-4 w-4" /></Button>}
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setStakeholders([...stakeholders, { name: "", role: "", organization: "", email: "" }])} data-testid="button-add-stakeholder"><Plus className="h-4 w-4 mr-1" /> Add Stakeholder</Button>
            <WhyThisApproach
              title="Stakeholder Engagement"
              explanation="Implementation Science's CFIR framework identifies stakeholder buy-in as a critical determinant of program success."
              links={[
                { label: "RPLICE: CFIR Assessment", url: "/rplice-tools" },
                { label: "Advisory Board Setup", url: "/advisory-board" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step3-title">What's the timeline?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} data-testid="input-start-date" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} data-testid="input-end-date" />
              </div>
            </div>
            <Separator />
            <label className="text-sm font-medium">Phases</label>
            {phases.map((p, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input value={p.name} onChange={e => { const n = [...phases]; n[i] = { ...n[i], name: e.target.value }; setPhases(n); }} placeholder="Phase name" data-testid={`input-phase-name-${i}`} />
                <Input type="date" value={p.startDate} onChange={e => { const n = [...phases]; n[i] = { ...n[i], startDate: e.target.value }; setPhases(n); }} data-testid={`input-phase-start-${i}`} />
                <div className="flex gap-2">
                  <Input type="date" value={p.endDate} onChange={e => { const n = [...phases]; n[i] = { ...n[i], endDate: e.target.value }; setPhases(n); }} data-testid={`input-phase-end-${i}`} />
                  {phases.length > 1 && <Button variant="ghost" size="icon" onClick={() => setPhases(phases.filter((_, j) => j !== i))} data-testid={`button-remove-phase-${i}`}><X className="h-4 w-4" /></Button>}
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setPhases([...phases, { name: `Phase ${phases.length + 1}`, startDate: "", endDate: "" }])} data-testid="button-add-phase"><Plus className="h-4 w-4 mr-1" /> Add Phase</Button>
            <WhyThisApproach
              title="Timeline & Phasing"
              explanation="Phased implementation aligns with IPEMC process groups and RE-AIM's temporal analysis of program adoption."
              links={[
                { label: "PM Academy: Planning Phase", url: "/pm-academy" },
                { label: "Program Lifecycle View", url: "/program-lifecycle" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step4-title">What does success look like?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="text-sm font-medium">Success Criteria (measurable outcomes)</label>
            {successCriteria.map((c, i) => (
              <div key={i} className="flex gap-2">
                <Input value={c} onChange={e => { const n = [...successCriteria]; n[i] = e.target.value; setSuccessCriteria(n); }} placeholder={`Criterion ${i + 1}`} data-testid={`input-criterion-${i}`} />
                {successCriteria.length > 1 && <Button variant="ghost" size="icon" onClick={() => setSuccessCriteria(successCriteria.filter((_, j) => j !== i))} data-testid={`button-remove-criterion-${i}`}><X className="h-4 w-4" /></Button>}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setSuccessCriteria([...successCriteria, ""])} data-testid="button-add-criterion"><Plus className="h-4 w-4 mr-1" /> Add Criterion</Button>
            <Separator />
            <label className="text-sm font-medium">Grant Alignment</label>
            <div className="flex flex-wrap gap-2">
              {GRANT_OPTIONS.map(g => (
                <Badge
                  key={g.id}
                  variant={selectedGrants.includes(g.id) ? "default" : "outline"}
                  className="cursor-pointer toggle-elevate"
                  onClick={() => setSelectedGrants(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                  data-testid={`badge-grant-${g.id}`}
                >
                  {g.label}
                </Badge>
              ))}
            </div>
            <label className="text-sm font-medium">Ecosystem Platforms Involved</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(p => (
                <Badge
                  key={p.id}
                  variant={selectedPlatforms.includes(p.id) ? "default" : "outline"}
                  className="cursor-pointer toggle-elevate"
                  onClick={() => setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  data-testid={`badge-platform-${p.id}`}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
            <WhyThisApproach
              title="Success Measurement"
              explanation="RE-AIM framework measures Reach, Effectiveness, Adoption, Implementation, and Maintenance for comprehensive program evaluation."
              links={[
                { label: "RPLICE: RE-AIM Scorecard", url: "/rplice-tools" },
                { label: "Outcome Reporting", url: "/outcomes" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step5-title">Methodology Selection</CardTitle>
            <CardDescription>Choose the approach that best fits your program's needs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Card className={`cursor-pointer transition-colors ${methodology === "implementation_science" ? "ring-2 ring-primary" : ""}`} onClick={() => setMethodology("implementation_science")} data-testid="card-methodology-is">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Microscope className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Full Implementation Science</span>
                    </div>
                    <Badge variant="secondary">Recommended for grant-funded programs</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Uses CFIR, RE-AIM, MAP-GAP, SALP frameworks. For programs that need evidence-based rigor, funder defensibility, or academic credibility.</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-colors ${methodology === "traditional" ? "ring-2 ring-primary" : ""}`} onClick={() => setMethodology("traditional")} data-testid="card-methodology-traditional">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Traditional Program Management</span>
                    </div>
                    <Badge variant="secondary">Implementation science runs behind the scenes</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Uses standard PM process groups (IPEMC), triple constraint, RAID. Simpler interface but implementation science still works underneath.</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-colors ${methodology === "hybrid" ? "ring-2 ring-primary" : ""}`} onClick={() => setMethodology("hybrid")} data-testid="card-methodology-hybrid">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Hybrid</span>
                    </div>
                    <Badge variant="secondary">Best of both worlds</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Combines both approaches. PM structure with IS checkpoints throughout the lifecycle.</p>
                </CardContent>
              </Card>
            </div>
            <WhyThisApproach
              title="Methodology Selection"
              explanation="Implementation Science reduces program failure rates from 70% to under 30%. The hybrid approach ensures rigor without complexity overhead."
              links={[
                { label: "PM Academy: Implementation Science Track", url: "/pm-academy" },
                { label: "RPLICE: CFIR Assessment", url: "/rplice-tools" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step6-title">Review & Launch</CardTitle>
            <CardDescription>Review your program setup before launching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <span className="text-sm text-muted-foreground">Title</span>
                <p className="font-medium" data-testid="text-review-title">{title}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="text-sm" data-testid="text-review-description">{description}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Objectives</span>
                <ul className="list-disc list-inside text-sm">
                  {objectives.filter(Boolean).map((o, i) => <li key={i} data-testid={`text-review-objective-${i}`}>{o}</li>)}
                </ul>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Methodology</span>
                <p className="font-medium capitalize" data-testid="text-review-methodology">{methodology.replace("_", " ")}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Timeline</span>
                <p className="text-sm" data-testid="text-review-timeline">{startDate} to {endDate} ({phases.filter(p => p.name).length} phases)</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Stakeholders</span>
                <p className="text-sm" data-testid="text-review-stakeholders">{stakeholders.filter(s => s.name).length} team members</p>
              </div>
              {selectedGrants.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Grant Alignment</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedGrants.map(g => <Badge key={g} variant="outline" data-testid={`badge-review-grant-${g}`}>{GRANT_OPTIONS.find(o => o.id === g)?.label}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between gap-2">
        {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} data-testid="button-wizard-prev">Previous</Button>}
        <div className="ml-auto">
          {step < 6 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} data-testid="button-wizard-next">Next</Button>
          ) : (
            <Button onClick={handleLaunch} disabled={createMutation.isPending} data-testid="button-wizard-launch">
              {createMutation.isPending ? "Launching..." : "Launch Program"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function WhyThisApproach({ title, explanation, links }: { title: string; explanation: string; links: { label: string; url: string }[] }) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid={`button-why-${title.toLowerCase().replace(/\s/g, '-')}`}>
          <ChevronDown className="h-3 w-3 mr-1" /> Why this approach?
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-muted/50 rounded-md p-3 mt-2 space-y-2">
          <p className="text-sm text-muted-foreground">{explanation}</p>
          <div className="flex flex-wrap gap-2">
            {links.map(l => (
              <a key={l.url} href={l.url} className="text-xs text-primary flex items-center gap-1" data-testid={`link-ref-${l.label.toLowerCase().replace(/\s/g, '-')}`}>
                <ExternalLink className="h-3 w-3" /> {l.label}
              </a>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function OverviewTab({ program, health }: { program: ProgramDetail; health: HealthData | undefined }) {
  const timeline = program.timeline as any;
  const phases = timeline?.phases || [];
  const now = new Date();

  const statusCards = [
    { label: "Total Milestones", value: health?.milestones.total ?? 0, icon: Target, color: "text-foreground" },
    { label: "On Track", value: (health?.milestones.completed ?? 0) + (health?.milestones.inProgress ?? 0), icon: Check, color: "text-green-600 dark:text-green-400" },
    { label: "At Risk", value: health?.milestones.atRisk ?? 0, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
    { label: "Overdue", value: health?.milestones.overdue ?? 0, icon: Flame, color: "text-red-600 dark:text-red-400" },
    { label: "Completed", value: health?.milestones.completed ?? 0, icon: Check, color: "text-primary" },
  ];

  return (
    <div className="space-y-6" data-testid="tab-overview">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <Eye className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium" data-testid="text-cop-banner">Everyone sees this same dashboard — Common Operating Picture</span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-4xl font-bold" data-testid="text-health-score">{health?.healthScore ?? 100}</p>
            <p className="text-xs text-muted-foreground mt-1">Health Score</p>
          </CardContent>
        </Card>
        {statusCards.map(sc => (
          <Card key={sc.label}>
            <CardContent className="p-4 text-center">
              <sc.icon className={`h-5 w-5 mx-auto mb-1 ${sc.color}`} />
              <p className="text-2xl font-bold" data-testid={`text-stat-${sc.label.toLowerCase().replace(/\s/g, '-')}`}>{sc.value}</p>
              <p className="text-xs text-muted-foreground">{sc.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Phase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-semibold" data-testid="text-current-phase">{health?.currentPhase ?? "Not Set"}</p>
            {phases.length > 0 && (
              <div className="space-y-2">
                {phases.map((p: any, i: number) => {
                  const pStart = p.startDate ? new Date(p.startDate) : null;
                  const pEnd = p.endDate ? new Date(p.endDate) : null;
                  const isActive = pStart && pEnd && now >= pStart && now <= pEnd;
                  const isPast = pEnd && now > pEnd;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${isActive ? "bg-primary" : isPast ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                      <span className={`text-sm ${isActive ? "font-semibold" : ""}`} data-testid={`text-phase-${i}`}>{p.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold" data-testid="text-active-risks">{health?.risks.active ?? 0}</p>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <span data-testid="text-high-risks">High: {health?.risks.high ?? 0}</span>
              <span data-testid="text-resolved-risks">Resolved: {health?.risks.resolved ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {program.grantIds && (program.grantIds as string[]).map((g: string) => (
          <Badge key={g} variant="outline" data-testid={`badge-grant-align-${g}`}>
            {GRANT_OPTIONS.find(o => o.id === g)?.label ?? g}
          </Badge>
        ))}
        <Badge variant="secondary" data-testid="badge-methodology">
          {program.methodology === "implementation_science" ? "Implementation Science" : program.methodology === "traditional" ? "Traditional PM" : "Hybrid"}
        </Badge>
      </div>

      {program.methodology === "traditional" && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Microscope className="h-4 w-4" /> Implementation Science Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground" data-testid="text-is-underlayer">
              Behind the scenes, your program's reach is being tracked using RE-AIM Reach metrics. Your fidelity score maps to SALP indicators. All data is structured for evidence-based reporting even in traditional PM mode.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MilestonesTab({ program, milestones }: { program: ProgramDetail; milestones: ProgramMilestone[] }) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPhase, setNewPhase] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/programs/${program.id}/milestones`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id, "health"] });
      setShowAdd(false);
      setNewTitle("");
      setNewPhase("");
      setNewAssignee("");
      setNewDue("");
      setNewDescription("");
      toast({ title: "Milestone added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ milestoneId, data }: { milestoneId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/programs/${program.id}/milestones/${milestoneId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id, "health"] });
    },
  });

  const timeline = program.timeline as any;
  const phases = timeline?.phases || [];
  const phaseNames = phases.map((p: any) => p.name);
  const groupedByPhase = useMemo(() => {
    const groups: Record<string, ProgramMilestone[]> = {};
    for (const m of milestones) {
      const key = m.phase || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return groups;
  }, [milestones]);

  const dueThisWeek = milestones.filter(m => {
    if (!m.dueDate || m.status === "completed") return false;
    const due = new Date(m.dueDate);
    const wk = new Date();
    wk.setDate(wk.getDate() + 7);
    return due >= new Date() && due <= wk;
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "at_risk": return "destructive";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  const daysOverdue = (d: Date | string | null) => {
    if (!d) return 0;
    const diff = Math.floor((new Date().getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-4" data-testid="tab-milestones">
      {dueThisWeek.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 flex items-center gap-2 flex-wrap">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium" data-testid="text-due-this-week">{dueThisWeek.length} milestone{dueThisWeek.length > 1 ? "s" : ""} due this week</span>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold">Milestones & Deliverables</h3>
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-milestone"><Plus className="h-4 w-4 mr-1" /> Add Milestone</Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Milestone title" data-testid="input-new-milestone-title" />
            <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Description" data-testid="input-new-milestone-desc" />
            <div className="grid grid-cols-3 gap-2">
              <Select value={newPhase} onValueChange={setNewPhase}>
                <SelectTrigger data-testid="select-milestone-phase"><SelectValue placeholder="Phase" /></SelectTrigger>
                <SelectContent>
                  {phaseNames.map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
              <Input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="Assignee" data-testid="input-milestone-assignee" />
              <Input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} data-testid="input-milestone-due" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate({ title: newTitle, description: newDescription, phase: newPhase || undefined, assignee: newAssignee || undefined, dueDate: newDue ? new Date(newDue).toISOString() : undefined })} disabled={!newTitle || addMutation.isPending} data-testid="button-save-milestone">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} data-testid="button-cancel-milestone">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedByPhase).map(([phase, items]) => (
        <div key={phase} className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground" data-testid={`text-phase-group-${phase}`}>{phase}</h4>
          {items.map(m => {
            const isOverdue = m.dueDate && new Date(m.dueDate) < new Date() && m.status !== "completed";
            const overdueDays = isOverdue ? daysOverdue(m.dueDate) : 0;
            return (
              <Card key={m.id} className={isOverdue ? "border-red-500/50" : ""} data-testid={`card-milestone-${m.id}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" data-testid={`text-milestone-title-${m.id}`}>{m.title}</p>
                      {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                    </div>
                    <Badge variant={statusColor(m.status)} data-testid={`badge-milestone-status-${m.id}`}>{m.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {m.assignee && <span data-testid={`text-milestone-assignee-${m.id}`}>{m.assignee}</span>}
                    {m.dueDate && <span data-testid={`text-milestone-due-${m.id}`}>Due: {new Date(m.dueDate).toLocaleDateString()}</span>}
                    {isOverdue && <span className="text-red-600 dark:text-red-400 font-medium" data-testid={`text-milestone-overdue-${m.id}`}>{overdueDays} days overdue</span>}
                  </div>
                  {m.deliverables && (m.deliverables as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(m.deliverables as string[]).map((d, i) => <Badge key={i} variant="outline" className="text-xs">{d}</Badge>)}
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {m.status !== "in_progress" && m.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ milestoneId: m.id, data: { status: "in_progress" } })} data-testid={`button-milestone-progress-${m.id}`}>
                        <Activity className="h-3 w-3 mr-1" /> In Progress
                      </Button>
                    )}
                    {m.status !== "at_risk" && m.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ milestoneId: m.id, data: { status: "at_risk" } })} data-testid={`button-milestone-risk-${m.id}`}>
                        <AlertTriangle className="h-3 w-3 mr-1" /> At Risk
                      </Button>
                    )}
                    {m.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ milestoneId: m.id, data: { status: "completed" } })} data-testid={`button-milestone-complete-${m.id}`}>
                        <Check className="h-3 w-3 mr-1" /> Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}

      {milestones.length === 0 && (
        <p className="text-center text-muted-foreground py-8" data-testid="text-no-milestones">No milestones yet. Add your first milestone to get started.</p>
      )}
    </div>
  );
}

function RisksTab({ program, risks }: { program: ProgramDetail; risks: ProgramRisk[] }) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [rTitle, setRTitle] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [rLikelihood, setRLikelihood] = useState("medium");
  const [rImpact, setRImpact] = useState("medium");
  const [rMitigation, setRMitigation] = useState("");
  const [rOwner, setROwner] = useState("");

  const addRiskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/programs/${program.id}/risks`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id, "health"] });
      setShowAdd(false);
      setRTitle(""); setRDesc(""); setRMitigation(""); setROwner("");
      toast({ title: "Risk added" });
    },
  });

  const updateRiskMutation = useMutation({
    mutationFn: async ({ riskId, data }: { riskId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/programs/${program.id}/risks/${riskId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id, "health"] });
    },
  });

  const activeRisks = risks.filter(r => r.status !== "resolved");
  const resolvedRisks = risks.filter(r => r.status === "resolved");

  const heatMapCells = useMemo(() => {
    const levels = ["low", "medium", "high"] as const;
    const grid: Record<string, number> = {};
    for (const l of levels) for (const i of levels) grid[`${l}-${i}`] = 0;
    for (const r of activeRisks) grid[`${r.likelihood}-${r.impact}`] = (grid[`${r.likelihood}-${r.impact}`] || 0) + 1;
    return { levels, grid };
  }, [activeRisks]);

  const cellColor = (l: string, i: string) => {
    const score = ({ low: 1, medium: 2, high: 3 } as any)[l] * ({ low: 1, medium: 2, high: 3 } as any)[i];
    if (score >= 6) return "bg-red-500/20 dark:bg-red-500/30";
    if (score >= 3) return "bg-amber-500/20 dark:bg-amber-500/30";
    return "bg-green-500/20 dark:bg-green-500/30";
  };

  return (
    <div className="space-y-4" data-testid="tab-risks">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-semibold">Risk Register</h3>
          <p className="text-sm text-muted-foreground">Active: {activeRisks.length} | Resolved: {resolvedRisks.length}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-risk"><Plus className="h-4 w-4 mr-1" /> Add Risk</Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder="Risk title" data-testid="input-risk-title" />
            <Textarea value={rDesc} onChange={e => setRDesc(e.target.value)} placeholder="Description" data-testid="input-risk-desc" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={rLikelihood} onValueChange={setRLikelihood}>
                <SelectTrigger data-testid="select-risk-likelihood"><SelectValue placeholder="Likelihood" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rImpact} onValueChange={setRImpact}>
                <SelectTrigger data-testid="select-risk-impact"><SelectValue placeholder="Impact" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea value={rMitigation} onChange={e => setRMitigation(e.target.value)} placeholder="Mitigation strategy" data-testid="input-risk-mitigation" />
            <Input value={rOwner} onChange={e => setROwner(e.target.value)} placeholder="Risk owner" data-testid="input-risk-owner" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addRiskMutation.mutate({ title: rTitle, description: rDesc, likelihood: rLikelihood, impact: rImpact, mitigation: rMitigation || undefined, owner: rOwner || undefined })} disabled={!rTitle || addRiskMutation.isPending} data-testid="button-save-risk">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} data-testid="button-cancel-risk">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Risk Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-1 max-w-xs" data-testid="grid-risk-heatmap">
            <div />
            {heatMapCells.levels.map(i => <div key={i} className="text-center text-xs text-muted-foreground capitalize font-medium">{i}</div>)}
            {[...heatMapCells.levels].reverse().map(l => (
              <>
                <div key={`label-${l}`} className="text-xs text-muted-foreground capitalize font-medium flex items-center">{l}</div>
                {heatMapCells.levels.map(i => (
                  <div key={`${l}-${i}`} className={`rounded-md p-2 text-center text-sm font-medium ${cellColor(l, i)}`} data-testid={`cell-risk-${l}-${i}`}>
                    {heatMapCells.grid[`${l}-${i}`] || ""}
                  </div>
                ))}
              </>
            ))}
          </div>
          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
            <span>Likelihood (rows)</span>
            <span>Impact (columns)</span>
          </div>
        </CardContent>
      </Card>

      {risks.map(r => (
        <Card key={r.id} data-testid={`card-risk-${r.id}`}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="font-medium" data-testid={`text-risk-title-${r.id}`}>{r.title}</p>
              <Badge variant={r.status === "resolved" ? "default" : r.status === "mitigating" ? "secondary" : "outline"} data-testid={`badge-risk-status-${r.id}`}>{r.status}</Badge>
            </div>
            {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
            <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
              <span data-testid={`text-risk-likelihood-${r.id}`}>Likelihood: {r.likelihood}</span>
              <span data-testid={`text-risk-impact-${r.id}`}>Impact: {r.impact}</span>
              {r.owner && <span>Owner: {r.owner}</span>}
            </div>
            {r.mitigation && <p className="text-sm"><span className="font-medium">Mitigation:</span> {r.mitigation}</p>}
            {r.status !== "resolved" && (
              <div className="flex gap-1 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => updateRiskMutation.mutate({ riskId: r.id, data: { status: "mitigating" } })} data-testid={`button-risk-mitigate-${r.id}`}>Mitigating</Button>
                <Button size="sm" variant="outline" onClick={() => updateRiskMutation.mutate({ riskId: r.id, data: { status: "resolved" } })} data-testid={`button-risk-resolve-${r.id}`}>Resolve</Button>
                <Button size="sm" variant="outline" onClick={() => updateRiskMutation.mutate({ riskId: r.id, data: { status: "accepted" } })} data-testid={`button-risk-accept-${r.id}`}>Accept</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {risks.length === 0 && (
        <p className="text-center text-muted-foreground py-8" data-testid="text-no-risks">No risks identified yet.</p>
      )}
    </div>
  );
}

function UpdatesTab({ program, updates }: { program: ProgramDetail; updates: ProgramUpdate[] }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("status");
  const [newAuthor, setNewAuthor] = useState("");

  const addUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/programs/${program.id}/updates`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", program.id] });
      setNewContent("");
      setNewAuthor("");
      toast({ title: "Update posted" });
    },
  });

  const filtered = filter === "all" ? updates : updates.filter(u => u.updateType === filter);

  const typeIcon = (t: string) => {
    switch (t) {
      case "status": return <Activity className="h-4 w-4" />;
      case "risk": return <Shield className="h-4 w-4" />;
      case "milestone": return <Target className="h-4 w-4" />;
      case "decision": return <Zap className="h-4 w-4" />;
      case "blocker": return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4" data-testid="tab-updates">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger data-testid="select-update-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status Update</SelectItem>
                <SelectItem value="risk">Risk Note</SelectItem>
                <SelectItem value="milestone">Milestone Note</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
                <SelectItem value="blocker">Blocker</SelectItem>
              </SelectContent>
            </Select>
            <Input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder="Your name" data-testid="input-update-author" />
          </div>
          <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="What's the update?" data-testid="input-update-content" />
          <Button size="sm" onClick={() => addUpdateMutation.mutate({ authorName: newAuthor || "Anonymous", updateType: newType, content: newContent })} disabled={!newContent || addUpdateMutation.isPending} data-testid="button-post-update">Post Update</Button>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {["all", "status", "risk", "milestone", "decision", "blocker"].map(t => (
          <Badge
            key={t}
            variant={filter === t ? "default" : "outline"}
            className="cursor-pointer toggle-elevate"
            onClick={() => setFilter(t)}
            data-testid={`badge-filter-${t}`}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </Badge>
        ))}
      </div>

      {filtered.map(u => (
        <Card key={u.id} data-testid={`card-update-${u.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">{typeIcon(u.updateType)}</div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm" data-testid={`text-update-author-${u.id}`}>{u.authorName}</span>
                  <Badge variant="outline" className="text-xs">{u.updateType}</Badge>
                  <span className="text-xs text-muted-foreground" data-testid={`text-update-time-${u.id}`}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</span>
                </div>
                <p className="text-sm" data-testid={`text-update-content-${u.id}`}>{u.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8" data-testid="text-no-updates">No updates yet.</p>
      )}
    </div>
  );
}

function ReferencesTab({ methodology }: { methodology: string }) {
  const isRefs = [
    { title: "CFIR Assessment", description: "Assess implementation determinants using the Consolidated Framework for Implementation Research", url: "/rplice-tools", icon: Microscope },
    { title: "RE-AIM Scorecard", description: "Evaluate Reach, Effectiveness, Adoption, Implementation, and Maintenance", url: "/rplice-tools", icon: BarChart3 },
    { title: "MAP-GAP CQI", description: "Continuous Quality Improvement using the MAP-GAP framework", url: "/cqi", icon: RefreshCw },
    { title: "Fidelity Checklist", description: "Measure program delivery fidelity against evidence-based standards", url: "/rplice-tools", icon: FileText },
    { title: "PM Academy: Implementation Science Track", description: "Training modules on implementation science frameworks and methods", url: "/pm-academy", icon: GraduationCap },
  ];

  const pmRefs = [
    { title: "PM Academy: PM Essentials", description: "Core project management principles: IPEMC process groups", url: "/pm-academy", icon: GraduationCap },
    { title: "PM Academy: PM Professional Track", description: "Advanced PM concepts: triple constraint, RAID, scheduling", url: "/pm-academy", icon: BookOpen },
    { title: "Program Management Hub", description: "Full program management dashboard and tools", url: "/program-management", icon: Briefcase },
  ];

  const refs = methodology === "implementation_science" ? isRefs : methodology === "traditional" ? pmRefs : [...isRefs, ...pmRefs];

  const phaseChecklist: Record<string, string[]> = {
    "Setup / Initiation": ["Program charter approved", "Stakeholders identified and engaged", "Baseline data collected", "Methodology selected"],
    "Planning": ["Milestones defined with due dates", "Risk register initialized", "Success criteria measurable", "Resource allocation confirmed"],
    "Active / Execution": ["Regular status updates posted", "Milestone tracking active", "Risk mitigation in progress", "Deliverables on schedule"],
    "Monitoring & Control": ["Health score reviewed weekly", "Variance analysis completed", "Corrective actions documented", "Stakeholder reports distributed"],
    "Closeout": ["All milestones completed or accounted for", "Lessons learned documented", "Final outcomes report generated", "Stakeholder sign-off obtained"],
  };

  return (
    <div className="space-y-6" data-testid="tab-references">
      <div>
        <h3 className="font-semibold mb-3">Grounded References for {methodology === "implementation_science" ? "Implementation Science" : methodology === "traditional" ? "Traditional PM" : "Hybrid"} Approach</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {refs.map(r => (
            <Card key={r.title} className="hover-elevate" data-testid={`card-ref-${r.title.toLowerCase().replace(/\s/g, '-')}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <r.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <a href={r.url} className="font-medium text-sm flex items-center gap-1" data-testid={`link-ref-${r.title.toLowerCase().replace(/\s/g, '-')}`}>
                    {r.title} <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">What does "done" look like for each phase?</h3>
        <div className="space-y-3">
          {Object.entries(phaseChecklist).map(([phase, items]) => (
            <Card key={phase} data-testid={`card-phase-checklist-${phase.toLowerCase().replace(/\s/g, '-')}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{phase}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutionDashboard({ programId, onBack }: { programId: number; onBack: () => void }) {
  const { data: program, isLoading } = useQuery<ProgramDetail>({
    queryKey: ["/api/programs", programId],
  });

  const { data: health } = useQuery<HealthData>({
    queryKey: ["/api/programs", programId, "health"],
  });

  if (isLoading || !program) {
    return (
      <div className="space-y-4" data-testid="loading-dashboard">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="execution-dashboard">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-dashboard-back">
          <ArrowLeft />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate" data-testid="text-program-title">{program.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" data-testid="badge-program-status">{program.status}</Badge>
            <Badge variant="outline" data-testid="badge-program-methodology">
              {program.methodology === "implementation_science" ? "Implementation Science" : program.methodology === "traditional" ? "Traditional PM" : "Hybrid"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap" data-testid="tabs-dashboard">
          <TabsTrigger value="overview" data-testid="tab-trigger-overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones" data-testid="tab-trigger-milestones">Milestones</TabsTrigger>
          <TabsTrigger value="risks" data-testid="tab-trigger-risks">Risks</TabsTrigger>
          <TabsTrigger value="updates" data-testid="tab-trigger-updates">Updates</TabsTrigger>
          <TabsTrigger value="references" data-testid="tab-trigger-references">References</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab program={program} health={health} />
        </TabsContent>
        <TabsContent value="milestones">
          <MilestonesTab program={program} milestones={program.milestones} />
        </TabsContent>
        <TabsContent value="risks">
          <RisksTab program={program} risks={program.risks} />
        </TabsContent>
        <TabsContent value="updates">
          <UpdatesTab program={program} updates={program.updates} />
        </TabsContent>
        <TabsContent value="references">
          <ReferencesTab methodology={program.methodology} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProgramList({ onSelect, onNew }: { onSelect: (id: number) => void; onNew: () => void }) {
  const { data: programs, isLoading } = useQuery<ProgramWithSummary[]>({
    queryKey: ["/api/programs"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loading-programs">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="program-list">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Program Execution Engine</h1>
          <p className="text-muted-foreground">Launch, manage, and monitor programs with real-time common operating picture</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrainingGuideButton moduleId="program-engine" />
          <Button onClick={onNew} data-testid="button-new-program">
            <Plus className="h-4 w-4 mr-1" /> Start New Program
          </Button>
        </div>
      </div>

      {(!programs || programs.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium" data-testid="text-empty-state">No programs yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first program to get started with the execution engine.</p>
            <Button onClick={onNew} data-testid="button-empty-new-program"><Plus className="h-4 w-4 mr-1" /> Start New Program</Button>
          </CardContent>
        </Card>
      )}

      {programs && programs.map(p => (
        <Card key={p.id} className="hover-elevate cursor-pointer" onClick={() => onSelect(p.id)} data-testid={`card-program-${p.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="font-semibold" data-testid={`text-program-name-${p.id}`}>{p.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" data-testid={`badge-program-status-${p.id}`}>{p.status}</Badge>
                  <Badge variant="outline" data-testid={`badge-program-method-${p.id}`}>
                    {p.methodology === "implementation_science" ? "IS" : p.methodology === "traditional" ? "PM" : "Hybrid"}
                  </Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold" data-testid={`text-program-health-${p.id}`}>{p._summary.healthScore}</p>
                <p className="text-xs text-muted-foreground">Health</p>
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{p._summary.completed}/{p._summary.total} done</span>
                  {p._summary.atRisk > 0 && <span className="text-amber-600 dark:text-amber-400">{p._summary.atRisk} at risk</span>}
                  {p._summary.overdue > 0 && <span className="text-red-600 dark:text-red-400">{p._summary.overdue} overdue</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProgramEnginePage() {
  const [view, setView] = useState<"list" | "wizard" | "dashboard">("list");
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <SectionTutorial {...SECTION_TUTORIALS["program-engine"]} />
      {view === "list" && (
        <ProgramList
          onSelect={(id) => { setSelectedProgramId(id); setView("dashboard"); }}
          onNew={() => setView("wizard")}
        />
      )}
      {view === "wizard" && (
        <SetupWizard onComplete={() => setView("list")} />
      )}
      {view === "dashboard" && selectedProgramId && (
        <ExecutionDashboard
          programId={selectedProgramId}
          onBack={() => { setSelectedProgramId(null); setView("list"); }}
        />
      )}
    </div>
  );
}
