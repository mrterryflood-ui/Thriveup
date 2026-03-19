import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { ecosystemPlatforms, ecosystemEvents, ecosystemHealthLogs, ecosystemDirectives, ecosystemDirectiveAcks } from "@shared/schema";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { seedEcosystemDirectives } from "./ecosystem-directives-seed";

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
    id: "mission-transition",
    name: "Mission Transition",
    url: "https://mission-transition--mrterryflood.replit.app",
    role: "transition",
    domain: "veterans",
    description: "Covers the highest-risk period — military-to-civilian transition. Career translation, benefits navigation, housing/financial planning, identity transition support.",
    capabilities: {
      features: ["Transition Timeline", "MOS/AFSC Translation", "Benefits Navigation", "Housing Planning", "Community Connection", "Identity Support"],
      targetPopulation: "Active duty approaching separation, recently separated (0-24 months), Guard/Reserve, military spouses",
      riskWindow: "First 12 months post-separation — highest suicide risk period",
    },
    dataFlowConfig: {
      sends: ["transition_milestones", "separation_timeline", "benefits_enrollment", "career_matches"],
      receives: ["screening_results", "crisis_alerts", "workforce_pathways", "life_event_triggers"],
    },
    grantAlignment: ["ssg-fox", "wioa"],
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
    name: "M2C Transition",
    url: "https://vetmissiontransition.com",
    role: "veteran-transition",
    domain: "veterans",
    description: "Free veteran support platform for military-to-civilian transition. Transition planning, benefits guidance, military skills translation, community connections, family support.",
    capabilities: {
      features: ["Transition Planning Tools", "Benefits Guidance", "Military Skills Translation", "Community Connections", "Military Family Support", "Resource Curation"],
    },
    dataFlowConfig: {
      sends: ["transition_plans", "skills_assessments", "benefits_status", "community_referrals"],
      receives: ["workforce_pathways", "health_screenings", "crisis_alerts", "family_support_data"],
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
    } catch (err) {
      console.error("[Ecosystem] Auto-sync failed:", err);
    }

    // Start the outbound platform pinger after a short delay
    setTimeout(() => startPlatformPinger(), 10000);
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
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
      if (!platform) {
        return res.status(403).json({ error: "Invalid ecosystem key" });
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

      const newStatus = status || "acknowledged";
      await db.update(ecosystemDirectiveAcks)
        .set({
          status: newStatus,
          acknowledgedAt: new Date(),
          responseData: req.body.responseData || req.body.notes || null,
        })
        .where(eq(ecosystemDirectiveAcks.id, ack.id));

      const [directive] = await db.select().from(ecosystemDirectives)
        .where(eq(ecosystemDirectives.id, directiveId));

      const remaining = await db.select().from(ecosystemDirectiveAcks)
        .where(and(
          eq(ecosystemDirectiveAcks.platformId, platformId),
          sql`${ecosystemDirectiveAcks.status} != 'acknowledged'`,
        ));

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

      res.json({
        received: true,
        handshake: "confirmed",
        hubVerification: {
          message: `Hub confirms: ${platformId} acknowledged directive "${directive?.title || directiveId}".`,
          whatHubRecorded: {
            directiveTitle: directive?.title || directiveId,
            platformId,
            status: newStatus,
            responseData: req.body.responseData || req.body.notes || null,
            recordedAt: new Date().toISOString(),
          },
          validationStatus: (req.body.responseData || req.body.notes)
            ? "VERIFIED — Hub recorded your work description. This counts toward fidelity."
            : "PARTIAL — Acknowledged but no work description provided. Include responseData: { whatWasDone: '...' } for full fidelity credit.",
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
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

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
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
      if (!platform) {
        return res.status(403).json({ error: "Invalid ecosystem key" });
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

      res.json({ eventId: event.id, status: "queued" });
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
          "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026", platforms: ["whole-person-health", "mission-transition", "m2c", "lifebridge", "sankofa", "safecognicare", "pillscheduler", "betterscience"] },
          "dfc": { name: "Drug-Free Communities (DFC)", amount: "$625K", deadline: "April 14, 2026", platforms: ["whole-person-health", "isss", "sankofa", "wholemind", "safereport", "lifebridge", "pillscheduler", "betterscience"] },
          "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling", platforms: ["isss", "wholemind", "mission-transition", "m2c", "mce", "whole-person-health"] },
          "nba-foundation": { name: "NBA Foundation", amount: "$100K-$500K", deadline: "Rolling LOI", platforms: ["isss", "wholemind"] },
          "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "Opens March 30, 2026", platforms: ["whole-person-health", "sankofa", "perfectly-different", "safecognicare", "lifebridge"] },
          "samhsa": { name: "SAMHSA Community Mental Health", amount: "Varies", deadline: "Varies", platforms: ["whole-person-health", "sankofa", "perfectly-different", "safecognicare", "pillscheduler", "betterscience", "lifebridge"] },
        },
        crisisContinuum: {
          phase1_prevention: { name: "Prevention & Preparedness", platforms: ["mission-transition", "whole-person-health", "wholemind", "isss", "betterscience"], description: "Purpose, skills, pathways for youth; pre-separation planning; preparedness plans; evidence base for prevention strategies" },
          phase2_earlyWarning: { name: "Early Warning", platforms: ["whole-person-health", "lifebridge", "sankofa", "perfectly-different", "safecognicare"], description: "C-SSRS, PHQ-9, GAD-7, PCL-5 screenings; life event self-assessment; MAP-GAP 7-domain assessment; cognitive and neurodevelopmental monitoring" },
          phase3_crisisSupport: { name: "Crisis Support", platforms: ["whole-person-health", "lifebridge", "safereport"], description: "988 Veterans Crisis Line; Crisis Text Line; Reach a Vet peer support; Safety Plan Builder; Quick Exit; 24/7 resource navigation; mandatory reporting" },
          phase4_stabilization: { name: "Stabilization", platforms: ["whole-person-health", "lifebridge", "pillscheduler", "sankofa"], description: "Care Summary Generator; Find Help (20,670+ resources); Refer-a-Patient; medication management; VA facility connections" },
          phase5_recovery: { name: "Recovery & Growth", platforms: ["whole-person-health", "lifebridge", "mission-transition", "mce", "betterscience"], description: "Community groups (2,091+); peer stories; condition guides; ongoing life navigation; career pathways; business formation; outcome measurement" },
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
          "nba-foundation": { name: "NBA Foundation", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("nba-foundation")).length },
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
