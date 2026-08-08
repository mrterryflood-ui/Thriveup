/**
 * Community Data — public nationwide homelessness data lookup.
 *
 * Data source: official HUD "PIT Counts by CoC" workbook (huduser.gov),
 * imported with all-or-nothing validation and provenance on every row
 * (see server/hud-pit-import.ts). All 385 CoCs, 2007–present.
 *
 * Public by design: HUD publishes these figures; the platform adds lookup,
 * trend, and cited live research. No PII exists in this table.
 */
import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { hudPitCounts } from "@shared/schema";
import { eq, sql, ilike, or, desc } from "drizzle-orm";
import { perplexityResearch, isPerplexityAvailable } from "./ai-provider";
import { resolveZipBestEffort } from "./geo/zip-county-resolver";
import { requireStaff } from "./yhsi-routes";
import { parseHudPitWorkbook, upsertHudPitRows } from "./hud-pit-import";

// In-memory rate limiter (same trust model as yhsi-routes: trust proxy set at boot).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
function consume(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

const SOURCE_CITATION =
  "U.S. Department of Housing and Urban Development, Point-in-Time Estimates by CoC (AHAR companion file), huduser.gov";

export function registerCommunityDataRoutes(app: Express) {
  // Search CoCs by name fragment, state code, or ZIP (ZIP → state via zcta_county_map).
  app.get("/api/community-data/pit/search", async (req: Request, res: Response) => {
    try {
      if (!consume(`cd-search:${req.ip}`, 120, 60 * 60 * 1000)) return res.status(429).json({ error: "Rate limit exceeded" });
      const q = String(req.query.q ?? "").trim();
      if (!q || q.length < 2) return res.status(400).json({ error: "Provide a search of at least 2 characters (city, county, CoC name, state code, or ZIP)" });

      let stateFilter: string | null = null;
      let resolvedNote: string | null = null;
      if (/^\d{5}$/.test(q)) {
        const geo = await resolveZipBestEffort(q);
        if (!geo.state) return res.json({ results: [], note: "ZIP not found in the nationwide ZIP-to-county map", source: SOURCE_CITATION });
        stateFilter = geo.state;
        resolvedNote = `ZIP ${q} resolves to ${geo.countyName ?? "a county"} in ${geo.state}. Continuums of Care cover regions, not ZIPs — showing all ${geo.state} CoCs; pick the one covering your area.`;
      } else if (/^[A-Za-z]{2}$/.test(q)) {
        stateFilter = q.toUpperCase();
      }

      const latestYear = db.$with("latest").as(
        db.select({ maxYear: sql<number>`max(${hudPitCounts.year})`.as("max_year") }).from(hudPitCounts)
      );
      const rows = await db
        .with(latestYear)
        .select({
          cocNumber: hudPitCounts.cocNumber,
          cocName: hudPitCounts.cocName,
          state: hudPitCounts.state,
          year: hudPitCounts.year,
          overallHomeless: hudPitCounts.overallHomeless,
          unaccompaniedYouthUnder25: hudPitCounts.unaccompaniedYouthUnder25,
          unshelteredHomeless: hudPitCounts.unshelteredHomeless,
        })
        .from(hudPitCounts)
        .where(
          sql`${hudPitCounts.year} = (select max_year from latest) AND ${
            stateFilter
              ? sql`${hudPitCounts.state} = ${stateFilter}`
              : or(ilike(hudPitCounts.cocName, `%${q}%`), ilike(hudPitCounts.cocNumber, `%${q.toUpperCase()}%`))
          }`
        )
        .orderBy(desc(hudPitCounts.overallHomeless))
        .limit(60);

      const latestDataYear = rows[0]?.year ?? null;
      res.json({ results: rows, latestDataYear, note: resolvedNote, source: SOURCE_CITATION });
    } catch (err) {
      console.error("[community-data] search failed:", err);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Full trend for one CoC — every year on record, with provenance/vintage.
  app.get("/api/community-data/pit/:cocNumber", async (req: Request, res: Response) => {
    try {
      if (!consume(`cd-trend:${req.ip}`, 240, 60 * 60 * 1000)) return res.status(429).json({ error: "Rate limit exceeded" });
      const cocNumber = String(req.params.cocNumber).toUpperCase().trim();
      if (!/^[A-Z]{2}-\d{3}$/.test(cocNumber)) return res.status(400).json({ error: "Invalid CoC number (expected e.g. KS-502)" });
      const rows = await db
        .select()
        .from(hudPitCounts)
        .where(eq(hudPitCounts.cocNumber, cocNumber))
        .orderBy(hudPitCounts.year);
      if (rows.length === 0) return res.status(404).json({ error: "No data on record for that CoC" });
      res.json({
        cocNumber,
        cocName: rows[rows.length - 1].cocName,
        state: rows[rows.length - 1].state,
        trend: rows.map((r) => ({
          year: r.year,
          overallHomeless: r.overallHomeless,
          unaccompaniedYouthUnder25: r.unaccompaniedYouthUnder25,
          unshelteredHomeless: r.unshelteredHomeless,
        })),
        source: rows[rows.length - 1].source,
        sourceCitation: SOURCE_CITATION,
        dataVintage: rows[rows.length - 1].importedAt,
      });
    } catch (err) {
      console.error("[community-data] trend failed:", err);
      res.status(500).json({ error: "Lookup failed" });
    }
  });

  // Live cited research about a community's homelessness response (Perplexity Sonar).
  // Answers carry source URLs — uncited output is not returned.
  app.post("/api/community-data/research", async (req: Request, res: Response) => {
    try {
      if (!consume(`cd-research:${req.ip}`, 10, 60 * 60 * 1000)) return res.status(429).json({ error: "Rate limit exceeded — live research is limited to 10 questions per hour" });
      if (!isPerplexityAvailable()) return res.status(503).json({ error: "Live research engine is not configured" });
      const question = String(req.body?.question ?? "").trim().slice(0, 500);
      const place = String(req.body?.place ?? "").trim().slice(0, 120);
      if (question.length < 8) return res.status(400).json({ error: "Ask a question of at least 8 characters" });
      const { text, citations } = await perplexityResearch(
        `Community: ${place || "not specified"}. Question about homelessness response, services, or data: ${question}`,
        "You are a community data researcher. Answer ONLY from verifiable current sources and cite them. Prefer official sources (HUD, CoC reports, city/county agencies, school districts). If you cannot verify a figure, say so plainly — never estimate or invent numbers. Keep answers under 250 words, plain language.",
        900,
      );
      if (!citations || citations.length === 0) {
        return res.json({ answer: "No sufficiently sourced answer was found for that question. Try narrowing it to a specific community or agency.", citations: [] });
      }
      res.json({ answer: text, citations });
    } catch (err) {
      console.error("[community-data] research failed:", err);
      res.status(500).json({ error: "Live research failed" });
    }
  });

  // Staff-only: refresh the dataset from a newly released official HUD workbook.
  // Only huduser.gov URLs are accepted; parsing is all-or-nothing.
  app.post("/api/community-data/pit/refresh", requireStaff, async (req: Request, res: Response) => {
    try {
      const url = String(req.body?.url ?? "").trim();
      let parsedUrl: URL;
      try { parsedUrl = new URL(url); } catch { return res.status(400).json({ error: "Provide the official file URL from huduser.gov" }); }
      if (parsedUrl.protocol !== "https:" || !/(^|\.)huduser\.gov$/.test(parsedUrl.hostname)) {
        return res.status(400).json({ error: "Only official https://huduser.gov file URLs are accepted" });
      }
      // SSRF hardening: never follow redirects (a redirect could point anywhere),
      // and bound the download size before parsing.
      const resp = await fetch(parsedUrl.toString(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ThriveUp data refresh)" },
        redirect: "manual",
        signal: AbortSignal.timeout(60_000),
      });
      if (resp.status >= 300 && resp.status < 400) {
        return res.status(502).json({ error: "HUD URL responded with a redirect — for safety, redirects are not followed. Use the final direct file URL from huduser.gov." });
      }
      if (!resp.ok) return res.status(502).json({ error: `HUD file download failed (HTTP ${resp.status}). huduser.gov sometimes blocks automated fetches — download the file manually and run scripts/import-hud-pit.ts.` });
      const MAX_BYTES = 60 * 1024 * 1024;
      const declared = Number(resp.headers.get("content-length") ?? 0);
      if (declared > MAX_BYTES) return res.status(502).json({ error: "File larger than the 60MB safety limit" });
      const buf = Buffer.from(await resp.arrayBuffer());
      if (buf.length > MAX_BYTES) return res.status(502).json({ error: "File larger than the 60MB safety limit" });
      const fileName = parsedUrl.pathname.split("/").pop() || "hud-pit-file";
      const rows = parseHudPitWorkbook(buf, `huduser.gov ${fileName} (official HUD AHAR companion file)`);
      const count = await upsertHudPitRows(rows);
      res.json({ ok: true, rowsUpserted: count, source: fileName, refreshedAt: new Date().toISOString() });
    } catch (err) {
      console.error("[community-data] refresh failed (nothing committed):", err);
      res.status(500).json({ error: `Refresh failed — nothing was changed: ${err instanceof Error ? err.message : "unknown error"}` });
    }
  });
}
