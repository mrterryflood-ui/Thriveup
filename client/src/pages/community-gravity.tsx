import { useMemo, useState, useEffect, useRef, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowLeft, Magnet, ShieldCheck, ExternalLink, Search, Building2 } from "lucide-react";
import { MagnetMap } from "@/components/magnet-map";
import { IntegrationInvitation } from "@/components/integration-invitation";
import { useMagnetJourneyPlace } from "@/hooks/use-magnet-journey-place";
import { apiRequest } from "@/lib/queryClient";
import { useWorkspaceAccess } from "@/lib/workspace-context";

interface Org { ein: string; name: string; city: string; state: string; zip: string | null; nteeCode: string | null; domain: string; revenueAmt: number | null; taxPeriod: string | null; verified: boolean; profileUrl: string }
interface Cluster { domain: string; label: string; count: number; magnets: Org[]; nearbyCount: number; nearbyCities: { city: string; count: number; distanceMiles: number }[] }
interface Field { community: { city: string; state: string }; builtFrom: { source: string; sourceUrl: string; fetchedAt: string | null; orgCount: number } | null; method: { domain: string; magnet: string; nearby: string; evidence: string }; clusters: Cluster[]; limits: string[]; domains: Record<string, string> }
interface Fact { predicate: string; object: string; context: string; method: string; createdAt: string }
interface NetworkProfile {
  id: string;
  name: string;
  stakeholderType: string;
  description: string | null;
  city: string;
  state: string;
  communityArea: string | null;
  focusAreas: string[];
  serviceArea: string | null;
  website: string | null;
  sourceUrl: string;
  publishedAt: string | null;
}
interface NetworkDirectory {
  community: { city: string; state: string };
  profiles: NetworkProfile[];
  total: number;
  limit: number;
  source: string;
  limits: string[];
}
interface ManagedNetworkProfile extends NetworkProfile {
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}
interface NetworkProfileDraft {
  name: string;
  stakeholderType: string;
  description: string;
  city: string;
  state: string;
  communityArea: string;
  focusAreas: string;
  serviceArea: string;
  website: string;
  sourceUrl: string;
}

const PREDICATE_LABEL: Record<string, string> = { does: "What it does", serves: "Who it serves", website: "Website", located_in: "Located in", partners_with: "Partners with", program: "Program", contact_public: "Public contact" };

