---
name: Benefits guided-apply architecture
description: How the benefits screener's "How to Apply" walkthrough is wired — where program data lives, and the SSE gotcha for embedding Navigator chat elsewhere.
---

- Program catalog is split across three files that must stay in sync: `server/benefits-screener-fix.ts` (eligibility rules + BENEFIT_NAVIGATION doc/value data), `server/benefits-local-nav.ts` (FEDERAL/STATE_NAV applicationUrl/officeFinder/hotline), and `client/src/pages/benefits-screener.tsx`'s `BENEFIT_INFO` map (display name/icon/color/docs). Adding a program to only the server side means the frontend silently drops its result card — this caused TANF/CCDF/LIHEAP/Section8/VeteransBenefits to never render until fixed 2026-08-15.
- Unemployment Insurance and Workers' Comp are state-run with no single federal portal, so their `applicationUrl`/`officeFinder` point to national locators (CareerOneStop, DOL state list) rather than a single apply site — disclosed in the `notes` field. Per-state links can be added to `STATE_NAV` later without touching the frontend.
- `/api/navigator/chat` is a Server-Sent Events stream, not JSON — `res.json()` on its response will not work. Any new UI embedding this endpoint must read `response.body.getReader()` and accumulate `parsed.content` chunks from `data: ` lines (see `client/src/components/ai-navigator.tsx` or the Apply Coach in `benefits-screener.tsx` for the pattern).
