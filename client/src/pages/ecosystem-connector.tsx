import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Wifi, WifiOff, Activity, Heart, Shield, Globe, Zap,
  CheckCircle2, Clock, AlertTriangle, Loader2,
  Code, Copy, ExternalLink, Radio, ArrowLeftRight,
  Rocket, Server, Users, BookOpen, GraduationCap,
  Brain, Phone, Factory, Stethoscope, Pill, Cpu,
  FileText, ClipboardList, Briefcase, Filter, Eye,
} from "lucide-react";
import type { EcosystemPlatform, EcosystemEvent } from "@shared/schema";

const PLATFORM_ICONS: Record<string, typeof Heart> = {
  "whole-person-health": Heart,
  "mission-transition": Shield,
  "life-transitions-aid": Globe,
  "salp-science": BookOpen,
  "easyai-learning": GraduationCap,
  "isss": GraduationCap,
  "sankofa": Heart,
  "wholemind": BookOpen,
  "perfectly-different": Brain,
  "safereport": Shield,
  "m2c": Briefcase,
  "lifebridge": Phone,
  "mce": Factory,
  "betterscience": ClipboardList,
  "safecognicare": Cpu,
  "pillscheduler": Pill,
};

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "whole-person-health": { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", text: "text-red-600" },
  "mission-transition": { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", text: "text-blue-600" },
  "life-transitions-aid": { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-600" },
  "salp-science": { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", text: "text-purple-600" },
  "easyai-learning": { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-600" },
  "isss": { bg: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-200 dark:border-teal-800", text: "text-teal-600" },
  "sankofa": { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", text: "text-rose-600" },
  "wholemind": { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", text: "text-blue-600" },
  "perfectly-different": { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", text: "text-purple-600" },
  "safereport": { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-600" },
  "m2c": { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", text: "text-green-600" },
  "lifebridge": { bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800", text: "text-indigo-600" },
  "mce": { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-600" },
  "betterscience": { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-800", text: "text-cyan-600" },
  "safecognicare": { bg: "bg-slate-50 dark:bg-slate-950/30", border: "border-slate-200 dark:border-slate-800", text: "text-slate-600" },
  "pillscheduler": { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-200 dark:border-sky-800", text: "text-sky-600" },
};

const ROLE_LABELS: Record<string, string> = {
  hub: "Hub Platform (Prime)",
  transition: "Military Transition",
  "life-support": "Life Event Support",
  "evidence-base": "Research & Evidence",
  prevention: "Upstream Prevention",
  "student-support": "Student Support",
  "health-gateway": "Health Equity Gateway",
  "k12-education": "K-12 Education",
  neurodiversity: "Neurodiversity Support",
  compliance: "Compliance & Reporting",
  "veteran-transition": "Veteran Transition",
  "resource-hub": "Community Resources",
  "business-ecosystem": "Business Ecosystem",
  research: "Research & Implementation Science",
  "cognitive-health": "Cognitive Health",
  "medication-management": "Medication Management",
};

const GRANT_LENSES = [
  { id: "all", label: "All Platforms", color: "bg-gray-100 text-gray-700", description: "All 16 ecosystem platforms" },
  { id: "ssg-fox", label: "SSG Fox VA Suicide Prevention", color: "bg-red-100 text-red-700", description: "Up to $750K — June 12-18, 2026" },
  { id: "dfc", label: "Drug-Free Communities (DFC)", color: "bg-blue-100 text-blue-700", description: "$625K — April 14, 2026" },
  { id: "wioa", label: "WIOA Title I Youth", color: "bg-green-100 text-green-700", description: "$200K-$500K — Rolling" },
  { id: "nba-foundation", label: "NBA Foundation", color: "bg-orange-100 text-orange-700", description: "$100K-$500K — Rolling LOI" },
  { id: "st-davids", label: "St. David's Foundation", color: "bg-purple-100 text-purple-700", description: "Up to $1M — Opens March 30, 2026" },
  { id: "samhsa", label: "SAMHSA Community Mental Health", color: "bg-pink-100 text-pink-700", description: "Varies — Varies" },
];

const HEALTH_CONFIG: Record<string, { label: string; color: string; icon: typeof Wifi }> = {
  online: { label: "Online", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: Wifi },
  degraded: { label: "Degraded", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Activity },
  offline: { label: "Offline", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: WifiOff },
  unknown: { label: "Not Checked", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
};

const DEFAULT_COLORS = { bg: "bg-gray-50 dark:bg-gray-950/30", border: "border-gray-200 dark:border-gray-800", text: "text-gray-600" };

export default function EcosystemConnectorPage() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [snippetContent, setSnippetContent] = useState<string>("");
  const [snippetInstructions, setSnippetInstructions] = useState<string[]>([]);
  const [grantLens, setGrantLens] = useState<string>("all");

  const { data: platforms = [], isLoading: platformsLoading } = useQuery<EcosystemPlatform[]>({
    queryKey: ["/api/ecosystem/platforms"],
  });

  const { data: statusData } = useQuery<{
    totalPlatforms: number;
    onlinePlatforms: number;
    totalEvents: number;
    eventsLast24h: number;
    platforms: Array<{ id: string; name: string; url: string; role: string; domain: string | null; status: string; healthStatus: string; lastHeartbeat: string | null; lastHealthCheck: string | null; grantAlignment: string[] | null }>;
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
      toast({ title: "Ecosystem initialized", description: `${data.platforms.length} platforms registered.` });
    },
    onError: () => toast({ title: "Initialization failed", variant: "destructive" }),
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
    onError: () => toast({ title: "Health check failed", variant: "destructive" }),
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

  const displayPlatforms = statusData?.platforms || [];
  const filteredPlatforms = grantLens === "all"
    ? displayPlatforms
    : displayPlatforms.filter((p) => (p.grantAlignment || []).includes(grantLens));

  const onlineCount = statusData?.onlinePlatforms || 0;
  const totalCount = statusData?.totalPlatforms || 0;
  const currentLens = GRANT_LENSES.find((l) => l.id === grantLens);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-ecosystem-title">Ecosystem Command Center</h1>
          <p className="text-muted-foreground mt-1">16-platform ecosystem — a la carte views by grant, real-time connectivity, no dead ends</p>
        </div>
        <div className="flex gap-2">
          {platforms.length === 0 && (
            <Button onClick={() => initMutation.mutate()} disabled={initMutation.isPending} className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white" data-testid="button-initialize">
              {initMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
              Initialize All 16 Platforms
            </Button>
          )}
          {platforms.length > 0 && (
            <Button onClick={() => healthCheckMutation.mutate()} disabled={healthCheckMutation.isPending} variant="outline" data-testid="button-health-check">
              {healthCheckMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
              Run Health Check
            </Button>
          )}
        </div>
      </div>

      {platforms.length > 0 && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold text-sm">Grant Lens:</span>
              </div>
              <Select value={grantLens} onValueChange={setGrantLens}>
                <SelectTrigger className="w-full sm:w-[340px]" data-testid="select-grant-lens">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRANT_LENSES.map((lens) => (
                    <SelectItem key={lens.id} value={lens.id} data-testid={`lens-${lens.id}`}>
                      <span className="flex items-center gap-2">
                        <Eye className="h-3 w-3" />
                        {lens.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentLens && grantLens !== "all" && (
                <Badge className={`${currentLens.color} text-xs`}>
                  {currentLens.description} — {filteredPlatforms.length} platforms
                </Badge>
              )}
              {grantLens === "all" && (
                <Badge variant="outline" className="text-xs">{totalCount} platforms registered</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40"><Server className="h-5 w-5 text-indigo-600" /></div>
            <div><p className="text-2xl font-bold" data-testid="text-total-platforms">{grantLens === "all" ? totalCount : filteredPlatforms.length}</p><p className="text-xs text-muted-foreground">{grantLens === "all" ? "Total" : "In Lens"}</p></div>
          </CardContent>
        </Card>
        <Card className={onlineCount === totalCount && totalCount > 0 ? "border-emerald-200 dark:border-emerald-800" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40"><Wifi className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold" data-testid="text-online-count">{onlineCount}</p><p className="text-xs text-muted-foreground">Online</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40"><ArrowLeftRight className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold" data-testid="text-total-events">{statusData?.totalEvents || 0}</p><p className="text-xs text-muted-foreground">Total Events</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40"><Zap className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold" data-testid="text-events-24h">{statusData?.eventsLast24h || 0}</p><p className="text-xs text-muted-foreground">Events (24h)</p></div>
          </CardContent>
        </Card>
      </div>

      {platforms.length === 0 && !platformsLoading && (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-lg">Ecosystem Not Initialized</h3>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Click "Initialize All 16 Platforms" to register the entire Collaborative Advocate ecosystem. This creates API keys and connection profiles for every platform — from Whole-Person Health to PillScheduler. You can then filter by grant to see only the platforms relevant to each application.
            </p>
          </CardContent>
        </Card>
      )}

      {platforms.length > 0 && (
        <Tabs defaultValue="platforms">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="platforms" data-testid="tab-platforms"><Server className="h-4 w-4 mr-1.5" />Platforms ({filteredPlatforms.length})</TabsTrigger>
            <TabsTrigger value="integration" data-testid="tab-integration"><Code className="h-4 w-4 mr-1.5" />Integration Code</TabsTrigger>
            <TabsTrigger value="playbook" data-testid="tab-playbook"><FileText className="h-4 w-4 mr-1.5" />Integration Playbook</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events"><ArrowLeftRight className="h-4 w-4 mr-1.5" />Event Log ({events.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-3 mt-4">
            {filteredPlatforms.map((p: any) => {
              const Icon = PLATFORM_ICONS[p.id] || Globe;
              const colors = PLATFORM_COLORS[p.id] || DEFAULT_COLORS;
              const health = HEALTH_CONFIG[p.healthStatus || "unknown"];
              const HealthIcon = health.icon;
              const platformData = platforms.find((pp) => pp.id === p.id);

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
                            <Badge className={`text-[10px] ${health.color}`}><HealthIcon className="h-3 w-3 mr-1" />{health.label}</Badge>
                            <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[p.role] || p.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {(platformData as any)?.description || p.url}
                          </p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                              <ExternalLink className="h-3 w-3" />{p.url.replace("https://", "")}
                            </a>
                            {(p.grantAlignment || []).map((g: string) => {
                              const lens = GRANT_LENSES.find((l) => l.id === g);
                              return lens ? <Badge key={g} variant="outline" className="text-[9px] px-1.5">{lens.label.split(" ")[0]}</Badge> : null;
                            })}
                          </div>
                          {p.lastHeartbeat && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Radio className="h-3 w-3" />Last heartbeat: {new Date(p.lastHeartbeat).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => snippetMutation.mutate(p.id)} disabled={snippetMutation.isPending} data-testid={`button-snippet-${p.id}`}>
                        <Code className="h-3.5 w-3.5 mr-1" />Get Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="border-dashed bg-gray-50/50 dark:bg-gray-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 mt-0.5">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">ThriveUp Academy (You Are Here)</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The facilitator and orchestrator. All platforms report to ThriveUp, and ThriveUp reports back. ThriveUp Academy 501(c)(3) serves as the central hub for grant management, workforce development, and ecosystem coordination. Every grant application draws from the platforms relevant to its mission.
                    </p>
                    <Badge className="mt-2 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Facilitator — Always Online — All Grants
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Code className="h-5 w-5" />Integration Code Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select any platform to generate its drop-in integration file. Each snippet includes heartbeat, event dispatch, event handling, and access to the shared integration document. Copy the code into that platform's codebase to establish the live bidirectional connection.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {platforms.map((p) => {
                    const Icon = PLATFORM_ICONS[p.id] || Globe;
                    const colors = PLATFORM_COLORS[p.id] || DEFAULT_COLORS;
                    return (
                      <Button key={p.id} variant={selectedPlatform === p.id ? "default" : "outline"} className="flex items-center gap-2 justify-start text-xs h-auto py-2" onClick={() => snippetMutation.mutate(p.id)} disabled={snippetMutation.isPending} data-testid={`button-select-platform-${p.id}`}>
                        <Icon className={`h-4 w-4 flex-shrink-0 ${selectedPlatform === p.id ? "" : colors.text}`} />
                        <span className="truncate">{p.name.split(" — ")[0].split(" / ")[0]}</span>
                      </Button>
                    );
                  })}
                </div>
                {snippetContent && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Integration Code for {platforms.find((p) => p.id === selectedPlatform)?.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(snippetContent); toast({ title: "Code copied to clipboard" }); }} data-testid="button-copy-snippet">
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-[400px] overflow-y-auto font-mono" data-testid="code-snippet">{snippetContent}</pre>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Setup Instructions</h4>
                      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal ml-4">
                        {snippetInstructions.map((instruction, i) => <li key={i}>{instruction}</li>)}
                      </ol>
                    </div>
                  </div>
                )}
                {!snippetContent && !snippetMutation.isPending && (
                  <div className="text-center py-8 text-muted-foreground text-sm">Select a platform above to generate its integration code</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playbook" className="space-y-4 mt-4">
            <IntegrationPlaybook />
          </TabsContent>

          <TabsContent value="events" className="space-y-3 mt-4">
            {events.length === 0 && (
              <Card><CardContent className="p-8 text-center">
                <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-bold">No Events Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Events will appear here once ecosystem platforms begin sending heartbeats and data. Each screening, referral, crisis event, and milestone creates a trackable event.</p>
              </CardContent></Card>
            )}
            {events.map((event) => {
              const sourceColors = PLATFORM_COLORS[event.sourcePlatformId] || DEFAULT_COLORS;
              const SourceIcon = PLATFORM_ICONS[event.sourcePlatformId] || Globe;
              return (
                <Card key={event.id} data-testid={`event-card-${event.id}`}><CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${sourceColors.bg}`}><SourceIcon className={`h-4 w-4 ${sourceColors.text}`} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="font-medium text-sm">{event.eventType}</span><Badge variant="outline" className="text-[10px]">{event.status}</Badge></div>
                      <p className="text-xs text-muted-foreground">From: {event.sourcePlatformId}{event.targetPlatformId ? ` → To: ${event.targetPlatformId}` : " → Broadcast"}{" · "}{event.createdAt ? new Date(event.createdAt).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                </CardContent></Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function IntegrationPlaybook() {
  const phases = [
    {
      name: "Phase 1: Prevention & Preparedness",
      color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      platforms: ["easyai-learning", "mission-transition", "whole-person-health", "salp-science", "wholemind", "isss"],
      description: "Purpose, skills, pathways for youth; pre-separation planning; preparedness plans; evidence base for prevention strategies.",
    },
    {
      name: "Phase 2: Early Warning",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      platforms: ["whole-person-health", "life-transitions-aid", "sankofa", "perfectly-different", "safecognicare"],
      description: "C-SSRS, PHQ-9, GAD-7, PCL-5 screenings; life event self-assessment; MAP-GAP 7-domain assessment; cognitive and neurodevelopmental monitoring.",
    },
    {
      name: "Phase 3: Crisis Support",
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      platforms: ["whole-person-health", "lifebridge", "safereport"],
      description: "988 Veterans Crisis Line; Crisis Text Line; Reach a Vet peer support; Safety Plan Builder; Quick Exit; 24/7 resource navigation; mandatory reporting.",
    },
    {
      name: "Phase 4: Stabilization",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      platforms: ["whole-person-health", "lifebridge", "pillscheduler", "sankofa"],
      description: "Care Summary Generator; Find Help (20,670+ resources); Refer-a-Patient; medication management; VA facility connections.",
    },
    {
      name: "Phase 5: Recovery & Growth",
      color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
      platforms: ["whole-person-health", "life-transitions-aid", "mission-transition", "easyai-learning", "mce", "salp-science"],
      description: "Community groups (2,091+); peer stories; condition guides; ongoing life navigation; career pathways; business formation; outcome measurement.",
    },
  ];

  const principles = [
    { title: "No Dead Ends", detail: "Every page on every platform has at least one forward path. No user should ever land on a page and feel stuck." },
    { title: "Always a Safety Net", detail: "Every platform displays crisis resources. 988 Veterans Crisis Line is accessible from every page. Never more than one click from crisis support." },
    { title: "Privacy First", detail: "All screening results, safety plans, and personal data stay on the user's device (localStorage). No accounts required for crisis tools." },
    { title: "Free for Individuals", detail: "No individual user ever pays for anything on any platform. Revenue comes from B2B, institutional partnerships, and grants." },
    { title: "Offline-Capable", detail: "Safety-critical features work offline via PWA service worker caching. A veteran in rural Texas with no cell service can still access their safety plan." },
    { title: "Veteran-Informed Design", detail: "Built by Dr. Terry Flood (20yr Army, VCL responder, DMSc). Direct, no-nonsense language. No clinical jargon. No condescension." },
    { title: "Quick Exit", detail: "Every platform includes a Quick Exit button — immediate redirect to weather.com with browser history replacement." },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Cross-Platform Integration Playbook</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This is the shared source of truth for the entire ecosystem. Every platform can fetch this document via their integration connector (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">getIntegrationDoc()</code>). When you generate and deploy a connector to any platform, that platform automatically gets access to this playbook — keeping everyone on the same sheet of music.
          </p>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-sm mb-1">Core Premise</h4>
            <p className="text-xs text-muted-foreground">
              Veteran suicide is not a single-point problem. It's a continuum — from separation, through life transitions, into crisis, through stabilization, and into long-term recovery. No single app, hotline, or VA program covers the full spectrum. <strong>This ecosystem does.</strong> Sixteen platforms. One mission. Each serves a distinct role. Together, they ensure no matter where a veteran, youth, or community member is — there is always a next step. Never a dead end.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Crisis Continuum — How Users Flow Between Platforms</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.name} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${phase.color} text-xs`}>{phase.name}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{phase.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {phase.platforms.map((pid) => {
                  const Icon = PLATFORM_ICONS[pid] || Globe;
                  const colors = PLATFORM_COLORS[pid] || DEFAULT_COLORS;
                  return (
                    <Badge key={pid} variant="outline" className="text-[10px] flex items-center gap-1">
                      <Icon className={`h-3 w-3 ${colors.text}`} />{pid}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Shared Design Principles — All 16 Platforms</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {principles.map((p) => (
              <div key={p.title} className="border rounded-lg p-3">
                <h5 className="font-semibold text-sm flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />{p.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{p.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Three-Entity Structure</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border rounded-lg p-3">
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-[10px] mb-2">501(c)(3)</Badge>
              <h5 className="font-semibold text-sm">ThriveUp Academy</h5>
              <p className="text-xs text-muted-foreground mt-1">Central orchestrator. Grant management, workforce development, ecosystem coordination. Nonprofit backbone.</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-[10px] mb-2">VOSB</Badge>
              <h5 className="font-semibold text-sm">The Collaborative Advocate</h5>
              <p className="text-xs text-muted-foreground mt-1">Veteran-Owned Small Business. Service delivery, technology development, federal contracting. Dr. Terry Flood, DMSc.</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] mb-2">SaaS</Badge>
              <h5 className="font-semibold text-sm">Minority Center of Excellence</h5>
              <p className="text-xs text-muted-foreground mt-1">Minority business ecosystem. 656,794 records, 14 AI tools, SAM.gov integration, certification wizard, teaming hub.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
