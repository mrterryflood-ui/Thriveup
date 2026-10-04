# Post-Change Audit Gate

**Mandatory final check for every major code change.** Drop this file in any repository. It implements Section 9 of the Magnet System Doctrine and is binding for all agents and humans building on this codebase.

## When the gate runs

- **Trigger:** every pull request or major code change, immediately before merge to main or production deploy.
- **Mandatory:** a change that skips the gate does not ship.
- **Scoped, not retroactive:** audit only the code that was touched and the outputs/sections it changes. Prior code is grandfathered until someone touches it. Do NOT re-verify the whole codebase on every change.
- **Ask, don't overstep:** when a check is out of scope, needs credentials or human judgment, or would exceed this change's authority, ask the owner instead of acting. When scope is ambiguous, ask which sections count as "affected."
- **A gate that cannot run is a reported gap** — never silently skipped. Missing credentials, unverifiable integrations, and untestable paths are named in the findings.

## How findings are reported

Findings are presented **ordered by impact**. For each issue:

1. **What's wrong** — the specific defect, with file/line or live-probe evidence.
2. **Why it matters** — the user, system, or compliance consequence.
3. **Proposed fix** — what the agent would do about it.

The owner decides what gets fixed. The agent applies changes only on approval. Every applied change is reported as **Before / Changed / Why / Proof / Limits**.

## The checklist

Run the checks that apply to the touched code. Skip (and name) the ones that don't.

### Product & User Experience
- [ ] **Product** — the change genuinely advances solving the user's problem, not just adding a feature.
- [ ] **Design** — visual polish and design consistency with the rest of the app.
- [ ] **Mobile & Tablet** — the experience works on phones and tablets.
- [ ] **Performance** — the change doesn't degrade user-facing speed; obvious speedups applied.
- [ ] **Documentation** — user-facing docs and help content updated where behavior changed.

### Engineering & Scale
- [ ] **Code Quality** — the touched code is maintainable, typed, and lint-clean.
- [ ] **Accessibility** — everyone can use what changed (contrast, labels, keyboard/screen-reader paths).
- [ ] **Scalability & Reliability** — behavior under sudden usage surges is considered; no new single points of failure.
- [ ] **Error Handling** — new errors are captured and handled gracefully; no silent failures; missing data never renders as zero or reassurance (fail-closed).
- [ ] **Database** — schema changes are sound; queries the change adds are indexed and correct.
- [ ] **Test Coverage & QA** — critical paths touched by the change have tests; **every new test file is wired into the gate script** (an unwired test is an orphan — a defect). Untested critical paths are named as gaps.
- [ ] **Integrations** — third-party integrations the change touches are verified against live receipts (real responses, not descriptions of them); API/model versions are current, not retired.
- [ ] **Cloud & Infrastructure Cost** — the change doesn't inflate cloud spend (functions, deploy pipelines, AI API lanes, GPU); backend performance reviewed.

### Security & Access
- [ ] **Security** — the touched code has no injection, exposure, or secret-leak vectors; secrets never appear in code, logs, or chat.
- [ ] **Identity & Access** — auth and permissions are enforced on the touched paths; consent/privacy middleware the change should use is actually wired (existence in the repo is not enforcement).
- [ ] **Dependency & Supply Chain** — no outdated, vulnerable, or risky dependencies added.

### Marketing & Revenue
- [ ] **SEO** — discoverability and shareability not regressed by the change.
- [ ] **Landing Page Optimization** — the main call to action still drives correctly.
- [ ] **Copy & Content** — copy touched by the change is clear and compelling.
- [ ] **Branding** — cohesion and consistency maintained.
- [ ] **Internationalization** — i18n/localization coverage preserved where applicable.
- [ ] **Billing & Tax** — billing/tax logic touched by the change is correct where applicable.

### Legal & Compliance
- [ ] **Legal** — terms, licenses, and required legal pages still accurate.
- [ ] **Privacy** — data collection, storage, and disclosure paths touched by the change are compliant; consent scopes are enforced, not just defined.

## Zero-gap addendum (from the doctrine)

Two checks that apply to every change, from the Magnet System's Law 1:

- [ ] **Orphan check** — nothing the change added is connected to nothing: no unwired module, unreferenced file, dead route, or test outside the gate.
- [ ] **Chain check** — if the change adds data, it declares its evidence state (observed / modeled / stale / unavailable / failed) and flows Source → Entity → Story → Person → Receipt → Outcome → Better Prediction, or names where the chain stops.
