import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  preventionProgress, preventionModules, riskAssessments, surveyResponses, youthSurveys,
  coalitions, coalitionSectors, coalitionMembers, coalitionMeetings, coalitionActionItems,
  coalitionCapacityAssessments, communityActionPlans, costMatchRecords,
  dfcCoreMeasures, dfcStakeholderSurveys, communityReadinessAssessments,
  evidenceBasedPrograms, ebpImplementations, environmentalStrategies, strategyMetrics,
  cfirAssessments, mediaCampaigns, campaignMetrics,
  dfcReadinessItems, stakeholderCommitments,
  parentEducationModules, parentEducationProgress, familyAssessments,
  engagementDosageLogs, outcomeTracking,
  dfcWizardState, insertDfcWizardStateSchema,
} from "@shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export function registerDfcIntegrationRoutes(app: Express) {

  app.get("/api/dfc/command-center", requireAuth, async (_req, res) => {
    try {
      const [allCoalitions, sectors, members, meetings, actionItems, capacityAssessments, actionPlans, costRecords] = await Promise.all([
        db.select().from(coalitions),
        db.select().from(coalitionSectors),
        db.select().from(coalitionMembers),
        db.select().from(coalitionMeetings).orderBy(desc(coalitionMeetings.scheduledDate)),
        db.select().from(coalitionActionItems),
        db.select().from(coalitionCapacityAssessments).orderBy(desc(coalitionCapacityAssessments.assessedAt)),
        db.select().from(communityActionPlans),
        db.select().from(costMatchRecords),
      ]);

      const [prevModules, prevProgress, riskAssess, surveyResp, surveys] = await Promise.all([
        db.select().from(preventionModules).where(eq(preventionModules.isActive, true)),
        db.select().from(preventionProgress),
        db.select().from(riskAssessments).orderBy(desc(riskAssessments.completedAt)),
        db.select().from(surveyResponses),
        db.select().from(youthSurveys),
      ]);

      const [coreMeasures, stakeholderSurveys, readinessAssessments, ebps, implementations, envStrategies, stratMetrics, cfirAssess] = await Promise.all([
        db.select().from(dfcCoreMeasures).orderBy(desc(dfcCoreMeasures.createdAt)),
        db.select().from(dfcStakeholderSurveys).orderBy(desc(dfcStakeholderSurveys.createdAt)),
        db.select().from(communityReadinessAssessments).orderBy(desc(communityReadinessAssessments.createdAt)),
        db.select().from(evidenceBasedPrograms),
        db.select().from(ebpImplementations),
        db.select().from(environmentalStrategies),
        db.select().from(strategyMetrics),
        db.select().from(cfirAssessments).orderBy(desc(cfirAssessments.createdAt)),
      ]);

      const [campaigns, campMetrics, readinessItems, commitments, parentModules, parentProgress, familyAssess, dosageLogs, outcomes] = await Promise.all([
        db.select().from(mediaCampaigns),
        db.select().from(campaignMetrics),
        db.select().from(dfcReadinessItems),
        db.select().from(stakeholderCommitments),
        db.select().from(parentEducationModules).where(eq(parentEducationModules.isActive, true)),
        db.select().from(parentEducationProgress),
        db.select().from(familyAssessments),
        db.select().from(engagementDosageLogs),
        db.select().from(outcomeTracking),
      ]);

      const representedSectors = sectors.filter(s => s.isRepresented).length;
      const totalSectors = sectors.length || 12;
      const latestCapacity = capacityAssessments.length > 0 ? capacityAssessments[0] : null;
      const totalCostMatch = costRecords.reduce((sum, r) => sum + parseFloat(r.dollarValue || "0"), 0);
      const pendingActions = actionItems.filter(a => a.status !== "completed").length;
      const lastMeetingObj = meetings.length > 0 ? meetings[0] : null;

      const uniqueCompletedModules = new Set(prevProgress.filter(p => p.status === "completed").map(p => p.moduleId)).size;
      const totalPrevModules = prevModules.length;
      const completionRate = totalPrevModules > 0 ? Math.min(100, Math.round((uniqueCompletedModules / totalPrevModules) * 100)) : 0;

      const riskScores = riskAssess.filter(a => a.assessmentType === "risk").map(a => a.riskScore);
      const protScores = riskAssess.filter(a => a.assessmentType === "protective").map(a => a.protectiveScore);
      const avgRisk = riskScores.length > 0 ? Math.round(riskScores.reduce((s, v) => s + v, 0) / riskScores.length) : 0;
      const avgProtective = protScores.length > 0 ? Math.round(protScores.reduce((s, v) => s + v, 0) / protScores.length) : 0;

      const activeEBPs = implementations.filter(i => i.implementationStage === "active" || i.implementationStage === "full_implementation").length;
      const activeStrategies = envStrategies.filter(s => s.status === "active").length;
      const plannedStrategies = envStrategies.filter(s => s.status === "planned").length;

      const latestReadiness = readinessAssessments.length > 0 ? readinessAssessments[0] : null;
      const populationTypes = Array.from(new Set(stakeholderSurveys.map(s => s.populationType)));
      const surveyCoverage = populationTypes.length;

      const uniqueCompletedParentMods = new Set(parentProgress.filter(p => p.status === "completed").map(p => p.moduleId)).size;
      const totalParentMods = parentModules.length;
      const parentCompletionRate = totalParentMods > 0 ? Math.min(100, Math.round((uniqueCompletedParentMods / totalParentMods) * 100)) : 0;

      const activeCampaigns = campaigns.filter(c => c.status === "active");
      const totalImpressions = campMetrics.reduce((s, m) => s + (m.impressions || 0), 0);
      const totalInteractions = campMetrics.reduce((s, m) => s + (m.interactions || 0), 0);
      const totalEvents = campMetrics.reduce((s, m) => s + (m.eventAttendance || 0), 0);
      const engagementRate = totalImpressions > 0 ? Math.round((totalInteractions / totalImpressions) * 10000) / 100 : 0;

      const completedReadiness = readinessItems.filter(i => i.status === "completed").length;
      const totalReadinessItems = readinessItems.length;
      const readinessScore = totalReadinessItems > 0 ? Math.round((completedReadiness / totalReadinessItems) * 100) : 0;

      const committedSectors = new Set(commitments.map(c => c.sectorNumber)).size;
      const deliveredCommitments = commitments.filter(c => c.status === "delivered").length;

      const totalDosageMinutes = dosageLogs.reduce((s, l) => s + l.durationMinutes, 0);
      const uniqueParticipants = new Set(dosageLogs.map(l => l.userId)).size;
      const preventionOutcomes = outcomes.filter(o => o.category === "prevention" || o.category === "education");

      const latestCfir = cfirAssess.length > 0 ? cfirAssess[0] : null;

      const fidelityScores = implementations
        .filter(i => i.fidelityScore !== null && i.fidelityScore !== undefined)
        .map(i => i.fidelityScore!);
      const avgFidelity = fidelityScores.length > 0 ? Math.round(fidelityScores.reduce((s, v) => s + v, 0) / fidelityScores.length) : 0;

      const totalReach = stakeholderSurveys.reduce((s, sv) => s + (sv.respondentCount || 0), 0);
      const reaimScores = {
        reach: totalReach,
        effectiveness: latestReadiness ? Math.round((latestReadiness.overallReadiness || 0) / 9 * 100) : 0,
        adoption: surveyCoverage,
        implementation: avgFidelity,
        maintenance: readinessAssessments.length,
      };

      const alerts: string[] = [];
      if (representedSectors < 12) alerts.push(`Only ${representedSectors}/12 sectors represented`);
      if (completedReadiness < totalReadinessItems * 0.5) alerts.push("Less than 50% of readiness items completed");
      if (meetings.length === 0) alerts.push("No coalition meetings scheduled yet");
      if (totalCostMatch < 125000 * 0.25) alerts.push("Cost match is below 25% of $125K target");
      if (latestReadiness && (latestReadiness.overallReadiness || 0) < 4) alerts.push("Community readiness is below Preplanning stage");

      const byAgeGroup: Record<string, number> = {};
      prevModules.forEach(m => {
        const completed = prevProgress.filter(p => p.moduleId === m.id && p.status === "completed").length;
        const key = m.ageGroup;
        byAgeGroup[key] = (byAgeGroup[key] || 0) + completed;
      });

      const bySubstanceTopic: Record<string, number> = {};
      prevModules.forEach(m => {
        const completed = prevProgress.filter(p => p.moduleId === m.id && p.status === "completed").length;
        const key = m.substanceTopic;
        bySubstanceTopic[key] = (bySubstanceTopic[key] || 0) + completed;
      });

      const actionPlansByPhase: Record<string, number> = {};
      actionPlans.forEach(p => {
        actionPlansByPhase[p.spfPhase] = (actionPlansByPhase[p.spfPhase] || 0) + 1;
      });

      res.json({
        coalitionHealth: {
          sectorCoverage: representedSectors,
          totalSectors,
          memberCount: members.length,
          latestCapacityScore: latestCapacity?.overallScore ?? 0,
          capacityTrend: capacityAssessments.slice(0, 5).map(a => ({ score: a.overallScore, date: a.assessedAt })),
          meetingCount: meetings.length,
          lastMeetingDate: lastMeetingObj?.scheduledDate || null,
          pendingActionItems: pendingActions,
          costMatchTotal: totalCostMatch,
          costMatchTarget: 125000,
          actionPlansByPhase,
        },
        preventionImpact: {
          youthReached: uniqueParticipants,
          curriculumCompletionRate: completionRate,
          completionByAgeGroup: byAgeGroup,
          completionByTopic: bySubstanceTopic,
          avgRiskScore: avgRisk,
          avgProtectiveScore: avgProtective,
          riskTrend: riskAssess.slice(0, 10).map(a => ({ score: a.riskScore, date: a.completedAt })),
          protectiveTrend: riskAssess.filter(a => a.assessmentType === "protective").slice(0, 10).map(a => ({ score: a.protectiveScore, date: a.completedAt })),
          activeEBPs,
          totalEBPs: ebps.length,
          avgFidelityScore: avgFidelity,
          activeStrategies,
          plannedStrategies,
          totalAssessments: riskAssess.length,
          totalSurveyResponses: surveyResp.length,
        },
        communityEngagement: {
          readinessStage: latestReadiness?.readinessStage || "Not assessed",
          readinessScore: latestReadiness?.overallReadiness || 0,
          surveyCoverage,
          coreMeasures: coreMeasures.slice(0, 4).map(m => ({
            ageGroup: m.ageGroup,
            alcoholPast30: m.alcoholPast30,
            marijuanaPast30: m.marijuanaPast30,
            tobaccoPast30: m.tobaccoPast30,
            prescriptionPast30: m.prescriptionPast30,
            periodType: m.periodType,
          })),
          parentCompletionRate,
          totalParentModules: totalParentMods,
          completedParentModules: completedParent,
          familyAssessments: familyAssess.length,
          campaignReach: totalImpressions,
          campaignEngagement: totalInteractions,
          campaignEvents: totalEvents,
          engagementRate,
          activeCampaigns: activeCampaigns.length,
          reaimScores,
          cfirScores: latestCfir ? {
            interventionCharacteristics: latestCfir.interventionCharacteristics,
            outerSetting: latestCfir.outerSetting,
            innerSetting: latestCfir.innerSetting,
            individuals: latestCfir.individuals,
            implementationProcess: latestCfir.implementationProcess,
            overallScore: latestCfir.overallScore,
          } : null,
        },
        grantReadiness: {
          readinessScore,
          completedItems: completedReadiness,
          totalItems: totalReadinessItems,
          committedSectors,
          totalCommitments: commitments.length,
          deliveredCommitments,
          costMatchDocumented: totalCostMatch,
          daysUntilDeadline: Math.ceil((new Date("2026-04-14").getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        },
        dosage: {
          totalMinutes: totalDosageMinutes,
          totalHours: Math.round((totalDosageMinutes / 60) * 100) / 100,
          uniqueParticipants,
          preventionOutcomes: preventionOutcomes.length,
        },
        alerts,
      });
    } catch (error) {
      console.error("Failed to fetch command center data:", error);
      res.status(500).json({ error: "Failed to fetch command center data" });
    }
  });

  app.post("/api/dfc/sync-bridges", requireAuth, async (_req, res) => {
    try {
      const results: Record<string, string> = {};

      const riskAssess = await db.select().from(riskAssessments).orderBy(desc(riskAssessments.completedAt));
      if (riskAssess.length > 0) {
        const riskScores = riskAssess.filter(a => a.assessmentType === "risk").map(a => a.riskScore);
        const avgRisk = riskScores.length > 0 ? Math.round(riskScores.reduce((s, v) => s + v, 0) / riskScores.length) : 0;
        results.riskToCoreMeasures = `Aggregated ${riskScores.length} risk assessments, avg score: ${avgRisk}`;
      }

      const implementations = await db.select().from(ebpImplementations);
      results.ebpToDosage = `Found ${implementations.length} EBP implementations for dosage tracking`;

      const campMetrics = await db.select().from(campaignMetrics);
      const totalImpressions = campMetrics.reduce((s, m) => s + (m.impressions || 0), 0);
      results.campaignToReaim = `Campaign reach: ${totalImpressions} total impressions`;

      const stakeSurveys = await db.select().from(dfcStakeholderSurveys);
      const populationTypes = new Set(stakeSurveys.map(s => s.populationType));
      results.surveysToReadiness = `${populationTypes.size}/10 populations surveyed`;

      res.json({ synced: true, timestamp: new Date().toISOString(), results });
    } catch (error) {
      console.error("Failed to sync bridges:", error);
      res.status(500).json({ error: "Failed to sync bridges" });
    }
  });

  app.get("/api/dfc/data-bridges", requireAuth, async (_req, res) => {
    try {
      const riskAssess = await db.select().from(riskAssessments);
      const implementations = await db.select().from(ebpImplementations);
      const campMetrics = await db.select().from(campaignMetrics);
      const stakeSurveys = await db.select().from(dfcStakeholderSurveys);

      res.json({
        bridges: [
          {
            name: "Risk Assessments → Core Measures",
            description: "Auto-aggregate risk assessment data into DFC core measures summary",
            sourceCount: riskAssess.length,
            status: riskAssess.length > 0 ? "active" : "pending",
          },
          {
            name: "EBP Implementation → Dosage Logs",
            description: "When EBP implementation is logged, create corresponding dosage log entry",
            sourceCount: implementations.length,
            status: implementations.length > 0 ? "active" : "pending",
          },
          {
            name: "Campaign Metrics → RE-AIM Reach",
            description: "When media campaign metrics are updated, update RE-AIM Reach computation",
            sourceCount: campMetrics.length,
            status: campMetrics.length > 0 ? "active" : "pending",
          },
          {
            name: "Stakeholder Surveys → Community Readiness",
            description: "When stakeholder surveys reach threshold, update community readiness indicators",
            sourceCount: stakeSurveys.length,
            status: stakeSurveys.length >= 5 ? "active" : "pending",
          },
        ],
      });
    } catch (error) {
      console.error("Failed to fetch data bridges:", error);
      res.status(500).json({ error: "Failed to fetch data bridges" });
    }
  });

  app.get("/api/dfc/wizard-state", requireAuth, async (req, res) => {
    try {
      const visitorId = getUserId(req)!;
      const { wizardType } = req.query;
      let states;
      if (wizardType && typeof wizardType === "string") {
        states = await db.select().from(dfcWizardState).where(
          and(eq(dfcWizardState.visitorId, visitorId), eq(dfcWizardState.wizardType, wizardType))
        );
      } else {
        states = await db.select().from(dfcWizardState).where(eq(dfcWizardState.visitorId, visitorId));
      }
      res.json(states);
    } catch (error) {
      console.error("Failed to fetch wizard state:", error);
      res.status(500).json({ error: "Failed to fetch wizard state" });
    }
  });

  app.post("/api/dfc/wizard-state", requireAuth, async (req, res) => {
    try {
      const visitorId = getUserId(req)!;
      const parsed = insertDfcWizardStateSchema.safeParse({ ...req.body, visitorId });
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });

      const existing = await db.select().from(dfcWizardState).where(
        and(eq(dfcWizardState.visitorId, visitorId), eq(dfcWizardState.wizardType, parsed.data.wizardType))
      );

      if (existing.length > 0) {
        const [updated] = await db.update(dfcWizardState).set({
          currentStep: parsed.data.currentStep,
          completedSteps: parsed.data.completedSteps,
          metadata: parsed.data.metadata,
          updatedAt: new Date(),
        }).where(eq(dfcWizardState.id, existing[0].id)).returning();
        return res.json(updated);
      }

      const [state] = await db.insert(dfcWizardState).values(parsed.data).returning();
      res.json(state);
    } catch (error) {
      console.error("Failed to save wizard state:", error);
      res.status(500).json({ error: "Failed to save wizard state" });
    }
  });
}
