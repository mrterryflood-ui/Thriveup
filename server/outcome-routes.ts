import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  outcomeTracking, reentryPlans, reentryMilestones,
  insertOutcomeTrackingSchema,
  workforceAssessments, trainingEnrollments, jobPlacements, retentionChecks, employerPartners, trainingPrograms,
  communityPartners, partnerReferrals, partnerEngagements,
  mouDocuments, ambassadorProfiles,
  preventionModules, preventionProgress, riskAssessments, youthSurveys, surveyResponses,
} from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, and, count } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher" || user?.role === "case_manager") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

const outcomeCreateSchema = insertOutcomeTrackingSchema.pick({
  userId: true, planId: true, cohortId: true, category: true, metricName: true,
  metricValue: true, periodMonths: true, source: true,
});

export function registerOutcomeRoutes(app: Express) {
  app.get("/api/outcomes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let results;
      if (category) {
        results = await db.select().from(outcomeTracking).where(eq(outcomeTracking.category, category)).orderBy(desc(outcomeTracking.measurementDate));
      } else {
        results = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.measurementDate));
      }
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch outcomes:", error);
      res.status(500).json({ error: "Failed to fetch outcomes" });
    }
  });

  app.post("/api/outcomes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = outcomeCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid outcome data", details: parsed.error.flatten().fieldErrors });
      const [outcome] = await db.insert(outcomeTracking).values(parsed.data).returning();
      res.json(outcome);
    } catch (error) {
      console.error("Failed to create outcome:", error);
      res.status(500).json({ error: "Failed to create outcome" });
    }
  });

  app.get("/api/outcomes/user/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId as string;
      const outcomes = await db.select().from(outcomeTracking).where(eq(outcomeTracking.userId, userId)).orderBy(desc(outcomeTracking.measurementDate));
      res.json(outcomes);
    } catch (error) {
      console.error("Failed to fetch user outcomes:", error);
      res.status(500).json({ error: "Failed to fetch user outcomes" });
    }
  });

  app.get("/api/outcomes/dashboard", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.measurementDate));
      const plans = await db.select().from(reentryPlans);
      const milestones = await db.select().from(reentryMilestones);

      const uniqueUsers = new Set(outcomes.map(o => o.userId));
      const completedMilestones = milestones.filter(m => m.status === "completed").length;

      const categoryCounts: Record<string, Record<string, number>> = {};
      for (const o of outcomes) {
        if (!categoryCounts[o.category]) categoryCounts[o.category] = { total: 0 };
        categoryCounts[o.category].total++;
        categoryCounts[o.category][o.metricName] = (categoryCounts[o.category][o.metricName] || 0) + 1;
      }

      const partners = await db.select().from(communityPartners);
      const referrals = await db.select().from(partnerReferrals);
      const engagements = await db.select().from(partnerEngagements);
      const mous = await db.select().from(mouDocuments);
      const ambassadors = await db.select().from(ambassadorProfiles);

      res.json({
        totalOutcomes: outcomes.length,
        uniqueParticipants: uniqueUsers.size,
        totalActivePlans: plans.filter(p => p.status === "active").length,
        milestoneCompletionRate: milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0,
        ...categoryCounts,
        stakeholderEcosystem: {
          totalPartners: partners.length,
          verifiedPartners: partners.filter(p => p.isVerified).length,
          activeMOUs: mous.filter(m => m.status === "active" || m.status === "signed").length,
          totalReferrals: referrals.length,
          completedReferrals: referrals.filter(r => r.status === "completed").length,
          referralCompletionRate: referrals.length > 0 ? Math.round((referrals.filter(r => r.status === "completed").length / referrals.length) * 100) : 0,
          totalEngagements: engagements.length,
          totalVolunteerHours: engagements.reduce((s, e) => s + (e.volunteerHours || 0), 0),
          totalParticipantsServed: engagements.reduce((s, e) => s + (e.participantsServed || 0), 0),
          totalResourcesDistributed: engagements.reduce((s, e) => s + (e.resourcesDistributed || 0), 0),
          activeAmbassadors: ambassadors.filter(a => a.status === "active").length,
          partnerTypeBreakdown: Object.entries(
            partners.reduce<Record<string, number>>((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {})
          ).map(([type, count]) => ({ type, count })),
          hiringCommitments: partners.reduce((s, p) => s + (p.hiringCommitments || 0), 0),
          hiringFulfilled: partners.reduce((s, p) => s + (p.hiringFulfilled || 0), 0),
          diversionReferrals: partners.reduce((s, p) => s + (p.diversionReferrals || 0), 0),
        },
      });
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/outcomes/report/doj", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking);
      const plans = await db.select().from(reentryPlans);
      const milestones = await db.select().from(reentryMilestones);
      const wfPlacements = await db.select().from(jobPlacements);
      const wfRetention = await db.select().from(retentionChecks);
      const wfEnrollments = await db.select().from(trainingEnrollments);
      const wfAssessments = await db.select().from(workforceAssessments);

      const recidivism = outcomes.filter(o => o.category === "recidivism");
      const employment = outcomes.filter(o => o.category === "employment");
      const education = outcomes.filter(o => o.category === "education");
      const housing = outcomes.filter(o => o.category === "housing");

      const sixMonth = recidivism.filter(o => o.periodMonths === 6);
      const twelveMonth = recidivism.filter(o => o.periodMonths === 12);
      const thirtySixMonth = recidivism.filter(o => o.periodMonths === 36);

      const wfRetained = wfRetention.filter(r => r.employmentStatus === "employed");
      const wfRetention30 = wfRetention.filter(r => r.checkPeriodDays === 30);
      const wfRetention90 = wfRetention.filter(r => r.checkPeriodDays === 90);

      const partners = await db.select().from(communityPartners);
      const partnerRefs = await db.select().from(partnerReferrals);
      const engagements = await db.select().from(partnerEngagements);
      const mous = await db.select().from(mouDocuments);

      const report = {
        generatedAt: new Date().toISOString(),
        reportType: "OJJDP Grant Performance Report",
        grantProgram: "Second Chance Act Youth Reentry",
        programOverview: {
          totalParticipantsServed: new Set([...plans.map(p => p.userId), ...outcomes.map(o => o.userId), ...wfAssessments.map(a => a.userId)]).size,
          activePlans: plans.filter(p => p.status === "active").length,
          completedPlans: plans.filter(p => p.status === "completed").length,
          programCompletionRate: plans.length > 0 ? Math.round((plans.filter(p => p.status === "completed").length / plans.length) * 100) : 0,
        },
        recidivismOutcomes: {
          sixMonth: { tracked: sixMonth.length, noReoffense: sixMonth.filter(o => o.metricValue === "no_reoffense").length },
          twelveMonth: { tracked: twelveMonth.length, noReoffense: twelveMonth.filter(o => o.metricValue === "no_reoffense").length },
          thirtySixMonth: { tracked: thirtySixMonth.length, noReoffense: thirtySixMonth.filter(o => o.metricValue === "no_reoffense").length },
        },
        employmentOutcomes: {
          totalPlaced: employment.filter(o => o.metricName === "job_placement").length + wfPlacements.length,
          activePlacements: wfPlacements.filter(p => p.status === "active").length,
          retention30Day: {
            tracked: employment.filter(o => o.metricName === "retention" && o.periodMonths === 1).length + wfRetention30.length,
            retained: employment.filter(o => o.metricName === "retention" && o.periodMonths === 1 && o.metricValue === "retained").length + wfRetention30.filter(r => r.employmentStatus === "employed").length,
          },
          retention90Day: {
            tracked: employment.filter(o => o.metricName === "retention" && o.periodMonths === 3).length + wfRetention90.length,
            retained: employment.filter(o => o.metricName === "retention" && o.periodMonths === 3 && o.metricValue === "retained").length + wfRetention90.filter(r => r.employmentStatus === "employed").length,
          },
        },
        educationOutcomes: {
          enrolled: education.filter(o => o.metricName === "enrollment").length + wfEnrollments.length,
          credentialsEarned: education.filter(o => o.metricName === "credential_completion").length + wfEnrollments.filter(e => e.status === "completed").length,
        },
        housingOutcomes: {
          tracked: housing.length,
          stable: housing.filter(o => o.metricValue === "stable").length,
        },
        milestoneProgress: {
          total: milestones.length,
          completed: milestones.filter(m => m.status === "completed").length,
          completionRate: milestones.length > 0 ? Math.round((milestones.filter(m => m.status === "completed").length / milestones.length) * 100) : 0,
        },
        workforcePipeline: {
          totalAssessments: wfAssessments.length,
          trainingEnrollments: wfEnrollments.length,
          trainingCompleted: wfEnrollments.filter(e => e.status === "completed").length,
          jobPlacements: wfPlacements.length,
          retentionChecks: wfRetention.length,
          overallRetentionRate: wfRetention.length > 0 ? Math.round((wfRetained.length / wfRetention.length) * 100) : 0,
        },
        communityPartnership: {
          totalPartners: partners.length,
          verifiedPartners: partners.filter(p => p.isVerified).length,
          activeMOUs: mous.filter(m => m.status === "active" || m.status === "signed").length,
          partnerReferralsMade: partnerRefs.length,
          partnerReferralsCompleted: partnerRefs.filter(r => r.status === "completed").length,
          communityEngagementEvents: engagements.length,
          volunteerHoursLogged: engagements.reduce((s, e) => s + (e.volunteerHours || 0), 0),
          participantsServedByPartners: engagements.reduce((s, e) => s + (e.participantsServed || 0), 0),
          resourcesDistributed: engagements.reduce((s, e) => s + (e.resourcesDistributed || 0), 0),
          employerHiringCommitments: partners.reduce((s, p) => s + (p.hiringCommitments || 0), 0),
          employerHiringFulfilled: partners.reduce((s, p) => s + (p.hiringFulfilled || 0), 0),
          diversionReferrals: partners.reduce((s, p) => s + (p.diversionReferrals || 0), 0),
          educationPartners: partners.filter(p => p.type === "School/Education").length,
          faithBasedPartners: partners.filter(p => p.type === "Church/Faith-Based").length,
          lawEnforcementPartners: partners.filter(p => p.type === "Law Enforcement").length,
        },
      };
      res.json(report);
    } catch (error) {
      console.error("Failed to generate DOJ report:", error);
      res.status(500).json({ error: "Failed to generate DOJ report" });
    }
  });

  app.get("/api/outcomes/workforce", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const allAssessments = await db.select().from(workforceAssessments);
      const allEnrollments = await db.select().from(trainingEnrollments);
      const allPlacements = await db.select().from(jobPlacements);
      const allRetention = await db.select().from(retentionChecks);
      const [employerCount] = await db.select({ count: count() }).from(employerPartners);
      const [programCount] = await db.select({ count: count() }).from(trainingPrograms);

      const completedEnrollments = allEnrollments.filter(e => e.status === "completed");
      const activePlacements = allPlacements.filter(p => p.status === "active");
      const retainedChecks = allRetention.filter(r => r.employmentStatus === "employed");

      const retention30 = allRetention.filter(r => r.checkPeriodDays === 30);
      const retention90 = allRetention.filter(r => r.checkPeriodDays === 90);
      const retention180 = allRetention.filter(r => r.checkPeriodDays === 180);
      const retention365 = allRetention.filter(r => r.checkPeriodDays === 365);

      const uniqueParticipants = new Set([
        ...allAssessments.map(a => a.userId),
        ...allEnrollments.map(e => e.userId),
        ...allPlacements.map(p => p.userId),
      ]);

      res.json({
        reportType: "WIOA/DOL Workforce Pipeline Outcomes",
        generatedAt: new Date().toISOString(),
        participantMetrics: {
          totalAssessed: allAssessments.length,
          uniqueParticipants: uniqueParticipants.size,
          totalEnrolledInTraining: allEnrollments.length,
          trainingCompleted: completedEnrollments.length,
          trainingCompletionRate: allEnrollments.length > 0 ? Math.round((completedEnrollments.length / allEnrollments.length) * 100) : 0,
        },
        employmentOutcomes: {
          totalPlaced: allPlacements.length,
          activePlacements: activePlacements.length,
          employmentRate: allAssessments.length > 0 ? Math.round((activePlacements.length / allAssessments.length) * 100) : 0,
        },
        retentionOutcomes: {
          totalChecks: allRetention.length,
          retainedCount: retainedChecks.length,
          overallRetentionRate: allRetention.length > 0 ? Math.round((retainedChecks.length / allRetention.length) * 100) : 0,
          thirtyDay: { total: retention30.length, retained: retention30.filter(r => r.employmentStatus === "employed").length },
          ninetyDay: { total: retention90.length, retained: retention90.filter(r => r.employmentStatus === "employed").length },
          sixMonth: { total: retention180.length, retained: retention180.filter(r => r.employmentStatus === "employed").length },
          twelveMonth: { total: retention365.length, retained: retention365.filter(r => r.employmentStatus === "employed").length },
        },
        partnerMetrics: {
          employerPartners: employerCount?.count ?? 0,
          trainingPrograms: programCount?.count ?? 0,
        },
      });
    } catch (error) {
      console.error("Failed to fetch workforce outcomes:", error);
      res.status(500).json({ error: "Failed to fetch workforce outcomes" });
    }
  });

  app.get("/api/outcomes/prevention", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const allModules = await db.select().from(preventionModules).where(eq(preventionModules.isActive, true));
      const allProgress = await db.select().from(preventionProgress);
      const allAssessments = await db.select().from(riskAssessments);
      const allSurveys = await db.select().from(youthSurveys).where(eq(youthSurveys.isActive, true));
      const allResponses = await db.select().from(surveyResponses);

      const completedProgress = allProgress.filter(p => p.status === "completed");
      const riskOnly = allAssessments.filter(a => a.assessmentType === "risk");
      const protectiveOnly = allAssessments.filter(a => a.assessmentType === "protective");
      const uniqueParticipants = new Set([
        ...allProgress.map(p => p.visitorId),
        ...allAssessments.map(a => a.visitorId),
      ]);

      const avgRiskScore = riskOnly.length > 0
        ? Math.round(riskOnly.reduce((s, a) => s + (a.riskScore || 0), 0) / riskOnly.length)
        : null;
      const avgProtectiveScore = protectiveOnly.length > 0
        ? Math.round(protectiveOnly.reduce((s, a) => s + (a.protectiveScore || 0), 0) / protectiveOnly.length)
        : null;

      const topicBreakdown: Record<string, { total: number; completed: number }> = {};
      for (const mod of allModules) {
        const topic = mod.substanceTopic || "unknown";
        if (!topicBreakdown[topic]) topicBreakdown[topic] = { total: 0, completed: 0 };
        topicBreakdown[topic].total++;
        const modCompleted = completedProgress.filter(p => p.moduleId === mod.id).length;
        topicBreakdown[topic].completed += modCompleted;
      }

      const ageGroupBreakdown: Record<string, number> = {};
      for (const mod of allModules) {
        const age = mod.ageGroup || "unknown";
        const modCompleted = completedProgress.filter(p => p.moduleId === mod.id).length;
        ageGroupBreakdown[age] = (ageGroupBreakdown[age] || 0) + modCompleted;
      }

      res.json({
        reportType: "DFC Prevention Outcomes",
        generatedAt: new Date().toISOString(),
        curriculumMetrics: {
          totalModules: allModules.length,
          totalCompletions: completedProgress.length,
          uniqueParticipants: uniqueParticipants.size,
          completionRate: allProgress.length > 0 ? Math.round((completedProgress.length / allProgress.length) * 100) : 0,
          topicBreakdown,
          ageGroupBreakdown,
        },
        assessmentMetrics: {
          totalRiskAssessments: riskOnly.length,
          totalProtectiveAssessments: protectiveOnly.length,
          averageRiskScore: avgRiskScore,
          averageRiskMax: 36,
          averageProtectiveScore: avgProtectiveScore,
          averageProtectiveMax: 36,
        },
        surveyMetrics: {
          activeSurveys: allSurveys.length,
          totalResponses: allResponses.length,
          surveyBreakdown: allSurveys.map(s => ({
            surveyId: s.id,
            title: s.title,
            responses: allResponses.filter(r => r.surveyId === s.id).length,
          })),
        },
      });
    } catch (error) {
      console.error("Failed to fetch prevention outcomes:", error);
      res.status(500).json({ error: "Failed to fetch prevention outcomes" });
    }
  });

  app.get("/api/outcomes/export/csv", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.measurementDate));
      const headers = ["id", "userId", "planId", "category", "metricName", "metricValue", "periodMonths", "measurementDate", "source", "baseline", "target", "createdAt"];
      const csvRows = [headers.join(",")];
      for (const o of outcomes) {
        csvRows.push(headers.map(h => {
          const val = o[h as keyof typeof o];
          if (val === null || val === undefined) return "";
          return String(val).includes(",") ? `"${String(val)}"` : String(val);
        }).join(","));
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=outcome_data.csv");
      res.send(csvRows.join("\n"));
    } catch (error) {
      console.error("Failed to export CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });
}
