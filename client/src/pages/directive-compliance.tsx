import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRight,
  RefreshCw, Send, Target, Activity, Shield, BarChart3,
  ExternalLink, AlertOctagon, Eye, Zap, FileCheck,
  ChevronRight, ChevronDown, Radio, TrendingUp, Globe,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrainingGuideButton } from "@/components/training-guide";

interface IntelPlatform {
  id: string;
  name: string;
  domain: string;
  status: string;
  connected: boolean;
  lastHeartbeat: string | null;
  heartbeatAgeMinutes: number | null;
  fidelity: { score: number; grade: string; total: number; acknowledged: number; delivered: number; pending: number };
  ackQuality: { verified: number; substantive: number; weak: number; legacy: number };
  completedWork: { directive: string; whatWasDone: string; evidenceUrl: string | null; verificationStatus: string; ackQuality: string; acknowledgedAt: string | null }[];
  overdue: { directive: string; directiveId: string }[];
  grantAlignment: string[];
}

interface IntelReport {
  generatedAt: string;
  ecosystemSummary: {
    total: number;
    connected: number;
    disconnected: number;
    avgFidelity: number;
    avgGrade: string;
    workChainsTriggered: number;
  };
  platforms: IntelPlatform[];
  grantReadiness: Record<string, { platforms: number; avgFidelity: number; overdueTasks: number }>;
  verificationSummary: { verified: number; unverified: number; failed: number; noUrl: number };
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300",
  B: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
  C: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300",
  D: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300",
  F: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  online: CheckCircle2,
  degraded: AlertTriangle,
  offline: XCircle,
  unknown: AlertOctagon,
};

const STATUS_COLORS: Record<string, string> = {
  online: "text-emerald-600",
  degraded: "text-amber-600",
  offline: "text-red-600",
  unknown: "text-gray-400",
};

function getPriorityScore(p: IntelPlatform): number {
  let score = 0;
  if (p.status === "offline") score += 100;
  if (p.status === "degraded") score += 50;
  score += p.overdue.length * 30;
  score += (100 - p.fidelity.score);
  if (p.fidelity.pending > 0) score += p.fidelity.pending * 10;
  return score;
}

