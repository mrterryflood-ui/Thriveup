---
name: Nav findability & two-click gate
description: Task-first navigation doctrine and how the two-click reachability gate models the public click graph.
---

# Nav findability

**Rule:** Major public tools must stay within two clicks of the homepage, entered via plain-task labels ("Apply for benefits", "Find help near me"), never internal program/hub names. Sidebar has an always-expanded "I want to…" quick-task group; tool pages render the shared `RelatedTools` strip so no tool dead-ends.

**Why:** Tools were fully built but buried inside collapsed program-named hubs; a completion review also rejected an earlier pass for hiding `staffOnly`-routed items behind `adminOnly` sidebar flags.

**How to apply:**
- Sidebar flag must match the route's actual gate: `adminOnly` only for `RequireAuth adminOnly` routes; `staffOnly` routes (esign, yhsi-system) stay merely `authOnly` so non-admin staff keep nav access.
- `scripts/verify-two-click-reachability.ts` (in the `directory-links` gate) is a static BFS: it excludes `authOnly`/`adminOnly` sidebar lines from the public depth-0 surface and traverses one level of `@/components/*` imports so shared link strips count. Any reachability claim must survive that gate, and new "must-find" tools get added to its REQUIRED list.
- Written audit lives at `docs/nav-findability-audit-2026-08.md`.

**Gotcha:** `security-probes` gate can fail on `verify-gpp-endpoint.ts` for reasons external to the repo (GrantPathPro's Clerk JWT wall rejects the plain API key); that failure is not caused by local changes.
