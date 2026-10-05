/** One-time repair: replace estimated county coordinates in gis_context_data with Gazetteer centroids. Idempotent. */
import { countyCentroid } from "../shared/nationwide/county-centroids";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(`select geography_key from gis_context_data where geography_type='county'`);
let updated = 0, missing: string[] = [];
for (const r of rows) {
  const c = countyCentroid(String(r.geography_key));
  if (!c) { missing.push(String(r.geography_key)); continue; }
  const res = await pool.query(`update gis_context_data set latitude=$1, longitude=$2 where geography_key=$3 and geography_type='county' and (latitude is distinct from $1 or longitude is distinct from $2)`, [c.lat, c.lon, r.geography_key]);
  updated += res.rowCount ?? 0;
}
await pool.end();
console.log(`county rows: ${rows.length}, updated: ${updated}, no Gazetteer match: ${missing.length} ${missing.slice(0, 10).join(",")}`);
