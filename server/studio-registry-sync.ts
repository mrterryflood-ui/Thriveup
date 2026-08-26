import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { asc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { studioModuleManifests } from "@shared/schema";
import { studioManifestSchema, type StudioManifest } from "@shared/studio-manifest";
import { db } from "./storage";

const STUDIO_SEED_SCHEMA_VERSION = 1;
const STUDIO_SEED_FILE = path.resolve(process.cwd(), "convex", "seed_modules.json");
const STUDIO_SEED_ACTOR_ID = "studio-seed-bootstrap";
const studioLifecycleStageSchema = z.enum(["draft", "published", "archived"]);

const studioSeedEntrySchema = z.object({
  moduleKey: z.string().min(1),
  version: z.number().int().nonnegative(),
  lifecycleStage: studioLifecycleStageSchema,
  public: z.boolean(),
  manifest: studioManifestSchema,
}).strict();

const studioSeedFileSchema = z.object({
  schemaVersion: z.literal(STUDIO_SEED_SCHEMA_VERSION),
  modules: z.array(studioSeedEntrySchema).max(10_000),
}).strict().superRefine((seed, ctx) => {
  const seen = new Set<string>();
  for (const [index, entry] of seed.modules.entries()) {
    const identity = `${entry.moduleKey}:${entry.version}`;
    if (seen.has(identity)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["modules", index], message: `Duplicate Studio seed version: ${identity}` });
    }
    seen.add(identity);
    if (entry.manifest.moduleKey !== entry.moduleKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["modules", index, "manifest", "moduleKey"], message: "Seed manifest moduleKey must match its entry." });
    }
    if (entry.manifest.lifecycleStage !== entry.lifecycleStage) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["modules", index, "manifest", "lifecycleStage"], message: "Seed manifest lifecycle stage must match its entry." });
    }
    if (entry.manifest.public !== entry.public) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["modules", index, "manifest", "public"], message: "Seed manifest visibility must match its entry." });
    }
  }
});

export type StudioSeedFile = z.infer<typeof studioSeedFileSchema>;

function seedFilePayload(modules: StudioSeedFile["modules"]): StudioSeedFile {
  return {
    schemaVersion: STUDIO_SEED_SCHEMA_VERSION,
    modules: [...modules].sort((a, b) => a.moduleKey.localeCompare(b.moduleKey) || a.version - b.version),
  };
}

async function readStudioSeedFile(): Promise<StudioSeedFile> {
  const content = await readFile(STUDIO_SEED_FILE, "utf8");
  const parsed = studioSeedFileSchema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new Error(`Studio seed file is invalid: ${parsed.error.message}`);
  return parsed.data;
}

export function studioSeedFilePath() {
  return STUDIO_SEED_FILE;
}

export async function exportStudioRegistryToSeedFile(): Promise<StudioSeedFile> {
  return db.transaction(async (tx) => {
    // The lock covers the DB snapshot and atomic file replacement together.
    // Without it, an older concurrent publish could finish last and replace a
    // newer registry export with a stale snapshot.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('studio_registry_export'))`);
    const rows = await tx.select({
      moduleKey: studioModuleManifests.moduleKey,
      version: studioModuleManifests.version,
      lifecycleStage: studioModuleManifests.lifecycleStage,
      public: studioModuleManifests.isPublic,
      manifest: studioModuleManifests.manifest,
    }).from(studioModuleManifests)
      .orderBy(asc(studioModuleManifests.moduleKey), asc(studioModuleManifests.version));

    const modules: StudioSeedFile["modules"] = [];
    for (const row of rows) {
      const parsed = studioManifestSchema.safeParse(row.manifest);
      if (!parsed.success) throw new Error(`Cannot export invalid Studio manifest ${row.moduleKey} v${row.version}.`);
      const lifecycleStage = studioLifecycleStageSchema.safeParse(row.lifecycleStage);
      if (!lifecycleStage.success) throw new Error(`Cannot export Studio manifest ${row.moduleKey} v${row.version} with an unknown lifecycle stage.`);
      modules.push({
        moduleKey: row.moduleKey,
        version: row.version,
        lifecycleStage: lifecycleStage.data,
        public: row.public,
        manifest: { ...parsed.data, lifecycleStage: lifecycleStage.data, public: row.public },
      });
    }

    const payload = seedFilePayload(modules);
    await mkdir(path.dirname(STUDIO_SEED_FILE), { recursive: true });
    const temporaryPath = `${STUDIO_SEED_FILE}.tmp-${process.pid}-${randomUUID()}`;
    try {
      await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "w" });
      await rename(temporaryPath, STUDIO_SEED_FILE);
    } finally {
      await rm(temporaryPath, { force: true });
    }
    return payload;
  });
}

export async function seedStudioRegistryFromFile(): Promise<{ seeded: number; skipped: boolean }> {
  let seed: StudioSeedFile;
  try {
    seed = await readStudioSeedFile();
  } catch (error) {
    throw new Error(`Studio registry is empty and cannot bootstrap: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (seed.modules.length === 0) return { seeded: 0, skipped: false };
  return db.transaction(async (tx) => {
    // Startup can happen in more than one process. Serialize the empty-table
    // check and inserts so each instance reports the actual result.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('studio_registry_bootstrap'))`);
    const [{ registryCount }] = await tx.select({ registryCount: count() }).from(studioModuleManifests);
    if (registryCount > 0) return { seeded: 0, skipped: true };
    let seeded = 0;
    for (const entry of seed.modules) {
      const manifest: StudioManifest = {
        ...entry.manifest,
        lifecycleStage: entry.lifecycleStage,
        public: entry.public,
      };
      const inserted = await tx.insert(studioModuleManifests).values({
        moduleKey: entry.moduleKey,
        version: entry.version,
        lifecycleStage: entry.lifecycleStage,
        isPublic: entry.public,
        manifest,
        createdByUserId: STUDIO_SEED_ACTOR_ID,
        ...(entry.lifecycleStage === "published" ? { publishedAt: new Date() } : {}),
      }).onConflictDoNothing().returning({ id: studioModuleManifests.id });
      seeded += inserted.length;
    }
    return { seeded, skipped: false };
  });
}