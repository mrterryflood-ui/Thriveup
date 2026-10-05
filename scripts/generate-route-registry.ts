/**
 * Phase 2a — generate the DRAFT route registry from the three existing
 * navigation inventories plus App.tsx. Output: shared/route-registry.generated.json
 * (machine-written; humans classify rows in later lanes; Phase 3 collapses the
 * three readers into the registry — the end state is one source, not four).
 *
 *   npx tsx scripts/generate-route-registry.ts          # writes the draft
 *   npx tsx scripts/verify-route-registry.ts            # G1 completeness gate
 */
import { readFileSync, writeFileSync } from "node:fs";
import { WORKSPACE_TASKS } from "../shared/workspace-catalog";
import type { Outcome, Audience, Access, RegistrySource, RouteEntry } from "../shared/route-registry.types";
import { ROUTE_CLASSIFICATIONS } from "../shared/route-registry.classified";

const read = (p: string) => readFileSync(p, "utf8");
const app = read("client/src/App.tsx");
const sidebar = read("client/src/components/app-sidebar.tsx");
const palette = read("client/src/components/command-palette.tsx");

// 1. Every route path declared in App.tsx (static and param routes).
const routePaths = new Set<string>();
for (const m of app.matchAll(/<Route\s+path="([^"]+)"/g)) routePaths.add(m[1]);

// 2. Legacy sidebar: group variable name → items (title, url, access flags).
interface Inv { url: string; title: string; group: string; access: Access; source: RegistrySource }
const inv: Inv[] = [];
const accessOf = (chunk: string): Access => /adminOnly:\s*true/.test(chunk) ? "admin" : /staffOnly:\s*true/.test(chunk) ? "staff" : /authOnly:\s*true/.test(chunk) ? "authenticated" : "public";
// Group-level flags are applied where SIDEBAR_NAV_ITEMS spreads the group (e.g. adminOnly on admin groups).
const groupFlags = new Map<string, Access>();
for (const m of sidebar.matchAll(/\.\.\.(\w+)\.map\(\(item\) => \(\{ \.\.\.item,([^}]*)\}\)\)/g)) groupFlags.set(m[1], accessOf(m[2]));
for (const g of sidebar.matchAll(/const (\w+)(?:: NavItem\[\])? = \[([\s\S]*?)\n\];/g)) {
  const rank: Access[] = ["public", "authenticated", "staff", "admin"];
  for (const it of g[2].matchAll(/\{\s*title:\s*"([^"]+)",\s*url:\s*"([^"]+)"([^}]*)\}/g)) {
    const own = accessOf(it[3]), grp = groupFlags.get(g[1]) ?? "public";
    inv.push({ title: it[1], url: it[2], group: g[1], access: rank.indexOf(grp) > rank.indexOf(own) ? grp : own, source: "legacy-sidebar" });
  }
}
// App.tsx RequireAuth wrappers are the client-side authority for route access.
const routeAccess = new Map<string, Access>();
for (const m of app.matchAll(/<RequireAuth([^>]*)>([\s\S]*?)<\/RequireAuth>/g)) {
  const a: Access = /adminOnly/.test(m[1]) ? "admin" : /staffOnly/.test(m[1]) ? "staff" : "authenticated";
  for (const r of m[2].matchAll(/<Route\s+path="([^"]+)"/g)) routeAccess.set(r[1], a);
}
// 3. Command palette ALL_ITEMS.
const pal = palette.match(/export const ALL_ITEMS[^=]*=\s*\[([\s\S]*?)\n\];/);
if (pal) for (const it of pal[1].matchAll(/\{[^}]*?(?:label|title):\s*"([^"]+)"[^}]*?(?:href|url|path):\s*"([^"]+)"([^}]*)\}/g)) inv.push({ title: it[1], url: it[2], group: "command-palette", access: accessOf(it[3]), source: "command-palette" });
// 4. Focused workspace tasks.
for (const t of WORKSPACE_TASKS) inv.push({ title: t.label, url: t.href, group: `workspace:${t.workspace}`, access: t.access, source: "workspace-catalog" });

