import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { rpliceAssessments, rpliceActionPlans, outcomeBaselines, ecosystemPlatforms } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const PLATFORM_DOMAIN_MAP: Record<string, string[]> = {
  "education": ["isss", "wholemind", "betterscience"],
  "health-equity": ["whole-person-health", "sankofa", "sankofa-feminine-health", "sankofa-maternal-health", "sankofa-mens-health", "perfectly-different", "safecognicare", "autoimmune-thrive", "pillscheduler", "speech-bridge"],
  "workforce": ["mce", "pinnacle-business-conglomerate", "collaborative-advocate"],
  "veterans": ["m2c", "collaborative-advocate", "sankofa-mens-health"],
  "compliance": ["safereport", "shield-atlas"],
  "housing": ["lifebridge"],
  "mental-health": ["whole-person-health", "perfectly-different", "safecognicare"],
  "research": ["betterscience"],
  "community": ["lifebridge", "whole-person-health"],
  "business": ["mce", "pinnacle-business-conglomerate"],
};

const PLATFORM_RISK_RELEVANCE: Record<string, string[]> = {
  "whole-person-health": ["health-equity", "mental-health", "veterans", "community"],
  "isss": ["education"],
  "sankofa": ["health-equity"],
  "sankofa-feminine-health": ["health-equity"],
  "sankofa-maternal-health": ["health-equity"],
  "sankofa-mens-health": ["health-equity", "veterans"],
  "shield-atlas": ["safety", "housing"],
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

function requireEcosystemAuth(req: Request, res: Response, next: Function) {
  const apiKey = req.headers["x-ecosystem-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-ecosystem-key header" });
  }
  next();
}

async function resolveplatformFromKey(apiKey: string): Promise<any | null> {
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
        povertyRate: ["health-equity", "community", "housing"],
        collegePct: ["education"],
        unemploymentRate: ["workforce"],
        medianIncome: ["workforce", "community"],
        medianRent: ["housing"],
        riskScore100Tracts: ["safety", "mental-health"],
        marriagePct: ["community"],
        twoParentPct: ["community", "education"],
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
}
