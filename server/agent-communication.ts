import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { agentExchanges, ecosystemPlatforms } from "@shared/schema";
import { eq, and, desc, or, sql, gte } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

export const PLATFORM_CAPABILITIES: Record<string, {
  domains: string[];
  canProvide: string[];
  canConsume: string[];
  autonomyScope: string;
}> = {
  "whole-person-health": {
    domains: ["health-equity", "mental-health", "crisis"],
    canProvide: ["screening_results", "safety_plans", "crisis_routing", "risk_scores", "care_summaries", "resource_referrals"],
    canConsume: ["veteran_profiles", "student_referrals", "incident_reports", "cognitive_assessments", "maternal_health_data"],
    autonomyScope: "Clinical screenings, crisis routing, safety plan creation, resource matching, cross-platform care coordination",
  },
  "isss": {
    domains: ["education"],
    canProvide: ["student_support_data", "early_warning_flags", "thrive_scores", "implementation_fidelity", "district_analytics"],
    canConsume: ["health_screenings", "iep_data", "incident_reports", "family_referrals", "research_findings"],
    autonomyScope: "Student support coordination, MTSS implementation, early warning systems, district-level analytics",
  },
  "sankofa": {
    domains: ["health-equity"],
    canProvide: ["health_screening_data", "resource_referrals", "wellness_metrics", "population_health_data", "sub_platform_coordination"],
    canConsume: ["student_referrals", "crisis_alerts", "veteran_profiles", "cognitive_assessments", "screening_results"],
    autonomyScope: "Health equity gateway, sub-platform orchestration, culturally responsive care navigation, GIS resource matching",
  },
  "sankofa-feminine-health": {
    domains: ["health-equity"],
    canProvide: ["reproductive_health_outcomes", "screening_data", "provider_matches"],
    canConsume: ["crisis_alerts", "maternal_health_referrals", "cognitive_assessments", "medication_reminders"],
    autonomyScope: "Reproductive health education, preventive screening, provider matching",
  },
  "sankofa-maternal-health": {
    domains: ["health-equity"],
    canProvide: ["maternal_health_data", "risk_assessments", "doula_referrals", "birth_outcomes", "social_determinant_flags"],
    canConsume: ["crisis_alerts", "feminine_health_referrals", "cognitive_assessments", "resource_referrals"],
    autonomyScope: "Maternal care navigation, doula matching, prenatal/postnatal coordination, maternal mental health screening",
  },
  "sankofa-mens-health": {
    domains: ["health-equity", "veterans"],
    canProvide: ["health_screening_data", "mental_health_engagement", "peer_mentor_outcomes"],
    canConsume: ["crisis_alerts", "veteran_health_referrals", "substance_use_screenings", "medication_adherence"],
    autonomyScope: "Men's health programs, prostate/cardiovascular screening, mental health stigma reduction, peer mentoring",
  },
  "emergency-mgmt": {
    domains: ["compliance", "safety"],
    canProvide: ["risk_assessments", "safety_analytics", "resilience_scores", "threat_alerts", "risk_heat_maps", "predictive_models"],
    canConsume: ["incident_reports", "crisis_alerts", "screening_data", "social_determinant_data", "veteran_profiles"],
    autonomyScope: "Geographic risk mapping, threat assessment, community resilience scoring, predictive safety modeling",
  },
  "wholemind": {
    domains: ["education"],
    canProvide: ["learning_progress", "engagement_metrics", "academic_assessments", "skill_mastery_data", "grade_progression"],
    canConsume: ["student_profiles", "iep_accommodations", "neurodiversity_guides", "evidence_based_curriculum"],
    autonomyScope: "K-12 adaptive learning, AI homework help, skill mastery tracking, parent progress reporting",
  },
  "perfectly-different": {
    domains: ["health-equity", "education"],
    canProvide: ["neurodevelopmental_assessments", "iep_data", "accommodation_needs", "therapy_utilization"],
    canConsume: ["student_profiles", "health_screenings", "cognitive_assessments", "academic_assessments"],
    autonomyScope: "Neurodiversity support, IEP/504 planning, executive function coaching, sensory management",
  },
  "safereport": {
    domains: ["compliance"],
    canProvide: ["incident_reports", "compliance_alerts", "audit_trails", "resolution_metrics"],
    canConsume: ["early_warning_flags", "student_safety_alerts", "crisis_events", "risk_assessments"],
    autonomyScope: "Incident management, mandatory reporting, compliance tracking, court-admissible records",
  },
  "m2c": {
    domains: ["veterans", "workforce"],
    canProvide: ["veteran_profiles", "transition_status", "skills_assessments", "benefits_navigation", "employment_outcomes"],
    canConsume: ["crisis_alerts", "health_screenings", "job_listings", "community_resources", "mental_health_referrals"],
    autonomyScope: "Military-to-civilian transition, MOS translation, benefits navigation, identity transition support",
  },
  "safecognicare": {
    domains: ["health-equity", "mental-health"],
    canProvide: ["cognitive_assessments", "tbi_screenings", "cognitive_decline_monitoring", "care_coordination"],
    canConsume: ["health_screenings", "incident_reports", "medication_adherence", "maternal_health_data"],
    autonomyScope: "Cognitive health assessments (MoCA/MMSE), TBI screening, early intervention alerts",
  },
  "lifebridge": {
    domains: ["community", "housing", "workforce"],
    canProvide: ["resource_navigation", "social_determinant_scores", "community_resources", "housing_assistance"],
    canConsume: ["crisis_alerts", "screening_results", "veteran_profiles", "health_data", "incident_reports"],
    autonomyScope: "24/7 resource navigation, housing assistance, social determinant scoring, community health worker dispatch",
  },
  "mce": {
    domains: ["workforce", "business"],
    canProvide: ["business_analytics", "certification_data", "proposal_reviews", "sam_registrations"],
    canConsume: ["veteran_profiles", "workforce_data", "community_resources", "grant_intelligence"],
    autonomyScope: "Minority business support, SAM.gov integration, certification wizard, dual-AI proposal review",
  },
  "pinnacle-business-conglomerate": {
    domains: ["workforce", "business"],
    canProvide: ["contractor_data", "bid_strategies", "workforce_pipeline", "map_gap_diagnostics"],
    canConsume: ["business_analytics", "certification_data", "veteran_profiles", "grant_intelligence"],
    autonomyScope: "Contractor enablement, bid strategy, workforce pipeline, MAP-GAP diagnostics",
  },
  "collaborative-advocate": {
    domains: ["veterans", "workforce"],
    canProvide: ["advocacy_data", "service_coordination", "grant_execution", "workforce_consulting"],
    canConsume: ["veteran_profiles", "community_resources", "health_data", "business_analytics"],
    autonomyScope: "Veteran advocacy, workforce development consulting, grant execution management",
  },
  "autoimmune-thrive": {
    domains: ["health-equity"],
    canProvide: ["condition_tracking", "symptom_management", "treatment_adherence"],
    canConsume: ["health_screenings", "medication_adherence", "provider_referrals"],
    autonomyScope: "Autoimmune condition management, symptom tracking, flare prediction",
  },
  "pillscheduler": {
    domains: ["health-equity"],
    canProvide: ["medication_adherence", "pill_schedules", "refill_alerts"],
    canConsume: ["health_screenings", "treatment_plans", "provider_data"],
    autonomyScope: "Medication scheduling, adherence tracking, refill coordination",
  },
  "speech-bridge": {
    domains: ["health-equity", "education"],
    canProvide: ["accessibility_data", "communication_aids", "language_translation"],
    canConsume: ["student_profiles", "health_data", "neurodiversity_assessments"],
    autonomyScope: "Speech/communication accessibility, language translation, assistive technology",
  },
  "betterscience": {
    domains: ["research", "education"],
    canProvide: ["research_findings", "evidence_registry", "fidelity_measurements", "framework_evaluations"],
    canConsume: ["outcome_data", "implementation_reports", "program_metrics"],
    autonomyScope: "Evidence-based practice registry, CFIR/RE-AIM evaluation, research translation, fidelity measurement",
  },
  "video-creator-ai": {
    domains: ["content"],
    canProvide: ["video_content", "training_materials", "campaign_assets"],
    canConsume: ["platform_profiles", "program_data", "brand_guidelines"],
    autonomyScope: "AI video generation, training content creation, campaign asset production",
  },
  "ad-targeting": {
    domains: ["content"],
    canProvide: ["campaign_analytics", "audience_targeting", "engagement_data"],
    canConsume: ["platform_profiles", "demographic_data", "program_metrics"],
    autonomyScope: "Ad campaign management, audience targeting, engagement analytics",
  },
  "ecosystem-nexus": {
    domains: ["content"],
    canProvide: ["ecosystem_reports", "integration_status", "cross_platform_analytics"],
    canConsume: ["platform_profiles", "health_data", "compliance_data"],
    autonomyScope: "Ecosystem reporting, integration monitoring, cross-platform analytics",
  },
};

