import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, Shield, Target, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, ChevronRight, Activity, Heart,
  BarChart3, FileBarChart, Globe, FileText, DollarSign,
  Calendar, CheckCircle2, Clock, Lightbulb, Route,
  ArrowUpRight, ArrowDownRight, ExternalLink,
} from "lucide-react";

interface CommandCenterData {
  coalitionHealth: {
    sectorCoverage: number;
    totalSectors: number;
    memberCount: number;
    latestCapacityScore: number;
    capacityTrend: Array<{ score: number; date: string }>;
    meetingCount: number;
    lastMeetingDate: string | null;
    pendingActionItems: number;
    costMatchTotal: number;
    costMatchTarget: number;
    actionPlansByPhase: Record<string, number>;
  };
  preventionImpact: {
    youthReached: number;
    curriculumCompletionRate: number;
    completionByAgeGroup: Record<string, number>;
    completionByTopic: Record<string, number>;
    avgRiskScore: number;
    avgProtectiveScore: number;
    riskTrend: Array<{ score: number; date: string }>;
    protectiveTrend: Array<{ score: number; date: string }>;
    activeEBPs: number;
    totalEBPs: number;
    avgFidelityScore: number;
    activeStrategies: number;
    plannedStrategies: number;
    totalAssessments: number;
    totalSurveyResponses: number;
  };
  communityEngagement: {
    readinessStage: string;
    readinessScore: number;
    surveyCoverage: number;
    coreMeasures: Array<{
      ageGroup: string;
      alcoholPast30: number;
      marijuanaPast30: number;
      tobaccoPast30: number;
      prescriptionPast30: number;
      periodType: string;
    }>;
    parentCompletionRate: number;
    totalParentModules: number;
    completedParentModules: number;
    familyAssessments: number;
    campaignReach: number;
    campaignEngagement: number;
    campaignEvents: number;
    engagementRate: number;
    activeCampaigns: number;
    reaimScores: {
      reach: number;
      effectiveness: number;
      adoption: number;
      implementation: number;
      maintenance: number;
    };
    cfirScores: {
      interventionCharacteristics: number;
      outerSetting: number;
      innerSetting: number;
      individuals: number;
      implementationProcess: number;
      overallScore: number;
    } | null;
  };
  grantReadiness: {
    readinessScore: number;
    completedItems: number;
    totalItems: number;
    committedSectors: number;
    totalCommitments: number;
    deliveredCommitments: number;
    costMatchDocumented: number;
    daysUntilDeadline: number;
  };
  dosage: {
    totalMinutes: number;
    totalHours: number;
    uniqueParticipants: number;
    preventionOutcomes: number;
  };
  alerts: string[];
}

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  testId,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Activity;
  href?: string;
  trend?: "up" | "down" | "neutral";
  testId: string;
}) {
  const content = (
    <Card className={`p-4 ${href ? "hover-elevate cursor-pointer" : ""}`} data-testid={testId}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{value}</p>
            {trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />}
            {trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="rounded-md p-2 bg-muted shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {href && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <span>View details</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      )}
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function QuickLink({ label, href, testId }: { label: string; href: string; testId: string }) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className="text-xs gap-1" data-testid={testId}>
        {label}
        <ExternalLink className="h-3 w-3" />
      </Button>
    </Link>
  );
}

function ProgressRing({ value, size = 80, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-primary transition-all duration-500" />
    </svg>
  );
}

function ReaimBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1">
        <Progress value={pct} className="h-2" />
      </div>
      <span className="text-xs font-medium w-10 text-right">{typeof value === "number" ? value : 0}</span>
    </div>
  );
}

