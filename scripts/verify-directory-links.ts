// Checks that external directory URLs in reentry-program.tsx are reachable.
// Run manually: npx tsx scripts/verify-directory-links.ts
// Also runs as part of the community-brief-e2e validation gate.

import { readFileSync } from "fs";

const FILE = "client/src/pages/reentry-program.tsx";
const TIMEOUT_MS = 10000;

const text = readFileSync(FILE, "utf-8");

// Extract href values from DirectoryRow components
const hrefPattern = /href="(https?:\/\/[^"]+)"/g;
const urls = [...new Set([...text.matchAll(hrefPattern)].map(m => m[1]))];

if (urls.length === 0) {
  console.error(`No directory URLs found in ${FILE}`);
  process.exit(1);
}

console.log(`Checking ${urls.length} directory URLs from ${FILE}...\n`);

type Result = { url: string; status: number | null; ok: boolean; note: string };

async function headOrGet(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "TCAF-link-checker/1.0" },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url: string): Promise<Result> {
  try {
    let res = await headOrGet(url, "HEAD");
    // Some servers reject HEAD — retry with GET to confirm liveness
    if (res.status === 405) {
      res = await headOrGet(url, "GET");
    }
    const ok = res.status >= 200 && res.status < 400;
    return { url, status: res.status, ok, note: ok ? "OK" : `HTTP ${res.status}` };
  } catch (e: any) {
    if (e.name === "AbortError") {
      // Timeout means the URL did not respond within the budget — treat as dead.
      return { url, status: null, ok: false, note: `TIMEOUT (>${TIMEOUT_MS / 1000}s)` };
    }
    if (e.message?.includes("ECONNREFUSED") || e.message?.includes("ENOTFOUND")) {
      return { url, status: null, ok: false, note: `UNREACHABLE: ${e.message}` };
    }
    return { url, status: null, ok: false, note: `ERROR: ${e.message}` };
  }
}

const results: Result[] = [];
for (const url of urls) {
  results.push(await checkUrl(url));
}

const dead = results.filter(r => !r.ok);

for (const r of results) {
  const icon = r.ok ? "✓" : "✗";
  console.log(`${icon} [${r.note.padEnd(18)}] ${r.url}`);
}

console.log(`\nSummary: ${results.length} checked, ${dead.length} dead`);

if (dead.length > 0) {
  console.error("\nDead links detected — update reentry-program.tsx before shipping:");
  dead.forEach(r => console.error(`  ✗ ${r.url}  →  ${r.note}`));
  process.exit(1);
}

console.log("All directory links are reachable.");
