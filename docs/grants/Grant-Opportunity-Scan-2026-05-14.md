# Grant Opportunity Scan — May 14, 2026 (Expanded)

**Scope:** 20 NEW opportunities (federal already covered in pipeline) — 5 each across Local (Greater Austin) · State (Texas) · Public Foundations · Private Foundations. Each entry includes: **score justification · how to raise the score · what's involved · collaborators needed (mapped to our ecosystem) · source + URL.**

**Applicant entity:** The Collaborative Advocate Foundation Inc. (DBA TCAF) · EIN 41-3618003 · 501(c)(3) determined eff. 01/14/2026 · UEI **KDDVD1FGLW35** · CAGE **209N1** · SAM.gov **ACTIVE** (renewal 2027-05-06).

---

## How the fit score works (so the numbers below are auditable)

The score comes from `computeFitScore()` in `server/grant-routes.ts:176`. It's a deterministic keyword-and-breadth model, not magic:

1. **Breadth tier (base 35–95).** Match the grant text against TCAF's **16 documented capability areas**. The more distinct areas you hit, the higher the base:
   - 1 area → 35 (+ up to 15 for keyword depth)
   - 2 areas → 55 (+ up to 15)
   - 3 areas → 70 (+ up to 10)
   - 4 areas → 78 (+ up to 10)
   - 5+ areas → 85 (+ up to 10)
2. **Tier-1 ecosystem-signature bonus (up to +35).** A separate list of high-value phrases — "reentry," "AI for good," "responsible AI," "faith-based," "community health worker," "implementation science," "two-generation," "WIOA," "fiscal sponsorship," "501(c)(3)," "trauma-informed," "social determinants" — each add a fixed bonus, capped at +35 total.
3. **Final = min(100, base + Tier-1 bonus).**

**Therefore, two ways to raise a score:** (a) document an additional capability area on the platform so it lights up the breadth tier, or (b) add Tier-1 signature phrases to platform descriptions / proposal narratives so they get picked up at scan time. Neither is fake — both require the capability to actually exist; the algorithm just rewards being plain about it.

**Iron-rule reminders (applies to every line below):**
- 🚨 **Meredith Sisnett never on City of Austin grants** (L1, L2, L5). Dr. Flood-only contact (`terryflood@thrivingcommunitiesforall.com`).
- 🚨 **St. David's = "actively evaluating," never "awarded"** (L4).
- 🚨 **Tabbara prior-award checklist mandatory** before LOI: SAM.gov, USASpending.gov, sbir.gov, funder 990 via Candid free tier.
- 🚨 **President**, not CEO. **"National platform, Texas-piloted,"** never "Texas-only."

**Ecosystem shorthand used in the Collaborators column:**
- **ThriveUp Academy** (workforce / AI literacy / FAFSA / apprenticeship)
- **Whole-Person Health (WPH)** — mentalwellnesssupport.net (behavioral-health safety floor)
- **Talk Your Talk (TYT)** — talkyourtalk.net (89 spoken + 18 sign + 6 learning surfaces; crisis routes INTO WPH)
- **Sankofa Network** + **Black Maternal Health Hub** + **Black Men's Health Hub** + **HerHealth Network** (health-equity stack)
- **SafeCogniCare** (cognitive/TBI/dementia/ADHD)
- **Perfectly Different** (neurodiversity / IEP / 504)
- **LifeBridge** — lifetransitionsaid.org (virtual 211 / SDOH navigation)
- **Mission Transition (M2C)** — vetmissiontransition.com
- **Minority Center of Excellence (MCE)** — minoritycenterofexcellence.com
- **ISSS / SafeReport** (child welfare / mandated reporting)
- **RPLICE** (implementation-science evaluation — CFIR/RE-AIM)
- **Civic Signal** (community signal/data)
- **Vann Collaboration Hub** — Sistahs Can We Talk Inc. + Iasis Christian Center (Wichita KS) + Vanntastic Solutions LLC

---

## 1. LOCAL — Greater Austin (5)

