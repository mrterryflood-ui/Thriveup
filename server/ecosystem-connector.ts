import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { ecosystemPlatforms, ecosystemEvents, ecosystemHealthLogs } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";

const heartbeatSchema = z.object({
  platformId: z.string().max(100).optional(),
  metrics: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
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
    id: "life-transitions-aid",
    name: "Life Transitions Aid",
    url: "https://life-transitions-aid--mrterryflood.replit.app",
    role: "life-support",
    domain: "health-equity",
    description: "Addresses non-combat life events that drive veteran suicide — divorce, job loss, retirement, health diagnosis, bereavement, financial crisis. Meets the 60% not connected to VA care.",
    capabilities: {
      lifeEvents: ["Divorce", "Job Loss", "Retirement", "Health Diagnosis", "Bereavement", "Financial Crisis", "Relocation", "Identity Shifts"],
      features: ["Life Event Guides", "Coping Strategies", "Peer Stories", "Resource Matching", "Where Am I Assessment"],
    },
    dataFlowConfig: {
      sends: ["life_event_assessments", "risk_indicators", "resource_needs", "peer_connections"],
      receives: ["screening_results", "transition_status", "crisis_alerts", "workforce_pathways"],
    },
    grantAlignment: ["ssg-fox", "samhsa", "st-davids"],
  },
  {
    id: "salp-science",
    name: "SALP Science",
    url: "https://salp-science--mrterryflood.replit.app",
    role: "evidence-base",
    domain: "education",
    description: "Clinical and research backbone. Safety assessment methodologies, lethality risk frameworks, implementation science (CFIR, RE-AIM, EPIS), grant-aligned documentation.",
    capabilities: {
      frameworks: ["CFIR", "RE-AIM", "EPIS", "NPT", "PRISM"],
      protocols: ["C-SSRS Implementation", "Stanley-Brown Safety Planning", "Means Safety", "QPR"],
      features: ["Research Summaries", "Clinical Protocols", "Implementation Guides", "Outcome Measurement", "Grant Documentation"],
    },
    dataFlowConfig: {
      sends: ["research_updates", "protocol_revisions", "outcome_frameworks", "fidelity_benchmarks"],
      receives: ["screening_aggregates", "intervention_outcomes", "implementation_fidelity", "program_metrics"],
    },
    grantAlignment: ["ssg-fox", "samhsa", "dfc"],
  },
  {
    id: "easyai-learning",
    name: "EasyAI Learning",
    url: "https://easyailearning.com",
    role: "prevention",
    domain: "education",
    description: "Upstream prevention through purpose, education, and workforce development for youth 14-24. AI literacy, career pathways, mentorship. Protective factor: a future worth living for.",
    capabilities: {
      features: ["AI Literacy Education", "Workforce Pathways", "Mentorship Matching", "Project-Based Learning", "Career Exploration"],
      targetPopulation: "Under-resourced youth 14-24, children of veterans, transitioning service members under 25",
    },
    dataFlowConfig: {
      sends: ["enrollment_status", "progress_milestones", "mentor_connections", "career_pathway_updates"],
      receives: ["veteran_family_referrals", "transition_youth_referrals", "crisis_alerts", "screening_flags"],
    },
    grantAlignment: ["ssg-fox", "wioa", "nba-foundation", "st-davids", "dfc"],
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
    description: "Virtual 211 and Community Health Worker hub. 24/7 resource navigation — housing, food, healthcare, mental health, substance abuse, domestic violence, crisis support.",
    capabilities: {
      features: ["24/7 Resource Navigation", "Housing Assistance", "Food Access", "Healthcare Connections", "Mental Health Resources", "Substance Abuse Support", "Domestic Violence Support", "Crisis Support"],
    },
    dataFlowConfig: {
      sends: ["resource_referrals", "crisis_interventions", "social_determinant_data", "community_needs"],
      receives: ["case_management_data", "health_screenings", "early_warning_flags", "prevention_alerts"],
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

      res.json({
        acknowledged: true,
        platformId: platform.id,
        pendingEvents: pendingEvents,
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Heartbeat failed:", error);
      res.status(500).json({ error: "Heartbeat failed" });
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
      const onlineCount = platforms.filter((p) => p.healthStatus === "online").length;
      const totalEvents = await db.select({ count: sql`count(*)` }).from(ecosystemEvents);
      const recentEvents = await db.select({ count: sql`count(*)` }).from(ecosystemEvents)
        .where(gte(ecosystemEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

      res.json({
        totalPlatforms: platforms.length,
        onlinePlatforms: onlineCount,
        totalEvents: Number(totalEvents[0]?.count || 0),
        eventsLast24h: Number(recentEvents[0]?.count || 0),
        platforms: platforms.map((p) => ({
          id: p.id,
          name: p.name,
          url: p.url,
          role: p.role,
          domain: p.domain,
          status: p.status,
          healthStatus: p.healthStatus,
          lastHeartbeat: p.lastHeartbeat,
          lastHealthCheck: p.lastHealthCheck,
          grantAlignment: p.grantAlignment,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ecosystem status" });
    }
  });

  app.get("/api/ecosystem/integration-snippet/:platformId", requireAdminAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: "Platform not found" });
      }

      const thriveDomain = process.env.REPLIT_DOMAINS?.split(",")[0] || "thrivingcommunitiesforall.com";
      const baseUrl = `https://${thriveDomain}`;

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
          "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026", platforms: ["whole-person-health", "mission-transition", "life-transitions-aid", "salp-science", "easyai-learning", "m2c", "lifebridge", "sankofa", "safecognicare", "pillscheduler", "betterscience"] },
          "dfc": { name: "Drug-Free Communities (DFC)", amount: "$625K", deadline: "April 14, 2026", platforms: ["whole-person-health", "isss", "sankofa", "wholemind", "salp-science", "easyai-learning", "safereport", "lifebridge", "pillscheduler", "betterscience"] },
          "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling", platforms: ["easyai-learning", "isss", "wholemind", "mission-transition", "m2c", "mce", "whole-person-health"] },
          "nba-foundation": { name: "NBA Foundation", amount: "$100K-$500K", deadline: "Rolling LOI", platforms: ["easyai-learning", "isss", "wholemind"] },
          "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "Opens March 30, 2026", platforms: ["whole-person-health", "life-transitions-aid", "sankofa", "easyai-learning", "perfectly-different", "safecognicare", "lifebridge"] },
          "samhsa": { name: "SAMHSA Community Mental Health", amount: "Varies", deadline: "Varies", platforms: ["whole-person-health", "sankofa", "life-transitions-aid", "salp-science", "perfectly-different", "safecognicare", "pillscheduler", "betterscience", "lifebridge"] },
        },
        crisisContinuum: {
          phase1_prevention: { name: "Prevention & Preparedness", platforms: ["easyai-learning", "mission-transition", "whole-person-health", "salp-science", "wholemind", "isss"], description: "Purpose, skills, pathways for youth; pre-separation planning; preparedness plans; evidence base for prevention strategies" },
          phase2_earlyWarning: { name: "Early Warning", platforms: ["whole-person-health", "life-transitions-aid", "sankofa", "perfectly-different", "safecognicare"], description: "C-SSRS, PHQ-9, GAD-7, PCL-5 screenings; life event self-assessment; MAP-GAP 7-domain assessment; cognitive and neurodevelopmental monitoring" },
          phase3_crisisSupport: { name: "Crisis Support", platforms: ["whole-person-health", "lifebridge", "safereport"], description: "988 Veterans Crisis Line; Crisis Text Line; Reach a Vet peer support; Safety Plan Builder; Quick Exit; 24/7 resource navigation; mandatory reporting" },
          phase4_stabilization: { name: "Stabilization", platforms: ["whole-person-health", "lifebridge", "pillscheduler", "sankofa"], description: "Care Summary Generator; Find Help (20,670+ resources); Refer-a-Patient; medication management; VA facility connections" },
          phase5_recovery: { name: "Recovery & Growth", platforms: ["whole-person-health", "life-transitions-aid", "mission-transition", "easyai-learning", "mce", "salp-science"], description: "Community groups (2,091+); peer stories; condition guides; ongoing life navigation; career pathways; business formation; outcome measurement" },
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
