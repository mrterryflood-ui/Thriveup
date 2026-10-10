/**
 * Canonical Hutto, Texas place record (Hutto Ready demo — see /hutto).
 *
 * This is an explicit, curated alias table — not name→ZIP inference. Only the
 * inputs listed in HUTTO_ALIASES (plus the ZIP itself) resolve to Hutto, and
 * every surface that resolves them displays the NAME, never the bare ZIP.
 * Evidence state: observed (USPS ZIP 78634 / Williamson County, FIPS 48491).
 */
export const HUTTO_PLACE = {
  name: "Hutto, Texas",
  display: "Hutto, TX",
  label: "Hutto, TX (78634)",
  zip: "78634",
  state: "TX",
  stateName: "Texas",
  countyName: "Williamson County",
  countyFips: "48491",
  lat: 30.5427638,
  lon: -97.5468898,
  path: "/hutto",
} as const;

/** Normalized aliases (lowercase, punctuation → single spaces). */
const HUTTO_ALIASES = new Set([
  "hutto",
  "hutto tx",
  "hutto texas",
  "hutto isd",
  "hutto independent school district",
  "city of hutto",
  "78634",
]);

function normalizePlaceInput(raw: string): string {
  return raw.toLowerCase().replace(/[.,'’()|:-]+/g, " ").replace(/\s+/g, " ").trim();
}

/** True when the input is one of the canonical Hutto inputs ("Hutto", "Hutto, TX", "78634", "Hutto ISD", …). */
export function isHuttoPlace(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const n = normalizePlaceInput(raw);
  if (HUTTO_ALIASES.has(n)) return true;
  // "Hutto, TX 78634" / "Hutto TX (78634)" style inputs.
  return n === "hutto tx 78634" || n === "hutto texas 78634" || n === "hutto 78634";
}
