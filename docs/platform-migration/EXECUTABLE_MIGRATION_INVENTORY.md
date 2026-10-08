# Executable Migration Inventory (Safe Path)

This inventory is tied to `docs/platform-migration/migration-manifest.json` and is intentionally execution-focused: each dependency has replacement target, env/data dependencies, tests, rollback, owner, and status.

## Scope Guardrails
- Keep PR #6 unmerged and use it only as a risk catalog.
- Preserve all existing Replit-dependent runtime modules until replacement parity is proven.
- No production/external-state changes in this phase.

## Dependency Map

| Dependency ID | Category | Affected routes/features | Current implementation | Target replacement | Required env vars | Data/auth dependencies | Test cases | Rollback mechanism | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `replit-auth-oidc` | auth | `/api/login`, `/api/callback`, `/api/logout`, session-auth APIs | `server/replit_integrations/auth/replitAuth.ts` | staged dual-run auth provider with parity gates | `REPL_ID`, `ISSUER_URL`, `SESSION_SECRET`, `DATABASE_URL` | passport session + users/authStorage | migration-preservation auth contract | keep current Replit auth middleware/routes mounted | Platform Engineering | active-preserve |
| `replit-object-storage-uploads` | object-storage | `/api/uploads/request-url`, `/objects/*path`, document uploads | `server/replit_integrations/object_storage/routes.ts` | signed-upload broker with same contract | `PRIVATE_OBJECT_DIR` | upload ACL identity + object policy | migration-preservation upload contract | preserve Replit object storage registration | Platform Engineering | active-preserve |
| `replit-resend-connector` | email | alert and platform email sends | `server/email-service.ts` connector path | direct Resend key mode with parity checks | `REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY` | connector settings + send callers | build/typecheck + email init checks | re-enable connector-backed client factory | Platform Engineering | active-preserve |
| `replit-openai-evidence-synthesis` | AI/evidence synthesis | retrieved-evidence synthesis in AI provider | `server/ai-provider.ts::synthesizeRetrievedEvidence` | provider-agnostic adapter preserving bounded-source safety | `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` | allowlisted source URLs + cited source IDs | migration-preservation evidence synthesis contract | retain current Replit synthesis branch | Platform Engineering | active-preserve |
| `replit-voice-module` | voice | voice project/insight APIs | `server/voice-routes.ts` + `server/replit_integrations/audio/*` | incremental voice adapter with route compatibility | `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` | voice persistence + admin moderation | migration-preservation voice contract | keep existing voice routes/modules | Platform Engineering | active-preserve |
| `replit-chat-module` | chat | conversation routes + streaming messages | `server/replit_integrations/chat/*` | conversation adapter, unchanged API paths | `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` | owner identity + chat tables | migration-preservation chat contract | retain chat module + route signatures | Platform Engineering | active-preserve |
| `replit-image-generation-module` | image generation | `/api/generate-image` | `server/replit_integrations/image/*` | image provider adapter, same endpoint contract | `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` | prompt validation + image payload | migration-preservation image contract | keep existing image module route | Platform Engineering | active-preserve |
| `scheduled-gun-violence-source-hostname` | scheduled jobs | daily sync + 48h staleness alert path | `server/index.ts` | host cutover only after real endpoint evidence | n/a | `gun_violence_imports` audit + email alerting | migration-preservation scheduled-host contract | restore prior source host references | Platform Engineering | active-preserve |
| `replit-domains-scheduled-probes` | scheduled jobs | partner probe, community probe, AI smoke scheduler | `server/index.ts` + probe modules | environment-aware scheduler abstraction with existing safety guards | `NODE_ENV`, `REPLIT_DOMAINS` | probe contracts + alerting | build/typecheck + preservation checks | keep current `!onVercel` startup guards/order | Platform Engineering | active-preserve |

## External Hostnames Changed by PR #6 (must not be accepted without formal approval)

| Source PR | From | To | Current decision |
|---|---|---|---|
| #6 | `gun-violence-registry.replit.app` | `gun-violence-registry.legacy.invalid` | rejected pending approved retirement or verified replacement |

## Formal Retirement Policy (for future use)
A dependency may be retired only if all are present in the manifest:
1. `formalRetirement.decision = "retire"`
2. explicit approval reference/ticket
3. approved-by identity
4. effective date and rationale

Until then, preservation tests treat replacement with unconditional `503` or `.invalid` hostnames as regression failures.
