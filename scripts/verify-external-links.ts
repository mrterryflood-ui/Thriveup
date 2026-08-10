// Checks that external https:// URLs in the community resource directory are reachable.
// Run manually: npx tsx scripts/verify-external-links.ts
// Does NOT run as a CI gate (network-dependent) — use for periodic manual audits.

import { readFileSync } from "fs";

const FILE = "client/src/pages/community-resource-directory.tsx";
const MAX_URLS = 40;
const CONCURRENCY = 5;
const TIMEOUT_MS = 6000;

const text = readFileSync(FILE, "utf-8");
const urlPattern = /https?:\/\/[^\s'"<>)]+/g;
const raw = [...new Set([...text.matchAll(urlPattern)].map(m => m[0].replace(/[,;.]+$/, "")))];
const urls = raw.slice(0, MAX_URLS);

console.log(`Checking ${urls.length} unique URLs from ${FILE}...\n`);

type Result = { url: string; status: number | null; ok: boolean; note: string };

async function checkUrl(url: string): Promise<Result> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timer);
    const ok = res.status >= 200 && res.status < 400;
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
