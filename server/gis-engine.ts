import { eq, like } from "drizzle-orm";
import { gisContextData } from "@shared/schema";
import type { GisContextData } from "@shared/schema";
import { countyCentroid } from "@shared/nationwide/county-centroids";

const CDC_PLACES_URL = "https://data.cdc.gov/resource/swc5-untb.json";
const CDC_SVI_URL = "https://data.cdc.gov/resource/4d8n-kk8a.json";
// ATSDR SVI 2022 county-level (ArcGIS Feature Service) — used as primary, with Socrata fallback above.
// CDC/ATSDR SVI 2022 — layer 1 is the US county layer (verified 2026-10; the old SVI2022_US_county service returns "Invalid URL").
const ATSDR_SVI_COUNTY_URL = "https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer/1/query";
const FBI_CRIME_URL = "https://api.usa.gov/crime/fbi/sapi/api/estimates/states";
const CENSUS_ACS_URL = "https://api.census.gov/data/2022/acs/acs5";
const SAMHSA_LOCATOR_URL = "https://findtreatment.gov/locator/listing";

const PLACES_MEASURES = ["BPHIGH", "DIABETES", "MHLTH", "OBESITY", "SLEEP", "ACCESS2"];

const STATE_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09",
  DE: "10", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18",
  IA: "19", KS: "20", KY: "21", LA: "22", ME: "23", MD: "24", MA: "25",
  MI: "26", MN: "27", MS: "28", MO: "29", MT: "30", NE: "31", NV: "32",
  NH: "33", NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38", OH: "39",
  OK: "40", OR: "41", PA: "42", RI: "44", SC: "45", SD: "46", TN: "47",
  TX: "48", UT: "49", VT: "50", VA: "51", WA: "53", WV: "54", WI: "55",
  WY: "56", DC: "11"
};

const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.806671, lng: -86.791130 }, AK: { lat: 61.370716, lng: -152.404419 },
  AZ: { lat: 33.729759, lng: -111.431221 }, AR: { lat: 34.969704, lng: -92.373123 },
  CA: { lat: 36.116203, lng: -119.681564 }, CO: { lat: 39.059811, lng: -105.311104 },
  CT: { lat: 41.597782, lng: -72.755371 }, DE: { lat: 39.318523, lng: -75.507141 },
  FL: { lat: 27.766279, lng: -81.686783 }, GA: { lat: 33.040619, lng: -83.643074 },
  HI: { lat: 21.094318, lng: -157.498337 }, ID: { lat: 44.240459, lng: -114.478828 },
  IL: { lat: 40.349457, lng: -88.986137 }, IN: { lat: 39.849426, lng: -86.258278 },
  IA: { lat: 42.011539, lng: -93.210526 }, KS: { lat: 38.526600, lng: -96.726486 },
  KY: { lat: 37.668140, lng: -84.670067 }, LA: { lat: 31.169546, lng: -91.867805 },
  ME: { lat: 44.693947, lng: -69.381927 }, MD: { lat: 39.063946, lng: -76.802101 },
  MA: { lat: 42.230171, lng: -71.530106 }, MI: { lat: 43.326618, lng: -84.536095 },
  MN: { lat: 45.694454, lng: -93.900192 }, MS: { lat: 32.741646, lng: -89.678696 },
  MO: { lat: 38.456085, lng: -92.288368 }, MT: { lat: 46.921925, lng: -110.454353 },
  NE: { lat: 41.125370, lng: -98.268082 }, NV: { lat: 38.313515, lng: -117.055374 },
  NH: { lat: 43.452492, lng: -71.563896 }, NJ: { lat: 40.298904, lng: -74.521011 },
  NM: { lat: 34.840515, lng: -106.248482 }, NY: { lat: 42.165726, lng: -74.948051 },
  NC: { lat: 35.630066, lng: -79.806419 }, ND: { lat: 47.528912, lng: -99.784012 },
  OH: { lat: 40.388783, lng: -82.764915 }, OK: { lat: 35.565342, lng: -96.928917 },
  OR: { lat: 44.572021, lng: -122.070938 }, PA: { lat: 40.590752, lng: -77.209755 },
  RI: { lat: 41.680893, lng: -71.511780 }, SC: { lat: 33.856892, lng: -80.945007 },
  SD: { lat: 44.299782, lng: -99.438828 }, TN: { lat: 35.747845, lng: -86.692345 },
  TX: { lat: 31.054487, lng: -97.563461 }, UT: { lat: 40.150032, lng: -111.862434 },
  VT: { lat: 44.045876, lng: -72.710686 }, VA: { lat: 37.769337, lng: -78.169968 },
  WA: { lat: 47.400902, lng: -121.490494 }, WV: { lat: 38.491226, lng: -80.954453 },
  WI: { lat: 44.268543, lng: -89.616508 }, WY: { lat: 42.755966, lng: -107.302490 },
  DC: { lat: 38.907192, lng: -77.036871 }
};

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia"
};

/** Append a source tag without duplicating it ("census_acs,cdc_svi,census_acs" was accumulating on every refresh). */
function appendSource(existing: string | null | undefined, tag: string): string {
  const parts = (existing ?? "").split(",").map(t => t.trim()).filter(Boolean);
  if (!parts.includes(tag)) parts.push(tag);
  return parts.join(",");
}

