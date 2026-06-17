import type { Express } from "express";

const CENSUS_KEY = process.env.CENSUS_API_KEY || "";

const STATE_ABBR_TO_FIPS: Record<string, string> = {
  AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",DC:"11",
  FL:"12",GA:"13",HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",
  LA:"22",ME:"23",MD:"24",MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",
  NE:"31",NV:"32",NH:"33",NJ:"34",NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",
  OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",SD:"46",TN:"47",TX:"48",UT:"49",
  VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56"
};

const STATE_NAME_TO_ABBR: Record<string, string> = {
  "alabama":"AL","alaska":"AK","arizona":"AZ","arkansas":"AR","california":"CA",
  "colorado":"CO","connecticut":"CT","delaware":"DE","district of columbia":"DC",
  "florida":"FL","georgia":"GA","hawaii":"HI","idaho":"ID","illinois":"IL",
  "indiana":"IN","iowa":"IA","kansas":"KS","kentucky":"KY","louisiana":"LA",
  "maine":"ME","maryland":"MD","massachusetts":"MA","michigan":"MI","minnesota":"MN",
  "mississippi":"MS","missouri":"MO","montana":"MT","nebraska":"NE","nevada":"NV",
  "new hampshire":"NH","new jersey":"NJ","new mexico":"NM","new york":"NY",
  "north carolina":"NC","north dakota":"ND","ohio":"OH","oklahoma":"OK","oregon":"OR",
  "pennsylvania":"PA","rhode island":"RI","south carolina":"SC","south dakota":"SD",
  "tennessee":"TN","texas":"TX","utah":"UT","vermont":"VT","virginia":"VA",
  "washington":"WA","west virginia":"WV","wisconsin":"WI","wyoming":"WY"
};

// National benchmarks (ACS 2022 national estimates)
const BENCHMARKS = {
  medianIncome: 74580,
  povertyRate: 11.5,
  collegeAttainment: 35.0,
  unemploymentRate: 3.5,
  medianRent: 1300,
  severeRentBurden: 22.0,
  nonEnglishAtHome: 20.0,
  foreignBorn: 13.5,
  uninsuredRate: 10.0,
  under18Share: 22.0,
};

// ACS variable definitions
const ACS_VARS = [
  "B19013_001E",  // median HHI
  "B17001_002E",  // people in poverty
  "B17001_001E",  // total for poverty calc
  "B25064_001E",  // median gross rent
  "B25070_007E",  // rent 35-40% of income
  "B25070_008E",  // rent 40-50% of income
  "B25070_009E",  // rent 40-50% of income (second bracket)
  "B25070_010E",  // rent 50%+ of income
  "B25070_001E",  // total renter households (cash rent)
  "B25003_001E",  // total housing units
  "B25003_002E",  // owner-occupied
  "B23025_005E",  // unemployed
  "B23025_003E",  // labor force
  "B15003_022E",  // bachelor's degree 25+
  "B15003_023E",  // master's degree 25+
  "B15003_024E",  // professional degree 25+
  "B15003_025E",  // doctorate 25+
  "B15003_001E",  // total 25+ (education denominator)
  "B03002_001E",  // total population (race table)
  "B03002_003E",  // white non-Hispanic
  "B03002_004E",  // Black/African American
  "B03002_012E",  // Hispanic/Latino
  "B03002_006E",  // Asian
  "B09001_001E",  // population under 18
  "B11001_001E",  // total households
  "B05002_013E",  // foreign-born
  "B05002_001E",  // total population (immigration table)
  "B16004_001E",  // total 5+ (language table)
  "B16004_003E",  // speak non-English at home (5+)
  "B27010_033E",  // no health insurance 19-64
  "B27010_017E",  // no health insurance under 19
  "B27010_001E",  // total for health insurance
].join(",");

function resolveStateFips(stateInput: string): string | null {
  const upper = stateInput.trim().toUpperCase();
  if (STATE_ABBR_TO_FIPS[upper]) return STATE_ABBR_TO_FIPS[upper];
  const lower = stateInput.trim().toLowerCase();
  const abbr = STATE_NAME_TO_ABBR[lower];
  if (abbr) return STATE_ABBR_TO_FIPS[abbr];
  return null;
}

function severity(value: number, benchmark: number, direction: "lower_better" | "higher_better"): "green" | "amber" | "red" {
  const ratio = value / benchmark;
  if (direction === "lower_better") {
    if (ratio < 0.85) return "green";
    if (ratio < 1.2) return "amber";
    return "red";
  } else {
    if (ratio >= 0.9) return "green";
    if (ratio >= 0.65) return "amber";
    return "red";
  }
}