### L1 · City of Austin EDD — AEI / Small Business Grants
- **Funder / range:** City of Austin Economic Development Department · $25K–$250K
- **Found via:** `city_austin` source · **URL:** https://www.austintexas.gov/department/economic-development
- **Score: 91/100.** Breadth = 4 areas matched (Workforce Development · Veteran Transition Services · Minority Business & Economic Development · Fiscal Sponsorship & Nonprofit Capacity) → base 78–88. Tier-1 hits: "501(c)(3)," "minority business."
- **What's involved:** Technical assistance for BIPOC entrepreneurs, MWBE certification, veteran-owned small-business pipelines, economic-injury recovery cohorts. Recurring competitive rounds; check the City bid portal for active solicitations. Eligibility: Austin-area 501(c)(3)s, MWBE/veteran-owned firms.
- **Collaborators (already in ecosystem):** **MCE** (Lead — minority business is its native domain) · **ThriveUp Academy** (Support — financial literacy + workforce pathways) · **M2C** (Support — veteran entrepreneur pipeline) · **RPLICE** (Validate). External: **Greater Austin Black Chamber, Hispanic Chamber, Texas SBDC at UT-Arlington VBOC** — relationship-build still pending (see SBA section of active-commitments.md).
- **How to raise the score:** Add an explicit "Apprenticeship & Career Pathway" capability description to ThriveUp Academy (Tier-1 "registered apprenticeship" = +10). Document MCE's SBA 8(a) / HUBZone navigation explicitly. Both would push score to ~95.

### L2 · Austin Public Health — CSBG & Wellness
- **Funder / range:** Austin Public Health (City of Austin) · $50K–$500K
- **Found via:** `city_austin` source · **URL:** https://www.austintexas.gov/department/health
- **Score: 89/100.** Breadth = 4 areas (Behavioral Health · Health Equity · Community Resources & Social Services · Fiscal Sponsorship). Tier-1: "behavioral health," "501(c)(3)."
- **What's involved:** Behavioral health, harm reduction, maternal/child health, food security, immunization access, HIV services, CSBG poverty alleviation. Recurring competitive solicitations on AustinTexas.gov bid portal. Eligibility: Austin/Travis County 501(c)(3)s with service history.
- **Collaborators (already in ecosystem):** **Whole-Person Health** (Lead — behavioral-health safety floor) · **Sankofa Maternal Health** (Support) · **HerHealth Network** (Support) · **LifeBridge** (Support — SDOH/211 navigation) · **RPLICE** (Validate). External: **Central Health, Integral Care, People's Community Clinic**.
- **How to raise the score:** Add "Community Health Worker / promotora" framing explicitly to WPH and Sankofa descriptions (Tier-1 CHW = +12). Add "trauma-informed" to ISSS (+10). Push toward 95+.

### L3 · RGK Foundation — TX Education, Community & Health
- **Funder / range:** RGK Foundation (Austin, statewide reach) · $25K–$250K
- **Found via:** `tx_statewide` source · **URL:** https://www.rgkfoundation.org/grants/
- **Score: 80/100.** Breadth = 3 areas (Education & Youth Development · Research/Data & Outcomes · Fiscal Sponsorship). Tier-1: "501(c)(3)."
- **What's involved:** Statewide Texas education, community service, health initiatives — disadvantaged youth, formal/informal education, leadership development, innovation in community health. Annual cycle; strong evaluation plan required.
- **Collaborators (already in ecosystem):** **ThriveUp Academy** (Lead — education core) · **RPLICE** (Lead — evaluation engine; CFIR/RE-AIM) · **Civic Signal** (Support — community-level outcomes). External: **UT Austin Steve Hicks School of Social Work, Austin Independent School District**.
- **How to raise the score:** Make "implementation science" and "evidence-based practice" prominent in the RPLICE description (Tier-1 = +12 + 8 = +20). Add a 4th area match by documenting youth-mentoring concretely under ThriveUp Academy → jumps from 3-area (70 base) to 4-area (78 base) ≈ 90+ total.

