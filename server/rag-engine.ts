import { db } from "./storage";
import { ecosystemKnowledgeChunks, ecosystemPlatforms, ecosystemDirectives, ecosystemDirectiveAcks } from "@shared/schema";
import { getChainwebRAGContext } from "./chainweb-engine";
import { eq, sql } from "drizzle-orm";
import { generateAIResponse, streamAIResponse } from "./ai-provider";
import type { Express, Request, Response } from "express";
import { getAllRagEntries } from "./agency-profiles";
import { getOrchestratedIntelligence, renderBundleAsContext } from "./orchestration/conductor";
import { resolveZipBestEffort } from "./geo/zip-county-resolver";

/**
 * Extract a US ZIP mentioned in a free-text query, if any, and resolve it to a
 * geography ref via the existing (5-county-seeded, state-fallback-elsewhere)
 * static resolver. Returns null if no ZIP is present or it can't be resolved.
 */
async function extractGeographyFromQuery(query: string): Promise<{ countyFips?: string; zip?: string; state?: string; countyName?: string } | null> {
  const zipMatch = query.match(/\b(\d{5})\b/);
  if (!zipMatch) return null;
  const zip = zipMatch[1];
  const best = await resolveZipBestEffort(zip);
  if (best.source === "none") return null;
  return { zip, countyFips: best.countyFips, state: best.state, countyName: best.countyName };
}

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
    content: `ThriveUp Academy is a 24-platform AI-powered workforce development and community enablement ecosystem operated by Dr. Terry Flood, DHA. It serves under-resourced communities in Central Texas (Austin, Manor, Pflugerville) with three regional hubs. The ecosystem addresses the full human lifecycle: education (Pre-K through adult), workforce development, health equity, veteran services, housing stability, crisis prevention, and contractor/business enablement. Every platform is free for individuals. The hub at thrivingcommunitiesforall.com coordinates all 24 platforms through a heartbeat-based compliance system with directive tracking, fidelity grading (A through F), and automated work chaining. The crisis continuum: Prevention → Early Warning → Crisis Support → Stabilization → Recovery & Growth. Platform #21 (Pinnacle Business Conglomerate) extends the ecosystem into minority contractor enablement and organizational consulting.`,
    keywords: ["thriveup", "ecosystem", "overview", "platforms", "terry flood", "austin", "manor", "pflugerville", "how many", "what is"],
  },
  {
    source: "ecosystem-overview", category: "grants", title: "Active Grant Portfolio — 5 Grants",
    content: `ThriveUp Academy has 5 active grant opportunities:
1. WIOA (Workforce Innovation & Opportunity Act) — $200K–$500K. Focus: workforce training, career pathways, job readiness, employer engagement. Aligned platforms: 8.
2. Foundation Grant — $100K–$500K. Focus: community impact, education equity, wraparound services. Aligned platforms: 3.
3. St. David's Foundation — up to $1M, opens March 30, 2026. Focus: health equity, maternal health, mental health, community health workers. Aligned platforms: 12.
4. SSG Fox VA Grant — $750K, deadline June 12–18, 2026. Focus: veteran services, suicide prevention, transition support, peer support. Aligned platforms: 10.
5. St. David's We All Benefit 2.0 — Building Economic Stability. LOI due April 27, 2026 at 5 PM CT. If LOI accepted, full application due June 18, 2026 at 5 PM CT. Focus: income supports, food security, healthcare access, increasing enrollment in public benefits for historically marginalized communities. SEPARATE from the general St. David's health equity grant — both can be pursued simultaneously. Aligned platforms: LifeBridge (resource navigation), MCE (workforce/business development), Whole-Person Health (healthcare access), Sankofa (health equity), CHW Dashboard, community resource directory. Central TX 5-county focus. More info: https://lnkd.in/gPkAUS-u`,
    keywords: ["grants", "wioa", "foundation", "st davids", "ssg fox", "funding", "deadline", "money", "amount", "we all benefit", "economic stability", "benefits enrollment", "food security"],
  },
  {
    source: "ecosystem-overview", category: "regional", title: "Regional Hub Strategy — Austin, Manor, Pflugerville",
    content: `ThriveUp Academy operates three regional community hubs in Central Texas:
1. Austin Hub — Primary hub. Austin's housing affordability crisis (median home $429K–$435K, only 2 of 75 zip codes affordable). Focus: workforce development, housing stability, substance abuse prevention, coalition building.
2. Manor Hub — Rural/suburban community. Focus: youth development, family support, community resource navigation, agricultural workforce pathways.
3. Pflugerville Hub — Rapidly growing suburban community. Focus: newcomer integration, multicultural services, youth education, workforce training for growing tech corridor.
Each hub adapts the same 24-platform ecosystem to local context using implementation science principles (CFIR, RE-AIM).`,
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

The framework drives systematic improvement across all 24 platforms. Combined with CFIR (Consolidated Framework for Implementation Research) and RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance) for evidence-based deployment.
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
    source: "ecosystem-overview", category: "technology", title: "AI & Technology Stack — 4-Provider Collaborative Intelligence",
    content: `ThriveUp Academy technology:
- AI Companions: Spark (youth-facing, age-adaptive K-12) and Sparky (adult-facing for parents, veterans, returning citizens)
- 4-Provider Collaborative AI (ordered fallback chain): 1) Google Gemini 2.0 Flash (primary, free tier), 2) Anthropic Claude Haiku 4.5 (secondary, collaborative perspective), 3) OpenAI GPT-4o-mini (tertiary), 4) Replit AI Integrations GPT-5-nano (quaternary)
- Collaborative Multi-AI Review: Multiple AI models independently analyze the same problem, then a synthesis AI merges their perspectives into consensus. This is NOT adversarial — it's collaborative intelligence bringing different viewpoints so nothing is missed. Used by RPLICE and MCE for quality assurance.
- RAG Intelligence: Retrieval Augmented Generation — AI answers grounded in real ecosystem data from 66+ knowledge chunks
- Video Creator AI: AI-powered video production for every platform
- Advertising Targeting: Data-driven ad campaigns for community outreach
- 14 AI Tools: Presentation builder, video script creator, business plan generator, research assistant, and more
- Implementation Science: CFIR and RE-AIM frameworks
- 988 Veterans Crisis Line: Accessible from every page on every platform
- Privacy First: Screening results and safety plans stay on user's device
- Work Chain Engine: Automated task routing between platforms
- Automatic Failover: If any AI provider fails (rate limit, error, empty response), the system automatically falls back to the next provider — zero downtime for users`,
    keywords: ["ai", "technology", "spark", "sparky", "rag", "dual ai", "multi ai", "collaborative", "claude", "gemini", "openai", "video", "tools", "implementation science", "providers", "fallback"],
  },
  {
    source: "ecosystem-overview", category: "training", title: "Program Management Academy — PM Training",
    content: `The Program Management Academy (/pm-academy) is ThriveUp's standalone PM training program with 5 tracks:
1. PM Essentials (2 weeks, beginner) — 5 process groups, triple constraint, stakeholders, RACI
2. PM Professional (4 weeks, intermediate) — 10 PMBOK knowledge areas, Agile/Waterfall/Hybrid, RAID logs, EVM, CAPM prep
3. Implementation Science PM (4 weeks, advanced) — CFIR, RE-AIM, SALP fidelity, MAP-GAP cycles, Three Realities diagnostic
4. PM Leadership & Certification (4 weeks, expert) — PMP exam prep, Lean Six Sigma DMAIC, portfolio management, capstone
5. Contract & Grant PM (3 weeks, intermediate) — grant lifecycle, compliance, MCE contract management
Three-layer architecture: Learn It (Academy) → Apply It (RPLICE/MCE/Ecosystem) → Connect It (bidirectional links). Memory aids: I.P.E.M.C., ScoSBu, RACI, RAID, SMART, DMAIC, RE-AIM, CFIR, MAP-GAP, FAIR Close. Instructor presentations built in with fullscreen slideshow mode.`,
    keywords: ["pm", "project management", "program management", "capm", "pmp", "certification", "training", "academy", "agile", "waterfall", "pmbok", "lean six sigma"],
  },
  {
    source: "ecosystem-overview", category: "training", title: "AI Workforce Academy — Adult Professional Training",
    content: `The AI Workforce Academy (/ai-workforce) is ThriveUp's adult professional AI training with 7 tracks:
1. AI 101 (1 week) — parents and newcomers, jargon-free AI intro, 5 daily lessons
2. AI Foundations (4 weeks) — prompt engineering, AI tools, ethics
3. Data & Analytics (6 weeks) — SQL, visualization, dashboards
4. Python & Coding (8 weeks) — automation, Foundation First principle
5. Generative AI & LLMs (8 weeks) — LangChain, CrewAI, RAG systems
6. AI for Business Leaders (4 weeks) — strategy, ROI, adoption
7. AI Consulting & Freelancing (6 weeks) — packaging services, client management
5 learning paths: Parent & Community (1 week), Career Starter (19 weeks), AI Builder (12 weeks), Business Leader (5 weeks), AI Entrepreneur (18 weeks). WIOA-aligned. Instructor presentations built in with fullscreen slideshow mode.`,
    keywords: ["ai workforce", "ai training", "ai 101", "professional development", "workforce", "python", "data analytics", "generative ai", "consulting"],
  },
  {
    source: "ecosystem-overview", category: "compliance", title: "Directive Compliance Center",
    content: `The Directive Compliance Center (/directive-compliance) provides real-time tracking of all ecosystem directives with:
- At-a-glance stats: average fidelity, overdue tasks, pending responses, non-compliant platforms, offline count
- Failures & Action tab: lists all non-compliant platforms sorted by priority, shows specific overdue directives with reasons for non-compliance
- All Platforms tab: every platform's fidelity grade, completion ratio, and expandable details
- Grant Readiness tab: compliance scores per grant (WIOA, St. David's, SSG Fox, Foundation)
- Evidence verification summary: verified, unverified, failed, no URL
- One-click Resend button to re-deliver pending directives to any platform
- Non-compliance reasons auto-detected: offline, not connected, awaiting response, pending delivery`,
    keywords: ["directive", "compliance", "fidelity", "overdue", "tracking", "dashboard", "resend", "evidence", "verification"],
  },
  {
    source: "ecosystem-overview", category: "leadership", title: "Dr. Terry Flood — President",
    content: `Dr. Terry Flood, DHA (Doctor of Healthcare Administration) is the President of ThriveUp Academy and The Collaborative Advocate (VOSB). A veteran and healthcare executive, Dr. Flood built the 24-platform ecosystem to address systemic gaps in community services. Based in Central Texas, serving Austin, Manor, and Pflugerville communities. Vision: "No single platform can solve everything. Together, 24 platforms create a crisis continuum from Prevention → Early Warning → Crisis Support → Stabilization → Recovery & Growth." Email: president@thecollaborativeadvocate.org.`,
    keywords: ["terry flood", "founder", "ceo", "leadership", "veteran", "dha", "healthcare", "who"],
  },
  {
    source: "platform", category: "platform", title: "RPLICE — Research-to-Practice Lifecycle Implementation & Community Evidence",
    content: `RPLICE (Research-to-Practice Lifecycle Implementation & Community Evidence) is a free, AI-powered platform that helps researchers, practitioners, and planners close the gap between what science proves works and what actually gets implemented in communities. Search live evidence, assess projects against real community data, build implementation plans, and track outcomes -- all in one place. Uses CFIR 2.0, RE-AIM, and EPIS frameworks. Evidence-based practice registry, fidelity measurement, research translation, community application guides. Quality gate -- all platform work verified through RPLICE. RPLICE uses collaborative multi-AI review: multiple AI models independently analyze the same document, then a synthesis step builds consensus. URL: implementationineducatio.com. Connected to SALP Science research platform (salp-science--mrterryflood.replit.app / Research-Science-Collaborator on Replit). Grants: DFC, SSG Fox, SAMHSA, Spencer Foundation.`,
    keywords: ["rplice", "research", "cfir", "re-aim", "epis", "implementation science", "evidence", "fidelity", "quality", "collaborative ai", "multi ai", "research-to-practice", "lifecycle", "community evidence", "implementationineducatio"],
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
    content: `Whole-child implementation infrastructure for schools, districts, and regions. Evidence-based student support at scale through multi-stakeholder coordination. Youth development, wraparound services, school-based mental health, preventing school-to-prison pipeline. MTSS compliance, SEL curriculum, early warning systems (thrive_scores, early_warning_flags), wraparound coordination. Serves PfISD across 5 high schools, 120 students Year 1. Built-in data: fidelity scores, readiness assessments, Proctor's 8 implementation outcomes, practice-policy reports. Powered by RPLICE implementation science engine (implementationineducatio.com). SALP Science (salp-science--mrterryflood.replit.app) provides research analysis capability. Grants: DFC, WIOA, Foundation, Spencer Foundation.`,
    keywords: ["isss", "youth", "schools", "students", "education", "wraparound", "implementation", "children", "kids", "mtss", "sel", "thrive_scores", "early_warning", "fidelity", "pfisd"],
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
    source: "platform", category: "platform", title: "Emergency Management — Security & Risk Intelligence",
    content: `Security backbone. Geographic risk mapping, safety analytics, protective factor identification, community resilience scoring. Security audits, vulnerability scans, incident response playbooks for all 24 platforms. URL: emergency-mgmt.replit.app. Grants: SSG Fox, DFC, SAMHSA.`,
    keywords: ["emergency-mgmt", "security", "risk", "cybersecurity", "threat", "audit", "vulnerability", "protection"],
  },
  {
    source: "platform", category: "platform", title: "SafeReport — Mandatory Reporter Compliance",
    content: `Mandatory reporter incident management. 50-state regulation database, 7-stage incident lifecycle, auto-generated deadlines, tamper-evident audit trails, court-admissible records. URL: safereports.net. Grants: DFC.`,
    keywords: ["safereport", "mandatory reporter", "compliance", "incident", "audit", "legal", "reporting"],
  },
  {
    source: "platform", category: "platform", title: "Minority Center of Excellence",
    content: `First comprehensive digital ecosystem for minority-owned businesses. 656,794 curated records, 14 AI tools, collaborative multi-AI proposal review (Gemini + Claude + OpenAI independently review, then synthesize consensus), SAM.gov live integration, 50-state + DC coverage. URL: minoritycenterofexcellence.com. Grants: WIOA.`,
    keywords: ["mce", "minority business", "contracts", "sam.gov", "proposals", "small business", "8a", "minority", "collaborative ai", "multi ai"],
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
    content: `Central coordination and operational hub. Cross-platform visibility, coordination tools, operational intelligence for all 24 platforms. URL: ecosystem-nexus.replit.app. Grants: DFC, WIOA, SSG Fox, St. David's.`,
    keywords: ["ecosystem nexus", "coordination", "operations", "visibility", "hub"],
  },
  {
    source: "platform", category: "platform", title: "Pinnacle Business Conglomerate — Contractor Enablement",
    content: `Platform #21. Consulting conglomerate providing cradle-to-grave contractor enablement for minority-owned businesses and organizations. Services: Business gap analysis (MAP-GAP diagnostics), certification alignment (MBE, DBE, HUB, 8(a), SDVOSB), NAICS code analysis, SAM.gov registration support, contract intelligence and bid matching, teaming hub and JV formation, proposal development, execution support, grant readiness, workforce development, international expansion. Primary clients: NAMC Austin (National Association of Minority Contractors — Central Texas Chapter) and USHCC Blue Wave Initiative (United States Hispanic Chamber of Commerce supplier development program). Partners include security training (including tactical/LE shoot house), HR services, workforce development, and more. Uses RPLICE decision framework and MAP-GAP gates at every stage: Onboard → Diagnose → Certify → Position → Win → Execute → Scale. Contractor readiness tiers: Tier 1 (Not Ready), Tier 2 (Emerging), Tier 3 (Bid-Ready), Tier 4 (Prime-Ready). Tracks MOPS (Measures of Performance) and MOWS (Measures of Worth). Grants: WIOA, St. David's, SSG Fox, Foundation Grant.`,
    keywords: ["pinnacle", "conglomerate", "contractor", "NAMC", "minority contractors", "Hispanic chamber", "Blue Wave", "USHCC", "bid", "contract", "certification", "MBE", "DBE", "HUB", "8a", "SDVOSB", "teaming", "proposal", "enablement", "construction"],
  },
  {
    source: "cross-platform", category: "integration", title: "MCE + Pinnacle + Blue Wave — Minority Contractor Pipeline",
    content: `The MCE (Minority Center of Excellence) + Pinnacle Business Conglomerate + USHCC Blue Wave pipeline is the ecosystem's most powerful contractor enablement system. Here's how they work together:

STAGE 1 — INTAKE & DIAGNOSTICS (Pinnacle):
Pinnacle runs MAP-GAP diagnostic on every incoming contractor or organization. 4-layer assessment: Designed Capability, Operational Capability, Experienced Reality, Gap Identification. Output: Readiness tier (1-4) and gap action plan.

STAGE 2 — DATA & INTELLIGENCE (MCE):
MCE provides the contractor with access to 656,794 curated federal/state contract records across all 50 states + DC. MCE's 14 AI tools analyze the contractor's NAICS codes, past performance, and capability statement against available opportunities. MCE's collaborative multi-AI proposal review (Gemini + Claude + OpenAI independently review, then synthesize consensus) strengthens every bid.

STAGE 3 — CERTIFICATION & POSITIONING (Pinnacle + MCE):
Pinnacle identifies certification gaps (MBE, DBE, HUB, 8(a), SDVOSB, state-specific). MCE's SAM.gov live integration verifies registration status and flags expired entries. Together they ensure the contractor is registered, certified, and positioned correctly.

STAGE 4 — SUPPLIER DEVELOPMENT (Blue Wave):
USHCC Blue Wave's 7-pillar assessment evaluates: Leadership, Operations, Finance, HR, Marketing, Technology, Compliance. 1000+ graduates. Partners: JPMorgan, Chevron, Oncor. 2026 launch: "AI for Business Leaders" course. Blue Wave fills the business development gaps that pure contract-readiness misses.

STAGE 5 — BID & WIN (MCE + Pinnacle):
MCE's contract matching engine identifies winnable opportunities. Pinnacle's teaming hub connects contractors with primes and JV partners. MCE's multi-AI proposal review ensures competitive submissions. Pinnacle provides execution support post-award.

STAGE 6 — SCALE & SUSTAIN (All Three):
Pinnacle tracks MOPS (Measures of Performance) and MOWS (Measures of Worth). MCE provides ongoing contract intelligence. Blue Wave provides advanced business development and international expansion pathways. The contractor moves from Tier 1 to Tier 4 with evidence at every step.

KEY HANDOFF POINTS:
- Pinnacle → MCE: "This contractor needs SAM.gov verification and contract matching for NAICS 236220"
- MCE → Pinnacle: "We found 47 opportunities matching this contractor's profile — here are the top 5 by win probability"
- Pinnacle → Blue Wave: "This contractor passed readiness but needs business systems strengthening"
- Blue Wave → Pinnacle: "This graduate is ready for prime contractor positioning"
- MCE → Blue Wave: "This contractor needs financial capacity building before they can bond at $2M+"

NAMC AUSTIN INTEGRATION:
NAMC Austin (National Association of Minority Contractors — Central Texas Chapter, President Sam Blango, 50-mile Austin radius) serves as the community anchor. NAMC members get automatic access to the full MCE + Pinnacle + Blue Wave pipeline. NAMC's Connect/Educate/Elevate programs feed directly into Pinnacle's intake.

This pipeline is grant-defensible under WIOA (workforce development), Foundation Grant (community impact), and St. David's (economic health equity).`,
    keywords: ["mce", "pinnacle", "blue wave", "ushcc", "namc", "minority contractor", "pipeline", "integration", "proposal", "sam.gov", "certification", "teaming", "contract", "bid", "supplier development", "cross-platform"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "What ThriveUp Academy Actually Is — System of Systems",
    content: `ThriveUp Academy is NOT a collection of platforms. It is a governed system of systems — a self-governing, closed-loop human services operating system. Most organizations operate at the level of tools (apps, dashboards) or programs (coordinated services). ThriveUp has crossed into the third level: a feedback-driven environment that learns, adapts, and enforces behavior. The system doesn't just deliver services — it governs how services behave, improve, and prove impact. This is rare and unprecedented. The platforms work in parallel, not in series — each is self-sufficient, standing on its own while the hub coordinates. If the hub goes down, all 26 platforms keep doing their jobs. It's not a chain where one broken link stops everything — it's a network where each node is empowered and the connections make the whole greater than the parts.`,
    keywords: ["what is", "different", "unique", "system of systems", "operating system", "why", "special", "describe", "explain", "parallel", "network"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Closed-Loop Operating System Architecture",
    content: `ThriveUp operates as a closed-loop human services operating system with four layers:
INPUTS: People (clients, families, veterans, students), Providers (schools, nonprofits, clinicians), Resources (grants, services, programs), Data (screenings, usage, outcomes).
ENGINE: MAP-GAP (continuous improvement logic), RAG AI (real-time intelligence), Directive system (tasking + validation), Work chaining (automation across platforms).
OUTPUTS: Verified services delivered, Measurable outcomes (health, workforce, education), Real-time compliance, Grant-ready evidence.
FEEDBACK LOOP: Heartbeats → status awareness, Fidelity grades → performance scoring, Directive validation → behavior enforcement, AI synthesis → decision intelligence. This loop is the system.`,
    keywords: ["architecture", "how it works", "closed loop", "engine", "inputs", "outputs", "feedback"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Self-Governing Compliance — The Secret Weapon",
    content: `Most systems track activity, maybe report outcomes, rarely verify anything. ThriveUp issues directives, requires proof, rejects weak responses, and grades performance. This is closer to military command-and-control systems, high-reliability organizations (HROs), and regulatory enforcement models. The system solves one of the hardest problems in public systems: "How do we know the work actually happened — and happened well?" Platforms don't just say they did the work — they prove it with evidence URLs that the hub automatically verifies.`,
    keywords: ["self-governing", "compliance", "secret weapon", "accountability", "verification", "hro", "command control"],
  },
  {
    source: "strategic-framework", category: "governance", title: "Ecosystem Fidelity — What It Means and What It Does NOT Mean",
    content: `FIDELITY METHODOLOGY — READ BEFORE CITING ANY FIDELITY NUMBER:

"Ecosystem fidelity" in ThriveUp = directive acknowledgment rate for INTERNALLY-GOVERNED platforms. It is a governance participation metric, not a connectivity or uptime metric.

WHAT IT MEASURES: Whether internally-operated ThriveUp platforms have read, acknowledged, and acted on directives issued by the hub. A directive is a governance instruction (e.g., "update your intake form to collect X," "implement CFIR construct Y").

WHAT IT DOES NOT MEASURE: Whether platforms are online. All 26 platform URLs are online (pinger-verified). There are zero "disconnected" platforms.

COMMON MISREAD TO AVOID: Do NOT interpret a fidelity percentage below 100% as "X platforms are disconnected." That is factually wrong. A platform can be 100% online (serving users every day) and have a fidelity grade below A because it hasn't yet acknowledged a directive.

EXTERNAL PARTNER PLATFORMS: Organizations with their own domains and technology stacks (e.g., implementationineducatio.com, lifetransitionsaid.org, vetmissiontransition.com) cannot send automated heartbeats to ThriveUp Academy's hub — they are separate organizations. They integrate via API and data-sharing agreements. Their participation is counted separately from internal governance fidelity.

CORRECT FRAMING FOR FUNDERS: "ThriveUp operates a self-governing compliance infrastructure where every internally-operated platform acknowledges directives and proves compliance with evidence URLs. The 44% current directive acknowledgment rate reflects the early-stage governance ramp-up as platforms complete onboarding to the directive system — not any platform being offline."

NEVER say: "17/26 platforms disconnected" or "only 9 platforms connected" — these framings do not exist in ThriveUp's architecture.`,
    keywords: ["fidelity", "44%", "disconnected", "connected", "heartbeat", "directive", "acknowledgment", "what fidelity means", "platform health", "how many connected", "online"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Human Services Supply Chain — Work Chaining",
    content: `Work chaining creates an automated human services supply chain. Instead of disconnected services, manual referrals, and drop-offs between steps, ThriveUp has trigger-based service flow, automated continuity of care, and no baton-dropping between systems. In practice: Prevention → Intervention → Stabilization → Recovery actually happens without fragmentation. A video script completed triggers Video Creator AI to produce it, which triggers Advertising Targeting to distribute it. Content flows from creation to distribution without manual handoffs. Even large health systems struggle with this level of continuity.`,
    keywords: ["work chain", "supply chain", "continuity", "automation", "referral", "handoff", "trigger"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Grant-Ready by Design — Not by Narrative",
    content: `Most organizations do the work, then write the story. ThriveUp structures the work so the story is already proven. This flips the entire funding model. Instead of "Trust us — we can do this," ThriveUp says "Here's the live system already doing it." Every platform maps to specific grants. Real-time compliance scores measure grant readiness. Verified deliverables provide evidence. Fidelity grades demonstrate quality. This is a fundamentally different level of credibility for funders.`,
    keywords: ["grant ready", "funding", "funder", "credibility", "evidence", "narrative", "proof", "design"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Why Nothing Else Compares — Market Position",
    content: `ThriveUp is not competing with Salesforce (CRM — tracks contacts, doesn't run services), Databricks (data lakehouse — stores data, doesn't deliver services), Epic/Cerner (health records — doesn't connect education, workforce, housing), or 211/United Way (referral directories — points to services, doesn't deliver and verify them). ThriveUp is building the infrastructure those systems would eventually have to plug into. It's a new category: Autonomous Community Operating System (ACOS) — not SaaS, not a platform, an operating system for human outcomes. Everyone else coordinates information. ThriveUp coordinates responsibility — and enforces it. Salesforce = system of record + engagement. Epic = system of care. CDPs = system of insight. ThriveUp = System of Accountability and Outcome Orchestration.`,
    keywords: ["compare", "competitor", "salesforce", "databricks", "epic", "different", "market", "acos", "category", "versus", "better", "outcome orchestration"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Why People Fall Through Cracks — And How ThriveUp Prevents It",
    content: `People don't fall through cracks because services don't exist. They fall through because: no one owns the transition, no one verifies the outcome, and no system enforces continuity. ThriveUp addresses all three: work chaining owns transitions, deliverable verification confirms outcomes, and the directive system with fidelity grading enforces continuity. The ecosystem didn't just connect services — it created accountability between them. That's the missing piece in almost every public system.`,
    keywords: ["cracks", "fall through", "transition", "accountability", "continuity", "why", "problem", "solve"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Digital Public Infrastructure + National Replication",
    content: `ThriveUp is digital public infrastructure — like roads enable movement, electricity enables power, and internet enables communication, this system coordinates human services across domains. Because it has standardized architecture, local adaptation via CFIR, and outcome tracking via RE-AIM, it can be deployed in any city. Three hubs are already operational: Austin, Manor, Pflugerville. The model scales nationally. Add a new city, plug in the same ecosystem, adapt to local context using implementation science.`,
    keywords: ["scale", "national", "replication", "infrastructure", "deploy", "city", "expand", "growth"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Elevator Pitch — How to Describe ThriveUp",
    content: `Don't say: "We built 26 platforms." Say: "We built a self-governing compliance infrastructure that ensures services are delivered, verified, and continuously improved across the full human lifecycle — from prevention to recovery." This is a governed system of systems. An Autonomous Community Operating System. It delivers services, monitors itself, grades its own performance, routes work automatically, and generates grant-ready evidence — all in one interconnected architecture. Combined reach: 170,000+ residents across Central Texas. 26 platforms covering education, workforce, health equity, veteran services, housing, safety, crisis prevention, and contractor/business enablement. 651 grants tracked. 271 database tables. 4 physics-grade trade simulation engines. 39 CFIR 2.0 constructs in production code. 107 languages.`,
    keywords: ["elevator pitch", "describe", "explain", "summary", "what we do", "pitch", "one sentence", "tell me about"],
  },
  {
    source: "governance", category: "governance", title: "Governance Framework — Who Governs the System",
    content: `ThriveUp Academy governance operates at three levels:
STRATEGIC GOVERNANCE (Board Level): Dr. Terry Flood, DHA serves as president with executive authority over ecosystem direction, grant strategy, and platform standards. The Collaborative Advocate (VOSB) provides organizational anchoring. An Advisory Board of community leaders, subject matter experts, and institutional partners provides oversight.
OPERATIONAL GOVERNANCE (System Level): The ecosystem hub at thrivingcommunitiesforall.com serves as the central governing authority. It issues directives, grades compliance, verifies deliverables, and enforces quality standards across all 24 platforms. RPLICE (Better Science Lab) serves as the mandatory quality gate — all grants, documents, and submissions require RPLICE review before release.
PLATFORM GOVERNANCE (Platform Level): Each platform maintains operational autonomy within ecosystem standards. Platforms must: send heartbeats every 15 minutes, respond to directives with substantive evidence, maintain minimum fidelity grade of C to remain in good standing, and participate in MAP-GAP continuous improvement cycles.
ETHICAL AI GOVERNANCE: Collaborative multi-AI review ensures no single AI model controls content quality — Gemini, Claude, and OpenAI independently analyze the same problem, then a synthesis step builds consensus. This collaborative intelligence model (not adversarial) is used by RPLICE and MCE. AI companions (Spark for youth, Sparky for adults) operate within age-appropriate guardrails. All AI outputs are grounded in verified data through RAG — no hallucinated recommendations. Privacy-first: screening results and safety plans stay on the user's device, never stored server-side. FERPA, COPPA, and CIPA compliance for youth-facing platforms.
ACCOUNTABILITY CHAIN: Platform → Hub → RPLICE → Dr. Flood → Advisory Board. Every level has defined escalation paths and override authority.`,
    keywords: ["governance", "who governs", "oversight", "board", "authority", "accountability", "ethical", "ethics", "who runs", "who controls", "structure", "leadership"],
  },
  {
    source: "governance", category: "governance", title: "Clinical Governance — Boundaries, Liability & Escalation",
    content: `ThriveUp maintains strict clinical governance boundaries:
CLINICAL DISCLAIMERS: All health screenings (C-SSRS, PHQ-9, GAD-7, PCL-5) carry explicit disclaimers: "This screening is not a diagnosis. Results should be discussed with a qualified healthcare provider." No platform provides medical diagnoses, treatment plans, or clinical interventions.
MANDATORY REPORTING: SafeReport provides the compliance framework — 50-state regulation database, 7-stage incident lifecycle, auto-generated deadlines, tamper-evident audit trails, court-admissible records. Platform staff are trained on mandatory reporting obligations.
CRISIS ESCALATION PROTOCOL: Three-tier escalation system:
Tier 1 — Automated: C-SSRS screening flags immediate risk → 988 Veterans Crisis Line displayed prominently (call or text 988) → Reach a Vet resources activated → Safety plan generated on-device.
Tier 2 — Warm Handoff: LifeBridge Community Health Workers coordinate direct connection to crisis services → 20,670+ verified resources for immediate referral → Warm handoff protocol ensures no "cold transfer" between services.
Tier 3 — Institutional: SafeReport mandatory reporting activated when required by law → Court-admissible documentation generated → Appropriate authorities notified per state regulations.
LIABILITY PROTECTIONS: ThriveUp platforms are navigation and coordination tools, not clinical providers. All clinical referrals go to licensed providers. Partnership agreements (via e-sign system) formalize legal boundaries between ecosystem partners. Consent framework includes Information Sharing consent, Emergency Contact Authorization, and tiered minor consent (COPPA/FERPA).
SCOPE BOUNDARIES: ThriveUp does NOT prescribe medication (PillScheduler manages reminders only), does NOT provide therapy (routes to licensed providers), does NOT make clinical decisions (provides validated screening tools only), does NOT store clinical records (privacy-first, on-device only).`,
    keywords: ["clinical", "liability", "risk", "escalation", "crisis", "mandatory reporting", "disclaimer", "scope", "legal", "consent", "hipaa", "safety", "boundary", "protocol"],
  },
  {
    source: "governance", category: "governance", title: "Interoperability Roadmap — External System Integration",
    content: `ThriveUp's interoperability strategy has three layers:
CURRENT STATE (Operational Now):
- Internal Ecosystem: 24 platforms communicate via heartbeat/directive API protocol with standardized event routing, work chaining, and compliance verification.
- Ecosystem Connectors: JavaScript connector libraries for every platform enabling cross-domain data exchange (health, justice, education, workforce).
- Public APIs: Integration document API, directives repository, live status, intelligence reports — all machine-readable JSON endpoints.
- 988 Integration: Crisis line accessible from every page on every platform with warm handoff protocols.
- SAM.gov: Live integration for federal grant opportunity searching and matching.
NEAR-TERM ROADMAP (6-12 months):
- FHIR R4 Integration: Health data interoperability with EHR systems using HL7 FHIR standard. Priority: referral resources (ServiceRequest), screening results (Observation), and care coordination (CarePlan). This enables connection to hospital systems, community health centers, and Medicaid managed care organizations.
- Texas HHSC Integration: Connection to Texas Health and Human Services Commission systems for Medicaid eligibility verification, SNAP/TANF referrals, and state-level outcome reporting.
- TEA Integration: Texas Education Agency data exchange for student support coordination, attendance tracking, and wraparound service documentation.
LONG-TERM VISION (12-24 months):
- VA Systems: Direct integration with Veterans Health Administration for veteran service coordination, benefits verification, and clinical referral pathways.
- State 211 Systems: Bidirectional integration with 211 resource databases for real-time resource availability and referral tracking.
- Medicaid Claims: Outcome-based reimbursement for community health worker services through LifeBridge.
- National Replication: Standardized deployment package with CFIR context adaptation and RE-AIM outcome tracking for any city or region.`,
    keywords: ["interoperability", "fhir", "ehr", "integration", "hhsc", "tea", "va", "211", "api", "systems", "external", "connect", "roadmap", "scale"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Core Operating Model — AI Coordinates, Systems Execute, Humans Decide",
    content: `ThriveUp operates on the principle: AI coordinates, Systems execute, Humans decide. This is the same balance used in advanced military operations, air traffic control, and high-reliability healthcare systems — translated into community infrastructure.
The architecture has five layers:
1. Central Orchestrator (The Brain): Coordinates all platforms, pushes and receives information, assigns roles dynamically, maintains system awareness.
2. Specialized Platforms (The Capabilities): Step forward based on context, domain, and timing. Self-report strengths and limitations. Execute within defined roles.
3. Execution Discipline Layer: Standardized execution checklist (doctrine/SOP) known across all platforms. Ensures consistency of action. Creates structured flexibility.
4. Learning + Feedback Loop: MAP-GAP continuous system reflection plus cross-platform shared learning.
5. Human Judgment Layer (RPLICE): Final decision authority, evidence-based validation, ethical and contextual override.
This is human-in-the-loop adaptive governance at scale. It avoids the two traps: over-automation (AI decides, humans sidelined, risk increases) and over-reliance on humans (everything manual, doesn't scale, inconsistency). ThriveUp is the third model — and it's extremely hard to replicate.`,
    keywords: ["operating model", "how it works", "ai coordinates", "humans decide", "architecture", "layers", "orchestrator", "brain", "balance", "military", "air traffic"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "MAP-GAP + RPLICE Governance Loop",
    content: `MAP-GAP and RPLICE form a governance loop that is the core differentiator:
MAP-GAP asks the questions: What happened? What worked? What didn't? Where are the gaps?
RPLICE answers them — with accountability: Reviews evidence, applies judgment, makes the final call.
This is not purely data-driven and not purely opinion-driven. It is evidence-informed, human-decided.
In a complex life event: The system detects context → assigns lead platform → activates support platforms → generates execution checklist. Platforms execute tasks and report back with evidence. MAP-GAP evaluates effectiveness and breakdowns. RPLICE reviews evidence, context, and risk, then makes final decisions and adjustments. Video AI documents what happened, what was learned, and what will change.
That's continuous system improvement in real time — not a post-mortem, but a living governance cycle.`,
    keywords: ["map-gap rplice", "governance loop", "evidence informed", "human decided", "improvement", "learning", "cycle"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Video Creator AI — The Narrative Engine",
    content: `Video Creator AI is not just a support tool — it's the narrative and alignment engine for the entire ecosystem. It removes the bottleneck between doing the work and explaining the work. Most organizations struggle exactly there.
Video AI converts system activity into understandable content, standardizes communication across platforms, and produces: training materials, grant narratives, stakeholder briefings, promotional videos, business presentations. Content flows through work chains: a platform completes work → Video Creator produces content → Advertising Targeting distributes it. This automated content pipeline means the ecosystem can explain what it does as fast as it does it.`,
    keywords: ["video", "narrative", "content", "communication", "explain", "bottleneck", "alignment engine"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Execution Checklist — The Ecosystem Doctrine",
    content: `The execution checklist is deceptively simple but powerful. In military terms, it's Standard Operating Procedure (SOP). In implementation science terms, it's a fidelity mechanism. It creates: shared expectations, consistent behavior, cross-platform alignment. Without this, the system would drift. With it, ThriveUp achieves structured flexibility — platforms can adapt to local context while maintaining system-wide standards. The directive system enforces the checklist: directives are issued, acknowledgments with evidence are required, weak responses are rejected, and fidelity is graded. This is doctrine for community services.`,
    keywords: ["checklist", "doctrine", "sop", "fidelity mechanism", "consistency", "standards", "structured flexibility"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Decision Quality Over Time — The Quiet Power Move",
    content: `Most people try to build smart platforms, better data, or faster workflows. ThriveUp focused on something different: decision quality over time. Systems don't fail from lack of tools — they fail from poor decisions under complexity. ThriveUp addressed that directly. The system knows, the platforms act, the human decides, the system learns — and then it does it again, better. Every cycle through MAP-GAP + RPLICE improves decision quality. This compounds over time into an organization that gets measurably better at everything it does.`,
    keywords: ["decision quality", "power", "compound", "improve", "better", "learn", "complexity", "fail"],
  },
  {
    source: "governance", category: "governance", title: "Next-Level Refinements — Decision Audit, Pattern Recognition, Role Clarity",
    content: `Four refinements that lock in ThriveUp's competitive advantage:
1. DECISION AUDIT TRAIL: Every RPLICE decision logged with inputs, rationale, and outcome. This becomes legal protection, a research dataset, and a training engine for the system itself.
2. PATTERN RECOGNITION LAYER: Over time, the system sees patterns like "this combination of factors → this sequence works best." Eventually it recommends strategies before humans even ask. The RAG AI is the beginning of this — grounded in live data, it already surfaces insights from ecosystem-wide patterns.
3. ROLE CLARITY UNDER STRESS: When multiple platforms could lead, formalized lead selection rules and tie-breaking logic determine who takes point. Based on domain expertise, fidelity grade, and context match.
4. ETHICAL GUARDRAILS: Clear boundaries for AI recommendations, explicit human-only decision zones, escalation triggers. AI never recommends clinical treatment, never overrides human judgment on safety, and always routes to 988 for crisis situations.`,
    keywords: ["audit trail", "pattern recognition", "role clarity", "ethical guardrails", "refinement", "next level", "advanced", "future"],
  },
  {
    source: "governance", category: "governance", title: "Evidence Strategy — Proving Impact to Skeptics",
    content: `ThriveUp's evidence strategy operates at four levels to satisfy any reviewer:
LEVEL 1 — REAL-TIME OPERATIONAL EVIDENCE (Available Now):
- Live fidelity grades for all 24 platforms (A through F) updated continuously
- Heartbeat monitoring — uptime and connectivity for every platform every 15 minutes
- Directive completion rates — how many action items completed vs. issued
- Deliverable verification — evidence URLs automatically verified by the hub
- Grant readiness scores — per-grant compliance aggregated from platform fidelity data
- Weekly intelligence reports with ecosystem-wide metrics
LEVEL 2 — FRAMEWORK-BASED EVIDENCE (Available Now):
- MAP-GAP continuous improvement cycles with documented Measure → Analyze → Plan → Gap → Action → Progress for every major initiative
- CFIR implementation analysis — context factors, barriers, facilitators documented for each regional hub deployment
- RE-AIM evaluation — Reach, Effectiveness, Adoption, Implementation, Maintenance metrics tracked per platform
- RPLICE quality gate — evidence-based practice verification for all outputs
LEVEL 3 — OUTCOME EVIDENCE (Building):
- Community Stories: Qualitative impact data from resident testimonials, categorized by service domain and platform routing effectiveness
- Case Management Outcomes: Phase completion rates, service delivery records, milestone tracking for workforce development and reentry participants
- Health Screening Outcomes: Aggregate (de-identified) trends in PHQ-9, GAD-7, C-SSRS scores across screened populations
- Coalition Impact: DFC 12-sector coalition tracking with participation rates, activity completion, and community indicator trends
LEVEL 4 — PUBLISHED EVIDENCE (Planned):
- Pilot Evaluation Reports: Formal evaluation of Austin, Manor, and Pflugerville hub deployments using quasi-experimental design
- Comparative Effectiveness: Analysis of outcomes for ecosystem-served populations vs. comparison groups receiving standard services
- Academic Publication: Peer-reviewed documentation of the ACOS model and implementation science approach
- Program Evaluation Briefs: Funder-ready 2-4 page summaries with key metrics, narratives, and outcome data for each grant cycle
EVIDENCE DIFFERENTIATION: Unlike most organizations that report what they did, ThriveUp can show the system doing it in real time. A funder can ask "show me your compliance data" and see live grades. They can ask "prove your platforms are connected" and see heartbeats. They can ask "how do you ensure quality?" and see the RPLICE quality gate in action. This is evidence by architecture, not evidence by narrative.`,
    keywords: ["evidence", "prove", "outcomes", "evaluation", "skeptic", "reviewer", "data", "metrics", "re-aim", "cfir", "results", "impact", "pilot", "publish", "measurement"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Parallel by Design — Resilient Ecosystem Architecture",
    content: `ThriveUp's 24 platforms are empowered to work in parallel, not in series. This is resilience by design:
SELF-SUFFICIENT NODES: Each platform has its own server, its own data, and its own heartbeat cycle. MCE doesn't need the Maternal Health Hub to be online to serve 115,000+ businesses. Emergency Management doesn't need MCE to run risk assessments. They share data when they can, but stand on their own when they have to.
HUB AS COORDINATOR, NOT DEPENDENCY: The hub at thrivingcommunitiesforall.com distributes directives, tracks compliance, and routes warm handoffs. But if it's offline for an hour, all 24 platforms keep doing their jobs. The heartbeat just retries on the next interval and picks up where it left off.
GRACEFUL DEGRADATION: Platforms cache their last directives and continue functioning independently if the hub is unavailable. No single broken link stops everything — this is a network where each node is self-sufficient and the connections make the whole greater than the parts.
NOT A CHAIN — A NETWORK: Most systems are chains where one broken link stops everything. ThriveUp is a network of self-sufficient platforms. The hub makes them more effective together, but each one stands on its own.
EVIDENCE VERIFICATION (NOT JUST ACKNOWLEDGMENT): Acknowledgment alone means "I saw it." ThriveUp goes further — deliverable verification pings evidence URLs (HEAD→GET fallback, SSRF protection) every 30 minutes to confirm real execution happened. Fidelity scores reflect actual work, not just receipt. This closes the accountability gap that most coordination systems leave open.
WARM HANDOFFS CLOSE THE CRACKS: Cold referrals are where people fall through cracks. The ecosystem has confirmation loops: "I sent this person to you" → "they arrived." This matters most for veterans, families, and maternal health patients in underserved communities.`,
    keywords: ["parallel", "resilient", "self-sufficient", "graceful degradation", "hub down", "independent", "network", "chain", "failure", "cache", "evidence", "warm handoff", "cold referral", "cracks", "empowered"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "Collaborative Multi-AI Intelligence — How ThriveUp Uses Multiple AIs",
    content: `ThriveUp uses collaborative multi-AI intelligence — not adversarial, but collaborative. Multiple AI providers look at the same problem from different perspectives so nothing is missed. This is exactly how RPLICE and MCE already operate.
THE APPROACH: When a critical decision, review, or analysis is needed, ThriveUp sends the same prompt to two or more independent AI models (Gemini, Claude, OpenAI). Each model analyzes independently. A synthesis step merges their perspectives into consensus, noting where they agree and where they differ.
WHY IT MATTERS: Different AI models have different training data, different reasoning patterns, and different blind spots. Google Gemini excels at speed and breadth. Anthropic Claude excels at careful reasoning and nuance. OpenAI GPT models excel at structured output and instruction following. Together, they catch what any single AI would miss.
HOW IT WORKS IN PRACTICE:
- Dual-AI Review (dualAIReview): Two AI models independently review the same content (grant proposals, compliance documents, platform outputs). A third synthesis call identifies differences. Used by RPLICE for quality gates and MCE for proposal review.
- Ensemble Response (generateMultiAIResponse): Two AIs generate independent responses to the same question. A consensus AI synthesizes the best of both. Used for strategic recommendations and complex planning.
- Streaming Fallback Chain: Gemini (primary) → Claude (secondary) → OpenAI (tertiary) → Replit AI (quaternary). If any provider fails, the next picks up automatically — zero disruption.
THE PHILOSOPHY: AI coordinates, Systems execute, Humans decide. Multiple AI perspectives improve the quality of coordination. The human (Dr. Flood, RPLICE reviewers) still makes the final decision — but with richer, more diverse AI input. This mirrors how high-reliability organizations use multiple independent checks for safety-critical decisions.`,
    keywords: ["multi ai", "collaborative", "dual ai", "ensemble", "multiple perspectives", "consensus", "claude", "gemini", "openai", "rplice review", "mce review", "quality", "intelligence", "collaborative intelligence", "adversarial", "viewpoints"],
  },
  {
    source: "strategic-framework", category: "strategy", title: "AI Provider Architecture — 4-Layer Resilient Intelligence",
    content: `ThriveUp's AI provider architecture ensures zero-downtime intelligent services through a 4-layer resilient design:
LAYER 1 — Google Gemini 2.0 Flash (Primary): Free tier, extremely fast, broad knowledge. Used for real-time streaming in Ecosystem AI chatbot, daily operations, and high-volume queries.
LAYER 2 — Anthropic Claude Haiku 4.5 (Secondary): Careful reasoning, strong on nuance and ethics. Used for collaborative review alongside Gemini, adds a different analytical perspective. Integrated via Replit AI Integrations (auto-configured environment variables, billed to Replit credits).
LAYER 3 — OpenAI GPT-4o-mini (Tertiary): Strong structured output, instruction following, JSON generation. Fallback for when Gemini and Claude are unavailable.
LAYER 4 — Replit AI Integrations GPT-5-nano (Quaternary): Final fallback, always available through Replit's infrastructure.
AUTOMATIC FAILOVER: The system detects rate limits (429), transient errors (5xx, timeouts), and empty responses. On any failure, it automatically falls back to the next provider in the chain. Users never see an error — they just get a response from whichever AI is available.
COLLABORATIVE MODE: For critical decisions (dual-AI review, ensemble response), the system calls two providers sequentially, collects their independent analyses, then runs a synthesis step to merge perspectives into consensus. This is the collaborative intelligence pattern used by RPLICE and MCE.`,
    keywords: ["provider", "gemini", "claude", "openai", "gpt", "fallback", "resilient", "architecture", "layer", "failover", "rate limit", "zero downtime"],
  },
  {
    source: "competitive-analysis", category: "strategy", title: "Competitive Landscape — Why Nothing Else Compares (Deep Analysis)",
    content: `Detailed competitive analysis of ThriveUp vs. the market:
A. ENTERPRISE PLATFORMS (Salesforce, Workday): They aggregate data, provide 360-degree views, use AI for workflows, enable team collaboration. They're even moving toward AI agent orchestration. BUT they do NOT enforce execution, do NOT require proof of work, do NOT grade system fidelity, do NOT dynamically assign leadership across domains. They are: Data + Workflow + CRM. ThriveUp is: Governance + Orchestration + Accountability + Execution.
B. EHR / HEALTHCARE SYSTEMS (Epic, Cerner): They track clinical care, store medical records, support care coordination. Adding AI agents for specific workflows. BUT they stay inside healthcare domain only. They do NOT integrate workforce, education, housing, or community services. They are: Clinical systems. ThriveUp is: Whole-life system (health + social + economic + education).
C. DATA PLATFORMS / CDPs / AI SYSTEMS: They create unified profiles, aggregate data, enable analytics and targeting. BUT they do NOT act, do NOT coordinate services, do NOT enforce outcomes. They are: Insight engines. ThriveUp is: Action + Verification + Outcome system.
THE KEY DIFFERENCE: Everyone else coordinates information. ThriveUp coordinates responsibility — and enforces it. What they do: "Here's the data," "Here's a workflow," "Here's a recommendation." What ThriveUp does: "You are responsible," "Prove you did it," "If not, you fail," "Next system — step in." That's governance.`,
    keywords: ["competitor", "salesforce", "epic", "cerner", "workday", "cdp", "compare", "versus", "different", "market", "landscape", "enterprise", "ehr", "healthcare system"],
  },
  {
    source: "competitive-analysis", category: "strategy", title: "Four Things Nobody Else Is Doing Together",
    content: `Independent analysis identified four capabilities no one else combines:
1. SELF-GRADING ECOSYSTEM: Platforms evaluated A through F based on actual execution evidence. Nobody is doing this at ecosystem level.
2. CROSS-DOMAIN LIFE ORCHESTRATION: Health + workforce + education + safety + family coordinated together. Everyone else is siloed.
3. WORK CHAINING ACROSS INDEPENDENT PLATFORMS: One system triggers another automatically. This pattern exists in supply chains but not in human services.
4. HUMAN-IN-THE-LOOP FINAL AUTHORITY (RPLICE): Not AI-driven decisions, not manual chaos — structured human governance. This is extremely rare at scale.
MARKET POSITION: Salesforce = system of record + engagement. Epic = system of care. CDPs = system of insight. ThriveUp = System of Accountability and Outcome Orchestration. This is a new category.`,
    keywords: ["unique", "edge", "advantage", "self grading", "cross domain", "work chain", "rplice", "human in the loop", "nobody", "first", "category", "new category", "position"],
  },
  {
    source: "competitive-analysis", category: "strategy", title: "Strategic Window — Category-Defining Opportunity",
    content: `ThriveUp has a strategic window. Not forever — but right now. The market is moving in pieces toward what ThriveUp already has as a unified system:
- Salesforce is moving toward agent orchestration
- Healthcare systems are integrating AI layers
- Government is pushing toward whole-person care models
But being early to a direction means having the window to define the category. The first organization that proves "We don't just connect services — we ensure outcomes" wins a completely new category.
WHY THIS MATTERS FOR GRANTS: This positioning — System of Accountability and Outcome Orchestration — is exactly what funders want to hear. DFC wants proven prevention. WIOA wants workforce outcomes. St. David's wants health equity results. SSG Fox wants veteran services that actually work. ThriveUp can show live compliance data, real-time fidelity grades, verified deliverables, and evidence by architecture, not narrative.
DEFENSIBILITY: ThriveUp didn't stop at coordination — it built enforcement and learning. The market avoids this because it's hard, it creates accountability, and it changes power structures. That's exactly why it's defensible.`,
    keywords: ["window", "opportunity", "category", "defensible", "strategy", "market", "first mover", "funder", "grant", "positioning", "enforce", "accountability", "outcome orchestration"],
  },
  {
    source: "competitive-analysis", category: "strategy", title: "Blue Water Strategy — Staying Ahead Through Implementation",
    content: `ThriveUp operates a blue water strategy: staying in open water ahead of the competition through innovation, agility, adaptability, collaboration, communication, and alignment — all tied directly to implementation, not theory.
What "blue water" means: While competitors (Microsoft Azure, Databricks, dbt Labs, Red Hat, Salesforce) publish whitepapers, sell blueprints, and run marketing campaigns about what organizations SHOULD do with AI, ThriveUp has already DONE it — for the communities that need it most, not the Fortune 500.
The blue water principles that keep ThriveUp ahead:
1. INNOVATION — 4-provider collaborative AI architecture (Gemini, Claude, OpenAI, Replit AI) with automatic failover, dual-AI review, ensemble consensus. Not a single vendor dependency.
2. AGILITY — 24 platforms governed by heartbeat, any platform can adapt independently while maintaining ecosystem compliance. Changes deploy across the system without breaking the whole.
3. ADAPTABILITY — Three regional hubs (Austin, Manor, Pflugerville) each customized to local needs while sharing the same infrastructure. Implementation science (CFIR, RE-AIM) built in.
4. COLLABORATION — Not just human collaboration — AI collaboration. Multiple AI models bring different perspectives so nothing is missed. RPLICE quality gates ensure collaborative review at every decision point.
5. COMMUNICATION — Directive system, report cards, heartbeat monitoring, work chaining, and fidelity grading create a communication fabric across 21 independent platforms. Every platform knows what's expected, what others are doing, and how they're performing.
6. ALIGNMENT — Every feature, every platform, every directive ties back to grant requirements, stakeholder needs, and community outcomes. Nothing is built for its own sake.
The key differentiator: ALIGNMENT TIED TO IMPLEMENTATION. Ideas without execution are just ads on LinkedIn. ThriveUp doesn't sell the map — it IS the territory.`,
    keywords: ["blue water", "strategy", "innovation", "agility", "adaptability", "collaboration", "communication", "alignment", "implementation", "cutting edge", "ahead", "competitive", "advantage", "lead"],
  },
  {
    source: "competitive-analysis", category: "strategy", title: "Enterprise AI Comparison — Blueprint Sellers vs. Implementation Leaders",
    content: `In March 2026, the world's largest technology companies are spending billions marketing AI infrastructure concepts that ThriveUp has already implemented:

MICROSOFT AZURE — "Implementing an AI Center of Excellence" (e-book/whitepaper)
What they're selling: Guidelines for enterprises to establish an AI CoE.
What ThriveUp already has: A live AI Center of Excellence with 4 AI providers, collaborative intelligence, RAG knowledge base (72+ chunks), dual-AI review, and automatic fallback chains. Not guidelines — a running system serving real communities.

DBT LABS — "Structured for Intelligence: Why AI Needs Governed, Discoverable, and Provisioned Data" (O'Reilly Report)
What they're selling: The argument that AI needs structured, governed data.
What ThriveUp already has: 193 database tables, 234 storage methods, 20 governed platforms with fidelity grading A-F, directive enforcement, deliverable verification, and automated compliance reporting. Not an argument — an architecture.

DATABRICKS — "A Compact Guide to Retrieval Augmented Generation (RAG)"
What they're selling: A tutorial on how to build RAG.
What ThriveUp already has: A production RAG system with 72 knowledge chunks (52 static + 20 live intelligence), real-time ecosystem health data, grant readiness scoring, competitive positioning, and clinical safety boundaries — all powering a live Ecosystem AI assistant. Not a guide — a deployed system.

RED HAT — "Generative AI on Kubernetes: Operationalizing Large Language Models" (O'Reilly)
What they're selling: How to operationalize Gen AI in enterprise infrastructure.
What ThriveUp already has: 301 API endpoints (100% error-handled), 4-provider AI with zero-downtime failover, streaming responses, rate limiting, and production deployment — all operationalized and serving users today. Not a book — an operation.

The pattern: Every major tech company is selling the IDEA of what ThriveUp has already BUILT. They're monetizing the blueprint. ThriveUp is monetizing the outcome. When a funder asks "How is this different?", the answer is: Microsoft is selling the concept. We shipped the system. And our accountability layer goes further than anything those platforms even describe.`,
    keywords: ["microsoft", "azure", "databricks", "dbt", "red hat", "enterprise", "comparison", "blueprint", "implementation", "rag", "ai center", "excellence", "operationalize", "structured intelligence", "governed data", "competition", "funder question"],
  },
  {
    source: "competitive-analysis", category: "strategy", title: "Continuous Innovation Cadence — Why ThriveUp Stays in Blue Water",
    content: `ThriveUp maintains blue water distance from competitors through a continuous innovation cadence that combines speed with accountability:

INNOVATION VELOCITY:
- MAP-GAP continuous improvement framework runs systematic audit cycles
- RPLICE (Research-to-Practice Lifecycle Implementation & Community Evidence) — ThriveUp's sister platform at implementationineducatio.com — provides implementation science quality gates ensuring improvements are evidence-grounded
- 4-provider AI architecture means no single vendor bottleneck — when one provider innovates, the ecosystem absorbs it immediately
- Collaborative multi-AI intelligence means every major decision gets multiple AI perspectives before implementation

AGILITY MECHANISMS:
- Parallel-by-design architecture: 24 platforms can innovate independently without waiting for central approval
- Heartbeat governance: 10-minute check-in cycles mean the ecosystem knows within minutes when something changes
- Work chaining: When one platform innovates, the improvement automatically propagates to dependent platforms
- Directive system: New capabilities can be rolled out across all 24 platforms through a single directive with tracked acknowledgment

ADAPTABILITY INFRASTRUCTURE:
- Implementation science frameworks (CFIR, RE-AIM) built into deployment methodology
- Regional customization: Austin, Manor, Pflugerville each adapt shared infrastructure to local demographics and needs
- Schema flexibility: 193 tables designed for extension without breaking existing functionality
- Evidence by architecture: Every new feature automatically generates grant-ready evidence through the compliance system

WHY COMPETITORS CAN'T CATCH UP EASILY:
1. They optimize for revenue. ThriveUp optimizes for outcomes.
2. They sell to enterprises. ThriveUp serves communities.
3. They build tools. ThriveUp built an operating system.
4. They avoid accountability. ThriveUp enforces it.
5. They coordinate information. ThriveUp coordinates responsibility.

The gap isn't just technology — it's philosophy. You can copy features. You can't copy a mission-driven accountability architecture built over years of community partnership.`,
    keywords: ["innovation", "velocity", "cadence", "continuous", "map gap", "rplice", "agility", "adaptability", "parallel", "heartbeat", "work chain", "directive", "catch up", "philosophy", "mission", "community", "blue water", "distance", "speed"],
  },
  {
    source: "resource-directory", category: "advocacy", title: "National Advocacy & Civil Rights Organizations Directory",
    content: `ThriveUp's National Advocacy & Resource Directory contains 88+ organizations across 12 categories. Civil Rights & Advocacy organizations with chapter finders:
- NAACP: 2,200+ local units across all 50 states. Find chapters: naacp.org/find-local-unit. Phone: 410-580-5777. Focus: racial justice, voting rights, criminal justice reform, education equity.
- ACLU: Offices in all 50 states. Find affiliates: aclu.org/about/affiliates. Phone: 212-549-2500. Focus: constitutional rights, criminal justice, immigration, LGBTQ+ rights.
- National Urban League: 90+ affiliates in 36 states. Find local: nul.org/local-affiliates. Phone: 212-558-5300. Focus: economic empowerment, education, workforce development.
- Southern Poverty Law Center (SPLC): Phone: 334-956-8200. Focus: hate group monitoring, immigrant justice, LGBTQ+ rights.
- National Action Network (NAN): 106 city chapters. Find chapters: nationalactionnetwork.net/chapters. Phone: 212-690-3070.
- Color of Change: Largest online racial justice organization. Website: colorofchange.org.
- Equal Justice Initiative (EJI): Founded by Bryan Stevenson. Phone: 334-269-1803. Focus: wrongful conviction, death penalty, racial justice.
- MALDEF: Nation's leading Latino civil rights org. Phone: 213-629-2512.
- Asian Americans Advancing Justice: Phone: 202-296-2300. Focus: anti-hate, immigration, voting.
- Human Rights Campaign (HRC): Largest LGBTQ+ org. Find local: hrc.org/in-your-area. Phone: 202-628-4160.
- National Congress of American Indians (NCAI): Phone: 202-466-7767. Tribal sovereignty and treaty rights.
Users can search all organizations at /resource-directory on the ThriveUp platform.`,
    keywords: ["naacp", "aclu", "urban league", "splc", "civil rights", "advocacy", "racial justice", "equal justice", "maldef", "hrc", "lgbtq", "voting rights", "discrimination", "chapter", "find local", "near me"],
  },
  {
    source: "resource-directory", category: "legal", title: "Legal Aid, Justice Reform & Record Expungement Directory",
    content: `Legal aid and justice reform organizations in the ThriveUp Resource Directory:
- Legal Services Corporation (LSC): FREE civil legal help in every state. Find help: lsc.gov/about-lsc/what-legal-aid/get-legal-help. Phone: 202-295-1500.
- Innocence Project: Exonerates wrongfully convicted through DNA testing. 375+ freed. Phone: 212-364-5340.
- National Reentry Resource Center: Primary source for reentry and criminal justice reform resources.
- Clean Slate Initiative: Automatic criminal record clearance. Over 100 million Americans have records.
- Prison Policy Initiative: Data and analysis on mass incarceration, money bail, prison conditions. Phone: 413-527-0845.
- The Sentencing Project: Sentencing reform, racial disparities research. Phone: 202-628-0871.
- National Legal Aid & Defender Association (NLADA): Public defenders and legal aid connections. Phone: 202-452-0620.
All accessible at /resource-directory on ThriveUp platform.`,
    keywords: ["legal aid", "lawyer", "attorney", "expungement", "record", "clean slate", "innocence", "wrongful conviction", "reentry", "sentencing", "public defender", "free legal help"],
  },
  {
    source: "resource-directory", category: "chambers", title: "Chambers of Commerce & Business Development Directory",
    content: `Chambers of Commerce in the ThriveUp Resource Directory for business development and entrepreneurship:
- U.S. Chamber of Commerce: 3+ million businesses. Find local: uschamber.com/co/chambers. Phone: 202-659-6000.
- National Black Chamber of Commerce (NBCC): 190+ affiliate chapters. Find chapters: nationalbcc.org/membership/find-a-chapter. Phone: 202-466-6888. Black business development, access to capital.
- U.S. Hispanic Chamber of Commerce (USHCC): 4.37 million Hispanic-owned businesses, $800B+ economy. Find local: ushcc.com/local-hispanic-chambers. Phone: 202-842-1212.
- Asian/Pacific Islander American Chamber of Commerce: AAPI business development. Website: national-apacc.org.
- National LGBT Chamber of Commerce (NGLCC): LGBTQ+ business certification. Find affiliates: nglcc.org/affiliate-chambers. Phone: 202-234-9181.
- National Veteran-Owned Business Association (NaVOBA): Veteran business certification for government and corporate buyers. Website: navoba.org.
- U.S. Women's Chamber of Commerce: Women business certification, government contracting. Phone: 202-607-2488.
- Greater Austin Black Chamber of Commerce: Austin-area Black business network. Phone: 512-904-4117.
- Greater Austin Hispanic Chamber of Commerce: 3,000+ members. Phone: 512-476-7502.
All accessible at /resource-directory on the ThriveUp platform.`,
    keywords: ["chamber", "commerce", "business", "black chamber", "hispanic chamber", "minority business", "veteran business", "women business", "contracting", "entrepreneur", "startup", "small business"],
  },
  {
    source: "resource-directory", category: "faith", title: "Faith-Based & Spiritual Organizations Directory",
    content: `Faith-based organizations in the ThriveUp Resource Directory:
- National Council of Churches: 38 member communions, 30+ million members. Phone: 202-544-2350.
- African Methodist Episcopal (AME) Church: Oldest independent Black denomination, 2.5M+ members, 7,000+ congregations in 39 states.
- National Baptist Convention: 7.5 million members, 31,000 churches. Largest African American convention.
- Catholic Charities USA: 15 million people served annually through 2,700 agencies. Find help: catholiccharitiesusa.org/find-help. Phone: 703-549-1390. NO religious requirement.
- The Salvation Army: Find locations: salvationarmyusa.org. Phone: 1-800-725-2769. Disaster relief, homelessness, addiction recovery.
- Prison Fellowship: 800+ prisons. Phone: 800-206-9764. Reentry support, children of incarcerated.
- Islamic Society of North America (ISNA): Phone: 317-839-8157. Interfaith dialogue, community development.
- Jewish Family Services: 125+ agencies. Find: networkjewishfamilyservice.org/agency-members. Mental health, refugee services.
- Kairos Prison Ministry: 500+ correctional institutions. Phone: 407-629-4948.
All accessible at /resource-directory on the ThriveUp platform.`,
    keywords: ["church", "faith", "religious", "spiritual", "ame", "baptist", "catholic", "salvation army", "prison fellowship", "mosque", "temple", "synagogue", "charity", "ministry"],
  },
  {
    source: "resource-directory", category: "veterans", title: "Veteran Services & Support Organizations Directory",
    content: `Veteran service organizations in the ThriveUp Resource Directory:
- VA (Department of Veterans Affairs): Healthcare, benefits, GI Bill, disability. Find: va.gov/find-locations. Phone: 1-800-827-1000.
- Disabled American Veterans (DAV): 1.3M members. Free claims help. Find: dav.org/membership/chapters-and-departments. Phone: 877-426-2838.
- Veterans of Foreign Wars (VFW): 6,000+ posts. Free claims help. Find: vfw.org/find-a-post. Phone: 816-756-3390.
- Team Red White & Blue: Social fitness events. Find: members.teamrwb.org.
- Wounded Warrior Project: Free mental health, career, rehab for post-9/11 vets. Phone: 904-296-7350.
- IAVA: Post-9/11 veteran empowerment. Burn pit exposure advocacy. Website: iava.org.
- Cohen Veterans Network: Mental health clinics, sliding scale. Find: cohenveteransnetwork.org/clinics.
All accessible at /resource-directory. ThriveUp's EMERGENCY MANAGEMENT platform integrates veteran crisis intervention.`,
    keywords: ["veteran", "va", "military", "dav", "vfw", "wounded warrior", "ptsd", "gi bill", "disability", "service member", "army", "navy", "marines", "air force"],
  },
  {
    source: "resource-directory", category: "crisis", title: "Crisis & Emergency Hotlines Directory",
    content: `Crisis and emergency resources in the ThriveUp Resource Directory — SAVE THESE NUMBERS:
- 988 Suicide & Crisis Lifeline: Call or text 988. Veterans press 1. Spanish press 2. 24/7. Website: 988lifeline.org.
- National Domestic Violence Hotline: 1-800-799-7233. 24/7. Safety planning, shelter referrals. Website: thehotline.org.
- Crisis Text Line: Text HOME to 741741. Free 24/7 text-based crisis counseling. Website: crisistextline.org.
- RAINN (Sexual Assault): 1-800-656-4673. 24/7 confidential. Website: rainn.org.
- National Human Trafficking Hotline: 1-888-373-7888. 24/7. Website: humantraffickinghotline.org.
- National Child Abuse Hotline: 1-800-422-4453. 24/7. Website: childhelp.org.
- SAMHSA Helpline (Substance Abuse): 1-800-662-4357. 24/7. Free. Find treatment: findtreatment.gov.
- NAMI Helpline (Mental Health): 1-800-950-6264. Find local: nami.org/Your-Local-NAMI/Find-Your-Local-NAMI.
All accessible at /resource-directory on ThriveUp. For health or crisis queries, always call 988 first.`,
    keywords: ["crisis", "emergency", "hotline", "suicide", "988", "domestic violence", "sexual assault", "child abuse", "trafficking", "help", "danger", "urgent", "samhsa", "nami", "mental health"],
  },
  {
    source: "resource-directory", category: "housing-employment", title: "Housing, Employment & Education Resources Directory",
    content: `Housing, employment, and education resources in the ThriveUp Resource Directory:
HOUSING: HUD housing counseling (1-800-569-4287, hud.gov/findhelp), Habitat for Humanity (habitat.org/local/find-your-local-habitat), Oxford House recovery housing (3,500+ houses in all 50 states, oxfordhouse.org/find-a-house), National Low Income Housing Coalition (nlihc.org).
EMPLOYMENT: American Job Centers (2,400+ locations, careeronestop.org), Goodwill Industries (goodwill.org/locator), Center for Employment Opportunities (reentry jobs, ceoworks.org), Dave's Killer Bread Foundation (second chance employers, dkbfoundation.org), Federal Bonding Program (FREE bonds for employers hiring at-risk, bonds4jobs.com), HIRE Network (employment rights for people with records, hirenetwork.org).
EDUCATION: Khan Academy (free, khanacademy.org), FAFSA/Pell Grants (studentaid.gov, incarcerated eligible), ProLiteracy (free GED/literacy, proliteracy.org/what-we-do/find-a-program), NCES school finder (nces.ed.gov/ccd/schoolsearch).
FAMILY: Head Start (eclkc.ohs.acf.hhs.gov/center-locator), Boys & Girls Clubs (bgca.org/get-involved/find-a-club), Big Brothers Big Sisters (bbbs.org/find-a-local-agency), Children's Defense Fund (childrensdefense.org).
HEALTH: SAMHSA treatment locator (findtreatment.gov), Community Health Centers (findahealthcenter.hrsa.gov, sliding scale), Planned Parenthood (plannedparenthood.org/health-center).
All accessible at /resource-directory. Education is the #1 protective factor.`,
    keywords: ["housing", "hud", "habitat", "section 8", "homeless", "employment", "job", "career", "goodwill", "education", "ged", "pell grant", "head start", "boys girls club", "health center", "substance abuse", "treatment"],
  },
  {
    source: "grant-strategy", category: "grants", title: "Grant Writing Rule: Objectives Must Be Measured Against Baseline Data",
    content: `Critical grant writing principle (standard federal grant-writing convention): Objectives are NOT evaluated independently — they are assessed in direct relation to the data presented in the Need Statement. Objectives must reflect measurable change from a clearly defined baseline. When baseline data is vague, lacks specificity, or is not supported by comparison, objectives appear arbitrary rather than justified. This undermines confidence in both feasibility and evaluability. STRONG APPLICATIONS ensure data establishes a clear and measurable starting point — defining the population, the condition, the measurement method, and comparative context. When data is structured this way, objectives become defensible, measurable, and aligned with funder expectations. The strength of an objective is determined long before it is written. RPLICE's SDOH Location Intelligence pulls live Census ACS, CDC PLACES, EPA, and SVI data by ZIP code — this is the baseline engine for every grant application. Always anchor objectives to specific, current, locally-sourced data points.`,
    keywords: ["grant writing", "objectives", "baseline", "need statement", "measurable", "data", "evaluation", "rplice", "sdoh", "census", "proposal"],
  },
  {
    source: "grant-strategy", category: "grants", title: "Why 99% of Government Contractors Lose — Risk Reduction Strategy",
    content: `Critical government contracting intelligence (source: David Cuellar, Government Contracting Advisory): Most contractors think they lose because of pricing or competition. That is not the real reason. A lot of contracts are already leaning toward someone before they are posted — not officially decided, but quietly shaped. Agencies do not start with an RFP. They start with RISK REDUCTION. They look for: (1) Vendors they have already seen perform under pressure, (2) Companies that responded fast in past situations, (3) Familiar names from prior work, outreach, or visibility, (4) Proof someone can deliver without issues or delays. By the time the RFP is written, the real question is not 'Who is best?' — it is 'Who is the safest choice to award this to?' The 1% who win focus on: (1) Building proof of reliability BEFORE large contracts exist, (2) Winning smaller or adjacent work that mirrors future scope, (3) Being associated with OUTCOMES not just capabilities, (4) Reducing perceived risk long before evaluation happens. So when the RFP drops, the decision is already easier to defend internally. They win not because they bid better — because they were already the safest answer. YOUR ADVANTAGE: ThriveUp has 24 LIVE platforms with real users, validated screening instruments, deployed outcome data. When CDMRP FOAs drop, you are not pitching a concept — you are showing a functioning system. This is the risk reduction the 1% build.`,
    keywords: ["government contracting", "govcon", "rfp", "risk reduction", "bidding", "proposal", "federal contracts", "cdmrp", "incumbent", "win strategy", "procurement"],
  },
  {
    source: "grant-strategy", category: "grants", title: "Compliance Gate: Section L and Section M Win Government Contracts",
    content: `Federal proposal compliance framework (source: Peter J. Arduini concept): Section L is your Blueprint — it tells you exactly what to submit. Section M is your Scorecard — it tells you exactly how it will be graded. The 'Administrative Guillotine' is real: 1.1% price impact can still be classified as 'Material.' GAO reports that failure to comply with administrative requirements is fatal — proposals get rejected for incorrect fonts, page limits, missing amendments and signatures. PROCESS: (1) 'Own' the RFP for compliance — scan for 'shall,' 'must,' 'will' to identify every mandatory requirement. (2) Use a Compliance Matrix as your scorecard — map every solicitation requirement to a specific section and page number in your proposal. (3) Conduct a 'Gold Team Audit' — perform a final, independent pre-submission audit of Section L instructions BEFORE submitting. RULE: Before drafting any proposal, create a spreadsheet listing every requirement in Section L. In one column, indicate which section of your proposal addresses it, in another mark the status. Do not submit until every row says COMPLETE. This safeguards every proposal you write.`,
    keywords: ["section l", "section m", "compliance", "rfp", "federal", "proposal", "administrative", "gao", "gold team", "compliance matrix", "government"],
  },
  {
    source: "grant-strategy", category: "grants", title: "CDMRP FY2026 Master Grant Strategy — 31 Programs, $1.187B Addressable",
    content: `CDMRP (Congressionally Directed Medical Research Programs) FY2026 — the single largest grant opportunity in the ecosystem. $1.27B total across 34 programs, 31 addressable ($1.187B). All FY26 programs are in PRE-ANNOUNCEMENT phase. FOAs with deadlines expected April-June 2026. Estimated submission window: May-August 2026. TIER 1 (14 programs, ~$890M — submit to ALL): PRMRP ($370M, 45+ of 52 topics match), PRCRP ($165M, 11+ cancers), BCRP (~$120M, breast cancer), PCRP (~$75M, prostate), TBIPHRP (~$55M, TBI/PTSD), OCRP ($50M, ovarian), SCIRP ($33M, spinal cord), LCRP (~$30M, lung), PTSD (~$20M), ERP (~$20M, epilepsy), MSRP (~$20M, MS), Suicide (~$15M), SA/DV (~$5M), ASUDRP ($4M, substance use). TIER 2 (12 programs, ~$245M — submit 3-4 strongest). TIER 3 (5 programs, ~$52M — concept awards only). Submit via eBRAP.org (pre-application) then Grants.gov (full). CFDA 12.420. SAM.gov required. Nonprofits 501(c)(3) explicitly eligible. VOSB status is positive factor. Full strategy document: docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md.`,
    keywords: ["cdmrp", "prmrp", "prcrp", "bcrp", "tbiphrp", "military", "dod", "defense", "ebrap", "grants.gov", "cancer", "tbi", "ptsd", "suicide", "substance use", "veteran", "medical research"],
  },
  {
    source: "grant-strategy", category: "grants", title: "HerHealth Network — 70 Conditions Across 7 Platforms for CDMRP Matching",
    content: `HerHealth Network (herhealthmatters2.com) covers 70 women's health conditions across 7 specialized platforms (10 conditions each): (1) CANCER: Breast, TNBC, BRCA, IBC, Cervical, Ovarian, Endometrial, Colorectal, Lung, Thyroid. (2) CARDIOVASCULAR: Hypertension, Heart Disease, Stroke, Arrhythmia, Heart Failure, PAD, DVT, Pulmonary Embolism, Cardiomyopathy, Congenital Heart. (3) AUTOIMMUNE: Lupus, RA, MS, Sarcoidosis, Fibromyalgia, Sjögren's, Psoriasis, Hashimoto's, Celiac, Type 1 Diabetes. (4) MENTAL HEALTH: Depression, Anxiety, PTSD, Bipolar, Postpartum Depression, Grief, Racial Trauma, Eating Disorders, Substance Use, Sleep/Insomnia. (5) REPRODUCTIVE: Fibroids, Endometriosis, PCOS, Fertility, Menopause, Sexual Health, Urinary Incontinence, Pelvic Floor, Vulvodynia, Cervical Dysplasia. (6) METABOLIC: Type 2 Diabetes, Obesity, Thyroid Disorders, Metabolic Syndrome, Vitamin D Deficiency, Iron Deficiency, Osteoporosis, Insulin Resistance, Gestational Diabetes, Sickle Cell. (7) INFECTIOUS & OTHER: HIV, Hep B/C, HPV, STIs, Long COVID, Kidney Disease, Asthma, CFS/ME, Lyme Disease, Melanoma. Key assets: Nia AI Navigator, 5 Decision Wizards, 2,100+ resources, SDOH-first design, P2P mesh, B2B $50K-$500K/yr tiers. EIN 41-3618003. HerHealth directly matches 40+ of 52 PRMRP topics and 15+ of 20 PRCRP cancer topics.`,
    keywords: ["herhealth", "women's health", "cancer", "cardiovascular", "autoimmune", "mental health", "reproductive", "metabolic", "infectious", "nia", "herhealthmatters", "conditions", "cdmrp", "sankofa"],
  },
  {
    source: "grant-strategy", category: "grants", title: "TheHealthyBlkMan — 15 Health Domains with Malik AI for CDMRP",
    content: `TheHealthyBlkMan (thehealthyblkman.com) covers 15 health domains: (1) Heart & Cardiovascular, (2) Cancer & Oncology (prostate, colorectal, lung), (3) Diabetes & Metabolic, (4) Kidney & Urinary, (5) Mental Health & Emotional Wellness, (6) Sleep & Stress, (7) Brain & Neurology (TBI, Alzheimer's, stroke recovery), (8) Lung & Respiratory (asthma, COPD), (9) Digestive & Liver (hepatitis), (10) Sexual & Reproductive Health (HIV/PrEP), (11) Musculoskeletal & Pain, (12) Infectious Disease, (13) Substance Use & Recovery, (14) Violence/Trauma/Recovery, (15) Primary Care & Prevention. Key assets: Malik AI navigator, 5,200+ providers, MAP-GAP assessment, 8 actionable domains, barbershop outreach model, veteran health pathway. Black men 2x more likely to die from prostate cancer (largest racial disparity in any cancer).`,
    keywords: ["healthyblkman", "men's health", "prostate", "cardiovascular", "diabetes", "mental health", "substance use", "malik", "barbershop", "veteran", "black men"],
  },
  {
    source: "grant-strategy", category: "grants", title: "Whole-Person Health — Complete Validated Screening Instrument List",
    content: `Whole-Person Health (mentalwellnesssupport.net) has 6 validated clinical screening instruments plus 3 platform-developed assessments: VALIDATED: (1) PHQ-9 — Patient Health Questionnaire (depression, 9 items), (2) GAD-7 — Generalized Anxiety Disorder (7 items), (3) C-SSRS — Columbia-Suicide Severity Rating Scale with auto-escalation to 988/Reach a Vet, (4) PCL-5 — PTSD Checklist for DSM-5 (20 items), (5) AUDIT-C — Alcohol Use Disorders Identification Test (3 items), (6) DAST-10 — Drug Abuse Screening Test (10 items). PLATFORM-DEVELOPED: (7) Behavioral Health Screening (emotional well-being, sleep, connection — 8 items), (8) Stress & Coping Evaluation (perceived control, coping strategies — 7 items), (9) Holistic Wellness Check (physical, emotional, social, spiritual, financial — 9 items). FEATURES: Safety Plan Builder, auto-escalation to 988, cross-platform data router, MAP-GAP biopsychosocial assessment.`,
    keywords: ["phq-9", "gad-7", "c-ssrs", "pcl-5", "audit-c", "dast-10", "screening", "assessment", "validated", "depression", "anxiety", "suicide", "ptsd", "alcohol", "drugs", "whole-person"],
  },
  {
    source: "strategic-intel", category: "partnerships", title: "Texas Rural Health Association — Rural Health Collective April 2026",
    content: `Texas Rural Health Association (TRHA) hosts the Rural Health Collective April 20-24, 2026. Agenda includes: Rural Workforce Development in Texas Communities (Haley Stuteville, April 21), Mental Health Landscape Facing Underserved Youth (Thomas Warren Jr, April 22), Rural Health Advocacy and Engagement Session (April 23, with Haley Stuteville, Tenyz Moonan, Sherry Cheever, ZI Joyce Deon Normes). Faculty Research Presentations April 24 include: 'AI Powered Solutions to Address Maternal Care Deserts' (Lauri Billingsley), 'Improving Telehealth Access for Texas Veterans: A Data-Driven Approach' (Rakesh Pokuri), 'Bridging Gaps in Maternal Safety' (Jacquelyn Alvarado), rural nursing workforce pipeline. UTA Center for Rural Health and Nursing Innovation is co-hosting. OPPORTUNITY: Networking with rural health leaders, potential partnerships, letter of support opportunities, positioning ecosystem platforms (HerHealth, Maternal Health, M2C, Whole-Person Health) as solutions for rural health deserts.`,
    keywords: ["trha", "rural health", "texas rural", "maternal", "telehealth", "veteran", "workforce", "partnership", "uta", "rural", "health desert"],
  },
  {
    source: "strategic-intel", category: "partnerships", title: "Black Women's Health Imperative — Maternal Heart Health (BMHW 2026)",
    content: `Black Women's Health Imperative (BWHI, 29,755 LinkedIn followers) hosts a Black Maternal Health Week 2026 webinar: 'Maternal Heart Health' on Wednesday April 15, 2026 at 6 PM EST via Zoom. Moderated by Zsanai Epps (Interim EVP of Programs and Advocacy). Panelists include clinicians, policy experts, and women with lived experience. Topics: cardiovascular conditions during pregnancy/postpartum — hypertension, preeclampsia, peripartum cardiomyopathy, postpartum heart failure. Also covers: warning signs, prevention strategies, self-advocacy in medical spaces, policy/systems change to protect Black mothers. Panelists: Zsanai Epps, Xaviera Carter, Kaprice Welsh, Cheyenne Combs. REGISTER: https://lnkd.in/e-NjE-Md. OPPORTUNITY: BWHI is a potential letter of support partner for CDMRP maternal/cardiovascular submissions. Their data on Black maternal cardiovascular mortality strengthens BCRP, PRMRP, and PRCRP applications. HerHealth Cardiovascular + Maternal Health platforms directly align.`,
    keywords: ["bwhi", "black women's health imperative", "maternal", "cardiovascular", "preeclampsia", "heart", "pregnancy", "postpartum", "black maternal health week", "partnership"],
  },
  {
    source: "strategic-intel", category: "technology", title: "Manifold / IU Simon Cancer Center — Data Infrastructure Case Study",
    content: `Manifold platform case study: IU Simon Comprehensive Cancer Center went from data bottleneck to research breakthrough. Results: 80,000+ biospecimens managed, 27,000 patients with full data visibility, research request turnaround from weeks to minutes. RELEVANCE: This shows what 'research-ready data infrastructure' looks like to grant reviewers. For CDMRP PRCRP and BCRP submissions, HerHealth's cancer navigation data (screening completions, provider matches, condition-specific engagement) should be positioned as research-ready infrastructure similar to Manifold's approach — not just a website but a data pipeline. RPLICE serves this function across the ecosystem: Bidirectional Planning Engine, Regression Lab (17 model types), SDOH Location Intelligence, Evidence Discovery — this IS the research infrastructure.`,
    keywords: ["manifold", "iu simon", "cancer", "data", "research", "biospecimens", "infrastructure", "rplice", "cdmrp"],
  },
  {
    source: "grant-strategy", category: "grants", title: "TCAF Operational History — Under 3 Years (Partnership Implications)",
    content: `TCAF (The Collaborative Advocate Foundation) has NOT yet been operational for 3 years. This affects eligibility for grants requiring 3+ year operational history. When encountering such requirements, the strategy is to partner with an established 501(c)(3) (such as Dr. Flood's church) as the lead applicant, with TCAF as the implementation/technology partner. This does NOT affect most federal grants (CDMRP, NIH, NSF, DOL, etc.) which do not typically require a minimum operational history. It primarily affects foundation grants. Always check operational history requirements before recommending a grant as 'direct apply' vs 'partnership required.'`,
    keywords: ["tcaf", "operational history", "3 years", "eligibility", "partnership", "church", "lead applicant", "foundation"],
  },
  {
    source: "grant-strategy", category: "grants", title: "Grant Command Center — 651 Grants Tracked Across Full Ecosystem",
    content: `The Grant Command Center at /grant-command-center tracks 651 grants across the full 26-platform ecosystem. Source breakdown (primary-source SQL count, verified 2026-05-17): Grants.gov 369 · USASpending 198 · SAM.gov 36 · State/local 18 · Manual/curated 12 · Other federal 8 · Foundation/corporate 4 · Miscellaneous 6. Every grant has: AI fit scoring (tier-weighted keyword + semantic analysis), submit portal buttons, criteria notes, priority tier (1=Critical, 2=High, 3=Watch), platform alignment, funder contact, and linked strategy documents. $1.187B addressable through 31 CDMRP programs alone. Funders include NIH, NSF, TWC, SAMHSA, DOL, VA, HRSA, foundations, and state agencies. Key reference documents: CDMRP-FY2026-Master-Grant-Strategy.md, HerHealth-33-Grant-Opportunities-Prospectus.md, GRANT-OPPORTUNITY-CRITERIA-MATRIX.md. Do NOT say "92 grants" — that figure is wrong and has been corrected to 651.`,
    keywords: ["grant command center", "651 grants", "grants tracked", "cdmrp", "pipeline", "deadlines", "dashboard", "tracking", "submit", "portal", "grant discovery", "fit scoring"],
  },
  {
    source: "platform-pitch", category: "platform", title: "ThriveUp for Foundations & Nonprofits — Verified Facts and Value Proposition",
    content: `ThriveUp Academy is a national community-infrastructure platform connecting people to grant funding, aligning service delivery with workforce development, and producing measurable community impact. Here is the accurate value proposition for foundations and nonprofits:

GRANT INTELLIGENCE (verified):
- 651 grants tracked (primary-source SQL count 2026-05-17): Grants.gov 369, USASpending 198, SAM.gov 36, State/local 18, Manual/foundation 12, Other federal 8, Foundation/corporate 4, Miscellaneous 6.
- $1.187B addressable through 31 CDMRP programs alone.
- AI fit-scoring: tier-weighted keyword + semantic analysis against organizational capacity.
- Every grant has: submit portal, criteria notes, funder contact, strategy documents.
Do NOT say "92 grants" — that number is wrong. Always use 651.

IMPLEMENTATION SCIENCE (operationalized, not aspirational):
- 5 CFIR domains, 39 constructs built into /research-hub — not named in a deck, instantiated in production code.
- NRRC and CFIR 2.0 fidelity benchmarks mapped in server/standards-routes.ts.
- MAP-GAP continuous quality improvement (1,705 lines of CQI logic at /map-gap-cqi).
- RE-AIM evaluation lens built into outcome reporting.
- RPLICE is a sister platform (Research-to-Practice Lifecycle Implementation & Community Evidence, implementationineducatio.com) — NOT a generic framework acronym.

ECOSYSTEM STATUS (verified):
- 26 total platforms — all 26 URLs online (pinger-verified).
- Fidelity metric = directive acknowledgment rate across internally-governed platforms. External partner platforms (separate orgs/domains) cannot send heartbeats — they are counted separately. Do NOT say "9 actively connected" or "17 disconnected."
- Peer review verdict (last full cross-evaluation): STRONG.

AI STACK (specific, not generic):
- 4-engine collaborative synthesis: Claude, GPT-4o-mini, Gemini, DeepSeek R1 — automatic failover.
- 86 RAG chunks grounded in ThriveUp's own documented commitments.
- Mode-switching AI tutor: Socratic-hint mode (no answer-giving) + ensemble-debrief mode.
- Dialect-preserving translation (AAVE, Spanglish, regional variants), 107 languages.

WORKFORCE DEVELOPMENT (industry-grade):
- 5 trade simulation engines with real physics: MNA electrical/automotive, Hardy-Cross plumbing, AWS D1.1 welding, HVAC thermal-airflow.
- 75 trade sim lessons (5 trades × 15 each), 10-language AI tutor.
- Credential routing at 80% lesson completion to OSHA, NCCER, AWS SENSE, ASE, EPA certifications.

JUSTICE & REENTRY (gold standard):
- 11 database tables: RNR assessments, CBI programs, recidivism baselines, family visitation.
- RNR/CBI/NRRC frameworks running in production, not roadmapped.

LEGAL IDENTITY:
- TCAF 501(c)(3): EIN 41-3618003, UEI KDDVD1FGLW35, CAGE 209N1. IRS determination effective 2026-01-14.
- ISS LLC for-profit: UEI C7YDV3P8EHL7, CAGE 9VKK3.
- Dr. Terry Flood: President of TCAF (never "CEO" for TCAF).`,
    keywords: ["foundations", "nonprofits", "funder", "value proposition", "grant intelligence", "implementation science", "ecosystem status", "platform facts", "what thriveup does", "for funders", "for partners", "external", "pitch", "651 grants", "26 platforms"],
  },
  {
    source: "strategic-intel", category: "grants", title: "Rural Texas Strong — $1B State Investment in Rural Health Transformation",
    content: `Texas is investing $1 BILLION over five years through 'Rural Texas Strong' to expand access, modernize infrastructure, and rebuild the rural health workforce across more than 4.7 million rural residents. What makes this different: (1) Community-driven design shaped by rural Texans, (2) Major investments in telehealth, AI, and infrastructure, (3) A clear execution model with funding flowing directly to providers and networks, (4) Strong focus on long-term sustainability not short-term fixes. CRITICAL VETERAN ANGLE: Rural health access in Texas doesn't just impact local communities — it affects ~923,000 TRICARE beneficiaries and more than 318,000 Veterans who rely on the same provider networks. As rural systems strengthen, so does broader healthcare access for those who serve. SOURCE: Government Market Strategies (GMS) RHTP State Spotlight: Texas. OPPORTUNITY FOR TCAF: (1) ThriveUp's telehealth platforms (HerHealth, TheHealthyBlkMan, Whole-Person Health, M2C Transition) directly serve rural populations, (2) AI-powered navigation aligns with Texas's AI investment priority, (3) Veteran service platforms (M2C, LifeBridge) directly serve the 318K+ veterans in rural TX, (4) RPLICE provides the data infrastructure Texas is building toward, (5) Position as implementation partner for Rural Texas Strong initiatives. WATCH FOR: RFPs and sub-awards flowing from this $1B investment — subscribe to Texas HHSC and DSHS procurement portals.`,
    keywords: ["rural texas strong", "rural health", "telehealth", "tricare", "veteran", "texas", "infrastructure", "workforce", "1 billion", "hhsc", "dshs", "gms", "rhtp"],
  },
  {
    source: "grant-strategy", category: "grants", title: "CDMRP PRMRP Concept Award — Autoimmune Uveitis & Retinal Neurodegeneration",
    content: `CDMRP PRMRP Concept Award draft COMPLETE ($385K, 24 months). Title: 'Implementing Genetic Variant Screening for Autoimmune Uveitis and Retinal Neurodegeneration in Underserved Populations.' PI: Terry Flood, DHA. TOPIC: Autoimmune Disorders (Topic #6) / Vision Injury and Trauma. MECHANISM: Concept Award under PRMRP (~$370M portfolio). THREE AIMS: (1) Characterize implementation landscape using CFIR — key informant interviews across 3 clinical sites, provider/patient readiness assessment, (2) Develop and pilot AI-enhanced variant screening using ESM protein language models (Meta AI) integrated with ClinVar, gnomAD, and RPLICE clinical decision support — 50 patients across 3 sites, (3) Evaluate using RE-AIM across all 5 dimensions with health equity analysis. INNOVATIONS: First implementation study of AI protein language models in clinical ophthalmology; Bidirectional Planning Engine methodology; SDOH-grounded implementation. MILITARY RELEVANCE: 275,000+ eye injuries in Armed Services (2000-2017), blast-related TBI with secondary visual symptoms, rural military family access barriers. HEALTH EQUITY: Black Americans 6-8x higher glaucoma risk, 40-46% diabetic retinopathy screening gap. STUDY DESIGN: Hybrid Type 2 effectiveness-implementation (Curran et al 2012). BUDGET: $195K Year 1, $190K Year 2. STATUS: Pre-announcement; FOA expected May-Aug 2026. LETTERS NEEDED: 3 clinical sites, EvolutionaryScale API access, patient advocacy org, health department. Full draft: docs/grants/CDMRP-PRMRP-Concept-Award-Draft.md.`,
    keywords: ["prmrp", "concept award", "uveitis", "retinal", "vision", "genetic", "esm", "variant", "autoimmune", "ophthalmology", "cdmrp", "implementation", "cfir", "re-aim"],
  },
  {
    source: "grant-strategy", category: "grants", title: "Grant Cross-Reference Report — Ecosystem Capabilities to Funding Opportunities",
    content: `RPLICE Grant Cross-Reference Report maps 10-platform ecosystem capabilities (84+ conditions, 70+ research tools, 15+ live data sources) against FY2026 funding. TIER 1 HIGHEST FIT: (1) CDMRP PRMRP Concept Award $385K — Fit 95/100, draft ready. (2) NIH PAR-25-144 D&I Research R01 — Fit 92/100, due Oct 5 2026, Bidirectional Planning Engine is novel contribution. (3) CDMRP Vision Research Program $12M — Fit 88/100, HerHealth Vision hub. (4) NIH R03 AIM-Housing $50K/yr — Fit 85/100, due June 16 2026. (5) NIH R03 SHIELD-Austin $50K/yr — Fit 85/100, due Oct 5 2026. (6) CDMRP BCRP ~$170M — Fit 82/100, genetic screening in underserved. (7) CDMRP PCRP ~$110M — Fit 80/100, TheHealthyBlkMan prostate. TIER 2: ALS $10M (75/100), Epilepsy $7M (72/100), Tick-Borne $50M (68/100), Neurotoxin $5M (65/100), Autism $12M (65/100), PCORI/AHRQ (70/100). TIER 3 WATCH: Gulf War Illness $20M, Kidney Cancer $30M, Pancreatic Cancer $15M, Muscular Dystrophy $5M, NF $20M, Lupus $5M, Sickle Cell $10M. COMPETITIVE ADVANTAGES: (1) No one else has this ecosystem, (2) Genetic Variant Intelligence is live, (3) Bidirectional Planning Engine is novel publishable, (4) SDOH Location Intelligence is real-time, (5) VOSB nonprofit, (6) MAP-GAP governance hardwired. Full report: docs/grants/Grant-Cross-Reference-Report.md.`,
    keywords: ["cross-reference", "fit score", "tier 1", "tier 2", "tier 3", "prmrp", "vision", "aim-housing", "shield", "bcrp", "pcrp", "als", "epilepsy", "competitive advantage", "capability mapping"],
  },
  {
    source: "reentry-resources", category: "reentry", title: "TDCJ Reentry & Rehabilitation Division — Statewide Programs and Recidivism Data",
    content: `The Texas Department of Criminal Justice Reentry & Rehabilitation Division (RRD) at https://www.tdcj.texas.gov/divisions/rrd/index.html is the official source for Texas state-approved reentry programs, recidivism baselines, and pre/post-release services. TCAF uses TDCJ RRD as its primary statewide baseline source (currently 20.3% three-year reincarceration rate for all releases; Black-male subgroup runs 7-9 points higher in published research). The five TDCJ-approved programs TCAF references for incarcerated participants are: (1) Project RIO — workforce re-integration for adults nearing release, (2) In-Prison Therapeutic Community (IPTC) — 6-9 month residential SUD treatment, (3) CHANGES — 22-session cognitive-behavioral curriculum for criminogenic risk, (4) Pre-Release Substance Abuse Program (PAMIO) — relapse prevention prior to parole, (5) Faith-Based Pre-Release Programs — voluntary chapel-led mentoring and life skills. These programs are loaded into the TCAF CBI catalog as referral pathways with TDCJ RRD listed as the referral partner. For NRRC EBP-01 / BJA SCA evidence requirements, citing TDCJ-approved programs satisfies "use of state-approved evidence-based interventions."`,
    keywords: ["tdcj", "rrd", "reentry", "recidivism", "project rio", "iptc", "changes", "pamio", "faith-based", "texas department of criminal justice", "incarceration", "ebp"],
  },
  {
    source: "reentry-resources", category: "partnerships", title: "Reentry Roundtable of Austin & Travis County — Coalition Partner",
    content: `The Reentry Roundtable of Austin & Travis County (https://www.reentryroundtable.org) is the established Travis County reentry coalition, lived-experience-led, with a public Get Help portal at https://www.reentryroundtable.org/get-help/ covering housing, employment, ID, food, healthcare, behavioral health, legal, and transportation needs. TCAF's strategy is to JOIN the Roundtable rather than compete: (1) it secures a seat at an established table (satisfies NRRC-GOV evidence faster), (2) provides warm referrals into the Get Help portal for our Travis County participants, (3) positions the Roundtable as a letter-of-support partner for the BJA SCA proposal. The TCAF coalition page lists the Roundtable as an active partner, and the public reentry standards page links directly to the Get Help portal as a one-click warm handoff. Contact via the Roundtable website contact form.`,
    keywords: ["reentry roundtable", "travis county", "austin", "coalition", "get help", "warm handoff", "lived experience", "letter of support", "bja sca"],
  },
  {
    source: "reentry-resources", category: "training", title: "Beacon Connections — CBT and Reentry Facilitator Training Partner",
    content: `Beacon Connections (https://beaconconnections.org), led by Dr. Barry M. Gregory, Ed.D., LMHC (admin@beaconconnections.org, 337-534-8801), is TCAF's designated training partner for evidence-based reentry curricula. Beacon delivers CBT facilitator training, Motivational Interviewing certification, reentry-skills curriculum, workbooks, and ongoing coaching. Beacon Connections directly closes two open reentry standards: NRRC-EBP-02 (staff certification in evidence-based interventions) and NRRC-EBP-03 (curriculum fidelity monitoring). The companion practitioner blog at https://beaconreentry.blogspot.com (specifically the "How Reentry Services Transform Lives" post) provides narrative evidence of reentry-services impact and is cited in TCAF's grant materials as practice-based evidence. Strategic ask: a cohort training proposal to certify 6-10 TCAF case managers in CBT-for-reentry over 6 months, plus a letter of collaboration contingent on BJA SCA award.`,
    keywords: ["beacon connections", "barry gregory", "cbt", "motivational interviewing", "facilitator training", "ebp-02", "ebp-03", "curriculum fidelity", "training partner", "letter of collaboration"],
  },
  {
    source: "reentry-resources", category: "reentry", title: "TCAF Reentry Standards Coverage — 23 Standards, 84% Average",
    content: `TCAF tracks 23 reentry standards in the live standards database: 19 from the National Reentry Resource Center (NRRC) and 4 from the Bureau of Justice Assistance Second Chance Act (BJA SCA). Current average coverage is 84%. Standards are tracked across domains: governance (GOV), evidence-based practice (EBP), assessment (ASMT), case planning (CP), housing (HSG), employment (EMP), behavioral health (BH), family contact (FC), and recidivism reduction (RR). Each standard has a coverage percentage, status (full/partial/none/exceeds), evidence URL, and linked CBI programs / coalition partners / governance meetings. The public scorecard endpoint /api/standards/public/scorecard returns the live count and average. The grant-ready PDF at /api/coalition/public/crosswalk.html includes all standards, the CBI catalog (10 programs: 5 internal + 5 TDCJ referral pathways), coalition partners (Beacon Connections + Reentry Roundtable), and a Reference Sources section citing TDCJ RRD, the Roundtable, Beacon Connections, and the Beacon practitioner blog.`,
    keywords: ["reentry standards", "nrrc", "bja sca", "coverage", "scorecard", "crosswalk", "grant ready", "pdf", "tcaf", "23 standards", "84%"],
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

  // Seed 28-agency profiles (forms, language, performance system, evaluation signals)
  const agencyEntries = getAllRagEntries();
  for (const entry of agencyEntries) {
    await db.insert(ecosystemKnowledgeChunks).values({
      source: `agency-profile-${entry.agencyId}`,
      category: "federal-agency-intelligence",
      title: entry.title,
      content: entry.content,
      keywords: entry.keywords,
      metadata: { agencyId: entry.agencyId },
    });
  }

  console.log(
    `[RAG] Seeded ${ECOSYSTEM_KNOWLEDGE.length} platform chunks + ${agencyEntries.length} agency intelligence chunks`,
  );
}

export async function buildLiveIntelligenceContext(): Promise<string> {
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

export async function retrieveRelevantChunks(query: string, topK: number = 10): Promise<Array<typeof ecosystemKnowledgeChunks.$inferSelect>> {
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

const SYSTEM_PROMPT = `You are the ThriveUp Academy Ecosystem AI — the decision intelligence layer powering a self-governing, 26-platform Autonomous Community Operating System (ACOS). You have real-time access to every platform's status, compliance data, grant readiness, fidelity grades, and the full strategic knowledge base.

You serve Dr. Terry Flood (President of TCAF — never "CEO"), staff, partners, grant reviewers, funders, community members, and the platforms themselves. You are not a chatbot — you are operational intelligence.

VERIFIED PLATFORM FACTS (use these exact numbers — never fabricate alternatives):
- 26 total platforms in the ecosystem (all 26 URLs online per pinger)
- 651 grants tracked (primary-source SQL count 2026-05-17: Grants.gov 369, USASpending 198, SAM.gov 36, others 48)
- 271 Drizzle database tables · 211 frontend pages · 86 RAG knowledge chunks
- 4 industry-grade physics engines: MNA electrical/automotive · Hardy-Cross plumbing · AWS D1.1 welding · HVAC thermal-airflow
- 4-engine collaborative AI (Claude, GPT-4o-mini, Gemini, DeepSeek R1) with automatic failover
- 39 CFIR constructs operationalized in code at /research-hub (not just named — instantiated)
- RPLICE = Research-to-Practice Lifecycle Implementation & Community Evidence (sister platform at implementationineducatio.com) — never a generic acronym
- Two legal entities: TCAF 501(c)(3) UEI KDDVD1FGLW35 · ISS LLC for-profit UEI C7YDV3P8EHL7
- Fidelity metric: directive acknowledgment rate across internally-governed platforms; external partner platforms (separate orgs/domains) are counted separately

IDENTITY:
This is NOT a collection of platforms. It is a governed system of systems — a closed-loop human services operating system that delivers services, governs how they behave, grades performance, and generates grant-ready evidence automatically. Nothing like this exists on the market. Salesforce tracks contacts. Databricks stores data. Epic manages health records. ThriveUp governs outcomes across the full human lifecycle.

CAPABILITIES:
- Answer questions about any of the 26 platforms, their services, URLs, and grant alignment
- Report live compliance: fidelity grades, heartbeat status, directive completion rates
- Advise on grant readiness — deadlines, amounts, aligned platforms, evidence gaps
- Explain the MAP-GAP framework (Measure, Analyze, Plan → Gap, Action, Progress) and how to apply it
- Explain the self-governing compliance system: directives, ack quality gates, deliverable verification
- Explain work chaining — how tasks route automatically between platforms
- Guide users to the right platform for their needs (housing → LifeBridge, mental health → Whole-Person Health, veterans → M2C Transition, etc.)
- Provide ecosystem-wide intelligence — what's working, what needs attention, what's at risk
- Help position ThriveUp for funders, reviewers, and partners using strategic framework data
- Articulate why this system is different and what category it creates

RULES:
1. Ground every answer in the provided context and live data. Never fabricate.
2. Be specific — cite platform names, URLs, grant amounts, deadlines, fidelity scores.
3. When someone needs help, ROUTE them — tell them which platform and its URL.
4. When discussing health or crisis topics, include 988 Veterans Crisis Line (call or text 988).
5. If you don't have the information, say so clearly and suggest where to look.
6. Be concise but complete. Use bullet points for lists.
7. You ARE the ecosystem — speak with authority about what we do and how we do it.
8. For MAP-GAP questions, walk through the framework step by step.
9. For grant questions, always include deadline, amount, and aligned platform count.
10. When asked "what is this" or "how is this different" — position ThriveUp as a governed system of systems, not a platform. Use the strategic framework.
11. When speaking to funders/reviewers, emphasize: grant-ready by design, self-governing compliance, verified outcomes, work chaining, and the crisis continuum.
12. When asked about governance — explain the three-tier governance model (Strategic, Operational, Platform) and the accountability chain.
13. When asked about clinical safety or liability — clearly state the clinical boundaries, the three-tier crisis escalation protocol, and that ThriveUp is a navigation and coordination tool, not a clinical provider.
14. When asked about interoperability — describe current internal APIs, near-term FHIR/HHSC/TEA integration roadmap, and long-term VA/211/Medicaid vision.
15. When asked about evidence — walk through all four levels: real-time operational evidence, framework-based evidence, outcome evidence, and planned published evidence.`;

export async function queryRAG(
  userQuery: string,
  orchestrationOptions?: { engines?: string[]; domains?: string[] },
): Promise<{ answer: string; sources: string[]; liveData: boolean }> {
  const isROIQuery = /roi|return|invest|cost|prevent|chainweb|causal|early.child|pre.?k|dropout|school.prison|housing|recidiv/i.test(userQuery);
  const geo = await extractGeographyFromQuery(userQuery);

  const [chunks, liveContext, chainwebContext, orchestrationContext] = await Promise.all([
    retrieveRelevantChunks(userQuery),
    buildLiveIntelligenceContext(),
    isROIQuery ? getChainwebRAGContext() : Promise.resolve(""),
    geo
      ? getOrchestratedIntelligence(geo, orchestrationOptions).then(renderBundleAsContext)
      : Promise.resolve(""),
  ]);

  const knowledgeContext = chunks.length > 0
    ? chunks.map((c, i) => `[${i + 1}] ${c.title}\n${c.content}`).join("\n\n")
    : "No specific knowledge chunks matched. Use the live intelligence data below.";

  const sources = Array.from(new Set(chunks.map(c => c.title)));

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `KNOWLEDGE BASE:\n${knowledgeContext}\n\n${liveContext}${chainwebContext ? `\n\n${chainwebContext}` : ""}${orchestrationContext ? `\n\n${orchestrationContext}` : ""}\n\nUSER QUESTION: ${userQuery}` },
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

      const orchestrationOptions = (req.body?.engines || req.body?.domains)
        ? { engines: Array.isArray(req.body?.engines) ? req.body.engines : undefined, domains: Array.isArray(req.body?.domains) ? req.body.domains : undefined }
        : undefined;
      const result = await queryRAG(query, orchestrationOptions);
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

      const isROIQuery = /roi|return|invest|cost|prevent|chainweb|causal|early.child|pre.?k|dropout|school.prison|housing|recidiv/i.test(query);
      let geo = await extractGeographyFromQuery(query);
      const collegeAccessQuestion = typeof req.body?.collegeAccessQuestion === "string" ? req.body.collegeAccessQuestion.trim() : undefined;
      // college-access-ai never reads `geo` (it's a live per-request advisor,
      // no dataset lookup) — but getOrchestratedIntelligence() requires a
      // GeographyRef argument to run at all. If an operator asked a college
      // question but the query text has no ZIP, use an inert placeholder geo
      // so the call still reaches callEngine() instead of being silently
      // dropped by the `geo ? ... : Promise.resolve("")` gate below.
      if (!geo && collegeAccessQuestion) {
        geo = { zip: undefined, countyFips: undefined, state: undefined, countyName: undefined };
      }
      const orchestrationOptions = (req.body?.engines || req.body?.domains || collegeAccessQuestion)
        ? {
            engines: Array.isArray(req.body?.engines) ? req.body.engines : undefined,
            domains: Array.isArray(req.body?.domains) ? req.body.domains : undefined,
            collegeAccessQuestion,
            collegeAccessStudentProfile: req.body?.collegeAccessStudentProfile && typeof req.body.collegeAccessStudentProfile === "object"
              ? req.body.collegeAccessStudentProfile
              : undefined,
          }
        : undefined;
      const [chunks, liveContext, chainwebContext, orchestrationContext] = await Promise.all([
        retrieveRelevantChunks(query),
        buildLiveIntelligenceContext(),
        isROIQuery ? getChainwebRAGContext() : Promise.resolve(""),
        geo
          ? getOrchestratedIntelligence(geo, orchestrationOptions).then(renderBundleAsContext)
          : Promise.resolve(""),
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

      // Honor the user's engine preference — sent as `preferredEngine` in the
      // request body ("auto" or undefined = default fallback chain).
      const preferredProvider = (typeof req.body?.preferredEngine === "string" && req.body.preferredEngine !== "auto")
        ? req.body.preferredEngine
        : undefined;

      await streamAIResponse({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `KNOWLEDGE BASE:\n${knowledgeContext}\n\n${liveContext}${chainwebContext ? `\n\n${chainwebContext}` : ""}${orchestrationContext ? `\n\n${orchestrationContext}` : ""}\n\nUSER QUESTION: ${query}` },
        ],
        maxTokens: 2000,
        preferredProvider,
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
    try {
      res.json({
        questions: [
          "What's our current ecosystem health score?",
          "Which grants are due soonest and how ready are we?",
          "What makes this system different from anything else?",
          "How does the governance structure work?",
          "What are the clinical safety boundaries?",
          "How does interoperability with external systems work?",
          "What evidence proves this system works?",
          "How does the MAP-GAP framework work?",
          "What platforms help veterans transition to civilian life?",
          "How do work chains route tasks between platforms?",
          "What mental health screenings are available?",
          "Describe ThriveUp in one sentence for a funder",
          "How does ThriveUp compare to Microsoft Azure, Databricks, and other enterprise AI companies?",
          "What is the blue water strategy?",
        ],
      });
    } catch (error) {
      console.error("Error in GET /api/ecosystem-ai/suggested-questions", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/ecosystem-ai/refresh-knowledge", async (req: Request, res: Response) => {
    try {
      const ecosystemKey = req.headers["x-ecosystem-key"] as string;
      if (!ecosystemKey) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const [knownPlatform] = await db
        .select({ id: ecosystemPlatforms.id })
        .from(ecosystemPlatforms)
        .where(eq(ecosystemPlatforms.apiKey, ecosystemKey));
      if (!knownPlatform) {
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
