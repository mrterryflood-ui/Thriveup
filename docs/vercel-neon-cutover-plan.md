# Vercel + Neon production cutover plan

Status: **plan only**. This branch adds Vercel Analytics instrumentation; it does not change production secrets, databases, DNS, data, Replit, or deployments. Source evidence comes from [PR #1](https://github.com/mrterryflood-ui/Thriveup/pull/1) and `main` at `1638cd3`.

## Architecture and approval gates

| Phase | Outcome | Approval required before proceeding |
|---|---|---|
| 0. Confirm source | Owner privately verifies the running Replit production `DATABASE_URL` destination and production storage namespace | Database and storage source confirmation |
| 1. Rehearse Neon | New, isolated Neon project/database; restore a logical PostgreSQL backup and validate it | Owner approval of rehearsal results |
| 2. Preview compatibility | Preview-only Neon branch/database, independent auth sandbox, Blob sandbox, direct AI test credentials | Preview test sign-off |
| 3. Implement adapters | PostgreSQL remains the application database; replace Replit-specific auth/storage/AI/job integrations | Code-review approval |
| 4. Cut over | Final backup, reconcile write window, deploy, validate | Explicit production cutover approval |
| 5. Retire | Archive Replit only after agreed stability window and rollback expiration | Explicit retirement approval |

## PostgreSQL evidence and dependencies

The application uses `pg` + Drizzle in `server/storage.ts`, `DATABASE_URL` in `drizzle.config.ts`, and committed SQL migration files via `server/run-migrations.ts`. It is not a Convex app. PR #1 reports a Replit production catalog with 436 public tables, but that catalog is **not proof** that the running deployment uses that database; do not use it as the cutover source until the owner verifies the production destination.

Transaction-sensitive code includes Drizzle transactions across `server/storage.ts`, `server/nonprofit-events-routes.ts`, `server/org-profile-routes.ts`, `server/chainweb-routes.ts`, `server/partner-api-routes.ts`, `server/claim-chain.ts`, and other route modules. The code uses `SELECT ... FOR UPDATE` and PostgreSQL advisory locks in `server/storage.ts`, `server/studio-registry-sync.ts`, `server/run-migrations.ts`, `server/chainweb-routes.ts`, `server/partner-api-routes.ts`, and `server/claim-chain.ts`. Neon PostgreSQL preserves these PostgreSQL semantics; no application-model conversion is planned.

## Serverless compatibility inventory

- `server/index.ts` correctly skips startup migrations, interval jobs, and `listen()` when `VERCEL` is set. Therefore production schema changes must be reviewed and applied separately—never with `drizzle-kit push` against production.
- Long-running timers are not serverless-safe: AI smoke tests, community-brief probes, studio retention sweep, college-access cleanup, translation cleanup, agency refresh, video work, and extensive ecosystem connector timers. Classify each job before implementation as Vercel Cron (short, idempotent HTTP task), queue/external worker (long, retrying, high-volume), or manual/retired.
- Function request timeouts and streaming behavior need Preview validation for AI/audio/video. Existing `vercel.json` allows the API function 60 seconds; do not assume that is enough for current AI or file work.

## Safe Neon rehearsal procedure

1. Owner creates a Neon account/project under independently controlled ownership; do not install or connect the Vercel integration yet.
2. Owner verifies the actual source production database privately, takes/retains a provider backup, and creates an encrypted logical `pg_dump` outside GitHub, Vercel, Replit workspaces, and chat.
3. Create an isolated **rehearsal** Neon database (not the future production database). Restore with `pg_restore --no-owner --no-acl --exit-on-error`; do not run source migration scripts or `drizzle-kit push`.
4. Validate PostgreSQL version/extensions, schema archive/TOC, migration history, table counts from the same snapshot, FK/unique/check constraints, sequences, role/organization relationships, representative writes/transactions/locks, and application read-only smoke paths.
5. Record checksums, counts, exceptions, and performance results in restricted operator storage. Destroy/recreate the rehearsal database only after owner approval; retain the source backup.
6. Only after a passed rehearsal, create separate Neon Production, Preview, and Development databases/branches. Add target `DATABASE_URL` values only through the relevant protected dashboards—never source control or chat.

Neon is available through the [Vercel Marketplace](https://vercel.com/marketplace/neon), including preview database branches, but installation/connection is intentionally deferred. Vercel’s [Postgres guidance](https://vercel.com/docs/postgres) confirms new Postgres is delivered through Marketplace providers.

## Cutover and rollback

At cutover, announce a write window; take final source backup and object manifest; replay or reconcile writes made since the rehearsal snapshot; deploy the already-validated production build; validate the checklist; then observe errors and data integrity. Keep Replit deployment, database, storage, credentials, and DNS unchanged throughout the agreed rollback window. Rollback means restore routing/deployment and source configuration to Replit while preserving Neon/Blob artifacts for diagnosis—never delete source data as a rollback step.
