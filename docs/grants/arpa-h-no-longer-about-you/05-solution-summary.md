# SOLUTION SUMMARY

*Per Appendix A: 1″ margins, 11pt Arial, narrative = 3 pages max (cover page, BOE table, and citations are excluded from the page count). Submit via https://solutions.arpa-h.gov/Submit-Solution/.*

---

## Cover Page

**Innovative Solutions Opening:** ARPA-H Proactive Health Office — **ARPA-H-SOL-24-106**, Amendment 03 (October 14, 2025); rolling, closes March 5, 2029.

**Solution Summary Title:** *PFC-Window: A Population-Scale AI Platform for Detecting and Pre-empting Prefrontal-Cortex-Driven Caregiver Risk Before Child Maltreatment Occurs.*

**Submitter (Prime):** **The Collaborative Advocate Foundation (TCAF)** — d/b/a ThriveUp Academy. ☒ Non-profit (IRS 501(c)(3), public charity, determined January 14, 2026). **EIN** 41-3618003 · **UEI** KDDVD1FGLW35 · **CAGE** 209N1 · **SAM** active through 2027-05-06.

**Technical POC:** Terry D. Flood, DHA — *President*, TCAF; Pflugerville, TX; terryflood@thrivingcommunitiesforall.com · **Administrative POC:** Meredith Sisnett, MS — *Chief Growth Officer*, TCAF; msisnett@thrivingcommunitiesforall.com.

**Period:** 24-month Base + 12-month Option = 36 months max. **BOE:** **$5,712,000** Base · $2,150,000 Option · **$7,862,000** max. **Resource Sharing:** Gov't 100% / Performer 0% (substantial in-kind platform infrastructure separately quantified). **Places of Performance:** Pflugerville TX · Austin/Manor/Pflugerville TX corridor · Remote distributed team.

**Sub-awardees and consultants (named at Bundle of Attachments stage; ecosystem identified in §Team):** M&T Consulting Solutions LLC (for-profit; operational deployment partner); Academic Implementation-Science & Evaluation Co-Investigator (academia; candidate institutions: Dartmouth Geisel CTBH/DCIS, UT Austin SPH, Dell Medical School); Clinical Standards Consultant (non-profit; NCSBS).

**Compliance crosswalk to Section 5.2.** Criterion 1 (Tech Merit) → §Concept · §Innovation · §Proposed Work. Criterion 2 (ARPA-H Mission) → §Innovation (disruption) · §Proposed Work (Apache 2.0 / HL7 / Title IV-E). Criterion 3 (Capabilities) → §Team · §Similar Efforts. Criterion 4 (Cost) → §BOE.

<div style="page-break-after: always;"></div>

## 1. Concept Summary and Innovation

**PFC-Window is a prophylactic AI/sensing platform.** It detects parents in the prefrontal-cortex consolidation window (ages **15–32**) at elevated risk for caregiver-perpetrated maltreatment and emits a clinical-decision-support signal that triggers just-in-time, dialect-honoring prophylactic intervention before harm occurs. The 15–32 envelope is anchored to three verified evidence pillars: PFC maturation persists into the third decade (Lebel & Beaulieu 2011 longitudinal DTI n=103, 221 scans ages 5–32); intergenerational transmission is quantified (Putnam-Hornstein 2015, n=85,084 California teen mothers, **HR 3.19** for next-generation CPS); and parents 25–34 carry the **highest per-capita perpetration rate of any adult age cohort (3.9/1,000)** and **39.9% of all maltreatment perpetration** (NCANDS *Child Maltreatment 2022* Ch. 5). Chronological age defines the screening universe; eligibility fires on the risk model. Addresses PHO interest areas **1.i** (prophylactic prevention), **2.i / 2.ii** (population-scale methods to inform/incentivize healthy caregiver behaviors), and **3.i** (novel predictive surrogates for long-term outcomes). **Explicit alignment with ARPA-H universal Mission Office ISO exclusions** (`arpa-h.gov/.../mission-office-iso-know-before-applying`): this is not an "education and training effort" — no funds requested for instructional program development, workforce instruction, or health-literacy instruction. Fundable deliverables (full enumeration in §2) are all technology, data, and standards artifacts: a parent-cohort PFC-window risk surrogate, a moment-of-stress passive-signal detector, a FHIR + CDS-Hooks interoperability profile, a CPS-linked predictive-surrogate validation study, a Title IV-E Clearinghouse evaluation/data package, and an open machine-readable intervention-payload library that the engine retrieves at runtime. Not an incremental advance (no listed Title IV-E Clearinghouse intervention is designed around the PFC-consolidation window for caregivers 15–32; verified May 2026). Not at clinical-trial stage. Not infrastructure, policy, or center coordination.

