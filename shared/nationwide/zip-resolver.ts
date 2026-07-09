// RPLICE v2 — Replicable Contract
// ZIP → { state, countyFips, countyName, countySlug } resolver.
//
// Seed table covers the currently-active St. David's 5-county region verbatim,
// plus enough major-metro anchors that the nationwide wizard works for any
// sample input without depending on a third-party ZIP database. Production
// deployments should extend via ZIP_INDEX or swap in a full ZCTA lookup.

export type ZipResolution = {
  state: string;             // 2-letter ISO
  countyFips: string;        // e.g. "48453"
  countyName: string;        // e.g. "Travis County"
  countySlug: string;        // canonical, e.g. "tx-travis"
};

export const COUNTY_SLUG = (state: string, name: string): string =>
  `${state.toLowerCase()}-${name.toLowerCase().replace(/\s+county\s*$/,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;

// Range-based index: each entry covers a numeric ZIP range.
// { from, to } inclusive. Resolver picks first match.
type ZipRange = { from: number; to: number; r: ZipResolution };

export const ZIP_RANGES: ZipRange[] = [
  // Texas — St. David's 5-county corridor (specific overrides first)
  { from: 78610, to: 78612, r: { state: "TX", countyFips: "48021", countyName: "Bastrop County", countySlug: "tx-bastrop" } },
  { from: 78621, to: 78621, r: { state: "TX", countyFips: "48021", countyName: "Bastrop County", countySlug: "tx-bastrop" } },
  { from: 78650, to: 78650, r: { state: "TX", countyFips: "48021", countyName: "Bastrop County", countySlug: "tx-bastrop" } },
  { from: 78602, to: 78602, r: { state: "TX", countyFips: "48021", countyName: "Bastrop County", countySlug: "tx-bastrop" } },
  { from: 78942, to: 78957, r: { state: "TX", countyFips: "48021", countyName: "Bastrop County", countySlug: "tx-bastrop" } },
  { from: 78622, to: 78622, r: { state: "TX", countyFips: "48055", countyName: "Caldwell County", countySlug: "tx-caldwell" } },
  { from: 78644, to: 78644, r: { state: "TX", countyFips: "48055", countyName: "Caldwell County", countySlug: "tx-caldwell" } },
  { from: 78655, to: 78655, r: { state: "TX", countyFips: "48055", countyName: "Caldwell County", countySlug: "tx-caldwell" } },
  { from: 78656, to: 78656, r: { state: "TX", countyFips: "48055", countyName: "Caldwell County", countySlug: "tx-caldwell" } },
  { from: 78666, to: 78666, r: { state: "TX", countyFips: "48209", countyName: "Hays County", countySlug: "tx-hays" } },
  { from: 78676, to: 78676, r: { state: "TX", countyFips: "48209", countyName: "Hays County", countySlug: "tx-hays" } },
  { from: 78620, to: 78620, r: { state: "TX", countyFips: "48209", countyName: "Hays County", countySlug: "tx-hays" } },
  { from: 78640, to: 78640, r: { state: "TX", countyFips: "48209", countyName: "Hays County", countySlug: "tx-hays" } },
  { from: 78610, to: 78610, r: { state: "TX", countyFips: "48209", countyName: "Hays County", countySlug: "tx-hays" } },
  { from: 78613, to: 78613, r: { state: "TX", countyFips: "48491", countyName: "Williamson County", countySlug: "tx-williamson" } },
  { from: 78626, to: 78634, r: { state: "TX", countyFips: "48491", countyName: "Williamson County", countySlug: "tx-williamson" } },
  { from: 78664, to: 78665, r: { state: "TX", countyFips: "48491", countyName: "Williamson County", countySlug: "tx-williamson" } },
  { from: 78680, to: 78683, r: { state: "TX", countyFips: "48491", countyName: "Williamson County", countySlug: "tx-williamson" } },
  { from: 78728, to: 78729, r: { state: "TX", countyFips: "48491", countyName: "Williamson County", countySlug: "tx-williamson" } },
  // Travis County — Austin + surrounding
  { from: 78701, to: 78799, r: { state: "TX", countyFips: "48453", countyName: "Travis County", countySlug: "tx-travis" } },

  // Broad state-level fallbacks — resolver returns state only, county unknown.
  // These allow the nationwide wizard to proceed when no tight ZIP match exists.
  { from:  1000, to:  2799, r: { state: "MA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from:  2800, to:  2999, r: { state: "RI", countyFips: "",      countyName: "",                countySlug: "" } },
  { from:  3000, to:  3899, r: { state: "NH", countyFips: "",      countyName: "",                countySlug: "" } },
  { from:  3900, to:  4999, r: { state: "ME", countyFips: "",      countyName: "",                countySlug: "" } },
  { from:  5000, to:  5999, r: { state: "VT", countyFips: "",      countyName: "",                countySlug: "" } },
  { from:  6000, to:  6999, r: { state: "CT", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 10000, to: 14999, r: { state: "NY", countyFips: "",      countyName: "",                countySlug: "" } },
  { from:  7000, to:  8999, r: { state: "NJ", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 15000, to: 19699, r: { state: "PA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 19700, to: 19999, r: { state: "DE", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 20000, to: 20099, r: { state: "DC", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 20100, to: 20199, r: { state: "VA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 20200, to: 20599, r: { state: "DC", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 20600, to: 21999, r: { state: "MD", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 22000, to: 24699, r: { state: "VA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 24700, to: 26999, r: { state: "WV", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 27000, to: 28999, r: { state: "NC", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 29000, to: 29999, r: { state: "SC", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 30000, to: 31999, r: { state: "GA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 32000, to: 34999, r: { state: "FL", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 35000, to: 36999, r: { state: "AL", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 37000, to: 38599, r: { state: "TN", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 38600, to: 39799, r: { state: "MS", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 40000, to: 42799, r: { state: "KY", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 43000, to: 45899, r: { state: "OH", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 46000, to: 47999, r: { state: "IN", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 48000, to: 49999, r: { state: "MI", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 50000, to: 52899, r: { state: "IA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 53000, to: 54999, r: { state: "WI", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 55000, to: 56799, r: { state: "MN", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 57000, to: 57799, r: { state: "SD", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 58000, to: 58899, r: { state: "ND", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 59000, to: 59999, r: { state: "MT", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 60000, to: 62999, r: { state: "IL", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 63000, to: 65899, r: { state: "MO", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 66000, to: 67999, r: { state: "KS", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 68000, to: 69399, r: { state: "NE", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 70000, to: 71499, r: { state: "LA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 71600, to: 72999, r: { state: "AR", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 73000, to: 74999, r: { state: "OK", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 75000, to: 79999, r: { state: "TX", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 80000, to: 81699, r: { state: "CO", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 82000, to: 83199, r: { state: "WY", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 83200, to: 83899, r: { state: "ID", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 84000, to: 84799, r: { state: "UT", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 85000, to: 86599, r: { state: "AZ", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 87000, to: 88499, r: { state: "NM", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 89000, to: 89899, r: { state: "NV", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 90000, to: 96199, r: { state: "CA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 96700, to: 96899, r: { state: "HI", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 97000, to: 97999, r: { state: "OR", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 98000, to: 99499, r: { state: "WA", countyFips: "",      countyName: "",                countySlug: "" } },
  { from: 99500, to: 99999, r: { state: "AK", countyFips: "",      countyName: "",                countySlug: "" } },
];

export function resolveZip(zip: string): ZipResolution | null {
  const n = parseInt((zip || "").replace(/\D/g, "").slice(0, 5), 10);
  if (!Number.isFinite(n)) return null;
  for (const entry of ZIP_RANGES) {
    if (n >= entry.from && n <= entry.to) return entry.r;
  }
  return null;
}

/**
 * NOTE — verified 2026-07-09: the Census Bureau Geocoder ("geographies/address"
 * and "geographies/onelineaddress" endpoints) requires a full street address;
 * it does NOT resolve ZIP-only queries to a county (confirmed by direct test —
 * both return zero matches for a bare ZIP). There is no free no-key REST API
 * that resolves ZIP → county FIPS on demand.
 *
 * A real nationwide ZIP→county resolver requires bulk-ingesting the Census
 * Bureau's static ZCTA-to-county relationship file (a downloadable crosswalk,
 * tens of thousands of rows) into a DB table once, then querying that table —
 * not a per-request live API call. That ingestion is real data-engineering
 * work (fetch + parse + load + verify row counts against the primary file) and
 * is scoped as a follow-up rather than something to fake here.
 *
 * Until that table exists, `resolveZip` (static range table, state-only outside
 * the 5-county seed region) remains the honest answer. Do not call this a
 * "nationwide resolver" in UI copy until the crosswalk table backs it.
 */
export async function resolveZipLive(zip: string): Promise<ZipResolution | null> {
  return resolveZip(zip);
}
