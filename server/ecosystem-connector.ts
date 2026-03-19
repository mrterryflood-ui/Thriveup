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

const FOX_ECOSYSTEM_PLATFORMS = [
  {
    id: "whole-person-health",
    name: "Whole-Person Health Ecosystem",
    url: "https://mentalwellnesssupport.net",
    role: "hub",
    description: "The connective tissue — screenings (C-SSRS, PHQ-9, GAD-7, PCL-5), safety plans, Reach a Vet, 20,670+ resources, MAP-GAP assessment. Every platform routes through it.",
    capabilities: {
      screenings: ["C-SSRS", "PHQ-9", "GAD-7", "PCL-5"],
      features: ["Safety Plan Builder", "Preparedness Plan", "Reach a Vet", "Find Help", "Care Summary", "Crisis Tools", "Quick Exit"],
      resources: 20670,
      communityGroups: 2091,
      conditionGuides: 60,
      populationHubs: 19,
      offlineCapable: true,
    },
    dataFlowConfig: {
      sends: ["screening_results", "safety_plan_status", "resource_referrals", "crisis_events", "care_summaries"],
      receives: ["veteran_profiles", "transition_status", "life_event_assessments", "research_updates", "youth_referrals"],
    },
  },
  {
    id: "mission-transition",
    name: "Mission Transition",
    url: "https://mission-transition--mrterryflood.replit.app",
    role: "transition",
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
  },
  {
    id: "life-transitions-aid",
    name: "Life Transitions Aid",
    url: "https://life-transitions-aid--mrterryflood.replit.app",
    role: "life-support",
    description: "Addresses non-combat life events that drive veteran suicide — divorce, job loss, retirement, health diagnosis, bereavement, financial crisis. Meets the 60% not connected to VA care.",
    capabilities: {
      lifeEvents: ["Divorce", "Job Loss", "Retirement", "Health Diagnosis", "Bereavement", "Financial Crisis", "Relocation", "Identity Shifts"],
      features: ["Life Event Guides", "Coping Strategies", "Peer Stories", "Resource Matching", "Where Am I Assessment"],
    },
    dataFlowConfig: {
      sends: ["life_event_assessments", "risk_indicators", "resource_needs", "peer_connections"],
      receives: ["screening_results", "transition_status", "crisis_alerts", "workforce_pathways"],
    },
  },
  {
    id: "salp-science",
    name: "SALP Science",
    url: "https://salp-science--mrterryflood.replit.app",
    role: "evidence-base",
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
  },
  {
    id: "easyai-learning",
    name: "EasyAI Learning",
    url: "https://easyailearning.com",
    role: "prevention",
    description: "Upstream prevention through purpose, education, and workforce development for youth 14-24. AI literacy, career pathways, mentorship. Protective factor: a future worth living for.",
    capabilities: {
      features: ["AI Literacy Education", "Workforce Pathways", "Mentorship Matching", "Project-Based Learning", "Career Exploration"],
      targetPopulation: "Under-resourced youth 14-24, children of veterans, transitioning service members under 25",
    },
    dataFlowConfig: {
      sends: ["enrollment_status", "progress_milestones", "mentor_connections", "career_pathway_updates"],
      receives: ["veteran_family_referrals", "transition_youth_referrals", "crisis_alerts", "screening_flags"],
    },
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
      for (const platform of FOX_ECOSYSTEM_PLATFORMS) {
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
          description: platform.description,
          status: "registered",
          healthStatus: "unknown",
          capabilities: platform.capabilities,
          dataFlowConfig: platform.dataFlowConfig,
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
          status: p.status,
          healthStatus: p.healthStatus,
          lastHeartbeat: p.lastHeartbeat,
          lastHealthCheck: p.lastHealthCheck,
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

      const snippet = `
// ============================================================
// ThriveUp Ecosystem Connector — ${platform.name}
// Generated: ${new Date().toISOString()}
// Platform ID: ${platform.id}
// Role: ${platform.role}
// ============================================================
// Add this to your server startup or a dedicated integration file.
// This code enables your platform to:
//   1. Send heartbeats so ThriveUp knows you're online
//   2. Send events when important things happen (screenings, referrals, etc.)
//   3. Receive pending events from other ecosystem platforms
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "${baseUrl}",
  platformId: "${platform.id}",
  apiKey: "${platform.apiKey}",
  heartbeatIntervalMs: 5 * 60 * 1000, // every 5 minutes
};

// --- Heartbeat: Tells ThriveUp this platform is alive ---
async function sendHeartbeat(metrics = {}) {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/heartbeat\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey,
      },
      body: JSON.stringify({
        platformId: THRIVE_ECOSYSTEM_CONFIG.platformId,
        metrics,
        timestamp: new Date().toISOString(),
      }),
    });
    const data = await response.json();

    // Process any pending events from ThriveUp or other platforms
    if (data.pendingEvents && data.pendingEvents.length > 0) {
      for (const event of data.pendingEvents) {
        await handleIncomingEvent(event);
      }
    }
    return data;
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Heartbeat failed:", error.message);
  }
}

// --- Send Event: Notify ThriveUp when something important happens ---
async function sendEcosystemEvent(eventType, eventData, targetPlatformId = null) {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/event\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey,
      },
      body: JSON.stringify({ eventType, eventData, targetPlatformId }),
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Event send failed:", error.message);
  }
}

// --- Handle Incoming Events from other platforms ---
async function handleIncomingEvent(event) {
  console.log(\`[ThriveUp Ecosystem] Received event: \${event.eventType} from \${event.sourcePlatformId}\`);
  // Add your platform-specific event handling here
  // Example event types you might receive:
  // - "screening_completed" (from Whole-Person Health)
  // - "crisis_alert" (from any platform)
  // - "veteran_referred" (from Mission Transition)
  // - "research_update" (from SALP Science)
}

// --- Start heartbeat loop ---
setInterval(() => sendHeartbeat(), THRIVE_ECOSYSTEM_CONFIG.heartbeatIntervalMs);
sendHeartbeat(); // Send first heartbeat immediately

// --- Example: Send events when your platform does something ---
// Uncomment and adapt for your platform:
${platform.id === "whole-person-health" ? `
// When a screening is completed:
// sendEcosystemEvent("screening_completed", {
//   screeningType: "PHQ-9",
//   riskLevel: "moderate",
//   veteranId: "anonymous-hash",
//   timestamp: new Date().toISOString(),
// });
//
// When a safety plan is created:
// sendEcosystemEvent("safety_plan_created", {
//   veteranId: "anonymous-hash",
//   hasTrustedContacts: true,
// });
//
// When a crisis event occurs:
// sendEcosystemEvent("crisis_event", {
//   severity: "high",
//   action: "988_referral",
// }, "mission-transition"); // target specific platform
` : ""}${platform.id === "mission-transition" ? `
// When a service member begins transition:
// sendEcosystemEvent("transition_started", {
//   monthsToSeparation: 12,
//   branch: "Army",
//   rank: "E-6",
// });
//
// When transition milestones are completed:
// sendEcosystemEvent("transition_milestone", {
//   milestone: "benefits_navigation_complete",
//   veteranId: "anonymous-hash",
// });
//
// When a veteran needs mental health screening:
// sendEcosystemEvent("screening_referral", {
//   reason: "transition_distress",
//   urgency: "routine",
// }, "whole-person-health");
` : ""}${platform.id === "life-transitions-aid" ? `
// When a life event assessment indicates elevated risk:
// sendEcosystemEvent("life_event_risk", {
//   eventType: "divorce",
//   riskLevel: "elevated",
//   veteranId: "anonymous-hash",
// });
//
// When someone needs clinical screening:
// sendEcosystemEvent("screening_referral", {
//   reason: "life_event_distress",
//   lifeEvent: "job_loss",
// }, "whole-person-health");
` : ""}${platform.id === "salp-science" ? `
// When a protocol is updated:
// sendEcosystemEvent("protocol_updated", {
//   protocol: "C-SSRS",
//   version: "2.1",
//   changesSummary: "Updated scoring thresholds",
// });
//
// When new research is published:
// sendEcosystemEvent("research_published", {
//   topic: "transition_risk_factors",
//   citation: "Flood et al., 2026",
// });
` : ""}${platform.id === "easyai-learning" ? `
// When a youth enrolls:
// sendEcosystemEvent("youth_enrolled", {
//   ageGroup: "16-18",
//   isVeteranChild: true,
//   pathway: "ai_fundamentals",
// });
//
// When a learner shows distress signals:
// sendEcosystemEvent("learner_distress", {
//   indicators: ["declining_engagement", "mood_change"],
//   urgency: "routine",
// }, "whole-person-health");
` : ""}
console.log("[ThriveUp Ecosystem] ${platform.name} connector initialized — Platform ID: ${platform.id}");
`.trim();

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        snippet,
        instructions: [
          `1. Copy the integration code above into your ${platform.name} codebase`,
          "2. Add it to your server startup file or create a dedicated ecosystem-connector.js file",
          `3. The API key is embedded in the snippet — keep it secure and never expose it in frontend code`,
          "4. The heartbeat runs automatically every 5 minutes once the code is loaded",
          "5. Uncomment the event examples relevant to your platform and integrate them into your existing workflows",
          "6. Test by checking the Ecosystem Command Center on ThriveUp for your platform's heartbeat status",
        ],
      });
    } catch (error) {
      console.error("Failed to generate snippet:", error);
      res.status(500).json({ error: "Failed to generate integration snippet" });
    }
  });
}
