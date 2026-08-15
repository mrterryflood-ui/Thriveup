/**
 * equity-loss-national-scheduler.ts
 *
 * Monthly scheduler for the nationwide Equity-Loss snapshot.
 *
 * Scheduling conventions (matches server/index.ts gun-violence-registry pattern):
 *   - At boot: checks the most recent completed or running batch row.
 *     If the last completed run is within 30 days, skips and logs clearly.
 *   - If stale (> 30 days) or no run exists: starts a new batch after a
 *     short boot-delay (90 seconds), giving the server time to settle.
 *   - Thereafter: setInterval every 30 days re-checks and re-runs.
 *   - Staleness alert: if no completed run exists within 45 days,
 *     sends a staff email via sendEcosystemUpdate() after each cycle.
 *
 * Data integrity guarantee:
 *   The entire batch (all upserts) runs inside a single DB transaction.
 *   If a fatal error occurs mid-batch, the transaction is rolled back,
 *   leaving the previous completed batch's snapshot rows untouched.
 *   The batch_run_id row is written OUTSIDE the transaction so the
 *   'failed' status row is always visible in the audit table, but no
 *   partial snapshot data escapes to production reads.
 *
 *   API invariant: getLatestCompletedBatch() only reads status='completed'
 *   rows — a 'failed' or 'running' run is never served.
 */

import pg from "pg";
import { computeAllFrames, type FrameReferences, type UnitInputs } from "./equity-loss/equity-loss-engine";
import { fetchAllCountiesAcs } from "./equity-loss/acs-county-source";
import { fetchAllUsaleepTracts } from "./equity-loss/usaleep-source";
import {
  ruralityBandFromRucc,
  growthBandFromPct,
  peerClassKey,
} from "./equity-loss/peer-class";
import {
  getNationalReference,
  getStateReference,
  getPeerClassReference,
} from "./equity-loss/reference-cache";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Re-run if the last completed run is older than this. */
const REFRESH_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Send a staff staleness alert if no completed run within this window. */
const STALE_ALERT_THRESHOLD_MS = 45 * 24 * 60 * 60 * 1000; // 45 days

/** Delay after server boot before the first check (ms). */
const BOOT_DELAY_MS = 90 * 1000; // 90 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBatchRunId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  return `batch_${ts}`;
}

/** Returns the most recent batch run row (any status), or null. */
async function getLatestBatchRun(client: pg.PoolClient): Promise<{
  batch_run_id: string;
  started_at: Date;
  completed_at: Date | null;
  status: string;
} | null> {
  const { rows } = await client.query(
    `SELECT batch_run_id, started_at, completed_at, status
     FROM equity_loss_national_batch_runs
     ORDER BY started_at DESC LIMIT 1`,
  );
  return rows[0] ?? null;
}

