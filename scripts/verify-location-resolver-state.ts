/**
 * verify-location-resolver-state.ts
 *
 * Confirms that resolveLocationToZip returns the correct stateAbbrev for raw
 * ZIP inputs. A regression in the ZIP numeric-range table (e.g. a wrong
 * boundary) would silently produce an empty state and break gun violence
 * lookups, grant conduit filtering, and policy context — all callers that
 * depend on stateAbbrev.
 *
 * Run:  npx tsx scripts/verify-location-resolver-state.ts
 */

import { resolveLocationToZip, stateAbbrevFromZip } from "../server/neighborhood-routes";

interface ZipCase {
  zip: string;
  expectedState: string | undefined; // undefined = invalid ZIP, should return undefined
  note: string;
}

const CASES: ZipCase[] = [
  // ── Standard state representatives ──────────────────────────────────────────
  { zip: "90210", expectedState: "CA", note: "California (Beverly Hills)" },
  { zip: "10001", expectedState: "NY", note: "New York (Midtown Manhattan)" },
  { zip: "77002", expectedState: "TX", note: "Texas (downtown Houston)" },
  { zip: "60601", expectedState: "IL", note: "Illinois (downtown Chicago)" },
  { zip: "33101", expectedState: "FL", note: "Florida (Miami)" },
  { zip: "30303", expectedState: "GA", note: "Georgia (Atlanta)" },
  { zip: "02201", expectedState: "MA", note: "Massachusetts (Boston)" },
  { zip: "19103", expectedState: "PA", note: "Pennsylvania (Philadelphia)" },
  { zip: "97201", expectedState: "OR", note: "Oregon (Portland)" },
  { zip: "98101", expectedState: "WA", note: "Washington (Seattle)" },
  { zip: "80202", expectedState: "CO", note: "Colorado (Denver)" },
  { zip: "85004", expectedState: "AZ", note: "Arizona (Phoenix)" },
  { zip: "89101", expectedState: "NV", note: "Nevada (Las Vegas)" },
  { zip: "84101", expectedState: "UT", note: "Utah (Salt Lake City)" },
  { zip: "87102", expectedState: "NM", note: "New Mexico (Albuquerque)" },
  { zip: "73102", expectedState: "OK", note: "Oklahoma (Oklahoma City)" },
  { zip: "70112", expectedState: "LA", note: "Louisiana (New Orleans)" },
  { zip: "72201", expectedState: "AR", note: "Arkansas (Little Rock)" },
  { zip: "38103", expectedState: "TN", note: "Tennessee (Memphis)" },
  { zip: "39201", expectedState: "MS", note: "Mississippi (Jackson)" },
  { zip: "35203", expectedState: "AL", note: "Alabama (Birmingham)" },
  { zip: "29201", expectedState: "SC", note: "South Carolina (Columbia)" },
  { zip: "27601", expectedState: "NC", note: "North Carolina (Raleigh)" },
  { zip: "23219", expectedState: "VA", note: "Virginia (Richmond)" },
  { zip: "21202", expectedState: "MD", note: "Maryland (Baltimore)" },
  { zip: "07102", expectedState: "NJ", note: "New Jersey (Newark)" },
  { zip: "06103", expectedState: "CT", note: "Connecticut (Hartford)" },
  { zip: "02903", expectedState: "RI", note: "Rhode Island (Providence)" },
  { zip: "03101", expectedState: "NH", note: "New Hampshire (Manchester)" },
  { zip: "04101", expectedState: "ME", note: "Maine (Portland)" },
  { zip: "05401", expectedState: "VT", note: "Vermont (Burlington)" },
  { zip: "14202", expectedState: "NY", note: "New York (Buffalo)" },
  { zip: "15222", expectedState: "PA", note: "Pennsylvania (Pittsburgh)" },
  { zip: "19701", expectedState: "DE", note: "Delaware" },
  { zip: "26101", expectedState: "WV", note: "West Virginia" },
  { zip: "40202", expectedState: "KY", note: "Kentucky (Louisville)" },
  { zip: "43215", expectedState: "OH", note: "Ohio (Columbus)" },
  { zip: "46204", expectedState: "IN", note: "Indiana (Indianapolis)" },
  { zip: "48226", expectedState: "MI", note: "Michigan (Detroit)" },
  { zip: "53202", expectedState: "WI", note: "Wisconsin (Milwaukee)" },
  { zip: "55401", expectedState: "MN", note: "Minnesota (Minneapolis)" },
  { zip: "50309", expectedState: "IA", note: "Iowa (Des Moines)" },
  { zip: "63101", expectedState: "MO", note: "Missouri (St. Louis)" },
  { zip: "66101", expectedState: "KS", note: "Kansas (Kansas City)" },
  { zip: "68102", expectedState: "NE", note: "Nebraska (Omaha)" },
  { zip: "57104", expectedState: "SD", note: "South Dakota (Sioux Falls)" },
  { zip: "58102", expectedState: "ND", note: "North Dakota (Fargo)" },
  { zip: "59101", expectedState: "MT", note: "Montana (Billings)" },
  { zip: "83702", expectedState: "ID", note: "Idaho (Boise)" },
  { zip: "82001", expectedState: "WY", note: "Wyoming (Cheyenne)" },
  { zip: "99501", expectedState: "AK", note: "Alaska (Anchorage)" },
  { zip: "96813", expectedState: "HI", note: "Hawaii (Honolulu)" },

  // ── DC ───────────────────────────────────────────────────────────────────────
  { zip: "20001", expectedState: "DC", note: "DC core range (20000-20099)" },
  { zip: "20201", expectedState: "DC", note: "DC mid range (20200-20599)" },

  // ── Boundary / edge ZIPs ─────────────────────────────────────────────────────
  // N. Virginia block 20100–20199
  { zip: "20100", expectedState: "VA", note: "N.VA boundary ZIPs: 20100 (lower bound)" },
  { zip: "20150", expectedState: "VA", note: "N.VA boundary ZIPs: 20150 (mid)" },
  { zip: "20199", expectedState: "VA", note: "N.VA boundary ZIPs: 20199 (upper bound)" },

  // TX El Paso area 88500–88599 (surrounded by NM range 87000–88499)
  { zip: "88499", expectedState: "NM", note: "NM upper boundary 88499" },
  { zip: "88500", expectedState: "TX", note: "TX El Paso boundary lower (88500)" },
  { zip: "88550", expectedState: "TX", note: "TX El Paso mid (88550)" },
  { zip: "88599", expectedState: "TX", note: "TX El Paso upper (88599)" },
  { zip: "88600", expectedState: undefined, note: "gap between TX El Paso (88500-88599) and NV (89000+) — should be undefined" },

  // WY/ID boundary: WY 82000-83199, ID 83200-83999
  { zip: "83199", expectedState: "WY", note: "WY upper boundary 83199" },
  { zip: "83200", expectedState: "ID", note: "ID lower boundary 83200" },

  // AZ/NM boundary: AZ 85000-86599, NM 87000-88499
  { zip: "86599", expectedState: "AZ", note: "AZ upper boundary 86599" },
  { zip: "87000", expectedState: "NM", note: "NM lower boundary 87000" },

  // CA/OR boundary: CA goes up to 96199, then gap, then HI 96700-96899, OR 97000-97999
  { zip: "96199", expectedState: "CA", note: "CA upper boundary 96199" },
  { zip: "97000", expectedState: "OR", note: "OR lower boundary 97000" },

  // WA/AK boundary
  { zip: "99499", expectedState: "WA", note: "WA upper boundary 99499" },
  { zip: "99500", expectedState: "AK", note: "AK lower boundary 99500" },

  // LA/AR split: LA 70000-71599, AR 71600-72999
  { zip: "71599", expectedState: "LA", note: "LA upper boundary 71599" },
  { zip: "71600", expectedState: "AR", note: "AR lower boundary 71600" },

  // TN/MS split: TN 37000-38599, MS 38600-39999
  { zip: "38599", expectedState: "TN", note: "TN upper boundary 38599" },
  { zip: "38600", expectedState: "MS", note: "MS lower boundary 38600" },

  // KY/OH: KY 40000-42799, OH 43000-45999
  { zip: "42799", expectedState: "KY", note: "KY upper boundary 42799" },
  { zip: "43000", expectedState: "OH", note: "OH lower boundary 43000" },

  // ── Puerto Rico ──────────────────────────────────────────────────────────────
  { zip: "00600", expectedState: "PR", note: "PR lower boundary 00600" },
  { zip: "00785", expectedState: "PR", note: "PR mid range" },
  { zip: "00988", expectedState: "PR", note: "PR upper boundary 00988" },

  // ── USPS unique exceptions ───────────────────────────────────────────────────
  { zip: "00501", expectedState: "NY", note: "USPS Unique: IRS Holtsville NY (exception map)" },
  { zip: "00544", expectedState: "NY", note: "USPS Unique: IRS Holtsville NY (exception map)" },

  // ── Invalid / unrecognised ZIPs ──────────────────────────────────────────────
  { zip: "00000", expectedState: undefined, note: "00000 — not a valid ZIP" },
  { zip: "00100", expectedState: undefined, note: "00100 — gap before PR range" },
  { zip: "09999", expectedState: undefined, note: "09999 — unassigned (military APO uses 09xxx but not in table)" },
  { zip: "96200", expectedState: undefined, note: "gap between CA (ends 96199) and HI (starts 96700)" },
  { zip: "96600", expectedState: undefined, note: "gap before HI 96700 lower bound" },
];

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function runCases(): Promise<void> {
  // Test stateAbbrevFromZip directly (sync, unit-level)
  console.log("=== stateAbbrevFromZip (unit, sync) ===\n");
  for (const tc of CASES) {
    const result = stateAbbrevFromZip(tc.zip);
    const got = result === "" ? undefined : result;
    const pass = got === tc.expectedState;
    if (pass) {
      passed++;
      console.log(`  ✓  ${tc.zip}  → ${got ?? "(none)"}  [${tc.note}]`);
    } else {
      failed++;
      const msg = `  ✗  ${tc.zip}  → got ${got ?? "(none)"}  expected ${tc.expectedState ?? "(none)"}  [${tc.note}]`;
      console.log(msg);
      failures.push(msg);
    }
  }

  // Test resolveLocationToZip Layer 1 path (raw ZIP input returns stateAbbrev)
  console.log("\n=== resolveLocationToZip Layer 1 (raw ZIP input) ===\n");
  // Only test ZIPs where we expect a valid state (resolveLocationToZip always
  // returns an object for any 5-digit string, but stateAbbrev may be undefined
  // for gap ZIPs).
  const layer1Cases = CASES.filter((tc) => /^\d{5}$/.test(tc.zip));
  for (const tc of layer1Cases) {
    const resolved = await resolveLocationToZip(tc.zip);
    if (!resolved) {
      failed++;
      const msg = `  ✗  ${tc.zip}  → resolveLocationToZip returned null (expected an object)  [${tc.note}]`;
      console.log(msg);
      failures.push(msg);
      continue;
    }
    const gotState = resolved.stateAbbrev;
    const pass = gotState === tc.expectedState;
    if (pass) {
      passed++;
      console.log(`  ✓  ${tc.zip}  → stateAbbrev=${gotState ?? "(none)"}  [${tc.note}]`);
    } else {
      failed++;
      const msg = `  ✗  ${tc.zip}  → stateAbbrev=${gotState ?? "(none)"}  expected ${tc.expectedState ?? "(none)"}  [${tc.note}]`;
      console.log(msg);
      failures.push(msg);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2: city+state static-table fast path + parseCityState parse-only tests
// ─────────────────────────────────────────────────────────────────────────────

interface CityCase {
  input: string;
  expectedZip: string | undefined;   // undefined = not in static table (network path)
  expectedState: string;
  note: string;
}

const CITY_CASES: CityCase[] = [
  // Cities IN the static table (no network call — returns immediately)
  { input: "Austin, TX",      expectedZip: "78701", expectedState: "TX", note: "Austin TX — in static table" },
  { input: "Chicago, IL",     expectedZip: "60601", expectedState: "IL", note: "Chicago IL — in static table" },
  { input: "New York, NY",    expectedZip: "10001", expectedState: "NY", note: "New York NY — in static table" },
  { input: "Houston, TX",     expectedZip: "77002", expectedState: "TX", note: "Houston TX — in static table" },
  { input: "Phoenix, AZ",     expectedZip: "85004", expectedState: "AZ", note: "Phoenix AZ — in static table" },
  { input: "Seattle, WA",     expectedZip: "98104", expectedState: "WA", note: "Seattle WA — in static table" },
  { input: "Denver, CO",      expectedZip: "80202", expectedState: "CO", note: "Denver CO — in static table" },
  { input: "Atlanta, GA",     expectedZip: "30303", expectedState: "GA", note: "Atlanta GA — in static table" },
  // State name spelled out (tests STATE_NAME_TO_USPS path in parseCityState)
  { input: "Austin, Texas",   expectedZip: "78701", expectedState: "TX", note: "Austin Texas — full state name resolves to TX" },
  { input: "Chicago, Illinois", expectedZip: "60601", expectedState: "IL", note: "Chicago Illinois — full state name resolves to IL" },
];

// Cities NOT in the static table: test that parseCityState correctly extracts
// stateAbbrev from the state-abbreviation portion of the input string, even
// when the geocoder is unavailable. We stub globalThis.fetch to a fake
// Census response containing a ZIP, so no real network call is made.
interface CityNotInTableCase {
  input: string;
  fakeZip: string;   // ZIP the stubbed geocoder "returns"
  expectedState: string;
  note: string;
}

const CITY_NOT_IN_TABLE_CASES: CityNotInTableCase[] = [
  // Small/obscure cities whose names are not in CITY_STATE_TO_ZIP
  { input: "Pflugerville, TX", fakeZip: "78660", expectedState: "TX", note: "Pflugerville TX — not in table, stateAbbrev parsed from 'TX'" },
  { input: "Evanston, IL",     fakeZip: "60201", expectedState: "IL", note: "Evanston IL — not in table, stateAbbrev parsed from 'IL'" },
  { input: "Naperville, IL",   fakeZip: "60540", expectedState: "IL", note: "Naperville IL — not in table, stateAbbrev parsed from 'IL'" },
];

/** Build a fake Census geocoder response that looks like a successful city match. */
function fakeCensusResponse(zip: string, state: string): Response {
  const body = JSON.stringify({
    result: {
      addressMatches: [
        {
          matchedAddress: `SOMEWHERE, ${state} ${zip}`,
          coordinates: { x: -97.0, y: 30.0 },
        },
      ],
    },
  });
  return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
}

async function runLayer2Cases(): Promise<void> {
  // ── 2a. Static-table cities (no network needed) ──────────────────────────
  console.log("\n=== resolveLocationToZip Layer 2a (city+state static table) ===\n");
  for (const tc of CITY_CASES) {
    const resolved = await resolveLocationToZip(tc.input);
    if (!resolved) {
      failed++;
      const msg = `  ✗  "${tc.input}"  → resolveLocationToZip returned null  [${tc.note}]`;
      console.log(msg);
      failures.push(msg);
      continue;
    }

    // Verify ZIP (only for in-table cases)
    if (tc.expectedZip !== undefined) {
      const zipOk = resolved.zip === tc.expectedZip;
      if (zipOk) {
        passed++;
        console.log(`  ✓  "${tc.input}"  → zip=${resolved.zip}  [${tc.note}]`);
      } else {
        failed++;
        const msg = `  ✗  "${tc.input}"  → zip=${resolved.zip}  expected ${tc.expectedZip}  [${tc.note}]`;
        console.log(msg);
        failures.push(msg);
      }
    }

    // Verify stateAbbrev
    const stateOk = resolved.stateAbbrev === tc.expectedState;
    if (stateOk) {
      passed++;
      console.log(`  ✓  "${tc.input}"  → stateAbbrev=${resolved.stateAbbrev}  [${tc.note}]`);
    } else {
      failed++;
      const msg = `  ✗  "${tc.input}"  → stateAbbrev=${resolved.stateAbbrev ?? "(none)"}  expected ${tc.expectedState}  [${tc.note}]`;
      console.log(msg);
      failures.push(msg);
    }
  }

  // ── 2b. Cities NOT in static table — stub fetch to avoid real geocoder calls ──
  console.log("\n=== resolveLocationToZip Layer 2b (parse-only: city not in static table) ===\n");
  console.log("  (fetch is stubbed — no real network calls)\n");

  const realFetch = globalThis.fetch;

  for (const tc of CITY_NOT_IN_TABLE_CASES) {
    // Install a stub that returns a fake Census geocoder response containing
    // the fakeZip. This exercises the Layer 2b Census path without touching
    // a real geocoder while still confirming stateAbbrev came from parseCityState.
    let fetchCallCount = 0;
    (globalThis as any).fetch = (_url: string, _opts?: RequestInit): Promise<Response> => {
      fetchCallCount++;
      return Promise.resolve(fakeCensusResponse(tc.fakeZip, tc.expectedState));
    };

    let resolved: Awaited<ReturnType<typeof resolveLocationToZip>>;
    try {
      resolved = await resolveLocationToZip(tc.input);
    } finally {
      (globalThis as any).fetch = realFetch;
    }

    if (!resolved) {
      failed++;
      const msg = `  ✗  "${tc.input}"  → resolveLocationToZip returned null (stubbed geocoder)  [${tc.note}]`;
      console.log(msg);
      failures.push(msg);
      continue;
    }

    // The stateAbbrev must come from parseCityState (i.e. parsed from the input)
    const stateOk = resolved.stateAbbrev === tc.expectedState;
    if (stateOk) {
      passed++;
      console.log(`  ✓  "${tc.input}"  → stateAbbrev=${resolved.stateAbbrev}  (fetchCalls=${fetchCallCount})  [${tc.note}]`);
    } else {
      failed++;
      const msg = `  ✗  "${tc.input}"  → stateAbbrev=${resolved.stateAbbrev ?? "(none)"}  expected ${tc.expectedState}  [${tc.note}]`;
      console.log(msg);
      failures.push(msg);
    }

    // Confirm stateAbbrev on result matches the raw abbreviation in the input string
    const inputAbbrevMatch = tc.input.match(/,\s*([A-Z]{2})$/);
    if (inputAbbrevMatch) {
      const inputAbbrev = inputAbbrevMatch[1];
      const abbrevMatchesInput = resolved.stateAbbrev === inputAbbrev;
      if (abbrevMatchesInput) {
        passed++;
        console.log(`  ✓  "${tc.input}"  → stateAbbrev matches input abbreviation '${inputAbbrev}'  [${tc.note}]`);
      } else {
        failed++;
        const msg = `  ✗  "${tc.input}"  → stateAbbrev=${resolved.stateAbbrev ?? "(none)"}  expected input abbreviation '${inputAbbrev}'  [${tc.note}]`;
        console.log(msg);
        failures.push(msg);
      }
    }
  }
}

runCases().then(() => runLayer2Cases()).then(() => {
  console.log(`\n─────────────────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.error("\nFAILURES:");
    for (const f of failures) console.error(f);
    process.exit(1);
  } else {
    console.log("All ZIP-to-state assertions passed.");
    process.exit(0);
  }
}).catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