### L4 · St. David's Foundation — Community Health Grants
- **Funder / range:** St. David's Foundation · up to $1M
- **Found via:** `foundation` source · **URL:** https://stdavidsfoundation.org/grants/
- **Score: 80/100.** Breadth = 3 areas (Behavioral Health · Health Equity · Fiscal Sponsorship). Tier-1: "behavioral health," "501(c)(3)."
- **🚨 Status framing:** TCAF is **"actively evaluating St. David's Foundation as a funder."** Never "awarded." Separate line from WAB2 (loi_complete) and CLC (loi_drafted) already in pipeline.
- **What's involved:** Community health, behavioral health, maternal health, and health-equity initiatives in Austin/Travis County. Historically funds up to $1M for comprehensive programs.
- **Collaborators (already in ecosystem):** **WPH** (Lead) · **Sankofa Maternal Health** (Support) · **HerHealth Network** (Support) · **Black Men's Health Hub** (Support) · **RPLICE** (Validate). External: **Central Health, Dell Medical School**.
- **How to raise the score:** Add a 4th area — Community Resources & Social Services — by tying LifeBridge into the narrative. Add "trauma-informed" + "social determinants" (both Tier-1) to WPH descriptions → score climbs from 80 → ~92.

### L5 · AHFC — Community Development Programs
- **Funder / range:** Austin Housing Finance Corp / COA Housing · $100K–$5M
- **Found via:** `city_austin` source · **URL:** https://www.austintexas.gov/department/housing
- **Score: 59/100.** Breadth = 2 areas only (Child & Family Safety · Community Resources & Social Services). Few Tier-1 hits.
- **What's involved:** Affordable housing development, supportive housing, homelessness prevention, tenant stabilization, CHDO operating support, RHDA + OHDA NOFA cycles. Eligibility leans toward certified CHDOs and affordable-housing developers — **TCAF is best positioned as a supportive-services subaward partner, not a primary CHDO**.
- **Collaborators (already in ecosystem):** **LifeBridge** (Lead — homelessness prevention + 211) · **WPH** (Support — supportive-services side). External (essential): **Foundation Communities, Caritas of Austin, Family Eldercare, ECHO** — TCAF should be the supportive-services arm under one of these CHDOs. Not yet in our partner-org table; **action: identify and outreach.**
- **How to raise the score:** Explicitly document supportive-housing and tenant-stabilization services on LifeBridge. Add Tier-1 hits "social determinants," "wraparound," "benefits enrollment" (+10 each). Would push to ~80, but only worth doing if a CHDO partnership is real.

---

## 2. STATE — Texas (5)

### S1 · TWC WIOA Grants
- **Funder / range:** Texas Workforce Commission · $200K–$500K per RFA
- **Found via:** `state_texas` source · **URL:** https://www.twc.texas.gov/programs/workforce-innovation-opportunity-act
- **Score: 100/100.** Breadth = 3 areas (Workforce · Education & Youth · Criminal Justice & Reentry). Tier-1 maxed: "wioa" (+12), "workforce innovation" (+12), "reentry" (+12) → +35 cap.
- **Distinct from** TWC RFA 32026 (already submitted, narrative_drafted) — WIOA is the broader statutory stream with multiple sub-RFAs per cycle administered through local workforce boards.
- **What's involved:** WIOA Title I Adult, Dislocated Worker, Youth formula grants — workforce training, career services, youth development, reentry support. Multiple sub-RFAs per cycle.
- **Collaborators (already in ecosystem):** **ThriveUp Academy** (Lead) · **MCE** (Support — minority business owners as employers) · **Sankofa** (Support — reentry health-equity angle) · **RPLICE** (Validate). External: **Workforce Solutions Capital Area** (the local workforce board administering the RFAs), **Austin Community College, Goodwill Central Texas, Skillpoint Alliance**.
- **How to raise the score:** Already at 100 — focus instead on win-rate signals (named local-board partnership, named employer commitments).

### S2 · Texas Veterans Commission — VMH / Fund for Veterans Assistance
- **Funder / range:** TVC · $50K–$250K
- **Found via:** `tx_statewide` source · **URL:** https://www.tvc.texas.gov/grants/
- **Score: 98/100.** Breadth = 6 areas (Workforce · Veteran Transition · Behavioral Health · Child & Family · Community Resources · Fiscal Sponsorship). Tier-1: "501(c)(3)" + community-based framing.
- **What's involved:** Fund for Veterans Assistance (FVA) — community-based veteran services: MH, transportation, housing, employment, family services, crisis intervention. Two tracks: general statewide + county-targeted. Annual NOFA.
- **Collaborators (already in ecosystem):** **M2C Transition** (Lead) · **WPH** (Support — veteran crisis/PTSD) · **LifeBridge** (Support — veteran housing/SDOH). **Dr. Flood is US Army Retiree → first-person credibility.** External: **Texas Veterans Network, VFW Austin, VA Central Texas Health Care**.
- **How to raise the score:** Already at 98. Lock down the M2C operational metrics (veterans served, MH referrals routed) for the application appendix.

