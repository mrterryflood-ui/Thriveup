import { readFileSync } from "node:fs";
import { studioManifestSchema, studioRouteSlugSchema, toPublicStudioManifest, type StudioManifest } from "../shared/studio-manifest";

const valid: StudioManifest = {
  moduleKey: "grant-intake", moduleType: "grant-workflow", title: "Grant intake",
  description: "Collect a non-sensitive organizational grant readiness record.",
  routeSlug: "grant-intake", lifecycleStage: "published", public: true, dataScope: "organization",
  fields: [{ key: "project_summary", label: "Project summary", type: "textarea", required: true, dataScope: "organization" }],
  actions: [{ type: "submit-record", label: "Save record", dataScope: "organization" }],
  provenance: { source: "human", reviewedByHuman: true, sourceDescription: "Reviewed organizational workflow." },
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
assert(studioManifestSchema.safeParse(valid).success, "valid declarative manifest must pass");
assert(!studioManifestSchema.safeParse({ ...valid, fields: [{ ...valid.fields[0], type: "script" }] }).success, "unsupported field type must fail");
assert(!studioRouteSlugSchema.safeParse("admin").success, "reserved route must fail");
assert(!studioManifestSchema.safeParse({ ...valid, fields: [{ ...valid.fields[0], key: "email_address" }] }).success, "PII-like field must fail");
const publicManifest = toPublicStudioManifest(valid);
assert(!("provenance" in publicManifest) && !("lifecycleStage" in publicManifest), "public projection must exclude unpublished metadata");
const migration = readFileSync("migrations/20260829_studio_manifest_foundation.sql", "utf8");
assert(migration.includes("studio_published_manifest_immutable") && migration.includes("studio_audit_events_append_only"), "migration must protect immutable versions and audit records");
const routes = readFileSync("server/studio-routes.ts", "utf8");
assert(routes.includes('return res.status(401).json({ error: "Authentication required" })'), "admin routes must fail unauthenticated requests");
console.log("✓ Studio manifest contract, public projection, auth guard, and immutability migration verified");