# Congruence Audit Report
**Run at:** 2026-05-26T02:10:26.497Z
**Manifest version:** 2 (last updated 2026-05-14)
**Audience:** Jim Currier (HUD FYI National Implementation Leader) — Austin meeting prep

## Summary
- **PASS:** 223 / 223
- **WARN:** 0
- **FAIL:** 0
- **Verdict:** ✅ CONGRUENT

## All claims by ID
### ✅ FY-001 — Foster Youth Aging Out hub exists with Marcus narrative anchor
URL: `/foster-youth`
- ✓ url — HTTP 200
- ✓ page-foster-youth-hub — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ card-marcus — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ text-marcus-title — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ section-tools — test-id present (source: client/src/pages/foster-youth/hub.tsx)

### ✅ FY-002 — Aging-Out Toolkit with categorized checklist (identity, records, money, healthcare, housing, support)
URL: `/foster-youth/toolkit`
- ✓ url — HTTP 200
- ✓ page-foster-youth-toolkit — test-id present (source: client/src/pages/foster-youth/toolkit.tsx)
- ✓ card-progress — test-id present (source: client/src/pages/foster-youth/toolkit.tsx)
- ✓ section-cat-identity-documents — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "identity-documents" (from client/src/pages/foster-youth/toolkit.tsx))
- ✓ section-cat-records-you-own — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "records-you-own" (from client/src/pages/foster-youth/toolkit.tsx))
- ✓ section-cat-money-banking — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "money-banking" (from client/src/pages/foster-youth/toolkit.tsx))
- ✓ section-cat-healthcare — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "healthcare" (from client/src/pages/foster-youth/toolkit.tsx))
- ✓ section-cat-housing — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "housing" (from client/src/pages/foster-youth/toolkit.tsx))
- ✓ section-cat-support-network — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "support-network" (from client/src/pages/foster-youth/toolkit.tsx))

### ✅ FY-003 — Structured 90-day-before / 90-day-after Transition Plan with save-and-resume
URL: `/foster-youth/transition-plan`
- ✓ url — HTTP 200
- ✓ page-foster-youth-transition-plan — test-id present (source: client/src/pages/foster-youth/transition-plan.tsx)
- ✓ tab-before — test-id present (source: client/src/pages/foster-youth/transition-plan.tsx)
- ✓ tab-after — test-id present (source: client/src/pages/foster-youth/transition-plan.tsx)
- ✓ button-save — test-id present (source: client/src/pages/foster-youth/transition-plan.tsx)
- ✓ button-print — test-id present (source: client/src/pages/foster-youth/transition-plan.tsx)

### ✅ FY-004 — Wellbeing Check-in uses validated PHQ-2 + GAD-2 + housing/food screen with crisis-routing on red flags
URL: `/foster-youth/wellbeing`
- ✓ url — HTTP 200
- ✓ page-foster-youth-wellbeing — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ card-item-phq1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "phq1" (from client/src/pages/foster-youth/wellbeing.tsx))
- ✓ card-item-phq2 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "phq2" (from client/src/pages/foster-youth/wellbeing.tsx))
- ✓ card-item-gad1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "gad1" (from client/src/pages/foster-youth/wellbeing.tsx))
- ✓ card-item-gad2 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "gad2" (from client/src/pages/foster-youth/wellbeing.tsx))
- ✓ card-housing — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ card-food — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ alert-crisis-banner — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ button-see-results — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)

### ✅ FY-005 — My Rights — federal: Chafee, ETV, FYI, Medicaid-to-26, FAFSA independent, McKinney-Vento, credit-report, RHYA
URL: `/foster-youth/rights`
- ✓ url — HTTP 200
- ✓ page-foster-youth-rights — test-id present (source: client/src/pages/foster-youth/rights.tsx)
- ✓ accordion-right-chafee — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "chafee" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-etv — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "etv" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-fyi — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "fyi" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-medicaid26 — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "medicaid26" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-fafsa-independent — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "fafsa-independent" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-mckinney-vento — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "mckinney-vento" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-ferpa-credit — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "ferpa-credit" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-rhya — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "rhya" (from client/src/pages/foster-youth/rights.tsx))

