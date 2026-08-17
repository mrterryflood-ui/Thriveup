---
name: Health federation partner connectors
description: Durable facts about federating with HerHealth / Male Health Matters sibling platforms.
---

# Health Federation (HerHealth + Male Health Matters)

- **No credentials are needed** to federate with herhealthmatters2.com or malehealthmatters2.com — both expose public, no-auth JSON APIs. Do not ask their teams for keys before probing.
- **HerHealth has no public condition-list endpoint** — only per-condition reference lookups and search. Any "full library" view requires the partner to add a list endpoint (asked via follow-up task).
- **Male Health Matters' per-condition detail endpoint is slow/unreliable** — its condition *list* endpoint is the dependable feed; don't build features on the detail endpoint.
- **Why:** partner outages must be explicit (visible offline state + status endpoint that 503s), per honest-failure doctrine; connectivity verification only WARNs when the partner itself is down — we detect outages but never block our CI on their uptime.
