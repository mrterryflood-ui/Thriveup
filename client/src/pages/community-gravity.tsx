import { useMemo, useState, useEffect, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowLeft, Magnet, ShieldCheck, ExternalLink, Search } from "lucide-react";
import { MagnetMap } from "@/components/magnet-map";
import { useMagnetJourneyPlace } from "@/hooks/use-magnet-journey-place";
import { apiRequest } from "@/lib/queryClient";
import { useWorkspaceAccess } from "@/lib/workspace-context";

interface Org { ein: string; name: string; city: string; state: string; zip: string | null; nteeCode: string | null; domain: string; revenueAmt: number | null; taxPeriod: string | null; verified: boolean; verifiedNote: string | null; profileUrl: string }
interface Cluster { domain: string; label: string; count: number; magnets: Org[]; nearbyCount: number; nearbyCities: { city: string; count: number }[] }
interface Field { community: { city: string; state: string }; builtFrom: { source: string; sourceUrl: string; fetchedAt: string | null; orgCount: number } | null; method: { domain: string; magnet: string; nearby: string; evidence: string }; clusters: Cluster[]; limits: string[]; domains: Record<string, string> }
interface Fact { predicate: string; object: string; context: string; method: string; createdAt: string }

const PREDICATE_LABEL: Record<string, string> = { does: "What it does", serves: "Who it serves", website: "Website", located_in: "Located in", partners_with: "Partners with", program: "Program", contact_public: "Public contact" };

