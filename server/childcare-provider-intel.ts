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
  totalProviders: number;
  licensedProviders: number;
  totalLicensedCapacity: number;
  avgCapacityPerProvider: number;
  trsDistribution: Record<string, number>;
  operationTypes: Record<string, number>;
  nonStandardHoursCount: number;
  dataSource: string;
  retrievedAt: string;
}

export interface SlotGapAnalysis {
  county: string;
  licensedCapacity: number;
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

/** Texas counties with approximate child-population estimates (ages 0–12, 2022 ACS).
 *  Used when live Census data is unavailable.  Values are illustrative and
 *  should be replaced with ACS B01001 queries in production.
 */
const COUNTY_CHILD_POPULATION_ESTIMATE: Record<string, number> = {
  "WILLIAMSON": 72_000,
  "TRAVIS": 110_000,
  "HAYS": 35_000,
  "BASTROP": 18_000,
  "CALDWELL": 9_500,
  "LEE": 3_200,
  "BURNET": 5_100,
  "LLANO": 2_400,
  "BLANCO": 1_800,
  "MILAM": 4_100,
};

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
): Promise<Record<string, unknown>[]> {
  const countyUpper = county.toUpperCase();
  const url = new URL(`${HHSC_API_BASE}/${HHSC_CCL_DATASET_ID}.json`);
  url.searchParams.set("$limit", String(HHSC_PAGE_SIZE));
  url.searchParams.set("$offset", String(offset));
  url.searchParams.set("$where", `upper(county)='${countyUpper.replace(/'/g, "''")}'`);
  url.searchParams.set("$order", "operation_name ASC");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

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
  const capacityNum = capacityRaw != null ? parseInt(String(capacityRaw), 10) : NaN;

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
    licensed_capacity: Number.isFinite(capacityNum) ? capacityNum : null,
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

  while (true) {
    const page = await fetchHhscPage(county, offset);
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

function buildSummary(county: string, providers: HhscProvider[]): ProviderSummary {
  const licensed = providers.filter(
    (p) => p.license_status.toUpperCase().includes("LICENSED"),
  );
  const totalCap = providers.reduce((sum, p) => sum + (p.licensed_capacity ?? 0), 0);
  const avgCap = licensed.length > 0 ? totalCap / licensed.length : 0;

  // TRS distribution
  const trsDist: Record<string, number> = {};
  for (const p of providers) {
    const tier = p.trs_designation?.trim() || "Not Rated";
    trsDist[tier] = (trsDist[tier] ?? 0) + 1;
  }

  // Operation types
  const opTypes: Record<string, number> = {};
  for (const p of providers) {
    const t = p.operation_type || "Unknown";
    opTypes[t] = (opTypes[t] ?? 0) + 1;
  }

  // Non-standard hours heuristic: contains weekend, evening, night, 24-hour
  const nonStdHoursRx = /week\s*end|eveni|night|24.?hour|overnight|weekend/i;
  const nonStdCount = providers.filter(
    (p) => p.hours_of_operation && nonStdHoursRx.test(p.hours_of_operation),
  ).length;

  return {
    county: county.toUpperCase(),
    totalProviders: providers.length,
    licensedProviders: licensed.length,
    totalLicensedCapacity: totalCap,
    avgCapacityPerProvider: Math.round(avgCap),
    trsDistribution: trsDist,
    operationTypes: opTypes,
    nonStandardHoursCount: nonStdCount,
    dataSource: `Texas HHSC CCL dataset (data.texas.gov/${HHSC_CCL_DATASET_ID})`,
    retrievedAt: new Date().toISOString(),
  };
}

function buildSlotGap(county: string, providers: HhscProvider[]): SlotGapAnalysis {
  const capacity = providers.reduce((sum, p) => sum + (p.licensed_capacity ?? 0), 0);
  const countyKey = county.toUpperCase();
  const estimatedDemand = COUNTY_CHILD_POPULATION_ESTIMATE[countyKey] ?? null;

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
        : "Demand estimate is illustrative; contact TWC/WSRCA for contracted capacity.",
    dataSource: `Texas HHSC CCL + ACS 2022 (estimated)`,
  };
}

function buildTrsProfile(county: string, providers: HhscProvider[]): TrsQualityProfile {
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

export async function getChildcareIntel(county: string): Promise<ChildcareIntelResult> {
  const warnings: string[] = [];

  let providers: HhscProvider[];
  try {
    providers = await fetchAllProvidersForCounty(county);
  } catch (err: any) {
    warnings.push(`HHSC API unavailable: ${err?.message ?? "unknown error"}`);
    providers = [];
  }

  if (providers.length === 0) {
    warnings.push(
      `No HHSC CCL providers found for county "${county}". ` +
        "Verify the county name matches Texas HHSC records (e.g. WILLIAMSON, not Williamson Co.).",
    );
  }

  const summary = buildSummary(county, providers);
  const slotGap = buildSlotGap(county, providers);
  const trsQuality = buildTrsProfile(county, providers);

  return { summary, slotGap, trsQuality, providers, warnings };
}

export function clearChildcareCache(): void {
  _cache.clear();
}