**Problem at scale.** U.S. child maltreatment fatalities FFY 2022: **1,990** (2.73/100k, **+12.7%** vs. 2018, **81.8%** parent-involved, **45.4%** under age one); **50–60% death-certificate undercount** (Schnitzer & Ewigman 2005); ACEs drive 22% heart disease, 78% depression, ~20-yr life-expectancy loss at ≥6 ACEs (CDC 2026; Brown 2009). **SES is a PFC-window amplifier; PFC-Window is additive to economic policy, not substitutive:** NIS-4 ~9× physical-neglect rate ratio in low-SES households (Sedlak 2010); causal-grade DiD shows **$1 min-wage → 9.6% fewer neglect reports** (Raissian & Bullinger 2017), EITC generosity → reduced CPS involvement (Berger et al. 2017), refundable EITC → marginal AHT-hospitalization reduction (Klevens 2017, P=.08); Pelton 1978 ruled out reporting-bias confounds. Mechanism is multiplicative — material stress compresses the regulation window during the same PFC-consolidation years; material support reduces *load*, PFC-Window builds *capacity* and supplies moment-of-stress reinforcement when load and capacity collide. SDOH inputs ship today in `server/foster-youth-risk.ts` and feed the model directly.

**Disruption + sustainability/sustainment** (Karlin & Cross, *Am Psychol* 2014, PMID 24001035). PFC-Window inverts the prevailing assumption that caregivers arrive at parenthood with mature emotional-regulation capacity — instead, treat the PFC-consolidation window as a measurable physiological state, build a predictive surrogate against it, deliver intervention the moment it fires. *Sustainability* via the **Title IV-E Prevention Services Clearinghouse** pathway ("Promising"/"Supported" listing converts post-OT operating cost from appropriated to entitlement-reimbursed under FFPSA P.L. 115-123, every state CWA as payor); *sustainment* via the open FHIR/CDS-Hook embedded in EHR workflows independent of TCAF, plus core-vs-peripheral fidelity discipline (VA EBP pattern) on a quarterly CAB-reviewed dashboard.

---

## 2. Proposed Work

**Final deliverables (all technology/data; no curriculum or training development requested per the universal ISO exclusion).** (1) **PFC-Window Risk Model v1.0** trained on validated psychometrics (PHQ-9, GAD-7, C-SSRS, PCL-5, ACES) + SDOH, validated against NCANDS perpetration epidemiology and matched-cohort CPS-linkage outcomes; **Apache 2.0**. (2) **Moment-of-Stress Intervention Engine** — passive-signal + conversational escalation, HITL-default-on, 24/7 Rhonda front-end; **Apache 2.0**. (3) **FHIR + CDS-Hooks PFC-window interoperability profile** firing at prenatal/well-baby visits in ≥1 pilot system; submitted to HL7. (4) **CPS-Linkage Predictive Surrogate Study** — IRB-approved matched-cohort, ≥1 state DUA, manuscript by M30. (5) **Title IV-E Prevention Services Clearinghouse Evaluation Package** built to standard from Day 1 (data/evaluation product, not a training program). (6) **Open intervention-content library** — short prophylactic micro-doses (text/voice/video) that the engine retrieves and serves at the moment the risk model fires; sourced from already-validated public-domain clinical guidance (PCAA, NCSBS Period of PURPLE Crying, AHRQ public-domain materials) plus TCAF-original additions, packaged as JSON payloads with FHIR-resource references; **CC-BY-SA-4.0**. This is intervention *content the platform calls* — analogous to how CDS-Hooks systems carry guidance text without constituting an instructional program. **Milestones:** M03 risk-model v0.1 + FHIR draft → M06 v1.0 production → M09 moment-of-stress v0.1 HITL → M12 IRB + first state DUA + CDS-Hook live → M15 DERS+PSOC pre/post → M18 v2.0 retrain → M21 matched-cohort linkage → **M24 Base:** peer-reviewed ms + Clearinghouse package + Option-gate → **M36 Option:** Clearinghouse + HL7 submission + handoff.

