import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { rpliceAssessments, rpliceActionPlans, outcomeBaselines, ecosystemPlatforms } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const PLATFORM_DOMAIN_MAP: Record<string, string[]> = {
  "education": ["isss", "wholemind", "betterscience", "sankofa-feminine-health"],
  "health-equity": ["whole-person-health", "sankofa", "sankofa-feminine-health", "sankofa-maternal-health", "sankofa-mens-health", "perfectly-different", "safecognicare", "autoimmune-thrive", "pillscheduler", "speech-bridge"],
  "workforce": ["mce", "pinnacle-business-conglomerate", "collaborative-advocate"],
  "veterans": ["m2c", "collaborative-advocate", "sankofa-mens-health"],
  "compliance": ["safereport", "emergency-mgmt"],
  "housing": ["lifebridge", "sankofa-feminine-health"],
  "mental-health": ["whole-person-health", "perfectly-different", "safecognicare", "sankofa-feminine-health", "sankofa-maternal-health"],
  "research": ["betterscience", "sankofa-feminine-health"],
  "community": ["lifebridge", "whole-person-health", "sankofa-feminine-health", "sankofa-maternal-health"],
  "business": ["mce", "pinnacle-business-conglomerate"],
  // New domains added for HerHealth / BMV scope
  "maternal-health": ["sankofa-feminine-health", "sankofa-maternal-health"],
  "advocacy": ["sankofa-feminine-health", "sankofa-maternal-health"],
  "rural-health": ["sankofa-feminine-health", "whole-person-health"],
};

const PLATFORM_RISK_RELEVANCE: Record<string, string[]> = {
  "whole-person-health": ["health-equity", "mental-health", "veterans", "community"],
  "isss": ["education"],
  "sankofa": ["health-equity"],
  // HerHealth Network — full female health equity + advocacy + education + rural/urban platform
  "sankofa-feminine-health": [
    "health-equity",    // racial/gender health disparities, SDOH
    "mental-health",    // EPDS, postpartum depression, anxiety, autoimmune-mental health link
    "community",        // CHW networks, peer navigation, BMV, urban/rural community health
    "education",        // health literacy, awareness, understanding options and rights
    "maternal-health",  // pregnancy, postpartum, birth outcomes, Black maternal mortality
    "advocacy",         // policy navigation, rights, empowerment
    "rural-health",     // provider deserts, telehealth gaps, transportation barriers
    "housing",          // SDOH — housing instability directly affects women's health outcomes
    "research",         // evidence-based outcomes, EPDS validation, autoimmune studies
  ],
  // Black Mamas Village — community-led maternal health, CHW navigation, advocacy
  "sankofa-maternal-health": [
    "health-equity",
    "mental-health",
    "community",
    "maternal-health",
    "advocacy",
  ],
  "sankofa-mens-health": ["health-equity", "veterans"],
  "emergency-mgmt": ["safety", "housing"],
  "wholemind": ["education"],
  "perfectly-different": ["education", "mental-health"],
  "safereport": ["safety"],
  "m2c": ["veterans", "workforce"],
  "safecognicare": ["health-equity", "mental-health"],
  "lifebridge": ["housing", "community", "workforce"],
  "mce": ["workforce", "business"],
  "pinnacle-business-conglomerate": ["workforce", "business"],
  "collaborative-advocate": ["veterans", "workforce"],
  "autoimmune-thrive": ["health-equity"],
  "pillscheduler": ["health-equity"],
  "speech-bridge": ["health-equity", "education"],
  "betterscience": ["research", "education"],
  "video-creator-ai": [],
  "ad-targeting": [],
  "ecosystem-nexus": [],
  "code-canvas": [],
};

interface RpliceIntelligencePayload {
  relevant: boolean;
  reasoning: string;
  relevanceScore: number;
  analyses: any[];
  interventionAssignments: any[];
  actionPlanMilestones: any[];
  outcomeBaselines: any[];
  availableTools: any;
}

function computeRelevanceScore(platformId: string, riskFactors: string[]): { score: number; matchedFactors: string[]; reasoning: string } {
  const platformRelevance = PLATFORM_RISK_RELEVANCE[platformId] || [];
  const matchedFactors = riskFactors.filter(f => platformRelevance.includes(f));
  const score = platformRelevance.length > 0
    ? Math.round((matchedFactors.length / platformRelevance.length) * 100)
    : 0;

  let reasoning: string;
  if (matchedFactors.length === 0) {
    reasoning = `No active RPLICE analyses target ${platformId}'s domains (${platformRelevance.join(", ") || "none mapped"}). Intelligence is informational only — no action required.`;
  } else if (score >= 80) {
    reasoning = `HIGH RELEVANCE: Active RPLICE analyses directly target ${matchedFactors.join(", ")} — core to ${platformId}'s mission. Review analyses and prepare intervention capacity.`;
  } else if (score >= 50) {
    reasoning = `MODERATE RELEVANCE: RPLICE analyses touch ${matchedFactors.join(", ")} which overlap with ${platformId}'s capabilities. Monitor findings but action is optional unless specifically assigned.`;
  } else {
    reasoning = `LOW RELEVANCE: Only ${matchedFactors.join(", ")} partially overlap with ${platformId}. No action required — awareness only.`;
  }

  return { score, matchedFactors, reasoning };
}

