# Ecosystem Catalog — all 24 platforms (+ 1 unregistered)

*Read this before writing any grant narrative. Verified liveness: May 7, 2026. Source of truth: `ecosystem_platforms` table; this table is a snapshot. Re-probe before linking in submissions.*

**Status legend:** ✅ live & rendering · ⚠️ row exists but URL/data wrong · 🚧 host up but returns 404 · ❌ DNS dead, parked, or unreachable

## Known but NOT in hub DB (must register)
| ID | Name | URL | What it does | Status |
|---|---|---|---|---|
| (none) | **Civic Signal** | power2thepeople.net | Civic intelligence terminal: Live Civic Feed (1,448 court / 880 ord / 360 mtg), 10-step Prepare wizard, EN/ES. **One of the quintet but not registered in hub.** | ✅ |

## Health Equity (10 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `whole-person-health` | **Whole-Person Health Ecosystem** | mentalwellnesssupport.net | **Behavioral-health safety floor under entire ecosystem.** No-login. C-SSRS/PHQ-9/GAD-7/PCL-5 screenings, safety plans, Reach-a-Vet, MAP-GAP, 20,670+ resources, offline PWA. Every platform routes crisis here. | SSG Fox, St. David's, WIOA, Foundation | ✅ |
| `speech-bridge` | **Talk Your Talk** *(DB still says "LexiBridge")* | DB: lexibridge.net ❌ · **TRUE: talkyourtalk.net** ✅ | 89 spoken + 18 sign langs (incl. Black ASL, Intl Sign, Tactile Sign), 6 learning surfaces, crisis detection on every utterance, honest no-auto-988 disclosure. | St. David's, SSG Fox, WIOA, Foundation | ⚠️ true URL live; DB row needs URL+name fix (TYT connector self-registers — fix in TYT workspace) |
| `sankofa` | Sankofa Health Network | yourhealthbirthright.net | Health-equity gateway orchestrating the 5 Sankofa sub-platforms; culturally-responsive BH assessments, GIS resource matching. | St. David's, SSG Fox, Foundation | ✅ |
| `sankofa-maternal-health` | Black Maternal Health Network | yourhealthbirthright.net *(shared)* | Black maternal mortality response: doula matching, EPDS/PHQ-9 peripartum screening, postpartum recovery, CHW dispatch. | St. David's, SSG Fox, Foundation | ✅ |
| `sankofa-mens-health` | Black Men's Health Hub | thehealthyblkman.com | Prostate/CV/diabetes prevention, BH stigma reduction, AUDIT-C/DAST-10, peer-mentor matching for Black men. | St. David's, SSG Fox, Foundation | ✅ |
| `sankofa-feminine-health` | **HerHealth Network** (Holistic Black Feminine Health Hub) | **herhealthmatters2.com** (alias: myhealthybreast.com) — *old yourfeminineneeds.com is unbound; URL+name fixed in `ECOSYSTEM_PLATFORMS` array May 7, 2026* | OB/GYN, hormonal wellness, cervical/breast cancer awareness, menopause, culturally-responsive provider matching. | St. David's, Foundation | ✅ |
| `safecognicare` | SafeCogniCare | safecognicare.com | TBI/ADHD/dementia/peripartum cognitive: MoCA/MMSE/Trail Making, early intervention, family caregiver burden. Critical for veteran TBI + maternal cognitive change. | SSG Fox, St. David's, Foundation | ✅ |
| `perfectly-different` | Perfectly Different | neurodifferentassistant.app | Neurodiversity-affirming (autism, ADHD, AuDHD): IEP/504 templates, crisis routes to WPH, evidence-based therapy library. | St. David's, Foundation, WIOA | ✅ |
| `pillscheduler` | PillScheduler | pillscheduler.net | Polypharmacy management: adaptive reminders, FDA interaction DB, care-team coordination, adherence scoring. | SSG Fox, St. David's, Foundation | ❌ |
| `autoimmune-thrive` | Autoimmune Center of Excellence | autoimmunethrive.com | Lived-experience-built autoimmune companion: symptom check-ins, flare tracking, 80+ condition guides. | St. David's, Foundation, WIOA, SSG Fox | ❌ |

## Community / Workforce / Veterans (4 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `lifebridge` | **LifeBridge** | lifetransitionsaid.org | Virtual 211 + CHW coordination across housing/food/health/MH/SUD/DV/crisis. 20,670+ resources. Addresses non-combat veteran-suicide drivers (divorce, job loss, retirement, bereavement). | St. David's, SSG Fox | ✅ |
| `collaborative-advocate` | **The Collaborative Advocate** *(TCAF parent org)* | thrivingcommunitiesforall.com | The 501(c)(3) entity itself. Veteran-founded, Black-led VOSB. Service-delivery + grant-execution arm. Hosts ThriveUp `/academy`. | All | ✅ |
| `m2c` | Mission Transition (M2C) | vetmissiontransition.com | Full mil-to-civ transition: MOS/AFSC translation, GI Bill/VA/disability claims, identity transition for loss-of-purpose crisis, employer matching. | SSG Fox, WIOA, Foundation | ✅ |
| `mce` | Minority Center of Excellence | minoritycenterofexcellence.com | 656,794 SAM.gov records; 14 AI tools across 6-stage business lifecycle; dual-AI (GPT+Claude) proposal review; 50-state certification coverage. | WIOA, Foundation, SSG Fox | ✅ |

