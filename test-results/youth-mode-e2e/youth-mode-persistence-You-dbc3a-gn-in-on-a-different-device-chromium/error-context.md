# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: youth-mode-persistence.spec.ts >> Youth Mode persistence >> preference toggled in the UI survives sign-out and sign-in on a different device
- Location: tests/e2e/youth-mode-persistence.spec.ts:64:3

# Error details

```
TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic "Main navigation" [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]:
            - link "ThriveUp Academy home" [ref=e8] [cursor=pointer]:
              - /url: /
              - generic [ref=e9]:
                - img "ThriveUp logo" [ref=e10]
                - generic [ref=e11]:
                  - paragraph [ref=e12]: ThriveUp
                  - paragraph [ref=e13]: a service of The Collaborative Advocate Foundation
            - button "Switch workspace" [ref=e14] [cursor=pointer]:
              - generic [ref=e15]:
                - img
                - generic [ref=e16]: Select workspace
              - img
          - generic [ref=e17]:
            - generic [ref=e21]:
              - generic [ref=e23]: EY
              - generic [ref=e24]:
                - paragraph [ref=e25]: E2E YouthMode
                - generic [ref=e26]:
                  - img [ref=e27]
                  - generic "1 day streak" [ref=e29]
            - generic [ref=e32]:
              - generic [ref=e33]: Search navigation
              - generic [ref=e34]:
                - img [ref=e35]
                - searchbox "Find a page" [ref=e38]
            - generic [ref=e41]:
              - paragraph [ref=e42]: Foundation Network
              - generic [ref=e43]:
                - link "Serve" [ref=e44] [cursor=pointer]:
                  - /url: /hub/serve
                  - img [ref=e45]
                  - text: Serve
                - link "Grow" [ref=e47] [cursor=pointer]:
                  - /url: /hub/grow
                  - img [ref=e48]
                  - text: Grow
                - link "Fund" [ref=e53] [cursor=pointer]:
                  - /url: /hub/fund
                  - img [ref=e54]
                  - text: Fund
                - link "Connect" [ref=e58] [cursor=pointer]:
                  - /url: /hub/connect
                  - img [ref=e59]
                  - text: Connect
            - list [ref=e64]:
              - listitem [ref=e66]:
                - button "Central Texas section" [ref=e67] [cursor=pointer]:
                  - img [ref=e68]
                  - generic [ref=e71]: Central Texas
                  - generic [ref=e72]: "13"
                  - img [ref=e73]
            - list [ref=e77]:
              - listitem [ref=e79]:
                - button "Get Funded section" [ref=e80] [cursor=pointer]:
                  - img [ref=e81]
                  - generic [ref=e87]: Get Funded
                  - generic [ref=e88]: "19"
                  - img [ref=e89]
            - list [ref=e93]:
              - listitem [ref=e95]:
                - button "Benefits & Intake section" [ref=e96] [cursor=pointer]:
                  - img [ref=e97]
                  - generic [ref=e102]: Benefits & Intake
                  - generic [ref=e103]: "15"
                  - img [ref=e104]
            - list [ref=e108]:
              - listitem [ref=e110]:
                - button "Foster Youth section" [ref=e111] [cursor=pointer]:
                  - img [ref=e112]
                  - generic [ref=e114]: Foster Youth
                  - generic [ref=e115]: "14"
                  - img [ref=e116]
            - list [ref=e120]:
              - listitem [ref=e122]:
                - button "Justice & Reentry section" [ref=e123] [cursor=pointer]:
                  - img [ref=e124]
                  - generic [ref=e128]: Justice & Reentry
                  - generic [ref=e129]: "11"
                  - img [ref=e130]
            - list [ref=e134]:
              - listitem [ref=e136]:
                - button "Prevention & Health section" [ref=e137] [cursor=pointer]:
                  - img [ref=e138]
                  - generic [ref=e141]: Prevention & Health
                  - generic [ref=e142]: "8"
                  - img [ref=e143]
            - list [ref=e147]:
              - listitem [ref=e149]:
                - button "Child Care & Workforce section" [ref=e150] [cursor=pointer]:
                  - img [ref=e151]
                  - generic [ref=e154]: Child Care & Workforce
                  - generic [ref=e155]: "4"
                  - img [ref=e156]
            - list [ref=e160]:
              - listitem [ref=e162]:
                - button "Rural & Agriculture section" [ref=e163] [cursor=pointer]:
                  - img [ref=e164]
                  - generic [ref=e168]: Rural & Agriculture
                  - generic [ref=e169]: "13"
                  - img [ref=e170]
            - list [ref=e174]:
              - listitem [ref=e176]:
                - button "Workforce & Trades section" [ref=e177] [cursor=pointer]:
                  - img [ref=e178]
                  - generic [ref=e181]: Workforce & Trades
                  - generic [ref=e182]: "17"
                  - img [ref=e183]
            - list [ref=e187]:
              - listitem [ref=e189]:
                - button "Academy & Learning section" [expanded] [ref=e190] [cursor=pointer]:
                  - img [ref=e191]
                  - generic [ref=e194]: Academy & Learning
                  - generic [ref=e195]: "32"
                  - img [ref=e196]
                - list [ref=e199]:
                  - listitem [ref=e200]:
                    - link "Panther Village" [ref=e201] [cursor=pointer]:
                      - /url: /academy
                      - img [ref=e202]
                      - generic [ref=e207]: Panther Village
                  - listitem [ref=e208]:
                    - link "My Avatar" [ref=e209] [cursor=pointer]:
                      - /url: /academy/avatar
                      - img [ref=e210]
                      - generic [ref=e213]: My Avatar
                  - listitem [ref=e214]:
                    - link "Panther Power" [ref=e215] [cursor=pointer]:
                      - /url: /academy/power
                      - img [ref=e216]
                      - generic [ref=e218]: Panther Power
                  - listitem [ref=e219]:
                    - link "Daily Check-In" [ref=e220] [cursor=pointer]:
                      - /url: /academy/self-assessment
                      - img [ref=e221]
                      - generic [ref=e225]: Daily Check-In
                  - listitem [ref=e226]:
                    - link "Thrive Dashboard" [ref=e227] [cursor=pointer]:
                      - /url: /academy/thrive
                      - img [ref=e228]
                      - generic [ref=e230]: Thrive Dashboard
                  - listitem [ref=e231]:
                    - link "Daily Quests" [ref=e232] [cursor=pointer]:
                      - /url: /academy/quests
                      - img [ref=e233]
                      - generic [ref=e236]: Daily Quests
                  - listitem [ref=e237]:
                    - link "My Journal" [ref=e238] [cursor=pointer]:
                      - /url: /academy/journal
                      - img [ref=e239]
                      - generic [ref=e241]: My Journal
                  - listitem [ref=e242]:
                    - link "Progress Report" [ref=e243] [cursor=pointer]:
                      - /url: /academy/progress-report
                      - img [ref=e244]
                      - generic [ref=e248]: Progress Report
                  - listitem [ref=e249]:
                    - link "STAAR Test Prep" [ref=e250] [cursor=pointer]:
                      - /url: /academy/staar-prep
                      - img [ref=e251]
                      - generic [ref=e254]: STAAR Test Prep
                  - listitem [ref=e255]:
                    - link "Concepts" [ref=e256] [cursor=pointer]:
                      - /url: /concepts
                      - img [ref=e257]
                      - generic [ref=e259]: Concepts
                  - listitem [ref=e260]:
                    - link "Subjects" [ref=e261] [cursor=pointer]:
                      - /url: /subjects
                      - img [ref=e262]
                      - generic [ref=e265]: Subjects
                  - listitem [ref=e266]:
                    - link "Achievements" [ref=e267] [cursor=pointer]:
                      - /url: /achievements
                      - img [ref=e268]
                      - generic [ref=e271]: Achievements
                  - listitem [ref=e272]:
                    - link "Certificates" [ref=e273] [cursor=pointer]:
                      - /url: /certificates
                      - img [ref=e274]
                      - generic [ref=e277]: Certificates
                  - listitem [ref=e278]:
                    - link "AI Curriculum (Youth)" [ref=e279] [cursor=pointer]:
                      - /url: /curriculum
                      - img [ref=e280]
                      - generic [ref=e290]: AI Curriculum (Youth)
                  - listitem [ref=e291]:
                    - link "Game Room" [ref=e292] [cursor=pointer]:
                      - /url: /academy/games
                      - img [ref=e293]
                      - generic [ref=e295]: Game Room
                  - listitem [ref=e296]:
                    - link "Competitions" [ref=e297] [cursor=pointer]:
                      - /url: /academy/competitions
                      - img [ref=e298]
                      - generic [ref=e304]: Competitions
                  - listitem [ref=e305]:
                    - link "House Points" [ref=e306] [cursor=pointer]:
                      - /url: /academy/houses
                      - img [ref=e307]
                      - generic [ref=e309]: House Points
                  - listitem [ref=e310]:
                    - link "Adventures" [ref=e311] [cursor=pointer]:
                      - /url: /academy/scenarios
                      - img [ref=e312]
                      - generic [ref=e314]: Adventures
                  - listitem [ref=e315]:
                    - link "Marketplace" [ref=e316] [cursor=pointer]:
                      - /url: /academy/marketplace
                      - img [ref=e317]
                      - generic [ref=e322]: Marketplace
                  - listitem [ref=e323]:
                    - link "Stock Market" [ref=e324] [cursor=pointer]:
                      - /url: /academy/stocks
                      - img [ref=e325]
                      - generic [ref=e328]: Stock Market
                  - listitem [ref=e329]:
                    - link "My Wallet" [ref=e330] [cursor=pointer]:
                      - /url: /academy/wallet
                      - img [ref=e331]
                      - generic [ref=e334]: My Wallet
                  - listitem [ref=e335]:
                    - link "Financial Literacy" [ref=e336] [cursor=pointer]:
                      - /url: /academy/financial-literacy
                      - img [ref=e337]
                      - generic [ref=e339]: Financial Literacy
                  - listitem [ref=e340]:
                    - link "FAFSA Navigator" [ref=e341] [cursor=pointer]:
                      - /url: /fafsa-navigator
                      - img [ref=e342]
                      - generic [ref=e345]: FAFSA Navigator
                  - listitem [ref=e346]:
                    - link "Calendar" [ref=e347] [cursor=pointer]:
                      - /url: /academy/calendar
                      - img [ref=e348]
                      - generic [ref=e350]: Calendar
                  - listitem [ref=e351]:
                    - link "Announcements" [ref=e352] [cursor=pointer]:
                      - /url: /academy/announcements
                      - img [ref=e353]
                      - generic [ref=e356]: Announcements
                  - listitem [ref=e357]:
                    - link "Help & FAQ" [ref=e358] [cursor=pointer]:
                      - /url: /academy/help
                      - img [ref=e359]
                      - generic [ref=e362]: Help & FAQ
                  - listitem [ref=e363]:
                    - link "Build Campus" [ref=e364] [cursor=pointer]:
                      - /url: /academy/campus
                      - img [ref=e365]
                      - generic [ref=e369]: Build Campus
                  - listitem [ref=e370]:
                    - link "Print Shop" [ref=e371] [cursor=pointer]:
                      - /url: /academy/merch
                      - img [ref=e372]
                      - generic [ref=e375]: Print Shop
                  - listitem [ref=e376]:
                    - link "AI Workforce Academy" [ref=e377] [cursor=pointer]:
                      - /url: /ai-workforce
                      - img [ref=e378]
                      - generic [ref=e381]: AI Workforce Academy
                  - listitem [ref=e382]:
                    - link "AI Creation Studio" [ref=e383] [cursor=pointer]:
                      - /url: /ai-tools
                      - img [ref=e384]
                      - generic [ref=e387]: AI Creation Studio
                  - listitem [ref=e388]:
                    - link "Sparky (AI Companion)" [ref=e389] [cursor=pointer]:
                      - /url: /sparky
                      - img [ref=e390]
                      - generic [ref=e392]: Sparky (AI Companion)
                  - listitem [ref=e393]:
                    - link "Navigator (AI)" [ref=e394] [cursor=pointer]:
                      - /url: /navigator
                      - img [ref=e395]
                      - generic [ref=e398]: Navigator (AI)
            - list [ref=e401]:
              - listitem [ref=e403]:
                - button "Partners & Coalitions section" [ref=e404] [cursor=pointer]:
                  - img [ref=e405]
                  - generic [ref=e410]: Partners & Coalitions
                  - generic [ref=e411]: "23"
                  - img [ref=e412]
            - list [ref=e416]:
              - listitem [ref=e418]:
                - button "Where We Operate section" [ref=e419] [cursor=pointer]:
                  - img [ref=e420]
                  - generic [ref=e423]: Where We Operate
                  - generic [ref=e424]: "22"
                  - img [ref=e425]
            - list [ref=e429]:
              - listitem [ref=e431]:
                - button "About & Trust section" [ref=e432] [cursor=pointer]:
                  - img [ref=e433]
                  - generic [ref=e435]: About & Trust
                  - generic [ref=e436]: "14"
                  - img [ref=e437]
            - list [ref=e441]:
              - listitem [ref=e443]:
                - button "My Organization section" [ref=e444] [cursor=pointer]:
                  - img [ref=e445]
                  - generic [ref=e449]: My Organization
                  - generic [ref=e450]: "2"
                  - img [ref=e451]
            - generic [ref=e453]:
              - generic [ref=e454]: Your Rank
              - generic [ref=e457]:
                - img [ref=e459]
                - generic [ref=e461]:
                  - paragraph [ref=e462]: Specialist
                  - paragraph [ref=e463]: Level 1
          - generic "Sidebar footer" [ref=e464]:
            - link "Sign out" [ref=e465] [cursor=pointer]:
              - /url: /api/logout
              - img
              - text: Sign Out
            - generic [ref=e466]:
              - generic [ref=e467]:
                - img [ref=e468]
                - generic [ref=e470]: ThriveUp Academy · TCAF · ALC
              - paragraph [ref=e471]: National community-infrastructure platform. Live pilot in Travis County, Texas — the template for the all-50-states + 5-territory rollout via the open Hub Adoption Kit. TCAF is an IRS-determined 501(c)(3) (Letter 947, effective January 14, 2026); SAM.gov Active (UEI KDDVD1FGLW35); CAGE 209N1.
      - generic [ref=e472]:
        - link "Skip to main content" [ref=e473] [cursor=pointer]:
          - /url: "#main-content"
        - banner [ref=e474]:
          - button "Toggle Sidebar" [ref=e475] [cursor=pointer]:
            - img
            - generic [ref=e476]: Toggle Sidebar
          - generic [ref=e478]: ThriveUp
          - generic [ref=e479]:
            - button "Search all pages" [ref=e480] [cursor=pointer]:
              - img
              - generic [ref=e481]: Search
              - generic [ref=e482]: ⌘K
            - button "Accessibility settings" [ref=e483] [cursor=pointer]:
              - img
            - generic [ref=e484]:
              - 'button "Current language: English. Click to change." [ref=e485] [cursor=pointer]':
                - img
                - generic [ref=e486]: 🇺🇸
                - generic [ref=e487]: en
              - button "Enable low-bandwidth mode" [ref=e488] [cursor=pointer]:
                - img
              - button "Switch to dark mode" [ref=e489] [cursor=pointer]:
                - img
        - main [ref=e490]:
          - generic [ref=e492]:
            - generic [ref=e493]:
              - paragraph [ref=e495]: Conversation History
              - generic [ref=e500]:
                - img [ref=e501]
                - paragraph [ref=e505]: No conversations yet
                - paragraph [ref=e506]: Start chatting below
              - button "New Conversation" [ref=e508] [cursor=pointer]:
                - img
                - text: New Conversation
            - generic [ref=e509]:
              - generic [ref=e510]:
                - generic [ref=e511]:
                  - img [ref=e512]
                  - generic [ref=e515]:
                    - heading "ThriveUp Navigator" [level=1] [ref=e516]
                    - paragraph [ref=e517]: 4-engine parallel analysis · DeepSeek R1 deep thinking
                - button "New" [ref=e519] [cursor=pointer]:
                  - img [ref=e520]
                  - generic [ref=e522]: New
              - log "Navigator conversation" [ref=e526]:
                - generic [ref=e527]:
                  - generic [ref=e528]:
                    - img [ref=e530]
                    - heading "Hi, I'm the Navigator" [level=2] [ref=e533]
                    - paragraph [ref=e534]: Here to help you find resources, connect with services, and think through your next steps — whatever the challenge.
                  - generic [ref=e536]:
                    - img [ref=e537]
                    - generic [ref=e539]:
                      - paragraph [ref=e540]: "If you're in crisis:"
                      - paragraph [ref=e541]:
                        - strong [ref=e542]: "988"
                        - text: Suicide & Crisis Lifeline ·
                        - strong [ref=e543]: "911"
                        - text: for emergencies · Text
                        - strong [ref=e544]: HOME
                        - text: to
                        - strong [ref=e545]: "741741"
                  - generic [ref=e546]:
                    - button "🏠 I need housing help" [ref=e547] [cursor=pointer]:
                      - generic [ref=e548]: 🏠
                      - generic [ref=e549]: I need housing help
                    - button "💼 Help me find a job" [ref=e550] [cursor=pointer]:
                      - generic [ref=e551]: 💼
                      - generic [ref=e552]: Help me find a job
                    - button "🍎 I need food assistance" [ref=e553] [cursor=pointer]:
                      - generic [ref=e554]: 🍎
                      - generic [ref=e555]: I need food assistance
                    - button "🏥 Healthcare resources" [ref=e556] [cursor=pointer]:
                      - generic [ref=e557]: 🏥
                      - generic [ref=e558]: Healthcare resources
                    - button "⚖️ Legal help" [ref=e559] [cursor=pointer]:
                      - generic [ref=e560]: ⚖️
                      - generic [ref=e561]: Legal help
                    - button "🎓 Education programs" [ref=e562] [cursor=pointer]:
                      - generic [ref=e563]: 🎓
                      - generic [ref=e564]: Education programs
                  - generic [ref=e565]:
                    - paragraph [ref=e566]: Platform actions
                    - generic [ref=e567]:
                      - button "🧾 Benefits check" [ref=e568] [cursor=pointer]:
                        - generic [ref=e569]: 🧾
                        - generic [ref=e570]: Benefits check
                      - button "💰 Find grants" [ref=e571] [cursor=pointer]:
                        - generic [ref=e572]: 💰
                        - generic [ref=e573]: Find grants
                      - button "🔧 Trade Sims" [ref=e574] [cursor=pointer]:
                        - generic [ref=e575]: 🔧
                        - generic [ref=e576]: Trade Sims
                      - button "🎓 Workforce Pell" [ref=e577] [cursor=pointer]:
                        - generic [ref=e578]: 🎓
                        - generic [ref=e579]: Workforce Pell
                      - button "🎖️ MOS Translator" [ref=e580] [cursor=pointer]:
                        - generic [ref=e581]: 🎖️
                        - generic [ref=e582]: MOS Translator
                      - button "🗺️ Career path" [ref=e583] [cursor=pointer]:
                        - generic [ref=e584]: 🗺️
                        - generic [ref=e585]: Career path
                      - button "📋 WIOA + Pell" [ref=e586] [cursor=pointer]:
                        - generic [ref=e587]: 📋
                        - generic [ref=e588]: WIOA + Pell
                      - button "🏠 Housing + food" [ref=e589] [cursor=pointer]:
                        - generic [ref=e590]: 🏠
                        - generic [ref=e591]: Housing + food
                      - button "❤️ Health resources" [ref=e592] [cursor=pointer]:
                        - generic [ref=e593]: ❤️
                        - generic [ref=e594]: Health resources
                      - button "🔓 Reentry support" [ref=e595] [cursor=pointer]:
                        - generic [ref=e596]: 🔓
                        - generic [ref=e597]: Reentry support
                      - button "🇺🇸 Veteran services" [ref=e598] [cursor=pointer]:
                        - generic [ref=e599]: 🇺🇸
                        - generic [ref=e600]: Veteran services
                      - button "📊 Equity Dashboard" [ref=e601] [cursor=pointer]:
                        - generic [ref=e602]: 📊
                        - generic [ref=e603]: Equity Dashboard
                      - button "📍 Resources near me" [ref=e604] [cursor=pointer]:
                        - generic [ref=e605]: 📍
                        - generic [ref=e606]: Resources near me
                      - button "🏆 My progress" [ref=e607] [cursor=pointer]:
                        - generic [ref=e608]: 🏆
                        - generic [ref=e609]: My progress
              - generic [ref=e611]:
                - generic [ref=e612]:
                  - generic [ref=e613]: "Response depth:"
                  - button "Quick" [ref=e614] [cursor=pointer]
                  - button "Detailed" [ref=e615] [cursor=pointer]
                  - button "Full Report" [ref=e616] [cursor=pointer]
                  - switch "Youth Mode Off" [active] [ref=e618] [cursor=pointer]
                - generic [ref=e619]:
                  - button "Attach PDF, .txt, or .md — click multiple times to add more" [ref=e620] [cursor=pointer]:
                    - img [ref=e621]
                  - textbox "Message to the Navigator assistant" [ref=e623]:
                    - /placeholder: Ask anything — paste a URL, upload a doc, or type your question... (Ctrl+Enter to send)
                  - button "Send message" [disabled]:
                    - img
                - paragraph [ref=e624]: Attach PDFs · .txt · .md · Paste any URL to fetch content · Ctrl+Enter to send · Not a substitute for professional advice
    - navigation [ref=e625]:
      - link "Home" [ref=e626] [cursor=pointer]:
        - /url: /hub
        - img [ref=e628]
        - generic [ref=e631]: Home
      - link "Serve" [ref=e632] [cursor=pointer]:
        - /url: /hub/serve
        - img [ref=e634]
        - generic [ref=e636]: Serve
      - link "Fund" [ref=e637] [cursor=pointer]:
        - /url: /hub/fund
        - img [ref=e639]
        - generic [ref=e643]: Fund
      - link "Grow" [ref=e644] [cursor=pointer]:
        - /url: /hub/grow
        - img [ref=e646]
        - generic [ref=e651]: Grow
      - link "Connect" [ref=e652] [cursor=pointer]:
        - /url: /hub/connect
        - img [ref=e654]
        - generic [ref=e659]: Connect
    - button "Open AI Navigator" [ref=e660] [cursor=pointer]:
      - img [ref=e661]
      - generic [ref=e664]: Navigator
  - region "Notifications (F8)":
    - list
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
  73  |     await pageA.goto(`${BASE}/navigator`);
  74  |     const toggleA = pageA.getByTestId("button-youth-mode");
  75  |     await expect(toggleA).toContainText("Youth Mode Off");
  76  | 
  77  |     // Click and wait for the debounced PUT to hit the server successfully
> 78  |     const putPromise = pageA.waitForResponse(
      |                              ^ TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
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