/** Returns the most recent COMPLETED batch run row, or null. */
async function getLatestCompletedBatchRun(client: pg.PoolClient): Promise<{
  batch_run_id: string;
  completed_at: Date;
} | null> {
  const { rows } = await client.query(
    `SELECT batch_run_id, completed_at
     FROM equity_loss_national_batch_runs
     WHERE status = 'completed'
     ORDER BY completed_at DESC LIMIT 1`,
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Core batch runner (extracted so it can be called from scheduler and
// potentially tested independently).
//
// Key difference from scripts/compute-nationwide-equity-loss.ts:
//   All snapshot upserts run inside a SINGLE DB transaction. If anything
//   fails fatally, the transaction is rolled back before the batch_run_id
//   row is marked 'failed'. This preserves the previous completed run's
//   snapshot rows so the API keeps serving them unchanged.
// ---------------------------------------------------------------------------

async function runEquityLossNationwideBatch(pool: pg.Pool): Promise<void> {
  const wallStart = Date.now();
  const batchRunId = makeBatchRunId();

  // Use one client for the audit row writes (outside the main transaction)
  // so 'running' and 'failed'/'completed' statuses are always visible.
  const auditClient = await pool.connect();

  console.log(`[equity-loss-scheduler] Starting batch run ${batchRunId}`);

  // Insert 'running' batch row (outside the snapshot transaction)
  await auditClient.query(
    `INSERT INTO equity_loss_national_batch_runs
       (batch_run_id, started_at, status)
     VALUES ($1, now(), 'running')`,
    [batchRunId],
  );

  let countiesAttempted = 0;
  let countiesSucceeded = 0;
  let countriesSuppressed = 0;
  let countriesFailed = 0;
  const failureReasons: string[] = [];

  // Use a second client for the transactional snapshot writes
  const txClient = await pool.connect();

  try {
    // Begin transaction — all upserts land atomically or roll back together
    await txClient.query("BEGIN");

    // -----------------------------------------------------------------------
    // Step 1: Load county list
    // -----------------------------------------------------------------------
    console.log("[equity-loss-scheduler] Loading county list from rucc_county_codes...");
    const { rows: allCounties } = await txClient.query<{
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
    console.log(`[equity-loss-scheduler] ${allCounties.length} counties found`);

    // -----------------------------------------------------------------------
    // Step 2: Bulk-fetch ACS (3 Census API calls)
    // -----------------------------------------------------------------------
    console.log("[equity-loss-scheduler] Fetching all-county ACS data...");
    const acsStart = Date.now();
    const acsMap = await fetchAllCountiesAcs();
    console.log(
      `[equity-loss-scheduler] ACS bulk fetch done: ${acsMap.size} counties in ${Math.round((Date.now() - acsStart) / 1000)}s`,
    );

    // -----------------------------------------------------------------------
    // Step 3: Bulk-fetch USALEEP (2 Socrata paginated calls)
    // -----------------------------------------------------------------------
    console.log("[equity-loss-scheduler] Fetching all-tract USALEEP data...");
    const usaleepStart = Date.now();
    const usaleepMap = await fetchAllUsaleepTracts();
    console.log(
      `[equity-loss-scheduler] USALEEP bulk fetch done: ${usaleepMap.size} counties in ${Math.round((Date.now() - usaleepStart) / 1000)}s`,
    );

    // -----------------------------------------------------------------------
    // Step 4: Warm national reference
    // -----------------------------------------------------------------------
    console.log("[equity-loss-scheduler] Warming national reference...");
    const nationalRef = await getNationalReference().catch(() => null);
    console.log(`[equity-loss-scheduler] National reference: ${nationalRef}`);

    const stateRefCache = new Map<string, number | null>();
    const peerRefCache = new Map<string, number | null>();

    // -----------------------------------------------------------------------
    // Step 5: Per-county computation + buffered upsert (inside transaction)
    // -----------------------------------------------------------------------
    console.log("[equity-loss-scheduler] Starting per-county computation...");
    const computeStart = Date.now();
    const BATCH_SIZE = 100;

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
        await txClient.query(
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

      if (countiesAttempted % 200 === 0) {
        console.log(
          `[equity-loss-scheduler] Progress: ${countiesAttempted}/${allCounties.length} ` +
          `(succeeded=${countiesSucceeded} suppressed=${countriesSuppressed} failed=${countriesFailed})`,
        );
      }

      try {
        const acs = acsMap.get(county_fips);
        const usaleepKey = `${county_name}, ${state_abbrev}`;
        const tracts = usaleepMap.get(usaleepKey) ?? [];

        const ruralityBand = ruralityBandFromRucc(rucc_code);
        const decadalGrowthPct = acs?.decadalGrowthPct ?? 0;
        const growthBand = growthBandFromPct(decadalGrowthPct);
        const peerKey = peerClassKey(ruralityBand, growthBand, census_region);

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

        if (!stateRefCache.has(state_fips)) {
          const ref = await getStateReference(state_fips, state_abbrev).catch(() => null);
          stateRefCache.set(state_fips, ref);
        }
        const stateRef = stateRefCache.get(state_fips) ?? null;

        if (!peerRefCache.has(peerKey)) {
          const ref = await getPeerClassReference(peerKey).catch(() => null);
          peerRefCache.set(peerKey, ref);
        }
        const peerRef = peerRefCache.get(peerKey) ?? null;

        const references: FrameReferences = {
          vsParentCounty: nationalRef,
          vsState: stateRef,
          vsNationalPeerClass: peerRef,
        };

        const frames = computeAllFrames(inputs, references);

        const allSuppressed =
          frames.vsParentCounty.suppressed &&
          frames.vsState.suppressed &&
          frames.vsNationalPeerClass.suppressed;

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

        if (upsertBuffer.length >= BATCH_SIZE * 3) {
          await flushBuffer();
        }
      } catch (e) {
        countriesFailed++;
        const msg = `${county_fips} (${county_name}, ${state_abbrev}): ${(e as Error).message}`;
        failureReasons.push(msg);
        if (countriesFailed <= 10) {
          console.warn(`[equity-loss-scheduler] FAILED county: ${msg}`);
        }
      }
    }

    // Flush any remaining rows
    await flushBuffer();

    // Commit the transaction — all snapshot rows land atomically
    await txClient.query("COMMIT");

    const wallSeconds = Math.round((Date.now() - wallStart) / 1000);
    const computeSeconds = Math.round((Date.now() - computeStart) / 1000);

    // -----------------------------------------------------------------------
    // Step 6: Mark batch run as completed (outside transaction, always visible)
    // -----------------------------------------------------------------------
    await auditClient.query(
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

    console.log("\n[equity-loss-scheduler] ====== BATCH COMPLETE ======");
    console.log(`  Batch run ID:        ${batchRunId}`);
    console.log(`  Counties attempted:  ${countiesAttempted}`);
    console.log(`  Counties succeeded:  ${countiesSucceeded}`);
    console.log(`  Counties suppressed: ${countriesSuppressed}`);
    console.log(`  Counties failed:     ${countriesFailed}`);
    console.log(`  Compute time:        ${computeSeconds}s`);
    console.log(`  Total wall time:     ${wallSeconds}s`);
    if (failureReasons.length > 0) {
      console.log(`  First failures:      ${failureReasons.slice(0, 3).join("; ")}`);
    }
  } catch (fatalError) {
    // Roll back all snapshot upserts — previous completed run's data is preserved
    await txClient.query("ROLLBACK").catch(() => {});

    console.error("[equity-loss-scheduler] FATAL ERROR — rolling back snapshot upserts:", fatalError);
    const wallSeconds = Math.round((Date.now() - wallStart) / 1000);

    // Mark batch as failed in the audit table (outside the rolled-back transaction)
    await auditClient
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
      .catch((e) => {
        console.error("[equity-loss-scheduler] Failed to write 'failed' audit row:", e);
      });

    console.log(
      `[equity-loss-scheduler] Batch ${batchRunId} marked FAILED after ${wallSeconds}s. ` +
      `Previous completed run's snapshot data is preserved and continues to be served.`,
    );

    throw fatalError; // Re-throw so the scheduler caller can send the staleness alert
  } finally {
    txClient.release();
    auditClient.release();
  }
}

// ---------------------------------------------------------------------------
// Staleness alert
// ---------------------------------------------------------------------------

async function sendStalenessAlert(lastCompletedAt: Date | null): Promise<void> {
  try {
    const { sendEcosystemUpdate } = await import("./email-service");
    const subject = "[ALERT] Nationwide Equity-Loss snapshot is stale (>45 days without a completed run)";
    const lastRunStr = lastCompletedAt
      ? lastCompletedAt.toISOString()
      : "Never (no completed run exists)";
    const html = `
      <div style="max-width:600px;font-family:Arial,sans-serif">
        <div style="background:#c53030;color:white;padding:16px;border-radius:6px 6px 0 0">
          <h2 style="margin:0;font-size:18px">Nationwide Equity-Loss Snapshot — Stale</h2>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9">No completed batch run in the last 45 days</p>
        </div>
        <div style="padding:16px;border:1px solid #ddd;border-top:none;background:white">
          <p style="color:#c53030;font-weight:bold">
            ⚠ The nationwide equity-loss snapshot has not been refreshed in over 45 days.
            County-level inequality data served by <code>/api/equity-loss/national</code>
            may be significantly stale.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
            <tr>
              <td style="padding:6px 10px;color:#666;white-space:nowrap">Staleness threshold:</td>
              <td style="padding:6px 10px">45 days</td>
            </tr>
            <tr style="background:#f5f5f5">
              <td style="padding:6px 10px;color:#666">Last completed run:</td>
              <td style="padding:6px 10px">${lastRunStr}</td>
            </tr>
            <tr>
              <td style="padding:6px 10px;color:#666">Detected at:</td>
              <td style="padding:6px 10px">${new Date().toISOString()}</td>
            </tr>
            <tr style="background:#f5f5f5">
              <td style="padding:6px 10px;color:#666">Batch runs table:</td>
              <td style="padding:6px 10px;font-family:monospace">equity_loss_national_batch_runs</td>
            </tr>
          </table>
          <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;border-radius:4px;margin-top:12px">
            <strong>Recommended actions:</strong>
            <ol style="margin:8px 0 0;padding-left:18px;font-size:13px">
              <li>Check server logs for <code>[equity-loss-scheduler]</code> errors around recent batch runs</li>
              <li>Verify Census ACS and USALEEP (Socrata) APIs are reachable from this server</li>
              <li>Trigger a manual run via: <code>npx tsx scripts/compute-nationwide-equity-loss.ts</code></li>
              <li>Check <code>GET /api/equity-loss/national/summary</code> for the last dataAsOf timestamp</li>
            </ol>
          </div>
          <p style="font-size:12px;color:#888;margin-top:16px">
            Generated by the server-side equity-loss staleness check (server/equity-loss-national-scheduler.ts).
            This alert fires once per scheduler cycle when no completed run exists within the staleness window.
          </p>
        </div>
      </div>
    `;
    await sendEcosystemUpdate(subject, html);
    console.warn("[equity-loss-scheduler] Staleness alert email sent to staff.");
  } catch (emailErr: any) {
    console.warn(
      "[equity-loss-scheduler] Staleness alert email failed (non-fatal):",
      emailErr?.message ?? emailErr,
    );
  }
}

// ---------------------------------------------------------------------------
// Exported scheduler — called once from server/index.ts at boot
// ---------------------------------------------------------------------------

export function scheduleEquityLossNationwideRefresh(): void {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  async function checkAndRun(): Promise<void> {
    const client = await pool.connect();
    let lastCompletedAt: Date | null = null;

    try {
      const latestAny = await getLatestBatchRun(client);
      const latestCompleted = await getLatestCompletedBatchRun(client);

      lastCompletedAt = latestCompleted?.completed_at ?? null;

      // If a run is currently in progress (started < 3h ago), skip
      if (latestAny && latestAny.status === "running") {
        const ageMs = Date.now() - new Date(latestAny.started_at).getTime();
        if (ageMs < 3 * 60 * 60 * 1000) {
          console.log(
            `[equity-loss-scheduler] A batch run is already in progress (started ${Math.round(ageMs / 60000)}m ago), skipping.`,
          );
          return;
        }
        // Stale 'running' row (> 3h old without completing) — treat as failed and proceed
        console.warn(
          `[equity-loss-scheduler] Stale 'running' row detected (${Math.round(ageMs / 60000)}m old) — proceeding with fresh run.`,
        );
      }

      // Check if the last completed run is recent enough
      if (latestCompleted) {
        const ageMs = Date.now() - new Date(latestCompleted.completed_at).getTime();
        if (ageMs < REFRESH_INTERVAL_MS) {
          const ageDays = Math.round(ageMs / (24 * 60 * 60 * 1000));
          console.log(
            `[equity-loss-scheduler] Nationwide equity-loss snapshot is recent enough ` +
            `(last completed run: ${latestCompleted.completed_at.toISOString()}, ${ageDays} day(s) ago) — skipping.`,
          );
          // Still check staleness alert threshold (shouldn't fire if recent, but defensive)
          if (ageMs > STALE_ALERT_THRESHOLD_MS) {
            console.warn("[equity-loss-scheduler] Snapshot is beyond 45-day staleness threshold — sending staff alert.");
            await sendStalenessAlert(lastCompletedAt);
          }
          return;
        }
        const ageDays = Math.round(ageMs / (24 * 60 * 60 * 1000));
        console.log(
          `[equity-loss-scheduler] Last completed run is ${ageDays} day(s) old — starting refresh.`,
        );
      } else {
        console.log("[equity-loss-scheduler] No completed batch run found — starting initial run.");
      }
    } finally {
      client.release();
    }

    // Run the batch
    try {
      await runEquityLossNationwideBatch(pool);
    } catch (err: any) {
      console.error("[equity-loss-scheduler] Batch run failed:", err?.message ?? err);
      // Check staleness and alert
      if (!lastCompletedAt || Date.now() - lastCompletedAt.getTime() > STALE_ALERT_THRESHOLD_MS) {
        console.warn("[equity-loss-scheduler] No recent completed run after failure — sending staff staleness alert.");
        await sendStalenessAlert(lastCompletedAt);
      }
    }
  }

  // Boot-delay: 90 seconds to let the server settle before the first check
  setTimeout(async () => {
    try {
      await checkAndRun();
    } catch (err: any) {
      console.error("[equity-loss-scheduler] Unexpected error in boot check:", err?.message ?? err);
    }

    // Re-check every 30 days
    setInterval(async () => {
      try {
        await checkAndRun();
      } catch (err: any) {
        console.error("[equity-loss-scheduler] Unexpected error in scheduled check:", err?.message ?? err);
      }
    }, REFRESH_INTERVAL_MS);
  }, BOOT_DELAY_MS);

  console.log(
    `[equity-loss-scheduler] Nationwide equity-loss monthly refresh scheduler initialized ` +
    `(boot delay: ${BOOT_DELAY_MS / 1000}s, interval: 30 days).`,
  );
}
