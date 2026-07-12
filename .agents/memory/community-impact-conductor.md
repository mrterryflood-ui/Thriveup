---
name: Community Impact Conductor
description: Unified community story surface — any ZIP/city/county → 10 social-domain scores, 25-year cascade, counterfactual cost, solutions layer, AI narrative.
---

## What it is
`server/conductor-routes.ts` + `client/src/pages/community-impact.tsx`

Two endpoints:
- `POST /api/conductor/community-brief` — full community brief for one geography
- `POST /api/conductor/compare` — side-by-side multi-geography comparison

## Key import rules (caused startup failure)
- `db` must come from `"./storage"` — NOT `"./db"` (that path doesn't exist)
- Schema tables must come from `"@shared/schema"` — NOT `"../shared/schema"`

## JURISDICTION_DATA shape (caused logic failure)
Flat records, NOT a `.policies` array. Fields: `state, topic, policyName, outcome, evidenceSummary`.
`getPolicyContext()` filters by state + categorizes by `outcome` field.
Never access `.record` or `.nationalRanking` — those fields don't exist.

## Verified benchmark results (2026-07-12)
| Geography | Grade | Score | Cost of Inaction |
|-----------|-------|-------|-----------------|
| 78741 (East Austin ZIP) | F | 37 | $128M / 25yr |
| Austin TX (city) | C | 72 | $13M / 25yr |
| Waco TX (city) | F | 19 | $399M / 25yr |

**Why:** High-poverty ZIPs and mid-size TX cities hit F because the coefficients weight infant mortality, uninsured rate, and ECE access heavily — these are often worst in rural/urban-core areas while aggregate city data looks better.

## Navigation
- Route: `/community-impact` (lazy-loaded in App.tsx)
- Command palette: "Community Impact Conductor" in "Impact & Data" group
- Hub-connect: hero card in Civic section with "New" badge
