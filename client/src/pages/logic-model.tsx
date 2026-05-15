import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PillarFlowNav } from "@/components/dfc-cross-nav";
import {
  ArrowRight, Download, Users, Activity, BarChart3,
  Target, TrendingUp, Heart, Briefcase, GraduationCap, Shield,
  CheckCircle2, Layers, Zap
} from "lucide-react";

interface LogicModelData {
  totalParticipants: number;
  activeParticipants: number;
  totalServices: number;
  totalServiceHours: number;
  totalOutcomes: number;
  outcomesByCategory: Record<string, number>;
}

const LOGIC_MODEL_COLUMNS = [
  {
    title: "Inputs",
    color: "bg-indigo-700",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    icon: Users,
    items: [
      { label: "Federal/state grant funding (WIOA, OJJDP, SAMHSA)", dataKey: null },
      { label: "ThriveUp technology platform (15-service-platform ACOS)", dataKey: null },
      { label: "Enrolled participants", dataKey: "totalParticipants" },
      { label: "Trained staff, case managers, navigators", dataKey: null },
      { label: "Community partner network (20+ agencies)", dataKey: null },
      { label: "Advisory board with lived experience representation", dataKey: null },
      { label: "Employer partnerships via MCE", dataKey: null },
    ],
  },
  {
    title: "Activities",
    color: "bg-violet-600",
    borderColor: "border-violet-200 dark:border-violet-800",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    icon: Activity,
    items: [
      { label: "Career pathway exploration (50+ pathways)", dataKey: null },
      { label: "AI-powered digital literacy training", dataKey: null },
      { label: "Individual case management & goal-setting", dataKey: null },
      { label: "Behavioral health screening (PHQ-9, GAD-7)", dataKey: null },
      { label: "Service encounters delivered", dataKey: "totalServices" },
      { label: "Employer partnership coordination", dataKey: null },
      { label: "Mentoring and peer support groups", dataKey: null },
    ],
  },
  {
    title: "Outputs",
    color: "bg-blue-600",
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    icon: BarChart3,
    items: [
      { label: "Service hours delivered", dataKey: "totalServiceHours" },
      { label: "Career readiness assessments completed", dataKey: null },
      { label: "Job placements facilitated", dataKey: null },
      { label: "Industry credentials & certifications earned", dataKey: null },
      { label: "Outcomes measured and tracked", dataKey: "totalOutcomes" },
      { label: "DOJ/DOL-aligned performance reports", dataKey: null },
      { label: "Thrive Score evaluations conducted", dataKey: null },
    ],
  },
  {
    title: "Short-Term Outcomes",
    color: "bg-emerald-600",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: Target,
    items: [
      { label: "Increased job readiness scores", dataKey: null },
      { label: "Improved digital literacy proficiency", dataKey: null },
      { label: "Stabilized housing and health access", dataKey: null },
      { label: "Reduced recidivism at 6 months", dataKey: null },
      { label: "Enrollment in education/training programs", dataKey: null },
      { label: "Enhanced coping and self-regulation skills", dataKey: null },
    ],
  },
  {
    title: "Long-Term Impact",
    color: "bg-amber-600",
    borderColor: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    icon: TrendingUp,
    items: [
      { label: "Sustained employment (12+ months)", dataKey: null },
      { label: "Economic self-sufficiency", dataKey: null },
      { label: "Active community contribution", dataKey: null },
      { label: "Reduced recidivism at 36 months", dataKey: null },
      { label: "Career advancement and wage growth", dataKey: null },
      { label: "Generational impact and family stability", dataKey: null },
    ],
  },
];

const PILLAR_PHASES = [
  {
    name: "Relief",
    description: "Immediate stabilization: housing, food, safety, crisis intervention, intake assessment",
    color: "bg-amber-500",
    icon: Heart,
    timeframe: "Weeks 1-4",
    services: [
      "Crisis intervention and safety planning",
      "Emergency housing and food access coordination",
      "Intake assessment and needs identification",
      "Benefits enrollment support",
      "Initial case plan development",
      "Family engagement and stabilization",
    ],
  },
  {
    name: "Stabilize",
    description: "Skill building: education, training, behavioral health, mentoring, goal-setting",
    color: "bg-blue-500",
    icon: GraduationCap,
    timeframe: "Months 2-6",
    services: [
      "Career pathway assessment and exploration",
      "Digital literacy and AI skills training",
      "Behavioral health counseling sessions",
      "Educational support and tutoring",
      "Mentoring and peer support groups",
      "Financial literacy and budgeting skills",
    ],
  },
  {
    name: "Contribute",
    description: "Career pathways, employment, community engagement, leadership development",
    color: "bg-emerald-500",
    icon: Briefcase,
    timeframe: "Months 6-12+",
    services: [
      "Job placement and employer connections",
      "Industry certification programs",
      "Community leadership opportunities",
      "Alumni network engagement",
      "Post-placement follow-up support",
      "Transition to independence planning",
    ],
  },
];

