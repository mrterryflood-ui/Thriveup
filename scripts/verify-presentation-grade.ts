/**
 * R4 gate — honest two-grade presentation + one term per concept.
 *  1. Every operate-lane route has a declared grade (shared/route-grade) and the page frame + tools directory render it.
 *  2. No live route outside the operate lane is graded "internal" (stakeholder surfaces are never labelled internal).
 *  3. Naming: aliases never chain; every alias's App.tsx <Redirect> lands on the alias target; no live route carries
 *     "legacy" in its title; no two live literal routes share a title (one term per concept).
 */
import { readFileSync } from "node:fs";
import { SHELL_LESS_ROUTES } from "../shared/shell-less-routes";
import type { RouteEntry } from "../shared/route-registry.types";
import { gradeFor } from "../shared/route-grade";

const failures: string[] = [];
const registry = (JSON.parse(readFileSync("shared/route-registry.generated.json", "utf8")) as { entries: RouteEntry[] }).entries;
const byPath = new Map(registry.map((e) => [e.path, e]));
const live = registry.filter((e) => !e.aliasOf);
const operate = live.filter((e) => e.outcome === "operate");

// 1 + 2. Grade derivation.
for (const e of operate) if (!gradeFor(e)) failures.push(`${e.path} is operate-lane but has no declared grade`);
for (const e of live) if (e.outcome !== "operate" && gradeFor(e)) failures.push(`${e.path} is a stakeholder-lane route but is graded ${gradeFor(e)!.id}`);
const frame = readFileSync("client/src/components/page-frame.tsx", "utf8");
const tools = readFileSync("client/src/pages/tool-directory.tsx", "utf8");
if (!frame.includes('from "@shared/route-grade"') || !frame.includes('data-testid="page-frame-grade"')) failures.push("page-frame does not render the registry-derived grade badge");
if (!tools.includes('from "@shared/route-grade"') || !tools.includes('data-testid="tool-grade"')) failures.push("tool-directory does not render the registry-derived grade badge");

// 3. Naming and alias discipline.
const app = readFileSync("client/src/App.tsx", "utf8");
const redirects = new Map<string, string>();
for (const m of app.matchAll(/<Route path="([^"]+)">\s*<Redirect to="([^"?]+)[^"]*" \/>\s*<\/Route>/g)) redirects.set(m[1], m[2]);
for (const e of registry) {
  if (!e.aliasOf) continue;
  const target = byPath.get(e.aliasOf);
  if (!target) failures.push(`alias ${e.path} points at ${e.aliasOf}, which is not in the registry`);
  else if (target.aliasOf) failures.push(`alias ${e.path} chains through ${e.aliasOf} → ${target.aliasOf}; point it at the terminal route`);
  const redirect = redirects.get(e.path);
  if (redirect && redirect !== e.aliasOf) failures.push(`alias ${e.path} redirects to ${redirect} in App.tsx but the registry says ${e.aliasOf}`);
}
for (const e of live) if (/\blegacy\b/i.test(e.title)) failures.push(`${e.path} still carries "legacy" in its title (${e.title})`);
const literalLive = live.filter((e) => !e.path.includes(":"));
const titles = new Map<string, string[]>();
for (const e of literalLive) { const k = e.title.trim().toLowerCase(); titles.set(k, [...(titles.get(k) ?? []), e.path]); }
for (const [title, paths] of titles) if (paths.length > 1) failures.push(`title "${title}" is shared by ${paths.join(", ")} — one term per concept`);

// 4. R8a: the example panel is mounted by PageFrame (every framed door gets it), and the shell-less list matches
//    the pre-shell <Route>s in App.tsx so the registry-driven e2e gate excludes exactly the frameless surfaces.
const frameSrc = readFileSync("client/src/components/page-frame.tsx", "utf8");
if (!frameSrc.includes("<ToolExamplePanel")) failures.push("PageFrame no longer mounts ToolExamplePanel (R8a)");
const shellEnd = app.indexOf("<Route>\n", app.indexOf("<OrgRedirectGuard />"));
const preShell = app.slice(app.lastIndexOf("<Switch>", shellEnd), shellEnd);
const preShellPaths = Array.from(preShell.matchAll(/<Route path="([^"]+)"/g)).map((m) => m[1]).filter((p) => !p.includes(":"));
for (const p of SHELL_LESS_ROUTES) if (!preShellPaths.includes(p)) failures.push(`shell-less route ${p} is not a pre-shell <Route> in App.tsx`);
for (const p of preShellPaths) if (!(SHELL_LESS_ROUTES as readonly string[]).includes(p)) failures.push(`pre-shell <Route path="${p}"> is missing from shared/shell-less-routes.ts`);
if (failures.length > 0) { console.error(failures.map((f) => `✗ ${f}`).join("\n")); process.exit(1); }
console.log(`PASS presentation grade: ${operate.length} operate routes graded (${operate.filter((e) => gradeFor(e)!.id === "internal").length} internal, ${operate.filter((e) => gradeFor(e)!.id === "operations").length} operations); ${registry.length - live.length} aliases terminal and redirect-consistent; ${literalLive.length} live titles unique`);
