# Contracting Fork — Drop-In Code Bundle

**Generated:** 2026-05-27 · for Dr. Flood per Option B directive
**Source:** ThriveUp Academy — extracted contracting-only stack
**Goal:** spin up a separate Replit app that ONLY does contracting (RFP ingestion → compliance matrix → gap closure → evidence binding → AI authoring → exports). No academy, no community, no health, no foster, no justice.

---

## What's in this bundle

```
fork-contracting-app/
├── README.md                          ← this file
├── MANIFEST.md                        ← deep-dive copy/deny lists (from PLANNING)
├── server/
│   ├── ai-provider.ts                 ← ETHICAL_EI_PREAMBLE + RFP discipline + provider fan-out
│   ├── tenant-middleware.ts           ← requireAuth / requireOrg / getCallerOrg / rateLimitAi
│   ├── rfp-fidelity-engine.ts         ← compliance matrix extractor + audit
│   ├── rfp-fidelity-routes.ts         ← /api/me/rfp-fidelity/* routes
│   ├── rfp-rubric.ts                  ← RFP document stack loader
│   ├── rfp-ingestion.ts               ← ★ NEW L1: PDF auto-parse to Section L/M
│   ├── rfp-ingestion-routes.ts        ← ★ NEW L1: HTTP routes
│   ├── gap-closure-routes.ts          ← ★ NEW L3: assignable workflow + server-enforced verification gate
│   ├── evidence-binding-routes.ts     ← ★ NEW L5: inline binding + pre-submit gate
│   ├── proposal-authoring-routes.ts   ← ★ NEW L6: 5-lens RFP-mirror authoring assistant
│   ├── won-proposals.ts               ← L7 win/loss RAG injection
│   ├── won-proposals-routes.ts        ← L7 HTTP routes
│   ├── active-bids-routes.ts          ← per-RFP teaming + rubric strategy
│   ├── ecosystem-rplice-bridge.ts     ← RPLICE evidence retrieval
│   ├── rplice-tools.ts                ← RPLICE tool surface
│   ├── agency-intelligence.ts         ← funder intelligence cache
│   └── foundation-intelligence.ts     ← 990-PF cache
├── shared/
│   ├── schema-contracting.ts          ← extracted Drizzle tables (paste into your shared/schema.ts)
│   └── active-bids.ts                 ← rubric line types + seed
└── scripts/
    ├── md-to-docx.mjs                 ← markdown → DOCX export (Sedgwick-proven)
    ├── export-submittable.mjs         ← ★ NEW md → Submittable JSON
    └── export-grants-gov.mjs          ← ★ NEW md + org profile → SF-424 XML
```

★ = shipped 2026-05-27 in this session

---

## Step-by-step: build the new Repl in ~30 min

### 1. New Repl from template
Pick the **"Express + Vite + React + TypeScript"** template (or any fullstack-js template that has `client/` + `server/` + `shared/` + `vite.config.ts` already set up with `@shared`/`@assets` aliases).

### 2. Add a PostgreSQL database
Use Replit's built-in database (auto-sets `DATABASE_URL`).

### 3. Add these Replit integrations (panel → Integrations)
- `javascript_log_in_with_replit` — generates `users` + `sessions` tables and the `replitAuth.ts` glue
- `javascript_anthropic_ai_integrations` AND/OR `javascript_openai_ai_integrations` — pick one (ai-provider.ts works with either)
- `javascript_openrouter_ai_integrations` — fallback
- `javascript_object_storage` — for uploaded PDFs (optional, only if you want to persist source RFPs)

### 4. Drop in the code
- Copy everything from `fork-contracting-app/server/*` → your new Repl's `server/`
- Copy `fork-contracting-app/shared/active-bids.ts` → your new Repl's `shared/`
- Copy `fork-contracting-app/scripts/*` → your new Repl's `scripts/`
- **Merge** `fork-contracting-app/shared/schema-contracting.ts` into your new Repl's `shared/schema.ts` (paste after the Replit-Auth tables the auth blueprint generated)

### 5. Trim `ai-provider.ts` if you want
The file is self-contained. If you only configured one AI provider, you can delete the unused branches (e.g. if Anthropic only, delete the Gemini + OpenAI + DeepSeek branches). Optional — leaving them in is harmless.

