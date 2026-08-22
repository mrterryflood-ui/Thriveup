# Verification Record — Homepage Front Door — 2026-08-22

## Scope
Task #302 homepage explanation and findability work in `client/src/pages/landing.tsx`.

## Direct proofs
- `git diff --check`: passed.
- `npx tsx scripts/verify-sidebar-routes.ts`: passed; 272 sidebar URLs covered.
- `npx tsx scripts/verify-two-click-reachability.ts`: passed; 301 routes reachable within two clicks.
- `npx tsx scripts/verify-tool-reachability.ts`: passed; tracked public tools remain reachable.
- `npm run dev` workflow: restarted and served on port 5000.
- Desktop preview: rendered at 1280×720; hero shows resident, nonprofit, community conditions, and system-connection choices.
- Mobile preview: not completed; Playwright WebKit executable is not installed in this workspace.
- TypeScript: 33 existing errors remain; no `landing.tsx` error was reported by the focused scan. Zero-error cleanup is downstream task #303.

## Contract and claim checks
- No new server route or API contract was introduced.
- Nonprofit CTA points to existing `/agency-connector`.
- Funder/evaluator CTA points to existing `/ecosystem-story`.
- Community CTA points to existing `/community-impact`.
- Full directory CTA points to existing `/ecosystem`.
- Landing source scan found no prohibited terminology, unsupported `721+`/`651+` grant-count claim, or obsolete hero destinations.
- TCAF nonprofit-backbone and ISS LLC separation is preserved in the existing trust section.

## Limits and residuals
- The independent six-domain audit and architect review could not run because subagents/code review are disabled in the current workspace mode.
- Existing full-suite workflow failures are environmental/data drift and are not caused by a new server change: port contention during parallel E2E startup, registry expectation drift (27 vs 28), and dependent socket failures.