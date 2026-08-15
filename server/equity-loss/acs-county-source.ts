/**
 * acs-county-source.ts
 *
 * Live county-grain ACS fetch for the equity-loss engine's income and
 * education dimensions, plus a decadal-growth proxy. Reuses the
 * `api.census.gov/data/2022/acs/acs5` endpoint pattern already established
 * in server/community-api-routes.ts and server/benefits-routes.ts.
 */

const CENSUS_ACS_2022 = "https://api.census.gov/data/2022/acs/acs5";
const CENSUS_ACS_2018 = "https://api.census.gov/data/2018/acs/acs5"; // 5-yr window ending 2018, for a decadal-ish growth proxy

// B19001: household income brackets. Midpoints are the standard convention
// for turning Census brackets into a value used in inequality math; the top
// bracket is uncapped in reality, so its midpoint is a stated assumption
// (documented on the returned distribution via the caller's assumptionText).
const INCOME_BRACKETS: { code: string; midpoint: number }[] = [
  { code: "B19001_002E", midpoint: 5000 },
  { code: "B19001_003E", midpoint: 12500 },
  { code: "B19001_004E", midpoint: 17500 },
  { code: "B19001_005E", midpoint: 22500 },
  { code: "B19001_006E", midpoint: 27500 },
  { code: "B19001_007E", midpoint: 32500 },
  { code: "B19001_008E", midpoint: 37500 },
  { code: "B19001_009E", midpoint: 42500 },
  { code: "B19001_010E", midpoint: 47500 },
  { code: "B19001_011E", midpoint: 55000 },
  { code: "B19001_012E", midpoint: 67500 },
  { code: "B19001_013E", midpoint: 87500 },
  { code: "B19001_014E", midpoint: 112500 },
  { code: "B19001_015E", midpoint: 137500 },
  { code: "B19001_016E", midpoint: 175000 },
  { code: "B19001_017E", midpoint: 250000 }, // top bracket ($200k+), midpoint is an assumption
];

// B15003: educational attainment. Mean/expected years of schooling (MYS/EYS)
// per UNDP's own HDI methodology mapping of attainment level -> years.
const EDU_LEVELS: { code: string; years: number }[] = [
  { code: "B15003_002E", years: 0 },   // no schooling
  { code: "B15003_003E", years: 2 },   // nursery
  { code: "B15003_004E", years: 4 },
  { code: "B15003_005E", years: 5 },
  { code: "B15003_006E", years: 6 },
  { code: "B15003_007E", years: 7 },
  { code: "B15003_008E", years: 8 },
  { code: "B15003_009E", years: 9 },
  { code: "B15003_010E", years: 10 },
  { code: "B15003_011E", years: 11 },
  { code: "B15003_012E", years: 12 },  // 12th, no diploma
  { code: "B15003_017E", years: 12 },  // HS diploma
  { code: "B15003_018E", years: 12 },  // GED
  { code: "B15003_019E", years: 13 },  // some college <1yr
  { code: "B15003_020E", years: 14 },  // some college >=1yr
  { code: "B15003_021E", years: 14 },  // associate's
  { code: "B15003_022E", years: 16 },  // bachelor's
  { code: "B15003_023E", years: 18 },  // master's
  { code: "B15003_024E", years: 19 },  // professional
  { code: "B15003_025E", years: 20 },  // doctorate
];

async function censusFetch(url: string): Promise<any[]> {
  // Census now enforces its API key requirement (redirects keyless requests
  // to an HTML error page instead of erroring cleanly) — confirmed this
  // session. CENSUS_API_KEY is already provisioned in this environment and
  // used by the existing ACS call sites in community-api-routes.ts /
  // benefits-routes.ts; reuse it here rather than a second key.
  const key = process.env.CENSUS_API_KEY;
  const finalUrl = key ? `${url}&key=${key}` : url;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15_000);
  try {
    const res = await fetch(finalUrl, { signal: ctl.signal, redirect: "manual" });
    clearTimeout(t);
    if (res.status >= 300 && res.status < 400) {
      throw new Error(`Census ACS redirected (likely missing/invalid API key): ${res.headers.get("location")}`);
    }
    if (!res.ok) throw new Error(`Census ACS HTTP ${res.status}`);
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } finally {
    clearTimeout(t);
  }
}

export interface CountyAcsResult {
  incomeDistribution: { value: number; weight: number }[];
  incomeMoeRatio: number;
  educationDistribution: { mys: number; eys: number; weight: number }[];
  educationMoeRatio: number;
  decadalGrowthPct: number;
  population: number;
}

