---
name: Referral loop invariants
description: Security/integrity rules for the CHW→org→funder referral loop (capability tokens, immutability, default values).
---

# Referral loop invariants

- **Two separate capability tokens per referral**: `statusToken` (client-facing status page; leaks into funder CSV exports) and `orgConfirmToken` (org outcome confirmation). Never reuse one for the other's purpose — anyone holding a CSV would otherwise be able to mutate outcomes.
  **Why:** statusToken appears in exports; a single token would turn a read capability into a write capability.
- **Referral creation must be staff-gated** (requireStaff + rate limit). An open POST lets any internet caller attach fake referrals/PII to funder dashboards and pump outbound webhooks. Architect review flagged this as a FAIL-severity hole; keep the unauthenticated-create-is-rejected assertion in the verify script.
- **Outcome immutability must be atomic**: conditional `UPDATE ... WHERE resolved_at IS NULL`, zero rows → 409. A read-then-write check has a race where two concurrent confirms both win and double-fire webhooks.
- **Default benefit values need provenance + disclosure**: when an org confirms enrollment without a dollar estimate, the program default is applied with `valueSource='default'`; funder-facing surfaces must disclose how many values are defaults (metrics `defaultsUsed`) so estimates aren't presented as reported dollars.
- **Webhook dispatch is fire-and-forget** and zero subscribers is an explicit logged no-op — never let dispatch failure affect the API response.

**How to apply:** any new endpoint or export touching referrals must respect the token separation, the staff gate on writes, and the atomic resolved-at guard; any new funder metric summing benefit values must segment by valueSource.

## Post-merge hazard (2026-08-11)
A task-agent merge appended a duplicate router body to client/src/App.tsx (a second `return (<Switch>...)` after the closing brace), breaking the whole client with "'return' outside of function". After any task merge that touches App.tsx, grep for orphaned `^  return (` blocks and diff route lists before trusting gates.

## Capacity guard (2026-08-11)
Referral creation is capacity-gated server-side, not just in the UI: fresh closed status blocks, waitlist requires explicit CHW acknowledgement, and stale (>14-day) capacity data must never deny service. **Why:** client-only warnings can be bypassed, and out-of-date registry data must not block a client from help.
