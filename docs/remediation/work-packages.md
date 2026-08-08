# Total Platform Remediation — Work Packages (execution detail)
**Companion to `total-platform-remediation-plan-2026-08.md` · August 8, 2026**
**Doctrine: every WP runs BUILD+VERIFY interleaved (Double Helix); architect review before its phase gate (Iron Rule 19); anti-fabrication prohibitions apply to every metric and claim touched.**

Legend: each work package (WP) = one agent-sized task. `⇄` = existing queued task absorbed.

---

## PHASE 1 — Foundation (3 WPs, fully parallel)

### WP-1A Idempotent seeding
- Convert to natural-key upserts: `server/seed-ai.ts`, `server/seed-workforce-lessons.ts`, `server/seed-comprehensive.ts`, `scripts/seed-trade-sims-{electrical,plumbing,hvac,welding,automotive}.ts`, `scripts/seed-proposal-pipeline.ts`.
- Natural keys: module slug + lesson order; trade slug + day; question text hash for quiz items.
- Must never overwrite user data (progress/attempts reference by id — verify id stability across reseed).
- **Accept:** scratch-DB double-seed → identical counts, zero constraint errors; reseed on live copy preserves all user progress rows.
- **Verify:** `scripts/verify-seed-idempotency.ts` added as a permanent validation step.

### WP-1B Constraints, cascades, transactions, indexes
- Unique constraints (after backfill dedupe): lesson completion (userId, lessonId), badges (userId, badgeId), quiz mastery points (one award per userId+quizId), classroom membership, reactions.
- FK audit on user-identity columns flagged in audit (`shared/schema.ts:94,185-186,195,202,211-214`); deliberate cascade/restrict on participant→snapshots/referrals/entitlements.
- Wrap compound writes in `db.transaction` (sweep `server/storage.ts` multi-step methods; representative: :1884-1894).
- Indexes on hot paths: progress lookups, dashboard aggregates, trade-sim progress by session/user.
- **Accept:** dedupe migration report (rows merged); constraint-violation tests fail closed; `npm run db:push` clean.
- **Verify:** double-tap simulation test (2 concurrent completion POSTs → 1 row).

