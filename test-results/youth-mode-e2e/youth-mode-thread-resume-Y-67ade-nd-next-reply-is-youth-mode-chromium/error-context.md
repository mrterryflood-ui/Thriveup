# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: youth-mode-thread-resume.spec.ts >> Youth Mode thread resume >> youth-on thread: re-open from history restores toggle and next reply is youth-mode
- Location: tests/e2e/youth-mode-thread-resume.spec.ts:76:3

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Fixture "trace recording" timeout of 30000ms exceeded during teardown.
```

```
Error: page.waitForResponse: Test ended.
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { Client } from "pg";
  3   | import {
  4   |   forgeSession,
  5   |   ensureTestUser,
  6   |   cleanupTestUser,
  7   |   requireEnv,
  8   | } from "./helpers/auth";
  9   | 
  10  | /**
  11  |  * Task: a re-opened Youth Mode chat must answer in youth-friendly tone end to end.
  12  |  *
  13  |  * Youth Mode is stored per-conversation (navigator_conversations.youth_mode) and
  14  |  * restored by loadConversation(). These tests exercise the real signed-in UI flow:
  15  |  *
  16  |  * 1. Start a chat with Youth Mode ON → close it → re-open from history:
  17  |  *    the toggle shows On and the NEXT chat request carries youthMode: true
  18  |  *    (that request body + the server's sticky effectiveYouthMode is what puts
  19  |  *    the [YOUTH MODE] instruction into the AI prompt).
  20  |  * 2. Re-opening the same thread in a fresh browser (no localStorage, profile
  21  |  *    youth-off) still restores Youth Mode from the conversation.
  22  |  * 3. A thread started with Youth Mode OFF stays off when re-opened.
  23  |  *
  24  |  * Sign-in itself is forged (Replit OIDC isn't scriptable) via the shared helper;
  25  |  * everything after sign-in uses the real UI + endpoints.
  26  |  *
  27  |  * Run: npx playwright test tests/e2e/youth-mode-thread-resume.spec.ts
  28  |  */
  29  | 
  30  | const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
  31  | const USER_ON = "e2e-youth-thread-on-user";
  32  | const USER_OFF = "e2e-youth-thread-off-user";
  33  | 
  34  | async function cleanupUser(db: Client, userId: string) {
  35  |   await db.query(
  36  |     `DELETE FROM navigator_messages WHERE conversation_id IN
  37  |        (SELECT id FROM navigator_conversations WHERE user_id = $1)`,
  38  |     [userId]
  39  |   );
  40  |   await db.query(`DELETE FROM navigator_conversations WHERE user_id = $1`, [userId]);
  41  |   await db.query(`DELETE FROM learner_profiles WHERE user_id = $1`, [userId]);
  42  |   await cleanupTestUser(db, userId);
  43  | }
  44  | 
  45  | /** Poll for the user's newest conversation row (created before AI streaming finishes). */
  46  | async function latestConvo(db: Client, userId: string): Promise<{ id: string; youth_mode: boolean }> {
  47  |   for (let i = 0; i < 40; i++) {
  48  |     const r = await db.query(
  49  |       `SELECT id, youth_mode FROM navigator_conversations
  50  |        WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
  51  |       [userId]
  52  |     );
  53  |     if (r.rowCount) return r.rows[0];
  54  |     await new Promise((res) => setTimeout(res, 500));
  55  |   }
  56  |   throw new Error(`No navigator_conversations row appeared for ${userId}`);
  57  | }
  58  | 
  59  | test.describe("Youth Mode thread resume", () => {
  60  |   let db: Client;
  61  | 
  62  |   test.beforeAll(async () => {
  63  |     db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  64  |     await db.connect();
  65  |     for (const u of [USER_ON, USER_OFF]) {
  66  |       await cleanupUser(db, u);
  67  |       await ensureTestUser(db, { userId: u, email: `${u}@test.local` });
  68  |     }
  69  |   });
  70  | 
  71  |   test.afterAll(async () => {
  72  |     for (const u of [USER_ON, USER_OFF]) await cleanupUser(db, u);
  73  |     await db.end();
  74  |   });
  75  | 
  76  |   test("youth-on thread: re-open from history restores toggle and next reply is youth-mode", async ({ browser }) => {
  77  |     test.setTimeout(180_000);
  78  | 
  79  |     const ctx = await browser.newContext({
  80  |       extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_ON, email: `${USER_ON}@test.local` }) },
  81  |     });
  82  |     const page = await ctx.newPage();
  83  |     await page.goto(`${BASE}/navigator`);
  84  | 
  85  |     // Turn Youth Mode ON through the real toggle (also persists to profile)
  86  |     const toggle = page.getByTestId("button-youth-mode");
  87  |     await expect(toggle).toContainText("Youth Mode Off");
> 88  |     const putOn = page.waitForResponse((r) => r.url().includes("/api/learner-profile") && r.request().method() === "PUT");
      |                        ^ Error: page.waitForResponse: Test ended.
  89  |     await toggle.click();
  90  |     await expect(toggle).toContainText("Youth Mode On");
  91  |     expect((await putOn).status()).toBe(200);
  92  | 
  93  |     // Start the chat — conversation row is created before the AI stream finishes
  94  |     await page.getByTestId("textarea-navigator-input-page").fill("I'm 17 and might lose my housing, can I stay in school?");
  95  |     const firstChat = page.waitForResponse((r) => r.url().includes("/api/navigator/chat") && r.request().method() === "POST");
  96  |     await page.getByTestId("button-send-page").click();
  97  |     expect((await firstChat).status()).toBe(200);
  98  | 
  99  |     const convo = await latestConvo(db, USER_ON);
  100 |     expect(convo.youth_mode).toBe(true);
  101 | 
  102 |     // Wait for streaming to finish so the composer is usable again
  103 |     // (the send button is also disabled while the input is empty, so wait on
  104 |     // the textarea, which is only disabled during streaming)
  105 |     await expect(page.getByTestId("textarea-navigator-input-page")).toBeEnabled({ timeout: 90_000 });
  106 | 
  107 |     // "Close" the chat: start a new conversation, then flip Youth Mode OFF so
  108 |     // the restore below can only come from the saved thread, not local state.
  109 |     await page.getByTestId("button-page-new-chat").click();
  110 |     const putOff = page.waitForResponse((r) => r.url().includes("/api/learner-profile") && r.request().method() === "PUT");
  111 |     await toggle.click();
  112 |     await expect(toggle).toContainText("Youth Mode Off");
  113 |     expect((await putOff).status()).toBe(200);
  114 | 
  115 |     // Re-open the thread from history → toggle must flip back to On
  116 |     await page.getByTestId(`card-convo-page-${convo.id}`).click();
  117 |     await expect(toggle).toContainText("Youth Mode On", { timeout: 30_000 });
  118 |     await expect(toggle).toHaveAttribute("aria-checked", "true");
  119 | 
  120 |     // Next message must carry youthMode: true into the AI request for this thread
  121 |     await page.getByTestId("textarea-navigator-input-page").fill("What should I do first?");
  122 |     const secondReq = page.waitForRequest((r) => r.url().includes("/api/navigator/chat") && r.method() === "POST");
  123 |     const secondRes = page.waitForResponse((r) => r.url().includes("/api/navigator/chat") && r.request().method() === "POST");
  124 |     await page.getByTestId("button-send-page").click();
  125 |     const body = (await secondReq).postDataJSON();
  126 |     expect(body.youthMode).toBe(true);
  127 |     expect(body.conversationId).toBe(convo.id);
  128 |     expect((await secondRes).status()).toBe(200);
  129 |     await ctx.close();
  130 | 
  131 |     // ── Fresh browser (no localStorage), profile is OFF: the conversation flag
  132 |     //    alone must restore Youth Mode on auto-resume ──
  133 |     const fresh = await browser.newContext({
  134 |       extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_ON, email: `${USER_ON}@test.local` }) },
  135 |     });
  136 |     const page2 = await fresh.newPage();
  137 |     await page2.goto(`${BASE}/navigator`);
  138 |     // Auto-resume loads the most recent conversation
  139 |     const toggle2 = page2.getByTestId("button-youth-mode");
  140 |     await expect(toggle2).toContainText("Youth Mode On", { timeout: 15_000 });
  141 |     await expect(toggle2).toHaveAttribute("aria-checked", "true");
  142 |     // (localStorage is deliberately not asserted here: it's only the anonymous
  143 |     // fallback, and the globally-mounted bubble Navigator instance also syncs
  144 |     // the profile value into it, making its final value racy.)
  145 |     await fresh.close();
  146 | 
  147 |     // Server-side sanity: the thread flag never regressed
  148 |     const after = await db.query(`SELECT youth_mode FROM navigator_conversations WHERE id = $1`, [convo.id]);
  149 |     expect(after.rows[0].youth_mode).toBe(true);
  150 |   });
  151 | 
  152 |   test("youth-off thread stays off when re-opened in a fresh browser", async ({ browser }) => {
  153 |     test.setTimeout(180_000);
  154 | 
  155 |     const ctx = await browser.newContext({
  156 |       extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_OFF, email: `${USER_OFF}@test.local` }) },
  157 |     });
  158 |     const page = await ctx.newPage();
  159 |     await page.goto(`${BASE}/navigator`);
  160 | 
  161 |     const toggle = page.getByTestId("button-youth-mode");
  162 |     await expect(toggle).toContainText("Youth Mode Off");
  163 | 
  164 |     await page.getByTestId("textarea-navigator-input-page").fill("What rental assistance programs exist in Austin?");
  165 |     const chat = page.waitForResponse((r) => r.url().includes("/api/navigator/chat") && r.request().method() === "POST");
  166 |     await page.getByTestId("button-send-page").click();
  167 |     expect((await chat).status()).toBe(200);
  168 | 
  169 |     const convo = await latestConvo(db, USER_OFF);
  170 |     expect(convo.youth_mode).toBe(false);
  171 |     await ctx.close();
  172 | 
  173 |     // Fresh browser, auto-resume: toggle stays Off and next request stays youthMode: false
  174 |     const fresh = await browser.newContext({
  175 |       extraHTTPHeaders: { Cookie: await forgeSession(db, { userId: USER_OFF, email: `${USER_OFF}@test.local` }) },
  176 |     });
  177 |     const page2 = await fresh.newPage();
  178 |     await page2.goto(`${BASE}/navigator`);
  179 | 
  180 |     // Wait until the thread's messages are visible (auto-resume completed)…
  181 |     await expect(page2.getByTestId("message-page-user-0")).toBeVisible({ timeout: 15_000 });
  182 |     // …then the toggle must still be Off
  183 |     const toggle2 = page2.getByTestId("button-youth-mode");
  184 |     await expect(toggle2).toContainText("Youth Mode Off");
  185 |     await expect(toggle2).toHaveAttribute("aria-checked", "false");
  186 | 
  187 |     await page2.getByTestId("textarea-navigator-input-page").fill("Any other options?");
  188 |     const req = page2.waitForRequest((r) => r.url().includes("/api/navigator/chat") && r.method() === "POST");
```