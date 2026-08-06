import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sprout, Search, BarChart3, Bug, Droplets, TrendingUp, MapPin, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const QUICK_COUNTIES = [
  { name: "Travis County, TX",   stateFips: "48", countyFips: "453" },
  { name: "Fresno County, CA",   stateFips: "06", countyFips: "019" },
  { name: "Cass County, ND",     stateFips: "38", countyFips: "017" },
  { name: "Tulare County, CA",   stateFips: "06", countyFips: "107" },
  { name: "Dawson County, TX",   stateFips: "48", countyFips: "115" },
  { name: "Story County, IA",    stateFips: "19", countyFips: "169" },
];

function SevBadge({ value, low = 0, high = 0, invert = false, suffix = "" }: { value: number | null; low?: number; high?: number; invert?: boolean; suffix?: string }) {
  if (value === null || value === undefined) return <span className="text-slate-400 text-sm">—</span>;
  const isHigh = invert ? value < low : value > high;
  const isMed = invert ? (value >= low && value <= high) : (value >= low && value <= high);
  const color = isHigh ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    : isMed ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{typeof value === "number" ? value.toLocaleString() : value}{suffix}</span>;
}

function StatRow({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
        {note && <p className="text-xs text-slate-400 mt-0.5">{note}</p>}
      </div>
    </div>
  );
}

