/**
 * Nonprofit identity lookup — ProPublica Nonprofit Explorer API.
 *
 * Free, keyless, IRS-sourced (Form 990 / IRS Business Master File data).
 * Gives the Navigator real, verifiable facts about a NAMED organization —
 * legal name, EIN, 501(c) subsection, location, and recent Form 990
 * financials — instead of having to say "I don't have this."
 *
 * Deliberately narrow scope: this answers "is org X a real registered
 * nonprofit, and what does its IRS filing say" — it does NOT answer "what
 * does org X do" or "what is org X's website" (that's a web-search
 * question, handled separately). Fails soft everywhere: any lookup miss,
 * timeout, or malformed response returns null/[] rather than throwing, so
 * a ProPublica outage never breaks Navigator chat.
 */

const SEARCH_URL = "https://projects.propublica.org/nonprofits/api/v2/search.json";
const ORG_URL = (ein: string) => `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`;

// IRS exempt-organization subsection codes we can plainly label. 3 = 501(c)(3).
const SUBSECTION_LABELS: Record<number, string> = {
  2: "501(c)(2) — title-holding corporation",
  3: "501(c)(3) — public charity or private foundation",
  4: "501(c)(4) — social welfare organization",
  5: "501(c)(5) — labor/agricultural organization",
  6: "501(c)(6) — business league/chamber of commerce",
  7: "501(c)(7) — social/recreational club",
  8: "501(c)(8) — fraternal beneficiary society",
  9: "501(c)(9) — voluntary employees' beneficiary association",
  10: "501(c)(10) — domestic fraternal society",
  13: "501(c)(13) — cemetery company",
  19: "501(c)(19) — veterans' organization",
};

export interface NonprofitFiling {
  taxPeriod: string | null;
  totalRevenue: number | null;
  totalExpenses: number | null;
  totalAssets: number | null;
  formType: string | null;
}

export interface NonprofitProfile {
  name: string;
  ein: string;
  city: string | null;
  state: string | null;
  ntee: string | null;
  subsectionCode: number | null;
  subsectionLabel: string;
  rulingDate: string | null;
  latestFiling: NonprofitFiling | null;
  sourceUrl: string;
}

interface ProPublicaSearchHit {
  ein: number;
  name: string;
  city?: string;
  state?: string;
  ntee_code?: string;
  subseccd?: number;
  raw_ruling_date?: string;
}

/**
 * Search ProPublica's index by organization name. Returns up to `limit`
 * candidate matches (ProPublica's search is fuzzy, so callers should treat
 * the first result as "most likely" rather than "confirmed" unless the
 * name matches closely).
 */
export async function searchNonprofits(query: string, limit = 5): Promise<NonprofitProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(trimmed)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const data = await r.json();
    const hits: ProPublicaSearchHit[] = Array.isArray(data?.organizations) ? data.organizations : [];
    return hits.slice(0, limit).map((h) => ({
      name: h.name,
      ein: String(h.ein).padStart(9, "0"),
      city: h.city ?? null,
      state: h.state ?? null,
      ntee: h.ntee_code ?? null,
      subsectionCode: typeof h.subseccd === "number" ? h.subseccd : null,
      subsectionLabel: h.subseccd && SUBSECTION_LABELS[h.subseccd]
        ? SUBSECTION_LABELS[h.subseccd]
        : h.subseccd ? `501(c)(${h.subseccd})` : "IRS subsection not on file",
      rulingDate: h.raw_ruling_date ?? null,
      latestFiling: null,
      sourceUrl: `https://projects.propublica.org/nonprofits/organizations/${String(h.ein).padStart(9, "0")}`,
    }));
  } catch (err) {
    console.error("[NonprofitLookup] search failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Full profile for the single best-matching organization, including its
 * most recent Form 990 financials pulled from ProPublica's per-org detail
 * endpoint. Returns null if no plausible match is found or both API calls
 * fail — never throws.
 */
export async function fetchNonprofitProfile(orgName: string): Promise<NonprofitProfile | null> {
  const candidates = await searchNonprofits(orgName, 1);
  const top = candidates[0];
  if (!top) return null;

  try {
    const r = await fetch(ORG_URL(top.ein), { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return top;
    const data = await r.json();
    const filings = Array.isArray(data?.filings_with_data) ? data.filings_with_data : [];
    const latest = filings[0];
    if (latest) {
      top.latestFiling = {
        taxPeriod: latest.tax_prd_yr ? String(latest.tax_prd_yr) : null,
        totalRevenue: typeof latest.totrevenue === "number" ? latest.totrevenue : null,
        totalExpenses: typeof latest.totfuncexpns === "number" ? latest.totfuncexpns : null,
        totalAssets: typeof latest.totassetsend === "number" ? latest.totassetsend : null,
        formType: latest.formtype_str ?? latest.formtype ?? null,
      };
    }
    // The detail endpoint sometimes has a fuller/more current subsection or NTEE than search.
    const org = data?.organization;
    if (org?.subsection_code && !top.subsectionCode) {
      top.subsectionCode = org.subsection_code;
      top.subsectionLabel = SUBSECTION_LABELS[org.subsection_code] ?? `501(c)(${org.subsection_code})`;
    }
    return top;
  } catch (err) {
    console.error("[NonprofitLookup] org detail failed:", err instanceof Error ? err.message : err);
    return top;
  }
}

/** Formats a profile into a narrative context block for AI system-prompt injection. */
export function formatNonprofitProfileBlock(profile: NonprofitProfile, queriedName: string): string {
  const money = (n: number | null) => n == null ? "not on file" : `$${n.toLocaleString("en-US")}`;
  const filing = profile.latestFiling;
  return `\n\n[VERIFIED NONPROFIT RECORD — IRS/ProPublica Nonprofit Explorer, queried for "${queriedName}"]
Legal name on file: ${profile.name}
EIN: ${profile.ein}
Location: ${[profile.city, profile.state].filter(Boolean).join(", ") || "not on file"}
Tax-exempt status: ${profile.subsectionLabel}
IRS ruling date: ${profile.rulingDate || "not on file"}
NTEE category code: ${profile.ntee || "not on file"}
${filing ? `Most recent Form 990 on file (tax year ${filing.taxPeriod || "unknown"}, ${filing.formType || "990"}): revenue ${money(filing.totalRevenue)}, expenses ${money(filing.totalExpenses)}, total assets ${money(filing.totalAssets)}.` : "No Form 990 filing data on file at ProPublica (may be a smaller org filing a 990-N postcard, which reports no financials)."}
Full filing history: ${profile.sourceUrl}

[YOUR RESPONSE MUST]: State these facts plainly and cite them as coming from IRS/ProPublica Nonprofit Explorer records. If the name above does not look like a confident match for "${queriedName}" (e.g. a different city/state, or a materially different name), say so explicitly rather than presenting it as certain — ProPublica's search can return near-matches. Do NOT state a website, phone number, mission description, or funding history beyond this record unless it was separately provided to you — those are not part of this IRS record and must not be invented.`;
}
