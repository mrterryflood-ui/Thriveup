/**
 * compute-nationwide-equity-loss.ts
 *
 * Nationwide batch-computation pipeline for the Equity-Loss Engine.
 * Computes equity-loss (3 frames per county) for every county in the
 * rucc_county_codes table (~3,143 US counties) and upserts results into
 * equity_loss_national_snapshot.
 *
 * Bulk-fetch strategy (why this completes in minutes, not hours):
 *   - ACS: 3 Census API calls (income 2022, education 2022, growth 2018)
 *     each using `for=county:*&in=state:*` to return ALL counties at once.
 *   - USALEEP: 2 paginated Socrata calls (50k + 23k rows), grouped in
 *     memory by county_name. This is the bulk-pull-then-group approach.
 *   Total external HTTP calls: 5 (3 ACS + 2 USALEEP), vs ~6,286+ for a
 *   per-county sequential approach.
 *
 * Counties that cannot be computed are skipped with an explicit
 * suppression_reason — no placeholder values are ever fabricated.
 * Territories (PR FIPS 72, AS 60, GU 66, MP 69, VI 78) are present in
 * rucc_county_codes but excluded from ACS bulk fetch responses by Census
 * and from USALEEP coverage, so they will appear as suppressed rows with
 * suppression_reason='source_coverage_gap' or 'incomplete_dimensions'.
 *
 * Run: npx tsx scripts/compute-nationwide-equity-loss.ts
 * Idempotent: safe to re-run; a second run refreshes rows under a new
 * batch_run_id via ON CONFLICT (county_fips, frame) DO UPDATE.
 */

