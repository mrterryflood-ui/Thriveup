import { test, expect } from "@playwright/test";
import { Client } from "pg";
import {
  forgeSession,
  ensureTestUser,
  cleanupTestUser,
  requireEnv,
} from "./helpers/auth";

/**
 * Task: a re-opened Youth Mode chat must answer in youth-friendly tone end to end.
 *
 * Youth Mode is stored per-conversation (navigator_conversations.youth_mode) and
 * restored by loadConversation(). These tests exercise the real signed-in UI flow:
 *
 * 1. Start a chat with Youth Mode ON → close it → re-open from history:
 *    the toggle shows On and the NEXT chat request carries youthMode: true
 *    (that request body + the server's sticky effectiveYouthMode is what puts
 *    the [YOUTH MODE] instruction into the AI prompt).
 * 2. Re-opening the same thread in a fresh browser (no localStorage, profile
 *    youth-off) still restores Youth Mode from the conversation.
 * 3. A thread started with Youth Mode OFF stays off when re-opened.
 *
 * Sign-in itself is forged (Replit OIDC isn't scriptable) via the shared helper;
 * everything after sign-in uses the real UI + endpoints.
 *
 * Run: npx playwright test tests/e2e/youth-mode-thread-resume.spec.ts
 */

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const USER_ON = "e2e-youth-thread-on-user";
const USER_OFF = "e2e-youth-thread-off-user";

async function cleanupUser(db: Client, userId: string) {
  await db.query(
    `DELETE FROM navigator_messages WHERE conversation_id IN
       (SELECT id FROM navigator_conversations WHERE user_id = $1)`,
    [userId]
  );
  await db.query(`DELETE FROM navigator_conversations WHERE user_id = $1`, [userId]);
  await db.query(`DELETE FROM learner_profiles WHERE user_id = $1`, [userId]);
  await cleanupTestUser(db, userId);
}

