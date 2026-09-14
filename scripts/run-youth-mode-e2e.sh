#!/usr/bin/env bash
# Validation gate: Youth Mode chat e2e suites.
# Runs tests/e2e/youth-mode-persistence.spec.ts and
# tests/e2e/youth-mode-thread-resume.spec.ts against the dev server,
# starting one itself if nothing is listening on :5000.
set -u

# E2E gates share :5000 and Playwright artifact dirs, so all e2e gate
# scripts serialize on /tmp/e2e-gate.lock (see run-auth-e2e.sh).
if [ "${E2E_GATE_LOCKED:-}" != "1" ]; then
  exec env E2E_GATE_LOCKED=1 flock /tmp/e2e-gate.lock bash "$0" "$@"
fi

BASE="${E2E_BASE_URL:-http://localhost:5000}"
STARTED_PID=""

server_up() {
  curl --fail --silent --show-error -o /dev/null --max-time 3 "$BASE/"
}

cleanup() {
  if [ -n "$STARTED_PID" ]; then
    # setsid makes the npm/vite/tsx tree its own process group. Killing only
    # npm's direct children leaves descendants on :5000 and poisons the next
    # serialized gate.
    kill -- -"$STARTED_PID" 2>/dev/null || true
    for _ in $(seq 1 20); do
      if ! kill -0 -- -"$STARTED_PID" 2>/dev/null; then break; fi
      sleep 0.25
    done
    if kill -0 -- -"$STARTED_PID" 2>/dev/null; then
      kill -KILL -- -"$STARTED_PID" 2>/dev/null || true
    fi
    wait "$STARTED_PID" 2>/dev/null
  fi
  STARTED_PID=""
}
trap cleanup EXIT

if ! server_up; then
  started=0
  for attempt in 1 2 3; do
    echo "[youth-mode-e2e] dev server not running; starting npm run dev (attempt $attempt)..."
    setsid npm run dev >/tmp/youth-mode-e2e-server.log 2>&1 &
    STARTED_PID=$!
    for i in $(seq 1 60); do
      if server_up; then
        started=1
        break
      fi
      if ! kill -0 "$STARTED_PID" 2>/dev/null; then
        echo "[youth-mode-e2e] dev server exited during startup (attempt $attempt)"
        break
      fi
      sleep 2
    done
    if [ "$started" = "1" ]; then break; fi
    cleanup
    sleep 1
  done
  if [ "$started" != "1" ]; then
    echo "[youth-mode-e2e] server failed to come up on $BASE (see /tmp/youth-mode-e2e-server.log)"
    exit 1
  fi
fi

npx playwright test \
  --output test-results/youth-mode-e2e \
  tests/e2e/youth-mode-persistence.spec.ts \
  tests/e2e/youth-mode-thread-resume.spec.ts
exit $?
