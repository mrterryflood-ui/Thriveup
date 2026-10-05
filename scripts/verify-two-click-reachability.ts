// Two-click reachability check for major public tools.
//
// Task-282 guarantee: every major public tool must be reachable within TWO
// clicks of the homepage. This is a static BFS over the client link graph:
//
//   depth 0 (homepage surface): focused home + focused sidebar/mobile tabs
//            (all rendered on "/" for a first-time visitor)
//   depth 1: every page those surfaces link to
//   depth 2: every page depth-1 pages link to
//
// Route → page-file mapping is parsed from App.tsx lazy imports, so the check
// tracks the real router. Links are extracted from string literals of the
// form "/path" appearing in href=… / url: … / Link href=… positions.
//
// Run manually: npx tsx scripts/verify-two-click-reachability.ts
// Chained into the `directory-links` validation gate.

import { NAV_ROUTES } from "../shared/route-nav";
import { readFileSync, existsSync } from "fs";
import { WORKSPACE_TASKS, WORKSPACES } from "../shared/workspace-catalog";

const APP = "client/src/App.tsx";
const PAGES_PREFIX = "client/src/pages/";

// Major public tools that must stay within two clicks of "/".
const REQUIRED: Array<{ name: string; route: string }> = [
  { name: "Benefits Screener", route: "/benefits-screener" },
  { name: "Guided benefits application (how-to-apply)", route: "/benefits/how-to-apply/:program" },
  { name: "Benefits Command Center", route: "/benefits" },
  { name: "Resource Finder (nationwide)", route: "/resources" },
  { name: "Get Help Now", route: "/get-help" },
  { name: "Community Resource Directory", route: "/resource-directory" },
  { name: "AI Navigator", route: "/navigator" },
  { name: "Health & Wellness Hub", route: "/health-wellness" },
  { name: "Learning / Curriculum", route: "/curriculum" },
  { name: "Youth Voice", route: "/youth-voice" },
  { name: "Foster Youth Hub", route: "/foster-youth" },
  { name: "Safe Passage (Reentry)", route: "/safe-passage" },
];

// ─── 1. Route table from App.tsx ────────────────────────────────────────────
const appSrc = readFileSync(APP, "utf8");

// lazy import map: const XPage = lazy(() => import("@/pages/foo"))
const importFile = new Map<string, string>(); // component name -> file path
for (const m of appSrc.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("@\/pages\/([^"]+)"\)/g)) {
  importFile.set(m[1], m[2]);
}
// plain imports of pages (e.g. LandingPage)
for (const m of appSrc.matchAll(/import\s+(\w+)\s+from\s+"@\/pages\/([^"]+)"/g)) {
  importFile.set(m[1], m[2]);
}

function resolvePageFile(rel: string): string | null {
  for (const cand of [
    `${PAGES_PREFIX}${rel}.tsx`,
    `${PAGES_PREFIX}${rel}.ts`,
    `${PAGES_PREFIX}${rel}/index.tsx`,
    `${PAGES_PREFIX}${rel}`,
  ]) {
    if (existsSync(cand)) return cand;
  }
  return null;
}

// route path -> component name (both `component={X}` and children `<X …/>` forms)
type RouteEntry = { path: string; file: string | null; rx: RegExp };
const routes: RouteEntry[] = [];
const routeBlockRe = /<Route\s+path="([^"]+)"(?:\s+component=\{(\w+)\}\s*\/>|\s*>([\s\S]*?)<\/Route>)/g;
for (const m of appSrc.matchAll(routeBlockRe)) {
  const path = m[1];
  let comp = m[2];
  if (!comp && m[3]) {
    // First capitalized JSX tag inside the block that maps to a page import.
    for (const t of m[3].matchAll(/<(\w+)/g)) {
      if (importFile.has(t[1])) { comp = t[1]; break; }
    }
  }
  const rel = comp ? importFile.get(comp) : undefined;
  const file = rel ? resolvePageFile(rel) : null;
  const pattern = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\?:[^/]+\??/g, "[^/]+");
  routes.push({ path, file, rx: new RegExp(`^${pattern}$`) });
}

function routeFor(url: string): RouteEntry | null {
  const clean = url.split("?")[0].split("#")[0];
  // Longest-literal-match first (mirror wouter's ordering loosely: exact first)
  const exact = routes.find((r) => r.path === clean);
  if (exact) return exact;
  return routes.find((r) => r.rx.test(clean)) || null;
}

// ─── 2. Link extraction ─────────────────────────────────────────────────────
const SIDEBAR_FILE = "client/src/components/app-sidebar.tsx";

