---
name: Remediation doctrine & re-audit outcome
description: Durable lessons from the Aug 2026 total-platform remediation; where the permanent gates live and the traps that caused regressions.
---

# Remediation doctrine (Aug 2026)

**Outcome:** 5-phase remediation complete; 6-domain re-audit exit criterion met (no component <7/10). Scorecard: docs/remediation/final-scorecard.md. The five disciplines are written into .agents/skills/platform-engineering/SKILL.md.

## Durable lessons
- **Parallel subagents must never run `git stash`** — one did mid-remediation, captured ~31 files of another agent's uncommitted work, and silently reverted a finished fix (foster intake first-upload token race), which the re-audit had to re-catch. After any parallel wave, grep-verify a marker from each agent's report before trusting the working tree.
  **Why:** uncommitted parallel work shares one working tree; stash/pop is a cross-agent data hazard.
- **Partner API keys have no tenant column** — they are unbounded credentials, so partner student endpoints are aggregate-only + suppression-floored (per-student routes return 410). Do not re-add per-student partner reads without a real tenant model in partnerApiKeys.
- **Referral `completed` is immutable** (transition matrix in yhsi-routes) because it feeds funder-reported resolution; corrections use a new re-referral row.
- **Session-expiry vs anonymous:** the 401 handler keys on the `thriveup.wasAuthenticated` localStorage flag (set by useAuth, cleared on logout). Cached-user truthiness alone misses the unresolved/null-cache window; no flag = anonymous = never redirect.
- **Anon trade-sim ids are bearer credentials**: crypto-random, merged in a transaction with x-anon-session possession proof. Math.random ids were guessable — never regress that.
- **Permanent gates** (validation steps): seed-idempotency, typecheck (≤85 baseline — lower the number as errors drop), security-probes (16 probes; add one per new guarded endpoint), ai-preamble, yhsi-metrics.

## How to apply
Before shipping any feature: run the five validation steps; new "once" semantics need a unique index; new AI call sites need withEthicalPreamble (the script catches it); new public claims import from shared/canonical-claims.ts.