const THRIVE_DOMAINS = [
  { domain: "Cognitive", description: "Critical thinking, problem-solving, decision-making capacity", color: "text-indigo-600" },
  { domain: "Social-Emotional", description: "Relationship skills, self-awareness, emotional regulation", color: "text-violet-600" },
  { domain: "Behavioral", description: "Self-management, accountability, risk-reduction behaviors", color: "text-blue-600" },
  { domain: "Educational", description: "Academic progress, learning engagement, skill acquisition", color: "text-emerald-600" },
  { domain: "Career", description: "Career readiness, workplace skills, employment progress", color: "text-amber-600" },
  { domain: "Health", description: "Physical wellness, mental health, substance use recovery", color: "text-rose-600" },
];

export default function LogicModelPage() {
  const { toast } = useToast();
  const [activePhase, setActivePhase] = useState<string | null>(null);

  const { data: modelData, isLoading } = useQuery<LogicModelData>({
    queryKey: ["/api/logic-model/data"],
  });

  const handleExportPDF = async () => {
    try {
      const res = await fetch("/api/logic-model/export-pdf", { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ThriveUp_Logic_Model.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Logic model exported as PDF" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const getDataValue = (key: string | null): number | null => {
    if (!key || !modelData) return null;
    return (modelData as unknown as Record<string, unknown>)[key] as number ?? null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-logic-model-title">Logic Model</h1>
          <p className="text-muted-foreground mt-1">ThriveUp Theory of Change: Relief, Stabilize, Contribute</p>
        </div>
        <Button onClick={handleExportPDF} data-testid="button-export-logic-model">
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-3 text-center">
              <Skeleton className="h-7 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </Card>
          ))}
        </div>
      ) : modelData ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center" data-testid="stat-participants">
            <p className="text-xl font-bold text-indigo-600">{modelData.totalParticipants.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Participants Enrolled</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-active">
            <p className="text-xl font-bold text-violet-600">{modelData.activeParticipants.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Currently Active</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-services">
            <p className="text-xl font-bold text-blue-600">{modelData.totalServices.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Service Encounters</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-hours">
            <p className="text-xl font-bold text-emerald-600">{modelData.totalServiceHours.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Service Hours</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-outcomes">
            <p className="text-xl font-bold text-amber-600">{modelData.totalOutcomes.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Outcomes Tracked</p>
          </Card>
        </div>
      ) : null}

      <Card className="p-5" data-testid="card-three-pillars">
        <h2 className="font-semibold text-lg mb-4">Three-Pillar Framework</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLAR_PHASES.map((phase) => {
            const Icon = phase.icon;
            const isActive = activePhase === phase.name;
            return (
              <button
                key={phase.name}
                onClick={() => setActivePhase(isActive ? null : phase.name)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
                data-testid={`button-pillar-${phase.name.toLowerCase()}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`${phase.color} rounded-md p-2`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{phase.name}</h3>
                      <p className="text-xs text-muted-foreground">{phase.timeframe}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                {isActive && (
                  <div className="space-y-1.5 pt-2 border-t">
                    {phase.services.map((service) => (
                      <div key={service} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 overflow-x-auto" data-testid="card-logic-model-flow">
        <h2 className="font-semibold text-lg mb-4">Program Logic Model Flow</h2>
        <div className="flex gap-2 min-w-[900px]">
          {LOGIC_MODEL_COLUMNS.map((col, colIdx) => {
            const Icon = col.icon;
            return (
              <div key={col.title} className="flex items-start gap-2">
                <div className="flex-1 min-w-[160px]">
                  <div className={`${col.color} text-white text-center py-2 px-3 rounded-t-lg font-semibold text-sm flex items-center justify-center gap-2`}>
                    <Icon className="h-4 w-4" />
                    {col.title}
                  </div>
                  <div className={`${col.bgColor} ${col.borderColor} border rounded-b-lg p-2 space-y-1.5`}>
                    {col.items.map((item) => {
                      const dataVal = getDataValue(item.dataKey);
                      return (
                        <div
                          key={item.label}
                          className="bg-background rounded p-2 text-xs border flex items-center justify-between gap-1"
                        >
                          <span>{item.label}</span>
                          {dataVal !== null && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {dataVal.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {colIdx < LOGIC_MODEL_COLUMNS.length - 1 && (
                  <div className="flex items-center pt-20">
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5" data-testid="card-thrive-scoring">
        <h2 className="font-semibold text-lg mb-1">Six-Domain Thrive Scoring Framework</h2>
        <p className="text-sm text-muted-foreground mb-4">Continuous outcome measurement across all participant development domains, aligned with DOJ PMT requirements</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {THRIVE_DOMAINS.map((d) => (
            <div key={d.domain} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <Layers className={`h-4 w-4 ${d.color} shrink-0`} />
                <p className="font-semibold text-sm">{d.domain}</p>
              </div>
              <p className="text-xs text-muted-foreground">{d.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {modelData && Object.keys(modelData.outcomesByCategory).length > 0 && (
        <Card className="p-5" data-testid="card-outcomes-breakdown">
          <h2 className="font-semibold text-lg mb-4">Outcomes by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(modelData.outcomesByCategory).map(([category, count]) => (
              <div key={category} className="p-3 rounded-lg bg-muted text-center">
                <p className="text-lg font-bold text-primary">{count}</p>
                <p className="text-xs text-muted-foreground capitalize">{category.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5" data-testid="card-evidence-base">
          <h2 className="font-semibold text-lg mb-3">Evidence-Based Practices</h2>
          <div className="space-y-2">
            {[
              { practice: "Cognitive Behavioral Interventions (CBI)", detail: "Structured cognitive restructuring for decision-making" },
              { practice: "Motivational Interviewing (MI)", detail: "Client-centered approach to behavioral change" },
              { practice: "Trauma-Informed Care (TIC)", detail: "Safety, trustworthiness, peer support, empowerment" },
              { practice: "Positive Youth Development (PYD)", detail: "Strengths-based youth engagement and skill-building" },
              { practice: "Risk-Need-Responsivity (RNR)", detail: "Evidence-based assessment-driven service matching" },
            ].map((item) => (
              <div key={item.practice} className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{item.practice}</span>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5" data-testid="card-federal-alignment">
          <h2 className="font-semibold text-lg mb-3">Federal Alignment</h2>
          <div className="space-y-2">
            {[
              { alignment: "WIOA Title I Youth Program Elements (14/14)", detail: "All required elements addressed through platform services" },
              { alignment: "OJJDP Second Chance Act Requirements", detail: "Reentry planning, case management, recidivism tracking" },
              { alignment: "SAMHSA Community Mental Health Standards", detail: "Behavioral health integration with substance use screening" },
              { alignment: "DOJ Performance Measurement Tool (PMT)", detail: "Aligned data collection and outcome reporting" },
              { alignment: "Six-Domain Thrive Scoring Framework", detail: "Comprehensive participant development measurement" },
            ].map((item) => (
              <div key={item.alignment} className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                <Target className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{item.alignment}</span>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5" data-testid="card-ecosystem-integration">
        <h2 className="font-semibold text-lg mb-1">Ecosystem Integration Points</h2>
        <p className="text-sm text-muted-foreground mb-4">How the 15-service-platform ACOS architecture supports logic model outcomes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-blue-600" /> Workforce Platforms</h3>
            {["ThriveUp Academy (youth services)", "MCE (employer partnerships)", "M2C (veteran transitions)", "APEX Accelerator (gov contracting)"].map((p) => (
              <div key={p} className="text-xs p-2 bg-muted rounded">{p}</div>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-600" /> Health Platforms</h3>
            {["Whole-Person Health (behavioral health)", "Sankofa Health Network (health equity)", "HerHealth Network (women's health)", "SafeCogniCare (cognitive safety)"].map((p) => (
              <div key={p} className="text-xs p-2 bg-muted rounded">{p}</div>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-violet-600" /> Support Platforms</h3>
            {["LifeBridge (community resources)", "SafeReport (mandatory reporting)", "Talk Your Talk (communication access)", "Better Science Lab (evaluation)"].map((p) => (
              <div key={p} className="text-xs p-2 bg-muted rounded">{p}</div>
            ))}
          </div>
        </div>
      </Card>

      <PillarFlowNav currentStep="logic-model" />
    </div>
  );
}
