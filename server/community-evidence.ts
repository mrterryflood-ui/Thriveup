/**
 * Runtime guard for the public Community Brief evidence contract.
 *
 * This is intentionally stricter than TypeScript: public shares and exports
 * cross a trust boundary, so only a complete v1 disclosure can be rendered.
 */
const REQUEST_TYPES = new Set(["zip", "city", "address_or_place", "county", "multi_county"]);
const RESOLVED_TYPES = new Set(["zcta", "county", "multi_county"]);
const CLAIM_KEYS = ["observed", "tcafDerived", "tcafScenario", "aiSynthesis"] as const;

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function hasValidCommunityEvidence(brief: unknown): boolean {
  if (!isRecord(brief) || !isRecord(brief.evidence)) return false;
  const evidence = brief.evidence;
  if (evidence.version !== "community-evidence/v1" || !isRecord(evidence.geography)) return false;

  const requested = evidence.geography.requested;
  const resolved = evidence.geography.resolved;
  if (!isRecord(requested) || !isText(requested.input) || !REQUEST_TYPES.has(requested.type)) return false;
  if (!isRecord(resolved) || !RESOLVED_TYPES.has(resolved.type)
    || !isText(resolved.identifier) || !isText(resolved.label) || !isText(resolved.method)) return false;
  // Exact match is the common case; also accept a qualifier appended after the
  // base label (e.g. "ZCTA 28472 (partial)") so a future, more descriptive
  // label doesn't get rejected outright with no recovery path.
  if (resolved.type === "zcta" && (!/^\d{5}$/.test(resolved.identifier) || !resolved.label.startsWith(`ZCTA ${resolved.identifier}`))) return false;
  if (resolved.coverageWarning != null && !isText(resolved.coverageWarning)) return false;

  if (!Array.isArray(evidence.sources) || evidence.sources.length < 1) return false;
  if (!evidence.sources.every((source: unknown) => isRecord(source)
    && isText(source.publisher) && isText(source.dataset) && isText(source.vintage)
    && isText(source.url) && /^https:\/\//.test(source.url)
    && isText(source.geographyGrain) && isText(source.retrievedAt)
    && Number.isFinite(new Date(source.retrievedAt).getTime()))) return false;

  if (!isRecord(evidence.claims) || !isRecord(evidence.dataQuality)) return false;
  for (const key of CLAIM_KEYS) {
    const claim = evidence.claims[key];
    if (!isRecord(claim) || !isText(claim.label) || !["available", "unavailable"].includes(claim.status)) return false;
    if (key !== "observed" && !isText(claim.disclosure)) return false;
  }
  return ["verified_at_resolved_grain", "limited_resolution", "unavailable"].includes(evidence.dataQuality.status)
    && Array.isArray(evidence.dataQuality.warnings)
    && evidence.dataQuality.warnings.every(isText);
}

/**
 * Force the rendered `brief.geography` to agree with the evidence contract's
 * resolved geography, in place.
 *
 * A caller-supplied brief could otherwise pair a valid evidence block for one
 * geography (e.g. a single ZCTA) with an arbitrary `brief.geography` shown
 * prominently in share pages, PDFs, and embeds (e.g. a citywide label) —
 * publishing a claim/geography mismatch the evidence contract exists to
 * prevent. This must run AFTER `hasValidCommunityEvidence(brief)` has
 * returned true, at every point a brief is persisted or re-served across a
 * public trust boundary (share POST/GET, story POST/GET, PDF export).
 */
export function canonicalizeGeographyFromEvidence(brief: Record<string, any>): void {
  const resolved = brief.evidence?.geography?.resolved;
  if (!isRecord(resolved)) return;
  const geo: Record<string, any> = isRecord(brief.geography) ? brief.geography : {};
  geo.displayName = resolved.label;
  if (resolved.type === "zcta") {
    geo.zip = resolved.identifier;
    delete geo.countyName;
  } else {
    // county / multi_county
    geo.countyName = resolved.label;
    delete geo.zip;
  }
  brief.geography = geo;
}