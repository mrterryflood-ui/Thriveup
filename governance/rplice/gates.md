# RPLICE Gate Definitions

**RPLICE** = **R**equirements → **P**lanning → **L**eadership → **I**mplementation → **C**ontrol → **E**valuation

Each gate is a **hard stop**. No work passes without meeting *all* criteria.

---

## Gate 0 — Initiation (Requirements)
**Trigger:** New strategic commitment identified (grant, contract, product, partnership).

**Entry Criteria:**
- [ ] Commitment captured in `commitments/registry.yaml` with unique `commitment_id`
- [ ] Problem statement written in outcome terms (not output terms)
- [ ] Stakeholder map completed (RACI + influence/interest)
- [ ] Independent reviewer pool identified (min 3, max 5)

**Exit Criteria (Definition of Ready):**
- [ ] Steward signs `commitment_id` off
- [ ] Council confirms reviewer pool independence (no financial/employment ties < 2 yrs)
- [ ] Evidence ledger initialized with `commitment_id` genesis entry

**Artifacts Produced:**
- `commitments/{commitment_id}/charter.md`
- `evidence/ledger/{commitment_id}.jsonl` (genesis entry)

---

## Gate 1 — Planning
**Trigger:** Gate 0 passed.

**Entry Criteria:**
- [ ] GIS/MAPGraph node created for this commitment (see `gis/mapgraph/schema.yaml`)
- [ ] Work breakdown structure (WBS) with ≤ 2-week work packages
- [ ] Risk register with probability × impact ≥ Medium items mitigated
- [ ] Resource plan (people, budget, tools) committed

**Exit Criteria (Definition of Ready):**
- [ ] Council approves WBS & risk register
- [ ] Evidence ledger contains: WBS, risk register, resource plan hashes
- [ ] Independent reviewers briefed (asynchronous OK)

**Artifacts Produced:**
- `plans/{commitment_id}/wbs.yaml`
- `plans/{commitment_id}/risk-register.yaml`
- `plans/{commitment_id}/resource-plan.yaml`

---

## Gate 2 — Leadership Alignment
**Trigger:** Gate 1 passed.

**Entry Criteria:**
- [ ] All named leads in WBS confirm capacity & commitment
- [ ] Communication plan published (cadence, channels, escalation)
- [ ] Decision log template initialized

**Exit Criteria (Definition of Ready):**
- [ ] Leads sign capacity commitment in ledger
- [ ] Council verifies no undisclosed conflicts
- [ ] Evidence ledger contains: lead commitments, comms plan hash

**Artifacts Produced:**
- `plans/{commitment_id}/lead-commitments.yaml`
- `plans/{commitment_id}/comms-plan.md`

---

## Gate 3 — Implementation Start (Independent Review #1)
**Trigger:** Gate 2 passed.

**Entry Criteria:**
- [ ] First work package ready (tasks defined, dependencies resolved)
- [ ] Measurement baseline captured (see `measurement/baseline-schema.yaml`)
- [ ] Independent Review Panel (IRP) convened (min 2 reviewers)

**Exit Criteria (Definition of Done):**
- [ ] IRP issues **Gate 3 Advisory** (pass / conditional pass / hold)
- [ ] All *hold* conditions resolved or explicitly accepted by Steward
- [ ] Evidence ledger contains: IRP report, baseline measurements, WP1 task list

**Artifacts Produced:**
- `reviews/{commitment_id}/gate3-advisory.md`
- `measurement/{commitment_id}/baseline.yaml`

---

## Gate 4 — Control / Mid-Point
**Trigger:** ≥ 50% work packages complete OR calendar mid-point.

**Entry Criteria:**
- [ ] Progress evidence for every completed work package in ledger
- [ ] Updated risk register (new risks, retired risks, changed scores)
- [ ] Variance report: plan vs. actual (schedule, budget, scope, quality)

**Exit Criteria (Definition of Done):**
- [ ] Council accepts variance report or mandates corrective action
- [ ] Corrective actions (if any) have own WBS entries & owners
- [ ] Evidence ledger contains: progress hashes, updated risk register, variance report

**Artifacts Produced:**
- `reviews/{commitment_id}/gate4-variance.md`
- `plans/{commitment_id}/corrective-actions.yaml` (if needed)

---

## Gate 5 — Evaluation & Close (Independent Review #2)
**Trigger:** All work packages complete OR commitment terminated.

**Entry Criteria:**
- [ ] Final outcomes measured against baseline (see `measurement/outcome-schema.yaml`)
- [ ] Lessons learned captured (what worked, what didn't, why)
- [ ] IRP reconvened (min 2 reviewers, at least 1 new vs. Gate 3)

**Exit Criteria (Definition of Done):**
- [ ] IRP issues **Gate 5 Advisory** with outcome verification
- [ ] Steward accepts outcome or orders remediation
- [ ] Evidence ledger sealed (immutable, retention clock starts)
- [ ] Commitment status updated in registry: `delivered` | `partial` | `failed` | `terminated`

**Artifacts Produced:**
- `reviews/{commitment_id}/gate5-advisory.md`
- `measurement/{commitment_id}/outcomes.yaml`
- `lessons/{commitment_id}/learned.md`

---

## Gate Bypass / Emergency Path
**Only Steward may authorize.** Requires:
1. Written justification in ledger
2. Post-hoc IRP review within 10 business days
3. Council retrospective within 15 business days

---

*All gates enforce: no artifacts committed to ledger without cryptographic hash (SHA-256) recorded in the same entry.*