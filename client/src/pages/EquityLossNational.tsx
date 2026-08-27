// client/src/pages/EquityLossNational.tsx
// Equity-Loss Engine — nationwide county browsing view.
// Data: GET /api/equity-loss/national/* (public, no auth)
// Route: /equity-loss/national
//
// Disclosure discipline (matching EquityLossEngine.tsx):
//   - suppressed rows are never shown as zero — they're labelled "Suppressed"
//   - tier/assumption context is available inline for every row
//   - data freshness ("as of <date>") is shown in the header bar
//   - the three-frame methodology and peer-class assumption caveat are
//     disclosed in the same plain language as the single-county page
//   - an honest empty/loading/no-data-yet state is shown when the batch
//     job hasn't completed

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { Link, useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, ArrowUpDown, Info, ExternalLink, ArrowLeft, Map, Table as TableIcon } from "lucide-react";
import CountyChoroplethMap from "@/components/equity-loss/CountyChoroplethMap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NationalRow {
  county_fips: string;
  county_name: string;
  state_abbrev: string;
  state_fips: string;
  frame: string;
  peer_class: string | null;
  hdi: number | null;
  ihdi: number | null;
  overall_loss_pct: number | null;
  a_health: number | null;
  a_education: number | null;
  a_income: number | null;
  divergence_pct: number | null;
  suppressed: boolean;
  suppression_reason: string | null;
  tier: string;
  assumption_text: string | null;
  engine_version: string;
  computed_at: string;
}

