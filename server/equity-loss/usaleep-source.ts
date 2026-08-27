/**
 * usaleep-source.ts
 *
 * Live fetch of CDC's U.S. Small-Area Life Expectancy Estimates Project
 * (USALEEP) dataset via its Socrata API — confirmed reachable this session
 * (docs/equity-loss-phase1-2-decisions.md, Phase 1). No static download or
 * license step needed, unlike IHME.
 *
 * Exposes only point life-expectancy estimates per tract/state, NOT the
 * underlying age-at-death distribution — that is why this data source can
 * only ever support the `geographic_dispersion` health-inequality method,
 * never `life_table_age_at_death`, at any grain. That cap is enforced
 * independently by the DB CHECK constraint in migrations/0010.
 */

import {
  alignConnecticutUsaleepTracts,
  CONNECTICUT_PLANNING_REGION_FIPS,
  type ConnecticutAlignmentReport,
} from "./connecticut-geography-alignment";

const USALEEP_URL = "https://data.cdc.gov/resource/5h56-n989.json";
const CONNECTICUT_COUNTY_TO_COUSUB_CROSSWALK_URL =
  "https://www2.census.gov/geo/docs/reference/ct_change/ct_cou_to_cousub_crosswalk.txt";
const CONNECTICUT_COUSUB_TO_TRACT_CROSSWALK_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel2022/acs22_cousub22_tract22_st09.txt";
const CONNECTICUT_TRACT_2020_TO_2010_CROSSWALK_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel2020/tract/tab20_tract20_tract10_st09.txt";

export interface UsaleepTractRow {
  tractFips: string; // full_ct_num, county-relative — combine with county FIPS by caller
  lifeExpectancy: number;
  standardError: number;
}

export interface UsaleepCounty {
  countyFips: string;
  countyName: string;
  stateAbbrev: string;
}

export interface UsaleepCountyLookupOptions {
  /**
   * Test seam for the authoritative Connecticut index. Production callers use
   * the single-flight source loader; this must never be a display-name map.
   */
  loadConnecticutAlignedIndex?: () => Promise<UsaleepTractIndex>;
}

export interface UsaleepTractIndex {
  /** CDC's source-native county labels, for unchanged county geographies. */
  bySourceCountyName: Map<string, UsaleepTractRow[]>;
  /**
   * Modern county-equivalent FIPS keys produced by an authoritative
   * relationship-file bridge. Currently this carries Connecticut's nine
   * Planning Regions; it must not be populated by display-name aliases.
   */
  byCountyFips: Map<string, UsaleepTractRow[]>;
  connecticutAlignment:
    | { status: "resolved"; report: ConnecticutAlignmentReport }
    | { status: "unavailable"; reason: string };
}

async function fetchJson(url: string, retries = 2): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15_000);
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }, signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return await r.json();
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (i < retries - 1) await new Promise((res) => setTimeout(res, 600));
    }
  }
  throw lastErr;
}

async function fetchText(url: string, retries = 2): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15_000);
    try {
      const response = await fetch(url, {
        headers: { Accept: "text/plain" },
        signal: ctl.signal,
      });
      clearTimeout(t);
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      clearTimeout(t);
      lastErr = error;
      if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  throw lastErr;
}

/**
 * Resolve a nationwide county-equivalent to USALEEP records. The authoritative
 * FIPS alignment takes priority. Source-name lookup is retained only for
 * county geographies that have not changed their county-equivalent boundary.
 */
export function resolveUsaleepTractsForCounty(
  index: UsaleepTractIndex,
  county: UsaleepCounty,
): UsaleepTractRow[] {
  const fipsAligned = index.byCountyFips.get(county.countyFips);
  if (fipsAligned) return fipsAligned;

  // Connecticut's county-equivalent boundaries changed. A legacy CDC county
  // label is not evidence that a modern Planning Region has the same
  // geography, so source-name fallback would fabricate an unproven join.
  if (county.stateAbbrev === "CT") return [];

  return index.bySourceCountyName.get(`${county.countyName}, ${county.stateAbbrev}`) ?? [];
}

/**
 * Fetch every tract's life-expectancy point estimate for a county-equivalent.
 * Connecticut is always resolved through the same FIPS alignment used by the
 * nationwide batches; direct source-name lookup is only allowed elsewhere.
 */
let connecticutDirectIndexPromise: Promise<UsaleepTractIndex> | null = null;

async function fetchConnecticutDirectIndex(): Promise<UsaleepTractIndex> {
  if (!connecticutDirectIndexPromise) {
    console.info(
      "[usaleep] Loading the aligned USALEEP index for a Connecticut direct lookup.",
    );
    const pending = fetchAllUsaleepTracts();
    connecticutDirectIndexPromise = pending;
    void pending.catch(() => {
      if (connecticutDirectIndexPromise === pending) {
        connecticutDirectIndexPromise = null;
      }
    });
  }
  return connecticutDirectIndexPromise;
}

