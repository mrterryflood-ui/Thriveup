import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, X, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseJourneyContext, describeJourneyPlace } from "@shared/journey-context";

/**
 * Place-scoped evidence panel for resident-chain routes that have no selector of their own
 * (/corridor-intelligence, /impact). Reads `?place=` on mount, pre-fills the input, shows
 * "Showing: {place}" with a clear control, and renders the public county profile for that place.
 *
 * Fetches only when a place is carried — there is no default city. The profile endpoint resolves
 * ZIP / city, ST / county:FIPS and labels every indicator with source, vintage, coverage and scope.
 */

type Coverage = "observed" | "modeled" | "unavailable";
interface Indicator { id: string; label: string; value: number | null; unit: "count" | "usd" | "percent" | "ratio"; source: string; vintage: string; coverage: Coverage; scope: string; note?: string; href: string }
interface Profile { geography: { label: string; state: string; stateName: string; counties: { fips: string; name: string }[]; resolvedFrom: string }; indicators: Indicator[]; limits: string[]; generatedAt: string }

function formatValue(i: Indicator) {
  if (i.value === null || i.coverage === "unavailable") return "Not available";
  if (i.unit === "usd") return `$${Math.round(i.value).toLocaleString()}`;
  if (i.unit === "percent") return `${i.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  if (i.unit === "ratio") return i.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return Math.round(i.value).toLocaleString();
}

export function JourneyPlaceEvidence({ path, title, description, indicatorIds }: {
  path: string;
  title: string;
  description: string;
  /** Optional subset of indicator ids to show; defaults to all returned. */
  indicatorIds?: string[];
}) {
  const search = useSearch();
  const [, navigate] = useLocation();
  const place = parseJourneyContext(search).place ?? "";
  const [draft, setDraft] = useState(place);
  useEffect(() => { setDraft(place); }, [place]);

  const { data, isLoading, error } = useQuery<Profile>({
    queryKey: ["/api/community-banks/profile", place],
    enabled: place.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/community-banks/profile?place=${encodeURIComponent(place)}`, { signal });
      if (!res.ok) {
        let message = `This place could not be resolved (HTTP ${res.status}).`;
        try { const body = await res.json(); if (typeof body?.error === "string") message = body.error; } catch { /* keep fallback */ }
        throw new Error(message);
      }
      return res.json();
    },
  });

  function setPlace(next: string) {
    const params = new URLSearchParams(search);
    next ? params.set("place", next) : params.delete("place");
    const query = params.toString();
    navigate(`${path}${query ? `?${query}` : ""}`, { replace: true });
  }
  function submit(e: FormEvent) { e.preventDefault(); const next = draft.trim(); if (next) setPlace(next); }

  const indicators = (data?.indicators ?? []).filter(i => !indicatorIds || indicatorIds.includes(i.id));

  return (
    <Card data-testid="journey-place-evidence" data-place={place || undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden="true" /> {title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor={`place-${path.replace(/\W+/g, "-")}`} className="block text-xs font-semibold mb-1">Place</label>
            <Input
              id={`place-${path.replace(/\W+/g, "-")}`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="ZIP, city like Waco, TX, or county:48491"
              className="min-h-11 sm:max-w-xs"
              data-testid="input-journey-place"
            />
          </div>
          <Button type="submit" className="min-h-11" disabled={!draft.trim()} data-testid="button-journey-place">Show this place</Button>
        </form>

        {place ? (
          <div className="flex flex-wrap items-center gap-3 text-sm" data-testid="journey-place-evidence-showing">
            <span className="font-semibold inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" /> Showing: {data?.geography.label ?? describeJourneyPlace(place)}
            </span>
            <button type="button" onClick={() => setPlace("")} className="inline-flex min-h-11 items-center gap-1 underline underline-offset-2" data-testid="button-journey-place-clear">
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear place
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="journey-place-evidence-empty">
            No place selected. Enter a ZIP, city, or county to scope this page — nothing is assumed.
          </p>
        )}

        {place && isLoading && <p role="status" className="text-sm text-muted-foreground">Loading county evidence…</p>}
        {place && error && <p role="alert" className="text-sm text-destructive" data-testid="journey-place-evidence-error">{(error as Error).message} No substitute place was selected.</p>}

        {data && (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="journey-place-indicators">
              {indicators.map(i => (
                <div key={i.id} className="rounded border p-3 text-sm" data-testid={`indicator-${i.id}`}>
                  <div className="text-xs text-muted-foreground">{i.label}</div>
                  <div className="text-lg font-semibold">{formatValue(i)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{i.coverage}</Badge>
                    <span>{i.scope}</span> · <span>{i.source}</span> · <span>{i.vintage}</span>
                  </div>
                  {i.note && <div className="mt-1 text-[11px] text-muted-foreground">{i.note}</div>}
                  <Link href={`${i.href}?place=${encodeURIComponent(place)}`} className="mt-1 inline-flex items-center gap-1 text-xs underline underline-offset-2">
                    Open in tool <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
            {data.limits.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-muted-foreground" data-testid="journey-place-limits">
                {data.limits.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
