# Total Platform Remediation — Backwards Plan
**ThriveUp · TCAF/ISS LLC · Drafted August 8, 2026**
**Basis: two-round adversarial audit (10 auditor passes, file:line evidence throughout)**

---

## 0. The End State (plan backwards from here)

**Launch condition — every statement below must be TRUE and PROVABLE before stakeholders arrive:**

| Stakeholder | "Seen, heard, understood — no gaps" means |
|---|---|
| **Youth (17–24, phone, stressed)** | Every flow survives refresh/back/bad connectivity; every upload works or says why not; every plan they're promised is actually generated from their real documents; returning with their token restores everything; no dead ends — every right/eligibility result leads to a concrete next action |
| **Adult learner / jobseeker** | Progress can't be lost (anonymous work merges on signup); completion means demonstrated skill (server-verified, not client-asserted); finishing produces a credential an employer can verify at a public URL |
| **Case manager / program director** | Every number on every dashboard has a correct denominator and an honest label; outage never masquerades as zero; exports respect consent and real de-identification; HUD reports contain what HUD requires or say plainly they are drafts |
| **Funder / federal reviewer** | Every public claim matches the code (languages, platforms, accessibility, lesson counts); every metric traces to source with vintage; AI outputs are schema-validated, cited, and never silently degraded; security holds under hostile probing |
| **Partner org** | API contracts validated, versioned, idempotent; scoped keys; failures visible, never silent |
| **Non-English speaker** | The shell itself (nav, buttons, errors) is translated; translation failure is visible, not silent English |
| **Person with disability** | Audited accessibility with a published artifact, not a badge |

**Definition of done for the whole campaign:** an adversarial audit identical to the one that produced this plan re-runs and no component scores below 7/10.

---

## 1. Backwards dependency logic

Working backwards from the end state:

