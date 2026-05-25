# SOLUTION SUMMARY

*Formatting target: 11pt sans serif (Calibri / Arial / Avenir Next Pro Light), 6-page hard limit, citations excluded from the page count per Appendix A. Submit via https://solutions.arpa-h.gov/Submit-Solution/.*

---

## Cover Page

**Innovative Solutions Opening:** ARPA-H Proactive Health Office Innovative Solutions Opening — **ARPA-H-SOL-24-106**, Amendment 03 (October 14, 2025); rolling, closes March 5, 2029.

**Solution Summary Title:** *PFC-Window: A Population-Scale AI Platform for Detecting and Pre-empting Prefrontal-Cortex-Driven Caregiver Risk Before Child Maltreatment Occurs.*

**Submitter (Prime):** **The Collaborative Advocate Foundation (TCAF)** — d/b/a ThriveUp Academy
- **Organization Type:** ☒ Non-profit (IRS 501(c)(3), public charity §170(b)(1)(A)(vi), determined January 14, 2026)
- **EIN:** 41-3618003 · **UEI:** KDDVD1FGLW35 · **CAGE:** 209N1 · **SAM Status:** Active through 2027-05-06

**Technical Point of Contact**
- Name: Terry D. Flood, DHA — *President*, The Collaborative Advocate Foundation
- Mailing Address: Pflugerville, TX *(full address on file in SAM.gov)*
- Telephone: *on file*
- Email: terryflood@thrivingcommunitiesforall.com

**Administrative Point of Contact**
- Name: Meredith Sisnett, MS — *Chief Growth Officer*, TCAF
- Mailing Address: Pflugerville, TX
- Telephone: *on file*
- Email: msisnett@thrivingcommunitiesforall.com

**Estimated Project Duration:** 24 months (Base) + 12-month Option = 36 months maximum

**Total Basis of Estimate:** **$5,475,000** (24-month Base) · Option: $2,150,000 · Maximum total: $7,625,000

**Resource Sharing:** Gov't 100% / Performer 0% (no cost share proposed; TCAF and sub-awardees commit substantial in-kind platform infrastructure separately quantified in §BOE)

**Place(s) of Performance:** Pflugerville, TX (TCAF) · Austin/Manor/Pflugerville TX corridor (BirthRight deployment hubs) · Remote (distributed engineering team)

### Sub-Awardees and Consultant Team Members

| Organization | Technical POC | Type | Role |
|---|---|---|---|
| **M&T Consulting Solutions LLC** (UEI NLAWXBLCUW54, CAGE 1NDG6, Pflugerville TX) | Terry D. Flood, DHA — CEO | ☒ For-Profit | Deployment surface (BirthRight platform), 3,009-provider directory, Rhonda AI companion, maternal-health domain expertise |
| **Academic Evaluation Partner** *(letter of intent in negotiation: Dell Medical School / UT School of Public Health)* | TBD | ☒ Academia | Matched-cohort CPS-linkage evaluation, IRB stewardship, Title IV-E Clearinghouse evaluation-design oversight |
| **Clinical Standards Consultant** *(NCSBS — National Center on Shaken Baby Syndrome)* | TBD | ☒ Non-profit | Period of PURPLE Crying integration, AHT-prevention fidelity review |

---

## Compliance Crosswalk to Section 5.2 Evaluation Criteria

| Section 5.2 Criterion (verbatim, descending importance) | Where addressed in this Solution Summary |
|---|---|
| **1. Overall Scientific and Technical Merit** — innovative, feasible, complete; tasks in logical sequence with deliverables clearly defined; major technical risks and mitigations defined and feasible | Concept Summary · Innovation and Impact · Proposed Work (Deliverables, Milestones M03–M36, Technical Approach, New Technical Developments, Risk Register) |
| **2. Potential Contribution and Relevance to the ARPA-H Mission** — future R&D / commercial / clinical applications; unmet need; transformative + multidisciplinary; IP / open-source structure; commercialization & transition strategy | Innovation and Impact (Disruption paragraph) · Proposed Work (Deliverables 1–5: Apache 2.0 risk model, HL7 standards submission, Title IV-E Clearinghouse package) · *Commercialization & Transition Pathway* (Team section) |
| **3. Proposer's Capabilities and/or Related Experience** — team expertise/experience; ability to deliver on time/budget; similar efforts including other government or commercial work | Team Organization and Capabilities · *Similar Efforts* mini-section · Sub-awardee / consultant roster |
| **4. Cost/Price/Budget Assessment** — alignment with technical solution; understanding of resources, schedule, risks, effort; sufficient information for efficient evaluation | Basis of Estimate (line-item BOE table + Resource Sharing posture + explicit response to Section 5.2 NOTE on appropriate risk/seniority) |

