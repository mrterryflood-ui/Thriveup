# Spencer Foundation Small Research Grant -- ISSS + RPLICE + SALP Science

## Grant Overview
- **Funder:** Spencer Foundation
- **Program:** Small Research Grants
- **Amount:** Up to $50,000 (+ optional $10,000 course release supplement)
- **Indirect Costs:** NOT allowed
- **Timeline:** 1-5 years
- **Deadline:** April 15, 2026, 12:00 PM CT
- **Category:** Foundation
- **Status:** Proposal Drafting

---

## Why This Is a Strong Fit

### No University-as-Lead Requirement
Spencer awards to any nonprofit, public institution, school district, or 501(c)(3). TCAF (EIN: 41-3618003) qualifies directly. This sidesteps the IHE partnership barrier faced with NSF.

### Field-Initiated
No requirement to frame around STEM. Proposal can be exactly what ISSS does: implementation science infrastructure for whole-child support. No contorting the proposal to fit a narrow category.

### Budget is Manageable
$50K is enough to fund a rigorous pilot study without massive multi-site trial overhead.

### 1-5 Year Timeline
Flexibility to design a meaningful study.

---

## Platform Architecture for This Grant

### RPLICE (implementationineducatio.com)
- **Full Name:** Research-to-Practice Lifecycle Implementation & Community Evidence
- **What It Is:** Free, AI-powered platform that helps researchers, practitioners, and planners close the gap between what science proves works and what actually gets implemented in communities
- **Core Capabilities:** Search live evidence, assess projects against real community data, build implementation plans, track outcomes -- all in one place
- **Frameworks:** CFIR 2.0 (Consolidated Framework for Implementation Research), RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance), EPIS (Exploration, Preparation, Implementation, Sustainment)
- **Live API Endpoints (via SALP Science backend):**
  - `/api/frameworks/list` -- pulls CFIR, RE-AIM, EPIS framework definitions
  - `/api/research/search?q=...` -- searches curated peer-reviewed research library
  - `/api/ecosystem/status` -- ecosystem connectivity and platform health
- **Multi-AI Analysis:** Multiple AI models (Gemini, Claude, OpenAI) independently analyze the same document/data, then a synthesis step builds consensus -- different perspectives ensure nothing is missed
- **Community Analysis Engine:** Combines live Census tract-level data with RPLICE research library to produce:
  - Three Realities analysis (Research Reality / Political Reality / Ground Truth)
  - CFIR 2.0 Implementation Readiness Assessment (5 domains, scored 1-5)
  - RE-AIM Scorecard (Reach, Effectiveness, Adoption, Implementation, Maintenance)
  - SALP Intervention Plans (Specific, Actionable, Linked, Predictive)
  - Risk & Protective Factor Matrix (education, employment, family structure, income, housing)
  - Grant Alignment & Funding Strategy
  - 90-Day Implementation Roadmaps (3 phases with milestones)
- **Census Data Integration:** Live ACS 5-Year Estimates at tract level -- poverty rates, median income, college attainment, unemployment, marriage rates, two-parent household rates, race/ethnicity demographics, rent/home values, gentrification indicators, income gap calculations
- **Outcome Metrics from Ecosystem:** 500+ validated interventions in evidence-based practice registry, 234 fidelity assessments completed, 67 research translations published, 45 CFIR/RE-AIM evaluations across ecosystem, 34 validated instruments
- **Role in This Grant:** The implementation science engine -- provides the frameworks, fidelity measurement, evidence-practice bridge, and research analysis infrastructure

### ISSS (Integrated Supports for Thriving Youth)
- **What It Is:** Whole-child implementation infrastructure for schools, districts, and regions
- **Core Capabilities:**
  - MTSS Tiered Intervention Engine
  - Thrive Score Algorithm with early warning flags
  - Multi-stakeholder coordination (teachers, counselors, parents, community partners)
  - District-level analytics dashboard with real-time intervention effectiveness
  - Parent Engagement Portal
  - IEP/504 Integration
  - Trauma-Informed Practices
  - School Climate Assessment
  - Implementation Fidelity Tracking (CFIR-based)
  - Grant Outcome Reporting
- **Live Data Outputs (built into the platform):**
  - Fidelity scores
  - Readiness assessments
  - Proctor's 8 implementation outcomes
  - Practice-policy reports
  - Student thrive_scores
  - Early warning flags
  - District analytics
  - Intervention effectiveness metrics
  - Parent engagement metrics
- **Data Flows:**
  - SENDS: student_support_data, early_warning_flags, thrive_scores, district_analytics, intervention_effectiveness, school_climate_data, parent_engagement_metrics, implementation_fidelity_scores
  - RECEIVES: workforce_pathways, health_screenings, prevention_curriculum, family_referrals, academic_assessments, iep_data, incident_reports, research_findings