### S3 · TDHCA — Community Affairs / CSBG / Homelessness
- **Funder / range:** TDHCA · $50K–$2M
- **Found via:** `tx_statewide` source · **URL:** https://www.tdhca.texas.gov/community-affairs
- **Score: 88/100.** Breadth = 4 areas (Child & Family Safety · Emergency Management · Community Resources · Fiscal Sponsorship). Tier-1: "501(c)(3)."
- **What's involved:** CSBG, LIHEAP, weatherization, ESG (Emergency Solutions Grant), homelessness prevention. Statewide across all 254 counties. CAA-eligible or ESG-eligible providers.
- **Collaborators (already in ecosystem):** **LifeBridge** (Lead — 211/wraparound) · **WPH** (Support — homelessness + behavioral health overlay) · **ISSS** (Support — child & family safety). External: **Texas Homeless Network, Combined Community Action (Travis County CAA)** — TCAF likely files as subaward to an established CAA rather than competing directly.
- **How to raise the score:** Add Tier-1 "benefits enrollment" + "social safety net" to LifeBridge (+10 each, capped). Add a 5th area (Health Equity) by documenting LifeBridge → WPH health-screening referrals → ~95+.

### S4 · Texas HHSC — Community Grants
- **Funder / range:** Texas HHSC · $50K–$500K
- **Found via:** `state_texas` source · **URL:** https://www.hhs.texas.gov/about/funding-grant-opportunities
- **Score: 84/100.** Breadth = 4 areas (Behavioral Health · Health Equity · Education & Youth · Community Resources). Tier-1 modest.
- **What's involved:** State funds for community health, MH, disability services, social services, behavioral health, substance abuse, maternal health.
- **Collaborators (already in ecosystem):** **WPH** (Lead) · **Sankofa Maternal Health** (Support) · **Perfectly Different** (Support — disability services) · **HerHealth Network** (Support) · **RPLICE** (Validate). External: **Texas Council for Developmental Disabilities, Hogg Foundation network**.
- **How to raise the score:** Document Perfectly Different's IEP/504 navigation explicitly + add "trauma-informed" to WPH descriptions → Tier-1 stacks to ~+20 → 95+.

### S5 · Texas Bar Foundation — Justice, Reentry & Civil Legal Aid
- **Funder / range:** Texas Bar Foundation · $5K–$100K
- **Found via:** `tx_statewide` source · **URL:** https://www.txbf.org/grants/
- **Score: 77/100.** Breadth = 2 areas (Criminal Justice & Reentry · Fiscal Sponsorship). Tier-1: "reentry" (+12), "501(c)(3)."
- **What's involved:** Legal aid, civil rights, criminal-justice reform, reentry support, court-related programs, pro-bono. Annual competitive cycles + separate Lloyd Lochridge Fellowship. All 254 TX counties.
- **Collaborators (already in ecosystem):** **Sankofa Network** (Support — health equity in reentry) · **WPH** (Support — reentry MH) · **RPLICE** (Validate). **Reentry portfolio is real in TCAF** (Thrive Score / Justice Command Center referenced in `server/grant-routes.ts:103`), but the program-level deliverables are concentrated in Whole-Person Health and Sankofa — there isn't a dedicated "Reentry Platform" page yet. External (essential): **Texas Fair Defense Project, Texas Civil Rights Project, Travis County Re-entry Roundtable**.
- **How to raise the score:** Promote the Justice Command Center / Thrive Score from internal mention to a documented public capability area → adds a 3rd area (Education & Youth via youth-justice diversion). Add Tier-1 "second chance," "restorative justice," "returning citizen" each +12 — would push score to ~95.

