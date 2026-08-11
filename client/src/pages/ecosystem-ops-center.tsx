import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import SectionTutorial from "@/components/section-tutorial";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import {
  Globe, Activity, CheckCircle2, XCircle, AlertTriangle,
  Clock, ArrowRight, ExternalLink, RefreshCw, Wifi, WifiOff,
  Zap, Shield, Heart, Briefcase, GraduationCap, Brain,
  MapPin, BarChart3, Send, Users, Building2, Printer,
  Stethoscope, Play, Mic, ChevronRight, Radio, Power,
  BellRing, Volume2, TrendingUp, FileCheck, Target,
  CircleDot, Link2, AlertOctagon, Award, DollarSign,
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { TrainingGuideButton } from "@/components/training-guide";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlatformStatus {
  id: string;
  name: string;
  url: string;
  role: string;
  domain: string;
  status: string;
  responseTimeMs: number;
  statusCode: number;
  errorMessage: string | null;
  lastHeartbeat: string | null;
  grantAlignment: string[];
  description: string;
  keepAlive: boolean;
}

interface LiveStatus {
  checkedAt: string;
  summary: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
    healthScore: number;
  };
  directives: {
    total: number;
    acknowledgments: {
      pending: number;
      delivered: number;
      acknowledged: number;
    };
  };
  platforms: PlatformStatus[];
}

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
  regionalProducts: {
    austin: { whatWasDone: string; evidenceUrl: string | null; verificationStatus: string } | null;
    manor: { whatWasDone: string; evidenceUrl: string | null; verificationStatus: string } | null;
    pflugerville: { whatWasDone: string; evidenceUrl: string | null; verificationStatus: string } | null;
  };
  completedWork: { directive: string; whatWasDone: string; evidenceUrl: string | null; verificationStatus: string; ackQuality: string; acknowledgedAt: string | null }[];
  overdue: { directive: string; directiveId: string }[];
  grantAlignment: string[];
}

interface RegionalProductSummary {
  platformsWithProduct: number;
  totalPlatforms: number;
  products: { platform: string; whatWasDone: string; evidenceUrl: string | null; verified: boolean }[];
}

interface GrantReadiness {
  grantId: string;
  name: string;
  amount: string;
  deadline: string;
  platforms: { total: number; connected: number; disconnected: number };
  compliance: { avgFidelity: number; totalWorkCompleted: number; totalOverdue: number; evidenceVerified: number };
  readinessScore: number;
  platformDetails: { id: string; name: string; connected: boolean; fidelity: number; grade: string; workDone: number; overdue: number }[];
}

interface WorkChainEvent {
  from: string;
  to: string;
  eventType: string;
  chainedFrom: string | null;
  description: string | null;
  timestamp: string;
  status: string;
}

interface VerificationSummary {
  lastRun: string | null;
  totalWithEvidence: number;
  live: number;
  failed: number;
  unchecked: number;
  failedDeliverables: { platform: string; directive: string; evidenceUrl: string; lastChecked: string }[];
}

interface IntelReport {
  generatedAt: string;
  ecosystemSummary: {
    totalPlatforms: number;
    connected: number;
    disconnected: number;
    ecosystemFidelity: number;
    ecosystemGrade: string;
    directives: { total: number; acknowledged: number; delivered: number; pending: number };
    eventsThisWeek: number;
    complianceReportsThisWeek: number;
    workChainsTriggered: number;
    ackQuality?: { verified: number; substantive: number; weak: number; legacy: number };
    completedThisWeek?: number;
    newPlatformsThisWeek?: number;
  };
  regionalProducts?: {
    austin: RegionalProductSummary;
    manor: RegionalProductSummary;
    pflugerville: RegionalProductSummary;
  };
  workChainActivity?: WorkChainEvent[];
  verificationSummary?: VerificationSummary;
  dueOut: { title: string; daysLeft: number; acked: number; total: number; urgent: boolean }[];
  needsAttention: { id: string; name: string; reason: string; overdue: { directive: string }[]; fidelity: number }[];
  grantReadiness: GrantReadiness[];
  platformIntelligence: IntelPlatform[];
}

const DOMAIN_ICONS: Record<string, typeof Globe> = {
  "health-equity": Heart,
  veterans: Shield,
  education: GraduationCap,
  "community-workforce": Briefcase,
  "business-intelligence": Building2,
  compliance: Shield,
  "marketing-content": Play,
  operations: Globe,
  "veteran-services": Shield,
};

const DOMAIN_COLORS: Record<string, string> = {
  "health-equity": "bg-rose-500",
  veterans: "bg-indigo-500",
  education: "bg-violet-500",
  "community-workforce": "bg-emerald-500",
  "business-intelligence": "bg-purple-500",
  compliance: "bg-slate-500",
  "marketing-content": "bg-amber-500",
  operations: "bg-teal-500",
  "veteran-services": "bg-blue-500",
};

function StatusIndicator({ status }: { status: string }) {
  if (status === "online") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Online</span>
      </div>
    );
  }
  if (status === "degraded") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Degraded</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
      <span className="text-xs font-medium text-red-600 dark:text-red-400">Offline</span>
    </div>
  );
}

function ResponseTimeBadge({ ms }: { ms: number }) {
  const color = ms < 1000 ? "text-emerald-600 dark:text-emerald-400" :
    ms < 3000 ? "text-amber-600 dark:text-amber-400" :
    "text-red-600 dark:text-red-400";
  return <span className={`text-xs font-mono ${color}`}>{ms}ms</span>;
}

interface WakeResult {
  id: string;
  name: string;
  url: string;
  status: string;
  responseTimeMs: number;
  statusCode: number;
  errorMessage: string | null;
  wakeAttempts: number;
}

interface WakeResponse {
  wokenAt: string;
  summary: { targeted: number; awake: number; responded: number; failed: number };
  platforms: WakeResult[];
}