- **Measured Outcomes:**
  - Schools implementing MTSS with fidelity: 12 districts
  - Student Thrive Score improvement: 23% average increase over semester
  - Early warning flag-to-intervention rate: 78%
  - Parent engagement portal active users: 1,847
  - Implementation fidelity score (CFIR): 7.2/10 average
  - Intervention effectiveness rate: 64% of flagged students improved
  - IEP/504 accommodation compliance rate: 91%
- **Frameworks:** MTSS, CFIR, RE-AIM, PBIS
- **School Site:** PfISD, 5 high schools, 120 students Year 1
- **Integrations:** WholeMind Learning (academic data), Perfectly Different (neurodiversity/IEP/504), SafeReport (incident management), RPLICE (research/implementation science), Whole-Person Health (crisis routing)
- **Role in This Grant:** The adaptive implementation infrastructure being studied -- the intervention whose effect on fidelity is the research question

### SALP Science (salp-science--mrterryflood.replit.app)
- **What It Is:** Purpose-built research analysis platform -- the API backend that powers RPLICE
- **Replit Project:** Research-Science-Collaborator (replit.com/@mrterryflood/Research-Science-Collaborator)
- **API Capabilities:** Research library search, framework definitions, ecosystem status, evidence matching
- **How ThriveUp Academy Connects:** This codebase calls SALP Science at line 507 of rplice-tools.ts via `fetchRplice()` -- live API integration pulling research data, framework definitions, and ecosystem status in real-time
- **Role in This Grant:** Research data collection and analysis capability -- demonstrates to Spencer that TCAF has purpose-built tools to conduct rigorous research. Not theoretical -- live, working, API-connected

---

## How the Three Platforms Work Together (The Research Story)

1. **RPLICE** provides the implementation science frameworks (CFIR 2.0, RE-AIM, EPIS) and the evidence base (500+ validated interventions, peer-reviewed research library)
2. **ISSS** embeds those frameworks into a working school platform -- MTSS engine, Thrive Scores, early warning flags, fidelity tracking -- producing real-time quantitative data across 12 districts
3. **SALP Science** provides the research analysis backend -- curated research library, framework matching, multi-AI consensus analysis -- connecting the evidence base to the implementation data
4. **The research question** asks whether this integrated architecture (not just an app, but a research-to-practice lifecycle system) actually improves fidelity compared to traditional implementation approaches

This is NOT a program evaluation. This is foundational research into whether digitally-embedded implementation science infrastructure changes how schools adopt and maintain evidence-based practices.

---

## Proposed Research

### Research Question
"How does adaptive implementation infrastructure affect fidelity of evidence-based student support practices across diverse school contexts?"

### Method
Mixed-methods study using:
- **Quantitative:** ISSS built-in data (fidelity scores, readiness assessments, Proctor's 8 implementation outcomes, practice-policy reports, thrive_scores, early_warning_flags, intervention_effectiveness, parent_engagement_metrics)
- **Qualitative:** Interviews with school staff, families, and practitioners
- **Analysis:** SALP Science platform supporting research analysis with multi-AI consensus methodology

### Sites
3-5 schools using ISSS (PfISD as anchor site, 5 high schools, 120 students Year 1)

### Budget Categories
- Personnel time for PI (Terry Flood, DHA)
- Participant compensation
- Travel for site visits
- Dissemination

---

## Key Compliance Notes

### AI Transparency
Spencer has a generative AI policy. ISSS uses GPT-4o and Claude as practitioner support tools. RPLICE uses multi-AI consensus (Gemini, Claude, OpenAI) for research synthesis. Proposal MUST be transparent about how AI supports practitioners vs. conducts the research itself. AI is infrastructure for practitioners and analysis -- the PI conducts the research.

### PI Restrictions
PI can only hold one active Spencer grant at a time.

### Organizational Eligibility
TCAF is a 501(c)(3) nonprofit -- fully eligible. VOSB status is not a barrier as long as administering org is nonprofit or public entity.

---

## Submission Requirements
- **Narrative:** 1,800 words max, double-spaced, 12pt, APA format
- **Abstract:** 200 words
- **No indirect costs**
- **Must NOT be program evaluation framing -- must be foundational research**
- **Applications open twice per year -- check deadlines page**

---

## Document Checklist
- [ ] 1,800-word narrative (APA, double-spaced, 12pt)
- [ ] 200-word abstract
- [ ] Budget (up to $50K, no indirects)
- [ ] Budget justification
- [ ] PI CV (Terry Flood)
- [ ] PfISD support letter (Traci Hendrix -- supervisor reviewing, answer expected by end of day April 13)
- [ ] AI use disclosure per Spencer generative AI policy

---

## Key Contacts
- **PfISD:** Traci Hendrix (support letter pending)
- **PI:** Terry Flood, DHA

---

*The Collaborative Advocate Foundation (TCAF) -- EIN: 41-3618003 -- 17912 Stefano Drive, Pflugerville, TX 78660*
