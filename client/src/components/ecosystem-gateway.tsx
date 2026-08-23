import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GatewayPlatform {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  href: string;
  external?: boolean;
  color: string;
  tags: string[];
  highlight?: boolean;
}

const ALL_PLATFORMS: GatewayPlatform[] = [
  {
    id: "lifebridge",
    name: "LifeBridge",
    tagline: "Virtual 211 · 20,670+ resources for housing, food, crisis, and SDOH",
    emoji: "🏠",
    href: "/lifebridge",
    color: "border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
    tags: ["housing", "food", "crisis", "benefits", "sdoh", "employment"],
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    tagline: "Maternal health · behavioral health · community wellness",
    emoji: "❤️",
    href: "/health-wellness",
    color: "border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800",
    tags: ["health", "maternal", "behavioral", "women", "wellness"],
  },
  {
    id: "m2c",
    name: "M2C Transition",
    tagline: "Mission-to-civilian veteran career transition platform",
    emoji: "🎖️",
    href: "/mos-translator",
    color: "border-slate-300 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-700",
    tags: ["veterans", "military", "career", "transition", "workforce"],
  },
  {
    id: "rplice",
    name: "RPLICE",
    tagline: "CFIR · RE-AIM · EPIS · Implementation science & outcome measurement",
    emoji: "🔬",
    href: "/rplice-tools",
    color: "border-violet-300 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-800",
    tags: ["evaluation", "grants", "research", "outcomes", "fidelity"],
  },
  {
    id: "mce",
    name: "MCE",
    tagline: "656,794 federal contracts · minority business lifecycle · 8(a) certification",
    emoji: "💼",
    href: "/mce-contracts",
    color: "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800",
    tags: ["business", "contracts", "minority", "federal", "grants"],
  },
  {
    id: "isss",
    name: "ISSS",
    tagline: "K-12 implementation science · MTSS · IEP · school system support",
    emoji: "📚",
    href: "https://implementationineducation.com",
    external: true,
    color: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800",
    tags: ["education", "youth", "k12", "school", "families"],
  },
  {
    id: "perfectly-different",
    name: "Perfectly Different",
    tagline: "Neurodiversity-affirming support · autism · ADHD · IEP assistance",
    emoji: "🌈",
    href: "https://neurodifferentassistant.app",
    external: true,
    color: "border-pink-300 bg-pink-50 dark:bg-pink-950/30 dark:border-pink-800",
    tags: ["neurodiversity", "disability", "autism", "education", "families"],
  },
  {
    id: "safereport",
    name: "SafeReport",
    tagline: "Mandatory reporting · incident compliance · child welfare",
    emoji: "🛡️",
    href: "https://safereports.net",
    external: true,
    color: "border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800",
    tags: ["safety", "compliance", "child-welfare", "reporting", "reentry"],
  },
  {
    id: "wph",
    name: "Whole-Person Health",
    tagline: "Behavioral health crisis support · mental wellness · 988/211 routing",
    emoji: "🧠",
    href: "/behavioral-health",
    color: "border-teal-300 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-800",
    tags: ["mental-health", "crisis", "behavioral", "substance", "wellness"],
  },
  {
    id: "chainweb",
    name: "Chainweb",
    tagline: "Regional workforce network · Dads Care 2 · fatherhood programs",
    emoji: "🔗",
    href: "/ecosystem",
    color: "border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-800",
    tags: ["workforce", "fatherhood", "community", "network", "employment"],
  },
  {
    id: "foster",
    name: "Foster Youth",
    tagline: "Aging-out toolkit · independent living · college transition support",
    emoji: "🤝",
    href: "/foster-youth-support",
    color: "border-cyan-300 bg-cyan-50 dark:bg-cyan-950/30 dark:border-cyan-800",
    tags: ["foster", "youth", "housing", "education", "transition"],
  },
  {
    id: "navigator",
    name: "Navigator AI",
    tagline: "24/7 AI guide across all 26 platforms · grants · resources · career",
    emoji: "🧭",
    href: "/navigator",
    color: "border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700",
    tags: ["all", "ai", "grants", "career", "benefits", "housing", "health"],
    highlight: true,
  },
];

interface EcosystemGatewayProps {
  context?: string[];
  maxShow?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function EcosystemGateway({
  context = [],
  maxShow = 6,
  title = "You're Connected to the Full Ecosystem",
  subtitle = "ThriveUp is one instrument in a 26-platform orchestra. Every platform serves a different need — and they all share data so nothing falls through the cracks.",
  className = "",
}: EcosystemGatewayProps) {
  const normalizedCtx = context.map(c => c.toLowerCase());

  const scored = ALL_PLATFORMS.map(p => {
    if (p.highlight) return { ...p, score: 999 };
    const score = p.tags.filter(t => normalizedCtx.some(c => c.includes(t) || t.includes(c))).length;
    return { ...p, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score).slice(0, maxShow);

  return (
    <div className={`rounded-2xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-5 space-y-4 ${className}`} data-testid="ecosystem-gateway">
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sorted.map(p => {
          const content = (
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer ${p.color} ${p.highlight ? "ring-1 ring-blue-400 dark:ring-blue-600" : ""}`}
              data-testid={`gateway-tile-${p.id}`}
            >
              <span className="text-2xl shrink-0 mt-0.5">{p.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate">{p.name}</span>
                  {p.highlight && <Badge className="text-[10px] py-0 h-4 bg-blue-600">Central</Badge>}
                  {p.external && <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.tagline}</p>
              </div>
            </div>
          );

          return p.external ? (
            <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer">{content}</a>
          ) : (
            <Link key={p.id} href={p.href}>{content}</Link>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-1 border-t">
        <p className="text-xs text-muted-foreground">26 platforms · one mission</p>
        <Link href="/ecosystem" className="text-xs text-blue-600 hover:underline font-medium" data-testid="link-full-ecosystem">
          View full ecosystem →
        </Link>
      </div>
    </div>
  );
}
