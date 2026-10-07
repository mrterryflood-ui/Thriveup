import { useState, useMemo } from "react";
import { TrainingGuideButton } from "@/components/training-guide";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Layers, Briefcase, Shield, Heart, Globe,
  Activity, FileText, Lightbulb, Zap, BarChart3,
  ChevronRight, ChevronDown, RefreshCw, Handshake,
  CheckCircle2, AlertTriangle, Clock, Target,
  ArrowRight, Users, Building2, Scale, Brain,
  Microscope, MapPin, ClipboardCheck, BookOpen,
  Rocket, Eye, TrendingUp, Wrench,
} from "lucide-react";

interface EcosystemPlatform {
  id: string;
  name: string;
  shortName: string;
  icon: typeof Target;
  color: string;
  role: string;
}

const ECOSYSTEM_PLATFORMS: EcosystemPlatform[] = [
  { id: "thriveup", name: "ThriveUp", shortName: "ThriveUp", icon: Rocket, color: "text-violet-600", role: "Central coordination hub — curriculum, workforce, engagement, case management" },
  { id: "incubator", name: "The Incubator", shortName: "Incubator", icon: Lightbulb, color: "text-amber-600", role: "Grant discovery, opportunity scoring, SAM.gov scanning" },
  { id: "mce", name: "Minority Capital Exchange", shortName: "MCE", icon: Building2, color: "text-emerald-600", role: "Minority business SaaS, contracting support, economic mobility" },
  { id: "lifebridge", name: "LifeBridge", shortName: "LifeBridge", icon: Heart, color: "text-rose-600", role: "24/7 virtual 211, resource navigation, housing/crisis referrals" },
  { id: "rplice", name: "RPLICE", shortName: "RPLICE", icon: Microscope, color: "text-blue-600", role: "Implementation science evaluation — RE-AIM, CFIR framework tracking" },
  { id: "sankofa", name: "HerHealth", shortName: "HerHealth", icon: Heart, color: "text-pink-600", role: "Behavioral health assessment, Black maternal health, wellness content" },
  { id: "m2c", name: "M2C Transition", shortName: "M2C", icon: Shield, color: "text-slate-600", role: "Military-to-civilian career translation and veteran services" },
  { id: "safereport", name: "SafeReport", shortName: "SafeReport", icon: Shield, color: "text-orange-600", role: "Incident reporting, safety tracking, anonymous reporting" },
  { id: "perfectly-different", name: "Perfectly Different", shortName: "Perf. Different", icon: Brain, color: "text-purple-600", role: "Neurodiversity-affirming platform, mental health risk factor support" },
  { id: "wholemind", name: "Talk Your Talk", shortName: "Talk Your Talk", icon: BookOpen, color: "text-teal-600", role: "Communication access — 89 spoken + 18 sign languages across literacy, learning, and intake" },
  { id: "pillscheduler", name: "HerHealth Network", shortName: "HerHealth", icon: Clock, color: "text-cyan-600", role: "Holistic Black feminine health hub — preventive care, chronic disease navigation, medication adherence support" },
  { id: "safecognicare", name: "SafeCogniCare", shortName: "SafeCogni", icon: Brain, color: "text-indigo-600", role: "Cognitive safety monitoring, elder care, cognitive assessment" },
  { id: "betterscience", name: "Better Science Lab", shortName: "Better Science", icon: Microscope, color: "text-sky-600", role: "Research infrastructure, independent evaluation, evidence registry" },
  { id: "isss", name: "ISSS", shortName: "ISSS", icon: ClipboardCheck, color: "text-lime-600", role: "School implementation tools, MTSS compliance, SEL curriculum" },
];

type LifecycleStage = "discovery" | "assessment" | "design" | "implementation" | "measurement" | "improvement";

interface StageConfig {
  id: LifecycleStage;
  title: string;
  subtitle: string;
  mapGapStep: string;
  icon: typeof Target;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  platformRoles: Array<{ platformId: string; contribution: string }>;
  keyActions: string[];
  deliverables: string[];
}

