---
name: platform-engineering
description: Platform engineering standards, architecture, and all load-bearing technical gotchas. Covers memory architecture, AI call site rules (withEthicalPreamble mandatory), OpenRouter model rotation, 30+ engineering gotchas (forbidden files, silent catches, ECOSYSTEM_PLATFORMS overwrite, etc.), DB patterns, orchestration conductor, Chainweb/blockchain API, electrical/circuit canvas, curriculum activities, SDOH nationwide data, Zod architecture, and key file pointers across the full stack.
---

# Platform Engineering — Architecture, Gotchas & Technical Standards

## Load this when: building any server route, client component, AI call site, curriculum feature, or touching any platform infrastructure.

---

## Memory Architecture (Compiled-Memory System)

### Read Order (Session Start)
1. `replit.md` → rules + pointers ONLY
2. `docs/agent-memory/topics/behavioral-standard.md` ← Fable Standard
3. `docs/agent-memory/topics/salp-bia-adis.md` ← Platform DNA
4. `docs/agent-memory/INDEX.md` + `docs/agent-memory/CURRENT.md`
5. Most-recent `docs/agent-memory/sessions/YYYY-MM-DD.md`
6. Relevant `docs/agent-memory/topics/<x>.md` for specific task

### Write Order (Task End — Mandatory Before mark_task_complete)
1. Append decisions/new facts/blockers/lessons → `docs/agent-memory/sessions/YYYY-MM-DD.md`
2. Promote stable facts → relevant `docs/agent-memory/topics/` file
3. New anti-pattern → `docs/agent-memory/topics/gotchas.md`
4. Run `npx tsx scripts/preflight.ts` — must exit 0
5. Run `npx tsx scripts/memory-health.ts` — must exit 0 before any external work

### Forbidden
- Adding facts to `replit.md` — rules and pointers only
- Letting `CURRENT.md` exceed ~200 lines — recompile it
- Deleting from `sessions/` or `archive/` — append-only
- Skipping the session-end deposit — the whole system fails without it

---

## Core Dev Commands

```bash
npm run dev              # start app (port 5000)
npm run db:push          # push schema changes to DB
npm run typecheck        # TypeScript check (must exit 0)
npx tsx scripts/preflight.ts    # pre-flight gate (must exit 0)
npx tsx scripts/memory-health.ts # memory hygiene
npx tsx scripts/congruence-audit.ts # 0 FAIL required
npx playwright test      # E2E tests
```

---

## AI Call Sites — Hard Rules

1. **ALL AI calls must route through `server/ai-provider.ts`** — never call OpenAI/Anthropic/Gemini SDKs directly.
2. Every call must use `withEthicalPreamble()` — this wraps the ETHICAL_EI_PREAMBLE automatically.
3. Anti-fabrication rules must be prepended to every system prompt (see Fable Standard skill).
4. `generateAIJSON`, `perplexityResearch`, `withEthicalPreamble`, `generateAIResponse` are all exported from `server/ai-provider.ts`.

**Perplexity Sonar Pro** is available via OpenRouter (`perplexity/sonar-pro`) — no separate API key needed. Use `perplexityResearch()` from `ai-provider.ts`.

---

## OpenRouter Model Rotation

**Rule:** When any AI provider fails with "provider error" / "No endpoints found" — assume the model ID was retired upstream. The proxy does NOT expose `/models` (returns 405).

**Known-good as of 2026-07-13:**
- `anthropic/claude-haiku-4-5`, `anthropic/claude-sonnet-4.5` (OpenRouter)
- `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite` (OpenRouter)
- `deepseek/deepseek-r1-distill-llama-70b`, `deepseek/deepseek-chat-v3-0324` (OpenRouter)
- Direct Anthropic: `claude-haiku-4-5`, `claude-sonnet-4-5`

**All Claude 3.x IDs are RETIRED** — `claude-3-5-haiku`, `claude-3.5-haiku`, `3.5-sonnet`, `3.7-sonnet` all return "No endpoints found."

**Probe pattern:**
```bash
# POST to ${AI_INTEGRATIONS_OPENROUTER_BASE_URL}/chat/completions with max_tokens: 1
# 200 = live, "No endpoints found" = retired
```

**Model IDs are hardcoded in multiple files** — sweep with `rg` across `server/` (ai-provider, collaborative-ai, navigator-routes, ai-smoke-test all carried copies).