function extractRiskFactorsFromAnalysis(analysisData: any): string[] {
  const factors: string[] = [];
  if (!analysisData) return factors;

  const data = typeof analysisData === "string" ? JSON.parse(analysisData) : analysisData;
  const county = data.county || data.targetCounty || {};
  const stats = data.stats || {};

  if (county.povertyRate > 15 || stats.tractsOver30Poverty > 5) factors.push("housing", "community");
  if (county.collegePct && county.collegePct < 30) factors.push("education");
  if (county.unemploymentRate && county.unemploymentRate > 7) factors.push("workforce");
  if (county.povertyRate > 20) factors.push("health-equity");
  if (stats.tractsRisk100 > 0) factors.push("safety", "mental-health");
  if (data.gentrification?.length > 0 || data.gentrificationIndicators?.length > 0) factors.push("housing");

  factors.push("research");

  return [...new Set(factors)];
}

function getInterventionAssignments(platformId: string, analyses: any[]): any[] {
  const assignments: any[] = [];
  const platformRelevance = PLATFORM_RISK_RELEVANCE[platformId] || [];

  for (const analysis of analyses) {
    const riskFactors = extractRiskFactorsFromAnalysis(analysis.data);
    const relevant = riskFactors.filter(f => platformRelevance.includes(f));
    if (relevant.length === 0) continue;

    assignments.push({
      analysisId: analysis.id,
      region: analysis.programName,
      assignedBecause: `Your platform covers ${relevant.join(", ")} — this region's RPLICE analysis identified these as priority risk factors.`,
      riskFactorsYouAddress: relevant,
      riskFactorsOthersHandle: riskFactors.filter(f => !relevant.includes(f)),
      priorityLevel: relevant.length >= 3 ? "HIGH" : relevant.length >= 2 ? "MEDIUM" : "AWARENESS",
      actionRequired: relevant.length >= 2,
      suggestedAction: relevant.length >= 2
        ? `Review the ${analysis.programName} analysis and prepare your ${relevant.join("/")} intervention capacity for this region.`
        : `Monitor ${analysis.programName} findings. No direct action required unless escalated.`,
    });
  }

  return assignments;
}

function getRelevantMilestones(platformId: string, actionPlans: any[]): any[] {
  const milestones: any[] = [];
  const platformRelevance = PLATFORM_RISK_RELEVANCE[platformId] || [];

  for (const plan of actionPlans) {
    if (plan.status !== "active") continue;
    const phases = (plan.phases || []) as any[];

    for (const phase of phases) {
      for (const milestone of (phase.milestones || [])) {
        const linked = (milestone.linkedPlatform || "").toLowerCase();
        const isDirectlyLinked = linked.includes(platformId) || linked.includes(platformId.replace(/-/g, " "));

        const milestoneText = `${milestone.title} ${milestone.description}`.toLowerCase();
        const domainMatch = platformRelevance.some(domain => milestoneText.includes(domain.replace("-", " ")));

        if (isDirectlyLinked || domainMatch) {
          milestones.push({
            planId: plan.id,
            region: plan.regionName,
            phase: phase.name,
            milestone: milestone.title,
            description: milestone.description,
            deadline: milestone.deadline,
            status: milestone.status,
            assignedBecause: isDirectlyLinked
              ? `Directly linked to ${platformId} in the action plan.`
              : `Milestone content relates to your domain (${platformRelevance.filter(d => milestoneText.includes(d.replace("-", " "))).join(", ")}).`,
            yourRole: isDirectlyLinked ? "OWNER — You are directly responsible for this milestone." : "CONTRIBUTOR — Your capabilities support this milestone. Coordinate with the owner.",
            actionRequired: isDirectlyLinked,
          });
        }
      }
    }
  }

  return milestones;
}

