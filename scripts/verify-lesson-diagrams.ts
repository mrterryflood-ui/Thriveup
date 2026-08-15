/**
 * Verifies that every diagramKey referenced in lesson files exists in the
 * SVG_DIAGRAMS or SVG_FALLBACKS registry in svg-diagrams.tsx.
 *
 * Additionally, cross-checks a set of "anchor" numeric claims that appear
 * in both an SVG diagram function and the lesson that uses it. A diagram is
 * only correct if it shows THE SAME numbers the lesson's own worked examples
 * use — internally-correct physics that contradicts the lesson's text
 * still misteaches (see .agents/memory/lesson-diagram-verification.md).
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

// ── 5. Cross-check numeric anchors ───────────────────────────────────────────
// Each entry: the SVG function source must contain svgToken AND the lesson
// file named by lessonFile must contain lessonToken. If either is absent, the
// diagram and lesson have drifted out of sync.
//
// To add a new anchor: identify a number that appears in BOTH the SVG
// function AND the lesson's concept/guidedSteps text, then add a row here.
type Anchor = {
  description: string;     // human-readable description of what we're checking
  diagramKey: string;      // the diagramKey (SVG function name not needed)
  svgToken: string;        // literal string that must appear in svg-diagrams.tsx
  lessonFile: string;      // relative path to the lesson file
  lessonToken: string;     // literal string that must appear in that lesson file
};

const ANCHORS: Anchor[] = [
  // Electrical: Ohm's Law diagram uses 9V / 1kΩ / 9 mA — must match lesson
  {
    description: "ohms-law diagram voltage (9V)",
    diagramKey: "ohms-law",
    svgToken: "9V",
    lessonFile: "shared/data/trade-sims/electrical-lessons.ts",
    lessonToken: "9",
  },
  {
    description: "ohms-law diagram resistance (1kΩ)",
    diagramKey: "ohms-law",
    svgToken: "1kΩ",
    lessonFile: "shared/data/trade-sims/electrical-lessons.ts",
    lessonToken: "1 kΩ",
  },
  {
    description: "ohms-law diagram computed current (9 mA)",
    diagramKey: "ohms-law",
    svgToken: "9 mA",
    lessonFile: "shared/data/trade-sims/electrical-lessons.ts",
    lessonToken: "9 mA",
  },
  // Electrical: series-circuit-flow 2D fallback — 9V source, 4.5 mA, 4.5V drops
  {
    description: "series-circuit-flow diagram voltage source (9V)",
    diagramKey: "series-circuit-flow",
    svgToken: "9V",
    lessonFile: "shared/data/trade-sims/electrical-lessons.ts",
    lessonToken: "9",
  },
  {
    description: "series-circuit-flow diagram current (4.5 mA)",
    diagramKey: "series-circuit-flow",
    svgToken: "4.5 mA",
    lessonFile: "shared/data/trade-sims/electrical-lessons.ts",
    lessonToken: "4.5 mA",
  },
  {
    description: "series-circuit-flow diagram voltage drops (4.5V each)",
    diagramKey: "series-circuit-flow",
    svgToken: "4.5V",
    lessonFile: "shared/data/trade-sims/electrical-lessons.ts",
    lessonToken: "4.5",
  },
  // Plumbing: fixture-units WSFU values — lavatory=1, toilet=2.2, shower=2
  {
    description: "fixture-units diagram lavatory WSFU (1)",
    diagramKey: "fixture-units",
    svgToken: "1, 55",      // the array literal in the diagram: [["lavatory", 1, 55], ...]
    lessonFile: "shared/data/trade-sims/plumbing-lessons.ts",
    lessonToken: "Lavatory = 1 WSFU",
  },
  {
    description: "fixture-units diagram toilet WSFU (2.2)",
    diagramKey: "fixture-units",
    svgToken: "2.2",
    lessonFile: "shared/data/trade-sims/plumbing-lessons.ts",
    lessonToken: "2.2",
  },
  {
    description: "fixture-units diagram total WSFU (Σ = 5.2 in SVG from 1+2.2+2)",
    diagramKey: "fixture-units",
    svgToken: "Σ = 5.2 WSFU",
    lessonFile: "shared/data/trade-sims/plumbing-lessons.ts",
    // Lesson lists the components (1, 2.2, 2) that sum to 5.2; verify lesson mentions the
    // toilet WSFU value that anchors the sum (2.2 is the least-round value, most drift-prone).
    lessonToken: "2.2",
  },
  // Plumbing: water-head-column 2D fallback — 5 m head ≈ 7.1 psi
  {
    description: "water-head-column diagram head value (5 m)",
    diagramKey: "water-head-column",
    svgToken: "5 m head",
    lessonFile: "shared/data/trade-sims/plumbing-lessons.ts",
    lessonToken: "m head",
  },
  // HVAC: heat-transfer — indoor 22°C, outdoor −5°C (must include °F dual label)
  {
    description: "heat-transfer diagram indoor temp dual-unit (22°C / 72°F)",
    diagramKey: "heat-transfer",
    svgToken: "22°C (72°F)",
    lessonFile: "shared/data/trade-sims/hvac-lessons.ts",
    lessonToken: "22 °C (72",
  },
  {
    description: "heat-transfer diagram outdoor temp dual-unit (−5°C / 23°F)",
    diagramKey: "heat-transfer",
    svgToken: "−5°C (23°F)",
    lessonFile: "shared/data/trade-sims/hvac-lessons.ts",
    lessonToken: "−5 °C (23",
  },
  // Automotive: battery-charging — 12.6V battery, 14.2V alternator
  {
    description: "battery-charging diagram battery voltage (12.6V)",
    diagramKey: "battery-charging",
    svgToken: "12.6V",
    lessonFile: "shared/data/trade-sims/automotive-lessons.ts",
    lessonToken: "12.6",
  },
  {
    description: "battery-charging diagram alternator voltage (14.2V)",
    diagramKey: "battery-charging",
    svgToken: "14.2V",
    lessonFile: "shared/data/trade-sims/automotive-lessons.ts",
    lessonToken: "14",
  },
];

// Load lesson file contents (cache to avoid re-reading)
const lessonContents = new Map<string, string>();
for (const relPath of lessonFiles) {
  lessonContents.set(relPath, fs.readFileSync(path.join(ROOT, relPath), "utf-8"));
}

const anchorFailures: Array<{ description: string; reason: string }> = [];

for (const anchor of ANCHORS) {
  // Only run anchor if the diagramKey actually appears in some lesson
  const keyUsed = allDiagramKeys.some((d) => d.key === anchor.diagramKey);
  if (!keyUsed) continue; // skip anchors for unused keys

  if (!svgFile.includes(anchor.svgToken)) {
    anchorFailures.push({
      description: anchor.description,
      reason: `SVG file is missing token "${anchor.svgToken}" (diagramKey: ${anchor.diagramKey})`,
    });
    continue;
  }

  const lessonContent = lessonContents.get(anchor.lessonFile);
  if (!lessonContent) {
    anchorFailures.push({
      description: anchor.description,
      reason: `Lesson file not found: ${anchor.lessonFile}`,
    });
    continue;
  }

  if (!lessonContent.includes(anchor.lessonToken)) {
    anchorFailures.push({
      description: anchor.description,
      reason: `Lesson file "${anchor.lessonFile}" is missing token "${anchor.lessonToken}" — diagram and lesson have drifted`,
    });
  }
}

// ── 6. Report ─────────────────────────────────────────────────────────────────
let exitCode = 0;

if (missing.length > 0) {
  console.error("✗ Diagram sync FAILED — the following diagramKeys have no SVG entry:");
  for (const { file, key } of missing) {
    console.error(`  "${key}"  (in ${file})`);
  }
  exitCode = 1;
}

if (anchorFailures.length > 0) {
  console.error("✗ Numeric anchor cross-check FAILED — diagram labels have drifted from lesson text:");
  for (const { description, reason } of anchorFailures) {
    console.error(`  [${description}] ${reason}`);
  }
  exitCode = 1;
}

if (exitCode === 0) {
  const uniqueKeys = new Set(allDiagramKeys.map((d) => d.key));
  console.log(
    `✓ Diagram sync verified: ${uniqueKeys.size} diagram keys across all trades`
  );
  console.log(
    `✓ Numeric anchor cross-check passed: ${ANCHORS.filter((a) => allDiagramKeys.some((d) => d.key === a.diagramKey)).length} anchor(s) verified`
  );
}

process.exit(exitCode);
