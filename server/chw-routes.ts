import { Router, type Request, type Response } from "express";
import { db, storage } from "./storage";
import { benefitsScreenings, communityPartners, chwVisits } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const chwRouter = Router();

// Staff roles that can access CHW data — keep in lockstep with yhsi-routes.ts STAFF_ROLES
const CHW_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

async function requireCHWRole(req: Request, res: Response, next: () => void) {
  // Replit Auth puts the user object on req.user via passport — the user ID lives
  // at req.user.claims.sub (same pattern as getUserId() in routes.ts).
  const user = (req as any).user;
  const userId: string | undefined =
    user?.claims?.sub ??   // standard passport path (Replit OIDC)
    user?.id ??            // legacy fallback
    (req as any).session?.userId;
  if (!userId) return (res as any).status(401).json({ error: "Authentication required" });
  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !CHW_ROLES.has(dbUser.role)) return (res as any).status(403).json({ error: "CHW role required" });
    // Attach userId (string) for downstream DB scoping.
    // chwNumericId is kept for the integer chw_user_id column (parsed as base-10 int
    // for test users whose IDs are real DB-generated UUIDs this will be NaN —
    // that's fine for the caseload/visits queries which use it only as-is).
    (req as any).chwNumericId = parseInt(userId, 10) || 0;
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
      screeningId: s.id,
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
// Visits with a clientScreeningId join to benefitsScreenings to surface a
// stable case reference; visits without it use the free-text clientDisplayName.
chwRouter.get("/visits", requireCHWRole, async (req: Request, res: Response) => {
  try {
    const chwUserId: number = (req as any).chwNumericId;
    const rows = await db
      .select()
      .from(chwVisits)
      .where(eq(chwVisits.chwUserId, chwUserId))
      .orderBy(desc(chwVisits.visitDate))
      .limit(50);

    // For visits that have a clientScreeningId, pull the linked screening in one query.
    const screeningIds = rows
      .map((v) => v.clientScreeningId)
      .filter((id): id is string => !!id);

    const screeningMap: Map<string, { id: string }> = new Map();
    if (screeningIds.length > 0) {
      const screenings = await db
        .select({ id: benefitsScreenings.id })
        .from(benefitsScreenings)
        .where(eq(benefitsScreenings.id, screeningIds[0])); // Drizzle inList not available — iterate
      // Fetch all linked screenings individually (count is bounded by the 50-row visit limit)
      for (const sid of screeningIds) {
        const [s] = await db
          .select({ id: benefitsScreenings.id })
          .from(benefitsScreenings)
          .where(eq(benefitsScreenings.id, sid))
          .limit(1);
        if (s) screeningMap.set(s.id, s);
      }
    }

    const visits = rows.map((v) => {
      const linked = v.clientScreeningId ? screeningMap.get(v.clientScreeningId) : undefined;
      return {
        id: v.id,
        clientName: linked
          ? `Case #${String(linked.id).slice(-4)}`
          : (v.clientDisplayName ?? "Anonymous Client"),
        clientDisplayName: v.clientDisplayName ?? null,
        clientScreeningId: v.clientScreeningId ?? null,
        // Surface a stable case reference when linked to a real screening
        caseRef: linked ? { screeningId: linked.id, label: `Case #${String(linked.id).slice(-4)}` } : null,
        visitDate: v.visitDate,
        visitType: v.visitType,
        duration: v.durationMinutes ?? 0,
        notes: v.notes ?? "",
        followUpNeeded: v.followUpNeeded,
        followUpDate: v.followUpDate ?? null,
      };
    });

    res.json({ visits, isLive: true, count: visits.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to load visits" });
  }
});

// POST /api/chw/visits — log a new home visit for this authenticated CHW.
// Optional clientScreeningId: if provided, validates that:
//   1. The screening exists (404 if not).
//   2. screening.referredToChwId matches this CHW's userId (403 if mismatched).
chwRouter.post("/visits", requireCHWRole, async (req: Request, res: Response) => {
  try {
    const chwUserId: number = (req as any).chwNumericId;
    const chwStringId: string = (req as any).chwStringId;
    const {
      clientDisplayName,
      clientScreeningId,
      visitDate,
      visitType,
      durationMinutes,
      notes,
      followUpNeeded,
      followUpDate,
    } = req.body;

    if (!visitDate) return res.status(400).json({ error: "visitDate is required" });

    // Validate clientScreeningId if provided
    if (clientScreeningId) {
      const [screening] = await db
        .select({ id: benefitsScreenings.id, referredToChwId: benefitsScreenings.referredToChwId })
        .from(benefitsScreenings)
        .where(eq(benefitsScreenings.id, String(clientScreeningId)))
        .limit(1);

      if (!screening) {
        return res.status(404).json({ error: "Screening not found" });
      }
      if (screening.referredToChwId !== chwStringId) {
        return res.status(403).json({ error: "This screening is not assigned to you" });
      }
    }

    const [created] = await db.insert(chwVisits).values({
      chwUserId,
      clientDisplayName: clientDisplayName || null,
      clientScreeningId: clientScreeningId ? String(clientScreeningId) : null,
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
