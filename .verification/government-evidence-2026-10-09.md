# Government evidence integration — proof and review disposition

## Verified contract and scope

Public aggregate-only evidence. Exact county/tract/place/ZCTA IDs, strict need
and perspective, no arbitrary URL proxy. Perspective never grants permissions.
Discovery resources and existing-tool connections are not labeled ingested.
No automatic eligibility, clinical, capacity, or referral decisions.

## Evidence record

- Regression suite: 21 passing tests (government parsing/cache/deadline/handoff,
  background rejection handling, existing Navigator geography).
- Full compiler: exit 0. Production build: exit 0. CJS syntax and ethical-preamble
  checks pass. Build retains existing import.meta/bundle-size warnings.
- One application workflow restart; running development endpoint verified.
- Texas county/place/ZCTA: 33/40 CDC measures. Seven HRSN definitions unavailable
  for these Texas geographies, not replaced with modeled guesses or zeroes.
- Source-confirmed Alabama tract: 40/40. Unconfirmed tract: explicit empty and
  geography-unconfirmed state. Invalid zero county: HTTP 400.
- Independent browser: correct access filtering, exact county draft, no send/
  paid AI call, invalid ID error, 375px no horizontal overflow.
- Desktop screenshot: screenshots/government-evidence-desktop.jpg.
- Six-domain audit: API, runtime, navigation, storage/cache, performance, and
  congruence. Accepted findings repaired and checked by deterministic/live/browser
  proof. Reviewer conjectures contradicted by namespace/row-count bounds are not
  relabeled as observed defects.

## Review closure and residuals

Nullable missing estimates preserved; coverage is calculated against a live
source inventory, not a hardcoded count. Metadata binds dataset identity and
geography. Row state binds FIPS scope. Stalled/oversized bodies are deadline-bound
and explicitly canceled. Cache/in-flight maps are bounded, and warmed context
cannot extend CDC freshness beyond its evidence TTL. Middleware does not wait
seven seconds for cold government sources. Legacy composite is fixed-set only,
with mixed-year construction explicitly retained.

Existing outcome/referral systems were not rewritten. The validated draft is
human-reviewed and carries geography/topic/perspective; it does not itself create
a private case, enrollment, referral, or outcome.

Production is not updated by this work until user publication. Deployment logs
show pre-existing intermittent database/provider errors; a current registry HTTP
200 proves only the sampled read. No production writes/recovery or all-partner
health claim. No nationwide bulk ingestion or full Data.gov mirror claimed.

## Compliance

Fixed official source destinations; redirect rejection; strict schema/row/body/
time/concurrency limits; IP request cap; actual route permissions; no secrets,
new credentials, packages, DDL, raw-text LLM extraction, sensitive data ingestion,
external code-audit upload, consent bypass, or consequential automation.

## Repair and final delivery verification

- Preview source lookup and the actual anonymous Navigator → public tool flow were separately checked. The latter returned HTTP 200 SSE in about 12.5s: verified Travis County, CDC PLACES `swc5-untb`, 33/40 records, all 7 unavailable measure IDs (including `FOODSTAMP`/SNAP), 0 rejected rows, 2025 release vs 2022/2023 observation years, and source/retrieval timestamps.
- The delivered narrative no longer states the incorrect 38-indicator count or invents percentages for missing measures. It provides a real public `/community-analysis` handoff. That destination was opened; no analysis, case, referral, or mutation was submitted. Downstream layer/export claims in narrative were not independently verified.
- The source receipt is validated, persisted with authorized assistant history, carried in SSE, rendered independently of AI prose, and rebound on follow-up. Source-owned counts are grounded and mirrored to the bounded advisory receipt; restricted tool suggestions are omitted from model context. Follow-up continuity was unit-tested, not browser-tested.
- The browser flow verified no anonymous conversation-history request/401 after completion; `/api/auth/user` still returns the expected anonymous 401. Navigator evidence/tool cards wrapped at 375px. Navigating back discarded this anonymous conversation and restored the welcome/draft state.
- Publish failure root cause is confirmed by Replit's latest failed-build output: the build succeeded, then the critical `proxy-addr@2.0.7` advisory blocked deployment. Express `5.3.0` resolves to `proxy-addr@2.0.8`; the dependency audit reports 0 critical vulnerabilities. Other low/moderate/high advisories remain; this is not a zero-risk claim.
- Final focused government regression suite: 7 passed. Full TypeScript check: 0 errors. Production build and CJS syntax check passed. AI ethical-preamble check passed; `git diff --check` passed. Existing non-blocking `import.meta` CJS and bundle-size warnings remain. Application workflow runs; `/data-sources` Preview renders the county-evidence form and explicitly says listed endpoints are not proven operational.
- Hosting boundary: `easyailearning.com` serves the Replit deployment; `thrivingcommunitiesforall.com` serves a separate Vercel deployment. Replit Publish updates the former only; no DNS change, Git push, Vercel publish, or production Publish action was performed.
- Limits: CDC PLACES is dynamically retrieved by this implementation. Other government resource families are cataloged/discovered, not universally bulk-ingested; this is not a full Data.gov mirror. The confirmed Publish block is removed, but the new release remains unpublished until the owner publishes it.
