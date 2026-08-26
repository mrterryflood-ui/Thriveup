import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq, gt, lte } from "drizzle-orm";
import { z } from "zod";
import { organizationMembers, studioAuditEvents, studioModuleManifests, studioImportInventories, studioModuleRecords } from "@shared/schema";
import {
  studioDraftRequestSchema, studioManifestSchema, studioRouteSlugSchema,
  toPublicStudioManifest, type StudioManifest,
} from "@shared/studio-manifest";
import { db, storage } from "./storage";
import { generateAIJSON } from "./ai-provider";
import { getPublishedStudioManifest, getPublishedStudioManifestForOrganization, invalidateStudioManifest } from "./studio-runtime-registry";
import { requireAuth, loadCallerOrg, requireOrg, getCallerOrg, getCallerOrgRole } from "./tenant-middleware";

const draftBuckets = new Map<string, { count: number; resetAt: number }>();
const recordBuckets = new Map<string, { count: number; resetAt: number }>();
const ADMIN_ROLES = new Set(["admin"]);
const maxDraftsPerMinute = 5;
const maxRecordsPerMinute = 20;
const MAX_INVENTORY_FILES = 500;
const MAX_INVENTORY_BYTES = 5_000_000;

function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub || user?.id;
}
function requireStudioAuth(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) return res.status(401).json({ error: "Authentication required" });
  next();
}
async function requireStudioAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const user = userId ? await storage.getUser(userId) : undefined;
    if (!user || !ADMIN_ROLES.has(user.role)) return res.status(403).json({ error: "Administrator access required" });
    next();
  } catch (error: any) {
    console.error("[studio] authorization error:", error);
    res.status(500).json({ error: "Unable to verify authorization." });
  }
}
function studioDraftRateLimit(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  const now = Date.now();
  const current = draftBuckets.get(userId);
  if (!current || current.resetAt <= now) {
    draftBuckets.set(userId, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (current.count >= maxDraftsPerMinute) return res.status(429).json({ error: "Draft rate limit exceeded. Try again shortly." });
  current.count += 1;
  next();
}
function studioRecordRateLimit(req: Request, res: Response, next: NextFunction) {
  const moduleKey = String(req.params.moduleKey || "unknown");
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const key = `${ip}:${moduleKey}`;
  const now = Date.now();
  const current = recordBuckets.get(key);
  if (!current || current.resetAt <= now) {
    recordBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (current.count >= maxRecordsPerMinute) {
    return res.status(429).json({ error: "Record submission rate limit exceeded. Try again shortly." });
  }
  current.count += 1;
  next();
}
async function audit(moduleKey: string, eventType: string, actorUserId?: string, manifestVersion?: number, eventData: Record<string, unknown> = {}) {
  await db.insert(studioAuditEvents).values({ moduleKey, eventType, actorUserId, manifestVersion, eventData });
}
function draftManifest(manifest: StudioManifest): StudioManifest {
  return { ...manifest, lifecycleStage: "draft", public: false };
}
const publishSchema = z.object({
  manifest: studioManifestSchema,
  // The confirm-publish step explicitly chooses whether this safe declarative
  // module is reachable publicly. Drafts never imply public exposure.
  makePublic: z.boolean().default(false),
}).strict();

const inventorySchema = z.object({
  sourceLabel: z.string().trim().min(1).max(120),
  files: z.array(z.object({
    path: z.string().min(1).max(500),
    size: z.number().int().nonnegative().max(MAX_INVENTORY_BYTES),
    language: z.string().trim().max(80).optional(),
  }).strict()).max(MAX_INVENTORY_FILES),
}).strict();
const recordInputSchema = z.object({
  values: z.record(z.union([z.string(), z.boolean()]))
    .refine((value) => Object.keys(value).length > 0 && Object.keys(value).length <= 30)
    .refine((value) => JSON.stringify(value).length <= 20_000),
}).strict();
const PII_LIKE_KEY = /(name|email|phone|address|birth|ssn|dob|social|contact|password|secret|credential|identifier|^id$)/i;
const PII_LIKE_VALUE = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)|(?:\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b)|(?:\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b)/i;
const SENSITIVE_INVENTORY_PATH = /(^|\/)(?:\.git(?:\/|$)|\.env(?:\..*)?|\.npmrc|\.yarnrc|\.pypirc|credentials?(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|id_rsa|authorized_keys|.*(?:private.?key|password).*$|.*\.(?:pem|key|p12|pfx))$/i;

function safelyDecodePath(input: string) {
  try { return decodeURIComponent(input); } catch { return input; }
}
function normalizeInventoryPath(input: string): { normalizedPath: string; path: string; classification: "blocked" | "review" | "unsupported"; reason?: string } {
  const decoded = safelyDecodePath(input).normalize("NFKC");
  const path = decoded.replaceAll("\\", "/").trim();
  const parts = path.split("/");
  const unsafePath = /[\u0000-\u001F\u007F]/.test(path)
    || path.startsWith("/")
    || /^[a-zA-Z]:\//.test(path)
    || input.includes("%")
    || parts.some((part) => part === ".." || part === "" || part === ".");
  if (unsafePath) {
    return { normalizedPath: path, path: "[blocked unsafe path]", classification: "blocked", reason: "unsafe-path" };
  }
  if (SENSITIVE_INVENTORY_PATH.test(path)) {
    return { normalizedPath: path, path: "[blocked sensitive file]", classification: "blocked", reason: "sensitive-file" };
  }
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".")).toLowerCase() : "";
  return {
    normalizedPath: path,
    path,
    classification: [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".css", ".html", ".sql", ".py", ".java", ".go", ".rs"].includes(ext) ? "review" : "unsupported",
    ...(ext ? {} : { reason: "extension-required" }),
  };
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return d.toISOString().slice(0, 10) === value;
}
function containsPiiLikeValue(value: string) {
  return PII_LIKE_VALUE.test(value);
}
function validateDeclaredValues(
  fields: StudioManifest["fields"],
  values: Record<string, string | boolean>,
  allowedScopes: Array<"public" | "organization" | "aggregate">,
) {
  const allowed = new Map(fields.filter((field) => allowedScopes.includes(field.dataScope)).map((field) => [field.key, field]));
  for (const [key, value] of Object.entries(values)) {
    const field = allowed.get(key);
    if (!field || PII_LIKE_KEY.test(key)) return "Record contains a disallowed field.";
    if (typeof value === "string" && (value.length > 2_000 || containsPiiLikeValue(value))) return "Record contains a disallowed value.";
    if (allowedScopes.includes("public") && (field.type === "text" || field.type === "textarea")) return "Public record fields cannot collect free text.";
    if (field.type === "checkbox" && typeof value !== "boolean") return `Field must be a checkbox: ${key}`;
    if (field.type !== "checkbox" && typeof value !== "string") return `Field must be text: ${key}`;
    if (field.type === "date" && typeof value === "string" && !validDate(value)) return `Field must be a valid ISO date: ${key}`;
    if (field.type === "select" && typeof value === "string" && !field.options?.includes(value)) return `Field contains an unsupported option: ${key}`;
  }
  for (const field of allowed.values()) {
    if (field.required && !(field.key in values)) return `Required field missing: ${field.key}`;
  }
  return undefined;
}
async function purgeExpiredOrganizationRecords(moduleKey: string, orgId: string) {
  await db.delete(studioModuleRecords).where(and(
    eq(studioModuleRecords.moduleKey, moduleKey),
    eq(studioModuleRecords.orgId, orgId),
    lte(studioModuleRecords.retentionUntil, new Date()),
  ));
}
async function purgeAllExpiredOrganizationRecords() {
  await db.delete(studioModuleRecords).where(lte(studioModuleRecords.retentionUntil, new Date()));
}
async function requireExplicitStudioOrgSelection(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const memberships = await db.select({ orgId: organizationMembers.orgId }).from(organizationMembers).where(eq(organizationMembers.userId, userId));
    const requestedOrgId = typeof req.headers["x-org-id"] === "string" ? req.headers["x-org-id"] : undefined;
    if (memberships.length > 1 && !requestedOrgId) {
      return res.status(400).json({ error: "Choose an organization before working with organization records.", code: "ORG_SELECTION_REQUIRED" });
    }
    if (requestedOrgId && memberships.length > 0 && !memberships.some((membership) => membership.orgId === requestedOrgId)) {
      return res.status(403).json({ error: "The selected organization is not available to this account.", code: "ORG_SELECTION_FORBIDDEN" });
    }
    next();
  } catch (error: any) {
    console.error("[studio] organization selection error:", error);
    return res.status(500).json({ error: "Unable to verify organization selection." });
  }
}
async function auditImportAttempt(req: Request, _res: Response, next: NextFunction) {
  try {
    await audit("import-inventory", "import.inventory.attempt", getUserId(req), undefined, { authenticated: Boolean(getUserId(req)) });
  } catch (error) {
    console.error("[studio] inventory attempt audit error:", error);
  }
  next();
}

