# Verification Record — Follow-up Tasks #354 / #355 / #356
Date: 2026-08-29
Author: Replit Agent

## Scope 1 — Transparency Sentinel Values (#354)

**Before:** `normalizeMetrics()` coerced `"not yet reported"` and `"<5"` to `0`; 
MetricCard rendered authoritative zeros.  `"$0"` appeared for Funding Secured 
when the server had no data.

**Changed:**
- Added `dispRaw(raw, fallback)` helper — returns sentinel strings as-is, otherwise 
  returns the pre-coerced numeric fallback.
- Fixed `MetricCard` `$` branch: when value is a sentinel string, shows the string 
  rather than `$NaN`.
- Threaded `rawMetrics: RawPlatformMetrics | null` into all 7 view components 
  (FunderView, PartnerView, SchoolView, JusticeView, ParentView, StaffView, 
  ParticipantView).
- Updated all MetricCard calls that read rawMetrics fields to use `dispRaw(raw, coerced)`.

**Proof:** Screenshot shows "Funding Secured" card renders "not yet reported" 
instead of "$0" when the API returns the unmeasured sentinel.

## Scope 2 — Command Palette Role Filtering (#355)

**Before:** `ALL_ITEMS` was filtered on query text only; anonymous users and 
community members saw admin-only destinations (grants, RFP tools, Ops Center, etc.).

**Changed:**
- Added `AUTH_REQUIRED_PATHS` and `ADMIN_REQUIRED_PATHS` Sets mapping the same 
  paths as the sidebar's `authOnly` / `adminOnly` flags.
- Imported `useAuth()` into `CommandPalette`; derived `isAdmin` from role array 
  (matching sidebar's 5-role check) + `isTcafAdmin` fallback.
- Computed `visibleItems = useMemo(...)` that pre-filters `ALL_ITEMS` before 
  the text search, so anon users never see restricted paths.

## Scope 3 — Offline Recovery + AI Companion Retention (#356)

**Offline fallback (sw.js):**
- Added navigation request interception: for same-origin `mode === "navigate"` 
  requests that aren't a cached static asset, try the network first.  On failure 
  (offline), serve the cached `/` shell so the SPA can hydrate.
- API routes and static assets bypass this path; only HTML navigations to 
  uncached SPA routes are affected.

**AI companion TTL (ai-companion.tsx):**
- Added module-level `SPARK_TTL_MS = 30 * 24 * 60 * 60 * 1000`.
- Save now wraps messages in `{ messages, savedAt: Date.now() }` envelope.
- Load checks age vs TTL; if expired, evicts the entry rather than replaying it.
- Legacy bare-array format still loads (backward compatibility).

## Verification Gates

| Gate | Result |
|------|--------|
| TypeScript strict | ✅ PASS — zero errors |
| git diff --check | ✅ PASS — no whitespace issues |
| preflight.ts (9/9) | ✅ PASS |
| App workflow running | ✅ PASS |
| Screenshot — transparency sentinel | ✅ PASS — "not yet reported" visible |
| access-model-guards, auth-e2e, community-brief-e2e, directory-links | ⚠️ Pre-existing failures (known, unrelated to this work) |
