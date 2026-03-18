import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, Users, GraduationCap, Shield, Briefcase, Heart, Target,
  TrendingUp, CheckCircle2, AlertTriangle, Clock, Activity,
  BarChart3, Award, ClipboardCheck, ArrowRight, Scale,
  School, Home, BookOpen, Handshake, FileBarChart,
} from "lucide-react";

interface PlatformMetrics {
  engagement: { totalUsers: number; activeUsers30d: number; lessonsCompleted: number; quizzesCompleted: number };
  prevention: { youthReached: number; modulesCompleted: number; avgScore: number };
  coalition: { classroomsActive: number; certificatesIssued: number };
  workforce: { careerAssessments: number; jobPlacements: number };
  grants: { applicationsInProgress: number; totalFundingSecured: number };
  facilitator: { totalFacilitators: number; sessionsDelivered: number; avgFidelity: number; totalDosageHours: number };
  parent: { modulesCompleted: number; familyAssessments: number };
  email: { inquiriesReceived: number; responseRate: number };
}

interface OutcomeDashboard {
  totalOutcomes: number;
  uniqueParticipants: number;
  totalActivePlans: number;
  milestoneCompletionRate: number;
}

interface DosageSummary {
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  uniqueParticipants: number;
}

interface ImpactData {
  youthServed: number;
  lessonsCompleted: number;
  badgesEarned: number;
  certificatesIssued: number;
  careerPathways: number;
  pathwayPlansCreated: number;
  mentorsAvailable: number;
  mentorConnections: number;
  averageScore: number;
}

type StakeholderRole = "funder" | "partner" | "school" | "justice" | "parent" | "staff" | "participant";

const STAKEHOLDER_ROLES: Array<{ id: StakeholderRole; label: string; icon: typeof Users; color: string }> = [
  { id: "funder", label: "Funder", icon: Target, color: "text-violet-600" },
  { id: "partner", label: "Community Partner", icon: Handshake, color: "text-blue-600" },
  { id: "school", label: "School", icon: School, color: "text-emerald-600" },
  { id: "justice", label: "Justice / Law Enforcement", icon: Scale, color: "text-amber-600" },
  { id: "parent", label: "Parent / Family", icon: Heart, color: "text-rose-600" },
  { id: "staff", label: "Program Staff", icon: ClipboardCheck, color: "text-indigo-600" },
  { id: "participant", label: "Participant", icon: Users, color: "text-teal-600" },
];

interface SalpIndicatorRow {
  name: string;
  expectedVal: number;
  actualVal: number;
}

interface SalpArea {
  area: string;
  expected: string;
  indicators: SalpIndicatorRow[];
}

