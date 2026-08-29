import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type HubRole } from "@/lib/hub-role";
import { IntegrationInvitation, type ItiSurface } from "@/components/integration-invitation";

export interface HubCardDef {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href: string;
  tag: string;
  variant?: "hero" | "tool";
  color?: string;
  badge?: string;
  authOnly?: boolean;
  roles?: HubRole[];
}

const HERO_BG: Record<string, string> = {
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  teal:    "bg-teal-600 hover:bg-teal-700",
  green:   "bg-green-600 hover:bg-green-700",
  amber:   "bg-amber-500 hover:bg-amber-600",
  orange:  "bg-orange-600 hover:bg-orange-700",
  blue:    "bg-blue-600 hover:bg-blue-700",
  indigo:  "bg-indigo-600 hover:bg-indigo-700",
  violet:  "bg-violet-600 hover:bg-violet-700",
  rose:    "bg-rose-600 hover:bg-rose-700",
  slate:   "bg-slate-600 hover:bg-slate-700",
  purple:  "bg-purple-600 hover:bg-purple-700",
  cyan:    "bg-cyan-600 hover:bg-cyan-700",
  sky:     "bg-sky-600 hover:bg-sky-700",
  red:     "bg-red-600 hover:bg-red-700",
  pink:    "bg-pink-600 hover:bg-pink-700",
};

const ICON_BG: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  teal:    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  green:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  amber:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  orange:  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  blue:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  indigo:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  violet:  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  rose:    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  slate:   "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  purple:  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  cyan:    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  sky:     "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  red:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pink:    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

function heroBg(color?: string) {
  if (!color) return HERO_BG.slate;
  return HERO_BG[color] ?? color;
}

function iconBg(color?: string) {
  if (!color) return ICON_BG.slate;
  return ICON_BG[color] ?? "bg-muted text-muted-foreground";
}

interface HubShellProps {
  title: string;
  subtitle?: string;
  headerGradient: string;
  chips: string[];
  cards: HubCardDef[];
  isAuthenticated?: boolean;
  role?: HubRole | null;
  itiSurface?: ItiSurface;
  itiPrompt?: string;
  itiContext?: string;
  itiRoleTags?: string[];
  extra?: ReactNode;
}

export function HubShell({
  title, subtitle, headerGradient, chips, cards,
  isAuthenticated = false, role, itiSurface,
  itiPrompt, itiContext, itiRoleTags, extra,
}: HubShellProps) {
  const [activeChip, setActiveChip] = useState(chips[0] ?? "All");

  const visible = cards.filter(c => {
    if (c.authOnly && !isAuthenticated) return false;
    if (c.roles && (!role || !c.roles.includes(role))) return false;
    if (!activeChip || activeChip === chips[0]) return true;
    return c.tag === activeChip;
  });

  const heroes = visible.filter(c => c.variant === "hero");
  const tools  = visible.filter(c => c.variant !== "hero");

  return (
    <div className="min-h-full bg-muted/30 dark:bg-background">
      <div className={cn("bg-gradient-to-br px-5 pt-6 pb-7", headerGradient)}>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-white/80 text-sm mt-1">{subtitle}</p>}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {chips.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={cn(
                "flex-shrink-0 min-h-11 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                activeChip === chip
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              data-testid={`chip-${chip.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 pb-28 space-y-4">
        {heroes.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {heroes.map(card => <HeroCard key={`${card.href}-${card.title}`} card={card} />)}
          </div>
        )}

        {tools.length > 0 && (
          <div>
            {heroes.length > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 mt-2">
                All Tools
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {tools.map(card => <ToolCard key={`${card.href}-${card.title}`} card={card} />)}
            </div>
          </div>
        )}
        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card px-5 py-8 text-center" data-testid="hub-empty-state">
            <p className="font-semibold">No tools match this view yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try another filter or view all available tools.</p>
            <button
              type="button"
              onClick={() => setActiveChip(chips[0] ?? "All")}
              className="mt-4 min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Show all tools
            </button>
          </div>
        )}

        {itiSurface && (
          <div className="pt-2">
            <IntegrationInvitation
              surface={itiSurface}
              surfaceContext={itiContext}
              prompt={itiPrompt}
              suggestedRoleTags={itiRoleTags}
            />
          </div>
        )}

        {extra}
      </div>
    </div>
  );
}

function HeroCard({ card }: { card: HubCardDef }) {
  const Icon = card.icon;
  return (
    <Link href={card.href}>
      <div
        className={cn(
          "relative rounded-2xl p-4 h-[130px] flex flex-col justify-between cursor-pointer transition-all active:scale-[0.97] shadow-sm",
          heroBg(card.color)
        )}
        data-testid={`hero-card-${card.title.toLowerCase().replace(/\W+/g, "-")}`}
      >
        {card.badge && (
          <span className="absolute top-2.5 right-2.5 text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
            {card.badge}
          </span>
        )}
        <Icon className="w-8 h-8 text-white/90" />
        <div>
          <p className="text-white font-bold text-sm leading-snug">{card.title}</p>
          {card.subtitle && (
            <p className="text-white/70 text-[11px] mt-0.5 leading-snug">{card.subtitle}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ToolCard({ card }: { card: HubCardDef }) {
  const Icon = card.icon;
  return (
    <Link href={card.href}>
      <div
        className="bg-card border border-border/60 rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.97] h-full"
        data-testid={`tool-card-${card.title.toLowerCase().replace(/\W+/g, "-")}`}
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", iconBg(card.color))}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[13px] text-foreground leading-snug">{card.title}</p>
          {card.subtitle && (
            <p className="text-muted-foreground text-[11px] mt-0.5 leading-snug line-clamp-2">
              {card.subtitle}
            </p>
          )}
        </div>
        {card.badge && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 w-fit">
            {card.badge}
          </Badge>
        )}
      </div>
    </Link>
  );
}
