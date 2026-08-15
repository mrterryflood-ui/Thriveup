import { Router, type Request, type Response } from "express";
import { db, storage } from "./storage";
import { benefitsScreenings, communityPartners, chwVisits } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const chwRouter = Router();

// Staff roles that can access CHW data — keep in lockstep with yhsi-routes.ts STAFF_ROLES
const CHW_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

async function requireCHWRole(req: Request, res: Response, next: () => void) {
  const userId: string | undefined = (req as any).user?.id ?? (req as any).session?.userId;
  if (!userId) return (res as any).status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (!user || !CHW_ROLES.has(user.role)) return (res as any).status(403).json({ error: "CHW role required" });
    // Attach parsed numeric userId for downstream DB scoping
    (req as any).chwNumericId = parseInt(userId, 10);
    (req as any).chwStringId = userId;
    next();
  } catch { (res as any).status(500).json({ error: "Auth check failed" }); }
}

// GET /api/chw/caseload — benefits screenings referred to this authenticated CHW.
// Scoped to req.user.id via the referredToChwId column on benefitsScreenings.
// A CHW can never see records not assigned to their own user ID.
chwRouter.get("/caseload", requireCHWRole, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).chwStringId ?? String((req as any).user?.id ?? "");
    const rows = await db
      .select()
      .from(benefitsScreenings)
      .where(eq(benefitsScreenings.referredToChwId, userId))
      .orderBy(desc(benefitsScreenings.createdAt))
      .limit(100);

    const caseload = rows.map((s) => ({
      id: s.id,
      name: `Client #${String(s.id).slice(-4)}`,
      status: "active",
      riskLevel: "moderate" as const,
      lastContact: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : null,
      nextFollowUp: null,
      screeningsComplete: Array.isArray(s.eligibleBenefits) ? s.eligibleBenefits.length : 0,
      screeningsTotal: 5,
      notes: s.handoffType ? `Handoff type: ${s.handoffType}` : null,
    }));

    res.json({ caseload, isLive: true, count: caseload.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to load caseload" });
  }
});

// GET /api/chw/visits — home visits logged by this authenticated CHW.
// Hard-scoped to chwNumericId — a CHW can never see another CHW's visits.
chwRouter.get("/visits", requireCHWRole, async (req: Request, res: Response) => {
  try {
    const chwUserId: number = (req as any).chwNumericId;
    const rows = await db
      .select()
      .from(chwVisits)
      .where(eq(chwVisits.chwUserId, chwUserId))
      .orderBy(desc(chwVisits.visitDate))
      .limit(50);

    const visits = rows.map((v) => ({
      id: v.id,
      clientName: v.clientDisplayName ?? "Anonymous Client",
      visitDate: v.visitDate,
      visitType: v.visitType,
      duration: v.durationMinutes ?? 0,
      notes: v.notes ?? "",
      followUpNeeded: v.followUpNeeded,
      followUpDate: v.followUpDate ?? null,
    }));

    res.json({ visits, isLive: true, count: visits.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to load visits" });
  }
});

// POST /api/chw/visits — log a new home visit for this authenticated CHW.
chwRouter.post("/visits", requireCHWRole, async (req: Request, res: Response) => {
  try {
    const chwUserId: number = (req as any).chwNumericId;
    const { clientDisplayName, visitDate, visitType, durationMinutes, notes, followUpNeeded, followUpDate } = req.body;
    if (!visitDate) return res.status(400).json({ error: "visitDate is required" });

    const [created] = await db.insert(chwVisits).values({
      chwUserId,
      clientDisplayName: clientDisplayName || null,
      visitDate,
      visitType: visitType || "Follow-Up",
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      notes: notes || null,
      followUpNeeded: !!followUpNeeded,
      followUpDate: followUpDate || null,
    }).returning();

    res.status(201).json({ visit: created });
  } catch (err) {
    res.status(500).json({ error: "Failed to log visit" });
  }
});

// GET /api/chw/resources — active community partners
chwRouter.get("/resources", requireCHWRole, async (_req: Request, res: Response) => {
  try {
    const resources = await db.select({
      id: communityPartners.id,
      name: communityPartners.name,
      category: communityPartners.type,
      phone: communityPartners.contactPhone,
      address: communityPartners.address,
      website: communityPartners.website,
      servicesOffered: communityPartners.programsOffered,
    }).from(communityPartners)
      .where(eq(communityPartners.isActive, true))
      .orderBy(communityPartners.name)
      .limit(30);

    res.json({ resources, isLive: true });
  } catch (err) {
    // Table may not have all columns — return empty gracefully
    res.json({ resources: [], isLive: false, note: "Resource directory not yet configured" });
  }
});
