import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const sidebar = readFileSync("client/src/components/app-sidebar.tsx", "utf8");

function connectedSites(): string {
  const start = sidebar.indexOf("const connectedSiteItems: NavItem[] = [");
  assert.ok(start >= 0, "connected-sites directory must exist");
  const end = sidebar.indexOf("];", start);
  assert.ok(end > start, "connected-sites directory must be a closed array literal");
  return sidebar.slice(start, end);
}

test("The Community Violence Register is listed once in the connected-sites directory with its exact URL", () => {
  // The extra "e" in "violenece" is intentional (electronic) and must not be "corrected".
  const entry = '{ title: "The Community Violence Register", url: "https://thecommunityvioleneceregister.org"';
  assert.equal(connectedSites().split(entry).length - 1, 1);
  assert.equal(sidebar.split("thecommunityvioleneceregister.org").length - 1, 1);
});

test("The Community Violence Register has its approved directory description", () => {
  assert.ok(
    sidebar.includes(
      '"The Community Violence Register": "A public-facing community violence intelligence and prevention resource connecting local safety context, data-informed storytelling, and pathways to community support."',
    ),
  );
});

test("connected-site external links open in a new tab with noopener noreferrer", () => {
  const renderStart = sidebar.indexOf("{connectedSiteItems.map((item) => (");
  assert.ok(renderStart >= 0, "connected-sites renderer must exist");
  const render = sidebar.slice(renderStart);
  assert.match(render, /target=\{item\.url\.startsWith\("https:\/\/"\) \? "_blank" : undefined\}/);
  assert.match(render, /rel=\{item\.url\.startsWith\("https:\/\/"\) \? "noopener noreferrer" : undefined\}/);
});