function money(v: number | null) { return v === null ? "Revenue not reported" : `$${v.toLocaleString()} reported revenue`; }
function titleCase(s: string) { return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

export default function CommunityGravityPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const journey = useMagnetJourneyPlace(params.has("city") || params.has("state") || params.has("place") || params.has("zip"));
  const placeReady = !journey.pending && !journey.error && !journey.unsupported;
  const broadPlace = params.get("place") ?? params.get("zip") ?? journey.place;
  const reportedCity = broadPlace?.match(/^([A-Za-z .'-]{2,60}),\s*([A-Z]{2})$/i);
  const city = params.get("city") ?? reportedCity?.[1] ?? (broadPlace || !placeReady ? "" : "Austin");
  const state = params.get("state") ?? reportedCity?.[2] ?? (broadPlace || !placeReady ? "" : "TX");
  const [draftCity, setDraftCity] = useState(city);
  const [draftState, setDraftState] = useState(state);
  useEffect(() => { setDraftCity(city); setDraftState(state); }, [city, state]);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState<string | null>(null);
  const [open, setOpen] = useState<Org | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const viewer = useWorkspaceAccess();
  const qc = useQueryClient();

  const field = useQuery<Field>({ queryKey: ["/api/community-gravity", city, state], enabled: !!city && !!state && !journey.pending && !journey.error && !journey.unsupported, queryFn: async ({ signal }) => { const r = await fetch(`/api/community-gravity?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`, { signal }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`); return r.json(); } });
  const searching = q.trim().length > 0 || domain !== null;
  const orgs = useQuery<{ orgs: Org[]; count: number }>({ queryKey: ["/api/community-gravity/orgs", city, state, q, domain], enabled: searching, queryFn: async () => { const u = new URLSearchParams({ city, state, q }); if (domain) u.set("domain", domain); const r = await fetch(`/api/community-gravity/orgs?${u}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); } });
  const facts = useQuery<{ facts: Fact[]; evidence: string }>({ queryKey: ["/api/community-gravity/orgs", open?.ein, "facts"], enabled: Boolean(open), queryFn: async () => { const r = await fetch(`/api/community-gravity/orgs/${open!.ein}/facts`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); } });
  const research = useMutation({ mutationFn: async (ein: string) => { const r = await apiRequest("POST", `/api/community-gravity/orgs/${ein}/research`); return r.json() as Promise<{ added: number; skipped: number; reason?: string }>; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/community-gravity/orgs", open?.ein, "facts"] }) });
  const verify = useMutation({ mutationFn: async (v: { ein: string; verified: boolean }) => { const r = await apiRequest("POST", `/api/community-gravity/orgs/${v.ein}/verify`, { verified: v.verified }); return r.json(); }, onSuccess: (_d, v) => { setOpen(o => o && o.ein === v.ein ? { ...o, verified: v.verified } : o); qc.invalidateQueries({ queryKey: ["/api/community-gravity"] }); } });

  const clusters = useMemo(() => (field.data?.clusters ?? []).filter(c => c.domain !== "unclassified"), [field.data]);
  const unclassified = field.data?.clusters.find(c => c.domain === "unclassified");

  function submit(e: FormEvent) { e.preventDefault(); setOpen(null); setQ(""); setDomain(null); navigate(`/community-gravity?city=${encodeURIComponent(draftCity.trim())}&state=${encodeURIComponent(draftState.trim().toUpperCase())}`); }

  return <div className="mx-auto max-w-6xl px-5 py-8" data-testid="community-gravity-page">
    <Link href="/" className="inline-flex items-center gap-2 min-h-11 text-sm text-muted-foreground" data-testid="gravity-home"><ArrowLeft size={15} />Starting points</Link>
    <div className="mt-4 flex items-start gap-3"><Magnet className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /><div>
      <h1 className="text-3xl font-semibold">Community Gravity: {city ? `who is doing the work in ${titleCase(city)}, ${state.toUpperCase()}` : broadPlace ? `who is doing the work in ${broadPlace}` : "choose a community"}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">The organizations that attract people, money, and partners in each domain of community life, drawn from public IRS records. Open data proposes; staff verification and cited research are shown where they exist. Not an endorsement, and never a ranking of quality.</p>
    </div></div>

    <form onSubmit={submit} className="mt-6 flex flex-wrap items-end gap-2" aria-label="Choose a community">
      <label className="text-sm">City<Input value={draftCity} onChange={e => setDraftCity(e.target.value)} className="mt-1 min-h-11 w-56" aria-label="City" data-testid="gravity-city" /></label>
      <label className="text-sm">State<Input value={draftState} onChange={e => setDraftState(e.target.value)} maxLength={2} className="mt-1 min-h-11 w-20 uppercase" aria-label="Two-letter state" data-testid="gravity-state" /></label>
      <Button type="submit" className="min-h-11" data-testid="gravity-go">Show this community<ArrowRight size={14} className="ml-2" /></Button>
    </form>
    {journey.pending && <p role="status" className="mt-4">Loading your journey place…</p>}
    {(journey.error || journey.unsupported) && <p role="alert" className="mt-4">{journey.unsupported ? "This map currently supports U.S. communities only." : "Your saved journey place could not load."} Choose a city and state above to continue; no substitute place has been selected.</p>}
    {!!broadPlace && !reportedCity && !journey.pending && <section className="mt-6 rounded-xl border p-4" data-testid="gravity-journey-map">
      <h2 className="font-semibold">Map for {broadPlace}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Your ZIP or county is preserved. Choose a city above if you also want city-level organization profiles.</p>
      <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => setMapOpen(v => !v)} aria-expanded={mapOpen} data-testid="gravity-map-toggle">{mapOpen ? "Hide community map" : "Open community map"}</Button>
      {mapOpen && <div className="mt-4"><MagnetMap place={broadPlace} /></div>}
    </section>}

    {field.isLoading && <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-40" />)}</div>}
    {field.isError && <Card className="mt-6 p-5 border-destructive" role="alert" data-testid="gravity-error">Could not load this community: {(field.error as Error).message}</Card>}

    {placeReady && field.data && !field.data.builtFrom && <Card className="mt-6 p-5" data-testid="gravity-empty">
      <h2 className="font-semibold">No ingested organizations for {titleCase(city)}, {state.toUpperCase()} yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">This community has not been loaded from the IRS Exempt Organizations file. Staff can ingest it from the operations tools; nothing is shown here until real source rows exist.</p>
    </Card>}

    {placeReady && field.data?.builtFrom && <>
      <p className="mt-5 text-sm text-muted-foreground" data-testid="gravity-provenance">
        Built from <a className="underline" href={field.data.builtFrom.sourceUrl} target="_blank" rel="noopener noreferrer">{field.data.builtFrom.source}</a> · {field.data.builtFrom.orgCount.toLocaleString()} organizations with a {titleCase(city)} filing address · fetched {field.data.builtFrom.fetchedAt ? new Date(field.data.builtFrom.fetchedAt).toLocaleDateString() : "date unavailable"}.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Search or filter organizations">
        <div className="relative flex-1 min-w-60"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by organization name (e.g., food, housing, youth)" className="min-h-11 pl-10" aria-label="Search organizations by name" data-testid="gravity-search" /></div>
        {domain && <Button variant="outline" className="min-h-11" onClick={() => setDomain(null)} data-testid="gravity-clear-domain">Clear filter: {field.data.domains[domain] ?? domain}</Button>}
      </div>

      {searching ? <section className="mt-5" aria-live="polite" data-testid="gravity-results">
        <h2 className="font-semibold">{orgs.data ? `${orgs.data.count} matching organizations` : "Searching…"}{orgs.data && orgs.data.count >= 40 ? " (first 40 shown; narrow the search)" : ""}</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">{(orgs.data?.orgs ?? []).map(o => <li key={o.ein}><OrgButton org={o} onOpen={setOrgOpen(setOpen)} labelFor={field.data!.domains} /></li>)}</ul>
        {orgs.data && orgs.data.count === 0 && <p className="mt-3 text-sm text-muted-foreground">No organization name matches. Names are as filed with the IRS; try a shorter word.</p>}
      </section> : <section className="mt-6" data-testid="gravity-clusters">
        <h2 className="text-xl font-semibold">Domains and their magnets</h2>
        <p className="mt-1 text-sm text-muted-foreground">{field.data.method.magnet}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clusters.map(c => <Card key={c.domain} className="p-4" data-testid={`gravity-cluster-${c.domain}`}>
            <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">{c.label}</h3><span className="text-sm text-muted-foreground">{c.count.toLocaleString()} orgs</span></div>
            <ol className="mt-3 space-y-1">{c.magnets.map(o => <li key={o.ein}><OrgButton org={o} onOpen={setOrgOpen(setOpen)} labelFor={field.data!.domains} compact /></li>)}</ol>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span title={field.data!.method.nearby}>{c.nearbyCount > 0 ? `${c.nearbyCount.toLocaleString()} more in ${c.nearbyCities.length}+ other ${state.toUpperCase()} cities` : "Other cities in this state not loaded yet"}</span>
              <button className="min-h-11 px-2 underline" onClick={() => setDomain(c.domain)} aria-label={`See all ${c.label} organizations`} data-testid={`gravity-see-all-${c.domain}`}>See all</button>
            </div>
          </Card>)}
        </div>
        {unclassified && <p className="mt-4 text-sm text-muted-foreground" data-testid="gravity-unclassified">{unclassified.count.toLocaleString()} organizations have no IRS activity (NTEE) code and are not placed in a domain. <button className="underline min-h-11" onClick={() => setDomain("unclassified")}>Browse them</button>.</p>}
      </section>}

      <section className="mt-8 rounded-xl border bg-card p-4" aria-labelledby="gravity-map-heading" data-testid="gravity-map-section">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="gravity-map-heading" className="font-semibold">Explore community patterns on a map</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Open the map when you are ready to compare organizational filing ZIPs with county-level need data. Filing locations do not establish where services are delivered.</p>
          </div>
          <Button type="button" variant="outline" className="min-h-11 shrink-0" aria-expanded={mapOpen} aria-controls="gravity-map-panel" onClick={() => setMapOpen(value => !value)} data-testid="gravity-map-toggle">
            {mapOpen ? "Hide community map" : "Open community map"}
          </Button>
        </div>
        {mapOpen && <div id="gravity-map-panel" className="mt-4" data-testid="gravity-map-panel">
          <MagnetMap city={city} state={state.toUpperCase()} />
        </div>}
      </section>

      <Card className="mt-8 p-4 text-sm" data-testid="gravity-evidence">
        <h2 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" />How to read this</h2>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
          <li>{field.data.method.domain}</li>
          <li>{field.data.method.evidence}</li>
          {field.data.limits.map(l => <li key={l}>{l}</li>)}
          <li>People are not listed. Named contacts appear only through staff-verified partner records and consent.</li>
        </ul>
        <p className="mt-3">Next steps: <Link href="/partners" className="underline">community partners & ambassadors</Link> · <Link href="/for-nonprofits" className="underline">coordinate services and referrals</Link> · <Link href={`/community-banks?place=${encodeURIComponent(`${titleCase(city)}, ${state.toUpperCase()}`)}`} className="underline">place conditions for this community</Link></p>
      </Card>
    </>}

    {open && <div role="dialog" aria-modal="true" aria-labelledby="org-title" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={() => setOpen(null)} data-testid="gravity-org-drawer">
      <Card className="w-full max-w-xl max-h-[85vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3"><h2 id="org-title" className="text-lg font-semibold">{titleCase(open.name)}</h2><Button variant="ghost" className="min-h-11" onClick={() => setOpen(null)} aria-label="Close organization details" data-testid="gravity-org-close">Close</Button></div>
        <p className="mt-1 text-sm text-muted-foreground">{field.data?.domains[open.domain] ?? open.domain}{open.nteeCode ? ` · NTEE ${open.nteeCode}` : ""} · {titleCase(open.city)}, {open.state}{open.zip ? ` ${open.zip}` : ""} (IRS filing address)</p>
        <p className="mt-1 text-sm">{money(open.revenueAmt)}{open.taxPeriod ? ` · tax period ${open.taxPeriod}` : ""} · EIN {open.ein}</p>
        {open.verified && <p className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800" data-testid="gravity-org-verified"><ShieldCheck className="h-3 w-3" aria-hidden="true" />Verified by staff{open.verifiedNote ? `: ${open.verifiedNote}` : ""}</p>}
        <a href={open.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm underline" data-testid="gravity-org-profile">IRS filings on ProPublica Nonprofit Explorer<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
        <h3 className="mt-4 font-semibold">Cited facts</h3>
        {facts.isLoading && <Skeleton className="mt-2 h-12" />}
        {facts.data && <>
          <p className="text-xs text-muted-foreground">{facts.data.evidence}</p>
          <ul className="mt-2 space-y-2 text-sm" data-testid="gravity-org-facts">{facts.data.facts.map((f, i) => <li key={i}><span className="font-medium">{PREDICATE_LABEL[f.predicate] ?? f.predicate}:</span> {f.object} <a href={f.context} target="_blank" rel="noopener noreferrer" className="text-xs underline text-muted-foreground">source</a></li>)}</ul>
        </>}
        {viewer.staff && <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          <Button variant="outline" className="min-h-11" disabled={research.isPending} onClick={() => research.mutate(open.ein)} data-testid="gravity-org-research">{research.isPending ? "Researching…" : "Run cited web research"}</Button>
          <Button variant={open.verified ? "outline" : "default"} className="min-h-11" disabled={verify.isPending} onClick={() => verify.mutate({ ein: open.ein, verified: !open.verified })} data-testid="gravity-org-verify">{open.verified ? "Remove staff verification" : "Mark as verified community magnet"}</Button>
          {research.data && <p className="w-full text-xs text-muted-foreground" role="status">{research.data.added} facts added, {research.data.skipped} discarded{research.data.reason ? ` (${research.data.reason})` : ""}.</p>}
        </div>}
        <p className="mt-4 text-sm">Work with this organization: <Link href="/partners" className="underline">partner directory</Link> · <Link href="/for-nonprofits" className="underline">referral & coordination tools</Link></p>
      </Card>
    </div>}
  </div>;
}

function setOrgOpen(set: (o: Org) => void) { return (o: Org) => set(o); }

function OrgButton({ org, onOpen, labelFor, compact }: { org: Org; onOpen: (o: Org) => void; labelFor: Record<string, string>; compact?: boolean }) {
  return <button onClick={() => onOpen(org)} className={`w-full text-left rounded-lg border px-3 ${compact ? "py-2" : "py-3"} min-h-11 hover:bg-accent`} aria-label={`Open ${titleCase(org.name)}`} data-testid={`gravity-org-${org.ein}`}>
    <span className="flex items-center gap-2 text-sm"><span className="flex-1 truncate">{titleCase(org.name)}</span>{org.verified && <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" aria-label="Staff verified" />}</span>
    <span className="block text-xs text-muted-foreground">{compact ? money(org.revenueAmt) : `${labelFor[org.domain] ?? org.domain} · ${money(org.revenueAmt)}`}</span>
  </button>;
}
