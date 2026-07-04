# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: foster-youth-journey.spec.ts >> Foster Youth Aging Out — congruence walkthrough >> AI-assisted Intake wizard renders step 1 with honest disclosure + can advance
- Location: tests/e2e/foster-youth-journey.spec.ts:87:3

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByTestId('button-next-step-2')
Expected: enabled
Received: disabled
Timeout:  5000ms

Call log:
  - Expect "toBeEnabled" with timeout 5000ms
  - waiting for getByTestId('button-next-step-2')
    9 × locator resolved to <button disabled data-component-name="Button" data-testid="button-next-step-2" data-replit-metadata="client/src/pages/foster-youth/intake.tsx:333:16" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border …>…</button>
      - unexpected value "disabled"

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
                - button "Foster Youth section" [expanded] [ref=e97] [cursor=pointer]:
                  - img [ref=e98]
                  - generic [ref=e100]: Foster Youth
                  - generic [ref=e101]: "10"
                  - img [ref=e102]
                - list [ref=e105]:
                  - listitem [ref=e106]:
                    - link "Foster Youth Hub" [ref=e107] [cursor=pointer]:
                      - /url: /foster-youth
                      - img [ref=e108]
                      - generic [ref=e113]: Foster Youth Hub
                  - listitem [ref=e114]:
                    - link "Aging-Out Toolkit" [ref=e115] [cursor=pointer]:
                      - /url: /foster-youth/toolkit
                      - img [ref=e116]
                      - generic [ref=e120]: Aging-Out Toolkit
                  - listitem [ref=e121]:
                    - link "Foster Transition Plan" [ref=e122] [cursor=pointer]:
                      - /url: /foster-youth/transition-plan
                      - img [ref=e123]
                      - generic [ref=e127]: Foster Transition Plan
                  - listitem [ref=e128]:
                    - link "Wellbeing Check-in" [ref=e129] [cursor=pointer]:
                      - /url: /foster-youth/wellbeing
                      - img [ref=e130]
                      - generic [ref=e132]: Wellbeing Check-in
                  - listitem [ref=e133]:
                    - link "My Rights (Foster)" [ref=e134] [cursor=pointer]:
                      - /url: /foster-youth/rights
                      - img [ref=e135]
                      - generic [ref=e139]: My Rights (Foster)
                  - listitem [ref=e140]:
                    - link "State Benefits (50 states)" [ref=e141] [cursor=pointer]:
                      - /url: /foster-youth/benefits
                      - img [ref=e142]
                      - generic [ref=e144]: State Benefits (50 states)
                  - listitem [ref=e145]:
                    - link "FAFSA & ETV (foster)" [ref=e146] [cursor=pointer]:
                      - /url: /fafsa-navigator?audience=foster
                      - img [ref=e147]
                      - generic [ref=e150]: FAFSA & ETV (foster)
                  - listitem [ref=e151]:
                    - link "AI-assisted Intake (Foster)" [ref=e152] [cursor=pointer]:
                      - /url: /foster-youth/intake
                      - img [ref=e153]
                      - generic [ref=e155]: AI-assisted Intake (Foster)
                  - listitem [ref=e156]:
                    - link "State-Agency Portal" [ref=e157] [cursor=pointer]:
                      - /url: /foster-youth/state-portal
                      - img [ref=e158]
                      - generic [ref=e162]: State-Agency Portal
                  - listitem [ref=e163]:
                    - link "Policy Comparison (50 states)" [ref=e164] [cursor=pointer]:
                      - /url: /foster-youth/policy-comparison
                      - img [ref=e165]
                      - generic [ref=e169]: Policy Comparison (50 states)
            - list [ref=e172]:
              - listitem [ref=e174]:
                - button "Justice & Reentry section" [ref=e175] [cursor=pointer]:
                  - img [ref=e176]
                  - generic [ref=e180]: Justice & Reentry
                  - generic [ref=e181]: "3"
                  - img [ref=e182]
            - list [ref=e186]:
              - listitem [ref=e188]:
                - button "Prevention & Health section" [ref=e189] [cursor=pointer]:
                  - img [ref=e190]
                  - generic [ref=e193]: Prevention & Health
                  - generic [ref=e194]: "5"
                  - img [ref=e195]
            - list [ref=e199]:
              - listitem [ref=e201]:
                - button "Child Care & Workforce section" [ref=e202] [cursor=pointer]:
                  - img [ref=e203]
                  - generic [ref=e206]: Child Care & Workforce
                  - generic [ref=e207]: "4"
                  - img [ref=e208]
            - list [ref=e212]:
              - listitem [ref=e214]:
                - button "Rural & Agriculture section" [ref=e215] [cursor=pointer]:
                  - img [ref=e216]
                  - generic [ref=e220]: Rural & Agriculture
                  - generic [ref=e221]: "13"
                  - img [ref=e222]
            - list [ref=e226]:
              - listitem [ref=e228]:
                - button "Workforce & Trades section" [ref=e229] [cursor=pointer]:
                  - img [ref=e230]
                  - generic [ref=e233]: Workforce & Trades
                  - generic [ref=e234]: "13"
                  - img [ref=e235]
            - list [ref=e239]:
              - listitem [ref=e241]:
                - button "Academy & Learning section" [ref=e242] [cursor=pointer]:
                  - img [ref=e243]
                  - generic [ref=e246]: Academy & Learning
                  - generic [ref=e247]: "19"
                  - img [ref=e248]
            - list [ref=e252]:
              - listitem [ref=e254]:
                - button "Partners & Coalitions section" [ref=e255] [cursor=pointer]:
                  - img [ref=e256]
                  - generic [ref=e261]: Partners & Coalitions
                  - generic [ref=e262]: "16"
                  - img [ref=e263]
            - list [ref=e267]:
              - listitem [ref=e269]:
                - button "Where We Operate section" [ref=e270] [cursor=pointer]:
                  - img [ref=e271]
                  - generic [ref=e274]: Where We Operate
                  - generic [ref=e275]: "12"
                  - img [ref=e276]
            - list [ref=e280]:
              - listitem [ref=e282]:
                - button "About & Trust section" [ref=e283] [cursor=pointer]:
                  - img [ref=e284]
                  - generic [ref=e286]: About & Trust
                  - generic [ref=e287]: "14"
                  - img [ref=e288]
          - generic "Sidebar footer" [ref=e290]:
            - generic [ref=e291]:
              - link "Sign in" [ref=e292] [cursor=pointer]:
                - /url: /api/login
                - button "Sign In" [ref=e293]:
                  - img
                  - text: Sign In
              - paragraph [ref=e294]: Sign in to autosave your work across devices
            - generic [ref=e295]:
              - generic [ref=e296]:
                - img [ref=e297]
                - generic [ref=e299]: ThriveUp Academy · TCAF · ALC
              - paragraph [ref=e300]: National community-infrastructure platform. Live pilot in Travis County, Texas — the template for the all-50-states + 5-territory rollout via the open Hub Adoption Kit. TCAF is an IRS-determined 501(c)(3) (Letter 947, effective January 14, 2026); SAM.gov Active (UEI KDDVD1FGLW35); CAGE 209N1.
      - generic [ref=e301]:
        - link "Skip to main content" [ref=e302] [cursor=pointer]:
          - /url: "#main-content"
        - banner [ref=e303]:
          - button "Toggle Sidebar" [ref=e304] [cursor=pointer]:
            - img
            - generic [ref=e305]: Toggle Sidebar
          - generic [ref=e306]:
            - button "☰ Classic" [ref=e307] [cursor=pointer]
            - button "Accessibility settings" [ref=e308] [cursor=pointer]:
              - img
            - generic [ref=e309]:
              - 'button "Current language: English. Click to change." [ref=e310] [cursor=pointer]':
                - img
                - generic [ref=e311]: 🇺🇸
                - generic [ref=e312]: en
              - button "Enable low-bandwidth mode" [ref=e313] [cursor=pointer]:
                - img
              - button "Switch to dark mode" [ref=e314] [cursor=pointer]:
                - img
        - main [ref=e315]:
          - generic [ref=e316]:
            - generic [ref=e318]:
              - generic [ref=e319]: In crisis right now?
              - link "988 — Suicide & Crisis Lifeline" [ref=e320] [cursor=pointer]:
                - /url: tel:988
                - img [ref=e321]
                - text: 988 — Suicide & Crisis Lifeline
              - link "Text HOME to 741741" [ref=e323] [cursor=pointer]:
                - /url: sms:741741?body=HOME
              - link "1-800-RUNAWAY" [ref=e324] [cursor=pointer]:
                - /url: tel:18007865437
            - generic [ref=e325]:
              - generic [ref=e326]:
                - generic [ref=e327]:
                  - generic [ref=e328]:
                    - img [ref=e329]
                    - text: Are you already holding a foster youth's life together?
                  - generic [ref=e334]: Kinship caregivers, former foster youth mentoring younger kids, ILP graduates supporting peers, faith-community aunties and uncles — you're inside this system. No license check. No proof asked. You decide what we do with what you share.
                - generic [ref=e336]:
                  - button "Yes, I do this work" [ref=e337] [cursor=pointer]:
                    - img
                    - text: Yes, I do this work
                  - paragraph [ref=e338]: No account. No license. Your call what we do with what you share.
              - link "Back to Foster Youth Hub" [ref=e339] [cursor=pointer]:
                - /url: /foster-youth
                - button "Back to Foster Youth Hub" [ref=e340]:
                  - img
                  - text: Back to Foster Youth Hub
              - generic [ref=e341]:
                - img [ref=e343]
                - generic [ref=e345]:
                  - generic [ref=e346]: AI-assisted intake
                  - heading "Tell us about you in 4 steps." [level=1] [ref=e347]
                  - paragraph [ref=e348]: Cuéntanos sobre ti en 4 pasos.
              - alert [ref=e349]:
                - heading "Honest about what this is." [level=5] [ref=e350]
                - generic [ref=e351]:
                  - text: This is a working tool. It saves what you enter, lets you upload documents (court paperwork, IDs, school records), and runs an AI to suggest the federal and state programs you likely qualify for and your immediate next steps.
                  - strong [ref=e352]: It is not legal advice and does not replace your caseworker.
                  - text: No login required. You control your information.
              - generic [ref=e358]:
                - generic [ref=e359]:
                  - generic [ref=e360]: Step 1 of 4 — Basics
                  - generic [ref=e361]: Only the things we actually use. You can skip anything.
                - generic [ref=e362]:
                  - generic [ref=e363]:
                    - generic [ref=e364]:
                      - text: First name (optional)
                      - textbox "First name (optional)" [ref=e365]: Marcus
                    - generic [ref=e366]:
                      - text: Preferred name (optional)
                      - textbox "Preferred name (optional)" [ref=e367]
                    - generic [ref=e368]:
                      - text: Pronouns (optional)
                      - textbox "Pronouns (optional)" [ref=e369]:
                        - /placeholder: they/them, she/her, he/him...
                    - generic [ref=e370]:
                      - text: Age
                      - spinbutton "Age" [ref=e371]: "18"
                    - generic [ref=e372]:
                      - text: Age-out / discharge date (if known)
                      - textbox "Age-out / discharge date (if known)" [active] [ref=e373]: 2026-08-01
                    - generic [ref=e374]:
                      - text: State
                      - combobox [ref=e375] [cursor=pointer]:
                        - generic: Texas
                        - img [ref=e376]
                  - generic [ref=e378]:
                    - text: In your own words, what's going on right now?
                    - textbox "In your own words, what's going on right now?" [ref=e379]:
                      - /placeholder: Where are you living? Are you in school or working? What's the most urgent thing?
                  - generic [ref=e380]:
                    - generic [ref=e381]: What do you need help with first? (check all that apply)
                    - generic [ref=e382]:
                      - generic [ref=e383] [cursor=pointer]:
                        - checkbox "Place to sleep tonight" [ref=e384]
                        - generic [ref=e385]: Place to sleep tonight
                      - generic [ref=e386] [cursor=pointer]:
                        - checkbox "Food today" [ref=e387]
                        - generic [ref=e388]: Food today
                      - generic [ref=e389] [cursor=pointer]:
                        - checkbox "State ID / driver's license" [ref=e390]
                        - generic [ref=e391]: State ID / driver's license
                      - generic [ref=e392] [cursor=pointer]:
                        - checkbox "Health insurance / Medicaid" [ref=e393]
                        - generic [ref=e394]: Health insurance / Medicaid
                      - generic [ref=e395] [cursor=pointer]:
                        - checkbox "Income / cash assistance" [ref=e396]
                        - generic [ref=e397]: Income / cash assistance
                      - generic [ref=e398] [cursor=pointer]:
                        - checkbox "School enrollment / FAFSA" [ref=e399]
                        - generic [ref=e400]: School enrollment / FAFSA
                      - generic [ref=e401] [cursor=pointer]:
                        - checkbox "Job / training" [ref=e402]
                        - generic [ref=e403]: Job / training
                      - generic [ref=e404] [cursor=pointer]:
                        - checkbox "Mental health support" [ref=e405]
                        - generic [ref=e406]: Mental health support
                      - generic [ref=e407] [cursor=pointer]:
                        - checkbox "Transportation" [ref=e408]
                        - generic [ref=e409]: Transportation
                      - generic [ref=e410] [cursor=pointer]:
                        - checkbox "Legal help" [ref=e411]
                        - generic [ref=e412]: Legal help
                  - generic [ref=e413]:
                    - button "Save & continue" [disabled]:
                      - text: Save & continue
                      - img
    - navigation [ref=e414]:
      - link "Home" [ref=e415] [cursor=pointer]:
        - /url: /hub
        - img [ref=e417]
        - generic [ref=e420]: Home
      - link "Serve" [ref=e421] [cursor=pointer]:
        - /url: /hub/serve
        - img [ref=e423]
        - generic [ref=e425]: Serve
      - link "Fund" [ref=e426] [cursor=pointer]:
        - /url: /hub/fund
        - img [ref=e428]
        - generic [ref=e432]: Fund
      - link "Grow" [ref=e433] [cursor=pointer]:
        - /url: /hub/grow
        - img [ref=e435]
        - generic [ref=e440]: Grow
      - link "Connect" [ref=e441] [cursor=pointer]:
        - /url: /hub/connect
        - img [ref=e443]
        - generic [ref=e448]: Connect
    - button "Open AI Navigator" [ref=e449] [cursor=pointer]:
      - img [ref=e450]
      - generic [ref=e453]: Navigator
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Foster Youth Aging Out — end-to-end congruence test.
  5   |  * Walks the entire journey Jim Currier would walk on demo day.
  6   |  * Asserts the test IDs in the CONGRUENCE-MANIFEST.json are present and interactive.
  7   |  *
  8   |  * Run: npx playwright test tests/e2e/foster-youth-journey.spec.ts
  9   |  */
  10  | 
  11  | const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
  12  | 
  13  | test.describe("Foster Youth Aging Out — congruence walkthrough", () => {
  14  |   test("Hub renders with Marcus, six tools, evidence stats, honest disclosure", async ({ page }) => {
  15  |     await page.goto(`${BASE}/foster-youth`);
  16  |     await expect(page.getByTestId("page-foster-youth-hub")).toBeVisible();
  17  |     await expect(page.getByTestId("banner-crisis")).toBeVisible();
  18  |     await expect(page.getByTestId("link-crisis-988")).toBeVisible();
  19  |     await expect(page.getByTestId("text-marcus-title")).toContainText(/Marcus/i);
  20  |     await expect(page.getByTestId("tile-toolkit")).toBeVisible();
  21  |     await expect(page.getByTestId("tile-transition-plan")).toBeVisible();
  22  |     await expect(page.getByTestId("tile-wellbeing")).toBeVisible();
  23  |     await expect(page.getByTestId("tile-rights")).toBeVisible();
  24  |     await expect(page.getByTestId("tile-benefits")).toBeVisible();
  25  |     await expect(page.getByTestId("tile-fafsa")).toBeVisible();
  26  |     await expect(page.getByTestId("alert-honest-disclosure")).toBeVisible();
  27  |     await expect(page.getByTestId("stat-evidence-0")).toBeVisible();
  28  |   });
  29  | 
  30  |   test("Toolkit categorized checklist saves to localStorage", async ({ page }) => {
  31  |     await page.goto(`${BASE}/foster-youth/toolkit`);
  32  |     await expect(page.getByTestId("page-foster-youth-toolkit")).toBeVisible();
  33  |     await expect(page.getByTestId("section-cat-identity-documents")).toBeVisible();
  34  |     await expect(page.getByTestId("section-cat-records-you-own")).toBeVisible();
  35  |     await expect(page.getByTestId("section-cat-housing")).toBeVisible();
  36  |     await page.getByTestId("checkbox-item-id-ssn").click();
  37  |     await expect(page.getByTestId("text-progress-count")).toContainText(/1 of/);
  38  |     await page.reload();
  39  |     await expect(page.getByTestId("text-progress-count")).toContainText(/1 of/);
  40  |   });
  41  | 
  42  |   test("Transition Plan has before+after tabs and saves", async ({ page }) => {
  43  |     await page.goto(`${BASE}/foster-youth/transition-plan`);
  44  |     await expect(page.getByTestId("page-foster-youth-transition-plan")).toBeVisible();
  45  |     await expect(page.getByTestId("tab-before")).toBeVisible();
  46  |     await expect(page.getByTestId("tab-after")).toBeVisible();
  47  |     await page.getByTestId("textarea-field-before-housing").fill("Aunt Maria's house, 123 Main St");
  48  |     await page.getByTestId("button-save").click();
  49  |     await page.reload();
  50  |     await expect(page.getByTestId("textarea-field-before-housing")).toHaveValue(/Aunt Maria/);
  51  |   });
  52  | 
  53  |   test("Wellbeing screen routes to crisis on red flag", async ({ page }) => {
  54  |     await page.goto(`${BASE}/foster-youth/wellbeing`);
  55  |     await expect(page.getByTestId("alert-crisis-banner")).toBeVisible();
  56  |     await page.getByTestId("radio-phq1-3").click();
  57  |     await page.getByTestId("radio-phq2-3").click();
  58  |     await page.getByTestId("radio-gad1-0").click();
  59  |     await page.getByTestId("radio-gad2-0").click();
  60  |     await page.getByTestId("radio-housing-unsheltered").click();
  61  |     await page.getByTestId("radio-food-none").click();
  62  |     await page.getByTestId("button-see-results").click();
  63  |     await expect(page.getByTestId("section-warm-handoff")).toBeVisible();
  64  |     await expect(page.getByTestId("action-mh")).toBeVisible();
  65  |     await expect(page.getByTestId("action-housing")).toBeVisible();
  66  |     await expect(page.getByTestId("action-food")).toBeVisible();
  67  |   });
  68  | 
  69  |   test("Rights page lists federal + Texas with legal sources", async ({ page }) => {
  70  |     await page.goto(`${BASE}/foster-youth/rights`);
  71  |     await expect(page.getByTestId("accordion-right-chafee")).toBeVisible();
  72  |     await expect(page.getByTestId("accordion-right-etv")).toBeVisible();
  73  |     await expect(page.getByTestId("accordion-right-fyi")).toBeVisible();
  74  |     await expect(page.getByTestId("accordion-right-medicaid26")).toBeVisible();
  75  |     await expect(page.getByTestId("accordion-right-tx-pal")).toBeVisible();
  76  |     await expect(page.getByTestId("accordion-right-tx-tuition")).toBeVisible();
  77  |   });
  78  | 
  79  |   test("State Benefits navigator covers 50 states with TX detail", async ({ page }) => {
  80  |     await page.goto(`${BASE}/foster-youth/benefits`);
  81  |     await expect(page.getByTestId("page-foster-youth-benefits")).toBeVisible();
  82  |     await expect(page.getByTestId("card-benefit-tx-pal")).toBeVisible();
  83  |     await expect(page.getByTestId("card-benefit-fed-medicaid")).toBeVisible();
  84  |     await expect(page.getByTestId("card-benefit-fed-fyi")).toBeVisible();
  85  |   });
  86  | 
  87  |   test("AI-assisted Intake wizard renders step 1 with honest disclosure + can advance", async ({ page }) => {
  88  |     await page.goto(`${BASE}/foster-youth/intake`);
  89  |     await expect(page.getByTestId("page-foster-youth-intake")).toBeVisible();
  90  |     await expect(page.getByTestId("alert-honest")).toBeVisible();
  91  |     await expect(page.getByTestId("stepper")).toBeVisible();
  92  |     await expect(page.getByTestId("card-step-1")).toBeVisible();
  93  |     await page.getByTestId("input-first-name").fill("Marcus");
  94  |     await page.getByTestId("input-age").fill("18");
  95  |     await page.getByTestId("input-age-out-date").fill("2026-08-01");
  96  |     // state defaults to TX in the form
> 97  |     await expect(page.getByTestId("button-next-step-2")).toBeEnabled();
      |                                                          ^ Error: expect(locator).toBeEnabled() failed
  98  |   });
  99  | 
  100 |   test("Cohort analytics page renders headers and stat cards", async ({ page }) => {
  101 |     await page.goto(`${BASE}/foster-youth/cohort-analytics`);
  102 |     await expect(page.getByTestId("page-foster-youth-cohort-analytics")).toBeVisible();
  103 |     await expect(page.getByTestId("text-analytics-title")).toBeVisible();
  104 |     await expect(page.getByTestId("select-window-trigger")).toBeVisible();
  105 |   });
  106 | });
  107 | 
```