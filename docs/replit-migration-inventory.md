# ThriveUp Replit exit inventory

Snapshot: 2026-09-26. Destination stated by the owner: **Convex for application data and Vercel for hosting**. This is an inventory of the source, not a claim that the destination already works. No backup, object export, credential copy, data migration, auth replacement, deployment, or production write was performed for this document. See [the export runbook](replit-data-export-runbook.md) for operator-only steps.

## Evidence and important limits

| Source | What was verified | What it does **not** establish |
| --- | --- | --- |
| GitHub `main` at `1638cd35` and source files below | Current repository architecture and dependencies | Which optional features are enabled in production |
| Read-only **Replit production database replica** catalog, 2026-09-26 | PostgreSQL 16.15; catalog and migration counts below | That the running app's `DATABASE_URL` points to that database rather than an external database, or that replica statistics are fresh |
| Source references, not environment values | Names and uses of configuration variables | Their production values, presence, or whether a provider account can be transferred |

The production database visible through Replit's Database tool is **Replit-managed**. The deployed app uses `process.env.DATABASE_URL`; its actual connection destination has not been independently verified. The owner must check the **Production Database** Settings pane and the deployment's configured database source before treating the catalog below as the app's authoritative database. Do not use development database connection details for the production export. No connection string or secret is recorded here.

## Application and runtime

- Client: React/Vite SPA under `client/`; server: Node 20, Express 5 and TypeScript under `server/`; `script/build.ts` produces `dist/public` and `dist/index.cjs`. Replit builds with `npm run build` and runs `node ./dist/index.cjs` in an autoscale deployment (`.replit`, `package.json`).
- Repository `main` **already has a Vercel adapter**: `vercel.json` rewrites traffic to `api/index.js`, which awaits `server/index.ts` boot and hands requests to Express. On Vercel, `server/index.ts` skips SQL startup migrations, interval-based jobs, and `listen()`. This is hosting compatibility, **not** a Convex migration or a functioning replacement sign-in/storage flow. Do not confuse the adapter with a completed exit.
- The server has many Express routes and background/probe paths. On serverless Vercel, review every scheduler/interval and webhook separately; a frozen function cannot replace long-running timers. Static files are served by Vercel rather than Express when `VERCEL=1`. CORS, forwarded hosts, cookie security, streaming, function duration, and scheduled jobs need end-to-end validation at the target before cutover.
- There is no Convex schema/client integration in this repository snapshot. Existing PostgreSQL queries, migrations, SQL functions, transactions, triggers, locks and constraints cannot be redirected to Convex merely by changing `DATABASE_URL`. The current Vercel adapter still expects PostgreSQL.

## Database inventory and ownership

| Item | Observed source inventory |
| --- | --- |
| Engine | PostgreSQL 16.15 in the Replit production database replica |
| Schemas and tables | `public`: **436** tables; `_system`: **1** table. `_system` is platform-owned; do not automatically import it into Convex. |
| Public schema | 5,384 columns, 632 indexes, 666 constraints, including 146 foreign keys, 436 primary keys, 41 unique and 43 check constraints |
| Extensions | `plpgsql` observed |
| Migrations | 74 committed `migrations/*.sql` files; 74 filenames recorded in production `public.schema_migrations`, last filename `20261008_onboarding_milestone_unique.sql`. Equal counts are **not** proof that schema and data match source. |
| Model declarations | 418 `pgTable` declarations in `shared/schema.ts`; auth models also live in `shared/models/auth.ts`. This is not a one-to-one comparison with the 436 public tables. |
| Row counts | **Unknown.** Production `pg_stat_user_tables.n_live_tup` reported zero for every table. Those planner estimates are stale/unusable here, **not evidence that any table is empty**. Collect validated counts during export. |
| Seed requirements | Review `scripts/` seed sources and provenance/idempotency checks before target import. Do not regenerate user or business records from seeds; distinguish reference/demo data from production records. |

DB connection and migration source: `server/storage.ts` creates the `pg` pool and Drizzle client; `drizzle.config.ts` uses `DATABASE_URL`; `server/run-migrations.ts` runs committed SQL in filename order and records it in `schema_migrations` on the long-running host. Replit's development and production databases are distinct. The Vercel path deliberately skips this startup runner; do **not** run `drizzle-kit push` against production as part of this inventory.

