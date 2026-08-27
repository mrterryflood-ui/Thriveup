/**
 * verify-equity-loss-nationwide.ts
 *
 * Post-batch verification for equity_loss_national_snapshot.
 * Checks the most recent completed batch only:
 *   (a) Coverage: its snapshot rows cover >=90% of RUCC county equivalents.
 *   (b) Spot-check: 4 well-known counties have all 3 frames with non-null
 *       overall_loss_pct (where not suppressed).
 *   (c) Batch status: most recent equity_loss_national_batch_runs row is
 *       status='completed'.
 *   (d) Connecticut Planning Regions must not be state-wide source-coverage
 *       gaps while the authoritative CDC/Census resolver has source tracts.
 *
 * Exits 1 on any failure.
 */

import pg from "pg";
import {
  CONNECTICUT_PLANNING_REGION_FIPS,
} from "../server/equity-loss/connecticut-geography-alignment";
import {
  fetchAllUsaleepTracts,
  resolveUsaleepTractsForCounty,
} from "../server/equity-loss/usaleep-source";

const SPOT_CHECK_COUNTIES = [
  { fips: "17031", name: "Cook County, IL" },       // Chicago metro, large
  { fips: "06037", name: "Los Angeles County, CA" }, // Largest US county
  { fips: "48201", name: "Harris County, TX" },      // Houston area
  { fips: "36061", name: "New York County, NY" },    // Manhattan
];

