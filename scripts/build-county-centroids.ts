/** Rebuild shared/nationwide/county-centroids.generated.json from the Census 2023 county Gazetteer. */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const URL = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_counties_national.zip";
const dir = mkdtempSync(join(tmpdir(), "gaz-"));
execSync(`curl -fsS -o ${dir}/c.zip ${URL} && unzip -oq ${dir}/c.zip -d ${dir}`);
const lines = readFileSync(join(dir, "2023_Gaz_counties_national.txt"), "utf8").split("\n").filter(Boolean);
const header = lines[0].split("\t").map(h => h.trim());
const idx = (k: string) => header.indexOf(k);
const out: Record<string, [string, string, number, number]> = {};
for (const line of lines.slice(1)) {
  const c = line.split("\t").map(v => v.trim());
  out[c[idx("GEOID")]] = [c[idx("USPS")], c[idx("NAME")], Number(Number(c[idx("INTPTLAT")]).toFixed(5)), Number(Number(c[idx("INTPTLONG")]).toFixed(5))];
}
if (Object.keys(out).length < 3000) throw new Error(`Gazetteer parse returned ${Object.keys(out).length} rows`);
writeFileSync("shared/nationwide/county-centroids.generated.json", JSON.stringify(out));
console.log(`county centroids: ${Object.keys(out).length} rows`);

// ZCTA centroids (server-only; ~33k rows) for ZIP-aggregated map layers.
const ZURL = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip";
execSync(`curl -fsS -o ${dir}/z.zip ${ZURL} && unzip -oq ${dir}/z.zip -d ${dir}`);
const zl = readFileSync(join(dir, "2023_Gaz_zcta_national.txt"), "utf8").split("\n").filter(Boolean);
const zh = zl[0].split("\t").map(h => h.trim());
const zi = (k: string) => zh.indexOf(k);
const zout: Record<string, [number, number]> = {};
for (const line of zl.slice(1)) { const c = line.split("\t").map(v => v.trim()); zout[c[zi("GEOID")]] = [Number(Number(c[zi("INTPTLAT")]).toFixed(4)), Number(Number(c[zi("INTPTLONG")]).toFixed(4))]; }
if (Object.keys(zout).length < 30000) throw new Error(`ZCTA Gazetteer parse returned ${Object.keys(zout).length} rows`);
writeFileSync("server/geo/zcta-centroids.generated.json", JSON.stringify(zout));
console.log(`zcta centroids: ${Object.keys(zout).length} rows`);
