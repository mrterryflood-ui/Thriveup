import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Target, Users, BarChart3, Download, RefreshCw,
  AlertTriangle, CheckCircle2, TrendingUp, Brain, ArrowRight,
  ChevronDown, ChevronUp, FileText, Zap, Star, Eye
} from "lucide-react";
import { Link } from "wouter";
import { TrainingGuideButton } from "@/components/training-guide";

interface PeerScore {
  depth: number;
  breadth: number;
  executionCapability: number;
  ecosystemIntegration: number;
  grantReadiness: number;
}

interface PeerEvaluation {
  evaluatorId: string;
  evaluatorName: string;
  targetId: string;
  targetName: string;
  scores: PeerScore;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

interface ExecutiveSummary {
  platformId: string;
  platformName: string;
  selfAssessment: {
    mission: string;
    keyStrengths: string[];
    currentCapabilities: string[];
    ecosystemContribution: string;
    gapsSelfIdentified: string[];
    readinessLevel: string;
  };
}

interface EcosystemVerdict {
  overallHealth: string;
  topPerformers: { name: string; score: number }[];
  needsAttention: { name: string; score: number; gaps: string[] }[];
  criticalGaps: string[];
  strategicRecommendations: string[];
}

interface GapAuditEntry {
  platformId: string;
  platformName: string;
  claimedReadiness: string;
  expectedScore: number;
  peerAvgScore: number;
  gap: number;
  verdict: "OUTPERFORMING" | "ALIGNED" | "OVERRATING" | "CRITICAL-DISCONNECT";
  selfClaimedStrengths: string[];
  selfIdentifiedGaps: string[];
  peerIdentifiedGaps: string[];
  peerIdentifiedStrengths: string[];
  blindSpots: string[];
  directiveFidelity: number;
  healthStatus: string;
  uptimePercent: number;
}

interface GapAudit {
  entries: GapAuditEntry[];
  overraters: GapAuditEntry[];
  aligned: GapAuditEntry[];
  outperformers: GapAuditEntry[];
  blindSpotSummary: string[];
  systemicGaps: string[];
}

interface CrossEvaluationReport {
  id: string;
  timestamp: string;
  totalPlatforms: number;
  executiveSummaries: ExecutiveSummary[];
  peerEvaluations: PeerEvaluation[];
  bluf: string;
  ecosystemVerdict: EcosystemVerdict;
  gapAudit: GapAudit;
  claudeVerification: string;
  generatedAt: string;
}

interface ReviewStatus {
  inProgress: boolean;
  lastReport: {
    id: string;
    timestamp: string;
    totalPlatforms: number;
    totalEvaluations: number;
    overallHealth: string;
  } | null;
}

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold w-8 text-right">{value}</span>
    </div>
  );
}

function HealthBadge({ health }: { health: string }) {
  const colors: Record<string, string> = {
    "STRONG": "bg-green-500/10 text-green-700 border-green-500/30",
    "OPERATIONAL": "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
    "NEEDS-WORK": "bg-red-500/10 text-red-700 border-red-500/30",
    "UNKNOWN": "bg-gray-500/10 text-gray-700 border-gray-500/30",
  };
  return <Badge className={`${colors[health] || colors.UNKNOWN} text-sm px-3 py-1`}>{health}</Badge>;
}

function ReadinessBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    "battle-ready": "bg-green-500/10 text-green-700",
    "operational": "bg-blue-500/10 text-blue-700",
    "developing": "bg-yellow-500/10 text-yellow-700",
    "nascent": "bg-red-500/10 text-red-700",
  };
  return <Badge className={colors[level] || "bg-gray-500/10 text-gray-700"}>{level}</Badge>;
}

