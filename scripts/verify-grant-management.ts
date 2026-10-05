/** Development-only lifecycle proof; never deletes pre-existing records. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } from "../tests/e2e/helpers/auth";
import type { GrantManagementResponse } from "../shared/grant-management";
import { reconcileGrantExpiry } from "../server/grant-lifecycle";
import { applyGppLifecycleEvent } from "../server/gpp-opportunity-lifecycle";

if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT) throw new Error("Development verification only");
const host = requireEnv("REPLIT_DEV_DOMAIN");
const base = `https://${host}`;
if (!host.endsWith(".replit.dev")) throw new Error("Refusing non-development HTTP target");
const run = randomUUID();
const ids = ["free", "tracked", "decided", "expired", "rolling", "historical", "timed", "date-only"].map(suffix => `verify-management-${run}-${suffix}`);
const eventIds = [randomUUID(), randomUUID(), randomUUID()];
const orgs = [`verify-management-org-${run}`, `verify-management-other-${run}`];
const users = [
  { userId: `verify-management-owner-${run}`, email: `owner-${run}@test.local` },
  { userId: `verify-management-admin-${run}`, email: `admin-${run}@test.local`, role: "admin" },
  { userId: `verify-management-other-${run}`, email: `other-${run}@test.local`, role: "teacher" },
];
const database = new Client({ connectionString: requireEnv("DATABASE_URL") });
let checks = 0;
async function request(path: string, cookie = "", body?: unknown, extra: Record<string, string> = {}) {
  return fetch(base + path, { method: body ? "POST" : "GET", headers: { cookie, ...extra, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
}
async function expected(response: Response, status: number) {
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  checks++;
  return body;
}

try {
  await database.connect();
  for (const user of users) await ensureTestUser(database, user);
  const cookies: string[] = [];
  for (const user of users) cookies.push(await forgeSession(database, user));
  // Prove HTTP and SQL share this development database before any HTTP write.
  const auth = await expected(await request("/api/auth/user", cookies[0]), 200);
  assert.equal(auth.id, users[0].userId);
  await database.query("INSERT INTO organizations (id,user_id,name) VALUES ($1,$2,'Verification organization'),($3,$4,'Other verification organization')", [orgs[0], users[0].userId, orgs[1], users[2].userId]);
  for (const id of ids) await database.query("INSERT INTO grant_opportunities (id,title,source,status) VALUES ($1,$2,'verification_fixture','identified')", [id, id]);
  await database.query("UPDATE grant_opportunities SET deadline=now()-interval '2 days',deadline_type=CASE WHEN id=$2 THEN 'rolling' ELSE 'fixed' END WHERE id=ANY($1)", [[ids[3], ids[4]], ids[4]]);
  await database.query("UPDATE grant_opportunities SET source='usaspending' WHERE id=$1", [ids[5]]);
  await database.query("UPDATE grant_opportunities SET deadline=(now() at time zone 'UTC')-interval '1 minute',deadline_type='fixed_timestamp' WHERE id=$1", [ids[6]]);
  await database.query("UPDATE grant_opportunities SET deadline=date_trunc('day',now() at time zone 'UTC'),deadline_type='fixed' WHERE id=$1", [ids[7]]);
  await database.query("INSERT INTO grant_org_tracking (org_id,grant_id,status,notes) VALUES ($1,$2,'tracking','Preserve this fixture note'),($3,$2,'tracking','Other tenant'),($1,$4,'awarded','Decision history')", [orgs[0], ids[1], orgs[1], ids[2]]);
  await reconcileGrantExpiry(true);
  const result = await expected(await request(`/api/grants/management?search=${encodeURIComponent(run)}`, cookies[0]), 200) as GrantManagementResponse;
  assert.equal(result.rows.length, 5);
  assert.ok(result.summary.expired >= 1);
  assert.ok(result.lifecycle.lastCompletedRun?.id);
  const catalogue = await expected(await request(`/api/grants?search=${encodeURIComponent(run)}`), 200);
  assert.equal(catalogue.some((row: { id: string }) => [ids[3], ids[5], ids[6]].includes(row.id)), false);
  assert.equal(catalogue.some((row: { id: string }) => row.id === ids[7]), true, "Date-only deadlines stay active through the UTC day");
  assert.equal(catalogue.some((row: { id: string }) => row.id === ids[4]), true);
  assert.equal(result.canManageEntity, true);
  assert.equal(typeof result.summary.corpus, "number");
  await expected(await request("/api/grants/management/bulk", "", { ids: [ids[0]], action: "purge", confirmation: "PURGE 1" }), 401);
  await expected(await request("/api/grants/management?scope=corpus", cookies[2]), 403);
  await expected(await request("/api/grants/management/bulk", cookies[2], { ids: [ids[0]], action: "archive" }), 403);
  await expected(await request("/api/me/grants/bulk", cookies[0], { ids: [ids[1]], action: "dismiss", orgId: orgs[1] }), 400);
  await expected(await request("/api/me/grants/bulk", cookies[0], { ids: [ids[1]], action: "dismiss" }, { "x-org-id": orgs[1] }), 403);
  await expected(await request("/api/me/grants/bulk", cookies[0], { ids: [ids[1]], action: "dismiss" }), 200);
  const states = await database.query("SELECT org_id,status FROM grant_org_tracking WHERE grant_id=$1 ORDER BY org_id", [ids[1]]);
  assert.equal(states.rows.find(r => r.org_id === orgs[0]).status, "dismissed");
  assert.equal(states.rows.find(r => r.org_id === orgs[1]).status, "tracking");
  await expected(await request("/api/me/grants/bulk", cookies[0], { ids: [ids[1]], action: "restore" }), 200);
  const restored = await database.query("SELECT status,notes FROM grant_org_tracking WHERE org_id=$1 AND grant_id=$2", [orgs[0], ids[1]]);
  assert.deepEqual(restored.rows[0], { status: "tracking", notes: "Preserve this fixture note" });
  await expected(await request("/api/me/grants/bulk", cookies[0], { ids: [ids[0], ids[2]], action: "dismiss" }), 409);
  assert.equal((await database.query("SELECT count(*)::int AS n FROM grant_org_tracking WHERE org_id=$1 AND grant_id=$2", [orgs[0], ids[0]])).rows[0].n, 0);
  await expected(await request("/api/grants/management/bulk", cookies[1], { ids: [ids[0]], action: "archive" }), 200);
  await expected(await request("/api/grants/management/bulk", cookies[1], { ids: [ids[0]], action: "restore" }), 200);
  assert.equal((await database.query("SELECT status FROM grant_opportunities WHERE id=$1", [ids[0]])).rows[0].status, "identified");
  await expected(await request("/api/grants/management/bulk", cookies[1], { ids: [ids[0]], action: "purge", confirmation: "wrong" }), 400);
  await expected(await request("/api/grants/management/bulk", cookies[1], { ids: [ids[0], ids[1]], action: "purge", confirmation: "PURGE 2" }), 409);
  assert.equal((await database.query("SELECT count(*)::int AS n FROM grant_opportunities WHERE id=ANY($1)", [ids])).rows[0].n, ids.length);
  await expected(await request("/api/grants/management/bulk", cookies[1], { ids: [ids[0]], action: "purge", confirmation: "PURGE 1" }), 200);
  assert.equal((await database.query("SELECT count(*)::int AS n FROM grant_opportunities WHERE id=$1", [ids[0]])).rows[0].n, 0);
  // External-identity resolution: match by exact sourceUrl, not grantId.
  await database.query("UPDATE grant_opportunities SET source_url='https://issuer.example/verification-fixture' WHERE id=$1", [ids[4]]);
  const change = { externalId: "https://issuer.example/verification-fixture", status: "expired" as const, sourceTimestamp: new Date(Date.now() - 1000).toISOString(), sourceUrl: "https://issuer.example/verification-fixture" };
  const event = { contractVersion: "v1" as const, eventId: eventIds[0], changes: [change] };
  assert.equal((await applyGppLifecycleEvent(event)).accepted, true);
  assert.equal((await applyGppLifecycleEvent(event)).duplicate, true);
  // Same identity, same source timestamp, different status = conflicting replay, rejected.
  await assert.rejects(applyGppLifecycleEvent({ ...event, changes: [{ ...change, status: "cancelled" }] }), /Superseded/);
  await assert.rejects(applyGppLifecycleEvent({ ...event, eventId: eventIds[1], changes: [{ ...change, sourceTimestamp: "2020-01-01T00:00:00Z" }] }), /Superseded/);
  await database.query("UPDATE grant_opportunities SET status='identified' WHERE id=$1", [ids[4]]);
  const suppressed = await expected(await request(`/api/grants?search=${encodeURIComponent(run)}`), 200);
  assert.equal(suppressed.some((row: { id: string }) => row.id === ids[4]), false, "A retired GPP record cannot reappear after source reimport");
  const future = new Date(Date.now() + 7 * 86400_000).toISOString();
  await applyGppLifecycleEvent({ ...event, eventId: eventIds[2], changes: [{ ...change, status: "reopened", sourceTimestamp: new Date().toISOString(), deadline: future }] });
  const reopened = await expected(await request(`/api/grants?search=${encodeURIComponent(run)}`), 200);
  assert.equal(reopened.some((row: { id: string }) => row.id === ids[4]), true);
  assert.equal((await database.query("SELECT status FROM grant_org_tracking WHERE org_id=$1 AND grant_id=$2", [orgs[0], ids[2]])).rows[0].status, "awarded");
  console.log(`PASS: ${checks} authenticated HTTP checks plus tenant, history, rollback and exact-purge database assertions.`);
} finally {
  await database.query("DELETE FROM grant_alerts WHERE grant_id=ANY($1) OR id=ANY($2)", [ids, eventIds.map(id => `gpp-lifecycle:${id}`)]);
  await database.query("DELETE FROM grant_org_tracking WHERE org_id=ANY($1)", [orgs]);
  await database.query("DELETE FROM grant_org_scores WHERE grant_id=ANY($1)", [ids]);
  await database.query("DELETE FROM grant_opportunities WHERE id=ANY($1)", [ids]);
  await database.query("DELETE FROM organizations WHERE id=ANY($1)", [orgs]);
  for (const user of users) await cleanupTestUser(database, user.userId);
  await database.end();
}