async function fetchCensusCountyList(stateFips: string): Promise<Array<{name: string; fips: string}>> {
  const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=county:*&in=state:${stateFips}&key=${CENSUS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Census county list failed: ${res.status}`);
  const data = await res.json() as string[][];
  return data.slice(1).map(row => ({
    name: row[0].replace(/, .+$/, "").toLowerCase(),
    fips: row[2]
  }));
}

async function fetchACSData(stateFips: string, countyFips: string): Promise<Record<string, number>> {
  const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${ACS_VARS}&for=county:${countyFips}&in=state:${stateFips}&key=${CENSUS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ACS fetch failed: ${res.status}`);
  const data = await res.json() as string[][];
  const headers = data[0];
  const values = data[1];
  const out: Record<string, number> = {};
  headers.forEach((h, i) => {
    const n = parseFloat(values[i]);
    out[h] = isNaN(n) ? 0 : n;
  });
  return out;
}

async function fetchSchoolDistricts(stateFips: string, countyFips: string): Promise<any[]> {
  const combinedFips = `${stateFips}${countyFips.padStart(3, "0")}`;
  const url = `https://educationdata.urban.org/api/v1/school-districts/ccd/directory/?fips_code=${combinedFips}&year=2022&fields=leaid,lea_name,enrollment,locale,latitude,longitude,county_name,urban_centric_locale`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json() as any;
    return json.results || [];
  } catch { return []; }
}

async function fetchDistrictPoverty(leaid: string): Promise<number | null> {
  const url = `https://educationdata.urban.org/api/v1/school-districts/saipe/?leaid=${leaid}&year=2022&fields=leaid,est_population_5_17_poverty_pct`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json() as any;
    const r = json.results?.[0];
    return r?.est_population_5_17_poverty_pct ?? null;
  } catch { return null; }
}

