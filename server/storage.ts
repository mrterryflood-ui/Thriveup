import {
  levels, modules, lessons, quizQuestions, badges, subjects,
  studentProgress, completedLessons, quizAttempts, earnedBadges, curriculumDocuments,
  lessonComments, lessonReactions, studyTips,
  classrooms, classroomMembers, certificates,
  type Level, type Module, type Lesson, type QuizQuestion, type Badge, type Subject,
  type StudentProgress, type CompletedLesson, type QuizAttempt, type EarnedBadge,
  type CurriculumDocument, type InsertCurriculumDocument,
  documentAttachments, type DocumentAttachment, type InsertDocumentAttachment,
  type LessonComment, type LessonReaction, type StudyTip,
  type Classroom, type ClassroomMember, type Certificate,
  academyAvatars, academyHouses, academyMeritEvents, academyWallets, academyTransactions,
  academyStocks, academyPortfolios, academyCommunityPortfolio,
  academyCampusProjects, academyCompetitions, academyCompetitionEntries,
  academyDreamProfiles, academyMerchItems, academyMerchOrders,
  type AcademyAvatar, type InsertAcademyAvatar,
  type AcademyHouse, type InsertAcademyHouse,
  type AcademyMeritEvent, type InsertAcademyMeritEvent,
  type AcademyWallet, type InsertAcademyWallet,
  type AcademyTransaction, type InsertAcademyTransaction,
  type AcademyStock, type InsertAcademyStock,
  type AcademyPortfolio, type InsertAcademyPortfolio,
  type AcademyCommunityPortfolioItem,
  type AcademyCampusProject, type InsertAcademyCampusProject,
  type AcademyCompetition, type InsertAcademyCompetition,
  type AcademyCompetitionEntry, type InsertAcademyCompetitionEntry,
  type AcademyDreamProfile, type InsertAcademyDreamProfile,
  type AcademyMerchItem, type InsertAcademyMerchItem,
  type AcademyMerchOrder, type InsertAcademyMerchOrder,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
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
  getCommentsByLesson(lessonId: string): Promise<LessonComment[]>;
  addComment(lessonId: string, userId: string | undefined, userName: string, content: string): Promise<LessonComment>;
  getReactionsByLesson(lessonId: string): Promise<Record<string, number>>;
  addReaction(lessonId: string, userId: string | undefined, reactionType: string): Promise<void>;
  getStudyTipsByModule(moduleId: string): Promise<StudyTip[]>;
  addStudyTip(moduleId: string, userId: string | undefined, userName: string, content: string): Promise<StudyTip>;
  upvoteStudyTip(tipId: string): Promise<StudyTip>;

  createClassroom(teacherUserId: string, teacherName: string, name: string, gradeBand: string): Promise<Classroom>;
  getClassroomsByTeacher(teacherUserId: string): Promise<Classroom[]>;
  getClassroomByInviteCode(inviteCode: string): Promise<Classroom | undefined>;
  getClassroom(id: string): Promise<Classroom | undefined>;
  joinClassroom(classroomId: string, userId: string, studentName: string): Promise<ClassroomMember>;
  getClassroomMembers(classroomId: string): Promise<ClassroomMember[]>;
  getStudentClassrooms(userId: string): Promise<Classroom[]>;

  issueCertificate(userId: string, userName: string, levelId: number, levelTitle: string): Promise<Certificate>;
  getCertificatesByUser(userId: string): Promise<Certificate[]>;
  getCertificate(id: string): Promise<Certificate | undefined>;

  getProgressByUserId(userId: string): Promise<StudentProgress | undefined>;

  getAttachmentsByDocument(documentId: string): Promise<DocumentAttachment[]>;
  addAttachment(attachment: InsertDocumentAttachment): Promise<DocumentAttachment>;
  deleteAttachment(id: string): Promise<void>;

  getAcademyAvatar(userId: string): Promise<AcademyAvatar | undefined>;
  createAcademyAvatar(avatar: InsertAcademyAvatar): Promise<AcademyAvatar>;
  updateAcademyAvatar(id: string, data: Partial<InsertAcademyAvatar>): Promise<AcademyAvatar>;
  getAllAcademyAvatars(): Promise<AcademyAvatar[]>;

  getAcademyHouses(): Promise<AcademyHouse[]>;
  getAcademyHouse(id: string): Promise<AcademyHouse | undefined>;
  createAcademyHouse(house: InsertAcademyHouse): Promise<AcademyHouse>;
  updateHousePoints(houseId: string, points: number): Promise<AcademyHouse>;

  getMeritEventsByUser(userId: string): Promise<AcademyMeritEvent[]>;
  getMeritEventsByHouse(houseId: string): Promise<AcademyMeritEvent[]>;
  createMeritEvent(event: InsertAcademyMeritEvent): Promise<AcademyMeritEvent>;
  getAllMeritEvents(): Promise<AcademyMeritEvent[]>;

  getOrCreateWallet(userId: string): Promise<AcademyWallet>;
  updateWalletBalance(id: string, data: Partial<AcademyWallet>): Promise<AcademyWallet>;
  getTransactionsByWallet(walletId: string): Promise<AcademyTransaction[]>;
  createTransaction(transaction: InsertAcademyTransaction): Promise<AcademyTransaction>;

  getAllStocks(): Promise<AcademyStock[]>;
  getStock(id: string): Promise<AcademyStock | undefined>;
  updateStock(id: string, data: Partial<AcademyStock>): Promise<AcademyStock>;
  createStock(stock: InsertAcademyStock): Promise<AcademyStock>;

  getPortfolioByUser(userId: string): Promise<AcademyPortfolio[]>;
  createOrUpdatePortfolio(userId: string, stockId: string, shares: number, avgPrice: string): Promise<AcademyPortfolio>;
  getCommunityPortfolio(): Promise<AcademyCommunityPortfolioItem[]>;

  getCampusProject(userId: string): Promise<AcademyCampusProject | undefined>;
  createCampusProject(project: InsertAcademyCampusProject): Promise<AcademyCampusProject>;
  updateCampusProject(id: string, data: Partial<InsertAcademyCampusProject>): Promise<AcademyCampusProject>;

  getAllCompetitions(): Promise<AcademyCompetition[]>;
  getCompetition(id: string): Promise<AcademyCompetition | undefined>;
  createCompetition(comp: InsertAcademyCompetition): Promise<AcademyCompetition>;
  getCompetitionEntries(competitionId: string): Promise<AcademyCompetitionEntry[]>;
  createCompetitionEntry(entry: InsertAcademyCompetitionEntry): Promise<AcademyCompetitionEntry>;
  updateCompetitionEntry(id: string, data: Partial<InsertAcademyCompetitionEntry>): Promise<AcademyCompetitionEntry>;

  getDreamProfile(userId: string): Promise<AcademyDreamProfile | undefined>;
  createOrUpdateDreamProfile(userId: string, data: Partial<InsertAcademyDreamProfile>): Promise<AcademyDreamProfile>;

  getAllMerchItems(): Promise<AcademyMerchItem[]>;
  createMerchItem(item: InsertAcademyMerchItem): Promise<AcademyMerchItem>;
  getMerchOrders(userId?: string): Promise<AcademyMerchOrder[]>;
  createMerchOrder(order: InsertAcademyMerchOrder): Promise<AcademyMerchOrder>;
  updateMerchOrder(id: string, data: Partial<InsertAcademyMerchOrder>): Promise<AcademyMerchOrder>;

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

  async getCommentsByLesson(lessonId: string): Promise<LessonComment[]> {
    return db.select().from(lessonComments).where(eq(lessonComments.lessonId, lessonId)).orderBy(desc(lessonComments.createdAt));
  }

  async addComment(lessonId: string, userId: string | undefined, userName: string, content: string): Promise<LessonComment> {
    const [created] = await db.insert(lessonComments).values({ lessonId, userId, userName, content }).returning();
    return created;
  }

  async getReactionsByLesson(lessonId: string): Promise<Record<string, number>> {
    const reactions = await db.select().from(lessonReactions).where(eq(lessonReactions.lessonId, lessonId));
    const counts: Record<string, number> = { helpful: 0, inspiring: 0, challenging: 0, fun: 0 };
    for (const r of reactions) {
      counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
    }
    return counts;
  }

  async addReaction(lessonId: string, userId: string | undefined, reactionType: string): Promise<void> {
    if (userId) {
      const existing = await db.select().from(lessonReactions)
        .where(and(eq(lessonReactions.lessonId, lessonId), eq(lessonReactions.userId, userId), eq(lessonReactions.reactionType, reactionType)));
      if (existing.length > 0) {
        await db.delete(lessonReactions).where(eq(lessonReactions.id, existing[0].id));
        return;
      }
    }
    await db.insert(lessonReactions).values({ lessonId, userId, reactionType });
  }

  async getStudyTipsByModule(moduleId: string): Promise<StudyTip[]> {
    return db.select().from(studyTips).where(eq(studyTips.moduleId, moduleId)).orderBy(desc(studyTips.upvotes));
  }

  async addStudyTip(moduleId: string, userId: string | undefined, userName: string, content: string): Promise<StudyTip> {
    const [created] = await db.insert(studyTips).values({ moduleId, userId, userName, content }).returning();
    return created;
  }

  async upvoteStudyTip(tipId: string): Promise<StudyTip> {
    const [updated] = await db.update(studyTips).set({ upvotes: sql`${studyTips.upvotes} + 1` }).where(eq(studyTips.id, tipId)).returning();
    return updated;
  }

  async createClassroom(teacherUserId: string, teacherName: string, name: string, gradeBand: string): Promise<Classroom> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [created] = await db.insert(classrooms).values({ teacherUserId, teacherName, name, inviteCode, gradeBand }).returning();
    return created;
  }

  async getClassroomsByTeacher(teacherUserId: string): Promise<Classroom[]> {
    return db.select().from(classrooms).where(eq(classrooms.teacherUserId, teacherUserId)).orderBy(desc(classrooms.createdAt));
  }

  async getClassroomByInviteCode(inviteCode: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.inviteCode, inviteCode));
    return classroom;
  }

  async getClassroom(id: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, id));
    return classroom;
  }

  async joinClassroom(classroomId: string, userId: string, studentName: string): Promise<ClassroomMember> {
    const existing = await db.select().from(classroomMembers)
      .where(and(eq(classroomMembers.classroomId, classroomId), eq(classroomMembers.userId, userId)));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(classroomMembers).values({ classroomId, userId, studentName }).returning();
    return created;
  }

  async getClassroomMembers(classroomId: string): Promise<ClassroomMember[]> {
    return db.select().from(classroomMembers).where(eq(classroomMembers.classroomId, classroomId)).orderBy(classroomMembers.studentName);
  }

  async getStudentClassrooms(userId: string): Promise<Classroom[]> {
    const memberships = await db.select().from(classroomMembers).where(eq(classroomMembers.userId, userId));
    const result: Classroom[] = [];
    for (const m of memberships) {
      const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, m.classroomId));
      if (classroom) result.push(classroom);
    }
    return result;
  }

  async issueCertificate(userId: string, userName: string, levelId: number, levelTitle: string): Promise<Certificate> {
    const existing = await db.select().from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.levelId, levelId)));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(certificates).values({ userId, userName, levelId, levelTitle }).returning();
    return created;
  }

  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt));
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [cert] = await db.select().from(certificates).where(eq(certificates.id, id));
    return cert;
  }

  async getProgressByUserId(userId: string): Promise<StudentProgress | undefined> {
    const [progress] = await db.select().from(studentProgress).where(eq(studentProgress.userId, userId));
    return progress;
  }

  async getAttachmentsByDocument(documentId: string): Promise<DocumentAttachment[]> {
    return db.select().from(documentAttachments).where(eq(documentAttachments.documentId, documentId)).orderBy(desc(documentAttachments.uploadedAt));
  }

  async addAttachment(attachment: InsertDocumentAttachment): Promise<DocumentAttachment> {
    const [result] = await db.insert(documentAttachments).values(attachment).returning();
    return result;
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(documentAttachments).where(eq(documentAttachments.id, id));
  }

  async getAcademyAvatar(userId: string): Promise<AcademyAvatar | undefined> {
    const [avatar] = await db.select().from(academyAvatars).where(eq(academyAvatars.userId, userId));
    return avatar;
  }

  async createAcademyAvatar(avatar: InsertAcademyAvatar): Promise<AcademyAvatar> {
    const [created] = await db.insert(academyAvatars).values(avatar).returning();
    return created;
  }

  async updateAcademyAvatar(id: string, data: Partial<InsertAcademyAvatar>): Promise<AcademyAvatar> {
    const [updated] = await db.update(academyAvatars).set(data).where(eq(academyAvatars.id, id)).returning();
    return updated;
  }

  async getAllAcademyAvatars(): Promise<AcademyAvatar[]> {
    return db.select().from(academyAvatars);
  }

  async getAcademyHouses(): Promise<AcademyHouse[]> {
    return db.select().from(academyHouses).orderBy(desc(academyHouses.totalPoints));
  }

  async getAcademyHouse(id: string): Promise<AcademyHouse | undefined> {
    const [house] = await db.select().from(academyHouses).where(eq(academyHouses.id, id));
    return house;
  }

  async createAcademyHouse(house: InsertAcademyHouse): Promise<AcademyHouse> {
    const [created] = await db.insert(academyHouses).values(house).returning();
    return created;
  }

  async updateHousePoints(houseId: string, points: number): Promise<AcademyHouse> {
    const [updated] = await db.update(academyHouses).set({
      totalPoints: sql`${academyHouses.totalPoints} + ${points}`,
    }).where(eq(academyHouses.id, houseId)).returning();
    return updated;
  }

  async getMeritEventsByUser(userId: string): Promise<AcademyMeritEvent[]> {
    return db.select().from(academyMeritEvents).where(eq(academyMeritEvents.userId, userId)).orderBy(desc(academyMeritEvents.createdAt));
  }

  async getMeritEventsByHouse(houseId: string): Promise<AcademyMeritEvent[]> {
    return db.select().from(academyMeritEvents).where(eq(academyMeritEvents.houseId, houseId)).orderBy(desc(academyMeritEvents.createdAt));
  }

  async createMeritEvent(event: InsertAcademyMeritEvent): Promise<AcademyMeritEvent> {
    const [created] = await db.insert(academyMeritEvents).values(event).returning();
    return created;
  }

  async getAllMeritEvents(): Promise<AcademyMeritEvent[]> {
    return db.select().from(academyMeritEvents).orderBy(desc(academyMeritEvents.createdAt));
  }

  async getOrCreateWallet(userId: string): Promise<AcademyWallet> {
    const [existing] = await db.select().from(academyWallets).where(eq(academyWallets.userId, userId));
    if (existing) return existing;
    const [created] = await db.insert(academyWallets).values({ userId, balance: "1000.00" }).returning();
    return created;
  }

  async updateWalletBalance(id: string, data: Partial<AcademyWallet>): Promise<AcademyWallet> {
    const [updated] = await db.update(academyWallets).set(data).where(eq(academyWallets.id, id)).returning();
    return updated;
  }

  async getTransactionsByWallet(walletId: string): Promise<AcademyTransaction[]> {
    return db.select().from(academyTransactions).where(eq(academyTransactions.walletId, walletId)).orderBy(desc(academyTransactions.createdAt));
  }

  async createTransaction(transaction: InsertAcademyTransaction): Promise<AcademyTransaction> {
    const [created] = await db.insert(academyTransactions).values(transaction).returning();
    return created;
  }

  async getAllStocks(): Promise<AcademyStock[]> {
    return db.select().from(academyStocks);
  }

  async getStock(id: string): Promise<AcademyStock | undefined> {
    const [stock] = await db.select().from(academyStocks).where(eq(academyStocks.id, id));
    return stock;
  }

  async updateStock(id: string, data: Partial<AcademyStock>): Promise<AcademyStock> {
    const [updated] = await db.update(academyStocks).set(data).where(eq(academyStocks.id, id)).returning();
    return updated;
  }

  async createStock(stock: InsertAcademyStock): Promise<AcademyStock> {
    const [created] = await db.insert(academyStocks).values(stock).returning();
    return created;
  }

  async getPortfolioByUser(userId: string): Promise<AcademyPortfolio[]> {
    return db.select().from(academyPortfolios).where(eq(academyPortfolios.userId, userId));
  }

  async createOrUpdatePortfolio(userId: string, stockId: string, shares: number, avgPrice: string): Promise<AcademyPortfolio> {
    const [existing] = await db.select().from(academyPortfolios).where(
      and(eq(academyPortfolios.userId, userId), eq(academyPortfolios.stockId, stockId))
    );
    if (existing) {
      const [updated] = await db.update(academyPortfolios).set({ shares, avgBuyPrice: avgPrice }).where(eq(academyPortfolios.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(academyPortfolios).values({ userId, stockId, shares, avgBuyPrice: avgPrice }).returning();
    return created;
  }

  async getCommunityPortfolio(): Promise<AcademyCommunityPortfolioItem[]> {
    return db.select().from(academyCommunityPortfolio);
  }

  async getCampusProject(userId: string): Promise<AcademyCampusProject | undefined> {
    const [project] = await db.select().from(academyCampusProjects).where(eq(academyCampusProjects.userId, userId));
    return project;
  }

  async createCampusProject(project: InsertAcademyCampusProject): Promise<AcademyCampusProject> {
    const [created] = await db.insert(academyCampusProjects).values(project).returning();
    return created;
  }

  async updateCampusProject(id: string, data: Partial<InsertAcademyCampusProject>): Promise<AcademyCampusProject> {
    const [updated] = await db.update(academyCampusProjects).set(data).where(eq(academyCampusProjects.id, id)).returning();
    return updated;
  }

  async getAllCompetitions(): Promise<AcademyCompetition[]> {
    return db.select().from(academyCompetitions).orderBy(desc(academyCompetitions.createdAt));
  }

  async getCompetition(id: string): Promise<AcademyCompetition | undefined> {
    const [comp] = await db.select().from(academyCompetitions).where(eq(academyCompetitions.id, id));
    return comp;
  }

  async createCompetition(comp: InsertAcademyCompetition): Promise<AcademyCompetition> {
    const [created] = await db.insert(academyCompetitions).values(comp).returning();
    return created;
  }

  async getCompetitionEntries(competitionId: string): Promise<AcademyCompetitionEntry[]> {
    return db.select().from(academyCompetitionEntries).where(eq(academyCompetitionEntries.competitionId, competitionId)).orderBy(desc(academyCompetitionEntries.score));
  }

  async createCompetitionEntry(entry: InsertAcademyCompetitionEntry): Promise<AcademyCompetitionEntry> {
    const [created] = await db.insert(academyCompetitionEntries).values(entry).returning();
    return created;
  }

  async updateCompetitionEntry(id: string, data: Partial<InsertAcademyCompetitionEntry>): Promise<AcademyCompetitionEntry> {
    const [updated] = await db.update(academyCompetitionEntries).set(data).where(eq(academyCompetitionEntries.id, id)).returning();
    return updated;
  }

  async getDreamProfile(userId: string): Promise<AcademyDreamProfile | undefined> {
    const [profile] = await db.select().from(academyDreamProfiles).where(eq(academyDreamProfiles.userId, userId));
    return profile;
  }

  async createOrUpdateDreamProfile(userId: string, data: Partial<InsertAcademyDreamProfile>): Promise<AcademyDreamProfile> {
    const [existing] = await db.select().from(academyDreamProfiles).where(eq(academyDreamProfiles.userId, userId));
    if (existing) {
      const [updated] = await db.update(academyDreamProfiles).set({ ...data, updatedAt: new Date() }).where(eq(academyDreamProfiles.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(academyDreamProfiles).values({ userId, ...data }).returning();
    return created;
  }

  async getAllMerchItems(): Promise<AcademyMerchItem[]> {
    return db.select().from(academyMerchItems);
  }

  async createMerchItem(item: InsertAcademyMerchItem): Promise<AcademyMerchItem> {
    const [created] = await db.insert(academyMerchItems).values(item).returning();
    return created;
  }

  async getMerchOrders(userId?: string): Promise<AcademyMerchOrder[]> {
    if (userId) {
      return db.select().from(academyMerchOrders).where(eq(academyMerchOrders.userId, userId)).orderBy(desc(academyMerchOrders.createdAt));
    }
    return db.select().from(academyMerchOrders).orderBy(desc(academyMerchOrders.createdAt));
  }

  async createMerchOrder(order: InsertAcademyMerchOrder): Promise<AcademyMerchOrder> {
    const [created] = await db.insert(academyMerchOrders).values(order).returning();
    return created;
  }

  async updateMerchOrder(id: string, data: Partial<InsertAcademyMerchOrder>): Promise<AcademyMerchOrder> {
    const [updated] = await db.update(academyMerchOrders).set(data).where(eq(academyMerchOrders.id, id)).returning();
    return updated;
  }

  async seedData(): Promise<void> {
    const { seedAILevels } = await import("./seed-ai");
    const { seedSubjects } = await import("./seed-subjects");
    const { seedAdditionalLessons } = await import("./seed-lessons");
    const { seedCurriculumDocuments } = await import("./seed-curriculum-docs");

    const existingLevels = await db.select().from(levels).limit(1);
    if (existingLevels.length === 0) {
      await seedAILevels(db);
    }

    const existingSubjects = await db.select().from(subjects).limit(1);
    if (existingSubjects.length === 0) {
      await seedSubjects(db);
    }

    const existingLessons = await db.select().from(lessons);
    if (existingLessons.length < 50) {
      await seedAdditionalLessons(db);
    }

    const existingDocs = await db.select().from(curriculumDocuments).limit(1);
    if (existingDocs.length < 50) {
      await seedCurriculumDocuments(db);
    }

    const existingHouses = await db.select().from(academyHouses).limit(1);
    if (existingHouses.length === 0) {
      await db.insert(academyHouses).values([
        { name: "Phoenix Rising", color: "#DC2626", motto: "Rise from the ashes", iconName: "Flame" },
        { name: "Golden Eagles", color: "#D97706", motto: "Soar above the rest", iconName: "Bird" },
        { name: "Ocean Tide", color: "#0891B2", motto: "Flow together, unstoppable", iconName: "Waves" },
        { name: "Emerald Forest", color: "#059669", motto: "Grow strong, grow together", iconName: "TreePine" },
      ]);
    }

    const stockSeedData = [
      { symbol: "LEARN", name: "EduTech Corp", sector: "Education", currentPrice: "42.50", previousPrice: "42.50", changePercent: "0.00", priceHistory: [] },
      { symbol: "DREAM", name: "Dream Builders Inc", sector: "Real Estate", currentPrice: "67.00", previousPrice: "67.00", changePercent: "0.00", priceHistory: [] },
      { symbol: "SPARK", name: "Spark Innovation", sector: "Technology", currentPrice: "89.25", previousPrice: "89.25", changePercent: "0.00", priceHistory: [] },
      { symbol: "UNITE", name: "Unity Community Fund", sector: "Finance", currentPrice: "31.75", previousPrice: "31.75", changePercent: "0.00", priceHistory: [] },
      { symbol: "GROW", name: "GreenGrow Farms", sector: "Agriculture", currentPrice: "18.50", previousPrice: "18.50", changePercent: "0.00", priceHistory: [] },
      { symbol: "CARE", name: "CarePlus Health", sector: "Healthcare", currentPrice: "55.00", previousPrice: "55.00", changePercent: "0.00", priceHistory: [] },
      { symbol: "BUILD", name: "BuildRight Construction", sector: "Construction", currentPrice: "43.25", previousPrice: "43.25", changePercent: "0.00", priceHistory: [] },
      { symbol: "CREATE", name: "Creative Arts Studio", sector: "Entertainment", currentPrice: "29.00", previousPrice: "29.00", changePercent: "0.00", priceHistory: [] },
      { symbol: "MOVE", name: "MoveForward Transport", sector: "Transportation", currentPrice: "36.50", previousPrice: "36.50", changePercent: "0.00", priceHistory: [] },
      { symbol: "THRIVE", name: "Thrive Wellness", sector: "Wellness", currentPrice: "22.75", previousPrice: "22.75", changePercent: "0.00", priceHistory: [] },
    ];
    for (const stock of stockSeedData) {
      await db.insert(academyStocks).values(stock).onConflictDoNothing();
    }
  }
}

export const storage = new DatabaseStorage();
