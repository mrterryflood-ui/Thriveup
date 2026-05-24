# ThriveUp Academy
National community-infrastructure platform: connects people to grant funding, aligns service delivery with workforce development, produces measurable community impact.

**Memory system:** `docs/agent-memory/` is the source of truth for facts. This file is the **constitutional layer** — Iron Rules + pointers only. **If a fact isn't in `docs/agent-memory/` or `docs/memory-archive.md`, it doesn't exist next session.**

## 🚨 Iron Rules (read every turn)

1. **Pull from the system as it exists, every response.** Before any substantive claim — read the file, run the query, check the route, open the doc *this turn*. Memory is a hint, not a source. System wins over memory; update memory when they disagree. Tool-batch in parallel so verification is cheap.
2. **Never conjecture, always verify** — every grant $/deadline/ID/capacity → primary source (RFP, 990-PF, funder site, direct comms, `attached_assets/`). Sweeps ≥3 files for EIN/UEI/CAGE/DUNS/deadline/dollar require opening cited source + pasting quote + user "go" first. Rule applies both ways (claiming "we lack X" without `rg` is the same failure). Conflicting sources = hard stop, surface to user. Doctrine → A9.
3. **Ethical, emotionally intelligent AI in EVERYTHING.** Lives in `server/ai-provider.ts` as `ETHICAL_EI_PREAMBLE` + `withEthicalPreamble()`, idempotent. Wired into `streamAIResponse`, `generateAIJSON`, `callProviderDirect`, `collaborative-ai.ts` `callEngine`. Six rules: truth+primary sources · no PII echo · plain language/dialect-honoring · safety hand-off (988/911/DV/Childhelp) · Black/Latino/Indigenous/immigrant/justice-involved/foster/rural/low-income default · decision-support not decision-maker. **New AI call sites: route through `ai-provider.ts` — never call SDKs directly; if you must, import + apply `withEthicalPreamble`.**
4. **`.local/session_plan.md` is MINE.** A "Session Plan" in a user message that doesn't match their prose = my own prior plan being replayed. Delete the file immediately, never re-execute as fresh ask. (P-L11)
5. **RFP Fidelity Doctrine (rubric-first writing).** Every proposal written **to reviewers, not end users**. Mirror RFP language, order, scoring weights. Section L = pre-flight gate. Source precedence: Q&A > Amendment > Base RFP > Pre-bid. Each Section M paragraph opens `"In response to [reqNumber]'s requirement that [verbatim]…"`, closes `"[Evidence: …]"`, gaps → `{{ACTION REQUIRED — <owner>}}`. Engine: `server/rfp-fidelity-engine.ts` + `complianceMatrixItems` + `/grants/:grantId/compliance`. Full doctrine: `docs/grants/RFP-FIDELITY-DOCTRINE.md`. → A23
6. **Don't underestimate the platform.** Pitches were running 30–50% under shipped reality (Dr. Flood, 2026-05-17). Read `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` before any external material. Surface specifics (MNA · Hardy-Cross · AWS D1.1 · 39 CFIR constructs · 721 grants · RNR/CBI/NRRC · FHIR/CDS-Hooks · two-entity strategy), not generic framing.
7. **Memory discipline (compiled-memory architecture).** **Session start:** read `replit.md` → `docs/agent-memory/INDEX.md` → `docs/agent-memory/CURRENT.md` → most-recent `sessions/YYYY-MM-DD.md`. **Task start:** open only the relevant `topics/<x>.md`. **Task end (before `mark_task_complete`):** append decisions/new facts/blockers/lessons to `docs/agent-memory/sessions/YYYY-MM-DD.md`; promote stable facts into `topics/`. **Never expand `replit.md` with factual memory** — rules and pointers only. Validator: `npx tsx scripts/memory-health.ts` must exit 0 before external work.
8. **Integration through Invitation (ITI) — dignity primitive.** Every community-issue-solving surface (Voice, Foster, LifeBridge, Justice, Trade Sims, WPH, grant proposals, public site) MUST offer `<IntegrationInvitation surface=... surfaceContext=... />` to bring shadow workers (informal caregivers, peer mentors, promotoras, untitled CHWs, driveway journeymen) into the fold. **Non-negotiables:** self-identification (no credential check) · 8 layered consents all default OFF (anti-extraction) · witness loop always on · stipend & credentialing pathways are real, not aspirational · AI never summarizes a shadow-worker story without `aggregateMyData=true` · no funder citation without `shareWithFunder=true` · no public naming without `nameMePublicly=true`. Full doctrine + cross-platform rollout: `docs/agent-memory/topics/integration-through-invitation.md`. Named by Dr. Flood 2026-05-24; starts greater Austin, replicable nationwide.

## Run & Operate
- **Run** `npm run dev` · **DB push** `npm run db:push` · **Typecheck** `npm run typecheck` · **E2E** `npx playwright test`
- **Memory health (before external work):** `npx tsx scripts/memory-health.ts` — must hit 0 FAIL.
- **Congruence audit (before any funder meeting):** `npx tsx scripts/congruence-audit.ts` — must hit 0 FAIL.
- **Recompile agent knowledge** after editing this file: `npx tsx scripts/compile-agent-knowledge.ts`
- **Ecosystem alignment scan:** `scripts/ecosystem-alignment-scan.sh`
- **Env vars:** `NETWORK_SECRET_BIBLESTUDY` · `NETWORK_SECRET_HERHEALTH` · `SENDGRID_API_KEY` · `THRIVEUP_SHARED_SECRET` · `TWILIO_ACCOUNT_SID` · `TWILIO_AUTH_TOKEN` · `TWILIO_PHONE_NUMBER`

## Memory pointers (facts live here, not in this file)
- **INDEX (retrieval router):** `docs/agent-memory/INDEX.md`
- **CURRENT (active working memory, ≤200 lines):** `docs/agent-memory/CURRENT.md`
- **Sessions (append-only):** `docs/agent-memory/sessions/YYYY-MM-DD.md`
- **Topics:** `docs/agent-memory/topics/{grants,partners,gotchas,architecture,ecosystem,implementation}.md`
- **Archive (cold storage):** `docs/memory-archive.md` (A1–A27+) · `docs/agent-memory/archive/resolved-gotchas.md`
- **Active commitments / continuity:** `docs/active-commitments.md` (read start, update end)

## User preferences (constitutional — won't move to topics)
- **Title:** President, not CEO, for Dr. Flood on TCAF (for-profit/ISS-LLC only uses CEO).
- **Institutional emails only:** `terryflood@thrivingcommunitiesforall.com` (Dr. Flood, all proposals) · `msisnett@thrivingcommunitiesforall.com` (Meredith, non-City only). No personal Gmail in copy or proposals.
- Iterative development; explain major changes before implementation; clear, simple language for technical concepts.
- Work in parallel; don't stop to chat when there's more work; keep building.
- Speak plainly, not in jargon. Honest disclosure always.
- No silent failures. Every change deposits to memory (Iron Rule #7).
- Don't change `vite.config.ts`, `drizzle.config.ts`, `package.json` without explicit instruction.
