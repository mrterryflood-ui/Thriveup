/**
 * verify-equity-loss-nationwide.ts
 *
 * Post-batch verification for equity_loss_national_snapshot.
 * Checks:
 *   (a) Coverage: equity_loss_national_snapshot has rows for >=90% of the
 *       ~3,143 US counties (allows for legitimately suppressed/skipped).
 *   (b) Spot-check: 4 well-known counties have all 3 frames with non-null
 *       overall_loss_pct (where not suppressed).
 *   (c) Batch status: most recent equity_loss_national_batch_runs row has
 *       status='completed'.
 *
 * Exits 1 on any failure.
 */

import pg from "pg";

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
      if (latest.status === "completed") {
        pass(`Batch run ${latest.batch_run_id} has status='completed'`);
      } else {
        fail(`Latest batch run has status='${latest.status}' (expected 'completed')`);
      }
    }

    // -----------------------------------------------------------------------
    // Check (a): Coverage >= 90% of rucc_county_codes counties
    // -----------------------------------------------------------------------
    console.log("\n(a) Coverage check:");

    const { rows: ruccRows } = await client.query<{ cnt: string }>(
      "SELECT COUNT(DISTINCT county_fips) as cnt FROM rucc_county_codes",
    );
    const totalRuccCounties = parseInt(ruccRows[0].cnt, 10);

    // Count distinct county_fips in snapshot (regardless of suppression)
    const { rows: snapRows } = await client.query<{ cnt: string }>(
      "SELECT COUNT(DISTINCT county_fips) as cnt FROM equity_loss_national_snapshot",
    );
    const snapshotCounties = parseInt(snapRows[0].cnt, 10);

    // Count counties with all 3 non-suppressed frames
    const { rows: succeededRows } = await client.query<{ cnt: string }>(
      `SELECT COUNT(DISTINCT county_fips) as cnt
       FROM equity_loss_national_snapshot
       WHERE suppressed = false`,
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
      "SELECT frame, COUNT(*) as cnt FROM equity_loss_national_snapshot GROUP BY frame ORDER BY frame",
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
         WHERE county_fips = $1
         ORDER BY frame`,
        [fips],
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
