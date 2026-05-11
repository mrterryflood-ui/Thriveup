# Congruence Audit Report
**Run at:** 2026-05-11T11:44:05.310Z
**Manifest version:** 1 (last updated 2026-05-11)
**Audience:** Jim Currier (HUD FYI National Implementation Leader) — Austin meeting prep

## Summary
- **PASS:** 127 / 127
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
- ✓ section-cat-identity-documents — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "identity-documents")
- ✓ section-cat-records-you-own — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "records-you-own")
- ✓ section-cat-money-banking — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "money-banking")
- ✓ section-cat-healthcare — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "healthcare")
- ✓ section-cat-housing — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "housing")
- ✓ section-cat-support-network — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `section-cat-${...}` + suffix "support-network")

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
- ✓ card-item-phq1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "phq1")
- ✓ card-item-phq2 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "phq2")
- ✓ card-item-gad1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "gad1")
- ✓ card-item-gad2 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `card-item-${...}` + suffix "gad2")
- ✓ card-housing — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ card-food — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ alert-crisis-banner — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ button-see-results — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)

### ✅ FY-005 — My Rights — federal: Chafee, ETV, FYI, Medicaid-to-26, FAFSA independent, McKinney-Vento, credit-report, RHYA
URL: `/foster-youth/rights`
- ✓ url — HTTP 200
- ✓ page-foster-youth-rights — test-id present (source: client/src/pages/foster-youth/rights.tsx)
- ✓ accordion-right-chafee — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "chafee")
- ✓ accordion-right-etv — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "etv")
- ✓ accordion-right-fyi — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "fyi")
- ✓ accordion-right-medicaid26 — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "medicaid26")
- ✓ accordion-right-fafsa-independent — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "fafsa-independent")
- ✓ accordion-right-mckinney-vento — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "mckinney-vento")
- ✓ accordion-right-ferpa-credit — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "ferpa-credit")
- ✓ accordion-right-rhya — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "rhya")

### ✅ FY-006 — Texas-specific rights: PAL, Extended Foster Care to 21, ID fee waiver, Tuition waiver
URL: `/foster-youth/rights`
- ✓ url — HTTP 200
- ✓ accordion-right-tx-pal — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-pal")
- ✓ accordion-right-tx-extended — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-extended")
- ✓ accordion-right-tx-id-fee — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-id-fee")
- ✓ accordion-right-tx-tuition — test-id present (template: client/src/pages/foster-youth/rights.tsx `accordion-right-${...}` + suffix "tx-tuition")

### ✅ FY-007 — State Benefits Navigator covers all 50 states + DC, Texas first with full detail
URL: `/foster-youth/benefits`
- ✓ url — HTTP 200
- ✓ page-foster-youth-benefits — test-id present (source: client/src/pages/foster-youth/benefits.tsx)
- ✓ select-state-trigger — test-id present (source: client/src/pages/foster-youth/benefits.tsx)
- ✓ option-state-TX — test-id present (template: client/src/pages/foster-youth/benefits.tsx `option-state-${...}` + suffix "TX")
- ✓ option-state-CA — test-id present (template: client/src/pages/foster-youth/benefits.tsx `option-state-${...}` + suffix "CA")
- ✓ option-state-NY — test-id present (template: client/src/pages/foster-youth/benefits.tsx `option-state-${...}` + suffix "NY")
- ✓ card-benefit-tx-pal — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "tx-pal")
- ✓ card-benefit-fed-medicaid — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "fed-medicaid")
- ✓ card-benefit-fed-fyi — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "fed-fyi")
- ✓ card-benefit-fed-etv — test-id present (template: client/src/pages/foster-youth/benefits.tsx `card-benefit-${...}` + suffix "fed-etv")

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
- ✓ text-item-title-es-id-ssn — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `text-item-title-es-${...}` + suffix "id-ssn")
- ✓ text-item-title-es-rec-medical — test-id present (template: client/src/pages/foster-youth/toolkit.tsx `text-item-title-es-${...}` + suffix "rec-medical")

### ✅ FY-011-transition — Bilingual EN/ES on transition plan (Spanish page subtitle)
URL: `/foster-youth/transition-plan`
- ✓ url — HTTP 200
- ✓ text-tp-title-es — test-id present (source: client/src/pages/foster-youth/transition-plan.tsx)

### ✅ FY-011-wellbeing — Bilingual EN/ES on wellbeing (Spanish question text per item + page subtitle)
URL: `/foster-youth/wellbeing`
- ✓ url — HTTP 200
- ✓ text-wb-title-es — test-id present (source: client/src/pages/foster-youth/wellbeing.tsx)
- ✓ text-question-es-phq1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `text-question-es-${...}` + suffix "phq1")
- ✓ text-question-es-gad1 — test-id present (template: client/src/pages/foster-youth/wellbeing.tsx `text-question-es-${...}` + suffix "gad1")

### ✅ FY-011-rights — Bilingual EN/ES on rights (Spanish title under each right)
URL: `/foster-youth/rights`
- ✓ url — HTTP 200
- ✓ text-right-title-es-chafee — test-id present (template: client/src/pages/foster-youth/rights.tsx `text-right-title-es-${...}` + suffix "chafee")
- ✓ text-right-title-es-etv — test-id present (template: client/src/pages/foster-youth/rights.tsx `text-right-title-es-${...}` + suffix "etv")
- ✓ text-right-title-es-tx-pal — test-id present (template: client/src/pages/foster-youth/rights.tsx `text-right-title-es-${...}` + suffix "tx-pal")

### ✅ FY-011-benefits — Bilingual EN/ES on benefits (Spanish page subtitle)
URL: `/foster-youth/benefits`
- ✓ url — HTTP 200
- ✓ text-benefits-title-es — test-id present (source: client/src/pages/foster-youth/benefits.tsx)

### ✅ FY-012 — Honest disclosure block visible: 501(c)(3) pending, not a placing agency, no current state ILP contract
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

## External URLs
- ✅ **EXT-LB** `https://lifetransitionsaid.org/` — HTTP 200, keywords present
- ✅ **EXT-LB-RES** `https://lifetransitionsaid.org/resources` — HTTP 200, keywords present
- ✅ **EXT-TYT** `https://talkyourtalk.net/` — HTTP 200, keywords present
- ✅ **EXT-WPH** `https://mentalwellnesssupport.net/` — HTTP 200, keywords present

---
Generated by `scripts/congruence-audit.ts`. Iron rule: AI assistance with no conjecture or assumptions.