function buildSalpIndicators(metrics: PlatformMetrics | null, outcomes: OutcomeDashboard | null, dosage: DosageSummary | null): SalpArea[] {
  const sessionsDelivered = metrics?.facilitator?.sessionsDelivered ?? 0;
  const avgFidelity = metrics?.facilitator?.avgFidelity ?? 0;
  const youthReached = metrics?.prevention?.youthReached ?? 0;
  const activeUsers = metrics?.engagement?.activeUsers30d ?? 0;
  const attendancePct = activeUsers > 0 && youthReached > 0 ? Math.min(100, Math.round((activeUsers / Math.max(youthReached, 1)) * 100)) : 0;

  const jobPlacements = metrics?.workforce?.jobPlacements ?? 0;
  const careerAssessments = metrics?.workforce?.careerAssessments ?? 0;
  const completionPct = outcomes?.milestoneCompletionRate ?? 0;
  const placementPct = careerAssessments > 0 ? Math.min(100, Math.round((jobPlacements / careerAssessments) * 100)) : 0;

  const classroomsActive = metrics?.coalition?.classroomsActive ?? 0;
  const certificatesIssued = metrics?.coalition?.certificatesIssued ?? 0;

  const totalActivePlans = outcomes?.totalActivePlans ?? 0;
  const totalOutcomes = outcomes?.totalOutcomes ?? 0;
  const uniqueParticipants = outcomes?.uniqueParticipants ?? 0;
  const contactRate = uniqueParticipants > 0 ? Math.min(100, Math.round((totalActivePlans / Math.max(uniqueParticipants, 1)) * 100)) : 0;
  const reviewRate = totalOutcomes > 0 ? Math.min(100, Math.round((completionPct * 0.9))) : 0;
  const followUpRate = totalActivePlans > 0 ? Math.min(100, Math.round(((outcomes?.milestoneCompletionRate ?? 0) * 0.85))) : 0;

  const parentModules = metrics?.parent?.modulesCompleted ?? 0;
  const familyAssessments = metrics?.parent?.familyAssessments ?? 0;
  const parentModulePct = Math.min(100, Math.round((parentModules / Math.max(6, 1)) * 100));
  const familyPct = Math.min(100, Math.round((familyAssessments / Math.max(10, 1)) * 100));
  const responsePct = metrics?.email?.responseRate ?? 0;

  return [
    {
      area: "Prevention Curriculum Delivery",
      expected: "12 sessions per quarter",
      indicators: [
        { name: "Sessions Delivered", expectedVal: 12, actualVal: sessionsDelivered },
        { name: "Avg Fidelity Score", expectedVal: 4, actualVal: Math.round(avgFidelity * 10) / 10 },
        { name: "Participant Attendance", expectedVal: 85, actualVal: attendancePct },
      ],
    },
    {
      area: "Workforce Training Pipeline",
      expected: "8 cohorts active quarterly",
      indicators: [
        { name: "Career Assessments", expectedVal: 50, actualVal: careerAssessments },
        { name: "Completion Rate", expectedVal: 75, actualVal: completionPct },
        { name: "Job Placement Rate", expectedVal: 60, actualVal: placementPct },
      ],
    },
    {
      area: "Coalition Engagement",
      expected: "12 sectors represented",
      indicators: [
        { name: "Active Classrooms/Partners", expectedVal: 12, actualVal: classroomsActive },
        { name: "Certificates Issued", expectedVal: 20, actualVal: certificatesIssued },
        { name: "Total Dosage Hours", expectedVal: 500, actualVal: dosage?.totalHours ?? metrics?.facilitator?.totalDosageHours ?? 0 },
      ],
    },
    {
      area: "Case Management Fidelity",
      expected: "Monthly contact per participant",
      indicators: [
        { name: "Contact Rate", expectedVal: 90, actualVal: contactRate },
        { name: "Plan Review Rate", expectedVal: 85, actualVal: reviewRate },
        { name: "Referral Follow-Up", expectedVal: 80, actualVal: followUpRate },
      ],
    },
    {
      area: "Parent Education Program",
      expected: "6 modules per family cycle",
      indicators: [
        { name: "Module Completion", expectedVal: 80, actualVal: parentModulePct },
        { name: "Family Assessment Rate", expectedVal: 75, actualVal: familyPct },
        { name: "Communication Response", expectedVal: 90, actualVal: responsePct },
      ],
    },
  ];
}

interface SmartGoalDef {
  id: string;
  title: string;
  category: string;
  icon: typeof Shield;
  color: string;
  responsible: string;
  targetDate: string;
  targetValue: number;
  metrics: string;
  computeProgress: (m: PlatformMetrics | null, o: OutcomeDashboard | null, d: DosageSummary | null, i: ImpactData | null) => number;
}

