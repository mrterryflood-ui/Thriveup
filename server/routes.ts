import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await storage.seedData();

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

  app.post("/api/modules/:moduleId/quiz/submit", async (req, res) => {
    const { answers } = req.body;
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Answers object is required" });
    }
    const questions = await storage.getQuizByModule(req.params.moduleId);
    const progress = await storage.getOrCreateProgress();

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

  app.post("/api/lessons/:lessonId/complete", async (req, res) => {
    const lesson = await storage.getLesson(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const progress = await storage.getOrCreateProgress();
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

  app.get("/api/progress", async (_req, res) => {
    const progress = await storage.getOrCreateProgress();
    res.json(progress);
  });

  app.get("/api/dashboard", async (_req, res) => {
    const progress = await storage.getOrCreateProgress();
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

  app.get("/api/achievements", async (_req, res) => {
    const progress = await storage.getOrCreateProgress();
    const allBadges = await storage.getBadges();
    const earnedBadgesList = await storage.getEarnedBadges(progress.id);

    res.json({
      allBadges,
      earnedBadges: earnedBadgesList,
      totalPoints: progress.totalPoints,
    });
  });

  app.get("/api/badges", async (_req, res) => {
    const allBadges = await storage.getBadges();
    res.json(allBadges);
  });

  return httpServer;
}
