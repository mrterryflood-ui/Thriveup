# Alpha Omega — 2026-09-13 — Journey spine and ChildCORE closeout

## Alpha
- End-state: complete the remaining journey-spine and ChildCORE integration items, verify the live application, and assess the linked opportunity from its authoritative source.
- In-state evidence: current source confirms Navigator writes `userJourneys`; Benefits Screener, CHW referral creation, and YHSI updates still need write hooks. `childcoreCountyMetrics` is ingested but not read by personal context. `warmCommunityContext()` exists but no authenticated journey-based priming hook is present. The typecheck workflow was running/stale in the prior session and requires a fresh result.
- Authority/boundaries: user identity and role must remain server-derived; ChildCORE data is partner-reported and must remain disclosed as such; aggregate YHSI outbound data must use suppression floor 5 and exclude direct identifiers; no publish/deploy or destructive data actions.
- Plan and acceptance proofs:
  1. Locate the canonical screener submit, referral-create, and YHSI-update paths.
  2. Add conflict-safe journey upserts without delaying user-facing requests.
  3. Feed county metrics into authenticated personal context using resolved geography.
  4. Prime community context from a stale authenticated journey geography without blocking requests.
  5. Add YHSI aggregate outbound push with floor-5 suppression and a validation path.
  6. Run focused checks, zero-error typecheck, route/security probes, browser preview, and six-domain adversarial audit.
  7. Fetch and evaluate the linked opportunity against verified TCAF/ISS eligibility facts.
- Unknowns/deferred decisions: the LinkedIn short link may redirect to an inaccessible or incomplete opportunity page; if eligibility terms cannot be verified from a primary source, the assessment will be labeled inconclusive rather than guessed.

## Omega
- Diff scrimmage: pending implementation.
- Proofs and gates: pending.
- Independent angle: direct route probes, database/schema inspection, workflow logs, and an adversarial six-domain review.
- Outcome: pending.
- Residuals and reusable guard: pending.