# Partner Intel Brief — The SAFE Alliance (safeaustin.org)

**Status:** New outreach target. No prior contact.
**Lane:** Behavioral Health · Trauma services · DV/SA/Child Abuse · Travis County safety-net anchor
**File created:** 2026-05-22 · **Source verification:** primary-source pulls from safeaustin.org/about-us/ + /our-services/ + footer (this turn)
**Companion file:** `docs/partners/SAFE-Alliance-Intro-Email-DRAFT.md`

> **Iron Rule reminder:** every claim below was pulled live this turn. Re-verify before any send — DV org leadership, addresses, and program scope shift more than most.

---

## 1. Who they are (primary-source verified)

- **Legal name:** **The SAFE Alliance** ("SAFE" = Stop Abuse For Everyone) — merger of **Austin Children's Shelter** + **SafePlace**.
- **EIN:** **74-2320657** (per their own About Us page, this turn).
- **501(c)(3):** confirmed on About Us page.
- **Candid Gold Transparency 2026** (footer badge).
- **Mailing:** P.O. Box 19454, Austin, TX 78760.
- **Hotlines:** 24-hr SAFEline **512-267-SAFE (7233)** · Text "SAFE" to **737-888-7233** · Chat link on site · Admin **512-369-5900**.
- **Site:** https://www.safeaustin.org

**Scope of mission (their words):** "survivors of child abuse, sexual assault and exploitation, and domestic violence." Travis County is core service area; some programs reach Williamson County.

---

## 2. Programs / services (from /our-services/, verified this turn)

Three program pillars:

### Face-to-Face & Digital Support
- Sexual Assault Victim Advocacy
- Survivor Peer Support
- Counseling
- **CARES** — Support for Survivors of Exploitation & Trafficking
- **Eloise House** — Forensic Nursing Exams and Rape Kits (SANE)
- Legal Services
- **Planet SAFE** — Supervised Visitation & Exchange
- **Deaf SHARE** — Survivor Healing through Advocacy, Resources, and Empowerment (Deaf, DeafBlind, DeafDisabled, Hard of Hearing)

### Prevention & Education
- Life Skills · Alumni Services · Charter School Services · Disability Services
- Community Education
- **Expect Respect** (school-based dating violence prevention) — well-known evidence-based program
- Program Manual and Training Options

### Advocacy
- Community Resource Advocacy
- **SAFE Futures** — Advocacy for Families in CPS

### Other (in our existing platform already)
- **SAFE Fatherhood Program** — referenced in `client/src/pages/mentorship-directory.tsx:340` (Travis & Williamson County).

---

## 3. Leadership (KNOWN-UNKNOWN — verify before personalizing intro)

