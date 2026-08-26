#!/usr/bin/env node

/**
 * Deterministic architecture gate.
 *
 * This is intentionally not an AI substitute. It gives every build a locally
 * runnable, repeatable architecture review when an external reviewer is
 * unavailable, and it protects the platform boundaries that must not drift.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const checks = [];

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "✓ PASS" : "✗ FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function findFiles(directory, predicate) {
  const absoluteDirectory = join(root, directory);
  if (!existsSync(absoluteDirectory)) return [];

  const files = [];
  for (const entry of readdirSync(absoluteDirectory)) {
    const absolute = join(absoluteDirectory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      files.push(...findFiles(relative(root, absolute), predicate));
    } else if (predicate(absolute)) {
      files.push(relative(root, absolute));
    }
  }
  return files;
}

function findMatches(paths, expression) {
  return paths
    .filter((path) => expression.test(read(path)))
    .map((path) => path.replaceAll("\\", "/"));
}

console.log("ThriveUp deterministic architecture review\n");

const requiredAnchors = [
  "server/ai-provider.ts",
  "server/inbound-verification.ts",
  "server/partner-api-routes.ts",
  "shared/schema.ts",
  "client/src/App.tsx",
  "docs/api-contract.md",
  "playwright.config.ts",
  "eslint.config.mjs",
];
const missingAnchors = requiredAnchors.filter((path) => !existsSync(join(root, path)));
check(
  "Architecture anchors",
  missingAnchors.length === 0,
  missingAnchors.length === 0 ? "core boundaries are present" : `missing: ${missingAnchors.join(", ")}`,
);

const serverFiles = findFiles("server", (path) => /\.(?:ts|tsx|mts|cts)$/.test(path));
const aiProvider = read("server/ai-provider.ts");
check(
  "AI policy gateway",
  /withEthicalPreamble/.test(aiProvider) && existsSync(join(root, "scripts/verify-ai-preamble.ts")),
  "ethical preamble gateway and its regression guard are present",
);

const allSourceFiles = [
  ...serverFiles,
  ...findFiles("client/src", (path) => /\.(?:ts|tsx)$/.test(path)),
];
const directSecretComparisons = findMatches(
  allSourceFiles,
  /process\.env\.CROSS_PLATFORM_API_KEY/,
);
const permittedCompatibilityRoutes = new Set([
  "server/cross-platform-api.ts",
  "server/justice-routes.ts",
]);
const untrackedDirectSecretComparisons = directSecretComparisons.filter(
  (path) => !permittedCompatibilityRoutes.has(path),
);
const sunsettedCompatibilityRoutes = [...permittedCompatibilityRoutes].filter(
  (path) => existsSync(join(root, path))
    && /Deprecation/.test(read(path))
    && /Sunset/.test(read(path))
    && /partner\/v1/.test(read(path)),
);
check(
  "Deprecated cross-platform auth containment",
  untrackedDirectSecretComparisons.length === 0
    && sunsettedCompatibilityRoutes.length === permittedCompatibilityRoutes.size,
  untrackedDirectSecretComparisons.length > 0
    ? `untracked raw-key compatibility path: ${untrackedDirectSecretComparisons.join(", ")}`
    : "legacy paths are explicit, sunsetted, and point to scoped partner auth",
);

const packageJson = read("package.json");
check(
  "Single React renderer policy",
  !/@react-three\/fiber|@react-three\/drei/.test(packageJson),
  "@react-three packages are not installed",
);

const appRouter = read("client/src/App.tsx");
check(
  "Route-level auth composition",
  !/<RequireAuth[^>]*>\s*<Route\b/s.test(appRouter),
  "routes retain ownership of auth boundaries",
);

const publicClientFiles = findFiles("client/src", (path) => /\.(?:ts|tsx)$/.test(path));
const invalidStateClaims = findMatches(publicClientFiles, /\b52\s+states\b/i);
check(
  "Public geographic claim discipline",
  invalidStateClaims.length === 0,
  invalidStateClaims.length === 0
    ? 'no "52 states" public claim found'
    : `replace invalid state-count claims: ${invalidStateClaims.join(", ")}`,
);

const playwrightConfig = read("playwright.config.ts");
check(
  "Browser verification readiness",
  /REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE/.test(playwrightConfig)
    && /chromium/.test(playwrightConfig),
  "Playwright is configured for Chromium",
);

const failures = checks.filter((result) => !result.pass);
console.log(`\nARCHITECT REVIEW: ${checks.length - failures.length} PASS  ${failures.length} FAIL`);
if (failures.length > 0) process.exit(1);