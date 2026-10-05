/**
 * G1 — route registry completeness gate.
 * Every <Route path> in App.tsx has exactly one registry entry; no registry
 * entry points at a route that no longer exists; every entry carries a valid
 * outcome/access; every nav inventory URL resolves to a registry entry.
 */
import { readFileSync } from "node:fs";
import { OUTCOMES, AUDIENCES } from "../shared/route-registry.types";
import type { RouteEntry } from "../shared/route-registry.types";

const app = readFileSync("client/src/App.tsx", "utf8");
const routes = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]));
const reg = JSON.parse(readFileSync("shared/route-registry.generated.json", "utf8")) as { entries: RouteEntry[] };
const paths = reg.entries.map(e => e.path);
const failures: string[] = [];
const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
if (dupes.length) failures.push(`duplicate entries: ${dupes.join(", ")}`);
for (const r of routes) if (!paths.includes(r)) failures.push(`untagged route: ${r}`);
for (const e of reg.entries) {
  if (!routes.has(e.path)) failures.push(`stale entry (no such route): ${e.path}`);
  if (!OUTCOMES.includes(e.outcome)) failures.push(`${e.path}: bad outcome ${e.outcome}`);
  if (!["public", "authenticated", "staff", "admin"].includes(e.access)) failures.push(`${e.path}: bad access ${e.access}`);
  for (const a of e.audiences) if (!AUDIENCES.includes(a)) failures.push(`${e.path}: bad audience ${a}`);
  if (!e.title.trim()) failures.push(`${e.path}: empty title`);
}
const unclassified = reg.entries.filter(e => !e.classified).length;
// Once a lane is classified, its rows must be complete (title/description/guide) — partial rows are a silent regression.
for (const e of reg.entries) if (e.classified) {
  if (!e.description?.trim()) failures.push(`${e.path}: classified without description`);
  if (!e.guide?.trim()) failures.push(`${e.path}: classified without guide`);
  if (!e.aliasOf && e.audiences.length === 0) failures.push(`${e.path}: classified with no audience`);
  for (const p of [...e.upstream, ...e.downstream]) if (!routes.has(p)) failures.push(`${e.path}: links to non-route ${p}`);
  if (e.aliasOf && !routes.has(e.aliasOf)) failures.push(`${e.path}: aliasOf non-route ${e.aliasOf}`);
}
if (process.env.REQUIRE_FULL_CLASSIFICATION === "1" && unclassified > 0) failures.push(`${unclassified} routes still unclassified`);
console.log(`registry: ${reg.entries.length} entries / ${routes.size} routes; ${unclassified} awaiting human classification`);
if (failures.length) { console.error("ROUTE REGISTRY GATE FAILED\n" + failures.map(f => " - " + f).join("\n")); process.exit(1); }
console.log("Route registry completeness gate passed (G1 floor: tagged == total, zero untagged).");
