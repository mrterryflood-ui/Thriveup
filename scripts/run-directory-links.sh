#!/usr/bin/env bash
# Validation gate: directory links, capacity badges, sidebar routes, external
# links, intake validation, CHW dashboard, tool reachability, two-click
# reachability, how-to-apply walkthroughs, rate-limit probes, health federation,
# and navigation permission sync.
#
# Several scripts in this chain (verify-apply-chat-ratelimit.ts,
# verify-health-federation.ts, verify-navigation-permission-sync.ts) probe
# http://localhost:5000 directly.  This wrapper starts the dev server if none
# is already listening on :5000, serializing on /tmp/e2e-gate.lock so it does
# not race other E2E gates that also manage that port.
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
  echo "[directory-links] dev server not running; starting npm run dev..."
  npm run dev >/tmp/directory-links-server.log 2>&1 &
  STARTED_PID=$!
  for i in $(seq 1 60); do
    if server_up; then break; fi
    sleep 2
  done
  if ! server_up; then
    echo "[directory-links] server failed to come up on $BASE (see /tmp/directory-links-server.log)"
    exit 1
  fi
fi

# Scripts that do NOT need the server — run them first (no BASE_URL needed).
npx tsx scripts/verify-directory-links.ts || exit 1
npx tsx scripts/verify-capacity-badges.ts || exit 1
npx tsx scripts/verify-sidebar-routes.ts || exit 1
npx tsx scripts/verify-external-links.ts || exit 1
npx tsx scripts/verify-intake-contact-validation.ts || exit 1
npx tsx scripts/verify-chw-dashboard-no-555.ts || exit 1
npx tsx scripts/verify-tool-reachability.ts || exit 1
npx tsx scripts/verify-two-click-reachability.ts || exit 1
npx tsx scripts/verify-how-to-apply.ts || exit 1

# Scripts that probe http://localhost:5000 — forward BASE_URL.
BASE_URL="$BASE" npx tsx scripts/verify-apply-chat-ratelimit.ts || exit 1
BASE_URL="$BASE" npx tsx scripts/verify-health-federation.ts || exit 1
npx tsx scripts/verify-navigation-permission-sync.ts || exit 1
