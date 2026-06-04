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
  academyPantherPower, academyDailyQuests, academyLifeLessons, academyWizardProgress,
  academyScenarios, academyScenarioNodes, academyScenarioRuns, academyChoiceLogs,
  academyMarketListings, academyPeerTrades, academyActivityFeed, academyAdminNotes, academyContentReports,
  type AcademyPantherPower, type InsertAcademyPantherPower,
  type AcademyDailyQuest, type InsertAcademyDailyQuest,
  type AcademyLifeLesson, type InsertAcademyLifeLesson,
  type AcademyWizardProgress, type InsertAcademyWizardProgress,
  type AcademyScenario, type InsertAcademyScenario,
  type AcademyScenarioNode, type InsertAcademyScenarioNode,
  type AcademyScenarioRun, type InsertAcademyScenarioRun,
  type AcademyChoiceLog, type InsertAcademyChoiceLog,
  type AcademyMarketListing, type InsertAcademyMarketListing,
  type AcademyPeerTrade, type InsertAcademyPeerTrade,
  type AcademyActivityFeedItem, type InsertAcademyActivityFeedItem,
  type AcademyAdminNote, type InsertAcademyAdminNote,
  type AcademyContentReport, type InsertAcademyContentReport,
  careerFields, careerMilestones,
  interventionPlaybooks, mentorProfiles,
  gameSessions, gamePlayers, playerRatings, playSessions,
  type GameSession, type InsertGameSession,
  type GamePlayer, type InsertGamePlayer,
  type PlayerRating, type InsertPlayerRating,
  type PlaySession, type InsertPlaySession,
  studentReflections, announcements, academyEvents, attendanceLogs,
  type StudentReflection, type InsertStudentReflection,
  type Announcement, type InsertAnnouncement,
  type AcademyEvent, type InsertAcademyEvent,
  type AttendanceLog, type InsertAttendanceLog,
  outcomeTracking,
  riskDecisions, riskNotificationSettings,
  type InsertRiskDecision, type RiskDecision,
  type InsertRiskNotificationSettings, type RiskNotificationSettings,
  academyCourses, courseModules, courseLessons, courseEnrollments,
  type AcademyCourse, type InsertAcademyCourse,
  type CourseModule, type InsertCourseModule,
  type CourseLesson, type InsertCourseLesson,
  type CourseEnrollment, type InsertCourseEnrollment,
  onboardingJourneyTemplates, onboardingPhases, onboardingMilestones,
  onboardingJourneys, onboardingMilestoneCompletions, onboardingBaselineSnapshots,
  type OnboardingJourneyTemplate, type InsertOnboardingJourneyTemplate,
  type OnboardingPhase, type InsertOnboardingPhase,
  type OnboardingMilestone, type InsertOnboardingMilestone,
  type OnboardingJourney, type InsertOnboardingJourney,
  type OnboardingMilestoneCompletion, type InsertOnboardingMilestoneCompletion,
  type OnboardingBaselineSnapshot, type InsertOnboardingBaselineSnapshot,
  programDesigns,
  type ProgramDesign, type InsertProgramDesign,
  cqiCycles, cqiGaps, cqiInterventions, cqiFidelityDefinitions, cqiFidelityObservations, cqiOutcomes, cqiCyclePhases,
  type CqiCycle, type InsertCqiCycle,
  type CqiGap, type InsertCqiGap,
  type CqiIntervention, type InsertCqiIntervention,
  type CqiFidelityDefinition, type InsertCqiFidelityDefinition,
  type CqiFidelityObservation, type InsertCqiFidelityObservation,
  type CqiOutcome, type InsertCqiOutcome,
  type CqiCyclePhase, type InsertCqiCyclePhase,
} from "@shared/schema";
import { eq, and, desc, sql, inArray, isNull, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Neon Postgres auto-suspends after inactivity; the first query after wake-up
// can fail with XX000 "The endpoint has been disabled". Retry up to 3 times
// with exponential back-off so callers never see a spurious 500.
pool.on("error", (err) => {
  // Swallow idle-client errors — pool handles reconnection automatically.
  if ((err as any).code !== "XX000") console.error("[DB pool] idle client error:", err.message);
});

const _poolQuery = pool.query.bind(pool);
(pool as any).query = async function (...args: unknown[]) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await (_poolQuery as (...a: unknown[]) => Promise<unknown>)(...args);
    } catch (err: any) {
      const isNeonWakeUp = err?.code === "XX000" || (err?.message ?? "").includes("endpoint has been disabled");
      if (isNeonWakeUp && attempt < 2) {
        const delay = 1000 * (attempt + 1);
        console.warn(`[DB] Neon wake-up XX000, retrying in ${delay}ms (attempt ${attempt + 1}/3)...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
};

export const db = drizzle(pool);

// Warm up the connection pool on startup so the first user request never hits
// the Neon cold-start window.
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("[DB] Connection pool warmed up.");
  } catch {
    console.warn("[DB] Warm-up query failed — will retry on first user request.");
  }
})();

export interface IStorage {
  getUser(userId: string): Promise<{ id: string; role: string } | undefined>;
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

  getOrCreatePantherPower(userId: string): Promise<AcademyPantherPower>;
  updatePantherPower(userId: string, data: Partial<InsertAcademyPantherPower>): Promise<AcademyPantherPower>;

  getDailyQuests(userId: string, date: string): Promise<AcademyDailyQuest[]>;
  createDailyQuest(quest: InsertAcademyDailyQuest): Promise<AcademyDailyQuest>;
  completeDailyQuest(id: string): Promise<AcademyDailyQuest>;

  getAllLifeLessons(): Promise<AcademyLifeLesson[]>;
  getLifeLessonsByFeature(featureArea: string): Promise<AcademyLifeLesson[]>;
  createLifeLesson(lesson: InsertAcademyLifeLesson): Promise<AcademyLifeLesson>;

  getWizardProgress(userId: string, wizardType: string): Promise<AcademyWizardProgress | undefined>;
  createOrUpdateWizardProgress(userId: string, wizardType: string, currentStep: number, totalSteps: number): Promise<AcademyWizardProgress>;
  completeWizard(userId: string, wizardType: string): Promise<AcademyWizardProgress>;

  // Scenarios
  getAllScenarios(): Promise<AcademyScenario[]>;
  getScenario(id: string): Promise<AcademyScenario | undefined>;
  createScenario(scenario: InsertAcademyScenario): Promise<AcademyScenario>;
  getScenarioNodes(scenarioId: string): Promise<AcademyScenarioNode[]>;
  getScenarioNode(scenarioId: string, nodeKey: string): Promise<AcademyScenarioNode | undefined>;
  createScenarioNode(node: InsertAcademyScenarioNode): Promise<AcademyScenarioNode>;
  
  // Scenario Runs
  getScenarioRun(id: string): Promise<AcademyScenarioRun | undefined>;
  getScenarioRunsByUser(userId: string): Promise<AcademyScenarioRun[]>;
  createScenarioRun(run: InsertAcademyScenarioRun): Promise<AcademyScenarioRun>;
  updateScenarioRun(id: string, data: Partial<AcademyScenarioRun>): Promise<AcademyScenarioRun>;
  
  // Choice Logs
  createChoiceLog(log: InsertAcademyChoiceLog): Promise<AcademyChoiceLog>;
  getChoiceLogsByRun(runId: string): Promise<AcademyChoiceLog[]>;
  
  // Marketplace
  getActiveListings(): Promise<AcademyMarketListing[]>;
  getListingsByUser(userId: string): Promise<AcademyMarketListing[]>;
  createListing(listing: InsertAcademyMarketListing): Promise<AcademyMarketListing>;
  updateListing(id: string, data: Partial<AcademyMarketListing>): Promise<AcademyMarketListing>;
  
  // Peer Trades
  createPeerTrade(trade: InsertAcademyPeerTrade): Promise<AcademyPeerTrade>;
  getTradesByUser(userId: string): Promise<AcademyPeerTrade[]>;
  
  // Activity Feed
  getActivityFeed(limit?: number): Promise<AcademyActivityFeedItem[]>;
  getActivityFeedByUser(userId: string): Promise<AcademyActivityFeedItem[]>;
  createActivityFeedItem(item: InsertAcademyActivityFeedItem): Promise<AcademyActivityFeedItem>;
  
  // Admin
  getAllAdminNotes(): Promise<AcademyAdminNote[]>;
  getAdminNotesByUser(userId: string): Promise<AcademyAdminNote[]>;
  createAdminNote(note: InsertAcademyAdminNote): Promise<AcademyAdminNote>;
  updateAdminNote(id: string, data: Partial<AcademyAdminNote>): Promise<AcademyAdminNote>;
  getAllWallets(): Promise<AcademyWallet[]>;
  getAllPantherPower(): Promise<AcademyPantherPower[]>;
  getAllScenarioRuns(): Promise<AcademyScenarioRun[]>;
  getAllPeerTrades(): Promise<AcademyPeerTrade[]>;
  getContentReports(): Promise<AcademyContentReport[]>;
  createContentReport(report: InsertAcademyContentReport): Promise<AcademyContentReport>;
  updateContentReport(id: string, data: Partial<AcademyContentReport>): Promise<AcademyContentReport>;

  // Game Platform
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  updateGameSession(id: string, data: Partial<GameSession>): Promise<GameSession>;
  getGameSessionsByUser(userId: string): Promise<GameSession[]>;
  getActiveGameSessions(): Promise<GameSession[]>;

  addGamePlayer(player: InsertGamePlayer): Promise<GamePlayer>;
  getGamePlayers(sessionId: string): Promise<GamePlayer[]>;
  updateGamePlayer(id: string, data: Partial<GamePlayer>): Promise<GamePlayer>;

  getOrCreateRating(userId: string, gameType: string): Promise<PlayerRating>;
  updateRating(id: string, data: Partial<PlayerRating>): Promise<PlayerRating>;
  getRatingsByUser(userId: string): Promise<PlayerRating[]>;
  getLeaderboard(gameType: string, limit?: number): Promise<PlayerRating[]>;

  startPlaySession(userId: string, gameType: string): Promise<PlaySession>;
  endPlaySession(id: string): Promise<PlaySession>;
  getFlaggedPlaySessions(): Promise<PlaySession[]>;
  getActivePlayerCount(): Promise<number>;

  getReflectionsByUser(userId: string): Promise<StudentReflection[]>;
  createReflection(data: InsertStudentReflection): Promise<StudentReflection>;

  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;

  getAcademyEvents(): Promise<AcademyEvent[]>;
  createAcademyEvent(data: InsertAcademyEvent): Promise<AcademyEvent>;
  deleteAcademyEvent(id: string): Promise<void>;

  getAttendanceLogs(): Promise<AttendanceLog[]>;
  logAttendance(data: InsertAttendanceLog): Promise<AttendanceLog>;

  // Risk Decision Tracking
  createRiskDecision(data: InsertRiskDecision): Promise<RiskDecision>;
  getRiskDecisionsByUser(userId: string): Promise<RiskDecision[]>;
  getAllRiskDecisions(): Promise<RiskDecision[]>;
  updateRiskDecision(id: string, data: Partial<RiskDecision>): Promise<RiskDecision>;
  getRiskNotificationSettings(): Promise<RiskNotificationSettings | undefined>;
  updateRiskNotificationSettings(data: Partial<InsertRiskNotificationSettings>): Promise<RiskNotificationSettings>;

  // Admin Course Creator (LMS)
  getAdminCourses(): Promise<AcademyCourse[]>;
  getAdminCourse(id: string): Promise<AcademyCourse | undefined>;
  createAdminCourse(data: InsertAcademyCourse): Promise<AcademyCourse>;
  updateAdminCourse(id: string, data: Partial<InsertAcademyCourse>): Promise<AcademyCourse>;
  deleteAdminCourse(id: string): Promise<void>;
  getCourseModules(courseId: string): Promise<CourseModule[]>;
  getCourseModule(id: string): Promise<CourseModule | undefined>;
  createCourseModule(data: InsertCourseModule): Promise<CourseModule>;
  updateCourseModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule>;
  deleteCourseModule(id: string): Promise<void>;
  getCourseLessons(moduleId: string): Promise<CourseLesson[]>;
  getCourseLesson(id: string): Promise<CourseLesson | undefined>;
  createCourseLesson(data: InsertCourseLesson): Promise<CourseLesson>;
  updateCourseLesson(id: string, data: Partial<InsertCourseLesson>): Promise<CourseLesson>;
  deleteCourseLesson(id: string): Promise<void>;
  getCourseEnrollments(courseId: string): Promise<CourseEnrollment[]>;
  createCourseEnrollment(data: InsertCourseEnrollment): Promise<CourseEnrollment>;
  updateCourseEnrollment(id: string, data: Partial<CourseEnrollment>): Promise<CourseEnrollment>;
  getEnrollmentsByUser(userId: string): Promise<CourseEnrollment[]>;

  // Onboarding Journey
  getOnboardingTemplates(): Promise<OnboardingJourneyTemplate[]>;
  getOnboardingTemplate(id: string): Promise<OnboardingJourneyTemplate | undefined>;
  createOnboardingTemplate(data: InsertOnboardingJourneyTemplate): Promise<OnboardingJourneyTemplate>;
  getOnboardingPhases(templateId: string): Promise<OnboardingPhase[]>;
  createOnboardingPhase(data: InsertOnboardingPhase): Promise<OnboardingPhase>;
  getOnboardingMilestones(templateId: string): Promise<OnboardingMilestone[]>;
  getOnboardingMilestonesByPhase(phaseId: string): Promise<OnboardingMilestone[]>;
  createOnboardingMilestone(data: InsertOnboardingMilestone): Promise<OnboardingMilestone>;
  getOnboardingJourney(id: string): Promise<OnboardingJourney | undefined>;
  getOnboardingJourneyByParticipant(participantId: string): Promise<OnboardingJourney | undefined>;
  getAllOnboardingJourneys(): Promise<OnboardingJourney[]>;
  createOnboardingJourney(data: InsertOnboardingJourney): Promise<OnboardingJourney>;
  updateOnboardingJourney(id: string, data: Partial<OnboardingJourney>): Promise<OnboardingJourney>;
  getMilestoneCompletions(journeyId: string): Promise<OnboardingMilestoneCompletion[]>;
  createMilestoneCompletion(data: InsertOnboardingMilestoneCompletion): Promise<OnboardingMilestoneCompletion>;
  getBaselineSnapshots(journeyId: string): Promise<OnboardingBaselineSnapshot[]>;
  createBaselineSnapshot(data: InsertOnboardingBaselineSnapshot): Promise<OnboardingBaselineSnapshot>;
  // CQI Engine
  getCqiCycles(): Promise<CqiCycle[]>;
  getCqiCycle(id: string): Promise<CqiCycle | undefined>;
  createCqiCycle(data: InsertCqiCycle): Promise<CqiCycle>;
  updateCqiCycle(id: string, data: Partial<InsertCqiCycle>): Promise<CqiCycle>;
  deleteCqiCycle(id: string): Promise<void>;

  getCqiGaps(cycleId: string): Promise<CqiGap[]>;
  createCqiGap(data: InsertCqiGap): Promise<CqiGap>;
  updateCqiGap(id: string, data: Partial<InsertCqiGap>): Promise<CqiGap>;
  deleteCqiGap(id: string): Promise<void>;

  getCqiInterventions(cycleId: string): Promise<CqiIntervention[]>;
  createCqiIntervention(data: InsertCqiIntervention): Promise<CqiIntervention>;
  updateCqiIntervention(id: string, data: Partial<InsertCqiIntervention>): Promise<CqiIntervention>;
  deleteCqiIntervention(id: string): Promise<void>;

  getCqiFidelityDefinitions(cycleId?: string): Promise<CqiFidelityDefinition[]>;
  createCqiFidelityDefinition(data: InsertCqiFidelityDefinition): Promise<CqiFidelityDefinition>;
  updateCqiFidelityDefinition(id: string, data: Partial<InsertCqiFidelityDefinition>): Promise<CqiFidelityDefinition>;
  deleteCqiFidelityDefinition(id: string): Promise<void>;

  getCqiFidelityObservations(definitionId: string): Promise<CqiFidelityObservation[]>;
  createCqiFidelityObservation(data: InsertCqiFidelityObservation): Promise<CqiFidelityObservation>;
  updateCqiFidelityObservation(id: string, data: Partial<InsertCqiFidelityObservation>): Promise<CqiFidelityObservation>;
  deleteCqiFidelityObservation(id: string): Promise<void>;

  getCqiCyclePhases(cycleId: string): Promise<CqiCyclePhase[]>;
  createCqiCyclePhase(data: InsertCqiCyclePhase): Promise<CqiCyclePhase>;
  updateCqiCyclePhase(id: string, data: Partial<InsertCqiCyclePhase>): Promise<CqiCyclePhase>;

  getCqiOutcomes(cycleId: string): Promise<CqiOutcome[]>;
  createCqiOutcome(data: InsertCqiOutcome): Promise<CqiOutcome>;
  updateCqiOutcome(id: string, data: Partial<InsertCqiOutcome>): Promise<CqiOutcome>;
  deleteCqiOutcome(id: string): Promise<void>;

  getProgramDesigns(userId?: string): Promise<ProgramDesign[]>;
  getProgramDesign(id: string): Promise<ProgramDesign | undefined>;
  createProgramDesign(data: InsertProgramDesign): Promise<ProgramDesign>;
  updateProgramDesign(id: string, data: Partial<InsertProgramDesign>): Promise<ProgramDesign>;
  deleteProgramDesign(id: string): Promise<void>;

  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(userId: string): Promise<{ id: string; role: string } | undefined> {
    const [avatar] = await db.select({ id: academyAvatars.userId, role: academyAvatars.role })
      .from(academyAvatars)
      .where(eq(academyAvatars.userId, userId));
    return avatar || undefined;
  }

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
    throw new Error("userId is required to get or create progress");
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

  async getOrCreatePantherPower(userId: string): Promise<AcademyPantherPower> {
    const [existing] = await db.select().from(academyPantherPower).where(eq(academyPantherPower.userId, userId));
    if (existing) return existing;
    const [created] = await db.insert(academyPantherPower).values({ userId }).returning();
    return created;
  }

  async updatePantherPower(userId: string, data: Partial<InsertAcademyPantherPower>): Promise<AcademyPantherPower> {
    const power = await this.getOrCreatePantherPower(userId);
    const totalScore = (data.educationScore ?? power.educationScore) + 
      (data.characterScore ?? power.characterScore) + 
      (data.leadershipScore ?? power.leadershipScore) + 
      (data.entrepreneurshipScore ?? power.entrepreneurshipScore) + 
      (data.communityScore ?? power.communityScore);
    const level = Math.floor(totalScore / 100) + 1;
    const titles = ["Young Panther", "Rising Panther", "Bold Panther", "Elite Panther", "Panther Leader", "Panther Champion", "Panther Legend"];
    const title = titles[Math.min(level - 1, titles.length - 1)];
    const [updated] = await db.update(academyPantherPower).set({ ...data, totalScore, level, title, updatedAt: new Date() }).where(eq(academyPantherPower.id, power.id)).returning();
    return updated;
  }

  async getDailyQuests(userId: string, date: string): Promise<AcademyDailyQuest[]> {
    return db.select().from(academyDailyQuests).where(and(eq(academyDailyQuests.userId, userId), eq(academyDailyQuests.questDate, date)));
  }

  async createDailyQuest(quest: InsertAcademyDailyQuest): Promise<AcademyDailyQuest> {
    const [created] = await db.insert(academyDailyQuests).values(quest).returning();
    return created;
  }

  async completeDailyQuest(id: string): Promise<AcademyDailyQuest> {
    const [updated] = await db.update(academyDailyQuests).set({ completed: true, completedAt: new Date() }).where(eq(academyDailyQuests.id, id)).returning();
    return updated;
  }

  async getAllLifeLessons(): Promise<AcademyLifeLesson[]> {
    return db.select().from(academyLifeLessons).orderBy(academyLifeLessons.sortOrder);
  }

  async getLifeLessonsByFeature(featureArea: string): Promise<AcademyLifeLesson[]> {
    return db.select().from(academyLifeLessons).where(eq(academyLifeLessons.featureArea, featureArea)).orderBy(academyLifeLessons.sortOrder);
  }

  async createLifeLesson(lesson: InsertAcademyLifeLesson): Promise<AcademyLifeLesson> {
    const [created] = await db.insert(academyLifeLessons).values(lesson).returning();
    return created;
  }

  async getWizardProgress(userId: string, wizardType: string): Promise<AcademyWizardProgress | undefined> {
    const [progress] = await db.select().from(academyWizardProgress).where(and(eq(academyWizardProgress.userId, userId), eq(academyWizardProgress.wizardType, wizardType)));
    return progress;
  }

  async createOrUpdateWizardProgress(userId: string, wizardType: string, currentStep: number, totalSteps: number): Promise<AcademyWizardProgress> {
    const existing = await this.getWizardProgress(userId, wizardType);
    if (existing) {
      const [updated] = await db.update(academyWizardProgress).set({ currentStep, totalSteps }).where(eq(academyWizardProgress.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(academyWizardProgress).values({ userId, wizardType, currentStep, totalSteps }).returning();
    return created;
  }

  async completeWizard(userId: string, wizardType: string): Promise<AcademyWizardProgress> {
    const existing = await this.getWizardProgress(userId, wizardType);
    if (existing) {
      const [updated] = await db.update(academyWizardProgress).set({ completed: true, completedAt: new Date(), currentStep: existing.totalSteps }).where(eq(academyWizardProgress.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(academyWizardProgress).values({ userId, wizardType, currentStep: 1, totalSteps: 1, completed: true, completedAt: new Date() }).returning();
    return created;
  }

  // ==================== SCENARIOS ====================
  
  async getAllScenarios(): Promise<AcademyScenario[]> {
    return db.select().from(academyScenarios).where(eq(academyScenarios.isActive, true)).orderBy(academyScenarios.createdAt);
  }

  async getScenario(id: string): Promise<AcademyScenario | undefined> {
    const [s] = await db.select().from(academyScenarios).where(eq(academyScenarios.id, id));
    return s;
  }

  async createScenario(scenario: InsertAcademyScenario): Promise<AcademyScenario> {
    const [created] = await db.insert(academyScenarios).values(scenario).returning();
    return created;
  }

  async getScenarioNodes(scenarioId: string): Promise<AcademyScenarioNode[]> {
    return db.select().from(academyScenarioNodes).where(eq(academyScenarioNodes.scenarioId, scenarioId)).orderBy(academyScenarioNodes.sortOrder);
  }

  async getScenarioNode(scenarioId: string, nodeKey: string): Promise<AcademyScenarioNode | undefined> {
    const [node] = await db.select().from(academyScenarioNodes).where(and(eq(academyScenarioNodes.scenarioId, scenarioId), eq(academyScenarioNodes.nodeKey, nodeKey)));
    return node;
  }

  async createScenarioNode(node: InsertAcademyScenarioNode): Promise<AcademyScenarioNode> {
    const [created] = await db.insert(academyScenarioNodes).values(node).returning();
    return created;
  }

  // ==================== SCENARIO RUNS ====================

  async getScenarioRun(id: string): Promise<AcademyScenarioRun | undefined> {
    const [run] = await db.select().from(academyScenarioRuns).where(eq(academyScenarioRuns.id, id));
    return run;
  }

  async getScenarioRunsByUser(userId: string): Promise<AcademyScenarioRun[]> {
    return db.select().from(academyScenarioRuns).where(eq(academyScenarioRuns.userId, userId)).orderBy(desc(academyScenarioRuns.startedAt));
  }

  async createScenarioRun(run: InsertAcademyScenarioRun): Promise<AcademyScenarioRun> {
    const [created] = await db.insert(academyScenarioRuns).values(run).returning();
    return created;
  }

  async updateScenarioRun(id: string, data: Partial<AcademyScenarioRun>): Promise<AcademyScenarioRun> {
    const [updated] = await db.update(academyScenarioRuns).set(data).where(eq(academyScenarioRuns.id, id)).returning();
    return updated;
  }

  // ==================== CHOICE LOGS ====================

  async createChoiceLog(log: InsertAcademyChoiceLog): Promise<AcademyChoiceLog> {
    const [created] = await db.insert(academyChoiceLogs).values(log).returning();
    return created;
  }

  async getChoiceLogsByRun(runId: string): Promise<AcademyChoiceLog[]> {
    return db.select().from(academyChoiceLogs).where(eq(academyChoiceLogs.runId, runId)).orderBy(academyChoiceLogs.createdAt);
  }

  // ==================== MARKETPLACE ====================

  async getActiveListings(): Promise<AcademyMarketListing[]> {
    return db.select().from(academyMarketListings).where(eq(academyMarketListings.status, "active")).orderBy(desc(academyMarketListings.createdAt));
  }

  async getListingsByUser(userId: string): Promise<AcademyMarketListing[]> {
    return db.select().from(academyMarketListings).where(eq(academyMarketListings.sellerId, userId)).orderBy(desc(academyMarketListings.createdAt));
  }

  async createListing(listing: InsertAcademyMarketListing): Promise<AcademyMarketListing> {
    const [created] = await db.insert(academyMarketListings).values(listing).returning();
    return created;
  }

  async updateListing(id: string, data: Partial<AcademyMarketListing>): Promise<AcademyMarketListing> {
    const [updated] = await db.update(academyMarketListings).set(data).where(eq(academyMarketListings.id, id)).returning();
    return updated;
  }

  // ==================== PEER TRADES ====================

  async createPeerTrade(trade: InsertAcademyPeerTrade): Promise<AcademyPeerTrade> {
    const [created] = await db.insert(academyPeerTrades).values(trade).returning();
    return created;
  }

  async getTradesByUser(userId: string): Promise<AcademyPeerTrade[]> {
    return db.select().from(academyPeerTrades).where(
      sql`${academyPeerTrades.buyerId} = ${userId} OR ${academyPeerTrades.sellerId} = ${userId}`
    ).orderBy(desc(academyPeerTrades.createdAt));
  }

  // ==================== ACTIVITY FEED ====================

  async getActivityFeed(limit: number = 50): Promise<AcademyActivityFeedItem[]> {
    return db.select().from(academyActivityFeed).orderBy(desc(academyActivityFeed.createdAt)).limit(limit);
  }

  async getActivityFeedByUser(userId: string): Promise<AcademyActivityFeedItem[]> {
    return db.select().from(academyActivityFeed).where(eq(academyActivityFeed.userId, userId)).orderBy(desc(academyActivityFeed.createdAt)).limit(50);
  }

  async createActivityFeedItem(item: InsertAcademyActivityFeedItem): Promise<AcademyActivityFeedItem> {
    const [created] = await db.insert(academyActivityFeed).values(item).returning();
    return created;
  }

  // ==================== ADMIN ====================

  async getAllAdminNotes(): Promise<AcademyAdminNote[]> {
    return db.select().from(academyAdminNotes).orderBy(desc(academyAdminNotes.createdAt));
  }

  async getAdminNotesByUser(userId: string): Promise<AcademyAdminNote[]> {
    return db.select().from(academyAdminNotes).where(eq(academyAdminNotes.userId, userId)).orderBy(desc(academyAdminNotes.createdAt));
  }

  async createAdminNote(note: InsertAcademyAdminNote): Promise<AcademyAdminNote> {
    const [created] = await db.insert(academyAdminNotes).values(note).returning();
    return created;
  }

  async updateAdminNote(id: string, data: Partial<AcademyAdminNote>): Promise<AcademyAdminNote> {
    const [updated] = await db.update(academyAdminNotes).set(data).where(eq(academyAdminNotes.id, id)).returning();
    return updated;
  }

  async getAllWallets(): Promise<AcademyWallet[]> {
    return db.select().from(academyWallets);
  }

  async getAllPantherPower(): Promise<AcademyPantherPower[]> {
    return db.select().from(academyPantherPower);
  }

  async getAllScenarioRuns(): Promise<AcademyScenarioRun[]> {
    return db.select().from(academyScenarioRuns);
  }

  async getAllPeerTrades(): Promise<AcademyPeerTrade[]> {
    return db.select().from(academyPeerTrades);
  }

  async getContentReports(): Promise<AcademyContentReport[]> {
    return db.select().from(academyContentReports).orderBy(desc(academyContentReports.createdAt));
  }

  async createContentReport(report: InsertAcademyContentReport): Promise<AcademyContentReport> {
    const [result] = await db.insert(academyContentReports).values(report).returning();
    return result;
  }

  async updateContentReport(id: string, data: Partial<AcademyContentReport>): Promise<AcademyContentReport> {
    const [result] = await db.update(academyContentReports).set(data).where(eq(academyContentReports.id, id)).returning();
    return result;
  }

  // ==================== GAME PLATFORM ====================

  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const [created] = await db.insert(gameSessions).values(session).returning();
    return created;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session;
  }

  async updateGameSession(id: string, data: Partial<GameSession>): Promise<GameSession> {
    const [updated] = await db.update(gameSessions).set(data).where(eq(gameSessions.id, id)).returning();
    return updated;
  }

  async getGameSessionsByUser(userId: string): Promise<GameSession[]> {
    const playerRows = await db.select({ sessionId: gamePlayers.sessionId }).from(gamePlayers).where(eq(gamePlayers.userId, userId));
    if (playerRows.length === 0) return [];
    const sessionIds = playerRows.map(r => r.sessionId);
    return db.select().from(gameSessions).where(inArray(gameSessions.id, sessionIds)).orderBy(desc(gameSessions.createdAt));
  }

  async getActiveGameSessions(): Promise<GameSession[]> {
    return db.select().from(gameSessions).where(inArray(gameSessions.status, ['waiting', 'in_progress'])).orderBy(desc(gameSessions.createdAt));
  }

  async addGamePlayer(player: InsertGamePlayer): Promise<GamePlayer> {
    const [created] = await db.insert(gamePlayers).values(player).returning();
    return created;
  }

  async getGamePlayers(sessionId: string): Promise<GamePlayer[]> {
    return db.select().from(gamePlayers).where(eq(gamePlayers.sessionId, sessionId));
  }

  async updateGamePlayer(id: string, data: Partial<GamePlayer>): Promise<GamePlayer> {
    const [updated] = await db.update(gamePlayers).set(data).where(eq(gamePlayers.id, id)).returning();
    return updated;
  }

  async getOrCreateRating(userId: string, gameType: string): Promise<PlayerRating> {
    const existing = await db.select().from(playerRatings)
      .where(and(eq(playerRatings.userId, userId), eq(playerRatings.gameType, gameType)))
      .limit(1);
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(playerRatings).values({
      userId,
      gameType,
      rating: 1200,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    }).returning();
    return created;
  }

  async updateRating(id: string, data: Partial<PlayerRating>): Promise<PlayerRating> {
    const [updated] = await db.update(playerRatings).set(data).where(eq(playerRatings.id, id)).returning();
    return updated;
  }

  async getRatingsByUser(userId: string): Promise<PlayerRating[]> {
    return db.select().from(playerRatings).where(eq(playerRatings.userId, userId));
  }

  async getLeaderboard(gameType: string, limit: number = 10): Promise<PlayerRating[]> {
    return db.select().from(playerRatings)
      .where(eq(playerRatings.gameType, gameType))
      .orderBy(desc(playerRatings.rating))
      .limit(limit);
  }

  async startPlaySession(userId: string, gameType: string): Promise<PlaySession> {
    const [created] = await db.insert(playSessions).values({
      userId,
      gameType,
    }).returning();
    return created;
  }

  async endPlaySession(id: string): Promise<PlaySession> {
    const [session] = await db.select().from(playSessions).where(eq(playSessions.id, id));
    const now = new Date();
    const startedAt = new Date(session.startedAt);
    const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);
    const flagged = durationMinutes >= 35;
    const [updated] = await db.update(playSessions).set({
      endedAt: now,
      durationMinutes,
      flagged,
    }).where(eq(playSessions.id, id)).returning();
    return updated;
  }

  async getFlaggedPlaySessions(): Promise<PlaySession[]> {
    return db.select().from(playSessions).where(eq(playSessions.flagged, true)).orderBy(desc(playSessions.startedAt));
  }

  async getActivePlayerCount(): Promise<number> {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const result = await db
      .selectDistinct({ userId: playSessions.userId })
      .from(playSessions)
      .where(
        and(
          isNull(playSessions.endedAt),
          gte(playSessions.startedAt, fifteenMinAgo)
        )
      );
    return result.length;
  }

  async seedData(): Promise<void> {
    const { seedAILevels } = await import("./seed-ai");
    const { seedSubjects } = await import("./seed-subjects");
    const { seedAdditionalLessons } = await import("./seed-lessons");
    const { seedCurriculumDocuments } = await import("./seed-curriculum-docs");
    const { seedScenarios } = await import("./seed-scenarios");

    const existingLevels = await db.select().from(levels).limit(1);
    if (existingLevels.length === 0) {
      await seedAILevels(db);
    }

    const existingSubjects = await db.select().from(subjects).limit(1);
    if (existingSubjects.length === 0) {
      await seedSubjects(db);
    } else {
      const existingModules = await db.select().from(modules).limit(1);
      if (existingModules.length === 0) {
        console.log("[Seed] Subjects exist but modules missing — seeding modules and lessons...");
        const { seedModulesAndLessons } = await import("./seed-subjects");
        await seedModulesAndLessons(db);
      }
      const aiSubjects = await db.select().from(subjects).where(eq(subjects.id, "ai_6_8")).limit(1);
      if (aiSubjects.length === 0) {
        const { seedAILiteracyContent } = await import("./seed-ai-literacy");
        await seedAILiteracyContent(db);
      }
      const aiLessonCount = await db.select().from(lessons).where(eq(lessons.moduleId, "ai_68_understand"));
      if (aiLessonCount.length < 3) {
        const { seedAILiteracyFullLessons } = await import("./seed-ai-lessons-full");
        await seedAILiteracyFullLessons(db);
      }
      const wrNewLessons = await db.select().from(lessons).where(eq(lessons.id, "wr_m1_lesson_1"));
      if (wrNewLessons.length < 1) {
        const oldWrLessons = await db.select().from(lessons).where(eq(lessons.id, "wr_prof_l1"));
        if (oldWrLessons.length > 0) {
          const { inArray } = await import("drizzle-orm");
          await db.delete(lessons).where(inArray(lessons.moduleId, [
            "wr_professional_presence", "wr_workplace_rights", "wr_workplace_safety",
            "wr_time_management", "wr_work_ethic_leadership",
            "wr_career_foundations_teamwork", "wr_career_foundations_professionalism"
          ]));
          console.log("[Seed] Cleared old workforce lessons for culturally-responsive upgrade");
        }
        const { seedWorkforceLessons } = await import("./seed-workforce-lessons");
        await seedWorkforceLessons(db);
      }
    }

    const existingLessons = await db.select().from(lessons);
    if (existingLessons.length < 50) {
      await seedAdditionalLessons(db);
    }

    const existingDocs = await db.select().from(curriculumDocuments).limit(1);
    if (existingDocs.length < 50) {
      await seedCurriculumDocuments(db);
    }

    const existingOutcomes = await db.select().from(outcomeTracking).limit(1);
    if (existingOutcomes.length === 0) {
      const { seedOutcomeData } = await import("./seed-outcomes");
      await seedOutcomeData(db);
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

    // Seed life lessons
    const existingLifeLessons = await db.select().from(academyLifeLessons);
    if (existingLifeLessons.length === 0) {
      await db.insert(academyLifeLessons).values([
        { featureArea: "stocks", businessConcept: "Investing & Risk Management", lifeSkillesson: "Making smart choices means weighing risks and rewards - in money and in life", reflection: "When have you taken a calculated risk that paid off?", iconName: "trending-up", sortOrder: 1 },
        { featureArea: "stocks", businessConcept: "Market Research & Analysis", lifeSkillesson: "Good decisions come from gathering information before acting", reflection: "How do you research before making an important decision?", iconName: "search", sortOrder: 2 },
        { featureArea: "stocks", businessConcept: "Diversification", lifeSkillesson: "Don't put all your eggs in one basket - develop multiple skills and interests", reflection: "What are three different strengths you're building?", iconName: "layers", sortOrder: 3 },
        { featureArea: "wallet", businessConcept: "Budgeting & Savings", lifeSkillesson: "Managing money well means knowing the difference between needs and wants", reflection: "What's something you saved for that felt rewarding?", iconName: "piggy-bank", sortOrder: 4 },
        { featureArea: "wallet", businessConcept: "Financial Literacy", lifeSkillesson: "Understanding money gives you power to make your dreams real", reflection: "What financial goal would you set for yourself this year?", iconName: "dollar-sign", sortOrder: 5 },
        { featureArea: "campus", businessConcept: "Project Management", lifeSkillesson: "Big dreams get built one step at a time through planning and persistence", reflection: "What's a big project you broke into smaller steps?", iconName: "clipboard", sortOrder: 6 },
        { featureArea: "campus", businessConcept: "Real Estate & Development", lifeSkillesson: "Building something lasting requires vision, resources, and teamwork", reflection: "What would you build for your community if you could?", iconName: "building", sortOrder: 7 },
        { featureArea: "competitions", businessConcept: "Competitive Strategy", lifeSkillesson: "Competition pushes you to grow - the real win is becoming your best self", reflection: "How has competing made you stronger?", iconName: "trophy", sortOrder: 8 },
        { featureArea: "competitions", businessConcept: "Teamwork & Collaboration", lifeSkillesson: "The best teams combine different strengths to achieve what no one could alone", reflection: "What role do you play best on a team?", iconName: "users", sortOrder: 9 },
        { featureArea: "houses", businessConcept: "Leadership & Mentoring", lifeSkillesson: "True leaders lift others up and create opportunities for everyone", reflection: "Who is someone you've helped grow?", iconName: "crown", sortOrder: 10 },
        { featureArea: "houses", businessConcept: "Character & Integrity", lifeSkillesson: "Your character is your most valuable asset - it opens doors money can't buy", reflection: "What value do you never compromise on?", iconName: "shield", sortOrder: 11 },
        { featureArea: "dreams", businessConcept: "Goal Setting & Vision", lifeSkillesson: "Knowing where you want to go is the first step to getting there", reflection: "Where do you see yourself in 5 years?", iconName: "target", sortOrder: 12 },
        { featureArea: "dreams", businessConcept: "Personal Branding", lifeSkillesson: "Your reputation is built by what you do when no one is watching", reflection: "What three words would your friends use to describe you?", iconName: "star", sortOrder: 13 },
        { featureArea: "merch", businessConcept: "Entrepreneurship & Sales", lifeSkillesson: "Creating value for others is the heart of every successful business", reflection: "What product or service could you create that helps people?", iconName: "shopping-bag", sortOrder: 14 },
        { featureArea: "merch", businessConcept: "Social Enterprise", lifeSkillesson: "Business can be a force for good when profits serve a purpose", reflection: "How can making money also help your community?", iconName: "heart", sortOrder: 15 },
        { featureArea: "avatar", businessConcept: "Personal Identity", lifeSkillesson: "Knowing who you are gives you confidence to show up authentically", reflection: "What makes you uniquely you?", iconName: "user", sortOrder: 16 },
      ]);
    }

    const existingScenarios = await db.select().from(academyScenarios).limit(1);
    if (existingScenarios.length === 0) {
      await seedScenarios(db);
    }

    const { seedPlaybooks } = await import("./seed-playbooks");
    const existingPlaybooks = await db.select().from(interventionPlaybooks).limit(1);
    if (existingPlaybooks.length === 0) {
      await seedPlaybooks(db);
    }

    const { seedMentors } = await import("./seed-mentors");
    const existingMentors = await db.select().from(mentorProfiles).limit(1);
    if (existingMentors.length === 0) {
      await seedMentors(db);
    }

    const { seedCareerFields, seedCareerMilestones } = await import("./seed-careers");
    const existingCareers = await db.select().from(careerFields).limit(1);
    if (existingCareers.length === 0) {
      await seedCareerFields(db);
    }
    const { seedNonCollegiatePathways } = await import("./seed-non-collegiate");
    await seedNonCollegiatePathways(db);

    const existingMilestones = await db.select().from(careerMilestones).limit(1);
    if (existingMilestones.length === 0) {
      await seedCareerMilestones(db);
    }

    const { seedPreventionData } = await import("./prevention-routes");
    await seedPreventionData();

    const { seedParentEducationData } = await import("./parent-education-routes");
    await seedParentEducationData();
  }

  async getReflectionsByUser(userId: string): Promise<StudentReflection[]> {
    return db.select().from(studentReflections).where(eq(studentReflections.userId, userId)).orderBy(desc(studentReflections.createdAt));
  }

  async createReflection(data: InsertStudentReflection): Promise<StudentReflection> {
    const [reflection] = await db.insert(studentReflections).values(data).returning();
    return reflection;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements).orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(data).returning();
    return announcement;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getAcademyEvents(): Promise<AcademyEvent[]> {
    return db.select().from(academyEvents).orderBy(desc(academyEvents.eventDate));
  }

  async createAcademyEvent(data: InsertAcademyEvent): Promise<AcademyEvent> {
    const [event] = await db.insert(academyEvents).values(data).returning();
    return event;
  }

  async deleteAcademyEvent(id: string): Promise<void> {
    await db.delete(academyEvents).where(eq(academyEvents.id, id));
  }

  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    return db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.loginTime));
  }

  async logAttendance(data: InsertAttendanceLog): Promise<AttendanceLog> {
    const [log] = await db.insert(attendanceLogs).values(data).returning();
    return log;
  }

  async createRiskDecision(data: InsertRiskDecision): Promise<RiskDecision> {
    const [decision] = await db.insert(riskDecisions).values(data).returning();
    return decision;
  }

  async getRiskDecisionsByUser(userId: string): Promise<RiskDecision[]> {
    return db.select().from(riskDecisions).where(eq(riskDecisions.userId, userId)).orderBy(desc(riskDecisions.createdAt));
  }

  async getAllRiskDecisions(): Promise<RiskDecision[]> {
    return db.select().from(riskDecisions).orderBy(desc(riskDecisions.createdAt));
  }

  async updateRiskDecision(id: string, data: Partial<RiskDecision>): Promise<RiskDecision> {
    const [updated] = await db.update(riskDecisions).set(data).where(eq(riskDecisions.id, id)).returning();
    return updated;
  }

  async getRiskNotificationSettings(): Promise<RiskNotificationSettings | undefined> {
    const [settings] = await db.select().from(riskNotificationSettings).where(eq(riskNotificationSettings.settingKey, "global"));
    return settings;
  }

  async updateRiskNotificationSettings(data: Partial<InsertRiskNotificationSettings>): Promise<RiskNotificationSettings> {
    const existing = await this.getRiskNotificationSettings();
    if (existing) {
      const [updated] = await db.update(riskNotificationSettings).set({ ...data, updatedAt: new Date() }).where(eq(riskNotificationSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(riskNotificationSettings).values({ ...data, settingKey: "global" } as any).returning();
    return created;
  }

  async getAdminCourses(): Promise<AcademyCourse[]> {
    return db.select().from(academyCourses).orderBy(desc(academyCourses.createdAt));
  }

  async getAdminCourse(id: string): Promise<AcademyCourse | undefined> {
    const [course] = await db.select().from(academyCourses).where(eq(academyCourses.id, id));
    return course;
  }

  async createAdminCourse(data: InsertAcademyCourse): Promise<AcademyCourse> {
    const [course] = await db.insert(academyCourses).values(data).returning();
    return course;
  }

  async updateAdminCourse(id: string, data: Partial<InsertAcademyCourse>): Promise<AcademyCourse> {
    const [course] = await db.update(academyCourses).set({ ...data, updatedAt: new Date() }).where(eq(academyCourses.id, id)).returning();
    return course;
  }

  async deleteAdminCourse(id: string): Promise<void> {
    const mods = await db.select().from(courseModules).where(eq(courseModules.courseId, id));
    for (const mod of mods) {
      await db.delete(courseLessons).where(eq(courseLessons.moduleId, mod.id));
    }
    await db.delete(courseModules).where(eq(courseModules.courseId, id));
    await db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, id));
    await db.delete(academyCourses).where(eq(academyCourses.id, id));
  }

  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    return db.select().from(courseModules).where(eq(courseModules.courseId, courseId)).orderBy(courseModules.sortOrder);
  }

  async getCourseModule(id: string): Promise<CourseModule | undefined> {
    const [mod] = await db.select().from(courseModules).where(eq(courseModules.id, id));
    return mod;
  }

  async createCourseModule(data: InsertCourseModule): Promise<CourseModule> {
    const [mod] = await db.insert(courseModules).values(data).returning();
    return mod;
  }

  async updateCourseModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule> {
    const [mod] = await db.update(courseModules).set(data).where(eq(courseModules.id, id)).returning();
    return mod;
  }

  async deleteCourseModule(id: string): Promise<void> {
    await db.delete(courseLessons).where(eq(courseLessons.moduleId, id));
    await db.delete(courseModules).where(eq(courseModules.id, id));
  }

  async getCourseLessons(moduleId: string): Promise<CourseLesson[]> {
    return db.select().from(courseLessons).where(eq(courseLessons.moduleId, moduleId)).orderBy(courseLessons.sortOrder);
  }

  async getCourseLesson(id: string): Promise<CourseLesson | undefined> {
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, id));
    return lesson;
  }

  async createCourseLesson(data: InsertCourseLesson): Promise<CourseLesson> {
    const [lesson] = await db.insert(courseLessons).values(data).returning();
    return lesson;
  }

  async updateCourseLesson(id: string, data: Partial<InsertCourseLesson>): Promise<CourseLesson> {
    const [lesson] = await db.update(courseLessons).set(data).where(eq(courseLessons.id, id)).returning();
    return lesson;
  }

  async deleteCourseLesson(id: string): Promise<void> {
    await db.delete(courseLessons).where(eq(courseLessons.id, id));
  }

  async getCourseEnrollments(courseId: string): Promise<CourseEnrollment[]> {
    return db.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, courseId)).orderBy(desc(courseEnrollments.enrolledAt));
  }

  async createCourseEnrollment(data: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const [enrollment] = await db.insert(courseEnrollments).values(data).returning();
    return enrollment;
  }

  async updateCourseEnrollment(id: string, data: Partial<CourseEnrollment>): Promise<CourseEnrollment> {
    const [enrollment] = await db.update(courseEnrollments).set(data).where(eq(courseEnrollments.id, id)).returning();
    return enrollment;
  }

  async getEnrollmentsByUser(userId: string): Promise<CourseEnrollment[]> {
    return db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, userId)).orderBy(desc(courseEnrollments.enrolledAt));
  }

  async getOnboardingTemplates(): Promise<OnboardingJourneyTemplate[]> {
    return db.select().from(onboardingJourneyTemplates).where(eq(onboardingJourneyTemplates.isActive, true));
  }

  async getOnboardingTemplate(id: string): Promise<OnboardingJourneyTemplate | undefined> {
    const [t] = await db.select().from(onboardingJourneyTemplates).where(eq(onboardingJourneyTemplates.id, id));
    return t;
  }

  async createOnboardingTemplate(data: InsertOnboardingJourneyTemplate): Promise<OnboardingJourneyTemplate> {
    const [t] = await db.insert(onboardingJourneyTemplates).values(data).returning();
    return t;
  }

  async getOnboardingPhases(templateId: string): Promise<OnboardingPhase[]> {
    return db.select().from(onboardingPhases).where(eq(onboardingPhases.templateId, templateId)).orderBy(onboardingPhases.sortOrder);
  }

  async createOnboardingPhase(data: InsertOnboardingPhase): Promise<OnboardingPhase> {
    const [p] = await db.insert(onboardingPhases).values(data).returning();
    return p;
  }

  async getOnboardingMilestones(templateId: string): Promise<OnboardingMilestone[]> {
    return db.select().from(onboardingMilestones).where(eq(onboardingMilestones.templateId, templateId)).orderBy(onboardingMilestones.sortOrder);
  }

  async getOnboardingMilestonesByPhase(phaseId: string): Promise<OnboardingMilestone[]> {
    return db.select().from(onboardingMilestones).where(eq(onboardingMilestones.phaseId, phaseId)).orderBy(onboardingMilestones.sortOrder);
  }

  async createOnboardingMilestone(data: InsertOnboardingMilestone): Promise<OnboardingMilestone> {
    const [m] = await db.insert(onboardingMilestones).values(data).returning();
    return m;
  }

  async getOnboardingJourney(id: string): Promise<OnboardingJourney | undefined> {
    const [j] = await db.select().from(onboardingJourneys).where(eq(onboardingJourneys.id, id));
    return j;
  }

  async getOnboardingJourneyByParticipant(participantId: string): Promise<OnboardingJourney | undefined> {
    const [j] = await db.select().from(onboardingJourneys).where(eq(onboardingJourneys.participantId, participantId));
    return j;
  }

  async getAllOnboardingJourneys(): Promise<OnboardingJourney[]> {
    return db.select().from(onboardingJourneys).orderBy(desc(onboardingJourneys.createdAt));
  }

  async createOnboardingJourney(data: InsertOnboardingJourney): Promise<OnboardingJourney> {
    const [j] = await db.insert(onboardingJourneys).values(data).returning();
    return j;
  }

  async updateOnboardingJourney(id: string, data: Partial<OnboardingJourney>): Promise<OnboardingJourney> {
    const [j] = await db.update(onboardingJourneys).set({ ...data, updatedAt: new Date() }).where(eq(onboardingJourneys.id, id)).returning();
    return j;
  }

  async getMilestoneCompletions(journeyId: string): Promise<OnboardingMilestoneCompletion[]> {
    return db.select().from(onboardingMilestoneCompletions).where(eq(onboardingMilestoneCompletions.journeyId, journeyId)).orderBy(desc(onboardingMilestoneCompletions.completedAt));
  }

  async createMilestoneCompletion(data: InsertOnboardingMilestoneCompletion): Promise<OnboardingMilestoneCompletion> {
    const [c] = await db.insert(onboardingMilestoneCompletions).values(data).returning();
    return c;
  }

  async getBaselineSnapshots(journeyId: string): Promise<OnboardingBaselineSnapshot[]> {
    return db.select().from(onboardingBaselineSnapshots).where(eq(onboardingBaselineSnapshots.journeyId, journeyId)).orderBy(desc(onboardingBaselineSnapshots.capturedAt));
  }

  async createBaselineSnapshot(data: InsertOnboardingBaselineSnapshot): Promise<OnboardingBaselineSnapshot> {
    const [s] = await db.insert(onboardingBaselineSnapshots).values(data).returning();
    return s;
  }

  async getCqiCycles(): Promise<CqiCycle[]> {
    return db.select().from(cqiCycles).orderBy(desc(cqiCycles.createdAt));
  }

  async getCqiCycle(id: string): Promise<CqiCycle | undefined> {
    const [cycle] = await db.select().from(cqiCycles).where(eq(cqiCycles.id, id));
    return cycle;
  }

  async createCqiCycle(data: InsertCqiCycle): Promise<CqiCycle> {
    const [cycle] = await db.insert(cqiCycles).values(data).returning();
    return cycle;
  }

  async updateCqiCycle(id: string, data: Partial<InsertCqiCycle>): Promise<CqiCycle> {
    const [cycle] = await db.update(cqiCycles).set({ ...data, updatedAt: new Date() }).where(eq(cqiCycles.id, id)).returning();
    return cycle;
  }

  async deleteCqiCycle(id: string): Promise<void> {
    const defs = await db.select().from(cqiFidelityDefinitions).where(eq(cqiFidelityDefinitions.cycleId, id));
    for (const def of defs) {
      await db.delete(cqiFidelityObservations).where(eq(cqiFidelityObservations.definitionId, def.id));
    }
    await db.delete(cqiFidelityDefinitions).where(eq(cqiFidelityDefinitions.cycleId, id));
    await db.delete(cqiOutcomes).where(eq(cqiOutcomes.cycleId, id));
    await db.delete(cqiInterventions).where(eq(cqiInterventions.cycleId, id));
    await db.delete(cqiGaps).where(eq(cqiGaps.cycleId, id));
    await db.delete(cqiCyclePhases).where(eq(cqiCyclePhases.cycleId, id));
    await db.delete(cqiCycles).where(eq(cqiCycles.id, id));
  }

  async getCqiGaps(cycleId: string): Promise<CqiGap[]> {
    return db.select().from(cqiGaps).where(eq(cqiGaps.cycleId, cycleId)).orderBy(desc(cqiGaps.createdAt));
  }

  async createCqiGap(data: InsertCqiGap): Promise<CqiGap> {
    const [gap] = await db.insert(cqiGaps).values(data).returning();
    return gap;
  }

  async updateCqiGap(id: string, data: Partial<InsertCqiGap>): Promise<CqiGap> {
    const [gap] = await db.update(cqiGaps).set(data).where(eq(cqiGaps.id, id)).returning();
    return gap;
  }

  async deleteCqiGap(id: string): Promise<void> {
    await db.delete(cqiGaps).where(eq(cqiGaps.id, id));
  }

  async getCqiInterventions(cycleId: string): Promise<CqiIntervention[]> {
    return db.select().from(cqiInterventions).where(eq(cqiInterventions.cycleId, cycleId)).orderBy(desc(cqiInterventions.createdAt));
  }

  async createCqiIntervention(data: InsertCqiIntervention): Promise<CqiIntervention> {
    const [intervention] = await db.insert(cqiInterventions).values(data).returning();
    return intervention;
  }

  async updateCqiIntervention(id: string, data: Partial<InsertCqiIntervention>): Promise<CqiIntervention> {
    const [intervention] = await db.update(cqiInterventions).set(data).where(eq(cqiInterventions.id, id)).returning();
    return intervention;
  }

  async deleteCqiIntervention(id: string): Promise<void> {
    await db.delete(cqiInterventions).where(eq(cqiInterventions.id, id));
  }

  async getCqiFidelityDefinitions(cycleId?: string): Promise<CqiFidelityDefinition[]> {
    if (cycleId) {
      return db.select().from(cqiFidelityDefinitions).where(eq(cqiFidelityDefinitions.cycleId, cycleId)).orderBy(cqiFidelityDefinitions.activityName);
    }
    return db.select().from(cqiFidelityDefinitions).orderBy(cqiFidelityDefinitions.activityName);
  }

  async createCqiFidelityDefinition(data: InsertCqiFidelityDefinition): Promise<CqiFidelityDefinition> {
    const [def] = await db.insert(cqiFidelityDefinitions).values(data).returning();
    return def;
  }

  async updateCqiFidelityDefinition(id: string, data: Partial<InsertCqiFidelityDefinition>): Promise<CqiFidelityDefinition> {
    const [def] = await db.update(cqiFidelityDefinitions).set(data).where(eq(cqiFidelityDefinitions.id, id)).returning();
    return def;
  }

  async deleteCqiFidelityDefinition(id: string): Promise<void> {
    await db.delete(cqiFidelityObservations).where(eq(cqiFidelityObservations.definitionId, id));
    await db.delete(cqiFidelityDefinitions).where(eq(cqiFidelityDefinitions.id, id));
  }

  async getCqiFidelityObservations(definitionId: string): Promise<CqiFidelityObservation[]> {
    return db.select().from(cqiFidelityObservations).where(eq(cqiFidelityObservations.definitionId, definitionId)).orderBy(desc(cqiFidelityObservations.observedDate));
  }

  async createCqiFidelityObservation(data: InsertCqiFidelityObservation): Promise<CqiFidelityObservation> {
    const [obs] = await db.insert(cqiFidelityObservations).values(data).returning();
    return obs;
  }

  async updateCqiFidelityObservation(id: string, data: Partial<InsertCqiFidelityObservation>): Promise<CqiFidelityObservation> {
    const [obs] = await db.update(cqiFidelityObservations).set(data).where(eq(cqiFidelityObservations.id, id)).returning();
    return obs;
  }

  async deleteCqiFidelityObservation(id: string): Promise<void> {
    await db.delete(cqiFidelityObservations).where(eq(cqiFidelityObservations.id, id));
  }

  async getCqiCyclePhases(cycleId: string): Promise<CqiCyclePhase[]> {
    return db.select().from(cqiCyclePhases).where(eq(cqiCyclePhases.cycleId, cycleId)).orderBy(cqiCyclePhases.enteredAt);
  }

  async createCqiCyclePhase(data: InsertCqiCyclePhase): Promise<CqiCyclePhase> {
    const [phase] = await db.insert(cqiCyclePhases).values(data).returning();
    return phase;
  }

  async updateCqiCyclePhase(id: string, data: Partial<InsertCqiCyclePhase>): Promise<CqiCyclePhase> {
    const [phase] = await db.update(cqiCyclePhases).set(data).where(eq(cqiCyclePhases.id, id)).returning();
    return phase;
  }

  async getCqiOutcomes(cycleId: string): Promise<CqiOutcome[]> {
    return db.select().from(cqiOutcomes).where(eq(cqiOutcomes.cycleId, cycleId)).orderBy(desc(cqiOutcomes.createdAt));
  }

  async createCqiOutcome(data: InsertCqiOutcome): Promise<CqiOutcome> {
    const [outcome] = await db.insert(cqiOutcomes).values(data).returning();
    return outcome;
  }

  async updateCqiOutcome(id: string, data: Partial<InsertCqiOutcome>): Promise<CqiOutcome> {
    const [outcome] = await db.update(cqiOutcomes).set(data).where(eq(cqiOutcomes.id, id)).returning();
    return outcome;
  }

  async deleteCqiOutcome(id: string): Promise<void> {
    await db.delete(cqiOutcomes).where(eq(cqiOutcomes.id, id));
  }

  async getProgramDesigns(userId?: string): Promise<ProgramDesign[]> {
    if (userId) {
      return db.select().from(programDesigns).where(eq(programDesigns.userId, userId)).orderBy(desc(programDesigns.createdAt));
    }
    return db.select().from(programDesigns).orderBy(desc(programDesigns.createdAt));
  }

  async getProgramDesign(id: string): Promise<ProgramDesign | undefined> {
    const [design] = await db.select().from(programDesigns).where(eq(programDesigns.id, id));
    return design;
  }

  async createProgramDesign(data: InsertProgramDesign): Promise<ProgramDesign> {
    const [design] = await db.insert(programDesigns).values(data).returning();
    return design;
  }

  async updateProgramDesign(id: string, data: Partial<InsertProgramDesign>): Promise<ProgramDesign> {
    const [design] = await db.update(programDesigns).set({ ...data, updatedAt: new Date() }).where(eq(programDesigns.id, id)).returning();
    return design;
  }

  async deleteProgramDesign(id: string): Promise<void> {
    await db.delete(programDesigns).where(eq(programDesigns.id, id));
  }
}

export const storage = new DatabaseStorage();
