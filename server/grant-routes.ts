import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { grantOpportunities, grantAlerts, platformGaps, insertGrantOpportunitySchema, advisoryBoardMembers, advisoryBoardMeetings, staffingPlanEntries, insertAdvisoryBoardMemberSchema, insertAdvisoryBoardMeetingSchema, insertStaffingPlanEntrySchema, outcomeTracking, participantProfiles, serviceRecords, grantReminders, grantChecklistItems, insertGrantReminderSchema, insertGrantChecklistItemSchema, grantSectionDrafts, documentSignatures, insertDocumentSignatureSchema } from "@shared/schema";
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
  { area: "Workforce Development", features: ["ThriveUp Academy training pipelines", "Skill alignment and career pathways", "WIOA-aligned program design", "Employer partnership coordination", "Manager in Training leadership pipeline"], grantKeywords: ["workforce", "employment", "job training", "career", "WIOA", "apprenticeship", "labor"] },
  { area: "Veteran Transition Services", features: ["M2C military-to-civilian pipeline", "MOS translation engine", "Benefits navigation", "Housing planning", "Identity transition support", "Military family support"], grantKeywords: ["veteran", "military", "transition", "VA", "service member", "armed forces"] },
  { area: "Behavioral Health & Mental Health", features: ["Whole-Person Health platform", "PHQ-9 depression screening", "GAD-7 anxiety screening", "C-SSRS suicide risk assessment", "PCL-5 PTSD screening", "Safety plan builder", "Crisis tools", "988 integration"], grantKeywords: ["behavioral health", "mental health", "substance", "crisis", "suicide prevention", "trauma", "PTSD", "depression"] },
  { area: "Child & Family Safety", features: ["SafeReport mandatory reporting", "ISSS integrated family support for children AND parents", "Early warning systems", "Coordinated family case management", "Cross-agency referral workflows"], grantKeywords: ["child abuse", "neglect", "child welfare", "family", "prevention", "protective factors", "ACEs", "mandatory reporting"] },
  { area: "Emergency Management & Community Safety", features: ["Shield Atlas emergency response", "Geographic risk mapping", "Crisis coordination", "Continuity planning", "Community resilience scoring", "All-hazard preparedness"], grantKeywords: ["emergency", "disaster", "resilience", "preparedness", "FEMA", "crisis", "safety", "hazard"] },
  { area: "Minority Business & Economic Development", features: ["MCE with 656K+ SAM.gov records", "Certification wizard", "Proposal review", "Teaming hub", "APEX Accelerator integration", "Pinnacle Business Conglomerate"], grantKeywords: ["minority business", "small business", "economic development", "contracting", "8(a)", "HUBZone", "MWBE", "disadvantaged"] },
  { area: "Health Equity", features: ["Sankofa maternal health", "Sankofa feminine health", "Black men's health", "Autoimmune Thrive", "PillScheduler medication management", "SafeCogniCare cognitive safety", "SDOH navigation"], grantKeywords: ["health equity", "disparities", "maternal", "chronic disease", "medication", "cognitive", "social determinants"] },
  { area: "Education & Youth Development", features: ["WholeMind K-12 education platform", "Life Pals student support", "Perfectly Different neurodiversity support", "Digital literacy curriculum", "Mentoring and peer support"], grantKeywords: ["education", "youth", "K-12", "STEM", "digital literacy", "mentoring", "neurodiversity", "disability", "special education"] },
  { area: "Community Resources & Social Services", features: ["LifeBridge Virtual 211", "Housing navigation", "Food access", "Utilities assistance", "Crisis support", "Life event guides", "SDOH resource mapping"], grantKeywords: ["community", "housing", "food", "wraparound", "social services", "homelessness", "resource", "211"] },
  { area: "Communication & Accessibility", features: ["Speech Bridge dialect recognition", "Language translation", "Culturally responsive communication", "Accessibility tools"], grantKeywords: ["language", "translation", "accessibility", "communication", "culturally responsive", "LEP", "bilingual"] },
  { area: "Data, Outcomes & Governance", features: ["Better Science Lab implementation science", "CFIR and RE-AIM frameworks", "Fidelity measurement", "Outcome tracking", "Cross-platform analytics", "Evidence-based practice validation"], grantKeywords: ["outcomes", "data", "measurement", "evidence-based", "fidelity", "implementation science", "evaluation"] },
  { area: "Ecosystem Coordination", features: ["23-platform ACOS architecture", "Pre-Build Gate enforcement", "Capability Orchestration Map", "7-triad team-of-teams", "Bilateral collaboration exchange", "Multi-agency coordination"], grantKeywords: ["coordination", "collaboration", "partnership", "multi-agency", "ecosystem", "systems", "integration"] },
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

interface PlatformAssignment {
  role: "Lead" | "Support" | "Validate";
  platform: string;
  url: string;
  reason: string;
}

const PLATFORM_DIRECTORY: Record<string, { url: string; capabilities: string[] }> = {
  "ThriveUp Academy": { url: "https://thrivingcommunitiesforall.com", capabilities: ["workforce", "training", "career", "WIOA", "apprenticeship", "job training", "employment", "curriculum"] },
  "M2C Transition": { url: "https://vetmissiontransition.com", capabilities: ["veteran", "military", "transition", "VA", "service member", "MOS"] },
  "Whole-Person Health": { url: "https://mentalwellnesssupport.net", capabilities: ["mental health", "behavioral health", "suicide prevention", "crisis", "PTSD", "depression", "screening", "trauma", "substance"] },
  "ISSS": { url: "https://implementationineducatio.com", capabilities: ["child welfare", "child abuse", "family", "prevention", "ACEs", "youth", "school"] },
  "SafeReport": { url: "https://safereports.net", capabilities: ["mandatory reporting", "child abuse", "neglect", "compliance", "incident"] },
  "Shield Atlas": { url: "https://shield-atlas.replit.app", capabilities: ["emergency", "disaster", "resilience", "safety", "hazard", "crisis", "preparedness"] },
  "MCE": { url: "https://minoritycenterofexcellence.com", capabilities: ["minority business", "small business", "contracting", "SAM.gov", "8(a)", "HUBZone", "MWBE", "economic development"] },
  "Pinnacle Business": { url: "https://pinnacle-business-conglomerate.replit.app", capabilities: ["contractor", "business development", "certification", "teaming", "proposal", "disadvantaged"] },
  "Sankofa Health": { url: "https://yourhealthbirthright.net", capabilities: ["health equity", "maternal", "disparities", "culturally responsive"] },
  "Sankofa Feminine Health": { url: "https://holistic-black-feminine-health-hub.replit.app", capabilities: ["feminine health", "reproductive", "hormonal", "OB/GYN"] },
  "Sankofa Maternal Health": { url: "https://black-maternal-health-network.replit.app", capabilities: ["maternal health", "prenatal", "postnatal", "doula", "mortality"] },
  "Black Men's Health": { url: "https://black-men-health.replit.app", capabilities: ["men's health", "prostate", "cardiovascular", "mental health"] },
  "Autoimmune Thrive": { url: "https://autoimmune-thrive.replit.app", capabilities: ["chronic disease", "autoimmune", "medication", "flare"] },
  "PillScheduler": { url: "https://pillscheduler.net", capabilities: ["medication", "adherence", "prescription", "interaction"] },
  "SafeCogniCare": { url: "https://safecognicare.com", capabilities: ["cognitive", "TBI", "dementia", "ADHD", "brain"] },
  "LifeBridge": { url: "https://lifetransitionsaid.org", capabilities: ["housing", "food", "community", "211", "social services", "homelessness", "resource", "wraparound"] },
  "WholeMind Learning": { url: "https://life-pals-standalone.replit.app", capabilities: ["K-12", "education", "STEM", "digital literacy", "learning"] },
  "Perfectly Different": { url: "https://neurodifferentassistant.app", capabilities: ["neurodiversity", "disability", "autism", "ADHD", "IEP", "504", "special education"] },
  "Speech Bridge": { url: "https://speech-bridge.replit.app", capabilities: ["language", "translation", "accessibility", "communication", "LEP", "bilingual"] },
  "Better Science Lab": { url: "https://bettersciencelab.com", capabilities: ["evidence-based", "implementation science", "outcomes", "fidelity", "evaluation", "CFIR", "RE-AIM"] },
  "Video Creator AI": { url: "https://video-creator-ai-mrterryflood.replit.app", capabilities: ["content", "video", "training materials", "marketing", "outreach"] },
  "Ecosystem Nexus": { url: "https://ecosystem-nexus.replit.app", capabilities: ["coordination", "collaboration", "integration", "ecosystem", "systems"] },
  "Ad Targeting": { url: "https://advertising-targeting-for-platforms.replit.app", capabilities: ["outreach", "audience", "campaign", "engagement", "underserved"] },
};

