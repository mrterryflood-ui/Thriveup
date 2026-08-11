# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: youth-mode-persistence.spec.ts >> Youth Mode persistence >> preference toggled in the UI survives sign-out and sign-in on a different device
- Location: tests/e2e/youth-mode-persistence.spec.ts:64:3

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
  1   | import { test, expect, request as pwRequest } from "@playwright/test";
  2   | import { Client } from "pg";
  3   | import {
  4   |   forgeSession as forgeSessionShared,
  5   |   ensureTestUser,
  6   |   cleanupTestUser,
  7   |   requireEnv,
  8   | } from "./helpers/auth";
  9   | 
  10  | /**
  11  |  * Youth Mode persistence — guards the server round-trip for authenticated users
  12  |  * and the localStorage fallback for anonymous users, exercised through the real
  13  |  * Navigator UI.
  14  |  *
  15  |  * Auth is Replit OIDC, so the interactive sign-in itself isn't scriptable.
  16  |  * Signing in is simulated the same way the app experiences it: a session row in
  17  |  * the `sessions` table (the app's own store) plus a signed connect.sid cookie.
  18  |  * Everything after sign-in — toggling in the UI, the debounced PUT, sign-out via
  19  |  * the real /api/logout, and hydration on a second device — uses the real flows.
  20  |  *
  21  |  * Run: npx playwright test tests/e2e/youth-mode-persistence.spec.ts
  22  |  */
  23  | 
  24  | const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
  25  | const TEST_USER_ID = "e2e-youth-mode-test-user";
  26  | const TEST_EMAIL = "e2e-youth-mode@test.local";
  27  | 
  28  | /** Forge a session for this spec's test user via the shared helper. */
  29  | function forgeSession(db: Client): Promise<string> {
  30  |   return forgeSessionShared(db, {
  31  |     userId: TEST_USER_ID,
  32  |     email: TEST_EMAIL,
  33  |     firstName: "E2E",
  34  |     lastName: "YouthMode",
  35  |   });
  36  | }
  37  | 
  38  | async function cleanup(db: Client) {
  39  |   await db.query(`DELETE FROM learner_profiles WHERE user_id = $1`, [TEST_USER_ID]);
  40  |   await cleanupTestUser(db, TEST_USER_ID);
  41  | }
  42  | 
  43  | test.describe("Youth Mode persistence", () => {
  44  |   let db: Client;
  45  | 
  46  |   test.beforeAll(async () => {
  47  |     db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  48  |     await db.connect();
  49  |     await cleanup(db);
  50  |     // The users row the OIDC callback would normally upsert (needed by /api/auth/user)
  51  |     await ensureTestUser(db, {
  52  |       userId: TEST_USER_ID,
  53  |       email: TEST_EMAIL,
  54  |       firstName: "E2E",
  55  |       lastName: "YouthMode",
  56  |     });
  57  |   });
  58  | 
  59  |   test.afterAll(async () => {
  60  |     await cleanup(db);
  61  |     await db.end();
  62  |   });
  63  | 
  64  |   test("preference toggled in the UI survives sign-out and sign-in on a different device", async ({ browser }) => {
  65  |     // Validation runs many gates in parallel; page loads that take ~5s solo can
  66  |     // exceed the 30s global timeout under CPU contention. Headroom, not slack.
  67  |     test.setTimeout(120_000);
  68  |     // ── Device A: signed in, toggles Youth Mode on in the Navigator UI ──
  69  |     const cookieA = await forgeSession(db);
  70  |     const deviceA = await browser.newContext({ extraHTTPHeaders: { Cookie: cookieA } });
  71  |     const pageA = await deviceA.newPage();
  72  | 
> 73  |     await pageA.goto(`${BASE}/navigator`);
      |                 ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/navigator
  74  |     const toggleA = pageA.getByTestId("button-youth-mode");
  75  |     await expect(toggleA).toContainText("Youth Mode Off");
  76  | 
  77  |     // Click and wait for the debounced PUT to hit the server successfully
  78  |     const putPromise = pageA.waitForResponse(
  79  |       (res) => res.url().includes("/api/learner-profile") && res.request().method() === "PUT",
  80  |       { timeout: 10_000 }
  81  |     );
  82  |     await toggleA.click();
  83  |     await expect(toggleA).toContainText("Youth Mode On"); // instant optimistic UI
  84  |     const putRes = await putPromise;
  85  |     expect(putRes.status()).toBe(200);
  86  |     expect((await putRes.json()).youthMode).toBe(true);
  87  | 
  88  |     // ── Sign out via the real logout flow (destroys the session server-side) ──
  89  |     const logoutCtx = await pwRequest.newContext({
  90  |       baseURL: BASE,
  91  |       extraHTTPHeaders: { Cookie: cookieA },
  92  |       maxRedirects: 0, // don't follow the OIDC end-session redirect off-site
  93  |     });
  94  |     const logoutRes = await logoutCtx.get("/api/logout");
  95  |     expect(logoutRes.status()).toBe(302);
  96  |     // Session A is genuinely dead: authenticated endpoint now rejects it
  97  |     const afterLogout = await logoutCtx.get("/api/learner-profile");
  98  |     expect(afterLogout.status()).toBe(401);
  99  |     await logoutCtx.dispose();
  100 |     await deviceA.close();
  101 | 
  102 |     // ── Device B: brand-new browser context (no shared cookies/localStorage),
  103 |     //    fresh sign-in as the same user ──
  104 |     const cookieB = await forgeSession(db);
  105 |     const deviceB = await browser.newContext({ extraHTTPHeaders: { Cookie: cookieB } });
  106 |     const pageB = await deviceB.newPage();
  107 | 
  108 |     await pageB.goto(`${BASE}/navigator`);
  109 |     // The Navigator hydrates Youth Mode from the saved server profile
  110 |     const toggleB = pageB.getByTestId("button-youth-mode");
  111 |     await expect(toggleB).toContainText("Youth Mode On", { timeout: 10_000 });
  112 |     await expect(toggleB).toHaveAttribute("aria-checked", "true");
  113 |     await deviceB.close();
  114 |   });
  115 | 
  116 |   test("learner-profile endpoints reject anonymous requests", async () => {
  117 |     const anon = await pwRequest.newContext({ baseURL: BASE });
  118 |     expect((await anon.get("/api/learner-profile")).status()).toBe(401);
  119 |     expect((await anon.put("/api/learner-profile", { data: { youthMode: true } })).status()).toBe(401);
  120 |     await anon.dispose();
  121 |   });
  122 | 
  123 |   test("anonymous users: toggling in the UI persists via localStorage across reloads", async ({ browser }) => {
  124 |     test.setTimeout(120_000); // headroom for parallel-validation CPU contention
  125 |     const ctx = await browser.newContext(); // isolated storage
  126 |     const page = await ctx.newPage();
  127 | 
  128 |     await page.goto(`${BASE}/navigator`);
  129 |     const toggle = page.getByTestId("button-youth-mode");
  130 |     await expect(toggle).toContainText("Youth Mode Off"); // clean default
  131 | 
  132 |     await toggle.click();
  133 |     await expect(toggle).toContainText("Youth Mode On");
  134 |     // The interaction itself wrote the value
  135 |     expect(await page.evaluate(() => window.localStorage.getItem("tcaf_youth_mode"))).toBe("true");
  136 | 
  137 |     await page.reload();
  138 |     const reloaded = page.getByTestId("button-youth-mode");
  139 |     await expect(reloaded).toContainText("Youth Mode On");
  140 |     await expect(reloaded).toHaveAttribute("aria-checked", "true");
  141 |     await ctx.close();
  142 |   });
  143 | });
  144 | 
```