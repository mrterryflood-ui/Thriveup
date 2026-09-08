---
name: DIS Alignment Rubric
version: "1.0.0"
date: "2026-09-07"
authority: "Dr. Terry D. Flood, TCAF / ISS LLC"
enforcement: COMPILED
auditScript: scripts/audit-dis-alignment.ts
---

# Diagnostic Implementation Science (DIS) Alignment Rubric

Every page and feature on the platform must pass all Seven Conditions before it
is considered aligned. This rubric is the machine-readable standard that
`scripts/audit-dis-alignment.ts` uses for automated checking.

---

## Condition 1 — Every data display is source-cited and decision-connected

**What it requires:**
- Every metric, count, percentage, score, rate, or indicator displayed to any
  user carries: dataset name, vintage date, evidence class, and a plain-language
  "what this means for the next decision" caption.
- Evidence class must be one of: `verified` | `estimated` | `modeled` |
  `community-reported` | `unverified`.
- A number displayed without a source is a data silo. A number displayed with a
  source but without a decision caption is half-aligned.

**Automated check:**
- Pages that render `<EvidenceLabel claim={...}>` on every data value pass.
- Pages that render raw numbers without `<EvidenceLabel>` or `<DecisionSupport>`
  are flagged as Condition-1 gaps.

**Shared component:** `client/src/components/evidence-label.tsx`
**Extended component:** `client/src/components/decision-support.tsx`

---

## Condition 2 — Every input surface discloses purpose, sharing, and withdrawal

**What it requires:**
- Every form, screener, questionnaire, AI prompt, journal, voice submission,
  org profile, or partner onboarding flow that collects personal, health,
  financial, demographic, narrative, or organizational data displays — before
  the first field — what is being collected, why, who will see it, which fields
  are required, and how to withdraw or correct.
- Disclosure is a visible, specific `<ConsentDisclosure>` component at the top
  of the form. A link to the privacy policy does not satisfy this condition.

**Automated check:**
- Forms that render `<ConsentDisclosure>` before their first `<input>`,
  `<textarea>`, or `<select>` pass.
- Forms that collect data without a `<ConsentDisclosure>` are Condition-2 gaps.

**Shared component:** `client/src/components/consent-disclosure.tsx`

---

## Condition 3 — Every AI surface makes its limitations visible and defers the decision to a human

**What it requires:**
- Every Navigator response, community brief synthesis, grant narrative, pathway
  recommendation, risk score, and AI-assisted analysis names: what evidence it
  drew from, what it does not know, what the user should do to verify, and who
  makes the final decision.
- This is not a legal disclaimer banner. It is a specific, contextual disclosure
  that names the actual sources and gaps for this response.

**Automated check:**
- AI surfaces that render `<AIAugmentationDisclosure>` pass.
- AI surfaces without it are Condition-3 gaps.

**Shared component:** `client/src/components/ai-augmentation-disclosure.tsx`

---

## Condition 4 — Missing data is displayed as missing, not as zero or silence

**What it requires:**
- When a data source has no record for a geography, population, or time period,
  the page says so plainly, says what it means (absence of data ≠ absence of
  problem), and offers next steps (who might have the info, what can proceed
  without it, Perplexity live search option).
- A page that renders `null`, `0`, `—`, or nothing when data is unavailable
  is a Condition-4 gap.

**Automated check:**
- Data surfaces that render `<UncertaintyDisplay>` for null/missing states pass.
- Surfaces that render empty or zero without explanation are flagged.

**Shared component:** `client/src/components/uncertainty-display.tsx`

---

## Condition 5 — Every cross-product link names what it does and does not transfer

**What it requires:**
- Every link from one product or domain to another states: why the connection is
  relevant, what happens when the user clicks it, the relationship status of the
  linked resource to TCAF (verified partner / aspirational / external / active),
  and who owns the next action.

**Automated check:**
- Links with `data-relationship` and `data-link-purpose` attributes pass.
- External links without relationship attribution are Condition-5 gaps.

**Manual check required:** Relationship status labels must be contextually
accurate — automation can only verify that the attribute is present.

---

## Condition 6 — Any core action is reachable in two meaningful clicks from any starting point

**What it requires:**
- A "meaningful click" advances the user toward their goal — not a menu
  opening, tab changing, or modal loading.
- Any user at any page can reach their primary action (find a program, submit a
  referral, access a benefit, start a pathway, explore a community brief) in
  two deliberate, purposeful interactions.

**Automated check:**
- `scripts/audit-dis-alignment.ts` runs a BFS from each registered entry point
  and verifies that all domain primary actions are reachable.
- Unreachable actions are Condition-6 gaps.

---

## Condition 7 — Core actions work on mobile at 375px

**What it requires:**
- Every form, pathway, referral, brief, screener, and dashboard that a CHW,
  community member, or student would use in a field setting works at 375px
  width with touch targets ≥ 44px × 44px.

**Automated check:**
- Touch-targets validation gate (`verify-touch-targets.ts`) covers this.
- Any new interactive surface must be added to the touch-target registry.

---

## Evidence classes — reference

| Class | Meaning | Display color |
|---|---|---|
| `verified` | Directly observed, primary source, current | Green |
| `estimated` | Survey-based or modeled with confidence interval | Amber |
| `modeled` | Statistically derived, not directly measured | Orange |
| `community-reported` | ITI-consented community submission | Purple |
| `unverified` | Source cited but not independently confirmed | Gray |

---

## Source registry

All data sources used by the platform must be registered in the `data_sources`
table. A Claim that references an unregistered source fails server-side
validation at the `claimValidationMiddleware` layer.

See: `server/data-sources-routes.ts`, `GET /api/data-sources`

---

## Uncertainty types — reference

| Type | Meaning |
|---|---|
| `missing-data` | Source has no record for this geography/time/population |
| `conflicting-sources` | Two credible sources disagree |
| `contested-interpretation` | The evidence is clear but its meaning is disputed |
| `data-collection-failure` | A known pipeline error prevented collection |

---

## Remediation protocol

When a page fails a condition:
1. Add the relevant shared component where it is missing.
2. Register any unregistered data source in `data_sources` via the seed script
   or admin UI.
3. Re-run `scripts/audit-dis-alignment.ts` and confirm the gap is closed.
4. Write a Learning Deposit entry if the gap revealed something non-obvious.

---

## MAP-GAP cycle cadence

- **#DATA domain:** Monthly audit
- **Rural Workforce, HBCU Opportunity Network:** Quarterly audit
- **All other domains:** Quarterly audit
- **Full-platform pass:** Annual (each fiscal year)

Each cycle produces: updated gap report, Learning Deposit entries, and updates
to this rubric when new condition types are identified.
