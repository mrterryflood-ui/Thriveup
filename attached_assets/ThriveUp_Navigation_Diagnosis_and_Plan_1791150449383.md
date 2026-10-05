# ThriveUp Navigation — Diagnosis & Plan (Measure Twice, Cut Once)

**Prepared for:** Terry Flood · ThriveUp
**Date:** 2026-10-04 · Updated after your three answers
**Status:** Investigation complete · Taxonomy recommended and grounded · Set order defined · No code changed yet

---

## 0. The one decision already settled: source of truth

Your answer: **"they should be pushing and updating"** (both Replit and the repo should stay in sync).

Reading of that: **Git is the single trunk.** The repo (`mrterryflood-ui/Thriveup`) is canonical; Replit syncs to it via its Git integration (the `.replit` config already targets `npm run build` → `dist/index.cjs`), and Vercel deploys from it via `vercel.json`. Nothing gets changed on one side without landing on the other. Before I touch code I will confirm the Replit↔GitHub link is live so the homepage you built on Replit isn't orphaned from the trunk.

---

## 1. What I actually found

Scale: **359 page files, ~260 routes, ~200 sidebar items across 13 "hubs"** plus a 5-tab bottom bar and a 9-pathway homepage. Three navigation systems that don't agree with each other.

Root causes (six):

1. **Two divergent information architectures**, neither person-aligned (13 topic buckets vs 5 tabs vs 9 pathways).
2. **No shared "picture" framing** on interior pages — the homepage story stops at the homepage. Every other page is a bare title + content.
3. **Categories mix two different things** — audience ("Foster Youth", "Justice & Reentry", "Veterans") and task ("Get Funded", "Benefits & Intake"). This is the core defect, and it's exactly what the behavioral research below says *not* to do.
4. **Connections are told, not shown** — the magnet/ecosystem/"how it all connects" is homepage copy, not an interactive system.
5. **No progressive disclosure** — ~200 items shown with no simple-surface → drill-down on-ramp.
6. **Photorealism/terminal only on the homepage.** The GIS assets (heatmaps, correlation matrix, skyline/domain map, particle flow) already exist — unwired.

An honest caveat: the repo is the Vercel/migration codebase; the live homepage you updated is on Replit. "Automations/integrations aren't there" needs its own server-route audit — that's a separate investigation, not a one-pane fix.

---

## 2. What people actually respond to (the behavior & data science)

Grounded in published evidence, not my preference:

- **People navigate by task, not by topic, format, or department.** [NN/g](https://www.nngroup.com/articles/format-based-navigation/) — format/department-based top navigation *lacks "information scent"* and fails for task-driven users; the [NN/g intranet IA research](https://www.nngroup.com/articles/intranet-information-architecture-ia/) found findability improves when content is organized **by task rather than department**. Your current 13 buckets are department-style, not task-style.
- **A handful of top tasks carries the load; the long tail must be de-focused.** [Gerry McGovern's Top Tasks](https://gerrymcgovern.com/books/top-tasks-a-how-to-guide/read-the-first-chapter/) — identify the few things people actually came to do and push everything else to the side. Showing 200 items equally is the opposite of this.
- **Choice time and cognitive load rise with the number of options.** [Hick's Law and Miller's Law](https://uiuxatlas.com/lessons/foundations/laws-of-ux/) — group, prioritize, and **progressively disclose** instead of exposing everything at once.
- **Start from user needs, not the org chart.** [GOV.UK Design Principles](https://www.gov.uk/guidance/government-design-principles) — "service design starts with identifying user needs." This is the standard for exactly the kind of community/public platform ThriveUp is.

**The one design rule these all point to:** separate *"what do you need"* (task/outcome) from *"who you are"* (audience). Mixing them — which is precisely what the current sidebar does — forces a person to answer two questions at once in a flat list, and that's why it feels like a closet.

---

## 3. The recommended model

### Two orthogonal axes

**Axis A — Outcome (top-level, 6).** Your words, completed:

1. **Get Help** — community resources, benefits, food/housing/health/crisis/child care (the front door for any person)
2. **Learn** — education, courses, financial literacy
3. **Work & Earn** — workforce development, trade sims, apprenticeships, certificates, careers
4. **Connect** — the magnet: find the organizations doing the work, bring them together, refer, meet needs
5. **Fund** — grants, funding, proposals
6. **See the Data** — community data & storytelling, GIS, evidence, impact, transparency

### Axis B — Audience (set once at the door, kept as context)

Resident/Family · Students & youth · Foster youth · Veterans · Returning citizens (reentry) · Caregivers/CHWs · Nonprofit/CBO · Agency/government · Funder/evaluator · Rural/farm

Every one of the ~260 routes gets tagged in exactly one registry with: **outcome + audience + what it connects to (upstream need / downstream action) + a guide link.** The sidebar, tabs, homepage, search palette, and the GIS map all read from that one registry, so they can never disagree again.

The "Bloomberg terminal + GIS" isn't a separate page — it's the **frame that renders on every page**: a top rail (*You are here → outcome → connects to → next step*) and the magnet map showing organizations ↔ people ↔ resources in one interactive spatial view.

---

## 4. The set order (your "both, in a set order")

1. **Lock the trunk** — confirm Replit↔GitHub sync; Git is canonical.
2. **The registry + 6-outcome taxonomy** — pure structure, lowest visual risk, and the thing everything else reads from.
3. **Re-map navigation** — collapse 13 buckets → 6 outcomes + an audience switcher. All ~260 URLs keep working. This is the fastest relief from "overwhelming."
4. **The shared command shell + magnet GIS map** — the Bloomberg top rail + spatial magnet, rendered app-wide, reading from the registry.
5. **Photorealism and terminal depth** on category landings and key tools (reusing the heatmap/correlation/skyline components that already exist).
6. **Guides + automations + integration wiring** — a separate, evidence-first audit of what's real vs stubbed before anything is promised.

---

## 5. What I need from you to proceed

Only one true decision remains, and I've recommended an answer:

- **Approve the 6-outcome taxonomy + audience axis** (Section 3), or adjust it. This is the "cut" that everything else hangs from.

Once you approve (or revise) the taxonomy, I'll execute phases 1–4 in order, reporting each as *Before → Changed → Why → Proof → Limits* per your standard.
