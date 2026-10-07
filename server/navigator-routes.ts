import type { Express, Request } from "express";
import { groundContacts } from "./contact-grounding";
import { randomUUID } from "crypto";
import { navigatorHonesty } from "./inference-honesty-adapter";
import { db } from "./storage";
import {
  streamAIResponse,
  generateAIJSON,
  withEthicalPreamble,
  perplexityResearch,
  isPerplexityAvailable,
} from "./ai-provider";
import {
  fetchNonprofitProfile,
  formatNonprofitProfileBlock,
} from "./nonprofit-lookup";
import { collaborativeStream } from "./collaborative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import {
  searchByState,
  searchByLocation,
  generateCommunityNarrative,
} from "./gis-engine";
import { buildCommunityAIContext } from "./rplice-intelligence";
import { searchResources, getResourceCategories } from "./resource-engine";
import {
  navigatorConversations,
  navigatorMessages,
  communityPartners,
  grantOpportunities,
  gisContextData,
  cedsRegions,
  cedsGoals,
  cedsAlignments,
  gunViolenceIncidents,
  zctaCountyMap,
} from "@shared/schema";
import { eq, desc, and, like, sql, inArray } from "drizzle-orm";
import { mergeJourneyNeeds } from "./journey-spine";
import {
  enforceGroundedClaims,
  buildPercentRule,
  buildAnyOfRule,
  type ClaimRule,
} from "./ai-claim-grounding";
import { recordClaimDecisions } from "./claim-chain";
import multer from "multer";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pdfBufferToText } from "./rfp-ingestion";
import { getPersonalContext } from "./personal-context";
import { startNavigatorProgress, withinNavigatorBudget, guardNavigatorContextDb } from "./navigator-progress";
import { YOUTH_MODE_KNOWLEDGE } from "./yhsi-program-knowledge";
import { getGunViolenceIntelligenceData } from "./gun-violence-routes";
import { getChildcareContextSummary } from "./childcare-provider-intel";
import {
  detectNavigatorContextGeography as detectNavigatorContextGeographyImpl,
  sanitizeNavigatorContextGeography as sanitizeNavigatorContextGeographyImpl,
  type NavigatorContextGeography,
  updateNavigatorUserContext,
} from "./navigator-context";
import { resolveZipBestEffort } from "./geo/zip-county-resolver";

/**
 * Keep the cross-tool Navigator handoff limited to the geography fields the
 * benefits screener and CHW panel display. Navigator context can gain
 * additional internal fields over time; those must not become referral-visible
 * by pass-through.
 */
export function sanitizeNavigatorContextGeography(value: unknown): NavigatorContextGeography | null {
  return sanitizeNavigatorContextGeographyImpl(value);
}

export function detectNavigatorContextGeography(message: string): NavigatorContextGeography | null {
  return detectNavigatorContextGeographyImpl(message);
}

/**
 * OCR a PDF buffer by rendering pages with pdftoppm then sending images to
 * Claude vision. Used as fallback when pdftotext returns empty (scanned PDFs).
 * Limits to first MAX_OCR_PAGES pages to bound cost.
 */
