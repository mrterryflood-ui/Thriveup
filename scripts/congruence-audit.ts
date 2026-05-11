/**
 * Congruence Audit — proves audio = video.
 *
 * Reads docs/grants/CONGRUENCE-MANIFEST.json. For each claim, asserts that:
 *   1. The internal page URL responds 200 in the running app
 *   2. The page HTML contains every required data-testid (or, for SPAs, the source file
 *      contains the test IDs — fall-back when SSR is not available)
 *   3. External URLs respond 200 and contain expected keywords
 *
 * Writes a markdown report to .agents/congruence/last-run.md and exits non-zero
 * if any required claim cannot be verified.
 *
 * Usage:
 *   npx tsx scripts/congruence-audit.ts                    (assumes server on :5000)
 *   APP_URL=http://localhost:5000 npx tsx scripts/congruence-audit.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

interface Claim {
  id: string;
  claim: string;
  url: string;
  testIds: string[];
  evidenceUrl?: string;
}

interface ExternalCheck {
  id: string;
  url: string;
  expectStatus: number;
  expectKeywords: string[];
}

interface Manifest {
  version: number;
  lastUpdated: string;
  audience: string;
  claims: Claim[];
  externalUrls: ExternalCheck[];
}

interface Result {
  id: string;
  claim?: string;
  url: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

const APP_URL = process.env.APP_URL || "http://localhost:5000";
const MANIFEST_PATH = path.resolve("docs/grants/CONGRUENCE-MANIFEST.json");
const REPORT_PATH = path.resolve(".agents/congruence/last-run.md");

async function fetchText(url: string, timeoutMs = 10000): Promise<{ status: number; text: string; error?: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const text = await res.text();
    return { status: res.status, text };
  } catch (e: any) {
    return { status: 0, text: "", error: e?.message || String(e) };
  } finally {
    clearTimeout(t);
  }
}

function loadEvidenceFile(rel?: string): string | null {
  if (!rel) return null;
  if (rel.startsWith("http")) return null;
  // Take only the first comma-separated path
  const file = rel.split(/[;,]/)[0].trim();
  const abs = path.resolve(file);
  try {
    if (fs.existsSync(abs)) return fs.readFileSync(abs, "utf8");
  } catch {}
  return null;
}

async function auditClaim(claim: Claim): Promise<Result[]> {
  const results: Result[] = [];

  // Skip URL check for absolute URLs (handled in external section).
  // KEEP the query string — query-conditioned routes (e.g. /fafsa-navigator?audience=foster) must be probed AS WRITTEN
  // so the audit reflects the same URL the briefing tells the funder to click.
  const isInternal = !claim.url.startsWith("http");

  if (isInternal) {
    const fullUrl = `${APP_URL}${claim.url}`;
    const r = await fetchText(fullUrl);
    if (r.error || r.status === 0) {
      results.push({ id: claim.id, claim: claim.claim, url: fullUrl, status: "FAIL", detail: `Network error: ${r.error || "no response"}` });
    } else if (r.status >= 400) {
      results.push({ id: claim.id, claim: claim.claim, url: fullUrl, status: "FAIL", detail: `HTTP ${r.status}` });
    } else {
      results.push({ id: claim.id, claim: claim.claim, url: fullUrl, status: "PASS", detail: `HTTP ${r.status}` });
    }
  }

  // Test ID assertion: SCOPED to the claim's evidence file(s) only.
  // `evidenceUrl` is the canonical source-of-truth for this claim. Optional `evidenceFiles[]` can list
  // additional files (e.g. a shared component used by a page). We DO NOT scan the rest of the tree —
  // that produces false positives where one page's testid "proves" another page's claim.
  const evidenceFiles: string[] = [
    claim.evidenceUrl,
    ...((claim as any).evidenceFiles ?? []),
  ].filter((p) => typeof p === "string" && p && !p.startsWith("http") && !p.includes(" "));

  const fileTexts: { path: string; text: string }[] = [];
  for (const f of evidenceFiles) {
    const t = loadEvidenceFile(f);
    if (t) fileTexts.push({ path: f, text: t });
  }

  for (const tid of claim.testIds) {
    let found = false;
    let where = "";

    // Decompose for template-literal matching: data-testid={`PREFIX-${var}`} + suffix "VAL" → "PREFIX-VAL".
    const segs = tid.split("-");
    const prefixCandidates: { prefix: string; suffix: string }[] = [];
    for (let i = segs.length - 1; i >= 1; i--) {
      prefixCandidates.push({ prefix: segs.slice(0, i).join("-") + "-", suffix: segs.slice(i).join("-") });
    }

    for (const { path: p, text: t } of fileTexts) {
      // 1) Literal match wins immediately.
      if (t.includes(`"${tid}"`)) {
        found = true;
        where = `source: ${p}`;
        break;
      }
      // 2) Template-literal match: prefix in a data-testid template + suffix as a string literal in the same file.
      let hit = false;
      for (const { prefix, suffix } of prefixCandidates) {
        if (t.includes(`data-testid={\`${prefix}`)) {
          if (t.includes(`"${suffix}"`) || t.includes(`'${suffix}'`)) {
            found = true;
            hit = true;
            where = `template: ${p} \`${prefix}\${...}\` + suffix "${suffix}"`;
            break;
          }
        }
      }
      if (hit) break;
    }

    results.push({
      id: `${claim.id}/${tid}`,
      claim: claim.claim,
      url: claim.url,
      status: found ? "PASS" : "FAIL",
      detail: found ? `test-id present (${where})` : `test-id "${tid}" NOT FOUND in any source file`,
    });
  }

  return results;
}

async function auditExternal(ext: ExternalCheck): Promise<Result> {
  const r = await fetchText(ext.url, 15000);
  if (r.error || r.status === 0) {
    return { id: ext.id, url: ext.url, status: "FAIL", detail: `Network error: ${r.error || "no response"}` };
  }
  if (r.status !== ext.expectStatus) {
    return { id: ext.id, url: ext.url, status: "FAIL", detail: `Expected HTTP ${ext.expectStatus}, got ${r.status}` };
  }
  const missingKw = ext.expectKeywords.filter((kw) => !r.text.toLowerCase().includes(kw.toLowerCase()));
  if (missingKw.length > 0) {
    // Honest enforcement: if the manifest declared an expected keyword and the live page doesn't have it,
    // the briefing might point at the wrong page. Treat as FAIL, not WARN.
    return { id: ext.id, url: ext.url, status: "FAIL", detail: `HTTP ${r.status} OK, but missing required keywords: ${missingKw.join(", ")}` };
  }
  return { id: ext.id, url: ext.url, status: "PASS", detail: `HTTP ${r.status}, keywords present` };
}

function renderReport(manifest: Manifest, allResults: Result[], externalResults: Result[]): string {
  const total = allResults.length + externalResults.length;
  const passes = [...allResults, ...externalResults].filter((r) => r.status === "PASS").length;
  const fails = [...allResults, ...externalResults].filter((r) => r.status === "FAIL").length;
  const warns = [...allResults, ...externalResults].filter((r) => r.status === "WARN").length;

  const lines: string[] = [];
  lines.push(`# Congruence Audit Report`);
  lines.push(`**Run at:** ${new Date().toISOString()}`);
  lines.push(`**Manifest version:** ${manifest.version} (last updated ${manifest.lastUpdated})`);
  lines.push(`**Audience:** ${manifest.audience}`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(`- **PASS:** ${passes} / ${total}`);
  lines.push(`- **WARN:** ${warns}`);
  lines.push(`- **FAIL:** ${fails}`);
  lines.push(`- **Verdict:** ${fails === 0 ? "✅ CONGRUENT" : "❌ RESIDUAL GAPS — DO NOT BRIEF"}`);
  lines.push(``);

  if (fails > 0) {
    lines.push(`## ❌ Failures (must fix before briefing)`);
    for (const r of [...allResults, ...externalResults].filter((x) => x.status === "FAIL")) {
      lines.push(`- **${r.id}** — ${r.claim ?? ""}`);
      lines.push(`  - URL: \`${r.url}\``);
      lines.push(`  - ${r.detail}`);
    }
    lines.push(``);
  }

  if (warns > 0) {
    lines.push(`## ⚠️ Warnings (review)`);
    for (const r of [...allResults, ...externalResults].filter((x) => x.status === "WARN")) {
      lines.push(`- **${r.id}** — ${r.claim ?? ""}`);
      lines.push(`  - URL: \`${r.url}\``);
      lines.push(`  - ${r.detail}`);
    }
    lines.push(``);
  }

  lines.push(`## All claims by ID`);
  const byClaim: Record<string, Result[]> = {};
  for (const r of allResults) {
    const cid = r.id.split("/")[0];
    if (!byClaim[cid]) byClaim[cid] = [];
    byClaim[cid].push(r);
  }
  for (const claim of manifest.claims) {
    const rs = byClaim[claim.id] || [];
    const ok = rs.every((x) => x.status === "PASS");
    lines.push(`### ${ok ? "✅" : "❌"} ${claim.id} — ${claim.claim}`);
    lines.push(`URL: \`${claim.url}\``);
    for (const r of rs) {
      const icon = r.status === "PASS" ? "✓" : r.status === "WARN" ? "⚠" : "✗";
      lines.push(`- ${icon} ${r.id.split("/")[1] || "url"} — ${r.detail}`);
    }
    lines.push(``);
  }

  lines.push(`## External URLs`);
  for (const r of externalResults) {
    const icon = r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️" : "❌";
    lines.push(`- ${icon} **${r.id}** \`${r.url}\` — ${r.detail}`);
  }
  lines.push(``);
  lines.push(`---`);
  lines.push(`Generated by \`scripts/congruence-audit.ts\`. Iron rule: AI assistance with no conjecture or assumptions.`);

  return lines.join("\n");
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Manifest not found at ${MANIFEST_PATH}`);
    process.exit(2);
  }
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

  const allResults: Result[] = [];
  for (const claim of manifest.claims) {
    const rs = await auditClaim(claim);
    allResults.push(...rs);
  }

  const externalResults: Result[] = [];
  for (const ext of manifest.externalUrls) {
    externalResults.push(await auditExternal(ext));
  }

  const report = renderReport(manifest, allResults, externalResults);
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, "utf8");

  const fails = [...allResults, ...externalResults].filter((r) => r.status === "FAIL").length;
  const warns = [...allResults, ...externalResults].filter((r) => r.status === "WARN").length;
  console.log(`\nCongruence audit complete.`);
  console.log(`PASS: ${[...allResults, ...externalResults].filter((r) => r.status === "PASS").length}`);
  console.log(`WARN: ${warns}`);
  console.log(`FAIL: ${fails}`);
  console.log(`Report: ${path.relative(process.cwd(), REPORT_PATH)}`);

  if (fails > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