### 6. Trim `tenant-middleware.ts` minimal deps
This file imports your `storage.ts` (for `db`) and the `users`/`userOrgMemberships` tables from your schema. Match the symbol names your auth blueprint generated.

### 7. Register routes in `server/routes.ts`
Paste this block inside your `registerRoutes(app)` function:

```ts
import { registerRfpFidelityRoutes } from "./rfp-fidelity-routes";
import { registerRfpIngestionRoutes } from "./rfp-ingestion-routes";
import { registerGapClosureRoutes } from "./gap-closure-routes";
import { registerEvidenceBindingRoutes } from "./evidence-binding-routes";
import { registerProposalAuthoringRoutes } from "./proposal-authoring-routes";
import { registerWonProposalsRoutes } from "./won-proposals-routes";
import { registerActiveBidsRoutes } from "./active-bids-routes";

// inside registerRoutes(app):
registerRfpFidelityRoutes(app);
registerRfpIngestionRoutes(app);
registerGapClosureRoutes(app);
registerEvidenceBindingRoutes(app);
registerProposalAuthoringRoutes(app);
registerWonProposalsRoutes(app);
registerActiveBidsRoutes(app);
```

### 8. Install npm dependencies
The bundle uses these packages (all already in the source app's `package.json`):

```
@anthropic-ai/sdk
@google/generative-ai
openai
drizzle-orm
drizzle-zod
zod
express
docx           ← only needed if you also copy scripts/md-to-docx.mjs
```

Use the new Repl's package manager (don't hand-edit `package.json` per Replit conventions).

### 9. Push schema + run
```bash
npm run db:push      # creates the contracting tables in your fresh DB
npm run dev          # starts express + vite
```

### 10. Smoke-test (5 curls, all should pass)

```bash
# 1. Create a gap
curl -X POST http://localhost:5000/api/me/gaps \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"grantId":"test-grant-1","title":"Confirm EIN with funder"}'

# 2. Try to resolve WITHOUT verification — MUST 400
curl -X POST http://localhost:5000/api/me/gaps/{id}/resolve \
  -H "Content-Type: application/json" -b cookies.txt -d '{}'

# 3. Resolve WITH verification — should 200
curl -X POST http://localhost:5000/api/me/gaps/{id}/resolve \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"verificationSource":"https://irs.gov/...","verificationVerbatim":"EIN 41-3618003 confirmed active","resolvedBy":"Dr. Flood"}'

# 4. Pre-submit gate (no bindings) — should return { pass: false }
curl http://localhost:5000/api/me/evidence/test-grant-1/pre-submit-gate -b cookies.txt

# 5. AI-author a paragraph against a verbatim requirement
curl -X POST http://localhost:5000/api/me/proposal-authoring/draft \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"grantId":"test-grant-1","sectionName":"Need Statement","reqNumber":"M.1.a","rfpRequirementVerbatim":"Describe the need being addressed by the proposed project.","scoringWeight":25}'
```

If all 5 pass, the contracting fork is functional.

---

## What's NOT in this bundle (and why)

- **Frontend pages** — you'll want to design the contracting UX fresh (no TCAF brand baggage). The 16 grant/proposal pages in this app are useful **reference**, but they're tangled with TCAF nav/auth/branding. Easier to build clean. See MANIFEST.md for the list of pages worth referencing.
- **Storage layer (`storage.ts`)** — the source app's storage.ts is ~3000 lines covering 50+ modules. For the fork, write a fresh minimal one that exposes `db` (from drizzle) + just the grant/RFP/gap/evidence/won-proposal CRUD methods you need. The route modules call `db` directly for most things; a thin storage layer is enough.
- **Replit Auth wiring** — generated automatically by the `javascript_log_in_with_replit` integration in your new Repl. Don't try to copy from this app.

---

## Quick-start TL;DR for someone in a hurry

1. New Repl → Express+Vite+TS template
2. Add Postgres + Replit Auth integration + Anthropic (or OpenAI) integration
3. Drop everything from `server/` into your new `server/`
4. Drop `scripts/` into your new `scripts/`
5. Paste `shared/schema-contracting.ts` into your new `shared/schema.ts` (after auth tables)
6. Paste the routes registration block into your new `server/routes.ts`
7. `npm run db:push && npm run dev`
8. Smoke-test the 5 curls

That's the whole fork.
