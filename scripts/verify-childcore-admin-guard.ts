import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../server/childcore-routes.ts", import.meta.url), "utf8");
const protectedRoutes = [
  "/childcore/status",
  "/childcore/settings",
  "/childcore/community/:geo/providers",
  "/childcore/community/:geo/schools",
  "/childcore/community/:geo/sdoh",
  "/childcore/community/:geo/impact",
  "/childcore/push",
  "/childcore/rag-preview",
  "/childcore/events",
  "/childcore/yhsi-summary",
  "/childcore/capabilities",
];

for (const route of protectedRoutes) {
  const routeIndex = source.indexOf(`"${route}"`);
  assert.notEqual(routeIndex, -1, `missing ChildCORE route: ${route}`);
  const nextRouteIndex = source.indexOf("\n  router.", routeIndex + 1);
  const handler = source.slice(routeIndex, nextRouteIndex === -1 ? undefined : nextRouteIndex);
  assert.match(
    handler,
    /requireSettingsAdmin\(req, res\)/,
    `${route} must enforce the DB-backed administrator guard`,
  );
}

assert.match(source, /user\.role !== "admin"/, "administrator guard must reject every non-admin role");
console.log("PASS ChildCORE admin-only route guard");