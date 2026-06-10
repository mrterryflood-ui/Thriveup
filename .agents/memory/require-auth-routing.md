---
name: RequireAuth + wouter routing pattern
description: Correct order for protecting routes — Route wraps RequireAuth wraps Page. Inverting causes the auth wall to show on ALL pages.
---

## The Rule

Always: `<Route path="..."><RequireAuth ...><PageComponent /></RequireAuth></Route>`

Never: `<RequireAuth ...><Route path="..." component={...} /></RequireAuth>`

## Why

RequireAuth renders unconditionally — it always checks auth and either shows the auth wall or renders children. When placed OUTSIDE a Route, it renders on EVERY page navigation (not just the one path), causing the auth wall to bleed into completely unrelated routes.

The Route component gates its children by path. So Route must be the outer wrapper so that RequireAuth only ever mounts when the path actually matches.

## How to Apply

When adding any new admin-only or auth-gated route, follow the existing pattern:
```jsx
<Route path="/my-internal-page">
  <RequireAuth adminOnly reason="Explain why restricted.">
    <MyInternalPage />
  </RequireAuth>
</Route>
```

This pattern is used consistently throughout App.tsx for all existing protected routes (e.g. /grants, /workforce-dashboard, /grant-command-center, /voice/:slug/insights).

## What Happened

Discovered June 2026 when wrapping Route inside RequireAuth caused the St. David's WAB2 admin wall ("Internal Workspace") to appear on /benefits-screener, /coalition, /foster-youth, and all other pages simultaneously.