async function fetchJson(url: string, opts?: { retries?: number; timeoutMs?: number; init?: RequestInit }): Promise<any> {
  const retries = opts?.retries ?? 3;
  const timeoutMs = opts?.timeoutMs ?? 25000;
  let lastErr: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/json", ...(opts?.init?.headers || {}) },
        signal: ctl.signal,
        ...opts?.init,
      });
      clearTimeout(t);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
      }
      return await response.json();
    } catch (err: any) {
      clearTimeout(t);
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastErr;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function getStateFips(stateAbbr: string): string | undefined {
  return STATE_FIPS[stateAbbr.toUpperCase()];
}

export function getStateCoords(stateAbbr: string): { lat: number; lng: number } | undefined {
  return STATE_COORDS[stateAbbr.toUpperCase()];
}

export function getStateName(stateAbbr: string): string {
  return STATE_NAMES[stateAbbr.toUpperCase()] || stateAbbr;
}

/**
 * County coordinates come from the Census Gazetteer interior point — never an estimate.
 * Before 2026-10-04 this function spread points across the state (Travis County rendered near
 * Arlington); scripts/verify-county-centroids.ts guards against that regressing.
 */
function officialCountyCoords(stateAbbr: string, countyFips: string): { lat: number | null; lng: number | null } {
  const stateFips = STATE_FIPS[stateAbbr.toUpperCase()];
  const c = stateFips ? countyCentroid(countyFips.length === 5 ? countyFips : `${stateFips}${countyFips.padStart(3, "0")}`) : undefined;
  if (c) return { lat: c.lat, lng: c.lon };
  console.warn(`[GIS] No official county interior point for ${stateAbbr} ${countyFips}; coordinates unavailable`);
  return { lat: null, lng: null };
}

export async function ingestCdcPlacesData(
  db: any,
  stateAbbr: string,
  countyFips?: string
): Promise<number> {
  try {
    const measuresFilter = PLACES_MEASURES.map((m) => `'${m}'`).join(",");
    let whereClause = `stateabbr='${stateAbbr.toUpperCase()}' AND measureid IN(${measuresFilter})`;
    if (countyFips) {
      whereClause += ` AND countyfips='${countyFips}'`;
    }

    const url = `${CDC_PLACES_URL}?$where=${encodeURIComponent(whereClause)}&$limit=50000`;
    const data = await fetchJson(url);

    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }

    const tractMap = new Map<string, Map<string, number>>();
    for (const record of data) {
      const locationId = record.locationid || record.locationname;
      if (!locationId) continue;

      const measureId = record.measureid;
      const dataValue = parseFloat(record.data_value);
      if (isNaN(dataValue)) continue;

      if (!tractMap.has(locationId)) {
        tractMap.set(locationId, new Map());
      }
      tractMap.get(locationId)!.set(measureId, dataValue);
    }

    let upsertCount = 0;
    for (const [geographyKey, measures] of Array.from(tractMap.entries())) {
      const values: number[] = [];
      for (const measure of PLACES_MEASURES) {
        const val = measures.get(measure);
        if (val !== undefined) {
          values.push(clamp(val));
        }
      }

      const healthBurdenComposite = values.length > 0
        ? clamp(values.reduce((a, b) => a + b, 0) / values.length)
        : null;

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(gisContextData)
          .set({
            healthBurdenComposite,
            rawPlacesData: Object.fromEntries(measures),
            dataSource: "cdc_places",
            dataYear: new Date().getFullYear(),
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
      } else {
        await db.insert(gisContextData).values({
          geographyKey,
          geographyType: "tract",
          healthBurdenComposite,
          rawPlacesData: Object.fromEntries(measures),
          dataSource: "cdc_places",
          dataYear: new Date().getFullYear(),
        });
      }
      upsertCount++;
    }

    return upsertCount;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting CDC PLACES data:`, error);
    return 0;
  }
}

async function fetchSviAtsdr(stateAbbr: string): Promise<any[]> {
  const stateFips = getStateFips(stateAbbr);
  if (!stateFips) return [];
  const url = `${ATSDR_SVI_COUNTY_URL}?where=${encodeURIComponent(`ST_ABBR='${stateAbbr.toUpperCase()}'`)}&outFields=FIPS,COUNTY,STATE,RPL_THEMES,EP_POV150,EP_UNEMP,EP_NOHSDP&returnGeometry=false&f=json&resultRecordCount=2000`;
  try {
    const data = await fetchJson(url);
    const features = data?.features ?? [];
    return features.map((f: any) => f.attributes ?? f);
  } catch (err) {
    console.log(`[GIS Engine] ATSDR SVI fetch failed for ${stateAbbr}: ${err}`);
    return [];
  }
}

export async function ingestSviData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    // Primary: ATSDR ArcGIS county-level (more reliable than the deprecated Socrata endpoint).
    let data: any[] = await fetchSviAtsdr(stateAbbr);
    if (data.length === 0) {
      // Fallback: legacy CDC Socrata.
      try {
        const whereClause = `st_abbr='${stateAbbr.toUpperCase()}'`;
        const url = `${CDC_SVI_URL}?$where=${encodeURIComponent(whereClause)}&$limit=50000`;
        const fb = await fetchJson(url);
        if (Array.isArray(fb)) data = fb;
      } catch (err) {
        console.log(`[GIS Engine] CDC SVI Socrata fallback also failed for ${stateAbbr}: ${err}`);
      }
    }
    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }

    let upsertCount = 0;
    for (const record of data) {
      const geographyKey = String(record.fips || record.FIPS || "");
      if (!geographyKey) continue;
      const geographyType = geographyKey.length === 5 ? "county" : "tract";

      const rplThemes = parseFloat(record.rpl_themes ?? record.RPL_THEMES);
      const epPov150 = parseFloat(record.ep_pov150 ?? record.EP_POV150);
      const epUnemp = parseFloat(record.ep_unemp ?? record.EP_UNEMP);
      const epNohsdp = parseFloat(record.ep_nohsdp ?? record.EP_NOHSDP);

      const sviPercentile = !isNaN(rplThemes) ? clamp(rplThemes * 100) : null;
      const povertyRate = !isNaN(epPov150) ? clamp(epPov150) : null;
      const unemploymentRate = !isNaN(epUnemp) ? clamp(epUnemp) : null;

      const rawSviData = {
        rpl_themes: rplThemes,
        ep_pov150: epPov150,
        ep_unemp: epUnemp,
        ep_nohsdp: epNohsdp,
      };

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      if (existing.length > 0) {
        // EP_POV150 is the 150%-of-poverty share; never overwrite an ACS B17001 (100%) poverty rate with it.
        await db
          .update(gisContextData)
          .set({
            sviPercentile,
            povertyRate: existing[0].povertyRate ?? povertyRate,
            unemploymentRate,
            rawSviData,
            dataSource: appendSource(existing[0].dataSource, "cdc_svi"),
            dataYear: new Date().getFullYear(),
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
      } else {
        await db.insert(gisContextData).values({
          geographyKey,
          geographyType,
          sviPercentile,
          povertyRate,
          unemploymentRate,
          rawSviData,
          dataSource: "cdc_svi",
          dataYear: new Date().getFullYear(),
        });
      }
      upsertCount++;
    }

    return upsertCount;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting SVI data:`, error);
    return 0;
  }
}

