# CURRENT — Active Working Memory

**Last compiled:** 2026-05-24
**Max length:** 200 lines. Recompile when exceeded.
**Purpose:** Everything the agent needs *right now* to act correctly. No history, no detail — pointers go to `topics/` and `archive/`.

---

## 🗓️ Active submissions (chat-only reminders; no UI banners)

**Teaming bids — partners waiting on deliverables:**
- **Sedgwick County RFP #26-0028** (Vitality Weight Mgmt) — due **Tue 2026-06-02 1:45 PM CDT**. HIS Prime · TCAF/Love/Vanntastic subs. v3 at `docs/grants/sedgwick-rfp-26-0028/vitality-proposal-v3.md` (1,110 lines, 34 owner-tagged ACTION REQUIRED). Page: `/grants/sedgwick-vitality`.
- **Lake Worth ISD RFP #2026-0400-26** (K-12 PD/Services) — due **Thu 2026-06-04 5:00 PM CDT**. TCAF Prime + HIS compliance sub. **Vann + Love NOT on this bid.**

**Individual/TCAF-solo pursuits (status = pursuing / loi_drafting / drafting):**
- **SSG Fox FY27** (VA Suicide Prevention) — due **Fri 2026-06-12 4:59 PM ET**. Year-1 Central TX only · ask $400K–$600K. **Lives on `vetmissiontransition.com`, NOT this codebase.** Do not rebuild here.
- **NSF 26-508 TechAccess: AI-Ready America** — due **Tue 2026-06-16**. Status: LOI drafting.
- **Promise Neighborhoods 84.215N** (ED) — due **Thu 2026-08-06**. Status: pursuing. Needs LEA partner.

Do **not** add `researched` / `identified` / `watch_next_cycle` rows without user say-so.

## 🚨 Live gotchas (active — read every session)

