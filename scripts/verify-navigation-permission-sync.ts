/**
 * R2 gate — one source of access truth.
 *  1. No navigation component consults the legacy sidebar predicate; shared/route-access is the only predicate.
 *  2. The 19 restricted destinations are restricted IN THE REGISTRY (not merely in the sidebar) and are in the palette corpus.
 *  3. Every navigable path (sidebar catalog, command palette corpus, workspace tasks) resolves to a registry row,
 *     so canOpenPath's unregistered fallback never decides visibility.
 *  4. Legacy sidebar flags never claim a stricter tier than the registry (drift detector).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { RouteEntry, Access } from "../shared/route-registry.types";
import { WORKSPACE_TASKS } from "../shared/workspace-catalog";

const expectedRestrictedPaths = [
  "/grants", "/my-grants", "/grants/applications", "/rfp-fidelity", "/grant-narrative", "/loi-writer", "/grant-packages",
  "/won-proposals", "/apex-accelerators", "/ceds", "/regional-briefing", "/my-journey", "/my-household", "/my-documents",
  "/my-appointments", "/foster-youth/toolkit", "/foster-youth/wellbeing", "/foster-youth/benefits", "/fafsa-navigator",
];
/** Historically listed as "restricted" but public in App.tsx, the sidebar, and the registry (no RequireAuth, no flags). Kept in the corpus check only. */
const publicByDesign = new Set(["/ceds", "/foster-youth/toolkit", "/foster-youth/wellbeing", "/foster-youth/benefits", "/fafsa-navigator"]);
/**
 * Reconciled legacy-flag drift (R2 step 1). The legacy sidebar applies admin flags per GROUP, so items whose real floor is
 * lower inherit an over-strict flag. Each row records the registry tier and the evidence that the registry is right.
 * Any drift NOT listed here fails the gate.
 */
const reconciledLegacyDrift: Record<string, { registry: Access; evidence: string }> = {
  "/funder-dashboard": { registry: "staff", evidence: "App.tsx wraps the route in <RequireAuth staffOnly>; admin flag is the adminProgramItems group artifact" },
  "/academy/risk-monitor": { registry: "staff", evidence: "page gates on RISK_STAFF_ROLES and /api/admin/risk-* enforce a DB role check; admin flag is the adminAcademyItems group artifact" },
  "/classrooms": { registry: "authenticated", evidence: "students join classrooms by invite code; page gates on isAuthenticated only; admin flag is the adminTeachingItems group artifact" },
  "/classrooms/wizard": { registry: "authenticated", evidence: "no RequireAuth; page gates on isAuthenticated only; admin flag is the adminTeachingItems group artifact" },
  "/teacher-dashboard": { registry: "authenticated", evidence: "no RequireAuth; page gates on isAuthenticated only; admin flag is the adminTeachingItems group artifact" },
};
const rank: Record<Access, number> = { public: 0, authenticated: 1, staff: 2, admin: 3 };
const failures: string[] = [];

const registry = (JSON.parse(readFileSync("shared/route-registry.generated.json", "utf8")) as { entries: RouteEntry[] }).entries;
const byPath = new Map(registry.map((e) => [e.path, e]));
const patterns = registry.filter((e) => e.path.includes(":")).map((e) => ({
  e,
  re: new RegExp("^" + e.path.split("/").filter(Boolean).map((s) => s.startsWith(":") ? (s.endsWith("?") ? "(?:/[^/]+)?" : "/[^/]+") : "/" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("") + "/?$"),
}));
const resolve = (path: string): RouteEntry | undefined => {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return byPath.get(clean) ?? patterns.find((p) => p.re.test(clean))?.e;
};

// 1. Zero legacy-predicate consumers anywhere under client/src.
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(n) ? [p] : []; });
for (const file of walk("client/src")) {
  if (readFileSync(file, "utf8").includes("getSidebarNavigationAccess")) failures.push(`${file} still references the legacy sidebar access predicate`);
}
const sidebarSource = readFileSync("client/src/components/app-sidebar.tsx", "utf8");
const paletteSource = readFileSync("client/src/components/command-palette.tsx", "utf8");
for (const [name, source] of [["app-sidebar", sidebarSource], ["command-palette", paletteSource], ["page-frame", readFileSync("client/src/components/page-frame.tsx", "utf8")], ["tool-directory", readFileSync("client/src/pages/tool-directory.tsx", "utf8")], ["outcome-landing", readFileSync("client/src/pages/outcome-landing.tsx", "utf8")]] as const) {
  if (!source.includes('from "@shared/route-access"') || !source.includes("canOpenPath(")) failures.push(`${name} does not consume the registry access predicate (shared/route-access)`);
}
if (paletteSource.includes("AUTH_REQUIRED_PATHS") || paletteSource.includes("ADMIN_REQUIRED_PATHS")) failures.push("command palette still contains a duplicated permission path set");

