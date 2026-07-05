import { Link } from "wouter";
import { ArrowRight, Music2, Heart, Target, Rocket, Network } from "lucide-react";

type Hub = "serve" | "fund" | "grow" | "connect";

interface HubMeta {
  label: string;
  icon: typeof Heart;
  gradient: string;
  iconBg: string;
  stripBg: string;
  role: string;
  feeds: { to: string; desc: string }[];
  receives: string[];
  href: string;
}

const HUB_META: Record<Hub, HubMeta> = {
  serve: {
    label: "Serve People", icon: Heart, href: "/hub/serve",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    stripBg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    role: "Where community members receive services, screenings, and navigation — the frontline.",
    feeds: [
      { to: "Get Funded",  desc: "Outcome data → grant reporting & funder dashboards" },
      { to: "Grow",        desc: "Skill gaps & employment readiness → training referrals" },
      { to: "Connect",     desc: "Population data → partner coordination & coalition" },
    ],
    receives: [
      "Grow → credentialed, workforce-ready clients",
      "Fund → resources that finance direct programs",
      "Connect → coordinated referrals from partner orgs",
    ],
  },
  fund: {
    label: "Get Funded", icon: Target, href: "/hub/fund",
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    stripBg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    role: "The evidence and resources layer — turns service outcomes into sustainable funding.",
    feeds: [
      { to: "Serve",       desc: "Awarded grants directly finance service delivery" },
      { to: "Grow",        desc: "Grants unlock workforce training capacity" },
      { to: "Connect",     desc: "Coalition success evidence attracts more partners" },
    ],
    receives: [
      "Serve → outcome data that makes proposals credible",
      "Connect → organizational capacity narratives",
      "Grow → workforce ROI data for WIOA and DOL grants",
    ],
  },
  grow: {
    label: "Grow", icon: Rocket, href: "/hub/grow",
    gradient: "from-blue-600 to-indigo-700",
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    stripBg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    role: "Where skills are built and credentials earned — the workforce readiness engine.",
    feeds: [
      { to: "Serve",       desc: "Credentialed, workforce-ready community members" },
      { to: "Get Funded",  desc: "Workforce ROI data for WIOA, DOL, and foundation grants" },
      { to: "Connect",     desc: "Employer partnerships and training alliances" },
    ],
    receives: [
      "Serve → skill gap referrals and enrolled learners",
      "Fund → grants that finance training programs",
      "Connect → employer network and trade mentors",
    ],
  },
  connect: {
    label: "Connect", icon: Network, href: "/hub/connect",
    gradient: "from-teal-600 to-cyan-700",
    iconBg: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    stripBg: "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800",
    role: "The coordination layer — aligns partners, amplifies impact, and holds the coalition together.",
    feeds: [
      { to: "Serve",       desc: "Coordinated partner referrals and shared service delivery" },
      { to: "Get Funded",  desc: "Coalition strength and organizational capacity for proposals" },
      { to: "Grow",        desc: "Employer network, faith orgs, and trade mentor connections" },
    ],
    receives: [
      "Serve → community outcomes for partner storytelling",
      "Fund → funded initiatives that attract more partners",
      "Grow → credential pathways to offer partner org members",
    ],
  },
};

const ALL_HUBS: { key: Hub; label: string; icon: typeof Heart; href: string }[] = [
  { key: "serve",   label: "Serve",    icon: Heart,    href: "/hub/serve" },
  { key: "fund",    label: "Fund",     icon: Target,   href: "/hub/fund" },
  { key: "grow",    label: "Grow",     icon: Rocket,   href: "/hub/grow" },
  { key: "connect", label: "Connect",  icon: Network,  href: "/hub/connect" },
];

interface OrchestraStripProps {
  hub: Hub;
}

export function OrchestraStrip({ hub }: OrchestraStripProps) {
  const meta = HUB_META[hub];
  const Icon = meta.icon;

  return (
    <div className={`rounded-2xl border p-4 mt-2 ${meta.stripBg}`} data-testid={`orchestra-strip-${hub}`}>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}>
          <Music2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
            Nothing operates alone
          </p>
          <p className="text-sm leading-snug text-foreground">{meta.role}</p>
        </div>
      </div>

      {/* Flow diagram — all 4 hubs, this one highlighted */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {ALL_HUBS.map((h, i) => {
          const HIcon = h.icon;
          const isActive = h.key === hub;
          return (
            <div key={h.key} className="flex items-center gap-1 shrink-0">
              <Link href={h.href}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${meta.gradient} text-white shadow-sm`
                    : "bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                }`} data-testid={`hub-node-${h.key}`}>
                  <HIcon className="w-3 h-3" />
                  <span>{h.label}</span>
                </div>
              </Link>
              {i < ALL_HUBS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Data flows out */}
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          This section feeds →
        </p>
        <div className="space-y-1">
          {meta.feeds.map((f) => (
            <div key={f.to} className="flex items-start gap-2 text-xs">
              <span className="font-semibold text-foreground shrink-0">{f.to}</span>
              <span className="text-muted-foreground">— {f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data flows in */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          ← And receives from
        </p>
        <div className="space-y-0.5">
          {meta.receives.map((r) => (
            <p key={r} className="text-xs text-muted-foreground">{r}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
