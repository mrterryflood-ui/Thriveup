/**
 * JourneyContext — the URL-carried context that follows a person through the resident chain.
 *
 * Stateless and shareable: { place, audience, entry } travel as query parameters.
 * Non-sensitive fields only. `referral` and household context are intentionally NOT parsed
 * from the URL; they attach only for signed-in, consented users (R1 Phase C).
 *
 * Merge rule: explicit URL place wins; else the signed-in journey place; else the tool asks.
 * There is no default city, ever.
 */
import { HUTTO_PLACE, isHuttoPlace } from "./places/hutto";

export interface JourneyContext {
  place?: string;
  audience?: string;
  entry?: string;
}

export const JOURNEY_PLACE_MAX_LENGTH = 80;

const PLACE_PATTERN = /^[\p{L}\p{N} .,'’:|-]+$/u;
const AUDIENCE_PATTERN = /^[a-z][a-z-]{0,31}$/;
const ENTRY_PATTERN = /^[a-z0-9][a-z0-9/_-]{0,63}$/;

function cleanPlace(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed || collapsed.length > JOURNEY_PLACE_MAX_LENGTH) return undefined;
  return PLACE_PATTERN.test(collapsed) ? collapsed : undefined;
}

/** Parse a query string ("?place=78634&audience=banks") into a validated JourneyContext. */
export function parseJourneyContext(search: string | URLSearchParams | null | undefined): JourneyContext {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search ?? "");
  const ctx: JourneyContext = {};
  const place = cleanPlace(params.get("place"));
  if (place) ctx.place = place;
  const audience = params.get("audience")?.trim().toLowerCase();
  if (audience && AUDIENCE_PATTERN.test(audience)) ctx.audience = audience;
  const entry = params.get("entry")?.trim().toLowerCase();
  if (entry && ENTRY_PATTERN.test(entry)) ctx.entry = entry;
  return ctx;
}

/**
 * A 5-digit ZIP carried in `place`, or null. Never infers a ZIP from a name — the only
 * exception is the curated canonical-place alias table (shared/places/hutto.ts), so
 * "Hutto", "Hutto, TX" and "Hutto ISD" land on 78634.
 */
export function placeToZip(place: string | null | undefined): string | null {
  const value = place?.trim();
  if (value && isHuttoPlace(value)) return HUTTO_PLACE.zip;
  return value && /^\d{5}$/.test(value) ? value : null;
}

/** A 5-digit county FIPS carried as `county:48453`, or null. */
export function placeToCountyFips(place: string | null | undefined): string | null {
  const match = place?.trim().match(/^county:(\d{5})$/i);
  return match ? match[1] : null;
}

/** Human-readable label for the place chip. */
export function describeJourneyPlace(place: string): string {
  if (isHuttoPlace(place)) return HUTTO_PLACE.label;
  const zip = placeToZip(place);
  if (zip) return `ZIP ${zip}`;
  const fips = placeToCountyFips(place);
  if (fips) return `County FIPS ${fips}`;
  return place;
}

/**
 * Build a link that carries the journey context. Existing query parameters on `path` are kept;
 * context values replace same-named ones. Unset context fields are never written.
 */
export function buildJourneyHref(path: string, ctx: JourneyContext | null | undefined): string {
  const [base, existing = ""] = path.split("?");
  const params = new URLSearchParams(existing);
  const clean = parseJourneyContext(new URLSearchParams(
    Object.entries(ctx ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  ));
  if (clean.place) params.set("place", clean.place);
  if (clean.audience) params.set("audience", clean.audience);
  if (clean.entry) params.set("entry", clean.entry);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** The resident-chain walk, in order. Only these routes show the journey place bar. */
export const JOURNEY_STEPS: ReadonlyArray<{ path: string; label: string }> = [
  { path: "/411", label: "Community 411" },
  { path: "/benefits-screener", label: "Benefits screener" },
  { path: "/parents", label: "Parent resources" },
  { path: "/academy/financial-literacy", label: "Financial literacy" },
  { path: "/academy/careers", label: "Careers" },
  { path: "/impact", label: "Impact" },
  { path: "/community-analysis", label: "Community analysis" },
  { path: "/corridor-intelligence", label: "Corridor intelligence" },
  { path: "/chainweb", label: "Chainweb builder" },
];

export function journeyStepIndex(path: string): number {
  const clean = path.split("?")[0].replace(/\/+$/, "") || "/";
  return JOURNEY_STEPS.findIndex(step => step.path === clean);
}

/**
 * R1 Phase B — audience continuity. The carried `audience` (10 registry audiences or the 4 demo-door keys)
 * resolves to the lane a tool already distinguishes: people seeking help for themselves, or people helping
 * others (CHWs, navigators, staff, funders, institutions). Unknown values resolve to null — the tool keeps
 * its own default and never guesses.
 */
export type JourneyLane = "resident" | "navigator";
const NAVIGATOR_AUDIENCES = new Set(["caregivers-chws", "nonprofit-cbo", "agency-government", "funder-evaluator", "banks", "schools", "governments", "entities"]);
const RESIDENT_AUDIENCES = new Set(["resident-family", "students-youth", "foster-youth", "veterans", "returning-citizens", "rural-farm"]);
export function journeyLane(audience: string | null | undefined): JourneyLane | null {
  if (!audience) return null;
  if (NAVIGATOR_AUDIENCES.has(audience)) return "navigator";
  if (RESIDENT_AUDIENCES.has(audience)) return "resident";
  return null;
}
