# Technical Architecture Overview
**Companion to the One-Pager · For Kevin Packer / InvesTech Consulting · 2026-05-18**

This is the diligence-grade companion. Every number below was primary-source verified from the codebase on 2026-05-17.

---

## 1. Codebase scale at a glance

| Metric | Count | Verified via |
|---|---|---|
| PostgreSQL tables | **271** | `grep` of Drizzle schema |
| Frontend page files | **211** | `find client/src/pages` |
| Server route/logic files | **84** | `find server -maxdepth 2` |
| Production line-count in 10 highest-density pages | **~27,000** lines | explorer audit |
| Live trade simulations | **6** × 15 lessons = **90** | `tradeSimsLessons` table |
| AI engines in synthesis | **4** | `server/ai-provider.ts` |
| RAG knowledge chunks | **86** | `server/rag-engine.ts` |
| Public service platforms operated | **15** | ecosystem catalog |
| Grants tracked | **651** | `grant_opportunities` table |
| Languages (Trade Sims AI tutor) | **10** | `client/src/lib/i18n` |
| Talk Your Talk language coverage | **107** (89 spoken + 18 signed) | TYT registry |

Stack: **React + Vite + TypeScript** (frontend) · **Express + Node.js** (API) · **PostgreSQL (Neon) via Drizzle ORM** · **Replit Auth (OIDC)** · **TanStack Query v5 · wouter routing · Tailwind + shadcn/ui**.

---

## 2. The four physics engines behind Trade Sims

These are not "real physics" generically. They are industry-standard solvers running in the browser.

| Trade | Engine | Standard |
|---|---|---|
| Electrical | Modified Nodal Analysis (MNA) DC solver | Standard EE undergraduate solver |
| Automotive | MNA via adapter (reuses electrical solver) | Engineering-clean reuse pattern |
| Plumbing | Hardy-Cross Newton-Raphson flow solver | Standard civil/mechanical pipe-network solver, with active-set outer loop for true one-way check valves |
| Welding | Heat-Input Evaluator | **AWS D1.1 §5.7** (American Welding Society Structural Welding Code) |
| HVAC | Thermal-airflow engine | Production 2026-05-17 |
| Software Engineering | Concept-only (no physics) | 15 lessons covering algorithms, version control, testing, design patterns, scalability, code quality, security |

**Test coverage (self-running, exits 1 on failure):**
- Welding heat-input-evaluator: 16/16
- Plumbing flow-solver: 17/17 (including parallel-branch and reverse-installed valve cases)
- Automotive-electrical reuse integration: 10/10
- Electrical MNA: passing (KVL/KCL, voltage-divider, series-parallel sanity)

**Credential routing at 80% lesson completion.** Production at `server/trade-sims-cert-routes.ts`:
- 3 industry credentials per trade (OSHA 10, NCCER L1, AWS SENSE, AWS D1.1, ASE G1, EPA 609, EPA 608 Universal, NATE Ready-to-Work, GitHub Foundations, CompTIA ITF+, AWS CCP, AZ-900, (ISC)² CC, LFCA, state apprentice registration)
- 2-3 registered apprenticeship pathways per trade (IBEW/NECA, UA Local 286, ABC, Iron Workers, SMART, OEM tech programs, Apprenti, Microsoft LEAP, Multiverse, Year Up, AWS re/Start, TDLR, TSBPE)
- Universal locators: apprenticeship.gov, Texas Workforce Commission, WorkInTexas
- Sponsor-verification disclaimers on every cert (Iron Rule)

---

## 3. AI stack — orchestration, not wrapping

| Capability | Where it lives | Why it matters |
|---|---|---|
| 4-engine collaborative synthesis | `server/ai-provider.ts` | Any one provider outage does not break the session |
| 86-chunk RAG | `server/rag-engine.ts` | Grounded in TCAF's own active-commitment docs |
| Trade Sims AI tutor — two modes | `server/trade-sims-routes.ts` | **Socratic-hint** mode (no answer-giving) + **ensemble-debrief** mode |
| Foster-youth AI risk engine | `server/foster-youth-risk.ts` | 4-domain scoring: housing / food / mental health / documents |
| AI early-warning engine | `server/early-warning.ts` | Triggers intervention playbooks |
| AI proposal/narrative generator | `server/loi-routes.ts`, `grant-packages.tsx` | 50-state-compliant narrative generation |
| AI grant fit-scoring | `server/grant-routes.ts` | Tier-weighted keyword scoring + semantic analysis |
| AI translation — dialect-aware | `server/translate-routes.ts` | Preserves AAVE, Spanglish, regional dialect, not just literal translation |
| Deterministic agent-knowledge bootstrap | `GET /api/agent/knowledge/session-bootstrap` | ~3KB session-startup memory hook |

**Funder framing:** "We don't use AI. We orchestrate it." Four engines, failover, mode-switching tutors, dialect-aware translation, RAG grounded in our own documented commitments.

---

## 4. Implementation Science — code, not slogans

- **39 CFIR constructs** wired into `client/src/pages/research-hub.tsx`
- **NRRC + CFIR 2.0 fidelity scoring rubrics** in `server/standards-routes.ts`
- **MAP-GAP CQI** — `client/src/pages/map-gap-cqi.tsx` is **1,705 lines** of continuous-improvement logic for ecosystem gap detection
- **Outcome reporting** — funder-grade evidence dashboards in `outcome-reporting.tsx`
- **RPLICE bridge** — `server/ecosystem-rplice-bridge.ts` auto-routes implementation-science findings to relevant platform domains

---

