# RPLICE v2 — Replicable Contract

This folder is the nationwide benefits engine contract. Every RPLICE peer
(LifeBridge at lifetransitionsaid.org, ThriveUp, future partner platforms)
ships these files **byte-identically** so dedup, eligibility, and handshake
counts converge without coordination.

## What's in here

| File | Purpose | Must be byte-identical across peers |
|---|---|---|
| `types.ts` | Core types: `BenefitProgram`, `Applicant`, `GrantPartner`, `RPLICEEvent`, `HandshakeResponse` | **Yes** |
| `areas.ts` | 10 canonical benefit areas | **Yes** |
| `resident-ref.ts` | Deterministic sha256 resident hash | **Yes — byte-exact** |
| `eligibility.ts` | Pure eligibility evaluator | **Yes** |
| `federal-programs.ts` | 24 federal programs | **Yes** |
| `state-programs.ts` | State layer (TX, CA, NY, FL, IL seeded) + `ST()` helper | Yes — extend in lockstep |
| `grant-partners.ts` | Registry + auto-tag logic | **Yes** |
| `zip-resolver.ts` | ZIP → state/county resolution | Extensible; counties populate opportunistically |
| `index.ts` | Barrel + `CATALOG`, `CATALOG_VERSION`, `ACCEPTED_EVENT_TYPES` | **Yes** |

## Invariants (the non-negotiables)

1. **`residentRef` is byte-exact.** Formula in `resident-ref.ts`. Any deviation
   breaks the dedup key `peer|residentRef|programSlug|status` and causes
   double-counting. Peers MUST produce the same 16-char hex for the same input.
2. **Slugs are canonical.** `federal:medicaid`, `state:tx:healthcare-access:texas-medicaid-your-texas-benefits`, `county:tx-travis:map`. Produced by the helpers in `state-programs.ts` / `zip-resolver.ts`.
3. **Funder attribution is nullable.** No code path may require a
   `grantPartnerId` to enroll someone.
4. **Eligibility is pure.** `evaluateEligibility(applicant, program)` must not
   mutate inputs or read external state.

## Event vocabulary

Both peers emit and consume these:

- `benefitProgram.updated` — catalog entry changed (eligibility, portal URL)
- `benefit.enrollment.created` / `.updated` — enrollment lifecycle
- `eligibility.screened` — anonymous funnel signal
- `grantPartner.registered` — new funder online with coverage geo + areas
- `grantPartner.tagged` — a specific enrollment was attributed to a grant

Plus the existing outcome/intent events. See `ACCEPTED_EVENT_TYPES` in
`index.ts` — this is the exact list each peer advertises via `/api/rplice/sync`.

## Handshake

`GET /api/rplice/sync` returns `HandshakeResponse` with per-state slices. RPLICE
compares `byState` between peers and triggers replay scoped to the drifting
state only — not the whole country.

## Seeding new states

1. Add state entries in `state-programs.ts` via `ST(code, area, programName, portalUrl, phone, extras?)`.
2. Commit to BOTH peers in lockstep.
3. Bump `CATALOG_VERSION` in `index.ts`.
4. Optionally fire `benefitProgram.updated` events for each new program so any
   caches on peer platforms invalidate without a restart.

## County layer

Counties are populated opportunistically — one county at a time, driven by
grant partnerships. St. David's populated Travis/Williamson/Hays/Bastrop/
Caldwell. The next funder populates theirs. County programs live server-side
(not in this shared folder) because they're peer-specific; the handshake
reconciles them via the `byState.byCounty` slice.