function assignTeamOfTeams(grant: { title?: string | null; description?: string | null; focusAreas?: string[] | null; eligibilityCriteria?: string | null }): PlatformAssignment[] {
  const searchText = [grant.title, grant.description, ...(grant.focusAreas || []), grant.eligibilityCriteria].join(" ").toLowerCase();
  const scored: { name: string; url: string; score: number; matchedCaps: string[] }[] = [];

  for (const [name, info] of Object.entries(PLATFORM_DIRECTORY)) {
    const matchedCaps = info.capabilities.filter(c => searchText.includes(c));
    if (matchedCaps.length > 0) {
      scored.push({ name, url: info.url, score: matchedCaps.length, matchedCaps });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const assignments: PlatformAssignment[] = [];

  if (scored.length >= 1) {
    assignments.push({ role: "Lead", platform: scored[0].name, url: scored[0].url, reason: `Strongest match: ${scored[0].matchedCaps.slice(0, 3).join(", ")}` });
  }
  for (let i = 1; i < Math.min(4, scored.length); i++) {
    assignments.push({ role: "Support", platform: scored[i].name, url: scored[i].url, reason: `Matched: ${scored[i].matchedCaps.slice(0, 2).join(", ")}` });
  }
  assignments.push({ role: "Validate", platform: "Better Science Lab", url: "https://bettersciencelab.com", reason: "Evidence validation via CFIR/RE-AIM" });
  if (!assignments.find(a => a.platform === "Ecosystem Nexus")) {
    assignments.push({ role: "Validate", platform: "Ecosystem Nexus", url: "https://ecosystem-nexus.replit.app", reason: "Cross-platform coordination and monitoring" });
  }

  return assignments;
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

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
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

      let activeResponse = response;
      if (!activeResponse.ok) {
        if (activeResponse.status === 429) {
          const body = await activeResponse.text();
          if (body.includes("exceeded your quota")) {
            console.log(`[GrantDiscovery] SAM.gov daily quota exceeded — will resume tomorrow. Processed ${i}/${keywords.length} keywords so far.`);
            break;
          }
          console.log(`SAM.gov rate limited on "${keyword}" — waiting 15s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          activeResponse = await fetch(url, {
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(15000),
          });
          if (!activeResponse.ok) {
            console.error(`SAM.gov retry failed for "${keyword}": ${activeResponse.status}`);
            continue;
          }
          console.log(`SAM.gov retry success for "${keyword}"`);
        } else {
          console.error(`SAM.gov API error for "${keyword}": ${activeResponse.status} ${activeResponse.statusText}`);
          continue;
        }
      }

      const data = await activeResponse.json();
      const opportunities = data.opportunitiesData || [];
      if (opportunities.length > 0) console.log(`SAM.gov found ${opportunities.length} results for "${keyword}"`);

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
  app.get("/api/grants", async (req, res) => {
    try {
      const { category, minFit, status, search } = req.query;
      let query = db.select().from(grantOpportunities);
      const conditions: SQL[] = [];
      if (category && typeof category === "string") conditions.push(eq(grantOpportunities.category, category));
      if (status && typeof status === "string") conditions.push(eq(grantOpportunities.status, status));
      if (minFit && typeof minFit === "string") conditions.push(gte(grantOpportunities.fitScore, parseInt(minFit)));

      let grants;
      if (conditions.length > 0) {
        grants = await db.select().from(grantOpportunities).where(and(...conditions)).orderBy(desc(grantOpportunities.fitScore), desc(grantOpportunities.createdAt));
      } else {
        grants = await db.select().from(grantOpportunities).orderBy(desc(grantOpportunities.fitScore), desc(grantOpportunities.createdAt));
      }

      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        grants = grants.filter(g =>
          g.title.toLowerCase().includes(s) ||
          (g.description || "").toLowerCase().includes(s) ||
          (g.agency || "").toLowerCase().includes(s)
        );
      }

      const enrichedGrants = grants.map(g => ({
        ...g,
        teamOfTeams: assignTeamOfTeams(g),
      }));

      res.json(enrichedGrants);
    } catch (error) {
      console.error("Failed to fetch grants:", error);
      res.status(500).json({ error: "Failed to fetch grants" });
    }
  });

  app.post("/api/grants", requireAuth, async (req, res) => {
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

  app.get("/api/grants/stats", async (_req, res) => {
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

  app.get("/api/grants/alerts", async (_req, res) => {
    try {
      const alerts = await db.select().from(grantAlerts).orderBy(desc(grantAlerts.createdAt)).limit(50);
      res.json(alerts);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/grants/alerts/:id/read", requireAuth, async (req, res) => {
    try {
      const [alert] = await db.update(grantAlerts).set({ isRead: true }).where(eq(grantAlerts.id, getParamId(req))).returning();
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  app.post("/api/grants/refresh-samgov", async (_req, res) => {
    try {
      const keywords = [
        "workforce development",
        "veteran transition services",
        "behavioral health equity",
        "child abuse prevention",
        "emergency preparedness community",
        "minority business enterprise",
        "community health workers",
        "youth mentoring education",
        "juvenile reentry",
        "housing assistance social services",
        "disability support services",
        "maternal health equity",
        "workforce innovation opportunity act",
        "community resilience",
        "digital literacy education",
      ];
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

  app.post("/api/grants/analyze-fit", requireAuth, async (req, res) => {
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

  app.get("/api/grants/report/alignment", requireAuth, async (_req, res) => {
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

  app.get("/api/grants/report/export-csv", requireAuth, async (_req, res) => {
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

  app.get("/api/grants/report/export-pdf", requireAuth, async (_req, res) => {
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

  app.get("/api/grants/report/wioa", requireAuth, async (_req, res) => {
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

  app.get("/api/grants/report/ojjdp", requireAuth, async (_req, res) => {
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

  app.post("/api/grants/:id/ai-analyze", requireAuth, async (req, res) => {
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

  app.get("/api/grants/:id", async (req, res) => {
    try {
      const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, getParamId(req)));
      if (!grant) return res.status(404).json({ error: "Grant not found" });
      res.json(grant);
    } catch (error) {
      console.error("Failed to fetch grant:", error);
      res.status(500).json({ error: "Failed to fetch grant" });
    }
  });

  app.patch("/api/grants/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/grants/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(grantOpportunities).where(eq(grantOpportunities.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete grant:", error);
      res.status(500).json({ error: "Failed to delete grant" });
    }
  });

  app.get("/api/platform-gaps", requireAuth, async (_req, res) => {
    try {
      const gaps = await db.select().from(platformGaps).orderBy(desc(platformGaps.createdAt));
      res.json(gaps);
    } catch (error) {
      console.error("Failed to fetch platform gaps:", error);
      res.status(500).json({ error: "Failed to fetch platform gaps" });
    }
  });

  app.get("/api/platform-gaps/summary", requireAuth, async (_req, res) => {
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

  app.patch("/api/platform-gaps/:id", requireAuth, async (req, res) => {
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

  app.get("/api/logic-model/data", requireAuth, async (_req, res) => {
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

  app.post("/api/grant-narrative/generate", requireAuth, async (req, res) => {
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

  app.get("/api/advisory-board/members", requireAuth, async (_req, res) => {
    try {
      const members = await db.select().from(advisoryBoardMembers).orderBy(desc(advisoryBoardMembers.createdAt));
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch board members" });
    }
  });

  app.post("/api/advisory-board/members", requireAuth, async (req, res) => {
    try {
      const parsed = insertAdvisoryBoardMemberSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [member] = await db.insert(advisoryBoardMembers).values(parsed.data).returning();
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to create board member" });
    }
  });

  app.patch("/api/advisory-board/members/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(advisoryBoardMembers).set(req.body).where(eq(advisoryBoardMembers.id, getParamId(req))).returning();
      if (!updated) return res.status(404).json({ error: "Member not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update board member" });
    }
  });

  app.delete("/api/advisory-board/members/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(advisoryBoardMembers).where(eq(advisoryBoardMembers.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board member" });
    }
  });

  app.get("/api/advisory-board/meetings", requireAuth, async (_req, res) => {
    try {
      const meetings = await db.select().from(advisoryBoardMeetings).orderBy(desc(advisoryBoardMeetings.createdAt));
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/advisory-board/meetings", requireAuth, async (req, res) => {
    try {
      const parsed = insertAdvisoryBoardMeetingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [meeting] = await db.insert(advisoryBoardMeetings).values(parsed.data).returning();
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.delete("/api/advisory-board/meetings/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(advisoryBoardMeetings).where(eq(advisoryBoardMeetings.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // ==================== STAFFING PLAN ====================

  app.get("/api/staffing-plan", requireAuth, async (_req, res) => {
    try {
      const entries = await db.select().from(staffingPlanEntries).orderBy(desc(staffingPlanEntries.createdAt));
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staffing plan" });
    }
  });

  app.post("/api/staffing-plan", requireAuth, async (req, res) => {
    try {
      const parsed = insertStaffingPlanEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [entry] = await db.insert(staffingPlanEntries).values(parsed.data).returning();
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create staffing plan entry" });
    }
  });

  app.patch("/api/staffing-plan/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(staffingPlanEntries).set(req.body).where(eq(staffingPlanEntries.id, getParamId(req))).returning();
      if (!updated) return res.status(404).json({ error: "Entry not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update staffing plan entry" });
    }
  });

  app.delete("/api/staffing-plan/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(staffingPlanEntries).where(eq(staffingPlanEntries.id, getParamId(req)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete staffing plan entry" });
    }
  });

  // ==================== LOGIC MODEL PDF EXPORT ====================

  app.get("/api/logic-model/export-pdf", requireAuth, async (_req, res) => {
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

      const prompt = `You are a grant opportunity analyst for ThriveUp Academy, a 21-platform workforce development ecosystem. Analyze the following grant opportunity and provide a structured assessment.

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

  app.get("/api/grants/section-drafts/:grantId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { grantId } = req.params;
      const drafts = await db
        .select()
        .from(grantSectionDrafts)
        .where(and(eq(grantSectionDrafts.userId, userId), eq(grantSectionDrafts.grantId, grantId)));
      res.json(drafts);
    } catch (error) {
      console.error("Failed to fetch section drafts:", error);
      res.status(500).json({ error: "Failed to fetch section drafts" });
    }
  });

  app.post("/api/grants/section-drafts/save", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { grantId, sectionId, draftContent, approvalStatus, reviewNotes } = req.body;
      if (!grantId || !sectionId) {
        return res.status(400).json({ error: "Missing grantId or sectionId" });
      }
      const id = `${userId}_${grantId}_${sectionId}`;
      await db
        .insert(grantSectionDrafts)
        .values({
          id,
          userId,
          grantId,
          sectionId,
          draftContent: draftContent || "",
          approvalStatus: approvalStatus || "not-started",
          reviewNotes: reviewNotes || null,
        })
        .onConflictDoUpdate({
          target: grantSectionDrafts.id,
          set: {
            draftContent: draftContent || "",
            approvalStatus: approvalStatus || "not-started",
            reviewNotes: reviewNotes || null,
            updatedAt: new Date(),
          },
        });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save section draft:", error);
      res.status(500).json({ error: "Failed to save section draft" });
    }
  });

  app.post("/api/grants/draft-section", requireAuth, async (req, res) => {
    try {
      const { grantId, sectionId, sectionName, sectionDescription, grantName, grantDescription, existingContent, userInstructions, grantKnowledge, pageLimit, wordCount } = req.body;
      if (!grantId || !sectionName || !grantName) {
        return res.status(400).json({ error: "Missing required fields: grantId, sectionName, grantName" });
      }

      const systemPrompt = `You are an expert grant writer for ThriveUp Academy, a 501(c)(3) nonprofit workforce development platform founded by Dr. Terry Flood. You specialize in writing compelling, evidence-based grant proposals that meet exact page and word count requirements.

Key context about the organization:
- ThriveUp Academy is part of a 3-entity ecosystem: ThriveUp Academy (501(c)(3)), The Collaborative Advocate (VOSB), and MCE (Minority Center of Excellence - minority business SaaS)
- Dr. Flood's methodologies: MAP-GAP (Monitoring, Assessing, Predicting — Gap analysis, a continuous improvement framework), SALP (structured adherence/fidelity protocol), Three Realities (Research Reality, Political Reality, Ground-Level Reality), MG-PATR
- 21-platform technology ecosystem: ThriveUp Academy (education), MCE (minority business), LifeBridge (community voice/benefits navigation), RPLICE/Better Science Lab (fidelity monitoring/research), Sankofa Health Network (health equity), Holistic Black Feminine Health Hub, Black Maternal Health Network, Black Men's Health Hub, M2C Transition (military-to-civilian), Mission Transition (separation support), SafeReport (safety/mandatory reporting), Perfectly Different (neurodiversity), WholeMind Learning (K-12 education), PillScheduler (medication adherence), SafeCogniCare (cognitive health), Shield Atlas (risk intelligence), The Collaborative Advocate (VOSB services), Video Creator AI (content production), Ecosystem Nexus (coordination), ISSS (student support), Pinnacle Business Conglomerate (contractor enablement)
- Focus areas: youth workforce development, substance use prevention, community coalition building, economic empowerment, reentry services

${grantKnowledge ? `\nDETAILED GRANT KNOWLEDGE (use this to align every section precisely):\n${grantKnowledge}` : ""}

CRITICAL INSTRUCTIONS:
1. Write in professional grant language appropriate for federal/foundation reviewers
2. ${wordCount ? `YOU MUST write to the FULL required length: ${wordCount}. Do NOT stop short. Fill the entire allocation with substantive, detailed content.` : "Write a comprehensive, detailed section."}
3. ${pageLimit ? `Target page limit: ${pageLimit}. Write enough content to fill this allocation.` : ""}
4. Include specific, measurable outcomes with numbers and percentages
5. Reference evidence-based practices, data sources, and research
6. Align precisely with the grant's specific requirements and evaluation criteria
7. Incorporate the organization's unique differentiators (Three Realities, MAP-GAP, 21-platform ecosystem)
8. Be specific rather than generic — use real program details, platform names, and methodology descriptions
9. Do NOT stop early. If the word count target is 6,000 words, write 6,000 words of substantive content.
10. ALWAYS complete every sentence. Never stop mid-sentence or mid-paragraph. End with a proper concluding sentence.`;

      const userPrompt = `Draft the "${sectionName}" section for the following grant application:

Grant: ${grantName}
Grant Description: ${grantDescription || "N/A"}
Section: ${sectionName}
Section Description: ${sectionDescription || "N/A"}
${pageLimit ? `Page Limit: ${pageLimit}` : ""}
${wordCount ? `MANDATORY MINIMUM Word Count: ${wordCount}. Your output MUST contain AT LEAST this many words. A response under this count is INCOMPLETE and UNACCEPTABLE.` : ""}
${existingContent ? `\nExisting content to improve/expand:\n${existingContent}` : ""}
${userInstructions ? `\nSpecial instructions from Dr. Flood:\n${userInstructions}` : ""}

STRUCTURE YOUR RESPONSE with these detailed subsections (write substantial content for EACH):
1. Context and Statement of Need (detailed local/national data, citations, problem scope)
2. Program Design and Theory of Change (methodology, platforms used, evidence base)
3. Target Population and Eligibility (demographics, barriers, recruitment strategy)
4. Service Delivery Model (step-by-step process, intake through exit, each platform's role)
5. Goals, Objectives, and Measurable Outcomes (SMART goals with specific numbers)
6. Implementation Timeline (phased rollout, milestones, key activities by quarter)
7. Organizational Capacity and Staffing (team qualifications, infrastructure, partnerships)
8. Sustainability and Continuous Improvement (MAP-GAP integration, long-term plan)

Write EVERY subsection with substantial depth. Do not summarize or abbreviate. Include specific data points, platform names, methodology descriptions, and measurable targets throughout. This is a competitive federal/foundation grant — reviewers will reject thin content. Do not include section headers — integrate all content as flowing narrative paragraphs.${wordCount ? ` REMINDER: You MUST write at minimum ${wordCount}.` : ""}`;

      let targetWords = 0;
      if (wordCount) {
        const match = wordCount.match(/(\d[\d,]*)/);
        if (match) {
          targetWords = parseInt(match[1].replace(/,/g, ""), 10);
        }
      }
      let maxTokens = Math.max(4000, Math.ceil(targetWords * 2.0));

      let draft = await generateAIResponse([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], maxTokens);

      if (targetWords > 0) {
        let currentWords = draft.trim().split(/\s+/).length;
        let continuationAttempts = 0;
        const maxContinuations = 3;

        while (currentWords < targetWords * 0.9 && continuationAttempts < maxContinuations) {
          continuationAttempts++;
          const remaining = targetWords - currentWords;
          console.log(`[grant-draft] Section "${sectionName}": ${currentWords} words written, target ${targetWords}, continuing (attempt ${continuationAttempts})...`);

          const continuationPrompt = `You are continuing a grant section draft. The current draft is ${currentWords} words but the REQUIRED minimum is ${targetWords} words. You need to write approximately ${remaining} more words of substantive content.

Here is what you have written so far (DO NOT repeat this — continue seamlessly from where it ends):

---
${draft.slice(-2000)}
---

Continue writing the "${sectionName}" section for the ${grantName} grant. Pick up EXACTLY where the text above left off. Write ${remaining} more words of new, substantive content. Add deeper detail on:
- Additional evidence and data points supporting the program model
- More specific implementation details, workflows, and platform integration
- Expanded descriptions of partnerships, staffing roles, and organizational capacity
- Deeper exploration of sustainability, continuous improvement via MAP-GAP, and long-term impact
- Additional measurable outcomes, SMART goals, and evaluation methods
- More detail on the Three Realities framework application and SALP fidelity monitoring

Do NOT repeat content already written. Do NOT add headers or section labels. Continue as flowing narrative paragraphs. Complete every sentence — never stop mid-sentence.`;

          const continuation = await generateAIResponse([
            { role: "system", content: systemPrompt },
            { role: "user", content: continuationPrompt },
          ], Math.max(4000, Math.ceil(remaining * 2.0)));

          draft = draft.trimEnd() + " " + continuation.trimStart();
          currentWords = draft.trim().split(/\s+/).length;
        }

        if (continuationAttempts > 0) {
          console.log(`[grant-draft] Section "${sectionName}": final word count ${currentWords} after ${continuationAttempts} continuation(s)`);
        }
      }

      res.json({ draft, sectionId, sectionName });
    } catch (error) {
      console.error("Failed to draft section:", error);
      res.status(500).json({ error: "Failed to generate draft" });
    }
  });

  app.post("/api/grants/refine-section", requireAuth, async (req, res) => {
    try {
      const { currentDraft, refinementInstructions, sectionName, grantName, grantKnowledge, wordCount, pageLimit } = req.body;
      if (!currentDraft || !refinementInstructions) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const systemContent = `You are an expert grant writer for ThriveUp Academy. Refine the given draft based on the user's instructions. Maintain professional grant language. Return the COMPLETE refined text — every paragraph from beginning to end. Do NOT truncate, summarize, or shorten the draft. The refined output must be at least as long as the original draft. Always complete every sentence.${grantKnowledge ? `\n\nGrant Knowledge:\n${grantKnowledge}` : ""}${wordCount ? `\n\nTarget word count: ${wordCount}. The refined version MUST meet or exceed this word count.` : ""}${pageLimit ? `\n\nTarget page limit: ${pageLimit}.` : ""}`;

      const inputWords = currentDraft.trim().split(/\s+/).length;
      let refineTargetWords = 0;
      if (wordCount) {
        const match = wordCount.match(/(\d[\d,]*)/);
        if (match) {
          refineTargetWords = parseInt(match[1].replace(/,/g, ""), 10);
        }
      }
      const refineMinWords = Math.max(inputWords, refineTargetWords);
      let refineMaxTokens = Math.max(4000, Math.ceil(refineMinWords * 2.0));

      let refined = await generateAIResponse([
        { role: "system", content: systemContent },
        { role: "user", content: `Grant: ${grantName}\nSection: ${sectionName}\n\nCurrent draft (${inputWords} words — your refined version must be AT LEAST this long):\n${currentDraft}\n\nRefinement instructions:\n${refinementInstructions}\n\nReturn the COMPLETE refined version from beginning to end. Do not skip or summarize any part of the original:` },
      ], refineMaxTokens);

      if (refineMinWords > 0) {
        let currentWords = refined.trim().split(/\s+/).length;
        let continuationAttempts = 0;
        const maxContinuations = 3;

        while (currentWords < refineMinWords * 0.9 && continuationAttempts < maxContinuations) {
          continuationAttempts++;
          const remaining = refineMinWords - currentWords;
          console.log(`[grant-refine] Section "${sectionName}": ${currentWords} words refined, target ${refineMinWords}, continuing (attempt ${continuationAttempts})...`);

          const continuation = await generateAIResponse([
            { role: "system", content: systemContent },
            { role: "user", content: `You are continuing a refined grant section. Current output is ${currentWords} words but must be at least ${refineMinWords} words. Write ${remaining} more words continuing seamlessly from where this ends:\n\n---\n${refined.slice(-2000)}\n---\n\nContinue as flowing narrative paragraphs. Do NOT repeat content. Complete every sentence.` },
          ], Math.max(4000, Math.ceil(remaining * 2.0)));

          refined = refined.trimEnd() + " " + continuation.trimStart();
          currentWords = refined.trim().split(/\s+/).length;
        }
      }

      res.json({ draft: refined });
    } catch (error) {
      console.error("Failed to refine section:", error);
      res.status(500).json({ error: "Failed to refine draft" });
    }
  });

  app.post("/api/grants/export-docx", requireAuth, async (req, res) => {
    try {
      const { grantName, funder, amount, deadline, referenceUrl, sections, readySections, draftedSections, totalSections, missingSectionNames } = req.body;
      if (!grantName || !sections) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const docx = await import("docx");
      const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, TabStopPosition, TabStopType, PageBreak } = docx;

      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      const coverChildren: any[] = [
        new Paragraph({ spacing: { before: 2400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: grantName, bold: true, size: 48, font: "Georgia", color: "1e293b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━", color: "6366f1", size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Grant Submission Package", size: 28, font: "Georgia", color: "475569" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: `Submitted to: ${funder || "N/A"}`, size: 22, font: "Georgia", color: "64748b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: `Funding Request: ${amount || "N/A"}`, size: 22, font: "Georgia", color: "64748b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: `Deadline: ${deadline || "N/A"}`, size: 22, font: "Georgia", color: "64748b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: `Generated: ${dateStr}`, size: 22, font: "Georgia", color: "64748b" })],
        }),
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "ThriveUp Academy", bold: true, size: 26, font: "Georgia", color: "1e293b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "A 501(c)(3) Workforce Development Organization", size: 22, font: "Georgia", color: "475569" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Dr. Terry Flood, Founder & Executive Director", size: 22, font: "Georgia", color: "475569" })],
        }),
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Package Readiness", bold: true, size: 22, font: "Georgia", color: "334155" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: `${readySections || 0} Approved / ${draftedSections || 0} Drafted / ${totalSections || 0} Total Sections`, size: 20, font: "Georgia", color: "475569" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: missingSectionNames && missingSectionNames.length > 0
              ? `Missing: ${missingSectionNames.join(", ")}`
              : "All sections complete",
            size: 20, font: "Georgia",
            color: missingSectionNames && missingSectionNames.length > 0 ? "dc2626" : "16a34a",
            bold: true,
          })],
        }),
      ];

      const tocChildren: any[] = [
        new Paragraph({
          children: [new TextRun({ text: "", break: 1 }), new PageBreak()],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: "Georgia", color: "1e293b" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "6366f1" } },
        }),
      ];

      const allSectionsForToc: Array<{ name: string; status: string }> = req.body.allSectionsForToc || [];
      allSectionsForToc.forEach((s: { name: string; status: string }, i: number) => {
        tocChildren.push(new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `${i + 1}. ${s.name}`, size: 22, font: "Georgia", color: "1e293b" }),
            new TextRun({ text: `\t${s.status}`, size: 20, font: "Georgia", color: s.status === "Approved" ? "166534" : s.status === "Draft" ? "92400e" : "991b1b" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        }));
      });

      const sectionChildren: any[] = [];
      (sections as Array<{ name: string; description: string; content: string; wordCount: string; pageLimit: string; status: string }>).forEach((section) => {
        const words = section.content ? section.content.trim().split(/\s+/).filter(Boolean).length : 0;

        sectionChildren.push(new Paragraph({ children: [new PageBreak()] }));
        sectionChildren.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 100 },
          children: [new TextRun({ text: section.name, bold: true, size: 32, font: "Georgia", color: "1e293b" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "6366f1" } },
        }));
        sectionChildren.push(new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `${section.description}  |  ${words.toLocaleString()} words`, size: 18, font: "Georgia", color: "94a3b8", italics: true }),
            ...(section.pageLimit ? [new TextRun({ text: `  |  Limit: ${section.pageLimit}`, size: 18, font: "Georgia", color: "94a3b8", italics: true })] : []),
            new TextRun({ text: `  |  Status: ${section.status === "approved" ? "APPROVED" : "DRAFT"}`, size: 18, font: "Georgia", color: "94a3b8", italics: true }),
          ],
        }));

        const paragraphs = section.content ? section.content.split(/\n\n+/).filter(Boolean) : ["[No content drafted]"];
        paragraphs.forEach((p: string) => {
          sectionChildren.push(new Paragraph({
            spacing: { after: 160 },
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 360 },
            children: [new TextRun({ text: p.replace(/\n/g, " ").trim(), size: 24, font: "Georgia", color: "1a1a1a" })],
          }));
        });
      });

      if (missingSectionNames && missingSectionNames.length > 0) {
        sectionChildren.push(new Paragraph({ children: [new PageBreak()] }));
        sectionChildren.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Sections Pending Completion", bold: true, size: 32, font: "Georgia", color: "1e293b" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "6366f1" } },
        }));
        missingSectionNames.forEach((name: string) => {
          sectionChildren.push(new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: `• ${name} — Not yet drafted`, size: 22, font: "Georgia", color: "991b1b" })],
          }));
        });
      }

      sectionChildren.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
      sectionChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" } },
        spacing: { before: 200 },
        children: [
          new TextRun({ text: `${grantName} — ThriveUp Academy — Generated ${dateStr}`, size: 18, font: "Georgia", color: "94a3b8" }),
          ...(referenceUrl ? [new TextRun({ text: `\nReference: ${referenceUrl}`, size: 18, font: "Georgia", color: "94a3b8", break: 1 })] : []),
        ],
      }));

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: { font: "Georgia", size: 24 },
            },
          },
        },
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
              size: { width: 12240, height: 15840 },
            },
          },
          children: [...coverChildren, ...tocChildren, ...sectionChildren],
        }],
      });

      const buffer = await Packer.toBuffer(doc);

      const safeGrant = grantName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
      const filename = `${safeGrant}_submission_package_${new Date().toISOString().split("T")[0]}.docx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Failed to export DOCX:", error);
      res.status(500).json({ error: "Failed to generate Word document" });
    }
  });

  app.post("/api/grants/checklist-ai-assist", requireAuth, async (req, res) => {
    try {
      const { checklistItem, grantName, grantKnowledge, serviceArea, assistType, partnershipTimeline } = req.body;
      if (!checklistItem || !grantName || !assistType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const serviceAreaContext = serviceArea ? `
