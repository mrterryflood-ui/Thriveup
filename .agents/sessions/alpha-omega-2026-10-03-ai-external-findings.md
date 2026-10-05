# Alpha — external AI oversight findings

## Requested end-state
Address the supplied cross-platform AI honesty-layer handoff without fabricating source, evaluation results, or weakening binding safety controls.

## Observed evidence and hypotheses
1. Existing closed-form numeric grounding may already cover part of the proposed mechanism: server/ai-claim-grounding.ts mechanically removes unsupported numeric claims on wired statistic surfaces.
2. The proposed honesty verdict is distinct from enforcement: it can supplement mandatory grounding, but cannot replace safety gates with non-blocking annotations.
3. The cited secondary entry point may be inactive: registerChatRoutes has a definition/export, but a repository search found no registration call. Active consumers must be traced before integration.

server/ai-provider.ts returns strings for generateAIResponse and callback streams for streamAIResponse. Changing either default contract would affect many consumers. Any optional facts/verdict extension must preserve those contracts and propagate the verdict through active server/UI response paths.

## Authority and boundaries
- No change to credentials or existing provider availability/fallback/deadline policy.
- ThriveUp-specific money, percentage, count and FTE vocabulary and community/grants/foster-youth golden cases; do not reuse unrelated hazard/defense fixtures.
- Supplied model scores 0.94/0.88 have no attached evaluation provenance; they must not be labeled measured ThriveUp performance.
- Caller-provided facts must not be promoted to independently retrieved evidence.
- Mechanical numeric checks cannot certify arbitrary prose, causality or real-world truth.

## Source reconciliation and implementation plan
The initial handoff lacked source and its Perplexity task link is private. The user subsequently uploaded inference-honesty.ts and its four self-checks. Those are now the authoritative integration source, retained unchanged under attached_assets. GitHub connector read-only repository metadata returned mrterryflood-ui/Thriveup, main; no pull/push.

Plan: adapt the supplied dependency-free mechanism under shared with ThriveUp vocabulary, comma/scaled prefix currency, fail-closed verdicts (not delivery), and sentence-local forecast labels. Preserve the primary provider's existing string and callback contracts; add an optional callback/envelope. Attach verdicts after binding grounding in all three Navigator delivery paths; render a limited-scope per-message disclosure in both UI layouts. Keep unavailable pricing and unmeasured model scores null. Run sourced benefit fixtures through two configured models, attributing only complete non-fallback results. Existing grounding remains authoritative for bare-number and statistic-domain rules.

Source-pinned fixture evidence: official USDA SNAP Eligibility page redirected to fna.usda.gov, updated 2026-10-01 and opened 2026-10-03. It states an Oct 2026–Sept 2027 one-person maximum of $306 for contiguous states/DC and a 20% earned-income deduction. The $3,672 annual illustration is 12 × $306, explicitly conditional/projected, not an observed award or eligibility determination. This is a narrow benefits evaluation set, not whole-platform validation.

Acceptance: zero-error TypeScript, deterministic domain tests, existing grounding/preamble gates, isolated six-domain review, one mock-SSE UI confirmation, production bundle build and workflow startup. Verdict failure never suppresses answer delivery; missing evidence never produces a successful verdict; subject/place/time and source authority are not mechanically certified by this advisory layer.

## Omega
### Before
The uploaded detector only recognized suffix units; prefix money, comma counts, missing evidence, local prediction labels, and unknown pricing needed bounded adaptation. Its two scores were external HazardAware results, not ThriveUp measurements. An inactive chat module was not a valid integration target.

### Changed / Why
- Dependency-free shared kernel retained the supplied public mechanisms. Added USD prefix/suffix/scaled/comma/signed forms, ThriveUp units and singular/plural/hyphenated duration normalization.
- Safe advisory verdicts distinguish checked/not-evaluated/unavailable, validate contradictions, bound evidence/output, and explicitly disclaim bare numbers, subject/geography/time alignment, source authority, prose and causality. Failure never withdraws an answer on its own.
- Existing generateAIResponse string and streaming content contracts remain; optional receipt/provider callbacks and an additive envelope were added. Successful output is committed before flushing, consumer failures cannot invoke fallback, asynchronous receipt rejections are observed, and onDone promise failure is handled.
- Primary Navigator and both fallbacks compute receipts AFTER binding grounding. New replies persist content+receipt together in existing metadata JSONB; history validates restored receipts and marks legacy absence. Conversation loading cancels the replaced stream. Both UI layouts display receipts, including empty-output failures.
- Prices/unknown costs remain null; provider availability means configured, not proven healthy. The existing provider-info endpoint exposes only validated, dated, complete same-provider/model measurements. Fixture fingerprint and method identity prevent stale/foreign adoption. Routing remains the existing availability/deadline/fallback policy; the new routePolicy is advisory.
- Scoring requires literal numeric fact coverage in addition to no-override, URL recall and forecast labels; empty or citation-only non-answers cannot score as complete numeric answers.

### Proof
- Original upload: 4 unmodified self-checks passed from an isolated temporary directory.
- Adapted kernel + mocked SDK transport: **15 tests passed, zero failures/skips**. Includes currency/count/FTE drift, missing evidence, local labels, malformed verdicts, omission coverage, callback failure without fallback, and advisory cap without truncating delivered text. SDK tests make no model/network calls.
- Final TypeScript validation: **zero errors**. Frontend lint: zero warnings. Production bundle build passed; two inherited import.meta/CJS warnings remain in unrelated PDF modules.
- Existing ethical-preamble and claim-grounding gates passed. Grounding gate was made resilient to typed callback parameters/additive fields; enforcement itself was not weakened.
- Six scoped read-only auditors completed. Findings were fixed and their final/delta reviews are CLEAN. No unsolicited architect review.
- One focused browser pass on desktop and 390px phone succeeded: nonblocking failed/unevaluated receipts; malformed receipt rejection; restored/legacy history; floating UI; delayed old response/history supersession. Chat/auth/history APIs were mocked: this proves client behavior, NOT a real authenticated persistence or model-generation round-trip. Screenshot IDs: ji72ab, j7yyoc, myylnf, yvi0mw, g9873x, r6ih4d.
- Development workflow restarted and serves requests. GET /api/ai-provider via development proxy returned dated Sonar measurement and null for unscored models. Public /navigator screenshot saved at screenshots/inference-honesty-navigator.jpg.
- Read-only PostgreSQL proof confirmed the existing navigator_messages.metadata JSONB column and an unchanged receipt through PostgreSQL JSONB serialization/deserialization. No row writes or schema changes; this is not a substitute for an authenticated write-route replay.
- Live evaluation: six requested fixtures across two configured providers. Sonar Pro served all three benefits cases. The final mechanical score is **1.0000 / 3 cases**, after fixing a false drift between “12-month” and “12 months.” Stored model outputs were re-scored, not regenerated. GPT-5 Nano served two cases; one fell back to Claude, so Nano's aggregate remains null. No HazardAware scores adopted. Report: .verification/inference-honesty-live-evaluation.json; original generatedAt and responses retained, rescoredAt and method recorded.

### Limits
This is a three-case source-pinned community-benefits pilot, NOT broad model quality, truth probability, causal verification, eligibility determination or participant outcomes. URL recall is lexical, not authority checking. Token usage/pricing unavailable; costs null. Browser history proof is mocked, not an actual database write-route replay. Startup logs still include unrelated upstream DNS/timeouts and inherited build warnings; no honesty-path crash observed. No publishing, repository pull/push, credentials changes or external-service mutations were initiated for this request.