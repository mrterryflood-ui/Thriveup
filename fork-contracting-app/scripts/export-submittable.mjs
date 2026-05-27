#!/usr/bin/env node
// Proposal Studio v2 — Phase 3 Submittable form-mapping export (added 2026-05-27)
//
// Reads a concept-note / proposal markdown file with section markers and emits
// a JSON file mapping each section to a Submittable field name. The agent
// (human) then copy-pastes from the JSON into the Submittable form, or feeds
// it into a Submittable API automation.
//
// Markdown section markers (top-level h2 headings):
//   ## Working title           → field "title"
//   ## Lead Applicant          → field "lead_applicant"
//   ## Team                    → field "team_summary"
//   ## The intervention        → field "intervention_summary"
//   ## Why this clears Gate    → field "evidence_summary"
//   ## What is novel           → field "novelty_summary"
//   ## Clinically relevant     → field "endpoints"
//   ## What we are asking      → field "ask_summary"
//
// Sections not in the map are emitted under field "appendices.<slug>".
//
// Usage:
//   node scripts/export-submittable.mjs <input.md> [output.json]
//
// Fork-ready: zero deps.

import { readFileSync, writeFileSync } from "fs";
import { resolve, basename } from "path";

const FIELD_MAP = [
  { pattern: /^working title/i, field: "title" },
  { pattern: /^lead applicant/i, field: "lead_applicant" },
  { pattern: /^team/i, field: "team_summary" },
  { pattern: /^the intervention/i, field: "intervention_summary" },
  { pattern: /^why this clears/i, field: "evidence_summary" },
  { pattern: /^what is novel/i, field: "novelty_summary" },
  { pattern: /^clinically relevant/i, field: "endpoints" },
  { pattern: /^what we are asking/i, field: "ask_summary" },
  { pattern: /^why .* is well[- ]positioned/i, field: "applicant_capacity" },
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function mapHeading(headingText) {
  for (const m of FIELD_MAP) {
    if (m.pattern.test(headingText)) return m.field;
  }
  return `appendices.${slugify(headingText)}`;
}

function main() {
  const inPath = process.argv[2];
  if (!inPath) {
    console.error("Usage: node scripts/export-submittable.mjs <input.md> [output.json]");
    process.exit(2);
  }
  const outPath = process.argv[3] ?? inPath.replace(/\.md$/i, "") + ".submittable.json";

  const md = readFileSync(resolve(inPath), "utf8");
  const lines = md.split(/\n/);

  const sections = {};
  let currentHeading = null;
  let currentField = null;
  let buffer = [];

  function flush() {
    if (currentField && buffer.length > 0) {
      const body = buffer.join("\n").trim();
      if (body) sections[currentField] = body;
    }
    buffer = [];
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      flush();
      currentHeading = h2[1];
      currentField = mapHeading(currentHeading);
      continue;
    }
    if (currentField !== null) buffer.push(line);
  }
  flush();

  const out = {
    sourceFile: basename(inPath),
    exportedAt: new Date().toISOString(),
    fieldMap: Object.fromEntries(FIELD_MAP.map((m) => [m.field, m.pattern.toString()])),
    fields: sections,
  };
  writeFileSync(resolve(outPath), JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${Object.keys(sections).length} fields → ${outPath}`);
}

main();
