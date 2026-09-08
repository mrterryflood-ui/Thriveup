import type { Express, Request, Response, NextFunction } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, storage } from "./storage";
import { threeRealitiesAssessments } from "@shared/schema";

const STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

const assessmentSchema = z.object({
  researchReality: z.object({
    summary: z.string().min(1),
    citations: z.array(z.string()).default([]),
    keyFindings: z.array(z.string()).default([]),
  }),
  politicalReality: z.object({
    summary: z.string().optional().nullable(),
    barriers: z.array(z.string()).default([]),
    funderAlignment: z.string().optional().nullable(),
  }),
  groundTruth: z.object({
    observationCount: z.number().int().nonnegative().default(0),
    themes: z.array(z.string()).default([]),
    summary: z.string().optional().nullable(),
  }),
  gapDiagnosis: z.object({
    primaryGap: z.string().min(1),
    cfirDomain: z.string().nullable().optional(),
    ericStrategy: z.string().nullable().optional(),
    adaptiveFidelityNote: z.string().nullable().optional(),
  }),
  product: z.string().max(30).optional(),
});

function draftAssessment() {
  return {
    researchReality: { summary: "No assessment yet", citations: [] },
    politicalReality: { summary: "No assessment yet", barriers: [] },
    groundTruth: { observationCount: 0, themes: [] },
    gapDiagnosis: { primaryGap: "Insufficient data for diagnosis", cfirDomain: null, ericStrategy: null },
  };
}

function toDiagnostic(row: typeof threeRealitiesAssessments.$inferSelect) {
  return {
    researchReality: {
      summary: row.researchSummary,
      citations: row.rpliceSourceIds,
      keyFindings: row.researchKeyFindings,
    },
    politicalReality: {
      summary: row.activePolicySummary ?? "No assessment yet",
      barriers: [row.programCapacityNote, row.funderAlignment].filter((value): value is string => !!value),
      funderAlignment: row.funderAlignment,
    },
    groundTruth: {
      observationCount: row.communitySubmissionCount + row.chwObservationCount,
      themes: [],
      summary: row.groundTruthSummary ?? "No assessment yet",
    },
    gapDiagnosis: {
      primaryGap: row.primaryGap,
      cfirDomain: row.cfirBarrierDomain,
      ericStrategy: row.ericStrategyRecommendation,
      adaptiveFidelityNote: row.adaptiveFidelityNote,
    },
  };
}

async function requireStaff(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const userId = user?.claims?.sub ?? user?.id ?? (req as any).session?.userId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !STAFF_ROLES.has(dbUser.role)) {
      return res.status(403).json({ error: "Staff access required" });
    }
    (req as any).threeRealitiesUserId = userId;
    next();
  } catch {
    res.status(500).json({ error: "Unable to verify staff access" });
  }
}

export function registerThreeRealitiesRoutes(app: Express) {
  app.get("/api/three-realities/:geographyKey", async (req: Request, res: Response) => {
    const geographyKey = (req.params.geographyKey as string)?.trim();
    if (!geographyKey || geographyKey.length > 20) {
      return res.status(400).json({ error: "A valid geography key is required" });
    }
    try {
      const [assessment] = await db.select()
        .from(threeRealitiesAssessments)
        .where(eq(threeRealitiesAssessments.geographyKey, geographyKey))
        .orderBy(desc(threeRealitiesAssessments.assessedAt))
        .limit(1);
      return res.json(assessment ? toDiagnostic(assessment) : draftAssessment());
    } catch (error) {
      console.error("[three-realities] read failed", error);
      return res.status(500).json({ error: "Unable to load assessment" });
    }
  });

  app.post("/api/three-realities/:geographyKey", requireStaff, async (req: Request, res: Response) => {
    const geographyKey = (req.params.geographyKey as string)?.trim();
    if (!geographyKey || geographyKey.length > 20) {
      return res.status(400).json({ error: "A valid geography key is required" });
    }
    const parsed = assessmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid assessment", details: parsed.error.flatten() });

    const value = parsed.data;
    const fields = {
      product: value.product ?? "general",
      researchSummary: value.researchReality.summary,
      rpliceSourceIds: value.researchReality.citations,
      researchKeyFindings: value.researchReality.keyFindings,
      activePolicySummary: value.politicalReality.summary ?? null,
      funderAlignment: value.politicalReality.funderAlignment ?? null,
      programCapacityNote: value.politicalReality.barriers.join("; ") || null,
      communitySubmissionCount: value.groundTruth.observationCount,
      chwObservationCount: 0,
      groundTruthSummary: value.groundTruth.summary ?? (value.groundTruth.themes.join("; ") || null),
      primaryGap: value.gapDiagnosis.primaryGap,
      cfirBarrierDomain: value.gapDiagnosis.cfirDomain ?? null,
      ericStrategyRecommendation: value.gapDiagnosis.ericStrategy ?? null,
      adaptiveFidelityNote: value.gapDiagnosis.adaptiveFidelityNote ?? null,
      assessedAt: new Date(),
      assessedByUserId: (req as any).threeRealitiesUserId,
    };
    try {
      const [existing] = await db.select({ id: threeRealitiesAssessments.id })
        .from(threeRealitiesAssessments)
        .where(eq(threeRealitiesAssessments.geographyKey, geographyKey))
        .orderBy(desc(threeRealitiesAssessments.assessedAt))
        .limit(1);
      const [assessment] = existing
        ? await db.update(threeRealitiesAssessments).set(fields).where(eq(threeRealitiesAssessments.id, existing.id)).returning()
        : await db.insert(threeRealitiesAssessments).values({ geographyKey, ...fields }).returning();
      return res.json(toDiagnostic(assessment));
    } catch (error) {
      console.error("[three-realities] write failed", error);
      return res.status(500).json({ error: "Unable to save assessment" });
    }
  });
}