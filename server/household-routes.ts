import express from "express";
import { z } from "zod";
import { db } from "./storage";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  households,
  householdMembers,
  householdMemberConsent,
  householdSdohSnapshots,
  householdOutcomes,
} from "../shared/household-schema";
import {
  getHouseholdProfile,
  findOrCreateHousehold,
  snapshotHouseholdOutcomes,
} from "./household-queries";

const householdRouter = express.Router();

householdRouter.get("/:id", async (req, res) => {
  try {
    const profile = await getHouseholdProfile(req.params.id, (req as any).user?.id);
    if (!profile) return res.status(404).json({ error: "Household not found" });
    res.json(profile);
  } catch (err) {
    console.error("[household-routes] GET /:id", err);
    res.status(500).json({ error: "Failed to load household profile" });
  }
});

householdRouter.post("/", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string(),
      memberName: z.string(),
      zipCode: z.string().optional(),
      countyFips: z.string().optional(),
      censusTract: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const result = await findOrCreateHousehold(
      parsed.data.userId,
      parsed.data.memberName,
      { zipCode: parsed.data.zipCode, countyFips: parsed.data.countyFips, censusTract: parsed.data.censusTract }
    );
    res.json(result);
  } catch (err) {
    console.error("[household-routes] POST /", err);
    res.status(500).json({ error: "Failed to create household" });
  }
});

householdRouter.post("/:id/members", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().optional(),
      memberName: z.string(),
      role: z.enum(["primary", "adult_member", "youth_member", "dependent"]).default("adult_member"),
      isMinor: z.boolean().default(false),
      hasVehicle: z.boolean().default(false),
      dateOfBirth: z.string().optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [member] = await db
      .insert(householdMembers)
      .values({ householdId: req.params.id, ...parsed.data })
      .returning();
    res.json(member);
  } catch (err) {
    console.error("[household-routes] POST /:id/members", err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

householdRouter.patch("/members/:memberId/status", async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(["active", "inactive", "deceased", "incarcerated", "relocated"]),
      leftReason: z.string().optional(),
      leftHouseholdAt: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [updated] = await db
      .update(householdMembers)
      .set({
        status: parsed.data.status,
        leftReason: parsed.data.leftReason,
        leftHouseholdAt: parsed.data.leftHouseholdAt
          ? new Date(parsed.data.leftHouseholdAt)
          : parsed.data.status !== "active" ? new Date() : null,
      })
      .where(eq(householdMembers.id, req.params.memberId))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error("[household-routes] PATCH /members/:memberId/status", err);
    res.status(500).json({ error: "Failed to update member status" });
  }
});

householdRouter.post("/:id/sdoh", async (req, res) => {
  try {
    const schema = z.object({
      memberId: z.string(),
      housingScore: z.number().min(0).max(1).default(0),
      foodScore: z.number().min(0).max(1).default(0),
      transportationScore: z.number().min(0).max(1).default(0),
      childcareScore: z.number().min(0).max(1).default(0),
      legalScore: z.number().min(0).max(1).default(0),
      healthcareScore: z.number().min(0).max(1).default(0),
      safetyScore: z.number().min(0).max(1).default(0),
      compositeBurdenScore: z.number().min(0).max(70).default(0),
      burdenCategory: z.enum(["low", "moderate", "high", "critical"]).optional(),
      rawResponses: z.record(z.any()).optional(),
      routedPartners: z.array(z.any()).optional(),
      screenedBy: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [snapshot] = await db
      .insert(householdSdohSnapshots)
      .values({ householdId: req.params.id, ...parsed.data, compositeBurdenScore: Math.round(parsed.data.compositeBurdenScore) })
      .returning();
    await snapshotHouseholdOutcomes(req.params.id).catch(
      (e) => console.error("[household-routes] snapshot failed:", e)
    );
    res.json(snapshot);
  } catch (err) {
    console.error("[household-routes] POST /:id/sdoh", err);
    res.status(500).json({ error: "Failed to record SDOH screening" });
  }
});

householdRouter.patch("/members/:memberId/consent", async (req, res) => {
  try {
    const schema = z.object({
      householdId: z.string(),
      domain: z.enum(["employment","education","housing","food","transportation","childcare","legal","healthcare","safety","financial"]),
      consentLevel: z.enum(["private","household","facilitator","program"]),
      consentedBy: z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    await db
      .update(householdMemberConsent)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(householdMemberConsent.memberId, req.params.memberId),
        eq(householdMemberConsent.domain, parsed.data.domain),
        isNull(householdMemberConsent.revokedAt)
      ));
    const [consent] = await db
      .insert(householdMemberConsent)
      .values({
        householdId: parsed.data.householdId,
        memberId: req.params.memberId,
        domain: parsed.data.domain,
        consentLevel: parsed.data.consentLevel,
        consentedBy: parsed.data.consentedBy,
      })
      .returning();
    res.json(consent);
  } catch (err) {
    console.error("[household-routes] PATCH /members/:memberId/consent", err);
    res.status(500).json({ error: "Failed to update consent" });
  }
});

householdRouter.get("/:id/outcomes", async (req, res) => {
  try {
    const outcomes = await db
      .select()
      .from(householdOutcomes)
      .where(eq(householdOutcomes.householdId, req.params.id))
      .orderBy(desc(householdOutcomes.measuredAt))
      .limit(24);
    res.json(outcomes);
  } catch (err) {
    res.status(500).json({ error: "Failed to load outcomes" });
  }
});

householdRouter.post("/:id/snapshot", async (req, res) => {
  try {
    await snapshotHouseholdOutcomes(req.params.id);
    res.json({ ok: true, snapshotted: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Snapshot failed" });
  }
});

export { householdRouter };
