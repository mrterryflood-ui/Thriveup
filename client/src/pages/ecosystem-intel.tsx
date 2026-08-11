import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertTriangle, CheckCircle, Info, Loader2, ExternalLink, ChevronDown, ChevronUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CountyMatch { name: string; stateFips: string; countyFips: string }
interface EcosystemData {
  county: string; stateFips: string; countyFips: string;
  dataSource: string; dataYear: number; benchmarks: Record<string, number>;
  nodes: {
    economic: any; housing: any; education: any; language: any;
    health: any; youth: any; demographics: any; schools: any;
  };
  edges: Array<{ from: string; to: string; label: string; strength: string }>;
  rfpContext: string | null;
  rfpRelevantNodes: string[];
  chainwebNarrative: string[];
}

// ─── Severity helpers ─────────────────────────────────────────────────────────
const SEV_COLOR = { green: "#16a34a", amber: "#d97706", red: "#dc2626" };
const SEV_BG    = { green: "#dcfce7", amber: "#fef3c7", red: "#fee2e2" };
const SEV_RING  = { green: "#86efac", amber: "#fcd34d", red: "#fca5a5" };

function SevIcon({ s }: { s: "green"|"amber"|"red" }) {
  if (s === "green") return <CheckCircle className="h-3.5 w-3.5 inline-block mr-1" style={{ color: SEV_COLOR.green }} />;
  if (s === "red")   return <AlertTriangle className="h-3.5 w-3.5 inline-block mr-1" style={{ color: SEV_COLOR.red }} />;
  return <Info className="h-3.5 w-3.5 inline-block mr-1" style={{ color: SEV_COLOR.amber }} />;
}

// ─── Chainweb SVG ─────────────────────────────────────────────────────────────
const NODE_POS: Record<string, [number, number]> = {
  economic:  [400, 260],
  housing:   [130, 185],
  schools:   [670, 185],
  youth:     [400,  65],
  language:  [130, 375],
  health:    [670, 375],
  education: [400, 455],
};

const NODE_LABELS: Record<string, string> = {
  economic: "Economic",
  housing: "Housing",
  schools: "Schools",
  youth: "Youth & Family",
  language: "Language Access",
  health: "Health Access",
  education: "Education Attainment",
};

const NODE_METRICS: Record<string, (n: any) => string> = {
  economic:  n => `${n.povertyRate}% poverty`,
  housing:   n => `${n.severeRentBurdenRate}% severely burdened`,
  schools:   n => n.totalEnrollment > 0 ? `${n.totalEnrollment.toLocaleString()} K-12 enrolled` : "No enrollment data",
  youth:     n => `${n.under18Rate}% under 18`,
  language:  n => `${n.nonEnglishRate}% non-English`,
  health:    n => `${n.uninsuredRate}% uninsured`,
  education: n => `${n.collegeAttainment}% college grad`,
};

const NODE_SEVERITY: Record<string, (nodes: any) => "green"|"amber"|"red"> = {
  economic:  n => n.economic.severity,
  housing:   n => n.housing.severity,
  schools:   n => {
    const pct = n.schools.districtPovertyPct;
    if (pct === null || pct === undefined) return "amber" as const;
    return pct > 20 ? "red" as const : pct > 12 ? "amber" as const : "green" as const;
  },
  youth:     n => n.youth.severity,
  language:  n => n.language.severity,
  health:    n => n.health.severity,
  education: n => n.education.severity,
};

