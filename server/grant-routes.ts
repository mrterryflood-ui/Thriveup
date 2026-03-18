import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { grantOpportunities, grantAlerts, platformGaps, insertGrantOpportunitySchema, advisoryBoardMembers, advisoryBoardMeetings, staffingPlanEntries, insertAdvisoryBoardMemberSchema, insertAdvisoryBoardMeetingSchema, insertStaffingPlanEntrySchema, outcomeTracking, participantProfiles, serviceRecords, grantReminders, grantChecklistItems, insertGrantReminderSchema, insertGrantChecklistItemSchema } from "@shared/schema";
import type { GrantOpportunity } from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, gte, lte, and, or, ilike } from "drizzle-orm";
import { generateAIResponse } from "./ai-provider";
import PDFDocument from "pdfkit";
import type { SQL } from "drizzle-orm";

interface AIAnalysisResult {
  summary: string;
  recommendedActions: string[];
  competitiveAdvantage: string;
}

interface StrengthItem {
  area: string;
  detail: string;
}

interface GapItem {
  area: string;
  detail: string;
  effort: string;
}

interface StrengthsGapsResult {
  strengths: StrengthItem[];
  gaps: GapItem[];
}

interface GrantAIResult {
  aiAnalysis: AIAnalysisResult;
  strengthsGaps: StrengthsGapsResult;
  fitScore: number;
}

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : String(id);
}

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

const GRANT_CATEGORIES = ["workforce", "justice", "education", "health", "community"] as const;

function categorizeGrant(grant: { title?: string | null; description?: string | null; focusAreas?: string[] | null }): string {
  const text = [grant.title, grant.description, ...(grant.focusAreas || [])].join(" ").toLowerCase();
  const categoryKeywords: Record<string, string[]> = {
    workforce: ["workforce", "employment", "job", "career", "labor", "apprenticeship", "WIOA"],
    justice: ["justice", "reentry", "recidivism", "juvenile", "corrections", "second chance", "court"],
    education: ["education", "school", "STEM", "literacy", "learning", "academic", "curriculum"],
    health: ["health", "mental", "behavioral", "substance", "wellness", "trauma", "counseling"],
    community: ["community", "neighborhood", "civic", "wraparound", "family", "housing", "social"],
  };
  let best = "community";
  let bestCount = 0;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const count = keywords.filter(k => text.includes(k.toLowerCase())).length;
    if (count > bestCount) { best = cat; bestCount = count; }
  }
  return best;
}

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

async function analyzeGrantWithAI(grant: { title?: string | null; description?: string | null; eligibilityCriteria?: string | null; focusAreas?: string[] | null }): Promise<GrantAIResult | null> {
  try {
    const capabilitiesText = PLATFORM_CAPABILITIES.map(c =>
      `${c.area}: ${c.features.join(", ")}`
    ).join("\n");

    const prompt = `Analyze this grant opportunity against our platform capabilities. Return ONLY valid JSON, no markdown.

GRANT:
Title: ${grant.title ?? "N/A"}
Description: ${grant.description ?? "N/A"}
Eligibility: ${grant.eligibilityCriteria ?? "N/A"}
Focus Areas: ${(grant.focusAreas ?? []).join(", ") || "N/A"}

PLATFORM CAPABILITIES:
${capabilitiesText}

Return JSON with this exact structure:
{
  "fitScore": <0-100>,
  "summary": "<2-3 sentence summary of alignment>",
  "strengths": [{"area": "<capability area>", "detail": "<how it matches>"}],
  "gaps": [{"area": "<missing requirement>", "detail": "<what needs to be built>", "effort": "low|medium|high"}],
  "recommendedActions": ["<action 1>", "<action 2>"],
  "competitiveAdvantage": "<what makes our platform strong for this grant>"
}`;

    const response = await generateAIResponse([
      { role: "system", content: "You are a grant analysis expert. Analyze grants against platform capabilities. Return only valid JSON." },
      { role: "user", content: prompt }
    ], 1500);

    const jsonStr = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      } else {
        console.error("AI response was not valid JSON:", jsonStr.substring(0, 200));
        return {
          aiAnalysis: { summary: "AI analysis returned non-structured response. Please try again.", recommendedActions: [], competitiveAdvantage: "" },
          strengthsGaps: { strengths: [], gaps: [] },
          fitScore: computeFitScore(grant).score,
        };
      }
    }

    return {
      aiAnalysis: {
        summary: typeof parsed.summary === "string" ? parsed.summary : "Analysis complete",
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
        competitiveAdvantage: typeof parsed.competitiveAdvantage === "string" ? parsed.competitiveAdvantage : "",
      },
      strengthsGaps: {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      },
      fitScore: Math.min(100, Math.max(0, typeof parsed.fitScore === "number" ? parsed.fitScore : 0)),
    };
  } catch (error) {
    console.error("AI grant analysis failed:", error);
    return null;
  }
}

interface SamGovOpportunity {
  noticeId: string;
  title: string;
  description?: string;
  department?: string;
  subTier?: string;
  postedDate?: string;
  responseDate?: string;
  archiveDate?: string;
  awardFloor?: number;
  awardCeiling?: number;
  estimatedTotalFunding?: number;
  expectedNumberOfAwards?: number;
  cfda?: string;
  type?: string;
  uiLink?: string;
  eligibilityCriteria?: string;
  applicantTypes?: string[];
  focusAreas?: string[];
}

