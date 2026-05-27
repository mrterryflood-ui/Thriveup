# Topic: Architecture

Stack, codebase scale, where things live, key design decisions.

---

## Stack

- **Frontend:** React · Vite · TypeScript · Tailwind · shadcn/ui · wouter · TanStack Query v5 · lucide-react
- **Backend:** Express · PostgreSQL (Neon) via Drizzle ORM · Replit Auth (OIDC)
- **AI:** Gemini 2.0 Flash · Claude Haiku 4.5 · GPT-4o-mini · Replit AI GPT-5-nano · OpenRouter (DeepSeek R1) — all auto-wrapped by `ETHICAL_EI_PREAMBLE` in `server/ai-provider.ts`
- **i18n:** EN + ES human-translated; 8 additional languages (VI/ZH/AR/KO/FR/TL/HI/MY) opt-in AI (gpt-4o-mini, batched, localStorage-cached). `useLanguage()` from `@/lib/i18n`, `<LanguageSelector />`. `POST /api/translate`. RTL auto for Arabic. Dialect-aware (AAVE/Spanglish prompts).

## Codebase scale (verified 2026-05-17, grants count refreshed 2026-05-22)

- **271** Drizzle tables (`shared/schema.ts`)
- **211** pages (`client/src/pages/`)
- **84** server files
- **206** wouter routes (`client/src/App.tsx`)
- **721** grants tracked (DB: `proposal_pipeline` + `grant_opportunities`)
- **25** ecosystem platforms in DB; **15** public-facing externally

## Key file anchors

| Purpose | File |
|---|---|
| Sidebar | `client/src/components/app-sidebar.tsx` |
| App router (Switch) | `client/src/App.tsx` |
| Auth wrapper | `client/src/components/require-auth.tsx` + `useAuth()` |
| Theme tokens | `client/src/index.css` |
| Truth-in-claims primitive | `client/src/components/partnership-status.tsx` |
| AI provider (preamble wrapper) | `server/ai-provider.ts` |
| Collaborative AI 4-engine | `server/collaborative-ai.ts` |
| RAG engine (user-facing) | `server/rag-engine.ts` |
| Ecosystem registry sync | `server/ecosystem-connector.ts` |
| Compiled agent knowledge (internal) | `scripts/compile-agent-knowledge.ts` → `.agents/knowledge/compiled.json` · endpoints `/api/agent/knowledge/*` |
| Route registration | `server/routes.ts` (`registerRoutes` at ~line 396; uses `register<Domain>Routes(app)` modules) |
| Drizzle schema | `shared/schema.ts` |

## Where things live (1-liners)

| Feature | Location |
|---|---|
| Capabilities inventory (13 sections) | `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` |
| Grant strategy playbook | `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md` |
| Quintet one-pager | `docs/grants/QUARTET-ONE-PAGER.md` |
| Master grants tracker | `docs/grants/MASTER-GRANTS-TRACKER-2026-05-19.md` |
| Active commitments / continuity | `docs/active-commitments.md` (read start, update end) |
| Ecosystem catalog | `docs/ecosystem-catalog.md` (25 DB rows; 15 public-facing) |
| MAP-GAP lessons learned | `.agents/skills/map-gap/lessons-learned.md` |
| IA v2 (7 sidebar hubs) + Autosave | polymorphic `editor_drafts` table wired into RFP/grant/LOI editors → archive A25 |
| Active Bids | `active_bids` DB table + `/teaming-network` + writer wiring via `buildInternalStrategyBlock()` → archive A24 |
| RFP Fidelity Engine | sidebar → `/rfp-fidelity` → `/grants/:grantId/compliance` → archive A23 |
| Foster-Youth build | `docs/foster-youth-build-log.md` — intake wizard, state portal, policy compare, risk engine |
| Community Voice (Phases 1–4) | `/voice*` · `server/voice-routes.ts` · pilot `pflugerville-holistic-services` → archive A14 |
| Trade Sims (6 trades × 15 lessons = 90) | `client/src/pages/academy/trade-sims/lesson-player.tsx` · AI tutor → archive A12 · credentials `/academy/trade-sims/:tradeSlug/certify` → archive A15 |
| ThriveUp Concepts (v1) | `/concepts` + 8 cards with real physics. **Differentiator: physics, not diagrams.** → archive A19 |
| Vann Collaboration Kit | `/partners/{vann-hub,family-program-tracker,rfp-storyteller}` → archive A1 |
| Sedgwick Vitality workspace | `/grants/sedgwick-vitality` · docs at `docs/grants/sedgwick-rfp-26-0028/` → archive A27 |
| This Week digest | `/grant-command-center` This Week tab · `GET /api/grants/this-week` · admin manual digest send; no cron |
| Monday Brief | `/this-week` (`client/src/pages/this-week.tsx`) — edit `SHIP_TARGETS_THIS_WEEK` + `FUNDER_DECISIONS_PENDING` weekly |

