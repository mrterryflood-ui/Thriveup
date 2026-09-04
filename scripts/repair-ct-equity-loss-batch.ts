/**
 * repair-ct-equity-loss-batch.ts
 *
 * Targeted partial re-run: re-computes equity-loss frames for Connecticut's
 * 9 Planning Regions and upserts the results into the latest completed batch.
 *
 * Background: the August 2026 batch ran before the Connecticut USALEEP
 * crosswalk was fully wired, leaving all 9 CT Planning Regions marked
 * suppressed=true / suppression_reason='source_coverage_gap'.  The crosswalk
 * now resolves 775/783 source tracts across all 9 regions, so a targeted
 * re-run corrects the snapshot without invalidating the 3,224 other counties.
 *
 * Usage:
 *   npx tsx scripts/repair-ct-equity-loss-batch.ts
 */

import pg from "pg";
import {
  computeAllFrames,
  type FrameReferences,
  type UnitInputs,
} from "../server/equity-loss/equity-loss-engine";
import { fetchAllCountiesAcs } from "../server/equity-loss/acs-county-source";
import {
  fetchAllUsaleepTracts,
  resolveUsaleepTractsForCounty,
} from "../server/equity-loss/usaleep-source";
import {
  ruralityBandFromRucc,
  growthBandFromPct,
  peerClassKey,
} from "../server/equity-loss/peer-class";
import {
  getNationalReference,
  getStateReference,
  getPeerClassReference,
} from "../server/equity-loss/reference-cache";

const ENGINE_VERSION = "repair-ct-2026-09";