const VALID_EXCHANGE_TYPES = [
  "data_share",
  "data_request",
  "outcome_report",
  "referral",
  "alert",
  "capability_query",
  "coordination",
  "feedback",
] as const;

function validateExchangeReasoning(reasoning: string): { valid: boolean; issue?: string } {
  if (!reasoning || reasoning.length < 50) {
    return { valid: false, issue: "Reasoning must be at least 50 characters. Explain WHY this exchange is needed — not just WHAT you're sending." };
  }
  const genericPhrases = ["just because", "sending data", "here is data", "fyi", "for your information"];
  for (const phrase of genericPhrases) {
    if (reasoning.toLowerCase().includes(phrase)) {
      return { valid: false, issue: `Reasoning cannot be generic ("${phrase}"). Explain the specific outcome this exchange is meant to produce.` };
    }
  }
  return { valid: true };
}

function validateDomainAlignment(fromId: string, toId: string, exchangeType: string): {
  aligned: boolean;
  justification: string;
  confidence: "high" | "medium" | "low";
} {
  const fromCaps = PLATFORM_CAPABILITIES[fromId];
  const toCaps = PLATFORM_CAPABILITIES[toId];

  if (!fromCaps || !toCaps) {
    return { aligned: true, justification: "Platform capabilities not mapped — exchange allowed with monitoring.", confidence: "low" };
  }

  const domainOverlap = fromCaps.domains.filter(d => toCaps.domains.includes(d));
  const canProvideMatch = fromCaps.canProvide.some(p => toCaps.canConsume.includes(p));
  const canConsumeMatch = fromCaps.canConsume.some(c => toCaps.canProvide.includes(c));

  if (exchangeType === "data_share" || exchangeType === "outcome_report") {
    if (canProvideMatch) {
      return {
        aligned: true,
        justification: `${fromId} produces data that ${toId} consumes. Domain alignment confirmed.`,
        confidence: "high",
      };
    }
    if (domainOverlap.length > 0) {
      return {
        aligned: true,
        justification: `Shared domains (${domainOverlap.join(", ")}). Data share may be relevant.`,
        confidence: "medium",
      };
    }
    return {
      aligned: false,
      justification: `No data flow mapping between ${fromId} and ${toId}. ${fromId} produces [${fromCaps.canProvide.slice(0, 3).join(", ")}] but ${toId} consumes [${toCaps.canConsume.slice(0, 3).join(", ")}]. Exchange allowed but flagged for review.`,
      confidence: "low",
    };
  }

  if (exchangeType === "data_request") {
    if (canConsumeMatch) {
      return {
        aligned: true,
        justification: `${toId} produces data that ${fromId} needs. Valid request.`,
        confidence: "high",
      };
    }
    return {
      aligned: false,
      justification: `${toId} doesn't produce data ${fromId} typically consumes. Request allowed but may not yield useful results.`,
      confidence: "low",
    };
  }

  if (exchangeType === "referral") {
    if (domainOverlap.length > 0 || canProvideMatch) {
      return { aligned: true, justification: `Referral pathway exists between ${fromId} and ${toId}.`, confidence: "high" };
    }
    return { aligned: true, justification: `Cross-domain referral. No direct data flow but referrals are always valid.`, confidence: "medium" };
  }

  if (exchangeType === "alert") {
    return { aligned: true, justification: "Alerts are broadcast-eligible — any platform can alert any other platform.", confidence: "high" };
  }

  return { aligned: true, justification: `Exchange type '${exchangeType}' — default: allowed with monitoring.`, confidence: "medium" };
}

