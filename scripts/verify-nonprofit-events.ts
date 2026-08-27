/**
 * Private nonprofit-event workspace regression gate.
 *
 * Exercises the live server with real forged sessions and a disposable pair of
 * organization memberships. It intentionally tests aggregate-only attendance,
 * tenant isolation, non-punitive blocked work, consent withdrawal, archived
 * record protection, small-cell suppression, and audit-content safety.
 */

const BASE = process.env.BASE_URL || "http://localhost:5000";
const OWNER = { userId: "e2e-nonprofit-events-owner", email: "e2e-nonprofit-events-owner@test.local", firstName: "Events", lastName: "Owner", role: "case_manager" };
const OTHER = { userId: "e2e-nonprofit-events-other", email: "e2e-nonprofit-events-other@test.local", firstName: "Events", lastName: "Other", role: "student" };
const MEMBER = { userId: "e2e-nonprofit-events-member", email: "e2e-nonprofit-events-member@test.local", firstName: "Events", lastName: "Member", role: "student" };
const COLLABORATOR = { userId: "e2e-nonprofit-events-collaborator", email: "e2e-nonprofit-events-collaborator@test.local", firstName: "Events", lastName: "Collaborator", role: "case_manager" };
const ORG_A = "e2e-nonprofit-events-org-a";
const ORG_B = "e2e-nonprofit-events-org-b";

function fail(message: string): never {
  throw new Error(message);
}
function ok(message: string) {
  console.log(`  ✓ ${message}`);
}
async function body(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
}
async function request(path: string, cookie: string, orgId: string, init: RequestInit = {}) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", cookie, "x-org-id": orgId, ...(init.headers ?? {}) },
  });
}

