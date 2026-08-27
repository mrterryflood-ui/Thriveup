# Residuals Ledger (ADIS v4, Part 8)

Every deferred external-review finding lands here: severity, location, finding, logged-by, resolved-by.
A material build MUST ingest open residuals in its scope at Stage 0 (resolve or re-defer with reason).
A residual past its SLA (Urgent: next build touching the area; Soon: 7d; Monitor: one further cycle) is a vital-signs NO.

| # | Logged | Severity | Location | Finding | Logged by | Status / Resolved by |
|---|--------|----------|----------|---------|-----------|----------------------|
| 1 | 2026-08-10 | Monitor | server/rplice-tools.ts (multi-ai/community analysis) | RPLICE /api/grants remains locked (separate auth); grants scope intentionally excluded per user directive — do not integrate | main-agent | OPEN (standing exclusion, not a defect) |
| 2 | 2026-08-10 | Soon | ai-tools-workspace.tsx | Active AI generation is not aborted on component unmount (architect suggestion, minor) | wave2-review | OPEN |
| 3 | 2026-08-27 | Monitor | Replit development preview proxy | Browser automation and direct development-domain requests returned an empty HTTP 502 after three retries, although the workflow was running, `0.0.0.0:5000` returned HTTP 200 locally, and 5000→5000 is configured. This blocked proxy-mediated UI interaction proof only; direct preview capture rendered the report. | Task 333 verification | OPEN — recheck platform forwarding before the next browser-dependent development verification; no production claim made. |
