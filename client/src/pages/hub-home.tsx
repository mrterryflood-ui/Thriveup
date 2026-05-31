import { Link } from "wouter";
import {
  Heart, Target, Rocket, MoreHorizontal,
  MessageCircle, Calendar, Compass, TrendingUp,
  Sparkles, Users, Map, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const GATEWAY_CARDS = [
  {
    label: "Serve People",
    desc: "Benefits, Foster Youth, Justice, Health",
    href: "/hub/serve",
    icon: Heart,
    bg: "from-emerald-500 to-teal-600",
  },
  {
    label: "Get Funded",
    desc: "Grants, RFP tools, Win-rate analytics",
    href: "/hub/fund",
    icon: Target,
    bg: "from-amber-500 to-orange-600",
  },
  {
    label: "Grow",
    desc: "Trade Sims, Workforce, Academy, AI",
    href: "/hub/grow",
    icon: Rocket,
    bg: "from-blue-600 to-indigo-700",
  },
  {
    label: "More",
    desc: "Partners, Coverage, Impact, About",
    href: "/hub/more",
    icon: MoreHorizontal,
    bg: "from-slate-600 to-slate-700",
  },
];

const QUICK_TOOLS = [
  { label: "Sparky AI",     href: "/sparky",        icon: MessageCircle, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40" },
  { label: "This Week",     href: "/this-week",     icon: Calendar,      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40" },
  { label: "Navigator",     href: "/navigator",     icon: Compass,       color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
  { label: "Live Grants",   href: "/grants",        icon: Target,        color: "text-orange-600 bg-orange-100 dark:bg-orange-900/40" },
  { label: "Impact",        href: "/impact",        icon: TrendingUp,    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" },
  { label: "Community",     href: "/community",     icon: Users,         color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40" },
  { label: "Coverage Map",  href: "/coverage",      icon: Map,           color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40" },
  { label: "Workbench",     href: "/workbench",     icon: BarChart3,     color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HubHomePage() {
  const { user, isAuthenticated } = useAuth();
  const name = (user as any)?.firstName || (user as any)?.name?.split(" ")[0] || null;

  return (
    <div className="min-h-full bg-muted/30 dark:bg-background">
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-5 pt-7 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-white/80" />
          <span className="text-white/80 text-sm font-medium">ThriveUp Platform</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}{name ? `, ${name}` : ""}
        </h1>
        <p className="text-white/70 text-sm mt-1">Central Texas · Powered by ThriveUp</p>
      </div>

      <div className="px-4 py-5 pb-24 space-y-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Platform Hubs
          </p>
          <div className="grid grid-cols-2 gap-3">
            {GATEWAY_CARDS.map(card => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <div
                    className={cn(
                      "relative rounded-2xl p-4 h-[130px] flex flex-col justify-between cursor-pointer transition-all active:scale-[0.97] shadow-sm bg-gradient-to-br",
                      card.bg
                    )}
                    data-testid={`gateway-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-8 h-8 text-white/90" />
                    <div>
                      <p className="text-white font-bold text-sm leading-snug">{card.label}</p>
                      <p className="text-white/65 text-[11px] mt-0.5 leading-snug">{card.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Quick Access
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {QUICK_TOOLS.map(tool => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href}>
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
        </div>

        {!isAuthenticated && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Sign in to unlock your journey</p>
              <p className="text-muted-foreground text-xs mt-0.5">Save progress, access tools, track grants</p>
            </div>
            <Link href="/api/login">
              <span className="text-xs font-bold text-primary whitespace-nowrap">Sign In →</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