---

## Engineering Gotchas (Load-Bearing Rules)

### ECOSYSTEM_PLATFORMS array overwrites DB on every startup
File: `server/ecosystem-connector.ts:658`. Auto-sync UPDATEs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment + DELETEs DB rows not in the array. `publicVisible` survives. **Edit BOTH the array and the DB** when adding/renaming platforms.

### TYT connector self-registration
Announces as "LexiBridge / `lexibridge.net`" — overwrites hub row name+URL on every heartbeat. Real fix lives in TYT workspace.

### Hub pinger false-positive
Marks platforms "online" even when DNS fails or heartbeat >7d stale. `curl HTTP 000` = unbound custom domain, not necessarily down — check `ecosystem_platforms.health_status`.

### Public no-auth wizards must use capability tokens
NOT client-supplied IDs. Server generates id + per-row `accessToken`, returns once, requires `x-intake-token` on every later request. Pattern: `server/foster-youth-intake-routes.ts`. Pair with per-IP rate limits on AI/upload.

### Silent catch blocks: prohibited
All server route errors must be handled and reported. No empty catch blocks.

### Conditional `useEffect`: prohibited
React hooks rule — never call hooks conditionally.

### Hardcoded grant arrays prohibited
`/api/proposal-pipeline` must read from the `proposal_pipeline` DB table.

### pptxgenjs default-export under tsx-ESM
Needs `createRequire` — standard ESM import fails.

### `req.params` typing
Typed as `string|string[]` — coerce with `String()` before Drizzle `eq()`.

### Forbidden file changes (without explicit user ask)
- `vite.config.ts`
- `drizzle.config.ts`
- `package.json`