**Technical approach.** Extends three shipped TCAF systems (`server/foster-youth-risk.ts`, `server/early-warning.ts`, SafeReport FHIR/CDS-Hooks 0-PHI-egress) and the BirthRight maternal-health stack (3,009 providers, Rhonda 24/7, 39 CFIR constructs) with three novel components: (a) **parent-cohort risk surrogate** trained on perpetration epidemiology + longitudinal-MRI literature + DiD SDOH amplifier features (housing, food, income volatility, public-assistance receipt, sleep-gap); (b) **moment-of-stress passive-signal layer** fusing four user-consented telemetry streams (sleep-gap, sentiment, temporal context, infant-cry tagging), server-side inference, 0-PHI-egress, coarse risk band the only external artifact; (c) **CPS-linked outcome validation** via Putnam-Hornstein-2015 methodology extended multi-state. Validation staged M03 retrospective + CAB → M09 prospective HITL → M21 state-CPS linkage. **Implementation science:** RE-AIM + CFIR + EPIS (Glasgow 1999; Damschroder 2009/2022; Aarons 2011); core (thresholds, ≥0.65 PPV gate, DV-exclusion, T4 mandated-reporter routing, ethical-EI preamble, witness-loop) fixed, peripheral (dialect register, Circle cadence, stipend mechanics, state partner) locally adaptable on a quarterly CAB-reviewed fidelity dashboard.

**Activation pathway + risk.** Five-tier escalation (T0 onboarding · T1 self · T2 parent-designated Warm Circle · T3 Circle + clinician via SafeReport HITL pane · T4 mandatory 988/911/Childhelp/CPS-hotline); T0–T3 CPS engagement is parent-opted-in via FFPSA preventive services. The **Warm Circle** (parent-designated, DV-screened, competency-vetted, stipended $50/qualifying response capped $200/quarter/member) is TCAF's *Integration through Invitation* dignity primitive operationalized — stipends + portable competency records differentiate ITI from extraction. **Top risks:** state CPS DUA delays past M12 → parallel TX/CA/NY negotiation from M01; risk-model false-positive → HITL-default-on, ≥0.65 PPV gate, CAB veto; CPS-linkage surrogate non-validation → pre-registered + Bayesian secondary, null still publishable.

---

## 3. Team, Capabilities, and Commercialization

**TCAF — Prime.** Texas 501(c)(3) public charity running a production digital-health/workforce platform: **271 DB tables, 211 frontend pages, 84 server-route modules** (verified May 2026); four-engine collaborative AI with failover; 86-chunk RAG; dialect-aware translation; FHIR + CDS-Hooks 0-PHI-egress; 39 CFIR constructs operationalized in code. **Key personnel:** **Terry D. Flood, DHA** — *PI*, President TCAF / CEO M&T, founder of the platform stack, >50% effort; **Meredith Sisnett, MS** — *Co-I*, CGO TCAF, implementation science + SAMHSA / St. David's-aligned partnership; **Lead AI/ML Engineer** (TCAF FTE, TBN); **Academic IS & Evaluation Co-I** (candidate pool below; named at Bundle).

