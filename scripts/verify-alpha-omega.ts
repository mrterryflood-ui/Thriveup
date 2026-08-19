#!/usr/bin/env tsx
/**
 * Alpha Omega structural gate.
 *
 * This gate verifies that the protocol is installed in every enforcement
 * surface and that the current session has a discoverable record. It cannot
 * certify the quality of an agent's reasoning; the Omega record and behavioral
 * review remain required.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);
const checks: Array<[string, boolean, string]> = [];

function check(name: string, pass: boolean, detail: string) {
  checks.push([name, pass, detail]);
  console.log(`  ${pass ? "✓ PASS" : "✗ FAIL"} ${name}${pass ? "" : ` — ${detail}`}`);
}

function text(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const skillPath = ".agents/skills/alpha-omega/SKILL.md";
const sessionPath = `.agents/sessions/alpha-omega-${today}.md`;

check("Alpha Omega skill exists", existsSync(join(root, skillPath)), skillPath);
check("Constitution points to Alpha Omega", existsSync(join(root, "replit.md")) &&
  /alpha-omega/i.test(text("replit.md")), "add the protocol pointer to replit.md");
check("Platform DNA composes Alpha Omega", existsSync(join(root, ".agents/skills/platform-dna/SKILL.md")) &&
  /alpha-omega/i.test(text(".agents/skills/platform-dna/SKILL.md")), "add the protocol pointer to Platform DNA");
check("Fable composes Alpha Omega", existsSync(join(root, ".agents/skills/fable-standard/SKILL.md")) &&
  /alpha-omega/i.test(text(".agents/skills/fable-standard/SKILL.md")), "add the protocol pointer to Fable");
check("Preflight invokes the structural gate", /verify-alpha-omega\.ts/.test(text("scripts/preflight.ts")),
  "invoke scripts/verify-alpha-omega.ts from preflight");
check("Current session record exists", existsSync(join(root, sessionPath)), sessionPath);

if (existsSync(join(root, sessionPath))) {
  const record = text(sessionPath);
  for (const section of ["## Alpha", "## Omega"]) {
    check(`Session record contains ${section}`, record.includes(section), `add ${section}`);
  }
}

const failures = checks.filter(([, pass]) => !pass);
console.log(`\nALPHA OMEGA: ${checks.length - failures.length} PASS  ${failures.length} FAIL`);
if (failures.length) process.exit(1);