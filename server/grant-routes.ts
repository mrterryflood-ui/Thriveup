import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { grantOpportunities, insertGrantOpportunitySchema } from "@shared/schema";
import type { GrantOpportunity } from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, gte, lte, and, or, ilike } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

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
  { area: "Data & Outcome Tracking", features: ["Thrive analytics", "Recidivism tracking", "Employment outcomes", "DOJ-aligned reporting"], grantKeywords: ["outcomes", "data", "measurement", "evidence-based"] },
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

const SAM_GOV_KEYWORDS = [
  "workforce development", "reentry", "juvenile justice", "youth employment",
  "digital literacy", "community services", "recidivism", "mentoring",
  "second chance", "education technology", "job training", "financial literacy",
  "behavioral health", "wraparound services", "STEM education"
];

interface SAMOpportunity {
  noticeId: string;
  title: string;
  department: string;
  agency: string;
  postedDate: string;
  responseDate: string;
  description: string;
  award?: { amount?: number };
  type?: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  uiLink?: string;
}

async function searchSAMGov(keywords?: string[]): Promise<SAMOpportunity[]> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  const searchTerms = keywords || SAM_GOV_KEYWORDS.slice(0, 5);
  const allResults: SAMOpportunity[] = [];

  for (const keyword of searchTerms.slice(0, 3)) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey || "DEMO_KEY",
        postedFrom: getDateNMonthsAgo(6),
        postedTo: getTodayDate(),
        ptype: "o",
        limit: "10",
        title: keyword,
      });

      const url = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.warn(`SAM.gov search for "${keyword}" returned ${response.status}`);
        continue;
      }

      const data = await response.json() as { opportunitiesData?: SAMOpportunity[] };
      if (data.opportunitiesData) {
        for (const opp of data.opportunitiesData) {
          if (!allResults.find(r => r.noticeId === opp.noticeId)) {
            allResults.push(opp);
          }
        }
      }
    } catch (err) {
      console.warn(`SAM.gov search error for "${keyword}":`, err);
    }
  }

  return allResults;
}

function getDateNMonthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function getTodayDate(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

const aiGrantAnalysisSchema = z.object({
  fitScore: z.number().min(0).max(100).int(),
  summary: z.string(),
  strengths: z.array(z.object({ area: z.string(), description: z.string() })),
  gaps: z.array(z.object({ area: z.string(), description: z.string(), recommendation: z.string() })),
  overallRecommendation: z.enum(["strong_match", "moderate_match", "weak_match", "not_aligned"]),
  grantCategory: z.enum(["workforce", "justice", "education", "health", "community", "technology", "financial"]),
});

type AIGrantAnalysis = z.infer<typeof aiGrantAnalysisSchema>;

async function analyzeGrantWithAI(grantTitle: string, grantDescription: string): Promise<AIGrantAnalysis | null> {
  try {
    const capabilitiesSummary = PLATFORM_CAPABILITIES
      .map(c => `- ${c.area}: ${c.features.join(", ")}`)
      .join("\n");

    const prompt = `Analyze this grant opportunity against our platform capabilities and return a JSON object.

GRANT:
Title: ${grantTitle}
Description: ${grantDescription}

PLATFORM CAPABILITIES:
${capabilitiesSummary}

Return JSON with these fields:
- fitScore (0-100 integer): how well our platform matches this grant
- summary (string): 2-sentence assessment
- strengths (array of {area, description}): platform areas that strongly align
- gaps (array of {area, description, recommendation}): areas where we need to build or improve
- overallRecommendation (string): "strong_match" | "moderate_match" | "weak_match" | "not_aligned"
- grantCategory (string): one of "workforce", "justice", "education", "health", "community", "technology", "financial"`;

    const systemPrompt = "You are a grant alignment analyst for a community development platform. Return ONLY valid JSON, no markdown.";
    const raw = await generateAIJSON(prompt, systemPrompt);
    const parsed = aiGrantAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn("AI grant analysis validation failed:", parsed.error.flatten());
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.error("AI grant analysis failed:", err);
    return null;
  }
}

const grantCreateSchema = insertGrantOpportunitySchema.pick({
  title: true, agency: true, fundingAmount: true, description: true,
  eligibilityCriteria: true, focusAreas: true, sourceUrl: true, grantType: true,
});

function grantToCSVRow(g: GrantOpportunity): string {
  const escape = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    escape(g.title), escape(g.agency), escape(g.fundingAmount), escape(g.fitScore),
    escape(g.status), escape(g.deadline ? new Date(g.deadline).toLocaleDateString() : ""),
    escape(g.grantType), escape((g.focusAreas as string[] | null)?.join("; ") || ""),
    escape(g.sourceUrl),
  ].join(",");
}

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

  app.get("/api/grants/dashboard", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities);
      const now = new Date();
      const upcoming = grants.filter(g => g.deadline && new Date(g.deadline) > now)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

      const categories: Record<string, number> = {};
      for (const g of grants) {
        const cat = g.grantType || "Uncategorized";
        categories[cat] = (categories[cat] || 0) + 1;
      }

      const statusCounts: Record<string, number> = {};
      for (const g of grants) {
        const s = g.status || "identified";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      }

      const totalFunding = grants.reduce((sum, g) => {
        if (!g.fundingAmount) return sum;
        const num = parseFloat(g.fundingAmount.replace(/[^0-9.]/g, ""));
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      const highFit = grants.filter(g => (g.fitScore || 0) >= 70);
      const newHighFit = highFit.filter(g => {
        const created = g.createdAt ? new Date(g.createdAt) : null;
        if (!created) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      });

      res.json({
        totalGrants: grants.length,
        highFitGrants: highFit.length,
        mediumFitGrants: grants.filter(g => (g.fitScore || 0) >= 40 && (g.fitScore || 0) < 70).length,
        lowFitGrants: grants.filter(g => (g.fitScore || 0) < 40 && (g.fitScore || 0) > 0).length,
        totalFunding: totalFunding > 0 ? `$${totalFunding.toLocaleString()}` : null,
        upcomingDeadlines: upcoming.slice(0, 5).map(g => ({
          id: g.id, title: g.title, deadline: g.deadline, fitScore: g.fitScore,
        })),
        categoryCounts: categories,
        statusCounts,
        newHighFitAlerts: newHighFit.map(g => ({
          id: g.id, title: g.title, fitScore: g.fitScore, agency: g.agency,
        })),
        capabilities: PLATFORM_CAPABILITIES,
      });
    } catch (error) {
      console.error("Failed to generate dashboard:", error);
      res.status(500).json({ error: "Failed to generate dashboard" });
    }
  });

  app.post("/api/grants", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = grantCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid grant data", details: parsed.error.flatten().fieldErrors });
      const data = parsed.data;
      const fitResult = computeFitScore(data);

      let aiAnalysis: AIGrantAnalysis | null = null;
      if (data.description) {
        aiAnalysis = await analyzeGrantWithAI(data.title, data.description);
      }

      const finalScore = aiAnalysis ? aiAnalysis.fitScore : fitResult.score;
      const finalAnalysis = aiAnalysis ? {
        ...fitResult.analysis,
        aiSummary: aiAnalysis.summary,
        aiStrengths: aiAnalysis.strengths,
        aiGaps: aiAnalysis.gaps,
        aiRecommendation: aiAnalysis.overallRecommendation,
        aiCategory: aiAnalysis.grantCategory,
      } : fitResult.analysis;

      const [grant] = await db.insert(grantOpportunities).values({
        ...data,
        fitScore: finalScore,
        fitAnalysis: finalAnalysis,
        readinessChecklist: generateReadinessChecklist(fitResult.matchedAreas),
        grantType: aiAnalysis?.grantCategory || data.grantType,
      }).returning();
      res.json(grant);
    } catch (error) {
      console.error("Failed to create grant:", error);
      res.status(500).json({ error: "Failed to create grant" });
    }
  });

  app.get("/api/grants/search/sam", requireAuth, requireAdmin, async (req, res) => {
    try {
      const keywords = req.query.keywords
        ? (req.query.keywords as string).split(",").map(k => k.trim())
        : undefined;
      const results = await searchSAMGov(keywords);
      const analyzed = results.map(opp => {
        const grantLike = {
          title: opp.title,
          description: opp.description,
          focusAreas: null as string[] | null,
          eligibilityCriteria: null as string | null,
        };
        const fit = computeFitScore(grantLike);
        return {
          noticeId: opp.noticeId,
          title: opp.title,
          agency: opp.agency || opp.fullParentPathName || opp.department,
          postedDate: opp.postedDate,
          responseDate: opp.responseDate,
          description: opp.description?.substring(0, 500),
          type: opp.type,
          solicitationNumber: opp.solicitationNumber,
          uiLink: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
          fitScore: fit.score,
          matchedAreas: fit.matchedAreas,
        };
      });
      analyzed.sort((a, b) => b.fitScore - a.fitScore);
      res.json({ results: analyzed, total: analyzed.length, searchedKeywords: keywords || SAM_GOV_KEYWORDS.slice(0, 5) });
    } catch (error) {
      console.error("SAM.gov search failed:", error);
      res.status(500).json({ error: "Failed to search SAM.gov" });
    }
  });

  app.post("/api/grants/import-sam", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { noticeId, title, agency, description, responseDate, uiLink } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const fitResult = computeFitScore({ title, description, focusAreas: null, eligibilityCriteria: null });
      let aiAnalysis: AIGrantAnalysis | null = null;
      if (description) {
        aiAnalysis = await analyzeGrantWithAI(title, description);
      }

      const finalScore = aiAnalysis ? aiAnalysis.fitScore : fitResult.score;

      const [grant] = await db.insert(grantOpportunities).values({
        title,
        agency: agency || null,
        description: description || null,
        deadline: responseDate ? new Date(responseDate) : null,
        sourceUrl: uiLink || `https://sam.gov/opp/${noticeId}/view`,
        fitScore: finalScore,
        fitAnalysis: aiAnalysis ? {
          ...fitResult.analysis,
          samNoticeId: noticeId,
          aiSummary: aiAnalysis.summary,
          aiStrengths: aiAnalysis.strengths,
          aiGaps: aiAnalysis.gaps,
          aiRecommendation: aiAnalysis.overallRecommendation,
          aiCategory: aiAnalysis.grantCategory,
        } : { ...fitResult.analysis, samNoticeId: noticeId },
        readinessChecklist: generateReadinessChecklist(fitResult.matchedAreas),
        grantType: aiAnalysis?.grantCategory || "federal",
        status: "identified",
      }).returning();

      res.json(grant);
    } catch (error) {
      console.error("Failed to import SAM.gov grant:", error);
      res.status(500).json({ error: "Failed to import grant" });
    }
  });

  app.post("/api/grants/:id/ai-analyze", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, id));
      if (!grant) return res.status(404).json({ error: "Grant not found" });
      if (!grant.description) return res.status(400).json({ error: "Grant needs a description for AI analysis" });

      const aiAnalysis = await analyzeGrantWithAI(grant.title, grant.description);
      if (!aiAnalysis) return res.status(500).json({ error: "AI analysis failed" });

      const existingAnalysis = (grant.fitAnalysis as Record<string, unknown>) || {};
      const [updated] = await db.update(grantOpportunities).set({
        fitScore: aiAnalysis.fitScore,
        fitAnalysis: {
          ...existingAnalysis,
          aiSummary: aiAnalysis.summary,
          aiStrengths: aiAnalysis.strengths,
          aiGaps: aiAnalysis.gaps,
          aiRecommendation: aiAnalysis.overallRecommendation,
          aiCategory: aiAnalysis.grantCategory,
        },
        updatedAt: new Date(),
      }).where(eq(grantOpportunities.id, id)).returning();

      res.json(updated);
    } catch (error) {
      console.error("AI analysis failed:", error);
      res.status(500).json({ error: "AI analysis failed" });
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

  app.post("/api/grants/analyze-fit", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        focusAreas: z.array(z.string()).optional(),
        eligibilityCriteria: z.string().optional(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
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
        platform: "ThriveUp Academy",
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

  app.get("/api/grants/export/csv", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.fitScore));
      const header = "Title,Agency,Funding Amount,Fit Score,Status,Deadline,Type,Focus Areas,Source URL";
      const rows = grants.map(grantToCSVRow);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="grant-alignment-report-${new Date().toISOString().split("T")[0]}.csv"`);
      res.send([header, ...rows].join("\n"));
    } catch (error) {
      console.error("CSV export failed:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/grants/report/wioa", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities);
      const wioaGrants = grants.filter(g => {
        const text = [g.title, g.description, g.grantType, ...(g.focusAreas as string[] || [])].join(" ").toLowerCase();
        return text.includes("wioa") || text.includes("workforce") || text.includes("employment") || text.includes("job training");
      });

      const report = {
        reportType: "WIOA/DOL Workforce Pipeline Report",
        generatedAt: new Date().toISOString(),
        platform: "ThriveUp Academy",
        reportingPeriod: {
          start: getDateNMonthsAgo(12),
          end: getTodayDate(),
        },
        wioaAlignment: {
          totalWorkforceGrants: wioaGrants.length,
          highAlignment: wioaGrants.filter(g => (g.fitScore || 0) >= 70).length,
          coreIndicators: {
            youthPlacementRate: "Platform tracks employment outcomes via Thrive analytics",
            credentialAttainment: "AI Digital Literacy curriculum with 5 certification levels",
            measurableSkillGains: "Skill assessments across 50+ career pathways",
            effectivenessInServingEmployers: "Employer partnership network with hiring commitments tracking",
          },
          youthServiceElements: [
            "Tutoring and study skills (AI-powered curriculum)",
            "Paid and unpaid work experiences (Career pathway tracking)",
            "Occupational skills training (50+ career field modules)",
            "Education offered concurrently with workforce preparation",
            "Leadership development (Mentorship matching)",
            "Supportive services (Community partner referrals)",
            "Adult mentoring (Mentor network)",
            "Financial literacy education (Financial literacy courses)",
            "Entrepreneurial skills training (Entrepreneurship modules)",
            "Labor market information (GIS-powered community intelligence)",
          ],
        },
        platformCapabilities: PLATFORM_CAPABILITIES.filter(c =>
          c.grantKeywords.some(k => ["workforce", "employment", "job training", "career", "financial"].includes(k))
        ),
        grantPipeline: wioaGrants.map(g => ({
          title: g.title, agency: g.agency, fitScore: g.fitScore,
          status: g.status, fundingAmount: g.fundingAmount,
        })),
      };
      res.json(report);
    } catch (error) {
      console.error("WIOA report failed:", error);
      res.status(500).json({ error: "Failed to generate WIOA report" });
    }
  });
}
