/**
 * Contract and authenticated lifecycle guard for Community Opportunity Mirror.
 * It protects the high-risk boundaries that a UI-only or anonymous test cannot:
 * organization isolation, literal authorization, truthful delivery state, and
 * authenticated append-only partner feedback.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const routes = readFileSync("server/grantpathpro-routes.ts", "utf8");
const schema = readFileSync("shared/schema.ts", "utf8");
const config = readFileSync("server/grantpathpro-config.ts", "utf8");
const profile = readFileSync("client/src/pages/entity-profile.tsx", "utf8");
const contract = readFileSync("docs/grantpathpro-opportunity-handoff-contract.md", "utf8");
const migration = readFileSync("migrations/20260824_gpp_opportunity_handoff.sql", "utf8");
const hardeningMigration = readFileSync("migrations/20260827_gpp_opportunity_mirror_hardening.sql", "utf8");
const runtimeMigration = readFileSync("scripts/migrate-gpp-opportunity-handoff.ts", "utf8");
const migrationRunner = readFileSync("server/run-migrations.ts", "utf8");
const endpointGuard = readFileSync("scripts/verify-gpp-endpoint.ts", "utf8");

let failures = 0;
function expect(condition: boolean, message: string) {
  if (condition) console.log(`✓ ${message}`);
  else {
    console.error(`✗ ${message}`);
    failures += 1;
  }
}

expect(schema.includes('pgTable("gpp_opportunity_handoffs"'), "authorized handoffs persist separately from Mirror snapshots");
expect(schema.includes('pgTable("gpp_pursuit_feedback"'), "partner feedback persists separately from raw partner data");
expect(routes.includes('authorizationConfirmed: z.literal(true)'), "handoff requires literal explicit authorization");
expect(routes.includes('loadOwnedOrganization(req, res, req.params.orgId)'), "organization lifecycle routes use tenant ownership checks");
expect(routes.includes("opportunity-handoffs/:handoffId/reconcile"), "unknown delivery has an authenticated reconciliation route");
expect(routes.includes("Idempotency-Key"), "partner delivery carries a stable idempotency key");
expect(routes.includes('"/api/inbound/grantpathpro/opportunity-feedback", requireGppOpportunityFeedbackKey'), "feedback receiver requires partner authentication");
expect(routes.includes('"/api/inbound/grantpathpro/intelligence", requireGppInboundKey'), "intelligence receiver requires partner authentication");
expect(routes.includes("buildCommunityAIContext"), "intelligence receiver composes geography-aware community context");
expect(routes.includes("perplexityResearch"), "intelligence receiver uses the shared live Perplexity research path");
expect(routes.includes("sanitizeExternalResearchText") && routes.includes("[BEGIN CALLER QUESTION") && routes.includes("[BEGIN CALLER METADATA"), "caller text and metadata are privacy-filtered and isolated before external research");
expect(routes.includes("buildCommunityAIContextWithStatus") && routes.includes("communityReport.sources.census"), "community sources report availability independently");
expect(routes.includes("Civic Signal verified partner lessons"), "intelligence response preserves Civic Signal evidence disclosure");
expect(routes.includes("read_only_pursuit_intelligence"), "intelligence response is explicitly read-only");
expect(routes.includes("does not authorize delivery"), "intelligence boundary does not authorize consequential partner actions");
expect(routes.includes("THRIVEUP_CALLBACK_API_KEY"), "feedback callback supports a dedicated server-side key");
expect(routes.includes("hasBlockingRejection(rejections)"), "invalid required feedback fields fail closed");
expect(routes.includes('handoff.orgId !== clean.orgId'), "feedback cannot be stored against another organization");
expect(routes.includes("crossOrganizationLearning: \"disabled_pending_separate_consent_and_aggregation_policy\""), "cross-organization learning remains disabled");
expect(config.includes("GPP_OPPORTUNITY_HANDOFF_URL"), "delivery uses an explicit receiver configuration");
expect(!config.includes("GPP_API_URL?.trim() || `${"), "delivery receiver is not derived from the generic partner API origin");
expect(config.includes('const apiKey = process.env.GPP_OPPORTUNITY_HANDOFF_API_KEY?.trim() || null;'), "outbound handoff requires a dedicated credential");
expect(routes.includes("payload?.accepted !== true"), "a receiver must explicitly acknowledge acceptance before delivery is recorded");
expect(routes.includes('ne(gppOpportunityHandoffs.deliveryState, "delivered")'), "a confirmed delivery cannot be overwritten by a slower retry");
expect(routes.includes('handoff.deliveryState !== "delivered"'), "feedback is blocked before verified delivery");
expect(routes.includes("eventId: { type: \"string\" as const, required: true"), "feedback requires a stable partner event identity");
expect(routes.includes("partnerContactAuthorization: false"), "handoff package explicitly forbids treating intake as outreach authorization");
expect(profile.includes('data-testid="opportunity-handoff-authorize"'), "UI exposes deliberate authorization control");
expect(profile.includes('data-testid="opportunity-handoff-submit"'), "UI exposes handoff action");
expect(contract.includes("Embed and Mirror payloads are separate compatibility"), "contract preserves Embed and Mirror compatibility");
expect(contract.includes("Cross-organization learning remains disabled"), "contract documents the private-by-default learning boundary");
expect(contract.includes('"accepted": true'), "contract requires a receiver acceptance acknowledgement");
expect(contract.includes("outbound-only credential"), "contract prohibits replaying the inbound callback key for delivery");
expect(migration.includes("gpp_opportunity_handoffs") && migration.includes("gpp_pursuit_feedback"), "production migration creates lifecycle tables");
expect(hardeningMigration.includes("gpp_opportunity_handoff_attempts") && hardeningMigration.includes("request_hash"), "hardening migration preserves request hashes and delivery attempts");
expect(runtimeMigration.includes("information_schema.columns") && runtimeMigration.includes("gpp_opportunity_handoff_attempts"), "runtime migration is rerun-safe and creates delivery attempts");
expect(
  !/gpp_(opportunity_handoffs_delivery_state|opportunity_handoff_attempts_outcome|pursuit_feedback_(amount_disclosure|status|amount_nonnegative|source_https))_check[\s\S]{0,500}NOT VALID/.test(hardeningMigration),
  "hardening migration never creates GPP checks as NOT VALID, which publish cannot inline safely",
);
expect(
  !/gpp_(opportunity_handoffs_delivery_state|opportunity_handoff_attempts_outcome|pursuit_feedback_(amount_disclosure|status|amount_nonnegative|source_https))_check[\s\S]{0,500}NOT VALID/.test(runtimeMigration),
  "runtime migration never creates GPP checks as NOT VALID, which publish cannot inline safely",
);
expect(/pg_(?:try_)?advisory_lock/.test(migrationRunner), "startup migration runner serializes concurrent application");
expect(routes.includes("storedRequestFingerprint") && routes.includes("racedHash"), "request reuse is content-bound for legacy and concurrent rows");
expect(!routes.includes("snapshot: latest?.snapshot"), "Mirror reads do not expose raw partner JSON");
expect(profile.includes('data-testid="opportunity-handoff-source-type"'), "UI supports each documented source type");
expect(profile.includes("Reconcile same handoff"), "UI exposes safe same-handoff recovery");
expect(readFileSync("scripts/verify-gpp-opportunity-stub.ts", "utf8").includes("local-stub-token"), "safe local receiver test never targets the live partner");
expect(endpointGuard.includes("no live partner request"), "endpoint guard never creates a live partner-side probe");

const BASE = process.env.BASE_URL || "http://localhost:5000";
const RUN = randomUUID().slice(0, 8);
const owner = { userId: `e2e-gpp-owner-${RUN}`, email: `e2e-gpp-owner-${RUN}@test.local` };
const member = { userId: `e2e-gpp-member-${RUN}`, email: `e2e-gpp-member-${RUN}@test.local` };
const stranger = { userId: `e2e-gpp-stranger-${RUN}`, email: `e2e-gpp-stranger-${RUN}@test.local` };
const orgId = `e2e-gpp-org-${RUN}`;

async function request(path: string, cookie: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: { cookie, ...headers, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function verifyLiveLifecycle() {
  const { Client } = await import("pg");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } = await import("../tests/e2e/helpers/auth");
  const db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  let handoffId: string | null = null;
  await db.connect();
  try {
    await ensureTestUser(db, owner);
    await ensureTestUser(db, member);
    await ensureTestUser(db, stranger);
    const ownerCookie = await forgeSession(db, owner);
    const memberCookie = await forgeSession(db, member);
    const strangerCookie = await forgeSession(db, stranger);
    await db.query(
      `INSERT INTO organizations (id, user_id, name, mission_text, focus_areas, populations_served, counties, naics_codes, psc_codes)
       VALUES ($1, $2, $3, $4, ARRAY['community health'], ARRAY['residents'], ARRAY['Travis County'], ARRAY['624190'], '{}')`,
      [orgId, owner.userId, `E2E Opportunity Mirror ${RUN}`, "Connect residents with evidence-backed services."],
    );
    await db.query(`INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, 'member')`, [orgId, member.userId]);

    const packageResponse = await request(`/api/organizations/${orgId}/opportunity-package`, ownerCookie);
    const packageBody = await packageResponse.json() as { package?: { opportunityLanes?: unknown[]; privacy?: { organizationPrivateByDefault?: boolean } } };
    expect(packageResponse.status === 200 && packageBody.package?.opportunityLanes?.length === 6, "owner can read a six-lane opportunity package");
    expect(packageBody.package?.privacy?.organizationPrivateByDefault === true, "package marks organization data private by default");
    const mirrorResponse = await request(`/api/organizations/${orgId}/grantpathpro-mirror`, ownerCookie);
    const mirrorBody = await mirrorResponse.json() as { snapshot?: unknown; projection?: unknown };
    expect(mirrorResponse.status === 200 && mirrorBody.snapshot === undefined && mirrorBody.projection !== undefined, "Mirror read returns a bounded projection without raw partner JSON");
    const memberPackage = await request(`/api/organizations/${orgId}/opportunity-package`, memberCookie);
    expect(memberPackage.status === 200, "organization member can read the private package");
    const strangerPackage = await request(`/api/organizations/${orgId}/opportunity-package`, strangerCookie);
    expect(strangerPackage.status === 403, "unrelated user cannot read the organization package");

    const missingAuthorization = await request(`/api/organizations/${orgId}/opportunity-handoffs`, ownerCookie, "POST", {
      contractVersion: "v1",
      requestId: randomUUID(),
      authorizationConfirmed: false,
      selectedOpportunity: { title: "E2E target", lane: "grants", sourceType: "unverified_exploration", sourceLabel: "E2E source" },
    });
    expect(missingAuthorization.status === 400, "handoff rejects a non-literal authorization confirmation");

    const authorizationRequestId = randomUUID();
    const opportunityCheckedAt = new Date().toISOString();
    const created = await request(`/api/organizations/${orgId}/opportunity-handoffs`, ownerCookie, "POST", {
      contractVersion: "v1",
      requestId: authorizationRequestId,
      authorizationConfirmed: true,
      selectedOpportunity: { title: "E2E target", lane: "grants", sourceType: "primary_source", sourceLabel: "E2E primary source", sourceUrl: "https://example.org/opportunity", sourceCheckedAt: opportunityCheckedAt },
    });
    const createdBody = await created.json() as { handoffId?: string; deliveryState?: string; package?: { handoff?: { authorization?: string } } };
    handoffId = createdBody.handoffId ?? null;
    expect(created.status === 201 && !!handoffId, "explicitly authorized handoff is durably created");
    expect(["unavailable", "delivered", "rejected", "delivery_unknown"].includes(createdBody.deliveryState ?? ""), "handoff reports only a truthful terminal delivery state");
    expect(createdBody.package?.handoff?.authorization === "explicit_organization_confirmation", "persisted package records the authorization basis");
    const duplicateHandoff = await request(`/api/organizations/${orgId}/opportunity-handoffs`, ownerCookie, "POST", {
      contractVersion: "v1",
      requestId: authorizationRequestId,
      authorizationConfirmed: true,
      selectedOpportunity: { title: "E2E target", lane: "grants", sourceType: "primary_source", sourceLabel: "E2E primary source", sourceUrl: "https://example.org/opportunity", sourceCheckedAt: opportunityCheckedAt },
    });
    const duplicateHandoffBody = await duplicateHandoff.json() as { duplicate?: boolean; handoffId?: string };
    expect(duplicateHandoff.status === 200 && duplicateHandoffBody.duplicate === true && duplicateHandoffBody.handoffId === handoffId, "replayed browser request returns its original handoff without a second delivery");
    const conflictingHandoff = await request(`/api/organizations/${orgId}/opportunity-handoffs`, ownerCookie, "POST", {
      contractVersion: "v1",
      requestId: authorizationRequestId,
      authorizationConfirmed: true,
      selectedOpportunity: { title: "Different target", lane: "partnership", sourceType: "unverified_exploration", sourceLabel: "Different source" },
    });
    expect(conflictingHandoff.status === 409, "reused authorization request id with different content is rejected");

    const history = await request(`/api/organizations/${orgId}/opportunity-handoffs`, memberCookie);
    const historyBody = await history.json() as { handoffs?: Array<{ id: string; feedback: unknown[] }> };
    expect(history.status === 200 && historyBody.handoffs?.some((entry) => entry.id === handoffId), "member can read the organization's private handoff history");
    const strangerHistory = await request(`/api/organizations/${orgId}/opportunity-handoffs`, strangerCookie);
    expect(strangerHistory.status === 403, "unrelated user cannot read private handoff history");

    const inboundKey = requireEnv("THRIVEUP_INGEST_KEY");
    const prematureFeedback = await request("/api/inbound/grantpathpro/opportunity-feedback", "", "POST", {
      contractVersion: "v1",
      handoffId,
      orgId,
      eventId: `premature-${RUN}`,
      status: "submitted",
      sourceTimestamp: new Date().toISOString(),
      sourceLabel: "E2E GrantPathPro",
    }, { "x-api-key": inboundKey });
    if (createdBody.deliveryState === "delivered") {
      expect(prematureFeedback.status === 201, "feedback is accepted after an already verified delivery");
    } else {
      expect(prematureFeedback.status === 409, "feedback is blocked before a verified delivery acknowledgement");
    }
    const invalidFeedback = await request("/api/inbound/grantpathpro/opportunity-feedback", "", "POST", {
      contractVersion: "v1",
      handoffId,
      orgId,
      eventId: `invalid-${RUN}`,
      status: "submitted",
      sourceLabel: "E2E GrantPathPro",
    }, { "x-api-key": inboundKey });
    expect(invalidFeedback.status === 400, "feedback without a source timestamp fails closed");

    const wrongTenantFeedback = await request("/api/inbound/grantpathpro/opportunity-feedback", "", "POST", {
      contractVersion: "v1",
      handoffId,
      orgId: `${orgId}-other`,
      eventId: `wrong-tenant-${RUN}`,
      status: "submitted",
      sourceTimestamp: new Date().toISOString(),
      sourceLabel: "E2E GrantPathPro",
    }, { "x-api-key": inboundKey });
    expect(wrongTenantFeedback.status === 404, "feedback cannot cross an organization boundary");

    const externalPursuitId = `e2e-pursuit-${RUN}`;
    await db.query(
      `UPDATE gpp_opportunity_handoffs
       SET delivery_state = 'delivered', delivered_at = NOW(), external_pursuit_id = $1,
           delivery_detail = 'E2E-controlled verified acceptance fixture'
       WHERE id = $2`,
      [externalPursuitId, handoffId],
    );
    const wrongPursuitFeedback = await request("/api/inbound/grantpathpro/opportunity-feedback", "", "POST", {
      contractVersion: "v1",
      handoffId,
      orgId,
      eventId: `wrong-pursuit-${RUN}`,
      status: "submitted",
      sourceTimestamp: new Date().toISOString(),
      sourceLabel: "E2E GrantPathPro",
      externalPursuitId: `${externalPursuitId}-mismatch`,
    }, { "x-api-key": inboundKey });
    expect(wrongPursuitFeedback.status === 409, "feedback cannot attach to a different external pursuit");

    const feedbackTimestamp = new Date().toISOString();
    const feedbackPayload = {
      contractVersion: "v1",
      handoffId,
      orgId,
      eventId: `feedback-${RUN}`,
      status: "submitted",
      sourceTimestamp: feedbackTimestamp,
      sourceLabel: "E2E GrantPathPro",
      lesson: "Confirm requirements before submission.",
      externalPursuitId,
    };
    const acceptedFeedback = await request("/api/inbound/grantpathpro/opportunity-feedback", "", "POST", feedbackPayload, { "x-api-key": inboundKey });
    const acceptedBody = await acceptedFeedback.json() as { received?: boolean; privacy?: string };
    expect(acceptedFeedback.status === 201 && acceptedBody.received === true, "authenticated, valid partner feedback is appended");
    expect(acceptedBody.privacy === "organization_private_by_default", "feedback response preserves the private-by-default boundary");
    const duplicateFeedback = await request("/api/inbound/grantpathpro/opportunity-feedback", "", "POST", feedbackPayload, { "x-api-key": inboundKey });
    const duplicateFeedbackBody = await duplicateFeedback.json() as { duplicate?: boolean };
    expect(duplicateFeedback.status === 200 && duplicateFeedbackBody.duplicate === true, "identical partner feedback retry is idempotent");
    const conflictingFeedback = await request("/api/inbound/grantpathpro/opportunity-feedback", "", "POST", {
      ...feedbackPayload,
      status: "declined",
    }, { "x-api-key": inboundKey });
    expect(conflictingFeedback.status === 409, "reused partner event id with different content is rejected");

    const historyWithFeedback = await request(`/api/organizations/${orgId}/opportunity-handoffs`, ownerCookie);
    const historyWithFeedbackBody = await historyWithFeedback.json() as { handoffs?: Array<{ id: string; feedback: Array<{ lesson?: string }> }> };
    expect(historyWithFeedbackBody.handoffs?.find((entry) => entry.id === handoffId)?.feedback.some((feedback) => feedback.lesson === "Confirm requirements before submission.") === true, "organization history returns only its appended feedback");
  } finally {
    if (handoffId) await db.query(`DELETE FROM gpp_pursuit_feedback WHERE handoff_id = $1`, [handoffId]).catch(() => {});
    if (handoffId) await db.query(`DELETE FROM gpp_opportunity_handoff_attempts WHERE handoff_id = $1`, [handoffId]).catch(() => {});
    if (handoffId) await db.query(`DELETE FROM gpp_opportunity_handoffs WHERE id = $1`, [handoffId]).catch(() => {});
    await db.query(`DELETE FROM organization_members WHERE org_id = $1`, [orgId]).catch(() => {});
    await db.query(`DELETE FROM organizations WHERE id = $1`, [orgId]).catch(() => {});
    await cleanupTestUser(db, owner.userId);
    await cleanupTestUser(db, member.userId);
    await cleanupTestUser(db, stranger.userId);
    await db.end().catch(() => {});
  }
}

async function main() {
  if (failures) {
    console.error(`\n${failures} Community Opportunity Mirror static contract check(s) failed.`);
    process.exit(1);
  }
  await verifyLiveLifecycle();
  if (failures) {
    console.error(`\n${failures} Community Opportunity Mirror lifecycle check(s) failed.`);
    process.exit(1);
  }
  console.log("\nCommunity Opportunity Mirror contract and lifecycle guard passed.");
}

main().catch((error) => {
  console.error("Community Opportunity Mirror lifecycle guard crashed:", error);
  process.exit(1);
});