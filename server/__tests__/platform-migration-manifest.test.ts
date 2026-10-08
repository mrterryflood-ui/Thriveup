import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const manifestPath = fileURLToPath(new URL("../../docs/platform-migration/migration-manifest.json", import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

type Dependency = {
  id: string;
  category: string;
  targetReplacement?: string;
  testCases?: string[];
  rollbackMechanism?: string;
  formalRetirement?: null | {
    decision?: string;
    approvedBy?: string;
    approvedReference?: string;
    effectiveDate?: string;
  };
  externalHostnameChanges?: Array<{ from?: string; to?: string; sourcePullRequest?: number; decision?: string }>;
};

function isApprovedRetirement(dep: Dependency): boolean {
  const r = dep.formalRetirement;
  return Boolean(
    r
    && r.decision === "retire"
    && r.approvedBy
    && r.approvedReference
    && r.effectiveDate,
  );
}

test("migration manifest covers required categories", () => {
  const categories = new Set((manifest.dependencies as Dependency[]).map((dep) => dep.category));
  for (const required of [
    "auth",
    "object-storage",
    "email",
    "ai-evidence-synthesis",
    "voice",
    "chat",
    "image-generation",
    "scheduled-jobs",
  ]) {
    assert.ok(categories.has(required), `Missing required category: ${required}`);
  }
});

test("migration manifest entries have replacement/test/rollback or formal retirement", () => {
  for (const dep of manifest.dependencies as Dependency[]) {
    assert.ok(dep.id, "dependency id is required");
    assert.ok(dep.category, `dependency ${dep.id} must define category`);

    if (isApprovedRetirement(dep)) continue;

    assert.ok(dep.targetReplacement && dep.targetReplacement.trim().length > 0, `${dep.id} missing targetReplacement`);
    assert.ok(Array.isArray(dep.testCases) && dep.testCases.length > 0, `${dep.id} missing testCases`);
    assert.ok(dep.rollbackMechanism && dep.rollbackMechanism.trim().length > 0, `${dep.id} missing rollbackMechanism`);
  }
});

test("manifest records PR #6 external hostname change with explicit decision", () => {
  const dep = (manifest.dependencies as Dependency[]).find((entry) => entry.id === "scheduled-gun-violence-source-hostname");
  assert.ok(dep, "scheduled hostname dependency missing");
  const changes = dep!.externalHostnameChanges || [];
  assert.ok(changes.length > 0, "externalHostnameChanges is required for scheduled-gun-violence-source-hostname");

  const gvChange = changes.find((change) => change.from === "gun-violence-registry.replit.app");
  assert.ok(gvChange, "missing PR #6 gun-violence-registry hostname change");
  assert.equal(gvChange!.to, "gun-violence-registry.legacy.invalid");
  assert.equal(gvChange!.sourcePullRequest, 6);
  assert.ok(gvChange!.decision && gvChange!.decision.length > 0, "hostname change must include explicit decision");
});
