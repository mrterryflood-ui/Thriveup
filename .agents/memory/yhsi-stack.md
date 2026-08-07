---
name: YHSI implementation stack
description: HUD youth homelessness grant (CPD-2600-DC-0035) modules — where they live and the auth/suppression rules they must keep.
---

# YHSI Stack (built 2026-08-07)

- Tables: `yhsi_*` at end of `shared/schema.ts` (participants, outcome snapshots, referrals, touchpoints, voice entries, reports). Routes: `server/yhsi-routes.ts`, registered in `server/routes.ts`.
- Surfaces: `/youth-voice` (public — no login by design, capability token shown once, header `x-voice-token` only), `/yhsi-ops` (staff, RequireAuth adminOnly).
- **Rule — role checks must hit the DB.** `req.user.role` is never populated by the auth layer; any session-only role check is silently nonfunctional (every staff user gets 403). Resolve via `storage.getUser(claims.sub)` like the main `requireAdmin`.
  **Why:** architect verify pass caught this as a critical PII-exposure/lockout bug on first build.
  **How to apply:** any new staff/admin guard in feature route modules.
- **Rule — YHSI metrics are suppression-first.** Every released count passes the floor-of-5 `suppress()`; rates need denominator ≥ 5; biannual reports persist only the suppressed representation and scope EVERY measure to the reporting period by its own timestamp.
- Navigator youth mode: opt-in `youthMode: true` in request body appends `[YOUTH MODE]` block (McKinney-Vento rights, FAFSA independent status, safety-first). Chainweb has `youth_homelessness` template (cited sources only — never add uncited coefficients).
- Voice entries marked `incorporated` REQUIRE an impact note (server-enforced) — that note is the HUD Youth Leadership certification evidence.

## Grant sustainability layer (increment 2)
- Outcome snapshots carry funder-language fields (HS completion, post-secondary, livable wage, stable-adult connections, MH scale+score); outcomes summary reports rates per milestone (30/90/180/365d, 6/12mo) — suppressed below floor 5.
- MH scores must NEVER be averaged across scales (PHQ-9 vs GAD-7 vs CANS are incomparable) — always group by mh_scale_used.
- Entitlements (Chafee/ETV/etc), fidelity observations (5 SAMHSA domains), and HUD milestones tables exist; all vocabularies are server-enforced zod enums — free-form values would silently vanish from fixed-milestone summaries.
- Repo baseline has ~100 pre-existing tsc TS2769 errors from a drizzle eq() typing quirk (project-wide, incl. server/routes.ts); don't attribute them to new work — diff error counts against a stash.

## Durable rules (from architect reviews)
- PIT/official-stat data policy: populate ONLY from staff import of the official HUD file (huduser.gov blocks automated downloads); imports must be all-or-nothing transactional with strict whole-number parsing — partial imports misstate totals.
- Auth gating: use RequireAuth staffOnly (mirrors server requireStaff: admin/teacher/case_manager) for pages backed by requireStaff endpoints — adminOnly locks out server-authorized staff.
- UI rule: never render an empty-state message when a query errored — show explicit error/retry, or staff mistake outages for absent records.
- Program knowledge layer: all youth-facing eligibility/rights content lives in a single citation-backed module sourced ONLY from uploaded federal docs; screeners must capture EVERY condition in the source (unaccompanied status, care-after-14 timing, exact age bands) before showing "likely eligible" — overstated eligibility is a fabrication failure. Kansas Chafee runs to 21 (not on the 31-state age-23 list).
- Eligibility screening rule (constitutional): shared/foster-eligibility.ts is the ONLY place eligibility logic may live; any consumer screening from records that lack a required fact must cap those results at "maybe" (screenParticipantGaps pattern) — age is never a proxy for an unrecorded fact. Boundary + anti-overstatement sweeps: scripts/test-foster-eligibility.ts.
