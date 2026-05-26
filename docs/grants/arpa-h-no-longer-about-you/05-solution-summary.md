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

---

## 1. Concept Summary and Innovation

**PFC-Window is a prophylactic AI platform, not a curriculum.** It detects parents in the prefrontal-cortex consolidation window (ages **15–32**) at elevated risk for caregiver-perpetrated maltreatment and delivers culturally- and dialect-honoring just-in-time intervention before harm occurs. The 15–32 envelope is anchored to three verified evidence pillars: PFC maturation persists into the third decade (Lebel & Beaulieu 2011 longitudinal DTI n=103, 221 scans ages 5–32); intergenerational transmission is quantified (Putnam-Hornstein 2015, n=85,084 California teen mothers, **HR 3.19** for next-generation CPS); and parents 25–34 carry the **highest per-capita perpetration rate of any adult age cohort (3.9/1,000)** and **39.9% of all maltreatment perpetration** (NCANDS *Child Maltreatment 2022* Ch. 5). Chronological age defines the screening universe; eligibility fires on the risk model. Addresses PHO interest areas **1.i** (prophylactic prevention), **2.i / 2.ii** (population-scale methods to inform/incentivize healthy caregiver behaviors), and **3.i** (novel predictive surrogates for long-term outcomes). **In scope (not §2.1 "education and training"):** the core scientific deliverable is a **FHIR + CDS-Hooks PFC-window risk surrogate** with a moment-of-stress intervention engine; curriculum is one downstream artifact inside the platform.

**Problem at scale.** U.S. child maltreatment fatalities FFY 2022: **1,990** (2.73/100k), **+12.7%** vs. 2018, **81.8%** parent-involved, **45.4%** under age one; **50–60% death-certificate undercount** (Schnitzer & Ewigman 2005); ACEs drive 22% heart disease, 78% depression, 89% HS-student suicide attempts (CDC 2026), with ~20-year life-expectancy reduction at ≥6 ACEs (Brown 2009, n=17,337). **SES is a known PFC-window amplifier and PFC-Window is additive to economic policy, not substitutive:** NIS-4 documents a **~9× physical-neglect rate ratio** in low-SES households (Sedlak 2010, Table 5-2); causal-grade DiD shows a **$1 minimum-wage increase → 9.6% fewer neglect reports** (Raissian & Bullinger 2017; −10.8% for children ≤5, null for adolescents), EITC-generosity IV → reduced CPS involvement (Berger/Font/Slack/Waldfogel 2017), refundable EITC → marginal AHT-hospitalization reduction (Klevens 2017, P=.08). Pelton 1978 ruled out reporting-bias confounds (80% Philadelphia / 70% NYC fatality-parents on public assistance). Mechanism is multiplicative — material stress compresses the prefrontal regulation window during the same PFC-consolidation years. Material support reduces *load*; PFC-Window builds *capacity* and supplies *moment-of-stress reinforcement* when load and capacity collide. SDOH inputs (housing, food, mental health, documents) ship today in `server/foster-youth-risk.ts` and feed the model directly.

**Disruption.** Existing infrastructure assumes caregivers arrive at parenthood with mature emotional-regulation capacity, then teaches techniques. PFC-Window inverts the model — treat the PFC-consolidation window as a measurable physiological state, build a predictive surrogate against it, deliver intervention at the moment it fires. **Per a May 2026 Title IV-E Prevention Services Clearinghouse review, no listed intervention is explicitly designed around this PFC-consolidation window for caregivers 15–32.** The surrogate, published as an open FHIR profile and CDS-Hook, becomes the standard for any future PFC-window intervention. **Sustainability vs. sustainment, both engineered** (Karlin & Cross, *Am Psychol* 2014, PMID 24001035): *sustainability* via the Title IV-E Prevention Services Clearinghouse pathway (a "Promising" or "Supported" listing converts post-OT operating cost from appropriated to entitlement-reimbursed under FFPSA P.L. 115-123, with every state child-welfare agency as payor); *sustainment* via the open FHIR/CDS-Hook embedded in EHR workflows independent of TCAF, core-vs-peripheral fidelity discipline (VA EBP pattern) on a quarterly CAB-reviewed dashboard, and the Warm Circle workforce layer with real stipends and portable micro-credentialing.

---

## 2. Proposed Work

**Final deliverables.** (1) **PFC-Window Risk Model v1.0** — production parent-cohort risk surrogate trained on validated psychometrics (PHQ-9, GAD-7, C-SSRS, PCL-5, ACES) + SDOH inputs, validated against NCANDS perpetration epidemiology and matched-cohort CPS-linkage outcomes; **Apache 2.0**. (2) **Moment-of-Stress Intervention Engine** — passive-signal + conversational escalation, HITL-default-on, 24/7 Rhonda AI front-end. (3) **FHIR + CDS-Hooks Interoperability Profile** — new profile for PFC-window caregiver risk, CDS-Hook firing at prenatal and well-baby visits in ≥1 pilot system; submitted to HL7. (4) **CPS-Linkage Predictive Surrogate Study** — IRB-approved matched-cohort, ≥1 state CPS data-use agreement, manuscript submitted by M30. (5) **Title IV-E Prevention Services Clearinghouse Evaluation Package** — built to Clearinghouse standards from Day 1. (6) **"It's No Longer About You" Curriculum Module** — 8 modules in-platform; **CC-BY-SA-4.0** (NC qualifier intentionally omitted — state CPS agencies routinely contract with commercial intermediaries for training delivery, so NC would foreclose the Title IV-E adoption pathway).

