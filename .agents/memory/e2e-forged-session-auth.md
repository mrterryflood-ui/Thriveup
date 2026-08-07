---
name: E2E authenticated-testing decision
description: How automated tests act as a signed-in user when auth is Replit OIDC.
---

# Authenticated e2e testing decision

Replit OIDC's interactive sign-in cannot be scripted from Playwright. The accepted approach: simulate only the sign-in itself by creating a session in the app's own session store (with the cookie signed using the session secret), then exercise every subsequent step — UI interactions, sign-out via the real logout endpoint, cross-device hydration — through the real flows.

**Why:** completion review rejected pure API-level tests as not proving user-visible behavior; UI-driven tests with forged sign-in were accepted.
**How to apply:** for any test needing an authenticated user, forge the session, then drive the browser UI; also insert the users row the OIDC callback would normally upsert, since some client code needs `/api/auth/user` to resolve.