Names visible on /about-us/ "Our Team" section (sub-pages each 404'd from our fetch — staff page deeplinks blocked):
- Coni Huntsman Stogner
- Kitt Krejci
- Melinda Cantu, MSSW
- Wendie Abramson, LMSW
- Yvette Mendoza Rouen
- Movetia Salter
- Liz Owen-Schmitt (truncated)

> **DO NOT** pick one as "CEO" from memory. **Action item:** call admin line 512-369-5900 or LinkedIn-search "SAFE Alliance Austin CEO" before sending the intro. Until then, address the draft to "Leadership Team" + the admin line.

---

## 4. Where TCAF actually fits (real intersection points — not generic)

Every claim here maps to a shipped capability documented in `docs/grants/tcaf-capabilities-inventory-2026-05-17.md`:

### A. Whole-Person Health + SafeReport longitudinal screening → SAFE Futures + CPS families
- **TCAF capability:** SafeReport (live, safereports.net) — CDS/FHIR/CDS-Hooks, 0-PHI-egress, HITL-default-on, longitudinal screening: **PHQ-9 · GAD-7 · C-SSRS · PCL-5 · ACES**.
- **SAFE need it maps to:** PCL-5 (PTSD) + C-SSRS (suicidality) + ACES (childhood trauma scoring) are exactly the instruments SAFE Futures, Counseling, and Eloise House post-forensic-exam follow-up rely on. PHI stays inside SAFE's clinical perimeter; we provide the decision-support layer.

### B. Talk Your Talk → Deaf SHARE language-parity gap
- **TCAF capability:** Talk Your Talk (89 spoken + 18 sign-language surfaces = 107 total, AI-mediated, dialect-aware).
- **SAFE need it maps to:** Deaf SHARE serves Deaf/DeafBlind/DeafDisabled/HoH survivors. Most DV/SA networks default to relay/VRS as the only access path. 18 sign-language coverage + AAVE/Spanglish dialect-aware system prompts is a substantive differentiator for a survivor calling at 2am.

### C. LifeBridge + Civic Signal → warm hand-off + benefits navigation
- **TCAF capability:** LifeBridge (benefits navigation) + Civic Signal (community signal routing). Both are in the live quintet.
- **SAFE need it maps to:** Survivors leaving DV typically need: emergency cash assistance, SNAP/Medicaid re-enrollment after address change, TANF, childcare subsidy, housing voucher waitlist, replacement IDs. Today SAFE staff do this by phone. We can sit underneath that workflow and warm-hand-off into the right state portal.

### D. RNR / CBI / NRRC stack → DV survivor pathways through justice system
- **TCAF capability:** Risk-Need-Responsivity, Cognitive Behavioral Intervention, National Reentry Resource Center alignment. Live in our justice stack.
- **SAFE need it maps to:** Survivors with criminal-legal entanglement (often: arrest from dual-arrest DV calls, drug-court referrals, mandated services); SAFE Futures families navigating CPS *and* parole/probation simultaneously.

### E. Foster-Youth wizard → SAFE Futures CPS-involved families overlap
- **TCAF capability:** Foster-youth intake wizard, state-portal comparison, policy-comparison, risk engine (May 11, 2026 build).
- **SAFE need it maps to:** SAFE Futures explicitly advocates for families in CPS. Foster placement is the downstream when reunification fails. We've built the navigation surface.

### F. Grant Discovery Engine → joint federal/state pursuits
- **TCAF capability:** 651 tracked opportunities, AI tier-weighted fit-scoring, Tabbara prior-award checklist on every pursuit. Behavioral-health/DV-coded opps already curated.
- **SAFE need it maps to:** Sub-grant identification (OVW grants, VOCA, SAMHSA's Children & Family Programs, HRSA, HHSC) for *joint* applications where SAFE is prime and TCAF brings the digital-infrastructure layer, or vice versa.

---

## 5. The honest ask framing (for the intro)

We are **not** asking them for money, a referral list, or to white-label our platform. The intro is a single 25-minute call to:
1. Show 2 surfaces (Deaf SHARE language-parity demo + SafeReport longitudinal screening demo).
2. Ask what their actual operational pain points are (which programs are over-subscribed, where intake takes longest, what the CPS-families team needs).
3. Identify one concrete pilot they would actually use — or part ways cleanly.

No pretending it's a co-equal merger. No funder-stage misrepresentation. No City-of-Austin pass-through claim (SAFE does have City contracts — see COI flag below).

---

## 6. Gotchas / COI / handling rules

- **🚨 Meredith Sisnett must NOT be on anything related to SAFE outreach.** SAFE Alliance holds **City of Austin** contracts (Public Health, APH, ECHO continuum-of-care). Meredith is a City of Austin employee. Per replit.md gotcha, she is excluded from City of Austin grant/proposal/contract surfaces — that includes any pass-through where the funder is the City. **Single contact on TCAF side = Dr. Flood. terryflood@thrivingcommunitiesforall.com.**
- **President not CEO** for Dr. Flood in any copy that touches SAFE.
- **Funder names** — avoid naming specific funders publicly when describing TCAF capability; describe the category (federal BH, state IDD, county VOCA, etc.).
- **PHI** — every TCAF surface we'd demo is 0-PHI-egress or de-identified. State this on the call and again in any follow-up.
- **Trauma-informed comms discipline** — DV-org leadership is contacted constantly by vendors. Lead with what they need, not what we built. Keep the intro under 250 words.
- **Their "Leave Site" button on every page** (visible in our screenshots) is a tell that they take user-safety friction seriously. Any tool we'd embed on their public surfaces needs the same affordance.

---

## 7. Existing TCAF references to SAFE

| Where | What | Action |
|---|---|---|
| `client/src/pages/mentorship-directory.tsx:340` | "SAFE Alliance — Fatherhood Program" entry in mentorship directory | Keep as-is. Mention in intro that we already surface their Fatherhood Program inside our directory. |
| Ecosystem DB | Not present | Do **NOT** add to `ecosystem_platforms` — they are a *partner target*, not a TCAF-operated surface. Auto-sync would overwrite. |
| Grants pipeline | No joint pursuits opened | Open joint-pursuit row only after first call confirms appetite. |

---

## 8. Open follow-ups (Iron Rule items — verify before send)

- [ ] Confirm current CEO/Executive Director name + email (call 512-369-5900 admin line or LinkedIn).
- [ ] Confirm whether they accept cold partnership inquiries via web form vs direct email vs LinkedIn message.
- [ ] Pull their most recent 990 (Candid Gold profile or IRS direct) to size budget + understand restricted-vs-unrestricted ratio. ProPublica search "safe alliance austin" returned 0 nonprofits on first pass — try IRS Tax Exempt Org Search directly with EIN 74-2320657.
- [ ] Check if they're on `grants.gov` as a registered sub-recipient (UEI lookup).
- [ ] Re-run `npx tsx scripts/compile-agent-knowledge.ts` so this brief is in the agent's compiled memory.

---

**Sources opened this turn:**
- https://www.safeaustin.org/about-us/ → attached_assets/screenshots/safeaustin_org_about-us.png (EIN + merger language)
- https://www.safeaustin.org/our-services/ → attached_assets/screenshots/safeaustin_org_our-services.png (3 pillars + 18 programs)
- https://www.safeaustin.org/about-us/leadership/ → 404
- https://www.safeaustin.org/about-us/staff-leadership/ → 404
- https://www.safeaustin.org/ways-to-give/community-partnerships/ → 404
- https://projects.propublica.org/nonprofits/search?q=safe+alliance+austin → 0 nonprofits (EIN search did not match; confirmed EIN from SAFE's own About page)
