/**
 * childcare-provider-intel.ts
 *
 * Texas childcare provider intelligence layer.
 *
 * Primary data source: Texas HHSC Child Care Licensing (CCL) operations dataset
 * (data.texas.gov dataset bc5r-88dy).  Aggregate/provider-level records only;
 * no child PII is stored or transmitted.
 *
 * Gap analysis dimensions:
 *   1. Slot gap — licensed capacity vs. estimated demand (children 0–12)
 *   2. Affordability gap — market rate vs. CCAP/scholarship coverage
 *   3. Schedule coverage gap — non-standard-hours availability
 *   4. Texas Rising Star (TRS) quality tier distribution
 *
 * All county filters are applied server-side.  The cache TTL is 24 hours to
 * balance data freshness against Socrata API rate limits.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HhscProvider {
  operation_number: string;
  operation_name: string;
  operation_type: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  license_status: string;
  licensed_capacity: number | null;
  ages_served: string | null;
  hours_of_operation: string | null;
  trs_designation: string | null;
  phone: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ProviderSummary {
  county: string;
  totalProviders: number | null;
  licensedProviders: number | null;
  totalLicensedCapacity: number | null;
  avgCapacityPerProvider: number | null;
  trsDistribution: Record<string, number>;
  operationTypes: Record<string, number>;
  nonStandardHoursCount: number | null;
  dataSource: string;
  retrievedAt: string;
}

export interface SlotGapAnalysis {
  county: string;
  licensedCapacity: number | null;
  estimatedDemand: number | null;
  slotGap: number | null;
  coverageRate: number | null; // 0–1; null if demand unknown
  methodology: string;
  dataSource: string;
}

export interface TrsQualityProfile {
  county: string;
  totalRated: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  tier4Count: number;
  tier5Count: number;
  unratedCount: number;
  highQualityRate: number | null; // tier3+ as fraction; null if no data
}

export interface ChildcareIntelResult {
  summary: ProviderSummary;
  slotGap: SlotGapAnalysis;
  trsQuality: TrsQualityProfile;
  providers: HhscProvider[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HHSC_CCL_DATASET_ID = "bc5r-88dy";
const HHSC_API_BASE = "https://data.texas.gov/resource";
const HHSC_PAGE_SIZE = 10_000;
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

// ---------------------------------------------------------------------------
// Lightweight in-process TTL cache (no external dependency)
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const _cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  _cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ---------------------------------------------------------------------------
// HHSC API fetch helpers
// ---------------------------------------------------------------------------

async function fetchHhscPage(
  county: string,
  offset: number,
  deadline?: number,
): Promise<Record<string, unknown>[]> {
  const countyUpper = county.toUpperCase();
  const url = new URL(`${HHSC_API_BASE}/${HHSC_CCL_DATASET_ID}.json`);
  url.searchParams.set("$limit", String(HHSC_PAGE_SIZE));
  url.searchParams.set("$offset", String(offset));
  url.searchParams.set("$where", `upper(county)='${countyUpper.replace(/'/g, "''")}'`);
  url.searchParams.set("$order", "operation_name ASC");

  const controller = new AbortController();
  const remaining = deadline === undefined ? 15_000 : Math.max(1, deadline - Date.now());
  const timer = setTimeout(() => controller.abort(), Math.min(15_000, remaining));

  try {
    const resp = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!resp.ok) {
      throw new Error(`HHSC API ${resp.status}: ${await resp.text().catch(() => "")}`);
    }
    return (await resp.json()) as Record<string, unknown>[];
  } finally {
    clearTimeout(timer);
  }
}

function parseProvider(raw: Record<string, unknown>): HhscProvider {
  // HHSC CCL bc5r-88dy dataset field mapping (verified 2026-09-04):
  //   total_capacity (string "187") → licensed_capacity
  //   operation_status ("Y"/"N") → license_status
  //   phone_number → phone
  //   zipcode → zip
  //   website_address → website_url
  //   licensed_to_serve_ages → ages_served
  //   no separate lat/lon (location_address_geo has embedded JSON)
  //   no TRS designation field in this dataset (covered by separate TRS dataset)
  const capacityRaw = raw.total_capacity ?? raw.licensed_capacity;
  const capacityText = capacityRaw == null ? "" : String(capacityRaw).trim();
  const capacityNum = /^\d+$/.test(capacityText) ? Number(capacityText) : NaN;

  return {
    operation_number: String(raw.operation_number ?? raw.operation_id ?? ""),
    operation_name: String(raw.operation_name ?? ""),
    operation_type: String(raw.operation_type ?? ""),
    city: String(raw.city ?? ""),
    county: String(raw.county ?? ""),
    state: String(raw.state ?? "TX"),
    zip: String(raw.zipcode ?? raw.zip ?? ""),
    // operation_status is "Y"/"N" boolean; type_of_issuance gives the permit type
    license_status: raw.operation_status === "Y"
      ? String(raw.type_of_issuance ?? "Licensed")
      : (raw.operation_status === "N" ? "Inactive" : String(raw.operation_status ?? "")),
    licensed_capacity: Number.isSafeInteger(capacityNum) && capacityNum >= 0 ? capacityNum : null,
    ages_served: (raw.licensed_to_serve_ages ?? raw.ages_served)
      ? String(raw.licensed_to_serve_ages ?? raw.ages_served)
      : null,
    hours_of_operation: raw.hours_of_operation ? String(raw.hours_of_operation) : null,
    // TRS designation is in a separate dataset (Texas Rising Star portal); CCL dataset does not include it
    trs_designation: raw.trs_designation ? String(raw.trs_designation) : null,
    phone: (raw.phone_number ?? raw.phone) ? String(raw.phone_number ?? raw.phone) : null,
    website_url: (raw.website_address ?? raw.website_url)
      ? String(raw.website_address ?? raw.website_url)
      : null,
    latitude: null,  // location_address_geo has embedded JSON; no direct lat/lon
    longitude: null,
  };
}

// ---------------------------------------------------------------------------
// Core fetch: paginate until empty page
// ---------------------------------------------------------------------------

async function fetchAllProvidersForCounty(county: string): Promise<HhscProvider[]> {
  const cacheKey = `hhsc:county:${county.toUpperCase()}`;
  const cached = cacheGet<HhscProvider[]>(cacheKey);
  if (cached) return cached;

  const all: HhscProvider[] = [];
  let offset = 0;
  let pages = 0;
  const deadline = Date.now() + 30_000;

  while (true) {
    if (++pages > 100 || Date.now() >= deadline) {
      throw new Error("HHSC county query exceeded its bounded pagination window");
    }
    const page = await fetchHhscPage(county, offset, deadline);
    if (page.length === 0) break;
    for (const raw of page) {
      all.push(parseProvider(raw));
    }
    if (page.length < HHSC_PAGE_SIZE) break;
    offset += HHSC_PAGE_SIZE;
  }

  cacheSet(cacheKey, all, CACHE_TTL_SECONDS);
  return all;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function buildSummary(
  county: string,
  providers: HhscProvider[],
  sourceAvailable = true,
): ProviderSummary {
  if (!sourceAvailable) {
    return {
      county: county.toUpperCase(),
      totalProviders: null,
      licensedProviders: null,
      totalLicensedCapacity: null,
      avgCapacityPerProvider: null,
      trsDistribution: {},
      operationTypes: {},
      nonStandardHoursCount: null,
      dataSource: `Texas HHSC CCL dataset (data.texas.gov/${HHSC_CCL_DATASET_ID})`,
      retrievedAt: new Date().toISOString(),
    };
  }
  // Active = not Inactive and not blank.  After HHSC CCL field-mapping fix
  // (2026-09-04), license_status is "Full Permit" / "Partial Permit", NOT the
  // literal string "LICENSED" — the old includes("LICENSED") always returned 0.
  const active = providers.filter(
    (p) => p.license_status && p.license_status !== "Inactive",
  );
  const totalCap = active.reduce((sum, p) => sum + (p.licensed_capacity ?? 0), 0);
  const providersWithCapacity = active.filter((p) => (p.licensed_capacity ?? 0) > 0);
  const avgCap = providersWithCapacity.length > 0 ? totalCap / providersWithCapacity.length : 0;

  // HHSC CCL does not currently publish a TRS field. Only report a
  // distribution when an authoritative designation is actually present.
  const trsDist: Record<string, number> = {};
  if (active.some((p) => p.trs_designation?.trim())) {
    for (const p of active) {
      const tier = p.trs_designation?.trim() || "Not Rated";
      trsDist[tier] = (trsDist[tier] ?? 0) + 1;
    }
  }

  // Operation types
  const opTypes: Record<string, number> = {};
  for (const p of active) {
    const t = p.operation_type || "Unknown";
    opTypes[t] = (opTypes[t] ?? 0) + 1;
  }

  // Non-standard hours heuristic: contains weekend, evening, night, 24-hour
  const nonStdHoursRx = /week\s*end|eveni|night|24.?hour|overnight|weekend/i;
  const nonStdCount = providers.filter(
    (p) =>
      p.license_status &&
      p.license_status !== "Inactive" &&
      p.hours_of_operation &&
      nonStdHoursRx.test(p.hours_of_operation),
  ).length;

  return {
    county: county.toUpperCase(),
    totalProviders: providers.length,
    licensedProviders: active.length,
    totalLicensedCapacity: totalCap,
    avgCapacityPerProvider: Math.round(avgCap),
    trsDistribution: trsDist,
    operationTypes: opTypes,
    nonStandardHoursCount: nonStdCount,
    dataSource: `Texas HHSC CCL dataset (data.texas.gov/${HHSC_CCL_DATASET_ID})`,
    retrievedAt: new Date().toISOString(),
  };
}

function buildSlotGap(
  county: string,
  providers: HhscProvider[],
  estimatedDemand: number | null = null,
  sourceAvailable = true,
): SlotGapAnalysis {
  if (!sourceAvailable) {
    return {
      county: county.toUpperCase(),
      licensedCapacity: null,
      estimatedDemand,
      slotGap: null,
      coverageRate: null,
      methodology:
        "Texas HHSC CCL was unavailable, so licensed capacity cannot be calculated. " +
        "Demand is an ACS estimate when available.",
      dataSource: `Texas HHSC CCL dataset (data.texas.gov/${HHSC_CCL_DATASET_ID})`,
    };
  }
  const capacity = providers
    .filter((p) => p.license_status && p.license_status !== "Inactive")
    .reduce((sum, p) => sum + (p.licensed_capacity ?? 0), 0);
  const countyKey = county.toUpperCase();

  const slotGap = estimatedDemand !== null ? estimatedDemand - capacity : null;
  const coverageRate = estimatedDemand !== null && estimatedDemand > 0
    ? Math.min(1, capacity / estimatedDemand)
    : null;

  return {
    county: countyKey,
    licensedCapacity: capacity,
    estimatedDemand,
    slotGap,
    coverageRate,
    methodology:
      "Licensed capacity from HHSC CCL; demand estimate from ACS B01001 children 0–12 (2022). " +
      "Does not account for informal/unlicensed care or occupancy rates. " +
      estimatedDemand === null
        ? "Demand estimate not available for this county."
        : "Demand is an ACS estimate; contact TWC/WSRCA for contracted capacity.",
    dataSource: estimatedDemand === null
      ? "Texas HHSC CCL; ACS demand estimate unavailable"
      : "Texas HHSC CCL + ACS 2022 B01001",
  };
}

function buildTrsProfile(county: string, providers: HhscProvider[]): TrsQualityProfile {
  if (!providers.some((p) => p.trs_designation?.trim())) {
    return {
      county: county.toUpperCase(),
      totalRated: 0,
      tier1Count: 0,
      tier2Count: 0,
      tier3Count: 0,
      tier4Count: 0,
      tier5Count: 0,
      unratedCount: 0,
      highQualityRate: null,
    };
  }

  let tier1 = 0, tier2 = 0, tier3 = 0, tier4 = 0, tier5 = 0, unrated = 0;

  for (const p of providers) {
    const trs = p.trs_designation?.trim().toUpperCase() ?? "";
    if (!trs || trs === "NOT RATED" || trs === "N/A" || trs === "") {
      unrated++;
    } else if (trs.includes("STAR 1") || trs === "1") {
      tier1++;
    } else if (trs.includes("STAR 2") || trs === "2") {
      tier2++;
    } else if (trs.includes("STAR 3") || trs === "3") {
      tier3++;
    } else if (trs.includes("STAR 4") || trs === "4") {
      tier4++;
    } else if (trs.includes("STAR 5") || trs === "5") {
      tier5++;
    } else {
      unrated++;
    }
  }

  const totalRated = tier1 + tier2 + tier3 + tier4 + tier5;
  const highQualityRate =
    totalRated + unrated > 0 ? (tier3 + tier4 + tier5) / (totalRated + unrated) : null;

  return {
    county: county.toUpperCase(),
    totalRated,
    tier1Count: tier1,
    tier2Count: tier2,
    tier3Count: tier3,
    tier4Count: tier4,
    tier5Count: tier5,
    unratedCount: unrated,
    highQualityRate,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getChildcareIntel(
  county: string,
  estimatedDemand: number | null = null,
): Promise<ChildcareIntelResult> {
  const warnings: string[] = [];
  const countyFips = Object.entries(TX_COUNTY_FIPS_TO_NAME)
    .find(([, name]) => name === county.toUpperCase())?.[0];
  const providerResult = fetchAllProvidersForCounty(county)
    .then((providers) => ({ providers, error: null as Error | null }))
    .catch((error: unknown) => ({
      providers: [] as HhscProvider[],
      error: error instanceof Error ? error : new Error("unknown error"),
    }));
  const demandResult = estimatedDemand !== null
    ? Promise.resolve(estimatedDemand)
    : (countyFips ? fetchAcsChildPop("48", countyFips) : Promise.resolve(null));
  const [providerOutcome, resolvedDemand] = await Promise.all([
    providerResult,
    demandResult.catch(() => null),
  ]);
  const providers = providerOutcome.providers;
  const hhscAvailable = providerOutcome.error === null;
  if (providerOutcome.error) {
    warnings.push(`HHSC API unavailable: ${providerOutcome.error.message}`);
  }

  if (providers.length === 0 && hhscAvailable) {
    warnings.push(
      `No HHSC CCL providers found for county "${county}". ` +
        "Verify the county name matches Texas HHSC records (e.g. WILLIAMSON, not Williamson Co.).",
    );
  }

  if (resolvedDemand === null) {
    warnings.push(
      "ACS child-population demand data is unavailable for this county; demand and slot-gap metrics are not calculated.",
    );
  }
  const summary = buildSummary(county, providers, hhscAvailable);
  const slotGap = buildSlotGap(county, providers, resolvedDemand, hhscAvailable);
  const trsQuality = buildTrsProfile(county, providers);

  return { summary, slotGap, trsQuality, providers, warnings };
}

export function clearChildcareCache(): void {
  _cache.clear();
}

// ---------------------------------------------------------------------------
// Nationwide support — Census County Business Patterns (CBP) NAICS 6244
// ---------------------------------------------------------------------------

const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
  "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN",
  "19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA",
  "26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV",
  "33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH",
  "40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN",
  "48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
};

const CENSUS_CBP_STATE_URL =
  "https://api.census.gov/data/2022/cbp?get=ESTAB,EMP&for=state:*&NAICS2017=6244";
const CENSUS_ACS_STATE_URL =
  "https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_003E,B01001_004E,B01001_005E,B01001_027E,B01001_028E,B01001_029E&for=state:*";
const ALICE_OVERVIEW_URL = "https://www.unitedforalice.org/national-overview";

export interface NationalChildcareStateRow {
  stateFips: string;
  state: string;
  providerEstablishments: number | null;
  childcareEmployees: number | null;
  estimatedChildren0To12: number | null;
  establishmentsPer1000Children: number | null;
  cbpAvailable: boolean;
  acsAvailable: boolean;
  dataStatus: "complete" | "partial" | "unavailable";
}

export interface NationalChildcareOverview {
  retrievedAt: string;
  coverage: {
    statesIncluded: number;
    statesWithCompleteData: number;
    providerDataVintage: "2022";
    childPopulationVintage: "2022";
  };
  national: {
    providerEstablishments: number | null;
    childcareEmployees: number | null;
    estimatedChildren0To12: number | null;
    establishmentsPer1000Children: number | null;
  };
  states: NationalChildcareStateRow[];
  economicContext: {
    sourceName: "United for ALICE";
    sourceUrl: string;
    dataVintage: "2024";
    reportPublished: "2026";
    totalHouseholds: number;
    povertyHouseholds: number;
    aliceHouseholds: number;
    belowAliceThresholdHouseholds: number;
    belowAliceThresholdRate: number;
    disclosure: string;
  };
  sources: Array<{ name: string; url: string; role: string; vintage: string }>;
  warnings: string[];
}

interface NationalCbpRow {
  stateFips: string;
  establishments: number | null;
  employees: number | null;
}

interface NationalAcsRow {
  stateFips: string;
  stateName: string;
  children0To12: number | null;
}

async function fetchCensusTable(
  baseUrl: string,
  label: string,
): Promise<string[][]> {
  const url = new URL(baseUrl);
  const key = process.env.CENSUS_API_KEY ?? "";
  if (key) url.searchParams.set("key", key);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    if (!resp.ok) {
      throw new Error(`${label} returned HTTP ${resp.status}`);
    }
    const rows = await resp.json();
    if (
      !Array.isArray(rows) ||
      rows.length < 2 ||
      !Array.isArray(rows[0]) ||
      !rows.slice(1).every((row: unknown) => Array.isArray(row))
    ) {
      throw new Error(`${label} returned an invalid table`);
    }
    return rows as string[][];
  } finally {
    clearTimeout(timer);
  }
}

function parseCensusCount(raw: string | undefined): number | null {
  const value = raw?.trim() ?? "";
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function fetchNationalCbp(): Promise<NationalCbpRow[]> {
  const rows = await fetchCensusTable(CENSUS_CBP_STATE_URL, "Census CBP state query");
  const headers = rows[0];
  const stateIndex = headers.indexOf("state");
  const estabIndex = headers.indexOf("ESTAB");
  const employeeIndex = headers.indexOf("EMP");
  if (stateIndex < 0 || estabIndex < 0 || employeeIndex < 0) {
    throw new Error("Census CBP state query omitted the required fields");
  }

  return rows.slice(1).flatMap((row) => {
    const stateFips = String(row[stateIndex] ?? "").padStart(2, "0");
    if (!STATE_FIPS_TO_ABBR[stateFips]) return [];
    return [{
      stateFips,
      establishments: parseCensusCount(row[estabIndex]),
      employees: parseCensusCount(row[employeeIndex]),
    }];
  });
}

async function fetchNationalAcs(): Promise<NationalAcsRow[]> {
  const rows = await fetchCensusTable(CENSUS_ACS_STATE_URL, "Census ACS state query");
  const headers = rows[0];
  const stateIndex = headers.indexOf("state");
  const nameIndex = headers.indexOf("NAME");
  const childVariables = [
    "B01001_003E", "B01001_004E", "B01001_005E",
    "B01001_027E", "B01001_028E", "B01001_029E",
  ];
  const childIndexes = childVariables.map((variable) => headers.indexOf(variable));
  if (stateIndex < 0 || nameIndex < 0 || childIndexes.some((index) => index < 0)) {
    throw new Error("Census ACS state query omitted the required fields");
  }

  return rows.slice(1).flatMap((row) => {
    const stateFips = String(row[stateIndex] ?? "").padStart(2, "0");
    if (!STATE_FIPS_TO_ABBR[stateFips]) return [];
      const values = childIndexes.map((index) => parseCensusCount(row[index]));
      const children0To12 = values.every((value): value is number => value !== null)
        ? values.reduce(
            (sum, value, position) =>
              sum + (position === 2 || position === 5 ? Math.round(value * 0.6) : value),
            0,
          )
        : null;
    return [{
      stateFips,
      stateName: String(row[nameIndex] ?? STATE_FIPS_TO_ABBR[stateFips]),
      children0To12,
    }];
  });
}

const ALICE_NATIONAL_BENCHMARK = {
  sourceName: "United for ALICE" as const,
  sourceUrl: ALICE_OVERVIEW_URL,
  dataVintage: "2024" as const,
  reportPublished: "2026" as const,
  totalHouseholds: 131_939_401,
  povertyHouseholds: 16_495_052,
  aliceHouseholds: 38_027_832,
  belowAliceThresholdHouseholds: 54_522_884,
  belowAliceThresholdRate: 41,
  disclosure:
    "Economic-pressure context from United for ALICE's published national overview. " +
    "It is not TCAF data and does not measure childcare supply, licensed capacity, or slots.",
};

/** Build the national childcare overview from two live Census state tables. */
export async function getNationalChildcareOverview(): Promise<NationalChildcareOverview> {
  const cacheKey = "childcare:national-overview";
  const cached = cacheGet<NationalChildcareOverview>(cacheKey);
  if (cached) return cached;

  const [cbpResult, acsResult] = await Promise.all([
    fetchNationalCbp()
      .then((rows) => ({ rows, error: null as Error | null }))
      .catch((error: unknown) => ({
        rows: [] as NationalCbpRow[],
        error: error instanceof Error ? error : new Error("CBP source failed"),
      })),
    fetchNationalAcs()
      .then((rows) => ({ rows, error: null as Error | null }))
      .catch((error: unknown) => ({
        rows: [] as NationalAcsRow[],
        error: error instanceof Error ? error : new Error("ACS source failed"),
      })),
  ]);
  if (cbpResult.error && acsResult.error) {
    throw new Error("Both Census childcare sources are unavailable");
  }
  const cbpRows = cbpResult.rows;
  const acsRows = acsResult.rows;
  const sourceWarnings: string[] = [];
  if (cbpResult.error) {
    sourceWarnings.push("Census CBP is unavailable; establishment and employee fields are shown as unavailable.");
  } else if (cbpRows.length === 0) {
    sourceWarnings.push("Census CBP returned no state rows; establishment and employee fields are shown as unavailable.");
  }
  if (acsResult.error) {
    sourceWarnings.push("Census ACS is unavailable; estimated child-population fields are shown as unavailable.");
  } else if (acsRows.length === 0) {
    sourceWarnings.push("Census ACS returned no state rows; estimated child-population fields are shown as unavailable.");
  }
  const cbpByState = new Map(cbpRows.map((row) => [row.stateFips, row]));
  const acsByState = new Map(acsRows.map((row) => [row.stateFips, row]));
  const states = Array.from(new Set([...cbpByState.keys(), ...acsByState.keys()]))
    .filter((stateFips) => Boolean(STATE_FIPS_TO_ABBR[stateFips]))
    .sort()
    .map((stateFips): NationalChildcareStateRow => {
      const acs = acsByState.get(stateFips);
      const cbp = cbpByState.get(stateFips);
      const providerEstablishments = cbp?.establishments ?? null;
      const estimatedChildren0To12 = acs?.children0To12 ?? null;
      const establishmentsPer1000Children =
        providerEstablishments !== null && estimatedChildren0To12
          ? Math.round((providerEstablishments / estimatedChildren0To12) * 1000 * 10) / 10
          : null;
      return {
        stateFips,
        state: acs?.stateName ?? STATE_FIPS_TO_ABBR[stateFips],
        providerEstablishments,
        childcareEmployees: cbp?.employees ?? null,
        estimatedChildren0To12,
        establishmentsPer1000Children,
        cbpAvailable: cbp !== undefined,
        acsAvailable: acs !== undefined,
        dataStatus: providerEstablishments !== null && estimatedChildren0To12 !== null && cbp?.employees !== null
          ? "complete"
          : providerEstablishments !== null || estimatedChildren0To12 !== null
            ? "partial"
            : "unavailable",
      };
    });

  const completeStates = states.filter((row) => row.dataStatus === "complete");
  const sumKnown = (field: "providerEstablishments" | "childcareEmployees" | "estimatedChildren0To12") => {
    const known = completeStates.map((row) => row[field]).filter((value): value is number => value !== null);
    return known.length > 0 ? known.reduce((sum, value) => sum + value, 0) : null;
  };
  const providerEstablishments = sumKnown("providerEstablishments");
  const estimatedChildren0To12 = sumKnown("estimatedChildren0To12");
  const warnings = [
    ...sourceWarnings,
    ...(completeStates.length < states.length
      ? ["National totals and the density ratio include only states with complete CBP and ACS inputs."]
      : []),
    "Census CBP establishments are not licensed childcare slots, capacity, occupancy, or available openings.",
    "The children 0–12 figure is an ACS estimate using all of the 10–14 age band at a 60% approximation; it is not a childcare enrollment count.",
    "Texas county drill-downs can use HHSC licensed-capacity records; nationwide state rows do not have standardized federal capacity data.",
    "A high or low establishment density is a screening signal, not a finding that a state has a confirmed childcare shortage.",
  ];
  const result: NationalChildcareOverview = {
    retrievedAt: new Date().toISOString(),
    coverage: {
      statesIncluded: states.length,
      statesWithCompleteData: states.filter((row) => row.dataStatus === "complete").length,
      providerDataVintage: "2022",
      childPopulationVintage: "2022",
    },
    national: {
      providerEstablishments,
      childcareEmployees: sumKnown("childcareEmployees"),
      estimatedChildren0To12,
      establishmentsPer1000Children:
        providerEstablishments !== null && estimatedChildren0To12
          ? Math.round((providerEstablishments / estimatedChildren0To12) * 1000 * 10) / 10
          : null,
    },
    states,
    economicContext: ALICE_NATIONAL_BENCHMARK,
    sources: [
      {
        name: "U.S. Census County Business Patterns",
        url: "https://api.census.gov/data/2022/cbp.html",
        role: "State childcare establishment and employee counts, NAICS 6244",
        vintage: "2022",
      },
      {
        name: "U.S. Census American Community Survey",
        url: "https://api.census.gov/data/2022/acs/acs5.html",
        role: "Estimated children ages 0–12 from B01001",
        vintage: "2022 ACS 5-year",
      },
      {
        name: "United for ALICE",
        url: ALICE_OVERVIEW_URL,
        role: "External household economic-pressure context",
        vintage: "2024 data shown in 2026 national report",
      },
    ],
    warnings,
  };
  if (!cbpResult.error && !acsResult.error && cbpRows.length > 0 && acsRows.length > 0) {
    cacheSet(cacheKey, result, CACHE_TTL_SECONDS);
  }
  return result;
}