async function run() {
  const { Client } = await import("pg");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } = await import("../tests/e2e/helpers/auth");
  const db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  let eventId: string | undefined;

  await db.connect();
  try {
    await db.query(`DELETE FROM nonprofit_events WHERE org_id = ANY($1::varchar[])`, [[ORG_A, ORG_B]]);
    await db.query(`DELETE FROM organization_members WHERE org_id = ANY($1::varchar[])`, [[ORG_A, ORG_B]]);
    await db.query(`DELETE FROM organizations WHERE id = ANY($1::varchar[])`, [[ORG_A, ORG_B]]);
    await cleanupTestUser(db, OWNER.userId).catch(() => {});
    await cleanupTestUser(db, OTHER.userId).catch(() => {});
    await cleanupTestUser(db, MEMBER.userId).catch(() => {});
    await cleanupTestUser(db, COLLABORATOR.userId).catch(() => {});

    await ensureTestUser(db, OWNER);
    await ensureTestUser(db, OTHER);
    await ensureTestUser(db, MEMBER);
    await ensureTestUser(db, COLLABORATOR);
    await db.query(
      `INSERT INTO organizations (id, user_id, name, focus_areas, populations_served, counties)
       VALUES ($1, $2, $3, '{}', '{}', '{}'), ($4, $5, $6, '{}', '{}', '{}')`,
      [ORG_A, OWNER.userId, "E2E Community Skating Org", ORG_B, OTHER.userId, "E2E Separate Organization"],
    );
    await db.query(
      `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, 'owner'), ($3, $4, 'owner'), ($1, $5, 'member'), ($1, $6, 'collaborator')`,
      [ORG_A, OWNER.userId, ORG_B, OTHER.userId, MEMBER.userId, COLLABORATOR.userId],
    );
    const ownerCookie = await forgeSession(db, OWNER);
    const otherCookie = await forgeSession(db, OTHER);
    const memberCookie = await forgeSession(db, MEMBER);
    const collaboratorCookie = await forgeSession(db, COLLABORATOR);

    const create = await request("/api/nonprofit-events/events", ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        title: "E2E Community Skate Night",
        purpose: "Plan a low-data community skating event with accountable follow-through.",
        eventDate: "2030-03-15",
        format: "in_person",
        locationName: "Community rink",
        serviceArea: "Wichita, KS",
        communityNeedFocus: ["safe recreation"],
      }),
    });
    if (create.status !== 201) fail(`event create returned ${create.status}: ${JSON.stringify(await body(create))}`);
    eventId = (await body(create)).event?.id;
    if (!eventId) fail("event create response omitted event.id");
    const ownerAccess = await request("/api/nonprofit-events/access", ownerCookie, ORG_A);
    if (ownerAccess.status !== 200 || (await body(ownerAccess)).authorized !== true) fail("owner access-status did not report authorized access");
    ok("created a private, organization-scoped event");

    const crossOrg = await request(`/api/nonprofit-events/events/${eventId}/audit`, otherCookie, ORG_B);
    if (crossOrg.status !== 403) fail(`non-staff cross-org audit access returned ${crossOrg.status}, expected 403`);
    ok("rejected cross-organization event access");
    const nonStaffWorkspace = await request("/api/nonprofit-events/workspace", memberCookie, ORG_A);
    if (nonStaffWorkspace.status !== 403) fail(`non-staff workspace access returned ${nonStaffWorkspace.status}, expected 403`);
    const nonStaffReport = await request("/api/nonprofit-events/report", memberCookie, ORG_A);
    if (nonStaffReport.status !== 403) fail(`non-staff report access returned ${nonStaffReport.status}, expected 403`);
    const collaboratorWorkspace = await request("/api/nonprofit-events/workspace", collaboratorCookie, ORG_A);
    if (collaboratorWorkspace.status !== 403) fail(`collaborator workspace access returned ${collaboratorWorkspace.status}, expected 403`);
    const collaboratorAccess = await request("/api/nonprofit-events/access", collaboratorCookie, ORG_A);
    if (collaboratorAccess.status !== 200 || (await body(collaboratorAccess)).authorized !== false) fail("ungranted collaborator access-status did not report denied access");
    const crossOrgReport = await request(`/api/nonprofit-events/report?orgId=${ORG_A}`, otherCookie, ORG_B);
    if (crossOrgReport.status !== 403) fail(`cross-org report access returned ${crossOrgReport.status}, expected 403`);
    ok("limited workspace and reports to active-organization staff");

    const nonOwnerGrant = await request(`/api/me/organization/event-workspace-access/${COLLABORATOR.userId}`, memberCookie, ORG_A, { method: "POST" });
    if (nonOwnerGrant.status !== 403) fail(`non-owner access grant returned ${nonOwnerGrant.status}, expected 403`);
    const crossOrgGrant = await request(`/api/me/organization/event-workspace-access/${COLLABORATOR.userId}`, otherCookie, ORG_A, { method: "POST" });
    if (crossOrgGrant.status !== 403) fail(`cross-org access grant returned ${crossOrgGrant.status}, expected 403`);
    const ineligibleGrant = await request(`/api/me/organization/event-workspace-access/${MEMBER.userId}`, ownerCookie, ORG_A, { method: "POST" });
    if (ineligibleGrant.status !== 422) fail(`ineligible access grant returned ${ineligibleGrant.status}, expected 422`);
    const missingMemberGrant = await request(`/api/me/organization/event-workspace-access/${OTHER.userId}`, ownerCookie, ORG_A, { method: "POST" });
    if (missingMemberGrant.status !== 404) fail(`non-member access grant returned ${missingMemberGrant.status}, expected 404`);
    const ownerRevoke = await request(`/api/me/organization/event-workspace-access/${OWNER.userId}`, ownerCookie, ORG_A, { method: "DELETE" });
    if (ownerRevoke.status !== 409) fail(`owner access revoke returned ${ownerRevoke.status}, expected 409`);
    const nonStaffOwnerWorkspace = await request("/api/nonprofit-events/workspace", otherCookie, ORG_B);
    if (nonStaffOwnerWorkspace.status !== 403) fail(`non-staff owner workspace access returned ${nonStaffOwnerWorkspace.status}, expected 403`);
    const grant = await request(`/api/me/organization/event-workspace-access/${COLLABORATOR.userId}`, ownerCookie, ORG_A, { method: "POST" });
    if (grant.status !== 201) fail(`event-workspace grant returned ${grant.status}: ${JSON.stringify(await body(grant))}`);
    const duplicateGrant = await request(`/api/me/organization/event-workspace-access/${COLLABORATOR.userId}`, ownerCookie, ORG_A, { method: "POST" });
    if (duplicateGrant.status !== 200) fail(`duplicate event-workspace grant returned ${duplicateGrant.status}, expected 200`);
    const authorizedCollaboratorWorkspace = await request("/api/nonprofit-events/workspace", collaboratorCookie, ORG_A);
    if (authorizedCollaboratorWorkspace.status !== 200) fail(`authorized collaborator workspace access returned ${authorizedCollaboratorWorkspace.status}, expected 200`);
    const authorizedCollaboratorAccess = await request("/api/nonprofit-events/access", collaboratorCookie, ORG_A);
    if (authorizedCollaboratorAccess.status !== 200 || (await body(authorizedCollaboratorAccess)).authorized !== true) fail("granted collaborator access-status did not report authorized access");
    const revoke = await request(`/api/me/organization/event-workspace-access/${COLLABORATOR.userId}`, ownerCookie, ORG_A, { method: "DELETE" });
    if (revoke.status !== 200) fail(`event-workspace revoke returned ${revoke.status}: ${JSON.stringify(await body(revoke))}`);
    const revokedCollaboratorWorkspace = await request("/api/nonprofit-events/workspace", collaboratorCookie, ORG_A);
    if (revokedCollaboratorWorkspace.status !== 403) fail(`revoked collaborator workspace access returned ${revokedCollaboratorWorkspace.status}, expected 403`);
    const revokedCollaboratorAccess = await request("/api/nonprofit-events/access", collaboratorCookie, ORG_A);
    if (revokedCollaboratorAccess.status !== 200 || (await body(revokedCollaboratorAccess)).authorized !== false) fail("revoked collaborator access-status did not report denied access");
    const [{ count: accessAuditCount }] = (await db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM nonprofit_event_workspace_access_audit WHERE org_id = $1 AND target_user_id = $2`,
      [ORG_A, COLLABORATOR.userId],
    )).rows;
    if (Number(accessAuditCount) !== 2) fail(`expected two event-workspace access audit records, found ${accessAuditCount}`);
    const regrant = await request(`/api/me/organization/event-workspace-access/${COLLABORATOR.userId}`, ownerCookie, ORG_A, { method: "POST" });
    if (regrant.status !== 201) fail(`event-workspace regrant returned ${regrant.status}, expected 201`);
    await db.query(`DELETE FROM organization_members WHERE org_id = $1 AND user_id = $2`, [ORG_A, COLLABORATOR.userId]);
    const [{ count: remainingAccessCount }] = (await db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM nonprofit_event_workspace_access WHERE org_id = $1 AND user_id = $2`,
      [ORG_A, COLLABORATOR.userId],
    )).rows;
    if (Number(remainingAccessCount) !== 0) fail("event-workspace access remained after the member left the organization");
    await db.query(`INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, 'collaborator')`, [ORG_A, COLLABORATOR.userId]);
    const rejoinedCollaboratorWorkspace = await request("/api/nonprofit-events/workspace", collaboratorCookie, ORG_A);
    if (rejoinedCollaboratorWorkspace.status !== 403) fail(`rejoined collaborator regained stale event access (${rejoinedCollaboratorWorkspace.status}), expected 403`);
    ok("made owner-managed event-workspace access grantable, revocable, and auditable");

    const incoherentAttendance = await request(`/api/nonprofit-events/events/${eventId}/attendance`, ownerCookie, ORG_A, {
      method: "PUT",
      body: JSON.stringify({ invitedCount: 3, registeredCount: 4, attendedCount: 2, followUpCount: 1, valueSource: "self_reported" }),
    });
    if (incoherentAttendance.status !== 400) fail(`incoherent attendance returned ${incoherentAttendance.status}, expected 400`);
    const invitedBelowAttended = await request(`/api/nonprofit-events/events/${eventId}/attendance`, ownerCookie, ORG_A, {
      method: "PUT",
      body: JSON.stringify({ invitedCount: 3, registeredCount: null, attendedCount: 4, followUpCount: 1, valueSource: "self_reported" }),
    });
    if (invitedBelowAttended.status !== 400) fail(`direct incoherent attendance returned ${invitedBelowAttended.status}, expected 400`);
    ok("rejected incoherent aggregate attendance");

    const attendance = await request(`/api/nonprofit-events/events/${eventId}/attendance`, ownerCookie, ORG_A, {
      method: "PUT",
      body: JSON.stringify({ invitedCount: 4, registeredCount: 3, attendedCount: 2, followUpCount: 1, valueSource: "self_reported" }),
    });
    if (attendance.status !== 200) fail(`attendance save returned ${attendance.status}: ${JSON.stringify(await body(attendance))}`);
    const freeTextAttendance = await request(`/api/nonprofit-events/events/${eventId}/attendance`, ownerCookie, ORG_A, {
      method: "PUT",
      body: JSON.stringify({ invitedCount: 4, registeredCount: 3, attendedCount: 2, followUpCount: 1, valueSource: "self_reported", sourceNote: "This must never be retained." }),
    });
    if (freeTextAttendance.status !== 400) fail(`free-text attendance provenance returned ${freeTextAttendance.status}, expected 400`);
    ok("saved aggregate attendance with no attendee identity");

    const impossibleDate = await request(`/api/nonprofit-events/events/${eventId}`, ownerCookie, ORG_A, {
      method: "PATCH", body: JSON.stringify({ eventDate: "2030-02-30" }),
    });
    if (impossibleDate.status !== 400) fail(`impossible date update returned ${impossibleDate.status}, expected 400`);
    const schedule = await request(`/api/nonprofit-events/events/${eventId}`, ownerCookie, ORG_A, {
      method: "PATCH", body: JSON.stringify({ status: "scheduled", startTime: "18:00", endTime: "20:00" }),
    });
    if (schedule.status !== 200) fail(`event scheduling returned ${schedule.status}: ${JSON.stringify(await body(schedule))}`);
    const reopenEvent = await request(`/api/nonprofit-events/events/${eventId}`, ownerCookie, ORG_A, {
      method: "PATCH", body: JSON.stringify({ status: "planned" }),
    });
    if (reopenEvent.status !== 400) fail(`event reopening returned ${reopenEvent.status}, expected 400`);
    ok("enforced real dates, valid schedules, and truthful event progression");

    const need = await request(`/api/nonprofit-events/events/${eventId}/needs`, ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        needArea: "safe recreation",
        sourceName: "Local organizer planning note",
        geography: "Wichita, KS",
        evidenceStatus: "self_reported",
        responseExplanation: "The event creates a supervised, low-cost recreation option while the organization gathers better local evidence.",
      }),
    });
    if (need.status !== 201) fail(`need link returned ${need.status}: ${JSON.stringify(await body(need))}`);
    ok("recorded need provenance and a plain-language response relationship");

    const action = await request(`/api/nonprofit-events/events/${eventId}/actions`, ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        title: "Confirm rink availability",
        ownerLabel: "Event coordinator",
        dueDate: "2030-03-01",
        status: "blocked",
        nextStep: "Await the rink manager's availability response.",
      }),
    });
    if (action.status !== 201) fail(`blocked action returned ${action.status}: ${JSON.stringify(await body(action))}`);
    const actionId = (await body(action)).action?.id;
    if (!actionId) fail("blocked action response omitted action.id");
    ok("preserved blocked work as visible work, not completion");

    const invalidStory = await request(`/api/nonprofit-events/events/${eventId}/stories`, ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        title: "Invalid disclosure attempt",
        storyText: "Private skater narrative that must never be made public without consent.",
        attributionPreference: "anonymous",
        intendedAudience: "funder",
        permittedUses: ["funder packet"],
        consentGranted: false,
        sharingState: "approved",
      }),
    });
    if (invalidStory.status !== 400) fail(`unconsented story approval returned ${invalidStory.status}, expected 400`);
    ok("rejected sharing approval without explicit consent");

    const approvedStory = await request(`/api/nonprofit-events/events/${eventId}/stories`, ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        title: "Skate night learning note",
        storyText: "A private organizer reflection documented a need for a predictable, supervised recreation option.",
        attributionPreference: "anonymous",
        intendedAudience: "funder",
        permittedUses: ["funder packet"],
        consentGranted: true,
        sharingState: "approved",
      }),
    });
    if (approvedStory.status !== 201) fail(`approved story returned ${approvedStory.status}: ${JSON.stringify(await body(approvedStory))}`);
    const storyId = (await body(approvedStory)).story?.id;
    if (!storyId) fail("approved story response omitted story.id");
    const reportWithApprovedStory = await request(`/api/nonprofit-events/report?orgId=${ORG_A}`, ownerCookie, ORG_A);
    if (reportWithApprovedStory.status !== 200) fail(`approved-story report returned ${reportWithApprovedStory.status}: ${JSON.stringify(await body(reportWithApprovedStory))}`);
    const reportWithApprovedStoryBody = await body(reportWithApprovedStory);
    const reportText = JSON.stringify(reportWithApprovedStoryBody);
    if ("approvedStories" in reportWithApprovedStoryBody || reportText.includes("Skate night learning note") || reportText.includes("private organizer reflection")) {
      fail("report exposed story content or story metadata");
    }
    ok("kept approved story content out of aggregate reports");
    const consentRepurpose = await request(`/api/nonprofit-events/stories/${storyId}`, ownerCookie, ORG_A, {
      method: "PATCH",
      body: JSON.stringify({ intendedAudience: "public", permittedUses: ["public webpage"], sharingState: "approved" }),
    });
    if (consentRepurpose.status !== 400) fail(`consent repurposing returned ${consentRepurpose.status}, expected 400`);
    const withdrawn = await request(`/api/nonprofit-events/stories/${storyId}`, ownerCookie, ORG_A, { method: "PATCH", body: JSON.stringify({ sharingState: "withdrawn" }) });
    if (withdrawn.status !== 200) fail(`story withdrawal returned ${withdrawn.status}: ${JSON.stringify(await body(withdrawn))}`);
    const withdrawnReapproval = await request(`/api/nonprofit-events/stories/${storyId}`, ownerCookie, ORG_A, {
      method: "PATCH",
      body: JSON.stringify({ consentGranted: true, intendedAudience: "funder", permittedUses: ["funder packet"], sharingState: "approved" }),
    });
    if (withdrawnReapproval.status !== 400) fail(`withdrawn-story reapproval returned ${withdrawnReapproval.status}, expected 400`);
    ok("withdrew story consent and removed sharing approval");

    const workspace = await request("/api/nonprofit-events/workspace", ownerCookie, ORG_A);
    if (workspace.status !== 200) fail(`workspace load returned ${workspace.status}: ${JSON.stringify(await body(workspace))}`);
    const workspaceBody = await body(workspace);
    const savedEvent = workspaceBody.events.find((row: { id: string }) => row.id === eventId);
    if (!savedEvent?.actions.some((row: { status: string }) => row.status === "blocked")) fail("workspace did not surface blocked action");
    ok("workspace surfaces blocked accountability work");

    const completedAction = await request(`/api/nonprofit-events/actions/${actionId}`, ownerCookie, ORG_A, {
      method: "PATCH", body: JSON.stringify({ status: "completed", completionEvidence: "Rink manager confirmed the booking by email; details retained outside this workspace." }),
    });
    if (completedAction.status !== 200) fail(`action completion returned ${completedAction.status}: ${JSON.stringify(await body(completedAction))}`);
    const reopenAction = await request(`/api/nonprofit-events/actions/${actionId}`, ownerCookie, ORG_A, {
      method: "PATCH", body: JSON.stringify({ status: "planned" }),
    });
    if (reopenAction.status !== 400) fail(`completed action reopening returned ${reopenAction.status}, expected 400`);
    ok("kept completed accountability actions from reverting");

    const report = await request(`/api/nonprofit-events/report?orgId=${ORG_A}`, ownerCookie, ORG_A);
    if (report.status !== 200) fail(`staff report returned ${report.status}: ${JSON.stringify(await body(report))}`);
    const reportBody = await body(report);
    const reportOrg = reportBody.organizations.find((row: { orgId: string }) => row.orgId === ORG_A);
    if (reportOrg?.summary?.attendance?.attendedCount?.value !== null || !String(reportOrg?.summary?.attendance?.attendedCount?.disclosure).includes("Suppressed")) {
      fail(`small attendance cell was not suppressed: ${JSON.stringify(reportOrg?.summary?.attendance?.attendedCount)}`);
    }
    if ("approvedStories" in reportBody || JSON.stringify(reportBody).includes("private organizer reflection")) fail("report exposed story content after withdrawal");
    ok("staff report suppresses small attendance counts and excludes all stories");

    const audit = await request(`/api/nonprofit-events/events/${eventId}/audit`, ownerCookie, ORG_A);
    if (audit.status !== 200) fail(`audit load returned ${audit.status}: ${JSON.stringify(await body(audit))}`);
    const auditRows = (await body(audit)).audit;
    if (!Array.isArray(auditRows) || auditRows.length < 6) fail("expected append-only audit history for consequential transitions");
    if (JSON.stringify(auditRows).includes("private organizer reflection")) fail("audit payload copied private story content");
    let appendOnlyBlocked = false;
    try {
      await db.query(`UPDATE nonprofit_event_audit_log SET action = 'tampered' WHERE event_id = $1`, [eventId]);
    } catch {
      appendOnlyBlocked = true;
    }
    if (!appendOnlyBlocked) fail("audit records could be modified directly in the database");
    ok("kept audit history append-only without private story text");

    const archived = await request(`/api/nonprofit-events/events/${eventId}/archive`, ownerCookie, ORG_A, { method: "POST" });
    if (archived.status !== 200) fail(`event archive returned ${archived.status}: ${JSON.stringify(await body(archived))}`);
    const afterArchiveWrite = await request(`/api/nonprofit-events/events/${eventId}/attendance`, ownerCookie, ORG_A, {
      method: "PUT",
      body: JSON.stringify({ invitedCount: 5, registeredCount: 5, attendedCount: 5, followUpCount: 5, valueSource: "self_reported" }),
    });
    if (afterArchiveWrite.status !== 409) fail(`archived attendance update returned ${afterArchiveWrite.status}, expected 409`);
    ok("made archived events read-only while retaining their records");

    console.log("\n✅ Nonprofit community-event workspace verification passed.");
  } finally {
    await db.query(`DELETE FROM nonprofit_events WHERE org_id = ANY($1::varchar[])`, [[ORG_A, ORG_B]]).catch(() => {});
    await db.query(`DELETE FROM organization_members WHERE org_id = ANY($1::varchar[])`, [[ORG_A, ORG_B]]).catch(() => {});
    await db.query(`DELETE FROM organizations WHERE id = ANY($1::varchar[])`, [[ORG_A, ORG_B]]).catch(() => {});
    await cleanupTestUser(db, OWNER.userId).catch(() => {});
    await cleanupTestUser(db, OTHER.userId).catch(() => {});
    await cleanupTestUser(db, MEMBER.userId).catch(() => {});
    await cleanupTestUser(db, COLLABORATOR.userId).catch(() => {});
    await db.end().catch(() => {});
  }
}

run().catch((error) => {
  console.error("\n❌ Nonprofit community-event verification failed:", error);
  process.exit(1);
});