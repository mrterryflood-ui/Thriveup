import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GeoPoint, OverlayMarker } from "@/components/gis/GisNeedHeatMap";
import type { MagnetMapPayload } from "@shared/magnet-map";

const GisNeedHeatMap = lazy(() => import("@/components/gis/GisNeedHeatMap"));

/**
 * Phase 4b magnet map: county need (SVI percentile, Gazetteer centroids) + organization
 * gravity aggregated per filing ZIP (ZCTA centroids) + curated resource pins, for one city.
 * Reads GET /api/community-gravity/map only. Every layer carries its source and limits;
 * if Leaflet cannot mount, the same payload renders as a list (no silent blank).
 */
const GRAVITY_COLOR = "#1d4ed8";
const RESOURCE_COLOR = "#0f766e";

class MapBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("[MagnetMap] Leaflet rendering failed:", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function clusterRadius(count: number, max: number): number { return 6 + Math.sqrt(count / Math.max(1, max)) * 18; }

function topDomains(domains: Record<string, number>, n = 3): string {
  return Object.entries(domains).sort((a, b) => b[1] - a[1]).slice(0, n).map(([d, c]) => `${d.replace(/-/g, " ")} ${c}`).join(" · ");
}

function MapList({ data }: { data: MagnetMapPayload }) {
  return (
    <div className="rounded-xl border p-4 text-sm" data-testid="magnet-map-list">
      <p className="font-semibold">Community map data</p>
      <p className="mt-2 text-xs text-muted-foreground">{data.need.measure}</p>
      <ul className="mt-2 space-y-1">{data.need.counties.map(c => <li key={c.fips}>{c.name}{c.focus ? " (focus county)" : ""}: SVI {c.sviPercentile == null ? "not available" : `${Math.round(c.sviPercentile)}th percentile`}</li>)}</ul>
      <p className="mt-3 font-medium">Organizations by filing ZIP (top 10)</p>
      <ul className="mt-1 space-y-1">{data.gravity.clusters.slice(0, 10).map(z => <li key={z.zip}>ZIP {z.zip}: {z.orgCount.toLocaleString()} organizations — {topDomains(z.domains)}</li>)}</ul>
      <p className="mt-3 font-medium">Curated resource locations</p>
      <ul className="mt-1 space-y-1">{data.resources.pins.map(p => <li key={p.id}>{p.name}{p.address ? ` — ${p.address}` : ""}</li>)}</ul>
    </div>
  );
}

export function MagnetMap({ city, state, counties, place, height = "460px" }: { city?: string; state?: string; counties?: string[]; place?: string; height?: string }) {
  const [showContext, setShowContext] = useState(false);
  const params = new URLSearchParams();
  if (counties?.length) {
    params.set("counties", counties.join(","));
    if (state) params.set("state", state);
  } else if (place) params.set("place", place);
  else {
    if (city) params.set("city", city);
    if (state) params.set("state", state);
  }
  const selector = params.toString();
  const q = useQuery<MagnetMapPayload>({
    queryKey: ["/api/community-gravity/map", selector],
    queryFn: async ({ signal }) => { const r = await fetch(`/api/community-gravity/map?${selector}`, { signal }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`); return r.json(); },
    staleTime: 10 * 60 * 1000,
  });

  if (q.isLoading) return <div className="rounded-xl border p-6 text-sm text-muted-foreground" style={{ height }} role="status" data-testid="magnet-map-loading">Loading the magnet map…</div>;
  if (q.isError || !q.data) return <div className="rounded-xl border border-destructive p-5 text-sm" role="alert" data-testid="magnet-map-error">The magnet map could not load: {q.error instanceof Error ? q.error.message : "unknown error"}<button type="button" onClick={() => void q.refetch()} className="block mt-2 min-h-11 underline" data-testid="magnet-map-retry">Retry map</button></div>;
  const data = q.data;
  const displayPlace = data.community.city || place || "Selected community";

  const points: GeoPoint[] = data.need.counties.filter(c => c.sviPercentile != null).map(c => ({
    id: `county-${c.fips}`, label: c.name, lat: c.lat, lon: c.lon, needScore: c.sviPercentile as number,
    metrics: {
      ...(c.povertyRate != null ? { poverty: { value: Math.round(c.povertyRate * 10) / 10, label: "Poverty rate", unit: "%" } } : {}),
      ...(c.population != null ? { pop: { value: c.population, label: "Population" } } : {}),
    },
  }));
  const maxCount = data.gravity.clusters[0]?.orgCount ?? 1;
  const overlays: OverlayMarker[] = [
    ...data.need.counties.filter(c => c.sviPercentile == null).map(c => ({ id: `county-unknown-${c.fips}`, label: c.name, lat: c.lat, lon: c.lon, radius: 12, color: "#64748b", details: ["SVI unavailable; no vulnerability score substituted."] })),
    ...data.gravity.clusters.map(z => ({ id: `zip-${z.zip}`, label: `ZIP ${z.zip} — ${z.orgCount.toLocaleString()} organizations`, lat: z.lat, lon: z.lon, radius: clusterRadius(z.orgCount, maxCount), color: GRAVITY_COLOR, details: [topDomains(z.domains), z.topOrg ? `Largest filer: ${z.topOrg.name}` : "", "Filing ZIP, not a service location."].filter(Boolean) })),
    ...data.resources.pins.map(p => ({ id: `pin-${p.id}`, label: p.name, lat: p.lat, lon: p.lon, radius: 5, color: RESOURCE_COLOR, details: [p.category, p.address ?? ""].filter(Boolean) })),
  ];
  const focus = data.need.counties.find(c => c.focus);

  return (
    <figure data-testid="magnet-map" className="space-y-2">
      <button type="button" onClick={() => setShowContext(v => !v)} aria-pressed={showContext} className="min-h-11 rounded-lg border px-3 text-sm" data-testid="magnet-map-context-toggle">{showContext ? "Focus on filing ZIPs" : "View county evidence extent"}</button>
      {data.gravity.clusters.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm" data-testid="magnet-map-empty">No mapped organization records for {displayPlace}. This is a coverage gap, not evidence that no organizations exist. {data.need.counties.length || data.resources.pins.length ? `${data.need.counties.length} county evidence records and ${data.resources.pins.length} curated locations are available.` : "No county evidence or curated locations could be scoped."}</p>}
      <MapBoundary key={selector} fallback={<MapList data={data} />}>
        <Suspense fallback={<div className="rounded-xl border p-6 text-sm text-muted-foreground" style={{ height }}>Loading map…</div>}>
          <GisNeedHeatMap key={`${selector}-${showContext}`} points={points} overlays={overlays} fitPoints={showContext ? [...points, ...overlays] : data.gravity.clusters.length ? overlays.filter(o => !o.id.startsWith("county-")) : [...points, ...overlays]} height={height} needLabel="SVI percentile"
            legend={{ title: "Community layers", items: [{ color: GRAVITY_COLOR, label: "Organizations per filing ZIP (size = count)" }, { color: RESOURCE_COLOR, label: "Curated resource location" }, { color: "#dc2626", label: "County SVI > 70th percentile" }, { color: "#d97706", label: "County SVI 40–70" }, { color: "#16a34a", label: "County SVI < 40" }, { color: "#64748b", label: "County SVI unavailable" }] }} />
        </Suspense>
      </MapBoundary>
      <figcaption className="text-xs text-muted-foreground space-y-1">
        <p data-testid="magnet-map-summary">{data.gravity.orgsPlaced.toLocaleString()} organizations placed across {data.gravity.clusters.length} ZIPs{data.gravity.orgsUnplaced > 0 ? `; ${data.gravity.orgsUnplaced.toLocaleString()} counted but not placed (no Census ZCTA)` : ""}.{focus ? ` Focus county: ${focus.name}${focus.sviPercentile != null ? `, SVI ${Math.round(focus.sviPercentile)}th percentile` : ""}.` : ""} {data.resources.pins.length} resource locations shown.</p>
        <p>{counties?.length || place ? "County evidence follows the selected geography." : `County evidence is statewide ${data.community.state} context; organization counts use the ${data.community.city} filing city.`}</p>
        <details><summary className="cursor-pointer min-h-11 inline-flex items-center">Accessible data list</summary><MapList data={data} /></details>
        <details><summary className="cursor-pointer min-h-11 inline-flex items-center">Sources and limits</summary>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>Organizations: {data.gravity.source}. Last ingest: {data.gravity.fetchedAt ?? "unavailable"}.</li>
            <li>Need: {data.need.source}. {data.need.measure}.</li>
            <li>SVI vintage: {[...new Set(data.need.counties.map(c => c.vintage ?? "unavailable"))].join(", ")}. <a className="underline" href="https://www.atsdr.cdc.gov/place-health/php/svi/" target="_blank" rel="noopener noreferrer">CDC SVI methodology</a> · <a className="underline" href="https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html" target="_blank" rel="noopener noreferrer">Census coordinate source</a></li>
            <li>Resources: {data.resources.source}.</li>
            {data.limits.map(l => <li key={l}>{l}</li>)}
          </ul>
        </details>
      </figcaption>
    </figure>
  );
}