SERVICE AREA CONTEXT:
- Region: ${serviceArea.region}, ${serviceArea.state}
- City: ${serviceArea.city}
- Counties: ${(serviceArea.counties || []).join(", ")}
- Key Industries: ${(serviceArea.keyIndustries || []).join(", ")}
- Target Employers: ${(serviceArea.targetEmployers || []).map((e: { name: string; sector: string; type: string }) => `${e.name} (${e.sector} — ${e.type})`).join("; ")}
- Labor Market: ${serviceArea.laborMarketNotes || "N/A"}
- Location Eligibility: ${serviceArea.locationEligibility || "N/A"}
- Multi-Site: ${serviceArea.multiSiteEligible ? "Yes" : "No"} — ${serviceArea.multiSiteNotes || "N/A"}` : "";

      const partnershipContext = partnershipTimeline ? `
PARTNERSHIP TIMELINE:
- Workflow Order: ${partnershipTimeline.workflowOrder}
- Summary: ${partnershipTimeline.summary}
- Requirements: ${(partnershipTimeline.requirements || []).map((r: { partnerType: string; requiredInDocs: boolean; timing: string; description: string; evidenceNeeded: string; docSections: string[] }) =>
  `${r.partnerType}: ${r.requiredInDocs ? "MUST BE IN DOCS" : "Optional"}, Timing: ${r.timing}, Evidence: ${r.evidenceNeeded}`).join("\n  ")}` : "";

      let systemPrompt = "";
      let userPrompt = "";

      if (assistType === "find-partners") {
        systemPrompt = `You are an expert grant consultant specializing in workforce development partnerships. You help organizations identify strategic collaboration partners for grant applications.

