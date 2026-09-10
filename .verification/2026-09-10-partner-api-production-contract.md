# Partner API Production Contract Verification — 2026-09-10

## Claim

The current Partner API workspace build was published before any ChildCORE
live-integration confirmation, and the production docs and protected routes
match the required contract.

## Production target

- Origin: `https://easyailearning.com`
- Visibility: public
- Publish status: successful
- Publish completed: 2026-09-10 15:09:11 UTC

## Required proof

Command:

```bash
PUBLISHED_BASE_URL=https://easyailearning.com \
  npx tsx scripts/verify-published-partner-api-contract.ts
```

Result: exit 0.

- Public `/api/partner/v1/docs` returned HTTP 200 and a JSON object.
- Public docs advertised `chainweb:read` and `yhsi:read`.
- Public docs listed all expected Chainweb, YHSI, student aggregate, and
  heartbeat routes, with the expected scope labels.
- The rebased `GET /api/partner/v1/community/brief` compatibility route was
  documented with the exact `community:read` label and returned 401 without
  credentials.
- Every credential-free protected route probe returned HTTP 401 or 403.
- The heartbeat probe was bodyless and sent no partner data.
- The verifier bypassed caches, rejected redirects and unexpected origins,
  bounded response-body reads, and matched method/path/scope entries exactly.

## Independent audit

Six task-scoped auditors reviewed API contracts, runtime behavior, public docs,
cache behavior, operational handoff safety, and full-stack congruence. The first
pass found verifier weaknesses in exact matching, cache bypass, redirect
handling, and body-read deadlines. Those findings were repaired. The second
pass returned CLEAN in all six domains, and the hardened verifier again passed
against both the local server and production.

## Outcome

Production matches the expected workspace Partner API surface. No ChildCORE
live-integration message was sent as part of this verification task.