import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  preventionModules, preventionProgress, riskAssessments,
  youthSurveys, surveyResponses,
  insertPreventionModuleSchema, insertPreventionProgressSchema,
  insertRiskAssessmentSchema, insertYouthSurveySchema, insertSurveyResponseSchema,
} from "@shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { storage } from "./storage";

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

const RISK_FACTOR_QUESTIONS = [
  { id: "rf-fam-1", domain: "family", text: "My parent(s)/guardian(s) have clear rules about alcohol and drug use", options: ["Strongly Agree", "Agree", "Disagree", "Strongly Disagree"], scores: [0, 1, 2, 3] },
  { id: "rf-fam-2", domain: "family", text: "There is frequent conflict or arguing at home", options: ["Never", "Sometimes", "Often", "Very Often"], scores: [0, 1, 2, 3] },
  { id: "rf-fam-3", domain: "family", text: "Someone in my family has had problems with alcohol or drugs", options: ["No", "Not Sure", "Yes, in the past", "Yes, currently"], scores: [0, 1, 2, 3] },
  { id: "rf-peer-1", domain: "peer", text: "My close friends use alcohol, marijuana, or other drugs", options: ["None of them", "A few", "Most of them", "All of them"], scores: [0, 1, 2, 3] },
  { id: "rf-peer-2", domain: "peer", text: "People my age in my community think it's okay to use substances", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"], scores: [0, 1, 2, 3] },
  { id: "rf-peer-3", domain: "peer", text: "I have been pressured or invited to use drugs or alcohol", options: ["Never", "Once or twice", "Several times", "Many times"], scores: [0, 1, 2, 3] },
  { id: "rf-comm-1", domain: "community", text: "It is easy to get alcohol or drugs in my neighborhood", options: ["Very Difficult", "Difficult", "Easy", "Very Easy"], scores: [0, 1, 2, 3] },
  { id: "rf-comm-2", domain: "community", text: "Adults in my community use alcohol or drugs openly", options: ["Never", "Rarely", "Sometimes", "Often"], scores: [0, 1, 2, 3] },
  { id: "rf-comm-3", domain: "community", text: "There is poverty or economic hardship in my community", options: ["Not at all", "Somewhat", "Quite a bit", "Very much"], scores: [0, 1, 2, 3] },
  { id: "rf-ind-1", domain: "individual", text: "I first tried alcohol or drugs before age 15", options: ["No, never tried", "No, after 15", "Yes, at 14-15", "Yes, before 14"], scores: [0, 1, 2, 3] },
  { id: "rf-ind-2", domain: "individual", text: "I often feel sad, anxious, or stressed", options: ["Rarely", "Sometimes", "Often", "Almost always"], scores: [0, 1, 2, 3] },
  { id: "rf-ind-3", domain: "individual", text: "I struggle with my grades or engagement at school/work", options: ["Not at all", "A little", "Quite a bit", "Very much"], scores: [0, 1, 2, 3] },
];

const PROTECTIVE_FACTOR_QUESTIONS = [
  { id: "pf-fam-1", domain: "family_bonding", text: "I feel close to my parents or guardians", options: ["Strongly Agree", "Agree", "Disagree", "Strongly Disagree"], scores: [3, 2, 1, 0] },
  { id: "pf-fam-2", domain: "family_bonding", text: "My family spends quality time together regularly", options: ["Very Often", "Often", "Sometimes", "Rarely"], scores: [3, 2, 1, 0] },
  { id: "pf-sch-1", domain: "school_engagement", text: "I feel connected to my school or workplace", options: ["Strongly Agree", "Agree", "Disagree", "Strongly Disagree"], scores: [3, 2, 1, 0] },
  { id: "pf-sch-2", domain: "school_engagement", text: "I participate in school activities, clubs, or sports", options: ["Very Active", "Active", "Somewhat", "Not at all"], scores: [3, 2, 1, 0] },
  { id: "pf-pro-1", domain: "prosocial_involvement", text: "I volunteer or help others in my community", options: ["Regularly", "Sometimes", "Rarely", "Never"], scores: [3, 2, 1, 0] },
  { id: "pf-pro-2", domain: "prosocial_involvement", text: "I spend time with friends who make positive choices", options: ["Always", "Usually", "Sometimes", "Rarely"], scores: [3, 2, 1, 0] },
  { id: "pf-ref-1", domain: "refusal_skills", text: "I can say no when someone offers me drugs or alcohol", options: ["Very Confident", "Confident", "Somewhat Confident", "Not Confident"], scores: [3, 2, 1, 0] },
  { id: "pf-ref-2", domain: "refusal_skills", text: "I have strategies to leave uncomfortable situations", options: ["Yes, several", "A few", "One or two", "None"], scores: [3, 2, 1, 0] },
  { id: "pf-cop-1", domain: "coping_strategies", text: "I have healthy ways to deal with stress (exercise, art, talking)", options: ["Many ways", "A few ways", "One way", "No healthy ways"], scores: [3, 2, 1, 0] },
  { id: "pf-cop-2", domain: "coping_strategies", text: "When I feel upset, I can calm myself down", options: ["Very Well", "Well", "Somewhat", "Not Well"], scores: [3, 2, 1, 0] },
  { id: "pf-men-1", domain: "adult_mentorship", text: "I have a trusted adult I can talk to about problems", options: ["Several adults", "One or two", "Maybe one", "No one"], scores: [3, 2, 1, 0] },
  { id: "pf-men-2", domain: "adult_mentorship", text: "An adult mentor checks in on me regularly", options: ["Yes, regularly", "Sometimes", "Rarely", "Never"], scores: [3, 2, 1, 0] },
];

function generateRiskRecommendations(riskScore: number, maxScore: number): string[] {
  const pct = (riskScore / maxScore) * 100;
  const recs: string[] = [];
  if (pct >= 60) {
    recs.push("Consider connecting with a substance abuse prevention counselor");
    recs.push("Talk to a trusted adult about your concerns");
    recs.push("Explore the prevention curriculum modules on refusal skills and coping strategies");
  } else if (pct >= 40) {
    recs.push("Continue building strong protective relationships");
    recs.push("Practice and strengthen your refusal skills");
    recs.push("Stay involved in positive activities and clubs");
  } else {
    recs.push("You have strong protective factors - keep it up!");
    recs.push("Consider mentoring younger peers about healthy choices");
  }
  recs.push("Visit SAMHSA.gov for additional evidence-based resources");
  return recs;
}

function generateProtectiveRecommendations(protectiveScore: number, maxScore: number): string[] {
  const pct = (protectiveScore / maxScore) * 100;
  const recs: string[] = [];
  if (pct < 40) {
    recs.push("Focus on building one new protective factor this month");
    recs.push("Join a club, sport, or volunteer organization");
    recs.push("Identify a trusted adult you can talk to regularly");
  } else if (pct < 70) {
    recs.push("Keep strengthening your support network");
    recs.push("Practice refusal skills with a friend or mentor");
    recs.push("Try a new healthy coping activity each week");
  } else {
    recs.push("Excellent protective factors! Share your strategies with peers");
    recs.push("Consider becoming a peer mentor or prevention ambassador");
  }
  recs.push("Complete the prevention curriculum to learn more strategies");
  return recs;
}

export function registerPreventionRoutes(app: Express) {

  app.get("/api/prevention/modules", async (req, res) => {
    try {
      const { ageGroup, topic } = req.query;
      let query = db.select().from(preventionModules).where(eq(preventionModules.isActive, true));
      const conditions = [eq(preventionModules.isActive, true)];
      if (ageGroup && typeof ageGroup === "string") conditions.push(eq(preventionModules.ageGroup, ageGroup));
      if (topic && typeof topic === "string") conditions.push(eq(preventionModules.substanceTopic, topic));
      const modules = await db.select().from(preventionModules).where(and(...conditions)).orderBy(preventionModules.orderIndex);
      res.json(modules);
    } catch (error) {
      console.error("Failed to fetch prevention modules:", error);
      res.status(500).json({ error: "Failed to fetch prevention modules" });
    }
  });

  app.get("/api/prevention/modules/:id", async (req, res) => {
    try {
      const [mod] = await db.select().from(preventionModules).where(eq(preventionModules.id, String(req.params.id)));
      if (!mod) return res.status(404).json({ error: "Module not found" });
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  app.post("/api/prevention/modules", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertPreventionModuleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [mod] = await db.insert(preventionModules).values(parsed.data).returning();
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  app.patch("/api/prevention/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      const [existing] = await db.select().from(preventionModules).where(eq(preventionModules.id, id));
      if (!existing) return res.status(404).json({ error: "Module not found" });
      const { title, description, substanceTopic, ageGroup, contentSections, learningObjectives, knowledgeCheckQuestions, orderIndex, isActive } = req.body;
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (substanceTopic !== undefined) updates.substanceTopic = substanceTopic;
      if (ageGroup !== undefined) updates.ageGroup = ageGroup;
      if (contentSections !== undefined) updates.contentSections = contentSections;
      if (learningObjectives !== undefined) updates.learningObjectives = learningObjectives;
      if (knowledgeCheckQuestions !== undefined) updates.knowledgeCheckQuestions = knowledgeCheckQuestions;
      if (orderIndex !== undefined) updates.orderIndex = orderIndex;
      if (isActive !== undefined) updates.isActive = isActive;
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
      const [updated] = await db.update(preventionModules).set(updates).where(eq(preventionModules.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update module:", error);
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/prevention/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      const [existing] = await db.select().from(preventionModules).where(eq(preventionModules.id, id));
      if (!existing) return res.status(404).json({ error: "Module not found" });
      await db.delete(preventionModules).where(eq(preventionModules.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete module:", error);
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  app.get("/api/prevention/progress", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const progress = await db.select().from(preventionProgress).where(eq(preventionProgress.visitorId, userId));
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/prevention/progress", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = insertPreventionProgressSchema.safeParse({ ...req.body, visitorId: userId });
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const existing = await db.select().from(preventionProgress).where(
        and(eq(preventionProgress.visitorId, userId), eq(preventionProgress.moduleId, String(parsed.data.moduleId)))
      );
      if (existing.length > 0) {
        const [updated] = await db.update(preventionProgress)
          .set({ status: parsed.data.status, score: parsed.data.score, completedAt: parsed.data.status === "completed" ? new Date() : null })
          .where(eq(preventionProgress.id, existing[0].id))
          .returning();
        return res.json(updated);
      }
      const [progress] = await db.insert(preventionProgress).values(parsed.data).returning();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.get("/api/prevention/risk-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const assessments = await db.select().from(riskAssessments)
        .where(eq(riskAssessments.visitorId, userId))
        .orderBy(desc(riskAssessments.completedAt));
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.post("/api/prevention/risk-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { assessmentType, responses } = req.body;
      if (!assessmentType || !responses) return res.status(400).json({ error: "assessmentType and responses required" });
      if (assessmentType !== "risk" && assessmentType !== "protective") return res.status(400).json({ error: "assessmentType must be 'risk' or 'protective'" });

      const questions = assessmentType === "risk" ? RISK_FACTOR_QUESTIONS : PROTECTIVE_FACTOR_QUESTIONS;
      const maxScore = questions.length * 3;
      let totalScore = 0;
      for (const q of questions) {
        const answer = responses[q.id];
        if (typeof answer === "number" && answer >= 0 && answer < q.scores.length) {
          totalScore += q.scores[answer];
        }
      }

      const riskScore = assessmentType === "risk" ? totalScore : 0;
      const protectiveScore = assessmentType === "protective" ? totalScore : 0;
      const recommendations = assessmentType === "risk"
        ? generateRiskRecommendations(totalScore, maxScore)
        : generateProtectiveRecommendations(totalScore, maxScore);

      const [assessment] = await db.insert(riskAssessments).values({
        visitorId: userId,
        assessmentType,
        responses,
        riskScore,
        protectiveScore,
        recommendations,
      }).returning();
      res.json(assessment);
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      res.status(500).json({ error: "Failed to submit assessment" });
    }
  });

  app.get("/api/prevention/risk-questions", (_req, res) => {
    res.json({ risk: RISK_FACTOR_QUESTIONS, protective: PROTECTIVE_FACTOR_QUESTIONS });
  });

  app.get("/api/prevention/surveys", async (_req, res) => {
    try {
      const surveys = await db.select().from(youthSurveys).where(eq(youthSurveys.isActive, true));
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  app.post("/api/prevention/surveys", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertYouthSurveySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [survey] = await db.insert(youthSurveys).values(parsed.data).returning();
      res.json(survey);
    } catch (error) {
      res.status(500).json({ error: "Failed to create survey" });
    }
  });

  app.patch("/api/prevention/surveys/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      const [existing] = await db.select().from(youthSurveys).where(eq(youthSurveys.id, id));
      if (!existing) return res.status(404).json({ error: "Survey not found" });
      const { title, description, questions, isAnonymous, isActive } = req.body;
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (questions !== undefined) updates.questions = questions;
      if (isAnonymous !== undefined) updates.isAnonymous = isAnonymous;
      if (isActive !== undefined) updates.isActive = isActive;
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
      const [updated] = await db.update(youthSurveys).set(updates).where(eq(youthSurveys.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update survey:", error);
      res.status(500).json({ error: "Failed to update survey" });
    }
  });

  app.delete("/api/prevention/surveys/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      const [existing] = await db.select().from(youthSurveys).where(eq(youthSurveys.id, id));
      if (!existing) return res.status(404).json({ error: "Survey not found" });
      await db.delete(youthSurveys).where(eq(youthSurveys.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete survey:", error);
      res.status(500).json({ error: "Failed to delete survey" });
    }
  });

  app.post("/api/prevention/survey-responses", async (req, res) => {
    try {
      const parsed = insertSurveyResponseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [response] = await db.insert(surveyResponses).values(parsed.data).returning();
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit survey response" });
    }
  });

  app.get("/api/prevention/survey-analytics", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const surveys = await db.select().from(youthSurveys).where(eq(youthSurveys.isActive, true));
      const analytics = [];
      for (const survey of surveys) {
        const responses = await db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, survey.id));
        analytics.push({
          surveyId: survey.id,
          title: survey.title,
          totalResponses: responses.length,
          responses,
        });
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/prevention/dashboard", async (req, res) => {
    try {
      const totalModules = await db.select({ count: count() }).from(preventionModules).where(eq(preventionModules.isActive, true));
      const totalProgress = await db.select({ count: count() }).from(preventionProgress).where(eq(preventionProgress.status, "completed"));
      const totalAssessments = await db.select({ count: count() }).from(riskAssessments);
      const totalSurveyResponses = await db.select({ count: count() }).from(surveyResponses);

      res.json({
        totalModules: totalModules[0]?.count || 0,
        completedModules: totalProgress[0]?.count || 0,
        totalAssessments: totalAssessments[0]?.count || 0,
        totalSurveyResponses: totalSurveyResponses[0]?.count || 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
}

export async function seedPreventionData() {
  const existing = await db.select().from(preventionModules);
  if (existing.length > 0) return;

  const topics = [
    { topic: "alcohol", title: "Alcohol Awareness", desc: "Understanding alcohol's effects on the developing brain and body" },
    { topic: "cannabis", title: "Cannabis & Marijuana Facts", desc: "Science-based facts about cannabis and its impact on youth" },
    { topic: "vaping", title: "Vaping & E-Cigarettes", desc: "The truth about vaping, nicotine addiction, and lung health" },
    { topic: "prescription", title: "Prescription Drug Safety", desc: "Safe medication use and the dangers of prescription drug misuse" },
    { topic: "fentanyl", title: "Fentanyl & Opioid Awareness", desc: "Understanding the opioid crisis and fentanyl dangers" },
    { topic: "refusal", title: "Peer Pressure & Refusal Skills", desc: "Building confidence to resist peer pressure and make healthy choices" },
    { topic: "media", title: "Media Literacy & Substance Marketing", desc: "Recognizing and resisting substance marketing in media" },
    { topic: "coping", title: "Healthy Coping Strategies", desc: "Alternative ways to manage stress, anxiety, and difficult emotions" },
  ];

  const ageGroups = ["10-14", "15-18", "19-24"];
  const modules = [];
  let orderIdx = 0;

  for (const t of topics) {
    for (const age of ageGroups) {
      orderIdx++;
      modules.push({
        id: `prev-${t.topic}-${age}`,
        title: `${t.title} (Ages ${age})`,
        description: t.desc,
        substanceTopic: t.topic,
        ageGroup: age,
        contentSections: [
          { title: "Introduction", content: `Welcome to ${t.title}. This module is designed for youth ages ${age}.` },
          { title: "Key Facts", content: `Evidence-based information about ${t.title.toLowerCase()} relevant to your age group.` },
          { title: "Real-World Scenarios", content: "Practice applying what you've learned through real-world scenarios." },
          { title: "Action Plan", content: "Create your personal action plan for making healthy choices." },
        ],
        learningObjectives: [
          `Identify the effects of ${t.topic} on health and development`,
          "Recognize risk factors and warning signs",
          "Practice refusal and decision-making skills",
          "Create a personal prevention action plan",
        ],
        knowledgeCheckQuestions: [
          {
            id: `kc-${t.topic}-${age}-1`,
            text: `Which of the following is a risk factor for substance use?`,
            options: ["Strong family bonds", "Peer pressure to use", "Community involvement", "Mentorship"],
            correctAnswer: 1,
          },
          {
            id: `kc-${t.topic}-${age}-2`,
            text: "What is the most effective refusal strategy?",
            options: ["Ignoring the situation", "Giving a clear 'no' with a reason", "Going along to avoid conflict", "Changing the subject"],
            correctAnswer: 1,
          },
          {
            id: `kc-${t.topic}-${age}-3`,
            text: "Which is a healthy coping strategy?",
            options: ["Using substances to relax", "Exercising or talking to a trusted adult", "Isolating yourself", "Ignoring your feelings"],
            correctAnswer: 1,
          },
        ],
        orderIndex: orderIdx,
        isActive: true,
      });
    }
  }

  await db.insert(preventionModules).values(modules);

  const existingSurveys = await db.select().from(youthSurveys);
  if (existingSurveys.length === 0) {
    await db.insert(youthSurveys).values([
      {
        id: "survey-community-perception",
        title: "Community Substance Use Perception Survey",
        description: "Anonymous survey to understand youth perceptions about substance use in the community. Your answers help us design better prevention programs.",
        questions: [
          { id: "cps-1", text: "How easy is it for young people in your community to get alcohol?", options: ["Very Difficult", "Somewhat Difficult", "Somewhat Easy", "Very Easy"] },
          { id: "cps-2", text: "How easy is it for young people to get marijuana?", options: ["Very Difficult", "Somewhat Difficult", "Somewhat Easy", "Very Easy"] },
          { id: "cps-3", text: "How wrong do most adults in your community think it is for youth to use marijuana?", options: ["Very Wrong", "Wrong", "A Little Wrong", "Not Wrong at All"] },
          { id: "cps-4", text: "How wrong do most students in your school think it is for youth to drink alcohol?", options: ["Very Wrong", "Wrong", "A Little Wrong", "Not Wrong at All"] },
          { id: "cps-5", text: "In the past 30 days, have you seen ads or social media posts promoting alcohol or drug use?", options: ["Never", "Once or twice", "Several times", "Many times"] },
          { id: "cps-6", text: "How much do you think people risk harming themselves by vaping regularly?", options: ["Great Risk", "Moderate Risk", "Slight Risk", "No Risk"] },
          { id: "cps-7", text: "How many of your friends have used alcohol or drugs in the past 30 days?", options: ["None", "A Few", "Some", "Most or All"] },
          { id: "cps-8", text: "Do you feel your community has enough prevention programs for young people?", options: ["Definitely Yes", "Probably Yes", "Probably No", "Definitely No"] },
        ],
        isAnonymous: true,
        isActive: true,
      },
    ]);
  }
}
