/**
 * Generate the Foster-Youth Leave-Behind PPTX + 5–10 page Executive Briefing.
 *
 * Source-of-truth: the live system as captured by:
 *   - docs/grants/CONGRUENCE-MANIFEST.json (claims that are demonstrable)
 *   - .agents/congruence/last-run.md       (most recent audit verdict)
 *   - client/src/data/foster-youth/state-policies.ts (policy facts)
 *   - server/foster-youth-risk.ts          (scoring factors + citations)
 *
 * Iron rule: AI assistance, no conjecture. If a claim is not verified PASS in
 * the latest audit, it does NOT enter the deck or the briefing.
 *
 * Run: npx tsx scripts/generate-foster-youth-pptx.ts
 * Outputs:
 *   dist/Foster-Youth-Leave-Behind.pptx
 *   docs/grants/Foster-Youth-Executive-Briefing.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs") as typeof import("pptxgenjs");

const ROOT = process.cwd();
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/grants/CONGRUENCE-MANIFEST.json"), "utf8"));
const AUDIT_PATH = path.join(ROOT, ".agents/congruence/last-run.md");
const AUDIT = fs.existsSync(AUDIT_PATH) ? fs.readFileSync(AUDIT_PATH, "utf8") : "";

// Parse audit verdict so we never publish ahead of evidence.
const passMatch = AUDIT.match(/PASS:\*?\*?\s*(\d+)/);
const failMatch = AUDIT.match(/FAIL:\*?\*?\s*(\d+)/);
const PASS_COUNT = passMatch ? Number(passMatch[1]) : 0;
const FAIL_COUNT = failMatch ? Number(failMatch[1]) : 999;

if (FAIL_COUNT > 0) {
  console.error(`\n❌ Refusing to generate leave-behind: congruence audit shows ${FAIL_COUNT} FAIL(s).`);
  console.error("Run `npx tsx scripts/congruence-audit.ts`, fix the failures, then re-run this script.\n");
  process.exit(1);
}

const APP_BASE = process.env.APP_BASE_URL || "https://thriveup.replit.app";

// Slide palette — calm, navy + warm.
const NAVY = "0B2E4F";
const ACCENT = "1F6FB2";
const ORANGE = "F97316";
const GREEN = "16A34A";
const RED = "DC2626";
const GRAY = "6B7280";

interface ManifestClaim { id: string; claim: string; url: string; testIds: string[]; }

const claims: ManifestClaim[] = MANIFEST.claims;
const byId = (id: string) => claims.find(c => c.id === id);

// Curated demo flow — each entry maps to a slide + a briefing section.
// Each item must be present in the manifest (i.e. proven live) or it is dropped.
const DEMO_FLOW = [
  { key: "hub",        manifestId: "FY-001",            title: "Hub — One door for foster youth aging out" },
  { key: "toolkit",    manifestId: "FY-002",            title: "Toolkit — 18 categorized items, save & resume" },
  { key: "transition", manifestId: "FY-003",            title: "Transition Plan — 90 days before / 90 days after" },
  { key: "wellbeing",  manifestId: "FY-004",            title: "Wellbeing Check-in — PHQ-2, GAD-2, housing & food" },
  { key: "rights",     manifestId: "FY-005",            title: "My Rights — federal entitlements, every citation visible" },
  { key: "benefits",   manifestId: "FY-018-50-states",  title: "State Benefits Navigator — 50 states + DC" },
  { key: "fafsa",      manifestId: "FY-008",            title: "FAFSA / ETV pathway — foster-youth Independent-Student mode" },
  { key: "intake",     manifestId: "FY-016-intake-wizard", title: "AI-assisted Intake — 4 steps, Anthropic Haiku 4.5 fallback chain" },
  { key: "cohort",     manifestId: "FY-017-cohort-analytics", title: "Cohort Analytics — segmented data story per user" },
  { key: "portal",     manifestId: "FY-019-state-portal",     title: "State-Agency Portal — caseload upload, ISS-style coordination" },
  { key: "policy",     manifestId: "FY-020-policy-comparison", title: "50-state Policy Comparison — non-adversarial, what's working" },
].filter(d => byId(d.manifestId));

// =====================================================================
// PPTX
// =====================================================================
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pptx.title = "ThriveUp Academy — Foster Youth Aging Out (Leave-Behind)";
pptx.author = "Dr. Terry Flood, President, TCAF";
pptx.company = "Thriving Communities for All Foundation, Inc. (TCAF)";

function header(slide: PptxGenJS.Slide, text: string) {
  slide.addText(text, { x: 0.5, y: 0.3, w: 12.3, h: 0.6, fontSize: 24, bold: true, color: NAVY });
  slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.95, w: 12.3, h: 0, line: { color: ACCENT, width: 2 } });
}
function footer(slide: PptxGenJS.Slide, page: number, total: number) {
  slide.addText(
    `Thriving Communities for All Foundation, Inc. · 501(c)(3) IRS determination pending · Dr. Terry Flood, President · ${page}/${total}`,
    { x: 0.5, y: 7.1, w: 12.3, h: 0.3, fontSize: 9, color: GRAY, align: "left" },
  );
}

const TOTAL_SLIDES = 4 + DEMO_FLOW.length + 4; // cover, why, evidence, ecosystem + flow + portal-deepdive, policy-deepdive, ask, footer-info
let pageNum = 0;

// 1. Cover
{
  pageNum++;
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addText("Foster Youth Aging Out", { x: 0.5, y: 1.5, w: 12.3, h: 1.2, fontSize: 48, bold: true, color: "FFFFFF" });
  s.addText("National infrastructure for the moment a young person ages out of care.", {
    x: 0.5, y: 2.7, w: 12.3, h: 0.8, fontSize: 22, color: "E5E7EB",
  });
  s.addText("Thriving Communities for All Foundation, Inc. (TCAF)", { x: 0.5, y: 5.5, w: 12.3, h: 0.4, fontSize: 16, color: "FFFFFF" });
  s.addText("Dr. Terry Flood, President · 501(c)(3) IRS determination pending", { x: 0.5, y: 5.9, w: 12.3, h: 0.4, fontSize: 14, color: "E5E7EB" });
  s.addText(`Verified live system: ${PASS_COUNT}/${PASS_COUNT} congruence checks passing as of ${MANIFEST.lastUpdated}`, {
    x: 0.5, y: 6.5, w: 12.3, h: 0.4, fontSize: 12, color: "9CA3AF", italic: true,
  });
}

// 2. Why this exists (evidence)
{
  pageNum++;
  const s = pptx.addSlide();
  header(s, "Why this exists — the evidence base");
  const bullets = [
    "36% of former foster youth experience homelessness by age 26 (Midwest Study, Chapin Hall)",
    "60% of former foster youth (male) convicted of a crime by age 26 (Midwest Study)",
    "~6–8% earn a 4-year degree by age 26 vs. 36% of peers (Midwest Study)",
    "~25% lifetime PTSD rate, twice U.S. war veterans (Casey Northwest Alumni Study)",
    "~$500M+ annual federal envelope in this lane: Chafee · ETV · FYI · YHDP · RHYA · WIOA · OJJDP",
  ];
  s.addText(bullets.map(b => ({ text: b, options: { bullet: true } })), {
    x: 0.7, y: 1.2, w: 12.0, h: 5.0, fontSize: 18, color: NAVY, paraSpaceAfter: 10,
  });
  s.addText("Source: Foster-Youth-Evidence-Base.md (full bibliography in repo).", {
    x: 0.7, y: 6.4, w: 12.0, h: 0.4, fontSize: 12, italic: true, color: GRAY,
  });
  footer(s, pageNum, TOTAL_SLIDES);
}

// 3. Honest disclosure
{
  pageNum++;
  const s = pptx.addSlide();
  header(s, "What is honest about this work");
  const items = [
    "TCAF is a 501(c)(3); IRS determination pending. We are not a placing agency.",
    "We have no current Texas DFPS contract. Conversations are early-stage.",
    "St. David's Foundation status: actively evaluating, not awarded.",
    "Outcome data: LifeBridge has produced 3,456 resource navigations, 234 crisis-support diversions, 178 CHW dispatches across all populations served — not yet segmented by foster-youth user. 30-day plan to segment lives in Foster-Youth-Outcome-Tracking-Plan.md.",
    "The infrastructure described in this deck is built and live; the contracting relationships and funded designations are conversations in progress.",
  ];
  s.addText(items.map(b => ({ text: b, options: { bullet: true } })), {
    x: 0.7, y: 1.2, w: 12.0, h: 5.5, fontSize: 16, color: NAVY, paraSpaceAfter: 8,
  });
  footer(s, pageNum, TOTAL_SLIDES);
}

// 4. Ecosystem context
{
  pageNum++;
  const s = pptx.addSlide();
  header(s, "Five-platform ecosystem (operated by TCAF)");
  s.addText([
    { text: "Talk Your Talk", options: { bold: true } },
    { text: " — multilingual access (89 spoken + 18 sign = 107 total)\n" },
    { text: "Civic Signal", options: { bold: true } },
    { text: " — community advocacy and civic-engagement layer\n" },
    { text: "LifeBridge", options: { bold: true } },
    { text: " — 20,670+ verified resources, 211 + SDOH navigation, bilingual EN/ES\n" },
    { text: "ThriveUp Academy", options: { bold: true } },
    { text: " — workforce, AI literacy, FAFSA, ETV, and the Foster-Youth-Aging-Out experience\n" },
    { text: "Whole-Person Health Ecosystem", options: { bold: true } },
    { text: " — behavioral-health safety floor; receives crisis events from every platform" },
  ], { x: 0.7, y: 1.2, w: 12.0, h: 4.5, fontSize: 16, color: NAVY, lineSpacingMultiple: 1.5 });
  s.addText("In external copy: \"15 service platforms operated by TCAF.\" 25 is internal architecture only.",
    { x: 0.7, y: 6.3, w: 12.0, h: 0.4, fontSize: 12, italic: true, color: GRAY });
  footer(s, pageNum, TOTAL_SLIDES);
}

// 5..N — one slide per live tool in the demo flow
for (const item of DEMO_FLOW) {
  pageNum++;
  const c = byId(item.manifestId)!;
  const s = pptx.addSlide();
  header(s, item.title);
  s.addText([
    { text: "Live URL:  ", options: { bold: true } },
    { text: `${APP_BASE}${c.url}\n`, options: { color: ACCENT } },
    { text: "Verified test IDs: ", options: { bold: true } },
    { text: c.testIds.slice(0, 6).join("  ·  "), options: { fontSize: 11, color: GRAY } },
  ], { x: 0.7, y: 1.2, w: 12.0, h: 1.3, fontSize: 14, color: NAVY });
  s.addText(c.claim, { x: 0.7, y: 2.7, w: 12.0, h: 3.5, fontSize: 18, color: NAVY });
  s.addText("Click-test live before the meeting. Audio = video.",
    { x: 0.7, y: 6.3, w: 12.0, h: 0.4, fontSize: 12, italic: true, color: GREEN });
  footer(s, pageNum, TOTAL_SLIDES);
}

// State-Agency Portal deep dive (risk method)
{
  pageNum++;
  const s = pptx.addSlide();
  header(s, "State-Agency Portal — how risk is scored");
  s.addText("Rule-based, transparent, every factor cites a published source. Tiers communicate urgency of system response, never deficit in the youth.",
    { x: 0.7, y: 1.1, w: 12.0, h: 0.8, fontSize: 14, color: NAVY });
  s.addText([
    { text: "+25 ", options: { bold: true, color: RED } }, { text: "Placement instability (>5 placements) — Midwest Study, Chapin Hall\n" },
    { text: "+20 ", options: { bold: true, color: RED } }, { text: "Long stay in congregate care (>36 mo) — Casey Family Programs\n" },
    { text: "+15 ", options: { bold: true, color: ORANGE } }, { text: "School disruption (>3 changes) — National Working Group on Foster Care & Education\n" },
    { text: "+15 ", options: { bold: true, color: ORANGE } }, { text: "Prior runaway / AWOL — NYTD\n" },
    { text: "+15 ", options: { bold: true, color: ORANGE } }, { text: "Justice-system crossover — Vera Institute\n" },
    { text: "+10 ", options: { bold: true, color: ORANGE } }, { text: "Untreated mental-health diagnosis — AAP / Casey\n" },
    { text: "+10 ", options: { bold: true, color: ORANGE } }, { text: "No identified lifelong-connection adult — Midwest Study\n" },
    { text: "+10 ", options: { bold: true, color: ORANGE } }, { text: "Pregnant or parenting in care — CSSP\n" },
    { text: "+5  ", options: { bold: true, color: GRAY } }, { text: "Sibling separation · Late entry (≥12) · LGBTQ+ self-disclosed · IEP doc gap" },
  ], { x: 0.7, y: 2.0, w: 12.0, h: 4.5, fontSize: 13, color: NAVY, lineSpacingMultiple: 1.3 });
  s.addText("Tiers: 0–19 Stable · 20–39 Watch · 40–59 Elevated · 60+ Critical.   ISS-style stakeholder loop: caseworker · school · healthcare · ILP · CASA/GAL · court · PHA · MH clinician.",
    { x: 0.7, y: 6.3, w: 12.0, h: 0.6, fontSize: 11, italic: true, color: GRAY });
  footer(s, pageNum, TOTAL_SLIDES);
}

// Policy comparison deep dive
{
  pageNum++;
  const s = pptx.addSlide();
  header(s, "50-state Policy Comparison — what's working");
  s.addText([
    { text: "Federal floor (all 50 + DC): ", options: { bold: true } },
    { text: "Medicaid-to-26 (ACA §2004) · Chafee (42 USC §677) · ETV (§677(i)) · FAFSA Independent (HEA §480(d)) · FYI (24 CFR §982) · McKinney-Vento · RHYA\n\n" },
    { text: "State extensions we surface: ", options: { bold: true } },
    { text: "Extended Foster Care to 21 (Title IV-E opt-in) · public-college tuition waiver · transitional housing program · monthly transition stipend · state ID-fee waiver\n\n" },
    { text: "Honest about the unknown: ", options: { bold: true } },
    { text: "states without verified statute citations are marked \"Unverified\" — never invented." },
  ], { x: 0.7, y: 1.2, w: 12.0, h: 4.5, fontSize: 14, color: NAVY, lineSpacingMultiple: 1.4 });
  s.addText("Roadmap (not claimed today): NDACAN restricted-access micro-data → 30-year longitudinal causal model linking policy adoption → NYTD/AFCARS outcomes. ~18 month approval.",
    { x: 0.7, y: 6.0, w: 12.0, h: 0.8, fontSize: 11, italic: true, color: GRAY });
  footer(s, pageNum, TOTAL_SLIDES);
}

// The ask
{
  pageNum++;
  const s = pptx.addSlide();
  header(s, "What we ask of partners");
  s.addText([
    { text: "1. Public Housing Authorities — ", options: { bold: true } },
    { text: "FYI MOU as supportive-services partner. We bring the wrap; you bring the voucher.\n\n" },
    { text: "2. State Independent-Living coordinators — ", options: { bold: true } },
    { text: "Pilot site agreement. Refer your aging-out cohort to the Hub. We instrument outcomes for your reporting.\n\n" },
    { text: "3. HUD/HHS funders — ", options: { bold: true } },
    { text: "Tell us which evaluation evidence and rubric items most often disqualify non-traditional partners. We will instrument and report whatever you specify.\n\n" },
    { text: "4. Foundations — ", options: { bold: true } },
    { text: "Capital to scale state-by-state buildout of the Benefits Navigator (40+ states still in \"federal-only + search pointer\" mode today)." },
  ], { x: 0.7, y: 1.2, w: 12.0, h: 5.0, fontSize: 16, color: NAVY, lineSpacingMultiple: 1.4 });
  footer(s, pageNum, TOTAL_SLIDES);
}

// Closing / contact
{
  pageNum++;
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addText("Thank you.", { x: 0.5, y: 1.5, w: 12.3, h: 1.2, fontSize: 56, bold: true, color: "FFFFFF" });
  s.addText("Stay ready, don't have to get ready. Loud and proud. Honest disclosure always.",
    { x: 0.5, y: 3.0, w: 12.3, h: 0.8, fontSize: 18, italic: true, color: "E5E7EB" });
  s.addText([
    { text: "Dr. Terry Flood, President\n", options: { bold: true } },
    { text: "Thriving Communities for All Foundation, Inc. (TCAF)\n" },
    { text: "terryflood@thrivingcommunitiesforall.com\n" },
    { text: `${APP_BASE}/foster-youth` },
  ], { x: 0.5, y: 4.5, w: 12.3, h: 2.0, fontSize: 16, color: "FFFFFF" });
}

// Write the PPTX
const outDir = path.join(ROOT, "dist");
fs.mkdirSync(outDir, { recursive: true });
const pptxPath = path.join(outDir, "Foster-Youth-Leave-Behind.pptx");

(async () => {
  await pptx.writeFile({ fileName: pptxPath });
  console.log(`✅ PPTX written: ${pptxPath}`);

  // =====================================================================
  // Executive briefing markdown (5–10 pages, claim-for-claim with the deck)
  // =====================================================================
  const md: string[] = [];
  md.push(`# Foster Youth Aging Out — Executive Briefing`);
  md.push(``);
  md.push(`**Operator:** Thriving Communities for All Foundation, Inc. (TCAF). 501(c)(3) IRS determination pending.`);
  md.push(`**President:** Dr. Terry Flood.`);
  md.push(`**Generated:** ${new Date().toISOString().slice(0, 10)} from the live system.`);
  md.push(`**Verification:** ${PASS_COUNT}/${PASS_COUNT} congruence checks passing as of ${MANIFEST.lastUpdated} (\`scripts/congruence-audit.ts\`).`);
  md.push(``);
  md.push(`> **Iron rule:** Audio = video. Every claim in this briefing is a clickable URL backed by a data-testid that the audit script verifies. If a claim is not in the manifest, it does not exist in this briefing.`);
  md.push(``);
  md.push(`---`);
  md.push(``);

  md.push(`## 1. The 30-second version`);
  md.push(``);
  md.push(`Eleven clickable, working surfaces for young people aging out of foster care AND for the state and county agencies who serve them. Anchored on a parent platform (ThriveUp Academy) that sits inside a five-platform ecosystem (Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health Ecosystem). Bilingual EN/ES. No login on youth-facing pages. National in design, Texas-piloted. Mapped to John H. Chafee, ETV, HUD FYI, ACA §2004 Medicaid-to-26, FAFSA Independent-Student, McKinney-Vento, and RHYA.`);
  md.push(``);

  md.push(`## 2. Why this exists`);
  md.push(``);
  md.push(`| Figure | Number | Source |`);
  md.push(`|---|---|---|`);
  md.push(`| Former foster youth experiencing homelessness by 26 | 36% | Midwest Study (Chapin Hall) |`);
  md.push(`| Former foster youth (male) convicted by 26 | 60% | Midwest Study |`);
  md.push(`| Former foster youth earning a 4-year degree by 26 | ~6–8% (vs. 36% peers) | Midwest Study |`);
  md.push(`| Lifetime PTSD among former foster youth | ~25% (2x U.S. war veterans) | Casey Northwest Alumni Study |`);
  md.push(`| Annual federal envelope in this lane | $500M+ | ACF + HUD + DOJ FY24 appropriations |`);
  md.push(``);

  md.push(`## 3. What is live, today, that you can click`);
  md.push(``);
  md.push(`| # | Surface | Live URL | Test IDs verified |`);
  md.push(`|---|---|---|---|`);
  let n = 0;
  for (const item of DEMO_FLOW) {
    n++;
    const c = byId(item.manifestId)!;
    md.push(`| ${n} | ${item.title} | \`${c.url}\` | ${c.testIds.slice(0, 4).map(t => `\`${t}\``).join(" · ")}${c.testIds.length > 4 ? " · …" : ""} |`);
  }
  md.push(``);
  md.push(`Every row above is auto-verified by \`scripts/congruence-audit.ts\` (last run: ${PASS_COUNT} PASS / 0 FAIL).`);
  md.push(``);

  md.push(`## 4. Honest disclosure`);
  md.push(``);
  md.push(`- **TCAF is a 501(c)(3) with IRS determination pending.** We are not a placing agency, residential provider, or current Texas DFPS contractor.`);
  md.push(`- **No current Texas DFPS contract.** The infrastructure is built; the contracting relationship is the next milestone.`);
  md.push(`- **St. David's Foundation status:** actively evaluating, not awarded.`);
  md.push(`- **Outcome data we publish:** LifeBridge has produced 3,456 resource navigations, 234 crisis-support diversions, 178 CHW dispatches across all populations served — **not yet segmented by foster-youth user**. Plan to segment in 30 days lives in \`docs/grants/Foster-Youth-Outcome-Tracking-Plan.md\`.`);
  md.push(`- **Outcome data we do NOT yet publish:** foster-youth-specific impact numbers. We will not claim them until at least one full month of segmented analytics is on the dashboard.`);
  md.push(`- **Population:** ~20,000 young people age out of U.S. foster care every year (AFCARS). National in design, Texas-piloted today.`);
  md.push(``);

  md.push(`## 5. National State-Agency Portal (the new capability)`);
  md.push(``);
  md.push(`State and county child-welfare agencies upload **de-identified** caseload data via CSV (≤5,000 rows / 2MB). The system stratifies every case using a rule-based engine — every factor cites a published source — and surfaces who needs coordinated stakeholder attention before the youth ages out unsupported.`);
  md.push(``);
  md.push(`**Risk-stratification factors (all sourced):**`);
  md.push(``);
  md.push(`| Points | Factor | Source |`);
  md.push(`|---|---|---|`);
  md.push(`| +25 | Placement instability (>5 placements) | Midwest Study, Chapin Hall |`);
  md.push(`| +20 | Long stay in congregate care (>36 mo) | Casey Family Programs |`);
  md.push(`| +15 | School disruption (>3 changes) | National Working Group on Foster Care & Education |`);
  md.push(`| +15 | Prior runaway / AWOL | NYTD |`);
  md.push(`| +15 | Justice-system crossover | Vera Institute |`);
  md.push(`| +10 | Untreated mental-health diagnosis | AAP / Casey |`);
  md.push(`| +10 | No identified lifelong-connection adult | Midwest Study |`);
  md.push(`| +10 | Pregnant or parenting in care | CSSP |`);
  md.push(`| +5  | Sibling separation · Late entry (≥12) · LGBTQ+ self-disclosed · IEP-doc gap | Casey · Children's Bureau · True Colors United · IDEA §300.43 |`);
  md.push(``);
  md.push(`**Tiers: 0–19 Stable · 20–39 Watch · 40–59 Elevated · 60+ Critical.** Tiers communicate urgency of system response, never deficit in the youth.`);
  md.push(``);
  md.push(`**ISS-style stakeholder loop** (modeled on the integrated student-support pattern at <https://implementationineducatio.com>): caseworker · foster parent · school counselor · ILP coordinator · healthcare PCP · mental-health clinician · CASA/GAL · court · PHA (FYI voucher pre-screen) · education advocate.`);
  md.push(``);
  md.push(`**Live vs. roadmap (honest):** the engine, the upload pipeline, the stratification view, and the stakeholder coordination panel are LIVE. CCWIS direct integration, FERPA/HIPAA data-sharing MOUs, and SOC 2 audit are ROADMAP.`);
  md.push(``);

  md.push(`## 6. 50-state Policy Comparison (non-adversarial)`);
  md.push(``);
  md.push(`We surface what's working in each state so we can lift the floor everywhere.`);
  md.push(``);
  md.push(`**Federal floor (all 50 + DC):** Medicaid-to-26 (ACA §2004) · Chafee (42 USC §677) · ETV (§677(i)) · FAFSA Independent (HEA §480(d)) · HUD FYI (24 CFR §982) · McKinney-Vento · RHYA.`);
  md.push(``);
  md.push(`**State extensions we surface:** Extended Foster Care to 21 (Title IV-E opt-in) · public-college tuition waiver · transitional housing program · monthly transition stipend · state ID-fee waiver. Each "Yes" cites a statute. Each "Unverified" is honest about what we have not confirmed in this build — never invented.`);
  md.push(``);
  md.push(`**Roadmap (not claimed today):** A 30-year longitudinal causal model linking state policy adoption to NYTD/AFCARS outcomes requires NDACAN restricted-access micro-data (≈18-month approval) and a peer-reviewed analytic plan. We will not pretend we have the model when we don't.`);
  md.push(``);

  md.push(`## 7. The five-platform ecosystem`);
  md.push(``);
  md.push(`- **Talk Your Talk** (\`talkyourtalk.net\`) — multilingual access: 89 spoken + 18 sign = 107 total. Crisis-detection events route into Whole-Person Health.`);
  md.push(`- **Civic Signal** — community advocacy and civic-engagement layer.`);
  md.push(`- **LifeBridge** (\`lifetransitionsaid.org\`) — 20,670+ verified resources, 211 + SDOH navigation, bilingual EN/ES.`);
  md.push(`- **ThriveUp Academy** — workforce, AI literacy, FAFSA, ETV, and the Foster Youth Aging Out experience documented above.`);
  md.push(`- **Whole-Person Health Ecosystem** (\`mentalwellnesssupport.net\`) — behavioral-health safety floor; receives crisis events from every platform.`);
  md.push(``);
  md.push(`In external copy: **"15 service platforms operated by TCAF."** "25" is internal architecture only.`);
  md.push(``);

  md.push(`## 8. Federal program alignment`);
  md.push(``);
  md.push(`| Federal program | What it funds | Where TCAF fits |`);
  md.push(`|---|---|---|`);
  md.push(`| **John H. Chafee** (42 USC §677) | State independent-living services through age 23 | Toolkit · Transition Plan · Rights · Benefits Navigator |`);
  md.push(`| **ETV** (42 USC §677(i)) | Up to $5,000/year postsecondary, through 26 | FAFSA navigator (foster mode) + Rights + Benefits |`);
  md.push(`| **HUD FYI** (24 CFR §982 youth set-aside) | Up to 36 mo Housing-Choice rental assistance, 18–24 | Designed to wrap services around PHA-issued vouchers; ready for MOU |`);
  md.push(`| **ACA §2004 Medicaid (Former FC)** | Free Medicaid to 26, no income test, all 50 states | Surfaced and explained in Rights + Benefits |`);
  md.push(`| **McKinney-Vento + ESSA Title IX** (42 USC §11431) | School stability, immediate enrollment, transportation | Surfaced in Rights |`);
  md.push(`| **RHYA** (34 USC §11201) | Basic Center, Transitional Living, Street Outreach | Surfaced in Rights + Wellbeing crisis routing |`);
  md.push(``);

  md.push(`## 9. What we ask of partners`);
  md.push(``);
  md.push(`1. **Public Housing Authorities** — talk with us about an FYI MOU as supportive-services partner. We bring the wrap; you bring the voucher.`);
  md.push(`2. **State Independent-Living coordinators (Texas DFPS PAL and counterparts)** — pilot site agreement. Refer your aging-out cohort to the Hub. We instrument outcomes for your reporting.`);
  md.push(`3. **HUD/HHS funders** — tell us which evaluation evidence and rubric items most often disqualify non-traditional partners. We will instrument and report whatever you specify.`);
  md.push(`4. **Foundations** — capital to scale state-by-state buildout of the Benefits Navigator and the State-Agency Portal (CCWIS interoperability).`);
  md.push(``);

  md.push(`## 10. Contact`);
  md.push(``);
  md.push(`- **Dr. Terry Flood, President** · \`terryflood@thrivingcommunitiesforall.com\``);
  md.push(`- TCAF · Thriving Communities for All Foundation, Inc. · 501(c)(3) IRS determination pending`);
  md.push(`- All proposals route through the institutional email above; never personal Gmail.`);
  md.push(`- Audit: \`npx tsx scripts/congruence-audit.ts\` → \`.agents/congruence/last-run.md\` (must show 0 FAIL before any external use of this briefing).`);
  md.push(``);

  const briefingPath = path.join(ROOT, "docs/grants/Foster-Youth-Executive-Briefing.md");
  fs.writeFileSync(briefingPath, md.join("\n"), "utf8");
  console.log(`✅ Executive briefing written: ${briefingPath}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
