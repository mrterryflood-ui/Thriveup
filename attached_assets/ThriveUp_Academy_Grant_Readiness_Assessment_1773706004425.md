# ThriveUp Academy — Grant Readiness & Strategic Integration Assessment

**Prepared for:** Dr. Terry Flood, DHA & Meredith Sisnett
**Date:** March 16, 2026
**Purpose:** Workforce Development & Community Enhancement Grant Alignment
**Classification:** CONFIDENTIAL — Strategic Planning

---

## 1. HONEST ASSESSMENT: WHERE YOU ACTUALLY STAND

ThriveUp Academy is, on paper, one of the most comprehensive community support platforms I've ever seen inventoried. 150+ features across 14 modules, serving 6 populations, touching every major federal funding stream. That's the good news.

Here's what matters for grants:

### What Grant Reviewers Actually Score On

| Scoring Dimension | Your Strength | Your Gap | Priority |
|---|---|---|---|
| **Organizational Capacity** | Extensive platform, VOSB status | No pilot data, no outcomes yet | CRITICAL |
| **Evidence Base** | NIRN/SISEP, MAP-GAP methodology | No program-specific evidence of impact | HIGH |
| **Community Need Documentation** | GIS intelligence with 8 federal APIs — outstanding | Need local community letters of support, MOUs | HIGH |
| **Logic Model / Theory of Change** | Three-pillar model (Relief > Stabilize > Contribute) is excellent | Not formalized into a grant-ready logic model diagram | MEDIUM |
| **Sustainability Plan** | Platform exists, scalable | No revenue beyond grants = red flag for reviewers | MEDIUM |
| **Partnerships** | Partner directory, MOU lifecycle management built | Need actual signed MOUs from real partners | CRITICAL |
| **Data & Evaluation Plan** | Outcome dashboard, recidivism tracking, retention metrics | Empty dashboards — zero participant data | CRITICAL |
| **Cultural Competence** | Bilingual, age-adaptive AI, SDOH mapping | Need community advisory board evidence | MEDIUM |
| **Staffing Plan** | Platform can support staff workflows | No named team or organizational chart | HIGH |

### The Bottom Line

**You have the technology. You don't yet have the story.** Grant reviewers don't fund platforms — they fund programs that use platforms. Your application needs to describe a specific program serving a specific community with specific partners producing specific outcomes, supported by this technology. The platform is the infrastructure, not the proposal.

---

## 2. WHAT TO DO BEFORE YOU SUBMIT A SINGLE GRANT

These aren't nice-to-haves. Without these, competitive federal grants will score you out.

### Action 1: Run a Pilot — Even a Tiny One

**Why:** Every strong grant application has a "Preliminary Results" section. Reviewers want to see that your approach has been tested, even at small scale.

**What to do:**
- Recruit 10-20 participants from your target population (returning citizens or youth are the strongest starting cohorts)
- Run them through the platform for 90 days
- Document everything: intake completion rate, service connection time, AI engagement, workforce assessment completion, any employment outcomes
- This gives you real numbers for G17 (Pilot Data Framework) — and it's the single most impactful thing you can do

**Timeline:** Start immediately. 90-day pilot means data in hand by June 2026.

### Action 2: Secure 3-5 Signed Partnership MOUs

**Why:** WIOA, OJJDP, DOJ, HHS — every major funder requires documented community partnerships. Your MOU lifecycle management system is built and ready, but reviewers need to see actual signed agreements.

**Target partners:**
- One workforce development board (for WIOA alignment)
- One community corrections / reentry organization (for OJJDP/DOJ)
- One K-12 school district or community college (for education pipeline)
- One healthcare / behavioral health provider (for SAMHSA alignment)
- One housing authority or shelter (for HUD alignment)

### Action 3: Build a Formal Logic Model

**Why:** Nearly every federal grant requires one. Your Three-Pillar framework (Relief > Stabilize > Contribute) is the skeleton, but it needs to be formalized.

