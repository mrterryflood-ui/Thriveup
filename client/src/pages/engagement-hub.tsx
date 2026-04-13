import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, Users, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Flame, Heart, MessageCircle, Mail, Phone, Calendar,
  Target, BarChart3, UserCheck, UserX, RefreshCw, Send,
  Shield, Zap, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

interface ParticipantEngagement {
  id: string;
  name: string;
  program: string;
  enrollmentDate: string;
  lastActivity: string;
  daysInactive: number;
  lessonsCompleted: number;
  totalLessons: number;
  currentModule: number;
  streakDays: number;
  engagementScore: number;
  riskLevel: "healthy" | "at_risk" | "disengaging" | "inactive";
  contactMethod: string;
  nudgesSent: number;
  lastNudgeDate: string | null;
}

interface EngagementMetrics {
  totalActive: number;
  totalAtRisk: number;
  totalDisengaging: number;
  totalInactive: number;
  avgCompletionRate: number;
  avgStreakDays: number;
  avgEngagementScore: number;
  retentionRate: number;
  weekOverWeekChange: number;
  nudgesSentThisWeek: number;
  nudgeResponseRate: number;
  completionsByModule: Record<string, number>;
}

const RISK_CONFIG = {
  healthy: { label: "On Track", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2, dotColor: "bg-emerald-500" },
  at_risk: { label: "At Risk", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: AlertTriangle, dotColor: "bg-amber-500" },
  disengaging: { label: "Disengaging", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", icon: Clock, dotColor: "bg-orange-500" },
  inactive: { label: "Inactive", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: UserX, dotColor: "bg-red-500" },
};

const NUDGE_TEMPLATES = [
  { id: "check_in", label: "Friendly Check-In", message: "Hey {name}! Just checking in — we noticed you haven't been on ThriveUp in a few days. Everything okay? Your cohort is rooting for you. Drop in anytime, even for 10 minutes." },
  { id: "milestone", label: "Milestone Reminder", message: "Hey {name}! You're {percent}% through Module {module} — that's real progress. Just {remaining} more lessons to earn your next badge. You got this." },
  { id: "streak", label: "Streak Recovery", message: "Hey {name}! Your {streak}-day streak was impressive. Life happens, but don't let it stop your momentum. Log in today and pick up where you left off." },
  { id: "champion", label: "Champion Session", message: "Hey {name}! This week's live check-in features {champion} — they have an incredible story about getting their start. Don't miss it. {day} at {time}." },
  { id: "peer", label: "Peer Connection", message: "Hey {name}! Your cohort just hit a big milestone — {achievement}. They're waiting for you to catch up. Jump back in and let's keep moving together." },
  { id: "resume", label: "Resume Progress", message: "Hey {name}! Your resume is {percent}% done. Module {nextModule} adds your {section} section. That's the section employers look at first. Let's finish it." },
  { id: "barrier", label: "Barrier Support", message: "Hey {name}, we haven't seen you in a while and want to make sure you have what you need. If something is getting in the way — transportation, family stuff, anything — our Community Resource Directory can help. No judgment." },
  { id: "custom", label: "Custom Message", message: "" },
];

const PROGRAM_TYPES = [
  { id: "all", label: "All Programs" },
  { id: "workforce_readiness", label: "Workforce Readiness" },
  { id: "reentry", label: "Reentry Programs" },
  { id: "health_literacy", label: "Health Literacy" },
  { id: "youth_development", label: "Youth Development" },
  { id: "financial_literacy", label: "Financial Literacy" },
];

function generateDemoParticipants(): ParticipantEngagement[] {
  const names = [
    "Marcus Johnson", "Aaliyah Williams", "Sofia Rodriguez", "DeAndre Thompson",
    "Jaylen Davis", "Maria Garcia", "Deshawn Harris", "Keisha Brown",
    "Carlos Martinez", "Jasmine Wilson", "Tyler Jackson", "Brianna Moore",
    "Andre Taylor", "Diamond Anderson", "Xavier Thomas", "Destiny White",
  ];
  const programs = ["Workforce Readiness", "Reentry Cohort 1", "Youth Leadership", "Financial Literacy"];
  return names.map((name, i) => {
    const daysInactive = [0, 0, 1, 0, 2, 0, 4, 1, 7, 0, 12, 3, 0, 5, 0, 8][i];
    const lessonsCompleted = [14, 8, 11, 18, 6, 3, 9, 12, 2, 16, 1, 7, 20, 5, 15, 4][i];
    const streakDays = daysInactive === 0 ? [7, 12, 4, 21, 3, 1, 0, 8, 0, 15, 0, 5, 25, 0, 10, 0][i] : 0;
    const engagementScore = Math.max(10, Math.min(100, 100 - daysInactive * 8 + streakDays * 3));
    let riskLevel: ParticipantEngagement["riskLevel"] = "healthy";
    if (daysInactive >= 10) riskLevel = "inactive";
    else if (daysInactive >= 5) riskLevel = "disengaging";
    else if (daysInactive >= 3) riskLevel = "at_risk";
    return {
      id: `p_${i}`,
      name,
      program: programs[i % programs.length],
      enrollmentDate: `2026-0${1 + (i % 3)}-${10 + i}`,
      lastActivity: new Date(Date.now() - daysInactive * 86400000).toISOString().split("T")[0],
      daysInactive,
      lessonsCompleted,
      totalLessons: 20,
      currentModule: Math.min(5, Math.floor(lessonsCompleted / 4) + 1),
      streakDays,
      engagementScore,
      riskLevel,
      contactMethod: i % 3 === 0 ? "sms" : i % 3 === 1 ? "email" : "app",
      nudgesSent: Math.floor(daysInactive / 3),
      lastNudgeDate: daysInactive > 3 ? new Date(Date.now() - (daysInactive - 2) * 86400000).toISOString().split("T")[0] : null,
    };
  });
}

function MetricsOverview({ participants }: { participants: ParticipantEngagement[] }) {
  const healthy = participants.filter(p => p.riskLevel === "healthy").length;
  const atRisk = participants.filter(p => p.riskLevel === "at_risk").length;
  const disengaging = participants.filter(p => p.riskLevel === "disengaging").length;
  const inactive = participants.filter(p => p.riskLevel === "inactive").length;
  const avgCompletion = Math.round(participants.reduce((s, p) => s + (p.lessonsCompleted / p.totalLessons) * 100, 0) / participants.length);
  const avgStreak = Math.round(participants.reduce((s, p) => s + p.streakDays, 0) / participants.length);
  const retentionRate = Math.round(((participants.length - inactive) / participants.length) * 100);

  const kpis = [
    { label: "Active & On Track", value: healthy, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "At Risk", value: atRisk, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Disengaging", value: disengaging, icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "Inactive", value: inactive, icon: UserX, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Retention Rate", value: `${retentionRate}%`, icon: Shield, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Avg Completion", value: `${avgCompletion}%`, icon: Target, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Avg Streak", value: `${avgStreak}d`, icon: Flame, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "Total Enrolled", value: participants.length, icon: Users, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/30" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="engagement-metrics">
      {kpis.map(kpi => (
        <Card key={kpi.label} className={`p-4 ${kpi.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{kpi.label}</span>
          </div>
          <p className={`text-2xl font-bold ${kpi.color}`} data-testid={`metric-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>{kpi.value}</p>
        </Card>
      ))}
    </div>
  );
}

function DropoffAnalysis({ participants }: { participants: ParticipantEngagement[] }) {
  const moduleDropoff = [1, 2, 3, 4, 5].map(mod => ({
    module: mod,
    active: participants.filter(p => p.currentModule >= mod).length,
    dropped: participants.filter(p => p.currentModule === mod && p.riskLevel === "inactive").length,
  }));

  return (
    <Card className="p-5" data-testid="dropoff-analysis">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-500" /> Module Progression & Drop-off Points
      </h3>
      <div className="space-y-3">
        {moduleDropoff.map(md => {
          const pct = Math.round((md.active / participants.length) * 100);
          return (
            <div key={md.module} className="flex items-center gap-3">
              <span className="text-xs font-medium w-20 text-gray-600 dark:text-gray-400">Module {md.module}</span>
              <div className="flex-1">
                <Progress value={pct} className="h-4" />
              </div>
              <span className="text-xs font-medium w-16 text-right">{md.active}/{participants.length}</span>
              {md.dropped > 0 && (
                <Badge variant="outline" className="text-xs text-red-600 border-red-300">-{md.dropped}</Badge>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Drop-off typically happens in Modules 2-3 (weeks 4-9). Proactive nudges at this stage improve retention by 30-40%.
      </p>
    </Card>
  );
}

function NudgeCenter({ participants }: { participants: ParticipantEngagement[] }) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("check_in");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [nudgeMethod, setNudgeMethod] = useState<"sms" | "email" | "app">("app");

  const needsNudge = participants.filter(p => p.riskLevel !== "healthy");
  const template = NUDGE_TEMPLATES.find(t => t.id === selectedTemplate);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAllAtRisk = () => {
    setSelectedParticipants(needsNudge.map(p => p.id));
  };

  const sendNudges = () => {
    toast({
      title: `${selectedParticipants.length} nudge${selectedParticipants.length !== 1 ? "s" : ""} sent`,
      description: `Sent via ${nudgeMethod} using "${template?.label}" template.`,
    });
    setSelectedParticipants([]);
  };

  return (
    <Card className="p-5" data-testid="nudge-center">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-500" /> Re-Engagement Nudge Center
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Nudge Template</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {NUDGE_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                  selectedTemplate === t.id
                    ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"
                    : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                data-testid={`nudge-template-${t.id}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {template && template.id !== "custom" && (
            <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300">{template.message}</p>
            </div>
          )}
          {selectedTemplate === "custom" && (
            <Textarea
              placeholder="Type your custom message..."
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              rows={4}
              className="mt-3"
              data-testid="input-custom-nudge"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Participants Needing Nudge ({needsNudge.length})
            </p>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={selectAllAtRisk} data-testid="button-select-all-at-risk">
              Select All
            </Button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {needsNudge.map(p => {
              const risk = RISK_CONFIG[p.riskLevel];
              return (
                <button
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                    selectedParticipants.includes(p.id) ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-300" : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                  data-testid={`nudge-participant-${p.id}`}
                >
                  <div className={`w-2 h-2 rounded-full ${risk.dotColor} flex-shrink-0`} />
                  <span className="flex-1 text-left font-medium">{p.name}</span>
                  <span className="text-gray-400">{p.daysInactive}d inactive</span>
                  <Badge variant="outline" className="text-xs">{p.program.split(" ")[0]}</Badge>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className="flex gap-1">
              {(["app", "sms", "email"] as const).map(method => (
                <Button
                  key={method}
                  variant={nudgeMethod === method ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setNudgeMethod(method)}
                  data-testid={`button-method-${method}`}
                >
                  {method === "app" && <Bell className="w-3 h-3 mr-1" />}
                  {method === "sms" && <Phone className="w-3 h-3 mr-1" />}
                  {method === "email" && <Mail className="w-3 h-3 mr-1" />}
                  {method.toUpperCase()}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              className="ml-auto"
              disabled={selectedParticipants.length === 0}
              onClick={sendNudges}
              data-testid="button-send-nudges"
            >
              <Send className="w-3 h-3 mr-1" />
              Send ({selectedParticipants.length})
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ParticipantRoster({ participants, filter }: { participants: ParticipantEngagement[]; filter: string }) {
  const [search, setSearch] = useState("");

  const filtered = participants
    .filter(p => filter === "all" || p.riskLevel === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.program.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="participant-roster">
      <div className="flex items-center gap-3 mb-3">
        <Input
          placeholder="Search participants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs text-sm"
          data-testid="input-search-participants"
        />
        <span className="text-xs text-gray-500">{filtered.length} participants</span>
      </div>
      <div className="space-y-2">
        {filtered.map(p => {
          const risk = RISK_CONFIG[p.riskLevel];
          const completionPct = Math.round((p.lessonsCompleted / p.totalLessons) * 100);
          return (
            <Card key={p.id} className="p-3" data-testid={`participant-card-${p.id}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${risk.dotColor} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                    <Badge className={`text-xs ${risk.color}`}>{risk.label}</Badge>
                    <Badge variant="outline" className="text-xs">{p.program}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Module {p.currentModule}/5</span>
                    <span>{p.lessonsCompleted}/{p.totalLessons} lessons</span>
                    {p.streakDays > 0 && <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-500" />{p.streakDays}d streak</span>}
                    {p.daysInactive > 0 && <span className="text-red-500">{p.daysInactive}d inactive</span>}
                    <span>Score: {p.engagementScore}</span>
                  </div>
                </div>
                <div className="w-20">
                  <Progress value={completionPct} className="h-2" />
                  <p className="text-xs text-center text-gray-400 mt-0.5">{completionPct}%</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AutomationRules() {
  const rules = [
    { trigger: "3 days inactive", action: "Send 'Friendly Check-In' via preferred contact method", status: "active", icon: Clock },
    { trigger: "5 days inactive", action: "Send 'Barrier Support' message + flag for case manager review", status: "active", icon: AlertTriangle },
    { trigger: "7 days inactive", action: "Escalate to facilitator for personal outreach call", status: "active", icon: Phone },
    { trigger: "10 days inactive", action: "Mark as 'Disengaging' — trigger supervisor notification", status: "active", icon: UserX },
    { trigger: "14 days inactive", action: "Schedule re-engagement meeting with participant", status: "active", icon: Calendar },
    { trigger: "Streak reaches 7 days", action: "Send congratulations + badge notification", status: "active", icon: Flame },
    { trigger: "Module completed", action: "Send milestone celebration + next module preview", status: "active", icon: CheckCircle2 },
    { trigger: "Quiz score below 60%", action: "Suggest review materials + offer AI tutor session", status: "active", icon: Target },
    { trigger: "Resume section completed", action: "Send 'Resume Progress' update with preview", status: "active", icon: Zap },
  ];

  return (
    <Card className="p-5" data-testid="automation-rules">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-violet-500" /> Automated Engagement Rules
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        These rules run automatically to keep participants engaged and flag issues early.
        Applies to all programs running through ThriveUp.
      </p>
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <rule.icon className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white">When: {rule.trigger}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Then: {rule.action}</p>
            </div>
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">Active</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProgramAdaptability() {
  const capabilities = [
    {
      program: "Workforce Readiness (TWC, WIOA)",
      metrics: ["Module completion rate", "Resume completion", "Certificate attainment", "Employer satisfaction", "Job placement at 6 months"],
      tools: ["Resume Builder", "AI Mock Interview", "Career Pathways", "Certificate System"],
      retention: "15-week cohort model with weekly live check-ins and neighborhood champions",
    },
    {
      program: "Criminal Justice / Reentry",
      metrics: ["Recidivism rate", "Employment at 30/60/90 days", "Housing stability", "Service dosage hours", "Retention check compliance"],
      tools: ["Intake Wizard", "Service Delivery", "Job Readiness Checklist", "Retention Checks", "Transition Plans"],
      retention: "Case manager assigned, barrier-focused nudges, peer support integration",
    },
    {
      program: "Health Literacy / HerHealth",
      metrics: ["Health knowledge pre/post", "Screening completion", "Resource utilization", "SDOH barrier reduction", "CHW engagement hours"],
      tools: ["Whole-Person Health", "SpeechBridge", "SDOH Explorer", "CHW Dashboard", "Community Resources"],
      retention: "CHW-led check-ins, culturally responsive content, family engagement portal",
    },
    {
      program: "Youth Development / Education",
      metrics: ["Academic progress", "SEL skill growth", "Attendance rate", "Parent engagement", "Credential completion"],
      tools: ["Academy Hub", "Curriculum Delivery", "Parent Dashboard", "Badge System", "STAAR Prep"],
      retention: "Gamified progression, peer competition, parent dashboard visibility, streak rewards",
    },
    {
      program: "Financial Literacy",
      metrics: ["Budget creation rate", "Savings behavior change", "Credit score improvement", "Financial goal achievement"],
      tools: ["Financial Literacy Hub", "Academy Wallet", "Simulated Economy", "Career Pathways"],
      retention: "Real-money simulation engagement, milestone-based rewards, practical application exercises",
    },
  ];

  return (
    <Card className="p-5" data-testid="program-adaptability">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-blue-500" /> Program-Agnostic Execution Readiness
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Every grant that executes through ThriveUp uses the same core infrastructure, adapted to its specific requirements.
        This table shows what tools and metrics are ready for each program type.
      </p>
      <div className="space-y-4">
        {capabilities.map(cap => (
          <div key={cap.program} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">{cap.program}</h4>
            <div className="grid md:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Key Metrics</p>
                {cap.metrics.map(m => (
                  <div key={m} className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />{m}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Platform Tools</p>
                {cap.tools.map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <Zap className="w-3 h-3 text-blue-500 flex-shrink-0" />{t}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Retention Strategy</p>
                <p className="text-gray-700 dark:text-gray-300">{cap.retention}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function EngagementHubPage() {
  const [riskFilter, setRiskFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const participants = generateDemoParticipants();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 mb-2">
            Engagement & Retention Engine
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Participant Engagement Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor engagement, prevent dropout, and keep participants progressing across all programs.
            Program-agnostic — works for workforce, reentry, health, education, and any grant executed through ThriveUp.
          </p>
        </div>

        <MetricsOverview participants={participants} />

        <Tabs defaultValue="monitor" className="space-y-4">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="monitor" data-testid="tab-monitor">Monitor</TabsTrigger>
            <TabsTrigger value="nudge" data-testid="tab-nudge">Re-Engage</TabsTrigger>
            <TabsTrigger value="automation" data-testid="tab-automation">Automation</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis">Drop-off Analysis</TabsTrigger>
            <TabsTrigger value="readiness" data-testid="tab-readiness">Program Readiness</TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "healthy", label: "On Track" },
                { id: "at_risk", label: "At Risk" },
                { id: "disengaging", label: "Disengaging" },
                { id: "inactive", label: "Inactive" },
              ].map(f => (
                <Button
                  key={f.id}
                  variant={riskFilter === f.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRiskFilter(f.id)}
                  data-testid={`filter-${f.id}`}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <ParticipantRoster participants={participants} filter={riskFilter} />
          </TabsContent>

          <TabsContent value="nudge">
            <NudgeCenter participants={participants} />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationRules />
          </TabsContent>

          <TabsContent value="analysis">
            <DropoffAnalysis participants={participants} />
          </TabsContent>

          <TabsContent value="readiness">
            <ProgramAdaptability />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