### ✅ FY-006 — Texas-specific rights: PAL, Extended Foster Care to 21, ID fee waiver, Tuition waiver
URL: `/foster-youth/rights`
- ✓ url — HTTP 200
- ✓ accordion-right-tx-pal — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-pal" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-tx-extended — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-extended" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-tx-id-fee — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-id-fee" (from client/src/pages/foster-youth/rights.tsx))
- ✓ accordion-right-tx-tuition — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-tuition" (from client/src/pages/foster-youth/rights.tsx))

### ✅ FY-007 — State Benefits Navigator covers all 50 states + DC, Texas first with full detail
URL: `/foster-youth/benefits`
- ✓ url — HTTP 200
- ✓ page-foster-youth-benefits — test-id present (source: client/src/pages/foster-youth/benefits.tsx)
- ✓ select-state-trigger — test-id present (source: client/src/pages/foster-youth/benefits.tsx)
- ✓ option-state-TX — test-id present (template: client/src/pages/foster-youth/benefits.tsx `option-state-${...}` + suffix "TX" (from client/src/pages/foster-youth/benefits.tsx))
- ✓ option-state-CA — test-id present (template: client/src/pages/foster-youth/benefits.tsx `option-state-${...}` + suffix "CA" (from client/src/data/foster-youth/state-ilp.ts))
- ✓ option-state-NY — test-id present (template: client/src/pages/foster-youth/benefits.tsx `option-state-${...}` + suffix "NY" (from client/src/data/foster-youth/state-ilp.ts))
- ✓ card-benefit-tx-pal — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "tx-pal" (from client/src/data/foster-youth/state-ilp.ts))
- ✓ card-benefit-fed-medicaid — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "fed-medicaid" (from client/src/pages/foster-youth/benefits.tsx))
- ✓ card-benefit-fed-fyi — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "fed-fyi" (from client/src/pages/foster-youth/benefits.tsx))
- ✓ card-benefit-fed-etv — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "fed-etv" (from client/src/pages/foster-youth/benefits.tsx))

### ✅ FY-008 — FAFSA navigator with foster-youth (independent-student + ETV) mode
URL: `/fafsa-navigator?audience=foster`
- ✓ url — HTTP 200
- ✓ page-fafsa-navigator — test-id present (source: client/src/pages/fafsa-navigator.tsx)
- ✓ callout-foster-mode — test-id present (source: client/src/pages/fafsa-navigator.tsx)

### ✅ FY-009-hub — Crisis routing visible on hub: 988, 741741 text, 1-800-RUNAWAY
URL: `/foster-youth`
- ✓ url — HTTP 200
- ✓ banner-crisis — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ link-crisis-988 — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ link-crisis-text — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ link-crisis-runaway — test-id present (source: client/src/pages/foster-youth/hub.tsx)

### ✅ FY-009-toolkit — Crisis routing visible on toolkit
URL: `/foster-youth/toolkit`
- ✓ url — HTTP 200
- ✓ banner-crisis — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-988 — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-text — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-runaway — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)

### ✅ FY-009-transition — Crisis routing visible on transition plan
URL: `/foster-youth/transition-plan`
- ✓ url — HTTP 200
- ✓ banner-crisis — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-988 — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-text — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-runaway — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)

### ✅ FY-009-wellbeing — Crisis routing visible on wellbeing (in-page banner)
URL: `/foster-youth/wellbeing`
- ✓ url — HTTP 200
- ✓ alert-crisis-banner — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ link-crisis-988 — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ link-crisis-text — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ link-crisis-runaway — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)

### ✅ FY-009-rights — Crisis routing visible on rights
URL: `/foster-youth/rights`
- ✓ url — HTTP 200
- ✓ banner-crisis — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-988 — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-text — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-runaway — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)

### ✅ FY-009-benefits — Crisis routing visible on benefits
URL: `/foster-youth/benefits`
- ✓ url — HTTP 200
- ✓ banner-crisis — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-988 — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-text — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)
- ✓ link-crisis-runaway — test-id present (source: client/src/components/foster-youth/crisis-strip.tsx)

### ✅ FY-010 — Marcus narrative anchored canonically
URL: `/resident-journey`
- ✓ url — HTTP 200
- ✓ card-marcus-narrative — test-id present (source: client/src/pages/resident-journey.tsx)
- ✓ text-marcus-headline — test-id present (source: client/src/pages/resident-journey.tsx)

