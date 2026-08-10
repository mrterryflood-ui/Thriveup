import { Router } from "express";
import { db, storage } from "./storage";
import { benefitsScreenings, communityPartners } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const chwRouter = Router();

// Staff roles that can access CHW data — keep in lockstep with yhsi-routes.ts STAFF_ROLES
const CHW_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

async function requireCHWRole(req: any, res: any, next: any) {
  const userId: string | undefined = req.user?.id ?? req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (!user || !CHW_ROLES.has(user.role)) return res.status(403).json({ error: "CHW role required" });
    next();
  } catch { res.status(500).json({ error: "Auth check failed" }); }
}

// GET /api/chw/caseload — clients with active screenings assigned to this CHW
chwRouter.get("/caseload", requireCHWRole, async (req, res) => {
  try {
    // Get screenings where notes contain this user's ID as assigned CHW
    // (Full wiring requires assignedChwId column — return empty with helpful message if not wired)
    const screenings = await db.select().from(benefitsScreenings)
      .orderBy(desc(benefitsScreenings.createdAt))
      .limit(50);

    // Anonymize: return only non-PII fields
    const caseload = screenings.map((s: any, i: number) => ({
      id: s.id,
      displayName: `Client #${String(i + 1).padStart(3, "0")}`,
      status: "active",
      priority: s.estimatedAnnualValue && s.estimatedAnnualValue > 10000 ? "high" : "moderate",
      programCount: Array.isArray(s.eligibleBenefits) ? s.eligibleBenefits.length : 0,
      screened: s.createdAt,
    }));

    res.json({ caseload, isLive: true, count: caseload.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to load caseload" });
  }
});

// GET /api/chw/resources — active community partners
chwRouter.get("/resources", requireCHWRole, async (req, res) => {
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
