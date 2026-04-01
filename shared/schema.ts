import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, real, serial, numeric } from "drizzle-orm/pg-core";
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
  samgovId: varchar("samgov_id", { length: 255 }),
  samgovNoticeId: varchar("samgov_notice_id", { length: 255 }),
  category: varchar("category", { length: 100 }),
  postedDate: timestamp("posted_date"),
  responseDate: timestamp("response_date"),
  awardFloor: integer("award_floor"),
  awardCeiling: integer("award_ceiling"),
  estimatedFunding: integer("estimated_funding"),
  expectedAwards: integer("expected_awards"),
  cfda: varchar("cfda", { length: 50 }),
  source: varchar("source", { length: 50 }).default("manual"),
  aiAnalysis: jsonb("ai_analysis"),
  strengthsGaps: jsonb("strengths_gaps"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGrantOpportunitySchema = createInsertSchema(grantOpportunities).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGrantOpportunity = z.infer<typeof insertGrantOpportunitySchema>;
export type GrantOpportunity = typeof grantOpportunities.$inferSelect;

export const grantAlerts = pgTable("grant_alerts", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantId: varchar("grant_id", { length: 100 }).notNull(),
  alertType: varchar("alert_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  fitScore: integer("fit_score"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGrantAlertSchema = createInsertSchema(grantAlerts).omit({ id: true, createdAt: true });
export type InsertGrantAlert = z.infer<typeof insertGrantAlertSchema>;
export type GrantAlert = typeof grantAlerts.$inferSelect;

export const platformGaps = pgTable("platform_gaps", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantId: varchar("grant_id", { length: 100 }),
  area: varchar("area", { length: 255 }).notNull(),
  detail: text("detail").notNull(),
  effort: varchar("effort", { length: 20 }).default("medium"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 50 }).default("identified"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformGapSchema = createInsertSchema(platformGaps).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlatformGap = z.infer<typeof insertPlatformGapSchema>;
export type PlatformGap = typeof platformGaps.$inferSelect;

export const outcomeTracking = pgTable("outcome_tracking", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  planId: varchar("plan_id", { length: 100 }),
  cohortId: varchar("cohort_id", { length: 100 }),
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

// ==================== JUSTICE COMMAND CENTER TABLES ====================

export const juvenileCases = pgTable("juvenile_cases", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: varchar("case_number", { length: 100 }),
  youthAge: integer("youth_age"),
  ageGroup: varchar("age_group", { length: 50 }).notNull().default("adolescent"),
  gender: varchar("gender", { length: 50 }),
  raceEthnicity: varchar("race_ethnicity", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  county: varchar("county", { length: 100 }),
  stateCode: varchar("state_code", { length: 10 }),
  referralSource: varchar("referral_source", { length: 100 }).notNull(),
  referralType: varchar("referral_type", { length: 100 }),
  offenseCategory: varchar("offense_category", { length: 100 }),
  riskLevel: varchar("risk_level", { length: 50 }).default("moderate"),
  protectiveFactors: jsonb("protective_factors"),
  riskFactors: jsonb("risk_factors"),
  selScreeningScore: integer("sel_screening_score"),
  diversionEligible: boolean("diversion_eligible").default(false),
  diversionProgramId: varchar("diversion_program_id", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("intake"),
  assignedSpecialistId: varchar("assigned_specialist_id", { length: 255 }),
  parentGuardianContact: jsonb("parent_guardian_contact"),
  schoolInfo: jsonb("school_info"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJuvenileCaseSchema = createInsertSchema(juvenileCases).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJuvenileCase = z.infer<typeof insertJuvenileCaseSchema>;
export type JuvenileCase = typeof juvenileCases.$inferSelect;

export const courtServices = pgTable("court_services", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id", { length: 100 }),
  courtName: varchar("court_name", { length: 500 }).notNull(),
  courtType: varchar("court_type", { length: 100 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 255 }),
  judgeAssigned: varchar("judge_assigned", { length: 255 }),
  hearingDate: timestamp("hearing_date"),
  hearingType: varchar("hearing_type", { length: 100 }),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  serviceDescription: text("service_description"),
  courtOrderRequirements: jsonb("court_order_requirements"),
  complianceStatus: varchar("compliance_status", { length: 50 }).default("pending"),
  alternativeSentencing: jsonb("alternative_sentencing"),
  restorativeJusticeEligible: boolean("restorative_justice_eligible").default(false),
  diversionRecommended: boolean("diversion_recommended").default(false),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  outcomeSummary: text("outcome_summary"),
  nextActionDate: timestamp("next_action_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCourtServiceSchema = createInsertSchema(courtServices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourtService = z.infer<typeof insertCourtServiceSchema>;
export type CourtService = typeof courtServices.$inferSelect;

export const selPrograms = pgTable("sel_programs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  programName: varchar("program_name", { length: 500 }).notNull(),
  targetAgeGroup: varchar("target_age_group", { length: 50 }).notNull(),
  selCompetency: varchar("sel_competency", { length: 100 }).notNull(),
  description: text("description"),
  curriculum: jsonb("curriculum"),
  facilitatorId: varchar("facilitator_id", { length: 255 }),
  location: varchar("location", { length: 500 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  zipCode: varchar("zip_code", { length: 20 }),
  stateCode: varchar("state_code", { length: 10 }),
  maxCapacity: integer("max_capacity"),
  currentEnrollment: integer("current_enrollment").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  sessionFrequency: varchar("session_frequency", { length: 50 }),
  fidelityScore: integer("fidelity_score"),
  prePostAssessment: jsonb("pre_post_assessment"),
  outcomeMetrics: jsonb("outcome_metrics"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  evidenceBase: varchar("evidence_base", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSelProgramSchema = createInsertSchema(selPrograms).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSelProgram = z.infer<typeof insertSelProgramSchema>;
export type SelProgram = typeof selPrograms.$inferSelect;

export const preventionPrograms = pgTable("prevention_programs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  programName: varchar("program_name", { length: 500 }).notNull(),
  programType: varchar("program_type", { length: 100 }).notNull(),
  targetPopulation: varchar("target_population", { length: 255 }).notNull(),
  description: text("description"),
  interventionLevel: varchar("intervention_level", { length: 50 }).notNull().default("primary"),
  deliveryModel: varchar("delivery_model", { length: 100 }),
  stakeholderTypes: text("stakeholder_types").array(),
  neighborhoodsFocus: text("neighborhoods_focus").array(),
  stateCode: varchar("state_code", { length: 10 }),
  zipCodes: text("zip_codes").array(),
  institutionalBarriersAddressed: text("institutional_barriers_addressed").array(),
  communityPartnersInvolved: text("community_partners_involved").array(),
  roleModelMentors: jsonb("role_model_mentors"),
  faithBasedPartners: jsonb("faith_based_partners"),
  fatherEngagementComponent: boolean("father_engagement_component").default(false),
  educationComponent: jsonb("education_component"),
  fidelityProtocol: jsonb("fidelity_protocol"),
  fidelityScore: integer("fidelity_score"),
  outcomeMetrics: jsonb("outcome_metrics"),
  enrollmentCount: integer("enrollment_count").default(0),
  successRate: real("success_rate"),
  costPerParticipant: real("cost_per_participant"),
  fundingSource: varchar("funding_source", { length: 500 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPreventionProgramSchema = createInsertSchema(preventionPrograms).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPreventionProgram = z.infer<typeof insertPreventionProgramSchema>;
export type PreventionProgram = typeof preventionPrograms.$inferSelect;

export const justiceStakeholders = pgTable("justice_stakeholders", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 500 }).notNull(),
  organizationName: varchar("organization_name", { length: 500 }),
  stakeholderType: varchar("stakeholder_type", { length: 100 }).notNull(),
  role: varchar("role", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  stateCode: varchar("state_code", { length: 10 }),
  zipCode: varchar("zip_code", { length: 20 }),
  serviceArea: text("service_area").array(),
  specializations: text("specializations").array(),
  populationsServed: text("populations_served").array(),
  isActive: boolean("is_active").default(true),
  verificationStatus: varchar("verification_status", { length: 50 }).default("pending"),
  communicationPreference: varchar("communication_preference", { length: 50 }).default("email"),
  engagementLevel: varchar("engagement_level", { length: 50 }).default("moderate"),
  referralCapacity: integer("referral_capacity"),
  currentCaseload: integer("current_caseload").default(0),
  successStories: jsonb("success_stories"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJusticeStakeholderSchema = createInsertSchema(justiceStakeholders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJusticeStakeholder = z.infer<typeof insertJusticeStakeholderSchema>;
export type JusticeStakeholder = typeof justiceStakeholders.$inferSelect;

export const neighborhoodIntelligence = pgTable("neighborhood_intelligence", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  neighborhood: varchar("neighborhood", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  county: varchar("county", { length: 100 }),
  stateCode: varchar("state_code", { length: 10 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  populationEstimate: integer("population_estimate"),
  youthPopulation: integer("youth_population"),
  medianIncome: real("median_income"),
  povertyRate: real("poverty_rate"),
  unemploymentRate: real("unemployment_rate"),
  crimeIndex: real("crime_index"),
  violentCrimeRate: real("violent_crime_rate"),
  propertyCrimeRate: real("property_crime_rate"),
  juvenileOffenseRate: real("juvenile_offense_rate"),
  schoolDropoutRate: real("school_dropout_rate"),
  substanceAbuseIndex: real("substance_abuse_index"),
  mentalHealthAccessScore: real("mental_health_access_score"),
  communityResourceScore: real("community_resource_score"),
  hotspotLevel: varchar("hotspot_level", { length: 50 }).default("low"),
  activeProgramsCount: integer("active_programs_count").default(0),
  activeStakeholdersCount: integer("active_stakeholders_count").default(0),
  institutionalBarriers: jsonb("institutional_barriers"),
  communityAssets: jsonb("community_assets"),
  trendDirection: varchar("trend_direction", { length: 50 }).default("stable"),
  lastAssessmentDate: timestamp("last_assessment_date"),
  dataSource: varchar("data_source", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNeighborhoodIntelligenceSchema = createInsertSchema(neighborhoodIntelligence).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNeighborhoodIntelligence = z.infer<typeof insertNeighborhoodIntelligenceSchema>;
export type NeighborhoodIntelligence = typeof neighborhoodIntelligence.$inferSelect;

export const trendAlerts = pgTable("trend_alerts", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  alertType: varchar("alert_type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 50 }).notNull().default("moderate"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  affectedArea: varchar("affected_area", { length: 255 }),
  affectedNeighborhoods: text("affected_neighborhoods").array(),
  stateCode: varchar("state_code", { length: 10 }),
  trendData: jsonb("trend_data"),
  patternType: varchar("pattern_type", { length: 100 }),
  dataPoints: jsonb("data_points"),
  predictedTrajectory: varchar("predicted_trajectory", { length: 50 }),
  recommendedActions: jsonb("recommended_actions"),
  relatedPrograms: text("related_programs").array(),
  stakeholdersNotified: text("stakeholders_notified").array(),
  acknowledgedBy: varchar("acknowledged_by", { length: 255 }),
  resolvedDate: timestamp("resolved_date"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrendAlertSchema = createInsertSchema(trendAlerts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrendAlert = z.infer<typeof insertTrendAlertSchema>;
export type TrendAlert = typeof trendAlerts.$inferSelect;

export const cycleBreakingSessions = pgTable("cycle_breaking_sessions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }),
  sessionType: varchar("session_type", { length: 100 }).notNull(),
  targetCycle: varchar("target_cycle", { length: 255 }).notNull(),
  neighborhoodContext: varchar("neighborhood_context", { length: 255 }),
  stateCode: varchar("state_code", { length: 10 }),
  populationFocus: varchar("population_focus", { length: 100 }),
  currentPatterns: jsonb("current_patterns"),
  identifiedBarriers: jsonb("identified_barriers"),
  proposedInterventions: jsonb("proposed_interventions"),
  aiRecommendations: jsonb("ai_recommendations"),
  implementationPlan: jsonb("implementation_plan"),
  stakeholdersInvolved: text("stakeholders_involved").array(),
  expectedOutcomes: jsonb("expected_outcomes"),
  timelineWeeks: integer("timeline_weeks"),
  fidelityCheckpoints: jsonb("fidelity_checkpoints"),
  wizardStep: integer("wizard_step").default(1),
  wizardTotalSteps: integer("wizard_total_steps").default(7),
  status: varchar("status", { length: 50 }).notNull().default("in_progress"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCycleBreakingSessionSchema = createInsertSchema(cycleBreakingSessions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCycleBreakingSession = z.infer<typeof insertCycleBreakingSessionSchema>;
export type CycleBreakingSession = typeof cycleBreakingSessions.$inferSelect;

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

export const navigatorConversations = pgTable("navigator_conversations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull().default("New Conversation"),
  summary: text("summary"),
  identifiedNeeds: text("identified_needs").array(),
  userContext: jsonb("user_context"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const navigatorMessages = pgTable("navigator_messages", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNavigatorConversationSchema = createInsertSchema(navigatorConversations).omit({ id: true, createdAt: true, lastMessageAt: true });
export type InsertNavigatorConversation = z.infer<typeof insertNavigatorConversationSchema>;
export type NavigatorConversation = typeof navigatorConversations.$inferSelect;

export const insertNavigatorMessageSchema = createInsertSchema(navigatorMessages).omit({ id: true, createdAt: true });
export type InsertNavigatorMessage = z.infer<typeof insertNavigatorMessageSchema>;
export type NavigatorMessage = typeof navigatorMessages.$inferSelect;

// ==================== SANKOFA HEALTH NETWORK TABLES ====================

export const healthAssessments = pgTable("health_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assessmentType: varchar("assessment_type", { length: 100 }).notNull(),
  productLine: varchar("product_line", { length: 100 }).notNull(),
  questions: jsonb("questions").notNull().default([]),
  scoringRubric: jsonb("scoring_rubric"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHealthAssessmentSchema = createInsertSchema(healthAssessments).omit({ id: true, createdAt: true });
export type InsertHealthAssessment = z.infer<typeof insertHealthAssessmentSchema>;
export type HealthAssessment = typeof healthAssessments.$inferSelect;

export const healthScreeningResults = pgTable("health_screening_results", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  assessmentId: varchar("assessment_id", { length: 100 }).notNull(),
  assessmentType: varchar("assessment_type", { length: 100 }).notNull(),
  responses: jsonb("responses").notNull().default({}),
  totalScore: integer("total_score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(100),
  riskLevel: varchar("risk_level", { length: 50 }).notNull().default("low"),
  recommendations: text("recommendations").array(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertHealthScreeningResultSchema = createInsertSchema(healthScreeningResults).omit({ id: true, completedAt: true });
export type InsertHealthScreeningResult = z.infer<typeof insertHealthScreeningResultSchema>;
export type HealthScreeningResult = typeof healthScreeningResults.$inferSelect;

export const healthResourceCategories = pgTable("health_resource_categories", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  productLine: varchar("product_line", { length: 100 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertHealthResourceCategorySchema = createInsertSchema(healthResourceCategories).omit({ id: true });
export type InsertHealthResourceCategory = z.infer<typeof insertHealthResourceCategorySchema>;
export type HealthResourceCategory = typeof healthResourceCategories.$inferSelect;

export const wellnessResources = pgTable("wellness_resources", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  productLine: varchar("product_line", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  categoryId: varchar("category_id", { length: 100 }),
  resourceType: varchar("resource_type", { length: 100 }).notNull().default("article"),
  tags: text("tags").array(),
  iconName: text("icon_name").notNull().default("heart"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWellnessResourceSchema = createInsertSchema(wellnessResources).omit({ id: true, createdAt: true });
export type InsertWellnessResource = z.infer<typeof insertWellnessResourceSchema>;
export type WellnessResource = typeof wellnessResources.$inferSelect;
// ==================== MAP-GAP CQI ENGINE ====================

export const cqiCycles = pgTable("cqi_cycles", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  programArea: text("program_area").notNull(),
  phase: text("phase").notNull().default("map"),
  status: text("status").notNull().default("active"),
  createdBy: varchar("created_by", { length: 255 }),
  createdByName: text("created_by_name"),
  startDate: text("start_date"),
  targetEndDate: text("target_end_date"),
  actualEndDate: text("actual_end_date"),
  baselineMetrics: jsonb("baseline_metrics"),
  targetMetrics: jsonb("target_metrics"),
  actualMetrics: jsonb("actual_metrics"),
  lessonsLearned: text("lessons_learned"),
  framework: text("framework"),
  frameworkData: jsonb("framework_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCqiCycleSchema = createInsertSchema(cqiCycles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCqiCycle = z.infer<typeof insertCqiCycleSchema>;
export type CqiCycle = typeof cqiCycles.$inferSelect;

export const cqiGaps = pgTable("cqi_gaps", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  domain: text("domain").notNull(),
  severity: text("severity").notNull().default("medium"),
  currentState: text("current_state"),
  desiredState: text("desired_state"),
  rootCause: text("root_cause"),
  status: text("status").notNull().default("identified"),
  identifiedBy: varchar("identified_by", { length: 255 }),
  identifiedByName: text("identified_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCqiGapSchema = createInsertSchema(cqiGaps).omit({ id: true, createdAt: true });
export type InsertCqiGap = z.infer<typeof insertCqiGapSchema>;
export type CqiGap = typeof cqiGaps.$inferSelect;

export const cqiInterventions = pgTable("cqi_interventions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id", { length: 100 }).notNull(),
  gapId: varchar("gap_id", { length: 100 }),
  title: text("title").notNull(),
  description: text("description"),
  responsibleStaff: text("responsible_staff"),
  responsibleStaffId: varchar("responsible_staff_id", { length: 255 }),
  targetMetric: text("target_metric"),
  targetValue: text("target_value"),
  actualValue: text("actual_value"),
  status: text("status").notNull().default("planned"),
  startDate: text("start_date"),
  dueDate: text("due_date"),
  completedDate: text("completed_date"),
  notes: text("notes"),
  framework: text("framework"),
  frameworkConstruct: text("framework_construct"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCqiInterventionSchema = createInsertSchema(cqiInterventions).omit({ id: true, createdAt: true });
export type InsertCqiIntervention = z.infer<typeof insertCqiInterventionSchema>;
export type CqiIntervention = typeof cqiInterventions.$inferSelect;

export const cqiFidelityDefinitions = pgTable("cqi_fidelity_definitions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id", { length: 100 }),
  activityName: text("activity_name").notNull(),
  description: text("description"),
  expectedFrequency: text("expected_frequency").notNull(),
  frequencyUnit: text("frequency_unit").notNull().default("weekly"),
  programArea: text("program_area"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCqiFidelityDefinitionSchema = createInsertSchema(cqiFidelityDefinitions).omit({ id: true, createdAt: true });
export type InsertCqiFidelityDefinition = z.infer<typeof insertCqiFidelityDefinitionSchema>;
export type CqiFidelityDefinition = typeof cqiFidelityDefinitions.$inferSelect;

export const cqiFidelityObservations = pgTable("cqi_fidelity_observations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  definitionId: varchar("definition_id", { length: 100 }).notNull(),
  observedDate: text("observed_date").notNull(),
  wasCompleted: boolean("was_completed").notNull().default(true),
  observedBy: varchar("observed_by", { length: 255 }),
  observedByName: text("observed_by_name"),
  notes: text("notes"),
  qualityScore: integer("quality_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCqiFidelityObservationSchema = createInsertSchema(cqiFidelityObservations).omit({ id: true, createdAt: true });
export type InsertCqiFidelityObservation = z.infer<typeof insertCqiFidelityObservationSchema>;
export type CqiFidelityObservation = typeof cqiFidelityObservations.$inferSelect;

export const cqiOutcomes = pgTable("cqi_outcomes", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id", { length: 100 }).notNull(),
  outcomeType: text("outcome_type").notNull(),
  metricName: text("metric_name").notNull(),
  baselineValue: text("baseline_value"),
  targetValue: text("target_value"),
  actualValue: text("actual_value"),
  measurementDate: text("measurement_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCqiOutcomeSchema = createInsertSchema(cqiOutcomes).omit({ id: true, createdAt: true });
export type InsertCqiOutcome = z.infer<typeof insertCqiOutcomeSchema>;
export type CqiOutcome = typeof cqiOutcomes.$inferSelect;

// ==================== PILOT DATA & DOSAGE TRACKING ====================

export const pilotCohorts = pgTable("pilot_cohorts", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  targetPopulation: text("target_population").notNull(),
  targetSize: integer("target_size").notNull().default(30),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("planning"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPilotCohortSchema = createInsertSchema(pilotCohorts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPilotCohort = z.infer<typeof insertPilotCohortSchema>;
export type PilotCohort = typeof pilotCohorts.$inferSelect;

export const cohortEnrollments = pgTable("cohort_enrollments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id", { length: 100 }).notNull().references(() => pilotCohorts.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  participantName: text("participant_name").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const insertCohortEnrollmentSchema = createInsertSchema(cohortEnrollments).omit({ id: true, enrolledAt: true });
export type InsertCohortEnrollment = z.infer<typeof insertCohortEnrollmentSchema>;
export type CohortEnrollment = typeof cohortEnrollments.$inferSelect;

export const engagementDosageLogs = pgTable("engagement_dosage_logs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  cohortId: varchar("cohort_id", { length: 100 }),
  toolType: varchar("tool_type", { length: 100 }).notNull(),
  toolName: text("tool_name").notNull(),
  durationMinutes: real("duration_minutes").notNull(),
  sessionDate: text("session_date").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEngagementDosageLogSchema = createInsertSchema(engagementDosageLogs).omit({ id: true, createdAt: true });
export type InsertEngagementDosageLog = z.infer<typeof insertEngagementDosageLogSchema>;
export type EngagementDosageLog = typeof engagementDosageLogs.$inferSelect;

// ==================== YOUTH SUBSTANCE PREVENTION ====================

export const preventionModules = pgTable("prevention_modules", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  substanceTopic: text("substance_topic").notNull(),
  ageGroup: text("age_group").notNull(),
  contentSections: jsonb("content_sections").notNull().default([]),
  learningObjectives: jsonb("learning_objectives").notNull().default([]),
  knowledgeCheckQuestions: jsonb("knowledge_check_questions").notNull().default([]),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertPreventionModuleSchema = createInsertSchema(preventionModules).omit({ id: true });
export type InsertPreventionModule = z.infer<typeof insertPreventionModuleSchema>;
export type PreventionModule = typeof preventionModules.$inferSelect;

export const preventionProgress = pgTable("prevention_progress", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id", { length: 255 }).notNull(),
  moduleId: varchar("module_id", { length: 100 }).notNull().references(() => preventionModules.id),
  status: text("status").notNull().default("not_started"),
  score: integer("score").notNull().default(0),
  completedAt: timestamp("completed_at"),
});

export const insertPreventionProgressSchema = createInsertSchema(preventionProgress).omit({ id: true });
export type InsertPreventionProgress = z.infer<typeof insertPreventionProgressSchema>;
export type PreventionProgress = typeof preventionProgress.$inferSelect;

export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id", { length: 255 }).notNull(),
  assessmentType: text("assessment_type").notNull(),
  responses: jsonb("responses").notNull().default({}),
  riskScore: integer("risk_score").notNull().default(0),
  protectiveScore: integer("protective_score").notNull().default(0),
  recommendations: jsonb("recommendations").notNull().default([]),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({ id: true });
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;

export const youthSurveys = pgTable("youth_surveys", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questions: jsonb("questions").notNull().default([]),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertYouthSurveySchema = createInsertSchema(youthSurveys).omit({ id: true, createdAt: true });
export type InsertYouthSurvey = z.infer<typeof insertYouthSurveySchema>;
export type YouthSurvey = typeof youthSurveys.$inferSelect;

export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id", { length: 100 }).notNull().references(() => youthSurveys.id),
  demographicData: jsonb("demographic_data").notNull().default({}),
  responses: jsonb("responses").notNull().default({}),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, submittedAt: true });
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;

// ==================== DFC COALITION MANAGEMENT ====================

export const coalitions = pgTable("coalitions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  mission: text("mission"),
  formationDate: text("formation_date"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  metadata: jsonb("metadata"),
});

export const insertCoalitionSchema = createInsertSchema(coalitions).omit({ id: true });
export type InsertCoalition = z.infer<typeof insertCoalitionSchema>;
export type Coalition = typeof coalitions.$inferSelect;

export const coalitionSectors = pgTable("coalition_sectors", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  coalitionId: varchar("coalition_id", { length: 100 }).notNull(),
  sectorNumber: integer("sector_number").notNull(),
  sectorName: text("sector_name").notNull(),
  description: text("description"),
  isRepresented: boolean("is_represented").notNull().default(false),
  representativeNames: jsonb("representative_names"),
});

export const insertCoalitionSectorSchema = createInsertSchema(coalitionSectors).omit({ id: true });
export type InsertCoalitionSector = z.infer<typeof insertCoalitionSectorSchema>;
export type CoalitionSector = typeof coalitionSectors.$inferSelect;

export const coalitionMembers = pgTable("coalition_members", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  coalitionId: varchar("coalition_id", { length: 100 }).notNull(),
  sectorId: varchar("sector_id", { length: 100 }),
  partnerId: varchar("partner_id", { length: 100 }),
  memberName: text("member_name").notNull(),
  role: text("role"),
  organization: text("organization"),
  email: text("email"),
  phone: text("phone"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertCoalitionMemberSchema = createInsertSchema(coalitionMembers).omit({ id: true, joinedAt: true });
export type InsertCoalitionMember = z.infer<typeof insertCoalitionMemberSchema>;
export type CoalitionMember = typeof coalitionMembers.$inferSelect;

export const coalitionMeetings = pgTable("coalition_meetings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  coalitionId: varchar("coalition_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  scheduledDate: text("scheduled_date"),
  location: text("location"),
  agenda: text("agenda"),
  minutes: text("minutes"),
  attendeeIds: jsonb("attendee_ids"),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
});

export const insertCoalitionMeetingSchema = createInsertSchema(coalitionMeetings).omit({ id: true });
export type InsertCoalitionMeeting = z.infer<typeof insertCoalitionMeetingSchema>;
export type CoalitionMeeting = typeof coalitionMeetings.$inferSelect;

export const coalitionActionItems = pgTable("coalition_action_items", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id", { length: 100 }),
  coalitionId: varchar("coalition_id", { length: 100 }).notNull(),
  description: text("description").notNull(),
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  completedAt: timestamp("completed_at"),
});

export const insertCoalitionActionItemSchema = createInsertSchema(coalitionActionItems).omit({ id: true, completedAt: true });
export type InsertCoalitionActionItem = z.infer<typeof insertCoalitionActionItemSchema>;
export type CoalitionActionItem = typeof coalitionActionItems.$inferSelect;

export const coalitionCapacityAssessments = pgTable("coalition_capacity_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  coalitionId: varchar("coalition_id", { length: 100 }).notNull(),
  assessorId: varchar("assessor_id", { length: 255 }),
  organizationalCapacity: integer("organizational_capacity").notNull().default(0),
  leadershipEffectiveness: integer("leadership_effectiveness").notNull().default(0),
  substanceAbuseKnowledge: integer("substance_abuse_knowledge").notNull().default(0),
  communityEngagement: integer("community_engagement").notNull().default(0),
  overallScore: integer("overall_score").notNull().default(0),
  recommendations: jsonb("recommendations"),
  assessedAt: timestamp("assessed_at").defaultNow(),
});

export const insertCoalitionCapacityAssessmentSchema = createInsertSchema(coalitionCapacityAssessments).omit({ id: true, assessedAt: true });
export type InsertCoalitionCapacityAssessment = z.infer<typeof insertCoalitionCapacityAssessmentSchema>;
export type CoalitionCapacityAssessment = typeof coalitionCapacityAssessments.$inferSelect;

export const communityActionPlans = pgTable("community_action_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  coalitionId: varchar("coalition_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  spfPhase: varchar("spf_phase", { length: 50 }).notNull().default("assessment"),
  goals: jsonb("goals"),
  objectives: jsonb("objectives"),
  strategies: jsonb("strategies"),
  responsibleParties: jsonb("responsible_parties"),
  timeline: jsonb("timeline"),
  evaluationMetrics: jsonb("evaluation_metrics"),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityActionPlanSchema = createInsertSchema(communityActionPlans).omit({ id: true, createdAt: true });
export type InsertCommunityActionPlan = z.infer<typeof insertCommunityActionPlanSchema>;
export type CommunityActionPlan = typeof communityActionPlans.$inferSelect;

export const costMatchRecords = pgTable("cost_match_records", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  coalitionId: varchar("coalition_id", { length: 100 }).notNull(),
  contributorName: text("contributor_name").notNull(),
  contributionType: varchar("contribution_type", { length: 50 }).notNull().default("cash"),
  description: text("description"),
  dollarValue: decimal("dollar_value", { precision: 12, scale: 2 }).notNull().default("0.00"),
  hoursContributed: decimal("hours_contributed", { precision: 8, scale: 2 }),
  dateRecorded: text("date_recorded"),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
});

export const insertCostMatchRecordSchema = createInsertSchema(costMatchRecords).omit({ id: true, verifiedAt: true });
export type InsertCostMatchRecord = z.infer<typeof insertCostMatchRecordSchema>;
export type CostMatchRecord = typeof costMatchRecords.$inferSelect;

// ==================== PARENT EDUCATION & FAMILY STRENGTHENING ====================

export const parentEducationModules = pgTable("parent_education_modules", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("substance_prevention"),
  contentSections: jsonb("content_sections").notNull().default([]),
  targetAudience: text("target_audience"),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertParentEducationModuleSchema = createInsertSchema(parentEducationModules).omit({ id: true });
export type InsertParentEducationModule = z.infer<typeof insertParentEducationModuleSchema>;
export type ParentEducationModule = typeof parentEducationModules.$inferSelect;

export const parentEducationProgress = pgTable("parent_education_progress", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id", { length: 255 }).notNull(),
  moduleId: varchar("module_id", { length: 100 }).notNull().references(() => parentEducationModules.id),
  status: varchar("status", { length: 50 }).notNull().default("not_started"),
  completedAt: timestamp("completed_at"),
});

export const insertParentEducationProgressSchema = createInsertSchema(parentEducationProgress).omit({ id: true, completedAt: true });
export type InsertParentEducationProgress = z.infer<typeof insertParentEducationProgressSchema>;
export type ParentEducationProgress = typeof parentEducationProgress.$inferSelect;

export const familyAssessments = pgTable("family_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id", { length: 255 }).notNull(),
  familyRiskFactors: jsonb("family_risk_factors").notNull().default({}),
  familyProtectiveFactors: jsonb("family_protective_factors").notNull().default({}),
  riskScore: integer("risk_score").notNull().default(0),
  protectiveScore: integer("protective_score").notNull().default(0),
  recommendations: jsonb("recommendations").notNull().default([]),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertFamilyAssessmentSchema = createInsertSchema(familyAssessments).omit({ id: true, completedAt: true });
export type InsertFamilyAssessment = z.infer<typeof insertFamilyAssessmentSchema>;
export type FamilyAssessment = typeof familyAssessments.$inferSelect;

// ==================== FIRST 30 DAYS ONBOARDING JOURNEY ====================

export const onboardingJourneyTemplates = pgTable("onboarding_journey_templates", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  population: varchar("population", { length: 100 }).notNull(),
  description: text("description").notNull(),
  totalDays: integer("total_days").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOnboardingJourneyTemplateSchema = createInsertSchema(onboardingJourneyTemplates).omit({ id: true, createdAt: true });
export type InsertOnboardingJourneyTemplate = z.infer<typeof insertOnboardingJourneyTemplateSchema>;
export type OnboardingJourneyTemplate = typeof onboardingJourneyTemplates.$inferSelect;

export const onboardingPhases = pgTable("onboarding_phases", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id", { length: 100 }).notNull(),
  weekNumber: integer("week_number").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertOnboardingPhaseSchema = createInsertSchema(onboardingPhases).omit({ id: true });
export type InsertOnboardingPhase = z.infer<typeof insertOnboardingPhaseSchema>;
export type OnboardingPhase = typeof onboardingPhases.$inferSelect;

export const onboardingMilestones = pgTable("onboarding_milestones", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  phaseId: varchar("phase_id", { length: 100 }).notNull(),
  templateId: varchar("template_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  milestoneType: varchar("milestone_type", { length: 100 }).notNull(),
  featureLink: text("feature_link"),
  serviceCategory: varchar("service_category", { length: 100 }),
  serviceHoursCredit: real("service_hours_credit").default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(true),
});

export const insertOnboardingMilestoneSchema = createInsertSchema(onboardingMilestones).omit({ id: true });
export type InsertOnboardingMilestone = z.infer<typeof insertOnboardingMilestoneSchema>;
export type OnboardingMilestone = typeof onboardingMilestones.$inferSelect;

export const onboardingJourneys = pgTable("onboarding_journeys", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  templateId: varchar("template_id", { length: 100 }).notNull(),
  participantName: text("participant_name").notNull(),
  population: varchar("population", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  currentPhaseWeek: integer("current_phase_week").notNull().default(1),
  startDate: text("start_date").notNull(),
  expectedEndDate: text("expected_end_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingJourneySchema = createInsertSchema(onboardingJourneys).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertOnboardingJourney = z.infer<typeof insertOnboardingJourneySchema>;
export type OnboardingJourney = typeof onboardingJourneys.$inferSelect;

export const onboardingMilestoneCompletions = pgTable("onboarding_milestone_completions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id", { length: 100 }).notNull(),
  milestoneId: varchar("milestone_id", { length: 100 }).notNull(),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  completedBy: varchar("completed_by", { length: 255 }),
  completedByName: text("completed_by_name"),
  notes: text("notes"),
  serviceRecordId: varchar("service_record_id", { length: 100 }),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertOnboardingMilestoneCompletionSchema = createInsertSchema(onboardingMilestoneCompletions).omit({ id: true, completedAt: true });
export type InsertOnboardingMilestoneCompletion = z.infer<typeof insertOnboardingMilestoneCompletionSchema>;
export type OnboardingMilestoneCompletion = typeof onboardingMilestoneCompletions.$inferSelect;

export const onboardingBaselineSnapshots = pgTable("onboarding_baseline_snapshots", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id", { length: 100 }).notNull(),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  snapshotType: varchar("snapshot_type", { length: 50 }).notNull().default("30_day"),
  thriveScores: jsonb("thrive_scores"),
  workforceAssessment: jsonb("workforce_assessment"),
  selfAssessmentAverages: jsonb("self_assessment_averages"),
  milestonesSummary: jsonb("milestones_summary"),
  totalServiceHours: real("total_service_hours").default(0),
  notes: text("notes"),
  capturedAt: timestamp("captured_at").defaultNow(),
});

export const insertOnboardingBaselineSnapshotSchema = createInsertSchema(onboardingBaselineSnapshots).omit({ id: true, capturedAt: true });
export type InsertOnboardingBaselineSnapshot = z.infer<typeof insertOnboardingBaselineSnapshotSchema>;
export type OnboardingBaselineSnapshot = typeof onboardingBaselineSnapshots.$inferSelect;

export const cqiCyclePhases = pgTable("cqi_cycle_phases", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id", { length: 100 }).notNull(),
  phase: text("phase").notNull(),
  enteredAt: timestamp("entered_at").defaultNow(),
  exitedAt: timestamp("exited_at"),
  notes: text("notes"),
  enteredBy: text("entered_by"),
});

export const insertCqiCyclePhaseSchema = createInsertSchema(cqiCyclePhases).omit({ id: true });
export type InsertCqiCyclePhase = z.infer<typeof insertCqiCyclePhaseSchema>;
export type CqiCyclePhase = typeof cqiCyclePhases.$inferSelect;

// ==================== GRANT NARRATIVE & LOGIC MODEL TABLES ====================

export const advisoryBoardMembers = pgTable("advisory_board_members", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  organization: text("organization"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  livedExperience: text("lived_experience"),
  bio: text("bio"),
  startDate: text("start_date"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdvisoryBoardMemberSchema = createInsertSchema(advisoryBoardMembers).omit({ id: true, createdAt: true });
export type InsertAdvisoryBoardMember = z.infer<typeof insertAdvisoryBoardMemberSchema>;
export type AdvisoryBoardMember = typeof advisoryBoardMembers.$inferSelect;

export const advisoryBoardMeetings = pgTable("advisory_board_meetings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  meetingDate: text("meeting_date").notNull(),
  location: text("location"),
  agenda: text("agenda"),
  minutes: text("minutes"),
  attendeeIds: text("attendee_ids").array().notNull().default(sql`'{}'::text[]`),
  decisions: text("decisions"),
  actionItems: text("action_items"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdvisoryBoardMeetingSchema = createInsertSchema(advisoryBoardMeetings).omit({ id: true, createdAt: true });
export type InsertAdvisoryBoardMeeting = z.infer<typeof insertAdvisoryBoardMeetingSchema>;
export type AdvisoryBoardMeeting = typeof advisoryBoardMeetings.$inferSelect;

export const staffingPlanEntries = pgTable("staffing_plan_entries", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  roleTitle: text("role_title").notNull(),
  grantRole: varchar("grant_role", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }),
  fte: varchar("fte", { length: 20 }).notNull().default("1.0"),
  qualifications: text("qualifications"),
  responsibilities: text("responsibilities"),
  currentStaff: text("current_staff"),
  status: varchar("status", { length: 50 }).notNull().default("planned"),
  grantProgram: varchar("grant_program", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffingPlanEntrySchema = createInsertSchema(staffingPlanEntries).omit({ id: true, createdAt: true });
export type InsertStaffingPlanEntry = z.infer<typeof insertStaffingPlanEntrySchema>;
export type StaffingPlanEntry = typeof staffingPlanEntries.$inferSelect;

// ==================== EVIDENCE-BASED PROGRAMS & ENVIRONMENTAL STRATEGIES ====================

export const evidenceBasedPrograms = pgTable("evidence_based_programs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  acronym: varchar("acronym", { length: 20 }),
  description: text("description").notNull(),
  targetPopulation: text("target_population").notNull(),
  ageRange: text("age_range").notNull(),
  evidenceLevel: text("evidence_level").notNull().default("promising"),
  outcomesDemo: text("outcomes_demo").array().notNull().default(sql`'{}'::text[]`),
  implementationReqs: text("implementation_reqs"),
  costEstimate: text("cost_estimate"),
  culturalAdaptability: text("cultural_adaptability"),
  fidelityMeasures: text("fidelity_measures"),
  registrySource: text("registry_source"),
  websiteUrl: text("website_url"),
  stakeholderFit: jsonb("stakeholder_fit").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEvidenceBasedProgramSchema = createInsertSchema(evidenceBasedPrograms).omit({ id: true, createdAt: true });
export type InsertEvidenceBasedProgram = z.infer<typeof insertEvidenceBasedProgramSchema>;
export type EvidenceBasedProgram = typeof evidenceBasedPrograms.$inferSelect;

export const ebpImplementations = pgTable("ebp_implementations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id", { length: 100 }).notNull(),
  coalitionId: varchar("coalition_id", { length: 100 }),
  status: text("status").notNull().default("exploring"),
  startDate: text("start_date"),
  fidelityScore: integer("fidelity_score"),
  dosageTarget: integer("dosage_target"),
  dosageActual: integer("dosage_actual"),
  participantsTarget: integer("participants_target"),
  participantsActual: integer("participants_actual"),
  implementationStage: text("implementation_stage").notNull().default("exploration"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEbpImplementationSchema = createInsertSchema(ebpImplementations).omit({ id: true, createdAt: true });
export type InsertEbpImplementation = z.infer<typeof insertEbpImplementationSchema>;
export type EbpImplementation = typeof ebpImplementations.$inferSelect;

export const environmentalStrategies = pgTable("environmental_strategies", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  responsibleSectors: text("responsible_sectors").array().notNull().default(sql`'{}'::text[]`),
  targetSubstances: text("target_substances").array().notNull().default(sql`'{}'::text[]`),
  expectedOutcomes: text("expected_outcomes"),
  implementationTimeline: text("implementation_timeline"),
  status: text("status").notNull().default("planned"),
  implementationStage: text("implementation_stage").notNull().default("exploration"),
  coalitionId: varchar("coalition_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnvironmentalStrategySchema = createInsertSchema(environmentalStrategies).omit({ id: true, createdAt: true });
export type InsertEnvironmentalStrategy = z.infer<typeof insertEnvironmentalStrategySchema>;
export type EnvironmentalStrategy = typeof environmentalStrategies.$inferSelect;

export const strategyMetrics = pgTable("strategy_metrics", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  strategyId: varchar("strategy_id", { length: 100 }).notNull(),
  metricName: text("metric_name").notNull(),
  baseline: text("baseline"),
  target: text("target"),
  actual: text("actual"),
  period: text("period"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStrategyMetricSchema = createInsertSchema(strategyMetrics).omit({ id: true, createdAt: true });
export type InsertStrategyMetric = z.infer<typeof insertStrategyMetricSchema>;
export type StrategyMetric = typeof strategyMetrics.$inferSelect;

export const cfirAssessments = pgTable("cfir_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id", { length: 100 }),
  strategyId: varchar("strategy_id", { length: 100 }),
  interventionCharacteristics: integer("intervention_characteristics").notNull().default(0),
  outerSetting: integer("outer_setting").notNull().default(0),
  innerSetting: integer("inner_setting").notNull().default(0),
  individuals: integer("individuals").notNull().default(0),
  implementationProcess: integer("implementation_process").notNull().default(0),
  overallScore: integer("overall_score").notNull().default(0),
  notes: text("notes"),
  assessorId: varchar("assessor_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCfirAssessmentSchema = createInsertSchema(cfirAssessments).omit({ id: true, createdAt: true });
export type InsertCfirAssessment = z.infer<typeof insertCfirAssessmentSchema>;
export type CfirAssessment = typeof cfirAssessments.$inferSelect;

// ==================== DFC REPORTING & COMMUNITY READINESS TABLES ====================

export const dfcCoreMeasures = pgTable("dfc_core_measures", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  surveyPeriod: text("survey_period").notNull(),
  periodType: text("period_type").notNull().default("baseline"),
  ageGroup: text("age_group").notNull(),
  alcoholPast30: real("alcohol_past_30").default(0),
  marijuanaPast30: real("marijuana_past_30").default(0),
  tobaccoPast30: real("tobacco_past_30").default(0),
  prescriptionPast30: real("prescription_past_30").default(0),
  perceptionOfRiskAlcohol: real("perception_of_risk_alcohol").default(0),
  perceptionOfRiskMarijuana: real("perception_of_risk_marijuana").default(0),
  parentalDisapproval: real("parental_disapproval").default(0),
  peerDisapproval: real("peer_disapproval").default(0),
  averageAgeFirstUse: real("average_age_first_use"),
  perceivedAvailability: real("perceived_availability").default(0),
  sampleSize: integer("sample_size").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDfcCoreMeasureSchema = createInsertSchema(dfcCoreMeasures).omit({ id: true, createdAt: true });
export type InsertDfcCoreMeasure = z.infer<typeof insertDfcCoreMeasureSchema>;
export type DfcCoreMeasure = typeof dfcCoreMeasures.$inferSelect;

export const dfcStakeholderSurveys = pgTable("dfc_stakeholder_surveys", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  populationType: text("population_type").notNull(),
  surveyPeriod: text("survey_period").notNull(),
  respondentCount: integer("respondent_count").default(0),
  questions: jsonb("questions").notNull().default([]),
  responses: jsonb("responses").notNull().default([]),
  summary: jsonb("summary").default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDfcStakeholderSurveySchema = createInsertSchema(dfcStakeholderSurveys).omit({ id: true, createdAt: true });
export type InsertDfcStakeholderSurvey = z.infer<typeof insertDfcStakeholderSurveySchema>;
export type DfcStakeholderSurvey = typeof dfcStakeholderSurveys.$inferSelect;

export const communityReadinessAssessments = pgTable("community_readiness_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  assessmentDate: text("assessment_date").notNull(),
  communityEfforts: integer("community_efforts").notNull().default(1),
  communityKnowledgeOfEfforts: integer("community_knowledge_of_efforts").notNull().default(1),
  leadership: integer("leadership").notNull().default(1),
  communityclimate: integer("community_climate").notNull().default(1),
  communityKnowledgeOfIssue: integer("community_knowledge_of_issue").notNull().default(1),
  resources: integer("resources").notNull().default(1),
  overallReadiness: real("overall_readiness").default(0),
  readinessStage: text("readiness_stage").default("No Awareness"),
  recommendations: text("recommendations").array().notNull().default(sql`'{}'::text[]`),
  assessorId: varchar("assessor_id", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityReadinessAssessmentSchema = createInsertSchema(communityReadinessAssessments).omit({ id: true, createdAt: true });
export type InsertCommunityReadinessAssessment = z.infer<typeof insertCommunityReadinessAssessmentSchema>;
export type CommunityReadinessAssessment = typeof communityReadinessAssessments.$inferSelect;

export const communityReadinessInterviews = pgTable("community_readiness_interviews", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id", { length: 100 }),
  intervieweeType: text("interviewee_type").notNull(),
  intervieweeName: text("interviewee_name"),
  interviewDate: text("interview_date").notNull(),
  responses: jsonb("responses").notNull().default({}),
  dimensionScores: jsonb("dimension_scores").default({}),
  notes: text("notes"),
  interviewerId: varchar("interviewer_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityReadinessInterviewSchema = createInsertSchema(communityReadinessInterviews).omit({ id: true, createdAt: true });
export type InsertCommunityReadinessInterview = z.infer<typeof insertCommunityReadinessInterviewSchema>;
export type CommunityReadinessInterview = typeof communityReadinessInterviews.$inferSelect;

// ==================== DFC READINESS & MEDIA CAMPAIGN TABLES ====================

export const mediaCampaigns = pgTable("media_campaigns", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  campaignType: text("campaign_type").notNull(),
  targetAudience: text("target_audience").notNull(),
  messagingGuidance: text("messaging_guidance"),
  status: text("status").notNull().default("planning"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  targetSubstance: text("target_substance"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  objectives: text("objectives"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMediaCampaignSchema = createInsertSchema(mediaCampaigns).omit({ id: true, createdAt: true });
export type InsertMediaCampaign = z.infer<typeof insertMediaCampaignSchema>;
export type MediaCampaign = typeof mediaCampaigns.$inferSelect;

export const campaignContent = pgTable("campaign_content", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id", { length: 100 }).notNull().references(() => mediaCampaigns.id),
  contentType: text("content_type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  platform: text("platform"),
  scheduledDate: text("scheduled_date"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignContentSchema = createInsertSchema(campaignContent).omit({ id: true, createdAt: true });
export type InsertCampaignContent = z.infer<typeof insertCampaignContentSchema>;
export type CampaignContent = typeof campaignContent.$inferSelect;

export const campaignMetrics = pgTable("campaign_metrics", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id", { length: 100 }).notNull().references(() => mediaCampaigns.id),
  metricDate: text("metric_date").notNull(),
  impressions: integer("impressions").default(0),
  interactions: integer("interactions").default(0),
  eventAttendance: integer("event_attendance").default(0),
  mediaMentions: integer("media_mentions").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignMetricSchema = createInsertSchema(campaignMetrics).omit({ id: true, createdAt: true });
export type InsertCampaignMetric = z.infer<typeof insertCampaignMetricSchema>;
export type CampaignMetric = typeof campaignMetrics.$inferSelect;

export const dfcReadinessItems = pgTable("dfc_readiness_items", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_started"),
  dueDate: text("due_date"),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDfcReadinessItemSchema = createInsertSchema(dfcReadinessItems).omit({ id: true, createdAt: true });
export type InsertDfcReadinessItem = z.infer<typeof insertDfcReadinessItemSchema>;
export type DfcReadinessItem = typeof dfcReadinessItems.$inferSelect;

export const stakeholderCommitments = pgTable("stakeholder_commitments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  sectorName: text("sector_name").notNull(),
  sectorNumber: integer("sector_number").notNull(),
  commitmentType: text("commitment_type").notNull(),
  description: text("description").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  status: text("status").notNull().default("pledged"),
  deliveredDate: text("delivered_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStakeholderCommitmentSchema = createInsertSchema(stakeholderCommitments).omit({ id: true, createdAt: true });
export type InsertStakeholderCommitment = z.infer<typeof insertStakeholderCommitmentSchema>;
export type StakeholderCommitment = typeof stakeholderCommitments.$inferSelect;

export const dfcWizardState = pgTable("dfc_wizard_state", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id", { length: 255 }).notNull(),
  wizardType: text("wizard_type").notNull(),
  currentStep: integer("current_step").notNull().default(0),
  completedSteps: jsonb("completed_steps").notNull().default([]),
  metadata: jsonb("metadata").notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDfcWizardStateSchema = createInsertSchema(dfcWizardState).omit({ id: true, updatedAt: true });
export type InsertDfcWizardState = z.infer<typeof insertDfcWizardStateSchema>;
export type DfcWizardState = typeof dfcWizardState.$inferSelect;

// ==================== CONTACT INQUIRIES ====================

export const contactInquiries = pgTable("contact_inquiries", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  inquiryType: text("inquiry_type").notNull().default("general"),
  organizationName: text("organization_name"),
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactInquirySchema = createInsertSchema(contactInquiries).omit({ id: true, createdAt: true });
export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;
export type ContactInquiry = typeof contactInquiries.$inferSelect;

// ==================== POST-AWARD PROGRAM MANAGEMENT ====================

export const grantProjects = pgTable("grant_projects", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantName: text("grant_name").notNull(),
  fundingSource: text("funding_source").notNull(),
  awardAmount: decimal("award_amount", { precision: 14, scale: 2 }).notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull().default("pre-award"),
  projectDirector: text("project_director"),
  description: text("description"),
  objectives: jsonb("objectives").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const staffingPlans = pgTable("staffing_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantProjectId: varchar("grant_project_id", { length: 100 }).notNull().references(() => grantProjects.id),
  positionTitle: text("position_title").notNull(),
  qualifications: text("qualifications"),
  fte: decimal("fte", { precision: 4, scale: 2 }).notNull().default("1.00"),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("planned"),
  hiredPersonName: text("hired_person_name"),
  startDate: text("start_date"),
});

export const facilityPlans = pgTable("facility_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantProjectId: varchar("grant_project_id", { length: 100 }).notNull().references(() => grantProjects.id),
  facilityType: text("facility_type").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  capacity: integer("capacity"),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("searching"),
  inKindContributor: text("in_kind_contributor"),
  notes: text("notes"),
});

export const programSchedules = pgTable("program_schedules", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantProjectId: varchar("grant_project_id", { length: 100 }).notNull().references(() => grantProjects.id),
  activityName: text("activity_name").notNull(),
  activityType: text("activity_type").notNull(),
  scheduledDate: text("scheduled_date"),
  recurrence: text("recurrence").notNull().default("one-time"),
  facilitator: text("facilitator"),
  location: text("location"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  attendeeCount: integer("attendee_count"),
});

export const inKindContributions = pgTable("in_kind_contributions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantProjectId: varchar("grant_project_id", { length: 100 }).notNull().references(() => grantProjects.id),
  contributorName: text("contributor_name").notNull(),
  contributorType: text("contributor_type").notNull(),
  contributionType: text("contribution_type").notNull(),
  description: text("description"),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  documentedDate: text("documented_date"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  matchCategory: text("match_category"),
});

export const complianceCalendar = pgTable("compliance_calendar", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantProjectId: varchar("grant_project_id", { length: 100 }).notNull().references(() => grantProjects.id),
  taskName: text("task_name").notNull(),
  taskType: text("task_type").notNull(),
  dueDate: text("due_date"),
  status: text("status").notNull().default("upcoming"),
  responsiblePerson: text("responsible_person"),
  notes: text("notes"),
});

export const sustainabilityPlans = pgTable("sustainability_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantProjectId: varchar("grant_project_id", { length: 100 }).notNull().references(() => grantProjects.id),
  strategy: text("strategy").notNull(),
  strategyType: text("strategy_type").notNull(),
  timeline: text("timeline"),
  status: text("status").notNull().default("exploring"),
  estimatedRevenue: decimal("estimated_revenue", { precision: 12, scale: 2 }),
  notes: text("notes"),
});

export const adjacentAgencies = pgTable("adjacent_agencies", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantProjectId: varchar("grant_project_id", { length: 100 }).notNull().references(() => grantProjects.id),
  agencyName: text("agency_name").notNull(),
  agencyType: text("agency_type").notNull(),
  focusArea: text("focus_area"),
  relationship: text("relationship").notNull().default("potential-partner"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  status: text("status").notNull().default("identified"),
});

export const insertGrantProjectSchema = createInsertSchema(grantProjects).omit({ id: true, createdAt: true });
export const insertStaffingPlanSchema = createInsertSchema(staffingPlans).omit({ id: true });
export const insertFacilityPlanSchema = createInsertSchema(facilityPlans).omit({ id: true });
export const insertProgramScheduleSchema = createInsertSchema(programSchedules).omit({ id: true });
export const insertInKindContributionSchema = createInsertSchema(inKindContributions).omit({ id: true });
export const insertComplianceCalendarSchema = createInsertSchema(complianceCalendar).omit({ id: true });
export const insertSustainabilityPlanSchema = createInsertSchema(sustainabilityPlans).omit({ id: true });
export const insertAdjacentAgencySchema = createInsertSchema(adjacentAgencies).omit({ id: true });

export type GrantProject = typeof grantProjects.$inferSelect;
export type InsertGrantProject = z.infer<typeof insertGrantProjectSchema>;
export type StaffingPlan = typeof staffingPlans.$inferSelect;
export type InsertStaffingPlan = z.infer<typeof insertStaffingPlanSchema>;
export type FacilityPlan = typeof facilityPlans.$inferSelect;
export type InsertFacilityPlan = z.infer<typeof insertFacilityPlanSchema>;
export type ProgramSchedule = typeof programSchedules.$inferSelect;
export type InsertProgramSchedule = z.infer<typeof insertProgramScheduleSchema>;
export type InKindContribution = typeof inKindContributions.$inferSelect;
export type InsertInKindContribution = z.infer<typeof insertInKindContributionSchema>;
export type ComplianceCalendarItem = typeof complianceCalendar.$inferSelect;
export type InsertComplianceCalendarItem = z.infer<typeof insertComplianceCalendarSchema>;
export type SustainabilityPlan = typeof sustainabilityPlans.$inferSelect;
export type InsertSustainabilityPlan = z.infer<typeof insertSustainabilityPlanSchema>;
export type AdjacentAgency = typeof adjacentAgencies.$inferSelect;
export type InsertAdjacentAgency = z.infer<typeof insertAdjacentAgencySchema>;

// ==================== FACILITATOR & CURRICULUM DELIVERY ====================

export const facilitatorProfiles = pgTable("facilitator_profiles", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id", { length: 255 }).notNull(),
  name: text("name").notNull(),
  certifications: jsonb("certifications").notNull().default([]),
  specializations: jsonb("specializations").notNull().default([]),
  clearanceLevel: text("clearance_level"),
  trainingCompleted: jsonb("training_completed").notNull().default([]),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFacilitatorProfileSchema = createInsertSchema(facilitatorProfiles).omit({ id: true, createdAt: true });
export type InsertFacilitatorProfile = z.infer<typeof insertFacilitatorProfileSchema>;
export type FacilitatorProfile = typeof facilitatorProfiles.$inferSelect;

export const sessionPlans = pgTable("session_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id", { length: 100 }),
  facilitatorId: varchar("facilitator_id", { length: 100 }).references(() => facilitatorProfiles.id),
  sessionDate: text("session_date").notNull(),
  duration: integer("duration").notNull(),
  location: text("location"),
  targetAudience: text("target_audience"),
  materialsNeeded: jsonb("materials_needed").notNull().default([]),
  learningObjectives: jsonb("learning_objectives").notNull().default([]),
  assessmentMethod: text("assessment_method"),
  status: text("status").notNull().default("draft"),
  attendeeCount: integer("attendee_count"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionPlanSchema = createInsertSchema(sessionPlans).omit({ id: true, createdAt: true });
export type InsertSessionPlan = z.infer<typeof insertSessionPlanSchema>;
export type SessionPlan = typeof sessionPlans.$inferSelect;

export const curriculumDeliveryLogs = pgTable("curriculum_delivery_logs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  sessionPlanId: varchar("session_plan_id", { length: 100 }).references(() => sessionPlans.id),
  facilitatorId: varchar("facilitator_id", { length: 100 }).references(() => facilitatorProfiles.id),
  actualDate: text("actual_date").notNull(),
  actualDuration: integer("actual_duration").notNull(),
  actualAttendeeCount: integer("actual_attendee_count").notNull().default(0),
  fidelityScore: integer("fidelity_score").notNull().default(3),
  adaptationsNoted: text("adaptations_noted"),
  challengesFaced: text("challenges_faced"),
  participantFeedback: text("participant_feedback"),
  followUpNeeded: boolean("follow_up_needed").notNull().default(false),
  dosageMinutes: integer("dosage_minutes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCurriculumDeliveryLogSchema = createInsertSchema(curriculumDeliveryLogs).omit({ id: true, createdAt: true });
export type InsertCurriculumDeliveryLog = z.infer<typeof insertCurriculumDeliveryLogSchema>;
export type CurriculumDeliveryLog = typeof curriculumDeliveryLogs.$inferSelect;

export const facilitatorCertifications = pgTable("facilitator_certifications", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  facilitatorId: varchar("facilitator_id", { length: 100 }).notNull().references(() => facilitatorProfiles.id),
  certificationName: text("certification_name").notNull(),
  certificationBody: text("certification_body"),
  dateEarned: text("date_earned"),
  expirationDate: text("expiration_date"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFacilitatorCertificationSchema = createInsertSchema(facilitatorCertifications).omit({ id: true, createdAt: true });
export type InsertFacilitatorCertification = z.infer<typeof insertFacilitatorCertificationSchema>;
export type FacilitatorCertification = typeof facilitatorCertifications.$inferSelect;

export const platformMetrics = pgTable("platform_metrics", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  metricName: text("metric_name").notNull(),
  metricCategory: text("metric_category").notNull(),
  currentValue: real("current_value").notNull().default(0),
  previousValue: real("previous_value").notNull().default(0),
  targetValue: real("target_value").notNull().default(0),
  unit: text("unit").notNull().default("count"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  trend: text("trend").notNull().default("stable"),
});

export const insertPlatformMetricSchema = createInsertSchema(platformMetrics).omit({ id: true, calculatedAt: true });
export type InsertPlatformMetric = z.infer<typeof insertPlatformMetricSchema>;
export type PlatformMetric = typeof platformMetrics.$inferSelect;

export const grantReminders = pgTable("grant_reminders", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  grantId: text("grant_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  category: text("category").notNull().default("task"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  phaseId: text("phase_id"),
  taskId: text("task_id"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertGrantReminderSchema = createInsertSchema(grantReminders).omit({ id: true, createdAt: true, completedAt: true });
export type InsertGrantReminder = z.infer<typeof insertGrantReminderSchema>;
export type GrantReminder = typeof grantReminders.$inferSelect;

export const grantChecklistItems = pgTable("grant_checklist_items", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  grantId: text("grant_id").notNull(),
  category: text("category").notNull(),
  item: text("item").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  dueDate: text("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGrantChecklistItemSchema = createInsertSchema(grantChecklistItems).omit({ id: true, createdAt: true, completedAt: true });
export type InsertGrantChecklistItem = z.infer<typeof insertGrantChecklistItemSchema>;
export type GrantChecklistItem = typeof grantChecklistItems.$inferSelect;

export const grantSectionDrafts = pgTable("grant_section_drafts", {
  id: varchar("id", { length: 200 }).primaryKey(),
  userId: text("user_id").notNull(),
  grantId: text("grant_id").notNull(),
  sectionId: text("section_id").notNull(),
  draftContent: text("draft_content").notNull().default(""),
  approvalStatus: text("approval_status").notNull().default("not-started"),
  reviewNotes: text("review_notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGrantSectionDraftSchema = createInsertSchema(grantSectionDrafts).omit({ createdAt: true, updatedAt: true });
export type InsertGrantSectionDraft = z.infer<typeof insertGrantSectionDraftSchema>;
export type GrantSectionDraft = typeof grantSectionDrafts.$inferSelect;

export const documentSignatures = pgTable("document_signatures", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  documentTitle: text("document_title").notNull(),
  documentContext: text("document_context"),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientOrg: varchar("recipient_org", { length: 500 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  signatureData: text("signature_data"),
  signedAt: timestamp("signed_at"),
  signerIp: varchar("signer_ip", { length: 100 }),
  expiresAt: timestamp("expires_at"),
  grantId: varchar("grant_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentSignatureSchema = createInsertSchema(documentSignatures).omit({ id: true, createdAt: true });
export type InsertDocumentSignature = z.infer<typeof insertDocumentSignatureSchema>;
export type DocumentSignature = typeof documentSignatures.$inferSelect;

export const ecosystemPlatforms = pgTable("ecosystem_platforms", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("registered"),
  lastHeartbeat: timestamp("last_heartbeat"),
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: varchar("health_status", { length: 50 }).default("unknown"),
  capabilities: jsonb("capabilities"),
  dataFlowConfig: jsonb("data_flow_config"),
  grantAlignment: jsonb("grant_alignment"),
  domain: varchar("domain", { length: 100 }),
  registeredAt: timestamp("registered_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ecosystemEvents = pgTable("ecosystem_events", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  sourcePlatformId: varchar("source_platform_id", { length: 100 }).notNull(),
  targetPlatformId: varchar("target_platform_id", { length: 100 }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ecosystemHealthLogs = pgTable("ecosystem_health_logs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at").defaultNow(),
});

export const insertEcosystemPlatformSchema = createInsertSchema(ecosystemPlatforms).omit({ registeredAt: true, updatedAt: true });
export type InsertEcosystemPlatform = z.infer<typeof insertEcosystemPlatformSchema>;
export type EcosystemPlatform = typeof ecosystemPlatforms.$inferSelect;

export const insertEcosystemEventSchema = createInsertSchema(ecosystemEvents).omit({ id: true, createdAt: true });
export type InsertEcosystemEvent = z.infer<typeof insertEcosystemEventSchema>;
export type EcosystemEvent = typeof ecosystemEvents.$inferSelect;

export type EcosystemHealthLog = typeof ecosystemHealthLogs.$inferSelect;

export const inboundFixes = pgTable("inbound_fixes", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  sourcePlatformId: text("source_platform_id").notNull(),
  targetPlatformId: text("target_platform_id").notNull().default("thriveup-academy"),
  confidence: integer("confidence").notNull().default(0),
  summary: text("summary").notNull(),
  files: jsonb("files").notNull().default([]),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInboundFixSchema = createInsertSchema(inboundFixes).omit({ id: true, createdAt: true, reviewedAt: true, appliedAt: true });
export type InsertInboundFix = z.infer<typeof insertInboundFixSchema>;
export type InboundFix = typeof inboundFixes.$inferSelect;

export const ecosystemDirectives = pgTable("ecosystem_directives", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  directiveType: varchar("directive_type", { length: 100 }).notNull(),
  content: text("content").notNull(),
  grantId: varchar("grant_id", { length: 100 }),
  targetPlatformIds: jsonb("target_platform_ids").notNull(),
  platformRoles: jsonb("platform_roles"),
  trackingRequirements: jsonb("tracking_requirements"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const ecosystemDirectiveAcks = pgTable("ecosystem_directive_acks", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  directiveId: varchar("directive_id", { length: 100 }).notNull(),
  platformId: varchar("platform_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  acknowledgedAt: timestamp("acknowledged_at"),
  responseData: jsonb("response_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEcosystemDirectiveSchema = createInsertSchema(ecosystemDirectives).omit({ id: true, createdAt: true });
export type InsertEcosystemDirective = z.infer<typeof insertEcosystemDirectiveSchema>;
export type EcosystemDirective = typeof ecosystemDirectives.$inferSelect;
export type EcosystemDirectiveAck = typeof ecosystemDirectiveAcks.$inferSelect;

export const communityStories = pgTable("community_stories", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  authorName: text("author_name").notNull(),
  authorNeighborhood: text("author_neighborhood"),
  storyType: varchar("story_type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  needsIdentified: text("needs_identified").array(),
  platformsRouted: text("platforms_routed").array(),
  resourcesConnected: jsonb("resources_connected"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  isAnonymous: boolean("is_anonymous").default(false),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityStorySchema = createInsertSchema(communityStories).omit({ id: true, createdAt: true, upvotes: true });
export type InsertCommunityStory = z.infer<typeof insertCommunityStorySchema>;
export type CommunityStory = typeof communityStories.$inferSelect;

export const programDesigns = pgTable("program_designs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }),
  title: text("title").notNull(),
  problemDomain: text("problem_domain").notNull(),
  threeRealities: jsonb("three_realities").notNull().default({}),
  communityContext: jsonb("community_context").notNull().default({}),
  recommendations: jsonb("recommendations"),
  grantAlignments: jsonb("grant_alignments"),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramDesignSchema = createInsertSchema(programDesigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProgramDesign = z.infer<typeof insertProgramDesignSchema>;
export type ProgramDesign = typeof programDesigns.$inferSelect;

export const ecosystemKnowledgeChunks = pgTable("ecosystem_knowledge_chunks", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type EcosystemKnowledgeChunk = typeof ecosystemKnowledgeChunks.$inferSelect;

export const videoRenderJobs = pgTable("video_render_jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  scriptContent: text("script_content").notNull(),
  sourceEventId: integer("source_event_id"),
  sourcePlatformId: varchar("source_platform_id", { length: 100 }),
  status: varchar("status", { length: 30 }).notNull().default("queued"),
  renderUrl: text("render_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  targetPlatforms: text("target_platforms").array().notNull().default(sql`'{}'::text[]`),
  distributionStatus: jsonb("distribution_status").default({}),
  mrssEntry: text("mrss_entry"),
  vastTag: text("vast_tag"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVideoRenderJobSchema = createInsertSchema(videoRenderJobs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVideoRenderJob = z.infer<typeof insertVideoRenderJobSchema>;
export type VideoRenderJob = typeof videoRenderJobs.$inferSelect;

export const rpliceAssessments = pgTable("rplice_assessments", {
  id: serial("id").primaryKey(),
  assessmentType: varchar("assessment_type", { length: 30 }).notNull(),
  programName: text("program_name").notNull(),
  data: jsonb("data").notNull().default({}),
  score: numeric("score"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRpliceAssessmentSchema = createInsertSchema(rpliceAssessments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRpliceAssessment = z.infer<typeof insertRpliceAssessmentSchema>;
export type RpliceAssessment = typeof rpliceAssessments.$inferSelect;

export const rpliceActionPlans = pgTable("rplice_action_plans", {
  id: serial("id").primaryKey(),
  regionName: text("region_name").notNull(),
  stateFips: varchar("state_fips", { length: 10 }).notNull(),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  analysisData: jsonb("analysis_data"),
  phases: jsonb("phases"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRpliceActionPlanSchema = createInsertSchema(rpliceActionPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRpliceActionPlan = z.infer<typeof insertRpliceActionPlanSchema>;
export type RpliceActionPlan = typeof rpliceActionPlans.$inferSelect;

export const outcomeBaselines = pgTable("outcome_baselines", {
  id: serial("id").primaryKey(),
  regionName: text("region_name").notNull(),
  stateFips: varchar("state_fips", { length: 10 }).notNull(),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  metrics: jsonb("metrics").notNull(),
  targets: jsonb("targets"),
  timelineMonths: integer("timeline_months").default(12),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOutcomeBaselineSchema = createInsertSchema(outcomeBaselines).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOutcomeBaseline = z.infer<typeof insertOutcomeBaselineSchema>;
export type OutcomeBaseline = typeof outcomeBaselines.$inferSelect;

export const mceContracts = pgTable("mce_contracts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  agency: text("agency").notNull(),
  value: numeric("value").default("0"),
  contractType: varchar("contract_type", { length: 30 }).notNull().default("prime"),
  stage: varchar("stage", { length: 30 }).notNull().default("opportunity"),
  certificationsRequired: text("certifications_required").array().notNull().default(sql`'{}'::text[]`),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  keyDates: jsonb("key_dates").default({}),
  obligatedAmount: numeric("obligated_amount").default("0"),
  expendedAmount: numeric("expended_amount").default("0"),
  inKindMatch: numeric("in_kind_match").default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMceContractSchema = createInsertSchema(mceContracts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMceContract = z.infer<typeof insertMceContractSchema>;
export type MceContract = typeof mceContracts.$inferSelect;

export const mceContractDeliverables = pgTable("mce_contract_deliverables", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  title: text("title").notNull(),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 30 }).notNull().default("not_started"),
  evidenceUrl: text("evidence_url"),
  rpliceReviewStatus: varchar("rplice_review_status", { length: 30 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMceContractDeliverableSchema = createInsertSchema(mceContractDeliverables).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMceContractDeliverable = z.infer<typeof insertMceContractDeliverableSchema>;
export type MceContractDeliverable = typeof mceContractDeliverables.$inferSelect;

export const mceVendors = pgTable("mce_vendors", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  phone: text("phone"),
  certifications: text("certifications").array().notNull().default(sql`'{}'::text[]`),
  capabilityStatementUrl: text("capability_statement_url"),
  pastPerformance: jsonb("past_performance").default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMceVendorSchema = createInsertSchema(mceVendors).omit({ id: true, createdAt: true });
export type InsertMceVendor = z.infer<typeof insertMceVendorSchema>;
export type MceVendor = typeof mceVendors.$inferSelect;

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  objectives: text("objectives").array().default([]),
  stakeholders: jsonb("stakeholders").default([]),
  timeline: jsonb("timeline").default({}),
  successCriteria: text("success_criteria").array().default([]),
  methodology: varchar("methodology", { length: 50 }).notNull().default("hybrid"),
  status: varchar("status", { length: 30 }).notNull().default("setup"),
  setupData: jsonb("setup_data").default({}),
  platformIds: text("platform_ids").array().default([]),
  grantIds: text("grant_ids").array().default([]),
  targetPopulation: text("target_population"),
  geographicFocus: text("geographic_focus"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export const programMilestones = pgTable("program_milestones", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  phase: varchar("phase", { length: 100 }),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  status: varchar("status", { length: 30 }).notNull().default("not_started"),
  assignee: text("assignee"),
  evidenceUrl: text("evidence_url"),
  deliverables: text("deliverables").array().default([]),
  dependencies: integer("dependencies").array().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramMilestoneSchema = createInsertSchema(programMilestones).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProgramMilestone = z.infer<typeof insertProgramMilestoneSchema>;
export type ProgramMilestone = typeof programMilestones.$inferSelect;

export const programRisks = pgTable("program_risks", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  likelihood: varchar("likelihood", { length: 20 }).notNull().default("medium"),
  impact: varchar("impact", { length: 20 }).notNull().default("medium"),
  mitigation: text("mitigation"),
  owner: text("owner"),
  status: varchar("status", { length: 30 }).notNull().default("identified"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgramRiskSchema = createInsertSchema(programRisks).omit({ id: true, createdAt: true });
export type InsertProgramRisk = z.infer<typeof insertProgramRiskSchema>;
export type ProgramRisk = typeof programRisks.$inferSelect;

export const programUpdates = pgTable("program_updates", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  authorName: text("author_name").notNull(),
  updateType: varchar("update_type", { length: 30 }).notNull().default("status"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgramUpdateSchema = createInsertSchema(programUpdates).omit({ id: true, createdAt: true });
export type InsertProgramUpdate = z.infer<typeof insertProgramUpdateSchema>;
export type ProgramUpdate = typeof programUpdates.$inferSelect;

export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  tierSlug: varchar("tier_slug", { length: 50 }).notNull(),
  tierName: text("tier_name").notNull(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  memberCount: integer("member_count"),
  amount: integer("amount_cents").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("pending"),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({ id: true, createdAt: true });
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;
export type ServiceOrder = typeof serviceOrders.$inferSelect;

export const consultationRequests = pgTable("consultation_requests", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  message: text("message"),
  status: varchar("status", { length: 30 }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConsultationRequestSchema = createInsertSchema(consultationRequests).omit({ id: true, createdAt: true });
export type InsertConsultationRequest = z.infer<typeof insertConsultationRequestSchema>;
export type ConsultationRequest = typeof consultationRequests.$inferSelect;

export const partnershipRequests = pgTable("partnership_requests", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  organizationName: varchar("organization_name", { length: 500 }).notNull(),
  organizationType: varchar("organization_type", { length: 100 }).notNull(),
  ein: varchar("ein", { length: 20 }),
  website: varchar("website", { length: 500 }),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactTitle: varchar("contact_title", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  mission: text("mission"),
  focusAreas: text("focus_areas").array(),
  geographicArea: varchar("geographic_area", { length: 255 }),
  populationsServed: text("populations_served").array(),
  collaborationInterests: text("collaboration_interests").array(),
  proposedActivities: text("proposed_activities"),
  annualBudget: varchar("annual_budget", { length: 100 }),
  staffSize: integer("staff_size"),
  yearsOperating: integer("years_operating"),
  existingPartnerships: text("existing_partnerships"),
  howHeardAboutUs: varchar("how_heard_about_us", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  reviewNotes: text("review_notes"),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at"),
  convertedPartnerId: varchar("converted_partner_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnershipRequestSchema = createInsertSchema(partnershipRequests).omit({ id: true, createdAt: true, reviewedAt: true, reviewedBy: true, convertedPartnerId: true });
export type InsertPartnershipRequest = z.infer<typeof insertPartnershipRequestSchema>;
export type PartnershipRequest = typeof partnershipRequests.$inferSelect;

export const sharedOutcomes = pgTable("shared_outcomes", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id", { length: 100 }).notNull(),
  outcomeName: varchar("outcome_name", { length: 500 }).notNull(),
  outcomeCategory: varchar("outcome_category", { length: 100 }).notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(),
  targetValue: real("target_value"),
  currentValue: real("current_value").default(0),
  unit: varchar("unit", { length: 50 }),
  reportingPeriod: varchar("reporting_period", { length: 50 }),
  partnerContribution: text("partner_contribution"),
  thriveUpContribution: text("thriveup_contribution"),
  dataSource: varchar("data_source", { length: 255 }),
  verificationMethod: varchar("verification_method", { length: 255 }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  lastReportedAt: timestamp("last_reported_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSharedOutcomeSchema = createInsertSchema(sharedOutcomes).omit({ id: true, createdAt: true });
export type InsertSharedOutcome = z.infer<typeof insertSharedOutcomeSchema>;
export type SharedOutcome = typeof sharedOutcomes.$inferSelect;

export const externalWarmHandoffs = pgTable("external_warm_handoffs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id", { length: 100 }).notNull(),
  direction: varchar("direction", { length: 20 }).notNull(),
  participantName: varchar("participant_name", { length: 255 }),
  participantId: varchar("participant_id", { length: 255 }),
  serviceNeeded: varchar("service_needed", { length: 255 }).notNull(),
  urgency: varchar("urgency", { length: 20 }).notNull().default("standard"),
  referralReason: text("referral_reason"),
  currentServices: text("current_services"),
  specialConsiderations: text("special_considerations"),
  contactMethod: varchar("contact_method", { length: 100 }),
  partnerContactName: varchar("partner_contact_name", { length: 255 }),
  partnerContactEmail: varchar("partner_contact_email", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("initiated"),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  outcomeNotes: text("outcome_notes"),
  followUpDate: timestamp("follow_up_date"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExternalWarmHandoffSchema = createInsertSchema(externalWarmHandoffs).omit({ id: true, createdAt: true });
export type InsertExternalWarmHandoff = z.infer<typeof insertExternalWarmHandoffSchema>;
export type ExternalWarmHandoff = typeof externalWarmHandoffs.$inferSelect;

export const agentExchanges = pgTable("agent_exchanges", {
  id: serial("id").primaryKey(),
  fromPlatformId: varchar("from_platform_id", { length: 100 }).notNull(),
  toPlatformId: varchar("to_platform_id", { length: 100 }).notNull(),
  exchangeType: varchar("exchange_type", { length: 50 }).notNull(),
  reasoning: text("reasoning").notNull(),
  purpose: text("purpose").notNull(),
  domainJustification: text("domain_justification"),
  data: jsonb("data"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  responseData: jsonb("response_data"),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentExchangeSchema = createInsertSchema(agentExchanges).omit({ id: true, createdAt: true });
export type InsertAgentExchange = z.infer<typeof insertAgentExchangeSchema>;
export type AgentExchange = typeof agentExchanges.$inferSelect;

export const benefitsEnrollmentData = pgTable("benefits_enrollment_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  countyName: varchar("county_name", { length: 100 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  tractId: varchar("tract_id", { length: 20 }),
  benefitType: varchar("benefit_type", { length: 50 }).notNull(),
  eligiblePopulation: integer("eligible_population"),
  enrolledPopulation: integer("enrolled_population"),
  participationRate: real("participation_rate"),
  enrollmentGap: integer("enrollment_gap"),
  barrierIndex: real("barrier_index"),
  limitedEnglishRate: real("limited_english_rate"),
  noVehicleRate: real("no_vehicle_rate"),
  noBroadbandRate: real("no_broadband_rate"),
  nonCitizenRate: real("non_citizen_rate"),
  povertyConcentration: real("poverty_concentration"),
  recommendedModality: varchar("recommended_modality", { length: 50 }),
  dataSource: varchar("data_source"),
  dataYear: integer("data_year"),
  rawData: jsonb("raw_data"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBenefitsEnrollmentDataSchema = createInsertSchema(benefitsEnrollmentData).omit({ id: true, updatedAt: true });
export type InsertBenefitsEnrollmentData = z.infer<typeof insertBenefitsEnrollmentDataSchema>;
export type BenefitsEnrollmentData = typeof benefitsEnrollmentData.$inferSelect;

export const benefitsPartners = pgTable("benefits_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationName: varchar("organization_name", { length: 200 }).notNull(),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  countyName: varchar("county_name", { length: 100 }).notNull(),
  partnerType: varchar("partner_type", { length: 50 }).notNull(),
  servicesProvided: text("services_provided").array(),
  benefitTypesServed: text("benefit_types_served").array(),
  languages: text("languages").array(),
  address: text("address"),
  zipCode: varchar("zip_code", { length: 10 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  contactName: varchar("contact_name", { length: 200 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  hhscCppLevel: integer("hhsc_cpp_level"),
  isVitaSite: boolean("is_vita_site").default(false),
  capacityStatus: varchar("capacity_status", { length: 50 }),
  coverageZipCodes: text("coverage_zip_codes").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBenefitsPartnerSchema = createInsertSchema(benefitsPartners).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefitsPartner = z.infer<typeof insertBenefitsPartnerSchema>;
export type BenefitsPartner = typeof benefitsPartners.$inferSelect;

export const benefitsChwNetwork = pgTable("benefits_chw_network", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  organizationId: varchar("organization_id"),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  zipCodes: text("zip_codes").array(),
  languages: text("languages").array(),
  specializations: text("specializations").array(),
  certifications: text("certifications").array(),
  activeClients: integer("active_clients").default(0),
  enrollmentsCompleted: integer("enrollments_completed").default(0),
  renewalsCompleted: integer("renewals_completed").default(0),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBenefitsChwSchema = createInsertSchema(benefitsChwNetwork).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefitsChw = z.infer<typeof insertBenefitsChwSchema>;
export type BenefitsChw = typeof benefitsChwNetwork.$inferSelect;

export const benefitsEnrollmentLog = pgTable("benefits_enrollment_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  benefitType: varchar("benefit_type", { length: 50 }).notNull(),
  enrollmentType: varchar("enrollment_type", { length: 20 }).notNull(),
  modality: varchar("modality", { length: 50 }),
  chwId: varchar("chw_id"),
  partnerId: varchar("partner_id"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBenefitsEnrollmentLogSchema = createInsertSchema(benefitsEnrollmentLog).omit({ id: true, createdAt: true });
export type InsertBenefitsEnrollmentLog = z.infer<typeof insertBenefitsEnrollmentLogSchema>;
export type BenefitsEnrollmentLog = typeof benefitsEnrollmentLog.$inferSelect;

export * from "./models/auth";