export async function ingestFbiCrimeData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    const fbiApiKey = process.env.FBI_CRIME_API_KEY;
    if (!fbiApiKey) {
      return 0;
    }
    const url = `${FBI_CRIME_URL}/${stateAbbr.toUpperCase()}?API_KEY=${fbiApiKey}`;
    const data = await fetchJson(url);

    const results = data?.results ?? data?.data ?? data;
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return 0;
    }

    const records = Array.isArray(results) ? results : [results];
    let maxViolent = 0;
    let maxProperty = 0;
    for (const record of records) {
      const violent = parseFloat(record.violent_crime) || 0;
      const property = parseFloat(record.property_crime) || 0;
      if (violent > maxViolent) maxViolent = violent;
      if (property > maxProperty) maxProperty = property;
    }

    const normalizationBase = Math.max(maxViolent + maxProperty, 1);

    let upsertCount = 0;
    for (const record of records) {
      const violent = parseFloat(record.violent_crime) || 0;
      const property = parseFloat(record.property_crime) || 0;
      const totalCrime = violent + property;
      const crimeTrendPercentile = clamp((totalCrime / normalizationBase) * 100);

      const geographyKey = `${stateAbbr.toUpperCase()}_STATE`;

      const rawCrimeData = {
        violent_crime: violent,
        property_crime: property,
        year: record.year,
        population: record.population,
        state_abbr: stateAbbr.toUpperCase(),
      };

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(gisContextData)
          .set({
            crimeTrendPercentile,
            rawCrimeData,
            dataSource: appendSource(existing[0].dataSource, "fbi_crime"),
            dataYear: record.year || new Date().getFullYear(),
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
      } else {
        await db.insert(gisContextData).values({
          geographyKey,
          geographyType: "state",
          crimeTrendPercentile,
          rawCrimeData,
          dataSource: "fbi_crime",
          dataYear: record.year || new Date().getFullYear(),
        });
      }
      upsertCount++;
    }

    return upsertCount;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting FBI crime data:`, error);
    return 0;
  }
}

export async function ingestCensusAcsData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    const stateFips = getStateFips(stateAbbr);
    if (!stateFips) return 0;

    const censusKey = process.env.CENSUS_API_KEY || "";
    const variables = "B01003_001E,B19013_001E,B17001_002E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B25003_001E,B25003_002E";
    const keyParam = censusKey ? `&key=${censusKey}` : "";
    const url = `${CENSUS_ACS_URL}?get=NAME,${variables}&for=county:*&in=state:${stateFips}${keyParam}`;

    const data = await fetchJson(url);
    if (!Array.isArray(data) || data.length < 2) return 0;

    const headers = data[0] as string[];
    let upsertCount = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const countyName = row[0];
      const totalPop = parseInt(row[1]) || 0;
      const medianIncome = parseInt(row[2]) || 0;
      const belowPoverty = parseInt(row[3]) || 0;
      const bachelors = parseInt(row[4]) || 0;
      const masters = parseInt(row[5]) || 0;
      const professional = parseInt(row[6]) || 0;
      const doctorate = parseInt(row[7]) || 0;
      const stateFipsVal = row[headers.indexOf("state")];
      const countyFips = row[headers.indexOf("county")];

      const geographyKey = `${stateFipsVal}${countyFips}`;
      const povertyRate = totalPop > 0 ? clamp((belowPoverty / totalPop) * 100) : null;
      const highEdTotal = bachelors + masters + professional + doctorate;
      const educationAttainmentRate = totalPop > 0 ? clamp((highEdTotal / totalPop) * 100) : null;

      const rawCensusData = {
        county_name: countyName,
        total_population: totalPop,
        median_income: medianIncome,
        below_poverty: belowPoverty,
        bachelors_degree: bachelors,
        masters_degree: masters,
        professional_degree: professional,
        doctorate_degree: doctorate,
      };

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      const countyCoords = officialCountyCoords(stateAbbr, countyFips);

      if (existing.length > 0) {
        await db
          .update(gisContextData)
          .set({
            povertyRate: povertyRate ?? existing[0].povertyRate,
            medianIncome,
            totalPopulation: totalPop,
            educationAttainmentRate,
            rawCensusData,
            locationName: countyName,
            stateCode: stateAbbr.toUpperCase(),
            latitude: countyCoords.lat,
            longitude: countyCoords.lng,
            dataSource: appendSource(existing[0].dataSource, "census_acs"),
            dataYear: 2022,
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
      } else {
        await db.insert(gisContextData).values({
          geographyKey,
          geographyType: "county",
          povertyRate,
          medianIncome,
          totalPopulation: totalPop,
          educationAttainmentRate,
          rawCensusData,
          locationName: countyName,
          stateCode: stateAbbr.toUpperCase(),
          latitude: countyCoords.lat,
          longitude: countyCoords.lng,
          dataSource: "census_acs",
          dataYear: 2022,
        });
      }
      upsertCount++;
    }

    return upsertCount;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting Census ACS data:`, error);
    return 0;
  }
}

