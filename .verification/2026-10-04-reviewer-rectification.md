# Independent reviewer rectification — magnet IA build

## Role and authority
Independent review of `chore/replit-exit-inventory` @ `1f62a291` (the completed IA build), per the user's "verify the complete build and rectify any gaps" instruction. Non-main branch push authorized; pull, production flip, publication, and provider redesign are not.

## Verified (independent of the builder's own record)
- Registry is the single nav source: `shared/route-registry.types.ts` (7 outcomes, 10 audiences, access tiers, upstream/downstream/guide/sources), `route-nav.ts` (manifest reader + `canSeeRoute` + legacy predicate AND), classified lane files.
- Six `/start/*` outcome landings wired in `client/src/App.tsx` (594–599); `PageFrame` mounted app-wide in `AppLayoutInner` (1182).
- `/tools` directory is registry-driven and outcome-grouped with audience filter, search, "Leads to" connections, and progressive disclosure (12/group + "Show all"). This resolves the original "scattered listing" complaint.
- Health endpoint exists at `/health` (`server/index.ts:29`, `vercel.json` rewrite). The earlier `/api/health` 404 was the wrong path, not a missing endpoint.
- Honest-limit disclosures present throughout landings: illustrative AI imagery labeled, "no default city is assumed", map loads only on request, evidence "a starting point, not a verdict".

## Defect found and fixed
The six outcome landings were not treated as focused entries, so the global floating `AINavigator` and `ContextualHelpButton` rendered on them and collided with the hero's bottom-right "Illustrative AI-generated imagery" badge (visible on `learn`, `connect`, `fund` at 1440px).

- **Fix**: added `location.startsWith("/start/")` to the `focusedEntry` predicate in `client/src/App.tsx` (line 1140), matching the existing treatment of `/hub`, `/workspaces`, `/community-gravity`, and `/academy/lessons`.
- **Why**: the landings are deliberately focused field-guide pages with their own clean navigation; the floating Navigator pill overlapped the disclosure badge at the viewport corner. Removing it here is consistent with the other focused pages and leaves the Navigator available on every interior tool page.

## Observed, not a defect
The sidebar's last item (e.g. "Build a safety plan") appears half-cut at the bottom of the viewport in the 1440px screenshots. The sidebar is height-constrained to `h-screen` and `SidebarContent` is `flex-1 overflow-auto` (`ui/sidebar.tsx`), so this is the normal scroll fold of a correctly scrolling sidebar — not a hard clip.

## Limits
- This fix is a single, type-safe predicate change; full-project `tsc`/lint/build/Playwright were not rerun on this reviewer change (repo dependencies not reinstalled in the review clone). The edit adds one `String.startsWith` term to an existing boolean OR chain already using the same pattern and method.
- Did not exercise live authenticated/staff acceptance, provider cutover, CVR/RPLICE net-new builds, or the digest/welcome scheduler — all intentionally deferred to the cutover workstream.
