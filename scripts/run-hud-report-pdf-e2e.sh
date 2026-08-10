#!/usr/bin/env bash
# Validation gate: HUD biannual report PDF flow (tests/e2e/hud-report-pdf.spec.ts).
# Staff generates a draft on /yhsi-ops → HUD Reports, downloads the PDF, and the
# spec verifies filename (DRAFT/FINAL), valid PDF bytes, and small-cell
# suppression rendering. Requires DATABASE_URL + SESSION_SECRET like other e2e gates.
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
    # npm run dev spawns children; kill the process group too
    pkill -P "$STARTED_PID" 2>/dev/null
    wait "$STARTED_PID" 2>/dev/null
  fi
}
trap cleanup EXIT

if ! server_up; then
  echo "[hud-pdf-e2e] dev server not running; starting npm run dev..."
  npm run dev >/tmp/hud-pdf-e2e-server.log 2>&1 &
  STARTED_PID=$!
  for i in $(seq 1 60); do
    if server_up; then break; fi
    sleep 2
  done
  if ! server_up; then
    echo "[hud-pdf-e2e] server failed to come up on $BASE (see /tmp/hud-pdf-e2e-server.log)"
    exit 1
  fi
fi

npx playwright test \
  --output test-results/hud-pdf-e2e \
  tests/e2e/hud-report-pdf.spec.ts
exit $?
