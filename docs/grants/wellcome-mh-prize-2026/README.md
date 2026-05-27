# Wellcome Prize for Mental Health Science with Nature — 2026–2027

**Primary source:** `https://www.nature.com/immersive/wellcomeprizementalhealth/index.html`
**Submission portal:** Nature Awards on Submittable (`natureawards.submittable.com`)
**Deadline:** **18 September 2026, 11:59 PM UTC** (~16-week runway from 2026-05-27)
**Award:** US $1M grand prize + 3 finalists × US $250K each
**Ceremony:** London, June 2027

## Folder contents

| File | Purpose | Status |
|---|---|---|
| `README.md` | This orientation file | — |
| `compliance-matrix.md` | 5 Wellcome scoring criteria → our response, per RFP Fidelity Doctrine (Iron Rule #5) | DRAFT |
| `concept-note.md` | Honest 1-page concept note (Path A — pitch verifiably real; frame the scaffolded RPLICE pages as prize-funded scientific deliverables) | DRAFT v1 |
| `evidence-pulls.md` | RPLICE evidence pulls (Collaborative Care, Mothers & Babies, perinatal depression, 8-Dim Fidelity precedent) | SCAFFOLD — awaiting Dr. Flood RPLICE pulls |
| `team-recruitment-log.md` | Status tracker for Sarah Lord / Cortney Jones / Tandon recruitment | OPEN |

## Strategic frame (Path A — agreed 2026-05-27)

The intervention being pitched is **Collaborative Care adapted for perinatal depression and anxiety, sited in community-based organizations rather than primary-care clinics**, with TCAF's implementation-science instrumentation as the novelty layer.

- **Content backbone (cited from primary literature, NOT from claimed codebase records):** Unützer 2012 IMPACT lineage + AIMS Center continuation + Tandon group *Mothers and Babies* perinatal extension.
- **Novelty layer (scaffolded — instrument validation + field deployment funded by THIS prize):** 8-Dimensional Adaptable Treatment Fidelity (multi-vantage), Mechanism-Preservation Registry, Sustainment Capability Tracker as a scored deliverable. These exist as scaffolded pages on the RPLICE codebase (`measurement-studio.tsx` 256 lines; `mechanism-preservation-registry.tsx` 337 lines; `sustainment-capability-tracker.tsx` 258 lines); the **prize funds their instrument validation, field deployment, and evidence generation**, not their initial build.
- **Lived-experience by design (not advisory):** Cortney Jones, MSW (Change 1 / Grit Growth Global; Child Inc. Head Start Parent Policy Rep; Texas CASA Public Policy Committee) named **community co-investigator with design authority** over instrument selection, content adaptation, and fidelity vantages.
- **Community-organization siting** — closes the access gap IMPACT historically depended on integrated health systems to bridge.

## Team triangle

| Role | Person | Status |
|---|---|---|
| Lead applicant | **TCAF** — Dr. Terry D. Flood, DHA, President | ✓ federal-grade entity (SAM Active UEI KDDVD1FGLW35, CAGE 209N1, 501(c)(3) per IRS Letter 947 dated 04/30/2026 effective 01/14/2026, EIN 41-3618003) |
| Scientific co-PI | **Dr. Sarah Lord, PhD** — Dartmouth Geisel, Director D&I Science Core, Center for Technology and Behavioral Health (CTBH); Co-Director DCIS | ✓ already in TCAF memory from ARPA-H scoping 2026-05-26; **outreach not yet sent** |
| Community co-PI (design authority) | **Cortney Jones, MSW** — Founder, Change 1 / Grit Growth Global | ⬜ LinkedIn connection request sent 2026-05-27; **pending acceptance** |
| Content PI recruit (linchpin) | **Dr. Darius Tandon, PhD** — Northwestern, Mothers & Babies lineage. **Backup:** AIMS Center / Reynolds-lineage Collaborative Care PI | ⬜ outreach not yet started |

## 16-week pre-flight runway

| Week of | Milestone |
|---|---|
| 2026-05-27 (W0) | Concept note drafted; team recruitment letters drafted; Cortney LinkedIn pending; RPLICE evidence pulls beginning |
| 2026-06-03 (W1) | Cortney call (post-LinkedIn accept); Sarah Lord outreach sent; Tandon cold-ask sent; RPLICE pulls complete for Gate 1 evidence |
| 2026-06-10 (W2) | Concept note v2 incorporating partner feedback; primary-literature citations bound to every claim |
| 2026-06-17 — 2026-07-08 (W3–6) | Sub-award scopes drafted for Dartmouth + Northwestern + Change 1; budget v1; mechanism map pre-registered |
| 2026-07-15 — 2026-08-05 (W7–10) | Full proposal first draft; internal congruence audit; 5-Lens review; ETHICAL_EI_PREAMBLE pre-flight |
| 2026-08-12 — 2026-09-02 (W11–14) | Partner sign-offs; Submittable form pre-population; budget final; LOS chase |
| 2026-09-09 (W15) | Internal architect code-review on full submission; pdfinfo/pdffonts/pdftotext verification gates (Iron Rule #11) |
| 2026-09-16 (W16) | Submit 48h before deadline; finalize 2026-09-17; **deadline 2026-09-18 11:59 PM UTC** |

## Cross-repo coordination protocol

Per `docs/agent-memory/topics/architecture.md` "Cross-repo architecture" entry (added 2026-05-27): ThriveUp and RPLICE are TWO codebases linked by API. The RPLICE-side AI owns evidence pulls and the implementation-science catalog; ThriveUp-side (this repo) owns the concept-note, compliance-matrix, team-recruitment, and submission lifecycle. Receipts pass via this folder (`evidence-pulls.md` for RPLICE → ThriveUp) and via shared deposits to `docs/agent-memory/`.
