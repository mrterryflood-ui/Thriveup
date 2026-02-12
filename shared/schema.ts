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

export * from "./models/auth";
