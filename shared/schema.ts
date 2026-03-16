import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, real } from "drizzle-orm/pg-core";
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

// ==================== CHOOSE-YOUR-OWN-ADVENTURE & MARKETPLACE TABLES ====================

export const academyScenarios = pgTable("academy_scenarios", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  theme: text("theme").notNull(), // "finance", "social", "business", "leadership", "community"
  summary: text("summary").notNull(),
  difficulty: text("difficulty").notNull().default("medium"), // "easy", "medium", "hard"
  empathyPrompt: text("empathy_prompt").notNull(),
  featureArea: text("feature_area").notNull().default("general"), // ties to stocks, wallet, campus, etc.
  totalNodes: integer("total_nodes").notNull().default(1),
  rewardCategory: text("reward_category").notNull().default("education"), // panther power category
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyScenarioNodes = pgTable("academy_scenario_nodes", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  scenarioId: varchar("scenario_id", { length: 100 }).notNull().references(() => academyScenarios.id),
  nodeKey: text("node_key").notNull(), // "start", "choice_a", "choice_b", "outcome_a1", etc.
  narrative: text("narrative").notNull(), // the story text
  isStart: boolean("is_start").notNull().default(false),
  isEnd: boolean("is_end").notNull().default(false),
  choices: jsonb("choices").notNull().default([]), // [{key: "a", label: "Invest wisely", nextNodeKey: "outcome_a1", consequence: {...}}]
  consequenceSummary: text("consequence_summary"), // what happened as a result
  walletImpact: decimal("wallet_impact", { precision: 12, scale: 2 }).default("0.00"), // +/- wallet
  powerImpact: integer("power_impact").default(0), // +/- panther power
  meritImpact: integer("merit_impact").default(0), // +/- merit/house points
  emotionalTone: text("emotional_tone").default("neutral"), // "triumph", "setback", "learning", "neutral"
  pathForward: text("path_forward"), // encouragement text when facing setbacks
  sortOrder: integer("sort_order").notNull().default(0),
});

