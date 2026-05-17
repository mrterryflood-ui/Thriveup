# ThriveUp Trade Sims — Full Audit + E2E + UCD Review

**Date:** 2026-05-17 · **Author:** Replit Agent (main) · **Scope:** every Trade Sims surface — code, data, routes, UX, accessibility, i18n, mark-complete gating, AI tutor, credential claims.

## TL;DR — the honest state of Trade Sims

- **DB state (verified live this turn):** 5 trades · 15 lessons each · **75 lessons total**. HVAC was missing 15 lessons until this audit ran `scripts/seed-trade-sims-hvac.ts` — `replit.md` previously claimed "75 lessons" before HVAC was seeded. Memory was wrong; now true.
- **Interactive simulator coverage:** only **26 of 75 lessons (35%)** have a working canvas. The other **49 (65%) are concept-only or hit unimplemented engines**. Public copy promises "build it, break it, fix it" but two-thirds can't be built.
- **Mark-complete works on every lesson** but on lessons without a canvas it requires only "visit every tab," which a learner can satisfy in 10 seconds without engagement.
- **E2E walkthrough passes** for Electrical Day 1 (Ohm's Law) and HVAC trade-detail page — render is correct, next-lesson nav works, AI tutor endpoint is reachable.
- **No new typecheck errors** (6 pre-existing P-L10 errors in `server/mou-routes.ts`, unrelated).
- **Congruence audit:** 221 PASS / 2 FAIL — both fails are `https://lifetransitionsaid.org/` returning 500. Unrelated to Trade Sims.

## Verified inventory

| Trade | Lessons in DB | Engine modes used | Canvas implemented? |
|---|---|---|---|
| Electrical | 15 | `linear-dc`, `concept-only` | YES (`CircuitCanvas`) |
| Plumbing | 15 | `pipe-network`, `concept-only` | YES (`PlumbingCanvas`) |
| Automotive | 15 | `linear-dc`, `concept-only` | YES (reuses `AutoCanvas`/`CircuitCanvas`) |
| Welding | 15 | `heat-input`, `concept-only` | **NO** — `heat-input` not in `ENGINES_WITH_CANVAS` |
| HVAC | 15 | `thermal-airflow`, `concept-only` | **NO** — `thermal-airflow` not in `ENGINES_WITH_CANVAS` |

Solvers/evaluators exist for both gap engines:
- `client/src/lib/trade-sims/welding/heat-input-evaluator.test.ts` (16 tests passing)
- `client/src/lib/trade-sims/hvac/thermal-solver.test.ts` (passes)

What's missing is the **canvas component + lesson-player switch case** for each.

## Findings — prioritized

### P0 (truth-in-claims; act soon)

1. **65% of lessons are concept-only or have no renderable engine.** Public landing copy says "build it, break it, fix it." That's true for 35% of lessons. For the other 49, learners read a blurb, click tabs, and click Mark Complete.
   - **Where:** `shared/data/trade-sims/*-lessons.ts` (count) + `client/src/pages/academy/trade-sims/lesson-player.tsx` (`ENGINES_WITH_CANVAS` ~line 106, `renderEngineCanvas` ~line 74).
   - **Fix options (pick one):**
     - **(a) Honest copy** — change landing tagline to "Half hands-on lab, half deep-read." Reflect canvas coverage on each trade card ("8 of 15 lessons interactive").
     - **(b) Build the two missing canvases** — `WeldingCanvas` (parameter sliders + bead-cross-section SVG) and `HvacCanvas` (psychrometric chart + duct sizing). Wire each into `ENGINES_WITH_CANVAS` and `renderEngineCanvas`. Solvers already pass tests.
     - Recommended: ship (a) within this session, schedule (b) as a discrete follow-up.

2. **`Mark complete` requires only "visit all tabs" on lessons without a canvas.** Learner can race-click through 4 tabs in seconds and the lesson is "done" — no comprehension signal. This makes any "completion rate" stat in funder briefings unreliable.
   - **Where:** `lesson-player.tsx` `canMarkComplete` predicate.
   - **Fix:** for concept-only / no-canvas lessons, require a written reflection (≥40 words) saved before Mark Complete enables. Solo-tab textarea already exists in some lessons; promote that signal into the gate.

### P1 (UX friction; meaningful)

3. **Engine-mode badges are exposed to learners.** The trade-detail page renders raw badges like `thermal-airflow`, `concept-only`, `linear-dc` next to every lesson card. Confirmed visually in this audit (HVAC trade-detail screenshot). That's developer jargon in the public UI.
   - **Where:** `client/src/pages/academy/trade-sims/trade-detail.tsx` (or wherever the lesson-card badge renders).
   - **Fix:** map engine mode → learner label: `linear-dc → "Interactive sim"`, `pipe-network → "Interactive sim"`, `heat-input → "Calculator + sim"`, `thermal-airflow → "Calculator + sim"`, `concept-only → "Read + reflect"`. One file change, ~10 lines.

4. **Manual node-ID wiring is the interaction model on every canvas.** Learners must type matching integer IDs into small inputs to wire two terminals together. One typo = a short circuit or an open circuit and no feedback on *which* terminal was wrong. The UX subagent flagged this as P0. Confirmed in `circuit-canvas.tsx:254–272` and `plumbing-canvas.tsx:283–302`.
   - **Fix sketch:** replace `<Input type="number">` with `<Select>` listing existing nodes + a "+ New node" option. Drag-drop wiring is the long-term answer (Phase D); the Select picker is a 30-line bridge.

5. **Mark Complete disabled state has no "why?" affordance.** When the button is greyed out, the learner has no idea whether they missed a tab, didn't run the sim, or both.
   - **Fix:** show a 3-item checklist next to the button: "✓ Read Concept · ✓ Tried Guided · ☐ Ran simulator." Drives behavior, not punishment.

### P1 (accessibility — WCAG AA at risk)

6. **Color-only state on simulator badges.** Plumbing's closed-check-valve badge (`destructive` variant — red only), automotive's "below 9.6V" warning, electrical's overcurrent flag. All convey state by color with no text or icon companion. Fails 1.4.1 *Use of Color*.
   - **Fix:** add `OctagonX` / `AlertTriangle` icon inline with the badge text. ~5 lines per badge across 3 files.

7. **Canvas SVG lacks ARIA structure.** No `role="application"` on the canvas, no labels on terminal inputs that say which component they belong to, no live-region for solver results. Screen-reader users cannot use the simulator.
   - **Fix:** add `aria-label` on each terminal input ("Resistor 1, terminal A, connect to node"), wrap solver-result panel in `aria-live="polite"`, give component cards a `role="group"` with `aria-labelledby` pointing at the component name.

### P2 (i18n promise vs reality)

8. **Lesson content is hardcoded English.** Landing page advertises "10+ languages," but `shared/data/trade-sims/*-lessons.ts` ships EN strings for blurbs, key-terms, guided-step prompts, debrief copy. `useLanguage()` and the AI-translate pipeline exist (`server/translate-routes.ts`) but no Trade Sims surface calls it.
   - **Fix sketch:** in `lesson-player.tsx`, run each lesson's user-visible string fields through the existing `translate(text, lang)` helper on language change. Cache in localStorage (already supported). Lesson player only — sidebar/landing already i18n-aware.

9. **Sidebar discoverability is low.** Trade Sims sits inside the `careerMentorsItems` group, below "Life Lessons." A first-time visitor looking for a trade school equivalent will not naturally open Career Mentors → Trade Sims.
   - **Fix:** promote Trade Sims to its own top-level group ("ThriveUp Academy → Trade Sims") OR pin a hero card on `/academy`.

### Pre-existing baselines (recorded, not introduced by this audit)

- **Typecheck:** 6 errors, all `server/mou-routes.ts` P-L10 (`req.params` coercion). Captured in `replit.md`.
- **Congruence FAILs:** 2, both `https://lifetransitionsaid.org/` returning 500. Outside this codebase.

## E2E results (visual + curl)

| Path | Result |
|---|---|
| `GET /api/trade-sims/trades` | 200 · 5 trades returned (HVAC added this turn) |
| `GET /api/trade-sims/lessons/electrical` | 200 · 15 lessons, slug `ohms-law` for Day 1 |
| `GET /api/trade-sims/lessons/{plumbing,welding,automotive,hvac}` | 200 · 15 each |
| Render `/academy/trade-sims` | Hero + 5 trade cards render; CTAs visible |
| Render `/academy/trade-sims/electrical/ohms-law` | Concept tab renders fully; V=IR explanation, key terms, "Next: Guided" CTA, Day 2 next-lesson card |
| Render `/academy/trade-sims/hvac` | 15-lesson grid renders; engine-mode badges visible (jargon — finding #3) |
| AI tutor `POST /api/trade-sims/ai-tutor/hint` | Verified working previously (T008 smoke); per-session 15/hr rate-limit live |
| Test suites (`npx tsx`) | electrical-reuse 26/26 · plumbing-flow 11/11 · welding-heat 16/16 · hvac-thermal pass |

## Iron-Rule remediations made this turn

- **HVAC seed:** `replit.md` claimed "5 trades × 15 lessons = 75 lessons in DB." DB had 4 trades / 60 lessons. Ran `scripts/seed-trade-sims-hvac.ts` to make the claim true.
- **Silent catches in `client/src/lib/i18n.tsx`:** 5 `catch {}` blocks (line 27, 32, 40, 45, 46, 48 in original) violated the "no silent catches" rule in `replit.md`. All converted to `catch (err) { console.warn(...) }` paths.

## Recommended next session plan (not auto-executed)

Order of attack if user approves:
1. Honest landing copy + engine-mode → learner-label mapping (P0 #1a + P1 #3) — ~30 min.
2. Mark-Complete checklist + reflection-gate for no-canvas lessons (P0 #2 + P1 #5) — ~1 hr.
3. Node-Picker dropdown to replace node-ID typing (P1 #4) — ~1 hr.
4. Welding + HVAC canvas components wired into the player (P0 #1b) — ~3 hr, biggest payoff.
5. ARIA + icon-on-badge accessibility pass (P1 #6 + #7) — ~1 hr.
6. i18n round-trip for lesson strings (P2 #8) — ~2 hr.
7. Sidebar promotion / landing card (P2 #9) — ~20 min.