---

## 3. PUBLIC FOUNDATIONS — Community / Statewide (5)

### P1 · Episcopal Health Foundation — TX Community Health & Health Equity
- **Funder / range:** EHF (statewide TX, Houston HQ; 57-county Episcopal Diocese footprint — Travis County eligible) · $50K–$750K
- **Found via:** `tx_statewide` source · **URL:** https://www.episcopalhealth.org/grants/
- **Score: 100/100.** Breadth = 4 areas (Health Equity · Ecosystem Coordination · Faith-Based & Community Partnerships · Fiscal Sponsorship). Tier-1 maxed: "faith-based" (+14), "community health worker" (+12), "social determinants" (+10), "501(c)(3)" → cap +35.
- **What's involved:** Community health, health equity, social determinants of health, church-community partnerships. Multi-year capacity, project, and CHW-focused grants.
- **Collaborators (already in ecosystem):** **Sankofa Maternal Health** (Lead) · **HerHealth Network** (Support) · **Black Maternal Health Hub** (Support) · **WPH** (Support) · **LifeBridge** (Support — SDOH). **Faith-based partner real and named: Iasis Christian Center** (Vann Collaboration Hub, Pentecostal/Apostolic 37+ yrs) → strong story even though Iasis is Wichita-based; pair with an Austin Episcopal-Diocese congregation for proximity. External (essential): **Episcopal Health Foundation Diocese partner congregation** (TBD); **Bread of Life Houston** (historical EHF grantee).
- **How to raise the score:** Already at 100 — work to lock the narrative.

### P2 · Hogg Foundation for Mental Health — Statewide TX MH
- **Funder / range:** Hogg Foundation (UT Austin / statewide) · $25K–$1.5M
- **Found via:** `tx_statewide` source · **URL:** https://hogg.utexas.edu/grants
- **Score: 80/100.** Breadth = 3 areas (Workforce · Behavioral Health · Fiscal Sponsorship). Tier-1: "mental health workforce," "501(c)(3)."
- **What's involved:** Policy advocacy, peer-led recovery, anti-stigma, MH workforce, culturally-responsive community programs. Project + multi-year capacity grants.
- **Collaborators (already in ecosystem):** **WPH** (Lead) · **SafeCogniCare** (Support — cognitive health overlay) · **Sankofa** (Support — culturally-responsive) · **RPLICE** (Validate). External (essential): **Mental Health America of Texas, NAMI Texas, Hogg's existing Peer Specialist Workforce grantees**.
- **How to raise the score:** Add a 4th area (Health Equity) by foregrounding Sankofa's culturally-responsive framing. Add Tier-1 "peer support" + "trauma-informed" + "implementation science" → 95+.

### P3 · Meadows Foundation — Statewide TX GO + Project
- **Funder / range:** Meadows · $25K–$500K
- **Found via:** `tx_statewide` source · **URL:** https://www.mfi.org/grants
- **Score: 80/100.** Breadth = 3 areas (Behavioral Health · Education & Youth · Fiscal Sponsorship). Tier-1: "mental health," "501(c)(3)."
- **What's involved:** Health, education, civic engagement, MH, arts & culture, community-led programs, criminal-justice reform. Annual rolling intake.
- **Collaborators (already in ecosystem):** **WPH** (Lead) · **ThriveUp Academy** (Support) · **Civic Signal** (Support — civic engagement). External: **Texas 2036, Center for Public Policy Priorities (Every Texan)**.
- **How to raise the score:** Add a 4th + 5th area by foregrounding Civic Signal (Ecosystem Coordination area) + reentry portfolio (Criminal Justice area) → 5 areas = 85 base → ~95.

### P4 · Communities Foundation of Texas (CFT)
- **Funder / range:** CFT · $10K–$500K
- **Found via:** `tx_statewide` source · **URL:** https://www.cftexas.org/grants
- **Score: 79/100.** Breadth = 3 areas (Workforce · Education & Youth · Fiscal Sponsorship). Tier-1: "workforce," "501(c)(3)."
- **What's involved:** Statewide cycles + North Texas Giving Day, scholarship funds, Working Families Success grants. Focus: education, workforce, health, basic needs, BIPOC-led nonprofits. Multi-year capacity grants available.
- **Collaborators (already in ecosystem):** **ThriveUp Academy** (Lead) · **MCE** (Support — BIPOC-led nonprofit angle) · **LifeBridge** (Support — basic needs). External: **North Texas Giving Day partner orgs, United Way of Metropolitan Dallas** (CFT priority geography is North Texas).
- **How to raise the score:** Add Health Equity area by documenting Sankofa explicitly + Tier-1 "two-generation" (+10) to Working Families Success framing → ~90.

