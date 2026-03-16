import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { grantOpportunities } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as any).user;
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
    if (user?.role === "admin" || user?.role === "teacher") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

const PLATFORM_CAPABILITIES = [
  { area: "Youth Workforce Development", features: ["50+ career pathways", "School-to-career pipelines", "Job readiness curriculum", "Employer partnerships"], grantKeywords: ["workforce", "employment", "job training", "career"] },
  { area: "AI & Digital Literacy Education", features: ["5-level AI mastery curriculum", "10 AI creation tools", "STAAR test prep", "Bilingual support"], grantKeywords: ["education", "digital literacy", "technology", "STEM"] },
  { area: "Youth Reentry Support", features: ["Reentry case management", "Intake assessments", "Phase-based plans", "Court-ready reporting"], grantKeywords: ["reentry", "juvenile justice", "second chance", "recidivism"] },
  { area: "Mentorship & Coaching", features: ["Mentor matching network", "Industry professional connections", "Career coaching", "Peer mentoring"], grantKeywords: ["mentoring", "coaching", "youth development"] },
  { area: "Community-Based Services", features: ["Community partner network", "Resource finder (50 states)", "Partner referral workflows", "Multi-agency coordination"], grantKeywords: ["community", "wraparound", "services", "partnership"] },
  { area: "Data & Outcome Tracking", features: ["IGN-Thrive analytics (6 domains)", "Early warning system", "Recidivism tracking", "DOJ-aligned reporting"], grantKeywords: ["data", "outcomes", "evidence-based", "reporting", "measurement"] },
  { area: "Whole-Child Support", features: ["Behavioral health monitoring", "Housing stability tracking", "Family engagement tools", "Crisis intervention playbooks"], grantKeywords: ["holistic", "behavioral health", "housing", "family"] },
  { area: "Financial Empowerment", features: ["Financial literacy courses", "Stock market simulation", "Entrepreneurship training", "College fundraising"], grantKeywords: ["financial", "economic", "entrepreneurship"] },
];

function computeFitScore(grant: { title?: string; description?: string; focusAreas?: string[]; eligibilityCriteria?: string }): { score: number; matchedAreas: string[]; analysis: Record<string, any> } {
  const searchText = [grant.title, grant.description, ...(grant.focusAreas || []), grant.eligibilityCriteria].filter(Boolean).join(" ").toLowerCase();
  const matchedAreas: string[] = [];
  let totalMatches = 0;

  for (const cap of PLATFORM_CAPABILITIES) {
    const keywordMatches = cap.grantKeywords.filter(k => searchText.includes(k));
    if (keywordMatches.length > 0) {
      matchedAreas.push(cap.area);
      totalMatches += keywordMatches.length;
    }
  }

  const score = Math.min(100, Math.round((matchedAreas.length / PLATFORM_CAPABILITIES.length) * 70 + Math.min(totalMatches * 3, 30)));
  return {
    score,
    matchedAreas,
    analysis: { matchedCapabilities: matchedAreas.length, totalCapabilities: PLATFORM_CAPABILITIES.length, keywordHits: totalMatches },
  };
}

function generateReadinessChecklist(matchedAreas: string[]): Array<{ criterion: string; status: string; feature: string }> {
  const checklist: Array<{ criterion: string; status: string; feature: string }> = [];
  for (const cap of PLATFORM_CAPABILITIES) {
    const isMatched = matchedAreas.includes(cap.area);
    for (const feature of cap.features) {
      checklist.push({
        criterion: `${cap.area}: ${feature}`,
        status: isMatched ? "ready" : "available",
        feature,
      });
    }
  }
  return checklist;
}

export function registerGrantRoutes(app: Express) {
  app.get("/api/grants", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.createdAt));
      res.json(grants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grants" });
    }
  });

  app.post("/api/grants", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      const fitResult = computeFitScore(data);
      const [grant] = await db.insert(grantOpportunities).values({
        ...data,
        fitScore: fitResult.score,
        fitAnalysis: fitResult.analysis,
        readinessChecklist: generateReadinessChecklist(fitResult.matchedAreas),
      }).returning();
      res.json(grant);
    } catch (error) {
      res.status(500).json({ error: "Failed to create grant" });
    }
  });

  app.get("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, req.params.id));
      if (!grant) return res.status(404).json({ error: "Grant not found" });
      res.json(grant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grant" });
    }
  });

  app.patch("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      if (data.title || data.description || data.focusAreas) {
        const fitResult = computeFitScore({ ...data });
        data.fitScore = fitResult.score;
        data.fitAnalysis = fitResult.analysis;
        data.readinessChecklist = generateReadinessChecklist(fitResult.matchedAreas);
      }
      data.updatedAt = new Date();
      const [updated] = await db.update(grantOpportunities).set(data).where(eq(grantOpportunities.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update grant" });
    }
  });

  app.delete("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(grantOpportunities).where(eq(grantOpportunities.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete grant" });
    }
  });

  app.get("/api/grants/platform/capabilities", requireAuth, async (_req, res) => {
    res.json({ capabilities: PLATFORM_CAPABILITIES });
  });

  app.post("/api/grants/analyze-fit", requireAuth, requireAdmin, async (req, res) => {
    try {
      const fitResult = computeFitScore(req.body);
      const checklist = generateReadinessChecklist(fitResult.matchedAreas);
      res.json({ ...fitResult, readinessChecklist: checklist });
    } catch (error) {
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
          title: g.title,
          agency: g.agency,
          fitScore: g.fitScore,
          status: g.status,
          deadline: g.deadline,
          fundingAmount: g.fundingAmount,
        })),
      };
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate alignment report" });
    }
  });
}
