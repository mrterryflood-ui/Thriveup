# Independent Review Protocol — Phase 0

version: "0.1.0"

---
## Purpose
Ensure no commitment is self-certified at critical gates. External, qualified reviewers validate methodology, evidence, and conclusions.

---
## Reviewer Qualifications

| Criterion | Minimum |
|-----------|---------|
| **Independence** | No financial/employment relationship with Thriveup, Steward, or Council members in prior 24 months |
| **Domain Expertise** | Demonstrated experience in commitment's primary domain (health, education, govtech, etc.) |
| **Methodology Competence** | Familiar with evidence-based evaluation, logic models, or similar frameworks |
| **Availability** | Can commit to 2-week review window with ≤ 5 business day turnaround |
| **Conflict Declaration** | Signed declaration per engagement |

---
## Reviewer Pool Management

- **Source**: `integrations/reviewer-pool.yaml` (curated by Council)
- **Size**: 8-12 active reviewers (allows rotation, avoids fatigue)
- **Rotation**: No reviewer serves > 2 consecutive commitments
- **Compensation**: Defined per engagement; grant-funded where possible
- **Onboarding**: 1-hour orientation on RPLICE, evidence ledger, MAPGraph

---
## Gate 3 Review (Implementation Start)

### Scope
- Baseline measurement adequacy
- Work package 1 readiness
- Risk register completeness
- Lead capacity commitments

### Process
1. Council selects 2-3 reviewers from pool (at least 1 new to this commitment)
2. Reviewers receive: commitment charter, baseline, WP1 tasks, risk register
3. Reviewers submit **Gate 3 Advisory** within 5 business days
4. Council consolidates; Steward decides

### Advisory Template
```markdown
# Gate 3 Advisory — {commitment_id}

**Reviewers**: [act-id-1, act-id-2, ...]
**Date**: {ISO 8601}
**Verdict**: pass | conditional_pass | hold

## Findings
### Baseline Adequacy
- [ ] Outcome metrics present
- [ ] Output metrics present
- [ ] Process metrics present
- [ ] Resource metrics present
- [ ] Risk metrics present
- [ ] All data_sources traceable to ledger

### WP1 Readiness
- [ ] Tasks defined with clear DoD
- [ ] Dependencies resolved
- [ ] Owner capacity confirmed

### Risk Register
- [ ] All ≥ Medium risks have mitigations
- [ ] Owners assigned
- [ ] Residual scores calculated

## Conditions (if conditional_pass/hold)
1. {condition description} — due by {date}
2. ...

## Dissenting Views
{Any reviewer may append dissenting view}

## Signatures
{Each reviewer signs with Ed25519 key}
```

---
## Gate 5 Review (Evaluation & Close)

### Scope
- Outcome measurement validity
- Achievement classifications
- Lessons learned completeness
- Evidence ledger integrity

### Process
1. Council selects 2-3 reviewers (at least 1 **different** from Gate 3)
2. Reviewers receive: outcome record, all gate advisories, evidence ledger export
3. Reviewers submit **Gate 5 Advisory** within 5 business days
4. Council consolidates; Steward makes final outcome determination

### Advisory Template
```markdown
# Gate 5 Advisory — {commitment_id}

**Reviewers**: [act-id-1, act-id-2, ...]
**Date**: {ISO 8601}
**Verdict**: pass | conditional_pass | hold | fail

## Findings
### Outcome Validity
- [ ] Measurements match baseline methodology
- [ ] Achievement classifications justified
- [ ] Confidence levels appropriate
- [ ] Root causes identified for gaps

### Evidence Integrity
- [ ] Ledger verification passes (verify-ledger.py)
- [ ] No gaps in gate evidence chain
- [ ] All payload hashes valid

### Lessons Learned
- [ ] Candid, specific, actionable
- [ ] Attributed (not anonymous)
- [ ] Linked to specific gates/risks

## Conditions (if conditional_pass/hold/fail)
1. {condition description} — due by {date}

## Dissenting Views
{Any reviewer may append dissenting view}

## Signatures
{Each reviewer signs with Ed25519 key}
```

---
## Reviewer Compensation & Recognition

- **Standard engagement**: $500-1,500 per gate (grant-funded)
- **Recognition**: Listed in annual Implementation Intelligence Report
- **Feedback loop**: Reviewers rate Council/Steward responsiveness

---
## Escalation

If IRP **cannot reach consensus**:
1. Council mediates (2 business days)
2. Steward decides (final)
3. Dissenting views published with decision

**No commitment closes without a Gate 5 Advisory.**