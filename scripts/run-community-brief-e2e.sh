#!/usr/bin/env bash
# Validation gate: community-brief anonymous e2e suite.
#
# Runs all community-brief verification scripts and the Playwright historical-
# receipt suite against the dev server, starting one itself if nothing is
# listening on :5000.
#
# E2E gates share :5000 and Playwright artifact dirs, so all e2e gate
# scripts serialize on /tmp/e2e-gate.lock (see run-auth-e2e.sh).
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

# Run the community-brief typescript verification scripts first.
# BASE_URL is forwarded so they target the server we may have just started.
BASE_URL="$BASE" npx tsx scripts/verify-community-brief-e2e.ts || exit 1
npx tsx scripts/verify-community-brief-probe-logic.ts || exit 1
npx tsx scripts/verify-community-evidence-guards.ts || exit 1
npx tsx scripts/verify-ai-claim-grounding.ts || exit 1
npx tsx scripts/verify-claim-chain-integrity.ts || exit 1
npx tsx scripts/verify-navigator-gv-grounding.ts || exit 1

# run-community-brief-playwright.sh also acquires the lock and handles its own
# server-start; pass E2E_GATE_LOCKED=1 and E2E_BASE_URL so it reuses the
# already-started server without trying to spin up a second one.
E2E_BASE_URL="$BASE" E2E_GATE_LOCKED=1 bash scripts/run-community-brief-playwright.sh
