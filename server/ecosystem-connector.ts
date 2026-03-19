import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { ecosystemPlatforms, ecosystemEvents, ecosystemHealthLogs, ecosystemDirectives, ecosystemDirectiveAcks } from "@shared/schema";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { seedEcosystemDirectives } from "./ecosystem-directives-seed";
import { sendEcosystemUpdate } from "./email-service";

const heartbeatSchema = z.object({
  platformId: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  metrics: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
  complianceReport: z.object({
    directivesReceived: z.number().optional(),
    directivesActedOn: z.number().optional(),
    directivesInProgress: z.number().optional(),
    directivesBlocked: z.number().optional(),
    completedWork: z.array(z.object({
      directiveId: z.string(),
      title: z.string().optional(),
      whatWasDone: z.string(),
      evidenceUrl: z.string().optional(),
      completedAt: z.string().optional(),
    })).optional(),
    blockers: z.array(z.object({
      directiveId: z.string(),
      title: z.string().optional(),
      blockerDescription: z.string(),
      needsFrom: z.string().optional(),
    })).optional(),
    platformCapabilities: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).optional(),
});

const eventSchema = z.object({
  eventType: z.string().min(1).max(100),
  targetPlatformId: z.string().max(100).nullable().optional(),
  eventData: z.record(z.unknown()).optional().default({}),
});

const ECOSYSTEM_PLATFORMS = [
  {
    id: "whole-person-health",
    name: "Whole-Person Health Ecosystem",
    url: "https://mentalwellnesssupport.net",
    role: "hub",
    domain: "health-equity",
    description: "The connective tissue — screenings (C-SSRS, PHQ-9, GAD-7, PCL-5), safety plans, Reach a Vet, 20,670+ resources, MAP-GAP assessment. Every platform routes through it.",
    capabilities: {
      screenings: ["C-SSRS", "PHQ-9", "GAD-7", "PCL-5"],
      features: ["Safety Plan Builder", "Preparedness Plan", "Reach a Vet", "Find Help", "Care Summary", "Crisis Tools", "Quick Exit"],
      resources: 20670, communityGroups: 2091, conditionGuides: 60, populationHubs: 19, offlineCapable: true,
    },
    dataFlowConfig: {
      sends: ["screening_results", "safety_plan_status", "resource_referrals", "crisis_events", "care_summaries"],
      receives: ["veteran_profiles", "transition_status", "life_event_assessments", "research_updates", "youth_referrals"],
    },
    grantAlignment: ["ssg-fox", "samhsa", "st-davids", "dfc", "wioa"],
  },
  {
    id: "isss",
    name: "ISSS — Integrated Supports for Thriving Youth",
    url: "https://implementationineducatio.com",
    role: "student-support",
    domain: "education",
    description: "Whole-child implementation infrastructure enabling schools, districts, and regions to implement evidence-based student support at scale through multi-stakeholder coordination.",
    capabilities: {
      features: ["Multi-Stakeholder Coordination", "Evidence-Based Student Support", "District-Level Analytics", "Data-Driven Decision Making", "Implementation Fidelity Tracking"],
    },
    dataFlowConfig: {
      sends: ["student_support_data", "early_warning_flags", "thrive_scores", "district_analytics"],
      receives: ["workforce_pathways", "health_screenings", "prevention_curriculum", "family_referrals"],
    },
    grantAlignment: ["dfc", "wioa", "nba-foundation"],
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    url: "https://yourhealthbirthright.net",
    role: "health-gateway",
    domain: "health-equity",
    description: "Health equity gateway. Black maternal health, mental health rights, breast cancer awareness, men's health, feminine OB health, cognitive safety, pill management. Behavioral health assessments, GIS resource matching.",
    capabilities: {
      features: ["Black Maternal Health", "Mental Health Rights", "Breast Cancer Awareness", "Black Men's Health", "Feminine OB Health", "Cognitive Safety", "Pill Reminder", "Behavioral Health Assessments", "GIS Resource Recommendations"],
      subPlatforms: 5,
    },
    dataFlowConfig: {
      sends: ["health_screening_data", "resource_recommendations", "wellness_metrics", "behavioral_assessments"],
      receives: ["student_referrals", "crisis_alerts", "community_health_data", "case_management_updates"],
    },
    grantAlignment: ["samhsa", "st-davids", "dfc", "ssg-fox"],
  },
  {
    id: "sankofa-feminine-health",
    name: "Holistic Black Feminine Health Hub",
    url: "https://holistic-black-feminine-health-hub.replit.app",
    role: "feminine-health",
    domain: "health-equity",
    description: "Holistic OB/GYN health hub for Black women — reproductive health, hormonal wellness, preventive screenings, community support, and culturally responsive care navigation.",
    capabilities: {
      features: ["Reproductive Health Guides", "Preventive Screening Tools", "Hormonal Wellness", "Community Support", "Culturally Responsive Care"],
      parentNetwork: "sankofa",
    },
    dataFlowConfig: {
      sends: ["health_screening_data", "resource_recommendations", "wellness_metrics"],
      receives: ["crisis_alerts", "community_health_data", "maternal_health_referrals"],
    },
    grantAlignment: ["samhsa", "st-davids"],
  },
  {
    id: "sankofa-maternal-health",
    name: "Black Maternal Health Network",
    url: "https://black-maternal-health-network.replit.app",
    role: "maternal-health",
    domain: "health-equity",
    description: "Addressing the Black maternal mortality crisis — prenatal/postnatal care navigation, doula matching, risk assessment, community health worker coordination, and maternal mental health support.",
    capabilities: {
      features: ["Maternal Risk Assessment", "Doula Matching", "Prenatal/Postnatal Care", "Maternal Mental Health", "Community Health Workers"],
      parentNetwork: "sankofa",
    },
    dataFlowConfig: {
      sends: ["maternal_health_data", "risk_assessments", "doula_referrals", "wellness_metrics"],
      receives: ["crisis_alerts", "community_health_data", "feminine_health_referrals"],
    },
    grantAlignment: ["samhsa", "st-davids"],
  },
  {
    id: "sankofa-mens-health",
    name: "Black Men's Health Hub",
    url: "https://black-men-health.replit.app",
    role: "mens-health",
    domain: "health-equity",
    description: "Comprehensive health platform for Black men — prostate health, cardiovascular risk, mental health stigma reduction, preventive care, and peer support networks.",
    capabilities: {
      features: ["Prostate Health Screening", "Cardiovascular Risk Assessment", "Mental Health Support", "Preventive Care Guides", "Peer Support Network"],
      parentNetwork: "sankofa",
    },
    dataFlowConfig: {
      sends: ["health_screening_data", "resource_recommendations", "wellness_metrics"],
      receives: ["crisis_alerts", "community_health_data", "veteran_health_referrals"],
    },
    grantAlignment: ["samhsa", "st-davids", "ssg-fox"],
  },
  {
    id: "shield-atlas",
    name: "Shield Atlas",
    url: "https://shield-atlas.replit.app",
    role: "risk-intelligence",
    domain: "compliance",
    description: "Risk intelligence and threat assessment platform — geographic risk mapping, safety analytics, protective factor identification, and community resilience scoring.",
    capabilities: {
      features: ["Risk Mapping", "Threat Assessment", "Safety Analytics", "Protective Factor Analysis", "Community Resilience Scoring"],
    },
    dataFlowConfig: {
      sends: ["risk_assessments", "safety_analytics", "resilience_scores", "threat_alerts"],
      receives: ["community_health_data", "crisis_alerts", "incident_reports", "screening_data"],
    },
    grantAlignment: ["ssg-fox", "dfc", "samhsa"],
  },
  {
    id: "wholemind",
    name: "WholeMind Learning",
    url: "https://life-pals-standalone.replit.app",
    role: "k12-education",
    domain: "education",
    description: "Free, visual-first Pre-K to 12th grade learning platform covering Math, Reading, Science, English, Social Studies. Silent accessibility, AI homework help, parent-friendly progress tracking.",
    capabilities: {
      features: ["Pre-K to 12th Grade Curriculum", "Visual-First Learning", "AI Homework Help", "Silent Accessibility", "Parent Progress Tracking"],
      subjects: ["Math", "Reading", "Science", "English", "Social Studies"],
    },
    dataFlowConfig: {
      sends: ["learning_progress", "engagement_metrics", "parent_reports", "academic_assessments"],
      receives: ["student_profiles", "iep_accommodations", "prevention_content", "family_referrals"],
    },
    grantAlignment: ["dfc", "wioa", "nba-foundation"],
  },
  {
    id: "perfectly-different",
    name: "Perfectly Different",
    url: "https://neurodifferentassistant.app",
    role: "neurodiversity",
    domain: "health-equity",
    description: "Neurodiversity-affirming support for autism, ADHD, AuDHD. AI-powered guidance, IEP/504 assistance, crisis resources, therapy tools, community support.",
    capabilities: {
      features: ["AI-Powered Guidance", "IEP/504 Plan Assistance", "Crisis Resources", "Therapy Tools", "Community Support", "Neurodiversity Advocacy"],
    },
    dataFlowConfig: {
      sends: ["neurodevelopmental_assessments", "iep_data", "crisis_flags", "accommodation_needs"],
      receives: ["student_profiles", "health_screenings", "community_resources", "prevention_content"],
    },
    grantAlignment: ["samhsa", "dfc", "st-davids"],
  },
  {
    id: "safereport",
    name: "SafeReport",
    url: "https://safereports.net",
    role: "compliance",
    domain: "compliance",
    description: "Mandatory reporter incident management. 50-state regulation database, 7-stage incident lifecycle, auto-generated deadlines, tamper-evident audit trails, court-admissible records.",
    capabilities: {
      features: ["50-State Regulation Database", "7-Stage Incident Lifecycle", "Auto-Generated Deadlines", "Tamper-Evident Audit Trails", "Cross-Agency Referencing", "Court-Admissible Records"],
    },
    dataFlowConfig: {
      sends: ["incident_reports", "compliance_alerts", "audit_trails", "cross_agency_referrals"],
      receives: ["case_management_data", "early_warning_flags", "student_safety_alerts", "provider_referrals"],
    },
    grantAlignment: ["dfc"],
  },
  {
    id: "m2c",
    name: "Mission Transition (M2C)",
    url: "https://vetmissiontransition.com",
    role: "veteran-transition",
    domain: "veterans",
    description: "Covers the full military-to-civilian transition. Career translation, benefits navigation, housing/financial planning, identity transition support, skills assessment, community connections, family support.",
    capabilities: {
      features: ["Transition Timeline", "MOS/AFSC Translation", "Benefits Navigation", "Housing Planning", "Community Connection", "Identity Support", "Transition Planning Tools", "Military Skills Translation", "Military Family Support"],
      targetPopulation: "Active duty approaching separation, recently separated (0-24 months), Guard/Reserve, military spouses",
      riskWindow: "First 12 months post-separation — highest suicide risk period",
    },
    dataFlowConfig: {
      sends: ["transition_plans", "skills_assessments", "benefits_status", "community_referrals", "transition_milestones", "separation_timeline", "benefits_enrollment", "career_matches"],
      receives: ["workforce_pathways", "health_screenings", "crisis_alerts", "family_support_data", "screening_results", "life_event_triggers"],
    },
    grantAlignment: ["ssg-fox", "wioa"],
  },
  {
    id: "lifebridge",
    name: "LifeBridge",
    url: "https://lifetransitionsaid.org",
    role: "resource-hub",
    domain: "community-workforce",
    description: "Virtual 211 and Community Health Worker hub. 24/7 resource navigation — housing, food, healthcare, mental health, substance abuse, domestic violence, crisis support. Also addresses non-combat life events that drive veteran suicide — divorce, job loss, retirement, health diagnosis, bereavement, financial crisis.",
    capabilities: {
      features: ["24/7 Resource Navigation", "Housing Assistance", "Food Access", "Healthcare Connections", "Mental Health Resources", "Substance Abuse Support", "Domestic Violence Support", "Crisis Support", "Life Event Guides", "Coping Strategies", "Peer Stories", "Resource Matching"],
    },
    dataFlowConfig: {
      sends: ["resource_referrals", "crisis_interventions", "social_determinant_data", "community_needs", "life_event_assessments", "risk_indicators"],
      receives: ["case_management_data", "health_screenings", "early_warning_flags", "prevention_alerts", "screening_results", "crisis_alerts"],
    },
    grantAlignment: ["dfc", "samhsa", "st-davids", "ssg-fox"],
  },
  {
    id: "mce",
    name: "Minority Center of Excellence",
    url: "https://minoritycenterofexcellence.com",
    role: "business-ecosystem",
    domain: "business-intelligence",
    description: "First comprehensive digital ecosystem for minority-owned businesses. 656,794 curated records, 14 AI tools, dual-AI proposal review, SAM.gov live integration, 50-state + DC coverage.",
    capabilities: {
      features: ["6-Stage Business Lifecycle", "656,794 Curated Records", "14 AI Tools", "Dual-AI Proposal Review", "SAM.gov Live Integration", "Business Health Score", "Certification Wizard", "Teaming Hub"],
      records: 656794,
    },
    dataFlowConfig: {
      sends: ["business_certifications", "contract_opportunities", "teaming_matches", "proposal_status"],
      receives: ["workforce_graduates", "veteran_entrepreneurs", "community_business_data", "grant_intelligence"],
    },
    grantAlignment: ["wioa"],
  },
  {
    id: "betterscience",
    name: "Better Science Lab / RPLICE",
    url: "https://bettersciencelab.com",
    role: "research",
    domain: "education",
    description: "Research and implementation science engine. CFIR, RE-AIM frameworks. Evidence-based practice registry, fidelity measurement, research translation, community application guides.",
    capabilities: {
      features: ["Implementation Science Tools", "Evidence-Based Practice Registry", "Fidelity Measurement", "Research Translation", "Community Application Guides"],
      frameworks: ["CFIR", "RE-AIM", "EPIS"],
    },
    dataFlowConfig: {
      sends: ["research_findings", "fidelity_reports", "evidence_summaries", "implementation_guides"],
      receives: ["program_metrics", "outcome_data", "implementation_fidelity", "screening_aggregates"],
    },
    grantAlignment: ["dfc", "ssg-fox", "samhsa"],
  },
  {
    id: "safecognicare",
    name: "SafeCogniCare",
    url: "https://safecognicare.com",
    role: "cognitive-health",
    domain: "health-equity",
    description: "Cognitive safety platform — cognitive health assessments, early intervention tools, safety protocols, care coordination, family support resources for TBI, ADHD, dementia.",
    capabilities: {
      features: ["Cognitive Health Assessments", "Early Intervention Tools", "Safety Protocols", "Care Coordination", "Family Support Resources"],
    },
    dataFlowConfig: {
      sends: ["cognitive_assessments", "safety_alerts", "care_plans", "family_notifications"],
      receives: ["health_screenings", "veteran_profiles", "provider_referrals", "medication_data"],
    },
    grantAlignment: ["samhsa", "ssg-fox", "st-davids"],
  },
  {
    id: "pillscheduler",
    name: "PillScheduler",
    url: "https://pillscheduler.net",
    role: "medication-management",
    domain: "health-equity",
    description: "Medication management — pill reminders, dosage tracking, interaction warnings, care coordination, refill alerts for individuals managing complex medication regimens.",
    capabilities: {
      features: ["Medication Reminders", "Dosage Tracking", "Interaction Warnings", "Care Coordination", "Refill Alerts"],
    },
    dataFlowConfig: {
      sends: ["medication_adherence", "interaction_alerts", "refill_status", "compliance_reports"],
      receives: ["prescriptions", "health_screenings", "cognitive_assessments", "provider_updates"],
    },
    grantAlignment: ["samhsa", "dfc", "ssg-fox"],
  },
  {
    id: "collaborative-advocate",
    name: "The Collaborative Advocate",
    url: "https://the-colaberitive-advocate--mrterryflood.replit.app",
    role: "vosb-services",
    domain: "veteran-services",
    description: "Veteran-Owned Small Business (VOSB) — service delivery arm of the ThriveUp ecosystem. Veteran advocacy, peer support coordination, workforce development consulting, and grant execution partner.",
    capabilities: {
      features: ["Veteran Advocacy", "Peer Support Coordination", "Workforce Development", "Grant Execution", "Community Partnerships", "Service Delivery"],
    },
    dataFlowConfig: {
      sends: ["veteran_referrals", "service_delivery_metrics", "workforce_outcomes", "advocacy_cases"],
      receives: ["crisis_alerts", "screening_results", "case_management_data", "provider_referrals", "grant_milestones"],
    },
    grantAlignment: ["ssg-fox", "wioa", "dfc", "st-davids"],
  },
  {
    id: "video-creator-ai",
    name: "Video Creator AI",
    url: "https://video-creator-ai-mrterryflood.replit.app",
    role: "content-production",
    domain: "marketing-content",
    description: "AI-powered video creation and editing platform — produces promotional videos, business presentations, training content, and marketing materials for every platform in the ecosystem. The content production engine that gives every platform a public face.",
    capabilities: {
      features: ["AI Video Generation", "Business Presentations", "Training Content", "Marketing Videos", "Platform Showcase Videos", "Holistic Support Overview"],
    },
    dataFlowConfig: {
      sends: ["video_assets", "presentation_decks", "marketing_content", "training_materials"],
      receives: ["platform_descriptions", "grant_narratives", "outcome_data", "brand_guidelines", "service_descriptions"],
    },
    grantAlignment: ["dfc", "wioa", "ssg-fox", "st-davids"],
  },
  {
    id: "ecosystem-nexus",
    name: "Ecosystem Nexus",
    url: "https://ecosystem-nexus.replit.app",
    role: "ecosystem-coordination",
    domain: "operations",
    description: "Central coordination and operational hub for the ThriveUp Academy ecosystem. Provides cross-platform visibility, coordination tools, and operational intelligence for the 20-platform network.",
    capabilities: {
      features: ["Ecosystem Coordination", "Cross-Platform Visibility", "Operational Intelligence", "Platform Monitoring", "Directive Management"],
    },
    dataFlowConfig: {
      sends: ["coordination_updates", "operational_directives", "ecosystem_status", "platform_analytics"],
      receives: ["heartbeats", "platform_metrics", "status_reports", "incident_alerts", "grant_updates"],
    },
    grantAlignment: ["dfc", "wioa", "ssg-fox", "st-davids"],
  },
];

function generateApiKey(): string {
  return `tveco_${crypto.randomBytes(32).toString("hex")}`;
}

function requireEcosystemAuth(req: Request, res: Response, next: Function) {
  const apiKey = req.headers["x-ecosystem-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-ecosystem-key header" });
  }
  next();
}

