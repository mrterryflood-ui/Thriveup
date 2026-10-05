import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { AUDIENCE_LABELS, type NavRoute } from "@shared/route-nav";
import { buildJourneyHref, type JourneyContext } from "@shared/journey-context";

/**
 * R8a — "How this fits": one registry-driven example panel for every door.
 * Renders only what the route registry already declares (audiences, description, guide line,
 * upstream need, downstream next steps). No per-page copy, no synthetic examples about any place.
 * Mounted by PageFrame, so every registered page carries it without per-page work.
 */
export function ToolExamplePanel({ route, from, next, journey }: { route: NavRoute; from: NavRoute[]; next: NavRoute[]; journey?: JourneyContext }) {
  const slug = (p: string) => p.replace(/[^a-z0-9]+/gi, "-");
  const href = (p: string) => buildJourneyHref(p, journey);
  return (
    <section aria-label="How this page fits" data-testid="tool-example-panel" data-route={route.path} className="mx-auto max-w-6xl mt-1 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-[auto_1fr]">
      {route.audiences.length > 0 && <>
        <span className="font-semibold text-foreground/80">Who it's for</span>
        <span data-testid="tool-example-audiences">{route.audiences.map(a => AUDIENCE_LABELS[a]).join(" · ")}</span>
      </>}
      {route.description && <>
        <span className="font-semibold text-foreground/80">What it does</span>
        <span data-testid="tool-example-description">{route.description}</span>
      </>}
      {route.guide && <>
        <span className="font-semibold text-foreground/80">How it fits</span>
        <span data-testid="page-frame-guide">{route.guide}</span>
      </>}
      {from.length > 0 && <>
        <span className="font-semibold text-foreground/80">Came from</span>
        <span className="inline-flex flex-wrap items-center gap-x-3" data-testid="page-frame-upstream">{from.map(r => <Link key={r.path} href={href(r.path)} className="underline underline-offset-2 min-h-11 inline-flex items-center hover:text-foreground" data-testid={`page-frame-from-${slug(r.path)}`}>{r.title}</Link>)}</span>
      </>}
      {next.length > 0 && <>
        <span className="font-semibold text-foreground/80">What's next</span>
        <span className="inline-flex flex-wrap items-center gap-x-3" data-testid="page-frame-downstream">{next.map(r => <Link key={r.path} href={href(r.path)} className="inline-flex items-center gap-0.5 underline underline-offset-2 min-h-11 hover:text-foreground" data-testid={`page-frame-next-${slug(r.path)}`}>{r.title}<ArrowRight size={11} aria-hidden="true" /></Link>)}</span>
      </>}
    </section>
  );
}
