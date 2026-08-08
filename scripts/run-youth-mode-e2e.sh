#!/usr/bin/env bash
# Validation gate: Youth Mode chat e2e suites.
# Runs tests/e2e/youth-mode-persistence.spec.ts and
# tests/e2e/youth-mode-thread-resume.spec.ts against the dev server,
# starting one itself if nothing is listening on :5000.
set -u

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
  echo "[youth-mode-e2e] dev server not running; starting npm run dev..."
  npm run dev >/tmp/youth-mode-e2e-server.log 2>&1 &
  STARTED_PID=$!
  for i in $(seq 1 60); do
    if server_up; then break; fi
    sleep 2
  done
  if ! server_up; then
    echo "[youth-mode-e2e] server failed to come up on $BASE (see /tmp/youth-mode-e2e-server.log)"
    exit 1
  fi
fi

npx playwright test \
  tests/e2e/youth-mode-persistence.spec.ts \
  tests/e2e/youth-mode-thread-resume.spec.ts
exit $?