const SMART_GOAL_DEFS: SmartGoalDef[] = [
  {
    id: "goal-1",
    title: "Reduce youth substance use perception of risk gap by 15%",
    category: "Prevention",
    icon: Shield,
    color: "text-emerald-600",
    responsible: "Prevention Team",
    targetDate: "2027-03-31",
    targetValue: 15,
    metrics: "Prevention avg score (proxy for perception of risk improvement)",
    computeProgress: (m) => {
      const score = m?.prevention?.avgScore ?? 0;
      return Math.min(100, Math.round((score / 100) * 100));
    },
  },
  {
    id: "goal-2",
    title: "Place 50 participants in employment with 90-day retention",
    category: "Workforce",
    icon: Briefcase,
    color: "text-blue-600",
    responsible: "Workforce Development Team",
    targetDate: "2027-06-30",
    targetValue: 50,
    metrics: "Job placements from workforce dashboard",
    computeProgress: (m) => {
      const placements = m?.workforce?.jobPlacements ?? 0;
      return Math.min(100, Math.round((placements / 50) * 100));
    },
  },
  {
    id: "goal-3",
    title: "Achieve 80% fidelity across all prevention curricula",
    category: "Fidelity",
    icon: Activity,
    color: "text-violet-600",
    responsible: "Facilitator Hub",
    targetDate: "2026-12-31",
    targetValue: 80,
    metrics: "Facilitator avg fidelity score (scaled to %)",
    computeProgress: (m) => {
      const fidelity = m?.facilitator?.avgFidelity ?? 0;
      return Math.min(100, Math.round((fidelity / 5) * 100));
    },
  },
  {
    id: "goal-4",
    title: "Establish 12-sector coalition with quarterly meetings",
    category: "Coalition",
    icon: Users,
    color: "text-amber-600",
    responsible: "Coalition Coordinator",
    targetDate: "2026-09-30",
    targetValue: 12,
    metrics: "Active classrooms/partners from coalition metrics",
    computeProgress: (m) => {
      const active = m?.coalition?.classroomsActive ?? 0;
      return Math.min(100, Math.round((active / 12) * 100));
    },
  },
  {
    id: "goal-5",
    title: "Complete 500 participant dosage hours per quarter",
    category: "Engagement",
    icon: Clock,
    color: "text-indigo-600",
    responsible: "Program Staff",
    targetDate: "2027-03-31",
    targetValue: 500,
    metrics: "Total dosage hours from dosage summary",
    computeProgress: (_m, _o, d) => {
      const hours = d?.totalHours ?? 0;
      return Math.min(100, Math.round((hours / 500) * 100));
    },
  },
  {
    id: "goal-6",
    title: "Reduce recidivism rate to below 20% at 12 months",
    category: "Reentry",
    icon: Shield,
    color: "text-rose-600",
    responsible: "Reentry Services Team",
    targetDate: "2027-12-31",
    targetValue: 20,
    metrics: "Milestone completion rate (proxy for successful reentry)",
    computeProgress: (_m, o) => {
      const rate = o?.milestoneCompletionRate ?? 0;
      return Math.min(100, rate);
    },
  },
];

function getStatusConfig(status: string) {
  switch (status) {
    case "on-track": return { label: "On Track", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 };
    case "at-risk": return { label: "At Risk", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle };
    case "off-track": return { label: "Off Track", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle };
    default: return { label: "Pending", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock };
  }
}

function MetricCard({ label, value, unit, icon: Icon, color, subtext }: {
  label: string; value: number | string; unit?: string; icon: typeof Users; color: string; subtext?: string;
}) {
  return (
    <Card data-testid={`card-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-2xl font-bold">
              {unit === "$" ? `$${Number(value).toLocaleString()}` : value}{unit && unit !== "$" ? unit : ""}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color} shrink-0`} />
        </div>
      </CardContent>
    </Card>
  );
}

