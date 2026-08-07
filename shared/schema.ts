import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, real, serial, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ZCTA (ZIP Code Tabulation Area) to county FIPS lookup, loaded once from the
// U.S. Census Bureau's public ZCTA-to-County relationship file. When a ZCTA
// spans multiple counties, only the county with the largest population share
// is stored (primaryCounty) — this is a best-effort resolver, not a legal
// determination of county of residence for any individual.
export const zctaCountyMap = pgTable("zcta_county_map", {
  zip: varchar("zip", { length: 5 }).primaryKey(),
  countyFips: varchar("county_fips", { length: 5 }).notNull(),
  stateFips: varchar("state_fips", { length: 2 }).notNull(),
  popPct: real("pop_pct"),
  source: varchar("source", { length: 100 }).notNull().default("Census ZCTA-County Relationship File (2010)"),
  loadedAt: timestamp("loaded_at").defaultNow(),
});
export const insertZctaCountyMapSchema = createInsertSchema(zctaCountyMap).omit({ loadedAt: true });
export type InsertZctaCountyMap = z.infer<typeof insertZctaCountyMapSchema>;
export type ZctaCountyMap = typeof zctaCountyMap.$inferSelect;

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
  audience: text("audience").default("all"),
  priority: varchar("priority", { length: 20 }).default("normal"),
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
  entityName: varchar("entity_name", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGrantOpportunitySchema = createInsertSchema(grantOpportunities).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGrantOpportunity = z.infer<typeof insertGrantOpportunitySchema>;
export type GrantOpportunity = typeof grantOpportunities.$inferSelect;

export const proposalPipeline = pgTable("proposal_pipeline", {
  id: varchar("id", { length: 100 }).primaryKey(),
  priority: integer("priority").notNull().default(99),
  deadline: timestamp("deadline"),
  data: jsonb("data").notNull(),
  // Tabbara discipline (May 4 2026): read 20-30 prior award abstracts
  // before writing a single word of any proposal.
  priorAwardsReviewed: boolean("prior_awards_reviewed").notNull().default(false),
  priorAwardsCount: integer("prior_awards_count").notNull().default(0),
  priorAwardsNotes: text("prior_awards_notes"),
  priorAwardsLinks: jsonb("prior_awards_links"),
  priorAwardsReviewedAt: timestamp("prior_awards_reviewed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type ProposalPipelineRow = typeof proposalPipeline.$inferSelect;
export const priorAwardsResearchSchema = z.object({
  priorAwardsReviewed: z.boolean(),
  priorAwardsCount: z.number().int().min(0).max(10000),
  priorAwardsNotes: z.string().trim().max(10000).nullable().optional(),
  priorAwardsLinks: z.array(z.object({
    title: z.string().trim().max(500),
    url: z.string().trim().url().max(2000),
    pattern: z.string().trim().max(1000).optional(),
  })).max(100).nullable().optional(),
});
export type PriorAwardsResearch = z.infer<typeof priorAwardsResearchSchema>;

// NSF 26-508 Hub Workbench: live intelligence cache. 24h TTL per (state, queryType, queryHash).
export const nationwideDiscoveries = pgTable("nationwide_discoveries", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  queryType: varchar("query_type", { length: 64 }).notNull(),
  queryHash: varchar("query_hash", { length: 32 }).notNull(),
  text: text("text"),
  citations: jsonb("citations"),
  // status: 'pending' (just retrieved), 'confirmed' (hub validated), 'dismissed' (rejected)
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  retrievedAt: timestamp("retrieved_at").defaultNow(),
});
export type NationwideDiscovery = typeof nationwideDiscoveries.$inferSelect;

// Hub partner MOUs — tracks the partnership pipeline for each state's NSF 26-508 Hub.
export const hubMous = pgTable("hub_mous", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  hubStateCode: varchar("hub_state_code", { length: 2 }).notNull(),
  partnerOrg: text("partner_org").notNull(),
  partnerRole: text("partner_role").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  // status: planned | outreached | letter_sent | committed | signed | declined
  status: varchar("status", { length: 24 }).notNull().default("planned"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertHubMouSchema = createInsertSchema(hubMous).omit({ id: true, updatedAt: true });
export type InsertHubMou = z.infer<typeof insertHubMouSchema>;
export type HubMou = typeof hubMous.$inferSelect;

// External interventions received from peer platforms — persists what was previously discarded.
export const externalInterventions = pgTable("external_interventions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  origin: varchar("origin", { length: 64 }).notNull(),
  externalId: text("external_id"),
  userId: text("user_id"),
  interventionType: text("intervention_type"),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
});
export type ExternalIntervention = typeof externalInterventions.$inferSelect;

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
  credentialTags: text("credential_tags").array(),
  wageMin: integer("wage_min_cents"),
  wageMax: integer("wage_max_cents"),
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
  reentryPlanId: varchar("reentry_plan_id", { length: 100 }),
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
  riskScore: integer("risk_score"),
  riskLevel: varchar("risk_level", { length: 20 }),
  riskDomains: jsonb("risk_domains"),
  householdId: varchar("household_id", { length: 100 }),
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
  youthMode: boolean("youth_mode").notNull().default(false),
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

// editorDrafts: polymorphic autosave store for long-form editors (RFP writer,
// grant narrative builder, LOI writer, org settings, etc.). One row per
// (userId, editorKind, scopeKey). Replaces "lose work on navigate" UX with
// debounced background save. `content` is jsonb so each editor controls its
// own shape — no schema migration needed when an editor adds a field.
export const editorDrafts = pgTable("editor_drafts", {
  id: varchar("id", { length: 200 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  editorKind: text("editor_kind").notNull(),
  scopeKey: text("scope_key").notNull().default("default"),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userKindScopeUq: uniqueIndex("editor_drafts_user_kind_scope_uq").on(t.userId, t.editorKind, t.scopeKey),
}));
export type EditorDraft = typeof editorDrafts.$inferSelect;

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
  publicVisible: boolean("public_visible").default(true),
  keepAlive: boolean("keep_alive").default(false),
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

// Links RPLICE program assessments and CFIR programs to county FIPS codes.
// Enables equity dashboard overlay: intervention effectiveness → Census tract gap map.
export const programGeography = pgTable("program_geography", {
  id: serial("id").primaryKey(),
  programName: text("program_name").notNull(), // matches rpliceAssessments.programName
  cfirProgramId: varchar("cfir_program_id", { length: 100 }), // matches cfirAssessments.programId
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  countyName: varchar("county_name", { length: 100 }).notNull(),
  stateFips: varchar("state_fips", { length: 5 }).notNull().default("48"),
  serviceType: varchar("service_type", { length: 50 }).notNull().default("primary"), // primary | secondary | statewide
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgramGeographySchema = createInsertSchema(programGeography).omit({ id: true, createdAt: true });
export type InsertProgramGeography = z.infer<typeof insertProgramGeographySchema>;
export type ProgramGeography = typeof programGeography.$inferSelect;

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

// ==================== BENEFITS INTELLIGENCE SYSTEM ====================

export const benefitsEnrollmentData = pgTable("benefits_enrollment_data", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  countyName: varchar("county_name", { length: 255 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  tractId: varchar("tract_id", { length: 20 }),
  benefitType: varchar("benefit_type", { length: 50 }).notNull(),
  eligiblePopulation: integer("eligible_population"),
  enrolledPopulation: integer("enrolled_population"),
  participationRate: real("participation_rate"),
  participationGap: real("participation_gap"),
  renewalsPending: integer("renewals_pending").default(0),
  renewalsAtRisk: integer("renewals_at_risk").default(0),
  barrierIndex: real("barrier_index"),
  limitedEnglishPct: real("limited_english_pct"),
  noVehiclePct: real("no_vehicle_pct"),
  noBroadbandPct: real("no_broadband_pct"),
  nonCitizenPct: real("non_citizen_pct"),
  povertyRate: real("poverty_rate"),
  totalPopulation: integer("total_population"),
  medianIncome: real("median_income"),
  rawCensusData: jsonb("raw_census_data"),
  dataSource: varchar("data_source", { length: 255 }),
  dataYear: integer("data_year"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBenefitsEnrollmentDataSchema = createInsertSchema(benefitsEnrollmentData).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefitsEnrollmentData = z.infer<typeof insertBenefitsEnrollmentDataSchema>;
export type BenefitsEnrollmentData = typeof benefitsEnrollmentData.$inferSelect;

export const benefitsPartners = pgTable("benefits_partners", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 500 }).notNull(),
  organizationType: varchar("organization_type", { length: 100 }).notNull(),
  county: varchar("county", { length: 100 }).notNull(),
  coverageZips: text("coverage_zips").array(),
  servicesOffered: text("services_offered").array(),
  benefitTypes: text("benefit_types").array(),
  languages: text("languages").array(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  hhscCppLevel: integer("hhsc_cpp_level"),
  isVitaSite: boolean("is_vita_site").default(false),
  capacity: integer("capacity"),
  currentCaseload: integer("current_caseload").default(0),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  stDavidsListed: boolean("st_davids_listed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBenefitsPartnerSchema = createInsertSchema(benefitsPartners).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefitsPartner = z.infer<typeof insertBenefitsPartnerSchema>;
export type BenefitsPartner = typeof benefitsPartners.$inferSelect;

export const benefitsChwNetwork = pgTable("benefits_chw_network", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  county: varchar("county", { length: 100 }).notNull(),
  assignedZips: text("assigned_zips").array(),
  languages: text("languages").array(),
  culturalCompetencies: text("cultural_competencies").array(),
  certifications: text("certifications").array(),
  affiliatedOrg: varchar("affiliated_org", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  capacity: integer("capacity").default(20),
  activeCases: integer("active_cases").default(0),
  specializations: text("specializations").array(),
  trustLevel: varchar("trust_level", { length: 50 }).default("established"),
  isActive: boolean("is_active").notNull().default(true),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBenefitsChwSchema = createInsertSchema(benefitsChwNetwork).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefitsChw = z.infer<typeof insertBenefitsChwSchema>;
export type BenefitsChw = typeof benefitsChwNetwork.$inferSelect;

export const benefitsEnrollmentLog = pgTable("benefits_enrollment_log", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
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

export const benefitsScreenings = pgTable("benefits_screenings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  countyFips: varchar("county_fips", { length: 10 }),
  zipCode: varchar("zip_code", { length: 10 }),
  screeningType: varchar("screening_type", { length: 50 }).notNull(),
  householdSize: integer("household_size"),
  annualIncome: real("annual_income"),
  hasChildren: boolean("has_children").default(false),
  isPregnant: boolean("is_pregnant").default(false),
  isDisabled: boolean("is_disabled").default(false),
  isElderly: boolean("is_elderly").default(false),
  isVeteran: boolean("is_veteran").default(false),
  isSingleParent: boolean("is_single_parent").default(false),
  navigationGuides: jsonb("navigation_guides"),
  citizenshipStatus: varchar("citizenship_status", { length: 50 }),
  eligibleBenefits: text("eligible_benefits").array(),
  currentBenefits: text("current_benefits").array(),
  gapBenefits: text("gap_benefits").array(),
  referredToChwId: varchar("referred_to_chw_id", { length: 100 }),
  referredToPartnerId: varchar("referred_to_partner_id", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("completed"),
  handoffType: varchar("handoff_type", { length: 50 }),
  enrollmentOutcome: varchar("enrollment_outcome", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBenefitsScreeningSchema = createInsertSchema(benefitsScreenings).omit({ id: true, createdAt: true });
export type InsertBenefitsScreening = z.infer<typeof insertBenefitsScreeningSchema>;
export type BenefitsScreening = typeof benefitsScreenings.$inferSelect;

export const benefitsRenewals = pgTable("benefits_renewals", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  countyFips: varchar("county_fips", { length: 10 }),
  zipCode: varchar("zip_code", { length: 10 }),
  benefitType: varchar("benefit_type", { length: 50 }).notNull(),
  renewalDeadline: timestamp("renewal_deadline"),
  daysUntilDeadline: integer("days_until_deadline"),
  outreachStatus: varchar("outreach_status", { length: 50 }).default("pending"),
  assignedChwId: varchar("assigned_chw_id", { length: 100 }),
  contactAttempts: integer("contact_attempts").default(0),
  renewalOutcome: varchar("renewal_outcome", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBenefitsRenewalSchema = createInsertSchema(benefitsRenewals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefitsRenewal = z.infer<typeof insertBenefitsRenewalSchema>;
export type BenefitsRenewal = typeof benefitsRenewals.$inferSelect;

export const benefitsApplications = pgTable("benefits_applications", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  screeningId: varchar("screening_id", { length: 100 }),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  countyName: varchar("county_name", { length: 100 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  benefitType: varchar("benefit_type", { length: 50 }).notNull(),
  applicantName: varchar("applicant_name", { length: 255 }).notNull(),
  applicantPhone: varchar("applicant_phone", { length: 50 }),
  applicantEmail: varchar("applicant_email", { length: 255 }),
  preferredLanguage: varchar("preferred_language", { length: 50 }).default("English"),
  householdSize: integer("household_size").notNull(),
  annualIncome: real("annual_income"),
  hasChildren: boolean("has_children").default(false),
  citizenshipStatus: varchar("citizenship_status", { length: 50 }),
  documentsCollected: text("documents_collected").array(),
  documentsMissing: text("documents_missing").array(),
  consentGiven: boolean("consent_given").notNull().default(false),
  status: varchar("status", { length: 50 }).notNull().default("intake"),
  stage: varchar("stage", { length: 50 }).notNull().default("registered"),
  assignedChwId: varchar("assigned_chw_id", { length: 100 }),
  assignedPartnerId: varchar("assigned_partner_id", { length: 100 }),
  hhscCaseNumber: varchar("hhsc_case_number", { length: 100 }),
  submittedAt: timestamp("submitted_at"),
  decisionAt: timestamp("decision_at"),
  outcome: varchar("outcome", { length: 50 }),
  outcomeNotes: text("outcome_notes"),
  estimatedAnnualValue: real("estimated_annual_value"),
  renewalDueAt: timestamp("renewal_due_at"),
  // Submission receipts (proof of enrollment)
  confirmationNumber: varchar("confirmation_number", { length: 100 }),
  submissionPortal: varchar("submission_portal", { length: 100 }),
  receiptUrl: text("receipt_url"),
  // Denial / appeal lifecycle
  denialReason: text("denial_reason"),
  appealFiledAt: timestamp("appeal_filed_at"),
  appealStatus: varchar("appeal_status", { length: 50 }),
  appealNotes: text("appeal_notes"),
  source: varchar("source", { length: 50 }).default("wab2"),
  notes: text("notes"),
  // Peer-mirror fields — tracks whether this record was locally owned or mirrored from a peer (e.g. LifeBridge)
  externalId: varchar("external_id", { length: 200 }),
  peerPlatform: varchar("peer_platform", { length: 50 }),
  isPeerMirrored: boolean("is_peer_mirrored").default(false),
  // Nationwide RPLICE v2 fields
  residentRef: varchar("resident_ref", { length: 32 }),             // sha256(...).substr(0,16)
  programSlug: varchar("program_slug", { length: 150 }),            // canonical, e.g. "federal:medicaid"
  stateCode: varchar("state_code", { length: 2 }),                  // 2-letter ISO
  grantPartnerId: varchar("grant_partner_id", { length: 100 }),
  grantPartnerName: varchar("grant_partner_name", { length: 200 }),
  grantReportingTags: text("grant_reporting_tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const grantPartners = pgTable("grant_partners", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  coverageStates: text("coverage_states").array().notNull().default(sql`ARRAY[]::text[]`),
  coverageCounties: text("coverage_counties").array().notNull().default(sql`ARRAY[]::text[]`),
  focusAreas: text("focus_areas").array().notNull().default(sql`ARRAY[]::text[]`),
  reportingCadence: varchar("reporting_cadence", { length: 30 }).notNull().default("quarterly"),
  rpliceChannel: varchar("rplice_channel", { length: 100 }),
  activeFrom: varchar("active_from", { length: 20 }),
  activeUntil: varchar("active_until", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGrantPartnerSchema = createInsertSchema(grantPartners).omit({ createdAt: true });
export type InsertGrantPartner = z.infer<typeof insertGrantPartnerSchema>;
export type GrantPartner = typeof grantPartners.$inferSelect;

export const insertBenefitsApplicationSchema = createInsertSchema(benefitsApplications).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefitsApplication = z.infer<typeof insertBenefitsApplicationSchema>;
export type BenefitsApplication = typeof benefitsApplications.$inferSelect;

export const communityEvidence = pgTable("community_evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  geographyKey: varchar("geography_key", { length: 50 }).notNull(),
  geographyType: varchar("geography_type", { length: 50 }).notNull(),
  metricKey: varchar("metric_key", { length: 100 }).notNull(),
  metricLabel: text("metric_label").notNull(),
  value: real("value").notNull(),
  unit: varchar("unit", { length: 50 }),
  asOfDate: varchar("as_of_date", { length: 20 }),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url"),
  documentTitle: text("document_title"),
  pageReference: text("page_reference"),
  methodology: text("methodology"),
  verifiedBy: varchar("verified_by", { length: 200 }),
  confidence: varchar("confidence", { length: 20 }).notNull().default("verified"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertCommunityEvidenceSchema = createInsertSchema(communityEvidence).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommunityEvidence = z.infer<typeof insertCommunityEvidenceSchema>;
export type CommunityEvidence = typeof communityEvidence.$inferSelect;

// ==================== NETWORK FEDERATION (cross-platform members & events) ====================
// Federates HerHealth Network, Bible Study Buddies, and other ecosystem platforms.
// Each platform keeps its own auth/data; this gives ThriveUp Academy admins a unified
// roster + activity feed via signed webhook events.

export const networkPlatforms = pgTable("network_platforms", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  ownerEmail: text("owner_email"),
  description: text("description"),
  color: varchar("color", { length: 30 }).default("from-pink-500 to-rose-600"),
  secretEnvVar: varchar("secret_env_var", { length: 100 }),
  active: boolean("active").notNull().default(true),
  lastEventAt: timestamp("last_event_at"),
  totalMembers: integer("total_members").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertNetworkPlatformSchema = createInsertSchema(networkPlatforms).omit({ createdAt: true, updatedAt: true, lastEventAt: true, totalMembers: true });
export type InsertNetworkPlatform = z.infer<typeof insertNetworkPlatformSchema>;
export type NetworkPlatform = typeof networkPlatforms.$inferSelect;

export const networkMembers = pgTable("network_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id", { length: 50 }).notNull(),
  externalUserId: varchar("external_user_id", { length: 200 }).notNull(),
  email: text("email"),
  displayName: text("display_name"),
  role: varchar("role", { length: 30 }).notNull().default("member"),
  conditions: text("conditions").array(),
  zip: varchar("zip", { length: 20 }),
  county: varchar("county", { length: 100 }),
  navigatorEngaged: boolean("navigator_engaged").notNull().default(false),
  appointmentsBooked: integer("appointments_booked").notNull().default(0),
  loginCount: integer("login_count").notNull().default(0),
  firstSeenAt: timestamp("first_seen_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  lastEventAt: timestamp("last_event_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  platformExternalIdx: index("network_members_platform_extid_idx").on(t.platformId, t.externalUserId),
  lastEventIdx: index("network_members_last_event_idx").on(t.lastEventAt),
}));
export const insertNetworkMemberSchema = createInsertSchema(networkMembers).omit({ id: true, createdAt: true, updatedAt: true, firstSeenAt: true });
export type InsertNetworkMember = z.infer<typeof insertNetworkMemberSchema>;
export type NetworkMember = typeof networkMembers.$inferSelect;

export const networkMemberEvents = pgTable("network_member_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id", { length: 50 }).notNull(),
  externalUserId: varchar("external_user_id", { length: 200 }).notNull(),
  eventType: varchar("event_type", { length: 60 }).notNull(),
  payload: jsonb("payload"),
  occurredAt: timestamp("occurred_at").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
}, (t) => ({
  platformExternalIdx: index("network_events_platform_extid_idx").on(t.platformId, t.externalUserId),
  occurredIdx: index("network_events_occurred_idx").on(t.occurredAt),
}));
export const insertNetworkMemberEventSchema = createInsertSchema(networkMemberEvents).omit({ id: true, receivedAt: true });
export type InsertNetworkMemberEvent = z.infer<typeof insertNetworkMemberEventSchema>;
export type NetworkMemberEvent = typeof networkMemberEvents.$inferSelect;

// ==================== NATIONAL REENTRY STANDARDS ALIGNMENT (NR-1) ====================
// Aligns TCAF reentry infrastructure with NRRC + BJA Second Chance Act standards.

export const rnrAssessments = pgTable("rnr_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }),
  planId: varchar("plan_id", { length: 100 }),
  assessorId: varchar("assessor_id", { length: 255 }),
  assessorName: varchar("assessor_name", { length: 255 }),
  participantName: varchar("participant_name", { length: 255 }),
  riskScore: integer("risk_score").notNull(),
  riskLevel: varchar("risk_level", { length: 20 }).notNull(),
  needAntisocialAttitudes: integer("need_antisocial_attitudes").default(0),
  needAntisocialPeers: integer("need_antisocial_peers").default(0),
  needSubstanceAbuse: integer("need_substance_abuse").default(0),
  needFamilyMarital: integer("need_family_marital").default(0),
  needEducationEmployment: integer("need_education_employment").default(0),
  needLeisureRecreation: integer("need_leisure_recreation").default(0),
  needAntisocialPersonality: integer("need_antisocial_personality").default(0),
  needHistoryOfBehavior: integer("need_history_of_behavior").default(0),
  responsivityFactors: text("responsivity_factors"),
  recommendedPrograms: text("recommended_programs").array().default(sql`'{}'::text[]`),
  notes: text("notes"),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  reassessmentDue: timestamp("reassessment_due"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertRnrAssessmentSchema = createInsertSchema(rnrAssessments).omit({ id: true, createdAt: true });
export type InsertRnrAssessment = z.infer<typeof insertRnrAssessmentSchema>;
export type RnrAssessment = typeof rnrAssessments.$inferSelect;

export const cbiPrograms = pgTable("cbi_programs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  programCode: varchar("program_code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  shortName: varchar("short_name", { length: 100 }),
  description: text("description").notNull(),
  evidenceTier: varchar("evidence_tier", { length: 50 }).notNull(),
  evidenceSource: text("evidence_source"),
  targetPopulation: text("target_population"),
  durationWeeks: integer("duration_weeks"),
  sessionsCount: integer("sessions_count"),
  modality: varchar("modality", { length: 50 }),
  certificationRequired: boolean("certification_required").default(true),
  facilitatorTraining: text("facilitator_training"),
  costPerParticipant: text("cost_per_participant"),
  internalDelivery: boolean("internal_delivery").default(false),
  referralPartner: text("referral_partner"),
  resourceUrl: text("resource_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertCbiProgramSchema = createInsertSchema(cbiPrograms).omit({ id: true, createdAt: true });
export type InsertCbiProgram = z.infer<typeof insertCbiProgramSchema>;
export type CbiProgram = typeof cbiPrograms.$inferSelect;

export const staffCertifications = pgTable("staff_certifications", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id", { length: 255 }),
  staffName: varchar("staff_name", { length: 255 }).notNull(),
  staffEmail: varchar("staff_email", { length: 255 }),
  staffRole: varchar("staff_role", { length: 100 }),
  certificationType: varchar("certification_type", { length: 100 }).notNull(),
  certificationName: text("certification_name").notNull(),
  issuingBody: text("issuing_body"),
  issuedDate: text("issued_date"),
  expiresDate: text("expires_date"),
  certificateUrl: text("certificate_url"),
  livedExperience: boolean("lived_experience").default(false),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertStaffCertificationSchema = createInsertSchema(staffCertifications).omit({ id: true, createdAt: true });
export type InsertStaffCertification = z.infer<typeof insertStaffCertificationSchema>;
export type StaffCertification = typeof staffCertifications.$inferSelect;

export const standardsCrosswalk = pgTable("standards_crosswalk", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  standardCode: varchar("standard_code", { length: 50 }).notNull().unique(),
  standardBody: varchar("standard_body", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  standardTitle: text("standard_title").notNull(),
  standardDescription: text("standard_description").notNull(),
  coverageStatus: varchar("coverage_status", { length: 50 }).notNull(),
  coveragePercent: integer("coverage_percent").notNull().default(0),
  tcafCapabilities: text("tcaf_capabilities").array().default(sql`'{}'::text[]`),
  evidenceUrl: text("evidence_url"),
  notes: text("notes"),
  lastReviewedAt: timestamp("last_reviewed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertStandardsCrosswalkSchema = createInsertSchema(standardsCrosswalk).omit({ id: true, createdAt: true });
export type InsertStandardsCrosswalk = z.infer<typeof insertStandardsCrosswalkSchema>;
export type StandardsCrosswalk = typeof standardsCrosswalk.$inferSelect;

// === NR-2: Coalition + Governance + Strategic Planning + Outcome Reports ===

export const coalitionPartners = pgTable("coalition_partners", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  organizationName: varchar("organization_name", { length: 255 }).notNull(),
  partnerType: varchar("partner_type", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  county: varchar("county", { length: 100 }),
  state: varchar("state", { length: 50 }).default("TX"),
  website: varchar("website", { length: 500 }),
  servicesOffered: text("services_offered").array(),
  mouStatus: varchar("mou_status", { length: 50 }).default("none"),
  mouSignedDate: text("mou_signed_date"),
  mouUrl: varchar("mou_url", { length: 500 }),
  livedExperienceLed: boolean("lived_experience_led").default(false),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertCoalitionPartnerSchema = createInsertSchema(coalitionPartners).omit({ id: true, createdAt: true });
export type InsertCoalitionPartner = z.infer<typeof insertCoalitionPartnerSchema>;
export type CoalitionPartner = typeof coalitionPartners.$inferSelect;

export const lettersOfCollaboration = pgTable("letters_of_collaboration", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id", { length: 100 }),
  partnerName: varchar("partner_name", { length: 255 }).notNull(),
  grantOpportunity: varchar("grant_opportunity", { length: 255 }).notNull(),
  letterStatus: varchar("letter_status", { length: 50 }).notNull().default("requested"),
  requestedDate: text("requested_date"),
  receivedDate: text("received_date"),
  letterUrl: varchar("letter_url", { length: 500 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertLetterOfCollaborationSchema = createInsertSchema(lettersOfCollaboration).omit({ id: true, createdAt: true });
export type InsertLetterOfCollaboration = z.infer<typeof insertLetterOfCollaborationSchema>;
export type LetterOfCollaboration = typeof lettersOfCollaboration.$inferSelect;

export const recidivismBaselines = pgTable("recidivism_baselines", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  jurisdiction: varchar("jurisdiction", { length: 255 }).notNull(),
  jurisdictionType: varchar("jurisdiction_type", { length: 50 }).notNull().default("county"),
  metricType: varchar("metric_type", { length: 100 }).notNull(),
  metricValue: real("metric_value").notNull(),
  population: varchar("population", { length: 255 }),
  cohortYear: integer("cohort_year"),
  source: varchar("source", { length: 500 }).notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertRecidivismBaselineSchema = createInsertSchema(recidivismBaselines).omit({ id: true, createdAt: true });
export type InsertRecidivismBaseline = z.infer<typeof insertRecidivismBaselineSchema>;
export type RecidivismBaseline = typeof recidivismBaselines.$inferSelect;

export const familyVisitations = pgTable("family_visitations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  participantName: varchar("participant_name", { length: 255 }),
  contactType: varchar("contact_type", { length: 50 }).notNull(),
  contactDate: text("contact_date").notNull(),
  durationMinutes: integer("duration_minutes"),
  familyMemberRelation: varchar("family_member_relation", { length: 100 }),
  familyMemberName: varchar("family_member_name", { length: 255 }),
  childrenInvolved: integer("children_involved").default(0),
  outcome: varchar("outcome", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertFamilyVisitationSchema = createInsertSchema(familyVisitations).omit({ id: true, createdAt: true });
export type InsertFamilyVisitation = z.infer<typeof insertFamilyVisitationSchema>;
export type FamilyVisitation = typeof familyVisitations.$inferSelect;

export const strategicPlans = pgTable("strategic_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  planName: varchar("plan_name", { length: 255 }).notNull(),
  planYear: integer("plan_year").notNull(),
  visionStatement: text("vision_statement"),
  missionStatement: text("mission_statement"),
  goals: jsonb("goals"),
  performanceMeasures: jsonb("performance_measures"),
  approvedDate: text("approved_date"),
  approvedBy: varchar("approved_by", { length: 255 }),
  status: varchar("status", { length: 50 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertStrategicPlanSchema = createInsertSchema(strategicPlans).omit({ id: true, createdAt: true });
export type InsertStrategicPlan = z.infer<typeof insertStrategicPlanSchema>;
export type StrategicPlan = typeof strategicPlans.$inferSelect;

export const outcomeReportsNrrc = pgTable("outcome_reports_nrrc", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  reportName: varchar("report_name", { length: 255 }).notNull(),
  reportingPeriod: varchar("reporting_period", { length: 100 }).notNull(),
  funder: varchar("funder", { length: 255 }),
  participantsServed: integer("participants_served").default(0),
  cbiReferrals: integer("cbi_referrals").default(0),
  rnrAssessmentsCompleted: integer("rnr_assessments_completed").default(0),
  employmentPlacements: integer("employment_placements").default(0),
  housingPlacements: integer("housing_placements").default(0),
  recidivismRate: real("recidivism_rate"),
  narrativeSummary: text("narrative_summary"),
  challenges: text("challenges"),
  successes: text("successes"),
  status: varchar("status", { length: 50 }).default("draft"),
  generatedFromData: boolean("generated_from_data").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertOutcomeReportNrrcSchema = createInsertSchema(outcomeReportsNrrc).omit({ id: true, createdAt: true });
export type InsertOutcomeReportNrrc = z.infer<typeof insertOutcomeReportNrrcSchema>;
export type OutcomeReportNrrc = typeof outcomeReportsNrrc.$inferSelect;

export const governanceMeetings = pgTable("governance_meetings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  meetingTier: varchar("meeting_tier", { length: 50 }).notNull(),
  meetingDate: text("meeting_date").notNull(),
  cadence: varchar("cadence", { length: 50 }),
  attendeeCount: integer("attendee_count"),
  livedExperienceCount: integer("lived_experience_count").default(0),
  agenda: text("agenda"),
  decisionsRecorded: text("decisions_recorded"),
  minutesUrl: varchar("minutes_url", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertGovernanceMeetingSchema = createInsertSchema(governanceMeetings).omit({ id: true, createdAt: true });
export type InsertGovernanceMeeting = z.infer<typeof insertGovernanceMeetingSchema>;
export type GovernanceMeeting = typeof governanceMeetings.$inferSelect;

// ==================== UNIFIED RESIDENT JOURNEY ====================
// One identity (participantProfiles.id) flows across reentry, workforce,
// AI training, benefits, community, and geography. These three tables are
// the connective tissue every page writes to and reads from.

export const residentJourneyEvents = pgTable("resident_journey_events", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  eventDomain: varchar("event_domain", { length: 50 }).notNull(),
  eventTitle: text("event_title").notNull(),
  eventPayload: jsonb("event_payload"),
  stateAtEvent: varchar("state_at_event", { length: 10 }),
  countyAtEvent: varchar("county_at_event", { length: 10 }),
  sourcePage: varchar("source_page", { length: 100 }),
  sourceUserId: varchar("source_user_id", { length: 255 }),
  occurredAt: timestamp("occurred_at").defaultNow(),
});
export const insertResidentJourneyEventSchema = createInsertSchema(residentJourneyEvents).omit({ id: true, occurredAt: true });
export type InsertResidentJourneyEvent = z.infer<typeof insertResidentJourneyEventSchema>;
export type ResidentJourneyEvent = typeof residentJourneyEvents.$inferSelect;

export const residentRelocations = pgTable("resident_relocations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  fromState: varchar("from_state", { length: 10 }),
  fromCounty: varchar("from_county", { length: 10 }),
  fromCity: varchar("from_city", { length: 100 }),
  toState: varchar("to_state", { length: 10 }).notNull(),
  toCounty: varchar("to_county", { length: 10 }),
  toCity: varchar("to_city", { length: 100 }),
  reason: text("reason"),
  eligibilityDelta: jsonb("eligibility_delta"),
  servicesContinued: text("services_continued").array(),
  servicesNeedingTransfer: text("services_needing_transfer").array(),
  status: varchar("status", { length: 30 }).notNull().default("completed"),
  occurredAt: timestamp("occurred_at").defaultNow(),
});
export const insertResidentRelocationSchema = createInsertSchema(residentRelocations).omit({ id: true, occurredAt: true });
export type InsertResidentRelocation = z.infer<typeof insertResidentRelocationSchema>;
export type ResidentRelocation = typeof residentRelocations.$inferSelect;

export const residentRiskSnapshots = pgTable("resident_risk_snapshots", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull(),
  riskFactors: jsonb("risk_factors"),
  protectiveFactors: jsonb("protective_factors"),
  chainwebCitations: jsonb("chainweb_citations"),
  overallRiskScore: integer("overall_risk_score"),
  trendDirection: varchar("trend_direction", { length: 20 }),
  recommendedInterventions: jsonb("recommended_interventions"),
  snapshotAt: timestamp("snapshot_at").defaultNow(),
});
export const insertResidentRiskSnapshotSchema = createInsertSchema(residentRiskSnapshots).omit({ id: true, snapshotAt: true });
export type InsertResidentRiskSnapshot = z.infer<typeof insertResidentRiskSnapshotSchema>;
export type ResidentRiskSnapshot = typeof residentRiskSnapshots.$inferSelect;

export const safetyEscalations = pgTable("safety_escalations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }),
  severity: varchar("severity", { length: 20 }).notNull(),
  surface: varchar("surface", { length: 80 }).notNull(),
  matchedPattern: text("matched_pattern"),
  matchedPhrase: text("matched_phrase"),
  fullConversation: jsonb("full_conversation").notNull(),
  emailSent: boolean("email_sent").notNull().default(false),
  emailMessageId: varchar("email_message_id", { length: 255 }),
  reviewed: boolean("reviewed").notNull().default(false),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at"),
  triggeredAt: timestamp("triggered_at").defaultNow(),
});
export const insertSafetyEscalationSchema = createInsertSchema(safetyEscalations).omit({ id: true, triggeredAt: true, reviewed: true, reviewedBy: true, reviewedAt: true });
export type InsertSafetyEscalation = z.infer<typeof insertSafetyEscalationSchema>;
export type SafetyEscalation = typeof safetyEscalations.$inferSelect;

export const platformFunderFit = pgTable("platform_funder_fit", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id", { length: 80 }).notNull(),
  platformName: text("platform_name").notNull(),
  platformPublicVisible: boolean("platform_public_visible").notNull().default(false),
  funderSlug: varchar("funder_slug", { length: 80 }).notNull(),
  funderName: text("funder_name").notNull(),
  fitPoints: integer("fit_points").notNull().default(0),
  isQuintetMatch: boolean("is_quintet_match").notNull().default(false),
  matchBasis: text("match_basis").notNull(),
  rubricVersion: varchar("rubric_version", { length: 40 }).notNull(),
  scoredAt: timestamp("scored_at").defaultNow(),
}, (t) => [
  index("idx_pff_funder").on(t.funderSlug),
  index("idx_pff_platform").on(t.platformId),
  uniqueIndex("uq_pff_platform_funder_version").on(t.platformId, t.funderSlug, t.rubricVersion),
]);
export const insertPlatformFunderFitSchema = createInsertSchema(platformFunderFit).omit({ id: true, scoredAt: true });
export type InsertPlatformFunderFit = z.infer<typeof insertPlatformFunderFitSchema>;
export type PlatformFunderFit = typeof platformFunderFit.$inferSelect;

export * from "./models/auth";

// ============================================================================
// FOSTER YOUTH INTAKE WIZARD (May 11, 2026 — built for Jim Currier visit)
// AI-assisted holistic intake for individual foster youth aging out.
// All rows tagged cohort='foster-youth' for analytics segmentation.
// ============================================================================
export const fosterYouthIntakes = pgTable("foster_youth_intakes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  cohort: varchar("cohort", { length: 64 }).notNull().default("foster-youth"),
  sessionId: varchar("session_id", { length: 128 }),
  firstName: varchar("first_name", { length: 120 }),
  preferredName: varchar("preferred_name", { length: 120 }),
  pronouns: varchar("pronouns", { length: 60 }),
  age: integer("age"),
  ageOutDate: varchar("age_out_date", { length: 32 }),
  stateCode: varchar("state_code", { length: 2 }),
  currentSituation: text("current_situation"),
  immediateNeeds: text("immediate_needs").array(),
  hasStateId: boolean("has_state_id").default(false),
  hasSsnCard: boolean("has_ssn_card").default(false),
  hasBirthCert: boolean("has_birth_cert").default(false),
  hasMedicaid: boolean("has_medicaid").default(false),
  hasHousing: boolean("has_housing").default(false),
  enrolledSchool: boolean("enrolled_school").default(false),
  employed: boolean("employed").default(false),
  ilpCoordinator: varchar("ilp_coordinator", { length: 200 }),
  ilpPhone: varchar("ilp_phone", { length: 60 }),
  caseworker: varchar("caseworker", { length: 200 }),
  accessToken: varchar("access_token", { length: 64 }),
  aiSummary: text("ai_summary"),
  aiEligiblePrograms: jsonb("ai_eligible_programs"),
  aiPriorities: jsonb("ai_priorities"),
  ai30DayPlan: jsonb("ai_30_day_plan"),
  ai60DayPlan: jsonb("ai_60_day_plan"),
  ai90DayPlan: jsonb("ai_90_day_plan"),
  aiWarmHandoffs: jsonb("ai_warm_handoffs"),
  aiProvider: varchar("ai_provider", { length: 60 }),
  aiAnalyzedAt: timestamp("ai_analyzed_at"),
  createdBy: varchar("created_by", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fosterYouthIntakeDocuments = pgTable("foster_youth_intake_documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  intakeId: varchar("intake_id", { length: 64 }).notNull().references(() => fosterYouthIntakes.id, { onDelete: "cascade" }),
  docType: varchar("doc_type", { length: 60 }).notNull(),
  filename: varchar("filename", { length: 300 }).notNull(),
  contentType: varchar("content_type", { length: 100 }),
  size: integer("size"),
  objectPath: varchar("object_path", { length: 500 }).notNull(),
  extractedText: text("extracted_text"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const fosterYouthEvents = pgTable("foster_youth_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  cohort: varchar("cohort", { length: 64 }).notNull().default("foster-youth"),
  sessionId: varchar("session_id", { length: 128 }),
  intakeId: varchar("intake_id", { length: 64 }),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  page: varchar("page", { length: 200 }),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const insertFosterYouthIntakeSchema = createInsertSchema(fosterYouthIntakes).omit({ id: true, createdAt: true, updatedAt: true, aiAnalyzedAt: true });
export type InsertFosterYouthIntake = z.infer<typeof insertFosterYouthIntakeSchema>;
export type FosterYouthIntake = typeof fosterYouthIntakes.$inferSelect;

export const insertFosterYouthIntakeDocumentSchema = createInsertSchema(fosterYouthIntakeDocuments).omit({ id: true, uploadedAt: true });
export type InsertFosterYouthIntakeDocument = z.infer<typeof insertFosterYouthIntakeDocumentSchema>;
export type FosterYouthIntakeDocument = typeof fosterYouthIntakeDocuments.$inferSelect;

export const insertFosterYouthEventSchema = createInsertSchema(fosterYouthEvents).omit({ id: true, occurredAt: true });
export type InsertFosterYouthEvent = z.infer<typeof insertFosterYouthEventSchema>;
export type FosterYouthEvent = typeof fosterYouthEvents.$inferSelect;

// =====================================================================
// State-Agency Caseload (national rollout scaffold).
// Stores DE-IDENTIFIED case rows uploaded by state/county child-welfare
// agency staff. NEVER store names, SSNs, addresses, or DOB — only an
// agency-internal externalCaseId + a coarse age band. Risk score is
// derived deterministically from documented research factors.
// All access requires admin or case_manager role (see agency routes).
// =====================================================================
export const fosterYouthAgencies = pgTable("foster_youth_agencies", {
  id: varchar("id", { length: 64 }).primaryKey(),                // e.g. "TX-DFPS", "CA-CDSS-LA"
  name: varchar("name", { length: 200 }).notNull(),
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  agencyType: varchar("agency_type", { length: 64 }).notNull().default("state"), // state | county | tribal | private
  contactName: varchar("contact_name", { length: 200 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  status: varchar("status", { length: 32 }).notNull().default("demo"), // demo | mou_pending | active
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fosterYouthAgencyCases = pgTable("foster_youth_agency_cases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  agencyId: varchar("agency_id", { length: 64 }).notNull().references(() => fosterYouthAgencies.id, { onDelete: "cascade" }),
  externalCaseId: varchar("external_case_id", { length: 80 }).notNull(),  // de-identified, agency-internal
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  ageYears: integer("age_years"),
  currentPlacementType: varchar("current_placement_type", { length: 64 }), // family|kinship|group_home|RTC|ILP|emergency|runaway|unknown
  monthsInCare: integer("months_in_care"),
  placementCount: integer("placement_count"),
  schoolDisruptions: integer("school_disruptions"),
  ageAtFirstRemoval: integer("age_at_first_removal"),
  hasIep: boolean("has_iep"),
  mentalHealthDx: boolean("mental_health_dx"),
  mhInTreatment: boolean("mh_in_treatment"),
  priorRunaway: boolean("prior_runaway"),
  justiceContact: boolean("justice_contact"),
  pregnantOrParenting: boolean("pregnant_or_parenting"),
  siblingsSeparated: boolean("siblings_separated"),
  permanentConnectionAdult: boolean("permanent_connection_adult"),
  pregEducDocsComplete: boolean("preg_educ_docs_complete"),
  lgbtqPlus: boolean("lgbtq_plus"),
  notes: text("notes"),
  // Computed by server on insert/update — not user-editable.
  riskScore: integer("risk_score").notNull().default(0),
  riskTier: varchar("risk_tier", { length: 32 }).notNull().default("stable"), // stable|watch|elevated|critical
  riskFactors: jsonb("risk_factors"),  // array of {id,label,points,citation,sourceUrl}
  uploadedBy: varchar("uploaded_by", { length: 64 }),
  source: varchar("source", { length: 32 }).notNull().default("manual"), // manual | csv_bulk | api
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fosterYouthCaseEvents = pgTable("foster_youth_case_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull().references(() => fosterYouthAgencyCases.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id", { length: 64 }).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(), // ingest|score|alert|note|stakeholder_loop|status_change
  actorUserId: varchar("actor_user_id", { length: 64 }),
  payload: jsonb("payload"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const insertFosterYouthAgencySchema = createInsertSchema(fosterYouthAgencies).omit({ createdAt: true });
export type InsertFosterYouthAgency = z.infer<typeof insertFosterYouthAgencySchema>;
export type FosterYouthAgency = typeof fosterYouthAgencies.$inferSelect;

export const insertFosterYouthAgencyCaseSchema = createInsertSchema(fosterYouthAgencyCases).omit({
  id: true, createdAt: true, updatedAt: true, riskScore: true, riskTier: true, riskFactors: true,
});
export type InsertFosterYouthAgencyCase = z.infer<typeof insertFosterYouthAgencyCaseSchema>;
export type FosterYouthAgencyCase = typeof fosterYouthAgencyCases.$inferSelect;

export const insertFosterYouthCaseEventSchema = createInsertSchema(fosterYouthCaseEvents).omit({ id: true, occurredAt: true });
export type InsertFosterYouthCaseEvent = z.infer<typeof insertFosterYouthCaseEventSchema>;
export type FosterYouthCaseEvent = typeof fosterYouthCaseEvents.$inferSelect;

// =====================================================================================
// Community Partner / Family-and-Program tracker
// Generic, multi-tenant tracker for community partner orgs (nonprofits, faith communities,
// schools, clinics) to manage HOUSEHOLDS as the unit, with members, program enrollments,
// recurring attendance, and discrete services received. Designed for partners like
// Sistahs Can We Talk (BIPOC women's health nonprofit) and Iasis Christian Center
// (faith-community youth programs). Per-org isolation is enforced at the query layer.
// =====================================================================================

export const communityPartnerOrgs = pgTable("community_partner_orgs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  orgType: varchar("org_type", { length: 32 }).notNull().default("nonprofit"), // nonprofit | faith | school | clinic | agency
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  city: varchar("city", { length: 80 }),
  websiteUrl: varchar("website_url", { length: 300 }),
  primaryContactName: varchar("primary_contact_name", { length: 200 }),
  primaryContactEmail: varchar("primary_contact_email", { length: 200 }),
  status: varchar("status", { length: 32 }).notNull().default("demo"), // demo | active | mou_pending | sunset
  coiDisclosure: text("coi_disclosure"),                                // visible disclosure card text
  missionSummary: text("mission_summary"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const households = pgTable("households", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 }).notNull().references(() => communityPartnerOrgs.id, { onDelete: "cascade" }),
  externalHouseholdId: varchar("external_household_id", { length: 80 }),
  householdName: varchar("household_name", { length: 200 }).notNull(),
  primaryLanguage: varchar("primary_language", { length: 16 }).notNull().default("en"),
  city: varchar("city", { length: 80 }),
  zipCode: varchar("zip_code", { length: 16 }),
  enteredOn: timestamp("entered_on").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const householdMembers = pgTable("household_members", {
  id: varchar("id", { length: 64 }).primaryKey(),
  householdId: varchar("household_id", { length: 64 }).notNull().references(() => households.id, { onDelete: "cascade" }),
  orgId: varchar("org_id", { length: 64 }).notNull(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  relationship: varchar("relationship", { length: 32 }).notNull(), // parent | guardian | child | grandparent | sibling | spouse | other_adult
  ageYears: integer("age_years"),
  pronouns: varchar("pronouns", { length: 32 }),
  preferredLanguage: varchar("preferred_language", { length: 16 }),
  contactPhone: varchar("contact_phone", { length: 32 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityPrograms = pgTable("community_programs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 }).notNull().references(() => communityPartnerOrgs.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // youth | women_wellness | family | faith_formation | health_screening | mentoring | adult_education
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  cadence: varchar("cadence", { length: 32 }), // weekly | biweekly | monthly | quarterly | event
  scheduleNote: varchar("schedule_note", { length: 200 }),
  provides: text("provides").array(), // ["meal","transportation","curriculum","childcare"]
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const programEnrollments = pgTable("program_enrollments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  memberId: varchar("member_id", { length: 64 }).notNull().references(() => householdMembers.id, { onDelete: "cascade" }),
  programId: varchar("program_id", { length: 64 }).notNull().references(() => communityPrograms.id, { onDelete: "cascade" }),
  orgId: varchar("org_id", { length: 64 }).notNull(),
  enrolledOn: timestamp("enrolled_on").defaultNow().notNull(),
  endedOn: timestamp("ended_on"),
  status: varchar("status", { length: 32 }).notNull().default("active"), // active | paused | completed | withdrawn
  notes: text("notes"),
});

export const programAttendance = pgTable("program_attendance", {
  id: varchar("id", { length: 64 }).primaryKey(),
  enrollmentId: varchar("enrollment_id", { length: 64 }).notNull().references(() => programEnrollments.id, { onDelete: "cascade" }),
  memberId: varchar("member_id", { length: 64 }).notNull(),
  programId: varchar("program_id", { length: 64 }).notNull(),
  orgId: varchar("org_id", { length: 64 }).notNull(),
  sessionDate: timestamp("session_date").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("present"), // present | absent | excused | late
  receivedMeal: boolean("received_meal").notNull().default(false),
  receivedTransport: boolean("received_transport").notNull().default(false),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  recordedBy: varchar("recorded_by", { length: 64 }),
});

export const householdServicesReceived = pgTable("household_services_received", {
  id: varchar("id", { length: 64 }).primaryKey(),
  householdId: varchar("household_id", { length: 64 }).notNull().references(() => households.id, { onDelete: "cascade" }),
  orgId: varchar("org_id", { length: 64 }).notNull(),
  serviceType: varchar("service_type", { length: 80 }).notNull(), // cancer_screening | counseling | food_assistance | resource_referral | digital_storytelling | phq9 | gad7 | etc
  serviceDate: timestamp("service_date").notNull(),
  recipientMemberId: varchar("recipient_member_id", { length: 64 }),
  outcome: varchar("outcome", { length: 64 }), // completed | referred_out | declined | scheduled | no_show
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  recordedBy: varchar("recorded_by", { length: 64 }),
});

export const insertCommunityPartnerOrgSchema = createInsertSchema(communityPartnerOrgs).omit({ createdAt: true });
export type InsertCommunityPartnerOrg = z.infer<typeof insertCommunityPartnerOrgSchema>;
export type CommunityPartnerOrg = typeof communityPartnerOrgs.$inferSelect;

export const insertHouseholdSchema = createInsertSchema(households).omit({ id: true, createdAt: true, updatedAt: true, enteredOn: true });
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type Household = typeof households.$inferSelect;

export const insertHouseholdMemberSchema = createInsertSchema(householdMembers).omit({ id: true, createdAt: true });
export type InsertHouseholdMember = z.infer<typeof insertHouseholdMemberSchema>;
export type HouseholdMember = typeof householdMembers.$inferSelect;

export const insertCommunityProgramSchema = createInsertSchema(communityPrograms).omit({ id: true, createdAt: true });
export type InsertCommunityProgram = z.infer<typeof insertCommunityProgramSchema>;
export type CommunityProgram = typeof communityPrograms.$inferSelect;

export const insertProgramEnrollmentSchema = createInsertSchema(programEnrollments).omit({ id: true, enrolledOn: true });
export type InsertProgramEnrollment = z.infer<typeof insertProgramEnrollmentSchema>;
export type ProgramEnrollment = typeof programEnrollments.$inferSelect;

export const insertProgramAttendanceSchema = createInsertSchema(programAttendance).omit({ id: true, recordedAt: true });
export type InsertProgramAttendance = z.infer<typeof insertProgramAttendanceSchema>;
export type ProgramAttendance = typeof programAttendance.$inferSelect;

export const insertHouseholdServiceReceivedSchema = createInsertSchema(householdServicesReceived).omit({ id: true, recordedAt: true });
export type InsertHouseholdServiceReceived = z.infer<typeof insertHouseholdServiceReceivedSchema>;
export type HouseholdServiceReceived = typeof householdServicesReceived.$inferSelect;

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 32 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({ id: true, createdAt: true });
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// =====================================================================
// ThriveUp Trade Sims — gamified skilled-trades learning
// Phase A foundation (May 2026). First trade: Electrical.
// Engine designed for trade-2..N replication (plumbing, HVAC, welding,
// auto-mechanic) with swappable physics modules.
// =====================================================================

export const tradeSimsTrades = pgTable("trade_sims_trades", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  iconKey: varchar("icon_key", { length: 64 }),
  displayOrder: integer("display_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeSimsLessons = pgTable("trade_sims_lessons", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull().references(() => tradeSimsTrades.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  title: text("title").notNull(),
  shortDescription: text("short_description"),
  concept: jsonb("concept").notNull(),
  guidedSteps: jsonb("guided_steps").notNull(),
  soloChallenge: jsonb("solo_challenge").notNull(),
  sandboxStarter: jsonb("sandbox_starter"),
  credentialPathway: text("credential_pathway"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("uq_trade_sims_lessons_trade_slug").on(t.tradeId, t.slug),
  uniqueIndex("uq_trade_sims_lessons_trade_day").on(t.tradeId, t.dayNumber),
]);

export const tradeSimsLessonProgress = pgTable("trade_sims_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  anonSessionId: varchar("anon_session_id", { length: 64 }),
  lessonId: integer("lesson_id").notNull().references(() => tradeSimsLessons.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).default("not_started").notNull(),
  conceptCompleted: boolean("concept_completed").default(false).notNull(),
  guidedScore: integer("guided_score"),
  soloScore: integer("solo_score"),
  soloTimeMs: integer("solo_time_ms"),
  sandboxScore: integer("sandbox_score"),
  debriefCompleted: boolean("debrief_completed").default(false).notNull(),
  attemptCount: integer("attempt_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // Partial unique indexes — exactly one of (userId, anonSessionId) is set per row.
  // Prevents duplicate progress rows under concurrent writes.
  uniqueIndex("uq_trade_sims_progress_user_lesson")
    .on(t.userId, t.lessonId)
    .where(sql`user_id IS NOT NULL`),
  uniqueIndex("uq_trade_sims_progress_anon_lesson")
    .on(t.anonSessionId, t.lessonId)
    .where(sql`anon_session_id IS NOT NULL`),
]);

export const tradeSimsSandboxProjects = pgTable("trade_sims_sandbox_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  anonSessionId: varchar("anon_session_id", { length: 64 }),
  tradeId: integer("trade_id").notNull().references(() => tradeSimsTrades.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  canvasState: jsonb("canvas_state").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tradeSimsAiTutorSessions = pgTable("trade_sims_ai_tutor_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  anonSessionId: varchar("anon_session_id", { length: 64 }),
  lessonId: integer("lesson_id").references(() => tradeSimsLessons.id, { onDelete: "set null" }),
  mode: varchar("mode", { length: 32 }).notNull(),
  promptContext: jsonb("prompt_context"),
  responseText: text("response_text").notNull(),
  modelUsed: varchar("model_used", { length: 64 }),
  language: varchar("language", { length: 8 }).default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeSimsCredentialPathways = pgTable("trade_sims_credential_pathways", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull().references(() => tradeSimsTrades.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  provider: text("provider"),
  url: text("url"),
  description: text("description"),
  displayOrder: integer("display_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const insertTradeSimsTradeSchema = createInsertSchema(tradeSimsTrades).omit({ id: true, createdAt: true });
export type InsertTradeSimsTrade = z.infer<typeof insertTradeSimsTradeSchema>;
export type TradeSimsTrade = typeof tradeSimsTrades.$inferSelect;

export const insertTradeSimsLessonSchema = createInsertSchema(tradeSimsLessons).omit({ id: true, createdAt: true });
export type InsertTradeSimsLesson = z.infer<typeof insertTradeSimsLessonSchema>;
export type TradeSimsLesson = typeof tradeSimsLessons.$inferSelect;

export const insertTradeSimsLessonProgressSchema = createInsertSchema(tradeSimsLessonProgress).omit({ id: true, updatedAt: true });
export type InsertTradeSimsLessonProgress = z.infer<typeof insertTradeSimsLessonProgressSchema>;
export type TradeSimsLessonProgress = typeof tradeSimsLessonProgress.$inferSelect;

// ---------------------------------------------------------------------------
// Trade Sims signup audit: every time an authenticated user hits a trade-sims
// page we upsert here so Dr. Flood can see who is signing up and how much
// trial time they used before logging in. Surfaced at /admin/trade-sims-signups
// and in the daily digest email.
// ---------------------------------------------------------------------------
export const tradeSimsLogins = pgTable("trade_sims_logins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  email: varchar("email", { length: 320 }),
  firstName: varchar("first_name", { length: 200 }),
  lastName: varchar("last_name", { length: 200 }),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  totalVisits: integer("total_visits").default(1).notNull(),
  trialMsUsedBeforeLogin: integer("trial_ms_used_before_login"),
  lastIp: varchar("last_ip", { length: 64 }),
  lastUserAgent: text("last_user_agent"),
  lastPath: text("last_path"),
  notifiedInDigest: boolean("notified_in_digest").default(false).notNull(),
}, (t) => [
  uniqueIndex("uq_trade_sims_logins_user").on(t.userId),
]);

export const insertTradeSimsLoginSchema = createInsertSchema(tradeSimsLogins).omit({ id: true, firstSeenAt: true, lastSeenAt: true });
export type InsertTradeSimsLogin = z.infer<typeof insertTradeSimsLoginSchema>;
export type TradeSimsLogin = typeof tradeSimsLogins.$inferSelect;

export const insertTradeSimsSandboxProjectSchema = createInsertSchema(tradeSimsSandboxProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTradeSimsSandboxProject = z.infer<typeof insertTradeSimsSandboxProjectSchema>;
export type TradeSimsSandboxProject = typeof tradeSimsSandboxProjects.$inferSelect;

export const insertTradeSimsAiTutorSessionSchema = createInsertSchema(tradeSimsAiTutorSessions).omit({ id: true, createdAt: true });
export type InsertTradeSimsAiTutorSession = z.infer<typeof insertTradeSimsAiTutorSessionSchema>;
export type TradeSimsAiTutorSession = typeof tradeSimsAiTutorSessions.$inferSelect;

export const insertTradeSimsCredentialPathwaySchema = createInsertSchema(tradeSimsCredentialPathways).omit({ id: true });
export type InsertTradeSimsCredentialPathway = z.infer<typeof insertTradeSimsCredentialPathwaySchema>;
export type TradeSimsCredentialPathway = typeof tradeSimsCredentialPathways.$inferSelect;

// === Community Voice (Open Point / Social Point analog) — 2026-05-17 ===
// Map-pin community input → AI-clustered insights → ecosystem-chain routing → #DATA storytelling.
// Capability-token pattern (P-L08) for public no-auth pin creation.
export const communityVoiceProjects = pgTable("community_voice_projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  leadPlatformId: varchar("lead_platform_id", { length: 64 }),
  centerLat: real("center_lat").notNull(),
  centerLng: real("center_lng").notNull(),
  defaultZoom: integer("default_zoom").default(12).notNull(),
  geoBounds: jsonb("geo_bounds"),
  // public = no-login pin creation; email = email-verify required; hybrid = comments/reactions public, pins require email.
  accessMode: varchar("access_mode", { length: 16 }).default("public").notNull(),
  crisisRoutingEnabled: boolean("crisis_routing_enabled").default(true).notNull(),
  pinCategories: text("pin_categories").array(),
  status: varchar("status", { length: 16 }).default("active").notNull(),
  publiclyVisible: boolean("publicly_visible").default(true).notNull(),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const communityVoicePins = pgTable("community_voice_pins", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: integer("project_id").notNull().references(() => communityVoiceProjects.id, { onDelete: "cascade" }),
  accessToken: varchar("access_token", { length: 64 }).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  body: text("body").notNull(),
  originalLanguage: varchar("original_language", { length: 8 }).default("en").notNull(),
  englishMirror: text("english_mirror"),
  photoUrls: text("photo_urls").array(),
  authorType: varchar("author_type", { length: 24 }).default("resident").notNull(),
  authorEmail: varchar("author_email", { length: 256 }),
  authorName: varchar("author_name", { length: 128 }),
  anonymized: boolean("anonymized").default(true).notNull(),
  sentiment: varchar("sentiment", { length: 16 }),
  crisisFlag: boolean("crisis_flag").default(false).notNull(),
  crisisRoutedTo: varchar("crisis_routed_to", { length: 64 }),
  status: varchar("status", { length: 16 }).default("published").notNull(),
  ipHash: varchar("ip_hash", { length: 64 }),
  upvotes: integer("upvotes").default(0).notNull(),
  itiInvitationId: varchar("iti_invitation_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_voice_pins_project").on(t.projectId),
  index("idx_voice_pins_status").on(t.status),
  index("idx_voice_pins_iti").on(t.itiInvitationId),
]);

export const communityVoiceReactions = pgTable("community_voice_reactions", {
  id: serial("id").primaryKey(),
  pinId: varchar("pin_id", { length: 36 }).notNull().references(() => communityVoicePins.id, { onDelete: "cascade" }),
  reactionType: varchar("reaction_type", { length: 16 }).notNull(),
  authorHash: varchar("author_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("uq_voice_reaction_pin_author_type").on(t.pinId, t.authorHash, t.reactionType),
]);

export const communityVoiceComments = pgTable("community_voice_comments", {
  id: serial("id").primaryKey(),
  pinId: varchar("pin_id", { length: 36 }).notNull().references(() => communityVoicePins.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  authorType: varchar("author_type", { length: 24 }).default("resident").notNull(),
  authorName: varchar("author_name", { length: 128 }),
  anonymized: boolean("anonymized").default(true).notNull(),
  crisisFlag: boolean("crisis_flag").default(false).notNull(),
  status: varchar("status", { length: 16 }).default("published").notNull(),
  ipHash: varchar("ip_hash", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunityVoiceProjectSchema = createInsertSchema(communityVoiceProjects).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertCommunityVoiceProject = z.infer<typeof insertCommunityVoiceProjectSchema>;
export type CommunityVoiceProject = typeof communityVoiceProjects.$inferSelect;

export const insertCommunityVoicePinSchema = createInsertSchema(communityVoicePins).omit({
  id: true, accessToken: true, createdAt: true, updatedAt: true, upvotes: true, ipHash: true,
  sentiment: true, crisisFlag: true, crisisRoutedTo: true, englishMirror: true, status: true,
});
export type InsertCommunityVoicePin = z.infer<typeof insertCommunityVoicePinSchema>;
export type CommunityVoicePin = typeof communityVoicePins.$inferSelect;

export const insertCommunityVoiceReactionSchema = createInsertSchema(communityVoiceReactions).omit({
  id: true, createdAt: true,
});
export type InsertCommunityVoiceReaction = z.infer<typeof insertCommunityVoiceReactionSchema>;
export type CommunityVoiceReaction = typeof communityVoiceReactions.$inferSelect;

export const insertCommunityVoiceCommentSchema = createInsertSchema(communityVoiceComments).omit({
  id: true, createdAt: true, ipHash: true, crisisFlag: true, status: true,
});
export type InsertCommunityVoiceComment = z.infer<typeof insertCommunityVoiceCommentSchema>;
export type CommunityVoiceComment = typeof communityVoiceComments.$inferSelect;

// === Community Voice Phase 2/3 — AI insights + chain-web routing ===
export const communityVoiceInsights = pgTable("community_voice_insights", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => communityVoiceProjects.id, { onDelete: "cascade" }),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: varchar("generated_by", { length: 64 }),
  pinCount: integer("pin_count").notNull(),
  themes: jsonb("themes").notNull(),
  sentimentTimeline: jsonb("sentiment_timeline"),
  stakeholderBreakdown: jsonb("stakeholder_breakdown"),
  modelUsed: varchar("model_used", { length: 64 }),
  syncedToStoryAt: timestamp("synced_to_story_at"),
}, (t) => [
  index("idx_voice_insights_project").on(t.projectId),
]);

export const communityVoiceRouting = pgTable("community_voice_routing", {
  id: serial("id").primaryKey(),
  pinId: varchar("pin_id", { length: 36 }).notNull().references(() => communityVoicePins.id, { onDelete: "cascade" }),
  targetPlatform: varchar("target_platform", { length: 64 }).notNull(),
  routedAt: timestamp("routed_at").defaultNow().notNull(),
  status: varchar("status", { length: 16 }).default("queued").notNull(),
  outcome: text("outcome"),
  outcomeRecordedAt: timestamp("outcome_recorded_at"),
  recordedBy: varchar("recorded_by", { length: 64 }),
}, (t) => [
  index("idx_voice_routing_pin").on(t.pinId),
  index("idx_voice_routing_target").on(t.targetPlatform),
]);

export const insertCommunityVoiceInsightSchema = createInsertSchema(communityVoiceInsights).omit({
  id: true, generatedAt: true,
});
export type InsertCommunityVoiceInsight = z.infer<typeof insertCommunityVoiceInsightSchema>;
export type CommunityVoiceInsight = typeof communityVoiceInsights.$inferSelect;

export const insertCommunityVoiceRoutingSchema = createInsertSchema(communityVoiceRouting).omit({
  id: true, routedAt: true,
});
export type InsertCommunityVoiceRouting = z.infer<typeof insertCommunityVoiceRoutingSchema>;
export type CommunityVoiceRouting = typeof communityVoiceRouting.$inferSelect;

// ── Regional Briefing: saved, reusable, multi-location workflows ──
export const briefingWorkflows = pgTable("briefing_workflows", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  question: text("question").notNull(),
  // jsonb: [{ label: "Round Rock TX 78664", region: "Round Rock TX", zip: "78664", countyFips?: "48491", metroId?: "..." }, ...]
  locations: jsonb("locations").$type<Array<{
    label: string;
    region: string;
    zip?: string;
    countyFips?: string;
    metroId?: string;
  }>>().notNull(),
  topic: varchar("topic", { length: 200 }).notNull(),
  // Optional cached last answer for instant reload
  lastBriefing: text("last_briefing"),
  lastRunAt: timestamp("last_run_at"),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_briefing_workflows_created_by").on(t.createdBy),
]);

export const insertBriefingWorkflowSchema = createInsertSchema(briefingWorkflows).omit({
  id: true, createdAt: true, updatedAt: true, lastBriefing: true, lastRunAt: true,
});
export type InsertBriefingWorkflow = z.infer<typeof insertBriefingWorkflowSchema>;
export type BriefingWorkflow = typeof briefingWorkflows.$inferSelect;

// ============================================================================
// MULTI-TENANT GRANT DISCOVERY (Task #54)
// One organization per signed-in user; per-org grant scoring, tracking, and
// RFP document layering. TCAF's internal pipeline stays untouched on
// grantOpportunities.fitScore — these tables hold every OTHER org's view.
// ============================================================================

export const organizations = pgTable("organizations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  ein: varchar("ein", { length: 32 }),
  missionText: text("mission_text"),
  capabilityStatementUrl: varchar("capability_statement_url", { length: 1000 }),
  capabilityStatementText: text("capability_statement_text"),
  focusAreas: text("focus_areas").array().notNull().default(sql`'{}'::text[]`),
  populationsServed: text("populations_served").array().notNull().default(sql`'{}'::text[]`),
  state: varchar("state", { length: 2 }),
  counties: text("counties").array().notNull().default(sql`'{}'::text[]`),
  budgetRange: varchar("budget_range", { length: 50 }),
  is501c3: boolean("is_501c3").notNull().default(false),
  isTcafOrg: boolean("is_tcaf_org").notNull().default(false),
  // Conglomerate / open-collaboration model. When true, any signed-in user
  // can self-join this org as a collaborator via POST /api/me/organizations/:id/join
  // (no invite, no gatekeeping). Set true on TCAF's org at startup; org
  // owners can flip it on their own settings page.
  acceptsCollaborators: boolean("accepts_collaborators").notNull().default(false),
  naicsCodes: text("naics_codes").array().notNull().default(sql`'{}'::text[]`),
  pscCodes: text("psc_codes").array().notNull().default(sql`'{}'::text[]`),
  uei: varchar("uei", { length: 32 }),
  cageCode: varchar("cage_code", { length: 16 }),
  samStatus: varchar("sam_status", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_orgs_user").on(t.userId),
]);

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true, createdAt: true, updatedAt: true, isTcafOrg: true,
});
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Multi-user collaboration on a single org workspace. Replaces the implicit
// "one user = one org" rule from organizations.user_id (which is kept as the
// org-creator/legacy-owner column for backfill compatibility). A user with
// memberships in multiple orgs disambiguates per-request via the x-org-id
// header (see server/tenant-middleware.ts loadCallerOrg).
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 32 }).notNull().default("member"), // owner | member
  invitedByUserId: varchar("invited_by_user_id", { length: 255 }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_org_members_unique").on(t.orgId, t.userId),
  index("idx_org_members_user").on(t.userId),
  index("idx_org_members_org").on(t.orgId),
]);
export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).omit({ id: true, joinedAt: true });
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;


export const grantOrgScores = pgTable("grant_org_scores", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantId: varchar("grant_id", { length: 100 }).notNull(),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  fitScore: integer("fit_score").notNull(),
  reasoning: text("reasoning"),
  scoredAt: timestamp("scored_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_grant_org_unique").on(t.grantId, t.orgId),
  index("idx_grant_org_org").on(t.orgId),
]);

export const insertGrantOrgScoreSchema = createInsertSchema(grantOrgScores).omit({ id: true, scoredAt: true });
export type InsertGrantOrgScore = z.infer<typeof insertGrantOrgScoreSchema>;
export type GrantOrgScore = typeof grantOrgScores.$inferSelect;

export const grantOrgTracking = pgTable("grant_org_tracking", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantId: varchar("grant_id", { length: 100 }).notNull(),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  // status: tracking | applied | won | lost | withdrawn | dismissed
  status: varchar("status", { length: 32 }).notNull().default("tracking"),
  notes: text("notes"),
  appliedAt: timestamp("applied_at"),
  decidedAt: timestamp("decided_at"),
  awardAmount: integer("award_amount"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_tracking_unique").on(t.grantId, t.orgId),
  index("idx_tracking_org_status").on(t.orgId, t.status),
]);

export const insertGrantOrgTrackingSchema = createInsertSchema(grantOrgTracking).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertGrantOrgTracking = z.infer<typeof insertGrantOrgTrackingSchema>;
export type GrantOrgTracking = typeof grantOrgTracking.$inferSelect;

// Org document library: capability statements, 501c3 letters, W-9s, insurance certs,
// past-performance writeups, audited financials, resumes/bios — tagged by the affiliated
// entity (e.g., HIS, Love Clinic, Vanntastic, Sistahs CWT, TCAF) the doc belongs to.
// Lets a primary org maintain a single library for itself + all teaming partners.
export const orgDocuments = pgTable("org_documents", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  affiliateName: varchar("affiliate_name", { length: 200 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  fileUrl: varchar("file_url", { length: 1000 }).notNull(),
  fileName: varchar("file_name", { length: 500 }),
  fileSize: integer("file_size"),
  contentType: varchar("content_type", { length: 100 }),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (t) => [
  index("idx_org_docs_org_affiliate").on(t.orgId, t.affiliateName),
]);

export const insertOrgDocumentSchema = createInsertSchema(orgDocuments).omit({ id: true, uploadedAt: true });
export type InsertOrgDocument = z.infer<typeof insertOrgDocumentSchema>;
export type OrgDocument = typeof orgDocuments.$inferSelect;

// RFP documents: base RFP + amendments + Q&A transcripts.
// Precedence at draft time: qa > amendment > base.
export const rfpDocuments = pgTable("rfp_documents", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }), // nullable — user may upload before linking to a grant
  kind: varchar("kind", { length: 16 }).notNull(), // base | amendment | qa
  title: varchar("title", { length: 500 }).notNull(),
  fileUrl: varchar("file_url", { length: 1000 }),
  parsedText: text("parsed_text").notNull(),
  version: integer("version").notNull().default(1),
  supersedesId: varchar("supersedes_id", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (t) => [
  index("idx_rfp_docs_org_grant").on(t.orgId, t.grantId),
]);

export const insertRfpDocumentSchema = createInsertSchema(rfpDocuments).omit({ id: true, uploadedAt: true });
export type InsertRfpDocument = z.infer<typeof insertRfpDocumentSchema>;
export type RfpDocument = typeof rfpDocuments.$inferSelect;

// Cached RFP rubric extraction. JSON shape:
// { sections: [{ name, pointValue, requirements[], tone?, headingPattern? }], pageLimits, format, ... }
export const rfpRubrics = pgTable("rfp_rubrics", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id", { length: 100 }).notNull(),
  rubric: jsonb("rubric").notNull(),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_rubric_doc").on(t.documentId),
]);

export type RfpRubric = typeof rfpRubrics.$inferSelect;

// Agency intelligence cache: prior-award patterns by agency.
export const agencyIntelligence = pgTable("agency_intelligence", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  agencyName: varchar("agency_name", { length: 500 }).notNull(),
  cfda: varchar("cfda", { length: 50 }),
  opportunityNumber: varchar("opportunity_number", { length: 100 }),
  // intel JSON: { typicalAwardSize, typicalDuration, recentWinners: [...], whatTheyFund, languagePatterns: [...] }
  intel: jsonb("intel").notNull(),
  refreshedAt: timestamp("refreshed_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_agency_intel_unique").on(t.agencyName, t.cfda, t.opportunityNumber),
]);

export type AgencyIntelligence = typeof agencyIntelligence.$inferSelect;

// Self-learning loop: when an org marks a grant "awarded", they can save the
// winning draft. Future drafts for the same funder (or similar funders/dollar
// tiers) retrieve up to 3 of these and inject them as "this is how we win."
export const wonProposals = pgTable("won_proposals", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }),
  funderName: varchar("funder_name", { length: 500 }).notNull(),
  funderType: varchar("funder_type", { length: 32 }).notNull().default("government"), // government | foundation | corporate | state | local
  dollarAmount: integer("dollar_amount"),
  projectTitle: varchar("project_title", { length: 500 }),
  draftText: text("draft_text").notNull(),
  sections: jsonb("sections"), // optional structured sections for finer retrieval
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  awardedAt: timestamp("awarded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_won_proposals_org").on(t.orgId),
  index("idx_won_proposals_funder").on(t.orgId, t.funderName),
]);

export const insertWonProposalSchema = createInsertSchema(wonProposals).omit({ id: true, createdAt: true });
export type InsertWonProposal = z.infer<typeof insertWonProposalSchema>;
export type WonProposal = typeof wonProposals.$inferSelect;

// Foundation 990-PF cache. Keyed by EIN when known, else by normalized name.
// `intel` JSON shape mirrors AgencyIntel: typicalGrantSize, recentRecipients,
// whatTheyFund, languagePatterns, plus 990-PF specifics (totalAssets,
// totalGrantsPaid, fiscalYear).
export const foundationIntelligence = pgTable("foundation_intelligence", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  funderName: varchar("funder_name", { length: 500 }).notNull(),
  ein: varchar("ein", { length: 32 }),
  intel: jsonb("intel").notNull(),
  refreshedAt: timestamp("refreshed_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_foundation_intel_unique").on(t.funderName),
]);

export type FoundationIntelligence = typeof foundationIntelligence.$inferSelect;

// Per-RFP teaming + rubric strategy. Single source of truth shared by the
// tracking dashboard (front end) AND the AI writer engine (back end). When
// the writer drafts against an RFP that matches an active_bids row by
// rfpId or grantId, the per-criterion strategy + team lanes are injected
// into the prompt so the AI mirrors our cadence and uses the named evidence.
export const activeBids = pgTable("active_bids", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  rfpId: varchar("rfp_id", { length: 100 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }),
  title: varchar("title", { length: 500 }).notNull(),
  funder: varchar("funder", { length: 500 }).notNull(),
  deadline: varchar("deadline", { length: 200 }).notNull(),
  deadlineIso: timestamp("deadline_iso").notNull(),
  teamIds: text("team_ids").array().notNull().default(sql`'{}'::text[]`),
  notes: text("notes").notNull().default(""),
  submission: text("submission").notNull().default(""),
  rubric: jsonb("rubric").notNull(), // ActiveBidRubricLine[] from shared/active-bids.ts
  status: varchar("status", { length: 32 }).notNull().default("tracking"), // tracking | drafting | submitted | won | lost | withdrawn
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_active_bids_rfp_unique").on(t.rfpId),
  index("idx_active_bids_grant").on(t.grantId),
  index("idx_active_bids_deadline").on(t.deadlineIso),
]);

export const insertActiveBidSchema = createInsertSchema(activeBids).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertActiveBid = z.infer<typeof insertActiveBidSchema>;
export type ActiveBidRow = typeof activeBids.$inferSelect;

// === RFP FIDELITY ENGINE ===
// Compliance Matrix Items: every "shall / must / will / should / may" requirement
// extracted verbatim from the RFP + amendments + Q&A, with answering paragraph
// trace and optional workaround. The drafter mirrors this matrix back at the
// reviewer factor-by-factor. The audit pass at the end refuses to mark
// "submit-ready" until every shall/must has an answering paragraph (covered
// OR with a stated workaround). Section L items (instructions to offerors) and
// Section M items (evaluation factors) are tagged separately because Section L
// noncompliance gets a proposal rejected BEFORE Section M is scored.
export const complianceMatrixItems = pgTable("compliance_matrix_items", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }), // nullable until linked
  documentId: varchar("document_id", { length: 100 }), // which RFP doc this came from (base | amendment | qa)
  reqNumber: varchar("req_number", { length: 32 }).notNull(), // e.g. "L.3.2-a" or "M-4-3"
  rfpSection: varchar("rfp_section", { length: 200 }).notNull(), // e.g. "Section L.3.2 — Past Performance"
  sectionType: varchar("section_type", { length: 16 }).notNull().default("M"), // L (instructions/format) | M (evaluation) | C (work statement) | other
  requirementVerbatim: text("requirement_verbatim").notNull(), // exact RFP language
  requirementType: varchar("requirement_type", { length: 16 }).notNull(), // shall | must | will | should | may | informational
  scoringWeight: integer("scoring_weight"), // points for this item if scored, else null
  sourceKind: varchar("source_kind", { length: 16 }).notNull().default("base"), // base | amendment | qa | meeting-notes
  evidenceRef: text("evidence_ref").notNull().default(""), // pointer to our supporting evidence
  workaroundProposed: text("workaround_proposed").notNull().default(""), // hybrid: empty when we're a clean fit
  answeringSectionName: varchar("answering_section_name", { length: 500 }).notNull().default(""), // which draft section answers this
  status: varchar("status", { length: 16 }).notNull().default("open"), // open | covered | workaround | gap
  confidence: integer("confidence").notNull().default(0), // 0-100, honest self-rating
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_compliance_matrix_grant").on(t.orgId, t.grantId),
  index("idx_compliance_matrix_status").on(t.grantId, t.status),
  index("idx_compliance_matrix_section_type").on(t.grantId, t.sectionType),
]);

export const insertComplianceMatrixItemSchema = createInsertSchema(complianceMatrixItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceMatrixItem = z.infer<typeof insertComplianceMatrixItemSchema>;
export type ComplianceMatrixItem = typeof complianceMatrixItems.$inferSelect;

// === PROPOSAL STUDIO v2 — Phase 0 tables (added 2026-05-27) ===
// Three primitives that close the four real internal-stack gaps (L1 ingestion,
// L3 gap-closure workflow, L5 inline evidence binding) named in
// docs/proposal-studio-v2/PLANNING.md. Tenant-scoped via orgId; ready for
// the contracting-only fork per user directive 2026-05-27 (Option B).

// L1 — RFP ingestion jobs. Each row is one PDF that was uploaded for parsing.
// Persists the source doc text + the AI-extracted Section L/M items so we have
// a re-runnable audit trail (Iron Rule #11 verify-then-claim).
export const rfpIngestionJobs = pgTable("rfp_ingestion_jobs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }),
  documentKind: varchar("document_kind", { length: 16 }).notNull().default("base"), // base | amendment | qa
  filename: varchar("filename", { length: 500 }).notNull(),
  rawText: text("raw_text").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("uploaded"), // uploaded | parsed | failed
  itemsExtracted: integer("items_extracted").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  parsedAt: timestamp("parsed_at"),
}, (t) => [
  index("idx_rfp_ingestion_org").on(t.orgId),
  index("idx_rfp_ingestion_grant").on(t.grantId),
]);
export const insertRfpIngestionJobSchema = createInsertSchema(rfpIngestionJobs).omit({ id: true, createdAt: true, parsedAt: true });
export type InsertRfpIngestionJob = z.infer<typeof insertRfpIngestionJobSchema>;
export type RfpIngestionJob = typeof rfpIngestionJobs.$inferSelect;

// L3 — Gap-closure workflow. Replaces the {{ACTION REQUIRED}} string convention
// with an assignable task surface: owner, deadline, primary-source-verification
// gate. Iron Rules #2 + #10 enforced in the UI (cannot mark resolved without
// verification source + verbatim quote).
export const gapClosureItems = pgTable("gap_closure_items", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }).notNull(),
  complianceItemId: varchar("compliance_item_id", { length: 100 }), // optional FK to complianceMatrixItems
  title: varchar("title", { length: 500 }).notNull(), // e.g. "Confirm Change 1 entity status"
  description: text("description").notNull().default(""),
  assignedOwner: varchar("assigned_owner", { length: 200 }).notNull().default(""), // "Dr. Flood" | "Cortney" | partner org name
  assignedEmail: varchar("assigned_email", { length: 300 }),
  deadline: timestamp("deadline"),
  status: varchar("status", { length: 16 }).notNull().default("open"), // open | in-progress | resolved | wontfix | escalated
  verificationSource: text("verification_source").notNull().default(""), // primary-source URL or file path
  verificationVerbatim: text("verification_verbatim").notNull().default(""), // verbatim quote from source
  resolvedBy: varchar("resolved_by", { length: 200 }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_gap_closure_grant").on(t.orgId, t.grantId),
  index("idx_gap_closure_status").on(t.grantId, t.status),
  index("idx_gap_closure_deadline").on(t.deadline),
]);
export const insertGapClosureItemSchema = createInsertSchema(gapClosureItems).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
export type InsertGapClosureItem = z.infer<typeof insertGapClosureItemSchema>;
export type GapClosureItem = typeof gapClosureItems.$inferSelect;

// L5 — Inline evidence binding. Every claim in a proposal paragraph cites a
// primary source (RPLICE id, URL, file path, won-proposal id, partner LOS, etc).
// Pre-submit gate refuses to export if any paragraph in scope has unbound
// claims. Iron Rules #2 + #11.
export const evidenceBindings = pgTable("evidence_bindings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 100 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }).notNull(),
  paragraphRef: varchar("paragraph_ref", { length: 200 }).notNull(), // e.g. "concept-note.md#why-this-clears-gate-e5"
  claimText: text("claim_text").notNull(), // the exact claim that needs binding
  sourceKind: varchar("source_kind", { length: 32 }).notNull(), // rplice | url | file | won-proposal | partner-los | primary-doc
  sourceRef: text("source_ref").notNull(), // RPLICE id / URL / file path / wonProposal.id
  verbatimQuote: text("verbatim_quote").notNull().default(""), // quote from the source backing the claim
  inWindow: boolean("in_window").notNull().default(true), // for date-restricted funders (Wellcome ≤5yr); false fails pre-submit gate
  verifiedBy: varchar("verified_by", { length: 200 }),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_evidence_grant").on(t.orgId, t.grantId),
  index("idx_evidence_paragraph").on(t.grantId, t.paragraphRef),
]);
export const insertEvidenceBindingSchema = createInsertSchema(evidenceBindings).omit({ id: true, createdAt: true, verifiedAt: true });
export type InsertEvidenceBinding = z.infer<typeof insertEvidenceBindingSchema>;
export type EvidenceBinding = typeof evidenceBindings.$inferSelect;

// === INTEGRATION THROUGH INVITATION (ITI) ===
// Dignity primitive: brings people doing community work in the shadows into the
// fold — with witness, layered consent, credit, and (optional) stipend +
// credentialing pathway. Universal across the platform: Voice, Foster-Youth
// intake, LifeBridge, Justice Hub, Trade Sims, Whole-Person Health, grant
// proposals. Greater Austin first; replicable nationwide. See Iron Rule #8.
//
// Pattern: anti-extraction by default. ALL consent toggles default false.
// Self-identification — no credential check, no proof asked. Witness loop is
// always on. Capability-token auth (same as foster-youth intake) so people
// can come back to their own record without creating an account.
export const integrationInvitations = pgTable("integration_invitations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  // Capability token — returned ONCE on creation, required in `x-iti-token` header thereafter
  accessToken: text("access_token").notNull().unique(),

  // Self-identification — they choose what to share
  displayName: text("display_name"),                       // first name, pseudonym, role — their choice
  preferredContact: text("preferred_contact"),             // phone, email, WhatsApp, "don't contact me"
  preferredLanguage: varchar("preferred_language", { length: 16 }).notNull().default("en"),

  // The work they do — THEIR words, not our taxonomy
  workDescription: text("work_description").notNull(),     // free text
  workRolesSelfIdentified: text("work_roles_self_identified").array(), // optional tags THEY choose
  yearsDoingWork: text("years_doing_work"),                // free text: "since my grandbaby was born"

  // Where they're working
  region: text("region"),                                  // free text — "north Round Rock"
  zipCode: varchar("zip_code", { length: 12 }),            // optional

  // How they came in (which surface invited them)
  surface: varchar("surface", { length: 64 }).notNull(),   // 'voice-project' | 'foster-intake' | 'lifebridge' | 'justice-hub' | 'trade-sims' | 'wph' | 'public-site' | 'direct'
  surfaceContext: text("surface_context"),                 // e.g. voice project slug, intake type

  // Status
  status: varchar("status", { length: 16 }).notNull().default("invited"), // invited | active | withdrawn
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at"),
  withdrawnAt: timestamp("withdrawn_at"),
}, (t) => [
  index("idx_iti_surface").on(t.surface),
  index("idx_iti_status").on(t.status),
  index("idx_iti_region").on(t.region),
]);

// Layered consent — each independent, each revocable, ALL default false (anti-extraction)
export const invitationConsents = pgTable("invitation_consents", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id", { length: 100 }).notNull().references(() => integrationInvitations.id, { onDelete: "cascade" }),

  quoteMe: boolean("quote_me").notNull().default(false),               // can we quote your words anywhere
  aggregateMyData: boolean("aggregate_my_data").notNull().default(false), // can we include you in AI clustering / insights
  nameMePublicly: boolean("name_me_publicly").notNull().default(false),   // can we credit you by name (default name vs anon)
  routeMyInfoToService: boolean("route_my_info_to_service").notNull().default(false), // route you to LifeBridge / WPH / etc
  shareWithFunder: boolean("share_with_funder").notNull().default(false), // can your story be cited in a grant proposal
  inviteToConvening: boolean("invite_to_convening").notNull().default(false), // invite you to the room when funders meet
  acceptStipend: boolean("accept_stipend").notNull().default(false),       // would you accept compensation for your time
  routeToCredentialing: boolean("route_to_credentialing").notNull().default(false), // route you to CHW / daycare license / peer cert / apprenticeship

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_iti_consent_invitation").on(t.invitationId),
]);

// Witness loop audit trail — every time someone is heard, credited, paid, invited
export const recognitionEvents = pgTable("recognition_events", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id", { length: 100 }).notNull().references(() => integrationInvitations.id, { onDelete: "cascade" }),

  eventType: varchar("event_type", { length: 32 }).notNull(), // 'heard' | 'credited' | 'paid' | 'invited' | 'cited-in-grant' | 'routed-to-service' | 'co-authored' | 'corrected-record' | 'credentialing-referred'
  description: text("description").notNull(),
  actorRole: varchar("actor_role", { length: 32 }),           // who did the seeing
  actorId: varchar("actor_id", { length: 100 }),

  surfaceRef: text("surface_ref"),                            // e.g. voice pin id, grant id, insight id
  payloadJson: jsonb("payload_json"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_iti_recog_invitation").on(t.invitationId, t.createdAt),
  index("idx_iti_recog_type").on(t.eventType),
]);

export const insertIntegrationInvitationSchema = createInsertSchema(integrationInvitations).omit({ id: true, accessToken: true, createdAt: true, lastSeenAt: true, withdrawnAt: true });
export type InsertIntegrationInvitation = z.infer<typeof insertIntegrationInvitationSchema>;
export type IntegrationInvitation = typeof integrationInvitations.$inferSelect;

export const insertInvitationConsentsSchema = createInsertSchema(invitationConsents).omit({ id: true, updatedAt: true });
export type InsertInvitationConsents = z.infer<typeof insertInvitationConsentsSchema>;
export type InvitationConsents = typeof invitationConsents.$inferSelect;

export const insertRecognitionEventSchema = createInsertSchema(recognitionEvents).omit({ id: true, createdAt: true });
export type InsertRecognitionEvent = z.infer<typeof insertRecognitionEventSchema>;
export type RecognitionEvent = typeof recognitionEvents.$inferSelect;

// === Week 3: Convening rail — named co-authorship workflow ===
// When an ITI invitee's contribution materially shapes a deliverable
// (grant section, report, public testimony, working group), they get
// invited to be NAMED as co-author. They control acceptance + naming
// (linked to invitation_consents.nameMePublicly + co_author_credit).
export const conveningInvitations = pgTable("convening_invitations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id", { length: 100 }).notNull().references(() => integrationInvitations.id, { onDelete: "cascade" }),
  conveningType: varchar("convening_type", { length: 32 }).notNull(), // 'grant-coauthor' | 'report-coauthor' | 'working-group' | 'public-testimony' | 'advisory-board'
  title: text("title").notNull(),
  contextRef: text("context_ref"), // e.g. grant id, report id
  proposedRole: text("proposed_role"),
  proposedStipendCents: integer("proposed_stipend_cents"),
  status: varchar("status", { length: 16 }).default("invited").notNull(), // 'invited' | 'accepted' | 'declined' | 'completed'
  inviteeResponse: text("invitee_response"),
  respondedAt: timestamp("responded_at"),
  invitedByActorId: varchar("invited_by_actor_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_iti_convening_invitation").on(t.invitationId),
  index("idx_iti_convening_status").on(t.status),
]);

// === Week 3: Stipend payouts — real money, tracked + auditable ===
// Stipend doctrine: pathways must be REAL, not aspirational. Every payout
// logged with a receipt or external reference (ACH ID, check #, gift-card SKU).
// Payment itself is manual / out-of-band; this is the ledger.
export const stipendPayouts = pgTable("stipend_payouts", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id", { length: 100 }).notNull().references(() => integrationInvitations.id, { onDelete: "cascade" }),
  conveningInvitationId: varchar("convening_invitation_id", { length: 100 }).references(() => conveningInvitations.id, { onDelete: "set null" }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  paymentMethod: varchar("payment_method", { length: 24 }).notNull(), // 'ach' | 'check' | 'gift-card' | 'cash-app' | 'venmo' | 'other'
  externalRef: varchar("external_ref", { length: 200 }), // ACH trace, check #, gift card SKU
  rationale: text("rationale").notNull(), // why this payment, what work
  status: varchar("status", { length: 16 }).default("logged").notNull(), // 'logged' | 'sent' | 'received-confirmed' | 'failed'
  paidAt: timestamp("paid_at"),
  loggedByActorId: varchar("logged_by_actor_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_iti_stipend_invitation").on(t.invitationId),
  index("idx_iti_stipend_status").on(t.status),
]);

export const insertConveningInvitationSchema = createInsertSchema(conveningInvitations).omit({ id: true, createdAt: true, updatedAt: true, respondedAt: true });
export type InsertConveningInvitation = z.infer<typeof insertConveningInvitationSchema>;
export type ConveningInvitation = typeof conveningInvitations.$inferSelect;

export const insertStipendPayoutSchema = createInsertSchema(stipendPayouts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStipendPayout = z.infer<typeof insertStipendPayoutSchema>;
export type StipendPayout = typeof stipendPayouts.$inferSelect;

// ==================== SPARKY CHAT SESSIONS ====================

export const sparkySessions = pgTable("sparky_sessions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull().default("New Conversation"),
  context: varchar("context", { length: 100 }).default("general"),
  language: varchar("language", { length: 10 }).default("en"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sparkySessionMessages = pgTable("sparky_session_messages", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSparkySessionSchema = createInsertSchema(sparkySessions).omit({ id: true, createdAt: true, lastMessageAt: true });
export type InsertSparkySession = z.infer<typeof insertSparkySessionSchema>;
export type SparkySessionRow = typeof sparkySessions.$inferSelect;

export const insertSparkySessionMessageSchema = createInsertSchema(sparkySessionMessages).omit({ id: true, createdAt: true });
export type InsertSparkySessionMessage = z.infer<typeof insertSparkySessionMessageSchema>;
export type SparkySessionMessage = typeof sparkySessionMessages.$inferSelect;

// ==================== RURAL AGRICULTURE & PRODUCER TOOLS ====================

// Producer profile (farm enrollment in data cooperative)
export const producerProfiles = pgTable("producer_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  accessToken: varchar("access_token", { length: 64 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phoneDigitsOnly: varchar("phone_digits_only", { length: 20 }),
  farmName: varchar("farm_name", { length: 200 }),
  farmType: varchar("farm_type", { length: 100 }).notNull(), // row-crop, livestock, mixed, organic, specialty, beginning-farmer
  totalAcres: real("total_acres"),
  primaryCommodity: varchar("primary_commodity", { length: 100 }),
  otherCommodities: text("other_commodities").array().default(sql`'{}'::text[]`),
  stateFips: varchar("state_fips", { length: 2 }).notNull(),
  countyFips: varchar("county_fips", { length: 3 }).notNull(),
  countyName: varchar("county_name", { length: 100 }).notNull(),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  workerType: varchar("worker_type", { length: 100 }).default("owner-operator"), // owner-operator, tenant, farmworker, seasonal, h2a, informal
  isH2aWorker: boolean("is_h2a_worker").default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertProducerProfileSchema = createInsertSchema(producerProfiles).omit({ id: true, enrolledAt: true, updatedAt: true });
export type InsertProducerProfile = z.infer<typeof insertProducerProfileSchema>;
export type ProducerProfile = typeof producerProfiles.$inferSelect;

// ITI 8-layer consent for producers
export const producerDataConsents = pgTable("producer_data_consents", {
  id: serial("id").primaryKey(),
  producerId: integer("producer_id").notNull().references(() => producerProfiles.id, { onDelete: "cascade" }),
  shareSoilData: boolean("share_soil_data").default(false),
  shareYieldData: boolean("share_yield_data").default(false),
  shareIncomeData: boolean("share_income_data").default(false),
  shareWithResearchers: boolean("share_with_researchers").default(false),
  shareWithUsda: boolean("share_with_usda").default(false),
  shareWithFunders: boolean("share_with_funders").default(false),
  allowPublicNaming: boolean("allow_public_naming").default(false),
  interestedInStipend: boolean("interested_in_stipend").default(false),
  interestedInCredentials: boolean("interested_in_credentials").default(false),
  witnessLoopActive: boolean("witness_loop_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertProducerDataConsentSchema = createInsertSchema(producerDataConsents).omit({ id: true, updatedAt: true });
export type InsertProducerDataConsent = z.infer<typeof insertProducerDataConsentSchema>;
export type ProducerDataConsent = typeof producerDataConsents.$inferSelect;

// Producer data submissions (soil, yield, input costs)
export const producerDataSubmissions = pgTable("producer_data_submissions", {
  id: serial("id").primaryKey(),
  producerId: integer("producer_id").notNull().references(() => producerProfiles.id, { onDelete: "cascade" }),
  dataType: varchar("data_type", { length: 50 }).notNull(), // soil, yield, input-cost, market-access, water, labor
  cropYear: integer("crop_year"),
  commodity: varchar("commodity", { length: 100 }),
  acreage: real("acreage"),
  // Soil data
  soilPh: real("soil_ph"),
  organicMatterPct: real("organic_matter_pct"),
  nitrogenLbsAc: real("nitrogen_lbs_ac"),
  phosphorusLbsAc: real("phosphorus_lbs_ac"),
  potassiumLbsAc: real("potassium_lbs_ac"),
  // Yield data
  yieldPerAcre: real("yield_per_acre"),
  yieldUnit: varchar("yield_unit", { length: 30 }),
  // Input cost data
  seedCostPerAc: real("seed_cost_per_ac"),
  fertCostPerAc: real("fert_cost_per_ac"),
  chemCostPerAc: real("chem_cost_per_ac"),
  fuelCostPerAc: real("fuel_cost_per_ac"),
  laborCostPerAc: real("labor_cost_per_ac"),
  totalInputCostPerAc: real("total_input_cost_per_ac"),
  // Market / narrative
  priceReceived: real("price_received"),
  priceUnit: varchar("price_unit", { length: 30 }),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});
export const insertProducerDataSubmissionSchema = createInsertSchema(producerDataSubmissions).omit({ id: true, submittedAt: true });
export type InsertProducerDataSubmission = z.infer<typeof insertProducerDataSubmissionSchema>;
export type ProducerDataSubmission = typeof producerDataSubmissions.$inferSelect;

// Invasive species sightings (community-reported)
export const invasiveSpeciesSightings = pgTable("invasive_species_sightings", {
  id: serial("id").primaryKey(),
  reporterToken: varchar("reporter_token", { length: 64 }),
  reporterUserId: varchar("reporter_user_id", { length: 255 }),
  speciesCommonName: varchar("species_common_name", { length: 200 }).notNull(),
  speciesScientificName: varchar("species_scientific_name", { length: 200 }),
  speciesCategory: varchar("species_category", { length: 50 }).notNull(), // plant, insect, vertebrate, pathogen
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  locationDescription: varchar("location_description", { length: 300 }),
  stateFips: varchar("state_fips", { length: 2 }),
  countyFips: varchar("county_fips", { length: 3 }),
  countyName: varchar("county_name", { length: 100 }),
  observationDate: timestamp("observation_date").notNull(),
  acresAffectedEstimate: real("acres_affected_estimate"),
  severityLevel: varchar("severity_level", { length: 20 }).default("moderate"), // low, moderate, high, critical
  photoUrl: varchar("photo_url", { length: 500 }),
  notes: text("notes"),
  verificationStatus: varchar("verification_status", { length: 30 }).default("unverified"), // unverified, community-verified, extension-verified
  inatObservationId: varchar("inat_observation_id", { length: 50 }),
  reportedAt: timestamp("reported_at").defaultNow(),
});
export const insertInvasiveSpeciesSightingSchema = createInsertSchema(invasiveSpeciesSightings).omit({ id: true, reportedAt: true });
export type InsertInvasiveSpeciesSighting = z.infer<typeof insertInvasiveSpeciesSightingSchema>;
export type InvasiveSpeciesSighting = typeof invasiveSpeciesSightings.$inferSelect;

// Farm profitability snapshots
export const farmProfitabilitySnapshots = pgTable("farm_profitability_snapshots", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  sessionToken: varchar("session_token", { length: 64 }),
  snapshotName: varchar("snapshot_name", { length: 200 }).notNull(),
  commodity: varchar("commodity", { length: 100 }).notNull(),
  cropYear: integer("crop_year").notNull(),
  stateFips: varchar("state_fips", { length: 2 }),
  countyFips: varchar("county_fips", { length: 3 }),
  countyName: varchar("county_name", { length: 100 }),
  acres: real("acres").notNull(),
  yieldPerAcre: real("yield_per_acre").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  priceUnit: varchar("price_unit", { length: 30 }),
  grossRevenueTotal: real("gross_revenue_total"),
  totalInputCostPerAc: real("total_input_cost_per_ac").notNull(),
  totalInputCostTotal: real("total_input_cost_total"),
  netReturnPerAc: real("net_return_per_ac"),
  netReturnTotal: real("net_return_total"),
  breakEvenPrice: real("break_even_price"),
  nassAvgPrice: real("nass_avg_price"),
  nassAvgYield: real("nass_avg_yield"),
  fsaArcCoPaymentEstimate: real("fsa_arc_co_payment_estimate"),
  fsaPlcPaymentEstimate: real("fsa_plc_payment_estimate"),
  aiInsights: text("ai_insights"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertFarmProfitabilitySnapshotSchema = createInsertSchema(farmProfitabilitySnapshots).omit({ id: true, createdAt: true });
export type InsertFarmProfitabilitySnapshot = z.infer<typeof insertFarmProfitabilitySnapshotSchema>;
export type FarmProfitabilitySnapshot = typeof farmProfitabilitySnapshots.$inferSelect;

// Ag trade sim sessions (irrigation, soil, rotation simulations)
export const agSimSessions = pgTable("ag_sim_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  sessionToken: varchar("session_token", { length: 64 }),
  simType: varchar("sim_type", { length: 50 }).notNull(), // irrigation, soil-amendment, cover-crop-rotation
  title: varchar("title", { length: 200 }),
  inputsJson: text("inputs_json").notNull(),
  resultsJson: text("results_json"),
  aiRecommendation: text("ai_recommendation"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertAgSimSessionSchema = createInsertSchema(agSimSessions).omit({ id: true, createdAt: true });
export type InsertAgSimSession = z.infer<typeof insertAgSimSessionSchema>;
export type AgSimSession = typeof agSimSessions.$inferSelect;

// Farmworker ITI enrollments
export const farmworkerItiEnrollments = pgTable("farmworker_iti_enrollments", {
  id: serial("id").primaryKey(),
  accessToken: varchar("access_token", { length: 64 }).notNull().unique(),
  workerType: varchar("worker_type", { length: 80 }).notNull(), // seasonal, h2a, farmworker, promotora, community-gardener, backyard-grower, informal-food-producer
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  stateFips: varchar("state_fips", { length: 2 }),
  countyFips: varchar("county_fips", { length: 3 }),
  countyName: varchar("county_name", { length: 100 }),
  // 8-layer consent (all default OFF)
  consentSnapBenefits: boolean("consent_snap_benefits").default(false),
  consentWic: boolean("consent_wic").default(false),
  consentMedicaid: boolean("consent_medicaid").default(false),
  consentHousing: boolean("consent_housing").default(false),
  consentLegalAid: boolean("consent_legal_aid").default(false),
  consentWorkforce: boolean("consent_workforce").default(false),
  consentStipendPathway: boolean("consent_stipend_pathway").default(false),
  consentCredentialPathway: boolean("consent_credential_pathway").default(false),
  witnessLoopActive: boolean("witness_loop_active").default(true),
  isH2aWorker: boolean("is_h2a_worker").default(false),
  isDacaRecipient: boolean("is_daca_recipient").default(false),
  isPermanentResident: boolean("is_permanent_resident").default(false),
  hasUsWorkAuth: boolean("has_us_work_auth").default(true),
  benefitsReferralsJson: text("benefits_referrals_json"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});
export const insertFarmworkerItiEnrollmentSchema = createInsertSchema(farmworkerItiEnrollments).omit({ id: true, enrolledAt: true });
export type InsertFarmworkerItiEnrollment = z.infer<typeof insertFarmworkerItiEnrollmentSchema>;
export type FarmworkerItiEnrollment = typeof farmworkerItiEnrollments.$inferSelect;

// FSA eligibility checks (saved assessments)
export const fsaEligibilityChecks = pgTable("fsa_eligibility_checks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  sessionToken: varchar("session_token", { length: 64 }),
  stateFips: varchar("state_fips", { length: 2 }),
  countyFips: varchar("county_fips", { length: 3 }),
  countyName: varchar("county_name", { length: 100 }),
  farmType: varchar("farm_type", { length: 100 }),
  totalAcres: real("total_acres"),
  primaryCommodity: varchar("primary_commodity", { length: 100 }),
  hasEqipHistory: boolean("has_eqip_history").default(false),
  hasCrpHistory: boolean("has_crp_history").default(false),
  isBeginningFarmer: boolean("is_beginning_farmer").default(false),
  isSociallyDisadvantaged: boolean("is_socially_disadvantaged").default(false),
  isVeteranFarmer: boolean("is_veteran_farmer").default(false),
  grossFarmIncomePriorYr: real("gross_farm_income_prior_yr"),
  eligibleProgramsJson: text("eligible_programs_json"),
  estimatedPaymentsJson: text("estimated_payments_json"),
  aiNarrativeJson: text("ai_narrative_json"),
  checkedAt: timestamp("checked_at").defaultNow(),
});
export const insertFsaEligibilityCheckSchema = createInsertSchema(fsaEligibilityChecks).omit({ id: true, checkedAt: true });
export type InsertFsaEligibilityCheck = z.infer<typeof insertFsaEligibilityCheckSchema>;
export type FsaEligibilityCheck = typeof fsaEligibilityChecks.$inferSelect;

// ── Initiatives — AI-generated plans saved as initiative pages ────────────────
export const initiatives = pgTable("initiatives", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  category: varchar("category", { length: 60 }).default("initiative"),
  authorId: varchar("author_id", { length: 255 }),
  authorName: text("author_name"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertInitiativeSchema = createInsertSchema(initiatives).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;
export type Initiative = typeof initiatives.$inferSelect;

// ── ALIGN — Organizational & Community Framework ──────────────────────────────
// Org-level parallel: Mission (Spirit) · Culture (Soul) · Capacity (Body)
// Phase coverage: which ALIGN phases does this org's work actually serve?
export const alignOrgProfiles = pgTable("align_org_profiles", {
  id: serial("id").primaryKey(),
  orgId: varchar("org_id", { length: 100 }),      // fk to communityPartners.id (nullable for standalone)
  orgName: text("org_name").notNull(),
  orgType: varchar("org_type", { length: 100 }),  // nonprofit | faith | school | government | business | coalition
  submittedBy: varchar("submitted_by", { length: 255 }),
  currentPhase: varchar("current_phase", { length: 20 }).default("assess").notNull(),
  missionScore: integer("mission_score").default(0),   // clarity, values alignment, community trust
  cultureScore: integer("culture_score").default(0),   // staff wellbeing, lived-experience leadership
  capacityScore: integer("capacity_score").default(0), // funding stability, data systems, operations
  missionNotes: text("mission_notes"),
  cultureNotes: text("culture_notes"),
  capacityNotes: text("capacity_notes"),
  phaseCoverage: text("phase_coverage").array(),       // which phases org programs actually cover
  assessStartedAt: timestamp("assess_started_at"),
  listenEnteredAt: timestamp("listen_entered_at"),
  integrateEnteredAt: timestamp("integrate_entered_at"),
  guidePhaseEnteredAt: timestamp("guide_phase_entered_at"),
  navigateEnteredAt: timestamp("navigate_entered_at"),
  thriveEnteredAt: timestamp("thrive_entered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertAlignOrgProfileSchema = createInsertSchema(alignOrgProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlignOrgProfile = z.infer<typeof insertAlignOrgProfileSchema>;
export type AlignOrgProfile = typeof alignOrgProfiles.$inferSelect;

export const alignOrgPrograms = pgTable("align_org_programs", {
  id: serial("id").primaryKey(),
  orgProfileId: integer("org_profile_id").notNull(),
  programName: text("program_name").notNull(),
  programDescription: text("program_description"),
  alignPhases: text("align_phases").array(),   // which ALIGN phases this program covers
  participantsServed: integer("participants_served").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertAlignOrgProgramSchema = createInsertSchema(alignOrgPrograms).omit({ id: true, createdAt: true });
export type InsertAlignOrgProgram = z.infer<typeof insertAlignOrgProgramSchema>;
export type AlignOrgProgram = typeof alignOrgPrograms.$inferSelect;

// ── ALIGN — Holistic Individual Journey Framework ─────────────────────────────
// Phases: assess → listen → integrate → guide → navigate → thrive
// Dimensions: Spirit · Soul · Body (each scored 0–100)
export const alignProfiles = pgTable("align_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  currentPhase: varchar("current_phase", { length: 20 }).default("assess").notNull(),
  spiritScore: integer("spirit_score").default(0),
  soulScore: integer("soul_score").default(0),
  bodyScore: integer("body_score").default(0),
  spiritNotes: text("spirit_notes"),
  soulNotes: text("soul_notes"),
  bodyNotes: text("body_notes"),
  guideId: varchar("guide_id", { length: 255 }),
  guideName: text("guide_name"),
  assessStartedAt: timestamp("assess_started_at"),
  listenEnteredAt: timestamp("listen_entered_at"),
  integrateEnteredAt: timestamp("integrate_entered_at"),
  guidePhaseEnteredAt: timestamp("guide_phase_entered_at"),
  navigateEnteredAt: timestamp("navigate_entered_at"),
  thriveEnteredAt: timestamp("thrive_entered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertAlignProfileSchema = createInsertSchema(alignProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlignProfile = z.infer<typeof insertAlignProfileSchema>;
export type AlignProfile = typeof alignProfiles.$inferSelect;

export const alignPhaseEvents = pgTable("align_phase_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  phase: varchar("phase", { length: 20 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  resourceUrl: text("resource_url"),
  resourceLabel: text("resource_label"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertAlignPhaseEventSchema = createInsertSchema(alignPhaseEvents).omit({ id: true, createdAt: true });
export type InsertAlignPhaseEvent = z.infer<typeof insertAlignPhaseEventSchema>;
export type AlignPhaseEvent = typeof alignPhaseEvents.$inferSelect;

// ── CHAINWEB ROI CALCULATION SYSTEM ─────────────────────────────────────────
// Causal-chain engine: counterfactual (do nothing) vs intervention (change X)
// Every number traces to a cited primary source. No fabrication.
// Domains: early_childhood · education · housing · workforce · health · justice · family · civic · economic

export const chainwebScenarios = pgTable("chainweb_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  geographyType: varchar("geography_type", { length: 50 }).notNull(), // county | city | state | zip | national
  geographyLabel: text("geography_label").notNull(),                   // "Travis County, TX"
  geographyFips: varchar("geography_fips", { length: 20 }),
  entryDomain: varchar("entry_domain", { length: 50 }).notNull(),      // which domain starts the chain
  interventionName: text("intervention_name").notNull(),
  interventionDescription: text("intervention_description"),
  interventionCostPerPerson: decimal("intervention_cost_per_person", { precision: 12, scale: 2 }),
  populationSize: integer("population_size"),
  populationProfile: jsonb("population_profile"),                       // demographics, SDOH scores, etc.
  timeHorizonYears: integer("time_horizon_years").default(10),
  status: varchar("status", { length: 20 }).default("draft"),          // draft | calculated | published
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertChainwebScenarioSchema = createInsertSchema(chainwebScenarios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChainwebScenario = z.infer<typeof insertChainwebScenarioSchema>;
export type ChainwebScenario = typeof chainwebScenarios.$inferSelect;

export const chainwebNodes = pgTable("chainweb_nodes", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull(),
  domain: varchar("domain", { length: 50 }).notNull(),
  label: text("label").notNull(),                                      // "3rd Grade Reading Proficiency"
  unit: varchar("unit", { length: 60 }),                               // "% proficient" | "$/year" | "per 1000"
  counterfactualValue: decimal("counterfactual_value", { precision: 14, scale: 4 }),
  interventionValue: decimal("intervention_value", { precision: 14, scale: 4 }),
  delta: decimal("delta", { precision: 14, scale: 4 }),                // interventionValue - counterfactualValue
  annualizedCost: decimal("annualized_cost", { precision: 14, scale: 2 }),
  dataSource: text("data_source"),
  citation: text("citation"),
  year: integer("year"),
  isEntryNode: boolean("is_entry_node").default(false),
});
export const insertChainwebNodeSchema = createInsertSchema(chainwebNodes).omit({ id: true });
export type InsertChainwebNode = z.infer<typeof insertChainwebNodeSchema>;
export type ChainwebNode = typeof chainwebNodes.$inferSelect;

export const chainwebEdges = pgTable("chainweb_edges", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull(),
  fromNodeId: integer("from_node_id").notNull(),
  toNodeId: integer("to_node_id").notNull(),
  coefficient: decimal("coefficient", { precision: 8, scale: 4 }).notNull(), // effect size: 0.34 = 34% change
  lagYears: integer("lag_years").default(0),
  direction: varchar("direction", { length: 10 }).default("positive"),  // positive | negative
  evidenceCitation: text("evidence_citation"),
  confidenceLevel: varchar("confidence_level", { length: 20 }).default("moderate"), // strong | moderate | emerging
});
export const insertChainwebEdgeSchema = createInsertSchema(chainwebEdges).omit({ id: true });
export type InsertChainwebEdge = z.infer<typeof insertChainwebEdgeSchema>;
export type ChainwebEdge = typeof chainwebEdges.$inferSelect;

// Master coefficient library — evidence-based ripple coefficients, all cited
export const chainwebCoefficients = pgTable("chainweb_coefficients", {
  id: serial("id").primaryKey(),
  fromDomain: varchar("from_domain", { length: 50 }).notNull(),
  toDomain: varchar("to_domain", { length: 50 }).notNull(),
  fromMetric: text("from_metric").notNull(),
  toMetric: text("to_metric").notNull(),
  coefficient: decimal("coefficient", { precision: 8, scale: 4 }).notNull(),
  direction: varchar("direction", { length: 10 }).default("positive"),
  lagYears: integer("lag_years").default(0),
  unit: text("unit"),
  evidenceCitation: text("evidence_citation").notNull(),
  studyYear: integer("study_year"),
  populationNotes: text("population_notes"),
  confidenceLevel: varchar("confidence_level", { length: 20 }).default("moderate"),
  isActive: boolean("is_active").default(true),
});
export const insertChainwebCoefficientSchema = createInsertSchema(chainwebCoefficients).omit({ id: true });
export type InsertChainwebCoefficient = z.infer<typeof insertChainwebCoefficientSchema>;
export type ChainwebCoefficient = typeof chainwebCoefficients.$inferSelect;

// Calculated ROI output per scenario
export const chainwebCalculations = pgTable("chainweb_calculations", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull().unique(),
  timeHorizonYears: integer("time_horizon_years").notNull(),
  populationSize: integer("population_size"),
  counterfactualTotalCost: decimal("counterfactual_total_cost", { precision: 16, scale: 2 }),
  interventionTotalCost: decimal("intervention_total_cost", { precision: 16, scale: 2 }),
  netSavings: decimal("net_savings", { precision: 16, scale: 2 }),
  roiRatio: decimal("roi_ratio", { precision: 8, scale: 2 }),          // e.g. 8.40 = $8.40 saved per $1 invested
  domainBreakdown: jsonb("domain_breakdown"),                           // savings by domain
  keyStatements: jsonb("key_statements"),                               // top 5 cited ROI claims
  calculatedAt: timestamp("calculated_at").defaultNow(),
});
export const insertChainwebCalculationSchema = createInsertSchema(chainwebCalculations).omit({ id: true, calculatedAt: true });
export type InsertChainwebCalculation = z.infer<typeof insertChainwebCalculationSchema>;
export type ChainwebCalculation = typeof chainwebCalculations.$inferSelect;

// Stakeholder-specific narrative outputs
export const chainwebNarratives = pgTable("chainweb_narratives", {
  id: serial("id").primaryKey(),
  calculationId: integer("calculation_id").notNull(),
  audienceType: varchar("audience_type", { length: 40 }).notNull(), // grant_writer | org_leader | researcher | council | funder
  headline: text("headline"),
  narrativeText: text("narrative_text"),
  keyStats: jsonb("key_stats"),
  dataCitations: jsonb("data_citations"),
  generatedAt: timestamp("generated_at").defaultNow(),
});
export const insertChainwebNarrativeSchema = createInsertSchema(chainwebNarratives).omit({ id: true, generatedAt: true });
export type InsertChainwebNarrative = z.infer<typeof insertChainwebNarrativeSchema>;
export type ChainwebNarrative = typeof chainwebNarratives.$inferSelect;

// ── CEDS — Comprehensive Economic Development Strategy Integration ────────────
// Maps EDA Economic Development Districts (EDDs) → strategic goals → TCAF alignments.
// EDA requires 5 performance measures in every CEDS; those become our evidence anchors.

export const cedsRegions = pgTable("ceds_regions", {
  id: serial("id").primaryKey(),
  eddName: text("edd_name").notNull(),                    // e.g. "Nortex Regional Planning Commission"
  eddAbbr: varchar("edd_abbr", { length: 20 }),           // e.g. "NORTEX"
  state: varchar("state", { length: 2 }).notNull(),       // TX, OK, etc.
  countyFips: text("county_fips").array(),                // 5-digit FIPS codes
  countyNames: text("county_names").array(),              // human-readable county names
  cedsYear: integer("ceds_year"),                         // year of current approved CEDS
  edaDistrictId: varchar("eda_district_id", { length: 50 }),
  edaUrl: text("eda_url"),                                // EDA/EDD website
  cedsDocUrl: text("ceds_doc_url"),                       // URL to approved CEDS PDF
  strategicVision: text("strategic_vision"),              // 1-sentence CEDS vision statement
  populationServed: integer("population_served"),
  distressedDesignation: boolean("distressed_designation").default(false),
  planningOrg: text("planning_org"),                      // COG or planning org name
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertCedsRegionSchema = createInsertSchema(cedsRegions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCedsRegion = z.infer<typeof insertCedsRegionSchema>;
export type CedsRegion = typeof cedsRegions.$inferSelect;

export const cedsGoals = pgTable("ceds_goals", {
  id: serial("id").primaryKey(),
  regionId: integer("region_id").notNull(),              // fk cedsRegions.id
  goalNumber: integer("goal_number").notNull(),
  category: varchar("category", { length: 60 }).notNull(), // workforce | innovation | infrastructure | economic_base | quality_of_life
  goalTitle: text("goal_title").notNull(),
  goalDescription: text("goal_description"),
  performanceMeasures: jsonb("performance_measures"),    // EDA's 5 measures + region-specific KPIs
  targetYear: integer("target_year"),
  tcafAlignment: text("tcaf_alignment"),                 // how TCAF programs address this goal
  edaMeasureIds: text("eda_measure_ids").array(),        // which of EDA's 5 official measures apply
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertCedsGoalSchema = createInsertSchema(cedsGoals).omit({ id: true, createdAt: true });
export type InsertCedsGoal = z.infer<typeof insertCedsGoalSchema>;
export type CedsGoal = typeof cedsGoals.$inferSelect;

export const cedsAlignments = pgTable("ceds_alignments", {
  id: serial("id").primaryKey(),
  regionId: integer("region_id").notNull(),
  goalId: integer("goal_id"),
  tcafProgram: text("tcaf_program").notNull(),           // e.g. "Navigator", "Trade Sims", "Child Care"
  alignmentScore: integer("alignment_score").default(0), // 1-5
  alignmentNotes: text("alignment_notes"),
  edaPerformanceMeasure: varchar("eda_performance_measure", { length: 80 }), // which EDA measure this maps to
  proposalContext: text("proposal_context"),             // ready-to-paste language for proposals
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertCedsAlignmentSchema = createInsertSchema(cedsAlignments).omit({ id: true, createdAt: true });
export type InsertCedsAlignment = z.infer<typeof insertCedsAlignmentSchema>;
export type CedsAlignment = typeof cedsAlignments.$inferSelect;

// ── Partner API Key Hub ─────────────────────────────────────────────────────
// Permanent connection point for external partners (Black Praxis Labs, etc.)
export const partnerApiKeys = pgTable("partner_api_keys", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  partnerName: varchar("partner_name", { length: 200 }).notNull(),
  partnerEmail: varchar("partner_email", { length: 200 }),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  scopes: text("scopes").array().notNull().default(sql`ARRAY['content:read']::text[]`),
  active: boolean("active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type PartnerApiKey = typeof partnerApiKeys.$inferSelect;

export const partnerApiAuditLog = pgTable("partner_api_audit_log", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  keyId: varchar("key_id", { length: 100 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  partnerName: varchar("partner_name", { length: 200 }).notNull(),
  endpoint: varchar("endpoint", { length: 200 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code"),
  ip: varchar("ip", { length: 60 }),
  userAgent: varchar("user_agent", { length: 300 }),
  calledAt: timestamp("called_at").defaultNow(),
});

// Inbound data pushed BY partners TO ThriveUp (the other direction)
export const partnerInboundData = pgTable("partner_inbound_data", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  keyId: varchar("key_id", { length: 100 }).notNull(),
  partnerName: varchar("partner_name", { length: 200 }).notNull(),
  dataType: varchar("data_type", { length: 100 }).notNull(), // "content", "event", "insight", "heartbeat", etc.
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  receivedAt: timestamp("received_at").defaultNow(),
});
export type PartnerInboundData = typeof partnerInboundData.$inferSelect;

// ==================== STREETS PROGRAM — ADULT BH + HOMELESSNESS + RECOVERY ====================

export const sudAssessments = pgTable("sud_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientId: varchar("client_id", { length: 100 }),
  assessorName: varchar("assessor_name", { length: 200 }),
  assessmentType: varchar("assessment_type", { length: 20 }).notNull(), // audit_c | dast_10 | cage
  responses: jsonb("responses").notNull(),
  totalScore: integer("total_score").notNull(),
  riskLevel: varchar("risk_level", { length: 30 }).notNull(), // low | moderate | high | severe
  clinicalNotes: text("clinical_notes"),
  referralRecommended: boolean("referral_recommended").default(false),
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type SudAssessment = typeof sudAssessments.$inferSelect;

export const recoveryPlans = pgTable("recovery_plans", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientId: varchar("client_id", { length: 100 }),
  currentPhase: varchar("current_phase", { length: 40 }).notNull(), // pre_contemplation | contemplation | preparation | action | maintenance
  recoveryCapitalScore: integer("recovery_capital_score").default(0),
  primarySubstance: varchar("primary_substance", { length: 100 }),
  sobrietyDate: timestamp("sobriety_date"),
  primaryClinician: varchar("primary_clinician", { length: 200 }),
  peerCoachId: varchar("peer_coach_id", { length: 100 }),
  goals: jsonb("goals").default(sql`'[]'::jsonb`),
  strengths: text("strengths"),
  barriers: text("barriers"),
  lastReviewedAt: timestamp("last_reviewed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type RecoveryPlan = typeof recoveryPlans.$inferSelect;

export const recoveryMilestones = pgTable("recovery_milestones", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id", { length: 100 }).notNull(),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  domain: varchar("domain", { length: 50 }).notNull(), // housing | employment | family | health | legal | social | spiritual
  milestone: text("milestone").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | in_progress | achieved
  achievedAt: timestamp("achieved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type RecoveryMilestone = typeof recoveryMilestones.$inferSelect;

export const housingFirstIntakes = pgTable("housing_first_intakes", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientId: varchar("client_id", { length: 100 }),
  intakeDate: timestamp("intake_date").defaultNow(),
  currentHousingStatus: varchar("current_housing_status", { length: 60 }).notNull(), // unsheltered | emergency_shelter | transitional | doubled_up | at_risk
  chronicallyHomeless: boolean("chronically_homeless").default(false),
  veteranStatus: boolean("veteran_status").default(false),
  disabilityStatus: boolean("disability_status").default(false),
  vulnerabilityScore: integer("vulnerability_score").default(0),
  barriers: jsonb("barriers").default(sql`'[]'::jsonb`),
  priorityTier: varchar("priority_tier", { length: 10 }).default("3"), // 1=highest
  referredTo: varchar("referred_to", { length: 300 }),
  referralDate: timestamp("referral_date"),
  housingSecuredAt: timestamp("housing_secured_at"),
  caseworker: varchar("caseworker", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type HousingFirstIntake = typeof housingFirstIntakes.$inferSelect;

export const warmHandoffs = pgTable("warm_handoffs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientId: varchar("client_id", { length: 100 }),
  fromProviderName: varchar("from_provider_name", { length: 200 }).notNull(),
  fromProviderType: varchar("from_provider_type", { length: 80 }).notNull(), // street_outreach | shelter | behavioral_health | primary_care | peer_support | legal | housing
  toProviderName: varchar("to_provider_name", { length: 200 }).notNull(),
  toProviderType: varchar("to_provider_type", { length: 80 }).notNull(),
  handoffReason: text("handoff_reason").notNull(),
  handoffDate: timestamp("handoff_date").defaultNow(),
  contactMade: boolean("contact_made").default(false),
  contactDate: timestamp("contact_date"),
  followUpDate: timestamp("follow_up_date"),
  outcome: varchar("outcome", { length: 80 }), // connected | no_contact | refused | enrolled
  coordinatedBy: varchar("coordinated_by", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type WarmHandoff = typeof warmHandoffs.$inferSelect;

export const peerRecoveryCoaches = pgTable("peer_recovery_coaches", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 30 }),
  yearsInRecovery: integer("years_in_recovery"),
  primarySubstance: varchar("primary_substance", { length: 100 }),
  certifications: jsonb("certifications").default(sql`'[]'::jsonb`), // CPRS, CARC, etc.
  specializations: text("specializations").array().default(sql`'{}'::text[]`),
  languages: text("languages").array().default(sql`'{}'::text[]`),
  activeClients: integer("active_clients").default(0),
  maxClients: integer("max_clients").default(10),
  stipendStatus: varchar("stipend_status", { length: 30 }).default("pending"), // pending | active | completed
  stipendAmount: real("stipend_amount"),
  credentialingPathway: varchar("credentialing_pathway", { length: 200 }),
  iti: boolean("iti").default(true),
  active: boolean("active").default(true),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type PeerRecoveryCoach = typeof peerRecoveryCoaches.$inferSelect;

export const crisisRoutingLog = pgTable("crisis_routing_log", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }),
  clientId: varchar("client_id", { length: 100 }),
  routingDate: timestamp("routing_date").defaultNow(),
  crisisType: varchar("crisis_type", { length: 80 }).notNull(), // suicidal_ideation | overdose | psychiatric | domestic_violence | housing_loss | other
  acuityLevel: varchar("acuity_level", { length: 20 }).notNull(), // low | moderate | high | imminent
  disposition: varchar("disposition", { length: 40 }).notNull(), // line_988 | line_911 | csu | ed | mobile_crisis | peer | shelter | de_escalated
  respondedBy: varchar("responded_by", { length: 200 }),
  followUpRequired: boolean("follow_up_required").default(true),
  followUpCompleted: boolean("follow_up_completed").default(false),
  followUpDate: timestamp("follow_up_date"),
  outcome: text("outcome"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type CrisisRoutingEntry = typeof crisisRoutingLog.$inferSelect;

export const harmReductionServices = pgTable("harm_reduction_services", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }),
  anonymous: boolean("anonymous").default(false),
  serviceDate: timestamp("service_date").defaultNow(),
  serviceType: varchar("service_type", { length: 80 }).notNull(), // naloxone | syringes | test_strips | overdose_reversal | wound_care | education | linkage
  quantityProvided: integer("quantity_provided"),
  overdoseReversal: boolean("overdose_reversal").default(false),
  substanceInvolved: varchar("substance_involved", { length: 100 }),
  linkedToTreatment: boolean("linked_to_treatment").default(false),
  providedBy: varchar("provided_by", { length: 200 }),
  location: varchar("location", { length: 300 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type HarmReductionService = typeof harmReductionServices.$inferSelect;

export const matCoordination = pgTable("mat_coordination", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientId: varchar("client_id", { length: 100 }),
  medication: varchar("medication", { length: 80 }).notNull(), // buprenorphine | methadone | naltrexone | vivitrol | suboxone
  clinicName: varchar("clinic_name", { length: 300 }),
  clinicPhone: varchar("clinic_phone", { length: 30 }),
  clinicAddress: varchar("clinic_address", { length: 400 }),
  prescribingProvider: varchar("prescribing_provider", { length: 200 }),
  referralDate: timestamp("referral_date").defaultNow(),
  enrollmentDate: timestamp("enrollment_date"),
  status: varchar("status", { length: 40 }).notNull().default("referred"), // referred | enrolled | active | on_hold | discharged
  lastContactDate: timestamp("last_contact_date"),
  nextAppointment: timestamp("next_appointment"),
  barriers: text("barriers"),
  coordinatedBy: varchar("coordinated_by", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type MatCoordination = typeof matCoordination.$inferSelect;

export const continuumOfCareEvents = pgTable("continuum_of_care_events", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientId: varchar("client_id", { length: 100 }),
  providerName: varchar("provider_name", { length: 300 }).notNull(),
  providerType: varchar("provider_type", { length: 80 }).notNull(), // outreach | shelter | treatment | housing | employment | legal | peer | primary_care
  eventType: varchar("event_type", { length: 80 }).notNull(), // enrollment | service | handoff | exit | follow_up | crisis
  eventDate: timestamp("event_date").defaultNow(),
  outcome: varchar("outcome", { length: 200 }),
  nextStep: text("next_step"),
  documentedBy: varchar("documented_by", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type ContinuumOfCareEvent = typeof continuumOfCareEvents.$inferSelect;

// ─── Participant Document Vault ──────────────────────────────────────────────
export const participantDocuments = pgTable("participant_documents", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 200 }).notNull(),
  category: varchar("category", { length: 60 }).notNull().default("other"),
  label: varchar("label", { length: 200 }).notNull(),
  fileName: varchar("file_name", { length: 300 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  storageKey: varchar("storage_key", { length: 500 }),
  notes: text("notes"),
  expiresAt: timestamp("expires_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});
export const insertParticipantDocumentSchema = createInsertSchema(participantDocuments).omit({ id: true, uploadedAt: true });
export type ParticipantDocument = typeof participantDocuments.$inferSelect;
export type InsertParticipantDocument = typeof insertParticipantDocumentSchema._type;

// ─── Participant Appointments ────────────────────────────────────────────────
export const participantAppointments = pgTable("participant_appointments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 200 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  orgName: varchar("org_name", { length: 300 }),
  appointmentDate: varchar("appointment_date", { length: 20 }).notNull(),
  appointmentTime: varchar("appointment_time", { length: 20 }),
  location: text("location"),
  notes: text("notes"),
  documentsNeeded: text("documents_needed").array(),
  status: varchar("status", { length: 30 }).notNull().default("upcoming"),
  reminderDismissed: boolean("reminder_dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertParticipantAppointmentSchema = createInsertSchema(participantAppointments).omit({ id: true, createdAt: true });
export type ParticipantAppointment = typeof participantAppointments.$inferSelect;
export type InsertParticipantAppointment = typeof insertParticipantAppointmentSchema._type;

// ─── Resident Household (participant-facing, not partner-facing) ──────────────
export const residentHouseholds = pgTable("resident_households", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 200 }).notNull().unique(),
  householdName: varchar("household_name", { length: 200 }).notNull().default("My Household"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertResidentHouseholdSchema = createInsertSchema(residentHouseholds).omit({ id: true, createdAt: true, updatedAt: true });
export type ResidentHousehold = typeof residentHouseholds.$inferSelect;

export const residentHouseholdMembers = pgTable("resident_household_members", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 100 }).notNull().references(() => residentHouseholds.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  relationship: varchar("relationship", { length: 80 }).notNull().default("Other"),
  dateOfBirth: varchar("date_of_birth", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertResidentHouseholdMemberSchema = createInsertSchema(residentHouseholdMembers).omit({ id: true, createdAt: true });
export type ResidentHouseholdMember = typeof residentHouseholdMembers.$inferSelect;

// ── GAP 5: Learner profile (reading-level adaptation) ──────────────────────────
export const learnerProfiles = pgTable("learner_profiles", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  readingLevel: varchar("reading_level", { length: 30 }).notNull().default("adult"), // elementary | middle | high | adult
  preferredLanguage: varchar("preferred_language", { length: 20 }).notNull().default("en"),
  captionsEnabled: boolean("captions_enabled").notNull().default(false),
  highContrastEnabled: boolean("high_contrast_enabled").notNull().default(false),
  screenReaderMode: boolean("screen_reader_mode").notNull().default(false),
  youthMode: boolean("youth_mode").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertLearnerProfileSchema = createInsertSchema(learnerProfiles).omit({ id: true, createdAt: true });
export type InsertLearnerProfile = z.infer<typeof insertLearnerProfileSchema>;
export type LearnerProfile = typeof learnerProfiles.$inferSelect;

// ── GAP 7: Nonprofit effectiveness scorecard ───────────────────────────────────
// Partner orgs submit program outcomes against shared WIOA/CFIR rubric.
export const partnerOutcomeSubmissions = pgTable("partner_outcome_submissions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id", { length: 64 }),
  orgName: text("org_name").notNull(),
  programName: text("program_name").notNull(),
  programType: varchar("program_type", { length: 80 }).notNull(), // workforce | reentry | childcare | health | youth | housing
  reportingPeriod: varchar("reporting_period", { length: 30 }).notNull(), // e.g. "2024-Q4"
  participantsServed: integer("participants_served").notNull().default(0),
  participantsCompleted: integer("participants_completed").notNull().default(0),
  enteredEmployment: integer("entered_employment").notNull().default(0),
  retainedEmployment6mo: integer("retained_employment_6mo").notNull().default(0),
  credentialsAttained: integer("credentials_attained").notNull().default(0),
  medianEarnings: integer("median_earnings_cents"),
  measurableSkillsGains: integer("measurable_skills_gains").notNull().default(0),
  cfirFidelityScore: integer("cfir_fidelity_score"), // 0–100, self-reported
  countyFips: varchar("county_fips", { length: 10 }),
  submittedBy: varchar("submitted_by", { length: 255 }),
  notes: text("notes"),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | reviewed | approved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPartnerOutcomeSchema = createInsertSchema(partnerOutcomeSubmissions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartnerOutcome = z.infer<typeof insertPartnerOutcomeSchema>;
export type PartnerOutcomeSubmission = typeof partnerOutcomeSubmissions.$inferSelect;

// Computed effectiveness scores per program / per period (populated by scoring engine).
export const partnerEffectivenessScores = pgTable("partner_effectiveness_scores", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id", { length: 100 }).notNull().references(() => partnerOutcomeSubmissions.id, { onDelete: "cascade" }),
  orgName: text("org_name").notNull(),
  programName: text("program_name").notNull(),
  reportingPeriod: varchar("reporting_period", { length: 30 }).notNull(),
  // WIOA primary indicators (0–100 scaled)
  employmentRateScore: integer("employment_rate_score").notNull().default(0),
  retentionRateScore: integer("retention_rate_score").notNull().default(0),
  earningsScore: integer("earnings_score").notNull().default(0),
  credentialRateScore: integer("credential_rate_score").notNull().default(0),
  skillsGainsScore: integer("skills_gains_score").notNull().default(0),
  completionRateScore: integer("completion_rate_score").notNull().default(0),
  // CFIR fidelity (0–100)
  cfirFidelityScore: integer("cfir_fidelity_score").notNull().default(0),
  // Composite
  overallScore: integer("overall_score").notNull().default(0), // 0–100
  tier: varchar("tier", { length: 20 }).notNull().default("bronze"), // gold | silver | bronze | provisional
  scoredAt: timestamp("scored_at").defaultNow(),
});
export const insertPartnerEffectivenessScoreSchema = createInsertSchema(partnerEffectivenessScores).omit({ id: true, scoredAt: true });
export type InsertPartnerEffectivenessScore = z.infer<typeof insertPartnerEffectivenessScoreSchema>;
export type PartnerEffectivenessScore = typeof partnerEffectivenessScores.$inferSelect;

// ─── Knowledge Graph ──────────────────────────────────────────────────────────
// Persistent entity + relationship store. Nodes represent platforms, grants,
// partners, service areas, populations, outcomes, and concepts. Edges capture
// typed relationships (serves, funds, produces, is_aligned_with, etc.).
// Seeded automatically from ECOSYSTEM_PLATFORMS on startup; extended at runtime
// via API and by ecosystem partners (x-ecosystem-key).

export const kgNodes = pgTable("kg_nodes", {
  id: text("id").primaryKey(),                         // e.g. "platform:civic-signal"
  type: text("type").notNull(),                        // platform | grant_program | partner | service_area | population | outcome | concept | domain
  label: text("label").notNull(),
  description: text("description"),
  url: text("url"),
  properties: jsonb("properties").$type<Record<string, any>>().default({}),
  source: text("source").notNull().default("manual"), // ecosystem_seeder | manual | api | directive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kgEdges = pgTable("kg_edges", {
  id: serial("id").primaryKey(),
  fromNodeId: text("from_node_id").notNull().references(() => kgNodes.id, { onDelete: "cascade" }),
  toNodeId: text("to_node_id").notNull().references(() => kgNodes.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(), // serves | funds | produces | requires | connects_to | is_aligned_with | operates_in | delivers_to | sends_to | receives_from
  weight: real("weight").default(1.0),                 // 0–1 edge confidence / strength
  properties: jsonb("properties").$type<Record<string, any>>().default({}),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertKgNodeSchema = createInsertSchema(kgNodes).omit({ createdAt: true, updatedAt: true });
export type InsertKgNode = z.infer<typeof insertKgNodeSchema>;
export type KgNode = typeof kgNodes.$inferSelect;

export const insertKgEdgeSchema = createInsertSchema(kgEdges).omit({ id: true, createdAt: true });
export type InsertKgEdge = z.infer<typeof insertKgEdgeSchema>;
export type KgEdge = typeof kgEdges.$inferSelect;

// ── Consortium / Multi-Org Grant Proposals ────────────────────────────────────
// Supports complex federal grants where one org is prime applicant/fiscal agent
// and others contribute specific sections or program elements.
export const consortiumProposals = pgTable("consortium_proposals", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  grantId: varchar("grant_id", { length: 100 }).references(() => grantOpportunities.id, { onDelete: "set null" }),
  grantTitle: varchar("grant_title", { length: 1000 }).notNull(),
  grantNofo: varchar("grant_nofo", { length: 200 }),
  grantDeadline: timestamp("grant_deadline"),
  awardAmount: varchar("award_amount", { length: 100 }),
  projectTitle: varchar("project_title", { length: 1000 }).notNull(),
  geography: varchar("geography", { length: 500 }),
  status: varchar("status", { length: 50 }).notNull().default("drafting"),
  // prime entity — can be an org in the system or an external org by name/UEI
  primeOrgId: varchar("prime_org_id", { length: 100 }),
  primeOrgName: varchar("prime_org_name", { length: 500 }).notNull(),
  primeUei: varchar("prime_uei", { length: 32 }),
  primeEin: varchar("prime_ein", { length: 32 }),
  indirectCostApproach: varchar("indirect_cost_approach", { length: 100 }).default("de_minimis_10"),
  mergedNarrative: text("merged_narrative"),
  gppPushedAt: timestamp("gpp_pushed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ConsortiumProposal = typeof consortiumProposals.$inferSelect;

export const consortiumTeamMembers = pgTable("consortium_team_members", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  consortiumId: varchar("consortium_id", { length: 100 }).notNull().references(() => consortiumProposals.id, { onDelete: "cascade" }),
  orgName: varchar("org_name", { length: 500 }).notNull(),
  contactName: varchar("contact_name", { length: 300 }),
  contactEmail: varchar("contact_email", { length: 300 }),
  role: varchar("role", { length: 100 }).notNull(),
  // Sections this member is responsible for writing
  assignedSections: text("assigned_sections").array().notNull().default(sql`'{}'::text[]`),
  // Generated section content keyed by section name
  sectionContent: jsonb("section_content").notNull().default(sql`'{}'::jsonb`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ConsortiumTeamMember = typeof consortiumTeamMembers.$inferSelect;

// ── YHSI (Youth Homelessness System Improvement) — HUD CPD-2600-DC-0035 ──────
// Youth data layer + voice portal + referral pathway + biannual reporting.
// PII lives only in yhsiYouthParticipants; aggregate surfaces must apply the
// small-cell suppression floor of 5 (see platform-engineering doctrine).

export const yhsiYouthParticipants = pgTable("yhsi_youth_participants", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  // HMIS compatibility fields (HMIS CSV 2026 Client + Enrollment subset)
  hmisPersonalId: varchar("hmis_personal_id", { length: 64 }),        // HMIS PersonalID if known
  firstName: varchar("first_name", { length: 200 }),
  preferredName: varchar("preferred_name", { length: 200 }),
  lastNameInitial: varchar("last_name_initial", { length: 8 }),
  dobQuality: varchar("dob_quality", { length: 30 }).default("full"), // full | approximate | refused | unknown (HMIS DOBDataQuality)
  birthYear: integer("birth_year"),
  ageAtContact: integer("age_at_contact"),
  pronouns: varchar("pronouns", { length: 60 }),
  stateCode: varchar("state_code", { length: 2 }).default("KS"),
  // McKinney-Vento + homelessness status
  mckinneyVentoStatus: varchar("mckinney_vento_status", { length: 40 }), // identified | suspected | not_identified | unknown
  livingSituation: varchar("living_situation", { length: 60 }),          // HMIS 3.917 categories: doubled_up | shelter | unsheltered | transitional | hotel_motel | housed_at_risk | other
  chronicPattern: boolean("chronic_pattern").default(false),
  fosterCareHistory: boolean("foster_care_history").default(false),
  justiceInvolvement: boolean("justice_involvement").default(false),
  isParenting: boolean("is_parenting").default(false),
  // Education / employment at first contact
  educationStatus: varchar("education_status", { length: 60 }),          // enrolled | disengaged | graduated | ged_track | unknown
  employmentStatus: varchar("employment_status", { length: 60 }),        // employed_ft | employed_pt | seeking | not_seeking | unknown
  schoolDistrict: varchar("school_district", { length: 120 }),           // e.g. USD 259
  referralSource: varchar("referral_source", { length: 120 }),           // usd259_mckinney_vento | turning_point | self | outreach | partner
  consentOnFile: boolean("consent_on_file").notNull().default(false),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiYouthParticipantSchema = createInsertSchema(yhsiYouthParticipants).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertYhsiYouthParticipant = z.infer<typeof insertYhsiYouthParticipantSchema>;
export type YhsiYouthParticipant = typeof yhsiYouthParticipants.$inferSelect;

// Outcome snapshots — status at contact and at 6-month follow-up (HUD YHSI measures)
export const yhsiOutcomeSnapshots = pgTable("yhsi_outcome_snapshots", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull().references(() => yhsiYouthParticipants.id, { onDelete: "cascade" }),
  snapshotType: varchar("snapshot_type", { length: 30 }).notNull(),      // at_contact | day_30 | day_90 | day_180 | day_365 | month_6 | month_12 | exit | custom
  housingStatus: varchar("housing_status", { length: 60 }).notNull(),    // stable_permanent | stable_temporary | doubled_up | shelter | unsheltered | unknown
  educationStatus: varchar("education_status", { length: 60 }),
  employmentStatus: varchar("employment_status", { length: 60 }),
  mckinneyVentoStatus: varchar("mckinney_vento_status", { length: 40 }),
  // Funder-language outcome fields (Casey, Dave Thomas, HUD renewals)
  hsCompletion: varchar("hs_completion", { length: 40 }),                // completed | on_track | ged_track | disengaged | na | unknown
  postSecondaryStatus: varchar("post_secondary_status", { length: 40 }), // enrolled | apprenticeship | applied | not_enrolled | na | unknown
  hourlyWage: real("hourly_wage"),                                       // null = not employed / not reported
  livableWage: boolean("livable_wage"),                                  // wage ≥ local livable-wage threshold at time of recording
  mentorConnections: integer("mentor_connections"),                      // count of stable adult supports (funder benchmark: ≥2)
  mhScaleUsed: varchar("mh_scale_used", { length: 60 }),                 // validated scale name, e.g. PHQ-9, GAD-7, CANS
  mhScaleScore: integer("mh_scale_score"),
  notes: text("notes"),
  recordedBy: varchar("recorded_by", { length: 255 }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});
export const insertYhsiOutcomeSnapshotSchema = createInsertSchema(yhsiOutcomeSnapshots).omit({ id: true, recordedAt: true });
export type InsertYhsiOutcomeSnapshot = z.infer<typeof insertYhsiOutcomeSnapshotSchema>;
export type YhsiOutcomeSnapshot = typeof yhsiOutcomeSnapshots.$inferSelect;

// Referral pathway — USD 259 → Turning Point → services pipeline
export const yhsiReferrals = pgTable("yhsi_referrals", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).references(() => yhsiYouthParticipants.id, { onDelete: "set null" }),
  sourceOrg: varchar("source_org", { length: 200 }).notNull(),           // e.g. USD 259 McKinney-Vento
  destinationOrg: varchar("destination_org", { length: 200 }).notNull(), // e.g. Turning Point
  serviceType: varchar("service_type", { length: 120 }).notNull(),       // housing_navigation | case_management | education_reengagement | employment | behavioral_health | basic_needs | legal | other
  urgency: varchar("urgency", { length: 20 }).notNull().default("routine"), // crisis | urgent | routine
  status: varchar("status", { length: 40 }).notNull().default("initiated"), // initiated | contacted | enrolled | in_service | completed | closed_unresolved | declined
  initiatedAt: timestamp("initiated_at").defaultNow().notNull(),
  firstContactAt: timestamp("first_contact_at"),
  resolvedAt: timestamp("resolved_at"),
  outcome: varchar("outcome", { length: 400 }),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiReferralSchema = createInsertSchema(yhsiReferrals).omit({ id: true, createdAt: true, updatedAt: true, initiatedAt: true });
export type InsertYhsiReferral = z.infer<typeof insertYhsiReferralSchema>;
export type YhsiReferral = typeof yhsiReferrals.$inferSelect;

export const yhsiReferralTouchpoints = pgTable("yhsi_referral_touchpoints", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  referralId: varchar("referral_id", { length: 100 }).notNull().references(() => yhsiReferrals.id, { onDelete: "cascade" }),
  touchpointType: varchar("touchpoint_type", { length: 60 }).notNull(),  // outreach_call | meeting | warm_handoff | service_start | status_check | closure
  summary: text("summary"),
  recordedBy: varchar("recorded_by", { length: 255 }),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});
export const insertYhsiReferralTouchpointSchema = createInsertSchema(yhsiReferralTouchpoints).omit({ id: true, occurredAt: true });
export type InsertYhsiReferralTouchpoint = z.infer<typeof insertYhsiReferralTouchpointSchema>;
export type YhsiReferralTouchpoint = typeof yhsiReferralTouchpoints.$inferSelect;

// Youth Voice Portal — youth with lived experience contribute input; each entry
// carries a server-generated capability token so the contributor can revisit
// their entry and see how it shaped programs (HUD Youth Leadership factor).
export const yhsiVoiceEntries = pgTable("yhsi_voice_entries", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  accessToken: varchar("access_token", { length: 64 }),                  // capability token, returned once at creation
  contributorAlias: varchar("contributor_alias", { length: 120 }),       // youth-chosen name; never require legal name
  ageRange: varchar("age_range", { length: 20 }),                        // 14-17 | 18-20 | 21-24 | prefer_not
  livedExperience: boolean("lived_experience").notNull().default(true),
  inputType: varchar("input_type", { length: 60 }).notNull().default("program_design"), // program_design | application_feedback | service_gap | policy | safety | other
  body: text("body").notNull(),
  relatedProgram: varchar("related_program", { length: 200 }),
  status: varchar("status", { length: 40 }).notNull().default("new"),    // new | reviewed | incorporated | not_actionable
  impactNote: text("impact_note"),                                       // staff-written: how this input shaped the program/application
  incorporatedAt: timestamp("incorporated_at"),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiVoiceEntrySchema = createInsertSchema(yhsiVoiceEntries).omit({ id: true, accessToken: true, status: true, impactNote: true, incorporatedAt: true, reviewedBy: true, createdAt: true, updatedAt: true });
export type InsertYhsiVoiceEntry = z.infer<typeof insertYhsiVoiceEntrySchema>;
export type YhsiVoiceEntry = typeof yhsiVoiceEntries.$inferSelect;

// Chafee / ETV / federal entitlement navigation tracking — the "100% of our
// participants are offered navigation support, X% enrolled" proof line.
export const yhsiEntitlements = pgTable("yhsi_entitlements", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull().references(() => yhsiYouthParticipants.id, { onDelete: "cascade" }),
  entitlementType: varchar("entitlement_type", { length: 60 }).notNull(), // chafee | etv | medicaid_former_foster | fafsa_independent | snap | other
  status: varchar("status", { length: 40 }).notNull().default("offered"), // offered | declined | applied | enrolled | denied | ineligible
  offeredAt: timestamp("offered_at").defaultNow().notNull(),
  appliedAt: timestamp("applied_at"),
  enrolledAt: timestamp("enrolled_at"),
  annualValue: real("annual_value"),                                      // $ value flowing to youth once enrolled (e.g. ETV up to $5,000/yr)
  barriers: text("barriers"),                                             // what's blocking — documentation, state processing, etc.
  notes: text("notes"),
  recordedBy: varchar("recorded_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiEntitlementSchema = createInsertSchema(yhsiEntitlements).omit({ id: true, createdAt: true, updatedAt: true, offeredAt: true });
export type InsertYhsiEntitlement = z.infer<typeof insertYhsiEntitlementSchema>;
export type YhsiEntitlement = typeof yhsiEntitlements.$inferSelect;

// Trauma-informed practice fidelity observations — "we live the book, and
// here's the data." Observers can be staff, supervisors, or trained youth peers.
export const yhsiFidelityObservations = pgTable("yhsi_fidelity_observations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  observerRole: varchar("observer_role", { length: 40 }).notNull(),       // staff | supervisor | youth_peer | external
  programArea: varchar("program_area", { length: 120 }).notNull(),        // e.g. drop-in center, housing navigation, support group
  // Domain scores 1-5 (SAMHSA trauma-informed principles)
  scoreRespectAgency: integer("score_respect_agency").notNull(),          // youth spoken to with respect + agency
  scoreStrengthsBased: integer("score_strengths_based").notNull(),        // "what happened to you" not "what's wrong with you"
  scoreStaffRegulation: integer("score_staff_regulation").notNull(),      // staff managing own stress, no re-traumatization
  scoreGentleTransitions: integer("score_gentle_transitions").notNull(),  // transitions handled gently
  scoreYouthVoiceChoice: integer("score_youth_voice_choice").notNull(),   // youth offered options, not directives
  strengths: text("strengths"),
  growthAreas: text("growth_areas"),
  trainingRecommended: varchar("training_recommended", { length: 300 }),
  observedAt: timestamp("observed_at").defaultNow().notNull(),
  recordedBy: varchar("recorded_by", { length: 255 }),
});
export const insertYhsiFidelityObservationSchema = createInsertSchema(yhsiFidelityObservations).omit({ id: true, observedAt: true });
export type InsertYhsiFidelityObservation = z.infer<typeof insertYhsiFidelityObservationSchema>;
export type YhsiFidelityObservation = typeof yhsiFidelityObservations.$inferSelect;

// HUD compliance milestones — missed project-plan updates get grants rescinded.
export const yhsiMilestones = pgTable("yhsi_milestones", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 400 }).notNull(),
  milestoneType: varchar("milestone_type", { length: 60 }).notNull().default("hud_biannual_report"), // hud_biannual_report | project_plan_update | budget_report | drawdown | site_visit | renewal_application | other
  grantLabel: varchar("grant_label", { length: 200 }),                    // e.g. "HUD YHSI CPD-2600-DC-0035"
  dueAt: timestamp("due_at").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("upcoming"), // upcoming | submitted | waived
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiMilestoneSchema = createInsertSchema(yhsiMilestones).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertYhsiMilestone = z.infer<typeof insertYhsiMilestoneSchema>;
export type YhsiMilestone = typeof yhsiMilestones.$inferSelect;

// Biannual HUD progress reports (missing these gets funding rescinded)
export const yhsiReports = pgTable("yhsi_reports", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("draft"),  // draft | final
  metrics: jsonb("metrics").$type<Record<string, any>>().notNull().default({}), // computed aggregates snapshot
  narrative: text("narrative"),                                          // AI-drafted, human-edited narrative
  generatedBy: varchar("generated_by", { length: 255 }),
  finalizedAt: timestamp("finalized_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiReportSchema = createInsertSchema(yhsiReports).omit({ id: true, createdAt: true, updatedAt: true, finalizedAt: true });
export type InsertYhsiReport = z.infer<typeof insertYhsiReportSchema>;
export type YhsiReport = typeof yhsiReports.$inferSelect;

// ─── YHSI System Improvement Layer ──────────────────────────────────────────
// CES youth-specific assessments — standardized acuity + diversion pathway
export const yhsiCesAssessments = pgTable("yhsi_ces_assessments", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }).notNull().references(() => yhsiYouthParticipants.id),
  assessmentType: varchar("assessment_type", { length: 60 }).notNull().default("ty_vi_spdat"), // ty_vi_spdat | next_step_tool | local_youth_tool | other
  acuityScore: integer("acuity_score").notNull(),                        // raw tool score
  prioritizationTier: varchar("prioritization_tier", { length: 30 }).notNull(), // high | medium | low
  diversionAttempted: boolean("diversion_attempted").notNull().default(false),
  diversionOutcome: varchar("diversion_outcome", { length: 40 }),        // diverted_family | diverted_kin | diverted_other | not_diverted | pending
  assessedAt: timestamp("assessed_at").defaultNow().notNull(),
  notes: text("notes"),
  recordedBy: varchar("recorded_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertYhsiCesAssessmentSchema = createInsertSchema(yhsiCesAssessments).omit({ id: true, createdAt: true, assessedAt: true });
export type YhsiCesAssessment = typeof yhsiCesAssessments.$inferSelect;

// Partner org registry — K-12 / child welfare / juvenile justice / workforce / CoC
export const yhsiPartnerOrgs = pgTable("yhsi_partner_orgs", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 300 }).notNull(),
  systemType: varchar("system_type", { length: 60 }).notNull(),          // k12_mckinney_vento | child_welfare | juvenile_justice | workforce | coc_hmis | healthcare | housing_provider | other
  contactName: varchar("contact_name", { length: 200 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 40 }),
  mouStatus: varchar("mou_status", { length: 30 }).notNull().default("none"), // none | drafting | signed | expired
  mouSignedAt: timestamp("mou_signed_at"),
  mouExpiresAt: timestamp("mou_expires_at"),
  dataSharing: boolean("data_sharing").notNull().default(false),         // covered by a data-sharing agreement
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiPartnerOrgSchema = createInsertSchema(yhsiPartnerOrgs).omit({ id: true, createdAt: true, updatedAt: true });
export type YhsiPartnerOrg = typeof yhsiPartnerOrgs.$inferSelect;

// Youth Action Board — governance, membership, stipends, co-design decisions
export const yhsiYabMembers = pgTable("yhsi_yab_members", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  displayName: varchar("display_name", { length: 200 }).notNull(),       // chosen name/alias — never legal name required
  role: varchar("role", { length: 60 }).notNull().default("member"),     // member | co_chair | chair | alumni
  status: varchar("status", { length: 30 }).notNull().default("active"), // active | inactive | alumni
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  stipendRate: numeric("stipend_rate", { precision: 8, scale: 2 }),      // per-meeting stipend
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiYabMemberSchema = createInsertSchema(yhsiYabMembers).omit({ id: true, createdAt: true, updatedAt: true, joinedAt: true });
export type YhsiYabMember = typeof yhsiYabMembers.$inferSelect;

export const yhsiYabDecisions = pgTable("yhsi_yab_decisions", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  meetingDate: timestamp("meeting_date").notNull(),
  topic: varchar("topic", { length: 400 }).notNull(),
  decision: text("decision").notNull(),
  voteSummary: varchar("vote_summary", { length: 200 }),                 // e.g. "7 for / 1 against / 2 abstain"
  status: varchar("status", { length: 30 }).notNull().default("proposed"), // proposed | adopted | implemented | declined
  coDesignSignoff: boolean("co_design_signoff").notNull().default(false), // youth signed off on final implementation
  implementedAt: timestamp("implemented_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiYabDecisionSchema = createInsertSchema(yhsiYabDecisions).omit({ id: true, createdAt: true, updatedAt: true, implementedAt: true });
export type YhsiYabDecision = typeof yhsiYabDecisions.$inferSelect;

export const yhsiYabStipends = pgTable("yhsi_yab_stipends", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id", { length: 100 }).notNull().references(() => yhsiYabMembers.id),
  amount: numeric("amount", { precision: 8, scale: 2 }).notNull(),
  purpose: varchar("purpose", { length: 200 }).notNull().default("meeting"), // meeting | workgroup | interview_panel | conference | other
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  recordedBy: varchar("recorded_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertYhsiYabStipendSchema = createInsertSchema(yhsiYabStipends).omit({ id: true, createdAt: true, paidAt: true });
export type YhsiYabStipend = typeof yhsiYabStipends.$inferSelect;

// Sage compliance — eligible-activity spending categories with federal caps
export const yhsiSpendingCategories = pgTable("yhsi_spending_categories", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  grantLabel: varchar("grant_label", { length: 200 }).notNull().default("HUD YHSI CPD-2600-DC-0035"),
  category: varchar("category", { length: 200 }).notNull(),              // e.g. "Admin (capped)", "Systems improvement", "Youth engagement"
  capPercent: numeric("cap_percent", { precision: 5, scale: 2 }),        // null = no federal cap
  budgetedAmount: numeric("budgeted_amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertYhsiSpendingCategorySchema = createInsertSchema(yhsiSpendingCategories).omit({ id: true, createdAt: true, updatedAt: true });
export type YhsiSpendingCategory = typeof yhsiSpendingCategories.$inferSelect;

export const yhsiSpendingEntries = pgTable("yhsi_spending_entries", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id", { length: 100 }).notNull().references(() => yhsiSpendingCategories.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 400 }).notNull(),
  spentAt: timestamp("spent_at").defaultNow().notNull(),
  recordedBy: varchar("recorded_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertYhsiSpendingEntrySchema = createInsertSchema(yhsiSpendingEntries).omit({ id: true, createdAt: true });
export type YhsiSpendingEntry = typeof yhsiSpendingEntries.$inferSelect;

// HUD PIT counts by CoC — populated ONLY from imported official HUD data
// (huduser.gov "PIT Counts by CoC" file). Never seeded with invented numbers.
export const hudPitCounts = pgTable("hud_pit_counts", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  cocNumber: varchar("coc_number", { length: 20 }).notNull(),            // e.g. KS-502
  cocName: varchar("coc_name", { length: 300 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  year: integer("year").notNull(),
  overallHomeless: integer("overall_homeless"),
  unaccompaniedYouthUnder25: integer("unaccompanied_youth_under_25"),
  unshelteredHomeless: integer("unsheltered_homeless"),
  source: varchar("source", { length: 300 }).notNull(),                  // filename/URL of the official HUD file imported
  importedAt: timestamp("imported_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("hud_pit_coc_year_idx").on(t.cocNumber, t.year)]);
export type HudPitCount = typeof hudPitCounts.$inferSelect;

export * from "./household-schema";
export * from "./justice-schema";
export * from "./clinical-schema";
