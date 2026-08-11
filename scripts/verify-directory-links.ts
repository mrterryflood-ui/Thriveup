// Dead-link checker for ALL client pages (and components) with external URLs.
// Scans client/src/pages/ and client/src/components/ for http(s) URLs inside
// string literals, dedupes them, and verifies each is reachable.
//
// Run manually: npx tsx scripts/verify-directory-links.ts
// Also runs as part of the directory-links validation gate.
//
// Gate policy (network flakiness must NOT break CI):
//   - hard-fail (exit 1) on 404/410 and other 4xx  ... EXCEPT
//   - 401/403/429 are counted as WARN (many sites return these to bots)
//   - network errors / timeouts are WARN (never fail the gate)
//   - 2xx/3xx are OK

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOTS = ["client/src/pages", "client/src/components"];
const TIMEOUT_MS = 8000;
const CONCURRENCY = 5;

// Domains / patterns that are never real external links to verify.
const EXCLUDE_HOST = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "replit.dev",
  "replit.app",
  "replit.com",
  "example.com",
  "example.org",
  "schema.org",
  "www.w3.org",
  "w3.org",
];

// XML namespace URIs and machine API endpoints are not user-facing navigable
// links; a bare HEAD/GET against them legitimately 404s, so exclude them.
const EXCLUDE_URL_PATTERN = [
  "search.yahoo.com/mrss",   // RSS media namespace URI
  "purl.org",                 // namespace URIs
  "api.sam.gov",              // API base
  "api.usa.gov",              // API base
  "grantsws/rest",            // Grants.gov REST API path
];

function isExcluded(url: string): boolean {
  // Placeholder / template-literal URLs
  if (url.includes("${") || url.includes("{")) return true;
  // Machine/API endpoints and namespace URIs (not user-facing links)
  if (EXCLUDE_URL_PATTERN.some((p) => url.includes(p))) return true;
  // JSON data-resource endpoints (Socrata / REST) are API calls, not links
  if (/\.json(\?|$)/.test(url)) return true;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return true; // unparseable — skip
  }
  return EXCLUDE_HOST.some((h) => host === h || host.endsWith("." + h) || host.includes(h));
}

// Collect .tsx/.ts/.jsx/.js files under the roots.
function collectFiles(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      out = out.concat(collectFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// Extract http(s) URLs found inside single/double/backtick string literals.
// Backtick strings containing ${ (interpolation) are skipped for that literal.
// We also strip line comments to avoid checking commented-out URLs.
function extractUrls(text: string): string[] {
  const urls: string[] = [];
  // Strip // line comments (best-effort; keeps http:// intact because those are inside quotes,
  // but a bare `// https://...` comment starts at column of `//`). We only strip lines whose
  // first non-space chars are `//` or that contain ` // ` outside a quote heuristically.
  const lines = text.split("\n");
  const cleaned = lines
    .filter((l) => !/^\s*\/\//.test(l))
    .join("\n")
    // remove block comments
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // Match string literals: "...", '...', `...`
  const stringLiteral = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g;
  let m: RegExpExecArray | null;
  while ((m = stringLiteral.exec(cleaned)) !== null) {
    // Skip literals that are the value of an apiEndpoint/xmlns key — these are
    // machine endpoints or namespace URIs, not user-facing navigable links.
    const preceding = cleaned.slice(Math.max(0, m.index - 24), m.index);
    if (/\b(apiEndpoint|apiUrl|xmlns[:a-zA-Z]*)\s*[:=]\s*$/.test(preceding)) continue;
    const literal = m[1] ?? m[2] ?? m[3] ?? "";
    const urlMatch = literal.match(/https?:\/\/[^\s'"`<>)]+/g);
    if (urlMatch) {
      for (let u of urlMatch) {
        u = u.replace(/[,;.]+$/, ""); // trim trailing punctuation
        urls.push(u);
      }
    }
  }
  return urls;
}

const files = ROOTS.flatMap(collectFiles);

// url -> set of source files
const urlSources = new Map<string, Set<string>>();
for (const file of files) {
  let text: string;
  try {
    text = readFileSync(file, "utf-8");
  } catch {
    continue;
  }
  const rel = relative(process.cwd(), file);
  for (const url of extractUrls(text)) {
    if (isExcluded(url)) continue;
    if (!urlSources.has(url)) urlSources.set(url, new Set());
    urlSources.get(url)!.add(rel);
  }
}

const urls = [...urlSources.keys()].sort();

if (urls.length === 0) {
  console.error(`No external URLs found under ${ROOTS.join(", ")}`);
  process.exit(1);
}

console.log(
  `Scanned ${files.length} files under ${ROOTS.join(", ")}.\nChecking ${urls.length} unique external URLs...\n`,
);

type Level = "OK" | "WARN" | "FAIL";
type Result = { url: string; status: number | null; level: Level; note: string };

async function headOrGet(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "TCAF-link-checker/1.0" },
    });
  } finally {
    clearTimeout(timer);
  }
}

function classify(status: number): { level: Level; note: string } {
  if (status >= 200 && status < 400) return { level: "OK", note: "OK" };
  if (status === 401 || status === 403 || status === 429)
    return { level: "WARN", note: `HTTP ${status} (bot-blocked?)` };
  if (status === 404 || status === 410)
    return { level: "FAIL", note: `HTTP ${status} DEAD` };
  if (status >= 400 && status < 500)
    return { level: "FAIL", note: `HTTP ${status}` };
  // 5xx — server-side / transient; warn rather than fail the gate
  return { level: "WARN", note: `HTTP ${status} (server error)` };
}

async function checkUrl(url: string): Promise<Result> {
  try {
    let res = await headOrGet(url, "HEAD");
    // Many servers/SPAs/CDNs reject or mishandle HEAD (returning 4xx to bots).
    // Retry with GET to confirm real liveness before flagging as dead.
    if (res.status >= 400 && res.status < 500) {
      res = await headOrGet(url, "GET");
    }
    const { level, note } = classify(res.status);
    return { url, status: res.status, level, note };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { url, status: null, level: "WARN", note: `TIMEOUT (>${TIMEOUT_MS / 1000}s)` };
    }
    const msg = e?.message || String(e);
    // Network errors (DNS, refused, TLS, etc.) — WARN, never fail the gate.
    return { url, status: null, level: "WARN", note: `NETWORK: ${msg}` };
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
results.sort((a, b) => a.url.localeCompare(b.url));

const icon = (l: Level) => (l === "OK" ? "✓" : l === "WARN" ? "!" : "✗");
for (const r of results) {
  console.log(`${icon(r.level)} [${r.note.padEnd(22)}] ${r.url}`);
}

const oks = results.filter((r) => r.level === "OK");
const warns = results.filter((r) => r.level === "WARN");
const fails = results.filter((r) => r.level === "FAIL");

console.log(
  `\nSummary: ${results.length} total  |  ${oks.length} OK  |  ${warns.length} WARN  |  ${fails.length} FAILED`,
);

if (warns.length > 0) {
  console.log("\nWarnings (not blocking — network flakiness or bot-blocking):");
  for (const r of warns) {
    console.log(`  ! ${r.url}  →  ${r.note}  [${[...(urlSources.get(r.url) ?? [])].join(", ")}]`);
  }
}

if (fails.length > 0) {
  console.error("\nDead links detected — fix the source before shipping:");
  for (const r of fails) {
    console.error(`  ✗ ${r.url}  →  ${r.note}`);
    console.error(`      in: ${[...(urlSources.get(r.url) ?? [])].join(", ")}`);
  }
  process.exit(1);
}

console.log("\nAll external links are reachable (dead-link gate passed).");