**Convex migration requirement:** keep a full PostgreSQL logical backup as the reversible source of truth, then design Convex documents/indexes/permissions and transform application records in dependency order. Preserve source IDs and an old-ID-to-new-ID crosswalk for users, organizations, relationships, referrals, journeys and file references. Audit precision (money/numeric), timestamps/time zones, JSONB, unique/check constraints, FKs, deletes/cascades, SQL joins, transactions and row-level authorization. Rebuild only approved reference data. Validate per-table counts, relationship integrity and representative authorized workflows before switching writes. A PostgreSQL dump is **not** directly importable as a complete Convex app model.

### Data families and reconciliation checklist

- Identity and relationships: `users`, `sessions`, organizations, memberships/roles, user-owned and organization-owned records. Enumerate all FK edges using the runbook query, not guessed joins.
- Services and outcomes: referrals, benefits/application journeys, CHW/YHSI/youth records, community and county metrics, partner/API entities, audit/provenance records. Treat sensitive records and small cohorts as restricted.
- Operational state: `schema_migrations`, job/probe state, partner IDs and signed tokens. Do not carry live sessions, expired tokens or platform internals across as active credentials.
- Generate the complete **table/column/index/constraint inventory and per-table counts** with the runbook's read-only SQL and schema-only `pg_dump`. The aggregate census above is not a substitute for that archive. Compare the live inventory against the 74 migrations and `shared/schema.ts` before designing the Convex mapping.

## Authentication and authorization

`server/replit_integrations/auth/replitAuth.ts` uses Passport, `openid-client`, Replit OIDC (default issuer `https://replit.com/oidc`), `REPL_ID`, discovery, and `openid email profile offline_access`. The entry points are `/api/login`, `/api/callback`, `/api/logout`; `/api/auth/user` is in `server/replit_integrations/auth/routes.ts`. The OIDC callback URL is constructed as `https://<deployment-domain>/api/callback`. Session middleware is `express-session` with `connect-pg-simple` when `DATABASE_URL` is set, `SESSION_SECRET` for signing, and a seven-day TTL; without a database there is a temporary in-memory store, **not** a durable migration path. Protected server routes depend on `isAuthenticated`, Passport sessions, and additional DB-backed role/tenant checks throughout `server/`. Client route guards and API callers must be reviewed with them.

The auth-specific schema in `shared/models/auth.ts` contains `users(id, email, first_name, last_name, profile_image_url, is_tcaf_admin, created_at, updated_at)` and `sessions(sid, sess, expire)`. `server/replit_integrations/auth/storage.ts` upserts the user by `id`; the OIDC verification uses `claims.sub` as that ID. Do not assume email is verified, stable, or an appropriate merge key. Membership and authorization are also encoded in other application tables and route guards, not just `is_tcaf_admin`. No replacement auth provider or account/session schema has been selected.

**Current off-Replit behavior:** when `REPL_ID` is absent, `replitAuth.ts` keeps public and partner-key paths bootable but returns 503 for sign-in/callback; session-authenticated endpoints are unavailable. It is a deliberate failure state, not a migrated login. Existing Replit OIDC credentials and active `sessions` rows should not be carried into a new identity provider as valid sessions.

**Safe target plan, provider-neutral:** choose the new identity provider with the owner; map each Replit `sub` to one new subject in an explicit crosswalk; preserve user IDs or rewrite all FKs consistently; reconcile email only with proof of ownership; copy profiles, organization relationships and privileges without escalating roles; stage test accounts and dual-run verification; make sessions reauthenticate at cutover. Define server and client route guards, callback/logout URLs and role checks for the chosen provider before any production cutover. **Auth.js is one possible option, not an assumption.**

## Object storage and files

