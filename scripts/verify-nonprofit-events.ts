/**
 * Private nonprofit-event workspace regression gate.
 *
 * Exercises the live server with real forged sessions and a disposable pair of
 * organization memberships. It intentionally tests aggregate-only attendance,
 * tenant isolation, non-punitive blocked work, consent withdrawal, archived
 * record protection, small-cell suppression, and audit-content safety.
 */

import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5000";
const OWNER = { userId: "e2e-nonprofit-events-owner", email: "e2e-nonprofit-events-owner@test.local", firstName: "Events", lastName: "Owner", role: "case_manager" };
const OTHER = { userId: "e2e-nonprofit-events-other", email: "e2e-nonprofit-events-other@test.local", firstName: "Events", lastName: "Other", role: "case_manager" };
const MEMBER = { userId: "e2e-nonprofit-events-member", email: "e2e-nonprofit-events-member@test.local", firstName: "Events", lastName: "Member", role: "case_manager" };
const COLLABORATOR = { userId: "e2e-nonprofit-events-collaborator", email: "e2e-nonprofit-events-collaborator@test.local", firstName: "Events", lastName: "Collaborator", role: "case_manager" };

const ORG_ADMIN = { userId: "e2e-nonprofit-events-org-admin", email: "e2e-nonprofit-events-org-admin@test.local", firstName: "Events", lastName: "Org Admin", role: "case_manager" };
const ORG_A = "e2e-nonprofit-events-org-a";
const ORG_B = "e2e-nonprofit-events-org-b";

const ORG_LEGACY = "e2e-nonprofit-events-org-legacy";

