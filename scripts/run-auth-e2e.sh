#!/usr/bin/env bash
# Validation gate: sign-in, staff-access, and foster-youth journey e2e suites.
# Runs tests/e2e/smoke.spec.ts, tests/e2e/staff-role-access.spec.ts and
# tests/e2e/foster-youth-journey.spec.ts against the dev server,
# starting one itself if nothing is listening on :5000.
#
# E2E gates share :5000 and Playwright artifact dirs, so all e2e gate
# scripts serialize on /tmp/e2e-gate.lock (see run-youth-mode-e2e.sh).
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
    # npm run dev spawns children; kill the process group too
    pkill -P "$STARTED_PID" 2>/dev/null
    wait "$STARTED_PID" 2>/dev/null
  fi
}
trap cleanup EXIT

if ! server_up; then
  echo "[auth-e2e] dev server not running; starting npm run dev..."
  npm run dev >/tmp/auth-e2e-server.log 2>&1 &
  STARTED_PID=$!
  for i in $(seq 1 60); do
    if server_up; then break; fi
    sleep 2
  done
  if ! server_up; then
    echo "[auth-e2e] server failed to come up on $BASE (see /tmp/auth-e2e-server.log)"
    exit 1
  fi
fi

npx playwright test \
  --output test-results/auth-e2e \
  tests/e2e/smoke.spec.ts \
  tests/e2e/staff-role-access.spec.ts \
  tests/e2e/foster-youth-journey.spec.ts
exit $?
