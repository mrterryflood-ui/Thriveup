# Community Evidence Integrity — Root-Cause Remediation (2026-08-14, follow-up pass)

This follows the earlier same-day pass that introduced `hasValidCommunityEvidence()`
and hardened the Census fetchers. That pass fixed the *contract* (labeling and
fail-closed behavior). This pass responds to a live user report of
internally-contradictory output and fixes the underlying *root causes*, plus
closes findings from a six-domain adversarial audit run against the
already-patched code.

## User-reported contradictions and root causes found

1. **Gun-violence "0 incidents" next to a populated monthly trend table.**
   Root cause: `server/grant-conduit-routes.ts` computed the 90-day incident
   totals filtered by ZIP (when supplied) but computed the 12-month monthly
   trend filtered only by state — two different geographies under one
   heading. Fixed: the trend query now uses the identical condition set as
   the totals query, and the response carries an explicit `scopeLabel`
   ("ZIP 78660" or "TX (state-wide — no ZIP was specified)") plus a `note`
   that names the scope, so the two numbers can never silently describe
   different places.

2. **ROI "43.0" next to AI-narrative text claiming "$5 for every $1".**
   Root cause: `generateCommunityNarrative()` (server/conductor-routes.ts)
   never told the model what the actual computed ROI was — it only supplied
   cost/savings dollar amounts, leaving the model to invent its own framing
   of "return per dollar." Fixed: the prompt now includes the exact
   `cascade.roi` figure and explicitly forbids stating any other
   cost-benefit ratio (or forbids stating one at all when no scenario was
   computed).

3. **`historicalCascade` showing populated vintages with `yearsOfData: 0`
   and a "stayed near 0% for 12 years" claim.**
   Investigation: grepped the full server tree for every other place that
   could construct a `historicalCascade`-shaped object — only
   `buildHistoricalCascade()` in conductor-routes.ts matches, and it is not
   called on any live path; the shipped brief hardcodes
   `historicalCascade: null`. Client rendering (`community-impact.tsx`,
   `community-compare.tsx`) already gates on `vintages?.length > 0`, so a
   null value cannot produce a populated, self-contradictory block through
   the client either. This field is confirmed dead-but-safe today. A
   follow-up task (#241) tracks either wiring the fully-built function up
   for real ZCTA-level history, or removing the always-empty tab — the
   contradiction the user saw could not be reproduced against current code
   and most likely reflects an earlier build.

## Additional fixes (six-domain audit findings, all confirmed against live code)

- **Type mismatch causing literal `[object Object]` output**: `atRiskPopulations`
  is `AtRiskPopulation[]` (objects with `name`/`estimated`/`unit`), not
  `string[]`. Fixed in `server/community-story-routes.ts` (PDF + HTML
  presentation builders), `client/src/pages/community-story-pack.tsx`
  (interface + Badge render), and `client/public/embed/tcaf-widget.js`.
- **RPLICE (internal-only) leak paths**: `GET /api/community-story/share/:id`
  now re-validates the stored story against `hasValidCommunityEvidence` and
  strips any top-level or nested `rplice` key on every read; `POST
  /api/community-story/share` now strips `rplice` from a caller-supplied
  top-level `story` object before persisting it; `GET
  /partner/v1/community-story` now strips a top-level `story.rplice` in
  addition to the nested `brief.rplice` it already stripped.
- **Stale cache could re-serve an already-fixed bug for up to 12h**:
  `conductorCacheGet()` now re-validates the cached value against
  `hasValidCommunityEvidence` before returning it; an invalid cached entry
  is now treated as a cache miss.
- **Brittle ZCTA label check**: `hasValidCommunityEvidence()` accepted only
  an exact `"ZCTA 12345"` string; now accepts that string with an appended
  qualifier (`.startsWith`) so a future more-descriptive label doesn't 422.
- **Type/runtime drift**: `CommunityEvidenceContract.dataQuality.status`
  TypeScript union now includes `"unavailable"`, matching what the runtime
  validator already accepted.
- **Client crash-safety**: `fmt$()` and the at-risk population count in
  `community-impact.tsx` now guard against null/non-finite input instead of
  assuming a fully-populated shape.
- **Silently-blank public partner tiles**: `partner-dashboard-shared.tsx`
  was reading nonexistent demographic field names
  (`noHealthInsurance`/`singleParentHouseholds`/`educationBelowHS`); fixed
  to the real schema names (`uninsuredRate`/`singleParentRate`/
  `noHighSchoolDiploma`), matching the authenticated dashboard that was
  already correct.

## Verification performed

- `npx tsc --noEmit`: 30 errors (baseline 87); none in any file touched this
  session — all pre-existing (three.js type declarations, an unrelated
  drizzle overload issue, one unrelated pdf-parse import issue).
- `npx tsx scripts/verify-community-brief-e2e.ts`: full pass, including a
  fixed regression in the test itself (its "legacy row" id generator relied
  on `Date.now()`, which is frozen in this sandbox, causing false
  duplicate-key collisions across runs — fixed to mix in `Math.random()`).
  This test's legacy-row expectation was also updated: a structurally
  invalid legacy share row now correctly gets a 422 (matching the
  strict-validation decision from the earlier pass), not a 200 with rplice
  merely stripped.
- `npx tsx scripts/verify-community-brief-probe-logic.ts`: 41/41 pass.
- Live curl against `/api/community-story/pack` confirmed correctly-typed
  `atRiskPopulations` objects (not strings) in the response.
- `community-brief-e2e` workflow: PASS end-to-end against the running app.

## Known pre-existing, out-of-scope issue

- `directory-links` workflow fails on one dead external link
  (`traviscountytx.gov/courts/family-law-center` → 404) unrelated to this
  work; not touched.

## Follow-ups filed (not blocking this task)

- #241 — decide to wire up or remove the dead `historicalCascade` /
  "Historical Receipt" feature.
- #242 — fix silently-empty gun-violence/state-scoped data when a ZIP fails
  to resolve a state abbreviation.
- #243 — evidence-gate the remaining `partner-dashboard-routes.ts` proxies
  and revalidate localStorage-restored partner auth state on load.
