# Alpha Omega — 2026-09-19 — MS provider intelligence handoff + evidence synthesis

## Alpha

- End-state: give the MS platform a governed provider-intelligence handoff with current community/health platform URLs and RPLICE's live MS Center surface.
- Current slice: add Replit-managed OpenAI as a bounded second AI path that synthesizes only retrieved official/PubMed context; keep Perplexity as the web-retrieval path and keep referral delivery fail-closed.
- In-state evidence: the live `ecosystem_platforms` catalog has 29 rows. RPLICE health is live at `https://www.bettersciencelab.com/api/v1/health`; its sitemap exposes `/ms-center`. Existing provider discovery is authenticated, generic, and explicitly not vetted.
- Provider in-state: `server/ai-provider.ts` already exposes a generic `replit-ai-integrations` fallback using Replit-managed OpenAI environment variables and `gpt-5-nano`, but no evidence-only synthesis helper exists. `server/ms-provider-intelligence.ts` uses `perplexityResearch()` for provider leads and returns citations as globally unmapped.
- Authority/boundaries: expose public organizational metadata and public RPLICE links; do not expose API keys, person-level health data, clinical records, referrals, or verification claims inferred from a URL.
- Plan and acceptance proofs: preserve the existing scoped partner endpoint and add a disclosed evidence synthesis field. Retrieve a bounded PubMed context set from NCBI, combine it only with fixed official sources and validated retrieved source context, call the dedicated Replit OpenAI helper, and return an honest unavailable/insufficient state when evidence or provider credentials are missing. Verify source filtering, JSON validation, TypeScript, AI preamble, route behavior, and referral non-mutation.
- Unknowns/deferred decisions: RPLICE's `/ms-center` page is confirmed live, but no public structured MS provider API was found. FHIR, referral lifecycle, clinician acknowledgement, device exchange, and Center-of-Excellence queues remain deferred. Provider-lead citations will not be upgraded to verified evidence merely because an AI synthesis exists.

## Omega

- Diff scrimmage: fixed the internal-catalog visibility boundary so only ecosystem callers can receive `internal_ecosystem` rows; external partner keys receive public rows only. Added strict scalar query validation, bounded/pruned caches and in-flight work, fail-closed malformed AI parsing, HTTPS-only provider/citation URLs, explicit provider-unavailable responses, fresh RPLICE health state, canonical RPLICE URLs, explicit catalog freshness, pinned `health:read` scope coverage, and truthful UI status/copy.
- Proofs and gates: `git diff --check` passed; `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` passed; `npx tsx scripts/preflight.ts` passed 9/9; configured typecheck workflow passed integrated-flow verification; application restarted and served on port 5000; startup logged partner route-contract parity; unauthenticated live `GET /api/partner/v1/ms/intelligence` returned 401; live docs exposed `health:read` and the MS route; direct service probes confirmed malformed inputs reject, external directory output excludes Autoimmune, and ecosystem directory output includes it with explicit visibility; health-network screenshot rendered after restart.
- Independent angle: six-domain adversarial audit was run twice. The second pass confirmed the auth/scope contract, visibility policy, cache freshness, parser fail-closed behavior, UI status labels, canonical RPLICE surface, and external-consumer intent. Remaining citation mapping is explicitly labeled `unmapped_citations`, not represented as verified provider evidence.
- Outcome: the first MS vertical slice is complete. Authenticated partners with explicitly provisioned `health:read` can retrieve the governed ecosystem/RPLICE directory and location-based nationwide provider leads. Provider leads remain cited AI leads, not verified referrals; catalog URLs and health flags remain separate from capability verification.
- Residuals and reusable guard: provider citations are still global/unmapped to individual leads; the partner API is intentionally the external MS-platform consumer rather than a local browser provider finder; UI shows an evidence-surface label rather than live RPLICE probe telemetry. No person-level health, clinical, caregiver, device, research-participant, referral, or treatment exchange was enabled.

## Omega update for current evidence-synthesis slice

- Diff scrimmage: pending implementation.
- Proofs and gates: pending implementation.
- Independent angle: pending focused tests and adversarial audit.
- Outcome: pending.
- Residuals and reusable guard: pending.