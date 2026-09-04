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
import { getChildcareIntel, type HhscProvider } from "./childcare-provider-intel";

// ---------------------------------------------------------------------------
// In-process rate limiter (30 req / 60 s per IP) — same pattern as chatRateLimit
// ---------------------------------------------------------------------------

const childcareRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(req: Request, res: Response): boolean {
  const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown").replace(/^::ffff:/, "");
  const now = Date.now();
  const entry = childcareRateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    childcareRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    res
      .status(429)
      .json({ error: "Too many requests. Please wait a moment before retrying." });
    return false; // blocked
  }
  entry.count++;
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

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerChildcareRoutes(app: Express): void {
  // ------------------------------------------------------------------
  // GET /api/childcare/county/:county/overview
  // ------------------------------------------------------------------
  app.get(
    "/api/childcare/county/:county/overview",
    async (req: Request, res: Response) => {
      if (!checkRateLimit(req, res)) return;
      const county = normalizeCounty(getCountyParam(req));
      if (!county || county.length < 2) return badRequest(res, "County name is required.");

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

      const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(String(req.query["limit"] ?? "50"), 10) || 50));
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
              summary.totalProviders > 0
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

      try {
        const intel = await getChildcareIntel(county);
        const { trsQuality, summary } = intel;

        return res.json({
          county,
          trsQuality,
          note:
            "Texas Rising Star (TRS) designation from HHSC CCL dataset. " +
            "Unrated providers may be new licensees, home-based providers, or non-participants. " +
            "TRS participation is voluntary; unrated does not indicate poor quality.",
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
