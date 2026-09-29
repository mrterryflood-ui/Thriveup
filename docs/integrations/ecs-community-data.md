# ECS of NC: pull ThriveUp community data

Use an existing **Emergency Charitable Services of NC** partner key on the ECS **server only**. Do not put the key in browser JavaScript, a public URL, client-side configuration, or this document. The two active ECS keys have `community:read` and `benefits:read`; only one has `impact:read`. No new key is required to use the community and resource routes.

## Server-to-server setup

1. On ECS's server, configure a private environment variable such as `THRIVEUP_ECS_PARTNER_KEY` with the key already held by ECS. Do not expose it in a `PUBLIC_` or `NEXT_PUBLIC_` variable.
2. Use the verified Replit publishing host `https://easyailearning.com` as the API base URL. Call `GET https://easyailearning.com/api/partner/v1/health` with header `x-partner-key: <server-side key>`. The response identifies the partner and granted scopes. A `401` means the key was not accepted; a `403` on a data route means its scope is missing.
3. Call the read routes from the ECS server, then expose the approved response through ECS's own same-origin backend route. Cache generated briefs/stories rather than calling per visitor. Do not submit resident names, histories, or other identifying information.

```
GET /api/partner/v1/community-opportunities?state=NC&limit=20
GET /api/partner/v1/community-opportunities?state=NC&focus=housing&limit=20
GET /api/partner/v1/community-story?location=<URL-encoded county or ZIP>&orgName=<URL-encoded ECS name>
GET /api/partner/v1/community-brief?location=<URL-encoded county or ZIP>
GET /api/partner/v1/benefits
GET /api/partner/v1/impact                  (only if /health lists impact:read)
```

The opportunities response has `fundingCandidates` for nonprofit staff, `residentResources` for citizens, and a `fundingSearch` request template for fresh notices. It includes source links, dates, geographic evidence, and explicit verification limits. **A funding candidate is not a confirmed open award or eligibility finding.** If no stored grant listing mentions NC or nationwide coverage, `fundingCandidates` is empty; that does not mean there is no funding. The resident directory contains NC state-level and federal links, not verified provider availability in ECS's counties. Always follow the original source link before applying or referring. The `focus` filter searches funding titles/descriptions only; it does not filter resident resources.

For a **fresh federal search** initiated by ECS staff, the existing public `POST /api/grants/live-search` accepts JSON such as `{"query":"North Carolina nonprofit housing"}`. It searches Grants.gov notices currently marked posted and returns links to original notices; it is rate-limited and keyword matching does **not** prove ECS eligibility or county coverage. Check close dates and eligibility on Grants.gov. Do not fire searches for every visitor or submit resident details in the query. This is complementary to, not a replacement for, the source-labeled candidate feed.

Generated community story and brief routes use `community:read` and are rate-limited (10 stories and 20 briefs per hour per key). Handle `429` with a cached response or retry later, and surface upstream `5xx` errors rather than showing fabricated results. The opportunities route does not expose private grant workspaces, person-level reports, internal AI analysis, or staff dashboards.

The published contract at `https://easyailearning.com/api/partner/v1/docs` lists this route. On 2026-09-28, the same route on `thrivingcommunitiesforall.com` still returned 404: that hostname was served by a separate Vercel deployment, not the newly published Replit build. Do not substitute that hostname until its Vercel deployment or routing has been updated and independently verified. **A working route on the Replit publishing host does not prove ECS has configured its backend or that its specific key works.**