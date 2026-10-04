import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Printer, MapPin } from "lucide-react";

type Coverage = "observed" | "modeled" | "unavailable";
interface Indicator { id: string; label: string; value: number | null; unit: "count" | "usd" | "percent" | "ratio"; source: string; vintage: string; coverage: Coverage; scope: string; note?: string; href: string }
interface EcosystemNode { id: string; name: string; url: string; role: string; healthStatus: string | null; lastHealthCheck: string | null }
interface Profile { geography: { label: string; state: string; stateName: string; counties: { fips: string; name: string }[]; resolvedFrom: string }; indicators: Indicator[]; ecosystem: EcosystemNode[]; limits: string[]; generatedAt: string }

const CRA_LENS = [
  { category: "Affordable housing", tools: [{ label: "Find housing & shelter resources", href: "/get-help" }, { label: "Homelessness data (HUD PIT)", href: "/community-data" }, { label: "Referral loop for partner organizations", href: "/chw-dashboard" }] },
  { category: "Community services for low- and moderate-income people", tools: [{ label: "Benefits screener & guided apply", href: "/benefits-screener" }, { label: "SDOH explorer", href: "/sdoh-explorer" }, { label: "Child care access", href: "/child-care" }] },
  { category: "Economic development & workforce", tools: [{ label: "ThriveUp Academy (financial literacy, trade sims)", href: "/academy" }, { label: "Workforce & CEDS alignment", href: "/workforce" }, { label: "Grant & funding navigation", href: "/hub/fund" }] },
  { category: "Revitalization & stabilization", tools: [{ label: "Community analysis (GIS evidence)", href: "/community-analysis" }, { label: "Equity-Loss Engine", href: "/equity-loss" }, { label: "Community scenarios", href: "/community-impact" }] },
];

const FUNDED_ITEMS = [
  "Local activation: onboarding resident-facing partners and organizations in the assessment area.",
  "Coordination fidelity: community health worker and referral follow-through so a handoff closes, not just starts.",
  "Partner integration: connecting local agencies' systems to the referral and data loops.",
  "Reporting cadence: sourced, suppression-safe community reports on an agreed schedule.",
];

function formatValue(i: Indicator) {
  if (i.value === null) return "Not available";
  if (i.unit === "usd") return `$${i.value.toLocaleString()}`;
  if (i.unit === "percent") return `${i.value}%`;
  return i.value.toLocaleString();
}

const coverageStyle: Record<Coverage, string> = {
  observed: "bg-emerald-100 text-emerald-800",
  modeled: "bg-amber-100 text-amber-900",
  unavailable: "bg-slate-200 text-slate-700",
};

