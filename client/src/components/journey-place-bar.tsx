import { Link, useLocation, useSearch } from "wouter";
import { MapPin, ArrowRight, X } from "lucide-react";
import {
  JOURNEY_STEPS,
  buildJourneyHref,
  describeJourneyPlace,
  journeyStepIndex,
  parseJourneyContext,
} from "@shared/journey-context";

/**
 * Shows the carried place on resident-chain routes and links to the next step with the same
 * context. Renders nothing unless the URL carries a valid `place`, so no city is ever assumed.
 */
export function JourneyPlaceBar({ path }: { path: string }) {
  const search = useSearch();
  const [, navigate] = useLocation();
  const index = journeyStepIndex(path);
  const ctx = parseJourneyContext(search);
  if (index < 0 || !ctx.place) return null;

  const next = JOURNEY_STEPS[index + 1];

  function clearPlace() {
    const params = new URLSearchParams(search);
    params.delete("place");
    const query = params.toString();
    navigate(`${path}${query ? `?${query}` : ""}`, { replace: true });
  }

  return (
    <section
      aria-label="Your journey place"
      className="border-b bg-[#eef2ec] px-4 py-2 text-[#203b38]"
      data-testid="journey-place-bar"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold" data-testid="journey-place-showing">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Showing: {describeJourneyPlace(ctx.place)}
        </span>
        <button
          type="button"
          onClick={clearPlace}
          className="inline-flex min-h-11 items-center gap-1 underline underline-offset-2 hover:text-[#a64029]"
          data-testid="journey-place-clear"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear place
        </button>
        {next && (
          <Link
            href={buildJourneyHref(next.path, ctx)}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-2 hover:text-[#a64029]"
            data-testid="journey-place-next"
          >
            Next: {next.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