ORGANIZATION CONTEXT:
- ThriveUp Academy is a 501(c)(3) workforce development organization in Austin, TX
- Led by Dr. Terry Flood, focused on AI-powered career exploration and workforce readiness
- Three-entity ecosystem: ThriveUp Academy (nonprofit), The Collaborative Advocate (VOSB), MCE (Minority Capital Exchange — minority business SaaS)
- 21-platform integrated technology ecosystem for workforce development
- Target population: youth and young adults facing employment barriers, with focus on Black youth 16-24
${serviceAreaContext}
${partnershipContext}

GRANT: ${grantName}
${grantKnowledge ? `GRANT DETAILS:\n${grantKnowledge}` : ""}`;

        userPrompt = `For the checklist item "${checklistItem}", generate 8-10 SPECIFIC, REAL organizations in the Austin, TX area that ThriveUp Academy should partner with for the ${grantName} application.

For each partner, provide:
1. **Organization Name** — the actual organization name
2. **Why They're a Fit** — 1-2 sentences on alignment
3. **Contact Approach** — how to reach out (specific department, role to contact)
4. **Partnership Value** — what they bring AND what ThriveUp offers them
5. **Urgency** — High/Medium/Low priority for this grant

Focus on organizations that are:
- Actually operating in the Austin/Central Texas area
- Aligned with the grant's funding priorities
- Likely to be receptive to partnership (shared mission, complementary services)
- Would strengthen the application (community credibility, service coverage, employer connections)

Format as a clear numbered list with each field labeled. Be specific — use real organization names, not generic descriptions.`;
      } else if (assistType === "outreach-template") {
        systemPrompt = `You are an expert grant consultant who writes compelling partnership outreach communications. You write professional, warm, and specific emails that get responses.

ORGANIZATION CONTEXT:
- ThriveUp Academy is a 501(c)(3) workforce development organization in Austin, TX
- Led by Dr. Terry Flood, focused on AI-powered career exploration and workforce readiness
- 21-platform integrated technology ecosystem
- Target population: youth and young adults facing employment barriers
${serviceAreaContext}
${partnershipContext}

GRANT: ${grantName}`;

        userPrompt = `Write 3 outreach email templates for the checklist item "${checklistItem}" for the ${grantName} application.

Create templates for different partner types:
1. **Employer Partner** — for companies who would provide work-based learning, internships, or job placement opportunities
2. **Community Organization Partner** — for nonprofits, community groups, or service providers who serve similar populations
3. **Government/Institutional Partner** — for workforce boards, educational institutions, or government agencies

Each template should:
- Have a compelling subject line
- Be 200-300 words
- Reference the specific grant opportunity without revealing internal strategy
- Clearly state what ThriveUp offers the partner (not just what you need from them)
- Include a specific call-to-action (meeting request with suggested times)
- Sound authentic and collaborative, not transactional
- Include [PLACEHOLDER] tags for customizable parts (partner name, specific role, etc.)

Format each template clearly with Subject, Body, and any notes on customization.`;
      } else if (assistType === "action-guide") {
        systemPrompt = `You are an expert grant consultant providing step-by-step actionable guidance for grant pre-execution checklist items. You give specific, practical advice that a busy executive can follow immediately.

ORGANIZATION CONTEXT:
- ThriveUp Academy is a 501(c)(3) workforce development organization in Austin, TX
- Led by Dr. Terry Flood
- Three-entity ecosystem: ThriveUp Academy (nonprofit), The Collaborative Advocate (VOSB), MCE (minority business SaaS)
${serviceAreaContext}
${partnershipContext}

GRANT: ${grantName}
${grantKnowledge ? `GRANT DETAILS:\n${grantKnowledge}` : ""}`;

        userPrompt = `For the checklist item "${checklistItem}" on the ${grantName} application, provide a detailed action guide.

Include:
1. **What This Is & Why It Matters** — 2-3 sentences on why this checklist item is critical for the grant
2. **Step-by-Step Actions** — numbered steps Dr. Flood should take THIS WEEK to complete this item. Be extremely specific (include websites, department names, document names, timelines)
3. **Documents/Evidence Needed** — exactly what documentation to gather or create
4. **Common Mistakes to Avoid** — 2-3 pitfalls that trip up applicants
5. **How ThriveUp's Existing Infrastructure Helps** — connect the organization's existing platforms, data, and relationships to this requirement
6. **Estimated Time to Complete** — realistic timeline
7. **Status Check** — how to verify this item is truly complete and grant-ready

