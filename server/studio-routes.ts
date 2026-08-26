import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { studioAuditEvents, studioModuleManifests } from "@shared/schema";
import {
  studioDraftRequestSchema, studioManifestSchema, studioRouteSlugSchema,
  toPublicStudioManifest, type StudioManifest,
} from "@shared/studio-manifest";
import { db, storage } from "./storage";
import { generateAIJSON } from "./ai-provider";
import { getPublishedStudioManifest, invalidateStudioManifest } from "./studio-runtime-registry";

const draftBuckets = new Map<string, { count: number; resetAt: number }>();
const recordBuckets = new Map<string, { count: number; resetAt: number }>();
const ADMIN_ROLES = new Set(["admin"]);
const maxDraftsPerMinute = 5;
const maxRecordsPerMinute = 20;

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

const STUDIO_DRAFT_SYSTEM_PROMPT = `You create only a declarative Studio module manifest JSON object matching the supplied schema.
Return JSON only. Never include code, URLs, SQL, scripts, executable instructions, raw prompts, personal data fields, names, email, phone, addresses, birth dates, or identifiers.
Only moduleType "grant-workflow", field types text/textarea/select/checkbox/date, and action types submit-record/generate-draft are permitted.
Use truthful, bounded descriptions; do not fabricate facts, outcomes, statistics, sources, or provenance. Set provenance source to ai-assisted and reviewedByHuman false. The human must review before publishing.`;

export function registerStudioRoutes(app: Express) {
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
      if (!manifest.actions.some((action) => action.type === "submit-record")) {
        return res.status(403).json({ error: "This module does not accept record submissions." });
      }
      const values = z.record(z.union([z.string().trim().max(2_000), z.boolean()])).safeParse(req.body?.values);
      if (!values.success) return res.status(400).json({ error: "Invalid record values." });
      const allowed = new Map(manifest.fields.map((field) => [field.key, field]));
      for (const [key, value] of Object.entries(values.data)) {
        const field = allowed.get(key);
        if (!field || field.dataScope !== "public") return res.status(400).json({ error: "Record contains a disallowed field." });
        if (field.type === "checkbox" && typeof value !== "boolean") return res.status(400).json({ error: `Field must be a checkbox: ${key}` });
        if (field.type !== "checkbox" && typeof value !== "string") return res.status(400).json({ error: `Field must be text: ${key}` });
        if (field.type === "date" && typeof value === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return res.status(400).json({ error: `Field must be an ISO date: ${key}` });
        }
        if (field.type === "select" && typeof value === "string" && !field.options?.includes(value)) {
          return res.status(400).json({ error: `Field contains an unsupported option: ${key}` });
        }
      }
      for (const field of manifest.fields) if (field.required && !(field.key in values.data)) return res.status(400).json({ error: `Required field missing: ${field.key}` });
      // The foundation deliberately records only the schema keys, never submitted values or identity.
      await audit(moduleKey.data, "record.submitted", undefined, undefined, { fieldKeys: Object.keys(values.data).sort(), dataScope: manifest.dataScope });
      res.status(202).json({ accepted: true });
    } catch (error: any) {
      console.error("[studio] record error:", error);
      res.status(500).json({ error: "Failed to submit Studio record." });
    }
  });
}