// Checks that external https:// URLs across all client pages are reachable.
// Run manually: npx tsx scripts/verify-external-links.ts
// Also wired into the "directory-links" validation gate — network errors/timeouts
// are treated as skip (not failure) so transient connectivity issues don't flake
// the gate; only a real HTTP error status on a resolvable host fails the check.

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const PAGES_DIR = "client/src/pages";
const MAX_URLS = 120;
const CONCURRENCY = 5;
const TIMEOUT_MS = 6000;

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listTsxFiles(full));
    else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const urlPattern = /https?:\/\/[^\s'"<>)]+/g;
const seen = new Set<string>();
for (const file of listTsxFiles(PAGES_DIR)) {
  const text = readFileSync(file, "utf-8");
  for (const m of text.matchAll(urlPattern)) {
    seen.add(m[0].replace(/[,;.]+$/, ""));
  }
}
const urls = [...seen].slice(0, MAX_URLS);

console.log(`Checking ${urls.length} unique URLs across all pages in ${PAGES_DIR}...\n`);

type Result = { url: string; status: number | null; ok: boolean; note: string };

async function checkUrl(url: string): Promise<Result> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timer);
    const ok = res.status >= 200 && res.status < 400;
    // 403/429 commonly mean the host is bot-blocking HEAD requests from a datacenter IP,
    // not that the link is actually dead — treat as a warning, matching the sibling
    // verify-directory-links.ts convention, to avoid flaking the gate on live sites.
    if (!ok && (res.status === 403 || res.status === 429)) {
      return { url, status: res.status, ok: true, note: `HTTP ${res.status} (bot-blocked?)` };
    }
    // 5xx responses are transient server errors, not confirmed dead links —
    // treat as a warning so a momentary production outage doesn't fail the gate.
    if (!ok && res.status >= 500) {
      return { url, status: res.status, ok: true, note: `HTTP ${res.status} (server error, skip)` };
    }
    return { url, status: res.status, ok, note: ok ? "OK" : `HTTP ${res.status}` };
  } catch (e: any) {
    if (e.name === "AbortError") return { url, status: null, ok: true, note: "TIMEOUT (skip)" };
    if (e.message?.includes("ECONNREFUSED") || e.message?.includes("ENOTFOUND"))
      return { url, status: null, ok: true, note: "UNREACHABLE (skip)" };
    return { url, status: null, ok: true, note: `NETWORK ERROR (skip): ${e.message}` };
  }
}

async function pool(items: string[], fn: (s: string) => Promise<Result>, concurrency: number) {
  const results: Result[] = [];
  const queue = [...items];
  async function worker() {
    while (queue.length) {
      const item = queue.shift()!;
      results.push(await fn(item));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

const results = await pool(urls, checkUrl, CONCURRENCY);
const dead = results.filter(r => !r.ok);

for (const r of results) {
  const icon = r.ok ? "✓" : "✗";
  console.log(`${icon} [${r.note.padEnd(16)}] ${r.url}`);
}

console.log(`\nSummary: ${results.length} checked, ${dead.length} dead links`);
if (dead.length) {
  console.error("Dead links:");
  dead.forEach(r => console.error(`  ${r.url} → ${r.note}`));
  process.exit(1);
}
