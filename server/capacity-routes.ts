import { Router } from "express";
import { db } from "./storage";
import { orgCapacity } from "@shared/schema";
import { eq, gt, and, isNull, or, sql, type SQL } from "drizzle-orm";
import { requirePartnerAuth, requireScope } from "./partner-api-routes";
import { validateContactPhone, validateContactUrl } from "@shared/intake-contact-validators";

export const capacityRouter = Router();

const ipHits = new Map<string, number[]>();
function rateLimit(req: any, res: any, next: any) {
  const ip = (req.ip || "").replace(/^::ffff:/, "");
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t: number) => now - t < 60 * 60 * 1000);
  hits.push(now);
  ipHits.set(ip, hits);
  if (hits.length > 30) return res.status(429).json({ error: "Rate limit exceeded" });
  next();
}

// GET /api/directory/capacity — public, filterable by ?zip= and ?program=
capacityRouter.get("/capacity", rateLimit, async (req, res) => {
  try {
    const programQuery = req.query.program;
    const zipQuery = req.query.zip;
    if (
      (programQuery !== undefined && typeof programQuery !== "string") ||
      (zipQuery !== undefined && typeof zipQuery !== "string")
    ) {
      return res.status(400).json({ error: "program and zip must each be a single query value" });
    }

    const program = programQuery;
    const zip = zipQuery;
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const filters: SQL[] = [gt(orgCapacity.updatedAt, cutoff)];
    if (program) {
      filters.push(or(
        eq(orgCapacity.programCode, program),
        eq(orgCapacity.programCode, "general"),
      )!);
    }
    if (zip) {
      filters.push(or(
        isNull(orgCapacity.serviceZips),
        sql`cardinality(${orgCapacity.serviceZips}) = 0`,
        sql`${zip} = ANY(${orgCapacity.serviceZips})`,
      )!);
    }

    const rows = await db.select().from(orgCapacity)
      .where(and(...filters))
      .orderBy(orgCapacity.orgName)
      .limit(100);

    const filtered = rows.map((r) => ({
        ...r,
        stale: r.updatedAt
          ? Date.now() - new Date(r.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000
          : true,
    }));

    res.json({ orgs: filtered, count: filtered.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to load capacity" });
  }
});

// GET /api/directory/capacity/summary — public
capacityRouter.get("/capacity/summary", rateLimit, async (_req, res) => {
  try {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [summary] = await db.select({
      open: sql<number>`count(*) filter (where ${orgCapacity.status} = 'open')::int`,
      waitlist: sql<number>`count(*) filter (where ${orgCapacity.status} = 'waitlist')::int`,
      closed: sql<number>`count(*) filter (where ${orgCapacity.status} = 'closed')::int`,
      lastUpdated: sql<Date | null>`max(${orgCapacity.updatedAt})`,
    }).from(orgCapacity).where(gt(orgCapacity.updatedAt, cutoff));

    res.json({
      open: summary?.open ?? 0,
      waitlist: summary?.waitlist ?? 0,
      closed: summary?.closed ?? 0,
      lastUpdated: summary?.lastUpdated ?? null,
    });
  } catch (err) {
    console.error("[capacity] summary failed:", err);
    res.status(500).json({ error: "Failed to load capacity summary" });
  }
});

// ── Partner-authenticated capacity PATCH ─────────────────────────────────────
// PATCH /api/partner/v1/capacity — requires x-partner-key or x-ecosystem-key
// plus the explicit capacity:write scope.
export const partnerCapacityRouter = Router();

partnerCapacityRouter.patch("/capacity", requirePartnerAuth, requireScope("capacity:write"), async (req, res) => {
  const key: any = (req as any).partnerKey;
  try {
    const {
      orgName,
      programCode = "general",
      status = "open",
      waitWeeks,
      note,
      contactPhone,
      contactUrl,
      serviceZips,
    } = req.body;

    if (!orgName) return res.status(400).json({ error: "orgName required" });
    if (!["open", "waitlist", "closed"].includes(status)) {
      return res.status(400).json({ error: "status must be open|waitlist|closed" });
    }

    const phoneCheck = validateContactPhone(contactPhone);
    if (!phoneCheck.ok) return res.status(400).json({ error: phoneCheck.message });

    const urlCheck = validateContactUrl(contactUrl);
    if (!urlCheck.ok) return res.status(400).json({ error: urlCheck.message });

    // Derive a stable orgId from the partner key identity
    const orgId = key.isEcosystemPlatform
      ? `eco_${key.platformId?.slice(0, 10) ?? "unknown"}`
      : `pk_${key.keyPrefix ?? "unknown"}`;

    await db
      .insert(orgCapacity)
      .values({
        orgId,
        orgName,
        programCode,
        status,
        waitWeeks: waitWeeks ?? null,
        note: note ?? null,
        contactPhone: contactPhone ?? null,
        contactUrl: contactUrl ?? null,
        serviceZips: serviceZips ?? null,
        updatedByPartnerKey: key.keyPrefix ?? orgId,
      })
      .onConflictDoUpdate({
        target: [orgCapacity.orgId, orgCapacity.programCode],
        set: {
          orgName,
          status,
          waitWeeks: waitWeeks ?? null,
          note: note ?? null,
          contactPhone: contactPhone ?? null,
          contactUrl: contactUrl ?? null,
          serviceZips: serviceZips ?? null,
          updatedAt: new Date(),
          updatedByPartnerKey: key.keyPrefix ?? orgId,
        },
      });

    res.json({ ok: true, orgId, programCode, status });
  } catch (err: any) {
    console.error("[capacity] partner update failed:", err.message);
    res.status(500).json({ error: "Failed to update capacity" });
  }
});

// GET /api/partner/v1/capacity — returns this partner's own entries and
// requires the explicit capacity:read scope.
partnerCapacityRouter.get("/capacity", requirePartnerAuth, requireScope("capacity:read"), async (req, res) => {
  const key: any = (req as any).partnerKey;
  try {
    const orgId = key.isEcosystemPlatform
      ? `eco_${key.platformId?.slice(0, 10) ?? "unknown"}`
      : `pk_${key.keyPrefix ?? "unknown"}`;

    const rows = await db.select().from(orgCapacity)
      .where(eq(orgCapacity.orgId, orgId))
      .orderBy(orgCapacity.programCode);

    const STALE_MS = 14 * 24 * 60 * 60 * 1000;
    const results = rows.map((r) => ({
      ...r,
      stale: r.updatedAt
        ? Date.now() - new Date(r.updatedAt).getTime() > STALE_MS
        : true,
    }));

    res.json({ orgId, entries: results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch capacity entries" });
  }
});