/** Texas 3-digit county FIPS → uppercase county name (254 counties). */
export const TX_COUNTY_FIPS_TO_NAME: Record<string, string> = {
  "001":"ANDERSON","003":"ANDREWS","005":"ANGELINA","007":"ARANSAS","009":"ARCHER",
  "011":"ARMSTRONG","013":"ATASCOSA","015":"AUSTIN","017":"BAILEY","019":"BANDERA",
  "021":"BASTROP","023":"BAYLOR","025":"BEE","027":"BELL","029":"BEXAR",
  "031":"BLANCO","033":"BORDEN","035":"BOSQUE","037":"BOWIE","039":"BRAZORIA",
  "041":"BRAZOS","043":"BREWSTER","045":"BRISCOE","047":"BROOKS","049":"BROWN",
  "051":"BURLESON","053":"BURNET","055":"CALDWELL","057":"CALHOUN","059":"CALLAHAN",
  "061":"CAMERON","063":"CAMP","065":"CARSON","067":"CASS","069":"CASTRO",
  "071":"CHAMBERS","073":"CHEROKEE","075":"CHILDRESS","077":"CLAY","079":"COCHRAN",
  "081":"COKE","083":"COLEMAN","085":"COLLIN","087":"COLLINGSWORTH","089":"COLORADO",
  "091":"COMAL","093":"COMANCHE","095":"CONCHO","097":"COOKE","099":"CORYELL",
  "101":"COTTLE","103":"CRANE","105":"CROCKETT","107":"CROSBY","109":"CULBERSON",
  "111":"DALLAM","113":"DALLAS","115":"DAWSON","117":"DEAF SMITH","119":"DELTA",
  "121":"DENTON","123":"DEWITT","125":"DICKENS","127":"DIMMIT","129":"DONLEY",
  "131":"DUVAL","133":"EASTLAND","135":"ECTOR","137":"EDWARDS","139":"ELLIS",
  "141":"EL PASO","143":"ERATH","145":"FALLS","147":"FANNIN","149":"FAYETTE",
  "151":"FISHER","153":"FLOYD","155":"FOARD","157":"FORT BEND","159":"FRANKLIN",
  "161":"FREESTONE","163":"FRIO","165":"GAINES","167":"GALVESTON","169":"GARZA",
  "171":"GILLESPIE","173":"GLASSCOCK","175":"GOLIAD","177":"GONZALES","179":"GRAY",
  "181":"GRAYSON","183":"GREGG","185":"GRIMES","187":"GUADALUPE","189":"HALE",
  "191":"HALL","193":"HAMILTON","195":"HANSFORD","197":"HARDEMAN","199":"HARDIN",
  "201":"HARRIS","203":"HARRISON","205":"HARTLEY","207":"HASKELL","209":"HAYS",
  "211":"HEMPHILL","213":"HENDERSON","215":"HIDALGO","217":"HILL","219":"HOCKLEY",
  "221":"HOOD","223":"HOPKINS","225":"HOUSTON","227":"HOWARD","229":"HUDSPETH",
  "231":"HUNT","233":"HUTCHINSON","235":"IRION","237":"JACK","239":"JACKSON",
  "241":"JASPER","243":"JEFF DAVIS","245":"JEFFERSON","247":"JIM HOGG","249":"JIM WELLS",
  "251":"JOHNSON","253":"JONES","255":"KARNES","257":"KAUFMAN","259":"KENDALL",
  "261":"KENEDY","263":"KENT","265":"KERR","267":"KIMBLE","269":"KING",
  "271":"KINNEY","273":"KLEBERG","275":"KNOX","277":"LAMAR","279":"LAMB",
  "281":"LAMPASAS","283":"LA SALLE","285":"LAVACA","287":"LEE","289":"LEON",
  "291":"LIBERTY","293":"LIMESTONE","295":"LIPSCOMB","297":"LIVE OAK","299":"LLANO",
  "301":"LOVING","303":"LUBBOCK","305":"LYNN","307":"MCCULLOCH","309":"MCLENNAN",
  "311":"MCMULLEN","313":"MADISON","315":"MARION","317":"MARTIN","319":"MASON",
  "321":"MATAGORDA","323":"MAVERICK","325":"MEDINA","327":"MENARD","329":"MIDLAND",
  "331":"MILAM","333":"MILLS","335":"MITCHELL","337":"MONTAGUE","339":"MONTGOMERY",
  "341":"MOORE","343":"MORRIS","345":"MOTLEY","347":"NACOGDOCHES","349":"NAVARRO",
  "351":"NEWTON","353":"NOLAN","355":"NUECES","357":"OCHILTREE","359":"OLDHAM",
  "361":"ORANGE","363":"PALO PINTO","365":"PANOLA","367":"PARKER","369":"PARMER",
  "371":"PECOS","373":"POLK","375":"POTTER","377":"PRESIDIO","379":"RAINS",
  "381":"RANDALL","383":"REAGAN","385":"REAL","387":"RED RIVER","389":"REEVES",
  "391":"REFUGIO","393":"ROBERTS","395":"ROBERTSON","397":"ROCKWALL","399":"RUNNELS",
  "401":"RUSK","403":"SABINE","405":"SAN AUGUSTINE","407":"SAN JACINTO","409":"SAN PATRICIO",
  "411":"SAN SABA","413":"SCHLEICHER","415":"SCURRY","417":"SHACKELFORD","419":"SHELBY",
  "421":"SHERMAN","423":"SMITH","425":"SOMERVELL","427":"STARR","429":"STEPHENS",
  "431":"STERLING","433":"STONEWALL","435":"SUTTON","437":"SWISHER","439":"TARRANT",
  "441":"TAYLOR","443":"TERRELL","445":"TERRY","447":"THROCKMORTON","449":"TITUS",
  "451":"TOM GREEN","453":"TRAVIS","455":"TRINITY","457":"TYLER","459":"UPSHUR",
  "461":"UPTON","463":"UVALDE","465":"VAL VERDE","467":"VAN ZANDT","469":"VICTORIA",
  "471":"WALKER","473":"WALLER","475":"WARD","477":"WASHINGTON","479":"WEBB",
  "481":"WHARTON","483":"WHEELER","485":"WICHITA","487":"WILBARGER","489":"WILLACY",
  "491":"WILLIAMSON","493":"WILSON","495":"WINKLER","497":"WISE","499":"WOOD",
  "501":"YOAKUM","503":"YOUNG","505":"ZAPATA","507":"ZAVALA",
};

