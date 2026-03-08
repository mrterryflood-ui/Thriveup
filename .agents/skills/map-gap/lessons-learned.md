# MAP-GAP Lessons Learned Registry

Persistent lessons from each improvement cycle. Each lesson should inform future cycles and, where possible, become an automated health check.

## E-Series Lessons (ErrorRetry, PageHeader, Link Fixes)

- **E-L01**: Broken sidebar links to non-existent routes cause silent navigation failures. Always verify sidebar links match App.tsx route definitions.
- **E-L02**: ErrorRetry component must be deployed on every page that uses useQuery, not just "important" pages. Partial coverage creates inconsistent error experiences.
- **E-L03**: PageHeader with breadcrumbs should be on every navigable page for consistent navigation patterns. Partial deployment creates disorienting transitions.
- **E-L04**: Video accessibility requires CC indicator, closed caption tracks, and accessible controls with aria-labels.

## F-Series Lessons (Hooks, Document Titles, Error Handling)

- **F-L01**: React useEffect calls inside conditional blocks (if statements, early returns) violate the Rules of Hooks. Always place useEffect at the top level of the component, before any conditional returns. This was found in 6 components: subjects, achievements, teacher-dashboard, ai-tools-workspace, module-detail, lesson-viewer.
- **F-L02**: window.location.reload() in error recovery loses component state and user context. Always use query refetch instead.
- **F-L03**: document.title should be set via unconditional useEffect at the top of every page component and sub-page component (certificate views, classroom details, level details, subject details).
- **F-L04**: Shared components (lesson-comments, study-tips) should have inline error messages rather than ErrorRetry, since they're embedded within pages that already have their own error handling.
- **F-L05**: Sidebar progress queries should fail silently (no error UI) since the sidebar is a persistent navigation element that shouldn't show error states.

## G-Series Lessons (Server Hardening, Auth, Role-Based UI)

- **G-L01**: Every Express GET route handler must be wrapped in try/catch with console.error and 500 JSON response. A node script can wrap all unprotected routes mechanically — no need to do this by hand.
- **G-L02**: Any route that calls getUserId(req) MUST have requireAuth middleware. Without it, getUserId returns undefined, which can cause database errors or create orphaned records.
- **G-L03**: Mixed public/private routes (like /api/academy/dashboard) that check `if (userId)` before fetching user data are acceptable as public routes. They gracefully degrade for unauthenticated users.
- **G-L04**: Hardcoded values in API responses (like completedModules: 0) are data integrity bugs. Always calculate from the database, even if the calculation is slightly more expensive.
- **G-L05**: Admin/teacher sidebar items must be filtered by user role on the client side, even though the backend already blocks unauthorized API access. Visible-but-inaccessible navigation confuses users.
- **G-L06**: wouter's Link component renders an <a> tag. Never wrap another <a> inside a Link — this creates nested anchors and browser warnings. Pass className and data-testid directly to Link.
- **G-L07**: When adding requireAuth to previously public GET routes, verify the frontend handles 401 responses gracefully (useAuth hook, conditional rendering, redirects).
- **G-L08**: Parallel subagent execution works best for client-side tasks on independent files. Server-side tasks touching the same file should be done sequentially by the main agent.

## Enforced Rules (Machine-Checkable)

These lessons have been converted into automated health checks in the MAP phase:
- No GET routes without try/catch (G-L01) → health check script
- No getUserId without requireAuth (G-L02) → grep check
- No useEffect inside conditionals (F-L01) → grep check
- No nested <a> in Link (G-L06) → grep check
- No window.location.reload (F-L02) → grep check
- No console.log in server files (cleanup) → grep check
