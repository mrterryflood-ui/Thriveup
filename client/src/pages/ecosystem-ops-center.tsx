import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  BellRing, Volume2,
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
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

export default function EcosystemOpsCenterPage() {
  const [activeTab, setActiveTab] = useState("live");
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    document.title = "Ecosystem Operations Center | ThriveUp Academy";
  }, []);

  const { data: liveStatus, isLoading, isFetching, refetch } = useQuery<LiveStatus>({
    queryKey: ["/api/ecosystem/live-status"],
    refetchInterval: autoRefresh ? 60000 : false,
    staleTime: 30000,
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
      <PageHeader
        title="Ecosystem Operations Center"
        description="Real-time monitoring of all 20 platforms — who's online, who's responding, who needs attention."
        actions={
          <div className="flex gap-2 items-center">
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
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-ops">
              <Printer className="h-4 w-4 mr-1" /> Print
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto p-1">
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
            </TabsList>

            <TabsContent value="live" className="mt-6 space-y-3" data-testid="content-live">
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
                    <p className="text-muted-foreground">All 20 platforms are online and responding normally.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="regional" className="mt-6 space-y-6" data-testid="content-regional">
              <h2 className="text-lg font-bold">Regional Hub Status</h2>
              <p className="text-muted-foreground">
                Three regional hubs powered by the same 20-platform ecosystem.
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
                        <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" /> 20 Platforms</Badge>
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