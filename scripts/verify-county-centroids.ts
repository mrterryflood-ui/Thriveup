/** Guard: county coordinates must be Gazetteer values, in the shared table AND in gis_context_data. */
import { countyCentroid } from "../shared/nationwide/county-centroids";
import { Pool } from "pg";
const KNOWN: Array<[string, string, number, number]> = [["48453", "Travis", 30.24, -97.69], ["06037", "Los Angeles", 34.20, -118.26], ["36061", "New York", 40.78, -73.97], ["17031", "Cook", 41.84, -87.82]];
let bad = 0;
for (const [fips, name, lat, lon] of KNOWN) {
  const c = countyCentroid(fips);
  if (!c || Math.abs(c.lat - lat) > 0.5 || Math.abs(c.lon - lon) > 0.5) { console.error(`FAIL table ${name} ${fips}: ${JSON.stringify(c)}`); bad++; }
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const { rows } = await pool.query(`select geography_key, latitude, longitude from gis_context_data where geography_type='county' and latitude is not null`);
  let off = 0;
  for (const r of rows) {
    const c = countyCentroid(String(r.geography_key));
    if (c && (Math.abs(c.lat - Number(r.latitude)) > 0.05 || Math.abs(c.lon - Number(r.longitude)) > 0.05)) off++;
  }
  console.log(`gis_context_data county rows checked: ${rows.length}, off-centroid: ${off}`);
  if (off > 0) bad++;
} finally { await pool.end(); }
if (bad) { console.error("verify-county-centroids FAILED"); process.exit(1); }
console.log("PASS county centroids (Gazetteer 2023)");