// 2. Restricted destinations are restricted in the registry and present in the palette corpus.
const palettePathValues = [...paletteSource.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1].split("?")[0]);
const palettePaths = new Set(palettePathValues);
for (const path of expectedRestrictedPaths) {
  const entry = byPath.get(path);
  if (!entry) { failures.push(`${path} is missing from the route registry`); continue; }
  if (entry.access === "public" && !publicByDesign.has(path)) failures.push(`${path} is public in the route registry but is an expected restricted destination`);
  if (!palettePaths.has(path)) failures.push(`${path} is restricted but missing from the command palette corpus`);
}
if (palettePathValues.length !== palettePaths.size) failures.push("command palette contains duplicate normalized paths");

// 3. Every navigable path resolves to a registry row. 4. Legacy flags never stricter than registry.
const accessOf = (chunk: string): Access => /adminOnly:\s*true/.test(chunk) ? "admin" : /staffOnly:\s*true/.test(chunk) ? "staff" : /authOnly:\s*true/.test(chunk) ? "authenticated" : "public";
const groupFlags = new Map<string, Access>();
for (const m of sidebarSource.matchAll(/\.\.\.(\w+)\.map\(\(item\) => \(\{ \.\.\.item,([^}]*)\}\)\)/g)) groupFlags.set(m[1], accessOf(m[2]));
let sidebarCount = 0;
for (const g of sidebarSource.matchAll(/const (\w+)(?:: NavItem\[\])? = \[([\s\S]*?)\n\];/g)) {
  for (const it of g[2].matchAll(/\{\s*title:\s*"([^"]+)",\s*url:\s*"([^"]+)"([^}]*)\}/g)) {
    const url = it[2];
    if (!url.startsWith("/")) continue;
    sidebarCount++;
    const entry = resolve(url);
    if (!entry) { failures.push(`sidebar item ${url} does not resolve to a registry row`); continue; }
    const own = accessOf(it[3]), grp = groupFlags.get(g[1]) ?? "public";
    const legacy = rank[grp] > rank[own] ? grp : own;
    if (rank[legacy] > rank[entry.access]) {
      const reconciled = reconciledLegacyDrift[url];
      if (!reconciled || reconciled.registry !== entry.access) failures.push(`sidebar flag drift: ${url} legacy=${legacy} registry=${entry.access} (registry is the truth; fix the flag, the lane, or record evidence in reconciledLegacyDrift)`);
    }
  }
}
for (const path of palettePaths) if (!resolve(path)) failures.push(`command palette path ${path} does not resolve to a registry row`);
for (const task of WORKSPACE_TASKS) {
  const entry = resolve(task.href);
  if (!entry) { failures.push(`workspace task ${task.href} does not resolve to a registry row`); continue; }
  if (rank[task.access as Access] > rank[entry.access]) failures.push(`workspace task ${task.href} access=${task.access} is stricter than registry ${entry.access}`);
}

if (failures.length > 0) {
  console.error(failures.map((f) => `✗ ${f}`).join("\n"));
  process.exit(1);
}
console.log(`PASS navigation permission sync: ${expectedRestrictedPaths.length} restricted destinations checked (${expectedRestrictedPaths.length - publicByDesign.size} registry-restricted, ${publicByDesign.size} public by design); ${sidebarCount} sidebar items, ${palettePaths.size} palette paths, ${WORKSPACE_TASKS.length} workspace tasks all registry-resolved; zero legacy predicate consumers`);
