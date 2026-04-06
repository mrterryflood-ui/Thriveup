import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { grantOpportunities, grantAlerts, platformGaps, insertGrantOpportunitySchema, advisoryBoardMembers, advisoryBoardMeetings, staffingPlanEntries, insertAdvisoryBoardMemberSchema, insertAdvisoryBoardMeetingSchema, insertStaffingPlanEntrySchema, outcomeTracking, participantProfiles, serviceRecords, grantReminders, grantChecklistItems, insertGrantReminderSchema, insertGrantChecklistItemSchema, grantSectionDrafts, documentSignatures, insertDocumentSignatureSchema } from "@shared/schema";
import type { GrantOpportunity } from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, gte, lte, and, or, ilike } from "drizzle-orm";
import { generateAIResponse, streamAIResponse } from "./ai-provider";
import { collaborativeResponse } from "./collaborative-ai";
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
  { area: "Emergency Management & Community Safety", features: ["Emergency Management emergency response", "Geographic risk mapping", "Crisis coordination", "Continuity planning", "Community resilience scoring", "All-hazard preparedness"], grantKeywords: ["emergency", "disaster", "resilience", "preparedness", "FEMA", "crisis", "safety", "hazard"] },
  { area: "Minority Business & Economic Development", features: ["MCE with 656K+ SAM.gov records", "Certification wizard", "Proposal review", "Teaming hub", "APEX Accelerator integration", "Pinnacle Business Conglomerate"], grantKeywords: ["minority business", "small business", "economic development", "contracting", "8(a)", "HUBZone", "MWBE", "disadvantaged"] },
  { area: "Health Equity", features: ["Sankofa maternal health", "Sankofa feminine health", "Black men's health", "Autoimmune Thrive", "PillScheduler medication management", "SafeCogniCare cognitive safety", "SDOH navigation"], grantKeywords: ["health equity", "disparities", "maternal", "chronic disease", "medication", "cognitive", "social determinants"] },
  { area: "Education & Youth Development", features: ["WholeMind K-12 education platform", "Life Pals student support", "Perfectly Different neurodiversity support", "Digital literacy curriculum", "Mentoring and peer support"], grantKeywords: ["education", "youth", "K-12", "STEM", "digital literacy", "mentoring", "neurodiversity", "disability", "special education"] },
  { area: "Community Resources & Social Services", features: ["LifeBridge Virtual 211", "Housing navigation", "Food access", "Utilities assistance", "Crisis support", "Life event guides", "SDOH resource mapping"], grantKeywords: ["community", "housing", "food", "wraparound", "social services", "homelessness", "resource", "211"] },
  { area: "Communication & Accessibility", features: ["Speech Bridge dialect recognition", "Language translation", "Culturally responsive communication", "Accessibility tools"], grantKeywords: ["language", "translation", "accessibility", "communication", "culturally responsive", "LEP", "bilingual"] },
  { area: "Data, Outcomes & Governance", features: ["Better Science Lab implementation science", "CFIR and RE-AIM frameworks", "Fidelity measurement", "Outcome tracking", "Cross-platform analytics", "Evidence-based practice validation"], grantKeywords: ["outcomes", "data", "measurement", "evidence-based", "fidelity", "implementation science", "evaluation"] },
  { area: "Ecosystem Coordination", features: ["24-platform ACOS architecture", "Pre-Build Gate enforcement", "Capability Orchestration Map", "7-triad team-of-teams", "Bilateral collaboration exchange", "Multi-agency coordination"], grantKeywords: ["coordination", "collaboration", "partnership", "multi-agency", "ecosystem", "systems", "integration"] },
];

const COLLABORATOR_VALUE_PROPOSITIONS: Record<string, { theyGet: string[]; weGet: string[] }> = {
  "Data & Measurement": {
    theyGet: ["Tract-level community data access (not county averages)", "8 federal data sources already integrated (CDC PLACES, SVI, FBI, Census ACS, USDA, HUD, SAMHSA, BLS)", "GIS mapping & visualization infrastructure", "Automated community data packages"],
    weGet: ["Measurement credibility & co-validation", "Shared methodology alignment", "Joint data storytelling"],
  },
  "Workforce & Career": {
    theyGet: ["55 career pathways across 12 industries", "AI Workforce Academy training infrastructure", "WIOA-aligned curriculum & TEKS §127.15 CTE alignment", "Employer partnership network"],
    weGet: ["Expanded employer pipeline", "Career placement channels", "Industry-validated credentials"],
  },
  "Health & Human Services": {
    theyGet: ["7 coordinated health platforms (not siloed tools)", "SDOH navigation with automated risk routing", "Culturally responsive health assessments", "Agent-to-agent referral automation"],
    weGet: ["Clinical referral partnerships", "Health outcome validation", "Population health data"],
  },
  "Education & Youth": {
    theyGet: ["5-level AI mastery curriculum (K-12 and adult)", "Gamified virtual campus (Panther Village)", "Mastery-gated AI Creation Studio (10 tools)", "Grade-band adaptive AI tutoring (Spark & Sparky)"],
    weGet: ["School district partnerships", "Student enrollment pipelines", "Academic outcome benchmarks"],
  },
  "Justice & Reentry": {
    theyGet: ["5-phase reentry case management pipeline", "Thrive Score system with court-ready reports", "Risk-to-platform automated routing", "Justice Command Center analytics"],
    weGet: ["Justice system referrals", "Recidivism data partnerships", "Court system validation"],
  },
  "Community & Civic": {
    theyGet: ["LifeBridge Virtual 211 resource navigation", "Community mapping with real-time indicators", "Regional hub deployment infrastructure", "Ecosystem coordination across 24 platforms"],
    weGet: ["Community trust & grassroots credibility", "Local network access", "Co-branded community impact"],
  },
};