function ChainwebSVG({
  data, selectedNode, onSelect,
}: {
  data: EcosystemData;
  selectedNode: string | null;
  onSelect: (id: string | null) => void;
}) {
  const rfp = new Set(data.rfpRelevantNodes);
  const W = 800, H = 520;

  function nodeData(id: string) {
    const nodeKey = id === "schools" ? data.nodes.schools
      : id === "youth" ? data.nodes.youth
      : (data.nodes as any)[id];
    return nodeKey;
  }

  // Draw a curved edge between two nodes
  function edgePath(from: string, to: string) {
    const [x1, y1] = NODE_POS[from];
    const [x2, y2] = NODE_POS[to];
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const perp_x = -dy * 0.25, perp_y = dx * 0.25;
    return `M ${x1} ${y1} Q ${cx + perp_x} ${cy + perp_y} ${x2} ${y2}`;
  }

  const edgeActive = (e: typeof data.edges[0]) =>
    !selectedNode || e.from === selectedNode || e.to === selectedNode;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
        </marker>
        {Object.keys(SEV_COLOR).map(s => (
          <filter key={s} id={`glow-${s}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        ))}
      </defs>

      {/* Edges */}
      {data.edges.map((e, i) => {
        const active = edgeActive(e);
        return (
          <path
            key={i}
            d={edgePath(e.from, e.to)}
            fill="none"
            stroke={active ? "#818cf8" : "#e2e8f0"}
            strokeWidth={active ? (e.strength === "strong" ? 2.5 : 1.5) : 1}
            strokeDasharray={e.strength === "moderate" ? "5 4" : undefined}
            markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
            opacity={active ? 0.85 : 0.3}
          />
        );
      })}

      {/* Nodes */}
      {Object.entries(NODE_POS).map(([id, [cx, cy]]) => {
        const sev = NODE_SEVERITY[id]?.(data.nodes) ?? "green";
        const color = SEV_COLOR[sev];
        const bg = SEV_BG[sev];
        const ring = SEV_RING[sev];
        const nd = nodeData(id);
        const metric = nd ? NODE_METRICS[id]?.(nd) : "";
        const isSelected = selectedNode === id;
        const isRfp = rfp.has(id);
        const r = id === "economic" ? 68 : 58;

        return (
          <g key={id} onClick={() => onSelect(isSelected ? null : id)} style={{ cursor: "pointer" }}>
            {isRfp && (
              <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" opacity="0.7" />
            )}
            <circle cx={cx} cy={cy} r={r + 4} fill={isSelected ? ring : "transparent"} opacity="0.4" />
            <circle cx={cx} cy={cy} r={r} fill={bg} stroke={color} strokeWidth={isSelected ? 3 : 1.5} />
            <text x={cx} y={cy - 14} textAnchor="middle" fontSize="12" fontWeight="600" fill={color}>
              {NODE_LABELS[id].split(" ").map((w: string, wi: number) => (
                <tspan key={wi} x={cx} dy={wi === 0 ? 0 : 14}>{w}</tspan>
              ))}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="10.5" fill="#475569" fontWeight="500">
              {metric || "–"}
            </text>
          </g>
        );
      })}

      {/* RFP legend */}
      {data.rfpContext && (
        <g>
          <circle cx={22} cy={H - 22} r={8} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />
          <text x={36} y={H - 18} fontSize="10" fill="#78716c">RFP-relevant node</text>
        </g>
      )}
    </svg>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function NodeDetail({ id, data }: { id: string; data: EcosystemData }) {
  const n = data.nodes as any;
  const panels: Record<string, JSX.Element> = {
    economic: (
      <div className="space-y-3">
        <Row label="Median Household Income" value={`$${n.economic.medianIncome?.toLocaleString()}`} benchmark={`National: $${data.benchmarks.medianIncome.toLocaleString()}`} />
        <Row label="Poverty Rate" value={`${n.economic.povertyRate}%`} benchmark={`National: ${data.benchmarks.povertyRate}%`} sev={n.economic.severity} />
        <Row label="Unemployment Rate" value={`${n.economic.unemploymentRate}%`} benchmark={`National: ${data.benchmarks.unemploymentRate}%`} />
        <Insight text="Poverty and income are the root economic node. They drive rent burden, health access, and educational attainment simultaneously — changes here cascade through every other node." />
      </div>
    ),
    housing: (
      <div className="space-y-3">
        <Row label="Median Gross Rent" value={`$${n.housing.medianRent?.toLocaleString()}/mo`} benchmark={`National: $${data.benchmarks.medianRent.toLocaleString()}/mo`} />
        <Row label="Severely Rent-Burdened (50%+ of income)" value={`${n.housing.severeRentBurdenRate}%`} benchmark={`National: ~${data.benchmarks.severeRentBurden}%`} sev={n.housing.severity} />
        <Row label="Cost-Burdened Renters (35%+)" value={`${n.housing.costBurdenedRate}%`} />
        <Row label="Homeownership Rate" value={`${n.housing.ownershipRate}%`} />
        <Insight text="Severe rent burden is the strongest predictor of school mobility. A family spending 50%+ on rent has zero financial cushion — one car repair, one missed shift triggers a move. Mid-year school moves are the leading cause of reading failure in K–3." />
      </div>
    ),
    education: (
      <div className="space-y-3">
        <Row label="Bachelor's Degree or Higher (25+)" value={`${n.education.collegeAttainment}%`} benchmark={`National: ${data.benchmarks.collegeAttainment}%`} sev={n.education.severity} />
        <Row label="Adults Without College Degree" value={`${n.education.firstGenProxy}%`} />
        <Insight text="Low college attainment = high first-generation household rate. First-gen status is not just a financial problem — it's an information and cultural norm problem. When no one in the household has navigated FAFSA, college feels abstract. This is the generational engine of the cycle." />
      </div>
    ),
    language: (
      <div className="space-y-3">
        <Row label="Speak Non-English at Home" value={`${n.language.nonEnglishRate}%`} benchmark={`National: ~${data.benchmarks.nonEnglishAtHome}%`} sev={n.language.severity} />
        <Row label="Foreign-Born Population" value={`${n.language.foreignBornRate}%`} benchmark={`National: ~${data.benchmarks.foreignBorn}%`} />
        <Row label="Foreign-Born Count" value={n.language.foreignBornCount?.toLocaleString()} />
        <Insight text="Non-English-speaking households face simultaneous barriers: wage ceilings for workers, ELL identification lags for children, and language-blocked health system access. Fast-growing multilingual populations in school districts frequently outpace ELL staffing capacity — underidentified students get mis-placed and the trajectory is hard to correct after 4th grade." />
      </div>
    ),
    health: (
      <div className="space-y-3">
        <Row label="Uninsured Rate" value={`${n.health.uninsuredRate}%`} benchmark={`National: ~${data.benchmarks.uninsuredRate}%`} sev={n.health.severity} />
        <Row label="Estimated Uninsured Count" value={n.health.uninsuredCount?.toLocaleString()} />
        <Insight text="Uninsured households delay or avoid mental health care until crisis. That crisis surfaces in schools — behavioral incidents, attendance gaps, emergency counseling calls. The school counselor RFP directly absorbs unmet community mental health need. Every percentage point of uninsured rate translates to predictable school crisis volume." />
      </div>
    ),
    youth: (
      <div className="space-y-3">
        <Row label="Population Under 18" value={`${n.youth.under18Rate}%`} benchmark={`National: ~${data.benchmarks.under18Share}%`} sev={n.youth.severity} />
        <Row label="Under-18 Count" value={n.youth.under18Count?.toLocaleString()} />
        <Row label="Total Households" value={n.youth.totalHouseholds?.toLocaleString()} />
        <Insight text="A high under-18 share signals concentrated school demand — more children per adult than the national average, which stresses school capacity, counselor caseloads, and family economics simultaneously." />
      </div>
    ),
    schools: (
      <div className="space-y-3">
        <Row
          label="K-12 Enrollment"
          value={n.schools.totalEnrollment > 0 ? n.schools.totalEnrollment.toLocaleString() : "Unavailable"}
          benchmark={n.schools.enrollmentSource || "Census ACS B14001"}
        />
        {n.schools.districtPovertyPct !== null && n.schools.districtPovertyPct !== undefined && (
          <Row
            label="Students in Poverty (SAIPE)"
            value={`${n.schools.districtPovertyPct?.toFixed(1)}%`}
            benchmark="National FRL proxy"
            sev={n.schools.districtPovertyPct > 20 ? "red" : n.schools.districtPovertyPct > 12 ? "amber" : "green"}
          />
        )}
        {n.schools.districts.slice(0, 3).map((d: any) => (
          <div key={d.leaid} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-sm">
            <p className="font-semibold text-slate-800 dark:text-slate-200">{d.lea_name}</p>
            <p className="text-slate-500">{d.enrollment?.toLocaleString()} students · {d.county_name}</p>
          </div>
        ))}
        <Insight text="K-12 enrollment (Census ACS) covers all public and private school students. School poverty rate (SAIPE) is the strongest proxy for counseling and wraparound service demand — districts above 20% qualify for most federal Title I supplemental program funding." />
      </div>
    ),
    demographics: (
      <div className="space-y-3">
        <Row label="Total Population" value={n.demographics.totalPopulation?.toLocaleString()} />
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["White non-Hispanic", n.demographics.whitePct],
            ["Hispanic/Latino", n.demographics.hispanicPct],
            ["Black/African American", n.demographics.blackPct],
            ["Asian", n.demographics.asianPct],
          ].map(([label, pct]) => (
            <div key={label as string} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{Number(pct).toFixed(1)}%</p>
            </div>
          ))}
        </div>
        <Insight text="Racial/ethnic composition shapes which language services, cultural competency requirements, and equity considerations apply to any RFP response. Programs serving diverse populations need staffing that reflects community demographics." />
      </div>
    ),
  };

  return (
    <Card className="mt-4 border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{NODE_LABELS[id] || id} — Detail</span>
          <Badge variant="outline" className="text-xs">ACS 2022</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>{panels[id] || <p className="text-sm text-slate-500">No detail available.</p>}</CardContent>
    </Card>
  );
}

function Row({ label, value, benchmark, sev }: { label: string; value: string; benchmark?: string; sev?: "green"|"amber"|"red" }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {sev && <SevIcon s={sev} />}{value}
        </span>
        {benchmark && <p className="text-[10px] text-slate-400">{benchmark}</p>}
      </div>
    </div>
  );
}

function Insight({ text }: { text: string }) {
  return (
    <div className="mt-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
      <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EcosystemIntelPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rfpInput, setRfpInput] = useState("");
  const [selectedCounty, setSelectedCounty] = useState<CountyMatch | null>(null);
  const [activeRfp, setActiveRfp] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNarrative, setShowNarrative] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Debounce search input — avoid firing a request on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const searchQuery = useQuery<CountyMatch[]>({
    queryKey: ["/api/ecosystem-intel/search", debouncedSearch],
    enabled: debouncedSearch.length >= 3 && !selectedCounty,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/ecosystem-intel/search?q=${encodeURIComponent(debouncedSearch)}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const matches = searchQuery.data ?? [];

  const ecosystemQuery = useQuery<EcosystemData>({
    queryKey: ["/api/ecosystem-intel/county", selectedCounty?.stateFips, selectedCounty?.countyFips, activeRfp],
    enabled: !!selectedCounty,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!selectedCounty) throw new Error("No county selected");
      const params = new URLSearchParams({
        stateFips: selectedCounty.stateFips,
        countyFips: selectedCounty.countyFips,
        county: selectedCounty.name,
        ...(activeRfp ? { rfpContext: activeRfp } : {}),
      });
      const res = await fetch(`/api/ecosystem-intel/county?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const data = ecosystemQuery.data;

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setSelectedCounty(null);
    setSelectedNode(null);
    setSearchOpen(true);
  }, []);

  const selectCounty = (c: CountyMatch) => {
    setSelectedCounty(c);
    setSearchInput(c.name);
    setSearchOpen(false);
    setSelectedNode(null);
  };

  const handleRun = () => {
    setActiveRfp(rfpInput);
    setSelectedNode(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && matches.length > 0 && !selectedCounty) selectCounty(matches[0]);
    else if (e.key === "Enter" && selectedCounty) handleRun();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-950 dark:to-indigo-950/10">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-full px-4 py-1.5 text-sm text-indigo-700 dark:text-indigo-300 mb-3">
            <span>🔬</span>
            <span>Ecosystem Intelligence — ThriveUp Academy</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">County Socioeconomic Chainweb</h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
            Live data from the U.S. Census Bureau ACS and NCES. Search any U.S. county to see the interconnected web of socioeconomic forces — and how they map to your RFP context.
          </p>
        </div>

        {/* Search bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchInput}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                onFocus={() => setSearchOpen(true)}
                placeholder='e.g. "Barrow County, GA" or "Travis County, TX"'
                className="pl-9"
                data-testid="input-county-search"
              />
              {searchOpen && matches.length > 0 && !selectedCounty && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  {matches.map(m => (
                    <button key={`${m.stateFips}-${m.countyFips}`}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                      onClick={() => selectCounty(m)}
                      data-testid={`option-county-${m.countyFips}`}>
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <Input
                value={rfpInput}
                onChange={e => setRfpInput(e.target.value)}
                placeholder='Optional: RFP context (e.g. "school crisis counselors")'
                data-testid="input-rfp-context"
              />
            </div>
            <Button onClick={handleRun} disabled={!selectedCounty || ecosystemQuery.isFetching}
              className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="button-run-analysis">
              {ecosystemQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Analyze
            </Button>
          </div>
          {rfpInput && selectedCounty && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              RFP context active — dashed rings show relevant nodes
              <button onClick={() => { setRfpInput(""); setActiveRfp(""); }} className="ml-1 text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>
            </div>
          )}
        </div>

        {/* Loading */}
        {ecosystemQuery.isFetching && (
          <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Pulling live Census + NCES data for {selectedCounty?.name}…</span>
          </div>
        )}

        {/* Error */}
        {ecosystemQuery.isError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            Data fetch failed: {(ecosystemQuery.error as any)?.message}. Check the county name and try again.
          </div>
        )}

        {/* Main content */}
        {data && !ecosystemQuery.isFetching && (
          <div className="space-y-6">

            {/* County header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{data.county}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  <ExternalLink className="h-3 w-3 inline mr-1" />
                  Source: {data.dataSource} · {data.dataYear}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["green","amber","red"] as const).map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{ background: SEV_BG[s], borderColor: SEV_RING[s], color: SEV_COLOR[s] }}>
                    <SevIcon s={s} />
                    {s === "green" ? "At or above national" : s === "amber" ? "Moderate concern" : "Critical — below national"}
                  </span>
                ))}
              </div>
            </div>

            {/* Layout: Chainweb left, Demographics + Controls right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Chainweb — takes 2 cols */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                      <span>Socioeconomic Chainweb — click any node for detail</span>
                      {selectedNode && (
                        <button onClick={() => setSelectedNode(null)} className="text-xs text-indigo-600 hover:underline">Clear selection</button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ChainwebSVG data={data} selectedNode={selectedNode} onSelect={setSelectedNode} />
                  </CardContent>
                </Card>
                {selectedNode && <NodeDetail id={selectedNode} data={data} />}
              </div>

              {/* Right column: Demographics + Nodes summary */}
              <div className="space-y-4">
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1.5">
                    <Row label="Total Population" value={data.nodes.demographics.totalPopulation?.toLocaleString()} />
                    <Row label="Under 18" value={`${data.nodes.youth.under18Count?.toLocaleString()} (${data.nodes.youth.under18Rate}%)`} />
                    <div className="pt-1 space-y-1">
                      {[
                        ["White non-Hispanic", data.nodes.demographics.whitePct],
                        ["Hispanic/Latino", data.nodes.demographics.hispanicPct],
                        ["Black/African American", data.nodes.demographics.blackPct],
                        ["Asian", data.nodes.demographics.asianPct],
                      ].map(([label, pct]) => (
                        <div key={label as string} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-slate-500">{label}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{Number(pct).toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Node severity summary */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Node Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {Object.entries(NODE_LABELS).map(([id, label]) => {
                      const sev = NODE_SEVERITY[id]?.(data.nodes) ?? "green";
                      const metric = NODE_METRICS[id]?.((data.nodes as any)[id === "schools" ? "schools" : id === "youth" ? "youth" : id]);
                      return (
                        <button key={id} onClick={() => setSelectedNode(id === selectedNode ? null : id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedNode === id ? "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                          data-testid={`button-node-${id}`}>
                          <span className="flex items-center gap-2">
                            <SevIcon s={sev} />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                          </span>
                          <span className="text-xs text-slate-500">{metric || "–"}</span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Chainweb narrative */}
            {data.chainwebNarrative.length > 0 && (
              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-2">
                  <button onClick={() => setShowNarrative(s => !s)}
                    className="flex items-center justify-between w-full text-left">
                    <CardTitle className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      Data-Driven Chainweb Analysis — {data.county}
                    </CardTitle>
                    {showNarrative ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                </CardHeader>
                {showNarrative && (
                  <CardContent className="space-y-3">
                    {data.chainwebNarrative.map((para, i) => (
                      <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{para}</p>
                    ))}
                    {data.rfpContext && (
                      <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">RFP Context: {data.rfpContext}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Highlighted nodes ({data.rfpRelevantNodes.map(n => NODE_LABELS[n]).join(", ")}) represent the primary socioeconomic drivers most relevant to this RFP. Each dashed-ring node should be documented in your needs assessment narrative with the specific data points shown above.
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Edges table */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Causal Linkages in This County</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left py-1.5 pr-4">From</th>
                        <th className="text-left py-1.5 pr-4">To</th>
                        <th className="text-left py-1.5 pr-4">Mechanism</th>
                        <th className="text-left py-1.5">Strength</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.edges.map((e, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-1.5 pr-4 font-medium text-slate-700 dark:text-slate-300">{NODE_LABELS[e.from]}</td>
                          <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-400">{NODE_LABELS[e.to]}</td>
                          <td className="py-1.5 pr-4 text-slate-500 italic">{e.label}</td>
                          <td className="py-1.5">
                            <Badge variant={e.strength === "strong" ? "default" : "secondary"} className="text-[10px]">{e.strength}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Empty state */}
        {!data && !ecosystemQuery.isFetching && !ecosystemQuery.isError && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-6xl mb-4">🕸️</div>
            <p className="text-lg font-medium text-slate-500">Search any U.S. county to build the chainweb.</p>
            <p className="text-sm mt-2 text-slate-400">Pulls live Census + NCES data. No templates. No generic outputs.</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Barrow County, GA", "Travis County, TX", "Cook County, IL", "Maricopa County, AZ"].map(ex => (
                <button key={ex} onClick={() => { setSearchInput(ex); setSearchOpen(true); }}
                  className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 transition-colors"
                  data-testid={`example-${ex.replace(/\s/g, "-").toLowerCase()}`}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
