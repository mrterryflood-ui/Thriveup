# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: canvas-wire-interaction.spec.ts >> electrical canvas: wire start persists, wire is clickable and deletable
- Location: tests/e2e/canvas-wire-interaction.spec.ts:63:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('trial-gate-active')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByTestId('trial-gate-active')

```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic "Main navigation" [ref=e5]:
        - generic [ref=e6]:
          - link "ThriveUp Academy home" [ref=e8] [cursor=pointer]:
            - /url: /
            - generic [ref=e9]:
              - img "ThriveUp logo" [ref=e10]
              - generic [ref=e11]:
                - paragraph [ref=e12]: ThriveUp
                - paragraph [ref=e13]: a service of The Collaborative Advocate Foundation
          - generic [ref=e14]:
            - generic [ref=e17]:
              - generic [ref=e18]: Search navigation
              - generic [ref=e19]:
                - img [ref=e20]
                - searchbox "Find a page" [ref=e23]
            - generic [ref=e26]:
              - paragraph [ref=e27]: Foundation Network
              - generic [ref=e28]:
                - link "Serve" [ref=e29] [cursor=pointer]:
                  - /url: /hub/serve
                  - img [ref=e30]
                  - text: Serve
                - link "Grow" [ref=e32] [cursor=pointer]:
                  - /url: /hub/grow
                  - img [ref=e33]
                  - text: Grow
                - link "Fund" [ref=e38] [cursor=pointer]:
                  - /url: /hub/fund
                  - img [ref=e39]
                  - text: Fund
                - link "Connect" [ref=e43] [cursor=pointer]:
                  - /url: /hub/connect
                  - img [ref=e44]
                  - text: Connect
            - list [ref=e49]:
              - listitem [ref=e51]:
                - button "Central Texas section" [ref=e52] [cursor=pointer]:
                  - img [ref=e53]
                  - generic [ref=e56]: Central Texas
                  - generic [ref=e57]: "11"
                  - img [ref=e58]
            - list [ref=e62]:
              - listitem [ref=e64]:
                - button "Get Funded section" [ref=e65] [cursor=pointer]:
                  - img [ref=e66]
                  - generic [ref=e72]: Get Funded
                  - generic [ref=e73]: "6"
                  - img [ref=e74]
            - list [ref=e78]:
              - listitem [ref=e80]:
                - button "Benefits & Intake section" [ref=e81] [cursor=pointer]:
                  - img [ref=e82]
                  - generic [ref=e87]: Benefits & Intake
                  - generic [ref=e88]: "7"
                  - img [ref=e89]
            - list [ref=e93]:
              - listitem [ref=e95]:
                - button "Foster Youth section" [ref=e96] [cursor=pointer]:
                  - img [ref=e97]
                  - generic [ref=e99]: Foster Youth
                  - generic [ref=e100]: "12"
                  - img [ref=e101]
            - list [ref=e105]:
              - listitem [ref=e107]:
                - button "Justice & Reentry section" [ref=e108] [cursor=pointer]:
                  - img [ref=e109]
                  - generic [ref=e113]: Justice & Reentry
                  - generic [ref=e114]: "4"
                  - img [ref=e115]
            - list [ref=e119]:
              - listitem [ref=e121]:
                - button "Prevention & Health section" [ref=e122] [cursor=pointer]:
                  - img [ref=e123]
                  - generic [ref=e126]: Prevention & Health
                  - generic [ref=e127]: "5"
                  - img [ref=e128]
            - list [ref=e132]:
              - listitem [ref=e134]:
                - button "Child Care & Workforce section" [ref=e135] [cursor=pointer]:
                  - img [ref=e136]
                  - generic [ref=e139]: Child Care & Workforce
                  - generic [ref=e140]: "4"
                  - img [ref=e141]
            - list [ref=e145]:
              - listitem [ref=e147]:
                - button "Rural & Agriculture section" [ref=e148] [cursor=pointer]:
                  - img [ref=e149]
                  - generic [ref=e153]: Rural & Agriculture
                  - generic [ref=e154]: "13"
                  - img [ref=e155]
            - list [ref=e159]:
              - listitem [ref=e161]:
                - button "Workforce & Trades section" [expanded] [ref=e162] [cursor=pointer]:
                  - img [ref=e163]
                  - generic [ref=e166]: Workforce & Trades
                  - generic [ref=e167]: "15"
                  - img [ref=e168]
                - list [ref=e171]:
                  - listitem [ref=e172]:
                    - link "Workforce Pathways" [ref=e173] [cursor=pointer]:
                      - /url: /workforce
                      - img [ref=e174]
                      - generic [ref=e177]: Workforce Pathways
                  - listitem [ref=e178]:
                    - link "Trade Sims (Try Free →)" [ref=e179] [cursor=pointer]:
                      - /url: /academy/trade-sims
                      - img [ref=e180]
                      - generic [ref=e182]: Trade Sims (Try Free →)
                  - listitem [ref=e183]:
                    - link "Career Explorer" [ref=e184] [cursor=pointer]:
                      - /url: /academy/careers
                      - img [ref=e185]
                      - generic [ref=e188]: Career Explorer
                  - listitem [ref=e189]:
                    - link "My Pathway" [ref=e190] [cursor=pointer]:
                      - /url: /academy/pathway
                      - img [ref=e191]
                      - generic [ref=e195]: My Pathway
                  - listitem [ref=e196]:
                    - link "Apprenticeship Tracker" [ref=e197] [cursor=pointer]:
                      - /url: /apprenticeship-tracker
                      - img [ref=e198]
                      - generic [ref=e200]: Apprenticeship Tracker
                  - listitem [ref=e201]:
                    - link "Mentors & Pathways" [ref=e202] [cursor=pointer]:
                      - /url: /mentorship-directory
                      - img [ref=e203]
                      - generic [ref=e208]: Mentors & Pathways
                  - listitem [ref=e209]:
                    - link "Employer Connections" [ref=e210] [cursor=pointer]:
                      - /url: /workforce-employers
                      - img [ref=e211]
                      - generic [ref=e215]: Employer Connections
                  - listitem [ref=e216]:
                    - link "Shadow Worker Hub" [ref=e217] [cursor=pointer]:
                      - /url: /shadow-worker-hub
                      - img [ref=e218]
                      - generic [ref=e220]: Shadow Worker Hub
                  - listitem [ref=e221]:
                    - link "Transition Plans" [ref=e222] [cursor=pointer]:
                      - /url: /transition-plans
                      - img [ref=e223]
                      - generic [ref=e226]: Transition Plans
                  - listitem [ref=e227]:
                    - link "Dream Design" [ref=e228] [cursor=pointer]:
                      - /url: /academy/dreams
                      - img [ref=e229]
                      - generic [ref=e233]: Dream Design
                  - listitem [ref=e234]:
                    - link "Life Lessons" [ref=e235] [cursor=pointer]:
                      - /url: /academy/lessons
                      - img [ref=e236]
                      - generic [ref=e238]: Life Lessons
                  - listitem [ref=e239]:
                    - link "MOS Translator" [ref=e240] [cursor=pointer]:
                      - /url: /mos-translator
                      - img [ref=e241]
                      - generic [ref=e243]: MOS Translator
                  - listitem [ref=e244]:
                    - link "Workforce Pell Grant" [ref=e245] [cursor=pointer]:
                      - /url: /workforce-pell
                      - img [ref=e246]
                      - generic [ref=e248]: Workforce Pell Grant
                  - listitem [ref=e249]:
                    - link "Workforce Assessment" [ref=e250] [cursor=pointer]:
                      - /url: /workforce-assessment
                      - img [ref=e251]
                      - generic [ref=e255]: Workforce Assessment
                  - listitem [ref=e256]:
                    - link "Workforce Training" [ref=e257] [cursor=pointer]:
                      - /url: /workforce-training
                      - img [ref=e258]
                      - generic [ref=e261]: Workforce Training
            - list [ref=e264]:
              - listitem [ref=e266]:
                - button "Academy & Learning section" [ref=e267] [cursor=pointer]:
                  - img [ref=e268]
                  - generic [ref=e271]: Academy & Learning
                  - generic [ref=e272]: "19"
                  - img [ref=e273]
            - list [ref=e277]:
              - listitem [ref=e279]:
                - button "Partners & Coalitions section" [ref=e280] [cursor=pointer]:
                  - img [ref=e281]
                  - generic [ref=e286]: Partners & Coalitions
                  - generic [ref=e287]: "17"
                  - img [ref=e288]
            - list [ref=e292]:
              - listitem [ref=e294]:
                - button "Where We Operate section" [ref=e295] [cursor=pointer]:
                  - img [ref=e296]
                  - generic [ref=e299]: Where We Operate
                  - generic [ref=e300]: "16"
                  - img [ref=e301]
            - list [ref=e305]:
              - listitem [ref=e307]:
                - button "About & Trust section" [ref=e308] [cursor=pointer]:
                  - img [ref=e309]
                  - generic [ref=e311]: About & Trust
                  - generic [ref=e312]: "14"
                  - img [ref=e313]
          - generic "Sidebar footer" [ref=e315]:
            - generic [ref=e316]:
              - link "Sign in" [ref=e317] [cursor=pointer]:
                - /url: /api/login
                - img
                - text: Sign In
              - paragraph [ref=e318]: Sign in to autosave your work across devices
            - generic [ref=e319]:
              - generic [ref=e320]:
                - img [ref=e321]
                - generic [ref=e323]: ThriveUp Academy · TCAF · ALC
              - paragraph [ref=e324]: National community-infrastructure platform. Live pilot in Travis County, Texas — the template for the all-50-states + 5-territory rollout via the open Hub Adoption Kit. TCAF is an IRS-determined 501(c)(3) (Letter 947, effective January 14, 2026); SAM.gov Active (UEI KDDVD1FGLW35); CAGE 209N1.
      - generic [ref=e325]:
        - link "Skip to main content" [ref=e326] [cursor=pointer]:
          - /url: "#main-content"
        - banner [ref=e327]:
          - button "Toggle Sidebar" [ref=e328] [cursor=pointer]:
            - img
            - generic [ref=e329]: Toggle Sidebar
          - generic [ref=e331]: ThriveUp
          - generic [ref=e332]:
            - button "Search all pages" [ref=e333] [cursor=pointer]:
              - img
              - generic [ref=e334]: Search
              - generic [ref=e335]: ⌘K
            - button "Accessibility settings" [ref=e336] [cursor=pointer]:
              - img
            - generic [ref=e337]:
              - 'button "Current language: English. Click to change." [ref=e338] [cursor=pointer]':
                - img
                - generic [ref=e339]: 🇺🇸
                - generic [ref=e340]: en
              - button "Enable low-bandwidth mode" [ref=e341] [cursor=pointer]:
                - img
              - button "Switch to dark mode" [ref=e342] [cursor=pointer]:
                - img
        - main [ref=e343]
    - navigation [ref=e353]:
      - link "Home" [ref=e354] [cursor=pointer]:
        - /url: /hub
        - img [ref=e356]
        - generic [ref=e359]: Home
      - link "Serve" [ref=e360] [cursor=pointer]:
        - /url: /hub/serve
        - img [ref=e362]
        - generic [ref=e364]: Serve
      - link "Fund" [ref=e365] [cursor=pointer]:
        - /url: /hub/fund
        - img [ref=e367]
        - generic [ref=e371]: Fund
      - link "Grow" [ref=e372] [cursor=pointer]:
        - /url: /hub/grow
        - img [ref=e374]
        - generic [ref=e379]: Grow
      - link "Connect" [ref=e380] [cursor=pointer]:
        - /url: /hub/connect
        - img [ref=e382]
        - generic [ref=e387]: Connect
    - button "Open AI Navigator" [ref=e388] [cursor=pointer]:
      - img [ref=e389]
      - generic [ref=e392]: Navigator
    - 'button "Help: Career Pathways" [ref=e393] [cursor=pointer]':
      - img [ref=e394]
  - region "Notifications (F8)":
    - list
```