export default function DfcCommandCenterPage() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<CommandCenterData>({
    queryKey: ["/api/dfc/command-center"],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/dfc/sync-bridges", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dfc/command-center"] });
      toast({ title: "Data bridges synced successfully" });
    },
    onError: () => {
      toast({ title: "Sync failed", description: "Could not sync data bridges. Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center space-y-4">
        <LayoutDashboard className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold" data-testid="text-command-center-title">DFC Command Center</h1>
        <p className="text-muted-foreground">Unable to load command center data. Please try again.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/dfc/command-center"] })} data-testid="button-retry">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const { coalitionHealth, preventionImpact, communityEngagement, grantReadiness, alerts } = data;
  const costMatchPct = coalitionHealth.costMatchTarget > 0 ? Math.round((coalitionHealth.costMatchTotal / coalitionHealth.costMatchTarget) * 100) : 0;

  const recommendations: string[] = [];
  if (coalitionHealth.sectorCoverage < 12) recommendations.push(`Fill ${12 - coalitionHealth.sectorCoverage} remaining sector gaps to meet DFC eligibility`);
  if (coalitionHealth.meetingCount === 0) recommendations.push("Schedule your first coalition meeting to begin collaborative planning");
  if (grantReadiness.readinessScore < 50) recommendations.push("Complete more readiness checklist items to strengthen your grant application");
  if (preventionImpact.totalEBPs === 0) recommendations.push("Select and register at least one evidence-based program");
  if (communityEngagement.surveyCoverage < 5) recommendations.push("Conduct stakeholder surveys across more populations for comprehensive data");
  if (costMatchPct < 50) recommendations.push("Document additional cost match contributions toward the $125K target");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-command-center-title">DFC Command Center</h1>
          <p className="text-muted-foreground mt-1">Unified Drug-Free Communities dashboard — all metrics in one place</p>
        </div>
        <Button
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-bridges"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Syncing..." : "Sync Data"}
        </Button>
      </div>

      {alerts.length > 0 && (
        <Card className="p-4 border-amber-500/50 bg-amber-500/5" data-testid="card-alerts">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">Attention Needed</p>
              {alerts.map((alert, i) => (
                <p key={i} className="text-sm text-muted-foreground" data-testid={`text-alert-${i}`}>{alert}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5" data-testid="card-coalition-health">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" /> Coalition Health
            </h2>
            <div className="flex gap-1 flex-wrap">
              <QuickLink label="Coalition" href="/coalition" testId="link-coalition" />
              <QuickLink label="DFC Readiness" href="/dfc-readiness" testId="link-readiness-from-coalition" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              label="Sector Coverage"
              value={`${coalitionHealth.sectorCoverage}/12`}
              subtitle={`${Math.round((coalitionHealth.sectorCoverage / 12) * 100)}% represented`}
              icon={Target}
              href="/coalition"
              testId="metric-sector-coverage"
            />
            <MetricCard
              label="Coalition Members"
              value={coalitionHealth.memberCount}
              icon={Users}
              href="/coalition"
              testId="metric-member-count"
            />
            <MetricCard
              label="Capacity Score"
              value={coalitionHealth.latestCapacityScore}
              subtitle={coalitionHealth.capacityTrend.length > 1 ? "Trend available" : ""}
              icon={TrendingUp}
              href="/coalition"
              testId="metric-capacity-score"
            />
            <MetricCard
              label="Meetings"
              value={coalitionHealth.meetingCount}
              subtitle={`${coalitionHealth.pendingActionItems} pending actions`}
              icon={Calendar}
              href="/coalition"
              testId="metric-meetings"
            />
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Cost Match Progress</span>
                <span className="font-medium">${coalitionHealth.costMatchTotal.toLocaleString()} / $125K</span>
              </div>
              <Progress value={costMatchPct} className="h-2" />
            </div>

            {Object.keys(coalitionHealth.actionPlansByPhase).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Action Plans by SPF Phase</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(coalitionHealth.actionPlansByPhase).map(([phase, count]) => (
                    <Badge key={phase} variant="secondary" className="text-xs">{phase}: {count}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5" data-testid="card-prevention-impact">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" /> Prevention Impact
            </h2>
            <div className="flex gap-1 flex-wrap">
              <QuickLink label="Prevention" href="/prevention" testId="link-prevention" />
              <QuickLink label="Strategies" href="/prevention-strategies" testId="link-strategies" />
              <QuickLink label="Parent Ed" href="/parent-education" testId="link-parent-ed" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              label="Youth Reached"
              value={preventionImpact.youthReached}
              subtitle="unique participants"
              icon={Users}
              href="/prevention"
              testId="metric-youth-reached"
            />
            <MetricCard
              label="Curriculum Completion"
              value={`${preventionImpact.curriculumCompletionRate}%`}
              icon={CheckCircle2}
              href="/prevention"
              testId="metric-curriculum-completion"
            />
            <MetricCard
              label="Risk Score (avg)"
              value={preventionImpact.avgRiskScore}
              icon={TrendingDown}
              trend={preventionImpact.riskTrend.length > 1 && preventionImpact.riskTrend[0]?.score < preventionImpact.riskTrend[1]?.score ? "up" : "down"}
              href="/prevention"
              testId="metric-risk-score"
            />
            <MetricCard
              label="Protective Score (avg)"
              value={preventionImpact.avgProtectiveScore}
              icon={TrendingUp}
              trend={preventionImpact.protectiveTrend.length > 1 && preventionImpact.protectiveTrend[0]?.score > preventionImpact.protectiveTrend[1]?.score ? "up" : "down"}
              href="/prevention"
              testId="metric-protective-score"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active EBPs</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{preventionImpact.activeEBPs} / {preventionImpact.totalEBPs}</span>
                {preventionImpact.avgFidelityScore > 0 && (
                  <Badge variant="secondary" className="text-xs">Fidelity: {preventionImpact.avgFidelityScore}%</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Environmental Strategies</span>
              <span className="font-medium">{preventionImpact.activeStrategies} active, {preventionImpact.plannedStrategies} planned</span>
            </div>

            {Object.keys(preventionImpact.completionByTopic).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Completion by Substance Topic</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(preventionImpact.completionByTopic).map(([topic, count]) => (
                    <Badge key={topic} variant="secondary" className="text-xs">{topic}: {count}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5" data-testid="card-community-engagement">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" /> Community Engagement
            </h2>
            <div className="flex gap-1 flex-wrap">
              <QuickLink label="DFC Reporting" href="/dfc-reporting" testId="link-dfc-reporting" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              label="Readiness Stage"
              value={communityEngagement.readinessStage}
              subtitle={`Score: ${communityEngagement.readinessScore}/9`}
              icon={Activity}
              href="/dfc-reporting"
              testId="metric-readiness-stage"
            />
            <MetricCard
              label="Survey Coverage"
              value={`${communityEngagement.surveyCoverage}/10`}
              subtitle="populations surveyed"
              icon={FileBarChart}
              href="/dfc-reporting"
              testId="metric-survey-coverage"
            />
            <MetricCard
              label="Parent Ed Completion"
              value={`${communityEngagement.parentCompletionRate}%`}
              subtitle={`${communityEngagement.completedParentModules}/${communityEngagement.totalParentModules} modules`}
              icon={Heart}
              href="/parent-education"
              testId="metric-parent-completion"
            />
            <MetricCard
              label="Campaign Reach"
              value={communityEngagement.campaignReach.toLocaleString()}
              subtitle={`${communityEngagement.engagementRate}% engagement`}
              icon={BarChart3}
              href="/dfc-reporting"
              testId="metric-campaign-reach"
            />
          </div>

          {communityEngagement.coreMeasures.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">DFC Core Measures (30-Day Use Rates)</p>
              <div className="grid grid-cols-2 gap-2">
                {communityEngagement.coreMeasures.slice(0, 4).map((m, i) => (
                  <Link href="/dfc-reporting" key={i}>
                    <Card className="p-3 hover-elevate cursor-pointer" data-testid={`card-core-measure-${i}`}>
                      <p className="text-xs text-muted-foreground mb-1">{m.ageGroup} ({m.periodType})</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <span>Alcohol: {m.alcoholPast30}%</span>
                        <span>Marijuana: {m.marijuanaPast30}%</span>
                        <span>Tobacco: {m.tobaccoPast30}%</span>
                        <span>Rx: {m.prescriptionPast30}%</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">RE-AIM Scorecard</p>
            <div className="space-y-2">
              <ReaimBar label="Reach" value={communityEngagement.reaimScores.reach} max={Math.max(communityEngagement.reaimScores.reach, 100)} />
              <ReaimBar label="Effectiveness" value={communityEngagement.reaimScores.effectiveness} />
              <ReaimBar label="Adoption" value={communityEngagement.reaimScores.adoption} max={10} />
              <ReaimBar label="Implementation" value={communityEngagement.reaimScores.implementation} />
              <ReaimBar label="Maintenance" value={communityEngagement.reaimScores.maintenance} max={Math.max(communityEngagement.reaimScores.maintenance, 10)} />
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="card-grant-readiness">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" /> Grant Readiness
            </h2>
            <div className="flex gap-1 flex-wrap">
              <QuickLink label="DFC Readiness" href="/dfc-readiness" testId="link-dfc-readiness" />
              <QuickLink label="Ecosystem" href="/ecosystem" testId="link-ecosystem" />
              <QuickLink label="Grant Hub" href="/grants" testId="link-grant-hub" />
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <div className="relative shrink-0">
              <ProgressRing value={grantReadiness.readinessScore} size={88} strokeWidth={8} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{grantReadiness.readinessScore}%</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Checklist</span>
                <span className="font-medium">{grantReadiness.completedItems}/{grantReadiness.totalItems} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sectors Committed</span>
                <span className="font-medium">{grantReadiness.committedSectors}/12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commitments Delivered</span>
                <span className="font-medium">{grantReadiness.deliveredCommitments}/{grantReadiness.totalCommitments}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/logic-model">
              <div className="flex items-center justify-between text-sm hover-elevate rounded-md p-2 -mx-2 cursor-pointer" data-testid="link-logic-model-status">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  <span>Logic Model</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/grant-narrative">
              <div className="flex items-center justify-between text-sm hover-elevate rounded-md p-2 -mx-2 cursor-pointer" data-testid="link-grant-narrative-status">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Grant Narrative</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <div className="flex items-center justify-between text-sm p-2 -mx-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Cost Match Documented</span>
              </div>
              <span className="font-medium">${grantReadiness.costMatchDocumented.toLocaleString()}</span>
            </div>
            <Card className="p-3 border-dashed" data-testid="card-deadline">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Days Until Deadline</span>
                </div>
                <Badge variant={grantReadiness.daysUntilDeadline < 90 ? "destructive" : "secondary"}>
                  {grantReadiness.daysUntilDeadline} days
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Application deadline: April 14, 2026</p>
            </Card>
          </div>
        </Card>
      </div>

      {recommendations.length > 0 && (
        <Card className="p-5" data-testid="card-recommendations">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5" /> What to Do Next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" data-testid={`text-recommendation-${i}`}>
                <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
