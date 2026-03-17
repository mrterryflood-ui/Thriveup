import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Download, Users, Activity, BarChart3,
  Target, TrendingUp, Heart, Briefcase, GraduationCap, Shield
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
      { label: "Federal/state grant funding", dataKey: null },
      { label: "ThriveUp technology platform", dataKey: null },
      { label: "Enrolled participants", dataKey: "totalParticipants" },
      { label: "Trained staff & case managers", dataKey: null },
      { label: "Community partner network", dataKey: null },
      { label: "Advisory board (community voice)", dataKey: null },
    ],
  },
  {
    title: "Activities",
    color: "bg-violet-600",
    borderColor: "border-violet-200 dark:border-violet-800",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    icon: Activity,
    items: [
      { label: "Career pathway exploration (50+)", dataKey: null },
      { label: "AI-powered skills training", dataKey: null },
      { label: "Case management & mentoring", dataKey: null },
      { label: "Behavioral health screening", dataKey: null },
      { label: "Service encounters", dataKey: "totalServices" },
      { label: "Employer partnership development", dataKey: null },
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
      { label: "Career readiness assessments", dataKey: null },
      { label: "Job placements facilitated", dataKey: null },
      { label: "Credentials & certifications", dataKey: null },
      { label: "Outcomes tracked", dataKey: "totalOutcomes" },
      { label: "DOJ-aligned reports generated", dataKey: null },
    ],
  },
  {
    title: "Short-Term Outcomes",
    color: "bg-emerald-600",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: Target,
    items: [
      { label: "Increased job readiness", dataKey: null },
      { label: "Improved digital literacy", dataKey: null },
      { label: "Stabilized housing/health", dataKey: null },
      { label: "Reduced recidivism (6-mo)", dataKey: null },
      { label: "Educational enrollment", dataKey: null },
      { label: "Enhanced coping skills", dataKey: null },
    ],
  },
  {
    title: "Long-Term Outcomes",
    color: "bg-red-600",
    borderColor: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    icon: TrendingUp,
    items: [
      { label: "Sustained employment", dataKey: null },
      { label: "Economic self-sufficiency", dataKey: null },
      { label: "Community contribution", dataKey: null },
      { label: "Reduced recidivism (36-mo)", dataKey: null },
      { label: "Career advancement", dataKey: null },
      { label: "Generational impact", dataKey: null },
    ],
  },
];

const PILLAR_PHASES = [
  { name: "Relief", description: "Immediate stabilization: housing, food, safety, crisis intervention", color: "bg-amber-500", icon: Heart },
  { name: "Stabilize", description: "Skill building: education, training, behavioral health, mentoring", color: "bg-blue-500", icon: GraduationCap },
  { name: "Contribute", description: "Career pathways, employment, community engagement, leadership", color: "bg-emerald-500", icon: Briefcase },
];

export default function LogicModelPage() {
  const { toast } = useToast();
  const [activePhase, setActivePhase] = useState<string | null>(null);

  const { data: modelData } = useQuery<LogicModelData>({
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
    return (modelData as Record<string, unknown>)[key] as number ?? null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-logic-model-title">Logic Model</h1>
          <p className="text-muted-foreground mt-1">ThriveUp Theory of Change: Relief → Stabilize → Contribute</p>
        </div>
        <Button onClick={handleExportPDF} data-testid="button-export-logic-model">
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

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
                  isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                }`}
                data-testid={`button-pillar-${phase.name.toLowerCase()}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${phase.color} rounded-md p-2`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">{phase.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {modelData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center" data-testid="stat-participants">
            <p className="text-xl font-bold text-indigo-600">{modelData.totalParticipants}</p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-active">
            <p className="text-xl font-bold text-violet-600">{modelData.activeParticipants}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-services">
            <p className="text-xl font-bold text-blue-600">{modelData.totalServices}</p>
            <p className="text-xs text-muted-foreground">Services</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-hours">
            <p className="text-xl font-bold text-emerald-600">{modelData.totalServiceHours}</p>
            <p className="text-xs text-muted-foreground">Service Hours</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-outcomes">
            <p className="text-xl font-bold text-red-600">{modelData.totalOutcomes}</p>
            <p className="text-xs text-muted-foreground">Outcomes</p>
          </Card>
        </div>
      )}

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

      <Card className="p-5" data-testid="card-evidence-base">
        <h2 className="font-semibold text-lg mb-3">Evidence Base & Alignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Evidence-Based Practices</h3>
            {[
              "Cognitive Behavioral Interventions (CBI)",
              "Motivational Interviewing (MI)",
              "Trauma-Informed Care (TIC)",
              "Positive Youth Development (PYD)",
              "Workforce Innovation & Opportunity Act alignment",
            ].map((practice) => (
              <div key={practice} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                {practice}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Federal Alignment</h3>
            {[
              "WIOA Title I Youth Program Elements (14/14)",
              "OJJDP Second Chance Act Requirements",
              "SAMHSA Community Mental Health Standards",
              "DOJ Performance Measurement Tool (PMT)",
              "Six-Domain Thrive Scoring Framework",
            ].map((alignment) => (
              <div key={alignment} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <Target className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                {alignment}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