import pg from "pg";
import { computeAllFrames, type FrameReferences, type UnitInputs } from "../server/equity-loss/equity-loss-engine";
import { fetchAllCountiesAcs } from "../server/equity-loss/acs-county-source";
import {
  fetchAllUsaleepTracts,
  resolveUsaleepTractsForCounty,
} from "../server/equity-loss/usaleep-source";
import {
  ruralityBandFromRucc,
  growthBandFromPct,
  peerClassKey,
  PEER_CLASS_ASSUMPTION_TEXT,
} from "../server/equity-loss/peer-class";
import {
  getNationalReference,
  getStateReference,
  getPeerClassReference,
} from "../server/equity-loss/reference-cache";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBatchRunId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  return `batch_${ts}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const wallStart = Date.now();
  const batchRunId = makeBatchRunId();

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  console.log(`[nationwide] Starting batch run ${batchRunId}`);

  // Insert 'running' batch row
  await client.query(
    `INSERT INTO equity_loss_national_batch_runs
       (batch_run_id, started_at, status)
     VALUES ($1, now(), 'running')`,
    [batchRunId],
  );

  let countiesAttempted = 0;
  let countiesSucceeded = 0;
  let countriesSuppressed = 0;
  let countriesFailed = 0;
  let countiesWithoutPeerClassification = 0;
  const failureReasons: string[] = [];
  let snapshotTransactionOpen = false;

  try {
    // -----------------------------------------------------------------------
    // Step 1: Load all counties from rucc_county_codes (exhaustive table)
    // -----------------------------------------------------------------------
    console.log("[nationwide] Loading county list from rucc_county_codes...");
    const { rows: allCounties } = await client.query<{
      county_fips: string;
      county_name: string;
      state_abbrev: string;
      state_fips: string;
      rucc_code: number;
      census_region: string;
    }>(
      `SELECT county_fips, county_name, state_abbrev,
              LEFT(county_fips, 2) AS state_fips,
              rucc_code, census_region
       FROM rucc_county_codes
       ORDER BY county_fips`,
    );
    console.log(`[nationwide] ${allCounties.length} counties found in rucc_county_codes`);

    // -----------------------------------------------------------------------
    // Step 2: Bulk-fetch ACS (3 Census API calls)
    // -----------------------------------------------------------------------
    console.log("[nationwide] Fetching all-county ACS data (3 Census API calls)...");
    const acsStart = Date.now();
    const acsMap = await fetchAllCountiesAcs();
    console.log(
      `[nationwide] ACS bulk fetch done: ${acsMap.size} counties in ${Math.round((Date.now() - acsStart) / 1000)}s`,
    );

    // -----------------------------------------------------------------------
    // Step 3: Bulk-fetch USALEEP (2 Socrata paginated calls)
    // -----------------------------------------------------------------------
    console.log("[nationwide] Fetching all-tract USALEEP data (2 Socrata calls)...");
    const usaleepStart = Date.now();
    const usaleepMap = await fetchAllUsaleepTracts();
    console.log(
      `[nationwide] USALEEP bulk fetch done: ${usaleepMap.bySourceCountyName.size} source counties in ${Math.round((Date.now() - usaleepStart) / 1000)}s`,
    );

    // -----------------------------------------------------------------------
    // Step 4: Warm the 3 reference types that are shared across counties.
    //   - National reference: 1 value (same for every county)
    //   - State reference: cached in benchmark_metrics after first compute per state
    //   - Peer class reference: pre-seeded by compute-peer-class-benchmarks.ts
    // These are fetched lazily below but the national one is fetched once upfront.
    // -----------------------------------------------------------------------
    console.log("[nationwide] Warming national reference...");
    let nationalRef: number | null = null;
    try {
      nationalRef = await getNationalReference();
    } catch (error) {
      console.error("[nationwide] National reference unavailable; its comparison frame will be unbenchmarked:", error);
    }
    console.log(`[nationwide] National reference: ${nationalRef}`);

    // Cache state references in memory to avoid redundant DB calls
    const stateRefCache = new Map<string, number | null>();
    const peerRefCache = new Map<string, number | null>();

    // -----------------------------------------------------------------------
    // Step 5: Compute equity-loss for every county
    // -----------------------------------------------------------------------
    console.log("[nationwide] Starting per-county computation...");
    const computeStart = Date.now();
    const BATCH_SIZE = 100; // upsert in batches
    await client.query("BEGIN");
    snapshotTransactionOpen = true;

    let upsertBuffer: Array<{
      stateFips: string;
      countyFips: string;
      countyName: string;
      stateAbbrev: string;
      frame: string;
      peerClass: string | null;
      hdi: number | null;
      ihdi: number | null;
      overallLossPct: number | null;
      aHealth: number | null;
      aEducation: number | null;
      aIncome: number | null;
      divergencePct: number | null;
      suppressed: boolean;
      suppressionReason: string | null;
      tier: string;
      assumptionText: string | null;
      engineVersion: string;
    }> = [];

    async function flushBuffer() {
      if (upsertBuffer.length === 0) return;
      const toFlush = upsertBuffer.splice(0, upsertBuffer.length);
      for (const row of toFlush) {
        await client.query(
          `INSERT INTO equity_loss_national_snapshot
             (state_fips, county_fips, county_name, state_abbrev, frame,
              peer_class, hdi, ihdi, overall_loss_pct,
              a_health, a_education, a_income, divergence_pct,
              suppressed, suppression_reason, tier, assumption_text,
              engine_version, batch_run_id, computed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,now())
           ON CONFLICT (county_fips, frame) DO UPDATE SET
             state_fips = EXCLUDED.state_fips,
             county_name = EXCLUDED.county_name,
             state_abbrev = EXCLUDED.state_abbrev,
             peer_class = EXCLUDED.peer_class,
             hdi = EXCLUDED.hdi,
             ihdi = EXCLUDED.ihdi,
             overall_loss_pct = EXCLUDED.overall_loss_pct,
             a_health = EXCLUDED.a_health,
             a_education = EXCLUDED.a_education,
             a_income = EXCLUDED.a_income,
             divergence_pct = EXCLUDED.divergence_pct,
             suppressed = EXCLUDED.suppressed,
             suppression_reason = EXCLUDED.suppression_reason,
             tier = EXCLUDED.tier,
             assumption_text = EXCLUDED.assumption_text,
             engine_version = EXCLUDED.engine_version,
             batch_run_id = EXCLUDED.batch_run_id,
             computed_at = now()`,
          [
            row.stateFips, row.countyFips, row.countyName, row.stateAbbrev,
            row.frame, row.peerClass, row.hdi, row.ihdi, row.overallLossPct,
            row.aHealth, row.aEducation, row.aIncome, row.divergencePct,
            row.suppressed, row.suppressionReason, row.tier, row.assumptionText,
            row.engineVersion, batchRunId,
          ],
        );
      }
    }

    for (const county of allCounties) {
      countiesAttempted++;
      const { county_fips, county_name, state_abbrev, state_fips, rucc_code, census_region } = county;

      // Progress logging every 200 counties
      if (countiesAttempted % 200 === 0) {
        console.log(
          `[nationwide] Progress: ${countiesAttempted}/${allCounties.length} ` +
          `(succeeded=${countiesSucceeded} suppressed=${countriesSuppressed} failed=${countriesFailed})`
        );
      }

      try {
        // Look up ACS data
        const acs = acsMap.get(county_fips);

        // FIPS alignment is required for changed county-equivalent geography
        // (Connecticut Planning Regions); unchanged counties use CDC's exact
        // source-native county label as a safe fallback.
        const tracts = resolveUsaleepTractsForCounty(usaleepMap, {
          countyFips: county_fips,
          countyName: county_name,
          stateAbbrev: state_abbrev,
        });

        // Build UnitInputs
        const ruralityBand = ruralityBandFromRucc(rucc_code);
        const decadalGrowthPct = acs?.decadalGrowthPct;
        const peerKey =
          typeof decadalGrowthPct === "number" && Number.isFinite(decadalGrowthPct)
            ? peerClassKey(
                ruralityBand,
                growthBandFromPct(decadalGrowthPct),
                census_region,
              )
            : null;
        if (peerKey === null) {
          countiesWithoutPeerClassification++;
        }

        const inputs: UnitInputs = {
          geoId: county_fips,
          geoLevel: "county",
          state: state_abbrev,
          countyFips: county_fips,
          year: 2022,
          population: acs?.population,
          decadalGrowthPct: acs?.decadalGrowthPct,
          incomeDistribution: acs?.incomeDistribution,
          incomeMoeRatio: acs?.incomeMoeRatio,
          educationDistribution: acs?.educationDistribution,
          educationMoeRatio: acs?.educationMoeRatio,
          lifeExpectancyDistribution: tracts.length > 0 ? tracts.map((t) => t.lifeExpectancy) : undefined,
          healthInequalityMethod: "geographic_dispersion",
          usedUsaleepIhmeHybrid: false,
          healthValueBasis: tracts.length > 0 ? "observed" : undefined,
          sourceVintageYearsStale: new Date().getFullYear() - 2022,
        };

        // Fetch references (cached after first compute per state/peer class)
        if (!stateRefCache.has(state_fips)) {
          try {
            stateRefCache.set(
              state_fips,
              await getStateReference(state_fips, state_abbrev),
            );
          } catch (error) {
            console.error(
              `[nationwide] State reference unavailable for ${state_abbrev}; its comparison frame will be unbenchmarked:`,
              error,
            );
            stateRefCache.set(state_fips, null);
          }
        }
        const stateRef = stateRefCache.get(state_fips) ?? null;

        if (peerKey !== null && !peerRefCache.has(peerKey)) {
          try {
            peerRefCache.set(peerKey, await getPeerClassReference(peerKey));
          } catch (error) {
            console.error(
              `[nationwide] Peer-class reference unavailable for ${peerKey}; its comparison frame will be unbenchmarked:`,
              error,
            );
            peerRefCache.set(peerKey, null);
          }
        }
        const peerRef = peerKey === null ? null : peerRefCache.get(peerKey) ?? null;

        const references: FrameReferences = {
          vsParentCounty: nationalRef,
          vsState: stateRef,
          vsNationalPeerClass: peerRef,
        };

        const frames = computeAllFrames(inputs, references);

        // Check if all 3 frames are suppressed
        const allSuppressed =
          frames.vsParentCounty.suppressed &&
          frames.vsState.suppressed &&
          frames.vsNationalPeerClass.suppressed;

        // Queue the 3 rows for upsert
        for (const [frameKey, frameRow] of [
          ["vs_parent_county", frames.vsParentCounty],
          ["vs_state", frames.vsState],
          ["vs_national_peer_class", frames.vsNationalPeerClass],
        ] as const) {
          upsertBuffer.push({
            stateFips: state_fips,
            countyFips: county_fips,
            countyName: county_name,
            stateAbbrev: state_abbrev,
            frame: frameKey,
            peerClass: peerKey,
            hdi: frameRow.hdi,
            ihdi: frameRow.ihdi,
            overallLossPct: frameRow.overallLossPct,
            aHealth: frameRow.aHealth,
            aEducation: frameRow.aEducation,
            aIncome: frameRow.aIncome,
            divergencePct: frames.divergencePct,
            suppressed: frameRow.suppressed,
            suppressionReason: frameRow.suppressionReason,
            tier: frameRow.tier,
            assumptionText: frameRow.assumptionText,
            engineVersion: frameRow.engineVersion,
          });
        }

        if (allSuppressed) {
          countriesSuppressed++;
        } else {
          countiesSucceeded++;
        }

        // Flush every BATCH_SIZE counties
        if (upsertBuffer.length >= BATCH_SIZE * 3) {
          await flushBuffer();
        }
      } catch (e) {
        countriesFailed++;
        const msg = `${county_fips} (${county_name}, ${state_abbrev}): ${(e as Error).message}`;
        failureReasons.push(msg);
        if (countriesFailed <= 10) {
          console.warn(`[nationwide] FAILED county: ${msg}`);
        }
      }
    }

    // Flush any remaining rows
    await flushBuffer();

    if (countriesFailed > 0) {
      throw new Error(
        `Refusing to publish a partial nationwide batch: ${countriesFailed} county computation(s) failed.`,
      );
    }

    const wallSeconds = Math.round((Date.now() - wallStart) / 1000);
    const computeSeconds = Math.round((Date.now() - computeStart) / 1000);

    // -----------------------------------------------------------------------
    // Step 6: Finalize batch run row
    // -----------------------------------------------------------------------
    await client.query(
      `UPDATE equity_loss_national_batch_runs SET
         completed_at = now(),
         counties_attempted = $1,
         counties_succeeded = $2,
         counties_suppressed = $3,
         counties_failed = $4,
         status = 'completed',
         error_summary = $5
       WHERE batch_run_id = $6`,
      [
        countiesAttempted,
        countiesSucceeded,
        countriesSuppressed,
        countriesFailed,
        failureReasons.length > 0
          ? `${failureReasons.length} failures: ` + failureReasons.slice(0, 5).join("; ")
          : null,
        batchRunId,
      ],
    );
    await client.query("COMMIT");
    snapshotTransactionOpen = false;

    console.log("\n[nationwide] ====== BATCH COMPLETE ======");
    console.log(`  Batch run ID:       ${batchRunId}`);
    console.log(`  Counties attempted: ${countiesAttempted}`);
    console.log(`  Counties succeeded: ${countiesSucceeded}`);
    console.log(`  Counties suppressed:${countriesSuppressed}`);
    console.log(`  Counties failed:    ${countriesFailed}`);
    console.log(`  No peer benchmark:  ${countiesWithoutPeerClassification} (missing decadal growth)`);
    console.log(`  Compute time:       ${computeSeconds}s`);
    console.log(`  Total wall time:    ${wallSeconds}s`);
    if (failureReasons.length > 0) {
      console.log(`  First failures:     ${failureReasons.slice(0, 3).join("; ")}`);
    }
  } catch (fatalError) {
    console.error("[nationwide] FATAL ERROR:", fatalError);
    const wallSeconds = Math.round((Date.now() - wallStart) / 1000);
    if (snapshotTransactionOpen) {
      await client.query("ROLLBACK").catch((rollbackError) => {
        console.error("[nationwide] Snapshot transaction rollback also failed:", rollbackError);
      });
      snapshotTransactionOpen = false;
    }
    await client
      .query(
        `UPDATE equity_loss_national_batch_runs SET
           completed_at = now(),
           counties_attempted = $1,
           counties_succeeded = $2,
           counties_suppressed = $3,
           counties_failed = $4,
           status = 'failed',
           error_summary = $5
         WHERE batch_run_id = $6`,
        [
          countiesAttempted,
          countiesSucceeded,
          countriesSuppressed,
          countriesFailed,
          String((fatalError as Error).message).slice(0, 500),
          batchRunId,
        ],
      )
      .catch((auditError) => {
        console.error("[nationwide] Failed to persist the failed-batch audit row:", auditError);
      });
    console.log(`[nationwide] Failed after ${wallSeconds}s`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("[nationwide] Unhandled error:", e);
  process.exit(1);
});
