# Deterministic Architect Review

## Why this exists

An external code-review agent is valuable, but the project cannot suspend architecture review when that service is unavailable. `npm run architect` is the local, repeatable first review pass. It produces a non-zero exit code for a failed platform boundary and is safe to run in development, CI, and pre-release checks.

It is a guardrail, not a claim that an automated script replaces human or independent architectural judgment.

## What it checks

1. **Architecture anchors** — the central policy, schema, routing, contract, browser, and lint surfaces still exist.
2. **AI policy gateway** — the ethical preamble gateway and its dedicated regression check remain installed.
3. **Cross-platform authentication containment** — the two legacy raw-key routes are the only compatibility paths; both remain explicitly deprecated, sunsetted, and linked to scoped partner authentication.
4. **Single React renderer policy** — React Three Fiber and Drei are not introduced into the project.
5. **Route-level authorization composition** — app-wide route wrapping cannot accidentally login-wall public routes.
6. **Public geographic claims** — client-facing code does not claim “52 states.”
7. **Browser-verification readiness** — Playwright remains configured to discover installed Chromium.

## How to use it

```bash
npm run architect
npm run lint
npm run verify:browser
```

Run the architecture gate before a release or after changes to routes, authentication, AI calls, platform topology, public claims, or browser tooling. Pair it with the relevant focused tests and the project’s broader security, preflight, and adversarial-review gates.

## Boundaries

- The compatibility routes are not approved patterns for new work. A new `CROSS_PLATFORM_API_KEY` caller fails the review.
- The gate verifies the presence of the AI policy gateway; `scripts/verify-ai-preamble.ts` remains the behavioral guard for call-site preamble coverage.
- A green local architect gate is development evidence only. It does not establish production behavior, partner authorization, or outcome evidence.