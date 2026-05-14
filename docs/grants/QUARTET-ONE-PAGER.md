# TCAF Ecosystem — The Quartet on a Safety Floor
*Drop-in narrative for grant proposals · last verified May 7, 2026*

## The thesis in one paragraph

Most communities have services. Few residents can reach them. The gap is not absence — it is **agency**: the day-to-day capacity to see what is available, communicate in the language and dialect that feels like home, and move between services without re-explaining your situation each time. TCAF closes that gap with four interoperable platforms that remove specific barriers to agency, sitting on a behavioral-health safety floor that catches residents when removing the barrier is not enough by itself. Built nationally, piloted in Travis County, Texas.

## The five platforms

| Platform | Layer | Barrier removed (or floor it provides) | Public URL |
|---|---|---|---|
| **Talk Your Talk** | Communication + learning substrate (runs under the other three) | Can't be understood in your own voice; can't learn the new vocabulary you need | talkyourtalk.net |
| **Civic Signal** | Civic intelligence | Can't see or influence local government | power2thepeople.net |
| **LifeBridge** | Safety-net navigation | Can't navigate fragmented services | lifetransitionsaid.org |
| **ThriveUp Academy** | Workforce + skills building | Can't build new-economy skills | thrivingcommunitiesforall.com |
| **Whole-Person Health Ecosystem** | Behavioral-health safety floor under all four | Catches the resident when removing the barrier isn't enough — validated screenings, safety plans, crisis routing, no login required | mentalwellnesssupport.net |

## The pitch line (verbatim, use anywhere)

> *Three service platforms, one accessibility substrate, one behavioral-health safety floor. You can't get civic information you don't understand. You can't navigate a 211 in a language no one offered. You can't learn AI through a screen reader that mispronounces your name. And when removing the barrier isn't enough, somebody has to catch you. Talk Your Talk runs underneath. Whole-Person Health catches.*

## Talk Your Talk — the substrate

**Headline:** *"Your Voice, Understood." A dialect-aware, multilingual communication bridge across 89 spoken and 18 sign languages — with real-time interpretation, crisis detection, snap-a-photo vocabulary learning, and live classroom games.*

**The differentiator:** It is **register-to-register**, not language-to-language. Translation between *lived language* and *institutional language* — the way grandmothers, court intake clerks, and ER nurses actually speak — not just dictionary equivalence.

**Verified coverage (from codebase):**
- 89 spoken languages including dialect variants for English (10: AAVE, Gullah Geechee, Appalachian, Spanglish, Caribbean, Haitian-Creole-influenced, Southern US, British, Australian, Standard American), Spanish (8), Arabic (6), Mandarin (3), French, Portuguese
- 18 sign languages including **Black ASL as a separate entry** (most platforms erase it), **International Sign** (refugee/cross-border), **Tactile Sign** (DeafBlind), plus ASL, BSL, LSF, DGS, JSL, CSL, KSL, LSM, Auslan, Libras, ISL, NZSL, SASL, RSL, TİD

**Six learning surfaces:** Snap & Learn (camera → bilingual flashcard) · Spaced-Repetition Review (SM-2/Anki) · Match Game · Live Learning Sessions (Kahoot-style, 6-letter join code) · Belonging Path (12-unit guided journey) · Family Circles + Mentor Match

**Crisis detection — honest framing:** Runs on every utterance in all 107 languages, classifies severity into 5 levels, persists structured outcome data per message and session (queryable for grant reporting), and presents one-tap dialer access to **911** and **988**. Detection events route to **Whole-Person Health Ecosystem** for follow-up. *Does not* auto-dispatch to 988 (their API does not allow third-party dispatch) and *does not* yet route to a live human interpreter — that is the next-cycle line item.

**Accessibility:** Installable PWA · offline phrase boards · passwordless email sign-in · accessibility menu in the global header.

## Civic Signal — civic intelligence terminal

A 18-route civic intelligence platform with a **Live Civic Feed** (1,448 court items · 880 ordinances · 360 meetings as of last verified scan) and a **10-step Prepare wizard** that walks residents from "I just heard about a hearing" to "I am ready to speak at it."

