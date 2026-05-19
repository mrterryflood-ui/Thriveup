#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dump = readFileSync("/tmp/grants_high.txt", "utf8").trim().split("\n");
const header = dump.shift();
const cols = header.split("|");
const rows = dump.map((line) => {
  const parts = line.split("|");
  const o = {};
  cols.forEach((c, i) => (o[c] = parts[i] ?? ""));
  return o;
});

const byStatus = {};
for (const r of rows) {
  const s = r.status || "(none)";
  byStatus[s] ??= [];
  byStatus[s].push(r);
}

function fmtRow(r, includeNotes = true) {
  const fit = r.fit ? r.fit : "—";
  const deadline = r.deadline || "—";
  const url = r.url ? `[link](${r.url})` : "—";
  const agency = (r.agency || "—").replace(/\|/g, "\\|");
  const title = (r.title || "—").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const status = r.status || "—";
  let block = `### ${title}\n\n`;
  block += `- **Agency:** ${agency}\n`;
  block += `- **Deadline:** ${deadline}\n`;
  block += `- **Fit score:** ${fit}\n`;
  block += `- **Status:** ${status}\n`;
  block += `- **Source:** ${r.source || "—"} · ${url}\n`;
  if (includeNotes && r.notes) {
    const notes = r.notes.replace(/\\n/g, "\n").trim();
    block += `\n**Justification / Notes:**\n\n${notes}\n`;
  }
  return block;
}

function fmtCompact(r) {
  const fit = r.fit ? r.fit : "—";
  const deadline = r.deadline || "—";
  const title = (r.title || "—").replace(/\|/g, "\\|");
  const agency = (r.agency || "—").replace(/\|/g, "\\|");
  return `| ${title} | ${agency} | ${deadline} | ${fit} | ${r.status} | [link](${r.url || "#"}) |`;
}

const drafts = [];
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else drafts.push(p);
  }
}
walk("docs/grants");
drafts.sort();

const today = new Date().toISOString().slice(0, 10);

let md = "";
md += `# TCAF / ThriveUp Academy — Master Grants Tracker\n\n`;
md += `**Generated:** ${today}  \n`;
md += `**Source:** \`grant_opportunities\` DB (671 total rows) + \`docs/grants/\` drafts (${drafts.length} files)  \n`;
md += `**Purpose:** Single-document inventory of every grant identified, every draft written, with justification for each — built so nothing slips through the cracks when populating an external tracker.\n\n`;

md += `---\n\n## Index\n\n`;
md += `1. [Executive summary & counts](#1-executive-summary)\n`;
md += `2. [Submitted grants](#2-submitted-grants)\n`;
md += `3. [Actively pursuing / drafting (engaged)](#3-actively-pursuing--drafting)\n`;
md += `4. [Watch next cycle](#4-watch-next-cycle)\n`;
md += `5. [High-fit identified opportunities (fit ≥ 80)](#5-high-fit-identified-fit--80)\n`;
md += `6. [Mid-fit identified opportunities (fit 60–79)](#6-mid-fit-identified-fit-6079)\n`;
md += `7. [Marginal-fit identified opportunities (fit 50–59)](#7-marginal-fit-identified-fit-5059)\n`;
md += `8. [Drafts written — complete inventory](#8-drafts-written--complete-inventory)\n`;
md += `8a. [Low-fit & unscored backlog (fit 1–49 + null)](#8a-low-fit-identified-fit-149-and-unscored)\n`;
md += `8b. [Expired (historical reference)](#8b-expired-historical-reference)\n`;
md += `9. [Recent rescore decisions (2026-05-19)](#9-recent-rescore-decisions-2026-05-19)\n`;
md += `10. [Iron Rule gaps — primary-source verification still owed](#10-iron-rule-gaps)\n\n`;

md += `---\n\n## 1. Executive summary\n\n`;
md += `### Totals\n\n`;
md += `- **671** grants identified in the DB (source breakdown: grants.gov 376 · usaspending 200 · samgov 39 · manual 16 · tx_statewide 8 · state_texas 6 · city_austin 5 · others 21).\n`;
md += `- **161** at fit ≥ 90, **26** at 80–89, **22** at 70–79, **26** at 60–69, **27** at 50–59 (capability-fit scoring, not award probability).\n`;
md += `- **9** currently engaged: 1 submitted · 3 pursuing · 1 LOI drafting · 2 watch next cycle · 1 superseded · 1 discontinued.\n`;
md += `- **${drafts.length}** draft files in \`docs/grants/\` (full inventory in section 8).\n\n`;

