import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Target, Users, CheckCircle2, BarChart3, Repeat, ArrowRight,
  ChevronRight, ChevronDown, Microscope, Scale, Briefcase, Brain,
  BookOpen, Shield, Activity, Layers, RefreshCw, Lightbulb,
  Eye, Zap, Globe, Compass, FlaskConical,
  Building2,
} from "lucide-react";
import { TrainingGuideButton } from "@/components/training-guide";
import { DISCIPLINES } from "@/lib/mvv-content";

const METHODOLOGY_REGISTRY = [
  {
    id: "map-gap",
    name: "MAP-GAP",
    fullName: "Map, Analyze, Plan — Gap Assessment Protocol",
    icon: RefreshCw,
    color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
    borderColor: "border-violet-300 dark:border-violet-700",
    purpose: "The living operating system that brings homeostasis to community programs. MAP-GAP is domain-agnostic — it works for substance use prevention, workforce development, reentry, health equity, or any community challenge.",
    howItWorks: "Continuous 6-step cycle: Identify the problem using community data → Design an evidence-based intervention → Coordinate all stakeholders → Execute with measurable fidelity → Measure outcomes and adjust → Capture lessons and adapt for replication. The system never stops — it creates equilibrium through constant assessment and adjustment.",
    whyItMatters: "Most programs fail not because the idea was bad, but because implementation drifted. MAP-GAP prevents drift by embedding continuous quality improvement into the DNA of every program — not as an afterthought, but as the operating system.",
  },
  {
    id: "salp",
    name: "SALP",
    fullName: "Stakeholder-Aligned Longitudinal Performance Indicators",
    icon: Activity,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    purpose: "The fidelity measurement system that ensures programs are implemented as designed — not just deployed and forgotten. SALP indicators are visible to ALL stakeholders in real time.",
    howItWorks: "Define expected implementation activities, frequencies, and quality markers at program design. Track actual delivery against expected delivery continuously. Flag deviations before they become failures. Every stakeholder — from funders to participants — sees the same fidelity data.",
    whyItMatters: "You can't improve what you don't measure, and you can't build trust if measurement happens behind closed doors. SALP makes fidelity transparent — funders see exactly how their investment is being executed, program staff see where they need to adjust, and participants see that their program is being delivered with care.",
  },
  {
    id: "three-realities",
    name: "Three Realities",
    fullName: "Research–Policy–Practice Adaptation Framework",
    icon: Layers,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-700",
    purpose: "The adaptation engine that prevents the most common failure in community programs: copy-pasting a solution from one setting to another without accounting for local context.",
    howItWorks: "Every intervention must pass through three lenses before implementation: (1) What does the research say? The evidence base, the proven frameworks, the academic foundation. (2) What do politics allow? Regulatory landscape, funding constraints, institutional dynamics, community politics. (3) What actually works on the ground? Lived experience, cultural context, community assets, practical feasibility. Only programs that satisfy all three realities move to execution.",
    whyItMatters: "A program that works in Chicago may fail in rural Appalachia — not because the research was wrong, but because the political and ground-level realities are different. Three Realities forces adaptation, not adoption. This is why the ecosystem can work anywhere without becoming a franchise.",
  },
  {
    id: "mg-patr",
    name: "MG-PATR",
    fullName: "MAP-GAP Pilot, Adapt, Transfer, Replicate",
    icon: Repeat,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-700",
    purpose: "The replication protocol that captures what works and adapts it for new communities — ensuring successful programs scale without losing effectiveness.",
    howItWorks: "When a program achieves validated outcomes, MG-PATR activates: (1) Pilot — document what worked, what didn't, and what was adapted during initial deployment. (2) Adapt — run the Three Realities analysis for the new target community. (3) Transfer — move core components while modifying context-dependent elements. (4) Replicate — deploy in the new setting with fresh SALP indicators and a new MAP-GAP cycle.",
    whyItMatters: "Most programs either refuse to scale (staying small and local) or scale by copy-pasting (losing effectiveness). MG-PATR threads the needle — capturing enough structure to replicate reliably while building in enough flexibility to adapt to new realities. Every deployment makes the ecosystem smarter.",
  },
];