**Milestones.** M03 risk-model v0.1 + FHIR draft → M06 risk-model v1.0 in production → M09 moment-of-stress detector v0.1 HITL-supervised → M12 IRB + first state CPS DUA + CDS-Hook live → M15 DERS+PSOC pre/post → M18 risk-model v2.0 retrained → M21 matched-cohort CPS-linkage complete → **M24 Base end:** peer-reviewed manuscript + Clearinghouse package + Option-gate → **M36 Option end:** Clearinghouse + HL7 submission + handoff.

**Technical approach.** Extends three shipped TCAF systems (`server/foster-youth-risk.ts`, `server/early-warning.ts`, SafeReport FHIR/CDS-Hooks 0-PHI-egress) and the BirthRight maternal-health stack (3,009 providers, Rhonda 24/7 AI, 39 CFIR constructs in `client/src/pages/research-hub.tsx`) with three novel components: (a) the **parent-cohort risk surrogate** trained on perpetration epidemiology + longitudinal-MRI literature + DiD SDOH amplifier features (housing instability, food insecurity, income volatility, public-assistance receipt, parental-education proxy, sleep-gap); (b) the **moment-of-stress passive-signal layer** fusing four user-consented telemetry streams (sleep-gap/circadian inference from session-timestamp patterns; conversational-sentiment NLP over the parent–Rhonda chat surface; temporal context; infant-cry-context tagging during a Crying Protocol session) — server-side inference, **0-PHI-egress**, coarse risk band as the only external artifact (CDS-Hook to EHR); (c) **CPS-linked outcome validation** via Putnam-Hornstein-2015 methodology extended to a multi-state matched-cohort design. Validation is staged: M03 retrospective trace against TCAF historical sessions + CAB review; M09 prospective HITL-supervised production with clinician-adjudicated ground truth; M21 matched-cohort linkage against ≥1 state CPS dataset.

**Implementation-science framing.** Engineered as a **multi-component implementation strategy** (Karlin & Cross 2014, PMID 24001035) using **RE-AIM + CFIR** (Glasgow 1999; Damschroder 2009/2022; King-Glasgow 2020, PMC7063029) with **EPIS** accent (Aarons 2011). Core (risk-model thresholds, ≥0.65 PPV gate, DV-exclusion, T4 mandated-reporter routing, ethical-EI preamble, witness-loop) is fixed; peripheral (dialect register, Circle cadence, stipend mechanics, state-specific CPS preventive partner identity) is locally adaptable and logged to a quarterly CAB-reviewed fidelity dashboard.

**Activation pathway.** Five-tier escalation (T0 onboarding · T1 self · T2 parent-designated Warm Circle · T3 Circle + clinician via SafeReport HITL pane · T4 mandatory 988/911/Childhelp/CPS-hotline for imminent danger). CPS engagement at T0–T3 is parent-opted-in via FFPSA preventive-services (Title IV-E reimbursable, relationship-based). The **Warm Circle** (parent-designated, DV-screened, competency-credentialed, stipended at $50/qualifying response capped $200/quarter/member) is the workforce-side sustainability layer — the operationalization of TCAF's *Integration through Invitation* dignity primitive (real stipends and portable micro-credentialing differentiate ITI from extraction).

**Technical risk register** (top 3 of 5). (i) **State CPS DUA delays past M12** — Med likelihood / schedule-slip impact — parallel negotiation TX/CA/NY from M01. (ii) **Risk-model false-positive → community-trust loss** — Med/Med — HITL-default-on, ≥0.65 minimum-PPV gate, CAB veto. (iii) **CPS-linkage surrogate fails to validate** — Low–Med — pre-registered + Bayesian secondary; null result still publishable. (Also tracked: §2.1 exclusion framing risk, AI cost-runaway mitigated by TCAF 4-engine failover.)

---

## 3. Team, Capabilities, and Commercialization

**TCAF — Prime.** Texas 501(c)(3) public charity operating a production digital-health and workforce-development platform: **271 database tables, 211 frontend pages, 84 server-route modules** (primary-source verified May 2026); four-engine collaborative AI with failover (`server/ai-provider.ts`); 86-chunk RAG; dialect-aware translation preserving AAVE/Spanglish/regional dialects; FHIR + CDS-Hooks with 0-PHI-egress; 39 CFIR constructs operationalized in code.

