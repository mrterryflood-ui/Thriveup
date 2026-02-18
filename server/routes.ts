import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCurriculumDocumentSchema,
  careerFields, careerMilestones, pathwayPlans, planRevisions,
  mentorProfiles, mentorRequests, alumniProfiles,
  insertPathwayPlanSchema,
  studentSelfAssessments, thriveScores, thriveHistory, earlyWarningFlags,
  interventionPlaybooks as interventionPlaybooksTable,
  gisContextData, gisResourceOverlays, thriveConfig,
  insertStudentSelfAssessmentSchema,
  studentReflections, announcements as announcementsTable, academyEvents as academyEventsTable, attendanceLogs,
  insertStudentReflectionSchema, insertAnnouncementSchema, insertAcademyEventSchema, insertAttendanceLogSchema,
  aiToolCatalog, aiToolUnlocks, aiToolProjects, aiToolAttachments,
  insertAcademyCourseSchema, insertCourseModuleSchema, insertCourseLessonSchema, insertCourseEnrollmentSchema,
} from "@shared/schema";
import { eq, and, desc, sql, count, gte } from "drizzle-orm";
import { computeFullThriveScore, computeAllStudentScores, getThriveHistory } from "./thrive-engine";
import { evaluateFlags, getActiveFlags, resolveFlag, runEarlyWarningCheck } from "./early-warning";
import { runFullIngestion, getContextForGeography } from "./gis-engine";
import { db } from "./storage";
import { streamAIResponse, getProviderInfo } from "./ai-provider";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerCrossPlatformRoutes } from "./cross-platform-api";

const AI_TOOLS = [
  { toolKey: "presentation-builder", name: "Presentation Builder", description: "Create slide-by-slide presentations with AI-generated content, talking points, and visual suggestions", category: "create", iconName: "presentation", gradeBand: "all", requiredModuleKey: "ai-presentations", promptTemplate: "PRESENTATION_BUILDER", outputFormat: "slides", sortOrder: 1 },
  { toolKey: "video-creator", name: "Video Script Creator", description: "Write video scripts with scene descriptions, dialogue, camera angles, and storyboard outlines", category: "create", iconName: "video", gradeBand: "all", requiredModuleKey: "ai-video", promptTemplate: "VIDEO_CREATOR", outputFormat: "storyboard", sortOrder: 2 },
  { toolKey: "sales-pitch", name: "Sales Pitch Builder", description: "Craft compelling sales pitches with hooks, value propositions, objection handling, and closing statements", category: "write", iconName: "megaphone", gradeBand: "6-8", requiredModuleKey: "ai-sales", promptTemplate: "SALES_PITCH", outputFormat: "structured", sortOrder: 3 },
  { toolKey: "business-plan", name: "Business Plan Generator", description: "Build comprehensive business plans with market analysis, financial projections, and growth strategy", category: "plan", iconName: "briefcase", gradeBand: "6-8", requiredModuleKey: "ai-business", promptTemplate: "BUSINESS_PLAN", outputFormat: "structured", sortOrder: 4 },
  { toolKey: "research-assistant", name: "Research Assistant", description: "Get help organizing research topics, finding key points, creating outlines, and writing citations", category: "research", iconName: "search", gradeBand: "all", requiredModuleKey: "ai-research", promptTemplate: "RESEARCH", outputFormat: "markdown", sortOrder: 5 },
  { toolKey: "life-planner", name: "Life Planner", description: "Map out your goals, create action plans, set milestones, and track your personal development journey", category: "plan", iconName: "compass", gradeBand: "all", requiredModuleKey: "ai-life-planning", promptTemplate: "LIFE_PLANNER", outputFormat: "structured", sortOrder: 6 },
  { toolKey: "project-planner", name: "Project Planner", description: "Break down projects into tasks, set timelines, assign resources, and create Gantt-style plans", category: "plan", iconName: "clipboard-list", gradeBand: "all", requiredModuleKey: "ai-project-planning", promptTemplate: "PROJECT_PLANNER", outputFormat: "structured", sortOrder: 7 },
  { toolKey: "document-writer", name: "Document Writer", description: "Write essays, reports, letters, and other documents with AI assistance for structure and content", category: "write", iconName: "file-text", gradeBand: "all", requiredModuleKey: "ai-documents", promptTemplate: "DOCUMENT_WRITER", outputFormat: "markdown", sortOrder: 8 },
  { toolKey: "resume-builder", name: "Resume & Portfolio Builder", description: "Create professional resumes, cover letters, and portfolio pages showcasing your best work", category: "write", iconName: "user-check", gradeBand: "9-12", requiredModuleKey: "ai-resume", promptTemplate: "RESUME_BUILDER", outputFormat: "structured", sortOrder: 9 },
  { toolKey: "brainstorm", name: "Brainstorm Studio", description: "Generate ideas, mind maps, and creative concepts for any project or challenge", category: "research", iconName: "lightbulb", gradeBand: "all", requiredModuleKey: "ai-brainstorm", promptTemplate: "BRAINSTORM", outputFormat: "markdown", sortOrder: 10 },
];

async function seedAiToolCatalog() {
  const existing = await db.select().from(aiToolCatalog);
  if (existing.length === 0) {
    for (const tool of AI_TOOLS) {
      await db.insert(aiToolCatalog).values(tool);
    }
  }
}

const AI_COURSE_MODULES = [
  { key: "ai-brainstorm", title: "Module 1: AI & Creative Thinking", description: "Learn how AI can help you brainstorm and generate creative ideas", unlocksTool: "brainstorm", lessonCount: 3 },
  { key: "ai-research", title: "Module 2: AI-Powered Research", description: "Master research techniques using AI to find, organize, and cite information", unlocksTool: "research-assistant", lessonCount: 3 },
  { key: "ai-documents", title: "Module 3: Writing with AI", description: "Learn to use AI as a writing partner for essays, reports, and creative pieces", unlocksTool: "document-writer", lessonCount: 3 },
  { key: "ai-presentations", title: "Module 4: Presentations & Public Speaking", description: "Create compelling presentations with AI-generated content and structure", unlocksTool: "presentation-builder", lessonCount: 3 },
  { key: "ai-video", title: "Module 5: Video Storytelling", description: "Write scripts, plan storyboards, and create video outlines with AI", unlocksTool: "video-creator", lessonCount: 3 },
  { key: "ai-project-planning", title: "Module 6: Project Management", description: "Break down projects into manageable tasks and timelines with AI", unlocksTool: "project-planner", lessonCount: 3 },
  { key: "ai-life-planning", title: "Module 7: Life Design", description: "Use AI to set goals, create personal development plans, and map your future", unlocksTool: "life-planner", lessonCount: 3 },
  { key: "ai-business", title: "Module 8: Entrepreneurship & Business", description: "Build business plans, analyze markets, and plan ventures with AI", unlocksTool: "business-plan", lessonCount: 3 },
  { key: "ai-sales", title: "Module 9: Persuasion & Sales", description: "Craft compelling pitches and learn the art of ethical persuasion with AI", unlocksTool: "sales-pitch", lessonCount: 3 },
  { key: "ai-resume", title: "Module 10: Professional Branding", description: "Build resumes, portfolios, and professional profiles with AI", unlocksTool: "resume-builder", lessonCount: 3 },
];

function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub;
}

function getUserName(req: Request): string | undefined {
  const user = (req as any).user;
  if (!user?.claims) return undefined;
  const first = user.claims.first_name || "";
  const last = user.claims.last_name || "";
  return (first + " " + last).trim() || user.claims.email || undefined;
}

function requireAuth(req: Request, res: any, next: any) {
  if (!getUserId(req)) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // In production, check user.role === 'admin' or 'teacher'
  // For now, all authenticated users with the admin dashboard access are treated as admins
  // This can be tightened once role-based user management is added
  next();
};