/** Fetch NAICS 6244 establishment + employee counts from Census CBP 2022. */
async function fetchCbpEstab(
  stateFips: string,
  countyFips: string,
): Promise<{ estab: number | null; emp: number | null } | null> {
  const cacheKey = `cbp:6244:${stateFips}:${countyFips}`;
  const cached = cacheGet<{ estab: number | null; emp: number | null }>(cacheKey);
  if (cached) return cached;

  const key = process.env.CENSUS_API_KEY ?? "";
  const url =
    `https://api.census.gov/data/2022/cbp?get=ESTAB,EMP` +
    `&for=county:${countyFips}&in=state:${stateFips}` +
    `&NAICS2017=6244` +
    (key ? `&key=${key}` : "");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    if (!resp.ok) return null;
    const rows: string[][] = await resp.json();
    if (!Array.isArray(rows) || rows.length < 2) return null;
    const [headers, data] = rows;
    const ei = headers.indexOf("ESTAB");
    const mi = headers.indexOf("EMP");
    if (ei < 0) return null;
    const estab = parseCensusCount(data[ei]);
    const emp = mi >= 0 ? parseCensusCount(data[mi]) : null;
    if (estab === null) return null;
    const result = { estab, emp };
    cacheSet(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Fetch children 0-12 population from ACS 5-year B01001 by county. */
async function fetchAcsChildPop(
  stateFips: string,
  countyFips: string,
): Promise<number | null> {
  const cacheKey = `acs:childpop:${stateFips}:${countyFips}`;
  const cached = cacheGet<number>(cacheKey);
  // cache miss returns undefined; 0 is a valid (suppressed) value
  if (cached !== undefined) return cached;

  const key = process.env.CENSUS_API_KEY ?? "";
  // Male under5/5-9/10-14, Female under5/5-9/10-14
  const vars = "B01001_003E,B01001_004E,B01001_005E,B01001_027E,B01001_028E,B01001_029E";
  const url =
    `https://api.census.gov/data/2022/acs/acs5?get=${vars}` +
    `&for=county:${countyFips}&in=state:${stateFips}` +
    (key ? `&key=${key}` : "");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    if (!resp.ok) return null;
    const rows: string[][] = await resp.json();
    if (!Array.isArray(rows) || rows.length < 2) return null;
    const [headers, data] = rows;
    const values = [
      "B01001_003E", "B01001_027E",
      "B01001_004E", "B01001_028E",
      "B01001_005E", "B01001_029E",
    ].map((variable) => parseCensusCount(data[headers.indexOf(variable)]));
    if (!values.every((value): value is number => value !== null)) return null;
    // 0-12 ≈ (under5) + (5-9) + 60% of (10-14)
    const childPop = values[0] + values[1] // male+female under-5
      + values[2] + values[3]              // male+female 5-9
      + Math.round((values[4] + values[5]) * 0.6); // 60% of 10-14
    cacheSet(cacheKey, childPop, CACHE_TTL_SECONDS);
    return childPop;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Verify that a FIPS pair is a real Census county geography before querying childcare data. */
export async function validateCountyFips(
  stateFips: string,
  countyFips: string,
): Promise<"valid" | "invalid" | "unavailable"> {
  if (stateFips === "48") {
    return TX_COUNTY_FIPS_TO_NAME[countyFips] ? "valid" : "invalid";
  }
  const cacheKey = `census:county-exists:${stateFips}:${countyFips}`;
  const cached = cacheGet<"valid" | "invalid" | "unavailable">(cacheKey);
  if (cached) return cached;
  const key = process.env.CENSUS_API_KEY ?? "";
  const url =
    `https://api.census.gov/data/2022/acs/acs5?get=NAME` +
    `&for=county:${countyFips}&in=state:${stateFips}` +
    (key ? `&key=${key}` : "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      cacheSet(cacheKey, "unavailable", 60);
      return "unavailable";
    }
    const rows: unknown = await response.json();
    const valid =
      Array.isArray(rows) &&
      rows.length >= 2 &&
      Array.isArray(rows[0]) &&
      Array.isArray(rows[1]) &&
      rows[0].includes("NAME") &&
      rows[0].includes("state") &&
      rows[0].includes("county") &&
      rows[1][rows[0].indexOf("state")] === stateFips &&
      rows[1][rows[0].indexOf("county")] === countyFips;
    const result = valid ? "valid" : "invalid";
    cacheSet(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  } catch {
    cacheSet(cacheKey, "unavailable", 60);
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}

/** Build a ChildcareIntelResult from Census CBP data (non-Texas states). */
async function buildCbpChildcareIntel(
  stateFips: string,
  countyFips: string,
  countyName: string,
): Promise<ChildcareIntelResult> {
  const warnings: string[] = [];
  const stateAbbr = STATE_FIPS_TO_ABBR[stateFips] ?? stateFips;
  const label = `${countyName || countyFips}, ${stateAbbr}`;

  const [cbpResult, childPopResult] = await Promise.all([
    fetchCbpEstab(stateFips, countyFips)
      .then((value) => ({ value, failed: false }))
      .catch(() => ({ value: null, failed: true })),
    fetchAcsChildPop(stateFips, countyFips)
      .then((value) => ({ value, failed: false }))
      .catch(() => ({ value: null, failed: true })),
  ]);
  const cbp = cbpResult.value;
  const childPop = childPopResult.value;

  if (!cbp) {
    warnings.push(
      `Census CBP data unavailable for ${label}. ` +
      "Counts may be suppressed (cell < 3) or not yet published for 2022.",
    );
  }
  if (childPop === null) {
    warnings.push(
      `Census ACS child-population data unavailable for ${label}. ` +
      "The value may be suppressed, not published, or temporarily unreachable.",
    );
  }

  const totalProviders = cbp?.estab ?? null;
  const now = new Date().toISOString();

  const summary: ProviderSummary = {
    county: countyName.toUpperCase() || countyFips,
    totalProviders,
    licensedProviders: null,     // not derivable from CBP
    totalLicensedCapacity: null, // not derivable from CBP — requires state licensing API
    avgCapacityPerProvider: null,
    trsDistribution: {},
    operationTypes: totalProviders !== null && totalProviders > 0
      ? { "Child Day Care Services (NAICS 6244)": totalProviders }
      : {},
      nonStandardHoursCount: null,
    dataSource:
      `U.S. Census County Business Patterns (CBP) 2022, NAICS 6244 — ${label}. ` +
      "Capacity data requires state licensing records (not standardized federally).",
    retrievedAt: now,
  };

  const slotGap: SlotGapAnalysis = {
    county: countyName.toUpperCase() || countyFips,
    licensedCapacity: null,
    estimatedDemand: childPop,
    slotGap: null, // capacity unknown without state licensing data
    coverageRate: null,
    methodology:
      `Provider count (ESTAB) from Census CBP NAICS 6244 for ${label}. ` +
      "Licensed-slot capacity requires state-level childcare licensing records, which are not " +
      "standardized at the federal level. " +
      (childPop != null
        ? `Estimated demand: ${childPop.toLocaleString()} children ages 0–12 (ACS 2022 B01001).`
        : "Child population data unavailable for this county."),
    dataSource: "U.S. Census CBP 2022 + ACS 2022 B01001",
  };

  const trsQuality: TrsQualityProfile = {
    county: countyName.toUpperCase() || countyFips,
    totalRated: 0,
    tier1Count: 0, tier2Count: 0, tier3Count: 0, tier4Count: 0, tier5Count: 0,
    unratedCount: 0,
    highQualityRate: null, // quality rating programs are state-specific
  };

  warnings.push(
    "Provider-level capacity and quality data are available only for Texas (via HHSC CCL). " +
    "For other states, provider count is from Census CBP NAICS 6244 and capacity requires " +
    "state licensing API access.",
  );

  return { summary, slotGap, trsQuality, providers: [], warnings };
}

// ---------------------------------------------------------------------------
// Public — unified entry point for any county nationwide
// ---------------------------------------------------------------------------

/**
 * Fetch childcare intelligence for any U.S. county by FIPS code.
 * - Texas (stateFips "48"): uses live HHSC CCL dataset (provider-level, capacity, hours).
 * - All other states: uses Census CBP 2022 NAICS 6244 (establishment counts) +
 *   ACS 2022 B01001 (child population demand estimate).
 *
 * @param stateFips   2-digit state FIPS ("48" = TX)
 * @param countyFips  3-digit county FIPS (e.g. "491" = Williamson TX)
 * @param countyName  Human-readable county name (used for TX HHSC lookup; optional for others)
 */
export async function getChildcareIntelByFips(
  stateFips: string,
  countyFips: string,
  countyName = "",
): Promise<ChildcareIntelResult> {
  if (stateFips === "48") {
    // Texas: resolve county name from FIPS if not supplied, then use HHSC CCL
    const resolved =
      TX_COUNTY_FIPS_TO_NAME[countyFips.padStart(3, "0")] ||
      countyName.replace(/\s+county$/i, "").trim().toUpperCase() ||
      countyFips;
    return getChildcareIntel(resolved);
  }
  return buildCbpChildcareIntel(stateFips, countyFips, countyName);
}

/**
 * Returns a compact 2-line context string suitable for AI Navigator injection.
 * Never throws — returns null on any failure.
 */
export async function getChildcareContextSummary(
  stateFips: string,
  countyFips: string,
  countyName: string,
): Promise<string | null> {
  try {
    const intel = await getChildcareIntelByFips(stateFips, countyFips, countyName);
    const { summary, slotGap } = intel;
    const cap = summary.totalLicensedCapacity !== null && summary.totalLicensedCapacity > 0
      ? summary.totalLicensedCapacity.toLocaleString() + " licensed slots"
      : "capacity data unavailable (non-TX state)";
    const gap = slotGap.slotGap != null
      ? `${slotGap.slotGap > 0 ? "gap of " + slotGap.slotGap.toLocaleString() : "no gap"} vs. estimated demand`
      : slotGap.estimatedDemand != null
        ? `${slotGap.estimatedDemand.toLocaleString()} children ages 0–12 in county`
        : "demand data unavailable";
    const src = summary.dataSource.split(".")[0];
    const providerLabel = summary.licensedProviders !== null
      ? `${summary.totalProviders ?? "unknown"} licensed providers`
      : `${summary.totalProviders ?? "unknown"} provider establishments`;
    return (
      `[CHILDCARE DATA for ${summary.county}]: ` +
      `${providerLabel}, ${cap}, ${gap}. ` +
      `Source: ${src}.`
    );
  } catch {
    console.warn("[childcare] context summary unavailable; AI consumers must not infer childcare capacity.");
    return "[CHILDCARE DATA UNAVAILABLE]: Live childcare evidence could not be retrieved. Do not infer provider capacity, openings, or shortages.";
  }
}