| Key personnel | Role · Institution | Skills |
|---|---|---|
| **Terry D. Flood, DHA** — *PI* | President TCAF; CEO M&T | DHA; founder TCAF/ThriveUp platform stack; Texas Maternal Health Data Center lead; >50% effort committed |
| **Meredith Sisnett, MS** — *Co-I / Growth Lead* | CGO TCAF | Implementation science; partner ecosystem; SAMHSA + St. David's-aligned partnership; evaluation oversight |
| **Lead AI/ML Engineer** (TCAF FTE, TBN) | TCAF | Risk-model development; FHIR/CDS-Hooks; HITL escalation protocols |
| **Academic Implementation-Science & Evaluation Co-I** *(candidate pool below; final named at Bundle of Attachments)* | Dartmouth Geisel CTBH/DCIS · UT Austin SPH · Dell Med | Matched-cohort design; CPS-linkage methodology; IRB stewardship; Title IV-E Clearinghouse evaluation-standards expertise; digital-health implementation science |

**Past-performance posture, disclosed up front.** TCAF received its federal 501(c)(3) determination in January 2026; the shipped capabilities below were delivered through M&T Consulting Solutions LLC and the predecessor build team — the same operational team, on the same platform stack, that will execute this OT under the TCAF prime. DCAA-compliant cost accounting and federal sub-award management are being stood up at TCAF in parallel with this submission, with gap-financing identified in the cost narrative. Evidence of delivery on time/budget: (a) **Texas Maternal Health Data Center / BirthRight production** (Austin/Manor/Pflugerville corridor, 3,009 providers, Rhonda 24/7, dialect-aware, on commercial timeline); (b) **TCAF Foster-Youth Risk Engine** (four-domain SDOH surrogate against validated psychometrics, on sprint plan and budget — same pattern as the proposed PFC-window model); (c) **TCAF SafeReport FHIR + CDS-Hooks 0-PHI-egress** (on architectural target, no overrun — pattern for the proposed CDS-Hook).

**Sub-award capacity and diversification.** TCAF as prime will deploy **up to 50% of total OT budget as sub-awards and consultancies to external academic, community, and national-non-profit partners beyond M&T.** Specific partners finalize at Bundle of Attachments stage; the candidate ecosystem under active conversation, spanning four independent credibility vectors:

| Vector | Candidate partners (illustrative; finalized at Bundle) |
|---|---|
| **Academic implementation-science & evaluation (sub-award)** | **Dartmouth Geisel — CTBH + DCIS:** Dr. Sarah Lord, PhD (Assoc. Prof. Psychiatry/Biomedical Data Sci/Pediatrics; Director, D&I Science Core, CTBH; Co-Director DCIS; 20+ yrs digital-therapeutic D&I) and Dr. Jeremiah R. Brown, PhD (Tenured Prof. Epidemiology; founding Director DCIS; predictive analytics, risk modeling, NLP/ML for HSR). **UT Austin SPH — Population Research Center** (Berger/Font/Slack-aligned; same evidence base; geographic proximity). **Dell Medical School (UT) — Pediatrics** (well-baby CDS-Hook). |
| **Community trusted-messenger reach (LOS)** | **United Way of Greater Austin** (211 + multi-sector convening); **Abundant Life Church** + 2–3 Black/Latino faith-coalition congregations in the corridor. |
| **National non-profit Title IV-E sustainability (LOS)** | **Casey Family Programs** / **Annie E. Casey Foundation** / **Prevent Child Abuse America**. |
| **State CPS data-use-agreement pre-positioning (LOI)** | **TX DFPS** preventive services; parallel outreach to **CA CDSS** and **NY OCFS**. |

Existing aligned partner formalized as LOS: **St. David's Foundation**. Clinical standards consultant retained: **National Center on Shaken Baby Syndrome** (Period of PURPLE Crying / AHT-prevention fidelity). The result is a coalition surrounding the TCAF/M&T core — none of these external co-investigators or partners is Dr. Flood-controlled — so the operational arms-length question is rendered moot by the volume and independence of partners.

**M&T Consulting Solutions LLC — Sub-awardee (operational deployment).** Texas LLC (UEI NLAWXBLCUW54, CAGE 1NDG6, SAM-active). Operator of the BirthRight platform; provides deployment surface, maternal-health domain expertise, and provider-network reach. Dr. Flood holds CEO position at M&T with >50% employment confirmed; the TCAF–M&T relationship operates as an arms-length sub-award with documented work-product, IP, and cost separation.

**Commercialization and transition.** **Risk model + FHIR profile + CDS-Hook: Apache 2.0** (permissive, patent-grant included — clears the HL7 standards-body path and allows EHR vendors and state-contracted developers to embed without legal-review friction). **Curriculum, Warm Circle stipend mechanics, fidelity instrumentation, Clearinghouse evaluation package: CC-BY-SA-4.0** (copyleft preserves community-benefit derivatives; **NC qualifier intentionally omitted** so that state CPS agencies' commercial training-delivery vendors are not foreclosed from Title IV-E reimbursement). Primary transition vehicle: Title IV-E Prevention Services Clearinghouse listing converts the pilot into open-ended federal-entitlement reimbursement with every state child-welfare agency as a distribution partner. Secondary: continued integration into TCAF and BirthRight production deployments for direct community reach.

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
| Warm Circle competency-based stipends + micro-credentialing (workforce-side sustainability; ITI) | $300,000 |
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
