#!/usr/bin/env npx tsx
/**
 * DIS Alignment Audit Script — scripts/audit-dis-alignment.ts
 *
 * Automated gap detector for the Seven-Condition DIS Alignment Standard.
 * See docs/dis-alignment-rubric.md for full specification.
 *
 * Run: npx tsx scripts/audit-dis-alignment.ts
 * Exit 0 = all foundation files present; Exit 1 = foundation gaps found
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(process.cwd());
const PAGES_DIR = join(ROOT, "client/src/pages");
const COMPONENTS_DIR = join(ROOT, "client/src/components");
const SERVER_DIR = join(ROOT, "server");
const DOCS_DIR = join(ROOT, "docs");
const RUBRIC_VERSION = "1.0.0";

// ANSI colors
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function pass(msg: string) { console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function fail(msg: string) { console.log(`  ${RED}✗${RESET} ${msg}`); }
function warn(msg: string) { console.log(`  ${YELLOW}⚠${RESET} ${msg}`); }
function info(msg: string) { console.log(`  ${BLUE}→${RESET} ${msg}`); }
function header(msg: string) { console.log(`\n${BOLD}${msg}${RESET}`); }

function fileExists(rel: string): boolean {
  return existsSync(join(ROOT, rel));
}

function grepCount(dir: string, pattern: string): number {
  try {
    const out = execSync(`grep -rl "${pattern}" "${dir}" 2>/dev/null || true`).toString();
    return out.trim().split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

function grepFiles(dir: string, pattern: string): string[] {
  try {
    const out = execSync(`grep -rl "${pattern}" "${dir}" 2>/dev/null || true`).toString();
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function countPages(): number {
  try {
    return readdirSync(PAGES_DIR).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts")).length;
  } catch { return 0; }
}

// ─── Main audit ───────────────────────────────────────────────────────────
async function runAudit() {
  console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD} DIS Alignment Audit — Rubric v${RUBRIC_VERSION}${RESET}`);
  console.log(`${BOLD} ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);

  let foundationPass = 0;
  let foundationFail = 0;

  // ── Section 1: Foundation files ────────────────────────────────────────
  header("Section 1 — Foundation files (must all exist)");

  const foundationChecks: [string, string][] = [
    ["docs/dis-alignment-rubric.md", "DIS Alignment Rubric"],
    ["client/src/components/evidence-label.tsx", "EvidenceLabel (Condition 1)"],
    ["client/src/components/consent-disclosure.tsx", "ConsentDisclosure (Condition 2)"],
    ["client/src/components/ai-augmentation-disclosure.tsx", "AIAugmentationDisclosure (Condition 3)"],
    ["client/src/components/uncertainty-display.tsx", "UncertaintyDisplay (Condition 4)"],
    ["client/src/components/decision-support.tsx", "DecisionSupport (Condition 1+)"],
    ["server/shared/claim-types.ts", "Claim<T> shared type"],
    ["server/place-story-engine.ts", "PlaceStoryEngine"],
    ["server/consent-enforcement-middleware.ts", "Consent enforcement middleware"],
    ["server/live-data-search-routes.ts", "Live data search (Perplexity fallback)"],
    ["server/data-sources-routes.ts", "Data sources registry API"],
    ["server/seed-data-sources.ts", "Data source seed (20 canonical sources)"],
  ];

  for (const [path, label] of foundationChecks) {
    if (fileExists(path)) {
      pass(`${label}`);
      foundationPass++;
    } else {
      fail(`MISSING: ${label} (${path})`);
      foundationFail++;
    }
  }

  // ── Section 2: Condition 1 — Data display coverage ────────────────────
  header("Section 2 — Condition 1 (Evidence labels on data displays)");

  const totalPages = countPages();
  const pagesWithEvidenceLabel = grepCount(PAGES_DIR, "EvidenceLabel");
  const pagesWithDecisionSupport = grepCount(PAGES_DIR, "DecisionSupport");
  const pagesCondition1 = new Set([
    ...grepFiles(PAGES_DIR, "EvidenceLabel"),
    ...grepFiles(PAGES_DIR, "DecisionSupport"),
  ]).size;

  info(`Total page components: ${totalPages}`);
  info(`Pages using EvidenceLabel: ${pagesWithEvidenceLabel}`);
  info(`Pages using DecisionSupport: ${pagesWithDecisionSupport}`);
  info(`Pages with any Condition 1 component: ${pagesCondition1} / ${totalPages}`);

  const c1Coverage = Math.round((pagesCondition1 / Math.max(totalPages, 1)) * 100);
  if (c1Coverage >= 80) {
    pass(`Condition 1 coverage: ${c1Coverage}%`);
  } else if (c1Coverage >= 40) {
    warn(`Condition 1 partial coverage: ${c1Coverage}% (target: 80%+)`);
  } else {
    fail(`Condition 1 low coverage: ${c1Coverage}% — most pages lack evidence labels`);
  }

  // ── Section 3: Condition 2 — Consent disclosure coverage ─────────────
  header("Section 3 — Condition 2 (Consent disclosures on input forms)");

  const pagesWithConsent = grepCount(PAGES_DIR, "ConsentDisclosure");
  info(`Pages using ConsentDisclosure: ${pagesWithConsent}`);

  const HIGH_RISK_INPUT_PAGES = [
    "intake",
    "intake-wizard",
    "benefits-screener",
    "chw-dashboard",
    "case-manager",
    "referral",
    "voice",
    "journal",
    "self-assessment",
    "student-wizard",
    "partner",
    "onboarding",
    "health",
    "clinical",
  ];

  const riskPages = grepFiles(PAGES_DIR, "").filter((p) =>
    HIGH_RISK_INPUT_PAGES.some((k) => p.toLowerCase().includes(k)),
  );

  info(`High-risk input pages identified: ${riskPages.length}`);
  if (pagesWithConsent === 0) {
    fail("Condition 2: No pages are using ConsentDisclosure yet — remediation needed");
  } else {
    warn(`Condition 2: ${pagesWithConsent} pages have consent disclosure (ongoing rollout)`);
  }

  // ── Section 4: Condition 3 — AI disclosure coverage ───────────────────
  header("Section 4 — Condition 3 (AI augmentation disclosures)");

  const pagesWithAIDisclosure = grepCount(PAGES_DIR, "AIAugmentationDisclosure");
  const pagesWithNavigatorDisclosure = grepCount(PAGES_DIR, "NavigatorDisclosure");
  info(`Pages using AIAugmentationDisclosure: ${pagesWithAIDisclosure}`);
  info(`Pages using NavigatorDisclosure: ${pagesWithNavigatorDisclosure}`);

  if (pagesWithAIDisclosure === 0 && pagesWithNavigatorDisclosure === 0) {
    fail("Condition 3: No AI surfaces have augmentation disclosures yet");
  } else {
    warn(`Condition 3: ${pagesWithAIDisclosure + pagesWithNavigatorDisclosure} AI surfaces covered (ongoing)`);
  }

  // ── Section 5: Condition 4 — Uncertainty display coverage ────────────
  header("Section 5 — Condition 4 (Uncertainty displays for missing data)");

  const pagesWithUncertainty = grepCount(PAGES_DIR, "UncertaintyDisplay");
  const pagesWithNullGuard = grepCount(PAGES_DIR, "NullGuard");
  info(`Pages using UncertaintyDisplay: ${pagesWithUncertainty}`);
  info(`Pages using NullGuard: ${pagesWithNullGuard}`);

  if (pagesWithUncertainty === 0 && pagesWithNullGuard === 0) {
    fail("Condition 4: No pages handle missing data with UncertaintyDisplay yet");
  } else {
    warn(`Condition 4: ${pagesWithUncertainty + pagesWithNullGuard} pages handle uncertainty (ongoing)`);
  }

  // ── Section 6: Known high-priority gaps ───────────────────────────────
  header("Section 6 — Priority gap queue (top 10)");

  const PRIORITY_GAPS = [
    {
      file: "client/src/pages/impact.tsx",
      domain: "D12 — Research/Equity/Metrics",
      condition: "1, 4",
      issue: "Metrics displayed without evidence labels or decision captions",
    },
    {
      file: "client/src/pages/chw-dashboard.tsx",
      domain: "D5 — CHW/Case Management",
      condition: "1, 2, 3",
      issue: "Clinical data displayed without limitation disclosure; referral forms lack consent",
    },
    {
      file: "client/src/pages/transparency-dashboard.tsx",
      domain: "D12 — Research/Equity/Metrics",
      condition: "1, 4",
      issue: "Modeled values may be displayed as observed; missing evidence class labels",
    },
    {
      file: "client/src/pages/EquityLossNational.tsx",
      domain: "D12 — Research/Equity/Metrics",
      condition: "1, 3",
      issue: "Equity-loss scores need Three Realities framing and decision captions",
    },
    {
      file: "client/src/pages/community-brief.tsx",
      domain: "D3 — Community Brief",
      condition: "1, 3",
      issue: "Brief figures need EvidenceLabel; AI synthesis needs AIAugmentationDisclosure",
    },
    {
      file: "client/src/pages/benefits-screener.tsx",
      domain: "D4 — Benefits",
      condition: "2, 4",
      issue: "Eligibility screener lacks ConsentDisclosure; missing data shows as empty",
    },
    {
      file: "client/src/pages/intake-wizard.tsx",
      domain: "D4 — Benefits",
      condition: "2",
      issue: "Intake wizard collects sensitive data without ConsentDisclosure",
    },
    {
      file: "client/src/pages/landing.tsx",
      domain: "D1 — Homepage",
      condition: "5",
      issue: "HBCU references lack relationship-status labels; generic partnership claims",
    },
    {
      file: "client/src/pages/rural-workforce.tsx",
      domain: "N1 — Rural Workforce",
      condition: "1, 5",
      issue: "Land-grants tab mislabeled; institution list needs relationship status",
    },
    {
      file: "client/src/pages/navigator.tsx",
      domain: "D2 — AI Navigator",
      condition: "3",
      issue: "Navigator responses need AIAugmentationDisclosure / NavigatorDisclosure",
    },
  ];

  for (const gap of PRIORITY_GAPS) {
    const exists = fileExists(gap.file);
    const status = exists ? `${RED}GAP${RESET}` : `${YELLOW}FILE NOT FOUND${RESET}`;
    console.log(`  [${status}] ${gap.domain}`);
    console.log(`        File: ${gap.file}`);
    console.log(`        Conditions: ${gap.condition}`);
    console.log(`        Issue: ${gap.issue}`);
  }

  // ── Section 7: Source registry check ─────────────────────────────────
  header("Section 7 — Data source registry");

  if (fileExists("server/seed-data-sources.ts")) {
    pass("Seed data sources file exists (20 canonical sources)");
  } else {
    fail("MISSING: server/seed-data-sources.ts — run seeding before domain audits");
  }

  // ── Summary ───────────────────────────────────────────────────────────
  header("Summary");

  console.log(`  Foundation files: ${GREEN}${foundationPass} passed${RESET}, ${foundationFail > 0 ? RED : GREEN}${foundationFail} missing${RESET}`);
  console.log(`  Condition 1 coverage: ${c1Coverage}% of pages`);
  console.log(`  Condition 2 coverage: ${pagesWithConsent} pages`);
  console.log(`  Condition 3 coverage: ${pagesWithAIDisclosure + pagesWithNavigatorDisclosure} AI surfaces`);
  console.log(`  Condition 4 coverage: ${pagesWithUncertainty + pagesWithNullGuard} pages`);
  console.log(`  Priority gaps queued: ${PRIORITY_GAPS.length}`);

  if (foundationFail > 0) {
    console.log(`\n${RED}${BOLD}AUDIT RESULT: FOUNDATION GAPS FOUND — fix missing files before domain audits${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}AUDIT RESULT: FOUNDATION COMPLETE — ready for domain cluster audits${RESET}`);
    console.log(`${YELLOW}Next: Run domain audits in 5 parallel streams per the backward plan.${RESET}\n`);
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error("Audit script error:", err);
  process.exit(1);
});
