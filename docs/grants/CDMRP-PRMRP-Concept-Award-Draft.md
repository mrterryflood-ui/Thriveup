# CDMRP PRMRP Concept Award — Pre-Application Draft
## Implementing Genetic Variant Screening for Autoimmune Uveitis and Retinal Neurodegeneration in Underserved Populations

---

**Program:** Department of Defense Congressionally Directed Medical Research Programs (CDMRP)
**Mechanism:** Peer Reviewed Medical Research Program (PRMRP) — Concept Award
**CFDA:** 12.420
**Estimated Funding:** Up to $385,000 (direct costs) from ~$370M PRMRP portfolio
**Topic Area:** Autoimmune Disorders (Topic #6) / Vision Injury and Trauma
**Submission Portal:** eBRAP.org (Pre-Application) → Grants.gov (Full Application)
**FY2026 Status:** Pre-announcement phase; FOAs expected May–August 2026 based on FY25 patterns
**PI:** Terry Flood, DHA
**Organization Type:** Veteran-Owned Small Business (VOSB) Nonprofit, EIN 41-3618503

---

## 1. BACKGROUND AND SIGNIFICANCE

### The Clinical Problem
Autoimmune uveitis is a sight-threatening inflammatory condition affecting 115 per 100,000 persons in the United States, responsible for 10–15% of preventable blindness (Suttorp-Schulten & Rothova, 1996; Gritz & Wong, 2004). Current first-line treatment relies on steroidal anti-inflammatory medications that produce significant unwanted side effects with long-term use, including glaucoma, cataracts, and systemic immunosuppression. There is no effective treatment for many types of retinal degeneration, and emerging IL-34 therapeutic pathways (NIH OTT, 2026) remain years from clinical implementation.

### The Military Relevance
Between 2000 and 2017, over 275,000 eye injuries were documented in U.S. Armed Services, with more than 6,000 classified as high risk of blindness (CDMRP VRP). Blast-related traumatic brain injury (TBI) frequently presents with secondary visual symptoms, including uveitis and retinal neurodegeneration. Service Members, Veterans, and their families face disproportionate barriers to specialty ophthalmic care, particularly in rural and underserved areas.

### The Health Equity Gap
Black Americans face 6–8× higher risk of glaucoma-related blindness and a 40–46% gap in diabetic retinopathy screening compared to White Americans. Hispanic/Latino populations experience higher prevalence of diabetic eye disease. These disparities are amplified among military families stationed in medically underserved areas, where access to genetic testing and specialty ophthalmology is limited.

### The Innovation Opportunity
Recent breakthroughs in protein language models — particularly Meta AI's ESM (Evolutionary Scale Modeling) family — now enable zero-shot prediction of variant pathogenicity across the entire human missense landscape (~450 million variants; Brandes et al., Nature Genetics, 2023). ESM3, published in *Science* (January 2025), reasons across protein sequence, structure, and function simultaneously. VESM-3B (Nature Methods, 2026) outperforms Google DeepMind's AlphaMissense at distinguishing rare pathogenic from rare benign mutations — the central unsolved problem in clinical genetics.

These tools are open-source and freely accessible for academic research, yet **no implementation study has examined how to deploy AI-enhanced genetic variant screening in routine clinical practice for autoimmune uveitis and retinal disease, particularly in underserved populations.**

---

## 2. SPECIFIC AIMS

### Aim 1: Characterize the Implementation Landscape for Genetic Variant Screening in Autoimmune Uveitis
Using the Consolidated Framework for Implementation Research (CFIR), we will conduct a systematic assessment of barriers and facilitators to implementing genetic variant screening for autoimmune uveitis in community ophthalmology settings serving underserved populations. This will include key informant interviews with ophthalmologists, retina specialists, uveitis specialists, genetic counselors, and patients across 3 clinical sites.

**Sub-aim 1a:** Map the current referral pathway from uveitis diagnosis to genetic counseling, identifying decision points where AI-enhanced variant interpretation could accelerate clinical action.

**Sub-aim 1b:** Assess provider and patient readiness for AI-enhanced genetic screening using validated measures (Organizational Readiness for Implementing Change [ORIC]; Patient Perception of AI in Healthcare Scale).

### Aim 2: Develop and Pilot a Technology-Enabled Implementation Strategy for AI-Enhanced Variant Screening
We will develop an implementation strategy integrating: (a) ESM protein language model variant scoring via the EvolutionaryScale Forge API; (b) ClinVar and gnomAD population data; (c) clinical decision support embedded in a digital health platform (RPLICE); and (d) patient navigation for genetic counseling and clinical trial matching.

**Sub-aim 2a:** Build and validate the Genetic Variant Intelligence module within the RPLICE platform, connecting variant analysis to implementation planning via MAP-GAP (Measure-Assess-Plan / Gap-Adapt-Progress) governance.

**Sub-aim 2b:** Pilot the integrated system with 50 patients newly diagnosed with autoimmune uveitis across 3 community ophthalmology sites, measuring: (i) time from diagnosis to genetic variant interpretation; (ii) proportion receiving guideline-concordant genetic counseling; (iii) patient-reported outcomes on decisional conflict and health literacy.

### Aim 3: Evaluate Implementation Outcomes Using RE-AIM
Using the RE-AIM framework (Reach, Effectiveness, Adoption, Implementation, Maintenance), we will evaluate the pilot implementation across all 5 dimensions, with particular attention to equity in Reach across racial/ethnic groups and Adoption across provider types.

**Sub-aim 3a:** Assess differential reach by race/ethnicity, insurance status, and geographic access to determine whether the technology-enabled approach reduces or reproduces existing disparities.

**Sub-aim 3b:** Develop a sustainability plan and cost analysis for scaling the intervention across the VA system and community health networks.

---

## 3. INNOVATION

This project introduces three innovations:

1. **First implementation study of AI protein language models in clinical ophthalmology.** While ESM and AlphaMissense have demonstrated remarkable accuracy in variant pathogenicity prediction, no study has examined how to implement these tools in routine clinical care. We bridge this gap using established implementation science frameworks.

2. **Bidirectional Planning Engine methodology.** Our novel planning approach — inspired by Wheeler's delayed-choice experiment in quantum mechanics — combines forward implementation planning with reverse-engineered outcome mapping to produce hybrid plans that neither perspective alone can generate. This methodology is documented on the RPLICE platform and represents a publishable contribution to implementation science methodology.

3. **SDOH-grounded, AI-enhanced implementation.** When ZIP codes are provided, our platform auto-pulls Census, CDC PLACES, crime, healthcare infrastructure, environmental, education, and behavioral health data from federal APIs. All AI engines receive this real-time community profile, grounding every implementation step in actual population conditions rather than assumptions.

---

## 4. APPROACH

### Phase 1: Formative Assessment (Months 1–6)
- CFIR-guided key informant interviews (n=30) with ophthalmologists, genetic counselors, and patients across 3 community sites
- Environmental scan of existing genetic testing pathways for uveitis
- Provider readiness assessment (ORIC)
- Patient perception assessment
- Social Determinants of Health (SDOH) location intelligence analysis for each clinical site using federal data APIs

### Phase 2: Development and Integration (Months 3–9)
- Configure Genetic Variant Intelligence module for uveitis-specific variants (HLA-B27, IL23R, IL10, TNFAIP3, IRF5)
- Integrate ESM variant scoring with clinical decision support
- Build patient-facing genetic education materials using the platform's Educational Design System
- Develop clinical workflow integration with site EHR systems
- MAP-GAP governance framework implementation

### Phase 3: Pilot Implementation (Months 6–18)
- Recruit 50 newly diagnosed autoimmune uveitis patients across 3 sites
- Implement AI-enhanced genetic variant screening workflow
- Monthly MAP-GAP cycle reviews (Measure-Assess-Plan / Gap-Adapt-Progress)
- Real-time barrier tracking using Dynamic Barriers & Facilitators tool
- Continuous quality improvement using SALP (Self-Advancing Learning Protocol) engine

### Phase 4: Evaluation and Sustainability (Months 15–24)
- RE-AIM evaluation across all 5 dimensions
- Health equity analysis (differential reach by demographics)
- Implementation cost analysis
- Sustainability planning using Scale-Up & Spread Planner
- Manuscript preparation and dissemination

### Design Considerations
- **Study Design:** Hybrid Type 2 effectiveness-implementation design (Curran et al., 2012)
- **Implementation Framework:** CFIR (inner + outer setting) + RE-AIM (evaluation)
- **Governance:** MAP-GAP adaptive learning (continuous throughout)
- **Planning:** Bidirectional Planning Engine (Wheeler methodology)
- **Equity Lens:** SDOH Location Intelligence, Equity-Focused TMF Adapter

---

## 5. MILITARY RELEVANCE

This project directly addresses CDMRP PRMRP priorities:

- **Autoimmune Disorders (Topic #6):** Autoimmune uveitis is an autoimmune condition with significant military-relevant sequelae
- **Vision Injury and Trauma:** Retinal neurodegeneration affects blast-exposed Service Members
- **Health of Military Families:** Vision health navigation for dependents in underserved areas
- **Implementation Focus:** Translating breakthrough AI tools into clinical practice — the CDMRP's stated goal of "making a difference"

The VA health system represents a natural scaling pathway, with 170+ VA medical centers and partnerships with DoD Military Treatment Facilities.

---

## 6. ECOSYSTEM INTEGRATION

This project leverages a 10-platform health technology ecosystem:

| Platform | Role in This Project |
|---|---|
| **HerHealth** | Vision & Ocular Health hub (84 conditions), uveitis/DR/AMD/RVO condition platforms |
| **SafeCogniCare** | Retinal neurodegeneration connection to brain neurodegeneration |
| **Autoimmune Thrive** | Uveitis as autoimmune condition, cross-condition navigation |
| **TheHealthyBlkMan** | Prostate cancer genetic variant screening (parallel pathway) |
| **Whole-Person Health** | Mental health support for vision loss patients |
| **M2C** | Veteran transition, TBI-vision connection |
| **LifeBridge** | SDOH hub, access to genetic testing and counseling |
| **PillScheduler** | Medication management for immunosuppressive regimens |
| **Perfectly Different** | Genetic architecture education for families |
| **RPLICE** | Implementation science platform, Genetic Variant Intelligence module |

---

## 7. BUDGET JUSTIFICATION (Concept Award, ~$385K direct costs over 24 months)

| Category | Year 1 | Year 2 | Total |
|---|---|---|---|
| PI (Flood, DHA) — 25% effort | $37,500 | $37,500 | $75,000 |
| Co-I (Ophthalmology) — 10% effort | $20,000 | $20,000 | $40,000 |
| Co-I (Genetic Counselor) — 15% effort | $18,000 | $18,000 | $36,000 |
| Research Coordinator — 50% effort | $30,000 | $30,000 | $60,000 |
| Participant Incentives (n=50) | $5,000 | $5,000 | $10,000 |
| Technology (Platform hosting, API costs) | $15,000 | $15,000 | $30,000 |
| Travel (3 clinical sites) | $10,000 | $10,000 | $20,000 |
| Supplies & Genomic Testing | $20,000 | $15,000 | $35,000 |
| Consultants (Implementation Science) | $10,000 | $10,000 | $20,000 |
| Indirect Costs (negotiated rate) | $29,500 | $29,500 | $59,000 |
| **Total** | **$195,000** | **$190,000** | **$385,000** |

---

## 8. KEY REFERENCES

1. Brandes N, Goldman G, Wang CH, et al. Genome-wide prediction of disease variant effects with a deep protein language model. *Nature Genetics*. 2023;55:1512–1522.
2. Hayes T, Rao R, Akin H, et al. Simulating 500 million years of evolution with a language model. *Science*. 2025;387(6730):eads0018.
3. VESM co-distillation framework. *Nature Methods*. 2026.
4. Damschroder LJ, Reardon CM, Widerquist MAO, Lowery J. The updated Consolidated Framework for Implementation Research. *Implementation Science*. 2022;17:75.
5. Glasgow RE, Vogt TM, Boles SM. Evaluating the public health impact of health promotion interventions: The RE-AIM framework. *Am J Public Health*. 1999;89(9):1322–1327.
6. Curran GM, Bauer M, Mittman B, et al. Effectiveness-implementation hybrid designs. *Medical Care*. 2012;50(3):217–226.
7. Gritz DC, Wong IG. Incidence and prevalence of uveitis in Northern California. *Ophthalmology*. 2004;111(3):491–500.
8. NIH Innovates. Therapeutic to Treat Retinal Inflammation & Neurodegeneration (IL-34). 2026.

---

## 9. TIMELINE

```
Month:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
Phase 1: ████████████████████████
Phase 2:          ████████████████████████████
Phase 3:                   ████████████████████████████████████████████████
Phase 4:                                                 ████████████████████████
MAP-GAP: ████████████████████████████████████████████████████████████████████████████
```

---

## 10. LETTERS OF SUPPORT (TO OBTAIN)

- [ ] Clinical site #1 — Community ophthalmology practice (underserved area)
- [ ] Clinical site #2 — VA Medical Center ophthalmology department
- [ ] Clinical site #3 — Academic medical center (e.g., Geisel School of Medicine affiliation)
- [ ] EvolutionaryScale — ESM/Forge API academic access confirmation
- [ ] Patient advocacy organization — Autoimmune uveitis support
- [ ] State/local health department — Health equity partnership

---

## 11. PRE-SUBMISSION ACTION ITEMS

- [ ] Register for eBRAP.org account (submission portal)
- [ ] Subscribe to CDMRP email alerts for PRMRP FY2026 FOA release
- [ ] Monitor Grants.gov for CFDA 12.420 postings
- [ ] Request EvolutionaryScale Forge API academic access
- [ ] Identify and contact 3 clinical site partners
- [ ] Begin IRB pre-submission planning
- [ ] Prepare Quad Chart (CDMRP format)
- [ ] Draft Statement of Work (SOW) milestones

---

*Generated by RPLICE — The Research-to-Practice Implementation Platform*
*Genetic Variant Intelligence Module + Bidirectional Planning Engine + MAP-GAP Governance*
*Date: April 11, 2026*
