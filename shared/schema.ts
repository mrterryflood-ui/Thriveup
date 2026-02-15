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
  empathyPrompt: text("empathy_prompt").notNull(), // IGN-style empathy hook
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
  contextLoadIndex: real("context_load_index"),
  dataSource: varchar("data_source"),
  dataYear: integer("data_year"),
  rawPlacesData: jsonb("raw_places_data"),
  rawSviData: jsonb("raw_svi_data"),
  rawCrimeData: jsonb("raw_crime_data"),
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

export * from "./models/auth";
