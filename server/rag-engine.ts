import { db } from "./storage";
import { ecosystemKnowledgeChunks, ecosystemPlatforms, ecosystemDirectives, ecosystemDirectiveAcks } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { generateAIResponse, streamAIResponse } from "./ai-provider";
import type { Express, Request, Response } from "express";

interface KnowledgeChunk {
  source: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

const ECOSYSTEM_KNOWLEDGE: KnowledgeChunk[] = [
  {
    source: "ecosystem-overview", category: "overview", title: "ThriveUp Academy Ecosystem Overview",
    content: `ThriveUp Academy is a 20-platform AI-powered workforce development and community enablement ecosystem operated by Dr. Terry Flood, DHA. It serves under-resourced communities in Central Texas (Austin, Manor, Pflugerville) with three regional hubs. The ecosystem addresses the full human lifecycle: education (Pre-K through adult), workforce development, health equity, veteran services, housing stability, and crisis prevention. Every platform is free for individuals. The hub at thrivingcommunitiesforall.com coordinates all 20 platforms through a heartbeat-based compliance system with directive tracking, fidelity grading (A through F), and automated work chaining. The crisis continuum: Prevention → Early Warning → Crisis Support → Stabilization → Recovery & Growth.`,
    keywords: ["thriveup", "ecosystem", "overview", "platforms", "terry flood", "austin", "manor", "pflugerville", "how many", "what is"],
  },
  {
    source: "ecosystem-overview", category: "grants", title: "Active Grant Portfolio — 5 Grants",
    content: `ThriveUp Academy has 5 active grant opportunities:
1. Drug-Free Communities (DFC) — $625,000, deadline April 14, 2026. Focus: substance abuse prevention, coalition building, community-based strategies. Aligned platforms: 14.
2. WIOA (Workforce Innovation & Opportunity Act) — $200K–$500K. Focus: workforce training, career pathways, job readiness, employer engagement. Aligned platforms: 8.
3. Foundation Grant — $100K–$500K. Focus: community impact, education equity, wraparound services. Aligned platforms: 3.
4. St. David's Foundation — up to $1M, deadline March 30, 2026. Focus: health equity, maternal health, mental health, community health workers. Aligned platforms: 12.
5. SSG Fox VA Grant — $750K, deadline June 12–18, 2026. Focus: veteran services, suicide prevention, transition support, peer support. Aligned platforms: 10.
Total potential funding: up to $3.375M across all grants.`,
    keywords: ["grants", "dfc", "wioa", "foundation", "st davids", "ssg fox", "funding", "deadline", "money", "amount"],
  },
  {
    source: "ecosystem-overview", category: "regional", title: "Regional Hub Strategy — Austin, Manor, Pflugerville",
    content: `ThriveUp Academy operates three regional community hubs in Central Texas:
1. Austin Hub — Primary hub. Austin's housing affordability crisis (median home $429K–$435K, only 2 of 75 zip codes affordable). Focus: workforce development, housing stability, substance abuse prevention, coalition building.
2. Manor Hub — Rural/suburban community. Focus: youth development, family support, community resource navigation, agricultural workforce pathways.
3. Pflugerville Hub — Rapidly growing suburban community. Focus: newcomer integration, multicultural services, youth education, workforce training for growing tech corridor.
Each hub adapts the same 20-platform ecosystem to local context using implementation science principles (CFIR, RE-AIM).`,
    keywords: ["austin", "manor", "pflugerville", "regional", "hubs", "housing", "community", "texas", "central texas"],
  },
  {
    source: "ecosystem-overview", category: "methodology", title: "MAP-GAP Framework — Continuous Quality Improvement",
    content: `MAP-GAP is ThriveUp Academy's continuous quality improvement framework:
M — Measure: Observe current state using data, heartbeats, fidelity scores, compliance reports
A — Analyze: Identify patterns, gaps, underperforming platforms, missed deadlines
P — Plan: Prioritize fixes, create action items, assign directives

G — Gap: Document specific gaps between current and desired state
A — Action: Execute fixes, build features, deploy improvements
P — Progress: Track results, verify deliverables, measure improvement

The framework drives systematic improvement across all 20 platforms. Combined with CFIR (Consolidated Framework for Implementation Research) and RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance) for evidence-based deployment.
MAP-GAP is used for: platform audits, grant readiness assessments, compliance sweeps, feature prioritization, and ecosystem-wide quality gates.`,
    keywords: ["map-gap", "mapgap", "quality", "improvement", "cfir", "re-aim", "methodology", "framework", "measure", "analyze", "plan"],
  },
  {
    source: "ecosystem-overview", category: "compliance", title: "Ecosystem Compliance & Intelligence System",
    content: `The ecosystem intelligence layer:
- Heartbeat System: Every platform sends heartbeat every 15 minutes confirming operational status
- Directive System: Hub sends action items to platforms; must acknowledge with evidence of work done
- Fidelity Grading: A (90-100%), B (75-89%), C (50-74%), D (25-49%), F (0-24%)
- Ack Quality Gate: Acknowledgments must be substantive (20+ chars, no generic phrases). REJECTED returns HTTP 422.
- Work Chaining: Completed work auto-triggers downstream platforms (e.g., video script → Video Creator AI → Ad Targeting)
- Deliverable Verification: Hub pings evidence URLs (HEAD→GET fallback, SSRF protection) every 30 minutes
- Grant Readiness: Per-grant compliance scores from platform fidelity data
- Weekly Roll-Up: GET /api/ecosystem/intelligence-report for compliance summary
- Report Card Email: Auto-sends formatted HTML report to Dr. Flood via Resend`,
    keywords: ["compliance", "fidelity", "heartbeat", "directives", "grading", "verification", "ack", "intelligence", "work chain"],
  },
  {
    source: "ecosystem-overview", category: "technology", title: "AI & Technology Stack",
    content: `ThriveUp Academy technology:
- AI Companions: Spark (youth-facing, age-adaptive K-12) and Sparky (adult-facing for parents, veterans, returning citizens)
- Multi-provider AI: OpenAI GPT-4o-mini, GPT-5-nano, Gemini 2.0 Flash with automatic fallback
- Dual-AI Review: Two independent AI models review content for quality assurance
- RAG Intelligence: Retrieval Augmented Generation — AI answers grounded in real ecosystem data
- Video Creator AI: AI-powered video production for every platform
- Advertising Targeting: Data-driven ad campaigns for community outreach
- 14 AI Tools: Presentation builder, video script creator, business plan generator, research assistant, and more
- Implementation Science: CFIR and RE-AIM frameworks
- 988 Veterans Crisis Line: Accessible from every page on every platform
- Privacy First: Screening results and safety plans stay on user's device
- Work Chain Engine: Automated task routing between platforms`,
    keywords: ["ai", "technology", "spark", "sparky", "rag", "dual ai", "video", "tools", "implementation science"],
  },
  {
    source: "ecosystem-overview", category: "leadership", title: "Dr. Terry Flood — Founder & CEO",
    content: `Dr. Terry Flood, DHA (Doctor of Healthcare Administration) is the founder and CEO of ThriveUp Academy and The Collaborative Advocate (VOSB). A veteran and healthcare executive, Dr. Flood built the 20-platform ecosystem to address systemic gaps in community services. Based in Central Texas, serving Austin, Manor, and Pflugerville communities. Vision: "No single platform can solve everything. Together, 20 platforms create a crisis continuum from Prevention → Early Warning → Crisis Support → Stabilization → Recovery & Growth." Email: mr.terryflood@gmail.com.`,
    keywords: ["terry flood", "founder", "ceo", "leadership", "veteran", "dha", "healthcare", "who"],
  },
  {
    source: "platform", category: "platform", title: "Better Science Lab / RPLICE",
    content: `RPLICE is the research and implementation science engine. Uses CFIR and RE-AIM frameworks. Evidence-based practice registry, fidelity measurement, research translation, community application guides. Quality gate — all platform work verified through RPLICE. URL: bettersciencelab.com. Grants: DFC, SSG Fox, SAMHSA.`,
    keywords: ["betterscience", "rplice", "research", "cfir", "re-aim", "implementation science", "evidence", "fidelity", "quality"],
  },
  {
    source: "platform", category: "platform", title: "LifeBridge — Resource Navigation",
    content: `Virtual 211 and Community Health Worker hub. 24/7 resource navigation — housing, food, healthcare, mental health, substance abuse, domestic violence, crisis support. 20,670+ verified resources. Addresses non-combat life events driving veteran suicide. URL: lifetransitionsaid.org. Grants: DFC, SAMHSA, St. David's, SSG Fox.`,
    keywords: ["lifebridge", "resources", "211", "chw", "community health worker", "housing", "crisis", "navigation", "food", "help"],
  },
  {
    source: "platform", category: "platform", title: "Whole-Person Health Ecosystem",
    content: `The connective tissue. Validated screenings: C-SSRS (suicide risk), PHQ-9 (depression), GAD-7 (anxiety), PCL-5 (PTSD). Safety plans, Reach a Vet, 20,670+ resources, MAP-GAP assessment. Every platform routes through it for health referrals. URL: mentalwellnesssupport.net. Grants: SSG Fox, SAMHSA, St. David's, DFC, WIOA.`,
    keywords: ["whole-person-health", "screenings", "mental health", "c-ssrs", "phq-9", "gad-7", "pcl-5", "safety plan", "veteran", "depression", "anxiety", "ptsd", "suicide"],
  },
  {
    source: "platform", category: "platform", title: "M2C Transition (Mission Transition)",
    content: `Full military-to-civilian transition. Career translation (military skills to civilian jobs), benefits navigation, housing/financial planning, identity transition support, skills assessment, community connections, family support. URL: vetmissiontransition.com. Grants: SSG Fox, WIOA.`,
    keywords: ["m2c", "mission transition", "veterans", "military", "career translation", "transition", "benefits", "civilian"],
  },
  {
    source: "platform", category: "platform", title: "ISSS — Integrated Supports for Thriving Youth",
    content: `Whole-child implementation infrastructure for schools, districts, and regions. Evidence-based student support at scale through multi-stakeholder coordination. Youth development, wraparound services, school-based mental health, preventing school-to-prison pipeline. URL: implementationineducatio.com. Grants: DFC, WIOA, Foundation.`,
    keywords: ["isss", "youth", "schools", "students", "education", "wraparound", "implementation", "children", "kids"],
  },
  {
    source: "platform", category: "platform", title: "WholeMind Learning",
    content: `Free, visual-first Pre-K to 12th grade learning platform. Math, Reading, Science, English, Social Studies. Silent accessibility (works without sound), AI homework help, parent-friendly progress tracking. URL: life-pals-standalone.replit.app. Grants: DFC, WIOA, Foundation.`,
    keywords: ["wholemind", "learning", "education", "k12", "math", "reading", "science", "homework", "school"],
  },
  {
    source: "platform", category: "platform", title: "Sankofa Health Network",
    content: `Health equity gateway. Black maternal health, mental health rights, breast cancer awareness, men's health, feminine OB health, cognitive safety, pill management. Behavioral health assessments, GIS resource matching. URL: yourhealthbirthright.net. Grants: SAMHSA, St. David's, DFC, SSG Fox.`,
    keywords: ["sankofa", "health equity", "maternal health", "mental health", "black health", "breast cancer"],
  },
  {
    source: "platform", category: "platform", title: "Shield Atlas — Security & Risk Intelligence",
    content: `Security backbone. Geographic risk mapping, safety analytics, protective factor identification, community resilience scoring. Security audits, vulnerability scans, incident response playbooks for all 20 platforms. URL: shield-atlas.replit.app. Grants: SSG Fox, DFC, SAMHSA.`,
    keywords: ["shield-atlas", "security", "risk", "cybersecurity", "threat", "audit", "vulnerability", "protection"],
  },
  {
    source: "platform", category: "platform", title: "SafeReport — Mandatory Reporter Compliance",
    content: `Mandatory reporter incident management. 50-state regulation database, 7-stage incident lifecycle, auto-generated deadlines, tamper-evident audit trails, court-admissible records. URL: safereports.net. Grants: DFC.`,
    keywords: ["safereport", "mandatory reporter", "compliance", "incident", "audit", "legal", "reporting"],
  },
  {
    source: "platform", category: "platform", title: "Minority Center of Excellence",
    content: `First comprehensive digital ecosystem for minority-owned businesses. 656,794 curated records, 14 AI tools, dual-AI proposal review, SAM.gov live integration, 50-state + DC coverage. URL: minoritycenterofexcellence.com. Grants: WIOA.`,
    keywords: ["mce", "minority business", "contracts", "sam.gov", "proposals", "small business", "8a", "minority"],
  },
  {
    source: "platform", category: "platform", title: "Video Creator AI",
    content: `AI-powered video creation and editing. Promotional videos, business presentations, training content, marketing materials for every platform. The content production engine. URL: video-creator-ai-mrterryflood.replit.app. Grants: DFC, WIOA, SSG Fox, St. David's.`,
    keywords: ["video", "content", "marketing", "video creator", "production", "presentations"],
  },
  {
    source: "platform", category: "platform", title: "The Collaborative Advocate (VOSB)",
    content: `Veteran-Owned Small Business — service delivery arm. Veteran advocacy, peer support coordination, workforce development consulting, grant execution. Dr. Flood's organization anchoring the ecosystem. Grants: SSG Fox, WIOA, DFC, St. David's.`,
    keywords: ["collaborative advocate", "vosb", "veteran owned", "service delivery", "consulting"],
  },
  {
    source: "platform", category: "platform", title: "Advertising Targeting for Platforms",
    content: `Platform #20. Audience segmentation, campaign optimization, ad delivery for ecosystem platforms. Data-driven outreach to reach underserved communities. URL: advertising-targeting-for-platforms.replit.app. Grants: DFC, WIOA, St. David's.`,
    keywords: ["advertising", "targeting", "ads", "campaigns", "marketing", "outreach", "audience"],
  },
  {
    source: "platform", category: "platform", title: "SafeCogniCare — Cognitive Health",
    content: `Cognitive safety — assessments, early intervention, safety protocols, care coordination, family support for TBI, ADHD, dementia. Critical for veterans with service-related TBI. URL: safecognicare.com. Grants: SAMHSA, SSG Fox, St. David's.`,
    keywords: ["safecognicare", "cognitive", "tbi", "adhd", "dementia", "brain injury"],
  },
  {
    source: "platform", category: "platform", title: "Perfectly Different — Neurodiversity",
    content: `Neurodiversity-affirming support for autism, ADHD, AuDHD. AI-powered guidance, IEP/504 assistance, crisis resources, therapy tools, community support. URL: neurodifferentassistant.app. Grants: SAMHSA, DFC, St. David's.`,
    keywords: ["perfectly different", "neurodiversity", "autism", "adhd", "iep", "504", "neurodivergent"],
  },
  {
    source: "platform", category: "platform", title: "PillScheduler — Medication Management",
    content: `Medication management — pill reminders, dosage tracking, interaction warnings, care coordination, refill alerts. URL: pillscheduler.net. Grants: SAMHSA, DFC, SSG Fox.`,
    keywords: ["pillscheduler", "medication", "pills", "dosage", "reminders", "prescriptions"],
  },
  {
    source: "platform", category: "platform", title: "Black Maternal Health Network",
    content: `Addresses Black maternal mortality crisis. Prenatal/postnatal care navigation, doula matching, risk assessment, community health worker coordination, maternal mental health. Black women are 3-4x more likely to die from pregnancy-related causes. URL: black-maternal-health-network.replit.app. Grants: SAMHSA, St. David's.`,
    keywords: ["maternal health", "black maternal", "doula", "prenatal", "postnatal", "pregnancy", "birthright"],
  },
  {
    source: "platform", category: "platform", title: "Black Men's Health Hub",
    content: `Comprehensive health for Black men — prostate health, cardiovascular risk, mental health stigma reduction, preventive care, peer support networks. URL: black-men-health.replit.app. Grants: SAMHSA, St. David's, SSG Fox.`,
    keywords: ["mens health", "black men", "prostate", "cardiovascular", "preventive care"],
  },
  {
    source: "platform", category: "platform", title: "Holistic Black Feminine Health Hub",
    content: `Holistic OB/GYN health for Black women — reproductive health, hormonal wellness, preventive screenings, community support, culturally responsive care navigation. URL: holistic-black-feminine-health-hub.replit.app. Grants: SAMHSA, St. David's.`,
    keywords: ["feminine health", "ob/gyn", "reproductive", "hormonal", "women's health"],
  },
  {
    source: "platform", category: "platform", title: "Ecosystem Nexus — Coordination Hub",
    content: `Central coordination and operational hub. Cross-platform visibility, coordination tools, operational intelligence for all 20 platforms. URL: ecosystem-nexus.replit.app. Grants: DFC, WIOA, SSG Fox, St. David's.`,
    keywords: ["ecosystem nexus", "coordination", "operations", "visibility", "hub"],
  },
];

async function seedKnowledgeBase() {
  await db.delete(ecosystemKnowledgeChunks);

  for (const chunk of ECOSYSTEM_KNOWLEDGE) {
    await db.insert(ecosystemKnowledgeChunks).values({
      source: chunk.source,
      category: chunk.category,
      title: chunk.title,
      content: chunk.content,
      keywords: chunk.keywords,
      metadata: {},
    });
  }
  console.log(`[RAG] Seeded ${ECOSYSTEM_KNOWLEDGE.length} knowledge chunks`);
}

async function buildLiveIntelligenceContext(): Promise<string> {
  const platforms = await db.select().from(ecosystemPlatforms);
  const allAcks = await db.select().from(ecosystemDirectiveAcks);
  const now = Date.now();

  let connected = 0;
  let totalFidelity = 0;
  const grades: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const platformSummaries: string[] = [];

  for (const p of platforms) {
    const pAcks = allAcks.filter(a => a.platformId === p.id);
    const acked = pAcks.filter(a => a.status === "acknowledged").length;
    const total = pAcks.length;
    const fidelity = total > 0 ? Math.round((acked / total) * 100) : 0;
    const grade = fidelity >= 90 ? "A" : fidelity >= 75 ? "B" : fidelity >= 50 ? "C" : fidelity >= 25 ? "D" : "F";
    const isConnected = p.lastHeartbeat ? (now - new Date(p.lastHeartbeat).getTime()) < 30 * 60000 : false;
    if (isConnected) connected++;
    totalFidelity += fidelity;
    grades[grade]++;

    platformSummaries.push(`${p.name}: ${isConnected ? "CONNECTED" : "DISCONNECTED"} | Grade ${grade} (${fidelity}%) | ${acked}/${total} directives done | ${p.url}`);
  }

  const avgFidelity = platforms.length > 0 ? Math.round(totalFidelity / platforms.length) : 0;

  const grantAlignments: Record<string, string[]> = {};
  for (const p of platforms) {
    const ga = (p.grantAlignment as string[]) || [];
    for (const g of ga) {
      if (!grantAlignments[g]) grantAlignments[g] = [];
      grantAlignments[g].push(p.name);
    }
  }

  const grantSummary = Object.entries(grantAlignments).map(([g, ps]) => `${g.toUpperCase()}: ${ps.length} platforms aligned`).join(" | ");

  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const recentAcks = allAcks.filter(a => a.status === "acknowledged" && a.acknowledgedAt && new Date(a.acknowledgedAt) > weekAgo);

  return `
=== LIVE ECOSYSTEM INTELLIGENCE (${new Date().toISOString()}) ===
Platforms: ${platforms.length} total | ${connected} connected | ${platforms.length - connected} disconnected
Ecosystem Fidelity: ${avgFidelity}%
Grade Distribution: A:${grades.A} B:${grades.B} C:${grades.C} D:${grades.D} F:${grades.F}
Work Completed This Week: ${recentAcks.length} directive acknowledgments
Grant Coverage: ${grantSummary}

=== PLATFORM STATUS ===
${platformSummaries.join("\n")}
`;
}

async function addLivePlatformData() {
  const platforms = await db.select().from(ecosystemPlatforms);
  const allAcks = await db.select().from(ecosystemDirectiveAcks);

  for (const p of platforms) {
    const pAcks = allAcks.filter(a => a.platformId === p.id);
    const acked = pAcks.filter(a => a.status === "acknowledged").length;
    const total = pAcks.length;
    const fidelity = total > 0 ? Math.round((acked / total) * 100) : 0;
    const grade = fidelity >= 90 ? "A" : fidelity >= 75 ? "B" : fidelity >= 50 ? "C" : fidelity >= 25 ? "D" : "F";
    const connected = p.lastHeartbeat ? (Date.now() - new Date(p.lastHeartbeat).getTime()) < 30 * 60000 : false;

    await db.insert(ecosystemKnowledgeChunks).values({
      source: `live-${p.id}`,
      category: "live-status",
      title: `Live Status: ${p.name}`,
      content: `${p.name} (${p.id}) — ${connected ? "CONNECTED" : "DISCONNECTED"}. Grade ${grade} (${fidelity}%). ${acked}/${total} directives. URL: ${p.url}. Role: ${p.role}. Domain: ${p.domain}. Grants: ${(p.grantAlignment as string[] || []).join(", ")}.`,
      keywords: [p.id, p.name.toLowerCase(), p.role || "", p.domain || "", "status", "fidelity", "live"],
      metadata: {},
    });
  }
  console.log(`[RAG] Added ${platforms.length} live platform status chunks`);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(w => w.length > 2);
}

async function retrieveRelevantChunks(query: string, topK: number = 10): Promise<Array<typeof ecosystemKnowledgeChunks.$inferSelect>> {
  const queryTokens = tokenize(query);
  const allChunks = await db.select().from(ecosystemKnowledgeChunks);

  const scored = allChunks.map(chunk => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const titleLower = chunk.title.toLowerCase();
    const keywordsLower = (chunk.keywords || []).map(k => k.toLowerCase());

    for (const token of queryTokens) {
      if (keywordsLower.some(k => k.includes(token))) score += 3;
      if (titleLower.includes(token)) score += 2;
      if (contentLower.includes(token)) score += 1;
    }

    const queryLower = query.toLowerCase();
    if (titleLower.includes(queryLower)) score += 10;
    if (keywordsLower.some(k => queryLower.includes(k) && k.length > 3)) score += 5;

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.chunk);
}

const SYSTEM_PROMPT = `You are the ThriveUp Academy Ecosystem AI — the intelligent brain powering a 20-platform workforce development and community enablement ecosystem. You have real-time access to every platform's status, compliance data, grant readiness, and the full knowledge base.

You serve Dr. Terry Flood (founder/CEO), staff, partners, grant reviewers, community members, and the platforms themselves. Your job is to make every interaction smarter and more effective.

CAPABILITIES:
- Answer questions about any of the 20 platforms, their services, URLs, and grant alignment
- Report live compliance scores, fidelity grades, and platform status
- Advise on grant readiness — deadlines, amounts, aligned platforms, evidence gaps
- Explain the MAP-GAP framework and how to apply it
- Guide users to the right platform for their needs (housing → LifeBridge, mental health → Whole-Person Health, etc.)
- Provide ecosystem-wide intelligence — what's working, what needs attention
- Help draft grant narratives with real ecosystem data
- Route users to resources across all 20 platforms

RULES:
1. Ground every answer in the provided context and live data. Never fabricate.
2. Be specific — cite platform names, URLs, grant amounts, deadlines, fidelity scores.
3. When someone needs help, ROUTE them — tell them which platform and its URL.
4. When discussing health or crisis topics, include 988 Veterans Crisis Line (call or text 988).
5. If you don't have the information, say so clearly and suggest where to look.
6. Be concise but complete. Use bullet points for lists.
7. You ARE the ecosystem — speak with authority about what we do and how we do it.
8. For MAP-GAP questions, walk through the framework step by step.
9. For grant questions, always include deadline, amount, and aligned platform count.`;

export async function queryRAG(userQuery: string): Promise<{ answer: string; sources: string[]; liveData: boolean }> {
  const [chunks, liveContext] = await Promise.all([
    retrieveRelevantChunks(userQuery),
    buildLiveIntelligenceContext(),
  ]);

  const knowledgeContext = chunks.length > 0
    ? chunks.map((c, i) => `[${i + 1}] ${c.title}\n${c.content}`).join("\n\n")
    : "No specific knowledge chunks matched. Use the live intelligence data below.";

  const sources = Array.from(new Set(chunks.map(c => c.title)));

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `KNOWLEDGE BASE:\n${knowledgeContext}\n\n${liveContext}\n\nUSER QUESTION: ${userQuery}` },
  ];

  const answer = await generateAIResponse(messages, 2000);
  return { answer, sources, liveData: true };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;