## Education (3 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `isss` | ChildCORE | childcore.app *(shared)* | Community intelligence for child and family services — provider availability, school intelligence, and social-determinants data integrated directly into ThriveUp navigation and referral pathways. | WIOA, Foundation, St. David's | ✅ |
| `betterscience` | RPLICE — Research-to-Practice Lifecycle | www.bettersciencelab.com | Closes science→practice gap: live evidence search, project assessment, implementation planning, outcome tracking. CFIR 2.0 + RE-AIM. | SSG Fox, Foundation, WIOA, St. David's | ✅ |
| `wholemind` | WholeMind Learning | wholemindlearning.com | Free Pre-K-12 visual-first learning, silent accessibility mode, AI homework help, gamified engagement. | WIOA, Foundation, St. David's | ❌ (parking lander) |

## Compliance / Operations / Marketing / System (7 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `safereport` | SafeReport | safereports.net | **Compliance-Grade AI for Clinical Settings.** Mandatory reporting + Clinical Decision Support (CDS) for behavioral-health workflows. 50-state reg DB, FHIR + CDS Hooks healthcare interop, 0 PHI bytes egressed, HITL default-on, 100% cited recommendations, validated longitudinal screening, free-forever tier. | Centene, Cigna, Episcopal Health, SSG Fox, NIMH/SAMHSA, RWJF/Schmidt/McGovern (responsible AI) | ✅ |
| `emergency-mgmt` | Emergency Management | emergency-mgmt.replit.app | Risk intelligence: geographic risk maps, multi-factor safety analytics, ingests SafeReport/WPH/LifeBridge data for predictive safety models. | SSG Fox, Foundation, St. David's | 🚧 (404) |
| `ecosystem-nexus` | Ecosystem Nexus | ecosystemnexus.net | Cross-platform health monitoring, directive enforcement, triad team-of-teams coordination, bilateral exchange protocols. | All | ❌ |
| `code-canvas` | Code Canvas — System Evaluator | codecanvaseval.com | Independent code/architecture/perf audits across the ecosystem; QA backbone. | All | ❌ |
| `ad-targeting` | Advertising Targeting for Platforms | adtargetingplatforms.com | Audience segmentation, A/B campaigns, cross-platform ad delivery for grant-funded program outreach. | WIOA, St. David's, Foundation, SSG Fox | ❌ |
| `video-creator-ai` | Video Creator AI | videocreatorai.com | AI content production for the ecosystem: promo videos, grant decks, training, platform showcases. | All | ❌ |
| `pinnacle-business-conglomerate` | Pinnacle Business Conglomerate | pinnaclebusinessconglomerate.com | Cradle-to-grave contractor enablement for minority/veteran-owned: 8(a)/HUBZone/SDVOSB/WOSB cert, dual-AI proposal dev, milestone tracking. | All | ❌ |

## Quintet (the 5 platforms to lead with in narratives)
**Talk Your Talk · Civic Signal · LifeBridge · ThriveUp · Whole-Person Health Ecosystem.** See `docs/grants/QUARTET-ONE-PAGER.md` for the drop-in narrative.

## Critical caveats for any grant work
1. **Civic Signal is not in the hub DB.** It's part of the quintet but missing from `ecosystem_platforms`. Register it before next ecosystem-wide claim.
2. **TYT row's URL is wrong.** DB says `lexibridge.net` (dead). True URL is `talkyourtalk.net`. The TYT connector self-registers as "LexiBridge" on every heartbeat — fix lives in TYT workspace, not here.
3. **9 of 24 platforms are not currently public-facing** (DNS dead, parked, or 404). Never link to a platform in a proposal without re-probing first. **Probe ALL known aliases before declaring a platform dead** — `sankofa-feminine-health` was nearly removed because `yourfeminineneeds.com` 404s, but the same site is live at `herhealthmatters2.com` AND `myhealthybreast.com` (same payload). Always check the project's Publishing → Domains tab for verified alternate URLs. The ecosystem-alignment-scan script (`scripts/ecosystem-alignment-scan.sh`) and the probe pattern in `docs/active-commitments.md` ("SPA route 200 ≠ real page") apply here too.
4. **Platform destinations.** ChildCORE (`childcore.app`) replaced Implementation in Education / ISSS; RPLICE (Better Science Lab) uses `www.bettersciencelab.com`. `yourhealthbirthright.net` hosts BOTH `sankofa` and `sankofa-maternal-health`. `thrivingcommunitiesforall.com/academy` is ThriveUp on the `collaborative-advocate` domain.
5. **Always pull the full table before locking a narrative.** The cost of working from in-context guesses instead of the live DB is missed grant fits.

---

*This file is the human-readable catalog. The live, queryable, structured version is at `GET /api/agent/knowledge/topic/platforms` (live from `ecosystem_platforms` DB) and `GET /api/agent/knowledge/topic/ecosystem_caveats` (parsed from this file by `scripts/compile-agent-knowledge.ts`).*