### P5 · DreamBee Foundation — Child Abuse Prevention
- **Funder / range:** DreamBee Foundation · $25K–$100K
- **Found via:** `foundation` source · **URL:** https://dreambeefoundation.org/
- **Score: 63/100.** Breadth = 2 areas (Child & Family Safety · Research/Data & Outcomes). Tier-1: "evidence-based" (+8).
- **What's involved:** Child-abuse prevention, intervention, family strengthening, evidence-based prevention programs, community-level approaches.
- **Collaborators (already in ecosystem):** **ISSS** (Lead — child welfare / ACEs) · **SafeReport** (Support — mandated reporting) · **RPLICE** (Validate — evidence-based). External: **Center for Child Protection (Travis County), CASA of Travis County, Texas Department of Family & Protective Services partners**.
- **How to raise the score:** Add Tier-1 "two-generation" (+10), "trauma-informed" (+10), "kinship care" (+8) to ISSS — pushes to ~80. Add Behavioral Health area via WPH linkage → 3 areas → 70 base → 85+.

---

## 4. PRIVATE / CORPORATE FOUNDATIONS (5)

### F1 · Cigna Group Foundation — Improving Youth Mental Health 2026
- **Funder / range:** Cigna Group Foundation · **$150K (fixed)**
- **Found via:** `manual` source · **URL:** https://www.thecignagroup.com/our-impact/esg/healthy-society/community/foundation/improving-youth-mental-health
- **Score: 100/100.** Breadth = 4 areas (Behavioral Health · Child & Family Safety · Ecosystem Coordination · Fiscal Sponsorship). Tier-1 maxed: "trauma-informed" (+10), "behavioral health" (+8), "partnership," "501(c)(3)" → +35 cap.
- **What's involved:** Part of a $9M / 3-year commitment for youth ages 5–18. Priority on social-emotional learning (SEL), trauma-informed care, family-school partnerships. Priority states include **TX**. 2026 cycle closed March 12; **next cycle expected June 2026.** All requests must total exactly $150K. Eligibility: 501(c)(3)s serving youth 5–18 in priority states; evidence-informed programs required.
- **Collaborators (already in ecosystem):** **WPH** (Lead — youth MH) · **ISSS** (Support — family-school) · **Perfectly Different** (Support — IEP/504 youth) · **Vann Collaboration Hub** (Iasis Christian Center Wed youth program 12+ Joshua Generation / ≤11 Academy of Excellence — **this is the live data substrate**) · **RPLICE** (Validate). External: **Austin ISD, KIPP Austin Public Schools, Communities In Schools of Central Texas**.
- **How to raise the score:** Already at 100. Focus on the **family-school partnership** narrative — Iasis youth program → school referrals → WPH crisis routing is the exact arc Cigna funded last cycle.