---

## Concept Summary

PFC-Window is a **prophylactic AI platform**, not a curriculum, that detects parents in the prefrontal-cortex consolidation window (**ages 15–32**) at elevated risk for caregiver-perpetrated maltreatment, then delivers culturally- and dialect-honoring just-in-time intervention before harm occurs. The 15–32 envelope is anchored to three independently verified evidence pillars: adolescent and emerging-adulthood PFC immaturity (Lebel & Beaulieu, *J Neurosci* 2011, longitudinal DTI ages 5–32 showing prefrontal association-tract maturation continues into the third decade; Arnett, *Am Psychol* 2000); intergenerational-transmission risk (Putnam-Hornstein et al., *Am J Epidemiol* 2015, n=85,084 first-time California teen mothers ages 15–19, HR 3.19 for next-generation CPS among those with substantiated maltreatment history); and per-capita perpetration concentration (NCANDS *Child Maltreatment 2022*, Ch. 5, parents 25–34 at 3.9/1,000 adults — highest per-capita rate of any adult age cohort). Chronological 15–32 defines the screening universe; eligibility fires on the PFC-consolidation risk model, not age alone. It addresses **PHO interest areas 1.i** (prophylactic prevention of harmful outcomes), **2.i and 2.ii** (population-scale methods to inform and to incentivize healthy caregiver behaviors), and **3.i** (novel, robust, and predictive surrogates for long-term health outcomes).

The platform fuses three production technologies already shipped at TCAF/BirthRight — a four-domain SDOH risk engine, validated psychometric instruments (PHQ-9, GAD-7, C-SSRS, PCL-5, ACES), and a 24/7 dialect-preserving AI companion — with three novel components built under this award: a **PFC-window caregiver risk model** trained against perpetration epidemiology; a **moment-of-stress passive-signal detector** for prophylactic intervention; and a **CPS-linked predictive surrogate** validated against administrative outcomes. A curriculum module ("It's No Longer About You") is one downstream deliverable inside the platform — not the platform.

**Why this is in scope and not an "education and training" exclusion (Section 2.1):** This is novel-technology development of a digital-health detection-and-intervention platform with an FHIR + CDS-Hooks interoperable surrogate biomarker as the core scientific deliverable. Educational content delivered through the platform is a downstream artifact, in the same sense that a clinical-decision-support tool is not "education" merely because it surfaces guidance to a clinician.

---

## Innovation and Impact

### Problem and outcomes sought

| Outcome | Magnitude (verbatim primary source) | Source |
|---|---|---|
| U.S. children killed by abuse/neglect, FFY 2022 | **1,990** at 2.73 per 100,000 children | NCANDS *Child Maltreatment 2022*, Ch. 4 |
| Increase 2018→2022 | **+12.7%** (from 1,765 to 1,990) | Same |
| Fatalities involving ≥1 parent | **81.8%** | NCANDS CM 2022, Ch. 4 verbatim |
| Children <1 yr — share of all maltreatment fatalities | **45.4%** | Children's Bureau/CWIG factsheet March 2021, Fig. 1 |
| Maltreatment deaths not recorded as such on death certificates | **50–60%** undercount | Schnitzer & Ewigman, *Pediatrics* 2005 |
| Abusive head trauma share of child-maltreatment deaths under five | **~one-third** | American SPCC |
| Largest perpetrator cohort: parents age **25–34** | **39.9%** of all perpetrators at **3.9 per 1,000 adults** (highest per-capita rate) | NCANDS CM 2022, Ch. 5 verbatim |
| Substantiated maternal-maltreatment history → next-generation CPS involvement | **adjusted HR = 3.19 (95% CI 3.00–3.39)** | Putnam-Hornstein et al., *Am J Epidemiol* 2015, n=85,084 |
| ACEs-attributable adult disease (preventable share if ACEs prevented) | Heart disease **22%** · Depression **78%** · HS-student suicide attempts **89%** | CDC *About ACEs*, March 2026 |
| Life-expectancy reduction, ≥6 ACEs vs 0 ACEs | **~20 years** (60.6 vs 79.1) | Brown et al., *Am J Prev Med* 2009, n=17,337 |

