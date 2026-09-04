/**
 * childcare-routes.ts
 *
 * Public REST endpoints for the ThriveUp childcare provider intelligence layer.
 * No authentication required; all data is aggregate/provider-level (no child PII).
 *
 * Endpoints:
 *   GET /api/childcare/county/:county/overview      — summary + slot-gap + TRS profile
 *   GET /api/childcare/county/:county/providers     — full provider list (paginated)
 *   GET /api/childcare/county/:county/gap-analysis  — slot gap detail with methodology note
 *   GET /api/childcare/county/:county/quality       — Texas Rising Star quality distribution
 *
 * All endpoints are rate-limited to 30 req/min per IP using an in-process window counter.
 */

import { type Express, type Request, type Response } from "express";
import {
  getChildcareIntel,
  getChildcareIntelByFips,
  getNationalChildcareOverview,
  validateCountyFips,
  TX_COUNTY_FIPS_TO_NAME,
  type HhscProvider,
} from "./childcare-provider-intel";
import { resolveCountyInput } from "./neighborhood-routes";

// ---------------------------------------------------------------------------
// In-process rate limiter (30 req / 60 s per IP) — same pattern as chatRateLimit
// ---------------------------------------------------------------------------

const childcareRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_TRACKED_IPS = 10_000;

function checkRateLimit(req: Request, res: Response): boolean {
  const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown").replace(/^::ffff:/, "");
  const now = Date.now();
  for (const [key, value] of childcareRateLimitMap) {
    if (now >= value.resetAt) childcareRateLimitMap.delete(key);
  }
  const entry = childcareRateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    if (childcareRateLimitMap.size >= MAX_TRACKED_IPS) {
      const oldestKey = childcareRateLimitMap.keys().next().value;
      if (oldestKey) childcareRateLimitMap.delete(oldestKey);
    }
    childcareRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    res.set({
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
      "X-RateLimit-Remaining": String(RATE_LIMIT_MAX - 1),
      "X-RateLimit-Reset": String(Math.ceil((now + RATE_LIMIT_WINDOW_MS) / 1000)),
    });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    res.set({
      "Retry-After": String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))),
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
    });
    res
      .status(429)
      .json({ error: "Too many requests. Please wait a moment before retrying." });
    return false; // blocked
  }
  entry.count++;
  res.set({
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(Math.max(0, RATE_LIMIT_MAX - entry.count)),
    "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
  });
  return true; // allowed
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeCounty(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+COUNTY$/i, "").replace(/[^A-Z0-9\s\-]/g, "");
}

function badRequest(res: Response, msg: string) {
  return res.status(400).json({ error: msg });
}

function getCountyParam(req: Request): string {
  const raw = req.params["county"];
  return Array.isArray(raw) ? raw[0] : (raw ?? "");
}

