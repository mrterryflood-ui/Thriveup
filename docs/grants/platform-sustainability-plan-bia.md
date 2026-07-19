# ThriveUp Academy — BIA-Aligned Sustainability Plan

**Framework:** SALP + BIA + ADIS + Scholar-Athlete Protocol
**Author:** Generated 2026-07-19 under ADIS Day-0 vital signs observation
**Note:** Per ADIS temporal gating, the observations below are Day-0 (noise classification). No pattern diagnoses before 14 days. No confirmed diagnoses before 28 days. This plan is a structured starting point — a leverage-point-targeted intervention design — not a clinical diagnosis.

---

## PART 1 — Current State (ADIS Day-0 Observation)

### 12-Layer Vital Signs Snapshot

| Layer | Status | Evidence | SALP Anchor Type |
|---|---|---|---|
| **Skin** | 🟢 Green | Identity stable. TCAF/ISS LLC/Fable Standard clear. Fable + SALP+BIA now embedded as constitution. | Primary anchor |
| **Brain** | 🟢 Green | `server/ai-provider.ts` routing healthy. 5 AI engines auto-wrapped. Compiled memory architecture functional. 29 session logs. | Executive anchor |
| **Nervous System** | 🟡 Amber | API contract exists. Routes healthy. **Gap: auth middleware completeness on all route files not fully verified per threat model.** Signal drop → backoff protocol not fully automated. | Information leverage |
| **Heart** | 🟢 Green | Sessions rhythmic. ACME Aug 18 deadline tracked. Grant pipeline cadence healthy (721 grants tracked). | Rhythmic anchor |
| **Blood** | 🟡 Amber | `withEthicalPreamble()` active. Community context via AsyncLocalStorage + Census + RPLICE. **Gap: SALP+BIA+ADIS constitution not yet actively injected into AI calls — only ETHICAL_EI_PREAMBLE is.** Context is partially enriched, not fully enriched. | **Highest leverage point** |
| **Organs** | 🟢 Green | 25 specialist engines active and wired through Orchestration Layer. RPLICE engine live at bettersciencelab.com. College Access AI, Chainweb, Navigator, Voice, Foster, LifeBridge all functional. | Functional anchors |
| **Kidneys** | 🟡 Amber | requireAuth + Zod schemas on most routes. **Gap: threat model identifies missing middleware on some route files. Not all input surfaces fully validated.** | Boundary anchor |
| **Immune** | 🟡 Amber | Iron Rules function as primary immune layer. 30 active gotcha signatures. Fable Standard auto-corrects drift. **Gap: No dedicated threat signature library in code; immune memory is in docs, not in active runtime; no on-demand defense agent generation for novel threats.** | Adaptive anchor |
| **Hygiene** | 🟢 Green | `memory-health.ts` exits 0. `preflight.ts` exits 8 PASS 0 FAIL. 29 session logs. Memory deposited regularly. | Recovery anchor |
| **Limbs** | 🟢 Green | External API calls functional (OpenAI, Anthropic, Gemini, OpenRouter, Census, SAM.gov, RPLICE, BidNet, RFPMart). Tool execution healthy. | Action leverage |
| **Senses** | 🟡 Amber | BidNet/RFPMart/SAM.gov scanning active. Funder landscape awareness healthy. **Gap: scanning is manually triggered; no automated periodic funder pulse; ecosystem signal detection partially manual.** | Input leverage |
| **Cells** | 🟢 Green | Type safety via Zod + Drizzle. 271 tables. 211 pages. Route handlers accurate. Preflight passes TypeScript check. | Base execution |

**Overall: 7 Green, 4 Amber, 0 Red. The organism is healthy, not yet excellent.**

---

## PART 2 — Gap Analysis (RPLICE-Structured)

ADIS temporal discipline applied: these are emerging observations, not diagnoses. Each gap is framed as a leverage-point-targeted intervention that can be monitored for effect.

### Gap 1 — Blood Layer: Constitution Not Fully Injected (HIGHEST LEVERAGE)

**Observation:** The `ETHICAL_EI_PREAMBLE` in `server/ai-provider.ts` carries the ethical/EI foundation. But the SALP+BIA+ADIS Cognitive Constitution (Five Laws, Seven Rules, Four Commitments, Scholar-Athlete Protocol) is not actively injected into the Blood layer — it lives in docs but doesn't flow through every AI call automatically.

