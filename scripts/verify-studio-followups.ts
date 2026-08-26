/**
 * Focused, dependency-free checks for the Studio follow-up security contract.
 * This is intentionally static: it does not require credentials or mutate a DB.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const routes = readFileSync("server/studio-routes.ts", "utf8");
const schema = readFileSync("shared/schema.ts", "utf8");
const migration = readFileSync("migrations/20260830_studio_import_and_org_records.sql", "utf8");
const durabilityMigration = readFileSync("migrations/20260831_studio_builder_durability.sql", "utf8");
const e2eCleanupMigration = readFileSync("migrations/20260901_studio_e2e_cleanup_guard.sql", "utf8");
const registrySync = readFileSync("server/studio-registry-sync.ts", "utf8");
const routesIndex = readFileSync("server/routes.ts", "utf8");
const seedRegistry = JSON.parse(readFileSync("convex/seed_modules.json", "utf8")) as { schemaVersion?: unknown; modules?: unknown };
const manifest = readFileSync("shared/studio-manifest.ts", "utf8");
const client = readFileSync("client/src/pages/studio.tsx", "utf8");

// The import route is admin-gated before it can audit or process the JSON-only inventory.
assert.match(routes, /app\.post\("\/api\/admin\/studio\/import-inventory", requireStudioAuth, requireStudioAdmin, requireStudioOperationalCapacity\("inventory"\), requireStudioOperationalCapacity\("audit"\), auditImportAttempt/);
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
assert.match(routes, /Public record fields must use select or checkbox controls/);
assert.match(manifest, /Public fields must be declared select or checkbox controls/);
assert.match(routes, /This module does not accept organization record submissions/);
assert.match(routes, /MAX_ORGANIZATION_RECORDS = 100/);
assert.match(manifest, /retentionDays/);
assert.match(routes, /organization"\, requireAuth, requireExplicitStudioOrgSelection/);
// The UI must keep public and organization values on separate API paths and
// must use the server's retention response field rather than inventing one.
assert.match(client, /studio-public-runtime-form/);
assert.match(client, /studio-organization-runtime-form/);
assert.match(client, /scope === "public" \? "records" : "organization-records"/);
assert.match(client, /retentionUntil/);
// Builder and durability controls must be explicit and server-owned.
assert.match(routes, /"\/api\/admin\/studio\/generate", requireStudioAuth, requireStudioAdmin, studioDraftRateLimit, requireStudioOperationalCapacity\("audit"\)/);
assert.match(routes, /"\/api\/admin\/studio\/modify", requireStudioAuth, requireStudioAdmin, studioDraftRateLimit, requireStudioOperationalCapacity\("audit"\)/);
assert.match(routes, /rejectUnsafeStudioRequest/);
assert.match(routes, /preserveStudioIdentity/);
assert.match(routes, /changesApplied: false/);
assert.match(routes, /Retry-After/);
assert.match(routes, /studio_rate_limit_windows/);
assert.match(routes, /MAX_ACTIVE_STUDIO_AUDIT_EVENTS = 50_000/);
assert.match(routes, /STUDIO_AUDIT_RETENTION_DAYS = 730/);
assert.match(routes, /STUDIO_IMPORT_RETENTION_DAYS = 90/);
assert.match(durabilityMigration, /studio_manifest_cache_revisions/);
assert.match(durabilityMigration, /studio_rate_limit_windows/);
assert.match(durabilityMigration, /retention_until/);
assert.match(durabilityMigration, /append-only until their retention window expires/);
assert.match(e2eCleanupMigration, /OLD\.actor_user_id LIKE 'e2e-%'/);
assert.match(e2eCleanupMigration, /OLD\.created_by_user_id LIKE 'e2e-%'/);
assert.match(e2eCleanupMigration, /current_setting\('studio\.test_cleanup', true\) = 'enabled'/);
assert.match(manifest, /studioGeneratedManifestSchema/);
assert.match(manifest, /systemPrompt/);
assert.match(manifest, /outputFormat/);
assert.match(client, /✨ Generate Tool/);
assert.match(client, /Ask AI to Modify/);
assert.match(client, /studio-modify-apply/);
// Registry export is declarative-only, admin-gated, and bootstraps only an empty registry.
assert.match(routes, /"\/api\/admin\/studio\/export", requireStudioAuth, requireStudioAdmin/);
assert.match(routes, /exportStudioRegistryToSeedFile/);
assert.match(routes, /registry\.auto-exported/);
assert.match(client, /Export to Git \/ Download Config/);
assert.match(client, /studio-export-git-button/);
assert.match(client, /isStudioSeedFile/);
assert.match(client, /studio-export-success/);
assert.match(registrySync, /convex", "seed_modules\.json/);
assert.match(registrySync, /studioManifestSchema\.safeParse/);
assert.match(registrySync, /pg_advisory_xact_lock\(hashtext\('studio_registry_export'\)\)/);
assert.match(registrySync, /pg_advisory_xact_lock\(hashtext\('studio_registry_bootstrap'\)\)/);
assert.match(registrySync, /randomUUID\(\)/);
assert.match(registrySync, /Duplicate Studio seed version/);
assert.match(registrySync, /Seed manifest moduleKey must match its entry/);
assert.match(registrySync, /registryCount > 0\) return \{ seeded: 0, skipped: true \}/);
assert.match(registrySync, /onConflictDoNothing/);
assert.match(routesIndex, /seedStudioRegistryFromFile\(\)/);
assert.match(readFileSync("scripts/verify-studio-registry-bootstrap.ts", "utf8"), /empty Studio registry/);
assert.equal(seedRegistry.schemaVersion, 1, "seed registry must carry schema version 1");
assert.ok(Array.isArray(seedRegistry.modules), "seed registry must contain a module array");
console.log("Studio follow-up verification passed.");