import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Brain,
  Users,
  Heart,
  MapPin,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  RefreshCw,
  ClipboardCheck,
  Activity,
} from "lucide-react";

interface ThriveScore {
  id: string;
  userId: string;
  domainAScore: number;
  domainATrend: string;
  domainBScore: number;
  domainBTrend: string;
  domainCScore: number;
  domainCTrend: string;
  domainDScore: number | null;
  domainDTrend: string | null;
  domainDActive: boolean;
  domainEScore: number;
  domainETrend: string;
  domainFScore: number;
  domainFTrend: string;
  compositeScore: number;
  compositeTrend: string;
  flagLevel: string | null;
  flagDomains: string[] | null;
  nextBestActions: any;
  updatedAt: string;
}

interface ThriveHistoryEntry {
  id: string;
  compositeScore: number | null;
  domainAScore: number | null;
  domainBScore: number | null;
  domainCScore: number | null;
  domainDScore: number | null;
  domainEScore: number | null;
  domainFScore: number | null;
  recordedAt: string;
}

interface EarlyWarningFlag {
  id: string;
  userId: string;
  flagLevel: string;
  triggerDomain: string;
  whatChanged: string;
  whyItMatters: string;
  navigationAction: string;
  thirtyDayTarget: string;
  status: string;
  createdAt: string;
}

const DOMAINS = [
  { key: "A", label: "Learning & Engagement", icon: BookOpen, scoreKey: "domainAScore" as const, trendKey: "domainATrend" as const, description: "Academic performance, attendance, and classroom engagement" },
  { key: "B", label: "Executive Function", icon: Brain, scoreKey: "domainBScore" as const, trendKey: "domainBTrend" as const, description: "Self-regulation, focus, and organizational skills" },
  { key: "C", label: "Belonging", icon: Users, scoreKey: "domainCScore" as const, trendKey: "domainCTrend" as const, description: "Peer connections, social integration, and community" },
  { key: "D", label: "Wellbeing", icon: Heart, scoreKey: "domainDScore" as const, trendKey: "domainDTrend" as const, description: "Emotional health, energy, and self-reported wellness" },
  { key: "E", label: "Context", icon: MapPin, scoreKey: "domainEScore" as const, trendKey: "domainETrend" as const, description: "Neighborhood, SVI, and environmental factors" },
  { key: "F", label: "Protective Factors", icon: Shield, scoreKey: "domainFScore" as const, trendKey: "domainFTrend" as const, description: "Mentorship, extracurriculars, and support systems" },
];