### F2 · Centene Foundation — Behavioral Health Community Grants (Spring 2026)
- **Funder / range:** Centene Foundation · Varies
- **Found via:** `manual` source · **URL:** https://centenefoundation.org
- **⏰ Deadline: 2026-05-31** (Spring cycle Mar 1–May 31; Fall cycle Sep 1–Nov 30)
- **Score: 80/100.** Breadth = 3 areas (Behavioral Health · Health Equity · Fiscal Sponsorship). Tier-1: "behavioral health," "501(c)(3)."
- **What's involved:** Tax-exempt charities focused on health, especially behavioral health. Must demonstrate behavioral-health programming capability.
- **Collaborators (already in ecosystem):** **WPH** (Lead) · **Sankofa Network** (Support) · **Talk Your Talk** (Support — crisis events route into WPH; this is the differentiator) · **RPLICE** (Validate). External: **Superior HealthPlan** (Centene's Texas Medicaid plan — natural payer-side partner), **Integral Care** (LMHA for Travis County).
- **How to raise the score:** Add a 4th area (Ecosystem Coordination) by foregrounding the TYT-into-WPH crisis-routing architecture (Civic Signal too) + Tier-1 "trauma-informed" + "community health worker" → ~92.

### F3 · OpenAI — People-First AI Fund
- **Funder / range:** OpenAI · from a $50M total fund
- **Found via:** `manual` source · **URL:** https://openai.com/blog/people-first-ai-fund
- **Score: 96/100.** Breadth = 4 areas (Workforce · Health Equity · Education & Youth · Research/Data & Outcomes). Tier-1: "implementation science" (+12), "responsible AI" (+14) on the latent ecosystem side.
- **What's involved:** Nonprofits using AI to serve underserved communities. **Must demonstrate an operational AI system** — not what AI could do, but what's running. Community impact and scalable model required.
- **Collaborators (already in ecosystem):** **The whole TCAF platform itself** — 4-engine collaborative AI (Gemini + Claude + GPT-4o-mini + DeepSeek R1) + Census tract-level SDOH analysis + RPLICE implementation-science engine + AI grant discovery engine + AI LOI/narrative writer. **WPH, ThriveUp Academy, Civic Signal, RPLICE** are all AI-powered surfaces already in production. External: **none required** — TCAF's first natural solo-prime AI application.
- **How to raise the score:** Add Tier-1 "ai for good" (+15) and "human-centered ai" (+12) to platform descriptions → 100. More importantly: documented user/community-impact numbers (people served, crisis routes completed, grants surfaced) move it from credible to fundable.

### F4 · APAF — Community Grants for Youth of Color MH
- **Funder / range:** American Psychiatric Association Foundation · Varies
- **Found via:** `manual` source · **URL:** https://www.apafdn.org
- **Score: 63/100.** Breadth = 2 areas (Behavioral Health · Health Equity). Tier-1: "minority health," "disparities."
- **What's involved:** US-based nonprofits with demonstrated work in MH inequities for youth of color. Scalable implementation plan required.
- **Collaborators (already in ecosystem):** **Sankofa Network** (Lead — culturally-responsive health equity) · **Black Men's Health Hub** (Support — boys/young men) · **HerHealth Network** (Support — girls/young women) · **WPH** (Support) · **SafeCogniCare** (Support — ADHD overlay) · **RPLICE** (Validate). External: **NAMI's "Sharing Hope" initiative for Black communities, Boys & Girls Clubs of Austin**.
- **How to raise the score:** Document a 3rd area (Education & Youth Development) by foregrounding Perfectly Different + the Iasis youth program (Vann Hub) → 3 areas = 70 base + Tier-1 bonuses → ~85.

### F5 · Adient Foundation — Community Grants
- **Funder / range:** Adient Foundation (corporate, Austin/San Antonio operating corridor) · $15K–$20K
- **Found via:** `corporate` source · **URL:** https://www.adient.com/sustainability/community
- **Score: 65/100.** Breadth = 2 areas (Education & Youth · Fiscal Sponsorship). Tier-1: "education," "501(c)(3)."
- **What's involved:** Education, health, civic engagement in Adient operating communities. **General operating support available** (rare for corporate). Small grant size — best used as first-touch corporate relationship anchor.
- **Collaborators (already in ecosystem):** **ThriveUp Academy** (Lead) · **MCE** (Support — workforce/business in Adient supply chain). External: **Adient's Austin/San Antonio plant community-relations contact** (not yet identified — **action item**).
- **How to raise the score:** Small ceiling means scoring lift has low ROI; do this one as relationship-build, not as score-optimization.

---

## Platform-wide improvements that would lift many scores at once

Ranked by score-lift × number-of-opps-affected. These are real capabilities mostly already present that are under-documented in the keyword-bearing fields the scanner reads:

1. **Make the reentry / Justice Command Center / Thrive Score a first-class documented platform** (not just text inside ThriveUp Academy + Sankofa). Adds Criminal Justice & Reentry as a 3rd–4th area on **S5 (+18)**, possibly **S1**, future federal BJA/OJJDP lines. Tier-1 keywords to embed: "second chance," "restorative justice," "returning citizen," "recidivism."
2. **Promote "Community Health Worker" / "promotora" language across WPH, Sankofa, HerHealth, BMH descriptions.** Tier-1 CHW = +12. Affects **L2, L4, P1, P2, S4** (≥5 of 20).
3. **Make "trauma-informed" explicit on WPH and ISSS.** Tier-1 = +10. Affects **L2, L4, P2, P5, F2** (≥5 of 20).
4. **Make "social determinants of health" explicit on LifeBridge.** Tier-1 = +10. Affects **L5, P1, S3** (3 of 20).
5. **Document "two-generation" model on ISSS + ThriveUp Academy (family-unit framing already real per Dr. Vann May 13 email).** Tier-1 = +10. Affects **F1, P4, P5, S4** (4 of 20).
6. **Document "implementation science" + "evidence-based practice" + "CFIR/RE-AIM" explicitly on RPLICE.** Tier-1 = +20 stacked. Affects **L3, P2, P5, F3, F4, federal NIH/NSF lines** (≥6 of 20).
7. **Document "responsible AI" / "AI for good" / "human-centered AI" on the platform-overview page.** Tier-1 = +27 stacked. Affects **F3 directly, and any future AI-funder lines** (Google.org, Schmidt Futures, McGovern, etc.).
8. **Document apprenticeship / WIOA / workforce-innovation language on ThriveUp Academy.** Tier-1 = +22 stacked. Affects **L1, S1, F5** + future DOL/ETA, NSF ATE lines.
9. **Document "faith-based" / "interfaith" / "congregation" framing on the Vann Collaboration Hub page and platform overview (Iasis Christian Center is the proof point).** Tier-1 = +14. Affects **P1 directly** and any future Lilly Endowment / Templeton / Episcopal Health lines.

**Estimated lift across the 20:** doing items 1–4 alone would raise the median score from ~80 to ~92 and push 8–10 of the lines to 100. All four are documentation work in existing platforms — no new build required.

---

## Domain coverage matrix

|  | CJ | HE | BH | WB | EL | CA |
|---|---|---|---|---|---|---|
| Local | — | L2, L4 | L2, L4 | L1 | L3 | L1, L2, L3, L5 |
| State | S5 | S3, S4 | S2, S4 | S1, S2 | S1 | S3, S5 |
| Public Foundations | — | P1 | P1, P2, P5 | — | P3, P4 | P3, P4, P5 |
| Private Foundations | — | — | F1, F2, F4 | F3, F5 | F3 | F3, F5 |

**Gap:** Criminal Justice off-federal is thin (only S5). Add to federal pipeline instead — BJA FY25 Second Chance Act (Improving Reentry Ed/Employment + Family-Based SUD Treatment, both due 2026-05-04) and OJJDP.

---

## Recommended next 7-day actions

1. **F2 Centene — May 31 hard deadline.** Concept this week: WPH + Sankofa + TYT-into-WPH crisis routing.
2. **F1 Cigna Youth MH (~June 2026 cycle reopen).** Build on Vann Collaboration Hub / Family Program Tracker as the live data substrate.
3. **L4 St. David's Community Health.** Separate line from WAB2/CLC. Frame "actively evaluating."
4. **P1 Episcopal Health Foundation.** Strongest single statewide HE shot at $50K–$750K.
5. **S2 TVC Veterans Mental Health.** Dr. Flood Army-Retiree + M2C + WPH.
6. **Tabbara prior-award checklist** on every line above before LOI.
7. **Federal CJ adds (NOT this list — for federal pipeline):** BJA FY25 Second Chance Act lines + OJJDP.
8. **Documentation sweep (platform-wide items 1–4 above).** Single biggest ROI move — lifts ~10 of these scores from ~80 to ~95+ in one editing pass.

---

*Scan generated 2026-05-14 by joining `grant_opportunities` (648 rows, 208 high-fit) against `proposal_pipeline` (29 active pursuits). Scoring algorithm in `server/grant-routes.ts:176` (computeFitScore). Re-run `npx tsx scripts/compile-agent-knowledge.ts` after any pipeline changes.*
