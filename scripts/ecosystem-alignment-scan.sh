#!/usr/bin/env bash
# ecosystem-alignment-scan.sh — probe every registered platform's public surface
# (custom domain first, .replit.app fallback) and report LIVE vs UNBOUND.
# Usage: scripts/ecosystem-alignment-scan.sh
set +e
[ -z "$DATABASE_URL" ] && { echo "DATABASE_URL not set" >&2; exit 1; }
psql "$DATABASE_URL" -t -A -F'|' -c "SELECT id, name, url FROM ecosystem_platforms ORDER BY id;" > /tmp/_platforms.psv
declare -A FALLBACK=(
  ["speech-bridge"]="https://talkyourtalk.net"
  ["ad-targeting"]="https://ad-targeting.replit.app"
  ["mce"]="https://black-business-hub.replit.app"
  ["pinnacle-business-conglomerate"]="https://pinnacle-business-conglomerate.replit.app"
  ["emergency-mgmt"]="https://emergency-mgmt.replit.app"
)
probe() {
  local id="$1" name="$2" url="$3"
  local fb="${FALLBACK[$id]}" working_url="$url" status="UNBOUND" code title desc
  code=$(curl -sL --max-time 8 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$code" != "200" ] && [ -n "$fb" ]; then
    code=$(curl -sL --max-time 8 -o /dev/null -w "%{http_code}" "$fb" 2>/dev/null)
    [ "$code" = "200" ] && working_url="$fb"
  fi
  if [ "$code" = "200" ]; then
    status="LIVE"
    local html; html=$(curl -sL --max-time 8 "$working_url")
    title=$(echo "$html" | grep -oiE '<title[^>]*>[^<]+' | head -1 | sed 's/<title[^>]*>//I' | head -c 80)
    local mf; mf=$(curl -sL --max-time 6 "$working_url/manifest.json" 2>/dev/null)
    if echo "$mf" | head -c 1 | grep -q '{'; then
      desc=$(echo "$mf" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('description',''))" 2>/dev/null | head -c 200)
    fi
    [ -z "$desc" ] && desc=$(echo "$html" | grep -oiE 'name="description"[^>]*content="[^"]*' | head -1 | sed 's/.*content="//' | head -c 200)
  fi
  printf "%-32s | %-7s | %s\n" "$id" "$status" "${title:-—}"
  [ -n "$desc" ] && printf "  └─ %s\n" "$(echo "$desc" | head -c 180)"
  [ "$working_url" != "$url" ] && printf "  └─ via: %s (custom domain unbound)\n" "$working_url"
}
echo "ECOSYSTEM ALIGNMENT SCAN — $(date -u +%Y-%m-%dT%H:%MZ)"
printf "%-32s | %-7s | %s\n" "platform-id" "status" "title"
echo "--------------------------------------------------------------------------------"
while IFS='|' read -r id name url; do
  [ -z "$id" ] && continue
  probe "$id" "$name" "$url"
done < /tmp/_platforms.psv