**Past-performance, disclosed up front.** TCAF received its federal 501(c)(3) determination January 2026; predecessor capabilities were delivered by the same operational team via **M&T Consulting Solutions LLC** (Texas LLC, UEI NLAWXBLCUW54, CAGE 1NDG6, SAM-active; BirthRight operator; Dr. Flood CEO, >50% employment confirmed; arms-length sub-award with documented work-product/IP/cost separation). DCAA-compliant cost accounting stood up at TCAF in parallel. **On-time delivery evidence:** Texas Maternal Health Data Center / BirthRight (3,009 providers, Rhonda 24/7, dialect-aware); TCAF Foster-Youth Risk Engine (four-domain SDOH surrogate, same pattern as proposed model); TCAF SafeReport FHIR + CDS-Hooks 0-PHI-egress (pattern for proposed CDS-Hook).

**Sub-award capacity + diversification.** TCAF deploys **up to 50% of OT budget as sub-awards/consultancies beyond M&T** (final at Bundle). Four independent vectors, none Dr. Flood-controlled: (i) **Academic IS/evaluation (sub-award)** — Dartmouth Geisel CTBH/DCIS, UT Austin SPH, Dell Medical Pediatrics; (ii) **Community trusted-messenger reach (LOS)** — United Way Greater Austin, Black/Latino faith coalitions; (iii) **National Title IV-E sustainability (LOS)** — Casey Family Programs, Annie E. Casey, Prevent Child Abuse America; (iv) **State CPS DUA pre-positioning (LOI)** — TX DFPS, parallel CA CDSS / NY OCFS. LOS formalized: St. David's. Clinical standards: NCSBS.

---

## Basis of Estimate (BOE) — *excluded from narrative page count*

**Total 24-month Base BOE: $5,712,000.** ROM-class estimates anchored to TCAF/M&T burdened labor rates, prevailing federal indirect benchmarks (TCAF de minimis 10%), and quoted sub-award costs. Final cost proposal developed using the Bundle of Attachments Cost Proposal Workbook upon ARPA-H feedback.

| Cost element | Amount (Base, 24-mo) |
|---|---|
| Direct labor — TCAF (PI 50%, Co-PI 30%, Lead AI/ML 100%, 2 SWE 100%, eval analyst 50%, community liaison 50%) | $1,850,000 |
| Sub-award — M&T (BirthRight integration, provider engagement, Rhonda extension) | $725,000 |
| Sub-award — Academic Evaluation Partner (matched-cohort, IRB, CPS-linkage, manuscript) | $640,000 |
| Sub-award — NCSBS Clinical Standards Consultant | $85,000 |
| AI / cloud infrastructure (4-engine AI, RAG, FHIR server, CDS-Hooks endpoint, monitoring) | $410,000 |
| State CPS data-use agreement legal + data-stewardship (3-state parallel negotiation) | $235,000 |
| Materials, supplies, software licenses | $95,000 |
| Travel (HL7 Connectathon, ARPA-H reviews, state-CPS in-person) | $75,000 |
| Warm Circle competency-based stipends + portable competency records (workforce-side sustainability; ITI) | $300,000 |
| Community advisory board honoraria + community-engagement stipends | $85,000 |
| Fringe benefits @ 28% on direct labor | $518,000 |
| Indirect @ 10% de minimis | $475,000 |
| Profit/Fee | $0 (non-profit prime) |
| Sub-total | $5,493,000 |
| Management reserve (≤4%) | $219,000 |
| **Total Base (24 mo)** | **$5,712,000** |
| Option (12 mo) — Clearinghouse submission + HL7 push + scaled deployment | $2,150,000 |
| **Total with Option (36 mo)** | **$7,862,000** |

