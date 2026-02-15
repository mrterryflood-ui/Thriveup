import { eq } from "drizzle-orm";
import { gisContextData } from "@shared/schema";
import type { GisContextData } from "@shared/schema";

const CDC_PLACES_URL = "https://data.cdc.gov/resource/swc5-untb.json";
const CDC_SVI_URL = "https://data.cdc.gov/resource/4d8n-kk8a.json";
const FBI_CRIME_URL = "https://api.usa.gov/crime/fbi/sapi/api/estimates/states";

const PLACES_MEASURES = ["BPHIGH", "DIABETES", "MHLTH", "OBESITY", "SLEEP", "ACCESS2"];

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
  }
  return response.json();
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export async function ingestCdcPlacesData(
  db: any,
  stateAbbr: string,
  countyFips?: string
): Promise<number> {
  console.log(`[GIS Engine] Ingesting CDC PLACES data for state=${stateAbbr}${countyFips ? `, county=${countyFips}` : ""}...`);

  try {
    const measuresFilter = PLACES_MEASURES.map((m) => `'${m}'`).join(",");
    let whereClause = `stateabbr='${stateAbbr.toUpperCase()}' AND measureid IN(${measuresFilter})`;
    if (countyFips) {
      whereClause += ` AND countyfips='${countyFips}'`;
    }

    const url = `${CDC_PLACES_URL}?$where=${encodeURIComponent(whereClause)}&$limit=50000`;
    const data = await fetchJson(url);

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`[GIS Engine] No CDC PLACES data returned for ${stateAbbr}`);
      return 0;
    }

    console.log(`[GIS Engine] Received ${data.length} CDC PLACES records`);

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

    console.log(`[GIS Engine] Upserted ${upsertCount} tracts with CDC PLACES data`);
    return upsertCount;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting CDC PLACES data:`, error);
    return 0;
  }
}

export async function ingestSviData(
  db: any,
  stateAbbr: string
): Promise<number> {
  console.log(`[GIS Engine] Ingesting SVI data for state=${stateAbbr}...`);

  try {
    const whereClause = `st_abbr='${stateAbbr.toUpperCase()}'`;
    const url = `${CDC_SVI_URL}?$where=${encodeURIComponent(whereClause)}&$limit=50000`;
    const data = await fetchJson(url);

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`[GIS Engine] No SVI data returned for ${stateAbbr}`);
      return 0;
    }

    console.log(`[GIS Engine] Received ${data.length} SVI records`);

    let upsertCount = 0;
    for (const record of data) {
      const geographyKey = record.fips || record.FIPS;
      if (!geographyKey) continue;

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
        await db
          .update(gisContextData)
          .set({
            sviPercentile,
            povertyRate,
            unemploymentRate,
            rawSviData,
            dataSource: existing[0].dataSource
              ? `${existing[0].dataSource},cdc_svi`
              : "cdc_svi",
            dataYear: new Date().getFullYear(),
            updatedAt: new Date(),
          })
          .where(eq(gisContextData.geographyKey, geographyKey));
      } else {
        await db.insert(gisContextData).values({
          geographyKey,
          geographyType: "tract",
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

    console.log(`[GIS Engine] Upserted ${upsertCount} tracts with SVI data`);
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
  console.log(`[GIS Engine] Ingesting FBI crime data for state=${stateAbbr}...`);

  try {
    const fbiApiKey = process.env.FBI_CRIME_API_KEY || 'DEMO_KEY';
    const url = `${FBI_CRIME_URL}/${stateAbbr.toUpperCase()}?API_KEY=${fbiApiKey}`;
    const data = await fetchJson(url);

    const results = data?.results ?? data?.data ?? data;
    if (!results || (Array.isArray(results) && results.length === 0)) {
      console.log(`[GIS Engine] No FBI crime data returned for ${stateAbbr}`);
      return 0;
    }

    const records = Array.isArray(results) ? results : [results];
    console.log(`[GIS Engine] Received ${records.length} FBI crime records`);

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
            dataSource: existing[0].dataSource
              ? `${existing[0].dataSource},fbi_crime`
              : "fbi_crime",
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

    console.log(`[GIS Engine] Upserted ${upsertCount} records with FBI crime data`);
    return upsertCount;
  } catch (error) {
    console.error(`[GIS Engine] Error ingesting FBI crime data:`, error);
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
      console.log(`[GIS Engine] No data found for geography ${geographyKey}, cannot compute Context Load Index`);
      return null;
    }

    const svi = record.sviPercentile;
    const health = record.healthBurdenComposite;
    const crime = record.crimeTrendPercentile;

    let totalWeight = 0;
    let weightedSum = 0;

    if (svi !== null && svi !== undefined) {
      weightedSum += svi * 0.4;
      totalWeight += 0.4;
    }
    if (health !== null && health !== undefined) {
      weightedSum += health * 0.3;
      totalWeight += 0.3;
    }
    if (crime !== null && crime !== undefined) {
      weightedSum += crime * 0.3;
      totalWeight += 0.3;
    }

    if (totalWeight === 0) {
      console.log(`[GIS Engine] No component data available for geography ${geographyKey}`);
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

    console.log(`[GIS Engine] Context Load Index for ${geographyKey}: ${contextLoadIndex.toFixed(2)}`);
    return contextLoadIndex;
  } catch (error) {
    console.error(`[GIS Engine] Error computing Context Load Index for ${geographyKey}:`, error);
    return null;
  }
}

export async function runFullIngestion(
  db: any,
  stateAbbr: string
): Promise<{ placesCount: number; sviCount: number; crimeCount: number; indexCount: number }> {
  console.log(`[GIS Engine] Starting full ingestion for state=${stateAbbr}...`);
  const startTime = Date.now();

  const placesCount = await ingestCdcPlacesData(db, stateAbbr);
  console.log(`[GIS Engine] CDC PLACES ingestion complete: ${placesCount} records`);

  const sviCount = await ingestSviData(db, stateAbbr);
  console.log(`[GIS Engine] SVI ingestion complete: ${sviCount} records`);

  const crimeCount = await ingestFbiCrimeData(db, stateAbbr);
  console.log(`[GIS Engine] FBI crime ingestion complete: ${crimeCount} records`);

  console.log(`[GIS Engine] Computing Context Load Index for all geographies...`);
  const allRecords = await db.select().from(gisContextData);
  let indexCount = 0;

  for (const record of allRecords) {
    const result = await computeContextLoadIndex(db, record.geographyKey);
    if (result !== null) {
      indexCount++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[GIS Engine] Full ingestion complete in ${elapsed}s. ` +
    `PLACES: ${placesCount}, SVI: ${sviCount}, Crime: ${crimeCount}, Indices computed: ${indexCount}`
  );

  return { placesCount, sviCount, crimeCount, indexCount };
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