function verifyMigrationSource() {
  const privacyMigration = readFileSync(
    new URL("../migrations/20260902_nonprofit_events_privacy_hardening.sql", import.meta.url),
    "utf8",
  );
  if (/chk_nonprofit_event_stories_nonidentifying_attribution[\s\S]{0,500}NOT VALID/i.test(privacyMigration)) {
    fail("nonprofit-event privacy migration must not create an inline NOT VALID check constraint");
  }
  const [integrityMigration, archivalLockMigration, archivalTruncateMigration] = [
    "../migrations/20260903_nonprofit_events_integrity.sql",
    "../migrations/20260908_nonprofit_event_archival_write_lock.sql",
    "../migrations/20260909_nonprofit_event_archival_truncate_guard.sql",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));
  for (const migration of [integrityMigration, archivalLockMigration]) {
    if (!migration.includes("enforce_nonprofit_event_child_mutation()") || !migration.includes("FOR UPDATE")) {
      fail("nonprofit-event child write migrations must lock and recheck the parent event");
    }
  }
  for (const migration of [integrityMigration, archivalTruncateMigration]) {
    if (!migration.includes("reject_nonprofit_event_child_truncate()") || !migration.includes("BEFORE TRUNCATE")) {
      fail("nonprofit-event child write migrations must block direct table truncation");
    }
  }
}

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
  verifyMigrationSource();
  const { Client } = await import("pg");
  const { readFile } = await import("node:fs/promises");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } = await import("../tests/e2e/helpers/auth");
  const db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  let eventId: string | undefined;

  await db.connect();
  try {
    const privacyConstraint = await db.query<{ convalidated: boolean }>(
      `SELECT convalidated
         FROM pg_constraint
        WHERE conname = 'chk_nonprofit_event_stories_nonidentifying_attribution'`,
    );
    if (privacyConstraint.rows.length !== 1 || !privacyConstraint.rows[0].convalidated) {
      fail("nonprofit-event privacy check constraint is missing or unvalidated in development");
    }

    const parentKey = await db.query<{ constraintdef: string }>(
      `SELECT pg_get_constraintdef(oid) AS constraintdef
         FROM pg_constraint
        WHERE conrelid = 'nonprofit_events'::regclass
          AND conname = 'nonprofit_events_id_org_unique'
          AND contype = 'u'`,
    );
    if (
      parentKey.rows.length !== 1 ||
      !/\(id, org_id\)/.test(parentKey.rows[0].constraintdef)
    ) {
      fail("nonprofit-events parent key for composite child foreign keys is missing");
    }

    const organizationMemberKey = await db.query<{ constraintdef: string }>(
      `SELECT pg_get_constraintdef(oid) AS constraintdef
         FROM pg_constraint
        WHERE conrelid = 'organization_members'::regclass
          AND conname = 'organization_members_org_user_unique'
          AND contype = 'u'`,
    );
    if (
      organizationMemberKey.rows.length !== 1 ||
      !/\(org_id, user_id\)/.test(organizationMemberKey.rows[0].constraintdef)
    ) {
      fail("organization-members parent key for event-workspace access is missing");
    }

    const eventForeignKeys = await db.query<{
      conname: string;
      childTable: string;
      constraintdef: string;
    }>(
      `SELECT conname,
              conrelid::regclass::text AS "childTable",
              pg_get_constraintdef(oid) AS constraintdef
         FROM pg_constraint
        WHERE contype = 'f'
          AND confrelid = 'nonprofit_events'::regclass
          AND conrelid IN (
            'nonprofit_event_needs'::regclass,
            'nonprofit_event_actions'::regclass,
            'nonprofit_event_stories'::regclass,
            'nonprofit_event_audit_log'::regclass
          )`,
    );
    const expectedCompositeForeignKeys = new Map([
      ["fk_nonprofit_event_needs_event_org", "nonprofit_event_needs"],
      ["fk_nonprofit_event_actions_event_org", "nonprofit_event_actions"],
      ["fk_nonprofit_event_stories_event_org", "nonprofit_event_stories"],
      ["fk_nonprofit_event_audit_event_org", "nonprofit_event_audit_log"],
    ]);
    if (
      eventForeignKeys.rows.length !== expectedCompositeForeignKeys.size ||
      eventForeignKeys.rows.some(
        ({ conname, childTable, constraintdef }) =>
          expectedCompositeForeignKeys.get(conname) !== childTable ||
          !/FOREIGN KEY \(event_id, org_id\) REFERENCES nonprofit_events\(id, org_id\) ON DELETE CASCADE/.test(
            constraintdef,
          ),
      )
    ) {
      fail("nonprofit-event tenant foreign keys are incomplete, extra, or miswired");
    }

    const legacyScalarForeignKeys = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM pg_constraint
        WHERE contype = 'f'
          AND confrelid = 'nonprofit_events'::regclass
          AND conrelid IN (
            'nonprofit_event_needs'::regclass,
            'nonprofit_event_actions'::regclass,
            'nonprofit_event_stories'::regclass,
            'nonprofit_event_audit_log'::regclass
          )
          AND pg_get_constraintdef(oid)
              LIKE 'FOREIGN KEY (event_id) REFERENCES nonprofit_events(id)%'`,
    );
    if (legacyScalarForeignKeys.rows[0]?.count !== "0") {
      fail("legacy scalar nonprofit-event foreign keys remain beside composite tenant keys");
    }

    const childWriteTriggers = await db.query<{
      tableName: string;
      triggerName: string;
      triggerDefinition: string;
    }>(
      `SELECT c.relname AS "tableName",
              t.tgname AS "triggerName",
              pg_get_triggerdef(t.oid) AS "triggerDefinition"
         FROM pg_trigger t
         JOIN pg_class c ON c.oid = t.tgrelid
        WHERE NOT t.tgisinternal
          AND t.tgname IN (
            'trg_nonprofit_event_attendance_active_parent',
            'trg_nonprofit_event_needs_active_parent',
            'trg_nonprofit_event_actions_active_parent',
            'trg_nonprofit_event_stories_active_parent'
          )
        ORDER BY c.relname`,
    );
    const expectedChildWriteTriggers = new Map([
      ["nonprofit_event_attendance", "trg_nonprofit_event_attendance_active_parent"],
      ["nonprofit_event_needs", "trg_nonprofit_event_needs_active_parent"],
      ["nonprofit_event_actions", "trg_nonprofit_event_actions_active_parent"],
      ["nonprofit_event_stories", "trg_nonprofit_event_stories_active_parent"],
    ]);
    if (
      childWriteTriggers.rows.length !== expectedChildWriteTriggers.size
      || childWriteTriggers.rows.some(
        ({ tableName, triggerName, triggerDefinition }) =>
          expectedChildWriteTriggers.get(tableName) !== triggerName
          || !/BEFORE INSERT OR DELETE OR UPDATE/.test(triggerDefinition)
          || !/enforce_nonprofit_event_child_mutation/.test(triggerDefinition),
      )
    ) {
      fail("every nonprofit-event child mutation must use the locked active-parent trigger");
    }
    const childWriteFunction = await db.query<{ definition: string }>(
      `SELECT pg_get_functiondef('enforce_nonprofit_event_child_mutation'::regproc) AS definition`,
    );
    if (
      childWriteFunction.rows.length !== 1
      || !/FOR UPDATE/.test(childWriteFunction.rows[0].definition)
      || !/Archived events are read-only/.test(childWriteFunction.rows[0].definition)
    ) {
      fail("nonprofit-event child write trigger does not lock and reject archived parents");
    }
    const childTruncateTriggers = await db.query<{
      tableName: string;
      triggerName: string;
      triggerDefinition: string;
    }>(
      `SELECT c.relname AS "tableName",
              t.tgname AS "triggerName",
              pg_get_triggerdef(t.oid) AS "triggerDefinition"
         FROM pg_trigger t
         JOIN pg_class c ON c.oid = t.tgrelid
        WHERE NOT t.tgisinternal
          AND t.tgname IN (
            'trg_nonprofit_event_attendance_no_truncate',
            'trg_nonprofit_event_needs_no_truncate',
            'trg_nonprofit_event_actions_no_truncate',
            'trg_nonprofit_event_stories_no_truncate'
          )
        ORDER BY c.relname`,
    );
    const expectedChildTruncateTriggers = new Map([
      ["nonprofit_event_attendance", "trg_nonprofit_event_attendance_no_truncate"],
      ["nonprofit_event_needs", "trg_nonprofit_event_needs_no_truncate"],
      ["nonprofit_event_actions", "trg_nonprofit_event_actions_no_truncate"],
      ["nonprofit_event_stories", "trg_nonprofit_event_stories_no_truncate"],
    ]);
    if (
      childTruncateTriggers.rows.length !== expectedChildTruncateTriggers.size
      || childTruncateTriggers.rows.some(
        ({ tableName, triggerName, triggerDefinition }) =>
          expectedChildTruncateTriggers.get(tableName) !== triggerName
          || !/BEFORE TRUNCATE/.test(triggerDefinition)
          || !/reject_nonprofit_event_child_truncate/.test(triggerDefinition),
      )
    ) {
      fail("every nonprofit-event child table must reject direct truncation");
    }

    const [eventsPageSource, orgSettingsSource, legacyMigrationSource] = await Promise.all([
      readFile("client/src/pages/nonprofit-events.tsx", "utf8"),
      readFile("client/src/pages/org-settings.tsx", "utf8"),
      readFile("migrations/20260905_transition_legacy_event_workspace_access.sql", "utf8"),
    ]);
    if (!/apiRequest\(\s*"POST",\s*"\/api\/me\/organization\/event-workspace-access",\s*\{ userId \},\s*\{ "x-org-id": targetOrgId \}\s*\)/.test(eventsPageSource)) {
      fail("Community Events must send the strict target-only staff-grant body with its captured organization header");
    }
    if (!/apiRequest\(\s*"DELETE",\s*`\/api\/me\/organization\/event-workspace-access\/\$\{userId\}`,\s*undefined,\s*\{ "x-org-id": targetOrgId \}\s*\)/.test(eventsPageSource)) {
      fail("Community Events must send the scoped staff-revocation request with its captured organization header");
    }
    if (orgSettingsSource.includes("event-workspace-access")) {
      fail("Organization Settings must not expose a duplicate event-workspace access panel with a divergent API contract");
    }
    if (!legacyMigrationSource.includes("member.role = 'member'") || !legacyMigrationSource.includes("SET role = 'staff'")) {
      fail("legacy workspace grants are not safely projected into the member-to-staff access model");
    }
    const legacyRuntimeModuleExists = await readFile("server/event-workspace-auth.ts", "utf8")
      .then(() => true)
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return false;
        throw error;
      });
    if (legacyRuntimeModuleExists) fail("retired event-workspace authorization module is still reachable in runtime source");
    ok("kept owner staff management in the authoritative Community Events surface");

    await db.query(`DELETE FROM organizations WHERE id = ANY($1::varchar[])`, [[ORG_A, ORG_B, ORG_LEGACY, ORG_LEGACY_OWNER]]);
    await cleanupTestUser(db, OWNER.userId).catch(() => {});
    await cleanupTestUser(db, OTHER.userId).catch(() => {});
    await cleanupTestUser(db, MEMBER.userId).catch(() => {});
    await cleanupTestUser(db, COLLABORATOR.userId).catch(() => {});
    await cleanupTestUser(db, ORG_ADMIN.userId).catch(() => {});
    await cleanupTestUser(db, ORG_MANAGER.userId).catch(() => {});
    await cleanupTestUser(db, LEGACY_MEMBER.userId).catch(() => {});
    await cleanupTestUser(db, LEGACY_OWNER.userId).catch(() => {});

    await ensureTestUser(db, OWNER);
    await ensureTestUser(db, OTHER);
    await ensureTestUser(db, MEMBER);
    await ensureTestUser(db, COLLABORATOR);
    await ensureTestUser(db, ORG_ADMIN);
    await ensureTestUser(db, ORG_MANAGER);
    await ensureTestUser(db, LEGACY_MEMBER);
    await ensureTestUser(db, LEGACY_OWNER);
    await db.query(
      `INSERT INTO organizations (id, user_id, name, focus_areas, populations_served, counties)
       VALUES ($1, $2, $3, '{}', '{}', '{}'), ($4, $5, $6, '{}', '{}', '{}'), ($7, $8, $9, '{}', '{}', '{}')`,
      [ORG_A, OWNER.userId, "E2E Community Skating Org", ORG_B, OTHER.userId, "E2E Separate Organization", ORG_LEGACY, COLLABORATOR.userId, "E2E Legacy Access Organization"],
    );
    await db.query(
      `INSERT INTO organizations (id, user_id, name, focus_areas, populations_served, counties)
       VALUES ($1, $2, $3, '{}', '{}', '{}')`,
      [ORG_LEGACY_OWNER, LEGACY_OWNER.userId, "E2E Legacy Owner Without Membership"],
    );
    await db.query(
      `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, 'owner'), ($3, $4, 'owner'), ($1, $5, 'member'), ($1, $6, 'collaborator'), ($7, $6, 'owner'), ($7, $8, 'member')
       ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [ORG_A, OWNER.userId, ORG_B, OTHER.userId, MEMBER.userId, COLLABORATOR.userId, ORG_LEGACY, LEGACY_MEMBER.userId],
    );
    await db.query(
      `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'manager')
       ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [ORG_A, ORG_ADMIN.userId, ORG_MANAGER.userId],
    );
    await db.query(`DROP TRIGGER IF EXISTS trg_legacy_event_workspace_access_read_only ON nonprofit_event_workspace_access`);
    await db.query(
      `INSERT INTO nonprofit_event_workspace_access (org_id, user_id, authorized_by_user_id)
       VALUES ($1, $2, $3), ($4, $5, $3)`,
      [ORG_LEGACY, LEGACY_MEMBER.userId, OWNER.userId, ORG_A, COLLABORATOR.userId],
    );
    await db.query(legacyMigrationSource);
    const ownerCookie = await forgeSession(db, OWNER);
    const otherCookie = await forgeSession(db, OTHER);
    const memberCookie = await forgeSession(db, MEMBER);
    const collaboratorCookie = await forgeSession(db, COLLABORATOR);
    const orgAdminCookie = await forgeSession(db, ORG_ADMIN);
    const orgManagerCookie = await forgeSession(db, ORG_MANAGER);
    const legacyMemberCookie = await forgeSession(db, LEGACY_MEMBER);
    const legacyOwnerCookie = await forgeSession(db, LEGACY_OWNER);

    const migratedMembership = await db.query(
      `SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [ORG_LEGACY, LEGACY_MEMBER.userId],
    );
    if (migratedMembership.rows[0]?.role !== "staff") fail("legacy member grant was not migrated to organization staff");
    const migratedAudit = await db.query(
      `SELECT action, workspace_role FROM organization_event_workspace_access_audit WHERE org_id = $1 AND subject_user_id = $2`,
      [ORG_LEGACY, LEGACY_MEMBER.userId],
    );
    if (migratedAudit.rows.length !== 1 || migratedAudit.rows[0]?.action !== "granted" || migratedAudit.rows[0]?.workspace_role !== "staff") {
      fail("legacy member grant did not create one content-free migration audit record");
    }
    const legacyWorkspace = await request("/api/nonprofit-events/workspace", legacyMemberCookie, ORG_LEGACY);
    if (legacyWorkspace.status !== 200) fail(`migrated legacy staff workspace access returned ${legacyWorkspace.status}`);
    const legacyOwnerWorkspace = await request("/api/nonprofit-events/workspace", legacyOwnerCookie, ORG_LEGACY_OWNER);
    if (legacyOwnerWorkspace.status !== 403) fail(`legacy owner without a membership accessed the workspace with ${legacyOwnerWorkspace.status}, expected 403`);
    const legacyOwnerAccessList = await request("/api/me/organization/event-workspace-access", legacyOwnerCookie, ORG_LEGACY_OWNER);
    if (legacyOwnerAccessList.status !== 403) fail(`legacy owner without a membership accessed event-workspace staff management with ${legacyOwnerAccessList.status}, expected 403`);
    const legacyCollaborator = await db.query(
      `SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [ORG_A, COLLABORATOR.userId],
    );
    if (legacyCollaborator.rows[0]?.role !== "collaborator") fail("legacy collaborator grant was incorrectly elevated to staff");
    let legacyWriteBlocked = false;
    try {
      await db.query(
        `UPDATE nonprofit_event_workspace_access SET authorized_by_user_id = $1 WHERE org_id = $2 AND user_id = $3`,
        [OTHER.userId, ORG_LEGACY, LEGACY_MEMBER.userId],
      );
    } catch {
      legacyWriteBlocked = true;
    }
    if (!legacyWriteBlocked) fail("retired legacy workspace access table accepted a new mutation");
    ok("migrated eligible legacy staff access without elevating collaborators");

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
    ok("created a private, organization-scoped event");

    const crossOrg = await request(`/api/nonprofit-events/events/${eventId}/audit`, otherCookie, ORG_B);
    if (crossOrg.status !== 404) fail(`cross-org audit access returned ${crossOrg.status}, expected 404`);
    ok("rejected cross-organization event access");
    const nonStaffWorkspace = await request("/api/nonprofit-events/workspace", memberCookie, ORG_A);
    if (nonStaffWorkspace.status !== 403) fail(`non-staff workspace access returned ${nonStaffWorkspace.status}, expected 403`);
    const nonStaffReport = await request("/api/nonprofit-events/report", memberCookie, ORG_A);
    if (nonStaffReport.status !== 403) fail(`non-staff report access returned ${nonStaffReport.status}, expected 403`);
    const collaboratorWorkspace = await request("/api/nonprofit-events/workspace", collaboratorCookie, ORG_A);
    if (collaboratorWorkspace.status !== 403) fail(`collaborator workspace access returned ${collaboratorWorkspace.status}, expected 403`);
    for (const [membershipRole, cookie] of [["admin", orgAdminCookie], ["manager", orgManagerCookie]] as const) {
      const workspace = await request("/api/nonprofit-events/workspace", cookie, ORG_A);
      if (workspace.status !== 403) fail(`organization ${membershipRole} workspace access returned ${workspace.status}, expected 403`);
      const report = await request("/api/nonprofit-events/report", cookie, ORG_A);
      if (report.status !== 403) fail(`organization ${membershipRole} report access returned ${report.status}, expected 403`);
    }
    const crossOrgReport = await request(`/api/nonprofit-events/report?orgId=${ORG_A}`, otherCookie, ORG_B);
    if (crossOrgReport.status !== 403) fail(`cross-org report access returned ${crossOrgReport.status}, expected 403`);
    ok("limited workspace and reports to active-organization staff, including legacy owners without memberships");

    const foreignAccessList = await request("/api/me/organization/event-workspace-access", otherCookie, ORG_A);
    if (foreignAccessList.status !== 403) fail(`foreign organization access list returned ${foreignAccessList.status}, expected 403`);
    const foreignTargetGrant = await request("/api/me/organization/event-workspace-access", otherCookie, ORG_B, {
      method: "POST",
      body: JSON.stringify({ userId: MEMBER.userId }),
    });
    if (foreignTargetGrant.status !== 404) fail(`cross-organization staff grant returned ${foreignTargetGrant.status}, expected 404`);

    const initialAccess = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A);
    if (initialAccess.status !== 200) fail(`owner access list returned ${initialAccess.status}: ${JSON.stringify(await body(initialAccess))}`);
    const initialAccessBody = await body(initialAccess);
    if (!initialAccessBody.eligibleStaff?.some((row: { userId: string }) => row.userId === MEMBER.userId)) fail("platform staff member was not eligible for owner authorization");
    if (!initialAccessBody.access?.some((row: { userId: string }) => row.userId === OWNER.userId)) fail("owner's current workspace access was not listed");
    if (JSON.stringify(initialAccessBody).includes("case_manager")) fail("access-management response leaked a platform role");

    const rejectedGrantPayload = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({ userId: MEMBER.userId, orgId: ORG_B, role: "admin" }),
    });
    if (rejectedGrantPayload.status !== 400) fail(`grant payload with role/org override returned ${rejectedGrantPayload.status}, expected 400`);
    const collaboratorGrant = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({ userId: COLLABORATOR.userId }),
    });
    if (collaboratorGrant.status !== 404) fail(`collaborator staff grant returned ${collaboratorGrant.status}, expected 404`);
    for (const [membershipRole, userId] of [["admin", ORG_ADMIN.userId], ["manager", ORG_MANAGER.userId]] as const) {
      const grant = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (grant.status !== 404) fail(`organization ${membershipRole} staff grant returned ${grant.status}, expected 404`);
    }
    const afterRejectedGrants = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A);
    const afterRejectedGrantsBody = await body(afterRejectedGrants);
    if (afterRejectedGrants.status !== 200 || afterRejectedGrantsBody.audit.length !== 0) fail("failed staff grants created an access audit record");

    // Owner administration is a separate permission from viewing private event
    // data. The route must re-read this database role instead of trusting the
    // user's login claims or the client-side route gate.
    await db.query(`UPDATE academy_avatars SET role = 'student' WHERE user_id = $1`, [OWNER.userId]);
    const ownerWithoutPlatformRole = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A);
    if (ownerWithoutPlatformRole.status !== 200 || (await body(ownerWithoutPlatformRole)).canAccessWorkspace !== false) {
      fail("an owner without a platform staff role could not manage access independently of event data");
    }
    const ownerDataWithoutPlatformRole = await request("/api/nonprofit-events/workspace", ownerCookie, ORG_A);
    if (ownerDataWithoutPlatformRole.status !== 403) fail(`owner without platform staff role loaded private workspace with ${ownerDataWithoutPlatformRole.status}`);

    const grant = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({ userId: MEMBER.userId }),
    });
    if (grant.status !== 200) fail(`staff grant returned ${grant.status}: ${JSON.stringify(await body(grant))}`);
    const memberAfterGrant = await request("/api/nonprofit-events/workspace", memberCookie, ORG_A);
    if (memberAfterGrant.status !== 200) fail(`granted staff workspace access returned ${memberAfterGrant.status}: ${JSON.stringify(await body(memberAfterGrant))}`);
    const repeatedGrant = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({ userId: MEMBER.userId }),
    });
    if (repeatedGrant.status !== 409) fail(`repeated staff grant returned ${repeatedGrant.status}, expected 409`);

    const grantedAccess = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A);
    if (grantedAccess.status !== 200) fail(`granted access list returned ${grantedAccess.status}`);
    const grantedAccessBody = await body(grantedAccess);
    if (!grantedAccessBody.access?.some((row: { userId: string; workspaceRole: string }) => row.userId === MEMBER.userId && row.workspaceRole === "staff")) {
      fail("granted staff member was not listed as active workspace access");
    }
    if (grantedAccessBody.audit.length !== 1 || grantedAccessBody.audit[0]?.action !== "granted") {
      fail("successful staff grant did not create the expected access audit record");
    }
    if (["id", "workspaceRole", "subjectUserId", "actorUserId", "email", "details"].some((field) => field in grantedAccessBody.audit[0])) {
      fail("access audit response exposed personal or arbitrary content");
    }
    const auditColumns = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'organization_event_workspace_access_audit'
    `);
    const columnNames = new Set(auditColumns.rows.map((row: { column_name: string }) => row.column_name));
    for (const requiredColumn of ["id", "org_id", "subject_user_id", "actor_user_id", "action", "workspace_role", "created_at"]) {
      if (!columnNames.has(requiredColumn)) fail(`access audit omitted required column ${requiredColumn}`);
    }
    for (const prohibitedColumn of ["details", "story_text", "event_id", "email", "reason", "notes"]) {
      if (columnNames.has(prohibitedColumn)) fail(`access audit exposes prohibited content column ${prohibitedColumn}`);
    }
    let auditUpdateBlocked = false;
    let auditDeleteBlocked = false;
    let auditTruncateBlocked = false;
    try { await db.query(`UPDATE organization_event_workspace_access_audit SET action = 'revoked' WHERE org_id = $1`, [ORG_A]); } catch { auditUpdateBlocked = true; }
    try { await db.query(`DELETE FROM organization_event_workspace_access_audit WHERE org_id = $1`, [ORG_A]); } catch { auditDeleteBlocked = true; }
    try { await db.query(`TRUNCATE organization_event_workspace_access_audit`); } catch { auditTruncateBlocked = true; }
    if (!auditUpdateBlocked || !auditDeleteBlocked || !auditTruncateBlocked) fail("access audit was not immutable against direct mutation or truncation");

    const revoke = await request(`/api/me/organization/event-workspace-access/${MEMBER.userId}`, ownerCookie, ORG_A, { method: "DELETE" });
    if (revoke.status !== 200) fail(`staff revoke returned ${revoke.status}: ${JSON.stringify(await body(revoke))}`);
    const memberAfterRevoke = await request("/api/nonprofit-events/workspace", memberCookie, ORG_A);
    if (memberAfterRevoke.status !== 403) fail(`revoked staff workspace access returned ${memberAfterRevoke.status}, expected 403`);
    const repeatedRevoke = await request(`/api/me/organization/event-workspace-access/${MEMBER.userId}`, ownerCookie, ORG_A, { method: "DELETE" });
    if (repeatedRevoke.status !== 409) fail(`repeated staff revoke returned ${repeatedRevoke.status}, expected 409`);
    const revokedAccess = await request("/api/me/organization/event-workspace-access", ownerCookie, ORG_A);
    const revokedAccessBody = await body(revokedAccess);
    if (revokedAccess.status !== 200 || revokedAccessBody.access.some((row: { userId: string }) => row.userId === MEMBER.userId)) {
      fail("revoked staff member remained in active workspace access");
    }
    if (revokedAccessBody.audit.length !== 2 || !revokedAccessBody.audit.some((row: { action: string }) => row.action === "revoked")) {
      fail("staff revocation did not produce one immutable access audit record");
    }
    await db.query(`UPDATE academy_avatars SET role = 'case_manager' WHERE user_id = $1`, [OWNER.userId]);
    ok("owners alone can authorize and revoke eligible event-workspace staff with a content-free immutable audit");

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

    for (const tableName of [
      "nonprofit_event_attendance",
      "nonprofit_event_needs",
      "nonprofit_event_actions",
      "nonprofit_event_stories",
    ]) {
      let truncateBlocked = false;
      await db.query("BEGIN");
      try {
        await db.query(`TRUNCATE ${tableName}`);
      } catch (error) {
        truncateBlocked = error instanceof Error && error.message.includes("cannot be truncated");
      } finally {
        await db.query("ROLLBACK");
      }
      if (!truncateBlocked) fail(`direct truncation was not blocked for ${tableName}`);
    }
    ok("blocked direct child-table truncation from bypassing archive protections");

    const raceEventCreate = await request("/api/nonprofit-events/events", ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        title: "E2E Archive Write Lock",
        purpose: "Prove a concurrent aggregate attendance update cannot alter an archived event.",
        eventDate: "2030-03-16",
        format: "in_person",
        locationName: "Community rink",
        serviceArea: "Wichita, KS",
        communityNeedFocus: ["safe recreation"],
      }),
    });
    if (raceEventCreate.status !== 201) fail(`race event create returned ${raceEventCreate.status}: ${JSON.stringify(await body(raceEventCreate))}`);
    const raceEventId = (await body(raceEventCreate)).event?.id;
    if (!raceEventId) fail("race event create response omitted event.id");
    const initialRaceAttendance = await request(`/api/nonprofit-events/events/${raceEventId}/attendance`, ownerCookie, ORG_A, {
      method: "PUT",
      body: JSON.stringify({ invitedCount: 4, registeredCount: 3, attendedCount: 2, followUpCount: 1, valueSource: "self_reported" }),
    });
    if (initialRaceAttendance.status !== 200) fail(`race attendance setup returned ${initialRaceAttendance.status}: ${JSON.stringify(await body(initialRaceAttendance))}`);
    const raceNeedCreate = await request(`/api/nonprofit-events/events/${raceEventId}/needs`, ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        needArea: "safe recreation",
        sourceName: "Archive race setup",
        geography: "Wichita, KS",
        evidenceStatus: "self_reported",
        responseExplanation: "The event's initial response relationship remains intact after archival.",
      }),
    });
    if (raceNeedCreate.status !== 201) fail(`race need setup returned ${raceNeedCreate.status}: ${JSON.stringify(await body(raceNeedCreate))}`);
    const raceNeedId = (await body(raceNeedCreate)).need?.id;
    if (!raceNeedId) fail("race need setup response omitted need.id");
    const raceActionCreate = await request(`/api/nonprofit-events/events/${raceEventId}/actions`, ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        title: "Preserve archive race baseline",
        ownerLabel: "Event coordinator",
        dueDate: "2030-03-01",
        status: "planned",
        nextStep: "Keep the original action record unchanged after archival.",
      }),
    });
    if (raceActionCreate.status !== 201) fail(`race action setup returned ${raceActionCreate.status}: ${JSON.stringify(await body(raceActionCreate))}`);
    const raceActionId = (await body(raceActionCreate)).action?.id;
    if (!raceActionId) fail("race action setup response omitted action.id");
    const raceStoryCreate = await request(`/api/nonprofit-events/events/${raceEventId}/stories`, ownerCookie, ORG_A, {
      method: "POST",
      body: JSON.stringify({
        title: "Archive race private reflection",
        storyText: "A private anonymous reflection used only to prove archived records cannot change.",
        attributionPreference: "anonymous",
        intendedAudience: "private",
        permittedUses: [],
        consentGranted: false,
        sharingState: "draft",
      }),
    });
    if (raceStoryCreate.status !== 201) fail(`race story setup returned ${raceStoryCreate.status}: ${JSON.stringify(await body(raceStoryCreate))}`);
    const raceStoryId = (await body(raceStoryCreate)).story?.id;
    if (!raceStoryId) fail("race story setup response omitted story.id");

    const archiveWriter = new Client({ connectionString: requireEnv("DATABASE_URL") });
    const childMutations = [
      {
        label: "attendance",
        query: `UPDATE nonprofit_event_attendance
                  SET invited_count = 9,
                      registered_count = 9,
                      attended_count = 9,
                      follow_up_count = 9
                WHERE event_id = $1`,
        values: [raceEventId],
      },
      {
        label: "need",
        query: `UPDATE nonprofit_event_needs
                  SET response_explanation = $4
                WHERE id = $1
                  AND event_id = $2
                  AND org_id = $3`,
        values: [raceNeedId, raceEventId, ORG_A, "This replacement need explanation must never be stored."],
      },
      {
        label: "action",
        query: `UPDATE nonprofit_event_actions
                  SET next_step = $4
                WHERE id = $1
                  AND event_id = $2
                  AND org_id = $3`,
        values: [raceActionId, raceEventId, ORG_A, "This replacement action step must never be stored."],
      },
      {
        label: "story",
        query: `UPDATE nonprofit_event_stories
                  SET story_text = $4
                WHERE id = $1
                  AND event_id = $2
                  AND org_id = $3`,
        values: [raceStoryId, raceEventId, ORG_A, "This replacement story text must never be stored."],
      },
    ];
    const childWriters = childMutations.map(() => new Client({ connectionString: requireEnv("DATABASE_URL") }));
    let archiveWriterInTransaction = false;
    let childWritersInTransaction = false;
    try {
      await Promise.all([archiveWriter.connect(), ...childWriters.map((writer) => writer.connect())]);
      const archivePid = Number((await archiveWriter.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0]?.pid);
      const childPids = (await Promise.all(
        childWriters.map(async (writer) => Number((await writer.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0]?.pid)),
      ));
      if (!Number.isInteger(archivePid) || childPids.some((pid) => !Number.isInteger(pid))) {
        fail("race test could not identify the PostgreSQL sessions that must synchronize");
      }
      await archiveWriter.query("BEGIN");
      archiveWriterInTransaction = true;
      const archiveLock = await archiveWriter.query(
        `UPDATE nonprofit_events
            SET status = 'archived',
                archived_at = now(),
                updated_at = now()
          WHERE id = $1
            AND org_id = $2
        RETURNING id`,
        [raceEventId, ORG_A],
      );
      if (archiveLock.rowCount !== 1) fail("race archive transaction did not lock the expected event");

      await Promise.all(childWriters.map((writer) => writer.query("BEGIN")));
      childWritersInTransaction = true;
      const blockedChildUpdates = childWriters.map((writer, index) =>
        writer.query(childMutations[index].query, childMutations[index].values)
          .then(() => undefined)
          .catch((error: unknown) => error),
      );
      const childLockWaitDeadline = Date.now() + 3_000;
      let archiveBlockedChildPids = new Set<number>();
      while (Date.now() < childLockWaitDeadline) {
        const lockWaits = await db.query<{ pid: number }>(
          `WITH RECURSIVE blocking_chain AS (
             SELECT child.pid AS "childPid",
                    child.pid AS "blockingPid",
                    ARRAY[child.pid] AS visited
               FROM unnest($2::int[]) AS child(pid)
             UNION ALL
             SELECT chain."childPid",
                    blocker.pid AS "blockingPid",
                    chain.visited || blocker.pid
               FROM blocking_chain AS chain
               CROSS JOIN LATERAL unnest(pg_blocking_pids(chain."blockingPid")) AS blocker(pid)
              WHERE NOT blocker.pid = ANY(chain.visited)
           )
           SELECT DISTINCT "childPid" AS pid
             FROM blocking_chain
            WHERE "blockingPid" = $1`,
          [archivePid, childPids],
        );
        archiveBlockedChildPids = new Set(lockWaits.rows.map(({ pid }) => Number(pid)));
        if (childPids.every((pid) => archiveBlockedChildPids.has(pid))) break;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      if (!childPids.every((pid) => archiveBlockedChildPids.has(pid))) {
        fail(`child writes did not reach a confirmed PostgreSQL lock chain behind archival: ${JSON.stringify([...archiveBlockedChildPids])}`);
      }

      await archiveWriter.query("COMMIT");
      archiveWriterInTransaction = false;
      const childErrors = await Promise.all(blockedChildUpdates);
      for (const [index, childError] of childErrors.entries()) {
        if (!(childError instanceof Error) || !childError.message.includes("Archived events are read-only")) {
          fail(`${childMutations[index].label} update was not rejected after concurrent archival: ${String(childError)}`);
        }
      }
      await Promise.all(childWriters.map((writer) => writer.query("ROLLBACK")));
      childWritersInTransaction = false;

      const raceState = await db.query<{
        status: string;
        invitedCount: number;
        registeredCount: number;
        attendedCount: number;
        followUpCount: number;
        needResponse: string;
        actionNextStep: string;
        storyText: string;
      }>(
        `SELECT event.status,
                attendance.invited_count AS "invitedCount",
                attendance.registered_count AS "registeredCount",
                attendance.attended_count AS "attendedCount",
                attendance.follow_up_count AS "followUpCount",
                need.response_explanation AS "needResponse",
                action.next_step AS "actionNextStep",
                story.story_text AS "storyText"
           FROM nonprofit_events AS event
           JOIN nonprofit_event_attendance AS attendance
             ON attendance.event_id = event.id
           JOIN nonprofit_event_needs AS need
             ON need.event_id = event.id
            AND need.id = $3
           JOIN nonprofit_event_actions AS action
             ON action.event_id = event.id
            AND action.id = $4
           JOIN nonprofit_event_stories AS story
             ON story.event_id = event.id
            AND story.id = $5
          WHERE event.id = $1
            AND event.org_id = $2
            AND need.org_id = event.org_id
            AND action.org_id = event.org_id
            AND story.org_id = event.org_id`,
        [raceEventId, ORG_A, raceNeedId, raceActionId, raceStoryId],
      );
      const raceRow = raceState.rows[0];
      if (
        raceState.rows.length !== 1
        || raceRow.status !== "archived"
        || raceRow.invitedCount !== 4
        || raceRow.registeredCount !== 3
        || raceRow.attendedCount !== 2
        || raceRow.followUpCount !== 1
        || raceRow.needResponse !== "The event's initial response relationship remains intact after archival."
        || raceRow.actionNextStep !== "Keep the original action record unchanged after archival."
        || raceRow.storyText !== "A private anonymous reflection used only to prove archived records cannot change."
      ) {
        fail(`concurrent archive/update altered an archived event record: ${JSON.stringify(raceState.rows)}`);
      }
      ok("locked concurrent archive and all child updates so archived records remain unchanged");
    } finally {
      if (archiveWriterInTransaction) await archiveWriter.query("ROLLBACK").catch(() => {});
      if (childWritersInTransaction) await Promise.all(childWriters.map((writer) => writer.query("ROLLBACK").catch(() => {})));
      await Promise.all([...childWriters.map((writer) => writer.end().catch(() => {})), archiveWriter.end().catch(() => {})]);
    }

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
    await db.query(`DELETE FROM organizations WHERE id = ANY($1::varchar[])`, [[ORG_A, ORG_B, ORG_LEGACY, ORG_LEGACY_OWNER]]).catch(() => {});
    await cleanupTestUser(db, OWNER.userId).catch(() => {});
    await cleanupTestUser(db, OTHER.userId).catch(() => {});
    await cleanupTestUser(db, MEMBER.userId).catch(() => {});
    await cleanupTestUser(db, COLLABORATOR.userId).catch(() => {});
    await cleanupTestUser(db, ORG_ADMIN.userId).catch(() => {});
    await cleanupTestUser(db, ORG_MANAGER.userId).catch(() => {});
    await cleanupTestUser(db, LEGACY_MEMBER.userId).catch(() => {});
    await cleanupTestUser(db, LEGACY_OWNER.userId).catch(() => {});
    await db.end().catch(() => {});
  }
}

run().catch((error) => {
  console.error("\n❌ Nonprofit community-event verification failed:", error);
  process.exit(1);
});

const ORG_MANAGER = { userId: "e2e-nonprofit-events-org-manager", email: "e2e-nonprofit-events-org-manager@test.local", firstName: "Events", lastName: "Org Manager", role: "case_manager" };

const LEGACY_OWNER = { userId: "e2e-nonprofit-events-legacy-owner", email: "e2e-nonprofit-events-legacy-owner@test.local", firstName: "Legacy", lastName: "Owner", role: "case_manager" };

const ORG_LEGACY_OWNER = "e2e-nonprofit-events-org-legacy-owner";

const LEGACY_MEMBER = { userId: "e2e-nonprofit-events-legacy-member", email: "e2e-nonprofit-events-legacy-member@test.local", firstName: "Legacy", lastName: "Member", role: "case_manager" };
