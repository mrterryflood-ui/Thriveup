import { Router } from "express";
import { db } from "./storage";
import { orgCapacity } from "@shared/schema";
import { gt } from "drizzle-orm";

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

// GET /api/directory/capacity — public
capacityRouter.get("/capacity", rateLimit, async (req, res) => {
  try {
    const { program } = req.query;
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const rows = await db.select().from(orgCapacity)
      .where(gt(orgCapacity.updatedAt, cutoff))
      .orderBy(orgCapacity.orgName)
      .limit(50);

    const filtered = rows
      .filter((r: any) => !program || r.programCode === program || r.programCode === "general")
      .map((r: any) => ({
        ...r,
        staleWarning: r.updatedAt && (Date.now() - new Date(r.updatedAt).getTime()) > 7 * 24 * 60 * 60 * 1000,
      }));

    res.json({ orgs: filtered, count: filtered.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to load capacity" });
  }
});

// GET /api/directory/capacity/summary — public
capacityRouter.get("/capacity/summary", rateLimit, async (req, res) => {
  try {
    const rows = await db.select().from(orgCapacity).limit(200);
    const open = rows.filter((r: any) => r.status === "open").length;
    const waitlist = rows.filter((r: any) => r.status === "waitlist").length;
    const closed = rows.filter((r: any) => r.status === "closed").length;
    const lastUpdated = rows.reduce(
      (max: any, r: any) => (r.updatedAt && r.updatedAt > max ? r.updatedAt : max),
      new Date(0)
    );
    res.json({ open, waitlist, closed, lastUpdated });
  } catch (err) {
    res.json({ open: 0, waitlist: 0, closed: 0, lastUpdated: null });
  }
});

// PATCH /api/partner/v1/capacity — partner key required
export const partnerCapacityRouter = Router();
partnerCapacityRouter.patch("/capacity", async (req, res) => {
  const key = req.headers["x-tcaf-key"] as string;
  if (!key) return res.status(401).json({ error: "x-tcaf-key required" });
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
    if (!["open", "waitlist", "closed"].includes(status)) return res.status(400).json({ error: "Invalid status" });

    const orgId = key.slice(0, 12);
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
        updatedByPartnerKey: key,
      })
      .onConflictDoUpdate({
        target: [orgCapacity.orgId, orgCapacity.programCode],
        set: {
          status,
          waitWeeks: waitWeeks ?? null,
          note: note ?? null,
          contactPhone: contactPhone ?? null,
          contactUrl: contactUrl ?? null,
          serviceZips: serviceZips ?? null,
          updatedAt: new Date(),
          updatedByPartnerKey: key,
        },
      });

    res.json({ ok: true, orgId, programCode, status });
  } catch (err: any) {
    console.error("[capacity] partner update failed:", err.message);
    res.status(500).json({ error: "Failed to update capacity" });
  }
});
