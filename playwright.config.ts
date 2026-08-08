import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5000",
    // Replit provides a Nix-packaged Chromium; the default Playwright browser
    // download is not available in this environment.
    launchOptions: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
