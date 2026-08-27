# Verification record — Connecticut equity-loss geography alignment

## Scope

Prevent Connecticut from becoming a state-wide source-coverage gap when a
current nationwide county-equivalent denominator and a legacy public health
source use different boundary vintages.

## Claims and evidence

1. **The geography join is FIPS/crosswalk based, not display-name based.**
   - The resolver follows the Census legacy-county/town → Planning Region →
     2022 tract → 2010 USALEEP tract relationship chain.
   - Direct and batch callers provide a FIPS-aware county identity.
   - A Connecticut source-name fallback and multi-region source-tract
     allocation are prohibited by focused regression tests.

2. **Both nationwide paths resolve and publish data safely.**
   - Manual and scheduled paths compose the same resolver.
   - A missing/non-finite growth value creates no peer class rather than a
     synthetic zero-growth classification.
   - Either batch refuses to publish if any county computation fails; its
     snapshot writes roll back and the audit row records a failed batch.

3. **Coverage is accurately named and reconciled.**
   - The API and report separate analytical records from deployment/service
     coverage, split states, D.C., and territories, and disclose present,
     usable, source-unavailable, otherwise-suppressed/incomplete, and
     missing/unattempted records.
   - A unit regression test proves a partial jurisdiction cannot be called
     entirely source-unavailable.

## Development proof

- `tsc --noEmit`: passed with zero errors.
- Full access-model validation: 35 access checks, five focused tests, nine
  nationwide checks, and 58 API checks passed.
- Latest completed development batch: 3,233 records present; 2,721 usable;
  512 suppressed; zero failed computations.
- Live Connecticut resolver: 783 source tracts examined; 775 uniquely
  resolved; eight boundary-spanning tracts excluded; all nine Planning
  Regions resolved; zero malformed live identifiers.
- Direct visual capture:
  `screenshots/equity-loss-national-final.jpg`.
- Independent six-domain adversarial audit: all six domains CLEAN.
- Independent architecture review: APPROVED with no blocker.
- The first platform-wide completion run had two unrelated youth-mode
  response waits time out during concurrent validation. Its immediately
  repeated, lock-protected standalone run passed all five youth-mode flows
  without a code change; this distinction is preserved rather than treating
  the first result as product evidence.

## Limits and residual

These are development-only results; no deployment or production behavior is
claimed. Browser automation reached the Replit development proxy three times
and received HTTP 502, while local port 5000 was reachable and direct preview
rendered the report. The platform-routing limitation is recorded separately
for follow-up verification.