**Structure it as:**

```
INPUTS          ACTIVITIES              OUTPUTS                 SHORT-TERM OUTCOMES        LONG-TERM OUTCOMES
                                                                (6 months)                 (12-24 months)
Staff,          Guided onboarding,      # participants served,  Housing stability > 80%,   Recidivism < 15%,
Platform,       Workforce assessment,   # referrals made,       Employment placement > 65%, 365-day job retention > 60%,
Partners,       Skills training,        # trainings completed,  Credential attainment > 40% Family reunification rate,
Funding         Case management,        # service hours logged, Wellbeing improvement > 10  Alumni mentor conversion > 15%
                Family strengthening,   # partner referrals     points on Thrive score
                AI-assisted navigation
```

### Action 4: Establish a Community Advisory Board

**Why:** Grants like OJJDP Second Chance and SAMHSA explicitly score for "community voice" and "lived experience" representation. Your Critical Perspectives Module from the platform is the right framework, but you need actual people.

**Composition:** 2-3 people with lived experience (formerly incarcerated, in recovery, etc.), 1 community organization leader, 1 faith-based leader, 1 local government representative.

---

## 3. API INTEGRATION STRATEGY — WHAT TO CONNECT AND WHY

You asked whether to merge other products via API. The answer is yes, selectively, with clear strategic purpose for each connection.

### CONNECT: Sankofa Health Network APIs

| Sankofa Product | Integration Point in ThriveUp | Grant Value |
|---|---|---|
| **mentalwellnesssupport.net** | Behavioral health self-assessment tools, coping strategies library, crisis resource connections | SAMHSA grants require behavioral health services. Instead of building from scratch (G8), connect to content you already own. |
| **HerHealth** | Women's health resources, maternal health support, reproductive health navigation | HHS/ACF TANF grants for single mothers. Women-specific health content strengthens family stability narrative. |
| **HealthyBlackMen** | Men's health screening prompts, health navigation for Black male participants | DOJ/OJJDP grants — returning citizen population is disproportionately Black males. Health-aware reentry is a differentiator. |
| **BirthRight** | Pregnancy/postpartum support for participants who are pregnant or new parents | HHS family strengthening, home visiting programs (MIECHV). |
| **MCE (Multi-Cultural Exchange)** | Cultural competency resources, multilingual health content | Strengthens cultural responsiveness scoring on every federal grant. |

**How to connect:** Don't rebuild content. Create an API gateway that serves Sankofa health content within ThriveUp's interface. Users see it as one platform. Grant reviewers see a comprehensive health-integrated support system.

**Implementation approach:** A lightweight content federation layer — ThriveUp calls Sankofa APIs for health assessments, wellness content, and resource recommendations. Data stays in each system; the user experience is seamless.

### CONNECT: RPLICE Implementation Science Engine

| RPLICE Component | Integration Point in ThriveUp | Grant Value |
|---|---|---|
| **MAP-GAP Engine** | Continuous improvement cycles for program fidelity | Every federal grant now requires a "continuous quality improvement" plan. MAP-GAP is that plan. |
| **SALP (System Adaptive Learning Process)** | System health monitoring for the ThriveUp program itself | Demonstrates organizational learning capacity — a sustainability indicator. |
| **Validation & Fidelity Hub** | Intervention fidelity tracking for evidence-based programs | OJJDP and SAMHSA require evidence-based practice fidelity monitoring. |
| **Framework Library** | CFIR, RE-AIM implementation frameworks | Positions your program as implementation science-informed — a significant competitive advantage. |

**How to connect:** ThriveUp's MAP-GAP Navigator (Layer 4) already exists. Connect it to RPLICE's more mature engine so that program staff can run improvement cycles on ThriveUp program delivery. This isn't about the technology — it's about demonstrating that your program has a built-in mechanism for self-correction.

**Grant impact:** This is your biggest differentiator. No other community support platform has implementation science infrastructure built in. When a reviewer reads your CQI plan and sees MAP-GAP with actual cycle data, you move to the top of the stack.

### CONNECT SELECTIVELY: SHIELD/ATLAS

| SHIELD Component | Integration Point | Grant Value |
|---|---|---|
| **Risk assessment frameworks** | Community safety analysis, threat awareness for partner organizations | DOJ Byrne JAG grants, community safety initiatives |
| **Data analytics architecture** | Enhanced outcome analytics, predictive modeling | Strengthens data-driven decision-making narrative |

**Caution:** Don't over-connect SHIELD/ATLAS. Its military/defense orientation could confuse the narrative. Cherry-pick the risk analysis and data architecture capabilities only.

### DO NOT CONNECT: Incubator Ecosystem

The federal business intelligence platform serves a completely different audience and mission. Connecting it would dilute the ThriveUp narrative without adding grant value. Keep it separate.

### DO NOT CONNECT: ISSS (K-12 Platform)

Even though ISSS and ThriveUp both serve youth, they serve fundamentally different systems (school districts vs. community organizations). Connecting them would create scope confusion. However — if you pursue DOE Title IV grants, you could mention ISSS as a "sister platform" that demonstrates your team's capacity to build education technology.

---

## 4. PRIORITY GRANT TARGETS — WHERE TO APPLY FIRST

Based on your current readiness and what the platform already does well:

### Tier 1: Apply Within 90 Days (High Fit, Platform Ready)

| Grant | Agency | Typical Award | Why You're Ready |
|---|---|---|---|
| **WIOA Title I Youth Formula** | DOL/ETA via local WDB | $200K-$1M/year | Career pathways, training directory, employer network, financial literacy, retention tracking — you have 90% of required components built |
| **Second Chance Act (Community)** | OJJDP/DOJ | $500K-$1M over 3 years | Phase-based reentry case management, court-ready reporting, recidivism tracking, justice partner API — this is your strongest fit |
| **SAMHSA Community Mental Health** | HHS/SAMHSA | $500K-$2M over 5 years | Thrive wellbeing system, SAMHSA data integration, crisis protocols, GIS mapping with SVI data — strong with Sankofa API connection |

### Tier 2: Apply Within 6 Months (Need Pilot Data First)

| Grant | Agency | Typical Award | What You Need |
|---|---|---|---|
| **Byrne JAG (Community)** | DOJ/BJA | $250K-$750K | Need local crime data tied to your GIS, and at least one law enforcement partner MOU |
| **HHS/ACF TANF Innovation** | HHS | $500K-$2M | Need pilot data on family outcomes, and parenting curriculum (G4) |
| **21st Century Community Learning Centers** | DOE | $500K-$1.5M | Need school district partnership and after-school programming evidence |

### Tier 3: Apply Within 12 Months (Need More Infrastructure)

| Grant | Agency | Typical Award | What You Need |
|---|---|---|---|
| **AmeriCorps State and National** | CNCS | $300K-$1M | Need alumni pipeline (G11) and defined service positions |
| **HUD Continuum of Care** | HUD | Variable | Need housing-specific outcome data and CoC membership |
| **Promise Neighborhoods** | DOE | $6M-$30M over 5 years | High-value but requires extensive community pipeline data, school partnerships, and cradle-to-career evidence |

---

## 5. THE INTEGRATION ARCHITECTURE — HOW IT ALL CONNECTS

Here's how the connected ecosystem should look for grant purposes:

```
                    THRIVEUP ACADEMY (Primary Platform)
                    Participant-facing, community-serving
                              |
        +---------+-----------+-----------+---------+
        |         |           |           |         |
   SANKOFA    RPLICE     Community    Workforce    Justice
   Health     Engine     Partners     Partners     Partners
   APIs       (CQI)     (MOUs)       (Employers)  (Courts)
        |         |           |           |         |
   Health     MAP-GAP    Referrals    Placement    Compliance
   Content    Cycles     & Handoffs   & Retention  Reporting
   Wellness   Fidelity   Service      Training     Supervision
   Resources  Monitoring Coordination Programs     Data
```

