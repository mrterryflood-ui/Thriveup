# Foster Youth — Outcome Tracking & Analytics Segmentation Plan
**Owner:** Dr. Terry Flood, President · TCAF.
**Goal:** Within **30 days** of kickoff, be able to report foster-youth-specific outcomes for the LifeBridge resource navigator, the ThriveUp Academy `/foster-youth` experience, and the FAFSA navigator.
**Why:** Jim Currier and every funder behind him will ask, *"How do I know your tools work for foster youth specifically?"* Today the honest answer is: our LifeBridge analytics are not segmented. This plan closes that gap.

---

## What we measure (the outcome stack)

| Tier | Metric | Source | Honest baseline today |
|---|---|---|---|
| **Inputs** | Unique users on `/foster-youth/*` per week | Web analytics (server logs + page-view events) | 0 (page launches with this build) |
| **Inputs** | Foster-youth-tagged sessions on LifeBridge resource navigator | LifeBridge analytics (NEEDS instrumentation) | Untracked |
| **Outputs** | Toolkit items checked per session | localStorage tally → POST to opt-in counter endpoint | Not collected |
| **Outputs** | Transition Plan fields completed per session | Same | Not collected |
| **Outputs** | Wellbeing screens completed per week, % positive PHQ-2 / GAD-2, % housing-unstable, % food-insecure | Same — opt-in, no PII | Not collected |
| **Outputs** | Click-through rate to crisis numbers (988, 741741, 1-800-RUNAWAY) from foster-youth pages | Server-side click tracking | Not collected |
| **Outputs** | Click-through rate to State Benefits "Apply" buttons | Same | Not collected |
| **Outcomes (self-reported)** | 30-day post-use check-in: did you accomplish your top 3 plan items? | Optional survey on Transition Plan after 30 days (browser prompt) | Not collected |
| **Outcomes (system-level)** | Texas DFPS PAL completion rates pre/post TCAF deployment in pilot region | DFPS Data Book + custom MOU | Requires partnership |

---

## 30-day implementation plan

### Week 1 — instrumentation infrastructure
- [ ] Add `event_log` table to schema: `id, eventName, eventData (jsonb), occurredAt, sessionId (anonymous), audience (foster-youth | general)`
- [ ] Add `POST /api/events` endpoint, rate-limited, no PII
- [ ] Add a tiny `useTracker(audience)` hook in `client/src/lib/analytics.ts` that batches events and sends them
- [ ] Wire `useTracker("foster-youth")` to all six foster-youth pages and the foster-mode FAFSA tab
- [ ] Wire crisis-link clicks (988 / 741741 / 1-800-RUNAWAY) and apply-button clicks
- [ ] Document the privacy model on the hub page

### Week 2 — LifeBridge cross-platform tagging
- [ ] Add a `?ref=foster-youth-hub` UTM-style parameter to the LifeBridge resource-navigator outbound link
- [ ] Coordinate with the LifeBridge codebase (separate Replit workspace) to capture the `ref` parameter and tag the inbound session
- [ ] Add a `foster-youth` filter chip on LifeBridge `/resources` that sets the same tag

### Week 3 — dashboard + segmented reporting
- [ ] Build `/admin/foster-youth-analytics` admin route (auth-gated)
- [ ] Show: foster-youth tagged sessions per week, top 10 toolkit items checked, % wellbeing red-flag rate, top 5 state-benefits apply-clicks
- [ ] Add a CSV export
- [ ] Add a public-facing summary widget on `/impact` that surfaces the headline number ("X foster youth accessed transition tools this month") without any PII

### Week 4 — qualitative + course-correct
- [ ] Add an opt-in 3-question post-session survey to the Transition Plan: (a) what tool was most useful, (b) what's still unclear, (c) one thing that would make this better
- [ ] Schedule 5 user-interview slots with foster-youth alumni via Foster Care Alumni of America or a Casey peer-fellow connection
- [ ] Write up first monthly outcome report for funders + Jim Currier
- [ ] Update CONGRUENCE-MANIFEST.json to add new claims that reference the dashboard

---

## Honest baselines we report on Day 0
- **3,456** total LifeBridge resource navigations (all populations) — *not segmented by foster-youth*
- **234** crisis-support diversions (all populations) — *not segmented by foster-youth*
- **178** CHW dispatches (all populations) — *not segmented by foster-youth*
- Foster-youth specialty pages: **just launched** (this build) — segmented data starts collecting from Week 1.

We do not claim foster-youth-specific impact numbers in any briefing or proposal until at least one full month of segmented data is on the dashboard.

---

## Implementation-science grounding

**Framework:** RE-AIM applied to digital transition supports.
- **Reach:** unique foster-youth-tagged users / estimated population aging out in service area
- **Effectiveness:** % completing toolkit / transition plan / wellbeing check; click-throughs to apply links
- **Adoption:** number of partner orgs (PHAs, ILP coordinators, CASA programs) referring youth to the platform
- **Implementation:** fidelity to bilingual delivery; uptime; crisis-routing latency
- **Maintenance:** 30/60/90-day return rates; dashboard sustainment beyond pilot

This is the same framework HUD/HHS reviewers expect in funded transition-supports proposals. We instrument what they already measure.
