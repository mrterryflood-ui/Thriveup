import { useMemo } from "react";
import { useSearch } from "wouter";
import { parseJourneyContext, type JourneyContext } from "@shared/journey-context";

export { buildJourneyHref, describeJourneyPlace, placeToZip, placeToCountyFips } from "@shared/journey-context";
export type { JourneyContext } from "@shared/journey-context";

/** Reads the validated JourneyContext from the current URL. No store, no server dependency. */
export function useJourneyContext(): JourneyContext {
  const search = useSearch();
  return useMemo(() => parseJourneyContext(search), [search]);
}
