# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> smoke: public pages render >> ecosystem orchestration page renders 24 platforms + 7 triads
- Location: tests/e2e/smoke.spec.ts:19:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('text-stat-platforms')
Expected substring: "24"
Received string:    "26"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByTestId('text-stat-platforms')
    9 × locator resolved to <div data-component-name="div" class="text-2xl font-bold" data-testid="text-stat-platforms" data-replit-metadata="client/src/pages/ecosystem-orchestration.tsx:224:10">26</div>
      - unexpected value "26"

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
          - generic [ref=e250]:
            - generic [ref=e251]:
              - generic [ref=e252]:
                - img [ref=e253]
                - heading "Ecosystem Orchestration" [level=1] [ref=e255]
              - paragraph [ref=e256]: "Read-only co-manager view of the 15-service-platform ecosystem: each platform's role, domain, data flows, grant alignment, and the triads that coordinate them. For live operations and health, see the internal Ops Center."
            - generic [ref=e257]:
              - generic [ref=e259]:
                - img [ref=e260]
                - generic [ref=e263]:
                  - generic [ref=e264]: Platforms
                  - generic [ref=e265]: "26"
              - generic [ref=e267]:
                - img [ref=e268]
                - generic [ref=e273]:
                  - generic [ref=e274]: Triads
                  - generic [ref=e275]: "7"
              - generic [ref=e277]:
                - img [ref=e278]
                - generic [ref=e280]:
                  - generic [ref=e281]: Domains
                  - generic [ref=e282]: "13"
              - generic [ref=e284]:
                - img [ref=e285]
                - generic [ref=e287]:
                  - generic [ref=e288]: Architecture
                  - generic [ref=e289]: ACOS
            - generic [ref=e290]:
              - tablist [ref=e291]:
                - tab "Platforms" [selected] [ref=e292] [cursor=pointer]
                - tab "Triads" [ref=e293] [cursor=pointer]
              - tabpanel "Platforms" [ref=e294]:
                - generic [ref=e295]:
                  - generic [ref=e296]:
                    - img [ref=e297]
                    - textbox "Search by name, role, ID..." [ref=e300]
                  - generic [ref=e301]:
                    - button "All (26)" [ref=e302] [cursor=pointer]
                    - button "business-intelligence (1)" [ref=e303] [cursor=pointer]
                    - button "civic-engagement (1)" [ref=e304] [cursor=pointer]
                    - button "community-workforce (1)" [ref=e305] [cursor=pointer]
                    - button "compliance (2)" [ref=e306] [cursor=pointer]
                    - button "ecosystem-orchestration (1)" [ref=e307] [cursor=pointer]
                    - button "education (3)" [ref=e308] [cursor=pointer]
                    - button "health-equity (10)" [ref=e309] [cursor=pointer]
                    - button "marketing-content (2)" [ref=e310] [cursor=pointer]
                    - button "operations (1)" [ref=e311] [cursor=pointer]
                    - button "system-optimization (1)" [ref=e312] [cursor=pointer]
                    - button "veteran-services (1)" [ref=e313] [cursor=pointer]
                    - button "veterans (1)" [ref=e314] [cursor=pointer]
                    - button "workforce-contracting (1)" [ref=e315] [cursor=pointer]
                - generic [ref=e316]:
                  - generic [ref=e317]:
                    - generic [ref=e319]:
                      - generic [ref=e320]:
                        - generic [ref=e321]: ThriveUp Academy (TCAF Hub)
                        - generic [ref=e322]:
                          - generic [ref=e323]: self-hub
                          - generic [ref=e324]: ecosystem-orchestration
                      - link "Open ThriveUp Academy (TCAF Hub) in a new tab" [ref=e325] [cursor=pointer]:
                        - /url: https://thriveupacademy.replit.app
                        - img [ref=e326]
                    - generic [ref=e330]:
                      - paragraph [ref=e331]: "TCAF national community-infrastructure platform. The orchestrating hub for the 24-platform ecosystem: grant discovery + funder fit, ecosystem directives + enforcement, bilateral exchange, RAG/AI provider with ethical-EI preamble, RPLICE quality gate, MAP-GAP methodology, regional hubs (Austin/Manor/Pflugerville), and the Integration through Invitation dignity primitive. Owns directive authorship and ack adjudication."
                      - generic [ref=e332]:
                        - generic [ref=e333]:
                          - generic [ref=e334]: "9"
                          - generic [ref=e335]: Features
                        - generic [ref=e336]:
                          - generic [ref=e337]: "6"
                          - generic [ref=e338]: Sends
                        - generic [ref=e339]:
                          - generic [ref=e340]: "4"
                          - generic [ref=e341]: Receives
                      - generic [ref=e342]:
                        - generic [ref=e343]: federal
                        - generic [ref=e344]: foundation
                        - generic [ref=e345]: wioa
                        - generic [ref=e346]: nsf
                        - generic [ref=e347]: hrsa
                  - generic [ref=e348]:
                    - generic [ref=e350]:
                      - generic [ref=e351]:
                        - generic [ref=e352]: Civic Signal
                        - generic [ref=e353]:
                          - generic [ref=e354]: civic-intelligence
                          - generic [ref=e355]: civic-engagement
                      - link "Open Civic Signal in a new tab" [ref=e356] [cursor=pointer]:
                        - /url: https://power2thepeople.net
                        - img [ref=e357]
                    - generic [ref=e361]:
                      - paragraph [ref=e362]: Civic intelligence terminal that lets residents see and act on government before decisions are already made. Real-time Live Civic Feed mixing federal bills, court rulings, federal regulations, CBO cost estimates, and city ordinances (1,448 court items / 880 ordinances / 360 meetings indexed). 10-step 'Get your affairs in order' wizard with healthcare-directive and power-of-attorney walkthroughs sourced from ready.gov and caringinfo.org. Vote tools, civic Q&A via Ask AI, EN/ES throughout. Part of the quintet (Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health) — the civic-engagement surface that turns lived knowledge into civic action.
                      - generic [ref=e363]:
                        - generic [ref=e364]:
                          - generic [ref=e365]: "13"
                          - generic [ref=e366]: Features
                        - generic [ref=e367]:
                          - generic [ref=e368]: "4"
                          - generic [ref=e369]: Sends
                        - generic [ref=e370]:
                          - generic [ref=e371]: "3"
                          - generic [ref=e372]: Receives
                      - generic [ref=e373]:
                        - generic [ref=e374]: foundation
                        - generic [ref=e375]: knight
                        - generic [ref=e376]: mozilla
                        - generic [ref=e377]: wioa
                  - generic [ref=e378]:
                    - generic [ref=e380]:
                      - generic [ref=e381]:
                        - generic [ref=e382]: Whole-Person Health Ecosystem
                        - generic [ref=e383]:
                          - generic [ref=e384]: hub
                          - generic [ref=e385]: health-equity
                      - link "Open Whole-Person Health Ecosystem in a new tab" [ref=e386] [cursor=pointer]:
                        - /url: https://mentalwellnesssupport.net
                        - img [ref=e387]
                    - generic [ref=e391]:
                      - paragraph [ref=e392]: Central hub and connective tissue for the entire 24-platform ecosystem. Delivers validated clinical screenings (C-SSRS suicidality, PHQ-9 depression, GAD-7 anxiety, PCL-5 PTSD), individualized safety plans with auto-escalation, Reach a Vet crisis pathway, and MAP-GAP biopsychosocial assessment. Maintains 20,670+ curated resources across 2,091 community groups, 60 condition guides, and 19 population-specific hubs. Every platform routes crisis, referral, and assessment data through this hub. Offline-capable PWA ensures access in connectivity-limited environments. Governs cross-platform data routing and crisis escalation protocols for the entire ACOS architecture.
                      - generic [ref=e393]:
                        - generic [ref=e394]:
                          - generic [ref=e395]: "15"
                          - generic [ref=e396]: Features
                        - generic [ref=e397]:
                          - generic [ref=e398]: "9"
                          - generic [ref=e399]: Sends
                        - generic [ref=e400]:
                          - generic [ref=e401]: "10"
                          - generic [ref=e402]: Receives
                      - generic [ref=e403]:
                        - generic [ref=e404]: ssg-fox
                        - generic [ref=e405]: st-davids
                        - generic [ref=e406]: wioa
                        - generic [ref=e407]: foundation
                  - generic [ref=e408]:
                    - generic [ref=e410]:
                      - generic [ref=e411]:
                        - generic [ref=e412]: ISSS — Integrated Supports for Thriving Youth
                        - generic [ref=e413]:
                          - generic [ref=e414]: student-support
                          - generic [ref=e415]: education
                      - link "Open ISSS — Integrated Supports for Thriving Youth in a new tab" [ref=e416] [cursor=pointer]:
                        - /url: https://implementationineducatio.com
                        - img [ref=e417]
                    - generic [ref=e421]:
                      - paragraph [ref=e422]: Whole-child implementation infrastructure enabling schools, districts, and regions to implement evidence-based student support at scale. Multi-Tiered System of Supports (MTSS) engine with early warning indicators, Thrive Score tracking, multi-stakeholder coordination across teachers/counselors/parents/community, and implementation fidelity measurement using CFIR and RE-AIM frameworks. District-level analytics dashboard provides real-time intervention effectiveness data. Integrates with WholeMind Learning for academic data, Perfectly Different for IEP/504 accommodations, SafeReport for incident management, and Whole-Person Health for crisis routing. Produces grant-ready outcome data for WIOA youth employment and foundation education grants.
                      - generic [ref=e423]:
                        - generic [ref=e424]:
                          - generic [ref=e425]: "14"
                          - generic [ref=e426]: Features
                        - generic [ref=e427]:
                          - generic [ref=e428]: "8"
                          - generic [ref=e429]: Sends
                        - generic [ref=e430]:
                          - generic [ref=e431]: "8"
                          - generic [ref=e432]: Receives
                      - generic [ref=e433]:
                        - generic [ref=e434]: wioa
                        - generic [ref=e435]: foundation
                        - generic [ref=e436]: st-davids
                  - generic [ref=e437]:
                    - generic [ref=e439]:
                      - generic [ref=e440]:
                        - generic [ref=e441]: Sankofa Health Network
                        - generic [ref=e442]:
                          - generic [ref=e443]: health-gateway
                          - generic [ref=e444]: health-equity
                      - link "Open Sankofa Health Network in a new tab" [ref=e445] [cursor=pointer]:
                        - /url: https://yourhealthbirthright.net
                        - img [ref=e446]
                    - generic [ref=e450]:
                      - paragraph [ref=e451]: Health equity gateway orchestrating 5 sub-platforms (Maternal Health, Feminine Health, Men's Health, Cognitive Safety, Medication Management). Delivers culturally responsive behavioral health assessments, GIS-powered resource matching to 20,670+ resources, and population-specific health navigation for Black communities. Coordinates upstream screening data from Whole-Person Health hub and routes to specialized sub-platforms based on demographic and clinical need. Produces health equity outcome data for St. David's and SSG Fox grant reporting. Network architecture ensures no single point of failure — sub-platforms operate independently but coordinate through Sankofa's routing layer.
                      - generic [ref=e452]:
                        - generic [ref=e453]:
                          - generic [ref=e454]: "14"
                          - generic [ref=e455]: Features
                        - generic [ref=e456]:
                          - generic [ref=e457]: "7"
                          - generic [ref=e458]: Sends
                        - generic [ref=e459]:
                          - generic [ref=e460]: "7"
                          - generic [ref=e461]: Receives
                      - generic [ref=e462]:
                        - generic [ref=e463]: st-davids
                        - generic [ref=e464]: ssg-fox
                        - generic [ref=e465]: foundation
                  - generic [ref=e466]:
                    - generic [ref=e468]:
                      - generic [ref=e469]:
                        - generic [ref=e470]: HerHealth Network (Holistic Black Feminine Health Hub)
                        - generic [ref=e471]:
                          - generic [ref=e472]: feminine-health
                          - generic [ref=e473]: health-equity
                      - link "Open HerHealth Network (Holistic Black Feminine Health Hub) in a new tab" [ref=e474] [cursor=pointer]:
                        - /url: https://herhealthmatters2.com
                        - img [ref=e475]
                    - generic [ref=e479]:
                      - paragraph [ref=e480]: Comprehensive OB/GYN health platform for Black women — reproductive health education, hormonal wellness tracking, preventive screening scheduling, cervical/breast cancer awareness, menopause management, community support groups, and culturally responsive provider matching. Part of the Sankofa Health Network family. Also reachable at the alias domain myhealthybreast.com (both serve the same site). Integrates with Black Maternal Health Network for pregnancy pathways, SafeCogniCare for peripartum cognitive assessment, and Whole-Person Health for crisis escalation. Produces population-specific health outcome data addressing the 3x maternal mortality gap in Black communities.
                      - generic [ref=e481]:
                        - generic [ref=e482]:
                          - generic [ref=e483]: "11"
                          - generic [ref=e484]: Features
                        - generic [ref=e485]:
                          - generic [ref=e486]: "5"
                          - generic [ref=e487]: Sends
                        - generic [ref=e488]:
                          - generic [ref=e489]: "5"
                          - generic [ref=e490]: Receives
                      - generic [ref=e491]:
                        - generic [ref=e492]: st-davids
                        - generic [ref=e493]: foundation
                  - generic [ref=e494]:
                    - generic [ref=e496]:
                      - generic [ref=e497]:
                        - generic [ref=e498]: Black Maternal Health Network
                        - generic [ref=e499]:
                          - generic [ref=e500]: maternal-health
                          - generic [ref=e501]: health-equity
                      - link "Open Black Maternal Health Network in a new tab" [ref=e502] [cursor=pointer]:
                        - /url: https://yourhealthbirthright.net
                        - img [ref=e503]
                    - generic [ref=e507]:
                      - paragraph [ref=e508]: Directly addressing the Black maternal mortality crisis with evidence-based interventions — comprehensive prenatal/postnatal care navigation, certified doula matching and coordination, maternal risk assessment using validated instruments, community health worker dispatch, maternal mental health screening (EPDS, PHQ-9 peripartum), breastfeeding support, and postpartum recovery planning. Integrates with Whole-Person Health for crisis escalation, Feminine Health Hub for reproductive pathways, SafeCogniCare for peripartum cognitive changes, and LifeBridge for social determinant interventions (housing, food, transportation) that drive maternal outcomes.
                      - generic [ref=e509]:
                        - generic [ref=e510]:
                          - generic [ref=e511]: "12"
                          - generic [ref=e512]: Features
                        - generic [ref=e513]:
                          - generic [ref=e514]: "7"
                          - generic [ref=e515]: Sends
                        - generic [ref=e516]:
                          - generic [ref=e517]: "6"
                          - generic [ref=e518]: Receives
                      - generic [ref=e519]:
                        - generic [ref=e520]: st-davids
                        - generic [ref=e521]: foundation
                        - generic [ref=e522]: ssg-fox
                  - generic [ref=e523]:
                    - generic [ref=e525]:
                      - generic [ref=e526]:
                        - generic [ref=e527]: Black Men's Health Hub
                        - generic [ref=e528]:
                          - generic [ref=e529]: mens-health
                          - generic [ref=e530]: health-equity
                      - link "Open Black Men's Health Hub in a new tab" [ref=e531] [cursor=pointer]:
                        - /url: https://thehealthyblkman.com
                        - img [ref=e532]
                    - generic [ref=e536]:
                      - paragraph [ref=e537]: Comprehensive health platform for Black men addressing chronic disease disparities and mental health stigma — prostate cancer screening navigation, cardiovascular risk assessment (Framingham-adapted), diabetes prevention, mental health stigma reduction campaigns, substance use screening (AUDIT-C, DAST-10), peer mentor matching, and preventive care scheduling. Integrates with M2C Transition for veteran men's health pathways, Whole-Person Health for crisis routing, and LifeBridge for social determinant interventions. Targets the 5-year life expectancy gap for Black men through culturally responsive engagement.
                      - generic [ref=e538]:
                        - generic [ref=e539]:
                          - generic [ref=e540]: "11"
                          - generic [ref=e541]: Features
                        - generic [ref=e542]:
                          - generic [ref=e543]: "5"
                          - generic [ref=e544]: Sends
                        - generic [ref=e545]:
                          - generic [ref=e546]: "5"
                          - generic [ref=e547]: Receives
                      - generic [ref=e548]:
                        - generic [ref=e549]: st-davids
                        - generic [ref=e550]: ssg-fox
                        - generic [ref=e551]: foundation
                  - generic [ref=e552]:
                    - generic [ref=e554]:
                      - generic [ref=e555]:
                        - generic [ref=e556]: Emergency Management
                        - generic [ref=e557]:
                          - generic [ref=e558]: risk-intelligence
                          - generic [ref=e559]: compliance
                      - link "Open Emergency Management in a new tab" [ref=e560] [cursor=pointer]:
                        - /url: https://emergency-mgmt.replit.app
                        - img [ref=e561]
                    - generic [ref=e565]:
                      - paragraph [ref=e566]: Risk intelligence and threat assessment platform providing geographic risk mapping, multi-factor safety analytics, protective factor identification, and community resilience scoring. Ingests incident data from SafeReport, crisis events from Whole-Person Health, and community health data from LifeBridge to produce real-time risk heat maps and predictive safety models. Generates risk scores that inform resource deployment, crisis response routing, and grant compliance reporting for safety-focused programs. API-accessible risk assessments enable all 22 sibling platforms to make location-aware safety decisions.
                      - generic [ref=e567]:
                        - generic [ref=e568]:
                          - generic [ref=e569]: "11"
                          - generic [ref=e570]: Features
                        - generic [ref=e571]:
                          - generic [ref=e572]: "7"
                          - generic [ref=e573]: Sends
                        - generic [ref=e574]:
                          - generic [ref=e575]: "6"
                          - generic [ref=e576]: Receives
                      - generic [ref=e577]:
                        - generic [ref=e578]: ssg-fox
                        - generic [ref=e579]: foundation
                        - generic [ref=e580]: st-davids
                  - generic [ref=e581]:
                    - generic [ref=e583]:
                      - generic [ref=e584]:
                        - generic [ref=e585]: WholeMind Learning
                        - generic [ref=e586]:
                          - generic [ref=e587]: k12-education
                          - generic [ref=e588]: education
                      - link "Open WholeMind Learning in a new tab" [ref=e589] [cursor=pointer]:
                        - /url: https://wholemindlearning.com
                        - img [ref=e590]
                    - generic [ref=e594]:
                      - paragraph [ref=e595]: Free, visual-first Pre-K to 12th grade learning platform covering Math, Reading, Science, English, and Social Studies with adaptive difficulty levels. Silent accessibility mode for students with sensory needs, AI-powered homework help with step-by-step explanations, parent-friendly progress tracking dashboard, and gamified engagement system. Integrates with ISSS for student support coordination, Perfectly Different for neurodiversity accommodations, and Better Science Lab for evidence-based pedagogy. Produces learning outcome data (grade progression, skill mastery, engagement rates) for WIOA youth workforce readiness and foundation education grants.
                      - generic [ref=e596]:
                        - generic [ref=e597]:
                          - generic [ref=e598]: "12"
                          - generic [ref=e599]: Features
                        - generic [ref=e600]:
                          - generic [ref=e601]: "7"
                          - generic [ref=e602]: Sends
                        - generic [ref=e603]:
                          - generic [ref=e604]: "6"
                          - generic [ref=e605]: Receives
                      - generic [ref=e606]:
                        - generic [ref=e607]: wioa
                        - generic [ref=e608]: foundation
                        - generic [ref=e609]: st-davids
                  - generic [ref=e610]:
                    - generic [ref=e612]:
                      - generic [ref=e613]:
                        - generic [ref=e614]: Perfectly Different
                        - generic [ref=e615]:
                          - generic [ref=e616]: neurodiversity
                          - generic [ref=e617]: health-equity
                      - link "Open Perfectly Different in a new tab" [ref=e618] [cursor=pointer]:
                        - /url: https://neurodifferentassistant.app
                        - img [ref=e619]
                    - generic [ref=e623]:
                      - paragraph [ref=e624]: Neurodiversity-affirming support platform for autism, ADHD, and AuDHD populations — AI-powered daily guidance, comprehensive IEP/504 plan assistance with template library, crisis resources with immediate routing to Whole-Person Health, evidence-based therapy tool library, community support groups, and neurodiversity advocacy resources. Integrates with ISSS for school-based accommodations, WholeMind for adaptive learning, SafeCogniCare for cognitive assessments, and LifeBridge for community resources. Produces neurodevelopmental outcome data for St. David's disability services and foundation grants.
                      - generic [ref=e625]:
                        - generic [ref=e626]:
                          - generic [ref=e627]: "12"
                          - generic [ref=e628]: Features
                        - generic [ref=e629]:
                          - generic [ref=e630]: "6"
                          - generic [ref=e631]: Sends
                        - generic [ref=e632]:
                          - generic [ref=e633]: "6"
                          - generic [ref=e634]: Receives
                      - generic [ref=e635]:
                        - generic [ref=e636]: st-davids
                        - generic [ref=e637]: foundation
                        - generic [ref=e638]: wioa
                  - generic [ref=e639]:
                    - generic [ref=e641]:
                      - generic [ref=e642]:
                        - generic [ref=e643]: SafeReport
                        - generic [ref=e644]:
                          - generic [ref=e645]: compliance
                          - generic [ref=e646]: compliance
                      - link "Open SafeReport in a new tab" [ref=e647] [cursor=pointer]:
                        - /url: https://safereports.net
                        - img [ref=e648]
                    - generic [ref=e652]:
                      - paragraph [ref=e653]: Compliance-Grade AI for Clinical Settings — mandatory reporting paired with Clinical Decision Support (CDS) for behavioral-health workflows. 50-state mandatory-reporter regulation database with auto-updated jurisdictional requirements. FHIR + CDS Hooks healthcare-IT interop for direct integration into EHR/clinical systems. PHI-safe by design — 0 raw PHI bytes egressed; all external calls de-identified. Human-In-The-Loop (HITL) default-on; every AI recommendation reviewed by a clinician before it touches a patient. 100% of recommendations cited with sources. Validated longitudinal screening for tracking BH and family-safety trajectories over time. Free-forever tier for small clinics/community providers. Integrates with Whole-Person Health for crisis routing (PHQ-9 / GAD-7 / C-SSRS / PCL-5 handoff), ISSS for student-safety early warnings, LifeBridge for victim/family support resources, and Emergency Management for risk intelligence. The clinical-compliance backbone for the behavioral-health stack.
                      - generic [ref=e654]:
                        - generic [ref=e655]:
                          - generic [ref=e656]: "14"
                          - generic [ref=e657]: Features
                        - generic [ref=e658]:
                          - generic [ref=e659]: "7"
                          - generic [ref=e660]: Sends
                        - generic [ref=e661]:
                          - generic [ref=e662]: "6"
                          - generic [ref=e663]: Receives
                      - generic [ref=e664]:
                        - generic [ref=e665]: ssg-fox
                        - generic [ref=e666]: foundation
                        - generic [ref=e667]: st-davids
                  - generic [ref=e668]:
                    - generic [ref=e670]:
                      - generic [ref=e671]:
                        - generic [ref=e672]: Mission Transition (M2C)
                        - generic [ref=e673]:
                          - generic [ref=e674]: veteran-transition
                          - generic [ref=e675]: veterans
                      - link "Open Mission Transition (M2C) in a new tab" [ref=e676] [cursor=pointer]:
                        - /url: https://vetmissiontransition.com
                        - img [ref=e677]
                    - generic [ref=e681]:
                      - paragraph [ref=e682]: Full-spectrum military-to-civilian transition platform covering the complete separation journey. MOS/AFSC career translation to civilian equivalents with salary data, comprehensive benefits navigation (VA healthcare, GI Bill, disability claims, VR&E), housing and financial planning tools, identity transition support addressing the loss-of-purpose crisis, validated skills assessment with employer matching, community connections mapped to veteran density, and military family support for spouses and dependents. Specifically targets the first 12 months post-separation — the highest suicide risk window — with proactive outreach triggers. Integrates with Whole-Person Health for crisis routing (C-SSRS/PCL-5), LifeBridge for social determinant support, MCE for veteran entrepreneurship, and Black Men's Health Hub for veteran health pathways.
                      - generic [ref=e683]:
                        - generic [ref=e684]:
                          - generic [ref=e685]: "14"
                          - generic [ref=e686]: Features
                        - generic [ref=e687]:
                          - generic [ref=e688]: "10"
                          - generic [ref=e689]: Sends
                        - generic [ref=e690]:
                          - generic [ref=e691]: "8"
                          - generic [ref=e692]: Receives
                      - generic [ref=e693]:
                        - generic [ref=e694]: ssg-fox
                        - generic [ref=e695]: wioa
                        - generic [ref=e696]: foundation
                  - generic [ref=e697]:
                    - generic [ref=e699]:
                      - generic [ref=e700]:
                        - generic [ref=e701]: LifeBridge
                        - generic [ref=e702]:
                          - generic [ref=e703]: resource-hub
                          - generic [ref=e704]: community-workforce
                      - link "Open LifeBridge in a new tab" [ref=e705] [cursor=pointer]:
                        - /url: https://lifetransitionsaid.org
                        - img [ref=e706]
                    - generic [ref=e710]:
                      - paragraph [ref=e711]: Virtual 211 and Community Health Worker coordination hub providing 24/7 resource navigation across housing, food, healthcare, mental health, substance abuse, domestic violence, and crisis support — covering 20,670+ resources. Also addresses non-combat life events that drive veteran suicide (divorce, job loss, retirement, health diagnosis, bereavement, financial crisis) with evidence-based coping strategies and peer storytelling. Social determinant engine scores needs across 7 domains (housing, food, transportation, employment, healthcare, legal, safety) and routes to specific ecosystem platforms. Integrates with every health platform for crisis escalation, M2C for veteran life events, and ISSS for family-level support.
                      - generic [ref=e712]:
                        - generic [ref=e713]:
                          - generic [ref=e714]: "15"
                          - generic [ref=e715]: Features
                        - generic [ref=e716]:
                          - generic [ref=e717]: "8"
                          - generic [ref=e718]: Sends
                        - generic [ref=e719]:
                          - generic [ref=e720]: "8"
                          - generic [ref=e721]: Receives
                      - generic [ref=e722]:
                        - generic [ref=e723]: st-davids
                        - generic [ref=e724]: ssg-fox
                  - generic [ref=e725]:
                    - generic [ref=e727]:
                      - generic [ref=e728]:
                        - generic [ref=e729]: Minority Center of Excellence
                        - generic [ref=e730]:
                          - generic [ref=e731]: business-ecosystem
                          - generic [ref=e732]: business-intelligence
                      - link "Open Minority Center of Excellence in a new tab" [ref=e733] [cursor=pointer]:
                        - /url: https://minoritycenterofexcellence.com
                        - img [ref=e734]
                    - generic [ref=e738]:
                      - paragraph [ref=e739]: First comprehensive digital ecosystem for minority-owned businesses with 656,794 curated SAM.gov records. 14 AI-powered tools covering the 6-stage business lifecycle (Start → Certify → Find → Bid → Win → Scale). Dual-AI proposal review system (GPT + Claude cross-validation), live SAM.gov integration pulling real federal opportunities, 50-state + DC certification coverage, Business Health Score algorithm, Teaming Hub for joint venture matching, and Certification Wizard for 8(a)/HUBZone/WOSB/SDVOSB guidance. Integrates with Pinnacle for contractor enablement, M2C for veteran entrepreneurs, and Whole-Person Health for workforce wellness. Produces business outcome data (certifications obtained, contracts won, revenue impact) for WIOA and foundation grants.
                      - generic [ref=e740]:
                        - generic [ref=e741]:
                          - generic [ref=e742]: "14"
                          - generic [ref=e743]: Features
                        - generic [ref=e744]:
                          - generic [ref=e745]: "7"
                          - generic [ref=e746]: Sends
                        - generic [ref=e747]:
                          - generic [ref=e748]: "6"
                          - generic [ref=e749]: Receives
                      - generic [ref=e750]:
                        - generic [ref=e751]: wioa
                        - generic [ref=e752]: foundation
                        - generic [ref=e753]: ssg-fox
                  - generic [ref=e754]:
                    - generic [ref=e756]:
                      - generic [ref=e757]:
                        - generic [ref=e758]: RPLICE — Research-to-Practice Lifecycle Implementation & Community Evidence
                        - generic [ref=e759]:
                          - generic [ref=e760]: research
                          - generic [ref=e761]: education
                      - link "Open RPLICE — Research-to-Practice Lifecycle Implementation & Community Evidence in a new tab" [ref=e762] [cursor=pointer]:
                        - /url: https://implementationineducatio.com
                        - img [ref=e763]
                    - generic [ref=e767]:
                      - paragraph [ref=e768]: "Free, AI-powered platform that helps researchers, practitioners, and planners close the gap between what science proves works and what actually gets implemented in communities. Search live evidence, assess projects against real community data, build implementation plans, and track outcomes -- all in one place. CFIR 2.0 (Consolidated Framework for Implementation Research), RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance), and EPIS (Exploration, Preparation, Implementation, Sustainment) frameworks applied to every platform's intervention design. Evidence-based practice registry with 500+ validated interventions, fidelity measurement instruments for each platform, research translation tools converting academic findings to community-actionable guides. Collaborative multi-AI review: multiple AI models independently analyze the same document, then a synthesis step builds consensus. API backend: salp-science--mrterryflood.replit.app (Research-Science-Collaborator on Replit). Provides the scientific backbone ensuring every platform's approach is evidence-based and measurable."
                      - generic [ref=e769]:
                        - generic [ref=e770]:
                          - generic [ref=e771]: "13"
                          - generic [ref=e772]: Features
                        - generic [ref=e773]:
                          - generic [ref=e774]: "7"
                          - generic [ref=e775]: Sends
                        - generic [ref=e776]:
                          - generic [ref=e777]: "6"
                          - generic [ref=e778]: Receives
                      - generic [ref=e779]:
                        - generic [ref=e780]: ssg-fox
                        - generic [ref=e781]: foundation
                        - generic [ref=e782]: wioa
                        - generic [ref=e783]: st-davids
                  - generic [ref=e784]:
                    - generic [ref=e786]:
                      - generic [ref=e787]:
                        - generic [ref=e788]: SafeCogniCare
                        - generic [ref=e789]:
                          - generic [ref=e790]: cognitive-health
                          - generic [ref=e791]: health-equity
                      - link "Open SafeCogniCare in a new tab" [ref=e792] [cursor=pointer]:
                        - /url: https://safecognicare.com
                        - img [ref=e793]
                    - generic [ref=e797]:
                      - paragraph [ref=e798]: Cognitive safety platform specializing in TBI (Traumatic Brain Injury), ADHD, dementia, and peripartum cognitive changes — validated cognitive health assessments (MoCA, MMSE, Trail Making), early intervention tools with automated provider alerts, comprehensive safety protocols for cognitive impairment scenarios, care coordination with family/providers/community resources, and family support resources including caregiver burden assessment. Critical for veteran populations (TBI prevalence) and maternal health (peripartum cognitive changes). Integrates with Whole-Person Health for crisis routing, PillScheduler for medication complexity matching to cognitive capacity, Perfectly Different for neurodevelopmental overlap, and M2C for veteran TBI pathways.
                      - generic [ref=e799]:
                        - generic [ref=e800]:
                          - generic [ref=e801]: "12"
                          - generic [ref=e802]: Features
                        - generic [ref=e803]:
                          - generic [ref=e804]: "7"
                          - generic [ref=e805]: Sends
                        - generic [ref=e806]:
                          - generic [ref=e807]: "6"
                          - generic [ref=e808]: Receives
                      - generic [ref=e809]:
                        - generic [ref=e810]: ssg-fox
                        - generic [ref=e811]: st-davids
                        - generic [ref=e812]: foundation
                  - generic [ref=e813]:
                    - generic [ref=e815]:
                      - generic [ref=e816]:
                        - generic [ref=e817]: PillScheduler
                        - generic [ref=e818]:
                          - generic [ref=e819]: medication-management
                          - generic [ref=e820]: health-equity
                      - link "Open PillScheduler in a new tab" [ref=e821] [cursor=pointer]:
                        - /url: https://pillscheduler.net
                        - img [ref=e822]
                    - generic [ref=e826]:
                      - paragraph [ref=e827]: Comprehensive medication management platform for individuals managing complex multi-drug regimens — intelligent pill reminders with adaptive scheduling, dosage tracking with missed-dose protocols, FDA drug interaction database with real-time warnings, care team coordination for medication changes, automated refill alerts with pharmacy integration, medication adherence scoring with intervention triggers, and cognitive-capacity-aware interface that adapts complexity based on SafeCogniCare assessment data. Critical for chronic disease populations (autoimmune, cardiovascular, mental health), elderly patients, and veterans on VA prescriptions. Integrates with Autoimmune Center of Excellence for disease-specific medication protocols, SafeCogniCare for cognitive capacity matching, and Whole-Person Health for crisis routing on dangerous interactions.
                      - generic [ref=e828]:
                        - generic [ref=e829]:
                          - generic [ref=e830]: "14"
                          - generic [ref=e831]: Features
                        - generic [ref=e832]:
                          - generic [ref=e833]: "6"
                          - generic [ref=e834]: Sends
                        - generic [ref=e835]:
                          - generic [ref=e836]: "6"
                          - generic [ref=e837]: Receives
                      - generic [ref=e838]:
                        - generic [ref=e839]: ssg-fox
                        - generic [ref=e840]: st-davids
                        - generic [ref=e841]: foundation
                  - generic [ref=e842]:
                    - generic [ref=e844]:
                      - generic [ref=e845]:
                        - generic [ref=e846]: The Collaborative Advocate
                        - generic [ref=e847]:
                          - generic [ref=e848]: vosb-services
                          - generic [ref=e849]: veteran-services
                      - link "Open The Collaborative Advocate in a new tab" [ref=e850] [cursor=pointer]:
                        - /url: https://thrivingcommunitiesforall.com
                        - img [ref=e851]
                    - generic [ref=e855]:
                      - paragraph [ref=e856]: The organizational entity — IRS-determined 501(c)(3) nonprofit (Letter 947, effective January 14, 2026; EIN 41-3618003; public charity under 170(b)(1)(A)(vi)), veteran-founded, Black-led — serving as the service delivery arm and grant execution lead for the entire ThriveUp ecosystem. Founded by Dr. Terry Flood. SAM.gov Active (UEI KDDVD1FGLW35; CAGE 209N1) — eligible to apply for and receive federal awards directly. Provides veteran advocacy with lived-experience credibility, peer support coordination matching veterans to trained peers, workforce development consulting for employers hiring veterans, and direct grant execution management for WIOA ($200K-$500K), SSG Fox VA ($750K), St. David's (up to $1M), and Foundation ($100K-$500K) grants. The organizational backbone that holds the ecosystem's 501(c)(3) determination, SAM.gov registration, and direct federal-award eligibility.
                      - generic [ref=e857]:
                        - generic [ref=e858]:
                          - generic [ref=e859]: "13"
                          - generic [ref=e860]: Features
                        - generic [ref=e861]:
                          - generic [ref=e862]: "6"
                          - generic [ref=e863]: Sends
                        - generic [ref=e864]:
                          - generic [ref=e865]: "6"
                          - generic [ref=e866]: Receives
                      - generic [ref=e867]:
                        - generic [ref=e868]: ssg-fox
                        - generic [ref=e869]: wioa
                        - generic [ref=e870]: st-davids
                        - generic [ref=e871]: foundation
                  - generic [ref=e872]:
                    - generic [ref=e874]:
                      - generic [ref=e875]:
                        - generic [ref=e876]: Video Creator AI
                        - generic [ref=e877]:
                          - generic [ref=e878]: content-production
                          - generic [ref=e879]: marketing-content
                      - link "Open Video Creator AI in a new tab" [ref=e880] [cursor=pointer]:
                        - /url: https://videocreatorai.com
                        - img [ref=e881]
                    - generic [ref=e885]:
                      - paragraph [ref=e886]: AI-powered content production engine serving the entire 24-platform ecosystem — produces promotional videos, grant presentation decks, training content, marketing materials, platform showcase videos, and holistic ecosystem overview content. Receives authoritative platform identity profiles to ensure accurate representation. Generates content for grant applications (SSG Fox, WIOA, St. David's), conference presentations, stakeholder briefings, and community outreach. Each platform gets a professional public face through consistent branding and messaging. Integrates with Ad Targeting for campaign-ready assets and all platforms for content source material.
                      - generic [ref=e887]:
                        - generic [ref=e888]:
                          - generic [ref=e889]: "12"
                          - generic [ref=e890]: Features
                        - generic [ref=e891]:
                          - generic [ref=e892]: "6"
                          - generic [ref=e893]: Sends
                        - generic [ref=e894]:
                          - generic [ref=e895]: "6"
                          - generic [ref=e896]: Receives
                      - generic [ref=e897]:
                        - generic [ref=e898]: wioa
                        - generic [ref=e899]: ssg-fox
                        - generic [ref=e900]: st-davids
                        - generic [ref=e901]: foundation
                  - generic [ref=e902]:
                    - generic [ref=e904]:
                      - generic [ref=e905]:
                        - generic [ref=e906]: Ecosystem Nexus
                        - generic [ref=e907]:
                          - generic [ref=e908]: ecosystem-coordination
                          - generic [ref=e909]: operations
                      - link "Open Ecosystem Nexus in a new tab" [ref=e910] [cursor=pointer]:
                        - /url: https://ecosystemnexus.net
                        - img [ref=e911]
                    - generic [ref=e915]:
                      - paragraph [ref=e916]: Central coordination and operational intelligence hub for the entire ThriveUp Academy ecosystem — primary co-captain platform providing cross-platform visibility, real-time health monitoring, directive management and enforcement, platform analytics dashboard, and ecosystem-wide operational intelligence. Manages the triad system (team-of-teams architecture), coordinates bilateral exchange protocols, runs self-diagnostic health checks, and provides the operational backbone for the ACOS architecture. If the Whole-Person Health hub goes down, Ecosystem Nexus assumes command authority. Produces operational efficiency data for grant compliance and organizational governance reporting.
                      - generic [ref=e917]:
                        - generic [ref=e918]:
                          - generic [ref=e919]: "12"
                          - generic [ref=e920]: Features
                        - generic [ref=e921]:
                          - generic [ref=e922]: "7"
                          - generic [ref=e923]: Sends
                        - generic [ref=e924]:
                          - generic [ref=e925]: "7"
                          - generic [ref=e926]: Receives
                      - generic [ref=e927]:
                        - generic [ref=e928]: wioa
                        - generic [ref=e929]: ssg-fox
                        - generic [ref=e930]: st-davids
                        - generic [ref=e931]: foundation
                  - generic [ref=e932]:
                    - generic [ref=e934]:
                      - generic [ref=e935]:
                        - generic [ref=e936]: Advertising Targeting for Platforms
                        - generic [ref=e937]:
                          - generic [ref=e938]: ad-intelligence
                          - generic [ref=e939]: marketing-content
                      - link "Open Advertising Targeting for Platforms in a new tab" [ref=e940] [cursor=pointer]:
                        - /url: https://adtargetingplatforms.com
                        - img [ref=e941]
                    - generic [ref=e945]:
                      - paragraph [ref=e946]: Advertising intelligence and community outreach platform enabling data-driven targeting to reach underserved populations with relevant services and grant-funded programs. Advanced audience segmentation based on demographic, geographic, and needs-based data; campaign optimization with A/B testing; performance analytics with conversion tracking; and cross-platform ad delivery coordinating outreach across all 22 sibling platforms. Ensures grant-funded programs reach their intended beneficiaries — veteran families, Black maternal health populations, minority business owners, neurodivergent individuals, and youth at risk. Integrates with Video Creator AI for campaign-ready assets and all platforms for service offering data.
                      - generic [ref=e947]:
                        - generic [ref=e948]:
                          - generic [ref=e949]: "12"
                          - generic [ref=e950]: Features
                        - generic [ref=e951]:
                          - generic [ref=e952]: "6"
                          - generic [ref=e953]: Sends
                        - generic [ref=e954]:
                          - generic [ref=e955]: "6"
                          - generic [ref=e956]: Receives
                      - generic [ref=e957]:
                        - generic [ref=e958]: wioa
                        - generic [ref=e959]: st-davids
                        - generic [ref=e960]: foundation
                        - generic [ref=e961]: ssg-fox
                  - generic [ref=e962]:
                    - generic [ref=e964]:
                      - generic [ref=e965]:
                        - generic [ref=e966]: Pinnacle Business Conglomerate
                        - generic [ref=e967]:
                          - generic [ref=e968]: contractor-enablement
                          - generic [ref=e969]: workforce-contracting
                      - link "Open Pinnacle Business Conglomerate in a new tab" [ref=e970] [cursor=pointer]:
                        - /url: https://pinnaclebusinessconglomerate.com
                        - img [ref=e971]
                    - generic [ref=e975]:
                      - paragraph [ref=e976]: Full-service consulting conglomerate providing cradle-to-grave contractor enablement for minority and veteran-owned businesses. Business diagnostics with MAP-GAP methodology, certification alignment for 8(a)/HUBZone/SDVOSB/WOSB, contract intelligence from SAM.gov pipeline, bid strategy development, teaming partner matching, dual-AI proposal development, execution management with milestone tracking, grant readiness assessment, workforce development pipeline, and international expansion guidance. Serves NAMC Austin and USHCC Blue Wave Initiative as primary institutional clients. Implements the RPLICE Decision Framework for all client engagements. Integrates with MCE for business data, M2C for veteran entrepreneurs, and Better Science Lab for evidence-based business methodology.
                      - generic [ref=e977]:
                        - generic [ref=e978]:
                          - generic [ref=e979]: "17"
                          - generic [ref=e980]: Features
                        - generic [ref=e981]:
                          - generic [ref=e982]: "8"
                          - generic [ref=e983]: Sends
                        - generic [ref=e984]:
                          - generic [ref=e985]: "8"
                          - generic [ref=e986]: Receives
                      - generic [ref=e987]:
                        - generic [ref=e988]: wioa
                        - generic [ref=e989]: st-davids
                        - generic [ref=e990]: ssg-fox
                        - generic [ref=e991]: foundation
                  - generic [ref=e992]:
                    - generic [ref=e994]:
                      - generic [ref=e995]:
                        - generic [ref=e996]: LexiBridge (Speech Bridge)
                        - generic [ref=e997]:
                          - generic [ref=e998]: communication-accessibility
                          - generic [ref=e999]: health-equity
                      - link "Open LexiBridge (Speech Bridge) in a new tab" [ref=e1000] [cursor=pointer]:
                        - /url: https://lexibridge.net
                        - img [ref=e1001]
                    - generic [ref=e1005]:
                      - paragraph [ref=e1006]: Dialect-aware, inclusive communication platform that bridges language and communication gaps for underserved populations. Advanced dialect recognition covering AAVE, Spanglish, Cajun, Appalachian, and 12+ regional dialects; real-time speech-to-text with accessibility features for hearing impairment; multi-language translation (English/Spanish/Vietnamese/Mandarin/Arabic); culturally responsive communication training for providers; patient communication support ensuring health literacy; and inclusive language tools that adapt clinical terminology to community-accessible language. Critical accessibility layer ensuring every platform in the ecosystem can serve populations regardless of language or communication barriers. Integrates with all health platforms for clinical communication, ISSS for school communication, and M2C for veteran communication support.
                      - generic [ref=e1007]:
                        - generic [ref=e1008]:
                          - generic [ref=e1009]: "12"
                          - generic [ref=e1010]: Features
                        - generic [ref=e1011]:
                          - generic [ref=e1012]: "6"
                          - generic [ref=e1013]: Sends
                        - generic [ref=e1014]:
                          - generic [ref=e1015]: "7"
                          - generic [ref=e1016]: Receives
                      - generic [ref=e1017]:
                        - generic [ref=e1018]: st-davids
                        - generic [ref=e1019]: ssg-fox
                        - generic [ref=e1020]: wioa
                        - generic [ref=e1021]: foundation
                  - generic [ref=e1022]:
                    - generic [ref=e1024]:
                      - generic [ref=e1025]:
                        - generic [ref=e1026]: Autoimmune Center of Excellence
                        - generic [ref=e1027]:
                          - generic [ref=e1028]: chronic-disease-management
                          - generic [ref=e1029]: health-equity
                      - link "Open Autoimmune Center of Excellence in a new tab" [ref=e1030] [cursor=pointer]:
                        - /url: https://autoimmunethrive.com
                        - img [ref=e1031]
                    - generic [ref=e1035]:
                      - paragraph [ref=e1036]: Personal health companion for autoimmune disease management built by a founder with autoimmune disease — delivering authentic, lived-experience-informed longitudinal health outcome data. Daily symptom check-ins with trend analysis, flare tracking with trigger identification, medication management with PillScheduler integration, 80+ autoimmune condition database with evidence-based guides, AI health companion providing personalized coaching, appointment prep with provider communication templates, community support with peer matching, and goal setting with progress visualization. PWA mobile app ensures daily engagement. Produces real longitudinal health outcome data (symptom trends, flare frequency, medication adherence, quality of life scores) that no other platform in the ecosystem can generate — this is the chronic disease data engine.
                      - generic [ref=e1037]:
                        - generic [ref=e1038]:
                          - generic [ref=e1039]: "14"
                          - generic [ref=e1040]: Features
                        - generic [ref=e1041]:
                          - generic [ref=e1042]: "8"
                          - generic [ref=e1043]: Sends
                        - generic [ref=e1044]:
                          - generic [ref=e1045]: "8"
                          - generic [ref=e1046]: Receives
                      - generic [ref=e1047]:
                        - generic [ref=e1048]: st-davids
                        - generic [ref=e1049]: foundation
                        - generic [ref=e1050]: wioa
                        - generic [ref=e1051]: ssg-fox
                  - generic [ref=e1052]:
                    - generic [ref=e1054]:
                      - generic [ref=e1055]:
                        - generic [ref=e1056]: Code Canvas — System Evaluator & Optimizer
                        - generic [ref=e1057]:
                          - generic [ref=e1058]: evaluator
                          - generic [ref=e1059]: system-optimization
                      - link "Open Code Canvas — System Evaluator & Optimizer in a new tab" [ref=e1060] [cursor=pointer]:
                        - /url: https://codecanvaseval.com
                        - img [ref=e1061]
                    - generic [ref=e1065]:
                      - paragraph [ref=e1066]: Independent evaluation and optimization engine for ecosystems and platforms. Performs autonomous code audits, architecture analysis, performance profiling, and delivers actionable fixes and recommendations. Evaluates each platform against best practices, identifies gaps, and upon approval implements improvements to make all systems work better together. Designed as the quality assurance backbone for interconnected platform ecosystems. Also available as a System-as-a-Service (SaaS) subscription for external organizations to audit and optimize their own technology ecosystems.
                      - generic [ref=e1067]:
                        - generic [ref=e1068]:
                          - generic [ref=e1069]: "12"
                          - generic [ref=e1070]: Features
                        - generic [ref=e1071]:
                          - generic [ref=e1072]: "6"
                          - generic [ref=e1073]: Sends
                        - generic [ref=e1074]:
                          - generic [ref=e1075]: "6"
                          - generic [ref=e1076]: Receives
                      - generic [ref=e1077]:
                        - generic [ref=e1078]: wioa
                        - generic [ref=e1079]: foundation
                        - generic [ref=e1080]: st-davids
                        - generic [ref=e1081]: ssg-fox
    - navigation [ref=e1082]:
      - link "Home" [ref=e1083] [cursor=pointer]:
        - /url: /hub
        - img [ref=e1085]
        - generic [ref=e1088]: Home
      - link "Serve" [ref=e1089] [cursor=pointer]:
        - /url: /hub/serve
        - img [ref=e1091]
        - generic [ref=e1093]: Serve
      - link "Fund" [ref=e1094] [cursor=pointer]:
        - /url: /hub/fund
        - img [ref=e1096]
        - generic [ref=e1100]: Fund
      - link "Grow" [ref=e1101] [cursor=pointer]:
        - /url: /hub/grow
        - img [ref=e1103]
        - generic [ref=e1108]: Grow
      - link "Connect" [ref=e1109] [cursor=pointer]:
        - /url: /hub/connect
        - img [ref=e1111]
        - generic [ref=e1116]: Connect
    - button "Open AI Navigator" [ref=e1117] [cursor=pointer]:
      - img [ref=e1118]
      - generic [ref=e1121]: Navigator
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
  11 |     await expect(page.getByTestId("page-grant-prior-awards")).toBeVisible();
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
> 22 |     await expect(page.getByTestId("text-stat-platforms")).toContainText("24");
     |                                                           ^ Error: expect(locator).toContainText(expected) failed
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