const CYCLE_DETAILS = [
  {
    step: 1,
    title: "Identify the Problem",
    subtitle: "Research & Community Data",
    icon: Search,
    color: "from-blue-500 to-blue-600",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    desc: "Community data reveals the problem — suspension rates, recidivism, ACEs prevalence, unaddressed social determinants of health. Ground-truth assessment, not assumptions.",
    disciplines: ["implementation-science"],
    platforms: ["Community Intelligence Map", "GIS Data", "Grant Discovery Engine"],
    dataFlows: [
      "Community health assessments and epidemiological data intake",
      "Social determinants of health mapping by geography",
      "Stakeholder needs assessment and asset inventory",
      "Historical program data analysis for pattern recognition",
    ],
    fidelityMarkers: [
      "Data sources validated and triangulated",
      "Community voice included in problem identification",
      "Problem mapped to evidence-based risk/protective factors",
      "Baseline metrics established for all target outcomes",
    ],
  },
  {
    step: 2,
    title: "Design the Intervention",
    subtitle: "MAP-GAP + Three Realities",
    icon: Target,
    color: "from-violet-500 to-violet-600",
    badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
    desc: "Use MAP-GAP and Three Realities to design a program tailored to THIS community. What research says, what politics allow, what actually works on the ground.",
    disciplines: ["implementation-science", "criminal-justice", "hr-management", "io-psychology"],
    platforms: ["MAP-GAP CQI", "RPLICE", "Better Science Lab"],
    dataFlows: [
      "Evidence-based practice literature review and selection",
      "Three Realities assessment for local adaptation",
      "Logic model construction (Inputs → Activities → Outputs → Outcomes)",
      "SALP indicator design for fidelity tracking",
    ],
    fidelityMarkers: [
      "All four disciplines represented in intervention design",
      "Three Realities analysis completed and documented",
      "Logic model validated by stakeholders",
      "SALP fidelity indicators defined before execution begins",
    ],
  },
  {
    step: 3,
    title: "Coordinate Stakeholders",
    subtitle: "Build the Network",
    icon: Users,
    color: "from-emerald-500 to-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    desc: "CHWs, mentors, community police, educators, employers — everyone connected through shared dashboards, shared goals, transparent metrics. No black boxes.",
    disciplines: ["hr-management", "io-psychology"],
    platforms: ["Coalition Dashboard", "Partner Network", "DFC Command Center"],
    dataFlows: [
      "12-sector coalition mapping and gap identification",
      "Shared SMART goals published to all stakeholders",
      "Role assignments with clear accountability structures",
      "Communication protocols and meeting cadences established",
    ],
    fidelityMarkers: [
      "All required coalition sectors represented",
      "SMART goals co-created with community stakeholders",
      "MOUs or partnership agreements executed",
      "Shared dashboard access provisioned for all partners",
    ],
  },
  {
    step: 4,
    title: "Execute with Fidelity",
    subtitle: "SALP Indicators",
    icon: CheckCircle2,
    color: "from-amber-500 to-amber-600",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    desc: "SALP indicators measure whether the program is implemented as designed. SMART goals visible to ALL stakeholders — real time, not year-end reports.",
    disciplines: ["implementation-science", "io-psychology"],
    platforms: ["Dosage Tracking", "Case Management", "Outcome Reporting"],
    dataFlows: [
      "Service delivery logging with dosage hour tracking",
      "SALP fidelity observations recorded per activity",
      "Participant engagement metrics captured continuously",
      "Real-time deviation alerts when implementation drifts",
    ],
    fidelityMarkers: [
      "Service delivery matches design specifications",
      "Dosage thresholds met for all participant groups",
      "Staff training and competency verified",
      "SALP adherence at or above 80% across all indicators",
    ],
  },
  {
    step: 5,
    title: "Measure & Improve",
    subtitle: "Continuous Quality Improvement",
    icon: BarChart3,
    color: "from-rose-500 to-rose-600",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    desc: "What's working and what's not. Continuous improvement loop — assess, adjust, improve. MAP-GAP brings homeostasis: the system self-corrects in real time.",
    disciplines: ["implementation-science", "io-psychology"],
    platforms: ["MAP-GAP CQI", "Platform Metrics", "AI Insights"],
    dataFlows: [
      "Outcome data compared against baseline and targets",
      "Gap analysis identifying variance from design",
      "Root cause analysis for implementation failures",
      "Intervention adjustments documented and tracked",
    ],
    fidelityMarkers: [
      "Quarterly outcome reviews completed on schedule",
      "All identified gaps have documented root causes",
      "Improvement interventions have measurable targets",
      "CQI cycle documentation maintained for audit",
    ],
  },
  {
    step: 6,
    title: "Capture & Replicate",
    subtitle: "MG-PATR Protocol",
    icon: Repeat,
    color: "from-indigo-500 to-indigo-600",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    desc: "When it works, capture lessons through MG-PATR. Then pilot and adapt for the next community — accounting for new Three Realities. Never copy-paste.",
    disciplines: ["implementation-science", "criminal-justice", "hr-management", "io-psychology"],
    platforms: ["Research Hub", "Implementation Plans", "Program Templates"],
    dataFlows: [
      "Success patterns documented with outcome evidence",
      "Context-dependent vs. transferable elements identified",
      "New community Three Realities assessment initiated",
      "Adapted program design with fresh SALP indicators",
    ],
    fidelityMarkers: [
      "Lessons learned documented with supporting data",
      "Transferable core components identified and validated",
      "New community Three Realities assessment completed",
      "Adapted program includes community-specific modifications",
    ],
  },
];

