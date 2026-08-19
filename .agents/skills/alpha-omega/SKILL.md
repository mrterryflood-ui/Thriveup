---
name: alpha-omega
description: Alpha Omega protocol — every build begins with verified scope and ends with independent proof, an auditable record, and a learning deposit.
---

# Alpha Omega Protocol

**Status:** Constitutional operating protocol for every agent working on ThriveUp
Academy / TCAF / ISS LLC. It complements Fable, ADIS v4, and Order of
Operations; it does not replace them.

## The invariant

**Alpha is the first trustworthy state. Omega is the last provable state.**
No agent may begin consequential work from an unverified premise, and no agent
may declare completion from an unverified result.

The protocol has two gates:

### ALPHA — establish the ground truth before acting

Before editing code, data, configuration, prompts, or external artifacts:

1. **Name the requested end-state** in the user's own terms.
2. **Pull the live in-state**: inspect the relevant files, routes, data, tests,
   workflows, and current constraints this turn.
3. **Identify authority and boundaries**: source of truth, affected users,
   authorization boundary, irreversible consequences, and deferred decisions.
4. **Form a bounded plan**: files/surfaces, acceptance proof, dependencies,
   stakeholder effects, and the stop condition.
5. **Record uncertainty explicitly**. Unknown is a blocker or a labeled
   assumption, never a plausible invention.

Alpha exit criterion: another agent can read the record and understand what is
known, what is not known, what will change, and what must not change.

### OMEGA — prove the result before claiming it

Before saying a change is complete, fixed, safe, or working:

1. **Scrimmage the diff** for silent failures, missing authorization,
   cross-boundary access, dead paths, contract mismatches, and sibling defects.
2. **Run the narrow proof** for the changed behavior, then the relevant project
   gates. Do not soften a gate to obtain green.
3. **Verify at the correct layer**: API proof is not UI proof; development proof
   is not production proof; a typecheck is not a behavior test.
4. **Use an independent angle**: a separate audit, adversarial pass, live
   query, or reviewer not sharing the implementation context.
5. **Deposit the result**: claim, evidence, outcome, residuals with severity/SLA,
   and the reusable guard or lesson.

Omega exit criterion: every completion claim has a discoverable evidence trail,
and every unresolved finding is visible rather than silently deferred.

## The bridge: Alpha ↔ Omega

The Alpha record defines the proof Omega must produce. Omega must answer every
acceptance claim made at Alpha. If the end-state changed, return to Alpha and
update the scope before continuing. If proof fails, the protocol returns to the
last known-good state; it does not advance by assertion.

## Enforcement classes

- **COMPILED:** this skill, `replit.md`, and the compiled agent-knowledge index
  must carry the protocol pointer.
- **GATED:** `scripts/verify-alpha-omega.ts` runs from `scripts/preflight.ts`;
  missing protocol surfaces or today's session record blocks completion.
- **HONOR:** agents still must perform the substantive ground-truth,
  stakeholder, adversarial, and independent-review work. A file check cannot
  prove that reasoning happened.

## Required session record

Create `.agents/sessions/alpha-omega-YYYY-MM-DD.md` before build work and
complete it before declaring done:

```md
# Alpha Omega — YYYY-MM-DD — <scope>
## Alpha
- End-state:
- In-state evidence:
- Authority/boundaries:
- Plan and acceptance proofs:
- Unknowns/deferred decisions:
## Omega
- Diff scrimmage:
- Proofs and gates:
- Independent angle:
- Outcome:
- Residuals and reusable guard:
```

RPLICE work may be explicitly deferred when the user authorizes that deferral;
the deferral must remain visible in Alpha and Omega and must not be represented
as resolved.

## Relationship to companion doctrines

- **Fable** governs truthfulness, dignity, and communication.
- **ADIS / Platform DNA** governs the stage pipeline and constitutional
  invariants.
- **Order of Operations** supplies the environmental scan and backward plan.
- **Adversarial Audit** supplies the post-build six-domain scrimmage.
- **Alpha Omega** binds intake to proof and makes the record non-optional.