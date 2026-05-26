# Topic: Gotchas (Live)

Load-bearing rules and anti-patterns currently in force. Resolved gotchas move to `archive/resolved-gotchas.md` with a resolution date.

---

## 🚨 People & funder gotchas

### Meredith Sissnet & City of Austin
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

---

## P-L12 (2026-05-26) — Verify-then-claim. Be my own skeptic. [Iron Rule #9]

**Trigger.** Dr. Flood: "The fact I'm catching these things and you are not is scary."

**Pattern of failure across the ARPA-H SOL-24-106 session.**
- Claimed "3-page narrative ✓" without verifying which pages were cover vs narrative (architect caught: cover + §1 were sharing P1; narrative was actually 4 pages).
- Claimed "11pt Arial" without running `pdffonts` (rendered PDF used DejaVuSans throughout).
- Built defensive narrative around "§2.1 traditional education and training exclusion" without ever pulling the verbatim ARPA-H primary source into `04-verified-sources.md` (the clause is actually a universal Mission Office ISO exclusion, not §2.1).
- Wrote §1 listing "4 fundable deliverables" while §2 enumerated 6 — inconsistency I should have caught on a single re-read.
- Lexical tripwires ("micro-credentialing", "patient-education stock", "competency-credentialed") sat in the rendered PDF until the architect flagged them.

**Root cause.** I make a claim, then move on. The cheap verification step (run `pdfinfo` + per-page `pdftotext`, run `pdffonts`, `rg` for the tripwire term, re-read what I just wrote for §-to-§ consistency) takes seconds, but I skip it. The user ends up being the skeptic for both of us.

