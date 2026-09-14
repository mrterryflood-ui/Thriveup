---
name: Navigator geography extraction
description: Safety boundary for extracting and forwarding location from free-form Navigator messages.
---

Navigator geography extraction must require explicit ZIP or location phrasing; a standalone five-digit number is not evidence of a ZIP because income, case IDs, and years are common collisions. Normalize state abbreviations and handle punctuation in multi-word cities and Washington, D.C. before forwarding geography to context, prefill, referrals, or the journey spine.

**Why:** False geography can silently steer eligibility, services, and CHW referral notes toward the wrong place. The same bounded representation must be used at persistence and every downstream read boundary.

**How to apply:** Keep extraction side-effect-free, require location grammar for state tokens, replace the stored geography atomically on a correction, and test both positive phrases and negative numeric/common-word collisions. Sanitize stored geography again at `/api/navigator/context` and `/api/navigator/prefill`; never derive downstream geography with a broader standalone-number regex.