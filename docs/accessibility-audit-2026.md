# Accessibility Audit — ThriveUp Academy Platform

**Date:** 2026-08-08
**Scope:** WP-4D (Phase 4 platform remediation)
**Auditor:** Automated + manual code review (subagent)

---

## ⚠️ Honesty statement

This is a **code-level accessibility audit**, not a certified WCAG 2.1/2.2 conformance
assessment. It was performed by reading source code (JSX/TSX) and running pattern
searches — **not** by measuring rendered pixels, running a screen reader, or executing
a certified automated engine (axe-core/Lighthouse) against the live DOM.

Consequences of this methodology:

- **Color contrast could not be verified.** True contrast ratios depend on rendered
  foreground/background colors (including CSS variables, dark mode, opacity, gradients,
  and inline styles). Anything flagged below is a *red flag for follow-up*, not a
  confirmed failure.
- **Focus order and screen-reader announcement** were reasoned about from markup, not
  observed live.
- No `axe-core` dependency was added — the existing code already had strong a11y
  hygiene, so a manual review was sufficient and avoided adding a devDependency for
  marginal benefit.

A certified assessment (axe-core in CI + manual NVDA/VoiceOver testing + a contrast
tool over the rendered app in both light and dark themes) is recommended before making
any WCAG conformance claim.

---

## Methodology

1. **Global infrastructure review** — `client/index.html`, `client/src/App.tsx`,
   `client/src/index.css` for `lang` attribute, skip-to-content link, and global
   `:focus-visible` styles.
2. **Top-10 public/user pages** reviewed line-by-line and with pattern searches:
   - Landing (`pages/landing.tsx`)
   - Quiz (`pages/quiz.tsx`)
   - Lesson viewer (`pages/lesson-viewer.tsx`)
   - Trade-sims index (`pages/academy/trade-sims/index.tsx`)
   - Trade-sims lesson player (`pages/academy/trade-sims/lesson-player.tsx`)
   - Foster-youth intake (`pages/foster-youth/intake.tsx`)
   - Youth rights (`pages/youth-rights.tsx`)
   - AI Navigator (`components/ai-navigator.tsx`)
   - Dashboard (`pages/dashboard.tsx`)
   - YHSI ops (`pages/yhsi-ops.tsx`)
3. **Checks per page:** missing `alt` text; missing form labels / `aria-label` on
   icon-only buttons; focus states; keyboard traps in dialogs/menus; heading
   hierarchy; hard-coded low-contrast text classes; `lang` attribute; skip link.
4. **Verification:** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
   after edits — TypeScript error count held at the baseline of **85** (all
   pre-existing, server-side; none in any file touched by this audit).

---

## What was already in good shape (no change needed)

- `lang="en"` is present on `<html>` (`client/index.html`).
- Skip-to-content link exists and is wired to `#main-content`
  (`App.tsx` ~L969; `.skip-link` styles in `index.css` ~L441).
- Global keyboard focus indicator: `*:focus-visible { outline: 2px solid hsl(var(--ring)); }`
  (`index.css` ~L454).
- No `<img>` without `alt` on any of the 10 audited pages.
- No genuinely icon-only `<Button>`/`<button>` lacking an accessible name on the
  audited pages (the two `size="icon"` buttons in the AI Navigator already carry
  `aria-label`).
- Radix UI primitives (Select/Dialog/DropdownMenu) provide built-in focus trapping
  and Escape handling; no custom `fixed inset-0` modal overlays were found on the
  audited pages → **no keyboard traps identified.**
- The AI Navigator already uses `role="log"`, `aria-live="polite"`, and `aria-label`
  extensively — a strong reference implementation.

---

## Findings — FIXED