export async function fetchCountyAcs(
  stateFips: string,
  countyFips: string,
): Promise<CountyAcsResult> {
  return fetchAcsForGeography(
    `county:${countyFips}&in=state:${stateFips}`,
    `county:${countyFips}&in=state:${stateFips}`,
  );
}

export async function fetchStateAcs(stateFips: string): Promise<CountyAcsResult> {
  return fetchAcsForGeography(`state:${stateFips}`, `state:${stateFips}`);
}

export async function fetchNationalAcs(): Promise<CountyAcsResult> {
  return fetchAcsForGeography(`us:1`, `us:1`);
}

async function fetchAcsForGeography(
  forClause: string,
  growthForClause: string,
): Promise<CountyAcsResult> {
  const incomeVars = INCOME_BRACKETS.map((b) => b.code).join(",");
  const incomeMoeVars = INCOME_BRACKETS.map((b) => b.code.replace("E", "M")).join(",");
  const eduVars = EDU_LEVELS.map((e) => e.code).join(",");
  const eduMoeVars = EDU_LEVELS.map((e) => e.code.replace("E", "M")).join(",");

  const incomeUrl = `${CENSUS_ACS_2022}?get=NAME,B01003_001E,${incomeVars},${incomeMoeVars}&for=${forClause}`;
  const eduUrl = `${CENSUS_ACS_2022}?get=B15003_001E,${eduVars},${eduMoeVars}&for=${forClause}`;
  const growthUrl2018 = `${CENSUS_ACS_2018}?get=B01003_001E&for=${growthForClause}`;

  const [incomeRows, eduRows, growthRows] = await Promise.all([
    censusFetch(incomeUrl),
    censusFetch(eduUrl),
    censusFetch(growthUrl2018).catch(() => []), // older vintage occasionally reorganizes county FIPS; growth becomes non-computable, not fatal
  ]);

  if (incomeRows.length < 2 || eduRows.length < 2) {
    throw new Error(`Census ACS returned no data for geography: ${forClause}`);
  }
  const [incomeHeader, incomeRow] = incomeRows;
  const [eduHeader, eduRow] = eduRows;
  const iv = (code: string) => parseFloat(incomeRow[incomeHeader.indexOf(code)]) || 0;
  const ev = (code: string) => parseFloat(eduRow[eduHeader.indexOf(code)]) || 0;

  const population = iv("B01003_001E");

  const incomeDistribution = INCOME_BRACKETS.map((b) => ({
    value: b.midpoint,
    weight: iv(b.code),
  })).filter((d) => d.weight > 0);
  const incomeTotal = incomeDistribution.reduce((a, d) => a + d.weight, 0) || 1;
  const incomeMoeSumSq = INCOME_BRACKETS.reduce((a, b) => a + iv(b.code.replace("E", "M")) ** 2, 0);
  const incomeMoe = Math.sqrt(incomeMoeSumSq);
  const incomeMoeRatio = incomeTotal > 0 ? incomeMoe / incomeTotal : 1;

  const eduTotal = ev("B15003_001E") || 1;
  const educationDistribution = EDU_LEVELS.map((lvl) => ({
    mys: lvl.years,
    eys: lvl.years,
    weight: ev(lvl.code),
  })).filter((d) => d.weight > 0);
  const eduMoeSumSq = EDU_LEVELS.reduce((a, lvl) => a + ev(lvl.code.replace("E", "M")) ** 2, 0);
  const eduMoe = Math.sqrt(eduMoeSumSq);
  const educationMoeRatio = eduTotal > 0 ? eduMoe / eduTotal : 1;

  let decadalGrowthPct = 0;
  if (growthRows.length >= 2) {
    const [gHeader, gRow] = growthRows;
    const pop2018 = parseFloat(gRow[gHeader.indexOf("B01003_001E")]) || 0;
    if (pop2018 > 0) {
      // 2018-vintage 5yr estimate to 2022-vintage 5yr estimate is a ~4-year
      // gap, not a full decade; scaled to a decadal-equivalent rate for
      // comparison against the (disclosed-as-unvalidated) 25% threshold.
      const rawGrowth = (population - pop2018) / pop2018;
      decadalGrowthPct = (rawGrowth / 4) * 10 * 100;
    }
  }

  return {
    incomeDistribution,
    incomeMoeRatio,
    educationDistribution,
    educationMoeRatio,
    decadalGrowthPct,
    population,
  };
}
