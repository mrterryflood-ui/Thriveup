import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Music2, Heart, Target, Rocket, Network, Loader2 } from "lucide-react";

type Hub = "serve" | "fund" | "grow" | "connect";

interface PulseData {
  serve:    { screenings: number; applications: number; justiceReferrals: number; reentryPlans: number };
  fund:     { openOpportunities: number; inPipeline: number };
  grow:     { certificates: number; enrollments: number };
  connect:  { partners: number; referrals: number; mous: number };
  crossHub: { outcomesTracked: number };
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface HubMeta {
  label: string;
  icon: typeof Heart;
  gradient: string;
  iconBg: string;
  stripBg: string;
  role: string;
  href: string;
  liveFeeds: (d: PulseData) => { to: string; signal: string }[];
  liveReceives: (d: PulseData) => string[];
}

const HUB_META: Record<Hub, HubMeta> = {
  serve: {
    label: "Serve People", icon: Heart, href: "/hub/serve",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    stripBg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    role: "Where community members receive services, screenings, and navigation — the frontline.",
    liveFeeds: (d) => [
      { to: "Get Funded",  signal: `${fmt(d.serve.screenings + d.serve.applications)} people reached → documented outcomes available as proposal evidence` },
      { to: "Grow",        signal: `${fmt(d.serve.reentryPlans)} reentry plans active → workforce readiness referrals` },
      { to: "Connect",     signal: `${fmt(d.serve.justiceReferrals)} justice referrals → partner coordination` },
    ],
    liveReceives: (d) => [
      `Grow → ${fmt(d.grow.certificates)} credentials issued → employment outcomes trackable here`,
      `Fund → ${fmt(d.fund.inPipeline)} proposals in pipeline → direct resources if awarded`,
      `Connect → ${fmt(d.connect.referrals)} referrals coordinated from partner orgs`,
    ],
  },
  fund: {
    label: "Get Funded", icon: Target, href: "/hub/fund",
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    stripBg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    role: "The evidence and resources layer — turns service outcomes into sustainable funding.",
    liveFeeds: (d) => [
      { to: "Serve",       signal: `${fmt(d.fund.inPipeline)} proposals in pipeline → direct service capacity if awarded` },
      { to: "Grow",        signal: `${fmt(d.fund.openOpportunities)} open opportunities include workforce training grants` },
      { to: "Connect",     signal: `Coalition strength data available for organizational capacity narratives` },
    ],
    liveReceives: (d) => [
      `Serve → ${fmt(d.serve.screenings + d.serve.applications)} people reached — documented evidence for next proposal`,
      `Connect → ${fmt(d.connect.partners)} active partners — coalition capacity available to cite`,
      `Grow → ${fmt(d.grow.certificates)} credentials issued — workforce ROI for WIOA/DOL funders`,
    ],
  },
  grow: {
    label: "Grow", icon: Rocket, href: "/hub/grow",
    gradient: "from-blue-600 to-indigo-700",
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    stripBg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    role: "Where skills are built and credentials earned — the workforce readiness engine.",
    liveFeeds: (d) => [
      { to: "Serve",       signal: `${fmt(d.grow.certificates)} credentials issued → employment outcomes tracked at 30/90/180/365 days` },
      { to: "Get Funded",  signal: `${fmt(d.grow.enrollments)} active learners → workforce ROI data for grant proposals` },
      { to: "Connect",     signal: `${fmt(d.grow.certificates)} credential holders → employer network and trade mentor pipeline` },
    ],
    liveReceives: (d) => [
      `Serve → ${fmt(d.serve.reentryPlans)} reentry plans active — workforce readiness referrals incoming`,
      `Fund → ${fmt(d.fund.inPipeline)} proposals in pipeline — some fund training programs`,
      `Connect → ${fmt(d.connect.partners)} partner orgs — employer network and mentors`,
    ],
  },
  connect: {
    label: "Connect", icon: Network, href: "/hub/connect",
    gradient: "from-teal-600 to-cyan-700",
    iconBg: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    stripBg: "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800",
    role: "The coordination layer — aligns partners, amplifies impact, and holds the coalition together.",
    liveFeeds: (d) => [
      { to: "Serve",       signal: `${fmt(d.connect.referrals)} coordinated referrals → shared service delivery` },
      { to: "Get Funded",  signal: `${fmt(d.connect.partners)} active partners · ${fmt(d.connect.mous)} MOUs → organizational capacity for proposals` },
      { to: "Grow",        signal: `${fmt(d.connect.partners)} partner orgs → employer network and trade mentor connections` },
    ],
    liveReceives: (d) => [
      `Serve → ${fmt(d.serve.screenings + d.serve.applications)} people reached — community outcomes for partner storytelling`,
      `Fund → ${fmt(d.fund.inPipeline)} proposals in pipeline — funded initiatives attract more partners`,
      `Grow → ${fmt(d.grow.certificates)} credentials — pathways to offer partner org members`,
    ],
  },
};

const ALL_HUBS: { key: Hub; label: string; icon: typeof Heart; href: string }[] = [
  { key: "serve",   label: "Serve",   icon: Heart,   href: "/hub/serve" },
  { key: "fund",    label: "Fund",    icon: Target,  href: "/hub/fund" },
  { key: "grow",    label: "Grow",    icon: Rocket,  href: "/hub/grow" },
  { key: "connect", label: "Connect", icon: Network, href: "/hub/connect" },
];

interface OrchestraStripProps {
  hub: Hub;
}

export function OrchestraStrip({ hub }: OrchestraStripProps) {
  const meta = HUB_META[hub];
  const Icon = meta.icon;

  const { data, isLoading } = useQuery<PulseData>({
    queryKey: ["/api/system/pulse"],
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

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

      {/* Hub flow nodes — this hub highlighted */}
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
                    : "bg-background border border-border/60 text-muted-foreground hover:text-foreground"
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

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading live signals…
        </div>
      )}

      {/* Live data flows out */}
      {data && (
        <>
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Live — this section feeds →
            </p>
            <div className="space-y-1.5">
              {meta.liveFeeds(data).map((f) => (
                <div key={f.to} className="flex items-start gap-2 text-xs">
                  <span className="font-semibold text-foreground shrink-0">{f.to}</span>
                  <span className="text-muted-foreground">— {f.signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/30 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              ← And receives from the system
            </p>
            <div className="space-y-0.5">
              {meta.liveReceives(data).map((r) => (
                <p key={r} className="text-xs text-muted-foreground">{r}</p>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Fallback static when no data yet */}
      {!data && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Live signals unavailable — cross-hub data is being collected.
        </p>
      )}
    </div>
  );
}
