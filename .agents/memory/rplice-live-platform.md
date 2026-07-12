---
name: RPLICE Live Platform
description: bettersciencelab.com API surface, what works publicly, what needs auth, and the client-side filter pattern
---

## Correct live URL
`https://www.bettersciencelab.com` (SSL cert is on www subdomain — bare domain gets SSL error)

Old dead URL (never use): `https://salp-science--mrterryflood.replit.app`

## Public API endpoints (no auth required)
| Endpoint | Result |
|---|---|
| GET /api/research | 49 curated implementation science studies (CFIR 24, RE-AIM 25, EPIS 9, PRISM 7, TDF 6, i-PARIHS 4) |
| GET /api/frameworks/list | RE-AIM + EPIS with full dimensions / key questions / indicators / metrics |
| GET /api/v1/health | `{"status":"ok","version":"1.0.0","platform":"RPLICE"}` |

## Broken / auth-gated endpoints
- `GET /api/research/search?q=...` — requires CSRF token; returns `[]` or `{"error":"CSRF token required"}`. **Do not use.** Fetch /api/research and filter client-side.
- `GET /api/ecosystem/status` — 404. Does not exist.
- `GET /api/grants` — 401 ("Authentication required"). Needs Bearer API key.
- `GET /api/v1/frameworks` — 401 ("Missing or invalid Authorization header. Use: Bearer <api_key>"). Has CFIR, PRISM, TDF, i-PARIHS beyond the public 2.
- `GET /api/research/categories|tags|sources|count` — 401.

## Client-side filter pattern
```ts
// Fetch all 49 studies, then filter by keywords locally
const all = await fetchRplice("/api/research");
const filtered = all.filter(s => {
  const text = [s.title, s.abstract, s.journal, ...s.keywords, ...s.frameworks, s.category].join(" ").toLowerCase();
  return keywords.some(k => text.includes(k.toLowerCase()));
});
// Always fall back to full library if nothing matches
const result = filtered.length > 0 ? filtered : all;
```

## Code locations
- `server/rplice-intelligence.ts` — `RPLICE_BASE`, `filterResearchByKeywords()`, `fetchRpliceLive()`
- `server/rplice-tools.ts` — `RPLICE_BASE`, `filterRpliceResearch()`, `fetchRplice()`

## Platform scale
bettersciencelab.com has 100+ tool pages (confirmed via sitemap): CFIR tools, SALP distributed/monitor/validation, grant-alignment/finder, equity-evaluation, federal-integrations, external-data-feeds, GIS, disease-surveillance, climate/heat-prevention, barriers-facilitators-wizard, adaptation-wizard, sustainability-wizard, CHW hub, needs-assessment, and 80+ more. The ~1000 live sources are aggregated internally and surfaced through the authenticated API — not direct public endpoints.

**Why:** The old URL was a Replit dev repl that was never published to production. bettersciencelab.com is the actual deployed platform. The SSL cert mismatch (bare vs www) caused exit code 60 errors when not using www.

**How to apply:** Always use `https://www.bettersciencelab.com` as RPLICE_BASE. Never call /api/research/search or /api/ecosystem/status. If Dr. Flood provides a Bearer API key, wire it into fetchRplice headers to unlock /api/v1/frameworks and /api/grants.