async function fetchSamGovOpportunities(keywords: string[]): Promise<SamGovOpportunity[]> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  const results: SamGovOpportunity[] = [];

  for (const keyword of keywords) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey || "DEMO_KEY",
        keyword: keyword,
        ptype: "g",
        limit: "10",
        postedFrom: getDateMonthsAgo(3),
        postedTo: getTodayFormatted(),
      });

      const url = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`;
      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.error(`SAM.gov API error for "${keyword}": ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const opportunities = data.opportunitiesData || [];

      for (const opp of opportunities) {
        if (results.find(r => r.noticeId === opp.noticeId)) continue;

        const eligibilityParts: string[] = [];
        if (opp.applicantTypes) {
          const types = Array.isArray(opp.applicantTypes) ? opp.applicantTypes : [opp.applicantTypes];
          eligibilityParts.push(`Eligible Applicants: ${types.join(", ")}`);
        }
        if (opp.applicantEligibilityDescription) {
          eligibilityParts.push(String(opp.applicantEligibilityDescription));
        }
        if (opp.additionalInformationOnEligibility) {
          eligibilityParts.push(String(opp.additionalInformationOnEligibility));
        }
        if (opp.fundingActivityCategories) {
          const cats = Array.isArray(opp.fundingActivityCategories) ? opp.fundingActivityCategories : [opp.fundingActivityCategories];
          eligibilityParts.push(`Funding Categories: ${cats.join(", ")}`);
        }

        const focusAreas: string[] = [];
        if (opp.cfdaNumber) focusAreas.push(`CFDA ${opp.cfdaNumber}`);
        if (opp.fundingActivityCategories) {
          const cats = Array.isArray(opp.fundingActivityCategories) ? opp.fundingActivityCategories : [opp.fundingActivityCategories];
          focusAreas.push(...cats.map(String));
        }

        results.push({
          noticeId: opp.noticeId || "",
          title: opp.title || "Untitled",
          description: opp.description?.substring(0, 5000) || "",
          department: opp.department || opp.fullParentPathName || "",
          subTier: opp.subtierAgency || "",
          postedDate: opp.postedDate,
          responseDate: opp.responseDate || opp.archiveDate,
          archiveDate: opp.archiveDate,
          awardFloor: opp.award?.floor ? parseInt(opp.award.floor) : undefined,
          awardCeiling: opp.award?.ceiling ? parseInt(opp.award.ceiling) : undefined,
          estimatedTotalFunding: opp.estimatedTotalFunding ? parseInt(opp.estimatedTotalFunding) : undefined,
          expectedNumberOfAwards: opp.expectedNumberOfAwards ? parseInt(opp.expectedNumberOfAwards) : undefined,
          cfda: opp.cfdaNumber || "",
          type: opp.type || "grant",
          uiLink: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
          eligibilityCriteria: eligibilityParts.join(". ") || "",
          applicantTypes: opp.applicantTypes ? (Array.isArray(opp.applicantTypes) ? opp.applicantTypes.map(String) : [String(opp.applicantTypes)]) : [],
          focusAreas,
        });
      }
    } catch (error) {
      console.error(`SAM.gov fetch error for "${keyword}":`, error);
    }
  }
  return results;
}

function getDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function getTodayFormatted(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function parseSamDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch { return null; }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function persistGapsFromGrant(grantId: string, gaps: GapItem[]): Promise<void> {
  for (const gap of gaps) {
    const existing = await db.select({ id: platformGaps.id })
      .from(platformGaps)
      .where(and(eq(platformGaps.grantId, grantId), eq(platformGaps.area, gap.area)))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(platformGaps).values({
      grantId,
      area: gap.area,
      detail: gap.detail,
      effort: gap.effort || "medium",
      priority: gap.effort === "low" ? "high" : gap.effort === "high" ? "low" : "medium",
      status: "identified",
    });
  }
}

function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}