The scientific alignment that makes this novel technology possible: the cohort with the highest per-capita maltreatment perpetration rate (25–34, 3.9/1,000) sits inside the same prefrontal-cortex consolidation window — extending from adolescence through the third decade — that Lebel & Beaulieu (*J Neurosci* 2011, n=103, 221 scans, ages 5–32), Giedd et al. (*Nat Neurosci* 1999), and Arnett (*Am Psychol* 2000) collectively describe. The 15–32 operational envelope additionally captures the intergenerational-transmission cohort that Putnam-Hornstein 2015 quantified (teen mothers ages 15–19, HR 3.19 for next-generation CPS) and the foster-youth-to-young-parent pipeline that Courtney Midwest Wave 5 documented (79.2% pregnant by 26 vs. 55% Add Health peers). **Per a May 2026 review of the Title IV-E Prevention Services Clearinghouse, no listed intervention is explicitly designed around this PFC-consolidation window for caregivers ages 15–32.** Our hypothesis — to be validated under this OT — is that no production platform currently fuses validated psychometric instruments, passive moment-of-stress signal detection, dialect-preserving conversational AI, and administrative-outcome (CPS-linkage) validation into a single prophylactic surrogate. A formal landscape scan is included in the Year-1 work plan to confirm or falsify this gap analysis.

### Comparison to the state of the art

| Capability | State-of-art baseline (2026) | PFC-Window Year 1 target | PFC-Window Year 2–3 target |
|---|---|---|---|
| **Population-scale risk detection for the PFC-window caregiver cohort** | None — Title IV-E Clearinghouse lists zero PFC-window programs | Risk model deployed across BirthRight cohort, sensitivity ≥0.75 / specificity ≥0.80 against PHQ-9/GAD-7/ACES composite | CPS-linkage validation, AUC ≥0.78 against substantiated-event outcomes |
| **Moment-of-stress prophylactic intervention** | Period of PURPLE Crying delivers anticipatory video at one teachable moment (birth) | Real-time conversational + passive-signal escalation in production, 24/7, 10+ language coverage | Demonstrated ≥0.3 effect size on DERS pre/post in matched cohort |
| **Predictive surrogate validated against CPS administrative outcomes** | None established for this cohort | Matched-cohort design IRB-approved, data-use agreement executed with ≥1 state CPS partner | Predictive surrogate manuscript submitted to *JAMA Pediatrics* or *Pediatrics* |
| **FHIR + CDS-Hooks interoperable surrogate** | No standardized risk codes for parental PFC-window risk | FHIR profile published; CDS-Hook firing at well-baby and prenatal visits in ≥1 pilot health system | Open-source release; submission to HL7 for inclusion |
| **Dialect-honoring reach** to disproportionately affected populations | Most digital interventions ship English-only or naive Spanish | AAVE + Spanglish + 8 additional languages (existing TCAF capability extended to parenting-stress context) | Documented engagement parity across English, AAVE, Spanish, Spanglish, Vietnamese, Mandarin cohorts |
| **Sustainability** | Most ARPA-H–funded interventions stop when the OT ends | Title IV-E Clearinghouse evaluation design locked from Day 1 | Submitted for "Promising" or "Supported" Clearinghouse tier — unlocks open-ended federal reimbursement |

### Why this is potentially disruptive

Existing maltreatment-prevention infrastructure assumes caregivers arrive at parenthood with mature emotional-regulation capacity, then *teaches techniques.* PFC-Window inverts the model: it treats the PFC-consolidation window as a measurable physiological state, builds a predictive surrogate against it, and delivers prophylactic intervention at the moment the surrogate fires. If validated, the surrogate itself — published as an open FHIR profile and CDS-Hook — becomes the standard against which any future PFC-Window (ages 15–32) caregiver intervention is measured. That is the disruption: not a better curriculum, a new measurement and intervention substrate.

---

## Proposed Work

### Final deliverables