const SCENARIO_CONFIGS = [
  {
    id: "substance-prevention",
    title: "Substance Use Prevention",
    subtitle: "Drug-Free Communities Program",
    icon: Shield,
    setting: "Urban/Suburban Community",
    problem: "Rising youth substance use rates, particularly vaping and marijuana. Community lacks coordinated prevention infrastructure. Schools report increasing disciplinary actions related to substance use.",
    disciplines: [
      { id: "implementation-science", role: "CFIR and RE-AIM frameworks guide evidence-based prevention curriculum selection and adaptation. Fidelity monitoring ensures curricula are delivered as designed." },
      { id: "criminal-justice", role: "Diversion programs for youth with substance-related offenses. Restorative justice circles replace punitive disciplinary actions." },
      { id: "hr-management", role: "CHW workforce pipeline trained in substance use prevention. Facilitator competency models ensure quality delivery." },
      { id: "io-psychology", role: "Behavioral nudge architecture for youth engagement. Perception of risk messaging calibrated to developmental stage." },
    ],
    platforms: ["ThriveUp", "Sankofa Health", "SafeReport", "DFC Command Center", "Coalition Dashboard", "Dosage Tracking"],
    threeRealities: {
      research: "SAMHSA's Strategic Prevention Framework. Evidence-based curricula (Botvin LifeSkills, Too Good for Drugs). Risk/protective factor model.",
      politics: "CDC/ONDCP DFC funding requirements: 12-sector coalition, 4 core measures, community readiness assessment. State-level marijuana legalization creates messaging complexity.",
      ground: "Youth prefer peer-led programming over adult lectures. Parents underestimate vaping prevalence. Schools need programming that fits within existing bell schedules.",
    },
  },
  {
    id: "workforce-development",
    title: "Workforce Development",
    subtitle: "WIOA-Aligned Career Pathways",
    icon: Briefcase,
    setting: "Post-Industrial Rural Community",
    problem: "Economic decline following factory closures. High unemployment, brain drain of young professionals, limited training infrastructure. Community members lack digital skills required for emerging industries.",
    disciplines: [
      { id: "implementation-science", role: "Implementation science ensures workforce training programs are evidence-based and adapted to local industry needs using CFIR constructs." },
      { id: "criminal-justice", role: "Reentry workforce pathways for returning citizens. Employer partnerships that accept justice-involved individuals." },
      { id: "hr-management", role: "Competency modeling for emerging industries (telehealth, renewable energy, remote tech). Career pathway mapping from assessment to placement to retention." },
      { id: "io-psychology", role: "Motivation and engagement systems for long-term unemployed. Combating learned helplessness through achievable milestone design." },
    ],
    platforms: ["ThriveUp", "MCE", "LifeBridge", "M2C Transition", "Workforce Dashboard", "Career Explorer"],
    threeRealities: {
      research: "WIOA Title I workforce development frameworks. Competency-based education models. Sectoral employment strategies with demonstrated ROI.",
      politics: "WIOA performance accountability measures. State workforce board priorities may not align with local needs. Employer tax incentives for hiring qualified candidates.",
      ground: "Transportation barriers limit access to training centers. Broadband gaps affect online learning. Generational identity tied to defunct industries creates resistance to retraining.",
    },
  },
  {
    id: "reentry-support",
    title: "Reentry & Recidivism Reduction",
    subtitle: "Second Chance Act Programs",
    icon: Scale,
    setting: "Metropolitan Area",
    problem: "High recidivism rates driven by lack of housing, employment, and behavioral health support upon release. Fragmented service delivery across corrections, probation, and community organizations.",
    disciplines: [
      { id: "implementation-science", role: "EPIS framework structures the transition from institution to community. Fidelity tracking ensures evidence-based reentry practices are followed." },
      { id: "criminal-justice", role: "Risk-Needs-Responsivity assessment drives individualized reentry plans. Restorative justice and victim-offender mediation address community harm." },
      { id: "hr-management", role: "Workforce readiness assessment, credential recovery, employer engagement, and job placement with 90-day retention tracking." },
      { id: "io-psychology", role: "Cognitive-behavioral intervention design. Motivation interviewing training for case managers. Engagement systems that sustain participation through the critical first 90 days." },
    ],
    platforms: ["ThriveUp", "LifeBridge", "SafeReport", "Reentry Dashboard", "Case Management", "Outcome Reporting"],
    threeRealities: {
      research: "Risk-Needs-Responsivity (RNR) model. SAMHSA's GAINS Center guidelines. National Institute of Justice reentry research. Cognitive-behavioral therapy evidence base.",
      politics: "Second Chance Act funding requirements. State sentencing reform landscape. Ban-the-box policies vary by jurisdiction. Victims' rights considerations in restorative programs.",
      ground: "Housing is the #1 barrier — stable housing within 72 hours of release is critical. Family reunification complexity. Digital divide affects job search and service access. Stigma from employers and landlords.",
    },
  },
];

