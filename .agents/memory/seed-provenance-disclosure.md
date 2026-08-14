---
name: Seed data provenance disclosure
description: How illustrative/example seed rows (predating AI claim-grounding) are labeled as non-verified, and the enforcement gate that catches new unlabeled rows.
---

Legacy hardcoded/seeded factual or numeric claims predate the platform's AI claim-grounding system, which only grounds newly-generated AI narrative text — it does not touch literal values baked into seed files at build time. Those literal seed rows needed their own, separate disclosure mechanism, extending the codebase's existing informal "illustrative demo data" convention rather than inventing a new one.

**Core rule: never assume, always enumerate.** When backfilling or auditing provenance on a table that also accepts real user-facing inserts, never use a heuristic like "any row missing a source is demo" or "any row matching this id pattern is demo" — a real future row can accidentally match the same shape. Enumerate the exact known seed-row ids explicitly, both in the backfill migration and in the audit script. The audit itself should check "do these specific known seed ids still carry their disclosure flag" (a regression test), not "does every row in the table carry one" — a table with legitimate real inserts will have plenty of non-demo rows, and flagging every `is_demo_data = false` row as a violation is backwards: `false` is a valid, fully-disclosed answer, not a missing one.

**Why:** presenting fabricated example numbers (survey percentages, staff rosters, session logs, synthetic participant outcomes) without disclosure lets them look like verified administrative or research data to a viewer — the exact failure mode the platform's anti-fabrication rules exist to prevent. But an over-broad "fix" that mislabels real data as demo (or silently classifies future real rows as demo based on an id/shape heuristic) breaks trust in the opposite direction.

**Gotchas found while doing this:**
- Check both the INSERT and UPDATE code paths when auditing whether a "sourced" field is populated — a real ingestion route can set it on update but forget it on insert, making genuinely-sourced data indistinguishable from unlabeled fabricated data.
- Don't reuse an existing free-text field for double duty as both real content and a provenance flag (e.g. an "event source" column with legitimate values like `employer_report`/`court_records`) — a synthetic demo row can carry a totally plausible value there and pass a naive "is this field non-empty" check. Use a dedicated boolean flag instead.
- A migration that only adds a column with a default doesn't fix anything by itself — pre-existing rows keep the default until an explicit, precisely-scoped backfill runs, and that backfill belongs in the migration file itself (not an ad hoc one-off command) so it applies uniformly to every environment.

**Known gap (follow-up filed):** AI narrative endpoints that read from demo-flagged tables were not audited for whether their prompts disclose to the model (and thus the output) that the underlying numbers are illustrative — a real risk of laundering demo data into an apparently-grounded AI claim.