**Section 5.2 NOTE response (appropriate risk and seniority).** Senior technical leadership (PI Flood DHA, Lead AI/ML Engineer 100% FTE, peer-reviewed academic Evaluation PI) is funded to retire the three genuinely novel technical risks (risk model, moment-of-stress detector, CPS-linkage surrogate), not to propose a low-risk minimum-uncertainty extension. **Resource sharing:** Gov't 100% / Performer 0%; TCAF in-kind contributions (271-table platform, 4-engine AI, BirthRight network, RAG, FHIR/CDS-Hooks, 39 CFIR constructs) separately documented.

---

## Citations *(excluded from narrative page count per Appendix A)*

1. U.S. HHS / ACF / Children's Bureau. *Child Maltreatment 2022.*
2. Children's Bureau / CWIG. *Child Abuse and Neglect Fatalities 2019: Statistics and Interventions.* March 2021.
3. Schnitzer PG, Ewigman BG. *Pediatrics.* 2005;116(5):e687–e693.
4. CDC. *About Adverse Childhood Experiences.* Updated March 2026.
5. Felitti VJ, Anda RF, Nordenberg D, et al. *Am J Prev Med.* 1998;14(4):245–258.
6. Brown DW, Anda RF, Tiemeier H, et al. *Am J Prev Med.* 2009;37(5):389–396.
7. Putnam-Hornstein E, Cederbaum JA, King B, Cleveland J, Needell B. *Am J Epidemiol.* 2015;181(7):496–503.
8. Lebel C, Beaulieu C. *J Neurosci.* 2011;31(30):10937–10947.
9. Giedd JN, Blumenthal J, Jeffries NO, et al. *Nat Neurosci.* 1999;2(10):861–863.
10. Arnett JJ. *Am Psychol.* 2000;55(5):469–480.
11. Sedlak AJ, Mettenburg J, Basena M, et al. *Fourth National Incidence Study of Child Abuse and Neglect (NIS-4): Report to Congress.* USHHS/ACF, 2010 (Table 5-2).
12. Raissian KM, Bullinger LR. *Children Youth Serv Rev.* 2017;72:60–70.
13. Berger LM, Font SA, Slack KS, Waldfogel J. *Rev Econ Household.* 2017;15:1345–72.
14. Klevens J, Schmidt B, Luo F, Xu L, Ports KA, Lee RD. *Child Abuse Negl.* 2017 (refundable EITC → AHT hospitalizations).
15. Pelton LH. *Am J Orthopsychiatry.* 1978;48(4):608–17.
16. Courtney ME, Dworsky A, Brown A, et al. *Midwest Evaluation of the Adult Functioning of Former Foster Youth: Outcomes at Age 26.* Chapin Hall, 2011.
17. Karlin BE, Cross G. *Am Psychol.* 2014;69(1):19–33 (PMID 24001035).
18. Glasgow RE, Vogt TM, Boles SM. *Am J Public Health.* 1999;89(9):1322–7 (RE-AIM).
19. Damschroder LJ, Aron DC, Keith RE, et al. *Implement Sci.* 2009;4:50 (CFIR; updated 2022).
20. King DK, Shoup JA, Raebel MA, et al. *Front Public Health.* 2020;8:194 (PMC7063029).
21. Aarons GA, Hurlburt M, Horwitz SM. *Adm Policy Ment Health.* 2011;38(1):4–23 (EPIS).
22. Title IV-E Prevention Services Clearinghouse, U.S. ACF. https://preventionservices.acf.hhs.gov
23. ARPA-H Proactive Health Office ISO, ARPA-H-SOL-24-106, Amendment 03 (October 14, 2025).
24. HL7 FHIR R4 and CDS Hooks specifications.

**Source-verification audit trail:** every quantified claim above is traceable to a verbatim primary-source quote in `docs/grants/arpa-h-no-longer-about-you/04-verified-sources.md`.

---

*Prepared by The Collaborative Advocate Foundation (TCAF, prime) with M&T Consulting Solutions LLC (sub-awardee) for ARPA-H Proactive Health Office ISO Solution Summary submission, May 26, 2026.*