function CycleStepCard({ step, isExpanded, onToggle }: {
  step: typeof CYCLE_DETAILS[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = step.icon;
  return (
    <Card
      className={`transition-all duration-300 cursor-pointer hover-elevate ${isExpanded ? "ring-2 ring-primary/30" : ""}`}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`Step ${step.step}: ${step.title}. Click to ${isExpanded ? "collapse" : "expand"} details.`}
      data-testid={`card-cycle-step-${step.step}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={`rounded-full bg-gradient-to-br ${step.color} p-2.5 shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary">Step {step.step}</span>
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.subtitle}</p>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {step.disciplines.map((dId) => {
            const disc = DISCIPLINES.find(dd => dd.id === dId);
            return disc ? (
              <span key={dId} className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${disc.color}`}>
                {disc.shortName}
              </span>
            ) : null;
          })}
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 border-t pt-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <div>
              <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Data Flows
              </h4>
              <ul className="space-y-1.5">
                {step.dataFlows.map((flow, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <span>{flow}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" /> Fidelity Markers
              </h4>
              <ul className="space-y-1.5">
                {step.fidelityMarkers.map((marker, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{marker}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Globe className="h-3 w-3" /> Active Platforms
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {step.platforms.map((p) => (
                  <span key={p} className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScenarioView({ scenario }: { scenario: typeof SCENARIO_CONFIGS[0] }) {
  const Icon = scenario.icon;
  return (
    <div className="space-y-6" data-testid={`scenario-${scenario.id}`}>
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-3 shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{scenario.title}</h3>
          <p className="text-sm text-muted-foreground">{scenario.subtitle} &middot; {scenario.setting}</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{scenario.problem}</p>
        </div>
      </div>

      <Card className="border-2 border-amber-300/50 dark:border-amber-700/50 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/10" data-testid={`card-three-realities-${scenario.id}`}>
        <CardContent className="p-5">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Three Realities Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FlaskConical className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">What Research Says</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{scenario.threeRealities.research}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">What Politics Allow</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{scenario.threeRealities.politics}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Compass className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">What Works on the Ground</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{scenario.threeRealities.ground}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenario.disciplines.map((d) => {
          const disc = DISCIPLINES.find(dd => dd.id === d.id);
          if (!disc) return null;
          const iconMap: Record<string, typeof Microscope> = { Microscope, Scale, Briefcase, Brain };
          const DIcon = iconMap[disc.icon] || Microscope;
          return (
            <Card key={d.id} className={`p-4 border ${disc.borderColor}`} data-testid={`card-scenario-discipline-${d.id}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-md p-2 shrink-0 ${disc.color}`}>
                  <DIcon className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-sm">{disc.name}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{d.role}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Activated Platforms</h4>
        <div className="flex flex-wrap gap-2">
          {scenario.platforms.map((p) => (
            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MapGapFrameworkPage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState("substance-prevention");

  return (
    <div className="min-h-screen">
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-gradient-to-b from-violet-50/50 to-transparent dark:from-violet-950/20" data-testid="section-framework-hero">
        <div className="mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-4">
            <RefreshCw className="mr-1 h-3 w-3" /> Proprietary Methodology
          </Badge>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold" data-testid="text-framework-heading">
              MAP-GAP: The Living Operating System
            </h1>
            <TrainingGuideButton moduleId="mapgap-framework" />
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
            MAP-GAP is the proprietary framework that brings homeostasis to community programs. Domain-agnostic, research-grounded, and built to adapt — it transforms any community challenge into a measurable, replicable intervention through four integrated academic disciplines.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {DISCIPLINES.map((d) => {
              const iconMap: Record<string, typeof Microscope> = { Microscope, Scale, Briefcase, Brain };
              const DIcon = iconMap[d.icon] || Microscope;
              return (
                <span key={d.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${d.color}`}>
                  <DIcon className="h-3 w-3" />
                  {d.name}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-cycle">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-cycle-heading">
              The 6-Step Continuous Cycle
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Click any step to see the disciplines that activate, the data that flows, the platforms that engage, and the fidelity markers that ensure quality.
            </p>
          </div>

          <Card className="p-4 sm:p-6 mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" data-testid="card-cycle-flow">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm">
              {CYCLE_DETAILS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedStep(expandedStep === step.step ? null : step.step); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs sm:text-sm font-semibold cursor-pointer ${
                        expandedStep === step.step
                          ? "bg-primary text-primary-foreground shadow-md scale-105"
                          : `${step.badgeColor} hover:scale-105`
                      }`}
                      data-testid={`button-cycle-step-${step.step}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">Step {step.step}</span>
                    </button>
                    {idx < CYCLE_DETAILS.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Continuous cycle — Step 6 feeds back into Step 1
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CYCLE_DETAILS.map((step) => (
              <CycleStepCard
                key={step.step}
                step={step}
                isExpanded={expandedStep === step.step}
                onToggle={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card" data-testid="section-three-realities">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Layers className="mr-1 h-3 w-3" /> The Adaptation Engine
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-three-realities-heading">
              Three Realities: Why Programs Fail Without Adaptation
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Most programs fail not because the research was wrong, but because implementation ignored political constraints and ground-level realities. Three Realities prevents the most common failure mode in community programs: great idea, terrible execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-2 border-blue-300/50 dark:border-blue-700/50" data-testid="card-reality-research">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-3 w-fit mb-4">
                <FlaskConical className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-base mb-2">What Research Says</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The evidence base, the proven frameworks, the academic foundation. CFIR, RE-AIM, EPIS, RNR — peer-reviewed research that establishes what can work.
              </p>
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Examples:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" /> Evidence-based prevention curricula</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" /> Risk-Needs-Responsivity assessment models</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" /> Competency-based education frameworks</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 border-2 border-purple-300/50 dark:border-purple-700/50" data-testid="card-reality-politics">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-3 w-fit mb-4">
                <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-base mb-2">What Politics Allow</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Regulatory landscape, funding constraints, institutional dynamics, community politics. The research may say one thing, but the system may only allow something different.
              </p>
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">Examples:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" /> Grant compliance requirements</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" /> State sentencing reform landscape</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" /> Workforce board priorities and mandates</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 border-2 border-emerald-300/50 dark:border-emerald-700/50" data-testid="card-reality-ground">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 p-3 w-fit mb-4">
                <Compass className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-base mb-2">What Works on the Ground</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lived experience, cultural context, community assets, practical feasibility. The ultimate test — does it work for real people in real communities?
              </p>
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Examples:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" /> Transportation barriers to service access</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" /> Cultural preferences for program delivery</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" /> Existing community assets and organizations</li>
                </ul>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-2.5 shrink-0">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Why Three Realities Matters</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A program that works in Chicago may fail in rural Appalachia — not because the research was wrong, but because the political and ground-level realities are different. Three Realities forces <strong>adaptation, not adoption</strong>. This is why the ecosystem can work anywhere without becoming a franchise. Every community gets a program designed for its unique context.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-methodology-registry">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="mr-1 h-3 w-3" /> Intellectual Property
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-methodology-heading">
              Proprietary Methodology Registry
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Four interconnected methodologies developed by TCAF leadership — each solving a specific failure mode in community programs, together forming a complete operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {METHODOLOGY_REGISTRY.map((method) => {
              const Icon = method.icon;
              return (
                <Card key={method.id} className={`p-6 border-2 ${method.borderColor}`} data-testid={`card-methodology-${method.id}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`rounded-md p-2.5 shrink-0 ${method.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{method.name}</h3>
                      <p className="text-xs text-muted-foreground">{method.fullName}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-primary mb-1">Purpose</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{method.purpose}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-primary mb-1">How It Works</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{method.howItWorks}</p>
                    </div>
                    <div className="pt-3 border-t">
                      <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Why It Matters</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{method.whyItMatters}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="mt-8 p-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <div className="text-center">
              <h3 className="font-bold text-base mb-2">How They Connect</h3>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="px-3 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 font-semibold">MAP-GAP</span>
                <span className="text-muted-foreground">runs the cycle</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold">Three Realities</span>
                <span className="text-muted-foreground">adapts the design</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold">SALP</span>
                <span className="text-muted-foreground">tracks fidelity</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold">MG-PATR</span>
                <span className="text-muted-foreground">captures & replicates</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card" data-testid="section-in-action">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Eye className="mr-1 h-3 w-3" /> Proven Across Domains
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-in-action-heading">
              MAP-GAP in Action
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              The same framework, adapted to three fundamentally different problems. This is what domain-agnostic means — the methodology works for any community challenge when applied through the Three Realities.
            </p>
          </div>

          <Tabs value={activeScenario} onValueChange={setActiveScenario} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              {SCENARIO_CONFIGS.map((s) => {
                const Icon = s.icon;
                return (
                  <TabsTrigger key={s.id} value={s.id} className="text-xs sm:text-sm" data-testid={`tab-scenario-${s.id}`}>
                    <Icon className="h-3.5 w-3.5 mr-1.5 hidden sm:block" />
                    <span className="truncate">{s.title}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {SCENARIO_CONFIGS.map((s) => (
              <TabsContent key={s.id} value={s.id}>
                <ScenarioView scenario={s} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-cta">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            From Theory to Working Tool
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-xl mx-auto">
            MAP-GAP isn't just a framework — it's a working system. The MAP-GAP CQI Engine turns this methodology into an operational tool where you can run improvement cycles, track fidelity, and measure outcomes in real time.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/cqi">
              <Button size="lg" data-testid="button-go-to-cqi">
                <Activity className="mr-2 h-4 w-4" />
                Open MAP-GAP CQI Tool
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" data-testid="button-back-to-home">
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