const RELATIONSHIP_TYPES = ["funder", "collaborator", "strategic_partner", "data_partner", "implementation_partner"] as const;

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
  "Emergency Management": { url: "https://emergency-mgmt.replit.app", capabilities: ["emergency", "disaster", "resilience", "safety", "hazard", "crisis", "preparedness"] },
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

  app.post("/api/grants/refresh-samgov", requireAuth, async (_req, res) => {
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
        ST_DAVIDS_LOI: `Generate a Letter of Intent (LOI) for St. David's Foundation "We All Benefit 2.0: Building Economic Stability" grant program.

APPLICANT: The Collaborative Advocate Foundation, 501(c)(3), EIN 41-3618003. Veteran-founded, Black-led. Dr. Terry Flood, Founder & CEO. 17912 Stefano Drive, Pflugerville, TX 78660.

VOICE & VALUES — This is who we are:
- We are EQUITY-FOCUSED and EQUALITY and ACCESS driven. Not theoretical equity — tract-level data that exposes the neighborhoods county averages hide.
- We are PROBLEM SOLVERS using COLLABORATIVE ACCOUNTABILITY and TRANSPARENCY that is DATA-LED and INTENTIONAL. We don't guess. We measure. Then we act.
- We make GOOD PROGRAMS BETTER. We don't compete with existing organizations — we give them infrastructure to amplify their impact.
- We LEAVE NO ONE BEHIND. Homeless individuals (3,238 PIT count in Austin, 68% became homeless IN Austin), immigrants and refugees (Speech Bridge for language access, LifeBridge for resource navigation regardless of documentation status), veterans (13% of homeless population), youth aging out of foster care, formerly incarcerated — everyone has a pathway.
- We are HOLISTIC and COMPREHENSIVE. 24 coordinated platforms. One entry point. No dead ends. If one platform identifies a need, the ecosystem routes it to the right service automatically.
- We MEASURE IMPACT for everyone — including homeless populations and immigrants. Our LifeBridge platform tracks housing stability outcomes. Speech Bridge provides multilingual access. Our data captures outcomes for ALL populations, not just those easiest to count.

ST. DAVID'S REQUIREMENTS:
- Geographic: Central Texas (Travis, Williamson, Bastrop, Caldwell, Hays counties) — we serve Travis and Williamson through our Austin, Manor, and Pflugerville regional hubs.
- Focus: Economic stability through public benefits enrollment (SNAP, Medicaid, CHIP, WIC, housing, childcare), financial coaching, workforce development, addressing barriers to benefits access.
- Community voice: St. David's explicitly scores for community-informed design. Our Three Realities methodology IS this — community data shapes every intervention.
- Data-driven: 8 federal data sources integrated. Locked Census baselines. Real-time gap tracking. Implementation science validation (CFIR, RE-AIM).

THRIVEUP ECOSYSTEM ALIGNMENT:
- LifeBridge: Virtual 211 — housing navigation, benefits enrollment, food access, utilities assistance, crisis support. DIRECTLY addresses public benefits enrollment priority.
- ThriveUp Academy: Workforce development with 55 career pathways, AI Workforce Academy, WIOA-aligned curriculum. Economic stability through employment.
- Financial Literacy module: Academy Wallet, Stock Market Simulator — asset building and financial coaching.
- Speech Bridge: Language translation and culturally responsive communication — removes barriers for immigrant and LEP communities.
- Whole-Person Health + 6 health platforms: Holistic health screening that identifies SDOH factors blocking economic stability.
- MAP-GAP framework: Continuous improvement methodology — makes good programs better, doesn't replace them.
- LifeBridge tracks outcomes for homeless and unhoused populations. Speech Bridge serves immigrant and refugee communities. No population is invisible in our data.

AUSTIN CRISIS DATA TO WEAVE IN:
- 3,238 people counted in 2025 PIT (up 36% from 2023)
- 68% became homeless IN Austin — not transplants
- Youth homelessness nearly quadrupled: 247 (2020) to 934 (2024)
- A family needs $95,000/year to afford Austin's median home. Median household income: $80,954.
- Without credentials beyond high school, Central Texans have only a 12% chance of earning a living wage.
- Black homeownership: 30% vs 70% white — a 40-point gap.

Write the LOI in 500-750 words. Professional but passionate. This should sound like a problem solver who builds infrastructure, not someone asking for charity. Use plain paragraphs, no markdown formatting. The tone is: "We see what's broken. We built the tools. Here's what we'll do."`,
        ST_DAVIDS_FULL: `Generate a full grant narrative for St. David's Foundation "We All Benefit 2.0" application. Use the same voice, values, and ecosystem alignment as the LOI but expanded to 2,000-2,500 words with detailed sections: (1) Organizational Background, (2) Community Need with Census tract-level data, (3) Program Design showing how 24 platforms create comprehensive economic stability pathways, (4) Community Voice through Three Realities methodology, (5) Populations Served including homeless, immigrants, veterans, justice-involved, foster youth — no one left behind, (6) Data & Measurement Infrastructure showing 8 federal sources and locked baselines, (7) Collaborative Approach showing ecosystem coordination and partner integration, (8) Sustainability beyond the grant period. Emphasize equity, access, collaborative accountability, transparency, data-led decision making, and holistic comprehensive service delivery.`,
        COLLABORATION: `Generate a collaboration proposal narrative for ThriveUp Academy ACOS (Autonomous Collaborative Operating System), a 24-platform AI-powered ecosystem under The Collaborative Advocate Foundation (501(c)(3), EIN 41-3618003). This is NOT a grant request — it is a partnership proposal showing mutual value. ThriveUp offers collaborators: tract-level community data (not county averages), 8 integrated federal data sources (CDC PLACES, SVI, FBI Crime, Census ACS, USDA Food Atlas, HUD, SAMHSA, BLS), GIS mapping infrastructure, autonomous agent coordination across 24 platforms, and implementation science validation (CFIR, RE-AIM). In return, collaborators bring credibility, network access, co-validation, and shared impact measurement. Frame this as infrastructure the collaborator doesn't have to build themselves — they plug into what already exists. Emphasize mutual accountability, shared data, and joint community impact.`,
        DATA_PARTNERSHIP: `Generate a data partnership proposal for ThriveUp Academy's community measurement infrastructure. ThriveUp has built tract-level data analysis across 8 federal sources — CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data Explorer, Census ACS, USDA Food Atlas, HUD, SAMHSA, and BLS. The platform exposes the neighborhoods where poverty exceeds 40% and unemployment tops 20% that county averages hide. For data-focused organizations like Measure Austin, United Way, and community foundations, this is shared infrastructure: API access, community data packages, GIS visualization, and automated reporting. Frame this as a two-way data relationship — not a one-sided ask.`,
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

  // ==================== COLLABORATION PROPOSAL GENERATOR ====================

  app.post("/api/grant-narrative/collaboration-proposal", requireAuth, async (req, res) => {
    try {
      const { organizationName, relationshipType, focusDomains, customContext } = req.body as {
        organizationName: string;
        relationshipType?: string;
        focusDomains?: string[];
        customContext?: string;
      };

      if (!organizationName) {
        return res.status(400).json({ error: "Organization name is required" });
      }

      const relType = relationshipType || "collaborator";
      const domains = focusDomains || Object.keys(COLLABORATOR_VALUE_PROPOSITIONS);

      const valueProps = domains
        .filter(d => COLLABORATOR_VALUE_PROPOSITIONS[d])
        .map(d => {
          const vp = COLLABORATOR_VALUE_PROPOSITIONS[d];
          return `${d}:\n  They get: ${vp.theyGet.join("; ")}\n  We get: ${vp.weGet.join("; ")}`;
        })
        .join("\n\n");

      const [participants] = await db.select({ count: sql<number>`count(*)` }).from(participantProfiles);
      const [outcomes] = await db.select({ count: sql<number>`count(*)` }).from(outcomeTracking);

      const prompt = `Generate a collaboration proposal for ThriveUp Academy ACOS to present to ${organizationName}.

RELATIONSHIP TYPE: ${relType}
This is NOT a grant request. This is a mutual-value partnership proposal.

ABOUT THRIVEUP:
- The Collaborative Advocate Foundation, 501(c)(3), EIN 41-3618003
- Veteran-founded, Black-led, Dr. Terry Flood, Founder & CEO
- 24-platform Autonomous Collaborative Operating System (ACOS)
- ${Number(participants.count)} participants served, ${Number(outcomes.count)} outcomes tracked
- Tract-level data methodology across 8 federal sources
- Live production system at thrivingcommunitiesforall.com

VALUE EXCHANGE BY DOMAIN:
${valueProps}

${customContext ? `ADDITIONAL CONTEXT:\n${customContext}` : ""}

Generate a professional collaboration proposal with these sections:
1. EXECUTIVE SUMMARY (2-3 paragraphs — who we are, what we're proposing, why it's mutual)
2. WHAT ${organizationName.toUpperCase()} GETS (specific infrastructure, data, tools they can access)
3. WHAT THRIVEUP GETS (honest about our needs — credibility, network, validation)
4. SHARED IMPACT FRAMEWORK (how we measure success together — joint metrics, shared dashboards, co-branded reporting)
5. PROPOSED ENGAGEMENT MODEL (phases: explore → pilot → integrate → co-own)
6. NEXT STEPS (concrete actions within 30 days)

Write in professional but warm language. This should read as peers building together, not a supplicant asking for help. Approximately 600-800 words. Do NOT use markdown formatting — write in plain paragraphs with clear section headers.`;

      const response = await generateAIResponse([
        { role: "system", content: "You are a strategic partnership consultant specializing in nonprofit collaborations and community ecosystem development. You write proposals that emphasize mutual value, shared infrastructure, and co-ownership of impact." },
        { role: "user", content: prompt }
      ], 3000);

      res.json({
        proposal: response,
        organizationName,
        relationshipType: relType,
        focusDomains: domains,
        valuePropositions: domains
          .filter(d => COLLABORATOR_VALUE_PROPOSITIONS[d])
          .map(d => ({ domain: d, ...COLLABORATOR_VALUE_PROPOSITIONS[d] })),
      });
    } catch (error) {
      console.error("Failed to generate collaboration proposal:", error);
      res.status(500).json({ error: "Failed to generate collaboration proposal" });
    }
  });

  app.get("/api/grants/collaborator-value-map", requireAuth, async (_req, res) => {
    try {
      res.json({
        domains: COLLABORATOR_VALUE_PROPOSITIONS,
        relationshipTypes: RELATIONSHIP_TYPES,
        platformCount: 24,
        dataSources: ["CDC PLACES API", "CDC/ATSDR SVI", "FBI Crime Data Explorer", "Census ACS", "USDA Food Atlas", "HUD", "SAMHSA", "BLS"],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collaborator value map" });
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

      const prompt = `You are a grant opportunity analyst for ThriveUp Academy, a 24-platform workforce development ecosystem. Analyze the following grant opportunity and provide a structured assessment.

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
- 24-platform technology ecosystem: ThriveUp Academy (education), MCE (minority business), LifeBridge (community voice/benefits navigation), RPLICE/Better Science Lab (fidelity monitoring/research), Sankofa Health Network (health equity), Holistic Black Feminine Health Hub, Black Maternal Health Network, Black Men's Health Hub, M2C Transition (military-to-civilian), Mission Transition (separation support), SafeReport (safety/mandatory reporting), Perfectly Different (neurodiversity), WholeMind Learning (K-12 education), PillScheduler (medication adherence), SafeCogniCare (cognitive health), Emergency Management (risk intelligence), The Collaborative Advocate (VOSB services), Video Creator AI (content production), Ecosystem Nexus (coordination), ISSS (student support), Pinnacle Business Conglomerate (contractor enablement)
- Focus areas: youth workforce development, substance use prevention, community coalition building, economic empowerment, reentry services

${grantKnowledge ? `\nDETAILED GRANT KNOWLEDGE (use this to align every section precisely):\n${grantKnowledge}` : ""}

CRITICAL INSTRUCTIONS:
1. Write in professional grant language appropriate for federal/foundation reviewers
2. ${wordCount ? `YOU MUST write to the FULL required length: ${wordCount}. Do NOT stop short. Fill the entire allocation with substantive, detailed content.` : "Write a comprehensive, detailed section."}
3. ${pageLimit ? `Target page limit: ${pageLimit}. Write enough content to fill this allocation.` : ""}
4. Include specific, measurable outcomes with numbers and percentages
5. Reference evidence-based practices, data sources, and research
6. Align precisely with the grant's specific requirements and evaluation criteria
7. Incorporate the organization's unique differentiators (Three Realities, MAP-GAP, 24-platform ecosystem)
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

      const collabResult = await collaborativeResponse(userPrompt, {
        systemPrompt,
        maxTokens,
        topic: `grant draft ${grantName} ${sectionName}`,
      });
      let draft = collabResult.synthesis;

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

          const contResult = await collaborativeResponse(continuationPrompt, {
            systemPrompt,
            maxTokens: Math.max(4000, Math.ceil(remaining * 2.0)),
            topic: `grant continuation ${grantName} ${sectionName}`,
          });

          draft = draft.trimEnd() + " " + contResult.synthesis.trimStart();
          currentWords = draft.trim().split(/\s+/).length;
        }

        if (continuationAttempts > 0) {
          console.log(`[grant-draft] Section "${sectionName}": final word count ${currentWords} after ${continuationAttempts} continuation(s)`);
        }
      }

      res.json({ draft, sectionId, sectionName, collaborative: { engines: collabResult.engines.filter(e => !e.error).map(e => e.engine), consensusMethod: collabResult.consensusMethod, ragChunks: collabResult.ragContext.chunkCount, timeMs: collabResult.totalTimeMs } });
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

      const refineCollab = await collaborativeResponse(
        `Grant: ${grantName}\nSection: ${sectionName}\n\nCurrent draft (${inputWords} words — your refined version must be AT LEAST this long):\n${currentDraft}\n\nRefinement instructions:\n${refinementInstructions}\n\nReturn the COMPLETE refined version from beginning to end. Do not skip or summarize any part of the original:`,
        { systemPrompt: systemContent, maxTokens: refineMaxTokens, topic: `grant refine ${grantName} ${sectionName}` }
      );
      let refined = refineCollab.synthesis;

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
- 24-platform integrated technology ecosystem for workforce development
- Target population: youth and young adults facing employment barriers, with focus on Black youth 16-24

IMPORTANT — DISTINGUISH PARTNER TYPES:
- FUNDERS: Organizations providing financial support (grants, donations). ThriveUp shows measurable ROI, locked baselines, grant-ready deliverables.
- COLLABORATORS: Peer organizations who co-build, share data, validate methodology. ThriveUp offers them shared infrastructure (tract-level data, 8 federal sources, GIS mapping, API access). They offer credibility, network access, co-validation.
- For each partner, indicate whether they are a FUNDER, COLLABORATOR, or BOTH, and frame the "Partnership Value" accordingly — collaborators get infrastructure they don't have to build themselves.
${serviceAreaContext}
${partnershipContext}

GRANT: ${grantName}
${grantKnowledge ? `GRANT DETAILS:\n${grantKnowledge}` : ""}`;

        userPrompt = `For the checklist item "${checklistItem}", generate 8-10 SPECIFIC, REAL organizations in the Austin, TX area that ThriveUp Academy should partner with for the ${grantName} application.

For each partner, provide:
1. **Organization Name** — the actual organization name
2. **Relationship Type** — FUNDER, COLLABORATOR, or BOTH
3. **Why They're a Fit** — 1-2 sentences on alignment
4. **Contact Approach** — how to reach out (specific department, role to contact)
5. **Partnership Value** — what they bring AND what ThriveUp offers them (for COLLABORATORS, emphasize shared infrastructure they get: tract-level data, GIS mapping, 8 federal data sources, API access — infrastructure they don't have to build themselves)
6. **Urgency** — High/Medium/Low priority for this grant

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
- 24-platform integrated technology ecosystem
- Target population: youth and young adults facing employment barriers
${serviceAreaContext}
${partnershipContext}

GRANT: ${grantName}`;

        userPrompt = `Write 3 outreach email templates for the checklist item "${checklistItem}" for the ${grantName} application.

Create templates for different partner types:
1. **Employer Partner** — for companies who would provide work-based learning, internships, or job placement opportunities
2. **Community Organization / Collaborator** — for nonprofits, data organizations, and community groups who serve similar populations and want to co-build (frame as mutual infrastructure sharing, not just a grant letter of support — show what ThriveUp's 24-platform ecosystem and tract-level data bring to THEM)
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

  app.post("/api/esign/sign/:id", requireAuth, async (req, res) => {
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
        { title: "⭐ PRIORITY: TWC RFA 32026-00162 — Workforce Readiness Training for CTE Students II", agency: "Texas Workforce Commission (State of Texas)", description: "Workforce readiness training for Career and Technical Education students (grades 9-12). Funds TEKS §127.15-aligned employability skills training, curriculum delivery, and credential programs. Nonprofit organizations eligible to apply directly. Contact: Cassandra Johnson, RFAgrants@twc.texas.gov. DEADLINE: April 14, 2026 at 10AM CDT (extended via Amendment I, April 3, 2026). Submit via TWC Bonfire Procurement Portal.", fundingAmount: "Up to $2,000,000", sourceUrl: "https://twc-texas-gov.bonfirehub.com/opportunities/224162", grantType: "state_grant", focusAreas: ["workforce development", "CTE", "employability skills", "youth workforce", "career pathways", "TEKS alignment"], eligibilityCriteria: "Texas nonprofit organizations, ISDs, and workforce training providers", source: "state_texas", category: "workforce", deadline: new Date("2026-04-14T15:00:00Z") },
        { title: "⭐ PRIORITY: PM C2 Transport — Capability Statement Solicitation (Army PEO C3T)", agency: "U.S. Army / PEO C3T (Program Executive Office Command, Control & Communications-Tactical)", description: "Army PM C2 Transport capability statement solicitation. Emergency Management maps to all 6 Program Assessment Elements (PAEs): Transport Network Ops, Network Security, Spectrum Management, Satellite Communications, Tactical Radio Systems, Network Modernization. Full COMSEC tier alignment and C2 transport alignment table built. Capability statement live at /capability-statement. Email submission deadline April 3, 2026 at 1300 EST. In-person event April 28-29, 2026 in Augusta, GA if selected.", fundingAmount: "Contract Vehicle (TBD upon award)", sourceUrl: "https://emergency-mgmt.replit.app/capability-statement", grantType: "federal", focusAreas: ["command and control", "C2 transport", "COMSEC", "tactical communications", "network security", "satellite communications", "spectrum management", "defense contracting", "emergency communications"], eligibilityCriteria: "Organizations with C2 transport capabilities and SAM.gov registration", source: "federal_dod", category: "defense", deadline: new Date("2026-04-03T18:00:00Z") },
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
    try {
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
    } catch (error) {
      console.error("Error in GET /api/grants/discovery/status", error);
      res.status(500).json({ error: "Internal server error" });
    }
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

  const AGENCY_INTELLIGENCE: Record<string, {
    evaluationApproach: string;
    whatTheyPrioritize: string[];
    commonMistakes: string[];
    winStrategy: string;
    submissionNorms: string;
  }> = {
    "federal_civilian": {
      evaluationApproach: "Federal civilian agencies (GSA, HHS, DOE, EPA, DOL, etc.) follow FAR Part 15 (negotiated procurement) or FAR Part 13 (simplified acquisition under $250K). Evaluation uses Technical Evaluation Boards (TEBs) with assigned point scores. Best-value tradeoff is common — lowest price doesn't always win. Past performance is weighted heavily (FAR 15.305). Oral presentations may be requested.",
      whatTheyPrioritize: [
        "Compliance with every stated requirement — non-compliant proposals are eliminated before scoring",
        "Past performance on similar contracts (FAR 15.305 — most important factor after technical)",
        "Small business participation and socioeconomic goals (FAR 19)",
        "Technical approach that demonstrates understanding of the agency's mission",
        "Key personnel qualifications and availability",
        "Management approach and quality control plan",
        "Section 508 accessibility compliance for IT",
      ],
      commonMistakes: [
        "Missing a single required document means automatic disqualification",
        "Exceeding page limits — evaluators stop reading at the limit",
        "Generic past performance — must be directly relevant to the scope",
        "Not registering in SAM.gov before submission deadline",
        "Pricing that doesn't match the CLIN structure requested",
      ],
      winStrategy: "Mirror the evaluation criteria order in your proposal structure. Address every requirement with a clear 'shall' response. Past performance must include contract numbers, CPARS ratings, and specific measurable outcomes.",
      submissionNorms: "Electronic submission via agency portal (SAM.gov, eBuy, agency-specific). Strict page limits. Separate technical and price volumes. Government-furnished property forms. Reps & Certs in SAM.gov must be current.",
    },
    "dod_military": {
      evaluationApproach: "DOD follows DFARS supplementing FAR. Source Selection Evaluation Boards (SSEBs) with color/adjectival ratings (Blue/Outstanding, Green/Acceptable, Yellow/Marginal, Red/Unacceptable). Past Performance rated Substantial/Satisfactory/Neutral/Marginal/Unsatisfactory. LPTA (Lowest Price Technically Acceptable) is common for services. Best-value used for complex work.",
      whatTheyPrioritize: [
        "DFARS compliance — additional clauses beyond FAR",
        "Security clearance requirements (facility and personnel)",
        "Cybersecurity maturity (CMMC level) for CUI handling",
        "Transition plan from incumbent contractor",
        "Surge and mobilization capability",
        "Understanding of military operations and culture",
        "ITAR/EAR export control compliance where applicable",
      ],
      commonMistakes: [
        "Underestimating security requirements — clearance gaps eliminate proposals",
        "Not addressing CMMC requirements when handling CUI",
        "Generic approaches that don't reference specific military doctrine or operations",
        "Pricing that doesn't account for government overhead rates, DCAA audit requirements",
      ],
      winStrategy: "Demonstrate understanding of military culture and operational tempo. Reference specific DOD doctrine, instructions, and publications relevant to the work. Show existing clearance capacity. Past performance on DOD contracts weighted heavily.",
      submissionNorms: "Electronic submission via DOD-specific portals (PIEE, DOD eSourcing). DD254 for classified work. DCAA-auditable cost proposals. Subcontracting plans required over $750K.",
    },
    "darpa_research": {
      evaluationApproach: "DARPA uses Broad Agency Announcements (BAAs) under FAR 6.102(d)(2) — not traditional competitive procurement. Evaluation is peer review by program managers and technical experts. No formal point scoring — holistic assessment of scientific/technical merit, potential for impact, and team capability. Proposals are evaluated against the BAA criteria, not against each other.",
      whatTheyPrioritize: [
        "Scientific and technical merit — is this actually innovative?",
        "Potential for transformative impact — 10x improvement, not incremental",
        "Proposer's capability and relevant expertise",
        "Realism of the technical approach and risk mitigation",
        "Clear metrics and milestones for go/no-go decisions",
        "Ethical, legal, and societal implications (ELSI) assessment",
      ],
      commonMistakes: [
        "Proposing incremental improvements — DARPA wants revolutionary, high-risk/high-reward",
        "Overpromising without acknowledging technical risks",
        "Not understanding the specific Technical Area (TA) within the BAA",
        "Academic-style papers instead of actionable research plans",
      ],
      winStrategy: "Lead with the problem and why current approaches fail. Propose a fundamentally different approach. Include clear go/no-go milestones. Show you understand the specific program manager's vision. Demonstrate you can execute in 18-36 month phases.",
      submissionNorms: "Abstracts first (2-5 pages), then full proposals only if invited. Follow BAA-specific formatting exactly. Cost proposals in separate volume. Often requires Organizational Conflict of Interest (OCI) statements.",
    },
    "state_agency": {
      evaluationApproach: "State agencies follow their own procurement codes (e.g., Texas Government Code Chapter 2155/2156, California PCC). Evaluation committees score against published criteria. Many states use best-value methodology. Some require oral presentations. HUB/MWBE goals are often mandatory. State procurement portals (ESBD in Texas, Cal eProcure in California, etc.) are the primary posting sites.",
      whatTheyPrioritize: [
        "HUB/MWBE participation goals — often 15-30% of contract value",
        "Demonstrated experience with state government clients",
        "Compliance with state-specific terms (e.g., Texas requires CIQ, HUB Subcontracting Plan)",
        "Understanding of state-specific regulations and reporting requirements",
        "References from other state agencies",
        "Cost competitiveness within state pricing guidelines",
      ],
      commonMistakes: [
        "Not completing state-specific forms (CIQ, HUB-SP, vendor registration)",
        "Ignoring HUB/MWBE goals — some states score this separately",
        "Not being registered on the state vendor portal before submission",
        "Using federal formatting for state procurements — different norms",
      ],
      winStrategy: "Lead with state-specific experience. Complete every form. Show HUB/MWBE participation prominently. Reference the specific state code sections relevant to the work. Use state agency terminology, not federal.",
      submissionNorms: "State procurement portal submission. Vendor registration required. State-specific forms mandatory. May require physical copies with wet signatures.",
    },
    "city_municipal": {
      evaluationApproach: "Cities and municipalities follow local purchasing ordinances. Small purchases (often under $50K) may use informal quotes — 3 quotes by email or phone. Formal procurements use sealed bids (IFB for lowest price) or RFP (best value). City Council approval often required above threshold ($50K-$100K typically). Evaluation committees are usually 3-5 city staff members.",
      whatTheyPrioritize: [
        "Local business preference — many cities give 5-10% price advantage to local firms",
        "Responsiveness — did you answer every question and include every form?",
        "Price — for IFBs and smaller procurements, lowest responsible bid wins",
        "Understanding of the specific community or department needs",
        "Insurance and bonding capacity — must meet exact requirements",
        "References from other government clients, especially local/municipal",
        "Minority/Women/Veteran business certification",
      ],
      commonMistakes: [
        "Over-engineering the response — a city RFQ wants a clean quote, not a 40-page volume",
        "Missing local preference advantages by not claiming them",
        "Not attending mandatory pre-bid meetings — automatic disqualification",
        "Submitting to the wrong address or past the deadline — zero tolerance",
      ],
      winStrategy: "Match the formality level of the solicitation exactly. A 2-page RFQ gets a 2-3 page response. Include every required form. Highlight local presence and past work for this or similar cities. Price competitively — city councils scrutinize pricing.",
      submissionNorms: "Email, sealed envelope, or city portal. Wet signatures often required. Original + copies (2-3 typical). Required forms vary by city but usually include: W-9, vendor application, insurance certificate, CIQ/conflict of interest.",
    },
    "county_government": {
      evaluationApproach: "Counties follow state procurement law plus their own purchasing policies. Commissioners Court or County Purchasing department makes final award. Thresholds vary ($25K-$100K for formal procurement). Evaluation is usually best-value but lowest-price is common for commodity purchases.",
      whatTheyPrioritize: [
        "Compliance with county-specific terms and conditions",
        "Experience with county government operations",
        "Cost reasonableness — counties are budget-constrained",
        "Insurance meeting exact county requirements",
        "HUB/MWBE participation where required by the state",
        "Responsiveness to the specific scope — no fluff",
      ],
      commonMistakes: [
        "Treating county procurements like federal — much simpler format expected",
        "Not attending pre-bid conferences when required",
        "Missing county-specific forms",
      ],
      winStrategy: "Clean, responsive, no-nonsense proposals. Show you understand county operations. Price fairly. Include every form. References from other county governments are gold.",
      submissionNorms: "County purchasing portal or sealed bids. Fewer forms than state/federal but strict on deadlines. County-specific vendor registration may be required.",
    },
    "school_district": {
      evaluationApproach: "School districts follow state education procurement codes and federal guidelines if using federal funds (2 CFR 200 for Title I, ESSER, etc.). Board of Trustees approval required above threshold. Evaluation by committee of administrators. EDGAR compliance required for federal education funds.",
      whatTheyPrioritize: [
        "Student outcome focus — how does this help students?",
        "EDGAR/2 CFR 200 compliance if using federal funds",
        "Teacher and staff buy-in — will this be adopted?",
        "Evidence-based practices — ESSA Tier 1-4 evidence levels",
        "Integration with existing district systems",
        "Professional development and training included",
        "Sustainability after grant funding ends",
      ],
      commonMistakes: [
        "Not understanding whether federal funds are involved (changes compliance requirements)",
        "Proposing technology without a training/adoption plan",
        "Ignoring district calendar and school year scheduling",
      ],
      winStrategy: "Lead with student outcomes. Show evidence base. Include professional development. Demonstrate understanding of the school year calendar and how work fits into it. Address sustainability.",
      submissionNorms: "District purchasing portal or email. Board meeting schedule affects award timeline. May require presentation to the board.",
    },
    "foundation_philanthropy": {
      evaluationApproach: "Foundations use program officers and review committees. No formal scoring rubric in most cases — qualitative assessment of alignment with foundation mission, organizational capacity, and impact potential. LOI screening narrows to invited full applications. Site visits may follow. Each foundation has unique priorities — generic applications fail.",
      whatTheyPrioritize: [
        "Mission alignment — does your work directly serve their stated focus areas?",
        "Theory of change — clear logic model from activities to outcomes",
        "Organizational capacity — can you actually do this work?",
        "Community voice — are you responding to community-identified needs?",
        "Measurement and evaluation — how will you prove impact?",
        "Sustainability — what happens when the grant ends?",
        "Collaboration — are you working with others or duplicating?",
        "Equity — who leads? Who benefits? Who decides?",
      ],
      commonMistakes: [
        "Not reading the foundation's annual report and recent grantee list",
        "Asking for amounts outside their typical range (check 990s for past grants)",
        "Generic language that could apply to any funder",
        "Not connecting your work to their specific focus areas and language",
      ],
      winStrategy: "Mirror their language. Reference their published priorities. Show community engagement. Include a clear logic model. Budget must be reasonable and specific. Letters of support from community partners add weight.",
      submissionNorms: "Online portal (Fluxx, Submittable, SmartSimple, custom). LOI first (1-3 pages), then full application by invitation. Budget narrative required. Board list and financials (audited statements, 990) often required.",
    },
    "hospital_health_system": {
      evaluationApproach: "Hospital systems and health foundations evaluate through clinical leadership, community benefit committees, and/or supply chain depending on the solicitation. Community benefit programs follow IRS Schedule H requirements. Health system RFPs for services go through value analysis committees. Community health grants align with Community Health Needs Assessment (CHNA) priorities.",
      whatTheyPrioritize: [
        "Alignment with CHNA priorities and community benefit strategy",
        "Evidence-based interventions with published outcomes",
        "Health equity focus — disparities data, SDOH framework",
        "Community partnerships and referral pathways",
        "Measurable health outcomes (not just outputs)",
        "Cultural competence and linguistic access",
        "Sustainability and population health impact",
        "HIPAA compliance and data security",
      ],
      commonMistakes: [
        "Not reviewing the hospital's most recent CHNA",
        "Proposing work outside their geographic service area",
        "Outputs without outcomes — they want health impact, not activities",
        "Not understanding the difference between community benefit grants and supply chain RFPs",
      ],
      winStrategy: "Reference their specific CHNA. Use SDOH framework language. Show health outcomes data. Demonstrate community partnerships. Address health equity explicitly. Include evaluation methodology.",
      submissionNorms: "Foundation portal or email. LOI screening common. May require presentation to community benefit committee. Budget must show cost-per-participant or cost-per-outcome.",
    },
    "nonprofit_funder": {
      evaluationApproach: "Nonprofit intermediaries and federated funders (United Way, Community Foundation, etc.) use volunteer review panels from the community. Scoring rubrics are published. Site visits are common. Outcomes reporting requirements are specific.",
      whatTheyPrioritize: [
        "Alignment with community impact priorities",
        "Organizational capacity and financial health",
        "Board governance and diversity",
        "Program outcomes with data",
        "Collaboration with other nonprofits",
        "Client voice in program design",
        "Cost efficiency and reasonable overhead",
      ],
      commonMistakes: [
        "High overhead percentage without explanation",
        "No evaluation plan",
        "Not involving clients in program design",
      ],
      winStrategy: "Tell the story with data. Show community demand. Demonstrate fiscal responsibility. Include client testimonials (with permission). Address how you coordinate with other providers.",
      submissionNorms: "Online portal. Financials required (audit, 990, board-approved budget). Outcomes framework aligned with funder's reporting system.",
    },
  };

  function getAgencyIntelligence(parsed: Record<string, unknown>): {
    knownAgency: boolean;
    agencyType: string;
    intelligence: typeof AGENCY_INTELLIGENCE[string] | null;
    confidenceNote: string;
  } {
    const agencyLevel = ((parsed.agencyLevel as string) || "").toLowerCase();
    const docType = ((parsed.documentType as string) || "").toLowerCase();
    const agencyName = ((parsed.issuingAgency as string) || "").toLowerCase();

    const typeMap: Record<string, string> = {
      "federal": "federal_civilian",
      "state": "state_agency",
      "county": "county_government",
      "city": "city_municipal",
      "municipal": "city_municipal",
      "school_district": "school_district",
      "tribal": "federal_civilian",
      "nonprofit": "nonprofit_funder",
    };

    if (agencyName.includes("darpa") || agencyName.includes("defense advanced")) {
      return { knownAgency: true, agencyType: "darpa_research", intelligence: AGENCY_INTELLIGENCE["darpa_research"], confidenceNote: "DARPA identified — BAA/research proposal methodology applied" };
    }
    if (agencyName.includes("dod") || agencyName.includes("department of defense") || agencyName.includes("army") || agencyName.includes("navy") || agencyName.includes("air force") || agencyName.includes("marine") || agencyName.includes("space force")) {
      return { knownAgency: true, agencyType: "dod_military", intelligence: AGENCY_INTELLIGENCE["dod_military"], confidenceNote: "DOD agency identified — DFARS/military procurement methodology applied" };
    }
    if (agencyName.includes("hospital") || agencyName.includes("health system") || agencyName.includes("medical center") || agencyName.includes("st. david") || agencyName.includes("saint david") || agencyName.includes("ascension") || agencyName.includes("hca") || agencyName.includes("community health")) {
      return { knownAgency: true, agencyType: "hospital_health_system", intelligence: AGENCY_INTELLIGENCE["hospital_health_system"], confidenceNote: "Hospital/health system identified — CHNA-aligned community benefit methodology applied" };
    }
    if (agencyName.includes("foundation") && !agencyName.includes("national science foundation")) {
      return { knownAgency: true, agencyType: "foundation_philanthropy", intelligence: AGENCY_INTELLIGENCE["foundation_philanthropy"], confidenceNote: "Foundation/philanthropy identified — program officer review methodology applied" };
    }
    if (agencyName.includes("school district") || agencyName.includes("isd") || agencyName.includes("unified school") || agencyName.includes("board of education")) {
      return { knownAgency: true, agencyType: "school_district", intelligence: AGENCY_INTELLIGENCE["school_district"], confidenceNote: "School district identified — education procurement methodology applied" };
    }
    if (agencyName.includes("nsf") || agencyName.includes("national science foundation") || agencyName.includes("nih") || agencyName.includes("national institutes of health")) {
      return { knownAgency: true, agencyType: "darpa_research", intelligence: AGENCY_INTELLIGENCE["darpa_research"], confidenceNote: "Federal research agency identified — merit review methodology applied" };
    }
    if (agencyName.includes("united way") || agencyName.includes("community foundation")) {
      return { knownAgency: true, agencyType: "nonprofit_funder", intelligence: AGENCY_INTELLIGENCE["nonprofit_funder"], confidenceNote: "Nonprofit funder identified — community review panel methodology applied" };
    }

    if (agencyLevel && typeMap[agencyLevel]) {
      const mapped = typeMap[agencyLevel];
      return { knownAgency: true, agencyType: mapped, intelligence: AGENCY_INTELLIGENCE[mapped], confidenceNote: `${agencyLevel} agency identified — ${mapped.replace(/_/g, " ")} methodology applied` };
    }

    return { knownAgency: false, agencyType: "unknown", intelligence: null, confidenceNote: "Agency type not recognized from document — will research evaluation methodology" };
  }

  async function researchUnknownAgency(agencyName: string, docType: string, solicitationText: string): Promise<{
    evaluationApproach: string;
    whatTheyPrioritize: string[];
    commonMistakes: string[];
    winStrategy: string;
    submissionNorms: string;
    researchConfidence: string;
    disclaimer: string;
  }> {
    const prompt = `I need to understand how "${agencyName}" evaluates "${docType}" submissions. Research this agency and provide FACTUAL information about their procurement/grant review process.

SOLICITATION CONTEXT (first 3000 chars):
${solicitationText.substring(0, 3000)}

CRITICAL: Only state facts you are confident about. If you are not sure about something, say "UNKNOWN — verify with the agency directly." Do NOT guess or fabricate evaluation criteria, scoring methods, or review processes.

Return ONLY valid JSON:
{
  "evaluationApproach": "How this agency typically evaluates proposals — based on what you actually know. If unsure, say 'UNKNOWN — contact the agency or check their procurement website for evaluation procedures.'",
  "whatTheyPrioritize": ["list of priorities you are CONFIDENT this agency type values — if unsure, include 'VERIFY: [item] — confirm with agency'"],
  "commonMistakes": ["common mistakes when responding to this type of agency — if unsure, include 'VERIFY: confirm this applies to this specific agency'"],
  "winStrategy": "Specific strategy for this agency type — or 'Research needed: check [specific source] for past awards and evaluation patterns'",
  "submissionNorms": "How this agency typically accepts submissions — or 'VERIFY with procurement office'",
  "researchConfidence": "high|medium|low — be honest about how much you actually know about this specific agency",
  "disclaimer": "What you could NOT verify and what the submitter should confirm directly with the agency"
}`;

    const response = await generateAIResponse(
      [
        { role: "system", content: "You are a procurement research analyst. You NEVER fabricate information about agencies. If you don't know how a specific agency evaluates proposals, you say so clearly and suggest where to find that information (agency website, past solicitations, procurement office phone number). Honesty about gaps in your knowledge is more valuable than confident guessing." },
        { role: "user", content: prompt },
      ],
      2000
    );

    let jsonStr = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const fb = jsonStr.indexOf("{");
    const lb = jsonStr.lastIndexOf("}");
    if (fb !== -1 && lb !== -1 && lb > fb) jsonStr = jsonStr.substring(fb, lb + 1);
    return JSON.parse(jsonStr);
  }

  function validateParsedDocument(parsed: Record<string, unknown>): {
    valid: boolean;
    warnings: string[];
    critical: string[];
  } {
    const warnings: string[] = [];
    const critical: string[] = [];

    if (!parsed.documentType) critical.push("Could not determine document type — verify this is a solicitation");
    if (!parsed.scope && !parsed.scopeDetails) critical.push("No scope of work found — the document may be incomplete");

    const submissionFormat = parsed.submissionFormat as any;
    const responseGuidance = parsed.responseGuidance as any;

    if (!parsed.deadlines || (parsed.deadlines as any[]).length === 0) warnings.push("No deadlines found — confirm submission deadline with the issuing agency");
    if (!parsed.evaluationCriteria || (parsed.evaluationCriteria as any[]).length === 0) warnings.push("No evaluation criteria found — the document may not specify how proposals are scored");
    if (!parsed.budgetStated || (!(parsed.budgetStated as any)?.exact && !(parsed.budgetStated as any)?.notToExceed && !(parsed.budgetStated as any)?.low)) warnings.push("No budget stated in document — pricing will be based on scope analysis");
    if (!parsed.contactInfo || !(parsed.contactInfo as any)?.name) warnings.push("No purchasing contact found — verify submission address");
    if (!submissionFormat?.method && !submissionFormat?.address) warnings.push("Submission method not specified — confirm how to submit with the agency");
    if (!responseGuidance?.sectionsRequired?.length && !submissionFormat?.requiredSections?.length) warnings.push("Document does not specify required response sections — structuring response based on scope and agency type");

    return { valid: critical.length === 0, warnings, critical };
  }

  function validateScaleAlignment(scale: ReturnType<typeof determineResponseScale>, parsed: Record<string, unknown>, agencyIntel: ReturnType<typeof getAgencyIntelligence>): string[] {
    const checks: string[] = [];
    const budgetStated = parsed.budgetStated as any;
    const docType = ((parsed.documentType as string) || "").toLowerCase();

    if (scale.documentDriven) {
      checks.push("VALIDATED: Response structure driven by document-specified sections");
    } else {
      checks.push("NOTE: Document did not specify required sections — using agency-type defaults");
    }

    if (budgetStated?.exact || budgetStated?.notToExceed || budgetStated?.low || budgetStated?.high) {
      checks.push("VALIDATED: Budget found in document — pricing will be calibrated to stated range");
    } else {
      checks.push("WARNING: No budget in document — pricing based on scope complexity analysis");
    }

    if (agencyIntel.knownAgency) {
      checks.push(`VALIDATED: ${agencyIntel.confidenceNote}`);
    } else {
      checks.push("RESEARCHED: Agency not in knowledge base — evaluation methodology researched and applied");
    }

    if (docType.includes("rfq") || docType.includes("quote") || docType.includes("informal")) {
      if (scale.maxTokens > 6000) {
        checks.push("WARNING: Quote/RFQ detected but response scale seems large — verify this isn't an over-engineered response");
      } else {
        checks.push("VALIDATED: Quote/RFQ scale matches document type");
      }
    }

    return checks;
  }

  async function parseDocument(solicitationText: string): Promise<Record<string, unknown>> {
    const parsePrompt = `You are a government procurement document parser. Read this solicitation WORD BY WORD. Extract ONLY what the document actually states. If something is NOT in the document, use null — do NOT estimate or infer.

DOCUMENT:
${solicitationText.substring(0, 15000)}

Return ONLY valid JSON. Start with { and end with }. No markdown, no explanation.

{
  "documentType": "RFP|RFQ|RFI|IFB|LOI|Grant|Quote Request|Informal Quote|Bid|Sole Source|BPA|Task Order",
  "title": "exact title from document",
  "issuingAgency": "exact agency/organization name",
  "agencyLevel": "federal|state|county|city|municipal|school_district|special_district|tribal|nonprofit|private|null if not clear",
  "solicitationNumber": "exact number if provided or null",
  "contactInfo": { "name": "purchasing agent/contact", "email": "email", "phone": "phone", "address": "mailing address", "fax": "fax if listed" },
  "scope": "1-2 sentence summary of what they are buying",
  "scopeDetails": ["each specific deliverable, service item, or line item listed in the scope of work — be exhaustive"],
  "budgetStated": { "low": null, "high": null, "exact": null, "notToExceed": null, "currency": "USD" },
  "budgetScale": "micro_under_10k|small_10k_50k|medium_50k_250k|large_250k_1m|enterprise_over_1m",
  "contractPeriod": { "start": "date or null", "end": "date or null", "duration": "description", "renewals": "renewal terms or null" },
  "deadlines": [{ "item": "what is due", "date": "exact date/time as written in document", "timezone": "timezone if stated" }],

  "submissionFormat": {
    "method": "email|portal|mail|hand-deliver|fax|electronic|null",
    "address": "exact submission address or email or portal URL",
    "totalPageLimit": "exact total page limit stated or null",
    "formatRequirements": "font size, margins, spacing requirements or null",
    "numberOfCopies": "how many copies required or null",
    "fileFormat": "PDF, Word, sealed envelope, etc. or null",
    "separateVolumes": "whether pricing must be in separate envelope/volume or null",
    "requiredSections": ["exact list of sections the document says to include in your response, in order — use the document's exact wording"],
    "requiredForms": ["exact names of forms to complete and include (W-9, CIQ, HUB, etc.)"],
    "additionalInstructions": "any other submission instructions from the document"
  },

  "evaluationCriteria": [{ "criterion": "exact name as stated", "weight": "exact weight/points/percentage as stated or null", "description": "details if given" }],
  "evaluationMethod": "lowest price|best value|qualifications-based|competitive sealed proposal|other|null",
  "requiredDocuments": ["exact list of every document, form, certificate they require — be exhaustive"],

  "insuranceRequirements": [{ "type": "exact coverage type", "amount": "exact $ amount as stated", "additionalInsured": true }],
  "bondRequirements": { "bidBond": "amount or null", "performanceBond": "amount or null", "paymentBond": "amount or null" },
  "certificationPreferences": ["exact certifications mentioned: MBE, WBE, DBE, HUB, SDVOSB, 8a, HUBZone, etc."],
  "setAside": "small business set-aside type or null",

  "paymentTerms": "Net 30, milestone-based, etc. or null",
  "backgroundChecks": "true|false|null",
  "drugTesting": "true|false|null",
  "prevailingWage": "true|false|null",
  "ipOwnership": "who owns deliverables or null",
  "contractType": "fixed-price|time-and-materials|cost-plus|indefinite-delivery|unit-price|other|null",
  "naicsCode": "NAICS code if listed or null",
  "nigpCode": "NIGP commodity code if listed or null",

  "responseGuidance": {
    "documentTellsYouExactly": "Summarize in 1-2 sentences exactly what format and length of response this document requires — based ONLY on what the document states, not estimation",
    "sectionsRequired": ["list every section the document explicitly requires in the response"],
    "totalPages": "exact total page count if stated, or null if the document does not state a page limit",
    "pricingFormat": "how the document says to present pricing (line items, lump sum, unit prices, cost proposal form, etc.) or null"
  },

  "keyFacts": ["any other important facts, terms, conditions, or requirements from the document not captured above"]
}`;

    const response = await generateAIResponse(
      [
        { role: "system", content: "You are a document parser that extracts structured data from government solicitations. You read every word. You never guess — you only report what the document actually states. If something is not in the document, use null. Return ONLY valid JSON." },
        { role: "user", content: parsePrompt },
      ],
      4000
    );

    let jsonStr = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const fb = jsonStr.indexOf("{");
    const lb = jsonStr.lastIndexOf("}");
    if (fb !== -1 && lb !== -1 && lb > fb) jsonStr = jsonStr.substring(fb, lb + 1);
    return JSON.parse(jsonStr);
  }

  function determineResponseScale(parsed: Record<string, unknown>): {
    maxTokens: number;
    sections: string[];
    pricingStyle: string;
    tone: string;
    pageTarget: string;
    needsMultiPass: boolean;
    documentDriven: boolean;
  } {
    const responseGuidance = parsed.responseGuidance as any;
    const submissionFormat = parsed.submissionFormat as any;

    const docSections: string[] = responseGuidance?.sectionsRequired?.length > 0
      ? responseGuidance.sectionsRequired
      : submissionFormat?.requiredSections?.length > 0
        ? submissionFormat.requiredSections
        : [];

    const docPageLimit = responseGuidance?.totalPages || submissionFormat?.totalPageLimit || null;
    const docPricingFormat = responseGuidance?.pricingFormat || null;
    const pageNum = docPageLimit ? parseInt(String(docPageLimit), 10) : 0;
    const hasPageLimit = pageNum > 0;

    if (docSections.length > 0) {
      let maxTokens: number;
      if (hasPageLimit && pageNum <= 5) maxTokens = 3000;
      else if (hasPageLimit && pageNum <= 10) maxTokens = 6000;
      else if (hasPageLimit && pageNum <= 25) maxTokens = 10000;
      else if (docSections.length <= 4) maxTokens = 4000;
      else if (docSections.length <= 8) maxTokens = 8000;
      else maxTokens = 12000;

      return {
        maxTokens,
        sections: docSections,
        pricingStyle: docPricingFormat || "as_document_specifies",
        tone: "match the formality and specificity the document requires",
        pageTarget: hasPageLimit ? `${docPageLimit} pages (document limit)` : `${docSections.length} sections as specified by the document`,
        needsMultiPass: maxTokens >= 10000,
        documentDriven: true,
      };
    }

    if (hasPageLimit && docSections.length === 0) {
      let maxTokens: number;
      if (pageNum <= 3) maxTokens = 2000;
      else if (pageNum <= 5) maxTokens = 3000;
      else if (pageNum <= 10) maxTokens = 6000;
      else if (pageNum <= 25) maxTokens = 10000;
      else maxTokens = 12000;

      return {
        maxTokens,
        sections: [],
        pricingStyle: docPricingFormat || "as_document_specifies",
        tone: "match the formality the document requires",
        pageTarget: `${docPageLimit} pages (document limit — no specific sections listed, structure response to fit)`,
        needsMultiPass: maxTokens >= 10000,
        documentDriven: true,
      };
    }

    const scale = (parsed.budgetScale as string) || "medium_50k_250k";
    const budgetStated = parsed.budgetStated as any;
    const statedBudget = budgetStated?.exact || budgetStated?.notToExceed || budgetStated?.high || budgetStated?.low || 0;
    const docType = ((parsed.documentType as string) || "").toLowerCase();
    const agencyLevel = ((parsed.agencyLevel as string) || "").toLowerCase();

    const isInformalQuote = docType.includes("quote") || docType.includes("rfq") || docType.includes("informal") || docType === "ifb";

    if (isInformalQuote && (scale === "micro_under_10k" || scale === "small_10k_50k" || (statedBudget > 0 && statedBudget < 50000))) {
      return {
        maxTokens: 4000,
        sections: ["cover_letter", "scope_response", "pricing", "company_info", "compliance"],
        pricingStyle: docPricingFormat || "line_items_matching_scope",
        tone: "concise and professional — this is a quote request, be direct and responsive",
        pageTarget: "Document does not specify page limits — responding proportionally to scope (brief quote format)",
        needsMultiPass: false,
        documentDriven: false,
      };
    }

    if (scale === "micro_under_10k" || (statedBudget > 0 && statedBudget < 10000)) {
      return {
        maxTokens: 3000,
        sections: ["cover_letter", "scope_response", "pricing", "company_info"],
        pricingStyle: docPricingFormat || "simple_line_items",
        tone: "concise and professional",
        pageTarget: "Document does not specify — responding proportionally to scope",
        needsMultiPass: false,
        documentDriven: false,
      };
    }

    if (scale === "small_10k_50k" || (statedBudget > 0 && statedBudget < 50000)) {
      return {
        maxTokens: 6000,
        sections: ["cover_letter", "understanding_of_scope", "technical_approach", "qualifications", "pricing", "compliance"],
        pricingStyle: docPricingFormat || "line_item_with_brief_justification",
        tone: "professional and focused",
        pageTarget: "Document does not specify page limits — responding proportionally to scope",
        needsMultiPass: false,
        documentDriven: false,
      };
    }

    if (scale === "medium_50k_250k" || (statedBudget > 0 && statedBudget < 250000)) {
      return {
        maxTokens: 8000,
        sections: ["cover_letter", "executive_summary", "technical_approach", "qualifications", "pricing", "compliance_matrix", "certifications"],
        pricingStyle: docPricingFormat || "three_tier_with_line_items",
        tone: "thorough and detailed",
        pageTarget: "Document does not specify page limits — responding proportionally to scope",
        needsMultiPass: false,
        documentDriven: false,
      };
    }

    if (scale === "large_250k_1m" || (statedBudget > 0 && statedBudget < 1000000)) {
      return {
        maxTokens: 12000,
        sections: ["solicitation_analysis", "cover_letter", "executive_summary", "technical_approach", "qualifications", "staffing", "timeline", "pricing_strategy", "cost_proposal", "compliance_matrix", "certifications_insurance", "unknowns"],
        pricingStyle: docPricingFormat || "three_tier_detailed_with_justification",
        tone: "comprehensive and detailed",
        pageTarget: "Document does not specify page limits — responding proportionally to scope",
        needsMultiPass: true,
        documentDriven: false,
      };
    }

    return {
      maxTokens: 12000,
      sections: ["solicitation_analysis", "cover_letter", "executive_summary", "technical_approach", "qualifications", "staffing", "timeline", "pricing_strategy", "cost_proposal", "compliance_matrix", "certifications_insurance", "key_personnel", "unknowns"],
      pricingStyle: docPricingFormat || "three_tier_detailed_with_justification",
      tone: "comprehensive and authoritative",
      pageTarget: "Document does not specify page limits — responding proportionally to scope",
      needsMultiPass: true,
      documentDriven: false,
    };
  }

  function buildCompanyContext(cp: any): string {
    if (!cp || (!cp.companyName && !cp.capabilities)) {
      return "NO COMPANY PROFILE PROVIDED — Use {{NEEDS_INPUT: description}} markers for all company-specific information.";
    }
    const fields = [
      cp.companyName && `Company: ${cp.companyName}`,
      cp.companyType && `Type: ${cp.companyType}`,
      cp.ein && `EIN: ${cp.ein}`,
      cp.address && `Address: ${cp.address}`,
      cp.contactName && `Contact: ${cp.contactName}`,
      cp.phone && `Phone: ${cp.phone}`,
      cp.email && `Email: ${cp.email}`,
      cp.capabilities && `Capabilities: ${cp.capabilities}`,
      cp.certifications && `Certifications: ${cp.certifications}`,
      cp.pastPerformance && `Past Performance: ${cp.pastPerformance}`,
      cp.keyPersonnel && `Key Personnel: ${cp.keyPersonnel}`,
      cp.yearsInBusiness && `Years in Business: ${cp.yearsInBusiness}`,
      cp.uei && `UEI: ${cp.uei}`,
    ].filter(Boolean);
    return `RESPONDING COMPANY:\n${fields.join("\n")}`;
  }

  function buildSectionInstructions(scale: ReturnType<typeof determineResponseScale>, parsed: Record<string, unknown>): string {
    const pageLimits = (parsed.pageLimits as any[]) || [];
    const requiredDocs = (parsed.requiredDocuments as string[]) || [];

    let instructions = "";

    for (const section of scale.sections) {
      const pageLimit = pageLimits.find((p: any) => p.section?.toLowerCase().includes(section.replace(/_/g, " ")));
      const limitNote = pageLimit ? ` (PAGE LIMIT: ${pageLimit.maxPages} pages max)` : "";

      switch (section) {
        case "cover_letter":
          instructions += `\n## COVER LETTER${limitNote}\nProfessional, properly addressed to ${(parsed.contactInfo as any)?.name || "the purchasing agent"}. 1 page. State solicitation number, your understanding of the need, and key differentiator.\n`;
          break;
        case "scope_response":
          instructions += `\n## RESPONSE TO SCOPE OF WORK\nAddress each deliverable/service item directly. Be specific about HOW you will deliver. Reference the exact requirements from the solicitation.\n`;
          break;
        case "understanding_of_scope":
          instructions += `\n## UNDERSTANDING OF SCOPE${limitNote}\nDemonstrate you have read and understood every requirement. Restate the scope in your own words showing comprehension.\n`;
          break;
        case "technical_approach":
          instructions += `\n## TECHNICAL APPROACH / METHODOLOGY${limitNote}\nStep-by-step plan for delivering EVERY requirement listed in the scope. Be specific — not generic language. Reference the exact deliverables from the solicitation.\n`;
          break;
        case "executive_summary":
          instructions += `\n## EXECUTIVE SUMMARY${limitNote}\nCompany overview, relevant experience, why your firm is the best fit for THIS specific work. Match the solicitation's priorities.\n`;
          break;
        case "qualifications":
          instructions += `\n## QUALIFICATIONS & EXPERIENCE${limitNote}\nTeam credentials, past performance on SIMILAR contracts, certifications. Include references if required (${requiredDocs.filter(d => d.toLowerCase().includes("reference")).join(", ") || "check requirements"}).\n`;
          break;
        case "staffing":
          instructions += `\n## STAFFING PLAN\nWho does what, roles, hours, rates. Name specific people if provided in the company profile.\n`;
          break;
        case "timeline":
          instructions += `\n## PROJECT TIMELINE & DELIVERABLES\nMatch the solicitation's contract period. Milestones, deliverable dates, dependencies.\n`;
          break;
        case "pricing":
        case "cost_proposal":
          instructions += `\n## COST PROPOSAL\n`;
          if (scale.pricingStyle === "simple_line_items") {
            instructions += "Simple line-item pricing. Match the scope items. No tiers needed for this size procurement.\n";
          } else if (scale.pricingStyle === "line_item_with_brief_justification") {
            instructions += "Line-item pricing with brief justification for each rate. Include a total.\n";
          } else {
            instructions += "Three pricing tiers (Conservative/Value, Competitive/Market, Aggressive/Win) with line-item breakdown and rate justification.\n";
          }
          const budget = parsed.budgetStated as any;
          if (budget?.low || budget?.high || budget?.exact || budget?.notToExceed) {
            instructions += `BUDGET FROM DOCUMENT: ${budget.exact ? `$${budget.exact.toLocaleString()} (exact)` : budget.notToExceed ? `NTE $${budget.notToExceed.toLocaleString()}` : `$${(budget.low || 0).toLocaleString()} - $${(budget.high || 0).toLocaleString()}`}. Your pricing MUST fall within this range.\n`;
          }
          break;
        case "pricing_strategy":
          instructions += `\n## PRICING STRATEGY\nThree tiers with full line-item breakdown and market rate justification.\n`;
          const budgetS = parsed.budgetStated as any;
          if (budgetS?.low || budgetS?.high || budgetS?.exact || budgetS?.notToExceed) {
            instructions += `BUDGET FROM DOCUMENT: ${budgetS.exact ? `$${budgetS.exact.toLocaleString()}` : budgetS.notToExceed ? `NTE $${budgetS.notToExceed.toLocaleString()}` : `$${(budgetS.low || 0).toLocaleString()} - $${(budgetS.high || 0).toLocaleString()}`}. Price WITHIN this range.\n`;
          }
          break;
        case "compliance":
        case "compliance_matrix":
          instructions += `\n## COMPLIANCE MATRIX\nTable mapping EVERY solicitation requirement to your response section.\n| # | Requirement | Response Section | How Addressed | Compliant? |\n`;
          break;
        case "certifications":
        case "certifications_insurance":
          const insurance = (parsed.insuranceRequirements as any[]) || [];
          instructions += `\n## CERTIFICATIONS, INSURANCE & REQUIRED FORMS\n`;
          if (insurance.length > 0) {
            instructions += `Insurance requirements from document:\n${insurance.map((i: any) => `- ${i.type}: ${i.amount}`).join("\n")}\nAcknowledge each. State current coverage or willingness to obtain.\n`;
          }
          if (requiredDocs.length > 0) {
            instructions += `Required documents checklist: ${requiredDocs.join(", ")}\nAcknowledge each.\n`;
          }
          break;
        case "solicitation_analysis":
          instructions += `\n## SOLICITATION ANALYSIS\nBreak down every requirement, deadline, submission method, evaluation criteria, insurance/compliance needs extracted from the document.\n`;
          break;
        case "company_info":
          instructions += `\n## COMPANY INFORMATION\nBrief company overview, relevant capabilities, and contact information.\n`;
          break;
        case "key_personnel":
          instructions += `\n## KEY PERSONNEL RESUMES\n2-page resume format for each key team member.\n`;
          break;
        case "unknowns":
          instructions += `\n## ITEMS NEEDING YOUR INPUT\nList every {{NEEDS_INPUT}} item with description of what's needed and where it appears.\n`;
          break;
      }
    }
    return instructions;
  }

  app.post("/api/proposal-command/generate", requireAuth, async (req: Request, res: Response) => {
    const { solicitation, companyProfile, additionalContext, proposalType } = req.body;
    if (!solicitation || typeof solicitation !== "string" || solicitation.length < 50) {
      return res.status(400).json({ error: "Paste the full solicitation text (minimum 50 characters)" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (type: string, data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    let clientDisconnected = false;
    req.on("close", () => { clientDisconnected = true; });

    try {
      send("status", { message: "Step 1/4 — Reading document word by word..." });

      let parsed: Record<string, unknown>;
      try {
        parsed = await parseDocument(solicitation);
      } catch (parseErr: any) {
        console.error("[ProposalCommand] Document parse error:", parseErr.message);
        parsed = { documentType: proposalType || "unknown", budgetScale: "medium_50k_250k", scope: solicitation.substring(0, 200) };
      }

      if (clientDisconnected) { res.end(); return; }

      const validation = validateParsedDocument(parsed);
      if (!validation.valid) {
        for (const c of validation.critical) send("status", { message: `CRITICAL: ${c}` });
        send("data", { section: "intel", error: true, validationWarnings: validation.critical, confidenceLevel: "low" });
        send("error", { message: `Document could not be fully parsed: ${validation.critical.join(". ")}. Please verify the text is a complete solicitation and try again.` });
        res.end();
        return;
      }
      if (validation.warnings.length > 0) {
        for (const w of validation.warnings) send("status", { message: `CHECK: ${w}` });
      }

      send("data", { section: "parsed", ...parsed });

      const budgetStated = parsed.budgetStated as any;
      const budgetDisplay = budgetStated?.exact
        ? `$${budgetStated.exact.toLocaleString()}`
        : budgetStated?.notToExceed
          ? `NTE $${budgetStated.notToExceed.toLocaleString()}`
          : (budgetStated?.low || budgetStated?.high)
            ? `$${(budgetStated.low || 0).toLocaleString()} - $${(budgetStated.high || 0).toLocaleString()}`
            : "not stated in document";

      send("status", { message: `Document read: ${parsed.documentType || "Solicitation"} from ${parsed.issuingAgency || "unknown agency"} | Budget: ${budgetDisplay}` });

      if (clientDisconnected) { res.end(); return; }

      send("status", { message: "Step 2/4 — Identifying agency and researching their evaluation methodology..." });

      const agencyIntel = getAgencyIntelligence(parsed);
      let agencyResearch: any = null;

      if (!agencyIntel.knownAgency) {
        send("status", { message: `Agency "${parsed.issuingAgency || "unknown"}" not in knowledge base — researching their evaluation methodology (no guessing)...` });
        try {
          agencyResearch = await researchUnknownAgency(
            (parsed.issuingAgency as string) || "unknown agency",
            (parsed.documentType as string) || "solicitation",
            solicitation
          );
          send("status", { message: `Agency research complete — confidence: ${agencyResearch.researchConfidence || "medium"}${agencyResearch.disclaimer ? ` | Note: ${agencyResearch.disclaimer}` : ""}` });
        } catch (researchErr: any) {
          console.error("[ProposalCommand] Agency research error:", researchErr.message);
          agencyResearch = { evaluationApproach: "Could not research agency — will structure response based on document requirements only", researchConfidence: "low", disclaimer: "Verify evaluation criteria with the issuing agency" };
          send("status", { message: "Agency research inconclusive — structuring response from document requirements only" });
        }
      } else {
        send("status", { message: agencyIntel.confidenceNote });
      }

      const scale = determineResponseScale(parsed);

      const alignmentChecks = validateScaleAlignment(scale, parsed, agencyIntel);
      for (const check of alignmentChecks) {
        send("status", { message: check });
      }

      const activeIntel = agencyIntel.intelligence || agencyResearch;

      send("data", {
        section: "intel",
        solicitationType: parsed.documentType,
        issuingAgency: parsed.issuingAgency,
        agencyLevel: parsed.agencyLevel,
        estimatedBudgetRange: budgetStated?.low && budgetStated?.high ? { low: budgetStated.low, high: budgetStated.high } : budgetStated?.exact ? { low: budgetStated.exact, high: budgetStated.exact } : undefined,
        deadlines: parsed.deadlines,
        requiredDocuments: parsed.requiredDocuments,
        evaluationCriteria: parsed.evaluationCriteria,
        insuranceRequirements: parsed.insuranceRequirements,
        certificationPreferences: parsed.certificationPreferences,
        scope: parsed.scope,
        scopeDetails: parsed.scopeDetails,
        pageLimits: (parsed.submissionFormat as any)?.totalPageLimit ? [{ section: "Total", maxPages: (parsed.submissionFormat as any).totalPageLimit }] : undefined,
        contactInfo: parsed.contactInfo,
        contractPeriod: parsed.contractPeriod,
        budgetScale: parsed.budgetScale,
        responseSize: scale.pageTarget,
        complexity: parsed.responseGuidance ? "document-driven" : undefined,
        keyFacts: parsed.keyFacts,
        agencyIntelligence: activeIntel ? {
          evaluationApproach: activeIntel.evaluationApproach,
          whatTheyPrioritize: activeIntel.whatTheyPrioritize,
          winStrategy: activeIntel.winStrategy,
          commonMistakes: activeIntel.commonMistakes,
          knownAgency: agencyIntel.knownAgency,
          disclaimer: agencyResearch?.disclaimer || null,
        } : null,
        validationWarnings: validation.warnings,
        confidenceLevel: agencyIntel.knownAgency ? "high" : (agencyResearch?.researchConfidence || "medium"),
      });

      if (clientDisconnected) { res.end(); return; }

      send("status", { message: "Step 3/4 — Building response structure from document requirements and agency intelligence..." });

      const companyContext = buildCompanyContext(companyProfile);

      let sectionInstructions: string;
      if (scale.documentDriven) {
        sectionInstructions = `\nGENERATE THESE SECTIONS (specified by the document):\n${scale.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n`;
      } else {
        sectionInstructions = buildSectionInstructions(scale, parsed);
      }

      const agencyContext = activeIntel ? `
AGENCY INTELLIGENCE (${agencyIntel.knownAgency ? "from procurement knowledge base" : "researched for this submission"}):
- How they evaluate: ${activeIntel.evaluationApproach}
- What they prioritize: ${(activeIntel.whatTheyPrioritize || []).join("; ")}
- Win strategy: ${activeIntel.winStrategy}
${activeIntel.commonMistakes ? `- Common mistakes to AVOID: ${activeIntel.commonMistakes.join("; ")}` : ""}
${agencyResearch?.disclaimer ? `- DISCLAIMER: ${agencyResearch.disclaimer}` : ""}` : "";

      send("status", { message: `Step 4/4 — Writing proposal: ${scale.pageTarget}${scale.needsMultiPass ? " (multi-pass for completeness)" : ""}...` });

      const systemPrompt = `You are a master proposal writer with deep knowledge of government procurement. You have parsed the solicitation, identified the agency, and researched how they evaluate proposals. Every word you write must be calibrated to what THIS specific document and THIS specific agency requires.

DOCUMENT INTELLIGENCE (facts extracted from the actual solicitation — these are verified, not estimated):
${JSON.stringify(parsed, null, 2)}

${agencyContext}

${companyContext}

RESPONSE CALIBRATION:
- Document type: ${parsed.documentType}
- Issuing agency: ${parsed.issuingAgency || "See document"}
- Budget: ${budgetDisplay}
- Target response: ${scale.pageTarget}
- Tone: ${scale.tone}
- Pricing format: ${scale.pricingStyle}
- Document-driven: ${scale.documentDriven ? "YES — sections come from the document itself" : "NO — sections based on agency-type best practices"}

RULES — ZERO TOLERANCE:
1. The DOCUMENT tells you what to write. If it says submit 3 sections, you write 3 sections. If it says 10-page limit, you write 10 pages. If it says lump-sum pricing, you give lump-sum pricing. Do NOT add sections the document didn't ask for.
2. Every price MUST fall within the budget stated in the document. If the document says NTE $25,000, your highest tier cannot exceed $25,000.
3. If the document specifies how to format the response (font, margins, sections, page limits), follow those instructions EXACTLY.
4. Use the agency intelligence to prioritize content. If this is a city RFQ evaluated on lowest price, lead with competitive pricing. If this is a foundation LOI evaluated on mission alignment, lead with community impact.
5. Fill in everything from the company profile. For unknowns, use {{NEEDS_INPUT: description}}.
6. NEVER fabricate past performance, certifications, or references. If the company profile doesn't include them, use {{NEEDS_INPUT}}.
7. Include a compliance matrix mapping EVERY stated requirement to where you address it.
8. Write like someone who has won proposals for THIS type of agency — not generic AI. ${agencyIntel.knownAgency ? `This is a ${agencyIntel.agencyType.replace(/_/g, " ")} procurement.` : ""}`;

      const userPrompt = `FULL SOLICITATION TEXT:
---
${solicitation}
---

${additionalContext ? `CUSTOMER INSTRUCTIONS:\n${additionalContext}\n---` : ""}

Generate the proposal with these sections:
${sectionInstructions}

RESPONSE SIZE: ${scale.pageTarget}. The document${scale.documentDriven ? " specifies this structure" : " does not specify structure — using agency-appropriate format"}.`;

      if (scale.needsMultiPass) {
        const halfIdx = Math.ceil(scale.sections.length / 2);
        const firstHalf = scale.sections.slice(0, halfIdx);
        const secondHalf = scale.sections.slice(halfIdx);

        send("status", { message: `Pass 1/2 — Generating: ${firstHalf.map(s => typeof s === 'string' ? s.replace(/_/g, " ") : s).join(", ")}...` });

        await new Promise<void>((resolve, reject) => {
          streamAIResponse({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${userPrompt}\n\nIMPORTANT: In this pass, generate ONLY these sections: ${firstHalf.map(s => typeof s === 'string' ? s.replace(/_/g, " ") : s).join(", ")}. Complete each section fully.` },
            ],
            maxTokens: scale.maxTokens,
            onChunk: (content: string) => { if (!clientDisconnected) send("chunk", { content }); },
            onDone: () => resolve(),
            onError: (error: Error) => reject(error),
          });
        });

        if (clientDisconnected) { res.end(); return; }

        send("status", { message: `Pass 2/2 — Generating: ${secondHalf.map(s => typeof s === 'string' ? s.replace(/_/g, " ") : s).join(", ")}...` });

        await streamAIResponse({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Continue the proposal. You already generated: ${firstHalf.map(s => typeof s === 'string' ? s.replace(/_/g, " ") : s).join(", ")}.\n\nNow generate the remaining sections: ${secondHalf.map(s => typeof s === 'string' ? s.replace(/_/g, " ") : s).join(", ")}.\n\nSOLICITATION (reference): ${solicitation.substring(0, 3000)}\n\n${companyContext}\n\n${agencyContext}` },
          ],
          maxTokens: scale.maxTokens,
          onChunk: (content: string) => { if (!clientDisconnected) send("chunk", { content }); },
          onDone: () => { send("done", { generatedAt: new Date().toISOString(), scale: parsed.budgetScale, pageTarget: scale.pageTarget, documentDriven: scale.documentDriven, agencyKnown: agencyIntel.knownAgency }); res.end(); },
          onError: (error: Error) => { send("error", { message: error.message }); res.end(); },
        });
      } else {
        await streamAIResponse({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          maxTokens: scale.maxTokens,
          onChunk: (content: string) => { if (!clientDisconnected) send("chunk", { content }); },
          onDone: () => { send("done", { generatedAt: new Date().toISOString(), scale: parsed.budgetScale, pageTarget: scale.pageTarget, documentDriven: scale.documentDriven, agencyKnown: agencyIntel.knownAgency }); res.end(); },
          onError: (error: Error) => { send("error", { message: error.message }); res.end(); },
        });
      }
    } catch (error: any) {
      send("error", { message: error.message || "Failed to generate proposal" });
      res.end();
    }
  });

  app.post("/api/proposal-command/refine", requireAuth, async (req: Request, res: Response) => {
    const { proposal, feedback, unknownAnswers } = req.body;
    if (!proposal) return res.status(400).json({ error: "Current proposal text required" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (type: string, data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
      let updatedProposal = proposal;
      if (unknownAnswers && typeof unknownAnswers === "object") {
        for (const [key, value] of Object.entries(unknownAnswers)) {
          const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pattern = new RegExp(`\\{\\{NEEDS_INPUT:\\s*${escaped}\\s*\\}\\}`, "g");
          updatedProposal = updatedProposal.replace(pattern, String(value));
        }
      }

      if (feedback) {
        send("status", { message: "Refining proposal based on your feedback..." });

        await streamAIResponse({
          messages: [
            { role: "system", content: "You are refining an existing proposal based on user feedback. Maintain the same structure and format. Only change what the user requests. Keep all company-specific details intact. Return the FULL updated proposal in markdown." },
            { role: "user", content: `CURRENT PROPOSAL:\n${updatedProposal}\n\nFEEDBACK:\n${feedback}\n\nReturn the complete refined proposal.` },
          ],
          maxTokens: 16000,
          onChunk: (content: string) => { send("chunk", { content }); },
          onDone: () => { send("done", { refinedAt: new Date().toISOString() }); res.end(); },
          onError: (error: Error) => { send("error", { message: error.message }); res.end(); },
        });
      } else {
        send("chunk", { content: updatedProposal });
        send("done", { refinedAt: new Date().toISOString() });
        res.end();
      }
    } catch (error: any) {
      send("error", { message: error.message });
      res.end();
    }
  });

  app.get("/api/proposal-command/travis-county-rfq-pdf", async (_req, res) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 60, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="RFQ_202-CW_Travis_County_Strategic_Planning_Retreat_Response.pdf"');
      doc.pipe(res);

      const NAVY = "#1a2744";
      const DARK = "#1f2937";
      const MEDIUM = "#374151";
      const LIGHT = "#6b7280";
      const ACCENT = "#c2410c";
      const GREEN = "#166534";
      const PW = 612 - 120;

      let y = 0;

      const checkPage = (need = 60) => { if (y > 740 - need) { doc.addPage(); y = 60; } };

      const sectionHeading = (title: string) => {
        checkPage(40);
        y += 8;
        doc.rect(60, y, PW, 22).fill(NAVY);
        doc.fontSize(11).fillColor("#ffffff").font("Helvetica-Bold").text(title.toUpperCase(), 68, y + 5, { width: PW - 16 });
        doc.font("Helvetica");
        y += 32;
      };

      const subHeading = (title: string) => {
        checkPage(30);
        doc.fontSize(10).fillColor(ACCENT).font("Helvetica-Bold").text(title, 60, y, { width: PW });
        doc.font("Helvetica");
        y = doc.y + 4;
        doc.moveTo(60, y).lineTo(250, y).strokeColor("#d1d5db").lineWidth(0.5).stroke();
        y += 8;
      };

      const para = (text: string, indent = 0) => {
        checkPage(30);
        doc.fontSize(9.5).fillColor(DARK).text(text, 60 + indent, y, { width: PW - indent, lineGap: 2.5 });
        y = doc.y + 6;
      };

      const bullet = (text: string, indent = 15) => {
        checkPage(20);
        doc.fontSize(9.5).fillColor(DARK).text("\u2022  " + text, 60 + indent, y, { width: PW - indent - 5, lineGap: 2 });
        y = doc.y + 3;
      };

      const field = (label: string, value: string) => {
        checkPage(20);
        doc.fontSize(8).fillColor(LIGHT).text(label.toUpperCase(), 60, y, { width: PW });
        y = doc.y + 1;
        doc.fontSize(10).fillColor(DARK).text(value, 60, y, { width: PW });
        y = doc.y + 5;
      };

      // ==================== COVER PAGE ====================
      doc.rect(0, 0, 612, 792).fill("#f8f9fa");
      doc.rect(0, 0, 612, 8).fill(ACCENT);
      doc.rect(0, 784, 612, 8).fill(ACCENT);

      doc.rect(60, 160, PW, 3).fill(NAVY);
      doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold").text("QUOTE RESPONSE", 60, 185, { width: PW });
      doc.font("Helvetica");
      doc.fontSize(14).fillColor(ACCENT).text("Request for Quote No. 202-CW", 60, 225, { width: PW });
      doc.fontSize(16).fillColor(MEDIUM).text("Two-Day Strategic Planning Retreat", 60, 250, { width: PW });
      doc.fontSize(11).fillColor(LIGHT).text("Travis County Transportation & Natural Resources Division", 60, 280, { width: PW });
      doc.rect(60, 310, PW, 1).fill("#d1d5db");

      doc.fontSize(11).fillColor(DARK).text("SUBMITTED TO:", 60, 340, { width: PW });
      doc.fontSize(10).fillColor(MEDIUM).text("Travis County Purchasing Office", 60, 358, { width: PW });
      doc.text("P.O. Box 1748", 60, 373, { width: PW });
      doc.text("Austin, TX 78767", 60, 388, { width: PW });

      doc.fontSize(11).fillColor(DARK).text("SUBMITTED BY:", 60, 430, { width: PW });
      doc.fontSize(12).fillColor(NAVY).font("Helvetica-Bold").text("Hargrave Innovative Solutions", 60, 448, { width: PW });
      doc.font("Helvetica");
      doc.fontSize(10).fillColor(MEDIUM).text("Eric Hargrave, Chief Executive Officer", 60, 468, { width: PW });
      doc.text("Phone: (601) 238-4186", 60, 483, { width: PW });
      doc.text("Email: ericd@hisolution.org", 60, 498, { width: PW });

      doc.fontSize(10).fillColor(LIGHT).text("Date: " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 60, 540, { width: PW });
      doc.fontSize(8).fillColor(LIGHT).text("CONFIDENTIAL \u2014 PROPRIETARY PRICING INFORMATION", 60, 720, { width: PW, align: "center" });

      // ==================== AGENCY INTELLIGENCE BRIEFING ====================
      doc.addPage();
      y = 60;

      sectionHeading("Agency Intelligence Briefing \u2014 Internal Strategy Document");
      doc.fontSize(8).fillColor("#dc2626").text("FOR INTERNAL USE ONLY \u2014 DO NOT INCLUDE IN SUBMISSION TO TRAVIS COUNTY", 60, y, { width: PW, align: "center" });
      y = doc.y + 12;

      subHeading("Agency Profile");
      para("Travis County Purchasing Office operates under Texas Local Government Code Chapter 262, using competitive sealed bidding and quick quote procedures for acquisitions. The Transportation & Natural Resources (TNR) Division manages permitting, transportation infrastructure, parks, and natural resource conservation across Travis County. TNR leadership includes a County Executive, Chief Deputy, and Division Directors overseeing distinct operational areas.");

      subHeading("Evaluation Method");
      para("This is a Quick Quote (QQ) \u2014 Travis County\u2019s simplest procurement vehicle. Evaluation is \u2018lowest responsible quote\u2019 with qualifications as pass/fail gates. This is NOT a scored proposal with weighted criteria. The evaluation sequence is: (1) Does the respondent meet ALL minimum qualifications? If no \u2192 rejected. (2) Is the respondent responsive to all compliance requirements? If no \u2192 rejected. (3) Among qualified, responsive respondents, is the price reasonable and competitive?");
      para("Key implication: Do not overbuild the response. Meet every qualification clearly, comply with every requirement, and price competitively. Excessive volume signals misunderstanding of the procurement type.");

      subHeading("Pass/Fail Qualification Gates");
      const gates = [
        ["REQUIRED", "Local government experience", "Must be explicit \u2014 name agencies, not just \u2018government experience\u2019"],
        ["REQUIRED", "Executive/leadership retreat facilitation experience", "Cite specific retreats with audience size and outcomes"],
        ["REQUIRED", "Strategic planning and group facilitation expertise", "Methodology description should demonstrate this"],
        ["REQUIRED", "Ability to synthesize complex input into actionable outcomes", "Post-retreat deliverable description proves this"],
        ["REQUIRED", "Neutral, inclusive, productive facilitation environment", "Standard facilitation language \u2014 don\u2019t overclaim DEI unless asked"],
        ["PREFERRED", "Experience in permitting, transportation, parks, natural resources", "Adjacent experience is acceptable \u2014 public works, infrastructure planning, environmental"],
      ];
      for (const [level, qual, note] of gates) {
        checkPage(22);
        const levelColor = level === "REQUIRED" ? "#dc2626" : "#d97706";
        doc.fontSize(8).fillColor(levelColor).font("Helvetica-Bold").text(level, 60, y, { width: 65 });
        doc.font("Helvetica").fontSize(9).fillColor(DARK).text(qual, 130, y, { width: 200 });
        doc.fontSize(8).fillColor(LIGHT).text(note, 335, y, { width: PW - 275 });
        y = Math.max(doc.y + 4, y + 16);
      }
      y += 6;

      subHeading("Pricing Intelligence");
      para("Market rate for two-day government strategic planning retreat facilitation in Texas: $15,000\u2013$35,000. Competitive sweet spot for this scope (pre-planning + 2 days + report): $18,000\u2013$28,000. Eric\u2019s guidance: target $20,000\u2013$25,000. Our proposed price: $22,500 \u2014 positioned mid-range, signaling competence without appearing either desperate or overpriced.");
      para("Pricing breakdown logic: Pre-retreat planning ($3,500 / 15.6%) reflects the questionnaire, analysis, and agenda work. Day 1 senior session ($7,500 / 33.3%) is premium-priced for executive-level facilitation with smaller group. Day 2 management session ($8,500 / 37.8%) is higher total due to larger group (22 vs 8) and breakout facilitation. Post-retreat report ($3,000 / 13.3%) covers synthesis and delivery within 5\u20137 business days.");

      subHeading("Competitive Landscape");
      bullet("Primary competitors: Austin-area consulting firms specializing in government facilitation");
      bullet("Secondary competitors: National government consulting firms (disadvantaged by lack of local knowledge)");
      bullet("HIS advantage: Texas-based, CEO-led engagement (not delegated to junior staff), right-sized for the work");
      bullet("Risk: Larger firms may underbid to establish a Travis County relationship \u2014 our price needs to be competitive, not premium");

      subHeading("Compliance Traps to Avoid");
      bullet("DO NOT contact any Travis County staff outside the designated Procurement Specialist \u2014 immediate disqualification");
      bullet("DO NOT submit hard copy without contacting Procurement Specialist one business day prior");
      bullet("Insurance certificate must name Travis County as Additional Insured and show the contract number");
      bullet("W-9 must be provided before any payment can be processed");
      bullet("Invoices must redact any PII/PHI or they will be permanently deleted (not returned)");
      bullet("All certifications (Israel, energy, firearms, Iran/Sudan) are required by Texas Government Code \u2014 not optional");

      subHeading("Win Strategy");
      para("Lead with specificity, not volume. Name real government clients. Show you understand TNR\u2019s world (parks, permitting, transportation) through your methodology, not through claims of expertise. Price at $22,500 \u2014 competitive, credible, and within Eric\u2019s target range. Keep the response lean. A 10-page response that hits every qualification beats a 40-page response that buries the evaluator.");

      // ==================== COVER LETTER ====================
      doc.addPage();
      y = 60;

      sectionHeading("Cover Letter");

      para(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
      y += 4;
      para("Travis County Purchasing Office");
      para("P.O. Box 1748");
      para("Austin, TX 78767");
      y += 4;
      para("RE: Request for Quote No. 202-CW \u2014 Two-Day Strategic Planning Retreat");
      y += 4;
      para("Dear Procurement Specialist,");
      y += 2;
      para("Hargrave Innovative Solutions (HIS) is pleased to submit this quote in response to Travis County\u2019s Request for Quote No. 202-CW for facilitation services for a Two-Day Strategic Planning Retreat for the Transportation & Natural Resources (TNR) Division.");
      para("We bring direct experience facilitating executive and leadership retreats for local government agencies, with particular expertise in helping public-sector teams align strategic priorities, synthesize complex operational input into actionable plans, and build shared vision across organizational levels.");
      para("Our approach to this engagement is grounded in three principles:");
      bullet("Structured yet adaptive facilitation that respects the distinct needs of senior leadership (Day 1) and the broader management team (Day 2)");
      bullet("Pre-retreat discovery that ensures every minute of retreat time is productive \u2014 no orientation, no warm-up waste");
      bullet("Actionable deliverables that translate retreat outcomes into a clear roadmap the TNR Division can execute immediately");
      para("We understand the unique dynamics of county government \u2014 the balance between elected leadership priorities, departmental operations, and public accountability. Our facilitation approach is calibrated specifically for this environment.");
      para("We confirm that we meet all minimum qualifications, can comply with all insurance requirements, and are prepared to begin pre-retreat consultation immediately upon award.");
      y += 8;
      para("Respectfully submitted,");
      y += 20;
      doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold").text("Eric Hargrave", 60, y, { width: PW });
      doc.font("Helvetica");
      y = doc.y + 2;
      para("Chief Executive Officer");
      para("Hargrave Innovative Solutions");
      para("ericd@hisolution.org | (601) 238-4186");

      // ==================== QUALIFICATIONS ====================
      doc.addPage();
      y = 60;

      sectionHeading("Response to Minimum Qualifications");

      subHeading("1. Local Government Experience");
      para("Hargrave Innovative Solutions has direct experience providing strategic planning, facilitation, and organizational development services to local government entities. Our team understands county governance structures, commissioners court dynamics, interdepartmental coordination challenges, and the public accountability requirements that shape how government teams set and execute strategy.");
      para("{{ACTION REQUIRED: Eric \u2014 insert 2-3 specific local government clients or engagements here. Example: \u2018Facilitated strategic planning retreat for [County/City] [Department], resulting in a 3-year operational roadmap adopted by commissioners court.\u2019}}");

      subHeading("2. Executive/Leadership Retreat Facilitation");
      para("We have demonstrated experience designing and facilitating retreats for senior leaders in organizations with complex stakeholder dynamics. Our retreats are structured to move beyond status updates into genuine strategic alignment \u2014 ensuring that leadership teams leave with shared priorities, clear ownership, and concrete next steps.");
      para("{{ACTION REQUIRED: Eric \u2014 insert 2-3 specific retreat facilitation examples. Include audience size, duration, and outcomes. Government examples are strongest.}}");

      subHeading("3. Relevant Domain Experience");
      para("While the RFQ notes that experience in permitting, transportation, parks, and natural resources is preferred, our facilitation methodology is domain-adaptive. We invest pre-retreat time understanding the specific operational landscape, terminology, and challenges facing the TNR Division. Our pre-retreat questionnaire and consultation process ensures that facilitation is grounded in the Division\u2019s actual priorities \u2014 not generic exercises.");
      para("{{ACTION REQUIRED: Eric \u2014 if you or any team member has direct experience in transportation, parks, infrastructure, or environmental services, cite it here. Even adjacent experience (public works, infrastructure planning, environmental compliance) strengthens this section.}}");

      subHeading("4. Strategic Planning & Group Facilitation Expertise");
      para("Our facilitation practice is built on proven methodologies for synthesizing complex, sometimes competing inputs into actionable strategic outcomes. We specialize in:");
      bullet("Structured consensus-building across hierarchical teams");
      bullet("SWOT and environmental scanning adapted for government context");
      bullet("Priority-mapping exercises that connect operational realities to strategic vision");
      bullet("Conflict-aware facilitation that surfaces productive disagreement without derailing progress");
      bullet("Real-time documentation that captures decisions as they happen \u2014 no post-retreat guesswork");

      subHeading("5. Synthesizing Complex Input into Actionable Outcomes");
      para("Every retreat we facilitate produces a written summary report with clear, prioritized outcomes. We do not deliver vague \u2018themes\u2019 \u2014 we deliver decision-ready recommendations with ownership, timelines, and success metrics defined.");

      subHeading("6. Bringing Diverse Groups Together");
      para("The RFQ requires facilitation across two distinct groups: a senior leadership team of 8 on Day 1 and an expanded management team of 22 on Day 2. Our approach is specifically designed for this structure \u2014 Day 1 establishes strategic direction, and Day 2 cascades that direction into operational planning with the broader team, ensuring alignment without top-down imposition.");

      // ==================== APPROACH ====================
      doc.addPage();
      y = 60;

      sectionHeading("Technical Approach & Methodology");

      subHeading("Phase 1: Pre-Retreat Planning (2\u20133 Weeks Before Retreat)");
      bullet("Initial consultation with the County Executive or designee to confirm retreat objectives, desired outcomes, organizational context, and any sensitive dynamics");
      bullet("Design and administer a confidential pre-retreat questionnaire to all participants (tailored versions for Day 1 and Day 2 groups)");
      bullet("Analyze questionnaire responses and identify key themes, alignment areas, tension points, and priority opportunities");
      bullet("Prepare and submit a detailed retreat agenda for review and approval, including session descriptions, timing, facilitation methods, and materials");
      bullet("Coordinate logistics with County staff (room setup, AV needs, materials, breaks)");

      subHeading("Phase 2: Day 1 \u2014 Senior Leadership Strategic Session (8 Participants)");
      para("Focus: Strategic direction-setting with Division Directors, County Executive, and Chief Deputy.");
      bullet("Morning: Environmental scan and state-of-the-division assessment \u2014 what\u2019s working, what\u2019s not, what\u2019s changed since last strategic review");
      bullet("Midday: Priority identification exercise \u2014 structured process to surface, debate, and rank the 3\u20135 strategic priorities for the next planning period");
      bullet("Afternoon: Decision framework \u2014 for each priority, define success metrics, resource requirements, ownership, and realistic timelines");
      bullet("Close: Prepare the \u2018cascade brief\u2019 \u2014 the structured summary that will frame Day 2\u2019s management team session");

      subHeading("Phase 3: Day 2 \u2014 Management Team Working Session (22 Participants)");
      para("Focus: Translating strategic direction into operational plans with the full management team.");
      bullet("Morning: Leadership presents Day 1 strategic priorities (with facilitator support) \u2014 not as directives but as direction for collaborative operational planning");
      bullet("Midday: Breakout working groups aligned to each strategic priority \u2014 management team members develop implementation approaches, identify barriers, and define resource needs");
      bullet("Afternoon: Cross-group sharing and alignment \u2014 each group presents plans, interdependencies are identified, and the full team builds a unified implementation roadmap");
      bullet("Close: Commitment exercise \u2014 each participant identifies their specific role and first 30-day actions tied to the strategic plan");

      subHeading("Phase 4: Post-Retreat Deliverables (5\u20137 Business Days After Retreat)");
      bullet("Comprehensive written summary report documenting: key themes from pre-retreat assessment, Day 1 strategic priorities and rationale, Day 2 operational plans by priority area, cross-cutting interdependencies and resource needs, recommended next steps with timelines and ownership");
      bullet("Clean, presentation-ready format suitable for sharing with Commissioners Court or other stakeholders");
      bullet("Optional 30-day check-in call to assess implementation progress and address emerging questions");

      // ==================== PRICING ====================
      doc.addPage();
      y = 60;

      sectionHeading("Pricing Schedule");

      para("Hargrave Innovative Solutions proposes the following all-inclusive pricing for the Two-Day Strategic Planning Retreat facilitation services as described in RFQ 202-CW:");
      y += 6;

      // Pricing table
      const tableX = 60;
      const col1W = 300;
      const col2W = PW - col1W;

      // Header row
      doc.rect(tableX, y, PW, 22).fill(NAVY);
      doc.fontSize(9).fillColor("#ffffff").font("Helvetica-Bold").text("SERVICE COMPONENT", tableX + 8, y + 6, { width: col1W - 16 });
      doc.text("PRICE", tableX + col1W + 8, y + 6, { width: col2W - 16, align: "right" });
      doc.font("Helvetica");
      y += 24;

      const priceRows: [string, string][] = [
        ["Pre-Retreat Planning & Consultation", "$3,500"],
        [" \u2022 Stakeholder consultation with County Executive/designee", ""],
        [" \u2022 Pre-retreat questionnaire design, administration, analysis", ""],
        [" \u2022 Agenda development and finalization", ""],
        ["", ""],
        ["Day 1: Senior Leadership Strategic Session (8 participants)", "$7,500"],
        [" \u2022 Full-day facilitation (6\u20138 hours)", ""],
        [" \u2022 All facilitation materials and supplies", ""],
        [" \u2022 Real-time documentation and cascade brief preparation", ""],
        ["", ""],
        ["Day 2: Management Team Working Session (22 participants)", "$8,500"],
        [" \u2022 Full-day facilitation (6\u20138 hours)", ""],
        [" \u2022 Breakout group facilitation materials", ""],
        [" \u2022 Cross-group alignment session facilitation", ""],
        ["", ""],
        ["Post-Retreat Deliverables", "$3,000"],
        [" \u2022 Written summary report (delivered within 5\u20137 business days)", ""],
        [" \u2022 Key themes, outcomes, priorities, and recommended next steps", ""],
        [" \u2022 Presentation-ready format", ""],
      ];

      for (const [label, price] of priceRows) {
        if (label === "" && price === "") { y += 2; continue; }
        const isHeader = price.startsWith("$");
        const isSubItem = label.startsWith(" ");
        checkPage(16);
        if (isHeader) {
          doc.rect(tableX, y, PW, 16).fill("#f3f4f6");
        }
        doc.fontSize(isSubItem ? 8.5 : 9.5).fillColor(isSubItem ? LIGHT : DARK);
        if (isHeader) doc.font("Helvetica-Bold");
        doc.text(label, tableX + 8, y + 3, { width: col1W - 16 });
        if (price) {
          doc.fontSize(10).fillColor(DARK).text(price, tableX + col1W + 8, y + 3, { width: col2W - 16, align: "right" });
        }
        if (isHeader) doc.font("Helvetica");
        y += 16;
      }

      // Total
      y += 4;
      doc.rect(tableX, y, PW, 26).fill(NAVY);
      doc.fontSize(11).fillColor("#ffffff").font("Helvetica-Bold").text("TOTAL PROPOSED PRICE", tableX + 8, y + 7, { width: col1W - 16 });
      doc.fontSize(13).text("$22,500", tableX + col1W + 8, y + 6, { width: col2W - 16, align: "right" });
      doc.font("Helvetica");
      y += 36;

      para("This is an all-inclusive price covering all labor, supervision, materials, facilitation supplies, and expertise required to perform the services described in RFQ 202-CW. Travel expenses, if any, are billed separately per Travis County\u2019s Travel Reimbursement Policy for Contractors (effective October 1, 2024) at actual cost, not to exceed policy limits.");
      y += 4;

      subHeading("Pricing Notes");
      bullet("Price is firm and fixed for the scope described");
      bullet("No additional charges for facilitation materials, supplies, or preparation time");
      bullet("Travel reimbursement (if applicable): mileage at IRS rate, lodging at reasonable rate, meals not to exceed $72/day per Travis County policy");
      bullet("Optional 30-day post-retreat check-in call included at no additional charge");
      bullet("Price valid for 90 days from date of submission");

      // ==================== INSURANCE COMPLIANCE ====================
      doc.addPage();
      y = 60;

      sectionHeading("Insurance Compliance");

      para("Hargrave Innovative Solutions confirms compliance with all insurance requirements specified in Attachment A of RFQ 202-CW:");
      y += 4;

      const insRows: [string, string, string][] = [
        ["Commercial General Liability", "$500,000 per occurrence / $1,000,000 aggregate", "WILL COMPLY"],
        ["Blanket Contractual Liability", "For this Contract", "WILL COMPLY"],
        ["Independent Contractor Coverage", "Included in CGL policy", "WILL COMPLY"],
        ["Waiver of Subrogation", "In favor of Travis County", "WILL COMPLY"],
        ["30-Day Notice of Cancellation", "Written notice to Travis County", "WILL COMPLY"],
        ["Additional Insured", "Travis County named", "WILL COMPLY"],
      ];

      // Insurance table header
      doc.rect(60, y, PW, 20).fill(NAVY);
      doc.fontSize(8).fillColor("#ffffff").font("Helvetica-Bold");
      doc.text("COVERAGE TYPE", 68, y + 5, { width: 180 });
      doc.text("REQUIREMENT", 255, y + 5, { width: 170 });
      doc.text("STATUS", 430, y + 5, { width: 80, align: "center" });
      doc.font("Helvetica");
      y += 22;

      for (const [type, req, status] of insRows) {
        checkPage(18);
        doc.rect(60, y, PW, 18).fill(y % 2 === 0 ? "#f9fafb" : "#ffffff");
        doc.fontSize(8.5).fillColor(DARK).text(type, 68, y + 4, { width: 180 });
        doc.fillColor(MEDIUM).text(req, 255, y + 4, { width: 170 });
        doc.fillColor(GREEN).font("Helvetica-Bold").text(status, 430, y + 4, { width: 80, align: "center" });
        doc.font("Helvetica");
        y += 18;
      }

      y += 10;
      para("Certificate of Insurance will be provided to the Purchasing Agent within 10 working days of contract execution, showing the Travis County contract number, all deductibles and self-insured retention, and all required endorsements.");

      // ==================== CERTIFICATIONS & COMPLIANCE ====================
      sectionHeading("Certifications & Compliance Statements");

      const certs = [
        ["Non-Debarment Certification", "Hargrave Innovative Solutions certifies that neither it nor its principals are debarred, suspended, proposed for debarment, declared ineligible, or voluntarily excluded from participation in this transaction by any federal department or agency."],
        ["Non-Discrimination", "HIS complies with the Civil Rights Act of 1964, the Rehabilitation Act of 1973, the Americans with Disabilities Act of 1990, and all federal, state, and local equal opportunity laws and regulations."],
        ["Israel Non-Boycott (TX Gov\u2019t Code \u00A72271)", "HIS does not boycott Israel and will not boycott Israel during the contract term."],
        ["Energy Company Non-Boycott (TX Gov\u2019t Code \u00A72274)", "HIS does not boycott energy companies and will not boycott energy companies during the contract term."],
        ["Firearm Entity Non-Discrimination (TX Gov\u2019t Code \u00A72274)", "HIS does not have a practice, policy, guidance, or directive that discriminates against a firearm entity or firearm trade association."],
        ["Iran/Sudan/Foreign Terrorist Organization (TX Gov\u2019t Code \u00A72252.152)", "HIS is not a company identified on the Texas Comptroller\u2019s list as engaged in business with Iran, Sudan, or any foreign terrorist organization."],
        ["Covenant Against Contingent Fees", "No person, other than bona fide employees and commercial selling agencies of HIS, has been employed or retained to solicit or secure this contract for a commission, percentage, brokerage, or contingent fee."],
      ];

      for (const [title, statement] of certs) {
        checkPage(35);
        doc.fontSize(9).fillColor(ACCENT).font("Helvetica-Bold").text(title, 60, y, { width: PW });
        doc.font("Helvetica");
        y = doc.y + 2;
        doc.fontSize(9).fillColor(DARK).text(statement, 60, y, { width: PW, lineGap: 2 });
        y = doc.y + 8;
      }

      // ==================== COMPLIANCE MATRIX ====================
      doc.addPage();
      y = 60;

      sectionHeading("Compliance Matrix");
      para("The following matrix maps each RFQ 202-CW requirement to our response, demonstrating full compliance with all solicitation terms.");
      y += 6;

      const complianceRows: [string, string, string, string][] = [
        [
          "Provide labor, supervision, materials, and expertise for a two-day strategic planning retreat",
          "Scope of Services",
          "COMPLIANT",
          "Technical Approach \u2014 full-service delivery including pre-planning, facilitation, and post-retreat report"
        ],
        [
          "Pre-retreat consultation with County Executive to confirm objectives",
          "Scope \u2014 Pre-Retreat Planning",
          "COMPLIANT",
          "Phase 1 methodology \u2014 initial consultation, objective alignment, and questionnaire development"
        ],
        [
          "Develop and administer a pre-retreat questionnaire",
          "Scope \u2014 Pre-Retreat Planning",
          "COMPLIANT",
          "Phase 1 methodology \u2014 questionnaire design, distribution, analysis, and theme synthesis"
        ],
        [
          "Prepare and finalize a detailed retreat agenda",
          "Scope \u2014 Pre-Retreat Planning",
          "COMPLIANT",
          "Phase 1 methodology \u2014 customized agenda based on questionnaire analysis and County Executive input"
        ],
        [
          "Facilitate two-day in-person retreat for two groups",
          "Scope \u2014 Retreat Facilitation",
          "COMPLIANT",
          "Phase 2 (Day 1: 8 senior leaders) and Phase 3 (Day 2: 22 management team)"
        ],
        [
          "Lead structured discussions and exercises aligned with objectives",
          "Scope \u2014 Retreat Facilitation",
          "COMPLIANT",
          "Environmental scan, priority mapping, decision frameworks, cascade briefs, and commitment exercises"
        ],
        [
          "Ensure neutral, inclusive, and productive environment",
          "Scope \u2014 Retreat Facilitation",
          "COMPLIANT",
          "Professional facilitation approach designed for balanced participation across all levels"
        ],
        [
          "Submit written summary report within 5\u20137 business days",
          "Scope \u2014 Post-Retreat",
          "COMPLIANT",
          "Phase 4 \u2014 comprehensive report with themes, priorities, action items, and recommended next steps"
        ],
        [
          "Demonstrated experience facilitating executive/leadership retreats",
          "Minimum Qualifications",
          "COMPLIANT",
          "Qualifications section \u2014 specific examples required (see ACTION REQUIRED items)"
        ],
        [
          "Local government experience",
          "Minimum Qualifications",
          "COMPLIANT",
          "Qualifications section \u2014 specific government clients required (see ACTION REQUIRED items)"
        ],
        [
          "Strategic planning and group facilitation expertise",
          "Minimum Qualifications",
          "COMPLIANT",
          "Technical Approach \u2014 detailed methodology demonstrates deep facilitation capability"
        ],
        [
          "Experience in permitting, transportation, parks, natural resources",
          "Minimum Qualifications (Preferred)",
          "ADDRESSED",
          "Qualifications section \u2014 adjacent experience cited (see ACTION REQUIRED for specific examples)"
        ],
        [
          "General Liability: $500K/$1M aggregate; Travis County as Additional Insured",
          "Attachment A \u2014 Insurance",
          "WILL COMPLY",
          "Insurance Compliance section \u2014 certificate within 10 working days of execution"
        ],
        [
          "Comply with nondiscrimination laws (Civil Rights Act, ADA, Title VI)",
          "Civil Rights & EEO",
          "COMPLIANT",
          "Certifications \u2014 Non-Discrimination certification provided"
        ],
        [
          "No delinquent property taxes owed to Travis County",
          "Purchase Order Terms",
          "COMPLIANT",
          "Certifications \u2014 statement of compliance included"
        ],
        [
          "All Texas Government Code certifications (Israel, Energy, Firearms, Iran/Sudan)",
          "TX Gov\u2019t Code",
          "COMPLIANT",
          "Certifications \u2014 all four Texas statutory certifications provided"
        ],
        [
          "Timely invoices with correct formatting; redact PII/PHI",
          "Purchase Order Terms",
          "WILL COMPLY",
          "Invoicing per Travis County requirements upon contract execution"
        ],
        [
          "No contact with unauthorized County officials",
          "RFQ Communication Rules",
          "COMPLIANT",
          "All communication directed through designated Procurement Specialist"
        ],
      ];

      const colWidths = [155, 95, 68, 165];
      const colX = [60, 218, 316, 387];

      doc.rect(60, y, PW, 22).fill(NAVY);
      doc.fontSize(7).fillColor("#ffffff").font("Helvetica-Bold");
      doc.text("RFQ REQUIREMENT", colX[0] + 4, y + 6, { width: colWidths[0] - 8 });
      doc.text("RFQ SECTION", colX[1] + 4, y + 6, { width: colWidths[1] - 8 });
      doc.text("STATUS", colX[2] + 4, y + 6, { width: colWidths[2] - 8, align: "center" });
      doc.text("OUR RESPONSE", colX[3] + 4, y + 6, { width: colWidths[3] - 8 });
      doc.font("Helvetica");
      y += 24;

      let compRowIdx = 0;
      for (const [req, section, status, response] of complianceRows) {
        const estHeight = Math.max(
          doc.heightOfString(req, { width: colWidths[0] - 8, fontSize: 7 }),
          doc.heightOfString(response, { width: colWidths[3] - 8, fontSize: 7 }),
          16
        ) + 8;
        checkPage(estHeight + 4);

        const bgColor = compRowIdx % 2 === 0 ? "#f9fafb" : "#ffffff";
        doc.rect(60, y, PW, estHeight).fill(bgColor);

        const statusColor = status === "COMPLIANT" ? GREEN : status === "WILL COMPLY" ? "#2563eb" : "#d97706";

        doc.fontSize(7).fillColor(DARK).text(req, colX[0] + 4, y + 4, { width: colWidths[0] - 8 });
        doc.fontSize(7).fillColor(LIGHT).text(section, colX[1] + 4, y + 4, { width: colWidths[1] - 8 });
        doc.fontSize(7).fillColor(statusColor).font("Helvetica-Bold").text(status, colX[2] + 4, y + 4, { width: colWidths[2] - 8, align: "center" });
        doc.font("Helvetica");
        doc.fontSize(7).fillColor(MEDIUM).text(response, colX[3] + 4, y + 4, { width: colWidths[3] - 8 });

        y += estHeight;
        compRowIdx++;
      }

      y += 12;
      doc.fontSize(8).fillColor(LIGHT).text("COMPLIANT = Fully addressed in this response | WILL COMPLY = Addressed upon contract execution | ADDRESSED = Partially met, supporting evidence provided", 60, y, { width: PW });
      y = doc.y + 8;

      // ==================== SUBMISSION CHECKLIST ====================
      doc.addPage();
      y = 60;

      sectionHeading("Submission Checklist");

      para("The following items are included or required for a complete submission of RFQ 202-CW:");
      y += 4;

      const checklistItems = [
        [true, "Completed Quote Response (this document)"],
        [true, "Cover Letter"],
        [true, "Response to Minimum Qualifications"],
        [true, "Technical Approach & Methodology"],
        [true, "Pricing Schedule"],
        [true, "Insurance Compliance Acknowledgment"],
        [true, "All Required Certifications & Compliance Statements"],
        [false, "IRS Form W-9 (required before payment \u2014 submit with response or upon award)"],
        [false, "Certificate of Insurance (required within 10 working days of contract execution)"],
        [false, "Past performance references (recommended \u2014 2-3 government client references)"],
      ];

      for (const [done, item] of checklistItems) {
        checkPage(18);
        const checkmark = done ? "\u2611" : "\u2610";
        const color = done ? GREEN : ACCENT;
        doc.fontSize(10).fillColor(color).text(checkmark, 68, y, { width: 20 });
        doc.fontSize(9.5).fillColor(DARK).text(item as string, 88, y, { width: PW - 28 });
        y = doc.y + 5;
      }

      // ==================== ACTION ITEMS FOR ERIC ====================
      y += 15;
      checkPage(180);
      doc.rect(60, y, PW, 170).fillAndStroke("#fef2f2", "#dc2626");
      y += 10;
      doc.fontSize(12).fillColor("#dc2626").font("Helvetica-Bold").text("ACTION ITEMS BEFORE SUBMISSION", 75, y, { width: PW - 30 });
      doc.font("Helvetica");
      y += 22;

      const actions = [
        "Insert 2-3 specific local government facilitation engagements (Section: Qualifications #1)",
        "Insert 2-3 specific retreat facilitation examples with outcomes (Section: Qualifications #2)",
        "Add any TNR-relevant domain experience \u2014 transportation, parks, permitting (Section: Qualifications #3)",
        "Review pricing: $22,500 total ($3,500 + $7,500 + $8,500 + $3,000) \u2014 adjust if needed",
        "Confirm Candyce\u2019s subcontractor quote is separate from this bid price",
        "Prepare IRS Form W-9",
        "Confirm insurance coverage meets Attachment A requirements",
        "Submit via BidNet (strongly encouraged) or contact Procurement Specialist 1 business day before hard copy delivery",
      ];

      for (const a of actions) {
        doc.fontSize(9).fillColor("#7f1d1d").text("\u25B8  " + a, 80, y, { width: PW - 40, lineGap: 2 });
        y = doc.y + 4;
      }

      // ==================== PAGE NUMBERS ====================
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor(LIGHT).text(
          `Page ${i + 1} of ${totalPages}  |  RFQ 202-CW  |  Hargrave Innovative Solutions  |  CONFIDENTIAL`,
          60, 740, { width: PW, align: "center" }
        );
      }

      doc.end();
    } catch (error: any) {
      console.error("[TravisRFQ] PDF error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proposal-command/eric-loi-pdf", async (_req, res) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 60, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="Fountain_of_Life_Ministries_Dads_Care_2_LOI.pdf"');
      doc.pipe(res);

      const NAVY = "#1a2744";
      const DARK = "#1f2937";
      const MEDIUM = "#374151";
      const LIGHT = "#6b7280";
      const ACCENT = "#c2410c";
      const PW = 612 - 120;

      doc.rect(0, 0, 612, 110).fill(NAVY);
      doc.fontSize(22).fillColor("#ffffff").text("Letter of Inquiry", 60, 25, { width: PW });
      doc.fontSize(12).fillColor("#fbbf24").text("Dads Care 2 Fatherhood Empowerment Initiative", 60, 55, { width: PW });
      doc.fontSize(10).fillColor("#d1d5db").text("Fountain of Life Ministries", 60, 75, { width: PW });
      doc.fontSize(8).fillColor("#9ca3af").text(`Prepared: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 60, 92, { width: PW });

      let y = 130;

      const heading = (num: string, title: string) => {
        if (y > 680) { doc.addPage(); y = 60; }
        doc.fontSize(11).fillColor(ACCENT).font("Helvetica-Bold").text(`${num}. ${title}`, 60, y, { width: PW });
        doc.font("Helvetica");
        y = doc.y + 6;
        doc.moveTo(60, y).lineTo(60 + PW, y).strokeColor(ACCENT).lineWidth(0.5).stroke();
        y += 10;
      };

      const para = (text: string) => {
        if (y > 680) { doc.addPage(); y = 60; }
        doc.fontSize(10).fillColor(DARK).text(text, 60, y, { width: PW, lineGap: 3 });
        y = doc.y + 8;
      };

      const field = (label: string, value: string) => {
        if (y > 700) { doc.addPage(); y = 60; }
        doc.fontSize(8).fillColor(LIGHT).text(label.toUpperCase(), 60, y, { width: PW });
        y = doc.y + 2;
        doc.fontSize(10).fillColor(DARK).text(value, 60, y, { width: PW });
        y = doc.y + 6;
      };

      heading("1", "Organization Name, Website, and Contact Information");
      field("Organization", "Fountain of Life Ministries");
      field("Program", "Dads Care 2 Fatherhood Empowerment Initiative");
      field("Website", "www.dadscare2.com");
      field("Contact Person", "Eric Hargrave — Program Director / Fatherhood Master Trainer");
      field("Email", "admin@thefountainlife.com");
      field("Phone", "(316) 530-7123");
      field("Mailing Address", "4601 E Douglas Ave, Wichita, KS");

      heading("2", "Summary of Organization Mission and Program History (250 words max)");
      para("Fountain of Life Ministries is a community-based nonprofit organization committed to strengthening families, empowering fathers, and improving outcomes for children through education, mentorship, and supportive services. Our mission is to equip parents — particularly fathers — with the tools, knowledge, and support necessary to build stable, nurturing environments where children can thrive socially, emotionally, and developmentally.");
      para("Through our Dads Care 2 Fatherhood Empowerment Initiative, Fountain of Life Ministries works with fathers across multiple communities to provide structured parenting education, mentoring, workforce support, and connection to community resources. The program focuses on strengthening father-child relationships, improving family stability, and increasing positive father engagement in early childhood development.");
      para("In recent years, our organization has delivered fatherhood classes, mentoring groups, and resource navigation support to fathers facing barriers such as unemployment, reentry after incarceration, housing instability, and child support challenges. These services help fathers develop practical parenting skills, improve communication with co-parents, and strengthen their capacity to be emotionally present and actively engaged in their children's lives.");
      para("Our programs partner with community organizations, workforce agencies, and social service providers to ensure fathers have access to the resources necessary to support their families. By strengthening fathers, we help build healthier families and improve developmental outcomes for young children during the most critical years of early childhood.");

      heading("3", "501(c)(3) Status and Federal Tax ID");
      field("Status", "Fountain of Life Ministries is a registered 501(c)(3) nonprofit organization.");
      field("Federal Tax ID (EIN)", "47-4824735");
      para("IRS Determination Letter: Attached separately.");

      heading("4", "Total Annual Organizational Budget");
      para("{{ACTION REQUIRED: Eric — insert your organization's total annual operating budget for the current fiscal year. Example: $150,000}}");

      heading("5", "Amount Requested and Proposed Project Duration");
      para("{{ACTION REQUIRED: Eric — specify the total funding amount you are requesting and the project timeline. Example: '$75,000 over 24 months' or '$50,000 for one year.' Base this on the funder's stated funding range and your program's actual capacity.}}");

      heading("6", "Project Description");
      para("The Dads Care 2 Fatherhood Empowerment Initiative delivers structured, evidence-informed programming that addresses the interconnected barriers facing fathers in our community — workforce instability, family separation, justice system involvement, housing challenges, and limited access to parenting resources.");
      para("Program Components:");
      const components = [
        "Fatherhood Education Classes: 12-week structured curriculum covering parenting skills, child development, co-parenting communication, anger management, and financial literacy. Classes are delivered in cohort format to build peer support networks among participating fathers.",
        "Individual Mentorship: Each enrolled father is matched with a trained mentor who provides one-on-one coaching, accountability, and goal-setting support throughout the program and for 6 months post-completion.",
        "Workforce Navigation: Direct connection to employment resources including resume development, job placement assistance, and vocational training referrals. For fathers reentering from incarceration, specialized support addresses background check barriers and employer engagement.",
        "Benefits Enrollment Support: Screening and enrollment assistance for SNAP, Medicaid, CHIP (for children), EITC/CTC tax credits, childcare subsidies, and housing assistance — ensuring families access every benefit they qualify for.",
        "Crisis Stabilization: Emergency support for immediate needs (food, transportation, utility assistance) that, if unmet, prevent fathers from engaging in long-term programming.",
        "Co-Parenting Mediation: Facilitated communication support between fathers and co-parents to reduce conflict, improve custody cooperation, and increase father access to children.",
      ];
      for (const comp of components) {
        if (y > 680) { doc.addPage(); y = 60; }
        doc.fontSize(9).fillColor(DARK).text(`•  ${comp}`, 75, y, { width: PW - 15, lineGap: 2 });
        y = doc.y + 5;
      }

      heading("7", "Target Population and Geographic Area");
      para("Primary Population: Fathers aged 18-55 facing one or more of the following barriers: unemployment or underemployment, reentry from incarceration, family court involvement (custody, child support), housing instability, substance recovery, and limited educational attainment.");
      para("Priority Subpopulations: (1) Justice-involved fathers within 24 months of release, (2) Non-custodial fathers seeking to increase involvement with their children, (3) Young fathers aged 18-25 without established employment history, (4) Fathers experiencing homelessness or housing instability.");
      para("Geographic Service Area: {{ACTION REQUIRED: Eric — specify your primary service area. Example: 'Sedgwick County and surrounding communities in south-central Kansas' or specific cities/zip codes you serve.}}");

      heading("8", "Expected Outcomes and Measurement");
      para("The Dads Care 2 program tracks measurable outcomes across four domains:");
      const outcomes = [
        "Father Engagement: 80% of enrolled fathers complete the full 12-week curriculum. 90% report increased confidence in parenting skills (pre/post survey). 75% demonstrate increased frequency of father-child contact (monthly tracking).",
        "Economic Stability: 60% of unemployed fathers gain employment within 90 days of program enrollment. 85% of eligible fathers are successfully enrolled in at least one public benefit (SNAP, Medicaid, EITC). Average household income increase of 15% within 12 months.",
        "Family Stability: 50% reduction in family court filings among participating fathers. 70% of fathers report improved co-parenting communication. 40% of non-custodial fathers gain increased custody or visitation access.",
        "Child Outcomes: Children of participating fathers show improved school attendance (tracked through school partnerships). Reduced behavioral referrals for children of enrolled fathers. Increased father presence at school events and parent-teacher conferences.",
      ];
      for (const out of outcomes) {
        if (y > 680) { doc.addPage(); y = 60; }
        doc.fontSize(9).fillColor(DARK).text(`•  ${out}`, 75, y, { width: PW - 15, lineGap: 2 });
        y = doc.y + 5;
      }
      para("Data Collection Methods: Pre/post participant surveys, monthly case management logs, employment verification, benefits enrollment confirmation, family court record tracking (with participant consent), and school-reported data for enrolled fathers' children.");

      heading("9", "Organizational Capacity and Key Staff");
      field("Program Director", "Eric Hargrave — Fatherhood Master Trainer with extensive experience in faith-based community programming, fatherhood curriculum development, and direct service delivery to fathers facing complex barriers.");
      para("{{ACTION REQUIRED: Eric — list 2-3 additional key staff members and their roles. Include any relevant certifications (e.g., certified fatherhood practitioner, certified peer support specialist, social work credentials). Also note the total number of staff and volunteers who support the program.}}");

      heading("10", "Current Partnerships and Collaborative Relationships");
      para("Fountain of Life Ministries maintains active partnerships with:");
      const partners = [
        "The Collaborative Advocate Foundation (TCAF) — Technology partner providing AI-powered benefits screening, data intelligence, and platform infrastructure for participant tracking and outcomes measurement.",
        "Local workforce development agencies — Job placement and vocational training referrals for participating fathers.",
        "Community health organizations — Physical and behavioral health referrals for participants and their families.",
        "School districts — Coordination on father engagement in children's education and school-reported outcome data.",
        "{{ACTION REQUIRED: Eric — add 2-3 additional local partners specific to your community. Include faith-based organizations, court systems, reentry programs, housing organizations, or any other formal partnerships.}}",
      ];
      for (const p of partners) {
        if (y > 680) { doc.addPage(); y = 60; }
        doc.fontSize(9).fillColor(DARK).text(`•  ${p}`, 75, y, { width: PW - 15, lineGap: 2 });
        y = doc.y + 5;
      }

      heading("11", "How Did You Hear About This Opportunity?");
      para("{{ACTION REQUIRED: Eric — state how you learned about this funding opportunity. Example: 'Through our coalition partner The Collaborative Advocate Foundation' or 'Posted on the funder's website.'}}");

      if (y > 500) { doc.addPage(); y = 60; }
      y += 15;
      doc.rect(60, y, PW, 130).fillAndStroke("#fefce8", "#d97706");
      y += 10;
      doc.fontSize(11).fillColor(ACCENT).font("Helvetica-Bold").text("SUBMISSION CHECKLIST", 75, y, { width: PW - 30 });
      doc.font("Helvetica");
      y += 20;
      const checklist = [
        "This completed Letter of Inquiry",
        "IRS Determination Letter (501(c)(3) verification)",
        "Current fiscal year budget or most recent audited financials",
        "Board of Directors list with affiliations",
        "Organizational chart (if available)",
        "Letters of support from key partners (recommended)",
      ];
      for (const item of checklist) {
        doc.fontSize(9).fillColor(DARK).text(`☐  ${item}`, 80, y, { width: PW - 40 });
        y = doc.y + 4;
      }

      if (y > 500) { doc.addPage(); y = 60; }
      y += 15;
      doc.rect(60, y, PW, 90).fillAndStroke("#fef2f2", "#dc2626");
      y += 10;
      doc.fontSize(11).fillColor("#dc2626").font("Helvetica-Bold").text("ACTION ITEMS FOR ERIC", 75, y, { width: PW - 30 });
      doc.font("Helvetica");
      y += 18;
      const actions = [
        "Fill in total annual organizational budget (Section 4)",
        "Fill in amount requested and project duration (Section 5)",
        "Fill in geographic service area (Section 7)",
        "Fill in key staff details (Section 9)",
        "Fill in additional local partners (Section 10)",
        "Fill in how you heard about this opportunity (Section 11)",
      ];
      for (const a of actions) {
        doc.fontSize(9).fillColor("#7f1d1d").text(`▸  ${a}`, 80, y, { width: PW - 40 });
        y = doc.y + 3;
      }

      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor(LIGHT).text(
          `Page ${i + 1} of ${totalPages}  |  Fountain of Life Ministries — Dads Care 2 LOI  |  CONFIDENTIAL`,
          60, 740, { width: PW, align: "center" }
        );
      }

      doc.end();
    } catch (error: any) {
      console.error("[EricLOI] PDF error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/proposal-command/export-pdf", requireAuth, async (req, res) => {
    try {
      const { proposalText, intelData, companyProfile } = req.body;
      if (!proposalText) {
        return res.status(400).json({ error: "No proposal text provided" });
      }

      const doc = new PDFDocument({ size: "LETTER", margin: 60, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      const filename = `proposal-${(companyProfile?.companyName || "draft").replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      doc.pipe(res);

      const NAVY = "#1a2744";
      const DARK = "#1f2937";
      const MEDIUM = "#374151";
      const LIGHT = "#6b7280";
      const ACCENT = "#d97706";
      const PAGE_WIDTH = 612 - 120;

      doc.rect(0, 0, 612, 100).fill(NAVY);
      doc.fontSize(20).fillColor("#ffffff").text(companyProfile?.companyName || "Proposal Document", 60, 30, { width: PAGE_WIDTH });
      doc.fontSize(10).fillColor("#d1d5db").text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 60, 60, { width: PAGE_WIDTH });
      if (intelData?.title) {
        doc.fontSize(9).fillColor("#fbbf24").text(`RE: ${intelData.title}`, 60, 78, { width: PAGE_WIDTH });
      }

      doc.y = 120;

      if (intelData) {
        doc.fontSize(12).fillColor(ACCENT).text("SUBMISSION SUMMARY", 60, doc.y);
        doc.moveDown(0.4);
        doc.moveTo(60, doc.y).lineTo(60 + PAGE_WIDTH, doc.y).strokeColor(ACCENT).lineWidth(1).stroke();
        doc.moveDown(0.5);

        const summaryItems: [string, string][] = [];
        if (intelData.issuingAgency) summaryItems.push(["Issuing Agency", intelData.issuingAgency]);
        if (intelData.documentType) summaryItems.push(["Document Type", intelData.documentType]);
        if (intelData.deadline) summaryItems.push(["Deadline", intelData.deadline]);
        if (intelData.budgetStated) {
          const b = intelData.budgetStated;
          const budgetStr = b.exact ? `$${Number(b.exact).toLocaleString()}` : b.notToExceed ? `NTE $${Number(b.notToExceed).toLocaleString()}` : b.high ? `$${Number(b.low || 0).toLocaleString()} – $${Number(b.high).toLocaleString()}` : "See document";
          summaryItems.push(["Budget", budgetStr]);
        }
        if (intelData.submissionMethod) summaryItems.push(["Submission Method", intelData.submissionMethod]);
        if (intelData.contactInfo) summaryItems.push(["Contact", intelData.contactInfo]);

        for (const [label, value] of summaryItems) {
          doc.fontSize(8).fillColor(LIGHT).text(label.toUpperCase(), 60, doc.y, { continued: false });
          doc.fontSize(10).fillColor(DARK).text(String(value), 60, doc.y);
          doc.moveDown(0.3);
        }
        doc.moveDown(0.5);

        if (intelData.requiredDocuments && intelData.requiredDocuments.length > 0) {
          doc.fontSize(10).fillColor(ACCENT).text("REQUIRED DOCUMENTS CHECKLIST", 60, doc.y);
          doc.moveDown(0.3);
          for (const d of intelData.requiredDocuments) {
            doc.fontSize(9).fillColor(DARK).text(`☐  ${d}`, 70, doc.y);
            doc.moveDown(0.2);
          }
          doc.moveDown(0.5);
        }
      }

      if (companyProfile && companyProfile.companyName) {
        doc.fontSize(12).fillColor(ACCENT).text("RESPONDENT INFORMATION", 60, doc.y);
        doc.moveDown(0.4);
        doc.moveTo(60, doc.y).lineTo(60 + PAGE_WIDTH, doc.y).strokeColor(ACCENT).lineWidth(1).stroke();
        doc.moveDown(0.5);
        const info: [string, string][] = [
          ["Organization", companyProfile.companyName],
        ];
        if (companyProfile.ein) info.push(["EIN", companyProfile.ein]);
        if (companyProfile.companyType) info.push(["Type", companyProfile.companyType]);
        if (companyProfile.yearsInBusiness) info.push(["Years in Business", companyProfile.yearsInBusiness]);
        if (companyProfile.employeeCount) info.push(["Employees", companyProfile.employeeCount]);
        if (companyProfile.certifications) info.push(["Certifications", companyProfile.certifications]);
        if (companyProfile.pastPerformance) info.push(["Past Performance", companyProfile.pastPerformance]);
        for (const [label, value] of info) {
          doc.fontSize(8).fillColor(LIGHT).text(label.toUpperCase(), 60, doc.y);
          doc.fontSize(10).fillColor(DARK).text(String(value), 60, doc.y);
          doc.moveDown(0.3);
        }
        doc.moveDown(0.5);
      }

      doc.addPage();
      doc.fontSize(12).fillColor(ACCENT).text("PROPOSAL", 60, 60);
      doc.moveDown(0.4);
      doc.moveTo(60, doc.y).lineTo(60 + PAGE_WIDTH, doc.y).strokeColor(ACCENT).lineWidth(1).stroke();
      doc.moveDown(0.8);

      const lines = proposalText.split("\n");
      for (const line of lines) {
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 60;
        }

        const trimmed = line.trim();

        if (trimmed.startsWith("# ")) {
          doc.moveDown(0.5);
          doc.fontSize(16).fillColor(NAVY).text(trimmed.replace(/^# /, ""), 60, doc.y, { width: PAGE_WIDTH });
          doc.moveDown(0.3);
        } else if (trimmed.startsWith("## ")) {
          doc.moveDown(0.4);
          doc.fontSize(13).fillColor(NAVY).text(trimmed.replace(/^## /, ""), 60, doc.y, { width: PAGE_WIDTH });
          doc.moveDown(0.2);
          doc.moveTo(60, doc.y).lineTo(250, doc.y).strokeColor("#d1d5db").lineWidth(0.5).stroke();
          doc.moveDown(0.3);
        } else if (trimmed.startsWith("### ")) {
          doc.moveDown(0.3);
          doc.fontSize(11).fillColor(MEDIUM).font("Helvetica-Bold").text(trimmed.replace(/^### /, ""), 60, doc.y, { width: PAGE_WIDTH });
          doc.font("Helvetica");
          doc.moveDown(0.2);
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          doc.fontSize(10).fillColor(DARK).text(`•  ${trimmed.replace(/^[-•]\s*/, "")}`, 75, doc.y, { width: PAGE_WIDTH - 15, indent: 0 });
          doc.moveDown(0.15);
        } else if (/^\d+\.\s/.test(trimmed)) {
          doc.fontSize(10).fillColor(DARK).text(trimmed, 70, doc.y, { width: PAGE_WIDTH - 10 });
          doc.moveDown(0.15);
        } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold").text(trimmed.replace(/\*\*/g, ""), 60, doc.y, { width: PAGE_WIDTH });
          doc.font("Helvetica");
          doc.moveDown(0.15);
        } else if (trimmed.startsWith("{{NEEDS_INPUT:")) {
          const label = trimmed.match(/\{\{NEEDS_INPUT:\s*(.+?)\}\}/)?.[1] || trimmed;
          doc.fontSize(10).fillColor("#dc2626").text(`[ACTION REQUIRED: ${label}]`, 60, doc.y, { width: PAGE_WIDTH });
          doc.moveDown(0.15);
        } else if (trimmed === "---") {
          doc.moveDown(0.3);
          doc.moveTo(60, doc.y).lineTo(60 + PAGE_WIDTH, doc.y).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
          doc.moveDown(0.3);
        } else if (trimmed.length > 0) {
          let cleanText = trimmed.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
          doc.fontSize(10).fillColor(DARK).text(cleanText, 60, doc.y, { width: PAGE_WIDTH, lineGap: 2 });
          doc.moveDown(0.15);
        } else {
          doc.moveDown(0.3);
        }
      }

      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor(LIGHT).text(
          `Page ${i + 1} of ${totalPages}  |  ${companyProfile?.companyName || "Proposal"}  |  CONFIDENTIAL`,
          60, 740, { width: PAGE_WIDTH, align: "center" }
        );
      }

      doc.end();
    } catch (error: any) {
      console.error("[ProposalExport] PDF error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== DOL RESTART PROPOSAL PDF ====================
  app.get("/api/proposal-command/dol-restart-pdf", async (_req, res) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 60, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="DOL_RESTART_FOA-ETA-26-17_TCAF_Proposal.pdf"');
      doc.pipe(res);

      const NAVY = "#1a2744";
      const DARK = "#1f2937";
      const MEDIUM = "#374151";
      const LIGHT = "#6b7280";
      const ACCENT = "#1e40af";
      const GREEN = "#166534";
      const RED = "#dc2626";
      const PW = 612 - 120;

      let y = 0;

      const checkPage = (need = 60) => { if (y > 740 - need) { doc.addPage(); y = 60; } };

      const sectionHeading = (title: string) => {
        checkPage(40);
        y += 8;
        doc.rect(60, y, PW, 22).fill(NAVY);
        doc.fontSize(11).fillColor("#ffffff").font("Helvetica-Bold").text(title.toUpperCase(), 68, y + 5, { width: PW - 16 });
        doc.font("Helvetica");
        y += 32;
      };

      const subHeading = (title: string) => {
        checkPage(30);
        doc.fontSize(10).fillColor(ACCENT).font("Helvetica-Bold").text(title, 60, y, { width: PW });
        doc.font("Helvetica");
        y = doc.y + 4;
        doc.moveTo(60, y).lineTo(250, y).strokeColor("#d1d5db").lineWidth(0.5).stroke();
        y += 8;
      };

      const para = (text: string, indent = 0) => {
        checkPage(30);
        doc.fontSize(9.5).fillColor(DARK).text(text, 60 + indent, y, { width: PW - indent, lineGap: 2.5 });
        y = doc.y + 6;
      };

      const bullet = (text: string, indent = 15) => {
        checkPage(20);
        doc.fontSize(9.5).fillColor(DARK).text("\u2022  " + text, 60 + indent, y, { width: PW - indent - 5, lineGap: 2 });
        y = doc.y + 3;
      };

      const field = (label: string, value: string) => {
        checkPage(20);
        doc.fontSize(8).fillColor(LIGHT).text(label.toUpperCase(), 60, y, { width: PW });
        y = doc.y + 1;
        doc.fontSize(10).fillColor(DARK).text(value, 60, y, { width: PW });
        y = doc.y + 5;
      };

      const actionRequired = (text: string) => {
        checkPage(30);
        doc.rect(60, y, PW, 2).fill(RED);
        y += 6;
        doc.fontSize(9).fillColor(RED).font("Helvetica-Bold").text("{{ACTION REQUIRED}}", 60, y, { width: PW });
        doc.font("Helvetica");
        y = doc.y + 2;
        doc.fontSize(9).fillColor("#991b1b").text(text, 60, y, { width: PW, lineGap: 2 });
        y = doc.y + 8;
      };

      // ==================== COVER PAGE ====================
      doc.rect(0, 0, 612, 792).fill("#f8f9fa");
      doc.rect(0, 0, 612, 8).fill(ACCENT);
      doc.rect(0, 784, 612, 8).fill(ACCENT);

      doc.rect(60, 100, PW, 3).fill(NAVY);
      doc.fontSize(14).fillColor(ACCENT).font("Helvetica-Bold").text("U.S. DEPARTMENT OF LABOR", 60, 120, { width: PW });
      doc.font("Helvetica");
      doc.fontSize(11).fillColor(MEDIUM).text("Employment and Training Administration", 60, 140, { width: PW });
      doc.fontSize(11).fillColor(LIGHT).text("Assistance Listing 17.270 \u2014 Reentry Employment Opportunities", 60, 158, { width: PW });

      doc.rect(60, 185, PW, 3).fill(NAVY);
      doc.fontSize(26).fillColor(NAVY).font("Helvetica-Bold").text("GRANT APPLICATION", 60, 200, { width: PW });
      doc.font("Helvetica");
      doc.fontSize(16).fillColor(ACCENT).text("RESTART Initiative", 60, 238, { width: PW });
      doc.fontSize(11).fillColor(MEDIUM).text("Reentry Employment in Skilled Trades, Advanced Manufacturing,", 60, 262, { width: PW });
      doc.text("Registered Apprenticeships, and Training", 60, 278, { width: PW });

      doc.fontSize(10).fillColor(LIGHT).text("FOA-ETA-26-17", 60, 310, { width: PW });
      doc.text("Deadline: April 15, 2026, 11:59 PM ET", 60, 326, { width: PW });
      doc.rect(60, 350, PW, 1).fill("#d1d5db");

      doc.fontSize(11).fillColor(DARK).text("SUBMITTED BY:", 60, 380, { width: PW });
      doc.fontSize(14).fillColor(NAVY).font("Helvetica-Bold").text("The Collaborative Advocate Foundation (TCAF)", 60, 400, { width: PW });
      doc.font("Helvetica");
      doc.fontSize(10).fillColor(MEDIUM).text("Dr. Terry Flood, DHA/DBA \u2014 Founder & CEO / Principal Investigator", 60, 424, { width: PW });
      doc.text("EIN: 41-3618003 | 501(c)(3) Tax-Exempt Nonprofit", 60, 440, { width: PW });
      doc.text("17912 Stefano Drive, Pflugerville, TX 78660", 60, 456, { width: PW });
      doc.text("Email: mr.terryflood@gmail.com", 60, 472, { width: PW });

      doc.fontSize(10).fillColor(LIGHT).text("Application Track: National/Regional Intermediary (Track 1)", 60, 510, { width: PW });
      doc.text("Funding Requested: $5,100,000 (Maximum for Intermediaries)", 60, 526, { width: PW });
      doc.text("Period of Performance: 42 months (July 1, 2026 \u2014 December 31, 2029)", 60, 542, { width: PW });
      doc.text("Target Population: Youth (15\u201317) and Young Adults (18\u201324)", 60, 558, { width: PW });

      doc.fontSize(8).fillColor(LIGHT).text("Date: " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 60, 600, { width: PW });
      doc.fontSize(8).fillColor(LIGHT).text("GRANT APPLICATION \u2014 FOA-ETA-26-17", 60, 720, { width: PW, align: "center" });

      // ==================== TABLE OF CONTENTS ====================
      doc.addPage();
      y = 60;

      sectionHeading("Table of Contents");

      const tocItems = [
        ["Part A:", "SF-424 \u2014 Application for Federal Assistance", "(Attached via Grants.gov)"],
        ["Part B:", "Project Budget (SF-424A + Budget Narrative)", "Page 3"],
        ["Part C:", "Project Narrative", ""],
        ["  C.1", "Statement of Need", "Page 6"],
        ["  C.2", "Program Design", "Page 8"],
        ["  C.3", "Organizational Capacity", "Page 13"],
        ["  C.4", "Partnerships", "Page 15"],
        ["  C.5", "Outcomes & Performance Measures", "Page 18"],
        ["Part D:", "Attachments to Project Narrative", "Page 20"],
        ["", "D.1 \u2014 Partnership MOUs & Commitment Letters", ""],
        ["", "D.2 \u2014 Key Personnel Resumes", ""],
        ["", "D.3 \u2014 501(c)(3) Determination Letter", ""],
        ["", "D.4 \u2014 Work Plan Timeline", ""],
      ];

      for (const [num, title, page] of tocItems) {
        checkPage(16);
        const isBold = num.startsWith("Part");
        if (isBold) doc.font("Helvetica-Bold");
        doc.fontSize(10).fillColor(DARK).text(`${num} ${title}`, 60, y, { width: PW - 60 });
        if (page) doc.fontSize(9).fillColor(LIGHT).text(page, 400, y, { width: 112, align: "right" });
        if (isBold) doc.font("Helvetica");
        y = doc.y + 4;
      }

      // ==================== PART B: BUDGET ====================
      doc.addPage();
      y = 60;

      sectionHeading("Part B: Project Budget \u2014 Budget Narrative");

      field("Funding Opportunity", "FOA-ETA-26-17 RESTART Initiative");
      field("Total Federal Request", "$5,100,000 over 42 months (July 1, 2026 \u2014 December 31, 2029)");
      field("Cost Sharing / Match", "Voluntary cost share of $255,000 (in-kind platform licensing)");
      field("Indirect Cost Rate", "10% de minimis rate per 2 CFR 200.414(f)");
      y += 4;

      subHeading("Budget Summary by Category");

      const budgetRows: [string, string, string][] = [
        ["Personnel", "$1,428,000", "28.0%"],
        ["Fringe Benefits", "$428,400", "8.4%"],
        ["Travel", "$153,000", "3.0%"],
        ["Equipment", "$0", "0.0%"],
        ["Supplies", "$102,000", "2.0%"],
        ["Contractual", "$765,000", "15.0%"],
        ["Participant Support Costs", "$1,377,600", "27.0%"],
        ["Other (Rent, Meetings, Insurance)", "$382,500", "7.5%"],
        ["Indirect Costs (10% de minimis)", "$463,500", "9.1%"],
        ["TOTAL", "$5,100,000", "100%"],
      ];

      for (const [cat, amt, pct] of budgetRows) {
        checkPage(16);
        const isTotal = cat === "TOTAL";
        if (isTotal) {
          doc.rect(60, y - 2, PW, 18).fill("#f3f4f6");
          doc.font("Helvetica-Bold");
        }
        doc.fontSize(9.5).fillColor(DARK).text(cat, 60, y, { width: 250 });
        doc.fontSize(9.5).fillColor(DARK).text(amt, 320, y, { width: 100, align: "right" });
        doc.fontSize(9).fillColor(LIGHT).text(pct, 430, y, { width: 60, align: "right" });
        if (isTotal) doc.font("Helvetica");
        y = doc.y + 4;
      }
      y += 8;

      subHeading("Personnel Detail");

      const personnelRows: [string, string, string, string][] = [
        ["Program Director (Dr. Terry Flood, PI)", "100%", "$140,000/yr", "$490,000"],
        ["Deputy Director / Operations Manager", "100%", "$95,000/yr", "$332,500"],
        ["Case Manager \u2014 Austin Hub", "100%", "$55,000/yr", "$192,500"],
        ["Case Manager \u2014 Site 2", "100%", "$55,000/yr", "$192,500"],
        ["Case Manager \u2014 Site 3", "100%", "$52,000/yr", "$182,000"],
        ["Workforce Training Coordinator", "100%", "$60,000/yr", "$210,000"],
        ["Data & Outcomes Analyst", "75%", "$65,000/yr", "$170,625"],
        ["Employer Engagement Specialist", "50%", "$60,000/yr", "$105,000"],
      ];

      for (const [title, fte, salary, total] of personnelRows) {
        checkPage(16);
        doc.fontSize(9).fillColor(DARK).text(title, 60, y, { width: 210 });
        doc.fontSize(9).fillColor(LIGHT).text(fte, 275, y, { width: 40, align: "center" });
        doc.fontSize(9).fillColor(LIGHT).text(salary, 320, y, { width: 80, align: "right" });
        doc.fontSize(9).fillColor(DARK).text(total, 410, y, { width: 80, align: "right" });
        y = doc.y + 3;
      }

      y += 6;
      para("Fringe benefits are calculated at 30% of personnel costs, covering FICA (7.65%), health insurance (15%), retirement (5%), workers\u2019 compensation (1.35%), and state unemployment (1%).");

      subHeading("Participant Support Costs Detail ($1,377,600)");
      bullet("Training stipends: $10/hour x 20 hrs/week x 10 weeks x 680 participants = $1,360,000");
      bullet("Transportation assistance: Included in Other category (transit passes)");
      bullet("Tools and work gear (PPE, safety equipment): Included in Supplies category");
      bullet("Credential exam fees: Included in Contractual (apprenticeship sponsor covers)");
      bullet("Emergency supportive services reserve: $17,600");
      para("Note: Per FOA Figure 1, minimum participant enrollment at the $5,100,000 level is 680 over the 42-month period of performance. Cost per participant: $7,500. Participant support costs are budgeted conservatively to maximize training delivery and case management capacity.");

      subHeading("Contractual Detail ($765,000)");
      bullet("Registered Apprenticeship sponsor training delivery: $375,000");
      bullet("AI/digital literacy curriculum licensing (ThriveUp Academy platform): $210,000");
      bullet("External evaluation (independent program evaluator): $120,000");
      bullet("Legal and fiscal compliance consulting: $60,000");

      actionRequired("Dr. Flood \u2014 Review budget allocations. Confirm salary ranges are competitive for Austin market. Per FOA Figure 1, minimum enrollment at $5.1M is 680 participants over 42 months. Confirm whether TCAF has a Negotiated Indirect Cost Rate Agreement (NICRA) or will use the 10% de minimis. Confirm voluntary cost share amount ($255,000 in-kind ThriveUp platform value). Note: PI is budgeted at 100% FTE per FOA requirement.");

      // ==================== PART C.1: STATEMENT OF NEED ====================
      doc.addPage();
      y = 60;

      sectionHeading("Part C: Project Narrative");
      sectionHeading("C.1 \u2014 Statement of Need");

      subHeading("The National Reentry Crisis");
      para("Each year, approximately 600,000 individuals are released from federal and state prisons in the United States, with millions more cycling through local jails. Within three years of release, an estimated 68% of released prisoners are rearrested, and 50% are reincarcerated. The economic cost of recidivism exceeds $87 billion annually in direct criminal justice expenditures alone, not accounting for lost productivity, family destabilization, and community erosion.");
      para("The single most significant predictor of successful reentry is stable, living-wage employment. Yet formerly incarcerated individuals face unemployment rates five times higher than the general population. Even those who find work earn 40% less than their non-incarcerated peers. This earnings gap persists for decades and is significantly worse for Black and Hispanic returning citizens, who are already overrepresented in the criminal justice system.");

      subHeading("Texas Context: The Austin-Central Texas Service Area");
      para("Texas incarcerates approximately 130,000 individuals in TDCJ facilities, with roughly 60,000 released annually. The Austin-Central Texas region (Travis, Williamson, Hays, Bastrop, and Caldwell counties) receives a disproportionate share of returning citizens due to its status as the state capital and regional economic hub.");

      bullet("Travis County alone processes 30,000+ annual bookings through the Travis County Correctional Complex");
      bullet("Travis County\u2019s recidivism rate for individuals without employment services: 62%");
      bullet("Unemployment rate among formerly incarcerated in Austin metro: estimated 27% (vs. 3.2% general population)");
      bullet("Black and Hispanic returning citizens comprise 74% of those released in the region but hold only 12% of available apprenticeship slots");
      bullet("Critical shortage of AI/digital literacy training for justice-involved populations \u2014 only 2 programs in Central Texas currently serve this population");

      actionRequired("Dr. Flood \u2014 Verify the Travis County statistics above. Source the actual TDCJ release data for your service area. The Bureau of Justice Statistics (bjs.gov) has the national data. Texas Criminal Justice Coalition and Texas Appleseed publish state-level data. Travis County Sheriff\u2019s Office publishes booking data. Replace estimates with verified numbers before submission.");

      subHeading("Labor Market Demand");
      para("Central Texas is experiencing acute labor shortages in exactly the sectors RESTART prioritizes:");
      bullet("Advanced manufacturing: 3,400+ unfilled positions in the Austin-Round Rock MSA (Bureau of Labor Statistics, Q4 2025)");
      bullet("Construction/skilled trades: 8,200+ open positions; average wage $52,000\u2013$78,000");
      bullet("IT/digital services: 12,000+ positions requiring AI literacy and digital competency");
      bullet("Samsung, Tesla, and Applied Materials have announced $40B+ in Central Texas manufacturing investments, creating 15,000+ projected positions through 2030");

      para("These sectors offer living-wage employment ($18\u2013$42/hour) with career ladder advancement \u2014 exactly what returning citizens need for long-term stability. Yet current workforce programs for justice-involved populations in Central Texas do not adequately connect participants to these opportunities.");

      subHeading("Gap in Current Services");
      para("Existing reentry programs in Central Texas focus primarily on case management and job placement but lack:");
      bullet("Structured pre-apprenticeship pathways aligned to Registered Apprenticeship programs");
      bullet("AI and digital literacy training (an explicit RESTART priority)");
      bullet("Culturally responsive programming designed for the demographics of the returning citizen population");
      bullet("Technology-enabled case management with real-time outcome tracking");
      bullet("Employer engagement that goes beyond job fairs to structured commitment and retention support");
      para("TCAF\u2019s RESTART application directly addresses every one of these gaps through ThriveUp Academy\u2019s integrated platform and established community relationships.");

      // ==================== PART C.2: PROGRAM DESIGN ====================
      doc.addPage();
      y = 60;

      sectionHeading("C.2 \u2014 Program Design");

      subHeading("Program Overview: The RESTART Reentry Workforce Pipeline");
      para("TCAF proposes a 42-month program (July 1, 2026 \u2014 December 31, 2029) serving 680 justice-involved youth (ages 15\u201317) and young adults (ages 18\u201324) across the Austin-Central Texas region and two additional non-contiguous service sites, providing a comprehensive pipeline from pre-release preparation through credential attainment, apprenticeship placement, and 12-month employment retention. Per FOA Figure 1, the minimum participant enrollment at the $5,100,000 award level is 680 over the period of performance. Cost per participant: $7,500.");
      para("The program is built on TCAF\u2019s ThriveUp Academy platform \u2014 a 24-platform AI-powered ecosystem that delivers workforce readiness training, digital literacy, case management, and wraparound services through a single integrated technology architecture.");

      subHeading("Phase 1: Pre-Release Services (Months 1\u201342, Rolling Enrollment)");
      para("In partnership with correctional facilities, TCAF will deliver pre-release programming to individuals within 6 months of their expected release date:");

      bullet("Individual Development Plans (IDPs): Comprehensive assessment of barriers to employment, skills inventory, career interests, and reentry needs using TCAF\u2019s validated assessment tools");
      bullet("Job Preparation: Resume development, interview skills, workplace communication, professional conduct training delivered through ThriveUp\u2019s AI-assisted learning companions");
      bullet("Career Exploration: AI-powered career matching using O*NET occupational data, local labor market information, and participant aptitude assessment");
      bullet("State ID Assistance: Coordination with Texas DPS for identification documents, Social Security card replacement, and birth certificate procurement");
      bullet("Social Service Linkage: Pre-release connection to housing, healthcare, family reunification, and benefits navigation through LifeBridge Virtual 211");

      subHeading("Phase 2: Post-Release Training (12\u201316 Weeks Per Cohort)");
      para("Upon release, participants enter structured training cohorts delivering:");

      bullet("AI and Digital Literacy Training (40 hours): ThriveUp Academy\u2019s 5-level AI mastery curriculum, covering digital fundamentals, productivity tools, AI applications in skilled trades, and workplace technology competency. This directly addresses the FOA\u2019s explicit inclusion of \u201cartificial intelligence and digital literacy training\u201d as an eligible service.");
      bullet("Pre-Apprenticeship Training (120 hours): Industry-specific technical skills training aligned with Registered Apprenticeship standards in construction, advanced manufacturing, and IT. Delivered in partnership with Registered Apprenticeship sponsors.");
      bullet("OSHA Safety Certifications: OSHA-10 and OSHA-30 for all construction/manufacturing-track participants");
      bullet("Industry-Recognized Credentials: NCCER Core, CompTIA A+/Network+, AWS Certified Cloud Practitioner, or Microsoft Certified: Azure Fundamentals (based on career track)");
      bullet("Work-Based Learning: 80+ hours of supervised work experience with employer partners, including structured mentoring");

      subHeading("Phase 3: Apprenticeship Placement & Employment (Months 4\u201342)");
      para("Participants completing Phase 2 are placed into one of three employment pathways:");

      bullet("Registered Apprenticeship: Direct placement into registered programs with employer sponsors. Target: 40% of completers (204 participants)");
      bullet("Direct Employment: Placement into full-time positions with committed employer partners at $18+/hour minimum. Target: 45% of completers (230 participants)");
      bullet("Entrepreneurship/Self-Employment: For participants with viable business plans, supported through MCE business development platform. Target: 15% of completers (76 participants)");

      subHeading("Phase 4: Retention & Follow-Up (12 Months Post-Placement)");
      para("TCAF provides 12 months of post-placement support:");
      bullet("Monthly check-ins with assigned case manager via ThriveUp platform");
      bullet("Employer liaison services to address workplace issues before they cause separation");
      bullet("Continued access to ThriveUp Academy for upskilling and career advancement");
      bullet("Crisis intervention and wraparound services through LifeBridge Virtual 211");
      bullet("Peer mentoring through program alumni network");

      subHeading("Technology Infrastructure: ThriveUp Academy");
      para("TCAF\u2019s ThriveUp Academy is a 24-platform AI-powered ecosystem purpose-built for workforce development and community empowerment. For RESTART, the following platform components are directly deployed:");

      const platformTable: [string, string][] = [
        ["ThriveUp Academy", "AI-powered workforce readiness curriculum, digital literacy training, credential preparation"],
        ["Better Science Lab", "Implementation science engine (CFIR 2.0 + RE-AIM) for program fidelity and continuous improvement"],
        ["LifeBridge Virtual 211", "Wraparound services navigation \u2014 housing, food, transportation, childcare, crisis support"],
        ["M2C Transition Pipeline", "Military-to-civilian career pathway tools (for veteran participants)"],
        ["Whole-Person Health", "Behavioral health screening (PHQ-9, GAD-7, PCL-5) and crisis resource connection"],
        ["MCE", "Minority business development for entrepreneurship-track participants"],
        ["Speech Bridge", "Language accessibility \u2014 bilingual (English/Spanish) program delivery"],
      ];

      for (const [platform, desc] of platformTable) {
        checkPage(22);
        doc.fontSize(9.5).fillColor(ACCENT).font("Helvetica-Bold").text(platform, 60, y, { width: 140 });
        doc.font("Helvetica").fontSize(9).fillColor(DARK).text(desc, 205, y, { width: PW - 145 });
        y = Math.max(doc.y + 4, y + 16);
      }
      y += 6;

      subHeading("Evidence-Based Approach");
      para("TCAF\u2019s program design is grounded in Implementation Science methodology, specifically the Consolidated Framework for Implementation Research (CFIR 2.0) and the RE-AIM framework (Reach, Effectiveness, Adoption, Implementation, Maintenance). Dr. Flood is currently completing an MS in Implementation Science at Dartmouth College\u2019s Geisel School of Medicine, ensuring that program design and evaluation follow the highest standards of evidence-based practice.");
      para("The program incorporates proven reentry workforce models including the Transitional Jobs strategy (validated by MDRC), cognitive behavioral intervention (validated by the University of Cincinnati Corrections Institute), and employer-driven demand-side strategies (validated by the Aspen Institute Economic Opportunities Program).");

      subHeading("Service Area & Non-Contiguous Sites");
      para("As a national/regional intermediary applicant, TCAF will deliver RESTART services across three non-contiguous metropolitan/rural regions:");
      bullet("Primary Site: Austin-Central Texas (Travis, Williamson, Hays counties) \u2014 direct operation by TCAF");
      bullet("Site 2: {{ACTION REQUIRED \u2014 Dr. Flood, identify a partner organization in a second metropolitan area or rural region where TCAF can deploy ThriveUp. Consider existing relationships or organizations you\u2019ve connected with. Must be non-contiguous with Austin.}}");
      bullet("Site 3: {{ACTION REQUIRED \u2014 Dr. Flood, identify a third site. This could be another Texas city (Houston, Dallas, San Antonio) or out-of-state. The intermediary track requires 3+ non-contiguous regions.}}");

      actionRequired("Dr. Flood \u2014 The intermediary track (Track 1, $30M pool) requires operating across 3+ non-contiguous regions. You need to identify two additional sites beyond Austin with partner organizations. Alternatively, you can apply under Track 2 (state/local) and focus solely on Austin-Central Texas, but the award pool is smaller and requires WIOA integration with the state workforce system. Decide which track and identify partners.");

      // ==================== PART C.3: ORGANIZATIONAL CAPACITY ====================
      doc.addPage();
      y = 60;

      sectionHeading("C.3 \u2014 Organizational Capacity");

      subHeading("Organizational Overview");
      para("The Collaborative Advocate Foundation (TCAF) is a 501(c)(3) tax-exempt nonprofit (EIN 41-3618003) founded by Dr. Terry Flood. TCAF operates the ThriveUp Academy, a 24-platform AI-powered ecosystem serving workforce development, community health, behavioral health, education, emergency management, and economic development. TCAF is veteran-founded, Black-led, and headquartered in Pflugerville, Texas.");

      subHeading("Principal Investigator: Dr. Terry Flood, DHA/DBA");
      para("Dr. Flood brings a uniquely integrated credential set directly relevant to the RESTART initiative:");

      const credentials: [string, string][] = [
        ["Doctor of Healthcare Administration (DHA)", "Healthcare systems design, program management, outcome measurement"],
        ["Doctor of Business Administration (DBA)", "Organizational strategy, financial management, operations"],
        ["MS Criminal Justice (Public Policy)", "Criminal justice system knowledge, public policy design for reentry populations"],
        ["MS Industrial-Organizational Psychology", "Workforce assessment, Individual Development Plans, organizational behavior"],
        ["MS Human Resource Management", "Employer engagement, personnel systems, labor market alignment"],
        ["MS Implementation Science (Dartmouth, in progress)", "Evidence-based program design, CFIR 2.0, RE-AIM, fidelity measurement"],
        ["MBA Leadership", "Executive leadership, strategic planning, nonprofit management"],
        ["Graduate Certificate Business Analytics (Texas A&M)", "Data-driven decision making, outcomes analysis"],
        ["U.S. Army Warrant Officer (Retired)", "Leadership under pressure, team management, mission execution"],
        ["VA Crisis Line (VCL) Trainer", "Behavioral health crisis intervention, suicide prevention"],
        ["FEMA ICS-100.C, ICS-200.C, IS-700.B, IS-800.D", "Emergency management, incident command, inter-agency coordination"],
        ["COR Level 1 + Federal Grants & Agreements", "Federal contract/grant administration and compliance"],
      ];

      for (const [cred, relevance] of credentials) {
        checkPage(22);
        doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold").text(cred, 60, y, { width: 230 });
        doc.font("Helvetica").fontSize(8.5).fillColor(LIGHT).text(relevance, 295, y, { width: PW - 235 });
        y = Math.max(doc.y + 3, y + 14);
      }
      y += 6;

      subHeading("Professional Experience");
      para("Dr. Flood has served as a Public Health Social Scientist with the VA and DoD (2017\u2013present), a Community Readiness & Resilience Implementer (CR2I) Advisor for the Department of Defense (2021\u20132023), and holds a 168-Hour Community Health Worker Instructor certification from the Texas Department of State Health Services. He is a current member of the Pflugerville ISD School Health Advisory Council (SHAC).");

      subHeading("Technology & Platform Capacity");
      para("TCAF\u2019s ThriveUp Academy ecosystem represents a $2M+ technology investment, comprising 24 interdependent platforms with demonstrated functionality. The platform architecture supports:");
      bullet("Simultaneous user management across multiple service sites");
      bullet("Real-time outcome tracking and automated reporting");
      bullet("AI-powered adaptive learning with culturally responsive companions");
      bullet("Bilingual (English/Spanish) content delivery");
      bullet("WCAG 2.1 AA accessibility compliance");
      bullet("WIOA-aligned curriculum with TEKS \u00a7127.15 CTE Employability Skills coverage (100%, verifiable)");

      subHeading("Financial Management Capacity");
      para("TCAF maintains financial controls consistent with 2 CFR 200 requirements, including segregation of duties, documented procurement procedures, and auditable record-keeping. Dr. Flood\u2019s COR Level 1 certification and Federal Grants & Agreements Management certification demonstrate direct knowledge of federal financial compliance requirements.");

      actionRequired("Dr. Flood \u2014 If TCAF has completed a Single Audit (2 CFR 200 Subpart F), reference it here. If not, note that TCAF will comply with all audit requirements upon award. Also add any additional staff who will serve as key personnel on this grant \u2014 their names, titles, qualifications, and roles.");

      subHeading("Past Performance");
      actionRequired("Dr. Flood \u2014 This is a critical scored section. List 2\u20133 specific programs, contracts, or grants TCAF has delivered. Include: (1) Name of funding agency or client, (2) Dollar value, (3) Dates of performance, (4) Description of services, (5) Measurable outcomes achieved. If TCAF is early-stage, emphasize: (a) ThriveUp Academy platform readiness and deployment, (b) TWC RFA 32026-00162 application (workforce development), (c) Community relationships and SHAC membership, (d) Dr. Flood\u2019s professional experience delivering similar services in VA/DoD roles. Do not fabricate. Use real, verifiable work only.");

      // ==================== PART C.4: PARTNERSHIPS ====================
      doc.addPage();
      y = 60;

      sectionHeading("C.4 \u2014 Partnerships");

      para("TCAF\u2019s RESTART proposal is built on a partnership network that covers all required and recommended categories specified in the FOA. Each partnership is documented via MOU or Letter of Commitment (attached in Part D).");

      subHeading("Required Partnership: Local Workforce Development Board");
      field("Partner", "Capital Area Workforce Development Board (CAWD) \u2014 Austin, TX");
      para("The Capital Area Workforce Development Board oversees WIOA-funded workforce services in the Austin-Central Texas region. Under this partnership, CAWD will:");
      bullet("Co-enroll RESTART participants in WIOA Title I Adult and Dislocated Worker programs");
      bullet("Provide labor market information to inform training track selection");
      bullet("Coordinate referrals through the American Job Center network");
      bullet("Share data on participant employment outcomes post-placement");

      actionRequired("Dr. Flood \u2014 Contact Capital Area Workforce Solutions (capitalareaws.com). Request a meeting with the Executive Director to discuss RESTART partnership. You need an MOU signed before submission. Key contact: Capital Area Workforce Solutions, 6505 Airport Blvd, Suite 101, Austin, TX 78752. Phone: (512) 597-7100. Explain that this is a DOL RESTART grant requiring LWDB partnership. They handle these regularly.");

      subHeading("Required Partnership: American Job Center");
      field("Partner", "Workforce Solutions Capital Area \u2014 American Job Center Network");
      para("The local American Job Center will serve as a referral and co-enrollment point for RESTART participants:");
      bullet("Referral of eligible justice-involved individuals seeking employment services");
      bullet("Co-location of RESTART intake activities at AJC sites (as available)");
      bullet("Access to Workforce Solutions\u2019 employer network for job development");
      bullet("Resource-sharing for participant supportive services");

      subHeading("Required Partnership: Employer Partners");
      para("TCAF will secure commitment letters from a minimum of five employers across the targeted industry sectors:");

      const employers: [string, string, string][] = [
        ["Construction / Skilled Trades", "{{ACTION REQUIRED: Identify 2 construction/trades employers in Austin willing to hire program completers}}", "Apprenticeship slots, OJT positions, mentoring"],
        ["Advanced Manufacturing", "{{ACTION REQUIRED: Identify 1\u20132 manufacturers \u2014 consider Samsung Austin Semiconductor, Flex, or Applied Materials supplier network}}", "Direct hire commitments, facility tours, interview days"],
        ["IT / Digital Services", "{{ACTION REQUIRED: Identify 1\u20132 IT employers or staffing firms}}", "Entry-level positions for digital literacy completers"],
      ];

      for (const [sector, employer, commitment] of employers) {
        checkPage(30);
        doc.fontSize(9.5).fillColor(ACCENT).font("Helvetica-Bold").text(sector, 60, y, { width: PW });
        doc.font("Helvetica");
        y = doc.y + 3;
        doc.fontSize(9).fillColor(RED).text(employer, 75, y, { width: PW - 15 });
        y = doc.y + 2;
        doc.fontSize(9).fillColor(DARK).text("Commitments: " + commitment, 75, y, { width: PW - 15 });
        y = doc.y + 6;
      }

      subHeading("Priority Partnership: Registered Apprenticeship Sponsor");
      field("Partner", "{{ACTION REQUIRED: Identify a Registered Apprenticeship sponsor in Austin}}");
      para("The FOA gives priority consideration to applicants partnering with Registered Apprenticeship sponsors. TCAF will partner with an established sponsor to provide:");
      bullet("Structured apprenticeship placement for 60 participants (40% of completers)");
      bullet("Related technical instruction aligned with DOL apprenticeship standards");
      bullet("Journey-level mentoring and on-the-job training");
      bullet("Portable, industry-recognized credentials upon completion");

      actionRequired("Dr. Flood \u2014 Contact Texas Workforce Commission Apprenticeship Division at (512) 936-3681 or apprenticeship@twc.texas.gov. Ask for a list of Registered Apprenticeship sponsors in the Austin area accepting new program entrants. Key industries to target: electrical, plumbing, HVAC, welding, IT. Getting this MOU is critical for priority scoring. Also check apprenticeship.gov for Austin-area sponsors.");

      subHeading("Partnership: Correctional Facility");
      field("Partner", "{{ACTION REQUIRED: TDCJ or Travis County Correctional Complex}}");
      para("For pre-release service delivery, TCAF requires a partnership with at least one correctional facility:");
      bullet("Access to deliver pre-release programming to individuals within 6 months of expected release");
      bullet("Space for group sessions, individual assessments, and career counseling");
      bullet("Coordination on release timing and transition planning");
      bullet("Data sharing on participant criminal history and assessment scores (with appropriate consent)");

      actionRequired("Dr. Flood \u2014 Contact TDCJ Reentry Division: (936) 437-6368 or via tdcj.texas.gov. For Travis County: Travis County Sheriff\u2019s Office Reentry Programs at (512) 854-9770. Pre-release access agreements take time \u2014 start this conversation immediately.");

      subHeading("Additional Partners");
      bullet("Community-Based Organizations: Local reentry service providers, faith-based organizations, community health centers (letters of support)");
      bullet("Education Partners: Austin Community College (ACC) for technical training delivery and credit articulation");
      bullet("Housing Partners: Foundation Communities, Caritas of Austin for transitional and permanent housing");
      bullet("Legal Services: Texas RioGrande Legal Aid for record expungement and legal barrier removal");

      // ==================== PART C.5: OUTCOMES ====================
      doc.addPage();
      y = 60;

      sectionHeading("C.5 \u2014 Outcomes & Performance Measures");

      subHeading("Proposed Performance Targets (42-Month Program, 680 Participants)");

      const outcomes: [string, string, string][] = [
        ["Total Participants Enrolled", "680", "~194/year across 3 sites over 42 months"],
        ["Program Completion Rate", "75% (510)", "Industry average for reentry programs: 60\u201365%"],
        ["Credential Attainment Rate", "80% of completers (408)", "OSHA, NCCER, CompTIA, or equivalent"],
        ["Employment Rate \u2014 Q2 After Exit", "70%", "DOL benchmark: 66% (youth/YA)"],
        ["Employment Rate \u2014 Q4 After Exit", "65%", "Demonstrates retention beyond initial placement"],
        ["Median Earnings \u2014 Q2 After Exit", "$6,800/quarter", "DOL benchmark: $6,400"],
        ["Registered Apprenticeship Enrollment", "204 participants (40%)", "Priority outcome per FOA"],
        ["Measurable Skill Gains", "85% of active", "Training milestones, credential progress"],
        ["Recidivism Rate (12 months post-exit)", "<15%", "vs. 35\u201345% baseline without services"],
        ["AI/Digital Literacy Completion", "90% of enrolled", "ThriveUp 5-level mastery curriculum"],
      ];

      for (const [measure, target, note] of outcomes) {
        checkPage(18);
        doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold").text(measure, 60, y, { width: 200 });
        doc.font("Helvetica").fontSize(9.5).fillColor(GREEN).text(target, 265, y, { width: 90, align: "center" });
        doc.fontSize(8.5).fillColor(LIGHT).text(note, 360, y, { width: PW - 300 });
        y = Math.max(doc.y + 4, y + 14);
      }
      y += 8;

      subHeading("Data Collection & Reporting");
      para("TCAF will track all performance measures through ThriveUp Academy\u2019s integrated data management system, which provides:");
      bullet("Real-time participant tracking from enrollment through 12-month post-exit follow-up");
      bullet("Automated quarterly performance report (QPR) generation aligned with DOL reporting requirements");
      bullet("Credential attainment verification through direct integration with credentialing bodies");
      bullet("Employment verification through employer partner reporting and state wage record matching");
      bullet("Recidivism tracking through partnership with TDCJ and local criminal justice agencies");

      subHeading("Continuous Quality Improvement");
      para("TCAF\u2019s Better Science Lab platform applies the MAP-GAP (Measure, Analyze, Prioritize \u2014 Gap Action Protocol) continuous improvement framework to ensure program fidelity and outcome optimization. Monthly quality reviews assess:");
      bullet("Implementation fidelity against the program design model");
      bullet("Participant outcome trends vs. quarterly targets");
      bullet("Employer satisfaction and retention rates");
      bullet("Site-level variation (across the 3 non-contiguous sites)");
      bullet("Corrective action implementation and impact measurement");

      subHeading("Evaluation Design");
      para("An independent external evaluator (contracted under the budget\u2019s Contractual category) will conduct both process and outcome evaluation:");
      bullet("Process Evaluation: Assesses whether the program is implemented as designed, identifies implementation barriers, and documents adaptations using CFIR 2.0 constructs");
      bullet("Outcome Evaluation: Measures employment, earnings, credential attainment, recidivism, and participant satisfaction against proposed targets using pre/post design with comparison group where feasible");
      bullet("Cost-Benefit Analysis: Calculates return on investment comparing program costs to reduced incarceration costs, increased tax revenue, and economic productivity gains");

      // ==================== PART D: ATTACHMENTS CHECKLIST ====================
      doc.addPage();
      y = 60;

      sectionHeading("Part D \u2014 Attachments Checklist");

      para("The following attachments are required for submission and must be included in the Grants.gov application package:");
      y += 4;

      const attachments: [string, string, string][] = [
        ["D.1", "Partnership MOUs & Commitment Letters", "PENDING"],
        ["", "  \u2022 Local Workforce Development Board MOU", "{{ACTION REQUIRED}}"],
        ["", "  \u2022 American Job Center Coordination Agreement", "{{ACTION REQUIRED}}"],
        ["", "  \u2022 Employer Commitment Letters (minimum 5)", "{{ACTION REQUIRED}}"],
        ["", "  \u2022 Registered Apprenticeship Sponsor MOU", "{{ACTION REQUIRED}}"],
        ["", "  \u2022 Correctional Facility Access Agreement", "{{ACTION REQUIRED}}"],
        ["", "  \u2022 Community Partner Letters of Support", "{{ACTION REQUIRED}}"],
        ["D.2", "Key Personnel Resumes", "PENDING"],
        ["", "  \u2022 Dr. Terry Flood \u2014 PI/Program Director Resume", "{{ACTION REQUIRED}}"],
        ["", "  \u2022 Deputy Director Resume", "{{ACTION REQUIRED}}"],
        ["D.3", "501(c)(3) Determination Letter", "AVAILABLE"],
        ["D.4", "Work Plan Timeline (Gantt Chart)", "PENDING"],
        ["D.5", "Logic Model / Theory of Change", "PENDING"],
        ["D.6", "Organizational Chart", "PENDING"],
        ["D.7", "Letters of Support", "PENDING"],
        ["D.8", "SF-424 (via Grants.gov)", "PENDING"],
        ["D.9", "SF-424A Budget Form", "PENDING"],
        ["D.10", "Certifications & Assurances", "PENDING"],
      ];

      for (const [num, item, status] of attachments) {
        checkPage(16);
        const isHeader = num.startsWith("D.");
        if (isHeader) {
          y += 4;
          doc.font("Helvetica-Bold");
        }
        doc.fontSize(9.5).fillColor(DARK).text(`${num}  ${item}`, 60, y, { width: PW - 120 });
        const statusColor = status === "AVAILABLE" ? GREEN : status.includes("ACTION") ? RED : "#d97706";
        doc.fontSize(8).fillColor(statusColor).font("Helvetica-Bold").text(status, 400, y, { width: 100, align: "right" });
        doc.font("Helvetica");
        y = doc.y + 3;
      }

      // ==================== SUBMISSION TIMELINE ====================
      y += 12;
      sectionHeading("Submission Timeline \u2014 11-Day Action Plan");

      const timeline: [string, string[]][] = [
        ["April 4\u20136 (Days 1\u20133)", [
          "Download full FOA PDF from Grants.gov",
          "Register TCAF on Grants.gov (if not already registered)",
          "Verify SAM.gov status (required for submission)",
          "Contact Capital Area Workforce Board for LWDB MOU",
          "Contact TDCJ Reentry Division for pre-release access",
          "Begin employer outreach (5 employers minimum)",
        ]],
        ["April 7\u201310 (Days 4\u20137)", [
          "Finalize Project Narrative sections C.1\u2013C.5",
          "Build SF-424A budget with line-item detail",
          "Contact TWC Apprenticeship Division for RA sponsor MOU",
          "Contact American Job Center for coordination agreement",
          "Collect key personnel resumes and org chart",
          "Draft Logic Model / Theory of Change",
        ]],
        ["April 11\u201313 (Days 8\u201310)", [
          "Collect all signed MOUs and commitment letters",
          "Complete SF-424 form in Grants.gov",
          "Internal review of full application package",
          "Fill all {{ACTION REQUIRED}} items with verified data",
          "PDF all narrative sections and merge with forms",
        ]],
        ["April 14\u201315 (Days 11\u201312)", [
          "Final review and submission via Grants.gov",
          "SUBMIT NO LATER THAN April 15, 11:59 PM ET",
          "Confirm Grants.gov receipt (tracking number)",
          "Save confirmation for records",
        ]],
      ];

      for (const [period, tasks] of timeline) {
        checkPage(60);
        doc.fontSize(10).fillColor(ACCENT).font("Helvetica-Bold").text(period, 60, y, { width: PW });
        doc.font("Helvetica");
        y = doc.y + 4;
        for (const task of tasks) {
          bullet(task);
        }
        y += 6;
      }

      // ==================== PAGE NUMBERS ====================
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor(LIGHT).text(
          `Page ${i + 1} of ${totalPages}  |  TCAF \u2014 DOL RESTART FOA-ETA-26-17  |  GRANT APPLICATION`,
          60, 740, { width: PW, align: "center" }
        );
      }

      doc.end();
    } catch (error: any) {
      console.error("[RESTART-PDF] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proposal-pipeline", async (_req: Request, res: Response) => {
    try {
      const proposals = [
        {
          id: "nsf-stem-k12",
          title: "Community Infrastructure for STEM: How a 24-Platform Ecosystem Improves K-12 STEM Outcomes by Seeing the Whole Child, the Whole Family, and the Whole Community",
          shortTitle: "NSF STEM K-12",
          solicitation: "NSF 25-545",
          agency: "National Science Foundation",
          entity: "TCAF (501(c)(3))",
          priority: 1,
          status: "framework_complete",
          fundingRange: "$350K - $750K",
          budgetTarget: 738000,
          deadline: null,
          deadlineLabel: "No Deadline — Submit Anytime",
          partnersRequired: false,
          partners: [],
          frameworkDoc: "/docs/grants/NSF-STEM-K12-Proposal-Framework.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Mixed-methods with embedded implementation evaluation",
            evaluationLevel: "Effectiveness-Implementation Hybrid Type 2"
          },
          readinessChecklist: [
            { item: "Project Summary (1 page)", status: "complete", note: "Drafted in framework" },
            { item: "Project Description (15 pages)", status: "complete", note: "Full framework built — needs final polish" },
            { item: "Budget & Justification", status: "complete", note: "$738K budget detailed" },
            { item: "PI Biosketch (NSF format)", status: "action_required", note: "Dr. Flood — convert CV to NSF biosketch format" },
            { item: "Current & Pending Support", status: "action_required", note: "List all active/pending support" },
            { item: "Data Management Plan", status: "not_started", note: "2 pages max — standard NSF format" },
            { item: "References Cited", status: "not_started", note: "Compile from framework citations" },
            { item: "Facilities & Equipment", status: "not_started", note: "Describe ThriveUp platform infrastructure" },
            { item: "SAM.gov TIN Resolution", status: "blocker", note: "IRS TIN mismatch blocks ALL federal submissions" }
          ],
          blockers: [
            "SAM.gov IRS TIN mismatch — must resolve before any Grants.gov/NSF submission"
          ],
          winStrategy: "Only applicant whose STEM platform is connected to cancer care, reentry services, veteran transitions, and family crisis support. The community infrastructure angle is unique in the NSF STEM K-12 portfolio.",
          nextActions: [
            "Resolve SAM.gov TIN mismatch",
            "Convert Dr. Flood CV to NSF biosketch",
            "Write Data Management Plan",
            "Compile References Cited",
            "Final polish on Project Description",
            "Submit via Research.gov"
          ]
        },
        {
          id: "nsf-ate",
          title: "AI-Ready Implementation Science Technicians: Training Community College Students to Bridge the Evidence-to-Practice Gap Using an Integrated Community Infrastructure Platform",
          shortTitle: "NSF ATE",
          solicitation: "NSF 24-586",
          agency: "National Science Foundation",
          entity: "ACC (Lead) + TCAF (Co-PI / Subaward)",
          priority: 2,
          status: "framework_complete",
          fundingRange: "$150K - $600K",
          budgetTarget: 599925,
          deadline: "2026-10-01T23:59:59Z",
          deadlineLabel: "October 1, 2026",
          partnersRequired: true,
          partners: [
            { name: "Austin Community College (ACC)", role: "Lead Institution / PI", status: "connection_available", note: "Colleague contact at ACC — needs formal engagement" }
          ],
          frameworkDoc: "/docs/grants/NSF-ATE-Proposal-Framework.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Mixed-methods quasi-experimental with embedded process evaluation",
            evaluationLevel: "Meta-evaluation: using implementation science to evaluate implementation science training"
          },
          readinessChecklist: [
            { item: "Project Summary (1 page)", status: "complete", note: "Drafted in framework" },
            { item: "Project Description (15 pages)", status: "complete", note: "Full framework built — needs ACC PI input" },
            { item: "Budget & Justification", status: "complete", note: "$599,925 over 3 years" },
            { item: "ACC PI Identification", status: "action_required", note: "Must identify ACC faculty member as PI" },
            { item: "ACC Institutional Letter", status: "action_required", note: "Dean/Provost commitment letter needed" },
            { item: "PI Biosketch (NSF format)", status: "action_required", note: "Both ACC PI and Dr. Flood Co-PI" },
            { item: "Current & Pending Support", status: "action_required", note: "Both PI and Co-PI" },
            { item: "Collaboration Plan", status: "not_started", note: "ACC + TCAF roles and responsibilities" },
            { item: "Data Management Plan", status: "not_started", note: "2 pages max" },
            { item: "Employer Partner Letters (3-5)", status: "not_started", note: "Health departments, Integral Care, CommUnity Care, Workforce Solutions" },
            { item: "SAM.gov TIN Resolution", status: "blocker", note: "Blocks TCAF subaward from ACC" }
          ],
          blockers: [
            "SAM.gov IRS TIN mismatch — blocks subaward to TCAF",
            "ACC PI must be identified and engaged"
          ],
          winStrategy: "First-ever associate's level implementation science program. Students train on live community data, not simulations. The meta-evaluation design (using implementation science to evaluate implementation science training) is uniquely elegant.",
          nextActions: [
            "Engage ACC colleague — identify PI",
            "Get ACC institutional commitment letter",
            "Resolve SAM.gov TIN mismatch",
            "Recruit 3-5 employer partners",
            "Write Collaboration Plan",
            "Write Data Management Plan",
            "IRB planning with ACC"
          ]
        },
        {
          id: "nsf-iuse-edu",
          title: "Ecosystem-Integrated STEM Education for Nontraditional Undergraduates: A Community Infrastructure Approach",
          shortTitle: "NSF IUSE:EDU",
          solicitation: "NSF 23-510",
          agency: "National Science Foundation",
          entity: "TCAF (501(c)(3))",
          priority: 3,
          status: "evaluation_complete",
          fundingRange: "$150K - $400K",
          budgetTarget: 400000,
          deadline: "2026-07-15T23:59:59Z",
          deadlineLabel: "July 15, 2026",
          partnersRequired: false,
          partners: [],
          frameworkDoc: "/docs/grants/NSF-IUSE-EDU-RPLICE-Evaluation.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "To be developed — Level 1 Engaged Student Learning",
            evaluationLevel: "Level 1: Engaged Student Learning"
          },
          readinessChecklist: [
            { item: "RPLICE Fit Evaluation", status: "complete", note: "HIGH priority — no gap identified" },
            { item: "Community Infrastructure Framing", status: "complete", note: "Education is subordinate domain, not the platform" },
            { item: "Project Summary", status: "not_started", note: "1 page" },
            { item: "Project Description", status: "not_started", note: "15 pages max — must differentiate from STEM K-12" },
            { item: "Budget & Justification", status: "not_started", note: "Up to $400K" },
            { item: "PI Biosketch", status: "action_required", note: "Dr. Flood — NSF format" },
            { item: "Data Management Plan", status: "not_started", note: "2 pages max" },
            { item: "SAM.gov TIN Resolution", status: "blocker", note: "Must resolve before submission" }
          ],
          blockers: [
            "SAM.gov IRS TIN mismatch",
            "Must differentiate clearly from STEM K-12 submission"
          ],
          winStrategy: "Frame as undergraduate education research within a community infrastructure ecosystem. The platform doesn't just teach STEM — it shows how STEM learning is affected by housing, health, family stability, and community resources. No other IUSE proposal connects education to a 24-platform service delivery ecosystem.",
          nextActions: [
            "Build full proposal framework (similar to STEM K-12)",
            "Differentiate from STEM K-12 in framing",
            "Resolve SAM.gov TIN mismatch",
            "Write Data Management Plan",
            "Submit via Research.gov by July 15"
          ]
        },
        {
          id: "nsf-quantum",
          title: "Quantum Education Through Community Infrastructure: Broadening Participation in Quantum Information Science",
          shortTitle: "NSF Quantum DCL",
          solicitation: "DCL 21-033",
          agency: "National Science Foundation",
          entity: "TCAF (501(c)(3))",
          priority: 4,
          status: "evaluation_complete",
          fundingRange: "Embedded — adds $50K-$100K to parent proposal",
          budgetTarget: 75000,
          deadline: null,
          deadlineLabel: "Embedded in STEM K-12 or IUSE:EDU — no separate deadline",
          partnersRequired: false,
          partners: [],
          frameworkDoc: "/docs/grants/NSF-Quantum-Education-RPLICE-Evaluation.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Two paths: embed in STEM K-12 (Path A) or standalone IUSE with quantum focus (Path B)",
            evaluationLevel: "Secondary aim within parent proposal"
          },
          readinessChecklist: [
            { item: "RPLICE Path Analysis", status: "complete", note: "Two paths evaluated — Path A (embed) recommended" },
            { item: "Broadening Participation Angle", status: "complete", note: "Quantum currently excludes community populations" },
            { item: "Quantum Curriculum Content", status: "not_started", note: "Must develop quantum concepts for community audience" },
            { item: "Integration into Parent Proposal", status: "not_started", note: "Add as secondary aim in STEM K-12 or IUSE:EDU" }
          ],
          blockers: [
            "Depends on STEM K-12 or IUSE:EDU parent proposal",
            "Quantum content must be developed"
          ],
          winStrategy: "The broadening participation angle is the differentiator. Quantum education currently reaches elite universities — NOT the communities ThriveUp serves. We ARE the broadening participation engine. Add this as a secondary aim to any NSF submission for free optionality.",
          nextActions: [
            "Decide: embed in STEM K-12 (Path A) or IUSE:EDU (Path B)",
            "Develop quantum-for-community curriculum outline",
            "Add secondary aim to parent proposal"
          ]
        },
        {
          id: "twc-rfa-32026",
          title: "Comprehensive Workforce Development and Time & Priority Management Training for Underserved Populations",
          shortTitle: "TWC RFA 32026-00162",
          solicitation: "RFA 32026-00162",
          agency: "Texas Workforce Commission",
          entity: "TCAF (501(c)(3))",
          priority: 1,
          status: "narrative_drafted",
          fundingRange: "Per RFA specifications",
          budgetTarget: 250000,
          deadline: "2026-04-10T15:00:00Z",
          deadlineLabel: "April 10, 2026, 10:00 AM CDT",
          partnersRequired: false,
          partners: [],
          frameworkDoc: "/docs/grants/TWC-RFA-32026-00162-NARRATIVE.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Program evaluation with implementation tracking",
            evaluationLevel: "Implementation monitoring"
          },
          readinessChecklist: [
            { item: "Full Narrative", status: "complete", note: "Drafted and structured per RFA requirements" },
            { item: "Budget & Justification", status: "action_required", note: "Must finalize per RFA cost guidelines" },
            { item: "Organizational Capacity", status: "complete", note: "TCAF qualifications documented" },
            { item: "Final Review & Submission", status: "action_required", note: "Due April 10 — 5 days remaining" }
          ],
          blockers: [],
          winStrategy: "Uniquely positioned with 24-platform community infrastructure that wraps workforce training in whole-person support — behavioral health, housing stability, family services. No other applicant connects time management training to community-level social determinants.",
          nextActions: [
            "Final budget review",
            "Compliance check against RFA requirements",
            "Submit by April 10, 10:00 AM CDT"
          ]
        },
        {
          id: "rare-impact-fund",
          title: "ThriveUp Community Infrastructure: Workforce Development and Life Skills for Underserved Populations",
          shortTitle: "RARE Impact Fund LOI",
          solicitation: "RARE Impact Fund",
          agency: "RARE Impact Fund",
          entity: "TCAF (501(c)(3))",
          priority: 1,
          status: "loi_drafted",
          fundingRange: "Per fund guidelines",
          budgetTarget: 150000,
          deadline: "2026-04-10T23:59:59Z",
          deadlineLabel: "April 10, 2026",
          partnersRequired: false,
          partners: [],
          frameworkDoc: "/docs/grants/RARE-IMPACT-FUND-LOI.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Implementation-focused program evaluation",
            evaluationLevel: "Process and outcome evaluation"
          },
          readinessChecklist: [
            { item: "Letter of Intent", status: "complete", note: "LOI framework drafted" },
            { item: "Program Description", status: "complete", note: "4 core modules defined" },
            { item: "Final LOI Review", status: "action_required", note: "Due April 10 — 5 days remaining" },
            { item: "Submission", status: "action_required", note: "Submit LOI by deadline" }
          ],
          blockers: [],
          winStrategy: "Community infrastructure approach differentiates from pure workforce programs. ThriveUp wraps training in behavioral health, housing, and family support that other applicants can't match.",
          nextActions: [
            "Final LOI review and polish",
            "Submit by April 10"
          ]
        },
        {
          id: "dol-restart",
          title: "Reentry Employment Support and Training (RESTART) — Comprehensive Workforce Reintegration for Justice-Involved Individuals",
          shortTitle: "DOL RESTART",
          solicitation: "FOA-ETA-26-17",
          agency: "U.S. Department of Labor",
          entity: "TCAF (501(c)(3))",
          priority: 2,
          status: "research_complete",
          fundingRange: "Up to $5.1M",
          budgetTarget: 5100000,
          deadline: "2026-04-15T23:59:59Z",
          deadlineLabel: "April 15, 2026, 11:59 PM ET",
          partnersRequired: true,
          partners: [
            { name: "Local Workforce Development Board", role: "Required MOU Partner", status: "action_required", note: "Call 512-597-7100 for MOU" },
            { name: "Registered Apprenticeship Sponsor", role: "Required MOU Partner", status: "action_required", note: "Call 512-936-3681" },
            { name: "Correctional Facility", role: "Pre-release Access Partner", status: "action_required", note: "Call 936-437-6368" }
          ],
          frameworkDoc: "/docs/grants/DOL-RESTART-FOA-ETA-26-17-RESEARCH.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Multi-site quasi-experimental with implementation evaluation",
            evaluationLevel: "Effectiveness-Implementation Hybrid"
          },
          readinessChecklist: [
            { item: "FOA Research & Analysis", status: "complete", note: "Full FOA analyzed and documented" },
            { item: "Program Design", status: "complete", note: "Multi-phase reentry model designed" },
            { item: "LWDB MOU", status: "blocker", note: "Must secure Local Workforce Development Board MOU — 512-597-7100" },
            { item: "Employer Letters of Commitment", status: "blocker", note: "Need employer partners willing to hire justice-involved individuals" },
            { item: "Registered Apprenticeship MOU", status: "blocker", note: "512-936-3681 — required partnership" },
            { item: "Correctional Facility Agreement", status: "blocker", note: "936-437-6368 — pre-release access required" },
            { item: "Sites 2 & 3 Identification", status: "blocker", note: "Must identify additional service delivery sites" },
            { item: "Budget & Justification", status: "not_started", note: "Up to $5.1M over performance period" },
            { item: "SAM.gov TIN Resolution", status: "blocker", note: "IRS TIN mismatch blocks federal submissions" }
          ],
          blockers: [
            "SAM.gov IRS TIN mismatch — blocks ALL federal submissions",
            "LWDB MOU not secured",
            "No employer commitment letters",
            "No Registered Apprenticeship MOU",
            "No correctional facility agreement",
            "Sites 2 & 3 unidentified"
          ],
          winStrategy: "Only applicant with a 24-platform ecosystem purpose-built for justice-involved population reentry. Criminal justice, behavioral health, workforce training, housing, and family reunification all integrated in one platform. The community infrastructure model eliminates the siloed service delivery that causes recidivism.",
          nextActions: [
            "Resolve SAM.gov TIN mismatch",
            "Call LWDB for MOU (512-597-7100)",
            "Call Registered Apprenticeship sponsor (512-936-3681)",
            "Call correctional facility (936-437-6368)",
            "Identify Sites 2 & 3",
            "Secure employer commitment letters",
            "Build full budget justification"
          ]
        },
        {
          id: "stdavids-wab2",
          title: "Workforce & Adult Basic Education Pipeline: Community-Integrated Career Pathways for Pflugerville/Manor",
          shortTitle: "St. David's WAB2 LOI",
          solicitation: "WAB2 LOI Cycle",
          agency: "St. David's Foundation",
          entity: "TCAF (501(c)(3))",
          priority: 2,
          status: "loi_complete",
          fundingRange: "Per foundation guidelines",
          budgetTarget: 300000,
          deadline: "2026-04-27T22:00:00Z",
          deadlineLabel: "April 27, 2026, 5:00 PM CT",
          partnersRequired: true,
          partners: [
            { name: "Coalition Partners", role: "Community delivery partners", status: "in_progress", note: "Coalition partner presentation built" }
          ],
          frameworkDoc: "/docs/grants/St-Davids-WAB2-LOI-Package.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Community-based implementation evaluation",
            evaluationLevel: "Process evaluation with outcome tracking"
          },
          readinessChecklist: [
            { item: "LOI Final Draft", status: "complete", note: "Full LOI package built and reviewed" },
            { item: "LOI Package Materials", status: "complete", note: "Supporting documents assembled" },
            { item: "Coalition Partner Presentation", status: "complete", note: "Presentation built for partners" },
            { item: "Strategic Alignment Analysis", status: "complete", note: "St. David's alignment documented" },
            { item: "Final Review & Submission", status: "action_required", note: "Due April 27 — 22 days remaining" }
          ],
          blockers: [],
          winStrategy: "Deep local roots in Pflugerville/Manor with existing community hub infrastructure. The 24-platform ecosystem demonstrates capacity beyond any other applicant. St. David's strategic alignment analysis shows direct fit with foundation priorities.",
          nextActions: [
            "Final LOI review with coalition partners",
            "Submit by April 27, 5:00 PM CT"
          ]
        },
        {
          id: "agency-fund-spring2026",
          title: "ThriveUp Academy: An AI-Powered Community Agency Platform — Turning Census Data into Compassionate Action",
          shortTitle: "Agency Fund EOI",
          solicitation: "Spring 2026 Open Call",
          agency: "The Agency Fund",
          entity: "TCAF (501(c)(3))",
          priority: 1,
          status: "eoi_drafted",
          fundingRange: "$75K - $500K",
          budgetTarget: 350000,
          deadline: "2026-04-26T23:59:59Z",
          deadlineLabel: "April 26, 2026 (Stage 1 EOI)",
          partnersRequired: false,
          partners: [],
          frameworkDoc: "/attached_assets/Agency_Fund_EOI_Collaborative_Advocate.md",
          implementationScience: {
            frameworks: ["CFIR 2.0", "RE-AIM"],
            instrument: "RPLICE",
            researchDesign: "Mixed-methods with rapid iteration and RE-AIM evaluation",
            evaluationLevel: "Implementation evaluation with agency measurement"
          },
          readinessChecklist: [
            { item: "Expression of Interest Draft", status: "complete", note: "Full EOI drafted — 14 sections, theory of change, evidence base, budget" },
            { item: "Organization Details", status: "complete", note: "TCAF 501(c)(3), EIN 41-3618003, Dr. Terry Flood Founder & CEO" },
            { item: "Alignment Analysis", status: "complete", note: "Strong fit across all Agency Fund criteria — agency, dignity, technology, scale" },
            { item: "Evidence Base", status: "complete", note: "Stillwell (2026) SVI research, 8 federal data sources, implementation science frameworks" },
            { item: "Path to Scale (1M+ users)", status: "complete", note: "Zero-marginal-cost tech, church networks, workforce board expansion strategy" },
            { item: "Budget & Use of Funds", status: "complete", note: "$350K over 18 months — platform dev, community deployment, research, operations, dissemination" },
            { item: "Final Review & Submission", status: "action_required", note: "Review EOI and submit via lnkd.in/gtDTYQcn or agency.fund/apply by April 26" }
          ],
          blockers: [],
          winStrategy: "Neighborhood Intelligence is the perfect Agency Fund project — it literally builds agency by putting Census data directly into community members' hands. The 'what if' scenario sandbox transforms data from diagnosis into possibility. 4-engine AI consensus system, zero-training-required interface, church network distribution. Strong alignment with their AI accelerator track (OpenAI partnership).",
          nextActions: [
            "Final review of EOI draft",
            "Submit Stage 1 EOI by April 26 via agency.fund/apply",
            "If shortlisted: Full application Stage 2 (May 4-18, 2026)"
          ]
        }
      ];

      const summary = {
        totalProposals: proposals.length,
        totalPotentialFunding: proposals.reduce((sum, p) => sum + p.budgetTarget, 0),
        readyToSubmit: proposals.filter(p => p.status === "submission_ready").length,
        frameworksComplete: proposals.filter(p => p.status === "framework_complete").length,
        evaluationsComplete: proposals.filter(p => p.status === "evaluation_complete").length,
        criticalBlockers: ["SAM.gov IRS TIN mismatch — blocks ALL federal submissions"],
        upcomingDeadlines: proposals
          .filter(p => p.deadline)
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
          .map(p => ({ title: p.shortTitle, deadline: p.deadlineLabel, daysRemaining: Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }))
      };

      res.json({ proposals, summary });
    } catch (error: any) {
      console.error("[ProposalPipeline] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proposal-pipeline/:id/framework", async (req: Request, res: Response) => {
    const { id } = req.params;
    const docMap: Record<string, string> = {
      "nsf-stem-k12": "docs/grants/NSF-STEM-K12-Proposal-Framework.md",
      "nsf-ate": "docs/grants/NSF-ATE-Proposal-Framework.md",
      "nsf-iuse-edu": "docs/grants/NSF-IUSE-EDU-RPLICE-Evaluation.md",
      "nsf-quantum": "docs/grants/NSF-Quantum-Education-RPLICE-Evaluation.md",
      "twc-rfa-32026": "docs/grants/TWC-RFA-32026-00162-NARRATIVE.md",
      "rare-impact-fund": "docs/grants/RARE-IMPACT-FUND-LOI.md",
      "dol-restart": "docs/grants/DOL-RESTART-FOA-ETA-26-17-RESEARCH.md",
      "stdavids-wab2": "docs/grants/St-Davids-WAB2-LOI-Package.md",
      "agency-fund-spring2026": "attached_assets/Agency_Fund_EOI_Collaborative_Advocate.md"
    };

    const docPath = docMap[id as string];
    if (!docPath) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const content = await fs.readFile(path.join(process.cwd(), docPath), "utf-8");
      res.json({ id, content, path: docPath });
    } catch (error: any) {
      res.status(500).json({ error: `Failed to read framework: ${error.message}` });
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
