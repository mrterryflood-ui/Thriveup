# Community Brief Evidence Integrity — Verification Record

**Date:** 2026-08-14  
**Scope:** Community Brief evidence contract and every first-party public propagation path.

## Contract

`community-evidence/v1` is required for public share, partner, PDF, story, presentation, and embed consumers. It contains requested/resolved geography, Census source metadata, observed/derived/scenario/AI claim labels, and data-quality warnings.

## Evidence collected

- Live `POST /api/conductor/community-brief`:
  - `78660` returned `ZCTA 78660`, source grain `ZCTA`, and a visible unavailable scenario state where inputs were incomplete.
  - `Pflugerville, TX` returned `ZCTA 78660` with limited-resolution disclosure, not a citywide label.
  - `Travis County, TX` returned a direct county Census result.
  - `Travis County, TX|Williamson County, TX` returned a direct multi-county aggregate.
  - An unresolvable location returned 404; it did not fall back to sample data.
- Share probes:
  - Valid v1 share was retrievable with its evidence contract and no RPLICE block.
  - A deliberately corrupted ZCTA label was rejected with 422.
- Export probes:
  - Community Brief PDF included Sources & Methodology, resolved geography, and claim classification.
  - Story presentation included Evidence & Methodology with the resolved ZCTA and TCAF disclosure.
- Gates:
  - `npx tsx scripts/preflight.ts` passed (8/8).
  - TypeScript remained at 30 errors, below the configured 87-error baseline.
  - Browser test was attempted by the Playwright tester, but the app preview proxy exposed a mockup placeholder rather than the Community Impact route; API and static screenshot verification remained available.

## Independent review

The initial architect review identified county zero-fallbacks, permissive share validation, and an export population fallback. All three were remediated before final validation:

1. County/multi-county ACS requests now require complete numeric evidence and reject incomplete constituents.
2. A shared strict runtime validator guards public shares, exports, story shares, and partner responses.
3. Story presentation renders missing population as unavailable.

## Residual

The app-preview proxy’s mockup routing prevented the isolated Playwright browser from exercising the actual Community Impact interaction. This is an environment routing limitation, not verified as a page defect. The public route’s real server endpoints and generated artifacts were tested directly.