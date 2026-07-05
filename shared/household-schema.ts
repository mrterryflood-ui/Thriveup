import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const householdRoleEnum = pgEnum("household_role", [
  "primary",
  "adult_member",
  "youth_member",
  "dependent",
]);

export const consentDomainEnum = pgEnum("consent_domain", [
  "employment",
  "education",
  "housing",
  "food",
  "transportation",
  "childcare",
  "legal",
  "healthcare",
  "safety",
  "financial",
]);

export const consentLevelEnum = pgEnum("consent_level", [
  "private",
  "household",
  "facilitator",
  "program",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "deceased",
  "incarcerated",
  "relocated",
]);

export const households = pgTable("households", {
  id: varchar("id", { length: 100 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  householdCode: varchar("household_code", { length: 20 }).unique(),
  zipCode: varchar("zip_code", { length: 10 }),
  countyFips: varchar("county_fips", { length: 10 }),
  censustract: varchar("census_tract", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  notes: text("notes"),
  assignedFacilitatorId: varchar("assigned_facilitator_id", { length: 255 }),
  programCohort: varchar("program_cohort", { length: 100 }),
});

export const householdMembers = pgTable("household_members", {
  id: varchar("id", { length: 100 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 100 })
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }),
  memberName: text("member_name").notNull(),
  role: householdRoleEnum("role").notNull().default("adult_member"),
  status: memberStatusEnum("status").notNull().default("active"),
  dateOfBirth: varchar("date_of_birth", { length: 20 }),
  joinedHouseholdAt: timestamp("joined_household_at").defaultNow(),
  leftHouseholdAt: timestamp("left_household_at"),
  leftReason: text("left_reason"),
  isMinor: boolean("is_minor").default(false),
  hasVehicle: boolean("has_vehicle").default(false),
  isEmployed: boolean("is_employed").default(false),
  employmentWage: integer("employment_wage"),
  notes: text("notes"),
});

export const householdMemberConsent = pgTable("household_member_consent", {
  id: varchar("id", { length: 100 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 100 })
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  memberId: varchar("member_id", { length: 100 })
    .notNull()
    .references(() => householdMembers.id, { onDelete: "cascade" }),
  domain: consentDomainEnum("domain").notNull(),
  consentLevel: consentLevelEnum("consent_level").notNull().default("private"),
  consentedAt: timestamp("consented_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  consentedBy: varchar("consented_by", { length: 255 }),
});

export const householdSdohSnapshots = pgTable("household_sdoh_snapshots", {
  id: varchar("id", { length: 100 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 100 })
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  memberId: varchar("member_id", { length: 100 })
    .notNull()
    .references(() => householdMembers.id, { onDelete: "cascade" }),
  screeningDate: timestamp("screening_date").defaultNow(),
  housingScore: integer("housing_score").default(0),
  foodScore: integer("food_score").default(0),
  transportationScore: integer("transportation_score").default(0),
  childcareScore: integer("childcare_score").default(0),
  legalScore: integer("legal_score").default(0),
  healthcareScore: integer("healthcare_score").default(0),
  safetyScore: integer("safety_score").default(0),
  compositeBurdenScore: integer("composite_burden_score_x10").default(0),
  burdenCategory: varchar("burden_category", { length: 20 }),
  rawResponses: jsonb("raw_responses"),
  routedPartners: jsonb("routed_partners"),
  screenedBy: varchar("screened_by", { length: 255 }),
});

export const householdOutcomes = pgTable("household_outcomes", {
  id: varchar("id", { length: 100 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 100 })
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  measuredAt: timestamp("measured_at").defaultNow(),
  employedMemberCount: integer("employed_member_count").default(0),
  totalHouseholdWageCents: integer("total_household_wage_cents").default(0),
  activeLearnersCount: integer("active_learners_count").default(0),
  credentialsEarnedCount: integer("credentials_earned_count").default(0),
  housingStable: boolean("housing_stable"),
  foodSecure: boolean("food_secure"),
  householdBurdenScore: integer("household_burden_score_x10").default(0),
  pellEligibleFlag: boolean("pell_eligible_flag").default(false),
  wioa_enrolled: boolean("wioa_enrolled").default(false),
  reentryHousehold: boolean("reentry_household").default(false),
  notes: text("notes"),
  source: varchar("source", { length: 100 }).default("system"),
});

export const insertHouseholdSchema = createInsertSchema(households).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHouseholdMemberSchema = createInsertSchema(householdMembers).omit({ id: true, joinedHouseholdAt: true });
export const insertHouseholdSdohSnapshotSchema = createInsertSchema(householdSdohSnapshots).omit({ id: true, screeningDate: true });
export const insertHouseholdOutcomeSchema = createInsertSchema(householdOutcomes).omit({ id: true, measuredAt: true });

export type Household = typeof households.$inferSelect;
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type HouseholdMemberConsent = typeof householdMemberConsent.$inferSelect;
export type HouseholdSdohSnapshot = typeof householdSdohSnapshots.$inferSelect;
export type HouseholdOutcome = typeof householdOutcomes.$inferSelect;
