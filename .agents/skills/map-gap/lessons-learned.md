# MAP-GAP Lessons Learned

## P-L16 — Auto-scraped grant rows score lower than they should (May 15, 2026)

The Grants.gov auto-scraper in our discovery engine populates thin rows (title repeated as description, eligibility blank, focus_areas empty). The keyword-based `computeFitScore` then assigns these rows ~40–60 points lower than the same opportunity in a curated record. Trigger case: SSG Fox FY27 — curated row scored 85, Grants.gov scrape of the same NOFO scored 59. User caught it. Fix forward: (a) when surfacing top opportunities to the user, dedupe by CFDA + funder + title-similarity and keep the highest-score row; (b) enrich auto-scraped thin rows with curated fields before scoring; (c) never trust a scraped fit_score alone — check for a duplicate curated row first.

## P-L15 — Never conjecture, always verify (iron rule, May 15, 2026)

Never offer "best estimates," "inferred ranges," or "sweet spot" sizing for any grant amount, deadline, funder policy, or application window without pulling it from a primary source (funder's own website, RFP attachment, 990-PF Schedule I, or direct funder communication). If the answer requires a number or a date and we don't have it verified, the answer is "I have not verified — verifying now" followed by a real lookup, NOT a confident guess. Subagent answers that cite our own internal drafts as "verification" are circular reasoning and must be rejected. Trigger case: Centene Foundation May 31, 2026 deadline was carried forward as fact from a stale intelligence file — verification on 2026-05-15 from centene.com/who-we-are/centene-foundation/becoming-a-partner.html showed Centene Foundation moved to invitation-only in 2026 and the open-cycle does not exist. Almost wasted a submission. Cost of failure: lost trust + wasted partner time. Iron rule, zero exceptions.

## P-L14 — Read memory before claiming "we don't have X" (May 15, 2026)

**Trigger.** Mid-Centene-draft, when the question "who are the local partners?" came up, I answered as if TCAF had no external partners. The user pushed back. The list was already in `docs/active-commitments.md` (line 275: "Network roster — Wichita / Sedgwick County circle") with the four KS partners + the Austin AEI pipeline. I had to be told the file I was supposed to be running on existed.

**Cost.** Eroded user trust mid-task. Re-do of the partner section on the concept paper. The user had to do my memory job for me.

**Root cause.** Treating the question "do we have partners?" as a *capability question* (what do I know offhand) instead of a *retrieval question* (what's in the memory file). Memory files exist precisely because main-agent context can't hold everything.

**Rule.** Before answering "we don't have X" / "no external Y" / "nothing on record for Z" — `rg -i "<topic>" docs/active-commitments.md replit.md .agents/skills/map-gap/lessons-learned.md` first. If memory says we have it, we have it; surface what memory says, then ask the user to confirm/correct. If memory is silent, *then* answer "nothing on record" and propose adding it.

**Companion to P-L13** (don't act on "user wants Y" without verifying) — together: *neither invent nor deny.* Memory is the ground truth; verify with user before acting on contested entries; never assume absence without searching.

---

## P-L11 — Status-change sweeps must be exhaustive (May 14, 2026)
When a foundational entity-status fact changes (e.g., 501(c)(3) "pending" → "determined", SAM "Submitted" → "Active", CAGE "pending" → assigned), a single-file update is never enough. The stale claim propagates across:
- Public-facing copy (donor pages, landing footers, about pages, non-discrimination, transparency matrix, sidebar)
- Grant narratives (every NOFO draft + assurance section + organizational-capacity section)
- Server-side AI prompts (donor-receipt generation prompts that hardcode pilot-status claims)
- Server-side grant-fit feature lists (capability area descriptions with "Pending 501(c)(3) determination workflows")
- Page-component checklists (status: "pending" entries that should flip to "complete")
- Congruence-manifest expected-text claims (assertion strings must match new page text or audit breaks)
- PPTX/Markdown briefing generators (footer strings, honest-disclosure blocks, contact slides)
- Drizzle/JSON config in grant-tracking UI (Owner enums, MOU labels)

**Pattern:** After any entity-status update, run `rg -n -i "<old-claim-pattern>" -g '!attached_assets' -g '!.agents/knowledge'` exhaustively, batch-edit in parallel, then re-run the congruence audit. Two passes are typical; the second pass catches Badge components, JSON manifest claims, and AI prompt strings the first pass missed. **Don't stop sweeping until rg returns zero hits.**

**Concrete trigger (this session):** SAM "Submitted" → "Active" + CAGE 209N1 assignment cascaded into 32 files across 4 layers (client copy, server prompts/connectors, grant docs, checklist UX). The architect review caught a UX regression (invalid `status: "complete"` enum value not in the `"verified" | "pending" | "action-needed"` union) and 8 stale TCAF-as-fiscal-sponsor self-claims I missed on first pass — most critically `server/ecosystem-connector.ts` where the hardcoded array auto-syncs and overwrites DB rows on every startup.

**Always run architect() review after status-change sweeps.** Manual rg + congruence audit caught 80% of the stale references but missed (a) checklist enum violations that compile but render incorrectly, (b) reverse-direction claims ("TCAF provides fiscal sponsorship") that don't match the original sweep pattern, and (c) self-description fields buried in server-side connector arrays.

---

## Registry

Persistent lessons from each improvement cycle. Each lesson should inform future cycles and, where possible, become an automated health check.

## E-Series Lessons (ErrorRetry, PageHeader, Link Fixes)

- **E-L01**: Broken sidebar links to non-existent routes cause silent navigation failures. Always verify sidebar links match App.tsx route definitions.
- **E-L02**: ErrorRetry component must be deployed on every page that uses useQuery, not just "important" pages. Partial coverage creates inconsistent error experiences.
- **E-L03**: PageHeader with breadcrumbs should be on every navigable page for consistent navigation patterns. Partial deployment creates disorienting transitions.
- **E-L04**: Video accessibility requires CC indicator, closed caption tracks, and accessible controls with aria-labels.

## F-Series Lessons (Hooks, Document Titles, Error Handling)

- **F-L01**: React useEffect calls inside conditional blocks (if statements, early returns) violate the Rules of Hooks. Always place useEffect at the top level of the component, before any conditional returns. This was found in 6 components: subjects, achievements, teacher-dashboard, ai-tools-workspace, module-detail, lesson-viewer.
- **F-L02**: window.location.reload() in error recovery loses component state and user context. Always use query refetch instead.
- **F-L03**: document.title should be set via unconditional useEffect at the top of every page component and sub-page component (certificate views, classroom details, level details, subject details).
- **F-L04**: Shared components (lesson-comments, study-tips) should have inline error messages rather than ErrorRetry, since they're embedded within pages that already have their own error handling.
- **F-L05**: Sidebar progress queries should fail silently (no error UI) since the sidebar is a persistent navigation element that shouldn't show error states.

## G-Series Lessons (Server Hardening, Auth, Role-Based UI)

- **G-L01**: Every Express GET route handler must be wrapped in try/catch with console.error and 500 JSON response. A node script can wrap all unprotected routes mechanically — no need to do this by hand.
- **G-L02**: Any route that calls getUserId(req) MUST have requireAuth middleware. Without it, getUserId returns undefined, which can cause database errors or create orphaned records.
- **G-L03**: Mixed public/private routes (like /api/academy/dashboard) that check `if (userId)` before fetching user data are acceptable as public routes. They gracefully degrade for unauthenticated users.
- **G-L04**: Hardcoded values in API responses (like completedModules: 0) are data integrity bugs. Always calculate from the database, even if the calculation is slightly more expensive.
- **G-L05**: Admin/teacher sidebar items must be filtered by user role on the client side, even though the backend already blocks unauthorized API access. Visible-but-inaccessible navigation confuses users.
- **G-L06**: wouter's Link component renders an <a> tag. Never wrap another <a> inside a Link — this creates nested anchors and browser warnings. Pass className and data-testid directly to Link.
- **G-L07**: When adding requireAuth to previously public GET routes, verify the frontend handles 401 responses gracefully (useAuth hook, conditional rendering, redirects).
- **G-L08**: Parallel subagent execution works best for client-side tasks on independent files. Server-side tasks touching the same file should be done sequentially by the main agent.

## H-Series Lessons (Proposal Command Center — AI Content Integrity)

- **H-L01 — NEVER FABRICATE CONTENT:** A competing AI platform generated three fake past performance references (City of San Antonio, Travis County Parks, City of Houston) with invented dollar amounts, dates, and outcomes for the Travis County RFQ 202-CW response, then added "[FILL IN: Customize the past performance details above]" at the bottom. Fabricated past performance on a government procurement is grounds for debarment, not just rejection. **ABSOLUTE RULE: If you don't have real data, say "I don't have this information" and prompt the human to provide it.** Never generate plausible-sounding content that a user might accidentally submit as fact. Use {{ACTION REQUIRED}} placeholders with coaching examples so the human knows what a good answer looks like, but never fill in the answer with invented content.
- **H-L02 — HIPAA IS NOT UNIVERSAL:** The competing AI inserted HIPAA compliance language into a QA plan for a Transportation & Natural Resources strategic planning retreat. There is zero health data in this engagement. Inserting inapplicable regulatory frameworks signals that the AI is pasting boilerplate without understanding scope. **RULE: Only cite regulatory frameworks that are actually applicable to the specific solicitation.** If unsure, omit rather than overclaim.
- **H-L03 — MATCH OUTPUT TO PROCUREMENT TYPE:** The competing AI generated a 27-page, 10-section response with ISO 9001:2015 QMS, FTE staffing plans, surge capacity, retention strategies, and risk mitigation matrices for a Quick Quote — Travis County's simplest procurement vehicle. This signals misunderstanding of the procurement level. **RULE: Detect procurement type (Quick Quote vs. RFP vs. IFB vs. BAA) and calibrate response length, complexity, and section count accordingly.** Quick Quotes get 8-12 focused pages. Full RFPs get comprehensive responses.
- **H-L04 — NEVER EXPOSE PRICING STRATEGY:** The competing AI included "Pricing Target: $20,000–$25,000 (per Eric Hargrave)" in the submission document. Revealing your pricing source and strategy in a government submission tells the evaluator you're pricing to a target rather than to scope. **RULE: Pricing intelligence belongs in the internal strategy briefing (never submitted), not in the quote response.**
- **H-L05 — MULTI-AI ACCOUNTABILITY:** When multiple AI engines are available, use them to cross-check each other's outputs for fabricated content, inapplicable compliance claims, and scope mismatches. No single AI should produce final output without validation. This is why our collaborative multi-engine architecture exists — engines hold each other accountable so humans don't have to catch AI hallucinations.

## I-Series Lessons (Proposal Research Discipline — DOL RESTART Comparison)

- **I-L01 — READ THE ACTUAL FOA BEFORE WRITING:** When a grant has a downloadable FOA/NOFO/RFP document, download and read the full document BEFORE writing any narrative, budget, or strategy. Web search summaries and press releases do not contain scoring weights, participant minimums, age restrictions, FTE requirements, or period of performance specifics. The competing system (MCE) read the actual FOA PDF and caught: (a) intermediaries can ONLY serve ages 15-24, (b) 42-month POP not 36, (c) PI must be 100% FTE, (d) 680 minimum participants at $5.1M, (e) exact scoring breakdown (106 pts, Project Design = 58 pts). We missed all five because we relied on web search summaries. **ABSOLUTE RULE: Source document first, web research second. Never draft a proposal narrative from secondary sources when the primary document is available.**

- **I-L02 — INCLUDE DEMOGRAPHIC AND CRIME DATA IN SERVICE AREA ANALYSIS:** When proposing services in a geographic area, always pull actual statistical data — incarceration rates, recidivism, unemployment among target populations, demographic breakdowns, existing program capacity. Don't use estimates and flag them for the human to verify. Do the research upfront. Sources: Bureau of Justice Statistics (bjs.gov), state DOC data (TDCJ for Texas), Census ACS, Bureau of Labor Statistics. The user specifically called this out as a gap.

- **I-L03 — LEARN FROM COMPETING OUTPUTS:** When the user shares a competing system's output, analyze it for: (a) things they caught that we missed, (b) structural/design choices that are stronger, (c) errors or fabrications in their output. Be honest about where they did better. This is not a competition to win — it's a quality improvement process. Document specific improvements and apply them to the next deliverable.

- **I-L04 — MATCH FOA TERMINOLOGY AND STRUCTURE EXACTLY:** Federal grant applications should mirror the FOA's section headers, scoring criteria labels, and terminology. If the FOA says "Project Design" worth 58 points, the narrative section should be titled "Project Design" and address every sub-criterion listed. Don't paraphrase or reorganize the FOA's structure — follow it.

- **I-L05 — VALIDATE ELIGIBILITY CONSTRAINTS BEFORE PROPOSING TRACK/POPULATION:** Before choosing an application track (intermediary vs. direct, youth vs. adult), verify every eligibility constraint for that track. The intermediary track restricting service to ages 15-24 was a disqualification-level error that would have killed the application. Track selection should be a deliberate decision matrix, not an assumption.

## P-Series Lessons (Proposal Pipeline Standard Operating Procedure)

- **P-L01 — THE 5-STEP PROPOSAL PIPELINE IS MANDATORY:** Every proposal, regardless of size or timeline, follows this pipeline. No shortcuts, no skipping steps. Whether the user says "build it now" or "let's take the long road," the steps are the same — only the depth changes.

  **Step 1: KNOW THE APPLICANT**
  Before touching the solicitation, ingest the applicant's baseline reality: capability statements, past performance history, organizational profile, certifications, key personnel, financials, geographic presence. This is who they actually are. For TCAF, the Load Profile button captures this. For any other applicant, this step must happen first.

  **Step 2: KNOW THE OPPORTUNITY**
  Read the actual source document (FOA/RFP/RFQ/RFA/BAA). Extract every requirement, scoring criterion, eligibility threshold, compliance rule, page limit, formatting requirement, and submission instruction. Web searches and press releases are supplementary — the source document is the truth. This is the target reality.

  **Step 3: MAP-GAP ASSESSMENT**
  Compare baseline (Step 1) against target (Step 2). Produce a structured gap analysis: Here is who you are. Here is where you need to be. These are the gaps. These are your strengths. This is your competitive position — scored, quantified, honest. Include demographic and statistical data for the service area (I-L02). Include eligibility constraint validation (I-L05). This assessment drives every word of the proposal.

  **Step 4: GENERATE AGAINST THE RUBRIC**
  Build the proposal section by section, mapped directly to the scoring criteria from Step 2, informed by the gap analysis from Step 3. Where the applicant is strong, write with confidence using their actual data. Where they're deficient, use {{ACTION REQUIRED}} placeholders with specific instructions — never fabricate (H-L01). Mirror the FOA's terminology and section structure exactly (I-L04).

  **Step 5: MULTI-LENS REVIEW**
  Evaluate the output through three lenses: (a) the evaluator's eyes — does it score well against the published rubric? (b) the compliance officer's eyes — does it meet every threshold requirement? (c) the competitor's eyes — where would a stronger applicant beat this? Score it against the same rubric the reviewers will use. Flag weaknesses honestly.

- **P-L02 — QUICK BUILD vs. PIPELINE BUILD:** When the user says "build it now," run all 5 steps but compress the timeline — the steps don't change, only the depth. When the user says "let's do this right," run all 5 steps with full depth, including research, data packages, partner outreach plans, and iterative reviews. The pipeline is the same either way. Consistency and deliberateness in the process — every time.

- **P-L03 — QUALITY OF OUTPUT = QUALITY OF INPUT:** The deliverable is only as good as what goes in. If the applicant hasn't provided past performance, the proposal will have gaps. If we haven't read the FOA, the proposal will have compliance errors. If we haven't pulled the data, the Statement of Need will be weak. The pipeline ensures nothing gets skipped.

## Enforced Rules (Machine-Checkable)

These lessons have been converted into automated health checks in the MAP phase:
- No GET routes without try/catch (G-L01) → health check script
- No getUserId without requireAuth (G-L02) → grep check
- No useEffect inside conditionals (F-L01) → grep check
- No nested <a> in Link (G-L06) → grep check
- No window.location.reload (F-L02) → grep check
- No console.log in server files (cleanup) → grep check

## P-L04 — Audio = Video (Self-Audit Congruence) — added May 11, 2026

**Lesson:** Briefing claims and demonstrable software must always match. A funder who clicks something the briefing claims and lands on a 404 (or a page missing the feature) loses trust faster than any positive narrative can rebuild it.

**Mechanism (now permanent infrastructure):**
1. **Manifest-first.** Before briefing, write `docs/grants/CONGRUENCE-MANIFEST.json` with every claim → URL → required `data-testid`s → evidence file path.
2. **Audit script.** `scripts/congruence-audit.ts` consumes the manifest, fetches each URL, statically asserts every test ID exists in source (handles both literal `"foo"` and template-literal `data-testid={\`prefix-${...}\`}` patterns where the suffix appears as a string in the same file), and probes external URLs for HTTP 200 + expected keywords.
3. **Report.** Writes `.agents/congruence/last-run.md`. Non-zero exit on any FAIL.
4. **Iron rule:** Do not brief if any FAIL. The briefing PDF and the live demo are the same artifact.

**Why this rule exists:** The first manifest run on the foster-youth build returned 35 FAILs — every one of them was a template-literal test ID (`card-item-${id}`, `accordion-right-${r.id}`, `option-state-${s.code}`, `${t.testId}-title-es`) that the literal-string grep couldn't see. The IDs were correct in code but invisible to a static auditor — exactly the kind of "looks right when I write it, looks wrong when an outsider checks it" trap that breaks reviewer trust. Two fixes: (a) teach the auditor to read template-literal prefixes + verify the suffix appears as a string in the same file; (b) for nested templates, prefer literal-id rendering OR include a "static-auditor anchor" comment with quoted IDs in the source.

**Reusable beyond foster-youth:** Use this manifest+audit pattern for every funder briefing going forward. AEI, CDMRP, SAMHSA, St. David's — same structure. One file per audience. One command before the meeting.

## P-L05 — Don't treat planning notes as built features — added May 11, 2026

**Lesson:** Briefings and proposals must distinguish "we plan to," "we are building," and "you can click this right now." Mixing them is the fastest way to lose a sophisticated reviewer.

**Discipline:**
- Every claim in a public-facing or funder-facing document gets a column for "Live URL" and "Test-ID proof file." If both columns can't be filled, the claim is reframed as roadmap, not capability.
- The Foster-Youth-Transition-Briefing.md uses this structure — see the "What is live, today, that you can click" table.
- Honest disclosure block always appears before the value proposition.

**Tooling support:** The congruence audit (P-L04) makes this lesson enforceable. If the manifest claims it, the audit verifies it. If you didn't write the manifest entry, you can't put the claim in the briefing.

## P-L06 — Architect review caught congruence-audit overconfidence (May 11, 2026)

**Lesson:** Self-auditing tools must themselves be audited. The first version of the foster-youth congruence audit returned 83/83 PASS — but architect review found three quiet over-claims that would have embarrassed us in front of a HUD reviewer:

1. **Query strings were stripped before fetch.** `/fafsa-navigator?audience=foster` was probed as `/fafsa-navigator`, so the query-conditioned foster-mode callout wasn't actually being verified. **Fix:** keep the query string on the internal probe — fetch the URL exactly as the briefing tells the funder to click.
2. **External keyword mismatch was a WARN, not a FAIL.** A live page that's missing the keywords the manifest expected means the briefing is pointing at the wrong page. **Fix:** missing required keywords is now a FAIL.
3. **"Crisis on every page" and "Bilingual on every page" claims were proven by ONE page each.** The claim said every page, the audit only checked one. **Fix:** split those single claims into per-page entries (FY-009-hub, FY-009-toolkit, …) so every page must independently prove the property. Side benefit: forced creation of a shared `<CrisisStrip />` component used on all 6 pages with stable test IDs.

**Standing rule:** After the audit goes green, run the architect (`responsibility: "evaluate_task"`, `includeGitDiff: true`) once more. The audit proves the manifest. The architect proves the manifest is honest. Two checks, not one.

## P-L07 — Self-audits must be scoped, not global (May 11, 2026)

**Lesson:** A static auditor that scans the whole repo for any test-id can "prove" a claim about page A using a test-id that lives in page B. That's a false positive that *looks* green. The architect caught one in the first hardened version: FY-002 claimed toolkit categories existed on `/foster-youth/toolkit`, and the audit "proved" `section-cat-healthcare` from `benefits.tsx` instead of `toolkit.tsx`.

**Fix (now standing rule):** Every claim names exactly one `evidenceUrl` and an optional `evidenceFiles[]` allowlist. The audit ONLY scans those files for the claim's test IDs — never the whole tree. If a claim genuinely needs evidence from two files (e.g. a page using a shared component), list both explicitly. If you can't, you don't have the evidence.

**Why the cross-file scan existed in the first place:** convenience — it made early FAILs go away faster. That's the trap. Convenience masks honesty. Trade convenience for truth, every time.

---

## P-L06 (May 11, 2026) — Template-literal test IDs need cross-file evidence allowlists, not file-local-only scans

**Lesson:** When a page renders `data-testid={`prefix-${x}`}` from a list imported from a sibling data file (e.g. `STATE_ILP`), the auditor's template-literal mode needs to find the suffix literal somewhere in the claim's evidence set — not just in the same file as the template. The original implementation searched only the file containing the template; that produced false negatives whenever the data was sourced from a sibling module (the honest pattern for keeping data and presentation separate).

**Wrong move:** Either (a) inlining literal test IDs as comments in the template file just to satisfy the auditor (fake congruence), or (b) reverting to a tree-wide scan (false positives across pages).

**Right move:** Keep the per-claim scope intact. Within that scope, allow the suffix literal to live in any of the claim's `evidenceFiles[]`. The template stays in the page; the suffix lives in the data. Both files are explicitly listed by the manifest, so the trust boundary is preserved. See the audit fix in `scripts/congruence-audit.ts` (May 11, 2026) and FY-007 / FY-018 in `docs/grants/CONGRUENCE-MANIFEST.json`.

**Standing rule:** If a page-level test ID is dynamically generated from a sibling data module, the manifest entry MUST list both the page and the data file under `evidenceUrl` + `evidenceFiles[]`. No exceptions. If you can't list both, you don't have the evidence.

## P-L07 (May 11, 2026) — Admin-gated routes will FAIL e2e with non-admin sessions; that's PASS, not FAIL

**Lesson:** When an e2e harness walks a route that is intentionally admin-gated, a 401 + on-page error alert is the correct, demonstrable behavior — not a regression. Test plans should explicitly accept "either renders the dashboard OR renders the unauthorized alert" for such routes; otherwise the harness reports a failure that is actually a working access control.

**Wrong move:** Loosen the admin gate so the test passes (catastrophic — leaks intake telemetry).

**Right move:** Update the test plan acceptance criterion. For admin-gated UI, prove (a) the page renders without crashing, (b) the title/controls render, (c) the unauthorized alert renders for non-admin. If the test must verify the data path, give the harness an admin-role override (per the `testing` skill's clerk-auth override pattern), don't open the route.

## P-L08 (May 11, 2026) — Public, no-auth wizards need capability tokens. Period.

**Lesson:** I shipped the foster-youth intake wizard with all endpoints (`GET/PATCH/upload-url/document/analyze`) gated only by "URL knows the intake ID." The architect immediately flagged it as severe: anyone who guesses or scrapes an ID can read/update someone else's record (IDOR), trigger paid LLM calls (Anthropic+OpenAI), or mint signed object-storage upload URLs. Worse: the original POST handler accepted `body.id` and upserted, so a single replayed POST could overwrite an existing intake.

**Wrong instinct that caused this:** "It's a public tool — no auth means no auth." That conflates *user authentication* with *resource authorization*. A public tool can require zero login AND still need per-resource access control.

**Right pattern (now standing rule for any unauthenticated wizard that mutates server state):**
1. **Server generates the id.** Strip `body.id` on create. No exceptions.
2. **Server generates a per-row capability token** (`randomBytes(24).toString("base64url")`) and stores it on the row.
3. **Return the token ONCE in the create response** — client persists to `localStorage` (paired with the id).
4. **Every subsequent op requires the token via `x-intake-token` header** (or query string fallback). Constant-time compare with `timingSafeEqual`.
5. **Privileged roles (admin/teacher/case_manager) bypass** so internal staff still have access.
6. **Per-IP rate limits on the expensive endpoints** (AI analyze, signed upload URL) using a small in-memory bucket Map, with `Retry-After` headers. Privileged roles skip the limiter.
7. **Validate everything the client sends:** allowlist of doc types, allowlist of content types, max file size, max docs per intake, length caps on text fields. Don't trust the client even after the token check.
8. **Strip the token from every read response** (defense in depth — even admin endpoints don't need to see other youths' tokens).

**Verification I ran before declaring done:** GET without token → 403 · GET wrong token → 403 · GET right token → 200 · analyze without token → 403 · upload-url without token → 403 · upload-url with bad docType → 400 · POST with `body.id` set → returns a NEW server-generated id. All passed.

**The deeper lesson:** Honest disclosure isn't only about what we say in copy — it's about what the system actually does. A page that says "no login required, you control your information" is a LIE if anyone with the URL can read or overwrite the data. Truth lives in the code path, not the marketing.

---

## P-L09 — pptxgenjs is CommonJS-default-export; ESM `import X from "pptxgenjs"` fails

**Symptom:** Under tsx-ESM (`scripts/generate-foster-youth-pptx.ts`), `import PptxGenJS from "pptxgenjs"; new PptxGenJS()` throws `TypeError: PptxGenJS is not a constructor`.

**Root cause:** `pptxgenjs` exports the constructor via `module.exports = PptxGenJS` (no `default` key, no named export). tsx's ESM interop returns an empty namespace object; the `default` shim is `undefined`.

**Fix (works under tsx-ESM in this codebase):**
```ts
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs") as typeof import("pptxgenjs");
```

**Generalizable rule:** When a CJS package's `module.exports = ClassOrFn` and you're under tsx-ESM, do NOT trust the default-import shim. Prefer `createRequire(import.meta.url)` for the constructor; use named imports only if the package documents them as named ESM exports.

---

## P-L10 — In this codebase, `req.params.foo` types as `string | string[]` and breaks Drizzle `eq()`

**Symptom:** Compiling `server/foster-youth-agency-routes.ts` failed with TS2769 ("No overload matches this call") on calls like `eq(table.id, agencyId)` after destructuring `const { agencyId } = req.params;`.

**Root cause:** Express's typings are widened in this project so `req.params` is `Record<string, string | string[]>`. Drizzle's `eq()` overloads do not accept `string | string[]`.

**Fix:** Always coerce before passing to Drizzle column comparisons OR insert values:
```ts
const agencyId = String(req.params.agencyId);
await db.select().from(agencies).where(eq(agencies.id, agencyId));
```

**Generalizable rule:** Never destructure `req.params` directly into a Drizzle call site. Coerce with `String(...)` or schema-validate with Zod's `z.string().uuid()` first. Same applies to `req.query` values used in DB filters.

---

## P-L11 — When the audit report uses Markdown bold (`**FAIL:**`), brittle `/FAIL:\s*\d+/` regexes silently miss

**Symptom:** PPTX generator's safety gate ("refuse to publish if any FAIL") was triggered with `FAIL_COUNT = 999` (the safe-default) even after a clean 175/175 PASS audit.

**Root cause:** `scripts/congruence-audit.ts` writes the verdict as `- **PASS:** 175 / 175` / `- **FAIL:** 0`. The PPTX gate's regex `/FAIL:\s*(\d+)/` did not allow for the leading `**` from Markdown bolding, so it didn't match → fell through to the safe default of 999.

**Fix:** Make the regex tolerant of optional Markdown bold: `/FAIL:\*?\*?\s*(\d+)/`. Or — better — parse the audit JSON if/when the auditor emits one.

**Generalizable rule:** When two scripts couple via parsed text, the producer's format change silently breaks the consumer. Either (a) make the regex tolerant of trivial formatting (bold, whitespace, punctuation), (b) emit a machine-readable artifact alongside the human-readable one (`.json` next to `.md`), or (c) have the producer and consumer share a single utility. **Safe-default values (`FAIL_COUNT = 999`) saved us here — they should be the rule whenever a parser miss could mean "publish bad evidence."**

---

## P-L11 — Congruence manifest testIds must be literal strings in source, not computed via template literals (May 14, 2026)

**Context:** Built three new pages for the Vann Collaboration Kit. Added testIds to ecosystem cards via `data-testid={`card-ecosystem-${e.name.toLowerCase().replace(/\s+/g, "-")}`}`. Added matching IDs to `CONGRUENCE-MANIFEST.json`. Audit reported 9 FAILs — every card-ecosystem-* claim failed.

**Cause:** The congruence audit checks **the source file** for the literal testId string (SPA fallback when SSR isn't available). A template literal like `` `card-ecosystem-${e.name...}` `` never appears as a literal in the file, so the audit can't find it.

**Fix:** Give each list entry an explicit `id` field and reference it directly: `data-testid={`card-ecosystem-${e.id}`}`. Better still: write the testIds as fully literal strings when you can. Audit went from 214 PASS / 9 FAIL → 223 PASS / 0 FAIL with a 2-line change.

**General rule:** If a testId is going into the congruence manifest, write it so a `grep` over the source file would find it character-for-character.

## P-L12 — Multi-tenant demo data: org isolation must be enforced in the route, not just by convention (May 14, 2026)

**Context:** Vann tracker has two orgs (`sistahs-cwt`, `iasis-ccc`) seeded into the same database. The naive query `db.select().from(households)` would mix them.

**Pattern adopted:** Every list endpoint in `server/community-program-routes.ts` takes `orgId` from the URL path and uses `eq(households.orgId, orgId)` in the where clause. The seed function tags every row with its org. The frontend org-picker drives the URL; switching orgs re-issues queries with the new path. Stats are computed per-org server-side so the client never sees the other tenant's rows.

**Lesson:** When you seed two demo tenants into the same table, build the route surface around `:orgId` from the start. Adding tenant scoping after the fact is an audit nightmare and a security risk.

## P-L13 — Dr. Vann email-driven pivot: when memory says "user X wants Y," verify (May 14, 2026)

**Context:** Prior memory (May 12, 2026 entry) explicitly noted that Dr. Vann had **not** discussed foster youth with the user. Two days later her actual email arrived asking for "something similar to what you showed for our youth program" — referring to her husband's church youth ministry, NOT foster care. The May-12 lesson held: prior memory's hypothesis was right to be cautious, and the May-13 email confirmed the actual lane (Iasis Joshua Generation + Sistahs Can We Talk women's health). Built the tracker accordingly.

**Lesson reinforced:** Inherited memory framings are hypotheses, not facts. Wait for the user's actual words before committing infrastructure. P-L13 confirms P-L11's general rule from May 12.

## P-L11 — Agent-generated session plans are not user pastes (2026-05-17)

**Incident:** A "Session Plan" for building ThriveUp Trade Sims (T001-T012, 5-loop pattern, MNA solver, etc.) appeared inside a `<user_message>` envelope. I treated it as a fresh paste from Dr. Flood and almost executed it. Trade Sims has been live and 100% canvas-covered for weeks (5 trades × 15 lessons = 75, per `replit.md`). Executing the plan would have either duplicated or overwritten shipped work.

**Root cause:** I had authored `.local/session_plan.md` on 2026-05-16 22:11 during a previous Trade Sims build session. Per task-decomposition instructions, the file should have been deleted once the work completed. It wasn't. The platform re-injected it on a subsequent turn — that's the expected behavior, not a bug. The bug was me failing to recognize my own prior output.

**Detection signal:** The structured-plan content didn't match the user's actual prose in the same turn. User had asked "what is out there that should be in the pipeline" (grants question). The plan that arrived was about Trade Sims (a build task). Mismatch between user voice and plan content = strong signal the plan is replayed agent memory, not a fresh paste.

**Rule:**
1. Before treating any structured task list as a user request, check `.local/session_plan.md`. If contents match what "the user paste," it's mine.
2. Cross-check against memory: does the plan describe already-shipped work? `replit.md` and the codebase are the source of truth — not the plan.
3. If the plan is stale, delete `.local/session_plan.md` the same turn. Do not execute.
4. If the user actually wants the plan executed, they'll restate it in plain language. Wait for that signal.

**Related:** This is a memory-discipline failure, not an Iron Rule failure. Iron Rule = don't conjecture about external facts. P-L11 = don't mistake my own prior output for the user's voice.

## 2026-09-25 — Preserve partner-probe error evidence without overstating status

**Rule:** When an integration status endpoint returns structured diagnostics with a non-2xx response, preserve only the safe fields needed to distinguish explicit configuration failure from a generic probe failure. Do not present cached success as current after a failed refresh, and expose a retry state while the probe is running.

**Why:** A generic query helper can discard the non-2xx response body. That hides the difference between “configuration unavailable” and “the probe failed,” while stale cached status can falsely suggest the integration is healthy.

**How to apply:** Use this pattern for operator-facing integration status pages. Keep upstream authorization claims limited to what the probe actually established; a receiver status probe does not prove a partner sender attempted a request.