interface NationalListResponse {
  noDataYet: boolean;
  message?: string;
  batchRunId?: string;
  dataAsOf?: string;
  frame?: string;
  rows: NationalRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SummaryResponse {
  noDataYet: boolean;
  frame?: string;
  message?: string;
  batchRunId?: string;
  dataAsOf?: string;
  totalCounties?: number;
  totalSuppressed?: number;
  minLossPct?: number | null;
  maxLossPct?: number | null;
  medianLossPct?: number | null;
  stateBreakdown?: Record<string, {
    jurisdictionType: "state" | "district" | "territory";
    expectedCountyCount: number;
    presentCountyCount: number;
    usableCountyCount: number;
    sourceUnavailableCountyCount: number;
    otherSuppressedCountyCount: number;
    missingCountyCount: number;
    avgLoss: number | null;
  }>;
  coverage?: {
    jurisdictions: {
      states: JurisdictionCoverage;
      districtOfColumbia: JurisdictionCoverage;
      territories: JurisdictionCoverage;
    };
    records: CoverageRecord;
  };
}

interface JurisdictionCoverage {
  expectedJurisdictions: number;
  presentJurisdictions: number;
  usableJurisdictions: number;
  sourceUnavailableJurisdictions: number;
  otherSuppressedJurisdictions: number;
  missingJurisdictions: number;
}

interface CoverageRecord {
  expected: number;
  present: number;
  usable: number;
  sourceUnavailable: number;
  otherSuppressed: number;
  missing: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FRAME_OPTIONS = [
  { value: "vs_national_peer_class", label: "vs. National Peer Class" },
  { value: "vs_state", label: "vs. Own State" },
  { value: "vs_parent_county", label: "vs. National (US)" },
] as const;

const TIER_LABELS: Record<string, string> = {
  computed: "Computed",
  derived_with_stated_assumption: "Derived (stated assumption)",
  ai_estimate: "AI estimate (lowest confidence)",
};

const TIER_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  computed: "default",
  derived_with_stated_assumption: "secondary",
  ai_estimate: "destructive",
};

const STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];
const TERRITORY_CODES = ["AS", "GU", "MP", "PR", "VI"];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function fmtPct(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(decimals)}%`;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function lossColor(pct: number | null): string {
  if (pct === null) return "#94a3b8";
  if (pct >= 20) return "#f87171";
  if (pct >= 10) return "#fb923c";
  if (pct >= 5) return "#facc15";
  return "#34d399";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryBar({ summary }: { summary: SummaryResponse | null }) {
  if (!summary) {
    return (
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
    );
  }

  if (summary.noDataYet) {
    return (
      <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fbbf24", fontWeight: 600 }}>
          <AlertCircle size={16} />
          Nationwide data is being computed — check back soon
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
          {summary.message ?? "The batch computation job has not completed yet. No data is available to display."}
        </div>
      </div>
    );
  }

  const frameLabel = {
    vs_national_peer_class: "national peer-class",
    vs_state: "state",
    vs_parent_county: "parent-county",
  }[summary.frame ?? "vs_national_peer_class"] ?? "selected comparison";
  const coverage = summary.coverage;
  const records = coverage?.records;
  const states = coverage?.jurisdictions.states;
  const districtOfColumbia = coverage?.jurisdictions.districtOfColumbia;
  const territories = coverage?.jurisdictions.territories;

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px 40px", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>County-equivalent records present</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc" }}>{records?.present.toLocaleString() ?? summary.totalCounties?.toLocaleString()}</div>
          {records && <div style={{ fontSize: 11, color: "#94a3b8" }}>of {records.expected.toLocaleString()} expected</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>{frameLabel} usable</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#86efac" }}>{records?.usable.toLocaleString() ?? "—"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>computed records in this frame</div>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Source-unavailable</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fbbf24" }}>{records?.sourceUnavailable.toLocaleString() ?? "—"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>shown as a gap, never zero</div>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Loss range ({frameLabel})</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#f8fafc" }}>
            {fmtPct(summary.minLossPct)} – {fmtPct(summary.maxLossPct)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>median {fmtPct(summary.medianLossPct)}</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right", minWidth: 160 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Data freshness</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>as of {fmtDate(summary.dataAsOf)}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            batch: {summary.batchRunId?.slice(0, 12)}…
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
        Loss % = (1 − IHDI / HDI) × 100 — the human development a county loses to internal inequality (Atkinson method, UNDP goalposts).
        Each county is compared against one reference frame at a time; frames are never averaged.
        The summary above is for the selected {frameLabel} comparison frame. Suppressed counties had insufficient data for
        a reliable estimate — their absence is shown explicitly, not as zero.
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
        <strong>Analytical coverage — not service deployment:</strong>{" "}
        {states
          ? `States: ${states.expectedJurisdictions} expected, ${states.presentJurisdictions} present, ${states.usableJurisdictions} with a usable result, ${states.sourceUnavailableJurisdictions} entirely source-unavailable, and ${states.missingJurisdictions} missing or unattempted.`
          : "State coverage is unavailable for this batch."}{" "}
        {districtOfColumbia
          ? `D.C.: ${districtOfColumbia.expectedJurisdictions} expected, ${districtOfColumbia.presentJurisdictions} present, ${districtOfColumbia.usableJurisdictions} usable, ${districtOfColumbia.sourceUnavailableJurisdictions} entirely source-unavailable, and ${districtOfColumbia.missingJurisdictions} missing or unattempted.`
          : ""}{" "}
        {territories
          ? `Territories: ${territories.expectedJurisdictions} expected, ${territories.presentJurisdictions} present, ${territories.usableJurisdictions} usable, ${territories.sourceUnavailableJurisdictions} entirely source-unavailable, and ${territories.missingJurisdictions} missing or unattempted.`
          : ""}{" "}
        {records
          ? `Across county-equivalent records: ${records.present.toLocaleString()} present of ${records.expected.toLocaleString()}, ${records.usable.toLocaleString()} usable, ${records.sourceUnavailable.toLocaleString()} source-unavailable, ${records.otherSuppressed.toLocaleString()} otherwise suppressed or incomplete, and ${records.missing.toLocaleString()} missing or unattempted.`
          : ""}
      </div>
    </div>
  );
}

function TierCell({ tier, assumptionText }: { tier: string; assumptionText: string | null }) {
  const label = TIER_LABELS[tier] ?? tier;
  const variant = TIER_BADGE_VARIANT[tier] ?? "outline";

  if (!assumptionText) {
    return <Badge variant={variant} className="text-xs whitespace-nowrap">{label}</Badge>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <Badge variant={variant} className="text-xs whitespace-nowrap">{label}</Badge>
            <Info size={12} className="text-slate-500 shrink-0" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {assumptionText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LossCell({ pct, suppressed, reason }: { pct: number | null; suppressed: boolean; reason: string | null }) {
  if (suppressed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help text-amber-400 font-medium text-sm">
              Suppressed <Info size={12} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {reason ? reason.replace(/_/g, " ") : "Insufficient data for a reliable estimate."}
            {" "}A visible gap is shown instead of a potentially misleading number.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <span style={{ color: lossColor(pct), fontWeight: 600 }}>
      {fmtPct(pct)}
    </span>
  );
}

function SortButton({ field, label, currentSort, currentDir, onClick }: {
  field: string;
  label: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  onClick: () => void;
}) {
  const active = currentSort === field;
  return (
    <button
      onClick={onClick}
      aria-label={`Sort by ${label}${active ? `, currently ${currentDir === "desc" ? "descending" : "ascending"}` : ""}`}
      className="flex items-center gap-1 hover:text-slate-200 transition-colors"
      style={{ color: active ? "#e2e8f0" : "#94a3b8", fontSize: 12, fontWeight: active ? 700 : 400, background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      {active ? (currentDir === "desc" ? "↓" : "↑") : <ArrowUpDown size={12} />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EquityLossNationalPage() {
  const [, navigate] = useLocation();

  // View toggle: "table" | "map"
  const [view, setView] = useState<"table" | "map">("table");

  // Filter/sort state
  const [frame, setFrame] = useState<string>("vs_national_peer_class");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [sortField, setSortField] = useState<string>("overall_loss_pct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Data state
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [listData, setListData] = useState<NationalListResponse | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const summaryRequest = useRef<AbortController | null>(null);
  const listRequest = useRef<AbortController | null>(null);

  // Expand row detail
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch summary
  // ---------------------------------------------------------------------------
  const fetchSummary = useCallback(async (fr: string) => {
    const priorRequest = summaryRequest.current;
    summaryRequest.current = null;
    priorRequest?.abort();
    const controller = new AbortController();
    summaryRequest.current = controller;
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/equity-loss/national/summary?frame=${encodeURIComponent(fr)}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (summaryRequest.current !== controller) return;
      setSummary(json);
    } catch (e) {
      if (controller.signal.aborted || summaryRequest.current !== controller) return;
      setSummaryError((e as Error).message);
    } finally {
      if (summaryRequest.current === controller) {
        summaryRequest.current = null;
        setLoadingSummary(false);
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch list
  // ---------------------------------------------------------------------------
  const fetchList = useCallback(async (params: {
    frame: string;
    state: string;
    search: string;
    sortField: string;
    sortDir: string;
    page: number;
  }) => {
    const priorRequest = listRequest.current;
    listRequest.current = null;
    priorRequest?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoadingList(true);
    setListError(null);
    try {
      const qs = new URLSearchParams({
        frame: params.frame,
        sort: params.sortField,
        dir: params.sortDir,
        page: String(params.page),
        pageSize: String(pageSize),
      });
      if (params.state && params.state !== "all") qs.set("state", params.state);
      if (params.search) qs.set("search", params.search);
      const res = await fetch(`/api/equity-loss/national?${qs}`, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (listRequest.current !== controller) return;
      setListData(json);
    } catch (e) {
      if (controller.signal.aborted || listRequest.current !== controller) return;
      setListError((e as Error).message);
    } finally {
      if (listRequest.current === controller) {
        listRequest.current = null;
        setLoadingList(false);
      }
    }
  }, [pageSize]);

  // Initial load and on filter changes
  useEffect(() => {
    void fetchSummary(frame);
    return () => {
      const activeRequest = summaryRequest.current;
      summaryRequest.current = null;
      activeRequest?.abort();
    };
  }, [frame, fetchSummary]);

  useEffect(() => {
    void fetchList({ frame, state: stateFilter, search, sortField, sortDir, page });
    return () => {
      const activeRequest = listRequest.current;
      listRequest.current = null;
      activeRequest?.abort();
    };
  }, [frame, stateFilter, search, sortField, sortDir, page, fetchList]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  function handleFrameChange(val: string) {
    setFrame(val);
    setPage(1);
  }

  function handleStateChange(val: string) {
    setStateFilter(val);
    setPage(1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  function handleRowExpand(countyFips: string) {
    setExpandedRow((prev) => (prev === countyFips ? null : countyFips));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const noDataYet = listData?.noDataYet || summary?.noDataYet;

  return (
    <div style={{ minHeight: "100vh", background: "#0b1120", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 80px" }}>

        {/* Header nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <Link href="/equity-loss"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", textDecoration: "none" }}
            className="hover:text-slate-200 transition-colors">
            <ArrowLeft size={14} /> Single-County Lookup
          </Link>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 600 }}>Nationwide Browse</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
          Equity-Loss Engine — Nationwide View
        </h1>
        <p style={{ color: "#94a3b8", marginTop: 8, marginBottom: 24, maxWidth: 680, lineHeight: 1.5, fontSize: 14 }}>
          County-grain human development loss to inequality (IHDI/Atkinson method) from the most recent completed batch.
          Availability varies by jurisdiction and source; the coverage statement below distinguishes usable results from
          suppressed or unavailable records. Filter, sort, and open a county detail—or use the county link for a live
          single-county computation.
        </p>

        {/* Summary bar */}
        {summaryError ? (
          <div style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", padding: 14, borderRadius: 10, marginBottom: 20, border: "1px solid rgba(239,68,68,0.25)", fontSize: 13 }}>
            Summary unavailable: {summaryError}
          </div>
        ) : (
          <SummaryBar summary={loadingSummary ? null : summary} />
        )}

        {/* No data yet (batch not complete) */}
        {noDataYet && (
          <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 12, padding: "32px 24px", textAlign: "center", marginTop: 16 }}>
            <AlertCircle size={32} style={{ color: "#fbbf24", marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>
              Nationwide data is being computed
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
              The batch computation job has not completed yet. Each batch processes ~3,100 counties
              against multiple external data sources. Check back soon. In the meantime, you can use the{" "}
              <Link href="/equity-loss" style={{ color: "#2563eb", textDecoration: "underline" }}>single-county lookup</Link>{" "}
              for live on-demand results.
            </div>
          </div>
        )}

        {/* View toggle + Filters */}
        {!noDataYet && (
          <>
            {/* Table / Map toggle */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center" }}>
              <button
                onClick={() => setView("table")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: view === "table" ? "rgba(37,99,235,0.18)" : "rgba(255,255,255,0.04)",
                  color: view === "table" ? "#93c5fd" : "#94a3b8",
                  border: view === "table" ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.15s",
                }}
              >
                <TableIcon size={14} /> Table
              </button>
              <button
                onClick={() => setView("map")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: view === "map" ? "rgba(37,99,235,0.18)" : "rgba(255,255,255,0.04)",
                  color: view === "map" ? "#93c5fd" : "#94a3b8",
                  border: view === "map" ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.15s",
                }}
              >
                <Map size={14} /> Map
              </button>
            </div>

            {/* Frame selector — shown in both views */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
              {/* Frame selector */}
              <div style={{ minWidth: 200 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Comparison Frame
                </div>
                <Select value={frame} onValueChange={handleFrameChange}>
                  <SelectTrigger style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", width: "100%" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAME_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State filter — only shown in table view */}
              {view === "table" && (
                <div style={{ minWidth: 130 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    State
                  </div>
                  <Select value={stateFilter} onValueChange={handleStateChange}>
                    <SelectTrigger style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", width: "100%" }}>
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {[...STATE_CODES, "DC", ...TERRITORY_CODES].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Search — only shown in table view */}
              {view === "table" && (
                <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, alignItems: "flex-end", flex: 1, minWidth: 200 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Search county name
                    </div>
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="e.g. Cook"
                      style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0" }}
                    />
                  </div>
                  <Button type="submit" variant="secondary" style={{ padding: "8px 16px", height: 38 }}>
                    Search
                  </Button>
                  {search && (
                    <Button
                      type="button"
                      variant="ghost"
                      style={{ padding: "8px 12px", height: 38, color: "#64748b" }}
                      onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                    >
                      Clear
                    </Button>
                  )}
                </form>
              )}
            </div>

            {/* Map view */}
            {view === "map" && (
              <CountyChoroplethMap
                frame={frame}
                onCountyClick={(row) => {
                  navigate(`/equity-loss?state=${row.state_fips}&county=${row.county_fips.slice(2)}`);
                }}
              />
            )}

            {/* Error (table view only) */}
            {view === "table" && listError && (
              <div style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", padding: 14, borderRadius: 10, marginBottom: 16, border: "1px solid rgba(239,68,68,0.25)", fontSize: 13 }}>
                {listError}
              </div>
            )}

            {/* Table view */}
            {view === "table" && <>
            {/* Table — desktop */}
            <div className="hidden md:block">
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <TableHead style={{ color: "#64748b", fontSize: 12 }}>
                          <div className="flex items-center gap-1">
                            County
                            <SortButton field="county_name" label="county name" currentSort={sortField} currentDir={sortDir} onClick={() => handleSort("county_name")} />
                          </div>
                        </TableHead>
                        <TableHead style={{ color: "#64748b", fontSize: 12 }}>
                          <div className="flex items-center gap-1">
                            State
                            <SortButton field="state_abbrev" label="state" currentSort={sortField} currentDir={sortDir} onClick={() => handleSort("state_abbrev")} />
                          </div>
                        </TableHead>
                        <TableHead style={{ color: "#64748b", fontSize: 12 }}>Peer Class</TableHead>
                        <TableHead style={{ color: "#64748b", fontSize: 12 }}>
                          <div className="flex items-center gap-1">
                            Loss % (IHDI)
                            <SortButton field="overall_loss_pct" label="loss percentage" currentSort={sortField} currentDir={sortDir} onClick={() => handleSort("overall_loss_pct")} />
                          </div>
                        </TableHead>
                        <TableHead style={{ color: "#64748b", fontSize: 12 }}>Divergence</TableHead>
                        <TableHead style={{ color: "#64748b", fontSize: 12 }}>Trust Tier</TableHead>
                        <TableHead style={{ color: "#64748b", fontSize: 12 }}>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingList
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {Array.from({ length: 7 }).map((__, j) => (
                                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                              ))}
                            </TableRow>
                          ))
                        : (listData?.rows ?? []).map((row) => [
                              <TableRow
                                key={row.county_fips}
                                style={{
                                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                                  background: expandedRow === row.county_fips ? "rgba(37,99,235,0.08)" : undefined,
                                }}
                              >
                                <TableCell style={{ color: "#e2e8f0", fontWeight: 500, fontSize: 14 }}>
                                  {row.county_name}
                                </TableCell>
                                <TableCell style={{ color: "#94a3b8", fontSize: 13 }}>{row.state_abbrev}</TableCell>
                                <TableCell style={{ color: "#64748b", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {row.peer_class ?? "—"}
                                </TableCell>
                                <TableCell>
                                  <LossCell pct={row.overall_loss_pct} suppressed={row.suppressed} reason={row.suppression_reason} />
                                </TableCell>
                                <TableCell style={{ color: row.divergence_pct !== null ? (row.divergence_pct > 0 ? "#f87171" : "#34d399") : "#64748b", fontSize: 13 }}>
                                  {row.divergence_pct !== null
                                    ? `${row.divergence_pct > 0 ? "+" : ""}${row.divergence_pct.toFixed(1)} pts`
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  <TierCell tier={row.tier} assumptionText={row.assumption_text} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => handleRowExpand(row.county_fips)}
                                      aria-expanded={expandedRow === row.county_fips}
                                      aria-controls={expandedRow === row.county_fips ? `county-detail-${row.county_fips}` : undefined}
                                      style={{ color: "#93c5fd", fontSize: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                    >
                                      {expandedRow === row.county_fips ? "Hide details" : "Details"}
                                    </button>
                                    <Link
                                      href={`/equity-loss?state=${row.state_fips}&county=${row.county_fips.slice(2)}`}
                                      style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563eb", fontSize: 12, textDecoration: "none" }}
                                    >
                                      Live <ExternalLink size={11} />
                                    </Link>
                                  </div>
                                </TableCell>
                              </TableRow>,

                              /* Expanded detail row */
                              expandedRow === row.county_fips && (
                                <TableRow id={`county-detail-${row.county_fips}`} key={`${row.county_fips}-detail`} style={{ background: "rgba(37,99,235,0.05)" }}>
                                  <TableCell colSpan={7} style={{ padding: "12px 20px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px 24px", fontSize: 13 }}>
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>County FIPS</div>
                                        <div style={{ color: "#e2e8f0" }}>{row.county_fips}</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>HDI</div>
                                        <div style={{ color: "#e2e8f0" }}>{row.hdi?.toFixed(4) ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>IHDI</div>
                                        <div style={{ color: "#e2e8f0" }}>{row.ihdi?.toFixed(4) ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Health loss (A_health)</div>
                                        <div style={{ color: "#e2e8f0" }}>{fmtPct(row.a_health)}</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Education loss (A_edu)</div>
                                        <div style={{ color: "#e2e8f0" }}>{fmtPct(row.a_education)}</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Income loss (A_income)</div>
                                        <div style={{ color: "#e2e8f0" }}>{fmtPct(row.a_income)}</div>
                                      </div>
                                      {row.assumption_text && (
                                        <div style={{ gridColumn: "1 / -1" }}>
                                          <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Stated assumption</div>
                                          <div style={{ color: "#fbbf24", fontStyle: "italic", lineHeight: 1.5 }}>{row.assumption_text}</div>
                                        </div>
                                      )}
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Engine version</div>
                                        <div style={{ color: "#e2e8f0" }}>{row.engine_version}</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Computed at</div>
                                        <div style={{ color: "#e2e8f0" }}>{fmtDate(row.computed_at)}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ),
                            ])}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Card list — mobile */}
            <div className="md:hidden space-y-3">
              {loadingList
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 }}>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))
                : (listData?.rows ?? []).map((row) => (
                    <div
                      key={row.county_fips}
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16, cursor: "pointer" }}
                      onClick={() => handleRowExpand(row.county_fips)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 15 }}>{row.county_name}</div>
                          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{row.state_abbrev} · {row.peer_class ?? "—"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <LossCell pct={row.overall_loss_pct} suppressed={row.suppressed} reason={row.suppression_reason} />
                          {row.divergence_pct !== null && (
                            <div style={{ fontSize: 12, color: row.divergence_pct > 0 ? "#f87171" : "#34d399", marginTop: 2 }}>
                              {row.divergence_pct > 0 ? "+" : ""}{row.divergence_pct.toFixed(1)} pts div.
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <TierCell tier={row.tier} assumptionText={row.assumption_text} />
                        <Link
                          href={`/equity-loss?state=${row.state_fips}&county=${row.county_fips.slice(2)}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563eb", fontSize: 12 }}
                        >
                          Live detail <ExternalLink size={11} />
                        </Link>
                      </div>

                      {expandedRow === row.county_fips && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 12 }}>
                          <div><span style={{ color: "#64748b" }}>FIPS: </span><span style={{ color: "#e2e8f0" }}>{row.county_fips}</span></div>
                          <div><span style={{ color: "#64748b" }}>HDI: </span><span style={{ color: "#e2e8f0" }}>{row.hdi?.toFixed(4) ?? "—"}</span></div>
                          <div><span style={{ color: "#64748b" }}>IHDI: </span><span style={{ color: "#e2e8f0" }}>{row.ihdi?.toFixed(4) ?? "—"}</span></div>
                          <div><span style={{ color: "#64748b" }}>A_health: </span><span style={{ color: "#e2e8f0" }}>{fmtPct(row.a_health)}</span></div>
                          <div><span style={{ color: "#64748b" }}>A_edu: </span><span style={{ color: "#e2e8f0" }}>{fmtPct(row.a_education)}</span></div>
                          <div><span style={{ color: "#64748b" }}>A_income: </span><span style={{ color: "#e2e8f0" }}>{fmtPct(row.a_income)}</span></div>
                          {row.assumption_text && (
                            <div style={{ gridColumn: "1 / -1", color: "#fbbf24", fontStyle: "italic", lineHeight: 1.5 }}>{row.assumption_text}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
            </div>

            {/* Pagination */}
            {listData && !listData.noDataYet && listData.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {listData.total.toLocaleString()} counties · page {listData.page} of {listData.totalPages}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "#cbd5e1" }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= listData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "#cbd5e1" }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Show count if only one page */}
            {listData && !listData.noDataYet && listData.totalPages <= 1 && listData.total > 0 && (
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 12 }}>
                {listData.total.toLocaleString()} {listData.total === 1 ? "county" : "counties"} shown
              </div>
            )}

            {/* Empty state (filters matched nothing but data exists) */}
            {listData && !listData.noDataYet && listData.total === 0 && !loadingList && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontSize: 14 }}>
                No counties matched your filters. Try adjusting the state or search term.
              </div>
            )}
            </>}
          </>
        )}

        {/* Methodology disclosure footer */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Methodology & Disclosure</div>
          <p>
            Loss % is computed as (HDI − IHDI) / HDI × 100 using the Atkinson inequality index applied independently to
            health (life expectancy at census-tract level via USALEEP), education (ACS attainment), and income (ACS household income).
            Three comparison frames are used independently — vs. national (US), vs. own state, and vs. national peer class —
            and are never averaged together. A county can read as deprived against its own state and advantaged against national
            peers of the same type; both can be true and they imply different policy responses.
          </p>
          <p style={{ marginTop: 6 }}>
            Suppressed counties had insufficient data for a reliable estimate (e.g., population below USALEEP threshold,
            high margin-of-error, or incomplete dimensions). Their absence is shown explicitly — never as zero — to avoid
            misleading comparisons. Trust tier labels disclose whether a result is fully computed, uses a stated unvalidated
            assumption, or is an AI estimate. The peer-class benchmark uses a representative-county assumption that is
            unvalidated; this is disclosed on every peer-class frame row.
          </p>
          <p style={{ marginTop: 6 }}>
            Data freshness is shown in the header. All results reflect the most recently completed batch run only;
            rows from different runs are never mixed in a single response. For on-demand live computation,
            use the <Link href="/equity-loss" style={{ color: "#2563eb" }}>single-county lookup</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
