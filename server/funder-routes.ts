import { Router } from "express";
import { db } from "./storage";
import { funders, referrals } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const funderRouter = Router();

// POST /api/funder — create funder (staff/admin only)
funderRouter.post("/", async (req, res) => {
  if (!(req as any).user?.id) return res.status(401).json({ error: "Auth required" });
  const { name, type = "foundation", linkedOrgIds = [] } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const [created] = await db.insert(funders).values({ name, type, linkedOrgIds }).returning();
    res.status(201).json({ funder: created, dashboardUrl: `/funder/${created.shareToken}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to create funder" });
  }
});

// GET /api/funder/:token/dashboard — public via share token
funderRouter.get("/:token/dashboard", async (req, res) => {
  try {
    const [funder] = await db.select().from(funders).where(eq(funders.shareToken, req.params.token));
    if (!funder) return res.status(404).json({ error: "Dashboard not found" });

    const allReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.funderId, funder.id))
      .orderBy(desc(referrals.createdAt))
      .limit(200);

    const enrolled = allReferrals.filter((r: any) => r.status === "enrolled");
    const valueUnlocked = enrolled.reduce((sum: number, r: any) => sum + (r.benefitValueEstimate || 0), 0);

    const byProgram = Object.entries(
      allReferrals.reduce((acc: any, r: any) => {
        const p = r.programCode;
        if (!acc[p]) acc[p] = { programCode: p, referrals: 0, enrolled: 0, value: 0 };
        acc[p].referrals++;
        if (r.status === "enrolled") {
          acc[p].enrolled++;
          acc[p].value += r.benefitValueEstimate || 0;
        }
        return acc;
      }, {})
    ).map(([, v]) => v);

    const recentActivity = allReferrals.slice(0, 10).map((r: any) => ({
      id: r.id,
      programCode: r.programCode,
      orgName: r.orgName,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({
      funder: { name: funder.name, type: funder.type },
      metrics: {
        totalReferrals: allReferrals.length,
        enrolled: enrolled.length,
        valueUnlocked,
        enrollmentRate: allReferrals.length
          ? Math.round((enrolled.length / allReferrals.length) * 100)
          : 0,
      },
      byProgram,
      recentActivity,
    });
  } catch (err: any) {
    console.error("[funder] dashboard error:", err.message);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});