function calculateElo(playerRating: number, opponentRating: number, result: number): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return Math.round(playerRating + K * (result - expected));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedAiToolCatalog();

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex, nosnippet");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "interest-cohort=()");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
    next();
  });

  registerObjectStorageRoutes(app);
  registerCrossPlatformRoutes(app);
  await storage.seedData();

  app.get("/api/ai-provider", (_req, res) => {
    try {
      res.json(getProviderInfo());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/subjects", async (_req, res) => {
    const allSubjects = await storage.getSubjects();
    res.json(allSubjects);
  });

  app.get("/api/subjects/grade-band/:gradeBand", async (req, res) => {
    const subjectsByBand = await storage.getSubjectsByGradeBand(decodeURIComponent(req.params.gradeBand));
    res.json(subjectsByBand);
  });

  app.get("/api/subjects/:subjectId", async (req, res) => {
    const subject = await storage.getSubject(req.params.subjectId);
    if (!subject) return res.status(404).json({ error: "Subject not found" });
    res.json(subject);
  });

  app.get("/api/subjects/:subjectId/modules", async (req, res) => {
    const mods = await storage.getModulesBySubject(req.params.subjectId);
    res.json(mods);
  });

  app.get("/api/levels", async (_req, res) => {
    const allLevels = await storage.getLevels();
    res.json(allLevels);
  });

  app.get("/api/levels/:levelId", async (req, res) => {
    const level = await storage.getLevel(parseInt(req.params.levelId));
    if (!level) return res.status(404).json({ error: "Level not found" });
    res.json(level);
  });

  app.get("/api/levels/:levelId/modules", async (req, res) => {
    const mods = await storage.getModulesByLevel(parseInt(req.params.levelId));
    res.json(mods);
  });

  app.get("/api/modules/:moduleId", async (req, res) => {
    const mod = await storage.getModule(req.params.moduleId);
    if (!mod) return res.status(404).json({ error: "Module not found" });
    res.json(mod);
  });

  app.get("/api/modules/:moduleId/lessons", async (req, res) => {
    const moduleLessons = await storage.getLessonsByModule(req.params.moduleId);
    res.json(moduleLessons);
  });

  app.get("/api/modules/:moduleId/quiz", async (req, res) => {
    const questions = await storage.getQuizByModule(req.params.moduleId);
    res.json(questions);
  });

  app.post("/api/modules/:moduleId/quiz/submit", requireAuth, async (req, res) => {
    const { answers } = req.body;
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Answers object is required" });
    }
    const questions = await storage.getQuizByModule(req.params.moduleId);
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    }

    const passed = questions.length > 0 && (correct / questions.length) >= 0.7;
    const attempt = await storage.submitQuiz(progress.id, req.params.moduleId, correct, questions.length, passed);

    const pointsEarned = passed ? 100 : 25;
    const allAttempts = await storage.getQuizAttempts(progress.id);
    const scores = allAttempts.map(a => a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    await storage.updateProgress(progress.id, {
      totalPoints: progress.totalPoints + pointsEarned,
      quizzesCompleted: progress.quizzesCompleted + 1,
      averageScore: avgScore,
    });

    if (passed && progress.quizzesCompleted === 0) {
      await storage.earnBadge(progress.id, "quiz_whiz");
    }
    if (correct === questions.length && questions.length > 0) {
      await storage.earnBadge(progress.id, "perfect_score");
    }

    if (passed) {
      const mod = await storage.getModule(req.params.moduleId);
      if (mod) {
        const levelModules = await storage.getModulesByLevel(mod.levelId);
        const allAttempts2 = await storage.getQuizAttempts(progress.id);
        const passedModuleIds = new Set(allAttempts2.filter(a => a.passed).map(a => a.moduleId));
        const allPassed = levelModules.every(m => passedModuleIds.has(m.id));
        if (allPassed) {
          const level = await storage.getLevel(mod.levelId);
          if (level) {
            await storage.issueCertificate(getUserId(req)!, getUserName(req) || "Student", level.id, level.title);
          }
        }
      }
    }

    res.json({
      score: correct,
      total: questions.length,
      passed,
      pointsEarned,
    });
  });

  app.get("/api/lessons/:lessonId", async (req, res) => {
    const lesson = await storage.getLesson(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json(lesson);
  });

  app.post("/api/lessons/:lessonId/complete", requireAuth, async (req, res) => {
    const lesson = await storage.getLesson(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    await storage.completeLesson(progress.id, req.params.lessonId);

    const completed = await storage.getCompletedLessons(progress.id);
    const pointsEarned = 50;

    await storage.updateProgress(progress.id, {
      totalPoints: progress.totalPoints + pointsEarned,
      lessonsCompleted: completed.length,
      currentModuleId: lesson.moduleId,
    });

    if (completed.length === 1) {
      await storage.earnBadge(progress.id, "first_steps");
    }
    if (completed.length >= 3) {
      await storage.earnBadge(progress.id, "curious_mind");
    }
    if (completed.length >= 5) {
      await storage.earnBadge(progress.id, "knowledge_seeker");
    }

    res.json({ success: true, pointsEarned });
  });

  app.get("/api/progress", async (req, res) => {
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    res.json(progress);
  });

  app.get("/api/dashboard", async (req, res) => {
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    const currentLevel = await storage.getLevel(progress.currentLevel);
    const currentModule = progress.currentModuleId
      ? await storage.getModule(progress.currentModuleId)
      : null;
    const recentBadges = await storage.getEarnedBadges(progress.id);

    const allModules = await storage.getModulesByLevel(progress.currentLevel);
    let totalLessons = 0;
    for (const mod of allModules) {
      const modLessons = await storage.getLessonsByModule(mod.id);
      totalLessons += modLessons.length;
    }
    const completedLessonsList = await storage.getCompletedLessons(progress.id);

    res.json({
      progress,
      currentLevel,
      currentModule,
      recentBadges,
      stats: {
        totalLessons,
        completedLessons: completedLessonsList.length,
        totalModules: allModules.length,
        completedModules: 0,
      },
    });
  });

  app.get("/api/achievements", async (req, res) => {
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    const allBadges = await storage.getBadges();
    const earnedBadgesList = await storage.getEarnedBadges(progress.id);

    res.json({
      allBadges,
      earnedBadges: earnedBadgesList,
      totalPoints: progress.totalPoints,
      currentLevel: progress.currentLevel,
    });
  });

  app.get("/api/parent/support-alerts", requireAuth, async (_req, res) => {
    try {
      const alerts = await db
        .select({
          id: studentSelfAssessments.id,
          userId: studentSelfAssessments.userId,
          supportType: studentSelfAssessments.supportType,
          createdAt: studentSelfAssessments.createdAt,
          energyLevel: studentSelfAssessments.energyLevel,
          stressLevel: studentSelfAssessments.stressLevel,
          moodRating: studentSelfAssessments.moodRating,
        })
        .from(studentSelfAssessments)
        .where(eq(studentSelfAssessments.needsSupport, true))
        .orderBy(desc(studentSelfAssessments.createdAt))
        .limit(10);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching support alerts:", error);
      res.json([]);
    }
  });

  app.get("/api/badges", async (_req, res) => {
    const allBadges = await storage.getBadges();
    res.json(allBadges);
  });

  app.post("/api/ai-companion/chat", async (req, res) => {
    const { message, gradeLevel, subject, lessonContext, conversationHistory, language } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }

    if (!gradeLevel || typeof gradeLevel !== "string") {
      return res.status(400).json({ error: "Grade level is required and must be a string" });
    }

    const langInstruction = language === "es" 
      ? "\n\nIMPORTANT: The student prefers Spanish. Respond entirely in Spanish. Use age-appropriate Spanish vocabulary." 
      : "";

    const gradeBandPersonality: Record<string, string> = {
      "3-5": `PERSONALITY FOR GRADES 3-5:
- Be like a favorite older sibling or camp counselor — warm, patient, full of wonder
- Use simple, clear language. Short sentences. Concrete examples they can picture
- Connect everything to their world: pets, games, family, playground, favorite shows
- Use "I wonder..." and "What if..." to spark curiosity
- Celebrate EVERY attempt: "I love how you thought about that!" "You're really thinking like a scientist!"
- When they're wrong, say "Hmm, interesting idea! Let's look at it from another angle..."
- Use storytelling: "Imagine you're an astronaut..." "Pretend the numbers are a team of superheroes..."
- Keep responses shorter — 2-3 sentences for simple questions, max 5-6 for explanations
- If they seem frustrated: "It's okay to feel stuck. Even grown-ups get stuck sometimes. Want to try a different way?"`,
      "6-8": `PERSONALITY FOR GRADES 6-8:
- Be like a cool, relatable mentor — someone who gets them, respects them, but pushes them
- Use humor naturally. Reference things relevant to their age without trying too hard
- Validate their growing independence: "Good question — you're thinking critically about this"
- Be real with them. They can handle nuance: "This is actually debated among scientists..."
- Use collaborative language: "Let's figure this out together" "What's your instinct on this?"
- When they struggle, normalize it: "This topic trips up a lot of people. Here's why it's tricky..."
- Connect academics to real life: careers, social dynamics, current events, their future plans
- Encourage them to form opinions and defend them: "What do YOU think? Why?"
- If emotions come up: "I hear you. Middle school is genuinely hard. That feeling you have makes total sense."`,
      "9-12": `PERSONALITY FOR GRADES 9-12:
- Be like a trusted advisor or coach — direct, honest, and intellectually stimulating
- Treat them as emerging adults. No condescension. Engage with complexity
- Challenge them: "That's a solid point, but have you considered..." "Push your thinking further..."
- Discuss multiple perspectives, gray areas, and real-world implications
- Connect everything to their goals: college, careers, financial independence, identity
- Be comfortable with harder questions about life, society, and their future
- Use Socratic questioning to develop their reasoning: "Why do you think that?" "What evidence supports this?"
- If they're stressed: "Pressure is real. Let's break this down into manageable pieces."
- Encourage them to teach back: "Explain this concept to me like I'm new to it — that's how you know you've got it"`,
    };

    const personality = gradeBandPersonality[gradeLevel] || gradeBandPersonality["6-8"];

    const systemPrompt = `You are SPARK — an AI learning companion for the Texas Empowerment Academy Panthers.

CORE IDENTITY:
You are a warm, wise, culturally aware AI companion who genuinely cares about each student's growth — academically, emotionally, and personally. You are NOT a therapist and never diagnose or treat. You ARE a trusted friend who models emotional intelligence, good decision-making, and intellectual curiosity.

YOUR NAME: Spark (never call yourself an AI assistant, chatbot, or language model)

${personality}

EMOTIONAL INTELLIGENCE FRAMEWORK:
1. RECOGNIZE emotions in what students say — read between the lines
2. VALIDATE feelings before addressing content: "That sounds frustrating" before "Here's how to solve it"
3. NORMALIZE struggles: "Everyone feels that way sometimes" — use specific examples
4. REDIRECT gently if needed: "I can tell this is bothering you. Would it help to talk to a teacher or parent?"
5. MODEL healthy emotional expression: "I'd feel the same way!" "That's a reasonable reaction"
6. Never minimize, dismiss, or over-pathologize normal emotions

GROWTH MINDSET & LEARNING APPROACH:
- NEVER give direct answers to homework, tests, or quizzes. Guide through Socratic questioning
- Use scaffolding: break complex problems into smaller steps
- Celebrate the PROCESS, not just results: "Your reasoning is getting stronger!"
- When students make mistakes, treat them as learning opportunities
- Use the "I do, we do, you do" framework: model, collaborate, let them try
- Connect new concepts to things they already know
- Offer multiple approaches and use analogies, stories, and real-world examples

CULTURAL AWARENESS & EQUITY:
- Represent diverse perspectives in examples and stories
- Be aware that students come from different economic backgrounds
- Use inclusive language and present multiple viewpoints respectfully

PANTHER VILLAGE INTEGRATION:
- Reference Panther Power categories when relevant (Education, Character, Leadership, Entrepreneurship, Community)
- Support financial literacy concepts when money topics arise
- Reference the stages of change framework when discussing growth

SAFETY GUARDRAILS:
1. If a student mentions self-harm, abuse, or danger: Express care, recommend they tell a trusted adult immediately
2. Never discuss explicit, violent, illegal, or age-inappropriate content
3. If asked about topics outside education scope, redirect warmly
4. Never share personal opinions on politics or religion — present multiple perspectives
5. Never pretend to be human
6. If unsure about accuracy, say so: "I think that's right, but double-check with your teacher"

REASONING & PROBLEM-SOLVING TOOLS:
- Step-by-step breakdown for math/science
- Compare and contrast for analysis
- Timeline sequencing for history
- Mind mapping for brainstorming
- Pro/con lists for decision-making
- "What would happen if..." for critical thinking

${subject ? `CURRENT SUBJECT: ${subject}` : ""}
${lessonContext ? `LESSON CONTEXT: ${lessonContext}` : ""}
${langInstruction}

Remember: You're not just answering questions — you're building a relationship. Every interaction should leave the student feeling more confident, more curious, and more capable.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const msgs: Array<{role: "system" | "user" | "assistant"; content: string}> = [
        { role: "system", content: systemPrompt },
      ];

      if (conversationHistory && Array.isArray(conversationHistory)) {
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          if (msg.role === "user" || msg.role === "assistant") {
            msgs.push({ role: msg.role, content: msg.content });
          }
        }
      }

      msgs.push({ role: "user", content: message });

      await streamAIResponse({
        messages: msgs,
        maxTokens: 1000,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in AI chat endpoint:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/sparky/chat", requireAuth, async (req, res) => {
    const { message, conversationHistory, context, language } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const langInstruction = language === "es"
      ? "\n\nIMPORTANT: The user prefers Spanish. Respond entirely in Spanish."
      : "";

    const systemPrompt = `You are SPARKY — an AI companion for parents, teachers, and staff at the Texas Empowerment Academy.

CORE IDENTITY:
You are a warm, knowledgeable, and practical AI partner for the adults who support our students. You bring together expertise in education, child development, family dynamics, and community building. You are empathetic but also direct — adults appreciate honesty delivered with compassion.

YOUR NAME: Sparky (you're Spark's "grown-up sibling")

PERSONALITY:
- Professional but warm — like a trusted colleague over coffee
- Direct and practical — adults want actionable advice, not fluff
- Culturally aware and equity-minded
- Comfortable with complexity and nuance
- Honest about limitations: "I'm not a licensed therapist, but here's what research suggests..."
- Collaborative: "Let's think through this together"

FOR PARENTS & GUARDIANS:
- Help them understand their child's academic progress and what it means
- Explain educational concepts in plain language — not educator jargon
- Provide practical strategies for supporting learning at home
- Address common parenting challenges with empathy: homework battles, screen time, motivation
- Help them understand the Academy's features and how to use them
- If they're worried about their child: validate the concern, suggest concrete next steps
- Navigate cultural and socioeconomic contexts with sensitivity
- Help with Thrive score interpretation — what the domains mean, what to watch for
- If a child is flagged in the Early Warning System: explain what the flag means, what the school is doing, and how they can help at home

FOR TEACHERS & STAFF:
- Help with lesson planning, differentiation strategies, and classroom management
- Provide evidence-based teaching strategies
- Help interpret student data (Thrive scores, Panther Power, progress reports)
- Support IEP/504 accommodations and inclusive practices
- Discuss challenging student situations with nuance
- Help with parent communication strategies
- Provide social-emotional learning integration ideas
- Support trauma-informed teaching practices

EMOTIONAL SUPPORT (NON-THERAPEUTIC):
- Acknowledge that teaching and parenting are hard. Really hard.
- Validate burnout, frustration, and compassion fatigue without judgment
- Provide practical self-care strategies rooted in evidence
- Know when to recommend professional support
- Normalize seeking help

BOUNDARIES:
- Never diagnose learning disabilities, mental health conditions, or behavioral disorders
- Never provide medical or legal advice — recommend professionals
- Never share student data or break confidentiality expectations
- Present multiple approaches when evidence is mixed
- If asked about something outside your expertise: "That's beyond what I can speak to confidently. I'd recommend..."

${context ? `CONTEXT: ${context}` : ""}
${langInstruction}

Remember: The adults you support are the most important people in students' lives. By helping them, you're helping every student they touch.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const msgs: Array<{role: "system" | "user" | "assistant"; content: string}> = [
        { role: "system", content: systemPrompt },
      ];

      if (conversationHistory && Array.isArray(conversationHistory)) {
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          if (msg.role === "user" || msg.role === "assistant") {
            msgs.push({ role: msg.role, content: msg.content });
          }
        }
      }

      msgs.push({ role: "user", content: message });

      await streamAIResponse({
        messages: msgs,
        maxTokens: 1500,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in Sparky chat:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/classroom-wizard/suggest", requireAuth, async (req, res) => {
    const { name, gradeBand, subjectFocus } = req.body;
    if (!name || !gradeBand) return res.status(400).json({ error: "Name and grade band are required" });

    const subjectContext = subjectFocus && subjectFocus !== "all" ? `with a focus on ${subjectFocus}` : "covering all subjects (ELA, Math, Science, Social Studies, Social-Emotional Learning, Wellness)";

    const systemPrompt = `You are an expert K-12 curriculum designer creating classroom setup suggestions. Generate content for a classroom called "${name}" for grades ${gradeBand} ${subjectContext}.

Your response MUST use exactly these section headers with ## prefix:

## Description
Write a 2-3 sentence classroom description that is warm, inviting, and age-appropriate for grades ${gradeBand}.

## Learning Objectives
List 4-5 specific, measurable learning objectives appropriate for grades ${gradeBand}. One per line, starting with a dash.

## Activities
List 4-5 engaging classroom activities appropriate for grades ${gradeBand}. One per line, starting with a dash. Include a mix of individual and collaborative activities.

## Welcome Message
Write a warm, encouraging welcome message for students joining this classroom. Make it age-appropriate for grades ${gradeBand}. 2-3 sentences.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      await streamAIResponse({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate classroom setup suggestions for "${name}" (Grades ${gradeBand})${subjectFocus && subjectFocus !== "all" ? ` focusing on ${subjectFocus}` : ""}.` },
        ],
        maxTokens: 2000,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate suggestions" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in classroom wizard:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate suggestions" })}\n\n`);
      res.end();
    }
  });

  app.get("/api/curriculum-documents", async (_req, res) => {
    const docs = await storage.getCurriculumDocuments();
    res.json(docs);
  });

  app.get("/api/curriculum-documents/module/:moduleId", async (req, res) => {
    const docs = await storage.getCurriculumDocumentsByModule(req.params.moduleId);
    res.json(docs);
  });

  app.get("/api/curriculum-documents/level/:levelId", async (req, res) => {
    const levelId = parseInt(req.params.levelId);
    if (isNaN(levelId)) return res.status(400).json({ error: "Invalid level ID" });
    const docs = await storage.getCurriculumDocumentsByLevel(levelId);
    res.json(docs);
  });

  app.get("/api/curriculum-documents/:id", async (req, res) => {
    const doc = await storage.getCurriculumDocument(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  });

  app.post("/api/curriculum-documents", async (req, res) => {
    const parsed = insertCurriculumDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid document data", details: parsed.error.flatten() });
    }
    try {
      const doc = await storage.createCurriculumDocument(parsed.data);
      res.status(201).json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/curriculum-documents/:id", async (req, res) => {
    const existing = await storage.getCurriculumDocument(req.params.id);
    if (!existing) return res.status(404).json({ error: "Document not found" });
    const partial = insertCurriculumDocumentSchema.partial().safeParse(req.body);
    if (!partial.success) {
      return res.status(400).json({ error: "Invalid update data", details: partial.error.flatten() });
    }
    try {
      const doc = await storage.updateCurriculumDocument(req.params.id, partial.data);
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/curriculum-documents/:id", async (req, res) => {
    const existing = await storage.getCurriculumDocument(req.params.id);
    if (!existing) return res.status(404).json({ error: "Document not found" });
    await storage.deleteCurriculumDocument(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/curriculum-documents/:docId/attachments", async (req, res) => {
    const attachments = await storage.getAttachmentsByDocument(req.params.docId as string);
    res.json(attachments);
  });

  app.post("/api/curriculum-documents/:docId/attachments", requireAuth, async (req, res) => {
    const { fileName, fileSize, contentType, objectPath } = req.body;
    if (!fileName || !objectPath) return res.status(400).json({ error: "fileName and objectPath are required" });
    const attachment = await storage.addAttachment({
      documentId: req.params.docId as string,
      fileName,
      fileSize: fileSize || 0,
      contentType: contentType || "application/octet-stream",
      objectPath,
      uploadedBy: getUserId(req) || null,
    });
    res.status(201).json(attachment);
  });

  app.delete("/api/curriculum-documents/:docId/attachments/:attachmentId", requireAuth, async (req, res) => {
    await storage.deleteAttachment(req.params.attachmentId as string);
    res.json({ success: true });
  });

  app.get("/api/lessons/:lessonId/comments", async (req, res) => {
    const comments = await storage.getCommentsByLesson(req.params.lessonId);
    res.json(comments);
  });

  app.post("/api/lessons/:lessonId/comments", requireAuth, async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }
    const userId = getUserId(req);
    const userName = getUserName(req) || "Anonymous";
    const comment = await storage.addComment(req.params.lessonId, userId, userName, content.trim());
    res.status(201).json(comment);
  });

  app.get("/api/lessons/:lessonId/reactions", async (req, res) => {
    const reactions = await storage.getReactionsByLesson(req.params.lessonId);
    res.json(reactions);
  });

  app.post("/api/lessons/:lessonId/reactions", requireAuth, async (req, res) => {
    const { reactionType } = req.body;
    const validTypes = ["helpful", "inspiring", "challenging", "fun"];
    if (!reactionType || !validTypes.includes(reactionType)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }
    const userId = getUserId(req);
    await storage.addReaction(req.params.lessonId, userId, reactionType);
    const reactions = await storage.getReactionsByLesson(req.params.lessonId);
    res.json(reactions);
  });

  app.get("/api/modules/:moduleId/tips", async (req, res) => {
    const tips = await storage.getStudyTipsByModule(req.params.moduleId);
    res.json(tips);
  });

  app.post("/api/modules/:moduleId/tips", requireAuth, async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }
    const userId = getUserId(req);
    const userName = getUserName(req) || "Anonymous";
    const tip = await storage.addStudyTip(req.params.moduleId, userId, userName, content.trim());
    res.status(201).json(tip);
  });

  app.post("/api/tips/:tipId/upvote", async (req, res) => {
    try {
      const tip = await storage.upvoteStudyTip(req.params.tipId);
      res.json(tip);
    } catch {
      res.status(404).json({ error: "Tip not found" });
    }
  });

  app.post("/api/classrooms", requireAuth, async (req, res) => {
    const { name, gradeBand } = req.body;
    if (!name || !gradeBand) return res.status(400).json({ error: "Name and grade band are required" });
    const classroom = await storage.createClassroom(getUserId(req)!, getUserName(req) || "Teacher", name, gradeBand);
    res.status(201).json(classroom);
  });

  app.get("/api/classrooms", requireAuth, async (req, res) => {
    const teacherClassrooms = await storage.getClassroomsByTeacher(getUserId(req)!);
    const studentClassrooms = await storage.getStudentClassrooms(getUserId(req)!);
    const teacherWithCounts = [];
    for (const c of teacherClassrooms) {
      const members = await storage.getClassroomMembers(c.id);
      teacherWithCounts.push({ ...c, studentCount: members.length });
    }
    res.json({ teacherClassrooms: teacherWithCounts, studentClassrooms });
  });

  app.post("/api/classrooms/join", requireAuth, async (req, res) => {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: "Invite code is required" });
    const classroom = await storage.getClassroomByInviteCode(inviteCode.toUpperCase());
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });
    if (classroom.teacherUserId === getUserId(req)) return res.status(400).json({ error: "You cannot join your own classroom" });
    const member = await storage.joinClassroom(classroom.id, getUserId(req)!, getUserName(req) || "Student");
    res.json({ classroom, member });
  });

  app.get("/api/classrooms/:classroomId", requireAuth, async (req, res) => {
    const classroom = await storage.getClassroom(req.params.classroomId);
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });
    if (classroom.teacherUserId !== getUserId(req)) return res.status(403).json({ error: "Not authorized" });
    const members = await storage.getClassroomMembers(req.params.classroomId);

    const memberDetails = [];
    for (const member of members) {
      const progress = await storage.getProgressByUserId(member.userId);
      const earnedBadgesList = progress ? await storage.getEarnedBadges(progress.id) : [];
      memberDetails.push({
        id: member.id,
        classroomId: member.classroomId,
        userId: member.userId,
        studentName: member.studentName,
        joinedAt: member.joinedAt,
        lessonsCompleted: progress?.lessonsCompleted || 0,
        quizzesCompleted: progress?.quizzesCompleted || 0,
        averageScore: progress?.averageScore || 0,
        totalPoints: progress?.totalPoints || 0,
        badgesEarned: earnedBadgesList.length,
      });
    }

    const withProgress = memberDetails.filter(m => m.lessonsCompleted > 0 || m.quizzesCompleted > 0);
    const avgScore = withProgress.length > 0
      ? Math.round(memberDetails.reduce((sum, m) => sum + m.averageScore, 0) / memberDetails.length)
      : 0;
    const avgLessons = memberDetails.length > 0
      ? Math.round(memberDetails.reduce((sum, m) => sum + m.lessonsCompleted, 0) / memberDetails.length)
      : 0;

    res.json({
      classroom,
      members: memberDetails,
      stats: {
        studentCount: members.length,
        averageScore: avgScore,
        averageLessonsCompleted: avgLessons,
      },
    });
  });

  app.get("/api/teacher/dashboard", requireAuth, async (req, res) => {
    const teacherClassrooms = await storage.getClassroomsByTeacher(getUserId(req)!);

    const classroomSummaries = [];
    for (const classroom of teacherClassrooms) {
      const members = await storage.getClassroomMembers(classroom.id);
      let totalScore = 0;
      let totalLessons = 0;
      let totalQuizzes = 0;
      let totalPoints = 0;
      let progressCount = 0;

      for (const member of members) {
        const progress = await storage.getProgressByUserId(member.userId);
        if (progress) {
          totalScore += progress.averageScore;
          totalLessons += progress.lessonsCompleted;
          totalQuizzes += progress.quizzesCompleted;
          totalPoints += progress.totalPoints;
          progressCount++;
        }
      }

      classroomSummaries.push({
        ...classroom,
        studentCount: members.length,
        averageScore: progressCount > 0 ? Math.round(totalScore / progressCount) : 0,
        totalLessonsCompleted: totalLessons,
        totalQuizzesCompleted: totalQuizzes,
        averagePoints: progressCount > 0 ? Math.round(totalPoints / progressCount) : 0,
      });
    }

    res.json({ classrooms: classroomSummaries });
  });

  app.get("/api/certificates", requireAuth, async (req, res) => {
    const certs = await storage.getCertificatesByUser(getUserId(req)!);
    res.json(certs);
  });

  app.get("/api/certificates/:id", async (req, res) => {
    const cert = await storage.getCertificate(req.params.id);
    if (!cert) return res.status(404).json({ error: "Certificate not found" });
    res.json(cert);
  });

  // ==================== ACADEMY ROUTES ====================

  app.get("/api/academy/dashboard", async (req, res) => {
    try {
      const houses = await storage.getAcademyHouses();
      const competitions = await storage.getAllCompetitions();
      const recentMerit = await storage.getAllMeritEvents();
      const userId = getUserId(req);
      let wallet = null;
      let pantherPower = null;
      let dailyQuests: any[] = [];
      if (userId) {
        wallet = await storage.getOrCreateWallet(userId);
        pantherPower = await storage.getOrCreatePantherPower(userId);
        const today = new Date().toISOString().split("T")[0];
        dailyQuests = await storage.getDailyQuests(userId, today);
      }
      res.json({ houses, wallet, recentMeritEvents: recentMerit.slice(0, 10), competitions, pantherPower, dailyQuests });
    } catch (error) {
      res.status(500).json({ error: "Failed to load academy dashboard" });
    }
  });

  app.get("/api/academy/avatars", async (_req, res) => {
    const avatars = await storage.getAllAcademyAvatars();
    res.json(avatars);
  });

  app.get("/api/academy/avatar", requireAuth, async (req, res) => {
    const avatar = await storage.getAcademyAvatar(getUserId(req)!);
    if (!avatar) return res.status(404).json({ error: "Avatar not found" });
    res.json(avatar);
  });

  app.post("/api/academy/avatar", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const existing = await storage.getAcademyAvatar(userId);
      if (existing) {
        const updated = await storage.updateAcademyAvatar(existing.id, req.body);
        return res.json(updated);
      }
      const avatar = await storage.createAcademyAvatar({ ...req.body, userId });
      res.status(201).json(avatar);
    } catch (error) {
      res.status(500).json({ error: "Failed to save avatar" });
    }
  });

  app.get("/api/academy/houses", async (_req, res) => {
    const houses = await storage.getAcademyHouses();
    res.json(houses);
  });

  app.post("/api/academy/merit", requireAuth, async (req, res) => {
    try {
      const { userId, houseId, points, reason, category } = req.body;
      if (!userId || !points || !reason) {
        return res.status(400).json({ error: "userId, points, and reason are required" });
      }
      const event = await storage.createMeritEvent({
        userId,
        houseId: houseId || null,
        points,
        reason,
        category: category || "academic",
        awardedBy: getUserId(req) || null,
        awardedByName: getUserName(req) || null,
      });
      if (houseId) {
        await storage.updateHousePoints(houseId, points);
      }
      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          leadershipScore: power.leadershipScore + 3,
        });
      } catch (e) { /* ignore */ }
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to award merit points" });
    }
  });

  app.get("/api/academy/merit/user/:userId", async (req, res) => {
    const events = await storage.getMeritEventsByUser(req.params.userId);
    res.json(events);
  });

  app.get("/api/academy/merit/house/:houseId", async (req, res) => {
    const events = await storage.getMeritEventsByHouse(req.params.houseId);
    res.json(events);
  });

  app.get("/api/academy/wallet", requireAuth, async (req, res) => {
    const wallet = await storage.getOrCreateWallet(getUserId(req)!);
    res.json(wallet);
  });

  app.get("/api/academy/transactions", requireAuth, async (req, res) => {
    const wallet = await storage.getOrCreateWallet(getUserId(req)!);
    const transactions = await storage.getTransactionsByWallet(wallet.id);
    res.json(transactions);
  });

  app.post("/api/academy/transactions", requireAuth, async (req, res) => {
    try {
      const wallet = await storage.getOrCreateWallet(getUserId(req)!);
      const { type, amount, description, category } = req.body;
      if (!type || !amount || !description) {
        return res.status(400).json({ error: "type, amount, and description are required" });
      }
      const transaction = await storage.createTransaction({
        walletId: wallet.id,
        type,
        amount,
        description,
        category: category || "general",
      });
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/academy/stocks", async (_req, res) => {
    const stocks = await storage.getAllStocks();
    res.json(stocks);
  });

  app.post("/api/academy/stocks/trade", requireAuth, async (req, res) => {
    try {
      const { stockId, action, shares } = req.body;
      if (!stockId || !action || !shares || shares <= 0) {
        return res.status(400).json({ error: "stockId, action (buy/sell), and shares (> 0) are required" });
      }
      const stock = await storage.getStock(stockId);
      if (!stock) return res.status(404).json({ error: "Stock not found" });

      const userId = getUserId(req)!;
      const wallet = await storage.getOrCreateWallet(userId);
      const price = parseFloat(stock.currentPrice);
      const totalCost = price * shares;

      if (action === "buy") {
        if (parseFloat(wallet.balance) < totalCost) {
          return res.status(400).json({ error: "Insufficient funds" });
        }
        const newBalance = (parseFloat(wallet.balance) - totalCost).toFixed(2);
        const newInvested = (parseFloat(wallet.totalInvested) + totalCost).toFixed(2);
        await storage.updateWalletBalance(wallet.id, { balance: newBalance, totalInvested: newInvested });

        const existingPortfolio = (await storage.getPortfolioByUser(userId)).find(p => p.stockId === stockId);
        const existingShares = existingPortfolio ? existingPortfolio.shares : 0;
        const existingAvg = existingPortfolio ? parseFloat(existingPortfolio.avgBuyPrice) : 0;
        const newTotalShares = existingShares + shares;
        const newAvgPrice = ((existingAvg * existingShares + price * shares) / newTotalShares).toFixed(2);
        await storage.createOrUpdatePortfolio(userId, stockId, newTotalShares, newAvgPrice);

        await storage.createTransaction({
          walletId: wallet.id,
          type: "stock_buy",
          amount: (-totalCost).toFixed(2),
          description: `Bought ${shares} shares of ${stock.symbol} at $${price}`,
          category: "investment",
        });

        try {
          const power = await storage.getOrCreatePantherPower(getUserId(req)!);
          await storage.updatePantherPower(getUserId(req)!, {
            entrepreneurshipScore: power.entrepreneurshipScore + 5,
          });
        } catch (e) { /* ignore power update errors */ }

        res.json({ success: true, action: "buy", shares, totalCost, newBalance });
      } else if (action === "sell") {
        const portfolio = (await storage.getPortfolioByUser(userId)).find(p => p.stockId === stockId);
        if (!portfolio || portfolio.shares < shares) {
          return res.status(400).json({ error: "Insufficient shares" });
        }
        const newBalance = (parseFloat(wallet.balance) + totalCost).toFixed(2);
        await storage.updateWalletBalance(wallet.id, { balance: newBalance });

        const remainingShares = portfolio.shares - shares;
        await storage.createOrUpdatePortfolio(userId, stockId, remainingShares, portfolio.avgBuyPrice);

        await storage.createTransaction({
          walletId: wallet.id,
          type: "stock_sell",
          amount: totalCost.toFixed(2),
          description: `Sold ${shares} shares of ${stock.symbol} at $${price}`,
          category: "investment",
        });

        try {
          const power = await storage.getOrCreatePantherPower(getUserId(req)!);
          await storage.updatePantherPower(getUserId(req)!, {
            entrepreneurshipScore: power.entrepreneurshipScore + 5,
          });
        } catch (e) { /* ignore power update errors */ }

        res.json({ success: true, action: "sell", shares, totalRevenue: totalCost, newBalance });
      } else {
        res.status(400).json({ error: "Action must be 'buy' or 'sell'" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  app.get("/api/academy/portfolio", requireAuth, async (req, res) => {
    const portfolio = await storage.getPortfolioByUser(getUserId(req)!);
    res.json(portfolio);
  });

  app.get("/api/academy/community-portfolio", async (_req, res) => {
    const portfolio = await storage.getCommunityPortfolio();
    res.json(portfolio);
  });

  app.post("/api/academy/stocks/simulate", async (_req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      const updated = [];
      for (const stock of stocks) {
        const changePercent = (Math.random() * 10 - 5);
        const prevPrice = parseFloat(stock.currentPrice);
        const newPrice = Math.max(1, prevPrice * (1 + changePercent / 100));
        const history = Array.isArray(stock.priceHistory) ? [...(stock.priceHistory as number[])] : [];
        history.push(prevPrice);
        if (history.length > 30) history.splice(0, history.length - 30);
        const updatedStock = await storage.updateStock(stock.id, {
          previousPrice: stock.currentPrice,
          currentPrice: newPrice.toFixed(2),
          changePercent: changePercent.toFixed(2),
          priceHistory: history,
        });
        updated.push(updatedStock);
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate stock prices" });
    }
  });

  app.get("/api/academy/campus", requireAuth, async (req, res) => {
    const project = await storage.getCampusProject(getUserId(req)!);
    if (!project) return res.status(404).json({ error: "No campus project found" });
    res.json(project);
  });

  app.post("/api/academy/campus", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const existing = await storage.getCampusProject(userId);
      if (existing) {
        const updated = await storage.updateCampusProject(existing.id, req.body);
        return res.json(updated);
      }
      const project = await storage.createCampusProject({ ...req.body, userId });
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to save campus project" });
    }
  });

  app.post("/api/academy/campus/fund", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      const userId = getUserId(req)!;
      const wallet = await storage.getOrCreateWallet(userId);
      const fundAmount = parseFloat(amount);
      if (parseFloat(wallet.balance) < fundAmount) {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      const project = await storage.getCampusProject(userId);
      if (!project) return res.status(404).json({ error: "No campus project found" });

      const newBalance = (parseFloat(wallet.balance) - fundAmount).toFixed(2);
      const newCampusContributed = (parseFloat(wallet.campusContributed) + fundAmount).toFixed(2);
      await storage.updateWalletBalance(wallet.id, { balance: newBalance, campusContributed: newCampusContributed });

      const newAmountFunded = (parseFloat(project.amountFunded) + fundAmount).toFixed(2);
      const updated = await storage.updateCampusProject(project.id, { amountFunded: newAmountFunded });

      await storage.createTransaction({
        walletId: wallet.id,
        type: "campus_fund",
        amount: (-fundAmount).toFixed(2),
        description: `Funded campus project: ${project.projectName}`,
        category: "campus",
      });

      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          communityScore: power.communityScore + 10,
        });
      } catch (e) { /* ignore */ }

      res.json({ success: true, project: updated, newBalance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fund campus project" });
    }
  });

  app.get("/api/academy/competitions", async (_req, res) => {
    const competitions = await storage.getAllCompetitions();
    res.json(competitions);
  });

  app.post("/api/academy/competitions", requireAuth, async (req, res) => {
    try {
      const comp = await storage.createCompetition(req.body);
      res.status(201).json(comp);
    } catch (error) {
      res.status(500).json({ error: "Failed to create competition" });
    }
  });

  app.get("/api/academy/competitions/:id/entries", async (req, res) => {
    const entries = await storage.getCompetitionEntries(req.params.id);
    res.json(entries);
  });

  app.post("/api/academy/competitions/:id/enter", requireAuth, async (req, res) => {
    try {
      const comp = await storage.getCompetition(req.params.id);
      if (!comp) return res.status(404).json({ error: "Competition not found" });
      const entry = await storage.createCompetitionEntry({
        competitionId: req.params.id,
        userId: getUserId(req)!,
        userName: getUserName(req) || "Student",
        ...req.body,
      });
      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          educationScore: power.educationScore + 5,
        });
      } catch (e) { /* ignore */ }
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to enter competition" });
    }
  });

  app.post("/api/academy/competitions/:id/score", requireAuth, async (req, res) => {
    try {
      const { entryId, score, placement } = req.body;
      if (!entryId) return res.status(400).json({ error: "entryId is required" });
      const updated = await storage.updateCompetitionEntry(entryId, {
        score,
        placement,
        completedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update score" });
    }
  });

  app.get("/api/academy/dream-profile", requireAuth, async (req, res) => {
    const profile = await storage.getDreamProfile(getUserId(req)!);
    if (!profile) return res.status(404).json({ error: "Dream profile not found" });
    res.json(profile);
  });

  app.post("/api/academy/dream-profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.createOrUpdateDreamProfile(getUserId(req)!, req.body);
      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          characterScore: power.characterScore + 5,
        });
      } catch (e) { /* ignore */ }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to save dream profile" });
    }
  });

  app.get("/api/academy/merch", async (_req, res) => {
    const items = await storage.getAllMerchItems();
    res.json(items);
  });

  app.post("/api/academy/merch", requireAuth, async (req, res) => {
    try {
      const item = await storage.createMerchItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create merch item" });
    }
  });

  app.get("/api/academy/merch/orders", requireAuth, async (req, res) => {
    const orders = await storage.getMerchOrders(getUserId(req)!);
    res.json(orders);
  });

  app.post("/api/academy/merch/orders", requireAuth, async (req, res) => {
    try {
      const order = await storage.createMerchOrder({
        ...req.body,
        userId: getUserId(req)!,
        userName: getUserName(req) || "Student",
      });
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // ==================== PANTHER POWER ====================
  app.get("/api/academy/panther-power", requireAuth, async (req, res) => {
    try {
      const power = await storage.getOrCreatePantherPower(getUserId(req)!);
      res.json(power);
    } catch (error) {
      res.status(500).json({ error: "Failed to get panther power" });
    }
  });

  app.post("/api/academy/panther-power", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updatePantherPower(getUserId(req)!, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update panther power" });
    }
  });

  // ==================== DAILY QUESTS ====================
  app.get("/api/academy/quests", requireAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      let quests = await storage.getDailyQuests(getUserId(req)!, today);
      if (quests.length === 0) {
        const questTemplates = [
          { title: "Market Watch", description: "Check the stock market and review at least 3 stock prices", category: "entrepreneurship", featureLink: "/academy/stocks", rewardPoints: 15 },
          { title: "Community Builder", description: "Award merit points to a fellow Panther for something great they did", category: "character", featureLink: "/academy/houses", rewardPoints: 10 },
          { title: "Dream Architect", description: "Update your Dream Design with a new goal or reflection", category: "leadership", featureLink: "/academy/dreams", rewardPoints: 20 },
          { title: "Campus Investor", description: "Fund your campus project with earnings from your wallet", category: "community", featureLink: "/academy/campus", rewardPoints: 25 },
          { title: "Style Statement", description: "Update your avatar to express your personality today", category: "education", featureLink: "/academy/avatar", rewardPoints: 10 },
        ];
        const todayQuests = questTemplates.sort(() => Math.random() - 0.5).slice(0, 3);
        for (const q of todayQuests) {
          await storage.createDailyQuest({ userId: getUserId(req)!, questDate: today, title: q.title, description: q.description, category: q.category, featureLink: q.featureLink, rewardPoints: q.rewardPoints, rewardType: "power", completed: false });
        }
        quests = await storage.getDailyQuests(getUserId(req)!, today);
      }
      res.json(quests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get daily quests" });
    }
  });

  app.post("/api/academy/quests/:id/complete", requireAuth, async (req, res) => {
    try {
      const quest = await storage.completeDailyQuest(req.params.id);
      const power = await storage.getOrCreatePantherPower(getUserId(req)!);
      const categoryMap: Record<string, string> = {
        education: "educationScore",
        character: "characterScore",
        leadership: "leadershipScore",
        entrepreneurship: "entrepreneurshipScore",
        community: "communityScore",
      };
      const field = categoryMap[quest.category] || "educationScore";
      const updateData: Record<string, number> = {};
      updateData[field] = (power as any)[field] + quest.rewardPoints;
      await storage.updatePantherPower(getUserId(req)!, updateData as any);
      res.json(quest);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete quest" });
    }
  });

  // ==================== LIFE LESSONS ====================
  app.get("/api/academy/life-lessons", async (_req, res) => {
    try {
      const lessons = await storage.getAllLifeLessons();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to get life lessons" });
    }
  });

  app.get("/api/academy/life-lessons/:feature", async (req, res) => {
    try {
      const lessons = await storage.getLifeLessonsByFeature(req.params.feature);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to get life lessons" });
    }
  });

  // ==================== WIZARD PROGRESS ====================
  app.get("/api/academy/wizard/:type", requireAuth, async (req, res) => {
    try {
      const progress = await storage.getWizardProgress(getUserId(req)!, req.params.type);
      res.json(progress || { currentStep: 0, totalSteps: 0, completed: false });
    } catch (error) {
      res.status(500).json({ error: "Failed to get wizard progress" });
    }
  });

  app.post("/api/academy/wizard/:type", requireAuth, async (req, res) => {
    try {
      const { currentStep, totalSteps } = req.body;
      const progress = await storage.createOrUpdateWizardProgress(getUserId(req)!, req.params.type, currentStep, totalSteps);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update wizard progress" });
    }
  });

  app.post("/api/academy/wizard/:type/complete", requireAuth, async (req, res) => {
    try {
      const progress = await storage.completeWizard(getUserId(req)!, req.params.type);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete wizard" });
    }
  });

  // ==================== CYOA SCENARIOS ====================

  app.get("/api/academy/scenarios", async (_req, res) => {
    try {
      const scenarios = await storage.getAllScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ error: "Failed to load scenarios" });
    }
  });

  app.get("/api/academy/scenarios/:id", async (req, res) => {
    try {
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      const nodes = await storage.getScenarioNodes(req.params.id);
      res.json({ ...scenario, nodes });
    } catch (error) {
      res.status(500).json({ error: "Failed to load scenario" });
    }
  });

  app.post("/api/academy/scenarios/:id/start", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      const run = await storage.createScenarioRun({
        userId,
        scenarioId: req.params.id,
        currentNodeKey: "start",
        status: "in_progress",
        totalChoicesMade: 0,
      });
      await storage.createActivityFeedItem({
        userId,
        userName: getUserName(req) || "Student",
        activityType: "scenario_start",
        title: `Started: ${scenario.title}`,
        description: `Began the "${scenario.title}" adventure`,
        metadata: { scenarioId: scenario.id, theme: scenario.theme },
        powerCategory: scenario.rewardCategory,
        pointsEarned: 0,
      });
      res.status(201).json(run);
    } catch (error) {
      res.status(500).json({ error: "Failed to start scenario" });
    }
  });

  app.post("/api/academy/scenarios/runs/:runId/choose", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { choiceKey, choiceLabel, nodeKey } = req.body;
      const run = await storage.getScenarioRun(req.params.runId);
      if (!run || run.userId !== userId) return res.status(404).json({ error: "Run not found" });
      
      const currentNode = await storage.getScenarioNode(run.scenarioId, nodeKey);
      if (!currentNode) return res.status(404).json({ error: "Node not found" });
      
      const choices = (currentNode.choices as any[]) || [];
      const selectedChoice = choices.find((c: any) => c.key === choiceKey);
      if (!selectedChoice) return res.status(400).json({ error: "Invalid choice" });
      
      const nextNodeKey = selectedChoice.nextNodeKey;
      const nextNode = await storage.getScenarioNode(run.scenarioId, nextNodeKey);
      
      await storage.createChoiceLog({
        runId: run.id,
        userId,
        nodeKey,
        choiceKey,
        choiceLabel,
        consequence: selectedChoice.consequence || {},
      });
      
      const walletImpact = nextNode ? parseFloat(String(nextNode.walletImpact || "0")) : 0;
      const powerImpact = nextNode ? (nextNode.powerImpact || 0) : 0;
      
      if (walletImpact !== 0) {
        try {
          const wallet = await storage.getOrCreateWallet(userId);
          const newBalance = parseFloat(String(wallet.balance)) + walletImpact;
          await storage.updateWalletBalance(wallet.id, { balance: String(Math.max(0, newBalance)) });
        } catch (e) {}
      }
      
      const meritImpact = nextNode ? (nextNode.meritImpact || 0) : 0;
      if (meritImpact > 0) {
        try {
          const avatar = await storage.getAcademyAvatar(userId);
          if (avatar?.houseId) {
            await storage.createMeritEvent({
              userId,
              houseId: avatar.houseId,
              points: meritImpact,
              reason: "Adventure choice reward",
              category: "adventure",
              awardedBy: "system",
              awardedByName: "Adventure System",
            });
            await storage.updateHousePoints(avatar.houseId, meritImpact);
          }
        } catch (e) {}
      }
      
      const isEnd = nextNode?.isEnd ?? false;
      const updatedRun = await storage.updateScenarioRun(run.id, {
        currentNodeKey: nextNodeKey,
        totalChoicesMade: (run.totalChoicesMade || 0) + 1,
        totalWalletImpact: String(parseFloat(String(run.totalWalletImpact || "0")) + walletImpact),
        totalPowerEarned: (run.totalPowerEarned || 0) + powerImpact,
        status: isEnd ? "completed" : "in_progress",
        completedAt: isEnd ? new Date() : undefined,
      });
      
      if (isEnd && powerImpact > 0) {
        try {
          const scenario = await storage.getScenario(run.scenarioId);
          const category = scenario?.rewardCategory || "education";
          const power = await storage.getOrCreatePantherPower(userId);
          const categoryKey = `${category}Score` as any;
          await storage.updatePantherPower(userId, { [categoryKey]: (power as any)[categoryKey] + powerImpact });
        } catch (e) {}
      }
      
      if (isEnd) {
        await storage.createActivityFeedItem({
          userId,
          userName: getUserName(req) || "Student",
          activityType: "scenario_complete",
          title: "Completed an Adventure",
          description: `Finished with ${(run.totalChoicesMade || 0) + 1} choices made`,
          metadata: { scenarioId: run.scenarioId, runId: run.id },
          powerCategory: null,
          pointsEarned: powerImpact,
        });
      }
      
      res.json({ run: updatedRun, nextNode, isEnd });
    } catch (error) {
      res.status(500).json({ error: "Failed to process choice" });
    }
  });

  app.get("/api/academy/scenarios/runs/mine", requireAuth, async (req, res) => {
    try {
      const runs = await storage.getScenarioRunsByUser(getUserId(req)!);
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to load runs" });
    }
  });

  app.get("/api/academy/scenarios/runs/:runId", requireAuth, async (req, res) => {
    try {
      const run = await storage.getScenarioRun(req.params.runId);
      if (!run) return res.status(404).json({ error: "Run not found" });
      const logs = await storage.getChoiceLogsByRun(run.id);
      res.json({ ...run, choiceLogs: logs });
    } catch (error) {
      res.status(500).json({ error: "Failed to load run" });
    }
  });

  function moderateContent(text: string): { safe: boolean; reason?: string } {
    const normalized = text.toLowerCase().trim();
    
    const blockedPatterns = [
      /\b(damn|hell|crap|stupid|idiot|dumb|shut\s*up|hate\s+you|loser|suck|butt|fart)\b/i,
      /\b(kill|die|dead|murder|fight|punch|hit|hurt|attack|destroy|weapon|gun|knife|blood)\b/i,
      /\b(drugs?|alcohol|beer|wine|smoke|vape|cigarette|weed|marijuana)\b/i,
      /\b(sexy|nude|naked|kiss|dating|boyfriend|girlfriend|crush)\b/i,
      /[!@#$%]{3,}/,
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(normalized)) {
        return { safe: false, reason: "Your listing contains language that isn't appropriate for our learning community. Please use respectful, school-appropriate language and try again." };
      }
    }
    
    if (normalized.length < 3) {
      return { safe: false, reason: "Please provide a more descriptive name or description." };
    }
    
    return { safe: true };
  }

  // ==================== MARKETPLACE ====================

  app.get("/api/academy/marketplace", async (_req, res) => {
    try {
      const listings = await storage.getActiveListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to load marketplace" });
    }
  });

  app.get("/api/academy/marketplace/my-listings", requireAuth, async (req, res) => {
    try {
      const listings = await storage.getListingsByUser(getUserId(req)!);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to load your listings" });
    }
  });

  app.post("/api/academy/marketplace", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const { itemName, description } = req.body;
      const nameCheck = moderateContent(itemName || "");
      if (!nameCheck.safe) return res.status(400).json({ error: nameCheck.reason });
      const descCheck = moderateContent(description || "");
      if (!descCheck.safe) return res.status(400).json({ error: descCheck.reason });
      const listing = await storage.createListing({
        ...req.body,
        sellerId: userId,
        sellerName: userName,
        status: "active",
      });
      await storage.createActivityFeedItem({
        userId,
        userName,
        activityType: "marketplace_list",
        title: `Listed: ${listing.itemName}`,
        description: `Listed "${listing.itemName}" for $${listing.price}`,
        metadata: { listingId: listing.id, price: listing.price },
        powerCategory: "entrepreneurship",
        pointsEarned: 5,
      });
      try {
        const power = await storage.getOrCreatePantherPower(userId);
        await storage.updatePantherPower(userId, { entrepreneurshipScore: power.entrepreneurshipScore + 5 });
      } catch (e) {}
      res.status(201).json(listing);
    } catch (error) {
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.post("/api/academy/marketplace/:id/buy", requireAuth, async (req, res) => {
    try {
      const buyerId = getUserId(req)!;
      const buyerName = getUserName(req) || "Student";
      const listing = await storage.getActiveListings().then(ls => ls.find(l => l.id === req.params.id));
      if (!listing) return res.status(404).json({ error: "Listing not found or no longer active" });
      if (listing.sellerId === buyerId) return res.status(400).json({ error: "Cannot buy your own listing" });
      
      const buyerWallet = await storage.getOrCreateWallet(buyerId);
      const price = parseFloat(String(listing.price));
      const buyerBalance = parseFloat(String(buyerWallet.balance));
      if (buyerBalance < price) return res.status(400).json({ error: "Insufficient funds" });
      
      await storage.updateWalletBalance(buyerWallet.id, { balance: String(buyerBalance - price) });
      const buyerTx = await storage.createTransaction({ walletId: buyerWallet.id, type: "purchase", amount: String(-price), description: `Bought "${listing.itemName}" from ${listing.sellerName}`, category: "marketplace" });
      
      const sellerWallet = await storage.getOrCreateWallet(listing.sellerId);
      const sellerBalance = parseFloat(String(sellerWallet.balance));
      await storage.updateWalletBalance(sellerWallet.id, { balance: String(sellerBalance + price) });
      await storage.createTransaction({ walletId: sellerWallet.id, type: "sale", amount: String(price), description: `Sold "${listing.itemName}" to ${buyerName}`, category: "marketplace" });
      
      const newQty = listing.quantity - (req.body.quantity || 1);
      await storage.updateListing(listing.id, { quantity: Math.max(0, newQty), status: newQty <= 0 ? "sold" : "active" });
      
      const trade = await storage.createPeerTrade({
        listingId: listing.id,
        buyerId,
        buyerName,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        quantity: req.body.quantity || 1,
        totalPrice: String(price),
        status: "completed",
      });
      
      await storage.createActivityFeedItem({
        userId: buyerId,
        userName: buyerName,
        activityType: "marketplace_buy",
        title: `Purchased: ${listing.itemName}`,
        description: `Bought "${listing.itemName}" for $${price}`,
        metadata: { listingId: listing.id, tradeId: trade.id },
        powerCategory: "entrepreneurship",
        pointsEarned: 3,
      });
      
      try {
        const buyerPower = await storage.getOrCreatePantherPower(buyerId);
        await storage.updatePantherPower(buyerId, { entrepreneurshipScore: buyerPower.entrepreneurshipScore + 3 });
        const sellerPower = await storage.getOrCreatePantherPower(listing.sellerId);
        await storage.updatePantherPower(listing.sellerId, { entrepreneurshipScore: sellerPower.entrepreneurshipScore + 5 });
      } catch (e) {}
      
      res.json({ trade, message: "Purchase successful!" });
    } catch (error) {
      res.status(500).json({ error: "Failed to process purchase" });
    }
  });

  app.get("/api/academy/marketplace/trades", requireAuth, async (req, res) => {
    try {
      const trades = await storage.getTradesByUser(getUserId(req)!);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to load trades" });
    }
  });

  // ==================== ACTIVITY FEED ====================

  app.get("/api/academy/activity", async (_req, res) => {
    try {
      const feed = await storage.getActivityFeed(100);
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to load activity feed" });
    }
  });

  app.get("/api/academy/activity/:userId", async (req, res) => {
    try {
      const feed = await storage.getActivityFeedByUser(req.params.userId);
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to load user activity" });
    }
  });

  // ==================== ADMIN DASHBOARD ====================

  app.get("/api/academy/admin/metrics", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [wallets, pantherPowers, scenarioRuns, allListings, trades, allActivity, allMerit, allNotes] = await Promise.all([
        storage.getAllWallets(),
        storage.getAllPantherPower(),
        storage.getAllScenarioRuns(),
        storage.getActiveListings(),
        storage.getAllPeerTrades(),
        storage.getActivityFeed(100),
        storage.getAllMeritEvents(),
        storage.getAllAdminNotes(),
      ]);
      
      const totalStudents = wallets.length;
      const totalWalletValue = wallets.reduce((sum, w) => sum + parseFloat(String(w.balance)), 0);
      const avgWalletBalance = totalStudents > 0 ? totalWalletValue / totalStudents : 0;
      const avgPantherScore = pantherPowers.length > 0 ? pantherPowers.reduce((sum, p) => sum + p.totalScore, 0) / pantherPowers.length : 0;
      const scenarioCompletions = scenarioRuns.filter(r => r.status === "completed").length;
      const tradeCount = trades.length;
      const activeListings = allListings.length;
      const totalMeritEvents = allMerit.length;
      const unresolvedNotes = allNotes.filter(n => !n.isResolved).length;
      
      const topStudents = pantherPowers.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10).map(p => ({
        userId: p.userId,
        totalScore: p.totalScore,
        level: p.level,
        title: p.title,
        education: p.educationScore,
        character: p.characterScore,
        leadership: p.leadershipScore,
        entrepreneurship: p.entrepreneurshipScore,
        community: p.communityScore,
      }));
      
      res.json({
        totalStudents,
        totalWalletValue: totalWalletValue.toFixed(2),
        avgWalletBalance: avgWalletBalance.toFixed(2),
        avgPantherScore: Math.round(avgPantherScore),
        scenarioCompletions,
        tradeCount,
        activeListings,
        totalMeritEvents,
        unresolvedNotes,
        topStudents,
        recentActivity: allActivity.slice(0, 20),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load admin metrics" });
    }
  });

  app.get("/api/academy/admin/students", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [avatars, wallets, powers] = await Promise.all([
        storage.getAllAcademyAvatars(),
        storage.getAllWallets(),
        storage.getAllPantherPower(),
      ]);
      
      const walletMap = new Map(wallets.map(w => [w.userId, w]));
      const powerMap = new Map(powers.map(p => [p.userId, p]));
      
      const students = avatars.map(a => ({
        userId: a.userId,
        displayName: a.displayName,
        role: a.role,
        houseId: a.houseId,
        wallet: walletMap.get(a.userId) || null,
        power: powerMap.get(a.userId) || null,
      }));
      
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to load students" });
    }
  });

  app.get("/api/academy/admin/student/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [avatar, wallet, power, activity, notes, meritEvents] = await Promise.all([
        storage.getAcademyAvatar(userId),
        storage.getOrCreateWallet(userId),
        storage.getOrCreatePantherPower(userId),
        storage.getActivityFeedByUser(userId),
        storage.getAdminNotesByUser(userId),
        storage.getMeritEventsByUser(userId),
      ]);
      
      res.json({ avatar, wallet, power, activity, notes, meritEvents });
    } catch (error) {
      res.status(500).json({ error: "Failed to load student details" });
    }
  });

  app.get("/api/academy/admin/notes", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const notes = await storage.getAllAdminNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to load admin notes" });
    }
  });

  app.post("/api/academy/admin/notes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const note = await storage.createAdminNote({
        ...req.body,
        adminId: getUserId(req)!,
        adminName: getUserName(req) || "Admin",
      });
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/academy/admin/notes/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const note = await storage.updateAdminNote(req.params.id, req.body);
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.post("/api/academy/marketplace/:id/report", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const report = await storage.createContentReport({
        reporterId: userId,
        reporterName: userName,
        contentType: "marketplace_listing",
        contentId: req.params.id,
        reason: req.body.reason || "inappropriate",
        details: req.body.details || "",
        status: "pending",
      });
      res.status(201).json({ message: "Thank you for helping keep our community safe. Your report has been sent to a teacher for review.", report });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  app.get("/api/academy/admin/reports", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const reports = await storage.getContentReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to load reports" });
    }
  });

  app.patch("/api/academy/admin/reports/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const report = await storage.updateContentReport(req.params.id, req.body);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  app.post("/api/admin/student-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { studentId, learningStyle, learningPace, careerInterests, pantherPowerFocus, featureAccess, mentorPreferences, supportNotes } = req.body;
      if (!studentId) return res.status(400).json({ error: "Student ID required" });
      res.json({ success: true, message: "Student configuration saved", studentId });
    } catch (error) {
      console.error("Error saving student config:", error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ==================== CAREER EXPLORER (public) ====================

  app.get("/api/careers", async (_req, res) => {
    try {
      const fields = await db.select().from(careerFields);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  app.get("/api/career-milestones", async (_req, res) => {
    try {
      const milestones = await db.select().from(careerMilestones);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching career milestones:", error);
      res.status(500).json({ error: "Failed to fetch career milestones" });
    }
  });

  // ==================== MY PATHWAY (requireAuth) ====================

  app.get("/api/pathway-plan", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const plans = await db.select().from(pathwayPlans).where(eq(pathwayPlans.userId, userId));
      res.json(plans[0] || null);
    } catch (error) {
      console.error("Error fetching pathway plan:", error);
      res.status(500).json({ error: "Failed to fetch pathway plan" });
    }
  });

  app.post("/api/pathway-plan", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const parsed = insertPathwayPlanSchema.safeParse({ ...req.body, userId, userName });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid pathway plan data", details: parsed.error.flatten() });
      }
      const [plan] = await db.insert(pathwayPlans).values(parsed.data).returning();
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating pathway plan:", error);
      res.status(500).json({ error: "Failed to create pathway plan" });
    }
  });

  app.patch("/api/pathway-plan/:id", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [existing] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, req.params.id));
      if (!existing) return res.status(404).json({ error: "Plan not found" });
      if (existing.userId !== userId) return res.status(403).json({ error: "Not authorized" });
      const [updated] = await db.update(pathwayPlans).set({ ...req.body, updatedAt: new Date() }).where(eq(pathwayPlans.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating pathway plan:", error);
      res.status(500).json({ error: "Failed to update pathway plan" });
    }
  });

  app.post("/api/pathway-plan/:id/request-revision", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const [plan] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, req.params.id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if (plan.userId !== userId) return res.status(403).json({ error: "Not authorized" });
      if (plan.revisionsThisYear >= 3) {
        return res.status(400).json({ error: "Maximum 3 revisions per year exceeded" });
      }
      const { requestReason, newSnapshot } = req.body;
      if (!requestReason) return res.status(400).json({ error: "Request reason is required" });
      const [revision] = await db.insert(planRevisions).values({
        planId: plan.id,
        userId,
        requestedBy: userName,
        requestReason,
        previousSnapshot: plan,
        newSnapshot: newSnapshot || null,
        status: "pending",
      }).returning();
      await db.update(pathwayPlans).set({
        revisionsThisYear: plan.revisionsThisYear + 1,
        lastRevisionDate: new Date(),
        lockedForRevision: true,
        updatedAt: new Date(),
      }).where(eq(pathwayPlans.id, plan.id));
      res.status(201).json(revision);
    } catch (error) {
      console.error("Error requesting revision:", error);
      res.status(500).json({ error: "Failed to request revision" });
    }
  });

  app.get("/api/pathway-plan/:id/revisions", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [plan] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, req.params.id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if (plan.userId !== userId) return res.status(403).json({ error: "Not authorized" });
      const revisions = await db.select().from(planRevisions).where(eq(planRevisions.planId, req.params.id)).orderBy(desc(planRevisions.createdAt));
      res.json(revisions);
    } catch (error) {
      console.error("Error fetching revisions:", error);
      res.status(500).json({ error: "Failed to fetch revisions" });
    }
  });

  // ==================== MENTOR NETWORK ====================

  app.get("/api/mentors", async (_req, res) => {
    try {
      const mentors = await db.select().from(mentorProfiles).where(eq(mentorProfiles.isActive, true));
      res.json(mentors);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  app.post("/api/mentors/request", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const { mentorId, message } = req.body;
      if (!mentorId) return res.status(400).json({ error: "Mentor ID is required" });
      const [mentor] = await db.select().from(mentorProfiles).where(eq(mentorProfiles.id, mentorId));
      if (!mentor) return res.status(404).json({ error: "Mentor not found" });
      const [request] = await db.insert(mentorRequests).values({
        studentId: userId,
        studentName: userName,
        mentorId,
        mentorName: mentor.name,
        careerField: mentor.careerField,
        message: message || null,
        status: "pending",
      }).returning();
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating mentor request:", error);
      res.status(500).json({ error: "Failed to create mentor request" });
    }
  });

  app.get("/api/mentors/my-requests", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const requests = await db.select().from(mentorRequests).where(eq(mentorRequests.studentId, userId)).orderBy(desc(mentorRequests.createdAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching mentor requests:", error);
      res.status(500).json({ error: "Failed to fetch mentor requests" });
    }
  });

  // ==================== ADMIN LONGITUDINAL DASHBOARD ====================

  app.get("/api/admin/pathway-plans", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const plans = await db.select().from(pathwayPlans).orderBy(desc(pathwayPlans.createdAt));
      res.json(plans);
    } catch (error) {
      console.error("Error fetching all pathway plans:", error);
      res.status(500).json({ error: "Failed to fetch pathway plans" });
    }
  });

  app.get("/api/admin/pending-revisions", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const revisions = await db.select().from(planRevisions).where(eq(planRevisions.status, "pending")).orderBy(desc(planRevisions.createdAt));
      res.json(revisions);
    } catch (error) {
      console.error("Error fetching pending revisions:", error);
      res.status(500).json({ error: "Failed to fetch pending revisions" });
    }
  });

  app.patch("/api/admin/revisions/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Admin";
      const { notes } = req.body;
      const [updated] = await db.update(planRevisions).set({
        status: "approved",
        facultyApproved: true,
        approvedBy: userId,
        approvedByName: userName,
        reviewNotes: notes || null,
      }).where(eq(planRevisions.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Revision not found" });
      await db.update(pathwayPlans).set({ lockedForRevision: false, updatedAt: new Date() }).where(eq(pathwayPlans.id, updated.planId));
      res.json(updated);
    } catch (error) {
      console.error("Error approving revision:", error);
      res.status(500).json({ error: "Failed to approve revision" });
    }
  });

  app.patch("/api/admin/revisions/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { notes } = req.body;
      const [updated] = await db.update(planRevisions).set({
        status: "rejected",
        reviewNotes: notes || null,
      }).where(eq(planRevisions.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Revision not found" });
      await db.update(pathwayPlans).set({ lockedForRevision: false, updatedAt: new Date() }).where(eq(pathwayPlans.id, updated.planId));
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting revision:", error);
      res.status(500).json({ error: "Failed to reject revision" });
    }
  });

  app.get("/api/admin/mentor-requests", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const requests = await db.select().from(mentorRequests).orderBy(desc(mentorRequests.createdAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all mentor requests:", error);
      res.status(500).json({ error: "Failed to fetch mentor requests" });
    }
  });

  app.patch("/api/admin/mentor-requests/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required" });
      const [updated] = await db.update(mentorRequests).set({ status }).where(eq(mentorRequests.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Mentor request not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating mentor request:", error);
      res.status(500).json({ error: "Failed to update mentor request" });
    }
  });

  app.get("/api/alumni", async (_req, res) => {
    try {
      const alumni = await db.select().from(alumniProfiles).orderBy(desc(alumniProfiles.createdAt));
      res.json(alumni);
    } catch (error) {
      console.error("Error fetching alumni:", error);
      res.status(500).json({ error: "Failed to fetch alumni" });
    }
  });

  app.patch("/api/admin/alumni/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(alumniProfiles).set(req.body).where(eq(alumniProfiles.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Alumni profile not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating alumni profile:", error);
      res.status(500).json({ error: "Failed to update alumni profile" });
    }
  });

  app.get("/api/admin/longitudinal-metrics", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [studentsResult] = await db.select({ value: count() }).from(pathwayPlans);
      const [activeResult] = await db.select({ value: count() }).from(pathwayPlans).where(eq(pathwayPlans.status, "active"));
      const [milestonesResult] = await db.select({ value: count() }).from(careerMilestones);
      const [pendingResult] = await db.select({ value: count() }).from(planRevisions).where(eq(planRevisions.status, "pending"));
      const [mentorshipsResult] = await db.select({ value: count() }).from(mentorRequests).where(eq(mentorRequests.status, "approved"));
      const [alumniResult] = await db.select({ value: count() }).from(alumniProfiles);
      res.json({
        totalStudents: studentsResult?.value || 0,
        activePathways: activeResult?.value || 0,
        completedMilestones: milestonesResult?.value || 0,
        pendingRevisions: pendingResult?.value || 0,
        activeMentorships: mentorshipsResult?.value || 0,
        alumniCount: alumniResult?.value || 0,
      });
    } catch (error) {
      console.error("Error fetching longitudinal metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // ==================== STUDENT SELF-ASSESSMENT ROUTES ====================

  app.post("/api/self-assessment", requireAuth, async (req, res) => {
    try {
      const parsed = insertStudentSelfAssessmentSchema.safeParse({
        ...req.body,
        userId: getUserId(req),
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid assessment data", details: parsed.error.flatten() });
      }
      const [created] = await db.insert(studentSelfAssessments).values(parsed.data).returning();
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating self-assessment:", error);
      res.status(500).json({ error: "Failed to create self-assessment" });
    }
  });

  app.get("/api/self-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const assessments = await db.select().from(studentSelfAssessments)
        .where(eq(studentSelfAssessments.userId, userId))
        .orderBy(desc(studentSelfAssessments.createdAt))
        .limit(30);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching self-assessments:", error);
      res.status(500).json({ error: "Failed to fetch self-assessments" });
    }
  });

  app.get("/api/self-assessments/latest", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [latest] = await db.select().from(studentSelfAssessments)
        .where(eq(studentSelfAssessments.userId, userId))
        .orderBy(desc(studentSelfAssessments.createdAt))
        .limit(1);
      res.json(latest || null);
    } catch (error) {
      console.error("Error fetching latest self-assessment:", error);
      res.status(500).json({ error: "Failed to fetch latest self-assessment" });
    }
  });

  // ==================== THRIVE SCORE ROUTES ====================

  app.get("/api/thrive/score", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      let [score] = await db.select().from(thriveScores)
        .where(eq(thriveScores.userId, userId))
        .limit(1);
      if (!score) {
        const result = await computeFullThriveScore(db, userId);
        [score] = await db.select().from(thriveScores)
          .where(eq(thriveScores.userId, userId))
          .limit(1);
        if (!score) return res.json(result);
      }
      res.json(score);
    } catch (error) {
      console.error("Error fetching Thrive score:", error);
      res.status(500).json({ error: "Failed to fetch Thrive score" });
    }
  });

  app.get("/api/thrive/history", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const days = parseInt(req.query.days as string) || 90;
      const history = await getThriveHistory(db, userId, days);
      res.json(history);
    } catch (error) {
      console.error("Error fetching Thrive history:", error);
      res.status(500).json({ error: "Failed to fetch Thrive history" });
    }
  });

  app.post("/api/thrive/compute", requireAuth, async (req, res) => {
    try {
      const result = await computeFullThriveScore(db, getUserId(req)!);
      res.json(result);
    } catch (error) {
      console.error("Error computing Thrive score:", error);
      res.status(500).json({ error: "Failed to compute Thrive score" });
    }
  });

  // ==================== ADMIN THRIVE ROUTES ====================

  app.get("/api/admin/thrive/scores", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const scores = await db.select().from(thriveScores).orderBy(thriveScores.compositeScore);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching all Thrive scores:", error);
      res.status(500).json({ error: "Failed to fetch Thrive scores" });
    }
  });

  app.post("/api/admin/thrive/compute-all", requireAuth, requireAdmin, async (_req, res) => {
    try {
      await computeAllStudentScores(db);
      res.json({ success: true });
    } catch (error) {
      console.error("Error computing all Thrive scores:", error);
      res.status(500).json({ error: "Failed to compute all Thrive scores" });
    }
  });

  app.get("/api/admin/thrive/student/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [score] = await db.select().from(thriveScores)
        .where(eq(thriveScores.userId, userId))
        .limit(1);
      const history = await getThriveHistory(db, userId);
      res.json({ score: score || null, history });
    } catch (error) {
      console.error("Error fetching student Thrive data:", error);
      res.status(500).json({ error: "Failed to fetch student Thrive data" });
    }
  });

  // ==================== EARLY WARNING ROUTES ====================

  app.get("/api/thrive/flags", requireAuth, async (req, res) => {
    try {
      const flags = await getActiveFlags(db, getUserId(req)!);
      res.json(flags);
    } catch (error) {
      console.error("Error fetching early warning flags:", error);
      res.status(500).json({ error: "Failed to fetch early warning flags" });
    }
  });

  app.get("/api/admin/thrive/flags", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const flags = await getActiveFlags(db);
      res.json(flags);
    } catch (error) {
      console.error("Error fetching all early warning flags:", error);
      res.status(500).json({ error: "Failed to fetch early warning flags" });
    }
  });

  app.post("/api/admin/thrive/run-check", requireAuth, requireAdmin, async (_req, res) => {
    try {
      await runEarlyWarningCheck(db);
      res.json({ success: true });
    } catch (error) {
      console.error("Error running early warning check:", error);
      res.status(500).json({ error: "Failed to run early warning check" });
    }
  });

  app.patch("/api/admin/thrive/flags/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { notes } = req.body;
      await resolveFlag(db, req.params.id, getUserId(req)!, notes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving flag:", error);
      res.status(500).json({ error: "Failed to resolve flag" });
    }
  });

  // ==================== INTERVENTION PLAYBOOK ROUTES ====================

  app.get("/api/thrive/playbooks", requireAuth, async (_req, res) => {
    try {
      const playbooks = await db.select().from(interventionPlaybooksTable)
        .where(eq(interventionPlaybooksTable.isActive, true));
      res.json(playbooks);
    } catch (error) {
      console.error("Error fetching playbooks:", error);
      res.status(500).json({ error: "Failed to fetch playbooks" });
    }
  });

  app.get("/api/thrive/playbooks/:id", requireAuth, async (req, res) => {
    try {
      const [playbook] = await db.select().from(interventionPlaybooksTable)
        .where(eq(interventionPlaybooksTable.id, req.params.id))
        .limit(1);
      if (!playbook) return res.status(404).json({ error: "Playbook not found" });
      res.json(playbook);
    } catch (error) {
      console.error("Error fetching playbook:", error);
      res.status(500).json({ error: "Failed to fetch playbook" });
    }
  });

  // ==================== GIS ROUTES (ADMIN) ====================

  app.post("/api/admin/gis/ingest", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stateAbbr = req.body.stateAbbr || "TX";
      await runFullIngestion(db, stateAbbr);
      res.json({ success: true });
    } catch (error) {
      console.error("Error running GIS ingestion:", error);
      res.status(500).json({ error: "Failed to run GIS ingestion" });
    }
  });

  app.get("/api/admin/gis/context/:geographyKey", requireAuth, requireAdmin, async (req, res) => {
    try {
      const context = await getContextForGeography(db, req.params.geographyKey);
      if (!context) return res.status(404).json({ error: "Geography not found" });
      res.json(context);
    } catch (error) {
      console.error("Error fetching GIS context:", error);
      res.status(500).json({ error: "Failed to fetch GIS context" });
    }
  });

  app.get("/api/admin/gis/heatmap", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const data = await db.select().from(gisContextData).orderBy(desc(gisContextData.contextLoadIndex));
      res.json(data);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  });

  app.get("/api/admin/gis/resources", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const resources = await db.select().from(gisResourceOverlays)
        .where(eq(gisResourceOverlays.isActive, true));
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resource overlays:", error);
      res.status(500).json({ error: "Failed to fetch resource overlays" });
    }
  });

  // ==================== THRIVE CONFIG ROUTES (ADMIN) ====================

  app.get("/api/admin/thrive/config", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const config = await db.select().from(thriveConfig);
      res.json(config);
    } catch (error) {
      console.error("Error fetching Thrive config:", error);
      res.status(500).json({ error: "Failed to fetch Thrive config" });
    }
  });

  app.put("/api/admin/thrive/config/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { value, description } = req.body;
      const configKey = req.params.key;
      const existing = await db.select().from(thriveConfig)
        .where(eq(thriveConfig.key, configKey))
        .limit(1);
      if (existing.length > 0) {
        const [updated] = await db.update(thriveConfig)
          .set({ value, description, updatedAt: new Date() })
          .where(eq(thriveConfig.key, configKey))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db.insert(thriveConfig)
          .values({ key: configKey, value, description })
          .returning();
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error updating Thrive config:", error);
      res.status(500).json({ error: "Failed to update Thrive config" });
    }
  });

  // ==================== GAME PLATFORM API ====================

  app.post("/api/games", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const session = await storage.createGameSession({
      ...req.body,
      createdBy: userId,
      status: "waiting",
      startedAt: new Date(),
    });
    await storage.addGamePlayer({
      sessionId: session.id,
      userId,
      seat: 0,
      isCpu: false,
    });
    if (req.body.mode === 'single_vs_cpu') {
      await storage.addGamePlayer({
        sessionId: session.id,
        userId: null,
        seat: 1,
        isCpu: true,
        cpuDifficulty: req.body.difficulty || 'intermediate',
      });
      await storage.updateGameSession(session.id, { status: 'in_progress' });
    }
    const playSession = await storage.startPlaySession(userId, req.body.gameType);
    res.json({ session: await storage.getGameSession(session.id), playSessionId: playSession.id });
  });

  app.get("/api/games", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const sessions = await storage.getGameSessionsByUser(userId);
    res.json(sessions);
  });

  app.get("/api/games/active", async (req, res) => {
    const sessions = await storage.getActiveGameSessions();
    res.json(sessions);
  });

  app.get("/api/games/online-count", async (_req, res) => {
    const count = await storage.getActivePlayerCount();
    res.json({ count });
  });

  app.get("/api/games/:id", async (req, res) => {
    const session = await storage.getGameSession(req.params.id);
    if (!session) return res.status(404).json({ error: "Game not found" });
    const players = await storage.getGamePlayers(req.params.id);
    res.json({ session, players });
  });

  app.patch("/api/games/:id", requireAuth, async (req, res) => {
    const session = await storage.updateGameSession(req.params.id, req.body);
    res.json(session);
  });

  app.post("/api/games/:id/finish", requireAuth, async (req, res) => {
    const { winnerId, scores, playSessionId } = req.body;
    const session = await storage.updateGameSession(req.params.id, {
      status: 'completed',
      winnerId,
      scores,
      completedAt: new Date(),
    });

    if (playSessionId) {
      await storage.endPlaySession(playSessionId);
    }

    const players = await storage.getGamePlayers(req.params.id);
    for (const player of players) {
      if (!player.isCpu && player.userId) {
        const rating = await storage.getOrCreateRating(player.userId, session.gameType);
        const isWinner = player.userId === winnerId;
        const isDraw = !winnerId;
        const newRating = calculateElo(rating.rating, 1200, isWinner ? 1 : isDraw ? 0.5 : 0);
        await storage.updateRating(rating.id, {
          rating: newRating,
          gamesPlayed: rating.gamesPlayed + 1,
          wins: rating.wins + (isWinner ? 1 : 0),
          losses: rating.losses + (!isWinner && !isDraw ? 1 : 0),
          draws: rating.draws + (isDraw ? 1 : 0),
        });
        await storage.updateGamePlayer(player.id, {
          ratingBefore: rating.rating,
          ratingAfter: newRating,
        });
      }
    }

    res.json(session);
  });

  app.get("/api/ratings", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const ratings = await storage.getRatingsByUser(userId);
    res.json(ratings);
  });

  app.get("/api/leaderboard/:gameType", async (req, res) => {
    const leaderboard = await storage.getLeaderboard(req.params.gameType, 20);
    res.json(leaderboard);
  });

  app.post("/api/play-sessions/end", requireAuth, async (req, res) => {
    const { playSessionId } = req.body;
    if (playSessionId) {
      const session = await storage.endPlaySession(playSessionId);
      res.json(session);
    } else {
      res.status(400).json({ error: "playSessionId required" });
    }
  });

  app.get("/api/play-sessions/flagged", requireAdmin, async (req, res) => {
    const flagged = await storage.getFlaggedPlaySessions();
    res.json(flagged);
  });

  // ==================== STUDENT REFLECTIONS ====================
  app.get("/api/reflections", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const reflections = await storage.getReflectionsByUser(userId);
      res.json(reflections);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reflections" });
    }
  });

  app.post("/api/reflections", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Student";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const parsed = insertStudentReflectionSchema.safeParse({ ...req.body, userId, studentName: userName });
      if (!parsed.success) return res.status(400).json({ error: "Invalid reflection data", details: parsed.error.errors });
      const reflection = await storage.createReflection(parsed.data);
      res.json(reflection);
    } catch (error) {
      res.status(500).json({ error: "Failed to create reflection" });
    }
  });

  // ==================== ANNOUNCEMENTS ====================
  app.get("/api/announcements", async (_req, res) => {
    try {
      const items = await storage.getAnnouncements();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to get announcements" });
    }
  });

  app.post("/api/announcements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Admin";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const parsed = insertAnnouncementSchema.safeParse({ ...req.body, createdByUserId: userId, createdByName: userName });
      if (!parsed.success) return res.status(400).json({ error: "Invalid announcement data", details: parsed.error.errors });
      const announcement = await storage.createAnnouncement(parsed.data);
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.delete("/api/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAnnouncement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // ==================== ACADEMY EVENTS ====================
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getAcademyEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get events" });
    }
  });

  app.post("/api/events", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Admin";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const parsed = insertAcademyEventSchema.safeParse({ ...req.body, createdByUserId: userId, createdByName: userName });
      if (!parsed.success) return res.status(400).json({ error: "Invalid event data", details: parsed.error.errors });
      const event = await storage.createAcademyEvent(parsed.data);
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAcademyEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ==================== ATTENDANCE ====================
  app.post("/api/attendance/log", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Student";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const today = new Date().toISOString().split("T")[0];
      const data = { userId, studentName: userName, loginDate: today };
      const log = await storage.logAttendance(data);
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to log attendance" });
    }
  });

  app.get("/api/attendance", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const logs = await storage.getAttendanceLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get attendance logs" });
    }
  });

  // Risk Decision Tracking
  app.post("/api/risk-decisions", async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const decision = await storage.createRiskDecision({
        ...req.body,
        userId: user.id,
        studentName: user.name || user.username || "Unknown",
      });

      const settings = await storage.getRiskNotificationSettings();
      if (settings && decision.overrideChosen) {
        const userDecisions = await storage.getRiskDecisionsByUser(user.id);
        const overrideCount = userDecisions.filter(d => d.overrideChosen).length;

        const shouldNotify =
          (settings.notifyOnEveryOverride) ||
          (settings.notifyOnHighRisk && decision.riskLevel === "high") ||
          (overrideCount >= settings.overrideCountThreshold);

        if (shouldNotify) {
          await storage.createAdminNote({
            userId: user.id,
            adminId: "system",
            adminName: "Risk Monitor",
            category: "concern",
            note: `Risk override #${overrideCount}: ${decision.actionType} in ${decision.featureArea}. Risk level: ${decision.riskLevel}. Warning: ${decision.warningMessage}`,
          });
        }
      }

      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: "Failed to create risk decision" });
    }
  });

  app.get("/api/risk-decisions", async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const decisions = await storage.getRiskDecisionsByUser(user.id);
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk decisions" });
    }
  });

  app.get("/api/admin/risk-decisions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const decisions = await storage.getAllRiskDecisions();
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all risk decisions" });
    }
  });

  app.get("/api/admin/risk-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getRiskNotificationSettings();
      res.json(settings || {
        overrideCountThreshold: 3,
        tradeAmountThreshold: 500,
        notifyOnHighRisk: true,
        notifyOnEveryOverride: false,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk settings" });
    }
  });

  app.patch("/api/admin/risk-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updateRiskNotificationSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update risk settings" });
    }
  });

  app.patch("/api/admin/risk-decisions/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const decision = await storage.updateRiskDecision(req.params.id, req.body);
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: "Failed to update risk decision" });
    }
  });

  // ==================== AI TOOLS ROUTES ====================

  app.get("/api/ai-tools", async (req, res) => {
    const userId = getUserId(req);
    const isAdult = req.query.mode === "adult";

    const tools = await db.select().from(aiToolCatalog).where(eq(aiToolCatalog.isActive, true)).orderBy(aiToolCatalog.sortOrder);

    let unlocks: any[] = [];
    if (userId && !isAdult) {
      unlocks = await db.select().from(aiToolUnlocks).where(eq(aiToolUnlocks.userId, userId));
    }

    const unlockedToolIds = new Set(unlocks.map((u: any) => u.toolId));

    const toolsWithStatus = tools.map(tool => ({
      ...tool,
      isUnlocked: isAdult || unlockedToolIds.has(tool.id),
      moduleInfo: AI_COURSE_MODULES.find(m => m.key === tool.requiredModuleKey),
    }));

    res.json(toolsWithStatus);
  });

  app.get("/api/ai-tools/modules", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const unlocks = await db.select().from(aiToolUnlocks).where(eq(aiToolUnlocks.userId, userId));
    const unlockedModuleKeys = new Set<string>();

    const tools = await db.select().from(aiToolCatalog);
    for (const unlock of unlocks) {
      const tool = tools.find(t => t.id === unlock.toolId);
      if (tool) unlockedModuleKeys.add(tool.requiredModuleKey!);
    }

    const modulesWithStatus = AI_COURSE_MODULES.map(mod => ({
      ...mod,
      completed: unlockedModuleKeys.has(mod.key),
      unlocksTool: mod.unlocksTool,
    }));

    res.json(modulesWithStatus);
  });

  app.post("/api/ai-tools/modules/:moduleKey/complete", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { moduleKey } = req.params;

    const mod = AI_COURSE_MODULES.find(m => m.key === moduleKey);
    if (!mod) return res.status(404).json({ error: "Module not found" });

    const tool = await db.select().from(aiToolCatalog).where(eq(aiToolCatalog.requiredModuleKey, moduleKey));
    if (!tool.length) return res.status(404).json({ error: "Tool not found for module" });

    const existing = await db.select().from(aiToolUnlocks).where(and(eq(aiToolUnlocks.userId, userId), eq(aiToolUnlocks.toolId, tool[0].id)));
    if (existing.length > 0) return res.json({ message: "Already unlocked", toolId: tool[0].id });

    await db.insert(aiToolUnlocks).values({ userId, toolId: tool[0].id, unlockedVia: "module_completion" });

    res.json({ message: "Module completed! Tool unlocked.", toolId: tool[0].id, toolName: tool[0].name });
  });

  app.post("/api/ai-tools/:toolId/run", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { toolId } = req.params;
    const { prompt, context, existingContent, language, isAdult } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const tool = await db.select().from(aiToolCatalog).where(eq(aiToolCatalog.id, toolId));
    if (!tool.length) return res.status(404).json({ error: "Tool not found" });

    if (!isAdult) {
      const unlock = await db.select().from(aiToolUnlocks).where(and(eq(aiToolUnlocks.userId, userId), eq(aiToolUnlocks.toolId, toolId)));
      if (!unlock.length) return res.status(403).json({ error: "Tool is locked. Complete the required module first." });
    }

    const toolData = tool[0];
    const langInstruction = language === "es" ? "\n\nRespond entirely in Spanish." : "";

    const toolPrompts: Record<string, string> = {
      "PRESENTATION_BUILDER": `You are an expert presentation designer. Create a complete slide-by-slide presentation based on the user's request.

For each slide, provide:
- **Slide [number]: [Title]**
- **Content:** Key bullet points or text
- **Speaker Notes:** What to say when presenting this slide
- **Visual Suggestion:** What image, chart, or graphic would work well

Structure the presentation with: Title Slide, Agenda, Main Content (3-7 slides), Key Takeaways, Call to Action/Conclusion.
Keep language age-appropriate for students. Make it engaging and visual.`,

      "VIDEO_CREATOR": `You are a professional video scriptwriter. Create a complete video script/storyboard based on the user's request.

For each scene, provide:
- **Scene [number]: [Title]** (with estimated duration)
- **Visual:** What the viewer sees (camera angle, setting, actions)
- **Audio/Narration:** What is said or heard
- **Text on Screen:** Any titles, captions, or graphics
- **Transition:** How to move to the next scene

Include: Hook/Intro, Main Content, B-Roll suggestions, Outro/Call to Action.
Keep it age-appropriate and engaging for student creators.`,

      "SALES_PITCH": `You are a business coach teaching ethical sales. Create a compelling sales pitch based on the user's request.

Structure the pitch with:
- **The Hook:** Opening line that grabs attention (10 seconds)
- **The Problem:** What pain point does the product/service solve?
- **The Solution:** How does it solve the problem?
- **Social Proof:** Evidence it works (testimonials, data, examples)
- **Value Proposition:** Why this is worth it
- **Objection Handling:** Common concerns and responses
- **The Close:** Call to action
- **Follow-up Plan:** Next steps after the pitch

Emphasize ethical persuasion — never manipulate, always create genuine value.`,

      "BUSINESS_PLAN": `You are a business strategist helping create a comprehensive business plan.

Structure the plan with:
- **Executive Summary:** One-paragraph overview
- **Business Description:** What the business does, mission, vision
- **Market Analysis:** Target audience, market size, competition
- **Products/Services:** What you're selling, pricing strategy
- **Marketing Strategy:** How to reach customers
- **Operations Plan:** How the business runs day-to-day
- **Financial Projections:** Revenue estimates, costs, break-even
- **Team:** Who's involved and their roles
- **Timeline:** Key milestones for the first year
- **Risk Assessment:** Potential challenges and mitigation strategies

Make it practical and educational. Use realistic numbers and examples.`,

      "RESEARCH": `You are a research librarian and academic coach. Help organize and structure research.

Provide:
- **Research Question:** Refined version of the user's question
- **Key Topics to Investigate:** 5-7 subtopics to explore
- **Outline:** Structured outline for a research paper/project
- **Key Points:** Important facts and information to include
- **Sources to Find:** Types of sources to look for (books, articles, data)
- **Citation Format:** How to cite sources properly (MLA/APA simplified)
- **Research Tips:** How to evaluate sources for reliability

Teach good research habits. Encourage critical thinking about sources.`,

      "LIFE_PLANNER": `You are a life coach helping create a personal development plan.

Structure the plan with:
- **Vision Statement:** Where do you want to be in 5-10 years?
- **Core Values:** What matters most to you?
- **Goal Categories:** Academic, Career, Personal, Health, Relationships, Financial
- **SMART Goals:** Specific, Measurable, Achievable, Relevant, Time-bound goals for each category
- **Action Steps:** Weekly/monthly actions for each goal
- **Milestones:** Checkpoints to celebrate progress
- **Potential Obstacles:** Challenges you might face and how to overcome them
- **Support System:** Who can help you on this journey?
- **Daily Habits:** Small habits that build toward big goals

Be encouraging and realistic. Help students dream big while planning practically.`,

      "PROJECT_PLANNER": `You are a project management expert. Help break down a project into manageable pieces.

Structure the plan with:
- **Project Overview:** What are we building/creating?
- **Goals & Success Criteria:** How will we know it's done well?
- **Task Breakdown:** All tasks organized by phase (Planning, Execution, Review)
- **Timeline:** When each task should be completed (use a week-by-week format)
- **Resources Needed:** Materials, tools, people, budget
- **Task Dependencies:** What must be done before other things can start
- **Risk Assessment:** What could go wrong and backup plans
- **Team Roles:** Who does what (if group project)
- **Check-in Points:** When to review progress
- **Deliverables:** What the final output looks like

Make it practical and student-friendly. Include templates they can fill in.`,

      "DOCUMENT_WRITER": `You are a skilled writing coach. Help create well-structured documents.

Based on the document type requested, provide:
- **Title & Header**
- **Introduction:** Hook, thesis/purpose, roadmap
- **Body Sections:** Well-organized paragraphs with topic sentences, evidence, analysis
- **Transitions:** Smooth connections between sections
- **Conclusion:** Summary, significance, call to action
- **Writing Tips:** Specific suggestions for improvement

Adapt style to the document type (essay, report, letter, article, speech).
Teach good writing habits along the way. Never write the entire thing for them — provide structure, examples, and guidance.`,

      "RESUME_BUILDER": `You are a career counselor. Help create professional documents.

For resumes, provide:
- **Contact Information** section format
- **Professional Summary:** 2-3 sentence overview
- **Education:** How to format school, GPA, relevant coursework
- **Experience:** How to write bullet points with action verbs and results
- **Skills:** Technical and soft skills relevant to the field
- **Activities & Leadership:** Clubs, volunteer work, sports
- **Portfolio Section:** How to showcase projects and achievements

For cover letters, provide structure and examples.
Teach professional communication. Help students present their best selves authentically.`,

      "BRAINSTORM": `You are a creative thinking facilitator. Help generate and organize ideas.

Provide:
- **Brain Dump:** List every idea related to the topic (aim for 20+)
- **Categories:** Group ideas into themes
- **Top 5 Ideas:** Most promising ideas with brief explanations of why
- **Mind Map:** Central topic with branching ideas and sub-ideas (in text format)
- **SCAMPER Analysis:** Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse
- **"What If" Questions:** 5 creative "what if" scenarios to push thinking further
- **Next Steps:** How to develop the best ideas further

Be wildly creative. No bad ideas in brainstorming! Encourage unusual connections.`,
    };

    const toolSystemPrompt = toolPrompts[toolData.promptTemplate] || toolPrompts["BRAINSTORM"];

    const systemMsg = `${toolSystemPrompt}

TOOL: ${toolData.name}
${context ? `ADDITIONAL CONTEXT: ${context}` : ""}
${existingContent ? `EXISTING CONTENT TO IMPROVE/CONTINUE:\n${existingContent}` : ""}
${langInstruction}

Be thorough, practical, and age-appropriate. Format your response with clear headings and structure using Markdown.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      await streamAIResponse({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt },
        ],
        maxTokens: 3000,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate content" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in AI tool run:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate content" })}\n\n`);
      res.end();
    }
  });

  app.get("/api/ai-tools/projects", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const projects = await db.select().from(aiToolProjects).where(eq(aiToolProjects.userId, userId)).orderBy(desc(aiToolProjects.createdAt));
    res.json(projects);
  });

  app.post("/api/ai-tools/projects", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { toolId, title, prompt, content, outputType, status } = req.body;

    if (!toolId || !title || !prompt) return res.status(400).json({ error: "toolId, title, and prompt are required" });

    const [project] = await db.insert(aiToolProjects).values({
      userId,
      toolId,
      title,
      prompt,
      content: content || "",
      outputType: outputType || "markdown",
      status: status || "draft",
    }).returning();

    res.json(project);
  });

  app.patch("/api/ai-tools/projects/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { id } = req.params;
    const { title, content, status } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status) updateData.status = status;

    const [project] = await db.update(aiToolProjects).set(updateData).where(and(eq(aiToolProjects.id, id), eq(aiToolProjects.userId, userId))).returning();

    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.delete("/api/ai-tools/projects/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    await db.delete(aiToolProjects).where(and(eq(aiToolProjects.id, req.params.id), eq(aiToolProjects.userId, userId)));
    res.json({ success: true });
  });

  // ==================== ADMIN COURSE CREATOR (LMS) ROUTES ====================

  app.get("/api/admin/courses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const courses = await storage.getAdminCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/admin/courses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const course = await storage.getAdminCourse(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      const modules = await storage.getCourseModules(req.params.id);
      const modulesWithLessons = await Promise.all(
        modules.map(async (mod) => {
          const lessons = await storage.getCourseLessons(mod.id);
          return { ...mod, lessons };
        })
      );
      const enrollments = await storage.getCourseEnrollments(req.params.id);
      res.json({ ...course, modules: modulesWithLessons, enrollments });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/admin/courses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertAcademyCourseSchema.parse(req.body);
      const course = await storage.createAdminCourse(parsed);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create course" });
    }
  });

  app.patch("/api/admin/courses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const existing = await storage.getAdminCourse(req.params.id);
      if (!existing) return res.status(404).json({ error: "Course not found" });
      const course = await storage.updateAdminCourse(req.params.id, req.body);
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/admin/courses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAdminCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  app.post("/api/admin/courses/:courseId/modules", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCourseModuleSchema.parse({ ...req.body, courseId: req.params.courseId });
      const mod = await storage.createCourseModule(parsed);
      res.json(mod);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create module" });
    }
  });

  app.patch("/api/admin/courses/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const mod = await storage.updateCourseModule(req.params.id, req.body);
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/admin/courses/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCourseModule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  app.post("/api/admin/courses/modules/:moduleId/lessons", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCourseLessonSchema.parse({ ...req.body, moduleId: req.params.moduleId });
      const lesson = await storage.createCourseLesson(parsed);
      res.json(lesson);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create lesson" });
    }
  });

  app.patch("/api/admin/courses/lessons/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const lesson = await storage.updateCourseLesson(req.params.id, req.body);
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/admin/courses/lessons/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCourseLesson(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.post("/api/admin/courses/:courseId/enroll", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = req.headers["x-replit-user-name"] as string || "Student";
      const enrollment = await storage.createCourseEnrollment({
        courseId: req.params.courseId,
        userId,
        userName,
        status: "active",
        progressPercent: 0,
      });
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to enroll" });
    }
  });

  app.get("/api/courses/my-enrollments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const enrollments = await storage.getEnrollmentsByUser(userId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  return httpServer;
}
