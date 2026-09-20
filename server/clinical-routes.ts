import express from "express";
import { z } from "zod";
import { db, storage } from "./storage";
import { clinicalScreenings } from "../shared/clinical-schema";
import { scoreRnr, scorePhq9, scorePcl5, RNR_ITEMS, PHQ9_ITEMS, PCL5_ITEMS } from "./clinical-instruments";
import { generateReferrals } from "./referral-routing";
import { and, eq, desc } from "drizzle-orm";

const clinicalRouter = express.Router();
const CLINICAL_STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

function getUserId(req: express.Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub || user?.id;
}

async function isClinicalStaff(userId: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  return !!user && CLINICAL_STAFF_ROLES.has(user.role);
}

clinicalRouter.get("/instruments", (_req, res) => {
  res.json({
    rnr: { items: RNR_ITEMS, totalItems: RNR_ITEMS.length, maxScore: 50 },
    phq9: { items: PHQ9_ITEMS, totalItems: 9, maxScore: 27 },
    pcl5: { items: PCL5_ITEMS, totalItems: 20, maxScore: 80 },
  });
});

clinicalRouter.post("/screen", async (req, res) => {
  try {
    const callerId = getUserId(req);
    if (!callerId) return res.status(401).json({ error: "Authentication required" });

    const schema = z.object({
      participantId: z.string().optional(),
      userId: z.string().optional(),
      householdId: z.string().optional(),
      instrumentType: z.enum(["rnr_criminogenic","phq9","pcl5","combined"]).default("combined"),
      administeredBy: z.string().optional(),
      rnrResponses: z.record(z.boolean()).optional(),
      phq9Responses: z.record(z.number().min(0).max(3)).optional(),
      pcl5Responses: z.record(z.number().min(0).max(4)).optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const data = parsed.data;
    const clinicalStaff = await isClinicalStaff(callerId);
    const participantId = data.participantId ?? callerId;

    // A regular member may complete a screening only for their own account.
    // Staff can administer one for an explicitly selected participant, but the
    // persisted userId is always the authenticated actor—not client input.
    if (participantId !== callerId && !clinicalStaff) {
      return res.status(403).json({ error: "You may only complete your own screening" });
    }

    const rnrResult = data.rnrResponses ? scoreRnr(data.rnrResponses) : undefined;
    const phq9Result = data.phq9Responses ? scorePhq9(data.phq9Responses) : undefined;
    const pcl5Result = data.pcl5Responses ? scorePcl5(data.pcl5Responses) : undefined;

    const { referrals, requiresImmediateIntervention, requiresClinicalFollowup } =
      generateReferrals({ rnrResult, phq9Result, pcl5Result });

    const [screening] = await db.insert(clinicalScreenings).values({
      participantId,
      userId: callerId,
      householdId: data.householdId,
      instrumentType: data.instrumentType,
      administeredBy: clinicalStaff ? callerId : "self",
      rnrTotalScore: rnrResult?.totalScore,
      rnrRiskLevel: rnrResult?.riskLevel as any,
      rnrDomainScores: rnrResult?.domainScores as any,
      rnrFlaggedDomains: rnrResult?.flaggedDomains,
      rnrResponses: data.rnrResponses as any,
      phq9TotalScore: phq9Result?.totalScore,
      phq9Severity: phq9Result?.severity,
      phq9SuicidalIdeation: phq9Result?.suicidalIdeation ?? false,
      phq9Responses: data.phq9Responses as any,
      pcl5TotalScore: pcl5Result?.totalScore,
      pcl5PtsdIndicator: pcl5Result?.ptsdIndicator ?? false,
      pcl5ClusterScores: pcl5Result?.clusterScores as any,
      pcl5Responses: data.pcl5Responses as any,
      referrals: referrals as any,
      requiresClinicalFollowup,
      requiresImmediateIntervention,
      notes: data.notes,
    }).returning();

    res.json({
      screening,
      rnrResult,
      phq9Result,
      pcl5Result,
      referrals,
      requiresImmediateIntervention,
      requiresClinicalFollowup,
      crisisAlert: phq9Result?.suicidalIdeation
        ? { message: "Please reach out for support right now. You are not alone.", contact: "Call or text 988" }
        : null,
    });
  } catch (err) {
    console.error("[clinical-routes] POST /screen:", err);
    res.status(500).json({ error: "Screening failed" });
  }
});

clinicalRouter.get("/screenings/:participantId", async (req, res) => {
  try {
    const callerId = getUserId(req);
    if (!callerId) return res.status(401).json({ error: "Authentication required" });

    const participantId = String(req.params.participantId);
    const clinicalStaff = await isClinicalStaff(callerId);
    const accessFilter = clinicalStaff
      ? eq(clinicalScreenings.participantId, participantId)
      : and(
          eq(clinicalScreenings.participantId, participantId),
          eq(clinicalScreenings.userId, callerId),
        );

    const screenings = await db.select().from(clinicalScreenings)
      .where(accessFilter)
      .orderBy(desc(clinicalScreenings.administeredAt));
    res.json(screenings);
  } catch { res.status(500).json({ error: "Failed to load screenings" }); }
});

export { clinicalRouter };
