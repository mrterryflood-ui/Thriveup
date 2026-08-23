# Alpha Omega — 2026-08-23 — Zero-error TypeScript build

## Alpha
- End-state: Reach a true zero-error TypeScript check without weakening compiler settings or changing package versions.
- In-state evidence: The live non-incremental compiler reported 33 errors across TopoJSON, Three.js declarations, community graph narrowing, Express params, Drizzle predicates, and `pdf-parse`.
- Authority/boundaries: Preserve map rendering, Three.js fail-soft behavior, graph validation, Agency Connector preview routing, member engagement routes, and Navigator PDF extraction.
- Plan and acceptance proofs: Add explicit type boundaries and scalar normalization; run strict non-incremental typecheck, focused affected tests, preflight, app restart, and log inspection.
- Unknowns/deferred decisions: Browser WebGL and production-only integration behavior remain covered by their existing focused gates, not by this compiler task.

## Omega
- Diff scrimmage: Only the identified type-contract surfaces changed. No compiler settings, package versions, database schema, authorization behavior, or route shapes changed.
- Proofs and gates: `npx tsc --noEmit --incremental false -p .` exits 0 with zero errors. Trade-simulation, community brief/evidence/claim-grounding/chain checks, `git diff --check`, and app restart completed. Preflight is rerun after the required dated record is present.
- Independent angle: Focused runtime and invariant checks exercised the affected simulation, data-validation, and claim-grounding paths; fresh workflow logs show the application is running with no new browser console output.
- Outcome: The project now passes the requested zero-error TypeScript build while retaining strict settings and runtime behavior.
- Residuals and reusable guard: Several unrelated broad workflows remain environment/data-drift sensitive (for example remote endpoint responses and slow SSE probes). Keep third-party untyped dependencies behind one local declaration boundary and convert Express params to scalar strings before typed database predicates.