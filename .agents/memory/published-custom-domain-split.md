---
name: Published custom-domain split
description: Why an attached custom domain can serve stale Vercel code while Replit's primary publishing host serves a new build.
---

Do not infer that every URL listed in Replit deployment metadata serves the same binary. Verify each external hostname's actual response, API docs, and HTTP server/routing headers before giving it to a partner.

**Why:** A custom domain listed as an additional Replit URL was routed through Vercel and continued serving its independent older serverless release after a successful Replit publish. Replit's primary host and generated app host served the new endpoint; the custom domain returned the old 404 with `server: Vercel` and `x-vercel-cache: MISS`. This was not a browser cache issue.

**How to apply:** For partner handoffs, probe the exact hostname ECS will call with unauthenticated and scoped-key requests. If a custom domain and the primary host differ, use the verified primary host immediately where appropriate; deploy or reconnect the independent host separately before claiming it works. Do not fix this by repeatedly publishing the Replit build.