import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subjects = pgTable("subjects", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  gradeBand: text("grade_band").notNull(),
  theme: text("theme").notNull(),
  color: text("color").notNull(),
  iconName: text("icon_name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const levels = pgTable("levels", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  grades: text("grades").notNull(),
  duration: text("duration").notNull(),
  theme: text("theme").notNull(),
  color: text("color").notNull(),
  iconName: text("icon_name").notNull(),
});

export const modules = pgTable("modules", {
  id: varchar("id", { length: 100 }).primaryKey(),
  levelId: integer("level_id").notNull().references(() => levels.id),
  subjectId: varchar("subject_id", { length: 100 }).references(() => subjects.id),
  moduleNumber: integer("module_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  durationWeeks: integer("duration_weeks").notNull(),
  storyArcTitle: text("story_arc_title"),
  storyArcNarrative: text("story_arc_narrative"),
  learningObjectives: text("learning_objectives").array().notNull(),
  activities: text("activities").array().notNull(),
});

export const lessons = pgTable("lessons", {
  id: varchar("id", { length: 100 }).primaryKey(),
  moduleId: varchar("module_id", { length: 100 }).notNull().references(() => modules.id),
  lessonNumber: integer("lesson_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  activityType: text("activity_type"),
  activityData: jsonb("activity_data"),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id", { length: 100 }).primaryKey(),
  moduleId: varchar("module_id", { length: 100 }).notNull().references(() => modules.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: jsonb("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  points: integer("points").notNull().default(10),
});

export const badges = pgTable("badges", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  levelRequirement: integer("level_requirement").notNull().default(1),
  rarity: text("rarity").notNull().default("common"),
});

export const studentProgress = pgTable("student_progress", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }),
  studentName: text("student_name").notNull(),
  currentLevel: integer("current_level").notNull().default(1),
  currentModuleId: varchar("current_module_id", { length: 100 }),
  totalPoints: integer("total_points").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  quizzesCompleted: integer("quizzes_completed").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  longestStreak: integer("longest_streak").notNull().default(0),
});