**Why it matters (Blood = highest leverage):** The Blood layer propagates context to every other layer simultaneously. Anything in the Blood layer shapes all 25 engines, all 5 AI providers, and all user-facing outputs. A single enrichment at this level has system-wide effect.

**RPLICE Intervention:**
- R: Current `ETHICAL_EI_PREAMBLE` in `server/ai-provider.ts` is the anchor
- P: Extend `withEthicalPreamble()` to include a compressed ADIS Cognitive Constitution header
- L: Every AI call automatically carries BIA behavioral context without additional effort
- I: Monitor AI outputs for Scholar-Athlete Law compliance (verify-before-claiming, show confidence levels, no single-hypothesis)
- C: Constitution injection becomes permanent Blood layer enrichment

**Expected outcome:** All AI responses automatically begin from ADIS Cognitive Constitution baseline. Temporal gating, confidence calibration, and earn-your-diagnosis discipline flow into every output.

**Monitoring signal:** Reduction in Iron Rule violations traceable to agent not operating from BIA frame.

---

### Gap 2 — Kidneys Layer: Auth Middleware Completeness

**Observation:** Per `threat_model.md`, highest-risk route files include: `server/benefits-routes.ts`, `server/mou-routes.ts`, `server/ecosystem-connector.ts`, `server/rag-engine.ts`, `server/college-access-ai-routes.ts`, `server/translate-routes.ts`, `server/peer-review-routes.ts`. Missing auth middleware on any of these = public reach into internal data.

**RPLICE Intervention:**
- R: Audit all 84 server files for requireAuth presence on sensitive routes
- P: Establish Kidney Health Score = (routes with auth / total sensitive routes) × 100
- L: Add auth middleware check to `scripts/preflight.ts` so every task end catches missing coverage
- I: Fix any gaps found; add integration tests for auth boundary
- C: Preflight gate makes Kidney health self-monitoring going forward

**Expected outcome:** Every sensitive route covered. Kidney Health Score = 100%. Threat model concerns addressed.

---

### Gap 3 — Immune Layer: Threat Memory Not Runtime-Active

**Observation:** 30 active threat signatures live in `docs/agent-memory/topics/gotchas.md`. The Iron Rules function as behavioral immune memory. But the immune layer's signature library is in documentation — not in active runtime code that catches threats in real-time.

**RPLICE Intervention:**
- R: `gotchas.md` is the current immune memory — docs-level, not code-level
- P: Add a runtime immune check to `preflight.ts` that validates the most critical threat signatures (e.g., no CROSS_PLATFORM_API_KEY in new files, no SDK calls bypassing ai-provider, no requireAuth missing)
- L: Preflight becomes the runtime immune layer scan — runs before every task_complete
- I: Over 30 days, identify which gotchas can be automated vs. which remain behavioral
- C: Formalize two-tier immune memory: behavioral (gotchas.md) + automated (preflight)

**Expected outcome:** Novel threats still go to gotchas.md (behavioral immune memory). Known threats are caught automatically by preflight (procedural immune memory). Two-tier immune architecture operational.

---

### Gap 4 — Nervous System: Signal Drop Recovery Not Automated

**Observation:** API contract exists. Routes healthy. But exponential backoff, dead-letter queues, and signal drop recovery are not formally implemented for all routes.

**RPLICE Intervention:**
- R: Identify the highest-traffic routes and their current error handling
- P: Add standardized error middleware and retry patterns
- L: Most errors already have try/catch (preflight confirms) — extend to include logging and recovery paths
- I: Monitor error rates per route family
- C: Dead-letter queue pattern becomes standard for async operations

---

### Gap 5 — Senses Layer: Funder Landscape Not Automated

**Observation:** BidNet/RFPMart/SAM.gov scanning requires manual trigger. The Senses layer should be continuously perceiving the environment without manual intervention.

