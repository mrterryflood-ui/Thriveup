import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle, AlertTriangle, XCircle, Globe, FileText, ArrowRight, Shield, Heart, BookOpen, Briefcase, Network, Home, Users, Target, TrendingUp, MapPin, Brain, Zap, Baby, GraduationCap, Smile, ShieldCheck } from "lucide-react";

function HealthDot({ status }: { status: string }) {
  const color = status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : status === "offline" ? "bg-red-500" : "bg-gray-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

function domainIcon(domain: string) {
  switch (domain) {
    case "health-equity": return <Heart className="w-4 h-4" />;
    case "education": return <BookOpen className="w-4 h-4" />;
    case "veterans": case "veteran-services": return <Shield className="w-4 h-4" />;
    case "community-workforce": return <Network className="w-4 h-4" />;
    case "business-intelligence": return <Briefcase className="w-4 h-4" />;
    default: return <Globe className="w-4 h-4" />;
  }
}

interface EcosystemStatus {
  ecosystem: {
    name: string;
    totalPlatforms: number;
    health: { online: number; degraded: number; offline: number; unknown: number };
  };
  platforms: Array<{
    id: string;
    name: string;
    url: string;
    role: string;
    domain: string;
    description: string;
    status: string;
    healthStatus: string;
    lastHeartbeat: string | null;
    grantAlignment: string[] | null;
  }>;
  directives: Array<{
    id: string;
    title: string;
    directiveType: string;
    grantId: string | null;
    status: string;
    createdAt: string;
    expiresAt: string | null;
    targetPlatformCount: number;
    stats: { total: number; pending: number; delivered: number; acknowledged: number };
  }>;
}

export default function EcosystemEmbedPage() {
  const { data, isLoading, error } = useQuery<EcosystemStatus>({
    queryKey: ["/api/ecosystem/public/status"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-4xl mx-auto" data-testid="embed-loading">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 max-w-4xl mx-auto" data-testid="embed-error">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Unable to load ecosystem status</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { ecosystem, platforms, directives } = data;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto" data-testid="ecosystem-embed">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold" data-testid="text-ecosystem-name">{ecosystem.name}</h1>
        </div>
        <Badge variant="outline" data-testid="badge-platform-count">
          {ecosystem.totalPlatforms} platforms
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card data-testid="card-health-online">
          <CardContent className="p-3 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xl font-bold" data-testid="text-online-count">{ecosystem.health.online}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </CardContent>
        </Card>
        <Card data-testid="card-health-degraded">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
            <p className="text-xl font-bold" data-testid="text-degraded-count">{ecosystem.health.degraded}</p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </CardContent>
        </Card>
        <Card data-testid="card-health-offline">
          <CardContent className="p-3 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-600 dark:text-red-400" />
            <p className="text-xl font-bold" data-testid="text-offline-count">{ecosystem.health.offline}</p>
            <p className="text-xs text-muted-foreground">Offline</p>
          </CardContent>
        </Card>
        <Card data-testid="card-directives-count">
          <CardContent className="p-3 text-center">
            <FileText className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold" data-testid="text-directives-count">{directives.length}</p>
            <p className="text-xs text-muted-foreground">Active Directives</p>
          </CardContent>
        </Card>
      </div>

      {directives.length > 0 && (
        <Card data-testid="card-directives-list">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <FileText className="w-4 h-4" /> Active Directives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {directives.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50" data-testid={`directive-${d.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" data-testid={`text-directive-title-${d.id}`}>{d.title}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <Badge variant="secondary" className="text-xs" data-testid={`badge-directive-type-${d.id}`}>{d.directiveType}</Badge>
                    {d.grantId && <Badge variant="outline" className="text-xs">{d.grantId}</Badge>}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <p>{d.stats.acknowledged}/{d.stats.total} ack</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-platforms-grid">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            <Globe className="w-4 h-4" /> Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {platforms.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50" data-testid={`platform-${p.id}`}>
                <HealthDot status={p.healthStatus} />
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {domainIcon(p.domain)}
                  <span className="text-sm truncate" data-testid={`text-platform-name-${p.id}`}>{p.name}</span>
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0" data-testid={`link-platform-${p.id}`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground" data-testid="text-footer">
        Powered by ThriveUp Ecosystem
      </p>
    </div>
  );
}

interface LifeBridgeData {
  platform: {
    id: string;
    name: string;
    url: string;
    role: string;
    domain: string;
    description: string;
    healthStatus: string;
    lastHeartbeat: string | null;
    grantAlignment: string[] | null;
    sends: string[];
    receives: string[];
  };
  totalDirectives: number;
  pending: number;
  delivered: number;
  acknowledged: number;
  directives: Array<{
    directiveId: string;
    title: string;
    type: string;
    content: string;
    grantId: string | null;
    yourRole: string | null;
    deliveryStatus: string;
    issuedAt: string;
    acknowledgedAt: string | null;
  }>;
}

export function LifeBridgeEmbedPage() {
  const { data, isLoading, error } = useQuery<LifeBridgeData>({
    queryKey: ["/api/ecosystem/internal/platform-directives", "lifebridge"],
    queryFn: () => fetch("/api/ecosystem/internal/platform-directives/lifebridge").then(r => {
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    }),
    refetchInterval: 60000,
  });

  const { data: ecosystemData } = useQuery<EcosystemStatus>({
    queryKey: ["/api/ecosystem/public/status"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-3xl mx-auto" data-testid="lifebridge-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 max-w-3xl mx-auto" data-testid="lifebridge-error">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Unable to load LifeBridge ecosystem data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { platform, directives } = data;
  const connectedPlatforms = ecosystemData?.platforms.filter(p => p.id !== "lifebridge") || [];

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto" data-testid="lifebridge-embed">
      <div className="flex items-center gap-2 flex-wrap">
        <Heart className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold" data-testid="text-lifebridge-title">{platform.name}</h1>
        <HealthDot status={platform.healthStatus} />
      </div>

      <Card data-testid="card-lifebridge-role">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm" data-testid="text-lifebridge-description">{platform.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" data-testid="badge-lifebridge-role">{platform.role}</Badge>
            <Badge variant="outline" data-testid="badge-lifebridge-domain">{platform.domain}</Badge>
            {(platform.grantAlignment || []).map((g) => (
              <Badge key={g} variant="secondary" className="text-xs" data-testid={`badge-grant-${g}`}>{g}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card data-testid="card-lb-pending">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold" data-testid="text-lb-pending">{data.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card data-testid="card-lb-delivered">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold" data-testid="text-lb-delivered">{data.delivered}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card data-testid="card-lb-acknowledged">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold" data-testid="text-lb-acknowledged">{data.acknowledged}</p>
            <p className="text-xs text-muted-foreground">Acknowledged</p>
          </CardContent>
        </Card>
      </div>

      {directives.length > 0 && (
        <Card data-testid="card-lb-directives">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <FileText className="w-4 h-4" /> LifeBridge Directives ({data.totalDirectives})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {directives.map((d) => (
              <div key={d.directiveId} className="p-2 rounded-md bg-muted/50 space-y-1" data-testid={`lb-directive-${d.directiveId}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate" data-testid={`text-lb-directive-title-${d.directiveId}`}>{d.title}</p>
                  <Badge
                    variant={d.deliveryStatus === "acknowledged" ? "default" : d.deliveryStatus === "delivered" ? "secondary" : "outline"}
                    className="text-xs shrink-0"
                    data-testid={`badge-lb-status-${d.directiveId}`}
                  >
                    {d.deliveryStatus}
                  </Badge>
                </div>
                {d.yourRole && (
                  <p className="text-xs text-muted-foreground" data-testid={`text-lb-role-${d.directiveId}`}>
                    Your role: {d.yourRole}
                  </p>
                )}
                {d.grantId && (
                  <Badge variant="outline" className="text-xs">{d.grantId}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {platform.sends.length > 0 && (
        <Card data-testid="card-lb-dataflows">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Network className="w-4 h-4" /> Data Flows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Sends</p>
              <div className="flex flex-wrap gap-1">
                {platform.sends.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs" data-testid={`badge-sends-${s}`}>{s.replace(/_/g, " ")}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Receives</p>
              <div className="flex flex-wrap gap-1">
                {platform.receives.map((r) => (
                  <Badge key={r} variant="outline" className="text-xs" data-testid={`badge-receives-${r}`}>{r.replace(/_/g, " ")}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-l-4 border-l-blue-600" data-testid="card-rplice-austin-climate">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" /> RPLICE Austin Climate Initiative
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Evidence-based response to Austin's housing, workforce, and health equity crisis — validated through CFIR/RE-AIM implementation science and Dr. Flood's Three Realities methodology.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Median Home Price", value: "$435K", icon: Home, detail: "2 of 75 zip codes affordable" },
              { label: "Homeless (PIT 2025)", value: "3,238", icon: Users, detail: "Up 36% from 2023" },
              { label: "Youth Homeless", value: "934", icon: AlertTriangle, detail: "Quadrupled since 2020" },
              { label: "Cost-Burdened Renters", value: "85%+", icon: TrendingUp, detail: "ELI paying >50% income" },
            ].map((stat) => (
              <div key={stat.label} className="p-2 rounded-md bg-muted/50 text-center" data-testid={`stat-climate-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <stat.icon className="w-3.5 h-3.5 mx-auto mb-1 text-blue-600" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs font-medium">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> LifeBridge's Role in the Initiative
            </p>
            <div className="space-y-1.5">
              {[
                { action: "Housing Navigation", detail: "Front door for crisis — SDOH screening, resource matching, warm handoffs to 19 partner platforms" },
                { action: "Benefits Enrollment", detail: "Connects individuals to SNAP, Medicaid, CHIP, housing vouchers, utility assistance programs" },
                { action: "Community Voice", detail: "Three Realities ground-truth — captures lived experience data for RPLICE fidelity tracking" },
                { action: "Veteran Services Bridge", detail: "Coordinates with M2C Transition and Mission Transition for the 13% veteran homeless population" },
              ].map((item) => (
                <div key={item.action} className="flex gap-2 items-start p-2 rounded bg-blue-50 dark:bg-blue-950/30" data-testid={`climate-role-${item.action.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Zap className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Three Regional Hubs
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { hub: "Austin", focus: "Housing crisis epicenter, veteran services, youth homelessness" },
                { hub: "Manor", focus: "Rural-suburban bridge, ESRI 3rd Spaces, agricultural workforce" },
                { hub: "Pflugerville", focus: "Fastest-growing city, PCDC partnership, workforce pipeline" },
              ].map((h) => (
                <div key={h.hub} className="p-2 rounded bg-muted/50 text-center" data-testid={`hub-${h.hub.toLowerCase()}`}>
                  <p className="text-xs font-bold">{h.hub}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.focus}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Active Grant Pipeline
            </p>
            <div className="space-y-1">
              {[
                { grant: "DFC Grant", amount: "$625K", deadline: "April 14, 2026" },
                { grant: "St. David's Foundation", amount: "Up to $1M", deadline: "Opens March 30, 2026" },
                { grant: "WIOA Workforce", amount: "$200K–$500K", deadline: "Rolling" },
                { grant: "SSG Fox VA", amount: "Up to $750K", deadline: "June 12–18, 2026" },
                { grant: "Foundation Grants", amount: "$100K–$500K", deadline: "Rolling LOI" },
              ].map((g) => (
                <div key={g.grant} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30" data-testid={`grant-${g.grant.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="font-medium">{g.grant}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs py-0">{g.amount}</Badge>
                    <span className="text-muted-foreground">{g.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-700 p-3 text-white text-center" data-testid="climate-cta">
            <p className="text-xs font-semibold mb-1">24 Platforms. 3 Hubs. 1 Mission.</p>
            <p className="text-xs opacity-80">RPLICE-validated, CFIR/RE-AIM aligned, Three Realities grounded</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-emerald-600" data-testid="card-healthy-happy-safe-kids">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Smile className="w-4 h-4 text-emerald-600" /> Healthy Kids, Happy Kids, Safe Kids in Austin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A connected initiative addressing the full spectrum of child and youth wellbeing in Austin — directly linked to the housing and homelessness crisis. When families lose housing, children lose everything: health, safety, education, and hope.
          </p>

          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3" data-testid="kids-homelessness-link">
            <p className="text-xs font-semibold flex items-center gap-1 text-amber-800 dark:text-amber-300 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" /> The Connection: Youth Homelessness × Child Wellbeing
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              934 youth are homeless in Austin (quadrupled since 2020). Children in unstable housing are 2x more likely to face hunger, 3x more likely to have behavioral health issues, and 4x more likely to experience developmental delays. These initiatives are inseparable.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { title: "Healthy Kids", icon: Heart, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30", stats: ["2,000+ health screenings", "Maternal health support", "Nutrition & food access", "Telehealth for families"] },
              { title: "Happy Kids", icon: Smile, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", stats: ["SEL curriculum (WholeMind)", "Neurodivergent support", "Family stability services", "Community belonging"] },
              { title: "Safe Kids", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", stats: ["SafeReport protection", "Mandatory reporter tools", "School safety (ISSS)", "Data security protocols"] },
            ].map((pillar) => (
              <div key={pillar.title} className={`p-2 rounded-md ${pillar.bg}`} data-testid={`pillar-${pillar.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <pillar.icon className={`w-4 h-4 mx-auto mb-1 ${pillar.color}`} />
                <p className={`text-xs font-bold text-center mb-1 ${pillar.color}`}>{pillar.title}</p>
                {pillar.stats.map((s) => (
                  <p key={s} className="text-xs text-muted-foreground leading-relaxed">• {s}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Network className="w-3.5 h-3.5" /> Ecosystem Platforms Activated
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { platform: "ISSS", role: "School-based wraparound — identifies at-risk youth, coordinates services" },
                { platform: "WholeMind Learning", role: "SEL development, adaptive learning, career pathways for youth" },
                { platform: "Perfectly Different", role: "Neurodivergent support — 1 in 5 children need accommodation" },
                { platform: "SafeReport", role: "Anonymous safety reporting, mandatory reporter workflow" },
                { platform: "Whole-Person Health", role: "PHQ-9, GAD-7 screenings — catches what ER visits miss" },
                { platform: "Black Maternal Health", role: "Perinatal care, postpartum support — 3x mortality crisis" },
                { platform: "Sankofa Health Network", role: "Culturally responsive health content for families" },
                { platform: "LifeBridge", role: "Housing navigation, benefits enrollment, family stabilization" },
                { platform: "PillScheduler", role: "Medication management for children with chronic conditions" },
              ].map((p) => (
                <div key={p.platform} className="p-1.5 rounded bg-muted/50" data-testid={`kids-platform-${p.platform.toLowerCase().replace(/\s+/g, '-')}`}>
                  <p className="text-xs font-medium">{p.platform}</p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Outcome Targets
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { metric: "Youth Served", value: "2,500+", icon: Users },
                { metric: "School Partnerships", value: "15+", icon: GraduationCap },
                { metric: "Family Stabilizations", value: "300+", icon: Home },
                { metric: "Crisis Interventions", value: "500+", icon: ShieldCheck },
              ].map((o) => (
                <div key={o.metric} className="flex items-center gap-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/30" data-testid={`kids-outcome-${o.metric.toLowerCase().replace(/\s+/g, '-')}`}>
                  <o.icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{o.value}</p>
                    <p className="text-xs text-muted-foreground">{o.metric}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-gradient-to-r from-emerald-600 to-teal-700 p-3 text-white text-center" data-testid="kids-cta">
            <p className="text-xs font-semibold mb-1">Healthy Kids + Happy Kids + Safe Kids = Thriving Austin</p>
            <p className="text-xs opacity-80">Connected to Austin Climate Initiative — housing stability is child stability</p>
          </div>
        </CardContent>
      </Card>

      {connectedPlatforms.length > 0 && (
        <Card data-testid="card-lb-connected">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Globe className="w-4 h-4" /> Connected Platforms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {connectedPlatforms.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50" data-testid={`lb-connected-${p.id}`}>
                  <HealthDot status={p.healthStatus} />
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {domainIcon(p.domain)}
                    <span className="text-sm truncate">{p.name}</span>
                  </div>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0" data-testid={`link-lb-platform-${p.id}`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-center text-muted-foreground" data-testid="text-lb-footer">
        LifeBridge within the ThriveUp Ecosystem
      </p>
    </div>
  );
}