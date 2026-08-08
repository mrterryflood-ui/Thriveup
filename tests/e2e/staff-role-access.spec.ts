import { test, expect, request as pwRequest } from "@playwright/test";
import { Client } from "pg";
import {
  forgeSession,
  ensureTestUser,
  cleanupTestUser,
  requireEnv,
} from "./helpers/auth";

/**
 * Verifies the shared signed-in helper's role support: a forged session for a
 * user whose role was provisioned via ensureTestUser() must pass both role
 * gates on the platform — requireAdmin (server/routes.ts) and requireStaff
 * (server/yhsi-routes.ts) — which resolve roles from the DB, not the session.
 *
 * Run: npx playwright test tests/e2e/staff-role-access.spec.ts
 */

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const ADMIN_ID = "e2e-staff-role-admin";
const ADMIN_EMAIL = "e2e-staff-role-admin@test.local";

test.describe("Shared auth helper role support", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, ADMIN_ID);
    await ensureTestUser(db, {
      userId: ADMIN_ID,
      email: ADMIN_EMAIL,
      firstName: "E2E",
      lastName: "StaffRole",
      role: "admin",
    });
  });

  test.afterAll(async () => {
    await cleanupTestUser(db, ADMIN_ID);
    await db.end();
  });

  test("admin-role forged session passes requireAdmin and requireStaff gates", async () => {
    const cookie = await forgeSession(db, { userId: ADMIN_ID, email: ADMIN_EMAIL });
    const ctx = await pwRequest.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookie },
    });

    // requireAdmin gate (server/routes.ts)
    const adminRes = await ctx.get("/api/parent/support-alerts");
    expect(adminRes.status()).toBe(200);

    // requireStaff gate (server/yhsi-routes.ts) — staff-only participants list
    const staffRes = await ctx.get("/api/yhsi/participants");
    expect(staffRes.status()).toBe(200);

    await ctx.dispose();
  });

  test("same endpoints reject anonymous requests", async () => {
    const anon = await pwRequest.newContext({ baseURL: BASE });
    expect((await anon.get("/api/parent/support-alerts")).status()).toBe(401);
    expect((await anon.get("/api/yhsi/participants")).status()).toBe(401);
    await anon.dispose();
  });
});
