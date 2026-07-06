import {
  pgTable, varchar, text, integer, boolean,
  timestamp, jsonb, pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const clinicalRiskLevelEnum = pgEnum("clinical_risk_level", [
  "low", "moderate", "high", "very_high",
]);

export const instrumentTypeEnum = pgEnum("instrument_type", [
  "rnr_criminogenic",
  "phq9",
  "pcl5",
  "combined",
]);

export const clinicalScreenings = pgTable("clinical_screenings", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 100 }),
  userId: varchar("user_id", { length: 255 }),
  householdId: varchar("household_id", { length: 100 }),
  instrumentType: instrumentTypeEnum("instrument_type").notNull(),
  administeredBy: varchar("administered_by", { length: 255 }),
  administeredAt: timestamp("administered_at").defaultNow(),

  rnrTotalScore: integer("rnr_total_score"),
  rnrRiskLevel: clinicalRiskLevelEnum("rnr_risk_level"),
  rnrDomainScores: jsonb("rnr_domain_scores"),
  rnrFlaggedDomains: text("rnr_flagged_domains").array(),
  rnrResponses: jsonb("rnr_responses"),

  phq9TotalScore: integer("phq9_total_score"),
  phq9Severity: varchar("phq9_severity", { length: 30 }),
  phq9SuicidalIdeation: boolean("phq9_suicidal_ideation").default(false),
  phq9Responses: jsonb("phq9_responses"),

  pcl5TotalScore: integer("pcl5_total_score"),
  pcl5PtsdIndicator: boolean("pcl5_ptsd_indicator").default(false),
  pcl5ClusterScores: jsonb("pcl5_cluster_scores"),
  pcl5Responses: jsonb("pcl5_responses"),

  referrals: jsonb("referrals"),
  requiresClinicalFollowup: boolean("requires_clinical_followup").default(false),
  requiresImmediateIntervention: boolean("requires_immediate_intervention").default(false),
  notes: text("notes"),
});

export const insertClinicalScreeningSchema = createInsertSchema(clinicalScreenings).omit({ id: true, administeredAt: true });
export type ClinicalScreening = typeof clinicalScreenings.$inferSelect;
