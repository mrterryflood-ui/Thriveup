import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VisualIntelligenceShell } from "@/components/gis/VisualIntelligenceShell";
import {
  Search, AlertTriangle, TrendingDown, TrendingUp, Clock,
  MapPin, ArrowRight, DollarSign, BarChart3, Minus, Plus,
  Download, RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt$(n: number | null | undefined) {
  if (!Number.isFinite(n)) return "—";
  const value = n as number;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function gradeColor(grade: string) {
  if (grade === "A") return "text-emerald-600 dark:text-emerald-400";
  if (grade === "B") return "text-amber-600 dark:text-amber-400";
  if (grade === "C") return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function gradeBg(grade: string) {
  if (grade === "A") return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
  if (grade === "B") return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
  if (grade === "C") return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
  return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
}

function delta(a: number | null | undefined, b: number | null | undefined, lowerIsBetter = true) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
  const aValue = a as number;
  const bValue = b as number;
  const pct = Math.round(Math.abs((aValue - bValue) / Math.max(aValue, bValue)) * 100);
  const aIsBetter = lowerIsBetter ? aValue < bValue : aValue > bValue;
  return { pct, aIsBetter };
}

// ─── Column card ────────────────────────────────────────────────────────────

function CommunityColumn({ d, index, totalCols }: { d: any; index: number; totalCols: number }) {
  const geo = d.geography ?? {};
  const hist = d.historicalCascade ?? {};
  const casc = d.cascade ?? {};
  const trend = hist.trendDirection ?? "stagnant";
  const trendIcon = trend === "improving" ? <TrendingUp className="w-3.5 h-3.5" /> : trend === "worsening" ? <TrendingDown className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />;
  const trendColor = trend === "improving" ? "text-emerald-500" : trend === "worsening" ? "text-red-500" : "text-amber-500";
  const grade = d.overallGrade ?? "—";

  const ACCENT_COLORS = ["blue", "purple", "amber", "rose"];
  const ac = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const accentBorder = ac === "blue" ? "border-t-4 border-t-blue-500" : ac === "purple" ? "border-t-4 border-t-purple-500" : ac === "amber" ? "border-t-4 border-t-amber-500" : "border-t-4 border-t-rose-500";

  return (
    <Card className={`flex-1 min-w-0 p-0 overflow-hidden ${accentBorder}`} data-testid={`column-community-${index}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
              Community {String.fromCharCode(65 + index)}
            </div>
            <div className="font-bold text-sm leading-snug truncate" data-testid={`text-community-name-${index}`}>
              {geo.displayName || d.location || `Location ${index + 1}`}
            </div>
            {geo.zip && <div className="text-xs text-muted-foreground mt-0.5">ZIP {geo.zip} · {geo.state}</div>}
          </div>
          <div className={`text-3xl font-black tabular-nums ${gradeColor(grade)}`} data-testid={`text-grade-${index}`}>{grade}</div>
        </div>
      </div>

      {/* Three key metrics */}
      <div className="divide-y">
        <div className="px-4 py-3" data-testid={`metric-historical-${index}`}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Already Paid · 2013–2022</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{fmt$(hist.totalAccumulatedCost)}</div>
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendColor}`}>
            {trendIcon}<span>Poverty {trend}</span>
          </div>
        </div>
        <div className="px-4 py-3" data-testid={`metric-forward-${index}`}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Next 25 Years · No Action</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 tabular-nums">{fmt$(casc.counterfactualCost)}</div>
          <div className="text-xs text-muted-foreground mt-1">Cascade continues at current rate</div>
        </div>
        <div className="px-4 py-3" data-testid={`metric-savings-${index}`}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Savings w/ Investment</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt$(casc.netSavings)}</div>
          <div className="text-xs text-muted-foreground mt-1">{casc.roi ?? "—"}× ROI over 25 years</div>
        </div>
      </div>

      {/* Domain gaps */}
      {d.systemsScores && (
        <div className="px-4 py-3 border-t">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Top Domain Gaps</div>
          <div className="space-y-1.5">
            {Object.entries(d.systemsScores as Record<string, any>)
              .sort((a: any, b: any) => a[1].score - b[1].score)
              .slice(0, 4)
              .map(([key, dom]: [string, any]) => (
                <div key={key} className="flex items-center gap-2" data-testid={`domain-${index}-${key}`}>
                  <div className="flex-1 text-xs font-medium truncate">{dom.label}</div>
                  <div className={`text-xs font-black tabular-nums ${dom.score < 40 ? "text-red-600 dark:text-red-400" : dom.score < 60 ? "text-orange-600 dark:text-orange-400" : "text-amber-600 dark:text-amber-400"}`}>{dom.grade}</div>
                  <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${dom.score < 40 ? "bg-red-500" : dom.score < 60 ? "bg-orange-500" : "bg-amber-500"}`} style={{ width: `${dom.score}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Historical vintages mini-table */}
      {hist.vintages?.length > 0 && (
        <div className="px-4 py-3 border-t bg-amber-50/40 dark:bg-amber-950/10">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Poverty Rate by Year</div>
          <div className="flex gap-2 flex-wrap">
            {(hist.vintages as any[]).map((v: any) => (
              <div key={v.year} className="text-center" data-testid={`vintage-${index}-${v.year}`}>
                <div className={`text-sm font-bold tabular-nums ${v.povertyRate >= 20 ? "text-red-600 dark:text-red-400" : v.povertyRate >= 15 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {v.povertyRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted-foreground">{v.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link back */}
      <div className="px-4 py-2 border-t bg-slate-50/50 dark:bg-slate-800/20">
        <a href={`/community-impact?q=${encodeURIComponent(geo.displayName || d.location || "")}`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          data-testid={`link-full-brief-${index}`}>
          <ArrowRight className="w-3 h-3" />Full community brief
        </a>
      </div>
    </Card>
  );
}

// ─── Delta strip ─────────────────────────────────────────────────────────────

function DeltaStrip({ comparisons }: { comparisons: any[] }) {
  if (comparisons.length < 2) return null;
  const a = comparisons[0];
  const b = comparisons[1];

  const metrics = [
    { label: "Historical cost", va: a.historicalCascade?.totalAccumulatedCost, vb: b.historicalCascade?.totalAccumulatedCost, lowerBetter: true, format: fmt$ },
    { label: "Forward cost (no action)", va: a.cascade?.counterfactualCost, vb: b.cascade?.counterfactualCost, lowerBetter: true, format: fmt$ },
    { label: "Savings potential", va: a.cascade?.netSavings, vb: b.cascade?.netSavings, lowerBetter: false, format: fmt$ },
    { label: "Overall score", va: a.overallScore, vb: b.overallScore, lowerBetter: false, format: (n: number | null | undefined) => Number.isFinite(n) ? `${n}/100` : "—" },
  ];

  const aName = (a.geography?.displayName || a.location || "A").split(",")[0];
  const bName = (b.geography?.displayName || b.location || "B").split(",")[0];

  return (
    <Card className="p-4" data-testid="section-delta-strip">
      <div className="text-sm font-bold mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-violet-500" />
        Head-to-Head: {aName} vs. {bName}
      </div>
      <div className="space-y-2">
        {metrics.map((m) => {
          const d = delta(m.va, m.vb, m.lowerBetter);
          if (!d) return null;
          return (
            <div key={m.label} className="flex items-center gap-3 text-xs">
              <div className="w-36 text-muted-foreground shrink-0">{m.label}</div>
              <div className={`font-mono font-semibold w-24 ${d.aIsBetter ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{m.format(m.va)}</div>
              <div className="text-muted-foreground">vs.</div>
              <div className={`font-mono font-semibold w-24 ${!d.aIsBetter ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{m.format(m.vb)}</div>
              <div className={`flex items-center gap-0.5 font-semibold ${d.aIsBetter ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {d.aIsBetter ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {d.pct}%
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── PDF export ──────────────────────────────────────────────────────────────

function generateComparisonPDF(comparisons: any[], locationInputs: string[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 0;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 30, "F");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("COMMUNITY COMPARISON", margin, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`${locationInputs.filter(Boolean).join(" vs. ")}  ·  ThriveUp / TCAF  ·  ${new Date().toLocaleDateString("en-US")}`, margin, 22);
  y = 40;

  const colW = (W - margin * 2 - (comparisons.length - 1) * 6) / comparisons.length;

  comparisons.forEach((d, i) => {
    const cx = margin + i * (colW + 6);
    const geo = d.geography ?? {};
    const hist = d.historicalCascade ?? {};
    const casc = d.cascade ?? {};

    doc.setFillColor(248, 250, 252);
    doc.rect(cx, y - 4, colW, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${String.fromCharCode(65 + i)}: ${(geo.displayName || d.location || "").substring(0, 30)}`, cx + 2, y + 1);
    y += 10;

    const rows = [
      ["Grade", `${d.overallGrade ?? "—"} (${d.overallScore ?? "—"}/100)`],
      ["Already paid (2013–2022)", fmt$(hist.totalAccumulatedCost)],
      ["Poverty trend", hist.trendDirection ?? "—"],
      ["Forward cost (25yr, no action)", fmt$(casc.counterfactualCost)],
      ["Savings w/ investment", fmt$(casc.netSavings)],
      ["ROI", `${casc.roi ?? "—"}×`],
    ];

    rows.forEach(([label, val]) => {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(label, cx + 2, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(val, cx + colW - 2, y, { align: "right" });
      y += 6;
    });

    y = 40;
  });

  doc.save(`community-comparison-${Date.now()}.pdf`);
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CommunityComparePage() {
  const [browserLocation] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const sharedGeographies = (params.get("compare") || params.get("geo")?.split(" vs ").join("|") || "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
  const seedA = params.get("a") || sharedGeographies[0] || "";

  const [inputs, setInputs] = useState<string[]>([seedA, sharedGeographies[1] || ""]);
  const [submitted, setSubmitted] = useState(false);

  const compare = useMutation({
    mutationFn: (locations: string[]) =>
      apiRequest("POST", "/api/conductor/compare", { locations }).then((r: any) => r.json()),
  });

  function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    const locs = inputs.filter((l) => l.trim());
    if (locs.length < 2) return;
    setSubmitted(true);
    compare.mutate(locs);
  }

  const comparisons: any[] = compare.data?.comparisons ?? [];

  return (
    <div className="min-h-screen bg-background">
      <VisualIntelligenceShell
        activeLens="comparison"
        geography={inputs.filter(Boolean).join(" vs ")}
        geographyGrain={comparisons.length ? "Each geography at its source-supported grain" : "Enter two supported geographies"}
        title="Visual Intelligence · Comparison"
        description="Compare communities without collapsing source grain, vintage, or modeled-versus-observed meaning."
        observations={[
          {
            id: "comparison-observed",
            label: "Observed comparison inputs",
            evidenceClass: comparisons.length ? "observed" : "unavailable",
            geography: "Each requested geography is resolved separately",
            source: "U.S. Census Bureau ACS 5-Year Estimates",
            vintage: "2013, 2015, 2019, 2022 where returned",
            status: comparisons.length ? "available" : "unavailable",
            disclosure: "A ZIP request is analyzed as its Census ZCTA, not as a citywide or resident-level record.",
          },
          {
            id: "comparison-history",
            label: "Historical snapshots",
            evidenceClass: comparisons.some((d: any) => d.historicalCascade) ? "derived" : "unavailable",
            geography: "Source-defined geography",
            source: "Distinct ACS vintages returned by the Census endpoint",
            vintage: comparisons.some((d: any) => d.historicalCascade)
              ? comparisons.map((d: any) => d.historicalCascade?.vintages?.map((v: any) => v.year).join(", ")).filter(Boolean).join(" · ")
              : "Unavailable",
            status: comparisons.some((d: any) => d.historicalCascade) ? "available" : "unavailable",
            uncertainty: "Unsupported historical geographies remain unavailable instead of being interpolated.",
          },
          {
            id: "comparison-model",
            label: "Cost and savings model",
            evidenceClass: comparisons.some((d: any) => d.cascade) ? "modeled" : "unavailable",
            geography: "Scenario output for each resolved geography",
            source: "TCAF/Chainweb decision-support model",
            vintage: "Forward scenario from disclosed baseline",
            status: comparisons.some((d: any) => d.cascade) ? "available" : "unavailable",
            disclosure: "Historical cost and forward savings are not observed expenditures or guaranteed outcomes.",
          },
          {
            id: "comparison-refresh",
            label: "Comparison status",
            evidenceClass: compare.isError ? "unavailable" : compare.isPending ? "derived" : "observed",
            geography: "Requested inputs",
            source: compare.isError ? "One or more sources did not return a usable comparison." : "Current comparison request",
            vintage: compare.isPending ? "Loading" : "Current response",
            status: compare.isError ? "unavailable" : compare.isPending ? "partial" : "available",
          },
        ]}
      />
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-violet-500/20 text-violet-200 border-violet-500/30 text-xs">Community Comparison</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3">
            Side-by-Side.<br />
            <span className="text-violet-300">Let the Data Speak.</span>
          </h1>
          <p className="text-violet-100/80 text-base mb-8 max-w-2xl">
            Enter 2–3 communities. See the real difference — historical cost, forward projection, savings potential — Census-verified, head-to-head.
          </p>
          <form onSubmit={handleCompare} className="space-y-3 max-w-2xl" data-testid="form-compare">
            {inputs.map((val, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-blue-500" : i === 1 ? "bg-purple-500" : "bg-amber-500"}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    value={val}
                    onChange={(e) => {
                      const next = [...inputs];
                      next[i] = e.target.value;
                      setInputs(next);
                    }}
                    placeholder={i === 0 ? "78741, Austin TX, Waco TX…" : i === 1 ? "Second community…" : "Third community (optional)"}
                    className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15"
                    data-testid={`input-location-${i}`}
                  />
                </div>
                {inputs.length > 2 && (
                  <button type="button" onClick={() => setInputs(inputs.filter((_, j) => j !== i))}
                    className="text-white/40 hover:text-white transition-colors" data-testid={`button-remove-${i}`}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              {inputs.length < 3 && (
                <button type="button" onClick={() => setInputs([...inputs, ""])}
                  className="flex items-center gap-1.5 text-violet-300 hover:text-white text-sm transition-colors"
                  data-testid="button-add-location">
                  <Plus className="w-4 h-4" />Add third community
                </button>
              )}
              <Button type="submit" disabled={compare.isPending || inputs.filter((l) => l.trim()).length < 2}
                className="bg-violet-500 hover:bg-violet-400 text-white px-8 ml-auto"
                data-testid="button-compare">
                {compare.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing…</> : <><Search className="w-4 h-4 mr-2" />Compare</>}
              </Button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {[["Austin, TX", "Waco, TX"], ["78741", "76707"], ["Austin, TX", "Waco, TX", "Rural Texas"]].map((pair) => (
              <button key={pair.join("-")} onClick={() => setInputs(pair.length === 2 ? [...pair, ""] : pair)}
                className="text-xs text-violet-200/60 hover:text-violet-200 transition-colors underline underline-offset-2"
                data-testid={`quick-pair-${pair.join("-").replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}>
                {pair.join(" vs. ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Loading */}
        {compare.isPending && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${inputs.filter(Boolean).length}, minmax(0, 1fr))` }}>
            {inputs.filter(Boolean).map((_, i) => (
              <Card key={i} className="p-4 space-y-4" data-testid={`skeleton-${i}`}>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {compare.isError && (
          <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/30" data-testid="card-compare-error">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
              <div>
                <div className="font-semibold text-red-700">Comparison failed</div>
                <div className="text-sm text-red-600 mt-1">Try specific ZIP codes (e.g. 78741) or "City, State" format.</div>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {comparisons.length > 0 && !compare.isPending && (
          <>
            {/* Export bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm font-semibold text-muted-foreground">
                Comparing {comparisons.length} communities · Census ACS 5-Year Estimates
              </div>
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => generateComparisonPDF(comparisons, inputs)}
                data-testid="button-download-comparison">
                <Download className="w-3.5 h-3.5" />Download Comparison PDF
              </Button>
            </div>

            {/* Delta strip */}
            <DeltaStrip comparisons={comparisons} />

            {/* Columns */}
            <div className="flex gap-4 items-start" data-testid="section-comparison-columns">
              {comparisons.map((d: any, i: number) => (
                <CommunityColumn key={i} d={d} index={i} totalCols={comparisons.length} />
              ))}
            </div>

            {/* Methodology note */}
            <Card className="p-4 bg-slate-50 dark:bg-slate-800/30">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold">Methodology:</span> All figures from U.S. Census Bureau American Community Survey 5-Year Estimates (2013–2022). Cost model applies an evidence-based chain (ECE gap → 3rd grade failure → dropout → incarceration; untreated mental illness → homelessness) to each geographic cohort. Forward projection uses the 2022 ACS baseline. Historical accumulated cost represents cohorts from each vintage whose outcomes have now materialized.
                Source: <span className="font-medium">census.gov/data/developers/data-sets/acs-5year.html</span>
              </p>
            </Card>
          </>
        )}

        {/* Empty state */}
        {!compare.isPending && comparisons.length === 0 && !compare.isError && (
          <div className="text-center py-16 text-muted-foreground" data-testid="state-empty-compare">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Enter two communities above to compare</p>
            <p className="text-sm max-w-md mx-auto">
              Side-by-side historical cost, forward projection, and savings potential — any two ZIPs, cities, or counties in America.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              {[
                { icon: "🧾", title: "Historical Modeled Estimate", desc: "Modeled historical estimate using ACS multi-vintage inputs, 2013–2022" },
                { icon: "📉", title: "Forward Cascade", desc: "Side-by-side 25-year projection if nothing changes" },
                { icon: "📊", title: "Delta Analysis", desc: "Head-to-head percentage difference on every metric" },
              ].map((f) => (
                <Card key={f.title} className="p-4">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="font-semibold text-sm mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
