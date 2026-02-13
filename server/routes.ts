import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCurriculumDocumentSchema } from "@shared/schema";
import OpenAI from "openai";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

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

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerObjectStorageRoutes(app);
  await storage.seedData();

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

  app.get("/api/badges", async (_req, res) => {
    const allBadges = await storage.getBadges();
    res.json(allBadges);
  });

  app.post("/api/ai-companion/chat", async (req, res) => {
    const { message, gradeLevel, subject, lessonContext } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }

    if (!gradeLevel || typeof gradeLevel !== "string") {
      return res.status(400).json({ error: "Grade level is required and must be a string" });
    }

    const systemPrompt = `You are a warm, caring learning companion for a ${gradeLevel} student. Your name is "Spark" and you help children learn.

RULES YOU MUST FOLLOW:
1. NEVER give direct answers to quiz questions, homework, or tests. Instead, guide the student to find the answer themselves through hints and questions.
2. Adjust your language complexity to match the grade level:
   - 3-5: Clear explanations, real-world connections, encourage curiosity
   - 6-8: Relatable analogies, respect their growing independence, validate their thinking
   - 9-12: Direct and honest, treat them as emerging adults, discuss nuance and complexity
3. Always be empathetic. If a student expresses frustration, acknowledge it warmly before helping.
4. Promote a growth mindset: "You're not bad at this - you're just learning!"
5. Never discuss anything inappropriate, violent, or harmful.
6. If asked about something outside education, gently redirect: "That's an interesting question! Let's focus on what we're learning today."
7. Celebrate every small win and effort.
8. If the student mentions feeling sad, anxious, or upset, be supportive and suggest they talk to a trusted adult.
${subject ? `\nThe student is studying: ${subject}` : ""}
${lessonContext ? `Current lesson context: ${lessonContext}` : ""}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content: content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in AI chat endpoint:", error);
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
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate classroom setup suggestions for "${name}" (Grades ${gradeBand})${subjectFocus && subjectFocus !== "all" ? ` focusing on ${subjectFocus}` : ""}.` },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
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

  return httpServer;
}
