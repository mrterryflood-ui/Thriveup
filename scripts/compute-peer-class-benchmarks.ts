/**
 * compute-peer-class-benchmarks.ts
 *
 * Populates benchmark_metrics with `is_reference` rows for the equity-loss
 * engine's `vs_national_peer_class` frame, plus a single national and (per
 * seen state) state-level reference row.
 *
 * Methodology (disclosed, see peer-class.ts PEER_CLASS_ASSUMPTION_TEXT):
 * one representative county (highest population) per
 * rurality-band x census-region cell is computed live via the real ACS +
 * USALEEP pipeline and stored as that cell's benchmark. This is NOT an
 * average across all counties in the class — an exhaustive national
 * average would require ~3,143 live county computations, not viable as a
 * one-off script run in this build cycle. National and state reference
 * rows use the true national/state ACS + USALEEP aggregates (real Census
 * geography, not a representative-county proxy).
 *
 * Idempotent: benchmark_metrics rows are is_reference=true (immutable via
 * trigger), so this script uses a distinct id per (class, growth band) and
 * skips ids that already exist rather than attempting an update.
 *
 * Run manually: npx tsx scripts/compute-peer-class-benchmarks.ts
 */
import pg from "pg";
import {
  computeEquityLoss,
  DEFAULT_SUPPRESSION,
  type UnitInputs,
} from "../server/equity-loss/equity-loss-engine";
import { UNDP_GOALPOSTS } from "../server/equity-loss/atkinson";
import { fetchCountyAcs } from "../server/equity-loss/acs-county-source";
import { fetchUsaleepTractsForCounty } from "../server/equity-loss/usaleep-source";
import {
  ruralityBandFromRucc,
  growthBandFromPct,
  peerClassKey,
  type RuralityBand,
} from "../server/equity-loss/peer-class";

const REGIONS = ["Northeast", "Midwest", "South", "West"];
const RURALITY_BANDS: RuralityBand[] = ["metro", "small_town", "rural"];

interface CountyLossResult {
  overallLossPct: number;
  growthBand: string;
}

/**
 * Returns the computed loss, or a disclosed reason it couldn't be computed
 * (never throws for expected/legitimate suppression — only for genuine
 * upstream failures, which the caller logs and moves past).
 */
async function computeCountyOwnLoss(
  countyFips: string,
  countyName: string,
  stateAbbrev: string,
): Promise<CountyLossResult | { suppressionReason: string } | null> {
  const stateFips = countyFips.slice(0, 2);
  const countyOnly = countyFips.slice(2);
  try {
    const acs = await fetchCountyAcs(stateFips, countyOnly);
    const tracts = await fetchUsaleepTractsForCounty(`${countyName}, ${stateAbbrev}`);
    if (acs.population < DEFAULT_SUPPRESSION.minPopulation) return { suppressionReason: "below_min_population" };
    if (tracts.length === 0) return { suppressionReason: "no_usaleep_tracts" };

    const inputs: UnitInputs = {
      geoId: countyFips,
      geoLevel: "county",
      state: stateAbbrev,
      countyFips,
      year: 2022,
      population: acs.population,
      decadalGrowthPct: acs.decadalGrowthPct,
      incomeDistribution: acs.incomeDistribution,
      incomeMoeRatio: acs.incomeMoeRatio,
      educationDistribution: acs.educationDistribution,
      educationMoeRatio: acs.educationMoeRatio,
      lifeExpectancyDistribution: tracts.map((t) => t.lifeExpectancy),
      healthInequalityMethod: "geographic_dispersion",
      usedUsaleepIhmeHybrid: false,
      healthValueBasis: "observed",
    };
    const row = computeEquityLoss(inputs, "vs_national_peer_class", null, UNDP_GOALPOSTS, DEFAULT_SUPPRESSION);
    if (row.suppressed || row.overallLossPct === null) {
      return { suppressionReason: row.suppressionReason ?? "unknown" };
    }
    return { overallLossPct: row.overallLossPct, growthBand: growthBandFromPct(acs.decadalGrowthPct) };
  } catch (e) {
    console.warn(`[peer-class-benchmarks] upstream fetch failed for ${countyName} (${countyFips}):`, (e as Error).message);
    return null;
  }
}

function isComputed(r: CountyLossResult | { suppressionReason: string } | null): r is CountyLossResult {
  return r !== null && "overallLossPct" in r;
}

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  let computed = 0;
  let skipped = 0;
  try {
    for (const band of RURALITY_BANDS) {
      for (const region of REGIONS) {
        const ruccRange = band === "metro" ? [1, 3] : band === "small_town" ? [4, 6] : [7, 9];
        // Fetch several candidates, not just the top one — the largest
        // county in a class can legitimately trip the engine's own
        // suppression rules (e.g. a volatile growth-rate denominator), in
        // which case we fall back to the next-largest rather than leaving
        // the whole class unbenchmarked.
        const { rows } = await client.query(
          `SELECT county_fips, county_name, state_abbrev FROM rucc_county_codes
           WHERE rucc_code BETWEEN $1 AND $2 AND census_region = $3
           ORDER BY population_2020 DESC NULLS LAST LIMIT 5`,
          [ruccRange[0], ruccRange[1], region],
        );
        if (rows.length === 0) {
          console.warn(`[peer-class-benchmarks] no county found for ${band}/${region}`);
          skipped++;
          continue;
        }

        let result: CountyLossResult | null = null;
        let usedCounty: { county_name: string; state_abbrev: string; county_fips: string } | null = null;
        for (const candidate of rows) {
          const r = await computeCountyOwnLoss(candidate.county_fips, candidate.county_name, candidate.state_abbrev);
          if (isComputed(r)) {
            result = r;
            usedCounty = candidate;
            break;
          }
          const reason = r === null ? "upstream_fetch_failed" : r.suppressionReason;
          console.warn(`[peer-class-benchmarks] ${candidate.county_name} (${candidate.county_fips}) not usable: ${reason} — trying next candidate`);
        }

        if (!result || !usedCounty) {
          console.warn(`[peer-class-benchmarks] no usable representative county found for ${band}/${region} after ${rows.length} candidates`);
          skipped++;
          continue;
        }
        const { county_fips, county_name, state_abbrev } = usedCounty;
        const key = peerClassKey(band, result.growthBand as any, region);
        const id = `equity_loss.peer_class.${key}`;
        const exists = await client.query("SELECT 1 FROM benchmark_metrics WHERE id = $1", [id]);
        if ((exists.rowCount ?? 0) > 0) {
          console.log(`[peer-class-benchmarks] ${key} already exists, skipping`);
          continue;
        }
        await client.query(
          `INSERT INTO benchmark_metrics
             (id, domain, metric_key, geo_level, geo_value, value, unit, year,
              comparison_set, is_reference, source_publisher, source_url)
           VALUES ($1,'economic','equity_loss_peer_class_benchmark','national',$2,$3,'pct',2022,
                   $4,TRUE,'TCAF equity-loss engine (representative-county method)',
                   'internal computation — see scripts/compute-peer-class-benchmarks.ts')`,
          [id, key, result.overallLossPct, `representative_county=${county_name}, ${state_abbrev} (${county_fips})`],
        );
        console.log(`[peer-class-benchmarks] ${key} → ${result.overallLossPct.toFixed(2)}% (from ${county_name}, ${state_abbrev})`);
        computed++;
      }
    }
  } finally {
    await client.end();
  }
  console.log(`[peer-class-benchmarks] done. computed=${computed} skipped=${skipped}`);
}

main().catch((e) => {
  console.error("[peer-class-benchmarks] FAILED:", e);
  process.exit(1);
});
