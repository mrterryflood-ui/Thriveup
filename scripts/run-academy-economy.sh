#!/usr/bin/env bash
# Validation gate: academy economy forgery checks.
# Runs scripts/verify-academy-economy.ts against the dev server,
# starting one itself if nothing is listening on :5000.
#
# This verifier forges a session and mutates academy_* rows, so it must not
# run while other gates restart the server or clean the sessions table.
# All such gates serialize on /tmp/e2e-gate.lock (see run-auth-e2e.sh).
set -u

if [ "${E2E_GATE_LOCKED:-}" != "1" ]; then
  exec env E2E_GATE_LOCKED=1 flock /tmp/e2e-gate.lock bash "$0" "$@"
fi

BASE="${BASE_URL:-http://localhost:5000}"
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
  echo "[academy-economy] dev server not running; starting npm run dev..."
  npm run dev >/tmp/academy-economy-server.log 2>&1 &
  STARTED_PID=$!
  for i in $(seq 1 60); do
    if server_up; then break; fi
    sleep 2
  done
  if ! server_up; then
    echo "[academy-economy] server failed to come up on $BASE (see /tmp/academy-economy-server.log)"
    exit 1
  fi
fi

npx tsx scripts/verify-academy-economy.ts
exit $?
