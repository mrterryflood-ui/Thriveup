/**
 * equity-loss-national-routes.ts
 *
 * Read-only API for browsing the nationwide equity-loss snapshot table
 * populated by scripts/compute-nationwide-equity-loss.ts.
 *
 * Mounted at /api/equity-loss/national (via equity-loss-routes.ts).
 *
 * Endpoints:
 *   GET /api/equity-loss/national
 *     Paginated list of county snapshot rows.
 *     Query params: frame, state, sort, dir, page, pageSize, search
 *   GET /api/equity-loss/national/summary
 *     Aggregate stats from the latest completed batch run.
 *   GET /api/equity-loss/national/state/:stateAbbrev
 *     All frames for counties in a given state (no pagination — max ~254 TX counties).
 */

import { Router } from "express";
import pg from "pg";

const router = Router();
const dbPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_FRAMES = new Set(["vs_parent_county", "vs_state", "vs_national_peer_class"]);
const VALID_SORT_COLS = new Set(["overall_loss_pct", "county_name", "state_abbrev", "hdi", "ihdi"]);
const VALID_DIRS = new Set(["asc", "desc"]);
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

/** Return the most recently completed batch run, or null if none exists. */
async function getLatestCompletedBatch(
  client: pg.PoolClient,
): Promise<{ batch_run_id: string; completed_at: Date; counties_succeeded: number; counties_suppressed: number; counties_failed: number; counties_attempted: number } | null> {
  const { rows } = await client.query(
    `SELECT batch_run_id, completed_at, counties_succeeded, counties_suppressed,
            counties_failed, counties_attempted
     FROM equity_loss_national_batch_runs
     WHERE status = 'completed'
     ORDER BY completed_at DESC LIMIT 1`,
  );
  return rows[0] ?? null;
}

// Per-IP rate limiter — the national list endpoint reads from DB but serves
// potentially large pages; keep it at 60/min which is generous for browse use.
const nationalRateHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 60;
  const hits = (nationalRateHits.get(ip) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  nationalRateHits.set(ip, hits);
  return hits.length > max;
}

