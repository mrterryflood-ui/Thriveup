---
name: Canonical staff-role set lockstep
description: All staff gates must share one 5-role set, enforced server-side via DB role lookup, and the client must see the same role the server resolves.
---

# Canonical staff-role set lockstep

The canonical staff-role set is `admin, teacher, case_manager, facilitator, staff`. Any surface that gates on "staff" — server route guards or client UI gates — must use this exact set.

**Why:** narrower local copies of the set caused users to be routed to staff pages whose APIs rejected them, and client-only gating was rejected as an authorization boundary. The OIDC session never carries a role or user id field beyond `claims.sub`, so roles must be resolved from the DB on the server, and the current-user endpoint must include that resolved role or client gates cannot render the access the server will actually grant.

**How to apply:** when adding or changing a staff-gated route or page: enforce the role server-side via the DB lookup, reuse the shared client staff-policy helper for showing/hiding controls, and never render a control whose endpoint will 403 the viewer.
