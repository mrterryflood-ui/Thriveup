// fork-contracting-app/shared/schema-contracting.ts
//
// CONTRACTING-ONLY SCHEMA EXTRACT — generated 2026-05-27 from ThriveUp
// shared/schema.ts. Drop into your new Repl's shared/schema.ts.
//
// NOTE: You will also need from your Replit Auth integration:
//   - users (Replit Auth table — comes from the javascript_log_in_with_replit blueprint)
//   - sessions (Replit Auth table)
//   - userOrgMemberships (multi-org membership join table)
// Those are NOT included here; the auth blueprint generates them in your new app.
//
// Required imports at the top of your schema.ts:
//   import { sql } from "drizzle-orm";
//   import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod";


// ============================================================
// organizations  (from shared/schema.ts L5428)
// ============================================================
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

// ============================================================
// rfpDocuments  (from shared/schema.ts L5552)
// ============================================================
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

// ============================================================
// rfpRubrics  (from shared/schema.ts L5573)
// ============================================================
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

// ============================================================
// agencyIntelligence  (from shared/schema.ts L5585)
// ============================================================
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

// ============================================================
// wonProposals  (from shared/schema.ts L5602)
// ============================================================
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

// ============================================================
// foundationIntelligence  (from shared/schema.ts L5628)
// ============================================================
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

// ============================================================
// activeBids  (from shared/schema.ts L5645)
// ============================================================
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

// ============================================================
// complianceMatrixItems  (from shared/schema.ts L5679)
// ============================================================
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

// ============================================================
// rfpIngestionJobs  (from shared/schema.ts L5717)
// ============================================================
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

// ============================================================
// gapClosureItems  (from shared/schema.ts L5741)
// ============================================================
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

// ============================================================
// evidenceBindings  (from shared/schema.ts L5771)
// ============================================================
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

// ============================================================
// grantOpportunities  (from shared/schema.ts L1618)
// ============================================================
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
