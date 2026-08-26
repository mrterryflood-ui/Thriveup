import { readFileSync } from "node:fs";
import { studioGeneratedManifestSchema, studioManifestSchema, studioRouteSlugSchema, toPublicStudioManifest, type StudioManifest } from "../shared/studio-manifest";

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
const generated = {
  ...valid,
  lifecycleStage: "draft" as const,
  public: false,
  provenance: { source: "ai-assisted" as const, reviewedByHuman: false, sourceDescription: "Generated safe draft for human review." },
  stages: [{ key: "review", label: "Review", description: "Review the declared organizational readiness inputs." }],
  inputContract: { confirmation: "Only the declared readiness field is accepted.", allowedFieldKeys: ["project_summary"] },
  systemPrompt: { purpose: "Produce a bounded readiness summary.", safetyGuidance: ["Do not invent facts.", "Do not request personal information."] },
  outputFormat: { format: "review-checklist" as const, sections: [{ key: "readiness", label: "Readiness" }] },
};
assert(studioGeneratedManifestSchema.safeParse(generated).success, "complete generated manifest metadata must pass");
assert(!studioGeneratedManifestSchema.safeParse({ ...generated, stages: undefined }).success, "generated manifests must include ordered stages");
assert(!studioGeneratedManifestSchema.safeParse({ ...generated, systemPrompt: { ...generated.systemPrompt, purpose: "Run this SQL script" } }).success, "executable metadata must fail");
assert(!studioGeneratedManifestSchema.safeParse({ ...generated, inputContract: { ...generated.inputContract, allowedFieldKeys: ["other_key"] } }).success, "input contract must match declared fields");
const publicManifest = toPublicStudioManifest(valid);
assert(!("provenance" in publicManifest) && !("lifecycleStage" in publicManifest), "public projection must exclude unpublished metadata");
const generatedPublic = toPublicStudioManifest(studioGeneratedManifestSchema.parse(generated));
assert(!("systemPrompt" in generatedPublic) && !("inputContract" in generatedPublic) && "stages" in generatedPublic && "outputFormat" in generatedPublic, "public projection must expose only safe user-facing generated metadata");
const migration = readFileSync("migrations/20260829_studio_manifest_foundation.sql", "utf8");
assert(migration.includes("studio_published_manifest_immutable") && migration.includes("studio_audit_events_append_only"), "migration must protect immutable versions and audit records");
const routes = readFileSync("server/studio-routes.ts", "utf8");
assert(routes.includes('return res.status(401).json({ error: "Authentication required" })'), "admin routes must fail unauthenticated requests");
assert(routes.includes('"/api/admin/studio/generate", requireStudioAuth, requireStudioAdmin'), "tool generation must remain admin-authenticated");
assert(routes.includes('"/api/admin/studio/modify", requireStudioAuth, requireStudioAdmin'), "tool modification must remain admin-authenticated");
assert(routes.includes("STUDIO_AI_NONNEGOTIABLES"), "AI builder must declare anti-fabrication guardrails");
console.log("✓ Studio manifest contract, public projection, auth guard, and immutability migration verified");