- Provable trust (end) ← requires **re-auditable verification infrastructure** ← requires **honest metrics & claims** ← requires **resilient UX** ← requires **secure, untrusted-client server core** ← requires **sound data layer** (nothing above survives broken seeds/duplicate rows)
- Therefore the build order is the REVERSE: **data soundness → server truth → resilience → honesty/reach → verification & re-audit.**
- Existing queued tasks (#96–98 trades, #43 units, #47/48/49, #55, #65–68, #71, #82, #89, #93, #42, #66) slot into these phases rather than running as a separate stream.

---

## Phase 1 — Foundation: the data layer cannot lie (gate for everything)

> If seeds duplicate, completions double-count, and child rows strand, every later fix is built on sand.

1.1 Idempotent seeding: convert all plain-insert seeds (seed-ai, seed-workforce-lessons, seed-comprehensive, all five trade-sim seeders) to true upserts keyed on stable natural keys. *(Unblocks #48 reseed and #96 content fixes.)*
1.2 Uniqueness + idempotency constraints: completed lessons, badges, quiz-mastery point awards, classroom membership, reactions — one row per (user, thing). Backfill-dedupe existing data first.
1.3 FK/cascade audit: add missing FKs on user-identity columns; define cascade/restrict deliberately for participant → snapshots/referrals/entitlements chains.
1.4 Transactions around every compound write (create-parent-plus-children paths in storage.ts).
1.5 Indexes on hot FK/filter paths (progress lookups, dashboard aggregations).
1.6 Orphan-table disposition: for each of the ~14 orphaned tables — wire it, or delete it with a migration note. No zombie schema.

**Gate 1:** re-seed on a scratch DB twice → identical row counts; constraint violations impossible by test.

## Phase 2 — Server truth: never trust the client, never fake a number

2.1 Server-side completion verification: trade-sim progress payloads validated against real sim state; quiz GET payloads stripped of correctAnswer/explanation; grading server-side only. *(Integrates #47, #65, #67, #68, #71, #49.)*
2.2 Authorization sweep: auth on all Chainweb scenario mutations + conductor POSTs; `requireAdminKey` → DB-role check; ownership checks on intake object registration; implement the advertised daily rate limits.
2.3 Metric truth pass (every dashboard number): resolution rate excludes active states; "offered" counts only offered; outcomes use consistent known-only denominators + dedupe snapshots per youth; CES queue/summary reconciled; fidelity averages numerically safe.
2.4 HMIS export: consent filter mandatory, real de-identification (rotating export IDs, never HMIS ID), `includeNames` requires explicit confirmation + audit log.
2.5 HUD report honesty: label AI narrative drafts as drafts; block Finalize on placeholder content; add required-section checklist (objectives, accomplishments, barriers, beneficiaries, data quality); duplicate-period guard; timezone-safe dates. *(Integrates #82.)*
2.6 AI output contract: Zod-validate every AI JSON before storage (intake plan first); ESLint rule or CI grep forbidding `generateAIResponse`/`generateAIJSON` without `withEthicalPreamble` — fix the four known violators; per-surface rate limits (CEDS align, Navigator message length); prompt-injection delimiters around all user/document text; no raw model errors or provider names to end users. *(Integrates #55 model upgrade, #89 security regression check.)*

**Gate 2:** hostile-probe test suite (forged progress, devtools answer mining, unauthed mutations, injection payloads in intake docs) passes; metric unit tests lock denominators.

## Phase 3 — Resilience: no dead ends for a stressed human

3.1 Global error contract: queryClient distinguishes 401 (→ session-expired UI with return-to-where-I-was) from 5xx (→ "something broke, retry" with support path) from empty (→ true zero-data message). Every dashboard query gets an error branch; every mutation gets onError. One shared pattern, swept mechanically across ~50 surfaces.
3.2 Refresh/back survival: intake wizard (step + form + uploads + analysis restored from server on token), quiz attempts (server-side draft), lesson progress, proposal command profile (server-persisted). Unsaved-work guard on multi-step flows.
3.3 Intake upload chain rebuilt: doc-ID enum unified client/server; token race fixed; type/size validation; progress/retry/cancel; uploads listed from server truth; PDF/image OCR or an honest on-screen "we can't read this file type yet."
3.4 Anonymous → account merge for trade-sim and academy progress at signup.
3.5 Eligibility checker: stale-state reset on status change; "nothing matched, here's why and who to call" state; every result carries a next action (agency contact, intake CTA).
3.6 AI streaming integrity: truncated streams flagged, resume/retry offered; tutor/translation fallbacks visibly labeled as degraded.
3.7 Destructive-action discipline: confirmation + undo window on all deletes (milestones first).

**Gate 3:** scripted journey tests (Playwright + forged sessions): youth completes intake on a throttled connection with a mid-flow refresh; learner passes a quiz with a network drop; staffer's session expires mid-report — all recover with zero data loss.

## Phase 4 — Honesty & reach: claims match code, everyone can use it

4.1 Claims reconciliation: single shared constants module for every public statistic; landing/partner API copy rewritten to provable statements (languages: "English & Spanish verified, AI-assisted in others — see live coverage"; platforms: live health timestamps or provable count; lesson counts from DB; WCAG badge removed until audit exists). ETV/Chafee ages from one source of truth across all surfaces.
4.2 Curriculum accuracy: the six-trade content fixes + on-screen simplified-model caveats. *(= #96; #43 trade-native units; #42/#66 canvas UX.)*
4.3 i18n of the shell: bottom nav, headers, error messages, empty states through `t()`; translation API failures surface a "showing English" notice.
4.4 Mobile: Navigator panel responsive widths; bottom-nav safe-area; touch-target pass on youth-facing forms; trade-sim canvas verified on phones. *(Feeds #98's mobile check.)*
4.5 Accessibility: run a real automated + manual audit on the top-10 traffic pages, fix findings, publish the artifact.
4.6 Credential & outcomes layer: certificates with verifiable public URLs + skills transcripts (*= #98*); adaptive mastery progression (*= #97*); referral completion tracking; one suppression-first outcomes funnel dashboard (intake → plan → referral → completion → credential).
4.7 SEO/meta/structured data + "where this number comes from" methodology pages.

**Gate 4:** an outside SME reads any curriculum page without wincing; a funder clicks any stat and reaches its source; a Spanish speaker completes the youth journey without hitting English.

## Phase 5 — Verification & permanence: trust that re-proves itself

5.1 Regression suites locked into CI-style validation steps: youth-records security check (*= #93/#89*), metric denominators, auth probes, seed idempotency, preamble coverage.
5.2 Re-run the full adversarial audit (same 6 domains). Exit criterion: no component below 7/10; publish scores.
5.3 Verification log + memory updated; doctrine skills amended with the five disciplines so future work can't regress:
  1. Every query has an error branch; every mutation has onError.
  2. The server never trusts the client.
  3. Every displayed number has a correct denominator and honest label.
  4. Every multi-step flow survives refresh/back/expiry.
  5. Every AI output is schema-validated, preamble-wrapped, and fails loudly.

---

## Sequencing, parallelism, integration

- Phases gate in order (1→2→3→4→5), but **within** each phase the work splits into 3–5 independent tracks safe for parallel task agents (e.g., Phase 2: auth sweep ∥ metric truth ∥ AI contract — different files).
- In-flight tasks: #98 (running), #96/#97 (queued) live in Phase 4 — their agents' merges land before Phase 4 verification. Phase 1.1 must land **before** any reseed (#48).
- Every phase ends with its gate run by the testing agent + an architect review; no phase starts on a failed gate.
- Estimated shape: 5 phases ≈ 14–18 task-agent tasks total, most parallelizable within a phase.