1. **PFC-Window Risk Model v1.0** — production-deployed parent-cohort risk surrogate, trained on validated psychometric instruments (PHQ-9, GAD-7, C-SSRS, PCL-5, ACES) and SDOH inputs, validated against NCANDS perpetration epidemiology and matched-cohort CPS-linkage outcomes. Open-source under Apache 2.0.
2. **Moment-of-Stress Intervention Engine** — production-deployed passive-signal + conversational escalation system, HITL-default-on, with clinician-validated escalation protocols and 24/7 Rhonda AI companion as the front-end. Source code, escalation protocols, and clinician-review datasets delivered to the government.
3. **FHIR + CDS-Hooks Interoperability Profile** — new FHIR profile for PFC-window caregiver risk, CDS-Hook implementation firing at prenatal and well-baby visits in ≥1 pilot health system. Submitted to HL7 for standards inclusion.
4. **CPS-Linkage Predictive Surrogate Study** — IRB-approved matched-cohort design with ≥1 state CPS data-use agreement, manuscript submitted to a peer-reviewed pediatrics journal by Month 30.
5. **Title IV-E Prevention Services Clearinghouse Evaluation Package** — evaluation design, fidelity instrumentation, and implementation manual built to Clearinghouse standards from Day 1; submitted for "Promising" or "Supported" tier review.
6. **"It's No Longer About You" Curriculum Module** — eight modules delivered inside the platform as one downstream intervention artifact (Identity Shift, Brain Science for Parents, Crying Protocol, Sleep & Stress, Cycle Awareness, Network Building, Resource Navigation, Partner & Family Inclusion).

### Key interim milestones

| Month | Milestone |
|---|---|
| M03 | Risk-model v0.1 trained on retrospective TCAF/BirthRight + NCANDS aggregate data; FHIR profile draft v0.1 |
| M06 | Risk-model v1.0 deployed to BirthRight production; PFC-window cohort identified |
| M09 | Moment-of-stress detector v0.1 in HITL-supervised production |
| M12 | IRB approval; first state CPS data-use agreement executed; CDS-Hook live in ≥1 pilot health system |
| M15 | Pre/post DERS + PSOC instrument administration on Year-1 enrollee cohort |
| M18 | Risk-model v2.0 retrained on platform-derived outcomes |
| M21 | Matched-cohort CPS-linkage analysis complete |
| M24 (Base end) | Peer-reviewed manuscript submitted; Clearinghouse evaluation package complete; Option-period decision gate |
| M36 (Option end) | Clearinghouse submission; HL7 standards submission; final platform handoff |

### Technical approach and theoretical foundation

The platform extends three TCAF production systems (verified in `server/foster-youth-risk.ts`, `server/early-warning.ts`, `server/translate-routes.ts`, and the SafeReport FHIR + CDS-Hooks stack with 0-PHI-egress design) with three new components. The foster-youth four-domain risk engine (housing, food, mental health, documents) and the BirthRight maternal-health stack (3,009 providers, Rhonda 24/7 AI companion, 39 CFIR constructs operationalized in `client/src/pages/research-hub.tsx`) provide the deployment substrate. The novel build is the **parent-cohort risk surrogate** trained against the perpetration epidemiology summarized above plus the longitudinal-MRI neurodevelopmental literature (Lebel & Beaulieu 2011; Giedd et al. 1999), the **moment-of-stress passive-signal layer** (sleep-gap, conversational sentiment, time-of-day, contextual cues; HITL-default-on per the SafeReport pattern), and the **CPS-linked outcome validation** against administrative records.

Adoption challenges to be overcome: (a) state CPS data-use-agreement timelines historically range 9–18 months — mitigated by parallel negotiation with three states from Month 1; (b) IRB approval for a vulnerable-population platform-research design — mitigated by engaging the academic partner's IRB as the single IRB of record before Month 3; (c) the cultural-acceptance risk of being perceived as surveillance rather than support — mitigated by TCAF's *Integration through Invitation* dignity primitive (eight layered consents default OFF, self-identification with no credential check, no funder citation without explicit shareWithFunder consent — documented in `docs/agent-memory/topics/integration-through-invitation.md`).

### Does the approach require new technical developments?

Yes — three: (a) the PFC-window caregiver risk model (per our May 2026 literature scan, no validated parent-cohort surrogate built on the alignment of perpetration epidemiology and longitudinal-MRI PFC maturation data has been published; landscape review formally included in the Year-1 work plan); (b) the moment-of-stress detection layer fusing passive signals with HITL-supervised conversational AI (we have not identified a shipped production capability of this kind, but treat this as a working hypothesis to be confirmed by formal landscape scan); and (c) a CPS-administrative-outcome validation pipeline at the scale Putnam-Hornstein et al. (2015) established as feasible for California (n=85,084), extended to a multi-state matched-cohort design.