async function main(): Promise<void> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    query_timeout: 60_000,
    statement_timeout: 60_000,
  });

  const client = await pool.connect();
  let passed = 0;
  let failed = 0;

  function pass(msg: string) {
    console.log(`  ✓ ${msg}`);
    passed++;
  }
  function fail(msg: string) {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }

  try {
    // -----------------------------------------------------------------------
    // 1. Get latest completed batch_run_id
    // -----------------------------------------------------------------------
    const { rows: batchRows } = await client.query<{
      batch_run_id: string;
      completed_at: Date;
    }>(
      `SELECT batch_run_id, completed_at
       FROM equity_loss_national_batch_runs
       WHERE status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1`,
    );
    if (batchRows.length === 0) {
      fail("No completed batch run found — cannot repair.");
      return;
    }
    const { batch_run_id: batchRunId, completed_at: completedAt } = batchRows[0];
    console.log(
      `[repair-ct] Targeting batch ${batchRunId} (completed ${completedAt.toISOString()})`,
    );

    // -----------------------------------------------------------------------
    // 2. Get CT Planning Region rows from rucc_county_codes
    // -----------------------------------------------------------------------
    const { rows: ctCounties } = await client.query<{
      county_fips: string;
      county_name: string;
      state_abbrev: string;
      state_fips: string;
      rucc_code: number;
      census_region: string;
    }>(
      `SELECT county_fips, county_name, state_abbrev, LEFT(county_fips, 2) AS state_fips, rucc_code, census_region
       FROM rucc_county_codes
       WHERE state_abbrev = 'CT'
       ORDER BY county_fips`,
    );
    console.log(`[repair-ct] Found ${ctCounties.length} Connecticut Planning Regions`);
    if (ctCounties.length !== 9) {
      fail(
        `Expected 9 CT Planning Regions in rucc_county_codes but found ${ctCounties.length}`,
      );
      return;
    }

    // -----------------------------------------------------------------------
    // 3. Fetch USALEEP + ACS data (full national fetch; CT uses crosswalk)
    // -----------------------------------------------------------------------
    console.log("[repair-ct] Fetching USALEEP data (CT crosswalk will be used)...");
    const usaleepMap = await fetchAllUsaleepTracts();
    console.log(
      `[repair-ct] USALEEP fetch complete: ${usaleepMap.bySourceCountyName.size} source counties`,
    );

    console.log("[repair-ct] Fetching ACS data...");
    const acsMap = await fetchAllCountiesAcs();
    console.log(`[repair-ct] ACS fetch complete: ${acsMap.size} counties`);

    // -----------------------------------------------------------------------
    // 4. Warm national reference
    // -----------------------------------------------------------------------
    let nationalRef: number | null = null;
    try {
      nationalRef = await getNationalReference();
    } catch (err: any) {
      console.warn("[repair-ct] National reference unavailable:", err?.message);
    }

    // State reference for Connecticut (state_fips = '09')
    const CT_STATE_FIPS = "09";
    let ctStateRef: number | null = null;
    try {
      ctStateRef = await getStateReference(CT_STATE_FIPS, "CT");
    } catch (err: any) {
      console.warn("[repair-ct] CT state reference unavailable:", err?.message);
    }

    // -----------------------------------------------------------------------
    // 5. Re-compute and upsert each CT Planning Region
    // -----------------------------------------------------------------------
    console.log("[repair-ct] Starting per-region computation...\n");

    const beforeSuppressed: string[] = [];
    const afterResults: { fips: string; suppressed: boolean; reason: string | null }[] = [];

    // Check current state (before)
    const { rows: currentRows } = await client.query<{
      county_fips: string;
      suppressed: boolean;
      suppression_reason: string | null;
    }>(
      `SELECT county_fips, suppressed, suppression_reason
       FROM equity_loss_national_snapshot
       WHERE batch_run_id = $1 AND frame = 'vs_national_peer_class' AND state_abbrev = 'CT'`,
      [batchRunId],
    );
    for (const r of currentRows) {
      if (r.suppressed) beforeSuppressed.push(r.county_fips);
    }
    console.log(
      `[repair-ct] Before: ${beforeSuppressed.length}/9 CT regions suppressed (source_coverage_gap)`,
    );

    const peerRefCache = new Map<string, number | null>();

    for (const county of ctCounties) {
      const { county_fips, county_name, state_abbrev, state_fips, rucc_code, census_region } =
        county;

      const tracts = resolveUsaleepTractsForCounty(usaleepMap, {
        countyFips: county_fips,
        countyName: county_name,
        stateAbbrev: state_abbrev,
      });
      const acs = acsMap.get(county_fips);
      const ruralityBand = ruralityBandFromRucc(rucc_code);
      const decadalGrowthPct = acs?.decadalGrowthPct;
      const peerKey =
        typeof decadalGrowthPct === "number" && Number.isFinite(decadalGrowthPct)
          ? peerClassKey(ruralityBand, growthBandFromPct(decadalGrowthPct), census_region)
          : null;

      if (peerKey !== null && !peerRefCache.has(peerKey)) {
        try {
          peerRefCache.set(peerKey, await getPeerClassReference(peerKey));
        } catch {
          peerRefCache.set(peerKey, null);
        }
      }
      const peerRef = peerKey === null ? null : (peerRefCache.get(peerKey) ?? null);

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
        lifeExpectancyDistribution:
          tracts.length > 0 ? tracts.map((t) => t.lifeExpectancy) : undefined,
        healthInequalityMethod: "geographic_dispersion",
        usedUsaleepIhmeHybrid: false,
        healthValueBasis: tracts.length > 0 ? "observed" : undefined,
        sourceVintageYearsStale: new Date().getFullYear() - 2022,
      };

      const references: FrameReferences = {
        vsParentCounty: nationalRef,
        vsState: ctStateRef,
        vsNationalPeerClass: peerRef,
      };

      const frames = computeAllFrames(inputs, references);

      // Upsert all three frames
      for (const [frameKey, frameRow] of [
        ["vs_parent_county", frames.vsParentCounty],
        ["vs_state", frames.vsState],
        ["vs_national_peer_class", frames.vsNationalPeerClass],
      ] as const) {
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
            state_fips,
            county_fips,
            county_name,
            state_abbrev,
            frameKey,
            peerKey,
            frameRow.hdi,
            frameRow.ihdi,
            frameRow.overallLossPct,
            frameRow.aHealth,
            frameRow.aEducation,
            frameRow.aIncome,
            frames.divergencePct,
            frameRow.suppressed,
            frameRow.suppressionReason,
            frameRow.tier,
            frameRow.assumptionText,
            ENGINE_VERSION,
            batchRunId,
          ],
        );
        if (frameKey === "vs_national_peer_class") {
          afterResults.push({
            fips: county_fips,
            suppressed: frameRow.suppressed,
            reason: frameRow.suppressionReason,
          });
        }
      }

      const tractNote = tracts.length > 0 ? `${tracts.length} USALEEP tracts` : "NO USALEEP tracts";
      const suppNote = frames.vsNationalPeerClass.suppressed
        ? `SUPPRESSED(${frames.vsNationalPeerClass.suppressionReason})`
        : `OK(hdi=${frames.vsNationalPeerClass.hdi?.toFixed(3)})`;
      console.log(`  ${county_fips} ${county_name}: ${tractNote} → ${suppNote}`);
    }

    // -----------------------------------------------------------------------
    // 6. Verification
    // -----------------------------------------------------------------------
    console.log("\n[repair-ct] Post-repair verification:");

    const { rows: afterRows } = await client.query<{
      present_count: string;
      source_unavailable_count: string;
    }>(
      `SELECT COUNT(DISTINCT county_fips) AS present_count,
              COUNT(DISTINCT county_fips) FILTER (
                WHERE suppressed = true AND suppression_reason = 'source_coverage_gap'
              ) AS source_unavailable_count
       FROM equity_loss_national_snapshot
       WHERE batch_run_id = $1
         AND frame = 'vs_national_peer_class'
         AND state_abbrev = 'CT'`,
      [batchRunId],
    );

    const presentNow = parseInt(afterRows[0].present_count, 10);
    const sourceUnavailableNow = parseInt(afterRows[0].source_unavailable_count, 10);

    if (presentNow === 9 && sourceUnavailableNow === 0) {
      pass(
        `All 9 CT Planning Regions now present and NOT source-unavailable in batch ${batchRunId}`,
      );
    } else {
      fail(
        `After repair: ${presentNow}/9 present, ${sourceUnavailableNow}/9 still source-unavailable. ` +
          `Check USALEEP fetch and ACS coverage for CT FIPS.`,
      );
      // Surface which ones are still suppressed
      for (const r of afterResults) {
        if (r.suppressed) {
          console.error(`    Still suppressed: ${r.fips} reason=${r.reason}`);
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n[repair-ct] ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[repair-ct] Fatal:", err);
  process.exit(1);
});
