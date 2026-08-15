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

const USALEEP_URL = "https://data.cdc.gov/resource/5h56-n989.json";

export interface UsaleepTractRow {
  tractFips: string; // full_ct_num, county-relative — combine with county FIPS by caller
  lifeExpectancy: number;
  standardError: number;
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

/**
 * Fetch every tract's life-expectancy point estimate within a named county,
 * e.g. countyName="Autauga County, AL" (must match USALEEP's own
 * `county_name` formatting exactly — verified against a live sample this
 * session).
 */
export async function fetchUsaleepTractsForCounty(
  countyName: string,
): Promise<UsaleepTractRow[]> {
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