### Technical-risk register and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| State CPS data-use agreement delays past Month 12 | Medium | Schedule slip; surrogate-validation timeline at risk | Parallel negotiation with 3 states; CA, TX, NY as priority targets given prior data-linkage precedent |
| Risk-model false-positive rate too high → community-trust loss | Medium | Adoption collapse; ethical harm | HITL-default-on; transparent consent flow; minimum-PPV threshold (≥0.65) before any auto-escalation; community advisory board with veto |
| Predictive surrogate fails to validate against CPS outcomes | Low–Medium | Core scientific deliverable fails | Pre-registered analysis plan; Bayesian secondary analysis; if primary endpoint fails, surrogate is published as null result (still high-value scientific contribution) |
| Funder-perceived overlap with "traditional education and training" exclusion | Low (with proper framing) | Non-conforming determination | Curriculum framed as downstream artifact; lead deliverable is the risk surrogate and intervention engine; in-scope rationale explicit on Cover Page |
| AI provider rate-limit / cost runaway from 24/7 conversational load | Low | Budget overrun | Existing TCAF 4-engine failover architecture (Gemini/Claude/GPT-4o-mini/DeepSeek R1, `server/ai-provider.ts`); per-IP rate limiting; capability-token security pattern from foster-youth public-wizard |

### Featured use cases and demonstrations

(1) End-to-end demo: a hypothetical 22-year-old expectant mother enrolls via BirthRight; risk-model fires moderate-risk surrogate; CDS-Hook surfaces during prenatal visit; Rhonda AI companion offers consent-gated PURPLE-Crying anticipatory module + "It's No Longer About You" Identity Shift module; moment-of-stress detector escalates a 2 AM conversational session to HITL-supervised clinician outreach; outcome captured in matched-cohort follow-up. (2) Open-source FHIR profile demonstration at HL7 Connectathon by Month 18. (3) Quarterly community-advisory-board review of false-positive cases with veto authority.

---

## Team Organization and Capabilities

**The Collaborative Advocate Foundation (TCAF) — Prime (lead).** TCAF is a Texas 501(c)(3) public charity (determined January 14, 2026) operating a production digital-health and workforce-development platform comprising **271 database tables, 211 frontend pages, and 84 server-route modules** (primary-source verified May 2026), including a four-engine collaborative AI stack with failover (`server/ai-provider.ts`), an 86-chunk RAG engine grounded in TCAF's own commitment documents, a dialect-aware translation layer preserving AAVE/Spanglish/regional dialects, FHIR + CDS-Hooks with 0-PHI-egress (SafeReport), and 39 CFIR implementation-science constructs operationalized in code. SAM.gov-active through May 2027.

| Key Personnel | Position / Institution | Skills and experience |
|---|---|---|
| **Terry D. Flood, DHA** — *Principal Investigator* | President, TCAF; CEO, M&T Consulting Solutions LLC | Doctor of Health Administration; founder of the TCAF/ThriveUp platform stack; operational lead on the Texas Maternal Health Data Center build-out; will commit >50% effort to this OT |
| **Meredith Sisnett, MS** — *Co-Investigator / Growth Lead* | Chief Growth Officer, TCAF | Implementation science, partner ecosystem development, SAMHSA + St. David's-aligned partnership development, evaluation oversight |
| **Lead AI/ML Engineer** (TCAF FTE, to be named) | TCAF | Risk-model development, FHIR/CDS-Hooks integration, HITL escalation protocols |
| **Academic Evaluation PI** (in negotiation: Dell Med / UT SPH) | Dell Medical School or UT School of Public Health | Matched-cohort study design, CPS-linkage methodology, IRB stewardship, Title IV-E Clearinghouse evaluation-standards expertise |