### Import paths (caused startup failures)
- `db` must come from `"./storage"` — NOT `"./db"` (that path doesn't exist)
- Schema tables must come from `"@shared/schema"` — NOT `"../shared/schema"`

---

## Route Architecture

**Auth middleware:**
- `requireAuth` — standard session auth for user-facing routes
- `requireEcosystemAuth` — `x-ecosystem-key` header, validates against `ecosystem_platforms` table
- `requirePartnerAuth` — `x-partner-key` or `Authorization: Bearer tcaf_...`, SHA-256 hashed at rest

**RequireAuth + wouter routing pattern — CRITICAL:**
- Route must WRAP RequireAuth: `<Route path="/x"><RequireAuth>...</RequireAuth></Route>`
- Do NOT wrap Route inside RequireAuth — outer-RequireAuth bleeds to all pages.

**API contract:** Read `docs/api-contract.md` before building any server route.

---

## Database Patterns

### ZIP → FIPS Resolution (Nationwide)
- `zcta_county_map` table — 33,120 rows of nationwide ZIP→FIPS coverage
- `resolveZipBestEffort()` in `server/geo/zip-county-resolver.ts` — DB lookup first, static fallback
- 60601 (Chicago) → 17031 | 90001 (LA) → 06037 | 78753 (Austin) → 48453

### Census API ACS Multi-Vintage Quirk (CRITICAL)
Pre-2022 ACS vintages (2013, 2015, 2019) return `error: ambiguous geography` for bare ZCTA queries.
**Must add `&in=state:{FIPS}`** — wildcard `&in=state:*` also fails.
- 2022: works without qualifier
- 2019, 2015, 2013: require `&in=state:48` (TX example)

### Census API error detection
Census errors return plain string — `resp.json()` throws. Safe detection: `Array.isArray(data) && Array.isArray(data[0]) && data[1]`.

### Drizzle ORM patterns
- `eq()`, `and()`, `sql`, `gte()`, `lte()` from `"drizzle-orm"` — NOT from `"@drizzle-orm/pg-core"`
- `db` from `"./storage"` always

---

## Community Context Orchestration

`server/community-context.ts` — AsyncLocalStorage pipes Census + RPLICE data into every AI call automatically.

**How it flows:**
1. `communityContextMiddleware()` in `server/routes.ts` — extracts ZIP from request body/params/query
2. Hot path: ZIP cached → wraps `next()` in `AsyncLocalStorage.run()` → all downstream AI calls inherit context
3. `withEthicalPreamble()` in `ai-provider.ts` calls `getCurrentCommunityContext()` and appends it to every system prompt

**Cache:** 30-minute TTL, 80-entry LRU, in-flight deduplication.

**Navigator special case:** Navigator detects ZIP from message text (not request body) — calls `buildCommunityAIContext({ zip })` directly in parallel with GIS lookup.

**New AI surface rule:** Any new AI surface that knows geography → either (a) have ZIP in request body (middleware handles it) or (b) call `warmCommunityContext(zip)` + `runWithCommunityContext(ctx, () => callAI(...))` directly.

---

## Orchestration Layer (Chainweb Conductor)

**Files:**
- `server/orchestration/engine-registry.ts` — manifest of 25 engines with domain/geography/PII/operatorSelectable tags
- `server/orchestration/conductor.ts` — `getOrchestratedIntelligence(geo, {engines?, domains?, collegeAccessQuestion?})`

**25 engines — all function-callable in-process** (`IN_PROCESS_ENGINE_IDS` in `conductor.ts`).

**`college-access-ai` is operatorSelectable** — excluded from default pool and domain-bundle auto-inclusion. Fires ONLY when:
1. Operator explicitly supplies `engines: ["college-access-ai"]` AND
2. Supplies `options.collegeAccessQuestion` (non-empty string)
Naming the id alone does NOT bypass the wall. Payload presence is the consent check.

**Conductor AI spend cap:** `CONDUCTOR_AI_CALL_LIMIT = 5` operator-invoked AI calls/minute, process-wide.

**PII wall pattern:** `touchesPII: false` on an ENGINE_REGISTRY entry is a per-engine-query-path label, NOT a per-table guarantee. Aggregate-only queries (COUNT/GROUP BY on geography key + one non-identifying field) keep wall safe. **Never select(`*`) or any name/contact/notes column.**

**Small-cell suppression:** `suppressSmallCells()` (floor `MIN_AGGREGATE_CELL = 5`) applied to workforce/justice/trade-sims/clinical count-aggregate branches.

**FCC broadband — blocked:** rural-connectivity needs real lat/lng; `GeographyRef` doesn't carry coordinates and no county-centroid table exists. Do not re-attempt without new info.

---

## Partner API Hub

**Keys:** `tcaf_` prefix, SHA-256 hashed at rest, shown plaintext once on creation.
**Auth header:** `x-partner-key` or `Authorization: Bearer tcaf_...`
**Admin UI:** Ops Center → Partner API tab (8th tab)

**Endpoints:**
- `GET /api/partner/v1/health` — verify key, no scope required
- `GET /api/partner/v1/export` — full content export for RAG ingestion (content:read scope)
- `GET /api/partner/v1/platforms` — platform catalog + health (platforms:read scope)
- All calls audit-logged to `partner_api_audit_log` table

**Files:** `server/partner-api-routes.ts` + `shared/schema.ts` (`partnerApiKeys` + `partnerApiAuditLog` tables)

---

## Chainweb External API

**Endpoints in `server/chainweb-routes.ts`:**
- `GET /api/chainweb/programs?topic=&domain=&limit=` — evidence-based program search (auth required)
- `GET /api/chainweb/programs/:id/evidence` — full evidence record (auth required)
- `GET /api/chainweb/jurisdiction?state=&topic=&outcome=` — state/jurisdiction policy history (auth required)
- `POST /api/chainweb/webhook/civic-signal` — receives incoming lessons from Civic Signal (auth required)
- `GET /api/chainweb/api-info` — discovery endpoint, no auth required

**Auth:** `x-ecosystem-key` header | Key format: `tveco_[platformname]_[hash]` | Rate limit: 60 req/min per key

**10 Evidence Programs:** NFP, Perry Preschool, Housing First, RNR/CBI, BBBS, MST, Dads Care 2, Benefits Navigation, CHW Model, TF-CBT

**Civic Signal connector:** `server/civic-signal-connector.ts`
- `receiveCivicSignalLesson()` — live, stores in-memory (last 100), injects into RAG
- `pushChainwebToCivicSignal()` — STUB until `CIVIC_SIGNAL_BASE_URL` + `CIVIC_SIGNAL_API_KEY` secrets set
- When credentials arrive: replace stubs in `pushChainwebToCivicSignal()` and `fetchCivicSignalAdaptations()`

**API docs:** `docs/civic-signal-api-guide.md` — ready to send to Civic Signal.

---

## Visual Circuit Canvas (Electrical Trade Sim)

**File:** `client/src/components/trade-sims/electrical/visual-circuit-canvas.tsx` — SVG-based interactive schematic editor.

**Two separate predicates in lesson-player.tsx:**
- `shouldShowCanvas(tradeSlug, engineMode)` — always true for "electrical"; decides whether to *render* a canvas
- `ENGINES_WITH_CANVAS.has(engineMode)` — unchanged; decides whether `hasRunSim` is *required for mark-complete*

**Why separate:** Electrical concept-only lessons need an exploration canvas but don't need a solver result to complete — the reflection textarea gates completion instead.

**onInteract vs onChange:**
- `onInteract` fires `onRun` on any canvas interaction (drag, wire draw) — gates concept-only completion
- `onChange` fires `onRun` only when `lastSolve !== null` — gates linear-dc completion

**Union-Find node assignment:** Battery negative terminal = always node 0 (ground reference). Wire direction doesn't matter for node assignment.

**Wire animation:** SVG `<animateMotion>` with `<mpath href="#pathId" />`, 3 amber dots per wire staggered 0.4s. Only animates wires where `nodeVoltage > 0.005V`.

**3D Viz — CRITICAL: NEVER reinstall @react-three/fiber or @react-three/drei**
They crash the app with "multiple copies of React" in React 18.3.x + Vite. All viz components use vanilla Three.js (`useEffect + useRef + WebGLRenderer on div`). `vite.config.ts` has `resolve.dedupe: ['react', 'react-dom', 'react-dom/client']` — do NOT remove.

---

## AI Curriculum Interactive Activities

**Five activity types:**

| Type | File | Teaches |
|---|---|---|
| `prompt-lab` | `client/src/components/activities/prompt-lab.tsx` | Prompt engineering via live AI calls |
| `arcb-evaluator` | `client/src/components/activities/arcb-evaluator.tsx` | ARCB framework: Accuracy/Relevance/Completeness/Bias |
| `hallucination-spotter` | `client/src/components/activities/hallucination-spotter.tsx` | Click-to-flag suspicious claims |
| `bias-detective` | `client/src/components/activities/bias-detective.tsx` | Side-by-side response comparison |
| `ai-or-human` | `client/src/components/activities/ai-or-human.tsx` | Classify text samples as AI or human |

**ActivityRenderer:** `client/src/pages/lesson-viewer.tsx` — dispatches by `data.type`.
**Backend:** `POST /api/lesson-lab/run` — no auth required, rate-limited 20/hour/IP. Uses `generateAIResponse` from `ai-provider.ts` with `withEthicalPreamble`.
**Migration pattern:** `server/seed-ai-activity-migration.ts` — `migrateAIActivityTypes(db)` called from `server/storage.ts` after every seed run. Uses explicit `UPDATE` by lesson ID — idempotent and safe on fresh or existing DBs.

---

## Navigator Personal RAG

`server/personal-context.ts` — queries live DB data and injects as factual background into Navigator system prompt when user is authenticated.

**Data sources:** `proposalPipeline`, `communityPartnerOrgs`, `initiatives` (filtered by authorId), `stakeholderCommitments`.

**Injection point:** `server/navigator-routes.ts` — `fullSystemPrompt = NAVIGATOR_SYSTEM_PROMPT + contextData + personalContextBlock + modeInstruction`

**Design constraints (non-negotiable):**
1. NOT a sales pitch — labeled "for accuracy only, not for promotion"
2. Audience-aware — if helping external org, focus on THEIR situation, not TCAF's grant pipeline

**Non-fatal design:** All DB queries wrapped in try/catch. Failed query silently omits that section. Anonymous users are unaffected.

---

## Community Impact Conductor

**Endpoints:**
- `POST /api/conductor/community-brief` — full community brief for one geography
- `POST /api/conductor/compare` — side-by-side multi-geography comparison

**API response field names (caused silent mismatches — use exactly these):**
- `overallScore` / `overallGrade` (not score/grade)
- `cascade.interventionCost` (not investmentCost)
- `systemsScores.healthAccess` (not health)
- `cascade.timeline` nodes are narrative strings (without/with) not numbers

**JURISDICTION_DATA shape:** Flat records — NOT a `.policies` array. Fields: `state, topic, policyName, outcome, evidenceSummary`. Never access `.record` or `.nationalRanking` — those fields don't exist.

**Five vanilla Three.js viz tabs:**
1. `skyline` — SkylineMap.tsx — neighbor ZIPs, height = cost of inaction
2. `cascade` — CascadeWaterfall.tsx — narrative timeline nodes (string shape)
3. `web` — DomainWeb.tsx — domain score connections
4. `particles` — ParticleFlow.tsx — invest vs. don't population flow
5. `historical` — HistoricalTimeline.tsx — ACS multi-vintage bar chart, NOW divider

**historicalCascade shape:**
```typescript
historicalCascade: {
  vintages: Array<{ year, povertyRate, unemploymentRate, cohortCost }>;
  totalAccumulatedCost: number;
  trendDirection: "improving" | "stagnant" | "worsening";
  yearsAboveCrisisThreshold: number;
  keyInsight: string;
  yearsOfData: number;
}
```

---

## Nationwide SDOH / Health Data

**Live confirmed endpoints:**
- **CDC PLACES 2024:** `https://data.cdc.gov/resource/swc5-untb.json?locationid={county_fips}` → ACCESS2, DEPRESSION, MHLTH, FOODINSECU, MAMMOUSE, CHECKUP, HOUSINSECU all return live for any US county
- **`zcta_county_map` DB table:** 33,120 rows (nationwide ZIP→FIPS)

**Block 10 (ecosystem-data-routes.ts):**
- `GET /api/health/search?topic=&zip=&population=` — Perplexity Sonar Pro live web-grounded health search
- `POST /api/health/provider-kit` — AI-generated provider visit kit (condition-specific questions, red flags, local FQHCs, state WIC, national orgs, self-advocacy script)

---

## Zod Validation Architecture

Zod IS the validation system here — not integrated into it. The pattern:
1. One schema definition in `shared/schema.ts` → `createInsertSchema` via `drizzle-zod`
2. Auto-generates both the DB insert validator AND the form resolver
3. Client: `zodResolver` from `@hookform/resolvers/zod` + `react-hook-form`
4. Server: `z.object().safeParse(req.body)` — if fails, returns 400 with `error.flatten()`

**653 server-side Zod usages · 90 client-side · drizzle-zod in shared/schema.ts**

---

## Cross-Repo Boundary

**ThriveUp and RPLICE are TWO separate codebases linked by API.** When `rg`/`ls`/`find` for a file not found here, that does NOT mean it doesn't exist — it may live in the RPLICE repo. Before declaring a file "FALSE" in an audit, check if the claim is about a RPLICE asset. If yes: "cannot verify from this repo — need cross-repo confirmation" — NOT "FALSE."

---

## CEDS Regional Alignment

- 3 tables: `cedsRegions`, `cedsGoals`, `cedsAlignments` in shared/schema.ts
- `server/ceds-routes.ts` — 5 endpoints (AI align requires auth)
- Navigator: CEDS regional framework block injected when state detected
- Frontend: `/ceds` and `/ceds/:regionId`
- Lookup: `/api/ceds/lookup?fips=<5-digit>` — find region by county
- AI alignment: `POST /api/ceds/align` (auth required) — generates proposal language for any program description

---

## Key File Pointers

| Need | File/Command |
|---|---|
| AI providers, all models, withEthicalPreamble | `server/ai-provider.ts` |
| All API routes | `server/routes.ts` |
| SDOH + health endpoints + provider kit | `server/ecosystem-data-routes.ts` |
| Orchestration conductor | `server/orchestration/conductor.ts` |
| Engine registry | `server/orchestration/engine-registry.ts` |
| Community context middleware | `server/community-context.ts` |
| Navigator AI + personal RAG | `server/navigator-routes.ts` + `server/personal-context.ts` |
| Partner API hub | `server/partner-api-routes.ts` |
| Chainweb external API | `server/chainweb-routes.ts` |
| Civic Signal connector | `server/civic-signal-connector.ts` |
| Visual circuit canvas | `client/src/components/trade-sims/electrical/visual-circuit-canvas.tsx` |
| Sidebar navigation | `client/src/components/app-sidebar.tsx` |
| App router | `client/src/App.tsx` |
| Shared schema (271 tables) | `shared/schema.ts` |
| ZIP→FIPS resolver | `server/geo/zip-county-resolver.ts` |
| Preflight gate | `scripts/preflight.ts` |
| Memory health | `scripts/memory-health.ts` |
| Congruence audit | `scripts/congruence-audit.ts` |
| Capabilities inventory | `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` |
| API contract | `docs/api-contract.md` |
