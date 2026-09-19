import { Router } from "express";
import { db } from "./storage";
import { orgCapacity } from "@shared/schema";
import { eq, gt, and, isNull, or, sql, type SQL } from "drizzle-orm";
import { requirePartnerAuth, requireScope } from "./partner-api-routes";
import { validateContactPhone, validateContactUrl } from "@shared/intake-contact-validators";

export const capacityRouter = Router();

const ipHits = new Map<string, number[]>();
const MAX_IP_BUCKETS = 10_000;
function rateLimit(req: any, res: any, next: any) {
  const ip = (req.ip || "").replace(/^::ffff:/, "");
  const now = Date.now();
  if (ipHits.size >= MAX_IP_BUCKETS && !ipHits.has(ip)) {
    const cutoff = now - 60 * 60 * 1000;
    for (const [storedIp, timestamps] of ipHits) {
      if (!timestamps.some((timestamp) => timestamp > cutoff)) ipHits.delete(storedIp);
    }
    if (ipHits.size >= MAX_IP_BUCKETS) {
      return res.status(429).json({ error: "Rate limit capacity reached; try again later" });
    }
  }
  const hits = (ipHits.get(ip) || []).filter((t: number) => now - t < 60 * 60 * 1000);
  if (hits.length >= 30) return res.status(429).json({ error: "Rate limit exceeded" });
  hits.push(now);
  ipHits.set(ip, hits);
  next();
}

const partnerCapacityHits = new Map<string, { count: number; resetAt: number }>();
const MAX_PARTNER_CAPACITY_BUCKETS = 10_000;
function partnerCapacityRateLimit(req: any, res: any, next: any) {
  const partnerKey = req.partnerKey;
  const identity = partnerKey?.isEcosystemPlatform
    ? partnerKey?.platformId
    : partnerKey?.id;
  if (typeof identity !== "string" || !identity || identity.length > 100) {
    return res.status(403).json({ error: "Partner identity is not available for capacity access" });
  }
  const ip = (req.ip || "").replace(/^::ffff:/, "");
  const bucketKey = `${identity}:${ip}`;
  const now = Date.now();
  if (partnerCapacityHits.size >= MAX_PARTNER_CAPACITY_BUCKETS && !partnerCapacityHits.has(bucketKey)) {
    for (const [storedKey, bucket] of partnerCapacityHits) {
      if (bucket.resetAt <= now) partnerCapacityHits.delete(storedKey);
    }
    if (partnerCapacityHits.size >= MAX_PARTNER_CAPACITY_BUCKETS) {
      return res.status(429).json({ error: "Capacity rate limit capacity reached; try again later" });
    }
  }
  const current = partnerCapacityHits.get(bucketKey);
  if (!current || current.resetAt <= now) {
    partnerCapacityHits.set(bucketKey, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return next();
  }
  if (current.count >= 120) {
    res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: "Capacity update rate limit exceeded" });
  }
  current.count += 1;
  return next();
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
    if (program && (program.length > 100 || !/^[A-Za-z0-9:_-]+$/.test(program))) {
      return res.status(400).json({ error: "Invalid program filter" });
    }
    if (zip && !/^\d{5}$/.test(zip)) {
      return res.status(400).json({ error: "ZIP must be 5 digits" });
    }
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
      orgId: r.orgId,
      orgName: r.orgName,
      programCode: r.programCode,
      status: r.status,
      waitWeeks: r.waitWeeks,
      contactPhone: r.contactPhone,
      contactUrl: r.contactUrl,
      serviceZips: r.serviceZips,
      updatedAt: r.updatedAt,
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

partnerCapacityRouter.patch("/capacity", requirePartnerAuth, requireScope("capacity:write"), partnerCapacityRateLimit, async (req, res) => {
  const key: any = (req as any).partnerKey;
  try {
    const identity = key?.isEcosystemPlatform ? key?.platformId : key?.id;
    if (typeof identity !== "string" || !identity || identity.length > 100) {
      return res.status(403).json({ error: "Partner identity is not available for capacity access" });
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be an object" });
    }
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

    if (typeof orgName !== "string" || !orgName.trim() || orgName.length > 200) {
      return res.status(400).json({ error: "orgName is required and must be at most 200 characters" });
    }
    if (typeof programCode !== "string" || !/^[A-Za-z0-9:_-]{1,100}$/.test(programCode)) {
      return res.status(400).json({ error: "programCode must be 1-100 letters, numbers, or _:- characters" });
    }
    if (!["open", "waitlist", "closed"].includes(status)) {
      return res.status(400).json({ error: "status must be open|waitlist|closed" });
    }
    if (waitWeeks !== undefined && waitWeeks !== null &&
      (!Number.isInteger(waitWeeks) || waitWeeks < 0 || waitWeeks > 52)) {
      return res.status(400).json({ error: "waitWeeks must be an integer from 0 to 52" });
    }
    if (note !== undefined && note !== null && (typeof note !== "string" || note.length > 1000)) {
      return res.status(400).json({ error: "note must be at most 1000 characters" });
    }
    if (serviceZips !== undefined && serviceZips !== null &&
      (!Array.isArray(serviceZips) || serviceZips.length > 100 ||
        serviceZips.some((z: unknown) => typeof z !== "string" || !/^\d{5}$/.test(z)))) {
      return res.status(400).json({ error: "serviceZips must contain at most 100 five-digit ZIP codes" });
    }

    const phoneCheck = validateContactPhone(contactPhone);
    if (!phoneCheck.ok) return res.status(400).json({ error: phoneCheck.message });

    const urlCheck = validateContactUrl(contactUrl);
    if (!urlCheck.ok) return res.status(400).json({ error: urlCheck.message });

    // Derive a stable orgId from the partner key identity
    const orgId = key.isEcosystemPlatform
      ? `eco_${key.platformId}`
      : `pk_${key.id}`;

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
partnerCapacityRouter.get("/capacity", requirePartnerAuth, requireScope("capacity:read"), partnerCapacityRateLimit, async (req, res) => {
  const key: any = (req as any).partnerKey;
  try {
    const identity = key?.isEcosystemPlatform ? key?.platformId : key?.id;
    if (typeof identity !== "string" || !identity || identity.length > 100) {
      return res.status(403).json({ error: "Partner identity is not available for capacity access" });
    }
    const orgId = key.isEcosystemPlatform
      ? `eco_${key.platformId}`
      : `pk_${key.id}`;

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