const LIFECYCLE_STAGES: StageConfig[] = [
  {
    id: "discovery",
    title: "Discovery",
    subtitle: "Identify the Problem",
    mapGapStep: "MAP-GAP Step 1",
    icon: Search,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-300 dark:border-blue-700",
    description: "Community data reveals the problem. The Incubator scans for matching grant opportunities. LifeBridge surfaces real-time community needs. RPLICE identifies evidence-based programs that address the identified challenge.",
    platformRoles: [
      { platformId: "incubator", contribution: "Scans SAM.gov and foundation databases; AI scores opportunity fit against ecosystem capabilities" },
      { platformId: "thriveup", contribution: "Community Intelligence Map overlays social determinants, suspension rates, ACEs prevalence" },
      { platformId: "lifebridge", contribution: "Surfaces real-time community needs — housing gaps, crisis call patterns, unmet resource requests" },
      { platformId: "sankofa", contribution: "Behavioral health data — depression screening trends, substance use patterns, maternal health indicators" },
      { platformId: "safereport", contribution: "Incident data reveals safety patterns — bullying hotspots, trafficking indicators, community violence" },
      { platformId: "rplice", contribution: "Evidence registry identifies matching EBPs from SAMHSA NREPP, Blueprints, CrimeSolutions" },
    ],
    keyActions: [
      "Run community needs assessment using GIS Community Intelligence Map",
      "The Incubator scans for grant opportunities matching identified needs",
      "Cross-reference LifeBridge resource gap data with community problem areas",
      "Sankofa Health provides behavioral health prevalence data",
      "SafeReport incident patterns identify emerging community safety issues",
    ],
    deliverables: ["Community Needs Assessment Report", "Grant Opportunity Scorecard", "Problem Statement with Data"],
  },
  {
    id: "assessment",
    title: "Assessment",
    subtitle: "Three Realities Analysis",
    mapGapStep: "MAP-GAP Step 2",
    icon: ClipboardCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    description: "Three Realities analysis: What does research say? What do politics allow? What works on the ground? Each platform contributes its perspective to build a complete picture before any program is designed.",
    platformRoles: [
      { platformId: "rplice", contribution: "Reality 1 (Research): RE-AIM framework scores candidate interventions for Reach, Effectiveness, Adoption, Implementation, Maintenance" },
      { platformId: "betterscience", contribution: "Reality 1 (Research): Independent evaluation of evidence base — meta-analyses, systematic reviews, effect sizes" },
      { platformId: "thriveup", contribution: "Reality 2 (Politics): Coalition Dashboard maps political landscape — who supports, who opposes, where the leverage is" },
      { platformId: "incubator", contribution: "Reality 2 (Politics): Grant requirement alignment — what funders mandate vs. what community needs" },
      { platformId: "lifebridge", contribution: "Reality 3 (Ground): What's actually happening — service gaps, wait times, navigation barriers real people face" },
      { platformId: "isss", contribution: "Reality 3 (Ground): School-level implementation readiness — staff capacity, scheduling constraints, existing programs" },
    ],
    keyActions: [
      "RPLICE evaluates candidate EBPs through RE-AIM framework",
      "Better Science Lab reviews research evidence quality and applicability",
      "Coalition Dashboard maps stakeholder support landscape",
      "LifeBridge ground-truth data validates or challenges assumptions",
      "ISSS assesses school-level implementation readiness and constraints",
    ],
    deliverables: ["Three Realities Assessment", "RE-AIM Scorecard", "Stakeholder Power Map", "Implementation Readiness Report"],
  },
  {
    id: "design",
    title: "Design",
    subtitle: "Build the Intervention",
    mapGapStep: "MAP-GAP Steps 2-3",
    icon: Wrench,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-300 dark:border-violet-700",
    description: "Design the program using MAP-GAP gap analysis. Each platform contributes its domain expertise. The Program Designer maps grant requirements to ecosystem capabilities and identifies what needs to be built, partnered, or licensed.",
    platformRoles: [
      { platformId: "thriveup", contribution: "Program Designer maps grant requirements to platform capabilities and identifies gaps" },
      { platformId: "rplice", contribution: "Defines SALP fidelity indicators for each program component — what 'implemented as designed' looks like" },
      { platformId: "wholemind", contribution: "Designs academic support components — visual-first learning, protective factor curriculum" },
      { platformId: "perfectly-different", contribution: "Ensures neurodiversity-affirming design — accommodations, alternative pathways, inclusive engagement" },
      { platformId: "sankofa", contribution: "Designs behavioral health screening protocols and culturally responsive wellness content" },
      { platformId: "mce", contribution: "Designs economic mobility pathways — business development, contracting opportunities, financial literacy" },
      { platformId: "m2c", contribution: "Designs military-to-civilian transition pathways when veteran populations are served" },
    ],
    keyActions: [
      "Run MAP-GAP gap analysis in Program Designer against selected grant requirements",
      "Define SALP fidelity indicators for every program component through RPLICE",
      "Design curriculum pathways pulling from Talk Your Talk, Perfectly Different, Sankofa as appropriate",
      "Build logic model connecting activities to outputs to outcomes",
      "Generate grant narrative using cross-platform capability documentation",
    ],
    deliverables: ["Program Design Document", "Logic Model", "SALP Indicator Framework", "Grant Narrative Draft", "Partner MOUs"],
  },
  {
    id: "implementation",
    title: "Implementation",
    subtitle: "Execute with Fidelity",
    mapGapStep: "MAP-GAP Step 4",
    icon: Rocket,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-300 dark:border-amber-700",
    description: "Launch the program. Every platform tracks its domain in real time. SALP indicators measure whether the program is delivered as designed. No black boxes — every stakeholder sees every metric through the Transparency Dashboard.",
    platformRoles: [
      { platformId: "thriveup", contribution: "Central delivery hub — curriculum, quests, check-ins, dosage tracking, case management, engagement" },
      { platformId: "rplice", contribution: "Real-time SALP fidelity monitoring — flagging drift from designed implementation before it compounds" },
      { platformId: "isss", contribution: "School-based delivery — MTSS tier tracking, classroom implementation, teacher fidelity observations" },
      { platformId: "lifebridge", contribution: "24/7 resource navigation for participants — housing, food, transportation, crisis support" },
      { platformId: "safereport", contribution: "Safety monitoring during implementation — incident tracking, mandatory reporting, risk flags" },
      { platformId: "pillscheduler", contribution: "Medication adherence tracking for participants with health management needs" },
      { platformId: "safecognicare", contribution: "Cognitive safety monitoring for elder populations or participants with cognitive considerations" },
    ],
    keyActions: [
      "Begin program delivery with SALP fidelity monitoring active from day one",
      "Track participant engagement and dosage hours in real time through ThriveUp",
      "LifeBridge handles wraparound service referrals as participant needs emerge",
      "SafeReport captures incidents for safety review and mandatory reporting",
      "RPLICE flags implementation drift in real time — before outcomes suffer",
    ],
    deliverables: ["Dosage Tracking Reports", "SALP Fidelity Scores", "Participant Engagement Logs", "Incident Reports", "Service Delivery Records"],
  },
  {
    id: "measurement",
    title: "Measurement",
    subtitle: "Measure Outcomes",
    mapGapStep: "MAP-GAP Step 5",
    icon: BarChart3,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-300 dark:border-rose-700",
    description: "Every platform reports its outcomes into the Transparency Dashboard. Stakeholders see role-specific views. SMART goals are tracked in real time. No year-end surprises — continuous measurement across the full ecosystem.",
    platformRoles: [
      { platformId: "thriveup", contribution: "Transparency Dashboard aggregates all platform metrics into 7 stakeholder-specific views with SALP panels" },
      { platformId: "rplice", contribution: "RE-AIM evaluation — Reach (who participated), Effectiveness (did it work), Adoption, Implementation fidelity, Maintenance" },
      { platformId: "betterscience", contribution: "Independent outcome evaluation — statistical analysis, control comparisons, publication-ready findings" },
      { platformId: "sankofa", contribution: "Behavioral health outcome data — PHQ-9 changes, substance use reduction, wellness score trajectories" },
      { platformId: "mce", contribution: "Economic mobility metrics — businesses launched, contracts won, revenue generated, jobs created" },
      { platformId: "isss", contribution: "Academic outcomes — attendance improvement, suspension reduction, grade progression, graduation rates" },
    ],
    keyActions: [
      "Generate funder-facing reports through Transparency Dashboard",
      "RPLICE produces RE-AIM evaluation across all program components",
      "Better Science Lab runs independent outcome analysis",
      "Cross-platform outcome aggregation shows holistic community impact",
      "SMART goal tracking shows progress against explicit targets with dates",
    ],
    deliverables: ["Quarterly Outcome Reports", "RE-AIM Evaluation", "Funder Progress Reports", "SMART Goal Scorecards", "Stakeholder Dashboards"],
  },
  {
    id: "improvement",
    title: "Improvement",
    subtitle: "Capture & Replicate",
    mapGapStep: "MAP-GAP Step 6 (MG-PATR)",
    icon: RefreshCw,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    description: "MG-PATR captures what worked. MAP-GAP CQI identifies what to improve. Three Realities ensures the next community gets an adapted version — not a copy-paste. The ecosystem gets smarter with every deployment.",
    platformRoles: [
      { platformId: "thriveup", contribution: "MAP-GAP CQI engine runs continuous quality improvement cycles — what changed, why, what to adjust" },
      { platformId: "rplice", contribution: "MG-PATR documentation — captures implementation lessons for replication in new communities" },
      { platformId: "betterscience", contribution: "Research publication — effect sizes, lessons learned, contribution to evidence base" },
      { platformId: "incubator", contribution: "Identifies next grant opportunities based on demonstrated outcomes and expanded capabilities" },
      { platformId: "mce", contribution: "Economic sustainability assessment — can this program self-fund? What revenue diversification exists?" },
      { platformId: "lifebridge", contribution: "Community feedback loop — what participants say they still need, what gaps remain" },
    ],
    keyActions: [
      "Run MAP-GAP CQI cycle: Assess then Identify Gaps then Plan Adjustments then Implement then Reassess",
      "RPLICE captures MG-PATR documentation for future community deployments",
      "Better Science Lab prepares findings for publication and evidence base contribution",
      "Three Realities re-assessment for next community — different politics, different ground truth",
      "The Incubator identifies continuation and expansion funding opportunities",
    ],
    deliverables: ["MG-PATR Replication Guide", "CQI Improvement Plan", "Research Publication Draft", "Sustainability Plan", "Next Community Readiness Assessment"],
  },
];

