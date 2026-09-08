/**
 * Shared Claim<T> type — canonical provenance contract for all platform data.
 *
 * Every figure displayed to any user must be wrapped in a Claim<T>.
 * Source of truth: docs/dis-alignment-rubric.md, Condition 1
 *
 * The original definition lives in server/corridor-story.ts for backward
 * compatibility. This module is the canonical shared export for all other
 * server files that need the type without importing all of corridor-story.ts.
 */

export type EvidenceClass =
  | "verified"
  | "estimated"
  | "modeled"
  | "community-reported"
  | "unverified";

export interface Claim<T = number | string | null> {
  value: T;
  unit?: string;
  /** Human-readable source name */
  source: string;
  /** Registered source ID from data_sources table */
  sourceId?: string;
  /** ISO date string for when the underlying data was collected */
  asOfDate: string | null;
  /** County FIPS, ZIP, state FIPS, or null for national scope */
  geographyKey: string | null;
  confidence: EvidenceClass;
  methodology?: string;
  url?: string;
  /** Plain-language "what this means for the next decision" */
  decisionCaption?: string;
}

/** Construct a claim with all required fields */
export function makeClaim<T>(c: Claim<T>): Claim<T> {
  return c;
}

/** Returns true when the claim's value is non-null and non-undefined */
export function isResolved<T>(c: Claim<T | null>): c is Claim<T> {
  return c.value !== null && c.value !== undefined;
}

/** Wraps a raw value into an unverified claim for display purposes only */
export function rawClaim<T>(
  value: T,
  source: string,
  geographyKey: string | null = null,
): Claim<T> {
  return {
    value,
    source,
    asOfDate: null,
    geographyKey,
    confidence: "unverified",
  };
}

/**
 * Uncertainty trigger — emitted when a Claim cannot be resolved.
 * Used by UncertaintyDisplay component to surface gaps rather than hiding them.
 */
export interface UncertaintyTrigger {
  uncertaintyType:
    | "missing-data"
    | "conflicting-sources"
    | "contested-interpretation"
    | "data-collection-failure";
  whatIsUnknown: string;
  whyItMatters: string;
  displayedTo: "user" | "chw" | "admin";
  /** Which stage of the diagnostic loop triggered this */
  triggeredAt: string;
  /**
   * If provided, the UncertaintyDisplay component will offer a live Perplexity
   * search using this query string, ensuring no data dead-end.
   */
  perplexityQuery?: string;
}

/**
 * PlaceStory — the canonical community intelligence output for any county.
 * Produced by server/place-story-engine.ts.
 * Consumed by Rural Workforce, HBCU Opportunity Network, and #DATA.
 */
export interface PlaceStory {
  geographyKey: string;
  stateFips: string;
  countyFips: string;
  label: string;
  resolvedAt: string;
  economic: Claim[];
  educational: Claim[];
  health: Claim[];
  housing: Claim[];
  gapDiagnosis: {
    primaryGap: string;
    cfirBarrierDomain: string;
    ericStrategyRecommendation: string;
  };
  uncertainties: UncertaintyTrigger[];
}