export const completedLessons = pgTable("completed_lessons", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  progressId: varchar("progress_id", { length: 100 }).notNull().references(() => studentProgress.id),
  lessonId: varchar("lesson_id", { length: 100 }).notNull().references(() => lessons.id),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  progressId: varchar("progress_id", { length: 100 }).notNull().references(() => studentProgress.id),
  moduleId: varchar("module_id", { length: 100 }).notNull().references(() => modules.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const earnedBadges = pgTable("earned_badges", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  progressId: varchar("progress_id", { length: 100 }).notNull().references(() => studentProgress.id),
  badgeId: varchar("badge_id", { length: 100 }).notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const curriculumDocuments = pgTable("curriculum_documents", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id", { length: 100 }).references(() => modules.id),
  levelId: integer("level_id").references(() => levels.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  gradeBand: text("grade_band").notNull(),
  documentType: text("document_type").notNull().default("curriculum_guide"),
  standardsAlignment: text("standards_alignment").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentAttachments = pgTable("document_attachments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id", { length: 100 }).references(() => curriculumDocuments.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  objectPath: text("object_path").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const lessonComments = pgTable("lesson_comments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id", { length: 100 }).notNull().references(() => lessons.id),
  userId: varchar("user_id", { length: 255 }),
  userName: text("user_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessonReactions = pgTable("lesson_reactions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id", { length: 100 }).notNull().references(() => lessons.id),
  userId: varchar("user_id", { length: 255 }),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyTips = pgTable("study_tips", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id", { length: 100 }).notNull().references(() => modules.id),
  userId: varchar("user_id", { length: 255 }),
  userName: text("user_name").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classrooms = pgTable("classrooms", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  teacherUserId: varchar("teacher_user_id", { length: 255 }).notNull(),
  teacherName: text("teacher_name").notNull(),
  inviteCode: varchar("invite_code", { length: 20 }).notNull(),
  gradeBand: text("grade_band").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classroomMembers = pgTable("classroom_members", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  classroomId: varchar("classroom_id", { length: 100 }).notNull().references(() => classrooms.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  studentName: text("student_name").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name").notNull(),
  levelId: integer("level_id").notNull().references(() => levels.id),
  levelTitle: text("level_title").notNull(),
  issuedAt: timestamp("issued_at").defaultNow(),
});

// ==================== SIXTH GRADE ACADEMY TABLES ====================

export const academyAvatars = pgTable("academy_avatars", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("student"),
  skinTone: text("skin_tone").notNull().default("#8B6914"),
  hairStyle: text("hair_style").notNull().default("short"),
  hairColor: text("hair_color").notNull().default("#1a1a1a"),
  outfit: text("outfit").notNull().default("casual"),
  outfitColor: text("outfit_color").notNull().default("#4F46E5"),
  accessory: text("accessory").notNull().default("none"),
  background: text("background").notNull().default("school"),
  bio: text("bio").notNull().default(""),
  dreamGoal: text("dream_goal").notNull().default(""),
  houseId: varchar("house_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyHouses = pgTable("academy_houses", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull(),
  motto: text("motto").notNull(),
  iconName: text("icon_name").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyMeritEvents = pgTable("academy_merit_events", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  houseId: varchar("house_id", { length: 100 }).references(() => academyHouses.id),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  category: text("category").notNull().default("academic"),
  awardedBy: varchar("awarded_by", { length: 255 }),
  awardedByName: text("awarded_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyWallets = pgTable("academy_wallets", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("1000.00"),
  totalEarned: decimal("total_earned", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalInvested: decimal("total_invested", { precision: 12, scale: 2 }).notNull().default("0.00"),
  campusContributed: decimal("campus_contributed", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyTransactions = pgTable("academy_transactions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id", { length: 100 }).notNull().references(() => academyWallets.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyStocks = pgTable("academy_stocks", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  currentPrice: decimal("current_price", { precision: 12, scale: 2 }).notNull(),
  previousPrice: decimal("previous_price", { precision: 12, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 6, scale: 2 }).notNull().default("0.00"),
  priceHistory: jsonb("price_history").notNull().default([]),
});

export const academyPortfolios = pgTable("academy_portfolios", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  stockId: varchar("stock_id", { length: 100 }).notNull().references(() => academyStocks.id),
  shares: integer("shares").notNull().default(0),
  avgBuyPrice: decimal("avg_buy_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyCommunityPortfolio = pgTable("academy_community_portfolio", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  stockId: varchar("stock_id", { length: 100 }).notNull().references(() => academyStocks.id),
  shares: integer("shares").notNull().default(0),
  avgBuyPrice: decimal("avg_buy_price", { precision: 12, scale: 2 }).notNull(),
  strategy: text("strategy").notNull().default("ai_managed"),
});

export const academyCampusProjects = pgTable("academy_campus_projects", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  projectName: text("project_name").notNull(),
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull().default("50000.00"),
  amountFunded: decimal("amount_funded", { precision: 12, scale: 2 }).notNull().default("0.00"),
  currentPhase: integer("current_phase").notNull().default(1),
  completedPhases: jsonb("completed_phases").notNull().default([]),
  features: jsonb("features").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyCompetitions = pgTable("academy_competitions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  maxParticipants: integer("max_participants").notNull().default(60),
  status: text("status").notNull().default("upcoming"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  prizePoints: integer("prize_points").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyCompetitionEntries = pgTable("academy_competition_entries", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id", { length: 100 }).notNull().references(() => academyCompetitions.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name").notNull(),
  score: integer("score"),
  placement: integer("placement"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyDreamProfiles = pgTable("academy_dream_profiles", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  dreamCareer: text("dream_career").notNull().default(""),
  dreamCollege: text("dream_college").notNull().default(""),
  shortTermGoals: text("short_term_goals").array().notNull().default(sql`'{}'::text[]`),
  longTermGoals: text("long_term_goals").array().notNull().default(sql`'{}'::text[]`),
  strengths: text("strengths").array().notNull().default(sql`'{}'::text[]`),
  growthAreas: text("growth_areas").array().notNull().default(sql`'{}'::text[]`),
  academicScore: integer("academic_score").notNull().default(0),
  leadershipScore: integer("leadership_score").notNull().default(0),
  communityScore: integer("community_score").notNull().default(0),
  wellnessScore: integer("wellness_score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const academyMerchItems = pgTable("academy_merch_items", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyMerchOrders = pgTable("academy_merch_orders", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name").notNull(),
  itemId: varchar("item_id", { length: 100 }).notNull().references(() => academyMerchItems.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== PANTHER POWER & QUESTS ====================

export const academyPantherPower = pgTable("academy_panther_power", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  totalScore: integer("total_score").notNull().default(0),
  educationScore: integer("education_score").notNull().default(0),
  characterScore: integer("character_score").notNull().default(0),
  leadershipScore: integer("leadership_score").notNull().default(0),
  entrepreneurshipScore: integer("entrepreneurship_score").notNull().default(0),
  communityScore: integer("community_score").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  level: integer("level").notNull().default(1),
  title: text("title").notNull().default("Young Panther"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const academyDailyQuests = pgTable("academy_daily_quests", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  questDate: text("quest_date").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  featureLink: text("feature_link").notNull(),
  rewardPoints: integer("reward_points").notNull().default(10),
  rewardType: text("reward_type").notNull().default("power"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyLifeLessons = pgTable("academy_life_lessons", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  featureArea: text("feature_area").notNull(),
  businessConcept: text("business_concept").notNull(),
  lifeSkillesson: text("life_skill_lesson").notNull(),
  reflection: text("reflection").notNull(),
  ageGroup: text("age_group").notNull().default("6th-grade"),
  iconName: text("icon_name").notNull().default("lightbulb"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const academyWizardProgress = pgTable("academy_wizard_progress", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  wizardType: text("wizard_type").notNull(),
  currentStep: integer("current_step").notNull().default(0),
  totalSteps: integer("total_steps").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== ACADEMY INSERT SCHEMAS ====================

export const insertAcademyAvatarSchema = createInsertSchema(academyAvatars).omit({ id: true, createdAt: true });
export const insertAcademyHouseSchema = createInsertSchema(academyHouses).omit({ id: true, createdAt: true, totalPoints: true });
export const insertAcademyMeritEventSchema = createInsertSchema(academyMeritEvents).omit({ id: true, createdAt: true });
export const insertAcademyWalletSchema = createInsertSchema(academyWallets).omit({ id: true, createdAt: true });
export const insertAcademyTransactionSchema = createInsertSchema(academyTransactions).omit({ id: true, createdAt: true });
export const insertAcademyStockSchema = createInsertSchema(academyStocks).omit({ id: true });
export const insertAcademyPortfolioSchema = createInsertSchema(academyPortfolios).omit({ id: true, createdAt: true });
export const insertAcademyCampusProjectSchema = createInsertSchema(academyCampusProjects).omit({ id: true, createdAt: true });
export const insertAcademyCompetitionSchema = createInsertSchema(academyCompetitions).omit({ id: true, createdAt: true });
export const insertAcademyCompetitionEntrySchema = createInsertSchema(academyCompetitionEntries).omit({ id: true, createdAt: true });
export const insertAcademyDreamProfileSchema = createInsertSchema(academyDreamProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAcademyMerchItemSchema = createInsertSchema(academyMerchItems).omit({ id: true, createdAt: true });
export const insertAcademyMerchOrderSchema = createInsertSchema(academyMerchOrders).omit({ id: true, createdAt: true });

export const insertAcademyPantherPowerSchema = createInsertSchema(academyPantherPower).omit({ id: true, updatedAt: true });
export const insertAcademyDailyQuestSchema = createInsertSchema(academyDailyQuests).omit({ id: true, createdAt: true, completedAt: true });
export const insertAcademyLifeLessonSchema = createInsertSchema(academyLifeLessons).omit({ id: true });
export const insertAcademyWizardProgressSchema = createInsertSchema(academyWizardProgress).omit({ id: true, createdAt: true, completedAt: true });

export const insertSubjectSchema = createInsertSchema(subjects);
export const insertLevelSchema = createInsertSchema(levels);
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });
export const insertStudentProgressSchema = createInsertSchema(studentProgress).omit({ id: true });
export const insertCompletedLessonSchema = createInsertSchema(completedLessons).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true });
export const insertEarnedBadgeSchema = createInsertSchema(earnedBadges).omit({ id: true });
export const insertCurriculumDocumentSchema = createInsertSchema(curriculumDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentAttachmentSchema = createInsertSchema(documentAttachments).omit({ id: true, uploadedAt: true });
export const insertLessonCommentSchema = createInsertSchema(lessonComments).omit({ id: true, createdAt: true });
export const insertLessonReactionSchema = createInsertSchema(lessonReactions).omit({ id: true, createdAt: true });
export const insertStudyTipSchema = createInsertSchema(studyTips).omit({ id: true, createdAt: true, upvotes: true });
export const insertClassroomSchema = createInsertSchema(classrooms).omit({ id: true, createdAt: true, inviteCode: true });
export const insertClassroomMemberSchema = createInsertSchema(classroomMembers).omit({ id: true, joinedAt: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true });

export type Subject = typeof subjects.$inferSelect;
export type Level = typeof levels.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type CompletedLesson = typeof completedLessons.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type EarnedBadge = typeof earnedBadges.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertStudentProgress = z.infer<typeof insertStudentProgressSchema>;
export type InsertCompletedLesson = z.infer<typeof insertCompletedLessonSchema>;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type InsertEarnedBadge = z.infer<typeof insertEarnedBadgeSchema>;
export type CurriculumDocument = typeof curriculumDocuments.$inferSelect;
export type InsertCurriculumDocument = z.infer<typeof insertCurriculumDocumentSchema>;
export type DocumentAttachment = typeof documentAttachments.$inferSelect;
export type InsertDocumentAttachment = z.infer<typeof insertDocumentAttachmentSchema>;
export type LessonComment = typeof lessonComments.$inferSelect;
export type InsertLessonComment = z.infer<typeof insertLessonCommentSchema>;
export type LessonReaction = typeof lessonReactions.$inferSelect;
export type InsertLessonReaction = z.infer<typeof insertLessonReactionSchema>;
export type StudyTip = typeof studyTips.$inferSelect;
export type InsertStudyTip = z.infer<typeof insertStudyTipSchema>;
export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;
export type ClassroomMember = typeof classroomMembers.$inferSelect;
export type InsertClassroomMember = z.infer<typeof insertClassroomMemberSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type AcademyAvatar = typeof academyAvatars.$inferSelect;
export type InsertAcademyAvatar = z.infer<typeof insertAcademyAvatarSchema>;
export type AcademyHouse = typeof academyHouses.$inferSelect;
export type InsertAcademyHouse = z.infer<typeof insertAcademyHouseSchema>;
export type AcademyMeritEvent = typeof academyMeritEvents.$inferSelect;
export type InsertAcademyMeritEvent = z.infer<typeof insertAcademyMeritEventSchema>;
export type AcademyWallet = typeof academyWallets.$inferSelect;
export type InsertAcademyWallet = z.infer<typeof insertAcademyWalletSchema>;
export type AcademyTransaction = typeof academyTransactions.$inferSelect;
export type InsertAcademyTransaction = z.infer<typeof insertAcademyTransactionSchema>;
export type AcademyStock = typeof academyStocks.$inferSelect;
export type InsertAcademyStock = z.infer<typeof insertAcademyStockSchema>;
export type AcademyPortfolio = typeof academyPortfolios.$inferSelect;
export type InsertAcademyPortfolio = z.infer<typeof insertAcademyPortfolioSchema>;
export type AcademyCommunityPortfolioItem = typeof academyCommunityPortfolio.$inferSelect;
export type AcademyCampusProject = typeof academyCampusProjects.$inferSelect;
export type InsertAcademyCampusProject = z.infer<typeof insertAcademyCampusProjectSchema>;
export type AcademyCompetition = typeof academyCompetitions.$inferSelect;
export type InsertAcademyCompetition = z.infer<typeof insertAcademyCompetitionSchema>;
export type AcademyCompetitionEntry = typeof academyCompetitionEntries.$inferSelect;
export type InsertAcademyCompetitionEntry = z.infer<typeof insertAcademyCompetitionEntrySchema>;
export type AcademyDreamProfile = typeof academyDreamProfiles.$inferSelect;
export type InsertAcademyDreamProfile = z.infer<typeof insertAcademyDreamProfileSchema>;
export type AcademyMerchItem = typeof academyMerchItems.$inferSelect;
export type InsertAcademyMerchItem = z.infer<typeof insertAcademyMerchItemSchema>;
export type AcademyMerchOrder = typeof academyMerchOrders.$inferSelect;
export type InsertAcademyMerchOrder = z.infer<typeof insertAcademyMerchOrderSchema>;
export type AcademyPantherPower = typeof academyPantherPower.$inferSelect;
export type InsertAcademyPantherPower = z.infer<typeof insertAcademyPantherPowerSchema>;
export type AcademyDailyQuest = typeof academyDailyQuests.$inferSelect;
export type InsertAcademyDailyQuest = z.infer<typeof insertAcademyDailyQuestSchema>;
export type AcademyLifeLesson = typeof academyLifeLessons.$inferSelect;
export type InsertAcademyLifeLesson = z.infer<typeof insertAcademyLifeLessonSchema>;
export type AcademyWizardProgress = typeof academyWizardProgress.$inferSelect;
export type InsertAcademyWizardProgress = z.infer<typeof insertAcademyWizardProgressSchema>;

export * from "./models/auth";
