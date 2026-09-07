---
name: E2E validation gate concurrency
description: Playwright e2e validation gates run in parallel and will clobber each other unless serialized
---

Validation runs execute all gates concurrently. Multiple Playwright e2e gate scripts race on two shared resources: the :5000 dev server (one script's cleanup trap kills the server another is using) and the shared `test-results` artifacts dir (trace ENOENT crashes).

**Why:** First parallel run of youth-mode-e2e + auth-e2e failed both gates with trace ENOENT + timeouts; each alone passed.

**How to apply:** Every e2e gate script must (1) self-exec under `flock /tmp/e2e-gate.lock` (guarded by `E2E_GATE_LOCKED=1`), and (2) pass a unique `npx playwright test --output test-results/<gate-name>` dir. Copy the pattern from scripts/run-auth-e2e.sh when adding new e2e gates (plumbing/automotive/HVAC test tasks etc.).

**Also applies to non-Playwright gates:** any validation gate that forges a session or mutates shared DB state (e.g. the academy-economy verifier) must serialize on /tmp/e2e-gate.lock too — parallel gates that restart the server or clean sessions cause mid-run 401s and FK cleanup errors.

**Preview boundary:** The default Run target must be the dedicated application workflow, not a parallel aggregate of validation workflows. Otherwise gates that self-start the dev server can race the preview on port 5000 and make the webview fail with `EADDRINUSE`.
