import { readFileSync } from "node:fs";

const expectedRestrictedPaths = [
  "/grants",
  "/my-grants",
  "/grants/applications",
  "/rfp-fidelity",
  "/grant-narrative",
  "/loi-writer",
  "/grant-packages",
  "/won-proposals",
  "/apex-accelerators",
  "/ceds",
  "/regional-briefing",
  "/my-journey",
  "/my-household",
  "/my-documents",
  "/my-appointments",
  "/foster-youth/toolkit",
  "/foster-youth/wellbeing",
  "/foster-youth/benefits",
  "/fafsa-navigator",
];

const failures: string[] = [];
const sidebarSource = readFileSync("client/src/components/app-sidebar.tsx", "utf8");
const paletteSource = readFileSync("client/src/components/command-palette.tsx", "utf8");
const palettePathValues = [...paletteSource.matchAll(/path:\s*"([^"]+)"/g)]
  .map((match) => match[1].split("?")[0]);
const palettePaths = new Set(palettePathValues);

if (!paletteSource.includes('getSidebarNavigationAccess } from "@/components/app-sidebar"')) {
  failures.push("command palette does not consume the sidebar access predicate");
}
if (paletteSource.includes("AUTH_REQUIRED_PATHS") || paletteSource.includes("ADMIN_REQUIRED_PATHS")) {
  failures.push("command palette still contains a duplicated permission path set");
}
if (!sidebarSource.includes("const SIDEBAR_NAV_ITEMS: NavItem[]")) {
  failures.push("sidebar access registry is missing");
}
if (!sidebarSource.includes("matched: Boolean(match)")) {
  failures.push("sidebar access predicate does not report registry matches");
}

for (const path of expectedRestrictedPaths) {
  if (!palettePaths.has(path)) {
    failures.push(`${path} is restricted in the sidebar but missing from the command palette corpus`);
    continue;
  }
  if (!sidebarSource.includes(`url: "${path}"`)) {
    failures.push(`${path} is missing from the sidebar navigation registry`);
  }
}

if (palettePathValues.length !== palettePaths.size) {
  failures.push("command palette contains duplicate normalized paths");
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `✗ ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`PASS navigation permission sync: ${expectedRestrictedPaths.length} restricted destinations checked`);