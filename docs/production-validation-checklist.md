# Production validation checklist

## Preview acceptance

- [ ] Analytics component loads on the Preview deployment; navigate multiple SPA routes and confirm no browser/runtime error.
- [ ] Preview uses isolated Neon data, independent auth test accounts, Blob sandbox, and non-production AI credentials.
- [ ] PostgreSQL schema/count/constraint/transaction rehearsal passes; no migration ran against production.
- [ ] Existing-user ID/role/organization tests pass; new auth login/logout/session and denied-route tests pass.
- [ ] Blob upload/download/delete and cross-user/cross-organization denial pass; private file URLs are not public.
- [ ] Resend magic-link and existing transactional email flows pass.
- [ ] Direct AI provider success, timeout, failure, streaming, safety/preamble, and user-safe errors pass.
- [ ] Each scheduled/probe/interval task has an approved Vercel Cron, worker/queue, manual process, or retirement decision.

## Production approval checklist

- [ ] Owner confirms true source production database and storage namespace.
- [ ] Restorable source backup, object manifest, checksums, and source-to-target crosswalk exist in restricted storage.
- [ ] Neon production and Preview separation is reviewed; variables are correctly scoped without exposing values.
- [ ] DNS/domain/auth callback allowlists and GitHub branch protections are verified.
- [ ] Replit remains available, unchanged, and operational for the agreed rollback window.
- [ ] Owner approves the exact data migration, write window, production deployment, and rollback owner.

## Environment matrix (names only)

| Category | Production | Preview | Development |
|---|---|---|---|
| Core PostgreSQL/auth | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_EMAIL_FROM`, `RESEND_API_KEY` | Isolated equivalents; no production DB | Local/rehearsal equivalents |
| Blob after approved setup | `BLOB_STORE_ID`, `VERCEL_OIDC_TOKEN` | Separate/branch-scoped store credentials | `BLOB_READ_WRITE_TOKEN` only when not on Vercel |
| Direct AI after approval | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` as enabled | Separate quota/keys | Local test keys |
| Remove from target | `REPL_ID`, `ISSUER_URL`, `REPLIT_*`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`, `AI_INTEGRATIONS_*` | Same | Same |
| Retained integrations, only if enabled | `CENSUS_API_KEY`, `SAM_GOV_API_KEY`, `CHILDCORE_API_KEY`, `TWILIO_*`, `GPP_*`, `THRIVEUP_*`, `RPLICE_API_KEY`, partner tokens | Preview-safe/sandbox variants | Local variants |

For the full source names-only inventory, see PR #1; it is intentionally not copied here as a configuration source.

## Operator checklist

- **Neon:** independently owned account; rehearsal restore; Preview branch/database; no production migration without approval.
- **Vercel:** project variables scoped correctly; Analytics enabled; runtime errors monitored; no domain/protection changes in this phase.
- **GitHub:** plan PR reviewed; implementation branches/pull requests required; protect `main` before production cutover.
- **Domain/DNS:** retain current routing through validation; pre-register exact auth callbacks; no registrar changes without separate approval.
- **Auth/Blob/Resend/AI:** provision accounts/keys in their dashboards, verify ownership and sandbox behavior, never paste values into source/chat.
- **Replit:** retain deployment/database/storage/configuration unchanged until the entire production checklist and rollback window pass.

## Complete source environment-name inventory

These names are source references, not confirmation that they are currently configured. Assign each only after the relevant implementation and provider-owner approval; never copy a value into this document.

```text
AI_ALERT_RECIPIENT
AI_INTEGRATIONS_ANTHROPIC_API_KEY
AI_INTEGRATIONS_ANTHROPIC_BASE_URL
AI_INTEGRATIONS_OPENAI_API_KEY
AI_INTEGRATIONS_OPENAI_BASE_URL
AI_INTEGRATIONS_OPENROUTER_API_KEY
AI_INTEGRATIONS_OPENROUTER_BASE_URL
ANTHROPIC_API_KEY
BIDNET_PASSWORD
BIDNET_SAVED_SEARCH_URL
BIDNET_USERNAME
CAREERONESTOP_API_KEY
CAREERONESTOP_USER_ID
CENSUS_API_KEY
CHILDCORE_API_KEY
CHILDCORE_TRUSTED_API_ORIGINS
CIVIC_SIGNAL_BASE_URL
CIVIC_SIGNAL_ECOSYSTEM_KEY
CIVIC_SIGNAL_PARTNER_KEY_ID
CIVIC_SIGNAL_PARTNER_ORIGIN
CIVIC_SIGNAL_PARTNER_READ_KEY_ID
CIVIC_SIGNAL_PARTNER_READ_TOKEN
CIVIC_SIGNAL_PARTNER_TOKEN
CIVIC_SIGNAL_PULL_URL
CIVIC_SIGNAL_PUSH_URL
CODE_CANVAS_ECOSYSTEM_KEY
COMMUNITY_API_KEY
COMMUNITY_BRIEF_PROBE_URL
CROSS_PLATFORM_API_KEY
DATABASE_URL
ECOSYSTEM_PARTNER_KEY_1
ECOSYSTEM_PARTNER_KEY_2
FBI_CRIME_API_KEY
GEMINI_API_KEY
GPP_ALLOWED_HOSTS
GPP_API_KEY
GPP_API_URL
GPP_EMBED_URL
GPP_MIRROR_OUTBOUND_KEY
GPP_MIRROR_URL
GPP_OPPORTUNITY_HANDOFF_API_KEY
GPP_OPPORTUNITY_HANDOFF_URL
GRANTPATHPRO_WEBHOOK_API_KEY
GRANT_DIGEST_RECIPIENTS
HUB_INTEL_DAILY_TOKEN_CAP
HUD_API_KEY
ISSUER_URL
NODE_ENV
OPENAI_API_KEY
OPENSTATES_API_KEY
PARTNER_API_CONTRACT_TARGET
PORT
PRIVATE_OBJECT_DIR
PRODUCTION_URL
PUBLIC_OBJECT_SEARCH_PATHS
REPLIT_CONNECTORS_HOSTNAME
REPLIT_DEPLOYMENT_URL
REPLIT_DEV_DOMAIN
REPLIT_DOMAINS
REPL_ID
REPL_IDENTITY
RFPMART_PASSWORD
RFPMART_USERNAME
RPLICE_API_KEY
RPLICE_THRIVEUP_API_URL
SAM_GOV_API_KEY
SESSION_SECRET
SHADOW_OBSERVER_KEY
THRIVEUP_API_KEY
THRIVEUP_CALLBACK_API_KEY
THRIVEUP_INBOUND_KEY
THRIVEUP_INGEST_KEY
THRIVEUP_ISSUED_KEY
THRIVEUP_PARTNER_KEY
THRIVEUP_SHARED_SECRET
THRIVE_GPP_API
THRIVE_GPP_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
USDA_NASS_API_KEY
VERCEL
WEB_REPL_RENEWAL
```