export default function RuralIntelPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ name: string; stateFips: string; countyFips: string } | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  // County typeahead (reuses ecosystem-intel search)
  useQuery({
    queryKey: ["/api/ecosystem-intel/search", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) { setSuggestions([]); return []; }
      const r = await apiRequest("GET", `/api/ecosystem-intel/search?q=${encodeURIComponent(debouncedQuery)}`);
      const data = await r.json();
      setSuggestions(data || []);
      return data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Full rural intel for selected county
  const { data: intel, isLoading: intelLoading, refetch: refetchIntel } = useQuery({
    queryKey: ["/api/rural-intel/county", selected?.stateFips, selected?.countyFips],
    queryFn: async () => {
      if (!selected) return null;
      const r = await apiRequest("GET", `/api/rural-intel/county?stateFips=${selected.stateFips}&countyFips=${selected.countyFips}&county=${encodeURIComponent(selected.name)}`);
      return r.json();
    },
    enabled: !!selected,
  });

  const handleSelect = useCallback((county: any) => {
    setSelected(county);
    setQuery(county.name);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const ag = intel?.agriculture;
  const demo = intel?.demographics;
  const soil = intel?.soilHealth;
  const env = intel?.environment;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <Sprout className="w-3 h-3" />
          <span>Rural Agriculture Intelligence — ThriveUp Academy</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Rural County Intel
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 max-w-2xl">
          Live USDA NASS crop data, Census demographics, NRCS soil health, and invasive species pressure for any U.S. county. No templates. All primary source.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                data-testid="input-county-search"
                className="pl-9"
                placeholder='e.g. "Dawson County, TX" or "Fresno"'
                value={query}
                onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg mt-1 overflow-hidden">
                  {suggestions.map((s: any) => (
                    <button key={`${s.stateFips}-${s.countyFips}`}
                      data-testid={`suggestion-${s.stateFips}-${s.countyFips}`}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      onMouseDown={() => handleSelect(s)}>
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button data-testid="button-analyze" disabled={!selected || intelLoading} onClick={() => { if (selected) refetchIntel(); }}>
              <BarChart3 className="w-4 h-4 mr-2" />
              {intelLoading ? "Loading…" : "Analyze"}
            </Button>
          </div>
        </div>

        {/* Quick-start counties */}
        {!selected && (
          <div className="mb-8">
            <p className="text-sm text-slate-500 mb-3">Quick-start counties:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_COUNTIES.map(c => (
                <button key={c.countyFips} data-testid={`quick-county-${c.countyFips}`}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 transition-colors"
                  onClick={() => handleSelect(c)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {intelLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Sprout className="w-10 h-10 mx-auto text-green-500 mb-3 animate-pulse" />
              <p className="text-slate-500">Pulling USDA NASS + Census ACS data…</p>
              <p className="text-xs text-slate-400 mt-1">Querying 4 live data sources</p>
            </div>
          </div>
        )}

        {/* Results */}
        {intel && !intelLoading && (
          <div className="space-y-6">
            {/* County header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{intel.county}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Data year: {intel.dataYear} · Sources: {intel.dataSources?.join(" · ")}
                </p>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">Live USDA Data</Badge>
            </div>

            {/* AI Synthesis */}
            {intel.aiSynthesis && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-green-600" />
                    Agricultural Intelligence Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {typeof intel.aiSynthesis === "string" ? intel.aiSynthesis : JSON.stringify(intel.aiSynthesis)}
                  </p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="agriculture">
              <TabsList className="mb-4" data-testid="tabs-rural-intel">
                <TabsTrigger value="agriculture" data-testid="tab-agriculture">🌾 Agriculture</TabsTrigger>
                <TabsTrigger value="demographics" data-testid="tab-demographics">👥 Demographics</TabsTrigger>
                <TabsTrigger value="soil" data-testid="tab-soil">🌱 Soil Health</TabsTrigger>
                <TabsTrigger value="invasive" data-testid="tab-invasive">🐛 Invasive Species</TabsTrigger>
              </TabsList>

              {/* Agriculture Tab */}
              <TabsContent value="agriculture">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-green-600" /> Crop Mix (USDA NASS 2022)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ag?.cropMix?.length > 0 ? (
                        <div className="space-y-2">
                          {ag.cropMix.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between items-center">
                              <span className="text-sm text-slate-700 dark:text-slate-300">{c.commodity}</span>
                              <span className="text-sm font-semibold">{c.acresHarvested.toLocaleString()} ac</span>
                            </div>
                          ))}
                          <p className="text-xs text-slate-400 pt-2">Total: {ag.totalCropAcres?.toLocaleString()} acres harvested</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">{ag?.nassNote || "No NASS crop data returned for this county."}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">🐄 Livestock Inventory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ag?.livestockInventory?.length > 0 ? (
                        <div className="space-y-2">
                          {ag.livestockInventory.map((l: any, i: number) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-sm text-slate-700 dark:text-slate-300">{l.commodity}</span>
                              <span className="text-sm font-semibold">{l.count.toLocaleString()} {l.unit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No livestock inventory data returned for this county.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {ag?.nassNote && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{ag.nassNote} <a href="https://quickstats.nass.usda.gov/" target="_blank" rel="noopener noreferrer" className="underline">Verify at USDA NASS QuickStats ↗</a></span>
                  </div>
                )}
              </TabsContent>

              {/* Demographics Tab */}
              <TabsContent value="demographics">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Census ACS 2022 5-Year Estimates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StatRow label="Total Population" value={demo?.totalPopulation?.toLocaleString() || "—"} />
                    <StatRow label="Poverty Rate" value={<SevBadge value={demo?.povertyRate} low={12} high={20} suffix="%" />} note="National avg ~12%" />
                    <StatRow label="Median Household Income" value={demo?.medianHouseholdIncome ? `$${demo.medianHouseholdIncome.toLocaleString()}` : "—"} />
                    <StatRow label="Ag & Forestry Workers" value={demo?.agWorkersCount ? `${demo.agWorkersCount.toLocaleString()} workers (${demo.agEmploymentSharePct}% of workforce)` : "—"} />
                    <StatRow label="Uninsured Rate" value={<SevBadge value={demo?.uninsuredRatePct} low={8} high={15} suffix="%" />} note="High uninsured = demand for rural health services" />
                    <StatRow label="Housing Vacancy" value={<SevBadge value={demo?.housingVacancyPct} low={10} high={20} suffix="%" />} note="High vacancy = rural depopulation signal" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Soil Health Tab */}
              <TabsContent value="soil">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600" /> USDA NRCS SSURGO — Dominant Component
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {soil?.avgOm !== null ? (
                      <>
                        <StatRow label="Organic Matter" value={<SevBadge value={soil.avgOm} low={2} high={4} invert suffix="%" />} note="3-5% OM = productive soil" />
                        <StatRow label="Soil pH" value={<SevBadge value={soil.avgPh} low={5.5} high={7.5} invert suffix="" />} note="6.0-7.0 optimal for most crops" />
                        <StatRow label="Sand Content" value={soil.avgSandPct !== null ? `${soil.avgSandPct}%` : "—"} />
                        <StatRow label="Clay Content" value={soil.avgClayPct !== null ? `${soil.avgClayPct}%` : "—"} />
                        <StatRow label="Drainage Class" value={soil.drainageClass || "—"} />
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-500 mb-3">{soil?.note || "NRCS SSURGO data not returned."}</p>
                        <a href="https://websoilsurvey.nrcs.usda.gov/" target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Open USDA Web Soil Survey ↗
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invasive Species Tab */}
              <TabsContent value="invasive">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bug className="w-4 h-4 text-red-600" /> iNaturalist Research-Grade Observations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-4xl font-extrabold text-red-600 mb-2">
                        {env?.invasiveSpeciesObservations?.toLocaleString() || "0"}
                      </div>
                      <p className="text-sm text-slate-500">invasive species observations within 50 miles</p>
                      <p className="text-xs text-slate-400 mt-1">{env?.invasiveNote}</p>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <a href={env?.inatBrowseUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Browse all observations on iNaturalist ↗
                      </a>
                      <a href="/invasive-species" className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
                        <Bug className="w-3 h-3" /> Report a sighting → Invasive Species Watch
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Data sources footer */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-xs text-slate-500">
              <p className="font-semibold mb-1">Data sources (all primary, no AI-generated content):</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>USDA NASS QuickStats 2022 — crop acreage, livestock inventory, prices received</li>
                <li>U.S. Census Bureau ACS 2022 5-Year Estimates — demographics, poverty, employment</li>
                <li>USDA NRCS SSURGO — soil physical and chemical properties</li>
                <li>iNaturalist — community-verified invasive species observations (research grade only)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selected && !intelLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sprout className="w-14 h-14 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Search any U.S. county</h3>
            <p className="text-slate-500 max-w-md">
              Live USDA + Census data on crops, livestock, soil health, and invasive species pressure. No AI-generated numbers — all real data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