export default function PeerReviewPage() {
  const { toast } = useToast();
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("bluf");

  const statusQuery = useQuery<ReviewStatus>({
    queryKey: ["/api/ecosystem/peer-review/status"],
    refetchInterval: 10000,
  });

  const reportQuery = useQuery<CrossEvaluationReport>({
    queryKey: ["/api/ecosystem/peer-review/latest"],
    enabled: !statusQuery.data?.inProgress,
    refetchInterval: 15000,
  });

  const runMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ecosystem/peer-review/run"),
    onSuccess: () => {
      toast({ title: "Cross-Evaluation Started", description: "Full ecosystem peer review initiated. This will take several minutes." });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/peer-review/status"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const report = reportQuery.data;
  const isRunning = statusQuery.data?.inProgress;

  const platformAverages = report ? (() => {
    const map: Record<string, { name: string; scores: number[]; depths: number[]; breadths: number[]; execs: number[]; integrations: number[]; grants: number[] }> = {};
    report.peerEvaluations.forEach(e => {
      if (!map[e.targetId]) map[e.targetId] = { name: e.targetName, scores: [], depths: [], breadths: [], execs: [], integrations: [], grants: [] };
      map[e.targetId].scores.push(e.overallScore);
      map[e.targetId].depths.push(e.scores.depth);
      map[e.targetId].breadths.push(e.scores.breadth);
      map[e.targetId].execs.push(e.scores.executionCapability);
      map[e.targetId].integrations.push(e.scores.ecosystemIntegration);
      map[e.targetId].grants.push(e.scores.grantReadiness);
    });
    return Object.entries(map).map(([id, d]) => ({
      id,
      name: d.name,
      overall: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length * 10) / 10,
      depth: Math.round(d.depths.reduce((a, b) => a + b, 0) / d.depths.length * 10) / 10,
      breadth: Math.round(d.breadths.reduce((a, b) => a + b, 0) / d.breadths.length * 10) / 10,
      execution: Math.round(d.execs.reduce((a, b) => a + b, 0) / d.execs.length * 10) / 10,
      integration: Math.round(d.integrations.reduce((a, b) => a + b, 0) / d.integrations.length * 10) / 10,
      grantReady: Math.round(d.grants.reduce((a, b) => a + b, 0) / d.grants.length * 10) / 10,
      peerCount: d.scores.length,
    })).sort((a, b) => b.overall - a.overall);
  })() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Ecosystem Cross-Evaluation</h1>
            </div>
            <p className="text-muted-foreground">MAP-GAP peer review at scale — every platform evaluates every peer</p>
          </div>
          <div className="flex items-center gap-3">
            <TrainingGuideButton moduleId="peer-review" />
            <Link href="/ops-center">
              <Button variant="outline" data-testid="link-ops-center">
                <ArrowRight className="w-4 h-4 mr-2" />
                Ops Center
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => window.open("/api/ecosystem/peer-review/report-doc", "_blank")}
              disabled={!report}
              data-testid="button-download-report"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button
              onClick={() => runMutation.mutate()}
              disabled={isRunning || runMutation.isPending}
              data-testid="button-run-evaluation"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "Evaluation Running..." : "Run Cross-Evaluation"}
            </Button>
          </div>
        </div>

        {isRunning && (
          <Card className="p-6 mb-6 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-700">Cross-Evaluation In Progress</p>
                <p className="text-sm text-muted-foreground">Every platform is generating its executive summary, then evaluating its peers on depth, breadth, and execution capability. This takes 3-5 minutes.</p>
              </div>
            </div>
            <Progress value={33} className="mt-4" />
          </Card>
        )}

        {!report && !isRunning && (
          <Card className="p-12 text-center mb-6">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Cross-Evaluation Available</h2>
            <p className="text-muted-foreground mb-4">Run the first ecosystem-wide peer review to see the BLUF and full report.</p>
            <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending} data-testid="button-first-evaluation">
              <Zap className="w-4 h-4 mr-2" />
              Run First Cross-Evaluation
            </Button>
          </Card>
        )}

        {report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                <div className="text-2xl font-bold" data-testid="text-total-platforms">{report.totalPlatforms}</div>
                <div className="text-xs text-muted-foreground">Platforms Evaluated</div>
              </Card>
              <Card className="p-4 text-center">
                <Eye className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                <div className="text-2xl font-bold" data-testid="text-total-evaluations">{report.peerEvaluations.length}</div>
                <div className="text-xs text-muted-foreground">Peer Evaluations</div>
              </Card>
              <Card className="p-4 text-center">
                <Target className="w-6 h-6 mx-auto text-green-600 mb-1" />
                <div className="text-2xl font-bold" data-testid="text-ecosystem-health">
                  <HealthBadge health={report.ecosystemVerdict.overallHealth} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Ecosystem Health</div>
              </Card>
              <Card className="p-4 text-center">
                <BarChart3 className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                <div className="text-2xl font-bold" data-testid="text-generated-time">
                  {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className="text-xs text-muted-foreground">Report Date</div>
              </Card>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="bluf" data-testid="tab-bluf">
                  <FileText className="w-4 h-4 mr-2" />
                  BLUF
                </TabsTrigger>
                <TabsTrigger value="rankings" data-testid="tab-rankings">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Rankings
                </TabsTrigger>
                <TabsTrigger value="summaries" data-testid="tab-summaries">
                  <Brain className="w-4 h-4 mr-2" />
                  Executive Summaries
                </TabsTrigger>
                <TabsTrigger value="evaluations" data-testid="tab-evaluations">
                  <Users className="w-4 h-4 mr-2" />
                  Peer Evaluations
                </TabsTrigger>
                <TabsTrigger value="gap-audit" data-testid="tab-gap-audit">
                  <Target className="w-4 h-4 mr-2" />
                  Gap Audit
                </TabsTrigger>
                <TabsTrigger value="claude-verify" data-testid="tab-claude-verify">
                  <Eye className="w-4 h-4 mr-2" />
                  Claude Verification
                </TabsTrigger>
                <TabsTrigger value="verdict" data-testid="tab-verdict">
                  <Shield className="w-4 h-4 mr-2" />
                  Verdict
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bluf">
                <Card className="p-6 border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold">BLUF — Bottom Line Up Front</h2>
                    <HealthBadge health={report.ecosystemVerdict.overallHealth} />
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none" data-testid="text-bluf-content">
                    {report.bluf.split("\n\n").map((paragraph, i) => (
                      <p key={i} className="text-base leading-relaxed mb-3">{paragraph}</p>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{report.totalPlatforms} platforms | {report.peerEvaluations.length} peer evaluations</span>
                    <span>Generated {new Date(report.generatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CST</span>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card className="p-5">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 text-green-600" />
                      Top Performers
                    </h3>
                    <div className="space-y-2">
                      {report.ecosystemVerdict.topPerformers.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950/30" data-testid={`text-top-performer-${i}`}>
                          <span className="font-medium">{t.name}</span>
                          <Badge className="bg-green-500/10 text-green-700">{t.score}/10</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-5">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Needs Attention
                    </h3>
                    <div className="space-y-2">
                      {report.ecosystemVerdict.needsAttention.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-600 p-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>All platforms above threshold</span>
                        </div>
                      ) : (
                        report.ecosystemVerdict.needsAttention.map((n, i) => (
                          <div key={i} className="p-2 rounded bg-orange-50 dark:bg-orange-950/30" data-testid={`text-needs-attention-${i}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{n.name}</span>
                              <Badge className="bg-orange-500/10 text-orange-700">{n.score}/10</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{n.gaps.join(", ")}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="rankings">
                <Card className="p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Platform Rankings — Peer-Evaluated Scores
                  </h2>
                  <div className="space-y-4">
                    {platformAverages.map((p, rank) => (
                      <div key={p.id} className="border rounded-lg p-4" data-testid={`card-platform-ranking-${p.id}`}>
                        <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setExpandedPlatform(expandedPlatform === p.id ? null : p.id)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rank < 3 ? "bg-yellow-500/10 text-yellow-700" : rank < 8 ? "bg-blue-500/10 text-blue-700" : "bg-gray-500/10 text-gray-600"}`}>
                              #{rank + 1}
                            </div>
                            <div>
                              <span className="font-semibold">{p.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">({p.peerCount} peer reviews)</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={p.overall >= 7 ? "bg-green-500/10 text-green-700" : p.overall >= 5 ? "bg-yellow-500/10 text-yellow-700" : "bg-red-500/10 text-red-700"}>
                              {p.overall}/10
                            </Badge>
                            {expandedPlatform === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                        {expandedPlatform === p.id && (
                          <div className="space-y-2 mt-3 pt-3 border-t">
                            <ScoreBar label="Depth" value={p.depth} />
                            <ScoreBar label="Breadth" value={p.breadth} />
                            <ScoreBar label="Execution" value={p.execution} />
                            <ScoreBar label="Integration" value={p.integration} />
                            <ScoreBar label="Grant Ready" value={p.grantReady} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="summaries">
                <div className="space-y-4">
                  {report.executiveSummaries.map(s => (
                    <Card key={s.platformId} className="p-5" data-testid={`card-summary-${s.platformId}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{s.platformName}</h3>
                        <ReadinessBadge level={s.selfAssessment.readinessLevel} />
                      </div>
                      <p className="text-muted-foreground mb-3 italic">"{s.selfAssessment.mission}"</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-green-700 mb-1">Key Strengths</h4>
                          <ul className="text-sm space-y-1">
                            {s.selfAssessment.keyStrengths.map((str, i) => (
                              <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-green-500 mt-1 shrink-0" />{str}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-orange-700 mb-1">Self-Identified Gaps</h4>
                          <ul className="text-sm space-y-1">
                            {s.selfAssessment.gapsSelfIdentified.map((gap, i) => (
                              <li key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-orange-500 mt-1 shrink-0" />{gap}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <p className="text-sm mt-3 text-blue-700 dark:text-blue-400">
                        <strong>Ecosystem Contribution:</strong> {s.selfAssessment.ecosystemContribution}
                      </p>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evaluations">
                <div className="space-y-4">
                  {platformAverages.map(p => {
                    const evals = report.peerEvaluations.filter(e => e.targetId === p.id);
                    return (
                      <Card key={p.id} className="p-5" data-testid={`card-evaluations-${p.id}`}>
                        <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setExpandedPlatform(expandedPlatform === `eval-${p.id}` ? null : `eval-${p.id}`)}>
                          <div>
                            <h3 className="font-semibold">{p.name}</h3>
                            <span className="text-sm text-muted-foreground">{evals.length} peer evaluations received</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={p.overall >= 7 ? "bg-green-500/10 text-green-700" : p.overall >= 5 ? "bg-yellow-500/10 text-yellow-700" : "bg-red-500/10 text-red-700"}>
                              Avg: {p.overall}/10
                            </Badge>
                            {expandedPlatform === `eval-${p.id}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                        {expandedPlatform === `eval-${p.id}` && (
                          <div className="space-y-3 mt-3 pt-3 border-t">
                            {evals.map((ev, i) => (
                              <div key={i} className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Evaluated by {ev.evaluatorName}</span>
                                  <Badge variant="outline">{ev.overallScore}/10</Badge>
                                </div>
                                <div className="grid grid-cols-5 gap-2 text-xs text-center mb-2">
                                  <div><div className="font-bold">{ev.scores.depth}</div><div className="text-muted-foreground">Depth</div></div>
                                  <div><div className="font-bold">{ev.scores.breadth}</div><div className="text-muted-foreground">Breadth</div></div>
                                  <div><div className="font-bold">{ev.scores.executionCapability}</div><div className="text-muted-foreground">Execution</div></div>
                                  <div><div className="font-bold">{ev.scores.ecosystemIntegration}</div><div className="text-muted-foreground">Integration</div></div>
                                  <div><div className="font-bold">{ev.scores.grantReadiness}</div><div className="text-muted-foreground">Grant</div></div>
                                </div>
                                <div className="text-xs space-y-1">
                                  <p><span className="text-green-700 font-medium">Strengths:</span> {ev.strengths.join(", ")}</p>
                                  <p><span className="text-orange-700 font-medium">Gaps:</span> {ev.gaps.join(", ")}</p>
                                  <p><span className="text-blue-700 font-medium">Recommendation:</span> {ev.recommendation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="gap-audit">
                <div className="space-y-6">
                  {report.gapAudit ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 border-2 border-red-500/30 bg-red-50/50 dark:bg-red-950/20">
                          <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2" data-testid="heading-overraters">
                            <AlertTriangle className="w-4 h-4" />
                            Overraters ({report.gapAudit.overraters.length})
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">Claiming more than they deliver</p>
                          {report.gapAudit.overraters.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None identified</p>
                          ) : (
                            <ul className="space-y-1">
                              {report.gapAudit.overraters.map((o, i) => (
                                <li key={i} className="text-sm p-2 bg-red-100 dark:bg-red-900/30 rounded" data-testid={`text-overrater-${i}`}>
                                  <span className="font-semibold">{o.platformName}</span>
                                  <span className="text-xs block text-red-600">
                                    Claims "{o.claimedReadiness}" — Peers: {o.peerAvgScore}/10 — Gap: {o.gap}
                                  </span>
                                  {o.blindSpots.length > 0 && (
                                    <span className="text-xs block mt-1 text-red-500">Blind spots: {o.blindSpots.join(", ")}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card>

                        <Card className="p-4 border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                          <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2" data-testid="heading-outperformers">
                            <TrendingUp className="w-4 h-4" />
                            Outperformers ({report.gapAudit.outperformers.length})
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">Delivering more than they claim</p>
                          {report.gapAudit.outperformers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None identified</p>
                          ) : (
                            <ul className="space-y-1">
                              {report.gapAudit.outperformers.map((o, i) => (
                                <li key={i} className="text-sm p-2 bg-green-100 dark:bg-green-900/30 rounded" data-testid={`text-outperformer-${i}`}>
                                  <span className="font-semibold">{o.platformName}</span>
                                  <span className="text-xs block text-green-600">
                                    Claims "{o.claimedReadiness}" — Peers: {o.peerAvgScore}/10 — Gap: +{o.gap}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card>

                        <Card className="p-4 border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                          <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2" data-testid="heading-aligned">
                            <CheckCircle2 className="w-4 h-4" />
                            Aligned ({report.gapAudit.aligned.length})
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">Say and do match</p>
                          {report.gapAudit.aligned.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None identified</p>
                          ) : (
                            <ul className="space-y-1">
                              {report.gapAudit.aligned.map((a, i) => (
                                <li key={i} className="text-sm p-2 bg-blue-100 dark:bg-blue-900/30 rounded" data-testid={`text-aligned-${i}`}>
                                  <span className="font-semibold">{a.platformName}</span>
                                  <span className="text-xs block text-blue-600">
                                    Peers: {a.peerAvgScore}/10 — Gap: {a.gap}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card>
                      </div>

                      {report.gapAudit.blindSpotSummary.length > 0 && (
                        <Card className="p-4 border-2 border-orange-500/30">
                          <h3 className="font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-3" data-testid="heading-blind-spots">
                            <Eye className="w-4 h-4" />
                            Ecosystem Blind Spots
                          </h3>
                          <ul className="space-y-1">
                            {report.gapAudit.blindSpotSummary.map((bs, i) => (
                              <li key={i} className="text-sm p-2 bg-orange-50 dark:bg-orange-950/20 rounded flex items-start gap-2" data-testid={`text-blind-spot-${i}`}>
                                <AlertTriangle className="w-3 h-3 text-orange-500 mt-1 shrink-0" />
                                {bs}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}

                      {report.gapAudit.systemicGaps.length > 0 && (
                        <Card className="p-4 border-2 border-red-500/30">
                          <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3" data-testid="heading-systemic-gaps">
                            <Zap className="w-4 h-4" />
                            Systemic Gaps
                          </h3>
                          <ul className="space-y-1">
                            {report.gapAudit.systemicGaps.map((sg, i) => (
                              <li key={i} className="text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded flex items-start gap-2" data-testid={`text-systemic-gap-${i}`}>
                                <AlertTriangle className="w-3 h-3 text-red-500 mt-1 shrink-0" />
                                {sg}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}

                      <Card className="p-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2" data-testid="heading-gap-matrix">
                          <BarChart3 className="w-4 h-4" />
                          Full Platform Gap Matrix
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left">
                                <th className="p-2">Platform</th>
                                <th className="p-2">Claimed</th>
                                <th className="p-2">Peer Avg</th>
                                <th className="p-2">Gap</th>
                                <th className="p-2">Verdict</th>
                                <th className="p-2">Fidelity</th>
                                <th className="p-2">Blind Spots</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.gapAudit.entries.map((e, i) => {
                                const verdictColor = e.verdict === "OUTPERFORMING" ? "text-green-600" : e.verdict === "ALIGNED" ? "text-blue-600" : e.verdict === "OVERRATING" ? "text-orange-600" : "text-red-600";
                                return (
                                  <tr key={i} className="border-b hover:bg-muted/50" data-testid={`row-gap-entry-${i}`}>
                                    <td className="p-2 font-medium">{e.platformName}</td>
                                    <td className="p-2">{e.claimedReadiness}</td>
                                    <td className="p-2">{e.peerAvgScore}/10</td>
                                    <td className="p-2 font-mono">{e.gap > 0 ? "+" : ""}{e.gap}</td>
                                    <td className={`p-2 font-bold ${verdictColor}`}>{e.verdict}</td>
                                    <td className="p-2">{e.directiveFidelity}%</td>
                                    <td className="p-2">{e.blindSpots.length > 0 ? e.blindSpots.join(", ") : "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </>
                  ) : (
                    <Card className="p-6">
                      <p className="text-muted-foreground">Gap audit data not available. Run a new evaluation to generate the say-vs-do analysis.</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="claude-verify">
                <Card className="p-6 border-2 border-violet-500/30 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold" data-testid="heading-claude-verification">Claude Independent Verification</h2>
                      <p className="text-sm text-muted-foreground">
                        Generated by Claude (Anthropic) as an independent verifier — separate from the AI that produced the evaluations.
                        Checks for bias, blind spots, and honesty.
                      </p>
                    </div>
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    {report.claudeVerification ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed bg-white/60 dark:bg-black/20 p-4 rounded-lg border" data-testid="text-claude-verification">
                        {report.claudeVerification}
                      </div>
                    ) : (
                      <p className="text-muted-foreground" data-testid="text-claude-unavailable">
                        Claude verification not available for this report. Run a new evaluation to include independent verification.
                      </p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="verdict">
                <div className="space-y-6">
                  <Card className="p-6 border-2 border-purple-500/30">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-purple-600" />
                      Ecosystem Verdict
                      <HealthBadge health={report.ecosystemVerdict.overallHealth} />
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Critical Gaps (Ecosystem-Wide)
                        </h3>
                        <ul className="space-y-1">
                          {report.ecosystemVerdict.criticalGaps.map((gap, i) => (
                            <li key={i} className="text-sm flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded" data-testid={`text-critical-gap-${i}`}>
                              <AlertTriangle className="w-3 h-3 text-red-500 mt-1 shrink-0" />
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Strategic Recommendations
                        </h3>
                        <ol className="space-y-2">
                          {report.ecosystemVerdict.strategicRecommendations.map((rec, i) => (
                            <li key={i} className="text-sm flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded" data-testid={`text-recommendation-${i}`}>
                              <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
                              {rec}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