function money(v: number | null) { return v === null ? "Revenue not reported" : `$${v.toLocaleString()} reported revenue`; }
function titleCase(s: string) { return s.toLocaleLowerCase().replace(/(^|[\s.'’\-])\p{L}/gu, value => value.toLocaleUpperCase()); }
function safeWebsite(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function CommunityGravityPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const journey = useMagnetJourneyPlace(params.has("city") || params.has("state") || params.has("place") || params.has("zip"));
  const placeReady = !journey.pending && !journey.error && !journey.unsupported;
  const broadPlace = params.get("place") ?? params.get("zip") ?? journey.place;
  const reportedCity = broadPlace?.match(/^([\p{L}\p{M}\p{N} .,'’\-]{2,80}),\s*([A-Z]{2})$/iu);
  const city = params.get("city") ?? reportedCity?.[1] ?? "";
  const state = params.get("state") ?? reportedCity?.[2] ?? "";
  const [draftCity, setDraftCity] = useState(city);
  const [draftState, setDraftState] = useState(state);
  useEffect(() => { setDraftCity(city); setDraftState(state); }, [city, state]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [debouncedDirectoryQuery, setDebouncedDirectoryQuery] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<NetworkProfileDraft>(() => ({
    name: "", stakeholderType: "", description: "", city, state: state.toUpperCase(),
    communityArea: "", focusAreas: "", serviceArea: "", website: "", sourceUrl: "",
  }));
  const [domain, setDomain] = useState<string | null>(null);
  const [open, setOpen] = useState<Org | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const viewer = useWorkspaceAccess();
  const qc = useQueryClient();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedDirectoryQuery(directoryQuery.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [directoryQuery]);

  const field = useQuery<Field>({ queryKey: ["/api/community-gravity", city, state], enabled: !!city && !!state && !journey.pending && !journey.error && !journey.unsupported, queryFn: async ({ signal }) => { const r = await fetch(`/api/community-gravity?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`, { signal }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`); return r.json(); } });
  const directory = useQuery<NetworkDirectory>({
    queryKey: ["/api/community-gravity/network", city, state, debouncedDirectoryQuery],
    enabled: !!city && !!state && directoryQuery.trim() === debouncedDirectoryQuery && !journey.pending && !journey.error && !journey.unsupported,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ city, state });
      if (debouncedDirectoryQuery) params.set("q", debouncedDirectoryQuery);
      const r = await fetch(`/api/community-gravity/network?${params}`, { signal });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
      return r.json();
    },
  });
  const managedProfiles = useQuery<{ profiles: ManagedNetworkProfile[]; limit: number }>({
    queryKey: ["/api/community-gravity/network/manage", city, state],
    enabled: viewer.staff && !!city && !!state && !journey.pending && !journey.error && !journey.unsupported,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ city, state });
      const r = await fetch(`/api/community-gravity/network/manage?${params}`, { signal });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
      return r.json();
    },
  });
  const saveNetworkProfile = useMutation({
    mutationFn: async ({ id, draft }: { id: string | null; draft: NetworkProfileDraft }) => {
      const body = {
        ...draft,
        state: draft.state.trim().toUpperCase(),
        description: draft.description.trim() || null,
        communityArea: draft.communityArea.trim() || null,
        focusAreas: draft.focusAreas.split(",").map(area => area.trim()).filter(Boolean),
        serviceArea: draft.serviceArea.trim() || null,
        website: draft.website.trim() || null,
      };
      const path = id ? `/api/community-gravity/network/${encodeURIComponent(id)}` : "/api/community-gravity/network";
      const response = await apiRequest(id ? "PATCH" : "POST", path, body);
      return response.json() as Promise<{ id: string; status: string; city: string; state: string; message?: string }>;
    },
    onSuccess: (result) => {
      const savedCity = result.city || city;
      const savedState = (result.state || state).toUpperCase();
      setEditingProfileId(null);
      setProfileDraft({ name: "", stakeholderType: "", description: "", city: savedCity, state: savedState, communityArea: "", focusAreas: "", serviceArea: "", website: "", sourceUrl: "" });
      qc.invalidateQueries({ queryKey: ["/api/community-gravity/network/manage"] });
      qc.invalidateQueries({ queryKey: ["/api/community-gravity/network"] });
      if (savedCity.toLowerCase() !== city.toLowerCase() || savedState !== state.toUpperCase()) {
        navigate(`/community-gravity?city=${encodeURIComponent(savedCity)}&state=${encodeURIComponent(savedState)}`);
      }
    },
  });
  const changeNetworkProfileStatus = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "publish" | "archive" }) => {
      const response = await apiRequest("POST", `/api/community-gravity/network/${encodeURIComponent(id)}/${action}`);
      return response.json() as Promise<{ id: string; status: string }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community-gravity/network/manage"] });
      qc.invalidateQueries({ queryKey: ["/api/community-gravity/network"] });
    },
  });
  const searching = q.trim().length > 0 || domain !== null;
  const orgs = useQuery<{ orgs: Org[]; count: number }>({ queryKey: ["/api/community-gravity/orgs", city, state, debouncedQ, domain], enabled: searching && q.trim() === debouncedQ && Boolean(city && state && placeReady), queryFn: async ({ signal }) => { const u = new URLSearchParams({ city, state, q: debouncedQ }); if (domain) u.set("domain", domain); const r = await fetch(`/api/community-gravity/orgs?${u}`, { signal }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`); return r.json(); } });
  const facts = useQuery<{ facts: Fact[]; evidence: string }>({ queryKey: ["/api/community-gravity/orgs", open?.ein, "facts"], enabled: Boolean(open), queryFn: async ({ signal }) => { const r = await fetch(`/api/community-gravity/orgs/${open!.ein}/facts`, { signal }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); } });
  const orgSearchIsCurrent = q.trim() === debouncedQ;
  const directorySearchIsCurrent = directoryQuery.trim() === debouncedDirectoryQuery;
  const directoryResultsReady = directorySearchIsCurrent && !directory.isFetching && !directory.isError && Boolean(directory.data);
  const research = useMutation({ mutationFn: async (ein: string) => { const r = await apiRequest("POST", `/api/community-gravity/orgs/${ein}/research`); return r.json() as Promise<{ added: number; skipped: number; reason?: string }>; }, onSuccess: (_result, ein) => qc.invalidateQueries({ queryKey: ["/api/community-gravity/orgs", ein, "facts"] }) });
  const verify = useMutation({ mutationFn: async (v: { ein: string; verified: boolean }) => { const r = await apiRequest("POST", `/api/community-gravity/orgs/${v.ein}/verify`, { verified: v.verified }); return r.json(); }, onSuccess: (_d, v) => { setOpen(o => o && o.ein === v.ein ? { ...o, verified: v.verified } : o); qc.invalidateQueries({ queryKey: ["/api/community-gravity"] }); } });

  const dialogPanelRef = useRef<HTMLDivElement>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = dialogPanelRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    dialogCloseRef.current?.focus();
    function handleDialogKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
        .filter(element => element.getAttribute("aria-hidden") !== "true");
      if (focusable.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleDialogKey);
    return () => {
      document.removeEventListener("keydown", handleDialogKey);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  const clusters = useMemo(() => (field.data?.clusters ?? []).filter(c => c.domain !== "unclassified"), [field.data]);
  const unclassified = field.data?.clusters.find(c => c.domain === "unclassified");

  function submit(e: FormEvent) { e.preventDefault(); setOpen(null); setQ(""); setDomain(null); navigate(`/community-gravity?city=${encodeURIComponent(draftCity.trim())}&state=${encodeURIComponent(draftState.trim().toUpperCase())}`); }
  function editNetworkProfile(profile: ManagedNetworkProfile) {
    setEditingProfileId(profile.id);
    setProfileDraft({
      name: profile.name,
      stakeholderType: profile.stakeholderType,
      description: profile.description ?? "",
      city: profile.city,
      state: profile.state,
      communityArea: profile.communityArea ?? "",
      focusAreas: profile.focusAreas.join(", "),
      serviceArea: profile.serviceArea ?? "",
      website: profile.website ?? "",
      sourceUrl: profile.sourceUrl,
    });
  }
  function cancelNetworkEdit() {
    setEditingProfileId(null);
    setProfileDraft({ name: "", stakeholderType: "", description: "", city, state: state.toUpperCase(), communityArea: "", focusAreas: "", serviceArea: "", website: "", sourceUrl: "" });
    saveNetworkProfile.reset();
  }

  return <div className="mx-auto max-w-6xl px-5 py-8" data-testid="community-gravity-page">
    <Link href="/" className="inline-flex items-center gap-2 min-h-11 text-sm text-muted-foreground" data-testid="gravity-home"><ArrowLeft size={15} />Starting points</Link>
    <div className="mt-4 flex items-start gap-3"><Magnet className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /><div>
      <h1 className="text-3xl font-semibold">Community Rolodex: {city ? `organizations to know in ${titleCase(city)}, ${state.toUpperCase()}` : broadPlace ? `organizations to know near ${broadPlace}` : "choose a community"}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">A place-based directory of adjacent stakeholders across sectors: schools, early learning and daycare, workforce development, universities, banks, hospitals, nonprofits, government, and community institutions. Sector labels are open so each community can describe its own partners. A listing does not mean partnership, endorsement, referral acceptance, or a shared service area.</p>
    </div></div>

    <form onSubmit={submit} className="mt-6 flex flex-wrap items-end gap-2" aria-label="Choose a community">
      <label className="text-sm">City<Input required minLength={2} maxLength={80} value={draftCity} onChange={e => setDraftCity(e.target.value)} className="mt-1 min-h-11 w-56" aria-label="City" data-testid="gravity-city" /></label>
      <label className="text-sm">State<Input required pattern="[A-Za-z]{2}" value={draftState} onChange={e => setDraftState(e.target.value)} maxLength={2} className="mt-1 min-h-11 w-20 uppercase" aria-label="Two-letter state" data-testid="gravity-state" /></label>
      <Button type="submit" className="min-h-11" data-testid="gravity-go">Show this community<ArrowRight size={14} className="ml-2" /></Button>
    </form>
    {city && state && placeReady && <section className="mt-6 rounded-xl border bg-card p-4" aria-labelledby="gravity-rolodex-heading" data-testid="gravity-rolodex">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="gravity-rolodex-heading" className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" aria-hidden="true" /> Community organization profiles</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Staff-published organization profiles in {titleCase(city)}, {state.toUpperCase()}. Search names, open sector labels, focus areas, or service-area descriptions. Organization profiles are separate from operational referral partners.</p>
        </div>
      {directoryResultsReady && <span className="shrink-0 text-sm text-muted-foreground" data-testid="gravity-rolodex-count">{directory.data!.total.toLocaleString()} profiles</span>}
      </div>
      <label className="relative mt-4 block max-w-xl">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input value={directoryQuery} onChange={e => setDirectoryQuery(e.target.value)} placeholder="Search organizations, sectors, or services" className="min-h-11 pl-10" aria-label="Search community organization profiles" data-testid="gravity-rolodex-search" />
      </label>
      {(!directorySearchIsCurrent || directory.isFetching) && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading directory profiles">{[0, 1, 2].map(i => <Skeleton key={i} className="h-36" />)}</div>}
      {directorySearchIsCurrent && directory.isError && <Card className="mt-4 border-destructive p-4 text-sm" role="alert" data-testid="gravity-rolodex-error">Organization profiles could not be refreshed. Cached results are hidden until the current directory can be confirmed. <Button type="button" variant="outline" className="ml-2 min-h-11" onClick={() => directory.refetch()} data-testid="gravity-rolodex-retry">Try again</Button></Card>}
      {directoryResultsReady && directory.data!.profiles.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="gravity-rolodex-results">
        {directory.data!.profiles.map(profile => {
          const website = safeWebsite(profile.website);
          const source = safeWebsite(profile.sourceUrl);
          return <Card key={profile.id} className="flex flex-col gap-2 p-4" data-testid={`gravity-profile-${profile.id}`}>
            <div>
              <h3 className="font-semibold">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.stakeholderType} · {profile.city}, {profile.state}</p>
            </div>
            {profile.communityArea && <p className="text-xs text-muted-foreground"><span className="font-medium">Community area:</span> {profile.communityArea}</p>}
            {profile.description && <p className="text-sm">{profile.description}</p>}
            {profile.focusAreas.length > 0 && <p className="text-xs text-muted-foreground"><span className="font-medium">Focus areas:</span> {profile.focusAreas.join(" · ")}</p>}
            {profile.serviceArea && <p className="text-xs text-muted-foreground"><span className="font-medium">Listed service area:</span> {profile.serviceArea}</p>}
            <div className="mt-auto flex flex-wrap gap-x-4">
              {website && <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm underline" data-testid={`gravity-profile-website-${profile.id}`}>Website <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
              {source && <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm underline" data-testid={`gravity-profile-source-${profile.id}`}>Profile source <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
            </div>
          </Card>;
        })}
      </div>}
      {directoryResultsReady && directory.data!.profiles.length === 0 && <p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground" data-testid="gravity-rolodex-empty">
        {debouncedDirectoryQuery ? `No published organization profiles match “${debouncedDirectoryQuery}”.` : `No organization profiles have been published for ${titleCase(city)}, ${state.toUpperCase()} yet.`} This is a directory coverage gap, not evidence that no organizations are present.
      </p>}
      {directoryResultsReady && directory.data!.total > directory.data!.profiles.length && <p className="mt-3 text-xs text-muted-foreground">Showing {directory.data!.profiles.length} of {directory.data!.total} matching profiles. Refine your search to narrow the list.</p>}
      <p className="mt-3 text-xs text-muted-foreground">{directoryResultsReady ? directory.data!.limits[0] : "A listing is not evidence of a relationship between organizations."} City/state selection works across U.S. communities; no quadrant or service-area assignment is inferred from a filing address.</p>
      {viewer.staff && <section className="mt-6 border-t pt-5" aria-labelledby="gravity-network-manage-heading" data-testid="gravity-network-management">
        <h3 id="gravity-network-manage-heading" className="text-lg font-semibold">Manage community profiles</h3>
        <p className="mt-1 text-sm text-muted-foreground">Add any stakeholder type as a draft, attach a public source, then publish only after staff review. Publishing does not create a referral, capacity record, or partnership.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); saveNetworkProfile.mutate({ id: editingProfileId, draft: profileDraft }); }} data-testid="gravity-network-profile-form">
          <label className="text-sm">Organization name<Input disabled={saveNetworkProfile.isPending} required minLength={2} maxLength={300} value={profileDraft.name} onChange={e => setProfileDraft(d => ({ ...d, name: e.target.value }))} className="mt-1 min-h-11" data-testid="gravity-profile-name" /></label>
          <label className="text-sm">Stakeholder type (open label)<Input disabled={saveNetworkProfile.isPending} required minLength={2} maxLength={120} value={profileDraft.stakeholderType} onChange={e => setProfileDraft(d => ({ ...d, stakeholderType: e.target.value }))} placeholder="School, daycare, workforce center, bank…" className="mt-1 min-h-11" data-testid="gravity-profile-type" /></label>
          <label className="text-sm">City<Input disabled={saveNetworkProfile.isPending} required value={profileDraft.city} onChange={e => setProfileDraft(d => ({ ...d, city: e.target.value }))} className="mt-1 min-h-11" data-testid="gravity-profile-city" /></label>
          <label className="text-sm">State<Input disabled={saveNetworkProfile.isPending} required maxLength={2} value={profileDraft.state} onChange={e => setProfileDraft(d => ({ ...d, state: e.target.value.toUpperCase() }))} className="mt-1 min-h-11 uppercase" data-testid="gravity-profile-state" /></label>
          <label className="text-sm sm:col-span-2">Description<textarea disabled={saveNetworkProfile.isPending} maxLength={2000} value={profileDraft.description} onChange={e => setProfileDraft(d => ({ ...d, description: e.target.value }))} className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" data-testid="gravity-profile-description" /></label>
          <label className="text-sm">Focus areas, comma separated<Input disabled={saveNetworkProfile.isPending} value={profileDraft.focusAreas} onChange={e => setProfileDraft(d => ({ ...d, focusAreas: e.target.value }))} placeholder="early learning, youth employment" className="mt-1 min-h-11" data-testid="gravity-profile-focus" /></label>
          <label className="text-sm">Listed service area (optional)<Input disabled={saveNetworkProfile.isPending} value={profileDraft.serviceArea} onChange={e => setProfileDraft(d => ({ ...d, serviceArea: e.target.value }))} className="mt-1 min-h-11" data-testid="gravity-profile-service-area" /></label>
          <label className="text-sm">Project-defined community area (optional)<Input disabled={saveNetworkProfile.isPending} value={profileDraft.communityArea} onChange={e => setProfileDraft(d => ({ ...d, communityArea: e.target.value }))} placeholder="Use only after checking the local planning boundary" className="mt-1 min-h-11" data-testid="gravity-profile-community-area" /></label>
          <label className="text-sm">Organization website (optional)<Input disabled={saveNetworkProfile.isPending} type="url" value={profileDraft.website} onChange={e => setProfileDraft(d => ({ ...d, website: e.target.value }))} placeholder="https://" className="mt-1 min-h-11" data-testid="gravity-profile-website-input" /></label>
          <label className="text-sm sm:col-span-2">Public source URL (required)<Input disabled={saveNetworkProfile.isPending} required type="url" value={profileDraft.sourceUrl} onChange={e => setProfileDraft(d => ({ ...d, sourceUrl: e.target.value }))} placeholder="https://official-organization-source.example" className="mt-1 min-h-11" data-testid="gravity-profile-source-input" /></label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" className="min-h-11" disabled={saveNetworkProfile.isPending} data-testid="gravity-profile-save">{saveNetworkProfile.isPending ? "Saving…" : editingProfileId ? "Save changes as draft" : "Save as draft"}</Button>
            {editingProfileId && <Button type="button" variant="outline" className="min-h-11" disabled={saveNetworkProfile.isPending} onClick={cancelNetworkEdit} data-testid="gravity-profile-cancel">Cancel edit</Button>}
          </div>
        </form>
        {saveNetworkProfile.isError && <p role="alert" className="mt-2 text-sm text-destructive" data-testid="gravity-profile-save-error">{(saveNetworkProfile.error as Error).message}</p>}
        {saveNetworkProfile.isSuccess && <p role="status" className="mt-2 text-sm text-muted-foreground">Saved as a draft. Review the source and publish it below when ready.</p>}
        {changeNetworkProfileStatus.isError && <p role="alert" className="mt-2 text-sm text-destructive" data-testid="gravity-profile-status-error">{(changeNetworkProfileStatus.error as Error).message}</p>}
        <div className="mt-4 space-y-2" aria-label="Draft and published community profiles">
          {managedProfiles.isLoading && <Skeleton className="h-16" />}
          {managedProfiles.isError && <p role="alert" className="text-sm text-destructive">Staff profile list could not be loaded: {(managedProfiles.error as Error).message}</p>}
          {managedProfiles.data && !managedProfiles.isError && managedProfiles.data.profiles.length === 0 && <p className="text-sm text-muted-foreground">No profile drafts or published records for this city yet.</p>}
          {managedProfiles.data && !managedProfiles.isError && managedProfiles.data.profiles.map(profile => <div key={profile.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between" data-testid={`gravity-managed-profile-${profile.id}`}>
            <div>
              <p className="font-medium">{profile.name} <span className="ml-1 rounded bg-muted px-2 py-0.5 text-xs font-normal">{profile.status}</span></p>
              <p className="text-xs text-muted-foreground">{profile.stakeholderType} · {profile.city}, {profile.state} · Source: {profile.sourceUrl}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="min-h-11" disabled={saveNetworkProfile.isPending} onClick={() => editNetworkProfile(profile)} data-testid={`gravity-profile-edit-${profile.id}`}>Edit</Button>
              {profile.status !== "published" && <Button type="button" className="min-h-11" disabled={changeNetworkProfileStatus.isPending} onClick={() => changeNetworkProfileStatus.mutate({ id: profile.id, action: "publish" })} data-testid={`gravity-profile-publish-${profile.id}`}>Publish</Button>}
              {profile.status !== "archived" && <Button type="button" variant="outline" className="min-h-11" disabled={changeNetworkProfileStatus.isPending} onClick={() => { if (window.confirm("Archive this profile? It will no longer appear in the public Rolodex.")) changeNetworkProfileStatus.mutate({ id: profile.id, action: "archive" }); }} data-testid={`gravity-profile-archive-${profile.id}`}>Archive</Button>}
            </div>
          </div>)}
        </div>
      </section>}
    </section>}
    <div className="mt-8" data-testid="gravity-iti-invitation">
      <IntegrationInvitation
        surface="community-gravity"
        surfaceContext="community-directory"
        prompt="Do you help people in your community connect with childcare, school, work, health care, or other support?"
        description="Informal caregivers, peer mentors, promotoras, community health workers, and other neighbors are welcome. No credential is required. You choose what may be shared; all permissions start off."
        suggestedRoleTags={["informal caregiver", "peer mentor", "promotora", "community health worker", "trade mentor"]}
      />
    </div>
    {placeReady && !broadPlace && !params.has("city") && !params.has("state") && <p className="mt-3 text-sm text-muted-foreground" data-testid="gravity-example">Example community: Austin, TX. This is not your inferred location; enter your own community above.</p>}
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
        <h2 className="font-semibold">{!orgSearchIsCurrent || orgs.isLoading ? "Searching…" : orgs.isError ? "Organization search unavailable" : orgs.data ? `${orgs.data.count} matching organizations` : "Searching…"}{orgSearchIsCurrent && orgs.data && !orgs.isError && orgs.data.count >= 40 ? " (first 40 shown; narrow the search)" : ""}</h2>
        {orgSearchIsCurrent && orgs.isError && <p role="alert" className="mt-3 text-sm text-destructive">The IRS organization search could not be loaded: {(orgs.error as Error).message} <Button type="button" variant="outline" className="ml-2 min-h-11" onClick={() => orgs.refetch()}>Try again</Button></p>}
        {orgSearchIsCurrent && !orgs.isError && <ul className="mt-3 grid gap-2 sm:grid-cols-2">{(orgs.data?.orgs ?? []).map(o => <li key={o.ein}><OrgButton org={o} onOpen={setOrgOpen(setOpen)} labelFor={field.data!.domains} /></li>)}</ul>}
        {orgSearchIsCurrent && !orgs.isError && orgs.data && orgs.data.count === 0 && <p className="mt-3 text-sm text-muted-foreground">No organization name matches. Names are as filed with the IRS; try a shorter word.</p>}
      </section> : <section className="mt-6" data-testid="gravity-clusters">
        <h2 className="text-xl font-semibold">IRS nonprofit discovery: local filing patterns</h2>
        <p className="mt-1 text-sm text-muted-foreground">One nationwide discovery source, separate from the organization Rolodex above. IRS records do not cover banks, hospitals, universities, many informal groups, or every nonprofit; filing location does not establish service area. {field.data.method.magnet}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clusters.map(c => <Card key={c.domain} className="p-4" data-testid={`gravity-cluster-${c.domain}`}>
            <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">{c.label}</h3><span className="text-sm text-muted-foreground">{c.count.toLocaleString()} orgs</span></div>
            <ol className="mt-3 space-y-1">{c.magnets.map(o => <li key={o.ein}><OrgButton org={o} onOpen={setOrgOpen(setOpen)} labelFor={field.data!.domains} compact /></li>)}</ol>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span title={field.data!.method.nearby}>{c.nearbyCount > 0 ? `${c.nearbyCount.toLocaleString()} nearby filings within 50 miles` : "No nearby evidence available in mapped filings"}</span>
              <button className="min-h-11 px-2 underline" onClick={() => setDomain(c.domain)} aria-label={`See all ${c.label} organizations`} data-testid={`gravity-see-all-${c.domain}`}>See all</button>
            </div>
            {c.nearbyCities.length > 0 && <ul aria-label={`Nearby ${c.label} filing cities`} className="mt-2 text-xs">{c.nearbyCities.slice(0, 3).map(n => <li key={n.city}><Link href={`/community-gravity?city=${encodeURIComponent(n.city)}&state=${encodeURIComponent(state)}`} className="inline-flex min-h-11 items-center underline">{titleCase(n.city)} · nearest ZIP {n.distanceMiles} mi · {n.count} filings</Link></li>)}</ul>}
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

    {open && <div ref={dialogPanelRef} role="dialog" aria-modal="true" aria-labelledby="org-title" tabIndex={-1} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={() => setOpen(null)} data-testid="gravity-org-drawer">
      <Card className="w-full max-w-xl max-h-[85vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3"><h2 id="org-title" className="text-lg font-semibold">{titleCase(open.name)}</h2><Button ref={dialogCloseRef} variant="ghost" className="min-h-11" onClick={() => setOpen(null)} aria-label="Close organization details" data-testid="gravity-org-close">Close</Button></div>
        <p className="mt-1 text-sm text-muted-foreground">{field.data?.domains[open.domain] ?? open.domain}{open.nteeCode ? ` · NTEE ${open.nteeCode}` : ""} · {titleCase(open.city)}, {open.state}{open.zip ? ` ${open.zip}` : ""} (IRS filing address)</p>
        <p className="mt-1 text-sm">{money(open.revenueAmt)}{open.taxPeriod ? ` · tax period ${open.taxPeriod}` : ""} · EIN {open.ein}</p>
        {open.verified && <p className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800" data-testid="gravity-org-verified"><ShieldCheck className="h-3 w-3" aria-hidden="true" />Verified by staff</p>}
        <a href={open.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm underline" data-testid="gravity-org-profile">IRS filings on ProPublica Nonprofit Explorer<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
        <h3 className="mt-4 font-semibold">Cited facts</h3>
        {facts.isLoading && <Skeleton className="mt-2 h-12" />}
        {facts.isError && <p role="alert" className="mt-2 text-sm text-destructive">Cited facts could not be loaded: {(facts.error as Error).message} <Button type="button" variant="outline" className="ml-2 min-h-11" onClick={() => facts.refetch()}>Try again</Button></p>}
        {facts.data && !facts.isError && <>
          <p className="text-xs text-muted-foreground">{facts.data.evidence}</p>
          <ul className="mt-2 space-y-2 text-sm" data-testid="gravity-org-facts">{facts.data.facts.map((f, i) => {
            const source = safeWebsite(f.context);
            return <li key={i}><span className="font-medium">{PREDICATE_LABEL[f.predicate] ?? f.predicate}:</span> {f.object} {source ? <a href={source} target="_blank" rel="noopener noreferrer" className="text-xs underline text-muted-foreground">source</a> : <span className="text-xs text-muted-foreground">source unavailable</span>}</li>;
          })}</ul>
        </>}
        {viewer.staff && <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          <Button variant="outline" className="min-h-11" disabled={research.isPending} onClick={() => research.mutate(open.ein)} data-testid="gravity-org-research">{research.isPending ? "Researching…" : "Run cited web research"}</Button>
          <Button variant={open.verified ? "outline" : "default"} className="min-h-11" disabled={verify.isPending} onClick={() => verify.mutate({ ein: open.ein, verified: !open.verified })} data-testid="gravity-org-verify">{open.verified ? "Remove staff verification" : "Mark as verified community magnet"}</Button>
          {research.isError && research.variables === open.ein && <p className="w-full text-sm text-destructive" role="alert">{(research.error as Error).message}</p>}
          {verify.isError && verify.variables?.ein === open.ein && <p className="w-full text-sm text-destructive" role="alert">{(verify.error as Error).message}</p>}
          {research.data && research.variables === open.ein && <p className="w-full text-xs text-muted-foreground" role="status">{research.data.added} facts added, {research.data.skipped} discarded{research.data.reason ? ` (${research.data.reason})` : ""}.</p>}
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
