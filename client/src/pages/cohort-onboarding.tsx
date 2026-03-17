import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Users, CheckCircle2, Clock, Target, BarChart3,
  ChevronRight, AlertCircle, Shield, Star, Briefcase,
  TrendingUp, Calendar,
} from "lucide-react";

interface ParticipantProgress {
  journeyId: string;
  participantId: string;
  participantName: string;
  population: string;
  status: string;
  currentPhaseWeek: number;
  startDate: string;
  expectedEndDate: string;
  daysElapsed: number;
  totalMilestones: number;
  completedMilestones: number;
  totalRequired: number;
  completedRequired: number;
  progressPercent: number;
  completedAt: string | null;
}

interface MilestoneStat {
  milestoneId: string;
  title: string;
  totalParticipants: number;
  completedCount: number;
}

interface CohortData {
  participants: ParticipantProgress[];
  milestoneStats: MilestoneStat[];
}

const POPULATION_LABELS: Record<string, string> = {
  returning_citizen: "Returning Citizen",
  youth: "Youth",
  veteran: "Veteran",
};

const POPULATION_COLORS: Record<string, string> = {
  returning_citizen: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  youth: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  veteran: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const WEEK_NAMES = ["Week 1: Intake", "Week 2: Assessment", "Week 3: Connection", "Week 4: Review"];

export default function CohortOnboardingPage() {
  const { data, isLoading } = useQuery<CohortData>({
    queryKey: ["/api/onboarding/cohort-progress"],
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const participants = data?.participants || [];
  const milestoneStats = data?.milestoneStats || [];

  const totalParticipants = participants.length;
  const activeCount = participants.filter(p => p.status === "active").length;
  const completedCount = participants.filter(p => p.status === "completed").length;
  const avgProgress = totalParticipants > 0 ? Math.round(participants.reduce((s, p) => s + p.progressPercent, 0) / totalParticipants) : 0;
  const atRisk = participants.filter(p => p.status === "active" && p.daysElapsed > 21 && p.progressPercent < 50);

  const byPopulation: Record<string, ParticipantProgress[]> = {};
  for (const p of participants) {
    if (!byPopulation[p.population]) byPopulation[p.population] = [];
    byPopulation[p.population].push(p);
  }

  const byWeek = [0, 0, 0, 0, 0];
  for (const p of participants) {
    if (p.status === "completed") {
      byWeek[4]++;
    } else {
      byWeek[Math.min(p.currentPhaseWeek - 1, 3)]++;
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Cohort Onboarding Progress"
        description="Track all participant journeys through the 30-day onboarding program"
        icon={<Users className="h-7 w-7" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="p-3 sm:p-4" data-testid="card-cohort-total">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Total Participants</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-participants">{totalParticipants}</p>
        </Card>
        <Card className="p-3 sm:p-4" data-testid="card-cohort-active">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Active</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
        </Card>
        <Card className="p-3 sm:p-4" data-testid="card-cohort-completed">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
        </Card>
        <Card className="p-3 sm:p-4" data-testid="card-cohort-avg-progress">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Avg Progress</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{avgProgress}%</p>
          <Progress value={avgProgress} className="h-1.5 mt-1" />
        </Card>
      </div>

      {atRisk.length > 0 && (
        <Card className="p-4 mb-6 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20" data-testid="card-at-risk-alert">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-300">Participants Needing Attention ({atRisk.length})</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">These participants are past day 21 with less than 50% progress.</p>
          <div className="space-y-2">
            {atRisk.map(p => (
              <div key={p.journeyId} className="flex items-center justify-between p-2 rounded bg-background" data-testid={`at-risk-${p.participantId}`}>
                <div>
                  <span className="text-sm font-medium">{p.participantName}</span>
                  <span className="text-xs text-muted-foreground ml-2">Day {p.daysElapsed} — {p.progressPercent}% complete</span>
                </div>
                <Link href={`/my-journey`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs" data-testid={`button-view-at-risk-${p.participantId}`}>
                    View <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6" data-testid="card-phase-distribution">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Phase Distribution
            </h3>
            <div className="space-y-3">
              {WEEK_NAMES.map((name, i) => {
                const count = byWeek[i];
                const pct = totalParticipants > 0 ? (count / totalParticipants) * 100 : 0;
                return (
                  <div key={i} data-testid={`phase-dist-week-${i + 1}`}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{name}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
              <div data-testid="phase-dist-completed">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Completed</span>
                  <span className="font-medium">{byWeek[4]}</span>
                </div>
                <Progress value={totalParticipants > 0 ? (byWeek[4] / totalParticipants) * 100 : 0} className="h-2" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 sm:p-6" data-testid="card-population-breakdown">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> By Population
          </h3>
          <div className="space-y-3">
            {Object.entries(byPopulation).map(([pop, pList]) => {
              const popAvg = pList.length > 0 ? Math.round(pList.reduce((s, p) => s + p.progressPercent, 0) / pList.length) : 0;
              return (
                <div key={pop} className="p-3 rounded-lg bg-muted/50" data-testid={`population-stat-${pop}`}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className={POPULATION_COLORS[pop] || ""}>{POPULATION_LABELS[pop] || pop}</Badge>
                    <span className="text-sm font-medium">{pList.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Avg progress</span>
                    <span>{popAvg}%</span>
                  </div>
                  <Progress value={popAvg} className="h-1.5" />
                </div>
              );
            })}
            {Object.keys(byPopulation).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No participants enrolled yet.</p>
            )}
          </div>
        </Card>
      </div>

      {milestoneStats.length > 0 && (
        <Card className="p-4 sm:p-6 mb-6" data-testid="card-milestone-completion-rates">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" /> Milestone Completion Rates
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {milestoneStats
              .filter(m => m.totalParticipants > 0)
              .sort((a, b) => (b.completedCount / b.totalParticipants) - (a.completedCount / a.totalParticipants))
              .map(stat => {
                const rate = stat.totalParticipants > 0 ? Math.round((stat.completedCount / stat.totalParticipants) * 100) : 0;
                return (
                  <div key={stat.milestoneId} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50" data-testid={`milestone-stat-${stat.milestoneId}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stat.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={rate} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-12 text-right">{rate}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{stat.completedCount}/{stat.totalParticipants}</span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-6" data-testid="card-participant-list">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> All Participants
        </h3>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No participants have started their onboarding journey yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map(p => (
              <div key={p.journeyId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`participant-row-${p.participantId}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{p.participantName}</span>
                    <Badge variant="secondary" className={`text-[10px] ${POPULATION_COLORS[p.population] || ""}`}>
                      {POPULATION_LABELS[p.population] || p.population}
                    </Badge>
                    <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[p.status] || ""}`}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Progress value={p.progressPercent} className="h-1.5 flex-1 max-w-32" />
                    <span className="text-xs text-muted-foreground">{p.progressPercent}%</span>
                    <span className="text-xs text-muted-foreground">{p.completedMilestones}/{p.totalMilestones} milestones</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Day {p.daysElapsed}
                    </span>
                  </div>
                </div>
                <Link href={`/my-journey`}>
                  <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" data-testid={`button-view-participant-${p.participantId}`}>
                    View <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
