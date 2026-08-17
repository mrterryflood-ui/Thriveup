---
name: Nonprofit identity lookup (Navigator)
description: How the Navigator answers "is org X a real nonprofit / what's their EIN, 501c3 status, funding history" questions without fabricating.
---

Before this existed, the Navigator's free-form chat had **no** structured source for a named organization's legal identity (EIN, 501(c)(3) status, Form 990 financials) and never enabled its own AI provider's live web-search capability for ordinary chat — so it correctly (per the anti-fabrication preamble) declined to state facts it didn't have, which read as a bug to users even though it was honest behavior.

Fix: `server/nonprofit-lookup.ts` calls ProPublica's Nonprofit Explorer API (free, keyless, IRS-sourced) for EIN/501(c) subsection/Form 990 financials. `server/navigator-routes.ts` detects nonprofit-identity intent (keywords like "501c3", "EIN", "funding history") plus a capitalized-name heuristic, then also fires a Perplexity web-search call (`perplexityResearch` in `server/ai-provider.ts`) for mission/website facts the IRS record doesn't carry. Both are injected as context blocks before the AI responds.

**Why this shape:** IRS/ProPublica data is verifiable and narrow (identity/financials only); web search fills in what the IRS record structurally cannot (mission, website, news) — kept as two distinct sources so the AI can cite which claim came from where, per the anti-fabrication rule.

**Distinct from Census/community data:** `server/community-intel.ts` (microGeographies) and `server/neighborhood-routes.ts` answer *place*-based demographic questions (ZIP/county income, poverty rate). Named-organization identity is a completely different data category — don't conflate the two when a user asks "does the platform know about city X" vs "does the platform know about org Y".

**GPP is not a usable data source for this**: GrantPathPro's inbound endpoints (their side) are blocked by their own Clerk JWT auth wall (see `gpp-clerk-wall` context in `scripts/verify-gpp-endpoint.ts` failures) — this blocks pushes TO them, and would equally block any pull FROM them, since it's the same auth wall. Not something fixable on our side.
