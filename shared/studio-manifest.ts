import { z } from "zod";

/** Declarative-only Studio contract. Nothing in this file is executable. */
export const STUDIO_MODULE_TYPES = ["grant-workflow"] as const;
export const STUDIO_FIELD_TYPES = ["text", "textarea", "select", "checkbox", "date"] as const;
export const STUDIO_ACTION_TYPES = ["submit-record", "generate-draft"] as const;
export const STUDIO_LIFECYCLE_STAGES = ["draft", "published", "archived"] as const;
export const STUDIO_DATA_SCOPES = ["public", "organization", "aggregate"] as const;
export const STUDIO_RESERVED_ROUTE_SLUGS = new Set([
  "admin", "api", "auth", "assets", "health", "login", "logout", "studio", "modules",
]);

export const studioRouteSlugSchema = z.string().regex(
  /^[a-z][a-z0-9-]{1,62}$/,
  "Route slug must be lowercase kebab-case",
).refine((slug) => !STUDIO_RESERVED_ROUTE_SLUGS.has(slug), "Route slug is reserved");

const safeText = z.string().trim().min(1).max(240);
const fieldKey = z.string().regex(/^[a-z][a-z0-9_]{1,62}$/);

export const studioFieldSchema = z.object({
  key: fieldKey,
  label: safeText,
  type: z.enum(STUDIO_FIELD_TYPES),
  required: z.boolean().default(false),
  helpText: z.string().trim().max(500).optional(),
  options: z.array(safeText).min(1).max(25).optional(),
  dataScope: z.enum(STUDIO_DATA_SCOPES).default("organization"),
}).strict().superRefine((field, ctx) => {
  if (field.type === "select" && !field.options) ctx.addIssue({ code: "custom", message: "Select fields require options", path: ["options"] });
  if (field.type !== "select" && field.options) ctx.addIssue({ code: "custom", message: "Only select fields may have options", path: ["options"] });
  if (/(name|email|phone|address|birth|ssn|dob|social|contact)/i.test(field.key)) {
    ctx.addIssue({ code: "custom", message: "PII-like field keys are not allowed", path: ["key"] });
  }
});

export const studioActionSchema = z.object({
  type: z.enum(STUDIO_ACTION_TYPES),
  label: safeText,
  dataScope: z.enum(STUDIO_DATA_SCOPES).default("organization"),
}).strict();

export const studioProvenanceSchema = z.object({
  source: z.enum(["human", "ai-assisted"]),
  reviewedByHuman: z.boolean(),
  sourceDescription: z.string().trim().min(1).max(500),
}).strict();

export const studioManifestSchema = z.object({
  moduleKey: studioRouteSlugSchema,
  moduleType: z.literal("grant-workflow"),
  title: safeText,
  description: z.string().trim().min(1).max(2_000),
  routeSlug: studioRouteSlugSchema,
  lifecycleStage: z.enum(STUDIO_LIFECYCLE_STAGES).default("draft"),
  public: z.boolean().default(false),
  dataScope: z.enum(STUDIO_DATA_SCOPES),
  fields: z.array(studioFieldSchema).min(1).max(30),
  actions: z.array(studioActionSchema).min(1).max(2),
  provenance: studioProvenanceSchema,
}).strict().superRefine((manifest, ctx) => {
  if (new Set(manifest.fields.map((field) => field.key)).size !== manifest.fields.length) {
    ctx.addIssue({ code: "custom", message: "Field keys must be unique", path: ["fields"] });
  }
  if (manifest.public && manifest.lifecycleStage !== "published") {
    ctx.addIssue({ code: "custom", message: "Only published manifests may be public", path: ["public"] });
  }
  if (manifest.routeSlug !== manifest.moduleKey) {
    ctx.addIssue({ code: "custom", message: "routeSlug must match moduleKey so public URLs are canonical", path: ["routeSlug"] });
  }
});

export const studioDraftRequestSchema = z.object({
  prompt: z.string().trim().min(10).max(2_000),
  suppliedManifest: studioManifestSchema.optional(),
}).strict();

export type StudioManifest = z.infer<typeof studioManifestSchema>;
export type StudioField = z.infer<typeof studioFieldSchema>;
export type StudioAction = z.infer<typeof studioActionSchema>;

/** Drops lifecycle/provenance data that should never be disclosed to public runtime callers. */
export function toPublicStudioManifest(manifest: StudioManifest) {
  return {
    moduleKey: manifest.moduleKey,
    moduleType: manifest.moduleType,
    title: manifest.title,
    description: manifest.description,
    routeSlug: manifest.routeSlug,
    dataScope: manifest.dataScope,
    fields: manifest.fields.map(({ key, label, type, required, helpText, options, dataScope }) => ({
      key, label, type, required, ...(helpText ? { helpText } : {}), ...(options ? { options } : {}), dataScope,
    })),
    actions: manifest.actions.map(({ type, label, dataScope }) => ({ type, label, dataScope })),
  };
}