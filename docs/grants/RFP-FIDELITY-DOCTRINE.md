# RFP Fidelity Doctrine

The contracting officer / program officer / review panel is the customer. The RFP and its instructions/rubric are their requirements document. The job of a proposal is to answer those requirements **in their language, in their order, against their scoring criteria, with verifiable fidelity** — not to describe who we are and hope the evaluator connects the dots.

We describe ourselves only in service of demonstrating that we meet what they asked for. Performance for the end user comes after we win the contract.

## Reality is fixed. Framing is ours.

We never distort facts. We use the RFP's structure, language, and weightings as the spine, then position our actual capabilities as evidence against each scoring factor.

- Where we genuinely meet a requirement → say so confidently using the RFP's own vocabulary.
- Where we do not → name a real workaround (teaming sub, MOU, phased delivery, key personnel hire, CPA-attested financials, letter of credit/bonding partner, etc.) or flag it as `{{ACTION REQUIRED}}`.

## Section L vs Section M

- **Section L (Instructions to Offerors)** = page count, font, margins, attachments, signatures, submission channel. **Noncompliance gets a proposal rejected BEFORE Section M is scored.** Treat L as a pre-flight gate.
- **Section M (Evaluation Factors)** = the scored criteria. Every shall/must here gets a paragraph response that opens with the RFP's own factor language and ends with an inline `[Evidence: ...]` tag so the reviewer can trace claim → requirement → score.

## Source precedence

Q&A > Amendment > Base RFP > Pre-bid meeting notes. The extractor accepts all of them as a combined input — every clarification the funder gives us becomes a locked requirement.

## The four pieces

1. **Compliance Matrix extractor** — pulls every shall / must / will / should / may / page limit / font / margin / attachment requirement verbatim. Tags each as L / M / C / other. Persists to `compliance_matrix_items`.
2. **Rubric-aware section generator** — drafter mirrors the matrix back factor-by-factor. Opens each paragraph with the RFP's own factor language: *"In response to [reqNumber]'s requirement that [verbatim shall/must clause], TCAF…"* Ends with `[Evidence: ...]`.
3. **Hybrid workaround engine** — only proposes workarounds where there's an actual gap. If we're a clean fit (evidence on file + confidence ≥ 70), no workaround is forced. If the RFP is silent on teaming/subs, the proposed workaround carries a "requires verification that this is permissible" flag.
4. **Fidelity audit** — final pass. Every shall/must must map to an answering section OR a workaround. Section L gaps are surfaced separately as pre-rejection risk.

## Code locations

- Schema: `compliance_matrix_items` in `shared/schema.ts`
- Engine: `server/rfp-fidelity-engine.ts` (`extractComplianceMatrix`, `proposeWorkaround`, `runFidelityAudit`, `buildComplianceMatrixBlock`)
- Routes: `server/rfp-fidelity-routes.ts` (`/api/me/rfp-fidelity/...`)
- Drafter wiring: `server/rfp-rubric.ts` `generateDraftFromRubric` (accepts `complianceMatrix`)
- Narrative wiring: `server/grant-narrative-routes.ts` `/api/me/grant-narratives/generate` (loads matrix by grantId, passes to drafter, returns `complianceMatrixUsed`)
- UI: `/grants/:grantId/compliance` → `client/src/pages/rfp-fidelity-page.tsx`

## End-to-end lifecycle

1. Upload base RFP → `POST /api/me/rfp-documents` (kind=base, grantId=...)
2. Upload amendments + Q&A as they arrive → same endpoint, kind=amendment | qa
3. Extract matrix → `POST /api/me/rfp-fidelity/:grantId/extract` (optional `meetingNotes` in body)
4. Review matrix at `/grants/:grantId/compliance`. Per item, fill evidenceRef, answeringSectionName, set status (covered | workaround | gap), set confidence. AI-propose workaround for gaps with `POST /api/me/rfp-fidelity/items/:itemId/workaround`.
5. Generate draft → `POST /api/me/grant-narratives/generate` — drafter spine is now the matrix, not just the rubric.
6. Final audit → `GET /api/me/rfp-fidelity/:grantId/audit?draftSections=A||B||C`. Must return `ok: true` and `sectionLNoncompliance: []` before submit.

## Anti-patterns (do not do these)

- Describing TCAF without mapping each claim back to a numbered requirement.
- Inventing capabilities to cover a gap. (Use a workaround or `{{ACTION REQUIRED}}` instead.)
- Assuming Section L compliance is automatic.
- Ignoring an amendment or Q&A because "the base RFP already said something close."
- Writing to the end user (the program beneficiary). The reader is the reviewer/scorer.
