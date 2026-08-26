import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { seedStudioRegistryFromFile } from "../server/studio-registry-sync";

const SEED_PATH = "convex/seed_modules.json";
const MODULE_KEY = "e2e-studio-bootstrap-proof";

const manifest = {
  moduleKey: MODULE_KEY,
  moduleType: "grant-workflow",
  title: "E2E Studio bootstrap proof",
  description: "Temporary declarative seed used only to verify empty-registry bootstrap.",
  routeSlug: MODULE_KEY,
  lifecycleStage: "draft",
  public: false,
  dataScope: "organization",
  retentionDays: 7,
  fields: [{
    key: "readiness",
    label: "Readiness",
    type: "select",
    required: true,
    options: ["ready", "needs-review"],
    dataScope: "organization",
  }],
  actions: [{ type: "submit-record", label: "Save readiness", dataScope: "organization" }],
  stages: [{ key: "review", label: "Review", description: "Review the declared readiness selection." }],
  inputContract: { confirmation: "Only the declared readiness selection is accepted.", allowedFieldKeys: ["readiness"] },
  systemPrompt: { purpose: "Present a bounded readiness workflow.", safetyGuidance: ["Accept only declared options."] },
  outputFormat: { format: "status-update", sections: [{ key: "review", label: "Review" }] },
  provenance: { source: "human", reviewedByHuman: false, sourceDescription: "Temporary E2E bootstrap proof." },
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for Studio bootstrap verification.");
  const client = new Client({ connectionString });
  const originalSeed = await readFile(SEED_PATH, "utf8");
  await client.connect();
  try {
    await client.query(`DELETE FROM studio_module_manifests WHERE module_key = $1`, [MODULE_KEY]);
    const before = await client.query(`SELECT count(*)::int AS count FROM studio_module_manifests`);
    assert.equal(before.rows[0].count, 0, "bootstrap proof requires an empty Studio registry");

    await writeFile(SEED_PATH, `${JSON.stringify({
      schemaVersion: 1,
      modules: [{ moduleKey: MODULE_KEY, version: 0, lifecycleStage: "draft", public: false, manifest }],
    }, null, 2)}\n`);

    const first = await seedStudioRegistryFromFile();
    assert.deepEqual(first, { seeded: 1, skipped: false });
    const seeded = await client.query(
      `SELECT module_key, version, lifecycle_stage, is_public, created_by_user_id FROM studio_module_manifests WHERE module_key = $1`,
      [MODULE_KEY],
    );
    assert.deepEqual(seeded.rows, [{
      module_key: MODULE_KEY,
      version: 0,
      lifecycle_stage: "draft",
      is_public: false,
      created_by_user_id: "studio-seed-bootstrap",
    }]);

    const second = await seedStudioRegistryFromFile();
    assert.deepEqual(second, { seeded: 0, skipped: true });
    console.log("Studio empty-registry bootstrap and idempotency verified.");
  } finally {
    await client.query(`DELETE FROM studio_module_manifests WHERE module_key = $1`, [MODULE_KEY]);
    await writeFile(SEED_PATH, originalSeed);
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});