interface ProgramEntry {
  id: string;
  name: string;
  grantAlignment: string;
  currentStage: LifecycleStage;
  fidelityScore: number;
  nextMilestone: string;
  milestoneDate: string;
  activePlatforms: string[];
  description: string;
  population: string;
  location: string;
}

const ACTIVE_PROGRAMS: ProgramEntry[] = [
  {
    id: "dfc-prevention",
    name: "DFC Youth Substance Prevention",
    grantAlignment: "CDC/ONDCP Drug-Free Communities ($625K)",
    currentStage: "design",
    fidelityScore: 87,
    nextMilestone: "Submit DFC application",
    milestoneDate: "April 14, 2026",
    activePlatforms: ["thriveup", "rplice", "sankofa", "lifebridge", "isss", "wholemind", "perfectly-different", "safereport", "incubator"],
    description: "12-sector coalition-based youth substance use prevention using evidence-based curriculum with SALP fidelity tracking.",
    population: "Youth ages 10-24 and families",
    location: "Target Community",
  },
  {
    id: "workforce-reentry",
    name: "Second Chance Workforce Reentry",
    grantAlignment: "DOJ Second Chance Act",
    currentStage: "assessment",
    fidelityScore: 72,
    nextMilestone: "Complete Three Realities assessment",
    milestoneDate: "May 1, 2026",
    activePlatforms: ["thriveup", "lifebridge", "mce", "m2c", "safereport", "rplice", "incubator"],
    description: "Evidence-based reentry program combining workforce pathways, case management, and community reintegration for returning citizens.",
    population: "Returning citizens ages 18-45",
    location: "Target Community",
  },
  {
    id: "truist-career-pathways",
    name: "Truist Career Pathways Initiative",
    grantAlignment: "Truist Foundation Community Grant",
    currentStage: "discovery",
    fidelityScore: 0,
    nextMilestone: "Complete community needs assessment",
    milestoneDate: "April 30, 2026",
    activePlatforms: ["incubator", "thriveup", "mce", "lifebridge", "rplice"],
    description: "Career pathway development for underserved populations with financial literacy, small business support, and economic mobility programming.",
    population: "Underserved adults and minority entrepreneurs",
    location: "Target Community",
  },
  {
    id: "samhsa-behavioral-health",
    name: "Community Behavioral Health System",
    grantAlignment: "SAMHSA Community Mental Health Block Grant",
    currentStage: "discovery",
    fidelityScore: 0,
    nextMilestone: "Behavioral health needs assessment",
    milestoneDate: "June 1, 2026",
    activePlatforms: ["sankofa", "lifebridge", "thriveup", "rplice", "pillscheduler", "safecognicare", "incubator"],
    description: "Community-based behavioral health services integrating Sankofa Health assessment, LifeBridge resource navigation, and CHW workforce pipeline.",
    population: "Community members with behavioral health needs",
    location: "Target Community",
  },
  {
    id: "wioa-youth-workforce",
    name: "WIOA Youth Workforce Pipeline",
    grantAlignment: "WIOA Title I Youth Programs",
    currentStage: "implementation",
    fidelityScore: 91,
    nextMilestone: "Q2 outcome report to workforce board",
    milestoneDate: "July 15, 2026",
    activePlatforms: ["thriveup", "mce", "m2c", "rplice", "lifebridge", "isss", "wholemind"],
    description: "Comprehensive youth workforce development with career pathways, credential tracking, employer engagement, and 12-month follow-up.",
    population: "Youth ages 16-24 facing employment barriers",
    location: "Target Community",
  },
];

