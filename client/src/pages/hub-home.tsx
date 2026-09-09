import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Heart, Target, Rocket, Network,
  MessageCircle, Calendar, Compass, TrendingUp,
  Sparkles, Users, Map, Wrench,
  AlertCircle, Clock, ChevronRight, Pencil,
  LayoutGrid, School, Globe, Shield,
  Building2, Stethoscope, HandshakeIcon, Cpu, ArrowRight,
} from "lucide-react";
import { SystemPulse } from "@/components/system-pulse";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useHubRole, HubOnramp, ROLE_LABELS } from "@/lib/hub-role";
import { useCurrentOrgId } from "@/hooks/use-current-org";

// Seven cross-sector front doors — organizations enter through the lane that
// matches their mission; the underlying coordination backbone is shared.
const GATEWAY_CARDS = [
  {
    label: "Nonprofits & CBOs",
    desc: "Referrals, grants, capacity, outcome reporting",
    href: "/for-nonprofits",
    icon: Building2,
    bg: "from-violet-500 to-purple-600",
  },
  {
    label: "Schools & Workforce",
    desc: "Transitions, pathways, apprenticeships, family",
    href: "/academy",
    icon: School,
    bg: "from-amber-500 to-orange-600",
  },
  {
    label: "Healthcare & Care",
    desc: "Navigation, CHW tools, SDOH, screeners",
    href: "/health-network",
    icon: Stethoscope,
    bg: "from-rose-500 to-pink-600",
  },
  {
    label: "Cities & Agencies",
    desc: "Population data, equity, program coordination",
    href: "/community-impact",
    icon: Globe,
    bg: "from-blue-600 to-indigo-700",
  },
  {
    label: "Justice & Safety",
    desc: "Reentry, diversion, crisis, victim services",
    href: "/justice",
    icon: Shield,
    bg: "from-emerald-500 to-teal-600",
  },
  {
    label: "Funders & Evaluators",
    desc: "Evidence, fidelity, grants, accountability",
    href: "/funder-dashboard",
    icon: Target,
    bg: "from-orange-500 to-amber-600",
  },
  {
    label: "Grow & Connect",
    desc: "Coalition, impact, partners, ecosystem",
    href: "/hub/connect",
    icon: Network,
    bg: "from-teal-600 to-cyan-700",
  },
];

const IMPLEMENTATION_MODES = [
  {
    icon: Cpu,
    label: "Self-Service",
    desc: "Use the full platform independently.",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40",
  },
  {
    icon: Compass,
    label: "Guided",
    desc: "TCAF configures and trains alongside you.",
    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40",
  },
  {
    icon: HandshakeIcon,
    label: "TCAF-Managed",
    desc: "Delegate coordination to TCAF's workforce.",
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40",
  },
];