`server/replit_integrations/object_storage/objectStorage.ts` uses `@google-cloud/storage` with credentials from a **Replit localhost sidecar** (`127.0.0.1:1106`). The runtime roots come from `PRIVATE_OBJECT_DIR` and comma-separated `PUBLIC_OBJECT_SEARCH_PATHS`; their actual bucket/path values were not read. The wrapper stores private upload entities as `/objects/uploads/<uuid>` and searches configured public prefixes. `server/replit_integrations/object_storage/routes.ts` exposes authenticated `POST /api/uploads/request-url` and gated `GET /objects/*path`. Other consumers include `server/org-documents-routes.ts`, `server/foster-youth-intake-routes.ts`, `client/src/hooks/use-upload.ts`, `client/src/components/multi-file-upload.tsx`, and `client/src/pages/org-documents-library.tsx`. No standalone generic object-delete endpoint was identified in the primary wrapper; audit application-level deletion and retention paths before transfer.

`server/replit_integrations/object_storage/objectAcl.ts` stores an ACL policy in object custom metadata under `custom:aclPolicy` (visibility, owner, rules). Access is not equivalent to a public URL: preserve metadata **and** database ownership/organization relationships. A file manifest needs environment, bucket/prefix/key, object path used by the app, MIME type, bytes, hash, custom metadata/ACL, owner and organization join, visibility, references, missing objects, and orphans. Neither production bucket contents nor object count was enumerated in this task. Export only after verifying which production namespace the authorized SDK can access; development storage is not evidence of a production export. Destination storage (Convex file storage, Vercel Blob, or other) is **undecided**; do not rewrite URLs or transfer files yet.

## AI and external integrations

`server/ai-provider.ts` selects Gemini, direct Anthropic, OpenRouter-hosted Claude/Perplexity/DeepSeek, direct OpenAI, or Replit AI Integration OpenAI depending on configured keys/base URLs; model IDs and ordering are in that file. Replit-specific chat/image/audio clients live in `server/replit_integrations/{chat,image,audio}/`; feature call sites span Navigator, Chainweb, benefits, research, curriculum and numerous `server/*-routes.ts` files. Streaming and JSON generation behavior must be verified per call site. Prompt text and provenance are split among source, seeded data and database-backed application records; export application data before attempting a provider swap. Do not promise model equivalence or silently fall back to an unconfigured provider.

`AI_INTEGRATIONS_*` API keys and base URLs are Replit-proxy integration settings; their underlying account ownership/portability has **not** been verified. A direct provider account, authorized key and compatible model endpoint must be chosen separately. Preserve timeout, cancellation, ethical preamble, cost/rate limits, audit and streaming contracts when replacing calls. The existing Resend integration is mediated by `server/email-service.ts` and Replit connector plumbing; verify a separate direct Resend setup if email continues off-platform.

## Environment-variable inventory (names only)

`.env.example` is a **source inventory**, not a Vercel-ready configuration. Never commit values. Categories below describe migration treatment, not evidence of current production presence:

