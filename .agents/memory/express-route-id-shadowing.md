---
name: Express literal-subpath route shadowing
description: server/grant-routes.ts has a `/api/grants/:id` handler with a manual reserved-word allowlist that swallows any later-registered literal subpath.
---

`server/grant-routes.ts` registers `app.get("/api/grants/:id", ...)` fairly early in the file. It guards against
shadowing known literal subpaths (`this-week`, `digest`, `discovery`, etc.) via a hardcoded `reserved` Set that
calls `next()` when the `:id` param matches one of those words — but any *new* literal route added later in the
file (e.g. `/api/grants/for-agencies`) is NOT automatically covered and gets silently swallowed, returning
`{"error":"Grant not found"}` instead of reaching the real handler.

**Why:** Express matches routes in registration order; a param route registered first always intercepts a literal
path registered later unless explicitly excluded.

**How to apply:** Any time you add a new `app.get("/api/grants/<literal-word>", ...)` route anywhere in
`server/grant-routes.ts`, also add that literal word to the `reserved` Set guarding `/api/grants/:id`. Same risk
pattern likely applies to any other `:id`-style catch-all route in the codebase — check for a similar reserved-word
guard before assuming a new literal route "just works".
