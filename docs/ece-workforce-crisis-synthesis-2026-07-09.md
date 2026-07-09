# Austin/Travis County ECE Workforce Crisis — Synthesis & Platform Gap Analysis

**Source:** United Way for Greater Austin, ECE Provider Survey ("Overall Results" through "Next Steps" deck), reviewed 2026-07-09.
**Purpose:** Weave the survey findings into one causal picture, map it against what TCAF/ThriveUp Academy can currently do, and name explicitly what neither the survey's own plan nor the current platform covers.

---

## 1. The causal chain the survey shows (but doesn't say out loud)

The deck presents ~15 individually-true findings as a flat list. Read in sequence, they are one feedback loop:

```
Low ECE wages ($20/hr lead, $16/hr assistant — below Travis County living wage)
        │
        ▼
Teacher turnover >40%/yr, small + under-qualified applicant pools
        │
        ▼
Providers can't staff classrooms they're licensed for
        │
        ▼
Combined/closed classrooms, reduced enrollment caps (37–56% of providers report this)
        │
        ▼
Enrolled at 64% of licensed capacity, 73% of desired capacity
        │
        ▼
Lost tuition + subsidy revenue → "financial fragility" (51% cite this as top challenge)
        │
        ▼
Can't raise wages competitively → loop repeats
```

Meanwhile, **on the other side of the same market**, 51% of providers report a waitlist totaling 3,912 children. Empty seats and thousands of waiting families coexisting is the signature of a **staffing-capacity failure**, not a demand or pure funding failure — if it were only about money, providers would be full and simply expensive; instead they are simultaneously understaffed, under-enrolled, and financially fragile.

**The strongest single data point in the whole deck:** the 2025 and 2016 funding-priority lists are nearly identical (both led by "increase staff salaries," both include facility upgrades, staff benefits, teacher pipeline). A decade of asking for the same fix with no movement means **the fix itself doesn't reach the root cause** — it treats a symptom that regenerates.

---

## 2. What the data reveals that the deck doesn't name

| Signal in the data | What it actually indicates |
|---|---|
| Subsidy-accepting providers are *more* under-enrolled in 3+ age groups (76%) than non-subsidy providers (46%) | Subsidy reimbursement rates likely sit **below the true cost of delivering care** — taking subsidized kids strains staffing rather than stabilizing revenue. This is a rate-design/policy problem, not a "providers need a grant" problem. |
| "Higher salary" and "change of career" tie at 32% as reasons teachers leave | People are leaving the **field**, not just this employer for a better-paying one. ECE isn't holding up as a viable career path at all. |
| 573 open slots are Preschool-4 (cheapest ratio to staff); infant/toddler slots are scarcest | The waitlist (3,912 kids) and open slots (2,562) are being read as if they net against each other. They almost certainly don't — families need infant/toddler care; providers have preschool openings. This is a **mismatch problem**, not a raw shortage. |
| 50%+ of directors have run their program >10 years | A hidden **leadership succession cliff**. Not flagged as urgent anywhere in "Next Steps," but retirement without a director pipeline threatens more capacity over 5–10 years than this year's turnover number. |
| Retention strategies that work best: wages (60%) *and* culture (50%) | Confirms it isn't purely a compensation problem — workplace culture and career progression matter as much, which the "increase wages" framing erases. |

---

## 3. Where TCAF/ThriveUp Academy already has relevant infrastructure

Checked directly against the codebase (`server/orchestration/engine-registry.ts`, `server/workforce-routes.ts`, `server/benefits-routes.ts`, `server/reentry-routes.ts`, `server/household-queries.ts`, `server/navigator-routes.ts`) rather than assumed:

- **`childcare` already exists as a tracked barrier domain** — in benefits screening (AHC-HRSN/PRAPARE), household SDOH scoring, reentry case management, and Navigator search terms. But in every one of these it is modeled as a **barrier blocking something else** (employment, benefits access, reentry stability) — never as its own workforce/labor-market sector with its own pipeline.
- **Workforce engine** (`workforceAssessments`, `readinessLevel` aggregation, now wired into the Conductor) — built for job-readiness scoring generally, not ECE-specific credentialing or wage-progression tracking.
- **ITI (Integration through Invitation) doctrine** — already the platform's answer to "informal, uncredentialed people doing real care work outside the formal system" (promotoras, peer mentors, informal caregivers). This is the *exact* shape of the ECE applicant-pool problem (small, under-qualified pools) but ITI has never been pointed at child care specifically.
- **Recognition & Ratification doctrine** (`server/regional-briefing-routes.ts`) explicitly names "grandmothers do the childcare" as baseline informal adaptation and calls for bringing adapters into the fold with dignity, stipends, and credential pathways without displacing them — directly applicable, not yet applied.
- **Rural-workforce / trade-sims engines** — proof the platform can model an occupational-pipeline-with-simulation pattern (trade-sims for skilled trades); no ECE equivalent exists.
- **Regional-briefing engine** could ingest exactly this United Way dataset as a "sector briefing" (it already supports "childcare infrastructure" as an example topic phrase) — but nothing has fed it this data yet.

## 4. What's missing — from the platform's side

