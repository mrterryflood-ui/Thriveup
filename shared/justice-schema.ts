import {
  pgTable, varchar, text, integer, boolean,
  timestamp, jsonb, pgEnum, real,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const foiaStatusEnum = pgEnum("foia_status", [
  "draft", "submitted", "acknowledged", "processing",
  "response_received", "appealed", "closed", "denied",
]);

export const foiaAgencyEnum = pgEnum("foia_agency", [
  "travis_county_clerk",
  "williamson_county_clerk",
  "hays_county_clerk",
  "bastrop_county_clerk",
  "texas_hhsc",
  "texas_doc",
  "bjs_federal",
  "other",
]);

export const justiceDataTypeEnum = pgEnum("justice_data_type", [
  "recidivism_rate",
  "housing_court_filing",
  "eviction_filing",
  "court_disposition",
  "reentry_enrollment",
  "probation_population",
  "incarceration_rate",
  "pretrial_detention",
]);

export const justiceIndicators = pgTable("justice_indicators", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  dataType: justiceDataTypeEnum("data_type").notNull(),
  geography: varchar("geography", { length: 100 }).notNull(),
  countyFips: varchar("county_fips", { length: 10 }),
  stateFips: varchar("state_fips", { length: 5 }),
  censusTract: varchar("census_tract", { length: 20 }),
  reportingYear: integer("reporting_year").notNull(),
  reportingPeriod: varchar("reporting_period", { length: 50 }),
  value: real("value").notNull(),
  unit: varchar("unit", { length: 50 }),
  denominator: integer("denominator"),
  demographicGroup: varchar("demographic_group", { length: 100 }),
  dataSource: varchar("data_source", { length: 100 }).notNull(),
  foiaRequestId: varchar("foia_request_id", { length: 100 }),
  rawData: jsonb("raw_data"),
  ingestedAt: timestamp("ingested_at").defaultNow(),
  notes: text("notes"),
});

export const foiaRequests = pgTable("foia_requests", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  agency: foiaAgencyEnum("agency").notNull(),
  agencyName: text("agency_name").notNull(),
  agencyEmail: text("agency_email"),
  agencyAddress: text("agency_address"),
  requestedRecords: text("requested_records").notNull(),
  purposeStatement: text("purpose_statement"),
  generatedLetter: text("generated_letter"),
  status: foiaStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  responseDeadline: timestamp("response_deadline"),
  responseReceivedAt: timestamp("response_received_at"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  submittedBy: varchar("submitted_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
  appealDeadline: timestamp("appeal_deadline"),
  closedAt: timestamp("closed_at"),
  closedReason: text("closed_reason"),
});

export const foiaResponses = pgTable("foia_responses", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  foiaRequestId: varchar("foia_request_id", { length: 100 })
    .notNull()
    .references(() => foiaRequests.id),
  receivedAt: timestamp("received_at").defaultNow(),
  responseType: varchar("response_type", { length: 50 }),
  documentCount: integer("document_count"),
  parsedData: jsonb("parsed_data"),
  rawText: text("raw_text"),
  dataIngested: boolean("data_ingested").default(false),
  ingestedAt: timestamp("ingested_at"),
  notes: text("notes"),
});

export const employerRegistrations = pgTable("employer_registrations", {
  id: varchar("id", { length: 100 }).primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  industry: varchar("industry", { length: 100 }),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  website: text("website"),
  location: text("location"),
  banTheBox: boolean("ban_the_box").notNull().default(false),
  fairChanceHiring: boolean("fair_chance_hiring").notNull().default(false),
  barrierFriendly: boolean("barrier_friendly").notNull().default(false),
  hiringCommitments: text("hiring_commitments"),
  description: text("description"),
  credentialTags: text("credential_tags").array(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewNotes: text("review_notes"),
  approvedEmployerId: varchar("approved_employer_id", { length: 100 }),
});

export const insertFoiaRequestSchema = createInsertSchema(foiaRequests).omit({ id: true, createdAt: true });
export type FoiaRequest = typeof foiaRequests.$inferSelect;
export type FoiaResponse = typeof foiaResponses.$inferSelect;
export type JusticeIndicator = typeof justiceIndicators.$inferSelect;
export type EmployerRegistration = typeof employerRegistrations.$inferSelect;
