// Reachability guard for the platform's major public tools.
//
// Purpose: a feature can be fully built and routed, yet unreachable to a
// first-time visitor if nothing links to it. This script keeps a short,
// explicit list of "must be discoverable" public tools and fails the gate
// if any of them stops being linked from the homepage or the primary
// sidebar navigation — so a nav refactor can't silently orphan a tool
// again the way TANF/CCDF/LIHEAP/Section8/VeteransBenefits result cards
// were orphaned from the benefits screener's own display map.
//
// This is deliberately NOT a full crawl/graph-distance check (that would
// require a headless browser and real click simulation). It's a cheap,
// fast, CI-safe proxy: each listed route's href must appear as a string
// literal in at least one of its declared "reachable from" source files.
//
// Run manually: npx tsx scripts/verify-tool-reachability.ts
// Also chained into the `directory-links` validation gate.

import { readFileSync } from "fs";

interface ToolCheck {
  name: string;
  route: string;
  // Files where a link to `route` should appear (homepage and/or sidebar).
  reachableFrom: string[];
}

const TOOLS: ToolCheck[] = [
  { name: "Benefits Screener (guided apply)", route: "/benefits-screener", reachableFrom: ["client/src/pages/landing.tsx", "client/src/components/app-sidebar.tsx"] },
  { name: "Resource Finder", route: "/resources", reachableFrom: ["client/src/components/app-sidebar.tsx", "client/src/pages/health-wellness.tsx", "client/src/pages/benefits-screener.tsx"] },
  { name: "Health & Wellness Hub", route: "/health-wellness", reachableFrom: ["client/src/components/app-sidebar.tsx", "client/src/pages/benefits-screener.tsx"] },
  { name: "AI Navigator", route: "/navigator", reachableFrom: ["client/src/components/app-sidebar.tsx", "client/src/pages/health-wellness.tsx", "client/src/pages/benefits-screener.tsx"] },
  { name: "Resource Directory", route: "/resource-directory", reachableFrom: ["client/src/components/app-sidebar.tsx"] },
];

function fileHasLink(path: string, route: string): boolean {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return false;
  }
  // Match href="/route", href='/route', href={"/route"} or url: "/route" forms,
  // allowing an optional query string / trailing segment boundary.
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`["'\`]${escaped}(["'\`?#/])`);
  return pattern.test(text);
}

let failures = 0;

for (const tool of TOOLS) {
  const linkedFrom = tool.reachableFrom.filter((f) => fileHasLink(f, tool.route));
  if (linkedFrom.length === 0) {
    failures++;
    console.error(`FAIL: "${tool.name}" (${tool.route}) is not linked from any of: ${tool.reachableFrom.join(", ")}`);
  } else {
    console.log(`OK: "${tool.name}" (${tool.route}) reachable from ${linkedFrom.length}/${tool.reachableFrom.length} expected source(s): ${linkedFrom.join(", ")}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} tool(s) failed the reachability check.`);
  process.exit(1);
}

console.log(`\nAll ${TOOLS.length} tracked public tools remain reachable.`);
