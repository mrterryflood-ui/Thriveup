/**
 * verify-sidebar-routes.ts
 *
 * Checks that every internal URL referenced in app-sidebar.tsx is covered
 * by a <Route> registered in App.tsx.  Runs as part of the directory-links
 * validation gate so future sidebar/route drift is caught before it ships.
 *
 * Pass criteria:
 *   - Every sidebar URL (from NavItem arrays and inline Link hrefs) must
 *     match at least one route path in App.tsx, either:
 *       a) exactly, OR
 *       b) via a dynamic-segment pattern (e.g. /grants/:grantId covers /grants/abc)
 *   - Fragment anchors (#section) are stripped before matching; the base
 *     path must still be registered.
 *   - Query strings (?foo=bar) are stripped before matching.
 *   - /api/* paths are server endpoints, not client routes — skipped.
 *   - Externally-resolved paths (// …) are skipped.
 *
 * Usage:
 *   npx tsx scripts/verify-sidebar-routes.ts
 */

import { readFileSync } from "fs";

const SIDEBAR = "client/src/components/app-sidebar.tsx";
const APP     = "client/src/App.tsx";

const sidebarSrc = readFileSync(SIDEBAR, "utf-8");
const appSrc     = readFileSync(APP,     "utf-8");

// ─── 1. Collect sidebar URLs ────────────────────────────────────────────────

const sidebarUrls = new Set<string>();

// NavItem objects: url: "/path/to/page"
for (const m of sidebarSrc.matchAll(/url:\s*"([^"]+)"/g)) {
  sidebarUrls.add(normalise(m[1]));
}

// Inline Link hrefs: href="/path"
for (const m of sidebarSrc.matchAll(/href="([^"]+)"/g)) {
  const raw = m[1];
  if (!raw.startsWith("/")) continue;   // skip external / relative
  if (raw.startsWith("/api/")) continue; // server endpoints
  sidebarUrls.add(normalise(raw));
}

function normalise(url: string): string {
  // Strip query string and fragment, leaving only the path
  return url.split("?")[0].split("#")[0];
}

// ─── 2. Collect registered route paths ──────────────────────────────────────

const routePaths = new Set<string>();
for (const m of appSrc.matchAll(/path="([^"]+)"/g)) {
  routePaths.add(m[1]);
}

// ─── 3. Match sidebar URL → route ───────────────────────────────────────────

function buildDynamicRegex(route: string): RegExp {
  // Escape slashes, replace :param segments with [^/]+
  const pattern = route
    .replace(/\//g, "\\/")
    .replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${pattern}$`);
}

// Pre-compile dynamic route regexes once
const dynamicRoutes: Array<{ path: string; rx: RegExp }> = [];
for (const p of routePaths) {
  if (p.includes(":")) {
    dynamicRoutes.push({ path: p, rx: buildDynamicRegex(p) });
  }
}

function isCovered(url: string): boolean {
  if (routePaths.has(url)) return true;
  for (const { rx } of dynamicRoutes) {
    if (rx.test(url)) return true;
  }
  return false;
}

// ─── 4. Report ───────────────────────────────────────────────────────────────

const internalUrls = [...sidebarUrls]
  .filter((u) => u.startsWith("/") && !u.startsWith("//") && u !== "/api/login" && u !== "/api/logout")
  .sort();

const missing = internalUrls.filter((u) => !isCovered(u));

if (missing.length === 0) {
  console.log(`✅ verify-sidebar-routes: all ${internalUrls.length} sidebar URLs are covered by registered routes.`);
  process.exit(0);
} else {
  console.error(`\n❌ verify-sidebar-routes: ${missing.length} sidebar URL(s) have no matching <Route> in App.tsx:\n`);
  for (const url of missing) {
    console.error(`   ${url}`);
  }
  console.error(`\nFix: add a <Route path="${missing[0]}" …> in App.tsx, or remove the dead link from app-sidebar.tsx.\n`);
  process.exit(1);
}
