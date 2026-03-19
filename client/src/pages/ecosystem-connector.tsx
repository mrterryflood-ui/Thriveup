import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Wifi, WifiOff, Activity, Heart, Shield, Globe, Zap,
  CheckCircle2, Clock, AlertTriangle, Loader2, RefreshCw,
  Code, Copy, ExternalLink, Radio, ArrowLeftRight,
  Rocket, Server, Users, BookOpen, GraduationCap,
} from "lucide-react";
import type { EcosystemPlatform, EcosystemEvent } from "@shared/schema";

const PLATFORM_ICONS: Record<string, typeof Heart> = {
  "whole-person-health": Heart,
  "mission-transition": Shield,
  "life-transitions-aid": Globe,
  "salp-science": BookOpen,
  "easyai-learning": GraduationCap,
};

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "whole-person-health": { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", text: "text-red-600" },
  "mission-transition": { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", text: "text-blue-600" },
  "life-transitions-aid": { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-600" },
  "salp-science": { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", text: "text-purple-600" },
  "easyai-learning": { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-600" },
};

const ROLE_LABELS: Record<string, string> = {
  hub: "Hub Platform (Prime)",
  transition: "Military Transition",
  "life-support": "Life Event Support",
  "evidence-base": "Research & Evidence",
  prevention: "Upstream Prevention",
};

const HEALTH_CONFIG: Record<string, { label: string; color: string; icon: typeof Wifi }> = {
  online: { label: "Online", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: Wifi },
  degraded: { label: "Degraded", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Activity },
  offline: { label: "Offline", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: WifiOff },
  unknown: { label: "Not Checked", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
};

export default function EcosystemConnectorPage() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [snippetContent, setSnippetContent] = useState<string>("");
  const [snippetInstructions, setSnippetInstructions] = useState<string[]>([]);

  const { data: platforms = [], isLoading: platformsLoading } = useQuery<EcosystemPlatform[]>({
    queryKey: ["/api/ecosystem/platforms"],
  });

  const { data: statusData } = useQuery<{
    totalPlatforms: number;
    onlinePlatforms: number;
    totalEvents: number;
    eventsLast24h: number;
    platforms: Array<{ id: string; name: string; url: string; role: string; status: string; healthStatus: string; lastHeartbeat: string | null; lastHealthCheck: string | null }>;
  }>({
    queryKey: ["/api/ecosystem/status"],
  });

  const { data: events = [] } = useQuery<EcosystemEvent[]>({
    queryKey: ["/api/ecosystem/events"],
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ecosystem/initialize", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/status"] });
      toast({ title: "Ecosystem initialized", description: `${data.platforms.length} platforms registered with API keys.` });
    },
    onError: () => {
      toast({ title: "Initialization failed", variant: "destructive" });
    },
  });

  const healthCheckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ecosystem/health-check", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/status"] });
      const online = data.platforms.filter((p: any) => p.status === "online").length;
      toast({ title: "Health check complete", description: `${online}/${data.platforms.length} platforms online.` });
    },
    onError: () => {
      toast({ title: "Health check failed", variant: "destructive" });
    },
  });

  const snippetMutation = useMutation({
    mutationFn: async (platformId: string) => {
      const res = await apiRequest("GET", `/api/ecosystem/integration-snippet/${platformId}`, undefined);
      return res.json();
    },
    onSuccess: (data) => {
      setSnippetContent(data.snippet);
      setSnippetInstructions(data.instructions);
      setSelectedPlatform(data.platformId);
    },
  });

  const onlineCount = statusData?.onlinePlatforms || 0;
  const totalCount = statusData?.totalPlatforms || 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-ecosystem-title">Ecosystem Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time connectivity between all 5 Fox Grant platforms — no dead ends</p>
        </div>
        <div className="flex gap-2">
          {platforms.length === 0 && (
            <Button
              onClick={() => initMutation.mutate()}
              disabled={initMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white"
              data-testid="button-initialize"
            >
              {initMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
              Initialize Ecosystem
            </Button>
          )}
          {platforms.length > 0 && (
            <Button
              onClick={() => healthCheckMutation.mutate()}
              disabled={healthCheckMutation.isPending}
              variant="outline"
              data-testid="button-health-check"
            >
              {healthCheckMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
              Run Health Check
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <Server className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-platforms">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Platforms</p>
            </div>
          </CardContent>
        </Card>
        <Card className={onlineCount === totalCount && totalCount > 0 ? "border-emerald-200 dark:border-emerald-800" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Wifi className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-online-count">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
              <ArrowLeftRight className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-events">{statusData?.totalEvents || 0}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-events-24h">{statusData?.eventsLast24h || 0}</p>
              <p className="text-xs text-muted-foreground">Events (24h)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {platforms.length === 0 && !platformsLoading && (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-lg">Ecosystem Not Initialized</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Click "Initialize Ecosystem" to register all 5 Fox Grant platforms. This creates API keys and connection profiles for each platform — Whole-Person Health, Mission Transition, Life Transitions Aid, SALP Science, and EasyAI Learning.
            </p>
          </CardContent>
        </Card>
      )}

      {platforms.length > 0 && (
        <Tabs defaultValue="platforms">
          <TabsList>
            <TabsTrigger value="platforms" data-testid="tab-platforms">
              <Server className="h-4 w-4 mr-1.5" />
              Platforms ({platforms.length})
            </TabsTrigger>
            <TabsTrigger value="integration" data-testid="tab-integration">
              <Code className="h-4 w-4 mr-1.5" />
              Integration Code
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">
              <ArrowLeftRight className="h-4 w-4 mr-1.5" />
              Event Log ({events.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-3 mt-4">
            {(statusData?.platforms || platforms).map((p: any) => {
              const Icon = PLATFORM_ICONS[p.id] || Globe;
              const colors = PLATFORM_COLORS[p.id] || PLATFORM_COLORS["whole-person-health"];
              const health = HEALTH_CONFIG[p.healthStatus || "unknown"];
              const HealthIcon = health.icon;

              return (
                <Card key={p.id} className={`${colors.border}`} data-testid={`platform-card-${p.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-lg ${colors.bg} mt-0.5`}>
                          <Icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{p.name}</h4>
                            <Badge className={`text-[10px] ${health.color}`}>
                              <HealthIcon className="h-3 w-3 mr-1" />
                              {health.label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {ROLE_LABELS[p.role] || p.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {(platforms.find((pp) => pp.id === p.id) as any)?.description || p.url}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                              <ExternalLink className="h-3 w-3" />
                              {p.url.replace("https://", "")}
                            </a>
                            {p.lastHeartbeat && (
                              <span className="flex items-center gap-1">
                                <Radio className="h-3 w-3" />
                                Heartbeat: {new Date(p.lastHeartbeat).toLocaleString()}
                              </span>
                            )}
                            {p.lastHealthCheck && (
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                Checked: {new Date(p.lastHealthCheck).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => snippetMutation.mutate(p.id)}
                        disabled={snippetMutation.isPending}
                        data-testid={`button-snippet-${p.id}`}
                      >
                        <Code className="h-3.5 w-3.5 mr-1" />
                        Get Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="border-dashed bg-gray-50/50 dark:bg-gray-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 mt-0.5">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">ThriveUp Academy (You Are Here)</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The facilitator and orchestrator. All 5 platforms report to ThriveUp, and ThriveUp reports back — creating a common operating picture for the SSG Fox ecosystem.
                    </p>
                    <Badge className="mt-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Facilitator — Always Online
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Integration Code Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a platform to generate its integration code. Copy this code into that platform's codebase to establish the live connection to ThriveUp.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {platforms.map((p) => {
                    const Icon = PLATFORM_ICONS[p.id] || Globe;
                    const colors = PLATFORM_COLORS[p.id] || PLATFORM_COLORS["whole-person-health"];
                    return (
                      <Button
                        key={p.id}
                        variant={selectedPlatform === p.id ? "default" : "outline"}
                        className="flex items-center gap-2 justify-start"
                        onClick={() => snippetMutation.mutate(p.id)}
                        disabled={snippetMutation.isPending}
                        data-testid={`button-select-platform-${p.id}`}
                      >
                        <Icon className={`h-4 w-4 ${selectedPlatform === p.id ? "" : colors.text}`} />
                        <span className="text-xs truncate">{p.name.split(" ")[0]}</span>
                      </Button>
                    );
                  })}
                </div>

                {snippetContent && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Integration Code for {platforms.find((p) => p.id === selectedPlatform)?.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(snippetContent);
                          toast({ title: "Code copied to clipboard" });
                        }}
                        data-testid="button-copy-snippet"
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-[400px] overflow-y-auto font-mono" data-testid="code-snippet">
                      {snippetContent}
                    </pre>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Setup Instructions
                      </h4>
                      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal ml-4">
                        {snippetInstructions.map((instruction, i) => (
                          <li key={i}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {!snippetContent && !snippetMutation.isPending && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Select a platform above to generate its integration code
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-3 mt-4">
            {events.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="font-bold">No Events Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Events will appear here once the ecosystem platforms begin sending heartbeats and data. Each screening, referral, crisis event, and milestone creates a trackable event.
                  </p>
                </CardContent>
              </Card>
            )}
            {events.map((event) => {
              const sourceColors = PLATFORM_COLORS[event.sourcePlatformId] || PLATFORM_COLORS["whole-person-health"];
              const SourceIcon = PLATFORM_ICONS[event.sourcePlatformId] || Globe;
              return (
                <Card key={event.id} data-testid={`event-card-${event.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${sourceColors.bg}`}>
                        <SourceIcon className={`h-4 w-4 ${sourceColors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.eventType}</span>
                          <Badge variant="outline" className="text-[10px]">{event.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          From: {event.sourcePlatformId}
                          {event.targetPlatformId ? ` → To: ${event.targetPlatformId}` : " → Broadcast"}
                          {" · "}
                          {event.createdAt ? new Date(event.createdAt).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
