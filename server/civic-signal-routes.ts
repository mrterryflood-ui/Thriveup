/**
 * civic-signal-routes.ts
 *
 * Public-facing surface for the ThriveUp <-> Civic Signal bidirectional
 * connector (server/civic-signal-connector.ts). Mounted at /api/civic-signal.
 *
 * Inbound webhook (POST /api/chainweb/webhook/civic-signal) already exists
 * in chainweb-routes.ts and is unaffected by this file.
 */
import { Router, type NextFunction, type Request, type Response } from "express";
import { storage } from "./storage";
import {
  getCivicSignalLessonsAsync,
  fetchCivicSignalAdaptations,
  pushEquityLossToCivicSignal,
  checkCivicSignalConnection,
} from "./civic-signal-connector";
import { computeAllFrames, type FrameReferences, type UnitInputs } from "./equity-loss/equity-loss-engine";
import { fetchCountyAcs } from "./equity-loss/acs-county-source";
import { fetchUsaleepTractsForCounty } from "./equity-loss/usaleep-source";
import { classifyCounty, growthBandFromPct, peerClassKey } from "./equity-loss/peer-class";
import { getNationalReference, getStateReference, getPeerClassReference } from "./equity-loss/reference-cache";

const router = Router();
const CIVIC_OPERATOR_ROLES = new Set(["admin", "teacher", "super_admin", "program_director", "case_manager"]);
const CIVIC_STATE_CODES = new Set([
  "US", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
  "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR",
  "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "AS", "GU", "MP", "PR", "VI",
]);

async function requireCivicSignalOperator(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  const user = await storage.getUser(userId);
  if (!user || !CIVIC_OPERATOR_ROLES.has(user.role)) {
    return res.status(403).json({ error: "Authorized operator role required" });
  }
  next();
}

// GET /api/civic-signal/status — live reachability check, never fabricated.
router.get("/status", async (_req, res) => {
  try {
    const status = await checkCivicSignalConnection();
    res.json(status);
  } catch (e) {
    res.status(502).json({ outboundReachable: false, outboundDetail: (e as Error).message, inboundLessonsStored: 0 });
  }
});

// GET /api/civic-signal/lessons — lessons already received via the webhook.
router.get("/lessons", async (req, res) => {
  const topic = typeof req.query.topic === "string" ? req.query.topic : undefined;
  const state = typeof req.query.state === "string" ? req.query.state : undefined;
  try {
    const lessons = await getCivicSignalLessonsAsync({ topic, state, limit: 25 });
    res.json({ lessons });
  } catch (e) {
    console.error("[civic-signal] durable lessons read failed:", e);
    res.status(502).json({ error: "Civic Signal lessons are temporarily unavailable." });
  }
});

// GET /api/civic-signal/adaptations?topic=&state= — live pull, falls back to cache on failure (never fabricates).
router.get("/adaptations", async (req, res) => {
  const topic = typeof req.query.topic === "string" ? req.query.topic : "general";
  const state = typeof req.query.state === "string" ? req.query.state : undefined;
  if (!topic.trim() || topic.length > 100) {
    return res.status(400).json({ adaptations: [], source: "validation_error", error: "topic must be 1-100 characters" });
  }
  if (state && !CIVIC_STATE_CODES.has(state.toUpperCase())) {
    return res.status(400).json({ adaptations: [], source: "validation_error", error: "state must be US or a valid USPS state/territory code" });
  }
  try {
    const result = await fetchCivicSignalAdaptations({ topic, state });
    res.json(result);
  } catch (e) {
    res.status(502).json({ adaptations: [], source: "error", error: (e as Error).message });
  }
});

// POST /api/civic-signal/push-equity-loss/:stateFips/:countyFips
// Computes fresh equity-loss frames for the county (same pipeline as
// /api/equity-loss) and pushes each non-suppressed frame to Civic Signal.
router.post("/push-equity-loss/:stateFips/:countyFips", requireCivicSignalOperator, async (req, res) => {
  if (!/^\d{1,2}$/.test(String(req.params.stateFips)) || !/^\d{1,3}$/.test(String(req.params.countyFips))) {
    return res.status(400).json({ error: "State and county FIPS must contain only digits." });
  }
  const stateFips = String(req.params.stateFips).padStart(2, "0");
  const countyFipsShort = String(req.params.countyFips).padStart(3, "0");
  const countyFips = `${stateFips}${countyFipsShort}`;

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
    };

    const growthBand = growthBandFromPct(acs.decadalGrowthPct);
    const peerKey = peerClassKey(classification.ruralityBand, growthBand, classification.censusRegion);
    const [nationalRef, stateRef, peerRef] = await Promise.all([
      getNationalReference().catch(() => null),
      getStateReference(stateFips, classification.stateAbbrev).catch(() => null),
      getPeerClassReference(peerKey).catch(() => null),
    ]);
    const references: FrameReferences = { vsParentCounty: nationalRef, vsState: stateRef, vsNationalPeerClass: peerRef };
    const frames = computeAllFrames(inputs, references);

    const pushResults: Record<string, { pushed: boolean; message: string }> = {};
    for (const [name, row] of Object.entries(frames)) {
      if (name === "divergencePct" || name === "divergenceInterpretation") continue;
      const r = row as any;
      if (r.suppressed || r.overallLossPct === null) {
        pushResults[name] = { pushed: false, message: `Not pushed — frame suppressed (${r.suppressionReason})` };
        continue;
      }
      pushResults[name] = await pushEquityLossToCivicSignal({
        countyFips,
        countyName: classification.countyName,
        state: classification.stateAbbrev,
        frame: r.frame,
        overallLossPct: r.overallLossPct,
        referenceLossPct: r.referenceLossPct,
        divergenceFromReferencePct: r.divergenceFromReferencePct,
        tier: r.tier,
        assumptionText: r.assumptionText,
      });
    }

    res.json({ county: { fips: countyFips, name: classification.countyName, state: classification.stateAbbrev }, pushResults });
  } catch (e) {
    console.error("[civic-signal] push-equity-loss failed:", e);
    res.status(502).json({ error: "Failed to compute or push equity-loss result", detail: (e as Error).message });
  }
});

export default router;