const COVERAGE_THRESHOLD = 0.90; // at least 90% of rucc_county_codes counties must have rows

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  let passed = 0;
  let failed = 0;

  function pass(msg: string) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  }
  function fail(msg: string) {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }

  try {
    console.log("[verify-nationwide] Running equity-loss nationwide verification...\n");

    // -----------------------------------------------------------------------
    // Check (c): Most recent batch run has status='completed'
    // -----------------------------------------------------------------------
    console.log("(c) Batch run status check:");
    const { rows: batchRows } = await client.query<{
      batch_run_id: string;
      status: string;
      counties_attempted: number;
      counties_succeeded: number;
      counties_suppressed: number;
      counties_failed: number;
      completed_at: Date | null;
    }>(
      `SELECT batch_run_id, status, counties_attempted, counties_succeeded,
              counties_suppressed, counties_failed, completed_at
       FROM equity_loss_national_batch_runs
       ORDER BY started_at DESC LIMIT 1`,
    );

    if (batchRows.length === 0) {
      fail("No batch run rows found in equity_loss_national_batch_runs");
    } else {
      const latest = batchRows[0];
      console.log(`     Latest batch: ${latest.batch_run_id}`);
      console.log(`     Status: ${latest.status}`);
      console.log(`     Attempted: ${latest.counties_attempted}, Succeeded: ${latest.counties_succeeded}, Suppressed: ${latest.counties_suppressed}, Failed: ${latest.counties_failed}`);
      console.log(`     Completed at: ${latest.completed_at}`);
      if (latest.status === "completed" && latest.counties_failed === 0) {
        pass(`Batch run ${latest.batch_run_id} has status='completed'`);
      } else if (latest.status === "completed") {
        fail(
          `Latest batch is marked completed but reports ${latest.counties_failed} failed county computation(s)`,
        );
      } else {
        fail(`Latest batch run has status='${latest.status}' (expected 'completed')`);
      }
    }

    const latestCompletedBatch = batchRows[0]?.status === "completed" ? batchRows[0] : null;
    if (!latestCompletedBatch) {
      console.log("\n(a-d) Skipped because there is no completed latest batch.");
      process.exitCode = 1;
      return;
    }

    // -----------------------------------------------------------------------
    // Check (a): Coverage >= 90% of RUCC county equivalents in this batch
    // -----------------------------------------------------------------------
    console.log("\n(a) Coverage check:");

    const { rows: ruccRows } = await client.query<{ cnt: string }>(
      "SELECT COUNT(DISTINCT county_fips) as cnt FROM rucc_county_codes",
    );
    const totalRuccCounties = parseInt(ruccRows[0].cnt, 10);

    // Count distinct county_fips in the selected batch (regardless of suppression)
    const { rows: snapRows } = await client.query<{ cnt: string }>(
      `SELECT COUNT(DISTINCT county_fips) as cnt
       FROM equity_loss_national_snapshot
       WHERE batch_run_id = $1`,
      [latestCompletedBatch.batch_run_id],
    );
    const snapshotCounties = parseInt(snapRows[0].cnt, 10);

    // Count counties with all 3 non-suppressed frames
    const { rows: succeededRows } = await client.query<{ cnt: string }>(
      `SELECT COUNT(DISTINCT county_fips) as cnt
       FROM equity_loss_national_snapshot
        WHERE batch_run_id = $1 AND suppressed = false`,
      [latestCompletedBatch.batch_run_id],
    );
    const succeededCounties = parseInt(succeededRows[0].cnt, 10);

    const coverage = snapshotCounties / totalRuccCounties;
    console.log(`     rucc_county_codes total: ${totalRuccCounties}`);
    console.log(`     Snapshot counties with rows: ${snapshotCounties} (${(coverage * 100).toFixed(1)}%)`);
    console.log(`     Counties with >=1 non-suppressed frame: ${succeededCounties}`);

    if (coverage >= COVERAGE_THRESHOLD) {
      pass(`Coverage ${(coverage * 100).toFixed(1)}% >= ${(COVERAGE_THRESHOLD * 100).toFixed(0)}% threshold`);
    } else {
      fail(`Coverage ${(coverage * 100).toFixed(1)}% is below ${(COVERAGE_THRESHOLD * 100).toFixed(0)}% threshold (${snapshotCounties}/${totalRuccCounties} counties)`);
    }

    // Also check total rows
    const { rows: totalRowRows } = await client.query<{ cnt: string; frame: string }>(
      `SELECT frame, COUNT(*) as cnt
       FROM equity_loss_national_snapshot
       WHERE batch_run_id = $1
       GROUP BY frame ORDER BY frame`,
      [latestCompletedBatch.batch_run_id],
    );
    console.log("     Rows per frame:");
    for (const r of totalRowRows) {
      console.log(`       ${r.frame}: ${r.cnt}`);
    }

    // -----------------------------------------------------------------------
    // Check (b): Spot-check well-known counties
    // -----------------------------------------------------------------------
    console.log("\n(b) Spot-check well-known counties:");

    for (const { fips, name } of SPOT_CHECK_COUNTIES) {
      const { rows: spotRows } = await client.query<{
        frame: string;
        suppressed: boolean;
        overall_loss_pct: string | null;
        suppression_reason: string | null;
      }>(
        `SELECT frame, suppressed, overall_loss_pct, suppression_reason
         FROM equity_loss_national_snapshot
         WHERE batch_run_id = $1 AND county_fips = $2
         ORDER BY frame`,
        [latestCompletedBatch.batch_run_id, fips],
      );

      if (spotRows.length === 0) {
        fail(`${name} (${fips}): No rows found in equity_loss_national_snapshot`);
        continue;
      }

      console.log(`     ${name} (${fips}):`);
      const frames = new Set(spotRows.map((r) => r.frame));
      const expectedFrames = ["vs_national_peer_class", "vs_parent_county", "vs_state"];
      const missingFrames = expectedFrames.filter((f) => !frames.has(f));

      if (missingFrames.length > 0) {
        fail(`${name} (${fips}): Missing frames: ${missingFrames.join(", ")}`);
      } else {
        let frameIssue = false;
        for (const row of spotRows) {
          const lossDisplay = row.suppressed
            ? `suppressed (${row.suppression_reason})`
            : `loss=${parseFloat(row.overall_loss_pct ?? "0").toFixed(2)}%`;
          console.log(`       ${row.frame}: ${lossDisplay}`);

          if (!row.suppressed && row.overall_loss_pct === null) {
            fail(`${name} (${fips}): frame=${row.frame} is not suppressed but overall_loss_pct is null`);
            frameIssue = true;
          }
        }
        if (!frameIssue) {
          pass(`${name} (${fips}): all 3 frames present and consistent`);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Check (d): Connecticut source alignment and statewide-gap regression
    // -----------------------------------------------------------------------
    console.log("\n(d) Connecticut Planning Region source-alignment check:");
    const usaleepIndex = await fetchAllUsaleepTracts();
    if (usaleepIndex.connecticutAlignment.status !== "resolved") {
      fail(
        `Official Connecticut geography alignment unavailable: ${usaleepIndex.connecticutAlignment.reason}`,
      );
    } else {
      const { report } = usaleepIndex.connecticutAlignment;
      console.log(
        `     Official source tracts: ${report.sourceTracts}; resolved: ${report.resolvedSourceTracts}; ` +
          `boundary-spanning excluded: ${report.boundarySpanningSourceTracts}`,
      );
      const missingResolverRegions = CONNECTICUT_PLANNING_REGION_FIPS.filter(
        (fips) => !usaleepIndex.byCountyFips.has(fips),
      );
      if (missingResolverRegions.length === 0) {
        pass("all 9 Connecticut Planning Regions have uniquely resolved USALEEP source tracts");
      } else {
        fail(
          `Connecticut Planning Regions missing resolver source tracts: ${missingResolverRegions.join(", ")}`,
        );
      }

      const { rows: ctRuccRows } = await client.query<{
        county_fips: string;
        county_name: string;
        state_abbrev: string;
      }>(
        `SELECT county_fips, county_name, state_abbrev
         FROM rucc_county_codes
         WHERE state_abbrev = 'CT'
         ORDER BY county_fips`,
      );
      const unresolvedRuccRegions = ctRuccRows.filter(
        (county) =>
          resolveUsaleepTractsForCounty(usaleepIndex, {
            countyFips: county.county_fips,
            countyName: county.county_name,
            stateAbbrev: county.state_abbrev,
          }).length === 0,
      );
      if (ctRuccRows.length === 9 && unresolvedRuccRegions.length === 0) {
        pass("all 9 RUCC Connecticut Planning Regions resolve through the shared FIPS path");
      } else {
        fail(
          `Connecticut resolver mismatch: ${ctRuccRows.length} RUCC regions, ` +
            `${unresolvedRuccRegions.length} without source tracts`,
        );
      }

      const { rows: ctSnapshotRows } = await client.query<{
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
        [latestCompletedBatch.batch_run_id],
      );
      const ctSnapshot = ctSnapshotRows[0];
      const presentCtRegions = parseInt(ctSnapshot.present_count, 10);
      const sourceUnavailableCtRegions = parseInt(ctSnapshot.source_unavailable_count, 10);
      if (presentCtRegions === 9 && sourceUnavailableCtRegions === 0) {
        pass("Connecticut is not a statewide source-coverage gap in the selected batch");
      } else {
        fail(
          `Connecticut batch coverage regression: ${presentCtRegions}/9 present, ` +
            `${sourceUnavailableCtRegions}/9 source-unavailable`,
        );
      }
    }

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------
    console.log(`\n[verify-nationwide] Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      console.error("[verify-nationwide] VERIFICATION FAILED");
      process.exit(1);
    } else {
      console.log("[verify-nationwide] ALL CHECKS PASSED");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("[verify-nationwide] Unhandled error:", e);
  process.exit(1);
});
