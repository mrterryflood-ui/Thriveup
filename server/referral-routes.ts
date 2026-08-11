import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "./storage";
import { referrals } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
// Canonical staff gate — same function used by YHSI, funder, and reentry routes.
import { requireStaff } from "./yhsi-routes";

export const referralRouter = Router();

// POST /api/referrals — create referral (auth or partner key)
referralRouter.post("/", async (req, res) => {
  try {
    const { programCode, orgName, orgId, clientDisplayName, clientPhone, screeningId, funderId, notes } = req.body;
    if (!programCode || !orgName) return res.status(400).json({ error: "programCode and orgName required" });

    const [created] = await db.insert(referrals).values({
      programCode,
      orgName,
      orgId: orgId || null,
      clientDisplayName: clientDisplayName || null,
      clientPhone: clientPhone || null,
      screeningId: screeningId ? parseInt(screeningId) : null,
      chwUserId: (req as any).user?.id ? parseInt((req as any).user.id) : null,
      funderId: funderId || null,
      notes: notes || null,
    }).returning();

    const statusUrl = `/status/${created.statusToken}`;
    res.status(201).json({ referral: { id: created.id, status: created.status, programCode, orgName }, statusUrl });
  } catch (err: any) {
    console.error("[referral] create failed:", err.message);
    res.status(500).json({ error: "Failed to create referral" });
  }
});

// GET /api/referrals/status/:token — public client status check via capability token
referralRouter.get("/status/:token", async (req, res) => {
  try {
    const [r] = await db.select({
      orgName: referrals.orgName,
      programCode: referrals.programCode,
      status: referrals.status,
      notes: referrals.notes,
    }).from(referrals).where(eq(referrals.statusToken, req.params.token as string));

    if (!r) return res.status(404).json({ error: "Referral not found" });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: "Failed to look up referral" });
  }
});

// PATCH /api/referrals/:id/outcome — org confirms enrollment.
// Requires staff auth: the referral id is included in funder CSV exports, so
// an unauthenticated mutation endpoint would allow any recipient of a share
// link to corrupt outcome data and the value metrics that depend on it.
referralRouter.patch("/:id/outcome", requireStaff, async (req: Request, res: Response) => {
  try {
    const { status, benefitValueEstimate, notes } = req.body;
    const validStatuses = ["enrolled", "ineligible", "withdrew", "accepted"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const [updated] = await db.update(referrals)
      .set({ status, benefitValueEstimate: benefitValueEstimate || null, notes: notes || null, resolvedAt: new Date() })
      .where(eq(referrals.id, req.params.id as string))
      .returning({ id: referrals.id, status: referrals.status });

    if (!updated) return res.status(404).json({ error: "Referral not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update outcome" });
  }
});

// GET /api/referrals/my-sent — CHW's sent referrals (requires auth)
referralRouter.get("/my-sent", async (req, res) => {
  if (!(req as any).user?.id) return res.status(401).json({ error: "Authentication required" });
  try {
    const sent = await db.select().from(referrals)
      .where(eq(referrals.chwUserId, parseInt((req as any).user.id as any)))
      .orderBy(desc(referrals.createdAt))
      .limit(50);
    res.json({ referrals: sent });
  } catch (err) {
    res.status(500).json({ error: "Failed to load referrals" });
  }
});