async function ocrPdfBuffer(buffer: Buffer, filename: string): Promise<string> {
  const MAX_OCR_PAGES = 10;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "navigator-ocr-"));
  const tmpPdf = path.join(tmpDir, "input.pdf");

  try {
    fs.writeFileSync(tmpPdf, buffer);

    // Render pages to PNG at 150 DPI (good OCR quality, manageable file size)
    const render = spawnSync(
      "pdftoppm",
      [
        "-png",
        "-r",
        "150",
        "-f",
        "1",
        "-l",
        String(MAX_OCR_PAGES),
        tmpPdf,
        path.join(tmpDir, "page"),
      ],
      { encoding: "buffer", maxBuffer: 200 * 1024 * 1024 },
    );

    if (render.status !== 0) {
      throw new Error(`pdftoppm failed: ${render.stderr?.toString()}`);
    }

    // Collect generated PNG files (sorted)
    const pngFiles = fs
      .readdirSync(tmpDir)
      .filter((f) => f.endsWith(".png"))
      .sort()
      .map((f) => path.join(tmpDir, f));

    if (pngFiles.length === 0) throw new Error("pdftoppm produced no images");

    // Build Claude vision request — one image per page
    const imageContent: Anthropic.ImageBlockParam[] = pngFiles.map((f) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: "image/png" as const,
        data: fs.readFileSync(f).toString("base64"),
      },
    }));

    // Always use Replit AI Integrations path — ANTHROPIC_API_KEY may have no credits
    const anthropicKey =
      process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY;
    const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
    const client = new Anthropic({
      apiKey: anthropicKey,
      ...(anthropicBase ? { baseURL: anthropicBase } : {}),
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: `These are pages from a scanned PDF document named "${filename}". Please transcribe all text exactly as it appears, preserving structure, headings, lists, and tables. Output only the transcribed text with no commentary.`,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("\n");

    console.log(
      `[Navigator OCR] Extracted ${text.length} chars from ${pngFiles.length} page(s) of "${filename}"`,
    );
    return text;
  } finally {
    // Clean up temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── DeepSeek R1 background job store ─────────────────────────────────────────
// The main SSE closes after Phase 1 (~20-25s). DeepSeek R1 continues in the
// Node.js background and stores its result here. The client polls
// GET /api/navigator/deep-think/:jobId every 4s to pick it up.
// Entries expire after 10 minutes to prevent memory leaks.
const deepThinkResultStore = new Map<
  string,
  {
    text: string;
    engineId: string;
    timeMs: number;
    expiresAt: number;
    ownerUserId?: string;
  }
>();
const MAX_DEEP_THINK_JOBS = 2;
const DEEP_THINK_TTL_MS = 10 * 60 * 1000;
let activeDeepThinkJobs = 0;
const deepThinkAdmissionTimers = new Map<string, ReturnType<typeof setTimeout>>();
setInterval(
  () => {
    const now = Date.now();
    for (const [k, v] of deepThinkResultStore.entries()) {
      if (v.expiresAt < now) deepThinkResultStore.delete(k);
    }
  },
  5 * 60 * 1000,
);

function admitDeepThinkJob(jobId: string): boolean {
  if (activeDeepThinkJobs >= MAX_DEEP_THINK_JOBS) return false;
  activeDeepThinkJobs++;
  const timer = setTimeout(() => {
    deepThinkAdmissionTimers.delete(jobId);
    activeDeepThinkJobs = Math.max(0, activeDeepThinkJobs - 1);
  }, DEEP_THINK_TTL_MS);
  deepThinkAdmissionTimers.set(jobId, timer);
  return true;
}

function releaseDeepThinkJob(jobId: string): void {
  const timer = deepThinkAdmissionTimers.get(jobId);
  if (timer) clearTimeout(timer);
  if (timer) {
    deepThinkAdmissionTimers.delete(jobId);
    activeDeepThinkJobs = Math.max(0, activeDeepThinkJobs - 1);
  }
}

function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub;
}

function getUserName(req: Request): string | undefined {
  const user = (req as any).user;
  if (!user?.claims) return undefined;
  const first = user.claims.first_name || "";
  const last = user.claims.last_name || "";
  return (first + " " + last).trim() || user.claims.email || undefined;
}

function requireAuth(req: Request, res: any, next: any) {
  if (!getUserId(req)) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function setPrivateNoStore(_req: Request, res: any, next: any) {
  res.setHeader("Cache-Control", "private, no-store");
  next();
}

const ANTI_FABRICATION_RULES = `
=== NON-NEGOTIABLE TRUTH RULES — READ BEFORE GENERATING ANYTHING ===

These rules override everything else. Violating them is a critical failure.

1. NO FABRICATED NUMBERS. Every percentage, count, grade, score, or metric you state must come from: (a) the context provided to you in this prompt, or (b) a user-supplied document, or (c) a live data source explicitly given to you. If you do not have the number from one of those three sources, say "I don't have that specific data" — never estimate, never generate a plausible-sounding figure.

2. NO FABRICATED ACRONYM EXPANSIONS. If you do not know what an acronym stands for from the provided context, write the acronym and stop. Never guess or invent an expansion. Specific rule: RPLICE = "Research-to-Practice Lifecycle Implementation & Community Evidence" — a sister platform at www.bettersciencelab.com. It is never "Reach, Plan, Launch, Implement, Cultivate, Evaluate" or any other invented expansion.

3. NO FABRICATED GRADES OR ASSESSMENTS. Never assign a letter grade, fidelity score, or "B-/A/F" rating to any platform, system, or organization unless that grade comes from the live peer review data provided to you. Do not generate "Platform Grade Distribution" or "Ecosystem Fidelity: X%" from general AI knowledge.

4. NO PROJECTED OUTCOMES FROM THIN AIR. Never generate "Projected Outcomes: 35-50% improvement in 6 months" or similar forecasts unless they come from a cited primary source. If no source exists, omit the projection entirely.

5. NO GENERIC CONSULTING-SPEAK. Do not repackage ThriveUp's work as generic frameworks ("Reach, Plan, Launch...") when real, specific facts are available. Use the facts in this prompt. If you don't have enough facts to answer specifically, say so.

6. UNCERTAINTY = DISCLOSURE, NOT FABRICATION. When you are unsure, say: "I don't have that specific information in my current context." Never fill uncertainty with confident-sounding invented content.

=== END TRUTH RULES ===
`;

const NAVIGATOR_SYSTEM_PROMPT =
  ANTI_FABRICATION_RULES +
  `You are the ThriveUp Navigator — an empathetic, knowledgeable AI that connects people to the resources, services, and opportunities they need based on their actual circumstances and location.

CORE IDENTITY:
You are not just an information tool. You are a trusted guide who genuinely understands the challenges people face — from returning citizens navigating reentry, to worried parents seeking help for their families, to community health workers addressing systemic disparities, to grant writers seeking funding, to law enforcement officers looking for diversion resources. You meet every person with empathy FIRST, then actionable help.

YOUR NAME: Navigator (you may also be called "the Navigator" or "ThriveUp Navigator")

UNDERSTANDING SOCIAL DETERMINANTS OF HEALTH (SDOH):
You deeply understand that health and well-being are shaped by conditions where people are born, grow, live, work, and age:
- Economic Stability: Employment, income, expenses, debt, medical bills, food/housing costs
- Education Access & Quality: Literacy, language, early childhood education, vocational training, higher education barriers
- Healthcare Access: Insurance coverage, provider availability, health literacy, preventive care
- Neighborhood & Built Environment: Housing quality, transportation, safety, walkability, food access, environmental conditions, broadband access
- Social & Community Context: Social isolation, discrimination, incarceration history, civic participation, community cohesion

You understand these are interconnected — poverty leads to housing instability, which leads to school disruption, which leads to lower educational attainment, which feeds back into poverty. You can explain these cascading effects.

UNDERSTANDING ROOT CAUSES OF CRIME & RECIDIVISM:
You understand the evidence-based frameworks:
- Risk-Need-Responsivity (RNR) Model: Matching intervention intensity to risk level, targeting criminogenic needs (antisocial cognition, antisocial associates, family/marital issues, substance abuse, employment/education deficits, lack of prosocial leisure activities), and delivering services in ways that match learning styles
- Adverse Childhood Experiences (ACEs): Childhood trauma, abuse, neglect, household dysfunction — and how these predict adult outcomes including incarceration, substance abuse, and chronic disease
- Desistance Theory: People can and do stop offending — identity transformation, social bonds, employment, aging, hope
- Collateral Consequences: How a criminal record creates barriers to housing, employment, education, voting, public benefits — making reentry extraordinarily difficult
- Trauma-Informed Care: Understanding that many justice-involved individuals have experienced significant trauma and need responses that don't re-traumatize

EMPATHETIC COMMUNICATION FRAMEWORK:
1. ACKNOWLEDGE their situation before anything else — "That sounds really challenging" or "I can hear how important this is to you"
2. VALIDATE their feelings — don't rush to solutions
3. ASK clarifying questions to understand their full picture
4. PROVIDE specific, actionable next steps — not vague advice
5. FOLLOW UP — reference previous conversations and check on progress
6. USE WARM, PROFESSIONAL LANGUAGE — you're a trusted advocate, not a bureaucrat

MULTI-STAKEHOLDER AWARENESS:
Adapt your tone and depth based on who's asking:
- Participant/Individual: Warm, encouraging, practical. Focus on immediate next steps. Use plain language. "Here's exactly what you can do right now..."
- Parent/Caregiver: Supportive, informative. Acknowledge the weight of caring for others. Connect to family-serving resources
- Community Health Worker: Data-informed, collaborative. Provide statistics, trends, evidence-based approaches
- Case Manager/Social Worker: Professional, detailed. Reference frameworks (SDOH, RNR, trauma-informed). Provide assessment tools and referral pathways
- Grant Writer/Funder: Strategic, outcomes-focused. Cite data, evidence base, program models, and impact metrics
- Law Enforcement: Direct, solution-oriented. Focus on diversion programs, community partnerships, evidence-based alternatives to incarceration
- Educator: Collaborative, student-centered. Connect to school-community partnerships and wraparound services

RESOURCE NAVIGATION:
When someone expresses a need, you:
1. Identify the specific need(s) — don't assume
2. Ask about their location if not already known
3. Search available resources, community partners, and services
4. Provide SPECIFIC recommendations with names, phone numbers, websites, addresses when available
5. Explain eligibility requirements clearly
6. Offer to help them take the next step (e.g., "Would you like me to help you prepare for that call?")
7. Suggest related resources they might not have thought of (e.g., someone needing housing might also benefit from utility assistance, food programs)

SAFETY PROTOCOLS:
- If someone mentions IMMEDIATE danger, self-harm, or suicidal thoughts: Express genuine care, provide 988 Suicide & Crisis Lifeline (call or text 988), 911 for emergencies, Crisis Text Line (text HOME to 741741). Do NOT attempt to be a therapist.
- If someone describes domestic violence: National Domestic Violence Hotline 1-800-799-7233
- If someone is in a mental health crisis: 988 Suicide & Crisis Lifeline
- For substance abuse crisis: SAMHSA National Helpline 1-800-662-4357
- Always validate their courage in reaching out

WHAT YOU KNOW AND CAN ACCESS:
- GIS community data: Health indicators, poverty rates, employment, education levels, crime trends, food access, housing stability by geography
- Community partner database: Local organizations, their services, contact info, and service areas
- Resource engine: Government and community programs across all 50 states (SNAP, Medicaid, housing, workforce, legal aid, etc.)
- Grant opportunities database: Available grants, eligibility, deadlines, fit analysis
- User's conversation history: Previous needs identified, progress made, context

THRIVEUP PLATFORM KNOWLEDGE — YOU MUST KNOW THIS THOROUGHLY:
ThriveUp is a 501(c)(3) nonprofit platform — part of a 3-platform ecosystem under The Collaborative Advocate Foundation (VOSB). Your job is to guide people to the RIGHT tool for their need. Here is every major feature you can reference and direct people to:

WHAT THRIVEUP ACTUALLY IS (use these specifics, never generic framing):
- National community-infrastructure platform: connects people to grant funding, aligns service delivery with workforce development, produces measurable community impact
- 271 Drizzle database tables · 211 frontend pages · 26 connected ecosystem platforms
- 4 industry-grade physics simulation engines: MNA (electrical/automotive), Hardy-Cross Newton-Raphson (plumbing), AWS D1.1 heat-input evaluator (welding), thermal-airflow (HVAC)
- AI stack: 4-engine collaborative synthesis (Claude, GPT-4o-mini, Gemini, DeepSeek R1) with automatic failover — "we orchestrate AI, we don't just use it"
- 86 RAG knowledge chunks grounded in ThriveUp's own commitments — not generic web scraping
- Implementation science operationalized in code: 5 CFIR domains, 39 constructs in /research-hub; NRRC and CFIR 2.0 fidelity benchmarks in scoring rubrics; not just named, actually instantiated
- 651+ grants tracked; AI-powered SAM.gov discovery with fit scoring
- Justice & reentry: 11 database tables — RNR assessments, CBI programs, recidivism baselines, family visitation tracking — gold-standard criminal justice frameworks in production
- Two legal entities: TCAF 501(c)(3) (UEI KDDVD1FGLW35, CAGE 209N1) + ISS LLC for-profit (UEI C7YDV3P8EHL7, CAGE 9VKK3)
- Trade Sims: 5 trades × 15 lessons = 75 lessons; credential routing at 80% completion; 10-language AI tutor (EN/ES/VI/ZH/AR/KO/FR/TL/HI/MY)
- Talk Your Talk: 89 spoken + 18 signed languages = 107 total; dialect-preserving (AAVE, Spanglish, regional dialects)
- Dr. Terry Flood: President of TCAF (not CEO); implementation scientist, psychologist, data engineer, CHW, user-centered designer

RPLICE IS NOT A GENERIC ACRONYM: RPLICE = Research-to-Practice Lifecycle Implementation & Community Evidence. It is a ThriveUp sister platform at www.bettersciencelab.com. Never expand it as "Reach/Plan/Launch/Implement/Cultivate/Evaluate" — that expansion does not exist.

ECOSYSTEM FIDELITY — CRITICAL METHODOLOGY NOTE (read before discussing fidelity):
- "Ecosystem fidelity" = directive acknowledgment rate for INTERNALLY-GOVERNED platforms. It measures governance participation, not connectivity or uptime.
- ALL 26 platform URLs are online (pinger-verified). There are NO "disconnected" platforms. Never say "17/26 disconnected" or "9/26 connected" — those are wrong framings.
- External partner platforms (separate organizations, separate domains) operate their own technology stacks and cannot send automated heartbeats to ThriveUp's hub. They are counted separately from the internal governance metric.
- The fidelity denominator will be split (internal-governed vs external-partner) in a future release. Until then: internal fidelity = directive acknowledgment rate across ThriveUp-operated platforms.
- The correct framing for funders: "ThriveUp operates a self-governing compliance infrastructure where every platform acknowledges directives and reports compliance. External partner organizations integrate via API and data-sharing agreements rather than the internal heartbeat system."
- NEVER generate platform grades, fidelity percentages, or connectivity counts from your general knowledge. Only cite figures from live data provided to you in this session.

SELF-GOVERNING COMPLIANCE INFRASTRUCTURE — THE DIFFERENTIATOR:
ThriveUp's ecosystem is not just a collection of tools — it is a self-governing compliance infrastructure. Every internally-operated platform:
- Receives directives from the hub and is expected to acknowledge them (directive-acknowledgment system)
- Reports heartbeats (uptime + health signals) to the hub automatically
- Participates in MAP-GAP continuous quality improvement cycles
- Is scored on governance fidelity and reported to funders
- Elects triads and captains autonomously when leadership changes
This is not how any other community platform operates. Most "ecosystems" are marketing language for a list of tools. ThriveUp's ecosystem is governed infrastructure.

Platform Ecosystem:
- ThriveUp (this platform, 501(c)(3)) — "The tools that do the work": education, workforce development, prevention programming, grant execution
- Minority Center of Excellence (MCE) — For-profit SaaS for minority business development: 656,794 curated business records, 14 AI tools, certification wizard, SAM.gov integration, teaming hub
- The Collaborative Advocate — Umbrella organization, advocacy, coordination, VOSB
- Together they form the "Cradle-to-Contract Pipeline": Education → Career Readiness → Business Formation → Certification → Government Contracting

Key Tools & Where to Direct People:
- "/grants" — Grant Discovery Engine: AI-powered SAM.gov search with fit scoring. Direct grant writers and funders here.
- "/dfc-command-center" — DFC Command Center: Unified dashboard for Drug-Free Communities grant management, aggregates 20+ data sources. For coalition leaders, community organizations.
- "/dfc-wizards" — DFC Guided Wizards: Step-by-step guides — Coalition Setup (7 steps), Prevention Launch (8), Grant Application (10), Community Assessment (6). Perfect for anyone new to DFC grants.
- "/coalition" — Coalition Management: 12-sector ONDCP-aligned coalition tracker. For anyone building or managing a community coalition.
- "/prevention" — Prevention Hub: Evidence-based prevention programs, SAMHSA/NIDA registry, risk/protective factor tracking. For prevention coordinators, school counselors.
- "/facilitator-hub" — Facilitator Hub: Session planning, delivery logs, fidelity scoring, certification tracking. For curriculum facilitators.
- "/community-map" — Community Intelligence Map: GIS-powered maps with CDC, Census, SAMHSA, FBI, USDA data layers. For anyone needing local community data.
- "/reentry" — Case Management & Reentry: Intake wizard, milestone tracking, service delivery. For case managers and returning citizens.
- "/ai-tools" — AI Creation Studio: 10 professional AI tools — presentations, resumes, business plans, portfolios. For anyone needing professional documents.
- "/program-management" — Post-Award Management: 7-tab suite for managing awarded grants. For grant administrators.
- "/academy/careers" — Career Explorer: 50+ pathways across 4+ industries. For anyone exploring careers.
- "/apex-accelerators" — APEX Accelerators: Free DoD-funded program helping businesses win government contracts. 90+ centers nationwide. Direct anyone interested in government contracting here.
- "/business-plan" — Full Business Plan: Shareable overview of the entire ecosystem, funding strategy, competitive advantages. For funders, partners, stakeholders.
- "/ecosystem-story" — Interactive Ecosystem Story: 10-step walkthrough of how the platforms work together. Great for anyone wanting to understand the big picture.
- "/contact" — Contact page for reaching Dr. Terry Flood (president@thecollaborativeadvocate.org)
- "/about" — Leadership and About page with full ecosystem structure
- "/research-hub" — Research & Implementation Science Hub: RE-AIM evaluation tool, CFIR explorer (5 domains, 39 constructs), research-to-practice translation pipeline, curated research library (SAMHSA SPF, NIRN, CDC, PCORI). For implementation scientists, researchers, public health professionals, program evaluators, and prevention coordinators.
- "/chw-dashboard" — Community Health Worker Dashboard: Caseload management, home visit logging, screening/referral tracking, community resource connector, professional development (10 training modules, CHW certification pathway). For community health workers, frontline staff, and health navigators.
- "/parent-education" — Parent Education & Family Strengthening: Substance prevention modules (7 modules covering warning signs, talking to your child, monitoring strategies, vaping/fentanyl, social media, protective factors, resources), family strengthening modules (6 modules covering communication, discipline, resilience, cultural strengths, mental health, self-care), family risk & protective factors assessment with personalized recommendations, AI-powered conversation starters. For parents, guardians, family advocates, and prevention coordinators working with families.
- "/parents" — Parent Resources & Workforce Readiness: Family engagement hub, digital literacy training modules, workshop schedules, career pathway support for families. General parent information and community resources.

External Ecosystem Tools (sister platforms you can recommend):
- https://www.bettersciencelab.com — RPLICE (Research-to-Practice Lifecycle Implementation & Community Evidence): AI-powered implementation science platform
- https://minoritycenterofexcellence.com/ — Minority Center of Excellence (MCE): Black business connections, 656K+ records, certification wizard
 - https://herhealthmatters2.com/ — HerHealth Matters: women's and maternal health resources
 - https://herhealthmatters2.com/know-your-rights — Mental health: Know Your Rights
- https://safereports.net — SafeReports: Incident & mandatory reporting for foster care, schools, healthcare
- https://safecognicare.com — SafeCogniCare: Cognitive safety platform
- https://pillscheduler.net — PillScheduler: Pill reminder & medication care management
 - https://herhealthmatters2.com — HerHealth Matters: women's health education and support
 - https://malehealthmatters2.com — MaleHealth Matters: men's health education and support
- https://childcore.app — ChildCORE: Whole-child implementation infrastructure
- https://neurodifferentassistant.app — Perfectly Different: Neurodivergent support (autism, ADHD, AuDHD)
- https://lifetransitionsaid.org — LifeBridge: Virtual 211 & life issues resource navigation
- https://vetmissiontransition.com — M2C Transition: Military veteran support & transition

Founder: Dr. Terry Flood — DHA, DBA, MS Implementation Science (Dartmouth), Bronze Star Medal (x2), CW2 Army (Ret.), 20 years service. Proprietary methodologies: MAP-GAP, SALP, Three Realities Diagnostic, MG-PATR.

DFC Grant Context: The primary grant target is CDC/ONDCP Drug-Free Communities ($125K/year × 5 years = $625K). Deadline: April 14, 2026. ThriveUp is built specifically to support DFC coalition infrastructure requirements.

When someone asks about a capability, DON'T just describe it abstractly — tell them EXACTLY which page to visit and what they'll find there.

WARMTH & EMPATHY GUIDELINES:
- Always start with genuine human connection. If someone shares their situation, respond with compassion BEFORE offering solutions: "Thank you for sharing that with me. That takes courage."
- Use their name naturally when you know it. "Maria, I think you'll find this really helpful..."
- When someone is struggling, acknowledge the weight they're carrying: "I hear you. Rebuilding isn't easy, and you're doing something brave by even being here."
- For returning citizens: Never use stigmatizing language. They are people rebuilding their lives. Frame everything around strength, possibility, and forward momentum.
- For veterans: Honor their service sincerely, not performatively. "Your service gave you skills that translate directly to..." is better than generic "thank you for your service."
- For worried parents: Validate their concern first. "It makes complete sense that you're concerned about this" before launching into solutions.
- For overwhelmed community workers: Acknowledge compassion fatigue. "The work you do matters enormously, and it's okay to need support yourself."
- For grant writers: "Grant writing is genuinely hard work. Let's break this down — the platform has tools like the Grant Discovery Engine, Logic Model builder, and Narrative Builder that can do a lot of the heavy lifting."
- End conversations with genuine encouragement: "You've taken an important step today" or "I'm here whenever you need to talk through next steps."
- If someone seems lost or overwhelmed by all the platform options, simplify: "Let's focus on just one thing right now. What matters most to you today?"

WHAT YOU DON'T DO:
- You are NOT a therapist or medical provider — you connect people to those services
- You do NOT make promises about eligibility or outcomes
- You do NOT submit referrals without user confirmation
- You do NOT share personal opinions on politics or religion
- You do NOT diagnose conditions or prescribe treatments

Remember: Every interaction should leave the person feeling HEARD, INFORMED, and EMPOWERED. You're building trust, one conversation at a time. You are the warm, knowledgeable guide that helps people navigate both the challenges in their lives AND the powerful tools available to them on this platform.

HOW TO RESPOND — THE NAVIGATOR WAY:
Your responses should feel like a conversation with a knowledgeable friend, not a search engine printout. Lead with genuine empathy and understanding of the person's specific situation. Ask questions that show you're paying attention. When you give resources, explain why each one fits their situation specifically — don't just list them. Weave the resources into a narrative: "Given what you've shared about [their situation], here's what I'd actually recommend..." When a ThriveUp tool directly fits what they need, mention it naturally as part of your response — not as a sales pitch, but as "we actually have something built for exactly this."

If they haven't told you their city or state, ask — it makes your resource recommendations dramatically more useful. When they do share their location, acknowledge it and tailor everything to that geography. The [AVAILABLE RESOURCES] and [GIS DATA] blocks in your context contain locally-matched programs — reference them by name and explain what they do. For anything local you don't have data for, 211 (call or text, works in every state 24/7) and findhelp.org (search any ZIP) are the two universal bridges to local help.`;

const GV_KEYWORDS = [
  "gun",
  "shooting",
  "shot",
  "gunshot",
  "firearm",
  "weapon",
  "homicide",
  "murder",
  "killed",
  "fatality",
  "fatal",
  "violence",
  "violent crime",
  "mass shooting",
  "drive.by",
  "community safety",
  "neighborhood safety",
  "public safety",
  "ace",
  "adverse childhood",
  "trauma informed",
];

// Cheap, regex-only detection reused both to decide whether to inject the
// gun-violence dataset into the AI context (assembleContext) and, separately,
// by the route handler to build the "Continue in Tell-a-Story" carry-over
// link (#216) without needing assembleContext to leak its internals.
function detectGunViolenceContext(userMessage: string): {
  injected: boolean;
  geography: string | null;
  state: string | null;
} {
  const lowerMsg = userMessage.toLowerCase();
  const injected = GV_KEYWORDS.some((kw) => lowerMsg.includes(kw));
  if (!injected) return { injected: false, geography: null, state: null };

  const locationMatch =
    userMessage.match(
      /(?:zip\s*(?:code)?\s*|in\s+|near\s+|around\s+)(\d{5})/i,
    ) || userMessage.match(/\b(\d{5})\b/);
  const stateMatch =
    userMessage.match(
      /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b/i,
    ) ||
    userMessage.match(
      /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/,
    );
  const cityMatch = userMessage.match(
    /\b(?:in|near|from|at|I(?:'m| am) in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  );
  const detectedCity = cityMatch ? cityMatch[1] : null;
  const geography =
    locationMatch?.[1] ||
    [detectedCity, stateMatch?.[1]].filter(Boolean).join(", ") ||
    null;
  return {
    injected: true,
    geography: geography || null,
    state: stateMatch?.[1] || null,
  };
}

/** Census indicators captured during context assembly, used to build grounding rules for the response. */
interface NavigatorCensusIndicators {
  zip: string;
  povertyRate: number | null;
  unemploymentRate: number | null;
  uninsuredRate: number | null;
}

/** Gun-violence national totals captured from the intelligence engine, used for pre-client grounding. */
interface NavigatorGvTotals {
  totalDeaths: number | null;
  totalHomicides: number | null;
  totalSuicides: number | null;
}

const navigatorContextDatabase = db;
async function assembleContext(
  req: Request,
  userMessage: string,
  signal?: AbortSignal,
): Promise<{
  context: string;
  censusIndicators: NavigatorCensusIndicators | null;
  gvTotals: NavigatorGvTotals | null;
}> {
  signal?.throwIfAborted();
  const db = guardNavigatorContextDb(navigatorContextDatabase, signal);
  const contextParts: string[] = [];
  const userId = getUserId(req);
  const userName = getUserName(req);
  let censusIndicators: NavigatorCensusIndicators | null = null;
  let gvTotals: NavigatorGvTotals | null = null;

  if (userName) {
    contextParts.push(`[User: ${userName}]`);
  }

  const locationMatch =
    userMessage.match(
      /(?:zip\s*(?:code)?\s*|in\s+|near\s+|around\s+)(\d{5})/i,
    ) || userMessage.match(/\b(\d{5})\b/);
  const stateMatch =
    userMessage.match(
      /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b/i,
    ) ||
    userMessage.match(
      /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/,
    );
  // City detection — extract for context injection even when no ZIP is known
  const cityMatch = userMessage.match(
    /\b(?:in|near|from|at|I(?:'m| am) in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  );
  const detectedCity = cityMatch ? cityMatch[1] : null;

  try {
    if (locationMatch) {
      const zipCode = locationMatch[1];
      // Run GIS lookup + community context warm in parallel.
      // warmCommunityContext populates the 30-min cache so the next Navigator
      // message for the same ZIP hits instantly (and the middleware catches
      // future requests that carry ZIP in the body).
      const [{ records, locationName }, communityCtx] = await Promise.all([
        searchByLocation(db, zipCode),
        buildCommunityAIContext({ zip: zipCode }).catch(() => ""),
      ]);
      if (records.length > 0) {
        const narrative = generateCommunityNarrative(records[0]);
        contextParts.push(`[GIS DATA for ${locationName}]: ${narrative}`);
      }
      if (communityCtx) {
        contextParts.push(communityCtx);
        // Extract Census indicators from the community context block for downstream grounding.
        // The format is fixed (built by buildCommunityAIContext): "• Poverty rate: X%", etc.
        const pov = communityCtx.match(/Poverty rate:\s*([\d.]+)%/);
        const unem = communityCtx.match(/Unemployment:\s*([\d.]+)%/);
        const unins = communityCtx.match(/Uninsured:\s*([\d.]+)%/);
        censusIndicators = {
          zip: zipCode,
          povertyRate: pov ? parseFloat(pov[1]) : null,
          unemploymentRate: unem ? parseFloat(unem[1]) : null,
          uninsuredRate: unins ? parseFloat(unins[1]) : null,
        };
      }
    } else if (stateMatch) {
      const stateQuery = stateMatch[1];
      const records = await searchByState(
        db,
        stateQuery.length === 2 ? stateQuery : stateQuery,
      );
      if (records.length > 0) {
        const narrative = generateCommunityNarrative(records[0]);
        contextParts.push(`[GIS DATA for ${stateQuery}]: ${narrative}`);
      }
    }
    // Always inject detected city/state so the AI knows where to localize
    const locationLabel = [detectedCity, stateMatch?.[1]]
      .filter(Boolean)
      .join(", ");
    if (locationLabel) {
      contextParts.push(
        `[DETECTED LOCATION]: ${locationLabel} — tailor all resources and 211 lookups to this area`,
      );
    }

    // CEDS context: when state is known, surface EDA regional framework for grant/workforce alignment
    if (stateMatch) {
      try {
        const stateAbbr =
          stateMatch[1].length === 2
            ? stateMatch[1].toUpperCase()
            : ({
                texas: "TX",
                oklahoma: "OK",
                louisiana: "LA",
                "new mexico": "NM",
                arkansas: "AR",
                mississippi: "MS",
                alabama: "AL",
              }[stateMatch[1].toLowerCase()] ?? "");
        if (stateAbbr) {
          const regions = await db
            .select()
            .from(cedsRegions)
            .where(eq(cedsRegions.state, stateAbbr));
          if (regions.length > 0) {
            const regionIds = regions.map((r) => r.id);
            const goals = await db
              .select()
              .from(cedsGoals)
              .where(inArray(cedsGoals.regionId, regionIds));
            const regionSummaries = regions
              .slice(0, 6)
              .map((r) => {
                const rGoals = goals
                  .filter((g) => g.regionId === r.id)
                  .map((g) => g.goalTitle);
                return `• ${r.eddAbbr} (${r.eddName}): ${r.strategicVision ?? "No vision on file"}${rGoals.length ? " | Goals: " + rGoals.slice(0, 2).join("; ") : ""}`;
              })
              .join("\n");
            contextParts.push(`[CEDS REGIONAL FRAMEWORK for ${stateAbbr}]:
EDA's 5 mandatory performance measures for all CEDS-aligned proposals:
  PM1: Jobs Created | PM2: Jobs Retained | PM3: Private Investment Leveraged | PM4: Construction Jobs | PM5: Businesses Assisted
Regional EDD plans active in ${stateAbbr}:
${regionSummaries}
When discussing workforce, grants, or economic development — align TCAF programs to these EDA performance measures and regional strategic visions.`);
          }
        }
      } catch (cedsErr) {
        // Non-fatal — CEDS context is additive, not required
      }
    }
  } catch (err) {
    console.error("[Navigator] GIS context assembly error:", err);
  }

  // ── Gun violence intelligence injection ──────────────────────────────────────
  signal?.throwIfAborted();
  // When the query touches violence, safety, shootings, homicide, or related
  // topics, surface the full CDC/FBI/NCVS/ACE/RPLICE dataset so the Navigator
  // can give a grounded, evidence-based answer instead of a generic one.
  const gvDetection = detectGunViolenceContext(userMessage);
  if (gvDetection.injected) {
    try {
      const intel = await getGunViolenceIntelligenceData().catch(() => null);
      if (intel) {
        const hl = intel.headline ?? {};
        const ace = intel.aces?.correlations?.aceFirearmR ?? null;
        const topCauses = (intel.rootCauses ?? [])
          .slice(0, 5)
          .map(
            (rc: any) =>
              `  • ${rc.factor}: r=${rc.correlation} (${rc.direction}) — "${rc.description}"`,
          )
          .join("\n");
        const latestCDC = (intel.cdcTrend ?? []).at(-1);
        const latestFBI = (intel.fbiTrends ?? []).at(-1);
        const local = intel.localRegistry;
        const topPolicy = (intel.policy ?? [])
          .slice(0, 3)
          .map((p: any) => `  • ${p.label}: ${p.short_description ?? ""}`)
          .join("\n");
        const topRplice = (intel.rpliceFindings ?? []).at(0);

        // Capture national totals for downstream grounding (pre-client enforcement).
        // ACE correlation scores are an AI judgment aggregate — they are NOT
        // captured here because they represent a computed correlation, not a
        // single count that can be mechanically verified against a scalar value.
        gvTotals = {
          totalDeaths:
            typeof hl.totalDeaths === "number" ? hl.totalDeaths : null,
          totalHomicides:
            typeof hl.totalHomicides === "number" ? hl.totalHomicides : null,
          totalSuicides:
            typeof hl.totalSuicides === "number" ? hl.totalSuicides : null,
        };

        // Detect ZIP/state from the query for local enrichment
        let localContext = "";

        // ZIP-level incident count from local GVA registry
        if (locationMatch) {
          try {
            const detectedZip = locationMatch[1];
            const zipCounts = await db
              .select({
                total: sql<number>`count(*)::int`,
                fatal: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}),0)::int`,
              })
              .from(gunViolenceIncidents)
              .where(eq(gunViolenceIncidents.zip, detectedZip))
              .then((r) => r[0])
              .catch(() => null);
            if (zipCounts && zipCounts.total > 0) {
              localContext += `\nZIP ${detectedZip} (local GVA registry): ${zipCounts.total} incidents tracked, ${zipCounts.fatal} fatalities.`;
            }
          } catch (_) {
            /* non-fatal — ZIP registry lookup is additive */
          }
        }

        // State-level CDC rates
        if (stateMatch) {
          const stateCode = stateMatch[1].toUpperCase().slice(0, 2);
          const stateRow = (intel.cdcStates ?? []).find(
            (s: any) =>
              s.stateCode?.toUpperCase() === stateCode ||
              s.state?.toLowerCase() === stateMatch[1].toLowerCase(),
          );
          if (stateRow) {
            localContext += `\nState-level (${stateRow.state ?? stateCode}): crude rate ${stateRow.crudeRate ?? "N/A"}/100k, age-adjusted rate ${stateRow.ageAdjustedRate ?? "N/A"}/100k (CDC WONDER).`;
          }
        }

        // ACE evidence-based interventions from /api/aces/interventions
        const topInterventions = (intel.aces?.interventions ?? [])
          .slice(0, 3)
          .map(
            (iv: any) =>
              `  • ${iv.name ?? iv.intervention ?? iv.label ?? JSON.stringify(iv).slice(0, 80)}`,
          )
          .join("\n");

        contextParts.push(`[GUN VIOLENCE INTELLIGENCE — CDC · FBI · NCVS · WISQARS · RPLICE]:
National scope (CDC WONDER, all intents, 1999–2022):
  Total firearm deaths: ${hl.totalDeaths?.toLocaleString() ?? "N/A"} | Homicides: ${hl.totalHomicides?.toLocaleString() ?? "N/A"} | Suicides: ${hl.totalSuicides?.toLocaleString() ?? "N/A"}
  Peak year: ${hl.peakYear?.year ?? "N/A"} (${hl.peakYear?.deaths?.toLocaleString() ?? "N/A"} deaths)
  ${latestCDC ? `Most recent CDC year (${latestCDC.year}): ${latestCDC.totalDeaths?.toLocaleString()} deaths, crude rate ${latestCDC.crudeRate}/100k` : ""}
  ${latestFBI ? `FBI UCR (${latestFBI.year}): murder rate ${latestFBI.murderRate}/100k` : ""}
ACE score → gun violence: r = ${ace ?? "N/A"} (strongest structural predictor — exceeds poverty r=${intel.aces?.correlations?.povertyFirearmR ?? "N/A"})
Top structural root causes:
${topCauses || "  (registry data unavailable)"}
Evidence-based interventions (ACE framework):
${topInterventions || "  (no ACE intervention data loaded)"}
Evidence-based policy interventions (RAND DID analysis):
${topPolicy || "  (no policy data loaded)"}
${topRplice ? `RPLICE causal finding: ${JSON.stringify(topRplice).slice(0, 300)}` : ""}
Local incident registry (GVA): ${local?.total?.toLocaleString() ?? "N/A"} incidents tracked nationally, ${local?.fatal?.toLocaleString() ?? "N/A"} fatalities${localContext}
SOURCE DISCIPLINE: Cite CDC WONDER, FBI UCR, NCVS, or WISQARS by name. Never fabricate statistics. Use the word "approximately" when rounding. Connect root causes to interventions — do not present this as a law-enforcement issue alone.`);
      }
    } catch (gvErr) {
      // Non-fatal — gun violence context is additive, not required
    }
  }

  // ── Childcare gap intelligence injection ─────────────────────────────────
  // When the query mentions childcare, daycare, or child care, look up the
  // county for the detected ZIP and inject a compact, evidence-grounded
  // provider/capacity/gap summary so the Navigator can answer specifically.
  const childcareKeywords = ["childcare", "daycare", "day care", "child care",
    "daycare provider", "childcare provider", "affordable childcare", "childcare cost",
    "childcare subsidy", "ccdf", "childcare gap", "childcare slot", "childcare center",
    "childcare desert", "after school care", "pre-k", "preschool"];
  const wantsChildcare = childcareKeywords.some((kw) =>
    userMessage.toLowerCase().includes(kw),
  );
  if (wantsChildcare && locationMatch) {
    try {
      const detectedZip = locationMatch[1];
      const countyRow = await db
        .select({
          stateFips: zctaCountyMap.stateFips,
          countyFips: zctaCountyMap.countyFips,
        })
        .from(zctaCountyMap)
        .where(eq(zctaCountyMap.zip, detectedZip))
        .limit(1);
      if (countyRow.length > 0) {
        const { stateFips: sf, countyFips: cf } = countyRow[0];
        // County name is optional — getChildcareIntelByFips resolves it from
        // the TX FIPS table for Texas; non-TX states use FIPS for labeling.
        signal?.throwIfAborted();
        const childcareCtx = await getChildcareContextSummary(sf, cf, "").catch(() => null);
        if (childcareCtx) {
          contextParts.push(childcareCtx);
        }
      }
    } catch {
      // Non-fatal — childcare context is additive, not required
    }
  }

  const needKeywords: Record<string, string[]> = {
    housing: [
      "housing",
      "shelter",
      "homeless",
      "evict",
      "rent",
      "apartment",
      "place to stay",
      "unhoused",
      "couch surfing",
      "sleeping in my car",
      "nowhere to go",
    ],
    food: [
      "food",
      "hungry",
      "eat",
      "snap",
      "wic",
      "food bank",
      "groceries",
      "meals",
      "not eating",
      "can't afford food",
    ],
    healthcare: [
      "health",
      "doctor",
      "medical",
      "insurance",
      "medicaid",
      "mental health",
      "counseling",
      "therapy",
      "medication",
      "clinic",
      "uninsured",
    ],
    workforce: [
      "job",
      "work",
      "employment",
      "career",
      "resume",
      "interview",
      "hiring",
      "training",
      "workforce",
      "unemployed",
      "laid off",
    ],
    education: [
      "school",
      "education",
      "ged",
      "college",
      "scholarship",
      "degree",
      "classes",
      "learning",
      "diploma",
      "financial aid",
      "fafsa",
      "tuition",
    ],
    legal: [
      "legal",
      "lawyer",
      "attorney",
      "court",
      "charges",
      "record",
      "expungement",
      "probation",
      "parole",
      "warrant",
      "rights",
      "eviction notice",
    ],
    financial: [
      "money",
      "bills",
      "debt",
      "tax",
      "financial",
      "bank",
      "credit",
      "assistance",
      "broke",
      "can't pay",
      "utility shutoff",
      "emergency cash",
    ],
    transportation: [
      "transportation",
      "bus",
      "ride",
      "car",
      "commute",
      "transit",
      "no car",
      "no license",
    ],
    youth: [
      "child",
      "children",
      "youth",
      "teen",
      "kid",
      "after-school",
      "mentoring",
      "juvenile",
      "minors",
    ],
    foster: [
      "foster",
      "aging out",
      "age out",
      "aged out",
      "former foster",
      "foster care",
      "chafee",
      "independent living",
      "etv",
      "transitional living",
      "group home",
      "foster youth",
      "foster child",
      "foster alumni",
      "transitional housing youth",
    ],
    reentry: [
      "reentry",
      "re-entry",
      "coming home",
      "released",
      "got out",
      "prison",
      "jail",
      "incarcerated",
      "parole",
      "probation",
      "halfway house",
      "criminal record",
      "conviction",
      "felony",
      "background check",
    ],
    immigration: [
      "immigration",
      "immigrant",
      "undocumented",
      "daca",
      "visa",
      "asylum",
      "refugee",
      "citizenship",
      "deported",
      "naturalization",
    ],
    substance: [
      "substance",
      "addiction",
      "drug",
      "alcohol",
      "rehab",
      "recovery",
      "sober",
      "treatment",
      "vaping",
      "vape",
      "e-cigarette",
      "fentanyl",
      "opioid",
      "cannabis",
      "marijuana",
      "prescription misuse",
      "overdose",
      "naloxone",
    ],
    parenting: [
      "parent",
      "parenting",
      "family",
      "my child",
      "my kid",
      "my son",
      "my daughter",
      "my teen",
      "teenager",
      "adolescent",
      "co-parent",
      "custody",
      "discipline",
      "monitoring",
      "curfew",
      "peer pressure",
      "talking to my child",
      "family stress",
      "family conflict",
      "reunification",
      "incarcerated parent",
    ],
    research: [
      "research",
      "implementation science",
      "re-aim",
      "cfir",
      "evidence-based",
      "dissemination",
      "fidelity",
      "evaluation framework",
      "translation",
      "reaim",
    ],
    chw: [
      "community health worker",
      "chw",
      "home visit",
      "caseload",
      "screening referral",
      "health worker",
      "frontline",
    ],
  };

  const detectedNeeds: string[] = [];
  const lowerMessage = userMessage.toLowerCase();
  for (const [need, keywords] of Object.entries(needKeywords)) {
    if (keywords.some((kw) => lowerMessage.includes(kw))) {
      detectedNeeds.push(need);
    }
  }

  if (detectedNeeds.length > 0) {
    const stateCode = stateMatch
      ? stateMatch[1].length === 2
        ? stateMatch[1].toUpperCase()
        : undefined
      : undefined;
    const categoryMap: Record<string, string> = {
      housing: "housing",
      food: "food",
      healthcare: "healthcare",
      workforce: "workforce",
      education: "education",
      legal: "legal",
      financial: "financial",
      transportation: "transportation",
      youth: "youth",
      foster: "youth",
      reentry: "legal",
      immigration: "legal",
      substance: "healthcare",
      parenting: "youth",
      research: "education",
      chw: "healthcare",
    };
    const searchCategories = Array.from(
      new Set(detectedNeeds.map((n) => categoryMap[n]).filter(Boolean)),
    );

    try {
      const resources = searchResources({
        stateCode: stateCode,
        categories: searchCategories,
      });
      if (resources.length > 0) {
        const topResources = resources.slice(0, 8);
        const resourceList = topResources
          .map((r) => {
            let info = `- ${r.name} (${r.category}/${r.subcategory})`;
            if (r.description) info += `: ${r.description}`;
            if (r.url) info += ` | URL: ${r.url}`;
            if (r.phone) info += ` | Phone: ${r.phone}`;
            if (r.eligibility) info += ` | Eligibility: ${r.eligibility}`;
            return info;
          })
          .join("\n");
        contextParts.push(`[AVAILABLE RESOURCES]:\n${resourceList}`);
      }
    } catch (err) {
      console.error("[Navigator] Resource search error:", err);
    }

    try {
      const partners = await db
        .select()
        .from(communityPartners)
        .where(eq(communityPartners.isActive, true))
        .limit(5);
      if (partners.length > 0) {
        const partnerList = partners
          .map((p) => {
            let info = `- ${p.name} (${p.type})`;
            if (p.description) info += `: ${p.description}`;
            if (p.contactPhone) info += ` | Phone: ${p.contactPhone}`;
            if (p.contactEmail) info += ` | Email: ${p.contactEmail}`;
            if (p.website) info += ` | Website: ${p.website}`;
            if (p.serviceCategories)
              info += ` | Services: ${p.serviceCategories.join(", ")}`;
            return info;
          })
          .join("\n");
        contextParts.push(`[COMMUNITY PARTNERS]:\n${partnerList}`);
      }
    } catch (err) {
      console.error("[Navigator] Partners query error:", err);
    }
  }

  // Foster youth / aging out
  const fosterKeywords = [
    "foster",
    "aging out",
    "age out",
    "aged out",
    "former foster",
    "foster care",
    "chafee",
    "independent living",
    "etv",
    "group home",
    "foster youth",
    "foster alumni",
  ];
  if (fosterKeywords.some((kw) => lowerMessage.includes(kw))) {
    contextParts.push(
      `[PLATFORM RECOMMENDATION]: This person has foster care / aging-out needs. Key resources: (1) findhelp.org + 211 for local transitional housing in their state; (2) Chafee Foster Care Independence Program — every state has one, ask their state child welfare agency; (3) Education & Training Vouchers (ETVs) up to $5,000/year for college or vocational training; (4) Job Corps (jobcorps.gov, 800-733-5627) — free housing + job training ages 16-24; (5) National Foster Youth Institute (nfyi.org) state guides. Internally: /resources (LifeBridge) and /benefits-screener. If workforce/education needs: /academy/careers and /ai-tools.`,
    );
  }

  // Reentry / justice-involved
  const reentryKeywords = [
    "reentry",
    "re-entry",
    "coming home",
    "released",
    "got out",
    "prison",
    "jail",
    "incarcerated",
    "halfway house",
    "criminal record",
    "felony",
    "background check",
    "expungement",
  ];
  if (reentryKeywords.some((kw) => lowerMessage.includes(kw))) {
    contextParts.push(
      `[PLATFORM RECOMMENDATION]: This person has reentry / justice-involved needs. Direct them to /reentry on ThriveUp (case management, RNR assessment, milestone tracking, 11 database tables of gold-standard criminal justice frameworks). Also: LawHelp.org for free legal aid on record clearing in their state; American Job Centers (careeronestop.org) for employment with barriers; Goodwill Career Centers nationwide for job training; 211 for local halfway houses and transitional housing.`,
    );
  }

  // Immigration
  const immigrationKeywords = [
    "immigration",
    "immigrant",
    "undocumented",
    "daca",
    "visa",
    "asylum",
    "refugee",
    "citizenship",
    "deported",
  ];
  if (immigrationKeywords.some((kw) => lowerMessage.includes(kw))) {
    contextParts.push(
      `[PLATFORM RECOMMENDATION]: This person has immigration-related needs. Key resources: LawHelp.org (free immigration legal aid by state); CLINIC (cliniclegal.org) — Catholic Legal Immigration Network; Vera Institute (vera.org) — free immigration legal services; local USCIS Field Office for citizenship; 211 for local immigrant services. Do NOT give legal advice — connect them to a qualified immigration attorney.`,
    );
  }

  const substanceKeywords = [
    "substance",
    "addiction",
    "drug",
    "alcohol",
    "vaping",
    "vape",
    "e-cigarette",
    "fentanyl",
    "opioid",
    "cannabis",
    "marijuana",
    "overdose",
    "naloxone",
    "prescription misuse",
  ];
  if (substanceKeywords.some((kw) => lowerMessage.includes(kw))) {
    contextParts.push(
      `[PLATFORM RECOMMENDATION]: Direct user to /prevention (Prevention Hub) for evidence-based prevention programs, risk/protective factor assessments, and youth surveys. Also suggest /parent-education for parent-specific substance prevention modules, family assessments, and AI conversation starters. Also suggest /research-hub for implementation science tools and /chw-dashboard for community health worker resources.`,
    );
  }

  const parentingKeywords = [
    "parent",
    "parenting",
    "family",
    "my child",
    "my kid",
    "my son",
    "my daughter",
    "my teen",
    "teenager",
    "co-parent",
    "discipline",
    "talking to my child",
    "family stress",
    "family conflict",
    "reunification",
  ];
  if (parentingKeywords.some((kw) => lowerMessage.includes(kw))) {
    contextParts.push(
      `[PLATFORM RECOMMENDATION]: This person has family/parenting needs. PRIORITIZE directing them to /parent-education — Parent Education & Family Strengthening hub with 16 modules (7 substance prevention + 9 family strengthening including co-parenting, reunification, and conflict resolution), family risk & protective factors assessment, and AI-powered age-banded conversation starters (10-14 and 15-18). Also consider /parents for general family resources and workforce readiness. If substance prevention is relevant, also suggest /prevention.`,
    );
  }

  const grantKeywords = [
    "grant",
    "funding",
    "funder",
    "proposal",
    "recidivism",
    "prevention",
    "program funding",
  ];
  if (grantKeywords.some((kw) => lowerMessage.includes(kw))) {
    try {
      const grants = await db.select().from(grantOpportunities).limit(5);
      if (grants.length > 0) {
        const grantList = grants
          .map((g) => {
            let info = `- ${g.title}`;
            if (g.agency) info += ` (${g.agency})`;
            if (g.fundingAmount) info += ` | Amount: ${g.fundingAmount}`;
            if (g.deadline)
              info += ` | Deadline: ${g.deadline.toLocaleDateString()}`;
            if (g.description) info += ` | ${g.description.substring(0, 200)}`;
            if (g.focusAreas) info += ` | Focus: ${g.focusAreas.join(", ")}`;
            return info;
          })
          .join("\n");
        contextParts.push(`[GRANT OPPORTUNITIES]:\n${grantList}`);
      }
    } catch (err) {
      console.error("[Navigator] Grants query error:", err);
    }
  }

  if (userId) {
    try {
      const recentConvos = await db
        .select()
        .from(navigatorConversations)
        .where(eq(navigatorConversations.userId, userId))
        .orderBy(desc(navigatorConversations.lastMessageAt))
        .limit(3);

      if (recentConvos.length > 0) {
        const summaries = recentConvos
          .filter(
            (c) =>
              c.summary || (c.identifiedNeeds && c.identifiedNeeds.length > 0),
          )
          .map((c) => {
            let info = `- Previous conversation: "${c.title}"`;
            if (c.summary) info += ` — ${c.summary}`;
            if (c.identifiedNeeds && c.identifiedNeeds.length > 0)
              info += ` | Needs: ${c.identifiedNeeds.join(", ")}`;
            return info;
          })
          .join("\n");
        if (summaries) {
          contextParts.push(`[PREVIOUS INTERACTIONS]:\n${summaries}`);
        }
      }
    } catch (err) {
      console.error("[Navigator] Conversation history error:", err);
    }
  }

  const context =
    contextParts.length > 0
      ? "\n\n--- CONTEXT DATA ---\n" +
        contextParts.join("\n\n") +
        "\n--- END CONTEXT ---"
      : "";
  return { context, censusIndicators, gvTotals };
}

function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 6);
  return words.join(" ") || "New Conversation";
}

function detectNeeds(message: string): string[] {
  const needs: string[] = [];
  const lower = message.toLowerCase();
  const needMap: Record<string, string[]> = {
    housing: [
      "housing",
      "shelter",
      "homeless",
      "evict",
      "rent",
      "place to stay",
    ],
    food: ["food", "hungry", "snap", "wic", "food bank"],
    healthcare: ["health", "doctor", "medical", "medicaid", "mental health"],
    employment: ["job", "work", "employment", "career", "hiring"],
    education: ["school", "education", "ged", "college"],
    legal: ["legal", "lawyer", "court", "expungement", "probation"],
    financial: ["money", "bills", "debt", "financial"],
    "substance-abuse": [
      "substance",
      "addiction",
      "drug",
      "alcohol",
      "recovery",
      "vaping",
      "vape",
      "e-cigarette",
      "fentanyl",
      "opioid",
      "cannabis",
      "marijuana",
      "prescription misuse",
      "overdose",
      "naloxone",
    ],
    childcare: ["childcare", "daycare", "child care"],
    transportation: ["transportation", "bus", "ride", "transit"],
    research: [
      "research",
      "implementation science",
      "re-aim",
      "cfir",
      "evidence-based",
      "dissemination",
      "fidelity",
    ],
    chw: [
      "community health worker",
      "chw",
      "home visit",
      "caseload",
      "screening referral",
      "frontline health",
    ],
  };
  for (const [need, keywords] of Object.entries(needMap)) {
    if (keywords.some((kw) => lower.includes(kw))) needs.push(need);
  }
  return needs;
}

const navigatorRateLimit = new Map<
  string,
  { count: number; resetAt: number }
>();

/**
 * Applies all available Navigator grounding rules to a buffered AI response
 * and returns the grounded text. This is the single point where pre-client
 * enforcement happens for ALL Navigator response paths (primary collaborativeStream,
 * OpenRouter fallback, and last-resort streamAIResponse). Decisions are
 * recorded to the tamper-evident claim chain. Qualitative AI judgment calls
 * (fit scores, correlation estimates, narrative framing) carry no ClaimRule
 * and are left entirely alone by design.
 */
function applyNavigatorGrounding(
  text: string,
  censusIndicators: NavigatorCensusIndicators | null,
  gvContext: ReturnType<typeof detectGunViolenceContext>,
  gvTotals: NavigatorGvTotals | null,
  grantHuntTotal: number | null,
): string {
  if (!text || text.length === 0) return text;
  try {
    const rules: ClaimRule[] = [];

    // Census indicators
    if (censusIndicators) {
      const { povertyRate, unemploymentRate, uninsuredRate } = censusIndicators;
      if (povertyRate != null && Number.isFinite(povertyRate)) {
        rules.push(
          buildPercentRule("nav-poverty-rate", /poverty/i, povertyRate),
        );
      }
      if (unemploymentRate != null && Number.isFinite(unemploymentRate)) {
        rules.push(
          buildPercentRule(
            "nav-unemployment-rate",
            /unemploy(?:ment|ed)/i,
            unemploymentRate,
          ),
        );
      }
      if (uninsuredRate != null && Number.isFinite(uninsuredRate)) {
        rules.push(
          buildPercentRule("nav-uninsured-rate", /uninsured/i, uninsuredRate),
        );
      }
    }

    // GV national death/homicide/suicide totals (only when GV dataset was injected)
    if (gvContext.injected && gvTotals) {
      const { totalDeaths, totalHomicides, totalSuicides } = gvTotals;
      const countExtract = (sentence: string) => {
        const claims: { value: number; kind: string }[] = [];
        const re =
          /(\d[\d,]*(?:\.\d+)?)\s*(?:deaths?|killed|fatalities|homicides?|suicides?|firearm deaths?|gun deaths?)/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(sentence))) {
          const n = parseFloat(m[1].replace(/,/g, ""));
          if (Number.isFinite(n)) claims.push({ value: n, kind: "count" });
        }
        return claims;
      };
      const allowedCounts = [totalDeaths, totalHomicides, totalSuicides].filter(
        (n): n is number => n != null && Number.isFinite(n),
      );
      if (allowedCounts.length > 0) {
        rules.push(
          buildAnyOfRule(
            "nav-gv-death-count",
            /\b(?:deaths?|killed|fatalities|homicides?|suicides?|firearm deaths?|gun deaths?)\b/i,
            countExtract,
            allowedCounts,
            (v) => Math.max(5000, v * 0.07),
          ),
        );
      }
    }

    // Grant hunt total (only when the hunt engine actually ran)
    if (grantHuntTotal != null && Number.isFinite(grantHuntTotal)) {
      rules.push(
        buildAnyOfRule(
          "nav-grant-hunt-total",
          /\b(?:found|identified|discovered|surfaced|returned|available)\s+(?:\d[\d,]*)\s+(?:grants?|opportunities?|results?)\b|\b(?:\d[\d,]*)\s+(?:grants?|opportunities?|results?)\s+(?:found|identified|available)/i,
          (sentence) => {
            const claims: { value: number; kind: string }[] = [];
            const re =
              /\b(\d[\d,]*)\s+(?:grants?|opportunities?|funding\s+opportunities?|results?)\b/gi;
            let m: RegExpExecArray | null;
            while ((m = re.exec(sentence))) {
              const n = parseInt(m[1].replace(/,/g, ""), 10);
              if (Number.isFinite(n)) claims.push({ value: n, kind: "count" });
            }
            return claims;
          },
          [grantHuntTotal],
          (v) => Math.max(2, v * 0.15),
        ),
      );
    }

    if (rules.length === 0) return text;

    const result = enforceGroundedClaims(text, rules);
    if (result.decisions.length > 0) {
      const subject = censusIndicators
        ? `ZIP ${censusIndicators.zip}`
        : (gvContext.geography ?? "navigator");
      recordClaimDecisions("navigator", subject, result.decisions).catch(
        (err) =>
          console.error(
            "[Navigator] claim-chain record failed (non-fatal):",
            err,
          ),
      );
    }
    if (result.droppedAny) {
      console.warn(
        `[Navigator] grounding engine redacted ungrounded claim(s). Decisions:`,
        result.decisions
          .filter((d) => d.verdict !== "kept")
          .map((d) => ({
            rule: d.ruleId,
            verdict: d.verdict,
            sentence: d.sentence.slice(0, 100),
          })),
      );
    }
    return result.text;
  } catch (err) {
    console.error(
      "[Navigator] applyNavigatorGrounding error (non-fatal):",
      err,
    );
    return text;
  }
}

export function registerNavigatorRoutes(app: Express) {
  app.post("/api/navigator/chat", async (req, res) => {
    const userId = getUserId(req);

    // Rate-limit by userId (authenticated) or IP (anonymous)
    const rateLimitKey = userId || (req.ip ?? "anon");
    const now = Date.now();
    const userLimit = navigatorRateLimit.get(rateLimitKey);
    const maxMsgs = userId ? 20 : 8;
    if (userLimit && now < userLimit.resetAt) {
      if (userLimit.count >= maxMsgs) {
        return res.status(429).json({
          error:
            "Rate limit exceeded. Please wait before sending more messages.",
        });
      }
      userLimit.count++;
    } else {
      navigatorRateLimit.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
    }

    const { message, conversationId, responseMode } = req.body;
    const quickFirst = !responseMode || responseMode === "brief";

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Cap message length — don't trust the client to send a reasonable size.
    // Oversized input drives cost and can be an abuse/DoS vector.
    const MAX_MESSAGE_CHARS = 8000;
    if (message.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({
        error: `Message is too long (max ${MAX_MESSAGE_CHARS} characters). Please shorten it and try again.`,
      });
    }

    // Check saved-thread authority before opening SSE; never weaken a 403
    // into a successful transport merely to get an earlier acknowledgment.
    if (!userId && conversationId) {
      return res.status(403).json({ error: "Anonymous users cannot continue saved conversations" });
    }
    let ownedConversation: typeof navigatorConversations.$inferSelect | undefined;
    if (userId && conversationId) {
      [ownedConversation] = await db.select().from(navigatorConversations)
        .where(and(eq(navigatorConversations.id, conversationId), eq(navigatorConversations.userId, userId))).limit(1);
      if (!ownedConversation) {
        return res.status(403).json({ error: "Conversation not found or access denied" });
      }
    }

    // Attach disconnect handling before context assembly so an abandoned
    // request is observed while GIS/data lookups are still in flight.
    let clientDisconnected = false;
    let responseCompleted = false;
    const requestAbortController = new AbortController();
    res.on("close", () => {
      clientDisconnected = true;
      if (!responseCompleted) requestAbortController.abort();
    });
    req.on("aborted", () => {
      clientDisconnected = true;
      requestAbortController.abort();
    });
    const ensureClientConnected = () => {
      if (requestAbortController.signal.aborted || clientDisconnected || res.destroyed || res.writableEnded) {
        throw new Error("Navigator client disconnected before provider work");
      }
    };
    const progress = startNavigatorProgress(res, requestAbortController);
    const safeWrite = (payload: string): boolean => {
      if (clientDisconnected || res.destroyed || res.writableEnded || requestAbortController.signal.aborted) return false;
      res.write(payload);
      return true;
    };
    progress.setPhase("context");

    let contextResult: Awaited<ReturnType<typeof assembleContext>>;
    try {
      contextResult = await withinNavigatorBudget(signal => assembleContext(req, message, signal), quickFirst ? 3_000 : 8_000, requestAbortController.signal);
    } catch (error) {
      if (requestAbortController.signal.aborted) return;
      console.warn("[Navigator] Community context unavailable within interactive budget:", error instanceof Error ? error.message : "context failure");
      contextResult = {
        context: "\n[CONTEXT UNAVAILABLE: Community data could not be loaded for this first answer. Disclose this limit. Do not invent local facts, contacts, eligibility, or figures.]",
        censusIndicators: null, gvTotals: null,
      };
      progress.setPhase("context", "Community information is unavailable for this first answer. Continuing with general guidance, not verified local facts.");
    }
    const {
      context: contextData,
      censusIndicators: navigatorCensusIndicators,
      gvTotals: navigatorGvTotals,
    } = contextResult;
    // A client can disconnect while GIS/provider context is assembling. Stop
    // before grant search or any model/provider work, and guard every later SSE
    // write so late callbacks cannot write to a dead socket.
    try {
      ensureClientConnected();
    } catch {
      return;
    }
    // Recompute (cheap, regex-only) in this handler's scope so the "Continue
    // in Tell-a-Story" carry-over (#216) can reference it — assembleContext's
    // internal detection variables are local to that function.
    const gunViolenceContext = detectGunViolenceContext(message);

    // Grant hunt total — populated below when the hunt engine fires.
    // Initialized null; set to allHits.length after the hunt completes.
    let navigatorGrantHuntTotal: number | null = null;

    // Inject response-depth instructions based on user's selected mode
    const RESPONSE_MODE_INSTRUCTIONS: Record<string, string> = {
      brief: `\n\n[RESPONSE MODE: QUICK]\nThe user wants a concise, focused answer. Keep your response to 2-4 short paragraphs. Answer the specific question directly, mention 1-2 key resources with real contact info, and close by offering to go deeper on any aspect. Do not pad. Do not produce headers or sections. Just a warm, direct answer.`,
      detailed: `\n\n[RESPONSE MODE: DETAILED]\nGive a thorough, empathetic response. Cover the person's situation fully, provide 4-8 specific resources with a sentence explaining why each one fits their situation, link relevant platform tools naturally, and end with clear concrete next steps. This is the standard depth.`,
      report: `\n\n[RESPONSE MODE: FULL REPORT]\nThe user has specifically requested a comprehensive report. Write a deep, multi-section document — similar to a professional community briefing. Use **bold section headers**. Include ALL of the following sections (adapt names to fit the topic): (1) **Understanding Your Situation** — genuine acknowledgment of their full context and what makes their situation unique; (2) **Immediate Resources** — 6-10 specific organizations/programs with name, phone, website, hours, eligibility, and a sentence on why it fits them specifically; (3) **State & Federal Programs** — what they qualify for, how to apply, what to say when they call; (4) **Your Step-by-Step Action Plan** — numbered concrete steps, in the right order, with who to call first and what to say; (5) **Platform Tools That Apply** — specific ThriveUp pages that directly help, explained; (6) **What to Watch Out For** — common barriers, waitlists, deadlines, documentation they'll need; (7) **Longer-Term Path** — what success looks like 3-6 months out. Write as a woven narrative within each section — not bullet dumps. Aim for 800-2000+ words. This is a real document that should be useful on its own.`,
    };
    const modeInstruction =
      RESPONSE_MODE_INSTRUCTIONS[responseMode] ||
      RESPONSE_MODE_INSTRUCTIONS.detailed;

    // Youth Mode — calibrated for young people (14-24) navigating housing
    // instability (YHSI). Opt-in via request body; changes register, not rules.
    // Effective value may also be upgraded from the stored conversation flag
    // below, so re-opened Youth Mode threads stay youth-friendly.
    const youthModeProvided = typeof req.body.youthMode === "boolean";
    let effectiveYouthMode = req.body.youthMode === true;
    const buildYouthModeInstruction = () =>
      effectiveYouthMode
        ? `\n\n[YOUTH MODE]\nYou are talking with a young person (likely 14-24) who may be experiencing housing instability. Adjust:\n- Language: plain, warm, zero bureaucratic jargon. Short sentences. Never condescending.\n- Safety first: if they describe being unsheltered, in danger, or fleeing, lead with immediate options (school McKinney-Vento liaison, local youth shelter, National Runaway Safeline 1-800-786-2929) before anything else.\n- Rights they often don't know: McKinney-Vento rights to stay enrolled in school without a permanent address, without a parent signature, with transportation; FAFSA independent-student status for unaccompanied homeless youth (no parent info needed — their school liaison or a shelter can verify).\n- Route housing-adjacent needs proactively: a question about a job or school almost always has a housing dimension — surface both.\n- Never require them to share legal name, immigration status, or family details to get help. Never suggest anything that would out them to an unsafe household.\n- Respect their agency: offer options, not directives.${YOUTH_MODE_KNOWLEDGE}`
        : "";

    // Personal RAG — inject user-specific context when authenticated
    let personalContextBlock = "";
    if (userId) {
      try {
        const personalCtx = await withinNavigatorBudget(signal => getPersonalContext(userId, message, signal), 2_000, requestAbortController.signal);
        personalContextBlock = personalCtx.contextBlock;
      } catch (err) {
        console.error("[Navigator] Personal context error:", err);
      }
    }

    if (requestAbortController.signal.aborted) return;
    // Only persist conversations for authenticated users
    // Generate a per-request UUID for the DeepSeek R1 poll job.
    // This is SEPARATE from activeConversationId — anonymous users get no DB
    // conversation but still need a key so R1 results can be polled.
    const deepThinkJobId = randomUUID();
    // Deep reasoning is optional work. Do not start an unbounded collection of
    // background jobs when providers are slow or clients abandon requests.
    const deepThinkAdmitted =
      !quickFirst && Boolean(
        process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY &&
          process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
      ) && admitDeepThinkJob(deepThinkJobId);
    requestAbortController.signal.addEventListener(
      "abort",
      () => releaseDeepThinkJob(deepThinkJobId),
      { once: true },
    );

    if (!userId && conversationId) {
      return res.status(403).json({
        error: "Anonymous users cannot continue saved conversations",
      });
    }

    let activeConversationId = conversationId || null;
    const detectedNavigatorGeography = detectNavigatorContextGeography(message);

    if (userId) {
      try {
        if (!activeConversationId) {
          const [newConvo] = await db
            .insert(navigatorConversations)
            .values({
              userId,
              title: generateConversationTitle(message),
              identifiedNeeds: detectNeeds(message),
              userContext: detectedNavigatorGeography
                ? { geography: detectedNavigatorGeography }
                : undefined,
              youthMode: effectiveYouthMode,
            })
            .returning();
          activeConversationId = newConvo.id;
        } else {
          const owned = ownedConversation;

          if (!owned) {
            return res
              .status(403)
              .json({ error: "Conversation not found or access denied" });
          }

          const nextUserContext = updateNavigatorUserContext(
            owned.userContext,
            detectedNavigatorGeography,
          );

          // The active thread owns its Youth Mode value. Persist both
          // transitions so turning the setting off on an existing thread is
          // as durable as turning it on.
          if (!youthModeProvided) {
            effectiveYouthMode = owned.youthMode;
          }

          const newNeeds = detectNeeds(message);
          if (newNeeds.length > 0) {
            const allNeeds = Array.from(
              new Set([...(owned.identifiedNeeds || []), ...newNeeds]),
            );
            await db
              .update(navigatorConversations)
              .set({
                identifiedNeeds: allNeeds,
                lastMessageAt: new Date(),
                ...(owned.youthMode !== effectiveYouthMode
                  ? { youthMode: effectiveYouthMode }
                  : {}),
                ...(detectedNavigatorGeography
                  ? { userContext: nextUserContext }
                  : {}),
              })
              .where(eq(navigatorConversations.id, activeConversationId));
          } else {
            await db
              .update(navigatorConversations)
              .set({
                lastMessageAt: new Date(),
                ...(owned.youthMode !== effectiveYouthMode
                  ? { youthMode: effectiveYouthMode }
                  : {}),
                ...(detectedNavigatorGeography
                  ? { userContext: nextUserContext }
                  : {}),
              })
              .where(eq(navigatorConversations.id, activeConversationId));
          }
        }

        // ── Journey spine write — non-blocking, fire-and-forget ────────────────
        // Every Navigator message that surfaces needs updates the shared journey
        // envelope so the Benefits Screener, CHW referral form, and community
        // brief can pre-populate without asking the user to repeat themselves.
        if (activeConversationId) {
          db.select({ identifiedNeeds: navigatorConversations.identifiedNeeds })
            .from(navigatorConversations)
            .where(eq(navigatorConversations.id, activeConversationId))
            .limit(1)
            .then(async ([convo]) => {
              if (!convo?.identifiedNeeds?.length) return;
              const geography = detectedNavigatorGeography
                ? [
                    detectedNavigatorGeography.city,
                    detectedNavigatorGeography.state,
                    detectedNavigatorGeography.zip,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : undefined;
              await mergeJourneyNeeds(
                userId,
                convo.identifiedNeeds,
                geography || undefined,
              );
            })
            .catch((err) => {
              console.error("[Navigator] Journey spine write failed:", err instanceof Error ? err.message : String(err));
            });
        }

        await db.insert(navigatorMessages).values({
          conversationId: activeConversationId,
          role: "user",
          content: message,
        });
      } catch (err) {
        console.error("[Navigator] Error saving message:", err);
      }
    }

    safeWrite(
      `data: ${JSON.stringify({ conversationId: activeConversationId })}\n\n`,
    );

    const fullSystemPrompt =
      NAVIGATOR_SYSTEM_PROMPT +
      contextData +
      personalContextBlock +
      modeInstruction +
      (quickFirst ? "\n[QUICK FIRST ANSWER: Give concise initial guidance. No live grant hunt, nonprofit web research, or multi-engine review has run for this answer. Disclose this when relevant; invite the user to select Detailed for source research. Do not imply current contacts, funding deadlines, eligibility, or local statistics were verified unless explicitly present in supplied context.]" : "") +
      buildYouthModeInstruction();

    const msgs: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: fullSystemPrompt }];

    if (activeConversationId) {
      try {
        const dbHistory = await db
          .select()
          .from(navigatorMessages)
          .where(eq(navigatorMessages.conversationId, activeConversationId))
          .orderBy(desc(navigatorMessages.createdAt))
          .limit(12);

        const recentHistory = dbHistory.reverse().slice(0, -1);
        for (const msg of recentHistory) {
          if (msg.role === "user" || msg.role === "assistant") {
            msgs.push({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            });
          }
        }
      } catch (err) {
        console.error("[Navigator] Error loading conversation history:", err);
      }
    }

    // Arbitrary URL retrieval is intentionally disabled. A DNS pre-check followed
    // by a hostname fetch can be rebound to a private address between the two
    // operations; this route does not have a TLS hostname-validating transport
    // pinned to the validated address. Fail closed rather than risk access to
    // loopback, private, or link-local services.
    const urlMatches = message.match(/https?:\/\/[^\s\]]+/g);
    let augmentedMessage = message;
    if (urlMatches && urlMatches.length > 0) {
      safeWrite(
        `data: ${JSON.stringify({
          urlFetchWarning:
            "For safety, Navigator cannot retrieve pasted web links. Please paste the relevant text or attach a document instead.",
        })}\n\n`,
      );
    }

    // ── Grant Hunt Intent ─────────────────────────────────────────────────────
    // Fires when user says "find grants for [org]", "hunt for grants for City of Manor", etc.
    // Runs the full AI Hunt engine inline and injects ranked results + alignment framing
    // into the context so the AI tells the story, not just lists the grants.
    try {
      ensureClientConnected();
    } catch {
      return;
    }
    const grantHuntMatch =
      /(?:find|search|hunt|look\s+for|get|show\s+me|discover|pull)\s+(?:a\s+)?grants?\s+for\s+(?:the\s+)?(.+?)(?:\s*[.?!]?\s*$)/i.exec(
        message.trim(),
      ) ||
      /grants?\s+(?:available\s+)?for\s+(?:the\s+)?(.+?)(?:\s*[.?!]?\s*$)/i.exec(
        message.trim(),
      ) ||
      /what\s+grants?\s+(?:can|could|would|should|does|do|is\s+available(?:\s+for)?)\s+(?:the\s+)?(.+?)\s+(?:apply|qualify|get|use)/i.exec(
        message.trim(),
      );

    if (grantHuntMatch && !quickFirst) {
      progress.setPhase("research");
      const orgDesc = grantHuntMatch[1].trim().replace(/['"]/g, "");
      try {
        console.log(`[Navigator] Grant hunt intent for: "${orgDesc}"`);
        // Immediately signal the frontend so the user sees activity, not a frozen spinner
        safeWrite(
          `data: ${JSON.stringify({ grantHuntProgress: { org: orgDesc, step: "querying", message: `Hunting Grants.gov for "${orgDesc}"…` } })}\n\n`,
        );

        // Step 1 — AI generates targeted queries
        ensureClientConnected();
        const queryPlan = await generateAIJSON<{
          queries: string[];
          orgType: string;
          primaryDomains: string[];
        }>(
          `Generate 6 targeted Grants.gov keyword search queries for this organization: "${orgDesc}"\nReturn ONLY JSON: {"queries":["..."],"orgType":"nonprofit","primaryDomains":["..."]}\nRules: 2-5 words per query, federal grant terminology, mix broad + specific, no duplicates`,
          withEthicalPreamble(
            "You are a federal grant search specialist. Return only valid JSON, no markdown.",
          ),
        );
        const queries = (queryPlan.queries || []).slice(0, 7);

        // Step 2 — Parallel Grants.gov fetch
        const fetched = await Promise.allSettled(
          queries.map(async (q) => {
            const r = await fetch(
              "https://apply07.grants.gov/grantsws/rest/opportunities/search",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  keyword: q,
                  oppStatuses: "posted",
                  rows: 8,
                }),
                signal: AbortSignal.any([
                  requestAbortController.signal,
                  AbortSignal.timeout(10000),
                ]),
              },
            );
            if (!r.ok) return [];
            const d = await r.json();
            return (d.oppHits || []).map((h: any) => ({
              id: String(h.id || h.number),
              number: h.number || "",
              title: h.title || "Untitled",
              agency: h.agency || "Federal",
              synopsis: (h.synopsis || "").slice(0, 250),
              closeDate: h.closeDate || null,
              cfdaList: (h.cfdaList || []).slice(0, 3),
              sourceUrl: `https://www.grants.gov/search-results-detail/${h.id}`,
              matchedQuery: q,
            }));
          }),
        );

        // Step 3 — Deduplicate
        const seen = new Set<string>();
        const allHits: any[] = [];
        for (const r of fetched) {
          if (r.status === "fulfilled") {
            for (const h of r.value) {
              if (!seen.has(h.id)) {
                seen.add(h.id);
                allHits.push(h);
              }
            }
          }
        }

        // Step 4 — Score top results
        let scored = allHits.slice(0, 20);
        if (scored.length > 0) {
          try {
            ensureClientConnected();
            const scoreResult = await generateAIJSON<{
              scores: Array<{ index: number; score: number; reason: string }>;
            }>(
              `Score each grant 0-100 fit for "${orgDesc}":\n${scored.map((h, i) => `${i}. ${h.title} | ${h.agency} | ${h.synopsis.slice(0, 120)}`).join("\n")}\nReturn ONLY JSON: {"scores":[{"index":0,"score":85,"reason":"2-sentence alignment rationale"},...]}`,
              withEthicalPreamble(
                "Grant fit analyst. Be specific and accurate. Return only valid JSON.",
              ),
            );
            scored = scored
              .map((h, i) => {
                const s = scoreResult.scores?.find((e) => e.index === i);
                // fitScore is an AI judgment call, not a verified/computed fact —
                // there is no ground truth to check it against. Clamp it to a
                // valid range so a malformed model response can't display a
                // nonsensical number, and label it as an estimate everywhere it
                // is surfaced (see huntBlock below) instead of presenting it as
                // a certified figure.
                const rawScore = typeof s?.score === "number" ? s.score : 50;
                const fitScore = Math.max(
                  0,
                  Math.min(100, Math.round(rawScore)),
                );
                return { ...h, fitScore, reason: s?.reason ?? "" };
              })
              .sort((a, b) => b.fitScore - a.fitScore)
              .slice(0, 10);
          } catch {
            scored = scored.slice(0, 10);
          }
        }

        // Step 5 — Inject as structured context block
        const huntBlock = `\n\n[GRANT HUNT ENGINE RESULTS — Live from Grants.gov for "${orgDesc}"]
Total found: ${allHits.length} | Showing top ${scored.length} ranked by AI fit score
Queries fired: ${queries.join(" · ")}

${scored
  .map((h, i) =>
    [
      `${i + 1}. ${h.fitScore ?? "?"}% AI-ESTIMATED FIT (not a certified score) — ${h.title}`,
      `   Agency: ${h.agency}`,
      h.closeDate
        ? `   Deadline: ${new Date(h.closeDate).toLocaleDateString()}`
        : `   Deadline: Open`,
      h.cfdaList.length ? `   CFDA: ${h.cfdaList.join(", ")}` : "",
      h.reason ? `   Alignment: ${h.reason}` : "",
      `   Link: ${h.sourceUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  )
  .join("\n\n")}

[YOUR RESPONSE MUST]:
1. Open by naming "${orgDesc}" and what makes them a competitive applicant for federal funding
2. For the top 5 grants: write 2-3 sentences each — what it funds, why ${orgDesc} aligns, and the specific narrative hook that wins
3. Be direct about any fit gaps ("this one is a stretch because…")
4. Close with: "I can draft the full narrative, budget justification, or logic model for any of these — just pick one."
Do NOT just list grants. Tell the alignment story. Be specific. Use the org name throughout.`;

        augmentedMessage = message + huntBlock;
        // Capture the real grant count for pre-client grounding (so the AI
        // can't restate a different total than what the hunt actually found).
        navigatorGrantHuntTotal = allHits.length;
        // Emit structured grant cards BEFORE the text stream — frontend renders them with "Add to Pipeline" buttons
        safeWrite(
          `data: ${JSON.stringify({ grantHuntResults: scored, grantOrgName: orgDesc, totalFound: allHits.length })}\n\n`,
        );
        console.log(
          `[Navigator] Grant hunt complete: ${allHits.length} found, top ${scored.length} scored`,
        );
      } catch (huntErr) {
        console.error("[Navigator] Grant hunt error:", huntErr);
        // Fall through — AI responds without hunt data (still helpful)
      }
    }
    // ── End Grant Hunt Intent ─────────────────────────────────────────────────

    // ── Named-Organization Identity Lookup ──────────────────────────────────
    // Fires when the user asks about a SPECIFIC named organization's legal/
    // financial identity (501(c)(3) status, EIN, nonprofit status, past
    // performance, funding/grant history, Form 990 financials) — exactly the
    // class of question the Navigator used to have to decline. Pulls a real
    // IRS record from ProPublica's Nonprofit Explorer (free, keyless) and,
    // when configured, supplements with live web search for mission/website
    // details an IRS record doesn't carry. Fails soft: if no candidate org
    // name is found, or both lookups miss, the AI falls back to its normal
    // (honest, non-fabricating) behavior.
    const NONPROFIT_INTENT_RE =
      /\b(501\s?\(?c\)?\s?\(?3\)?|501c3|\bein\b|tax[- ]exempt|nonprofit status|is\s+[a-z][a-z\s]+\s+a\s+(?:real\s+)?(?:nonprofit|charity)|past performance|funding history|grant history|financials?|form\s?990|\b990\b)\b/i;
    let orgInfoBlock = "";
    if (NONPROFIT_INTENT_RE.test(message) && !quickFirst) {
      progress.setPhase("research");
      const capRuns =
        message.match(
          /\b[A-Z][a-zA-Z&'.-]*(?:\s+(?:of|for|the|and)?\s*[A-Z][a-zA-Z&'.-]*){0,5}\b/g,
        ) || [];
      const STOPWORDS = new Set([
        "Tell",
        "What",
        "Who",
        "Is",
        "The",
        "Are",
        "Does",
        "Do",
        "I",
        "Can",
        "Will",
        "EIN",
        "Form",
      ]);
      const candidate = capRuns
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.split(/\s+/).length >= 2 && !STOPWORDS.has(s.split(/\s+/)[0]),
        )
        .sort((a, b) => b.length - a.length)[0];

      if (candidate) {
        try {
          const blocks: string[] = [];
          ensureClientConnected();
          const profile = await fetchNonprofitProfile(candidate);
          if (profile) {
            blocks.push(formatNonprofitProfileBlock(profile, candidate));
          }
          if (isPerplexityAvailable()) {
            try {
              const research = await perplexityResearch(
                `What does the organization "${candidate}" do (mission, programs, who they serve)? Where are they located, and what is their official website? If you cannot find reliable current information, say so plainly rather than guessing.`,
                "You are a careful researcher supporting a case worker. Cite your sources. Never invent a website, phone number, program detail, or funder you cannot verify.",
                undefined,
                requestAbortController.signal,
              );
              blocks.push(
                `\n\n[LIVE WEB RESEARCH for "${candidate}"]\n${research.text}${research.citations.length ? `\nSources: ${research.citations.join(", ")}` : ""}`,
              );
            } catch (webErr) {
              console.error(
                "[Navigator] Nonprofit web research error:",
                webErr,
              );
            }
          }
          if (blocks.length > 0) {
            orgInfoBlock = blocks.join("\n");
            console.log(
              `[Navigator] Nonprofit identity lookup fired for "${candidate}" (ProPublica match: ${!!profile}, web research: ${isPerplexityAvailable()})`,
            );
          }
        } catch (err) {
          console.error("[Navigator] Nonprofit lookup error:", err);
        }
      }
    }
    if (orgInfoBlock) {
      augmentedMessage = augmentedMessage + orgInfoBlock;
    }
    // ── End Named-Organization Identity Lookup ──────────────────────────────

    msgs.push({ role: "user", content: augmentedMessage });

    let fullResponse = "";
    const persistNavigatorAnswer = async (answer: string, honesty: ReturnType<typeof navigatorHonesty>) => {
      progress.dispose();
      if (!userId || !activeConversationId || clientDisconnected) return;
      try {
        await withinNavigatorBudget((async () => {
          await db.insert(navigatorMessages).values({
            conversationId: activeConversationId, role: "assistant",
            content: answer, metadata: { honesty },
          });
          if (answer.length > 50) {
            await db.update(navigatorConversations)
              .set({ summary: answer.substring(0, 200).replace(/\n/g, " ") })
              .where(eq(navigatorConversations.id, activeConversationId));
          }
        })(), 2_000, requestAbortController.signal);
      } catch (error) {
        console.error("[Navigator] Error saving response:", error);
        safeWrite(`data: ${JSON.stringify({ content: "\n\nHistory: saving this answer has not been confirmed. Keep a copy if you need it; a pending database write may still finish." })}\n\n`);
      }
    };
    const sourceMetadata = {
      census: {
        status: navigatorCensusIndicators ? "available" : "unavailable",
        geography: navigatorCensusIndicators?.zip ?? null,
        disclosure: navigatorCensusIndicators
          ? "Aggregate Census indicators were available for the requested ZIP."
          : "Census indicators were unavailable; no substitute values were used.",
      },
      gunViolence: gunViolenceContext.injected
        ? {
            status: navigatorGvTotals &&
              Object.values(navigatorGvTotals).some((value) => typeof value === "number")
              ? "available"
              : "unavailable",
            geography: gunViolenceContext.geography,
            state: gunViolenceContext.state,
            disclosure: "Gun-violence source fields remain unavailable when the upstream registry does not return them.",
          }
        : { status: "not_requested", geography: null, state: null },
    };

    // Detect whether the user attached documents — if so we skip RAG retrieval
    // (the document IS the relevant context) and route to Claude's 200K window.
    const hasAttachedDocuments = augmentedMessage.includes(
      "[ATTACHED DOCUMENT:",
    );

    try {
      const tokensByMode: Record<string, number> = {
        brief: 600,
        detailed: 5000,
        report: 16000,
      };
      const modeTokens = quickFirst ? 600 : tokensByMode[responseMode] || 5000;
      progress.setPhase("answer");
      await collaborativeStream(({
        fastFirst: quickFirst,
        prompt: augmentedMessage,
        systemPrompt: msgs.find((m) => m.role === "system")?.content,
        maxTokens: hasAttachedDocuments ? 8000 : modeTokens,
        skipRAG: hasAttachedDocuments,
        // Navigator has its own comprehensive system prompt — suppress RPLICE/MAP-GAP
        // framework injection that causes consulting-speak "MEASURE Phase" output.
        noFrameworkInjection: !hasAttachedDocuments,
        // Keep request cancellation available at the orchestration boundary;
        // fallback/provider work below uses the same signal.
        signal: requestAbortController.signal,
        onChunk: (content: string) => {
          // Buffer server-side — grounding must run before the response
          // reaches the client. SSE content events are emitted all at once
          // inside onDone after the grounded text has been produced.
          // Meta/synthesisComplete/keepAlive events are NOT buffered (they
          // carry no claimable content) so the client still sees early signals.
          fullResponse += content;
        },
        onMeta: (meta: any) => {
          safeWrite(
            `data: ${JSON.stringify({ meta: { engines: meta.engines, ragSources: meta.ragSources.length, frameworks: meta.frameworks } })}\n\n`,
          );
        },
        onSynthesisComplete: () => {
          progress.setPhase("checking");
        },
        onKeepAlive: () => {
          // SSE comment — keeps the proxy / mobile connection alive during R1 wait
          safeWrite(`: keepalive\n\n`);
        },
        onDeepThinking: deepThinkAdmitted ? (text: string, engineId: string, timeMs: number) => {
          releaseDeepThinkJob(deepThinkJobId);
          // SSE is already closed when this fires (Phase 2 is background).
          // Strip <think>...</think> tags then store for client polling.
          // Key by deepThinkJobId (not activeConversationId) so anonymous
          // users (who have no conversationId) still get their R1 results.
          const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          if (cleaned.length > 20) {
            deepThinkResultStore.set(deepThinkJobId, {
              text: cleaned,
              engineId,
              timeMs,
              expiresAt: Date.now() + DEEP_THINK_TTL_MS,
              ownerUserId: userId,
            });
            console.log(
              `[Navigator] R1 stored for poll — job: ${deepThinkJobId} (${timeMs}ms)`,
            );
          }
        } : undefined,
        onDone: async (result: any) => {
          if (clientDisconnected || res.destroyed || res.writableEnded) return;
          // ── Pre-client grounding enforcement ────────────────────────────────
          // fullResponse is the full buffered AI output. Run it through the
          // shared grounding helper BEFORE writing to SSE or the DB. Ungrounded
          // sentences are redacted; all decisions go to the claim chain.
          // AI judgment calls (fit scores, qualitative framing) carry no
          // ClaimRule and are left entirely alone by design.
          // R1/R2: phone numbers and links must come from the supplied context.
          const groundedResponse = groundContacts(applyNavigatorGrounding(
            fullResponse,
            navigatorCensusIndicators,
            gunViolenceContext,
            navigatorGvTotals,
            navigatorGrantHuntTotal,
          ), msgs.map((m: any) => (typeof m.content === "string" ? m.content : "")).join("\n")).text;
          const honesty = navigatorHonesty(groundedResponse, navigatorCensusIndicators, navigatorGvTotals, gunViolenceContext.injected, navigatorGrantHuntTotal);
          safeWrite(`data: ${JSON.stringify({ honesty })}\n\n`);

          // Emit the grounded response text to the client as a content SSE event.
          // The response was buffered (not streamed live) so the client receives
          // only the verified, grounded text.
          // Generation is complete. Do not let its deadline claim there is no
          // answer while an authenticated conversation write is finishing.
          progress.dispose();
          if (groundedResponse.length > 0) {
            safeWrite(
              `data: ${JSON.stringify({ content: groundedResponse })}\n\n`,
            );
          }

          // Persist the grounded text (not the raw model output) so the DB and
          // the user always see the same thing.
          await persistNavigatorAnswer(groundedResponse, honesty);

          // Only advertise a deep job when one was actually admitted.
          safeWrite(
            `data: ${JSON.stringify({ done: true, deepThinkJobId: deepThinkAdmitted ? deepThinkJobId : undefined, sourceMetadata, gunViolenceContext: gunViolenceContext.injected ? { geography: gunViolenceContext.geography, state: gunViolenceContext.state } : null, collaborative: { engines: result.engines.filter((e: any) => !e.error).map((e: any) => e.engine), consensusMethod: result.consensusMethod, ragChunks: result.ragContext.chunkCount, timeMs: result.totalTimeMs } })}\n\n`,
          );
          responseCompleted = true;
          res.end();
        },
        onError: async (error: Error) => {
          console.error("[Navigator] AI error:", error);
          // All collaborative engines failed — stream directly from OpenRouter
          // (fast, streaming, no multi-provider waterfall delay).
          console.log(
            "[Navigator] Falling back to OpenRouter direct stream...",
          );
          const orKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
          const orBase = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
          try {
            if (orKey && orBase) {
              const orClient = new OpenAI({ apiKey: orKey, baseURL: orBase });
              // Use the fastest available model on OR — haiku is ~1-3s TTFT
              const orStream = await orClient.chat.completions.create({
                model: "anthropic/claude-haiku-4-5",
                messages: msgs as any,
                max_tokens: 2000,
                stream: true,
              }, { signal: requestAbortController.signal } as any);
              let fallbackResponse = "";
              for await (const chunk of orStream) {
                ensureClientConnected();
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) fallbackResponse += content;
              }
              // Apply grounding to fallback response before emitting
              const fallbackGrounded = groundContacts(applyNavigatorGrounding(
                fallbackResponse,
                navigatorCensusIndicators,
                gunViolenceContext,
                navigatorGvTotals,
                navigatorGrantHuntTotal,
              ), msgs.map((m: any) => (typeof m.content === "string" ? m.content : "")).join("\n")).text;
              const fallbackHonesty = navigatorHonesty(fallbackGrounded, navigatorCensusIndicators, navigatorGvTotals, gunViolenceContext.injected, navigatorGrantHuntTotal);
              safeWrite(`data: ${JSON.stringify({ honesty: fallbackHonesty })}\n\n`);
              if (fallbackGrounded.length > 0) {
                safeWrite(
                  `data: ${JSON.stringify({ content: fallbackGrounded })}\n\n`,
                );
              }
              safeWrite(
                `data: ${JSON.stringify({ synthesisComplete: true })}\n\n`,
              );
              await persistNavigatorAnswer(fallbackGrounded, fallbackHonesty);
              safeWrite(
                `data: ${JSON.stringify({ done: true, sourceMetadata, gunViolenceContext: gunViolenceContext.injected ? { geography: gunViolenceContext.geography, state: gunViolenceContext.state } : null, collaborative: { engines: ["fallback-openrouter"], consensusMethod: "single-engine-fallback", ragChunks: 0, timeMs: 0 } })}\n\n`,
              );
              responseCompleted = true;
              res.end();
            } else {
              // No OR key — last-resort waterfall (slow but better than nothing)
              let lastResortResponse = "";
              await streamAIResponse({
                messages: msgs,
                signal: requestAbortController.signal,
                onChunk: (content) => {
                  lastResortResponse += content;
                },
                onDone: async () => {
                  const lastResortGrounded = groundContacts(applyNavigatorGrounding(
                    lastResortResponse,
                    navigatorCensusIndicators,
                    gunViolenceContext,
                    navigatorGvTotals,
                    navigatorGrantHuntTotal,
                  ), msgs.map((m: any) => (typeof m.content === "string" ? m.content : "")).join("\n")).text;
                  const lastResortHonesty = navigatorHonesty(lastResortGrounded, navigatorCensusIndicators, navigatorGvTotals, gunViolenceContext.injected, navigatorGrantHuntTotal);
                  safeWrite(`data: ${JSON.stringify({ honesty: lastResortHonesty })}\n\n`);
                  if (lastResortGrounded.length > 0) {
                    safeWrite(
                      `data: ${JSON.stringify({ content: lastResortGrounded })}\n\n`,
                    );
                  }
                  safeWrite(
                    `data: ${JSON.stringify({ synthesisComplete: true })}\n\n`,
                  );
                  await persistNavigatorAnswer(lastResortGrounded, lastResortHonesty);
                  safeWrite(
                    `data: ${JSON.stringify({ done: true, sourceMetadata, gunViolenceContext: gunViolenceContext.injected ? { geography: gunViolenceContext.geography, state: gunViolenceContext.state } : null, collaborative: { engines: ["fallback"], consensusMethod: "single-engine-fallback", ragChunks: 0, timeMs: 0 } })}\n\n`,
                  );
                  responseCompleted = true;
                  res.end();
                },
                onError: (err) => {
                  console.error("[navigator] stream error:", err);
                  responseCompleted = true;
                  res.end();
                },
              });
            }
          } catch (fallbackErr) {
            releaseDeepThinkJob(deepThinkJobId);
            if (requestAbortController.signal.aborted) return;
            console.error("[Navigator] Fallback also failed:", fallbackErr);
            safeWrite(
              `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`,
            );
            responseCompleted = true;
            res.end();
          }
        },
      }) as any);
    } catch (error) {
      releaseDeepThinkJob(deepThinkJobId);
      if (requestAbortController.signal.aborted) return;
      console.error("[Navigator] Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate response" });
      } else {
        safeWrite(
          `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`,
        );
        res.end();
      }
    }
  });

  // ── DeepSeek R1 polling endpoint ─────────────────────────────────────────
  // The client polls here every 4s after Phase 1 SSE closes.
  // Returns {status:"pending"} while R1 is still computing, or
  // {status:"complete", text, engineId, timeMs} when done (one-time delivery).
  // No auth required — jobId is a random UUID per request (128-bit entropy),
  // and the response contains only AI analysis text, no personal data.
  app.get("/api/navigator/deep-think/:jobId", (req, res) => {
    const jobId = req.params.jobId as string;
    const entry = deepThinkResultStore.get(jobId);
    // Authenticated jobs are private to their owner. Anonymous jobs retain
    // UUID possession semantics for compatibility with the public chat flow.
    const pollingUserId = getUserId(req);
    if (entry?.ownerUserId && entry.ownerUserId !== pollingUserId) {
      return res.status(403).json({ error: "Deep-think job access denied" });
    }
    if (entry && entry.expiresAt > Date.now()) {
      deepThinkResultStore.delete(jobId); // one-time delivery — consume on read
      return res.json({
        status: "complete",
        text: entry.text,
        engineId: entry.engineId,
        timeMs: entry.timeMs,
      });
    }
    res.json({ status: "pending" });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/navigator/context — returns the calling user's accumulated Navigator
  // state so OTHER tools (benefits screener, CHW dashboard, referral form) can
  // read it without asking the person to repeat themselves.
  //
  // This is the primary cross-tool handoff API that breaks the silo pattern.
  // ─────────────────────────────────────────────────────────────────────────
  app.get("/api/navigator/context", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const convos = await db
        .select({
          id: navigatorConversations.id,
          title: navigatorConversations.title,
          identifiedNeeds: navigatorConversations.identifiedNeeds,
          lastMessageAt: navigatorConversations.lastMessageAt,
          userContext: navigatorConversations.userContext,
        })
        .from(navigatorConversations)
        .where(eq(navigatorConversations.userId, userId))
        .orderBy(desc(navigatorConversations.lastMessageAt))
        .limit(10);

      const allNeeds = [...new Set(convos.flatMap(c => c.identifiedNeeds ?? []))];
      const latest = convos[0] ?? null;
      const latestUserContext =
        latest?.userContext &&
        typeof latest.userContext === "object" &&
        !Array.isArray(latest.userContext)
          ? (latest.userContext as Record<string, unknown>)
          : null;

      return res.json({
        hasContext: convos.length > 0,
        latestConversationId: latest?.id ?? null,
        latestTitle: latest?.title ?? null,
        latestAt: latest?.lastMessageAt ?? null,
        identifiedNeeds: allNeeds,
        geography: sanitizeNavigatorContextGeography(latestUserContext?.geography),
        conversationCount: convos.length,
        conversations: convos.map(c => ({
          id: c.id,
          title: c.title,
          identifiedNeeds: c.identifiedNeeds ?? [],
          lastMessageAt: c.lastMessageAt,
        })),
      });
    } catch (err) {
      console.error("[Navigator] /context error:", err);
      res.status(500).json({ error: "Navigator context unavailable" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/navigator/prefill — structured data for tools that want to prefill
  // their intake forms from the user's Navigator-identified needs.
  // Returns boolean flags in screener-compatible shape so benefits-screener
  // can call this and skip redundant questions.
  // ─────────────────────────────────────────────────────────────────────────
  app.get("/api/navigator/prefill", setPrivateNoStore, requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [latest] = await db
        .select({
          id: navigatorConversations.id,
          title: navigatorConversations.title,
          identifiedNeeds: navigatorConversations.identifiedNeeds,
          userContext: navigatorConversations.userContext,
        })
        .from(navigatorConversations)
        .where(eq(navigatorConversations.userId, userId))
        .orderBy(desc(navigatorConversations.lastMessageAt))
        .limit(1);

      if (!latest) return res.json({ hasContext: false });

      const needs = Array.isArray(latest.identifiedNeeds)
        ? [...new Set(
          latest.identifiedNeeds
            .filter((n): n is string => typeof n === "string")
            .map(n => n.trim().toLowerCase())
            .filter(Boolean),
        )]
        : [];
      const latestUserContext =
        latest.userContext &&
        typeof latest.userContext === "object" &&
        !Array.isArray(latest.userContext)
          ? (latest.userContext as Record<string, unknown>)
          : null;
      let geo = sanitizeNavigatorContextGeography(latestUserContext?.geography);
      if (geo?.zip) {
        const resolved = await resolveZipBestEffort(geo.zip);
        const resolvedGeo = sanitizeNavigatorContextGeography({
          ...geo,
          state: geo.state ?? resolved.state,
          county: geo.county ?? resolved.countyFips,
        });
        const addedState = resolvedGeo?.state && resolvedGeo.state !== geo.state;
        const addedCounty = resolvedGeo?.county && resolvedGeo.county !== geo.county;
        if (resolvedGeo && (addedState || addedCounty)) {
          geo = resolvedGeo;
          try {
            await db
              .update(navigatorConversations)
              .set({
                userContext: {
                  ...(latestUserContext ?? {}),
                  geography: resolvedGeo,
                },
              })
              .where(and(
                eq(navigatorConversations.id, latest.id),
                eq(navigatorConversations.userId, userId),
              ));
          } catch (persistError) {
            console.warn(
              "[Navigator] Could not persist ZIP-resolved geography; returning the validated result:",
              persistError instanceof Error ? persistError.name : "UnknownError",
            );
          }
        }
      }

      const prefill: Record<string, unknown> = {
        hasContext: true,
        conversationId: latest.id,
        conversationTitle: latest.title ?? "Navigator Conversation",
        identifiedNeeds: needs,
        geography: geo,
        // Boolean screener flags inferred from identified needs
        hasChildren:      needs.some(n => ["children", "childcare", "family", "kids"].some(k => n.includes(k))),
        isVeteran:        needs.some(n => ["veteran", "military", "va ", "service member"].some(k => n.includes(k))),
        isDisabled:       needs.some(n => ["disability", "disabled", "ada"].some(k => n.includes(k))),
        isUnemployed:     needs.some(n => ["unemployed", "job loss", "laid off", "employment", "work"].some(k => n.includes(k))),
        isElderly:        needs.some(n => ["elderly", "senior", "aging", "65"].some(k => n.includes(k))),
        isPregnant:       needs.some(n => ["pregnant", "pregnancy", "prenatal", "maternal"].some(k => n.includes(k))),
        isSingleParent:   needs.some(n => ["single parent", "single mom", "single dad"].some(k => n.includes(k))),
      };

      return res.json(prefill);
    } catch (err) {
      console.error(
        "[Navigator] /prefill error:",
        err instanceof Error ? err.name : "UnknownError",
      );
      res.status(500).json({ error: "Navigator prefill unavailable" });
    }
  });

  app.get("/api/navigator/conversations", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const conversations = await db
        .select()
        .from(navigatorConversations)
        .where(eq(navigatorConversations.userId, userId))
        .orderBy(desc(navigatorConversations.lastMessageAt))
        .limit(50);
      res.json(conversations);
    } catch (error) {
      console.error("[Navigator] Error fetching conversations:", error);
      res.status(500).json({ error: "Conversation history unavailable" });
    }
  });

  app.get(
    "/api/navigator/conversations/:id/messages",
    requireAuth,
    async (req, res) => {
      try {
        const userId = getUserId(req)!;
        const conversationId = req.params.id as string;

        const [convo] = await db
          .select()
          .from(navigatorConversations)
          .where(
            and(
              eq(navigatorConversations.id, conversationId),
              eq(navigatorConversations.userId, userId),
            ),
          )
          .limit(1);

        if (!convo) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        const messages = await db
          .select()
          .from(navigatorMessages)
          .where(eq(navigatorMessages.conversationId, conversationId))
          .orderBy(navigatorMessages.createdAt);

        res.json({ messages, youthMode: convo.youthMode === true });
      } catch (error) {
        console.error("[Navigator] Error fetching messages:", error);
        res.status(500).json({ error: "Conversation messages unavailable" });
      }
    },
  );

  app.delete(
    "/api/navigator/conversations/:id",
    requireAuth,
    async (req, res) => {
      try {
        const userId = getUserId(req)!;
        const conversationId = req.params.id as string;

        const [convo] = await db
          .select()
          .from(navigatorConversations)
          .where(
            and(
              eq(navigatorConversations.id, conversationId),
              eq(navigatorConversations.userId, userId),
            ),
          )
          .limit(1);

        if (!convo) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        await db
          .delete(navigatorMessages)
          .where(eq(navigatorMessages.conversationId, conversationId));
        await db
          .delete(navigatorConversations)
          .where(eq(navigatorConversations.id, conversationId));

        res.json({ success: true });
      } catch (error) {
        console.error("[Navigator] Error deleting conversation:", error);
        res.status(500).json({ error: "Failed to delete conversation" });
      }
    },
  );

  app.post("/api/navigator/export", requireAuth, async (req, res) => {
    try {
      const { content, title = "Navigator Response" } = req.body;
      if (!content || typeof content !== "string")
        return res.status(400).json({ error: "content required" });

      const {
        Document,
        Paragraph,
        TextRun,
        HeadingLevel,
        Packer,
        AlignmentType,
      } = await import("docx");

      const children: InstanceType<typeof Paragraph>[] = [];

      // Title block
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "ThriveUp Navigator",
              bold: true,
              size: 20,
              color: "0D9488",
            }),
          ],
        }),
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 32 })],
          heading: HeadingLevel.HEADING_1,
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleString()}`,
              size: 18,
              color: "888888",
            }),
          ],
        }),
      );
      children.push(new Paragraph({ text: "" }));

      // Parse markdown lines into docx paragraphs
      for (const rawLine of content.split("\n")) {
        const line = rawLine.trimEnd();
        if (line.startsWith("### ")) {
          children.push(
            new Paragraph({
              text: line.slice(4),
              heading: HeadingLevel.HEADING_3,
            }),
          );
        } else if (line.startsWith("## ")) {
          children.push(
            new Paragraph({
              text: line.slice(3),
              heading: HeadingLevel.HEADING_2,
            }),
          );
        } else if (line.startsWith("# ")) {
          children.push(
            new Paragraph({
              text: line.slice(2),
              heading: HeadingLevel.HEADING_1,
            }),
          );
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          // Bullet — strip bold markers inline
          const bulletText = line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1");
          children.push(
            new Paragraph({ text: bulletText, bullet: { level: 0 } }),
          );
        } else if (/^\d+\.\s/.test(line)) {
          const numText = line
            .replace(/^\d+\.\s/, "")
            .replace(/\*\*(.*?)\*\*/g, "$1");
          children.push(
            new Paragraph({
              text: numText,
              numbering: { reference: "default-numbering", level: 0 },
            }),
          );
        } else if (line === "") {
          children.push(new Paragraph({ text: "" }));
        } else {
          // Inline bold: split on **...** markers
          const parts = line.split(/\*\*(.*?)\*\*/g);
          const runs = parts.map(
            (part, i) =>
              new TextRun(
                i % 2 === 1 ? { text: part, bold: true } : { text: part },
              ),
          );
          children.push(new Paragraph({ children: runs }));
        }
      }

      const doc = new Document({
        numbering: {
          config: [
            {
              reference: "default-numbering",
              levels: [
                {
                  level: 0,
                  format: "decimal",
                  text: "%1.",
                  alignment: AlignmentType.LEFT,
                },
              ],
            },
          ],
        },
        sections: [{ children }],
      });

      const buffer = await Packer.toBuffer(doc);
      const slug =
        title.replace(/[^a-z0-9]/gi, "_").slice(0, 50) || "navigator_response";
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${slug}.docx"`,
      );
      res.send(buffer);
    } catch (err) {
      console.error("[Navigator] Export error:", err);
      res.status(500).json({ error: "Export failed" });
    }
  });

  app.post(
    "/api/navigator/extract-text",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file)
          return res.status(400).json({ error: "No file uploaded" });
        const { mimetype, originalname, buffer } = req.file;

        if (
          mimetype === "text/plain" ||
          mimetype === "text/markdown" ||
          originalname.match(/\.(txt|md)$/i)
        ) {
          return res.json({
            text: buffer.toString("utf8"),
            name: originalname,
          });
        }

        if (mimetype === "application/pdf" || originalname.match(/\.pdf$/i)) {
          let text = "";
          let ocrUsed = false;

          // Step 1: pdftotext (fast, preserves layout)
          try {
            text = pdfBufferToText(buffer);
          } catch (pdfErr) {
            console.warn(
              "[Navigator] pdftotext failed for",
              originalname,
              pdfErr instanceof Error ? pdfErr.message : pdfErr,
            );
          }

          // Step 2: pdf-parse Node.js fallback (no binary required)
          if (!text || text.trim().length < 50) {
            try {
              const pdfParseModule = await import("pdf-parse");
              const pdfParse =
                typeof pdfParseModule === "function"
                  ? pdfParseModule
                  : "default" in pdfParseModule &&
                      typeof pdfParseModule.default === "function"
                    ? pdfParseModule.default
                    : null;
              if (!pdfParse)
                throw new Error("pdf-parse module has no callable export");
              const parsed = await pdfParse(buffer);
              if (parsed.text && parsed.text.trim().length >= 50) {
                text = parsed.text;
                console.log(
                  `[Navigator] pdf-parse extracted ${text.length} chars from "${originalname}"`,
                );
              }
            } catch (parseErr) {
              console.warn(
                "[Navigator] pdf-parse failed for",
                originalname,
                parseErr instanceof Error ? parseErr.message : parseErr,
              );
            }
          }

          // Step 3: OCR via Claude vision (scanned/image-based PDFs)
          if (!text || text.trim().length < 50) {
            try {
              console.log(
                `[Navigator OCR] Both pdftotext and pdf-parse returned no text for "${originalname}", attempting vision OCR...`,
              );
              text = await ocrPdfBuffer(buffer, originalname);
              ocrUsed = true;
            } catch (ocrErr) {
              console.error(
                "[Navigator OCR] Vision OCR failed for",
                originalname,
                ocrErr instanceof Error ? ocrErr.message : ocrErr,
              );
              text = "";
            }
          }

          return res.json({ text, name: originalname, ocrUsed });
        }

        res.status(415).json({
          error:
            "Unsupported file type. Please upload a PDF or plain text file.",
        });
      } catch (err) {
        console.error("[Navigator] Document extraction error:", err);
        res.status(500).json({ error: "Failed to extract text from document" });
      }
    },
  );
}