export async function ingestFoodAccessData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    const stateFips = getStateFips(stateAbbr);
    if (!stateFips) return 0;

    const url = `https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/Food_Access_Research_Atlas/FeatureServer/0/query?where=State%3D'${stateFips}'&outFields=CensusTract,State,County,LILATracts_1And10,lapop1share,lalowi1share,lahunv1share,TractSNAP&f=json&resultRecordCount=500`;

    let data: any;
    try {
      data = await fetchJson(url);
    } catch (err) {
      console.log(`[GIS Engine] USDA Food Access API unavailable for ${stateAbbr}: ${err}`);
      return 0;
    }

    const features = data?.features;
    if (!Array.isArray(features) || features.length === 0) return 0;

    let upsertCount = 0;
    for (const feature of features) {
      const attrs = feature.attributes || feature;
      const tract = attrs.CensusTract || attrs.censusTract;
      if (!tract) continue;

      const geographyKey = String(tract);
      const lapop1 = parseFloat(attrs.lapop1share) || 0;
      const isLila = attrs.LILATracts_1And10 || 0;
      const foodDesertIndicator = clamp(isLila ? Math.max(lapop1 * 100, 30) : lapop1 * 100);

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(gisContextData)
          .set({
            foodDesertIndicator,
            rawFoodAccessData: attrs,
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
        upsertCount++;
      }
    }
    return upsertCount;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting food access data:`, error);
    return 0;
  }
}

export async function ingestHudData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    const stateFips = getStateFips(stateAbbr);
    if (!stateFips) return 0;

    const censusKey = process.env.CENSUS_API_KEY || "";
    const keyParam = censusKey ? `&key=${censusKey}` : "";
    const url = `${CENSUS_ACS_URL}?get=NAME,B25070_007E,B25070_008E,B25070_009E,B25070_010E,B25003_001E,B25003_002E,B25003_003E&for=county:*&in=state:${stateFips}${keyParam}`;

    let data: string[][];
    try {
      data = await fetchJson(url);
    } catch (err) {
      console.log(`[GIS Engine] Census housing data unavailable for ${stateAbbr}: ${err}`);
      return 0;
    }

    if (!Array.isArray(data) || data.length < 2) return 0;

    const headers = data[0];
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rent30to35 = parseInt(row[1]) || 0;
      const rent35to40 = parseInt(row[2]) || 0;
      const rent40to50 = parseInt(row[3]) || 0;
      const rent50plus = parseInt(row[4]) || 0;
      const totalOccupied = parseInt(row[5]) || 1;
      const ownerOccupied = parseInt(row[6]) || 0;
      const renterOccupied = parseInt(row[7]) || 0;

      const costBurdened = rent30to35 + rent35to40 + rent40to50 + rent50plus;
      const renterPct = totalOccupied > 0 ? (renterOccupied / totalOccupied) * 100 : 50;
      const costBurdenPct = renterOccupied > 0 ? (costBurdened / renterOccupied) * 100 : 0;
      const housingInstabilityIndex = clamp(costBurdenPct * 0.6 + renterPct * 0.4);

      const stateFipsVal = row[headers.indexOf("state")];
      const countyFips = row[headers.indexOf("county")];
      const geographyKey = `${stateFipsVal}${countyFips}`;

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(gisContextData)
          .set({
            housingInstabilityIndex,
            rawHudData: {
              source: "census_acs_housing",
              cost_burdened_renters: costBurdened,
              total_occupied: totalOccupied,
              owner_occupied: ownerOccupied,
              renter_occupied: renterOccupied,
              cost_burden_pct: costBurdenPct,
              renter_pct: renterPct,
            },
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
        count++;
      }
    }
    return count;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting HUD/housing data:`, error);
    return 0;
  }
}