export default function DirectiveCompliancePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const { data: intelReport, isLoading, refetch } = useQuery<IntelReport>({
    queryKey: ["/api/ecosystem/intelligence-report"],
  });

  const resendMutation = useMutation({
    mutationFn: async (platformId: string) => {
      await apiRequest("POST", "/api/ecosystem/resend-directives", { platformId });
    },
    onSuccess: () => {
      toast({ title: "Directives resent", description: "Pending directives have been re-delivered." });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/intelligence-report"] });
    },
    onError: () => {
      toast({ title: "Resend failed", description: "Could not resend directives.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!intelReport) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">Intelligence Report Unavailable</h2>
          <p className="text-muted-foreground mb-4">Could not load the ecosystem intelligence report.</p>
          <Button onClick={() => refetch()} data-testid="button-retry">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  const platforms = intelReport.platforms;
  const sorted = [...platforms].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  const failing = sorted.filter(p => p.fidelity.grade === "F" || p.fidelity.grade === "D" || p.overdue.length > 0 || p.status === "offline");
  const compliant = sorted.filter(p => p.fidelity.grade !== "F" && p.fidelity.grade !== "D" && p.overdue.length === 0 && p.status !== "offline");
  const totalOverdue = platforms.reduce((acc, p) => acc + p.overdue.length, 0);
  const totalPending = platforms.reduce((acc, p) => acc + p.fidelity.pending, 0);
  const offlineCount = platforms.filter(p => p.status === "offline").length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6" data-testid="directive-compliance-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" data-testid="page-title-compliance">
            <FileCheck className="h-7 w-7 text-primary" />
            Directive Compliance Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tasks requested, due dates, completion status, and non-compliance reasons — all in one view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrainingGuideButton moduleId="directive-compliance" />
          <Button variant="outline" onClick={() => refetch()} className="gap-2" data-testid="button-refresh-compliance">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="text-center border-2 border-primary/20" data-testid="stat-avg-fidelity">
          <CardContent className="pt-4 pb-3">
            <div className={`text-3xl font-bold ${intelReport.ecosystemSummary.avgFidelity >= 75 ? "text-emerald-600" : intelReport.ecosystemSummary.avgFidelity >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {Math.round(intelReport.ecosystemSummary.avgFidelity)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Fidelity</div>
            <Badge className={`mt-1 ${GRADE_COLORS[intelReport.ecosystemSummary.avgGrade] || ""} text-xs border-0`}>
              Grade: {intelReport.ecosystemSummary.avgGrade}
            </Badge>
          </CardContent>
        </Card>
        <Card className="text-center" data-testid="stat-overdue">
          <CardContent className="pt-4 pb-3">
            <div className={`text-3xl font-bold ${totalOverdue > 0 ? "text-red-600" : "text-emerald-600"}`}>{totalOverdue}</div>
            <div className="text-xs text-muted-foreground">Overdue Tasks</div>
          </CardContent>
        </Card>
        <Card className="text-center" data-testid="stat-pending">
          <CardContent className="pt-4 pb-3">
            <div className={`text-3xl font-bold ${totalPending > 0 ? "text-amber-600" : "text-emerald-600"}`}>{totalPending}</div>
            <div className="text-xs text-muted-foreground">Pending Responses</div>
          </CardContent>
        </Card>
        <Card className="text-center" data-testid="stat-failing-platforms">
          <CardContent className="pt-4 pb-3">
            <div className={`text-3xl font-bold ${failing.length > 0 ? "text-red-600" : "text-emerald-600"}`}>{failing.length}</div>
            <div className="text-xs text-muted-foreground">Non-Compliant</div>
          </CardContent>
        </Card>
        <Card className="text-center" data-testid="stat-offline-count">
          <CardContent className="pt-4 pb-3">
            <div className={`text-3xl font-bold ${offlineCount > 0 ? "text-red-600" : "text-emerald-600"}`}>{offlineCount}</div>
            <div className="text-xs text-muted-foreground">Offline</div>
          </CardContent>
        </Card>
      </div>

      {intelReport.verificationSummary && (
        <Card data-testid="card-verification-summary">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-sm font-medium">Evidence Verification:</span>
              <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {intelReport.verificationSummary.verified} Verified</span>
              <span className="flex items-center gap-1 text-sm text-amber-600"><AlertTriangle className="h-4 w-4" /> {intelReport.verificationSummary.unverified} Unverified</span>
              <span className="flex items-center gap-1 text-sm text-red-600"><XCircle className="h-4 w-4" /> {intelReport.verificationSummary.failed} Failed</span>
              <span className="flex items-center gap-1 text-sm text-gray-400"><AlertOctagon className="h-4 w-4" /> {intelReport.verificationSummary.noUrl} No URL</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Failures & Action ({failing.length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-platforms">
            <Globe className="h-3.5 w-3.5 mr-1" /> All Platforms ({platforms.length})
          </TabsTrigger>
          <TabsTrigger value="grants" data-testid="tab-grant-readiness">
            <Target className="h-3.5 w-3.5 mr-1" /> Grant Readiness
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-3">
          {failing.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <h3 className="text-lg font-bold">All Platforms Compliant</h3>
              <p className="text-muted-foreground text-sm mt-1">No overdue tasks, no failures, no offline platforms.</p>
            </Card>
          ) : (
            failing.map(platform => {
              const StatusIcon = STATUS_ICONS[platform.status] || AlertOctagon;
              const isExpanded = expandedPlatform === platform.id;
              return (
                <Card key={platform.id} className="border-l-4 border-l-red-400" data-testid={`failing-platform-${platform.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${STATUS_COLORS[platform.status]}`} />
                        <div>
                          <span className="font-semibold">{platform.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`${GRADE_COLORS[platform.fidelity.grade] || ""} text-xs border-0`}>
                              Grade {platform.fidelity.grade} ({platform.fidelity.score}%)
                            </Badge>
                            {platform.status === "offline" && (
                              <Badge variant="destructive" className="text-xs">OFFLINE</Badge>
                            )}
                            {platform.overdue.length > 0 && (
                              <Badge variant="destructive" className="text-xs">{platform.overdue.length} Overdue</Badge>
                            )}
                            {platform.fidelity.pending > 0 && (
                              <Badge variant="secondary" className="text-xs">{platform.fidelity.pending} Pending</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); resendMutation.mutate(platform.id); }}
                          disabled={resendMutation.isPending}
                          data-testid={`button-resend-${platform.id}`}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" /> Resend
                        </Button>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        <Separator />

                        {platform.overdue.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                              <XCircle className="h-4 w-4" /> Overdue Directives — Reasons for Non-Compliance
                            </h4>
                            {platform.overdue.map((item, idx) => (
                              <div key={idx} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg mb-2 border border-red-200 dark:border-red-800">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-sm font-medium">{item.directive}</span>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      {platform.status === "offline"
                                        ? "Platform is OFFLINE — cannot receive or process directives"
                                        : !platform.connected
                                          ? "Platform has not connected to the hub — connector not installed or misconfigured"
                                          : platform.fidelity.pending > 0
                                            ? "Directive was delivered but platform has not acknowledged — awaiting response"
                                            : "Directive pending delivery — will be sent on next heartbeat cycle"
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {platform.completedWork.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Completed Work
                            </h4>
                            {platform.completedWork.map((work, idx) => (
                              <div key={idx} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg mb-2 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{work.directive}</span>
                                    <p className="text-xs text-muted-foreground mt-1">{work.whatWasDone}</p>
                                    {work.evidenceUrl && (
                                      <a href={work.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1">
                                        <ExternalLink className="h-3 w-3" /> Evidence
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-xs border-0 ${
                                      work.ackQuality === "VERIFIED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                      work.ackQuality === "SUBSTANTIVE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                    }`}>{work.ackQuality}</Badge>
                                    <Badge className={`text-xs border-0 ${
                                      work.verificationStatus === "verified" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                      work.verificationStatus === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                    }`}>{work.verificationStatus}</Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Ack Quality: {platform.ackQuality.verified} verified, {platform.ackQuality.substantive} substantive, {platform.ackQuality.weak} weak, {platform.ackQuality.legacy} legacy</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-2">
          {sorted.map(platform => {
            const StatusIcon = STATUS_ICONS[platform.status] || AlertOctagon;
            const isExpanded = expandedPlatform === platform.id;
            return (
              <Card key={platform.id} data-testid={`platform-row-${platform.id}`}>
                <CardContent className="pt-3 pb-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-4 w-4 ${STATUS_COLORS[platform.status]}`} />
                      <span className="font-medium text-sm">{platform.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${GRADE_COLORS[platform.fidelity.grade] || ""} text-xs border-0`}>
                        {platform.fidelity.grade} ({platform.fidelity.score}%)
                      </Badge>
                      <div className="w-20">
                        <Progress value={platform.fidelity.score} className="h-1.5" />
                      </div>
                      <span className="text-xs text-muted-foreground w-24 text-right">
                        {platform.fidelity.acknowledged}/{platform.fidelity.total} done
                      </span>
                      {platform.overdue.length > 0 && (
                        <Badge variant="destructive" className="text-xs">{platform.overdue.length} overdue</Badge>
                      )}
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {platform.overdue.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-red-600">Overdue:</span>
                          {platform.overdue.map((item, idx) => (
                            <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                              {item.directive}
                            </div>
                          ))}
                        </div>
                      )}
                      {platform.completedWork.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-emerald-600">Completed ({platform.completedWork.length}):</span>
                          {platform.completedWork.slice(0, 3).map((work, idx) => (
                            <div key={idx} className="text-xs p-2 bg-emerald-50/50 dark:bg-emerald-950/10 rounded border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                              <span>{work.directive}</span>
                              <Badge className="text-xs border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{work.ackQuality}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); resendMutation.mutate(platform.id); }}
                          disabled={resendMutation.isPending}
                          className="text-xs"
                          data-testid={`button-resend-all-${platform.id}`}
                        >
                          <Send className="h-3 w-3 mr-1" /> Resend Directives
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="grants" className="mt-4 space-y-4">
          {Object.entries(intelReport.grantReadiness).map(([grantName, data]) => (
            <Card key={grantName} data-testid={`grant-readiness-${grantName}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> {grantName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border-0 ${data.avgFidelity >= 75 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : data.avgFidelity >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                      {Math.round(data.avgFidelity)}% Fidelity
                    </Badge>
                    {data.overdueTasks > 0 && (
                      <Badge variant="destructive" className="text-xs">{data.overdueTasks} Overdue</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{data.platforms} aligned platforms</span>
                  <Progress value={data.avgFidelity} className="flex-1 h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