function getScoreColor(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  if (score >= 25) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreRingColor(score: number) {
  if (score >= 75) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  if (score >= 25) return "stroke-orange-500";
  return "stroke-red-500";
}

function getFlagBadgeStyle(level: string) {
  switch (level?.toLowerCase()) {
    case "watch": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "support": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "stabilize": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default: return "";
  }
}

function TrendIcon({ trend }: { trend: string | null }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function TrendBadge({ trend }: { trend: string | null }) {
  if (trend === "improving") return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><TrendingUp className="h-3 w-3 mr-1" />Improving</Badge>;
  if (trend === "declining") return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"><TrendingDown className="h-3 w-3 mr-1" />Declining</Badge>;
  return <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Flat</Badge>;
}

function CompositeScoreCircle({ score, trend, flagLevel }: { score: number; trend: string; flagLevel: string | null }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const ringColor = getScoreRingColor(score);

  return (
    <div className="flex flex-col items-center gap-4" data-testid="section-composite-score">
      <div className="relative w-48 h-48">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
          <circle
            cx="80" cy="80" r={radius} fill="none"
            strokeWidth="10" strokeLinecap="round"
            className={ringColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getScoreColor(score)}`} data-testid="text-composite-score">
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground">Thrive Score</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <TrendBadge trend={trend} />
        {flagLevel && (
          <Badge variant="secondary" className={getFlagBadgeStyle(flagLevel)} data-testid="badge-flag-level">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {flagLevel}
          </Badge>
        )}
      </div>
    </div>
  );
}

function HistoryChart({ history }: { history: ThriveHistoryEntry[] }) {
  if (!history || history.length === 0) return null;

  const sorted = [...history].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const maxBars = 30;
  const displayed = sorted.slice(-maxBars);
  const barWidth = 100 / Math.max(displayed.length, 1);

  return (
    <Card className="p-5" data-testid="card-history-chart">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" /> Score History (Last 90 Days)
      </h2>
      <div className="relative h-40 flex items-end gap-px" data-testid="chart-history">
        {displayed.map((entry, i) => {
          const score = entry.compositeScore ?? 0;
          const heightPct = Math.max(score, 2);
          return (
            <div
              key={entry.id || i}
              className="flex-1 flex flex-col items-center justify-end"
              title={`${new Date(entry.recordedAt).toLocaleDateString()}: ${Math.round(score)}`}
              data-testid={`bar-history-${i}`}
            >
              <div
                className={`w-full rounded-t-sm min-h-[2px] ${getScoreBg(score)}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className="text-[10px] text-muted-foreground">
          {displayed.length > 0 ? new Date(displayed[0].recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {displayed.length > 0 ? new Date(displayed[displayed.length - 1].recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-[10px] text-muted-foreground">0</span>
        <span className="text-[10px] text-muted-foreground">100</span>
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <Skeleton className="h-48 w-48 rounded-full mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function AcademyThrivePage() {
  const { toast } = useToast();

  const { data: score, isLoading: scoreLoading } = useQuery<ThriveScore>({
    queryKey: ["/api/thrive/score"],
  });

  const { data: history, isLoading: historyLoading } = useQuery<ThriveHistoryEntry[]>({
    queryKey: ["/api/thrive/history"],
  });

  const { data: flags, isLoading: flagsLoading } = useQuery<EarlyWarningFlag[]>({
    queryKey: ["/api/thrive/flags"],
  });

  const computeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/thrive/compute");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/thrive/score"] });
      queryClient.invalidateQueries({ queryKey: ["/api/thrive/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/thrive/flags"] });
      toast({ title: "Score Refreshed", description: "Your Thrive score has been recalculated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (scoreLoading) {
    return <LoadingSkeleton />;
  }

  const activeFlags = (flags ?? []).filter((f) => f.status === "active");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="academy-thrive-page">
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-4 sm:p-6 lg:p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-page-title">
            Thrive Dashboard
          </h1>
        </div>
        <p className="text-rose-100 text-base sm:text-lg" data-testid="text-page-subtitle">
          Your holistic growth across six domains
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
        {score ? (
          <CompositeScoreCircle
            score={score.compositeScore}
            trend={score.compositeTrend}
            flagLevel={score.flagLevel}
          />
        ) : (
          <Card className="p-8 text-center" data-testid="card-no-score">
            <Activity className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">No Thrive score computed yet.</p>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
        <Button
          variant="outline"
          onClick={() => computeMutation.mutate()}
          disabled={computeMutation.isPending}
          data-testid="button-refresh-score"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${computeMutation.isPending ? "animate-spin" : ""}`} />
          {computeMutation.isPending ? "Computing..." : "Refresh Score"}
        </Button>
        <Link href="/academy/self-assessment">
          <Button variant="outline" data-testid="link-daily-checkin">
            <ClipboardCheck className="h-4 w-4 mr-1" /> Take Daily Check-In
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" data-testid="section-domain-cards">
        {DOMAINS.map((domain) => {
          const IconComp = domain.icon;
          const isDomainD = domain.key === "D";
          const isActive = isDomainD ? score?.domainDActive : true;
          const rawScore = score ? (score as any)[domain.scoreKey] : null;
          const domainScore = rawScore != null ? Number(rawScore) : null;
          const trend = score ? (score as any)[domain.trendKey] : null;

          return (
            <Card key={domain.key} className="p-4" data-testid={`card-domain-${domain.key}`}>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="rounded-md p-2 bg-rose-100 dark:bg-rose-900/30 shrink-0">
                  <IconComp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" data-testid={`text-domain-name-${domain.key}`}>
                    Domain {domain.key}: {domain.label}
                  </h3>
                </div>
              </div>

              {isDomainD && !isActive ? (
                <div className="text-center py-4">
                  <Badge variant="secondary" data-testid={`badge-domain-inactive-${domain.key}`}>Not Active</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Complete a daily check-in to activate</p>
                </div>
              ) : domainScore != null ? (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className={`text-2xl font-bold ${getScoreColor(domainScore)}`} data-testid={`text-domain-score-${domain.key}`}>
                      {Math.round(domainScore)}
                    </span>
                    <TrendIcon trend={trend} />
                  </div>
                  <Progress
                    value={domainScore}
                    className="h-2 mb-2"
                    data-testid={`progress-domain-${domain.key}`}
                  />
                </>
              ) : (
                <div className="text-center py-4">
                  <span className="text-2xl font-bold text-muted-foreground" data-testid={`text-domain-score-${domain.key}`}>--</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2" data-testid={`text-domain-desc-${domain.key}`}>
                {domain.description}
              </p>
            </Card>
          );
        })}
      </div>

      {!historyLoading && history && history.length > 0 && (
        <div className="mb-8">
          <HistoryChart history={history} />
        </div>
      )}
      {historyLoading && (
        <div className="mb-8">
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {!flagsLoading && activeFlags.length > 0 && (
        <div className="mb-8" data-testid="section-early-warnings">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Early Warning Flags
          </h2>
          <div className="space-y-4">
            {activeFlags.map((flag) => (
              <Card key={flag.id} className="p-5" data-testid={`card-flag-${flag.id}`}>
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <Badge variant="secondary" className={getFlagBadgeStyle(flag.flagLevel)} data-testid={`badge-flag-level-${flag.id}`}>
                    <AlertTriangle className="h-3 w-3 mr-1" /> {flag.flagLevel}
                  </Badge>
                  <span className="text-xs text-muted-foreground" data-testid={`text-flag-domain-${flag.id}`}>
                    Domain: {flag.triggerDomain}
                  </span>
                </div>
                <div className="space-y-3">
                  <div data-testid={`section-flag-what-${flag.id}`}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">What Changed</p>
                    <p className="text-sm">{flag.whatChanged}</p>
                  </div>
                  <div data-testid={`section-flag-why-${flag.id}`}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Why It Matters</p>
                    <p className="text-sm">{flag.whyItMatters}</p>
                  </div>
                  <div data-testid={`section-flag-action-${flag.id}`}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Navigation Action</p>
                    <p className="text-sm">{flag.navigationAction}</p>
                  </div>
                  <div data-testid={`section-flag-target-${flag.id}`}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">30-Day Target</p>
                    <p className="text-sm">{flag.thirtyDayTarget}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {flagsLoading && (
        <div className="mb-8 space-y-3">
          <Skeleton className="h-32" />
        </div>
      )}
    </div>
  );
}
