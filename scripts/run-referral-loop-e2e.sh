#!/usr/bin/env bash
# Validation gate: referral loop e2e (POST with auth → status token →
# GET status endpoint → PATCH outcome → resolvedAt confirmed).
#
# Starts the dev server if nothing is listening on :5000, then delegates to
# verify-referral-loop.ts. Serializes with other e2e gates on /tmp/e2e-gate.lock.
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
  echo "[referral-loop-e2e] dev server not running; starting npm run dev..."
  npm run dev >/tmp/referral-loop-e2e-server.log 2>&1 &
  STARTED_PID=$!
  for i in $(seq 1 60); do
    if server_up; then break; fi
    sleep 2
  done
  if ! server_up; then
    echo "[referral-loop-e2e] server failed to come up on $BASE (see /tmp/referral-loop-e2e-server.log)"
    exit 1
  fi
fi

BASE_URL="$BASE" npx tsx scripts/verify-referral-loop.ts