### ✅ FY-011-hub — Bilingual EN/ES on hub (Spanish appears under each English tile title)
URL: `/foster-youth`
- ✓ url — HTTP 200
- ✓ tile-toolkit-title-es — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ tile-transition-plan-title-es — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ tile-wellbeing-title-es — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ tile-rights-title-es — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ tile-benefits-title-es — test-id present (source: client/src/pages/foster-youth/hub.tsx)
- ✓ tile-fafsa-title-es — test-id present (source: client/src/pages/foster-youth/hub.tsx)

### ✅ FY-011-toolkit — Bilingual EN/ES on toolkit (each item shows English title + Spanish title)
URL: `/foster-youth/toolkit`
- ✓ url — HTTP 200
- ✓ text-item-title-es-id-ssn — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `text-item-title-es-${...}` + suffix "id-ssn" (from client/src/pages/foster-youth/toolkit.tsx))
- ✓ text-item-title-es-rec-medical — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `text-item-title-es-${...}` + suffix "rec-medical" (from client/src/pages/foster-youth/toolkit.tsx))

### ✅ FY-011-transition — Bilingual EN/ES on transition plan (Spanish page subtitle)
URL: `/foster-youth/transition-plan`
- ✓ url — HTTP 200
- ✓ text-tp-title-es — test-id present (source: client/src/pages/foster-youth/transition-plan.tsx)

### ✅ FY-011-wellbeing — Bilingual EN/ES on wellbeing (Spanish question text per item + page subtitle)
URL: `/foster-youth/wellbeing`
- ✓ url — HTTP 200
- ✓ text-wb-title-es — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ text-question-es-phq1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `text-question-es-${...}` + suffix "phq1" (from client/src/pages/foster-youth/wellbeing.tsx))
- ✓ text-question-es-gad1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `text-question-es-${...}` + suffix "gad1" (from client/src/pages/foster-youth/wellbeing.tsx))

### ✅ FY-011-rights — Bilingual EN/ES on rights (Spanish title under each right)
URL: `/foster-youth/rights`
- ✓ url — HTTP 200
- ✓ text-right-title-es-chafee — test-id present (template: client/src/pages/foster-youth/rights.tsx `text-right-title-es-${...}` + suffix "chafee" (from client/src/pages/foster-youth/rights.tsx))
- ✓ text-right-title-es-etv — test-id present (template: client/src/pages/foster-youth/rights.tsx `text-right-title-es-${...}` + suffix "etv" (from client/src/pages/foster-youth/rights.tsx))
- ✓ text-right-title-es-tx-pal — test-id present (template: client/src/pages/foster-youth/rights.tsx `text-right-title-es-${...}` + suffix "tx-pal" (from client/src/pages/foster-youth/rights.tsx))

### ✅ FY-011-benefits — Bilingual EN/ES on benefits (Spanish page subtitle)
URL: `/foster-youth/benefits`
- ✓ url — HTTP 200
- ✓ text-benefits-title-es — test-id present (source: client/src/pages/foster-youth/benefits.tsx)

### ✅ FY-012 — Honest disclosure block visible: IRS-determined 501(c)(3) (Letter 947, eff. 01/14/2026), SAM Active, CAGE 209N1, not a placing agency, no current state ILP contract
URL: `/foster-youth`
- ✓ url — HTTP 200
- ✓ alert-honest-disclosure — test-id present (source: client/src/pages/foster-youth/hub.tsx)

### ✅ FY-013 — Quintet ecosystem framing: Talk Your Talk, Civic Signal, LifeBridge, ThriveUp Academy, Whole-Person Health
URL: `/foster-youth`
- ✓ url — HTTP 200
- ✓ text-partners-body — test-id present (source: client/src/pages/foster-youth/hub.tsx)

### ✅ FY-014 — LifeBridge 20,670-resource navigator linked from foster-youth journey
URL: `/foster-youth`
- ✓ url — HTTP 200
- ✓ button-lifebridge — test-id present (source: client/src/pages/foster-youth/hub.tsx)

