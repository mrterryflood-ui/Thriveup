# Alpha Omega — 2026-08-20 — Canonical resource/geography graph foundation

## Alpha
- End-state: Add the first working vertical slice of the nationwide geography–resource graph so the Community Intelligence Map can consume a stable, provenance-labeled contract without claiming live availability or authoritative boundaries.
- In-state evidence: The existing map reads `/api/community-map/resources/:stateCode` from the static state resource catalog and renders GIS records from `gis_context_data`. Existing county coordinates are approximate and the current resource response has no verification, freshness, or availability fields.
- Authority/boundaries: Existing state and federal catalog URLs remain the source references. This slice is read-only and public. It does not mutate provider data, create referrals, ingest external partner data, alter RPLICE, or replace the current GIS boundary/geometry system.
- Plan and acceptance proofs:
  1. Add a specialist graph builder with stable resource IDs, geography IDs, source metadata, verification status, availability unknown state, and coordinate-quality disclosure.
  2. Add a public GET contract with bounded state filtering and error handling.
  3. Update the existing map resource panel to display provenance, freshness, and unknown availability honestly.
  4. Run typecheck, preflight, focused route/contract checks, application restart, browser preview, and independent adversarial review.
- Unknowns/deferred decisions: Authoritative boundary geometries, live housing inventory/capacity, partner verification workflow, referral acceptance/outcomes, hotspot methodology, PostGIS/vector tiles, and all RPLICE security/shared-secret work remain deferred.

## Omega
- Diff scrimmage:
- Proofs and gates:
- Independent angle:
- Outcome:
- Residuals and reusable guard: