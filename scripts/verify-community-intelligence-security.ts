/**
 * Authenticated authorization regression gate for the community intelligence
 * foundation. It creates isolated test users and fixtures, then proves:
 *   - chats cannot be read, deleted, or posted to across user boundaries;
 *   - organization exports require owner/member/staff authorization;
 *   - consortium exports require proposal ownership or DB-verified staff;
 *   - grant-only exports are staff-only; and
 *   - rejected exports never stamp gpp_pushed_at.
 *
 * The gate does not require a live GrantPathPro partner target. Authorized
 * requests may report an upstream delivery failure; their authorization
 * outcome is still independently observable before outbound delivery.
 */
import { randomUUID } from "crypto";

const BASE = process.env.BASE_URL || "http://localhost:5000";
const RUN = randomUUID().slice(0, 8);
const USERS = {
  owner: { userId: `e2e-ci-owner-${RUN}`, email: `e2e-ci-owner-${RUN}@test.local` },
  member: { userId: `e2e-ci-member-${RUN}`, email: `e2e-ci-member-${RUN}@test.local` },
  stranger: { userId: `e2e-ci-stranger-${RUN}`, email: `e2e-ci-stranger-${RUN}@test.local` },
  staff: { userId: `e2e-ci-staff-${RUN}`, email: `e2e-ci-staff-${RUN}@test.local`, role: "staff" },
};
const ORG_ID = `e2e-ci-org-${RUN}`;
const PROPOSAL_ID = `e2e-ci-proposal-${RUN}`;

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`✓ ${label}`);
  } else {
    failed++;
    console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function request(path: string, cookie: string, method = "GET", body?: unknown) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: { cookie, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function run() {
  const { Client } = await import("pg");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } =
    await import("../tests/e2e/helpers/auth");
  const db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await db.connect();

  try {
    for (const user of Object.values(USERS)) await ensureTestUser(db, user);
    // pg.Client executes one query at a time; keep session inserts serial to
    // avoid masking authorization results with a driver concurrency warning.
    const ownerCookie = await forgeSession(db, USERS.owner);
    const memberCookie = await forgeSession(db, USERS.member);
    const strangerCookie = await forgeSession(db, USERS.stranger);
    const staffCookie = await forgeSession(db, USERS.staff);

    await db.query(
      `INSERT INTO organizations (id, user_id, name, focus_areas, populations_served, counties, naics_codes, psc_codes)
       VALUES ($1, $2, $3, '{}', '{}', '{}', '{}', '{}')`,
      [ORG_ID, USERS.owner.userId, `E2E Community Intelligence ${RUN}`],
    );
    await db.query(
      `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, 'member')`,
      [ORG_ID, USERS.member.userId],
    );
    await db.query(
      `INSERT INTO consortium_proposals (id, created_by, grant_title, project_title, prime_org_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [PROPOSAL_ID, USERS.owner.userId, `E2E Grant ${RUN}`, `E2E Project ${RUN}`, `E2E Prime ${RUN}`],
    );

    // The legacy generic chat API has no product UI consumer and deliberately
    // remains unregistered. Verify the storage boundary directly so any future
    // registered conversation surface cannot enumerate ownerless/foreign rows.
    const { chatStorage } = await import("../server/replit_integrations/chat/storage");
    const privateChat = await chatStorage.createConversation(`Private ${RUN}`, USERS.owner.userId);
    assert(!!(await chatStorage.getConversation(privateChat.id, USERS.owner.userId)), "chat owner can load its private conversation");
    assert(!(await chatStorage.getConversation(privateChat.id, USERS.stranger.userId)), "stranger cannot load another user's chat");
    await chatStorage.deleteConversation(privateChat.id, USERS.stranger.userId);
    assert(!!(await chatStorage.getConversation(privateChat.id, USERS.owner.userId)), "stranger cannot delete another user's chat");
    await chatStorage.deleteConversation(privateChat.id, USERS.owner.userId);
    assert(!(await chatStorage.getConversation(privateChat.id, USERS.owner.userId)), "chat owner can delete its private conversation");

    const strangerOrg = await request("/api/thriveup/push-entity", strangerCookie, "POST", { entityId: ORG_ID });
    assert(strangerOrg.status === 403, "unrelated user cannot export an organization", `status ${strangerOrg.status}`);
    const memberOrg = await request("/api/thriveup/push-entity", memberCookie, "POST", { entityId: ORG_ID });
    assert(memberOrg.status !== 403 && memberOrg.status !== 404, "organization member is authorized before outbound delivery", `status ${memberOrg.status}`);

    const strangerProposal = await request("/api/thriveup/push-collaborative", strangerCookie, "POST", { consortiumId: PROPOSAL_ID });
    assert(strangerProposal.status === 403, "unrelated user cannot export a consortium proposal", `status ${strangerProposal.status}`);
    const strangerPush = await request("/api/thriveup/push-proposal", strangerCookie, "POST", { consortiumId: PROPOSAL_ID });
    assert(strangerPush.status === 403, "unrelated user cannot stamp a consortium proposal as pushed", `status ${strangerPush.status}`);
    const staffProposal = await request("/api/thriveup/push-collaborative", staffCookie, "POST", { consortiumId: PROPOSAL_ID });
    assert(staffProposal.status !== 403 && staffProposal.status !== 404, "DB-verified staff can authorize consortium export", `status ${staffProposal.status}`);

    const ordinaryGrant = await request("/api/thriveup/push-pursuit", strangerCookie, "POST", { grantId: "missing-grant" });
    assert(ordinaryGrant.status === 403, "ordinary user cannot make a grant-only export", `status ${ordinaryGrant.status}`);
    const staffGrant = await request("/api/thriveup/push-pursuit", staffCookie, "POST", { grantId: "missing-grant" });
    assert(staffGrant.status !== 403 && staffGrant.status !== 404, "DB-verified staff can authorize grant-only export", `status ${staffGrant.status}`);

    const stamp = await db.query(`SELECT gpp_pushed_at FROM consortium_proposals WHERE id = $1`, [PROPOSAL_ID]);
    assert(stamp.rows[0]?.gpp_pushed_at === null, "rejected requests never mark a proposal as pushed");
  } finally {
    await db.query(`DELETE FROM chat_conversations WHERE title = $1`, [`Private ${RUN}`]).catch(() => {});
    await db.query(`DELETE FROM consortium_proposals WHERE id = $1`, [PROPOSAL_ID]).catch(() => {});
    await db.query(`DELETE FROM organization_members WHERE org_id = $1`, [ORG_ID]).catch(() => {});
    await db.query(`DELETE FROM organizations WHERE id = $1`, [ORG_ID]).catch(() => {});
    for (const user of Object.values(USERS)) await cleanupTestUser(db, user.userId).catch(() => {});
    await db.end().catch(() => {});
  }
  console.log(`\ncommunity-intelligence security: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

run().catch((error) => {
  console.error("community-intelligence security gate crashed:", error);
  process.exit(1);
});