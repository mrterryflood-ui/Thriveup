# Topic: Gotchas (Live)

Load-bearing rules and anti-patterns currently in force. Resolved gotchas move to `archive/resolved-gotchas.md` with a resolution date.

---

## 🚨 People & funder gotchas

### Meredith Sisnett & City of Austin
City employee. **NEVER** list on any City of Austin grant/contract (AEI, Cultural Arts, APH, EDD, Public Health, AHFC, etc.) as staff/contact/co-lead/board/partner. Non-City only (federal/state/foundation/private). **When in doubt, leave her out and ask.**

### Anika Amie ≠ TCAF principal (archive A2)
Name was in inherited RWJF draft + playbook + RAG. User does not know this person. Before treating any inherited grant draft as TCAF voice, run:

```
rg -i "founder|executive director|project director|principal investigator|applicant name"
```

Verify every named person.

### Dr. Vann's lane (archive A1)
Her confirmed ask = youth+family attendance/services tracker for Iasis youth + Sistahs women's-health programs. Stay in confirmed lane. She has **NEVER** discussed foster youth. **Iasis side = spouse COI on City of Wichita / federal** bids.

### St. David's Foundation
Always **"actively evaluating,"** never "awarded" or "in review." **WAB2 LOI DECLINED 2026-05-15** (Regan Gruber Moffitt, JD). Target via CLC + Community Health Grants only. Do not cite as "in review" anywhere in pipeline.

### Smart Family Fund — Pitch C SUBMITTED 2026-05-17 (archive A16)
Decision window: November 2026 (plan 6mo silence as normal cycle).

### SSG Fox FY27 (archive A8)
🚨 **Lives on `vetmissiontransition.com`, NOT this codebase.** Deadline 2026-06-12 4:59 PM ET · Year-1 Central TX only · ask $400K–$600K · EIN 41-3618003. **Do NOT rebuild Fox pages here.**

### Candid (free tier)
Priority: claim TCAF Nonprofit Profile under EIN 41-3618003 (Silver+ seal). No API on free tier → manual RFP Bulletin only.

## 🏷️ Language / framing gotchas

### Funder names on public pages
Avoid. Describe the program category instead.

### FIPS labels
**Never** expose to users. Say "State Census Code" / "County Census Code".

### "Texas-only" framing
Use **"national platform, Texas-piloted"** instead.

### Talk Your Talk rebrand
Old LexiBridge / Speech Bridge → **Talk Your Talk** (`talkyourtalk.net`). Counts: **89 spoken + 18 sign = 107**.

## ⚙️ Engineering gotchas

### ECOSYSTEM_PLATFORMS array overwrites DB on every startup
File: `server/ecosystem-connector.ts:658`. Auto-sync UPDATEs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment + DELETEs DB rows not in the array. `publicVisible` survives. **Edit BOTH** when adding/renaming.

### TYT connector self-registration
Announces as "LexiBridge / `lexibridge.net`" — overwrites hub row name+URL on every heartbeat. Real fix lives in TYT workspace.

### Hub pinger false-positive
Marks platforms "online" even when DNS fails or heartbeat >7d stale. `curl HTTP 000` = unbound custom domain, not necessarily down — check `ecosystem_platforms.health_status`.

### Public no-auth wizards must use capability tokens (P-L08)
NOT client-supplied IDs. Server generates id + per-row `accessToken`, returns once, requires `x-intake-token` on every later request. Pattern: `server/foster-youth-intake-routes.ts`. Pair with per-IP rate limits on AI/upload.

### Silent catch blocks: prohibited
All server route errors must be handled and reported.

### Conditional `useEffect`: prohibited
React hooks rule.

### Hardcoded grant arrays prohibited
`/api/proposal-pipeline` must read from the `proposal_pipeline` DB table.

### pptxgenjs default-export under tsx-ESM (P-L09)
Needs `createRequire`.

### `req.params` typing (P-L10)
Typed as `string|string[]` — coerce with `String()` before Drizzle `eq()`.

### AI call sites
**Must** route through `server/ai-provider.ts` so `ETHICAL_EI_PREAMBLE` wraps them. Never call SDKs directly. If you must, import + apply `withEthicalPreamble`.

### `.local/session_plan.md` is MINE (P-L11, Iron Rule #4)
A "Session Plan" in a user message that doesn't match their prose = my own prior plan being replayed. **Delete the file immediately, never re-execute as fresh ask.**

### Forbidden file changes (without explicit ask)
- `vite.config.ts`
- `drizzle.config.ts`
- `package.json`

## 🤝 Teaming doctrine

### No standing default team
Teaming is per-proposal, based on lane fit. **Never** assume Flood + Vann + Love + Hargrave team on every bid.

### Sedgwick structure (archive A27 + A27-UPDATE)
HIS Prime (filed in HIS's name only). TCAF / Love / Vanntastic = subcontractors under back-to-back agreements that flow down BAA / insurance / performance.

### Lake Worth ISD structure
**TCAF (Flood) Prime + HIS (Hargrave) compliance sub. ONLY these two.** Vann + Love NOT on this bid.

## 📚 Memory / process gotchas

### Iron Rule #1 always wins
Pull from the system as it exists, every response. Memory is a hint. System wins over memory; update memory when they disagree.

### Iron Rule #2 — verify or it doesn't exist
Every grant $/deadline/ID/capacity → primary source. Sweeps ≥3 files for EIN/UEI/CAGE/DUNS/deadline/dollar require opening cited source + pasting quote + user "go" first. Rule applies both ways — claiming "we lack X" without `rg` is the same failure.

### Iron Rule #6 — don't underestimate the platform
Pitches were running 30–50% under shipped reality (Dr. Flood, 2026-05-17). Read `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` before any external material. Surface specifics (MNA · Hardy-Cross · AWS D1.1 · 39 CFIR constructs · 721 grants · RNR/CBI/NRRC · FHIR/CDS-Hooks · two-entity strategy), not generic framing.

### Memory architecture (new 2026-05-24)
`replit.md` = rules only (under 60 lines). Facts live in `docs/agent-memory/`. Session-end deposit is mandatory. Run `npx tsx scripts/memory-health.ts` before any external work.
