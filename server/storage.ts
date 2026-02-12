import {
  levels, modules, lessons, quizQuestions, badges, subjects,
  studentProgress, completedLessons, quizAttempts, earnedBadges, curriculumDocuments,
  type Level, type Module, type Lesson, type QuizQuestion, type Badge, type Subject,
  type StudentProgress, type CompletedLesson, type QuizAttempt, type EarnedBadge,
  type CurriculumDocument, type InsertCurriculumDocument,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getLevels(): Promise<Level[]>;
  getLevel(id: number): Promise<Level | undefined>;
  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  getSubjectsByGradeBand(gradeBand: string): Promise<Subject[]>;
  getModulesByLevel(levelId: number): Promise<Module[]>;
  getModulesBySubject(subjectId: string): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getQuizByModule(moduleId: string): Promise<QuizQuestion[]>;
  getBadges(): Promise<Badge[]>;
  getBadge(id: string): Promise<Badge | undefined>;
  getOrCreateProgress(userId?: string, name?: string): Promise<StudentProgress>;
  updateProgress(id: string, data: Partial<StudentProgress>): Promise<StudentProgress>;
  completeLesson(progressId: string, lessonId: string): Promise<CompletedLesson>;
  getCompletedLessons(progressId: string): Promise<CompletedLesson[]>;
  submitQuiz(progressId: string, moduleId: string, score: number, total: number, passed: boolean): Promise<QuizAttempt>;
  getQuizAttempts(progressId: string): Promise<QuizAttempt[]>;
  earnBadge(progressId: string, badgeId: string): Promise<EarnedBadge>;
  getEarnedBadges(progressId: string): Promise<Array<EarnedBadge & { badge: Badge }>>;
  getCurriculumDocuments(): Promise<CurriculumDocument[]>;
  getCurriculumDocumentsByModule(moduleId: string): Promise<CurriculumDocument[]>;
  getCurriculumDocumentsByLevel(levelId: number): Promise<CurriculumDocument[]>;
  getCurriculumDocument(id: string): Promise<CurriculumDocument | undefined>;
  createCurriculumDocument(doc: InsertCurriculumDocument): Promise<CurriculumDocument>;
  updateCurriculumDocument(id: string, doc: Partial<InsertCurriculumDocument>): Promise<CurriculumDocument>;
  deleteCurriculumDocument(id: string): Promise<void>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getLevels(): Promise<Level[]> {
    return db.select().from(levels).orderBy(levels.id);
  }

  async getLevel(id: number): Promise<Level | undefined> {
    const [level] = await db.select().from(levels).where(eq(levels.id, id));
    return level;
  }

  async getSubjects(): Promise<Subject[]> {
    return db.select().from(subjects).orderBy(subjects.sortOrder);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getSubjectsByGradeBand(gradeBand: string): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.gradeBand, gradeBand)).orderBy(subjects.sortOrder);
  }

  async getModulesByLevel(levelId: number): Promise<Module[]> {
    return db.select().from(modules).where(eq(modules.levelId, levelId)).orderBy(modules.moduleNumber);
  }

  async getModulesBySubject(subjectId: string): Promise<Module[]> {
    return db.select().from(modules).where(eq(modules.subjectId, subjectId)).orderBy(modules.moduleNumber);
  }

  async getModule(id: string): Promise<Module | undefined> {
    const [mod] = await db.select().from(modules).where(eq(modules.id, id));
    return mod;
  }

  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(lessons.lessonNumber);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getQuizByModule(moduleId: string): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.moduleId, moduleId));
  }

  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getOrCreateProgress(userId?: string, name?: string): Promise<StudentProgress> {
    if (userId) {
      const existing = await db.select().from(studentProgress).where(eq(studentProgress.userId, userId)).limit(1);
      if (existing.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        if (existing[0].lastActiveDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const newStreak = existing[0].lastActiveDate === yesterday ? existing[0].streakDays + 1 : 1;
          const longestStreak = Math.max(existing[0].longestStreak, newStreak);
          await db.update(studentProgress).set({ lastActiveDate: today, streakDays: newStreak, longestStreak }).where(eq(studentProgress.id, existing[0].id));
          return { ...existing[0], lastActiveDate: today, streakDays: newStreak, longestStreak };
        }
        return existing[0];
      }
      const [created] = await db.insert(studentProgress).values({
        userId,
        studentName: name || "Explorer",
        currentLevel: 1,
        currentModuleId: "level_1_module_1",
        totalPoints: 0,
        lessonsCompleted: 0,
        quizzesCompleted: 0,
        averageScore: 0,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split("T")[0],
        longestStreak: 1,
      }).returning();
      return created;
    }
    const existing = await db.select().from(studentProgress).limit(1);
    if (existing.length > 0) return existing[0];

    const [created] = await db.insert(studentProgress).values({
      studentName: name || "Explorer",
      currentLevel: 1,
      currentModuleId: "level_1_module_1",
      totalPoints: 0,
      lessonsCompleted: 0,
      quizzesCompleted: 0,
      averageScore: 0,
      streakDays: 0,
      longestStreak: 0,
    }).returning();
    return created;
  }

  async updateProgress(id: string, data: Partial<StudentProgress>): Promise<StudentProgress> {
    const [updated] = await db.update(studentProgress).set(data).where(eq(studentProgress.id, id)).returning();
    return updated;
  }

  async completeLesson(progressId: string, lessonId: string): Promise<CompletedLesson> {
    const existing = await db.select().from(completedLessons)
      .where(and(eq(completedLessons.progressId, progressId), eq(completedLessons.lessonId, lessonId)));
    if (existing.length > 0) return existing[0];

    const [created] = await db.insert(completedLessons).values({
      progressId,
      lessonId,
    }).returning();
    return created;
  }

  async getCompletedLessons(progressId: string): Promise<CompletedLesson[]> {
    return db.select().from(completedLessons).where(eq(completedLessons.progressId, progressId));
  }

  async submitQuiz(progressId: string, moduleId: string, score: number, total: number, passed: boolean): Promise<QuizAttempt> {
    const [created] = await db.insert(quizAttempts).values({
      progressId,
      moduleId,
      score,
      totalQuestions: total,
      passed,
    }).returning();
    return created;
  }

  async getQuizAttempts(progressId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.progressId, progressId)).orderBy(desc(quizAttempts.completedAt));
  }

  async earnBadge(progressId: string, badgeId: string): Promise<EarnedBadge> {
    const existing = await db.select().from(earnedBadges)
      .where(and(eq(earnedBadges.progressId, progressId), eq(earnedBadges.badgeId, badgeId)));
    if (existing.length > 0) return existing[0];

    const [created] = await db.insert(earnedBadges).values({
      progressId,
      badgeId,
    }).returning();
    return created;
  }

  async getEarnedBadges(progressId: string): Promise<Array<EarnedBadge & { badge: Badge }>> {
    const earned = await db.select().from(earnedBadges)
      .where(eq(earnedBadges.progressId, progressId))
      .orderBy(desc(earnedBadges.earnedAt));

    const result: Array<EarnedBadge & { badge: Badge }> = [];
    for (const eb of earned) {
      const [badge] = await db.select().from(badges).where(eq(badges.id, eb.badgeId));
      if (badge) {
        result.push({ ...eb, badge });
      }
    }
    return result;
  }

  async getCurriculumDocuments(): Promise<CurriculumDocument[]> {
    return db.select().from(curriculumDocuments).orderBy(desc(curriculumDocuments.createdAt));
  }

  async getCurriculumDocumentsByModule(moduleId: string): Promise<CurriculumDocument[]> {
    return db.select().from(curriculumDocuments).where(eq(curriculumDocuments.moduleId, moduleId));
  }

  async getCurriculumDocumentsByLevel(levelId: number): Promise<CurriculumDocument[]> {
    return db.select().from(curriculumDocuments).where(eq(curriculumDocuments.levelId, levelId));
  }

  async getCurriculumDocument(id: string): Promise<CurriculumDocument | undefined> {
    const [doc] = await db.select().from(curriculumDocuments).where(eq(curriculumDocuments.id, id));
    return doc;
  }

  async createCurriculumDocument(doc: InsertCurriculumDocument): Promise<CurriculumDocument> {
    const [created] = await db.insert(curriculumDocuments).values(doc).returning();
    return created;
  }

  async updateCurriculumDocument(id: string, doc: Partial<InsertCurriculumDocument>): Promise<CurriculumDocument> {
    const [updated] = await db.update(curriculumDocuments).set({ ...doc, updatedAt: new Date() }).where(eq(curriculumDocuments.id, id)).returning();
    return updated;
  }

  async deleteCurriculumDocument(id: string): Promise<void> {
    await db.delete(curriculumDocuments).where(eq(curriculumDocuments.id, id));
  }

  async seedData(): Promise<void> {
    const { seedAILevels } = await import("./seed-ai");
    const { seedSubjects } = await import("./seed-subjects");

    const existingLevels = await db.select().from(levels).limit(1);
    if (existingLevels.length === 0) {
      await seedAILevels(db);
    }

    const existingSubjects = await db.select().from(subjects).limit(1);
    if (existingSubjects.length === 0) {
      await seedSubjects(db);
    }

  }
}

export const storage = new DatabaseStorage();
