# Proposal Studio v2 — Planning Doc

**Status:** DRAFT v1 · 2026-05-27 · in active scoping with Dr. Flood (Priority #2 — Wellcome bid is Priority #1)
**Source ask:** Dr. Flood's 9-layer "ultimate" table (saved verbatim in `2026-05-27.md` session log) + "external version so external people have the same products there."
**Iron Rules in force:** #2 (verify-not-conjecture), #5 (RFP Fidelity Doctrine), #6 (don't underestimate the platform), #10 (look-first), #11 (verify-then-claim).

---

## Honest current-state read (verified 2026-05-27, look-first per Iron Rule #10)

Dr. Flood's table understated current state on **6 of 9 layers**. Real receipts:

| # | Layer | Dr. Flood's table said | Codebase reality (verified) |
|---|---|---|---|
| L1 | RFP ingestion | "Manual paste / file-by-file" | ✅ Partial — `server/rfp-fidelity-engine.ts`, `server/rfp-rubric.ts`, `server/rfp-fidelity-routes.ts` exist. PDF auto-parse to Section L/M structure NOT yet verified; assume gap until proven. |
| L2 | Compliance matrix (Iron Rule #5) | "`complianceMatrixItems` table + `/grants/:grantId/compliance`" | ✅ Both real — `shared/schema.ts:5679` has `complianceMatrixItems` table; `server/grant-routes.ts:939` exposes `/grants/${grant.id}/compliance`. Pages: `client/src/pages/rfp-fidelity-index.tsx` + `rfp-fidelity-page.tsx`. UCD reviewer-view simulator = real gap. |
| L3 | Gap identification / mitigation | "Manual `{{ACTION REQUIRED}}` flagging" | ⚠️ "ACTION REQUIRED" string is referenced across 10 files (`rfp-fidelity-engine.ts`, `grant-routes.ts`, `proposal-command.tsx`, etc.) but no dedicated gap-closure workflow surface (no assignment to partner org, no deadline tracking, no document-request workflow). **Real gap.** |
| L4 | Collaborative authoring | "Single-user MD files" | ⚠️ Multi-tenant scaffolding partially present (`communityPartnerOrgs` table; `orgId` foreign-keys on partner-org records) but NO Prime/Sub workspace separation, NO per-Sub login tenants, NO role-based section ownership, NO redline/comment/sign-off surface. **Real gap.** |
| L5 | Evidence binding to RPLICE | "RPLICE manually queried" | ✅ `server/ecosystem-rplice-bridge.ts` + `server/rplice-tools.ts` (existing, multi-endpoint integration). Frontend page `client/src/pages/rplice-tools.tsx`. `scripts/congruence-audit.ts` mandated as pre-submit gate (per `replit.md` Run & Operate). Inline evidence-binding on every claim = real gap. |
| L6 | Voice / ethical AI | "`ETHICAL_EI_PREAMBLE` in `server/ai-provider.ts`" | ✅ Confirmed — `ETHICAL_EI_PREAMBLE` + `withEthicalPreamble()` idempotent, wired into `streamAIResponse`, `generateAIJSON`, `callProviderDirect`, `collaborative-ai.ts.callEngine` (Iron Rule #3). Section-by-section authoring assistant with RFP verbatim-mirroring + Five-Lens enforcement = real gap. |
| L7 | Win/loss learning | "`won-proposals` table" | ✅ `wonProposals` table at `shared/schema.ts:5620`; `server/won-proposals-routes.ts` + `server/won-proposals.ts` + `client/src/pages/won-proposals.tsx`. RPLICE training loop on score-vs-award delta + Section M strategy recommendations = real gap. |
| L8 | Scale-out | "Single-tenant" | ⚠️ Same as L4 — partial multi-org primitive on the partner-org side, no Prime/Sub workspace separation, no per-org RPLICE corpus, no tenant-isolated grant pipelines. **Real gap, and biggest decision point.** |
| L9 | Export | "pandoc to docx (just demonstrated)" | ✅ `scripts/md-to-docx.mjs` real; Sedgwick `compliance-crosswalk.docx` + `vitality-proposal-v3.docx` + `pre-submission-checklist.docx` shipped. PDF / Submittable-mapped / Grants.gov XML / ZoomGrants form-mapping = real gap. |

**Bottom line on internal current state:** L2 + L5 + L6 + L7 + L9 ship today. L1 + L3 + L4 + L8 have partial scaffolding. **The proposal-studio surface is already 5-of-9 layers live, not 1-of-9 as the table implied.**

Existing pages in this category (16 of them — Iron Rule #6 don't-underestimate exhibit):
`grant-hub.tsx · grant-applications.tsx · grant-command-center.tsx · grant-narrative.tsx · grant-packages.tsx · grant-prior-awards.tsx · healthcare-grants.tsx · my-grants.tsx · proposal-command.tsx · proposal-pipeline.tsx · rfp-fidelity-index.tsx · rfp-fidelity-page.tsx · rfp-writer.tsx · rplice-tools.tsx · sedgwick-vitality-proposal.tsx · won-proposals.tsx · directive-compliance.tsx`

Existing server modules: `rfp-fidelity-engine.ts · rfp-fidelity-routes.ts · rfp-rubric.ts · grant-routes.ts · grant-narrative-routes.ts · won-proposals-routes.ts · won-proposals.ts · rplice-tools.ts · ecosystem-rplice-bridge.ts · ecosystem-connector.ts · ecosystem-capacity-routes.ts · seed-proposal-pipeline.ts`

---

## The architectural decision (your call — I'll execute either way)

You said: *"external version so external people have the same products there… full scale map up for us internally to improve, but also create the same thing externally."*

Three architectures answer that ask. Each has a real trade. I'm not picking for you — naming the choice cleanly so you can.

### Option A — **One codebase, multi-tenant from the inside out**

Add a `tenants` (or `workspaces`) primitive to `shared/schema.ts`; foreign-key it onto every grant, complianceMatrixItem, proposal, RPLICE-binding, partner-org. TCAF becomes "Tenant #1." External users sign up at, e.g., `bid.thecollaberativeadvocate.com` and provision their own tenant with their own RPLICE corpus subscription.

**Pros:** One codebase to maintain · improvements you make for TCAF instantly benefit external users · win/loss learning aggregates across all tenants (huge moat) · RPLICE training loop gets exponentially better data · no fork drift.

**Cons:** Multi-tenancy retrofitted onto an existing schema is genuinely hard work (cascade ownership, row-level security, billing, per-tenant rate-limiting on paid AI calls — directly hits the DoS section of `threat_model.md`) · TCAF's internal pipeline becomes a tenant inside its own platform, which adds friction · single-tenant breach blast-radius is huge (any auth bug exposes every external customer's pursuit pipeline).

### Option B — **Fork — separate codebase for external "Bid Studio"**

Spin up a sibling Repl (or a separate workspace), copy the proposal-related modules, harden them as a clean multi-tenant product, market separately. ThriveUp stays single-tenant internal.

**Pros:** TCAF internal surface stays uncomplicated · external product can have its own UX without TCAF-specific jargon (no "Iron Rules", no "five-lens thinking" labels on the external UI) · faster to ship a clean external MVP · external security failures don't touch TCAF participant/grant data.

**Cons:** Fork drift is real (every internal improvement requires a deliberate port) · double maintenance burden · win/loss learning splits between two corpora unless you build a sync · third codebase to remember (ThriveUp + RPLICE + Bid Studio).

### Option C — **External-facing thin SaaS in front of shared services** (recommended)

Build a separate external frontend + tenant layer, but have it call **shared services** for the heavy lifting (RFP Fidelity Engine, RPLICE bridge, ETHICAL_EI_PREAMBLE'd AI provider, won-proposals learning loop, md-to-docx). Internal TCAF UI stays as it is and keeps calling the same services. The services themselves become tenant-aware; the frontends stay separate.

**Pros:** TCAF internal UX stays uncluttered · external customers get a purpose-built UI · one codebase for the high-value services (RPLICE binding, fidelity engine, ethical-AI provider) so improvements ship to both · win/loss learning aggregates across tenants at the service layer · clean security boundary between TCAF internal data and external tenant data (tenant-scoped queries; threat-model section "API to PostgreSQL" handled explicitly).

**Cons:** More architectural work upfront than Option A · requires retrofitting tenant-awareness into existing services (smaller surface than full multi-tenancy on the whole app though) · introduces a service-layer contract that has to be maintained.

**My recommendation: Option C.** Reasons: (1) honors your explicit "internal improve AND external same thing" framing without forcing internal UX to absorb tenant complexity; (2) the **valuable artifacts** (RFP Fidelity Engine, RPLICE evidence binding, ETHICAL_EI_PREAMBLE, won-proposals learning loop, congruence-audit) become tenant-aware once and benefit both surfaces; (3) clean security perimeter per your threat model; (4) external can be a separate brand ("Bid Studio" or whatever) without "ThriveUp"/"TCAF" leakage in its UX.

**Open question for you:** Are you OK with external customers' data living on TCAF's PostgreSQL (logically isolated by tenant_id, row-level security) — or do you want full physical DB isolation per tenant? The latter is more secure but materially more ops work and limits the cross-tenant win/loss aggregation that's the moat.

---

## Phased build plan (small ships, not big-bang)

Whichever architecture you pick (assuming Option C below), this is the work in shippable slices. Each slice independently improves TCAF internal AND lays groundwork for external.

### Phase 0 — close the 4 gaps on the internal stack (2–3 weeks, value to TCAF immediately)

| Slice | Layer | What ships | Why it matters for Wellcome bid + every bid after |
|---|---|---|---|
| 0.1 | L1 | RFP PDF auto-parse to Section L/M structure — `server/rfp-ingestion.ts` + worker that takes a PDF, runs `pdftotext`, regexes Section L/M boundaries, calls AI to extract verbatim requirements + scoring weights, populates `complianceMatrixItems` | Wellcome Guidelines PDF (still to be pulled W0 per `compliance-matrix.md`) auto-parses → matrix pre-populated → I stop hand-entering 30 verbatim quotes |
| 0.2 | L3 | Gap-closure workflow — `gapClosureItems` table + UI on `/grants/:grantId/compliance` that turns `{{ACTION REQUIRED}}` into assignable tasks with owner/deadline/primary-source-verification gate (Iron Rules #2 + #10 enforced in the UI) | Eric's Sedgwick handoff becomes structured; Cortney's "confirm Change 1 entity status" stops being scattered notes |
| 0.3 | L5 | Inline evidence binding — every paragraph in `grant-narrative.tsx` gets a `<EvidenceBound src="rplice:<id>" verbatim="..." />` primitive; pre-submit gate refuses to export if any paragraph is unbound | Wellcome Gate E.5 is unwinnable without this; congruence-audit becomes mechanically enforceable, not a manual pass |
| 0.4 | L6 | Section-by-section authoring assistant — wraps the existing `ETHICAL_EI_PREAMBLE'd` providers with RFP-verbatim-mirror prompts + Five-Lens prompts (user pref) + refuses decision-maker text | Wellcome Section M (and all future RFPs) gets generated against the verbatim rubric, not against generic "make it sound good" prompts |

### Phase 1 — multi-tenancy at the service layer (3–4 weeks, lays Option C groundwork)

| Slice | What ships | Notes |
|---|---|---|
| 1.1 | Add `tenants` table + retrofit `tenant_id` on `grants`, `complianceMatrixItems`, `wonProposals`, `gapClosureItems`, `proposal_paragraphs` (or wherever narrative chunks live). All existing data backfilled to `tenant_id = 'tcaf'`. Row-level scope helper. | Schema change; needs care; runs `npm run db:push`. Threat-model "API to PostgreSQL" boundary handled explicitly. |
| 1.2 | Per-tenant RPLICE corpus scoping (tenant subscribes to RPLICE OR brings their own evidence corpus). RPLICE-side: confirm if cross-tenant API key model exists. | Coordination with RPLICE-side AI. |
| 1.3 | Per-tenant rate-limit on paid AI calls (threat-model DoS section). Per-tenant audit log on every mutation (threat-model repudiation section). | |

### Phase 2 — external "Bid Studio" frontend (4–6 weeks, the new product)

| Slice | What ships | Notes |
|---|---|---|
| 2.1 | New frontend artifact (per `.local/skills/artifacts/` migration) — clean brand, no TCAF/ThriveUp UI strings, talks to the same services | Separate from `client/` so external customers don't see internal pages |
| 2.2 | Onboarding flow: tenant signup → org provisioning → first-RFP upload → 5-minute compliance matrix generated → free trial pursuit | |
| 2.3 | Prime/Sub workspace primitive: Prime invites Sub orgs to a shared compliance matrix with role-based section ownership + redline/comment/sign-off (closes L4 gap) | This is the headline external feature |
| 2.4 | Per-tenant `won-proposals` corpus with opt-in to anonymized aggregation across tenants (the moat — without explicit opt-in, no aggregation per IRR #8 dignity primitive applied to commercial customers) | |

### Phase 3 — exports + integrations (2–3 weeks, parallelizable with Phase 2)

| Slice | What ships |
|---|---|
| 3.1 | Submittable form-mapping export (Wellcome submits via Submittable — directly useful for our own bid) |
| 3.2 | Grants.gov XML export |
| 3.3 | ZoomGrants form-mapping (large state/foundation funder coverage) |

---

## What I'm NOT putting in this doc yet (need your input)

1. **External product name** — "Bid Studio" is a placeholder. Could be "ThriveUp Bid", "RPLICE Pursuit", "Fidelity", or your call entirely.
2. **Pricing model** — per-pursuit / per-seat / per-Prime-org / freemium-with-paid-export. Affects schema (Stripe table, usage metering).
3. **Tenant data isolation** — logical (row-level) vs physical (per-tenant DB) — see open question above.
4. **External brand boundary** — does external Bid Studio cite RPLICE-by-name (carrying the brand) or white-label the evidence binding under a generic "Evidence Engine"?
5. **Whether to roll Phase 0 into the Wellcome bid runway** (Slices 0.1 and 0.3 directly accelerate Wellcome).

---

## Immediate next action while RPLICE responds

**My suggestion:** I start Phase 0 Slice 0.3 (inline evidence binding) right now in parallel — because:

- It directly serves the Wellcome bid (Gate E.5 needs this);
- It's the smallest scope of the four Phase 0 slices (~300–500 lines, 1 schema change, 1 React primitive, 1 pre-submit gate hook);
- It's the prerequisite for the external Bid Studio's headline feature ("every claim cites primary source — no claim ships unbound");
- It's verifiable today against the Sedgwick proposal we just shipped (does `vitality-proposal-v3.md` bind every claim? Probably no — that's a feature, not a bug, surfaces real-world test cases).

**Hold for your green light on:** the architecture decision (A / B / C) and whether Phase 0 starts now or after Wellcome submits.