function getRelevantBaselines(platformId: string, baselines: any[]): any[] {
  const platformRelevance = PLATFORM_RISK_RELEVANCE[platformId] || [];
  const relevant: any[] = [];

  for (const baseline of baselines) {
    if (baseline.status !== "active") continue;
    const metrics = baseline.metrics as Record<string, any> || {};

    const relevantMetrics: Record<string, any> = {};
    let hasRelevant = false;

    if (platformRelevance.includes("education") && metrics.collegePct !== undefined) {
      relevantMetrics.collegePct = { value: metrics.collegePct, label: "College Attainment", unit: "%" };
      hasRelevant = true;
    }
    if (platformRelevance.includes("health-equity") && metrics.povertyRate !== undefined) {
      relevantMetrics.povertyRate = { value: metrics.povertyRate, label: "Poverty Rate (health proxy)", unit: "%" };
      hasRelevant = true;
    }
    if (platformRelevance.includes("workforce") && metrics.unemploymentRate !== undefined) {
      relevantMetrics.unemploymentRate = { value: metrics.unemploymentRate, label: "Unemployment Rate", unit: "%" };
      hasRelevant = true;
    }
    if (platformRelevance.includes("housing") && metrics.medianRent !== undefined) {
      relevantMetrics.medianRent = { value: metrics.medianRent, label: "Median Rent", unit: "$" };
      hasRelevant = true;
    }
    if ((platformRelevance.includes("mental-health") || platformRelevance.includes("safety")) && metrics.riskScore100Tracts !== undefined) {
      relevantMetrics.riskScore100Tracts = { value: metrics.riskScore100Tracts, label: "Max-Risk Tracts", unit: "count" };
      hasRelevant = true;
    }
    // Maternal / women's health metrics
    if (platformRelevance.includes("maternal-health") || platformRelevance.includes("health-equity")) {
      if (metrics.maternalMortalityRate !== undefined) {
        relevantMetrics.maternalMortalityRate = { value: metrics.maternalMortalityRate, label: "Maternal Mortality Rate (per 100K)", unit: "/100K" };
        hasRelevant = true;
      }
      if (metrics.blackMaternalMortalityRate !== undefined) {
        relevantMetrics.blackMaternalMortalityRate = { value: metrics.blackMaternalMortalityRate, label: "Black Maternal Mortality Rate (per 100K)", unit: "/100K" };
        hasRelevant = true;
      }
      if (metrics.prenatalCareAccess !== undefined) {
        relevantMetrics.prenatalCareAccess = { value: metrics.prenatalCareAccess, label: "Prenatal Care First-Trimester Rate", unit: "%" };
        hasRelevant = true;
      }
      if (metrics.reproductiveHealthAccess !== undefined) {
        relevantMetrics.reproductiveHealthAccess = { value: metrics.reproductiveHealthAccess, label: "Reproductive Health Access Score", unit: "0–100" };
        hasRelevant = true;
      }
    }
    if (platformRelevance.includes("mental-health") || platformRelevance.includes("maternal-health")) {
      if (metrics.epdsRate !== undefined) {
        relevantMetrics.epdsRate = { value: metrics.epdsRate, label: "EPDS Positive Screening Rate", unit: "%" };
        hasRelevant = true;
      }
      if (metrics.postpartumConnectionRate !== undefined) {
        relevantMetrics.postpartumConnectionRate = { value: metrics.postpartumConnectionRate, label: "Postpartum Care Connection Rate", unit: "%" };
        hasRelevant = true;
      }
      if (metrics.screeningCompletionRate !== undefined) {
        relevantMetrics.screeningCompletionRate = { value: metrics.screeningCompletionRate, label: "Screening Completion Rate", unit: "%" };
        hasRelevant = true;
      }
    }
    if (platformRelevance.includes("rural-health")) {
      if (metrics.ruralProviderRatio !== undefined) {
        relevantMetrics.ruralProviderRatio = { value: metrics.ruralProviderRatio, label: "Rural OB/GYN Provider Ratio (per 10K women)", unit: "/10K" };
        hasRelevant = true;
      }
      if (metrics.ruralHealthAccessScore !== undefined) {
        relevantMetrics.ruralHealthAccessScore = { value: metrics.ruralHealthAccessScore, label: "Rural Health Access Score", unit: "0–100" };
        hasRelevant = true;
      }
    }
    if (platformRelevance.includes("community") || platformRelevance.includes("advocacy")) {
      if (metrics.communityHealthWorkerReach !== undefined) {
        relevantMetrics.communityHealthWorkerReach = { value: metrics.communityHealthWorkerReach, label: "CHW Reach (women served)", unit: "count" };
        hasRelevant = true;
      }
      if (metrics.advocacyEngagementRate !== undefined) {
        relevantMetrics.advocacyEngagementRate = { value: metrics.advocacyEngagementRate, label: "Advocacy Engagement Rate", unit: "%" };
        hasRelevant = true;
      }
    }
    if (platformRelevance.includes("health-equity")) {
      if (metrics.uninsuredWomenPct !== undefined) {
        relevantMetrics.uninsuredWomenPct = { value: metrics.uninsuredWomenPct, label: "Uninsured Women Rate", unit: "%" };
        hasRelevant = true;
      }
      if (metrics.socialVulnerabilityIndex !== undefined) {
        relevantMetrics.socialVulnerabilityIndex = { value: metrics.socialVulnerabilityIndex, label: "CDC Social Vulnerability Index", unit: "0–1" };
        hasRelevant = true;
      }
      if (metrics.preventiveCareUtilization !== undefined) {
        relevantMetrics.preventiveCareUtilization = { value: metrics.preventiveCareUtilization, label: "Preventive Care Utilization Rate", unit: "%" };
        hasRelevant = true;
      }
    }

    if (hasRelevant) {
      const targets = baseline.targets as Record<string, any> || {};
      const relevantTargets: Record<string, any> = {};
      for (const key of Object.keys(relevantMetrics)) {
        if (targets[key] !== undefined) relevantTargets[key] = targets[key];
      }

      relevant.push({
        baselineId: baseline.id,
        region: baseline.regionName,
        timelineMonths: baseline.timelineMonths,
        metricsYouTrack: relevantMetrics,
        targetsSet: relevantTargets,
        reasoning: `These baseline metrics map to your domain(s): ${platformRelevance.filter(d => Object.keys(relevantMetrics).length > 0).join(", ")}. Track your contribution to moving these numbers.`,
      });
    }
  }

  return relevant;
}

