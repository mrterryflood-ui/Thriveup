#!/bin/bash
# Post-merge setup — runs after every task merge.
# IMPORTANT: stdin is /dev/null (no TTY). Never use interactive commands.
set -e

npm install --prefer-offline 2>/dev/null || npm install

# Apply any pending raw-SQL migrations (idempotent — IF NOT EXISTS guards).
# We do NOT use `drizzle-kit push` here because it requires a TTY when it
# detects existing rows and wants to confirm a truncate/rename. Instead,
# every schema change must be accompanied by a migration script in
# scripts/migrate-*.ts that uses db.execute(sql.raw(...)) with IF NOT EXISTS.
for f in scripts/migrate-*.ts; do
  [ -e "$f" ] || continue
  echo "[post-merge] Running migration: $f"
  npx tsx "$f"
done

echo "[post-merge] Setup complete."
