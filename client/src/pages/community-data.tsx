/**
 * Community Data — public nationwide homelessness data lookup.
 * Search any city, county, state, or ZIP → see the local CoC's official HUD
 * PIT trend (2007–present) with source citation and data vintage, plus a
 * cited live-research assistant.
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EvidenceSummary } from "@/components/evidence-label";
import { AIAugmentationDisclosure } from "@/components/ai-augmentation-disclosure";
import { Search, MapPin, TrendingUp, ExternalLink, Loader2, Globe } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

type SearchResult = {
  cocNumber: string; cocName: string; state: string; year: number;
  overallHomeless: number | null; unaccompaniedYouthUnder25: number | null; unshelteredHomeless: number | null;
};
type TrendResponse = {
  cocNumber: string; cocName: string; state: string;
  trend: Array<{ year: number; overallHomeless: number | null; unaccompaniedYouthUnder25: number | null; unshelteredHomeless: number | null }>;
  source: string; sourceCitation: string; dataVintage: string;
};

export default function CommunityDataPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selectedCoc, setSelectedCoc] = useState<string | null>(null);
  const [researchQ, setResearchQ] = useState("");

  const search = useQuery<{ results: SearchResult[]; note: string | null; source: string }>({
    queryKey: ["/api/community-data/pit/search", submitted],
    queryFn: async () => {
      const r = await fetch(`/api/community-data/pit/search?q=${encodeURIComponent(submitted)}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Search failed");
      return r.json();
    },
    enabled: submitted.length >= 2,
  });

  const trend = useQuery<TrendResponse>({
    queryKey: ["/api/community-data/pit", selectedCoc],
    queryFn: async () => {
      const r = await fetch(`/api/community-data/pit/${selectedCoc}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Lookup failed");
      return r.json();
    },
    enabled: !!selectedCoc,
  });

  const research = useMutation<{ answer: string; citations: string[] }, Error, void>({
    mutationFn: async () => {
      const place = trend.data ? `${trend.data.cocName} (${trend.data.cocNumber})` : submitted;
      const r = await fetch("/api/community-data/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: researchQ, place }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Research failed");
      return r.json();
    },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-community-data-title">
          <Globe className="h-7 w-7 text-primary" /> Community Data — Homelessness, Nationwide
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Official HUD Point-in-Time counts for every Continuum of Care in America — every year HUD has
          published, starting in 2007. Search your city, county, state, or ZIP code. Every figure traces to
          the official federal file with its release year and import date shown — nothing is estimated.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); setSelectedCoc(null); setSubmitted(query.trim()); }}
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “Wichita”, “KS”, “Austin”, or a ZIP like 78753"
              data-testid="input-community-search"
            />
            <Button type="submit" disabled={query.trim().length < 2} data-testid="button-community-search">
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
          </form>
          {search.data?.note && (
            <p className="text-sm text-muted-foreground mt-3" data-testid="text-search-note">{search.data.note}</p>
          )}
        </CardContent>
      </Card>

      {search.isError && (
        <Alert variant="destructive"><AlertDescription>{(search.error as Error).message}</AlertDescription></Alert>
      )}
      {search.isLoading && submitted && (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
      )}

      {search.data && search.data.results.length === 0 && (
        <Alert><AlertDescription>No Continuum of Care matched that search. Try the nearest big city or your two-letter state code.</AlertDescription></Alert>
      )}

      {search.data && search.data.results.length > 0 && !selectedCoc && (
        <div className="grid gap-3 md:grid-cols-2">
          {search.data.results.map((r) => (
            <Card
              key={r.cocNumber}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedCoc(r.cocNumber)}
              data-testid={`card-coc-${r.cocNumber}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary shrink-0" />{r.cocName}</span>
                  <Badge variant="outline">{r.cocNumber}</Badge>
                </CardTitle>
                <CardDescription>{r.year} Point-in-Time count</CardDescription>
              </CardHeader>
              <CardContent className="text-sm grid grid-cols-3 gap-2">
                <div><div className="font-semibold">{r.overallHomeless ?? "—"}</div><div className="text-muted-foreground text-xs">Total</div></div>
                <div><div className="font-semibold">{r.unshelteredHomeless ?? "—"}</div><div className="text-muted-foreground text-xs">Unsheltered</div></div>
                <div><div className="font-semibold">{r.unaccompaniedYouthUnder25 ?? "—"}</div><div className="text-muted-foreground text-xs">Youth &lt;25</div></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCoc && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {trend.data ? `${trend.data.cocName} (${trend.data.cocNumber})` : selectedCoc}
                </CardTitle>
                {trend.data && (
                  <CardDescription className="mt-1">
                    Official HUD Point-in-Time trend, {trend.data.trend[0]?.year}–{trend.data.trend[trend.data.trend.length - 1]?.year}
                  </CardDescription>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedCoc(null)} data-testid="button-back-to-results">
                Back to results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {trend.data && (
              <EvidenceSummary claims={[{
                value: trend.data.trend[trend.data.trend.length - 1]?.overallHomeless ?? null, unit: "people", source: "U.S. Census Bureau ACS 5-Year 2022",
                sourceId: "census-acs5-2022", asOfDate: "2022-12-31", geographyKey: trend.data.cocNumber, confidence: "estimated",
                decisionCaption: "Use local estimates alongside the published Point-in-Time trend to understand community conditions.",
              }]} />
            )}
            {trend.isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading trend…</div>}
            {trend.isError && <Alert variant="destructive"><AlertDescription>{(trend.error as Error).message}</AlertDescription></Alert>}
            {trend.data && (
              <>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.data.trend} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="year" fontSize={12} />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="overallHomeless" name="Total homeless" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="unshelteredHomeless" name="Unsheltered" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="unaccompaniedYouthUnder25" name="Unaccompanied youth <25" stroke="#e11d48" strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-3" data-testid="text-source-citation">
                  Source: {trend.data.sourceCitation}. Imported {new Date(trend.data.dataVintage).toLocaleDateString()} from {trend.data.source}.
                  Unaccompanied-youth counts begin in 2015 (not collected by HUD before then).
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ask a live research question</CardTitle>
          <CardDescription>
            Answers come from current, verifiable sources with citations — official sources preferred. Limited to 10 questions per hour.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (researchQ.trim().length >= 8) research.mutate(); }}>
            <Input
              value={researchQ}
              onChange={(e) => setResearchQ(e.target.value)}
              placeholder="e.g. What shelters serve youth in Sedgwick County?"
              data-testid="input-research-question"
            />
            <Button type="submit" disabled={researchQ.trim().length < 8 || research.isPending} data-testid="button-research">
              {research.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
            </Button>
          </form>
          {research.isError && <Alert variant="destructive"><AlertDescription>{research.error.message}</AlertDescription></Alert>}
          {research.data && (
            <>
            <div className="space-y-2" data-testid="text-research-answer">
              <p className="text-sm whitespace-pre-wrap">{research.data.answer}</p>
              {research.data.citations.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Sources</div>
                  {research.data.citations.map((c, i) => (
                    <a key={i} href={c} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline break-all">
                      <ExternalLink className="h-3 w-3 shrink-0" /> {c}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <AIAugmentationDisclosure
              compact
              drewFrom={research.data.citations}
              doesNotKnow={["information not included in the cited sources", "individual circumstances"]}
              verifyWith="The original cited source and local service providers"
            />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
