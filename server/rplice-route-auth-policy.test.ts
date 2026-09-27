import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const source = fs.readFileSync(new URL("./rplice-tools.ts", import.meta.url), "utf8");

const REQUIRED_AUTH_GET_ROUTES = [
  "/api/rplice/cfir-assessments",
  "/api/rplice/reaim-scorecards",
  "/api/rplice/quality-reviews",
  "/api/rplice/assessments",
  "/api/rplice/baselines",
  "/api/rplice/action-plans",
  "/api/rplice/compute/catalog",
];

test("RPLICE protected GET routes require auth middleware", () => {
  for (const route of REQUIRED_AUTH_GET_ROUTES) {
    const declaration = `app.get("${route}", requireAuth, async`;
    assert.equal(
      source.includes(declaration),
      true,
      `Expected route to require auth: ${route}`,
    );
  }
});

test("no /api/rplice GET route is left publicly mounted", () => {
  const allRpliceGets = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith('app.get("/api/rplice/'));
  const publicRpliceGets = allRpliceGets.filter((line) => !line.includes("requireAuth"));
  assert.equal(
    publicRpliceGets.length,
    0,
    `Found publicly mounted RPLICE GET route(s): ${publicRpliceGets.join(", ")}`,
  );
});
