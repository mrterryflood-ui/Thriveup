# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: youth-mode-thread-resume.spec.ts >> Youth Mode thread resume >> youth-on thread: re-open from history restores toggle and next reply is youth-mode
- Location: tests/e2e/youth-mode-thread-resume.spec.ts:76:3

# Error details

```
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, open '/home/runner/workspace/test-results/.playwright-artifacts-1/traces/7a1705a37c424204b343-eb024e3a8be5295fd9cb.trace'
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
              - generic [ref=e23]: ET
              - generic [ref=e24]:
                - paragraph [ref=e25]: E2E Test
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
                  - generic [ref=e88]: "21"
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
                  - generic [ref=e182]: "16"
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
                  - generic [ref=e411]: "22"
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
              - button "Sign Out" [ref=e466]:
                - img
                - text: Sign Out
            - generic [ref=e467]:
              - generic [ref=e468]:
                - img [ref=e469]
                - generic [ref=e471]: ThriveUp Academy · TCAF · ALC
              - paragraph [ref=e472]: National community-infrastructure platform. Live pilot in Travis County, Texas — the template for the all-50-states + 5-territory rollout via the open Hub Adoption Kit. TCAF is an IRS-determined 501(c)(3) (Letter 947, effective January 14, 2026); SAM.gov Active (UEI KDDVD1FGLW35); CAGE 209N1.
      - generic [ref=e473]:
        - link "Skip to main content" [ref=e474] [cursor=pointer]:
          - /url: "#main-content"
        - banner [ref=e475]:
          - button "Toggle Sidebar" [ref=e476] [cursor=pointer]:
            - img
            - generic [ref=e477]: Toggle Sidebar
          - generic [ref=e479]: ThriveUp
          - generic [ref=e480]:
            - button "Search all pages" [ref=e481] [cursor=pointer]:
              - img
              - generic [ref=e482]: Search
              - generic [ref=e483]: ⌘K
            - button "Accessibility settings" [ref=e484] [cursor=pointer]:
              - img
            - generic [ref=e485]:
              - 'button "Current language: English. Click to change." [ref=e486] [cursor=pointer]':
                - img
                - generic [ref=e487]: 🇺🇸
                - generic [ref=e488]: en
              - button "Enable low-bandwidth mode" [ref=e489] [cursor=pointer]:
                - img
              - button "Switch to dark mode" [ref=e490] [cursor=pointer]:
                - img
        - main [ref=e491]:
          - generic [ref=e493]:
            - generic [ref=e494]:
              - paragraph [ref=e496]: Conversation History
              - generic [ref=e502] [cursor=pointer]:
                - 'button "Im 17 and might lose my # You Can Stay in School — Here''s What That Means Right Now I hear you. Facing the possibility of losing your housing at 17 is heavy, and the fact that you''re thinking about staying in school tells m housing education 8/8/2026" [ref=e503]':
                  - paragraph [ref=e504]: Im 17 and might lose my
                  - paragraph [ref=e505]: "# You Can Stay in School — Here's What That Means Right Now I hear you. Facing the possibility of losing your housing at 17 is heavy, and the fact that you're thinking about staying in school tells m"
                  - generic [ref=e506]:
                    - generic [ref=e507]: housing
                    - generic [ref=e508]: education
                  - paragraph [ref=e509]: 8/8/2026
                - button "Delete conversation" [ref=e510]:
                  - img [ref=e511]
              - button "New Conversation" [ref=e515] [cursor=pointer]:
                - img
                - text: New Conversation
            - generic [ref=e516]:
              - generic [ref=e517]:
                - generic [ref=e518]:
                  - img [ref=e519]
                  - generic [ref=e522]:
                    - heading "ThriveUp Navigator" [level=1] [ref=e523]
                    - paragraph [ref=e524]: 4-engine parallel analysis · DeepSeek R1 deep thinking
                - button "New" [ref=e526] [cursor=pointer]:
                  - img [ref=e527]
                  - generic [ref=e529]: New
              - log "Navigator conversation" [ref=e533]:
                - generic [ref=e535]:
                  - generic [ref=e537]: I'm 17 and might lose my housing, can I stay in school?
                  - img [ref=e539]
                - generic [ref=e542]:
                  - generic [ref=e543]:
                    - img [ref=e545]
                    - generic [ref=e549]:
                      - text: "# You Can Stay in School — Here's What That Means Right Now"
                      - text: I hear you. Facing the possibility of losing your housing at 17 is heavy, and the fact that you're thinking about staying in school tells me you care about your future. The answer is yes — you absolutely can stay in school, and there are real legal protections and people whose job it is to help you do that.
                      - text: "## The Legal Protection You Have"
                      - generic [ref=e550]:
                        - text: There's a federal law called the
                        - strong [ref=e551]: McKinney-Vento Homeless Assistance Act
                        - text: "that exists specifically to protect students like you. Here's what it guarantees:"
                      - generic [ref=e552]:
                        - generic [ref=e553]: •
                        - generic [ref=e554]:
                          - strong [ref=e555]: You can enroll immediately.
                          - text: You don't need a permanent address, birth certificate, medical records, or any other paperwork that might be hard to get right now. Bring whatever you have, and they have to admit you.
                      - generic [ref=e556]:
                        - generic [ref=e557]: •
                        - generic [ref=e558]:
                          - strong [ref=e559]: You can stay in your current school.
                          - text: Even if your living situation changes and you move to a different part of town or a different city, you have the right to keep going to your school of origin. The district has to provide transportation to get you there — you don't have to figure that out on your own.
                      - generic [ref=e560]:
                        - generic [ref=e561]: •
                        - generic [ref=e562]:
                          - strong [ref=e563]: You get the same access as everyone else.
                          - text: Free lunch, after-school programs, tutoring, counseling — if it exists at your school, you're entitled to it.
                      - text: This isn't a favor. It's your right.
                      - text: "## The Person Who Can Actually Help You Right Now"
                      - generic [ref=e564]:
                        - text: Every school district has someone called a
                        - strong [ref=e565]: Homeless Liaison
                        - text: "— this is literally their job. They know this law cold, they've helped other students in your exact situation, and they can move fast. Find them by:"
                      - generic [ref=e566]:
                        - generic [ref=e567]: •
                        - generic [ref=e568]: Asking a counselor, trusted teacher, or administrator at your school, "Who is the homeless liaison?"
                      - generic [ref=e569]:
                        - generic [ref=e570]: •
                        - generic [ref=e571]: Checking your school district's website (search "[Your District Name] homeless liaison")
                      - generic [ref=e572]:
                        - generic [ref=e573]: •
                        - generic [ref=e574]: Calling your school's main office and asking them directly
                      - text: When you talk to them, be honest about what's happening with your housing. That's what they're there for. They can help with enrollment, transportation, and they often know about emergency housing resources too.
                      - text: "## Right Now: What You Need Most"
                      - generic [ref=e575]:
                        - strong [ref=e576]: "First:"
                        - text: Get to your school's homeless liaison this week. That's step one. You don't have to wait until you've actually lost your housing — if you're at risk, you qualify now.
                      - generic [ref=e577]:
                        - strong [ref=e578]: "Second:"
                        - text: If you need a safe place to stay *tonight* or very soon, call the
                        - strong [ref=e579]: National Runaway Safeline at 1-800-786-2929
                        - text: . They're available 24/7, they won't judge you, and they can help you find emergency shelter in your area. You can also text HOME to 66008.
                      - generic [ref=e580]:
                        - strong [ref=e581]: "Third:"
                        - text: If you're in the Austin, Manor, or Pflugerville area, call
                        - strong [ref=e582]: "211"
                        - text: (it's free from any phone) or visit
                        - strong [ref=e583]: lifetransitionsaid.org
                        - text: . This service connects you to housing, food, healthcare, and other emergency help. It's not a judgment call — it's a navigation service. Tell them you're a young person at risk of homelessness, and they'll match you with what exists in your community right now.
                      - text: "## Thinking Ahead"
                      - generic [ref=e584]:
                        - text: "I know staying in school might feel like a lot when you're worried about where you're sleeping. But here's why it matters: staying enrolled keeps doors open. If you're thinking about college, the"
                        - strong [ref=e585]: FAFSA
                        - text: (Free Application for Federal Student Aid) has special rules for unaccompanied youth experiencing homelessness. That means you can apply for financial aid *without* needing your parents' information. Your school's homeless liaison can help you with this.
                      - text: Even if college isn't your next move, staying in school also means you're in a building with adults who care, access to meals, and a routine that can keep you grounded when everything else feels uncertain.
                      - text: "## You're Not Alone"
                      - text: A lot of young people are in this situation. The system knows this happens, and these protections exist because people fought for them. Using them isn't weakness — it's smart.
                      - text: "Take the first step: find your homeless liaison or call 211 this week. You deserve to stay in school and to have a safe place to sleep. Both of those things can happen."
                      - text: What do you need help with right now — finding the liaison, figuring out what to say to them, or getting information about emergency housing in your specific area?
                  - generic [ref=e586]:
                    - button "Copy" [ref=e587] [cursor=pointer]:
                      - img [ref=e588]
                      - generic [ref=e591]: Copy
                    - button "Export" [ref=e592] [cursor=pointer]:
                      - img [ref=e593]
                      - generic [ref=e596]: Export
                    - button "Save as Initiative" [ref=e597] [cursor=pointer]:
                      - img [ref=e598]
                      - generic [ref=e600]: Save as Initiative
                - generic [ref=e602]:
                  - generic [ref=e604]: What should I do first?
                  - img [ref=e606]
                - generic [ref=e610]:
                  - img [ref=e612]
                  - generic [ref=e617]:
                    - img [ref=e618]
                    - generic [ref=e620]: Thinking...
              - generic [ref=e622]:
                - generic [ref=e623]:
                  - generic [ref=e624]: "Response depth:"
                  - button "Quick" [ref=e625] [cursor=pointer]
                  - button "Detailed" [ref=e626] [cursor=pointer]
                  - button "Full Report" [ref=e627] [cursor=pointer]
                  - switch "Youth Mode On" [checked] [ref=e629] [cursor=pointer]
                - paragraph [ref=e630]: Youth Mode is on — responses use youth-friendly language, include your rights, and put safety first.
                - generic [ref=e631]:
                  - button "Attach PDF, .txt, or .md — click multiple times to add more" [disabled] [ref=e632]:
                    - img [ref=e633]
                  - textbox "Message to the Navigator assistant" [disabled] [ref=e635]:
                    - /placeholder: Ask anything — paste a URL, upload a doc, or type your question... (Ctrl+Enter to send)
                  - button "Send message" [disabled]:
                    - img
                - paragraph [ref=e636]: Attach PDFs · .txt · .md · Paste any URL to fetch content · Ctrl+Enter to send · Not a substitute for professional advice
    - navigation [ref=e637]:
      - link "Home" [ref=e638] [cursor=pointer]:
        - /url: /hub
        - img [ref=e640]
        - generic [ref=e643]: Home
      - link "Serve" [ref=e644] [cursor=pointer]:
        - /url: /hub/serve
        - img [ref=e646]
        - generic [ref=e648]: Serve
      - link "Fund" [ref=e649] [cursor=pointer]:
        - /url: /hub/fund
        - img [ref=e651]
        - generic [ref=e655]: Fund
      - link "Grow" [ref=e656] [cursor=pointer]:
        - /url: /hub/grow
        - img [ref=e658]
        - generic [ref=e663]: Grow
      - link "Connect" [ref=e664] [cursor=pointer]:
        - /url: /hub/connect
        - img [ref=e666]
        - generic [ref=e671]: Connect
    - button "Open AI Navigator" [ref=e672] [cursor=pointer]:
      - img [ref=e673]
      - generic [ref=e676]: Navigator
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
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
  117 |     await expect(toggle).toContainText("Youth Mode On", { timeout: 10_000 });
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
> 129 |     await ctx.close();
      |               ^ Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, open '/home/runner/workspace/test-results/.playwright-artifacts-1/traces/7a1705a37c424204b343-eb024e3a8be5295fd9cb.trace'
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