## LifeBridge — virtual community health worker

A virtual CHW named "Julia" backed by **2,935 resources** across 5 service lines, including a specialty service line for **Foster Youth Aging Out** (Chafee Act eligibility navigator). Visible 24/7 crisis bar in the header (988, DV Hotline, NAMI HelpLine, SAMHSA, Crisis Text, 2-1-1).

## ThriveUp Academy — workforce + skills

K-12 AI Mastery Curriculum, Marcus reentry persona for justice-involved learners, FAFSA navigator, apprenticeship tracker, and the Panther Village campus (Wallet, Career Explorer, Mentor Hub, Mentor Finder, Quest Board, Dream Lab, Learning Center) — all documented in `replit.md`.

## Whole-Person Health Ecosystem — the safety floor

**Headline:** *"You don't have to figure this out alone." A free, no-login, behavioral-health hub for anyone navigating mental health — for themselves, their child, someone they love, or someone they serve.*

**What ships (verified live):**
- **Validated clinical screenings:** C-SSRS (suicidality), PHQ-9 (depression), GAD-7 (anxiety), PCL-5 (PTSD)
- **Individualized safety plans** with auto-escalation
- **"Reach a Vet" crisis pathway** + sticky 988 Call-or-Text bar always visible
- **MAP-GAP biopsychosocial assessment** baked into the front door
- **20,670+ curated resources** across 2,091 community groups, 60 condition guides, 19 population-specific hubs
- **Role-based entry points:** myself · my child or teen · someone I love · provider or educator · veteran or military family · I need help right now
- **Offline-capable PWA** for connectivity-limited environments
- **No login required** ("Start wherever feels right") — major access-equity signal

**Architectural role:** Every other platform in the ecosystem — the four above and the rest of the 24 — routes its crisis, referral, and assessment data through this hub. It is the connective tissue, not a peer.

## How to use this in proposals

- **Lead with the substrate.** When language access is on the rubric (HRSA LAP, CMS OMH, DOJ LEP, ED OELA, ACL accessibility, FEMA Whole Community, VA Equity Action, 988/SAMHSA, ADA Title III, FCC Section 255, IDEA Part B/C), Talk Your Talk is the headline and the other platforms are the surfaces it makes accessible.
- **Lead with the safety floor.** When the rubric is behavioral health (SAMHSA, SSG Fox, St. David's behavioral health, AHRQ, ACL crisis services), Whole-Person Health is the headline and the four agency platforms are the upstream barrier-removal layer that gets residents to the floor before they fall through.
- **Lead with the service.** When the rubric is health (St. David's general), workforce (WIOA), civic engagement (Knight, Mozilla), or family literacy (ED Even Start, IMLS), lead with that platform and disclose Talk Your Talk as the accessibility substrate and Whole-Person Health as the behavioral-health safety floor.
- **Always disclose what does not yet ship.** "Crisis detection ships; auto-dispatch to 988 does not. Six learning surfaces ship; live human interpreter handoff does not. Validated screenings ship; in-house clinicians do not." Reviewers reward honesty; over-claiming gets you flagged.

## Always-true gotchas (do not violate)

- **Dr. Flood:** *President*, not CEO. Email: `terryflood@thrivingcommunitiesforall.com`. Phone: (254) 319-8460. Never personal Gmail.
- **Meredith Sisnett:** City of Austin employee. **Never** list on any City of Austin grant, contract, or proposal as staff, contact, board, co-lead, or partner. Non-City work only.
- **501(c)(3):** TCAF is IRS-determined under section 170(b)(1)(A)(vi) (Letter 947, effective January 14, 2026). SAM.gov Active (UEI KDDVD1FGLW35); CAGE 209N1.
- **St. David's Foundation:** "Actively evaluating" — never "awarded."
- **Geographic framing:** "National platform, Texas-piloted." Travis County is implementation template, not limitation.
- **Funder names on public pages:** Avoid. Describe the program category instead.
