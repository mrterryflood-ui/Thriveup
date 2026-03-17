import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  dfcCoreMeasures, dfcStakeholderSurveys,
  communityReadinessAssessments, communityReadinessInterviews,
  insertDfcCoreMeasureSchema, insertDfcStakeholderSurveySchema,
  insertCommunityReadinessAssessmentSchema, insertCommunityReadinessInterviewSchema,
} from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { storage } from "./storage";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

const READINESS_STAGES = [
  "No Awareness",
  "Denial/Resistance",
  "Vague Awareness",
  "Preplanning",
  "Preparation",
  "Initiation",
  "Stabilization",
  "Confirmation/Expansion",
  "High Level of Community Ownership",
];

function getReadinessStage(score: number): string {
  const idx = Math.min(Math.max(Math.round(score) - 1, 0), READINESS_STAGES.length - 1);
  return READINESS_STAGES[idx];
}

function getReadinessRecommendations(stage: string): string[] {
  const idx = READINESS_STAGES.indexOf(stage);
  const recs: string[] = [];
  if (idx <= 1) {
    recs.push("Conduct one-on-one visits with community leaders to raise awareness");
    recs.push("Present local data on substance use to key stakeholders");
    recs.push("Identify a small group of concerned citizens to form a planning committee");
  } else if (idx <= 3) {
    recs.push("Conduct community forums to discuss substance abuse issues");
    recs.push("Review existing prevention efforts and identify gaps");
    recs.push("Develop a formal coalition structure with bylaws");
    recs.push("Seek training on evidence-based prevention strategies");
  } else if (idx <= 5) {
    recs.push("Implement evidence-based prevention programs");
    recs.push("Establish formal partnerships with schools, law enforcement, and healthcare");
    recs.push("Secure dedicated funding for prevention activities");
    recs.push("Train coalition members in SAMHSA's Strategic Prevention Framework");
  } else {
    recs.push("Document and share successes with the broader community");
    recs.push("Develop sustainability plans for ongoing prevention efforts");
    recs.push("Mentor other communities in prevention strategies");
    recs.push("Pursue DFC or other federal grant funding to expand reach");
  }
  return recs;
}

const STAKEHOLDER_SURVEY_TEMPLATES: Record<string, { questions: { id: string; text: string; type: string }[] }> = {
  youth: {
    questions: [
      { id: "y1", text: "In the past 30 days, have you used any alcohol?", type: "yes_no" },
      { id: "y2", text: "In the past 30 days, have you used marijuana?", type: "yes_no" },
      { id: "y3", text: "How risky do you think it is to drink alcohol regularly?", type: "scale_1_4" },
      { id: "y4", text: "How risky do you think it is to use marijuana regularly?", type: "scale_1_4" },
      { id: "y5", text: "Would your parents strongly disapprove if you used substances?", type: "yes_no" },
      { id: "y6", text: "How easy is it to get alcohol in your community?", type: "scale_1_4" },
    ],
  },
  parents: {
    questions: [
      { id: "p1", text: "How concerned are you about youth substance use in your community?", type: "scale_1_4" },
      { id: "p2", text: "Have you talked to your child about the dangers of substance use?", type: "yes_no" },
      { id: "p3", text: "How confident are you in your ability to prevent your child from using substances?", type: "scale_1_4" },
      { id: "p4", text: "Are you aware of community prevention programs available?", type: "yes_no" },
    ],
  },
  educators: {
    questions: [
      { id: "e1", text: "How many substance-related incidents occurred at your school this year?", type: "number" },
      { id: "e2", text: "Does your school implement an evidence-based prevention curriculum?", type: "yes_no" },
      { id: "e3", text: "Rate the school climate regarding substance use prevention (1-10)", type: "scale_1_10" },
    ],
  },
  law_enforcement: {
    questions: [
      { id: "l1", text: "Number of juvenile substance-related incidents this quarter", type: "number" },
      { id: "l2", text: "Does your department participate in juvenile diversion programs?", type: "yes_no" },
      { id: "l3", text: "Rate community safety regarding substance availability (1-10)", type: "scale_1_10" },
    ],
  },
  healthcare: {
    questions: [
      { id: "h1", text: "What percentage of patients are screened for substance use?", type: "number" },
      { id: "h2", text: "What are the top barriers to treatment access?", type: "text" },
      { id: "h3", text: "Number of substance-related referrals this quarter", type: "number" },
    ],
  },
  faith_based: {
    questions: [
      { id: "f1", text: "Does your congregation actively participate in prevention efforts?", type: "yes_no" },
      { id: "f2", text: "How many community gatherings focused on prevention this year?", type: "number" },
    ],
  },
  business: {
    questions: [
      { id: "b1", text: "Does your company have a substance-free workplace policy?", type: "yes_no" },
      { id: "b2", text: "Do you offer an Employee Assistance Program?", type: "yes_no" },
      { id: "b3", text: "How much does your business invest in community prevention annually?", type: "number" },
    ],
  },
  veterans: {
    questions: [
      { id: "v1", text: "Rate transition-related stress factors for military families (1-10)", type: "scale_1_10" },
      { id: "v2", text: "Are veteran-specific substance prevention resources available?", type: "yes_no" },
    ],
  },
  returning_citizens: {
    questions: [
      { id: "r1", text: "Rate the substance risk level during reentry (1-10)", type: "scale_1_10" },
      { id: "r2", text: "Are peer support programs available for returning citizens?", type: "yes_no" },
      { id: "r3", text: "How has your peer group changed since reentry?", type: "text" },
    ],
  },
  seniors: {
    questions: [
      { id: "s1", text: "Are you concerned about prescription medication misuse?", type: "yes_no" },
      { id: "s2", text: "Do you provide caregiving for grandchildren?", type: "yes_no" },
      { id: "s3", text: "Have grandchildren been exposed to substance use?", type: "yes_no" },
    ],
  },
};

