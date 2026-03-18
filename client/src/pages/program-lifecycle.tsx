import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Search, Target, Pencil, Cog, BarChart3, RefreshCw,
  ArrowRight, CheckCircle2, AlertTriangle, Clock, Activity,
  Users, Shield, Briefcase, Scale, Heart, ChevronDown, ChevronUp,
  Layers, Eye, TrendingUp, Zap, Calendar,
} from "lucide-react";

type LifecycleStage = "discovery" | "assessment" | "design" | "implementation" | "measurement" | "improvement";

interface ProgramCard {
  id: string;
  name: string;
  grantAlignment: string;
  stage: LifecycleStage;
  fidelityScore: number;
  nextMilestone: string;
  nextMilestoneDate: string;
  owner: string;
  description: string;
  daysInStage: number;
  riskLevel: "low" | "medium" | "high";
  participants: number;
  completedTasks: number;
  totalTasks: number;
}

const STAGES: Array<{
  id: LifecycleStage;
  label: string;
  subtitle: string;
  icon: typeof Search;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
}> = [
  {
    id: "discovery",
    label: "Discovery",
    subtitle: "We Plan",
    icon: Search,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "assessment",
    label: "Assessment",
    subtitle: "We Plan",
    icon: Target,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    id: "design",
    label: "Design",
    subtitle: "We Coordinate",
    icon: Pencil,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    id: "implementation",
    label: "Implementation",
    subtitle: "We Build",
    icon: Cog,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    id: "measurement",
    label: "Measurement",
    subtitle: "We Measure",
    icon: BarChart3,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
  {
    id: "improvement",
    label: "Improvement",
    subtitle: "We Measure",
    icon: RefreshCw,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
];

const PROGRAMS: ProgramCard[] = [
  {
    id: "prog-1",
    name: "DFC Substance Use Prevention",
    grantAlignment: "CDC/ONDCP Drug-Free Communities",
    stage: "implementation",
    fidelityScore: 4.2,
    nextMilestone: "Q2 Semi-Annual Report Submission",
    nextMilestoneDate: "2025-06-30",
    owner: "Prevention Team",
    description: "12-sector coalition delivering evidence-based prevention curricula across 4 school districts with SALP fidelity monitoring.",
    daysInStage: 127,
    riskLevel: "low",
    participants: 342,
    completedTasks: 18,
    totalTasks: 24,
  },
  {
    id: "prog-2",
    name: "Workforce Reentry Pathways",
    grantAlignment: "DOL WIOA Title I / Second Chance Act",
    stage: "measurement",
    fidelityScore: 3.8,
    nextMilestone: "90-Day Retention Data Collection",
    nextMilestoneDate: "2025-07-15",
    owner: "Workforce Development Team",
    description: "Career assessment, digital skills training, and employer partnerships for justice-involved individuals with 90-day retention tracking.",
    daysInStage: 45,
    riskLevel: "medium",
    participants: 89,
    completedTasks: 14,
    totalTasks: 20,
  },
  {
    id: "prog-3",
    name: "Youth Mentorship & SEL Program",
    grantAlignment: "OJJDP Title II / SAMHSA",
    stage: "design",
    fidelityScore: 0,
    nextMilestone: "Logic Model Validation with Stakeholders",
    nextMilestoneDate: "2025-05-20",
    owner: "Youth Services Coordinator",
    description: "Peer-led mentorship with integrated SEL curriculum targeting at-risk youth ages 12-18 in underserved communities.",
    daysInStage: 22,
    riskLevel: "low",
    participants: 0,
    completedTasks: 7,
    totalTasks: 15,
  },
  {
    id: "prog-4",
    name: "Community Health Worker Pipeline",
    grantAlignment: "HRSA Community Health Worker Training",
    stage: "assessment",
    fidelityScore: 0,
    nextMilestone: "Community Needs Assessment Completion",
    nextMilestoneDate: "2025-05-30",
    owner: "Health Equity Team",
    description: "Training pipeline for CHWs serving rural and underserved communities with competency-based certification and placement.",
    daysInStage: 14,
    riskLevel: "low",
    participants: 0,
    completedTasks: 3,
    totalTasks: 10,
  },
  {
    id: "prog-5",
    name: "Coalition Building Initiative",
    grantAlignment: "SAMHSA Strategic Prevention Framework",
    stage: "improvement",
    fidelityScore: 3.5,
    nextMilestone: "CQI Cycle Review & Sector Gap Analysis",
    nextMilestoneDate: "2025-06-15",
    owner: "Coalition Coordinator",
    description: "12-sector coalition with quarterly engagement tracking, shared SMART goals, and transparent stakeholder dashboards.",
    daysInStage: 30,
    riskLevel: "high",
    participants: 156,
    completedTasks: 22,
    totalTasks: 28,
  },
  {
    id: "prog-6",
    name: "Parent Education & Family Support",
    grantAlignment: "Title IV-E / CBCAP",
    stage: "implementation",
    fidelityScore: 4.0,
    nextMilestone: "Family Assessment Cycle 3 Completion",
    nextMilestoneDate: "2025-06-01",
    owner: "Family Services Team",
    description: "6-module parent education program with family assessments, community resource linkage, and longitudinal tracking.",
    daysInStage: 68,
    riskLevel: "low",
    participants: 124,
    completedTasks: 12,
    totalTasks: 18,
  },
  {
    id: "prog-7",
    name: "Digital Equity & Access Program",
    grantAlignment: "NTIA Digital Equity Act",
    stage: "discovery",
    fidelityScore: 0,
    nextMilestone: "Broadband Gap Survey Deployment",
    nextMilestoneDate: "2025-05-25",
    owner: "Technology Access Team",
    description: "Mapping digital divide in target communities, identifying broadband gaps, and designing device access plus digital literacy programming.",
    daysInStage: 8,
    riskLevel: "low",
    participants: 0,
    completedTasks: 2,
    totalTasks: 8,
  },
  {
    id: "prog-8",
    name: "Recidivism Reduction Pilot",
    grantAlignment: "BJA Second Chance Act",
    stage: "discovery",
    fidelityScore: 0,
    nextMilestone: "RNR Assessment Tool Selection",
    nextMilestoneDate: "2025-06-10",
    owner: "Reentry Services Team",
    description: "Risk-Needs-Responsivity driven reentry program with housing linkage, cognitive-behavioral interventions, and 12-month tracking.",
    daysInStage: 5,
    riskLevel: "low",
    participants: 0,
    completedTasks: 1,
    totalTasks: 12,
  },
];

function getRiskConfig(risk: string) {
  switch (risk) {
    case "low": return { label: "Low Risk", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 };
    case "medium": return { label: "Medium Risk", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle };
    case "high": return { label: "High Risk", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle };
    default: return { label: "Unknown", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock };
  }
}

function ProgramCardComponent({ program, stageConfig }: { program: ProgramCard; stageConfig: typeof STAGES[0] }) {
  const [expanded, setExpanded] = useState(false);
  const riskConfig = getRiskConfig(program.riskLevel);
  const RiskIcon = riskConfig.icon;
  const taskProgress = program.totalTasks > 0 ? Math.round((program.completedTasks / program.totalTasks) * 100) : 0;
  const daysRemaining = Math.max(0, Math.ceil((new Date(program.nextMilestoneDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <Card
      className="hover-elevate cursor-pointer transition-all"
      onClick={() => setExpanded(!expanded)}
      data-testid={`card-program-${program.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold leading-tight">{program.name}</h4>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${riskConfig.className}`}>
            <RiskIcon className="h-3 w-3" />
            {riskConfig.label}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground mb-2 leading-snug">{program.grantAlignment}</p>

        {program.fidelityScore > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-muted-foreground">Fidelity:</span>
            <span className="text-xs font-bold">{program.fidelityScore}/5</span>
            <div className="flex-1">
              <div className="h-1.5 bg-muted rounded-full">
                <div
                  className={`h-1.5 rounded-full ${program.fidelityScore >= 4 ? "bg-emerald-500" : program.fidelityScore >= 3 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${(program.fidelityScore / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-muted-foreground">Tasks:</span>
          <div className="flex-1">
            <Progress value={taskProgress} className="h-1.5" />
          </div>
          <span className="text-[10px] font-medium">{program.completedTasks}/{program.totalTasks}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{program.nextMilestone}</span>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground leading-relaxed">{program.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3 shrink-0" />
                <span>{program.participants} participants</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{daysRemaining}d to milestone</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Activity className="h-3 w-3 shrink-0" />
                <span>{program.daysInStage}d in stage</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Briefcase className="h-3 w-3 shrink-0" />
                <span>{program.owner}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-1">
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

function StageColumn({ stage, programs }: { stage: typeof STAGES[0]; programs: ProgramCard[] }) {
  const Icon = stage.icon;
  return (
    <div
      className={`flex flex-col rounded-md border ${stage.borderColor} ${stage.bgColor} min-w-[260px] max-w-[320px] flex-1`}
      data-testid={`column-stage-${stage.id}`}
    >
      <div className="p-3 border-b flex items-center gap-2">
        <div className={`rounded-md p-1.5 bg-background border`}>
          <Icon className={`h-4 w-4 ${stage.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">{stage.label}</h3>
          <p className="text-[10px] text-muted-foreground">{stage.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">{programs.length}</Badge>
      </div>
      <div className="p-2 space-y-2 flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
        {programs.map((program) => (
          <ProgramCardComponent key={program.id} program={program} stageConfig={stage} />
        ))}
        {programs.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No programs in this stage
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineOverview() {
  const stageCount = STAGES.map(s => ({
    ...s,
    count: PROGRAMS.filter(p => p.stage === s.id).length,
  }));
  const totalPrograms = PROGRAMS.length;
  const avgFidelity = PROGRAMS.filter(p => p.fidelityScore > 0).reduce((sum, p) => sum + p.fidelityScore, 0) / (PROGRAMS.filter(p => p.fidelityScore > 0).length || 1);
  const totalParticipants = PROGRAMS.reduce((sum, p) => sum + p.participants, 0);
  const atRiskCount = PROGRAMS.filter(p => p.riskLevel === "high" || p.riskLevel === "medium").length;

  return (
    <div className="space-y-4" data-testid="section-pipeline-overview">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-programs">{totalPrograms}</p>
                <p className="text-sm text-muted-foreground">Total Programs</p>
              </div>
              <Layers className="h-8 w-8 text-blue-500 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold" data-testid="text-avg-fidelity">{avgFidelity.toFixed(1)}/5</p>
                <p className="text-sm text-muted-foreground">Avg Fidelity</p>
              </div>
              <Activity className="h-8 w-8 text-emerald-500 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-participants">{totalParticipants.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
              <Users className="h-8 w-8 text-violet-500 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold" data-testid="text-at-risk-count">{atRiskCount}</p>
                <p className="text-sm text-muted-foreground">At Risk</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {stageCount.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${s.bgColor} border ${s.borderColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                    <span className="text-xs font-medium">{s.label}</span>
                    <Badge variant="outline" className="text-[10px] ml-1">{s.count}</Badge>
                  </div>
                  {idx < stageCount.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LifecyclePhilosophy() {
  const phases = [
    { label: "We Plan", stages: ["Discovery", "Assessment"], icon: Eye, color: "text-blue-600 dark:text-blue-400" },
    { label: "We Coordinate", stages: ["Design"], icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "We Build", stages: ["Implementation"], icon: Cog, color: "text-amber-600 dark:text-amber-400" },
    { label: "We Measure", stages: ["Measurement", "Improvement"], icon: BarChart3, color: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <Card data-testid="card-lifecycle-philosophy">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="h-5 w-5 text-primary" />
          MAP-GAP Program Lifecycle
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Every program flows through the MAP-GAP cycle — continuous assessment, adaptation, and improvement. The system never stops.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {phases.map((phase) => {
            const Icon = phase.icon;
            return (
              <div key={phase.label} className="text-center p-4 rounded-md bg-muted">
                <Icon className={`h-6 w-6 mx-auto mb-2 ${phase.color}`} />
                <p className="text-sm font-bold">{phase.label}</p>
                <div className="flex flex-col gap-0.5 mt-1">
                  {phase.stages.map((s) => (
                    <span key={s} className="text-[10px] text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
          <Link href="/mapgap-framework">
            <Button variant="outline" size="sm" data-testid="button-link-mapgap">
              <RefreshCw className="mr-2 h-4 w-4" /> MAP-GAP Framework
            </Button>
          </Link>
          <Link href="/transparency">
            <Button variant="outline" size="sm" data-testid="button-link-transparency">
              <Eye className="mr-2 h-4 w-4" /> Transparency Dashboard
            </Button>
          </Link>
          <Link href="/cqi">
            <Button variant="outline" size="sm" data-testid="button-link-cqi">
              <Activity className="mr-2 h-4 w-4" /> MAP-GAP CQI
            </Button>
          </Link>
          <Link href="/program-management">
            <Button variant="outline" size="sm" data-testid="button-link-program-mgmt">
              <Briefcase className="mr-2 h-4 w-4" /> Program Management
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProgramLifecyclePage() {
  const [filterRisk, setFilterRisk] = useState<string>("all");

  const filteredPrograms = filterRisk === "all"
    ? PROGRAMS
    : PROGRAMS.filter(p => p.riskLevel === filterRisk);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Layers className="h-6 w-6 text-primary" />
          Program Lifecycle Pipeline
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          We Plan. We Coordinate. We Build. We Measure. — Track every program through the MAP-GAP lifecycle.
        </p>
      </div>

      <PipelineOverview />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Pipeline Board
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filter:</span>
          {["all", "low", "medium", "high"].map((risk) => (
            <Button
              key={risk}
              variant={filterRisk === risk ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRisk(risk)}
              data-testid={`button-filter-${risk}`}
              className="toggle-elevate"
            >
              {risk === "all" ? "All" : `${risk.charAt(0).toUpperCase() + risk.slice(1)} Risk`}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="section-pipeline-board">
        {STAGES.map((stage) => {
          const stagePrograms = filteredPrograms.filter(p => p.stage === stage.id);
          return (
            <StageColumn key={stage.id} stage={stage} programs={stagePrograms} />
          );
        })}
      </div>

      <LifecyclePhilosophy />
    </div>
  );
}