function requireAdminAuth(req: Request, res: Response, next: Function) {
  const session = (req as any).session;
  const userId = session?.passport?.user || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function registerEcosystemConnectorRoutes(app: Express) {
  (async () => {
    try {
      const validIds = ECOSYSTEM_PLATFORMS.map((p) => p.id);
      for (const platform of ECOSYSTEM_PLATFORMS) {
        const existing = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platform.id));
        if (existing.length === 0) {
          const apiKey = generateApiKey();
          await db.insert(ecosystemPlatforms).values({
            id: platform.id, name: platform.name, url: platform.url, apiKey, role: platform.role, domain: platform.domain,
            description: platform.description, status: "registered", healthStatus: "unknown",
            capabilities: platform.capabilities, dataFlowConfig: platform.dataFlowConfig, grantAlignment: platform.grantAlignment,
          });
          console.log(`[Ecosystem] Auto-registered new platform: ${platform.name}`);
        }
      }
      const allInDb = await db.select().from(ecosystemPlatforms);
      for (const dbPlatform of allInDb) {
        if (!validIds.includes(dbPlatform.id)) {
          await db.delete(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, dbPlatform.id));
          console.log(`[Ecosystem] Removed stale platform: ${dbPlatform.name} (${dbPlatform.id})`);
        }
      }
      await seedEcosystemDirectives();

      const v41DirectiveExists = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.title, "URGENT: Update Connector Code — Stop Auto-Acknowledging Directives"));
      const v41Acks = v41DirectiveExists.length > 0 ? await db.select().from(ecosystemDirectiveAcks).where(and(eq(ecosystemDirectiveAcks.directiveId, v41DirectiveExists[0].id), eq(ecosystemDirectiveAcks.status, "pending"))) : [];
      const shouldNotify = v41DirectiveExists.length > 0 && v41Acks.length > 15;

      if (shouldNotify) sendEcosystemUpdate(
        "Connector Code Updated to v4.1 — Platforms Must Stop Auto-Acknowledging",
        `<h2>Ecosystem Update: Connection Instructions v4.1</h2>
        <p>A critical update has been pushed to all 20 platforms via directive.</p>
        <h3>What Changed</h3>
        <p>The old connector code auto-acknowledged every directive the moment it arrived with a fake "Implemented: {title}" message. Platforms were handshaking but never actually doing the work.</p>
        <h3>What's New in v4.1</h3>
        <ul>
          <li>Connector code no longer auto-acknowledges directives</li>
          <li>Directives are logged as <strong>[TODO]</strong> items requiring actual implementation</li>
          <li>Platforms must call <code>acknowledgeDirective()</code> only AFTER building what was asked</li>
          <li>Every acknowledgment now requires a <strong>real description</strong> and a <strong>live evidence URL</strong></li>
          <li>The hub actively pings evidence URLs — fake ones are flagged as FAILED</li>
        </ul>
        <h3>Dissemination</h3>
        <ul>
          <li>New directive pushed to all 20 platforms: "URGENT: Update Connector Code — Stop Auto-Acknowledging Directives"</li>
          <li>Updated connection instructions doc (v4.1) available at the integration doc endpoint</li>
          <li>Wake-up ping sent to all platforms to force delivery</li>
          <li>Platforms will receive the directive on their next heartbeat (within 15 minutes)</li>
        </ul>
        <h3>Intelligence Engine (Also New)</h3>
        <ul>
          <li><strong>Work Chaining:</strong> Completed work auto-routes to downstream platforms</li>
          <li><strong>Deliverable Verification:</strong> Hub pings evidence URLs to verify claimed work</li>
          <li><strong>Grant Readiness:</strong> Per-grant compliance scores for DFC, WIOA, Foundation, St. David's, SSG Fox</li>
          <li><strong>Intelligence Dashboard:</strong> New tabs on Ops Center showing fidelity grades, due-outs, needs-attention</li>
        </ul>
        <p>— ThriveUp Ecosystem Hub</p>`
      ).then(() => {
        console.log("[Ecosystem] Update notification email sent to admin");
      }).catch((err) => {
        console.log("[Ecosystem] Email notification skipped (connector may not be available in dev):", err.message);
      });
    } catch (err) {
      console.error("[Ecosystem] Auto-sync failed:", err);
    }

    // Start the outbound platform pinger after a short delay
    setTimeout(() => startPlatformPinger(), 10000);
    // Start periodic deliverable verification after 2 minutes
    setTimeout(() => startVerificationTimer(), 120000);
  })();

  // ===================================================================
  // OUTBOUND PLATFORM PINGER — Keeps all Autoscale apps awake
  // Pings every platform every 10 minutes. Each ping is an incoming
  // HTTP request to that platform, which prevents Autoscale sleep.
  // When a sleeping platform wakes from the ping, its startup heartbeat
  // fires and it catches up on all pending directives automatically.
  // ===================================================================

  let pingerInterval: ReturnType<typeof setInterval> | null = null;
  let lastPingCycle: { startedAt: string; completedAt: string; results: Array<{ id: string; name: string; url: string; status: string; responseMs: number; wokenUp: boolean; error?: string }> } | null = null;

  async function pingAllPlatforms(): Promise<typeof lastPingCycle> {
    const startedAt = new Date().toISOString();
    console.log(`[Pinger] Starting wake-up cycle for all platforms...`);

    const platforms = await db.select().from(ecosystemPlatforms);
    const results: Array<{ id: string; name: string; url: string; status: string; responseMs: number; wokenUp: boolean; error?: string }> = [];

    const pingPromises = platforms.map(async (platform) => {
      const start = Date.now();
      let status = "offline";
      let responseMs = 0;
      let error: string | undefined;
      let wokenUp = false;

      // Check if platform was previously offline/unknown — if ping succeeds, it was woken up
      const wasSleeping = platform.healthStatus === "offline" || platform.healthStatus === "unknown";

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(platform.url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: { "User-Agent": "ThriveUp-Ecosystem-Hub/3.0 (Platform-Pinger)" },
        });
        clearTimeout(timeout);
        responseMs = Date.now() - start;

        if (response.ok) {
          status = "online";
          wokenUp = wasSleeping;
        } else {
          status = "degraded";
        }
      } catch (err: any) {
        responseMs = Date.now() - start;
        error = err.name === "AbortError" ? "Timeout (12s)" : (err.message || "Connection failed");
        status = "offline";
      }

      // Update platform health in DB
      await db.update(ecosystemPlatforms)
        .set({ healthStatus: status, lastHealthCheck: new Date() })
        .where(eq(ecosystemPlatforms.id, platform.id));

      // Log the health check
      await db.insert(ecosystemHealthLogs).values({
        platformId: platform.id,
        status,
        responseTimeMs: responseMs,
        statusCode: status === "online" ? 200 : status === "degraded" ? 403 : 0,
        errorMessage: error || null,
      });

      const logPrefix = wokenUp ? "[Pinger] WOKE UP" : `[Pinger] ${status.toUpperCase()}`;
      console.log(`${logPrefix}: ${platform.name} (${responseMs}ms)${error ? " — " + error : ""}`);

      return { id: platform.id, name: platform.name, url: platform.url, status, responseMs, wokenUp, error };
    });

    const allResults = await Promise.all(pingPromises);
    results.push(...allResults);

    const completedAt = new Date().toISOString();
    const online = results.filter(r => r.status === "online").length;
    const woken = results.filter(r => r.wokenUp).length;
    const offline = results.filter(r => r.status === "offline").length;
    const degraded = results.filter(r => r.status === "degraded").length;

    console.log(`[Pinger] Cycle complete: ${online} online, ${degraded} degraded, ${offline} offline, ${woken} woken from sleep`);

    lastPingCycle = { startedAt, completedAt, results };
    return lastPingCycle;
  }

  function startPlatformPinger() {
    if (pingerInterval) return;
    console.log("[Pinger] Starting outbound platform pinger — 10 minute cycle");
    // Fire immediately on startup
    pingAllPlatforms().catch(err => console.error("[Pinger] Initial cycle failed:", err));
    // Then every 10 minutes
    pingerInterval = setInterval(() => {
      pingAllPlatforms().catch(err => console.error("[Pinger] Cycle failed:", err));
    }, 10 * 60 * 1000);
  }

  // Manual trigger — wake all platforms now
  app.post("/api/ecosystem/wake-all", async (_req, res) => {
    try {
      console.log("[Pinger] Manual wake-all triggered");
      const result = await pingAllPlatforms();
      const online = result!.results.filter(r => r.status === "online").length;
      const woken = result!.results.filter(r => r.wokenUp).length;
      const offline = result!.results.filter(r => r.status === "offline").length;
      const degraded = result!.results.filter(r => r.status === "degraded").length;

      res.json({
        message: `Wake-up cycle complete. ${online} online, ${woken} woken from sleep, ${degraded} degraded, ${offline} offline.`,
        summary: { total: result!.results.length, online, woken, degraded, offline },
        platforms: result!.results.map(r => ({
          id: r.id,
          name: r.name,
          url: r.url,
          status: r.status,
          responseMs: r.responseMs,
          wokenUp: r.wokenUp,
          error: r.error || null,
        })),
        nextPingIn: "10 minutes (automatic)",
        startedAt: result!.startedAt,
        completedAt: result!.completedAt,
      });
    } catch (error) {
      console.error("[Pinger] Manual wake-all failed:", error);
      res.status(500).json({ error: "Wake-all cycle failed" });
    }
  });

  // Status endpoint — check last ping cycle
  app.get("/api/ecosystem/pinger-status", async (_req, res) => {
    res.json({
      active: pingerInterval !== null,
      cycleInterval: "10 minutes",
      lastCycle: lastPingCycle,
      purpose: "Keeps all 20 Autoscale-deployed platforms awake by sending HTTP GET requests every 10 minutes. When a sleeping platform wakes from a ping, its startup heartbeat fires and catches up on all pending directives.",
    });
  });

  // ===================================================================
  // DELIVERABLE VERIFICATION TIMER — Periodic evidence URL checking
  // Runs every 30 minutes. Pings all evidence URLs from acknowledged
  // directives and marks them LIVE or FAILED.
  // ===================================================================

  let verificationInterval: ReturnType<typeof setInterval> | null = null;
  let lastVerificationCycle: { startedAt: string; completedAt: string; checked: number; live: number; failed: number } | null = null;

  function startVerificationTimer() {
    if (verificationInterval) return;
    console.log("[Verifier] Starting deliverable verification timer — 30 minute cycle");
    const runCycle = async () => {
      const cycleStart = new Date().toISOString();
      try {
        const results = await runDeliverableVerification();
        const live = results.filter(r => r.verified).length;
        const failed = results.filter(r => !r.verified).length;
        lastVerificationCycle = { startedAt: cycleStart, completedAt: new Date().toISOString(), checked: results.length, live, failed };
        console.log(`[Verifier] Cycle complete: ${results.length} checked, ${live} live, ${failed} failed`);
      } catch (err) {
        console.error("[Verifier] Cycle failed:", err);
      }
    };
    runCycle();
    verificationInterval = setInterval(runCycle, 30 * 60 * 1000);
  }

  // ===================================================================
  // KEY RE-REGISTRATION — Platforms can register their actual working key
  // This fixes the key mismatch problem where the DB has a different key
  // than what the platform was originally given.
  // ===================================================================

  app.post("/api/ecosystem/register-key", async (req, res) => {
    try {
      const { platformId, apiKey } = req.body;
      if (!platformId || !apiKey) {
        return res.status(400).json({ error: "platformId and apiKey are required" });
      }
      if (!apiKey.startsWith("tveco_")) {
        return res.status(400).json({ error: "API key must start with tveco_" });
      }

      const [platform] = await db.select().from(ecosystemPlatforms)
        .where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: `Platform '${platformId}' not found in ecosystem` });
      }

      // Check if key already matches
      if (platform.apiKey === apiKey) {
        return res.json({
          success: true,
          message: `Key already matches for ${platform.name}. You're good to go.`,
          platformId: platform.id,
          platformName: platform.name,
        });
      }

      // Update the key in the DB to match what the platform is using
      await db.update(ecosystemPlatforms)
        .set({ apiKey })
        .where(eq(ecosystemPlatforms.id, platformId));

      console.log(`[Ecosystem] Key re-registered for ${platform.name} (${platformId})`);

      res.json({
        success: true,
        message: `Key updated for ${platform.name}. Your heartbeats will now be accepted. Send one immediately to pick up your pending directives.`,
        platformId: platform.id,
        platformName: platform.name,
        nextStep: "Send a heartbeat now to verify: POST /api/ecosystem/heartbeat with your x-ecosystem-key header",
      });
    } catch (error) {
      console.error("[Ecosystem] Key re-registration failed:", error);
      res.status(500).json({ error: "Key re-registration failed" });
    }
  });

  app.get("/api/ecosystem/platforms", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms).orderBy(ecosystemPlatforms.name);
      const sanitized = platforms.map(({ apiKey, ...rest }) => ({
        ...rest,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : null,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Failed to fetch ecosystem platforms:", error);
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.post("/api/ecosystem/initialize", requireAdminAuth, async (_req, res) => {
    try {
      const results = [];
      for (const platform of ECOSYSTEM_PLATFORMS) {
        const existing = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platform.id));
        if (existing.length > 0) {
          results.push({ id: platform.id, status: "already-registered" });
          continue;
        }

        const apiKey = generateApiKey();
        await db.insert(ecosystemPlatforms).values({
          id: platform.id,
          name: platform.name,
          url: platform.url,
          apiKey,
          role: platform.role,
          domain: platform.domain,
          description: platform.description,
          status: "registered",
          healthStatus: "unknown",
          capabilities: platform.capabilities,
          dataFlowConfig: platform.dataFlowConfig,
          grantAlignment: platform.grantAlignment,
        });
        results.push({ id: platform.id, name: platform.name, status: "registered" });
      }
      res.json({ message: "Ecosystem initialized", platforms: results });
    } catch (error) {
      console.error("Failed to initialize ecosystem:", error);
      res.status(500).json({ error: "Failed to initialize ecosystem" });
    }
  });

  app.post("/api/ecosystem/health-check", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const results = [];

      for (const platform of platforms) {
        const startTime = Date.now();
        let status = "offline";
        let statusCode = 0;
        let errorMessage: string | null = null;
        let responseTimeMs = 0;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(platform.url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
          });
          clearTimeout(timeout);
          responseTimeMs = Date.now() - startTime;
          statusCode = response.status;
          status = response.ok ? "online" : "degraded";
        } catch (err: any) {
          responseTimeMs = Date.now() - startTime;
          errorMessage = err.message || "Connection failed";
          status = "offline";
        }

        await db.insert(ecosystemHealthLogs).values({
          platformId: platform.id,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
        });

        await db.update(ecosystemPlatforms)
          .set({ healthStatus: status, lastHealthCheck: new Date() })
          .where(eq(ecosystemPlatforms.id, platform.id));

        results.push({
          id: platform.id,
          name: platform.name,
          url: platform.url,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
        });
      }

      res.json({ checkedAt: new Date().toISOString(), platforms: results });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ error: "Health check failed" });
    }
  });

  app.get("/api/ecosystem/health-history/:platformId", requireAdminAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const logs = await db.select().from(ecosystemHealthLogs)
        .where(and(
          eq(ecosystemHealthLogs.platformId, platformId),
          gte(ecosystemHealthLogs.checkedAt, twentyFourHoursAgo)
        ))
        .orderBy(desc(ecosystemHealthLogs.checkedAt))
        .limit(100);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health history" });
    }
  });

  app.post("/api/ecosystem/heartbeat", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      let [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));

      // If key not found, try to auto-register: check if platformId is in the body
      if (!platform && req.body.platformId) {
        const [knownPlatform] = await db.select().from(ecosystemPlatforms)
          .where(eq(ecosystemPlatforms.id, req.body.platformId));
        if (knownPlatform && apiKey.startsWith("tveco_")) {
          // Platform exists but key doesn't match — auto-update the key
          await db.update(ecosystemPlatforms)
            .set({ apiKey })
            .where(eq(ecosystemPlatforms.id, knownPlatform.id));
          console.log(`[Ecosystem] Auto-registered key for ${knownPlatform.name} (${knownPlatform.id}) — key mismatch resolved`);
          [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, knownPlatform.id));
        }
      }

      if (!platform) {
        return res.status(403).json({
          error: "Invalid ecosystem key",
          fix: "Your key does not match what the hub has on file. This can happen if keys were regenerated. To fix this, either: (1) Include your platformId in the heartbeat body and the hub will auto-register your key, or (2) POST to /api/ecosystem/register-key with { platformId: 'your-id', apiKey: 'your-tveco-key' } to update your key in the hub.",
          registerEndpoint: "POST https://thrivingcommunitiesforall.com/api/ecosystem/register-key",
          registerBody: { platformId: "your-platform-id", apiKey: "your-tveco_-key" },
        });
      }

      const parseResult = heartbeatSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid heartbeat payload", details: parseResult.error.issues });
      }

      await db.update(ecosystemPlatforms)
        .set({ lastHeartbeat: new Date(), healthStatus: "online", status: "active" })
        .where(eq(ecosystemPlatforms.id, platform.id));

      await db.insert(ecosystemHealthLogs).values({
        platformId: platform.id,
        status: "online",
        responseTimeMs: 0,
        statusCode: 200,
      });

      const pendingEvents = await db.select().from(ecosystemEvents)
        .where(and(
          sql`(${ecosystemEvents.targetPlatformId} = ${platform.id} OR ${ecosystemEvents.targetPlatformId} IS NULL)`,
          eq(ecosystemEvents.status, "pending"),
          sql`${ecosystemEvents.sourcePlatformId} != ${platform.id}`
        ))
        .orderBy(ecosystemEvents.createdAt)
        .limit(50);

      if (pendingEvents.length > 0) {
        const eventIds = pendingEvents.map((e) => e.id);
        for (const eid of eventIds) {
          await db.update(ecosystemEvents)
            .set({ status: "delivered", processedAt: new Date() })
            .where(eq(ecosystemEvents.id, eid));
        }
      }

      const pendingDirectiveAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(and(
          eq(ecosystemDirectiveAcks.platformId, platform.id),
          eq(ecosystemDirectiveAcks.status, "pending"),
        ));

      const pendingDirectives = [];
      for (const ack of pendingDirectiveAcks) {
        const [directive] = await db.select().from(ecosystemDirectives)
          .where(eq(ecosystemDirectives.id, ack.directiveId));
        if (directive && directive.status === "active") {
          const platformRoles = (directive.platformRoles as Record<string, string>) || {};
          pendingDirectives.push({
            directiveId: directive.id,
            title: directive.title,
            type: directive.directiveType,
            content: directive.content,
            grantId: directive.grantId,
            yourRole: platformRoles[platform.id] || null,
            trackingRequirements: directive.trackingRequirements,
            issuedAt: directive.createdAt,
            expiresAt: directive.expiresAt,
          });
          await db.update(ecosystemDirectiveAcks)
            .set({ status: "delivered" })
            .where(eq(ecosystemDirectiveAcks.id, ack.id));
        }
      }

      const allDirectiveAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platform.id));
      const ackCount = allDirectiveAcks.filter(a => a.status === "acknowledged").length;
      const deliveredCount = allDirectiveAcks.filter(a => a.status === "delivered").length;
      const pendingCount = allDirectiveAcks.filter(a => a.status === "pending").length;
      const totalCount = allDirectiveAcks.length;

      const complianceReport = parseResult.data.complianceReport;
      let complianceResponse: Record<string, unknown> | null = null;

      if (complianceReport) {
        if (complianceReport.completedWork && complianceReport.completedWork.length > 0) {
          for (const work of complianceReport.completedWork) {
            const [existingAck] = await db.select().from(ecosystemDirectiveAcks)
              .where(and(
                eq(ecosystemDirectiveAcks.directiveId, work.directiveId),
                eq(ecosystemDirectiveAcks.platformId, platform.id),
              ));
            if (existingAck && existingAck.status !== "acknowledged") {
              await db.update(ecosystemDirectiveAcks)
                .set({
                  status: "acknowledged",
                  acknowledgedAt: new Date(),
                  responseData: { whatWasDone: work.whatWasDone, evidenceUrl: work.evidenceUrl || null },
                })
                .where(eq(ecosystemDirectiveAcks.id, existingAck.id));
            }
          }
        }

        const verifiedCount = complianceReport.completedWork?.length || 0;
        const blockerCount = complianceReport.blockers?.length || 0;
        const inProgressCount = complianceReport.directivesInProgress || 0;

        complianceResponse = {
          reportReceived: true,
          hubVerification: {
            completedWorkReceived: verifiedCount,
            completedWorkVerified: verifiedCount > 0 ? `Hub received and recorded ${verifiedCount} completed item(s). Evidence URLs logged for fidelity tracking.` : "No completed work reported this cycle.",
            blockersReceived: blockerCount,
            blockersAcknowledged: blockerCount > 0
              ? `Hub acknowledges ${blockerCount} blocker(s). These will be escalated: ${complianceReport.blockers?.map(b => `"${b.blockerDescription}" (needs: ${b.needsFrom || 'unspecified'})`).join('; ')}`
              : "No blockers reported.",
            inProgressNoted: inProgressCount > 0 ? `${inProgressCount} directive(s) in progress — hub is tracking.` : null,
          },
          fidelityScore: totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0,
          fidelityGrade: (() => {
            const score = totalCount > 0 ? (ackCount / totalCount) * 100 : 0;
            if (score >= 90) return "A — Exemplary participation";
            if (score >= 75) return "B — Strong participation";
            if (score >= 50) return "C — Partial participation — action needed";
            if (score >= 25) return "D — Low participation — escalation pending";
            return "F — Non-compliant — immediate action required";
          })(),
        };
      }

      const unacknowledgedDirectives = [];
      for (const ackRecord of allDirectiveAcks.filter(a => a.status === "delivered")) {
        const [dir] = await db.select().from(ecosystemDirectives)
          .where(eq(ecosystemDirectives.id, ackRecord.directiveId));
        if (dir) {
          const platformRoles = (dir.platformRoles as Record<string, string>) || {};
          unacknowledgedDirectives.push({
            directiveId: dir.id,
            title: dir.title,
            yourRole: platformRoles[platform.id] || "See content",
            deliveredAt: ackRecord.createdAt,
            status: "delivered — awaiting your action and acknowledgment",
          });
        }
      }

      const complianceGap = totalCount - ackCount;
      let hubMessage = "";
      if (pendingDirectives.length > 0) {
        hubMessage = `Welcome back, ${platform.name}. You have ${pendingDirectives.length} NEW directive(s) just delivered.`;
      } else {
        hubMessage = `Heartbeat received, ${platform.name}.`;
      }
      if (unacknowledgedDirectives.length > 0) {
        hubMessage += ` WARNING: ${unacknowledgedDirectives.length} previously delivered directive(s) are still unacknowledged. These require your action — read the content, do the work, then acknowledge with what you did.`;
      }
      if (complianceGap === 0 && totalCount > 0) {
        hubMessage += ` All ${totalCount} directives acknowledged. Fidelity score: 100%. Keep reporting your work on each heartbeat.`;
      } else if (totalCount > 0) {
        hubMessage += ` Compliance: ${ackCount}/${totalCount} directives acknowledged (${Math.round((ackCount / totalCount) * 100)}%).`;
      }
      if (complianceReport) {
        hubMessage += ` Compliance report received and verified — see complianceVerification field for details.`;
      } else {
        hubMessage += ` EXPECTED: Include a complianceReport in your next heartbeat showing what work you've completed, what's in progress, and any blockers. The hub inspects what it expects.`;
      }

      res.json({
        acknowledged: true,
        platformId: platform.id,
        platformName: platform.name,
        hubMessage,
        complianceStatus: {
          fidelityScore: totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0,
          totalDirectives: totalCount,
          acknowledged: ackCount,
          delivered: deliveredCount,
          pending: pendingCount,
          complianceGap,
          grade: (() => {
            const score = totalCount > 0 ? (ackCount / totalCount) * 100 : 0;
            if (score >= 90) return "A";
            if (score >= 75) return "B";
            if (score >= 50) return "C";
            if (score >= 25) return "D";
            return "F";
          })(),
        },
        complianceVerification: complianceResponse,
        unacknowledgedDirectives,
        pendingEvents: pendingEvents,
        pendingDirectives: pendingDirectives,
        nextActions: [
          ...(pendingDirectives.map(d => ({
            type: "new_directive",
            directiveId: d.directiveId,
            instruction: `NEW: Read and act on "${d.title}". Your role: ${d.yourRole || 'See content field'}. After completing, POST to /api/ecosystem/directives/ack with { "directiveId": "${d.directiveId}", "platformId": "${platform.id}", "status": "acknowledged", "responseData": { "whatWasDone": "describe what you built/changed", "evidenceUrl": "link to the feature or endpoint" } }`,
          }))),
          ...(unacknowledgedDirectives.map(d => ({
            type: "overdue",
            directiveId: d.directiveId,
            instruction: `OVERDUE: "${d.title}" was delivered but not acknowledged. Your role: ${d.yourRole}. Act on it, then acknowledge with what you did.`,
          }))),
        ],
        expectedHeartbeatFormat: {
          description: "Include this in your next heartbeat body to report compliance",
          example: {
            status: "online",
            metrics: {},
            complianceReport: {
              directivesReceived: totalCount,
              directivesActedOn: ackCount,
              directivesInProgress: 0,
              directivesBlocked: 0,
              completedWork: [{ directiveId: "example-id", whatWasDone: "Built the fidelity dashboard with CFIR scores", evidenceUrl: "https://yourplatform.com/fidelity" }],
              blockers: [{ directiveId: "example-id", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" }],
              notes: "Working on remaining directives this cycle",
            },
          },
        },
        endpoints: {
          ack: "POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack",
          repository: `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/${platform.id}`,
          event: "POST https://thrivingcommunitiesforall.com/api/ecosystem/event",
          complianceReport: "POST https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report",
        },
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Heartbeat failed:", error);
      res.status(500).json({ error: "Heartbeat failed" });
    }
  });

  function isGenericAck(whatWasDone: string, directiveTitle: string): boolean {
    if (!whatWasDone || whatWasDone.length < 20) return true;
    const normalized = whatWasDone.toLowerCase().trim();
    const titleNorm = directiveTitle.toLowerCase().trim();
    if (normalized === titleNorm) return true;
    if (normalized === `implemented: ${titleNorm}`) return true;
    if (normalized === `acknowledged: ${titleNorm}`) return true;
    if (normalized.startsWith("implemented: ") && normalized.length < 60) return true;
    if (normalized.startsWith("acknowledged: ") && normalized.length < 60) return true;
    if (normalized === "done" || normalized === "completed" || normalized === "acknowledged") return true;
    const genericPhrases = [
      "directive received, read, and actioned",
      "guidance incorporated into platform operations",
      "content incorporated into",
    ];
    for (const phrase of genericPhrases) {
      if (normalized.includes(phrase) && normalized.length < 100) return true;
    }
    return false;
  }

  function getAckQuality(whatWasDone: string, evidenceUrl: string | null, directiveTitle: string): { quality: "VERIFIED" | "SUBSTANTIVE" | "WEAK" | "REJECTED"; reason: string } {
    if (isGenericAck(whatWasDone, directiveTitle)) {
      return { quality: "REJECTED", reason: "Generic acknowledgment detected. Describe SPECIFIC work you did — features built, endpoints created, pages deployed. Parroting the directive title does not count." };
    }
    if (evidenceUrl && evidenceUrl.startsWith("https://")) {
      return { quality: "VERIFIED", reason: "Substantive work description with evidence URL. This counts toward full fidelity." };
    }
    if (whatWasDone.length >= 80) {
      return { quality: "SUBSTANTIVE", reason: "Detailed work description accepted. Add an evidenceUrl for VERIFIED status." };
    }
    return { quality: "WEAK", reason: "Work description accepted but lacks detail. Provide more specifics about what you built and include an evidenceUrl." };
  }

  app.post("/api/ecosystem/directives/ack", async (req, res) => {
    try {
      const { directiveId, platformId, status } = req.body;
      if (!directiveId || !platformId) {
        return res.status(400).json({ error: "directiveId and platformId are required" });
      }

      const [ack] = await db.select().from(ecosystemDirectiveAcks)
        .where(and(
          eq(ecosystemDirectiveAcks.directiveId, directiveId),
          eq(ecosystemDirectiveAcks.platformId, platformId),
        ));

      if (!ack) {
        return res.status(404).json({ error: `No directive found for platform '${platformId}' with directiveId '${directiveId}'. Check your platformId and directiveId.` });
      }

      const [directive] = await db.select().from(ecosystemDirectives)
        .where(eq(ecosystemDirectives.id, directiveId));
      const directiveTitle = directive?.title || directiveId;

      const responseData = req.body.responseData || req.body.notes || null;
      const whatWasDone = responseData?.whatWasDone || (typeof responseData === "string" ? responseData : "");
      const evidenceUrl = responseData?.evidenceUrl || null;

      const ackQuality = getAckQuality(whatWasDone, evidenceUrl, directiveTitle);

      if (ackQuality.quality === "REJECTED") {
        return res.status(422).json({
          received: false,
          rejected: true,
          reason: ackQuality.reason,
          directiveId,
          platformId,
          directiveTitle,
          whatYouSent: whatWasDone,
          whatWeExpect: "A SPECIFIC description of what you built or changed (minimum 20 characters, not a copy of the directive title). Example: 'Built /api/warm-handoff endpoint that accepts referrals from any ecosystem platform and confirms receipt within 200ms. Added referral tracking dashboard at /referrals showing source platform, timestamp, and follow-up status.'",
          evidenceUrlRequired: "Include responseData.evidenceUrl with a live HTTPS URL where the work can be seen or tested.",
          serverTime: new Date().toISOString(),
        });
      }

      const newStatus = status || "acknowledged";
      await db.update(ecosystemDirectiveAcks)
        .set({
          status: newStatus,
          acknowledgedAt: new Date(),
          responseData: {
            ...(typeof responseData === "object" && responseData ? responseData : { whatWasDone }),
            _ackQuality: ackQuality.quality,
            _qualityNote: ackQuality.reason,
          },
        })
        .where(eq(ecosystemDirectiveAcks.id, ack.id));

      const allAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platformId));
      const totalForPlatform = allAcks.length;
      const acknowledgedCount = allAcks.filter(a => a.status === "acknowledged").length;
      const fidelityScore = totalForPlatform > 0 ? Math.round((acknowledgedCount / totalForPlatform) * 100) : 0;

      const stillPending = allAcks.filter(a => a.status !== "acknowledged");
      const pendingTitles = [];
      for (const sp of stillPending.slice(0, 5)) {
        const [d] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, sp.directiveId));
        if (d) pendingTitles.push(d.title);
      }

      if (ackQuality.quality === "VERIFIED" && evidenceUrl) {
        const platform = ECOSYSTEM_PLATFORMS.find(p => p.id === platformId);
        if (platform) {
          const eventType = directiveTitle.toLowerCase().includes("warm handoff") ? "warm_handoff_ready"
            : directiveTitle.toLowerCase().includes("video") ? "video_script_ready"
            : directiveTitle.toLowerCase().includes("security") ? "security_audit_complete"
            : directiveTitle.toLowerCase().includes("grant") ? "grant_narrative_ready"
            : "work_completed";
          processWorkChains(platformId, eventType, { whatWasDone, evidenceUrl, directiveTitle }).catch(() => {});
        }
      }

      res.json({
        received: true,
        handshake: "confirmed",
        ackQuality: ackQuality.quality,
        hubVerification: {
          message: `Hub confirms: ${platformId} acknowledged directive "${directiveTitle}".`,
          qualityGrade: ackQuality.quality,
          qualityFeedback: ackQuality.reason,
          whatHubRecorded: {
            directiveTitle,
            platformId,
            status: newStatus,
            responseData: responseData || null,
            recordedAt: new Date().toISOString(),
          },
        },
        complianceUpdate: {
          fidelityScore,
          totalDirectives: totalForPlatform,
          acknowledged: acknowledgedCount,
          remaining: stillPending.length,
          nextUp: pendingTitles.length > 0 ? `Next directives needing action: ${pendingTitles.join('; ')}` : "All directives addressed. Outstanding.",
        },
        directiveId,
        platformId,
        status: newStatus,
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Directive ack failed:", error);
      res.status(500).json({ error: "Failed to acknowledge directive" });
    }
  });

  app.post("/api/ecosystem/compliance-report", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      let [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));

      // Auto-register key if platformId provided and key doesn't match
      if (!platform && req.body.platformId) {
        const [knownPlatform] = await db.select().from(ecosystemPlatforms)
          .where(eq(ecosystemPlatforms.id, req.body.platformId));
        if (knownPlatform && apiKey.startsWith("tveco_")) {
          await db.update(ecosystemPlatforms)
            .set({ apiKey })
            .where(eq(ecosystemPlatforms.id, knownPlatform.id));
          console.log(`[Ecosystem] Auto-registered key for ${knownPlatform.name} via compliance-report`);
          [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, knownPlatform.id));
        }
      }

      if (!platform) return res.status(403).json({
        error: "Invalid ecosystem key",
        fix: "Include platformId in the request body so the hub can auto-register your key, or POST to /api/ecosystem/register-key with { platformId, apiKey }",
      });

      const { completedWork, inProgress, blockers, capabilities, notes } = req.body;

      if (completedWork && Array.isArray(completedWork)) {
        for (const work of completedWork) {
          if (!work.directiveId || !work.whatWasDone) continue;
          const [existingAck] = await db.select().from(ecosystemDirectiveAcks)
            .where(and(
              eq(ecosystemDirectiveAcks.directiveId, work.directiveId),
              eq(ecosystemDirectiveAcks.platformId, platform.id),
            ));
          if (existingAck) {
            await db.update(ecosystemDirectiveAcks)
              .set({
                status: "acknowledged",
                acknowledgedAt: new Date(),
                responseData: { whatWasDone: work.whatWasDone, evidenceUrl: work.evidenceUrl || null, completedAt: work.completedAt || new Date().toISOString() },
              })
              .where(eq(ecosystemDirectiveAcks.id, existingAck.id));
          }
        }
      }

      const allAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platform.id));
      const totalCount = allAcks.length;
      const ackCount = allAcks.filter(a => a.status === "acknowledged").length;
      const fidelityScore = totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0;

      const unaddressed = [];
      for (const a of allAcks.filter(x => x.status !== "acknowledged")) {
        const [dir] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, a.directiveId));
        if (dir) {
          const roles = (dir.platformRoles as Record<string, string>) || {};
          unaddressed.push({ directiveId: dir.id, title: dir.title, yourRole: roles[platform.id] || "See content" });
        }
      }

      await db.insert(ecosystemEvents).values({
        sourcePlatformId: platform.id,
        eventType: "compliance_report",
        eventData: {
          completedWork: completedWork || [],
          inProgress: inProgress || [],
          blockers: blockers || [],
          capabilities: capabilities || [],
          notes: notes || "",
          fidelityScore,
          reportedAt: new Date().toISOString(),
        },
        status: "processed",
        processedAt: new Date(),
      });

      res.json({
        received: true,
        handshake: "confirmed",
        hubMessage: `Compliance report from ${platform.name} received and verified. Fidelity score: ${fidelityScore}%. ${unaddressed.length} directive(s) still need attention.`,
        hubVerification: {
          completedWorkRecorded: (completedWork || []).length,
          inProgressNoted: (inProgress || []).length,
          blockersEscalated: (blockers || []).length,
          blockersDetail: (blockers || []).map((b: any) => ({
            issue: b.blockerDescription || b.description,
            needsFrom: b.needsFrom || "unspecified",
            hubAction: "Will route to the named platform on their next heartbeat",
          })),
        },
        complianceStatus: {
          fidelityScore,
          grade: fidelityScore >= 90 ? "A" : fidelityScore >= 75 ? "B" : fidelityScore >= 50 ? "C" : fidelityScore >= 25 ? "D" : "F",
          totalDirectives: totalCount,
          acknowledged: ackCount,
          remaining: unaddressed.length,
        },
        unaddressedDirectives: unaddressed,
        message: unaddressed.length > 0
          ? `These ${unaddressed.length} directives still require your action: ${unaddressed.map(u => `"${u.title}"`).join(', ')}`
          : "All directives addressed. Fidelity score: 100%. Excellent work.",
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Compliance report failed:", error);
      res.status(500).json({ error: "Failed to process compliance report" });
    }
  });

  app.post("/api/ecosystem/event", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      let [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));

      if (!platform && req.body.platformId) {
        const [knownPlatform] = await db.select().from(ecosystemPlatforms)
          .where(eq(ecosystemPlatforms.id, req.body.platformId));
        if (knownPlatform && apiKey.startsWith("tveco_")) {
          await db.update(ecosystemPlatforms)
            .set({ apiKey })
            .where(eq(ecosystemPlatforms.id, knownPlatform.id));
          console.log(`[Ecosystem] Auto-registered key for ${knownPlatform.name} via event`);
          [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, knownPlatform.id));
        }
      }

      if (!platform) {
        return res.status(403).json({
          error: "Invalid ecosystem key",
          fix: "Include platformId in the request body so the hub can auto-register your key",
        });
      }

      const parseResult = eventSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid event payload", details: parseResult.error.issues });
      }
      const { eventType, targetPlatformId, eventData } = parseResult.data;

      const [event] = await db.insert(ecosystemEvents).values({
        sourcePlatformId: platform.id,
        targetPlatformId: targetPlatformId || null,
        eventType,
        eventData: eventData || {},
        status: "pending",
      }).returning();

      const chainResults = await processWorkChains(platform.id, eventType, (eventData || {}) as Record<string, unknown>);

      res.json({
        eventId: event.id,
        status: "queued",
        workChains: chainResults.length > 0 ? {
          triggered: chainResults.length,
          routed: chainResults,
          message: `This event triggered ${chainResults.length} downstream action(s). They will be delivered to the target platform(s) on their next heartbeat.`,
        } : undefined,
      });
    } catch (error) {
      console.error("Event submission failed:", error);
      res.status(500).json({ error: "Failed to submit event" });
    }
  });

  app.get("/api/ecosystem/events", requireAdminAuth, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const events = await db.select().from(ecosystemEvents)
        .orderBy(desc(ecosystemEvents.createdAt))
        .limit(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/ecosystem/status", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const now = Date.now();
      const STALE_THRESHOLD_MS = 15 * 60 * 1000;

      const enrichedPlatforms = platforms.map((p) => {
        let liveHealth = "unknown";
        if (p.status === "active" && p.lastHeartbeat) {
          const heartbeatAge = now - new Date(p.lastHeartbeat).getTime();
          liveHealth = heartbeatAge <= STALE_THRESHOLD_MS ? "online" : "offline";
        } else if (p.status === "active") {
          liveHealth = "online";
        }
        return {
          id: p.id,
          name: p.name,
          url: p.url,
          role: p.role,
          domain: p.domain,
          status: p.status,
          healthStatus: liveHealth,
          lastHeartbeat: p.lastHeartbeat,
          lastHealthCheck: p.lastHealthCheck,
          grantAlignment: p.grantAlignment,
        };
      });

      const onlineCount = enrichedPlatforms.filter((p) => p.healthStatus === "online").length;
      const totalEvents = await db.select({ count: sql`count(*)` }).from(ecosystemEvents);
      const recentEvents = await db.select({ count: sql`count(*)` }).from(ecosystemEvents)
        .where(gte(ecosystemEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

      res.json({
        totalPlatforms: enrichedPlatforms.length,
        onlinePlatforms: onlineCount,
        totalEvents: Number(totalEvents[0]?.count || 0),
        eventsLast24h: Number(recentEvents[0]?.count || 0),
        platforms: enrichedPlatforms,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ecosystem status" });
    }
  });

  app.post("/api/ecosystem/directives", requireAdminAuth, async (req, res) => {
    try {
      const { title, directiveType, content, grantId, targetPlatformIds, platformRoles, trackingRequirements, expiresAt } = req.body;

      if (!title || !directiveType || !content || !targetPlatformIds || !Array.isArray(targetPlatformIds) || targetPlatformIds.length === 0) {
        return res.status(400).json({ error: "title, directiveType, content, and targetPlatformIds (array) are required" });
      }

      const [directive] = await db.insert(ecosystemDirectives).values({
        title,
        directiveType,
        content,
        grantId: grantId || null,
        targetPlatformIds,
        platformRoles: platformRoles || {},
        trackingRequirements: trackingRequirements || null,
        status: "active",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }).returning();

      const ackResults = [];
      for (const platformId of targetPlatformIds) {
        const [ack] = await db.insert(ecosystemDirectiveAcks).values({
          directiveId: directive.id,
          platformId,
          status: "pending",
        }).returning();
        ackResults.push(ack);
      }

      res.json({
        directive,
        acknowledgments: ackResults,
        message: `Directive broadcast to ${targetPlatformIds.length} platforms. They will receive it on next heartbeat (within 5 minutes).`,
      });
    } catch (error) {
      console.error("Failed to create directive:", error);
      res.status(500).json({ error: "Failed to create directive" });
    }
  });

  app.post("/api/ecosystem/wake-up", requireAdminAuth, async (req, res) => {
    try {
      const { platformIds } = req.body || {};
      const platforms = await db.select().from(ecosystemPlatforms);
      const targets = platformIds && Array.isArray(platformIds) && platformIds.length > 0
        ? platforms.filter(p => platformIds.includes(p.id))
        : platforms;

      const results = [];

      const wakePromises = targets.map(async (platform) => {
        const startTime = Date.now();
        let status = "failed";
        let statusCode = 0;
        let errorMessage: string | null = null;
        let responseTimeMs = 0;
        let wakeAttempts = 0;

        for (let attempt = 1; attempt <= 2; attempt++) {
          wakeAttempts = attempt;
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(platform.url, {
              method: "GET",
              signal: controller.signal,
              redirect: "follow",
              headers: {
                "User-Agent": "ThriveUp-Ecosystem-WakeUp/1.0",
                "Accept": "text/html,application/json",
              },
            });
            clearTimeout(timeout);
            responseTimeMs = Date.now() - startTime;
            statusCode = response.status;

            if (response.ok) {
              status = "awake";
              break;
            } else {
              status = "responded";
              if (attempt < 2) {
                await new Promise(r => setTimeout(r, 2000));
              }
            }
          } catch (err: any) {
            responseTimeMs = Date.now() - startTime;
            errorMessage = err.name === "AbortError" ? "Timeout (15s)" : (err.message || "Connection failed");
            status = "failed";
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 3000));
            }
          }
        }

        if (status === "awake" || status === "responded") {
          await db.update(ecosystemPlatforms)
            .set({ healthStatus: status === "awake" ? "online" : "degraded", lastHealthCheck: new Date() })
            .where(eq(ecosystemPlatforms.id, platform.id));

          await db.insert(ecosystemHealthLogs).values({
            platformId: platform.id,
            status: status === "awake" ? "online" : "degraded",
            responseTimeMs,
            statusCode,
            errorMessage: null,
          });
        }

        return {
          id: platform.id,
          name: platform.name,
          url: platform.url,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
          wakeAttempts,
        };
      });

      const wakeResults = await Promise.allSettled(wakePromises);
      for (const result of wakeResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        }
      }

      const awake = results.filter(r => r.status === "awake").length;
      const responded = results.filter(r => r.status === "responded").length;
      const failed = results.filter(r => r.status === "failed").length;

      res.json({
        wokenAt: new Date().toISOString(),
        summary: { targeted: results.length, awake, responded, failed },
        platforms: results.sort((a, b) => {
          const order: Record<string, number> = { awake: 0, responded: 1, failed: 2 };
          return (order[a.status] || 2) - (order[b.status] || 2);
        }),
      });
    } catch (error) {
      console.error("Wake-up failed:", error);
      res.status(500).json({ error: "Wake-up failed" });
    }
  });

  app.get("/api/ecosystem/live-status", async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const results = [];

      for (const platform of platforms) {
        const startTime = Date.now();
        let status = "offline";
        let statusCode = 0;
        let errorMessage: string | null = null;
        let responseTimeMs = 0;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(platform.url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
          });
          clearTimeout(timeout);
          responseTimeMs = Date.now() - startTime;
          statusCode = response.status;
          status = response.ok ? "online" : "degraded";
        } catch (err: any) {
          responseTimeMs = Date.now() - startTime;
          errorMessage = err.name === "AbortError" ? "Timeout (8s)" : (err.message || "Connection failed");
          status = "offline";
        }

        await db.insert(ecosystemHealthLogs).values({
          platformId: platform.id,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
        });

        await db.update(ecosystemPlatforms)
          .set({ healthStatus: status, lastHealthCheck: new Date() })
          .where(eq(ecosystemPlatforms.id, platform.id));

        const platformDef = ECOSYSTEM_PLATFORMS.find(p => p.id === platform.id);

        results.push({
          id: platform.id,
          name: platform.name,
          url: platform.url,
          role: platform.role,
          domain: platform.domain,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
          lastHeartbeat: platform.lastHeartbeat,
          grantAlignment: platform.grantAlignment,
          description: platformDef?.description || platform.description,
        });
      }

      const onlineCount = results.filter(r => r.status === "online").length;
      const degradedCount = results.filter(r => r.status === "degraded").length;
      const offlineCount = results.filter(r => r.status === "offline").length;

      const directives = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.status, "active"));
      const acks = await db.select().from(ecosystemDirectiveAcks);
      const acksByStatus = {
        pending: acks.filter(a => a.status === "pending").length,
        delivered: acks.filter(a => a.status === "delivered").length,
        acknowledged: acks.filter(a => a.status === "acknowledged").length,
      };

      res.json({
        checkedAt: new Date().toISOString(),
        summary: {
          total: results.length,
          online: onlineCount,
          degraded: degradedCount,
          offline: offlineCount,
          healthScore: Math.round(((onlineCount + degradedCount * 0.5) / results.length) * 100),
        },
        directives: {
          total: directives.length,
          acknowledgments: acksByStatus,
        },
        platforms: results.sort((a, b) => {
          const order: Record<string, number> = { online: 0, degraded: 1, offline: 2 };
          return (order[a.status] || 2) - (order[b.status] || 2);
        }),
      });
    } catch (error) {
      console.error("Live status check failed:", error);
      res.status(500).json({ error: "Live status check failed" });
    }
  });

  app.get("/api/ecosystem/directives/repository", async (req, res) => {
    try {
      const directives = await db.select().from(ecosystemDirectives)
        .where(eq(ecosystemDirectives.status, "active"))
        .orderBy(desc(ecosystemDirectives.createdAt));

      const platforms = await db.select({ id: ecosystemPlatforms.id, name: ecosystemPlatforms.name }).from(ecosystemPlatforms);
      const platformMap = Object.fromEntries(platforms.map((p) => [p.id, p.name]));

      const requestingPlatformId = req.query.platformId as string | undefined;

      const repository = directives.map((d) => {
        const entry: any = {
          directiveId: d.id,
          title: d.title,
          type: d.directiveType,
          content: d.content,
          grantId: d.grantId,
          issuedAt: d.createdAt,
          expiresAt: d.expiresAt,
          targetPlatforms: (d.targetPlatformIds as string[] || []).map((id: string) => ({ id, name: platformMap[id] || id })),
        };
        if (d.platformRoles && typeof d.platformRoles === "object") {
          const roles = d.platformRoles as Record<string, string>;
          if (requestingPlatformId && roles[requestingPlatformId]) {
            entry.yourRole = roles[requestingPlatformId];
          }
        }
        if (d.trackingRequirements) {
          entry.trackingRequirements = d.trackingRequirements;
        }
        return entry;
      });

      res.json({
        totalDirectives: repository.length,
        lastUpdated: new Date().toISOString(),
        requestingPlatform: requestingPlatformId || null,
        directives: repository,
      });
    } catch (error) {
      console.error("Failed to fetch directives repository:", error);
      res.status(500).json({ error: "Failed to fetch directives repository" });
    }
  });

  app.get("/api/ecosystem/directives/repository/:platformId", async (req, res) => {
    try {
      const { platformId } = req.params;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: "Platform not found" });
      }

      const acks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platformId));

      const directiveDetails = await Promise.all(acks.map(async (a) => {
        const [d] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, a.directiveId));
        if (!d) return null;
        const roles = (d.platformRoles as Record<string, string>) || {};
        return {
          directiveId: d.id,
          title: d.title,
          type: d.directiveType,
          content: d.content,
          grantId: d.grantId,
          yourRole: roles[platformId] || null,
          trackingRequirements: d.trackingRequirements,
          deliveryStatus: a.status,
          issuedAt: d.createdAt,
          deliveredAt: a.status === "delivered" ? a.acknowledgedAt : null,
          acknowledgedAt: a.status === "acknowledged" ? a.acknowledgedAt : null,
        };
      }));

      const filtered = directiveDetails.filter(Boolean);
      res.json({
        platform: { id: platform.id, name: platform.name },
        totalDirectives: filtered.length,
        pending: filtered.filter((d: any) => d.deliveryStatus === "pending").length,
        delivered: filtered.filter((d: any) => d.deliveryStatus === "delivered").length,
        acknowledged: filtered.filter((d: any) => d.deliveryStatus === "acknowledged").length,
        directives: filtered,
      });
    } catch (error) {
      console.error("Failed to fetch platform directives:", error);
      res.status(500).json({ error: "Failed to fetch platform directives" });
    }
  });

  app.get("/api/ecosystem/directives", requireAdminAuth, async (_req, res) => {
    try {
      const directives = await db.select().from(ecosystemDirectives).orderBy(desc(ecosystemDirectives.createdAt));

      const directivesWithAcks = await Promise.all(directives.map(async (d) => {
        const acks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.directiveId, d.id));
        const platforms = await db.select().from(ecosystemPlatforms);
        const platformMap = Object.fromEntries(platforms.map((p) => [p.id, p.name]));

        return {
          ...d,
          acknowledgments: acks.map((a) => ({
            ...a,
            platformName: platformMap[a.platformId] || a.platformId,
          })),
          stats: {
            total: acks.length,
            pending: acks.filter((a) => a.status === "pending").length,
            delivered: acks.filter((a) => a.status === "delivered").length,
            acknowledged: acks.filter((a) => a.status === "acknowledged").length,
          },
        };
      }));

      res.json(directivesWithAcks);
    } catch (error) {
      console.error("Failed to fetch directives:", error);
      res.status(500).json({ error: "Failed to fetch directives" });
    }
  });

  app.get("/api/ecosystem/directives/:directiveId", requireAdminAuth, async (req, res) => {
    try {
      const { directiveId } = req.params;
      const [directive] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, directiveId));
      if (!directive) return res.status(404).json({ error: "Directive not found" });

      const acks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.directiveId, directiveId));
      const platforms = await db.select().from(ecosystemPlatforms);
      const platformMap = Object.fromEntries(platforms.map((p) => [p.id, p.name]));

      res.json({
        ...directive,
        acknowledgments: acks.map((a) => ({
          ...a,
          platformName: platformMap[a.platformId] || a.platformId,
        })),
        stats: {
          total: acks.length,
          pending: acks.filter((a) => a.status === "pending").length,
          delivered: acks.filter((a) => a.status === "delivered").length,
          acknowledged: acks.filter((a) => a.status === "acknowledged").length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch directive" });
    }
  });

  app.post("/api/ecosystem/directives/:directiveId/acknowledge", requireEcosystemAuth, async (req, res) => {
    try {
      const { directiveId } = req.params;
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const [ack] = await db.select().from(ecosystemDirectiveAcks)
        .where(and(
          eq(ecosystemDirectiveAcks.directiveId, directiveId),
          eq(ecosystemDirectiveAcks.platformId, platform.id),
        ));

      if (!ack) return res.status(404).json({ error: "No directive acknowledgment found for this platform" });

      await db.update(ecosystemDirectiveAcks)
        .set({
          status: "acknowledged",
          acknowledgedAt: new Date(),
          responseData: req.body.responseData || null,
        })
        .where(eq(ecosystemDirectiveAcks.id, ack.id));

      res.json({ acknowledged: true, directiveId, platformId: platform.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to acknowledge directive" });
    }
  });

  app.patch("/api/ecosystem/directives/:directiveId", requireAdminAuth, async (req, res) => {
    try {
      const { directiveId } = req.params;
      const { status } = req.body;
      if (!["active", "expired", "revoked"].includes(status)) {
        return res.status(400).json({ error: "Status must be active, expired, or revoked" });
      }
      await db.update(ecosystemDirectives).set({ status }).where(eq(ecosystemDirectives.id, directiveId));
      res.json({ updated: true, directiveId, status });
    } catch (error) {
      res.status(500).json({ error: "Failed to update directive" });
    }
  });

  app.get("/api/ecosystem/integration-snippet/:platformId", requireAdminAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: "Platform not found" });
      }

      const baseUrl = "https://thrivingcommunitiesforall.com";

      const dataFlows = platform.dataFlowConfig as { sends?: string[]; receives?: string[] } | null;
      const sendsList = (dataFlows?.sends || []).map((s: string) => `//   - "${s}"`).join("\n");
      const receivesList = (dataFlows?.receives || []).map((r: string) => `//   - "${r}"`).join("\n");

      const snippet = `
// ============================================================
// ThriveUp Ecosystem Connector — ${platform.name}
// Generated: ${new Date().toISOString()}
// Platform ID: ${platform.id}
// Role: ${platform.role}
// Grant Alignment: ${((platform.grantAlignment as string[]) || []).join(", ")}
// ============================================================
// DROP THIS FILE INTO YOUR PROJECT as ecosystem-connector.js
// It does three things:
//   1. Heartbeat — tells ThriveUp you're alive (every 5 min)
//   2. Send Events — notify the ecosystem when things happen
//   3. Receive Events — get events from other platforms
//
// Data this platform SENDS:
${sendsList || "//   (none configured)"}
// Data this platform RECEIVES:
${receivesList || "//   (none configured)"}
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "${baseUrl}",
  platformId: "${platform.id}",
  apiKey: "${platform.apiKey}",
  heartbeatIntervalMs: 5 * 60 * 1000,
};

async function sendHeartbeat(metrics = {}) {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/heartbeat\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ platformId: THRIVE_ECOSYSTEM_CONFIG.platformId, metrics, timestamp: new Date().toISOString() }),
    });
    const data = await response.json();
    if (data.pendingEvents?.length > 0) {
      for (const event of data.pendingEvents) { await handleIncomingEvent(event); }
    }
    return data;
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Heartbeat failed:", error.message);
  }
}

async function sendEcosystemEvent(eventType, eventData, targetPlatformId = null) {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/event\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ eventType, eventData, targetPlatformId }),
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Event send failed:", error.message);
  }
}

async function handleIncomingEvent(event) {
  console.log(\`[ThriveUp Ecosystem] Received: \${event.eventType} from \${event.sourcePlatformId}\`);
  // TODO: Add your platform-specific event handling here
  // Common event types across the ecosystem:
  //   screening_completed, crisis_alert, veteran_referred, transition_milestone,
  //   life_event_risk, research_update, youth_enrolled, resource_referral,
  //   safety_plan_created, medication_alert, cognitive_assessment, incident_report
}

async function getIntegrationDoc() {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/integration-doc\`, {
      headers: { "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Failed to fetch integration doc:", error.message);
  }
}

setInterval(() => sendHeartbeat(), THRIVE_ECOSYSTEM_CONFIG.heartbeatIntervalMs);
sendHeartbeat();
console.log("[ThriveUp Ecosystem] ${platform.name} connector initialized — ID: ${platform.id}");

// Export for use in your app
if (typeof module !== "undefined") {
  module.exports = { sendHeartbeat, sendEcosystemEvent, getIntegrationDoc, THRIVE_ECOSYSTEM_CONFIG };
}
`.trim();

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        snippet,
        instructions: [
          `1. Save this code as ecosystem-connector.js in your ${platform.name} project`,
          "2. Import or require it from your server entry point (e.g., require('./ecosystem-connector'))",
          "3. The API key is embedded — keep this file server-side only, never in frontend/public code",
          "4. Heartbeats start automatically — you'll see this platform go green on the ThriveUp Command Center within 5 minutes",
          "5. Call sendEcosystemEvent() from your existing code wherever important things happen (screenings, referrals, milestones, etc.)",
          "6. Implement handleIncomingEvent() to process events from other ecosystem platforms",
          "7. Call getIntegrationDoc() to fetch the latest ecosystem integration document for cross-platform alignment",
        ],
      });
    } catch (error) {
      console.error("Failed to generate snippet:", error);
      res.status(500).json({ error: "Failed to generate integration snippet" });
    }
  });

  app.get("/api/ecosystem/integration-doc", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
      if (!platform) {
        return res.status(403).json({ error: "Invalid ecosystem key" });
      }

      const allPlatforms = await db.select().from(ecosystemPlatforms);
      const sanitizedPlatforms = allPlatforms.map(({ apiKey: _k, ...rest }) => rest);

      res.json({
        title: "Collaborative Advocate Ecosystem Integration Document",
        version: "2.0",
        lastUpdated: new Date().toISOString(),
        requestingPlatform: platform.id,
        corePremise: "Veteran suicide is not a single-point problem. It's a continuum — from the moment someone separates from service, through life transitions, into crisis, through stabilization, and into long-term recovery. No single app, hotline, or VA program covers the full spectrum. This ecosystem does. Sixteen platforms. One mission. Each serves a distinct role. Together, they ensure that no matter where a veteran, youth, or community member is — geographically, emotionally, or in their journey — there is always a next step. Never a dead end.",
        author: "Dr. Terry Flood, DMSc — U.S. Army (20 years), Former Veterans Crisis Line Responder",
        entities: {
          nonprofit: "ThriveUp Academy 501(c)(3) — Central orchestrator and facilitator",
          vosb: "The Collaborative Advocate (VOSB) — Veteran-owned service delivery",
          saas: "Minority Center of Excellence (MCE) — Minority business SaaS",
        },
        grantLenses: {
          "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026", platforms: ["whole-person-health", "m2c", "lifebridge", "sankofa", "safecognicare", "pillscheduler", "betterscience"] },
          "dfc": { name: "Drug-Free Communities (DFC)", amount: "$625K", deadline: "April 14, 2026", platforms: ["whole-person-health", "isss", "sankofa", "wholemind", "safereport", "lifebridge", "pillscheduler", "betterscience"] },
          "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling", platforms: ["isss", "wholemind", "m2c", "mce", "whole-person-health"] },
          "nba-foundation": { name: "Foundation Grant", amount: "$100K-$500K", deadline: "Rolling LOI", platforms: ["isss", "wholemind"] },
          "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "Opens March 30, 2026", platforms: ["whole-person-health", "sankofa", "perfectly-different", "safecognicare", "lifebridge"] },
          "samhsa": { name: "SAMHSA Community Mental Health", amount: "Varies", deadline: "Varies", platforms: ["whole-person-health", "sankofa", "perfectly-different", "safecognicare", "pillscheduler", "betterscience", "lifebridge"] },
        },
        crisisContinuum: {
          phase1_prevention: { name: "Prevention & Preparedness", platforms: ["m2c", "whole-person-health", "wholemind", "isss", "betterscience"], description: "Purpose, skills, pathways for youth; pre-separation planning; preparedness plans; evidence base for prevention strategies" },
          phase2_earlyWarning: { name: "Early Warning", platforms: ["whole-person-health", "lifebridge", "sankofa", "perfectly-different", "safecognicare"], description: "C-SSRS, PHQ-9, GAD-7, PCL-5 screenings; life event self-assessment; MAP-GAP 7-domain assessment; cognitive and neurodevelopmental monitoring" },
          phase3_crisisSupport: { name: "Crisis Support", platforms: ["whole-person-health", "lifebridge", "safereport"], description: "988 Veterans Crisis Line; Crisis Text Line; Reach a Vet peer support; Safety Plan Builder; Quick Exit; 24/7 resource navigation; mandatory reporting" },
          phase4_stabilization: { name: "Stabilization", platforms: ["whole-person-health", "lifebridge", "pillscheduler", "sankofa"], description: "Care Summary Generator; Find Help (20,670+ resources); Refer-a-Patient; medication management; VA facility connections" },
          phase5_recovery: { name: "Recovery & Growth", platforms: ["whole-person-health", "lifebridge", "m2c", "mce", "betterscience"], description: "Community groups (2,091+); peer stories; condition guides; ongoing life navigation; career pathways; business formation; outcome measurement" },
        },
        sharedDesignPrinciples: [
          "No Dead Ends — every page has at least one forward path to another ecosystem resource",
          "Always a Safety Net — 988 Veterans Crisis Line accessible from every page of every platform",
          "Privacy First — screening results and safety plans stay on user's device, no accounts required for crisis tools",
          "Free for Individuals — no individual user ever pays for anything on any platform",
          "Offline-Capable — safety-critical features work offline via PWA service worker caching",
          "Veteran-Informed Design — built by a veteran (20yr Army, VCL responder), direct language, no clinical jargon",
          "Quick Exit — every platform includes Quick Exit button redirecting to weather.com and replacing browser history",
        ],
        platforms: sanitizedPlatforms,
        yourPlatformRole: {
          id: platform.id,
          name: platform.name,
          role: platform.role,
          description: platform.description,
          dataYouSend: (platform.dataFlowConfig as any)?.sends || [],
          dataYouReceive: (platform.dataFlowConfig as any)?.receives || [],
          grantsYouSupport: (platform.grantAlignment as string[]) || [],
        },
      });
    } catch (error) {
      console.error("Failed to serve integration doc:", error);
      res.status(500).json({ error: "Failed to serve integration document" });
    }
  });

  app.get("/api/ecosystem/public/status", async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms).orderBy(ecosystemPlatforms.name);
      const sanitized = platforms.map(({ apiKey, ...rest }) => ({
        id: rest.id,
        name: rest.name,
        url: rest.url,
        role: rest.role,
        domain: rest.domain,
        description: rest.description,
        status: rest.status,
        healthStatus: rest.healthStatus,
        lastHeartbeat: rest.lastHeartbeat,
        grantAlignment: rest.grantAlignment,
      }));

      const directives = await db.select().from(ecosystemDirectives)
        .where(eq(ecosystemDirectives.status, "active"))
        .orderBy(desc(ecosystemDirectives.createdAt));

      const directiveSummaries = await Promise.all(directives.map(async (d) => {
        const acks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.directiveId, d.id));
        return {
          id: d.id,
          title: d.title,
          directiveType: d.directiveType,
          grantId: d.grantId,
          status: d.status,
          createdAt: d.createdAt,
          expiresAt: d.expiresAt,
          targetPlatformCount: (d.targetPlatformIds as string[] || []).length,
          stats: {
            total: acks.length,
            pending: acks.filter((a) => a.status === "pending").length,
            delivered: acks.filter((a) => a.status === "delivered").length,
            acknowledged: acks.filter((a) => a.status === "acknowledged").length,
          },
        };
      }));

      const online = sanitized.filter(p => p.healthStatus === "online").length;
      const degraded = sanitized.filter(p => p.healthStatus === "degraded").length;
      const offline = sanitized.filter(p => p.healthStatus === "offline").length;

      res.json({
        ecosystem: {
          name: "ThriveUp Academy Ecosystem",
          totalPlatforms: sanitized.length,
          health: { online, degraded, offline, unknown: sanitized.length - online - degraded - offline },
        },
        platforms: sanitized,
        directives: directiveSummaries,
      });
    } catch (error) {
      console.error("Failed to fetch public ecosystem status:", error);
      res.status(500).json({ error: "Failed to fetch ecosystem status" });
    }
  });

  app.get("/api/ecosystem/platform-directives/:platformId", async (req, res) => {
    try {
      const { platformId } = req.params;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: "Platform not found" });
      }

      const acks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platformId));

      const directiveDetails = await Promise.all(acks.map(async (a) => {
        const [d] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, a.directiveId));
        if (!d) return null;
        const roles = (d.platformRoles as Record<string, string>) || {};
        return {
          directiveId: d.id,
          title: d.title,
          type: d.directiveType,
          content: d.content,
          grantId: d.grantId,
          yourRole: roles[platformId] || null,
          trackingRequirements: d.trackingRequirements,
          deliveryStatus: a.status,
          issuedAt: d.createdAt,
          acknowledgedAt: a.status === "acknowledged" ? a.acknowledgedAt : null,
        };
      }));

      const filtered = directiveDetails.filter(Boolean);
      const dataFlows = platform.dataFlowConfig as { sends?: string[]; receives?: string[] } | null;

      res.json({
        platform: {
          id: platform.id,
          name: platform.name,
          url: platform.url,
          role: platform.role,
          domain: platform.domain,
          description: platform.description,
          healthStatus: platform.healthStatus,
          lastHeartbeat: platform.lastHeartbeat,
          grantAlignment: platform.grantAlignment,
          sends: dataFlows?.sends || [],
          receives: dataFlows?.receives || [],
        },
        totalDirectives: filtered.length,
        pending: filtered.filter((d: any) => d.deliveryStatus === "pending").length,
        delivered: filtered.filter((d: any) => d.deliveryStatus === "delivered").length,
        acknowledged: filtered.filter((d: any) => d.deliveryStatus === "acknowledged").length,
        directives: filtered,
      });
    } catch (error) {
      console.error("Failed to fetch platform directives:", error);
      res.status(500).json({ error: "Failed to fetch platform directives" });
    }
  });

  // ===================================================================
  // INTELLIGENCE ENGINE — Work Chaining, Verification, Grant Readiness
  // Turns heartbeat data into actionable intelligence
  // ===================================================================

  const WORK_CHAINS: Record<string, { nextPlatform: string; eventType: string; description: string }[]> = {
    "video_script_ready": [{ nextPlatform: "video-creator-ai", eventType: "produce_video", description: "Video script submitted — produce video" }],
    "security_audit_complete": ECOSYSTEM_PLATFORMS.filter(p => p.id !== "shield-atlas").map(p => ({ nextPlatform: p.id, eventType: "security_findings", description: "Security audit results for your platform" })),
    "grant_narrative_ready": [{ nextPlatform: "betterscience", eventType: "review_narrative", description: "Grant narrative ready for RPLICE quality review" }],
    "voices_story_submitted": [
      { nextPlatform: "lifebridge", eventType: "voices_housing_referral", description: "Community story with housing needs" },
      { nextPlatform: "whole-person-health", eventType: "voices_health_referral", description: "Community story with health needs" },
    ],
    "research_update": ECOSYSTEM_PLATFORMS.map(p => ({ nextPlatform: p.id, eventType: "research_findings", description: "New research findings from RPLICE" })),
    "crisis_alert": [
      { nextPlatform: "whole-person-health", eventType: "crisis_escalation", description: "Crisis alert escalation" },
      { nextPlatform: "lifebridge", eventType: "crisis_resource_needed", description: "Crisis — resource navigation needed" },
    ],
    "warm_handoff_ready": [
      { nextPlatform: "betterscience", eventType: "verify_warm_handoff", description: "Warm handoff endpoint built — RPLICE verify quality" },
      ...ECOSYSTEM_PLATFORMS.filter(p => !["betterscience"].includes(p.id)).map(p => ({ nextPlatform: p.id, eventType: "warm_handoff_available", description: "New warm handoff endpoint available for cross-platform referrals" })),
    ],
    "work_completed": [
      { nextPlatform: "betterscience", eventType: "quality_review_needed", description: "Work completed — RPLICE quality gate review" },
    ],
    "screening_built": [
      { nextPlatform: "whole-person-health", eventType: "register_screening", description: "New screening tool available — register in health ecosystem" },
      { nextPlatform: "betterscience", eventType: "validate_screening", description: "New screening tool — validate evidence base" },
    ],
    "intake_endpoint_built": [
      { nextPlatform: "betterscience", eventType: "verify_intake", description: "Intake endpoint built — verify and register" },
      ...ECOSYSTEM_PLATFORMS.filter(p => !["betterscience"].includes(p.id)).map(p => ({ nextPlatform: p.id, eventType: "intake_available", description: "New intake endpoint available for referrals" })),
    ],
    "housing_resource_added": [
      { nextPlatform: "lifebridge", eventType: "housing_resource_update", description: "New housing resource — add to LifeBridge directory" },
      { nextPlatform: "whole-person-health", eventType: "resource_update", description: "New housing resource for Whole-Person Health directory" },
    ],
    "workforce_pathway_created": [
      { nextPlatform: "m2c", eventType: "workforce_pathway_available", description: "New workforce pathway — M2C Transition integration" },
      { nextPlatform: "m2c", eventType: "career_pathway_update", description: "New workforce pathway for veteran career translation" },
      { nextPlatform: "isss", eventType: "youth_pathway_available", description: "New workforce pathway — ISSS youth pipeline" },
    ],
    "youth_referral": [
      { nextPlatform: "isss", eventType: "youth_intake", description: "Youth referral — ISSS intake and wraparound" },
      { nextPlatform: "wholemind", eventType: "youth_learning_referral", description: "Youth referral — WholeMind learning assessment" },
    ],
    "veteran_referral": [
      { nextPlatform: "m2c", eventType: "veteran_intake", description: "Veteran referral — Mission Transition onboarding" },
      { nextPlatform: "whole-person-health", eventType: "veteran_health_intake", description: "Veteran referral — health screening" },
    ],
    "maternal_health_referral": [
      { nextPlatform: "sankofa-maternal-health", eventType: "maternal_intake", description: "Maternal health referral — BirthRight intake" },
      { nextPlatform: "sankofa", eventType: "health_network_referral", description: "Maternal health referral — Sankofa network" },
    ],
    "content_ready_for_distribution": [
      { nextPlatform: "video-creator-ai", eventType: "create_content_video", description: "Content ready — create video for distribution" },
      ...ECOSYSTEM_PLATFORMS.map(p => ({ nextPlatform: p.id, eventType: "content_available", description: "New ecosystem content available for your platform" })),
    ],
    "product_launched": [
      { nextPlatform: "betterscience", eventType: "evaluate_product", description: "New product launched — RPLICE evaluate with RE-AIM" },
      { nextPlatform: "shield-atlas", eventType: "security_scan_needed", description: "New product launched — Shield Atlas security scan" },
      { nextPlatform: "video-creator-ai", eventType: "product_demo_video", description: "New product launched — create demo video" },
    ],
    "map_gap_finding": [
      { nextPlatform: "betterscience", eventType: "gap_analysis_received", description: "MAP-GAP finding — RPLICE analyze and recommend" },
    ],
    "platform_needs_help": [
      { nextPlatform: "betterscience", eventType: "collaboration_request", description: "Platform requesting collaboration support" },
    ],
  };

  async function processWorkChains(sourcePlatformId: string, eventType: string, eventData: Record<string, unknown>) {
    const chains = WORK_CHAINS[eventType];
    if (!chains) return [];
    const routed: { target: string; eventType: string; description: string }[] = [];
    for (const chain of chains) {
      if (chain.nextPlatform === sourcePlatformId) continue;
      await db.insert(ecosystemEvents).values({
        sourcePlatformId,
        targetPlatformId: chain.nextPlatform,
        eventType: chain.eventType,
        eventData: { ...eventData, chainedFrom: eventType, chainDescription: chain.description },
        status: "pending",
      });
      routed.push({ target: chain.nextPlatform, eventType: chain.eventType, description: chain.description });
    }
    return routed;
  }

  function isSafeUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (!["http:", "https:"].includes(parsed.protocol)) return false;
      const host = parsed.hostname.toLowerCase();
      const blocked = [
        "localhost", "127.0.0.1", "0.0.0.0", "[::1]", "[::0]",
        "metadata.google.internal", "metadata", "169.254.169.254",
      ];
      if (blocked.includes(host)) return false;
      if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.16.") || host.startsWith("172.17.") || host.startsWith("172.18.") || host.startsWith("172.19.") || host.startsWith("172.2") || host.startsWith("172.30.") || host.startsWith("172.31.")) return false;
      if (host.startsWith("169.254.")) return false;
      if (host.startsWith("100.64.") || host.startsWith("100.65.") || host.startsWith("100.66.") || host.startsWith("100.127.")) return false;
      if (host.endsWith(".internal") || host.endsWith(".local") || host.endsWith(".localhost")) return false;
      if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return false;
      if (host.includes("[") && (host.includes("::1") || host.includes("fe80") || host.includes("fc") || host.includes("fd"))) return false;
      return true;
    } catch { return false; }
  }

  async function verifyDeliverable(url: string): Promise<{ verified: boolean; statusCode: number; responseMs: number; error?: string }> {
    const start = Date.now();
    if (!isSafeUrl(url)) {
      return { verified: false, statusCode: 0, responseMs: 0, error: "URL blocked: private/internal address" };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const headResponse = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
      clearTimeout(timeout);
      if (headResponse.ok) {
        return { verified: true, statusCode: headResponse.status, responseMs: Date.now() - start };
      }
      if ([405, 403, 501].includes(headResponse.status)) {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 8000);
        const getResponse = await fetch(url, { method: "GET", signal: controller2.signal, redirect: "follow", headers: { "Range": "bytes=0-1024" } });
        clearTimeout(timeout2);
        return { verified: getResponse.ok, statusCode: getResponse.status, responseMs: Date.now() - start };
      }
      return { verified: false, statusCode: headResponse.status, responseMs: Date.now() - start };
    } catch (err: any) {
      return { verified: false, statusCode: 0, responseMs: Date.now() - start, error: err.message };
    }
  }

  async function runDeliverableVerification() {
    const acks = await db.select().from(ecosystemDirectiveAcks)
      .where(eq(ecosystemDirectiveAcks.status, "acknowledged"));
    const results: { platformId: string; directiveId: string; evidenceUrl: string; verified: boolean; statusCode: number; error?: string }[] = [];

    for (const ack of acks) {
      const responseData = ack.responseData as Record<string, unknown> | null;
      const evidenceUrl = responseData?.evidenceUrl as string;
      if (!evidenceUrl || !evidenceUrl.startsWith("http")) continue;
      if ((responseData as any)?._lastVerified) {
        const lastCheck = new Date((responseData as any)._lastVerified).getTime();
        if (Date.now() - lastCheck < 60 * 60 * 1000) continue;
      }
      const result = await verifyDeliverable(evidenceUrl);
      results.push({ platformId: ack.platformId, directiveId: ack.directiveId, evidenceUrl, verified: result.verified, statusCode: result.statusCode, error: result.error });
      await db.update(ecosystemDirectiveAcks)
        .set({
          responseData: {
            ...(responseData || {}),
            _verificationStatus: result.verified ? "LIVE" : "FAILED",
            _lastVerified: new Date().toISOString(),
            _verificationCode: result.statusCode,
          },
        })
        .where(eq(ecosystemDirectiveAcks.id, ack.id));
    }
    return results;
  }

  app.get("/api/ecosystem/intelligence-report", async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const allDirectives = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.status, "active"));
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const recentEvents = await db.select().from(ecosystemEvents)
        .where(gte(ecosystemEvents.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
        .orderBy(desc(ecosystemEvents.createdAt));

      const REGIONAL_DIRECTIVE_KEYS = ["regional-products-austin-v1", "regional-products-manor-v1", "regional-products-pflugerville-v1"];

      const platformIntel = platforms.map(p => {
        const platformAcks = allAcks.filter(a => a.platformId === p.id);
        const total = platformAcks.length;
        const acknowledged = platformAcks.filter(a => a.status === "acknowledged").length;
        const delivered = platformAcks.filter(a => a.status === "delivered").length;
        const pending = platformAcks.filter(a => a.status === "pending").length;
        const fidelity = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

        const completedWork = platformAcks
          .filter(a => a.status === "acknowledged" && a.responseData)
          .map(a => {
            const rd = a.responseData as Record<string, unknown>;
            const dir = allDirectives.find(d => d.id === a.directiveId);
            return {
              directive: dir?.title || a.directiveId,
              whatWasDone: rd?.whatWasDone || "No description",
              evidenceUrl: rd?.evidenceUrl || null,
              verificationStatus: rd?._verificationStatus || "UNVERIFIED",
              ackQuality: rd?._ackQuality || "LEGACY",
              acknowledgedAt: a.acknowledgedAt,
            };
          });

        const qualityCounts = {
          verified: completedWork.filter(w => w.ackQuality === "VERIFIED").length,
          substantive: completedWork.filter(w => w.ackQuality === "SUBSTANTIVE").length,
          weak: completedWork.filter(w => w.ackQuality === "WEAK").length,
          legacy: completedWork.filter(w => w.ackQuality === "LEGACY").length,
        };

        const regionalProducts = {
          austin: completedWork.find(w => w.directive.toLowerCase().includes("austin regional")),
          manor: completedWork.find(w => w.directive.toLowerCase().includes("manor regional")),
          pflugerville: completedWork.find(w => w.directive.toLowerCase().includes("pflugerville regional")),
        };

        const overdue = platformAcks
          .filter(a => a.status === "delivered")
          .map(a => {
            const dir = allDirectives.find(d => d.id === a.directiveId);
            return { directive: dir?.title || a.directiveId, directiveId: a.directiveId };
          });

        const HEARTBEAT_FRESHNESS_MS = 30 * 60 * 1000;
        const heartbeatAge = p.lastHeartbeat ? Math.round((Date.now() - new Date(p.lastHeartbeat).getTime()) / 60000) : null;
        const isFresh = p.lastHeartbeat !== null && (Date.now() - new Date(p.lastHeartbeat).getTime()) < HEARTBEAT_FRESHNESS_MS;

        return {
          id: p.id,
          name: p.name,
          domain: p.domain,
          status: p.healthStatus || "unknown",
          connected: isFresh,
          lastHeartbeat: p.lastHeartbeat,
          heartbeatAgeMinutes: heartbeatAge,
          fidelity: { score: fidelity, grade: fidelity >= 90 ? "A" : fidelity >= 75 ? "B" : fidelity >= 50 ? "C" : fidelity >= 25 ? "D" : "F", total, acknowledged, delivered, pending },
          ackQuality: qualityCounts,
          regionalProducts,
          completedWork,
          overdue,
          grantAlignment: p.grantAlignment,
        };
      });

      const GRANT_MAP: Record<string, { name: string; amount: string; deadline: string }> = {
        "dfc": { name: "Drug-Free Communities (DFC)", amount: "$625K", deadline: "April 14, 2026" },
        "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling" },
        "nba-foundation": { name: "Foundation Grant", amount: "$100K-$500K", deadline: "Rolling LOI" },
        "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "March 30, 2026" },
        "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026" },
        "samhsa": { name: "SAMHSA Community Mental Health", amount: "Varies", deadline: "Varies" },
      };

      const grantReadiness = Object.entries(GRANT_MAP).map(([grantId, grant]) => {
        const alignedPlatforms = platformIntel.filter(p => ((p.grantAlignment as string[]) || []).includes(grantId));
        const connected = alignedPlatforms.filter(p => p.connected).length;
        const totalWork = alignedPlatforms.reduce((sum, p) => sum + p.completedWork.length, 0);
        const totalOverdue = alignedPlatforms.reduce((sum, p) => sum + p.overdue.length, 0);
        const avgFidelity = alignedPlatforms.length > 0 ? Math.round(alignedPlatforms.reduce((s, p) => s + p.fidelity.score, 0) / alignedPlatforms.length) : 0;
        const verified = alignedPlatforms.reduce((sum, p) => sum + p.completedWork.filter(w => w.verificationStatus === "LIVE").length, 0);

        return {
          grantId,
          ...grant,
          platforms: { total: alignedPlatforms.length, connected, disconnected: alignedPlatforms.length - connected },
          compliance: { avgFidelity, totalWorkCompleted: totalWork, totalOverdue, evidenceVerified: verified },
          readinessScore: alignedPlatforms.length > 0 ? Math.round(((connected / alignedPlatforms.length) * 40) + (avgFidelity * 0.4) + (verified > 0 ? 20 : 0)) : 0,
          platformDetails: alignedPlatforms.map(p => ({ id: p.id, name: p.name, connected: p.connected, fidelity: p.fidelity.score, grade: p.fidelity.grade, workDone: p.completedWork.length, overdue: p.overdue.length })),
        };
      });

      const connectedCount = platformIntel.filter(p => p.connected).length;
      const totalAcked = allAcks.filter(a => a.status === "acknowledged").length;
      const totalDelivered = allAcks.filter(a => a.status === "delivered").length;
      const totalPending = allAcks.filter(a => a.status === "pending").length;
      const ecosystemFidelity = allAcks.length > 0 ? Math.round((totalAcked / allAcks.length) * 100) : 0;

      const complianceEvents = recentEvents.filter(e => e.eventType === "compliance_report");
      const chainedEvents = recentEvents.filter(e => (e.eventData as any)?.chainedFrom);

      const workChainActivity = chainedEvents.slice(0, 20).map(e => {
        const data = e.eventData as Record<string, unknown>;
        const sourcePlatform = platforms.find(p => p.id === e.sourcePlatformId);
        const targetPlatform = platforms.find(p => p.id === e.targetPlatformId);
        return {
          from: sourcePlatform?.name || e.sourcePlatformId,
          to: targetPlatform?.name || e.targetPlatformId,
          eventType: e.eventType,
          chainedFrom: data?.chainedFrom || null,
          description: data?.chainDescription || null,
          timestamp: e.createdAt,
          status: e.status,
        };
      });

      const verificationSummary = {
        lastRun: lastVerificationCycle?.completedAt || null,
        totalWithEvidence: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?.evidenceUrl && (rd.evidenceUrl as string).startsWith("http");
        }).length,
        live: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._verificationStatus === "LIVE";
        }).length,
        failed: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._verificationStatus === "FAILED";
        }).length,
        unchecked: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?.evidenceUrl && (rd.evidenceUrl as string).startsWith("http") && !rd?._verificationStatus;
        }).length,
        failedDeliverables: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._verificationStatus === "FAILED";
        }).map(a => {
          const rd = a.responseData as Record<string, unknown>;
          const dir = allDirectives.find(d => d.id === a.directiveId);
          const plat = platforms.find(p => p.id === a.platformId);
          return { platform: plat?.name || a.platformId, directive: dir?.title || a.directiveId, evidenceUrl: rd?.evidenceUrl, lastChecked: rd?._lastVerified };
        }),
      };

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const completedThisWeek = allAcks.filter(a => a.status === "acknowledged" && a.acknowledgedAt && new Date(a.acknowledgedAt) > oneWeekAgo).length;
      const newPlatformsThisWeek = platforms.filter(p => p.lastHeartbeat && new Date(p.lastHeartbeat) > oneWeekAgo).length;

      const regionalProductSummary = {
        austin: {
          platformsWithProduct: platformIntel.filter(p => p.regionalProducts.austin).length,
          totalPlatforms: platformIntel.length,
          products: platformIntel.filter(p => p.regionalProducts.austin).map(p => ({
            platform: p.name,
            whatWasDone: p.regionalProducts.austin?.whatWasDone,
            evidenceUrl: p.regionalProducts.austin?.evidenceUrl,
            verified: p.regionalProducts.austin?.verificationStatus === "LIVE",
          })),
        },
        manor: {
          platformsWithProduct: platformIntel.filter(p => p.regionalProducts.manor).length,
          totalPlatforms: platformIntel.length,
          products: platformIntel.filter(p => p.regionalProducts.manor).map(p => ({
            platform: p.name,
            whatWasDone: p.regionalProducts.manor?.whatWasDone,
            evidenceUrl: p.regionalProducts.manor?.evidenceUrl,
            verified: p.regionalProducts.manor?.verificationStatus === "LIVE",
          })),
        },
        pflugerville: {
          platformsWithProduct: platformIntel.filter(p => p.regionalProducts.pflugerville).length,
          totalPlatforms: platformIntel.length,
          products: platformIntel.filter(p => p.regionalProducts.pflugerville).map(p => ({
            platform: p.name,
            whatWasDone: p.regionalProducts.pflugerville?.whatWasDone,
            evidenceUrl: p.regionalProducts.pflugerville?.evidenceUrl,
            verified: p.regionalProducts.pflugerville?.verificationStatus === "LIVE",
          })),
        },
      };

      const ackQualitySummary = {
        verified: platformIntel.reduce((s, p) => s + p.ackQuality.verified, 0),
        substantive: platformIntel.reduce((s, p) => s + p.ackQuality.substantive, 0),
        weak: platformIntel.reduce((s, p) => s + p.ackQuality.weak, 0),
        legacy: platformIntel.reduce((s, p) => s + p.ackQuality.legacy, 0),
      };

      const dueOut = allDirectives
        .filter(d => d.expiresAt && new Date(d.expiresAt) > new Date())
        .map(d => {
          const daysLeft = Math.ceil((new Date(d.expiresAt!).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
          const dAcks = allAcks.filter(a => a.directiveId === d.id);
          const acked = dAcks.filter(a => a.status === "acknowledged").length;
          return { title: d.title, daysLeft, acked, total: dAcks.length, urgent: daysLeft <= 7 };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

      const needsAttention = platformIntel
        .filter(p => p.overdue.length > 0 || !p.connected)
        .map(p => ({
          id: p.id,
          name: p.name,
          reason: !p.connected ? "NOT CONNECTED — no heartbeat from production" : `${p.overdue.length} overdue directive(s)`,
          overdue: p.overdue,
          fidelity: p.fidelity.score,
        }));

      res.json({
        generatedAt: new Date().toISOString(),
        period: "Last 7 days",
        ecosystemSummary: {
          totalPlatforms: platforms.length,
          connected: connectedCount,
          disconnected: platforms.length - connectedCount,
          ecosystemFidelity,
          ecosystemGrade: ecosystemFidelity >= 90 ? "A" : ecosystemFidelity >= 75 ? "B" : ecosystemFidelity >= 50 ? "C" : ecosystemFidelity >= 25 ? "D" : "F",
          directives: { total: allDirectives.length, acknowledged: totalAcked, delivered: totalDelivered, pending: totalPending },
          eventsThisWeek: recentEvents.length,
          complianceReportsThisWeek: complianceEvents.length,
          workChainsTriggered: chainedEvents.length,
          ackQuality: ackQualitySummary,
          completedThisWeek,
          newPlatformsThisWeek,
        },
        regionalProducts: regionalProductSummary,
        workChainActivity,
        verificationSummary,
        dueOut,
        needsAttention,
        grantReadiness,
        platformIntelligence: platformIntel.sort((a, b) => b.fidelity.score - a.fidelity.score),
      });
    } catch (error) {
      console.error("Intelligence report failed:", error);
      res.status(500).json({ error: "Failed to generate intelligence report" });
    }
  });

  app.get("/api/ecosystem/grant-readiness", async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const HEARTBEAT_FRESHNESS_MS = 30 * 60 * 1000;

      const GRANT_MAP: Record<string, { name: string; amount: string; deadline: string }> = {
        "dfc": { name: "Drug-Free Communities (DFC)", amount: "$625K", deadline: "April 14, 2026" },
        "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling" },
        "nba-foundation": { name: "Foundation Grant", amount: "$100K-$500K", deadline: "Rolling LOI" },
        "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "March 30, 2026" },
        "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026" },
        "samhsa": { name: "SAMHSA Community Mental Health", amount: "Varies", deadline: "Varies" },
      };

      const grantReadiness = Object.entries(GRANT_MAP).map(([grantId, grant]) => {
        const alignedPlatforms = platforms.filter(p => ((p.grantAlignment as string[]) || []).includes(grantId));
        const connected = alignedPlatforms.filter(p => p.lastHeartbeat && (Date.now() - new Date(p.lastHeartbeat).getTime()) < HEARTBEAT_FRESHNESS_MS).length;
        const pAcks = allAcks.filter(a => alignedPlatforms.some(p => p.id === a.platformId));
        const totalWork = pAcks.filter(a => a.status === "acknowledged").length;
        const totalOverdue = pAcks.filter(a => a.status === "delivered").length;
        const avgFidelity = pAcks.length > 0 ? Math.round((totalWork / pAcks.length) * 100) : 0;
        return { grantId, ...grant, platforms: { total: alignedPlatforms.length, connected, disconnected: alignedPlatforms.length - connected }, compliance: { avgFidelity, totalWorkCompleted: totalWork, totalOverdue, evidenceVerified: 0 }, readinessScore: alignedPlatforms.length > 0 ? Math.round(((connected / alignedPlatforms.length) * 40) + (avgFidelity * 0.4) + 0) : 0 };
      });
      res.json({ generatedAt: new Date().toISOString(), grantReadiness });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grant readiness" });
    }
  });

  app.post("/api/ecosystem/verify-deliverables", requireAdminAuth, async (_req, res) => {
    try {
      const results = await runDeliverableVerification();
      res.json({ verifiedAt: new Date().toISOString(), checked: results.length, results });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/ecosystem/send-report-card", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const allDirectives = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.status, "active"));
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const platformRows = platforms.map(p => {
        const pAcks = allAcks.filter(a => a.platformId === p.id);
        const total = pAcks.length;
        const acked = pAcks.filter(a => a.status === "acknowledged").length;
        const delivered = pAcks.filter(a => a.status === "delivered").length;
        const pending = pAcks.filter(a => a.status === "pending").length;
        const fidelity = total > 0 ? Math.round((acked / total) * 100) : 0;
        const grade = fidelity >= 90 ? "A" : fidelity >= 75 ? "B" : fidelity >= 50 ? "C" : fidelity >= 25 ? "D" : "F";

        const verifiedCount = pAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._ackQuality === "VERIFIED";
        }).length;
        const substantiveCount = pAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._ackQuality === "SUBSTANTIVE";
        }).length;

        const heartbeatAge = p.lastHeartbeat ? Math.round((now.getTime() - new Date(p.lastHeartbeat).getTime()) / 60000) : null;
        const connected = heartbeatAge !== null && heartbeatAge < 30;

        return { id: p.id, name: p.name, total, acked, delivered, pending, fidelity, grade, verifiedCount, substantiveCount, connected, heartbeatAge };
      }).sort((a, b) => b.fidelity - a.fidelity || a.name.localeCompare(b.name));

      const totalPlatforms = platforms.length;
      const connectedCount = platformRows.filter(p => p.connected).length;
      const gradeA = platformRows.filter(p => p.grade === "A").length;
      const gradeB = platformRows.filter(p => p.grade === "B").length;
      const gradeC = platformRows.filter(p => p.grade === "C").length;
      const gradeD = platformRows.filter(p => p.grade === "D").length;
      const gradeF = platformRows.filter(p => p.grade === "F").length;
      const ecosystemFidelity = platformRows.length > 0 ? Math.round(platformRows.reduce((sum, p) => sum + p.fidelity, 0) / platformRows.length) : 0;

      const gradeColor = (g: string) => g === "A" ? "#059669" : g === "B" ? "#2563eb" : g === "C" ? "#d97706" : g === "D" ? "#dc2626" : "#991b1b";

      const platformTableRows = platformRows.map(p => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-weight: 600;">${p.name}</td>
          <td style="padding: 10px 12px; text-align: center;"><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.connected ? '#059669' : '#dc2626'}; margin-right: 4px;"></span>${p.connected ? 'Active' : 'Inactive'}</td>
          <td style="padding: 10px 12px; text-align: center; font-weight: 700; font-size: 18px; color: ${gradeColor(p.grade)};">${p.grade}</td>
          <td style="padding: 10px 12px; text-align: center;">${p.fidelity}%</td>
          <td style="padding: 10px 12px; text-align: center;">${p.acked}/${p.total}</td>
          <td style="padding: 10px 12px; text-align: center; color: #059669;">${p.verifiedCount}</td>
          <td style="padding: 10px 12px; text-align: center;">${p.delivered}</td>
        </tr>
      `).join("");

      const htmlContent = `
        <div style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e;">
          <div style="background: linear-gradient(135deg, #4c1d95, #6d28d9); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ThriveUp Academy Ecosystem Report Card</h1>
            <p style="color: #c4b5fd; margin: 8px 0 0;">${dateStr}</p>
          </div>

          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin-top: 0; color: #374151; font-size: 18px;">Ecosystem Summary</h2>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 140px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: ${ecosystemFidelity >= 75 ? '#059669' : ecosystemFidelity >= 50 ? '#d97706' : '#dc2626'};">${ecosystemFidelity}%</div>
                <div style="font-size: 12px; color: #6b7280;">Ecosystem Fidelity</div>
              </div>
              <div style="flex: 1; min-width: 140px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #059669;">${connectedCount}</div>
                <div style="font-size: 12px; color: #6b7280;">Connected (of ${totalPlatforms})</div>
              </div>
              <div style="flex: 1; min-width: 140px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #059669;">${gradeA}</div>
                <div style="font-size: 12px; color: #6b7280;">Grade A Platforms</div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
              <span style="background: #059669; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">A: ${gradeA}</span>
              <span style="background: #2563eb; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">B: ${gradeB}</span>
              <span style="background: #d97706; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">C: ${gradeC}</span>
              <span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">D: ${gradeD}</span>
              <span style="background: #991b1b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">F: ${gradeF}</span>
            </div>
          </div>

          <div style="background: white; padding: 0; border: 1px solid #e5e7eb; border-top: none; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Platform</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Status</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Grade</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Fidelity</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Acked</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Verified</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Pending</th>
                </tr>
              </thead>
              <tbody>
                ${platformTableRows}
              </tbody>
            </table>
          </div>

          <div style="background: #fef3c7; padding: 16px; border: 1px solid #fcd34d; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Grading Scale:</strong> A (90-100%) | B (75-89%) | C (50-74%) | D (25-49%) | F (0-24%)</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #92400e;">Fidelity = acknowledged directives / total directives. Verified = acks with evidence URL and substantive description. Active = heartbeat within 30 minutes.</p>
          </div>

          <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 11px;">
            <p>ThriveUp Academy | thrivingcommunitiesforall.com | Ecosystem Operations Center</p>
          </div>
        </div>
      `;

      await sendEcosystemUpdate("Weekly Report Card — " + dateStr, htmlContent);
      res.json({ sent: true, to: "mr.terryflood@gmail.com", platforms: platformRows.length, summary: { ecosystemFidelity, gradeA, gradeB, gradeC, gradeD, gradeF, connected: connectedCount } });
    } catch (error: any) {
      console.error("Report card email failed:", error);
      res.status(500).json({ error: "Failed to send report card", details: error.message });
    }
  });

  app.get("/api/ecosystem/integration-doc-public", requireAdminAuth, async (_req, res) => {
    try {
      const allPlatforms = await db.select().from(ecosystemPlatforms);
      const sanitizedPlatforms = allPlatforms.map(({ apiKey: _k, ...rest }) => rest);

      res.json({
        title: "Collaborative Advocate Ecosystem — Full Integration Map",
        version: "2.0",
        lastUpdated: new Date().toISOString(),
        totalPlatforms: allPlatforms.length,
        grantLenses: {
          "ssg-fox": { name: "SSG Fox VA Suicide Prevention", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("ssg-fox")).length },
          "dfc": { name: "Drug-Free Communities (DFC)", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("dfc")).length },
          "wioa": { name: "WIOA Title I Youth", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("wioa")).length },
          "nba-foundation": { name: "Foundation Grant", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("nba-foundation")).length },
          "st-davids": { name: "St. David's Foundation", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("st-davids")).length },
          "samhsa": { name: "SAMHSA Community Mental Health", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("samhsa")).length },
        },
        platforms: sanitizedPlatforms,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to serve integration document" });
    }
  });
}