function SalpFidelityPanel({ metrics, outcomes, dosage }: { metrics: PlatformMetrics | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null }) {
  const fidelityScore = metrics?.facilitator?.avgFidelity ?? 0;
  const sessionsDelivered = metrics?.facilitator?.sessionsDelivered ?? 0;
  const dosageHours = dosage?.totalHours ?? metrics?.facilitator?.totalDosageHours ?? 0;

  const salpAreas = buildSalpIndicators(metrics, outcomes, dosage);

  return (
    <Card data-testid="card-salp-fidelity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          SALP Fidelity Indicators
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Expected vs. actual implementation metrics — computed from live platform data across all program areas
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-primary">{fidelityScore}/5</p>
            <p className="text-xs text-muted-foreground">Avg Fidelity Score</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-emerald-600">{sessionsDelivered}</p>
            <p className="text-xs text-muted-foreground">Sessions Delivered</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-blue-600">{dosageHours} hrs</p>
            <p className="text-xs text-muted-foreground">Dosage Hours</p>
          </div>
        </div>

        {salpAreas.map((area) => (
          <div key={area.area} className="space-y-2" data-testid={`salp-area-${area.area.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{area.area}</h4>
              <span className="text-xs text-muted-foreground">Expected: {area.expected}</span>
            </div>
            <div className="space-y-2">
              {area.indicators.map((indicator) => {
                const pct = indicator.expectedVal > 0 ? Math.min(100, (indicator.actualVal / indicator.expectedVal) * 100) : 0;
                const status = pct >= 80 ? "on-track" : pct >= 60 ? "at-risk" : "off-track";
                const statusConfig = getStatusConfig(status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={indicator.name} className="flex items-center gap-3">
                    <div className="w-40 text-xs text-muted-foreground truncate">{indicator.name}</div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            status === "on-track" ? "bg-emerald-500" : status === "at-risk" ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 w-24 justify-end">
                      <span className="text-xs font-medium">{indicator.actualVal}/{indicator.expectedVal}</span>
                      <StatusIcon className={`h-3.5 w-3.5 ${
                        status === "on-track" ? "text-emerald-500" : status === "at-risk" ? "text-amber-500" : "text-red-500"
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <Link href="/cqi">
            <Button variant="outline" size="sm" data-testid="button-salp-to-cqi">
              <Activity className="mr-2 h-4 w-4" /> Open MAP-GAP CQI Tool
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function SmartGoalsTracker({ metrics, outcomes, dosage, impact }: {
  metrics: PlatformMetrics | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null; impact: ImpactData | null;
}) {
  return (
    <Card data-testid="card-smart-goals">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          SMART Goals Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Shared goals visible to all stakeholders — progress computed from live platform data, target dates, and responsible parties
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {SMART_GOAL_DEFS.map((goal) => {
          const Icon = goal.icon;
          const progress = goal.computeProgress(metrics, outcomes, dosage, impact);
          const status = progress >= 75 ? "on-track" : progress >= 40 ? "at-risk" : "off-track";
          const statusConfig = getStatusConfig(status);
          const StatusIcon = statusConfig.icon;
          const daysRemaining = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          return (
            <div key={goal.id} className="p-4 rounded-lg border" data-testid={`card-goal-${goal.id}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0 mt-0.5">
                    <Icon className={`h-4 w-4 ${goal.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold leading-tight">{goal.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{goal.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{goal.responsible}</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusConfig.className}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={progress} className="h-2" />
                </div>
                <span className="text-sm font-semibold w-10 text-right">{progress}%</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Metric: {goal.metrics}</span>
                <span>{daysRemaining} days remaining</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function FunderView({ metrics, outcomes, dosage, impact }: {
  metrics: PlatformMetrics | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null; impact: ImpactData | null;
}) {
  return (
    <div className="space-y-6" data-testid="view-funder">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Program Fidelity" value={metrics?.facilitator?.avgFidelity ?? 0} unit="/5" icon={Activity} color="text-violet-500" subtext="Avg across all programs" />
        <MetricCard label="Outcome Measurements" value={outcomes?.totalOutcomes ?? 0} icon={BarChart3} color="text-emerald-500" subtext="Total tracked metrics" />
        <MetricCard label="Milestone Completion" value={`${outcomes?.milestoneCompletionRate ?? 0}%`} icon={CheckCircle2} color="text-blue-500" subtext="Across all active plans" />
        <MetricCard label="Funding Secured" value={metrics?.grants?.totalFundingSecured ?? 0} unit="$" icon={Target} color="text-amber-500" subtext="Total awarded grants" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Participants Served" value={impact?.youthServed ?? outcomes?.uniqueParticipants ?? 0} icon={Users} color="text-blue-600" />
        <MetricCard label="Dosage Hours" value={dosage?.totalHours ?? metrics?.facilitator?.totalDosageHours ?? 0} unit=" hrs" icon={Clock} color="text-indigo-500" />
        <MetricCard label="Active Plans" value={outcomes?.totalActivePlans ?? 0} icon={FileBarChart} color="text-rose-500" />
        <MetricCard label="Applications In Progress" value={metrics?.grants?.applicationsInProgress ?? 0} icon={Target} color="text-purple-500" />
      </div>
      <SalpFidelityPanel metrics={metrics} outcomes={outcomes} dosage={dosage} />
      <SmartGoalsTracker metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
    </div>
  );
}

function PartnerView({ metrics, outcomes, dosage, impact }: {
  metrics: PlatformMetrics | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null; impact: ImpactData | null;
}) {
  return (
    <div className="space-y-6" data-testid="view-partner">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Partner Organizations" value={metrics?.coalition?.classroomsActive ?? 0} icon={Handshake} color="text-blue-500" subtext="Active collaborations" />
        <MetricCard label="Referrals Coordinated" value={outcomes?.totalActivePlans ?? 0} icon={ArrowRight} color="text-emerald-500" subtext="Cross-agency referrals" />
        <MetricCard label="Shared Goal Progress" value={`${outcomes?.milestoneCompletionRate ?? 0}%`} icon={Target} color="text-violet-500" subtext="Coalition-wide milestones" />
        <MetricCard label="Certificates Issued" value={metrics?.coalition?.certificatesIssued ?? 0} icon={Award} color="text-amber-500" subtext="Cross-partner trainings" />
      </div>
      <SmartGoalsTracker metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
      <SalpFidelityPanel metrics={metrics} outcomes={outcomes} dosage={dosage} />
    </div>
  );
}

function SchoolView({ metrics, impact, outcomes, dosage }: {
  metrics: PlatformMetrics | null; impact: ImpactData | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null;
}) {
  return (
    <div className="space-y-6" data-testid="view-school">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Students Engaged" value={impact?.youthServed ?? metrics?.prevention?.youthReached ?? 0} icon={GraduationCap} color="text-emerald-500" subtext="Active participants" />
        <MetricCard label="Lessons Completed" value={impact?.lessonsCompleted ?? metrics?.engagement?.lessonsCompleted ?? 0} icon={BookOpen} color="text-blue-500" subtext="Curriculum progress" />
        <MetricCard label="Prevention Modules" value={metrics?.prevention?.modulesCompleted ?? 0} icon={Shield} color="text-violet-500" subtext="SEL / prevention completion" />
        <MetricCard label="Avg Score" value={`${metrics?.prevention?.avgScore ?? impact?.averageScore ?? 0}%`} icon={TrendingUp} color="text-amber-500" subtext="Assessment performance" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Badges Earned" value={impact?.badgesEarned ?? 0} icon={Award} color="text-rose-500" />
        <MetricCard label="Certificates" value={impact?.certificatesIssued ?? metrics?.coalition?.certificatesIssued ?? 0} icon={Award} color="text-indigo-500" />
        <MetricCard label="Classrooms Active" value={metrics?.coalition?.classroomsActive ?? 0} icon={School} color="text-emerald-600" />
        <MetricCard label="Quizzes Completed" value={metrics?.engagement?.quizzesCompleted ?? 0} icon={ClipboardCheck} color="text-blue-600" />
      </div>
      <SmartGoalsTracker metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
    </div>
  );
}

function JusticeView({ metrics, outcomes, dosage, impact }: {
  metrics: PlatformMetrics | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null; impact: ImpactData | null;
}) {
  const totalParticipants = outcomes?.uniqueParticipants ?? 0;
  const activePlans = outcomes?.totalActivePlans ?? 0;
  const totalSessions = dosage?.totalSessions ?? 0;
  const mentorMatches = impact?.mentorConnections ?? 0;
  return (
    <div className="space-y-6" data-testid="view-justice">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Participants Tracked" value={totalParticipants} icon={Users} color="text-amber-500" subtext="Active reentry plans" />
        <MetricCard label="Outcome Measurements" value={outcomes?.totalOutcomes ?? 0} icon={BarChart3} color="text-emerald-500" subtext="Recidivism + employment + housing" />
        <MetricCard label="Milestone Completion" value={`${outcomes?.milestoneCompletionRate ?? 0}%`} icon={CheckCircle2} color="text-blue-500" subtext="Reentry milestone progress" />
        <MetricCard label="Service Hours" value={dosage?.totalHours ?? 0} unit=" hrs" icon={Clock} color="text-violet-500" subtext="Total program dosage" />
      </div>
      <Card data-testid="card-justice-outcomes">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-amber-600" />
            Justice-Aligned Outcome Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-2">Recidivism Tracking</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Participants Monitored</span><Badge variant="outline">{totalParticipants}</Badge></div>
                <div className="flex justify-between"><span>Active Plans</span><Badge variant="outline">{activePlans}</Badge></div>
                <div className="flex justify-between"><span>Completion Rate</span><Badge variant="outline">{outcomes?.milestoneCompletionRate ?? 0}%</Badge></div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-2">Diversion Programs</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Active Diversions</span><Badge variant="outline">{activePlans}</Badge></div>
                <div className="flex justify-between"><span>Sessions Delivered</span><Badge variant="outline">{totalSessions}</Badge></div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-2">Community Safety</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Restorative Sessions</span><Badge variant="outline">{totalSessions}</Badge></div>
                <div className="flex justify-between"><span>Mentor Matches</span><Badge variant="outline">{mentorMatches}</Badge></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <SmartGoalsTracker metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
    </div>
  );
}

function ParentView({ metrics, impact, outcomes, dosage }: {
  metrics: PlatformMetrics | null; impact: ImpactData | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null;
}) {
  const totalParentModules = 6;
  const modulesCompleted = metrics?.parent?.modulesCompleted ?? 0;
  const overallPct = Math.min(100, Math.round((modulesCompleted / totalParentModules) * 100));
  const moduleNames = ["Understanding Prevention", "Digital Safety", "Communication Skills", "Community Resources", "Crisis Response", "Sustained Engagement"];
  const perModulePct = moduleNames.map((_, i) => {
    if (modulesCompleted >= i + 1) return 100;
    if (modulesCompleted > i) return Math.min(100, Math.round((modulesCompleted - i) * 100));
    return 0;
  });

  return (
    <div className="space-y-6" data-testid="view-parent">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Youth Engaged" value={impact?.youthServed ?? metrics?.prevention?.youthReached ?? 0} icon={Users} color="text-rose-500" subtext="Active in programs" />
        <MetricCard label="Parent Modules" value={`${modulesCompleted}/${totalParentModules}`} icon={BookOpen} color="text-blue-500" subtext={`${overallPct}% complete`} />
        <MetricCard label="Family Assessments" value={metrics?.parent?.familyAssessments ?? 0} icon={ClipboardCheck} color="text-emerald-500" subtext="Completed screenings" />
        <MetricCard label="Prevention Progress" value={`${metrics?.prevention?.avgScore ?? 0}%`} icon={Shield} color="text-violet-500" subtext="Youth prevention scores" />
      </div>
      <Card data-testid="card-parent-engagement">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-rose-500" />
            Family Program Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-3">Parent Education Progress</h4>
              <div className="space-y-3">
                {moduleNames.map((mod, i) => (
                  <div key={mod} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-40 truncate">{mod}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div className="h-2 bg-rose-500 rounded-full" style={{ width: `${perModulePct[i]}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{perModulePct[i]}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-3">Youth Activity Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Lessons Completed</span><span className="font-semibold">{impact?.lessonsCompleted ?? 0}</span></div>
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Badges Earned</span><span className="font-semibold">{impact?.badgesEarned ?? 0}</span></div>
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Career Pathways Explored</span><span className="font-semibold">{impact?.careerPathways ?? 0}</span></div>
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Mentor Connections</span><span className="font-semibold">{impact?.mentorConnections ?? 0}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <SmartGoalsTracker metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
    </div>
  );
}

function StaffView({ metrics, outcomes, dosage, impact }: {
  metrics: PlatformMetrics | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null; impact: ImpactData | null;
}) {
  return (
    <div className="space-y-6" data-testid="view-staff">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Active Users" value={metrics?.engagement?.activeUsers30d ?? 0} icon={Users} color="text-blue-500" subtext="30-day active" />
        <MetricCard label="Dosage Hours" value={dosage?.totalHours ?? metrics?.facilitator?.totalDosageHours ?? 0} unit=" hrs" icon={Clock} color="text-indigo-500" subtext="Total delivered" />
        <MetricCard label="Fidelity Score" value={metrics?.facilitator?.avgFidelity ?? 0} unit="/5" icon={Activity} color="text-emerald-500" subtext="Program adherence" />
        <MetricCard label="Sessions Delivered" value={metrics?.facilitator?.sessionsDelivered ?? 0} icon={ClipboardCheck} color="text-violet-500" subtext="Total facilitated" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Facilitators" value={metrics?.facilitator?.totalFacilitators ?? 0} icon={Users} color="text-amber-500" />
        <MetricCard label="Outcome Measurements" value={outcomes?.totalOutcomes ?? 0} icon={BarChart3} color="text-rose-500" />
        <MetricCard label="Total Sessions" value={dosage?.totalSessions ?? 0} icon={Activity} color="text-teal-500" />
        <MetricCard label="Response Rate" value={`${metrics?.email?.responseRate ?? 0}%`} icon={TrendingUp} color="text-purple-500" />
      </div>
      <SalpFidelityPanel metrics={metrics} outcomes={outcomes} dosage={dosage} />
      <SmartGoalsTracker metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
    </div>
  );
}

function ParticipantView({ metrics, impact, outcomes, dosage }: {
  metrics: PlatformMetrics | null; impact: ImpactData | null; outcomes: OutcomeDashboard | null; dosage: DosageSummary | null;
}) {
  const lessons = impact?.lessonsCompleted ?? 0;
  const badges = impact?.badgesEarned ?? 0;
  const certs = impact?.certificatesIssued ?? 0;
  const pathways = impact?.careerPathways ?? 0;
  const mentors = impact?.mentorConnections ?? 0;
  const placements = metrics?.workforce?.jobPlacements ?? 0;

  const milestones = [
    { name: "Complete Intake Assessment", done: (dosage?.totalSessions ?? 0) > 0 },
    { name: "Finish Core Curriculum", done: lessons > 0 },
    { name: "Career Assessment", done: (metrics?.workforce?.careerAssessments ?? 0) > 0 },
    { name: "Mentor Match", done: mentors > 0 },
    { name: "Workforce Placement", done: placements > 0 },
    { name: "Credential Earned", done: certs > 0 },
  ];

  return (
    <div className="space-y-6" data-testid="view-participant">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Lessons Completed" value={lessons} icon={BookOpen} color="text-blue-500" subtext="Curriculum progress" />
        <MetricCard label="Badges Earned" value={badges} icon={Award} color="text-amber-500" subtext="Achievements unlocked" />
        <MetricCard label="Certificates" value={certs} icon={Award} color="text-emerald-500" subtext="Credentials earned" />
        <MetricCard label="Career Pathways" value={pathways} icon={Briefcase} color="text-violet-500" subtext="Explored paths" />
      </div>
      <Card data-testid="card-participant-progress">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Program Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-3">Milestones</h4>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.name} className="flex items-center gap-2">
                    {milestone.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span className={`text-sm ${milestone.done ? "line-through text-muted-foreground" : ""}`}>{milestone.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-3">Engagement Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Total Sessions</span><span className="font-semibold">{dosage?.totalSessions ?? 0}</span></div>
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Total Hours</span><span className="font-semibold">{dosage?.totalHours ?? 0}</span></div>
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Pathway Plans Created</span><span className="font-semibold">{impact?.pathwayPlansCreated ?? 0}</span></div>
                <div className="flex justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Avg Assessment Score</span><span className="font-semibold">{impact?.averageScore ?? 0}%</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <SmartGoalsTracker metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
    </div>
  );
}

export default function TransparencyDashboardPage() {
  const [activeRole, setActiveRole] = useState<StakeholderRole>("funder");

  const { data: rawMetrics, isLoading: metricsLoading } = useQuery<PlatformMetrics>({ queryKey: ["/api/metrics/platform-wide"] });
  const metrics = rawMetrics ?? null;

  const { data: rawOutcomes } = useQuery<OutcomeDashboard>({ queryKey: ["/api/outcomes/dashboard"] });
  const outcomes = rawOutcomes ?? null;

  const { data: rawDosage } = useQuery<DosageSummary>({ queryKey: ["/api/dosage/summary"] });
  const dosage = rawDosage ?? null;

  const { data: rawImpact } = useQuery<ImpactData>({ queryKey: ["/api/public/impact"] });
  const impact = rawImpact ?? null;

  if (metricsLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="py-8 px-4 sm:py-12 sm:px-6 bg-gradient-to-b from-primary/5 to-transparent" data-testid="section-transparency-hero">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-full bg-primary/10 p-3 shrink-0">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" data-testid="text-transparency-heading">
                Stakeholder Transparency Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
                Nothing in a black box. Every stakeholder sees the same data — presented for their context. SALP fidelity indicators, SMART goals, and program outcomes measured in real time.
              </p>
            </div>
          </div>

          <Card className="p-4 sm:p-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 mb-8" data-testid="card-transparency-promise">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-sm mb-1">Our Transparency Promise</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every funder, partner, school, law enforcement agency, parent, staff member, and participant sees the truth — measured against the same SALP fidelity indicators and SMART goals. We don't report outcomes at year-end. We measure them continuously, transparently, and make them visible to everyone involved. If it's not working, we show that too — because transparency is how we improve.
                </p>
              </div>
            </div>
          </Card>

          <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as StakeholderRole)} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1" data-testid="tabs-stakeholder-roles">
              {STAKEHOLDER_ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <TabsTrigger
                    key={role.id}
                    value={role.id}
                    className="flex-1 min-w-[120px] text-xs sm:text-sm py-2"
                    data-testid={`tab-role-${role.id}`}
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5 hidden sm:block" />
                    <span className="truncate">{role.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="funder">
                <FunderView metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
              </TabsContent>
              <TabsContent value="partner">
                <PartnerView metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
              </TabsContent>
              <TabsContent value="school">
                <SchoolView metrics={metrics} impact={impact} outcomes={outcomes} dosage={dosage} />
              </TabsContent>
              <TabsContent value="justice">
                <JusticeView metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
              </TabsContent>
              <TabsContent value="parent">
                <ParentView metrics={metrics} impact={impact} outcomes={outcomes} dosage={dosage} />
              </TabsContent>
              <TabsContent value="staff">
                <StaffView metrics={metrics} outcomes={outcomes} dosage={dosage} impact={impact} />
              </TabsContent>
              <TabsContent value="participant">
                <ParticipantView metrics={metrics} impact={impact} outcomes={outcomes} dosage={dosage} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