const QUICK_TOOLS = [
  { label: "Sparky AI",     href: "/sparky",        icon: MessageCircle, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40" },
  { label: "This Week",     href: "/this-week",     icon: Calendar,      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40" },
  { label: "Navigator",     href: "/navigator",     icon: Compass,       color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
  { label: "Chainweb",      href: "/chainweb",      icon: Network,       color: "text-teal-600 bg-teal-100 dark:bg-teal-900/40" },
  { label: "Live Grants",   href: "/this-week",     icon: Target,        color: "text-orange-600 bg-orange-100 dark:bg-orange-900/40" },
  { label: "Impact",        href: "/impact",        icon: TrendingUp,    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" },
  { label: "Community",     href: "/community",     icon: Users,         color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40" },
  { label: "Coverage Map",  href: "/coverage",      icon: Map,           color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40" },
  { label: "Workbench",     href: "/workbench",     icon: Wrench,        color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HubAlerts({ isAuthenticated, canOpenGrantHub }: { isAuthenticated: boolean; canOpenGrantHub: boolean }) {
  const { data: grants, isError, refetch } = useQuery<any[]>({
    queryKey: ["/api/grants"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    select: (data: any) => {
      const list = Array.isArray(data) ? data : (data?.grants ?? []);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 14);
      return list
        .filter((g: any) => g.deadline && new Date(g.deadline) <= cutoff && new Date(g.deadline) >= new Date())
        .slice(0, 3);
    },
  });

  if (!isAuthenticated) return null;

  if (isError) {
    return (
      <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300" role="status">
        <p className="font-semibold">Deadline reminders are temporarily unavailable.</p>
        <button type="button" onClick={() => refetch()} className="mt-1 font-semibold underline">Try again</button>
        {" · "}
        <Link href={canOpenGrantHub ? "/grants" : "/this-week"} className="font-semibold underline">Open grants</Link>
      </div>
    );
  }

  if (!grants?.length) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Needs Attention
        </h2>
      </div>
      <div className="space-y-2">
        {grants.map((g: any, index: number) => {
          const daysLeft = Math.ceil(
            (new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const grantId = g.id === undefined || g.id === null ? null : String(g.id);
          const title = g.title ?? g.name ?? "Grant opportunity";
          const href = canOpenGrantHub && grantId ? `/grants/${grantId}` : canOpenGrantHub ? "/grants" : "/this-week";
          return (
            <Link key={`deadline-${grantId ?? title}-${index}`} href={href}>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-amber-400/60 transition-all">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="font-semibold text-sm text-foreground leading-snug line-clamp-1">{title}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Due in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MyWork({ isAuthenticated, canOpenGrantHub }: { isAuthenticated: boolean; canOpenGrantHub: boolean }) {
  const { orgId } = useCurrentOrgId();
  const { data: conversations, isLoading: conversationsLoading, isError: conversationsError, refetch: refetchConversations } = useQuery<any[]>({
    queryKey: ["/api/navigator/conversations"],
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    select: (data: any) => (Array.isArray(data) ? data : []).slice(0, 2),
  });

  const { data: grants, isLoading: grantsLoading, isError: grantsError, refetch: refetchGrants } = useQuery<any[]>({
    queryKey: ["/api/me/grants/tracked"],
    enabled: isAuthenticated && !!orgId,
    staleTime: 5 * 60 * 1000,
    select: (data: any) => (data?.tracked ?? []).map((row: any) => ({
      ...row.grant,
      status: row.tracking?.status,
    })).slice(0, 2),
  });

  const hasWork = (conversations?.length ?? 0) > 0 || (grants?.length ?? 0) > 0;

  if (!isAuthenticated) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Sign in to unlock your journey</p>
          <p className="text-muted-foreground text-xs mt-0.5">Save progress, track grants, access tools</p>
        </div>
        <Link href="/api/login">
          <span className="text-xs font-bold text-primary whitespace-nowrap">Sign In →</span>
        </Link>
      </div>
    );
  }

  if (conversationsLoading || grantsLoading) return null;

  if (conversationsError || grantsError) {
    return (
      <section aria-labelledby="my-work-heading" className="rounded-2xl border border-amber-200/70 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/30">
        <h2 id="my-work-heading" className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
          My Work
        </h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">Some saved work is temporarily unavailable.</p>
        <button
          type="button"
          onClick={() => {
            if (conversationsError) void refetchConversations();
            if (grantsError) void refetchGrants();
          }}
          className="mt-2 text-xs font-semibold text-amber-800 underline dark:text-amber-200"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!hasWork) {
    return (
      <section aria-labelledby="my-work-heading" className="rounded-2xl border border-border bg-card p-4">
        <h2 id="my-work-heading" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          My Work
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Saved Navigator sessions and tracked grants{orgId ? "" : " for a selected organization"} will appear here.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <Link href="/navigator" className="rounded-lg border border-border px-3 py-2 hover:bg-muted">Open Navigator</Link>
          <Link href={canOpenGrantHub ? "/grants" : "/this-week"} className="rounded-lg border border-border px-3 py-2 hover:bg-muted">Browse grants</Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        My Work
      </h2>
      <div className="space-y-2">
         {(conversations ?? []).map((c: any, index: number) => (
           <Link key={`conversation-${c.id == null ? "unknown" : c.id}-${index}`} href="/navigator">
            <div className="bg-card border border-border/60 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-snug line-clamp-1">
                  {c.title ?? "Navigator session"}
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Navigator AI</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            </div>
          </Link>
        ))}
         {(grants ?? []).map((g: any, index: number) => {
           const grantId = g.id === undefined || g.id === null ? null : String(g.id);
           const title = g.title ?? g.name ?? "Grant";
           const href = canOpenGrantHub && grantId ? `/grants/${grantId}` : canOpenGrantHub ? "/grants" : "/this-week";
           return (
           <Link key={`grant-${grantId ?? title}-${index}`} href={href}>
            <div className="bg-card border border-border/60 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-snug line-clamp-1">
                   {title}
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">{g.status ?? "In progress"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            </div>
           </Link>
         );})}
      </div>
    </div>
  );
}

export default function HubHomePage() {
  const { user, isAuthenticated } = useAuth();
  const { role, onboarded, setRole, dismiss, clearRole } = useHubRole();
  const canOpenGrantHub = isAuthenticated && (role === "admin" || user?.isTcafAdmin === true);
  const name = (user as any)?.firstName || (user as any)?.name?.split(" ")[0] || null;
  const quickTools = QUICK_TOOLS.map((tool) =>
    tool.label === "Live Grants"
      ? { ...tool, href: canOpenGrantHub ? "/grants" : "/this-week" }
      : tool
  );

  return (
    <div className="min-h-full bg-muted/30 dark:bg-background">
      {!onboarded && (
        <HubOnramp onSelect={setRole} onDismiss={dismiss} />
      )}

      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-5 pt-7 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">TCAF + ThriveUp</span>
          </div>
          {role && (
            <button
              onClick={clearRole}
              className="flex items-center gap-1 text-white/70 hover:text-white/90 transition-colors text-[11px]"
              data-testid="button-change-role"
              title="Change your role"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{ROLE_LABELS[role]}</span>
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}{name ? `, ${name}` : ""}
        </h1>
        <p className="text-white/70 text-sm mt-1">Nationwide community coordination platform</p>
      </div>

      <div className="px-4 py-5 pb-24 space-y-6">
         <HubAlerts isAuthenticated={isAuthenticated} canOpenGrantHub={canOpenGrantHub} />

        <section aria-labelledby="start-here-heading" className="rounded-2xl border border-primary/15 bg-card p-4 shadow-sm">
          <h2 id="start-here-heading" className="text-base font-bold text-foreground">
            Start with what you need
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            ThriveUp helps people and partners move from understanding to action. Start where you are, then carry what you learn into practical resources, learning, funding, and collaboration.
          </p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Three steps from insight to action">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" aria-hidden="true">1</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Understand</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Ask a question or explore trusted community context.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" aria-hidden="true">2</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Act</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Choose a resource, pathway, or partner next step.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" aria-hidden="true">3</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Sustain</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Keep follow-up, learning, and community work connected.</p>
              </div>
            </li>
          </ol>
        </section>

        <section aria-labelledby="platform-hubs-heading">
          <h2 id="platform-hubs-heading" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Enter by sector
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {GATEWAY_CARDS.map(card => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} aria-label={`${card.label}: ${card.desc}`}>
                  <div
                    className={cn(
                      "relative rounded-2xl p-4 h-[120px] flex flex-col justify-between cursor-pointer transition-all active:scale-[0.97] shadow-sm bg-gradient-to-br",
                      card.bg
                    )}
                    data-testid={`gateway-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-7 h-7 text-white/90" aria-hidden="true" />
                    <div>
                      <h3 className="text-white font-bold text-xs leading-snug">{card.label}</h3>
                      <p className="text-white/65 text-[10px] mt-0.5 leading-snug">{card.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Three implementation modes — visible at the org hub level */}
        <section aria-labelledby="impl-modes-heading" className="rounded-2xl border border-border bg-card p-4">
          <h2 id="impl-modes-heading" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            How TCAF can help
          </h2>
          <div className="space-y-2">
            {IMPLEMENTATION_MODES.map(mode => {
              const Icon = mode.icon;
              return (
                <div key={mode.label} className="flex items-start gap-3" data-testid={`impl-mode-${mode.label.toLowerCase()}`}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", mode.color)}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="font-semibold text-sm text-foreground leading-snug">{mode.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/for-nonprofits" className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3 hover:underline">
            Learn how to work with TCAF <ArrowRight className="w-3 h-3" />
          </Link>
        </section>

        <SystemPulse />

        <section aria-labelledby="quick-access-heading">
          <h2 id="quick-access-heading" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Quick Access
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {quickTools.map(tool => {
              const Icon = tool.icon;
              return (
                <Link key={tool.label} href={tool.href}>
                  <div
                    className="flex flex-col items-center gap-2 cursor-pointer w-16 flex-shrink-0"
                    data-testid={`quick-tool-${tool.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", tool.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">
                      {tool.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

         <MyWork isAuthenticated={isAuthenticated} canOpenGrantHub={canOpenGrantHub} />
      </div>
    </div>
  );
}