export async function generateRpliceHeartbeatIntelligence(platformId: string): Promise<RpliceIntelligencePayload> {
  const [analyses, plans, baselines] = await Promise.all([
    db.select().from(rpliceAssessments).orderBy(desc(rpliceAssessments.createdAt)).limit(10),
    db.select().from(rpliceActionPlans).where(eq(rpliceActionPlans.status, "active")).orderBy(desc(rpliceActionPlans.createdAt)).limit(10),
    db.select().from(outcomeBaselines).where(eq(outcomeBaselines.status, "active")).orderBy(desc(outcomeBaselines.createdAt)).limit(10),
  ]);

  const allRiskFactors: string[] = [];
  for (const a of analyses) {
    allRiskFactors.push(...extractRiskFactorsFromAnalysis(a.data));
  }
  const uniqueRiskFactors = [...new Set(allRiskFactors)];

  const { score, matchedFactors, reasoning } = computeRelevanceScore(platformId, uniqueRiskFactors);

  const interventionAssignments = getInterventionAssignments(platformId, analyses);
  const relevantMilestones = getRelevantMilestones(platformId, plans);
  const relevantBaselines = getRelevantBaselines(platformId, baselines);

  const isRelevant = interventionAssignments.some(a => a.actionRequired) ||
    relevantMilestones.some(m => m.actionRequired) ||
    relevantBaselines.length > 0;

  const hubUrl = "https://thrivingcommunitiesforall.com";

  return {
    relevant: isRelevant,
    reasoning,
    relevanceScore: score,
    analyses: interventionAssignments.length > 0 ? [{
      totalActiveAnalyses: analyses.length,
      regionsAnalyzed: [...new Set(analyses.map(a => a.programName))],
      activeRiskFactors: uniqueRiskFactors,
      yourMatchedFactors: matchedFactors,
    }] : [],
    interventionAssignments,
    actionPlanMilestones: relevantMilestones,
    outcomeBaselines: relevantBaselines,
    availableTools: {
      description: "RPLICE AI tools available to your platform via API. Only use these when relevant to your domain — not every tool needs to be called by every platform.",
      communityAnalysis: {
        endpoint: `POST ${hubUrl}/api/ecosystem/rplice/analyze`,
        description: "Run a full RPLICE community analysis for a region. Returns Census data, tract-level risk scores, gentrification indicators, and AI-powered insights.",
        whenToUse: matchedFactors.length > 0
          ? `RELEVANT: Your platform covers ${matchedFactors.join(", ")} — use this to get community data for your service area.`
          : "NOT RELEVANT for your platform's domain. Use only if specifically directed by the hub.",
        requiresEcosystemKey: true,
      },
      grantNarrative: {
        endpoint: `POST ${hubUrl}/api/ecosystem/rplice/narrative`,
        description: "Generate a funder-specific grant narrative using RPLICE analysis data. 8 grant profiles with unique voices.",
        whenToUse: "Use ONLY when your platform is preparing a grant application or contributing to an ecosystem-wide grant submission.",
        requiresEcosystemKey: true,
      },
      reportOutcome: {
        endpoint: `POST ${hubUrl}/api/ecosystem/rplice/report-outcome`,
        description: "Report your platform's outcomes back to the hub for baseline tracking. Maps your results to the active outcome baselines.",
        whenToUse: relevantBaselines.length > 0
          ? `RELEVANT: You have ${relevantBaselines.length} active baseline(s) to report against.`
          : "No active baselines currently target your domain. Will become relevant when baselines are set for regions you serve.",
        requiresEcosystemKey: true,
      },
      checkAssignments: {
        endpoint: `GET ${hubUrl}/api/ecosystem/rplice/my-assignments`,
        description: "Check your current RPLICE intervention assignments, milestones, and baseline targets.",
        whenToUse: "Call periodically to check if new assignments have been made for your platform.",
        requiresEcosystemKey: true,
      },
    },
  };
}

export function requireEcosystemAuth(req: Request, res: Response, next: Function) {
  const apiKey = req.headers["x-ecosystem-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-ecosystem-key header" });
  }
  next();
}

export async function resolveplatformFromKey(apiKey: string): Promise<any | null> {
  const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
  return platform || null;
}

