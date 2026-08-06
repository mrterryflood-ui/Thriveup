import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, ExternalLink, Search, RefreshCw, Clock,
  Building2, AlertTriangle, CheckCircle2, Zap, FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractorOpportunity {
  id: string;
  title: string;
  agency: string | null;
  fundingAmount: string | null;
  deadline: string | null;
  sourceUrl: string | null;
  source: string | null;
  grantType: string | null;
  createdAt: string;
  fitScore: number | null;
}

interface OpportunitiesResponse {
  opportunities: ContractorOpportunity[];
  total: number;
  sources: string[];
  lastDiscoveryScan: string | null;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  "aggregator-bidnet":   { label: "BidNet",    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  "aggregator-rfpmart":  { label: "RFPMart",   color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  "aggregator-esbd-tx":  { label: "TX ESBD",   color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
};

function sourceLabel(src: string | null) {
  if (!src) return { label: "Unknown", color: "bg-slate-100 text-slate-700" };
  return SOURCE_LABELS[src] ?? { label: src.replace("aggregator-", ""), color: "bg-slate-100 text-slate-700" };
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-xs text-slate-400">No deadline listed</span>;
  const days = daysUntil(deadline);
  const color = days < 7
    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    : days < 21
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      <Clock className="h-3 w-3" />
      {days < 0 ? "Closed" : days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `${days}d left`}
      {" · "}{new Date(deadline).toLocaleDateString()}
    </span>
  );
}

export default function ContractorOpportunities() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data, isLoading, error, refetch, isFetching } = useQuery<OpportunitiesResponse>({
    queryKey: ["/api/contractor-opportunities", sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await fetch(`/api/contractor-opportunities?${params}`);
      if (!res.ok) throw new Error("Failed to load opportunities");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const opps = (data?.opportunities ?? []).filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (o.title?.toLowerCase().includes(q)) ||
      (o.agency?.toLowerCase().includes(q)) ||
      (o.fundingAmount?.toLowerCase().includes(q))
    );
  });

  const lastScan = data?.lastDiscoveryScan ? new Date(data.lastDiscoveryScan) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                  Texas Contractor Opportunities
                </h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
                Live RFPs, IFBs, and solicitations from Texas state agencies, local governments, and public-sector buyers.
                Updated automatically every 24 hours.
              </p>
              {lastScan && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Last discovery scan: {lastScan.toLocaleString()}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh-opps"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Source chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-slate-500 self-center">Powered by:</span>
            {["BidNet Direct", "Texas ESBD", "RFPMart"].map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, agency…"
              className="pl-9"
              data-testid="input-search-opps"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-source-filter">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="bidnet">BidNet Direct</SelectItem>
              <SelectItem value="esbd">Texas ESBD</SelectItem>
              <SelectItem value="rfpmart">RFPMart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status banner */}
        {!isLoading && data && data.total === 0 && (
          <Card className="p-6 text-center border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="font-semibold text-amber-800 dark:text-amber-300">No contractor opportunities in the database yet</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 max-w-md mx-auto">
              The discovery engine runs daily. Opportunities from BidNet, TX ESBD, and RFPMart will appear here automatically after the next scan.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
              Admin: trigger a manual scan via <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">/api/grants/discovery/run-now</code>
            </p>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="p-6 text-center border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="font-semibold text-red-800 dark:text-red-300">Failed to load opportunities</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Retry</Button>
          </Card>
        )}

        {/* Results count */}
        {!isLoading && opps.length > 0 && (
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{opps.length}</span> open solicitation{opps.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Opportunity cards */}
        <div className="space-y-3">
          {opps.map(opp => {
            const src = sourceLabel(opp.source);
            return (
              <Card key={opp.id} className="p-4 hover:shadow-md transition-shadow" data-testid={`card-opp-${opp.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${src.color}`}>
                        {src.label}
                      </span>
                      {opp.grantType === "rfp" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium uppercase tracking-wide">
                          RFP
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 leading-snug mb-1 pr-2">
                      {opp.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      {opp.agency && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {opp.agency}
                        </span>
                      )}
                      {opp.fundingAmount && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                          <Zap className="h-3.5 w-3.5 shrink-0" />
                          {opp.fundingAmount}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <DeadlineBadge deadline={opp.deadline} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Discovered {new Date(opp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {opp.sourceUrl && (
                    <a
                      href={opp.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-opp-${opp.id}`}
                    >
                      <Button size="sm" className="shrink-0 gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Solicitation
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA footer */}
        <Card className="p-5 mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Need help responding to a solicitation?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                TCAF's AI tools help contractors write RFP responses, compliance narratives, and bid packages. Free for Texas-based nonprofits and small businesses.
              </p>
            </div>
            <a href="/rfp-writer" className="shrink-0">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                Open RFP Writer →
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
