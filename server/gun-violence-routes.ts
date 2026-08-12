/**
 * Gun Violence Registry
 *
 * Provides a staff-gated import endpoint and a public aggregate-only
 * summary endpoint. No victim PII is stored or exposed — only incident
 * geography, type, and counts.
 *
 * POST /api/gun-violence/import   — staff-gated; idempotent upsert by incidentId+dataSource
 * GET  /api/gun-violence/summary  — public aggregate counts; rate-limited by IP
 * GET  /api/gun-violence/imports  — staff-gated; import history / audit log
 */
import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { gunViolenceIncidents, gunViolenceImports } from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth } from "./tenant-middleware";
import { z } from "zod";

// ── Simple in-memory rate limiter (no package dependency) ────────────────────
const summaryRateWindows = new Map<string, { count: number; resetAt: number }>();
function checkSummaryRate(ip: string): boolean {
  const now = Date.now();
  const entry = summaryRateWindows.get(ip);
  if (!entry || now > entry.resetAt) {
    summaryRateWindows.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

// ── Staff role check (shared 5-role set) ─────────────────────────────────────
const STAFF_ROLES = new Set(["admin", "staff", "chw", "youth_staff", "hub_staff"]);
function isStaff(req: Request): boolean {
  const role = (req as any).user?.role;
  return STAFF_ROLES.has(role);
}

// ── Import payload schema ────────────────────────────────────────────────────
const incidentSchema = z.object({
  incidentId: z.string().min(1).max(255),
  dataSource: z.string().min(1).max(100),
  occurredAt: z.string().optional(),       // ISO-8601 string
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zip: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  ward: z.string().max(50).optional(),
  victimCount: z.number().int().min(0).optional(),
  fatalCount: z.number().int().min(0).optional(),
  incidentType: z.string().max(100).optional(), // e.g. "shooting", "homicide", "aggravated-assault"
});
const importSchema = z.array(incidentSchema).min(1).max(10_000);

export function registerGunViolenceRoutes(app: Express) {

  /**
   * POST /api/gun-violence/import
   * Body: JSON array of incident objects (see incidentSchema above).
   * Upserts by (incidentId, dataSource) — safe to re-import the same dataset.
   * Writes an audit row to gun_violence_imports on success.
   */
  app.post("/api/gun-violence/import", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }

      const parsed = importSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid import payload.", detail: parsed.error.flatten() });
      }

      const records = parsed.data;
      const dataSource = records[0].dataSource;
      let inserted = 0;
      let skipped = 0;

      for (const rec of records) {
        try {
          const result = await db.insert(gunViolenceIncidents).values({
            incidentId: rec.incidentId,
            dataSource: rec.dataSource,
            occurredAt: rec.occurredAt ? new Date(rec.occurredAt) : undefined,
            latitude: rec.latitude,
            longitude: rec.longitude,
            zip: rec.zip,
            city: rec.city,
            ward: rec.ward,
            victimCount: rec.victimCount ?? 1,
            fatalCount: rec.fatalCount ?? 0,
            incidentType: rec.incidentType,
          }).onConflictDoNothing().returning({ id: gunViolenceIncidents.id });
          if (result.length > 0) {
            inserted++;
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }
      }

      // Audit row — always write even if all were duplicates
      await db.insert(gunViolenceImports).values({
        dataSource,
        recordCount: inserted,
        importedByUserId: (req as any).user?.id,
        notes: `Batch: ${records.length} submitted, ${inserted} new, ${skipped} duplicate/skipped.`,
      });

      console.info(`[gun-violence] import complete: source=${dataSource} new=${inserted} skipped=${skipped}`);
      res.json({ imported: inserted, skipped, total: records.length, dataSource });
    } catch (err: any) {
      console.error("[gun-violence] import error:", err);
      res.status(500).json({ error: "Import failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/summary
   * Query params: zip, city, ward, from (ISO date), to (ISO date)
   * Returns aggregate counts only — no individual incident records.
   * Public endpoint, rate-limited to 60 req/min per IP.
   */
  app.get("/api/gun-violence/summary", async (req: Request, res: Response) => {
    const ip = req.ip || "unknown";
    if (!checkSummaryRate(ip)) {
      return res.status(429).json({ error: "Too many requests. Limit: 60/min." });
    }

    try {
      const zip  = ((req.query.zip  as string) || "").trim();
      const city = ((req.query.city as string) || "").trim();
      const ward = ((req.query.ward as string) || "").trim();
      const from = ((req.query.from as string) || "").trim();
      const to   = ((req.query.to   as string) || "").trim();

      const conditions: ReturnType<typeof eq>[] = [];
      if (zip)  conditions.push(eq(gunViolenceIncidents.zip, zip));
      if (city) conditions.push(eq(gunViolenceIncidents.city, city));
      if (ward) conditions.push(eq(gunViolenceIncidents.ward, ward));
      if (from) conditions.push(gte(gunViolenceIncidents.occurredAt, new Date(from)));
      if (to)   conditions.push(lte(gunViolenceIncidents.occurredAt, new Date(to)));

      const [totals] = await db
        .select({
          incidents:  sql<number>`count(*)::int`,
          victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
          fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
        })
        .from(gunViolenceIncidents)
        .where(conditions.length ? and(...conditions) : undefined);

      // ZIP-level breakdown when querying city-wide
      const byZip = city && !zip
        ? await db
            .select({
              zip:        gunViolenceIncidents.zip,
              incidents:  sql<number>`count(*)::int`,
              fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
            })
            .from(gunViolenceIncidents)
            .where(conditions.length ? and(...conditions) : undefined)
            .groupBy(gunViolenceIncidents.zip)
            .orderBy(desc(sql`count(*)`))
            .limit(25)
        : [];

      res.json({
        filters: { zip: zip || null, city: city || null, ward: ward || null, from: from || null, to: to || null },
        incidents:  totals?.incidents  ?? 0,
        victims:    totals?.victims    ?? 0,
        fatalities: totals?.fatalities ?? 0,
        byZip: byZip.length ? byZip : undefined,
        source: "TCAF Gun Violence Registry",
        note: "Aggregate counts only. No individual victim data is stored or exposed.",
      });
    } catch (err: any) {
      console.error("[gun-violence] summary error:", err);
      res.status(500).json({ error: "Summary failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/imports
   * Staff-gated. Returns the last 50 import audit records so operators can
   * see when data was last refreshed, how many records came in, and from
   * which source.
   */
  app.get("/api/gun-violence/imports", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }

      const history = await db
        .select()
        .from(gunViolenceImports)
        .orderBy(desc(gunViolenceImports.importedAt))
        .limit(50);

      res.json({ imports: history });
    } catch (err: any) {
      console.error("[gun-violence] imports history error:", err);
      res.status(500).json({ error: "Failed to load import history.", detail: err.message });
    }
  });

  // ── POST /api/gun-violence/sync — pull from external registry (staff only) ──
  // Streams records in from gun-violence-registry.replit.app via paginated
  // fetch and upserts them locally.  Returns immediately with a job summary.
  // Idempotent — safe to re-run; existing rows are updated in place.
  app.post("/api/gun-violence/sync", async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }

      const REGISTRY_BASE = "https://gun-violence-registry.replit.app";
      const DATA_SOURCE   = "gun-violence-registry";
      const BATCH_SIZE    = 500;
      const INSERT_CHUNK  = 100;
      const { nanoid }    = await import("nanoid");

      const importId  = nanoid(12);
      let totalFetched  = 0;
      let totalUpserted = 0;
      let offset        = 0;
      const startedAt   = Date.now();

      while (true) {
        const url = `${REGISTRY_BASE}/api/incidents?offset=${offset}`;
        const apiRes = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
        if (!apiRes.ok) throw new Error(`Registry HTTP ${apiRes.status} at offset=${offset}`);

        const batch: any[] = await apiRes.json();
        if (!Array.isArray(batch) || batch.length === 0) break;

        totalFetched += batch.length;

        const rows = batch.map((r: any) => {
          let occurredAt: Date | undefined;
          try {
            if (r.date && r.date !== "0001-01-01") {
              const d = new Date(`${r.date}T${r.time || "00:00"}:00Z`);
              if (!isNaN(d.getTime())) occurredAt = d;
            }
          } catch { /* ignore */ }

          return {
            id:           nanoid(12),
            incidentId:   r.externalId || r.id,
            dataSource:   DATA_SOURCE,
            occurredAt,
            latitude:     r.latitude || undefined,
            longitude:    r.longitude || undefined,
            zip:          r.zipCode || undefined,
            city:         r.city || undefined,
            state:        r.state || undefined,
            victimCount:  (r.killed ?? 0) + (r.injured ?? 0),
            fatalCount:   r.killed ?? 0,
            incidentType: r.incidentType || undefined,
            importId,
          };
        });

        for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
          const chunk = rows.slice(i, i + INSERT_CHUNK);
          await db.insert(gunViolenceIncidents)
            .values(chunk)
            .onConflictDoUpdate({
              target: [gunViolenceIncidents.incidentId, gunViolenceIncidents.dataSource],
              set: {
                occurredAt:   sql`excluded.occurred_at`,
                latitude:     sql`excluded.latitude`,
                longitude:    sql`excluded.longitude`,
                zip:          sql`excluded.zip`,
                city:         sql`excluded.city`,
                state:        sql`excluded.state`,
                victimCount:  sql`excluded.victim_count`,
                fatalCount:   sql`excluded.fatal_count`,
                incidentType: sql`excluded.incident_type`,
                importId:     sql`excluded.import_id`,
              },
            });
          totalUpserted += chunk.length;
        }

        if (batch.length < BATCH_SIZE) break;  // last page
        offset += BATCH_SIZE;
        await new Promise(r => setTimeout(r, 150)); // polite pause
      }

      const elapsedMs = Date.now() - startedAt;

      await db.insert(gunViolenceImports).values({
        dataSource:  DATA_SOURCE,
        recordCount: totalUpserted,
        notes: `API pull sync via /api/gun-violence/sync. fetched=${totalFetched} upserted=${totalUpserted} elapsed=${elapsedMs}ms`,
      });

      console.log(`[gun-violence] sync complete — fetched=${totalFetched} upserted=${totalUpserted} elapsed=${elapsedMs}ms`);
      res.json({ ok: true, fetched: totalFetched, upserted: totalUpserted, elapsedMs, importId });

    } catch (err: any) {
      console.error("[gun-violence] sync error:", err);
      res.status(500).json({ error: "Sync failed.", detail: err.message });
    }
  });
}
