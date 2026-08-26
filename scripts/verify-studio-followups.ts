/**
 * Focused, dependency-free checks for the Studio follow-up security contract.
 * This is intentionally static: it does not require credentials or mutate a DB.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const routes = readFileSync("server/studio-routes.ts", "utf8");
const schema = readFileSync("shared/schema.ts", "utf8");
const migration = readFileSync("migrations/20260830_studio_import_and_org_records.sql", "utf8");

assert.match(routes, /import-inventory/);
assert.match(routes, /requireStudioAuth, requireStudioAdmin/);
assert.match(routes, /path\.startsWith\("\/"\)/);
assert.match(routes, /private\.\?key|id_rsa/);
assert.match(routes, /organization-records/);
assert.match(routes, /requireAuth, loadCallerOrg, requireOrg/);
assert.match(routes, /eq\(studioModuleRecords\.orgId, org\.id\)/);
assert.match(routes, /actorUserId !== userId && !isOwner/);
assert.match(routes, /getPublishedStudioManifestForOrganization/);
assert.match(schema, /studioModuleRecords = pgTable/);
assert.match(schema, /moduleVersion/);
assert.match(schema, /retentionUntil/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS "studio_import_inventories"/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS "studio_module_records"/);
assert.match(migration, /studio_module_records_module_org_time_idx/);
// Public records route must retain its explicit public-scope gate.
assert.match(routes, /field\.dataScope !== "public"/);
console.log("Studio follow-up verification passed.");