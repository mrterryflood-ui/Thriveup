/**
 * equity-loss-routes.ts
 *
 * Public, county-grain Equity-Loss Engine API. Mounted at /api/equity-loss
 * (NOT /api/equity — that path is already taken by the unrelated
 * equity-routes.ts / equityRouter).
 *
 * GET /api/equity-loss/county/:stateFips/:countyFips
 *   Live ACS + USALEEP pipeline -> three-frame comparison
 *   (vs national, vs state, vs national peer class), persisted to
 *   equity_loss_results, returned as JSON.
 */
import { Router } from "express";
import pg from "pg";
import { computeAllFrames, type FrameReferences, type UnitInputs } from "./equity-loss/equity-loss-engine";
import { fetchCountyAcs } from "./equity-loss/acs-county-source";
import { fetchUsaleepTractsForCounty } from "./equity-loss/usaleep-source";
import { classifyCounty, growthBandFromPct, peerClassKey, PEER_CLASS_ASSUMPTION_TEXT } from "./equity-loss/peer-class";
import { getNationalReference, getStateReference, getPeerClassReference } from "./equity-loss/reference-cache";
import nationalRouter from "./equity-loss-national-routes";

const router = Router();
function positiveTimeout(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const dbPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: positiveTimeout("DB_CONNECTION_TIMEOUT_MS", 5_000),
  query_timeout: positiveTimeout("DB_QUERY_TIMEOUT_MS", 20_000),
  statement_timeout: positiveTimeout("DB_QUERY_TIMEOUT_MS", 20_000),
});

// Mount the nationwide browsing sub-router at /national
router.use("/national", nationalRouter);

// Lightweight in-process rate limiter — this is a public, unauthenticated
// endpoint that fans out to multiple external APIs per request.
const rateLimitHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 20;
  const hits = (rateLimitHits.get(ip) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  rateLimitHits.set(ip, hits);
  return hits.length > max;
}

router.get("/county/:stateFips/:countyFips", async (req, res) => {
  const ip = req.ip || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  const stateFips = String(req.params.stateFips).padStart(2, "0");
  const countyFipsShort = String(req.params.countyFips).padStart(3, "0");
  const countyFips = `${stateFips}${countyFipsShort}`;

  if (!/^\d{2}$/.test(stateFips) || !/^\d{3}$/.test(countyFipsShort)) {
    return res.status(400).json({ error: "stateFips must be 2 digits and countyFips must be 3 digits" });
  }

  try {
    const classification = await classifyCounty(countyFips);
    if (!classification) {
      return res.status(404).json({ error: `County FIPS ${countyFips} not found in reference table` });
    }

    const [acs, tracts] = await Promise.all([
      fetchCountyAcs(stateFips, countyFipsShort),
      fetchUsaleepTractsForCounty({
        countyFips,
        countyName: classification.countyName,
        stateAbbrev: classification.stateAbbrev,
      }),
    ]);

    const inputs: UnitInputs = {
      geoId: countyFips,
      geoLevel: "county",
      state: classification.stateAbbrev,
      countyFips,
      year: 2022,
      population: acs.population,
      decadalGrowthPct: acs.decadalGrowthPct,
      incomeDistribution: acs.incomeDistribution,
      incomeMoeRatio: acs.incomeMoeRatio,
      educationDistribution: acs.educationDistribution,
      educationMoeRatio: acs.educationMoeRatio,
      lifeExpectancyDistribution: tracts.length > 0 ? tracts.map((t) => t.lifeExpectancy) : undefined,
      healthInequalityMethod: "geographic_dispersion",
      usedUsaleepIhmeHybrid: false,
      healthValueBasis: tracts.length > 0 ? "observed" : undefined,
      sourceVintageYearsStale: new Date().getFullYear() - 2022,
    };

    const growthBand = growthBandFromPct(acs.decadalGrowthPct);
    const peerKey = peerClassKey(classification.ruralityBand, growthBand, classification.censusRegion);

    const [nationalRef, stateRef, peerRef] = await Promise.all([
      getNationalReference().catch(() => null),
      getStateReference(stateFips, classification.stateAbbrev).catch(() => null),
      getPeerClassReference(peerKey).catch(() => null),
    ]);

    const references: FrameReferences = {
      vsParentCounty: nationalRef,
      vsState: stateRef,
      vsNationalPeerClass: peerRef,
    };

    const frames = computeAllFrames(inputs, references);

    // Persist. equity_loss_results has no unique constraint on
    // (geo_id, frame, year) — a fresh row per request is intentional; this
    // is a research/reporting table, not a single-current-value cache.
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");
      for (const row of [frames.vsParentCounty, frames.vsState, frames.vsNationalPeerClass]) {
        await client.query(
          `INSERT INTO equity_loss_results
             (geo_id, geo_level, frame, race_ethnicity_stratum, year, suppressed, suppression_reason,
              hdi, ihdi, overall_loss_pct, a_health, a_education, a_income, tier, assumption_text,
              health_inequality_method, health_value_basis, goalpost_scheme, coverage_flags,
              source_vintage_years_stale, engine_version)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [
            row.geoId, row.geoLevel, row.frame, row.raceEthnicityStratum, row.year,
            row.suppressed, row.suppressionReason, row.hdi, row.ihdi, row.overallLossPct,
            row.aHealth, row.aEducation, row.aIncome, row.tier, row.assumptionText,
            row.healthInequalityMethod, row.healthValueBasis, row.goalpostScheme,
            row.coverageFlags, row.sourceVintageYearsStale, row.engineVersion,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.json({
      county: {
        fips: countyFips,
        name: classification.countyName,
        state: classification.stateAbbrev,
        ruccCode: classification.ruccCode,
        ruralityBand: classification.ruralityBand,
        censusRegion: classification.censusRegion,
        growthBand,
      },
      peerClassKey: peerKey,
      peerClassAssumption: peerRef !== null ? PEER_CLASS_ASSUMPTION_TEXT : null,
      frames,
    });
  } catch (e) {
    console.error("[equity-loss] county compute failed:", e);
    res.status(502).json({
      error: "Failed to compute equity-loss for this county (upstream data source unavailable or county not covered).",
      detail: (e as Error).message,
    });
  }
});

export default router;
