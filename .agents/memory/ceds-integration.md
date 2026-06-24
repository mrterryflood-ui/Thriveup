---
name: CEDS Regional Alignment Integration
description: EDA Comprehensive Economic Development Strategy framework baked into Navigator, Chainweb, proposals, and assessments. 12 Texas EDD regions seeded. NORTEX = WSNT child care region.
---

## What was built (2026-06-24)
- 3 tables: `cedsRegions`, `cedsGoals`, `cedsAlignments` in shared/schema.ts
- `server/ceds-routes.ts` — 5 endpoints; AI align requires auth
- Navigator injection: CEDS regional framework block in AI context when state detected (navigator-routes.ts)
- Chainweb: `ceds_alignment` step added to CHAIN_STEPS (corridor-chainweb.ts)
- Frontend: `/ceds` and `/ceds/:regionId` → `client/src/pages/ceds-navigator.tsx`
- Sidebar: "CEDS Regional Alignment" in Get Funded hub

## NORTEX region (critical for WSNT RFP2026-004)
- DB id=2, eddAbbr="NORTEX"
- 11 counties: Wichita, Archer, Baylor, Clay, Cottle, Foard, Hardeman, Jack, Montague, Wilbarger, Young
- 5 strategic goals seeded with TCAF alignment + EDA measure mappings
- Notes field: "Workforce Solutions North Texas (WSNT) CCS contractor region — RFP2026-004 child care services"

## EDA's 5 Performance Measures (universal — all proposals)
- PM1: Jobs Created (primary)
- PM2: Jobs Retained (primary)
- PM3: Private Investment Leveraged (primary)
- PM4: Construction/Infrastructure Jobs (secondary)
- PM5: Businesses Assisted (secondary)

**Why:** EDA requires all CEDS-aligned proposals to address these 5 measures. Baking them into the platform means every proposal, assessment, and community intelligence output can cite them by default.

**How to apply:** Any grant proposal touching EDA, workforce, or community development → reference PM1-PM5 by ID. Use `/api/ceds/align` (POST, auth required) to get AI-generated proposal language for any program description. Use `/api/ceds/lookup?fips=<5-digit>` to find region by county.
