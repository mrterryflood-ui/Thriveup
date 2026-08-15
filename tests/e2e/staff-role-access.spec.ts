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
const STUDENT_ID = "e2e-staff-role-student";
const STUDENT_EMAIL = "e2e-staff-role-student@test.local";

test.describe("Shared auth helper role support", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, ADMIN_ID);
    await cleanupTestUser(db, STUDENT_ID);
    await ensureTestUser(db, {
      userId: ADMIN_ID,
      email: ADMIN_EMAIL,
      firstName: "E2E",
      lastName: "StaffRole",
      role: "admin",
    });
    await ensureTestUser(db, {
      userId: STUDENT_ID,
      email: STUDENT_EMAIL,
      firstName: "E2E",
      lastName: "NonStaff",
      role: "student",
    });
  });

  test.afterAll(async () => {
    await cleanupTestUser(db, ADMIN_ID);
    await cleanupTestUser(db, STUDENT_ID);
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

  // Task #202: POST /api/neighborhood/email-report requires auth.
  // Forge an authenticated session and post a minimal valid payload; assert
  // 200 {sent: true|false} — not a 401 or 403.  The endpoint internally calls
  // sendNeighborhoodReport which may return false if Resend is unavailable in
  // this env; that's acceptable — we only care that auth is not rejected.
  test("email-report: authenticated request is not 401/403", async () => {
    const cookie = await forgeSession(db, { userId: ADMIN_ID, email: ADMIN_EMAIL });
    const ctx = await pwRequest.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookie },
    });

    const minimalProfile = {
      zipCode: "10001",
      neighborhoodName: "Test Area",
      countyName: "Test County",
      stateName: "NY",
      indicators: {
        povertyRate: 10,
        medianIncome: 50000,
        unemploymentRate: 5,
        noHealthInsurance: 8,
        minorityPct: 30,
        multiUnitHousing: 15,
        overcrowding: 2,
        noVehicle: 4,
        noBroadband: 10,
        snapRecipients: 9,
      },
      goingWell: [],
      needsAttention: [],
    };

    const res = await ctx.post("/api/neighborhood/email-report", {
      data: { profile: minimalProfile, recipientEmail: "e2e-test@example.com" },
    });

    // Auth must pass — 401/403 means the forged session was rejected.
    expect([401, 403]).not.toContain(res.status());

    // If auth passed we should get 200 (sent: true/false), 429 (rate-limited),
    // or 502/catch-json (email provider unavailable) — all are acceptable here.
    const status = res.status();
    expect([200, 429, 502]).toContain(status);

    if (status === 200) {
      const body = await res.json();
      expect(typeof body.sent).toBe("boolean");
    }

    await ctx.dispose();
  });

  // GPP inbound event feed (server/grantpathpro-routes.ts): staff session must
  // get through, a signed-in non-staff user must get 403, anonymous gets 401.
  test("GPP events feed: staff 200, non-staff 403, anonymous 401", async () => {
    const staffCookie = await forgeSession(db, { userId: ADMIN_ID, email: ADMIN_EMAIL });
    const staffCtx = await pwRequest.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: staffCookie },
    });
    const staffRes = await staffCtx.get("/api/inbound/grantpathpro/events");
    expect(staffRes.status()).toBe(200);
    const body = await staffRes.json();
    expect(Array.isArray(body.events)).toBe(true);
    await staffCtx.dispose();

    const studentCookie = await forgeSession(db, { userId: STUDENT_ID, email: STUDENT_EMAIL });
    const studentCtx = await pwRequest.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: studentCookie },
    });
    expect((await studentCtx.get("/api/inbound/grantpathpro/events")).status()).toBe(403);
    await studentCtx.dispose();

    const anon = await pwRequest.newContext({ baseURL: BASE });
    expect((await anon.get("/api/inbound/grantpathpro/events")).status()).toBe(401);
    await anon.dispose();
  });
});
