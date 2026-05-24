#!/usr/bin/env tsx
/**
 * Memory health validator. Run before any external work.
 *
 *   npx tsx scripts/memory-health.ts
 *
 * Exits 0 on green, 1 on any failure. Each check prints PASS/FAIL on its own line.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [];

const ROOT = process.cwd();
const MEM_DIR = join(ROOT, "docs", "agent-memory");

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lineCount(path: string): number {
  if (!existsSync(path)) return -1;
  return readFileSync(path, "utf8").split("\n").length;
}

// --- Check 1: replit.md is rules-only (≤ 60 lines) ---
{
  const lines = lineCount(join(ROOT, "replit.md"));
  checks.push({
    name: "replit.md ≤ 60 lines (rules + pointers only)",
    pass: lines > 0 && lines <= 60,
    detail: lines < 0 ? "file missing" : `${lines} lines`,
  });
}

// --- Check 2: CURRENT.md exists and ≤ 200 lines ---
{
  const lines = lineCount(join(MEM_DIR, "CURRENT.md"));
  checks.push({
    name: "CURRENT.md exists and ≤ 200 lines",
    pass: lines > 0 && lines <= 200,
    detail: lines < 0 ? "file missing" : `${lines} lines`,
  });
}

// --- Check 3: INDEX.md exists ---
{
  const indexPath = join(MEM_DIR, "INDEX.md");
  checks.push({
    name: "INDEX.md exists",
    pass: existsSync(indexPath),
    detail: existsSync(indexPath) ? "present" : "missing",
  });
}

// --- Check 4: today's session file exists with non-trivial content ---
{
  const sessionPath = join(MEM_DIR, "sessions", `${today()}.md`);
  const exists = existsSync(sessionPath);
  const lines = exists ? lineCount(sessionPath) : 0;
  checks.push({
    name: `today's session log exists (sessions/${today()}.md)`,
    pass: exists && lines >= 5,
    detail: !exists ? "missing — create at session end" : `${lines} lines`,
  });
}

// --- Check 5: INDEX.md internal links resolve ---
{
  const indexPath = join(MEM_DIR, "INDEX.md");
  if (!existsSync(indexPath)) {
    checks.push({ name: "INDEX.md links valid", pass: false, detail: "INDEX.md missing" });
  } else {
    const txt = readFileSync(indexPath, "utf8");
    // Match backtick-quoted paths that look like file paths (e.g. `docs/agent-memory/topics/grants.md`)
    const pathPattern = /`([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`/g;
    const broken: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = pathPattern.exec(txt)) !== null) {
      const candidate = m[1];
      // Skip glob-ish patterns and YYYY placeholders
      if (candidate.includes("YYYY") || candidate.includes("*")) continue;
      // Skip if it doesn't look like a real repo path
      if (!candidate.startsWith("docs/") && !candidate.startsWith("scripts/") && !candidate.startsWith("client/") && !candidate.startsWith("server/") && !candidate.startsWith("shared/") && !candidate.startsWith("attached_assets/") && candidate !== "replit.md") continue;
      const full = resolve(ROOT, candidate);
      if (!existsSync(full)) broken.push(candidate);
    }
    checks.push({
      name: "INDEX.md cited file paths exist",
      pass: broken.length === 0,
      detail: broken.length === 0 ? "all resolve" : `broken: ${broken.join(", ")}`,
    });
  }
}

// --- Check 6: topic files exist ---
{
  const expected = ["grants", "partners", "gotchas", "architecture", "ecosystem"];
  const missing = expected.filter((t) => !existsSync(join(MEM_DIR, "topics", `${t}.md`)));
  checks.push({
    name: "topic files present (grants/partners/gotchas/architecture/ecosystem)",
    pass: missing.length === 0,
    detail: missing.length === 0 ? "all present" : `missing: ${missing.join(", ")}`,
  });
}

// --- Check 7: unresolved-gotchas visibility (informational, always PASS but prints count) ---
{
  const gotchasPath = join(MEM_DIR, "topics", "gotchas.md");
  if (existsSync(gotchasPath)) {
    const txt = readFileSync(gotchasPath, "utf8");
    // Count h3 ("### ") entries as gotchas
    const count = (txt.match(/^### /gm) || []).length;
    checks.push({
      name: `live gotchas in topics/gotchas.md`,
      pass: true,
      detail: `${count} active`,
    });
  }
}

// --- Check 8: sessions/ has at least one recent log (last 14 days) ---
{
  const sessionsDir = join(MEM_DIR, "sessions");
  if (existsSync(sessionsDir)) {
    const files = readdirSync(sessionsDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const recent = files.filter((f) => new Date(f.slice(0, 10)) >= cutoff);
    checks.push({
      name: "≥1 session log in last 14 days",
      pass: recent.length > 0,
      detail: `${recent.length} recent of ${files.length} total`,
    });
  } else {
    checks.push({ name: "sessions/ directory exists", pass: false, detail: "missing" });
  }
}

// --- Report ---
console.log("\n=== Memory Health Check ===\n");
let failed = 0;
for (const c of checks) {
  const tag = c.pass ? "PASS" : "FAIL";
  const color = c.pass ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}${tag}\x1b[0m  ${c.name}  —  ${c.detail}`);
  if (!c.pass) failed++;
}
console.log(`\n${failed === 0 ? "✓ All checks passed" : `✗ ${failed} check(s) failed`}\n`);
process.exit(failed === 0 ? 0 : 1);