1. **Meredith Sissnet ≠ City of Austin grants.** City employee. Never list on any City of Austin grant/contract. Non-City only.
2. **Anika Amie ≠ TCAF principal.** Name was in inherited RWJF draft; user does not know this person. Verify all named persons in any inherited draft.
3. **Dr. Vann's lane:** youth+family attendance/services tracker for Iasis youth + Sistahs women's-health. **Never** foster youth. Iasis side = spouse COI on City of Wichita/federal.
4. **St. David's Foundation:** "actively evaluating" only — never "awarded" or "in review." WAB2 LOI declined 2026-05-15 (Regan Gruber Moffitt).
5. **Smart Family Fund:** Pitch C submitted 2026-05-17. Decision window Nov 2026 (plan 6mo silence).
6. **No teaming defaults.** Per-proposal team selection based on lane fit. Never assume Flood+Vann+Love+Hargrave on every bid.
7. **Pull from system every response** (Iron Rule #1). Memory is a hint; system wins.

Full list with code-level details → `topics/gotchas.md`.

## 🆔 TCAF identifiers (institutional, never change without verification)

- Legal: **The Collaborative Advocate Foundation** · EIN **41-3618003** · name control **THEC**
- 501(c)(3) **DETERMINED** (Letter 947, eff. 2026-01-14) · public charity **§170(b)(1)(A)(vi)**
- Address: **17912 Stefano Drive, Pflugerville, TX 78660-7020** c/o Terry D Flood Sr.
- SAM: UEI **KDDVD1FGLW35** · CAGE **209N1** · ACTIVE through **2027-05-06**
- Dr. Flood: **President** (not CEO on TCAF) · Active US gov Secret-level clearance
- Institutional email: `terryflood@thrivingcommunitiesforall.com`

Two-entity: **ISS LLC** (for-profit, SBIR/STTR/GSA only) UEI **C7YDV3P8EHL7** · CAGE **9VKK3** · SAM Active to 2027-03-30. **M&T Consulting = OUT-OF-SCOPE.** Full detail → `topics/partners.md`.

## 🤝 Active teaming roster (verified 2026-05-23)

- **TCAF / Dr. Terry D. Flood** (President) — 254-319-8460 · terryflood@thrivingcommunitiesforall.com
- **HIS (Hargrave Innovative Solutions) / Eric Hargrave** (CEO) — 601-238-4186 · ericd@hisolution.org · likely MS-incorporated
- **Love Clinic MedSpa / Dr. Chela Love DNP** — 214 S Rock Rd Suite 101, Wichita KS 67207 · 316-669-4770
- **Vanntastic Solutions / Dr. J. Michelle Vann** — 316-350-2601 · www.jmichellevann.com

Full lane detail + Vann spouse-COI + Love bilingual capacity → `topics/partners.md`.

## 📐 Operating constraints

- **Title:** President for Dr. Flood (TCAF). CEO only for-profit work.
- **Emails:** institutional only — no personal Gmail in copy or proposals. Sissnet email = non-City only.
- **Forbidden file changes** without explicit ask: `vite.config.ts`, `drizzle.config.ts`, `package.json`.
- **No silent catch blocks**, no conditional `useEffect`, no hardcoded grant arrays.
- **Public no-auth wizards** must use capability tokens, not client-supplied IDs (pattern: `server/foster-youth-intake-routes.ts`).
- **AI calls** must route through `server/ai-provider.ts` so the ethical-EI preamble wraps them.

## ⚖️ Federal Acquisition (FAR) — standing doctrine

Full reference: **`docs/agent-memory/topics/federal-acquisition.md`** — read at task start for ANY federal contract or solicitation.

**Critical distinction:** Grants (SSG Fox, SAMHSA, NIH) → 2 CFR 200. Contracts (VA/DoD/HHS service contracts) → FAR. Never conflate.

**TCAF's #1 unlocked advantage — SDVOSB:** Dr. Flood = medically retired, service-connected disability (MS). SBA VetCert SDVOSB application **NOT YET FILED** — file immediately. VA statute requires SDVOSB set-asides first (Veterans First). Sole-source authority up to $5M services once certified.

**Key NAICS for TCAF:** 624190 (primary) · 624229 · 923120 · 611430 · 541611 · 541690 · 541720

**SAM renewal:** TCAF active through **2027-05-06**. ISS LLC active through **2027-03-30**. Set 60-day advance reminders.

**Proposal structure under FAR 15:** Section M = scoring rubric (write to this first). Section L = format instructions. Section C = the requirement. Iron Rule #5 (RFP Fidelity) IS FAR 15 logic — identical discipline applies.

**FAR 31 budget rule:** Every cost must be reasonable + allocable + compliant. Unallowable: entertainment, alcohol, lobbying, fines, charitable contributions, advertising (non-recruitment).

**Service Contract Act:** SCA wage determinations required on most federal service contracts — look up WDOL rate for Travis County TX before pricing any federal service contract.

## 🧭 Pointers (where things live — 1-liners)

- Run: `npm run dev` · DB: `npm run db:push` · Typecheck: `npm run typecheck` · E2E: `npx playwright test`
- Audits: `npx tsx scripts/congruence-audit.ts` (0 FAIL required) · `npx tsx scripts/memory-health.ts` (memory hygiene)
- Capabilities inventory: `docs/grants/tcaf-capabilities-inventory-2026-05-17.md`
- Grants tracker: `docs/grants/MASTER-GRANTS-TRACKER-2026-05-19.md` · pipeline DB: `proposal_pipeline`
- Active commitments: `docs/active-commitments.md`
- Compiled agent knowledge: `scripts/compile-agent-knowledge.ts` → `.agents/knowledge/compiled.json`
- Sidebar: `client/src/components/app-sidebar.tsx` · App router: `client/src/App.tsx`
- Sedgwick workspace: `/grants/sedgwick-vitality` · v3 doc: `docs/grants/sedgwick-rfp-26-0028/vitality-proposal-v3.md`

## 📊 Platform scale (verified 2026-05-22)

- 271 Drizzle tables · 211 pages · 84 server files · 206 wouter routes
- 721 grants tracked (grants.gov 369 · usaspending 198 · samgov 36 · manual 12 · state/local 18 · other federal 8 · foundation/corp 4 · misc 6). Fit ≥70/80/90 = 208/186/160.
- 15 public-facing ecosystem platforms (25 DB rows internally). External count is always 15.
- AI engines: Gemini 2.0 Flash · Claude Haiku 4.5 · GPT-4o-mini · Replit AI GPT-5-nano · OpenRouter DeepSeek R1 — all auto-wrapped via `ETHICAL_EI_PREAMBLE`.

## 🆘 If lost / cold-start

1. Read `replit.md` (Iron Rules)
2. Read this file (`CURRENT.md`)
3. Read most-recent `sessions/YYYY-MM-DD.md`
4. Then open the relevant `topics/<x>.md` for the specific ask.
