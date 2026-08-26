import { and, desc, eq } from "drizzle-orm";
import { studioModuleManifests } from "@shared/schema";
import { studioManifestSchema, type StudioManifest } from "@shared/studio-manifest";
import { db } from "./storage";

const MAX_ENTRIES = 100;
const cache = new Map<string, StudioManifest>();

export async function getPublishedStudioManifest(moduleKey: string): Promise<StudioManifest | undefined> {
  const cached = cache.get(moduleKey);
  if (cached) return cached;
  const [row] = await db.select({ manifest: studioModuleManifests.manifest })
    .from(studioModuleManifests)
    .where(and(
      eq(studioModuleManifests.moduleKey, moduleKey),
      eq(studioModuleManifests.lifecycleStage, "published"),
      eq(studioModuleManifests.isPublic, true),
    ))
    .orderBy(desc(studioModuleManifests.version))
    .limit(1);
  if (!row) return undefined;
  const parsed = studioManifestSchema.safeParse(row.manifest);
  if (!parsed.success || parsed.data.lifecycleStage !== "published" || !parsed.data.public) return undefined;
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(moduleKey, parsed.data);
  return parsed.data;
}

export function invalidateStudioManifest(moduleKey: string) {
  cache.delete(moduleKey);
}