const STUDIO_DRAFT_SYSTEM_PROMPT = `You create only a declarative Studio module manifest JSON object matching the supplied schema.
Return JSON only. Never include code, URLs, SQL, scripts, executable instructions, raw prompts, personal data fields, names, email, phone, addresses, birth dates, or identifiers.
Only moduleType "grant-workflow", field types text/textarea/select/checkbox/date, and action types submit-record/generate-draft are permitted.
Use truthful, bounded descriptions; do not fabricate facts, outcomes, statistics, sources, or provenance. Set provenance source to ai-assisted and reviewedByHuman false. The human must review before publishing.`;

export function registerStudioRoutes(app: Express) {
  // Retention must apply even if a tenant has no subsequent reads or writes.
  purgeAllExpiredOrganizationRecords().catch((error) => console.error("[studio] initial retention sweep failed:", error));
  const retentionSweep = setInterval(() => {
    purgeAllExpiredOrganizationRecords().catch((error) => console.error("[studio] scheduled retention sweep failed:", error));
  }, 24 * 60 * 60 * 1000);
  retentionSweep.unref();

  app.post("/api/admin/studio/import-inventory", requireStudioAuth, requireStudioAdmin, auditImportAttempt, async (req, res) => {
    const actor = getUserId(req);
    try {
      const input = inventorySchema.safeParse(req.body);
      const files = input.success ? input.data.files : [];
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (!input.success || totalSize > MAX_INVENTORY_BYTES) {
        await audit("import-inventory", "import.inventory.rejected", actor, undefined, { reason: "invalid_request" });
        return res.status(400).json({ error: "Invalid inventory. Provide strict JSON with at most 500 files and 5MB total." });
      }
      const normalized = files.map((file) => ({ ...file, ...normalizeInventoryPath(file.path) }));
      const seen = new Set<string>();
      if (normalized.some((file) => seen.has(file.normalizedPath) || !seen.add(file.normalizedPath))) {
        await audit("import-inventory", "import.inventory.rejected", actor, undefined, { reason: "duplicate_path" });
        return res.status(400).json({ error: "Inventory cannot contain duplicate paths." });
      }
      const items = normalized.map(({ normalizedPath: _normalizedPath, ...item }) => item);
      const counts = items.reduce<Record<string, number>>((out, item) => { out[item.classification] = (out[item.classification] || 0) + 1; return out; }, {});
      const [saved] = await db.insert(studioImportInventories).values({ sourceLabel: input.data.sourceLabel, actorUserId: actor, items, counts }).returning({ id: studioImportInventories.id });
      await audit("import-inventory", "import.inventory.created", actor, undefined, { inventoryId: saved.id, counts });
      return res.status(201).json({ inventoryId: saved.id, sourceLabel: input.data.sourceLabel, items, counts, reviewPlan: "Human review is required for every review item; blocked items are excluded and unsupported items require a documented decision." });
    } catch (error: any) {
      console.error("[studio] import inventory error:", error);
      try { await audit("import-inventory", "import.inventory.error", actor, undefined, { reason: "server_error" }); } catch (auditError) { console.error("[studio] inventory audit error:", auditError); }
      return res.status(500).json({ error: "Failed to create import inventory." });
    }
  });

  app.post("/api/studio/modules/:moduleKey/organization-records", requireAuth, requireExplicitStudioOrgSelection, loadCallerOrg, requireOrg, async (req, res) => {
    try {
      const moduleKey = studioRouteSlugSchema.safeParse(String(req.params.moduleKey));
      if (!moduleKey.success) return res.status(400).json({ error: "Invalid module key." });
      const org = getCallerOrg(req);
      const userId = getUserId(req);
      const loaded = await getPublishedStudioManifestForOrganization(moduleKey.data);
      if (!org || !userId || !loaded) return res.status(404).json({ error: "Module not found." });
      const input = recordInputSchema.safeParse(req.body);
      if (!input.success) return res.status(400).json({ error: "Invalid organization record values." });
      const recordError = validateDeclaredValues(loaded.manifest.fields, input.data.values, ["organization", "aggregate"]);
      if (recordError) return res.status(400).json({ error: recordError });
      await purgeExpiredOrganizationRecords(moduleKey.data, org.id);
      const retentionUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const [record] = await db.insert(studioModuleRecords).values({
        moduleKey: moduleKey.data, moduleVersion: loaded.version, orgId: org.id, actorUserId: userId,
        values: input.data.values, provenance: { source: "authenticated-organization-submission" }, retentionUntil,
      }).returning({ id: studioModuleRecords.id, moduleKey: studioModuleRecords.moduleKey, moduleVersion: studioModuleRecords.moduleVersion, values: studioModuleRecords.values, provenance: studioModuleRecords.provenance, retentionUntil: studioModuleRecords.retentionUntil, createdAt: studioModuleRecords.createdAt });
      await audit(moduleKey.data, "organization-record.created", userId, loaded.version, { recordId: record.id, orgId: org.id, retentionUntil: retentionUntil.toISOString() });
      return res.status(201).json({ record });
    } catch (error: any) {
      console.error("[studio] organization record error:", error);
      return res.status(500).json({ error: "Failed to save organization record." });
    }
  });

  app.get("/api/studio/modules/:moduleKey/organization-records", requireAuth, requireExplicitStudioOrgSelection, loadCallerOrg, requireOrg, async (req, res) => {
    try {
      const moduleKey = studioRouteSlugSchema.safeParse(String(req.params.moduleKey));
      const org = getCallerOrg(req);
      if (!moduleKey.success || !org) return res.status(404).json({ error: "Module not found." });
      await purgeExpiredOrganizationRecords(moduleKey.data, org.id);
      const records = await db.select({ id: studioModuleRecords.id, moduleKey: studioModuleRecords.moduleKey, moduleVersion: studioModuleRecords.moduleVersion, values: studioModuleRecords.values, provenance: studioModuleRecords.provenance, retentionUntil: studioModuleRecords.retentionUntil, createdAt: studioModuleRecords.createdAt }).from(studioModuleRecords).where(and(eq(studioModuleRecords.moduleKey, moduleKey.data), eq(studioModuleRecords.orgId, org.id), gt(studioModuleRecords.retentionUntil, new Date()))).orderBy(desc(studioModuleRecords.createdAt));
      return res.json({ records });
    } catch (error: any) { console.error("[studio] organization records error:", error); return res.status(500).json({ error: "Failed to load organization records." }); }
  });

  app.delete("/api/studio/modules/:moduleKey/organization-records/:recordId", requireAuth, requireExplicitStudioOrgSelection, loadCallerOrg, requireOrg, async (req, res) => {
    try {
      const moduleKey = studioRouteSlugSchema.safeParse(String(req.params.moduleKey));
      const org = getCallerOrg(req); const userId = getUserId(req);
      if (!moduleKey.success || !org || !userId) return res.status(404).json({ error: "Record not found." });
      await purgeExpiredOrganizationRecords(moduleKey.data, org.id);
      const [record] = await db.select().from(studioModuleRecords).where(and(eq(studioModuleRecords.id, String(req.params.recordId)), eq(studioModuleRecords.moduleKey, moduleKey.data), eq(studioModuleRecords.orgId, org.id), gt(studioModuleRecords.retentionUntil, new Date()))).limit(1);
      const isOwner = getCallerOrgRole(req) === "owner";
      if (!record || (record.actorUserId !== userId && !isOwner)) return res.status(404).json({ error: "Record not found." });
      await db.delete(studioModuleRecords).where(eq(studioModuleRecords.id, record.id));
      await audit(moduleKey.data, "organization-record.deleted", userId, record.moduleVersion, { recordId: record.id, orgId: org.id });
      return res.status(204).send();
    } catch (error: any) { console.error("[studio] organization record delete error:", error); return res.status(500).json({ error: "Failed to delete organization record." }); }
  });
  app.get("/api/admin/studio/capability", requireStudioAuth, requireStudioAdmin, async (_req, res) => {
    try {
      res.json({ moduleTypes: ["grant-workflow"], fieldTypes: ["text", "textarea", "select", "checkbox", "date"], actionTypes: ["submit-record", "generate-draft"], aiDrafting: true });
    } catch (error: any) {
      console.error("[studio] capability error:", error);
      res.status(500).json({ error: "Failed to load Studio capability." });
    }
  });

  app.post("/api/admin/studio/draft", requireStudioAuth, requireStudioAdmin, studioDraftRateLimit, async (req, res) => {
    try {
      const input = studioDraftRequestSchema.safeParse(req.body);
      if (!input.success) return res.status(400).json({ error: "Invalid draft request.", details: input.error.flatten() });
      // Explicit supplied manifests are deterministic seed input, never an invented fallback.
      let manifest: StudioManifest;
      let source: "ai" | "supplied-manifest";
      if (input.data.suppliedManifest) {
        manifest = draftManifest(input.data.suppliedManifest);
        source = "supplied-manifest";
      } else {
        let raw: unknown;
        try {
          raw = await generateAIJSON(input.data.prompt, STUDIO_DRAFT_SYSTEM_PROMPT);
        } catch (error: any) {
          console.error("[studio] AI draft provider error:", error);
          return res.status(502).json({ error: "Studio drafting provider is unavailable; no draft was created." });
        }
        const parsed = studioManifestSchema.safeParse(raw);
        if (!parsed.success) return res.status(422).json({ error: "AI returned an invalid Studio manifest.", details: parsed.error.flatten() });
        manifest = draftManifest(parsed.data);
        source = "ai";
      }
      const [existingDraft] = await db.select({ id: studioModuleManifests.id }).from(studioModuleManifests)
        .where(and(eq(studioModuleManifests.moduleKey, manifest.moduleKey), eq(studioModuleManifests.version, 0))).limit(1);
      if (existingDraft) return res.status(409).json({ error: "A draft already exists for this module key; submit it for publish as a new version." });
      const userId = getUserId(req)!;
      const [created] = await db.insert(studioModuleManifests).values({
        moduleKey: manifest.moduleKey, version: 0, lifecycleStage: "draft", isPublic: false, manifest, createdByUserId: userId,
      }).returning();
      await audit(manifest.moduleKey, "manifest.drafted", userId, 0, { source });
      return res.status(201).json({ manifest, source, draft: created });
    } catch (error: any) {
      console.error("[studio] draft error:", error);
      res.status(500).json({ error: "Failed to create Studio draft." });
    }
  });

  app.post("/api/admin/studio/validate", requireStudioAuth, requireStudioAdmin, async (req, res) => {
    try {
      const parsed = studioManifestSchema.safeParse(req.body?.manifest);
      if (!parsed.success) return res.status(400).json({ valid: false, error: parsed.error.flatten() });
      res.json({ valid: true, manifest: parsed.data });
    } catch (error: any) {
      console.error("[studio] validate error:", error);
      res.status(500).json({ error: "Failed to validate Studio manifest." });
    }
  });

  app.get("/api/admin/studio/modules", requireStudioAuth, requireStudioAdmin, async (_req, res) => {
    try {
      const rows = await db.select().from(studioModuleManifests).orderBy(desc(studioModuleManifests.createdAt)).limit(200);
      res.json({ modules: rows });
    } catch (error: any) {
      console.error("[studio] modules error:", error);
      res.status(500).json({ error: "Failed to load Studio modules." });
    }
  });

  app.get("/api/admin/studio/modules/:moduleKey/versions", requireStudioAuth, requireStudioAdmin, async (req, res) => {
    try {
      const moduleKey = studioRouteSlugSchema.safeParse(String(req.params.moduleKey));
      if (!moduleKey.success) return res.status(400).json({ error: "Invalid module key." });
      const versions = await db.select().from(studioModuleManifests).where(eq(studioModuleManifests.moduleKey, moduleKey.data)).orderBy(desc(studioModuleManifests.version));
      res.json({ versions });
    } catch (error: any) {
      console.error("[studio] versions error:", error);
      res.status(500).json({ error: "Failed to load Studio version history." });
    }
  });

  app.post("/api/admin/studio/modules/:moduleKey/publish", requireStudioAuth, requireStudioAdmin, async (req, res) => {
    try {
      const moduleKey = studioRouteSlugSchema.safeParse(String(req.params.moduleKey));
      const input = publishSchema.safeParse(req.body);
      if (!moduleKey.success || !input.success || input.data.manifest.moduleKey !== moduleKey.data) return res.status(400).json({ error: "Invalid publish request." });
      if (input.data.makePublic && (
        input.data.manifest.fields.some((field) => field.dataScope !== "public")
        || input.data.manifest.actions.some((action) => action.dataScope !== "public")
      )) {
        return res.status(400).json({ error: "Public modules may use only public-scoped fields and actions." });
      }
      const userId = getUserId(req)!;
      const [latest] = await db.select({ version: studioModuleManifests.version }).from(studioModuleManifests)
        .where(eq(studioModuleManifests.moduleKey, moduleKey.data)).orderBy(desc(studioModuleManifests.version)).limit(1);
      const version = (latest?.version ?? 0) + 1;
      const manifest: StudioManifest = {
        ...input.data.manifest,
        lifecycleStage: "published",
        public: input.data.makePublic,
        provenance: { ...input.data.manifest.provenance, reviewedByHuman: true },
      };
      const [created] = await db.insert(studioModuleManifests).values({
        moduleKey: moduleKey.data, version, lifecycleStage: "published", isPublic: manifest.public, manifest, createdByUserId: userId, publishedAt: new Date(),
      }).returning();
      await audit(moduleKey.data, "manifest.published", userId, version, { lifecycleStage: "published" });
      invalidateStudioManifest(moduleKey.data);
      res.status(201).json({ module: created });
    } catch (error: any) {
      console.error("[studio] publish error:", error);
      res.status(500).json({ error: "Failed to publish Studio manifest." });
    }
  });

  app.get("/api/studio/modules/:moduleKey", async (req, res) => {
    try {
      const moduleKey = studioRouteSlugSchema.safeParse(String(req.params.moduleKey));
      if (!moduleKey.success) return res.status(404).json({ error: "Module not found." });
      const manifest = await getPublishedStudioManifest(moduleKey.data);
      if (!manifest) return res.status(404).json({ error: "Module not found." });
      res.json({ module: toPublicStudioManifest(manifest) });
    } catch (error: any) {
      console.error("[studio] runtime error:", error);
      res.status(500).json({ error: "Failed to load Studio module." });
    }
  });

  app.post("/api/studio/modules/:moduleKey/records", studioRecordRateLimit, async (req, res) => {
    try {
      const moduleKey = studioRouteSlugSchema.safeParse(String(req.params.moduleKey));
      if (!moduleKey.success) return res.status(404).json({ error: "Module not found." });
      const manifest = await getPublishedStudioManifest(moduleKey.data);
      if (!manifest) return res.status(404).json({ error: "Module not found." });
      if (!manifest.actions.some((action) => action.type === "submit-record" && action.dataScope === "public")) {
        return res.status(403).json({ error: "This module does not accept record submissions." });
      }
      const values = recordInputSchema.safeParse({ values: req.body?.values });
      if (!values.success) return res.status(400).json({ error: "Invalid record values." });
      const recordError = validateDeclaredValues(manifest.fields, values.data.values, ["public"]);
      if (recordError) return res.status(400).json({ error: recordError });
      // The foundation deliberately records only the schema keys, never submitted values or identity.
      await audit(moduleKey.data, "record.submitted", undefined, undefined, { fieldKeys: Object.keys(values.data.values).sort(), dataScope: "public" });
      res.status(202).json({ accepted: true });
    } catch (error: any) {
      console.error("[studio] record error:", error);
      res.status(500).json({ error: "Failed to submit Studio record." });
    }
  });
}