export default function EcosystemOpsCenterPage() {
  const [activeTab, setActiveTab] = useState("intelligence");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [wakeResults, setWakeResults] = useState<WakeResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Ecosystem Operations Center | ThriveUp Academy";
  }, []);

  const { data: liveStatus, isLoading, isFetching, refetch } = useQuery<LiveStatus>({
    queryKey: ["/api/ecosystem/live-status"],
    refetchInterval: autoRefresh ? 60000 : false,
    staleTime: 30000,
  });

  interface BriefProbeStatus {
    available: boolean;
    message?: string;
    ok?: boolean;
    detail?: string;
    ts?: string;
  }

  const { data: briefProbeStatus, refetch: refetchProbe } = useQuery<BriefProbeStatus>({
    queryKey: ["/api/admin/brief-probe-status"],
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
    staleTime: 60000,
  });

  const { data: intelReport, isLoading: intelLoading, refetch: refetchIntel } = useQuery<IntelReport>({
    queryKey: ["/api/ecosystem/intelligence-report"],
    staleTime: 60000,
    enabled: activeTab === "intelligence" || activeTab === "grants" || activeTab === "products",
  });

  const wakeUpMutation = useMutation({
    mutationFn: async (platformIds?: string[]) => {
      const res = await apiRequest("POST", "/api/ecosystem/wake-up", platformIds ? { platformIds } : {});
      return res.json() as Promise<WakeResponse>;
    },
    onSuccess: (data) => {
      setWakeResults(data);
      toast({
        title: `Wake-Up Complete`,
        description: `${data.summary.awake} awake, ${data.summary.responded} responded, ${data.summary.failed} unreachable`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/live-status"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Could not reach platforms.", variant: "destructive" });
    },
  });

  const keepAliveMutation = useMutation({
    mutationFn: async ({ id, keepAlive }: { id: string; keepAlive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/ecosystem/platforms/${id}/keep-alive`, { keepAlive });
      return res.json();
    },
    onSuccess: (_data, { keepAlive }) => {
      toast({
        title: keepAlive ? "Keep-Awake On" : "Sleeping",
        description: keepAlive ? "Platform will be pinged every 10 min to stay awake." : "Platform will sleep between hourly health checks.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/live-status"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Could not update setting.", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ecosystem/verify-deliverables");
      return res.json();
    },
    onSuccess: (data: { results: { verified: boolean }[] }) => {
      const live = data.results?.filter((r: { verified: boolean }) => r.verified).length || 0;
      const failed = data.results?.filter((r: { verified: boolean }) => !r.verified).length || 0;
      toast({
        title: "Verification Complete",
        description: `${data.results?.length || 0} checked: ${live} live, ${failed} failed`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/intelligence-report"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Verification failed. Please try again.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/live-status"] });
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const onlinePlatforms = liveStatus?.platforms.filter(p => p.status === "online") || [];
  const degradedPlatforms = liveStatus?.platforms.filter(p => p.status === "degraded") || [];
  const offlinePlatforms = liveStatus?.platforms.filter(p => p.status === "offline") || [];

  const domainGroups = liveStatus?.platforms.reduce((acc, p) => {
    const domain = p.domain || "other";
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(p);
    return acc;
  }, {} as Record<string, PlatformStatus[]>) || {};

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" data-testid="ecosystem-ops-center-page">
      <SectionTutorial {...SECTION_TUTORIALS["ops-center"]} />
      <PageHeader
        title="Ecosystem Operations Center"
        description={`Real-time monitoring of all ${liveStatus?.summary.total || ""} platforms — who's online, who's responding, who needs attention.`}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <TrainingGuideButton moduleId="ecosystem-ops-center" />
            <Button size="sm" variant="outline" asChild data-testid="button-funder-dashboard">
              <a href="/funder-dashboard">
                <DollarSign className="h-4 w-4 mr-1" />
                Funder Impact
              </a>
            </Button>
            <Button
              size="sm"
              onClick={() => wakeUpMutation.mutate(undefined)}
              disabled={wakeUpMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-wake-all"
            >
              <Power className={`h-4 w-4 mr-1 ${wakeUpMutation.isPending ? "animate-spin" : ""}`} />
              {wakeUpMutation.isPending ? "Waking All..." : "Wake All Platforms"}
            </Button>
            {(degradedPlatforms.length > 0 || offlinePlatforms.length > 0) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const sleepers = [...degradedPlatforms, ...offlinePlatforms].map(p => p.id);
                  wakeUpMutation.mutate(sleepers);
                }}
                disabled={wakeUpMutation.isPending}
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                data-testid="button-wake-sleepers"
              >
                <BellRing className="h-4 w-4 mr-1" />
                Wake {degradedPlatforms.length + offlinePlatforms.length} Sleepers
              </Button>
            )}
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="button-auto-refresh"
            >
              <Radio className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-pulse" : ""}`} />
              {autoRefresh ? "Live" : "Auto-Refresh Off"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh-status"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Scanning..." : "Scan Now"}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : liveStatus ? (
        <>
          {wakeUpMutation.isPending && (
            <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" data-testid="card-wake-progress">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <Power className="h-5 w-5 text-amber-600 animate-spin" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Waking up platforms...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sending GET requests to force sleeping platforms to spin up. This may take 15-30 seconds — Replit apps need time to cold-start.
                </p>
                <Progress className="mt-3" value={undefined} />
              </CardContent>
            </Card>
          )}

          {wakeResults && !wakeUpMutation.isPending && (
            <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10" data-testid="card-wake-results">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-emerald-600" />
                    Wake-Up Results — {new Date(wakeResults.wokenAt).toLocaleTimeString()}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setWakeResults(null)} data-testid="button-dismiss-wake">
                    Dismiss
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20">
                    <div className="text-2xl font-bold text-emerald-600">{wakeResults.summary.awake}</div>
                    <div className="text-xs text-muted-foreground">Awake</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20">
                    <div className="text-2xl font-bold text-amber-600">{wakeResults.summary.responded}</div>
                    <div className="text-xs text-muted-foreground">Responded (non-200)</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-100/50 dark:bg-red-900/20">
                    <div className="text-2xl font-bold text-red-600">{wakeResults.summary.failed}</div>
                    <div className="text-xs text-muted-foreground">Unreachable</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {wakeResults.platforms.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        {p.status === "awake" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : p.status === "responded" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{p.name}</span>
                        {p.wakeAttempts > 1 && (
                          <Badge variant="outline" className="text-xs">{p.wakeAttempts} attempts</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ResponseTimeBadge ms={p.responseTimeMs} />
                        {p.errorMessage && (
                          <span className="text-xs text-red-500">{p.errorMessage}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="text-center" data-testid="stat-health-score">
              <CardContent className="pt-5 pb-4">
                <div className={`text-3xl font-bold ${
                  liveStatus.summary.healthScore >= 80 ? "text-emerald-600" :
                  liveStatus.summary.healthScore >= 50 ? "text-amber-600" : "text-red-600"
                }`}>
                  {liveStatus.summary.healthScore}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Ecosystem Health</div>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="stat-online">
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-emerald-600">{liveStatus.summary.online}</div>
                <div className="text-xs text-muted-foreground mt-1">Online</div>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="stat-degraded">
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-amber-600">{liveStatus.summary.degraded}</div>
                <div className="text-xs text-muted-foreground mt-1">Degraded</div>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="stat-offline">
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-red-600">{liveStatus.summary.offline}</div>
                <div className="text-xs text-muted-foreground mt-1">Offline</div>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="stat-directives">
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-blue-600">{liveStatus.directives.total}</div>
                <div className="text-xs text-muted-foreground mt-1">Active Directives</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800" data-testid="card-directive-pending">
              <CardContent className="pt-5 pb-4 text-center">
                <Send className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                <div className="text-2xl font-bold">{liveStatus.directives.acknowledgments.pending}</div>
                <div className="text-xs text-muted-foreground">Directives Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800" data-testid="card-directive-delivered">
              <CardContent className="pt-5 pb-4 text-center">
                <ArrowRight className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{liveStatus.directives.acknowledgments.delivered}</div>
                <div className="text-xs text-muted-foreground">Directives Delivered</div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800" data-testid="card-directive-acked">
              <CardContent className="pt-5 pb-4 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                <div className="text-2xl font-bold">{liveStatus.directives.acknowledgments.acknowledged}</div>
                <div className="text-xs text-muted-foreground">Acknowledged</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-ops">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 gap-1 h-auto p-1">
              <TabsTrigger value="intelligence" className="text-xs md:text-sm" data-testid="tab-intelligence">
                <TrendingUp className="h-3.5 w-3.5 mr-1" /> Intelligence
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs md:text-sm" data-testid="tab-products">
                <Briefcase className="h-3.5 w-3.5 mr-1" /> Products
              </TabsTrigger>
              <TabsTrigger value="grants" className="text-xs md:text-sm" data-testid="tab-grants">
                <Target className="h-3.5 w-3.5 mr-1" /> Grant Readiness
              </TabsTrigger>
              <TabsTrigger value="live" className="text-xs md:text-sm" data-testid="tab-live">
                <Activity className="h-3.5 w-3.5 mr-1" /> Live Status
              </TabsTrigger>
              <TabsTrigger value="domains" className="text-xs md:text-sm" data-testid="tab-domains">
                <Globe className="h-3.5 w-3.5 mr-1" /> By Domain
              </TabsTrigger>
              <TabsTrigger value="issues" className="text-xs md:text-sm" data-testid="tab-issues">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Attention ({degradedPlatforms.length + offlinePlatforms.length})
              </TabsTrigger>
              <TabsTrigger value="regional" className="text-xs md:text-sm" data-testid="tab-regional">
                <MapPin className="h-3.5 w-3.5 mr-1" /> Regional Hubs
              </TabsTrigger>
              <TabsTrigger value="partner-api" className="text-xs md:text-sm" data-testid="tab-partner-api">
                <Link2 className="h-3.5 w-3.5 mr-1" /> Partner API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="intelligence" className="mt-6 space-y-6" data-testid="content-intelligence">
              {intelLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : intelReport ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Ecosystem Intelligence — Weekly Roll-Up
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Generated: {new Date(intelReport.generatedAt).toLocaleString()}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => refetchIntel()} data-testid="button-refresh-intel">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card className="text-center" data-testid="intel-connected">
                      <CardContent className="pt-4 pb-3">
                        <div className="text-2xl font-bold text-emerald-600">{intelReport.ecosystemSummary.connected}</div>
                        <div className="text-xs text-muted-foreground">Connected</div>
                        <div className="text-xs text-red-500">{intelReport.ecosystemSummary.disconnected} disconnected</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center" data-testid="intel-fidelity">
                      <CardContent className="pt-4 pb-3">
                        <div className={`text-2xl font-bold ${intelReport.ecosystemSummary.ecosystemFidelity >= 75 ? "text-emerald-600" : intelReport.ecosystemSummary.ecosystemFidelity >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {intelReport.ecosystemSummary.ecosystemFidelity}%
                        </div>
                        <div className="text-xs text-muted-foreground">Ecosystem Fidelity</div>
                        <div className="text-xs font-semibold">Grade {intelReport.ecosystemSummary.ecosystemGrade}</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center" data-testid="intel-directives">
                      <CardContent className="pt-4 pb-3">
                        <div className="text-2xl font-bold text-blue-600">{intelReport.ecosystemSummary.directives.acknowledged}</div>
                        <div className="text-xs text-muted-foreground">Acknowledged</div>
                        <div className="text-xs">{intelReport.ecosystemSummary.directives.delivered} delivered, {intelReport.ecosystemSummary.directives.pending} pending</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center" data-testid="intel-events">
                      <CardContent className="pt-4 pb-3">
                        <div className="text-2xl font-bold text-violet-600">{intelReport.ecosystemSummary.eventsThisWeek}</div>
                        <div className="text-xs text-muted-foreground">Events This Week</div>
                        <div className="text-xs">{intelReport.ecosystemSummary.complianceReportsThisWeek} compliance reports</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center" data-testid="intel-chains">
                      <CardContent className="pt-4 pb-3">
                        <div className="text-2xl font-bold text-amber-600">{intelReport.ecosystemSummary.workChainsTriggered}</div>
                        <div className="text-xs text-muted-foreground">Work Chains</div>
                        <div className="text-xs">Auto-routed tasks</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intelReport.ecosystemSummary.completedThisWeek !== undefined && (
                      <Card data-testid="intel-weekly-summary">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            This Week
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
                              <div className="text-xl font-bold text-emerald-600" data-testid="stat-completed-week">{intelReport.ecosystemSummary.completedThisWeek}</div>
                              <div className="text-xs text-muted-foreground">Directives Completed</div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                              <div className="text-xl font-bold text-blue-600" data-testid="stat-active-week">{intelReport.ecosystemSummary.newPlatformsThisWeek || 0}</div>
                              <div className="text-xs text-muted-foreground">Active Platforms</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {intelReport.verificationSummary && (
                      <Card data-testid="intel-verification-summary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <FileCheck className="h-5 w-5 text-emerald-500" />
                              Deliverable Verification
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verifyMutation.mutate()}
                              disabled={verifyMutation.isPending}
                              data-testid="button-verify-now"
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${verifyMutation.isPending ? "animate-spin" : ""}`} />
                              {verifyMutation.isPending ? "Verifying..." : "Verify Now"}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            <div className="text-center p-2 rounded bg-emerald-50 dark:bg-emerald-900/20">
                              <div className="text-lg font-bold text-emerald-600" data-testid="verify-live">{intelReport.verificationSummary.live}</div>
                              <div className="text-[10px] text-muted-foreground">Live</div>
                            </div>
                            <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/20">
                              <div className="text-lg font-bold text-red-600" data-testid="verify-failed">{intelReport.verificationSummary.failed}</div>
                              <div className="text-[10px] text-muted-foreground">Failed</div>
                            </div>
                            <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-900/20">
                              <div className="text-lg font-bold text-gray-600" data-testid="verify-unchecked">{intelReport.verificationSummary.unchecked}</div>
                              <div className="text-[10px] text-muted-foreground">Unchecked</div>
                            </div>
                            <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                              <div className="text-lg font-bold text-blue-600" data-testid="verify-total">{intelReport.verificationSummary.totalWithEvidence}</div>
                              <div className="text-[10px] text-muted-foreground">With Evidence</div>
                            </div>
                          </div>
                          {intelReport.verificationSummary.lastRun && (
                            <p className="text-xs text-muted-foreground">
                              Last auto-check: {new Date(intelReport.verificationSummary.lastRun).toLocaleString()}
                            </p>
                          )}
                          {intelReport.verificationSummary.failedDeliverables.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs font-semibold text-red-600">Failed Deliverables:</p>
                              {intelReport.verificationSummary.failedDeliverables.map((fd, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs">
                                  <span className="font-medium">{fd.platform} — {fd.directive}</span>
                                  <a href={fd.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {intelReport.workChainActivity && intelReport.workChainActivity.length > 0 && (
                    <Card data-testid="intel-work-chain-activity">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-amber-500" />
                          Work Chain Activity ({intelReport.workChainActivity.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5">
                          {intelReport.workChainActivity.map((chain, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-sm" data-testid={`chain-event-${i}`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <ArrowRight className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                <span className="font-medium truncate">{chain.from}</span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium truncate">{chain.to}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-xs">{chain.eventType}</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(chain.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {intelReport.needsAttention.length > 0 && (
                    <Card className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10" data-testid="intel-needs-attention">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                          <AlertOctagon className="h-5 w-5" />
                          Needs Your Attention ({intelReport.needsAttention.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {intelReport.needsAttention.map(item => (
                            <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border">
                              <div>
                                <span className="font-semibold text-sm">{item.name}</span>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{item.reason}</p>
                                {item.overdue.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {item.overdue.map((o, i) => (
                                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {o.directive}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Badge variant="outline" className={`text-xs ${item.fidelity >= 75 ? "text-emerald-600" : item.fidelity >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                {item.fidelity}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {intelReport.dueOut.length > 0 && (
                    <Card data-testid="intel-due-out">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-5 w-5 text-amber-600" />
                          Due Out
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {intelReport.dueOut.map((item, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${item.urgent ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 border" : "bg-muted/30"}`}>
                              <div className="flex items-center gap-2">
                                {item.urgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                <span className="text-sm font-medium">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{item.acked}/{item.total} platforms</span>
                                <Badge variant={item.urgent ? "destructive" : "outline"} className="text-xs">
                                  {item.daysLeft}d left
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card data-testid="intel-platform-scoreboard">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-5 w-5 text-emerald-600" />
                        Platform Scoreboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1.5">
                        {intelReport.platformIntelligence.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors" data-testid={`intel-platform-${p.id}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {p.connected ? (
                                <CircleDot className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium">{p.name}</span>
                                {p.completedWork.length > 0 && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    Latest: {p.completedWork[0].whatWasDone}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.completedWork.filter(w => w.verificationStatus === "LIVE").length > 0 && (
                                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                                  <FileCheck className="h-3 w-3 mr-0.5" />
                                  {p.completedWork.filter(w => w.verificationStatus === "LIVE").length} verified
                                </Badge>
                              )}
                              {p.overdue.length > 0 && (
                                <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                  {p.overdue.length} overdue
                                </Badge>
                              )}
                              <div className="w-16 text-right">
                                <span className={`text-sm font-bold ${p.fidelity.score >= 90 ? "text-emerald-600" : p.fidelity.score >= 75 ? "text-blue-600" : p.fidelity.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                  {p.fidelity.grade}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">{p.fidelity.score}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Loading Intelligence Report...</h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="products" className="mt-6 space-y-6" data-testid="content-products">
              {intelLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
                </div>
              ) : intelReport ? (
                <>
                  {intelReport.ecosystemSummary.ackQuality && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-blue-500" /> Acknowledgment Quality
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                            <div className="text-2xl font-bold text-emerald-600" data-testid="quality-verified">{intelReport.ecosystemSummary.ackQuality.verified}</div>
                            <div className="text-xs text-muted-foreground">Verified (with evidence)</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <div className="text-2xl font-bold text-blue-600" data-testid="quality-substantive">{intelReport.ecosystemSummary.ackQuality.substantive}</div>
                            <div className="text-xs text-muted-foreground">Substantive</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                            <div className="text-2xl font-bold text-amber-600" data-testid="quality-weak">{intelReport.ecosystemSummary.ackQuality.weak}</div>
                            <div className="text-xs text-muted-foreground">Weak</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                            <div className="text-2xl font-bold text-gray-600" data-testid="quality-legacy">{intelReport.ecosystemSummary.ackQuality.legacy}</div>
                            <div className="text-xs text-muted-foreground">Legacy (pre-quality gate)</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {["austin", "manor", "pflugerville"].map(region => {
                    const regionData = intelReport.regionalProducts?.[region as keyof typeof intelReport.regionalProducts];
                    const regionNames: Record<string, string> = { austin: "Austin", manor: "Manor", pflugerville: "Pflugerville" };
                    const regionFocus: Record<string, string> = {
                      austin: "Housing & Equity Crisis — $435K median home, 48K+ unit gap",
                      manor: "Growth Without Gaps — 89% growth, 78% commute out, no hospital",
                      pflugerville: "Infrastructure Before Growth — Branchview 2027, Samsung/Tesla corridor",
                    };
                    return (
                      <Card key={region}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-violet-500" />
                              {regionNames[region]} Products
                            </div>
                            <Badge variant={regionData && regionData.platformsWithProduct > 0 ? "default" : "destructive"} data-testid={`badge-${region}-count`}>
                              {regionData?.platformsWithProduct || 0}/{regionData?.totalPlatforms || 20} platforms
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{regionFocus[region]}</p>
                        </CardHeader>
                        <CardContent>
                          {regionData && regionData.products.length > 0 ? (
                            <div className="space-y-3">
                              {regionData.products.map((prod, idx) => (
                                <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border" data-testid={`product-${region}-${idx}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{prod.platform}</div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prod.whatWasDone}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3 shrink-0">
                                    {prod.verified && <Badge variant="default" className="bg-emerald-500 text-xs">Verified</Badge>}
                                    {prod.evidenceUrl && (
                                      <a href={prod.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                              <p className="text-sm font-medium">No {regionNames[region]} products reported yet</p>
                              <p className="text-xs mt-1">Platforms have been directed to build {regionNames[region]}-specific products. Waiting for acknowledgments with evidence.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-500" /> Platform Product Scoreboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {intelReport.platformIntelligence.map(p => {
                          const hasAustin = !!p.regionalProducts?.austin;
                          const hasManor = !!p.regionalProducts?.manor;
                          const hasPflugerville = !!p.regionalProducts?.pflugerville;
                          const productCount = [hasAustin, hasManor, hasPflugerville].filter(Boolean).length;
                          const qualityTotal = (p.ackQuality?.verified || 0) + (p.ackQuality?.substantive || 0);
                          return (
                            <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded border" data-testid={`scoreboard-${p.id}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <StatusIndicator status={p.status} />
                                <span className="text-sm font-medium truncate">{p.name}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex gap-1">
                                  <Badge variant={hasAustin ? "default" : "outline"} className={`text-[10px] px-1.5 ${hasAustin ? "bg-blue-500" : ""}`}>ATX</Badge>
                                  <Badge variant={hasManor ? "default" : "outline"} className={`text-[10px] px-1.5 ${hasManor ? "bg-violet-500" : ""}`}>MNR</Badge>
                                  <Badge variant={hasPflugerville ? "default" : "outline"} className={`text-[10px] px-1.5 ${hasPflugerville ? "bg-teal-500" : ""}`}>PFV</Badge>
                                </div>
                                <Badge variant={qualityTotal > 0 ? "default" : "secondary"} className="text-xs">
                                  {qualityTotal} verified
                                </Badge>
                                <Badge variant={p.fidelity.grade === "A" ? "default" : p.fidelity.grade === "F" ? "destructive" : "secondary"} className="text-xs">
                                  {p.fidelity.grade} ({p.fidelity.score}%)
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="grants" className="mt-6 space-y-6" data-testid="content-grants">
              {intelLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
                </div>
              ) : intelReport ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Target className="h-5 w-5 text-violet-600" />
                      Grant Readiness Dashboard
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => refetchIntel()} data-testid="button-refresh-grants">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {[...intelReport.grantReadiness].sort((a, b) => b.readinessScore - a.readinessScore).map(grant => (
                      <Card key={grant.grantId} className="overflow-hidden" data-testid={`grant-${grant.grantId}`}>
                        <div className={`h-1.5 ${grant.readinessScore >= 70 ? "bg-emerald-500" : grant.readinessScore >= 40 ? "bg-amber-500" : "bg-red-500"}`} />
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <CardTitle className="text-base">{grant.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{grant.amount} | Deadline: {grant.deadline}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${grant.readinessScore >= 70 ? "text-emerald-600" : grant.readinessScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                {grant.readinessScore}%
                              </div>
                              <div className="text-xs text-muted-foreground">Readiness</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="p-2 rounded bg-muted/30 text-center">
                              <div className="text-lg font-bold">{grant.platforms.connected}/{grant.platforms.total}</div>
                              <div className="text-xs text-muted-foreground">Platforms Connected</div>
                            </div>
                            <div className="p-2 rounded bg-muted/30 text-center">
                              <div className="text-lg font-bold">{grant.compliance.avgFidelity}%</div>
                              <div className="text-xs text-muted-foreground">Avg Fidelity</div>
                            </div>
                            <div className="p-2 rounded bg-muted/30 text-center">
                              <div className="text-lg font-bold text-emerald-600">{grant.compliance.totalWorkCompleted}</div>
                              <div className="text-xs text-muted-foreground">Work Items Done</div>
                            </div>
                            <div className="p-2 rounded bg-muted/30 text-center">
                              <div className="text-lg font-bold text-violet-600">{grant.compliance.evidenceVerified}</div>
                              <div className="text-xs text-muted-foreground">Evidence Verified</div>
                            </div>
                          </div>

                          {grant.compliance.totalOverdue > 0 && (
                            <div className="p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 mb-3">
                              <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {grant.compliance.totalOverdue} overdue directive(s) across aligned platforms
                              </p>
                            </div>
                          )}

                          <div className="space-y-1">
                            {grant.platformDetails.map(pd => (
                              <div key={pd.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
                                <div className="flex items-center gap-2">
                                  {pd.connected ? (
                                    <CircleDot className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                                  )}
                                  <span className="font-medium">{pd.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {pd.workDone > 0 && <span className="text-xs text-emerald-600">{pd.workDone} done</span>}
                                  {pd.overdue > 0 && <span className="text-xs text-red-500">{pd.overdue} overdue</span>}
                                  <Badge variant="outline" className={`text-xs ${pd.fidelity >= 75 ? "text-emerald-600" : pd.fidelity >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                    {pd.grade} ({pd.fidelity}%)
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Loading Grant Data...</h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="live" className="mt-6 space-y-3" data-testid="content-live">
              {/* Community-Brief Production Probe Status */}
              <Card className={`border-2 ${
                !briefProbeStatus?.available
                  ? "border-muted"
                  : briefProbeStatus.ok
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : "border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20"
              }`} data-testid="card-brief-probe-status">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !briefProbeStatus?.available
                          ? "bg-muted"
                          : briefProbeStatus.ok
                            ? "bg-emerald-500"
                            : "bg-red-500"
                      }`}>
                        {!briefProbeStatus?.available ? (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        ) : briefProbeStatus.ok ? (
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        ) : (
                          <XCircle className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Community Impact Analyzer — Live Probe</span>
                          <Badge
                            variant={!briefProbeStatus?.available ? "secondary" : briefProbeStatus.ok ? "default" : "destructive"}
                            className={`text-xs ${briefProbeStatus?.ok ? "bg-emerald-500" : ""}`}
                            data-testid="badge-probe-status"
                          >
                            {!briefProbeStatus?.available
                              ? "No data yet"
                              : briefProbeStatus.ok
                                ? "Healthy"
                                : "FAILING"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {briefProbeStatus?.available
                            ? briefProbeStatus.detail
                            : (briefProbeStatus?.message ?? "Probe runs 60 s after boot, then every 30 min")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {briefProbeStatus?.available && briefProbeStatus.ts && (
                        <span className="text-xs text-muted-foreground" data-testid="probe-timestamp">
                          {new Date(briefProbeStatus.ts).toLocaleString()}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetchProbe()}
                        data-testid="button-refresh-probe"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">All Platforms ({liveStatus.summary.total})</h2>
                <span className="text-xs text-muted-foreground">
                  Last scan: {new Date(liveStatus.checkedAt).toLocaleTimeString()}
                </span>
              </div>
              {liveStatus.platforms.map((platform) => {
                const DomainIcon = DOMAIN_ICONS[platform.domain] || Globe;
                const domainColor = DOMAIN_COLORS[platform.domain] || "bg-gray-500";
                return (
                  <Card key={platform.id} className={`hover:shadow-md transition-shadow ${
                    platform.status === "offline" ? "border-red-200 dark:border-red-900/30" :
                    platform.status === "degraded" ? "border-amber-200 dark:border-amber-900/30" : ""
                  }`} data-testid={`card-platform-${platform.id}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full ${domainColor} flex items-center justify-center flex-shrink-0`}>
                            <DomainIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{platform.name}</span>
                              <Badge variant="outline" className="text-xs">{platform.role}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{platform.description?.substring(0, 100)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <ResponseTimeBadge ms={platform.responseTimeMs} />
                          <StatusIndicator status={platform.status} />
                          <div className="flex items-center gap-1.5" title={platform.keepAlive ? "Pinging every 10 min — app stays awake" : "Sleeping — app wakes on demand"}>
                            <span className="text-xs text-muted-foreground hidden md:inline">
                              {platform.keepAlive ? "Awake" : "Sleep"}
                            </span>
                            <Switch
                              checked={platform.keepAlive}
                              onCheckedChange={(val) => keepAliveMutation.mutate({ id: platform.id, keepAlive: val })}
                              disabled={keepAliveMutation.isPending || platform.role === "self-hub"}
                              data-testid={`switch-keepalive-${platform.id}`}
                            />
                          </div>
                          <a
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`link-platform-${platform.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      {platform.errorMessage && (
                        <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          {platform.errorMessage}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="domains" className="mt-6 space-y-6" data-testid="content-domains">
              {Object.entries(domainGroups).map(([domain, platforms]) => {
                const onlineInDomain = platforms.filter(p => p.status === "online").length;
                const DomainIcon = DOMAIN_ICONS[domain] || Globe;
                return (
                  <Card key={domain} data-testid={`card-domain-${domain}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <DomainIcon className="h-4 w-4" />
                          {domain.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </CardTitle>
                        <Badge variant={onlineInDomain === platforms.length ? "default" : "outline"} className="text-xs">
                          {onlineInDomain}/{platforms.length} online
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {platforms.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2">
                              <StatusIndicator status={p.status} />
                              <span className="text-sm font-medium">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <ResponseTimeBadge ms={p.responseTimeMs} />
                              <a href={p.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="issues" className="mt-6 space-y-6" data-testid="content-issues">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Platforms Needing Attention ({degradedPlatforms.length + offlinePlatforms.length})
              </h2>

              {(offlinePlatforms.length > 0 || degradedPlatforms.length > 0) && (
                <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800 mb-4" data-testid="card-wake-sleepers-action">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Power className="h-4 w-4 text-amber-600" />
                          Force Wake-Up
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Most platforms sleep after inactivity. A wake-up sends full page requests to force them back online (up to 2 retries, 15s timeout per attempt).
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const ids = [...offlinePlatforms, ...degradedPlatforms].map(p => p.id);
                          wakeUpMutation.mutate(ids);
                        }}
                        disabled={wakeUpMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        data-testid="button-wake-issues"
                      >
                        <Power className={`h-4 w-4 mr-1 ${wakeUpMutation.isPending ? "animate-spin" : ""}`} />
                        {wakeUpMutation.isPending ? "Waking..." : `Wake ${offlinePlatforms.length + degradedPlatforms.length} Platforms`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {offlinePlatforms.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Offline ({offlinePlatforms.length})
                  </h3>
                  {offlinePlatforms.map(p => (
                    <Card key={p.id} className="border-red-200 dark:border-red-900/30" data-testid={`issue-${p.id}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-semibold text-sm">{p.name}</span>
                            <p className="text-xs text-muted-foreground">{p.url}</p>
                            {p.errorMessage && (
                              <p className="text-xs text-red-500 mt-1">{p.errorMessage}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => wakeUpMutation.mutate([p.id])}
                              disabled={wakeUpMutation.isPending}
                              className="border-amber-300 text-amber-700"
                              data-testid={`button-wake-${p.id}`}
                            >
                              <Power className="h-3.5 w-3.5 mr-1" /> Wake
                            </Button>
                            <Badge variant="outline" className="text-xs">{p.responseTimeMs}ms</Badge>
                            <a href={p.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Check
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {degradedPlatforms.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Degraded ({degradedPlatforms.length})
                  </h3>
                  {degradedPlatforms.map(p => (
                    <Card key={p.id} className="border-amber-200 dark:border-amber-900/30" data-testid={`degraded-${p.id}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-semibold text-sm">{p.name}</span>
                            <p className="text-xs text-muted-foreground">HTTP {p.statusCode} — {p.url}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => wakeUpMutation.mutate([p.id])}
                              disabled={wakeUpMutation.isPending}
                              className="border-amber-300 text-amber-700"
                              data-testid={`button-wake-degraded-${p.id}`}
                            >
                              <Power className="h-3.5 w-3.5 mr-1" /> Wake
                            </Button>
                            <Badge variant="outline" className="text-xs">{p.responseTimeMs}ms</Badge>
                            <a href={p.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Check
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {degradedPlatforms.length === 0 && offlinePlatforms.length === 0 && (
                <Card className="text-center py-12 bg-emerald-50/50 dark:bg-emerald-950/10" data-testid="card-all-clear">
                  <CardContent>
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-lg font-semibold">All Systems Operational</h3>
                    <p className="text-muted-foreground">All {liveStatus?.summary.total || ""} platforms are online and responding normally.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="regional" className="mt-6 space-y-6" data-testid="content-regional">
              <h2 className="text-lg font-bold">Regional Hub Status</h2>
              <p className="text-muted-foreground">
                Three regional hubs powered by the same {liveStatus?.summary.total || ""}-platform ecosystem.
                Platform health affects all regions simultaneously.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Austin", url: "/austin", color: "from-blue-500 to-indigo-500", focus: "Housing & Equity Crisis", pop: "1M+", theme: "blue" },
                  { name: "Manor", url: "/manor", color: "from-teal-500 to-emerald-500", focus: "Growth Without Gaps", pop: "16,300+", theme: "teal" },
                  { name: "Pflugerville", url: "/pflugerville", color: "from-violet-500 to-purple-500", focus: "Infrastructure Before Growth", pop: "76,500+", theme: "violet" },
                ].map(hub => (
                  <Card key={hub.name} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = hub.url} data-testid={`card-hub-${hub.name.toLowerCase()}`}>
                    <div className={`h-2 bg-gradient-to-r ${hub.color}`} />
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className={`h-5 w-5 text-${hub.theme}-600`} />
                        <span className="font-bold text-lg">{hub.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{hub.focus}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" /> {hub.pop}</Badge>
                        <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" /> {liveStatus?.summary.total || ""} Platforms</Badge>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                        View Hub <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card data-testid="card-ecosystem-impact">
                <CardHeader>
                  <CardTitle className="text-base">Ecosystem Health Impact on Regions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    When a platform goes offline, it affects service delivery across all three regions.
                    The operations center monitors this in real-time so you can intervene before residents feel the gap.
                  </p>
                  {liveStatus && offlinePlatforms.length > 0 ? (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2">
                        {offlinePlatforms.length} platform(s) offline — affecting all 3 regions
                      </h4>
                      <ul className="space-y-1">
                        {offlinePlatforms.map(p => (
                          <li key={p.id} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> {p.name} — {p.errorMessage || "unreachable"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> All platforms operational — full service delivery across all 3 regions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="partner-api" className="mt-6 space-y-6" data-testid="content-partner-api">
              <PartnerApiTab />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <WifiOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Unable to Load Status</h3>
            <p className="text-muted-foreground mb-4">Click Scan Now to check all platforms.</p>
            <Button onClick={() => refetch()} data-testid="button-retry-scan">
              <RefreshCw className="h-4 w-4 mr-2" /> Scan Now
            </Button>
          </CardContent>
        </Card>
      )}

      <BackToTop />
    </div>
  );
}

function PartnerApiTab() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [selectedScopes, setSelectedScopes] = useState(["content:read"]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{ keys: any[] }>({
    queryKey: ["/api/admin/partner-keys"],
  });

  const { data: auditData } = useQuery<{ logs: any[] }>({
    queryKey: ["/api/admin/partner-keys/audit"],
  });

  const { data: inboundData, refetch: refetchInbound } = useQuery<{ count: number; data: any[] }>({
    queryKey: ["/api/admin/partner-inbound"],
  });

  const markProcessedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/admin/partner-inbound/${id}/mark-processed`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-inbound"] }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/partner-keys", {
        partnerName: newPartnerName,
        partnerEmail: newPartnerEmail || undefined,
        scopes: selectedScopes,
        notes: newNotes || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setRevealedKey(data.plaintextKey);
      setShowCreate(false);
      setNewPartnerName(""); setNewPartnerEmail(""); setNewNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-keys"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to create key.", variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/admin/partner-keys/${id}/revoke`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Key Revoked", description: "Partner access removed immediately." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-keys"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/admin/partner-keys/${id}/restore`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Key Restored", description: "Partner access re-enabled." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-keys"] });
    },
  });

  const SCOPES = [
    { value: "content:read", label: "Content & Programs (outbound)", desc: "Partner pulls program descriptions and RAG content from ThriveUp" },
    { value: "platforms:read", label: "Platform Catalog (outbound)", desc: "Partner pulls list of TCAF platforms and health status" },
    { value: "community:read", label: "Community Brief + Data", desc: "Partner queries community briefs and subscribes to scheduled delivery" },
    { value: "outcomes:read", label: "Outcomes / Trade Completions", desc: "Partner reads aggregate trade sim completion counts (no PII)" },
    { value: "certs:read", label: "Certificate Verification", desc: "Partner verifies learner trade certificates by ID" },
    { value: "inbound:write", label: "Push Data Inbound ↩", desc: "Partner can POST content, insights, events, and metrics back to ThriveUp" },
  ];

  const baseUrl = window.location.origin;

  // ── Webhooks admin (global admin view) ────────────────────────────────────
  const [showRegisterWebhook, setShowRegisterWebhook] = useState(false);
  const [newWebhookEvent, setNewWebhookEvent] = useState("trade_cert.issued");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookKeyId, setNewWebhookKeyId] = useState("");
  const [revealedWebhookSecret, setRevealedWebhookSecret] = useState<string | null>(null);

  const { data: allWebhooks, refetch: refetchWebhooks } = useQuery<{ count: number; webhooks: any[] }>({
    queryKey: ["/api/admin/partner-webhooks"],
  });

  const registerWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/partner-webhooks", {
        partnerKeyId: parseInt(newWebhookKeyId, 10),
        event: newWebhookEvent,
        webhookUrl: newWebhookUrl,
      });
      return res.json();
    },
    onSuccess: (d) => {
      setRevealedWebhookSecret(d.secret ?? null);
      setShowRegisterWebhook(false);
      setNewWebhookUrl(""); setNewWebhookKeyId("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-webhooks"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to register webhook.", variant: "destructive" }),
  });

  const deactivateWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/partner-webhooks/${id}/deactivate`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Webhook deactivated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-webhooks"] });
    },
  });

  // ── Brief Subscriptions admin (global admin view) ─────────────────────────
  const { data: allSubscriptions, refetch: refetchSubscriptions } = useQuery<{ count: number; subscriptions: any[] }>({
    queryKey: ["/api/admin/brief-subscriptions"],
  });

  const deactivateSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/brief-subscriptions/${id}/deactivate`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription deactivated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brief-subscriptions"] });
    },
  });

  return (
    <div className="space-y-6" data-testid="content-partner-api-inner">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-600" />
            Partner API Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            One permanent connection point. Give a partner their key and they plug in — no custom code each time.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-key">
          <Zap className="h-4 w-4 mr-1" /> New Partner Key
        </Button>
      </div>

      {revealedKey && (
        <Card className="border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" data-testid="card-revealed-key">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Shield className="h-4 w-4" /> New Key Created — Copy It Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">This key will never be shown again. Copy it and send it to your partner securely.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-black border rounded px-3 py-2 text-sm font-mono break-all">{revealedKey}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(revealedKey); toast({ title: "Copied!" }); }} data-testid="button-copy-key">
                Copy
              </Button>
            </div>
            <div className="bg-white dark:bg-black border rounded p-3 text-xs font-mono space-y-1 text-muted-foreground">
              <div className="font-semibold text-foreground mb-1">How to use:</div>
              <div>curl -H "x-partner-key: {revealedKey}" \</div>
              <div className="pl-4">{baseUrl}/api/partner/v1/health</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRevealedKey(null)} data-testid="button-dismiss-key">
              I've copied it — dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card data-testid="card-create-key">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create Partner Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Partner / Organization *</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                  placeholder="e.g. Black Praxis Labs"
                  value={newPartnerName}
                  onChange={e => setNewPartnerName(e.target.value)}
                  data-testid="input-partner-name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Email (optional)</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                  placeholder="dev@partnerorg.com"
                  value={newPartnerEmail}
                  onChange={e => setNewPartnerEmail(e.target.value)}
                  data-testid="input-partner-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scopes — What can they access?</label>
              {SCOPES.map(s => (
                <label key={s.value} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(s.value)}
                    onChange={e => setSelectedScopes(prev => e.target.checked ? [...prev, s.value] : prev.filter(x => x !== s.value))}
                    className="mt-0.5"
                    data-testid={`checkbox-scope-${s.value}`}
                  />
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes (optional)</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                placeholder="What are they using this for?"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                data-testid="input-partner-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={!newPartnerName || createMutation.isPending} data-testid="button-confirm-create">
                {createMutation.isPending ? "Creating..." : "Generate Key"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} data-testid="button-cancel-create">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-api-endpoints">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground font-normal">Standard Endpoints — same for every partner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs font-mono">
            {[
              { method: "GET",  path: "/api/partner/v1/health",    scope: "any key",       desc: "Verify key — no scope needed" },
              { method: "GET",  path: "/api/partner/v1/export",    scope: "content:read",  desc: "Pull content for RAG ingestion" },
              { method: "GET",  path: "/api/partner/v1/platforms", scope: "platforms:read",desc: "Pull platform catalog" },
              { method: "POST", path: "/api/partner/v1/heartbeat", scope: "any key",       desc: "Partner signals alive ↩" },
              { method: "POST", path: "/api/partner/v1/push",      scope: "inbound:write", desc: "Partner pushes data to ThriveUp ↩" },
            ].map(e => (
              <div key={e.path} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <Badge variant="outline" className="text-xs shrink-0">{e.method}</Badge>
                <span className="flex-1 text-foreground">{baseUrl}{e.path}</span>
                <span className="text-muted-foreground hidden md:inline">{e.desc}</span>
                <Badge variant="secondary" className="text-xs shrink-0">{e.scope}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-partner-keys-list">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Partners ({data?.keys.filter(k => k.active).length ?? 0})</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-keys">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !data?.keys.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No partner keys yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.keys.map(key => (
                <div key={key.id} className={`flex items-center justify-between p-3 rounded-lg border ${key.active ? "bg-muted/20" : "bg-red-50/30 dark:bg-red-950/10 border-red-200 dark:border-red-900/30 opacity-60"}`} data-testid={`row-partner-${key.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{key.partnerName}</span>
                      {key.active ? (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Revoked</Badge>
                      )}
                      {key.scopes.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>Key: <code className="font-mono">{key.keyPrefix}…</code></span>
                      <span>{key.usageCount} calls</span>
                      {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                      {key.partnerEmail && <span>{key.partnerEmail}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-3">
                    {key.active ? (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs" onClick={() => revokeMutation.mutate(key.id)} disabled={revokeMutation.isPending} data-testid={`button-revoke-${key.id}`}>
                        Revoke
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => restoreMutation.mutate(key.id)} disabled={restoreMutation.isPending} data-testid={`button-restore-${key.id}`}>
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {auditData?.logs && auditData.logs.length > 0 && (
        <Card data-testid="card-audit-log">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> Recent API Calls (Outbound)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {auditData.logs.slice(0, 50).map(log => (
                <div key={log.id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{log.method}</Badge>
                    <code className="text-muted-foreground">{log.endpoint}</code>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="font-medium text-foreground">{log.partnerName}</span>
                    <span>{new Date(log.calledAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-inbound-data">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-emerald-500 rotate-180" /> Inbound Data from Partners
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchInbound()} data-testid="button-refresh-inbound">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!inboundData?.data?.length ? (
            <div className="text-center py-6 text-muted-foreground">
              <ArrowRight className="h-6 w-6 mx-auto mb-2 opacity-30 rotate-180" />
              <p className="text-sm">No inbound data yet.</p>
              <p className="text-xs mt-1">When a partner calls <code className="bg-muted px-1 rounded">/api/partner/v1/push</code> it shows up here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {inboundData.data.map(row => (
                <div key={row.id} className={`p-3 rounded-lg border text-sm ${row.processed ? "opacity-50 bg-muted/20" : "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30"}`} data-testid={`row-inbound-${row.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{row.dataType}</Badge>
                        <span className="font-medium text-xs">{row.partnerName}</span>
                        <span className="text-xs text-muted-foreground">{new Date(row.receivedAt).toLocaleString()}</span>
                        {row.processed && <Badge variant="outline" className="text-xs">Processed</Badge>}
                      </div>
                      <pre className="text-xs text-muted-foreground bg-muted/40 rounded p-2 overflow-x-auto max-h-20">
                        {JSON.stringify(row.payload, null, 2).slice(0, 300)}{JSON.stringify(row.payload).length > 300 ? "…" : ""}
                      </pre>
                    </div>
                    {!row.processed && (
                      <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => markProcessedMutation.mutate(row.id)} disabled={markProcessedMutation.isPending} data-testid={`button-process-${row.id}`}>
                        ✓ Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Webhooks sub-section ──────────────────────────────────────────── */}
      <Card data-testid="card-webhooks">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-500" /> Registered Webhooks
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => refetchWebhooks()} data-testid="button-refresh-webhooks">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={() => setShowRegisterWebhook(!showRegisterWebhook)} data-testid="button-register-webhook">
                + Register
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Partners receive POST to their URL for each event. Signed with HMAC-SHA256.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {revealedWebhookSecret && (
            <div className="border border-violet-300 bg-violet-50 dark:bg-violet-950/20 rounded p-3 space-y-2">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Webhook secret — copy now, never shown again:</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs font-mono break-all bg-white dark:bg-black border rounded px-2 py-1">{revealedWebhookSecret}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(revealedWebhookSecret); toast({ title: "Copied!" }); }}>Copy</Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRevealedWebhookSecret(null)}>Dismiss</Button>
            </div>
          )}
          {showRegisterWebhook && (
            <div className="border rounded p-3 space-y-3 bg-muted/20" data-testid="form-register-webhook">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Partner Key ID (numeric)</label>
                  <input className="w-full border rounded px-2 py-1.5 text-sm bg-background" placeholder="1" value={newWebhookKeyId} onChange={e => setNewWebhookKeyId(e.target.value)} data-testid="input-webhook-keyid" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Event</label>
                  <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={newWebhookEvent} onChange={e => setNewWebhookEvent(e.target.value)} data-testid="select-webhook-event">
                    <option value="trade_cert.issued">trade_cert.issued</option>
                    <option value="foster_youth.outcome">foster_youth.outcome</option>
                    <option value="community_brief.completed">community_brief.completed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Webhook URL</label>
                <input className="w-full border rounded px-2 py-1.5 text-sm bg-background" placeholder="https://your-org.example.com/hooks/tcaf" value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} data-testid="input-webhook-url" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => registerWebhookMutation.mutate()} disabled={!newWebhookUrl || !newWebhookKeyId || registerWebhookMutation.isPending} data-testid="button-confirm-register-webhook">
                  {registerWebhookMutation.isPending ? "Registering…" : "Register Webhook"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowRegisterWebhook(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {!allWebhooks?.webhooks?.length ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Zap className="h-6 w-6 mx-auto mb-2 opacity-30" />
              No webhooks registered yet.
            </div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {allWebhooks.webhooks.map((hook: any) => (
                <div key={hook.id} className={`flex items-center justify-between p-2.5 rounded border text-xs ${hook.active ? "bg-muted/20" : "opacity-50 bg-muted/10"}`} data-testid={`row-webhook-${hook.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{hook.event}</Badge>
                      <span className="text-muted-foreground truncate max-w-[200px]">{hook.webhookUrl}</span>
                      {!hook.active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      Key ID: {hook.partnerKeyId} · {hook.lastFiredAt ? `Last fired: ${new Date(hook.lastFiredAt).toLocaleDateString()}` : "Never fired"}
                    </div>
                  </div>
                  {hook.active && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs ml-2 shrink-0" onClick={() => deactivateWebhookMutation.mutate(hook.id)} disabled={deactivateWebhookMutation.isPending} data-testid={`button-deactivate-webhook-${hook.id}`}>
                      Deactivate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Brief Subscriptions sub-section ──────────────────────────────── */}
      <Card data-testid="card-brief-subscriptions">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> Community Brief Subscriptions
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchSubscriptions()} data-testid="button-refresh-subscriptions">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Partners subscribe via <code className="bg-muted px-1 rounded text-xs">POST /api/partner/v1/community-brief/subscribe</code>. Dispatch is activated within 24h.
          </p>
        </CardHeader>
        <CardContent>
          {!allSubscriptions?.subscriptions?.length ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Activity className="h-6 w-6 mx-auto mb-2 opacity-30" />
              No brief subscriptions yet.
            </div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {allSubscriptions.subscriptions.map((sub: any) => (
                <div key={sub.id} className={`flex items-center justify-between p-2.5 rounded border text-xs ${sub.active ? "bg-muted/20" : "opacity-50 bg-muted/10"}`} data-testid={`row-subscription-${sub.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{sub.location}</span>
                      <Badge variant="secondary" className="text-xs">{sub.frequency}</Badge>
                      {!sub.active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                    </div>
                    <div className="text-muted-foreground mt-0.5 truncate">
                      {sub.webhookUrl} · Key ID: {sub.partnerKeyId}
                      {sub.lastSentAt && ` · Last sent: ${new Date(sub.lastSentAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  {sub.active && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs ml-2 shrink-0" onClick={() => deactivateSubscriptionMutation.mutate(sub.id)} disabled={deactivateSubscriptionMutation.isPending} data-testid={`button-deactivate-sub-${sub.id}`}>
                      Deactivate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}