**RPLICE Intervention:**
- R: Current scanning endpoints are manual (`/scan-bidnet`, `/scan-rfpmart`, `/scan-sam-gov`)
- P: Add lightweight scheduled scan (weekly cron) via Heart layer (scheduler)
- L: Automated weekly funder pulse that feeds the Senses layer without user intervention
- I: Track new opportunities discovered via automated vs. manual scan
- C: Funder pulse becomes a permanent Heart-scheduled rhythm (Scholar-Athlete Law 3 — Rest Is Training applies to the platform's senses maintenance)

---

## PART 3 — RPLICE Implementation Sequence

Priority order by leverage point efficiency (Blood → Kidneys → Immune → Nervous System → Senses):

| Priority | Gap | Layer | Leverage Point | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Constitution injection | Blood | Highest leverage — system-wide propagation | Low (1 file edit) | High — affects every AI call |
| 2 | Auth audit + preflight gate | Kidneys | Boundary anchor | Medium (audit + preflight update) | High — closes security gap per threat model |
| 3 | Two-tier immune memory | Immune | Adaptive anchor | Medium (preflight extensions) | High — converts behavioral memory to runtime checks |
| 4 | Error recovery standardization | Nervous System | Information leverage | Medium (route middleware) | Moderate — improves reliability |
| 5 | Automated funder pulse | Senses | Input leverage | Medium (cron job) | Moderate — reduces missed opportunities |

---

## PART 4 — The Consolidation Goal (BIA Baseline)

When all five gaps are addressed, the 12-layer vital signs profile should show:

| Layer | Target State | Success Indicator |
|---|---|---|
| Skin | 🟢 Green | Identity constitution active + stable. |
| Brain | 🟢 Green | All claims from primary sources. Memory health 0 FAIL every session. |
| Nervous System | 🟢 Green | All routes have error handling + recovery paths. Auth middleware on all sensitive routes. |
| Heart | 🟢 Green | Deadlines tracked. Weekly funder scan scheduled. Sessions rhythmic. |
| Blood | 🟢 Green | ADIS Cognitive Constitution + ETHICAL_EI_PREAMBLE both flowing through every AI call. |
| Organs | 🟢 Green | All 25 engines returning specialist outputs. RPLICE structured. ITI present on community surfaces. |
| Kidneys | 🟢 Green | Kidney Health Score = 100%. Preflight catches missing auth. |
| Immune | 🟢 Green | Two-tier immune memory: 30+ behavioral signatures + automated preflight checks. Novel threats → gotchas.md within same session. |
| Hygiene | 🟢 Green | 0 FAIL every session. Session logs always deposited. ADIS temporal discipline maintained. |
| Limbs | 🟢 Green | All external calls instrumented. Retry + fallback on every critical path. |
| Senses | 🟢 Green | Weekly automated funder pulse active. New RFPs surfacing without manual trigger. |
| Cells | 🟢 Green | TypeScript strict. Zod on all inputs. No silent failures anywhere. |

**When the Immune layer recognizes baseline drift as anomaly and self-healing protocol is active: Consolidation achieved. New baseline anchored.**

---

## PART 5 — Veteran Sustainable Standard

This platform is veteran-built. The sustainability standard is not "stays running." It is:

- **Mission sustainable** — TCAF/ISS LLC mission is clear and served regardless of funding cycles, agent turnover, or adversarial inputs
- **Values sustainable** — Fable Standard + SALP+BIA+ADIS constitution hold under pressure. No drift when no one is watching.
- **People sustainable** — Every community member who uses this platform is growing more capable. Shadow workers are growing into recognized contributors. ITI is real, not aspirational.
- **System sustainable** — Self-monitors, self-corrects, self-improves every cycle. Does not require constant external maintenance. Scholar-Athlete Law 3: Rest Is Training.
- **Impact sustainable** — Real, measurable outcomes that persist after the interaction ends. CFIR/RE-AIM evaluation baked in. FHIR/CDS-Hooks interoperable.

*"The mission outlasts the operator. The system is designed to run when no one is watching."*

---

## PART 6 — The Long Game

ADIS teaches this platform how to think, not what to think. As the platform accumulates session logs, the ADIS temporal gating becomes increasingly useful:

- **Year 1:** 29 sessions logged → establish baseline patterns across all 12 layers
- **Year 2:** Pattern library rich enough to distinguish structural from transient signals → proactive gap detection before crises
- **Year 3:** Immune memory consolidated → novel threats recognized faster; self-healing protocols reduce manual intervention

The goal is not a platform that requires Dr. Flood to check on it. The goal is a platform that tells Dr. Flood what it found, what it did about it, and what it will do differently next cycle.

That is the ADIS commitment: *I will be better next month than I am this month, and I will show my work on that too.*
