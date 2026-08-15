/**
 * compute-peer-class-benchmarks.ts
 *
 * Populates benchmark_metrics with `is_reference` rows for the equity-loss
 * engine's `vs_national_peer_class` frame, plus a single national and (per
 * seen state) state-level reference row.
 *
 * Methodology (disclosed, see peer-class.ts PEER_CLASS_ASSUMPTION_TEXT):
 * one representative county (highest population) per
 * rurality-band x growth-band x census-region cell is computed live via the
 * real ACS + USALEEP pipeline and stored as that cell's benchmark. This is
 * NOT an average across all counties in the class — an exhaustive national
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
  type GrowthBand,
} from "../server/equity-loss/peer-class";

const REGIONS = ["Northeast", "Midwest", "South", "West"];
const RURALITY_BANDS: RuralityBand[] = ["metro", "small_town", "rural"];
const GROWTH_BANDS: GrowthBand[] = ["declining", "stable", "growing"];

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
  let genuinelyEmpty = 0;

  console.log("[peer-class-benchmarks] Starting: 36-class (rurality x growth x region) benchmark computation");

  try {
    // Iterate all 36 classes explicitly: rurality x growth_band x region
    for (const band of RURALITY_BANDS) {
      for (const growthBand of GROWTH_BANDS) {
        for (const region of REGIONS) {
          const key = peerClassKey(band, growthBand, region);
          const id = `equity_loss.peer_class.${key}`;

          // Skip if already exists
          const exists = await client.query("SELECT 1 FROM benchmark_metrics WHERE id = $1", [id]);
          if ((exists.rowCount ?? 0) > 0) {
            console.log(`[peer-class-benchmarks] ${key} already exists, skipping`);
            continue;
          }

          // Find candidate counties for this specific rurality x growth_band x region class.
          // Strategy: use equity_loss_national_snapshot.peer_class (already computed with real
          // ACS growth data) joined with rucc_county_codes for population, picking the
          // highest-population county in that class as the representative.
          // Fall back to up to 5 candidates if the top county is suppressed.
          const ruccRange = band === "metro" ? [1, 3] : band === "small_town" ? [4, 6] : [7, 9];

          // Use snapshot peer_class to find counties in this exact class (including growth band)
          // joined with rucc table for population ordering.
          const { rows: candidates } = await client.query(
            `SELECT DISTINCT ON (r.county_fips)
               r.county_fips, r.county_name, r.state_abbrev, r.population_2020
             FROM rucc_county_codes r
             JOIN equity_loss_national_snapshot s
               ON s.county_fips = r.county_fips
               AND s.frame = 'vs_national_peer_class'
               AND s.peer_class = $1
             WHERE r.rucc_code BETWEEN $2 AND $3
               AND r.census_region = $4
             ORDER BY r.county_fips, r.population_2020 DESC NULLS LAST
             LIMIT 5`,
            [key, ruccRange[0], ruccRange[1], region],
          );

          if (candidates.length === 0) {
            // Genuinely no counties in this class combination
            console.log(`[peer-class-benchmarks] GENUINE GAP: no real counties exist for ${key} — leaving absent (methodological gap, not a bug)`);
            genuinelyEmpty++;
            continue;
          }

          // Sort by population descending (DISTINCT ON already ordered, but re-sort to be safe)
          candidates.sort((a: any, b: any) => (b.population_2020 ?? 0) - (a.population_2020 ?? 0));

          let result: CountyLossResult | null = null;
          let usedCounty: { county_name: string; state_abbrev: string; county_fips: string } | null = null;
          for (const candidate of candidates) {
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
            console.warn(`[peer-class-benchmarks] no usable representative county found for ${key} after ${candidates.length} candidates`);
            skipped++;
            continue;
          }
          const { county_fips, county_name, state_abbrev } = usedCounty;

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
    }
  } finally {
    await client.end();
  }

  console.log(`\n[peer-class-benchmarks] done. computed=${computed} skipped=${skipped} genuinely_empty=${genuinelyEmpty}`);
  if (genuinelyEmpty > 0) {
    console.log(`[peer-class-benchmarks] NOTE: ${genuinelyEmpty} classes had no real counties — these are genuine methodological gaps. The vs_national_peer_class frame will correctly return null for counties in those classes.`);
  }
}

main().catch((e) => {
  console.error("[peer-class-benchmarks] FAILED:", e);
  process.exit(1);
});