**M&T Consulting Solutions LLC — Sub-awardee.** Texas LLC (UEI NLAWXBLCUW54, CAGE 1NDG6, SAM-active). Operator of the BirthRight maternal-health-equity platform (3,009 providers in directory, 24/7 Rhonda AI companion, PWA-installable, Austin/Manor/Pflugerville hubs, ThriveUp Black Maternal Health Network integrated, SAMHSA + St. David's-aligned). Provides the deployment surface, maternal-health domain expertise, and provider-network reach. Dr. Flood holds CEO position at M&T with >50% employment confirmed; the TCAF–M&T relationship operates as an arms-length sub-award with documented work-product, IP, and cost separation consistent with TCAF's two-entity firewall posture (TCAF non-profit / for-profit sibling clean separation, per TCAF documented governance).

**Academic Evaluation Partner — Sub-awardee (in negotiation).** Dell Medical School (UT Austin) or UT School of Public Health, finalized within 60 days of selection. Letter of intent to follow with proposal submission.

**Clinical Standards Consultant — National Center on Shaken Baby Syndrome.** Period of PURPLE Crying integration and AHT-prevention fidelity review.

### Similar efforts completed/ongoing (Section 5.2 Criterion 3)

Other government and commercial activities where TCAF/M&T have led or participated, demonstrating delivery within budget and schedule on related work:

- **Texas Maternal Health Data Center** — operational deployment of BirthRight in the Austin / Manor / Pflugerville corridor with 3,009-provider directory, Rhonda 24/7 AI companion, and PWA-installable client (commercial deployment, M&T-led, SAMHSA + St. David's-aligned).
- **TCAF Foster-Youth Risk Engine and Early-Warning Engine** — production four-domain risk surrogate (housing, food, mental health, documents) operating against validated psychometric instruments (PHQ-9, GAD-7, C-SSRS, PCL-5, ACES); same technical pattern that underlies the proposed PFC-window risk model.
- **TCAF SafeReport (FHIR + CDS-Hooks, 0-PHI-egress)** — shipped interoperable clinical-decision-support implementation that is the architectural pattern for the proposed CDS-Hook firing at well-baby and prenatal visits.
- **TCAF four-engine Collaborative AI with failover (`server/ai-provider.ts`)** — production multi-provider AI infrastructure (Gemini, Claude, GPT-4o-mini, DeepSeek R1) with idempotent ethical-AI preamble and HITL-default-on patterns; same infrastructure that will host the moment-of-stress conversational layer.
- **39 CFIR implementation-science constructs operationalized in code** (research hub) — demonstrating TCAF's track record of translating implementation-science frameworks directly into deployed product, the same capability required for Title IV-E Clearinghouse evaluation-design fidelity.

### Commercialization and transition pathway (Section 5.2 Criterion 2)

The risk model is released under Apache 2.0; the FHIR profile and CDS-Hook are submitted to HL7 for standards inclusion; the curriculum module is open under a CC-BY-NC-SA license. The primary transition vehicle is the **Title IV-E Prevention Services Clearinghouse**: a "Promising" or "Supported" listing converts the OT-funded pilot into an open-ended federal-entitlement reimbursement engine, with every state child welfare agency as a distribution partner — turning the ARPA-H investment into sustained federal payer-side adoption without further appropriation. Secondary transition: integration into existing TCAF and BirthRight production deployments for direct community reach.

---

## Basis of Estimate (BOE)

**Total 24-month Base BOE: $5,475,000.** All figures are ROM-class estimates anchored to TCAF/M&T burdened labor rates, prevailing federal indirect benchmarks (TCAF de minimis 10% in absence of NICRA), and quoted sub-award costs. Final cost proposal will be developed using the Bundle of Attachments Cost Proposal Workbook upon ARPA-H feedback.

| Basis of Estimate (BOE) | Amount (Base, 24-mo) |
|---|---|
| **Direct labor** — TCAF (PI Flood 50% FTE, Co-PI Sisnett 30% FTE, Lead AI/ML Engineer 100% FTE, 2 software engineers @ 100% FTE, 1 evaluation analyst 50% FTE, 1 community liaison 50% FTE) | $1,850,000 |
| **Sub-awards** — M&T Consulting Solutions LLC (BirthRight platform integration, provider-network engagement, Rhonda AI extension) | $725,000 |
| **Sub-awards** — Academic Evaluation Partner (matched-cohort design, IRB, CPS-linkage analysis, manuscript) | $640,000 |
| **Sub-awards** — NCSBS Clinical Standards Consultant | $85,000 |
| **AI/cloud infrastructure** (4-engine collaborative AI usage, RAG hosting, FHIR server, CDS-Hooks endpoint, monitoring) | $410,000 |
| **State CPS data-use agreement legal + data-stewardship costs** (3 state parallel negotiation) | $235,000 |
| **Materials, supplies, software licenses** | $95,000 |
| **Travel** (HL7 Connectathon, ARPA-H program reviews, state-CPS in-person negotiations) | $75,000 |
| **Community advisory board honoraria + community-engagement stipends** (Integration through Invitation dignity primitive — real stipends for shadow workers, not aspirational) | $185,000 |
| **Fringe benefits @ 28% on direct labor** | $518,000 |
| **Indirect costs @ 10% de minimis** | $475,000 |
| **Profit/Fee** | $0 (non-profit prime; no fee on TCAF direct work) |
| **Sub-total before contingency** | $5,293,000 |
| **Management reserve (≤4%)** | $182,000 |
| **Total Base (24 months)** | **$5,475,000** |
| Option period (12 mo) — Clearinghouse submission + HL7 standards push + scaled deployment | $2,150,000 |
| **Total with Option (36 months)** | **$7,625,000** |

**Response to Section 5.2 NOTE (appropriate risk and seniority).** This BOE deliberately staffs the program with senior technical leadership (PI Flood at DHA, dedicated Lead AI/ML Engineer at 100% FTE, peer-reviewed academic Evaluation PI) and funds the three genuinely novel technical developments (risk model, moment-of-stress detector, CPS-linkage surrogate) rather than proposing a low-risk minimum-uncertainty extension of existing work. The risk register in Proposed Work documents the real technical risks we are choosing to take on; the BOE is sized to retire those risks, not avoid them.

**Resource sharing:** Gov't 100% / Performer 0%. TCAF commits substantial in-kind infrastructure (existing 271-table platform, 4-engine AI stack, BirthRight provider network, RAG engine, FHIR/CDS-Hooks code, 39 CFIR constructs) as the foundation on which this OT builds — separately documented in TCAF's capabilities inventory and available on request. No cash cost-share proposed.

---

## Citations *(excluded from 6-page count per Appendix A)*

1. U.S. HHS, Administration for Children and Families, Children's Bureau. *Child Maltreatment 2022.* https://acf.gov/cb/report/child-maltreatment-2022
2. Children's Bureau / Child Welfare Information Gateway. *Child Abuse and Neglect Fatalities 2019: Statistics and Interventions.* March 2021 factsheet, Figure 1.
3. Schnitzer PG, Ewigman BG. "Child Deaths Resulting From Inflicted Injuries: Household Risk Factors and Perpetrator Characteristics." *Pediatrics.* 2005;116(5):e687–e693.
4. CDC. *About Adverse Childhood Experiences.* Updated March 2026. https://www.cdc.gov/aces/about/
5. CDC. *Vital Signs: Adverse Childhood Experiences.* November 2019.
6. Felitti VJ, Anda RF, Nordenberg D, et al. *Am J Prev Med.* 1998;14(4):245–258.
7. Brown DW, Anda RF, Tiemeier H, et al. *Am J Prev Med.* 2009;37(5):389–396.
8. Putnam-Hornstein E, Cederbaum JA, King B, Cleveland J, Needell B. *Am J Epidemiol.* 2015;181(7):496–503.
9. Lebel C, Beaulieu C. *J Neurosci.* 2011;31(30):10937–10947.
10. Giedd JN, Blumenthal J, Jeffries NO, et al. *Nat Neurosci.* 1999;2(10):861–863.
11. Arnett JJ. *Am Psychol.* 2000;55(5):469–480.
12. Courtney ME, Dworsky A, Brown A, et al. *Midwest Evaluation of the Adult Functioning of Former Foster Youth: Outcomes at Age 26.* Chapin Hall, 2011.
13. Barr RG. *Child Abuse & Neglect.* 2012;36(9):613–620.
14. National Center on Shaken Baby Syndrome. *Period of PURPLE Crying.* https://dontshake.org/purple-crying
15. American Society for the Positive Care of Children (American SPCC). *Child Maltreatment Statistics.* 2024.
16. CDC WISQARS Leading Causes of Death. https://wisqars.cdc.gov
17. ARPA-H Proactive Health Office Innovative Solutions Opening, **ARPA-H-SOL-24-106**, Amendment 03 (October 14, 2025).
18. Title IV-E Prevention Services Clearinghouse, U.S. ACF. https://preventionservices.acf.hhs.gov
19. HL7 FHIR R4 and CDS Hooks specifications.

**Source-verification audit trail:** every quantified claim above is traceable to a verbatim primary-source quote captured in `docs/grants/arpa-h-no-longer-about-you/04-verified-sources.md` (research record May 2026).

---

*Prepared by The Collaborative Advocate Foundation (TCAF, prime) with M&T Consulting Solutions LLC (sub-awardee) for ARPA-H Proactive Health Office ISO Solution Summary submission, May 26, 2026.*