md += `### Status breakdown\n\n`;
md += `| Status | Count |\n|---|---|\n`;
for (const s of ["submitted", "pursuing", "loi_drafting", "watch_next_cycle", "identified", "expired", "superseded_duplicate", "discontinued_invitation_only", "dismissed"]) {
  const list = byStatus[s] || [];
  md += `| ${s} | ${list.length} |\n`;
}
md += `\n`;

md += `### Iron Rule reminder\n\nEvery dollar amount, deadline, eligibility statement, and identifier in this document came from primary-source ingestion (grants.gov / SAM.gov / USA Spending / direct manual entry). When notes say "fit reflects capability, not award probability" — that is the honest distinction. Some scores in the DB are stale automated ingestion scores; the 9 rescored on 2026-05-19 are marked explicitly in their notes.\n\n`;

md += `---\n\n## 2. Submitted grants\n\n`;
for (const r of byStatus["submitted"] || []) md += fmtRow(r) + "\n---\n\n";

md += `## 3. Actively pursuing / drafting\n\n`;
for (const r of [...(byStatus["pursuing"] || []), ...(byStatus["loi_drafting"] || [])]) md += fmtRow(r) + "\n---\n\n";

md += `## 4. Watch next cycle\n\n`;
for (const r of byStatus["watch_next_cycle"] || []) md += fmtRow(r) + "\n---\n\n";

const identified = byStatus["identified"] || [];
const high = identified.filter((r) => r.fit !== "" && Number(r.fit) >= 80);
const mid = identified.filter((r) => r.fit !== "" && Number(r.fit) >= 60 && Number(r.fit) < 80);
const marginal = identified.filter((r) => r.fit !== "" && Number(r.fit) >= 50 && Number(r.fit) < 60);

md += `## 5. High-fit identified (fit ≥ 80)\n\n`;
md += `**${high.length} opportunities.** Each row has full justification stored in DB notes. Fit reflects capability-stack alignment; award probability requires partner letters, prior-award analysis, and submission readiness assessed per pursuit.\n\n`;
for (const r of high) md += fmtRow(r) + "\n---\n\n";

md += `## 6. Mid-fit identified (fit 60–79)\n\n`;
md += `**${mid.length} opportunities.** Compact format below; full notes available via DB query \`SELECT notes FROM grant_opportunities WHERE id=...\`.\n\n`;
md += `| Title | Agency | Deadline | Fit | Status | URL |\n|---|---|---|---|---|---|\n`;
for (const r of mid) md += fmtCompact(r) + "\n";
md += `\n`;

md += `## 7. Marginal-fit identified (fit 50–59)\n\n`;
md += `**${marginal.length} opportunities.** Reviewed periodically; not active targets.\n\n`;
md += `| Title | Agency | Deadline | Fit | Status |\n|---|---|---|---|---|\n`;
for (const r of marginal) {
  const title = (r.title || "—").replace(/\|/g, "\\|");
  const agency = (r.agency || "—").replace(/\|/g, "\\|");
  md += `| ${title} | ${agency} | ${r.deadline || "—"} | ${r.fit} | ${r.status} |\n`;
}
md += `\n`;

md += `---\n\n## 8. Drafts written — complete inventory\n\n`;
md += `Every file currently in \`docs/grants/\` (${drafts.length} total). Includes narratives, LOIs, budget docs, partner outreach, walkthroughs, strategic memos, capabilities inventories, and the AISD package (passed 2026-05-19, archived for reuse).\n\n`;