| Class | Names and current source locations | Destination treatment |
| --- | --- | --- |
| Source DB and sessions | `DATABASE_URL`, `DB_CONNECTION_TIMEOUT_MS`, `DB_QUERY_TIMEOUT_MS`, `DB_MIGRATION_LOCK_TIMEOUT_MS`, `DB_MIGRATION_QUERY_TIMEOUT_MS` (`server/storage.ts`, `server/run-migrations.ts`, `server/replit_integrations/auth/replitAuth.ts`, `.replit`, `drizzle.config.ts`); `SESSION_SECRET` (`replitAuth.ts`) | Required only while the current Postgres/session runtime remains. Do **not** put the source URL or secret into Vercel as a Convex replacement. |
| Replit-only auth/host | `REPL_ID`, `ISSUER_URL`, `REPLIT_DOMAINS`, `REPLIT_DEV_DOMAIN`, `REPLIT_DEPLOYMENT`, `REPLIT_DEPLOYMENT_ID`, `REPLIT_DEPLOYMENT_URL`, `REPL_IDENTITY`, `WEB_REPL_RENEWAL`, `REPLIT_CONNECTORS_HOSTNAME` (`server/replit_integrations/auth/*`, `server/index.ts`, `server/email-service.ts`, other `server/*`) | Replace OIDC, callbacks, connector and host assumptions; not target credentials. |
| Replit-only storage | `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS` (`server/replit_integrations/object_storage/objectStorage.ts`) | Source namespace selectors until objects/references are mapped. |
| AI and limits | `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENROUTER_API_KEY`, `AI_INTEGRATIONS_OPENROUTER_BASE_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `AI_PROVIDER_TIMEOUT_MS`, `AI_REQUEST_DEADLINE_MS` (`server/ai-provider.ts`, `.replit`, related clients) | Replit proxy names need direct-provider replacement; direct keys only if their features are retained and independently provisioned. |
| External integrations | `CENSUS_API_KEY`, `SAM_GOV_API_KEY`, `CAREERONESTOP_API_KEY`, `CAREERONESTOP_USER_ID`, `FBI_CRIME_API_KEY`, `HUD_API_KEY`, `OPENSTATES_API_KEY`, `USDA_NASS_API_KEY`, `BIDNET_USERNAME`, `BIDNET_PASSWORD`, `RFPMART_USERNAME`, `RFPMART_PASSWORD`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (their corresponding `server/*` adapters and jobs) | Retain only enabled integrations; verify external ownership and egress restrictions. Never copy their values into a document. |
| Partner/platform API | `CHILDCORE_API_KEY`, `CIVIC_SIGNAL_*`, `GPP_*`, `GRANTPATHPRO_WEBHOOK_API_KEY`, `RPLICE_API_KEY`, `THRIVEUP_*`, `THRIVE_GPP_API_KEY`, `CODE_CANVAS_ECOSYSTEM_KEY`, `COMMUNITY_API_KEY`, `CROSS_PLATFORM_API_KEY`, `ECS_PARTNER_KEY`, `ECOSYSTEM_PARTNER_KEY_1`, `ECOSYSTEM_PARTNER_KEY_2`, `SHADOW_OBSERVER_KEY` (partner/ingest/router files under `server/`) | Some are inbound credentials and some outbound. Preserve direction, access scope, replay protection and partner approval; rotate at a coordinated cutover, not now. Exact names are in `.env.example`. |
| URLs and runtime | `APP_BASE_URL`, `APP_URL`, `BASE_URL`, `PRODUCTION_URL`, `PROD_URL`, `PUBLISHED_BASE_URL`, `GPP_API_URL`, `GPP_EMBED_URL`, `GPP_MIRROR_URL`, `RPLICE_THRIVEUP_API_URL`, `NODE_ENV`, `PORT`, `VERCEL` (`server/*`, `api/index.js`, `.replit`) | Audit use of public URLs and callbacks; `VERCEL` is platform-set. Do not infer a production URL from development domains. |
| Notifications/probes/tooling | `AI_ALERT_RECIPIENT`, `GRANT_DIGEST_RECIPIENTS`, `COMMUNITY_BRIEF_PROBE_URL`, `EQUITY_LOSS_PROBE_URL`, `HUB_INTEL_DAILY_TOKEN_CAP`, `E2E_BASE_URL`, `PARTNER_API_CONTRACT_TARGET`, `PROBE_ALERT_TEST_RECIPIENT`, `TEST_PARTNER_KEY`, `ZIP` (`server/*`, `scripts/*`) | Optional or test-only; review each before provisioning on a new host. |

## Exit sequence and acceptance

1. Owner confirms production DB connection **destination** and production storage namespace in secure Replit UI. Take a restorable DB backup and a restricted object manifest/export per runbook; compare byte totals, checksums, record counts, and references. Keep originals.
2. Choose target auth and file-storage providers. Design Convex schema/indexes/permissions and ID crosswalk, then perform a **separate** rehearsed import into an isolated target; no direct Postgres-to-Convex connection swap.
3. Port SQL-backed APIs, role/tenant guards, uploads/download authorization, AI/email adapters, background jobs and partner callbacks. Verify all key journeys on a test deployment using de-identified or explicitly authorized data.
4. Define a write-freeze/change-capture and rollback plan; reconcile changes since the backup before owner-approved cutover. Only then change routing/credentials. Do not disable Replit source or delete backups until validation and retention obligations are met.

**Not done / decisions needed:** production `DATABASE_URL` destination confirmation; exact row counts and full schema archive; production bucket/manifest and object hashes; chosen auth provider; chosen destination storage; Convex model and import mapping; secrets/partner cutover authorization. These are factual limits, not evidence of missing production data.