## Architecture decisions

- **Collaborative AI:** 4-engine synthesis (Gemini · Claude · GPT-4o-mini · DeepSeek R1) + RAG + implementation science (CFIR · RE-AIM · RPLICE)

## 🚨 Cross-repo architecture (added 2026-05-27)

**ThriveUp and RPLICE are TWO separate codebases linked by API, not co-located.** This repo (ThriveUp) is what `rg`, `ls`, and `find` can see. **RPLICE is a separate repo** that ThriveUp's filesystem tools CANNOT see directly. When auditing implementation-science / EBI-catalog / treatment-fidelity / measurement-studio claims, those live in the **RPLICE** repo — not here.

**Known RPLICE-side files (per cross-repo receipts from Dr. Flood 2026-05-27, line counts verified by the RPLICE-side AI):**
- `client/src/lib/applied-examples.ts` (613 lines) — applied EBI examples (header cites Bunger 2016 / Singh 2021 / Proctor 2013; Collaborative Care NOT structured here yet)
- `shared/is-catalog.ts` (1,848 lines) — Implementation Science catalog (REP/Kilbourne + DAP/Aarons NOT actually present; that was a prior subagent hallucination)
- `client/src/pages/measurement-studio.tsx` (256 lines)
- `client/src/pages/mechanism-preservation-registry.tsx` (337 lines — scaffolded, not pure proposal)
- `client/src/pages/sustainment-capability-tracker.tsx` (258 lines — scaffolded, not pure proposal)
- `server/validation/womens-health-canon.ts` (365 lines)
- `server/her-health-bridge-routes.ts` (195 lines)
- `server/routes.ts`, `server/research-seed-data.ts`, `server/ecosystem-rag-service.ts`, `client/src/pages/adaptation-wizard.tsx` — contain Collaborative Care strings but not a structured citable EBI record

**Iron Rule #10 application for cross-repo claims:** when a claim involves "applied-examples", "is-catalog", "measurement-studio", "mechanism-preservation-registry", "sustainment-capability-tracker", "womens-health-canon", "her-health-bridge", "adaptation-wizard" — these are **RPLICE**, not ThriveUp. `rg` against this repo returning zero is NOT proof of absence; ask Dr. Flood or the RPLICE-side AI for the cross-repo verification, or accept the received receipts.

**Honest framing standard when these RPLICE assets ARE cited in external proposals:** "scaffolded (N lines); instrument validation + field deployment funded by this prize" — stronger than "we will build," weaker than "shipped to production." Don't oversell.
- **Grant Systems:** centralized mgmt, SAM.gov integration, AI semantic analysis, proposal lifecycle. Public program copy ≠ internal funder-pursuit detail
- **Truth-in-Claims primitive:** `<PartnershipStatus>` enforces auditable disclosure of partnership stage + dates on public site
- **Public/Internal gating:** `<RequireAuth>` wraps internal data + funder pipelines
- **Jurisdiction-agnostic:** national platform; Travis County TX = template, not limit

## Product (6 domains)

Criminal Justice · Health Equity · Behavioral Health · Workforce & Business · Education & Learning · Community & Advocacy

- ThriveUp Academy (AI Literacy · Workforce · Financial · STEM · FAFSA · apprenticeship)
- Grant management (721 tracked, command center, AI drafting, tier-weighted AI fit-scoring)
- Justice/reentry (RNR/CBI/NRRC)
- Behavioral & whole-person health (FHIR/CDS-Hooks)
- SDOH/Vulnerability/Census tools
- Donor outcome receipts

## Run & Operate

| Command | Purpose |
|---|---|
| `npm run dev` | Start (Express + Vite on port 5000) |
| `npm run db:push` | Apply Drizzle schema |
| `npm run typecheck` | TS check |
| `npx playwright test` | E2E |
| `npx tsx scripts/congruence-audit.ts` | Pre-funder-meeting audit (must hit 0 FAIL) |
| `npx tsx scripts/memory-health.ts` | Memory hygiene check (must pass before external work) |
| `npx tsx scripts/compile-agent-knowledge.ts` | Recompile internal agent knowledge after rule changes |
| `scripts/ecosystem-alignment-scan.sh` | Ecosystem alignment scan |

## Third-party

Replit AI Integrations (`javascript_openai_ai_integrations`, `_anthropic_`, `_openrouter_`) · Replit Auth (`log_in_with_replit`) · Drizzle ORM · Tailwind/shadcn · TanStack Query v5 · Wouter · SAM.gov API · Playwright · Implementation Science (RPLICE · CFIR/RE-AIM · MAP-GAP) · **Tabbara prior-award checklist** (SAM.gov, USASpending.gov, sbir.gov, etc.) — mandatory for ALL grants regardless of size. Template `docs/grants/AEI-Funder-Intelligence.md`.
