import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Compass, ExternalLink, MapPin } from "lucide-react";
import { HuttoReadyStrip } from "@/components/hutto-ready-strip";
import { FocusedInvitation } from "@/components/focused-invitation";
import { RESOURCE_CATEGORIES } from "@/data/resource-directory";
import { mentorshipPrograms } from "@/data/mentorship-programs";
import { HUTTO_PLACE, isHuttoPlace } from "@shared/places/hutto";
import {
  HUTTO_COMPOSITE_LABEL,
  HUTTO_DISCLAIMER,
  HUTTO_JOURNEY,
  HUTTO_ORCHESTRATION,
  HUTTO_PROBLEM,
  HUTTO_READY_LINKS,
  HUTTO_READY_TITLE,
  HUTTO_SOLUTION,
  HUTTO_SPONSOR_SLOT,
  HUTTO_STAKEHOLDERS,
  type HuttoFact,
} from "@shared/hutto-ready";

/**
 * /hutto — Hutto Ready integrated demo (ThriveUp is the hub).
 * Facts come only from shared/hutto-ready.ts (spec-allowed, each with a source link).
 * Resources are the real records already in ThriveUp's directories, filtered to Hutto /
 * Williamson County; nothing is invented. The family is a labeled composite.
 */

const HUTTO_TEXT = /\bhutto\b|williamson/i;

/** Matches server/route-meta.ts "/hutto" so SPA navigation (e.g. from /demo) gets the same title as a hard load. */
const HUTTO_DOCUMENT_TITLE = `${HUTTO_READY_TITLE} | ThriveUp`;

