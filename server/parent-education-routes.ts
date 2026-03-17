import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  parentEducationModules, parentEducationProgress, familyAssessments,
  engagementDosageLogs, cohortEnrollments,
  insertParentEducationModuleSchema, insertParentEducationProgressSchema, insertFamilyAssessmentSchema,
} from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { storage } from "./storage";
import { generateAIJSON } from "./ai-provider";

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

const FAMILY_RISK_QUESTIONS = [
  { id: "fr-1", domain: "parental_attitudes", text: "How clearly have you communicated your expectations about substance use to your child?", options: ["Very Clearly", "Somewhat Clearly", "Not Very Clearly", "Not at All"], scores: [0, 1, 2, 3] },
  { id: "fr-2", domain: "family_conflict", text: "How often does your family experience significant conflict or stress?", options: ["Rarely", "Sometimes", "Often", "Very Often"], scores: [0, 1, 2, 3] },
  { id: "fr-3", domain: "substance_history", text: "Has anyone in your household had challenges with alcohol or substance use?", options: ["No", "In the past", "Not sure", "Currently"], scores: [0, 1, 2, 3] },
  { id: "fr-4", domain: "supervision", text: "How well do you know where your child is and who they are with after school?", options: ["Always know", "Usually know", "Sometimes know", "Rarely know"], scores: [0, 1, 2, 3] },
  { id: "fr-5", domain: "community_risk", text: "How accessible are drugs or alcohol to youth in your neighborhood?", options: ["Very Difficult", "Somewhat Difficult", "Somewhat Easy", "Very Easy"], scores: [0, 1, 2, 3] },
  { id: "fr-6", domain: "peer_influence", text: "Are you aware of your child's friends using substances?", options: ["No, none", "Not sure", "Maybe a few", "Yes, several"], scores: [0, 1, 2, 3] },
];

const FAMILY_PROTECTIVE_QUESTIONS = [
  { id: "fp-1", domain: "family_bonding", text: "How often does your family eat meals together?", options: ["Daily", "Several times a week", "Occasionally", "Rarely"], scores: [3, 2, 1, 0] },
  { id: "fp-2", domain: "communication", text: "How comfortable is your child talking to you about difficult topics?", options: ["Very Comfortable", "Comfortable", "Somewhat Uncomfortable", "Very Uncomfortable"], scores: [3, 2, 1, 0] },
  { id: "fp-3", domain: "school_engagement", text: "How involved are you in your child's school activities and homework?", options: ["Very Involved", "Involved", "Somewhat Involved", "Not Involved"], scores: [3, 2, 1, 0] },
  { id: "fp-4", domain: "prosocial_activities", text: "Does your child participate in organized activities (sports, clubs, faith groups)?", options: ["Multiple activities", "One activity", "Occasionally", "None"], scores: [3, 2, 1, 0] },
  { id: "fp-5", domain: "adult_mentors", text: "Does your child have trusted adults outside the family they can talk to?", options: ["Several", "One or two", "Maybe one", "None"], scores: [3, 2, 1, 0] },
  { id: "fp-6", domain: "family_rules", text: "Does your family have clear rules and consistent consequences?", options: ["Very Clear", "Clear", "Somewhat Clear", "Not Clear"], scores: [3, 2, 1, 0] },
];

function generateFamilyRecommendations(riskScore: number, protectiveScore: number, maxRisk: number, maxProtective: number): string[] {
  const riskPct = (riskScore / maxRisk) * 100;
  const protPct = (protectiveScore / maxProtective) * 100;
  const recs: string[] = [];

  if (riskPct >= 50) {
    recs.push("Consider family counseling or a family strengthening program in your community");
    recs.push("Start regular one-on-one conversations with your child about substance use");
    recs.push("Review the Substance Prevention modules for concrete talking strategies");
  } else if (riskPct >= 25) {
    recs.push("Keep building open communication about substances and peer pressure");
    recs.push("Explore community activities to strengthen your child's protective network");
  } else {
    recs.push("Your family has low risk factors - continue your positive approaches");
  }

  if (protPct < 50) {
    recs.push("Focus on increasing family bonding activities like shared meals and outings");
    recs.push("Help your child find at least one organized activity or mentorship program");
    recs.push("Establish clear family rules about substance use and online safety");
  } else {
    recs.push("Strong protective factors! Share your family strategies with other parents");
  }

  recs.push("Visit SAMHSA's Family Guide at samhsa.gov for additional resources");
  return recs;
}