const groups = {};
for (const p of drafts) {
  const rel = p.replace(/^docs\/grants\//, "");
  const parts = rel.split("/");
  const group = parts.length > 1 ? parts[0] : "(top-level)";
  groups[group] ??= [];
  groups[group].push(rel);
}

for (const g of Object.keys(groups).sort()) {
  md += `### ${g}\n\n`;
  for (const f of groups[g]) {
    const full = "docs/grants/" + f;
    let size = "";
    try {
      const s = statSync(full);
      size = ` _(${(s.size / 1024).toFixed(1)} KB)_`;
    } catch {}
    md += `- \`${full}\`${size}\n`;
  }
  md += `\n`;
}

// Low-fit (under 50, not expired) + Expired full appendices
const lowDump = readFileSync("/tmp/grants_low.txt", "utf8").trim().split("\n");
const lowHeader = lowDump.shift();
const lowRows = lowDump.map((line) => {
  const [title, agency, deadline, fit, status, source, url] = line.split("|");
  return { title, agency, deadline, fit, status, source, url };
});

const expDump = readFileSync("/tmp/grants_expired.txt", "utf8").trim().split("\n");
expDump.shift();
const expRows = expDump.map((line) => {
  const [title, agency, deadline, fit, source, url] = line.split("|");
  return { title, agency, deadline, fit, source, url };
});

md += `---\n\n## 8a. Low-fit identified (fit 1–49) and unscored\n\n`;
md += `**${lowRows.length} opportunities.** Captured by automated grants.gov / SAM.gov / USAspending ingestion. Most are auto-scored 0 because the scorer hasn't been run against them yet — they are not actually irrelevant, they are unreviewed. Treat as the raw backlog to triage when capacity allows.\n\n`;
md += `| Title | Agency | Deadline | Fit | Status | Source |\n|---|---|---|---|---|---|\n`;
for (const r of lowRows) {
  const title = (r.title || "—").replace(/\|/g, "\\|").slice(0, 140);
  const agency = (r.agency || "—").replace(/\|/g, "\\|").slice(0, 80);
  const fit = r.fit === "" ? "—" : r.fit;
  md += `| ${title} | ${agency} | ${r.deadline || "—"} | ${fit} | ${r.status} | ${r.source} |\n`;
}
md += `\n`;

md += `---\n\n## 8b. Expired (historical reference)\n\n`;
md += `**${expRows.length} opportunities** whose deadlines have already passed. Kept in DB so we don't re-ingest duplicates next cycle and so we can study prior-award patterns. Re-check each one's renewal cycle when planning the same calendar window next year.\n\n`;
md += `| Title | Agency | Last Deadline | Fit | Source |\n|---|---|---|---|---|\n`;
for (const r of expRows) {
  const title = (r.title || "—").replace(/\|/g, "\\|").slice(0, 140);
  const agency = (r.agency || "—").replace(/\|/g, "\\|").slice(0, 80);
  const fit = r.fit === "" ? "—" : r.fit;
  md += `| ${title} | ${agency} | ${r.deadline || "—"} | ${fit} | ${r.source} |\n`;
}
md += `\n`;

md += `---\n\n## 9. Recent rescore decisions (2026-05-19)\n\n`;
md += `Nine ED grants and four DOE additions rescored against actual capability stack. Memory of every shift:\n\n`;
md += `| Grant | Old Fit | New Fit | Direction | Rationale |\n|---|---|---|---|---|\n`;
md += `| Promise Neighborhoods 84.215N (×2 rows) | 0 | 88 | ↑ | Chainweb (8-step citation-chained Census/CDC/SVI/FBI evidence pipeline, 593 LOC) is exactly the longitudinal-GPRA evidence engine PN requires. Real gap: needs LEA partner; ≤8 awards historically, ~$30M each. |\n`;
md += `| OSERS-OSEP 84.325J (SpEd apprenticeships) | 77 | 82 | ↑ | Adds Perfectly Different (neurodiversity IEP/504 builder) to the apprenticeship match. Caveat: eligibility typically IHE/SEA/LEA. |\n`;
md += `| TEA Community Partnership Grants | 67 | 67 | = | Mid-fit confirmed; state, ISD-led typical. No deadline in DB — needs verification. |\n`;
md += `| Innovative Approaches to Literacy 84.215G (×2 rows) | 0 | 62 | ↑ | Talk Your Talk (89 spoken + 18 sign + 6 learning, dialect-aware) + WholeMind visual-first Pre-K-12 is real literacy innovation. Track-record gap (501(c)(3) only effective 01/14/2026) prevents higher score. |\n`;
md += `| AEFLA FY2026 state awards | 59 | 22 | ↓ | Honest correction: this is state pass-through, not direct grant. Path is TWC AEL provider RFP, not federal listing. |\n`;
md += `| College Assistance Migrant 84.149A | 0 | 15 | ↑ | IHE-applicant program; not our profile. |\n`;
md += `| Ready To Learn Programming | 0 | 20 | ↑ | CPB/PBS-affiliated media producers, not our scale. |\n`;
md += `| Energy Auditor Training Grant Program (NEW) | — | 80 | new | Trade Sims expansion — 7th trade fit. DOE/EERE. |\n`;
md += `| Inclusive Energy Innovation Prize (NEW) | — | 78 | new | DOE/Diversity prize, TCAF 501(c)(3) eligible, simpler app. |\n`;
md += `| Communities LEAP (NEW) | — | 75 | new | DOE/SCEP place-based TA cohort, no cash but ~$4M in-kind. |\n`;
md += `| Clean Energy to Communities C2C (NEW) | — | 70 | new | NREL TA, lowest-lift DOE relationship-builder. |\n\n`;

md += `---\n\n## 10. Iron Rule gaps\n\nPrimary-source verification still owed before committing dates to the DB or external tracker:\n\n`;
md += `1. **DOE deadlines (4 rows)** — Energy Auditor Training · Inclusive Energy Innovation Prize · Communities LEAP · C2C. Currently NULL in DB. First task next session: open each program page and write verified next-cycle date.\n`;
md += `2. **Innovative Approaches to Literacy 84.215G duplicate** — two rows with 2026-06-07 vs 2026-06-09 deadlines. Reconcile against grants.gov primary.\n`;
md += `3. **TEA Community Partnership Grants deadline** — state ingestion didn't capture; check TEA site.\n`;
md += `4. **Auto-scan stale since 2026-05-15** — grant discovery cron last wrote four days ago; investigation already in \`docs/active-commitments.md\`.\n\n`;

md += `---\n\n## How to use this document\n\n`;
md += `**Populate your external tracker (Airtable, Notion, Asana, etc.) using these columns:**\n\n`;
md += `1. Title\n2. Agency / Funder\n3. Deadline\n4. Fit Score (0–100, capability-only)\n5. Status (submitted / pursuing / loi_drafting / watch_next_cycle / identified / expired)\n6. Source (grants.gov / usaspending / samgov / manual / state / city / foundation / corporate)\n7. Source URL\n8. Justification (paste from Notes field — Iron-Rule primary-source rationale)\n9. Draft Location (if any — section 8 maps grant → file)\n10. Next Action + Date\n11. Owner\n12. Decision Date (when scored / pursued / declined)\n\n`;
md += `**Mapping drafts to grants:** Section 8 lists all drafts; common pairings:\n\n`;
md += `- AISD 26RFP052 → \`docs/grants/aisd-26rfp052/\` (passed 2026-05-19, archived)\n`;
md += `- Centene Foundation 2026 → \`docs/grants/centene-foundation-2026/\`\n`;
md += `- SSG Fox FY27 → \`docs/grants/ssg-fox-fy27/\` + live build at \`vetmissiontransition.com\`\n`;
md += `- St. David's WAB2 → \`docs/grants/St-Davids-WAB2-*.md\` (declined 2026-05-15)\n`;
md += `- NSF TechAccess → 7 docs starting with \`docs/grants/NSF-TechAccess-*\`\n`;
md += `- AEI FY26 → \`docs/grants/AEI-*.md\` + \`docs/grants/AEI-Outreach-Drafts/\`\n`;
md += `- TWC RFA-32026-00162 → \`docs/grants/TWC-*.md\` + \`TWC-FORM-A/B-*.md\`\n`;
md += `- RWJF Global Ideas → \`docs/grants/RWJF-*\`\n`;
md += `- Spencer Foundation → \`docs/grants/Spencer-*\`\n`;
md += `- Trade Sims funder strategy → \`docs/grants/trade-sims-*\`\n`;
md += `- Foster Youth track → \`docs/grants/Foster-Youth-*\` + \`docs/foster-youth-build-log.md\`\n`;
md += `- Capabilities baseline (read before drafting anything new) → \`docs/grants/tcaf-capabilities-inventory-2026-05-17.md\`\n`;

writeFileSync(`docs/grants/MASTER-GRANTS-TRACKER-${today}.md`, md);
console.log(`Wrote docs/grants/MASTER-GRANTS-TRACKER-${today}.md (${(md.length / 1024).toFixed(1)} KB)`);