### ✅ FY-014-wellbeing-resources — LifeBridge resource action also surfaced from wellbeing warm-handoff
URL: `/foster-youth/wellbeing`
- ✓ url — HTTP 200
- ✓ action-resources — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)

### ✅ FY-015 — Whole-Person Mental Health crisis routing linked from wellbeing red-flag results
URL: `/foster-youth/wellbeing`
- ✓ url — HTTP 200
- ✓ action-mh — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)

### ✅ FY-016-hub-intake-tile — AI-assisted Intake tile surfaced from the Foster Youth hub
URL: `/foster-youth`
- ✓ url — HTTP 200
- ✓ tile-intake — test-id present (source: client/src/pages/foster-youth/hub.tsx)

### ✅ FY-016-intake-wizard — Live AI-assisted Intake wizard: 4 steps (basics, checklist, document upload, AI plan) with honest disclosure and crisis routing
URL: `/foster-youth/intake`
- ✓ url — HTTP 200
- ✓ page-foster-youth-intake — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ alert-honest — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ stepper — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ card-step-1 — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ input-first-name — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ input-age — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ input-age-out-date — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ select-state-trigger — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ needs-checklist — test-id present (source: client/src/pages/foster-youth/intake.tsx)
- ✓ button-next-step-2 — test-id present (source: client/src/pages/foster-youth/intake.tsx)

### ✅ FY-017-cohort-analytics — Cohort analytics dashboard segments intakes/documents/events so each user has a data story (admin-only)
URL: `/foster-youth/cohort-analytics`
- ✓ url — HTTP 200
- ✓ page-foster-youth-cohort-analytics — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ text-analytics-title — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ select-window-trigger — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ card-stat-intakes — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ card-stat-analyzed — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ card-stat-documents — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ card-by-state — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ card-by-event — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)
- ✓ card-recent-intakes — test-id present (source: client/src/pages/foster-youth/cohort-analytics.tsx)

### ✅ FY-018-50-states — State Benefits navigator covers all 50 states + DC, sourced from STATE_ILP catalog (blank fields where unverified, no conjecture)
URL: `/foster-youth/benefits`
- ✓ url — HTTP 200
- ✓ page-foster-youth-benefits — test-id present (source: client/src/pages/foster-youth/benefits.tsx)

### ✅ FY-019-state-portal — State-Agency Portal: privileged CSV bulk-upload (≤5,000 rows / 2MB), agency picker, recharts stratification, ISS-style stakeholder coordination dialog, honest live-vs-MOU disclosure
URL: `/foster-youth/state-portal`
- ✓ url — HTTP 200
- ✓ page-foster-youth-state-portal — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ text-page-title — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ alert-honest-disclosure — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ tab-caseload — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ tab-upload — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ tab-agency — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ tab-method — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ button-download-sample — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ button-upload-csv — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)
- ✓ chart-stratification — test-id present (source: client/src/pages/foster-youth/state-portal.tsx)

### ✅ FY-020-policy-comparison — 50-state Policy Comparison page: federal-floor disclosure, two-state side-by-side, what's-working national rollup, full all-state matrix; honest 'unverified' marking where statute not confirmed
URL: `/foster-youth/policy-comparison`
- ✓ url — HTTP 200
- ✓ page-foster-youth-policy-comparison — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ text-page-title — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ alert-federal-floor — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ alert-roadmap — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ tab-compare — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ tab-rollup — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ tab-matrix — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ select-state-a — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ select-state-b — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ table-comparison — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)
- ✓ table-all-states — test-id present (source: client/src/pages/foster-youth/policy-comparison.tsx)