export default function CommunityBanksPage() {
  useEffect(() => { document.title = "Community Bank Impact View | TCAF + ThriveUp"; }, []);
  const search = useSearch();
  const [, navigate] = useLocation();
  const place = new URLSearchParams(search).get("place") ?? "";
  const [draft, setDraft] = useState(place);
  useEffect(() => { setDraft(place); }, [place]);

  const { data, isLoading, error } = useQuery<Profile>({
    queryKey: ["/api/community-banks/profile", place],
    queryFn: async () => {
      const res = await fetch(`/api/community-banks/profile${place ? `?place=${encodeURIComponent(place)}` : ""}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Profile unavailable");
      return body;
    },
    retry: false,
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    navigate(next ? `/community-banks?place=${encodeURIComponent(next)}` : "/community-banks");
  }

  const placeParam = data ? `?zip=${data.geography.counties[0]?.fips ?? ""}` : "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pt-6 print:px-0" data-testid="community-banks-page">
      <header className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#53776b]">TCAF / ThriveUp · For community banks</p>
        <h1 className="mt-1 font-[var(--font-display)] text-2xl font-semibold leading-tight tracking-tight sm:text-4xl" data-testid="text-cb-title">One view of a community: conditions, working tools, connected ecosystem</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">A free, cross-sector civic platform. This page scopes everything to one assessment area so a bank can see documented needs, open the tools residents and organizations use today, and understand what sponsorship supports. Every number shows its source and coverage.</p>
      </header>

      <form onSubmit={submit} className="mb-5 flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center print:hidden" aria-label="Choose assessment area">
        <label htmlFor="cb-place" className="flex items-center gap-1.5 text-sm font-semibold"><MapPin aria-hidden="true" className="h-4 w-4" /> Assessment area</label>
        <Input id="cb-place" value={draft} onChange={e => setDraft(e.target.value)} placeholder="ZIP, city like Chicago, IL, or county:48453" className="min-h-11 sm:max-w-xs" data-testid="input-cb-place" />
        <Button type="submit" className="min-h-11" data-testid="button-cb-place">Update view</Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => navigate("/community-banks")} data-testid="button-cb-default">Central Texas default</Button>
        <Button type="button" variant="ghost" className="min-h-11 sm:ml-auto" onClick={() => window.print()} data-testid="button-cb-print"><Printer aria-hidden="true" className="mr-1.5 h-4 w-4" /> Print one-pager</Button>
      </form>

      {isLoading && <div className="grid gap-3 sm:grid-cols-3" aria-busy="true">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>}
      {error && (
        <Card className="p-4" role="alert" data-testid="cb-error">
          <p className="font-semibold">That area could not be resolved.</p>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
        </Card>
      )}

      {data && (
        <>
          <section aria-labelledby="cb-snapshot" className="mb-8">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="cb-snapshot" className="text-xl font-semibold">Community snapshot — <span data-testid="text-cb-geography">{data.geography.label}</span></h2>
              <p className="text-xs text-muted-foreground">{data.geography.counties.length} count{data.geography.counties.length === 1 ? "y" : "ies"} · generated {new Date(data.generatedAt).toLocaleDateString()}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="cb-indicators">
              {data.indicators.map(i => (
                <Link key={i.id} href={i.href} className="group rounded-xl border bg-card p-4 transition hover:border-[#83aa9c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid={`cb-indicator-${i.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-5">{i.label}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${coverageStyle[i.coverage]}`} data-testid={`cb-coverage-${i.id}`}>{i.coverage}</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">{formatValue(i)}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{i.source} · {i.vintage} · {i.scope}</p>
                  {i.note && <p className="mt-1 text-xs leading-5 text-muted-foreground">{i.note}</p>}
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#28675d]">Open the full tool <ArrowRight aria-hidden="true" className="h-3 w-3 transition group-hover:translate-x-0.5" /></p>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="cb-cra" className="mb-8">
            <h2 id="cb-cra" className="text-xl font-semibold">Reading the platform through a CRA lens</h2>
            <p className="mt-1 text-sm text-muted-foreground">A reading guide that maps community-development categories to tools that already operate. It is not a legal or regulatory determination.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2" data-testid="cb-cra-lens">
              {CRA_LENS.map(row => (
                <Card key={row.category} className="p-4">
                  <h3 className="font-semibold">{row.category}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {row.tools.map(t => (
                      <li key={t.href}><Link href={t.href} className="inline-flex min-h-8 items-center gap-1 text-sm text-[#28675d] underline underline-offset-4">{t.label} <ArrowRight aria-hidden="true" className="h-3 w-3" /></Link></li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="cb-tools" className="mb-8 print:hidden">
            <h2 id="cb-tools" className="text-xl font-semibold">Try the tools, live</h2>
            <p className="mt-1 text-sm text-muted-foreground">The same public entrances residents use. No account required.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3" data-testid="cb-live-tools">
              {[
                { id: "find-support", label: "Find food, housing or care", href: "/get-help" },
                { id: "check-benefits", label: "Check benefits", href: `/benefits-screener${placeParam}` },
                { id: "learn-work", label: "Learn skills or explore careers", href: "/academy" },
              ].map(t => (
                <Link key={t.id} href={t.href} className="flex min-h-16 items-center justify-between rounded-xl border bg-[#fbfaf5] px-4 py-3 font-semibold hover:border-[#729b88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid={`cb-tool-${t.id}`}>{t.label} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/workspace/organizations" className="text-sm underline underline-offset-4" data-testid="cb-workspace-organizations">Organizations workspace</Link>
              <Link href="/workspace/funders" className="text-sm underline underline-offset-4" data-testid="cb-workspace-funders">Funders workspace</Link>
              <Link href="/workspace/community" className="text-sm underline underline-offset-4" data-testid="cb-workspace-community">Community & policy workspace</Link>
            </div>
          </section>

          <section aria-labelledby="cb-ecosystem" className="mb-8">
            <h2 id="cb-ecosystem" className="text-xl font-semibold">The connected ecosystem</h2>
            <p className="mt-1 text-sm text-muted-foreground">ThriveUp is the hub. The platforms below are owned and operated as one coordinated infrastructure; status reflects the most recent automated health check.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="cb-ecosystem">
              {data.ecosystem.map(n => (
                <li key={n.id} className="flex items-start gap-2 rounded-lg border bg-card p-3">
                  <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.healthStatus === "online" ? "bg-emerald-500" : n.healthStatus ? "bg-amber-500" : "bg-slate-400"}`} />
                  <div className="min-w-0">
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="break-words font-medium underline-offset-4 hover:underline" data-testid={`cb-platform-${n.id}`}>{n.name}</a>
                    <p className="text-xs text-muted-foreground">{n.role.replace(/-/g, " ")} · {n.healthStatus ?? "status unknown"}{n.lastHealthCheck ? ` · checked ${new Date(n.lastHealthCheck).toLocaleDateString()}` : ""}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground"><Link href="/ecosystem" className="underline underline-offset-4">Full ecosystem connector and integration documentation</Link></p>
          </section>

          <section aria-labelledby="cb-funding" className="mb-8">
            <h2 id="cb-funding" className="text-xl font-semibold">What sponsorship supports</h2>
            <p className="mt-1 text-sm leading-6">The software is free to communities. Sponsorship funds the human coordination that makes it work locally:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6" data-testid="cb-funding">
              {FUNDED_ITEMS.map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 print:hidden">
              <Link href="/partners/join?source=community-bank"><Button className="min-h-11" data-testid="cb-inquire">Start a sponsorship conversation</Button></Link>
              <Link href="/contact"><Button variant="outline" className="min-h-11" data-testid="cb-contact">Contact TCAF</Button></Link>
            </div>
          </section>

          <section aria-labelledby="cb-limits" className="rounded-xl border bg-muted/40 p-4">
            <h2 id="cb-limits" className="text-base font-semibold">Evidence and limits</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6" data-testid="cb-limits">
              <li><strong>Observed</strong> = reported by the named public source. <strong>Modeled</strong> = derived or estimated; the method is stated on the tile. <strong>Not available</strong> = the source did not return data for this area; nothing is substituted.</li>
              {data.limits.map(l => <li key={l}>{l}</li>)}
              <li>Fifty-state architecture; local depth varies by state and data vintage.</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
