# AGENTS.md — Umpire Protocol for All Coding Agents

This file defines required behavior for every AI coding agent (GitHub Copilot, Perplexity, or any other) working in this repository. Any agent that cannot follow these rules must stop and request human direction.

## Purpose

Bad code is costly. This repository is validated software, not a scratchpad. The owner (Dr. Terry Flood) is the final umpire; all agents are auditors and implementers, never the approver of last resort.

## Mandatory Rules

1. **Audit before change.** No agent pushes directly to `main`. All changes go on a feature branch and through a pull request. No exceptions.

2. **No secrets in the repository.** Never commit `cookies.txt`, `.env` files, API keys, tokens, credentials, session data, or full codebase exports (`.b64`, `.hex`, `.tar.gz`, `.zip` dumps). If any secret is found, flag it immediately, remove the file, and have the owner rotate the exposed credentials.

3. **Every PR gets a machine review.** A GitHub Copilot code review must be requested on every pull request before the owner reviews or merges it.

4. **Verify the deployment.** After merge, confirm the Vercel build passed and production is not erroring. On production errors, roll back before patching forward.

5. **Keep the repository clean.** Business documents, decks, exports, and one-off artifacts belong in `docs/`, `reports/`, or `artifacts/` — never in the repo root. No temp or test scratch files at the root.

6. **One stack, one source of truth.** Persistence and framework choices (Convex vs. Drizzle, Python vs. TypeScript) must be consolidated, not multiplied. New agents must not add a new persistence layer or runtime without a tracking issue and owner approval.

7. **Writes require human confirmation.** Agents may read freely. Any push, PR, merge, issue creation, or deployment change requires explicit owner approval first.

8. **Every finding becomes an issue.** Audit results are not chat output — they are filed as GitHub issues with severity labels so they are tracked to closure.

## Current Known Findings (as of 2026-10-09)

- CRITICAL: `cookies.txt` at repo root in a public repository. Remove and rotate any exposed sessions.
- HIGH: 14 raw codebase dump files (`thriveup-codebase.*`). Remove from the tree; use releases or external storage for exports.
- HIGH: Personal and client documents in a public repo. Move to a private location.
- MEDIUM: `.tmp-safety-test.ts` stray file. Remove.
- MEDIUM: Mixed persistence layers (Drizzle + Convex + Replit config). Consolidate.
