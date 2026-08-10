---
name: Public endpoint doctrine
description: How to gate flagship "no account required" endpoints without login walls or data leaks.
---
Rule: never fix abuse risk on a publicly-promised feature with requireAuth — a login wall silently kills the flagship promise ("no account required") and the client shows a generic error, so nobody notices for weeks.
**Why:** the Community Impact analyzer (community-brief) was 401-dead in production; every anonymous visitor saw "Could not analyze this location."
**How to apply:** protect anonymous endpoints with (1) per-IP rate limit using `req.ip` ONLY (app runs trust proxy = 1; never parse raw X-Forwarded-For — client-forgeable), (2) TTL/LRU response cache checked before the limiter, (3) clamped numeric params, and (4) an anon-safe projection: strip internal blocks (e.g. RPLICE intelligence — globally-queried action plans/baselines) from anonymous responses; attach them only for authed sessions and never cache the authed variant. Assert the contract in security-probes (anon reachable + no PII/internal fields), not just 401 probes.
Also: `generateAIJSON(prompt, systemPrompt?)` — 2nd arg is a STRING system prompt, not a JSON shape hint; passing an object crashes withEthicalPreamble (.trim).