**For grant applications, describe it as:** "ThriveUp Academy is a comprehensive community support platform that integrates behavioral health resources (via our Sankofa Health Network), implementation science-based quality improvement (via our MAP-GAP methodology), and multi-agency coordination to deliver whole-person support from crisis through stability to community contribution."

---

## 6. WHAT TO BUILD NEXT — REORDERED FOR GRANT READINESS

Your MAP-GAP report has a good priority sequence, but I'd reorder it slightly based on what grants actually need first:

### Immediate (Before First Grant Submission)

| Priority | Gap | Why First |
|---|---|---|
| 1 | **G17: Pilot Data Framework** | Without data, everything else is theoretical. Even 10 participants' data makes every application 10x stronger. Move this from Sprint 5 to Sprint 0. |
| 2 | **G13: Cross-Tool Dosage Tracking** | WIOA and OJJDP both require total service hours. If your AI tools, curriculum, and self-guided modules don't log engagement time, you can't report accurately. |
| 3 | **G5: First 30 Days Onboarding** | This IS your program model. It's the thing you describe in the narrative. It needs to exist. |

### Before Second Round of Grants

| Priority | Gap | Why |
|---|---|---|
| 4 | **G1: Interview Prep / Mock Coach** | WIOA scores heavily on workforce outcomes. This closes the resume-to-job gap. |
| 5 | **G2: Workplace Soft Skills** | Same — 90-day retention is the metric, and soft skills prevent early job loss. |
| 6 | **G3: Budget Builder** | TANF and HHS family stability grants require financial capability services. |

### For OJJDP / DOJ Applications

| Priority | Gap | Why |
|---|---|---|
| 7 | **G4: Parenting/Family Strengthening** | OJJDP Second Chance Act explicitly funds this. |
| 8 | **G6: Peer Support Network** | Evidence-based practice for reentry. Reviewers look for this. |
| 9 | **G7: Legal Rights / Expungement** | Directly supports the reentry population. |

### For Sustainability Narrative

| Priority | Gap | Why |
|---|---|---|
| 10 | **G11: Alumni-to-Mentor Pipeline** | Every sustainability plan needs this. It shows the program creates self-sustaining cycles. |
| 11 | **G14: Warm Handoff Referrals** | Moves you from "here's a phone number" to "we connected you" — that's the difference between a good program and a great one. |

---

## 7. POSITIONING LANGUAGE — HOW TO DESCRIBE THIS

### For WIOA / Workforce Grants:
> "ThriveUp Academy is an AI-powered workforce development and community support infrastructure that provides end-to-end career pathway services — from initial skills assessment through employer-matched placement to 365-day retention monitoring — integrated with wraparound supports including housing navigation, behavioral health, financial capability, and family strengthening. The platform operationalizes implementation science principles through the MAP-GAP continuous improvement methodology, ensuring program fidelity and data-driven adaptation."

### For OJJDP / Reentry Grants:
> "ThriveUp Academy delivers a phase-based reentry support system (Pre-Release > Stabilization > Growth > Independence) with court-ready reporting, justice partner API integration, community-based supervision compliance tracking, and holistic support coordination across 11 service domains. The platform integrates community intelligence through real-time GIS mapping of social determinants of health, enabling targeted resource deployment based on participant geography and need."

### For SAMHSA / Behavioral Health Grants:
> "ThriveUp Academy combines behavioral health screening, Six-Domain Thrive wellbeing monitoring, and crisis intervention protocols with an integrated health resource network. The platform's Early Warning System detects declining wellbeing indicators and triggers automated support connections. Through API integration with the Sankofa Health Network, participants access culturally responsive behavioral health content, coping strategies, and warm referrals to community-based treatment providers."

---

