---
name: Access truth = route registry
description: Navigation visibility has exactly one predicate (shared/route-access over the registry); legacy sidebar flags are presentation-only and group flags lie.
---
Rule: any navigation surface decides visibility with `canOpenPath(path, viewer)` from `shared/route-access`. Never reintroduce a sidebar-flag or palette-local permission check.

**Why:** two truths (registry AND legacy sidebar predicate) drifted silently — the sidebar applies admin flags per GROUP, so items like /classrooms or /funder-dashboard inherited "admin" although their real floor (RequireAuth / page gate) was authenticated or staff, and five pages that serve anonymous users carried stale authOnly flags. The old permission-sync gate only checked that paths *appeared* in the sidebar; five "restricted" destinations were public everywhere and passed unnoticed.

**How to apply:** change access in the lane files (`shared/route-registry/lane-*.ts`) and regenerate; `verify-navigation-permission-sync.ts` fails on any legacy-stricter drift unless evidence is recorded in `reconciledLegacyDrift`. Remote registry JSON can be stale against App.tsx — regenerate from the target branch's own inputs (not the local workspace, which has local-only routes) before pushing generated files.