### WP-1C Orphan-table disposition
- For each: `courseLessonProgress, coalitionActionItems, coalitionCapacityAssessments, communityActionPlans, costMatchRecords, dfcStakeholderSurveys, communityReadinessInterviews, campaignContent, campaignMetrics, dfcReadinessItems, dfcWizardState, benefitsEnrollmentLog, platformFunderFit, tradeSimsCredentialPathways` — decide wire-or-drop with user-visible rationale in the PR description. `tradeSimsCredentialPathways` is NOT dropped (needed by credential work ⇄ #98).
- **Accept:** zero tables in schema with no reader and no writer; decision log in `docs/remediation/orphan-decisions.md`.

**PHASE GATE 1:** WP-1A/1B/1C verified + architect review; unblocks reseed (⇄ #48).

---

## PHASE 2 — Server truth (5 WPs; 2A∥2B∥2C∥2D, 2E after 2C)

### WP-2A Authorization sweep
- Auth + ownership on Chainweb scenario mutations (`server/chainweb-routes.ts:129-226`), conductor POSTs (`server/conductor-routes.ts:920-1550` — decide public-with-rate-limit vs staff per endpoint, document choice), `requireAdminKey` → DB-role check (`server/partner-api-routes.ts:108-114`), intake object-ownership verification (`server/foster-youth-intake-routes.ts:397-456`), implement advertised daily rate limit (`chainweb-routes.ts:58-80`).
- **Verify:** hostile-probe script `scripts/security-probes.ts` (unauthed mutation attempts, cross-tenant reads) → all 401/403; wire into the youth-records security check runner (⇄ #89).

### WP-2B Metric truth pass
- Fix: resolution rate excludes `in_service`/`enrolled` (`server/yhsi-routes.ts:200-203`); "offered" = offered only (`:789-812`); outcomes consistent known-only denominators + snapshot dedupe per participant (`:633-674`); CES queue/summary reconciliation (`server/yhsi-system-routes.ts:76-115`); fidelity numeric coercion (`client yhsi-ops.tsx:708`); YAB YTD timezone; quiz 70/80 contradiction (pick one threshold, state it everywhere).
- Every metric gets a unit test locking its denominator; every dashboard label reviewed against what it counts.
- **Verify:** metric test suite; before/after numbers documented for the director.

### WP-2C AI output contract
- Zod schemas for every stored AI JSON (intake plan first: `foster-youth-intake-routes.ts:215-275`); reject+retry once on invalid, then honest failure state (never store `_parseError` raw text).
- Preamble enforcement: fix `server/peer-review-routes.ts:409`, `server/routes.ts:4938`, `server/facilitator-routes.ts:158`, `server/program-management-routes.ts:396`; add CI grep validation step forbidding unwrapped `generateAIResponse|generateAIJSON`.
- Injection delimiters around all user/document text in prompts; message length caps (Navigator `navigator-routes.ts:647-653`); rate limit CEDS align (`ceds-routes.ts:168-213`); no raw model errors/provider names to end users (`intake.tsx:429-432`, `:468-502` server).
- ⇄ #55 (model upgrade) rides along: single model-constants module, probe-on-boot.
- **Verify:** injection payload corpus test; preamble grep = 0 violations.

### WP-2D Export & report integrity
- HMIS export: mandatory consent filter, rotating export IDs (never HMIS PersonalID), `includeNames` explicit confirm + audit log (`yhsi-routes.ts:499-524`).
- HUD report: draft watermark until required-section checklist complete (objectives/accomplishments/barriers/beneficiaries/data quality); Finalize blocked on placeholder narrative (`yhsi-routes.ts:546-575`); duplicate-period guard; timezone-safe period dates (`:538-543`); Finalize = confirm + immutable lock.
- ⇄ #82 (real-staff PDF download test) is this WP's verification.
- **Verify:** export snapshot tests (no PII leak fields); report cannot finalize with placeholders (e2e, forged staff session).

### WP-2E Server-verified learning (after 2C)
- Strip `correctAnswer`/`explanation` from quiz GET (`server/routes.ts:799-802`); validate submitted answer keys against the question set (`:811-826`); points idempotent per quiz (with WP-1B constraint).
- Trade-sim progress: server validates completion payload against lesson rubric state; reject client-asserted completion. ⇄ #47/#65/#67/#68/#71/#49 absorbed here (rubric extension + tests).
- **Verify:** devtools-mining probe finds no answers; forged-completion POST rejected.

**PHASE GATE 2:** security probes + metric suite + injection corpus green; architect review.

---

## PHASE 3 — Resilience (4 WPs; 3A first, 3B∥3C∥3D after)

### WP-3A Global error contract (foundation for the sweep)
- `queryClient.ts:17-87`: 401 → session-expired state + return-to path; 5xx → retryable error state; distinguish from true empty. Shared `<QueryStateGate>` component (loading/error/empty/data).
- Mechanical sweep: every dashboard query gets error branch; every mutation gets onError (worst offenders first: quiz submit, lesson complete, all yhsi-ops tabs, intake saves).
- Error boundary: move providers inside; fix reload-loop (`error-boundary.tsx:54-112`); real retry (invalidate queries).
- **Verify:** kill-API e2e — every major page shows actionable error, never fake-empty.

### WP-3B Youth journey survival
- Intake: server-restored state on token return (step, form, uploads, analysis — `intake.tsx:100-116` + GET expansion); upload chain rebuilt (doc-ID enum unified, stale-token race `intake.tsx:163-203`, type/size validation, progress/retry, server-listed uploads); OCR PDFs/images or on-screen honesty about what's readable; empty-plan state; plain-language handoff labels.
- Eligibility checker: stale `careAfter14` reset (`youth-rights.tsx:184-264`); zero-result explanation + next action; age range corrected.
- **Verify:** throttled-connection e2e with mid-flow refresh → zero loss (forged-session pattern).

### WP-3C Learner survival
- Quiz server-side attempt draft (survive refresh); anonymous→account merge for trade-sim + academy progress at signup; lesson/activity completion persisted server-side (PromptLab et al.); unsaved-work guard on multi-step flows; streaming truncation flagged with resume (proposal-command `:186-218`); degraded-mode labels on tutor/translation fallbacks.
- **Verify:** network-drop mid-quiz e2e; merge test (anon progress → signup → visible).

### WP-3D Destructive-action + staff drafts
- Confirm+undo on deletes (milestones `yhsi-ops.tsx:742-793` first); staff form drafts survive tab switch/refresh; referral status transitions constrained + audit rationale; touchpoint UI added or promise removed (`yhsi-ops.tsx:111`).
- **Verify:** e2e delete/undo; transition matrix test.

**PHASE GATE 3:** journey e2e suite green under throttle/refresh/expiry; architect review.

---

## PHASE 4 — Honesty & reach (5 WPs; all parallel; ⇄ #96/#97/#98/#43/#42/#66 live here)

### WP-4A Claims reconciliation
- `shared/canonical-claims.ts` — single source for every public statistic; landing/partner API/trade-sim copy rewritten to provable statements (languages, platforms w/ live health timestamps, lesson counts from DB, WCAG badge removed until 4D artifact exists, ETV/Chafee ages single-sourced vs `youth-rights.tsx:117-130` / intake prompt drift, "15 lessons" hard-code `trade-sims/index.tsx:117-119`).
- **Verify:** claims-vs-code checklist signed off in verification log; grep for retired claims = 0.

### WP-4B Curriculum accuracy ⇄ #96, units ⇄ #43, canvas UX ⇄ #42/#66 (already queued — coordinate, don't duplicate)

### WP-4C i18n + mobile
- Shell through `t()` (bottom-tab-bar, App shell, error/empty states); visible "showing English" notice on translation failure (`i18n.tsx:100-125`); Navigator responsive widths (`ai-navigator.tsx:1220-1227`); bottom-nav safe-area (`bottom-tab-bar.tsx:82-109`); touch-target pass on youth forms.
- **Verify:** Spanish end-to-end youth journey e2e; 360px-wide screenshot sweep.

### WP-4D Accessibility audit
- Automated (axe) + manual keyboard pass on top-10 pages; fix findings; publish `docs/accessibility-audit-2026.md`; only then restore any badge.

### WP-4E Outcomes & credential layer ⇄ #97 (adaptive growth), #98 (credential/transcript — running)
- Adds: referral completion tracking; suppression-first funnel dashboard (intake→plan→referral→completion→credential); verifiable public certificate URLs.
- **Verify:** funnel numbers reconcile to source tables; cert URL check as anonymous visitor.

**PHASE GATE 4:** SME/funder/Spanish-speaker walkthrough scripts pass; architect review.

---

## PHASE 5 — Permanence (1 WP)

### WP-5A Verification infrastructure + re-audit
- Register permanent validation steps: seed idempotency, security probes, metric suite, preamble grep, injection corpus, journey e2e.
- Re-run the identical 6-domain adversarial audit; exit only when no component <7/10; publish scorecard to `docs/remediation/final-scorecard.md`.
- Write the five disciplines into `.agents/skills/platform-engineering/SKILL.md`; update memory + verification log.

---

## Execution ledger

| Phase | WPs | Parallel? | Absorbs | Gate |
|---|---|---|---|---|
| 1 | 1A 1B 1C | all ∥ | unblocks #48 | double-seed proof |
| 2 | 2A 2B 2C 2D 2E | 2E after 2C | #47 #49 #55 #65 #67 #68 #71 #82 #89 | hostile probes green |
| 3 | 3A → 3B 3C 3D | 3A first | #93 (chat tone e2e rides 3A contract) | journey e2e green |
| 4 | 4A–4E | all ∥ | #96 #97 #98 #42 #43 #66 | walkthroughs pass |
| 5 | 5A | — | — | re-audit ≥7/10 all |

Total: 18 WPs, 6 of which are already queued/running tasks. Order of execution when built directly by main agent: 1A→1B→1C, then phase order with WP order as listed.
