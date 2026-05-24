// Broken-link audit: every internal route reference in client/src vs registered
// wouter Routes in App.tsx. Catches Link href, to, setLocation, navigate,
// window.location.href, and template literals. Strips ${...} and query strings.
// Run: npx tsx scripts/broken-link-audit.ts
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    const s = statSync(f);
    if (s.isDirectory()) walk(f, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(f);
  }
  return files;
}

const APP = readFileSync("client/src/App.tsx", "utf8");
const routes = Array.from(APP.matchAll(/path="(\/[^"]*)"/g)).map(m => m[1]);
const uniqRoutes = Array.from(new Set(routes));

function routeRegex(p: string): RegExp {
  // Escape regex specials EXCEPT we'll handle wouter :param after
  let esc = p.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  // wouter ":param?" → optional segment
  esc = esc.replace(/:[A-Za-z_][A-Za-z0-9_]*\?/g, "([^/]*)");
  // wouter ":param" → required segment
  esc = esc.replace(/:[A-Za-z_][A-Za-z0-9_]*/g, "([^/]+)");
  return new RegExp("^" + esc + "$");
}
const regs = uniqRoutes.map(p => ({ p, re: routeRegex(p) }));

const REGEXES = [
  /href=["'](\/[a-zA-Z][^"'`]*)["']/g,
  /to=["'](\/[a-zA-Z][^"'`]*)["']/g,
  /href=\{`(\/[a-zA-Z][^`]*)`\}/g,
  /to=\{`(\/[a-zA-Z][^`]*)`\}/g,
  /setLocation\(["'](\/[a-zA-Z][^"']*)["']\)/g,
  /setLocation\(`(\/[a-zA-Z][^`]*)`\)/g,
  /navigate\(["'](\/[a-zA-Z][^"']*)["']\)/g,
  /navigate\(`(\/[a-zA-Z][^`]*)`\)/g,
  /window\.location\.href\s*=\s*["'](\/[a-zA-Z][^"']*)["']/g,
];

const refsByLink = new Map<string, string[]>();
for (const f of walk("client/src")) {
  const content = readFileSync(f, "utf8");
  for (const re of REGEXES) {
    for (const m of content.matchAll(re)) {
      const link = m[1];
      if (/^\/(api|assets|static|uploads|attached_assets)\b/.test(link)) continue;
      const lineNum = content.slice(0, m.index!).split("\n").length;
      if (!refsByLink.has(link)) refsByLink.set(link, []);
      refsByLink.get(link)!.push(`${f}:${lineNum}`);
    }
  }
}

function normalize(link: string): string {
  let s = link;
  for (let i = 0; i < 8; i++) {
    const next = s.replace(/\$\{[^${}]*\}/g, "X");
    if (next === s) break;
    s = next;
  }
  s = s.replace(/\$\{[^}]*\}/g, "X");
  return s.split("?")[0].split("#")[0];
}

function matchesAnyRoute(candidate: string): boolean {
  return regs.some(({ re }) => re.test(candidate));
}

const broken: Array<{ link: string; norm: string; refs: string[] }> = [];
for (const [link, refs] of refsByLink) {
  const norm = normalize(link);
  // Try full normalized first
  if (matchesAnyRoute(norm)) continue;
  // Ternary query-string pattern e.g. `/ai-tools${cond?"?q":""}` → `/ai-toolsX`
  // — strip the trailing X (no slash before it) and retry.
  const trimmed = norm.replace(/X+$/, "");
  if (trimmed && trimmed !== norm && matchesAnyRoute(trimmed)) continue;
  broken.push({ link, norm, refs });
}
broken.sort((a, b) => b.refs.length - a.refs.length);

console.log(`Registered routes: ${uniqRoutes.length}`);
console.log(`Distinct link references: ${refsByLink.size}`);
console.log(`BROKEN: ${broken.length}\n`);
for (const { link, norm, refs } of broken) {
  console.log(`${refs.length}x  ${link}${link !== norm ? `  →  ${norm}` : ""}`);
  for (const r of refs.slice(0, 4)) console.log(`     ${r}`);
}
process.exit(broken.length > 0 ? 1 : 0);
