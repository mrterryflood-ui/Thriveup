# Contracting-Only Fork — Replication Manifest

**Created:** 2026-05-27 · **Purpose:** Per Dr. Flood directive 2026-05-27 (Option B locked) — replicate the contracting-only stack into a separate Replit app. This manifest is the literal copy-list with import-rewrite notes.

**Posture:** the new app is **contracting only** — no academy curriculum, no LifeBridge, no Voice, no Whole-Person Health, no Foster Youth, no Justice Hub, no Trade Sims. Just RFP ingestion → compliance matrix → gap-closure → evidence binding → authoring → exports → win/loss learning.

---

## Step 1 — In the new Repl, start from a "Express + Vite + Drizzle + PostgreSQL" template

This gives you the same project shape (`server/` + `client/` + `shared/` + `drizzle.config.ts` + `vite.config.ts`). Add a PostgreSQL database (Replit-managed, just like this one).

Set the same secrets in the new Repl:
- `DATABASE_URL` (auto from Replit DB)
- `OPENAI_API_KEY` · `ANTHROPIC_API_KEY` · `GEMINI_API_KEY` · `OPENROUTER_API_KEY` (any one is enough — `ai-provider.ts` fans out)
- `SESSION_SECRET` (Replit auth)

**Replit integrations to add to the new Repl** (already in this app — re-add by name in the new Repl's integrations panel):
- `javascript_log_in_with_replit` (auth)
- `javascript_anthropic_ai_integrations` OR `javascript_openai_ai_integrations` (AI)
- `javascript_openrouter_ai_integrations` (AI fallback)
- `javascript_object_storage` (uploaded PDFs)

---

## Step 2 — Copy these files verbatim (the contracting core)

### Shared schema (tables only — strip the rest)

| File in THIS app | Lines to copy | Goes to | Notes |
|---|---|---|---|
| `shared/schema.ts` | `complianceMatrixItems` (~L5679–5709) | `shared/schema.ts` | Already in the codebase; this is the L2 table |
| `shared/schema.ts` | `wonProposals` (~L5602–5622) | `shared/schema.ts` | L7 win/loss corpus |
| `shared/schema.ts` | `activeBids` (~L5645–5677) | `shared/schema.ts` | RFP tracking + per-criterion rubric strategy |
| `shared/schema.ts` | `foundationIntelligence` (~L5625–5642) | `shared/schema.ts` | 990-PF / funder intel cache |
| `shared/schema.ts` | `rfpDocuments` (search the file) | `shared/schema.ts` | Existing RFP doc stack used by rfp-fidelity-engine |
| `shared/schema.ts` | **NEW** `rfpIngestionJobs` + `gapClosureItems` + `evidenceBindings` (~L5711–5810) | `shared/schema.ts` | Phase 0 tables — shipped today |
| `shared/schema.ts` | `users` + Replit Auth tables | `shared/schema.ts` | Required by auth integration |
| `shared/schema.ts` | `userOrgMemberships` + organization tables | `shared/schema.ts` | Multi-org tenant primitive |

**Skip** everything else in `shared/schema.ts` — student progress, modules, lessons, foster-youth, justice, healthcare, benefits, etc. The file is ~5800 lines; the contracting subset is ~600 lines.

### Server modules — copy verbatim

| File | Purpose | Notes |
|---|---|---|
| `server/ai-provider.ts` | ETHICAL_EI_PREAMBLE + withRfpTemplateDiscipline + provider fan-out | **Copy whole file.** Core voice + RFP discipline. |
| `server/tenant-middleware.ts` | `requireAuth` / `requireOrg` / `getCallerOrg` / `rateLimitAi` | **Copy whole file.** Every contracting route depends on it. |
| `server/storage.ts` | `db` export + IStorage interface | Copy `db` + the org/user/grant CRUD methods only; strip academy/foster/justice/healthcare methods. |
| `server/replit_integrations/auth/replitAuth.ts` | Replit auth glue | Copy whole file. |
| `server/rfp-rubric.ts` | RFP document stack loader | Copy whole file. |
| `server/rfp-fidelity-engine.ts` | Compliance matrix extractor + audit | Copy whole file. |
| `server/rfp-fidelity-routes.ts` | Routes for the fidelity engine | Copy whole file. |
| **`server/rfp-ingestion.ts`** | **NEW** L1 PDF auto-parse | Shipped today. Copy whole file. |
| **`server/rfp-ingestion-routes.ts`** | **NEW** L1 HTTP routes | Shipped today. Copy whole file. |
| **`server/gap-closure-routes.ts`** | **NEW** L3 workflow | Shipped today. Copy whole file. |
| **`server/evidence-binding-routes.ts`** | **NEW** L5 binding + pre-submit gate | Shipped today. Copy whole file. |
| **`server/proposal-authoring-routes.ts`** | **NEW** L6 section-by-section authoring | Shipped today. Copy whole file. |
| `server/grant-routes.ts` | Grant CRUD + ingest-from-URL + alerts | Copy whole file. Trim references to academy if any. |
| `server/won-proposals-routes.ts` + `server/won-proposals.ts` | L7 win/loss CRUD + RAG injection | Copy whole pair. |
| `server/active-bids-routes.ts` + `shared/active-bids.ts` | Per-RFP teaming + rubric strategy | Copy whole pair. |
| `server/grant-narrative-routes.ts` | AI grant-writing | Copy whole file (uses ai-provider — already on the manifest). |
| `server/ecosystem-rplice-bridge.ts` | L5 RPLICE evidence retrieval | Copy whole file. |
| `server/rplice-tools.ts` | RPLICE tool surface | Copy whole file. |

### Client pages — copy the contracting pages only

| Page | Why keep |
|---|---|
| `client/src/pages/grant-hub.tsx` | Main contracting landing |
| `client/src/pages/grant-applications.tsx` | List of pursuits |
| `client/src/pages/grant-command-center.tsx` | Per-grant pipeline |
| `client/src/pages/grant-narrative.tsx` | AI authoring surface |
| `client/src/pages/grant-packages.tsx` | Submission packaging |
| `client/src/pages/grant-prior-awards.tsx` | Win-history |
| `client/src/pages/proposal-command.tsx` | Top-level command surface |
| `client/src/pages/proposal-pipeline.tsx` | Pipeline view |
| `client/src/pages/rfp-fidelity-index.tsx` + `rfp-fidelity-page.tsx` | Compliance matrix UI (Iron Rule #5) |
| `client/src/pages/rfp-writer.tsx` | RFP-mirror writer |
| `client/src/pages/rplice-tools.tsx` | Evidence retrieval UI |
| `client/src/pages/won-proposals.tsx` | Win corpus UI |
| `client/src/pages/sedgwick-vitality-proposal.tsx` | Example "live" proposal viewer — keep as a reference pattern, rename / repurpose for the new app |

**Skip** everything else in `client/src/pages/` — academy/lessons/parents/sparky/classrooms/health/justice/benefits/foster/voice/etc.

### Scripts — copy these

| Script | Purpose |
|---|---|
| `scripts/md-to-docx.mjs` | Markdown → DOCX export (Sedgwick-proven) |
| **`scripts/export-submittable.mjs`** | **NEW** Submittable form-mapping (shipped today) |
| **`scripts/export-grants-gov.mjs`** | **NEW** Grants.gov SF-424 XML (shipped today) |
| `scripts/congruence-audit.ts` | Pre-submit primary-source audit |
| `scripts/memory-health.ts` | Optional — only if you keep the agent-memory pattern |
| `scripts/compile-agent-knowledge.ts` | Optional — only if you keep the agent-memory pattern |

### Docs — copy if you want the doctrine

| Doc | Purpose |
|---|---|
| `docs/grants/RFP-FIDELITY-DOCTRINE.md` | Iron Rule #5 doctrine |
| `docs/proposal-studio-v2/PLANNING.md` | This v2 planning doc |
| `docs/proposal-studio-v2/CONTRACTING-FORK-MANIFEST.md` | This file |

---

## Step 3 — Files NOT to copy (explicit deny-list)

These are academy / community-platform / TCAF-specific surfaces that have NOTHING to do with contracting:

- `client/src/pages/{landing,coverage,subjects,curriculum,module,lesson,quiz,sparky,community,parents,classrooms,*-companion,achievements,sankofa-*,foster-*,justice-*,benefits-*,whole-person-health,trade-sims,voice-*,lifebridge-*,reentry-*,workforce-*,healthcare-*,navigator-*}.tsx`
- `server/{sankofa-gateway,benefits-routes,resident-journey,safety-escalation,justice-routes,workforce-routes,navigator-routes,foster-*,reentry-routes,partner-routes,outcome-routes,whole-person-*,trade-sim-*,voice-*,college-access-*}.ts`
- `shared/schema.ts` tables: `students`, `modules`, `lessons`, `quizzes`, `progress`, `classrooms`, `parentDashboard`, `fosterYouth`, `justiceCases`, `benefitsApplications`, `wholePersonHealth`, `tradeSims`, `voiceInvitations`, `reentryParticipants`, etc.

**Rule of thumb:** if a file mentions academy, lesson, classroom, parent, student, sparky, foster, justice, benefits, health, voice, trade-sim, reentry, navigator, sankofa, or whole-person — leave it behind.

---

## Step 4 — Import rewrites

Most copied files have these import patterns; they map cleanly:

| Pattern in this app | Action in new app |
|---|---|
| `import { db } from "./storage"` | Same — keep the trimmed `storage.ts` |
| `import { ... } from "@shared/schema"` | Same — vite alias `@shared` → `shared/` already in `vite.config.ts` template |
| `import { ... } from "./ai-provider"` | Same — copied verbatim |
| `import { ... } from "./tenant-middleware"` | Same — copied verbatim |
| `import { ... } from "./ecosystem-connector"` | **REWRITE.** Only keep what `ecosystem-rplice-bridge.ts` actually needs. Or stub. |
| Any import of `sankofa-gateway`, `benefits-*`, `justice-*`, `foster-*`, `whole-person-*` | **Delete the call site.** Contracting fork doesn't need it. |

---

## Step 5 — `server/routes.ts` registration block

In the new Repl's `server/routes.ts`, register only these route modules (the contracting-only set):

```ts
import { registerGrantRoutes } from "./grant-routes";
import { registerWonProposalsRoutes } from "./won-proposals-routes";
import { registerActiveBidsRoutes } from "./active-bids-routes";
import { registerRfpFidelityRoutes } from "./rfp-fidelity-routes";
import { registerRfpIngestionRoutes } from "./rfp-ingestion-routes";
import { registerGapClosureRoutes } from "./gap-closure-routes";
import { registerEvidenceBindingRoutes } from "./evidence-binding-routes";
import { registerProposalAuthoringRoutes } from "./proposal-authoring-routes";
import { registerGrantNarrativeRoutes } from "./grant-narrative-routes";

// inside registerRoutes(app):
registerGrantRoutes(app);
registerWonProposalsRoutes(app);
registerActiveBidsRoutes(app);
registerRfpFidelityRoutes(app);
registerRfpIngestionRoutes(app);
registerGapClosureRoutes(app);
registerEvidenceBindingRoutes(app);
registerProposalAuthoringRoutes(app);
registerGrantNarrativeRoutes(app);
```

That's it. Everything else this app registers is non-contracting.

---

## Step 6 — `client/src/App.tsx` routes

Register only the contracting pages from Step 2's frontend list. Use the same `wouter` `<Route>` pattern this app uses (`client/src/App.tsx` lines 291+).

---

## Step 7 — Initial DB push + smoke test

In the new Repl:

```bash
npm run db:push      # creates all the tables from the copied schema
npm run dev          # starts express + vite
```

Smoke checks:

1. `POST /api/me/rfp-ingestion/text` with a small RFP excerpt → returns `{ jobId, itemsExtracted, items }`.
2. `POST /api/me/gaps` with `{ grantId, title }` → returns the created gap.
3. `POST /api/me/gaps/:id/resolve` without `verificationSource` → **must 400** (Iron Rule #2 gate working).
4. `POST /api/me/evidence` with a binding → `GET /api/me/evidence/:grantId/pre-submit-gate` returns `{ pass, blockingIssues }`.
5. `POST /api/me/proposal-authoring/draft` with a Wellcome-shaped requirement → returns `{ draft, suggestedBindings, actionMarkers }`.

If all five pass, the contracting fork is functional.

---

## What's in this manifest that's already shipped in THIS app (verifiable today)

| Layer | Files shipped this session (2026-05-27) | Verification |
|---|---|---|
| Schema | `rfpIngestionJobs` + `gapClosureItems` + `evidenceBindings` in `shared/schema.ts` | `npm run db:push` succeeded — tables created |
| L1 | `server/rfp-ingestion.ts` + `server/rfp-ingestion-routes.ts` | `npx tsc --noEmit` clean on both files |
| L3 | `server/gap-closure-routes.ts` | `npx tsc --noEmit` clean |
| L5 | `server/evidence-binding-routes.ts` (+ exported `runPreSubmitGate`) | `npx tsc --noEmit` clean |
| L6 | `server/proposal-authoring-routes.ts` | `npx tsc --noEmit` clean |
| Phase 3 | `scripts/export-submittable.mjs` + `scripts/export-grants-gov.mjs` | Files written; zero-dep so they run anywhere |
| Routes | All four `register*Routes(app)` registered in `server/routes.ts` | Workflow restarted clean |

**Total new code shipped:** ~1,100 lines across 8 files. Net new tables: 3.