## 5. Justice & Reentry stack

11 production tables. Not pitched in most prior materials.

- **RNR Assessments** — Risk-Need-Responsivity, the gold standard in corrections
- **CBI Programs** — Cognitive Behavioral Intervention
- **Recidivism baselines** — tracked longitudinally
- **Family-visitation tracking** — proven recidivism reducer
- **NRRC outcome reports** — National Reentry Resource Center standard
- `justice-command-center.tsx` — **3,482 lines** of integrated case management

---

## 6. Foster-Youth Transition Engine

- 50-state policy comparator with statute citations (`client/src/data/foster-youth/state-policies.ts`)
- ETV, Chafee, Medicaid-to-26, John H. Chafee Foster Care Independence, state-specific extended foster care
- Multi-agency case management
- **Capability-token security** on the public no-auth wizard: server-issued per-row `accessToken`, `x-intake-token` header, `timingSafeEqual` comparison, per-IP rate limits on AI/upload endpoints
- 4-domain AI risk engine
- PPTX leave-behind generator for caseworkers

---

## 7. Compliance & Security posture

- **FHIR + CDS Hooks** clinical interoperability (SafeReport, live at safereports.net — "Compliance-Grade AI for Clinical Settings")
- **0-PHI-egress** design pattern
- **HITL-default-on** for clinical workflows
- **Longitudinal screening instruments**: PHQ-9, GAD-7, C-SSRS, PCL-5, ACES
- **Ecosystem auth**: `x-ecosystem-key` + `x-shadow-key` server-side exact-match comparison (no prefix-checking IDOR)
- **Audit logging**: `academy_choice_logs` + `network_member_events`
- **Threat model published** at `threat_model.md` covering spoofing, tampering, repudiation, information disclosure, DoS, and elevation of privilege
- **Two-entity capability strategy**: TCAF (501c3) + ISS LLC (for-profit) — clean firewall

---

## 8. Grant Intelligence Engine

- **651 grants tracked** as of 2026-05-17 (`grant_opportunities` table)
- Sources: Grants.gov (369) · USASpending.gov (198) · SAM.gov (36) · manual (12) · state/local (18) · other federal (8) · foundation/corporate (4) · misc (6)
- Tier-weighted keyword scoring with explicit point values (e.g., "PHI-safe" +10, "HITL" +12)
- AI fit-analysis layered on top
- **This Week digest** (manual send today, cron scheduled): `GET /api/grants/this-week`, `POST /api/grants/digest/send`
- **Monday Brief page** at `/this-week`: strategic dimensions, ship targets, grants closing in 14 days, declared funder decisions pending
- `grant-packages.tsx` — **6,340 lines** of multi-document assembly + narrative engine
- `grant-command-center.tsx` — **3,182 lines** of real-time AI scoring + pipeline ops

**SAM.gov honest framing:** we screen the 16,000+ active-opportunity feed and curate ~36 of direct relevance. We never claim to "track 16,667."

---

## 9. Academy Live Economic Engine — almost never surfaced

**45 Academy tables**, including:
- `academyWallets`, `academyStocks`, `academyPortfolios` — live economic simulation for student learners
- `academyCompetitions` — gamified cohorts
- `academyMerchOrders` — real fulfillment loop
- `academyPantherPower` — GAM-ready (Generalized Additive Model) merit scoring
- `academyScenarios` + nodes + logs — branching interactive narratives
- `academyLifeLessons` — financial literacy, civic engagement, SDOH navigation
- `academy_choice_logs` — full behavioral audit trail

This is FAFSA + financial literacy + AI literacy + STEM + workforce + apprenticeship + behavioral-economics simulator under one auth.

---

## 10. Ecosystem Hub — real cross-platform architecture

- **Heartbeat system**: 25 platforms tracked live (15 public, 10 internal/dev)
- **Cross-platform event bus**: `networkMemberEvents` table
- **Shadow-Observer pattern**: `server/agent-communication.ts` for AI monitoring of data flows
- **RPLICE-Bridge routing**: implementation-science findings auto-routed to relevant platform domains
- **Evidence Registry**: `communityEvidence` table citing primary sources
- **Platform-Funder fit table**: formal data structure for matching platforms to funders

---

## 11. Build-heavy pages (illustrative)

| Page | Lines | What it is |
|---|---|---|
| `grant-packages.tsx` | 6,340 | Multi-doc assembly + narrative engine |
| `justice-command-center.tsx` | 3,482 | RNR-integrated case management + recidivism dashboard |
| `grant-command-center.tsx` | 3,182 | Real-time AI grant scoring + pipeline ops |
| `rplice-tools.tsx` | 2,750 | Implementation-science scoring + community analysis |
| `presentations.tsx` | 1,970 | Integrated slide generation + stakeholder pitch engine |
| `opportunity-youth.tsx` | 1,930 | High-density persona-based pathway modeling |
| `map-gap-cqi.tsx` | 1,705 | CQI logic for ecosystem gaps |
| `wab2-enrollment-hub.tsx` | 1,597 | Multi-factor eligibility + enrollment engine |
| `transition-plans.tsx` | 1,547 | Collaborative plan builder with milestones |
| `apprenticeship-tracker.tsx` | 1,538 | Longitudinal trade-placement tracking |

**~27,000 lines in those 10 pages alone.** Shipped, in production, with real users.

---

## 12. Iron Rule

Every number in this document was primary-source verified from the codebase on 2026-05-17. Any number you want to cite externally should be re-verified against the funder's diligence date — memory is never a primary source.

— Terry D. Flood Sr., President · TCAF · 2026-05-18