export function registerEcosystemRpliceBridgeRoutes(app: Express) {

  app.get("/api/ecosystem/rplice/my-assignments", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolveplatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const intelligence = await generateRpliceHeartbeatIntelligence(platform.id);

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        relevanceScore: intelligence.relevanceScore,
        reasoning: intelligence.reasoning,
        interventionAssignments: intelligence.interventionAssignments,
        actionPlanMilestones: intelligence.actionPlanMilestones,
        outcomeBaselines: intelligence.outcomeBaselines,
        summary: {
          assignmentsRequiringAction: intelligence.interventionAssignments.filter((a: any) => a.actionRequired).length,
          milestonesOwned: intelligence.actionPlanMilestones.filter((m: any) => m.actionRequired).length,
          baselinesTracking: intelligence.outcomeBaselines.length,
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ecosystem/rplice/analyze", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolveplatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const { stateFips, countyFips, cityName } = req.body;
      if (!stateFips || !countyFips) {
        return res.status(400).json({ error: "stateFips and countyFips required" });
      }

      const platformRelevance = PLATFORM_RISK_RELEVANCE[platform.id] || [];
      const justification = platformRelevance.length > 0
        ? `Analysis requested by ${platform.name} (domains: ${platformRelevance.join(", ")}). Results will be filtered to ${platform.name}'s domain relevance.`
        : `Analysis requested by ${platform.name}. This platform has no mapped risk domains — results delivered for awareness only.`;

      const existingAnalysis = await db.select().from(rpliceAssessments)
        .where(eq(rpliceAssessments.programName, cityName || `${stateFips}-${countyFips}`))
        .orderBy(desc(rpliceAssessments.createdAt))
        .limit(1);

      if (existingAnalysis.length > 0) {
        const analysis = existingAnalysis[0];
        const riskFactors = extractRiskFactorsFromAnalysis(analysis.data);
        const relevantFactors = riskFactors.filter(f => platformRelevance.includes(f));

        return res.json({
          source: "cached",
          justification,
          analysisId: analysis.id,
          region: analysis.programName,
          relevantToYou: relevantFactors,
          notYourDomain: riskFactors.filter(f => !relevantFactors.includes(f)),
          data: analysis.data,
          actionRequired: relevantFactors.length >= 2,
          reasoning: relevantFactors.length >= 2
            ? `This analysis directly targets ${relevantFactors.join(", ")} — prepare your intervention capacity.`
            : relevantFactors.length > 0
            ? `Partial overlap with your domain (${relevantFactors.join(", ")}). Monitor but no immediate action.`
            : `This analysis does not target your domain. Delivered for ecosystem awareness only.`,
        });
      }

      res.json({
        source: "none",
        justification,
        message: `No existing analysis for state ${stateFips}, county ${countyFips}. Use the hub's RPLICE Tools page to run a full community analysis, or request one via POST /api/rplice/community-analysis on the hub.`,
        hubAnalysisUrl: "https://thrivingcommunitiesforall.com/rplice-tools",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ecosystem/rplice/narrative", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolveplatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const { stateFips, countyFips, cityName, grantName } = req.body;
      if (!stateFips || !countyFips || !grantName) {
        return res.status(400).json({ error: "stateFips, countyFips, and grantName required" });
      }

      const platformRelevance = PLATFORM_RISK_RELEVANCE[platform.id] || [];
      const grantDomainOverlap: Record<string, string[]> = {
        "bb-collective": ["research", "education"],
        "rare-impact": ["mental-health", "community", "health-equity"],
        "st-davids": ["health-equity"],
        "austin-fc": ["education", "community"],
        "ssg-fox": ["veterans", "mental-health"],
        "doj-bja": ["safety", "community"],
        "samhsa": ["mental-health", "health-equity"],
        "wioa": ["workforce", "education"],
        // Women's / maternal / health equity grants — added for HerHealth scope
        "nih-health-equity": ["health-equity", "community", "research"],
        "nih-womens-health": ["health-equity", "maternal-health", "mental-health", "research"],
        "nih-di-r01": ["health-equity", "research", "community"],
        "hrsa-mchb": ["maternal-health", "health-equity", "community"],
        "hrsa-rural-health": ["rural-health", "health-equity", "community"],
        "hrsa-fqhc": ["health-equity", "community", "rural-health"],
        "cdc-maternal-mortality": ["maternal-health", "health-equity", "advocacy"],
        "cdc-wisewoman": ["health-equity", "maternal-health", "education"],
        "cdc-hrif": ["health-equity", "rural-health", "community"],
        "cdc-places": ["health-equity", "research"],
        "robert-wood-johnson": ["health-equity", "community", "education", "advocacy"],
        "march-of-dimes": ["maternal-health", "health-equity", "advocacy"],
        "commonweal": ["health-equity", "community", "advocacy"],
        "acog-foundation": ["maternal-health", "health-equity", "education"],
        "wellbeing-trust": ["mental-health", "community", "rural-health"],
        "annie-casey": ["community", "advocacy", "education", "health-equity"],
        "kresge": ["health-equity", "community", "housing", "advocacy"],
        "w-k-kellogg": ["health-equity", "community", "education", "maternal-health"],
      };

      const grantDomains = grantDomainOverlap[grantName] || [];
      const relevantDomains = grantDomains.filter(d => platformRelevance.includes(d));

      if (relevantDomains.length === 0) {
        const reasoning = platformRelevance.length > 0
          ? `The ${grantName} grant targets ${grantDomains.join(", ")} — your platform (${platform.name}) covers ${platformRelevance.join(", ")}. No domain overlap. This narrative would not include your platform's contributions.`
          : `Your platform (${platform.name}) has no mapped risk domains. This grant narrative does not require your input — awareness only.`;
        return res.json({
          actionRequired: false,
          reasoning,
          suggestedGrants: platformRelevance.length > 0
            ? Object.entries(grantDomainOverlap)
                .filter(([_, domains]) => domains.some(d => platformRelevance.includes(d)))
                .map(([name, domains]) => ({ grantName: name, overlappingDomains: domains.filter(d => platformRelevance.includes(d)) }))
            : [],
        });
      }

      res.json({
        actionRequired: true,
        reasoning: `Grant ${grantName} targets ${grantDomains.join(", ")} — your platform contributes to ${relevantDomains.join(", ")}. Use the hub's Grant Narrative Generator to create the full narrative.`,
        hubEndpoint: `POST https://thrivingcommunitiesforall.com/api/rplice/grant-narrative`,
        body: { stateFips, countyFips, cityName, grantName },
        note: "The hub's Grant Narrative Generator uses SSE streaming. Connect via EventSource or handle text/event-stream response.",
        yourContribution: `Your platform (${platform.name}) should prepare outcome data for: ${relevantDomains.join(", ")}. This data strengthens the narrative with evidence of ecosystem-wide impact.`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ecosystem/rplice/report-outcome", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolveplatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const { baselineId, metricKey, currentValue, evidenceUrl, notes } = req.body;
      if (!baselineId || !metricKey || currentValue === undefined) {
        return res.status(400).json({ error: "baselineId, metricKey, and currentValue required" });
      }

      const [baseline] = await db.select().from(outcomeBaselines).where(eq(outcomeBaselines.id, baselineId));
      if (!baseline) return res.status(404).json({ error: "Baseline not found" });

      const metrics = baseline.metrics as Record<string, any> || {};
      const targets = baseline.targets as Record<string, any> || {};

      const baselineValue = metrics[metricKey];
      const targetValue = targets[metricKey];

      if (baselineValue === undefined) {
        return res.status(400).json({
          error: `Metric '${metricKey}' not found in baseline`,
          availableMetrics: Object.keys(metrics),
        });
      }

      const platformRelevance = PLATFORM_RISK_RELEVANCE[platform.id] || [];
      const metricDomainMap: Record<string, string[]> = {
        // Census / economic SDOH
        povertyRate: ["health-equity", "community", "housing"],
        collegePct: ["education"],
        unemploymentRate: ["workforce"],
        medianIncome: ["workforce", "community"],
        medianRent: ["housing"],
        riskScore100Tracts: ["safety", "mental-health"],
        marriagePct: ["community"],
        twoParentPct: ["community", "education"],
        // Maternal / birth outcomes
        maternalMortalityRate: ["health-equity", "maternal-health"],
        blackMaternalMortalityRate: ["health-equity", "maternal-health", "advocacy"],
        infantMortalityRate: ["health-equity", "maternal-health"],
        lowBirthWeightRate: ["health-equity", "maternal-health"],
        pretermBirthRate: ["health-equity", "maternal-health"],
        prenatalCareAccess: ["health-equity", "maternal-health", "community"],
        breastfeedingRate: ["health-equity", "maternal-health", "education"],
        postpartumConnectionRate: ["mental-health", "maternal-health", "community"],
        reproductiveHealthAccess: ["health-equity", "maternal-health"],
        // Mental health — women's focus
        epdsRate: ["mental-health", "maternal-health"],
        screeningCompletionRate: ["health-equity", "mental-health"],
        mentalHealthServiceAccessRate: ["mental-health", "community"],
        // Rural / geographic access
        ruralProviderRatio: ["rural-health", "health-equity"],
        ruralHealthAccessScore: ["rural-health", "health-equity"],
        telehealthAdoptionRate: ["rural-health", "health-equity", "education"],
        transportationBarrierRate: ["rural-health", "housing", "health-equity"],
        // Community health / CHW / advocacy
        communityHealthWorkerReach: ["community", "health-equity", "advocacy"],
        advocacyEngagementRate: ["advocacy", "community"],
        peerNavigatorSessionCount: ["community", "mental-health", "maternal-health"],
        // Health coverage / SDOH
        uninsuredWomenPct: ["health-equity"],
        medicaidEnrollmentRate: ["health-equity", "community"],
        preventiveCareUtilization: ["health-equity", "community"],
        socialVulnerabilityIndex: ["health-equity", "community", "housing"],
        // Research / outcomes tracking
        evidenceAdoptionRate: ["research", "education"],
        programFidelityScore: ["research", "community"],
      };

      const metricDomains = metricDomainMap[metricKey] || [];
      const domainMatch = metricDomains.some(d => platformRelevance.includes(d));

      if (!domainMatch && platformRelevance.length > 0) {
        return res.json({
          accepted: false,
          reasoning: `${platform.name} reported on '${metricKey}' but this metric maps to ${metricDomains.join(", ")} — your platform covers ${platformRelevance.join(", ")}. This report is noted but flagged for review. Platforms should report on metrics within their domain.`,
          suggestedMetrics: Object.entries(metricDomainMap)
            .filter(([_, domains]) => domains.some(d => platformRelevance.includes(d)))
            .map(([key, domains]) => ({ metric: key, relevantDomains: domains.filter(d => platformRelevance.includes(d)) })),
        });
      }

      const progress = targetValue !== undefined && targetValue !== baselineValue
        ? Math.round(((currentValue - baselineValue) / (targetValue - baselineValue)) * 100)
        : null;

      const outcomeReport = {
        platformId: platform.id,
        platformName: platform.name,
        metricKey,
        baselineValue,
        currentValue,
        targetValue: targetValue || null,
        progressPercent: progress,
        evidenceUrl: evidenceUrl || null,
        notes: notes || null,
        reportedAt: new Date().toISOString(),
        domainJustification: `${platform.name} reports on ${metricKey} (domains: ${metricDomains.join(", ")}) which aligns with platform capabilities: ${platformRelevance.join(", ")}.`,
      };

      const existingOutcomes = (baseline.targets as any)?.outcomeReports || [];
      existingOutcomes.push(outcomeReport);

      await db.update(outcomeBaselines)
        .set({
          targets: { ...(baseline.targets as any || {}), outcomeReports: existingOutcomes },
          updatedAt: new Date(),
        })
        .where(eq(outcomeBaselines.id, baselineId));

      res.json({
        accepted: true,
        reasoning: `Outcome report accepted. ${platform.name} contributed data on ${metricKey} for ${baseline.regionName}.`,
        report: outcomeReport,
        progressToTarget: progress !== null ? `${progress}% toward target` : "No target set — baseline tracking only",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/ecosystem/rplice/intelligence-summary", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolveplatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const intelligence = await generateRpliceHeartbeatIntelligence(platform.id);

      const actionItems: string[] = [];
      for (const a of intelligence.interventionAssignments) {
        if (a.actionRequired) actionItems.push(`[INTERVENTION] ${a.region}: ${a.suggestedAction}`);
      }
      for (const m of intelligence.actionPlanMilestones) {
        if (m.actionRequired) actionItems.push(`[MILESTONE] ${m.region} — ${m.milestone} (${m.status})`);
      }

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        relevanceScore: intelligence.relevanceScore,
        reasoning: intelligence.reasoning,
        actionItemCount: actionItems.length,
        actionItems: actionItems.length > 0 ? actionItems : ["No action items for your platform at this time. Continue monitoring."],
        fullIntelligence: intelligence.relevant ? intelligence : undefined,
        message: intelligence.relevant
          ? `${platform.name}: You have ${actionItems.length} RPLICE action item(s). Review and act on items within your domain.`
          : `${platform.name}: No RPLICE action items target your domain right now. Intelligence delivered for ecosystem awareness only — no action required.`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/ecosystem/rplice/research
  // Search RPLICE live research database by keyword/condition — scoped to the platform's domain.
  // Query params: q (required), condition, domain, limit (default 20)
  app.get("/api/ecosystem/rplice/research", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolveplatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const q = (req.query.q as string || "").trim();
      const condition = (req.query.condition as string || "").trim();
      const domainFilter = (req.query.domain as string || "").trim();
      const limit = Math.min(parseInt(req.query.limit as string || "20", 10) || 20, 50);

      // Build search query from platform domains + explicit params
      const platformDomains = PLATFORM_RISK_RELEVANCE[platform.id] || [];
      const domainTermMap: Record<string, string[]> = {
        "maternal-health":  ["maternal mortality", "prenatal", "postpartum", "birth outcomes", "obstetric"],
        "health-equity":    ["health equity", "disparities", "SDOH", "social determinants"],
        "mental-health":    ["depression", "anxiety", "EPDS", "postpartum depression", "perinatal mental health"],
        "rural-health":     ["rural health", "provider desert", "telehealth access", "rural women"],
        "advocacy":         ["policy", "advocacy", "health rights", "reproductive rights"],
        "community":        ["community health worker", "CHW", "peer navigator", "trusted messenger"],
        "research":         ["implementation science", "evidence-based", "CFIR", "randomized controlled"],
        "education":        ["health literacy", "patient education", "awareness"],
        "housing":          ["housing instability", "SDOH", "social determinants"],
      };

      // Auto-enrich the query with domain-relevant terms if no explicit q
      let searchQuery = q || condition;
      if (!searchQuery && platformDomains.length > 0) {
        const domainTerms: string[] = [];
        for (const d of platformDomains.slice(0, 3)) {
          const terms = domainTermMap[d];
          if (terms) domainTerms.push(terms[0]);
        }
        searchQuery = domainTerms.join(" OR ");
      }
      if (!searchQuery) {
        return res.status(400).json({ error: "Provide at least one of: q, condition — or ensure your platform has configured domains." });
      }

      const RPLICE_BASE = "https://www.bettersciencelab.com";
      const url = `${RPLICE_BASE}/api/v1/research?q=${encodeURIComponent(searchQuery)}&limit=${limit}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let rpliceResults: any = null;
      try {
        const resp = await fetch(url, {
          headers: { "Accept": "application/json", "User-Agent": "ThriveUp-TCAF-Hub/1.0" },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (resp.ok) {
          rpliceResults = await resp.json();
        }
      } catch (_fetchErr) {
        clearTimeout(timeout);
        // RPLICE is external — graceful degradation, not a hard error
      }

      // Filter results to the platform's domain scope
      const relevantDomainTerms = platformDomains.flatMap(d => domainTermMap[d] || []).map(t => t.toLowerCase());
      let studies: any[] = Array.isArray(rpliceResults) ? rpliceResults
        : Array.isArray(rpliceResults?.results) ? rpliceResults.results
        : Array.isArray(rpliceResults?.studies) ? rpliceResults.studies
        : [];

      if (domainFilter) {
        const filterTerms = (domainTermMap[domainFilter] || [domainFilter]).map(t => t.toLowerCase());
        studies = studies.filter(s => {
          const text = `${s.title || ""} ${s.abstract || ""} ${s.tags?.join(" ") || ""}`.toLowerCase();
          return filterTerms.some(t => text.includes(t));
        });
      }

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        platformDomains,
        query: searchQuery,
        domainFilter: domainFilter || null,
        resultCount: studies.length,
        studies: studies.slice(0, limit),
        source: "RPLICE — bettersciencelab.com live research database",
        rpliceAvailable: rpliceResults !== null,
        note: rpliceResults === null
          ? "RPLICE live database is temporarily unreachable. Results may be empty or incomplete."
          : `${studies.length} studies found matching your platform's domains (${platformDomains.join(", ")}).`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/ecosystem/rplice/equity-analysis
  // Pull RPLICE equity evaluation rubric + apply it to the platform's service population.
  // Returns a scored equity frame so HerHealth/BMV can surface gap analysis to their users.
  // Query params: zip (optional), fips (optional) — if neither provided, uses platform's registered ZIP.
  app.get("/api/ecosystem/rplice/equity-analysis", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const platform = await resolveplatformFromKey(apiKey);
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const platformDomains = PLATFORM_RISK_RELEVANCE[platform.id] || [];

      // Fetch RPLICE equity rubric and grant profiles in parallel
      const RPLICE_BASE = "https://www.bettersciencelab.com";
      const fetchRplice = async (path: string): Promise<any> => {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 12000);
        try {
          const r = await fetch(`${RPLICE_BASE}${path}`, {
            headers: { "Accept": "application/json", "User-Agent": "ThriveUp-TCAF-Hub/1.0" },
            signal: controller.signal,
          });
          clearTimeout(to);
          if (r.ok) return await r.json();
          return null;
        } catch { clearTimeout(to); return null; }
      };

      const [rubric, grantProfiles, cfirConstructs] = await Promise.all([
        fetchRplice("/api/v1/equity-evaluation/rubric"),
        fetchRplice("/api/v1/grants/profiles"),
        fetchRplice("/api/v1/cfir/constructs"),
      ]);

      // Derive domain-relevant equity dimensions from rubric
      const equityDimensionMap: Record<string, string[]> = {
        "health-equity":   ["racial equity", "gender equity", "health disparities", "SDOH screening", "access to care"],
        "maternal-health": ["maternal mortality", "prenatal access", "postpartum support", "birth equity", "midwifery access"],
        "mental-health":   ["mental health parity", "perinatal mental health", "trauma-informed care", "EPDS screening"],
        "rural-health":    ["rural access", "provider supply", "telehealth", "geographic barriers", "HPSA designation"],
        "advocacy":        ["policy alignment", "community voice", "rights navigation", "legislative awareness"],
        "community":       ["CHW workforce", "peer support", "trusted messenger", "co-design", "lived experience"],
        "education":       ["health literacy", "plain language", "culturally responsive education", "awareness campaigns"],
        "housing":         ["housing stability", "SDOH navigation", "eviction risk", "homelessness prevention"],
        "research":        ["evidence base", "implementation fidelity", "evaluation design", "data sovereignty"],
      };

      const relevantDimensions: string[] = [];
      for (const domain of platformDomains) {
        const dims = equityDimensionMap[domain] || [];
        relevantDimensions.push(...dims);
      }
      const uniqueDimensions = [...new Set(relevantDimensions)];

      // Score each dimension against rubric (stub score if RPLICE unreachable)
      const dimensionScores = uniqueDimensions.map(dim => {
        let rubricMatch: any = null;
        if (Array.isArray(rubric?.dimensions)) {
          rubricMatch = rubric.dimensions.find((d: any) =>
            (d.name || d.label || d.title || "").toLowerCase().includes(dim.split(" ")[0].toLowerCase())
          );
        }
        return {
          dimension: dim,
          rubricAligned: !!rubricMatch,
          rubricWeight: rubricMatch?.weight || null,
          rubricGuidance: rubricMatch?.guidance || rubricMatch?.description || null,
          platformDomains: platformDomains.filter(pd => (equityDimensionMap[pd] || []).includes(dim)),
        };
      });

      // Filter grant profiles for platform-relevant ones
      const relevantGrants: any[] = [];
      if (Array.isArray(grantProfiles)) {
        for (const g of grantProfiles) {
          const tags = `${g.title || ""} ${g.tags?.join(" ") || ""} ${g.domain || ""}`.toLowerCase();
          const domainHit = platformDomains.some(pd => {
            const terms = equityDimensionMap[pd] || [];
            return terms.some(t => tags.includes(t.split(" ")[0].toLowerCase()));
          });
          if (domainHit) relevantGrants.push(g);
        }
      }

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        platformDomains,
        equityDimensions: {
          total: uniqueDimensions.length,
          rubricAligned: dimensionScores.filter(d => d.rubricAligned).length,
          dimensions: dimensionScores,
        },
        cfirConstructCount: Array.isArray(cfirConstructs) ? cfirConstructs.length : (cfirConstructs?.constructs?.length ?? null),
        relevantGrantProfiles: relevantGrants.slice(0, 15),
        rpliceDataAvailable: {
          rubric: rubric !== null,
          grants: grantProfiles !== null,
          cfir: cfirConstructs !== null,
        },
        source: "RPLICE equity evaluation rubric — bettersciencelab.com",
        note: `Equity analysis scoped to ${platform.name}'s ${platformDomains.length} domain(s): ${platformDomains.join(", ")}. ${uniqueDimensions.length} equity dimensions identified.`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