export const academyScenarioRuns = pgTable("academy_scenario_runs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  scenarioId: varchar("scenario_id", { length: 100 }).notNull().references(() => academyScenarios.id),
  currentNodeKey: text("current_node_key").notNull().default("start"),
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
  totalChoicesMade: integer("total_choices_made").notNull().default(0),
  totalWalletImpact: decimal("total_wallet_impact", { precision: 12, scale: 2 }).default("0.00"),
  totalPowerEarned: integer("total_power_earned").default(0),
  outcome: jsonb("outcome").default({}), // final outcome summary
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const academyChoiceLogs = pgTable("academy_choice_logs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id", { length: 100 }).notNull().references(() => academyScenarioRuns.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  nodeKey: text("node_key").notNull(),
  choiceKey: text("choice_key").notNull(),
  choiceLabel: text("choice_label").notNull(),
  consequence: jsonb("consequence").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyMarketListings = pgTable("academy_market_listings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id", { length: 255 }).notNull(),
  sellerName: text("seller_name").notNull(),
  itemName: text("item_name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"), // "service", "product", "skill", "tutoring"
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("active"), // "active", "sold", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyPeerTrades = pgTable("academy_peer_trades", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id", { length: 100 }).notNull().references(() => academyMarketListings.id),
  buyerId: varchar("buyer_id", { length: 255 }).notNull(),
  buyerName: text("buyer_name").notNull(),
  sellerId: varchar("seller_id", { length: 255 }).notNull(),
  sellerName: text("seller_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyActivityFeed = pgTable("academy_activity_feed", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name").notNull(),
  activityType: text("activity_type").notNull(), // "trade", "scenario_choice", "scenario_complete", "stock_trade", "merit_award", "campus_fund", "quest_complete", "marketplace_list", "marketplace_buy"
  title: text("title").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata").default({}),
  powerCategory: text("power_category"), // which panther power category this relates to
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academyAdminNotes = pgTable("academy_admin_notes", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id", { length: 255 }).notNull(),
  adminName: text("admin_name").notNull(),
  userId: varchar("user_id", { length: 255 }), // null = general note
  note: text("note").notNull(),
  category: text("category").notNull().default("observation"), // "observation", "intervention", "praise", "concern"
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== CONTENT REPORTS ====================

export const academyContentReports = pgTable("academy_content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull(),
  reporterName: varchar("reporter_name").notNull(),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  reason: varchar("reason").notNull(),
  details: text("details"),
  status: varchar("status").notNull().default("pending"),
  reviewedBy: varchar("reviewed_by"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAcademyContentReportSchema = createInsertSchema(academyContentReports).omit({ id: true, createdAt: true });

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

export const insertAcademyScenarioSchema = createInsertSchema(academyScenarios).omit({ id: true, createdAt: true });
export const insertAcademyScenarioNodeSchema = createInsertSchema(academyScenarioNodes).omit({ id: true });
export const insertAcademyScenarioRunSchema = createInsertSchema(academyScenarioRuns).omit({ id: true, startedAt: true, completedAt: true });
export const insertAcademyChoiceLogSchema = createInsertSchema(academyChoiceLogs).omit({ id: true, createdAt: true });
export const insertAcademyMarketListingSchema = createInsertSchema(academyMarketListings).omit({ id: true, createdAt: true });
export const insertAcademyPeerTradeSchema = createInsertSchema(academyPeerTrades).omit({ id: true, createdAt: true });
export const insertAcademyActivityFeedSchema = createInsertSchema(academyActivityFeed).omit({ id: true, createdAt: true });
export const insertAcademyAdminNoteSchema = createInsertSchema(academyAdminNotes).omit({ id: true, createdAt: true });

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
export type AcademyScenario = typeof academyScenarios.$inferSelect;
export type InsertAcademyScenario = z.infer<typeof insertAcademyScenarioSchema>;
export type AcademyScenarioNode = typeof academyScenarioNodes.$inferSelect;
export type InsertAcademyScenarioNode = z.infer<typeof insertAcademyScenarioNodeSchema>;
export type AcademyScenarioRun = typeof academyScenarioRuns.$inferSelect;
export type InsertAcademyScenarioRun = z.infer<typeof insertAcademyScenarioRunSchema>;
export type AcademyChoiceLog = typeof academyChoiceLogs.$inferSelect;
export type InsertAcademyChoiceLog = z.infer<typeof insertAcademyChoiceLogSchema>;
export type AcademyMarketListing = typeof academyMarketListings.$inferSelect;
export type InsertAcademyMarketListing = z.infer<typeof insertAcademyMarketListingSchema>;
export type AcademyPeerTrade = typeof academyPeerTrades.$inferSelect;
export type InsertAcademyPeerTrade = z.infer<typeof insertAcademyPeerTradeSchema>;
export type AcademyActivityFeedItem = typeof academyActivityFeed.$inferSelect;
export type InsertAcademyActivityFeedItem = z.infer<typeof insertAcademyActivityFeedSchema>;
export type AcademyAdminNote = typeof academyAdminNotes.$inferSelect;
export type InsertAcademyAdminNote = z.infer<typeof insertAcademyAdminNoteSchema>;
export type AcademyContentReport = typeof academyContentReports.$inferSelect;
export type InsertAcademyContentReport = z.infer<typeof insertAcademyContentReportSchema>;

// ==================== CAREER & PATHWAY SYSTEM ====================

export const careerFields = pgTable("career_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  description: text("description").notNull(),
  educationPath: text("education_path").notNull(),
  salaryRange: varchar("salary_range"),
  requiredSkills: text("required_skills").array(),
  relatedSubjects: text("related_subjects").array(),
  gradeLevel: varchar("grade_level"),
  iconName: varchar("icon_name"),
  sortOrder: integer("sort_order").default(0),
});

export const insertCareerFieldSchema = createInsertSchema(careerFields).omit({ id: true });
export type InsertCareerField = z.infer<typeof insertCareerFieldSchema>;
export type CareerField = typeof careerFields.$inferSelect;

export const careerMilestones = pgTable("career_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gradeLevel: integer("grade_level").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  awardName: varchar("award_name"),
  awardDescription: text("award_description"),
  requirements: text("requirements"),
  sortOrder: integer("sort_order").default(0),
});

export const insertCareerMilestoneSchema = createInsertSchema(careerMilestones).omit({ id: true });
export type InsertCareerMilestone = z.infer<typeof insertCareerMilestoneSchema>;
export type CareerMilestone = typeof careerMilestones.$inferSelect;

export const pathwayPlans = pgTable("pathway_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name").notNull(),
  currentGrade: integer("current_grade").notNull().default(6),
  primaryCareerInterest: varchar("primary_career_interest"),
  secondaryCareerInterest: varchar("secondary_career_interest"),
  educationPathType: varchar("education_path_type"),
  goals: jsonb("goals"),
  completedMilestones: text("completed_milestones").array(),
  revisionsThisYear: integer("revisions_this_year").notNull().default(0),
  lastRevisionDate: timestamp("last_revision_date"),
  status: varchar("status").notNull().default("active"),
  advisorId: varchar("advisor_id"),
  advisorName: varchar("advisor_name"),
  lockedForRevision: boolean("locked_for_revision").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPathwayPlanSchema = createInsertSchema(pathwayPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPathwayPlan = z.infer<typeof insertPathwayPlanSchema>;
export type PathwayPlan = typeof pathwayPlans.$inferSelect;

export const planRevisions = pgTable("plan_revisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull(),
  userId: varchar("user_id").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  requestReason: text("request_reason").notNull(),
  previousSnapshot: jsonb("previous_snapshot"),
  newSnapshot: jsonb("new_snapshot"),
  status: varchar("status").notNull().default("pending"),
  parentNotified: boolean("parent_notified").notNull().default(false),
  facultyApproved: boolean("faculty_approved").notNull().default(false),
  approvedBy: varchar("approved_by"),
  approvedByName: varchar("approved_by_name"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlanRevisionSchema = createInsertSchema(planRevisions).omit({ id: true, createdAt: true });
export type InsertPlanRevision = z.infer<typeof insertPlanRevisionSchema>;
export type PlanRevision = typeof planRevisions.$inferSelect;

export const mentorProfiles = pgTable("mentor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  title: varchar("title").notNull(),
  organization: varchar("organization"),
  careerField: varchar("career_field").notNull(),
  bio: text("bio"),
  expertise: text("expertise").array(),
  availability: varchar("availability"),
  contactEmail: varchar("contact_email"),
  yearsExperience: integer("years_experience"),
  isActive: boolean("is_active").notNull().default(true),
  isExample: boolean("is_example").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).omit({ id: true, createdAt: true });
export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;
export type MentorProfile = typeof mentorProfiles.$inferSelect;

export const mentorRequests = pgTable("mentor_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  studentName: varchar("student_name").notNull(),
  mentorId: varchar("mentor_id").notNull(),
  mentorName: varchar("mentor_name").notNull(),
  careerField: varchar("career_field").notNull(),
  message: text("message"),
  status: varchar("status").notNull().default("pending"),
  approvedBy: varchar("approved_by"),
  approvedByName: varchar("approved_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMentorRequestSchema = createInsertSchema(mentorRequests).omit({ id: true, createdAt: true });
export type InsertMentorRequest = z.infer<typeof insertMentorRequestSchema>;
export type MentorRequest = typeof mentorRequests.$inferSelect;

export const alumniProfiles = pgTable("alumni_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  currentRole: varchar("current_role"),
  currentOrganization: varchar("current_organization"),
  careerField: varchar("career_field"),
  educationPath: varchar("education_path"),
  bio: text("bio"),
  isAmbassador: boolean("is_ambassador").notNull().default(false),
  isChampion: boolean("is_champion").notNull().default(false),
  achievements: text("achievements").array(),
  willingToMentor: boolean("willing_to_mentor").notNull().default(false),
  contactPreference: varchar("contact_preference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlumniProfileSchema = createInsertSchema(alumniProfiles).omit({ id: true, createdAt: true });
export type InsertAlumniProfile = z.infer<typeof insertAlumniProfileSchema>;
export type AlumniProfile = typeof alumniProfiles.$inferSelect;

export const gisContextData = pgTable("gis_context_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  geographyKey: varchar("geography_key").notNull(),
  geographyType: varchar("geography_type").notNull().default("tract"),
  sviPercentile: real("svi_percentile"),
  healthBurdenComposite: real("health_burden_composite"),
  crimeTrendPercentile: real("crime_trend_percentile"),
  povertyRate: real("poverty_rate"),
  unemploymentRate: real("unemployment_rate"),
  housingInstabilityIndex: real("housing_instability_index"),
  foodDesertIndicator: real("food_desert_indicator"),
  educationAttainmentRate: real("education_attainment_rate"),
  substanceAbuseRate: real("substance_abuse_rate"),
  medianIncome: real("median_income"),
  totalPopulation: integer("total_population"),
  contextLoadIndex: real("context_load_index"),
  dataSource: varchar("data_source"),
  dataYear: integer("data_year"),
  rawPlacesData: jsonb("raw_places_data"),
  rawSviData: jsonb("raw_svi_data"),
  rawCrimeData: jsonb("raw_crime_data"),
  rawCensusData: jsonb("raw_census_data"),
  rawFoodAccessData: jsonb("raw_food_access_data"),
  rawHudData: jsonb("raw_hud_data"),
  rawSamhsaData: jsonb("raw_samhsa_data"),
  rawEducationData: jsonb("raw_education_data"),
  rawBlsData: jsonb("raw_bls_data"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationName: varchar("location_name"),
  stateCode: varchar("state_code", { length: 2 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGisContextDataSchema = createInsertSchema(gisContextData).omit({ id: true, updatedAt: true });
export type InsertGisContextData = z.infer<typeof insertGisContextDataSchema>;
export type GisContextData = typeof gisContextData.$inferSelect;

export const studentSelfAssessments = pgTable("student_self_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  assessmentType: varchar("assessment_type").notNull().default("daily_checkin"),
  energyLevel: integer("energy_level"),
  stressLevel: integer("stress_level"),
  focusLevel: integer("focus_level"),
  belongingLevel: integer("belonging_level"),
  confidenceLevel: integer("confidence_level"),
  moodRating: integer("mood_rating"),
  reflectionText: text("reflection_text"),
  goalsForToday: text("goals_for_today"),
  gratitudeNote: text("gratitude_note"),
  needsSupport: boolean("needs_support").notNull().default(false),
  supportType: varchar("support_type"),
  consentGiven: boolean("consent_given").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudentSelfAssessmentSchema = createInsertSchema(studentSelfAssessments).omit({ id: true, createdAt: true });
export type InsertStudentSelfAssessment = z.infer<typeof insertStudentSelfAssessmentSchema>;
export type StudentSelfAssessment = typeof studentSelfAssessments.$inferSelect;

export const thriveScores = pgTable("thrive_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  domainAScore: real("domain_a_score").notNull().default(50),
  domainATrend: varchar("domain_a_trend").notNull().default("flat"),
  domainBScore: real("domain_b_score").notNull().default(50),
  domainBTrend: varchar("domain_b_trend").notNull().default("flat"),
  domainCScore: real("domain_c_score").notNull().default(50),
  domainCTrend: varchar("domain_c_trend").notNull().default("flat"),
  domainDScore: real("domain_d_score"),
  domainDTrend: varchar("domain_d_trend"),
  domainDActive: boolean("domain_d_active").notNull().default(false),
  domainEScore: real("domain_e_score").notNull().default(50),
  domainETrend: varchar("domain_e_trend").notNull().default("flat"),
  domainFScore: real("domain_f_score").notNull().default(50),
  domainFTrend: varchar("domain_f_trend").notNull().default("flat"),
  compositeScore: real("composite_score").notNull().default(50),
  compositeTrend: varchar("composite_trend").notNull().default("flat"),
  flagLevel: varchar("flag_level"),
  flagDomains: text("flag_domains").array(),
  nextBestActions: jsonb("next_best_actions"),
  geographyKey: varchar("geography_key"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertThriveScoreSchema = createInsertSchema(thriveScores).omit({ id: true, updatedAt: true });
export type InsertThriveScore = z.infer<typeof insertThriveScoreSchema>;
export type ThriveScore = typeof thriveScores.$inferSelect;

export const thriveHistory = pgTable("thrive_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  domainAScore: real("domain_a_score"),
  domainBScore: real("domain_b_score"),
  domainCScore: real("domain_c_score"),
  domainDScore: real("domain_d_score"),
  domainEScore: real("domain_e_score"),
  domainFScore: real("domain_f_score"),
  compositeScore: real("composite_score"),
  flagLevel: varchar("flag_level"),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
});

export const insertThriveHistorySchema = createInsertSchema(thriveHistory).omit({ id: true, snapshotDate: true });
export type InsertThriveHistory = z.infer<typeof insertThriveHistorySchema>;
export type ThriveHistory = typeof thriveHistory.$inferSelect;

export const earlyWarningFlags = pgTable("early_warning_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  flagLevel: varchar("flag_level").notNull(),
  triggerClass: varchar("trigger_class").notNull(),
  whatChanged: text("what_changed").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  navigationAction: text("navigation_action").notNull(),
  thirtyDayTarget: text("thirty_day_target").notNull(),
  affectedDomains: text("affected_domains").array(),
  playbookId: varchar("playbook_id"),
  assignedAdvisorId: varchar("assigned_advisor_id"),
  status: varchar("status").notNull().default("active"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  resolutionNotes: text("resolution_notes"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEarlyWarningFlagSchema = createInsertSchema(earlyWarningFlags).omit({ id: true, createdAt: true });
export type InsertEarlyWarningFlag = z.infer<typeof insertEarlyWarningFlagSchema>;
export type EarlyWarningFlag = typeof earlyWarningFlags.$inferSelect;

export const interventionPlaybooks = pgTable("intervention_playbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  triggerClass: varchar("trigger_class").notNull(),
  flagLevel: varchar("flag_level").notNull(),
  objective: text("objective").notNull(),
  scripts: jsonb("scripts"),
  resourceOptions: jsonb("resource_options"),
  thirtyDayTargets: jsonb("thirty_day_targets"),
  followUpCadence: varchar("follow_up_cadence"),
  successIndicators: jsonb("success_indicators"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterventionPlaybookSchema = createInsertSchema(interventionPlaybooks).omit({ id: true, createdAt: true });
export type InsertInterventionPlaybook = z.infer<typeof insertInterventionPlaybookSchema>;
export type InterventionPlaybook = typeof interventionPlaybooks.$inferSelect;

export const thriveConfig = pgTable("thrive_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key").notNull(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ThriveConfig = typeof thriveConfig.$inferSelect;

export const gisResourceOverlays = pgTable("gis_resource_overlays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  geographyKey: varchar("geography_key"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: varchar("address"),
  contactInfo: varchar("contact_info"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GisResourceOverlay = typeof gisResourceOverlays.$inferSelect;

// ==================== GAME PLATFORM TABLES ====================

export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameType: varchar("game_type").notNull(),
  mode: varchar("mode").notNull(),
  status: varchar("status").notNull().default("waiting"),
  difficulty: varchar("difficulty"),
  createdBy: varchar("created_by"),
  timeLimitSeconds: integer("time_limit_seconds"),
  state: jsonb("state"),
  winnerId: varchar("winner_id"),
  scores: jsonb("scores"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ id: true, createdAt: true });
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

export const gamePlayers = pgTable("game_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  userId: varchar("user_id"),
  seat: integer("seat").notNull(),
  isCpu: boolean("is_cpu").notNull().default(false),
  cpuDifficulty: varchar("cpu_difficulty"),
  ratingBefore: integer("rating_before"),
  ratingAfter: integer("rating_after"),
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).omit({ id: true });
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
export type GamePlayer = typeof gamePlayers.$inferSelect;

export const playerRatings = pgTable("player_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameType: varchar("game_type").notNull(),
  rating: integer("rating").notNull().default(1200),
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlayerRatingSchema = createInsertSchema(playerRatings).omit({ id: true, updatedAt: true });
export type InsertPlayerRating = z.infer<typeof insertPlayerRatingSchema>;
export type PlayerRating = typeof playerRatings.$inferSelect;

export const playSessions = pgTable("play_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameType: varchar("game_type").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  durationMinutes: integer("duration_minutes"),
  flagged: boolean("flagged").notNull().default(false),
});

export const insertPlaySessionSchema = createInsertSchema(playSessions).omit({ id: true, startedAt: true });
export type InsertPlaySession = z.infer<typeof insertPlaySessionSchema>;
export type PlaySession = typeof playSessions.$inferSelect;

export const studentReflections = pgTable("student_reflections", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  studentName: text("student_name").notNull(),
  entryDate: text("entry_date").notNull(),
  period: text("period").notNull().default("daily"),
  content: text("content").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentReflectionSchema = createInsertSchema(studentReflections).omit({ id: true, createdAt: true });
export type InsertStudentReflection = z.infer<typeof insertStudentReflectionSchema>;
export type StudentReflection = typeof studentReflections.$inferSelect;

export const announcements = pgTable("announcements", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  createdByUserId: varchar("created_by_user_id", { length: 255 }).notNull(),
  createdByName: text("created_by_name").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export const academyEvents = pgTable("academy_events", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  category: text("category").notNull().default("school"),
  createdByUserId: varchar("created_by_user_id", { length: 255 }).notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAcademyEventSchema = createInsertSchema(academyEvents).omit({ id: true, createdAt: true });
export type InsertAcademyEvent = z.infer<typeof insertAcademyEventSchema>;
export type AcademyEvent = typeof academyEvents.$inferSelect;

export const attendanceLogs = pgTable("attendance_logs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  studentName: text("student_name").notNull(),
  loginDate: text("login_date").notNull(),
  loginTime: timestamp("login_time").defaultNow(),
});

export const insertAttendanceLogSchema = createInsertSchema(attendanceLogs).omit({ id: true, loginTime: true });
export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;

export const riskDecisions = pgTable("risk_decisions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  studentName: text("student_name").notNull(),
  featureArea: varchar("feature_area", { length: 50 }).notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  riskLevel: varchar("risk_level", { length: 20 }).notNull().default("moderate"),
  warningMessage: text("warning_message").notNull(),
  overrideChosen: boolean("override_chosen").notNull().default(false),
  metadata: jsonb("metadata"),
  financialLiteracyModule: varchar("financial_literacy_module", { length: 100 }),
  adminReviewed: boolean("admin_reviewed").notNull().default(false),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRiskDecisionSchema = createInsertSchema(riskDecisions).omit({ id: true, createdAt: true, adminReviewed: true, adminNotes: true });
export type InsertRiskDecision = z.infer<typeof insertRiskDecisionSchema>;
export type RiskDecision = typeof riskDecisions.$inferSelect;

export const riskNotificationSettings = pgTable("risk_notification_settings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  overrideCountThreshold: integer("override_count_threshold").notNull().default(3),
  tradeAmountThreshold: integer("trade_amount_threshold").notNull().default(500),
  notifyOnHighRisk: boolean("notify_on_high_risk").notNull().default(true),
  notifyOnEveryOverride: boolean("notify_on_every_override").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRiskNotificationSettingsSchema = createInsertSchema(riskNotificationSettings).omit({ id: true, updatedAt: true });
export type InsertRiskNotificationSettings = z.infer<typeof insertRiskNotificationSettingsSchema>;
export type RiskNotificationSettings = typeof riskNotificationSettings.$inferSelect;

// ==================== AI TOOLS TABLES ====================

export const aiToolCatalog = pgTable("ai_tool_catalog", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  toolKey: varchar("tool_key", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  iconName: text("icon_name").notNull(),
  gradeBand: text("grade_band").notNull().default("all"),
  requiredModuleKey: varchar("required_module_key", { length: 100 }),
  promptTemplate: text("prompt_template").notNull(),
  outputFormat: text("output_format").notNull().default("markdown"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertAiToolCatalogSchema = createInsertSchema(aiToolCatalog).omit({ id: true });
export type InsertAiToolCatalog = z.infer<typeof insertAiToolCatalogSchema>;
export type AiToolCatalog = typeof aiToolCatalog.$inferSelect;

export const aiToolUnlocks = pgTable("ai_tool_unlocks", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  toolId: varchar("tool_id", { length: 100 }).notNull().references(() => aiToolCatalog.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  unlockedVia: text("unlocked_via").notNull().default("module_completion"),
});

export const insertAiToolUnlocksSchema = createInsertSchema(aiToolUnlocks).omit({ id: true, unlockedAt: true });
export type InsertAiToolUnlocks = z.infer<typeof insertAiToolUnlocksSchema>;
export type AiToolUnlocks = typeof aiToolUnlocks.$inferSelect;

export const aiToolProjects = pgTable("ai_tool_projects", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  toolId: varchar("tool_id", { length: 100 }).notNull().references(() => aiToolCatalog.id),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  content: text("content").notNull().default(""),
  outputType: text("output_type").notNull().default("markdown"),
  status: text("status").notNull().default("draft"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiToolProjectsSchema = createInsertSchema(aiToolProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAiToolProjects = z.infer<typeof insertAiToolProjectsSchema>;
export type AiToolProjects = typeof aiToolProjects.$inferSelect;

export const aiToolAttachments = pgTable("ai_tool_attachments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id", { length: 100 }).notNull().references(() => aiToolProjects.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  objectPath: text("object_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertAiToolAttachmentsSchema = createInsertSchema(aiToolAttachments).omit({ id: true, uploadedAt: true });
export type InsertAiToolAttachments = z.infer<typeof insertAiToolAttachmentsSchema>;
export type AiToolAttachments = typeof aiToolAttachments.$inferSelect;

// ==================== ADMIN-CREATED COURSES (LMS COURSE CREATOR) ====================

export const academyCourses = pgTable("academy_courses", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  coverImage: text("cover_image"),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdByName: text("created_by_name").notNull(),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("private"),
  pricingType: text("pricing_type").notNull().default("free"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  enrollmentLimit: integer("enrollment_limit"),
  tags: text("tags").array(),
  prerequisites: text("prerequisites"),
  estimatedDuration: text("estimated_duration"),
  difficultyLevel: text("difficulty_level").notNull().default("beginner"),
  targetAudience: text("target_audience"),
  learningOutcomes: text("learning_outcomes").array(),
  certificateEnabled: boolean("certificate_enabled").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAcademyCourseSchema = createInsertSchema(academyCourses).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAcademyCourse = z.infer<typeof insertAcademyCourseSchema>;
export type AcademyCourse = typeof academyCourses.$inferSelect;

export const courseModules = pgTable("course_modules", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id", { length: 100 }).notNull().references(() => academyCourses.id),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true, createdAt: true });
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseModule = typeof courseModules.$inferSelect;

export const courseLessons = pgTable("course_lessons", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id", { length: 100 }).notNull().references(() => courseModules.id),
  title: text("title").notNull(),
  contentType: text("content_type").notNull().default("text"),
  content: text("content").notNull().default(""),
  videoUrl: text("video_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true, createdAt: true });
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type CourseLesson = typeof courseLessons.$inferSelect;

export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id", { length: 100 }).notNull().references(() => academyCourses.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name"),
  status: text("status").notNull().default("active"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progressPercent: integer("progress_percent").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true, enrolledAt: true });
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;

export const courseLessonProgress = pgTable("course_lesson_progress", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id", { length: 100 }).notNull().references(() => courseEnrollments.id),
  lessonId: varchar("lesson_id", { length: 100 }).notNull().references(() => courseLessons.id),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const insertCourseLessonProgressSchema = createInsertSchema(courseLessonProgress).omit({ id: true });
export type InsertCourseLessonProgress = z.infer<typeof insertCourseLessonProgressSchema>;
export type CourseLessonProgress = typeof courseLessonProgress.$inferSelect;

// ==================== STAAR TEST PREP TABLES ====================

export const staarStudyGuides = pgTable("staar_study_guides", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grade: integer("grade").notNull(),
  subject: text("subject").notNull(),
  topicName: text("topic_name").notNull(),
  tekCode: text("tek_code").notNull(),
  tekDescription: text("tek_description").notNull(),
  content: text("content").notNull(),
  keyVocabulary: text("key_vocabulary").array(),
  studyTips: text("study_tips").array(),
  difficultyLevel: text("difficulty_level").notNull().default("medium"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertStaarStudyGuideSchema = createInsertSchema(staarStudyGuides).omit({ id: true });
export type InsertStaarStudyGuide = z.infer<typeof insertStaarStudyGuideSchema>;
export type StaarStudyGuide = typeof staarStudyGuides.$inferSelect;

export const staarPracticeQuestions = pgTable("staar_practice_questions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id", { length: 100 }).notNull().references(() => staarStudyGuides.id),
  grade: integer("grade").notNull(),
  subject: text("subject").notNull(),
  tekCode: text("tek_code").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"),
  options: jsonb("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  difficultyLevel: text("difficulty_level").notNull().default("medium"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertStaarPracticeQuestionSchema = createInsertSchema(staarPracticeQuestions).omit({ id: true });
export type InsertStaarPracticeQuestion = z.infer<typeof insertStaarPracticeQuestionSchema>;
export type StaarPracticeQuestion = typeof staarPracticeQuestions.$inferSelect;

export const staarStudentAssessments = pgTable("staar_student_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  grade: integer("grade").notNull(),
  subject: text("subject").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  scorePercent: integer("score_percent").notNull(),
  timeSpentSeconds: integer("time_spent_seconds"),
  answers: jsonb("answers").notNull(),
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertStaarStudentAssessmentSchema = createInsertSchema(staarStudentAssessments).omit({ id: true, completedAt: true });
export type InsertStaarStudentAssessment = z.infer<typeof insertStaarStudentAssessmentSchema>;
export type StaarStudentAssessment = typeof staarStudentAssessments.$inferSelect;

export const staarTopicMastery = pgTable("staar_topic_mastery", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  grade: integer("grade").notNull(),
  subject: text("subject").notNull(),
  tekCode: text("tek_code").notNull(),
  topicName: text("topic_name").notNull(),
  totalAttempts: integer("total_attempts").notNull().default(0),
  correctAttempts: integer("correct_attempts").notNull().default(0),
  masteryLevel: text("mastery_level").notNull().default("not_started"),
  lastAttemptAt: timestamp("last_attempt_at"),
});

export const insertStaarTopicMasterySchema = createInsertSchema(staarTopicMastery).omit({ id: true });
export type InsertStaarTopicMastery = z.infer<typeof insertStaarTopicMasterySchema>;
export type StaarTopicMastery = typeof staarTopicMastery.$inferSelect;

// ==================== RESOURCE FINDER ====================

export const savedResources = pgTable("saved_resources", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  resourceName: text("resource_name").notNull(),
  resourceUrl: text("resource_url").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 200 }),
  stateCode: varchar("state_code", { length: 10 }),
  notes: text("notes"),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const insertSavedResourceSchema = createInsertSchema(savedResources).omit({ id: true, savedAt: true });
export type InsertSavedResource = z.infer<typeof insertSavedResourceSchema>;
export type SavedResource = typeof savedResources.$inferSelect;

export const resourceSearchHistory = pgTable("resource_search_history", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  stateCode: varchar("state_code", { length: 10 }),
  categories: text("categories").array(),
  query: text("query"),
  resultCount: integer("result_count"),
  searchedAt: timestamp("searched_at").defaultNow(),
});

export const insertResourceSearchHistorySchema = createInsertSchema(resourceSearchHistory).omit({ id: true, searchedAt: true });
export type InsertResourceSearchHistory = z.infer<typeof insertResourceSearchHistorySchema>;
export type ResourceSearchHistory = typeof resourceSearchHistory.$inferSelect;

export const reentryPlans = pgTable("reentry_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  caseManagerId: varchar("case_manager_id", { length: 255 }),
  phase: varchar("phase", { length: 50 }).notNull().default("pre_release"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  releaseDate: timestamp("release_date"),
  transitionStartDate: timestamp("transition_start_date"),
  stabilizationStartDate: timestamp("stabilization_start_date"),
  independenceStartDate: timestamp("independence_start_date"),
  completionDate: timestamp("completion_date"),
  riskLevel: varchar("risk_level", { length: 20 }).default("medium"),
  notes: text("notes"),
  goals: jsonb("goals"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReentryPlanSchema = createInsertSchema(reentryPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReentryPlan = z.infer<typeof insertReentryPlanSchema>;
export type ReentryPlan = typeof reentryPlans.$inferSelect;

export const reentryMilestones = pgTable("reentry_milestones", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  phase: varchar("phase", { length: 50 }).notNull(),
  evidence: jsonb("evidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReentryMilestoneSchema = createInsertSchema(reentryMilestones).omit({ id: true, createdAt: true });
export type InsertReentryMilestone = z.infer<typeof insertReentryMilestoneSchema>;
export type ReentryMilestone = typeof reentryMilestones.$inferSelect;

export const reentryIntakeAssessments = pgTable("reentry_intake_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  assessorId: varchar("assessor_id", { length: 255 }),
  educationHistory: jsonb("education_history"),
  employmentHistory: jsonb("employment_history"),
  housingStability: varchar("housing_stability", { length: 50 }),
  behavioralHealthNeeds: jsonb("behavioral_health_needs"),
  familySituation: jsonb("family_situation"),
  communitySupport: jsonb("community_support"),
  riskFactors: jsonb("risk_factors"),
  protectiveFactors: jsonb("protective_factors"),
  immediateNeeds: text("immediate_needs").array(),
  overallRiskScore: integer("overall_risk_score"),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReentryIntakeAssessmentSchema = createInsertSchema(reentryIntakeAssessments).omit({ id: true, createdAt: true });
export type InsertReentryIntakeAssessment = z.infer<typeof insertReentryIntakeAssessmentSchema>;
export type ReentryIntakeAssessment = typeof reentryIntakeAssessments.$inferSelect;

export const communityPartners = pgTable("community_partners", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 500 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 10 }),
  zipCode: varchar("zip_code", { length: 20 }),
  serviceCategories: text("service_categories").array(),
  serviceArea: text("service_area"),
  website: varchar("website", { length: 500 }),
  isVerified: boolean("is_verified").default(false),
  mouStatus: varchar("mou_status", { length: 50 }).default("none"),
  mouStartDate: timestamp("mou_start_date"),
  mouEndDate: timestamp("mou_end_date"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").default(true),
  hiringCommitments: integer("hiring_commitments").default(0),
  hiringFulfilled: integer("hiring_fulfilled").default(0),
  diversionReferrals: integer("diversion_referrals").default(0),
  volunteerCount: integer("volunteer_count").default(0),
  totalVolunteerHours: real("total_volunteer_hours").default(0),
  eventsHosted: integer("events_hosted").default(0),
  participantsServed: integer("participants_served").default(0),
  resourcesDistributed: integer("resources_distributed").default(0),
  facilitiesAvailable: text("facilities_available").array(),
  programsOffered: text("programs_offered").array(),
  specialCapabilities: jsonb("special_capabilities"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommunityPartnerSchema = createInsertSchema(communityPartners).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommunityPartner = z.infer<typeof insertCommunityPartnerSchema>;
export type CommunityPartner = typeof communityPartners.$inferSelect;

export const partnerReferrals = pgTable("partner_referrals", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  referredBy: varchar("referred_by", { length: 255 }).notNull(),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  notes: text("notes"),
  partnerNotes: text("partner_notes"),
  outcomeStatus: varchar("outcome_status", { length: 50 }),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPartnerReferralSchema = createInsertSchema(partnerReferrals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartnerReferral = z.infer<typeof insertPartnerReferralSchema>;
export type PartnerReferral = typeof partnerReferrals.$inferSelect;

export const partnerEngagements = pgTable("partner_engagements", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id", { length: 100 }).notNull(),
  engagementType: varchar("engagement_type", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  eventDate: timestamp("event_date"),
  volunteerHours: real("volunteer_hours").default(0),
  participantsServed: integer("participants_served").default(0),
  resourcesDistributed: integer("resources_distributed").default(0),
  facilityShared: boolean("facility_shared").default(false),
  facilityDetails: text("facility_details"),
  category: varchar("category", { length: 100 }),
  impactNotes: text("impact_notes"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnerEngagementSchema = createInsertSchema(partnerEngagements).omit({ id: true, createdAt: true });
export type InsertPartnerEngagement = z.infer<typeof insertPartnerEngagementSchema>;
export type PartnerEngagement = typeof partnerEngagements.$inferSelect;

export const mouDocuments = pgTable("mou_documents", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  terms: text("terms"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  signatoryName: varchar("signatory_name", { length: 255 }),
  signatoryTitle: varchar("signatory_title", { length: 255 }),
  signedDate: timestamp("signed_date"),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMouDocumentSchema = createInsertSchema(mouDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMouDocument = z.infer<typeof insertMouDocumentSchema>;
export type MouDocument = typeof mouDocuments.$inferSelect;

export const ambassadorProfiles = pgTable("ambassador_profiles", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 100 }).notNull().default("ambassador"),
  assignedCommunity: varchar("assigned_community", { length: 255 }),
  assignedRegion: varchar("assigned_region", { length: 255 }),
  bio: text("bio"),
  specializations: text("specializations").array(),
  partnerIds: text("partner_ids").array(),
  status: varchar("status", { length: 50 }).notNull().default("invited"),
  invitedAt: timestamp("invited_at").defaultNow(),
  onboardedAt: timestamp("onboarded_at"),
  lastActiveAt: timestamp("last_active_at"),
  totalEngagements: integer("total_engagements").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAmbassadorProfileSchema = createInsertSchema(ambassadorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAmbassadorProfile = z.infer<typeof insertAmbassadorProfileSchema>;
export type AmbassadorProfile = typeof ambassadorProfiles.$inferSelect;

export const grantOpportunities = pgTable("grant_opportunities", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 1000 }).notNull(),
  agency: varchar("agency", { length: 500 }),
  fundingAmount: varchar("funding_amount", { length: 100 }),
  deadline: timestamp("deadline"),
  description: text("description"),
  eligibilityCriteria: text("eligibility_criteria"),
  focusAreas: text("focus_areas").array(),
  grantType: varchar("grant_type", { length: 100 }),
  sourceUrl: varchar("source_url", { length: 1000 }),
  fitScore: integer("fit_score"),
  fitAnalysis: jsonb("fit_analysis"),
  readinessChecklist: jsonb("readiness_checklist"),
  status: varchar("status", { length: 50 }).default("identified"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGrantOpportunitySchema = createInsertSchema(grantOpportunities).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGrantOpportunity = z.infer<typeof insertGrantOpportunitySchema>;
export type GrantOpportunity = typeof grantOpportunities.$inferSelect;

export const outcomeTracking = pgTable("outcome_tracking", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  planId: varchar("plan_id", { length: 100 }),
  category: varchar("category", { length: 100 }).notNull(),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  metricValue: text("metric_value"),
  measurementDate: timestamp("measurement_date").defaultNow(),
  periodMonths: integer("period_months"),
  baseline: text("baseline"),
  target: text("target"),
  notes: text("notes"),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOutcomeTrackingSchema = createInsertSchema(outcomeTracking).omit({ id: true, createdAt: true });
export type InsertOutcomeTracking = z.infer<typeof insertOutcomeTrackingSchema>;
export type OutcomeTracking = typeof outcomeTracking.$inferSelect;

export const justiceReferrals = pgTable("justice_referrals", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  externalReferralId: varchar("external_referral_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  agencyName: varchar("agency_name", { length: 500 }).notNull(),
  agencyType: varchar("agency_type", { length: 100 }),
  referralDate: timestamp("referral_date").defaultNow(),
  releaseDate: timestamp("release_date"),
  supervisionLevel: varchar("supervision_level", { length: 50 }),
  supervisionRequirements: jsonb("supervision_requirements"),
  demographicData: jsonb("demographic_data"),
  offenseCategory: varchar("offense_category", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  assignedPlanId: varchar("assigned_plan_id", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJusticeReferralSchema = createInsertSchema(justiceReferrals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJusticeReferral = z.infer<typeof insertJusticeReferralSchema>;
export type JusticeReferral = typeof justiceReferrals.$inferSelect;

export const supervisionCompliance = pgTable("supervision_compliance", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  referralId: varchar("referral_id", { length: 100 }),
  complianceType: varchar("compliance_type", { length: 100 }).notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  notes: text("notes"),
  verifiedBy: varchar("verified_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupervisionComplianceSchema = createInsertSchema(supervisionCompliance).omit({ id: true, createdAt: true });
export type InsertSupervisionCompliance = z.infer<typeof insertSupervisionComplianceSchema>;
export type SupervisionCompliance = typeof supervisionCompliance.$inferSelect;

// ==================== WORKFORCE PIPELINE TABLES ====================

export const workforceAssessments = pgTable("workforce_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name").notNull(),
  skills: jsonb("skills").notNull().default([]),
  workHistory: jsonb("work_history").notNull().default([]),
  educationLevel: varchar("education_level", { length: 100 }).notNull().default(""),
  barriers: jsonb("barriers").notNull().default([]),
  careerInterests: jsonb("career_interests").notNull().default([]),
  readinessLevel: varchar("readiness_level", { length: 50 }).notNull().default("exploring"),
  assessmentData: jsonb("assessment_data").notNull().default({}),
  personalizedPlan: jsonb("personalized_plan").notNull().default({}),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkforceAssessmentSchema = createInsertSchema(workforceAssessments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkforceAssessment = z.infer<typeof insertWorkforceAssessmentSchema>;
export type WorkforceAssessment = typeof workforceAssessments.$inferSelect;

export const trainingPrograms = pgTable("training_programs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  programType: varchar("program_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  credentials: text("credentials").array().notNull().default(sql`'{}'::text[]`),
  durationWeeks: integer("duration_weeks"),
  cost: varchar("cost", { length: 100 }),
  location: text("location"),
  url: text("url"),
  eligibility: text("eligibility"),
  barrierFriendly: boolean("barrier_friendly").notNull().default(false),
  justiceInvolvedFriendly: boolean("justice_involved_friendly").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({ id: true, createdAt: true });
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type TrainingProgram = typeof trainingPrograms.$inferSelect;

export const trainingEnrollments = pgTable("training_enrollments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name").notNull(),
  programId: varchar("program_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("enrolled"),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  expectedCompletion: timestamp("expected_completion"),
  actualCompletion: timestamp("actual_completion"),
  attendanceRate: integer("attendance_rate"),
  credentialsEarned: text("credentials_earned").array().notNull().default(sql`'{}'::text[]`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrainingEnrollmentSchema = createInsertSchema(trainingEnrollments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrainingEnrollment = z.infer<typeof insertTrainingEnrollmentSchema>;
export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;

export const employerPartners = pgTable("employer_partners", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  industry: varchar("industry", { length: 100 }).notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  hiringCommitments: text("hiring_commitments"),
  barrierFriendly: boolean("barrier_friendly").notNull().default(false),
  banTheBox: boolean("ban_the_box").notNull().default(false),
  fairChanceHiring: boolean("fair_chance_hiring").notNull().default(false),
  description: text("description"),
  location: text("location"),
  website: text("website"),
  partnershipStatus: varchar("partnership_status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployerPartnerSchema = createInsertSchema(employerPartners).omit({ id: true, createdAt: true });
export type InsertEmployerPartner = z.infer<typeof insertEmployerPartnerSchema>;
export type EmployerPartner = typeof employerPartners.$inferSelect;

export const jobPostings = pgTable("job_postings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  wageRange: varchar("wage_range", { length: 100 }),
  hoursPerWeek: varchar("hours_per_week", { length: 50 }),
  benefits: text("benefits"),
  requirements: text("requirements"),
  barrierFriendly: boolean("barrier_friendly").notNull().default(false),
  location: text("location"),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({ id: true, createdAt: true });
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

export const jobPlacements = pgTable("job_placements", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: text("user_name").notNull(),
  employerId: varchar("employer_id", { length: 100 }).notNull(),
  employerName: text("employer_name").notNull(),
  jobTitle: text("job_title").notNull(),
  startDate: timestamp("start_date").notNull(),
  wage: varchar("wage", { length: 50 }),
  hoursPerWeek: integer("hours_per_week"),
  benefits: text("benefits"),
  placementSource: varchar("placement_source", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  endDate: timestamp("end_date"),
  endReason: text("end_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobPlacementSchema = createInsertSchema(jobPlacements).omit({ id: true, createdAt: true });
export type InsertJobPlacement = z.infer<typeof insertJobPlacementSchema>;
export type JobPlacement = typeof jobPlacements.$inferSelect;

export const retentionChecks = pgTable("retention_checks", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  placementId: varchar("placement_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  checkPeriodDays: integer("check_period_days").notNull(),
  employmentStatus: varchar("employment_status", { length: 50 }).notNull(),
  currentWage: varchar("current_wage", { length: 50 }),
  wageChange: varchar("wage_change", { length: 50 }),
  promoted: boolean("promoted").notNull().default(false),
  additionalCredentials: text("additional_credentials").array().notNull().default(sql`'{}'::text[]`),
  satisfactionRating: integer("satisfaction_rating"),
  notes: text("notes"),
  checkDate: timestamp("check_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRetentionCheckSchema = createInsertSchema(retentionChecks).omit({ id: true, createdAt: true });
export type InsertRetentionCheck = z.infer<typeof insertRetentionCheckSchema>;
export type RetentionCheck = typeof retentionChecks.$inferSelect;

export const jobReadinessChecklists = pgTable("job_readiness_checklists", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  resumeComplete: boolean("resume_complete").notNull().default(false),
  interviewSkills: boolean("interview_skills").notNull().default(false),
  professionalAttire: boolean("professional_attire").notNull().default(false),
  transportationPlan: boolean("transportation_plan").notNull().default(false),
  childcarePlan: boolean("childcare_plan").notNull().default(false),
  backgroundDisclosure: boolean("background_disclosure").notNull().default(false),
  bankAccount: boolean("bank_account").notNull().default(false),
  identificationDocs: boolean("identification_docs").notNull().default(false),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobReadinessChecklistSchema = createInsertSchema(jobReadinessChecklists).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobReadinessChecklist = z.infer<typeof insertJobReadinessChecklistSchema>;
export type JobReadinessChecklist = typeof jobReadinessChecklists.$inferSelect;

// ==================== INTAKE & SERVICE DELIVERY SYSTEM ====================

export const participantProfiles = pgTable("participant_profiles", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  preferredName: varchar("preferred_name", { length: 255 }),
  dateOfBirth: text("date_of_birth"),
  age: integer("age"),
  gender: varchar("gender", { length: 50 }),
  genderOther: varchar("gender_other", { length: 100 }),
  raceEthnicity: text("race_ethnicity").array(),
  veteranStatus: boolean("veteran_status").default(false),
  disabilityStatus: varchar("disability_status", { length: 50 }),
  disabilityDetails: text("disability_details"),
  primaryLanguage: varchar("primary_language", { length: 100 }).default("English"),
  needsInterpreter: boolean("needs_interpreter").default(false),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 10 }),
  zipCode: varchar("zip_code", { length: 20 }),
  housingStatus: varchar("housing_status", { length: 100 }),
  housingDetails: text("housing_details"),
  employmentStatus: varchar("employment_status", { length: 100 }),
  employmentHistory: text("employment_history"),
  educationLevel: varchar("education_level", { length: 100 }),
  educationDetails: text("education_details"),
  justiceInvolved: boolean("justice_involved").default(false),
  justiceDetails: jsonb("justice_details"),
  releaseDate: text("release_date"),
  supervisionStatus: varchar("supervision_status", { length: 100 }),
  healthNeeds: text("health_needs").array(),
  mentalHealthNeeds: text("mental_health_needs"),
  substanceUseHistory: varchar("substance_use_history", { length: 100 }),
  familySituation: text("family_situation"),
  dependents: integer("dependents").default(0),
  immediateNeeds: text("immediate_needs").array(),
  shortTermGoals: text("short_term_goals").array(),
  longTermGoals: text("long_term_goals").array(),
  referralSource: varchar("referral_source", { length: 100 }),
  referralSourceDetail: text("referral_source_detail"),
  referredBy: varchar("referred_by", { length: 255 }),
  assignedCaseManagerId: varchar("assigned_case_manager_id", { length: 255 }),
  assignedFacilitatorId: varchar("assigned_facilitator_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  intakeCompletedAt: timestamp("intake_completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertParticipantProfileSchema = createInsertSchema(participantProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertParticipantProfile = z.infer<typeof insertParticipantProfileSchema>;
export type ParticipantProfile = typeof participantProfiles.$inferSelect;

export const serviceRecords = pgTable("service_records", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  serviceCategory: varchar("service_category", { length: 100 }).notNull(),
  serviceType: varchar("service_type", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }),
  providerName: varchar("provider_name", { length: 255 }),
  serviceDate: text("service_date").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  outcome: varchar("outcome", { length: 100 }),
  followUpNeeded: boolean("follow_up_needed").default(false),
  followUpDate: text("follow_up_date"),
  followUpNotes: text("follow_up_notes"),
  status: varchar("status", { length: 50 }).notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceRecordSchema = createInsertSchema(serviceRecords).omit({ id: true, createdAt: true });
export type InsertServiceRecord = z.infer<typeof insertServiceRecordSchema>;
export type ServiceRecord = typeof serviceRecords.$inferSelect;

export const consentRecords = pgTable("consent_records", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  consentType: varchar("consent_type", { length: 100 }).notNull(),
  consentDescription: text("consent_description"),
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by", { length: 255 }),
  witnessName: varchar("witness_name", { length: 255 }),
  digitalSignature: text("digital_signature"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({ id: true, createdAt: true });
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;

export * from "./models/auth";
