# ThriveUp Demo Door — Build Spec & Acceptance Criteria

**Status:** Architect plan for the Replit builder (executor role). Independent reviewer = Perplexity (this document's author).
**Repo/branch:** `mrterryflood-ui/Thriveup` → `chore/replit-exit-inventory` (current tip `0ad5f3b`). Non-main branch push only; no production flip, no provider cutover.
**Meeting deadline:** Wednesday, **October 14, 2026, 2:30–3:30 PM** — "ISS/Dr. Flood chat" (Google Meet; organizer Tamra Mangum, Hutto ISD; guests include Hutto Chamber, district staff). A separate community-bank meeting is also in motion. The demo door must be presentable by **Oct 13** with a buffer day.

---

## 1. Purpose

One stakeholder-facing **demo door** that lets schools and universities, community banks, governments, and community entities *see* what ThriveUp produces, for whom, in their own geography — tied to real tools and URLs that already exist in the platform — with images, charts, real platform data, reporting previews, and a path to go live in the meeting itself.

This is the rollout, funding, and ROI-legibility vehicle: "this platform already contains the operating system; here is the door that makes it legible to funders."

**What this is NOT:** a fourth navigation system, a claims page with unsourced numbers, or a new backend. Everything shown either (a) runs today with real data, (b) is a format example carrying no city data, or (c) is a cited external benchmark. **Never synthetic data about a city.**

---

## 2. Before → Target

| | Before | Target |
|---|---|---|
| Stakeholder experience | Tools exist (373 classified routes) but a bank president, superintendent, or city manager has no single surface that shows them *their* value path | `/demo` — one door, audience selector, their place, their story, live tools |
| ROI story | Value claims scattered across product pages | Value chain per audience: need → network → alignment → participation → measurable outputs (pathway, not fabricated dollars) |
| Mock vs live | No rule | Real data only: live platform data with source and date, or cited external benchmarks; format examples use placeholders with no city. Never synthetic data about a city |
| Meeting readiness | Demo = walking someone through the live app with no frame | Presentation-safe deep links (`/demo?audience=banks&place=78634&present=1`) with zero auth surprises |

---

## 3. Design decisions (binding)

1. **One canonical door.** Route `/demo`. NOT four separate pages. The four stakeholder groups are a selector (query param `audience`), exactly like the outcome landings pattern. Shareable aliases may redirect (e.g., `/demo/banks` → `/demo?audience=banks`) but render the same component.
2. **Default audience = banks.** The nearest-term funding meeting is bank-centered. `/demo` with no params opens the Community Banks view. Tabs for Schools & Universities, Governments, Community Entities remain first-class.
3. **Registry is the only link source.** Every "Open the live tool" button resolves through `shared/route-nav.ts` (`navRoute` + `canSeeRoute` + legacy predicate), and every audience view lists only routes that exist in `route-registry.classified.ts`. No hardcoded URL lists in the demo component. The demo door itself gets a registry entry (see §5).
4. **Place-first.** Every audience view carries a place selector (ZIP / county / city) using the same pattern as the outcome landings: no default city, explicit place, journey place only when signed in. Deep links accept `place=78634` (Hutto) or `place=county:48491` (Williamson).
5. **Three data lanes, three badges — everywhere. Real data only.**
   - **Live platform data** — actual route/tool output rendered inside the demo (e.g., Community Gravity counts, ZIP conditions). Label states the source route and date. If the live route errors, show "Live data unavailable in this preview" — never a stand-in number.
   - **External benchmark** — cited statistic (Statista, Wiley, PitchBook) with publisher, year, and source URL in a footnote card.
   - **Format example** — report-layout previews with placeholder fields and no city name, geography, or invented statistics. Badge reads: `Format example — report layout, not data.`
   - **Hard rule: no synthetic data about any city.** Every number shown for a real place (Hutto, 78634, Williamson County) comes from live routes or cited benchmarks.
6. **No fabricated ROI.** The demo shows an **ROI pathway** (value chain) and an explicit "measurable once local data is connected" statement. No dollar savings, no correlation claims, no percentage outcomes unless produced by a live platform tool or a cited benchmark.
7. **Photorealistic imagery follows the existing landings standard.** Generated architectural photography consistent with `client/src/assets/generated_images/`, each labeled "Illustrative AI-generated imagery, not program photography." Do not reuse the six outcome-landing images; commission a small set for the demo door (one per audience view).
8. **Presentation mode.** `present=1` query param (and any `/demo` visit): the demo route joins the `focusedEntry` predicate in `App.tsx` so the floating Navigator/help buttons never collide during a meeting (same fix as the outcome landings, commit `b70d929`). Meeting mode hides sign-in prompts, staff-only links, and any element that 401s anonymously.

---

## 4. Route plan

```
/demo                        → DemoDoor (defaults audience=banks)
/demo?audience=banks         → Community Banks view
/demo?audience=schools       → Schools & Universities view
/demo?audience=governments   → Governments & Agencies view
/demo?audience=entities      → Community Entities & Nonprofits view
Optional: &place=78634 &present=1
```

**Registry entry (add to `lane-connect-fund-data.ts`):**

```ts
"/demo": {
  title: "Stakeholder Demo Door",
  description: "See what ThriveUp produces for schools, banks, governments, and community entities in a chosen place, with labeled stories, live tools, and reporting previews.",
  outcome: "fund",
  audiences: ["funder-evaluator", "agency-government", "nonprofit-cbo", "students-youth"],
  upstream: ["/hub/fund", "/community-banks"],
  downstream: ["/community-banks", "/academy", "/corridor-intelligence", "/partners"],
  guide: "Need to show stakeholders the platform → Stakeholder Demo Door → choose audience and place, open a live tool",
  access: "public"
},
```

Also: add `/demo` links into the **Community bank impact view** (`/community-banks` "For your stakeholders" affordance), the **academy hub**, and `/partners` — one inbound link each, no scattered listings.

---

## 5. Audience views

Each view has the same five-section skeleton (balanced simple surface, drill-downs optional):

1. **Hero** — photoreal image, headline, 2-sentence value statement, place selector, audience tabs.
2. **Value chain** — the ROI pathway as a horizontal 5-step diagram (need → network → alignment → participation → measurable outputs), each step linked to the tool that produces it.
3. **Story + charts** — one curated data story with 2–3 charts in the three lanes (§6).
4. **Live tools** — registry-driven list of 5–8 routes for this audience with descriptions, "Open the live tool" buttons (place carried in query).
5. **Reporting preview + go-live checklist** — what reporting exists today, what a mock report format looks like, and the operational path to run this in their community.

### 5.1 Community Banks (default)

| Element | Content | Lane |
|---|---|---|
| Headline | "See your assessment area like never before — and act on it." | — |
| Value chain | ZIP-level need (→ `/community-analysis`) → who does the work (→ `/community-gravity`) → CRA / community-development alignment (→ `/community-banks`) → referrals & participation (→ `/partners/join`) → modeled intervention costs & benefits (→ `/chainweb`) → measurable outputs (→ `/outcomes`) | Live |
| Story A | "A Hutto family, end to end": need (`/411`) → eligibility (`/benefits-screener`) → family follow-through (`/parents/dashboard`) → learning (`/academy/financial-literacy`) → earning (`/academy/careers`) → documented outcome (`/outcome-reporting`) — then zoom out to the bank's lens: the same place in `/community-gravity` → `/corridor-intelligence` → `/chainweb` → `/community-banks`. Every number is real platform data carrying its route and date. | Live walkthrough |
| Chart A1 | US community bank count 17,401 (1984) → 6,146 (2013). Source: FDIC via Statista. | External benchmark |
| Chart A2 | Organizations doing the work near the chosen place (live Community Gravity counts by domain). Source route + date on label. | Live platform data |
| Chart A3 | Quarterly "community engagement report" layout with placeholder fields — no city named, no synthetic numbers: "what your report will look like." | Format example |
| Benchmark card | Unbanked households: 23.3% under $15k income; 13.8% of Black households; 21%+ where family head has no high school diploma (FDIC via Statista, 2019) — deposit-growth and inclusion framing. | External benchmark |
| Benchmark card | Category validation: findhelp (US community resource navigation) raised $304M total funding; comparable platforms include Unite Us, Healthify, NowPow, Eccovia (PitchBook). Framing: "institutions already pay for this category." | External benchmark |
| Funding ask | "You already fund United Way and 211 in this community — keep doing it. Those dollars fund the *find help* step. The same investment goes much deeper here: through eligibility, stability, learning, and earning to a documented outcome. `/chainweb` models intervention costs and benefits, so leadership sees the return on community thriving, not just the spend." Respectful extension of existing CRA and philanthropy budgets, not a replacement ask. | Narrative (no data lane) |
| CTA | "Scope your assessment area now" → `/community-banks?place=<place>` |

### 5.2 Schools & Universities

| Element | Content | Lane |
|---|---|---|
| Headline | "One campus for student readiness, family support, and evidence." | — |
| Value chain | Student learning (→ `/academy`) → family support (→ `/411`, `/benefits-screener`) → progress & evidence (→ `/academy/progress-report`, `/academy/longitudinal`) → community partners (→ `/partners`) → district reporting (→ `/outcomes`) | Live |
| Story B | "A district connects students and families": academy adoption per campus → financial-literacy completion → family resource referrals → longitudinal dashboard — live tools, real district place. | Live walkthrough |
| Chart B1 | Academy capability map (live registry: careers, financial literacy, mentor finder, competitions, progress report, longitudinal dashboard). | Live platform data |
| Chart B2 | "Campus readiness report" layout with placeholder fields — no city, no invented statistics. | Format example |
| Benchmark card | Evaluation-before-launch principles (Wiley, *Advancing Health Literacy*): begin evaluation before program start; indicators reflect design and goals; well-designed evaluation is worth the expense. Framing: ThriveUp builds measurement in from day one. | External benchmark |
| CTA | "Open the academy" → `/academy`; "See the rollout roadmap" → `/academy/phased-rollout` |

### 5.3 Governments & Agencies

| Element | Content | Lane |
|---|---|---|
| Headline | "County-level evidence to coordination, without a data team." | — |
| Value chain | Community evidence (→ `/corridor-intelligence`, `/data`) → policy comparison (→ `/policy-engine`, `/city-comparison`) → coalition coordination (→ `/coalition`) → shared outcomes (→ `/outcomes`, `/transparency`) | Live |
| Story C | "A city sees who is doing the work": county intelligence → evidence vault → childcare coalition coordination → transparent reporting — live tools, real county. | Live walkthrough |
| Chart C1 | County intelligence surface (live: sourced county conditions, coalition context). | Live platform data |
| Chart C2 | "Quarterly community coordination report" layout with placeholder fields — no city, no invented statistics. | Format example |
| CTA | "Open county intelligence" → `/corridor-intelligence`; "Where we operate" → `/coverage` |

### 5.4 Community Entities & Nonprofits

| Element | Content | Lane |
|---|---|---|
| Headline | "Your organization, visible and coordinated." | — |
| Value chain | Org profile (→ `/onboarding/org`) → partner network (→ `/partners`) → referrals & warm handoffs (→ `/collaboration-hub`) → effectiveness (→ `/partner-scorecard`) → data integration (→ `/agency-connector`) | Live |
| Story D | "A nonprofit joins the network": IRS-record visibility (gravity) → partnership → referrals → scorecard — live tools, real organization records. | Live walkthrough |
| CTA | "Join as a partner" → `/partners/join` |

---

## 6. Data stories — real-data-only rules

- **Never synthetic data about a city.** Any number shown for a real place (Hutto, 78634, Williamson County) comes from live platform routes or cited external benchmarks. If live data is unavailable for a place, the demo shows "Live data unavailable in this preview" — never a stand-in number.
- **Format examples** (report layouts, chart shapes) use placeholder fields with no city name, no geography, and no invented statistics. Badge: `Format example — report layout, not data.`
- Live charts state their source route and date; benchmarks carry publisher, year, and URL.
- `shared/demo-stories.ts` holds narrative copy and format templates only — no synthetic community statistics, ever.
- This rule is a gate (G2). The reviewer fails any build that shows an invented number next to a real place name.

---

## 7. Reporting preview

- Section 5 of every audience view embeds a **report preview panel**: a high-fidelity format example of the report (brand-consistent, PDF-like card layout) with placeholder fields and no city data, next to a "Generate a real one" button into the existing live reporting routes: `/community-story-pack` (community data story + downloadable reports + slides), `/outcomes` (outcome measurement), `/academy/progress-report` (schools).
- No new export engine. The preview demonstrates format; live links demonstrate function.

---

## 8. Go-live & operations section

Every audience view ends with the same operational checklist (the "actual operations" the user asked for), linking to existing routes:

1. **Invite partners** → `/partners/join`, `/onboarding/org`
2. **Select your place** → place selector on `/demo` and landings
3. **Connect your data** → `/agency-connector`, `/api-docs`
4. **Run the work** → audience workspace (`/workspaces`, `useWorkspace`)
5. **Report outcomes** → `/outcomes`, `/community-story-pack`, `/transparency`

In-meeting "go live" = the presenter switches from mock story to live tool in the same tab (deep links carry place), demonstrating the platform is real today. That switch moment is the demo's climax — rehearse it.

---

## 9. Builder task order (9 days to Oct 14)

| Day | Task |
|---|---|
| 1 | `DemoDoor` skeleton: route, registry entry, audience tabs, place selector, presentation-mode predicate in `focusedEntry` |
| 2 | `shared/demo-stories.ts` (copy + format templates only) + badge components (Live platform data / External benchmark / Format example) + value-chain diagram component |
| 3 | Banks view complete (Story A, charts A1–A3, benchmark cards, live tool list, CTA) |
| 4 | Reporting preview panel + go-live checklist section |
| 5 | Schools view |
| 6 | Governments + Entities views |
| 7 | Imagery generation (4 labeled photorealistic images), typography/contrast pass, deep-link verification for every "Open the live tool" button |
| 8 | tsc 0, build, Playwright (anonymous presentation flow at 375/1024/1440), screenshots `screenshots/demo-door/`, `.verification/2026-10-XX-demo-door.md` record |
| 9 | Buffer + independent review |

---

## 10. Acceptance gates (reviewer enforces)

- **G1 — One door, registry-driven.** No hardcoded route lists; every link resolves via `route-nav.ts`; `/demo` present in the classified registry with access rules.
- **G2 — Real data only.** No synthetic data about any city, ever; every place-specific number is live platform data or a cited benchmark; format examples carry placeholders only.
- **G3 — No fabricated ROI.** Value chains only; "measurable once local data is connected" statement present in all four views; no dollar/percentage outcomes from mock data.
- **G4 — Meeting-safe.** Anonymous visit to `/demo?audience=banks&place=78634&present=1` shows zero auth walls, zero floating-widget collisions (Navigator/help suppressed), no 401s; verified at 375/1024/1440.
- **G5 — Every audience has one clear CTA** into a live tool that actually works with the chosen place.
- **G6 — Non-destructive.** Additive change only; no deletions; `git diff --check` clean; main branch untouched.
- **G7 — Quality proof.** tsc 0, build 0, Playwright pass, screenshots reviewed for clipped text/overlap/contrast (five-pillar standard), verification record committed.
- **G8 — Benchmark citations.** External stats carry publisher + year + source URL in the UI footnote, matching §11.

---

## 11. Benchmark evidence (pre-cleared, with sources)

- Community banks in the US fell from 17,401 (1984) to 6,146 (2013) — [Statista/FDIC](https://cashmere.io/v/FNLn63RQ7).
- Unbanked households (2019): 23.3% with family income below $15k; 0.6% above $75k — [Statista/FDIC](https://cashmere.io/v/uTZl4QmK4); 13.8% of Black households — [Statista/FDIC](https://cashmere.io/v/XUHxtDZN5); 21%+ where family head lacks a high school diploma — [Statista/FDIC](https://cashmere.io/v/HcP27oDVx).
- findhelp (US community resource navigation) has raised $304M in total funding; similar platforms: Healthify, NowPow, Eccovia, Unite Us — [PitchBook](https://cashmere.io/v/EhdolS31L).
- Evaluation principles (begin evaluation before program start; indicators reflect design; evaluation is worth the expense) — [Wiley, *Advancing Health Literacy*](https://cashmere.io/v/JAzexyLXq).
- Similarweb traffic benchmarks: **unavailable** — the Similarweb plan reached its credit limit (Oct 2026). Do not cite traffic numbers in this build; mark the slot "traffic benchmark pending" or omit.

**Staleness rule:** before the meeting, re-verify any number shown on screen; if a benchmark is older than 2019 (FDIC series), label the year prominently rather than dropping the stat.

---

## 12. The complete chain — what the platform actually is

Verified from the route registry (373 classified routes). ThriveUp is not a directory or a referral network. It is **four interlocking chains plus the links between them**:

**1. The resident chain — crisis to career to documented outcome.**
Reach & intake (`/intake`, `/411`, `/get-help`) → eligibility (`/benefits-screener`, `/fafsa-navigator`, `/workforce-pell`) → stability (`/safe-passage` suite: safety planning, housing assessment, housing finder, legal navigator; `/reentry`, `/behavioral-health`) → learn (`/academy`: lessons, financial literacy, STAAR prep, trade sims, quests, wallet, mentor finder) → earn (`/academy/careers`, `/jobs` fair-chance board, `/resume-builder`, `/mos-translator`, `/workforce` pipeline, `/certificates`) → follow-through (`/my-journey`, `/align/my-journey`, transition plans for foster youth and reentry, `/my-household`, `/parents/dashboard`) → measurement (`/academy/progress-report`, `/academy/longitudinal`, `/outcome-reporting`, `/wioa-outcomes`, outcome receipts).

**2. The organization chain.** `/onboarding/org` → `/align/org-assessment` → `/partners` → `/collaboration-hub` (referrals, warm handoffs) → `/partner-scorecard` → `/agency-connector` (data integration) → `/coalition` operations → `/advisory-board` governance.

**3. The community/place chain.** `/community-gravity` (who does the work — IRS-sourced) → `/neighborhood` → `/corridor-intelligence` (county) → `/sdoh-explorer` → `/community-analysis` → `/community-impact` (scenarios) → `/chainweb` (intervention cost-benefit modeling) → `/equity-loss` → `/policy-engine` → `/city-comparison` → `/civic-signal`; with evidence integrity throughout (`/corridor/evidence` vault, `/methodology`, `/research-hub`, `/peer-review`).

**4. The funding chain.** `/grant-conduit` → `/ceds` alignment → `/logic-model` → `/community-story-pack` → `/community-banks` → `/donors` (support documented outcomes) → `/for-agencies` (adoption funding).

**The links between the chains — the actual differentiator.** One journey record connects the person to a place (`use-magnet-journey-place`), a household, an organization's scorecard, a county's evidence vault, and a funder's story pack. A documented outcome can become a donor receipt. A resident's progress becomes an org's effectiveness score. An org's filing becomes community gravity. No competitor connects these layers; each sells one link.

**Demo spine (all audiences):** walk ONE linked journey live — a Hutto family: `/411` → `/benefits-screener` → `/parents/dashboard` → `/academy/financial-literacy` → `/academy/careers` → `/outcome-reporting` — then zoom out to the place layer: `/community-gravity` → `/corridor-intelligence` → `/community-banks`. Person → family → org → community → funder, one system, one chain of custody for every number shown.

## 13. Differentiation claim — revised after full-platform review

**Claim for the meeting:** "Everyone else sells one link of the chain. findhelp finds help. Unite Us closes a referral loop. Case-management systems track an agency's own clients. Collective-impact tools measure. ThriveUp runs the whole chain — find help, screen eligibility, navigate safety and housing, learn, earn, and measure the outcome — and links that journey to the organizations doing the work, the place-level evidence, and the funding that sustains it, in one system where a documented outcome can become a donor receipt."

| Lifecycle stage | Who covers it | Where they stop |
|---|---|---|
| FIND (search) | findhelp ([every ZIP](https://organizations.findhelp.com/united-way-and-2-1-1/)), 211 ([99% of population](https://nj211.org/sites/default/files/documents/2023-05/United_Way_s_211_Report_2023.pdf)) | Directory + referral; no follow-through |
| REFER (closed loop) | Unite Us ([closed-loop referrals](https://uniteus.com/products/closed-loop-referral-system/), [per-region networks](https://uniteus.com/networks/georgia/)), NowPow | Health + social care, inside procured networks |
| TRACK (case management) | Bonterra Apricot ([agency case management](https://www.bonterratech.com/product/apricot)), Eccovia ClientTrack ([community systems of care](https://eccovia.com/case-management/)) | Agency-side, staff-operated back office; residents don't self-serve; no education, workforce, or funding layer |
| EMPLOY (workforce) | myOneFlow ([workforce + adult ed case management](https://www.myoneflow.com/features)), TraxSolutions | Single agency's programs |
| MEASURE (collective impact) | Clear Impact Scorecard ([shared outcome data](https://clearimpact.com/go/collective-impact-software/)) | Measurement only; no service delivery |
| COMMUNITY OS | Visionlink (["Community Operating System" for service management and disaster relief](https://www.visionlink.org/about/)) | Service management, not wraparound lifecycle |
| ALL STAGES, LINKED | **ThriveUp** | — |

**The boundary to state before they ask:** per-link competitors are deep and mature in their link — findhelp's directory is unmatched, Apricot is excellent case management. The distinction is not beating any single link; it is that nobody else connects a resident's outcome to a bank's assessment area, a coalition's scorecard, and a county's evidence vault in one system.

**Own-house honesty (do not skip):** ThriveUp's nationwide coverage today is data-level (IRS, Census, public sources; e.g., Community Gravity's 8,782 Travis-primary-ZIP organizations) — not an enrolled partner network in every city, and the full chain is live where adopted. Say: "Built for every city; live where we operate; every link exists today in the product." Never claim existing longitudinal outcome data for places not yet adopted.

**Meeting move:** "Which link does your current stack cover — and who connects them?" That question lands harder than any feature list, because the honest answer at most institutions is nobody.

## 14. Before → Changed → Why → Proof → Limits (this plan)

- **Before:** No stakeholder demo surface; value story assembled ad hoc per meeting; mock/live distinction unmanaged. First correction: finding help is one step — the platform follows through end to end. Second correction: never synthetic data about a city; the demo is real-data-only, with the chainweb cost-benefit model at the center of the funding story.
- **Changed:** Spec now grounds the demo in the complete-chain capability map (§12), a real-data-only policy (§3, §6, gate G2), a chainweb-centered ROI narrative and United Way-respectful funding ask (§5.1), plus a journey-walk demo spine and a stage-by-stage market matrix (§13). `/demo` design unchanged: one door, four audience views, reporting previews, go-live checklist, 9-day build order, 8 acceptance gates.
- **Why:** The Oct 14 Hutto ISD/Chamber meeting and the community-bank meeting need a repeatable, honest demonstration of an integrated system; funders respond to "the operating system already exists, here is the door."
- **Proof:** Every tool/URL named above exists in the registry at branch tip `0ad5f3b` (373 classified routes verified by extraction); benchmarks carry live source URLs; the design reuses verified patterns (outcome landings, place selector, `focusedEntry`).
- **Limits:** Not yet built — this is the architecture. Live-data behavior inside the demo depends on the routes' own availability (some aggregate views are authenticated-only and will be shown as "signed-in snapshot" per existing patterns). Similarweb benchmarks unavailable. Hutto-specific ZIP conditions depend on live platform data at demo time; rehearse with the actual place before the meeting.

## Five-pillar quality check (plan)

- **Product & UX:** one door, audience selector, place-first, balanced surface with drill-downs; consistent with the six-outcome IA.
- **Engineering & Scale:** additive front-end only; registry-driven links; no new backend; single mock-data file.
- **Security & Access:** demo public; all gated tools preserve existing access; meeting mode hides auth friction without bypassing permissions.
- **Marketing & Revenue:** ROI pathway framing per audience; benchmark-cited category validation; clear CTA into live tools.
- **Legal & Compliance:** no fabricated outcomes; illustrative imagery and mock stories labeled; external stats attributed with year and publisher; CRA framing avoids regulatory claims (say "community-development alignment," not "CRA compliance guarantee").