| # | Page / file | Issue | Fix | Location |
|---|-------------|-------|-----|----------|
| 1 | `components/ai-navigator.tsx` | Compact-panel message `Textarea` had only a placeholder (not a reliable accessible name) | Added `aria-label="Message to the Navigator assistant"` | ~L1665 |
| 2 | `components/ai-navigator.tsx` | Full-page message `Textarea` had only a placeholder | Added `aria-label="Message to the Navigator assistant"` | ~L1188 |
| 3 | `pages/academy/trade-sims/lesson-player.tsx` | Solo-reflection `Textarea` labeled only by a visually-adjacent `<h3>` (no programmatic association) | Added `aria-label="Your reflection"` | ~L789 |
| 4 | `pages/academy/trade-sims/lesson-player.tsx` | Sandbox-journal `Textarea` (same pattern) | Added `aria-label="Your sandbox journal"` | ~L865 |
| 5 | `pages/academy/trade-sims/lesson-player.tsx` | Debrief-note `Textarea` (same pattern) | Added `aria-label="Your notes"` | ~L911 |
| 6 | `pages/youth-rights.tsx` | Eligibility-checker `SelectTrigger` (age) — `<Label>` lacked `htmlFor`, trigger had no accessible name | Added `aria-label="Your age"` | ~L229 |
| 7 | `pages/youth-rights.tsx` | Checker `SelectTrigger` (foster care) | Added `aria-label="Foster care status"` | ~L241 |
| 8 | `pages/youth-rights.tsx` | Checker `SelectTrigger` (housing) | Added `aria-label="Housing right now"` | ~L253 |
| 9 | `pages/youth-rights.tsx` | Checker `SelectTrigger` (with parent) | Added `aria-label="Living with a parent or guardian"` | ~L263 |
| 10 | `pages/youth-rights.tsx` | Checker `SelectTrigger` (care after 14) | Added `aria-label="In foster care after turning 14"` | ~L274 |
| 11 | `pages/yhsi-ops.tsx` | Youth-voice impact-note `Textarea` had only a placeholder, no label | Added `aria-label="Impact note"` | ~L437 |

All 11 fixes are additive `aria-label` attributes — zero behavioral/visual change,
no new TypeScript errors.

---

## Findings — DEFERRED (with reasons)

| # | Page / file | Issue | Why deferred |
|---|-------------|-------|--------------|
| A | Component library (`components/ui/card.tsx`) | `CardTitle` renders a plain `<div>`, not a heading element. Pages that use `CardTitle` for section headers (quiz, dashboard, yhsi-ops) therefore expose **no programmatic heading structure**. | Systemic. `CardTitle` is used across hundreds of pages; changing it to a heading (or adding `role`/`aria-level`) would ripple platform-wide and could break heading order globally. Needs a design decision + full-platform regression, out of scope for clear-cut WP-4D fixes. |
| B | `pages/quiz.tsx`, `pages/dashboard.tsx` | No `<h1>`; document heading hierarchy starts at `<h2>` (page title is styled text or a `CardTitle`). | Related to (A). Adding an `<h1>` per page is safe but touches many pages and needs consistent placement; batch it with the `CardTitle` remediation. |
| C | `pages/academy/trade-sims/lesson-player.tsx`, `pages/foster-youth/intake.tsx` | Heading levels skip (h1 → h3, no h2). | Semantic-only; low user impact. Best fixed alongside the broader heading pass (A/B) to keep levels consistent. |
| D | `pages/yhsi-ops.tsx` (~44 controls) and similar staff forms | `<Label>` elements lack `htmlFor` and their `<Input>`/`<Select>` lack `id`, so labels are only *visually* associated (not programmatically). | Systemic form pattern used pervasively. Correct fix is `id`/`htmlFor` pairing (or `aria-labelledby`) on every field — a large, mechanical but high-volume change that should be its own scoped work package with test coverage. Note: many controls still expose a `placeholder`, so they are not completely nameless, but placeholder is not a substitute for a label. (The one field here with *no* label at all was fixed — see FIXED #11.) YHSI ops is also a staff-authenticated page, not a public/user page. |
| E | `pages/landing.tsx` and others | Frequent `text-[10px]` micro-copy and one `text-muted-foreground/30` (dashboard ~L390). | Contrast/size cannot be confirmed by code inspection (see honesty statement). The platform already ships a user-facing accessibility panel with text-size controls, which mitigates small text. Flag for a rendered-DOM contrast audit rather than a blind class edit. |

---

## Verification

- Command: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- Result: **85 errors** (unchanged from baseline). All are pre-existing server-side
  errors (`server/rplice-tools.ts`, drizzle typings, etc.). **None** of the files
  edited in this audit (`ai-navigator.tsx`, `lesson-player.tsx`, `youth-rights.tsx`,
  `yhsi-ops.tsx`) report any TypeScript error.

## Recommended next steps (not done here)

1. Add `axe-core`/`@axe-core/playwright` to CI and run it against the live routes.
2. Remediate `CardTitle` → semantic headings (deferred A/B/C) as one scoped WP.
3. Add `id`/`htmlFor` pairing across staff forms (deferred D) as one scoped WP.
4. Run a rendered-DOM contrast audit in both light and dark themes (deferred E).
5. Manual screen-reader pass (NVDA + VoiceOver) on the top user flows.
