import { defineConfig, devices } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

function resolveChromiumExecutable(): string | undefined {
  const configured = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (configured && existsSync(configured)) return configured;

  for (const command of ["chromium", "chromium-browser", "google-chrome"]) {
    try {
      const path = execFileSync("which", [command], { encoding: "utf8" }).trim();
      if (path && existsSync(path)) return path;
    } catch {
      // Keep checking supported executable names. Playwright reports the final
      // launch error if no browser is installed.
    }
  }

  return undefined;
}

const chromiumExecutable = resolveChromiumExecutable();

export default defineConfig({
  testDir: "./tests/e2e",
  // 90s: Vite dev-server cold transforms + parallel validation gates make
  // first page loads routinely exceed 30s; a tight timeout only produced flakes.
  timeout: 90_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5000",
    // Prefer an explicitly configured browser, then the installed Nix Chromium.
    // This makes browser and PDF checks work in the development container.
    launchOptions: chromiumExecutable ? { executablePath: chromiumExecutable } : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
