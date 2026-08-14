/**
 * verify-location-resolver-state.ts
 *
 * Focused unit tests for stateAbbrevFromZip and the Layer 1/3/4 state
 * derivation logic in resolveLocationToZip.  Run with:
 *   npx tsx scripts/verify-location-resolver-state.ts
 */

// ── Import the helpers under test ─────────────────────────────────────────────
// We test stateAbbrevFromZip directly; resolveLocationToZip makes network
// calls so we only verify the synchronous Layer-1 path here.
import { stateAbbrevFromZip } from "../server/neighborhood-routes";

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── stateAbbrevFromZip ────────────────────────────────────────────────────────

console.log("\n=== stateAbbrevFromZip ===");

// Normal ZIPs in the middle of each range
assert("TX  75201 → TX",  stateAbbrevFromZip("75201"), "TX");
assert("NC  27601 → NC",  stateAbbrevFromZip("27601"), "NC");
assert("CA  90210 → CA",  stateAbbrevFromZip("90210"), "CA");
assert("NY  10001 → NY",  stateAbbrevFromZip("10001"), "NY");
assert("DC  20001 → DC",  stateAbbrevFromZip("20001"), "DC");
assert("MA  02201 → MA",  stateAbbrevFromZip("02201"), "MA");
assert("AK  99501 → AK",  stateAbbrevFromZip("99501"), "AK");
assert("HI  96813 → HI",  stateAbbrevFromZip("96813"), "HI");
assert("OR  97204 → OR",  stateAbbrevFromZip("97204"), "OR");
assert("WA  98104 → WA",  stateAbbrevFromZip("98104"), "WA");

// Puerto Rico
assert("PR  00601 → PR",  stateAbbrevFromZip("00601"), "PR");
assert("PR  00988 → PR",  stateAbbrevFromZip("00988"), "PR");

// Known exceptions below the main range
assert("NY  00501 → NY",  stateAbbrevFromZip("00501"), "NY");
assert("NY  00544 → NY",  stateAbbrevFromZip("00544"), "NY");

// Range boundary ZIPs
assert("TX El Paso 88500 → TX",         stateAbbrevFromZip("88500"), "TX");
assert("N.VA 20100 → VA",               stateAbbrevFromZip("20100"), "VA");
assert("N.VA 20199 → VA",               stateAbbrevFromZip("20199"), "VA");
assert("MD  20600 → MD",                stateAbbrevFromZip("20600"), "MD");
assert("DC  56901 → DC (federal block)", stateAbbrevFromZip("56901"), "DC");
assert("DC  56999 → DC (federal block)", stateAbbrevFromZip("56999"), "DC");

// Genuinely unknown — should return empty string (not throw)
assert("00000 → ''",  stateAbbrevFromZip("00000"), "");
assert("99999 → AK",  stateAbbrevFromZip("99999"), "AK");
assert("junk  → ''",  stateAbbrevFromZip("junk"),  "");

// ── Census matched-address regex (replicated here to test without network) ───

console.log("\n=== Census matched-address state extraction regex ===");

const ALL_STATE_ABBREVS = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY","PR",
]);

function extractStateFromCensusAddr(addr: string): string {
  // Accept both "NC 28401" and "DC, 20500" forms from Census geocoder.
  const m = addr.match(/,\s*([A-Z]{2})[,\s]+\d{5}/);
  return m && ALL_STATE_ABBREVS.has(m[1]) ? m[1] : "";
}

assert(
  "Standard:  '123 MAIN ST, WILMINGTON, NC 28401' → NC",
  extractStateFromCensusAddr("123 MAIN ST, WILMINGTON, NC 28401"),
  "NC",
);
assert(
  "Comma:     '1600 PENNSYLVANIA AVE NW, WASHINGTON, DC, 20500' → DC",
  extractStateFromCensusAddr("1600 PENNSYLVANIA AVE NW, WASHINGTON, DC, 20500"),
  "DC",
);
assert(
  "No match:  'UNKNOWN PLACE' → ''",
  extractStateFromCensusAddr("UNKNOWN PLACE"),
  "",
);
assert(
  "TX format: '123 MAIN ST, AUSTIN, TX 78701' → TX",
  extractStateFromCensusAddr("123 MAIN ST, AUSTIN, TX 78701"),
  "TX",
);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