### ✅ VANN-001-hub — Community Partner Hub (featured: Sistahs Can We Talk + Iasis Christian Center): welcome card, who's-who 3-card, ecosystem map (9 surfaces), 7-min walkthrough script, COI disclosure, CTAs to tracker + RFP storyteller. Honest disclosure footer.
URL: `/partners/vann-hub`
- ✓ url — HTTP 200
- ✓ page-vann-hub — test-id present (source: client/src/pages/partners/vann-collaboration-hub.tsx)
- ✓ text-page-title — test-id present (source: client/src/pages/partners/vann-collaboration-hub.tsx)
- ✓ cta-tracker — test-id present (source: client/src/pages/partners/vann-collaboration-hub.tsx)
- ✓ cta-storyteller — test-id present (source: client/src/pages/partners/vann-collaboration-hub.tsx)
- ✓ badge-aff-sedgwick — test-id present (source: client/src/pages/partners/vann-collaboration-hub.tsx)
- ✓ badge-aff-ksun — test-id present (source: client/src/pages/partners/vann-collaboration-hub.tsx)
- ✓ card-ecosystem-thriveup-academy — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "thriveup-academy" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-whole-person-health — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "whole-person-health" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-bible-study-buddies — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "bible-study-buddies" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-talk-your-talk — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "talk-your-talk" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-lifebridge-virtual-211 — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "lifebridge-virtual-211" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-safereport — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "safereport" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-sankofa-health-network — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "sankofa-health-network" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-herhealth-network — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "herhealth-network" (from client/src/pages/partners/vann-collaboration-hub.tsx))
- ✓ card-ecosystem-civic-signal — test-id present (template: client/src/pages/partners/vann-collaboration-hub.tsx `card-ecosystem-${...}` + suffix "civic-signal" (from client/src/pages/partners/vann-collaboration-hub.tsx))

### ✅ VANN-002-family-tracker — Family & Program Tracker: org picker, household list, family detail panel with member chips + enrollments + attendance trend (recharts) + services received, attendance check-in dialog, CSV upload with sample, CSV export, stats tiles, COI disclosure card on Iasis tenant, demo-data alert.
URL: `/partners/family-program-tracker`
- ✓ url — HTTP 200
- ✓ page-family-program-tracker — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ text-page-title — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ select-org — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ button-open-upload — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ button-export-csv — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ stat-households — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ stat-members — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ stat-programs — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ stat-attendance — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ stat-meals — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ stat-transport — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ tab-households — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ tab-reach — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)
- ✓ tab-services — test-id present (source: client/src/pages/partners/family-program-tracker.tsx)

### ✅ VANN-003-rfp-storyteller — RFP-Match Storyteller: side-by-side SAMHSA Minority Behavioral Health (federal scaling-up) and Wichita CDBG Public Services (local scaling-out) panels. Each requirement quoted verbatim and crosswalked to live tracker data. Sample narrative paragraph per panel.
URL: `/partners/rfp-storyteller`
- ✓ url — HTTP 200
- ✓ page-rfp-storyteller — test-id present (source: client/src/pages/partners/rfp-storyteller.tsx)
- ✓ text-page-title — test-id present (source: client/src/pages/partners/rfp-storyteller.tsx)
- ✓ select-org — test-id present (source: client/src/pages/partners/rfp-storyteller.tsx)
- ✓ tab-samhsa — test-id present (source: client/src/pages/partners/rfp-storyteller.tsx)
- ✓ tab-cdbg — test-id present (source: client/src/pages/partners/rfp-storyteller.tsx)
- ✓ card-req-samhsa-r1 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "samhsa-r1" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-samhsa-r2 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "samhsa-r2" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-samhsa-r3 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "samhsa-r3" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-samhsa-r4 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "samhsa-r4" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-samhsa-r5 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "samhsa-r5" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-cdbg-r1 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "cdbg-r1" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-cdbg-r2 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "cdbg-r2" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-cdbg-r3 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "cdbg-r3" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-cdbg-r4 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "cdbg-r4" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ card-req-cdbg-r5 — test-id present (template: client/src/pages/partners/rfp-storyteller.tsx `card-req-${...}` + suffix "cdbg-r5" (from client/src/pages/partners/rfp-storyteller.tsx))
- ✓ text-sample-narrative — test-id present (source: client/src/pages/partners/rfp-storyteller.tsx)

## External URLs
- ✅ **EXT-LB** `https://lifetransitionsaid.org/` — HTTP 200, keywords present
- ✅ **EXT-LB-RES** `https://lifetransitionsaid.org/resources` — HTTP 200, keywords present
- ✅ **EXT-TYT** `https://talkyourtalk.net/` — HTTP 200, keywords present
- ✅ **EXT-WPH** `https://mentalwellnesssupport.net/` — HTTP 200, keywords present

---
Generated by `scripts/congruence-audit.ts`. Iron rule: AI assistance with no conjecture or assumptions.