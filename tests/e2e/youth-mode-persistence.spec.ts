import { test, expect, request as pwRequest } from "@playwright/test";
import { Client } from "pg";
import crypto from "crypto";

/**
 * Youth Mode persistence — guards the server round-trip for authenticated users
 * and the localStorage fallback for anonymous users, exercised through the real
 * Navigator UI.
 *
 * Auth is Replit OIDC, so the interactive sign-in itself isn't scriptable.
 * Signing in is simulated the same way the app experiences it: a session row in
 * the `sessions` table (the app's own store) plus a signed connect.sid cookie.
 * Everything after sign-in — toggling in the UI, the debounced PUT, sign-out via
 * the real /api/logout, and hydration on a second device — uses the real flows.
 *
 * Run: npx playwright test tests/e2e/youth-mode-persistence.spec.ts
 */

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const TEST_USER_ID = "e2e-youth-mode-test-user";
const TEST_EMAIL = "e2e-youth-mode@test.local";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is required for this test`);
  return v;
}

/** Sign a session id the way express-session/cookie-signature does. */
function signSid(sid: string, secret: string): string {
  const sig = crypto
    .createHmac("sha256", secret)
    .update(sid)
    .digest("base64")
    .replace(/=+$/, "");
  return `s:${sid}.${sig}`;
}

/** Insert a fresh session row for TEST_USER_ID; returns the Cookie header value. */
async function forgeSession(db: Client): Promise<string> {
  const sid = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const sess = {
    cookie: {
      originalMaxAge: 60 * 60 * 1000,
      expires: expires.toISOString(),
      secure: true,
      httpOnly: true,
      path: "/",
    },
    passport: {
      user: {
        claims: {
          sub: TEST_USER_ID,
          email: TEST_EMAIL,
          first_name: "E2E",
          last_name: "YouthMode",
        },
        expires_at: Math.floor(expires.getTime() / 1000),
      },
    },
  };
  await db.query(
    `INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)`,
    [sid, JSON.stringify(sess), expires]
  );
  return `connect.sid=${encodeURIComponent(signSid(sid, requireEnv("SESSION_SECRET")))}`;
}

async function cleanup(db: Client) {
  await db.query(`DELETE FROM learner_profiles WHERE user_id = $1`, [TEST_USER_ID]);
  await db.query(`DELETE FROM sessions WHERE sess->'passport'->'user'->'claims'->>'sub' = $1`, [TEST_USER_ID]);
  await db.query(`DELETE FROM users WHERE id = $1`, [TEST_USER_ID]);
}

test.describe("Youth Mode persistence", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanup(db);
    // The users row the OIDC callback would normally upsert (needed by /api/auth/user)
    await db.query(
      `INSERT INTO users (id, email, first_name, last_name) VALUES ($1, $2, 'E2E', 'YouthMode')`,
      [TEST_USER_ID, TEST_EMAIL]
    );
  });

  test.afterAll(async () => {
    await cleanup(db);
    await db.end();
  });

  test("preference toggled in the UI survives sign-out and sign-in on a different device", async ({ browser }) => {
    // ── Device A: signed in, toggles Youth Mode on in the Navigator UI ──
    const cookieA = await forgeSession(db);
    const deviceA = await browser.newContext({ extraHTTPHeaders: { Cookie: cookieA } });
    const pageA = await deviceA.newPage();

    await pageA.goto(`${BASE}/navigator`);
    const toggleA = pageA.getByTestId("button-youth-mode");
    await expect(toggleA).toContainText("Youth Mode Off");

    // Click and wait for the debounced PUT to hit the server successfully
    const putPromise = pageA.waitForResponse(
      (res) => res.url().includes("/api/learner-profile") && res.request().method() === "PUT",
      { timeout: 10_000 }
    );
    await toggleA.click();
    await expect(toggleA).toContainText("Youth Mode On"); // instant optimistic UI
    const putRes = await putPromise;
    expect(putRes.status()).toBe(200);
    expect((await putRes.json()).youthMode).toBe(true);

    // ── Sign out via the real logout flow (destroys the session server-side) ──
    const logoutCtx = await pwRequest.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookieA },
      maxRedirects: 0, // don't follow the OIDC end-session redirect off-site
    });
    const logoutRes = await logoutCtx.get("/api/logout");
    expect(logoutRes.status()).toBe(302);
    // Session A is genuinely dead: authenticated endpoint now rejects it
    const afterLogout = await logoutCtx.get("/api/learner-profile");
    expect(afterLogout.status()).toBe(401);
    await logoutCtx.dispose();
    await deviceA.close();

    // ── Device B: brand-new browser context (no shared cookies/localStorage),
    //    fresh sign-in as the same user ──
    const cookieB = await forgeSession(db);
    const deviceB = await browser.newContext({ extraHTTPHeaders: { Cookie: cookieB } });
    const pageB = await deviceB.newPage();

    await pageB.goto(`${BASE}/navigator`);
    // The Navigator hydrates Youth Mode from the saved server profile
    const toggleB = pageB.getByTestId("button-youth-mode");
    await expect(toggleB).toContainText("Youth Mode On", { timeout: 10_000 });
    await expect(toggleB).toHaveAttribute("aria-checked", "true");
    await deviceB.close();
  });

  test("learner-profile endpoints reject anonymous requests", async () => {
    const anon = await pwRequest.newContext({ baseURL: BASE });
    expect((await anon.get("/api/learner-profile")).status()).toBe(401);
    expect((await anon.put("/api/learner-profile", { data: { youthMode: true } })).status()).toBe(401);
    await anon.dispose();
  });

  test("anonymous users: toggling in the UI persists via localStorage across reloads", async ({ browser }) => {
    const ctx = await browser.newContext(); // isolated storage
    const page = await ctx.newPage();

    await page.goto(`${BASE}/navigator`);
    const toggle = page.getByTestId("button-youth-mode");
    await expect(toggle).toContainText("Youth Mode Off"); // clean default

    await toggle.click();
    await expect(toggle).toContainText("Youth Mode On");
    // The interaction itself wrote the value
    expect(await page.evaluate(() => window.localStorage.getItem("tcaf_youth_mode"))).toBe("true");

    await page.reload();
    const reloaded = page.getByTestId("button-youth-mode");
    await expect(reloaded).toContainText("Youth Mode On");
    await expect(reloaded).toHaveAttribute("aria-checked", "true");
    await ctx.close();
  });
});
