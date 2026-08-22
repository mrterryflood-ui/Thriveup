# Alpha Omega — 2026-08-22 — Evaluator-ready front door

## Alpha
- End-state: The ThriveUp homepage lets residents, nonprofit leaders, funders/evaluators, and public/community partners identify a clear first action without relying on the sidebar. It plainly explains that TCAF equips nonprofit partners with tools, data, funding knowledge, planning, and implementation support while the partner remains the mission lead.
- In-state evidence: `client/src/pages/landing.tsx` has a full-screen general hero, duplicated audience choices, long feature stacks, and existing but under-surfaced `/for-nonprofits` and `/agency-connector` routes. `client/src/pages/for-nonprofits.tsx` confirms a public organization → partner key → dashboard flow. `client/src/pages/agency-connector.tsx` confirms a real four-step organization mapping and integration flow. `client/src/components/app-sidebar.tsx` holds the full connected-site directory.
- Authority/boundaries: Public wording follows TCAF identity doctrine and the distinct TCAF/ISS LLC legal lanes. No new backend, partner-key behavior, external-site changes, or unsupported outcome claims. The previously rejected public term must not remain visible on the landing page.
- Plan and acceptance proofs: Reframe the hero and audience selector; add direct nonprofit adoption and evidence-to-action explanations; link to real public routes; make the all-site directory available through `/ecosystem` without turning the homepage into a catalog; verify routes, links, desktop/mobile render, console, accessibility, direct tests, independent audit, and code review.
- Unknowns/deferred decisions: The task does not establish a new funding or partnership agreement; it explains the available existing platform paths only. Existing project-wide TypeScript failures are owned by downstream task #303 and must not be concealed.

## Omega
- Diff scrimmage: Pending implementation.
- Proofs and gates: Pending implementation.
- Independent angle: Pending adversarial audit and architect review.
- Outcome: Pending.
- Residuals and reusable guard: Pending.