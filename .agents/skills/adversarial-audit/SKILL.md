---
name: adversarial-audit
description: Post-build adversarial audit SOP — 6-domain parallel audit covering API contracts, JS runtime/DOM, UI/navigation, offline/storage, UX/performance/collaboration, and full-stack congruence/symmetry. Run after every build session before declaring work complete. Finds bugs that conventional testing misses.
---

# Adversarial Audit SOP

## Standard Operating Procedure — Post-Build Debugging

After every build session, run this 6-domain adversarial audit before declaring work complete.

## Process

### Phase 1: Launch 6 Independent Auditors in Parallel
Each auditor covers one domain and produces a findings report:

1. **API Contracts Auditor** — Reviews all server routes, API endpoints, request/response contracts, error handling, missing validation, type mismatches between shared schema and route handlers, dead endpoints, and unprotected routes.

2. **JS Runtime / DOM Auditor** — Searches for null reference errors, unhandled promise rejections, missing error boundaries, race conditions, memory leaks, undefined variable access, improper hook usage, missing dependencies in useEffect, and runtime crashes.

3. **UI Panels / Navigation Auditor** — Checks all routes registered in App.tsx against actual page files, broken links, sidebar navigation gaps, missing pages, dead imports, components that crash on render, and accessibility violations.

4. **Offline / Service Worker / localStorage Auditor** — Reviews localStorage usage, stale cache issues, service worker conflicts, data persistence bugs, storage quota handling, and data serialization errors.

5. **UX Engagement, Performance & Interdependent Collaboration Auditor** — Audits the user experience end-to-end: page load performance (bundle size, lazy loading, code splitting), interactive responsiveness (click-to-response latency, loading states, skeleton screens), meaningful empty states vs blank screens, ecosystem platform interdependence (heartbeat system, agent communication, cross-platform data flow), collaboration features (agent exchanges, broadcasts, inbox), and overall engagement quality (do features invite interaction, are there dead-end experiences, does the UI guide the user forward).

6. **Full-Stack Congruence & Symmetry Auditor** — Verifies bidirectional consistency across the entire stack: every frontend button/action maps to a real backend endpoint that works; every backend endpoint has a frontend consumer; shared/schema.ts types match both database columns AND API response shapes AND frontend TypeScript usage; sidebar navigation, breadcrumbs, and in-page links all form a consistent navigable graph; all CRUD operations are complete (if you can Create, you can Read/Update/Delete — no orphaned operations); form submissions reach the backend and responses are displayed to the user; mutation success triggers appropriate cache invalidation and UI feedback.

### Phase 2: Collect Findings
Gather all findings from all 6 auditors into a consolidated report.

### Phase 3: Fix Everything Found
Address every finding — no exceptions.

### Phase 4: Re-Run All 6 Auditors
Verify all fixes. Only declare done when all 6 come back clean.

## Severity Levels
- **CRITICAL**: App crashes, data loss, security vulnerability
- **HIGH**: Feature broken, user-facing error, navigation dead end
- **MEDIUM**: Degraded experience, console errors, missing validation
- **LOW**: Code quality, unused imports, minor inconsistencies
