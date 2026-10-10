---
name: Repository document boundary
description: The user's privacy boundary for personal documents and unpublished proposal work in ThriveUp.
---

Personal applications, resumes, unpublished proposal/LOI drafts and RFP/grant
working analyses must not be exposed in the public ThriveUp repository.

Private working material must never be embedded in client bundles, even on a
staff-gated page. Use authenticated server retrieval backed by private storage.

**Why:** Client authorization does not protect downloadable raw-import bundles,
and ignored working files can still be served by a development file server.

**How to apply:** Verify the effective server configuration, not only the Vite
config file: middleware server options must preserve filesystem exclusions.
Denied file requests must not terminate the application. Test actual HTTP denial
and anonymous object-storage access. Build guards must also work in source-only
deployment contexts without Git metadata. Obtain explicit approval before
changing repository visibility or rewriting shared history.

**Why:** The user identified personal documents at the repository root and
explicitly requested repair and prevention of recurrence.

**How to apply:** Verify actual Git-tracked paths when reviewing a cleanup;
ignore patterns do not remove already tracked files. Preserve working copies
in an approved private location rather than destroy them. Distinguish current
branch removal, remote branch removal, deployment exposure and historical
exposure; none proves the others. Remote history rewriting requires informed
approval, and an app publish must never be described as a repository privacy fix.