function FactList({ facts }: { facts: HuttoFact[] }) {
  if (!facts.length) return null;
  return (
    <ul className="mt-3 space-y-2">
      {facts.map((f) => (
        <li key={f.id} className="text-sm leading-relaxed">
          {f.text}{" "}
          <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex flex-wrap items-center gap-1 break-words text-xs font-semibold text-[#9c472f] underline underline-offset-2 hover:text-[#6e2f1d]">
            Source: {f.source} <ExternalLink size={11} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#9c472f]">{children}</p>;
}

export default function HuttoReadyPage() {
  const [draft, setDraft] = useState("Hutto");
  const [checked, setChecked] = useState<string | null>(null);
  useEffect(() => {
    const previous = document.title;
    document.title = HUTTO_DOCUMENT_TITLE;
    return () => { document.title = previous; };
  }, []);

  const directoryRecords = useMemo(() => RESOURCE_CATEGORIES.flatMap((cat) =>
    cat.organizations
      .filter((org) => !org.national && HUTTO_TEXT.test(`${org.name} ${org.description} ${org.focus.join(" ")}`))
      .map((org) => ({ name: org.name, description: org.description, website: org.website, category: cat.label })),
  ), []);
  const mentorshipRecords = useMemo(() => mentorshipPrograms.filter((p) => p.zipCodes.includes(HUTTO_PLACE.zip)), []);

  function checkPlace(e: FormEvent) {
    e.preventDefault();
    setChecked(draft.trim());
  }
  const checkedIsHutto = checked ? isHuttoPlace(checked) : false;
  const platformHref = (key: string) => HUTTO_READY_LINKS.find((l) => l.key === key)!;

  return (
    <div className="min-h-[100dvh] bg-[#f2f0e7] text-[#182720]" data-testid="hutto-ready-page">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10" aria-label="Hutto Ready navigation">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-[#18352b] text-[#e8e5d9]"><Compass size={17} aria-hidden="true" /></span>
          TCAF <span className="font-normal text-[#617268]">/ ThriveUp</span>
        </Link>
        <Link href={`/demo?audience=schools&place=${encodeURIComponent(HUTTO_PLACE.display)}`} className="inline-flex min-h-11 items-center gap-2 border-b border-[#18352b]/30 px-1 text-sm font-semibold hover:border-[#b84b31] hover:text-[#a64029]">
          Stakeholder demo <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <div className="mx-auto max-w-[1440px] space-y-10 px-5 pb-16 md:px-10">
        {/* Hero */}
        <section className="overflow-hidden bg-[#17362c] text-[#f3f0e5]" aria-labelledby="hutto-hero-title">
          <div className="grid gap-8 px-6 py-10 md:grid-cols-[1.2fr_.8fr] md:px-12 md:py-14">
            <div>
              <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#c4c9ae]">
                <MapPin size={13} aria-hidden="true" /> {HUTTO_PLACE.label} · {HUTTO_PLACE.countyName}
              </p>
              <h1 id="hutto-hero-title" className="max-w-[720px] text-[clamp(2.1rem,5vw,4rem)] font-semibold leading-[.98] tracking-[-.04em]">{HUTTO_READY_TITLE}</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#d4ddd3]">
                One family, six platforms, one community. ThriveUp is the front door: it recognizes Hutto by name and hands each family member to the right link.
              </p>
            </div>
            <form onSubmit={checkPlace} className="self-end rounded-lg border border-white/15 bg-[#12291f] p-5" aria-label="Check a place name">
              <label htmlFor="hutto-place-check" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#aab9ae]">Try a place name or ZIP</label>
              <div className="flex flex-wrap gap-2">
                <input id="hutto-place-check" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Hutto, 78634, Hutto ISD" className="min-h-12 min-w-[180px] flex-1 border border-[#4c6a5a] bg-[#0f2219] px-3 text-sm text-[#f3f0e5] outline-none placeholder:text-[#8a9b8f] focus:border-[#d06a4a]" data-testid="hutto-place-input" />
                <button type="submit" disabled={!draft.trim()} className="min-h-12 bg-[#b74b30] px-4 text-sm font-semibold text-[#fff8ea] hover:bg-[#913a25] disabled:opacity-50" data-testid="hutto-place-submit">Check</button>
              </div>
              <p className="mt-3 min-h-[1.5rem] text-sm" role="status" aria-live="polite" data-testid="hutto-place-result">
                {checked === null ? "" : checkedIsHutto
                  ? <>Recognized: <strong>{HUTTO_PLACE.label}</strong>, {HUTTO_PLACE.countyName}. <Link href={`/411?place=${encodeURIComponent(checked)}`} className="underline underline-offset-2">Open Community 411 for Hutto</Link></>
                  : <>Not a Hutto input. Other places resolve in the <Link href={`/demo?place=${encodeURIComponent(checked)}`} className="underline underline-offset-2">stakeholder demo</Link>.</>}
              </p>
            </form>
          </div>
        </section>

        <p className="border-l-4 border-[#b74b30] bg-[#e9e8de] px-4 py-3 text-sm" data-testid="hutto-disclaimer">{HUTTO_DISCLAIMER}</p>

        <HuttoReadyStrip current="thriveup" />

        {/* Problem → Solution → Fix */}
        <section aria-labelledby="hutto-psf-title">
          <h2 id="hutto-psf-title" className="text-2xl font-semibold tracking-tight">Problem → Solution → Fix</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <article className="border border-[#b8b9aa] bg-[#f7f6f0] p-5">
              <SectionLabel>01 · Problem</SectionLabel>
              <h3 className="mt-2 text-lg font-semibold">Growth is arriving faster than families can navigate it</h3>
              <FactList facts={HUTTO_PROBLEM} />
            </article>
            <article className="border border-[#b8b9aa] bg-[#f7f6f0] p-5">
              <SectionLabel>02 · Solution</SectionLabel>
              <h3 className="mt-2 text-lg font-semibold">Hutto already has strong programs</h3>
              <FactList facts={HUTTO_SOLUTION} />
            </article>
            <article className="border border-[#b8b9aa] bg-[#f7f6f0] p-5">
              <SectionLabel>03 · Fix</SectionLabel>
              <h3 className="mt-2 text-lg font-semibold">Connect the links so a family only starts once</h3>
              <p className="mt-3 text-sm leading-relaxed">The programs exist; the gap is the handoff between them. Hutto Ready links six platforms behind one front door, each with its own Hutto page. The proposed next step is for every handoff to go to a named person and be measured; partner contacts are still to be confirmed.</p>
              <p className="mt-3 text-sm leading-relaxed text-[#4f5d55]">Local outcome data is not connected yet, so no outcome numbers are shown here.</p>
            </article>
          </div>
        </section>

        {/* Family journey */}
        <section aria-labelledby="hutto-journey-title">
          <h2 id="hutto-journey-title" className="text-2xl font-semibold tracking-tight">One family, six stops</h2>
          <p className="mt-2 inline-flex rounded-full border border-[#6b6455] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-[#5d574a]" data-testid="hutto-composite-label">{HUTTO_COMPOSITE_LABEL}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed">Maria works an early shift. Leo (4) is on a Pre-K waitlist. Andre (14) is interested in robotics. Sofia (17) has a summer internship offer and her first paycheck coming.</p>
          <ol className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {HUTTO_JOURNEY.map((stop) => {
              const link = platformHref(stop.platform);
              const internal = stop.platform === "thriveup";
              return (
                <li key={stop.n} className="flex flex-col border border-[#b8b9aa] bg-[#f7f6f0] p-5" data-testid={`hutto-stop-${stop.n}`}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#18352b] font-mono text-sm text-[#f3f0e5]" aria-hidden="true">{stop.n}</span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#9c472f]">Stop {stop.n} · {link.name} · {stop.who}</p>
                      <h3 className="text-base font-semibold leading-snug">{stop.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed"><strong>What you'll see:</strong> {stop.see}</p>
                  <FactList facts={stop.facts} />
                  <div className="mt-auto pt-4">
                    {internal ? (
                      <Link href={`/411?place=${encodeURIComponent(HUTTO_PLACE.display)}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#9c472f] hover:text-[#6e2f1d]">Open ThriveUp Community 411 for Hutto <ArrowRight size={15} aria-hidden="true" /></Link>
                    ) : (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#9c472f] hover:text-[#6e2f1d]">Open {link.name} /hutto <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* What's in it for you */}
        <section aria-labelledby="hutto-wiify-title">
          <h2 id="hutto-wiify-title" className="text-2xl font-semibold tracking-tight">What's in it for you</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HUTTO_STAKEHOLDERS.map((s) => (
              <article key={s.org} className="border border-[#b8b9aa] bg-[#f7f6f0] p-5" data-testid={`hutto-stakeholder-${s.org.replace(/\W+/g, "-").toLowerCase()}`}>
                <h3 className="text-base font-semibold">{s.org}</h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  {s.gets.map((g) => <li key={g}>{g}</li>)}
                </ul>
                <FactList facts={s.facts} />
              </article>
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold" data-testid="hutto-sponsor-slot">{HUTTO_SPONSOR_SLOT}</p>
        </section>

        {/* Orchestration */}
        <section aria-labelledby="hutto-orch-title" className="bg-[#17362c] p-6 text-[#f3f0e5] md:p-10">
          <h2 id="hutto-orch-title" className="text-2xl font-semibold tracking-tight">How the links work together</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-5">
            {HUTTO_ORCHESTRATION.map((o, i) => (
              <li key={o.step} className="rounded-lg border border-white/15 bg-[#12291f] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#df9975]">{String(i + 1).padStart(2, "0")} {i < HUTTO_ORCHESTRATION.length - 1 ? "→" : ""}</p>
                <h3 className="mt-1 text-base font-semibold">{o.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d4ddd3]">{o.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Resources */}
        <section aria-labelledby="hutto-resources-title" id="resources">
          <h2 id="hutto-resources-title" className="text-2xl font-semibold tracking-tight">Hutto and Williamson County resources already in ThriveUp</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4f5d55]">
            These are existing records from ThriveUp's <Link href="/resource-directory" className="underline underline-offset-2">resource directory</Link> and <Link href="/mentorship-directory" className="underline underline-offset-2">mentorship directory</Link>, filtered to entries that name Hutto or Williamson County or list ZIP 78634. Nothing was added for this page.
          </p>
          {directoryRecords.length === 0 && mentorshipRecords.length === 0 ? (
            <p className="mt-4 border border-[#b8b9aa] bg-[#f7f6f0] p-4 text-sm" data-testid="hutto-resources-empty">No Hutto or Williamson County records are in the product yet.</p>
          ) : (
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-base font-semibold">Resource directory ({directoryRecords.length})</h3>
                {directoryRecords.length === 0 ? <p className="mt-2 text-sm">None found.</p> : (
                  <ul className="mt-3 divide-y divide-[#b8b9aa] border-y border-[#b8b9aa]" data-testid="hutto-directory-records">
                    {directoryRecords.map((r) => (
                      <li key={r.name} className="py-3">
                        <p className="text-sm font-semibold">{r.website ? <a href={r.website} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{r.name}<span className="sr-only"> (opens in a new tab)</span></a> : r.name}</p>
                        <p className="text-xs text-[#5d574a]">{r.category}</p>
                        <p className="mt-1 text-sm leading-relaxed">{r.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold">Mentorship programs listing ZIP 78634 ({mentorshipRecords.length})</h3>
                {mentorshipRecords.length === 0 ? <p className="mt-2 text-sm">None found.</p> : (
                  <ul className="mt-3 divide-y divide-[#b8b9aa] border-y border-[#b8b9aa]" data-testid="hutto-mentorship-records">
                    {mentorshipRecords.map((p) => (
                      <li key={p.id} className="py-3">
                        <p className="text-sm font-semibold"><a href={p.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{p.name}<span className="sr-only"> (opens in a new tab)</span></a></p>
                        <p className="text-xs text-[#5d574a]">{p.agesServed} · {p.cost}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        <FocusedInvitation surfaceContext="hutto-ready" />

        <footer className="border-t border-[#b8b9aa] pt-6 text-xs leading-relaxed text-[#4f5d55]">
          <p>{HUTTO_DISCLAIMER}</p>
          <p className="mt-2">Family: {HUTTO_COMPOSITE_LABEL}. No student-level data is shown. Statistics appear only with their source link; data that is not connected is shown as missing.</p>
        </footer>
      </div>
    </div>
  );
}
