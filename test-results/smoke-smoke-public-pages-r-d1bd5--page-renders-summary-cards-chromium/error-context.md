# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> smoke: public pages render >> prior-award research page renders summary cards
- Location: tests/e2e/smoke.spec.ts:9:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('page-grant-prior-awards')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('page-grant-prior-awards')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic "Main navigation" [ref=e6]:
        - generic [ref=e7]:
          - link "ThriveUp Academy home" [ref=e9] [cursor=pointer]:
            - /url: /
            - generic [ref=e10]:
              - img "ThriveUp logo" [ref=e11]
              - generic [ref=e12]:
                - paragraph [ref=e13]: ThriveUp
                - paragraph [ref=e14]: a service of The Collaborative Advocate Foundation
          - generic [ref=e15]:
            - generic [ref=e18]:
              - generic [ref=e19]: Search navigation
              - generic [ref=e20]:
                - img [ref=e21]
                - searchbox "Find a page" [ref=e24]
            - generic [ref=e27]:
              - paragraph [ref=e28]: Foundation Network
              - generic [ref=e29]:
                - link "Serve" [ref=e30] [cursor=pointer]:
                  - /url: /hub/serve
                  - img [ref=e31]
                  - text: Serve
                - link "Grow" [ref=e33] [cursor=pointer]:
                  - /url: /hub/grow
                  - img [ref=e34]
                  - text: Grow
                - link "Fund" [ref=e39] [cursor=pointer]:
                  - /url: /hub/fund
                  - img [ref=e40]
                  - text: Fund
                - link "Connect" [ref=e44] [cursor=pointer]:
                  - /url: /hub/connect
                  - img [ref=e45]
                  - text: Connect
            - list [ref=e50]:
              - listitem [ref=e52]:
                - button "Central Texas section" [ref=e53] [cursor=pointer]:
                  - img [ref=e54]
                  - generic [ref=e57]: Central Texas
                  - generic [ref=e58]: "11"
                  - img [ref=e59]
            - list [ref=e63]:
              - listitem [ref=e65]:
                - button "Get Funded section" [ref=e66] [cursor=pointer]:
                  - img [ref=e67]
                  - generic [ref=e73]: Get Funded
                  - generic [ref=e74]: "4"
                  - img [ref=e75]
            - list [ref=e79]:
              - listitem [ref=e81]:
                - button "Benefits & Intake section" [ref=e82] [cursor=pointer]:
                  - img [ref=e83]
                  - generic [ref=e88]: Benefits & Intake
                  - generic [ref=e89]: "6"
                  - img [ref=e90]
            - list [ref=e94]:
              - listitem [ref=e96]:
                - button "Foster Youth section" [ref=e97] [cursor=pointer]:
                  - img [ref=e98]
                  - generic [ref=e100]: Foster Youth
                  - generic [ref=e101]: "10"
                  - img [ref=e102]
            - list [ref=e106]:
              - listitem [ref=e108]:
                - button "Justice & Reentry section" [ref=e109] [cursor=pointer]:
                  - img [ref=e110]
                  - generic [ref=e114]: Justice & Reentry
                  - generic [ref=e115]: "3"
                  - img [ref=e116]
            - list [ref=e120]:
              - listitem [ref=e122]:
                - button "Prevention & Health section" [ref=e123] [cursor=pointer]:
                  - img [ref=e124]
                  - generic [ref=e127]: Prevention & Health
                  - generic [ref=e128]: "5"
                  - img [ref=e129]
            - list [ref=e133]:
              - listitem [ref=e135]:
                - button "Child Care & Workforce section" [ref=e136] [cursor=pointer]:
                  - img [ref=e137]
                  - generic [ref=e140]: Child Care & Workforce
                  - generic [ref=e141]: "4"
                  - img [ref=e142]
            - list [ref=e146]:
              - listitem [ref=e148]:
                - button "Rural & Agriculture section" [ref=e149] [cursor=pointer]:
                  - img [ref=e150]
                  - generic [ref=e154]: Rural & Agriculture
                  - generic [ref=e155]: "13"
                  - img [ref=e156]
            - list [ref=e160]:
              - listitem [ref=e162]:
                - button "Workforce & Trades section" [ref=e163] [cursor=pointer]:
                  - img [ref=e164]
                  - generic [ref=e167]: Workforce & Trades
                  - generic [ref=e168]: "13"
                  - img [ref=e169]
            - list [ref=e173]:
              - listitem [ref=e175]:
                - button "Academy & Learning section" [ref=e176] [cursor=pointer]:
                  - img [ref=e177]
                  - generic [ref=e180]: Academy & Learning
                  - generic [ref=e181]: "19"
                  - img [ref=e182]
            - list [ref=e186]:
              - listitem [ref=e188]:
                - button "Partners & Coalitions section" [ref=e189] [cursor=pointer]:
                  - img [ref=e190]
                  - generic [ref=e195]: Partners & Coalitions
                  - generic [ref=e196]: "16"
                  - img [ref=e197]
            - list [ref=e201]:
              - listitem [ref=e203]:
                - button "Where We Operate section" [ref=e204] [cursor=pointer]:
                  - img [ref=e205]
                  - generic [ref=e208]: Where We Operate
                  - generic [ref=e209]: "12"
                  - img [ref=e210]
            - list [ref=e214]:
              - listitem [ref=e216]:
                - button "About & Trust section" [ref=e217] [cursor=pointer]:
                  - img [ref=e218]
                  - generic [ref=e220]: About & Trust
                  - generic [ref=e221]: "14"
                  - img [ref=e222]
          - generic "Sidebar footer" [ref=e224]:
            - generic [ref=e225]:
              - link "Sign in" [ref=e226] [cursor=pointer]:
                - /url: /api/login
                - button "Sign In" [ref=e227]:
                  - img
                  - text: Sign In
              - paragraph [ref=e228]: Sign in to autosave your work across devices
            - generic [ref=e229]:
              - generic [ref=e230]:
                - img [ref=e231]
                - generic [ref=e233]: ThriveUp Academy · TCAF · ALC
              - paragraph [ref=e234]: National community-infrastructure platform. Live pilot in Travis County, Texas — the template for the all-50-states + 5-territory rollout via the open Hub Adoption Kit. TCAF is an IRS-determined 501(c)(3) (Letter 947, effective January 14, 2026); SAM.gov Active (UEI KDDVD1FGLW35); CAGE 209N1.
      - generic [ref=e235]:
        - link "Skip to main content" [ref=e236] [cursor=pointer]:
          - /url: "#main-content"
        - banner [ref=e237]:
          - button "Toggle Sidebar" [ref=e238] [cursor=pointer]:
            - img
            - generic [ref=e239]: Toggle Sidebar
          - generic [ref=e240]:
            - button "☰ Classic" [ref=e241] [cursor=pointer]
            - button "Accessibility settings" [ref=e242] [cursor=pointer]:
              - img
            - generic [ref=e243]:
              - 'button "Current language: English. Click to change." [ref=e244] [cursor=pointer]':
                - img
                - generic [ref=e245]: 🇺🇸
                - generic [ref=e246]: en
              - button "Enable low-bandwidth mode" [ref=e247] [cursor=pointer]:
                - img
              - button "Switch to dark mode" [ref=e248] [cursor=pointer]:
                - img
        - main [ref=e249]:
          - generic [ref=e252]:
            - img [ref=e254]
            - heading "Internal Workspace" [level=1] [ref=e257]
            - paragraph [ref=e258]: Prior awards library is restricted to TCAF admins.
            - generic [ref=e259]:
              - link "Sign in" [ref=e260] [cursor=pointer]:
                - /url: /api/login?returnTo=%2Fgrant-prior-awards
                - img
                - text: Sign in
              - link "Return to public site" [ref=e261] [cursor=pointer]:
                - /url: /
            - paragraph [ref=e262]:
              - text: Are you a partner or funder needing access? Email
              - link "president@thecollaborativeadvocate.org" [ref=e263] [cursor=pointer]:
                - /url: mailto:president@thecollaborativeadvocate.org
              - text: .
    - navigation [ref=e264]:
      - link "Home" [ref=e265] [cursor=pointer]:
        - /url: /hub
        - img [ref=e267]
        - generic [ref=e270]: Home
      - link "Serve" [ref=e271] [cursor=pointer]:
        - /url: /hub/serve
        - img [ref=e273]
        - generic [ref=e275]: Serve
      - link "Fund" [ref=e276] [cursor=pointer]:
        - /url: /hub/fund
        - img [ref=e278]
        - generic [ref=e282]: Fund
      - link "Grow" [ref=e283] [cursor=pointer]:
        - /url: /hub/grow
        - img [ref=e285]
        - generic [ref=e290]: Grow
      - link "Connect" [ref=e291] [cursor=pointer]:
        - /url: /hub/connect
        - img [ref=e293]
        - generic [ref=e298]: Connect
    - button "Open AI Navigator" [ref=e299] [cursor=pointer]:
      - img [ref=e300]
      - generic [ref=e303]: Navigator
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("smoke: public pages render", () => {
  4  |   test("landing page", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/.+/);
  7  |   });
  8  | 
  9  |   test("prior-award research page renders summary cards", async ({ page }) => {
  10 |     await page.goto("/grant-prior-awards");
> 11 |     await expect(page.getByTestId("page-grant-prior-awards")).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  12 |     await expect(page.getByTestId("text-page-title")).toContainText("Prior Award Research");
  13 |     await expect(page.getByTestId("text-stat-total")).toBeVisible();
  14 |     await expect(page.getByTestId("text-stat-percent")).toBeVisible();
  15 |     await expect(page.getByTestId("card-methodology")).toBeVisible();
  16 |     await expect(page.getByTestId("card-sources")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("ecosystem orchestration page renders 24 platforms + 7 triads", async ({ page }) => {
  20 |     await page.goto("/ecosystem-orchestration");
  21 |     await expect(page.getByTestId("page-ecosystem-orchestration")).toBeVisible();
  22 |     await expect(page.getByTestId("text-stat-platforms")).toContainText("24");
  23 |     await expect(page.getByTestId("text-stat-triads")).toContainText("7");
  24 |     await page.getByTestId("tab-triads").click();
  25 |     await expect(page.getByTestId("card-triad-health-core-triad")).toBeVisible();
  26 |   });
  27 | 
  28 |   test("ecosystem orchestration: search filter narrows results", async ({ page }) => {
  29 |     await page.goto("/ecosystem-orchestration");
  30 |     await page.getByTestId("input-search").fill("sankofa");
  31 |     await expect(page.getByTestId("card-platform-sankofa")).toBeVisible();
  32 |     await expect(page.getByTestId("card-platform-whole-person-health")).not.toBeVisible();
  33 |   });
  34 | 
  35 |   test("academy village page still loads after folder reorg", async ({ page }) => {
  36 |     await page.goto("/academy");
  37 |     await expect(page.getByTestId("academy-village-page")).toBeVisible();
  38 |   });
  39 | });
  40 | 
  41 | test.describe("smoke: API endpoints respond", () => {
  42 |   test("GET /api/proposal-pipeline/prior-awards/summary returns 200", async ({ request }) => {
  43 |     const res = await request.get("/api/proposal-pipeline/prior-awards/summary");
  44 |     expect(res.status()).toBe(200);
  45 |     const body = await res.json();
  46 |     expect(body).toHaveProperty("proposals");
  47 |     expect(body).toHaveProperty("summary.total");
  48 |   });
  49 | 
  50 |   test("GET /api/ecosystem/registry returns 24 platforms + 7 triads", async ({ request }) => {
  51 |     const res = await request.get("/api/ecosystem/registry");
  52 |     expect(res.status()).toBe(200);
  53 |     const body = await res.json();
  54 |     expect(body.platformCount).toBe(24);
  55 |     expect(body.triadCount).toBe(7);
  56 |   });
  57 | 
  58 |   test("PATCH prior-awards without auth returns 401", async ({ request }) => {
  59 |     const res = await request.patch("/api/proposal-pipeline/nsf-stem-k12/prior-awards", {
  60 |       data: { priorAwardsReviewed: true, priorAwardsCount: 5 },
  61 |     });
  62 |     expect(res.status()).toBe(401);
  63 |   });
  64 | 
  65 |   test("PATCH prior-awards rejects invalid URL with 401 (auth check first) or 400", async ({ request }) => {
  66 |     const res = await request.patch("/api/proposal-pipeline/nsf-stem-k12/prior-awards", {
  67 |       data: {
  68 |         priorAwardsReviewed: true,
  69 |         priorAwardsCount: 1,
  70 |         priorAwardsLinks: [{ title: "x", url: "not-a-url" }],
  71 |       },
  72 |     });
  73 |     expect([400, 401]).toContain(res.status());
  74 |   });
  75 | });
  76 | 
```