# Authentication replacement decision

## Source behavior

Replit OIDC/Passport lives in `server/replit_integrations/auth/replitAuth.ts`. It creates PostgreSQL-backed `express-session` sessions, maps the Replit OIDC `sub` directly to `users.id`, and exposes `/api/login`, `/api/callback`, `/api/logout`, and `/api/auth/user`. Many server route guards consume `req.user.claims.sub`; authorization additionally depends on existing roles, organizations, memberships, and `is_tcaf_admin`.

## Decision: Auth.js for Express + PostgreSQL

Recommend **Auth.js for Express with a PostgreSQL adapter**, using Resend magic links first and optional OAuth providers later. It is the least-disruptive path because Thriveup is already Express/Vite/PostgreSQL rather than Next.js. It can preserve the existing `users.id` as the application principal and keep authorization data in PostgreSQL. Auth.js remains library-managed rather than hosted-user-table managed; Vercel documents Auth.js as an authentication option and documents the secret/callback requirements for deployments ([reference](https://vercel.com/kb/guide/complete-guide-authentication-vercel)).

| Criterion | Auth.js + PostgreSQL | Clerk |
|---|---|---|
| Existing Express/Vite fit | Direct Express adapter path; preserves existing API/session shape | Requires replacing route/session plumbing and integrating a hosted identity API |
| Stable `users.id` | Can explicitly retain existing IDs | Clerk creates provider IDs; requires an application-to-Clerk ID crosswalk |
| Existing roles/orgs | Keep current PostgreSQL tables and guards | Clerk Organizations/RBAC can help future design, but mirroring/mapping is additional migration work |
| Operational model | App owns adapter/session tables and direct Resend delivery | Clerk owns identity/session service and requires a separate vendor configuration |
| Minimal first cutover | Yes | No |

Clerk is a valid later option: it provides Vercel Marketplace provisioning and Organizations/RBAC capabilities ([Marketplace](https://vercel.com/marketplace/clerk)). It is not selected for this phase because it increases identity migration scope.

## Migration design

1. Add new, additive Auth.js account/session/verification tables to the **Preview rehearsal database only**. Do not repurpose Replit sessions.
2. Write an adapter that returns the existing `users.id` for known accounts. Link an independent provider account to that fixed application ID only after a verified sign-in; do not match accounts by email alone without proof of control.
3. Preserve existing user, organization, membership, and role records. Audit every server route that reads `req.user`, `claims.sub`, role, or organization context; add a compatibility session principal only after server-side verification.
4. Require all users to sign in again. Replit OIDC sessions, refresh tokens, and cookies are invalid after cutover.
5. Test login, callback, logout, persistent session, unauthorized access, admin/staff/organization boundaries, and an existing user record with dependent rows.

## Names-only configuration

Production/Preview/Development: `AUTH_SECRET`, `AUTH_URL` or trusted host configuration, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `DATABASE_URL`. Add provider-specific OAuth client IDs/secrets only when that provider is approved. Never use `NEXT_PUBLIC_` for secrets. Preview callback URLs must be explicitly allowed or derived safely per the selected provider.