function requireEcosystemAuth(req: Request, res: Response, next: Function) {
  const apiKey = req.headers["x-ecosystem-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-ecosystem-key header" });
  }
  next();
}

async function resolvePlatformFromKey(apiKey: string): Promise<any | null> {
  const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
  return platform || null;
}

export async function getAgentInbox(platformId: string): Promise<any[]> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const messages = await db.select().from(agentExchanges)
    .where(and(
      eq(agentExchanges.toPlatformId, platformId),
      eq(agentExchanges.status, "pending"),
      gte(agentExchanges.createdAt, oneWeekAgo),
    ))
    .orderBy(desc(agentExchanges.createdAt))
    .limit(20);

  return messages.map(m => ({
    exchangeId: m.id,
    from: m.fromPlatformId,
    type: m.exchangeType,
    reasoning: m.reasoning,
    purpose: m.purpose,
    domainJustification: m.domainJustification,
    data: m.data,
    receivedAt: m.createdAt,
    expiresAt: m.expiresAt,
    actionRequired: m.exchangeType === "data_request" || m.exchangeType === "alert" || m.exchangeType === "referral",
    howToRespond: {
      endpoint: `POST https://thrivingcommunitiesforall.com/api/ecosystem/agent/respond`,
      body: { exchangeId: m.id, responseData: {}, status: "acknowledged" },
      note: "Include meaningful responseData with evidence of action taken.",
    },
  }));
}