1. **No ECE-specific workforce pipeline engine.** `childcare` is a leaf attribute, not a domain with its own registry entry, wage-progression model, or credential-pathway logic the way `workforce`/`trade-sims`/`justice`/`reentry` are.
2. **No informal-to-credentialed ECE bridge.** ITI exists conceptually but has never been wired to the actual population this survey describes (family/home-based, unlicensed, or under-credentialed caregivers who could be pulled into licensed programs with a stipended pathway).
3. **No true-cost-of-care / subsidy-rate-gap model.** The platform has causal/ROI modeling elsewhere (Chainweb corridor cost modeling); nothing computes "true cost per classroom at target ratios" vs. "what tuition + subsidy actually pays" for ECE specifically — which is the number that would make "increase wages" an actionable ask instead of a slogan.
4. **No director/leadership succession tracking.** Nothing in the platform currently flags leadership-tenure concentration as a capacity risk for any sector, ECE included.
5. **No age-band / geography cross-tab for waitlist vs. open-slot data.** If TCAF ingested this dataset, it could immediately show the mismatch (infant demand vs. preschool supply) that United Way's own deck doesn't surface — but that requires structured ingestion of provider-level survey microdata, which hasn't happened.
6. **No child-outcomes/developmental-risk lens on turnover.** Consistent with the five-lens standard (psychology/neuroscience lens) this platform holds itself to — turnover >40% among caregivers of 0–5 year-olds is an attachment-disruption risk, not just an HR statistic. Nothing in the current engine set connects staffing instability to a developmental-harm framing.

## 4a. Methodological gap: leadership-only sampling (CFIR Inner Setting)

Every finding in the deck — turnover drivers, retention strategies, culture, financial confidence — comes from **directors/leadership only**. No frontline teacher/assistant-teacher voice appears anywhere in the instrument.

In CFIR terms, this survey measures Outer Setting (funding, subsidy environment, licensing) and a leadership-only proxy for Inner Setting, but never reaches the Inner Setting constructs that actually govern turnover:

- **Culture & Relational Connections** — director-reported "50% say culture drives retention" is a belief about culture, not a teacher's lived experience of it. These routinely diverge, and directors reliably overestimate how supported staff feel.
- **Tension for Change / Compatibility** — whether teachers believe the job is fixable at all, versus already checked out. Not visible from a director-only instrument.
- **Relative Priority** — whether frontline staff feel valued relative to other functions in the org, a stronger predictor of "career change" exits than topline wage numbers.
- **Available Resources as experienced, not as budgeted** — a director can report PD funding exists while teachers report they can never get release time to use it.

**Consequence:** any wage-only or culture-only intervention built from this data is built on leadership's model of the workforce, not the workforce's own model of itself. Until a frontline-staff instrument runs alongside the director instrument, "culture" as a validated retention lever remains unconfirmed — it's what directors believe works, not what staff report actually keeps them.

## 5. What's missing — from United Way's own plan

(For contrast — these are gaps in *their* "Next Steps," not the platform's job to fix, but worth being explicit about since the user asked what they're missing):

- No true-cost-of-care number to anchor "increase wages" to a real target.
- No mention of the subsidy-reimbursement-rate gap as a distinct lever from provider-level fundraising.
- No pipeline strategy for *where new qualified staff come from* — only wage/culture levers on the existing (too-small) applicant pool.
- No director succession plan despite their own data showing the concentration.
- No demand/supply geography or age-band matching analysis despite having both waitlist and open-slot data in hand.
- No child-outcomes framing anywhere in the deck — entirely provider-operations and finance framed.

---

## 6. If this becomes a platform build

The natural shape, in priority order, would be:
1. Ingest this dataset (or a live equivalent) as a `childcare`-domain regional-briefing input — lowest lift, uses existing infrastructure.
2. Register `childcare` as a first-class Chainweb engine (mirroring `workforce`/`trade-sims`) with its own wage-progression and true-cost-of-care aggregate.
3. Point the ITI doctrine at informal/home-based caregivers specifically as the applicant-pool fix, with a credentialing/stipend pathway.
4. Add a director-succession-risk signal, generalizable to any sector with concentrated long-tenure leadership.

Not attempted in this session — this document is analysis only, per what was asked.

---

## 7. Cross-reference: Williamson & Burnet Counties Childcare Infrastructure Model (CIM)

A parallel regional effort — the CIM Partner Meeting (Opportunities for Williamson & Burnet Counties, July 2026) — is working the same problem with a structure worth reading alongside this survey.

**Where CIM already reflects the deeper diagnosis:**
- Its four pillars (Co-Create Solutions, Build Partnerships, **Strengthen Financial Health**, **Provider Support & Workforce Stability**) split financial health and workforce stability into separate pillars rather than collapsing both into a single "raise wages" ask.
- "Shared services opportunities" and "workforce stabilization strategies" as named Year-1 implementation items attack the fixed-cost-per-classroom structure directly, closer to a structural fix than UW's "Next Steps" slide (more reports/dashboards/focus groups).
- The wraparound-services agenda item explicitly names transportation, mental health, housing, and food as barriers that persist for **families** even if capacity is fixed — same instinct as this document's core thesis, applied to the demand side.

**Where the same gaps carry over:**
- The wraparound discussion asks what families need to access childcare, but never asks the mirror question for **childcare staff themselves** — many ECE workers can't afford or access care for their own children, a documented driver of field exit. Missing here too.
- CIM's audience is partners/agencies/grant recipients — the same leadership/partner-level sampling gap (Section 4a) applies unless "provider engagement" and "family input" line items actually reach frontline staff and waitlisted families directly, not just directors and orgs.
- No true-cost-of-care or subsidy-rate-gap number appears despite "Strengthen Financial Health" being a named pillar — the same underspecified target for "how much is enough" carries over from the UW deck.

**Implication:** these two documents should be read as one dataset, not two separate ones — CIM is the regional implementation vehicle this survey's data could feed directly into (via Section 6, item 1), and CIM's toolkit-development workstream is a live opening to inject the true-cost-of-care model, staff-side wraparound question, and frontline-voice data collection this analysis identifies as missing from both.
