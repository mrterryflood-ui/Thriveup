/// Modal scheduled jobs — restores the background work ThriveUp lost when it
/// moved off the always-on Replit server onto Vercel serverless.
///
/// Deploy locally (tokens live in ~/.modal.toml after `modal token new`):
///     pip install modal
///     modal deploy modal/jobs.py
///
/// What it does: on a schedule, calls public endpoints on
/// https://thriveup.vercel.app. No secrets are baked in. A warming ping keeps
/// the serverless function awake between user visits; the diagnostic probe
/// records liveness evidence with a timestamp instead of writing synthetic
/// data — missing data stays missing, it is never instantiated as success.
///
/// Honest limits:
///   - A ping is reachability evidence only. It does not prove ingest
///     correctness, seed behavior, or schema state.
///   - Write-path exercises (county-metrics push) stay with ChildCORE's
///     scheduled Convex actions, which carry their own AAP decision record.

import modal

app = modal.App("thriveup-jobs")

BASE = "https://thriveup.vercel.app"


@app.function(schedule=modal.Period(hours=6))
def keepalive() -> None:
    """Cold-start guard — Vercel functions sleep; this keeps the boot path warm."""
    import urllib.request
    with urllib.request.urlopen(f"{BASE}/health", timeout=30) as r:
        status = r.status
        body = r.read(200)
    print(f"keepalive: /health -> {status} {body[:80]}")


@app.function(schedule=modal.Cron("0 7 * * *"))
def daily_integrity_probe() -> None:
    """Daily 07:00 UTC: verify the auth contract is still fail-closed.

    Posts with no credentials; the only accepted outcome is HTTP 401.
    Anything else is a loud waterline breach, not a soft error.
    """
    import urllib.request
    import urllib.error
    req = urllib.request.Request(
        f"{BASE}/api/childcore/county-metrics/ingest",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"INTEGRITY BREACH: no-auth ingest returned {r.status} — expected 401")
    except urllib.error.HTTPError as e:
        verdict = "OK" if e.code == 401 else f"UNEXPECTED {e.code}"
        print(f"integrity probe: unauthenticated ingest -> {e.code} [{verdict}]")
