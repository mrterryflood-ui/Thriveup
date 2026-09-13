---
name: ChildCORE causal-chain architecture model
description: ChildCORE's architecture attacks 10 interdependent problems simultaneously via a shared journey spine; ThriveUp must do the same for its causal chain.
---

## The principle

ChildCORE's 10 problems form a causal chain — each causes the next. Their architecture is effective because it attacks every node simultaneously with the same shared data envelope, not specialist tools that fire independently.

ThriveUp has the same pattern of problems and the same specialist organs, but they fire in isolation (the "swamp of silos" problem the user identified).

## Global platform framing

Treat international work as the platform's general operating model, not as a
foundation-specific deployment or a separate international product. The core
causal-chain and journey envelope should be reusable across countries and
sectors; geography, language, service taxonomies, legal rules, safeguarding,
connectivity, and local partner workflows are configuration/adaptation layers.

**Why:** Community problems are interconnected and cross-border. Designing only
for a single funder or linear program would recreate the silos the shared
spine is meant to eliminate and would make every new country look like a
separate rebuild.

**How to apply:** Build country/program adapters around the common spine. Start
with one locally led implementation context and one measurable causal chain,
but preserve the architecture for scale-out across health, education, housing,
workforce, rights, environment, and child/youth systems. Funders are possible
application contexts, not the product definition.

## Non-bolt-on acceptance rule

International readiness, localization, adaptation, data sovereignty, low-
connectivity access, community governance, safeguarding, and cross-domain
causal reasoning are Phase 1 acceptance criteria—not later integrations.

**Why:** Adding these after domestic features are complete would force country
forks, duplicate journeys, and unsafe retrofits. The platform must be built so
that local context changes configuration and implementation, not the core
product's identity or safety model.

**How to apply:** Any future feature is incomplete until its country/program
configuration boundary, local ownership path, evidence/provenance behavior,
accessibility/connectivity posture, and cross-domain handoff are explicitly
defined or intentionally marked not applicable.

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