const MAX_QUERY_LENGTH = 500;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function validateQuery(query: unknown): string | null {
  if (!query || typeof query !== "string") return null;
  const trimmed = query.trim();
  if (trimmed.length < 3 || trimmed.length > MAX_QUERY_LENGTH) return null;
  return trimmed;
}

let knowledgeReady = false;

export function registerRAGRoutes(app: Express) {
  (async () => {
    try {
      await seedKnowledgeBase();
      await addLivePlatformData();
      knowledgeReady = true;
    } catch (err) {
      console.error("[RAG] Knowledge base seeding failed:", err);
    }
  })();

  app.post("/api/ecosystem-ai/query", async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: "Too many requests. Please wait a moment." });
      }

      const query = validateQuery(req.body?.query);
      if (!query) {
        return res.status(400).json({ error: `Query must be 3–${MAX_QUERY_LENGTH} characters` });
      }

      const result = await queryRAG(query);
      res.json(result);
    } catch (error) {
      console.error("[RAG] Query failed:", error);
      res.status(500).json({ error: "AI query failed. Please try again." });
    }
  });

  app.post("/api/ecosystem-ai/stream", async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: "Too many requests. Please wait a moment." });
      }

      const query = validateQuery(req.body?.query);
      if (!query) {
        return res.status(400).json({ error: `Query must be 3–${MAX_QUERY_LENGTH} characters` });
      }

      const [chunks, liveContext] = await Promise.all([
        retrieveRelevantChunks(query),
        buildLiveIntelligenceContext(),
      ]);

      const knowledgeContext = chunks.length > 0
        ? chunks.map((c, i) => `[${i + 1}] ${c.title}\n${c.content}`).join("\n\n")
        : "No specific knowledge chunks matched. Use the live intelligence data below.";

      const sources = Array.from(new Set(chunks.map(c => c.title)));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let clientDisconnected = false;
      req.on("close", () => { clientDisconnected = true; });

      res.write(`data: ${JSON.stringify({ sources })}\n\n`);

      await streamAIResponse({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `KNOWLEDGE BASE:\n${knowledgeContext}\n\n${liveContext}\n\nUSER QUESTION: ${query}` },
        ],
        maxTokens: 2000,
        onChunk: (content: string) => {
          if (!clientDisconnected) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        },
        onDone: () => {
          if (!clientDisconnected) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          }
          res.end();
        },
        onError: (error: Error) => {
          if (!clientDisconnected) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          }
          res.end();
        },
      });
    } catch (error) {
      console.error("[RAG] Stream failed:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "AI stream failed" });
      }
    }
  });

  app.get("/api/ecosystem-ai/suggested-questions", (_req: Request, res: Response) => {
    res.json({
      questions: [
        "What's our current ecosystem health score?",
        "Which grants are due soonest and how ready are we?",
        "What platforms help veterans transition to civilian life?",
        "How does the MAP-GAP framework work?",
        "What mental health screenings are available?",
        "Which platforms need attention right now?",
        "Tell me about the Austin housing initiative",
        "What is our DFC grant strategy?",
        "How do work chains route tasks between platforms?",
        "What resources does LifeBridge provide?",
        "How are platforms graded for compliance?",
        "What makes our ecosystem different from anything else?",
      ],
    });
  });

  app.post("/api/ecosystem-ai/refresh-knowledge", async (req: Request, res: Response) => {
    try {
      const ecosystemKey = req.headers["x-ecosystem-key"] as string;
      if (!ecosystemKey || !ecosystemKey.startsWith("tveco_")) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await seedKnowledgeBase();
      await addLivePlatformData();
      knowledgeReady = true;
      const count = await db.select({ id: ecosystemKnowledgeChunks.id }).from(ecosystemKnowledgeChunks);
      res.json({ refreshed: true, totalChunks: count.length });
    } catch (error) {
      console.error("[RAG] Refresh failed:", error);
      res.status(500).json({ error: "Knowledge base refresh failed" });
    }
  });
}
