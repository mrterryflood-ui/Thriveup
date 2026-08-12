/**
 * CEDS — Comprehensive Economic Development Strategy Routes
 * Routes every assessment, proposal section, and community intelligence output
 * through EDA's regional framework.
 *
 * GET  /api/ceds/regions          — list all, filter by ?state=TX or ?countyFips=48453
 * GET  /api/ceds/regions/:id      — single region + goals + alignments
 * GET  /api/ceds/lookup           — county FIPS or state → matching region(s)
 * GET  /api/ceds/framework        — EDA's 5 universal performance measures (no auth)
 * POST /api/ceds/align            — given a program description, return matching goals + proposal language
 */

import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { cedsRegions, cedsGoals, cedsAlignments } from "@shared/schema";
import { eq, inArray, or, ilike, sql } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";
import { requireAuth } from "./tenant-middleware";
import { z } from "zod";

// EDA's 5 mandatory performance measures — constant for ALL CEDS
export const EDA_PERFORMANCE_MEASURES = [
  {
    id: "PM1",
    label: "Jobs Created",
    description: "Number of full-time equivalent jobs created as a direct result of EDA investments.",
    unit: "FTE jobs",
    edaWeight: "primary",
  },
  {
    id: "PM2",
    label: "Jobs Retained",
    description: "Number of full-time equivalent jobs retained that would otherwise have been lost.",
    unit: "FTE jobs",
    edaWeight: "primary",
  },
  {
    id: "PM3",
    label: "Private Investment Leveraged",
    description: "Dollar amount of private investment directly attributed to EDA-funded projects.",
    unit: "USD",
    edaWeight: "primary",
  },
  {
    id: "PM4",
    label: "Construction/Infrastructure Jobs",
    description: "Number of construction and related jobs created through EDA-funded infrastructure projects.",
    unit: "construction jobs",
    edaWeight: "secondary",
  },
  {
    id: "PM5",
    label: "Businesses Assisted",
    description: "Number of businesses that received direct assistance (capital, technical assistance, training).",
    unit: "businesses",
    edaWeight: "secondary",
  },
] as const;

// EDA's CEDS strategic categories
export const CEDS_CATEGORIES = [
  { id: "workforce", label: "Workforce & Human Capital", description: "Education, training, and talent pipelines" },
  { id: "innovation", label: "Innovation & Entrepreneurship", description: "Business formation, tech transfer, incubation" },
  { id: "infrastructure", label: "Infrastructure & Place-Making", description: "Transportation, broadband, utilities, housing" },
  { id: "economic_base", label: "Economic Base & Industry Diversification", description: "Industry clusters, supply chains, exports" },
  { id: "quality_of_life", label: "Quality of Life & Community Resilience", description: "Health, safety, arts, civic capacity, disaster preparedness" },
] as const;

// In-memory per-IP rate limiter for the expensive AI /align endpoint.
// Re-creates on process restart, which is acceptable — the floor is "no public
// abuse vector against a cost-bearing AI call." `req.ip` is reliable because
// `app.set('trust proxy', 1)` is set at boot; we never read raw x-forwarded-for.
const cedsAlignBuckets = new Map<string, { count: number; resetAt: number }>();
const CEDS_ALIGN_MAX = 15;                    // requests per IP per window
const CEDS_ALIGN_WINDOW_MS = 10 * 60 * 1000;  // 10 minutes

function cedsAlignRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown"; // trust proxy already set
  const now = Date.now();
  const key = `ceds-align:${ip}`;
  const b = cedsAlignBuckets.get(key);
  if (!b || b.resetAt < now) {
    cedsAlignBuckets.set(key, { count: 1, resetAt: now + CEDS_ALIGN_WINDOW_MS });
    return next();
  }
  if (b.count >= CEDS_ALIGN_MAX) {
    const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSec));
    return res.status(429).json({ error: `Too many alignment requests. Try again in ${retryAfterSec}s.` });
  }
  b.count += 1;
  return next();
}