const KEY_INFORMANT_QUESTIONS: Record<string, string[]> = {
  community_efforts: [
    "Are there any efforts to address substance abuse in your community?",
    "How long have these efforts been going on?",
    "Who is involved in these efforts?",
  ],
  community_knowledge_of_efforts: [
    "How much does the community know about current prevention efforts?",
    "What efforts have been made to raise community awareness?",
  ],
  leadership: [
    "Do community leaders support substance abuse prevention?",
    "Which leaders are most involved?",
    "How is leadership for prevention organized?",
  ],
  community_climate: [
    "What is the community's attitude toward substance abuse?",
    "Is substance abuse seen as a community problem?",
  ],
  community_knowledge_of_issue: [
    "How much does the community know about substance abuse?",
    "What are the main substances of concern in your community?",
  ],
  resources: [
    "What resources are currently available for prevention?",
    "What additional resources are needed?",
    "Are there volunteers willing to work on prevention?",
  ],
};

export function registerDfcReportingRoutes(app: Express) {
  app.get("/api/dfc/core-measures", async (_req, res) => {
    try {
      const measures = await db.select().from(dfcCoreMeasures).orderBy(desc(dfcCoreMeasures.createdAt));
      res.json(measures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch core measures" });
    }
  });

  app.post("/api/dfc/core-measures", requireAuth, async (req, res) => {
    try {
      const parsed = insertDfcCoreMeasureSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [measure] = await db.insert(dfcCoreMeasures).values(parsed.data).returning();
      res.json(measure);
    } catch (error) {
      res.status(500).json({ error: "Failed to create core measure" });
    }
  });

  app.get("/api/dfc/stakeholder-surveys", async (_req, res) => {
    try {
      const surveys = await db.select().from(dfcStakeholderSurveys).orderBy(desc(dfcStakeholderSurveys.createdAt));
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stakeholder surveys" });
    }
  });

  app.post("/api/dfc/stakeholder-surveys", requireAuth, async (req, res) => {
    try {
      const parsed = insertDfcStakeholderSurveySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [survey] = await db.insert(dfcStakeholderSurveys).values(parsed.data).returning();
      res.json(survey);
    } catch (error) {
      res.status(500).json({ error: "Failed to create stakeholder survey" });
    }
  });

  app.get("/api/dfc/stakeholder-templates", (_req, res) => {
    res.json(STAKEHOLDER_SURVEY_TEMPLATES);
  });

  app.get("/api/dfc/community-readiness", async (_req, res) => {
    try {
      const assessments = await db.select().from(communityReadinessAssessments).orderBy(desc(communityReadinessAssessments.createdAt));
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch readiness assessments" });
    }
  });

  app.post("/api/dfc/community-readiness", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommunityReadinessAssessmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });

      const data = parsed.data;
      const dims = [
        data.communityEfforts ?? 1,
        data.communityKnowledgeOfEfforts ?? 1,
        data.leadership ?? 1,
        data.communityclimate ?? 1,
        data.communityKnowledgeOfIssue ?? 1,
        data.resources ?? 1,
      ];
      const overallReadiness = dims.reduce((s, v) => s + v, 0) / dims.length;
      const readinessStage = getReadinessStage(overallReadiness);
      const recommendations = getReadinessRecommendations(readinessStage);

      const [assessment] = await db.insert(communityReadinessAssessments).values({
        ...data,
        overallReadiness,
        readinessStage,
        recommendations,
        assessorId: getUserId(req as Request) || data.assessorId,
      }).returning();
      res.json(assessment);
    } catch (error) {
      console.error("Failed to create readiness assessment:", error);
      res.status(500).json({ error: "Failed to create readiness assessment" });
    }
  });

  app.get("/api/dfc/readiness-interviews", async (req, res) => {
    try {
      const { assessmentId } = req.query;
      let interviews;
      if (assessmentId && typeof assessmentId === "string") {
        interviews = await db.select().from(communityReadinessInterviews)
          .where(eq(communityReadinessInterviews.assessmentId, assessmentId))
          .orderBy(desc(communityReadinessInterviews.createdAt));
      } else {
        interviews = await db.select().from(communityReadinessInterviews).orderBy(desc(communityReadinessInterviews.createdAt));
      }
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  app.post("/api/dfc/readiness-interviews", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommunityReadinessInterviewSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [interview] = await db.insert(communityReadinessInterviews).values({
        ...parsed.data,
        interviewerId: getUserId(req as Request) || parsed.data.interviewerId,
      }).returning();
      res.json(interview);
    } catch (error) {
      res.status(500).json({ error: "Failed to create interview" });
    }
  });

  app.get("/api/dfc/key-informant-questions", (_req, res) => {
    res.json(KEY_INFORMANT_QUESTIONS);
  });

  app.get("/api/dfc/readiness-stages", (_req, res) => {
    res.json(READINESS_STAGES);
  });

  app.get("/api/dfc/dashboard", async (_req, res) => {
    try {
      const measures = await db.select().from(dfcCoreMeasures).orderBy(desc(dfcCoreMeasures.createdAt));
      const surveys = await db.select().from(dfcStakeholderSurveys).orderBy(desc(dfcStakeholderSurveys.createdAt));
      const readiness = await db.select().from(communityReadinessAssessments).orderBy(desc(communityReadinessAssessments.createdAt));
      const interviews = await db.select().from(communityReadinessInterviews);

      const baselineMeasures = measures.filter(m => m.periodType === "baseline");
      const followupMeasures = measures.filter(m => m.periodType === "followup");

      const populationTypes = Array.from(new Set(surveys.map(s => s.populationType)));
      const surveysByPopulation: Record<string, number> = {};
      populationTypes.forEach(p => {
        surveysByPopulation[p] = surveys.filter(s => s.populationType === p).reduce((sum, s) => sum + (s.respondentCount || 0), 0);
      });

      const latestReadiness = readiness.length > 0 ? readiness[0] : null;

      const reaimMetrics = {
        reach: surveys.reduce((sum, s) => sum + (s.respondentCount || 0), 0),
        effectiveness: latestReadiness ? Math.round((latestReadiness.overallReadiness || 0) / 9 * 100) : 0,
        adoption: populationTypes.length,
        implementation: measures.length,
        maintenance: readiness.length,
      };

      res.json({
        totalCoreMeasures: measures.length,
        baselineMeasures: baselineMeasures.length,
        followupMeasures: followupMeasures.length,
        totalSurveys: surveys.length,
        surveysByPopulation,
        totalReadinessAssessments: readiness.length,
        latestReadiness: latestReadiness ? {
          overallReadiness: latestReadiness.overallReadiness,
          readinessStage: latestReadiness.readinessStage,
          date: latestReadiness.assessmentDate,
        } : null,
        totalInterviews: interviews.length,
        reaimMetrics,
        readinessHistory: readiness.slice(0, 10).map(r => ({
          date: r.assessmentDate,
          score: r.overallReadiness,
          stage: r.readinessStage,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch DFC dashboard" });
    }
  });

  app.get("/api/dfc/export/csv", async (_req, res) => {
    try {
      const measures = await db.select().from(dfcCoreMeasures).orderBy(dfcCoreMeasures.surveyPeriod);
      const headers = [
        "Survey Period", "Period Type", "Age Group",
        "Alcohol Past 30 Days (%)", "Marijuana Past 30 Days (%)",
        "Tobacco Past 30 Days (%)", "Prescription Past 30 Days (%)",
        "Perception of Risk - Alcohol", "Perception of Risk - Marijuana",
        "Parental Disapproval", "Peer Disapproval",
        "Average Age First Use", "Perceived Availability",
        "Sample Size", "Notes"
      ];
      const rows = measures.map(m => [
        m.surveyPeriod, m.periodType, m.ageGroup,
        m.alcoholPast30, m.marijuanaPast30, m.tobaccoPast30, m.prescriptionPast30,
        m.perceptionOfRiskAlcohol, m.perceptionOfRiskMarijuana,
        m.parentalDisapproval, m.peerDisapproval,
        m.averageAgeFirstUse ?? "", m.perceivedAvailability,
        m.sampleSize, (m.notes || "").replace(/,/g, ";"),
      ].join(","));

      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=dfc-core-measures.csv");
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });
}