// ---------------------------------------------------------------------------
// GET /api/equity-loss/national/summary
// Must be declared BEFORE /national/:stateAbbrev or Express would shadow it.
// ---------------------------------------------------------------------------
router.get("/summary", async (req, res) => {
  const ip = req.ip || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  const client = await dbPool.connect();
  try {
    const batch = await getLatestCompletedBatch(client);
    if (!batch) {
      return res.json({
        noDataYet: true,
        message:
          "No completed nationwide batch run found. Run scripts/compute-nationwide-equity-loss.ts to populate the snapshot.",
      });
    }

    // Per-state breakdown: distinct county count (vs_parent_county = one row per county)
    const { rows: stateRows } = await client.query(
      `SELECT state_abbrev,
              COUNT(DISTINCT county_fips) AS county_count,
              COUNT(DISTINCT county_fips) FILTER (WHERE suppressed = false) AS succeeded_count,
              AVG(overall_loss_pct) FILTER (WHERE frame = 'vs_national_peer_class' AND suppressed = false) AS avg_loss
       FROM equity_loss_national_snapshot
       WHERE batch_run_id = $1
       GROUP BY state_abbrev
       ORDER BY state_abbrev`,
      [batch.batch_run_id],
    );

    const stateBreakdown: Record<string, { countyCount: number; succeededCount: number; avgLoss: number | null }> = {};
    for (const r of stateRows) {
      stateBreakdown[r.state_abbrev] = {
        countyCount: parseInt(r.county_count, 10),
        succeededCount: parseInt(r.succeeded_count, 10),
        avgLoss: r.avg_loss !== null ? parseFloat(r.avg_loss) : null,
      };
    }

    // Aggregate stats for the vs_national_peer_class frame (most comparable cross-state)
    const { rows: aggRows } = await client.query(
      `SELECT
         COUNT(DISTINCT county_fips) AS distinct_counties,
         COUNT(DISTINCT county_fips) FILTER (WHERE suppressed = true) AS suppressed_counties,
         MIN(overall_loss_pct) FILTER (WHERE suppressed = false) AS min_loss,
         MAX(overall_loss_pct) FILTER (WHERE suppressed = false) AS max_loss,
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY overall_loss_pct)
           FILTER (WHERE suppressed = false AND overall_loss_pct IS NOT NULL) AS median_loss
       FROM equity_loss_national_snapshot
       WHERE batch_run_id = $1 AND frame = 'vs_national_peer_class'`,
      [batch.batch_run_id],
    );
    const agg = aggRows[0];

    // Also count distinct counties across ALL frames (for the consistency check in the verify script)
    const { rows: distinctRows } = await client.query(
      `SELECT COUNT(DISTINCT county_fips) AS cnt FROM equity_loss_national_snapshot WHERE batch_run_id = $1`,
      [batch.batch_run_id],
    );

    return res.json({
      noDataYet: false,
      batchRunId: batch.batch_run_id,
      dataAsOf: batch.completed_at.toISOString(),
      totalCounties: parseInt(agg.distinct_counties, 10),
      totalSuppressed: parseInt(agg.suppressed_counties, 10),
      distinctCountiesInSnapshot: parseInt(distinctRows[0].cnt, 10),
      batchCountiesSucceeded: batch.counties_succeeded,
      batchCountiesAttempted: batch.counties_attempted,
      minLossPct: agg.min_loss !== null ? parseFloat(agg.min_loss) : null,
      maxLossPct: agg.max_loss !== null ? parseFloat(agg.max_loss) : null,
      medianLossPct: agg.median_loss !== null ? parseFloat(agg.median_loss) : null,
      stateBreakdown,
    });
  } catch (e) {
    console.error("[equity-loss-national] summary failed:", e);
    return res.status(500).json({ error: "Failed to load nationwide summary." });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// GET /api/equity-loss/national/state/:stateAbbrev
// ---------------------------------------------------------------------------
router.get("/state/:stateAbbrev", async (req, res) => {
  const ip = req.ip || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  const stateAbbrev = String(req.params.stateAbbrev).toUpperCase();
  if (!/^[A-Z]{2}$/.test(stateAbbrev)) {
    return res.status(400).json({ error: "stateAbbrev must be a 2-letter state abbreviation (e.g. IL)" });
  }

  const frame = String(req.query.frame ?? "vs_national_peer_class");
  if (!VALID_FRAMES.has(frame)) {
    return res.status(400).json({ error: `Invalid frame. Must be one of: ${[...VALID_FRAMES].join(", ")}` });
  }

  const client = await dbPool.connect();
  try {
    const batch = await getLatestCompletedBatch(client);
    if (!batch) {
      return res.json({
        noDataYet: true,
        stateAbbrev,
        rows: [],
        message: "No completed nationwide batch run found.",
      });
    }

    const { rows } = await client.query(
      `SELECT county_fips, county_name, state_abbrev, state_fips, frame,
              peer_class, hdi, ihdi, overall_loss_pct, a_health, a_education, a_income,
              divergence_pct, suppressed, suppression_reason, tier, assumption_text,
              engine_version, batch_run_id, computed_at
       FROM equity_loss_national_snapshot
       WHERE batch_run_id = $1 AND state_abbrev = $2 AND frame = $3
       ORDER BY overall_loss_pct DESC NULLS LAST, county_name ASC`,
      [batch.batch_run_id, stateAbbrev, frame],
    );

    return res.json({
      noDataYet: false,
      stateAbbrev,
      frame,
      batchRunId: batch.batch_run_id,
      dataAsOf: batch.completed_at.toISOString(),
      total: rows.length,
      rows: rows.map((r) => ({
        ...r,
        hdi: r.hdi !== null ? parseFloat(r.hdi) : null,
        ihdi: r.ihdi !== null ? parseFloat(r.ihdi) : null,
        overall_loss_pct: r.overall_loss_pct !== null ? parseFloat(r.overall_loss_pct) : null,
        a_health: r.a_health !== null ? parseFloat(r.a_health) : null,
        a_education: r.a_education !== null ? parseFloat(r.a_education) : null,
        a_income: r.a_income !== null ? parseFloat(r.a_income) : null,
        divergence_pct: r.divergence_pct !== null ? parseFloat(r.divergence_pct) : null,
      })),
    });
  } catch (e) {
    console.error("[equity-loss-national] state view failed:", e);
    return res.status(500).json({ error: "Failed to load state equity-loss data." });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// GET /api/equity-loss/national  (paginated list)
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const ip = req.ip || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  // Parse + validate query params
  const frame = String(req.query.frame ?? "vs_national_peer_class");
  if (!VALID_FRAMES.has(frame)) {
    return res.status(400).json({ error: `Invalid frame. Must be one of: ${[...VALID_FRAMES].join(", ")}` });
  }

  const state = req.query.state ? String(req.query.state).toUpperCase() : null;
  if (state && !/^[A-Z]{2}$/.test(state)) {
    return res.status(400).json({ error: "state must be a 2-letter abbreviation (e.g. TX)" });
  }

  const search = req.query.search ? String(req.query.search).trim() : null;

  const sort = String(req.query.sort ?? "overall_loss_pct");
  if (!VALID_SORT_COLS.has(sort)) {
    return res.status(400).json({ error: `Invalid sort column. Must be one of: ${[...VALID_SORT_COLS].join(", ")}` });
  }

  const dir = String(req.query.dir ?? "desc").toLowerCase();
  if (!VALID_DIRS.has(dir)) {
    return res.status(400).json({ error: "dir must be 'asc' or 'desc'" });
  }

  let page = parseInt(String(req.query.page ?? "1"), 10);
  let pageSize = parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  const client = await dbPool.connect();
  try {
    const batch = await getLatestCompletedBatch(client);
    if (!batch) {
      return res.json({
        noDataYet: true,
        rows: [],
        message:
          "No completed nationwide batch run found. Run scripts/compute-nationwide-equity-loss.ts to populate the snapshot.",
      });
    }

    // Build WHERE clauses (parameterized — never string-interpolated)
    const conditions: string[] = ["batch_run_id = $1", "frame = $2"];
    const params: any[] = [batch.batch_run_id, frame];

    if (state) {
      params.push(state);
      conditions.push(`state_abbrev = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`county_name ILIKE $${params.length}`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    // Count query
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*) as cnt FROM equity_loss_national_snapshot ${where}`,
      params,
    );
    const total = parseInt(countRows[0].cnt, 10);
    const totalPages = Math.ceil(total / pageSize);

    // Sort: NULL values always go last regardless of direction
    const sortDir = dir === "asc" ? "ASC NULLS LAST" : "DESC NULLS LAST";
    const offset = (page - 1) * pageSize;

    params.push(pageSize, offset);
    const limitClause = `LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await client.query(
      `SELECT county_fips, county_name, state_abbrev, state_fips, frame,
              peer_class, hdi, ihdi, overall_loss_pct, a_health, a_education, a_income,
              divergence_pct, suppressed, suppression_reason, tier, assumption_text,
              engine_version, computed_at
       FROM equity_loss_national_snapshot
       ${where}
       ORDER BY ${sort} ${sortDir}, county_name ASC
       ${limitClause}`,
      params,
    );

    return res.json({
      noDataYet: false,
      batchRunId: batch.batch_run_id,
      dataAsOf: batch.completed_at.toISOString(),
      frame,
      total,
      page,
      pageSize,
      totalPages,
      rows: rows.map((r) => ({
        ...r,
        hdi: r.hdi !== null ? parseFloat(r.hdi) : null,
        ihdi: r.ihdi !== null ? parseFloat(r.ihdi) : null,
        overall_loss_pct: r.overall_loss_pct !== null ? parseFloat(r.overall_loss_pct) : null,
        a_health: r.a_health !== null ? parseFloat(r.a_health) : null,
        a_education: r.a_education !== null ? parseFloat(r.a_education) : null,
        a_income: r.a_income !== null ? parseFloat(r.a_income) : null,
        divergence_pct: r.divergence_pct !== null ? parseFloat(r.divergence_pct) : null,
      })),
    });
  } catch (e) {
    console.error("[equity-loss-national] list failed:", e);
    return res.status(500).json({ error: "Failed to load nationwide equity-loss data." });
  } finally {
    client.release();
  }
});

export default router;