export function registerCedsRoutes(app: Express) {

  // ── EDA framework (public, no auth) ─────────────────────────────────────────
  app.get("/api/ceds/framework", (_req: Request, res: Response) => {
    res.json({
      performanceMeasures: EDA_PERFORMANCE_MEASURES,
      categories: CEDS_CATEGORIES,
      edaSource: "https://www.eda.gov/funding/programs/comprehensive-economic-development-strategies",
      notes: "All CEDS-compliant proposals must address EDA's 5 performance measures. Categories are standard EDA content guidelines.",
    });
  });

  // ── List regions (public) ────────────────────────────────────────────────────
  app.get("/api/ceds/regions", async (req: Request, res: Response) => {
    try {
      const { state, countyFips, search } = req.query;
      let query = db.select().from(cedsRegions);

      const rows = await db.select().from(cedsRegions);
      let filtered = rows;

      if (state) filtered = filtered.filter(r => r.state === String(state).toUpperCase());
      if (countyFips) {
        const fips = String(countyFips);
        filtered = filtered.filter(r => r.countyFips?.includes(fips));
      }
      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter(r =>
          r.eddName.toLowerCase().includes(q) ||
          r.eddAbbr?.toLowerCase().includes(q) ||
          r.countyNames?.some(c => c.toLowerCase().includes(q))
        );
      }

      res.json({ regions: filtered, total: filtered.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Single region with goals + alignments ────────────────────────────────────
  app.get("/api/ceds/regions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const [region] = await db.select().from(cedsRegions).where(eq(cedsRegions.id, id));
      if (!region) return res.status(404).json({ error: "Region not found" });

      const goals = await db.select().from(cedsGoals).where(eq(cedsGoals.regionId, id));
      const alignments = await db.select().from(cedsAlignments).where(eq(cedsAlignments.regionId, id));

      res.json({ region, goals, alignments, performanceMeasures: EDA_PERFORMANCE_MEASURES });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Lookup by county FIPS or state ───────────────────────────────────────────
  app.get("/api/ceds/lookup", async (req: Request, res: Response) => {
    try {
      const { fips, state, county } = req.query;
      const rows = await db.select().from(cedsRegions);
      let matches = rows;

      if (fips) {
        const f = String(fips).padStart(5, "0");
        matches = rows.filter(r => r.countyFips?.includes(f));
      } else if (state) {
        matches = rows.filter(r => r.state === String(state).toUpperCase());
      } else if (county) {
        const q = String(county).toLowerCase();
        matches = rows.filter(r => r.countyNames?.some(c => c.toLowerCase().includes(q)));
      }

      if (!matches.length) {
        return res.json({ regions: [], message: "No CEDS region found for this geography. EDA framework applies universally." });
      }

      // Fetch goals for matched regions
      const regionIds = matches.map(r => r.id);
      const goals = regionIds.length
        ? await db.select().from(cedsGoals).where(inArray(cedsGoals.regionId, regionIds))
        : [];
      const alignments = regionIds.length
        ? await db.select().from(cedsAlignments).where(inArray(cedsAlignments.regionId, regionIds))
        : [];

      res.json({
        regions: matches,
        goals,
        alignments,
        performanceMeasures: EDA_PERFORMANCE_MEASURES,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── AI alignment: given org/program description → CEDS match + proposal language ─
  app.post("/api/ceds/align", requireAuth, cedsAlignRateLimit, async (req: Request, res: Response) => {
    try {
      const { programDescription, grantId, targetState, targetCountyFips } = z.object({
        programDescription: z.string().min(20),
        grantId: z.string().optional(),
        targetState: z.string().length(2).optional(),
        targetCountyFips: z.string().optional(),
      }).parse(req.body);

      // Get CEDS context for geography
      const rows = await db.select().from(cedsRegions);
      let regions = rows;
      if (targetCountyFips) regions = rows.filter(r => r.countyFips?.includes(targetCountyFips));
      else if (targetState) regions = rows.filter(r => r.state === targetState.toUpperCase());

      const regionIds = regions.map(r => r.id);
      const goals = regionIds.length
        ? await db.select().from(cedsGoals).where(inArray(cedsGoals.regionId, regionIds))
        : [];

      const cedsContext = regions.map(r => ({
        region: r.eddName,
        vision: r.strategicVision,
        goals: goals.filter(g => g.regionId === r.id).map(g => `${g.goalTitle}: ${g.goalDescription}`),
      }));

      const cedsSystemPrompt = `You are a CEDS alignment specialist. Map the described program to EDA's Comprehensive Economic Development Strategy framework.
EDA's 5 Performance Measures: ${EDA_PERFORMANCE_MEASURES.map(m => `${m.id}: ${m.label}`).join(" | ")}
CEDS Categories: ${CEDS_CATEGORIES.map(c => c.label).join(" | ")}
Regional CEDS context: ${JSON.stringify(cedsContext).slice(0, 2000)}

Return JSON with:
- primaryMeasures: array of EDA measure IDs (PM1-PM5) this program addresses
- categories: array of CEDS category IDs
- alignmentScore: 1-5
- proposalLanguage: ready-to-paste paragraph for grant proposal (200 words max, references EDA measures by name)
- regionalGoalMatches: array of {goalTitle, alignmentNote} from regional CEDS
- evidenceAnchor: one primary data point to cite (Census, BLS, etc.)`;
      const result = await generateAIJSON(`Program description: ${programDescription}`, cedsSystemPrompt);

      res.json({ alignment: result, cedsRegions: regions, goals });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
}
