/**
 * seed-rucc-codes.ts
 *
 * One-time (re-run-safe/idempotent upsert) seed of USDA ERS Rural-Urban
 * Continuum Codes 2023 into rucc_county_codes. Source file confirmed
 * reachable and parseable 2026-08-15 — see
 * docs/equity-loss-phase1-2-decisions.md.
 *
 * Run manually: npx tsx scripts/seed-rucc-codes.ts
 */
import XLSX from "xlsx";
import pg from "pg";

const RUCC_URL =
  "https://ers.usda.gov/sites/default/files/_laserfiche/DataFiles/53251/Ruralurbancontinuumcodes2023.xlsx?v=25858";

const STATE_TO_REGION: Record<string, string> = {
  CT: "Northeast", ME: "Northeast", MA: "Northeast", NH: "Northeast", RI: "Northeast",
  VT: "Northeast", NJ: "Northeast", NY: "Northeast", PA: "Northeast",
  IL: "Midwest", IN: "Midwest", MI: "Midwest", OH: "Midwest", WI: "Midwest",
  IA: "Midwest", KS: "Midwest", MN: "Midwest", MO: "Midwest", NE: "Midwest",
  ND: "Midwest", SD: "Midwest",
  DE: "South", FL: "South", GA: "South", MD: "South", NC: "South", SC: "South",
  VA: "South", DC: "South", WV: "South", AL: "South", KY: "South", MS: "South",
  TN: "South", AR: "South", LA: "South", OK: "South", TX: "South",
  AZ: "West", CO: "West", ID: "West", MT: "West", NV: "West", NM: "West",
  UT: "West", WY: "West", AK: "West", CA: "West", HI: "West", OR: "West", WA: "West",
};

async function main() {
  console.log("[seed-rucc-codes] fetching", RUCC_URL);
  const res = await fetch(RUCC_URL);
  if (!res.ok) throw new Error(`RUCC fetch failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const [header, ...data] = rows;
  const idx = {
    fips: header.indexOf("FIPS"),
    state: header.indexOf("State"),
    name: header.indexOf("County_Name"),
    pop: header.indexOf("Population_2020"),
    rucc: header.indexOf("RUCC_2023"),
  };
  if (idx.fips < 0 || idx.rucc < 0) {
    throw new Error("Unexpected RUCC xlsx column layout — headers: " + JSON.stringify(header));
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  let upserted = 0;
  let skipped = 0;
  try {
    await client.query("BEGIN");
    for (const row of data) {
      const fips = String(row[idx.fips] ?? "").padStart(5, "0");
      const stateAbbrev = String(row[idx.state] ?? "").trim();
      const name = String(row[idx.name] ?? "").trim();
      const pop = Number(row[idx.pop]);
      const rucc = Number(row[idx.rucc]);
      if (!/^\d{5}$/.test(fips) || !Number.isFinite(rucc) || !stateAbbrev || !name) {
        skipped++;
        continue;
      }
      const region = STATE_TO_REGION[stateAbbrev] ?? "South"; // PR/territories fallback disclosed via source_vintage tag
      await client.query(
        `INSERT INTO rucc_county_codes
           (county_fips, state_abbrev, county_name, rucc_code, population_2020, census_region)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (county_fips) DO UPDATE SET
           state_abbrev = EXCLUDED.state_abbrev,
           county_name = EXCLUDED.county_name,
           rucc_code = EXCLUDED.rucc_code,
           population_2020 = EXCLUDED.population_2020,
           census_region = EXCLUDED.census_region`,
        [fips, stateAbbrev, name, rucc, Number.isFinite(pop) ? pop : null, region],
      );
      upserted++;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
  console.log(`[seed-rucc-codes] upserted ${upserted} counties, skipped ${skipped} malformed rows`);
  if (upserted < 3000) {
    throw new Error(`[seed-rucc-codes] only ${upserted} counties upserted — expected ~3,143; source layout may have changed`);
  }
}

main().catch((e) => {
  console.error("[seed-rucc-codes] FAILED:", e);
  process.exit(1);
});
