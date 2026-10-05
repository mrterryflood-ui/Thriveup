import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearch } from "wouter";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Compass, MapPin, Radio, Search, ShieldCheck, X } from "lucide-react";
import type { PublicOutcome } from "@shared/outcome-landings";
import { OUTCOME_LANDINGS, outcomeLandingPath } from "@shared/outcome-landings";
import { AUDIENCE_LABELS, OUTCOME_LABELS, canSeeRoute, navRoute } from "@shared/route-nav";
import { canOpenPath } from "@shared/route-access";
import { useWorkspaceAccess } from "@/lib/workspace-context";
import { useAudience } from "@/lib/audience-preference";
import { useAuth } from "@/hooks/use-auth";
import { useMagnetJourneyPlace } from "@/hooks/use-magnet-journey-place";
import helpImage from "@assets/generated_images/outcome-get-help.jpg";
import learnImage from "@assets/generated_images/outcome-learn.jpg";
import workImage from "@assets/generated_images/outcome-work-earn.jpg";
import connectImage from "@assets/generated_images/outcome-connect.jpg";
import fundImage from "@assets/generated_images/outcome-fund.jpg";
import dataImage from "@assets/generated_images/outcome-see-the-data.jpg";

const MagnetMap = lazy(() => import("@/components/magnet-map").then((m) => ({ default: m.MagnetMap })));
const SystemPulse = lazy(() => import("@/components/system-pulse").then((m) => ({ default: m.SystemPulse })));

const IMAGES: Record<PublicOutcome, string> = {
  "get-help": helpImage,
  learn: learnImage,
  "work-earn": workImage,
  connect: connectImage,
  fund: fundImage,
  "see-the-data": dataImage,
};
const OUTCOME_ORDER = Object.keys(OUTCOME_LANDINGS) as PublicOutcome[];

const OUTCOME_NOTES: Record<PublicOutcome, string> = {
  "get-help": "Start with what is happening now. Keep control of what you share.",
  learn: "Build knowledge at your pace, with practical next steps.",
  "work-earn": "Turn experience into a pathway toward work that fits.",
  connect: "Find the people and organizations already moving alongside you.",
  fund: "Make community priorities legible before you make the ask.",
  "see-the-data": "Look at place, sources, and limits together. Evidence is a starting point, not a verdict.",
};

function visiblePath(path: string, viewer: ReturnType<typeof useWorkspaceAccess>) {
  const route = navRoute(path);
  return !!route && canSeeRoute(route, viewer) && canOpenPath(path, viewer);
}