// Legacy group → outcome heuristic (audit-visible via legacyGroup; classified=false).
const GROUP_OUTCOME: [RegExp, Outcome][] = [
  [/admin|adminOperations|adminProgram|adminInternal|adminAcademy|adminTeaching|myOrg/, "operate"],
  [/getFunded|fund/i, "fund"],
  [/servePeople|fosterYouth|justiceReentry|preventionHealth|quickTask/, "get-help"],
  [/academyLearning|hubChildCare/, "learn"],
  [/workforceTrades|hubRuralAg/, "work-earn"],
  [/partnersCoalitions|connectedSite|ctxHub/, "connect"],
  [/whereWeOperate|aboutTrust/, "see-the-data"],
  [/workspace:residents/, "get-help"], [/workspace:organizations/, "connect"], [/workspace:funders/, "see-the-data"], [/workspace:community/, "see-the-data"],
];
const PATH_OUTCOME: [RegExp, Outcome][] = [
  [/^\/(admin|ops|operations|internal|staff|teacher|case-manager|chw|funder-dashboard|partner-dashboard|rfp-fidelity)/, "operate"],
  [/grant|fund|rfp|proposal|donor|loi|mou|capital/, "fund"],
  [/academy|lesson|course|curriculum|learn|trade|sim|quiz|flashcard|tutor/, "learn"],
  [/job|career|workforce|apprentice|employ|earn|business|entrepreneur/, "work-earn"],
  [/partner|coalition|network|ambassador|community-gravity|directory|ecosystem|connect/, "connect"],
  [/data|impact|analysis|map|equity|census|sdoh|report|research|method|evidence|dashboard|intel|hud|metrics/, "see-the-data"],
];
const GROUP_AUDIENCE: [RegExp, Audience[]][] = [
  [/fosterYouth/, ["foster-youth"]], [/justiceReentry/, ["returning-citizens"]], [/hubRuralAg/, ["rural-farm"]],
  [/academy|hubChildCare/, ["students-youth", "resident-family"]], [/servePeople|preventionHealth|quickTask|workspace:residents/, ["resident-family"]],
  [/partnersCoalitions|myOrg|workspace:organizations/, ["nonprofit-cbo", "caregivers-chws"]], [/getFunded|workspace:funders/, ["funder-evaluator", "nonprofit-cbo"]],
  [/whereWeOperate|workspace:community/, ["agency-government"]], [/admin/, ["nonprofit-cbo"]],
];
const pick = <T,>(table: [RegExp, T][], s: string): T | undefined => table.find(([re]) => re.test(s))?.[1];
const strip = (u: string) => u.split(/[?#]/)[0];
const matchRoute = (url: string): string | undefined => {
  const p = strip(url);
  if (routePaths.has(p)) return p;
  for (const r of routePaths) if (r.includes(":") && new RegExp("^" + r.replace(/:[^/]+/g, "[^/]+") + "$").test(p)) return r;
  return undefined;
};

const entries = new Map<string, RouteEntry>();
const ensure = (path: string): RouteEntry => {
  let e = entries.get(path);
  if (!e) { e = { path, title: path.replace(/^\//, "").replace(/[-/]/g, " ").replace(/:\w+/g, "").trim() || "Home", outcome: pick(PATH_OUTCOME, path) ?? "get-help", audiences: [], access: "public", upstream: [], downstream: [], sources: [], classified: false }; entries.set(path, e); }
  return e;
};
for (const p of routePaths) { const e = ensure(p); const a = routeAccess.get(p); if (a) e.access = a; }
const external: Inv[] = [];
for (const i of inv) {
  const r = matchRoute(i.url);
  if (!r) { if (/^https?:/.test(i.url)) external.push(i); continue; }
  const e = ensure(r);
  if (!e.sources.includes(i.source)) e.sources.push(i.source);
  if (i.source !== "command-palette" || e.title === r) e.title = i.title;
  if (!e.legacyGroup && i.source === "legacy-sidebar") { e.legacyGroup = i.group; const o = pick(GROUP_OUTCOME, i.group); if (o) e.outcome = o; }
  if (i.source === "workspace-catalog" && e.sources.length === 1) { const o = pick(GROUP_OUTCOME, i.group); if (o) e.outcome = o; }
  for (const a of pick(GROUP_AUDIENCE, i.group) ?? []) if (!e.audiences.includes(a)) e.audiences.push(a);
  const rank: Access[] = ["public", "authenticated", "staff", "admin"];
  if (rank.indexOf(i.access) > rank.indexOf(e.access)) e.access = i.access;
  if (e.access === "admin" || e.access === "staff") e.outcome = "operate";
}
for (const e of entries.values()) { if (e.sources.length === 0) e.sources.push("app-routes"); if (e.access === "admin" || e.access === "staff") e.outcome = e.outcome === "operate" ? "operate" : e.outcome; }

// Human classification lanes (2b–2e) override the heuristic draft; unknown paths fail the G1 gate as stale.
let classifiedCount = 0;
for (const [path, c] of Object.entries(ROUTE_CLASSIFICATIONS)) {
  const e = entries.get(path);
  if (!e) { console.error(`classification for unknown route: ${path}`); process.exitCode = 1; continue; }
  const floor = routeAccess.get(path);
  Object.assign(e, c, { classified: true }); classifiedCount++;
  // App.tsx RequireAuth is the floor: a lane may raise access (page calls a staff API) but never lower it.
  const rank: Access[] = ["public", "authenticated", "staff", "admin"];
  if (floor && rank.indexOf(e.access) < rank.indexOf(floor)) { console.error(`${path}: lane set access=${e.access} below RequireAuth floor ${floor}`); process.exitCode = 1; }
}
console.log(`classified ${classifiedCount}/${entries.size}`);
const out = { routeCount: routePaths.size, entries: [...entries.values()].sort((a, b) => a.path.localeCompare(b.path)), externalLinks: external.map(x => ({ title: x.title, url: x.url, group: x.group })) };
writeFileSync("shared/route-registry.generated.json", JSON.stringify(out, null, 1) + "\n");
// Slim navigation manifest consumed by the client (Phase 3): canonical, linkable rows only — no aliases, no :param routes.
const nav = out.entries.filter(e => !e.aliasOf && !e.path.includes(":")).map(e => ({ path: e.path, title: e.title, outcome: e.outcome, audiences: e.audiences, access: e.access, description: e.description ?? "", downstream: e.downstream.filter(d => !d.includes(":")) }));
writeFileSync("shared/route-nav.generated.json", JSON.stringify(nav) + "\n");
const byOutcome = out.entries.reduce<Record<string, number>>((m, e) => { m[e.outcome] = (m[e.outcome] ?? 0) + 1; return m; }, {});
const orphan = out.entries.filter(e => e.sources.length === 1 && e.sources[0] === "app-routes").length;
console.log(`routes=${routePaths.size} entries=${out.entries.length} inventoried=${inv.length} external=${external.length} route-only(no nav mentions)=${orphan}`);
console.log("by outcome (draft heuristic):", byOutcome);
