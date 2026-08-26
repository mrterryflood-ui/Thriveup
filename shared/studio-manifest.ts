import { z } from "zod";

/** Declarative-only Studio contract. Nothing in this file is executable. */
export const STUDIO_MODULE_TYPES = ["grant-workflow"] as const;
export const STUDIO_FIELD_TYPES = ["text", "textarea", "select", "checkbox", "date"] as const;
export const STUDIO_ACTION_TYPES = ["submit-record"] as const;
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
const piiLiteral = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)|(?:\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b)|(?:\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b)/i;
const executableLiteral = /(?:\b(?:javascript|typescript|sql|shell|bash|powershell|docker|redis|pgvector|npm|yarn|pnpm|curl|fetch|function|class|import|export)\b|https?:\/\/|<script\b|```|ignore\s+(?:all\s+)?previous)/i;
const safeMetadataText = z.string().trim().min(1).max(1_200).refine(
  (value) => !piiLiteral.test(value) && !executableLiteral.test(value),
  "Studio metadata cannot include personal data, executable instructions, URLs, or prompt-injection language.",
);

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
  if (field.dataScope === "public" && field.type !== "select" && field.type !== "checkbox") {
    ctx.addIssue({ code: "custom", message: "Public fields must be declared select or checkbox controls; free text and exact dates are not public-safe.", path: ["type"] });
  }
  if (field.dataScope === "public" && [field.label, field.helpText, ...(field.options ?? [])].some((text) => Boolean(text && piiLiteral.test(text)))) {
    ctx.addIssue({ code: "custom", message: "Public field metadata cannot contain an email address, phone number, or government identifier.", path: ["label"] });
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

const stageKey = z.string().regex(/^[a-z][a-z0-9_]{1,62}$/);
export const studioStageSchema = z.object({
  key: stageKey,
  label: safeText,
  description: safeMetadataText,
}).strict();

export const studioInputContractSchema = z.object({
  confirmation: safeMetadataText,
  allowedFieldKeys: z.array(fieldKey).min(1).max(30),
}).strict();

export const studioSystemPromptMetadataSchema = z.object({
  purpose: safeMetadataText,
  safetyGuidance: z.array(safeMetadataText).min(1).max(8),
}).strict();

export const studioOutputFormatSchema = z.object({
  format: z.enum(["structured-summary", "review-checklist", "status-update"]),
  sections: z.array(z.object({
    key: stageKey,
    label: safeText,
  }).strict()).min(1).max(8),
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
  retentionDays: z.number().int().min(1).max(365).default(365),
  fields: z.array(studioFieldSchema).min(1).max(30),
  actions: z.array(studioActionSchema).min(1).max(2),
  stages: z.array(studioStageSchema).min(1).max(12).optional(),
  inputContract: studioInputContractSchema.optional(),
  systemPrompt: studioSystemPromptMetadataSchema.optional(),
  outputFormat: studioOutputFormatSchema.optional(),
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
  if (manifest.dataScope === "public" && [...manifest.fields, ...manifest.actions].some((entry) => entry.dataScope !== "public")) {
    ctx.addIssue({ code: "custom", message: "A public module cannot declare organization or aggregate fields/actions.", path: ["dataScope"] });
  }
  if ([manifest.title, manifest.description, ...manifest.fields.filter((field) => field.dataScope === "public").flatMap((field) => [field.label, field.helpText, ...(field.options ?? [])]), ...manifest.actions.filter((action) => action.dataScope === "public").map((action) => action.label)].some((text) => Boolean(text && piiLiteral.test(text)))) {
    ctx.addIssue({ code: "custom", message: "Public manifest content cannot contain an email address, phone number, or government identifier.", path: ["title"] });
  }
  if (manifest.stages && new Set(manifest.stages.map((stage) => stage.key)).size !== manifest.stages.length) {
    ctx.addIssue({ code: "custom", message: "Stage keys must be unique", path: ["stages"] });
  }
  if (manifest.inputContract) {
    const expected = [...manifest.fields.map((field) => field.key)].sort().join("|");
    const actual = [...manifest.inputContract.allowedFieldKeys].sort().join("|");
    if (expected !== actual) ctx.addIssue({ code: "custom", message: "Input contract must confirm exactly the declared field keys", path: ["inputContract", "allowedFieldKeys"] });
  }
});

export const studioDraftRequestSchema = z.object({
  prompt: z.string().trim().min(10).max(2_000),
  suppliedManifest: studioManifestSchema.optional(),
}).strict();

export const studioModifyRequestSchema = z.object({
  instruction: z.string().trim().min(10).max(2_000),
  manifest: studioManifestSchema,
}).strict();

/** Generated candidates must include the bounded metadata that legacy manifests did not require. */
export const studioGeneratedManifestSchema = studioManifestSchema.superRefine((manifest, ctx) => {
  for (const key of ["stages", "inputContract", "systemPrompt", "outputFormat"] as const) {
    if (!manifest[key]) ctx.addIssue({ code: "custom", message: `Generated manifests require ${key} metadata`, path: [key] });
  }
});

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
    ...(manifest.stages ? { stages: manifest.stages.map(({ key, label, description }) => ({ key, label, description })) } : {}),
    ...(manifest.outputFormat ? { outputFormat: manifest.outputFormat } : {}),
  };
}