/**
 * One-time loader for the ZCTA (ZIP Code Tabulation Area) → County FIPS
 * lookup table, sourced from the U.S. Census Bureau's public ZCTA-to-County
 * relationship file (2010 vintage — the standard free source; there is no
 * free ZIP-only geocoding API as of this session, see .agents/memory).
 *
 * When a ZCTA spans multiple counties, only the county with the highest
 * population share (POPPT) is kept, since we need exactly one "best guess"
 * county per ZIP for orchestration geography resolution.
 *
 * Idempotent: safe to re-run — it upserts by zip.
 *
 * Run: npx tsx scripts/load-zcta-county.ts
 */
import { db } from "../server/storage";
import { zctaCountyMap } from "../shared/schema";
import { sql } from "drizzle-orm";

const SOURCE_URL = "https://www2.census.gov/geo/docs/maps-data/data/rel/zcta_county_rel_10.txt";

interface Row {
  zip: string;
  state: string;
  county: string;
  geoid: string;
  popPct: number;
}

async function main() {
  console.log(`[zcta-county] Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ZCTA-county relationship file`);
  const text = await res.text();
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const idx = {
    zcta5: header.indexOf("ZCTA5"),
    state: header.indexOf("STATE"),
    county: header.indexOf("COUNTY"),
    geoid: header.indexOf("GEOID"),
    zpoppct: header.indexOf("ZPOPPCT"),
  };
  if (Object.values(idx).some((i) => i < 0)) throw new Error("Unexpected column layout in ZCTA-county file");

  const bestByZip = new Map<string, Row>();
  let parsed = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    const zip = cols[idx.zcta5];
    const state = cols[idx.state];
    const county = cols[idx.county];
    const geoid = cols[idx.geoid];
    const zpoppct = parseFloat(cols[idx.zpoppct]);
    if (!zip || zip.length !== 5) continue;
    parsed++;
    const existing = bestByZip.get(zip);
    // ZPOPPCT = share of the ZCTA's population that falls in this county —
    // pick the county holding the largest share of the ZIP's population.
    if (!existing || (zpoppct || 0) > (existing.popPct || 0)) {
      bestByZip.set(zip, { zip, state, county, geoid, popPct: zpoppct });
    }
  }
  console.log(`[zcta-county] Parsed ${parsed} rows, resolved to ${bestByZip.size} unique ZIPs.`);

  const rows = Array.from(bestByZip.values()).map((r) => ({
    zip: r.zip,
    countyFips: r.geoid,
    stateFips: r.state,
    popPct: r.popPct,
    source: "Census ZCTA-County Relationship File (2010)",
  }));

  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await db
      .insert(zctaCountyMap)
      .values(batch)
      .onConflictDoUpdate({
        target: zctaCountyMap.zip,
        set: {
          countyFips: sql`excluded.county_fips`,
          stateFips: sql`excluded.state_fips`,
          popPct: sql`excluded.pop_pct`,
          source: sql`excluded.source`,
          loadedAt: sql`now()`,
        },
      });
    inserted += batch.length;
    console.log(`[zcta-county] Upserted ${inserted}/${rows.length}`);
  }

  console.log(`[zcta-county] Done. ${rows.length} ZIP→county mappings loaded.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[zcta-county] FAILED:", err);
  process.exit(1);
});
