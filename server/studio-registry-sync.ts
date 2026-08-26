import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { studioModuleManifests } from "@shared/schema";
import { studioManifestSchema, type StudioManifest } from "@shared/studio-manifest";
import { db } from "./storage";

const STUDIO_SEED_SCHEMA_VERSION = 1;
const STUDIO_SEED_FILE = path.resolve(process.cwd(), "convex", "seed_modules.json");

const studioSeedEntrySchema = z.object({
  moduleKey: z.string().min(1),
  version: z.number().int().nonnegative(),
  lifecycleStage: z.enum(["draft", "published", "archived"]),
  public: z.boolean(),
  manifest: studioManifestSchema,
}).strict();

const studioSeedFileSchema = z.object({
  schemaVersion: z.literal(STUDIO_SEED_SCHEMA_VERSION),
  modules: z.array(studioSeedEntrySchema).max(10_000),
}).strict();

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
  const rows = await db.select({
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
    modules.push({
      moduleKey: row.moduleKey,
      version: row.version,
      lifecycleStage: row.lifecycleStage,
      public: row.public,
      manifest: parsed.data,
    });
  }

  const payload = seedFilePayload(modules);
  await mkdir(path.dirname(STUDIO_SEED_FILE), { recursive: true });
  const temporaryPath = `${STUDIO_SEED_FILE}.tmp-${process.pid}`;
  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "w" });
  await rename(temporaryPath, STUDIO_SEED_FILE);
  return payload;
}

export async function seedStudioRegistryFromFile(): Promise<{ seeded: number; skipped: boolean }> {
  const [{ registryCount }] = await db.select({ registryCount: count() }).from(studioModuleManifests);
  if (registryCount > 0) return { seeded: 0, skipped: true };

  let seed: StudioSeedFile;
  try {
    seed = await readStudioSeedFile();
  } catch (error) {
    throw new Error(`Studio registry is empty and cannot bootstrap: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (seed.modules.length === 0) return { seeded: 0, skipped: false };
  await db.transaction(async (tx) => {
    for (const entry of seed.modules) {
      const manifest: StudioManifest = {
        ...entry.manifest,
        lifecycleStage: entry.lifecycleStage,
        public: entry.public,
      };
      await tx.insert(studioModuleManifests).values({
        moduleKey: entry.moduleKey,
        version: entry.version,
        lifecycleStage: entry.lifecycleStage,
        isPublic: entry.public,
        manifest,
      }).onConflictDoNothing();
    }
  });
  return { seeded: seed.modules.length, skipped: false };
}