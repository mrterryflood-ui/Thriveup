---
name: ChildCORE causal-chain architecture model
description: ChildCORE's architecture attacks 10 interdependent problems simultaneously via a shared journey spine; ThriveUp must do the same for its causal chain.
---

## The principle

ChildCORE's 10 problems form a causal chain — each causes the next. Their architecture is effective because it attacks every node simultaneously with the same shared data envelope, not specialist tools that fire independently.

ThriveUp has the same pattern of problems and the same specialist organs, but they fire in isolation (the "swamp of silos" problem the user identified).

**Why:** Each tool does real work in isolation but the causal chain never closes because there is no shared spine connecting them. A person who uses Navigator doesn't carry context to Benefits Screener; CHW referral doesn't know the community brief; Equity Loss findings don't reach Navigator.

## The ThriveUp causal chain

```
SDOH/geographic data deserts         ← SDOH Explorer, Community Brief
  → community decisions made without real data
  → inequitable resource distribution ← Equity Loss Engine, Chainweb ROI
  → workforce/economic barriers       ← Academy, Trade Sims, Workforce
  → residents miss benefits they qualify for ← Benefits Screener, Navigator
  → health/education/justice/housing gaps ← CHW, YHSI, Health, Reentry
  → organizations don't know who they're missing ← Partner API, YHSI
  → compliance/reporting failures     ← Funder dashboards
  → continuity breaks across life stages ← YHSI 12–26 / ChildCORE 0–12
  → no learning across implementations ← MAP-GAP, RPLICE, Chainweb
  → no accountability for AI recommendations ← Provenance, claim-grounding
```

## Three architectural gaps to close

**Gap 1 — No shared journey envelope**
Each tool has its own data model. Context passing is request-driven (built 2026-09-10: /api/navigator/context, personal context enrichment, referral→navigator bridge). What's needed: a durable `userJourneys` record that Navigator, Benefits Screener, CHW Dashboard, YHSI, and Community Brief all read before acting and write to after acting. Spine: `identified needs | geography | screener results | active referrals | YHSI status | community context timestamp`.

**Gap 2 — Bidirectional ChildCORE sync is one-sided**
ChildCORE documentation states it pushes county metrics to ThriveUp every 30 minutes and expects to pull YHSI outcomes + Chainweb ROI coefficients back. ThriveUp has outbound endpoints but no inbound endpoint to receive county metrics. When metrics arrive (childcare desert rate, PreK enrollment, kindergarten readiness by county), they must feed into Navigator community context, Community Brief, and the Conductor.

**Gap 3 — Community intelligence is reactive not proactive**
Community context fires when a ZIP appears in a request. Should prime from `userJourneys.lastKnownGeography` for authenticated users so every tool already has context before the first message.

## What ChildCORE expects ThriveUp to provide

- YHSI outcomes (ages 12–26) for the longitudinal arc
- Chainweb ROI coefficients by county
- Community briefs (already implemented at /api/partner/v1/community-brief)
- Benefits eligibility data

## Build order by impact

1. `userJourneys` table + read/write hooks in Navigator, Screener, Referral
2. `POST /api/partner/v1/childcore/county-metrics` inbound + storage + 30-min sync job
3. Proactive community context priming from `lastKnownGeography`
4. YHSI outcomes outbound push when YHSI records update