export async function fetchUsaleepTractsForCounty(
  county: UsaleepCounty,
  options: UsaleepCountyLookupOptions = {},
): Promise<UsaleepTractRow[]> {
  if (county.stateAbbrev === "CT") {
    return resolveUsaleepTractsForCounty(
      await (options.loadConnecticutAlignedIndex?.() ?? fetchConnecticutDirectIndex()),
      county,
    );
  }

  const countyName = `${county.countyName}, ${county.stateAbbrev}`;
  const url = `${USALEEP_URL}?county_name=${encodeURIComponent(countyName)}&$limit=5000`;
  const rows = await fetchJson(url);
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r.full_ct_num && r.le)
    .map((r) => ({
      tractFips: String(r.full_ct_num),
      lifeExpectancy: parseFloat(r.le),
      standardError: parseFloat(r.se_le ?? "0") || 0,
    }))
    .filter((r) => Number.isFinite(r.lifeExpectancy));
}

/**
 * Bulk-fetch ALL USALEEP tract rows in 2 paginated Socrata calls
 * (73,121 total rows across 50k + 23k pages), then group them by
 * county_name in memory. This turns ~3,143 sequential county lookups
 * into 2 HTTP calls total.
 *
 * Strategy chosen: bulk-pull-then-group-locally.
 * - The dataset is 73k rows, small enough to hold in memory.
 * - Eliminates ~3,141 extra HTTP calls versus per-county fetches.
 * - 2 large requests are significantly faster and kinder to the CDC
 *   Socrata endpoint than a concurrent pool of 3,143 requests.
 *
 * Returns source-native county rows plus FIPS-aligned county-equivalent rows.
 * State-aggregate rows (county_name === "(blank)") are excluded. Connecticut
 * Planning Regions are resolved from three official Census relationship files,
 * not by matching their display labels to former county names.
 */
export async function fetchAllUsaleepTracts(): Promise<UsaleepTractIndex> {
  const PAGE_SIZE = 50000;

  async function fetchPage(offset: number): Promise<any[]> {
    const url = `${USALEEP_URL}?$limit=${PAGE_SIZE}&$offset=${offset}&$select=full_ct_num,le,se_le,county_name`;
    return fetchJson(url);
  }

  // Fetch both pages concurrently (safe since they're disjoint offsets)
  const [page1, page2] = await Promise.all([
    fetchPage(0),
    fetchPage(PAGE_SIZE),
  ]);

  const allRows = [...page1, ...page2];

  const bySourceCountyName = new Map<string, UsaleepTractRow[]>();
  for (const r of allRows) {
    const cname: string = r.county_name ?? "";
    // Skip state-aggregate rows and any row without a county name
    if (!cname || cname === "(blank)" || !r.full_ct_num || !r.le) continue;
    const le = parseFloat(r.le);
    if (!Number.isFinite(le)) continue;
    const tract: UsaleepTractRow = {
      tractFips: String(r.full_ct_num),
      lifeExpectancy: le,
      standardError: parseFloat(r.se_le ?? "0") || 0,
    };
    const existing = bySourceCountyName.get(cname);
    if (existing) {
      existing.push(tract);
    } else {
      bySourceCountyName.set(cname, [tract]);
    }
  }

  try {
    const [countyToCountySubdivision, countySubdivisionToTract, tract2020To2010] =
      await Promise.all([
        fetchText(CONNECTICUT_COUNTY_TO_COUSUB_CROSSWALK_URL),
        fetchText(CONNECTICUT_COUSUB_TO_TRACT_CROSSWALK_URL),
        fetchText(CONNECTICUT_TRACT_2020_TO_2010_CROSSWALK_URL),
      ]);

    const alignment = alignConnecticutUsaleepTracts(bySourceCountyName, {
      countyToCountySubdivision,
      countySubdivisionToTract,
      tract2020To2010,
    });
    const missingPlanningRegions = CONNECTICUT_PLANNING_REGION_FIPS.filter(
      (fips) => !alignment.byPlanningRegionFips.has(fips),
    );

    console.info(
      `[usaleep] Connecticut FIPS alignment resolved ${alignment.report.resolvedSourceTracts}/` +
        `${alignment.report.sourceTracts} legacy source tracts across ` +
        `${alignment.report.planningRegionsWithResolvedTracts.length}/9 Planning Regions; ` +
        `${alignment.report.boundarySpanningSourceTracts} boundary-spanning and ` +
        `${alignment.report.invalidSourceTracts} malformed-identifier tracts excluded.`,
    );
    if (missingPlanningRegions.length > 0) {
      console.error(
        `[usaleep] Connecticut alignment has no resolved source tract for Planning Region FIPS: ` +
          `${missingPlanningRegions.join(", ")}.`,
      );
    }

    return {
      bySourceCountyName,
      byCountyFips: alignment.byPlanningRegionFips,
      connecticutAlignment: { status: "resolved", report: alignment.report },
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `[usaleep] Connecticut Census geography alignment unavailable; Planning Regions will ` +
        `remain source-unavailable rather than receiving a legacy-county proxy: ${reason}`,
    );
    return {
      bySourceCountyName,
      byCountyFips: new Map(),
      connecticutAlignment: { status: "unavailable", reason },
    };
  }
}

/**
 * Fetch the state-level aggregate life-expectancy row. USALEEP publishes
 * this directly (`county_name:"(blank)"`) rather than requiring the caller
 * to average county rows itself.
 */
export async function fetchUsaleepStateLifeExpectancy(
  stateName: string,
): Promise<number | null> {
  const url = `${USALEEP_URL}?state_name=${encodeURIComponent(stateName)}&county_name=${encodeURIComponent("(blank)")}`;
  const rows = await fetchJson(url);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const le = parseFloat(rows[0].le);
  return Number.isFinite(le) ? le : null;
}
