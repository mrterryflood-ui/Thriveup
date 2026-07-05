import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, Target, Rocket, Network, Music2, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PulseData {
  serve:    { screenings: number; applications: number; justiceReferrals: number; reentryPlans: number };
  fund:     { openOpportunities: number; inPipeline: number };
  grow:     { certificates: number; enrollments: number };
  connect:  { partners: number; referrals: number; mous: number };
  crossHub: { outcomesTracked: number };
  updatedAt: string;
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const HUB_NODES = [
  {
    key: "serve",   label: "Serve",   href: "/hub/serve",   Icon: Heart,   ring: "ring-emerald-400",
    bg: "bg-emerald-500",   pill: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    stat: (d: PulseData) => ({ value: fmt(d.serve.screenings + d.serve.applications), label: "people reached" }),
    sub:  (d: PulseData) => `${fmt(d.serve.reentryPlans)} reentry · ${fmt(d.serve.justiceReferrals)} justice`,
  },
  {
    key: "fund",    label: "Fund",    href: "/hub/fund",    Icon: Target,  ring: "ring-amber-400",
    bg: "bg-amber-500",    pill: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    stat: (d: PulseData) => ({ value: fmt(d.fund.openOpportunities), label: "open opportunities" }),
    sub:  (d: PulseData) => `${fmt(d.fund.inPipeline)} proposals in pipeline`,
  },
  {
    key: "grow",    label: "Grow",    href: "/hub/grow",    Icon: Rocket,  ring: "ring-blue-400",
    bg: "bg-blue-600",     pill: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    stat: (d: PulseData) => ({ value: fmt(d.grow.certificates), label: "credentials issued" }),
    sub:  (d: PulseData) => `${fmt(d.grow.enrollments)} active learners`,
  },
  {
    key: "connect", label: "Connect", href: "/hub/connect", Icon: Network, ring: "ring-teal-400",
    bg: "bg-teal-600",     pill: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",
    stat: (d: PulseData) => ({ value: fmt(d.connect.partners), label: "active partners" }),
    sub:  (d: PulseData) => `${fmt(d.connect.referrals)} referrals · ${fmt(d.connect.mous)} MOUs`,
  },
];

function buildFlows(d: PulseData) {
  return [
    {
      from: "Serve", to: "Fund",
      signal: `${fmt(d.serve.screenings + d.serve.applications)} people reached → documented outcomes available as proposal evidence`,
    },
    {
      from: "Grow", to: "Serve",
      signal: `${fmt(d.grow.certificates)} credentials issued → workforce-ready graduates entering employment tracking`,
    },
    {
      from: "Fund", to: "Serve",
      signal: `${fmt(d.fund.inPipeline)} proposals in pipeline → direct service capacity if awarded`,
    },
    {
      from: "Connect", to: "All",
      signal: `${fmt(d.connect.referrals)} coordinated referrals · ${fmt(d.connect.partners)} partner orgs aligned`,
    },
  ];
}

export function SystemPulse() {
  const { data, isLoading, error, refetch } = useQuery<PulseData>({
    queryKey: ["/api/system/pulse"],
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden" data-testid="system-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Music2 className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground">Live system — nothing operates alone</span>
        </div>
        {data && (
          <button
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-refresh-pulse"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Reading system…
        </div>
      )}

      {error && (
        <div className="py-4 px-4 text-xs text-muted-foreground text-center">
          Pulse temporarily unavailable
        </div>
      )}

      {data && (
        <>
          {/* Hub stat cards */}
          <div className="grid grid-cols-2 gap-2 p-3">
            {HUB_NODES.map(({ key, label, href, Icon, bg, pill, stat, sub }) => {
              const { value, label: statLabel } = stat(data);
              const subText = sub(data);
              return (
                <Link key={key} href={href}>
                  <div
                    className={cn("rounded-xl border p-3 cursor-pointer hover:shadow-sm transition-all active:scale-[0.97]", pill)}
                    data-testid={`pulse-hub-${key}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", bg)}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-foreground">{label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground leading-none">{value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{statLabel}</p>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-snug">{subText}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Live data flows */}
          <div className="border-t border-border/40 px-3 pb-3 pt-2 space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Live data flows between sections
            </p>
            {buildFlows(data).map((f) => (
              <div key={`${f.from}-${f.to}`} className="flex items-start gap-1.5 text-[10px]">
                <span className="font-semibold text-foreground shrink-0">{f.from}</span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <span className="font-semibold text-foreground shrink-0">{f.to}</span>
                <span className="text-muted-foreground leading-snug">— {f.signal}</span>
              </div>
            ))}
            {data.crossHub.outcomesTracked > 0 && (
              <div className="text-[10px] text-muted-foreground pt-0.5 border-t border-border/30 mt-1.5">
                <span className="font-semibold text-foreground">{fmt(data.crossHub.outcomesTracked)}</span> outcomes tracked across all hubs
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
