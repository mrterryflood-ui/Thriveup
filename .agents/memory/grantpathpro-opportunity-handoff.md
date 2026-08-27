---
name: GrantPathPro opportunity handoff
description: Safety boundary for the consequential v1 Opportunity Mirror delivery and feedback loop.
---

The v1 Community Opportunity Mirror handoff is distinct from legacy GrantPathPro
exports. It may only deliver to the explicitly configured, allow-listed HTTPS
`/thriveup/mirror` receiver using a dedicated outbound-only credential. A
handoff becomes delivered only when that receiver returns JSON with
`accepted: true`; otherwise it remains unavailable, rejected, or unknown. Do
not use a live partner POST as a configuration probe, and never reuse an
inbound callback credential for outbound delivery.

Partner feedback is private to the organization, must follow a verified
delivery, and must include a stable partner-generated event ID. Exact retries
are idempotent; reuse of an event ID with changed content is a conflict rather
than a new outcome.

**Why:** Authorization to share a package is not partner commitment, outreach
authorization, award confirmation, or an observed outcome. A truth-preserving
flow must fail closed rather than invent receipt or silently merge conflicting
partner records.

**How to apply:** Keep UI language to receipt of the handoff package only.
Before enabling live delivery, provision the dedicated credential and exact
receiver through secure configuration, configure the authenticated callback,
and verify their behavior in a non-production environment. Do not treat
development or a local receiver stub as partner readiness evidence.

For GPP tables that may be created during the publish-time schema diff, do not
leave their check constraints `NOT VALID` in the development database. Verify
that existing rows satisfy the check, then validate it; migration sources for
new environments should create the check as valid.

**Why:** The publish schema diff can serialize an unvalidated check as an
inline `CREATE TABLE` constraint. PostgreSQL permits `NOT VALID` only with
`ALTER TABLE ... ADD CONSTRAINT`, so that generated statement fails to parse.

**How to apply:** Before publishing a new GPP table with hardening constraints,
count violating rows first. If none exist, validate the constraint in
development and keep the committed GPP migration source free of `NOT VALID`.