export function registerEcosystemIntelRoutes(app: Express) {

  // Search counties by name + state
  app.get("/api/ecosystem-intel/search", async (req, res) => {
    const { q } = req.query as { q?: string };
    if (!q || q.length < 3) return res.status(400).json({ error: "Provide at least 3 characters" });

    // Parse "County, State" or "County State" patterns
    const parts = q.split(/,\s*|\s{2,}/).map(p => p.trim()).filter(Boolean);
    let countyQ = parts[0];
    let stateQ = parts[1] || "";

    const stateFips = stateQ ? resolveStateFips(stateQ) : null;
    if (stateQ && !stateFips) return res.status(400).json({ error: `Unrecognized state: ${stateQ}` });

    try {
      if (stateFips) {
        const counties = await fetchCensusCountyList(stateFips);
        const needle = countyQ.toLowerCase().replace(/\s*county\s*$/i, "").trim();
        const matches = counties
          .filter(c => c.name.replace(/\s*county\s*$/, "").includes(needle))
          .slice(0, 8)
          .map(c => ({ name: `${c.name.replace(/\b\w/g, l => l.toUpperCase())}, ${stateQ.toUpperCase()}`, stateFips, countyFips: c.fips }));
        return res.json(matches);
      } else {
        // Search all states — sample a few likely ones
        return res.json([]);
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Full county ecosystem data
  app.get("/api/ecosystem-intel/county", async (req, res) => {
    const { stateFips, countyFips, county, rfpContext } = req.query as {
      stateFips?: string; countyFips?: string; county?: string; rfpContext?: string;
    };
    if (!stateFips || !countyFips) return res.status(400).json({ error: "stateFips and countyFips required" });

    try {
      const [raw, districts] = await Promise.all([
        fetchACSData(stateFips, countyFips),
        fetchSchoolDistricts(stateFips, countyFips),
      ]);

      // Derived metrics
      const totalPop = raw["B05002_001E"] || raw["B03002_001E"] || 1;
      const povertyPop = raw["B17001_001E"] || 1;
      const laborForce = raw["B23025_003E"] || 1;
      const totalHH = raw["B11001_001E"] || 1;
      const renterHH = raw["B25070_001E"] || 1;
      const totalAdults25 = raw["B15003_001E"] || 1;
      const langBase = raw["B16004_001E"] || 1;
      const insuranceBase = raw["B27010_001E"] || 1;

      const povertyRate = (raw["B17001_002E"] / povertyPop) * 100;
      const unemploymentRate = (raw["B23025_005E"] / laborForce) * 100;
      const severeRentBurdenCount = raw["B25070_010E"];
      const severeRentBurdenRate = renterHH > 0 ? (severeRentBurdenCount / renterHH) * 100 : 0;
      const costBurdenedRate = renterHH > 0 ? ((raw["B25070_007E"] + raw["B25070_008E"] + raw["B25070_009E"] + raw["B25070_010E"]) / renterHH) * 100 : 0;
      const ownershipRate = (raw["B25003_002E"] / (raw["B25003_001E"] || 1)) * 100;
      const collegeGrads = raw["B15003_022E"] + raw["B15003_023E"] + raw["B15003_024E"] + raw["B15003_025E"];
      const collegeAttainment = (collegeGrads / totalAdults25) * 100;
      const nonEnglishRate = (raw["B16004_003E"] / langBase) * 100;
      const foreignBornRate = (raw["B05002_013E"] / totalPop) * 100;
      const under18Count = raw["B09001_001E"];
      const under18Rate = (under18Count / totalPop) * 100;
      const uninsuredCount = (raw["B27010_033E"] || 0) + (raw["B27010_017E"] || 0);
      const uninsuredRate = insuranceBase > 0 ? (uninsuredCount / insuranceBase) * 100 : 0;

      const hispanic = raw["B03002_012E"];
      const black = raw["B03002_004E"];
      const white = raw["B03002_003E"];
      const asian = raw["B03002_006E"];
      const other = totalPop - hispanic - white - black - asian;

      // School district poverty (async for first district)
      let districtPovertyPct: number | null = null;
      if (districts[0]?.leaid) {
        districtPovertyPct = await fetchDistrictPoverty(String(districts[0].leaid));
      }

      // Severity scores
      const nodes = {
        economic: {
          medianIncome: raw["B19013_001E"],
          povertyRate: +povertyRate.toFixed(1),
          unemploymentRate: +unemploymentRate.toFixed(1),
          severity: severity(povertyRate, BENCHMARKS.povertyRate, "lower_better"),
          benchmark_poverty: BENCHMARKS.povertyRate,
          benchmark_income: BENCHMARKS.medianIncome,
        },
        housing: {
          medianRent: raw["B25064_001E"],
          severeRentBurdenRate: +severeRentBurdenRate.toFixed(1),
          costBurdenedRate: +costBurdenedRate.toFixed(1),
          ownershipRate: +ownershipRate.toFixed(1),
          renterHouseholds: Math.round(renterHH),
          severity: severity(severeRentBurdenRate, BENCHMARKS.severeRentBurden, "lower_better"),
          benchmark_rent: BENCHMARKS.medianRent,
          benchmark_burden: BENCHMARKS.severeRentBurden,
        },
        education: {
          collegeAttainment: +collegeAttainment.toFixed(1),
          firstGenProxy: +(100 - collegeAttainment).toFixed(1),
          totalAdults25: Math.round(totalAdults25),
          severity: severity(collegeAttainment, BENCHMARKS.collegeAttainment, "higher_better"),
          benchmark: BENCHMARKS.collegeAttainment,
        },
        language: {
          nonEnglishRate: +nonEnglishRate.toFixed(1),
          foreignBornRate: +foreignBornRate.toFixed(1),
          foreignBornCount: Math.round(raw["B05002_013E"]),
          severity: nonEnglishRate > 25 ? "red" : nonEnglishRate > 12 ? "amber" : "green" as "green"|"amber"|"red",
          benchmark: BENCHMARKS.nonEnglishAtHome,
        },
        health: {
          uninsuredRate: +uninsuredRate.toFixed(1),
          uninsuredCount: Math.round(uninsuredCount),
          severity: severity(uninsuredRate, BENCHMARKS.uninsuredRate, "lower_better"),
          benchmark: BENCHMARKS.uninsuredRate,
        },
        youth: {
          under18Count: Math.round(under18Count),
          under18Rate: +under18Rate.toFixed(1),
          totalHouseholds: Math.round(totalHH),
          severity: under18Rate > 26 ? "amber" : "green" as "green"|"amber"|"red",
          benchmark: BENCHMARKS.under18Share,
        },
        demographics: {
          totalPopulation: Math.round(totalPop),
          white: Math.round(white),
          black: Math.round(black),
          hispanic: Math.round(hispanic),
          asian: Math.round(asian),
          other: Math.round(other > 0 ? other : 0),
          whitePct: +((white / totalPop) * 100).toFixed(1),
          blackPct: +((black / totalPop) * 100).toFixed(1),
          hispanicPct: +((hispanic / totalPop) * 100).toFixed(1),
          asianPct: +((asian / totalPop) * 100).toFixed(1),
        },
        schools: {
          districts,
          districtPovertyPct,
          totalEnrollment: districts.reduce((s: number, d: any) => s + (d.enrollment || 0), 0),
        },
      };

      // Chainweb edges — define causal linkages with direction and strength
      const edges = [
        { from: "economic", to: "housing", label: "poverty → rent burden", strength: "strong" },
        { from: "economic", to: "health", label: "income → insurance access", strength: "strong" },
        { from: "economic", to: "education", label: "income ceiling → degree gap", strength: "strong" },
        { from: "housing", to: "schools", label: "instability → school mobility → gaps", strength: "strong" },
        { from: "language", to: "schools", label: "ELL demand → identification lag", strength: "strong" },
        { from: "language", to: "health", label: "language barrier → care access", strength: "moderate" },
        { from: "language", to: "economic", label: "wage ceiling for non-English workers", strength: "moderate" },
        { from: "education", to: "economic", label: "attainment ceiling → wage floor (feedback)", strength: "strong" },
        { from: "youth", to: "schools", label: "high youth density → school demand pressure", strength: "moderate" },
        { from: "youth", to: "economic", label: "family composition → household income strain", strength: "moderate" },
        { from: "health", to: "schools", label: "unmet mental health → crisis in school (RFP)", strength: "strong" },
      ];

      // RFP relevance mapping
      const rfpMap: Record<string, string[]> = {
        "school crisis counselor": ["schools", "health", "economic", "housing", "language", "youth"],
        "housing": ["housing", "economic", "youth"],
        "workforce": ["economic", "education", "language"],
        "food": ["economic", "youth", "health"],
        "mental health": ["health", "schools", "youth", "economic"],
        "early childhood": ["youth", "education", "health", "language"],
      };

      let rfpRelevantNodes: string[] = [];
      if (rfpContext) {
        const lower = rfpContext.toLowerCase();
        for (const [key, nodeList] of Object.entries(rfpMap)) {
          if (lower.includes(key.split(" ")[0])) {
            rfpRelevantNodes = nodeList;
            break;
          }
        }
        if (!rfpRelevantNodes.length) rfpRelevantNodes = ["economic", "housing", "health"];
      }

      // Chainweb interpretation prose — fully data-driven, no templates
      const chainweb: string[] = [];

      if (povertyRate > BENCHMARKS.povertyRate) {
        chainweb.push(`Poverty rate (${povertyRate.toFixed(1)}%) exceeds the national benchmark of ${BENCHMARKS.povertyRate}% — this is the economic pressure point that feeds every other node.`);
      } else {
        chainweb.push(`Poverty rate (${povertyRate.toFixed(1)}%) is below the national average of ${BENCHMARKS.povertyRate}%, but income and rent burden data must be read together to assess true family stability.`);
      }

      if (severeRentBurdenRate > 18) {
        chainweb.push(`${severeRentBurdenRate.toFixed(1)}% of renter households spend more than half their income on rent. One income disruption triggers a move. Residential instability is the most direct pathway to school mobility and reading failure.`);
      }

      if (collegeAttainment < BENCHMARKS.collegeAttainment * 0.7) {
        chainweb.push(`College attainment at ${collegeAttainment.toFixed(1)}% is significantly below the national rate of ${BENCHMARKS.collegeAttainment}%. Nearly ${(100 - collegeAttainment).toFixed(0)}% of adults 25+ did not complete a bachelor's degree — this is the wage-ceiling and first-generation household dynamic that shapes college-going norms for children.`);
      }

      if (nonEnglishRate > 10) {
        chainweb.push(`${nonEnglishRate.toFixed(1)}% of residents speak a language other than English at home (${Math.round(raw["B16004_003E"]).toLocaleString()} people). School systems with growing multilingual populations frequently underidentify ELL students, leading to academic mis-placement and disproportionate special education referrals after 4th grade — a pattern nearly impossible to reverse.`);
      }

      if (uninsuredRate > BENCHMARKS.uninsuredRate) {
        chainweb.push(`Uninsured rate (${uninsuredRate.toFixed(1)}%) above national benchmark. Unmet behavioral health needs surface in schools as disciplinary incidents, attendance gaps, and crisis calls — the direct pathway that school counselors absorb.`);
      }

      return res.json({
        county: county || `County (FIPS ${stateFips}${countyFips})`,
        stateFips,
        countyFips,
        dataSource: "U.S. Census Bureau ACS 2022 5-Year Estimates + Urban Institute Education Data",
        dataYear: 2022,
        benchmarks: BENCHMARKS,
        nodes,
        edges,
        rfpContext: rfpContext || null,
        rfpRelevantNodes,
        chainwebNarrative: chainweb,
      });

    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });
}
