import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WORKSPACES, WORKSPACE_TASKS, inferNavigation, canUseTask, workspaceForPath, isWorkspaceId } from "./workspace-catalog";

test("four distinct workspace perspectives; unique stable task IDs", () => {
  assert.equal(WORKSPACES.length, 4);
  assert.equal(new Set(WORKSPACE_TASKS.map(t => t.id)).size, WORKSPACE_TASKS.length);
  assert.equal(isWorkspaceId("admin"), false);
  assert.equal(isWorkspaceId("residents"), true);
});
test("every curated destination is an existing exact registered route", () => {
  const app = readFileSync("client/src/App.tsx", "utf8");
  for (const task of WORKSPACE_TASKS) assert.ok(app.includes(`path="${task.href}"`), task.href);
});
test("funding alone must clarify and never auto-select organizational grants", () => {
  for (const input of ["I need funding", "I need money", "financial support"]) {
    const decision = inferNavigation(input, "organizations");
    assert.equal(decision.status, "clarify");
    assert.deepEqual(decision.taskIds, ["find-support", "organization-funding", "learn-work"]);
  }
});
test("known, unknown, empty and word-boundary requests stay explicit", () => {
  assert.equal(inferNavigation("I need rent").taskIds[0], "find-support");
  assert.equal(inferNavigation("I need a grant").taskIds[0], "organization-funding");
  assert.equal(inferNavigation(" ").status, "unknown");
  assert.equal(inferNavigation("abracadabra").status, "unknown");
  assert.equal(inferNavigation("award").status, "unknown");
  assert.equal(inferNavigation("not grants but food").taskIds[0], "find-support");
});
test("multiple explicit goals are not erased by preferred workspace", () => {
  const decision = inferNavigation("housing and grants", "organizations");
  assert.equal(decision.status, "clarify");
  assert.ok(decision.taskIds.includes("find-support"));
  assert.ok(decision.taskIds.includes("organization-funding"));
});
test("financial phrases use explicit audience context without guessing identity", () => {
  for (const input of ["I need funding for my organization", "Our organizations need financial support", "Money for a non-profit", "Funding for our business"]) {
    assert.deepEqual(inferNavigation(input).taskIds, ["organization-funding"], input);
    assert.equal(inferNavigation(input).status, "suggested", input);
  }
  assert.deepEqual(inferNavigation("Funding for tuition").taskIds, ["learn-work"]);
  assert.deepEqual(inferNavigation("Financial support for my family").taskIds, ["find-support"]);
  assert.equal(inferNavigation("money", "organizations").status, "clarify");
  const combined = inferNavigation("funding for my organization and housing", "organizations");
  assert.equal(combined.status, "clarify");
  assert.ok(combined.taskIds.includes("organization-funding"));
  assert.ok(combined.taskIds.includes("find-support"));
});
test("cross-workspace routing explains the switch and requires UI confirmation", () => {
  const decision = inferNavigation("rent", "funders");
  assert.equal(decision.status, "suggested");
  assert.match(decision.reason, /another workspace/);
  assert.equal(decision.evidence, "Product routing catalog");
  assert.match(decision.limits, /no eligibility/);
});
test("emergency input discloses limits and crisis options", () => {
  const decision = inferNavigation("I am suicidal");
  assert.equal(decision.taskIds[0], "find-support");
  assert.match(decision.reason, /988/);
  assert.match(decision.reason, /not an emergency service/);
});
test("workspace selection never substitutes for authorization", () => {
  const publicViewer = { authenticated: false, staff: false, admin: false };
  const member = { authenticated: true, staff: false, admin: false };
  for (const task of WORKSPACE_TASKS) {
    assert.equal(canUseTask(task, publicViewer), task.access === "public");
    assert.equal(canUseTask(task, member), ["public", "authenticated"].includes(task.access));
    if (task.access === "staff") {
      assert.equal(canUseTask(task, { authenticated: false, staff: true, admin: true }), false);
      assert.equal(canUseTask(task, { authenticated: true, staff: true, admin: false }), true);
    }
  }
});
test("route-derived workspace survives reload and deep links without stored identity", () => {
  assert.equal(workspaceForPath("/workspace/community"), "community");
  assert.equal(workspaceForPath("/benefits/how-to-apply/snap?x=y"), "residents");
  assert.equal(workspaceForPath("/curriculum/module/one"), "residents");
  assert.equal(workspaceForPath("/grants/applications"), "organizations");
  assert.equal(workspaceForPath("/workspace/fake"), null);
  assert.equal(workspaceForPath("/resources-other"), null);
});
test("guidance is local-only; original information remains routed", () => {
  const source = readFileSync("client/src/components/guided-start.tsx", "utf8");
  assert.ok(!/\b(?:fetch|apiRequest|localStorage|sessionStorage|console)\s*(?:\.|\()/.test(source));
  assert.ok(source.includes('data-testid="guided-start-continue"'));
  const app = readFileSync("client/src/App.tsx", "utf8");
  assert.ok(app.includes('path="/platform-overview" component={LandingPage}'));
  assert.ok(app.includes('path="/" component={FocusedHomePage}'));
  assert.ok(app.includes('path="/hub"><Redirect to="/" />'), "/hub is an alias of / (Phase 3d)");
  assert.ok(app.includes("WorkspaceProvider"));
});