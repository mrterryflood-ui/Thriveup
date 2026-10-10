# Repository privacy cleanup

## Scope
ThriveUp only. Preserve the Hutto implementation and private working originals;
remove personal/proposal/intake material from the current publishable branch.
No other project, DNS change, history rewrite or repository-visibility change.

## Changed
- 1,195 private paths removed from the Git index, with working copies retained
  and SHA-256 verified.
- 12 explicitly referenced public media assets moved into application assets.
- 166 working documents preserved in private object storage with verified
  SHA-256 round trips, including private root collateral and staff-tool sources.
  Other ignored intake originals remain local; this is not an assertion that
  every intake upload has a cloud backup.
- Removed embedded proposal Markdown/Word imports from frontend bundles.
- Staff authorization now protects document downloads, frameworks and pipeline
  reads/updates; authorization resolves canonical roles from the database.
- Document queries are account-scoped, cancellable and nonpersistent.
- Added Git/static/import privacy gates, build-time private-import rejection,
  source-only deployment coverage, ignore rules and a GitHub Actions gate.
- Fixed preview configuration overriding filesystem exclusions and a logger
  that killed the application on a denied file request.

## Proof
- 23 repository-privacy tests passed.
- 4 private-document tests passed, including real private-storage retrieval,
  integrity validation, traversal rejection and anonymous provider denial.
- TypeScript: zero errors. Production build succeeded.
- Restarted app runs on port 5000; preview renders Hutto.
- Anonymous private-document/pipeline/legacy document APIs return HTTP 401.
- Four direct preview filesystem probes covering grants, root collateral,
  grant-materials and intake uploads return HTTP 403; app remains available.
- Hutto returns HTTP 200 and its rendered preview was inspected.
- Independent scoped audit completed; its initial filesystem-gap report was a
  false positive and corrected. Effective-config/live probes subsequently found
  and confirmed repair of the separate middleware override/logger issue.

## Limits
Local index removal is not GitHub removal or history erasure. GitHub was observed
public with private documents still present on remote branch tips during this
work. Remote synchronization and historical containment must be separately
verified. Visibility change/history rewrite requires user approval.
The user started publishing before this coherent cleanup was completed;
production must be republished and tested against this final source.
Previous broader security-scan dependency/PII findings are not declared fixed by
this document-privacy cleanup. Already downloaded copies cannot be recalled.