## 8. CRITICAL STRATEGIC ADVICE

### 1. You're Not Selling Software — You're Proposing a Program
The platform is the HOW, not the WHAT. Grant reviewers fund programs that serve people. Lead every application with the population, the need, and the outcomes. The technology is the "innovative approach" section, not the executive summary.

### 2. Pick One Community First
Don't try to serve all 6 populations everywhere. Pick one city or county, one primary population (returning citizens is your strongest), and build deep. "We serve 50 returning citizens in [City], Texas with documented outcomes" beats "we can serve everyone everywhere" every time.

### 3. Your Sankofa Connection is a Superpower — Use It
No other workforce development platform has an integrated health network. When you connect Sankofa APIs, you can truthfully say your platform addresses social determinants of health as part of workforce development. That's what reviewers at SAMHSA, HHS, and even DOL want to see.

### 4. MAP-GAP is Your Secret Weapon for Competitive Scoring
Federal grants increasingly require "continuous quality improvement" plans. Most applicants write vague paragraphs about "ongoing evaluation." You have a named, structured methodology with a built-in technology platform. Lead with it in every CQI section.

### 5. VOSB Status Opens Doors
Your Veteran-Owned Small Business certification gives you advantages in DOL and VA contracting, set-asides in some state-level procurements, and credibility in veteran-serving grant applications. Make sure it's on page 1 of every application.

### 6. Get a Fiscal Sponsor or 501(c)(3) Status
Most federal grants require the applicant to be a nonprofit or government entity. If ThriveUp Academy doesn't have 501(c)(3) status, you need either:
- A fiscal sponsor (a nonprofit that receives the funds on your behalf), or
- To establish a nonprofit entity for the grant-funded work
- This is a structural requirement, not optional

---

## 9. 90-DAY ACTION PLAN

| Week | Action | Outcome |
|---|---|---|
| 1-2 | Identify pilot community (city/county) and primary population | Geographic and population focus |
| 2-4 | Secure 3-5 partner MOUs (workforce board, corrections, health, school, housing) | Partnership documentation |
| 3-6 | Recruit 10-20 pilot participants, begin intake | Pilot cohort enrolled |
| 4-6 | Build G17 (pilot data framework) and G13 (dosage tracking) | Data collection active |
| 4-8 | Connect Sankofa Health Network APIs (behavioral health content) | Health-integrated platform |
| 6-8 | Connect RPLICE MAP-GAP engine for CQI | Implementation science infrastructure live |
| 6-8 | Build formal logic model and theory of change diagram | Grant-ready program documents |
| 8-10 | Establish Community Advisory Board (5-7 members) | Community voice documented |
| 8-10 | Build G5 (First 30 Days Onboarding Journey) | Core program experience complete |
| 10-12 | Compile pilot data, write first grant narrative (WIOA or Second Chance Act) | First application submitted |
| 12 | Review pilot outcomes, refine platform based on real usage | Evidence-informed iteration |

---

## 10. BOTTOM LINE

ThriveUp Academy has more built technology than most organizations that win $5M+ federal grants. That's real. But technology without evidence is a demo, not a program. Your immediate priorities are:

1. **Run a pilot** (10-20 people, 90 days, document everything)
2. **Sign partner MOUs** (3-5 real organizations)
3. **Connect Sankofa for health** and **RPLICE for implementation science**
4. **Build dosage tracking** (G13) and **pilot data framework** (G17)
5. **Pick one community, one population, one grant** — and go deep

You don't need more features. You need proof that the features you have change lives. Get 10 people through the system, document the journey, and you'll have a grant application that reviewers can't ignore.

**The platform is the most powerful tool in this equation. Now it needs a story to tell.**

---

*This assessment is based on the ThriveUp Academy MAP-GAP Strategic Report, the Flood portfolio context, and federal grant scoring criteria across WIOA, OJJDP, SAMHSA, HHS, DOE, HUD, and DOJ funding streams.*
