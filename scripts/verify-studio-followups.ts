/**
 * Focused, dependency-free checks for the Studio follow-up security contract.
 * This is intentionally static: it does not require credentials or mutate a DB.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const routes = readFileSync("server/studio-routes.ts", "utf8");
const schema = readFileSync("shared/schema.ts", "utf8");
const migration = readFileSync("migrations/20260830_studio_import_and_org_records.sql", "utf8");
const manifest = readFileSync("shared/studio-manifest.ts", "utf8");
const client = readFileSync("client/src/pages/studio.tsx", "utf8");

// The import route is admin-gated before it can audit or process the JSON-only inventory.
assert.match(routes, /app\.post\("\/api\/admin\/studio\/import-inventory", requireStudioAuth, requireStudioAdmin, auditImportAttempt/);
assert.match(routes, /MAX_INVENTORY_FILES = 500/);
assert.match(routes, /MAX_INVENTORY_BYTES = 5_000_000/);
assert.match(routes, /decodeURIComponent\(input\)/);
assert.match(routes, /input\.includes\("%"\)/);
assert.match(routes, /SENSITIVE_INVENTORY_PATH/);
assert.match(routes, /duplicate_path/);
assert.match(routes, /path: "\[blocked sensitive file\]"/);
assert.match(routes, /organization-records/);
assert.match(routes, /requireAuth, requireExplicitStudioOrgSelection, loadCallerOrg, requireOrg/);
assert.match(routes, /ORG_SELECTION_FORBIDDEN/);
assert.match(routes, /eq\(studioModuleRecords\.moduleKey, moduleKey\.data\), eq\(studioModuleRecords\.orgId, org\.id\)/);
assert.match(routes, /actorUserId !== userId && !isOwner/);
assert.match(routes, /getPublishedStudioManifestForOrganization/);
assert.match(routes, /organization-record\.created/);
assert.match(routes, /organization-record\.deleted/);
assert.match(routes, /purgeExpiredOrganizationRecords/);
assert.match(routes, /purgeAllExpiredOrganizationRecords/);
assert.match(routes, /scheduled retention sweep failed/);
assert.match(routes, /gt\(studioModuleRecords\.retentionUntil, new Date\(\)\)/);
assert.match(schema, /studioModuleRecords = pgTable/);
assert.match(schema, /moduleVersion/);
assert.match(schema, /retentionUntil/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS "studio_import_inventories"/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS "studio_module_records"/);
assert.match(migration, /studio_module_records_module_org_time_idx/);
assert.match(migration, /studio_module_records_retention_idx/);
assert.match(migration, /studio_import_inventories_append_only/);
// Public records route must retain its explicit public-scope gate.
assert.match(routes, /validateDeclaredValues\(manifest\.fields, values\.data\.values, \["public"\]\)/);
assert.match(routes, /action\.type === "submit-record" && action\.dataScope === "public"/);
assert.match(routes, /Public record fields cannot collect free text/);
assert.match(manifest, /Public fields cannot collect free text/);
// The UI must keep public and organization values on separate API paths and
// must use the server's retention response field rather than inventing one.
assert.match(client, /studio-public-runtime-form/);
assert.match(client, /studio-organization-runtime-form/);
assert.match(client, /scope === "public" \? "records" : "organization-records"/);
assert.match(client, /retentionUntil/);
console.log("Studio follow-up verification passed.");