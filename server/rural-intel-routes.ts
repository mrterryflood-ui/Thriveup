import type { Express } from "express";
import { generateAIJSON } from "./ai-provider";

const NASS_KEY = process.env.USDA_NASS_API_KEY || "DEMO_KEY";
const CENSUS_KEY = process.env.CENSUS_API_KEY || "";

// USDA NASS QuickStats query helper
async function nassQuery(params: Record<string, string>): Promise<any[]> {
  const base = "https://quickstats.nass.usda.gov/api/";
  const qs = new URLSearchParams({ key: NASS_KEY, format: "json", ...params }).toString();
  try {
    const res = await fetch(`${base}?${qs}`, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch { return []; }
}

// Census ACS rural-specific variables for a county
async function fetchRuralCensusVars(stateFips: string, countyFips: string): Promise<Record<string, number>> {
  // B01001_001E=total pop, B08302=travel to work, B24121=agriculture employment,
  // B17021_001E=poverty universe, B17021_002E=below poverty
  // B25002_001E=total housing, B25002_003E=vacant housing
  // B08141_001E=workers 16+, B24121_002E=agriculture/forestry/fishing workers
  const vars = [
    "B01001_001E", // total population
    "B17021_002E", // persons below poverty
    "B17021_001E", // poverty universe
    "B25002_001E", // total housing units
    "B25002_003E", // vacant housing units
    "B19013_001E", // median household income
    "B08101_001E", // workers 16+
    "B24121_002E", // ag/forestry/fishing workers (if available)
    "B27010_001E", // health insurance universe
    "B27010_033E", // no health insurance
  ].join(",");
  const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${vars}&for=county:${countyFips}&in=state:${stateFips}&key=${CENSUS_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return {};
    const rows = await res.json();
    const headers: string[] = rows[0];
    const values: string[] = rows[1];
    const out: Record<string, number> = {};
    headers.forEach((h, i) => { out[h] = parseFloat(values[i]) || 0; });
    return out;
  } catch { return {}; }
}

// USDA NRCS soil health via SDM tabular service
async function fetchSoilHealth(stateFips: string, countyFips: string): Promise<{
  avgOm: number | null; avgPh: number | null; avgSandPct: number | null;
  avgClayPct: number | null; drainageClass: string | null;
} | null> {
  // Use SSURGO query via SDM tabular REST
  const stateAbbr2Fips: Record<string, string> = {
    "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
    "11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA",
    "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN",
    "28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM",
    "36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
    "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA",
    "54":"WV","55":"WI","56":"WY"
  };
  const stateAbbr = stateAbbr2Fips[stateFips] || "";
  const areasymbol = `${stateAbbr}${countyFips.padStart(3, "0")}`;
  const query = `SELECT TOP 1 ch.om_h, ch.ph1to1h2o_h, ch.sandtotal_h, ch.claytotal_h, c.drainagecl
    FROM chorizon ch
    JOIN component c ON ch.cokey = c.cokey
    JOIN mapunit mu ON c.mukey = mu.mukey
    JOIN legend l ON mu.lkey = l.lkey
    WHERE l.areasymbol = '${areasymbol}' AND c.majcompflag = 'Yes'
    ORDER BY c.comppct_r DESC`;
  try {
    const res = await fetch("https://SDMDataAccess.nrcs.usda.gov/Tabular/post.rest", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `query=${encodeURIComponent(query)}&format=JSON`,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const row = data?.Table?.[0];
    if (!row) return null;
    return {
      avgOm: parseFloat(row[0]) || null,
      avgPh: parseFloat(row[1]) || null,
      avgSandPct: parseFloat(row[2]) || null,
      avgClayPct: parseFloat(row[3]) || null,
      drainageClass: row[4] || null,
    };
  } catch { return null; }
}

// iNaturalist invasive species count for a county bounding box
async function fetchInvasiveCount(lat: number, lng: number): Promise<number> {
  const url = `https://api.inaturalist.org/v1/observations?introduced=true&quality_grade=research&lat=${lat}&lng=${lng}&radius=50&per_page=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.total_results || 0;
  } catch { return 0; }
}

// County centroid lookup (approximate, from Census geocoder concept)
const COUNTY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "48453": { lat: 30.33, lng: -97.77 }, // Travis TX
  "17031": { lat: 41.84, lng: -87.82 }, // Cook IL
  "13009": { lat: 34.09, lng: -83.71 }, // Barrow GA
  "04013": { lat: 33.53, lng: -112.29 }, // Maricopa AZ
};

function getApproxCentroid(stateFips: string, countyFips: string): { lat: number; lng: number } {
  const key = `${stateFips}${countyFips}`;
  if (COUNTY_CENTROIDS[key]) return COUNTY_CENTROIDS[key];
  // Very rough centroid by state
  const STATE_CENTERS: Record<string, { lat: number; lng: number }> = {
    "48": { lat: 31.5, lng: -99.3 }, "17": { lat: 40.6, lng: -89.2 },
    "06": { lat: 37.0, lng: -120.5 }, "36": { lat: 42.9, lng: -75.5 },
    "12": { lat: 28.6, lng: -82.4 }, "13": { lat: 32.7, lng: -83.6 },
    "04": { lat: 34.2, lng: -111.7 }, "01": { lat: 32.8, lng: -86.8 },
  };
  return STATE_CENTERS[stateFips] || { lat: 38.5, lng: -97.5 };
}

export function registerRuralIntelRoutes(app: Express) {

  // Full rural intelligence profile for a county
  app.get("/api/rural-intel/county", async (req, res) => {
    const { stateFips, countyFips, county } = req.query as Record<string, string>;
    if (!stateFips || !countyFips) {
      return res.status(400).json({ error: "stateFips and countyFips required" });
    }

    const centroid = getApproxCentroid(stateFips, countyFips);

    // Fire all data sources in parallel
    const [
      censusVars,
      soilHealth,
      invasiveCount,
      nassGrains,
      nassLivestock,
      nassVegetables,
    ] = await Promise.all([
      fetchRuralCensusVars(stateFips, countyFips),
      fetchSoilHealth(stateFips, countyFips),
      fetchInvasiveCount(centroid.lat, centroid.lng),
      nassQuery({ agg_level_desc: "COUNTY", state_fips_code: stateFips, county_code: countyFips.padStart(3,"0"), year: "2022", group_desc: "FIELD CROPS", statisticcat_desc: "AREA HARVESTED" }),
      nassQuery({ agg_level_desc: "COUNTY", state_fips_code: stateFips, county_code: countyFips.padStart(3,"0"), year: "2022", sector_desc: "ANIMALS & PRODUCTS", statisticcat_desc: "INVENTORY" }),
      nassQuery({ agg_level_desc: "COUNTY", state_fips_code: stateFips, county_code: countyFips.padStart(3,"0"), year: "2022", group_desc: "VEGETABLES", statisticcat_desc: "AREA HARVESTED" }),
    ]);

    // Process NASS data
    const cropMix = nassGrains.slice(0, 8).map(r => ({
      commodity: r.commodity_desc,
      acresHarvested: parseInt(r.Value?.replace(/,/g, "") || "0"),
      unit: r.unit_desc,
      statisticCat: r.statisticcat_desc,
    })).filter(c => c.acresHarvested > 0);

    const livestockInventory = nassLivestock.slice(0, 5).map(r => ({
      commodity: r.commodity_desc,
      count: parseInt(r.Value?.replace(/,/g, "") || "0"),
      unit: r.unit_desc,
    })).filter(l => l.count > 0);

    const vegMix = nassVegetables.slice(0, 5).map(r => ({
      commodity: r.commodity_desc,
      acresHarvested: parseInt(r.Value?.replace(/,/g, "") || "0"),
    })).filter(v => v.acresHarvested > 0);

    // Census derived metrics
    const totalPop = censusVars["B01001_001E"] || 0;
    const povertyPop = censusVars["B17021_002E"] || 0;
    const povertyUniverse = censusVars["B17021_001E"] || 1;
    const povertyRate = povertyUniverse > 0 ? (povertyPop / povertyUniverse) * 100 : 0;
    const medianIncome = censusVars["B19013_001E"] || 0;
    const agWorkers = censusVars["B24121_002E"] || 0;
    const totalWorkers = censusVars["B08101_001E"] || 1;
    const agEmploymentShare = totalWorkers > 0 ? (agWorkers / totalWorkers) * 100 : 0;
    const noHealthInsurance = censusVars["B27010_033E"] || 0;
    const insuranceUniverse = censusVars["B27010_001E"] || 1;
    const uninsuredRate = insuranceUniverse > 0 ? (noHealthInsurance / insuranceUniverse) * 100 : 0;
    const totalHousing = censusVars["B25002_001E"] || 0;
    const vacantHousing = censusVars["B25002_003E"] || 0;
    const vacancyRate = totalHousing > 0 ? (vacantHousing / totalHousing) * 100 : 0;

    // AI synthesis
    const hasData = cropMix.length > 0 || livestockInventory.length > 0;
    let aiSynthesis = "";
    if (hasData) {
      try {
        const prompt = `You are an agricultural intelligence analyst using U.S. Census ACS 2022 + USDA NASS 2022 data for ${county || `FIPS ${stateFips}${countyFips}`}.

Census data: Population=${totalPop.toLocaleString()}, Poverty rate=${povertyRate.toFixed(1)}%, Median household income=$${medianIncome.toLocaleString()}, Ag employment share=${agEmploymentShare.toFixed(1)}%, Uninsured rate=${uninsuredRate.toFixed(1)}%, Housing vacancy=${vacancyRate.toFixed(1)}%

USDA NASS crops (area harvested 2022): ${cropMix.map(c => `${c.commodity}: ${c.acresHarvested.toLocaleString()} acres`).join(", ") || "No crop data returned"}

Livestock: ${livestockInventory.map(l => `${l.commodity}: ${l.count.toLocaleString()} head`).join(", ") || "No livestock data returned"}

Invasive species observations within 50 miles: ${invasiveCount} (iNaturalist research-grade)

Soil health: ${soilHealth ? `OM=${soilHealth.avgOm}%, pH=${soilHealth.avgPh}, drainage=${soilHealth.drainageClass}` : "NRCS data unavailable"}

Write a 3-paragraph agricultural intelligence summary (plain language, no jargon) that: (1) describes this county's agricultural character and primary commodities, (2) identifies the 2-3 biggest USDA program opportunities (FSA, NRCS, RD) given the crop mix and socioeconomic indicators, (3) flags the most pressing risks (invasive species pressure, soil health gaps, rural poverty impact on farm labor). Be specific to this county's actual numbers. Never fabricate data.`;
        const result = await generateAIJSON(prompt, "{}");
        aiSynthesis = typeof result === "string" ? result : JSON.stringify(result);
      } catch { aiSynthesis = ""; }
    }

    res.json({
      county: county || `${stateFips}-${countyFips}`,
      stateFips,
      countyFips,
      dataYear: 2022,
      dataSources: ["U.S. Census ACS 2022 5-Year Estimates", "USDA NASS QuickStats 2022", "USDA NRCS SSURGO", "iNaturalist research-grade observations"],
      demographics: {
        totalPopulation: totalPop,
        povertyRate: Math.round(povertyRate * 10) / 10,
        medianHouseholdIncome: medianIncome,
        agWorkersCount: agWorkers,
        agEmploymentSharePct: Math.round(agEmploymentShare * 10) / 10,
        uninsuredRatePct: Math.round(uninsuredRate * 10) / 10,
        housingVacancyPct: Math.round(vacancyRate * 10) / 10,
      },
      agriculture: {
        cropMix,
        livestockInventory,
        vegetables: vegMix,
        totalCropAcres: cropMix.reduce((s, c) => s + c.acresHarvested, 0),
        nassDataYear: 2022,
        nassNote: nassGrains.length === 0 ? "NASS did not return data for this county — check county at quickstats.nass.usda.gov" : null,
      },
      soilHealth: soilHealth || { avgOm: null, avgPh: null, avgSandPct: null, avgClayPct: null, drainageClass: null, note: "NRCS query returned no data — verify via websoilsurvey.nrcs.usda.gov" },
      environment: {
        invasiveSpeciesObservations: invasiveCount,
        invasiveNote: "iNaturalist research-grade observations within 50-mile radius",
        inatBrowseUrl: `https://www.inaturalist.org/observations?introduced=true&quality_grade=research&lat=${centroid.lat}&lng=${centroid.lng}&radius=50`,
      },
      aiSynthesis: aiSynthesis || null,
    });
  });

  // Commodity price history (NASS prices received)
  app.get("/api/rural-intel/prices", async (req, res) => {
    const { commodity, stateFips } = req.query as Record<string, string>;
    if (!commodity) return res.status(400).json({ error: "commodity required" });

    const rows = await nassQuery({
      commodity_desc: commodity.toUpperCase(),
      statisticcat_desc: "PRICE RECEIVED",
      agg_level_desc: stateFips ? "STATE" : "NATIONAL",
      ...(stateFips ? { state_fips_code: stateFips } : {}),
      year__GE: "2018",
      freq_desc: "ANNUAL",
    });

    const prices = rows.map(r => ({
      year: parseInt(r.year),
      price: parseFloat(r.Value?.replace(/,/g, "") || "0"),
      unit: r.unit_desc,
      stateFips: r.state_fips_code,
    })).filter(p => p.price > 0).sort((a, b) => a.year - b.year);

    res.json({ commodity, prices, source: "USDA NASS QuickStats — Prices Received" });
  });

  // County ag summary (lightweight — for map overlays)
  app.get("/api/rural-intel/county-summary", async (req, res) => {
    const { stateFips, countyFips } = req.query as Record<string, string>;
    if (!stateFips || !countyFips) return res.status(400).json({ error: "stateFips + countyFips required" });
    const [grains, livestock] = await Promise.all([
      nassQuery({ agg_level_desc: "COUNTY", state_fips_code: stateFips, county_code: countyFips.padStart(3,"0"), year: "2022", statisticcat_desc: "AREA HARVESTED", group_desc: "FIELD CROPS" }),
      nassQuery({ agg_level_desc: "COUNTY", state_fips_code: stateFips, county_code: countyFips.padStart(3,"0"), year: "2022", statisticcat_desc: "INVENTORY", sector_desc: "ANIMALS & PRODUCTS" }),
    ]);
    const topCrop = grains.sort((a, b) => parseInt(b.Value?.replace(/,/g,"") || "0") - parseInt(a.Value?.replace(/,/g,"") || "0"))[0];
    const topLivestock = livestock[0];
    res.json({
      stateFips, countyFips,
      topCrop: topCrop ? { name: topCrop.commodity_desc, acres: parseInt(topCrop.Value?.replace(/,/g,"") || "0") } : null,
      topLivestock: topLivestock ? { name: topLivestock.commodity_desc, count: parseInt(topLivestock.Value?.replace(/,/g,"") || "0") } : null,
      source: "USDA NASS 2022",
    });
  });
}