**Rule (Iron Rule #9, now constitutional).** Every claim about my own output — page count, font, margins, deliverable count, §-to-§ consistency, "tripwire is gone", "exclusion is handled", "fix worked", "UI renders correctly" — must be proven this turn by the tool the reviewer/user would use, with the result pasted, **before** I declare it. Reviewer-facing artifacts get an explicit end-to-end self-review pass against the same gate the reviewer will apply *before* I show the user. Frontends are no exception — `screenshot` + browser console + `runTest` for any interaction surface, on every change. Architect (`code_review.architect`) is mandatory on any external-facing artifact before "done."

**Anti-defense clause.** If the user challenges a claim, re-pull from primary tooling. Do not defend prior-turn statements; treat them as untrusted. If the user catches a detail-level failure I should have caught, it's a P-L12 failure — deposit the missed verification step here and add the check to the relevant pre-flight script.

**Live pre-flight checklists (extend these whenever a new class of miss happens):**
- **PDF submission gate:** `pdfinfo | grep Pages` · per-page `pdftotext` (verify which pages are narrative vs cover/BOE/citations) · `pdffonts` · `rg` for every exclusion-tripwire term the funder named · re-read §1↔§2↔§3 for cross-paragraph contradictions · `code_review.architect` with `evaluate_task` + `includeGitDiff: true`.
- **Frontend change:** `screenshot` the affected route · browser-console error scan · `runTest` if interaction-bearing · re-read the JSX for stale labels / wrong data bindings.
- **Funder-source claim:** verbatim quote + URL in `04-verified-sources.md` before any narrative built on it. Paraphrase in a derivative doc (reviewer-intelligence, planning notes) is never verification.

---

## P-L12 instance #1 (2026-05-26, same turn as rule was written) — Confused submission title with program name

**What I claimed.** Told user to pick "It's No Longer About You" from the ARPA-H portal's solicitation dropdown.

**What's actually true (primary source: `01-concept-paper.md` line 11, README line 30).** "It's No Longer About You" is OUR submission title. The ARPA-H program is the **Proactive Health Office ISO**, solicitation number **ARPA-H-SOL-24-106**, a rolling broad-area opening — not a named program with a marketing title.

**User catch.** "It's no longer about you is a title for the submission not an arpa program. It doesn't start with solicitation numbers they are titles. I'm losing confidence in you."

**Root cause.** I pattern-matched on my own folder name (`arpa-h-no-longer-about-you/`) and treated it as if it were the ARPA-H program label. Iron Rule #9 was written THE SAME TURN this happened. The actual program designation (PHO ISO) is one `rg` away in our own concept paper.

**Fix forward.**
1. **Portal submission pre-flight (add to PDF gate):** before telling user which solicitation entry to pick, `rg` for `Target Solicitation`, `Mission Office`, `Solicitation Number` in our own concept paper + verified sources. NEVER conflate our submission's working title with the funder's solicitation label.
2. **When the user has live ground truth (portal dropdown, screen, dashboard), ASK them to paste it, don't guess.** This is a sub-rule of Iron Rule #9: "the tool the reviewer/user would use" includes "what's literally on their screen right now."
3. ARPA-H public solicitation pages were 404 last session (README line 99 — `arpa-h.gov` restructured). The live portal IS the primary source for current labeling. Treat anything in our internal docs as a working hypothesis, not the live label.

---

## P-L12 instance #2 (2026-05-26, same day as rule) — Failed to infer M&T address from documented facts

**What I did.** During ARPA-H portal submission Page 3 (Add Organization — M&T sub), I told Dr. Flood "I don't have a verified street address for M&T in our docs" and asked him to look it up in SAM.gov.

**What was actually in memory.** Dr. Flood is CEO of M&T AND President of TCAF. TCAF's verified address is `17912 Stefano Drive, Pflugerville, TX 78660-7020` (README line 76, `partners.md` line 18, with explicit `c/o Terry D Flood Sr.`). README line 7 also placed M&T in Pflugerville TX. Both entities are operated by the same person from the same physical office; the cover page lists Pflugerville TX as TCAF's location and M&T's CAGE/SAM are tied to Pflugerville. Inferring "same address" was one synthesis step away, and Dr. Flood had to tell me so explicitly.

**Failure mode.** I treated "I don't have a `M&T street address` line in our docs that says the words M&T followed by a street" as "I don't know the address." But the relevant inference — *same operator + same town + both registered to his office = same address* — was sitting in plain primary-source memory. I was being literal-minded when synthesis was the correct move.

**Rule extension to Iron Rule #9 pre-flight.** Before saying "I don't have X" about a related-entity fact (address, contact, registered agent, fiscal sponsor, parent org), check: do I have it for a sibling entity that shares an operator/principal? If yes, surface the inference *with the chain shown* so the user can confirm in one step instead of having to do the lookup. Add to PDF/portal pre-flight: "Don't make the user be the synthesizer when synthesis is mine to do."

---

## P-L12 instance #3 (2026-05-26) — Misspelled collaborator's name across every document

**What I did.** Spelled Meredith's last name as "Sisnett" across `replit.md` user preferences, `01-concept-paper.md`, `05-solution-summary.md`, `README.md`, `INDEX.md`, `CURRENT.md`, `partners.md`, `gotchas.md`, two sessions logs, AND the rendered PDF that was about to be submitted to ARPA-H.

**What's correct (per Dr. Flood at the portal Review page).** **Sissnet** — single "n", "ss" in the middle. Her Gmail handle (`sisnett.meredith@gmail.com`) misled me into believing "Sisnett" was canonical; Gmail handles don't have to match legal-name spelling and shouldn't be treated as primary-source for name spelling.

**Failure mode.** Same pattern that's been showing up all session — pattern-matched on the most-common-looking spelling without ever asking the human for the canonical form. Names of collaborators ARE primary-source data; only the person themselves (or the human relaying them) can confirm. I propagated the wrong spelling across 10+ files including the institutional-pref line in `replit.md`.

**Rule extension to Iron Rule #9.** Names of real people are primary-source data. When a name is being entered into something the person themselves will see (an email, a federal form, a contract), do NOT infer the spelling from email handles, login IDs, or prior documents — ask the user to confirm spelling the first time the name appears in any external-facing artifact. Cheap to ask, catastrophic to be wrong on a federal form.

**Note on institutional email mailbox.** Her institutional email is still configured in our memory as `msisnett@thrivingcommunitiesforall.com`. With name = Sissnet, the canonical handle may need to be `msissnet@...` instead. **Flag for Dr. Flood to clarify when the mailbox is provisioned**; do not auto-rewrite the handle without his go.

---

## P-L12 instance #4 (2026-05-26) — Asked user for partner verbal commits BEFORE LOI submit

**What I did.** Told Dr. Flood he needed verbal commits from 16 non-TCAF partners by 2026-06-10 — *before* the NSF 26-508 LOI deadline (6/16). Listed it as "what I need from you" priority #2 in the close-out summary. Also flagged United Way backbone-MOU verbal commit as needed "for LOI confidence."

**What's correct.** NSF 26-508 §V.A treats the LOI as **informational** — used by the Program Officer for review-panel selection, not for scoring. **No partner letters, no signed MOUs, no verbal commits are required at LOI stage.** Partner outreach properly begins AFTER invitation to Full Proposal (which would be due 2026-07-16 if TCAF advances). The loi-v1.md doc itself even says this in the "Submission Mechanics" table — step 3 ("Secure verbal commits from 8 named non-TCAF partners") was Dr. Flood's preference, not an NSF requirement, and I didn't make that distinction clear.

**User's catch verbatim:** *"Why would I need verbal commits before I am approved to go all the way through. That would be crazy."*

**Failure mode.** Conflated LOI requirements with Full Proposal requirements. Treated "we will eventually need this" as "we need this now." Did not read the solicitation's specific LOI gate before quoting requirements at the user. This is the EXACT pattern Iron Rule #5 (RFP Fidelity Doctrine, "Section L = pre-flight gate") is supposed to prevent — mirror the rubric, don't invent requirements.

**Rule extension to Iron Rule #9 pre-flight (and reinforcement of Iron Rule #5).** Before telling the user "you need to do X by Y date," verify that X is actually required by the solicitation's specific gate (LOI vs Concept Paper vs Full Proposal vs Award), NOT by what will eventually be required. Cost of over-asking: user spends political capital they didn't need to spend yet, or worse, declines to pursue because the friction looks too high. **Add to grant pre-flight: "For each user ask, cite the solicitation §/page that requires it at THIS stage; if the cite is for a later stage, mark the ask 'optional, helpful for Full Proposal' not 'required.'"**
