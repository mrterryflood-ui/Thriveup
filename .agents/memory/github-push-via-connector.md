---
name: GitHub push via connector replay
description: How to get local commits onto GitHub when the shell has no git credentials; Vercel preview as the off-Replit boot proof.
---
Rule: the workspace shell has no GitHub credentials (`git push` to origin fails with "Invalid username or token"). The GitHub connector (proxyFetch to api.github.com, inside `"use impure"`) is the push path. Replay commits with the Git Data API: upload missing blobs (base64), create tree with `base_tree` = first parent's tree and only changed paths (deletions = `sha: null`), create commit with the original author/committer name/email/ISO date and verbatim message, then create/update the ref. Doing it faithfully reproduces the **identical commit SHAs**, so local and remote stay in sync with no rebase.

Gotchas: an empty-change commit must reuse the parent tree (POST /git/trees with an empty array returns 422 "Invalid tree info"); check blob existence with GET not HEAD; `setTimeout` is unavailable in the durable scope (use it inside the impure function).

Throttle connector Git Data calls below 10 requests/second and honor HTTP 429 `Retry-After`; parallel blob existence/upload workers can exceed the connector's per-repl cap even when GitHub itself has capacity.

**Why:** the connector rejected a parallel replay at 11/10 RPS. Unreferenced uploaded blobs are harmless; resume idempotently and move the branch only after all commit SHA checks succeed.

**Why:** the user's standing rule is push only on explicit request, and when asked the 32-commit tree had no off-Replit copy; API replay was the only authenticated route.

**How to apply:** pushing a non-main branch triggers a Vercel **Preview** deployment (GitHub commit status "Vercel", deployment env "Preview") — that preview URL is the off-Replit boot proof; on Vercel `/api/login` answers 503 "REPL_ID not configured" by design, never a crash. Do not push to `main` unless the user says so; main promotes production.

Repeatable path (2026-10-04): `npx tsx scripts/github-push-replay.ts <owner/repo> <branch>` writes `/tmp/replay.json`; in the sandbox, load each blob as base64 via a `/tmp` file + `readFile` (the sandbox `shellExec` silently head/tail-joins large stdout with `truncated:false` — never carry blobs through its output), then run the replay inside `"use impure"` with `listConnections("github")[0].proxyFetch("/repos/...")` (path only, no host). SHA-identical commits; ref PATCH with `force:false`.
