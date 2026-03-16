import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { grantOpportunities, insertGrantOpportunitySchema } from "@shared/schema";
import type { GrantOpportunity } from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher" || user?.role === "case_manager") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

const PLATFORM_CAPABILITIES = [
  { area: "Youth Workforce Development", features: ["50+ career pathways", "School-to-career pipelines", "Job readiness curriculum", "Employer partnerships"], grantKeywords: ["workforce", "employment", "job training", "career"] },
  { area: "AI & Digital Literacy Education", features: ["5-level AI mastery curriculum", "10 AI creation tools", "STAAR test prep", "Bilingual support"], grantKeywords: ["education", "digital literacy", "technology", "STEM"] },
  { area: "Youth Reentry Support", features: ["Reentry case management", "Intake assessments", "Phase-based plans", "Court-ready reporting"], grantKeywords: ["reentry", "juvenile justice", "second chance", "recidivism"] },
  { area: "Mentorship & Coaching", features: ["Mentor matching network", "Industry professional connections", "Career coaching", "Peer mentoring"], grantKeywords: ["mentoring", "coaching", "youth development"] },
  { area: "Community-Based Services", features: ["Community partner network", "Resource finder (50 states)", "Partner referral workflows", "Multi-agency coordination"], grantKeywords: ["community", "wraparound", "services", "partnership"] },
  { area: "Data & Outcome Tracking", features: ["IGN-Thrive analytics", "Recidivism tracking", "Employment outcomes", "DOJ-aligned reporting"], grantKeywords: ["outcomes", "data", "measurement", "evidence-based"] },
  { area: "Financial Literacy", features: ["Financial education courses", "Stock market simulation", "Entrepreneurship training", "College fundraising"], grantKeywords: ["financial", "economic", "entrepreneurship", "sustainability"] },
  { area: "Whole-Child Support", features: ["Six-domain Thrive scoring", "Early warning system", "GIS context engine", "Behavioral health integration"], grantKeywords: ["holistic", "whole-child", "behavioral health", "trauma-informed"] },
];

interface FitResult {
  score: number;
  analysis: { matchedAreas: string[]; totalAreas: number; keywords: string[] };
  matchedAreas: string[];
}

function computeFitScore(grant: { title?: string | null; description?: string | null; focusAreas?: string[] | null; eligibilityCriteria?: string | null }): FitResult {
  const searchText = [grant.title, grant.description, ...(grant.focusAreas || []), grant.eligibilityCriteria].join(" ").toLowerCase();
  const matchedAreas: string[] = [];
  const matchedKeywords: string[] = [];
  for (const cap of PLATFORM_CAPABILITIES) {
    for (const keyword of cap.grantKeywords) {
      if (searchText.includes(keyword)) {
        if (!matchedAreas.includes(cap.area)) matchedAreas.push(cap.area);
        if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword);
      }
    }
  }
  const score = Math.min(100, Math.round((matchedAreas.length / PLATFORM_CAPABILITIES.length) * 100));
  return { score, analysis: { matchedAreas, totalAreas: PLATFORM_CAPABILITIES.length, keywords: matchedKeywords }, matchedAreas };
}

interface ReadinessItem { criterion: string; status: string; feature: string }

function generateReadinessChecklist(matchedAreas: string[]): ReadinessItem[] {
  const checklist: ReadinessItem[] = [];
  for (const cap of PLATFORM_CAPABILITIES) {
    const isMatched = matchedAreas.includes(cap.area);
    for (const feature of cap.features) {
      checklist.push({ criterion: `${cap.area}: ${feature}`, status: isMatched ? "ready" : "available", feature });
    }
  }
  return checklist;
}

const grantCreateSchema = insertGrantOpportunitySchema.pick({
  title: true, agency: true, fundingAmount: true, description: true,
  eligibilityCriteria: true, focusAreas: true, sourceUrl: true, grantType: true,
});

export function registerGrantRoutes(app: Express) {
  app.get("/api/grants", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.createdAt));
      res.json(grants);
    } catch (error) {
      console.error("Failed to fetch grants:", error);
      res.status(500).json({ error: "Failed to fetch grants" });
    }
  });

  app.post("/api/grants", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = grantCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid grant data", details: parsed.error.flatten().fieldErrors });
      const data = parsed.data;
      const fitResult = computeFitScore(data);
      const [grant] = await db.insert(grantOpportunities).values({
        ...data,
        fitScore: fitResult.score,
        fitAnalysis: fitResult.analysis,
        readinessChecklist: generateReadinessChecklist(fitResult.matchedAreas),
      }).returning();
      res.json(grant);
    } catch (error) {
      console.error("Failed to create grant:", error);
      res.status(500).json({ error: "Failed to create grant" });
    }
  });

  app.get("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, id));
      if (!grant) return res.status(404).json({ error: "Grant not found" });
      res.json(grant);
    } catch (error) {
      console.error("Failed to fetch grant:", error);
      res.status(500).json({ error: "Failed to fetch grant" });
    }
  });

  app.patch("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const parsed = grantCreateSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid grant data", details: parsed.error.flatten().fieldErrors });
      const data: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.title || parsed.data.description || parsed.data.focusAreas) {
        const fitResult = computeFitScore(parsed.data);
        data.fitScore = fitResult.score;
        data.fitAnalysis = fitResult.analysis;
        data.readinessChecklist = generateReadinessChecklist(fitResult.matchedAreas);
      }
      const [updated] = await db.update(grantOpportunities).set(data).where(eq(grantOpportunities.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update grant:", error);
      res.status(500).json({ error: "Failed to update grant" });
    }
  });

  app.delete("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      await db.delete(grantOpportunities).where(eq(grantOpportunities.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete grant:", error);
      res.status(500).json({ error: "Failed to delete grant" });
    }
  });

  app.get("/api/grants/platform/capabilities", requireAuth, async (_req, res) => {
    res.json({ capabilities: PLATFORM_CAPABILITIES });
  });

  const analyzeFitSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    focusAreas: z.array(z.string()).optional(),
    eligibilityCriteria: z.string().optional(),
  });

  app.post("/api/grants/analyze-fit", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = analyzeFitSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid fit analysis data", details: parsed.error.flatten().fieldErrors });
      const fitResult = computeFitScore(parsed.data);
      const checklist = generateReadinessChecklist(fitResult.matchedAreas);
      res.json({ ...fitResult, readinessChecklist: checklist });
    } catch (error) {
      console.error("Failed to analyze grant fit:", error);
      res.status(500).json({ error: "Failed to analyze grant fit" });
    }
  });

  app.get("/api/grants/report/alignment", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.fitScore));
      const report = {
        generatedAt: new Date().toISOString(),
        platform: "AI Mastery Academy & School Support Hub",
        totalGrants: grants.length,
        highFitGrants: grants.filter(g => (g.fitScore || 0) >= 70).length,
        mediumFitGrants: grants.filter(g => (g.fitScore || 0) >= 40 && (g.fitScore || 0) < 70).length,
        capabilities: PLATFORM_CAPABILITIES,
        grants: grants.map(g => ({
          title: g.title, agency: g.agency, fitScore: g.fitScore,
          status: g.status, deadline: g.deadline, fundingAmount: g.fundingAmount,
        })),
      };
      res.json(report);
    } catch (error) {
      console.error("Failed to generate alignment report:", error);
      res.status(500).json({ error: "Failed to generate alignment report" });
    }
  });
}