export async function ingestSamhsaData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    const url = `https://data.samhsa.gov/resource/d3p6-q6ia.json?$where=stname='${getStateName(stateAbbr)}'&$limit=500`;

    let data: Array<Record<string, string>>;
    try {
      data = await fetchJson(url);
    } catch (err) {
      console.log(`[GIS Engine] SAMHSA API unavailable for ${stateAbbr}: ${err}`);
      return 0;
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`[GIS Engine] No SAMHSA data found for ${stateAbbr}`);
      return 0;
    }

    const stateFips = getStateFips(stateAbbr);
    if (!stateFips) return 0;

    let totalRate = 0;
    let rateCount = 0;
    for (const record of data) {
      const rate = parseFloat(record.sud_tx_rate || record.illicit_drug_use_rate || "0");
      if (rate > 0) {
        totalRate += rate;
        rateCount++;
      }
    }

    const avgRate = rateCount > 0 ? totalRate / rateCount : 0;
    const substanceAbuseRate = clamp(avgRate);

    const existing = await db
      .select()
      .from(gisContextData)
      .where(like(gisContextData.geographyKey, `${stateFips}%`));

    let count = 0;
    for (const record of existing) {
      await db
        .update(gisContextData)
        .set({
          substanceAbuseRate,
          rawSamhsaData: {
            source: "samhsa_nsduh",
            state: stateAbbr,
            average_rate: avgRate,
            data_points: rateCount,
          },
          updatedAt: new Date(),
        })
        .where(eq(gisContextData.id, record.id));
      count++;
    }
    return count;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting SAMHSA data:`, error);
    return 0;
  }
}

export async function ingestBlsData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    const stateFips = getStateFips(stateAbbr);
    if (!stateFips) return 0;

    const censusKey = process.env.CENSUS_API_KEY || "";
    const keyParam = censusKey ? `&key=${censusKey}` : "";
    const url = `${CENSUS_ACS_URL}?get=NAME,B23025_003E,B23025_005E&for=county:*&in=state:${stateFips}${keyParam}`;

    let data: string[][];
    try {
      data = await fetchJson(url);
    } catch (err) {
      console.log(`[GIS Engine] Census labor data unavailable for ${stateAbbr}: ${err}`);
      return 0;
    }

    if (!Array.isArray(data) || data.length < 2) return 0;

    const headers = data[0];
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const laborForce = parseInt(row[1]) || 1;
      const unemployed = parseInt(row[2]) || 0;
      const unemploymentRate = clamp((unemployed / laborForce) * 100);

      const stateFipsVal = row[headers.indexOf("state")];
      const countyFips = row[headers.indexOf("county")];
      const geographyKey = `${stateFipsVal}${countyFips}`;

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(gisContextData)
          .set({
            unemploymentRate,
            rawBlsData: {
              source: "census_acs_employment",
              labor_force: laborForce,
              unemployed,
              unemployment_rate: unemploymentRate,
            },
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
        count++;
      }
    }
    return count;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting BLS/employment data:`, error);
    return 0;
  }
}

