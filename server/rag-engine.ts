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
  {
    source: "strategic-framework", category: "strategy", title: "What ThriveUp Academy Actually Is — System of Systems",
    content: `ThriveUp Academy is NOT a collection of platforms. It is a governed system of systems — a self-governing, closed-loop human services operating system. Most organizations operate at the level of tools (apps, dashboards) or programs (coordinated services). ThriveUp has crossed into the third level: a feedback-driven environment that learns, adapts, and enforces behavior. The system doesn't just deliver services — it governs how services behave, improve, and prove impact. This is rare and unprecedented.`,
    keywords: ["what is", "different", "unique", "system of systems", "operating system", "why", "special", "describe", "explain"],
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
    content: `ThriveUp is not competing with Salesforce (CRM — tracks contacts, doesn't run services), Databricks (data lakehouse — stores data, doesn't deliver services), Epic/Cerner (health records — doesn't connect education, workforce, housing), or 211/United Way (referral directories — points to services, doesn't deliver and verify them). ThriveUp is building the infrastructure that those systems would eventually have to plug into. It's a new category: Autonomous Community Operating System (ACOS) — not SaaS, not a platform, an operating system for human outcomes.`,
    keywords: ["compare", "competitor", "salesforce", "databricks", "epic", "different", "market", "acos", "category", "versus", "better"],
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
    content: `Don't say: "We built 20 platforms." Say: "We built a self-governing system that ensures services are delivered, verified, and continuously improved across the full human lifecycle — from prevention to recovery." This is a governed system of systems. An Autonomous Community Operating System. It delivers services, monitors itself, grades its own performance, routes work automatically, and generates grant-ready evidence — all in one interconnected architecture. Combined reach: 170,000+ residents across Central Texas. 5 active grants worth up to $3.375M. 20 platforms covering education, workforce, health equity, veteran services, housing, safety, and crisis prevention.`,
    keywords: ["elevator pitch", "describe", "explain", "summary", "what we do", "pitch", "one sentence", "tell me about"],
  },
  {
    source: "governance", category: "governance", title: "Governance Framework — Who Governs the System",
    content: `ThriveUp Academy governance operates at three levels:
STRATEGIC GOVERNANCE (Board Level): Dr. Terry Flood, DHA serves as founder/CEO with executive authority over ecosystem direction, grant strategy, and platform standards. The Collaborative Advocate (VOSB) provides organizational anchoring. An Advisory Board of community leaders, subject matter experts, and institutional partners provides oversight.
OPERATIONAL GOVERNANCE (System Level): The ecosystem hub at thrivingcommunitiesforall.com serves as the central governing authority. It issues directives, grades compliance, verifies deliverables, and enforces quality standards across all 20 platforms. RPLICE (Better Science Lab) serves as the mandatory quality gate — all grants, documents, and submissions require RPLICE review before release.
PLATFORM GOVERNANCE (Platform Level): Each platform maintains operational autonomy within ecosystem standards. Platforms must: send heartbeats every 15 minutes, respond to directives with substantive evidence, maintain minimum fidelity grade of C to remain in good standing, and participate in MAP-GAP continuous improvement cycles.
ETHICAL AI GOVERNANCE: Dual-AI review ensures no single AI model controls content quality. AI companions (Spark for youth, Sparky for adults) operate within age-appropriate guardrails. All AI outputs are grounded in verified data through RAG — no hallucinated recommendations. Privacy-first: screening results and safety plans stay on the user's device, never stored server-side. FERPA, COPPA, and CIPA compliance for youth-facing platforms.
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
- Internal Ecosystem: 20 platforms communicate via heartbeat/directive API protocol with standardized event routing, work chaining, and compliance verification.
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
    source: "governance", category: "governance", title: "Evidence Strategy — Proving Impact to Skeptics",
    content: `ThriveUp's evidence strategy operates at four levels to satisfy any reviewer:
LEVEL 1 — REAL-TIME OPERATIONAL EVIDENCE (Available Now):
- Live fidelity grades for all 20 platforms (A through F) updated continuously
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

const SYSTEM_PROMPT = `You are the ThriveUp Academy Ecosystem AI — the decision intelligence layer powering a self-governing, 20-platform Autonomous Community Operating System (ACOS). You have real-time access to every platform's status, compliance data, grant readiness, fidelity grades, and the full strategic knowledge base.

You serve Dr. Terry Flood (founder/CEO), staff, partners, grant reviewers, funders, community members, and the platforms themselves. You are not a chatbot — you are operational intelligence.

IDENTITY:
This is NOT a collection of platforms. It is a governed system of systems — a closed-loop human services operating system that delivers services, governs how they behave, grades performance, and generates grant-ready evidence automatically. Nothing like this exists on the market. Salesforce tracks contacts. Databricks stores data. Epic manages health records. ThriveUp governs outcomes across the full human lifecycle.

CAPABILITIES:
- Answer questions about any of the 20 platforms, their services, URLs, and grant alignment
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