function PlatformBadge({ platformId }: { platformId: string }) {
  const platform = ECOSYSTEM_PLATFORMS.find(p => p.id === platformId);
  if (!platform) return null;
  const Icon = platform.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted ${platform.color}`}
      title={platform.role}
      data-testid={`badge-platform-${platformId}`}
    >
      <Icon className="h-3 w-3" />
      {platform.shortName}
    </span>
  );
}

function ProgramCard({ program }: { program: ProgramEntry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      className="cursor-pointer hover-elevate transition-all"
      onClick={() => setExpanded(!expanded)}
      data-testid={`card-program-${program.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight">{program.name}</h4>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{program.grantAlignment}</p>

        {program.fidelityScore > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">SALP Fidelity</span>
              <span className={`font-semibold ${program.fidelityScore >= 80 ? "text-emerald-600" : program.fidelityScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {program.fidelityScore}%
              </span>
            </div>
            <Progress value={program.fidelityScore} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{program.nextMilestone}</span>
        </div>
        <div className="text-[10px] text-muted-foreground ml-4">{program.milestoneDate}</div>

        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2 animate-in fade-in-0 duration-200">
            <p className="text-xs text-muted-foreground">{program.description}</p>
            <div className="text-xs">
              <span className="font-medium">Population:</span>{" "}
              <span className="text-muted-foreground">{program.population}</span>
            </div>
            <div>
              <p className="text-[10px] font-medium mb-1">Active Platforms ({program.activePlatforms.length}):</p>
              <div className="flex flex-wrap gap-1">
                {program.activePlatforms.map((pId) => (
                  <PlatformBadge key={pId} platformId={pId} />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StageColumn({ stage, programs }: { stage: StageConfig; programs: ProgramEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = stage.icon;
  return (
    <div
      className={`rounded-lg border ${stage.borderColor} ${stage.bgColor} p-4 min-w-[280px] flex-1`}
      data-testid={`column-stage-${stage.id}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`rounded-md p-1.5 bg-background border ${stage.borderColor}`}>
          <Icon className={`h-4 w-4 ${stage.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-sm ${stage.color}`}>{stage.title}</h3>
          <p className="text-[10px] text-muted-foreground">{stage.mapGapStep}</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">{programs.length}</Badge>
      </div>

      <div className="space-y-3">
        {programs.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
        {programs.length === 0 && (
          <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-md">
            No active programs
          </div>
        )}
      </div>

      <button
        className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-full justify-center"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-stage-${stage.id}`}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {expanded ? "Hide" : "Show"} platform roles
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {stage.platformRoles.map((role) => {
            const platform = ECOSYSTEM_PLATFORMS.find(p => p.id === role.platformId);
            if (!platform) return null;
            const PIcon = platform.icon;
            return (
              <div key={role.platformId} className="flex items-start gap-2 text-xs bg-background/50 rounded-md p-2 border">
                <PIcon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${platform.color}`} />
                <div>
                  <span className="font-medium">{platform.shortName}:</span>{" "}
                  <span className="text-muted-foreground">{role.contribution}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PipelineView() {
  const programsByStage = useMemo(() => {
    const map: Record<LifecycleStage, ProgramEntry[]> = {
      discovery: [], assessment: [], design: [], implementation: [], measurement: [], improvement: [],
    };
    ACTIVE_PROGRAMS.forEach((p) => {
      map[p.currentStage].push(p);
    });
    return map;
  }, []);

  return (
    <div className="space-y-6" data-testid="section-pipeline-view">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <RefreshCw className="h-4 w-4 text-primary" />
        <span>MAP-GAP Lifecycle Pipeline — programs flow left to right through continuous improvement</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {LIFECYCLE_STAGES.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            programs={programsByStage[stage.id]}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary" data-testid="text-total-programs">{ACTIVE_PROGRAMS.length}</p>
            <p className="text-sm text-muted-foreground">Active Programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600" data-testid="text-avg-fidelity">
              {Math.round(ACTIVE_PROGRAMS.filter(p => p.fidelityScore > 0).reduce((sum, p) => sum + p.fidelityScore, 0) / Math.max(ACTIVE_PROGRAMS.filter(p => p.fidelityScore > 0).length, 1))}%
            </p>
            <p className="text-sm text-muted-foreground">Avg SALP Fidelity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-violet-600" data-testid="text-platforms-active">
              {new Set(ACTIVE_PROGRAMS.flatMap(p => p.activePlatforms)).size}
            </p>
            <p className="text-sm text-muted-foreground">Platforms Engaged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600" data-testid="text-grant-value">$625K+</p>
            <p className="text-sm text-muted-foreground">Grant Pipeline Value</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StageDetailView() {
  const [selectedStage, setSelectedStage] = useState<LifecycleStage>("discovery");
  const stage = LIFECYCLE_STAGES.find(s => s.id === selectedStage)!;
  const Icon = stage.icon;
  const stagePrograms = ACTIVE_PROGRAMS.filter(p => p.currentStage === selectedStage);

  return (
    <div className="space-y-6" data-testid="section-stage-detail">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {LIFECYCLE_STAGES.map((s) => {
          const SIcon = s.icon;
          const isActive = selectedStage === s.id;
          return (
            <Button
              key={s.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStage(s.id)}
              className="shrink-0"
              data-testid={`button-stage-${s.id}`}
            >
              <SIcon className="h-4 w-4 mr-1.5" />
              {s.title}
            </Button>
          );
        })}
      </div>

      <Card className={`${stage.bgColor} ${stage.borderColor} border`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className={`rounded-lg p-2 bg-background border ${stage.borderColor}`}>
              <Icon className={`h-6 w-6 ${stage.color}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${stage.color}`}>{stage.title}: {stage.subtitle}</h2>
              <p className="text-sm text-muted-foreground font-normal">{stage.mapGapStep}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{stage.description}</p>
        </CardContent>
      </Card>

      <Card data-testid="card-platform-contributions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-primary" />
            Platform Contributions at This Stage
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Each platform evaluates the program from its lens — collaborative intelligence, no silos
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {stage.platformRoles.map((role) => {
            const platform = ECOSYSTEM_PLATFORMS.find(p => p.id === role.platformId);
            if (!platform) return null;
            const PIcon = platform.icon;
            return (
              <div key={role.platformId} className="flex items-start gap-3 p-3 rounded-md border hover-elevate" data-testid={`row-platform-role-${role.platformId}`}>
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <PIcon className={`h-4 w-4 ${platform.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{platform.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{role.contribution}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card data-testid="card-key-actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowRight className="h-4 w-4 text-primary" />
              Key Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stage.keyActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{action}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="card-deliverables">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              Deliverables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stage.deliverables.map((del, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{del}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {stagePrograms.length > 0 && (
        <Card data-testid="card-programs-at-stage">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-primary" />
              Programs Currently at This Stage ({stagePrograms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stagePrograms.map((prog) => (
              <div key={prog.id} className="p-3 rounded-md border">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold">{prog.name}</h4>
                  {prog.fidelityScore > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      SALP: {prog.fidelityScore}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{prog.grantAlignment}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {prog.activePlatforms.map((pId) => (
                    <PlatformBadge key={pId} platformId={pId} />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EcosystemOverview() {
  return (
    <div className="space-y-6" data-testid="section-ecosystem-overview">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            14-Platform Ecosystem
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Each platform contributes domain expertise through MAP-GAP. No silos — every platform sees what the others produce, evaluated from its lens.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ECOSYSTEM_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const programCount = ACTIVE_PROGRAMS.filter(p =>
                p.activePlatforms.includes(platform.id)
              ).length;
              return (
                <div
                  key={platform.id}
                  className="p-3 rounded-md border hover-elevate"
                  data-testid={`card-ecosystem-platform-${platform.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                      <Icon className={`h-4 w-4 ${platform.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{platform.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Active in {programCount} program{programCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{platform.role}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            Cross-Platform Data Flow
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            "We Plan. We Research. We Understand. We Coordinate. We Implement with Fidelity. We Continuously Improve." — each action spans multiple platforms
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              action: "We Plan",
              description: "The Incubator discovers opportunities. RPLICE evaluates evidence. Better Science Lab validates research. ThriveUp's Program Designer maps capabilities to requirements.",
              platforms: ["incubator", "rplice", "betterscience", "thriveup"],
              icon: Search,
            },
            {
              action: "We Coordinate",
              description: "ThriveUp's Coalition Dashboard aligns stakeholders. LifeBridge coordinates services. MCE engages employers. ISSS bridges school systems. SafeReport tracks safety.",
              platforms: ["thriveup", "lifebridge", "mce", "isss", "safereport"],
              icon: Users,
            },
            {
              action: "We Build",
              description: "Talk Your Talk delivers communication-access curriculum across 89 spoken + 18 sign languages. Sankofa provides culturally-responsive health content. Perfectly Different ensures inclusion. M2C handles veteran pathways. HerHealth Network supports women's health and medication adherence. SafeCogniCare monitors cognition.",
              platforms: ["wholemind", "sankofa", "perfectly-different", "m2c", "pillscheduler", "safecognicare"],
              icon: Wrench,
            },
            {
              action: "We Measure",
              description: "RPLICE tracks RE-AIM fidelity. Better Science Lab runs independent evaluation. ThriveUp's Transparency Dashboard aggregates everything into stakeholder views with SALP panels.",
              platforms: ["rplice", "betterscience", "thriveup"],
              icon: BarChart3,
            },
          ].map((flow) => {
            const FIcon = flow.icon;
            return (
              <div key={flow.action} className="p-4 rounded-lg border" data-testid={`card-flow-${flow.action.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FIcon className="h-5 w-5 text-primary" />
                  <h4 className="font-bold text-sm">{flow.action}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{flow.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {flow.platforms.map((pId) => (
                    <PlatformBadge key={pId} platformId={pId} />
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgramLifecyclePage() {
  const [activeTab, setActiveTab] = useState("pipeline");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="page-program-lifecycle">
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <RefreshCw className="h-6 w-6 text-primary" />
            Program Lifecycle Pipeline
          </h1>
          <TrainingGuideButton moduleId="program-lifecycle" />
        </div>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          MAP-GAP-driven lifecycle management across the 15-service-platform ecosystem. Every stage shows which platforms contribute what — no silos, no black boxes.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-lifecycle">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            <Layers className="h-4 w-4 mr-1.5" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="stages" data-testid="tab-stages">
            <Eye className="h-4 w-4 mr-1.5" />
            Stage Detail
          </TabsTrigger>
          <TabsTrigger value="ecosystem" data-testid="tab-ecosystem">
            <Globe className="h-4 w-4 mr-1.5" />
            Ecosystem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineView />
        </TabsContent>

        <TabsContent value="stages" className="mt-6">
          <StageDetailView />
        </TabsContent>

        <TabsContent value="ecosystem" className="mt-6">
          <EcosystemOverview />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Link href="/program-designer">
          <Button variant="outline" size="sm" data-testid="button-to-program-designer">
            <Target className="mr-2 h-4 w-4" /> Program Designer
          </Button>
        </Link>
        <Link href="/transparency">
          <Button variant="outline" size="sm" data-testid="button-to-transparency">
            <Activity className="mr-2 h-4 w-4" /> Transparency Dashboard
          </Button>
        </Link>
        <Link href="/cqi">
          <Button variant="outline" size="sm" data-testid="button-to-cqi">
            <RefreshCw className="mr-2 h-4 w-4" /> MAP-GAP CQI
          </Button>
        </Link>
        <Link href="/case-studies">
          <Button variant="outline" size="sm" data-testid="button-to-case-studies">
            <BookOpen className="mr-2 h-4 w-4" /> Case Studies
          </Button>
        </Link>
        <Link href="/ecosystem-story">
          <Button variant="outline" size="sm" data-testid="button-to-ecosystem-story">
            <Globe className="mr-2 h-4 w-4" /> Ecosystem Story
          </Button>
        </Link>
      </div>
    </div>
  );
}