Be practical and specific. Dr. Flood is a busy executive — tell him exactly what to do, not what to think about.`;
      } else {
        return res.status(400).json({ error: "Invalid assistType. Use: find-partners, outreach-template, or action-guide" });
      }

      const result = await generateAIResponse([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], 4000);

      res.json({ content: result, assistType });
    } catch (error) {
      console.error("Checklist AI assist error:", error);
      res.status(500).json({ error: "Failed to generate AI assistance" });
    }
  });

  app.post("/api/grants/export-action-report", requireAuth, async (req, res) => {
    try {
      const { grants } = req.body;
      if (!grants || !Array.isArray(grants) || grants.length === 0) {
        return res.status(400).json({ error: "No grants provided" });
      }

      const docx = await import("docx");
      const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, Table, TableRow, TableCell, WidthType } = docx;

      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      const allChildren: any[] = [];

      const isSingleGrant = grants.length === 1;
      const coverTitle = isSingleGrant ? grants[0].name : "ThriveUp Academy";
      const coverSubtitle = isSingleGrant ? "Grant Action Report" : "Grant Readiness Action Report";
      const coverDetail = isSingleGrant
        ? `${grants[0].funder} · ${grants[0].amount} · Deadline: ${grants[0].deadline}`
        : `${grants.length} Active Grants · Prepared for Dr. Terry Flood`;

      allChildren.push(
        new Paragraph({ spacing: { before: 1200 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: coverTitle, bold: true, size: 52, font: "Georgia", color: "1e293b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "6366f1", size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: coverSubtitle, size: 36, font: "Georgia", color: "475569" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: coverDetail, size: 22, font: "Georgia", color: "94a3b8" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: `Generated: ${dateStr} · Prepared for Dr. Terry Flood`, size: 22, font: "Georgia", color: "94a3b8" })],
        }),
        new Paragraph({ spacing: { before: 600 }, children: [] }),
      );

      const summaryItems: any[] = [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: "Executive Summary", bold: true, size: 28, color: "1e293b" })],
        }),
      ];

      for (const grant of grants) {
        const checklistVerified = (grant.checklist || []).filter((c: any) => c.status === "verified").length;
        const checklistTotal = (grant.checklist || []).length;
        const actionNeeded = (grant.checklist || []).filter((c: any) => c.status === "action-needed").length;
        const pending = (grant.checklist || []).filter((c: any) => c.status === "pending").length;

        summaryItems.push(
          new Paragraph({
            spacing: { before: 200, after: 50 },
            children: [
              new TextRun({ text: `${grant.name}`, bold: true, size: 24, color: "1e293b" }),
              new TextRun({ text: ` — ${grant.funder}`, size: 22, color: "64748b" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 50 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: `Amount: `, bold: true, size: 20, color: "475569" }),
              new TextRun({ text: `${grant.amount}`, size: 20 }),
              new TextRun({ text: `   |   Deadline: `, bold: true, size: 20, color: "475569" }),
              new TextRun({ text: `${grant.deadline}`, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 50 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: `Checklist: `, bold: true, size: 20, color: "475569" }),
              new TextRun({ text: `${checklistVerified}/${checklistTotal} verified`, size: 20, color: checklistVerified === checklistTotal ? "16a34a" : "dc2626" }),
              new TextRun({ text: `   |   `, size: 20, color: "94a3b8" }),
              new TextRun({ text: `${actionNeeded} action needed`, size: 20, color: actionNeeded > 0 ? "dc2626" : "16a34a" }),
              new TextRun({ text: `   |   `, size: 20, color: "94a3b8" }),
              new TextRun({ text: `${pending} pending`, size: 20, color: "d97706" }),
            ],
          }),
        );

        if (grant.workflowOrder) {
          summaryItems.push(
            new Paragraph({
              spacing: { after: 100 },
              indent: { left: 360 },
              children: [
                new TextRun({ text: `Workflow: `, bold: true, size: 20, color: "475569" }),
                new TextRun({ text: grant.workflowOrder, size: 20, color: "7c3aed", bold: true }),
              ],
            }),
          );
        }
      }

      allChildren.push(...summaryItems);

      for (const grant of grants) {
        allChildren.push(
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 100 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "6366f1" } },
            children: [new TextRun({ text: grant.name, bold: true, size: 32, color: "1e293b" })],
          }),
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({ text: `Funder: `, bold: true, size: 22, color: "475569" }),
              new TextRun({ text: grant.funder, size: 22 }),
              new TextRun({ text: `   |   Amount: `, bold: true, size: 22, color: "475569" }),
              new TextRun({ text: grant.amount, size: 22 }),
              new TextRun({ text: `   |   Deadline: `, bold: true, size: 22, color: "475569" }),
              new TextRun({ text: grant.deadline, size: 22 }),
            ],
          }),
        );

        if (grant.partnershipSummary) {
          allChildren.push(
            new Paragraph({
              spacing: { before: 200, after: 100 },
              shading: { type: "clear" as any, color: "auto", fill: "FEF3C7" },
              children: [
                new TextRun({ text: "⚠ PARTNERSHIP WORKFLOW: ", bold: true, size: 22, color: "92400e" }),
                new TextRun({ text: grant.partnershipSummary, size: 20, color: "78350f" }),
              ],
            }),
          );
        }

        if (grant.partnerRequirements && grant.partnerRequirements.length > 0) {
          allChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
              children: [new TextRun({ text: "Partnership Requirements — Pre-Award vs Post-Award", bold: true, size: 26, color: "7c3aed" })],
            }),
          );

          for (const req of grant.partnerRequirements) {
            const timingLabel = req.timing === "pre-award" ? "PRE-AWARD (Must secure before submitting)" : req.timing === "post-award" ? "POST-AWARD (Can formalize after funding)" : "BOTH (Start now, formalize later)";
            const inDocsLabel = req.requiredInDocs ? "YES — Must be named in application documents" : "No — Helpful but not required in docs";

            allChildren.push(
              new Paragraph({
                spacing: { before: 200, after: 50 },
                children: [
                  new TextRun({ text: `${req.partnerType}`, bold: true, size: 22, color: "1e293b" }),
                  new TextRun({ text: `  [${req.timing.toUpperCase()}]`, bold: true, size: 18, color: req.timing === "pre-award" ? "dc2626" : req.timing === "post-award" ? "16a34a" : "d97706" }),
                ],
              }),
              new Paragraph({
                spacing: { after: 30 },
                indent: { left: 360 },
                children: [
                  new TextRun({ text: "Timing: ", bold: true, size: 18, color: "475569" }),
                  new TextRun({ text: timingLabel, size: 18 }),
                ],
              }),
              new Paragraph({
                spacing: { after: 30 },
                indent: { left: 360 },
                children: [
                  new TextRun({ text: "In Documents: ", bold: true, size: 18, color: "475569" }),
                  new TextRun({ text: inDocsLabel, size: 18, color: req.requiredInDocs ? "dc2626" : "16a34a" }),
                ],
              }),
            );

            if (req.docSections && req.docSections.length > 0) {
              allChildren.push(
                new Paragraph({
                  spacing: { after: 30 },
                  indent: { left: 360 },
                  children: [
                    new TextRun({ text: "Referenced in: ", bold: true, size: 18, color: "475569" }),
                    new TextRun({ text: req.docSections.join(", "), size: 18, italics: true }),
                  ],
                }),
              );
            }

            allChildren.push(
              new Paragraph({
                spacing: { after: 30 },
                indent: { left: 360 },
                children: [new TextRun({ text: req.description, size: 18, color: "334155" })],
              }),
              new Paragraph({
                spacing: { after: 100 },
                indent: { left: 360 },
                children: [
                  new TextRun({ text: "Evidence Needed: ", bold: true, size: 18, color: "475569" }),
                  new TextRun({ text: req.evidenceNeeded, size: 18, color: "334155" }),
                ],
              }),
            );
          }
        }

        if (grant.checklist && grant.checklist.length > 0) {
          allChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 150 },
              children: [new TextRun({ text: "Pre-Execution Checklist", bold: true, size: 26, color: "1e293b" })],
            }),
          );

          const categories = Array.from(new Set(grant.checklist.map((c: any) => c.category))) as string[];
          for (const category of categories) {
            allChildren.push(
              new Paragraph({
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: category.toUpperCase(), bold: true, size: 20, color: "6366f1" })],
              }),
            );

            const catItems = grant.checklist.filter((c: any) => c.category === category);
            for (const item of catItems) {
              const statusIcon = item.status === "verified" ? "✓" : item.status === "action-needed" ? "⚠" : "○";
              const statusColor = item.status === "verified" ? "16a34a" : item.status === "action-needed" ? "dc2626" : "d97706";
              const statusLabel = item.status === "verified" ? "VERIFIED" : item.status === "action-needed" ? "ACTION NEEDED" : "PENDING";

              allChildren.push(
                new Paragraph({
                  spacing: { before: 100, after: 30 },
                  children: [
                    new TextRun({ text: `${statusIcon} `, size: 22, color: statusColor }),
                    new TextRun({ text: item.item, bold: true, size: 20, color: "1e293b" }),
                    new TextRun({ text: `  [${statusLabel}]`, size: 18, color: statusColor, bold: true }),
                  ],
                }),
              );

              if (item.notes) {
                allChildren.push(
                  new Paragraph({
                    spacing: { after: 20 },
                    indent: { left: 360 },
                    children: [new TextRun({ text: item.notes, size: 18, color: "64748b", italics: true })],
                  }),
                );
              }

              if (item.guidance) {
                allChildren.push(
                  new Paragraph({
                    spacing: { after: 20 },
                    indent: { left: 360 },
                    children: [
                      new TextRun({ text: "Guidance: ", bold: true, size: 18, color: "b45309" }),
                      new TextRun({ text: item.guidance, size: 18, color: "334155" }),
                    ],
                  }),
                );
              }

              if (item.resources && item.resources.length > 0) {
                allChildren.push(
                  new Paragraph({
                    spacing: { after: 20 },
                    indent: { left: 360 },
                    children: [
                      new TextRun({ text: "Resources: ", bold: true, size: 18, color: "475569" }),
                      new TextRun({ text: item.resources.map((r: any) => `${r.label} (${r.url})`).join(", "), size: 18, color: "2563eb" }),
                    ],
                  }),
                );
              }
            }
          }
        }

        if (grant.targetEmployers && grant.targetEmployers.length > 0) {
          allChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 150 },
              children: [new TextRun({ text: `Target Partners & Employers — ${grant.serviceAreaRegion || "Austin, TX"}`, bold: true, size: 26, color: "16a34a" })],
            }),
          );

          for (let i = 0; i < grant.targetEmployers.length; i++) {
            const emp = grant.targetEmployers[i];
            allChildren.push(
              new Paragraph({
                spacing: { before: 80, after: 20 },
                children: [
                  new TextRun({ text: `${i + 1}. ${emp.name}`, bold: true, size: 20, color: "1e293b" }),
                ],
              }),
              new Paragraph({
                spacing: { after: 20 },
                indent: { left: 360 },
                children: [
                  new TextRun({ text: `Sector: `, bold: true, size: 18, color: "475569" }),
                  new TextRun({ text: emp.sector, size: 18 }),
                  new TextRun({ text: `   |   `, size: 18, color: "94a3b8" }),
                  new TextRun({ text: `Role: `, bold: true, size: 18, color: "475569" }),
                  new TextRun({ text: emp.type, size: 18 }),
                ],
              }),
            );
          }
        }

        if (grant.locationEligibility || grant.keyIndustries?.length > 0 || grant.laborMarketNotes || grant.lwdbName) {
          allChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 150 },
              children: [new TextRun({ text: `Service Area — ${grant.serviceAreaRegion || "Target Region"}`, bold: true, size: 26, color: "0891b2" })],
            }),
          );

          if (grant.locationEligibility) {
            allChildren.push(
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({ text: "Eligibility Scope: ", bold: true, size: 20, color: "475569" }),
                  new TextRun({ text: grant.locationEligibility.charAt(0).toUpperCase() + grant.locationEligibility.slice(1), size: 20 }),
                ],
              }),
            );
          }

          if (grant.lwdbName) {
            allChildren.push(
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({ text: "Local Workforce Board: ", bold: true, size: 20, color: "475569" }),
                  new TextRun({ text: grant.lwdbName, size: 20 }),
                  ...(grant.lwdbUrl ? [new TextRun({ text: ` (${grant.lwdbUrl})`, size: 18, color: "2563eb" })] : []),
                ],
              }),
            );
          }

          if (grant.keyIndustries && grant.keyIndustries.length > 0) {
            allChildren.push(
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({ text: "Key Industries: ", bold: true, size: 20, color: "475569" }),
                  new TextRun({ text: grant.keyIndustries.join(", "), size: 20 }),
                ],
              }),
            );
          }

          if (grant.laborMarketNotes) {
            allChildren.push(
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: "Labor Market Notes: ", bold: true, size: 20, color: "475569" }),
                  new TextRun({ text: grant.laborMarketNotes, size: 18, color: "334155" }),
                ],
              }),
            );
          }
        }

        if (grant.competitiveEdge && grant.competitiveEdge.length > 0) {
          allChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 150 },
              children: [new TextRun({ text: "Competitive Edge", bold: true, size: 26, color: "d97706" })],
            }),
          );
          for (let i = 0; i < grant.competitiveEdge.length; i++) {
            allChildren.push(
              new Paragraph({
                spacing: { before: 40, after: 40 },
                indent: { left: 360 },
                children: [
                  new TextRun({ text: `${i + 1}. `, bold: true, size: 20, color: "d97706" }),
                  new TextRun({ text: grant.competitiveEdge[i], size: 20, color: "334155" }),
                ],
              }),
            );
          }
        }

        if (grant.winStrategy) {
          allChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 150 },
              children: [new TextRun({ text: "Win Strategy", bold: true, size: 26, color: "059669" })],
            }),
          );

          if (grant.winStrategy.keyMessage) {
            allChildren.push(
              new Paragraph({
                spacing: { after: 100 },
                shading: { type: "clear" as any, color: "auto", fill: "ECFDF5" },
                children: [
                  new TextRun({ text: "Key Message: ", bold: true, size: 20, color: "065f46" }),
                  new TextRun({ text: grant.winStrategy.keyMessage, size: 20, color: "064e3b" }),
                ],
              }),
            );
          }

          if (grant.winStrategy.differentiators && grant.winStrategy.differentiators.length > 0) {
            allChildren.push(
              new Paragraph({
                spacing: { before: 100, after: 50 },
                children: [new TextRun({ text: "Differentiators:", bold: true, size: 20, color: "059669" })],
              }),
            );
            for (const diff of grant.winStrategy.differentiators) {
              allChildren.push(
                new Paragraph({
                  spacing: { after: 30 },
                  indent: { left: 360 },
                  children: [
                    new TextRun({ text: "• ", size: 20, color: "059669" }),
                    new TextRun({ text: diff, size: 18, color: "334155" }),
                  ],
                }),
              );
            }
          }

          if (grant.winStrategy.reviewerTips && grant.winStrategy.reviewerTips.length > 0) {
            allChildren.push(
              new Paragraph({
                spacing: { before: 100, after: 50 },
                children: [new TextRun({ text: "Reviewer Tips:", bold: true, size: 20, color: "059669" })],
              }),
            );
            for (const tip of grant.winStrategy.reviewerTips) {
              allChildren.push(
                new Paragraph({
                  spacing: { after: 30 },
                  indent: { left: 360 },
                  children: [
                    new TextRun({ text: "→ ", size: 20, color: "059669" }),
                    new TextRun({ text: tip, size: 18, color: "334155" }),
                  ],
                }),
              );
            }
          }
        }

        if (grant.pipelineTasks && grant.pipelineTasks.length > 0) {
          allChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 150 },
              children: [new TextRun({ text: "Pipeline Tasks", bold: true, size: 26, color: "1e293b" })],
            }),
          );

          for (const phase of grant.pipelineTasks) {
            allChildren.push(
              new Paragraph({
                spacing: { before: 200, after: 100 },
                shading: { type: "clear" as any, color: "auto", fill: "F1F5F9" },
                children: [new TextRun({ text: phase.name, bold: true, size: 22, color: "334155" })],
              }),
            );

            for (const task of phase.tasks) {
              const tIcon = task.status === "done" ? "✓" : task.status === "in-progress" ? "►" : "○";
              const tColor = task.status === "done" ? "16a34a" : task.status === "in-progress" ? "2563eb" : "94a3b8";

              allChildren.push(
                new Paragraph({
                  spacing: { before: 60, after: 20 },
                  indent: { left: 360 },
                  children: [
                    new TextRun({ text: `${tIcon} `, size: 20, color: tColor }),
                    new TextRun({ text: task.task, size: 20, color: "1e293b" }),
                    new TextRun({ text: `  — ${task.owner}`, size: 18, color: "64748b" }),
                    new TextRun({ text: `  (Due: ${task.dueDate})`, size: 18, color: "94a3b8" }),
                  ],
                }),
              );

              if (task.guidance) {
                allChildren.push(
                  new Paragraph({
                    spacing: { after: 30 },
                    indent: { left: 720 },
                    children: [new TextRun({ text: task.guidance, size: 16, color: "64748b", italics: true })],
                  }),
                );
              }
            }
          }
        }
      }

      allChildren.push(
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" } },
          children: [new TextRun({ text: `ThriveUp Academy · Grant Readiness Action Report · ${dateStr}`, size: 16, color: "94a3b8", font: "Georgia" })],
        }),
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: allChildren,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const namePrefix = grants.length === 1
        ? grants[0].name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)
        : "ThriveUp_All_Grants";
      const filename = `${namePrefix}_Action_Report_${new Date().toISOString().split("T")[0]}.docx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Failed to export action report:", error);
      res.status(500).json({ error: "Failed to generate action report" });
    }
  });

  app.get("/api/esign/documents", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const docs = await db.select().from(documentSignatures).where(eq(documentSignatures.userId, userId)).orderBy(desc(documentSignatures.createdAt));
      res.json(docs);
    } catch (error) {
      console.error("Failed to fetch e-sign documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/esign/create", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { documentType, documentTitle, documentContext, recipientName, recipientEmail, recipientOrg, grantId } = req.body;

      if (!documentType || !documentTitle || !recipientName) {
        return res.status(400).json({ error: "Missing required fields: documentType, documentTitle, recipientName" });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const [doc] = await db.insert(documentSignatures).values({
        userId,
        documentType,
        documentTitle,
        documentContext: documentContext || null,
        recipientName,
        recipientEmail: recipientEmail || null,
        recipientOrg: recipientOrg || null,
        status: "pending",
        grantId: grantId || null,
        expiresAt,
      }).returning();

      res.json(doc);
    } catch (error) {
      console.error("Failed to create e-sign request:", error);
      res.status(500).json({ error: "Failed to create signature request" });
    }
  });

  app.post("/api/esign/sign/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { signatureData, signerName } = req.body;

      if (!signatureData) {
        return res.status(400).json({ error: "Missing signature data" });
      }

      const [existing] = await db.select().from(documentSignatures).where(eq(documentSignatures.id, id));
      if (!existing) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (existing.status === "signed") {
        return res.status(400).json({ error: "Document already signed" });
      }
      if (existing.expiresAt && new Date(existing.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Signature request has expired" });
      }

      const signerIp = req.ip || req.socket.remoteAddress || "unknown";

      const [updated] = await db.update(documentSignatures)
        .set({
          signatureData,
          status: "signed",
          signedAt: new Date(),
          signerIp,
        })
        .where(eq(documentSignatures.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Failed to sign document:", error);
      res.status(500).json({ error: "Failed to sign document" });
    }
  });

  app.post("/api/esign/revoke/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [updated] = await db.update(documentSignatures)
        .set({ status: "revoked" })
        .where(eq(documentSignatures.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to revoke document:", error);
      res.status(500).json({ error: "Failed to revoke document" });
    }
  });

  app.get("/api/esign/verify/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [doc] = await db.select().from(documentSignatures).where(eq(documentSignatures.id, id));
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({
        id: doc.id,
        documentTitle: doc.documentTitle,
        documentType: doc.documentType,
        recipientName: doc.recipientName,
        recipientOrg: doc.recipientOrg,
        status: doc.status,
        signedAt: doc.signedAt,
        createdAt: doc.createdAt,
      });
    } catch (error) {
      console.error("Failed to verify document:", error);
      res.status(500).json({ error: "Failed to verify document" });
    }
  });

  app.post("/api/esign/generate-template", requireAuth, async (req, res) => {
    try {
      const { templateType, grantName, partnerOrg, partnerContact } = req.body;
      if (!templateType) {
        return res.status(400).json({ error: "Missing templateType" });
      }

      const prompts: Record<string, string> = {
        mou: `Generate a professional Memorandum of Understanding (MOU) between ThriveUp Academy and ${partnerOrg || "[Partner Organization]"} for the ${grantName || "grant program"}. Contact: ${partnerContact || "[Partner Contact]"}. Include: purpose, roles and responsibilities, duration, resources committed, confidentiality, termination clause, and signature blocks for both parties. Keep it 2-3 pages.`,
        "letter-of-support": `Generate a professional Letter of Support from ${partnerOrg || "[Partner Organization]"} supporting ThriveUp Academy's application for the ${grantName || "grant program"}. Contact: ${partnerContact || "[Partner Contact]"}. Include: organization description, relationship to ThriveUp, specific support commitments, and a signature block. Keep it 1 page.`,
        "partnership-agreement": `Generate a Partnership Agreement between ThriveUp Academy and ${partnerOrg || "[Partner Organization]"} for the ${grantName || "grant program"}. Contact: ${partnerContact || "[Partner Contact]"}. Include: scope of partnership, responsibilities of each party, timeline, resources, reporting requirements, intellectual property, and signature blocks. Keep it 2-3 pages.`,
        "data-sharing": `Generate a Data Sharing Agreement between ThriveUp Academy and ${partnerOrg || "[Partner Organization]"} for the ${grantName || "grant program"}. Include: purpose, types of data shared, confidentiality requirements, FERPA/HIPAA compliance (as applicable), security measures, authorized personnel, duration, termination, and signature blocks. Keep it 2 pages.`,
        "subcontract": `Generate a Subcontractor Agreement between ThriveUp Academy (prime) and ${partnerOrg || "[Partner Organization]"} (subcontractor) for the ${grantName || "grant program"}. Include: scope of work, deliverables, payment terms, timeline, reporting requirements, compliance with federal/state regulations, and signature blocks. Keep it 3 pages.`,
      };

      const prompt = prompts[templateType] || prompts.mou;

      const content = await generateAIResponse([
        { role: "system", content: "You are a legal document specialist for nonprofit organizations. Generate professional, ready-to-use documents. Use formal language. Include [FILL IN] placeholders only for specific details like dates, addresses, and dollar amounts. Include clear signature blocks at the end with lines for signature, printed name, title, organization, and date." },
        { role: "user", content: prompt },
      ], 4000);

      res.json({ content, templateType });
    } catch (error) {
      console.error("Failed to generate template:", error);
      res.status(500).json({ error: "Failed to generate document template" });
    }
  });

  // ===================================================================
  // DAILY AUTOMATED GRANT DISCOVERY — Runs on startup + every 24 hours
  // Searches SAM.gov and Grants.gov across all ecosystem domains.
  // Results sorted by fit score — most relevant first.
  // ===================================================================

  async function runDailyGrantDiscovery() {
    console.log("[GrantDiscovery] Starting daily automated grant scan...");
    let imported = 0;
    let skipped = 0;

    // === SOURCE 1: SAM.gov (Federal — requires API key) ===
    const apiKey = process.env.SAM_GOV_API_KEY;
    const samgovEnabled = apiKey && apiKey !== "DEMO_KEY";
    if (!samgovEnabled) {
      console.log("[GrantDiscovery] No SAM.gov API key — skipping SAM.gov (other sources will still run)");
    }

    if (samgovEnabled) {
    const keywords = [
      "workforce development",
      "veteran transition services",
      "behavioral health equity",
      "child abuse prevention",
      "emergency preparedness community",
      "minority business enterprise",
      "community health workers",
      "youth mentoring education",
      "juvenile reentry",
      "housing assistance social services",
      "disability support services",
      "maternal health equity",
      "workforce innovation opportunity act",
      "community resilience",
      "digital literacy education",
    ];

    try {
      const opportunities = await fetchSamGovOpportunities(keywords);

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

        let aiResult: GrantAIResult | null = null;
        try {
          aiResult = await analyzeGrantWithAI(grantData);
        } catch (e) {
          console.log(`[GrantDiscovery] AI analysis skipped for "${opp.title}": ${e}`);
        }

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
          await db.insert(grantAlerts).values({
            grantId: grant.id,
            alertType: "high_fit_match",
            title: `High-Fit Grant Found: ${opp.title}`,
            message: `Daily scan discovered a grant with ${fitScore}% fit score`,
            fitScore,
          });
        }
      }

      console.log(`[GrantDiscovery] SAM.gov — ${imported} new grants imported, ${skipped} duplicates skipped, ${opportunities.length} total found`);
    } catch (error) {
      console.error("[GrantDiscovery] SAM.gov scan failed:", error);
    }
    } // end SAM.gov else block

    // === SOURCE 2: Grants.gov (Federal — no API key needed) ===
    try {
      console.log("[GrantDiscovery] Scanning Grants.gov...");
      const grantsGovKeywords = [
        "workforce development", "veteran services", "behavioral health",
        "child abuse prevention", "community health", "minority business",
        "youth mentoring", "juvenile justice", "housing assistance",
        "maternal health", "disability services", "digital literacy",
      ];

      for (let gi = 0; gi < grantsGovKeywords.length; gi++) {
        const kw = grantsGovKeywords[gi];
        if (gi > 0) await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          const ggRes = await fetch("https://apply07.grants.gov/grantsws/rest/opportunities/search", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ keyword: kw, oppStatuses: "posted", rows: 10 }),
            signal: AbortSignal.timeout(20000),
          });
          if (!ggRes.ok) { console.log(`[GrantDiscovery] Grants.gov error for "${kw}": ${ggRes.status}`); continue; }
          const ggData = await ggRes.json();
          const ggHits = ggData.oppHits || [];
          if (ggHits.length > 0) console.log(`[GrantDiscovery] Grants.gov found ${ggHits.length} results for "${kw}"`);

          for (const hit of ggHits) {
            const ggNoticeId = `GG-${hit.id || hit.number}`;
            const existingGG = await db.select({ id: grantOpportunities.id })
              .from(grantOpportunities)
              .where(eq(grantOpportunities.samgovNoticeId, ggNoticeId))
              .limit(1);
            if (existingGG.length > 0) { skipped++; continue; }

            const ggGrantData = {
              title: hit.title || "Untitled",
              description: hit.synopsis || hit.title || "",
              agency: hit.agency || "Federal",
              fundingAmount: "",
              sourceUrl: `https://www.grants.gov/search-results-detail/${hit.id}`,
              grantType: hit.docType || "grant",
              focusAreas: hit.cfdaList ? hit.cfdaList.map((c: string) => `CFDA ${c}`) : [],
              eligibilityCriteria: "",
            };

            const ggFit = computeFitScore(ggGrantData);
            const ggCategory = categorizeGrant(ggGrantData);
            const ggDeadline = hit.closeDate ? parseSamDate(hit.closeDate) : null;
            const ggPosted = hit.openDate ? parseSamDate(hit.openDate) : null;

            const [ggGrant] = await db.insert(grantOpportunities).values({
              ...ggGrantData,
              samgovId: ggNoticeId,
              samgovNoticeId: ggNoticeId,
              fitScore: ggFit.score,
              fitAnalysis: ggFit.analysis,
              readinessChecklist: generateReadinessChecklist(ggFit.matchedAreas),
              category: ggCategory,
              source: "grants.gov",
              deadline: ggDeadline,
              postedDate: ggPosted,
            }).returning();

            imported++;

            if (ggFit.score >= 70) {
              await db.insert(grantAlerts).values({
                grantId: ggGrant.id,
                alertType: "high_fit_match",
                title: `High-Fit Grant (Grants.gov): ${hit.title}`,
                message: `Daily scan discovered a Grants.gov opportunity with ${ggFit.score}% fit score`,
                fitScore: ggFit.score,
              });
            }
          }
        } catch (ggErr) {
          console.error(`[GrantDiscovery] Grants.gov error for "${kw}":`, ggErr);
        }
      }
      console.log(`[GrantDiscovery] Grants.gov scan complete`);
    } catch (error) {
      console.error("[GrantDiscovery] Grants.gov scan failed:", error);
    }

    // === SOURCE 3: USASpending.gov (Federal Awards — see what's being funded NOW) ===
    try {
      console.log("[GrantDiscovery] Scanning USASpending.gov for active federal awards...");
      const spendingKeywords = [
        "workforce development", "veteran transition", "behavioral health",
        "child welfare", "community health worker", "minority business",
        "youth mentoring", "reentry services", "housing assistance",
        "maternal health", "disability employment",
      ];

      for (let si = 0; si < spendingKeywords.length; si++) {
        const skw = spendingKeywords[si];
        if (si > 0) await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const spRes = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filters: {
                keywords: [skw],
                award_type_codes: ["02", "03", "04", "05"],
                time_period: [{ start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], end_date: new Date().toISOString().split("T")[0] }],
              },
              fields: ["Award ID", "Recipient Name", "Award Amount", "Description", "Start Date", "End Date", "Awarding Agency", "Awarding Sub Agency", "generated_internal_id"],
              limit: 8,
              page: 1,
              sort: "Award Amount",
              order: "desc",
            }),
            signal: AbortSignal.timeout(20000),
          });

          if (!spRes.ok) { console.log(`[GrantDiscovery] USASpending error for "${skw}": ${spRes.status}`); continue; }
          const spData = await spRes.json();
          const spResults = spData.results || [];
          if (spResults.length > 0) console.log(`[GrantDiscovery] USASpending found ${spResults.length} awards for "${skw}"`);

          for (const award of spResults) {
            const spNoticeId = `USAS-${award["Award ID"] || award.generated_internal_id}`;
            const existingSP = await db.select({ id: grantOpportunities.id })
              .from(grantOpportunities)
              .where(eq(grantOpportunities.samgovNoticeId, spNoticeId))
              .limit(1);
            if (existingSP.length > 0) { skipped++; continue; }

            const amount = award["Award Amount"] || 0;
            const spGrantData = {
              title: `${award["Awarding Sub Agency"] || award["Awarding Agency"] || "Federal"}: ${skw} (${award["Recipient Name"] || "Awardee"})`,
              description: award["Description"] || `Federal award for ${skw}. Awarded to ${award["Recipient Name"] || "Unknown"}. This indicates active federal funding in this domain — similar opportunities may be available.`,
              agency: [award["Awarding Agency"], award["Awarding Sub Agency"]].filter(Boolean).join(" - ") || "Federal",
              fundingAmount: amount > 0 ? `$${Number(amount).toLocaleString()}` : "",
              sourceUrl: `https://www.usaspending.gov/award/${award.generated_internal_id}`,
              grantType: "federal_award",
              focusAreas: [skw],
              eligibilityCriteria: "Based on active federal award data — indicates agencies actively funding in this domain",
            };

            const spFit = computeFitScore(spGrantData);
            const spCategory = categorizeGrant(spGrantData);

            const [spGrant] = await db.insert(grantOpportunities).values({
              ...spGrantData,
              samgovId: spNoticeId,
              samgovNoticeId: spNoticeId,
              fitScore: spFit.score,
              fitAnalysis: spFit.analysis,
              readinessChecklist: generateReadinessChecklist(spFit.matchedAreas),
              category: spCategory,
              source: "usaspending",
              deadline: null,
              postedDate: award["Start Date"] ? parseSamDate(award["Start Date"]) : null,
              awardCeiling: amount > 0 ? Math.round(amount) : undefined,
            }).returning();

            imported++;

            if (spFit.score >= 70) {
              await db.insert(grantAlerts).values({
                grantId: spGrant.id,
                alertType: "high_fit_match",
                title: `Active Federal Funding: ${skw}`,
                message: `USASpending shows $${Number(amount).toLocaleString()} actively funded in this domain. ${spFit.score}% fit to ecosystem.`,
                fitScore: spFit.score,
              });
            }
          }
        } catch (spErr) {
          console.error(`[GrantDiscovery] USASpending error for "${skw}":`, spErr);
        }
      }
      console.log("[GrantDiscovery] USASpending scan complete");
    } catch (error) {
      console.error("[GrantDiscovery] USASpending scan failed:", error);
    }

    // === SOURCE 4: Foundation & Corporate Opportunities (Curated High-Impact) ===
    try {
      console.log("[GrantDiscovery] Adding curated foundation/corporate opportunities...");
      const curatedOpportunities = [
        { title: "⭐ PRIORITY: Rare Impact Fund — Strengthening the Nonclinical Youth Mental Health Workforce", agency: "Rare Impact Fund (Selena Gomez, $100M Initiative)", description: "The Rare Impact Fund is mobilizing $100M to transform youth mental health. This RFP invests $2.5M+ in nonprofit partners building sustainable career pathways for nonclinical providers — peer mentors, community health workers, navigators, and educators. Expands culturally responsive support, strengthens the nonclinical workforce pipeline, elevates youth voices and equity strategies, and builds legitimacy for undervalued mental health roles. 2-year grants. LOI DEADLINE: April 10, 2026.", fundingAmount: "$250,000 - $500,000", sourceUrl: "https://www.rareimpactfund.org", grantType: "foundation", focusAreas: ["youth mental health", "nonclinical workforce", "peer mentors", "community health workers", "culturally responsive care", "health equity", "workforce development"], eligibilityCriteria: "501(c)(3) nonprofits building career pathways for nonclinical youth mental health providers", source: "foundation", category: "health", deadline: new Date("2026-04-10T23:59:59Z") },
        { title: "St. David's Foundation Community Health Grants", agency: "St. David's Foundation (Austin, TX)", description: "Funds community health improvement, behavioral health, maternal health, and health equity initiatives in the Austin/Travis County area. Historically funds up to $1M for comprehensive community health programs.", fundingAmount: "Up to $1,000,000", sourceUrl: "https://stdavidsfoundation.org/grants/", grantType: "foundation", focusAreas: ["health equity", "behavioral health", "maternal health", "community health"], eligibilityCriteria: "501(c)(3) organizations serving Central Texas communities", source: "foundation", category: "health" },
        { title: "Texas Workforce Commission WIOA Grants", agency: "Texas Workforce Commission (State of Texas)", description: "WIOA Title I Adult, Dislocated Worker, and Youth formula grants administered through local workforce boards. Covers workforce training, career services, youth development, and reentry support.", fundingAmount: "$200,000 - $500,000", sourceUrl: "https://www.twc.texas.gov/programs/workforce-innovation-opportunity-act", grantType: "state_grant", focusAreas: ["workforce development", "youth employment", "career training", "reentry services"], eligibilityCriteria: "Workforce development organizations and training providers in Texas", source: "state_texas", category: "workforce" },
        { title: "SSG Fox Suicide Prevention Grant (VA)", agency: "U.S. Department of Veterans Affairs", description: "Community-based suicide prevention grants for veteran-serving organizations. Funds crisis intervention, peer support, case management, and outreach targeting veterans at risk of suicide.", fundingAmount: "Up to $750,000", sourceUrl: "https://www.va.gov/homeless/ssgfox.asp", grantType: "federal", focusAreas: ["veteran services", "suicide prevention", "behavioral health", "crisis intervention"], eligibilityCriteria: "Community organizations providing veteran suicide prevention services", source: "federal_va", category: "health" },
        { title: "OJJDP Juvenile Justice Programs", agency: "Office of Juvenile Justice and Delinquency Prevention (DOJ)", description: "Funding for juvenile justice programs including mentoring, reentry, diversion, and youth development. Supports evidence-based practices for youth involved in or at risk of involvement in the justice system.", fundingAmount: "$100,000 - $500,000", sourceUrl: "https://ojjdp.ojp.gov/funding", grantType: "federal", focusAreas: ["juvenile justice", "youth mentoring", "reentry", "diversion"], eligibilityCriteria: "Nonprofits serving justice-involved youth", source: "federal_doj", category: "justice" },
        { title: "SAMHSA Community Mental Health Grants", agency: "Substance Abuse and Mental Health Services Administration", description: "Grants for community behavioral health, substance abuse prevention, and mental health services. Supports trauma-informed care, peer support, and integrated health approaches.", fundingAmount: "$100,000 - $1,000,000", sourceUrl: "https://www.samhsa.gov/grants", grantType: "federal", focusAreas: ["behavioral health", "substance abuse", "mental health", "trauma-informed care"], eligibilityCriteria: "Community-based organizations and nonprofits", source: "federal_samhsa", category: "health" },
        { title: "Adient Foundation Community Grants", agency: "Adient Foundation (Corporate)", description: "Corporate foundation supporting education, health, and civic engagement in communities where Adient operates, including Austin/San Antonio corridor. General operating support available.", fundingAmount: "$15,000 - $20,000", sourceUrl: "https://www.adient.com/sustainability/community", grantType: "corporate", focusAreas: ["education", "health", "civic engagement"], eligibilityCriteria: "501(c)(3) nonprofits in Adient operating communities", source: "corporate", category: "community" },
        { title: "DreamBee Foundation Child Abuse Prevention", agency: "DreamBee Foundation", description: "Foundation focused on child abuse prevention, intervention, and family strengthening programs. Supports evidence-based prevention programs and community-level approaches.", fundingAmount: "$25,000 - $100,000", sourceUrl: "https://dreambeefoundation.org/", grantType: "foundation", focusAreas: ["child abuse prevention", "family strengthening", "youth safety"], eligibilityCriteria: "Organizations serving children and families", source: "foundation", category: "community" },
        { title: "Texas Health and Human Services Commission Grants", agency: "Texas HHSC (State of Texas)", description: "State grants for community health, mental health, disability services, and social services programs. Includes behavioral health, substance abuse, and maternal health funding.", fundingAmount: "$50,000 - $500,000", sourceUrl: "https://www.hhs.texas.gov/about/funding-grant-opportunities", grantType: "state_grant", focusAreas: ["behavioral health", "disability services", "community health", "social services"], eligibilityCriteria: "Texas-based nonprofit and community organizations", source: "state_texas", category: "health" },
        { title: "Grand Founders Network-to-Capital Program", agency: "Grand Founders", description: "Accelerator program connecting diverse founders with capital, mentorship, and networks. Focus on Black-led, veteran-founded, and community-impact organizations. Cohort-based with pitch events.", fundingAmount: "Investment + Network Access", sourceUrl: "https://grandfounders.org/initiatives-network-to-capital", grantType: "accelerator", focusAreas: ["social enterprise", "workforce innovation", "community impact", "diverse founders"], eligibilityCriteria: "Diverse-led organizations with community impact models", source: "accelerator", category: "community" },
        { title: "Texas Education Agency Community Partnership Grants", agency: "Texas Education Agency (State of Texas)", description: "Grants for after-school programs, youth development, STEM education, digital literacy, and community education partnerships. Supports out-of-school time programming and community schools.", fundingAmount: "$50,000 - $250,000", sourceUrl: "https://tea.texas.gov/about-tea/funding", grantType: "state_grant", focusAreas: ["education", "youth development", "STEM", "digital literacy", "after-school"], eligibilityCriteria: "Texas educational organizations and nonprofits", source: "state_texas", category: "education" },
        { title: "SBA Minority Business Development Grants", agency: "U.S. Small Business Administration", description: "Federal funding for minority business development centers, entrepreneurship training, and small business technical assistance. Supports capacity building for minority-owned enterprises.", fundingAmount: "$100,000 - $300,000", sourceUrl: "https://www.sba.gov/funding-programs/grants", grantType: "federal", focusAreas: ["minority business", "entrepreneurship", "small business", "technical assistance"], eligibilityCriteria: "Organizations serving minority and disadvantaged business owners", source: "federal_sba", category: "workforce" },
        { title: "FEMA Emergency Preparedness Grants", agency: "Federal Emergency Management Agency", description: "Grants for community emergency preparedness, disaster response planning, and resilience building. Includes programs for underserved communities and whole-community approaches.", fundingAmount: "$50,000 - $500,000", sourceUrl: "https://www.fema.gov/grants", grantType: "federal", focusAreas: ["emergency preparedness", "disaster response", "community resilience"], eligibilityCriteria: "State, local, tribal, and nonprofit organizations", source: "federal_fema", category: "community" },
        { title: "⭐ PRIORITY: TWC RFA 32026-00162 — Skills Development Fund", agency: "Texas Workforce Commission (State of Texas)", description: "Texas Workforce Commission Skills Development Fund grant for employer-driven workforce training. Requires industry partners committing to hire program completers. Funds credential-based training programs, apprenticeships, and upskilling. Aligned with TWC Chapter 803 rules. REQUIRES EMPLOYER PARTNERS. Contact: Cassandra Johnson, RFAgrants@twc.texas.gov. DEADLINE: April 10, 2026 at 10AM CDT.", fundingAmount: "Up to $2,000,000", sourceUrl: "https://www.twc.texas.gov/programs/skills-development-fund", grantType: "state_grant", focusAreas: ["workforce development", "skills training", "industry credentials", "employer partnerships", "apprenticeship", "wage outcomes", "career pathways"], eligibilityCriteria: "Texas workforce training providers with employer partnership commitments", source: "state_texas", category: "workforce", deadline: new Date("2026-04-10T15:00:00Z") },
        { title: "⭐ PRIORITY: PM C2 Transport — Capability Statement Solicitation (Army PEO C3T)", agency: "U.S. Army / PEO C3T (Program Executive Office Command, Control & Communications-Tactical)", description: "Army PM C2 Transport capability statement solicitation. Shield Atlas maps to all 6 Program Assessment Elements (PAEs): Transport Network Ops, Network Security, Spectrum Management, Satellite Communications, Tactical Radio Systems, Network Modernization. Full COMSEC tier alignment and C2 transport alignment table built. Capability statement live at /capability-statement. Email submission deadline April 3, 2026 at 1300 EST. In-person event April 28-29, 2026 in Augusta, GA if selected.", fundingAmount: "Contract Vehicle (TBD upon award)", sourceUrl: "https://shield-atlas.replit.app/capability-statement", grantType: "federal", focusAreas: ["command and control", "C2 transport", "COMSEC", "tactical communications", "network security", "satellite communications", "spectrum management", "defense contracting", "emergency communications"], eligibilityCriteria: "Organizations with C2 transport capabilities and SAM.gov registration", source: "federal_dod", category: "defense", deadline: new Date("2026-04-03T18:00:00Z") },
        { title: "⭐ PRIORITY: U.S. Space Force SkillBridge & DoD Workforce Transition", agency: "U.S. Space Force / Department of Defense", description: "DoD SkillBridge program and Space Force workforce transition initiatives supporting military-to-civilian career pipelines. Funds training providers offering space, cyber, AI/ML, and defense technology credential programs for transitioning service members. Includes Guardian workforce development, Space Operations career pathways, and cybersecurity training. Rolling BAA cycles and annual solicitations.", fundingAmount: "$500,000 - $1,500,000", sourceUrl: "https://skillbridge.osd.mil/", grantType: "federal", focusAreas: ["veteran transition", "military to civilian", "SkillBridge", "space operations", "cybersecurity", "AI/ML workforce", "defense technology", "credential translation", "career pathways"], eligibilityCriteria: "DoD SkillBridge-approved or pending training providers supporting military transition", source: "federal_dod", category: "workforce" },
        { title: "DoD Cyber Workforce Development Grants", agency: "Department of Defense / Cyber Command", description: "Federal funding for cybersecurity workforce development, training pipeline creation, and credential programs. Supports programs producing CompTIA Security+, CISSP, and cyber operations certifications for transitioning military and underserved populations.", fundingAmount: "$250,000 - $1,000,000", sourceUrl: "https://www.cybercom.mil/", grantType: "federal", focusAreas: ["cybersecurity", "workforce development", "military transition", "credential programs", "STEM"], eligibilityCriteria: "Training providers with cybersecurity credential programs", source: "federal_dod", category: "workforce" },
      ];

      for (const co of curatedOpportunities) {
        const coNoticeId = `CURATED-${co.title.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 60)}`;
        const existingCO = await db.select({ id: grantOpportunities.id })
          .from(grantOpportunities)
          .where(eq(grantOpportunities.samgovNoticeId, coNoticeId))
          .limit(1);
        if (existingCO.length > 0) { skipped++; continue; }

        const coFit = computeFitScore(co);

        const [coGrant] = await db.insert(grantOpportunities).values({
          title: co.title,
          description: co.description,
          agency: co.agency,
          fundingAmount: co.fundingAmount,
          sourceUrl: co.sourceUrl,
          grantType: co.grantType,
          focusAreas: co.focusAreas,
          eligibilityCriteria: co.eligibilityCriteria,
          samgovId: coNoticeId,
          samgovNoticeId: coNoticeId,
          fitScore: coFit.score,
          fitAnalysis: coFit.analysis,
          readinessChecklist: generateReadinessChecklist(coFit.matchedAreas),
          category: co.category,
          source: co.source,
          deadline: (co as any).deadline || null,
        }).returning();

        imported++;

        if (coFit.score >= 50) {
          await db.insert(grantAlerts).values({
            grantId: coGrant.id,
            alertType: "high_fit_match",
            title: `${co.source === "foundation" || co.source === "corporate" ? "Foundation/Corporate" : co.source.includes("state") ? "Texas State" : "Federal"}: ${co.title}`,
            message: `${co.agency} opportunity with ${coFit.score}% ecosystem fit. ${co.fundingAmount}`,
            fitScore: coFit.score,
          });
        }
      }
      console.log("[GrantDiscovery] Curated foundation/state/corporate opportunities loaded");
    } catch (error) {
      console.error("[GrantDiscovery] Curated opportunities failed:", error);
    }

    console.log(`[GrantDiscovery] ALL SOURCES COMPLETE — ${imported} new grants imported, ${skipped} duplicates skipped`);
    return { imported, skipped, total: imported + skipped };
  }

  app.get("/api/grants/discovery/status", async (_req, res) => {
    const lastRun = lastDailyDiscoveryRun;
    const nextRun = lastRun ? new Date(lastRun.getTime() + 24 * 60 * 60 * 1000) : null;
    const hasApiKey = !!process.env.SAM_GOV_API_KEY && process.env.SAM_GOV_API_KEY !== "DEMO_KEY";

    const totalGrants = await db.select({ count: sql<number>`count(*)` }).from(grantOpportunities);
    const highFitGrants = await db.select({ count: sql<number>`count(*)` }).from(grantOpportunities).where(gte(grantOpportunities.fitScore, 70));

    const today6am = new Date();
    today6am.setUTCHours(0, 0, 0, 0);
    const todayGrants = await db.select({ count: sql<number>`count(*)` }).from(grantOpportunities).where(gte(grantOpportunities.createdAt, today6am));

    res.json({
      automated: true,
      frequency: "Every 24 hours",
      lastRun: lastRun?.toISOString() || "Not yet run",
      nextRun: nextRun?.toISOString() || "Pending first run",
      apiKeyConfigured: hasApiKey,
      lastResult: lastDiscoveryResult,
      todayNewGrants: todayGrants[0]?.count || 0,
      searchDomains: [
        "Workforce Development", "Veteran Transition", "Behavioral Health",
        "Child Abuse Prevention", "Emergency Preparedness", "Minority Business",
        "Community Health", "Youth Education", "Juvenile Justice",
        "Housing & Social Services", "Disability Support", "Maternal Health",
        "WIOA Programs", "Community Resilience", "Digital Literacy",
      ],
      totalGrantsTracked: totalGrants[0]?.count || 0,
      highFitGrants: highFitGrants[0]?.count || 0,
      sources: ["SAM.gov (Federal)", "Grants.gov (Federal)", "USASpending.gov (Active Awards)", "Texas State (TWC, HHSC, TEA)", "Foundations (St. David's, DreamBee)", "Corporate (Adient)", "Accelerators (Grand Founders)"],
    });
  });

  app.post("/api/grants/discovery/run-now", requireAuth, async (_req, res) => {
    try {
      const result = await runDailyGrantDiscovery();
      lastDailyDiscoveryRun = new Date();
      res.json({ success: true, ...result, ranAt: lastDailyDiscoveryRun.toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Manual discovery run failed", details: String(error) });
    }
  });

  app.get("/api/teks-alignment", async (_req: Request, res: Response) => {
    try {
      const alignment = {
        standard: "19 TAC §127.15 — CTE Employability Skills",
        adopted: "2025",
        applicant: "The Collaborative Advocate (501(c)(3))",
        platform: "ThriveUp Academy",
        lastUpdated: new Date().toISOString(),
        credential: {
          name: "ThriveUp Workforce Readiness Certificate",
          description: "Earned after completing all 5 TEKS §127.15-aligned workforce readiness modules plus career readiness assessment",
          verifiable: true,
          digitalBadge: true,
        },
        levels12: [
          { code: "A", title: "Professional Conduct", status: "ALIGNED", module: "wr_professional_presence", coverage: "Dress codes, professional communication, interview skills, workplace conduct" },
          { code: "B", title: "Teamwork", status: "ALIGNED", module: "wr_career_foundations_teamwork", coverage: "Group dynamics, conflict resolution, cooperative problem-solving, diverse perspectives" },
          { code: "C", title: "Communication", status: "ALIGNED", module: "wr_professional_presence", coverage: "Written/oral communication, AI prompt engineering, technical writing, presentation skills" },
          { code: "D", title: "Time Management", status: "ALIGNED", module: "wr_time_management", coverage: "Prioritization frameworks, calendar skills, deadline management, group coordination" },
          { code: "E", title: "Work Ethic", status: "ALIGNED", module: "wr_work_ethic_leadership", coverage: "Punctuality, dependability, reliability, responsibility, accountability tracking" },
          { code: "F", title: "Respect for Differences", status: "ALIGNED", module: "PLATFORM_CORE", coverage: "Equity-focused lens, culturally responsive communication, multilingual support, diverse community service" },
          { code: "G", title: "Meritocracy & Equal Opportunity", status: "ALIGNED", module: "wr_work_ethic_leadership", coverage: "Merit-based advancement, EEO basics, career progression through demonstrated skill" },
          { code: "H", title: "Discrimination & Harassment", status: "ALIGNED", module: "wr_workplace_rights", coverage: "Title VII basics, harassment types, reporting procedures, bystander responsibilities, consequences" },
          { code: "I", title: "Workplace Safety", status: "ALIGNED", module: "wr_workplace_safety", coverage: "OSHA basics, hazard identification, PPE, emergency procedures, safety plans" },
          { code: "J", title: "Roles of Managers", status: "ALIGNED", module: "wr_work_ethic_leadership", coverage: "Organizational structures, manager roles, supervisor relationships, management expectations" },
        ],
        levels34: [
          { code: "A", title: "Professional Conduct (Demonstrate)", status: "ALIGNED", module: "wr_professional_presence", coverage: "Simulated demonstrations with assessment rubrics" },
          { code: "B", title: "Teamwork (Analyze)", status: "ALIGNED", module: "wr_career_foundations_teamwork", coverage: "Team effectiveness analysis, cooperative outcome measurement" },
          { code: "C", title: "Communication (Design Process)", status: "ALIGNED", module: "wr_professional_presence", coverage: "Decision justification, design process communication" },
          { code: "D", title: "Time Management (Apply)", status: "ALIGNED", module: "wr_time_management", coverage: "Independent and group time management practice" },
          { code: "E", title: "Work Ethic (Demonstrate)", status: "ALIGNED", module: "wr_work_ethic_leadership", coverage: "Self-assessment tied to attendance tracking data" },
          { code: "F", title: "Respect for Differences", status: "ALIGNED", module: "PLATFORM_CORE", coverage: "Same as Level 1-2" },
          { code: "G", title: "Meritocracy & Equal Opportunity", status: "ALIGNED", module: "wr_work_ethic_leadership", coverage: "Same as Level 1-2" },
          { code: "H", title: "Discrimination & Harassment", status: "ALIGNED", module: "wr_workplace_rights", coverage: "Same as Level 1-2" },
          { code: "I", title: "Safety Plans", status: "ALIGNED", module: "wr_workplace_safety", coverage: "Safety plan components, risk assessment, incident response" },
          { code: "J", title: "Managers vs. Leaders", status: "ALIGNED", module: "wr_work_ethic_leadership", coverage: "Leadership styles comparison, situational leadership" },
        ],
        totalStandards: 20,
        alignedStandards: 20,
        alignmentPercentage: 100,
        modules: [
          { id: "wr_professional_presence", title: "Professional Presence", weeks: 3, teksAligned: ["A"] },
          { id: "wr_workplace_rights", title: "Workplace Rights & Responsibilities", weeks: 3, teksAligned: ["H"] },
          { id: "wr_workplace_safety", title: "Workplace Safety Essentials", weeks: 3, teksAligned: ["I"] },
          { id: "wr_time_management", title: "Time & Priority Management", weeks: 3, teksAligned: ["D"] },
          { id: "wr_work_ethic_leadership", title: "Work Ethic & Career Leadership", weeks: 3, teksAligned: ["E", "G", "J"] },
          { id: "wr_career_foundations_teamwork", title: "Teamwork & Communication", weeks: 3, teksAligned: ["B", "C"] },
          { id: "wr_career_foundations_professionalism", title: "Introduction to Professionalism", weeks: 3, teksAligned: ["A", "E", "F", "J"] },
        ],
      };
      res.json(alignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  let lastDailyDiscoveryRun: Date | null = null;
  let lastDiscoveryResult: { imported: number; skipped: number; total: number; error?: string } | null = null;

  setTimeout(async () => {
    console.log("[GrantDiscovery] Running initial grant scan on startup...");
    lastDiscoveryResult = await runDailyGrantDiscovery();
    lastDailyDiscoveryRun = new Date();
  }, 30000);

  setInterval(async () => {
    console.log("[GrantDiscovery] Running scheduled daily grant scan...");
    lastDiscoveryResult = await runDailyGrantDiscovery();
    lastDailyDiscoveryRun = new Date();
  }, 24 * 60 * 60 * 1000);
}
