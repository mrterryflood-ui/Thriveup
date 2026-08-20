import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Activity, ExternalLink, MapPin, RefreshCw, ShieldAlert } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type TrendData = {
  generatedAt: string;
  filters: { state: string | null; city: string | null; days: number };
  observations: { state: string; county: string | null; city: string | null; date: string; detectionRate: number | null; percentile: number | null; populationServed: number | null; source: string; status: string }[];
  trend: { date: string; averageDetectionRate: number | null; reportingSites: number }[];
  rplIceOutbreakFindings: { id: string; receivedAt: string; region: string | null; finding: string | null; evidenceLevel: string | null; citations: string[] }[];
  sources: { name: string; url: string; type: string }[];
  coverage: { virusObservation: string; rpliceOutbreaks: string };
};

const fmt = (value: number | null | undefined, digits = 0) => value == null ? "Unavailable" : value.toLocaleString("en-US", { maximumFractionDigits: digits });

export default function VirusTrendsPage() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [submitted, setSubmitted] = useState({ state: "", city: "" });
  const query = useQuery<TrendData>({
    queryKey: ["/api/public-health/virus-trends", submitted],
    queryFn: async () => {
      const params = new URLSearchParams({ days: "90" });
      if (submitted.state) params.set("state", submitted.state);
      if (submitted.city) params.set("city", submitted.city);
      const response = await apiRequest("GET", `/api/public-health/virus-trends?${params}`);
      return response.json();
    },
    staleTime: 15 * 60 * 1000,
  });
  const data = query.data;

  return (
    <main className="max-w-6xl mx-auto px-4 pb-20 pt-6 space-y-7" data-testid="virus-trends-page">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
          <Activity className="h-4 w-4" /> Community health signals
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Virus & outbreak trends</h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore observed SARS-CoV-2 wastewater signals by state, county, and reporting site,
          alongside outbreak-related evidence received from RPLICE.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Observed ≠ modeled</span><span>•</span><span>Missing data ≠ zero activity</span>
          {data?.generatedAt && <><span>•</span><span>Updated {new Date(data.generatedAt).toLocaleString()}</span></>}
        </div>
      </header>

      <Card data-testid="virus-trends-filters">
        <CardContent className="pt-6">
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(event) => { event.preventDefault(); setSubmitted({ state: state.trim().toUpperCase(), city: city.trim() }); }}>
            <Input value={state} onChange={(event) => setState(event.target.value)} placeholder="State code (TX)" aria-label="State code" maxLength={2} />
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City or reporting site (optional)" aria-label="City or reporting site" />
            <Button type="submit" data-testid="virus-trends-apply"><MapPin className="h-4 w-4 mr-2" /> Apply geography</Button>
            <Button type="button" variant="outline" onClick={() => { setState(""); setCity(""); setSubmitted({ state: "", city: "" }); }}><RefreshCw className="h-4 w-4 mr-2" /> National</Button>
          </form>
        </CardContent>
      </Card>

      {query.isError && <Card className="border-destructive"><CardContent className="pt-6 flex items-center gap-3 text-destructive"><AlertTriangle className="h-5 w-5" /> Unable to load virus observations. <Button variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button></CardContent></Card>}
      {query.isLoading && <div className="grid gap-5 md:grid-cols-2"><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>}

      {data && !query.isError && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground uppercase">Reporting observations</p><p className="text-2xl font-bold">{fmt(data.observations.length)}</p><p className="text-xs text-muted-foreground mt-1">last {data.filters.days} days</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground uppercase">Reporting sites</p><p className="text-2xl font-bold">{fmt(new Set(data.observations.map((row) => row.city ?? row.county ?? row.state)).size)}</p><p className="text-xs text-muted-foreground mt-1">in returned coverage</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground uppercase">RPLICE findings</p><p className="text-2xl font-bold">{fmt(data.rplIceOutbreakFindings.length)}</p><p className="text-xs text-muted-foreground mt-1">evidence events, not case counts</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground uppercase">Geography</p><p className="text-2xl font-bold">{data.filters.state ?? "US"}</p><p className="text-xs text-muted-foreground mt-1">{data.filters.city ?? "all available sites"}</p></CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card data-testid="virus-trend-chart">
              <CardHeader><CardTitle className="text-base">Observed wastewater detection trend</CardTitle><p className="text-sm text-muted-foreground">Average 15-day detection proportion across returned reporting sites. This is a surveillance signal, not a case estimate.</p></CardHeader>
              <CardContent>
                {data.trend.length ? <ResponsiveContainer width="100%" height={300}><LineChart data={data.trend} margin={{ left: 0, right: 14, top: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={25} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${Math.round(value * 100)}%`} /><Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Average detection"]} /><Line type="monotone" dataKey="averageDetectionRate" stroke="#0891b2" strokeWidth={2} dot={false} connectNulls /></LineChart></ResponsiveContainer> : <div className="h-72 grid place-items-center text-sm text-muted-foreground">No CDC observations match this geography and time window.</div>}
              </CardContent>
            </Card>
            <Card data-testid="rplice-outbreak-feed">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-600" /> RPLICE outbreak evidence</CardTitle><p className="text-sm text-muted-foreground">Inbound evidence events containing outbreak, virus, infectious disease, or pathogen language.</p></CardHeader>
              <CardContent className="space-y-3">
                {data.rplIceOutbreakFindings.length ? data.rplIceOutbreakFindings.map((finding) => <article key={finding.id} className="border-l-2 border-amber-400 pl-3 space-y-1"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline">{finding.evidenceLevel ?? "unspecified"}</Badge>{finding.region ?? "No region"}<span>•</span>{new Date(finding.receivedAt).toLocaleDateString()}</div><p className="text-sm">{finding.finding ?? "RPLICE event did not include a finding summary."}</p></article>) : <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">No outbreak-related RPLICE events are available in this running process. That is an availability statement, not a claim that no outbreaks exist.</div>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Latest reporting observations</CardTitle><p className="text-sm text-muted-foreground">Rows are limited and aggregate. Detection values come directly from the CDC NWSS response.</p></CardHeader>
            <CardContent><div className="overflow-x-auto"><table className="w-full text-sm" data-testid="virus-observations-table"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">State</th><th className="py-2 pr-4">Site / county</th><th className="py-2 pr-4">Detection</th><th className="py-2">Percentile</th></tr></thead><tbody>{data.observations.slice(0, 20).map((row, index) => <tr key={`${row.date}-${row.state}-${index}`} className="border-b last:border-0"><td className="py-2 pr-4 whitespace-nowrap">{row.date}</td><td className="py-2 pr-4">{row.state}</td><td className="py-2 pr-4">{row.city ?? row.county ?? "Unavailable"}</td><td className="py-2 pr-4">{row.detectionRate == null ? "Unavailable" : `${(row.detectionRate * 100).toFixed(1)}%`}</td><td className="py-2">{row.percentile == null ? "Unavailable" : `${(row.percentile * 100).toFixed(1)}%`}</td></tr>)}</tbody></table>{!data.observations.length && <p className="py-8 text-center text-sm text-muted-foreground">No observations returned for this filter.</p>}</div></CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader><CardTitle className="text-base">Read the coverage correctly</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground"><p><strong className="text-foreground">CDC observation:</strong> {data.coverage.virusObservation}</p><p><strong className="text-foreground">RPLICE evidence:</strong> {data.coverage.rpliceOutbreaks}</p><div className="flex flex-wrap gap-3 pt-1">{data.sources.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">{source.name} <ExternalLink className="h-3 w-3" /></a>)}</div></CardContent>
          </Card>
        </>
      )}
    </main>
  );
}