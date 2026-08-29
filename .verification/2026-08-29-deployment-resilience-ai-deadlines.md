# Verification Record — Deployment Resilience and AI Request Deadlines

**Scope:** Harden startup migrations, database timeout boundaries, AI provider
fallbacks, alert observability, and ecosystem health monitoring without changing
production schema or production data.

## Changes verified

- Startup migration connections, advisory-lock polling, cleanup, and timeout
  parsing are bounded; the lock and query windows accommodate valid long
  migrations.
- Startup fails early with an actionable message when no baseline application
  schema exists. Compatibility preflight rejects incomplete event-workspace
  shapes, incompatible handoff types, and orphaned or cross-organization links
  before composite foreign keys are installed.
- Composite-key repair checks actual PostgreSQL index metadata, and attendance
  tenant-key installation is safe to replay.
- Shared positive DB timeout defaults cover the equity-loss route, reference,
  peer-class, and nationwide scheduler pools.
- Direct, JSON, streaming, and collaborative AI provider calls receive bounded
  provider/request budgets; empty output is a failed attempt, caller
  cancellation reaches direct/streaming provider controllers, streaming commits
  after a bounded buffer so first-token delivery is preserved, and provider
  cleanup runs on both success and failure.
- AI smoke alerts expose delivery success/failure, send down/recovery alerts
  only on state transitions, and treat zero configured providers as
  configuration state rather than an outage.
- Pinger state/log persistence failures are surfaced as degraded results, and a
  delayed full health cycle covers an initial cycle that races platform sync.

## Development evidence

| Check | Result |
|---|---|
| Strict TypeScript | Passed with zero errors using the configured 8 GB heap |
| Integrated-flow foundation | Passed |
| AI fallback regression | Passed: 3 tests |
| Community Events focused verifier | Passed all tenant, privacy, authorization, handoff, suppression, archival, and concurrency assertions |
| Diff whitespace | Passed |
| Application restart | Passed; development server served port 5000 |
| Startup migration behavior | Existing development startup completed and applied the committed session-store compatibility migration earlier in this resilience pass |
| Production isolation | No production schema or data changes made |
| Independent final audit | Prior blocker findings were addressed; remaining bounded gaps are recorded below and proposed as follow-up work |

## Limits and residuals

- Development does not enable the production-only AI smoke-test cycle, so live
  `[SmokeTest]` alert delivery and recovery transitions were not exercised.
- The development log did not capture a `[Pinger]` cycle marker during the
  observed window. The pinger now starts independently of ecosystem sync and
  schedules a delayed full pass, but live outbound partner health proof remains
  environment-dependent.
- Collaborative requests still lack one end-to-end budget spanning retrieval,
  live context loading, synthesis, and response replay, and public collaborative
  callers do not yet pass a disconnect signal through the full lifecycle.
- Scheduled smoke-probe timeout races do not yet abort every underlying provider
  SDK call; the configured SDK timeouts still bound those calls, but explicit
  probe-level signal propagation remains follow-up work.
- Existing nonprofit-event authorization/revocation and story-consent
  stale-write races remain outside this resilience scope; the archive race proof
  does not claim those broader invariants.
- Applying committed schema migrations to production still requires the user's
  manual Publish/schema-forward process.