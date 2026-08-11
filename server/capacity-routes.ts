import { Router } from "express";
import { db } from "./storage";
import { orgCapacity } from "@shared/schema";
import { eq, gt, and } from "drizzle-orm";
import { requirePartnerAuth } from "./partner-api-routes";

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
    const { program, zip } = req.query as Record<string, string>;
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const rows = await db.select().from(orgCapacity)
      .where(gt(orgCapacity.updatedAt, cutoff))
      .orderBy(orgCapacity.orgName)
      .limit(100);

    const filtered = rows
      .filter((r) => {
        if (program && r.programCode !== program && r.programCode !== "general") return false;
        if (zip && r.serviceZips && r.serviceZips.length > 0 && !r.serviceZips.includes(zip)) return false;
        return true;
      })
      .map((r) => ({
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
    const rows = await db.select().from(orgCapacity).limit(200);
    const open = rows.filter((r) => r.status === "open").length;
    const waitlist = rows.filter((r) => r.status === "waitlist").length;
    const closed = rows.filter((r) => r.status === "closed").length;
    const lastUpdated = rows.reduce(
      (max: Date | null, r) => (r.updatedAt && (!max || r.updatedAt > max) ? r.updatedAt : max),
      null
    );
    res.json({ open, waitlist, closed, lastUpdated });
  } catch (_err) {
    res.json({ open: 0, waitlist: 0, closed: 0, lastUpdated: null });
  }
});

// ── Partner-authenticated capacity PATCH ─────────────────────────────────────
// PATCH /api/partner/v1/capacity — requires x-partner-key or x-ecosystem-key
export const partnerCapacityRouter = Router();

partnerCapacityRouter.patch("/capacity", requirePartnerAuth, async (req, res) => {
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

// GET /api/partner/v1/capacity — returns this partner's own entries
partnerCapacityRouter.get("/capacity", requirePartnerAuth, async (req, res) => {
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
