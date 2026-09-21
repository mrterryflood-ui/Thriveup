/**
 * verify-public-route-auth-guards.ts
 *
 * Guards the regression class found 2026-09-21: a PUBLIC route (not wrapped in
 * RequireAuth) whose page fires an auth-gated API query unguarded turns an
 * expected anonymous 401 into a broken page for signed-out visitors.
 *
 * Check: for every literal route in client/src/App.tsx that is NOT wrapped in
 * RequireAuth, resolve its page component file and flag any useQuery whose
 * queryKey targets a known auth-gated endpoint unless the query has an
 * `enabled` guard.
 *
 * AUTH_GATED_PREFIXES is intentionally explicit. Add an entry when a new
 * server endpoint gains requireAuth/requireAdmin AND is reachable from a
 * public page.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "client/src/App.tsx");

/** Server-confirmed auth-gated endpoint prefixes (requireAuth / requireAdmin). */
const AUTH_GATED_PREFIXES = [
  "/api/dashboard",
  "/api/onboarding/journeys",
  "/api/academy/portfolio",
  "/api/academy/wallet",
  "/api/academy/campus",
  "/api/academy/marketplace/my-listings",
  "/api/academy/marketplace/trades",
  "/api/academy/transactions",
  "/api/academy/merch/orders",
  "/api/standards/certifications",
  "/api/standards/rnr",
  "/api/advisory-board/",
  "/api/dosage/",
  "/api/pilot/dashboard",
  "/api/ecosystem/peer-review/",
  "/api/foster-youth/cohort-analytics",
];

const appSrc = readFileSync(APP, "utf8");

// component name -> file path, from lazy(() => import("@/pages/...")) or static imports
const importMap = new Map<string, string>();
for (const m of appSrc.matchAll(/const (\w+) = lazy\(\(\) => import\("(@\/pages\/[^"]+)"/g)) {
  importMap.set(m[1], m[2]);
}
for (const m of appSrc.matchAll(/import (\w+) from "(@\/pages\/[^"]+)"/g)) {
  importMap.set(m[1], m[2]);
}

// Route blocks: capture path + everything up to `/>` or `</Route>` to detect RequireAuth wrapping
const routes: { path: string; gated: boolean; component: string | null }[] = [];
const routeRe = /<Route\s+path="([^"]+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/Route>)/g;
for (const m of appSrc.matchAll(routeRe)) {
  const [, routePath, attrs, children] = m;
  if (routePath.includes(":")) continue; // parameterized: page-level guards apply
  const block = `${attrs ?? ""}${children ?? ""}`;
  const gated = /RequireAuth|TradeSimsTrialGate|Redirect/.test(block);
  const compMatch = block.match(/component=\{(\w+)\}/) ?? block.match(/<(\w+)[\s/>]/);
  routes.push({ path: routePath, gated, component: compMatch?.[1] ?? null });
}

let failures = 0;
let checked = 0;
for (const route of routes) {
  if (route.gated || !route.component) continue;
  const importPath = importMap.get(route.component);
  if (!importPath) continue;
  const rel = importPath.replace("@/", "client/src/");
  const candidates = [rel + ".tsx", rel + ".ts", rel + "/index.tsx"];
  const file = candidates.map((c) => path.join(ROOT, c)).find((p) => existsSync(p));
  if (!file) continue;
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes("queryKey:")) continue;
    // invalidateQueries in mutations do not fetch — only flag actual reads
    const context = lines.slice(Math.max(0, i - 2), i + 1).join("\n");
    if (/invalidateQueries|setQueryData|getQueryData|removeQueries/.test(context)) continue;
    const hit = AUTH_GATED_PREFIXES.find((p) => lines[i].includes(`"${p}`));
    if (!hit) continue;
    // look for an enabled guard within the same useQuery call (next few lines)
    const window_ = lines.slice(i, i + 8).join("\n");
    if (/\benabled\s*:/.test(window_)) continue;
    checked++;
    failures++;
    console.error(
      `FAIL ${route.path} (${path.basename(file)}:${i + 1}): unguarded auth-gated query "${hit}" on a public route. Add enabled: isAuthenticated or wrap the route in RequireAuth.`
    );
  }
}

if (failures > 0) {
  console.error(`verify-public-route-auth-guards: FAIL - ${failures} unguarded auth-gated querie(s) on public routes`);
  process.exit(1);
}
console.log(`verify-public-route-auth-guards: PASS - ${routes.length} literal routes inspected, no unguarded auth-gated queries on public routes`);