/** Poll for the user's newest conversation row (created before AI streaming finishes). */
async function latestConvo(db: Client, userId: string): Promise<{ id: string; youth_mode: boolean }> {
  for (let i = 0; i < 40; i++) {
    const r = await db.query(
      `SELECT id, youth_mode FROM navigator_conversations
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (r.rowCount) return r.rows[0];
    await new Promise((res) => setTimeout(res, 500));
  }
  throw new Error(`No navigator_conversations row appeared for ${userId}`);
}

test.describe("Youth Mode thread resume", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    for (const u of [USER_ON, USER_OFF]) {
      await cleanupUser(db, u);
      await ensureTestUser(db, { userId: u, email: `${u}@test.local` });
    }
  });

  test.afterAll(async () => {
    for (const u of [USER_ON, USER_OFF]) await cleanupUser(db, u);
    await db.end();
  });

  test("youth-on thread: re-open from history restores toggle and next reply is youth-mode", async ({ browser }) => {
    test.setTimeout(180_000);

    const ctx = await browser.newContext({
      extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_ON, email: `${USER_ON}@test.local` }) },
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/navigator`);

    // Turn Youth Mode ON through the real toggle (also persists to profile)
    const toggle = page.getByTestId("button-youth-mode");
    await expect(toggle).toContainText("Youth Mode Off");
    const putOn = page.waitForResponse((r) => r.url().includes("/api/learner-profile") && r.request().method() === "PUT");
    await toggle.click();
    await expect(toggle).toContainText("Youth Mode On");
    expect((await putOn).status()).toBe(200);

    // Start the chat — conversation row is created before the AI stream finishes
    await page.getByTestId("textarea-navigator-input-page").fill("I'm 17 and might lose my housing, can I stay in school?");
    const firstChat = page.waitForResponse((r) => r.url().includes("/api/navigator/chat") && r.request().method() === "POST");
    await page.getByTestId("button-send-page").click();
    expect((await firstChat).status()).toBe(200);

    const convo = await latestConvo(db, USER_ON);
    expect(convo.youth_mode).toBe(true);

    // Wait for streaming to finish so the composer is usable again
    // (the send button is also disabled while the input is empty, so wait on
    // the textarea, which is only disabled during streaming)
    await expect(page.getByTestId("textarea-navigator-input-page")).toBeEnabled({ timeout: 90_000 });

    // "Close" the chat: start a new conversation, then flip Youth Mode OFF so
    // the restore below can only come from the saved thread, not local state.
    await page.getByTestId("button-page-new-chat").click();
    const putOff = page.waitForResponse((r) => r.url().includes("/api/learner-profile") && r.request().method() === "PUT");
    await toggle.click();
    await expect(toggle).toContainText("Youth Mode Off");
    expect((await putOff).status()).toBe(200);

    // Re-open the thread from history → toggle must flip back to On
    await page.getByTestId(`card-convo-page-${convo.id}`).click();
    await expect(toggle).toContainText("Youth Mode On", { timeout: 30_000 });
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    // Next message must carry youthMode: true into the AI request for this thread
    await page.getByTestId("textarea-navigator-input-page").fill("What should I do first?");
    const secondReq = page.waitForRequest((r) => r.url().includes("/api/navigator/chat") && r.method() === "POST");
    const secondRes = page.waitForResponse((r) => r.url().includes("/api/navigator/chat") && r.request().method() === "POST");
    await page.getByTestId("button-send-page").click();
    const body = (await secondReq).postDataJSON();
    expect(body.youthMode).toBe(true);
    expect(body.conversationId).toBe(convo.id);
    expect((await secondRes).status()).toBe(200);
    await ctx.close();

    // ── Fresh browser (no localStorage), profile is OFF: the conversation flag
    //    alone must restore Youth Mode on auto-resume ──
    const fresh = await browser.newContext({
      extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_ON, email: `${USER_ON}@test.local` }) },
    });
    const page2 = await fresh.newPage();
    await page2.goto(`${BASE}/navigator`);
    // Auto-resume loads the most recent conversation
    const toggle2 = page2.getByTestId("button-youth-mode");
    await expect(toggle2).toContainText("Youth Mode On", { timeout: 15_000 });
    await expect(toggle2).toHaveAttribute("aria-checked", "true");
    // (localStorage is deliberately not asserted here: it's only the anonymous
    // fallback, and the globally-mounted bubble Navigator instance also syncs
    // the profile value into it, making its final value racy.)
    await fresh.close();

    // Server-side sanity: the thread flag never regressed
    const after = await db.query(`SELECT youth_mode FROM navigator_conversations WHERE id = $1`, [convo.id]);
    expect(after.rows[0].youth_mode).toBe(true);
  });

  test("youth-off thread stays off when re-opened in a fresh browser", async ({ browser }) => {
    test.setTimeout(180_000);

    const ctx = await browser.newContext({
      extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_OFF, email: `${USER_OFF}@test.local` }) },
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/navigator`);

    const toggle = page.getByTestId("button-youth-mode");
    await expect(toggle).toContainText("Youth Mode Off");

    await page.getByTestId("textarea-navigator-input-page").fill("What rental assistance programs exist in Austin?");
    const chat = page.waitForResponse((r) => r.url().includes("/api/navigator/chat") && r.request().method() === "POST");
    await page.getByTestId("button-send-page").click();
    expect((await chat).status()).toBe(200);

    const convo = await latestConvo(db, USER_OFF);
    expect(convo.youth_mode).toBe(false);
    await ctx.close();

    // Fresh browser, auto-resume: toggle stays Off and next request stays youthMode: false
    const fresh = await browser.newContext({
      extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_OFF, email: `${USER_OFF}@test.local` }) },
    });
    const page2 = await fresh.newPage();
    await page2.goto(`${BASE}/navigator`);

    // Wait until the thread's messages are visible (auto-resume completed)…
    await expect(page2.getByTestId("message-page-user-0")).toBeVisible({ timeout: 15_000 });
    // …then the toggle must still be Off
    const toggle2 = page2.getByTestId("button-youth-mode");
    await expect(toggle2).toContainText("Youth Mode Off");
    await expect(toggle2).toHaveAttribute("aria-checked", "false");

    await page2.getByTestId("textarea-navigator-input-page").fill("Any other options?");
    const req = page2.waitForRequest((r) => r.url().includes("/api/navigator/chat") && r.method() === "POST");
    await page2.getByTestId("button-send-page").click();
    const body = (await req).postDataJSON();
    expect(body.youthMode).toBe(false);
    expect(body.conversationId).toBe(convo.id);
    await fresh.close();

    const after = await db.query(`SELECT youth_mode FROM navigator_conversations WHERE id = $1`, [convo.id]);
    expect(after.rows[0].youth_mode).toBe(false);
  });
});
