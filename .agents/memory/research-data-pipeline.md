---
name: Research Data Pipeline
description: Three-feature research infrastructure — longitudinal cohort thread, outcome→grant scoring, one-click PDF report
---

# Research Data Pipeline

## Feature 1 — Longitudinal Participant Cohort Thread
- **Table:** `participant_cohort_threads` (created via raw SQL, not drizzle-kit push — TTY requirement)
- **Hash:** SHA-256 of `birthYear|serviceZip|referralSource` — no PII stored
- **Stages:** yhsiIntakeAt → academyEnrolledAt/Completed → workforcePlacedAt → workforceRetained90dAt
- **API:** `server/research-cohort-routes.ts` → mounted at `/api/research`
  - `GET /api/research/cohort-pipeline` — aggregate funnel, floor-5 suppression, admin-only
  - `POST /api/research/cohort-threads` — upsert on cohortHash, consent required
  - `GET /api/research/cohort-threads/export` — TSV for HHS/DOL, admin-only
- **Privacy:** counts < 5 suppressed; consentGiven must be true; no individual records exposed

## Feature 2 — Outcome-driven Grant Fit Scoring
- **Table:** `grant_fit_events` (created via raw SQL)
- **File:** `server/grant-scoring-events.ts`
  - `onReferralEnrolled(referralId, orgId, programCode)` — bumps fitScore +1 on matching grants
  - `onOutcomeSubmitted(submissionId, orgName, programType, participantsServed)` — larger bump from outcome submissions
- **Wire-in:** `server/referral-routes.ts` — called after both the PATCH and org-confirm handlers when status === "enrolled"
- **Idempotency:** checks `grantFitEvents` for prior trigger by same referralId before bumping (note: concurrent race risk — Task #204 tracks the fix)
- **Keyword mapping:** 15 program categories → grant title keyword buckets in CATEGORY_KEYWORDS

## Feature 3 — One-click Research Report PDF
- **File:** `server/research-report-routes.ts` → mounted at `/api/research`
  - `POST /api/research/report` — body: `{zip, state, regionId?, orgName?, title?}` → PDF stream
  - `GET /api/research/report/preview` — returns JSON data bundle
- **Sections:** community profile, 8 universal issue domains (crime/education/training/foster/workforce/reentry/benefits/healthcare), CEDS PM1-PM5, outcome aggregate, longitudinal funnel, cost-savings model, top grants
- **Cost-savings model constants** (evidence-based federal benchmarks):
  - Incarceration: $38K/yr (BJS 2022)
  - Youth homelessness: $35K/yr (Chapin Hall 2019)
  - ER visit: $2,200 (KFF 2023)
  - Workforce multiplier: 1.8× (BEA 2023)
- **Auth:** staff/admin role required for both PDF and preview

## Key gotchas
- `cedsRegions.state` is the correct column name (NOT `stateAbbr`)
- `jobPlacements.wage` is VARCHAR not number — must parseFloat() before arithmetic
- `drizzle-kit push` requires TTY — always use raw SQL migration for new tables in this project
- `healthcareEnrolled` must be included in the `costSavings` return object to be available in renderPDF
