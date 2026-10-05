import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowRight, ArrowUpRight, Banknote, Compass, GraduationCap, Landmark, MapPin, Users } from "lucide-react";
import { canSeeRoute, navRoute } from "@shared/route-nav";
import {
  DEMO_AUDIENCE_KEYS,
  DEMO_FUNDING_ASK,
  DEMO_FORMAT_EXAMPLE,
  DEMO_GO_LIVE,
  DEMO_HONESTY_FOOTER,
  DEMO_LIVE_UNAVAILABLE,
  DEMO_VIEWS,
  isValidDemoAudience,
  type DemoAudienceKey,
  type DemoStep,
} from "@shared/demo-stories";
import { useWorkspaceAccess } from "@/lib/workspace-context";

/**
 * Stakeholder Demo Door (one canonical route: /demo?audience=...&place=...).
 * Real-data-only: links resolve through the route registry; benchmarks are
 * cited; the only non-data visual is a clearly-badged format example.
 * Registry is the single link source (G1); no hardcoded route lists here.
 */

const AUDIENCE_ICONS: Record<DemoAudienceKey, typeof Banknote> = {
  banks: Banknote,
  schools: GraduationCap,
  governments: Landmark,
  entities: Users,
};

function LaneBadge({ lane }: { lane: "live" | "benchmark" | "format" }) {
  const meta = {
    live: "Live platform data",
    benchmark: "External benchmark",
    format: "Format example — report layout, not data.",
  }[lane];
  const cls = {
    live: "border-[#3f5c4e] text-[#3f5c4e]",
    benchmark: "border-[#8a6d1f] text-[#7a5f1c]",
    format: "border-[#6b6455] text-[#5d574a]",
  }[lane];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em] ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${lane === "live" ? "bg-[#2f6b4f]" : lane === "benchmark" ? "bg-[#b8860b]" : "bg-[#8b8375]"}`} aria-hidden="true" />
      {meta}
    </span>
  );
}

function StepChain({ title, steps, numbered }: { title: string; steps: DemoStep[]; numbered?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">{title}</p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => {
          const route = navRoute(step.route);
          return (
            <li key={step.route}>
              <Link
                href={step.route}
                className="group flex min-h-[68px] items-center justify-between gap-3 rounded-lg border border-[#b8b9aa] bg-[#e9e8de] px-4 py-3 hover:border-[#b74b30]"
                aria-label={step.label}
              >
                <span>
                  {numbered && <span className="mb-0.5 block font-mono text-[10px] text-[#9c472f]">{String(i + 1).padStart(2, "0")}</span>}
                  <span className="block text-sm font-semibold leading-snug">{step.label}</span>
                  {route && <span className="mt-0.5 block text-[11px] text-[#637067]">{route.title}</span>}
                </span>
                <ArrowUpRight size={16} className="shrink-0 text-[#9c472f] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function DemoDoor() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const viewer = useWorkspaceAccess();
  const params = new URLSearchParams(search);
  const audienceParam = params.get("audience");
  const audience: DemoAudienceKey = isValidDemoAudience(audienceParam) ? audienceParam : "banks";
  const explicitPlace = params.get("place")?.trim() || null;
  const [placeDraft, setPlaceDraft] = useState(explicitPlace ?? "");
  useEffect(() => { setPlaceDraft(explicitPlace ?? ""); }, [explicitPlace]);
  const view = DEMO_VIEWS[audience];

  function setAudience(next: DemoAudienceKey) {
    const p = new URLSearchParams(search);
    p.set("audience", next);
    navigate(`/demo?${p.toString()}`, { replace: true });
  }

  function submitPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = placeDraft.trim();
    const p = new URLSearchParams(search);
    next ? p.set("place", next) : p.delete("place");
    const qs = p.toString();
    navigate(`/demo${qs ? `?${qs}` : ""}`, { replace: true });
  }

  const ctaHref = audience === "banks" && explicitPlace
    ? `${view.cta.route}?place=${encodeURIComponent(explicitPlace)}`
    : view.cta.route;
  const liveTools = view.liveTools
    .map((path) => navRoute(path))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .filter((r) => canSeeRoute(r, viewer));

  return (
    <main className="min-h-[100dvh] bg-[#f2f0e7] text-[#182720]" data-testid="demo-door" data-audience={audience}>
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10" aria-label="Demo navigation">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-[#18352b] text-[#e8e5d9]"><Compass size={17} /></span>
          TCAF <span className="font-normal text-[#617268]">/ ThriveUp</span>
        </Link>
        <Link href="/tools" className="inline-flex min-h-11 items-center gap-2 border-b border-[#18352b]/30 px-1 text-sm font-semibold hover:border-[#b84b31] hover:text-[#a64029]">
          All tools <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#66736a]">
          <span>Stakeholder demo</span><span aria-hidden="true">/</span><span>{view.tab}</span>
          <span className="ml-auto"><LaneBadge lane="live" /></span>
        </div>
        <div className="grid min-h-[380px] overflow-hidden bg-[#17362c] text-[#f3f0e5] md:grid-cols-[1.1fr_.9fr]">
          <div className="flex flex-col justify-between px-6 py-9 md:px-12 md:py-12">
            <div>
              <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#c4c9ae]">
                <span className="h-px w-8 bg-[#d06a4a]" />Who we are, what we do
              </p>
              <h1 className="max-w-[560px] text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[.95] tracking-[-.05em]">{view.headline}</h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#d4ddd3]">{view.subcopy}</p>
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-4">
              <form onSubmit={submitPlace} className="min-w-0">
                <label htmlFor="demo-place" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#aab9ae]">Your community (optional)</label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <MapPin className="absolute left-3 top-3.5 text-[#738176]" size={16} aria-hidden="true" />
                    <input
                      id="demo-place"
                      value={placeDraft}
                      onChange={(e) => setPlaceDraft(e.target.value)}
                      placeholder="ZIP, county, or city"
                      className="min-h-12 w-full min-w-[180px] border border-[#4c6a5a] bg-[#12291f] pl-10 pr-3 text-sm text-[#f3f0e5] outline-none placeholder:text-[#6f8074] focus:border-[#d06a4a]"
                      data-testid="demo-place-input"
                    />
                  </div>
                  <button type="submit" disabled={!placeDraft.trim()} className="min-h-12 shrink-0 bg-[#b74b30] px-4 text-sm font-semibold text-[#fff8ea] hover:bg-[#913a25] disabled:cursor-not-allowed disabled:opacity-50" data-testid="demo-place-submit">
                    Use
                  </button>
                </div>
              </form>
              <Link href={ctaHref} className="inline-flex min-h-12 items-center gap-3 border border-[#e7c18f]/50 px-4 text-sm font-semibold text-[#e7c18f] hover:text-white" data-testid="demo-cta">
                {view.cta.label} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="relative min-h-[260px] border-t border-white/10 md:min-h-full md:border-l md:border-t-0">
            <div className="absolute inset-0 opacity-30" aria-hidden="true" style={{ backgroundImage: "linear-gradient(90deg, transparent 49.8%, #2c5041 50%, transparent 50.2%), linear-gradient(transparent 49.8%, #2c5041 50%, transparent 50.2%)", backgroundSize: "44px 44px" }} />
            <div className="relative flex h-full flex-col justify-between p-6 md:p-9">
              <nav aria-label="Choose your view" className="grid gap-2" data-testid="demo-audience-tabs">
                {DEMO_AUDIENCE_KEYS.map((key) => {
                  const Icon = AUDIENCE_ICONS[key];
                  const active = key === audience;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAudience(key)}
                      aria-pressed={active}
                      data-testid={`demo-tab-${key}`}
                      className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 text-left text-sm font-semibold transition-colors ${active ? "border-[#d06a4a] bg-[#1d4235] text-white" : "border-white/15 bg-[#17362c]/60 text-[#c4cfc5] hover:border-[#d06a4a]/60"}`}
                    >
                      <Icon size={17} aria-hidden="true" /> {DEMO_VIEWS[key].tab}
                    </button>
                  );
                })}
              </nav>
              {explicitPlace && (
                <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#aab4a5]/40 px-3 py-1.5 text-xs text-[#d4ddd3]" data-testid="demo-place-badge">
                  <MapPin size={12} aria-hidden="true" /> Showing: <strong>{explicitPlace}</strong>
                </p>
              )}
              <p className="mt-6 max-w-xs border-l-2 border-[#d06a4a] pl-3 font-mono text-[10px] uppercase leading-relaxed tracking-[.14em] text-[#aab9ae]">
                No default city is assumed. No synthetic data about a city, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <StepChain title="01 / The value chain — from need to measurable outcome" steps={view.chain} numbered />
        <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">02 / The story</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.03em] md:text-4xl">{view.story.title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#5d6b61]">{view.story.intro}</p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-[#637067]">{DEMO_LIVE_UNAVAILABLE} Tools always show their own live data with sources and dates.</p>
          </div>
          <div className="space-y-8">
            <StepChain title="Follow one journey — live tools" steps={view.story.steps} numbered />
            <StepChain title={view.story.zoomTitle} steps={view.story.zoom} />
          </div>
        </div>
      </section>

      <section className="bg-[#e4e3d8]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] md:px-10 md:py-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">03 / Open the live tools</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.03em] md:text-4xl">This is the platform, not a mockup.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#5d6b61]">
              Every destination below is live today. Each one states its own sources, methods, and limits — that is the standard across the whole system.
            </p>
            {audience === "banks" && (
              <div className="mt-6 border-l-2 border-[#b74b30] bg-[#e7e5d9] p-4" data-testid="demo-funding-ask">
                <p className="text-sm font-semibold">{DEMO_FUNDING_ASK.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5d6b61]">{DEMO_FUNDING_ASK.body}</p>
                <p className="mt-2 text-xs italic text-[#637067]">{DEMO_FUNDING_ASK.note}</p>
              </div>
            )}
          </div>
          <div className="border-t border-[#b8b9aa]">
            {liveTools.map((route) => (
              <Link key={route.path} href={audience === "banks" && explicitPlace && route.path === "/community-banks" ? `${route.path}?place=${encodeURIComponent(explicitPlace)}` : route.path} className="group grid min-h-[84px] grid-cols-[1fr_40px] items-center gap-3 border-b border-[#b8b9aa] py-3 transition-colors hover:bg-[#e7e5d9]" data-testid={`demo-tool-${route.path.replace(/[^a-z0-9]+/gi, "-")}`}>
                <span>
                  <span className="block text-base font-semibold tracking-tight">{route.title}</span>
                  <span className="mt-1 block max-w-xl text-sm leading-relaxed text-[#637067]">{route.description}</span>
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[#9ca89d] transition-transform group-hover:translate-x-1 group-hover:border-[#b74b30] group-hover:text-[#b74b30]"><ArrowUpRight size={17} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">04 / Why it matters</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.03em] md:text-4xl">Benchmarks, cited.</h2>
            <div className="mt-6 space-y-3">
              {view.benchmarks.length ? view.benchmarks.map((b) => (
                <figure key={b.url} className="rounded-lg border border-[#b8b9aa] bg-[#e9e8de] p-4" data-testid="demo-benchmark">
                  <LaneBadge lane="benchmark" />
                  <blockquote className="mt-3 text-sm leading-relaxed text-[#3f4a43]">{b.claim}</blockquote>
                  <figcaption className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#637067]">
                    <span className="font-semibold text-[#3f5c4e]">{b.source}</span><span>·</span><span>{b.year}</span>
                    <a href={b.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex min-h-11 items-center gap-1 underline underline-offset-2 hover:text-[#a64029]">Source <ArrowUpRight size={12} aria-hidden="true" /></a>
                  </figcaption>
                </figure>
              )) : <p className="text-sm text-[#637067]">No external benchmarks on this view — the live tools carry their own sourced data.</p>}
            </div>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">05 / Reporting</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.03em] md:text-4xl">Reporting, previewed.</h2>
            <div className="mt-6 rounded-lg border border-[#b1b8aa] bg-[#f5f3eb] p-5" data-testid="demo-report-format">
              <LaneBadge lane="format" />
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[.14em] text-[#9c472f]">{DEMO_FORMAT_EXAMPLE.title}</p>
              <ul className="mt-3 divide-y divide-[#d5d2c3] border border-[#d5d2c3] bg-white/60">
                {DEMO_FORMAT_EXAMPLE.fields.map((field) => (
                  <li key={field} className="px-4 py-2.5 font-mono text-xs text-[#5d6b61]">{field}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-[#637067]">{DEMO_FORMAT_EXAMPLE.caption}</p>
            </div>
            <p className="mt-4 text-sm text-[#5d6b61]">
              Real reports are generated from live data:{" "}
              <Link href="/community-story-pack" className="underline underline-offset-2 hover:text-[#a64029]">Community Story Pack</Link> ·{" "}
              <Link href="/academy/progress-report" className="underline underline-offset-2 hover:text-[#a64029]">Academy Progress Report</Link> ·{" "}
              <Link href="/transparency" className="underline underline-offset-2 hover:text-[#a64029]">Transparency Dashboard</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#18352b] text-[#f3f0e5]">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#df9975]">06 / Go live</p>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-.03em] md:text-4xl">Running this in your community is five steps.</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {DEMO_GO_LIVE.map((step, i) => (
              <li key={step.route}>
                <Link href={step.route} className="group flex min-h-[96px] flex-col justify-between gap-3 rounded-lg border border-white/15 bg-[#17362c] p-4 hover:border-[#df9975]" data-testid={`demo-golive-${step.route.replace(/[^a-z0-9]+/gi, "-")}`}>
                  <span className="font-mono text-[10px] text-[#93a79a]">STEP {i + 1}</span>
                  <span className="flex items-end justify-between gap-2 text-sm font-semibold leading-snug">{step.label}<ArrowUpRight size={15} className="shrink-0 text-[#df9975] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl border-t border-white/15 pt-5 text-xs leading-relaxed text-[#aab9ae]">{DEMO_HONESTY_FOOTER}</p>
        </div>
      </section>
    </main>
  );
}
