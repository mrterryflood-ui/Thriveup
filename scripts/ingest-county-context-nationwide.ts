/**
 * Nationwide county-context ingest: Census ACS 5-year (population, B19013 median income,
 * B17001 poverty, education) + CDC/ATSDR SVI 2022 county percentiles for every state + DC.
 * Replicates the Texas template across all 51 jurisdictions. Idempotent upserts.
 *
 * Usage: npx tsx scripts/ingest-county-context-nationwide.ts [--states=TX,CA] [--concurrency=3]
 */
import { ingestCensusAcsData, ingestSviData } from "../server/gis-engine";
import { db } from "../server/storage";

const ALL_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.split("=")[1];
const states = arg("states")?.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) ?? ALL_STATES;
const concurrency = Math.max(1, Number(arg("concurrency") ?? 3));

async function main() {
  const results: { state: string; acs: number; svi: number }[] = [];
  const queue = [...states];
  async function worker() {
    while (queue.length) {
      const state = queue.shift()!;
      const acs = await ingestCensusAcsData(db, state);
      const svi = await ingestSviData(db, state);
      results.push({ state, acs, svi });
      console.log(`[county-context] ${state}: acs=${acs} svi=${svi}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const failed = results.filter(r => r.acs === 0 || r.svi === 0);
  console.log(`[county-context] done: ${results.length} states, acs rows=${results.reduce((s, r) => s + r.acs, 0)}, svi rows=${results.reduce((s, r) => s + r.svi, 0)}`);
  if (failed.length) {
    console.error(`[county-context] INCOMPLETE for: ${failed.map(f => `${f.state}(acs=${f.acs},svi=${f.svi})`).join(" ")}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => { console.error("[county-context] fatal:", err); process.exit(1); });