async function logDosage(userId: string, toolType: string, toolName: string, minutes: number) {
  try {
    const enrollments = await db.select().from(cohortEnrollments)
      .where(and(eq(cohortEnrollments.userId, userId), eq(cohortEnrollments.status, "active")));
    const cohortId = enrollments.length > 0 ? enrollments[0].cohortId : null;
    await db.insert(engagementDosageLogs).values({
      userId,
      cohortId,
      toolType,
      toolName,
      durationMinutes: minutes,
      sessionDate: new Date().toISOString().split("T")[0],
      metadata: { source: "parent_education" },
    });
  } catch (err) {
    console.error("Failed to log parent education dosage:", err);
  }
}

export function registerParentEducationRoutes(app: Express) {

  app.get("/api/parent-education/modules", async (req, res) => {
    try {
      const { category } = req.query;
      const conditions = [eq(parentEducationModules.isActive, true)];
      if (category && typeof category === "string") {
        conditions.push(eq(parentEducationModules.category, category));
      }
      const modules = await db.select().from(parentEducationModules)
        .where(and(...conditions))
        .orderBy(parentEducationModules.orderIndex);
      res.json(modules);
    } catch (error) {
      console.error("Failed to fetch parent education modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.get("/api/parent-education/modules/:id", async (req, res) => {
    try {
      const [mod] = await db.select().from(parentEducationModules)
        .where(eq(parentEducationModules.id, String(req.params.id)));
      if (!mod) return res.status(404).json({ error: "Module not found" });
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  app.post("/api/parent-education/modules", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertParentEducationModuleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [mod] = await db.insert(parentEducationModules).values(parsed.data).returning();
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  app.get("/api/parent-education/progress", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const progress = await db.select().from(parentEducationProgress)
        .where(eq(parentEducationProgress.visitorId, userId));
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/parent-education/progress", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = insertParentEducationProgressSchema.safeParse({ ...req.body, visitorId: userId });
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });

      const existing = await db.select().from(parentEducationProgress).where(
        and(eq(parentEducationProgress.visitorId, userId), eq(parentEducationProgress.moduleId, String(parsed.data.moduleId)))
      );

      if (existing.length > 0) {
        const [updated] = await db.update(parentEducationProgress)
          .set({ status: parsed.data.status, completedAt: parsed.data.status === "completed" ? new Date() : null })
          .where(eq(parentEducationProgress.id, existing[0].id))
          .returning();
        if (parsed.data.status === "completed") {
          await logDosage(userId, "parent_education", "Parent Education Module", 15);
        }
        return res.json(updated);
      }

      const [progress] = await db.insert(parentEducationProgress).values(parsed.data).returning();
      if (parsed.data.status === "completed") {
        await logDosage(userId, "parent_education", "Parent Education Module", 15);
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.get("/api/parent-education/family-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const assessments = await db.select().from(familyAssessments)
        .where(eq(familyAssessments.visitorId, userId))
        .orderBy(desc(familyAssessments.completedAt));
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family assessments" });
    }
  });

  app.post("/api/parent-education/family-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { riskResponses, protectiveResponses } = req.body;
      if (!riskResponses || !protectiveResponses) {
        return res.status(400).json({ error: "Both riskResponses and protectiveResponses required" });
      }

      let riskScore = 0;
      for (const q of FAMILY_RISK_QUESTIONS) {
        const answer = riskResponses[q.id];
        if (typeof answer === "number" && answer >= 0 && answer < q.scores.length) {
          riskScore += q.scores[answer];
        }
      }

      let protectiveScore = 0;
      for (const q of FAMILY_PROTECTIVE_QUESTIONS) {
        const answer = protectiveResponses[q.id];
        if (typeof answer === "number" && answer >= 0 && answer < q.scores.length) {
          protectiveScore += q.scores[answer];
        }
      }

      const maxRisk = FAMILY_RISK_QUESTIONS.length * 3;
      const maxProtective = FAMILY_PROTECTIVE_QUESTIONS.length * 3;
      const recommendations = generateFamilyRecommendations(riskScore, protectiveScore, maxRisk, maxProtective);

      const [assessment] = await db.insert(familyAssessments).values({
        visitorId: userId,
        familyRiskFactors: riskResponses,
        familyProtectiveFactors: protectiveResponses,
        riskScore,
        protectiveScore,
        recommendations,
      }).returning();

      await logDosage(userId, "family_assessment", "Family Assessment", 10);
      res.json(assessment);
    } catch (error) {
      console.error("Failed to submit family assessment:", error);
      res.status(500).json({ error: "Failed to submit family assessment" });
    }
  });

  app.get("/api/parent-education/family-questions", (_req, res) => {
    res.json({ risk: FAMILY_RISK_QUESTIONS, protective: FAMILY_PROTECTIVE_QUESTIONS });
  });

  app.post("/api/parent-education/conversation-starters", requireAuth, async (req, res) => {
    try {
      const { topic, childAge } = req.body;
      if (!topic) return res.status(400).json({ error: "topic is required" });

      const ageContext = childAge ? `The child is ${childAge} years old.` : "The child is a school-age youth.";

      const result = await generateAIJSON<{ starters: Array<{ opener: string; explanation: string; followUp: string }> }>(
        `Generate 4 conversation starters for a parent who wants to talk to their child about "${topic}". ${ageContext} Each starter should have an opener (the exact phrase to say), an explanation of why it works, and a follow-up question. Return JSON: { "starters": [{ "opener": "...", "explanation": "...", "followUp": "..." }] }`,
        "You are a family counselor specializing in youth substance prevention and family strengthening. Generate age-appropriate, culturally sensitive conversation starters that build trust and open dialogue. Keep language simple and warm."
      );

      const userId = getUserId(req)!;
      await logDosage(userId, "ai_chat", "AI Conversation Starters", 5);
      res.json(result);
    } catch (error) {
      console.error("Failed to generate conversation starters:", error);
      res.json({
        starters: [
          { opener: "I've been learning about how to keep our family safe and healthy. Can we talk about it?", explanation: "Opening with your own learning shows vulnerability and models curiosity.", followUp: "What have you heard about drugs or alcohol at school?" },
          { opener: "I want you to know you can always come to me, no matter what. What's something on your mind lately?", explanation: "Unconditional support creates a safe space for honest conversation.", followUp: "Is there anything you've been worried about that you haven't told me?" },
          { opener: "I saw something on the news about vaping. What do your friends think about it?", explanation: "Using current events and asking about peers feels less confrontational.", followUp: "Have you ever been offered anything like that?" },
          { opener: "Let's make a deal - if you're ever in a situation that feels unsafe, you can call me with no questions asked.", explanation: "A safety agreement builds trust and gives them a practical escape plan.", followUp: "What would make it easier for you to reach out if you needed help?" },
        ],
      });
    }
  });

  app.get("/api/parent-education/dashboard", async (_req, res) => {
    try {
      const totalModules = await db.select({ count: count() }).from(parentEducationModules).where(eq(parentEducationModules.isActive, true));
      const completedProgress = await db.select({ count: count() }).from(parentEducationProgress).where(eq(parentEducationProgress.status, "completed"));
      const totalAssessments = await db.select({ count: count() }).from(familyAssessments);

      res.json({
        totalModules: totalModules[0]?.count || 0,
        completedModules: completedProgress[0]?.count || 0,
        totalAssessments: totalAssessments[0]?.count || 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
}

export async function seedParentEducationData() {
  const existing = await db.select().from(parentEducationModules);
  if (existing.length > 0) return;

  const preventionModules = [
    {
      id: "pe-prev-1",
      title: "Understanding Youth Substance Use",
      description: "Learn the warning signs, risk factors, and how to recognize when your child may be exposed to substances.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 10-24",
      orderIndex: 1,
      isActive: true,
      contentSections: [
        { title: "Why This Matters", content: "Youth substance use is a growing concern. Early education helps parents recognize risk factors before they escalate." },
        { title: "Warning Signs", content: "Changes in behavior, friend groups, academic performance, sleep patterns, and physical appearance can all indicate substance exposure." },
        { title: "Risk Factors", content: "Family history, peer pressure, community access, lack of supervision, and mental health challenges increase vulnerability." },
        { title: "What You Can Do", content: "Open communication, clear expectations, monitoring, and building strong family bonds are your most powerful tools." },
      ],
    },
    {
      id: "pe-prev-2",
      title: "Talking to Your Child About Alcohol",
      description: "Age-appropriate strategies for discussing alcohol use, its effects, and setting family expectations.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 10-18",
      orderIndex: 2,
      isActive: true,
      contentSections: [
        { title: "Start Early", content: "Children form attitudes about alcohol by age 9-13. Starting conversations early establishes your family's values." },
        { title: "Facts to Share", content: "Alcohol affects the developing brain, impairs judgment, and is the most commonly used substance among teens." },
        { title: "Conversation Strategies", content: "Use media moments, ask open-ended questions, share your family values without lecturing, and listen more than you talk." },
        { title: "Setting Expectations", content: "Clear, consistent rules about alcohol use - with explained reasons - are more effective than fear-based messaging." },
      ],
    },
    {
      id: "pe-prev-3",
      title: "Vaping, Cannabis & New Threats",
      description: "Stay informed about the latest substances youth are exposed to including vaping, cannabis, and fentanyl.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 12-24",
      orderIndex: 3,
      isActive: true,
      contentSections: [
        { title: "The Vaping Crisis", content: "E-cigarettes and vapes are marketed to youth with appealing flavors. Nicotine is highly addictive and damages developing lungs." },
        { title: "Cannabis Facts", content: "Marijuana potency has increased dramatically. Regular use during adolescence can affect brain development and academic performance." },
        { title: "The Fentanyl Danger", content: "Fentanyl is now found in counterfeit pills and other substances. Even tiny amounts can be lethal. Awareness saves lives." },
        { title: "Staying Current", content: "Follow NIDA and CDC resources to stay informed about emerging drug trends affecting youth." },
      ],
    },
    {
      id: "pe-prev-4",
      title: "Peer Pressure & Social Media Influence",
      description: "Help your child navigate peer pressure and recognize substance marketing in social media.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 10-18",
      orderIndex: 4,
      isActive: true,
      contentSections: [
        { title: "Understanding Peer Pressure", content: "Peer pressure can be direct (offers) or indirect (social norms). Help your child recognize both types." },
        { title: "Social Media Risks", content: "Substance use is often glamorized on social media. Teach media literacy to help your child critically evaluate content." },
        { title: "Building Refusal Skills", content: "Practice saying no with your child. Role-play scenarios so they have ready responses when pressured." },
        { title: "Positive Peer Networks", content: "Encourage friendships with peers who make healthy choices. Organized activities build natural protective networks." },
      ],
    },
    {
      id: "pe-prev-5",
      title: "Prescription Drug Safety at Home",
      description: "Secure medications, educate your family, and prevent prescription drug misuse.",
      category: "substance_prevention",
      targetAudience: "All parents and guardians",
      orderIndex: 5,
      isActive: true,
      contentSections: [
        { title: "Secure Your Medications", content: "Lock up or safely store all prescription medications. Track pill counts and dispose of unused medications properly." },
        { title: "Educate Your Family", content: "Explain that prescription drugs are only safe when used as prescribed by a doctor for the person they were prescribed to." },
        { title: "Disposal Resources", content: "Use DEA Take-Back events or pharmacy disposal programs to safely get rid of unused medications." },
        { title: "Warning Signs", content: "Missing medications, unusual pill bottles, and changes in behavior may indicate prescription drug misuse." },
      ],
    },
    {
      id: "pe-prev-6",
      title: "Building Healthy Coping Skills as a Family",
      description: "Teach your family positive alternatives to stress and emotional challenges.",
      category: "substance_prevention",
      targetAudience: "All family members",
      orderIndex: 6,
      isActive: true,
      contentSections: [
        { title: "Why Coping Skills Matter", content: "Youth who lack healthy coping strategies are more likely to turn to substances when stressed or upset." },
        { title: "Family Coping Activities", content: "Exercise together, practice deep breathing, engage in creative activities, and establish routines that reduce stress." },
        { title: "Emotional Check-Ins", content: "Create a family habit of checking in about emotions. Normalize talking about feelings without judgment." },
        { title: "When to Seek Help", content: "If your child shows persistent anxiety, depression, or behavioral changes, connect with a school counselor or mental health professional." },
      ],
    },
    {
      id: "pe-prev-7",
      title: "Creating a Prevention Action Plan",
      description: "Develop a personalized family plan for substance prevention and healthy decision-making.",
      category: "substance_prevention",
      targetAudience: "All parents and guardians",
      orderIndex: 7,
      isActive: true,
      contentSections: [
        { title: "Assess Your Family", content: "Use the Family Assessment tool to identify your family's risk and protective factors." },
        { title: "Set Family Goals", content: "Choose 2-3 specific actions your family will take this month to strengthen prevention efforts." },
        { title: "Build Your Network", content: "Connect with other parents, school counselors, community resources, and mentorship programs." },
        { title: "Review and Adjust", content: "Revisit your plan monthly. Celebrate progress and adjust strategies as your child grows and situations change." },
      ],
    },
  ];

  const strengtheningModules = [
    {
      id: "pe-fam-1",
      title: "Strengthening Family Communication",
      description: "Build deeper, more honest communication patterns that create trust and connection.",
      category: "family_strengthening",
      targetAudience: "All families",
      orderIndex: 8,
      isActive: true,
      contentSections: [
        { title: "Active Listening", content: "Put down devices, make eye contact, and reflect back what you hear. Let your child finish speaking before responding." },
        { title: "I-Statements", content: "Replace 'You always...' with 'I feel... when...' to reduce defensiveness and open genuine dialogue." },
        { title: "Family Meetings", content: "Hold regular family meetings to discuss schedules, concerns, and celebrations. Give everyone a voice." },
        { title: "Digital Communication", content: "Establish healthy texting and social media habits. Be available for digital check-ins throughout the day." },
      ],
    },
    {
      id: "pe-fam-2",
      title: "Positive Discipline & Boundaries",
      description: "Set clear, consistent boundaries while maintaining a warm and supportive relationship.",
      category: "family_strengthening",
      targetAudience: "Parents of youth ages 10-18",
      orderIndex: 9,
      isActive: true,
      contentSections: [
        { title: "Clear Expectations", content: "State rules clearly, explain the reasons behind them, and ensure your child understands the consequences." },
        { title: "Consistent Follow-Through", content: "Enforce consequences fairly and consistently. Inconsistency undermines trust and authority." },
        { title: "Natural Consequences", content: "When safe, allow children to experience natural consequences of their choices as learning opportunities." },
        { title: "Repair After Conflict", content: "After disagreements, reconnect. Acknowledge your own mistakes and model how to repair relationships." },
      ],
    },
    {
      id: "pe-fam-3",
      title: "Building Family Resilience",
      description: "Develop family strengths that help you navigate challenges and bounce back from adversity.",
      category: "family_strengthening",
      targetAudience: "All families",
      orderIndex: 10,
      isActive: true,
      contentSections: [
        { title: "Family Identity", content: "Create shared traditions, stories, and values that give your family a sense of purpose and belonging." },
        { title: "Problem-Solving Together", content: "Face challenges as a team. Involve children in age-appropriate problem-solving to build confidence." },
        { title: "Support Networks", content: "Maintain connections with extended family, neighbors, faith communities, and parent groups." },
        { title: "Self-Care for Parents", content: "You cannot pour from an empty cup. Prioritize your own mental health and well-being." },
      ],
    },
    {
      id: "pe-fam-4",
      title: "Cultural Strengths & Family Heritage",
      description: "Leverage your family's cultural traditions and heritage as protective factors.",
      category: "family_strengthening",
      targetAudience: "All families",
      orderIndex: 11,
      isActive: true,
      contentSections: [
        { title: "Cultural Identity", content: "A strong cultural identity is a powerful protective factor. Share your family's history, language, and traditions." },
        { title: "Intergenerational Wisdom", content: "Connect children with elders and extended family to pass down wisdom, values, and coping strategies." },
        { title: "Community Belonging", content: "Participate in cultural community events and organizations that reinforce positive identity and belonging." },
        { title: "Navigating Two Worlds", content: "Help children integrate their cultural heritage with their school and peer environments with pride and confidence." },
      ],
    },
    {
      id: "pe-fam-5",
      title: "Supporting Your Child's Mental Health",
      description: "Recognize mental health needs and create a supportive home environment.",
      category: "family_strengthening",
      targetAudience: "All parents and guardians",
      orderIndex: 12,
      isActive: true,
      contentSections: [
        { title: "Recognizing Signs", content: "Persistent sadness, withdrawal, anger, sleep changes, or academic decline may signal mental health concerns." },
        { title: "Creating Safety", content: "Make your home a safe space for emotional expression. Validate feelings without minimizing or dismissing them." },
        { title: "Professional Resources", content: "Know your school counselor, community mental health resources, and crisis hotlines (988 Suicide & Crisis Lifeline)." },
        { title: "Reducing Stigma", content: "Talk openly about mental health. Seeking help is a sign of strength, not weakness." },
      ],
    },
    {
      id: "pe-fam-6",
      title: "Parent Self-Care & Wellness",
      description: "Prioritize your own well-being to be a stronger, more present parent.",
      category: "family_strengthening",
      targetAudience: "All parents and guardians",
      orderIndex: 13,
      isActive: true,
      contentSections: [
        { title: "Stress Management", content: "Identify your stress triggers and develop healthy coping strategies like exercise, journaling, or mindfulness." },
        { title: "Setting Boundaries", content: "It's okay to say no. Protecting your time and energy is essential for effective parenting." },
        { title: "Building Your Support Network", content: "Connect with other parents, support groups, and community resources. You don't have to do this alone." },
        { title: "Modeling Wellness", content: "When your child sees you taking care of yourself, they learn that self-care is important and healthy." },
      ],
    },
  ];

  await db.insert(parentEducationModules).values([...preventionModules, ...strengtheningModules]);
}
