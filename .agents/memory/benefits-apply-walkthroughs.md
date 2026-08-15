---
name: Benefits How-to-Apply walkthroughs
description: Guided per-program application pages; parity gate keeps server catalog, shared meta, and screener cards in lockstep.
---

- `shared/benefits-apply-guides.ts` is the single source for program meta/docs/stages; server `BENEFIT_NAVIGATION` (benefits-screener-fix.ts) is the program catalog. Any new program must be added to BOTH — `scripts/verify-how-to-apply.ts` (chained into the directory-links gate) fails on any one-sided add.
- **Why:** programs were previously silently dropped when the frontend's static info map didn't know a backend code.
- **How to apply:** adding/renaming a benefit program → update BENEFIT_NAVIGATION, APPLY_PROGRAM_META, screener BENEFIT_INFO together, then run the gate.
- Local office lookup deliberately reuses the resource search API (no true GIS office endpoint exists) plus each state's external officeFinder URL — decision, don't build a parallel office dataset.
- Public rate limiters must key on `req.ip` (trust proxy is set at boot) — never the raw X-Forwarded-For header, which lets callers mint unlimited fresh buckets. A spoofed-header probe guards this.
- New columns used by public inserts need an idempotent boot-time `ADD COLUMN IF NOT EXISTS` migration, or deployed databases reject every submission after deploy.
