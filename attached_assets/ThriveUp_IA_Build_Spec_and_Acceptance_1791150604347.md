# ThriveUp IA — Build Spec & Acceptance Criteria

**Roles:** Executor/build = Replit builder (yours) · Architect + independent reviewer = me
**Rule:** the builder implements; I review the built output as a black box against the criteria below. I do not touch the build and I do not accept self-report as proof. No one checks their own homework.

---

## 1. Non-destructive constraints (non-negotiable)

1. **Preserve every page and route.** All 359 pages and ~260 URLs keep working. No deletions. No broken links.
2. **Additive only.** Old paths become alias redirects to a canonical path. Existing functionality is untouched.
3. **One trunk.** Git (`mrterryflood-ui/Thriveup`) is canonical; Replit and Vercel both push to and update from it. Confirm Replit↔GitHub sync is live *before* layering the registry — do not orphan the homepage already built on Replit.

---

## 2. Target information architecture

**Axis A — Outcome (top-level, 6):**
Get Help · Learn · Work & Earn · Connect (the magnet) · Fund · See the Data

**Axis B — Audience (set once at the door):**
Resident/Family · Students & youth · Foster youth · Veterans · Returning citizens (reentry) · Caregivers/CHWs · Nonprofit/CBO · Agency/government · Funder/evaluator · Rural/farm

Rule: *outcome* and *audience* are orthogonal and never mixed into one flat list.

---

## 3. The registry (single source of truth)

One data structure that every surface reads from — sidebar, bottom tabs, homepage, search palette, GIS map, and the per-page frame. When they all read one registry, they can never disagree again.

Per route, record:
- `path` — canonical route
- `outcome` — exactly one of the 6
- `audiences` — one or more of the 10
- `title` — plain-language, in the user's words
- `description` — one line that gives "information scent"
- `upstream` — the need/question this answers
- `downstream` — the next actions/connected routes
- `guide` — help/instruction link
- `access` — public / auth / staff / admin

---

## 4. The shared frame (renders on every page)

- **Top rail:** *You are here → Outcome → (audience) → connects to → next step.*
- **Magnet GIS map:** organizations ↔ people ↔ resources, one interactive spatial/nodal view.
- **Progressive disclosure:** simple surface by default, detail on drill-down.

This — not a standalone page — is the "Bloomberg terminal + GIS" that follows the user off the homepage.

---

## 5. Navigation re-map

- Sidebar: 6 outcomes (collapsible) + an audience switcher.
- Admin/internal/staff surfaces move behind an "Operator" door so the public experience stays simple.
- Bottom tabs relabeled to outcomes (or kept, but reconciled to the 6).
- Homepage pathways stay (already task-first) — only reconcile their labels to the 6 outcomes.

---

## 6. Photorealism & terminal depth

Extend the homepage's visual language and the hub's terminal feel to outcome landings and key tools. Reuse the GIS/visualization components that already exist: heatmap, correlation matrix, skyline/domain map, particle flow, system pulse.

---

## 7. Acceptance criteria (what I will independently verify)

Each phase is "done" only against these evidence gates — not the builder's statement:

1. **Trunk locked** — a commit from Replit appears in the GitHub repo (proof: `git log` shows the sync, on both).
2. **Registry complete** — tagged-route count equals total route count; zero untagged routes.
3. **Navigation re-mapped** — every ~260 URL is reachable from the 6-outcome nav + search; zero 404s (proof: crawl + spot click-through).
4. **Frame present everywhere** — top rail renders on sampled pages and is correct per page (proof: automated + manual spot-check).
5. **Non-destructive** — diff shows no deleted page files; only additive/alias changes.
6. **Photorealism on landings** — visual evidence (screenshots).

---

## 8. Review protocol (independence)

- Black-box review of the shipped build against the criteria in §7.
- Every finding reported as **Before → Changed → Why → Proof → Limits.**
- Uncertain wiring (automations/integrations/source-truth) is flagged as open, never converted into a completion claim. Wiring is a separate evidence-first audit, not part of presentation.
