# Residuals Ledger (ADIS v4, Part 8)

Every deferred external-review finding lands here: severity, location, finding, logged-by, resolved-by.
A material build MUST ingest open residuals in its scope at Stage 0 (resolve or re-defer with reason).
A residual past its SLA (Urgent: next build touching the area; Soon: 7d; Monitor: one further cycle) is a vital-signs NO.

| # | Logged | Severity | Location | Finding | Logged by | Status / Resolved by |
|---|--------|----------|----------|---------|-----------|----------------------|
| 1 | 2026-08-10 | Monitor | server/rplice-tools.ts (multi-ai/community analysis) | RPLICE /api/grants remains locked (separate auth); grants scope intentionally excluded per user directive — do not integrate | main-agent | OPEN (standing exclusion, not a defect) |
| 2 | 2026-08-10 | Soon | ai-tools-workspace.tsx | Active AI generation is not aborted on component unmount (architect suggestion, minor) | wave2-review | OPEN |