function formatCurrency(amount?: number): string {
  if (!amount) return "";
  return `$${amount.toLocaleString()}`;
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
  app.get("/api/grants", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { category, minFit, status, search } = req.query;
      let query = db.select().from(grantOpportunities);
      const conditions: SQL[] = [];
      if (category && typeof category === "string") conditions.push(eq(grantOpportunities.category, category));
      if (status && typeof status === "string") conditions.push(eq(grantOpportunities.status, status));
      if (minFit && typeof minFit === "string") conditions.push(gte(grantOpportunities.fitScore, parseInt(minFit)));

      let grants;
      if (conditions.length > 0) {
        grants = await db.select().from(grantOpportunities).where(and(...conditions)).orderBy(desc(grantOpportunities.createdAt));
      } else {
        grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.createdAt));
      }

      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        grants = grants.filter(g =>
          g.title.toLowerCase().includes(s) ||
          (g.description || "").toLowerCase().includes(s) ||
          (g.agency || "").toLowerCase().includes(s)
        );
      }

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
      const keywordFit = computeFitScore(data);
      const category = categorizeGrant(data);

      const aiResult = await analyzeGrantWithAI(data);
      const fitScore = aiResult ? aiResult.fitScore : keywordFit.score;

      const [grant] = await db.insert(grantOpportunities).values({
        ...data,
        fitScore,
        fitAnalysis: keywordFit.analysis,
        readinessChecklist: generateReadinessChecklist(keywordFit.matchedAreas),
        category,
        source: "manual",
        aiAnalysis: aiResult?.aiAnalysis || null,
        strengthsGaps: aiResult?.strengthsGaps || null,
      }).returning();

      if (aiResult?.strengthsGaps?.gaps?.length) {
        await persistGapsFromGrant(grant.id, aiResult.strengthsGaps.gaps);
      }

      res.json(grant);
    } catch (error) {
      console.error("Failed to create grant:", error);
      res.status(500).json({ error: "Failed to create grant" });
    }
  });

  app.get("/api/grants/stats", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities);
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: grants.length,
        highFit: grants.filter(g => (g.fitScore || 0) >= 70).length,
        mediumFit: grants.filter(g => (g.fitScore || 0) >= 40 && (g.fitScore || 0) < 70).length,
        lowFit: grants.filter(g => (g.fitScore || 0) < 40).length,
        upcomingDeadlines: grants.filter(g => g.deadline && g.deadline > now && g.deadline <= thirtyDays).length,
        byCategory: Object.fromEntries(
          GRANT_CATEGORIES.map(cat => [cat, grants.filter(g => g.category === cat).length])
        ),
        byStatus: {} as Record<string, number>,
        bySource: { manual: 0, samgov: 0 } as Record<string, number>,
        totalFunding: grants.reduce((sum, g) => sum + (g.estimatedFunding || 0), 0),
        averageFit: grants.length > 0 ? Math.round(grants.reduce((sum, g) => sum + (g.fitScore || 0), 0) / grants.length) : 0,
      };

      for (const g of grants) {
        const s = g.status || "identified";
        stats.byStatus[s] = (stats.byStatus[s] || 0) + 1;
        const src = g.source || "manual";
        stats.bySource[src] = (stats.bySource[src] || 0) + 1;
      }

      res.json(stats);
    } catch (error) {
      console.error("Failed to get grant stats:", error);
      res.status(500).json({ error: "Failed to get grant stats" });
    }
  });

  app.get("/api/grants/alerts", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const alerts = await db.select().from(grantAlerts).orderBy(desc(grantAlerts.createdAt)).limit(50);
      res.json(alerts);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/grants/alerts/:id/read", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [alert] = await db.update(grantAlerts).set({ isRead: true }).where(eq(grantAlerts.id, getParamId(req))).returning();
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  app.post("/api/grants/refresh-samgov", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const keywords = ["workforce development youth", "juvenile reentry", "youth education STEM", "community health youth", "mentoring youth"];
      const opportunities = await fetchSamGovOpportunities(keywords);

      let imported = 0;
      let skipped = 0;
      const newHighFit: { title: string; fitScore: number; id: string }[] = [];

      for (const opp of opportunities) {
        const existing = await db.select({ id: grantOpportunities.id })
          .from(grantOpportunities)
          .where(eq(grantOpportunities.samgovNoticeId, opp.noticeId))
          .limit(1);

        if (existing.length > 0) { skipped++; continue; }

        const grantData = {
          title: opp.title,
          description: opp.description || "",
          agency: [opp.department, opp.subTier].filter(Boolean).join(" - ") || "Federal",
          fundingAmount: formatCurrency(opp.awardCeiling) || formatCurrency(opp.estimatedTotalFunding) || "",
          sourceUrl: opp.uiLink || "",
          grantType: opp.type || "grant",
          focusAreas: opp.focusAreas || [],
          eligibilityCriteria: opp.eligibilityCriteria || "",
        };

        const keywordFit = computeFitScore(grantData);
        const category = categorizeGrant(grantData);
        const deadline = parseSamDate(opp.responseDate);
        const postedDate = parseSamDate(opp.postedDate);

        const aiResult = await analyzeGrantWithAI(grantData);
        const fitScore = aiResult ? aiResult.fitScore : keywordFit.score;

        const [grant] = await db.insert(grantOpportunities).values({
          ...grantData,
          samgovId: opp.noticeId,
          samgovNoticeId: opp.noticeId,
          fitScore,
          fitAnalysis: keywordFit.analysis,
          readinessChecklist: generateReadinessChecklist(keywordFit.matchedAreas),
          category,
          source: "samgov",
          deadline,
          postedDate,
          responseDate: parseSamDate(opp.responseDate),
          awardFloor: opp.awardFloor,
          awardCeiling: opp.awardCeiling,
          estimatedFunding: opp.estimatedTotalFunding,
          expectedAwards: opp.expectedNumberOfAwards,
          cfda: opp.cfda,
          aiAnalysis: aiResult?.aiAnalysis || null,
          strengthsGaps: aiResult?.strengthsGaps || null,
        }).returning();

        imported++;

        if (aiResult?.strengthsGaps?.gaps?.length) {
          await persistGapsFromGrant(grant.id, aiResult.strengthsGaps.gaps);
        }

        if (fitScore >= 70) {
          newHighFit.push({ title: opp.title, fitScore, id: grant.id });
        }
      }

      for (const match of newHighFit) {
        await db.insert(grantAlerts).values({
          grantId: match.id,
          alertType: "high_fit_match",
          title: `High-Fit Grant Found: ${match.title}`,
          message: `A new grant with ${match.fitScore}% fit score was discovered from SAM.gov`,
          fitScore: match.fitScore,
        });
      }

      res.json({
        success: true,
        imported,
        skipped,
        total: opportunities.length,
        newHighFitAlerts: newHighFit.length,
      });
    } catch (error) {
      console.error("SAM.gov refresh failed:", error);
      res.status(500).json({ error: "Failed to refresh SAM.gov data", details: String(error) });
    }
  });

  app.get("/api/grants/platform/capabilities", requireAuth, async (_req, res) => {
    res.json({ capabilities: PLATFORM_CAPABILITIES });
  });

  app.post("/api/grants/analyze-fit", requireAuth, requireAdmin, async (req, res) => {
    try {
      const analyzeFitSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        focusAreas: z.array(z.string()).optional(),
        eligibilityCriteria: z.string().optional(),
      });
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
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const report = {
        generatedAt: new Date().toISOString(),
        platform: "AI Mastery Academy & School Support Hub",
        totalGrants: grants.length,
        highFitGrants: grants.filter(g => (g.fitScore || 0) >= 70).length,
        mediumFitGrants: grants.filter(g => (g.fitScore || 0) >= 40 && (g.fitScore || 0) < 70).length,
        upcomingDeadlines: grants.filter(g => g.deadline && g.deadline > now && g.deadline <= thirtyDays).length,
        capabilities: PLATFORM_CAPABILITIES,
        grants: grants.map(g => ({
          id: g.id, title: g.title, agency: g.agency, fitScore: g.fitScore,
          status: g.status, deadline: g.deadline, fundingAmount: g.fundingAmount,
          category: g.category, source: g.source, aiAnalysis: g.aiAnalysis,
          strengthsGaps: g.strengthsGaps,
        })),
        categories: Object.fromEntries(
          GRANT_CATEGORIES.map(cat => [cat, grants.filter(g => g.category === cat).length])
        ),
      };
      res.json(report);
    } catch (error) {
      console.error("Failed to generate alignment report:", error);
      res.status(500).json({ error: "Failed to generate alignment report" });
    }
  });

  app.get("/api/grants/report/export-csv", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.fitScore));
      const headers = ["Title", "Agency", "Funding Amount", "Fit Score", "Category", "Status", "Deadline", "Source", "Source URL"];
      const rows = grants.map(g => [
        `"${sanitizeCsvCell((g.title || "").replace(/"/g, '""'))}"`,
        `"${sanitizeCsvCell((g.agency || "").replace(/"/g, '""'))}"`,
        `"${sanitizeCsvCell(g.fundingAmount || "")}"`,
        g.fitScore || 0,
        sanitizeCsvCell(g.category || ""),
        sanitizeCsvCell(g.status || "identified"),
        g.deadline ? g.deadline.toISOString().split("T")[0] : "",
        sanitizeCsvCell(g.source || "manual"),
        sanitizeCsvCell(g.sourceUrl || ""),
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=grant-alignment-report.csv");
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/grants/report/export-pdf", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.fitScore));
      const now = new Date();
      const highFit = grants.filter(g => (g.fitScore || 0) >= 70).length;
      const medFit = grants.filter(g => (g.fitScore || 0) >= 40 && (g.fitScore || 0) < 70).length;

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=grant-alignment-report.pdf");
      doc.pipe(res);

      doc.fontSize(22).fillColor("#1a56db").text("Grant Alignment Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#6b7280").text(`Generated: ${now.toLocaleDateString()} | AI Mastery Academy & School Support Hub`, { align: "center" });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#1a56db").lineWidth(2).stroke();
      doc.moveDown(1);

      doc.fontSize(14).fillColor("#374151").text("Summary");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#333");
      doc.text(`Total Opportunities: ${grants.length}`);
      doc.text(`High Fit (70%+): ${highFit}`, { continued: false });
      doc.text(`Medium Fit (40-69%): ${medFit}`);
      doc.text(`Average Fit Score: ${grants.length > 0 ? Math.round(grants.reduce((s, g) => s + (g.fitScore || 0), 0) / grants.length) : 0}%`);
      doc.moveDown(1);

      doc.fontSize(14).fillColor("#374151").text("Grant Opportunities");
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const colWidths = [160, 100, 70, 50, 60, 60];
      const headers = ["Title", "Agency", "Funding", "Fit", "Category", "Status"];

      doc.fontSize(8).fillColor("#ffffff");
      let xPos = 50;
      doc.rect(50, tableTop, 495, 18).fill("#1a56db");
      for (let i = 0; i < headers.length; i++) {
        doc.fillColor("#ffffff").text(headers[i], xPos + 4, tableTop + 4, { width: colWidths[i] - 8, height: 14 });
        xPos += colWidths[i];
      }

      let rowY = tableTop + 20;
      doc.fontSize(7).fillColor("#333");
      for (const g of grants) {
        if (rowY > 750) {
          doc.addPage();
          rowY = 50;
        }
        const rowData = [
          g.title.substring(0, 40),
          (g.agency || "-").substring(0, 25),
          g.fundingAmount || "-",
          `${g.fitScore || 0}%`,
          g.category || "-",
          g.status || "identified",
        ];
        xPos = 50;
        const fitColor = (g.fitScore || 0) >= 70 ? "#059669" : (g.fitScore || 0) >= 40 ? "#d97706" : "#dc2626";
        for (let i = 0; i < rowData.length; i++) {
          doc.fillColor(i === 3 ? fitColor : "#333").text(rowData[i], xPos + 4, rowY, { width: colWidths[i] - 8, height: 14 });
          xPos += colWidths[i];
        }
        rowY += 16;
      }

      if (rowY > 650) { doc.addPage(); rowY = 50; }
      doc.moveDown(2);
      doc.fontSize(14).fillColor("#374151").text("Platform Capabilities", 50, rowY + 20);
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor("#333");
      for (const cap of PLATFORM_CAPABILITIES) {
        doc.font("Helvetica-Bold").text(cap.area, { continued: true }).font("Helvetica").text(`: ${cap.features.join(", ")}`);
        doc.moveDown(0.3);
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor("#9ca3af").text("AI Mastery Academy - Grant Discovery & Alignment Engine", { align: "center" });

      doc.end();
    } catch (error) {
      console.error("PDF export failed:", error);
      if (!res.headersSent) res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  app.get("/api/grants/report/wioa", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const report = {
        title: "WIOA/DOL Performance Report",
        reportingPeriod: { start: getDateMonthsAgo(6), end: getTodayFormatted() },
        metrics: {
          workforcePlacement: {
            label: "Workforce Placement Rate",
            description: "Percentage of program participants placed in employment",
            currentValue: null,
            target: "65%",
            dataSource: "Outcome tracking system",
          },
          trainingCompletion: {
            label: "Training Completion Rate",
            description: "Percentage of enrolled participants completing training programs",
            currentValue: null,
            target: "80%",
            dataSource: "Course completion records",
          },
          credentialAttainment: {
            label: "Credential Attainment Rate",
            description: "Percentage of participants earning recognized credentials",
            currentValue: null,
            target: "50%",
            dataSource: "Certificate/badge records",
          },
          employerEngagement: {
            label: "Employer Engagement",
            description: "Number of employer partners actively engaged in program",
            currentValue: null,
            target: "20 partners",
            dataSource: "Partner network",
          },
          medianEarnings: {
            label: "Median Earnings (Q2 Post-Exit)",
            description: "Median quarterly earnings of participants in Q2 after program exit",
            currentValue: null,
            target: "$5,000",
            dataSource: "Wage records",
          },
          measurableSkillGains: {
            label: "Measurable Skill Gains",
            description: "Percentage of participants achieving measurable skill gains",
            currentValue: null,
            target: "60%",
            dataSource: "Thrive scoring system",
          },
        },
        programAreas: [
          { name: "Youth Workforce Development", wioaAlignment: "Title I - Youth", services: ["Career exploration", "Work experience", "Occupational skills training", "Financial literacy", "Mentoring"] },
          { name: "Digital Literacy & STEM", wioaAlignment: "Title II - Adult Education", services: ["AI curriculum", "Technology training", "Basic skills education"] },
          { name: "Reentry Services", wioaAlignment: "Title I - Adult/DW", services: ["Case management", "Job readiness", "Barrier removal", "Follow-up services"] },
        ],
        dolComplianceAreas: [
          { area: "Participant Tracking", status: "active", details: "IGN-Thrive system tracks six-domain outcomes" },
          { area: "Data Validation", status: "active", details: "Automated data quality checks via early warning system" },
          { area: "Outcome Reporting", status: "active", details: "Recidivism, employment, and education outcomes tracked" },
          { area: "Equal Opportunity", status: "compliant", details: "Bilingual support, accessibility features" },
        ],
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate WIOA report" });
    }
  });

  app.get("/api/grants/report/ojjdp", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const report = {
        title: "OJJDP/DOJ Compliance Report",
        reportingPeriod: { start: getDateMonthsAgo(6), end: getTodayFormatted() },
        metrics: {
          recidivismRate: { label: "Recidivism Rate", description: "Re-offense rate within 12 months", currentValue: null, target: "<15%", dataSource: "Justice referral tracking" },
          programCompletion: { label: "Program Completion", description: "Percentage completing reentry program", currentValue: null, target: "75%", dataSource: "Phase completion records" },
          communityReintegration: { label: "Community Reintegration", description: "Successful transitions to community", currentValue: null, target: "80%", dataSource: "Case management system" },
          familyEngagement: { label: "Family Engagement", description: "Family participation rate", currentValue: null, target: "60%", dataSource: "Session logs" },
        },
        evidenceBasedPractices: [
          "Cognitive behavioral interventions",
          "Trauma-informed care",
          "Motivational interviewing",
          "Restorative justice practices",
          "Family-centered approach",
        ],
      };
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate OJJDP report" });
    }
  });

  app.post("/api/grants/:id/ai-analyze", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, getParamId(req)));
      if (!grant) return res.status(404).json({ error: "Grant not found" });

      const aiResult = await analyzeGrantWithAI(grant);
      if (!aiResult) return res.status(500).json({ error: "AI analysis unavailable" });

      const [updated] = await db.update(grantOpportunities).set({
        aiAnalysis: aiResult.aiAnalysis,
        strengthsGaps: aiResult.strengthsGaps,
        fitScore: aiResult.fitScore,
        updatedAt: new Date(),
      }).where(eq(grantOpportunities.id, getParamId(req))).returning();

      if (aiResult.strengthsGaps?.gaps?.length) {
        await persistGapsFromGrant(getParamId(req), aiResult.strengthsGaps.gaps);
      }

      res.json(updated);
    } catch (error) {
      console.error("AI analysis failed:", error);
      res.status(500).json({ error: "AI analysis failed" });
    }
  });

  app.get("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, getParamId(req)));
      if (!grant) return res.status(404).json({ error: "Grant not found" });
      res.json(grant);
    } catch (error) {
      console.error("Failed to fetch grant:", error);
      res.status(500).json({ error: "Failed to fetch grant" });
    }
  });

  app.patch("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = grantCreateSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid grant data", details: parsed.error.flatten().fieldErrors });
      const data: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.title || parsed.data.description || parsed.data.focusAreas) {
        const fitResult = computeFitScore(parsed.data);
        data.fitScore = fitResult.score;
        data.fitAnalysis = fitResult.analysis;
        data.readinessChecklist = generateReadinessChecklist(fitResult.matchedAreas);
        data.category = categorizeGrant(parsed.data);
      }
      const [updated] = await db.update(grantOpportunities).set(data).where(eq(grantOpportunities.id, getParamId(req))).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update grant:", error);
      res.status(500).json({ error: "Failed to update grant" });
    }
  });

  app.delete("/api/grants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(grantOpportunities).where(eq(grantOpportunities.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete grant:", error);
      res.status(500).json({ error: "Failed to delete grant" });
    }
  });

  app.get("/api/platform-gaps", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const gaps = await db.select().from(platformGaps).orderBy(desc(platformGaps.createdAt));
      res.json(gaps);
    } catch (error) {
      console.error("Failed to fetch platform gaps:", error);
      res.status(500).json({ error: "Failed to fetch platform gaps" });
    }
  });

  app.get("/api/platform-gaps/summary", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const allGaps = await db.select().from(platformGaps);
      const total = allGaps.length;
      const byStatus = { identified: 0, in_progress: 0, resolved: 0 };
      const byEffort = { low: 0, medium: 0, high: 0 };
      for (const g of allGaps) {
        const s = g.status as keyof typeof byStatus;
        if (s in byStatus) byStatus[s]++;
        const e = g.effort as keyof typeof byEffort;
        if (e in byEffort) byEffort[e]++;
      }
      res.json({ total, byStatus, byEffort });
    } catch (error) {
      console.error("Failed to fetch gap summary:", error);
      res.status(500).json({ error: "Failed to fetch gap summary" });
    }
  });

  app.patch("/api/platform-gaps/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, resolution, priority } = req.body as { status?: string; resolution?: string; priority?: string };
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (resolution) updateData.resolution = resolution;
      if (priority) updateData.priority = priority;
      if (status === "resolved") updateData.resolvedAt = new Date();
      const [updated] = await db.update(platformGaps).set(updateData).where(eq(platformGaps.id, getParamId(req))).returning();
      if (!updated) return res.status(404).json({ error: "Gap not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update gap:", error);
      res.status(500).json({ error: "Failed to update gap" });
    }
  });

  // ==================== LOGIC MODEL DATA ====================

  app.get("/api/logic-model/data", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [participants] = await db.select({ count: sql<number>`count(*)` }).from(participantProfiles);
      const [services] = await db.select({ count: sql<number>`count(*)`, totalHours: sql<number>`coalesce(sum(duration_minutes), 0)` }).from(serviceRecords);
      const [outcomes] = await db.select({ count: sql<number>`count(*)` }).from(outcomeTracking);
      const [activeParticipants] = await db.select({ count: sql<number>`count(*)` }).from(participantProfiles).where(eq(participantProfiles.status, "active"));

      const outcomesByCategory = await db.select({
        category: outcomeTracking.category,
        count: sql<number>`count(*)`,
      }).from(outcomeTracking).groupBy(outcomeTracking.category);

      const categoryMap: Record<string, number> = {};
      for (const o of outcomesByCategory) {
        categoryMap[o.category] = Number(o.count);
      }

      res.json({
        totalParticipants: Number(participants.count),
        activeParticipants: Number(activeParticipants.count),
        totalServices: Number(services.count),
        totalServiceHours: Math.round(Number(services.totalHours) / 60),
        totalOutcomes: Number(outcomes.count),
        outcomesByCategory: categoryMap,
      });
    } catch (error) {
      console.error("Failed to fetch logic model data:", error);
      res.json({
        totalParticipants: 0,
        activeParticipants: 0,
        totalServices: 0,
        totalServiceHours: 0,
        totalOutcomes: 0,
        outcomesByCategory: {},
      });
    }
  });

  // ==================== GRANT NARRATIVE BUILDER ====================

  app.post("/api/grant-narrative/generate", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { grantType, section } = req.body as { grantType: string; section?: string };

      const [participants] = await db.select({ count: sql<number>`count(*)` }).from(participantProfiles);
      const [services] = await db.select({ count: sql<number>`count(*)`, totalHours: sql<number>`coalesce(sum(duration_minutes), 0)` }).from(serviceRecords);
      const [outcomes] = await db.select({ count: sql<number>`count(*)` }).from(outcomeTracking);
      const [boardMembers] = await db.select({ count: sql<number>`count(*)` }).from(advisoryBoardMembers);

      const metrics = {
        participants: Number(participants.count),
        services: Number(services.count),
        serviceHours: Math.round(Number(services.totalHours) / 60),
        outcomes: Number(outcomes.count),
        boardMembers: Number(boardMembers.count),
      };

      const grantTemplates: Record<string, string> = {
        WIOA: `Generate a WIOA Title I Youth grant narrative section for ThriveUp, a comprehensive youth workforce development platform. The program follows a Three-Pillar framework: Relief (immediate stabilization), Stabilize (skill building), and Contribute (career pathways and community engagement). Focus on workforce development outcomes, career pathways, employer partnerships, and digital literacy training.`,
        OJJDP: `Generate an OJJDP Second Chance Act grant narrative section for ThriveUp, a technology-enabled reentry support platform. The program follows a Three-Pillar framework: Relief (immediate stabilization), Stabilize (skill building), and Contribute (career pathways and community engagement). Focus on recidivism reduction, reentry case management, evidence-based interventions, and community-based support services.`,
        SAMHSA: `Generate a SAMHSA Community Mental Health grant narrative section for ThriveUp, a holistic youth development platform with integrated behavioral health support. The program follows a Three-Pillar framework: Relief (immediate stabilization), Stabilize (skill building), and Contribute (career pathways and community engagement). Focus on trauma-informed care, behavioral health screening, mental health integration, and whole-child support.`,
      };

      const template = grantTemplates[grantType] || grantTemplates.WIOA;
      const sectionPrompt = section ? `Focus specifically on the "${section}" section of the narrative.` : "Generate a comprehensive program narrative overview.";

      const prompt = `${template}

${sectionPrompt}

Platform metrics to incorporate naturally:
- ${metrics.participants} participants served
- ${metrics.services} service encounters delivered
- ${metrics.serviceHours} service hours provided
- ${metrics.outcomes} outcome measurements tracked
- ${metrics.boardMembers} community advisory board members
- 50+ career pathways available
- 5-level AI mastery curriculum
- 6-domain Thrive scoring system
- Evidence-based intervention framework

Write in formal grant language, approximately 400-500 words. Use specific data points. Emphasize evidence-based practices and measurable outcomes. Do NOT use markdown formatting — write in plain paragraphs.`;

      const response = await generateAIResponse([
        { role: "system", content: "You are a professional grant writer specializing in federal grants for youth development, workforce development, and social services. Write compelling, data-driven grant narratives." },
        { role: "user", content: prompt }
      ], 2000);

      res.json({ narrative: response, grantType, section: section || "overview", metrics });
    } catch (error) {
      console.error("Failed to generate narrative:", error);
      res.status(500).json({ error: "Failed to generate narrative" });
    }
  });

  // ==================== ADVISORY BOARD ====================

  app.get("/api/advisory-board/members", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const members = await db.select().from(advisoryBoardMembers).orderBy(desc(advisoryBoardMembers.createdAt));
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch board members" });
    }
  });

  app.post("/api/advisory-board/members", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertAdvisoryBoardMemberSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [member] = await db.insert(advisoryBoardMembers).values(parsed.data).returning();
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to create board member" });
    }
  });

  app.patch("/api/advisory-board/members/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(advisoryBoardMembers).set(req.body).where(eq(advisoryBoardMembers.id, getParamId(req))).returning();
      if (!updated) return res.status(404).json({ error: "Member not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update board member" });
    }
  });

  app.delete("/api/advisory-board/members/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(advisoryBoardMembers).where(eq(advisoryBoardMembers.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board member" });
    }
  });

  app.get("/api/advisory-board/meetings", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const meetings = await db.select().from(advisoryBoardMeetings).orderBy(desc(advisoryBoardMeetings.createdAt));
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/advisory-board/meetings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertAdvisoryBoardMeetingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [meeting] = await db.insert(advisoryBoardMeetings).values(parsed.data).returning();
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.delete("/api/advisory-board/meetings/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(advisoryBoardMeetings).where(eq(advisoryBoardMeetings.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // ==================== STAFFING PLAN ====================

  app.get("/api/staffing-plan", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const entries = await db.select().from(staffingPlanEntries).orderBy(desc(staffingPlanEntries.createdAt));
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staffing plan" });
    }
  });

  app.post("/api/staffing-plan", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertStaffingPlanEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [entry] = await db.insert(staffingPlanEntries).values(parsed.data).returning();
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create staffing plan entry" });
    }
  });

  app.patch("/api/staffing-plan/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(staffingPlanEntries).set(req.body).where(eq(staffingPlanEntries.id, getParamId(req))).returning();
      if (!updated) return res.status(404).json({ error: "Entry not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update staffing plan entry" });
    }
  });

  app.delete("/api/staffing-plan/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(staffingPlanEntries).where(eq(staffingPlanEntries.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete staffing plan entry" });
    }
  });

  // ==================== LOGIC MODEL PDF EXPORT ====================

  app.get("/api/logic-model/export-pdf", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [participants] = await db.select({ count: sql<number>`count(*)` }).from(participantProfiles);
      const [services] = await db.select({ count: sql<number>`count(*)`, totalHours: sql<number>`coalesce(sum(duration_minutes), 0)` }).from(serviceRecords);
      const [outcomes] = await db.select({ count: sql<number>`count(*)` }).from(outcomeTracking);

      const doc = new PDFDocument({ size: "LETTER", layout: "landscape", margin: 40 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=ThriveUp_Logic_Model.pdf");
      doc.pipe(res);

      doc.fontSize(20).font("Helvetica-Bold").text("ThriveUp Logic Model", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("Theory of Change: Relief > Stabilize > Contribute", { align: "center" });
      doc.moveDown(1.5);

      const columns = [
        { title: "INPUTS", items: ["Federal/state grant funding", "ThriveUp technology platform", `${Number(participants.count)} enrolled participants`, "Trained staff & case managers", "Community partner network", "Advisory board (community voice)"] },
        { title: "ACTIVITIES", items: ["Career pathway exploration", "AI-powered skills training", "Case management & mentoring", "Behavioral health screening", `${Number(services.count)} service encounters`, "Employer partnership development"] },
        { title: "OUTPUTS", items: [`${Math.round(Number(services.totalHours) / 60)} service hours delivered`, "Career readiness assessments", "Job placements facilitated", "Credentials & certifications", `${Number(outcomes.count)} outcomes tracked`, "DOJ-aligned reports generated"] },
        { title: "SHORT-TERM\nOUTCOMES", items: ["Increased job readiness", "Improved digital literacy", "Stabilized housing/health", "Reduced recidivism (6-mo)", "Educational enrollment", "Enhanced coping skills"] },
        { title: "LONG-TERM\nOUTCOMES", items: ["Sustained employment", "Economic self-sufficiency", "Community contribution", "Reduced recidivism (36-mo)", "Career advancement", "Generational impact"] },
      ];

      const colWidth = 140;
      const startX = 40;
      const startY = doc.y;
      const arrowGap = 10;

      columns.forEach((col, i) => {
        const x = startX + i * (colWidth + arrowGap);
        doc.save();
        doc.roundedRect(x, startY, colWidth, 30, 4).fill(i === 0 ? "#4338CA" : i === 1 ? "#7C3AED" : i === 2 ? "#2563EB" : i === 3 ? "#059669" : "#DC2626");
        doc.fillColor("white").fontSize(9).font("Helvetica-Bold").text(col.title, x + 4, startY + 6, { width: colWidth - 8, align: "center" });
        doc.restore();

        col.items.forEach((item, j) => {
          const itemY = startY + 40 + j * 22;
          doc.roundedRect(x, itemY, colWidth, 18, 3).fillAndStroke("#F3F4F6", "#D1D5DB");
          doc.fillColor("#1F2937").fontSize(7).font("Helvetica").text(item, x + 4, itemY + 4, { width: colWidth - 8 });
        });

        if (i < columns.length - 1) {
          const arrowX = x + colWidth + 2;
          const arrowY = startY + 15;
          doc.save().fillColor("#9CA3AF");
          doc.moveTo(arrowX, arrowY - 4).lineTo(arrowX + 6, arrowY).lineTo(arrowX, arrowY + 4).fill();
          doc.restore();
        }
      });

      doc.moveDown(12);
      doc.fontSize(8).font("Helvetica").fillColor("#6B7280").text(`Generated: ${new Date().toLocaleDateString()} | ThriveUp Academy Grant Engine`, { align: "center" });

      doc.end();
    } catch (error) {
      console.error("Failed to export logic model PDF:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  app.post("/api/grants/scan-opportunity", requireAuth, async (req, res) => {
    try {
      const { image, text } = req.body as { image?: string; text?: string };

      if (!image && !text) {
        return res.status(400).json({ error: "Provide either an image or text to analyze" });
      }

      const platformCapabilities = [
        "ThriveUp Academy: AI-powered workforce development, career pathways, financial literacy, prevention curriculum, case management",
        "MCE (Minority Capital Exchange): Minority business SaaS, SAM.gov integration, APEX Accelerators, certification wizard",
        "LifeBridge: Benefits navigation, resource finder, 24/7 support, public benefits enrollment",
        "RPLICE: Implementation fidelity tracking, program evaluation, quality assurance",
        "Sankofa Health Network: Behavioral health assessments, wellness content, health screenings",
        "The Incubator: Program R&D, innovation lab, pilot testing",
        "M2C Transition: Military-to-civilian transition, veteran employment",
        "SafeReport: Confidential incident reporting, safety monitoring",
        "Perfectly Different: Neurodiversity support, accommodation planning",
        "WholeMind Learning: SEL curriculum, mental wellness education",
        "PillScheduler: Medication adherence, health management",
        "SafeCogniCare: Cognitive health monitoring, elder care support",
        "Better Science Lab: Research methodology, evaluation design, data analysis",
        "ISSS: Student support services, academic case management",
      ];

      const prompt = `You are a grant opportunity analyst for ThriveUp Academy, a 14-platform workforce development ecosystem. Analyze the following grant opportunity and provide a structured assessment.

Our platform capabilities:
${platformCapabilities.join("\n")}

Our methodologies: MAP-GAP (continuous improvement), SALP (fidelity tracking), Three Realities (community-informed design), MG-PATR (multi-generational patterns).

Our entity structure: ThriveUp Academy (501(c)(3)), The Collaborative Advocate (VOSB), MCE (minority business SaaS).

${text ? `Grant opportunity text:\n${text}` : "The user uploaded a screenshot of a grant opportunity. Based on any visible text in the image, analyze the opportunity."}

Respond in this exact JSON format (no markdown, just JSON):
{
  "grantName": "Name of the grant/funding opportunity",
  "funder": "Organization offering the funding",
  "amount": "Funding amount or range",
  "deadline": "Application deadline or timeline",
  "description": "Brief description of what the grant funds",
  "eligibility": ["List of eligibility requirements you can identify"],
  "fitScore": 0-100,
  "fitAnalysis": ["Reasons why this is or isn't a good fit"],
  "platformAlignment": ["Specific platform capabilities that align with this grant"],
  "gaps": ["Any gaps or requirements we may not fully meet"],
  "recommendation": "Overall recommendation — pursue aggressively, worth exploring, or pass",
  "nextSteps": ["Ordered action items to pursue this opportunity"]
}`;

      let aiResponse: string;
      if (image) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        try {
          const OpenAI = (await import("openai")).default;
          const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
          const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined;
          if (!apiKey) throw new Error("No vision-capable API key available");
          const openai = new OpenAI({ apiKey, baseURL });
          const chatRes = await openai.chat.completions.create({
            model: baseURL ? "gpt-5-nano" : "gpt-4o-mini",
            max_tokens: 2000,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:image/png;base64,${base64Data}` } },
              ],
            }],
          });
          aiResponse = chatRes.choices[0]?.message?.content || "";
        } catch (visionError) {
          console.error("Vision API failed, attempting text extraction fallback:", visionError);
          aiResponse = await generateAIResponse([{ role: "user", content: prompt + "\n\nNote: An image was uploaded but could not be processed. Provide a general analysis framework." }]);
        }
      } else {
        aiResponse = await generateAIResponse([{ role: "user", content: prompt }]);
      }

      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch {
        parsed = {
          grantName: "Unknown Opportunity",
          funder: "Unknown",
          amount: "Not specified",
          deadline: "Not specified",
          description: text ? text.substring(0, 200) : "Could not extract details from image",
          eligibility: [],
          fitScore: 50,
          fitAnalysis: ["Unable to fully analyze — try pasting the text for better results"],
          platformAlignment: ["General workforce development capabilities align"],
          gaps: ["Need more information to assess gaps"],
          recommendation: "Worth exploring — paste the full opportunity text for a more detailed analysis",
          nextSteps: ["Find the full NOFO or opportunity description", "Paste the complete text for detailed analysis", "Check eligibility requirements"],
        };
      }

      res.json(parsed);
    } catch (error) {
      console.error("Failed to scan opportunity:", error);
      res.status(500).json({ error: "Failed to analyze opportunity" });
    }
  });

  app.get("/api/grant-reminders", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const grantId = req.query.grantId as string | undefined;
      const conditions = [eq(grantReminders.userId, userId)];
      if (grantId) conditions.push(eq(grantReminders.grantId, grantId));
      const items = await db.select().from(grantReminders).where(and(...conditions)).orderBy(grantReminders.dueDate);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.post("/api/grant-reminders", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const data = insertGrantReminderSchema.parse({ ...req.body, userId });
      const [item] = await db.insert(grantReminders).values(data).returning();
      res.json(item);
    } catch (error) {
      console.error("Failed to create reminder:", error);
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  app.patch("/api/grant-reminders/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { id } = req.params;
      const updates: Record<string, unknown> = {};
      if (req.body.status != null) updates.status = req.body.status;
      if (req.body.title != null) updates.title = req.body.title;
      if (req.body.dueDate != null) updates.dueDate = req.body.dueDate;
      if (req.body.priority != null) updates.priority = req.body.priority;
      if (req.body.description != null) updates.description = req.body.description;
      if (req.body.status === "completed") updates.completedAt = new Date();
      const [item] = await db.update(grantReminders).set(updates).where(and(eq(grantReminders.id, id), eq(grantReminders.userId, userId))).returning();
      if (!item) return res.status(404).json({ error: "Reminder not found" });
      res.json(item);
    } catch (error) {
      console.error("Failed to update reminder:", error);
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  app.delete("/api/grant-reminders/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { id } = req.params;
      await db.delete(grantReminders).where(and(eq(grantReminders.id, id), eq(grantReminders.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  app.get("/api/grant-checklist", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const grantId = req.query.grantId as string | undefined;
      const conditions = [eq(grantChecklistItems.userId, userId)];
      if (grantId) conditions.push(eq(grantChecklistItems.grantId, grantId));
      const items = await db.select().from(grantChecklistItems).where(and(...conditions)).orderBy(grantChecklistItems.createdAt);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch checklist:", error);
      res.status(500).json({ error: "Failed to fetch checklist" });
    }
  });

  app.post("/api/grant-checklist", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const data = insertGrantChecklistItemSchema.parse({ ...req.body, userId });
      const [item] = await db.insert(grantChecklistItems).values(data).returning();
      res.json(item);
    } catch (error) {
      console.error("Failed to create checklist item:", error);
      res.status(500).json({ error: "Failed to create checklist item" });
    }
  });

  app.patch("/api/grant-checklist/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { id } = req.params;
      const updates: Record<string, unknown> = {};
      if (req.body.status != null) updates.status = req.body.status;
      if (req.body.notes != null) updates.notes = req.body.notes;
      if (req.body.item != null) updates.item = req.body.item;
      if (req.body.dueDate != null) updates.dueDate = req.body.dueDate;
      if (req.body.status === "verified") updates.completedAt = new Date();
      const [item] = await db.update(grantChecklistItems).set(updates).where(and(eq(grantChecklistItems.id, id), eq(grantChecklistItems.userId, userId))).returning();
      if (!item) return res.status(404).json({ error: "Checklist item not found" });
      res.json(item);
    } catch (error) {
      console.error("Failed to update checklist item:", error);
      res.status(500).json({ error: "Failed to update checklist item" });
    }
  });

  app.delete("/api/grant-checklist/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { id } = req.params;
      await db.delete(grantChecklistItems).where(and(eq(grantChecklistItems.id, id), eq(grantChecklistItems.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete checklist item:", error);
      res.status(500).json({ error: "Failed to delete checklist item" });
    }
  });
}