export function registerAgentCommunicationRoutes(app: Express) {

  app.get("/api/ecosystem/agent/capabilities", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolvePlatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const myCaps = PLATFORM_CAPABILITIES[platform.id];
      if (!myCaps) {
        return res.json({
          platformId: platform.id,
          platformName: platform.name,
          mapped: false,
          message: "Your platform's capabilities are not yet mapped in the agent registry. You can still send and receive exchanges.",
        });
      }

      const compatiblePlatforms: Record<string, any[]> = {
        canSendTo: [],
        canReceiveFrom: [],
      };

      for (const [pid, caps] of Object.entries(PLATFORM_CAPABILITIES)) {
        if (pid === platform.id) continue;

        const iCanSend = myCaps.canProvide.filter(p => caps.canConsume.includes(p));
        if (iCanSend.length > 0) {
          compatiblePlatforms.canSendTo.push({
            platformId: pid,
            dataTypes: iCanSend,
            reasoning: `You produce ${iCanSend.join(", ")} which ${pid} can consume.`,
          });
        }

        const iCanReceive = myCaps.canConsume.filter(c => caps.canProvide.includes(c));
        if (iCanReceive.length > 0) {
          compatiblePlatforms.canReceiveFrom.push({
            platformId: pid,
            dataTypes: iCanReceive,
            reasoning: `${pid} produces ${iCanReceive.join(", ")} which you can consume.`,
          });
        }
      }

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        mapped: true,
        domains: myCaps.domains,
        canProvide: myCaps.canProvide,
        canConsume: myCaps.canConsume,
        autonomyScope: myCaps.autonomyScope,
        compatiblePlatforms,
        exchangeTypes: VALID_EXCHANGE_TYPES,
        message: `${platform.name} is an autonomous agent with scope: "${myCaps.autonomyScope}". You can independently exchange data with ${compatiblePlatforms.canSendTo.length} platforms and receive from ${compatiblePlatforms.canReceiveFrom.length} platforms. All exchanges require reasoning justification.`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ecosystem/agent/exchange", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolvePlatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const { toPlatformId, exchangeType, reasoning, purpose, data } = req.body;

      if (!toPlatformId || !exchangeType || !reasoning || !purpose) {
        return res.status(400).json({
          error: "Missing required fields",
          required: { toPlatformId: "target platform ID", exchangeType: VALID_EXCHANGE_TYPES, reasoning: "WHY this exchange (min 50 chars)", purpose: "expected outcome" },
        });
      }

      if (!VALID_EXCHANGE_TYPES.includes(exchangeType)) {
        return res.status(400).json({ error: `Invalid exchangeType. Valid types: ${VALID_EXCHANGE_TYPES.join(", ")}` });
      }

      const reasoningCheck = validateExchangeReasoning(reasoning);
      if (!reasoningCheck.valid) {
        return res.status(400).json({ error: reasoningCheck.issue, standard: "Every exchange must include substantive reasoning that explains why this data is being sent to this specific platform at this time." });
      }

      if (toPlatformId === platform.id) {
        return res.status(400).json({ error: "Cannot send an exchange to yourself." });
      }

      const [targetPlatform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, toPlatformId));
      if (!targetPlatform) {
        return res.status(404).json({ error: `Platform '${toPlatformId}' not found in the ecosystem.` });
      }

      const alignment = validateDomainAlignment(platform.id, toPlatformId, exchangeType);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const [exchange] = await db.insert(agentExchanges).values({
        fromPlatformId: platform.id,
        toPlatformId,
        exchangeType,
        reasoning,
        purpose,
        domainJustification: alignment.justification,
        data: data || {},
        status: "pending",
        expiresAt,
      }).returning();

      res.json({
        exchangeId: exchange.id,
        status: "delivered",
        from: platform.id,
        to: toPlatformId,
        type: exchangeType,
        domainAlignment: {
          aligned: alignment.aligned,
          confidence: alignment.confidence,
          justification: alignment.justification,
        },
        delivery: {
          method: `${targetPlatform.name} will receive this in their next heartbeat response under 'agentInbox'.`,
          expiresAt: expiresAt.toISOString(),
          note: alignment.confidence === "low"
            ? "LOW CONFIDENCE: This exchange crosses domain boundaries. It will be delivered but flagged for hub review."
            : "Exchange validated and queued for delivery.",
        },
        reasoning,
        purpose,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/ecosystem/agent/inbox", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolvePlatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const inbox = await getAgentInbox(platform.id);

      const sentByMe = await db.select().from(agentExchanges)
        .where(and(
          eq(agentExchanges.fromPlatformId, platform.id),
          gte(agentExchanges.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        ))
        .orderBy(desc(agentExchanges.createdAt))
        .limit(10);

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        inbox: {
          count: inbox.length,
          messages: inbox,
          actionRequired: inbox.filter(m => m.actionRequired).length,
        },
        sent: {
          count: sentByMe.length,
          recent: sentByMe.map(s => ({
            exchangeId: s.id,
            to: s.toPlatformId,
            type: s.exchangeType,
            status: s.status,
            sentAt: s.createdAt,
            responded: !!s.respondedAt,
          })),
        },
        autonomy: {
          scope: PLATFORM_CAPABILITIES[platform.id]?.autonomyScope || "Not yet defined",
          domains: PLATFORM_CAPABILITIES[platform.id]?.domains || [],
          message: `You are an autonomous agent within the ThriveUp ecosystem. Act within your scope: "${PLATFORM_CAPABILITIES[platform.id]?.autonomyScope || 'general'}". Exchange data with other platforms when it serves a clear purpose. Every exchange must include reasoning.`,
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ecosystem/agent/respond", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolvePlatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const { exchangeId, responseData, status } = req.body;
      if (!exchangeId) return res.status(400).json({ error: "exchangeId required" });

      const [exchange] = await db.select().from(agentExchanges).where(eq(agentExchanges.id, exchangeId));
      if (!exchange) return res.status(404).json({ error: "Exchange not found" });
      if (exchange.toPlatformId !== platform.id) {
        return res.status(403).json({ error: "This exchange was not sent to your platform." });
      }

      const validStatuses = ["acknowledged", "acted_on", "declined", "deferred"];
      const newStatus = validStatuses.includes(status) ? status : "acknowledged";

      const [updated] = await db.update(agentExchanges)
        .set({
          status: newStatus,
          responseData: responseData || {},
          respondedAt: new Date(),
        })
        .where(eq(agentExchanges.id, exchangeId))
        .returning();

      res.json({
        exchangeId: updated.id,
        status: newStatus,
        from: exchange.fromPlatformId,
        reasoning: `${platform.name} responded to exchange from ${exchange.fromPlatformId}: ${newStatus}`,
        note: newStatus === "declined"
          ? "Exchange declined. The sending platform will be notified in their next heartbeat."
          : newStatus === "deferred"
          ? "Exchange deferred. The hub will track this and follow up."
          : "Response recorded. The sending platform will see your response in their next heartbeat.",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ecosystem/agent/broadcast", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolvePlatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const { exchangeType, reasoning, purpose, data, targetDomains } = req.body;

      if (!exchangeType || !reasoning || !purpose) {
        return res.status(400).json({ error: "exchangeType, reasoning, and purpose required" });
      }

      if (exchangeType !== "alert" && exchangeType !== "outcome_report" && exchangeType !== "feedback") {
        return res.status(400).json({
          error: "Broadcasts are limited to 'alert', 'outcome_report', or 'feedback' types. For targeted exchanges, use POST /api/ecosystem/agent/exchange.",
          reasoning: "Broadcasting data_share or data_request to all platforms creates noise. Target specific platforms instead.",
        });
      }

      const reasoningCheck = validateExchangeReasoning(reasoning);
      if (!reasoningCheck.valid) {
        return res.status(400).json({ error: reasoningCheck.issue });
      }

      const allPlatforms = await db.select().from(ecosystemPlatforms);
      let targets = allPlatforms.filter(p => p.id !== platform.id);

      if (targetDomains && targetDomains.length > 0) {
        targets = targets.filter(p => {
          const caps = PLATFORM_CAPABILITIES[p.id];
          return caps && caps.domains.some((d: string) => targetDomains.includes(d));
        });
      }

      const exchanges = [];
      for (const target of targets) {
        const alignment = validateDomainAlignment(platform.id, target.id, exchangeType);
        const [exchange] = await db.insert(agentExchanges).values({
          fromPlatformId: platform.id,
          toPlatformId: target.id,
          exchangeType,
          reasoning,
          purpose,
          domainJustification: alignment.justification,
          data: data || {},
          status: "pending",
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        }).returning();
        exchanges.push({ exchangeId: exchange.id, to: target.id, aligned: alignment.aligned });
      }

      res.json({
        broadcast: true,
        from: platform.id,
        type: exchangeType,
        recipientCount: exchanges.length,
        totalPlatforms: allPlatforms.length - 1,
        filtered: targetDomains ? `Filtered to domains: ${targetDomains.join(", ")}` : "Sent to all platforms",
        reasoning,
        purpose,
        deliveries: exchanges.slice(0, 5).map(e => ({ to: e.to, aligned: e.aligned })),
        note: exchanges.length > 5 ? `...and ${exchanges.length - 5} more` : undefined,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/ecosystem/agent/network", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolvePlatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const myCaps = PLATFORM_CAPABILITIES[platform.id];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentExchanges = await db.select().from(agentExchanges)
        .where(and(
          or(
            eq(agentExchanges.fromPlatformId, platform.id),
            eq(agentExchanges.toPlatformId, platform.id),
          ),
          gte(agentExchanges.createdAt, weekAgo),
        ))
        .orderBy(desc(agentExchanges.createdAt));

      const communicationPartners: Record<string, { sent: number; received: number; types: string[] }> = {};
      for (const ex of recentExchanges) {
        const partnerId = ex.fromPlatformId === platform.id ? ex.toPlatformId : ex.fromPlatformId;
        if (!communicationPartners[partnerId]) communicationPartners[partnerId] = { sent: 0, received: 0, types: [] };
        if (ex.fromPlatformId === platform.id) communicationPartners[partnerId].sent++;
        else communicationPartners[partnerId].received++;
        if (!communicationPartners[partnerId].types.includes(ex.exchangeType)) {
          communicationPartners[partnerId].types.push(ex.exchangeType);
        }
      }

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        autonomy: {
          scope: myCaps?.autonomyScope || "General ecosystem participant",
          domains: myCaps?.domains || [],
          principle: "You are an autonomous agent. Act within your scope with reasoning and purpose. Exchange information when it produces measurable outcomes. The hub coordinates — it does not bottleneck.",
        },
        networkActivity: {
          last7Days: {
            totalExchanges: recentExchanges.length,
            sent: recentExchanges.filter(e => e.fromPlatformId === platform.id).length,
            received: recentExchanges.filter(e => e.toPlatformId === platform.id).length,
            responded: recentExchanges.filter(e => e.toPlatformId === platform.id && e.respondedAt).length,
            pending: recentExchanges.filter(e => e.toPlatformId === platform.id && e.status === "pending").length,
          },
          partners: communicationPartners,
        },
        endpoints: {
          exchange: "POST /api/ecosystem/agent/exchange — Send targeted data to a specific platform",
          inbox: "GET /api/ecosystem/agent/inbox — Check your incoming messages",
          respond: "POST /api/ecosystem/agent/respond — Respond to an exchange",
          broadcast: "POST /api/ecosystem/agent/broadcast — Send alert/outcome to relevant platforms",
          capabilities: "GET /api/ecosystem/agent/capabilities — See your data flow map",
          network: "GET /api/ecosystem/agent/network — View your communication network",
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ecosystem/agent/reason", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolvePlatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const { question, context } = req.body;
      if (!question) return res.status(400).json({ error: "question required" });

      const myCaps = PLATFORM_CAPABILITIES[platform.id];
      const prompt = `You are an AI reasoning engine for the ThriveUp ACOS ecosystem (24-platform workforce development system under The Collaborative Advocate Foundation, a 501(c)(3) veteran-founded, Black-led nonprofit led by Dr. Terry Flood).

Platform asking: ${platform.name} (ID: ${platform.id})
Domains: ${myCaps?.domains?.join(", ") || "general"}
Autonomy scope: ${myCaps?.autonomyScope || "general"}
Can provide: ${myCaps?.canProvide?.join(", ") || "general data"}
Can consume: ${myCaps?.canConsume?.join(", ") || "general data"}

Context provided: ${context ? JSON.stringify(context) : "None"}

Question: ${question}

Respond with actionable reasoning. Consider:
1. Does this action serve the platform's domain?
2. Which other platforms should be involved?
3. What data exchanges would produce the best outcome?
4. What is the expected measurable impact?
5. Apply Dr. Flood's principle: education is the #1 protective factor.

Be specific. Name platforms by ID. Suggest concrete exchanges.`;

      const result = await generateAIJSON<{
        analysis: string;
        recommendation: string;
        platformsToEngage: { id: string; reason: string; exchangeType: string }[];
        expectedOutcome: string;
        riskConsiderations: string;
      }>(prompt, "You are a strategic reasoning engine for an interdependent ecosystem of autonomous AI agents. Return JSON with: analysis, recommendation, platformsToEngage (array of {id, reason, exchangeType}), expectedOutcome, riskConsiderations.");

      res.json({
        platformId: platform.id,
        question,
        reasoning: result,
        note: "This is AI-assisted reasoning to help you decide your next action. You retain full autonomy — act on this guidance if it aligns with your domain and purpose.",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
