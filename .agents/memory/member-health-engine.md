---
name: Member Health Engagement Engine
description: Schema, API, and UI for the healthcare member engagement capability — plan-agnostic MCO/MA/FQHC/ACO/Commercial.
---

## Tables (8, all created via scripts/migrate-member-engagement.ts)
health_plan_orgs, hedis_measures, health_plan_members, member_care_gaps,
member_outreach_campaigns, member_outreach_touches, member_benefit_utilization,
member_chw_engagements

## Boot behavior
seedHedisMeasures() is called from server/routes.ts — idempotent, seeds all 27 NCQA measures
into hedis_measures on every boot; safe to re-run.

## API
Router: server/member-engagement-routes.ts → mounted at /api/member-engagement
All routes require authentication (req.user check) except GET /hedis-measures which is public.

## UI
client/src/pages/member-health-page.tsx — 5-tab page (~800 lines)
Route: /member-health (added to App.tsx Switch block)
Sidebar: "Member Health Engagement" under preventionHealthItems (app-sidebar.tsx)

## Critical apiRequest pattern
apiRequest signature is (method: string, url: string, data?) → Promise<Response>
The page uses local helpers (meGet/mePost/mePatch) to wrap the call and parse .json().
NEVER call apiRequest(url) — method must be the first argument.

**Why:** All previous call-site errors (TS2769, TS2554) were from missing method arg + missing .json() parse.
Drizzle-kit db:push needs TTY — use scripts/migrate-member-engagement.ts (raw SQL via db.execute) for schema changes.

## Email delivery
sendMemberEngagementEmail() is in server/email-service.ts — uses Resend via getResendClient(),
appends CAN-SPAM opt-out footer, supports optional CTA button.