function linksFromText(text: string): string[] {
  const out = new Set<string>();
  // href="/x", href={"/x"}, href={`/x`}, url: "/x", to="/x"
  for (const m of text.matchAll(/(?:href|to|url)\s*[:=]\s*\{?\s*["'`](\/[^"'`\s]*)["'`]/g)) {
    const u = m[1];
    if (u.startsWith("/api/")) continue;
    if (u === "/") continue;
    out.add(u.split("?")[0].split("#")[0]);
  }
  return [...out];
}

// The sidebar filters items by auth/role at render time (filterAuth). A
// signed-out first-time visitor never sees authOnly/adminOnly items, so for
// the public click graph we must drop any NavItem line carrying those flags.
function publicSidebarText(text: string): string {
  let restrictedGroup = false;
  return text.split("\n").filter(line => {
    const group = line.match(/^const\s+(\w+)\s*:\s*NavItem\[\]\s*=\s*\[/)?.[1];
    if (group) restrictedGroup = /^(?:myOrg|admin)/.test(group);
    if (/^\];/.test(line)) { const skip = restrictedGroup; restrictedGroup = false; return !skip; }
    return !restrictedGroup && !/\b(authOnly|adminOnly|staffOnly)\s*:\s*true/.test(line);
  }).join("\n");
}

// Pages compose link strips from shared components (e.g. RelatedTools,
// DFCCrossNav). Follow one level of local @/components imports so those
// cross-links count as clicks on the page that renders them.
function componentImports(text: string): string[] {
  const files: string[] = [];
  for (const m of text.matchAll(/import\s+[^;]*from\s+"@\/components\/([^"]+)"/g)) {
    const rel = m[1];
    if (rel.startsWith("ui/")) continue; // primitive UI kit, no route links
    for (const cand of [
      `client/src/components/${rel}.tsx`,
      `client/src/components/${rel}.ts`,
      `client/src/components/${rel}/index.tsx`,
    ]) {
      if (existsSync(cand)) { files.push(cand); break; }
    }
  }
  return files;
}

function extractInternalLinks(file: string): string[] {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  if (file === SIDEBAR_FILE) text = publicSidebarText(text);
  const out = new Set<string>(linksFromText(text));
  // These surfaces render typed catalogs, not literal href strings. Model only
  // links visible to a signed-out visitor, and only on the surface using them.
  if (file === "client/src/pages/focused-home.tsx") {
    for (const task of WORKSPACE_TASKS.filter(task => task.primary && task.access === "public")) out.add(task.href);
    for (const workspace of WORKSPACES) out.add(`/workspace/${workspace.id}`);
  }
  if (file === "client/src/pages/tool-directory.tsx") {
    // Phase 3c: /tools renders every public canonical registry row (shared/route-nav.generated.json).
    for (const r of NAV_ROUTES) if (r.access === "public") out.add(r.path);
    for (const task of WORKSPACE_TASKS.filter(task => task.access === "public")) out.add(task.href);
    for (const url of linksFromText(publicSidebarText(readFileSync(SIDEBAR_FILE, "utf8")))) out.add(url);
  }
  for (const compFile of componentImports(text)) {
    let compText: string;
    try {
      compText = readFileSync(compFile, "utf8");
    } catch {
      continue;
    }
    // A registry import is not a rendered sidebar on the current surface.
    if (compFile === SIDEBAR_FILE) continue;
    for (const u of linksFromText(compText)) out.add(u);
  }
  return [...out];
}

// ─── 3. BFS from the homepage surface ───────────────────────────────────────
const DEPTH0_FILES = [
  "client/src/pages/focused-home.tsx",
  "client/src/components/focused-navigation.tsx",
];

const reachedAtDepth = new Map<string, number>(); // route path -> depth
let frontierFiles = [...DEPTH0_FILES];
const visitedFiles = new Set(frontierFiles);

for (let depth = 1; depth <= 2; depth++) {
  const nextFiles: string[] = [];
  for (const file of frontierFiles) {
    for (const url of extractInternalLinks(file)) {
      const r = routeFor(url);
      if (!r) continue;
      if (!reachedAtDepth.has(r.path)) {
        reachedAtDepth.set(r.path, depth);
        if (r.file && !visitedFiles.has(r.file)) {
          visitedFiles.add(r.file);
          nextFiles.push(r.file);
        }
      }
    }
  }
  frontierFiles = nextFiles;
}

// ─── 4. Assert required tools ───────────────────────────────────────────────
let failures = 0;
for (const req of REQUIRED) {
  const depth = reachedAtDepth.get(req.route);
  if (depth === undefined) {
    failures++;
    console.error(`FAIL: ${req.name} (${req.route}) is NOT reachable within 2 clicks of the homepage.`);
  } else {
    console.log(`OK  : ${req.name} (${req.route}) reachable at click depth ${depth}.`);
  }
}

console.log(`\n${reachedAtDepth.size} routes reachable within 2 clicks of the homepage surface.`);
if (failures > 0) {
  console.error(`\n${failures} required tool(s) failed the two-click reachability check.`);
    console.error(`Fix: link the tool from the focused home, focused navigation, or full tools catalog.`);
  process.exit(1);
}
console.log("Two-click reachability gate passed.");