export async function ingestEducationData(
  db: any,
  stateAbbr: string
): Promise<number> {
  try {
    const stateFips = getStateFips(stateAbbr);
    if (!stateFips) return 0;

    const censusKey = process.env.CENSUS_API_KEY || "";
    const keyParam = censusKey ? `&key=${censusKey}` : "";
    const url = `${CENSUS_ACS_URL}?get=NAME,B15003_001E,B15003_017E,B15003_018E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B14001_002E,B14001_001E&for=county:*&in=state:${stateFips}${keyParam}`;

    let data: string[][];
    try {
      data = await fetchJson(url);
    } catch (err) {
      console.log(`[GIS Engine] Census education data unavailable for ${stateAbbr}: ${err}`);
      return 0;
    }

    if (!Array.isArray(data) || data.length < 2) return 0;

    const headers = data[0];
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const totalPop25Plus = parseInt(row[1]) || 1;
      const hsGrad = parseInt(row[2]) || 0;
      const someCollege = parseInt(row[3]) || 0;
      const bachelors = parseInt(row[4]) || 0;
      const masters = parseInt(row[5]) || 0;
      const professional = parseInt(row[6]) || 0;
      const doctorate = parseInt(row[7]) || 0;
      const enrolledSchool = parseInt(row[8]) || 0;
      const totalSchoolAge = parseInt(row[9]) || 1;

      const highEdTotal = bachelors + masters + professional + doctorate;
      const educationAttainmentRate = clamp((highEdTotal / totalPop25Plus) * 100);
      const enrollmentRate = clamp((enrolledSchool / totalSchoolAge) * 100);

      const stateFipsVal = row[headers.indexOf("state")];
      const countyFips = row[headers.indexOf("county")];
      const geographyKey = `${stateFipsVal}${countyFips}`;

      const existing = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.geographyKey, geographyKey))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(gisContextData)
          .set({
            educationAttainmentRate,
            rawEducationData: {
              source: "census_acs_education",
              total_pop_25plus: totalPop25Plus,
              hs_grad: hsGrad,
              some_college: someCollege,
              bachelors,
              masters,
              professional,
              doctorate,
              enrollment_rate: enrollmentRate,
              enrolled_school: enrolledSchool,
            },
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
        count++;
      }
    }
    return count;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting education data:`, error);
    return 0;
  }
}

export async function computeContextLoadIndex(
  db: any,
  geographyKey: string
): Promise<number | null> {
  try {
    const [record] = await db
      .select()
      .from(gisContextData)
      .where(eq(gisContextData.geographyKey, geographyKey))
      .limit(1);

    if (!record) {
      return null;
    }

    const weights: { value: number | null; weight: number }[] = [
      { value: record.sviPercentile, weight: 0.20 },
      { value: record.healthBurdenComposite, weight: 0.15 },
      { value: record.crimeTrendPercentile, weight: 0.15 },
      { value: record.povertyRate, weight: 0.15 },
      { value: record.unemploymentRate, weight: 0.10 },
      { value: record.housingInstabilityIndex, weight: 0.10 },
      { value: record.foodDesertIndicator, weight: 0.05 },
      { value: record.substanceAbuseRate, weight: 0.05 },
      { value: record.educationAttainmentRate ? (100 - record.educationAttainmentRate) : null, weight: 0.05 },
    ];

    let totalWeight = 0;
    let weightedSum = 0;

    for (const { value, weight } of weights) {
      if (value !== null && value !== undefined) {
        weightedSum += value * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return null;
    }

    const contextLoadIndex = clamp(weightedSum / totalWeight);

    await db
      .update(gisContextData)
      .set({
        contextLoadIndex,
        updatedAt: new Date(),
      })
      .where(eq(gisContextData.geographyKey, geographyKey));

    return contextLoadIndex;
  } catch (error) {
    console.error(`[GIS Engine] Error computing Context Load Index for ${geographyKey}:`, error);
    return null;
  }
}

/* ============================================================================
 * Census ACS race+age fetcher (B01001B = Black/African American by sex/age)
 * ----------------------------------------------------------------------------
 * Pulls real Census counts for specific corridor counties and writes them
 * directly into community_evidence as VERIFIED rows. This converts the
 * synthesis's modeled `black_population` / `disconnected_black_youth` claims
 * into verified ones, with full citation back to Census ACS.
 *
 * B01001B variables (by sex × age):
 *   B01001B_001E = Total Black/African American alone
 *   B01001B_002E = Male total ; B01001B_017E = Female total
 *   Children 0-17 (male):  003E..006E   ; female: 018E..021E
 *   Youth 16-24 (male):    006E (15-17 partial), 007E (18-19), 008E (20-24)
 *                          (we use 18-24 for the "16-24" approximation)
 * ============================================================================ */
export async function upsertEvidence(
  db: any,
  row: {
    geographyKey: string;
    geographyType: string;
    metricKey: string;
    metricLabel: string;
    value: number;
    unit: string;
    asOfDate: string;
    sourceName: string;
    sourceUrl: string;
    documentTitle: string;
    methodology: string;
    verifiedBy: string;
  },
) {
  const { communityEvidence } = await import("@shared/schema");
  const { and, eq } = await import("drizzle-orm");
  const existing = await db
    .select()
    .from(communityEvidence)
    .where(
      and(
        eq(communityEvidence.geographyKey, row.geographyKey),
        eq(communityEvidence.metricKey, row.metricKey),
        eq(communityEvidence.sourceName, row.sourceName),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(communityEvidence)
      .set({ ...row, confidence: "verified", updatedAt: new Date() })
      .where(eq(communityEvidence.id, existing[0].id));
  } else {
    await db.insert(communityEvidence).values({ ...row, confidence: "verified" });
  }
}

export async function ingestCorridorRaceAge(
  db: any,
  counties: Array<{ countyFips: string; metroId: string }>,
): Promise<{ updated: number; perCounty: Record<string, any> }> {
  const censusKey = process.env.CENSUS_API_KEY || "";
  const keyParam = censusKey ? `&key=${censusKey}` : "";
  const perCounty: Record<string, any> = {};
  let updated = 0;

  for (const { countyFips, metroId } of counties) {
    const stateFips = countyFips.slice(0, 2);
    const cFips = countyFips.slice(2);
    const vars = [
      "NAME",
      "B01001B_001E", // total Black
      "B01001B_002E", // male total Black
      "B01001B_017E", // female total Black
      // children male 0-17: 003 (<5) 004 (5-9) 005 (10-14) 006 (15-17)
      "B01001B_003E","B01001B_004E","B01001B_005E","B01001B_006E",
      // children female 0-17: 018 019 020 021
      "B01001B_018E","B01001B_019E","B01001B_020E","B01001B_021E",
      // youth 18-24 male: 007 (18-19) 008 (20-24)
      "B01001B_007E","B01001B_008E",
      // youth 18-24 female: 022 (18-19) 023 (20-24)
      "B01001B_022E","B01001B_023E",
    ].join(",");
    const url = `${CENSUS_ACS_URL}?get=${vars}&for=county:${cFips}&in=state:${stateFips}${keyParam}`;

    let data: string[][];
    try {
      data = await fetchJson(url);
    } catch (err) {
      console.log(`[GIS Engine] Census B01001B fetch failed for ${countyFips}: ${err}`);
      perCounty[countyFips] = { error: String(err) };
      continue;
    }
    if (!Array.isArray(data) || data.length < 2) {
      perCounty[countyFips] = { error: "no-data" };
      continue;
    }
    const headers = data[0];
    const row = data[1];
    const idx = (k: string) => headers.indexOf(k);
    const num = (k: string) => parseInt(row[idx(k)] ?? "0") || 0;

    const blackTotal = num("B01001B_001E");
    const childrenMale = num("B01001B_003E")+num("B01001B_004E")+num("B01001B_005E")+num("B01001B_006E");
    const childrenFemale = num("B01001B_018E")+num("B01001B_019E")+num("B01001B_020E")+num("B01001B_021E");
    const blackChildren017 = childrenMale + childrenFemale;
    const youth1824 = num("B01001B_007E")+num("B01001B_008E")+num("B01001B_022E")+num("B01001B_023E");

    const asOf = "2022-12-31";
    const baseSrc = {
      sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B01001B",
      sourceUrl: "https://api.census.gov/data/2022/acs/acs5",
      documentTitle: "Sex by Age — Black or African American Alone",
      verifiedBy: "Census ACS API direct fetch",
      asOfDate: asOf,
    };

    if (blackTotal > 0) {
      await upsertEvidence(db, {
        geographyKey: countyFips,
        geographyType: "county",
        metricKey: "black_population",
        metricLabel: "Black population (Census ACS B01001B_001E)",
        value: blackTotal,
        unit: "people",
        methodology: "Direct Census API call to ACS 5-year B01001B_001E (Black/African American alone, total).",
        ...baseSrc,
      });
      updated++;
    }
    if (blackChildren017 > 0) {
      await upsertEvidence(db, {
        geographyKey: countyFips,
        geographyType: "county",
        metricKey: "black_children_017",
        metricLabel: "Black children 0–17 (Census ACS B01001B sums 003-006 + 018-021)",
        value: blackChildren017,
        unit: "children",
        methodology: "Sum of B01001B male+female age brackets covering 0-17.",
        ...baseSrc,
      });
      updated++;
    }
    if (youth1824 > 0) {
      await upsertEvidence(db, {
        geographyKey: countyFips,
        geographyType: "county",
        metricKey: "black_youth_1824",
        metricLabel: "Black youth 18–24 (Census ACS B01001B sums 007-008 + 022-023)",
        value: youth1824,
        unit: "youth 18-24",
        methodology: "Sum of B01001B male+female age brackets covering 18-24.",
        ...baseSrc,
      });
      updated++;
    }

    perCounty[countyFips] = { metroId, blackTotal, blackChildren017, youth1824 };
  }

  return { updated, perCounty };
}

export async function runFullIngestion(
  db: any,
  stateAbbr: string
): Promise<{
  placesCount: number;
  sviCount: number;
  crimeCount: number;
  censusCount: number;
  foodAccessCount: number;
  hudCount: number;
  samhsaCount: number;
  blsCount: number;
  educationCount: number;
  indexCount: number;
}> {
  console.log(`[GIS Engine] Starting full ingestion for state: ${stateAbbr}`);

  const censusCount = await ingestCensusAcsData(db, stateAbbr);
  console.log(`[GIS Engine] Census ACS: ${censusCount} records`);

  const placesCount = await ingestCdcPlacesData(db, stateAbbr);
  console.log(`[GIS Engine] CDC PLACES: ${placesCount} records`);

  const sviCount = await ingestSviData(db, stateAbbr);
  console.log(`[GIS Engine] CDC SVI: ${sviCount} records`);

  const crimeCount = await ingestFbiCrimeData(db, stateAbbr);
  console.log(`[GIS Engine] FBI Crime: ${crimeCount} records`);

  const foodAccessCount = await ingestFoodAccessData(db, stateAbbr);
  console.log(`[GIS Engine] Food Access: ${foodAccessCount} records`);

  const hudCount = await ingestHudData(db, stateAbbr);
  console.log(`[GIS Engine] HUD: ${hudCount} records`);

  const samhsaCount = await ingestSamhsaData(db, stateAbbr);
  console.log(`[GIS Engine] SAMHSA: ${samhsaCount} records`);

  const blsCount = await ingestBlsData(db, stateAbbr);
  console.log(`[GIS Engine] BLS: ${blsCount} records`);

  const educationCount = await ingestEducationData(db, stateAbbr);
  console.log(`[GIS Engine] Education: ${educationCount} records`);

  const allRecords = await db.select().from(gisContextData);
  let indexCount = 0;

  for (const record of allRecords) {
    const result = await computeContextLoadIndex(db, record.geographyKey);
    if (result !== null) {
      indexCount++;
    }
  }
  console.log(`[GIS Engine] Context Load Index computed for ${indexCount} records`);

  return { placesCount, sviCount, crimeCount, censusCount, foodAccessCount, hudCount, samhsaCount, blsCount, educationCount, indexCount };
}

export async function getContextForGeography(
  db: any,
  geographyKey: string
): Promise<GisContextData | null> {
  try {
    const [record] = await db
      .select()
      .from(gisContextData)
      .where(eq(gisContextData.geographyKey, geographyKey))
      .limit(1);

    return record || null;
  } catch (error) {
    console.error(`[GIS Engine] Error fetching context for geography ${geographyKey}:`, error);
    return null;
  }
}

export async function searchByState(
  db: any,
  stateAbbr: string
): Promise<GisContextData[]> {
  try {
    const stateFips = getStateFips(stateAbbr);
    if (!stateFips) return [];

    const records = await db
      .select()
      .from(gisContextData)
      .where(like(gisContextData.geographyKey, `${stateFips}%`));

    return records;
  } catch (error) {
    console.error(`[GIS Engine] Error searching by state ${stateAbbr}:`, error);
    return [];
  }
}

export async function searchByLocation(
  db: any,
  query: string
): Promise<{ records: GisContextData[]; center: { lat: number; lng: number }; locationName: string }> {
  const trimmed = query.trim().toUpperCase();

  if (/^\d{5}$/.test(trimmed)) {
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?postalcode=${trimmed}&country=us&format=json&limit=1`;
      const results = await fetchJson(geocodeUrl);
      if (results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        const displayName = results[0].display_name || trimmed;

        const stateMatch = displayName.match(/,\s*([A-Z]{2})\s*\d/i) || displayName.match(/,\s*(\w+)\s*$/);
        let stateCode = "";
        if (stateMatch) {
          const stateStr = stateMatch[1].trim();
          const found = Object.entries(STATE_NAMES).find(([code, name]) =>
            code === stateStr.toUpperCase() || name.toUpperCase() === stateStr.toUpperCase()
          );
          if (found) stateCode = found[0];
        }

        if (stateCode) {
          const records = await searchByState(db, stateCode);
          return { records, center: { lat, lng }, locationName: displayName };
        }
      }
    } catch (err) {
      console.log(`[GIS Engine] Geocoding failed for ZIP ${trimmed}: ${err}`);
    }
  }

  if (trimmed.length === 2 && STATE_NAMES[trimmed]) {
    const records = await searchByState(db, trimmed);
    const coords = getStateCoords(trimmed) || { lat: 39.8283, lng: -98.5795 };
    return { records, center: coords, locationName: STATE_NAMES[trimmed] };
  }

  const stateEntry = Object.entries(STATE_NAMES).find(([code, name]) =>
    name.toUpperCase() === trimmed
  );
  if (stateEntry) {
    const records = await searchByState(db, stateEntry[0]);
    const coords = getStateCoords(stateEntry[0]) || { lat: 39.8283, lng: -98.5795 };
    return { records, center: coords, locationName: stateEntry[1] };
  }

  try {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&country=us&format=json&limit=1&addressdetails=1`;
    const results = await fetchJson(geocodeUrl);
    if (results.length > 0) {
      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);
      const displayName = results[0].display_name || query;
      const addr = results[0].address || {};
      const stateStr = addr.state || "";
      const found = Object.entries(STATE_NAMES).find(([code, name]) =>
        name.toUpperCase() === stateStr.toUpperCase()
      );
      if (found) {
        const records = await searchByState(db, found[0]);
        return { records, center: { lat, lng }, locationName: displayName };
      }
    }
  } catch (err) {
    console.log(`[GIS Engine] Geocoding failed for "${query}": ${err}`);
  }

  return { records: [], center: { lat: 39.8283, lng: -98.5795 }, locationName: query };
}

export function generateCommunityNarrative(record: GisContextData): string {
  const parts: string[] = [];
  const name = record.locationName || record.geographyKey;

  parts.push(`Community Profile for ${name}:`);

  if (record.contextLoadIndex !== null && record.contextLoadIndex !== undefined) {
    const level = record.contextLoadIndex > 70 ? "high" : record.contextLoadIndex > 40 ? "moderate" : "low";
    parts.push(`This community has a ${level} Context Load Index of ${record.contextLoadIndex.toFixed(1)}/100, indicating ${level === "high" ? "significant environmental stressors that affect residents" : level === "moderate" ? "some challenges that warrant attention" : "relatively manageable conditions"}.`);
  }

  if (record.povertyRate !== null && record.povertyRate !== undefined) {
    parts.push(`The poverty rate is ${record.povertyRate.toFixed(1)}%${record.povertyRate > 20 ? ", which is above the national average" : ""}.`);
  }

  if (record.unemploymentRate !== null && record.unemploymentRate !== undefined) {
    parts.push(`Unemployment stands at ${record.unemploymentRate.toFixed(1)}%.`);
  }

  if (record.medianIncome !== null && record.medianIncome !== undefined) {
    parts.push(`The median household income is $${record.medianIncome.toLocaleString()}.`);
  }

  if (record.healthBurdenComposite !== null && record.healthBurdenComposite !== undefined) {
    const healthLevel = record.healthBurdenComposite > 30 ? "elevated" : "moderate";
    parts.push(`Health burden indicators are ${healthLevel} at ${record.healthBurdenComposite.toFixed(1)}%.`);
  }

  if (record.crimeTrendPercentile !== null && record.crimeTrendPercentile !== undefined) {
    parts.push(`Crime trend percentile is ${record.crimeTrendPercentile.toFixed(1)}%.`);
  }

  if (record.foodDesertIndicator !== null && record.foodDesertIndicator !== undefined) {
    if (record.foodDesertIndicator > 20) {
      parts.push(`Food access is limited — ${record.foodDesertIndicator.toFixed(1)}% of residents lack convenient access to healthy food options.`);
    }
  }

  if (record.housingInstabilityIndex !== null && record.housingInstabilityIndex !== undefined) {
    if (record.housingInstabilityIndex > 30) {
      parts.push(`Housing instability is a concern with an index of ${record.housingInstabilityIndex.toFixed(1)}.`);
    }
  }

  if (record.substanceAbuseRate !== null && record.substanceAbuseRate !== undefined) {
    if (record.substanceAbuseRate > 10) {
      parts.push(`Substance abuse indicators suggest a rate of ${record.substanceAbuseRate.toFixed(1)}%.`);
    }
  }

  if (record.educationAttainmentRate !== null && record.educationAttainmentRate !== undefined) {
    parts.push(`${record.educationAttainmentRate.toFixed(1)}% of residents hold a bachelor's degree or higher.`);
  }

  return parts.join(" ");
}
