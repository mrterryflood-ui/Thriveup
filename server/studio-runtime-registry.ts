import { and, desc, eq, sql } from "drizzle-orm";
import { studioManifestCacheRevisions, studioModuleManifests } from "@shared/schema";
import { studioManifestSchema, type StudioManifest } from "@shared/studio-manifest";
import { db } from "./storage";

const MAX_ENTRIES = 100;
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { manifest: StudioManifest; version: number; expiresAt: number }>();

async function getSharedRevision(moduleKey: string): Promise<number | undefined> {
  const [row] = await db.select({ version: studioManifestCacheRevisions.version })
    .from(studioManifestCacheRevisions)
    .where(eq(studioManifestCacheRevisions.moduleKey, moduleKey))
    .limit(1);
  return row?.version;
}

export async function getPublishedStudioManifest(moduleKey: string): Promise<StudioManifest | undefined> {
  // Every instance checks the lightweight shared revision before serving its
  // local cache. A publish therefore becomes visible cross-instance immediately
  // after the database commit, rather than waiting for an arbitrary local TTL.
  const sharedVersion = await getSharedRevision(moduleKey);
  const cached = cache.get(moduleKey);
  if (cached && cached.expiresAt > Date.now() && cached.version === sharedVersion) return cached.manifest;
  if (cached) cache.delete(moduleKey);
  const [row] = await db.select({ manifest: studioModuleManifests.manifest, version: studioModuleManifests.version })
    .from(studioModuleManifests)
    .where(and(
      eq(studioModuleManifests.moduleKey, moduleKey),
       eq(studioModuleManifests.lifecycleStage, "published"),
    ))
    .orderBy(desc(studioModuleManifests.version))
    .limit(1);
  if (!row) return undefined;
  const parsed = studioManifestSchema.safeParse(row.manifest);
  if (!parsed.success || parsed.data.lifecycleStage !== "published" || !parsed.data.public) return undefined;
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(moduleKey, { manifest: parsed.data, version: row.version, expiresAt: Date.now() + CACHE_TTL_MS });
  return parsed.data;
}

/** Latest published version for authenticated organization workspaces. */
export async function getPublishedStudioManifestForOrganization(moduleKey: string): Promise<{ manifest: StudioManifest; version: number } | undefined> {
  const [row] = await db.select({ manifest: studioModuleManifests.manifest, version: studioModuleManifests.version })
    .from(studioModuleManifests)
    .where(and(eq(studioModuleManifests.moduleKey, moduleKey), eq(studioModuleManifests.lifecycleStage, "published")))
    .orderBy(desc(studioModuleManifests.version)).limit(1);
  if (!row) return undefined;
  const parsed = studioManifestSchema.safeParse(row.manifest);
  return parsed.success && parsed.data.lifecycleStage === "published"
    ? { manifest: parsed.data, version: row.version } : undefined;
}

export async function invalidateStudioManifest(moduleKey: string, version: number) {
  await db.insert(studioManifestCacheRevisions).values({ moduleKey, version, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: studioManifestCacheRevisions.moduleKey,
      set: { version, updatedAt: new Date() },
    });
  cache.delete(moduleKey);
}