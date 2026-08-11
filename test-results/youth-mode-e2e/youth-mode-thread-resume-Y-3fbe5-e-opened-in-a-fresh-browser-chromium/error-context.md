# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: youth-mode-thread-resume.spec.ts >> Youth Mode thread resume >> youth-off thread stays off when re-opened in a fresh browser
- Location: tests/e2e/youth-mode-thread-resume.spec.ts:152:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/navigator
Call log:
  - navigating to "http://localhost:5000/navigator", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
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
  88  |     const putOn = page.waitForResponse((r) => r.url().includes("/api/learner-profile") && r.request().method() === "PUT");
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
> 159 |     await page.goto(`${BASE}/navigator`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/navigator
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
  189 |     await page2.getByTestId("button-send-page").click();
  190 |     const body = (await req).postDataJSON();
  191 |     expect(body.youthMode).toBe(false);
  192 |     expect(body.conversationId).toBe(convo.id);
  193 |     await fresh.close();
  194 | 
  195 |     const after = await db.query(`SELECT youth_mode FROM navigator_conversations WHERE id = $1`, [convo.id]);
  196 |     expect(after.rows[0].youth_mode).toBe(false);
  197 |   });
  198 | });
  199 | 
```