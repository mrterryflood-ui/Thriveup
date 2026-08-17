# Navigation & Findability Audit — August 2026 (Task: make existing tools findable)

## Scope & method
Static audit of `client/src/App.tsx` (~340 registered routes), the sidebar
(`client/src/components/app-sidebar.tsx`), the homepage (`client/src/pages/landing.tsx`),
and the mobile bottom tab bar. "Reachable" = linked from a surface a first-time,
signed-out visitor sees on `/` (homepage content, sidebar, tab bar) within two clicks.
The click-graph is now verified mechanically by `scripts/verify-two-click-reachability.ts`
(BFS over App.tsx route table + string-literal links; sidebar items flagged
`authOnly`/`adminOnly` are excluded from the public depth-0 surface, and shared
link components imported by pages — e.g. `RelatedTools` — are traversed;
chained into the `directory-links` validation gate) alongside the existing one-click proxy
`scripts/verify-tool-reachability.ts` and `scripts/verify-sidebar-routes.ts`.

## What existed before this pass

| Surface | State |
|---|---|
| Sidebar | 13 collapsible hubs + CTX hub, ~230 items, organized by **program/hub names** ("Get Funded", "Where We Operate", "CEDS Regional Alignment"), all collapsed by default. Big tools (Benefits Screener, Resource Finder) were 2 clicks deep *inside* a hub a visitor had to guess. |
| Homepage | 6 pathway cards (benefits screener, SDOH explorer, ecosystem story, partner dashboard, affiliate, curriculum). **No card for "find help near me", "talk to someone" (Navigator), or Health & Wellness.** |
| Bottom tab bar | Task-agnostic pillars (Serve/Fund/Grow/Connect) — fine, kept. |
| Cross-links | Benefits Screener results and Health & Wellness already had "what else can help" strips. Resource Finder, Get Help, Benefits Command Center, and the guided how-to-apply flow **dead-ended** (no forward links to sibling tools). |

## Buried / mislabeled findings (and disposition)

1. **AI Navigator** (`/navigator`) — only inside "Academy & Learning" hub as
   "Navigator (AI)". → Now a top-of-sidebar quick task ("Talk to someone") and a
   homepage pathway card.
2. **Get Help Now** (`/get-help`) — inside "Benefits & Intake" hub only. → Quick
   task + homepage "Find help near me" card.
3. **Health & Wellness Hub** (`/health-wellness`) — inside "Prevention & Health"
   hub only; no homepage link. → Quick task + homepage card.
4. **Guided benefits application** (`/benefits/how-to-apply/:program`) — reachable
   only from screener result rows and Resource Finder cards. → Now also in every
   RelatedTools strip; verified at depth ≤ 2 by the new gate.
5. **Resource Finder** (`/resources`) — sidebar only. → Quick task; homepage card
   routes through `/get-help`, which links it at depth 2.
6. **Admin-walled routes shown to the public** — sidebar items pointing at
   `RequireAuth adminOnly` routes were visible to signed-out/regular users
   (a login-wall dead end): `/grants`, `/my-grants`, `/rfp-fidelity`,
   `/grant-narrative`, `/loi-writer`, `/grant-packages`, `/won-proposals`,
   `/teaming-network`, `/apex-accelerators`, `/grants/sedgwick-vitality`,
   `/healthcare-grants`, `/regional-briefing`, `/yhsi-ops`,
   `/wioa-outcomes`. → All now flagged `adminOnly` in the sidebar so the public
   menu stays short and honest. `/esign` and `/yhsi-system` are `staffOnly`
   routes (teacher/case-manager/facilitator/staff allowed), so their sidebar
   items stay `authOnly` — hidden from signed-out visitors but visible to all
   signed-in users, preserving staff access.
7. **Routes with no sidebar/homepage entry at all** (reachable only by URL or from
   deep pages): share/token pages (`/brief/:id`, `/status/:token`, `/org-confirm/:token`,
   `/funder/:token`, `/esign/invite/:id`) — *by design* (token-scoped);
   demo/deck pages (`/childinc-deck`, `/presentation`, `/roku-ads`, `/business-card`,
   `/donor-receipt-demo`, `/orchestra`) — *intentional, not for public nav*;
   legacy aliases (30+ `<Redirect>` routes) — fine.

## Changes made in this pass

1. **Sidebar "I want to…" quick-task section** (always expanded, top of sidebar):
   Apply for benefits → `/benefits-screener` · Find help near me → `/get-help` ·
   Talk to someone (AI Navigator) → `/navigator` · Health & wellness →
   `/health-wellness` · Learn new skills → `/curriculum`. Included in sidebar search corpus.
2. **Homepage pathway cards** for the three missing top intents: Find help near me,
   Talk to someone, Health & wellness.
3. **Shared `RelatedTools` cross-link strip** (`client/src/components/related-tools.tsx`)
   added to: Resource Finder, Get Help, Benefits Command Center, and the guided
   how-to-apply flow (screener + Health & Wellness already had equivalent strips).
   Every major tool now points forward instead of dead-ending.
4. **Public menu hygiene**: 14 admin-walled sidebar entries now `adminOnly`;
   the two `staffOnly`-routed entries remain `authOnly` so staff keep them.
5. **Automated two-click gate**: `scripts/verify-two-click-reachability.ts`
   asserts 12 major public tools stay within two clicks of the homepage; chained
   into the `directory-links` validation gate so a future nav refactor can't
   silently orphan a tool.

## Verified click paths (mechanically checked, all ≤ 2 clicks)
Benefits Screener 1 · Guided apply 2 · Benefits Command Center 1 · Resource
Finder 1 · Get Help 1 · Resource Directory 1 · AI Navigator 1 · Health &
Wellness 1 · Curriculum 1 · Youth Voice 1 · Foster Youth Hub 1 · Safe Passage 1.

## Out of scope (unchanged, per task)
Visual redesign, feature internals, mobile app. Bottom tab bar pillar naming kept.