export default function OutcomeLandingPage({ outcome }: { outcome: PublicOutcome }) {
  const viewer = useWorkspaceAccess();
  const { isAuthenticated } = useAuth();
  const [audience] = useAudience();
  const { title, description, actions } = OUTCOME_LANDINGS[outcome];
  const accessibleActions = useMemo(() => actions.filter((path) => visiblePath(path, viewer)), [actions, viewer]);
  const search = useSearch();
  const queryPlace = new URLSearchParams(search).get("place")?.trim() || null;
  const placeSource = `${outcome}\0${queryPlace ?? ""}`;
  const [syncedPlaceSource, setSyncedPlaceSource] = useState(placeSource);
  const synchronized = syncedPlaceSource === placeSource;
  const [placeDraft, setPlaceDraft] = useState(queryPlace ?? "");
  const [explicitPlace, setExplicitPlace] = useState<string | null>(queryPlace);
  const [mapOpen, setMapOpen] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(false);
  const activeExplicitPlace = synchronized ? explicitPlace : queryPlace;
  const journey = useMagnetJourneyPlace(!!activeExplicitPlace);
  const mapPlace = activeExplicitPlace || journey.place || undefined;
  const mapLoading = !activeExplicitPlace && journey.pending;
  const placeLabel = activeExplicitPlace || journey.place;
  useEffect(() => {
    setSyncedPlaceSource(placeSource);
    setExplicitPlace(queryPlace);
    setPlaceDraft(queryPlace ?? "");
    setMapOpen(false);
    setPulseOpen(false);
  }, [placeSource, queryPlace]);

  function submitPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = placeDraft.trim();
    if (next) {
      setExplicitPlace(next);
      setMapOpen(true);
    }
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f2f0e7] text-[#182720]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10" aria-label="Outcome navigation" data-testid="outcome-landing" data-outcome={outcome}>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-[#18352b] text-[#e8e5d9]"><Compass size={17} /></span>
          TCAF <span className="font-normal text-[#617268]">/ ThriveUp</span>
        </Link>
        <Link href={`/tools?outcome=${outcome}`} className="inline-flex min-h-11 items-center gap-2 border-b border-[#18352b]/30 px-1 text-sm font-semibold hover:border-[#b84b31] hover:text-[#a64029]">
          All tools <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-5 md:px-10 md:pb-20 md:pt-10">
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#66736a]">
          <span>Community pathways</span><span aria-hidden="true">/</span><span>{title}</span>
          {audience && <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#aab4a5] px-3 py-1.5 normal-case tracking-normal text-[#3f5c4e]"><span className="h-1.5 w-1.5 rounded-full bg-[#b84b31]" />For {AUDIENCE_LABELS[audience]}</span>}
        </div>
        <div className="grid min-h-[470px] overflow-hidden bg-[#17362c] text-[#f3f0e5] md:grid-cols-[.9fr_1.1fr]">
          <div className="relative z-10 flex flex-col justify-between px-6 py-9 md:px-12 md:py-12">
            <div>
              <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#c4c9ae]"><span className="h-px w-8 bg-[#d06a4a]" />Need → next step</p>
              <h1 className="max-w-[620px] text-[clamp(3.5rem,8vw,7rem)] font-semibold leading-[.88] tracking-[-.065em]">{title}<span className="text-[#d06a4a]">.</span></h1>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-[#d4ddd3] md:text-xl">{description}</p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#aab9ae]">{OUTCOME_NOTES[outcome]}</p>
            </div>
            {accessibleActions[0] && <Link href={accessibleActions[0]} className="mt-6 inline-flex min-h-11 w-fit items-center gap-3 rounded border border-[#e7c18f]/50 px-4 text-sm font-semibold text-[#e7c18f] hover:text-white" data-testid="outcome-primary-action">{navRoute(accessibleActions[0])?.title}<ArrowRight size={16} aria-hidden="true" /></Link>}
            <a href="#start-here" className="mt-3 inline-flex min-h-11 w-fit items-center gap-3 text-sm font-semibold text-[#e7c18f] hover:text-white">More starting points <ArrowDown size={16} aria-hidden="true" /></a>
            <div className="mt-8 border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[.16em] text-[#aab9ae]">Field guide <span className="mx-2 text-[#d06a4a]">/</span> {String(OUTCOME_ORDER.indexOf(outcome) + 1).padStart(2, "0")} of 06</div>
          </div>
          <div className="relative min-h-[290px] overflow-hidden md:min-h-full">
            <img src={IMAGES[outcome]} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#17362c]/65 via-transparent to-[#17362c]/10 md:bg-gradient-to-l md:from-transparent md:via-[#17362c]/5 md:to-[#17362c]/50" />
            <div className="absolute left-5 top-5 flex items-center gap-2 border border-white/50 bg-[#17362c]/70 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#df7857]" /> Place matters
            </div>
            <div className="absolute bottom-5 right-5 max-w-[220px] border-l-2 border-[#d06a4a] bg-[#17362c]/80 px-4 py-3 text-xs leading-relaxed text-white backdrop-blur-sm">
              Illustrative AI-generated imagery, not program photography.
            </div>
          </div>
        </div>
      </section>

      <section id="start-here" className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 md:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)] md:px-10 md:pb-24">
        <div className="md:sticky md:top-8 md:self-start">
          <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">01 / Start with your need</p>
          <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-[.98] tracking-[-.045em] md:text-5xl">A real next step, not another dashboard.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#5d6b61]">Choose a direct route into the work. Access stays governed by each tool’s public, signed-in, staff, or admin permissions.</p>
          <Link href={`/tools?outcome=${outcome}`} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-sm bg-[#b74b30] px-5 text-sm font-semibold text-[#fff8ea] hover:bg-[#913a25]">
            Browse all {title.toLowerCase()} tools <ArrowRight size={16} />
          </Link>
        </div>
        <div className="border-t border-[#b8b9aa]">
          {accessibleActions.length ? accessibleActions.map((path, index) => {
            const route = navRoute(path);
            return (
              <Link href={path} key={path} className="group grid min-h-[100px] grid-cols-[44px_1fr_40px] items-center gap-3 border-b border-[#b8b9aa] py-4 transition-colors hover:bg-[#e7e5d9] md:grid-cols-[64px_1fr_48px]">
                <span className="font-mono text-xs text-[#9c472f]">0{index + 1}</span>
                <span>
                  <span className="block text-xl font-semibold tracking-tight md:text-2xl">{route?.title ?? path}</span>
                  <span className="mt-1 block max-w-xl text-sm leading-relaxed text-[#637067]">{route?.description ?? "Open this tool to continue."}</span>
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[#9ca89d] transition-transform group-hover:translate-x-1 group-hover:border-[#b74b30] group-hover:text-[#b74b30]"><ArrowUpRight size={17} /></span>
              </Link>
            );
          }) : <p className="py-8 text-sm text-[#66736a]">No direct tools are available for this account. Browse the full directory to see accessible routes.</p>}
        </div>
      </section>

      <section className="bg-[#e4e3d8]">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-14 md:grid-cols-[.7fr_1.3fr] md:px-10 md:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">02 / Geographic evidence</p>
            <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-[.98] tracking-[-.045em] md:text-5xl">Evidence has a place. Start with yours.</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#5d6b61]">Choose a ZIP, county, or city, or use the broad place saved in your journey. Map layers describe their sources and limits; they do not define an individual.</p>
            <form onSubmit={submitPlace} className="mt-7">
              <label htmlFor="place-query" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#41594a]">Your place (optional)</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <MapPin className="absolute left-3 top-3.5 text-[#738176]" size={16} aria-hidden="true" />
                  <input id="place-query" value={placeDraft} onChange={(e) => setPlaceDraft(e.target.value)} placeholder="78701, county:48453, or Austin, TX" className="min-h-12 w-full border border-[#9ca89d] bg-[#f5f3eb] pl-10 pr-3 text-sm outline-none focus:border-[#b74b30] focus:ring-2 focus:ring-[#b74b30]/20" />
                </div>
                <button type="submit" disabled={!placeDraft.trim()} className="min-h-12 shrink-0 bg-[#18352b] px-5 text-sm font-semibold text-[#f3f0e5] hover:bg-[#2e5142] disabled:cursor-not-allowed disabled:opacity-50">Use this place</button>
              </div>
            </form>
            {placeLabel && <div className="mt-4 flex items-center gap-2 text-sm text-[#41594a]"><Check size={15} /> Map context: <strong>{placeLabel}</strong>{explicitPlace && <button type="button" onClick={() => { setExplicitPlace(null); setPlaceDraft(""); }} className="ml-1 inline-flex min-h-11 items-center gap-1 underline underline-offset-2"><X size={13} /> Clear</button>}</div>}
            {journey.error && !explicitPlace && <p className="mt-3 text-sm text-[#9c472f]" role="status">Your saved place could not be loaded. Enter a place above to continue.</p>}
            {journey.unsupported && !explicitPlace && <p className="mt-3 text-sm text-[#637067]" role="status">Saved place context is not available for this account. You can still enter a place above.</p>}
            <p className="mt-6 flex items-start gap-2 border-l-2 border-[#b74b30] pl-3 text-xs leading-relaxed text-[#5d6b61]"><ShieldCheck size={16} className="mt-0.5 shrink-0" />No default city is assumed. Your entered place takes priority over a saved journey place.</p>
            <button type="button" onClick={() => setMapOpen((current) => !current)} aria-expanded={mapOpen} aria-controls="evidence-map" className="mt-7 inline-flex min-h-12 items-center gap-2 border border-[#18352b] px-4 text-sm font-semibold hover:bg-[#18352b] hover:text-[#f3f0e5]">
              <Search size={15} /> {mapOpen ? "Close geographic evidence" : "Open geographic evidence"}
            </button>
          </div>
          <div id="evidence-map" className="min-w-0">
            {mapOpen && synchronized ? (
              <div className="border border-[#b1b8aa] bg-[#f3f0e7] p-3 md:p-5">
                <div className="mb-4 flex items-center justify-between border-b border-[#c4c6b9] pb-3">
                  <div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#9c472f]">Live map / sourced evidence</p><p className="mt-1 text-sm font-semibold">{placeLabel || "Choose a place above to scope the map"}</p></div>
                  <button type="button" className="grid min-h-11 min-w-11 place-items-center text-[#526157] hover:text-[#9c472f]" onClick={() => setMapOpen(false)} aria-label="Close map"><X size={17} /></button>
                </div>
                {mapLoading ? <div role="status" className="space-y-3 py-5"><div className="h-5 w-40 animate-pulse bg-[#d9ddd2]" /><div className="h-[300px] animate-pulse bg-[#dfe2d8]" /><p className="text-xs text-[#637067]">Checking your saved journey place…</p></div>
                  : <Suspense fallback={<div role="status" className="h-[380px] animate-pulse bg-[#dfe2d8] p-5 text-sm text-[#637067]">Preparing the evidence map…</div>}>
                    {mapPlace ? <MagnetMap place={mapPlace} height="400px" /> : <div className="grid min-h-[300px] place-items-center border border-dashed border-[#aab4a5] p-8 text-center"><div><MapPin className="mx-auto text-[#9c472f]" size={24} /><p className="mt-3 font-semibold">A place is needed to query geographic evidence.</p><p className="mt-2 max-w-sm text-sm text-[#637067]">Enter a ZIP, county, or city above, or sign in to use a place saved in your journey.</p></div></div>}
                  </Suspense>}
              </div>
            ) : <div className="relative flex min-h-[330px] items-end overflow-hidden bg-[#17362c] p-6 text-[#f3f0e5] md:min-h-[470px] md:p-9">
              <div className="absolute inset-0 opacity-40" aria-hidden="true" style={{ backgroundImage: "linear-gradient(90deg, transparent 49.8%, #9cac91 50%, transparent 50.2%), linear-gradient(transparent 49.8%, #9cac91 50%, transparent 50.2%)", backgroundSize: "48px 48px" }} />
              <div className="absolute right-[16%] top-[18%] h-36 w-36 rounded-full border border-[#d8a67f]/50" aria-hidden="true" />
              <div className="absolute right-[21%] top-[27%] h-24 w-24 rounded-full border border-[#d8a67f]/60" aria-hidden="true" />
              <div className="absolute right-[32%] top-[35%] h-3 w-3 rounded-full bg-[#d06a4a] ring-8 ring-[#d06a4a]/20" aria-hidden="true" />
              <div className="relative max-w-md"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#e7c18f]">Map remains closed until requested</p><p className="mt-3 text-2xl font-semibold leading-tight">Local need, organizational presence, and resources—in their geographic context.</p><p className="mt-3 text-sm leading-relaxed text-[#c4cfc5]">The map loads only after you open it. No location is guessed or silently substituted.</p></div>
            </div>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 md:py-14">
        <details className="group border-y border-[#b8b9aa]">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b74b30]">
            <span><span className="mr-3 font-mono text-[10px] uppercase tracking-[.15em] text-[#9c472f]">Further analysis</span>Open specialist visual tools</span>
            <ArrowDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="max-w-2xl pb-4 text-sm leading-relaxed text-[#5d6b61]">These specialist pages contain the platform’s own community visualizations. We link to their evidence and methods instead of estimating community costs, savings, or correlations here.</p>
          <div className="grid gap-3 pb-5 sm:grid-cols-2">
            {(["/community-impact", "/community-analysis"] as const).filter((path) => visiblePath(path, viewer)).map((path) => {
              const route = navRoute(path);
              return <Link key={path} href={path} className="flex min-h-[76px] items-center justify-between gap-3 border border-[#b8b9aa] bg-[#e9e8de] px-4 py-3 hover:border-[#b74b30]">
                <span><span className="block font-semibold">{route?.title ?? (path === "/community-impact" ? "Community Impact" : "Community Analysis")}</span><span className="mt-1 block text-xs text-[#637067]">{route?.description ?? "Open the specialist evidence tool."}</span></span>
                <ArrowUpRight size={17} className="shrink-0 text-[#9c472f]" />
              </Link>;
            })}
          </div>
        </details>
      </section>

      {isAuthenticated && <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">03 / Shared operational context</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-.045em] md:text-5xl">A view across the work.</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#5d6b61]">This signed-in snapshot reflects available aggregate operational records. It is not a personal outcome estimate.</p>
          </div>
          <div className="border-l-2 border-[#b74b30] bg-[#e7e5d9] p-5 md:p-7">
            <p className="text-sm font-semibold">System snapshot is closed by default.</p>
            <p className="mt-2 text-sm leading-relaxed text-[#5d6b61]">Open it when you are ready to load authenticated aggregate data. Unavailable values remain unavailable.</p>
            <button type="button" onClick={() => setPulseOpen((open) => !open)} aria-expanded={pulseOpen} className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#18352b] px-4 text-sm font-semibold text-[#f3f0e5] hover:bg-[#2e5142]"><Radio size={15} />{pulseOpen ? "Hide system snapshot" : "Open system snapshot"}</button>
            {pulseOpen && <Suspense fallback={<div role="status" className="mt-5 space-y-3"><div className="h-10 animate-pulse bg-[#d4d8cc]" /><div className="h-40 animate-pulse bg-[#d4d8cc]" />Loading the signed-in system snapshot…</div>}><div className="mt-5"><SystemPulse /></div></Suspense>}
          </div>
        </div>
      </section>}

      <section className="bg-[#18352b] text-[#f3f0e5]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#df9975]">04 / Choose another direction</p>
          <div className="mt-5 grid gap-8 md:grid-cols-[.7fr_1.3fr] md:items-end">
            <h2 className="text-4xl font-semibold leading-[.98] tracking-[-.045em] md:text-5xl">One need can open several doors.</h2>
            <p className="max-w-xl text-sm leading-relaxed text-[#c4cfc5]">Follow the route that fits today. Every page is a practical tool, with its own access rules and evidence boundaries.</p>
          </div>
          <nav aria-label="Other community outcomes" className="mt-10 grid border-t border-white/20 sm:grid-cols-2 lg:grid-cols-3">
            {OUTCOME_ORDER.map((item, index) => (
              <Link key={item} href={outcomeLandingPath(item)} aria-current={item === outcome ? "page" : undefined} className={`group flex min-h-[104px] items-center justify-between gap-4 border-b border-white/20 px-1 py-4 sm:px-4 ${item === outcome ? "text-[#df9975]" : "hover:text-[#df9975]"}`}>
                <span><span className="mb-1 block font-mono text-[10px] text-[#93a79a]">0{index + 1}</span><span className="text-xl font-semibold tracking-tight">{OUTCOME_LABELS[item]}</span></span>
                <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </nav>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5 text-xs text-[#aab9ae]">
            <span>TCAF + ThriveUp <span className="mx-2 text-[#df9975]">/</span> Tools for people doing the work</span>
            <Link href={`/tools?outcome=${outcome}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#f3f0e5] hover:text-[#df9975]">Explore {title} tools <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}