function isKnownTexasCountyName(county: string): boolean {
  return Object.values(TX_COUNTY_FIPS_TO_NAME).includes(county);
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// WSRCA 9-county footprint (Workforce Solutions Rural Capital Area, TX)
// ---------------------------------------------------------------------------
const WSRCA_COUNTIES = [
  { name: "WILLIAMSON", stateFips: "48", countyFips: "491" },
  { name: "HAYS",       stateFips: "48", countyFips: "209" },
  { name: "BASTROP",    stateFips: "48", countyFips: "021" },
  { name: "CALDWELL",   stateFips: "48", countyFips: "055" },
  { name: "LEE",        stateFips: "48", countyFips: "287" },
  { name: "BURNET",     stateFips: "48", countyFips: "053" },
  { name: "LLANO",      stateFips: "48", countyFips: "299" },
  { name: "BLANCO",     stateFips: "48", countyFips: "031" },
  { name: "MILAM",      stateFips: "48", countyFips: "331" },
];

export function registerChildcareRoutes(app: Express): void {
  // ------------------------------------------------------------------
  // GET /api/childcare/wsrca/overview — all 9 WSRCA TX counties in one call
  // ------------------------------------------------------------------
  app.get("/api/childcare/wsrca/overview", async (req: Request, res: Response) => {
    if (!checkRateLimit(req, res)) return;
    try {
      const results = await Promise.all(
        WSRCA_COUNTIES.map(async ({ name, stateFips, countyFips }) => {
          try {
            const intel = await getChildcareIntelByFips(stateFips, countyFips, name);
            return {
              county: name,
              stateFips,
              countyFips,
              totalProviders: intel.summary.totalProviders,
              licensedProviders: intel.summary.licensedProviders,
              totalLicensedCapacity: intel.summary.totalLicensedCapacity,
              estimatedDemand: intel.slotGap.estimatedDemand,
              slotGap: intel.slotGap.slotGap,
              coverageRate: intel.slotGap.coverageRate,
              nonStandardHoursCount: intel.summary.nonStandardHoursCount,
              dataSource: intel.summary.dataSource,
              retrievedAt: intel.summary.retrievedAt,
              warnings: intel.warnings,
            };
          } catch (err: any) {
            return {
              county: name,
              stateFips,
              countyFips,
              error: err?.message ?? "unavailable",
            };
          }
        }),
      );
      return res.json({
        footprint: "WSRCA — Workforce Solutions Rural Capital Area",
        counties: results,
        retrievedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("[childcare] wsrca overview error:", err?.message);
      return res.status(502).json({ error: "WSRCA childcare data temporarily unavailable." });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/childcare/national-overview — state comparison + economic context
  // ------------------------------------------------------------------
  app.get("/api/childcare/national-overview", async (req: Request, res: Response) => {
    if (!checkRateLimit(req, res)) return;
    try {
      const overview = await getNationalChildcareOverview();
      return res.json(overview);
    } catch (err: any) {
      console.error("[childcare] national overview error:", err?.message);
      return res.status(502).json({
        error: "National childcare data is temporarily unavailable. Please try again.",
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/childcare/fips/:stateFips/:countyFips — nationwide by FIPS
  // ------------------------------------------------------------------
  app.get(
    "/api/childcare/fips/:stateFips/:countyFips",
    async (req: Request, res: Response) => {
      if (!checkRateLimit(req, res)) return;
      const stateFips = String(req.params["stateFips"] ?? "").trim().padStart(2, "0");
      const countyFips = String(req.params["countyFips"] ?? "").trim().padStart(3, "0");
      const isKnownState = ["01","02","04","05","06","08","09","10","11","12","13","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","44","45","46","47","48","49","50","51","53","54","55","56"].includes(stateFips);
      const isNonZeroCounty = /^\d{3}$/.test(countyFips) && countyFips !== "000";
      const isKnownTexasCounty = stateFips !== "48" || Boolean(TX_COUNTY_FIPS_TO_NAME[countyFips]);
      if (!/^\d{2}$/.test(stateFips) || !isKnownState || !isNonZeroCounty || !isKnownTexasCounty) {
        return res.status(400).json({
          error: "stateFips and countyFips must identify a known U.S. county.",
        });
      }
      const geography = await validateCountyFips(stateFips, countyFips);
      if (geography === "unavailable") {
        return res.status(503).json({ error: "County geography verification is temporarily unavailable." });
      }
      if (geography === "invalid") {
        return res.status(404).json({ error: "The requested county FIPS is not a Census county geography." });
      }
      // Resolve county name for display and TX HHSC lookup
      const countyName =
        stateFips === "48"
          ? (TX_COUNTY_FIPS_TO_NAME[countyFips] ?? countyFips)
          : countyFips;
      try {
        const intel = await getChildcareIntelByFips(stateFips, countyFips, countyName);
        return res.json({
          stateFips,
          countyFips,
          county: countyName,
          summary: intel.summary,
          slotGap: intel.slotGap,
          trsQuality: intel.trsQuality,
          warnings: intel.warnings,
          providerCount: intel.providers.length,
        });
      } catch (err: any) {
        console.error("[childcare] fips overview error:", err?.message);
        return res.status(502).json({ error: "Childcare data temporarily unavailable." });
      }
    },
  );

  // ------------------------------------------------------------------
  // GET /api/childcare/search?location=Williamson County, TX
  // Resolves county by name/state string; works nationwide
  // ------------------------------------------------------------------
  app.get("/api/childcare/search", async (req: Request, res: Response) => {
    if (!checkRateLimit(req, res)) return;
    const location = String(req.query["location"] ?? "").trim();
    if (!location || location.length < 3 || location.length > 120) {
      return res.status(400).json({
        error: "location query param required (e.g. 'Williamson County, TX' or 'Cook County, IL').",
      });
    }
    try {
      const resolved = await resolveCountyInput(location);
      if (!resolved) {
        return res.status(404).json({
          error: `County not found: "${location}". Try "County Name, ST" format.`,
        });
      }
      const { stateFips, countyFips, displayName } = resolved;
      const countyName = displayName.split(",")[0].replace(/\s+County$/i, "").trim().toUpperCase();
      const intel = await getChildcareIntelByFips(stateFips, countyFips, countyName);
      return res.json({
        stateFips,
        countyFips,
        county: countyName,
        displayName,
        summary: intel.summary,
        slotGap: intel.slotGap,
        trsQuality: intel.trsQuality,
        warnings: intel.warnings,
        providerCount: intel.providers.length,
      });
    } catch (err: any) {
      console.error("[childcare] search error:", err?.message);
      return res.status(502).json({ error: "Childcare search temporarily unavailable." });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/childcare/county/:county/overview
  // ------------------------------------------------------------------
  app.get(
    "/api/childcare/county/:county/overview",
    async (req: Request, res: Response) => {
      if (!checkRateLimit(req, res)) return;
      const county = normalizeCounty(getCountyParam(req));
      if (!county || county.length < 2) return badRequest(res, "County name is required.");
      if (!isKnownTexasCountyName(county)) return res.status(404).json({ error: "Texas county not found." });

      try {
        const intel = await getChildcareIntel(county);
        return res.json({
          county,
          summary: intel.summary,
          slotGap: intel.slotGap,
          trsQuality: intel.trsQuality,
          warnings: intel.warnings,
          providerCount: intel.providers.length,
        });
      } catch (err: any) {
        console.error("[childcare] overview error:", err?.message);
        return res
          .status(502)
          .json({ error: "Childcare data temporarily unavailable. Please try again." });
      }
    },
  );

  // ------------------------------------------------------------------
  // GET /api/childcare/county/:county/providers?page=1&limit=50&type=...&trs=...
  // ------------------------------------------------------------------
  app.get(
    "/api/childcare/county/:county/providers",
    async (req: Request, res: Response) => {
      if (!checkRateLimit(req, res)) return;
      const county = normalizeCounty(getCountyParam(req));
      if (!county || county.length < 2) return badRequest(res, "County name is required.");
      if (!isKnownTexasCountyName(county)) return res.status(404).json({ error: "Texas county not found." });

      const rawPage = String(req.query["page"] ?? "1");
      const rawLimit = String(req.query["limit"] ?? "50");
      if (!/^\d+$/.test(rawPage) || !/^\d+$/.test(rawLimit) || Number(rawPage) < 1 || Number(rawLimit) < 1 || Number(rawLimit) > 200) {
        return badRequest(res, "page must be a positive integer and limit must be an integer from 1 to 200.");
      }
      const page = Number(rawPage);
      const limit = Number(rawLimit);
      const typeFilter = String(req.query["type"] ?? "").trim().toUpperCase() || null;
      const trsFilter = String(req.query["trs"] ?? "").trim().toUpperCase() || null;
      const statusFilter = String(req.query["status"] ?? "").trim().toUpperCase() || null;

      try {
        const intel = await getChildcareIntel(county);
        let providers: HhscProvider[] = intel.providers;

        if (typeFilter) {
          providers = providers.filter((p) =>
            p.operation_type.toUpperCase().includes(typeFilter),
          );
        }
        if (trsFilter) {
          providers = providers.filter(
            (p) => (p.trs_designation ?? "").toUpperCase().includes(trsFilter),
          );
        }
        if (statusFilter) {
          providers = providers.filter((p) =>
            p.license_status.toUpperCase().includes(statusFilter),
          );
        }

        const total = providers.length;
        const offset = (page - 1) * limit;
        const pageData = providers.slice(offset, offset + limit);

        return res.json({
          county,
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          providers: pageData,
          warnings: intel.warnings,
        });
      } catch (err: any) {
        console.error("[childcare] providers error:", err?.message);
        return res
          .status(502)
          .json({ error: "Childcare provider list temporarily unavailable." });
      }
    },
  );

  // ------------------------------------------------------------------
  // GET /api/childcare/county/:county/gap-analysis
  // ------------------------------------------------------------------
  app.get(
    "/api/childcare/county/:county/gap-analysis",
    async (req: Request, res: Response) => {
      if (!checkRateLimit(req, res)) return;
      const county = normalizeCounty(getCountyParam(req));
      if (!county || county.length < 2) return badRequest(res, "County name is required.");
      if (!isKnownTexasCountyName(county)) return res.status(404).json({ error: "Texas county not found." });

      try {
        const intel = await getChildcareIntel(county);
        const { slotGap, summary } = intel;

        return res.json({
          county,
          slotGap,
          affordabilityNote:
            "Market-rate vs. CCAP scholarship comparison requires TWC Market Rate Survey data. " +
            "Contact Workforce Solutions Rural Capital Area (WSRCA) for contracted provider subsidy rates.",
          scheduleGap: {
            nonStandardHoursProviders: summary.nonStandardHoursCount,
            totalProviders: summary.totalProviders,
            nonStandardHoursCoverage:
              summary.totalProviders !== null &&
              summary.totalProviders > 0 &&
              summary.nonStandardHoursCount !== null
                ? summary.nonStandardHoursCount / summary.totalProviders
                : null,
            note: "Non-standard hours estimated from HHSC hours_of_operation field; may undercount.",
          },
          warnings: intel.warnings,
          dataSource: slotGap.dataSource,
        });
      } catch (err: any) {
        console.error("[childcare] gap-analysis error:", err?.message);
        return res
          .status(502)
          .json({ error: "Childcare gap analysis temporarily unavailable." });
      }
    },
  );

  // ------------------------------------------------------------------
  // GET /api/childcare/county/:county/quality
  // ------------------------------------------------------------------
  app.get(
    "/api/childcare/county/:county/quality",
    async (req: Request, res: Response) => {
      if (!checkRateLimit(req, res)) return;
      const county = normalizeCounty(getCountyParam(req));
      if (!county || county.length < 2) return badRequest(res, "County name is required.");
      if (!isKnownTexasCountyName(county)) return res.status(404).json({ error: "Texas county not found." });

      try {
        const intel = await getChildcareIntel(county);
        const { trsQuality, summary } = intel;

        return res.json({
          county,
          trsQuality,
          note:
            "Texas Rising Star (TRS) ratings are not included in the current HHSC CCL dataset. " +
            "A separate state rating source would be required before quality tiers can be reported.",
          dataSource: summary.dataSource,
          warnings: intel.warnings,
        });
      } catch (err: any) {
        console.error("[childcare] quality error:", err?.message);
        return res.status(502).json({ error: "Childcare quality data temporarily unavailable." });
      }
    },
  );
}
