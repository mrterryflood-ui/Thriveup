#!/usr/bin/env bash
# Validation gate: community-impact historical-receipt disclosure e2e suite
# (tests/e2e/community-impact-historical.spec.ts), run as the final step of
# the community-brief-e2e workflow.
#
# E2E gates share :5000 and Playwright artifact dirs, so all e2e gate
# scripts serialize on /tmp/e2e-gate.lock (see run-auth-e2e.sh). This script
# was previously invoked as a bare `npx playwright test` directly in the
# workflow definition with no lock and no --output dir, so it could run
# concurrently with other Playwright e2e gates and clobber their shared
# default test-results/ output (Playwright wipes its output dir on start),
# producing spurious ENOENT trace errors and flaky timeouts in unrelated
# gates (e.g. hud-pdf-e2e). Always invoke through this script instead.
set -u

if [ "${E2E_GATE_LOCKED:-}" != "1" ]; then
  exec env E2E_GATE_LOCKED=1 flock /tmp/e2e-gate.lock bash "$0" "$@"
fi

BASE="${E2E_BASE_URL:-http://localhost:5000}"
STARTED_PID=""

server_up() {
  curl -s -o /dev/null --max-time 3 "$BASE/"
}

cleanup() {
  if [ -n "$STARTED_PID" ]; then
    kill "$STARTED_PID" 2>/dev/null
    pkill -P "$STARTED_PID" 2>/dev/null
    wait "$STARTED_PID" 2>/dev/null
  fi
}
trap cleanup EXIT

if ! server_up; then
  echo "[community-brief-e2e] dev server not running; starting npm run dev..."
  npm run dev >/tmp/community-brief-e2e-server.log 2>&1 &
  STARTED_PID=$!
  for i in $(seq 1 60); do
    if server_up; then break; fi
    sleep 2
  done
  if ! server_up; then
    echo "[community-brief-e2e] server failed to come up on $BASE (see /tmp/community-brief-e2e-server.log)"
    exit 1
  fi
fi

npx playwright test \
  --output test-results/community-brief-e2e \
  tests/e2e/community-impact-historical.spec.ts
exit $?
