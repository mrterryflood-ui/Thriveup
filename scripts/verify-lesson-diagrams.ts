/**
 * Verifies that every diagramKey referenced in lesson files exists in the
 * SVG_DIAGRAMS or SVG_FALLBACKS registry in svg-diagrams.tsx.
 *
 * Usage: npx tsx scripts/verify-lesson-diagrams.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");

// ── 1. Read the SVG registry file ────────────────────────────────────────────
const svgFile = fs.readFileSync(
  path.join(ROOT, "client/src/components/trade-sims/diagrams/svg-diagrams.tsx"),
  "utf-8"
);

// Extract all string keys from SVG_DIAGRAMS and SVG_FALLBACKS
const registryKeys = new Set<string>();
const keyRegex = /['"]([a-z][a-z0-9-]+)['"]\s*:/g;
let m: RegExpExecArray | null;
while ((m = keyRegex.exec(svgFile)) !== null) {
  registryKeys.add(m[1]);
}

// ── 2. Read all lesson files ──────────────────────────────────────────────────
const lessonFiles = [
  "shared/data/trade-sims/plumbing-lessons.ts",
  "shared/data/trade-sims/hvac-lessons.ts",
  "shared/data/trade-sims/electrical-lessons.ts",
  "shared/data/trade-sims/automotive-lessons.ts",
].filter((f) => fs.existsSync(path.join(ROOT, f)));

// ── 3. Extract all diagramKey values ─────────────────────────────────────────
const diagramKeyRegex = /diagramKey:\s*['"]([^'"]+)['"]/g;
const allDiagramKeys: Array<{ file: string; key: string }> = [];

for (const relPath of lessonFiles) {
  const content = fs.readFileSync(path.join(ROOT, relPath), "utf-8");
  let dm: RegExpExecArray | null;
  while ((dm = diagramKeyRegex.exec(content)) !== null) {
    allDiagramKeys.push({ file: relPath, key: dm[1] });
  }
}

// ── 4. Check each diagramKey against the registry ────────────────────────────
const missing: Array<{ file: string; key: string }> = [];
for (const { file, key } of allDiagramKeys) {
  if (!registryKeys.has(key)) {
    missing.push({ file, key });
  }
}

// ── 5. Report ─────────────────────────────────────────────────────────────────
if (missing.length > 0) {
  console.error("✗ Diagram sync FAILED — the following diagramKeys have no SVG entry:");
  for (const { file, key } of missing) {
    console.error(`  "${key}"  (in ${file})`);
  }
  process.exit(1);
}

const uniqueKeys = new Set(allDiagramKeys.map((d) => d.key));
console.log(
  `✓ Diagram sync verified: ${uniqueKeys.size} diagram keys across all trades`
);
process.exit(0);
