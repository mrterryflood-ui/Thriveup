import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, Target, Rocket, Network, Music2, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PulseData {
  status?: "available" | "degraded";
  serve:    { screenings: number | null; applications: number | null; justiceReferrals: number | null; reentryPlans: number | null };
  fund:     { openOpportunities: number | null; inPipeline: number | null };
  grow:     { certificates: number | null; enrollments: number | null };
  connect:  { partners: number | null; referrals: number | null; mous: number | null };
  crossHub: { outcomesTracked: number | null };
  updatedAt: string;
}

function fmt(n: number | null): string {
  if (n === null || n === undefined) return "Unavailable";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function addCounts(...values: Array<number | null>): number | null {
  return values.some((value) => value === null || value === undefined)
    ? null
    : values.reduce<number>((sum, value) => sum + (value as number), 0);
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Update time unavailable"
    : `Updated ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

const HUB_NODES = [
  {
    key: "serve",   label: "Serve",   href: "/hub/serve",   Icon: Heart,   ring: "ring-emerald-400",
    bg: "bg-emerald-500",   pill: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    stat: (d: PulseData) => ({ value: fmt(addCounts(d.serve.screenings, d.serve.applications)), label: "service records" }),
    sub:  (d: PulseData) => `${fmt(d.serve.reentryPlans)} reentry · ${fmt(d.serve.justiceReferrals)} justice`,
  },
  {
    key: "fund",    label: "Fund",    href: "/hub/fund",    Icon: Target,  ring: "ring-amber-400",
    bg: "bg-amber-500",    pill: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    stat: (d: PulseData) => ({ value: fmt(d.fund.openOpportunities), label: "identified opportunities" }),
    sub:  (d: PulseData) => `${fmt(d.fund.inPipeline)} proposals in pipeline`,
  },
  {
    key: "grow",    label: "Grow",    href: "/hub/grow",    Icon: Rocket,  ring: "ring-blue-400",
    bg: "bg-blue-600",     pill: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    stat: (d: PulseData) => ({ value: fmt(d.grow.certificates), label: "credentials issued" }),
    sub:  (d: PulseData) => `${fmt(d.grow.enrollments)} learner progress records`,
  },
  {
    key: "connect", label: "Connect", href: "/hub/connect", Icon: Network, ring: "ring-teal-400",
    bg: "bg-teal-600",     pill: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",
    stat: (d: PulseData) => ({ value: fmt(d.connect.partners), label: "partner records" }),
    sub:  (d: PulseData) => `${fmt(d.connect.referrals)} referrals · ${fmt(d.connect.mous)} MOUs`,
  },
];

function buildFlows(d: PulseData) {
  return [
    {
      from: "Serve", to: "Fund",
      signal: `${fmt(addCounts(d.serve.screenings, d.serve.applications))} service records → documented outcomes available as proposal evidence`,
    },
    {
      from: "Grow", to: "Serve",
      signal: `${fmt(d.grow.certificates)} credentials issued → graduates entering employment tracking`,
    },
    {
      from: "Fund", to: "Serve",
      signal: `${fmt(d.fund.inPipeline)} proposals in pipeline → direct service capacity if awarded`,
    },
    {
      from: "Connect", to: "All",
      signal: `${fmt(d.connect.referrals)} coordinated referrals · ${fmt(d.connect.partners)} partner records`,
    },
  ];
}

export function SystemPulse() {
  const { data, isLoading, error, isFetching, refetch } = useQuery<PulseData>({
    queryKey: ["/api/system/pulse"],
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden" data-testid="system-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Music2 className="w-3 h-3 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-foreground">System snapshot — sections can connect</span>
            {data && <span className="block text-[10px] text-muted-foreground mt-0.5">{formatUpdatedAt(data.updatedAt)}</span>}
          </div>
        </div>
        {(data || error) && (
          <button
            onClick={() => refetch()}
            className="min-w-8 min-h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-refresh-pulse"
            aria-label={isFetching ? "Refreshing system snapshot" : "Refresh system snapshot"}
            title="Refresh system snapshot"
            disabled={isFetching}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} aria-hidden="true" />
          </button>
        )}
      </div>
      {data?.status === "degraded" && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300" data-testid="system-pulse-degraded">
          Some source tables are unavailable. Unavailable metrics are shown as unavailable, not zero.
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Reading system…
        </div>
      )}

      {error && (
        <div className="py-4 px-4 text-xs text-muted-foreground text-center">
          {data ? "Refresh unavailable; showing the last snapshot." : "Snapshot temporarily unavailable."}
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-1 font-semibold text-primary hover:underline"
            data-testid="button-retry-pulse"
          >
            Try again
          </button>
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
              Possible handoff paths between sections
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug pb-1">
              These are operational pathways to review, not guaranteed outcomes or automatic handoffs.
            </p>
            {buildFlows(data).map((f) => (
              <div key={`${f.from}-${f.to}`} className="flex items-start gap-1.5 text-[10px]">
                <span className="font-semibold text-foreground shrink-0">{f.from}</span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <span className="font-semibold text-foreground shrink-0">{f.to}</span>
                <span className="text-muted-foreground leading-snug">— {f.signal}</span>
              </div>
            ))}
            {data.crossHub.outcomesTracked !== null && data.crossHub.outcomesTracked > 0 && (
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
